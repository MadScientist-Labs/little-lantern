# Money & Tokens — Save Your Tokens
### Things I learned the expensive way, so you don't have to

This guide isn't about how to use Little Lantern — that's the other guides. It isn't about which models are in the dropdown — that's the Models guide. This is the stuff nobody told me, that cost me real money and real frustration to figure out. Read it before you spend.

If anything here doesn't make sense, hand this file to your AI and ask it to explain. That's allowed. That's encouraged.

---

## First — put money on your key (the one that catches almost everyone)

Getting an API key is **not** the same as putting money on it. A brand-new key with no credit on it will fail *every single message.*

Right after you make a key, go to that provider's **Billing** page and add the smallest amount it'll let you — usually about **$10**. If you've set everything up and "nothing works," this is almost always why.

(Which provider to pick, and where to find each provider's **key and billing pages**, is all in the **Models** guide.)

## 1. How reasoning levels work

Setting reasoning too high may cause the model to overthink and burn through your token budget; higher does not always mean better. Use reasoning accordingly. See 09_Model_Guide.

To change the reasoning level, adjust the dropdown in the Machine Room before your next send. The next "send" will use the new level.

## 2. Don't overload the model before the chat even starts

Everything the model reads before your first message — your System Prompt, Companion description, About You file, and Desk Notes file — adds up. Too much, and the model has to hold it all while also thinking about your message.

Contradictions between these files make it worse: the model burns effort trying to obey both.

Rough budget: keep the total under 6,000 tokens for the big commercial models (Claude, GPT, Gemini), and under 4,000 for the smaller open models (Hermes, Nemotron, Mistral).

Not sure how many tokens your files are? Paste them into a free counter like https://token-count.streamlit.app/ before you load them in. The token counter inside Little Lantern will show you the rest once you're running.

## 3. Understand how "per one million tokens" pricing actually works

Here's the catch: every time you hit send, the model doesn't just read your new message — it re-reads *everything*. Your System Prompt, Companion notes, About You, Desk Notes file, and the entire conversation so far, every single turn.

So one million tokens sounds enormous — about 7 novels — but it disappears fast.

Example: with the 6,000-token setup from point 2 and the model's replies set to 800 tokens each, you can hit 1 million in roughly 40 exchanges. That's before tool use, images, or text files, which all add more.

Caching in the Machine Room helps a lot: it means the provider charges much less to re-read the parts that haven't changed. How you switch it on depends on the provider — some you tick a box, some have a dropdown, and some (like Gemini and Mistral) do it automatically with nothing for you to set. The Machine Room guide spells out each one. Turn it on wherever you can.

## 4. The output limit covers more than just the reply you see

When you set how many tokens a model can spend per turn, that budget also pays for its thinking and any tool use — not just the words it sends back.

Here's the trap: thinking happens behind the scenes. A model with reasoning set high might spend most of its budget thinking, leaving almost nothing for the actual reply. The result: responses that get cut off mid-sentence, or sound strangely short and "clipped."

The fix is either one: raise the output token allowance, or lower the reasoning level.

## 5. Before you start, ask an AI to check your files for contradictions

Show your About You, Companion, and System Prompt files to a capable AI and ask it to flag anything that contradicts something else.

Contradictions are expensive: the model burns thinking tokens trying to obey both instructions at once, and the result is erratic behaviour.

Use the most capable model you have access to for this — comparing files against each other is genuinely hard work, and smaller models do it poorly. Check two files at a time, not all three at once.

One tip that helps a lot: give the model a role before you ask. "You're the steward of my setup — help me make sure these files work together" gets you a careful collaborator. A bare "check this" gets you a nitpicker.

(At time of writing, top-tier models like GPT 5.5 or Claude Opus 4.8 handle this well — but use whatever the current best is when you read this.)

## 6. Keep a token cost log

Log your token use for each session and the calculated spend. Give the math to AI if you don't wish to bother with the calculations yourself. Log the model you used, the price per million tokens it costs, how much you used (token number) and cost, and the date.

## 7. Use cheap (or free) models for the grunt work

Here's the one a couple of beta testers had to point out to me — and they were dead right, I should've said it from the start.

When you've got a big job that's really just *processing* — summarising a long document, condensing a pile of imported files into a thread summary, churning through a lot of text — you do **not** need your expensive flagship model for that. Long or many documents get costly fast on API, because the model reads every token you feed it.

For that kind of grunt work, reach for a **cheap or free** model instead. **Ring 2.6** or **Hermes 4** models are great for it (use the free **owl-alpha** if you feel its safe for it to be training on the data). Save your pricey model for the conversations that actually need its brains.

Be conscious about *which* model you point at a big job — it's one of the easiest places to burn money without noticing.

And if you want the **cheapest** models you can get, the **OpenRouter** guide walks you through setting OpenRouter up properly — which settings to change first — so you're not stuck paying top-tier prices for everything.
