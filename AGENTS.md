# AGENTS.md — GPT / Codex Contributor Guide

This file is for GPT-family or Codex-family coding agents working on this repository. The longer canonical guide for architecture, feature roadmap, and known issues is `CLAUDE.md`. Read it for context before doing non-trivial work.

## Project Summary

**Little Lantern** is a local-first chat frontend for non-coders to use multiple LLM API providers through one interface. Vanilla HTML/CSS/JS, no build tools, no npm. It runs at `http://127.0.0.1:3000` via `start.py` (or `start.bat` on Windows).

This is **not** an assistant framework, not a server daemon, not a background process. It is a single-page web app the user runs on their own machine.

## Build Status (updated 2026-07-11) — check the code before trusting any checkbox

The app itself is feature-complete. **Built and working:** all six API providers (OpenAI, Claude, Nous, OpenRouter, Gemini, Mistral) with proper `system` + `messages` formatting; structured tools (calculator, web_search, url_fetch, file_read, file_search, file_write, image_generate, memory_add) on tool-capable providers; per-model sampler/effort handling; finalised model dropdowns; the GM Notes hidden channel; a cumulative token odometer; and prompt caching where supported. **Newer additions (all in `app.js`):** the auto-memory engine (`memory_add` + a per-companion Desk Notes file read fresh each turn), an idle **heartbeat** (off by default), full **JSON state export/import** (API keys excluded), top-bar token spend, and a ❓ Help modal. A private beta went out 2026-06-15; beta-feedback fixes landed 2026-06-22.

**Built 2026-06-28 (`5ed04b8`):** a per-companion **Voice & Interaction Examples** upload (an optional sample-exchange file, used when moving a companion in from another app) — it replaced the redundant *manual* Desk Notes upload; voice examples and the auto Desk Notes file now load together in the stable bundle. Same pass: default temperature ships at 1; UI example filenames tidied to `companionname-context.md`.

**Built 2026-06-30:** local server hardening and memory reliability fixes. `start.py` binds to `127.0.0.1` only, CORS is restricted to loopback origins, and incoming filenames are URL-decoded before basename/safety checks. Test Connection now sends a real small validation request for every supported provider, including Gemini and Mistral, and `API_REFERENCE.md` was updated as the source of truth. Auto-memory now has code-side near-duplicate protection: `memory_add` skips/merges duplicate memories, recalled memory is deduped before prompt injection, heartbeat tells the model to save only genuinely new durable facts, and a per-chat **Memory operation ledger** carries actual `memory_add` results into later turns. Live Lumen testing passed same-turn tool receipt visibility, already-exists/trigger-merge behaviour, and next-turn ledger visibility.

**Done 2026-07-01:** `claude-sonnet-5` added to the Claude dropdown (adaptive/effort handling — no samplers). The full guide set was audited against the live code and committed. **Lumen the Diagnostic Octopus ships** as an optional example companion + diagnostic helper (`system-prompts/Lumen_System_Prompt.txt`, backup in `Little_Lantern_Guides/Lumen_Diagnostic_Octopus_Backup/`; optional/deletable, noted in README and START_HERE). UI display text updated: the Working Directory is labelled as the companion's sandbox folder, and the companion About field no longer mentions rules — behavioural rules belong in the System Prompt, not the card. Note: the About You (persona) **Name** field is UI-only; only the persona Description is sent to the model.

