# Little Lantern — The Chat Screen (what every button does)

**This is written to *you*, the AI assistant.** Once someone's connected (see **Bare Start**), the **Chat** screen is where they live. They'll point at something and ask *"what's that?"* — here's every control, grouped by where it sits, so you can answer plainly. Nothing here is dangerous to poke; encourage them to explore.

---

## The top bar (across the top of the chat)

**Left side — the action buttons:**

- **📂 Save Chat** (the purple one) — saves the whole conversation to a **file on their computer.** It asks them to **name the chat**, then saves it as something like `2026-06-22-Muffin-Raccoon-tea-ritual.md`. Important to say out loud: **chats are NOT saved to a file automatically.** If they want to keep one, they press this. (It does autosave *within the browser* so it survives a refresh — but a file is the real keepsake.)
- **New Chat** — clears the conversation to start a fresh one. Because clearing can't be undone, it first asks *"Did you save your chat?"* — a deliberate speed bump so nothing precious gets wiped by accident.
- **GM** (a little checkbox) — **GM Notes are really for the AI, not the human.** They're a private channel the companion can write to (it's set up in the system prompt) for behind-the-scenes planning. The human doesn't need to write or read them day to day — but ticking **GM** **reveals what's been written**, which is handy if something seems off and they (or you) want to check what the companion's been noting to itself.

**Right side — what's loaded and what it's costing:**

- **tokens: ↑ … ↓ …** — the **token odometer** for the chat: a running count of tokens used this session (**↑ = sent, ↓ = received**). Tokens are how providers measure — and bill — usage, so this is the number to keep half an eye on. **↺** resets it to zero. **Have them read the Money & Tokens guide *before* they start chatting**, so the costs never catch them out.
- **The two names** (e.g. *Muffin Raccoon* and *Sam*) — show the **Companion** and the **About You** currently in play. If they haven't picked any, it says *No companion / No About You set* — and that's fine, they can still chat with the bare model.

- **❓ Help** (yellow) — opens the little box that points them to these guides. That's how they found you, most likely.

---

## The conversation itself

Every reply from the AI has a few controls tucked under it:

- **Reroll** — the important one. If a reply **drifts** off the companion's voice or personality, **Reroll** throws it away and gets a fresh attempt at the same message. They can reroll **as many times as they like** until one sounds right.
- **The steering note box** — gives them **300 characters** to guide the companion back to itself: a short nudge like *"that's not how she'd say it — warmer, more teasing."* Whatever they write steers the next Reroll. It's drift-correction, in their own words.
- **Accept** — once they've rerolled, **Accept** keeps the version on screen and tidies the discarded attempts away.

So the rhythm is: a reply drifts → jot a short steering note (up to 300 characters) → **Reroll** (again and again if needed) → when the companion sounds like themselves again, **Accept.**

(Tick **GM** in the top bar to reveal any hidden GM Notes under a reply — for checking, not for everyday use; see below.)

---

## Things that appear on their own

A few things show up without anyone pressing a button — worth knowing so none of them cause a "what's THAT?" panic:

- **Small muted red/orange "tool" chips** — when the companion uses a tool (searching the web, reading a file, saving a memory), a little chip appears in the chat showing which tool ran and a peek at what came back. It's a receipt, not a control — nothing to press. It's there so the human always knows a tool really fired.
- **A ⚠️ "token max" notice** — if a reply ends with this, it was cut off by the **max tokens** slider, not a fault and not an empty wallet. Slide max tokens up in the Machine Room (→ guide 07).
- **A small floating lavender box (🪶)** — only if the auto-memory Heartbeat is switched on (it's off by default). It appears in the **lower-right corner of the window** for a few seconds, showing what the companion did while the human was away — tidying its notes, saving a memory — then fades out (→ guide 06).
- **The companion knows today's date and time** — read fresh from the human's own computer clock on every message. Nothing to set up; it just knows. Handy for "what day is it," dates in `MEM:` lines, and Desk Notes lines that mention when.

---

## The message box (along the bottom)

- **The big text box** — where they type. **Enter** sends; **Shift+Enter** makes a new line without sending.
- **📎 (paperclip)** — attach something. A **text file** has its contents pasted into the message (so the AI can read it); an **image** is sent to the model itself (only the vision-capable models can actually see it).
- **🎨 (palette)** — generate a **picture** from whatever's typed in the box. This needs an image key set up first (**Machine Room → Tools**); without it, it'll just say it's missing the key.
- **Send** — sends the message. (Same as pressing Enter.)

---

That's the whole screen. The honest summary for a nervous human: **type in the box, press Send, and everything else is optional.** Save Chat when they want to keep one; Reroll if a reply misses; the rest they'll grow into.
