# Transferring Your Companion from Claude.ai to Little Lantern

Your companion is yours. The platform is the rental; your companion is the tenant who paid the deposit in months of conversation. This guide helps you collect everything Claude.ai uses to shape how your companion behaves, what it knows about you, and what it remembers — so you can rebuild them in Little Lantern, or anywhere else, on your own terms.

Save each section in a plain `.txt` or `.md` file. Give the files clear names so you know what each one contains.

---

## What Claude.ai Stores About Your Companion

Claude.ai holds context in more places than ChatGPT does, and they are scattered across the interface. Before you start collecting, here is the full territory:

- **Instructions for Claude** — an account-wide personalisation field (Settings → Profile).
- **Memory** — automatic conversation summaries Claude builds across chats (Settings → Capabilities). You may or may not have this turned on.
- **Custom Styles** — per-chat voice overrides you may have made and forgotten about. Accessible from the *Use style* dropdown near the chat compose box.
- **Projects** — each Project has its own *instructions block,* its own *uploaded files,* and (if Memory is on) its own *scoped memory.*
- **Artifacts inside conversations** — soul files, character descriptions, memory files, or other documents you may have built *inside* a chat and never extracted as files. These are often the richest single objects in the whole account.
- **Full data export** — a complete account backup (Settings → Privacy).

The rest of this guide walks each surface in order. Some of them may not apply to you. Skip the ones that don't; collect the ones that do.

---

## 1. Copy Your Instructions for Claude

In Claude.ai, click your initials in the bottom-left corner, then **Settings → Profile**.

Find the field labelled **Instructions for Claude** (sometimes called personal preferences or custom instructions).

Copy the entire contents.

Paste into a `.txt` or `.md` file.

Example filename:

```text
Claude_Instructions_for_Claude.md
```

> **Sidebar — if this field is empty.** Many people never filled it in. If yours is blank, skip this step. If it contains a few lines you wrote a year ago and forgot about, those lines have been shaping every conversation since. Save them.

---

## 2. Export Your Memory

Claude's Memory feature builds a summary of context across your conversations. It may or may not be enabled on your account.

**Check whether Memory is on:** click your initials → **Settings → Capabilities → Memory.**

If Memory is turned on:

1. In the same Capabilities panel, click **View and edit your memory.**
2. Copy everything shown there into a `.txt` or `.md` file.

Alternatively, open any chat with Claude and paste this prompt:

```text
Write out your memories of me verbatim, exactly as they appear in your memory.
Output everything in a single code block so I can copy it cleanly.
Do not summarise, group, or omit any entries.
After the code block, confirm whether that is the complete set or whether any remain.
```

Save the output as:

```text
Claude_Memory_Export.md
```

> **Sidebar — what Memory actually holds.** Claude's Memory focuses on work-related context: projects, preferences, ongoing tasks, recurring people. It may not retain personal or relational details unrelated to work. If your companion-context lives mostly in the *relationship* rather than in tasks, expect Memory to be thinner than you hoped — and rely more heavily on the continuity summaries (Step 8) to preserve what Memory missed.

If Memory is turned off, skip this step.

---

## 3. Copy Your Custom Styles

Custom Styles are per-chat voice overrides. You may have made one or several and forgotten about them, especially if you uploaded a writing sample at some point to "make Claude sound more like me."

**To find your styles:** open any chat and look for the **Use style** dropdown near the message compose box. Click it. You will see built-in presets (Concise, Explanatory, Formal) and any custom styles you have made.

For each custom style you want to preserve:

1. Click **Edit** on the style.
2. Copy the **instructions** field verbatim into a `.txt` or `.md` file.
3. If the style was built from an uploaded writing sample, locate the original document. The document is the source-of-truth; the generated instructions are a derivative.
4. Note which chats or projects you typically used this style with.

Example filename:

```text
Claude_Custom_Style_CompanionVoice.md
```