**Done 2026-07-01 (evening) / 2026-07-02:** **Heartbeat receipts** — each beat records which tools it actually called (`currentChat.heartbeatReceipts`, injected as `### Heartbeat receipts:` alongside the memory ledger); live-tested. **"Current Context" renamed to "Desk Notes"** in all display text, prompt-injection headers, and docs (it collided with SillyTavern's "recent context"). **Internal identifiers deliberately unchanged** (`currentContextWorkingFile`, `getCurrentContextContent()`, `CURRENT_CONTEXT_MAX_CHARS`, DOM id `characterCurrentContextWorking`) — display-only rename; do NOT rename the internals.

**Done 2026-07-10:** GPT-5.6 Sol/Terra/Luna added to OpenAI with reasoning detection and a 5.6-only `max` effort option; Grok 4.5 added through OpenRouter with a Low/Medium/High reasoning selector (High default). Every public provider now has a persistent custom model-ID slot so same-provider model names can be used without another dropdown edit (request-shape changes still require code). The **+ New Memory Book** button moved below the book list. Gemini 3.5 Pro is documented as coming soon but is not hardcoded until Google publishes its exact Gemini API ID.

**Documented 2026-07-11:** the README FAQ now makes the remote-use boundary explicit. Little Lantern does not become cloud-ready by uploading the folder; cloud hosting requires coding changes and production infrastructure. Telegram integration likewise requires custom development. The official release remains local-only, while CC0 forks are welcome to add remote hosting or integrations at the fork builder's own security, privacy, cost, testing, and maintenance responsibility.

**Still pending:** the fresh public repo with clean history — the last release step (live click-through test DONE 2026-07-01). `BUILD_HANDOFF.md` stays private/untracked; `_not_for_ship/` and live key files must stay out of shipping commits.

The live, session-by-session record is **`BUILD_HANDOFF.md`** (kept untracked, not for shipping). Read it for the current picture. This `AGENTS.md` and `CLAUDE.md` are kept in sync — they carry the same project truth, addressed to different readers.

## Boundaries — Read This Before Adding Anything

The official Little Lantern release in this repository must remain a **local-only frontend that makes outbound API calls only**. Do not add the following to the standard app unless Babs explicitly changes the project scope:

- Email, SMS, phone, Slack, Discord, Telegram, WhatsApp
- Calendar, contacts, smart-home, IoT, device control
- Webhooks, WebSocket servers, or any inbound listeners
- Always-listening or always-on background services
- Scheduled automation that runs without an active user
- Anything that polls personal accounts or waits for outside contact

This boundary governs the official release, not what other people may build from the CC0 code. Users are welcome to create cloud-hosted versions, Telegram integrations, or other substantial modifications in their own forks. Documentation may explain that freedom and warn about the engineering and security responsibilities involved. Treat those versions as separate custom-development projects; do not implement them in this repository without an explicit scope change.

In-scope outbound calls only:

- AI/model endpoints: OpenAI, Claude, Nous, OpenRouter, Gemini, Mistral, plus existing OpenAI-compatible endpoints like llama.cpp/RunPod where present.
- Brave search API
- Image generation APIs (e.g. Nano Banana)

If unsure whether a feature crosses the line, stop and ask.

## Stack

- Vanilla HTML/CSS/JS — no frameworks, no bundler, no npm
- All logic lives in `app.js`. Styles in `styles.css`. Markup in `index.html`.
- State is held in a global `state` object and persisted to `localStorage` via `saveState()` / `loadState()`.
- `loadState()` uses a deep merge for `endpoints` and `defaults` — do not break this.
- No test framework. Test by running the app in a browser and watching the console.

## How to Run

1. `python start.py` (or double-click `start.bat` on Windows)
2. Open `http://127.0.0.1:3000`

## Where to Look for Specifics

- **`CLAUDE.md`** — full project guide: architecture, providers, known issues, feature roadmap, code conventions, DO NOT list. Treat it as the canonical reference.
- **`API_REFERENCE.md`** — exact request parameters, headers, and model strings per provider. Do not guess parameters from memory; consult this file.
- **`README.md`** — user-facing docs.

## Working Conventions

- Use `const` / `let`. Never `var`.
- Functions are named for what they do: `callOpenAI()`, `buildPrompt()`, `renderChat()`.
- All state changes go through the global `state` object, then call `saveState()`.
- Preserve existing app features unless explicitly instructed to remove them.
- Keep the current flat project structure. Do not introduce a `src/` folder, build pipeline, nested source tree, or major restructure without explicit instruction.

## DO NOT

- Add npm, webpack, vite, or any build tooling.
- Break the `localStorage` deep merge in `loadState()`.
- Change `localStorage` keys without explicit instruction — the `msl-` prefix (`msl-frontend-state`, `msl-chat-autosave`, `msl-token-odometer`) is legacy but load-bearing; renaming orphans existing users' data.
- Send unsupported parameters to any API. This causes 400 errors. Consult `API_REFERENCE.md`.
- Send both `temperature` AND `top_p` to the Claude API. Adaptive/effort Claude models (`claude-sonnet-5`, Opus 4.7/4.8, Fable 5) reject samplers entirely (400); the older sampler models take temperature only.
- Remove DPO collection or the Memory Book system. Both are working features.
- Add any of the out-of-scope feature classes listed under **Boundaries** above.
- Modify files outside this repository.
