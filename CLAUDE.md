# Little Lantern

## What This Is
A vanilla HTML/CSS/JS chat frontend for non-coders to connect to multiple LLM API providers. No frameworks. Single-page app with tabbed navigation. localStorage for state. Bring your own API keys, pick a provider, chat.

## Build Status (updated 2026-07-11) — READ BEFORE TRUSTING THE CHECKBOXES

**Nearly every "Known Issue" and Priority 1–6 item below is DONE.** Do NOT read an unchecked box as "not built" without checking the code first — the boxes badly lagged reality and that repeatedly misled sessions (Claude/Nous/OpenAI, GM Notes, ASCII rendering, the file importer, DPO-on-reroll were all built but marked otherwise).

**Built and working:** all six API providers (OpenAI, Claude, Nous, OpenRouter, Gemini, Mistral) with proper `system` + `messages` formatting; structured tools (calculator, web_search, url_fetch, file_read, file_search, file_write, image_generate, memory_add) across tool-capable providers; per-model sampler/effort handling; finalised model dropdowns; the GM Notes hidden channel (`parseGmNotes`); a cumulative token odometer; and prompt caching where supported (Claude, OpenAI, Mistral `prompt_cache_key`, Gemini explicit cache; none for Nous/OpenRouter).

**Built since (landed 2026-06-08 → 2026-06-22, all in `app.js`; verified present in code):** the auto-memory engine — a `memory_add` tool (the model writes its own `memory`-type entries, scoped to the active companion's book) plus a per-companion Desk Notes file read fresh each turn; an idle **heartbeat** (off by default) that does quiet housekeeping while the user is away; full **JSON state export/import** (backup/restore, API keys excluded); the token odometer + ↺ reset moved up to the chat top bar; and a ❓ Help button/modal pointing at the guides. A private beta bundle went out 2026-06-15; beta-feedback fixes landed 2026-06-22.

**Built 2026-06-28 (`5ed04b8`):** a per-companion **Voice & Interaction Examples** upload (optional `.md`/`.txt` of sample exchanges, for moving a companion in from another app). It replaced the now-redundant *manual* Desk Notes upload; voice examples and the auto Desk Notes file (the heartbeat's working-dir file) now load **together** in the stable bundle, not either/or. Same pass: default temperature ships at **1**; UI example filenames tidied to `companionname-context.md`.

**Built 2026-06-30:** local server hardening and memory reliability fixes. `start.py` binds to `127.0.0.1` only, CORS is restricted to loopback origins, and incoming filenames are URL-decoded before basename/safety checks. Test Connection now sends a real small validation request for every supported provider, including Gemini and Mistral, and `API_REFERENCE.md` was updated as the source of truth. Auto-memory now has code-side near-duplicate protection: `memory_add` skips/merges duplicate memories, recalled memory is deduped before prompt injection, heartbeat tells the model to save only genuinely new durable facts, and a per-chat **Memory operation ledger** carries actual `memory_add` results into later turns. Live Lumen testing passed same-turn tool receipt visibility, already-exists/trigger-merge behaviour, and next-turn ledger visibility.

**Built/decided 2026-07-01:** `claude-sonnet-5` added to the Claude dropdown (adaptive/effort — no samplers, `output_config.effort` only). Full guide set audited against live code and **committed**. **Lumen the Diagnostic Octopus ships** as an optional example companion + diagnostic helper (`system-prompts/Lumen_System_Prompt.txt`, backup folder in `Little_Lantern_Guides/`; optional/deletable, noted in README + START_HERE). UI display text: Working Directory relabelled as the companion's sandbox folder; companion About field no longer mentions rules (behavioural rules belong in the System Prompt, not the card). Note: the About You (persona) **Name** field is UI-only — only `persona.description` reaches the model.

**Built 2026-07-01 (evening) / 2026-07-02:** **Heartbeat receipts** — each beat records which tools it actually called (`currentChat.heartbeatReceipts`, cap 6, injected as `### Heartbeat receipts:` next to the memory ledger in both prompt paths); live-tested PASS on real autonomous work. **"Current Context" renamed to "Desk Notes"** in ALL display text, prompt-injection headers (`### Desk Notes:`), and docs — it collided with SillyTavern's "recent context" (context-window meaning). **Internal identifiers deliberately unchanged** (`currentContextWorkingFile`, `getCurrentContextContent()`, `CURRENT_CONTEXT_MAX_CHARS`, DOM id `characterCurrentContextWorking`) — display-only rename, same pattern as Characters→Companions; do NOT "fix" the mismatch.

**Built 2026-07-10:** GPT-5.6 Sol/Terra/Luna added to OpenAI with reasoning detection and a 5.6-only `max` effort option; Grok 4.5 added through OpenRouter with a Low/Medium/High reasoning selector (High default). Every public provider now has a persistent custom model-ID slot so same-provider model names can be used without another dropdown edit (request-shape changes still require code). The Memory Book editor's **+ Add Entry** button moved beneath the entry list so long books do not require scrolling back to the top to add another memory. Gemini 3.5 Pro is documented as coming soon but is not hardcoded until Google publishes its exact Gemini API ID.

**Documented 2026-07-11:** the README FAQ now makes the remote-use boundary explicit. Little Lantern does not become cloud-ready by uploading the folder; cloud hosting requires coding changes and production infrastructure. Telegram integration likewise requires custom development. The official release remains local-only, while CC0 forks are welcome to add remote hosting or integrations at the fork builder's own security, privacy, cost, testing, and maintenance responsibility.

**Still pending:** the fresh public repo with clean history — the last release step (live click-through test DONE 2026-07-01). `BUILD_HANDOFF.md` stays private/untracked; `_not_for_ship/` and live key files must stay out of shipping commits.

## Public Safety Stance — Read This First

The official Little Lantern release is **not** an always-on assistant. Do **not** add the following to the standard app unless Babs explicitly changes the project scope:

- Email, messaging, or auto-reply
- Slack, Discord, Telegram, WhatsApp, SMS
- Phone, voice control, always-listening features
- Calendar, contacts, smart home, IoT, or device control
- Remote control, webhooks, or anything that listens for incoming messages
- Always-on background services that check accounts, read messages, wait for outside contact, control devices, or run scheduled automation

This boundary governs the official release, not what other people may build from the CC0 code. Users are welcome to create cloud-hosted versions, Telegram integrations, or other substantial modifications in their own forks. Documentation may explain that freedom and warn about the engineering and security responsibilities involved. Treat those versions as separate custom-development projects; do not implement them in this repository without an explicit scope change.

The app runs locally on `127.0.0.1:3000` and only makes outbound HTTP requests to AI providers, search APIs, and image generation APIs. Keep it that way.

## Stack
- **HTML/CSS/JS** — no build tools, no bundler, no npm
- **Files:** `index.html`, `app.js`, `styles.css`, `start.py` (local server), `start.bat`
- **Run:** Open `start.bat` or `python start.py` then navigate to `http://127.0.0.1:3000`
- **Test:** Open browser console, test each provider endpoint manually

## Architecture
- `app.js` contains ALL logic: state management, API calls, UI rendering, event handlers
- State lives in a global `state` object, persisted to localStorage via `saveState()`/`loadState()`
- `loadState()` uses deep merge for `endpoints` and `defaults` — do NOT break this
- Each API provider has its own `callXxx()` function that handles request formatting
- `buildMessages()` builds the proper `{system, messages}` for API providers (plus `systemStable`/`systemVolatile` for Gemini caching). `buildPrompt()` (concatenated string) remains only for local/RunPod completion-style endpoints.
- Tabbed panels: Chat, Companions, About You, System Prompts, Memory Books, Machine Room (Settings)

## Providers — Current and Planned

See `API_REFERENCE.md` for **exact parameters, endpoints, headers, and model strings** per provider. That file is the source of truth. Do not guess parameters from memory.

### Implemented (all working):
- **OpenAI** — `/v1/responses` (primary) + `/v1/chat/completions` (fallback); tools; reasoning effort
- **Claude API** — `/v1/messages`; proper system/messages; sampler models (temp only) vs adaptive/effort models; tools
- **Nous Research** — `/v1/chat/completions` (OpenAI-compatible); tools; full error-body logging
- **OpenRouter** — `/api/v1/chat/completions`; curated model list + custom-slug slot; tools
- **Gemini** — `:generateContent`; hardcoded fully-open safety settings; tools (`functionDeclarations`); explicit caching
- **Mistral** — `/v1/chat/completions` (OpenAI-compatible); tools; `prompt_cache_key`
- **Local llama.cpp / RunPod** — existing completion-style endpoints; hidden from the public UI

## Known Issues — ALL RESOLVED (kept as standing constraints so they don't regress)

The five original build issues are fixed. Keep these constraints in mind:

1. **Claude** — `callClaude()` sends a proper `messages` array + separate `system`. Opus 4.5/4.6 + Sonnet 4.5/4.6 use samplers (the UI sends **temperature only**). Adaptive/effort models (`claude-sonnet-5`, Opus 4.7/4.8, Fable 5) **reject samplers** and use `output_config: {effort}`; Opus 4.7/4.8 also send `thinking: {type:"adaptive"}`. **Never send both `temperature` and `top_p` to Claude.** Custom model IDs preserve names but do not infer new request semantics.
2. **Nous** — fixed; logs full error-response bodies; OpenAI-compatible tools wired. Models: `Hermes-4-405B`, `Hermes-4-70B`.
3. **Message formatting** — `buildMessages()` produces proper `{system, messages}`; the system prompt now goes through the real `system` channel for every API provider. `buildPrompt()` stays only for local/RunPod.
4. **top_p slider** — exists. Samplers now live as one persistent slider set in the Machine Room (not a separate sidebar).
5. **OpenAI** — fully implemented (Responses + Chat Completions). Gemini and Mistral also added.

## Feature List — Full Build

### Priority 1: API Infrastructure — DONE
- [x] Fix `callClaude()` — proper messages format, system prompt, samplers/effort
- [x] Fix `callNous()` — captures error response; OpenAI-compatible tools
- [x] Add `callOpenAI()` — Responses API primary route, Chat Completions fallback
- [x] Provider layer — each `callXxx()` maps the generic UI controls to its own fields; Gemini + Mistral also added
- [x] Per-provider parameter validation — `PROVIDER_SUPPORT` + `updateSamplerVisibility()` grey out unsupported samplers
- [x] Model dropdowns updated to current strings

### Priority 2: Message Formatting & System Prompt — DONE
- [x] `buildMessages()` builds provider message formats (kept `buildPrompt()` for local/RunPod)
- [x] Claude: separate `system` field + `messages` array of `{role, content}`
- [x] OpenAI Responses: `input` array with `system` role message
- [x] OpenAI Chat Completions: `messages` array with `system` role
- [x] Nous: `messages` array with `system` role (OpenAI-compatible)
- [x] Local/RunPod: behaviour preserved
- [x] **System prompt now goes through the real `system` channel for all API providers**
- [x] System prompt content = system prompt file + companion + persona + memory book context (+ GM notes/compass as volatile)

### Priority 3: Character/System Prompt File Import — DONE
Field redesign AND importer are built. Verified: file picker → `readAsText` → `showImportPreview()` (JSON is pretty-printed) → user reviews before assigning. System Prompt editor has its own upload (`handleSystemPromptFileUpload`).
- [x] Load `.md` / `.json` / `.txt` files directly into character cards
- [x] Show preview of file contents before assigning
- [x] User assigns whole file to card fields — not auto-parsed
- [ ] Character files vary wildly in structure (JSON, markdown, plain text, with subheadings, if>then rules, etc.) — the importer must be format-agnostic
- [ ] Small characters (~1.2K tokens) may dump everything into Description
- [ ] Large characters (3K+ tokens) have rich internal structure — preserve it exactly as written
- [ ] Support: Soul.md, Character.md, System.md, Memory.md, Persona.md

### Character Card Field Redesign
Current card has too many fields. Simplify to:
- **Name** — required
- **Description** — the big field. Character identity, personality, abilities. Always used. (Behavioural rules belong in the System Prompt / Behaviour entries, not the card.)
- **Backstory** — history, context, what happened before. Used ~80% of the time.
- **Scenario** — optional. Current scene/setting. Sometimes used, sometimes blank.
- **System Prompt** — replaces "Safety Rules". DROPDOWN selector, not a text field. User picks from a list of named `.txt` files (e.g. "API", "Local", "Work"). Files are pre-written system prompts stored in a configurable folder. Selected system prompt gets sent through the actual `system` channel to API providers. This is NOT decoration — it's the system-level instruction that API providers treat as authoritative.
- **System Prompt Files:** Stored as `.txt` files in `system-prompts/` subfolder. Frontend scans that folder and populates dropdown with filenames (minus extension). User selects at the same time as selecting character. Include a "None" option for cases where no system prompt is needed. Files will be added by user — folder may be empty initially.
- **Remove "First Message"** — not used.
- **Image/thumbnail** — keep for portrait selection
- **Model Size Tier** — keep
- **Memory Book assignment** — keep

### Priority 4: UI Layout Redesign — MOSTLY DONE
- [x] Endpoint selector in the LEFT sidebar (compact)
- [x] Sampler sliders — SUPERSEDED: now a single persistent slider set in the Machine Room (a maintainer decision), not a right sidebar
- [x] Chat window full centre
- [x] Current companion shown in the chat header (`currentCharacterDisplay`)
- [x] Companion/persona selection stays on separate panel tabs
- [x] Add `top_p` slider
- [x] Add reasoning-effort dropdown (OpenAI thinking models + Claude 4.7/4.8 effort)

### Priority 5: GM Notes Hidden Channel — DONE (`parseGmNotes()`)
- [x] Two-channel output: `BEGIN_GM_NOTES`/`END_GM_NOTES` + `BEGIN_PUBLIC`/`END_PUBLIC`
- [x] Strip GM notes from visible transcript, store in hidden field
- [x] Inject GM notes into context on subsequent calls
- [x] Replace-not-append storage rule
- [x] Debug toggle to reveal GM notes (`gmDebugVisible`)
- [x] Compass line every third assistant turn (`getCompassInstruction()`)

### Priority 6: Other Features
- [x] Reroll swipes ("again" not A/B) — `rerollResponse()`
- [x] Markdown/emoji rendering in responses (`formatMessage()`)
- [x] Web search (Brave) integration — `web_search` tool
- [x] Token counter — cumulative cross-provider odometer (reads response `usage`); not the Claude `count_tokens` endpoint, which stays an optional future enhancement
- [x] ASCII box for code/drawings — code/ASCII inside ``` fences renders in a monospace `<pre><code>` box via `formatMessage()`. (No separate ASCII *tool*, and none needed — the model just uses a code fence.)
- [x] DPO auto-append on reroll — plumbing turns rejected rerolls into DPO pairs (chosen = accepted, rejected = the rejected attempt). **Export DPO button is HIDDEN in the public UI (`365c233`)** — public users aren't fine-tuning local models; collection plumbing kept intact for private/internal use. (Reroll/swipe itself stays public.)
- [x] Per-message steering note ("whisper") — rejected entries carry a `note`, fed back via `buildMessages(msgIndex, rerollNote)`

## Code Conventions
- Vanilla JS only. No frameworks, no npm, no build step.
- All logic in `app.js`. CSS in `styles.css`. Structure in `index.html`.
- Use `const`/`let`, never `var`
- Functions named descriptively: `callClaude()`, `buildPrompt()`, `renderChat()`
- State changes go through the global `state` object, then call `saveState()`
- Test in browser. Check console for errors. No test framework.

## DO NOT
- Add npm, webpack, vite, or any build tooling
- Break localStorage deep merge in `loadState()`
- Rename the localStorage keys — the `msl-` prefix (`msl-frontend-state`, `msl-chat-autosave`, `msl-token-odometer`) is legacy but load-bearing; renaming orphans existing users' data. Migrate (copy old→new on load) if you ever must.
- Send unsupported parameters to any API (this causes 400 errors — consult API_REFERENCE.md)
- Send both `temperature` AND `top_p` to Claude API (newer models reject this)
- Remove DPO collection functionality
- Remove or break the Memory Book system (`getRelevantMemoryEntries()`, keyword triggers, per-character memory book assignment). This is a working feature — preserve it.
- Change the file structure (everything stays in root)
- Add anything listed under **Public Safety Stance** above