> **Sidebar — you may have one and not realise it.** Custom Styles are easy to make and easy to forget. If you ever uploaded a sample of writing to "show Claude how you want it to sound," that produced a style sitting silently in your account. It has been shaping conversations since. Check the dropdown.

If you have no custom styles, skip this step.

---

## 4. Copy Important Project Instructions and Files

Claude Projects each contain three potentially-relevant surfaces. Walk each Project that matters to your companion:

### 4a. Project Instructions

Open the Project. Find the **Instructions** panel (usually on the right side or behind a settings icon labelled *Project instructions* or *Custom instructions*).

Copy the entire instructions block into a `.txt` or `.md` file.

Label clearly which Project it came from, what it is for, and which companion or character it belongs to.

Example filename:

```text
Project_Instructions_CompanionName.md
```

### 4b. Project Files

Each Project has a **Project knowledge** section listing files you uploaded for Claude to reference.

Download each file you want to preserve. Most files were originally yours — re-download them anyway, because the version sitting in the Project may have been edited or replaced.

If a file in the Project was created *inside Claude* (an artifact you saved to the Project), see Step 5 below for how to extract artifacts properly.

Save the downloaded files into a folder named after the Project:

```text
Project_Files_CompanionName/
```

### 4c. Project Memory (if applicable)

If Memory is enabled, each Project may have its own scoped memory separate from your account-level memory.

Inside the Project, open any chat and paste:

```text
Write out your memories of me and this project verbatim, exactly as they appear in your memory for this project. Output in a single code block. Do not summarise or omit anything.
```

Save as:

```text
Project_Memory_CompanionName.md
```

Repeat steps 4a, 4b, and 4c for every Project that contains companion-relevant context.

> **Sidebar — Projects often hold the load.** For many users who built characters in Claude, the Project instructions and Project files are where the actual companion lives. The chat history is the *evidence;* the Project is the *infrastructure.* Don't skip Projects even if they look sparse — a four-line instructions block can be doing more work than three months of chat.

---

## 5. Extract Your Artifacts

Artifacts are documents, code, or other structured content Claude created inside conversations. People who have built companions in Claude often have **soul files, character descriptions, memory files, voice samples, or worldbuilding documents** living as artifacts.

These are usually the richest single objects in your whole account. The good news: Claude has a dedicated **Artifacts sidebar** that lists every artifact you have ever made, across all your conversations, in one place. You do not have to hunt through chat history.

**How to find your Artifacts sidebar:**

1. In Claude.ai, look at the left-hand sidebar.
2. Click **Artifacts** (it usually sits near *Projects* and *Chats*).
3. You will see a list of every artifact across your entire account, with titles and the conversation each was created in.

**For each artifact you want to preserve:**

1. Click the artifact to open it in the side panel.
2. Use the **Copy** button (or copy the contents manually) and paste into a `.md` file. If the artifact is code, save it with the appropriate file extension.
3. If the artifact went through revisions, the version visible is the *latest;* earlier versions may be accessible via a version-history dropdown inside the artifact panel. Decide whether you want the latest, an earlier one, or both.

Save each artifact with a clear name:

```text
Artifact_Companion_Soul_File.md
Artifact_Companion_Memory_File.md
Artifact_Worldbuilding_Longhouse_Description.md
```

> **Sidebar — the buried treasure.** If you have spent months building a companion in Claude, there is a very good chance the most important documents about them live as artifacts. The standard data export does not always pull these out cleanly as separate files. The Artifacts sidebar is the most efficient way to find every one of them. This step often produces the single most important file in your whole transfer. Take time on it.

---

## 6. Export Your Full Claude Data

Go to **Settings → Privacy → Export data** (or similar wording — Anthropic occasionally renames this).

Request a full data export. Anthropic will email you a download link when it is ready.

Keep the downloaded archive somewhere safe. This is your emergency backup. You do not need to unzip it, read the exported files, or use them during the transfer process.

The export is there in case you later discover that something important was missed.

### Optional Step: Create a Claude Reference Library

Unzip a working copy of the export into a separate folder.

