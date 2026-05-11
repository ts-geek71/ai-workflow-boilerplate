'use client';

import { useState, useRef, useEffect } from 'react';
import { Message, ChatAttachment } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Bot, User, Paperclip, X } from 'lucide-react';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string, attachment?: ChatAttachment | null) => void;
  isProcessing: boolean;
}

const ACCEPTED_FILE_TYPES = '.txt,.md,.json,.csv,.html,.xml';

export function ChatInterface({
  messages,
  onSendMessage,
  isProcessing,
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState<{ file: File; content: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const content = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string) || '');
      reader.onerror = reject;
      reader.readAsText(file);
    });
    setAttachment({ file, content });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const clearAttachment = () => setAttachment(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !attachment) return;
    if (isProcessing) return;

    const messageText = input.trim() || '(No message text)';
    let chatAttachment: ChatAttachment | null = null;

    if (attachment) {
      try {
        const formData = new FormData();
        formData.set('file', attachment.file);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!res.ok) throw new Error('Upload failed');
        const { path: uploadPath, fileName } = await res.json();
        chatAttachment = { path: uploadPath, fileName, content: attachment.content };
        clearAttachment();
      } catch (err) {
        console.error(err);
        chatAttachment = {
          path: '',
          fileName: attachment.file.name,
          content: attachment.content,
        };
        clearAttachment();
      }
    }

    onSendMessage(messageText, chatAttachment);
    setInput('');
  };

  return (
    <Card className="flex flex-col h-full min-h-0">
      <CardHeader className="border-b flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          Chat Interface
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 min-h-0 overflow-hidden">
        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4"
        >
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No messages yet. Start a conversation!
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                  <div
                    className={`rounded-lg px-4 py-2 max-w-[80%] ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </div>
                    {message.attachmentName && (
                      <div className="text-xs opacity-80 mt-1 flex items-center gap-1">
                        <Paperclip className="h-3 w-3" />
                        {message.attachmentName}
                      </div>
                    )}
                    <div className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                  {message.role === 'user' && (
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                        <User className="h-4 w-4" />
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
            {isProcessing && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary-foreground animate-pulse" />
                  </div>
                </div>
                <div className="rounded-lg px-4 py-2 bg-muted">
                  <div className="text-sm">Processing...</div>
                </div>
              </div>
            )}
          </div>
        </div>
        <form onSubmit={handleSubmit} className="flex-shrink-0 p-4 border-t">
          {attachment && (
            <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground bg-muted rounded-md px-3 py-2">
              <Paperclip className="h-4 w-4 flex-shrink-0" />
              <span className="truncate flex-1">{attachment.file.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={clearAttachment}
                disabled={isProcessing}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_FILE_TYPES}
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              title="Attach file"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={isProcessing}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={isProcessing || (!input.trim() && !attachment)}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
