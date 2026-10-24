# Tailor Ed — Project Guide

## What we are building

Tailor Ed is an **epistemic scaffolding agent**. It parses a user's notes, code, and bookmarks into a personal **mental model graph**. When the user wants to learn an unfamiliar topic, it traces the shortest conceptual path from what they already master and explains the new concept strictly through customized analogies grounded in their existing knowledge.

The product is not a generic tutor or note-taking app. Its differentiator is **grounding**: explanations must be anchored in the learner's own artifacts, not in generic textbook metaphors.

## Core flow

1. **Ingest** — collect notes, source code, and bookmarks.
2. **Extract** — identify concepts and relationships from those artifacts.
3. **Model mastery** — estimate what the user knows, has seen, or has never encountered.
4. **Plan** — find the shortest conceptual path from mastered concepts to the target concept.
5. **Explain** — generate an explanation built from grounded analogies along that path.
6. **Update** — fold the interaction back into the graph as new mastery evidence.

## Domain vocabulary

Use these terms consistently in code, UI copy, and docs:

- **Mental model graph** — the user's personal graph of concepts and relationships.
- **Concept node** — an idea, technique, API, pattern, or domain term extracted from the corpus.
- **Mastery signal** — evidence that a concept is understood (usage, repetition, connections, explicit feedback).
- **Conceptual path** — the shortest chain of known concepts that makes the target intelligible.
- **Grounded analogy** — a mapping from a new concept onto something already present in the user's corpus, with explicit correspondences.
- **Epistemic scaffold** — the temporary explanatory structure bridging known and new concepts.
- **Corpus / artifact** — a single ingested note, code file, bookmark, or similar source.

## Product invariants

- **Ground explanations in the user's corpus.** Prefer their projects, notes, and terminology over generic examples.
- **Do not fake familiarity.** If no grounded analogy exists, say so instead of inventing one.
- **Teach the gap, not the field.** Start at the learner's frontier and include only what the path needs.
- **Show the path and cite sources.** Explanations should be traceable to artifacts and graph edges.
- **Represent uncertainty.** Keep *mastered*, *seen*, and *unknown* distinct; one mention is not mastery.
- **Privacy by default.** The corpus is personal. Ingestion, storage, and model calls must be explicit and auditable.

## Current status

**Interactive UI prototype with demo data.** The "Epistemic OS" interface (auth hero morph → knowledge tracks → engine split view) is implemented client-side with seeded concepts and animated graph interactions. Real ingestion, concept extraction, graph persistence, mastery learning, path planning as a service, and LLM-backed explanation generation are **not implemented**. All state lives in client components; no auth backend, database, or model calls exist. Do not document or imply that they work.

## Engineering conventions

- **Framework:** Next.js 16 App Router with Turbopack, React 19, TypeScript (strict).
- **Styling:** Tailwind CSS v4 via `@tailwindcss/turbopack`; global tokens in `src/app/globals.css`.
- **Package manager:** pnpm. Do not commit `node_modules`, `.next`, or build output.
- **Imports:** use the `@/*` alias for `src/*`.
- **Commands:** `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm start`.
- **Layout:** UI and routes live under `src/app`. Keep product/domain logic out of route components; place it in dedicated modules under `src/` as it is introduced.

## Working in this repo

- Read the managed Next.js block below before writing framework code; this Next.js version may differ from your training data.
- Preserve the domain vocabulary and product invariants when adding features or docs.
- Update the README's status section when a capability becomes real.
- Prefer small, reviewable commits with clear messages.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
