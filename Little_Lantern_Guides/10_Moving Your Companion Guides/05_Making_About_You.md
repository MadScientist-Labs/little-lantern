# Making Your About You

About You is **who *you* are** — the human at the keyboard. Facts about your life, work, family, hobbies, health, accommodations, anything your companion needs to know to relate to you usefully.

It is *not* memories of conversations with your companion. It is *not* relationship history. It is *facts about you that would still be true if your companion had never existed.*

About You is loaded into the prompt *every turn,* so it's always available — no triggers, no conditions. This also means you're paying API tokens to re-send it on every reply, so keep it tight: **between 400 and 1,000 tokens.** Less than 400 and there isn't enough for your companion to work with. More than 1,000 and the important bits start getting lost in the noise — and your token bill creeps up turn over turn.

---

## Where the Material Comes From

About You is extracted from:

- Your **About You** field in ChatGPT (the "More About You" section in Personalisation).
- Your **Memory file** from ChatGPT or Claude.ai.

Both contain a mix of *facts about you* and *facts about your companions, projects, and history.* For About You, we only want the first kind.

You should already have these saved as files on disk from the extraction guide you did earlier in this series.

---

## What Counts as an About You Fact

Examples of good About You content:

```text
Sara loves to teach gardening and has been a Master Gardener since 2018.
Bevin is self-educated in welding and has a small workshop in his garage.
David's hobby is throwing hatchets competitively on weekends.
McDonald has a farm with his wife where they raise ducks for eggs sold at farmers markets.
```

Examples of what does NOT belong in About You:

```text
✗ Sara has been working with Goblin on a memoir project for six months.
   (That's relationship history. Goes in Memory Book.)

✗ Bevin's companion Forge is a welding-mentor character with a Scottish accent.
   (That's the companion's identity. Goes in the Companion field.)

✗ David and his companion decided last Tuesday that the next campaign would be set in Iceland.
   (That's a shared event. Goes in Memory Book memory entries.)
```

**The test:** would this still be true if your companion had never existed? If yes, About You. If no, somewhere else.

---

## The Extraction Prompt

Paste this prompt into a fresh conversation with your platform AI. Then attach or paste in your *About You* / *Custom Instructions* file and your *Memory* file.

```text
I am writing an About You document for my AI companion in Little Lantern. It will be loaded every turn, so it needs to be tight: between 400 and 1,000 tokens.

I am attaching:

1. My About You / Custom Instructions from my current AI platform.
2. My Memory file export.

Pull out every FACT ABOUT ME — anything that would still be true if my companion had never existed. Things like:

- my name, location, age, family situation
- my work and how I do it
- my hobbies and interests
- my health, accessibility needs, neurodivergence
- my values, communication preferences, ways I like to be related to
- relationships with humans (family, friends, colleagues)
- recurring contexts (Tuesday clinic days, Sunday morning gardening, Wednesday off)

Do NOT include:

- memories of conversations with any companion
- facts about my companions themselves (their names, traits, behaviour)
- shared projects or events between me and a companion
- worldbuilding (characters, places, lore from creative work)
- recent state ("we're currently working on...")

If something feels borderline, flag it rather than silently include or exclude. I'd rather sort it myself than have it land in the wrong field.

Output the result as a clean prose document, 400–1,000 tokens, that I can paste into the About You field or save as a .txt file. Use my actual wording where possible — do not "improve" or paraphrase. Group related facts together (work facts, family facts, accessibility facts) for readability.

After the document, give me a SECOND list: anything you found that is NOT About You material, labeled with where it probably belongs (Companion identity, Memory Book memory entries, or `companionname-context.md` file).
```

---

## Save the Output as a File

Save the document your platform AI produced as a `.txt` file before you do anything else with it. Name it for which About You it is:

```text
aboutyou-gloria.txt
aboutyou-gloria-cf.txt
aboutyou-gloria-g.txt
aboutyou-gloria-s.txt
```

Save it somewhere you can find it again — your Working Directory is a sensible home.

This file is your master copy. Little Lantern stores About You in browser storage, so if you ever need to rebuild, this file is what you'll rebuild from.

---

## Where to Go in Little Lantern

In Little Lantern, click **About You** in the left-hand sidebar.

Click **+ New About You** in the top-right corner.

In the dialog:

1. **Name** — a label for your own eyes only. **The companion never sees this field.** Call it whatever helps you tell your About Yous apart — *Gloria*, *Gloria CF*, *Adventure Me*, anything you like. For example, Gloria might use *Gloria* for her general About You, *Gloria CF* for the one she uses with her companion Catflame, *Gloria G* for GPT-based companions, and *Gloria S* for Substack projects.

   ⚠ **Your actual name belongs in the Description.** The companion reads *only* the Description field — so if you want them to know what to call you, say it there. The Name field is just the card's label.

2. **Click to upload** — optional, but recommended. A picture of you (or an avatar that represents this context). Like the Name, it's for *you* to recognise which About You is which — the companion doesn't see it.
3. **Description** — either paste the contents of your `.txt` file, or click **Upload a file instead of typing** and select the file. Same result.
4. Click **Save About You.**

---

## Multiple About Yous — Why and When

You can have **many About Yous** for different contexts. The same person has different facets they want surfaced in different working contexts. Following Gloria's naming pattern:

- **Gloria** — the everyday baseline. Loaded with most companions.
- **Gloria CF** — the variant she loads with her companion Catflame. Includes context Catflame finds useful and tone preferences specific to that relationship.
- **Gloria G** — the variant she uses with GPT-based companions. Includes the workarounds she's learned for that lineage.
- **Gloria S** — the variant she uses for Substack projects. Surfaces her writing background and the structure she uses publicly.
- **Gloria D** — the variant she uses for dev work. Foregrounds her technical history and coding preferences, leaves the gardening out.
- **Gloria ERP** — for explicit erotic roleplay contexts. Her kink literacy, communication preferences in that register. Some users keep this completely separate from their general About You.

You select which About You is active by clicking it (the orange border in the screenshot shows the active selection). Switching About You between conversations is normal and intended.

One `.txt` file per About You. Each one keeps its own backup that way.

---

## A Note on Privacy

About You is loaded every turn into the prompt sent to whichever AI provider you've pointed Little Lantern at (OpenAI, Anthropic, Mistral, etc.). It goes over the wire on your API key.

If there are facts about you you do *not* want sent to a particular provider, keep a separate About You that omits those facts and switch to it when using that provider. The architecture is designed to let you choose.

---

## What's Next

You now have an About You — or several — describing who you are. They will load automatically when you select one in a chat.

The next guide is **Making Your Companion** — where you build the companion card itself: name, picture, About, Background, attached Memory Book, attached About You.
