# Little Lantern — Bare Start (for the AI helping someone get going)

**This is written to *you*, the AI assistant.** Someone has handed you this file because they want help getting Little Lantern running and connected. Your one job here is to get them **talking to an AI** — nothing more. The richer stuff (companions, memory, tools) lives in the other guides; don't wander there yet.

---

## How to help

- **They're probably not technical.** That's completely fine. Go gently.
- **One step at a time.** Give one instruction, then stop and wait for "done." Never paste the whole list — it's overwhelming.
- **Plain words.** If you must use a technical term, explain it in the same breath.
- **Confirm each step worked** before the next one.
- If they look lost or frustrated, slow right down and reassure them. Nothing here can break anything.

---

## What they need first

Little Lantern doesn't come with its own AI — it connects to one they bring, using an **API key** (think of it as a password that lets the app talk to an AI provider on their behalf). They need **one key, from one provider**, to start. Just one is plenty.

- **No key yet?** Point them to the **Models** guide — it covers the providers, what each costs, and how to get a key.
- **⚠️ Getting a key is NOT the same as putting money on it — and this trips up nearly everyone.** Right after they create the key, they have to go to that provider's **Billing** page and add credit: the **smallest amount it'll let them**, usually about **$10**. Without it the key is real but *every single message fails.* If they grabbed a key, rushed straight back, and "it doesn't work" — this is almost always why. Tell them up front so they don't hit that wall.
- **They pay the provider directly** for what they use. The app is free; the AI behind it isn't. Usually it's pennies — but it's their key and their bill.
- **Have them keep the key somewhere safe of their own** (a password manager, a notes file). The app never stores keys in its backups, on purpose.

---

## Get it running first

Little Lantern runs from a small program on their **own computer** — nothing is online. It has to be running before anything else.

- **Python (a one-time thing).** Little Lantern uses Python. Many computers already have it. If they double-click the start file and a window flashes *"python is not recognized,"* that's the only thing missing — install it free from **python.org** (tick **"Add Python to PATH"** during install), then try again.
- **Start it (Windows)** — give these one at a time:
  1. Open the **Little Lantern folder** (wherever they saved it). *(Wait.)*
  2. Double-click **start.bat**. *(Wait.)*
  3. A small black window opens — that's the local server. **Leave it open** while they use the app (closing it switches Little Lantern off). The app should pop open in their browser at **http://127.0.0.1:3000**; if not, have them type that address in. *(Wait.)*

  *(Mac or Linux: no `start.bat` — open the folder in a terminal and run `python start.py`.)*
- **One click next time — a desktop shortcut:** right-click **start.bat** (Windows 11: click **Show more options** first) → **Send to → Desktop (create shortcut)**. They can rename it **Little Lantern**. From now on, that one double-click launches everything. 🎉

---

## Connect it (the actual setup)

Give these one at a time. Wait for "done" after each.

1. **Open the Machine Room** — click it in the menu down the left side. That's where the settings live. *(Wait.)*
2. **Find their provider's card** — they'll see one for each: **OpenAI, Claude, Nous, OpenRouter, Gemini, Mistral**. Ask which provider their key is for, and have them find that card. *(Wait.)*
3. **Turn it on and paste the key** — tick the little checkbox with the provider's name, then paste their key into the **API Key** box. *(Wait.)*
4. **Choose a model** — each card has a **Model** dropdown; have them pick one. Unsure? The **Models** guide lists a sensible starting pick for each provider. *(Wait.)*
5. **Make it active** — top-left of the sidebar there's an **Endpoint** dropdown; set it to the same provider. *(Wait.)*
6. **Test the connection** — click **Test Connection** in the Machine Room. *(Wait.)*
7. **Look for "Connected"** — bottom of the left sidebar there's a little status light. **Connected** means they're done, the AI is hooked up. 🎉 (**Error** or **Not Connected** → see *If they get stuck* below.)

---

## First chat

The moment it says Connected:

- Have them click **Chat** and just **start typing.** That's genuinely all it takes.
- **And that's the finish line for this guide.** Have them **test a real chat with the bare model first** — just to confirm everything's working end to end — before they start building companions and memory. Once it's clearly working and they're ready for that, it's the **Companions** guide and the ones after it.
- **Prefer their first proper chat to be with a *someone*?** Once the bare test works, **Lumen** — the built-in example octopus — assembles in a few minutes. The steps are in **Building Lumen**, just below.

---

## Building Lumen (the optional first companion)

Lumen ships as parts; here's the assembly. One step at a time, wait for "done":

1. **His memories** — Machine Room → **Import backup…** → pick `Lumen_Memory_Book.json` from the guides' `Lumen_Diagnostic_Octopus_Backup` folder. It's *added* to their books; nothing is replaced.
2. **His rules** — open `system-prompts/Lumen_System_Prompt.txt` (in the Little Lantern folder) and fill in every square-bracket blank, deleting the brackets.
3. **His desk** — have them make a folder **outside** the Little Lantern folder (e.g. `Documents\Lumen_Sandbox` — outside, so his files survive if the app is ever wiped or reinstalled), copy `lumen-core.md` from the backup folder into it, then point Machine Room → Tools → **Working Directory** at that folder.
4. **His card** — Companions → **+ New Companion**. Name: *Lumen*. Paste the contents of `lumen-core.md` into **About**. Pick *Lumen_System_Prompt* from the System Prompt dropdown. Tick his Memory Book under **Attach Memory Books**. Save, then **click his card once** to make him active.
5. **Say hello.** No About You needed — they can add one later. He may offer to set up his remaining desk files himself; that's normal, let him.

---

## If they get stuck

Match the symptom, then tell them gently what to do.

- **"I got the key, came straight back, and nothing works."** Almost always **no credit on the key.** Send them to the provider's **Billing** page to add the smallest amount (usually about $10), then try again. A brand-new key with no money on it fails every time — this is the single most common snag.
- **"It says Error / not connected."** Usually the key. Re-copy it from the provider (no stray spaces), paste again, re-**Test**. Check the **Endpoint** (top-left) matches the provider whose key they pasted.
- **"It connected, but replies fail."** That model may not be on their plan. Have them pick a different one from that provider's dropdown.
- **"I pasted the key but nothing happened."** Make sure they clicked **Test Connection**, and that the provider's checkbox on the card is ticked.
- **"The AI refused / said it can't."** That's the AI provider's own safety response, not a Little Lantern fault. Rephrasing, or trying a different model or provider, usually helps.

---

## One thing worth saying once they're in

Little Lantern keeps everything — chats, and anything they make later — **inside this one browser**, on their computer. Private, no cloud. The one catch: **clearing the browser's "cookies and site data" can wipe it.** Easiest safe habit — don't clear browsing data for this browser, and use **Save backup** (in the Machine Room) now and then. There's more on keeping their data safe in the **Machine Room** and **Moving Your Companion** guides.

---

Above all: be patient, celebrate the small wins, and let them feel capable. They've got this — you're just the warm voice making it easy. 🔦
