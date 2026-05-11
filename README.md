# AI Workflow Boilerplate

A comprehensive Next.js boilerplate for learning and implementing AI agent workflows using LangChain and Google's Gemini models.

## Features

### Three Agent Workflow Types

1. **Sequential Workflow**: Agents process tasks in sequence, with each agent's output becoming the next agent's input
2. **Supervisor Workflow**: A supervisor agent analyzes the request and routes it to the most appropriate worker agent
3. **RAG (Retrieval Augmented Generation)**: Upload documents and query them using AI agents with context awareness

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Google API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file (optional):
```bash
cp .env.local.example .env.local
```

3. Add your Google API key to `.env.local` or enter it directly in the UI:
```
NEXT_PUBLIC_GOOGLE_API_KEY=your_api_key_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## How It Works

### Sequential Workflow
- Each agent processes the message in order
- Agent 1's output → Agent 2's input → Agent 3's input
- Perfect for multi-step processes like research → analysis → writing

### Supervisor Workflow
- A supervisor React agent with tools that can delegate to specialized worker agents using LangChain's createReactAgent
- Analyzes the request and routes to the best worker agent
- Ideal for task delegation and specialized agents

### RAG Workflow
- Upload a text file (.txt, .md, .json, .csv)
- The AI agent uses the file content as context
- Ask questions about the uploaded document
- Great for document analysis and Q&A

## Architecture

```
app/
  page.tsx              # Main application page
components/
  agent-config.tsx      # Agent configuration component
  chat-interface.tsx    # Chat UI component
  file-upload.tsx       # RAG file upload component
lib/
  types.ts             # TypeScript interfaces
  ai-workflows.ts      # Workflow execution logic
```

## Configuration

Each agent can be customized with:
- **Name**: Identifier for the agent
- **Description**: Role and capabilities
- **Model**: Choice of Gemini models (Pro, Flash, or 1.0 Pro)

## Usage Tips

1. Start with the Sequential workflow to understand basic agent chaining
2. Try Supervisor mode to see intelligent routing in action
3. Upload a document in RAG mode to query its contents
4. Experiment with different agent descriptions to see how they affect responses
5. Use different Gemini models for different tasks (Flash for speed, Pro for quality)

## Tech Stack

- Next.js 13+ with App Router
- LangChain for AI orchestration
- Google Generative AI (Gemini)
- Tailwind CSS for styling
- shadcn/ui components
- TypeScript for type safety

## License

MIT
