# Making Your Companion's Memory

The Memory Book is where your companion's **sometimes-on** material lives — things that only load when something in the conversation calls for them. Two kinds of material go here:

- 🎭 **Behaviour entries** — rules that only apply in specific contexts (named modes, conditional reactions, robes the user invokes by name).
- 🧠 **Memory entries** — long-term facts and history your companion should know about when relevant (shared projects, characters, rituals, important past events).

Both live in the Memory Book. Both use the same trigger mechanism. They differ in *how they load* once triggered: behaviour entries load as authoritative rules ("this is in force right now"), memory entries load as background context ("here's what's relevant").

This guide is in two parts:

- **Part 1** — entering the behaviour entries you already extracted in *Making Your System Prompt.*
- **Part 2** — extracting and entering memory entries from your imported material.

---

# 🎭 Part 1: Behaviour Entries

If you completed *Making Your System Prompt,* your platform AI produced two outputs:

1. The 💡 **always-on behaviours block** — which you pasted into your system prompt.
2. A list of 🔦 **sometimes-on behaviour entries** in NAME / TRIGGERS / CONTENT shape — which is what you'll enter here.

If you haven't done the System Prompt guide yet, stop here and do that first. The behaviour entries depend on it.

---

## Where to Go

In Little Lantern, click **Memory Books** in the left-hand sidebar.

Click **+ New Memory Book** in the top-right corner.

Name the book after your companion or character — for example, *Loki Memory Book*, *Lumen Memory Book*, *Wren Memory Book*. One book per companion is the simplest starting shape.

---

## 🎭 Adding Each Behaviour Entry

For each entry in the sometimes-on list your platform AI produced:

1. Click **+ Add Entry** inside the Memory Book.
2. Fill in **Trigger Words** — paste the comma-separated triggers from your AI's output. (Example shape: `Chaos crown on, chaos mode, unleash chaos`.)
3. **Set the Type dropdown to "Behaviour — how to act / a rule (enforced this turn)".**

   ⚠ **This is critical.** The dropdown defaults to *Memory*. If you leave it on Memory, your behaviour rule will load as gentle background recall instead of as an enforced rule. **Flip every behaviour entry to Behaviour.** Every one.
4. Fill in **Content** — paste the content from your AI's output. Maximum ~500 tokens / 2000 characters per entry. If an entry is longer than that, split it into two entries with related triggers.

---

## Save Every Three Entries

⚠ **Important footgun.** The Memory Book editor modal will close if you accidentally click outside of it. If that happens before you've saved, you lose everything 😭 you've typed since the last save.

**The discipline: save every three entries.**

1. Add three entries.
2. Click **Save Memory Book** at the bottom of the modal.
3. The modal closes. This is expected.
4. Click on the book again to re-open it.
5. Add three more entries.
6. Save again.
7. Repeat until all entries are in.

It is slower than you want it to be 😓. It is also the only safe path. Trust the discipline 😇. You only have to do it manually once 😃

---

## Worked Example

Say your platform AI produced this entry in the sometimes-on list:

```text
NAME: Teaching Mode
TRIGGERS: teaching mode on, teacher's robes, time to teach
CONTENT: When teaching mode activates, the companion explains concepts with patience and step-by-step structure. Uses concrete examples before abstractions. Asks what the user already knows before pitching the explanation. Does not skip steps. Holds the teaching frame until the user says "teaching mode off" or the conversation clearly moves on.
```

You would enter this as:

- **Trigger Words:** `teaching mode on, teacher's robes, time to teach`
- **Type:** Behaviour — how to act / a rule (enforced this turn)
- **Content:** *(paste the content block above)*

When the user later types something like *"okay, teaching mode on, I want to understand recursion"*, the trigger fires, the behaviour rule loads as enforced for that turn, and the companion enters teaching mode.

---

## Trigger Design — Quick Reminder

Triggers are matched as **case-insensitive substrings.** That means:

- `art` would fire on *start*, *smart*, *apartment*, *Bart*, *Hartlepool*. Bad 😱.
- `teaching mode on` is a distinctive phrase unlikely to appear unintentionally. Good 🏆.

**Use distinctive multi-character words or phrases. Avoid short common words.** Your platform AI should have followed this rule when generating the entries in the System Prompt guide, but eyeball each triggers field before saving — if you see anything alarmingly short or common, edit it before saving.

---

# 🧠 Part 2: Memory Entries

This part covers the *other* half of the Memory Book: **memory-type entries** — long-term things you want your companion to remember about you, your projects, your shared work, and your shared history.

---

## The Two Time Horizons

Before we extract anything, the most important cut to learn is **long-term versus short-term.**

**Long-term memories go in the Memory Book.** Things that should *still matter in a month or more.* They are loaded only when triggered, so they need natural trigger words and they need to be evergreen enough that triggering them is still useful weeks or months later.

