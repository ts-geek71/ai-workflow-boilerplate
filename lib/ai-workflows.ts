import { Agent, AgentType, type LLMProvider } from './types';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatOpenAI } from '@langchain/openai';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { createSupervisor } from '@langchain/langgraph-supervisor';
import {
  StateGraph,
  Annotation,
  START,
  END,
} from '@langchain/langgraph';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { RunnableConfig } from '@langchain/core/runnables';

const LOG_PREFIX = '[AI-WORKFLOW]';
const DEFAULT_RECURSION_LIMIT = 25;

function log(phase: string, message: string, meta?: Record<string, unknown>) {
  const payload = meta ? ` ${JSON.stringify(meta)}` : '';
  console.log(`${LOG_PREFIX} [${phase}] ${message}${payload}`);
}

// ─── Graph state for sequential workflow ─────────────────────────────────────
const SequentialState = Annotation.Root({
  input: Annotation<string>(),
  /** Per-agent outputs: agentId -> response text */
  blockOutputs: Annotation<Record<string, string>>({
    reducer: (cur, upd) => ({ ...(cur || {}), ...(upd || {}) }),
    default: () => ({}),
  }),
});

type SequentialStateType = (typeof SequentialState)['State'];

/**
 * Main workflow executor - routes to the appropriate workflow type.
 * Entry point for all AI agent workflows (graph-based sequential, supervisor ReAct, RAG).
 * When ragContent is provided (e.g. from chat attachment or RAG upload), it is used as context where applicable.
 */
