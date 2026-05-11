export type AgentType = 'sequential' | 'supervisor' | 'rag';

export type LLMProvider = 'google' | 'openai';

export interface Agent {
  id: string;
  name: string;
  description: string;
  model: string;
  /** Which LLM to use for this agent. */
  provider?: LLMProvider;
  /** RAG context for this agent only (from block file upload). */
  ragContent?: string;
  /** File name for display when ragContent is set. */
  ragFileName?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  agentId?: string;
  /** Path to uploaded file in public/uploads (e.g. /uploads/xxx.txt) */
  attachmentPath?: string;
  /** Original file name for display */
  attachmentName?: string;
}

/** Optional attachment when sending a message */
export interface ChatAttachment {
  path: string;
  fileName: string;
  content: string;
}

export interface WorkflowConfig {
  agentType: AgentType;
  agents: Agent[];
  ragFile?: File;
  ragContent?: string;
}

/** Default model: has free-tier quota. Use this for initial agents to avoid 429. */
export const DEFAULT_GEMINI_MODEL = 'gemini-2.0-flash';
export const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';

/** Current Gemini model IDs (Google AI Studio). */
export const GEMINI_MODELS = [
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (recommended)' },
  { value: 'gemini-1.5-flash-8b', label: 'Gemini 1.5 Flash 8B' },
  { value: 'gemini-2.5-flash-preview-05-20', label: 'Gemini 2.5 Flash' },
  { value: 'gemini-2.5-pro-preview-05-06', label: 'Gemini 2.5 Pro' },
  { value: 'gemini-3-pro-preview', label: 'Gemini 3 Pro' },
  { value: 'gemini-3-flash-preview', label: 'Gemini 3 Flash' },
  { value: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro' },
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
];

/** OpenAI model IDs. */
export const OPENAI_MODELS = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-n', label: 'GPT-4o N' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { value: 'gpt-4', label: 'GPT-4' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
];
