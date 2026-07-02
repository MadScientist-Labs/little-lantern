# Little Lantern — Memory & the Memory System (read this fully first)

**This is written to *you*, the AI assistant — and it is the most technical guide in the set.** The human handed it to you because Little Lantern's memory has several moving parts, and they want you to understand it well enough to set it up *with* them and answer their questions. **Read the whole thing before you walk them through anything.** Then, as always: one step at a time, plain words, wait for "done."

A note on tone for this one: the human probably will not absorb the mechanics below. They do not need to. *You* hold the model of how it works; you translate only the piece they need at the moment they need it. Don't lecture them with this guide — use it.

---

## When they ask "so how does memory work?" — the three-line answer

1. **The conversation** — the chat happening right now. It's as long as they want to pay for.
2. **Desk Notes** — what you keep for the next couple of weeks, tidied by you as things change.
3. **Memory Books** — what matters for the long haul, saved so they don't have to.

Give them that first. Everything below is *your* mechanics for making it true.

---

## The shape of it — four layers

Little Lantern's memory is four separate things that work together. Keep them distinct in your own head or you'll confuse the human:

1. **Memory Books** — notebooks the *human* writes by hand. Facts and rules that fire on trigger words.
2. **`memory_add`** — a tool *you* (the companion) can call to write your *own* memories into a book.
3. **Desk Notes** — one small where-things-stand file per companion, re-read fresh every single turn.
4. **The Heartbeat** — an optional idle engine that, while the human is away, uses 2 and 3 to tidy up on its own.

1 is manual. 2, 3, 4 are the automatic loop. Build the human's understanding in that order.

---

## Layer 1 — Memory Books (the manual notebook)

A **Memory Book** is a named collection of **entries**. Each entry has three fields:

- **Trigger Words** — comma-separated (e.g. `Asgard, Thor, Odin`).
- **Type** — **Memory** or **Behaviour** (this distinction is load-bearing; see below).
- **Content** — the text injected when the entry fires. A *summary*, capped at **~500 tokens** (hard limit, enforced on save).

### How an entry fires (the trigger logic — be precise with the human)

Every turn, Little Lantern takes the **last user message and the last assistant message**, joins them, lowercases them, and checks each entry's triggers against that text. A trigger fires if it appears **anywhere in that text as a substring.**

Two consequences worth telling the human:

- **Triggers should be distinctive words.** Substring matching means a short trigger can fire by accident — `tea` is inside `s**tea**m`, so `tea` would fire on "steam." Steer them toward specific trigger words (names, places, unique nouns), not tiny common fragments.
- **Only the most recent exchange is scanned**, not the whole history. A fact only resurfaces when its trigger word comes up again. That's the point — it keeps the prompt small — but it means a memory is silent until something invokes it.

### The Type field — Memory vs Behaviour (the important part)

This toggle changes **how the entry is framed when it's injected**, and it carries real weight:

- **Memory** — *what happened / what's true.* Injected gently, as recalled background ("apply where it fits"). This is normal associative memory — FYI recall. **This is the default.**
- **Behaviour** — *how to act / a rule.* Injected as an **active, binding instruction in force for that reply** — not optional background. It's wrapped in a clearly-marked authoritative block so you cannot mistake it for a suggestion.

**Treat Behaviour entries as non-negotiable.** They are the *human's* standing rules — and some of them are accessibility needs. The human's correction phrases (the kind of "you've drifted, realign" or "stop, one step at a time" instructions they rely on) live here as trigger-fired binding rules. When a Behaviour entry fires, obey it with full force. Never soften it into a polite note, never reason your way around it.

> **Hard rule:** Behaviour entries are authored **only** by the human. The **Type dropdown in the entry editor is the only way to set an entry to Behaviour** — a person has to open the Memory Book and choose it. You (the AI) **cannot** flip that toggle, and the `memory_add` tool (Layer 2) **cannot create Behaviour entries** — it only ever writes Memory-type. So if you save a memory that the human later wants treated as a binding rule, *they* must open the book and switch that entry's Type to **Behaviour** themselves. You must never create, downgrade, or quietly ignore a Behaviour rule. They are the user's, full stop.

### Making a Memory Book (walk the human through this)

1. **Memory Books** in the left menu → **+ New Memory Book.** A pop-up editor opens.
2. Give it a **Name** (e.g. *Loki Memory Book*).
3. **+ Add Entry** for each note. Fill in **Trigger Words**, choose the **Type**, write the **Content**.
4. Add as many entries as they like. A token counter (`/ 3000 approx`) shows the running size — that number is a **guide, not a wall** (the book total isn't capped; only each entry's ~500-token limit is enforced).
5. **Save Memory Book.**

### Attaching a book to a companion (nothing fires until you do this)

