'use server';

import dotenv from 'dotenv';

dotenv.config();

import { AgentType, Agent } from '@/lib/types';
import { executeWorkflow } from '@/lib/ai-workflows';

export async function runWorkflow(
  agentType: AgentType,
  agents: Agent[],
  message: string,
  ragContent?: string
): Promise<string> {
  const apiKey = process.env['NEXT_PUBLIC_GOOGLE_API_KEY'];
  const openaiApiKey = process.env['NEXT_PUBLIC_OPENAI_API_KEY'];

  return executeWorkflow(
    agentType,
    agents,
    message,
    ragContent,
    apiKey,
    openaiApiKey
  );
}