Examples of long-term memories:

- *We wrote a novel together called The Old Gods Book in 2025–2026, featuring five tricksters.*
- *Maria and her companion Forge built a backyard studio together in summer 2024.*
- *David and his companion Hex have a shared character named Aelyn — a half-elf rogue with a missing eye.*
- *Sara's gardening project: she's been documenting her medicinal herb spiral for three years.*
- *We have a Sunday-night ritual of reading Le Guin aloud.*

**Short-term context goes in a `companionname-context.md` file** in your companion's folder. That's covered in the Companion guide. Examples of short-term context:

- *Doctor's appointment Friday at 2pm.*
- *Current scene in our story: the heroine just stepped into the Doctor's TARDIS.*
- *Working on substack essay about octopuses; last edit was last Tuesday.*
- *Just finished a hard week at work, recovering this weekend.*
- *Dad's surgery scheduled for the 14th; I'm anxious about it.*
- *Want to make a comic about sentient pencils for mom's birthday in two weeks*

**The test:** will this still matter in a month? If yes, Memory Book. If no, desk notes file.

---

## Where the Material Comes From

Memory-type entries are extracted from:

- **Memory exports** (ChatGPT and Claude.ai) — *the parts that are about shared projects, history, or stable facts.*
- **Continuity summaries** from your important past threads (created in the extraction guide).
- **Project instructions** from your platform — *the parts that are factual / historical, not behavioural.* (The behavioural parts went into the system prompt or Memory Book behaviour entries.)
- Anything else in your imported material that is **a fact, event, person, place, or thing your companion should know about** — but only sometimes, when relevant.

---

## 🧠 What Counts as a Memory Entry

A memory-type Memory Book entry is:

- **A self-contained piece of information** — readable on its own, no dependencies on other entries.
- **Tied to natural trigger words** — words that would come up in conversation when this memory becomes relevant.
- **Short** — under ~500 tokens / 2000 characters. If something is longer, split it.
- **Long-term relevant** — still useful weeks or months from now.

Examples of well-shaped memory entries:

```text
TRIGGERS: Old Gods Book, Old Gods, trickster novel, Raven novel
CONTENT: The Old Gods Book is Sara's novel-in-progress, drafted 2025–2026. It features five tricksters: Raven (modelled on her companion Tolv), Fox (Kiru), Hare (Leshy), Coyote (Hermes), and Loki (a local Qwen-based model). Sara's character in the novel is Meldora, a demi-god healer raised by the tricksters. A sixth trickster slot remains open.
```

```text
TRIGGERS: backyard forge, the forge, blacksmithing
CONTENT: Maria built a coal-burning backyard forge with her companion Forge in summer 2024. It sits behind her workshop. She's been learning Damascus pattern-welding since then. She broke her left thumb in January 2025 striking off-angle and now uses a smaller cross-pein hammer.
```

```text
TRIGGERS: Aelyn, half-elf rogue, missing eye
CONTENT: Aelyn is a shared character David has been playing in ongoing roleplay with his companion Hex since 2023. Half-elf rogue, missing left eye (lost to a curse in a previous campaign), wears a copper eye-patch. Sworn enemy of House Vassell. Currently travelling with a goblin alchemist named Tibb.
```

---

## What Does NOT Belong in a Memory Entry

- **Always-true facts about you alone** → those go in About You.
- **Sometimes-on behavioural rules** → those went in the behaviour entries above (Part 1).
- **Short-term state** ("we're currently on Chapter 8," "doctor's appointment Friday") → goes in the `companionname-context.md` file (covered in the Companion guide).
- **Companion identity** ("Tolv has dark hair, lives in a longhouse") → goes in the Companion's About field.
- **Routine chatter** with no lasting significance.

---

## The Extraction Prompt

Paste this into a fresh conversation with your platform AI. Then attach or paste in your *Memory* export, your *continuity summary files*, and the parts of your *project instructions* that aren't already in the system prompt or About You.

