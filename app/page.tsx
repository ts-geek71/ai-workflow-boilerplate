'use client';

import { useState } from 'react';
import { AgentType, Agent, Message, ChatAttachment, DEFAULT_GEMINI_MODEL } from '@/lib/types';
import { runWorkflow } from '@/app/actions';
import { AgentConfig } from '@/components/agent-config';
import { ChatInterface } from '@/components/chat-interface';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Settings, MessageSquare } from 'lucide-react';

export default function Home() {
  const [agentType, setAgentType] = useState<AgentType>('sequential');
  const [agents, setAgents] = useState<Agent[]>([
    {
      id: '1',
      name: 'Supervisor Agent',
      description: 'Analyzes requests and delegates to appropriate specialist agents',
      model: DEFAULT_GEMINI_MODEL,
      provider: 'google',
    },
    {
      id: '2',
      name: 'Technical Expert',
      description: 'Handles technical questions, programming, and system-related queries',
      model: DEFAULT_GEMINI_MODEL,
      provider: 'google',
    },
    {
      id: '3',
      name: 'Creative Writer',
      description: 'Handles creative writing, storytelling, and content creation tasks',
      model: DEFAULT_GEMINI_MODEL,
      provider: 'google',
    },
  ]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const updateAgent = (id: string, field: keyof Agent, value: string) => {
    setAgents((prev) =>
      prev.map((agent) =>
        agent.id === id ? { ...agent, [field]: value } : agent
      )
    );
  };

  const updateAgentRag = (id: string, content: string, fileName: string) => {
    setAgents((prev) =>
      prev.map((agent) =>
        agent.id === id
          ? { ...agent, ragContent: content || undefined, ragFileName: fileName || undefined }
          : agent
      )
    );
  };

  const handleSendMessage = async (content: string, attachment?: ChatAttachment | null) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
      ...(attachment && {
        attachmentPath: attachment.path,
        attachmentName: attachment.fileName,
      }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      const response = await runWorkflow(
        agentType,
        agents,
        content,
        attachment?.content
      );

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const getAgentTypeDescription = (type: AgentType) => {
    switch (type) {
      case 'sequential':
        return 'Agents work in sequence, passing output to the next agent';
      case 'supervisor':
        return 'A supervisor React agent with tools that delegates to specialized worker agents';
      case 'rag':
        return 'Retrieval Augmented Generation using uploaded documents';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold">AI Workflow Boilerplate</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Learn Sequential, Supervisor, and RAG agent patterns
          </p>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-140px)]">
          <div className="space-y-6 overflow-y-auto pr-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Workflow Configuration
                </CardTitle>
                <CardDescription>
                  Configure your AI agent workflow
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="agent-type">Agent Type</Label>
                  <Select
                    value={agentType}
                    onValueChange={(value) => setAgentType(value as AgentType)}
                  >
                    <SelectTrigger id="agent-type">
                      <SelectValue placeholder="Select agent type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sequential">Sequential</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="rag">RAG</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {getAgentTypeDescription(agentType)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {agents.map((agent, index) => (
                <AgentConfig
                  key={agent.id}
                  agent={agent}
                  index={index}
                  onUpdate={updateAgent}
                  onUpdateRag={updateAgentRag}
                />
              ))}
            </div>
          </div>

          <div className="h-full min-h-0 overflow-hidden flex flex-col">
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              isProcessing={isProcessing}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