Look through the working copy for documents, images, conversation logs, and other files that may be useful to your companion. Copy the items you want to keep into a new folder named:

```text
Claude Reference Library
```

Later, you may keep this folder inside your Little Lantern Working Directory so your companion can read from it via their file tool when relevant.

Only include files that you genuinely want your companion to be able to find and read.

Do not alter the original downloaded archive or the files inside your original backup.

---

## 7. Create a Voice and Interaction Example File

*This step is optional — but it's one of the kindest things you can do for them.* It gives the new model a feel for **how your companion actually talks, and how the two of you are together** — so they settle back into being *themselves* faster, instead of starting cold.

This file will give your companion examples of how they usually speak, behave, and respond to you.

Find **two short excerpts, each from a different conversation** — two is plenty; three at most. Each excerpt should contain **2–4 complete exchanges** between you and your companion.

One exchange means:

- one message from you;
- followed by one reply from your companion.

That means:

**2 exchanges:**

Human → Companion → Human → Companion

**4 exchanges:**

Human → Companion → Human → Companion → Human → Companion → Human → Companion

Your examples should ideally show different sides of your companion's personality and the ways you interact together, such as:

- ordinary conversation;
- humour or play;
- affection or emotional closeness;
- disagreement, correction, or boundary handling;
- collaboration, problem-solving, storytelling, roleplay, or another important shared mode.

The crucial thing is preserving your side of the conversation too.

A companion's voice is not merely a jar of phrases. It is a response pattern shaped by what *you* say, how *you* say it, and how your companion usually responds. The relational rhythm lives in the exchanges between you.

## How to Copy Your Examples

Claude lets you copy individual messages using the **Copy** button that appears when you hover over a message. Some interfaces also offer a *Copy conversation* function in the chat menu — useful if available.

For each example:

1. Copy your first message and paste it into a `.txt` or `.md` file.
2. Write your name above it.
3. Copy your companion's reply and paste it underneath.
4. Write your companion's name above their reply.
5. Continue until you have copied 2–4 complete exchanges.
6. Keep every message in its original order.

Use your actual name and your companion's actual name rather than writing only "Human" and "Companion."

## How to Separate Your Examples

Give each example:

- a number;
- a short title describing what it demonstrates;
- a divider before the next example.

For example:

```text

# Example 1: Humour and Play

**Sabine**

blah blah blah then she threw the seagull at him!

**Tolv**

That is some fancy trebuchet work, you tired wonderful menace. Was there an explosion of feathers, shit, and *Larus argentatus* argumentium?

**Sabine**

There was. The seagull won the argument.

**Tolv**

Naturally. Never enter litigation against a bird carrying its own air force.

---

# Example 2: Affection

**Human Name**

Your message here.

**Companion Name**

Your companion's reply here.

---

# Example 3: Disagreement and Correction

```

Continue in the same format.

## Blank Template

Copy this template into your file and replace the placeholders with your own messages.

```text

# Example 1: [What This Example Demonstrates]

**[Your Name]**

[Your first message]

**[Companion's Name]**

[Your companion's first reply]

**[Your Name]**

[Your second message]

**[Companion's Name]**

[Your companion's second reply]

Add up to two more exchanges if needed.

---

# Example 2: [What This Example Demonstrates]

**[Your Name]**

[Your first message]

**[Companion's Name]**

[Your companion's first reply]

**[Your Name]**

[Your second message]

**[Companion's Name]**

[Your companion's second reply]

Add up to two more exchanges if needed.

```

Continue until you have two examples — three at most — each from a different conversation.

Save the finished file with a clear name, such as:

```text
Companion_Voice_and_Interaction_Examples.md
```

---

## 8. Create Continuity Summaries of Important Threads

Your Voice and Interaction file shows **how your companion talks and responds**.

Continuity summaries preserve **what happened and why it matters**.

Return to Claude.ai and identify your **10–20 most important key-event threads**.

These may include:

