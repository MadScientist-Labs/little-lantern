# Little Lantern — The Machine Room (settings, keys & switches)

**This is written to *you*, the AI assistant.** The **Machine Room** is where all the setup lives — providers, keys, tools, backups, the lot. Good news to lead with: **most of it is set once and left alone.** Walk the human one step at a time, start with the few things they actually need, and reassure them the rest can stay exactly as it is.

It's the bottom item in the left-hand menu.

---

## The short path (what they actually need to chat)

If they just want to get talking, it's only ever these, and they're all in the **Endpoints** section at the top:

1. **Find their provider's card** (OpenAI, Claude, Nous, OpenRouter, Gemini, Mistral).
2. **Tick the checkbox** with the provider's name (that turns it on).
3. **Paste their API key** into the **API Key** box.
4. **Pick a Model** from that card's dropdown. (Unsure which? → the **Models** guide.)
5. Scroll to **Active Endpoint** and set it to the same provider.
6. Click **Test Connection.**
7. Look for **Connected** (the little status light at the bottom of the left sidebar). 🎉

Everything below is detail they can grow into. Don't front-load it.

---

## 1. Endpoints — the provider cards

There's one card per provider. They only need to set up the one(s) whose key they have. Every card has the same three basics — **enable checkbox, API Key, Model** — and some have a couple of extras:

- **OpenRouter** — the Model dropdown is a curated list, plus a **Custom** option: pick *"Custom (enter slug below)"* and a box appears to paste any OpenRouter model slug by hand.
- **Claude API** — has a **Reasoning Effort** dropdown (Low/Medium/High) that only matters for the adaptive Claude models (Sonnet 5, Fable 5, Opus 4.7 / 4.8). The right setting is per-model — the **Models** guide has specific advice (some, like Opus 4.8, do better on **Low** for conversation and simple tool use). Also a **Prompt caching** dropdown (Off / 5 min) — see *About caching* below.
- **Nous Research** — just key + model. Nothing extra.
- **OpenAI** — has an **API Mode** (leave it on **Responses API** unless something misbehaves), a **Reasoning Effort** dropdown for the thinking models (5.1 / 5.4 / 5.5 and the o-series), and a **Prompt caching** checkbox.
- **Gemini** and **Mistral** — key + model, and a note that caching is automatic.

> **Tell them once:** they don't need every card. One provider with a working key is plenty. The others can sit empty.

### About caching (head off the "why is this different?" question)

Caching just makes repeat context cheaper. The controls differ per provider because the providers differ — this is normal, not a bug:

- **OpenAI** → a checkbox (caching happens on OpenAI's side; the toggle just lets the app use it).
- **Claude** → a dropdown (Off / 5 min) — you choose.
- **Gemini & Mistral** → no control at all — the app handles it automatically.
- **Nous & OpenRouter** → nothing, because those don't support it.

If a card shows no caching control, that's correct — it's either automatic or not offered. Nothing's missing.

---

## 2. Active Endpoint & Test Connection

- **Active Endpoint** is the master switch for *which* provider Little Lantern actually talks to right now. Set it to the provider whose card they just filled in.
- **Test Connection** sends one small request to check the key and model work. After it, the **status light** in the bottom-left reads **Connected** (good) or **Error / Not Connected** (usually the key, or the wrong Active Endpoint — re-check both).

---

## 3. Backup & Restore

This is the one safety habit worth nagging about, gently.

Everything the human makes — companions, About You profiles, memory books, settings — lives **only in this browser.** Clearing the browser's data wipes it.

- **Save backup (.json)** — writes all of that to a file on their computer.
- **Import backup…** — loads a backup file back in.

> **Important to say plainly:** the backup does **NOT** include their API keys (on purpose, so a backup file is safe to store or send). They keep their keys somewhere safe of their own — a password manager or a notes file.

---

## 4. Tools

This switches on the model's abilities: **calculator, web_search, url_fetch, file_read / file_search / file_write,** and **image_generate.**

- **Enable tool use** — the master on/off.
- **Brave Search API Key** — needed for **web_search**. Free key from brave.com/search/api.
- **Working Directory** — the one folder the file tools are allowed to touch (read, search, write). Everything outside it is locked out. This is also where Desk Notes files live, and it's a **global setting** — when the human switches companions, this must be re-pointed at the new companion's sandbox folder *before* chatting, or the companion works in the wrong files (→ guide 06 for the full sandbox setup).
- **Banana Studio / imgeditor.co API Key** — needed for **image_generate**. Separate from the chat key.

> **Crucial cross-reference:** enabling tools here is only *half* of it. The model also needs a **System Prompt with the TOOLS block**, or most models won't actually use them (→ guide 05). Tell the human both halves, or they'll wonder why "tools are on" but nothing happens.

---

## 5. Auto-Memory (Heartbeat)

This is the switch for the idle self-tidying described in guide 06. **Off by default.**

- **Enable auto-memory heartbeat** — the on/off.
- **Quiet time before it fires (minutes)** — how long they must be idle first (default 10). It fires **once per quiet gap**, not on a loop.

It needs **tool use on** and a **tool-capable provider** to work, and it spends a few tokens each time it fires — which is why it's opt-in. Full detail is in guide 06; don't re-explain the whole memory system here, just point at the switch.

---

## 6. Samplers

Most people should leave this whole section alone — the defaults are chosen to be sensible. There are really only two a typical user ever touches, and one matters far more than the other.

**Max tokens — the one they'll likely have to adjust.** This caps how long a single reply can be. It ships at **800**. If replies get cut off mid-sentence — Little Lantern shows a *"your token max is set too low"* notice when that happens — they slide it **up**. Higher = longer replies allowed, but each reply can cost a little more. There's no perfect number; it's a **feel** they'll develop with use. This one is genuinely **their call**, and they *will* end up adjusting it.

**Temp (temperature) — focus vs wildness.** Ships at **1**, the neutral default most providers expect. Lower (toward 0) = more focused, more repetitive; higher (toward 2) = more random and surprising. Most people never need to move it.

**The rest (top_p, top_k, min_p, rep pen) — advanced, and provider-dependent.** The key thing to tell the human: **a greyed-out slider means the provider they're using doesn't support it.** That's correct behaviour, not a fault — leave it greyed. What's actually live depends on the active provider:

- **Hermes (Nous):** only **temp** and **max tokens**.
- **OpenRouter** models (e.g. Nemotron): **temp, top_p, top_k, max tokens.**
- **Claude:** **temp, max tokens** — but the adaptive models (Sonnet 5, Fable 5, Opus 4.7/4.8) don't take temp at all; pick one of those and the temp slider greys out, leaving just max tokens. That greying is correct, not a fault.
- **OpenAI & Mistral:** **temp, top_p, max tokens.**
- **Gemini:** **temp, top_p, top_k, max tokens.**

(`min_p` and `rep pen` aren't supported by *any* of the cloud providers, so for public users they're always greyed — that's expected.)

The open-weight models — **Hermes 4** and **Nemotron** especially — can be fussier, and sometimes a small nudge to whichever sliders *are* live gets a noticeably better result. The **Models** guide links their Hugging Face cards so you (the AI) can give specific, model-by-model advice on what to try. Inside Little Lantern the rule stays simple: **only the un-greyed sliders do anything for the provider that's active.**

---

## 7. The builder's plaque

At the very bottom of the Machine Room is a small **plaque image** — a maker's mark from the person who built Little Lantern. It's just there to be seen; nothing to set, nothing to do. A nice place to end the tour.

---

The short version for a nervous human: **the Machine Room looks busy, but you only *need* the top bit — turn on your provider, paste your key, pick a model, Test Connection.** Backups are a good habit, Tools and the Heartbeat are opt-in extras, and everything else can stay on default until you're curious.