export async function executeWorkflow(
  agentType: AgentType,
  agents: Agent[],
  message: string,
  ragContent?: string,
  apiKey?: string,
  openaiApiKey?: string
): Promise<string> {
  log('entry', 'executeWorkflow called', {
    agentType,
    agentCount: agents.length,
    hasRagContent: !!ragContent,
    messageLength: message?.length,
  });

  const needsGoogle = agents.some((a) => (a.provider ?? 'google') === 'google');
  const needsOpenAI = agents.some((a) => a.provider === 'openai');
  if (needsGoogle && !apiKey) {
    log('entry', 'Missing Google API key');
    return 'Please set your Google API key (or NEXT_PUBLIC_GOOGLE_API_KEY) when using Gemini models.';
  }

  if (needsOpenAI && !openaiApiKey) {
    log('entry', 'Missing OpenAI API key');
    return 'Please set OPENAI_API_KEY or NEXT_PUBLIC_OPENAI_API_KEY in .env or .env.local (project root) and restart the dev server (npm run dev).';
  }

  try {
    switch (agentType) {
      case 'sequential':
        log('route', 'Running sequential workflow');
        return await executeSequentialWorkflow(agents, message, apiKey ?? '', openaiApiKey, ragContent);
      case 'supervisor':
        log('route', 'Running supervisor workflow');
        return await executeSupervisorWorkflow(agents, message, apiKey ?? '', openaiApiKey, ragContent);
      case 'rag':
        log('route', 'Running RAG workflow');
        return await executeRAGWorkflow(agents, message, ragContent, apiKey ?? '', openaiApiKey);
      default:
        log('route', 'Unknown agent type', { agentType });
        return 'Unknown agent type';
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    log('error', 'executeWorkflow failed', { error: errMsg });
    console.error(`${LOG_PREFIX} [error]`, error);
    return `Error: ${errMsg}`;
  }
}

/**
 * SEQUENTIAL WORKFLOW (LangGraph StateGraph)
 * Agents are graph nodes; each agent's output becomes the next agent's input.
 * Flow: START → agent_1 → agent_2 → … → END.
 */
async function executeSequentialWorkflow(
  agents: Agent[],
  message: string,
  apiKey: string,
  openaiApiKey: string | undefined,
  ragContent?: string
): Promise<string> {
  log('sequential', 'Building graph', { nodeCount: agents.length });

  const graph = new StateGraph(SequentialState);

  agents.forEach((agent, index) => {
    const nodeId = `agent_${agent.id}`;

    graph.addNode(nodeId, async (state: SequentialStateType) => {
      log('sequential.node.enter', `Node ${index + 1}/${agents.length}: ${agent.name}`, {
        nodeId,
        model: agent.model,
        hasRag: !!agent.ragContent,
      });

      const previousOutput =
        index === 0
          ? state.input
          : (state.blockOutputs?.[agents[index - 1].id] as string) || state.input;

      const blockContext =
        agent.ragContent
          ? `Context from this block's uploaded file:\n${agent.ragContent.slice(0, 15000)}\n\n`
          : '';
      const chatContext =
        index === 0 && ragContent
          ? `Context from chat attachment:\n${ragContent.slice(0, 15000)}\n\n`
          : '';
      const prompt = `${blockContext}${chatContext}${agent.name}. ${agent.description}\n\nInput: ${previousOutput}`;

      const response = await callLLM(agent, prompt, apiKey, openaiApiKey);

      log('sequential.node.done', `Node ${index + 1}/${agents.length}: ${agent.name}`, {
        nodeId,
        responseLength: response?.length,
      });

      return {
        blockOutputs: { [agent.id]: response },
      };
    });
  });

  const firstId = `agent_${agents[0].id}`;
  const lastId = `agent_${agents[agents.length - 1].id}`;

  graph.addEdge(START, firstId as typeof END);
  for (let i = 0; i < agents.length - 1; i++) {
    graph.addEdge(
      `agent_${agents[i].id}` as typeof START,
      `agent_${agents[i + 1].id}` as typeof END
    );
  }
  graph.addEdge(lastId as typeof START, END);

  const compiled = graph.compile();
  log('sequential', 'Graph compiled, invoking', { firstId, lastId });

  const config: RunnableConfig = { recursionLimit: DEFAULT_RECURSION_LIMIT };
  const result = await compiled.invoke(
    { input: message, blockOutputs: {} },
    config
  );

  log('sequential', 'Graph invoke done', { hasBlockOutputs: !!result?.blockOutputs });

  const outputs = result?.blockOutputs as Record<string, string> | undefined;
  if (!outputs) {
    log('sequential', 'No blockOutputs in result');
    return '';
  }

  return agents
    .map((a) => `**${a.name}:**\n${outputs[a.id] ?? ''}`)
    .filter(Boolean)
    .join('\n\n');
}

/**
 * SUPERVISOR WORKFLOW (ReAct agent with worker tools)
 * Supervisor is a LangGraph ReAct agent; worker agents are tools it can call.
 * Flow: user message → supervisor (ReAct) → optional tool calls to workers → final response.
 */
async function executeSupervisorWorkflow(
  agents: Agent[],
  message: string,
  apiKey: string,
  openaiApiKey: string | undefined,
  ragContent?: string
): Promise<string> {
  log('supervisor', 'Starting', {
    supervisor: agents[0]?.name,
    workerCount: agents.length - 1,
    supervisorModel: agents[0]?.model,
  });

  const [supervisorConfig, ...workerConfigs] = agents;
  const supervisorContext = supervisorConfig.ragContent
    ? `Context from supervisor's uploaded file:\n${supervisorConfig.ragContent.slice(0, 15000)}\n\n`
    : '';
  const chatContext = ragContent
    ? `Context from chat attachment:\n${ragContent.slice(0, 15000)}\n\n`
    : '';
  const userMessage = `${supervisorContext}${chatContext}User message: ${message}`;

  const supervisorLLM = createLLM(supervisorConfig, apiKey, openaiApiKey, 0.3);

  const supervisorPrompt = `${supervisorConfig.name}. ${supervisorConfig.description}`;

  const blockAgents = workerConfigs.map((workerConfig) => {
    const workerContext = workerConfig.ragContent
      ? `Context from this worker's uploaded file:\n${workerConfig.ragContent.slice(0, 15000)}\n\n`
      : '';
    const workerSystemPrompt = `${workerContext}${workerConfig.name}. ${workerConfig.description}`;
    const workerLLM = createLLM(workerConfig, apiKey, openaiApiKey, 0.7);
    const handoffName = workerConfig.name.replace(/\s+/g, '_').toLowerCase();
    return createReactAgent({
      llm: workerLLM,
      tools: [],
      name: handoffName,
      prompt: workerSystemPrompt,
    });
  });

  try {
    log('supervisor', 'Creating supervisor graph and invoking');
    const workflow = createSupervisor({
      agents: blockAgents,
      llm: supervisorLLM,
      prompt: supervisorPrompt,
      addHandoffBackMessages: true,
      outputMode: 'full_history',
    });
    const app = workflow.compile();
    const config: RunnableConfig = {
      configurable: { thread_id: `supervisor-${Date.now()}` },
      recursionLimit: DEFAULT_RECURSION_LIMIT,
    };
    const result = await app.invoke(
      { messages: [new HumanMessage(userMessage)] },
      config
    );

    log('supervisor', 'Invoke done', { messageCount: result?.messages?.length });

    const messages = result?.messages ?? [];
    const finalMessage = messages[messages.length - 1];
    const content =
      finalMessage instanceof AIMessage
        ? (finalMessage.content as string) ?? ''
        : String(finalMessage?.content ?? '');

    return `**Supervisor Workflow Results:**\n\n${content}`;
  } catch (error) {
    log('supervisor', 'createSupervisor failed, using fallback', {
      error: error instanceof Error ? error.message : String(error),
    });
    console.error(`${LOG_PREFIX} [supervisor] error`, error);
    return await executeSupervisorFallback(agents, userMessage, apiKey, openaiApiKey);
  }
}

/**
 * Fallback when supervisor ReAct agent fails (e.g. model limits).
 */
async function executeSupervisorFallback(
  agents: Agent[],
  message: string,
  apiKey: string,
  openaiApiKey: string | undefined
): Promise<string> {
  log('supervisor.fallback', 'Starting fallback (routing + single worker)');

  const [supervisor, ...workers] = agents;

  const supervisorPrompt = `${supervisor.name}. ${supervisor.description}

Available workers:
${workers.map((w, i) => `${i + 1}. ${w.name}: ${w.description}`).join('\n')}

User request: ${message}`;

  log('supervisor.fallback', 'Calling supervisor for routing', { model: supervisor.model });
  const routing = await callLLM(supervisor, supervisorPrompt, apiKey, openaiApiKey);

  const workerIndex = workers.findIndex((w) =>
    routing.toLowerCase().includes(w.name.toLowerCase())
  );
  const selectedWorker = workerIndex >= 0 ? workers[workerIndex] : workers[0];
  log('supervisor.fallback', 'Calling selected worker', {
    worker: selectedWorker.name,
    model: selectedWorker.model,
  });

  const workerResponse = await callLLM(
    selectedWorker,
    `${selectedWorker.name}. ${selectedWorker.description}\n\nTask: ${message}`,
    apiKey,
    openaiApiKey
  );

  log('supervisor.fallback', 'Fallback done');
  return `**Supervisor (${supervisor.name}) - Fallback Mode:**\n${routing}\n\n**Worker (${selectedWorker.name}):**\n${workerResponse}`;
}

/**
 * RAG WORKFLOW (Retrieval Augmented Generation)
 * Uses uploaded/attached document content as context for the first agent.
 */
async function executeRAGWorkflow(
  agents: Agent[],
  message: string,
  chatRagContent: string | undefined,
  apiKey: string,
  openaiApiKey: string | undefined
): Promise<string> {
  log('rag', 'Starting', { agent: agents[0]?.name, model: agents[0]?.model });

  const agent = agents[0];
  const ragContent = agent.ragContent ?? chatRagContent;

  if (!ragContent) {
    log('rag', 'No RAG content');
    return 'No RAG content available. Upload a context file for this agent (block file upload) or attach one in the chat.';
  }

  const prompt = `${agent.name}. ${agent.description}

Context from uploaded document:
${ragContent}

User question: ${message}`;

  const response = await callLLM(agent, prompt, apiKey, openaiApiKey);
  log('rag', 'Done', { responseLength: response?.length });

  return `**${agent.name} (with RAG):**\n${response}`;
}

/**
 * Create LLM instance for an agent (Google or OpenAI). Used by supervisor ReAct agent.
 */
function createLLM(
  agent: Agent,
  apiKey: string,
  openaiApiKey: string | undefined,
  temperature = 0.7
): InstanceType<typeof ChatGoogleGenerativeAI> | InstanceType<typeof ChatOpenAI> {
  const provider: LLMProvider = agent.provider ?? 'google';
  if (provider === 'openai') {
    const key =
      openaiApiKey ||
      process.env['NEXT_PUBLIC_OPENAI_API_KEY'];
    if (!key || key === 'false') {
      throw new Error(
        'OpenAI API key required. Set OPENAI_API_KEY in .env or .env.local (project root) and restart the dev server.'
      );
    }
    return new ChatOpenAI({
      model: agent.model,
      apiKey: key,
      temperature,
    });
  }
  const googleKey =
    apiKey ||
    process.env['GOOGLE_API_KEY'] ||
    process.env['NEXT_PUBLIC_GOOGLE_API_KEY'];
  if (!googleKey || googleKey === 'false') {
    throw new Error('Google API key required for Gemini models. Set GOOGLE_API_KEY or NEXT_PUBLIC_GOOGLE_API_KEY in .env and restart the dev server.');
  }
  return new ChatGoogleGenerativeAI({
    model: agent.model,
    apiKey: googleKey,
    temperature,
  });
}

/**
 * Single LLM call (Google Gemini or OpenAI). Used by sequential nodes, RAG, and supervisor workers.
 */
async function callLLM(
  agent: Agent,
  prompt: string,
  apiKey: string,
  openaiApiKey: string | undefined
): Promise<string> {
  const provider: LLMProvider = agent.provider ?? 'google';
  const model = agent.model;
  log('llm', 'Calling API', { provider, model, promptLength: prompt?.length, apiKey, openaiApiKey });

  try {
    const llm = createLLM(agent, apiKey, openaiApiKey, 0.7);
    const response = await (llm as { invoke: (x: string) => Promise<{ content: string }> }).invoke(prompt);
    const content = typeof response.content === 'string' ? response.content : String(response.content ?? '');
    log('llm', 'API success', { provider, model, contentLength: content?.length });
    return content;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    const is429 =
      (error as { status?: number })?.status === 429 ||
      /429|Too Many Requests|quota|rate limit/i.test(msg);

    if (is429) {
      log('llm', 'Quota/rate limit (429)', { provider, model });
      console.error(`${LOG_PREFIX} [llm] 429/quota`, error);
      throw new Error(
        `Rate limit or quota exceeded for ${provider} model "${model}". Try another model or wait and retry. Details: ${msg}`
      );
    }

    log('llm', 'API failed', { provider, model, error: msg });
    console.error(`${LOG_PREFIX} [llm]`, error);
    throw new Error(`API call failed: ${msg}`);
  }
}
