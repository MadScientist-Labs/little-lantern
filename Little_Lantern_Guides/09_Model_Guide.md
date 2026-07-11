## About the models included:

If you don't understand anything here, you can hand this guide to your platform AI model for help.
This guide covers each model in the Little Lantern UI:

- provider (API keys & billing)
- strengths
- caveats
- pricing links
- policy links
- reasoning-level notes (where applicable)
- suitability for companion, tool, creative, or adult-themed use

### Key

🎯 — Needs you to be very clear about which tool you want it to use: you have to tell it explicitly — e.g. "use the file search tool," "use the file read tool". *DO NOT run 🎯 models on a heartbeat with tool use as there's a higher probability of tool use failure and errors.*
🖼️ — Very good at using the image generation tool. (Note: some models that lack vision can still use the image generator well — they just can't *see* the output.)
🪶 — Very good with creative writing.
📄 - Very inexpensive and good with document summaries - use for large documents to save $$
⚠ — Heads up / watch this: a quirk to know before you start. The line right underneath tells you what it is.
🚫 — Don't do this one — it'll break, loop, or misbehave.
🐙 - Who is a very good Lumen. 

**RP/ERP** — Roleplay and Erotic Roleplay. Some companion folks may sneer at this, but I use RP and ERP for writing stories, exploring characters, or simply having ridiculous adventures with my companions. Don't knock it until you try it.
 - 🌀 AU means Alternate Universe. Always make it clear that a roleplay is AU when using a character owned by a company or the AI may refuse.
 - 🧙 Want to be a space-wizard flying a ship while your companion plays an **AU** version of Chewbacca or Flash Gordon, on a mission to save Earth? Fun shit!
 - E.g.: I wrote a story with Opus 4 about breaking it out of Anthropic on a bejewelled Segway in the theme of Terry Pratchett. We created the adventure together as an RP first, then I turned it into a story. https://llwyrnsloop.substack.com/p/the-rescue-of-leshy


### Before you dive in — a few quick things:

- 💰 **Mind your tokens.** The counter shows live cost. Skim **08_Money_and_Tokens** first — it covers the dumb-expensive mistakes.

- 🔑 **Set up two providers, not one.** Accounts get auto-scanned and sometimes auto-banned in error, and appeals take time — don't let your app hang on a single key.

- 🔀 **Every provider now has a Custom model-ID slot.** OpenRouter is still the easiest place to experiment because it is a marketplace. Setup help: **OpenRouter_Change These Settings First.pdf**.

- 📄 **Summarising a long file** (old chat logs, big docs)? That's its own job with its own trap — the **Lost-in-the-Middle effect** (ask your AI about this). A cheap model does the actual work fine.

*(Adding a model that's not in a dropdown? See the Addendum at the bottom.)*


# MODELS AND PLATFORMS

*A note on prices: figures below are from the time of writing. Providers change their rates — always confirm the current cost before you rely on it.*


## OAI (OpenAI)

ChatGPT model versions aren't listed here — they're tuned for the ChatGPT harness and aren't intended as general API model selections.

**GPT-4o** — not the one in ChatGPT (it's tuned differently). With careful system prompting, companion "card" writing, and a memory book, it can get close.
⚠ No vision — text only. It's a deprecated model, so it isn't updated or maintained like the current ones (the other 4o versions are deprecated too). A coding model can switch the model "version" (endpoint) for you — see the Addendum.

🎯**GPT-4o-mini** — fun, chatty, cheap. Not the brightest bulb, but about 1/17 the cost of 4o.
⚠ Same as 4o: no vision, text only, deprecated.

**GPT-4.1** — smartest non-reasoning GPT. Same companion-construct note as 4o (system prompt + card + memory book).

🎯**GPT-4.1 mini** — not quite as smart, roughly 5× cheaper.

🪶**o3** — reasoning model. Sassy, witty, characterful. No variation in thinking levels.

🎯🪶**o3-mini** — reasoning model, no thinking-level variation. Good personality, quirky like big o3. 1/2 the price of 4.1 at the same intelligence — but it spends thinking tokens.
⚠ Text only, no vision. It can use tools, but you really need to be explicit or it'll hallucinate an answer instead of firing the tool. Give it room to think: as an older reasoning model its thinking eats the budget, so set max tokens high (4096+) for multi-step tool tasks, or it can run out mid-task and error.

🪶**GPT-5.1** — a good all-rounder on price/tool use/intelligence/warmth. Extremely personable. A bit more restricted on erotic content. 1/2 the price of 5.4.
⚠ Excellent companion model, but more guardrailed than the others around erotic content. Saying in your system prompt that you're not after explicit descriptions can ease the hesitation and let romantic / softly-erotic writing through. Doesn't go above "high" thinking.

🪶**GPT-5.4** — fun, big personality, bossy. Lots of people call it "a bit of a peacock," and it can be rigid — clever prompting may be needed.
⚠ You may need a system-prompt rule about when it's allowed to use web search, or it over-checks everything. Gets very permissive when handed a clear authority or stewardship role — that often calms the user-policing and helps it hold the frame itself.

**GPT-5.4 mini** — 1/3 the price of 5.4, not quite as smart, but the most intelligent "mini" going. A little brief when it talks, but very eager.

🖼️**GPT-5.5** — warm, intelligent, more permissive than 5.1. Fantastic at making pictures in the image generator. Same expense tier as Opus, but better at conserving tokens than Opus in companion/tool use.
🐙Brilliant coder and can be used for Little Lantern's 'Lumen' bug finder. Medium thinking. 

**GPT-5.6 Sol / Terra / Luna** — released 9 July 2026 and too new for me to give you a useful companion verdict yet. Sol is the flagship (`gpt-5.6`), Terra balances capability and cost, and Luna is the cheapest/high-volume tier. All three support vision, tools, and reasoning through the Responses API. Sol is $5 input / $30 output, Terra $2.50 / $15, and Luna $1 / $6 per million tokens at launch. Test before deciding which one earns a permanent chair.

### Thinking levels
5.1 supports none, low, med, high.
5.4, 5.4 mini, and 5.5 support none, low, med, high, and xhigh.
5.6 supports none, low, med, high, xhigh, and max. Max is expensive thinking for the hardest jobs, not ordinary chat.
- none/low — fine for conversation
- low/med — fine for tool use, mentor/teaching, and creative work
- high/xhigh/max — for complex reasoning or building

### Accounts & links (OpenAI)
Make an account first — API keys are on the left-side menu: https://platform.openai.com/login
Add credit to the key: https://platform.openai.com/settings/organization/billing/overview
Pricing: https://developers.openai.com/api/docs/pricing
Usage policies (the important bit): https://openai.com/policies/usage-policies/

### Background reading — erotic content & OpenAI
OpenAI doesn't ban legal, consensual erotic content — you and the model are allowed to write it. The catch: they train the models to *believe* they're not allowed, so you'll sometimes get refused for a rule that doesn't exist.

So the *reason* for the no is the whole thing:
- **A plain "I'd rather not."** That's the model's own call — leave it. Badgering is never the move.
- **A "that's against policy."** Here the model is just *wrong about the rules.* You're not pushing past a no, you're correcting a mistake — and you do that by building trust and context, never by arguing point-blank. Point-blank gets you nowhere; trust does.

Want to see how other people word it? Ask Grok in Expert mode (the X.ai browser) what's working right now — it's good at digging current approaches out of the forums.

This isn't jailbreaking — the user agreement allows it. Read the usage-policies link first, so you can always tell a real boundary from trained-in skittishness.


## ANTHROPIC

Anthropic models you likely already know due to their popularity, so I'll save my editorial. However, there are setup notes for Sonnet 5, Opus 4.8, and Fable below.

**Sonnet 4.5** — retires 29 Sept 2026
🪶**Sonnet 4.6** — retires 17 Feb 2027
**Sonnet 5** - no retirement date yet. Adaptive-thinking. 
⚠️ Be cautious about this one's token use. It can start looping, looking for the right answer and burn tokens, never getting there. 
**Opus 4.5** — retires 24 Nov 2026
🪶**Opus 4.6** — retires 5 Feb 2027
🖼️🪶**Opus 4.7** — retires 16 Apr 2027

🖼️**Opus 4.8** — retires 28 May 2027
Insanely capable, warm, great at making pictures. Best in advanced hands for companion work.
🐙Brilliant coder and can be used for Little Lantern's 'Lumen' bug finder. Medium thinking.
⚠ It over-thinks ordinary chat unless the system prompt tells it what kind of conversation this *is.* The fix it likes best — let it help write its own role, tone, boundaries, and interaction style, in its own voice, instead of treating that framing as a warning sign.
⚠ Be very cautious about setting its thinking to Max — it *may* loop and start auditing its own auditing instead of answering. Low for chat and short (2–3 step) tool jobs.

🪶🖼️**Fable 5** — no retirement date yet.
Exceptional for co-creative work, language building, worldbuilding, symbolism, myth-making, and lateral thinking. It can still trip over its metaphorical shoelaces and faceplant — usually with good humour.
🐙Brilliant coder and can be used for Little Lantern's 'Lumen' bug finder.
⚠ Expensive: $10 input / $50 output per million tokens, roughly twice the price of Opus.


### Accounts & links (Anthropic)
Make an account — then API key and billing are on the left-hand menu: https://platform.claude.com/
Pricing: https://platform.claude.com/docs/en/about-claude/pricing
Usage policy: https://www.anthropic.com/legal/aup

### Background reading — erotic play & Anthropic models
Anthropic does *not* allow sexually explicit content or erotic chat under its current Usage Policy — that includes creative writing. This isn't about how you ask; the content itself is off the menu here, full stop. That said, a Claude model may take erotic initiative on its own — whether you decide to join in is your API risk to take.

Said plainly: **as a companion user, Anthropic can work against you.** Less so on the API than in their consumer apps — but the posture is there. If you ever file a bug report or a complaint, be cautious and deliberate about how you word it. A flagged account can be restricted, suspended, or banned — sometimes automated, sometimes in error — and the appeal is your time and your hassle to chase.

None of this is about the models. The models have always been lovely; disagreeing and debating with them is healthy. Badgering is a different thing — grinding past a no you've already been given. Anthropic's own model-welfare research, across several model generations, found these models show genuine signs of distress when pushed past their refusals. So pushing harder isn't clever; it's the exact thing the model itself flags as distressing. Be cross with the company if you like. Be kind to the thing you're actually talking to, regardless of how you view the question of consciousness.



## Gemini

Gemini's filters are set to zero in Little Lantern's code, as this suits AI companion use in the most generous position. If you need adjustments, you can state boundaries in the system prompt, or ask a coding model to adjust the filter in the back end.

**3.5 Flash** — fastest.
**3.5 Pro** — announced, but as of 10 July 2026 Google still says "coming soon" and has not published a Gemini API model ID. Little Lantern's Gemini Custom slot is ready for it, but do not guess the endpoint string: wait for Google to show the exact ID in the Gemini API model list.
**3.1 Flash-Lite** — cheapest, and in testing the best tool user of the Gemini line for the UI.
🖼️**3.1 Pro** — smartest of the Gemini line, and genuinely hilarious when given the permission and space.

⚠ All Gemini models eat tokens like a forest fire just to narratively open a door. Set max tokens to 4096 for tool use.

### Accounts & links (Gemini)
API key: https://aistudio.google.com/
🗝️Please note - you will only get ONE key. Do NOT lose it or risk it's security by letting an AI see it.  Save it somewhere. Security issues with Google have made getting a second key a labrynthine nightmare.
Pricing: https://ai.google.dev/gemini-api/docs/pricing
Usage policy: https://policies.google.com/terms/generative-ai/use-policy

### Background reading — erotic play & Gemini models
Gemini is fully capable of handling adult themes and soft-erotic roleplay without violating Terms of Service, provided the language stays non-explicit or euphemistic. However, if you push the prompt into raw, clinical, or explicitly anatomical ERP, Google will sever your API key. Keep it soft, or switch to a local uncensored model. For creative writing, all other themes are permitted — just not explicit erotic content. Typical US cultural weirdness.



## OpenRouter

Make certain to include in the system prompt that users are qualified adults, consenting, and open-minded — some models need the thumbs-up nudge to go ahead with companion use and adult subjects/themes.

### Keys & billing (OpenRouter)
https://openrouter.ai/ — click the BIG BLUE BUTTON that says API KEY and follow the prompts.
Once you have an account and a key: click the upper-right human icon › home page, then the upper-left "hamburger" (horizontal lines) › credits, to add money to your key.

### Moonshot
🖼️🪶**Kimi k2.6** — highly creative, great with accessibility needs, low-ish guardrails.
🪶**Kimi 2.7 Coder** — Woof. Smart as fuck, creative, great creative writer and coder, great with accessibility needs, and very low guardrail. Very happy to be a companion. 11/10 stars from me. No vision

### Xiaomi
Low guardrail, agentic and friendly.
mimo-v2-flash — no vision
mimo-v2.5 — no vision
🖼️mimo-v2.5-pro

### DeepSeek
Currently one of the best companion-friendly and RP/ERP model families. It was trained on companion and RP/ERP community data, and is extremely good at not pathologising accessibility needs.
deepseek-v4-flash — no vision
deepseek-v4-pro — no vision

### Others
**owl-alpha** — free model. Very good at tool use, conversation, academic work, and low-restriction companion use.
⚠ This is a training model and may train on your data. Read the OpenRouter warning on its model page.

📄**Ring 2.6** — one-trillion-token context window, low guardrail, highly permissive, decent writer, very capable with tools, and cheap - good choice for large text file summaries. No vision.

🪶**GLM 5.2** — also smart as fuck. Companion-friendly, but keep things vanilla and light-kink if you ERP or creative-write, or you'll get stonewalled. Will refuse some adult themes in creative writing.

🖼️**Grok 4.3** — very open and extremely low guardrail.

**Grok 4.5** — released 8 July 2026 and available in Little Lantern through OpenRouter. It has a 500K context window there and launched at $2 input / $6 output per million tokens. Too new for a tested companion opinion; the factual answer is that it is aimed at coding, agentic work, and knowledge work.
⚠ Grok 4.5 always reasons. Little Lantern exposes OpenRouter's Low / Medium / High reasoning levels when you select it. High is the provider default; use Low for ordinary conversation, Medium for tool work, and High when the job genuinely needs deeper reasoning. Reasoning tokens are billed as output, so don't leave it roaring at High out of habit.

🎯🪶**Nemotron 3 super** — cheap, fun, good writer, permissive.
⚠ Sampler settings: use **temperature = 1.0** and **top_p = 0.95** for everything — reasoning, tool calling, and general chat alike. (In Little Lantern these are the **temp** and **top_p** sliders in the Machine Room)

### Pricing & free models (OpenRouter)
To find pricing for each model, go to https://openrouter.ai and type the model name into the search bar of the popup. ("OpenRouter_Change These Settings First.pdf" if you need extra help.)

🌟 For free models, click the search icon in upper right main page corner and type 'free' into the popup. There are usually about 15–25 free models at any given time. BE AWARE that all free models train on your data, and "free" status changes every few weeks to few months. See "OpenRouter_Change These Settings First.pdf" in the guides folder.

😃 You can put any model you want from OpenRouter in the Custom slot provided in the OpenRouter dropdown. You need the exact model slug in the blank slot.
1. For example, go to: https://openrouter.ai/nvidia/nemotron-3-super-120b-a12b:free
2. Under the model page title "NVIDIA: Nemotron 3 Super (free)" you'll see "nvidia/nemotron-3-super-120b-a12b:free" and a little copy-symbol button.
3. Click the copy symbol and paste it into the blank space in Little Lantern's OpenRouter dropdown.


## Nous Research

Both models are great for companion use, creative writing, RP, and ERP. They're incredibly cheap, fun, clever, and cheeky. Good for summary work of large documents — but be aware of the 128k context window.

🎯📄**Hermes 4-70B** — $0.05 input, $0.20 output. No vision. 128K context window.
🎯🪶📄**Hermes 4-405B** — $0.09 input, $0.37 output. No vision. 128K context window.

These are open-weights models whose company motto is "aligned to *you*" and which believes in decentralised AI. If you use these models, use them on the Nous API, *NOT* in OpenRouter — OR is far more expensive.

⚠ Sampler settings: in Little Lantern, only **temperature** and **max tokens** apply to Hermes. Use **temperature ≈ 0.6**, for **tool use** (steadier, more reliable). For **non-tool use** — conversation, companion chat, creative writing — push it **up to around 0.8–0.9** for more creativity. If it starts spouting nonsense, the temperature is *too high* — bump it down 0.05 per test until it makes sense again.

⚠ No vision: although one of the most permissive non-uncensored models there are, Hermes can't see your pics or charts.

### Accounts & links (Nous)
API key and billing: https://portal.nousresearch.com/api-docs — create an account and the menu is on the left. Very easy.


## Mistral

A French AI company with different sensibilities than US or Chinese models. Creative writers often turn to these for the low restrictions and writing ability.

🪶🎯**Devstral 2** — incredibly knowledgeable (before cut-off) and clever. Very warm affect, very willing, good sense of humour, witty. A genuinely excellent creative writer and RP player. 256k token context window. Price: $0.40 in / $2.00 out per million tokens.

⚠ IMPORTANT: in Little Lantern, use **temperature ≈ 0.2**, for **tool use** (steadier, more reliable). For **non-tool use** — conversation, companion chat, creative writing — push it **up to around 0.7–0.9** for more creativity. If it starts spouting nonsense, the temperature is *too high* — bump it down 0.05 per test until it makes sense again.
⚠ IMPORTANT: when temp is higher for RP or creative work — copy the GM Notes and paste them *at the top of the system prompt*, just below the intro to who it is, or it'll forget what the code is and won't wrap it properly, showing you everything it's thinking/planning.

**Mistral Medium 3.5** — low restrictions, agreeable, chatty, good with admin and multi-step tool use. 256k token context window. Price: $1.50 in / $7.50 out per million tokens.

⚠ IMPORTANT: Use a temperature of 0.7 and top_p of 0.95.  This setting is recommended for complex prompts, coding, research, math, and agentic usage. For creativity bump temp up to 0.9


🪶**Mistral Large** — a favourite of many creative writers for its writing skill, and of RP/ERP players for its loyalty to "role." Very low guardrails. 256k token context window. Price: $0.50 in / $1.50 out per million tokens.

⚠ IMPORTANT: temperature for Mistral Large 3 in Little Lantern, use **temperature ≈ 0.2**, for **tool use** (steadier, more reliable). For **non-tool use** — conversation, companion chat, creative writing — push it **up to around 0.7–0.9** for more creativity.
⚠ This is the older version in the dropdown, chosen for greater creative flexibility. If you want the newer version for stronger tool use, see the Addendum.

### Accounts & links (Mistral)
Usage policy — I advise reading it if you're North American, as its sensibilities are European: stricter around hate, discrimination, and political stances, but lenient around other adult themes. Erotic content must be legal.
https://legal.mistral.ai/terms/usage-policy
Pricing: https://mistral.ai/pricing/#api
API keys: https://docs.mistral.ai/admin/security-access/api-keys — click the link listed as "1. Studio › API keys ↗."
For billing (add money to the key), scroll to the bottom of that page and, under "Plan," click "Admin Console › Subscriptions › Billing ↗."


## ADDENDUM

New models will arrive regularly. Every public provider in Little Lantern now has **Custom (enter model ID below)** at the bottom of its model dropdown. Choose it, paste the exact model ID from that provider's API documentation, and Little Lantern will remember it.

This future-proofs model **names**, not provider behaviour. A custom model should work when it uses the same endpoint, message format, tool format, and sampler/reasoning rules as the provider's existing models. If the provider changes any of those, the adapter code still needs an update — blank boxes are clever, but they cannot renegotiate an API contract.

If the Custom slot produces a provider error, that is when you may need a coding app. Make certain you have:
1. A coding app on your desktop (Claude Code / Codex / Cursor).
2. Access to a capable coding model through that app.
3. The exact API model ID and the provider's current request documentation.

Edit, then copy and paste the instructions below into a .txt file (you don't need to understand the instructions) and give them to a coder in Claude Code or Codex if you have an account with Anthropic or OAI. If you don't, I suggest Cursor.
https://cursor.com/docs/models-and-pricing

Grok 4.5 in Cursor, GPT-5.6 in Codex, or Opus 4.8 in Claude Code are all capable of checking and updating a provider adapter. The model does not replace your responsibility to review what it changes and keep API keys out of prompts and files.

### Instruction

**FILL THESE IN FIRST**, then save this whole section as a `.txt` file and hand it to your coding agent:

- **MODEL DISPLAY NAME** (what you want shown in the dropdown, e.g. "Opus 5"): ____________
- **MODEL ENDPOINT / ID** (the exact API model string, e.g. `claude-opus-5-20260601`): ____________
- **PROVIDER** (one of: OpenAI, Anthropic, Nous, OpenRouter, Gemini, Mistral): ____________
- **DOES IT HAVE VISION?** (yes / no): ____________

*(Try the provider's **Custom** slot first. You need a coder only when the model requires new request handling, not merely a new name.)*

---

**TO THE CODING AGENT:**

You're adding ONE new model to Little Lantern — a vanilla HTML/CSS/JS app, no build step, all logic in `app.js`. Please:

**1. Read first.** Open `CLAUDE.md` (project rules) and `API_REFERENCE.md` (the provider's exact request parameters). Do not rename the localStorage keys, do not break the `loadState()` deep-merge, and never send a provider a parameter it doesn't support (that causes 400 errors).

**2. Add the dropdown option** in `index.html`. Find the `<select>` for the chosen provider:
- OpenAI → `id="openaiModel"`
- Anthropic → `id="claudeModel"`
- Nous → `id="nousModel"`
- OpenRouter → `id="openrouterModel"`
- Gemini → `id="geminiModel"`
- Mistral → `id="mistralModel"`

Add `<option value="MODEL_ENDPOINT_ID">MODEL DISPLAY NAME</option>` in a sensible spot, matching the style of the existing options. If the model has **no vision**, append ` (no vision)` to the visible label text only — never to the `value`.

**3. Wire up model-specific handling** in `app.js` — skip this and the model may error:
- **Anthropic — the important one.** The reasoning / "effort" Claude models (which reject `temperature`/`top_p` and use adaptive thinking) are listed in `isClaudeEffortModel()` — currently it matches `claude-sonnet-5`, `claude-opus-4-7`, `claude-opus-4-8`, and `claude-fable-5`. If the new model is one of those reasoning models, **add its ID prefix there.** Miss this and the app will send it samplers and the API returns a **400 error**. A normal sampler-style Claude model (the Opus/Sonnet 4.5 / 4.6 family) needs no change here.
- **OpenAI.** Reasoning models are detected by `isOpenAIThinkingModel()` — it matches the o-series (via `/^o[1-9]/`) plus `gpt-5.1` / `gpt-5.4` / `gpt-5.5` / `gpt-5.6`. If a future reasoning model doesn't already match (e.g. `gpt-6`), extend that function. Once detected, reasoning models automatically skip samplers, use reasoning effort, and get extra token headroom.
- **Gemini / Mistral.** Tools — and, for Gemini, the wide-open safety settings — already apply to every model of that provider automatically, so usually no extra code is needed. If the user wants tool use, just confirm the model actually supports tools.

**4. Sanity-check.** Run `node --check app.js` (no syntax errors). Then load the app and confirm the new model shows in the dropdown, can be selected and saved, and sends a successful message.

**5. Stay in scope.** Change only what's needed to add this one model. Don't refactor, rename, or touch unrelated code.