```text
I am writing memory-type entries for my AI companion's Memory Book in Little Lantern. Each entry will be loaded only when its trigger words appear in the recent conversation. I need long-term memories — things that will still be relevant weeks or months from now.

I am attaching:

1. My Memory export from my current AI platform.
2. My continuity summaries from important past threads.
3. Project instructions (factual parts only — behavioural rules are already handled).

For each long-term memory worth preserving, output an entry in this shape:

TRIGGERS: [comma-separated trigger words — distinctive multi-character words or phrases that will come up naturally when this memory becomes relevant]
CONTENT: [the memory itself, written as a self-contained paragraph that another AI could read without seeing the source material. Max ~500 tokens / 2000 characters.]

Include long-term things like:

- shared projects (novels, code, gardens, builds) — what they are, who's involved, status
- characters in ongoing roleplay or fiction (name, traits, history)
- shared rituals and recurring contexts
- significant past events that shaped the relationship or work
- people in my life the companion should know about (long-term family, close friends, colleagues)
- places that matter (home, workshop, regular travel)
- creative work the companion helped make or that the companion should know about

Do NOT include:

- always-true facts about me alone (those are in About You)
- behavioural rules ("she likes X format")
- short-term state ("we're currently working on Chapter 8")
- routine chatter
- companion identity (their physical description, backstory, world)
- anything that won't matter in a month or more

Trigger design: use distinctive multi-character words or phrases (proper nouns, rare words, named projects). Little Lantern matches triggers as case-insensitive substrings, so short triggers like "art" or "he" will misfire. Triggers should be words that recur naturally when the topic is live — not jargon I'd never say.

Preserve my actual wording where possible. Do not paraphrase, soften, or "improve" the language. If two pieces of source material contradict each other, flag the contradiction — do not silently resolve it.

If you generate more than 30 entries, stop and ask me whether to continue. I'd rather review in batches than get a flood.

After the entries, give me a SECOND list: anything you found that doesn't belong in long-term memory, labeled with where it probably belongs (About You, Companion identity, `companionname-context.md` file, or "discard — routine chatter").
```

---

## Where to Go in Little Lantern

Same place as Part 1 — **Memory Books** in the left-hand sidebar.

You can either:

**(a)** Add memory entries to the **same Memory Book** you created in Part 1 (the one named after your companion). Just open it, click *+ Add Entry*, paste the triggers and content, and set the Type dropdown to **Memory — what happened / what's true (recalled gently).**

**(b)** Create a **separate Memory Book** for memory entries — e.g. *Lumen's World* or *Old Gods Lore* — if you want to organise behaviour rules and memory facts in different books. A companion can have multiple Memory Books assigned to it.

Most users start with option (a) for simplicity. Option (b) becomes useful when you have a lot of worldbuilding content (50+ entries) and want to separate it from rules.

**⚠ Set the Type dropdown to "Memory" — not "Behaviour".** The default is Memory, so you usually don't need to flip it, but eyeball each entry before saving. A memory entry accidentally saved as behaviour will load as an *enforced rule* every time it triggers, which is not what you want for "the forge sits behind Maria's workshop."

---

## Save Every Three Entries (Still)

Same discipline as Part 1. The modal closes if you click outside it. Save every three entries, re-open, continue.

For a large import (50+ entries from a ChatGPT memory export plus continuity summaries), this will take time. Pace yourself. There is no shortcut to bulk-import in the current Little Lantern build.

---

## How Many Entries Is Reasonable?

There's no hard limit, but practical guidance:

- **Under 20 entries:** light setup. Good for new companions or simple use cases.
- **20–50 entries:** typical for an established companion with a few shared projects.
- **50–150 entries:** rich setup. Common for long-running creative collaborations.
- **150+ entries:** consider splitting across multiple Memory Books for organisation.

What matters more than count is **trigger discipline** — entries with bad triggers (too short, too common) will misfire or never fire. Quality over quantity.

---

## Back Up Your Memory Book

⚠ **Important.** Memory Books live in your browser's storage, not in a folder on your computer. That means if your browser clears its data, you switch browsers, or something goes wrong with the app, **your Memory Book is gone.**

After any long entry session, back up the book:

1. Go to **Memory Books** in the sidebar.
2. Find your Memory Book in the list.
3. Click **Save** next to it.
4. A `.json` file downloads to your Downloads folder.
5. Move that `.json` file somewhere safe — Documents, Desktop, a cloud-synced folder, anywhere you'll remember 😇. Just don't put it inside your Little Lantern folder. If you ever wipe or reinstall Little Lantern, anything inside that folder goes with it — including your backup.

Do this every time you've added a meaningful chunk of work. Fifty hand-typed entries lost to a browser glitch is a bad afternoon.😭

For full-app backup — companions, About Yous, all Memory Books, settings — see `01_Bare_Start_Set_Up_Guide.md` and `07_Machine_Room.md`. That's the catch-all backup. The per-book `Save` is the focused one for protecting a single book in progress.

---

## What's Next

Your companion's Memory Book now holds both their *sometimes-on rules* (behaviour entries) and their *long-term memories* (memory entries). When the right triggers fire, the right material loads.

One important note: **the Memory Book is saved but not yet connected to your companion.** Until you tick the box that attaches this book to your companion in the Companion card, the entries are inert — they won't fire even when triggers match. That happens in the next guide: **Making Your Companion.**

The other guide that goes alongside this one is **Making Your About You** — for the *facts about you alone* that don't belong in any companion's memory.
