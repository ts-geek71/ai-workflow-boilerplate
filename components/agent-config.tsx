'use client';

import { useRef } from 'react';
import { Agent, GEMINI_MODELS, OPENAI_MODELS, type LLMProvider } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, X } from 'lucide-react';

const ACCEPTED_RAG_FILES = '.txt,.md,.json,.csv,.html,.xml';

interface AgentConfigProps {
  agent: Agent;
  index: number;
  onUpdate: (id: string, field: keyof Agent, value: string) => void;
  onUpdateRag?: (id: string, content: string, fileName: string) => void;
}

const MODEL_OPTIONS: Record<LLMProvider, { value: string; label: string }[]> = {
  google: GEMINI_MODELS,
  openai: OPENAI_MODELS,
};

export function AgentConfig({ agent, index, onUpdate, onUpdateRag }: AgentConfigProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const provider: LLMProvider = agent.provider ?? 'google';
  const models = MODEL_OPTIONS[provider];
  const modelValue = models.some((m) => m.value === agent.model) ? agent.model : models[0]?.value ?? '';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const content = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string) || '');
      reader.onerror = reject;
      reader.readAsText(file);
    });
    if (onUpdateRag) {
      onUpdateRag(agent.id, content, file.name);
    } else {
      onUpdate(agent.id, 'ragContent', content);
      onUpdate(agent.id, 'ragFileName', file.name);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const clearRag = () => {
    if (onUpdateRag) {
      onUpdateRag(agent.id, '', '');
    } else {
      onUpdate(agent.id, 'ragContent', '');
      onUpdate(agent.id, 'ragFileName', '');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">
          Agent {index + 1}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`name-${agent.id}`}>Name</Label>
          <Input
            id={`name-${agent.id}`}
            value={agent.name}
            onChange={(e) => onUpdate(agent.id, 'name', e.target.value)}
            placeholder="e.g., Research Agent"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`description-${agent.id}`}>Description</Label>
          <Textarea
            id={`description-${agent.id}`}
            value={agent.description}
            onChange={(e) => onUpdate(agent.id, 'description', e.target.value)}
            placeholder="Describe the agent's role and capabilities"
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`provider-${agent.id}`}>Provider</Label>
          <Select
            value={provider}
            onValueChange={(value: LLMProvider) => {
              onUpdate(agent.id, 'provider', value);
              const nextModels = MODEL_OPTIONS[value];
              if (nextModels?.length) onUpdate(agent.id, 'model', nextModels[0].value);
            }}
          >
            <SelectTrigger id={`provider-${agent.id}`}>
              <SelectValue placeholder="Provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="google">Google (Gemini)</SelectItem>
              <SelectItem value="openai">OpenAI (GPT)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`model-${agent.id}`}>Model</Label>
          <Select
            value={modelValue}
            onValueChange={(value) => onUpdate(agent.id, 'model', value)}
          >
            <SelectTrigger id={`model-${agent.id}`}>
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              {models.map((model) => (
                <SelectItem key={model.value} value={model.value}>
                  {model.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Context file (RAG) for this agent</Label>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_RAG_FILES}
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              {agent.ragFileName || 'Upload file'}
            </Button>
            {agent.ragFileName && (
              <Button type="button" variant="ghost" size="icon" onClick={clearRag} title="Clear file">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {agent.ragFileName && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileText className="h-3 w-3" />
              <span className="truncate">{agent.ragFileName}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
