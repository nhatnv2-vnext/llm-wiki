# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A **3-layer knowledge vault** (LLM Wiki) that turns source code + design docs into a linked, AI-maintained Obsidian wiki, served via a Next.js RAG web app. It is **not** an application codebase — the vault stores *knowledge about other projects*, whose source lives outside the vault and is referenced by `local_path` in JSON catalogs.

The 3 layers (boundaries are enforced — see "Layer rules"):

| Layer | Dir | AI access | Purpose |
|-------|-----|-----------|---------|
| 1 — Raw | `01_Raw/` | **READ-ONLY** | Source-of-truth catalogs (`projects.json`, `Screens.json`, `Features.json`, `schemas.json`) + Google Drive PRDs |
| 2 — Wiki | `02_Wiki/` | READ + WRITE | Compiled knowledge as Markdown, cross-linked with `[[wikilinks]]` |
| 3 — System | `apps/System/` | READ + WRITE | Automation scripts (the skills' executable backend) |

`apps/web/` is the Next.js RAG site that renders `02_Wiki/` and answers questions over it. `apps/mcp/` is a **read-only MCP server** (stdio + Streamable HTTP) exposing the vault to external AI agents — 6 tools: get_vault_overview, list_wiki, read_page, search_wiki, grep_wiki, get_related. It deliberately duplicates ~150 lines of apps/web's RAG logic (the libs there are `server-only`); keep `apps/mcp/src/config.ts` constants in sync with `apps/web/lib/config.ts` (table name, embedding dim/model, distance threshold). Run: `pnpm mcp` (stdio, registered in `.mcp.json`), `pnpm mcp:http` / `docker compose up mcp` (HTTP :3001). See `apps/mcp/README.md`.

## Layer rules (critical)

- **Never edit `01_Raw/`** except updating `last_synced` metadata in `Screens.json` per the spec-screen flow. If code/docs are wrong, log it to `02_Wiki/07_Tasks_&_Logs/Conflict_Reports.md` instead of "fixing" anything.
- **Code is the single source of truth.** The wiki is a contextual *translation* of code, never a copy. If info isn't in source, write `> ⚠️ Chưa xác định từ source` rather than inventing it.
- **Mandatory archiving before overwrite:** when updating an existing `.md` in `02_Wiki/`, first copy the old file to `02_Wiki/_Archive/<subdir>/<name>_v<YYYYMMDD_HHMMSS>.md`, *then* write new content. Never overwrite in place.
- The vault stores no source code directly — skills read `local_path` from `01_Raw/codebase/projects.json` to reach it.

The full operating contract lives in `apps/System/CLAUDE.md` — read it before doing vault work. The same rules are mirrored in `.cursorrules` / `.clauderules`.

## How work gets done: Skills, not manual editing

The intended workflow is via the 13 slash-command skills in `.claude/skills/` (e.g. `/add-project`, `/scan-project`, `/plan-wiki`, `/spec-feature`, `/spec-screen`, `/spec-database`, `/spec-architecture`, `/spec-business`, `/cross-link`, `/ask-vault`, `/log-adr`, `/log-conflict`). Each skill's `SKILL.md` is the spec; many shell out to the `npm run` scripts below. The standard pipeline for a new project: `/add-project` → (build CodeGraph) → `/scan-project` → `/plan-wiki` → `/spec-*` → `/cross-link`.

Skills prefer **CodeGraph MCP** (`mcp__codegraph__*`) for code traversal (caller/callee, impact analysis) and fall back to Read/Grep when no index exists.

## Common commands

This is a pnpm + Turborepo monorepo (`apps/*`). Node ≥ 20.

**Web app (`apps/web`, the RAG site):**
```bash
turbo run dev            # from root — next dev on :3000
npm run build-index      # incremental RAG ingest: embed 02_Wiki/ → LanceDB
npm run build-index -- --force   # full re-index
npm run view-index       # inspect built index
cd apps/web && npm run lint      # eslint (run a single workspace's lint)
```

**System automation (run from `apps/System/`):**
```bash
npm run sync-drive       # pull PRDs from Google Drive → 01_Raw/drive_docs (then archive-prd)
npm run parse-docs       # PDF → Markdown via MarkItDown; auto-OCR for image PDFs
npm run ingest           # ts-morph scan of project local_paths → 02_Wiki/
npm run code-graph       # run CodeGraph over local_paths → 02_Wiki/06_Code_Graph/
npm run generate-graph   # regenerate Mermaid diagrams from AST
npm run index-vault      # build 00_Overview/Vault_Index.json (RAG map)
npm run stats            # update Vault Stats table in Index.md
npm run validate         # lint-specs + audit-links (what CI runs)
```

`npm run validate` (= `lint-specs` frontmatter check + `audit-links` broken/orphan wikilink check) is the integrity gate. A Husky pre-commit hook runs it automatically when staged `02_Wiki/**/*.md` changes; `.github/workflows/wiki-ci.yml` reruns it on PRs.

## Two parsers, deliberately split

- **ts-morph** — fine-grained custom AST for Node/TS/Angular/NestJS/Next/Vue (API specs, schema/route maps); reads `tsconfig.json` including `paths`. Used by `ingest_codebase.js`.
- **CodeGraph** (`@colbymchenry/codegraph`, MIT) — multi-language SQLite index for `npm run code-graph` and live MCP queries. Index is built **inside each project's `local_path`** (`codegraph init -i` → `.codegraph/`), never in the vault.

## RAG web app architecture (`apps/web`)

Next.js 16 App Router (⚠️ breaking changes vs. older Next — see `apps/web/AGENTS.md`; consult `node_modules/next/dist/docs/` before writing Next code). Google `gemini-embedding-001` for embeddings + `gemini-2.5-flash` for answers via Vercel AI SDK; LanceDB as local vector store.

- `scripts/ingest-rag.ts` — single source for ingestion (incremental by file change). Docker bundles it via esbuild to `ingest-rag.mjs` and runs it from `entrypoint.sh` on container start before launching Next.
- `lib/` — `config.ts` (server-only, validates `WIKI_ROOT_PATH`/`LANCEDB_PATH`), `rag.ts` (retrieve + dedupe + relevance threshold), `embeddings.ts`, `vectordb.ts`, `guardrails.ts` (prompt-injection / out-of-scope / PII), `prompt.ts`.
- API: `POST /api/search` (top-K chunks), `POST /api/chat` (SSE-streamed Markdown answer + sources). Both apply guardrails and refuse out-of-scope questions.
- `lib/config.ts` is `server-only` — never import it from a Client Component.

## Environment

Env is declared in **one place**: `.env.local` at the monorepo root (loaded by `apps/web/lib/load-root-env.ts` without overwriting already-set vars, so Docker injection is a safe no-op). Copy from `.env.example`. Key vars: `GOOGLE_API_KEY`, `WIKI_ROOT_PATH` (absolute path to `02_Wiki`), `LANCEDB_PATH`. `FIGMA_API_KEY` is consumed by the Figma MCP server (`.mcp.json`) for spec-screen.

## Markdown conventions for `02_Wiki/`

- Every file needs frontmatter: `title`, `type` (architecture|api|schema|task|log|dashboard), `source` (links to Layer-1 paths / `local_path`), `status`, `last_synced`, `tags`.
- Use `[[Wikilinks]]` liberally (powers Obsidian Graph view and the web graph).
- Mermaid for all diagrams. API-spec files (`04_API_Specs/`) require 4 sections: Contract, Source of truth (`file:line`), Business rule (PRD link), Edge cases & error codes.
- File names: `Snake_Case_With_Capital.md`; tags: `kebab-case`.

## Git / commits

- Don't commit auto-generated/local artifacts (already gitignored): `Vault_Index.json`, `.codegraph/`, `node_modules/`, `dist/`, `.lancedb`, and `02_Wiki/_Archive/`.
- **Do** commit `02_Wiki/06_Code_Graph/<project>/*.md` (shared with the team).
