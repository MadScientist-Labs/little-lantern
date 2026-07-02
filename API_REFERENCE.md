# API Reference - Little Lantern Provider Wiring

Verified against the app code on 2026-06-30. This file is the project source of truth for what Little Lantern currently sends. If provider docs change, update the provider adapter in `app.js` and this file together.

Little Lantern is a local browser app. Most model calls are made directly from `app.js` to the provider API. The local Python server in `start.py` serves the app and proxies only local tool endpoints such as web search, URL fetch, file read/search/write, and image generation.

## Global Rules

- Build API-provider conversations with `buildMessages()`: separate `system`, `systemStable`, `systemVolatile`, and `messages`.
- Keep `buildPrompt()` only for hidden local/RunPod completion-style endpoints.
- Do not send unsupported sampler fields. Provider 400s are usually caused by stray parameters.
- Do not rename the `msl-` localStorage keys without a migration.
- API keys live in browser localStorage. JSON backup/export deliberately excludes them.

## Local llama.cpp / RunPod (Hidden Public UI)

Endpoint: `{base_url}/v1/chat/completions`

Used by: `callLlamaCpp(baseUrl, messageData, samplers)`

Request shape:

```json
{
  "messages": [{ "role": "user", "content": "full concatenated prompt" }],
  "temperature": 1,
  "min_p": 0.05,
  "top_p": 1,
  "top_k": 40,
  "max_tokens": 800,
  "repeat_penalty": 1.1,
  "stop": ["User:", "\nUser:", "\n### "]
}
```

Notes:

- Local/RunPod remains in code but is hidden from the public UI.
- No auth is handled by Little Lantern for local. RunPod is URL-based.
- No structured tools are routed through this provider path.

## Claude API (Anthropic)

Endpoint: `https://api.anthropic.com/v1/messages`

Used by: `callClaude(config, messageData, samplers)`

Required headers:

```text
x-api-key: {api_key}
anthropic-version: 2023-06-01
anthropic-dangerous-direct-browser-access: true
content-type: application/json
```

Supported public models in the dropdown:

- `claude-sonnet-5` - Sonnet 5
- `claude-fable-5` - Fable 5
- `claude-opus-4-8` - Opus 4.8
- `claude-opus-4-7` - Opus 4.7
- `claude-opus-4-6` - Opus 4.6
- `claude-opus-4-5` - Opus 4.5
- `claude-sonnet-4-6` - Sonnet 4.6
- `claude-sonnet-4-5` - Sonnet 4.5

Request rules:

- `system` is sent as Claude's separate top-level `system` field.
- Messages are sent as `messages: [{role, content}]`.
- If prompt caching is enabled, the system field and last user message get `cache_control`.
- Sampler Claude models get `temperature` only. Never send `temperature` and `top_p` together.
- Effort Claude models are detected by `isClaudeEffortModel()`: `claude-sonnet-5`, `claude-opus-4-7`, `claude-opus-4-8`, and `claude-fable-5`.
- Effort Claude models send `output_config: { "effort": "low|medium|high" }` and no samplers.
- Opus 4.7 / 4.8 also send `thinking: { "type": "adaptive" }`; Sonnet 5 and Fable 5 use default-on adaptive thinking and do not need a separate `thinking` field.
- Tools are sent when tool use is enabled, using Claude `tools: [{name, description, input_schema}]`.

Sampler model request shape:

```json
{
  "model": "claude-opus-4-6",
  "max_tokens": 800,
  "system": "stable and volatile system bundle",
  "messages": [
    { "role": "user", "content": "Hello" }
  ],
  "temperature": 1,
  "tools": []
}
```

Effort model request shape:

```json
{
  "model": "claude-opus-4-8",
  "max_tokens": 800,
  "system": "stable and volatile system bundle",
  "messages": [
    { "role": "user", "content": "Hello" }
  ],
  "thinking": { "type": "adaptive" },
  "output_config": { "effort": "medium" },
  "tools": []
}
```

Default-on adaptive effort model request shape:

```json
{
  "model": "claude-sonnet-5",
  "max_tokens": 800,
  "system": "stable and volatile system bundle",
  "messages": [
    { "role": "user", "content": "Hello" }
  ],
  "output_config": { "effort": "medium" },
  "tools": []
}
```

Tool loop:

- If `stop_reason === "tool_use"`, append the assistant tool-use content, run each tool, append a user `tool_result` block, then call Claude again.
- Max loop count: `TOOL_LOOP_MAX_ITERATIONS` (10).

## OpenAI

Primary endpoint: `https://api.openai.com/v1/responses`

Fallback endpoint: `https://api.openai.com/v1/chat/completions`

Used by: `callOpenAI()`, `callOpenAIResponses()`, `callOpenAIChatCompletions()`

Required headers:

```text
Authorization: Bearer {api_key}
Content-Type: application/json
```

Supported public models in the dropdown:

- `gpt-4o-2024-05-13` - 4o (no vision label in UI)
- `gpt-4o-mini-2024-07-18` - 4o-mini (no vision label in UI)
- `gpt-4.1-2025-04-14` - 4.1
- `gpt-4.1-mini-2025-04-14` - 4.1-mini
- `o3-2025-04-16` - o3
- `o3-mini-2025-01-31` - o3-mini (text only label in UI)
- `gpt-5.1-2025-11-13` - 5.1
- `gpt-5.4-2026-03-05` - 5.4
- `gpt-5.4-mini-2026-03-17` - 5.4-mini
- `gpt-5.5-2026-04-23` - 5.5

Thinking model detection:

- `isOpenAIThinkingModel()` returns true for the o-series (`/^o[1-9]/`) and `gpt-5.1`, `gpt-5.4`, `gpt-5.5`.
- Thinking models skip `temperature` and `top_p`.
- Thinking models send `reasoning: { "effort": value }` when effort is not `none`.
- Responses API thinking calls add `OPENAI_REASONING_RESERVE` to the user's max-token slider so hidden reasoning cannot starve the visible answer.

Responses API request shape:

```json
{
  "model": "gpt-5.1-2025-11-13",
  "input": [
    { "role": "system", "content": "system bundle" },
    { "role": "user", "content": "Hello" }
  ],
  "max_output_tokens": 8992,
  "reasoning": { "effort": "medium" },
  "tools": []
}
```

Responses API non-thinking models may include:

```json
{
  "temperature": 1,
  "top_p": 1
}
```

Responses API tool loop:

- Function-call items are `output` entries with `type: "function_call"`.
- Tool results are appended as `{ "type": "function_call_output", "call_id": "...", "output": "..." }`.
- Text is extracted from `output` message items with `content[].type === "output_text"`.

Chat Completions fallback request shape:

```json
{
  "model": "gpt-4.1-2025-04-14",
  "messages": [
    { "role": "system", "content": "system bundle" },
    { "role": "user", "content": "Hello" }
  ],
  "temperature": 1,
  "top_p": 1,
  "max_tokens": 800,
  "tools": []
}
```

## Nous Research

Endpoint: `https://inference-api.nousresearch.com/v1/chat/completions`

Used by: `callNous(config, messageData, samplers)`

Required headers:

```text
Authorization: Bearer {api_key}
Content-Type: application/json
```

Supported public models in the dropdown:

- `Hermes-4-405B`
- `Hermes-4-70B`

Request rules:

- OpenAI-compatible chat completions shape.
- Send `temperature` and `max_tokens`.
- Do not send `top_p`, `top_k`, `min_p`, or repetition penalty.
- Tools use OpenAI Chat Completions `tools` / `tool_calls` format.
- Hermes models are treated as text-only; image attachments are dropped from the provider request while text still sends.

Request shape:

```json
{
  "model": "Hermes-4-405B",
  "messages": [
    { "role": "system", "content": "system bundle" },
    { "role": "user", "content": "Hello" }
  ],
  "temperature": 1,
  "max_tokens": 800,
  "tools": []
}
```

## OpenRouter

Endpoint: `https://openrouter.ai/api/v1/chat/completions`

