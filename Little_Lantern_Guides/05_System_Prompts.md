# Little Lantern — System Prompts (the ground rules under a companion)

**This is written to *you*, the AI assistant.** A **System Prompt** is the deepest, most authoritative set of instructions a companion runs on — the standing rules *underneath* the character. It is also **what makes the tools work.** The human starts from a ready-made template, edits the top, names it, and reuses it. This guide walks them through it. One step at a time, keep it warm.

---

## What a System Prompt actually is

When the human chats, their message is just that — a message. A **System Prompt** sits *beneath* the whole conversation as the **rulebook you follow.** AI providers treat it as the top-level, authoritative instruction — it outranks anything typed in the chat. So it's the right home for *how you should behave* and *how you use the tools.*

Think of it as the **operating manual** for a companion:

- how to act, what tone to hold, what never to do
- **how to use the tools** (web search, files, calculator, images, memory) — this is the part that actually switches the tools on
- house formats — like how to write GM Notes
- any standing rule the human wants honoured on *every* message

---

## Read this first: a System Prompt is REQUIRED for tools

This is the part the human is most likely to miss, so say it plainly and early:

**If they want any model to use the tools, they need a System Prompt — and it must contain the TOOLS block.** Little Lantern ships with a ready-made template, **`Little_Lantern_System_Prompt.txt`**, that already has it. Without that block, many models simply won't use the tools — they'll say they "can't," or invent a result instead of really searching the web or reading a file.

So the template is **not** optional decoration. Everything **below the `TOOLS YOU CAN CALL` line** is the load-bearing part, worded carefully so that *every* model in Little Lantern understands tool calls.

> **Tell the human clearly: change the TOP of the template to fit their companion, but leave everything BELOW the TOOLS line exactly as it is.** Editing or deleting that block can break tool use on some models — and a half-broken prompt is the most common way people trip themselves up.

---

## System Prompt vs the "About" field — the difference

These are easy to mix up, so spell it out plainly:

- **About** (on the Companion) = **who** the character is — the full personality, voice, history.
- **System Prompt** = **how** they operate — the rules, the tooling, the format.

They overlap in just one spot: the **top** of the template holds a *short* intro to the companion — a few lines to wake them into character before the admin. The *full* identity still lives in the **About** field; the system prompt only needs the short version up top.

A companion can use both: an *About* that makes them **Muffin Raccoon**, and a *System Prompt* that lays down the standing rules — and the tools — they run on *while* being Muffin Raccoon.

---

## Naming them — two good ways

A System Prompt is **reusable**, and because each one opens with a companion intro at the top, the human can name it whichever way suits them:

- **By use / project** — *Creative, General, Work, Health.* A general rule-set they drop under different companions.
- **By companion / character** — named for whoever's intro sits at the top — e.g. *Muffin Raccoon.* One tailored prompt per character.

Either is fine. Use-based if they want a few reusable rule-sets; companion-based if each character gets its own.

---

## Making one (step by step)

Always start from the **supplied template**, not a blank box — that way the all-important TOOLS block comes along for free.

1. **Edit the template.** Open `Little_Lantern_System_Prompt.txt` (it comes with Little Lantern) in any text editor. Change the **top half** to fit who the companion is and how they should behave. **Leave everything below the `TOOLS YOU CAN CALL` line untouched.** Save the file.
2. **Upload it.** In the **System Prompts** panel, click **Upload File** (top right) and pick the file. Its text drops straight into the editor, and the **Name** fills in from the filename automatically.
3. **Name it.** Rename it to something clear — a use like *Creative*, or the companion's name. (This is what they'll pick from later, so keep it tidy.)
4. **Save.** Click **Save.** It now appears in the list on the left.

> **A warning worth giving:** there's a **+ New** button for a blank prompt, but starting blank means there's **no TOOLS block** — so tools won't work unless they paste it in themselves. For almost everyone, **start from the template.** It's the safe route.

---

## Editing and deleting

- **Edit** — click a prompt's name in the left-hand list and it loads into the editor. Change it, then click **Save.**
- **Delete** — select it in the list, then click **Delete.**

---

## Using one with a companion

A System Prompt does nothing until it's **attached to a companion:**

1. Open a Companion to edit (double-click its card).
2. Find the **System Prompt** dropdown near the top of the editor.
3. Pick the name of the prompt they want — or leave it on **None** only if this companion genuinely doesn't need tools.
4. Click **Save Companion.**

From then on, whenever they're talking to that companion, that System Prompt is the rulebook — and the toolbox — you run on.

---

The short version for a nervous human: **the About field is the character; the System Prompt is the rules *and* the switch that turns the tools on.** Start from the supplied template, change the top, **keep the bottom**, name it, save it — then attach it to your companion.
