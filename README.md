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

This repository is currently the **application scaffold only**. It contains a Next.js + Tailwind CSS starting point; ingestion, concept extraction, the graph store, path planning, and explanation generation are not implemented yet.

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
src/app/layout.tsx     # root layout and fonts
src/app/page.tsx       # starter page
src/app/globals.css    # Tailwind import and theme tokens
next.config.ts         # Turbopack + Tailwind configuration
```

## Styling

Tailwind CSS v4 is bundled by Turbopack via `@tailwindcss/turbopack`. Global styles and theme tokens live in `src/app/globals.css`.
