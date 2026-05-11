# Quick Start Guide

Get up and running in 5 minutes!

## 1. Install Dependencies

```bash
npm install
```

## 2. Get Your API Key

Visit [Google AI Studio](https://makersuite.google.com/app/apikey) and create an API key.

## 3. Start the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 4. Try Each Workflow

### Sequential (2 minutes)
1. Select "Sequential" from dropdown
2. Default agents are already configured
3. Type: **"What are the benefits of electric vehicles?"**
4. Watch agents process sequentially

### Supervisor (2 minutes)
1. Select "Supervisor" from dropdown
2. Keep default agents
3. Type: **"Write a poem about coding"** (routes to creative agent)
4. Then: **"Explain variables in programming"** (routes to technical agent)

### RAG (2 minutes)
1. Select "RAG" from dropdown
2. Click "Choose File" and select `public/sample-document.txt`
3. Type: **"What are the three agent patterns?"**
4. Agent answers based on the document!

## 5. Customize

Edit agent names, descriptions, and models to fit your needs.

## Common Use Cases

| Workflow | Best For | Example |
|----------|----------|---------|
| Sequential | Multi-step processes | Research → Analysis → Writing |
| Supervisor | Task routing | Customer service, specialized queries |
| RAG | Document Q&A | Company policies, technical docs |

## Tips

- **Sequential**: Each agent builds on previous output
- **Supervisor**: First agent routes to others
- **RAG**: Upload .txt, .md, .json, or .csv files
- **Models**: Use Flash for speed, Pro for quality

## Need Help?

See [TUTORIAL.md](./TUTORIAL.md) for detailed explanations.

---

That's it! You're ready to explore AI workflows.
