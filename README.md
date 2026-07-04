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

---
# FAQ / Good Questions

### What kind of computer do I need?

For normal API use, Little Lantern is lightweight.

Little Lantern itself is not running the AI model on your machine. It runs as a local web app in your browser, with a small local server started from the project folder. The AI model runs through whichever provider you choose, using your own API key.

You do **not** need a gaming PC or a powerful GPU just to use Little Lantern with API models.

As a practical guide:

* **8 GB RAM** should be enough for basic use.
* **16 GB RAM** is more comfortable.
* More RAM is nice, but Little Lantern itself is not the heavy part.

Your browser, the number of tabs you keep open, and anything else running on your computer will matter more than Little Lantern itself.

### Does Little Lantern include free AI model access?

No.

Little Lantern is free software, but it does not include free access to paid AI models.

You bring your own API key from a supported provider, add credit to that provider account if required, and paste the key into Little Lantern’s Engine Room.

You are paying the AI provider for model use, not paying Little Lantern.

### What providers does it support?

Little Lantern supports multiple API providers, including OpenAI, Anthropic/Claude, Gemini, Mistral, Nous, and OpenRouter.

Provider availability, model names, pricing, context windows, moderation, and reliability can change. Always check the provider’s current information before spending money or moving an important companion setup.

### Does Little Lantern automatically add new models when they are released?

No.

Little Lantern does not automatically update its model list every time a provider releases a new model.

Some provider sections include custom or blank model slots so you can enter a model ID yourself. This is useful when a provider adds a new model before Little Lantern’s built-in list has been updated.

### Can I write my own system prompt?

Yes.

That is one of the main points.

Little Lantern does not add a hidden platform personality prompt on top of your companion. You write your own system prompt.

A template system prompt is included to help you get started. The lower part of the template is already configured for Little Lantern’s tool system, so supported models know how to use the available tools.

You can edit the personality, behaviour, tone, boundaries, and companion setup yourself.

Provider and model rules still apply. Little Lantern does not remove the policies or refusal behaviour of whichever model provider you choose.

### What are the file and memory limits?

Little Lantern is much less restrictive than many hosted companion platforms, but there are only two built-in limits you should know about: Voice and Interaction Example files have a 5k token limit (which is already quite large for a few strong samples), and Desk Notes have a 2k token limit. Everything else is effectively open—you can put as much material as you want into it.

The real limits are:

* your browser storage
* your model’s context window
* token cost
* practical readability
* how much you want sent to the model every time

Some fields are always loaded into the prompt, so huge always-on text will cost more and may crowd the model’s context.

Memory Books are different. They are designed for longer-term information and can be triggered when relevant, instead of dumping everything into every message.

You do **not** have to build all your memory material at once. Start small, test, and expand gradually.

### Can I upload Little Lantern to a cloud account or rented server so I can use it anywhere?

Little Lantern is designed as a local-first app.

By default, it is meant to run on your own computer, for your own use, through your own browser.

Because it is public-domain software, you can modify or host it elsewhere if you know what you are doing. However, that changes the security and privacy situation.

If you put Little Lantern on a cloud server, rented server, shared hosting service, or public URL, the risk is yours. You would need to handle access control, HTTPS, server security, API key safety, file permissions, and backups yourself.

Do not expose a Little Lantern install publicly without understanding what you are doing.

### I have never used GitHub. How do I download Little Lantern?

You do not need to learn GitHub to download Little Lantern.

1. Go to the Little Lantern GitHub page.
2. Click the green **Code** button.
3. Click **Download ZIP**.
4. Save the ZIP file somewhere you can find it.
5. Unzip/extract the folder.
6. Open the extracted Little Lantern folder.
7. On Windows, double-click `start.bat`.
8. When Little Lantern opens, read `Little_Lantern_Guides/00_START_HERE.md`.

That guide tells you what to do next.

### Is it hard to set up?

No, but you do need to read the guides.

For most people, basic setup means:

1. Download Little Lantern.
2. Unzip it.
3. Run the start file.
4. Open the starting guide.
5. Choose an API provider.
6. Create or open your provider account.
7. Get an API key.
8. Add credit to the provider if required.
9. Paste the API key into Little Lantern’s Engine Room.
10. Choose a model and test it.

If you are careful and stop to read the guide, expect roughly **20–30 minutes** for basic setup.

### How long does it take to move a companion?

Installing Little Lantern is the quick part.

Moving a companion can take longer.

That depends on how much material you want to bring over: personality, backstory, voice examples, memories, boundaries, project notes, roleplay preferences, worldbuilding, and long-term context.

Little Lantern includes a moving guide with prompts you can give your companion on the platform you are currently using. Those prompts can help create summaries and memory material for the move.

You do not have to do everything at once.

You can start with a simple setup, test it, then gradually add Memory Books and notes as you go.

It is sensible to keep your current platform subscription until you feel comfortable that everything is working the way you want. You can also keep using your current platform for expensive models and use Little Lantern for more freedom, experimentation, or cheaper provider options.

Take your time. The point is control, not panic.
