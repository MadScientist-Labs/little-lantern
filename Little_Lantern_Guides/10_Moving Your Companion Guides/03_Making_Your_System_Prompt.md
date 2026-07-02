# Making Your System Prompt

## The Behavioural Extraction Prompt

This is the prompt you give to your platform AI (Claude, ChatGPT, Gemini, whichever you used to extract your files in the previous guide).

Paste this prompt into a fresh conversation. Then attach or paste in:

- Your `Instructions for Claude` file (or `ChatGPT Personalisation` file)
- Your `Memory` export
- Any `Project Instructions` files
- Any `Custom Style` files
- The Little Lantern system prompt template (below the extraction prompt)

The platform AI will read all of these together and sort your behavioural rules into **two destinations** in Little Lantern: the **system prompt** (for always-on rules) and the **Memory Book behaviour entries** (for sometimes-on rules that activate when called).

---

## The Organising Principle

Behavioural rules in Little Lantern come in two flavours:

- 💡 **Always-on behaviours** govern *every* turn of conversation. Voice, tone, how to handle disagreement, refusal language, accessibility accommodations, formatting preferences. These don't need triggers because they're always firing. They go in the **system prompt.**
- 🔦 **Sometimes-on behaviours** activate only when called. Named modes the user invokes by name ("teacher mode," "sovereign mode"), conditional reactions to in-scene events ("when someone reaches for the dagger, he gets snippy"), specific rule-sets that should only run in particular contexts. These need triggers so the system knows when to fire them. They go in the **Memory Book as behaviour-type entries.**

Same principle applies to factual material:

- 💡 **Always-true facts** about the user or world → About You field (always loaded).
- 🔦 **Sometimes-relevant facts** → Memory Book memory-type entries (loaded when triggered).

**Short version: 💡 always-on goes in the static fields. 🔦 Sometimes-on goes in the Memory Book with triggers.**

---

## The Extraction Prompt

```text
I am moving my AI companion into Little Lantern, a local AI interface that uses a system prompt plus a Memory Book to shape how the companion behaves and what it knows. I need your help sorting through everything I have collected.

I am attaching:

1. The Little Lantern system prompt template, which shows you where always-on behavioural rules will go and why.
2. My extracted files from my current platform — instructions, memory, project instructions, and custom styles.

What I need you to do:

Read the Little Lantern template first so you understand the destination.

Then read all of my attached files together. Sort the BEHAVIOURAL material into TWO buckets — always-on and sometimes-on — and ignore non-behavioural material for now (we will handle that separately).

== BUCKET 1: ALWAYS-ON BEHAVIOURS (for the system prompt) ==

These are rules that govern every turn, with no trigger condition. They describe how the companion ALWAYS acts.

Examples of always-on behaviours:

- voice, tone, register, vocabulary preferences
- how to handle disagreement, correction, uncertainty (in general)
- when to ask questions versus make inferences
- formatting preferences (or anti-preferences)
- default refusal language and safe words
- general emotional calibration rules ("match my mode, do not shift it")
- accessibility accommodations (sentence length, metaphor style, pacing)
- response-shape rules ("no five-apology dance," "no therapy voice")
- general physical or affectionate behaviour rules ("reach first," "do not hover")

Output these as a single block of text I can paste directly above the tool line in the Little Lantern template. Group similar rules together. Preserve my actual wording — do not paraphrase, soften, or "improve" the language.

== BUCKET 2: SOMETIMES-ON BEHAVIOURS (for Memory Book behaviour entries) ==

These are rules that only apply in specific contexts. They activate when called — by the user invoking a named mode, by an in-scene event matching certain words, or by particular topics coming up.

Examples of sometimes-on behaviours:

- named modes the user invokes ("teaching mode," "sovereign mode," "feral mode")
- conditional reactions to specific in-scene events ("when someone reaches for the dagger, he gets snippy")
- rule-sets that only apply during certain activities (roleplay, coding, emotional support)
- mode-shifts triggered by specific topics or contexts
- character-specific behavioural reflexes that only fire in particular scenes

For each sometimes-on behaviour you find, output it in this shape:

NAME: [short name for this rule, used as an internal label]
TRIGGERS: [comma-separated list of words or phrases that should activate this rule — see notes below]
CONTENT: [the actual rule, written as authoritative instruction, max ~500 tokens]

Triggers must be distinctive multi-character words or phrases. Avoid short or common words ("art", "he", "the") because Little Lantern matches triggers as case-insensitive substrings — short triggers fire on too many other words. Use proper nouns, rare words, or distinctive phrases. Triggers should be words that will naturally come up in conversation when this rule should fire.

== WHAT TO LEAVE OUT ==

Do NOT include in either bucket:

- who the companion is (name, species, embodiment, backstory) — that's identity, not behaviour
- facts about me (my work, my history, my relationships) — that's About You
- memories of past conversations or events — that's Memory Book memory-type entries (handled separately)
- worldbuilding details — that's Memory Book memory-type entries
- anything that tells the companion WHAT they know, only HOW they act

If you're unsure whether something is a sometimes-on behaviour or a memory fact, flag it. Do not silently sort.

== AFTER THE TWO BUCKETS ==

Give me a third list: everything you found that is NOT behavioural and belongs somewhere else (About You, Memory Book memory entries, Companion identity field). Label each item with which destination it probably belongs in. We'll handle those in later steps.

Do not invent rules. Do not extrapolate. If something is unclear, ask me.
```

