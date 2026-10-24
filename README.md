# Tailor Ed

**An epistemic scaffolding agent for learning from what you already know.**

Tailor Ed parses your notes, code, and bookmarks into a personal **mental model graph**. When you want to learn an unfamiliar topic, it traces the shortest conceptual path from what you already master and explains the new concept strictly through customized analogies grounded in your existing knowledge.

## The idea

Most learning tools explain a topic to an average reader. Tailor Ed explains it to *you* — using the concepts, projects, and mental models you have already demonstrated.

1. **Ingest** your personal corpus: notes, source code, bookmarks, and other artifacts.
2. **Extract** the concepts they contain and the relationships between them into a graph.
3. **Estimate mastery** per concept from how you use, revisit, and connect it.
4. **Plan a path** from known concepts to the target concept, preferring the shortest conceptual route.
5. **Explain** the target using analogies anchored in your mastered concepts, not generic textbook metaphors.
6. **Update** the graph as you learn, so future explanations build on the new knowledge.

## Core concepts

| Term | Meaning |
| --- | --- |
| **Mental model graph** | A personal graph of concepts and their relationships, derived from the user's own artifacts. |
| **Concept node** | A single idea, technique, API, pattern, or domain term extracted from the corpus. |
| **Mastery signal** | Evidence that the user understands a concept (usage, repetition, connections, explicit feedback). |
| **Conceptual path** | The shortest chain of known concepts that makes the target concept intelligible. |
| **Grounded analogy** | An explanation that maps the new concept onto something the user already knows, with explicit correspondences. |
| **Epistemic scaffold** | The temporary explanatory structure that bridges existing knowledge to new knowledge. |

## Product principles

- **Ground everything in the user's corpus.** Prefer the user's own projects and notes over generic examples. If a grounded analogy doesn't exist, say so rather than inventing familiarity.
- **Teach the gap, not the whole field.** Start from the learner's frontier and explain only what the path requires.
- **Make the reasoning visible.** Show the traced conceptual path and cite the source artifacts behind each claim.
- **Model uncertainty.** Distinguish *mastered*, *seen*, and *unknown*; never assume mastery from a single mention.
- **Stay private by default.** The corpus is personal; ingestion, storage, and model calls should be explicit and auditable.

## Status

The repository contains a working **dark-mode "Epistemic OS" interface prototype** (bento-grid inspired, Linear/Raycast aesthetic) driven entirely by client-side mock data:

- Mocked auth flow (demo persona "Saumit" / Google button) with the hero morphing into a Knowledge Track Overview.
- Roadmap rail with milestone states (mastered / current / next / locked) tied to live mastery signals.
- Interactive mental model graph: draggable topological canvas, familiarity halos, relationship edge types (`prerequisite_for`, `analogous_to`, `subsystem_of`, `implements`), and shortest-path illumination when bridging.
- Didactic scaffold drawer with the prerequisite interceptor (blocking cards + "Jump to Missing Prerequisite" / "Override & Bridge Anyway") and the Epistemic Bridge (anchor → target, structural mapping, the delta).
- Bottom command bar with Chat / Live Question and Quick Note Ingestion modes plus a simulated Gemini Live voice capture; note ingestion wires new concept nodes into the graph with spawn animations.

**Not implemented yet:** real ingestion, concept extraction, graph persistence, mastery learning, path planning as a service, and LLM-backed explanation generation. All data is seeded demo data (`src/domain/data.ts`).

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router, Turbopack)
- [React 19](https://react.dev)
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS v4](https://tailwindcss.com)
- [pnpm](https://pnpm.io)

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Useful commands:

```bash
pnpm lint    # ESLint
pnpm build   # production build
pnpm start   # serve the production build
```

## Project structure

```text
src/app/                 # App Router entry (thin server wrapper, Epistemic OS shell, API routes)
src/app/api/agentic/     # AgenticOrg API endpoints: extraction, scaffolding, workflows, demo runner
src/components/epistemic/# UI: header, roadmap rail, graph canvas, scaffold drawer, command bar
src/domain/              # domain types + seeded demo corpus (concepts, edges, tracks)
src/lib/agenticorg/      # AgenticOrg SDK client, epistemic adapter, and operation runners
src/lib/                 # graph algorithms (path tracing, prerequisite gates) + API client
src/app/globals.css      # Tailwind v4 theme tokens and motion vocabulary
next.config.ts           # Turbopack + Tailwind configuration
```

## AgenticOrg SDK Integration

Tailor Ed integrates with [`agenticorg-sdk`](https://www.npmjs.com/package/agenticorg-sdk) for epistemic agent execution, procedural note parsing (SOPs), knowledge search, and multi-step learning workflows:

```env
# .env.local
AGENTICORG_API_KEY=your-api-key
AGENTICORG_BASE_URL=https://app.agenticorg.ai
```

Available API endpoints:
- `POST /api/agentic/demo` — Test runner for agent execution, commerce discovery, agent generation, and workflows.
- `POST /api/agentic/extract` — SOP note parsing and knowledge-grounded concept extraction.
- `POST /api/agentic/scaffold` — Grounded analogy generation bridging mastered anchors to frontier targets.
- `POST /api/agentic/workflow` — Epistemic curriculum workflow generation and execution.
- `GET /api/agentic/mcp-a2a` — MCP tools and A2A agent cards for external agent integration.

## Styling

Tailwind CSS v4 is bundled by Turbopack via `@tailwindcss/turbopack`. Global styles and theme tokens live in `src/app/globals.css`.
