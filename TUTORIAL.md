# AI Workflow Tutorial

Welcome to the AI Workflow Boilerplate! This guide will help your team understand how to work with Sequential, Supervisor, and RAG agent patterns.

## Table of Contents

1. [Setup](#setup)
2. [Understanding the Codebase](#understanding-the-codebase)
3. [Workflow Types](#workflow-types)
4. [Hands-On Exercises](#hands-on-exercises)
5. [Customization Guide](#customization-guide)

## Setup

### 1. Get Your Google API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy your key

### 2. Configure the Application

**Option A: Environment Variable (Recommended for production)**
```bash
cp .env.local.example .env.local
# Edit .env.local and add your key
NEXT_PUBLIC_GOOGLE_API_KEY=your_key_here
```

**Option B: In-App Configuration (Quick testing)**
- Simply paste your API key in the "Google API Key" field in the UI

### 3. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Understanding the Codebase

### File Structure

```
├── app/
│   └── page.tsx                 # Main application page (UI & state management)
├── components/
│   ├── agent-config.tsx         # Agent configuration UI
│   ├── chat-interface.tsx       # Chat UI with messages
│   └── file-upload.tsx          # RAG file upload component
├── lib/
│   ├── types.ts                 # TypeScript interfaces
│   └── ai-workflows.ts          # Core workflow logic
└── public/
    └── sample-document.txt      # Sample document for RAG testing
```

### Key Components

#### 1. Types (`lib/types.ts`)
Defines the data structures:
- `AgentType`: 'sequential' | 'supervisor' | 'rag'
- `Agent`: Configuration for each agent (name, description, model)
- `Message`: Chat message structure
- `GEMINI_MODELS`: Available Gemini models

#### 2. Workflow Logic (`lib/ai-workflows.ts`)
Contains the core AI logic:
- `executeWorkflow()`: Routes to the appropriate workflow
- `executeSequentialWorkflow()`: Implements sequential pattern
- `executeSupervisorWorkflow()`: Implements supervisor pattern
- `executeRAGWorkflow()`: Implements RAG pattern
- `callGeminiAPI()`: LangChain integration with Gemini

#### 3. Main Page (`app/page.tsx`)
The main application that:
- Manages state (agents, messages, RAG content)
- Handles user interactions
- Orchestrates the workflow execution

## Workflow Types

### 1. Sequential Workflow

**How It Works:**
```
User Input → Agent 1 → Agent 2 → Agent 3 → Final Response
```

**Code Flow:**
```typescript
// Each agent processes the previous agent's output
for (const agent of agents) {
  const response = await callGeminiAPI(agent.model, currentInput, apiKey);
  currentInput = response; // Output becomes next input
}
```

**Try This:**
1. Select "Sequential" from the Agent Type dropdown
2. Configure agents:
   - Agent 1: "Research Agent" - "Gather key facts"
   - Agent 2: "Analysis Agent" - "Analyze and find patterns"
   - Agent 3: "Writing Agent" - "Create a summary"
3. Ask: "What are the benefits of AI in healthcare?"

**Expected Behavior:**
- Agent 1 researches the topic
- Agent 2 analyzes Agent 1's findings
- Agent 3 writes a polished summary based on Agent 2's analysis

### 2. Supervisor Workflow

**How It Works:**
```
User Input → Supervisor React Agent → Uses Tools → Delegates to Worker Agents → Response
```

**Code Flow:**
```typescript
// Create React agent with worker tools
const supervisorAgent = createReactAgent({
  llm: supervisorLLM,
  tools: workerTools,
  messageModifier: supervisorPrompt,
});

// Execute with tool calling capabilities
const result = await supervisorAgent.invoke({ messages: [new HumanMessage(message)] });
```

**Try This:**
1. Select "Supervisor" from the Agent Type dropdown
2. Configure agents:
   - Agent 1: "Supervisor Agent" - "Analyzes requests and delegates to specialists"
   - Agent 2: "Technical Expert" - "Handle technical questions"
   - Agent 3: "Creative Writer" - "Handle creative writing"
3. Ask: "Write a creative story about a robot"
4. Then ask: "Explain how neural networks work"

**Expected Behavior:**
- Supervisor uses React agent tools to delegate tasks
- Worker agents are called as tools by the supervisor
- You'll see the supervisor's reasoning and tool usage
- Final response includes both delegation logic and worker results

### 3. RAG Workflow

**How It Works:**
```
Upload Document → User Question → Retrieve Relevant Context → AI Response with Context
```

**Code Flow:**
```typescript
// Combine document context with user question
const prompt = `
Context from document: ${ragContent}
User question: ${message}
Answer based on the context.
`;
const response = await callGeminiAPI(agent.model, prompt, apiKey);
```

**Try This:**
1. Select "RAG" from the Agent Type dropdown
2. Upload the sample document (`public/sample-document.txt`)
3. Configure the agent:
   - Agent 1: "Document Expert" - "Answer questions based on documents"
4. Ask: "What are the three agent patterns discussed?"
5. Ask: "What is the supervisor workflow good for?"

**Expected Behavior:**
- Agent uses document content to answer accurately
- Responses are specific to the uploaded document
- Can answer questions it couldn't answer without the document

## Hands-On Exercises

### Exercise 1: Build a Content Pipeline (Sequential)

**Goal:** Create a blog post from a topic

**Setup:**
- Agent 1: "Researcher" - "Research the topic and list key points"
- Agent 2: "Outliner" - "Create a structured outline"
- Agent 3: "Writer" - "Write engaging content"

**Test Prompt:** "Create a blog post about sustainable energy"

**Learning:** How sequential agents build on each other's work

### Exercise 2: Customer Service Router (Supervisor)

**Goal:** Route customer queries appropriately

**Setup:**
- Agent 1: "Customer Service Manager" - "Route to appropriate department"
- Agent 2: "Technical Support" - "Solve technical issues"
- Agent 3: "Billing Specialist" - "Handle payment questions"

**Test Prompts:**
- "My payment didn't go through"
- "The app keeps crashing"
- "I want to upgrade my plan"

**Learning:** How supervisors make intelligent routing decisions

### Exercise 3: Document Q&A System (RAG)

**Goal:** Build a knowledge base system

**Setup:**
- Agent 1: "Knowledge Assistant" - "Expert at answering from documents"
- Upload: Your company handbook or any text document

**Test Prompts:**
- Ask specific questions about the document
- Try questions not in the document (notice the difference)

**Learning:** How RAG grounds AI responses in factual content

## Customization Guide

### Adding New Agent Types

1. **Update Types** (`lib/types.ts`):
```typescript
export type AgentType = 'sequential' | 'supervisor' | 'rag' | 'your-new-type';
```

2. **Implement Workflow** (`lib/ai-workflows.ts`):
```typescript
case 'your-new-type':
  return await executeYourNewWorkflow(agents, message, apiKey);
```

3. **Add to UI** (`app/page.tsx`):
```typescript
<SelectItem value="your-new-type">Your New Type</SelectItem>
```

### Customizing Agent Behavior

**Modify System Prompts:**
```typescript
// In ai-workflows.ts
const prompt = `You are ${agent.name}. ${agent.description}
Additional instructions:
- Use a professional tone
- Cite sources when possible
- Keep responses concise
Task: ${message}`;
```

**Adjust Temperature:**
```typescript
const llm = new ChatGoogleGenerativeAI({
  model: model,
  apiKey: apiKey,
  temperature: 0.2, // Lower = more focused, Higher = more creative
});
```

### Adding More Models

Edit `lib/types.ts`:
```typescript
export const GEMINI_MODELS = [
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
  { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
  { value: 'gemini-1.0-pro', label: 'Gemini 1.0 Pro' },
  { value: 'your-model', label: 'Your Model Name' },
];
```

## Advanced Topics

### Parallel Agent Execution

Modify the sequential workflow to run agents in parallel:

```typescript
// Instead of sequential
const responses = await Promise.all(
  agents.map(agent =>
    callGeminiAPI(agent.model, message, apiKey)
  )
);
```

### Agent Memory

Add conversation history:

```typescript
const conversationHistory = messages
  .map(m => `${m.role}: ${m.content}`)
  .join('\n');

const prompt = `${conversationHistory}\n\nUser: ${message}`;
```

### Error Handling & Retries

Implement retry logic:

```typescript
async function callWithRetry(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

## Troubleshooting

### API Key Issues
- Ensure key starts with "AIza..."
- Check it's enabled in Google Cloud Console
- Verify no rate limiting

### Model Errors
- Some models may not be available in your region
- Try switching to `gemini-1.5-flash` (most reliable)

### Build Errors
```bash
npm run build
```
If you see TypeScript errors, check that all imports are correct.

## Next Steps

1. **Experiment** with different agent configurations
2. **Test** all three workflow types thoroughly
3. **Customize** the prompts for your specific use case
4. **Extend** by adding new workflow patterns
5. **Deploy** to production when ready

## Resources

- [LangChain Documentation](https://js.langchain.com/docs/)
- [Google AI Documentation](https://ai.google.dev/docs)
- [Next.js Documentation](https://nextjs.org/docs)

## Support

For questions or issues:
1. Check this tutorial
2. Review the code comments
3. Consult the README.md
4. Reach out to your team lead

Happy coding!