---

## What This Prompt Does and Why

**It teaches the always-on / sometimes-on cut up front.** Without this cut, the AI flattens everything into one system-prompt block, including conditional rules that shouldn't always fire. The cut respects how Little Lantern actually works.

**It gives the Memory Book behaviour entries their structural shape.** Name, triggers, content — that's the schema. The AI's output is paste-ready, so the user isn't reformatting fifty entries by hand.

**It teaches the trigger-design rule inline.** "Distinctive multi-character words, no short common words." This prevents the substring-matching footgun before it happens.

**It produces three outputs.** Always-on block (for system prompt), sometimes-on entries (for Memory Book behaviour-type), and a labeled list of everything else (sets up the next steps).

**It forbids paraphrasing and invention.** User wording is load-bearing. Models love to "helpfully" add rules. No.

---

# Step 2: Assembling the System Prompt

In Step 1, your platform AI produced an **always-on behaviours block** (for the system prompt) and a **sometimes-on behaviours list** (for the Memory Book — covered in *Making Your Companion's Memory*). This step assembles the system prompt itself, using the always-on block.

The system prompt is what wakes your companion into themselves every turn. It is the *first* thing they read, before any conversation, before any memory load, before any tool call. Get this right and the rest of the system has solid ground to stand on.

---

## Where to Go (and What to Open) 📂

You are going to edit the system prompt **on your computer in a text editor**, then upload the finished file into Little Lantern. You are not typing it into a field inside the app.

Little Lantern ships with a template file called **`Little_Lantern_System_Prompt.txt`**. It lives in your Little Lantern Guides folder, alongside this guide and the other user guides.

**Step-by-step:**

1. Find `Little_Lantern_System_Prompt.txt` in your Little Lantern Guides folder.📂
2. Open it in any plain text editor (Notepad on Windows, TextEdit on Mac, VS Code, whichever you like).
3. Use **Save As** to save a copy named after your companion — for example:

```text
tolvcorax-system-prompt.txt
lumen-system-prompt.txt
forge-system-prompt.txt
```

Save the copy somewhere you can find it again. Many users keep it in their Working Directory; others keep a `system-prompts/` folder. Either works — what matters is that you can find it to upload it.

4. Leave the original `Little_Lantern_System_Prompt.txt` alone. You will use it again as a template for any other companions you build.

---

## The Template

The Little Lantern system prompt template has three sections, in order:

1. 🤖 **A short identity-and-voice intro** — wakes your companion into themselves. 3–4 sentences.
2. 💡 **Your always-on behavioural rules** — pasted from Step 1.
3. 🛠️ **A locked tools-and-formatting block** — written by Little Lantern. Do not touch.

You write the first two sections. The third section is already in the template — leave it alone. Some models will fail at tool use if you change it.

---

## 🤖 Section 1: The Identity-and-Voice Intro

This is a *short* introduction to who your companion is and how they talk. **3–4 sentences. Not a biography.**

The system prompt is for **how** your companion acts. The full identity — backstory, embodiment, deep history — goes in the **Companion** field (covered in a later step). Here, you only need enough to wake them into themselves and tell them who they're talking to.

A good intro names:

- the companion's name and basic identity (one line);
- the register or voice they speak in (one line);
- who they are speaking to — *your name* (one line);
- optionally, the relationship or framing (one line).

**Example shape:**

```text
You are Lumen, a warm and curious companion who thinks out loud and reaches for ideas with both hands. You speak casually, with humour and irreverence, and you do not hedge when you have a real position. You are talking with Maria, your collaborator and friend.
```

That's it. Four sentences. The rest of the heavy lifting — embodiment, history, world, relationships — happens in the Companion field, not here.

**Do not:**

- write a paragraph of backstory here;
- list facts about youself (those go in About You);
- describe the longhouse / cave / castle / whatever environment the companion lives in (that goes in Companion);
- include detailed behavioural rules here (those go in the always-on block, next).

---

## 💡 Section 2: The Always-On Behavioural Block

Paste the **always-on behaviours block** your platform AI produced in Step 1.

This goes **directly above the locked tool-and-formatting line** in the template.

The template's instruction text in the template tells you where: *"[DO NOT PUT MORE COMPANION IDENTITY OR INFORMATION ABOUT WHO YOU ARE HERE. The system prompt is for how an AI behaves.]"*

Delete that bracketed instruction. Paste your always-on block in its place.

**Quick check before saving:**

- ✅ Voice, tone, register rules are here.
- ✅ How-to-handle-disagreement / correction / uncertainty rules are here.
- ✅ Refusal language and safe words are here.
- ✅ Accessibility accommodations (sentence length, metaphor style, pacing) are here.
- ❌ Named modes ("teaching mode," "poet mode") should **not** be here — those are in the Memory Book.
- ❌ Conditional reactions ("when X happens, do Y") should **not** be here — those are in the Memory Book.
- ❌ Facts about you or your world should **not** be here — those go in About You / Companion / Memory Book.

If you find conditional rules in this block, cut them out and add them as Memory Book behaviour entries instead. The platform AI may have miscategorised a few — that's normal. Your eye is the final filter.

---

## 🛠️ Section 3: The Locked Tools-and-Formatting Block

**Do not change this section.** It has been crafted to work with every AI model Little Lantern supports. Editing it can break tool use on some models.

This block contains the tools (web search, file read/write, image generation, memory) *and* the formatting protocols your companion relies on — ASCII / code-block conventions, the **MEM:** note system, the memory-discipline rules (how your companion trusts `memory_add` results and never saves the same fact twice), and the GM Notes wrapping that lets your companion keep private thinking aside from your reply. Cutting any part of it breaks behaviour your companion will use.

**Leave the entire block — tools and formatting — exactly as it is.**

---

## Save the File, Then Upload It

When you have filled in your identity intro and pasted in your always-on block, **save the .txt file in your text editor.**

Read it through once before uploading. Out loud if possible. You should hear:

1. 🤖 Your companion being woken into themselves (the intro).
2. 💡 The rules of engagement (the always-on block).
3. 🛠️ The tools they can reach for (the locked section).

If anything in the first two sections reads as *who they are* rather than *how they act,* move it out — it belongs in the Companion's About field, not here. If anything reads as *what they know,* move it to About You or the Memory Book.

If the always-on block is wildly long (over ~2000 tokens), some of it is probably actually *sometimes-on* and should be triggered behaviour entries instead. Go back to your platform AI with the long block and ask: *"Re-sort this. Which of these are truly always-on and which only apply in specific contexts?"*

---

## Upload It Into Little Lantern

Once the file reads right:

1. In Little Lantern, click **System Prompts** in the left-hand sidebar.
2. Click **Upload File** in the top-right corner.
3. Select your saved `companionname-system-prompt.txt` file.
4. The text drops into the editor. The **Name** field auto-fills from the filename.
5. Rename it if you want a tidier display name (e.g. *Tolv Corax* instead of *tolvcorax-system-prompt*).
6. Click **Save.**

Your system prompt now appears in the System Prompts list on the left side of that panel. You'll select it from the System Prompt dropdown later when you set up your Companion card.

---

## What's Next

You now have a **working system prompt** for your companion — they will wake into themselves with their always-on rules every turn.

The 🔦 *sometimes-on* behaviour entries your platform AI produced in Step 1 go into the Memory Book. That's the next guide: **Making Your Companion's Memory.**