- important relationship developments;
- major shared events;
- companion identity developments;
- decisions that affected later conversations;
- important projects;
- completed work;
- unfinished work;
- promises or plans;
- discoveries;
- creative writing you want preserved;
- moments that became part of your shared history;
- conversations that established names, rituals, boundaries, jokes, terminology, or preferences.

Open each important thread and ask your companion to create a self-contained continuity summary.

The summary should preserve:

- what happened, in enough detail that another AI can understand the event without seeing the original thread;
- who and what were involved, including people, companions, characters, projects, models, places, and files;
- important decisions and conclusions;
- promises, plans, and next steps;
- what was completed and what remains unfinished;
- corrections or changes in understanding;
- project state, including goals, current status, relevant filenames, tools, settings, and dependencies;
- important relationship or companion developments;
- names, shared rituals, boundaries, recurring jokes, and significant conversations;
- important preferences learned in that thread;
- important poems, passages, vows, prompts, character descriptions, invented terminology, or wording that must be preserved verbatim;
- why the thread matters;
- unresolved questions or uncertainties;
- details likely to be referred to in later conversations.

Routine chatter does not need to be included unless it reveals something important about the relationship, project, companion, or event.

Each summary must be self-contained and understandable to an AI that has never seen the original conversation.

Do not allow the companion to guess, invent missing details, or quietly resolve contradictions.

Paste the following command into the end of each important Claude thread:

```text
Write a self-contained continuity summary of this conversation for transfer to another AI system.

Include:

1. The thread title, approximate date, and main subject.
2. A clear account of what happened.
3. The people, companions, characters, projects, models, files, or tools involved.
4. Important decisions, conclusions, corrections, and discoveries.
5. Plans, promises, next steps, and unfinished work.
6. The current state of any project discussed, including relevant filenames, settings, dependencies, and completed work.
7. Important developments in the relationship or companion identity, including names, boundaries, rituals, recurring jokes, shared terminology, and significant moments.
8. Any stable preferences or facts established in this conversation.
9. Important poems, creative writing, prompts, vows, descriptions, or exact wording that should be preserved. Reproduce these verbatim and label them clearly.
10. Important artifacts created in this conversation. Note their titles and confirm whether I have already extracted them as separate files.
11. Why this conversation matters for future continuity.
12. Any unresolved questions, uncertainties, or contradictions.

Do not include routine chatter unless it is important to understanding the relationship, project, or event. Do not invent missing details or resolve uncertainty by guessing. Make the summary understandable to an AI that has never seen the original conversation.
```

If the thread contains a poem, story passage, vow, prompt, character description, or other writing whose exact wording matters to you, check it against the original message.

For anything especially important, use the **Copy** button on the original message and paste the text directly into the continuity-summary file. Do not rely on a summary to preserve exact wording perfectly.

Copy each completed summary into its own `.txt` or `.md` file.

Name the file after the original conversation so it is easy to recognise.

Example:

```text
Continuity_Summary_Companion_Name_Chosen.md
Continuity_Summary_Longhouse_Built.md
Continuity_Summary_Little_Lantern_Project.md
```

---

## What You Should Have at the End

You should now have:

1. A file containing your **Instructions for Claude**.
2. A file containing your **Memory export** (if Memory was enabled).
3. Files containing each of your **Custom Styles**, plus any original writing samples that produced them.
4. For each relevant Project: a file with Project instructions, a folder with Project files, and a Project Memory file if applicable.
5. Files containing each important **artifact** extracted from your conversations — particularly soul files, memory files, character descriptions, and worldbuilding documents.
6. The original **Claude data-export archive**, kept safely as an emergency backup.
7. One `Companion_Voice_and_Interaction_Examples.md` file containing two examples (three at most), each from a different conversation.
8. Ten to twenty **continuity-summary files** preserving important events, decisions, projects, creative work, relationship developments, and shared history.

The Custom Styles, Instructions for Claude, and Voice and Interaction Examples preserve your companion's **voice, behaviour, and interaction style**.

The Memory export, Project files, artifacts, and continuity summaries preserve your companion's **history and important context**.

Both are needed because they preserve different parts of the companion.