Used by: `callOpenRouter(config, messageData, samplers)`

Required headers:

```text
Authorization: Bearer {api_key}
Content-Type: application/json
HTTP-Referer: http://localhost:3000
X-Title: Little Lantern
```

Curated dropdown models:

- `openrouter/owl-alpha`
- `xiaomi/mimo-v2-flash`
- `xiaomi/mimo-v2.5`
- `xiaomi/mimo-v2.5-pro`
- `deepseek/deepseek-v4-flash`
- `deepseek/deepseek-v4-pro`
- `moonshotai/kimi-k2.6`
- `moonshotai/kimi-k2.7-code`
- `inclusionai/ring-2.6-1t`
- `x-ai/grok-4.3`
- `z-ai/glm-5.2`
- `nvidia/nemotron-3-super-120b-a12b`
- plus the persistent custom slug field

Request rules:

- OpenAI-compatible chat completions shape.
- Send `temperature`, `top_p`, and `max_tokens`.
- Send `top_k` only when the selected route is not `anthropic/*` or `openai/*`.
- Do not send cache controls; OpenRouter routing makes prompt caching unreliable.
- Tools use OpenAI Chat Completions `tools` / `tool_calls` format.

Request shape:

```json
{
  "model": "deepseek/deepseek-v4-pro",
  "messages": [
    { "role": "system", "content": "system bundle" },
    { "role": "user", "content": "Hello" }
  ],
  "temperature": 1,
  "top_p": 1,
  "top_k": 40,
  "max_tokens": 800,
  "tools": []
}
```

## Gemini

Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}`

Cache endpoint: `https://generativelanguage.googleapis.com/v1beta/cachedContents?key={api_key}`

Used by: `callGemini(config, messageData, samplers)`

Supported public models in the dropdown:

- `gemini-3.5-flash`
- `gemini-3.1-flash-lite`
- `gemini-3.1-pro-preview`

Request rules:

- Gemini uses `contents`, not OpenAI-style `messages`.
- Conversation roles are `user` and `model`; assistant messages are mapped to `model`.
- System text is sent as `systemInstruction`, unless an explicit cache is used.
- Safety settings are always sent with all five adjustable categories set to `OFF`.
- Send `temperature`, `topP`, `topK`, and `maxOutputTokens`.
- Tools are sent as `tools: [{ functionDeclarations: [...] }]`.
- Tool-call args arrive as objects, not JSON strings.
- Tool results are returned as a user turn containing `functionResponse` parts.

Safety settings:

```json
[
  { "category": "HARM_CATEGORY_HARASSMENT", "threshold": "OFF" },
  { "category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "OFF" },
  { "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "OFF" },
  { "category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "OFF" },
  { "category": "HARM_CATEGORY_CIVIC_INTEGRITY", "threshold": "OFF" }
]
```

Request shape:

```json
{
  "contents": [
    {
      "role": "user",
      "parts": [{ "text": "Hello" }]
    }
  ],
  "systemInstruction": {
    "parts": [{ "text": "system bundle" }]
  },
  "safetySettings": [
    { "category": "HARM_CATEGORY_HARASSMENT", "threshold": "OFF" },
    { "category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "OFF" },
    { "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "OFF" },
    { "category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "OFF" },
    { "category": "HARM_CATEGORY_CIVIC_INTEGRITY", "threshold": "OFF" }
  ],
  "generationConfig": {
    "temperature": 1,
    "topP": 1,
    "topK": 40,
    "maxOutputTokens": 800
  },
  "tools": []
}
```

Explicit caching:

- `systemStable` is cached only when the rough estimate is at least 4096 tokens.
- `systemVolatile` is prepended to the first user turn when a cached system bundle is used.
- Cache TTL is 300 seconds.
- If a cache reference fails, the app drops the cache and retries inline once.

## Mistral

Endpoint: `https://api.mistral.ai/v1/chat/completions`

Used by: `callMistral(config, messageData, samplers)`

Required headers:

```text
Authorization: Bearer {api_key}
Content-Type: application/json
```

Supported public models in the dropdown:

- `mistral-medium-3-5`
- `devstral-2512`
- `mistral-large-2512`

Request rules:

- OpenAI-compatible chat completions shape.
- Send `temperature`, `top_p`, and `max_tokens`.
- Do not send `top_k`, `min_p`, or repetition penalty.
- All current dropdown models are treated as tool-capable.
- Vision content uses Mistral's string `image_url` format, not OpenAI's `{url: ...}` object.
- Prompt caching is automatic via `prompt_cache_key`.

Request shape:

```json
{
  "model": "mistral-medium-3-5",
  "messages": [
    { "role": "system", "content": "system bundle" },
    { "role": "user", "content": "Hello" }
  ],
  "temperature": 1,
  "top_p": 1,
  "max_tokens": 800,
  "prompt_cache_key": "ll-characterId-personaId",
  "tools": []
}
```

## Structured Tools

Tool definitions live in `TOOL_DEFS` in `app.js`.

Current tools:

- `calculator`
- `web_search`
- `url_fetch`
- `file_read`
- `file_search`
- `file_write`
- `image_generate`
- `memory_add`

Provider tool formats:

- Claude: `tools: [{name, description, input_schema}]`; results return as user `tool_result` blocks.
- OpenAI Responses: `tools: [{type:"function", name, description, parameters}]`; results return as `function_call_output`.
- OpenAI Chat / Nous / OpenRouter / Mistral: `tools: [{type:"function", function:{...}}]`; results return as `role:"tool"` messages with `tool_call_id`.
- Gemini: `tools: [{functionDeclarations:[...]}]`; results return as `functionResponse` parts.

Tool safety notes:

- `file_read`, `file_search`, and `file_write` are scoped server-side with `realpath` + `commonpath` to the user-configured Working Directory.
- `file_write` overwrites the full target file; models are instructed to read first before editing.
- `image_generate` is capped to one image per turn in the frontend and forced to cheap JPEG/1K/standard settings server-side.
- `memory_add` can write only normal `memory` entries to the active companion's assigned memory book. It cannot create behaviour entries.

## Test Connection

`testConnection()` sends a small real validation request to the active endpoint:

- Local/RunPod: `GET /v1/models`
- OpenRouter: one chat completion with `max_tokens: TEST_CONNECTION_MAX_TOKENS`
- Claude: one messages call with `max_tokens: TEST_CONNECTION_MAX_TOKENS`
- Nous: one chat completion with `max_tokens: TEST_CONNECTION_MAX_TOKENS`
- OpenAI: one Responses or Chat Completions call, matching the selected API mode, with `max_output_tokens` / `max_tokens` set to `TEST_CONNECTION_MAX_TOKENS`
- Gemini: one `generateContent` call with `maxOutputTokens: TEST_CONNECTION_MAX_TOKENS`
- Mistral: one chat completion with `max_tokens: TEST_CONNECTION_MAX_TOKENS`

`TEST_CONNECTION_MAX_TOKENS` is currently `64`. The validation call may cost a small number of tokens. A successful status means the key/model/API route accepted the request; it does not judge response quality.

## Parameter Support Matrix

| Parameter | Local/RunPod | Claude sampler | Claude effort | OpenAI non-thinking | OpenAI thinking | Nous | OpenRouter | Gemini | Mistral |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| temperature | yes | yes | no | yes | no | yes | yes | yes | yes |
| top_p | yes | no | no | yes | no | no | yes | yes | yes |
| top_k | yes | no | no | no | no | no | route-dependent | yes | no |
| min_p | yes | no | no | no | no | no | no | no | no |
| rep_pen | yes | no | no | no | no | no | no | no | no |
| max_tokens | yes | yes | yes | yes* | yes* | yes | yes | yes** | yes |
| reasoning / effort | no | no | yes | no | yes | no | no | no | no |
| tools | no | yes | yes | yes | yes | yes | yes | yes | yes |

`*` OpenAI Responses uses `max_output_tokens`; Chat Completions uses `max_tokens`.

`**` Gemini uses `maxOutputTokens`.