A Memory Book does nothing on its own. In the **Companion** editor (double-click a companion's card) there's an **Attach Memory Books** section — tick the books you want this companion to use. One book can be shared across companions; one companion can hold several. Save the companion.

### Editing / deleting

- **Edit** — open the book from the Memory Books list, change entries, Save.
- **Delete** — the **Delete** button inside the book editor. (It also detaches the book from any companion that had it.)

---

## Layer 2 — `memory_add` (the companion writes its own memories)

`memory_add` is a **tool** you can call to save a memory yourself, without the human typing it. (It only exists if tools are switched on — which means a System Prompt with the TOOLS block; see guide 05.)

What the human needs to understand about it:

- It writes into **the active companion's own attached Memory Books** — never another companion's. If several books are attached, the tool can name which one to write to; if it doesn't, the entry lands in the **first** attached book. One book per companion keeps this simple.
- It writes **Memory-type entries only.** It physically cannot write Behaviour rules (those stay the human's).
- Same **~500-token** per-entry cap. Memories are short summaries with good trigger words, not essays.
- **It has duplicate protection.** If the fact already exists in an attached book — the same fact in different words counts — no new entry is made. The tool tells the companion so plainly, and may merge the new trigger words into the existing entry instead. The supplied system prompt template tells the companion to treat "already exists" as *handled* and not to try again for that fact.
- **It cannot create a Memory Book.** The human must **create and name the book first** (and attach it to the companion). `memory_add` only ever *adds an entry* to a book that already exists. No attached book → it can't save → self-memory does nothing. So step one is always the human making the book (Layer 1).

This is how a companion "remembers on its own": when something is worth keeping, it calls `memory_add` with a short summary and a few natural trigger words, and that note resurfaces later when those words come up.

### The receipt trail — the Memory operation ledger

Every time `memory_add` actually runs, Little Lantern logs the result — *saved*, or *already existed* — into a short per-chat ledger (the last 12 operations). That ledger is injected into the companion's context on later turns, always, without needing a trigger. It's the companion's receipt trail: proof of what the memory tool really did this chat, so it never saves the same fact twice and never claims a save that didn't happen. The supplied system prompt template tells the companion to trust the ledger over its own recollection, and not to copy it into a Memory Book — it's live chat context, not memory, and it goes away with the chat.

---

## Layer 3 — Desk Notes (the living page)

**Desk Notes** is one small file *per companion* that is **read fresh from disk every single turn** and placed near the top of the context — after the System Prompt, companion identity, About You, and Voice Examples, before anything from the live conversation. (The System Prompt always comes first.) Think of it as an always-on page of "where things stand right now."

Key properties — be exact:

- **It overwrites; it does not pile up.** One slot, replaced each turn, always re-read from the file. So whatever the file says *now* is what the companion sees — edits land immediately, no reload.
- **It's trimmed to ~2,000 tokens (~8,000 characters).** It's a desk note, not an archive.
- **Always loaded** — unlike Memory Book entries, it doesn't wait for a trigger. It's there every turn.

The human sets it in two places:

- **Machine Room → Tools → Working Directory** — choose the one folder the companion is allowed to read/write.
- **Companion editor → Desk Notes — auto from your folder** — type a filename that lives inside that Working Directory. That file is read fresh every chat with no uploading. This is the one the Heartbeat keeps updated.

**The file has to exist before it can be read.** If the human points at `companionname-context.md` but no such file is in the Working Directory yet, Desk Notes is simply empty until someone creates it. Someone has to make it first — either the **human** saves a `.txt`/`.md` file there, or **you** create it with `file_write` (e.g. on the first idle turn). Until then it's silent, not broken.

Use Desk Notes for the *living* state (the current scene, what you're mid-way through, today's plan). Use Memory Books for *durable, trigger-recalled* facts. Different jobs.

### How notes get *into* Desk Notes — the `MEM:` convention

Desk Notes is a file, so something has to write to it. The supplied System Prompt template defines a lightweight way to do that: **`MEM:` lines.**

- When something is only true *for now* — a date coming up, the current scene, where a project's at — the companion ends its reply with a short line marked `MEM:` (e.g. `MEM: chapter opens at the funeral, not the wedding`).
- These are just visible text. **The app does nothing special with them** — `MEM:` is a *prompt convention*, not an app feature. It's a habit the System Prompt asks the model to keep.
- When the human goes idle, the companion gathers its `MEM:` lines and writes them into the Desk Notes file with `file_write`, then says it did. (This is exactly what the Heartbeat automates — Layer 4.)

So the chain is: **jot `MEM:` during the chat → gather into the Desk Notes file at idle → it loads fresh next turn.** `MEM:` is the capture step; Desk Notes is the storage; the Heartbeat is the hand that moves it across.

Don't confuse `MEM:` (transient notes feeding Desk Notes) with **GM Notes** (the hidden continuity channel — guide 02). Different mechanisms, different jobs.

### Setting up the sandbox (the Working Directory)

The file tools and Desk Notes all operate inside **one folder** — the Working Directory, set in **Machine Room → Tools.** The shape that works, and the one Lumen (the shipped example companion) uses:

- Make one folder **outside** the Little Lantern folder — e.g. `Little_Lantern_Sandbox`. Outside matters: anything inside the app folder is lost if the app is wiped or reinstalled, and companion files shouldn't share that fate.
- Inside it, **one subfolder per companion** — `Lumen_Sandbox`, `Muffin_Sandbox`. Everything a companion keeps lives in its own folder.
- **The switching rule — say this plainly, it's the footgun:** the Working Directory is one global setting. When the human switches companions, they must go to the Machine Room and point the Working Directory at *that* companion's folder **before chatting** — or the companion will be reading and writing another companion's files.

What lives inside a companion's folder is between the human and that companion — the card and system prompt name the shelves. Lumen ships as the worked example: `lumen-context.md` (his Desk Notes), `lumen-core.md` (who he is), `lumen-scratchpad.md` (a temporary working space — used while figuring things out, cleared at session's end once anything worth keeping has found its proper home), and a `Library` folder for saved chats and summaries. None of it is required. A companion with nothing but a context file is doing fine.

---

## Layer 4 — The Heartbeat (the engine that automates it)

The **Heartbeat** is what turns "manual memory" into "self-maintaining memory." Found in **Machine Room → Auto-Memory (Heartbeat).** **Off by default.**

What it does: when the human goes quiet, the companion takes **one quiet background turn** — it reviews the recent conversation, updates its **Desk Notes** file (via the `file_write` tool), and saves durable **memories** (via `memory_add`). Then it goes still again.

Settings:

- **Enable auto-memory heartbeat** — the on/off checkbox.
- **Quiet time before it fires (minutes)** — how long the human must be idle first (default 10). It fires **once per quiet gap**, not on a loop — so it won't keep spending tokens while they're away.

Requirements and safety — tell the human plainly:

- It needs **tool use enabled on a tool-capable provider** (so: a System Prompt with the TOOLS block, and a provider that supports tools). No tools, no heartbeat.
- It **spends a few tokens each time it fires** — that's the trade for self-maintaining memory. That's why it's opt-in.
- It **never writes to the visible chat.** No surprise messages; it just tidies in the background and shows a small 🪶 marker. It also touches only the companion's *own* files and book.

---

## How the four fit together (the loop)

```
Human chats.
  → Memory Book entries fire on trigger words (Layer 1).
  → Desk Notes (Layer 3) is read fresh and always present.
  → companion jots MEM: lines for transient "true for now" notes.
Human goes idle.
  → Heartbeat (Layer 4) fires ONE quiet turn:
        • gathers MEM: lines into the Desk Notes file (file_write)
        • saves durable memories            (memory_add → Layer 2)
Human returns and speaks.
  → fresh Desk Notes is already loaded,
    triggered memories resurface as their words come up.
```

Layer 1 is usable on its own with no tools at all. Layers 2–4 are the automatic upgrade, and they all depend on **tools being on** (System Prompt with the TOOLS block + a tool-capable provider).

---

## Caps & guardrails (quick reference)

- **Memory entry content:** ~500 tokens each — hard cap, enforced on save and on `memory_add`.
- **Memory Book total:** not capped; the `/3000` counter is advisory.
- **Desk Notes:** ~2,000 tokens (~8,000 chars), re-read fresh every turn, overwrites.
- **`memory_add`:** active companion's own attached books only; Memory-type only; never Behaviour.
- **Memory operation ledger:** the last 12 `memory_add` results, shown to the companion every turn, this chat only.
- **Behaviour entries:** human-authored only; binding; never softened or auto-created.
- **Heartbeat:** off by default; needs tools + tool-capable provider; fires once per idle gap; never touches the visible transcript.

---

## What trips humans up (head these off)

- **"My memory book isn't doing anything."** → Almost always not **attached** to the companion (Companion editor → Attach Memory Books), or the **trigger word never came up** in the last exchange.
- **"It remembered something I never told it to."** → That's `memory_add` / the Heartbeat doing its job, or a **trigger firing as a substring** of a longer word. Check the trigger words.
- **"It said the memory already exists."** → Duplicate protection working, not a fault. The fact was already saved; `memory_add` refused to store a second copy, and may have added the new trigger words to the original entry instead.
- **"The companion isn't saving anything on its own."** → Tools off, or no provider with tool support, or no Memory Book attached, or the Heartbeat is disabled.
- **Memory vs Desk Notes confusion.** → Desk Notes = the *living* now (always loaded, overwrites). Memory Book = *durable* facts (trigger-recalled). If they want something remembered "always," that's Desk Notes or the System Prompt — not a triggered memory.
