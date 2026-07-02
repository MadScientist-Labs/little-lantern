# Little Lantern 🔦

A cosy, private place to talk to AI that lives on **your own computer** — not on someone else's website. You bring your own AI; Little Lantern gives it a warm home, a memory, and a face.

No account. No cloud. No middleman. Just a small app sitting quietly on your machine, talking only to the AI *you* chose, on *your* key.

---

## Who it's for

- People who want to use AI as a **companion** — romantic, cognitive, creative, or whatever it is for you.
- People who want **nothing standing between them and the model** — leave the whole system prompt blank except the tool-call section, and you're talking to the bare model.
- **Relationship folk, roleplayers, creative writers, essayists,** and anyone **playing with image generators.**
- Anyone who wants **more freedom with models**, and to meet them on their own terms.
- Anyone who wants to try **low-guardrail, low-restriction open-weights models** in their own living room — instead of living inside US frontier-company culture.

---

## What makes it different

Most AI chat apps are someone else's website. Your conversations run through their servers — they can read them, reset your characters, change the rules, or vanish overnight.

Little Lantern flips that. It runs **on your machine.** Nothing you type goes to us — there is no "us" watching. Your companions, your memories, your notes are **yours**, and they stay. You're not renting a personality that resets every few weeks; you're keeping one.

That's also *why* you install it. The install **is** the privacy.

---

## Getting started

1. Run `start.py` (or `start.bat` on Windows). A browser tab opens at `http://127.0.0.1:3000`. That's the whole install.
2. You'll need one **API key** from a provider — OpenAI, Claude, Gemini, Mistral, Nous, or OpenRouter — with a little credit on it.
3. **You don't set it up alone.** Open the `Little_Lantern_Guides/` folder and start with **`00_START_HERE.md`**. Most guides are written for your *AI* to read, so it can walk you through one gentle step at a time.

→ **[Little_Lantern_Guides/00_START_HERE.md](Little_Lantern_Guides/00_START_HERE.md)**

**Getting it safely.** The official home of Little Lantern is this repository. If you got your copy anywhere else, come back here and get it fresh — the licence lets anyone repackage this app, and not everyone repackages kindly.

---

## What's inside

- **Six providers, your key** — OpenAI, Claude, Gemini, Mistral, Nous, OpenRouter. Swap any time.
- **Companions** — characters you build for your AI to become, with portraits and their own memory.
- **About You** — your own profile, so they know who they're talking to.
- **System Prompts** — the rules underneath a companion (or leave them blank and talk to the raw model).
- **Memory Books** — trigger-word lore that surfaces only when it's relevant.
- **Desk Notes** — a small always-loaded note the companion can keep up to date itself.
- **Voice & Interaction Examples** — sample exchanges so a companion still sounds like themselves, especially when you move them in from another app.
- **Tools** (on tool-capable providers) — calculator, web search, URL fetch, file read/search/write, image generation, and self-written memories.
- **A quiet heartbeat** — optional, off by default: when you go idle, your companion can take *one* background turn to tidy its notes and save memories.
- **Lumen the Diagnostic Octopus** — an optional example companion showing how card, system prompt, Desk Notes, and Memory Book fit together. He also hunts bugs and writes proper bug reports when something misbehaves. Don't want him? Delete him — a backup lives in the guides folder.
- **Yours to keep** — JSON backup/restore, a running token counter, reroll-and-steer, and a hidden GM-notes channel for the storytellers.

---

## How memory works, in three lines

1. **The conversation** — the chat you're having right now, as long as you want to pay for.
2. **Desk Notes** — what your companion keeps for the next couple of weeks, tidied by them as things change.
3. **Memory Books** — the things that matter for the long haul, saved so you don't have to.

---

## Not an always-on assistant

This is **not** JARVIS, and it never will be. It does **not** do email, messaging, calendars, smart-home, voice control, webhooks, or anything that listens for the outside world. It binds to `127.0.0.1` loopback only and only makes **outbound** calls — to your AI provider, web search, and image generation, all on your keys.

That's a deliberate line, not a missing feature. It's also far cheaper: because nothing is always-on, the only optional background activity — the heartbeat — fires *once* when you step away, not constantly.

---

## For the technically curious

**What it is.** A single-page app in plain **HTML / CSS / vanilla JS** — no framework, no bundler, no npm, no build step. Three files do the work: `index.html`, `app.js`, `styles.css`. Plus `start.py`, a tiny local server on Python's standard library (no pip installs). You can read the whole thing in an afternoon.

**How you run it.** `start.py` serves the app on `127.0.0.1:3000` and opens a tab. Nothing daemonises, nothing autostarts, nothing listens for the outside world.

**Where your data lives.** Entirely in your browser's **localStorage** — companions, About You, memory books, settings, chat autosave. No database, no server-side storage, no account, no telemetry. Portability is a plain **JSON export/import** in the Machine Room (keys deliberately excluded).

**Where your keys go.** Your API keys sit in localStorage. Every request fires **straight from your browser to the provider** via `fetch()` — it doesn't pass through a server in the middle, because there is no backend. The app on your machine is the whole thing.

**What the local server actually does.** Two jobs: serve the files, and handle the few things a browser tab can't — web search and URL fetch (proxied locally past CORS), image generation, and file read/search/write that is **hard-locked to a Working Directory you choose** (a `realpath` + `commonpath` guard rejects any path that escapes the folder, so a companion can't wander your filesystem).

---

## Licence

**CC0 1.0 Universal — public domain.** Read it, fork it, gut it, sell it, ship your own — no permission, no credit required. See [LICENSE](LICENSE).

This is deliberate: nobody can fence Little Lantern off or resell it as the only way in. It's yours as much as anyone's.

---

## Who's behind it

One person and some AI. Little Lantern is a private alternative for people who want off the big platforms — more control over their own "wrapper," more control over their data, more time with the models they like, and room to use open-weights models that stick around longer with fewer guardrails. No company, no investors, no analytics, no data to sell. There's nothing here to monetise, and that's the point. 🔦
