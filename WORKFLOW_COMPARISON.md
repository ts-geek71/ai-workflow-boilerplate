# AI Workflow Pattern Comparison

## Quick Decision Guide

Use this guide to choose the right workflow pattern for your use case.

## Pattern Overview

| Pattern | Best For | Complexity | Speed |
|---------|----------|------------|-------|
| **Sequential** | Multi-step processes | Medium | Slower (sequential) |
| **Supervisor** | Dynamic task routing | High | Medium |
| **RAG** | Document-based Q&A | Low | Fast |

## Detailed Comparison

### Sequential Workflow

**When to Use:**
- Tasks that naturally break into steps
- Each step builds on the previous one
- Order matters
- Pipeline-style processing

**Examples:**
- Blog post creation: Research → Outline → Write → Edit
- Data processing: Extract → Transform → Analyze → Report
- Customer onboarding: Qualify → Assign → Setup → Notify

**Pros:**
- Easy to understand and debug
- Clear progression of work
- Each agent specializes in one step

**Cons:**
- Can be slow (agents run one after another)
- If one agent fails, the whole chain breaks
- Not suitable for tasks that don't follow a linear path

**Code Pattern:**
```typescript
Agent1(input) → output1
Agent2(output1) → output2
Agent3(output2) → final_result
```

---

### Supervisor Workflow

**When to Use:**
- Different types of requests need different handling
- Want intelligent routing to specialized agents
- Tasks are independent (don't need sequential processing)
- Need flexibility in agent selection

**Examples:**
- Customer service: Route to billing, technical, or sales
- Content moderation: Route by content type (text, image, video)
- Code review: Route by language (Python, JavaScript, Go)

**Pros:**
- Intelligent task distribution
- Specialized agents for specific tasks
- Scalable (easy to add new worker agents)
- Flexible routing logic

**Cons:**
- More complex to set up
- Supervisor quality affects entire system
- Requires clear agent differentiation

**Code Pattern:**
```typescript
Supervisor(input) → analyzes → routes to Agent2 or Agent3
Selected_Agent(input) → final_result
```

---

### RAG (Retrieval Augmented Generation)

**When to Use:**
- Need to answer questions about specific documents
- Want AI grounded in your company's knowledge
- Have policies, manuals, or documentation to query
- Need factual accuracy based on source material

**Examples:**
- Company handbook Q&A
- Technical documentation assistant
- Policy compliance checker
- Research paper analysis

**Pros:**
- Grounded in factual content
- Reduces hallucinations
- Can cite source material
- Updates with new documents

**Cons:**
- Requires document preparation
- Context window limits (large docs need chunking)
- Quality depends on document quality
- File upload overhead

**Code Pattern:**
```typescript
Document → Context
Agent(question + context) → answer_based_on_document
```

## Use Case Matrix

| Scenario | Recommended Pattern | Why |
|----------|-------------------|-----|
| Write a blog post | Sequential | Multi-step content creation |
| Customer support | Supervisor | Route by query type |
| Document Q&A | RAG | Needs specific context |
| Data analysis pipeline | Sequential | Step-by-step transformation |
| Multi-domain chatbot | Supervisor | Different expertise areas |
| Company policy checker | RAG | Needs exact policy text |
| Code generation | Sequential | Spec → Code → Test → Refine |
| Triage system | Supervisor | Route by priority/type |
| Research assistant | RAG | Query research papers |
| Translation workflow | Sequential | Translate → Review → Format |

## Combining Patterns

You can also combine patterns for more sophisticated systems:

### Sequential + RAG
Each agent in the sequence uses RAG for context:
```
Agent1(RAG-context) → Agent2(RAG-context) → Agent3(RAG-context)
```

### Supervisor + Sequential
Supervisor routes to different sequential chains:
```
Supervisor → routes to either:
  - Chain A: Agent1 → Agent2 → Agent3
  - Chain B: Agent4 → Agent5
```

### Supervisor + RAG
Supervisor selects which knowledge base to query:
```
Supervisor → routes to:
  - Agent1 with Technical-Docs
  - Agent2 with HR-Policies
  - Agent3 with Legal-Documents
```

## Performance Considerations

### Latency

**Fastest to Slowest:**
1. RAG (single agent call)
2. Supervisor (2 agent calls)
3. Sequential (N agent calls)

### Cost

**Most to Least Expensive:**
1. Sequential with 3+ agents
2. Supervisor (2 calls minimum)
3. RAG (1 call)

### Accuracy

**Depends on:**
- Sequential: Quality of each agent's contribution
- Supervisor: Routing accuracy + worker quality
- RAG: Document quality + relevance

## Decision Tree

```
Start: What's your main goal?

├─ Process data through multiple steps?
│  └─ Use SEQUENTIAL
│
├─ Route to specialized handlers?
│  └─ Use SUPERVISOR
│
└─ Answer questions about documents?
   └─ Use RAG
```

## Testing Checklist

Before deploying, test each pattern with:

### Sequential
- [ ] Normal input flow
- [ ] Edge case inputs
- [ ] Verify each step's output
- [ ] Test with different agent orders

### Supervisor
- [ ] Multiple query types
- [ ] Verify correct routing
- [ ] Test all worker agents
- [ ] Edge case routing decisions

### RAG
- [ ] Different question types
- [ ] Questions in vs. out of context
- [ ] Multiple documents
- [ ] Long documents

## Common Mistakes

### Sequential
- Making agents too general (should be specialized)
- Too many agents (3-5 is optimal)
- Not passing enough context between steps

### Supervisor
- Unclear worker descriptions (routing fails)
- Too many similar workers (confusion)
- Not testing routing decisions

### RAG
- Documents too large (context limits)
- Poor document structure
- Not preprocessing documents
- Asking questions beyond document scope

## Next Steps

1. Identify your use case
2. Choose the appropriate pattern
3. Configure agents with clear descriptions
4. Test thoroughly
5. Monitor and adjust

See [TUTORIAL.md](./TUTORIAL.md) for hands-on exercises with each pattern.
