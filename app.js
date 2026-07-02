// === Little Lantern ===

// === State ===
const state = {
    characters: [],
    personas: [],
    memoryBooks: [],
    settings: {
        endpoints: {
            local: { enabled: true, url: 'http://localhost:8080' },
            runpod: { enabled: false, url: '' },
            openrouter: { enabled: false, key: '', model: 'deepseek/deepseek-v4-pro' },
            claude: { enabled: false, key: '', model: 'claude-opus-4-6', effort: 'medium', cacheEnabled: true, cacheTtl: '5m' },
            nous: { enabled: false, key: '', model: 'Hermes-4-405B' },
            openai: { enabled: false, key: '', model: 'gpt-5.1-2025-11-13', useResponsesApi: true, reasoningEffort: 'medium', cacheEnabled: true },
            gemini: { enabled: false, key: '', model: 'gemini-3.5-flash', cacheEnabled: true },
            mistral: { enabled: false, key: '', model: 'mistral-medium-3-5', cacheEnabled: true }
        },
        activeEndpoint: 'openai',
        defaults: {
            temp: 1,
            minP: 0.05,
            topK: 40,
            topP: 1.0,
            maxTokens: 800,
            repPen: 1.1
        },
        tools: {
            enabled: false,
            braveKey: '',
            workingDir: '',
            image: { key: '' }
        },
        // Auto-memory heartbeat — off by default; one quiet background turn when the
        // user goes idle. See runHeartbeat().
        heartbeat: {
            enabled: false,
            quietMinutes: 10
        }
    },
    currentChat: {
        characterId: null,
        personaId: null,
        messages: [],  // Each message: { role, content, rejected: [], messageId, gmNotes? }
        dpoData: [],   // Collected DPO pairs
        memoryLedger: [], // Assistant-visible audit trail of memory_add results for this chat
        heartbeatReceipts: [], // Assistant-visible receipts of what each heartbeat actually did
        gmNotes: null, // Current active GM notes (replace-not-append)
        gmDebugVisible: false
    },
    editingId: null
};

// Runtime data (not persisted to localStorage)
let systemPromptList = [];
let systemPromptCache = {};
let voiceExamplesList = [];
let voiceExamplesCache = {};
let workingContextCache = {}; // context files read fresh from the Working Directory (sandbox), keyed by filename
let pendingImage = null; // an image attached to the next message but not yet sent: { dataUrl, name }
let imageGenCount = 0; // images generated in the current turn — cost seatbelt; reset each turn in callEndpoint()

// --- Heartbeat (auto-memory) runtime state ---
let lastActivity = Date.now();      // updated on send / response / reroll / typing
let lastHeartbeatCount = 0;         // messages.length at the last successful beat (once-per-gap guard)
let heartbeatRunning = false;       // re-entrancy guard; also suppresses tool-event chips during a beat
let heartbeatToolCalls = [];        // tool calls made during the current beat, gathered into a receipt

// === Initialization ===
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    initNavigation();
    initSamplerControls();
    initChat();
    initCharacters();
    initPersonas();
    initMemoryBooks();
    initSystemPrompts();
    initSettings();
    initQuickSelect();
    loadSystemPrompts().then(() => renderSystemPrompts());
    loadVoiceExamplesFiles();
    renderAll();
    updateSamplerVisibility();
    loadTokenOdometer();
    initHeartbeat();
    initHelp();
});

// === Help / Guides ===
function initHelp() {
    const btn = document.getElementById('helpBtn');
    const modal = document.getElementById('helpModal');
    const closeBtn = document.getElementById('closeHelpModal');
    if (!btn || !modal) return;
    btn.addEventListener('click', () => modal.classList.add('active'));
    if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    modal.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) modal.classList.remove('active');
    });
}

// === Local Storage ===
// NOTE: the `msl-` key prefix (msl-frontend-state, msl-chat-autosave,
// msl-token-odometer) is legacy and intentionally kept. These are invisible
// internal storage keys — never shown to users. Renaming them would orphan
// every existing user's saved data. Do NOT rename without first writing a
// migration that copies the old keys to the new ones on load.
function saveState() {
    const toSave = {
        characters: state.characters,
        personas: state.personas,
        memoryBooks: state.memoryBooks,
        settings: state.settings
    };
    localStorage.setItem('msl-frontend-state', JSON.stringify(toSave));
}

function loadState() {
    const saved = localStorage.getItem('msl-frontend-state');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            state.characters = parsed.characters || [];
            state.personas = parsed.personas || [];
            state.memoryBooks = parsed.memoryBooks || [];
            if (parsed.settings) {
                // Deep merge endpoints so new ones survive old localStorage data.
                // Two-level merge: ensure each endpoint's new fields (like cacheEnabled)
                // fall back to defaults if missing in the saved blob.
                if (parsed.settings.endpoints) {
                    const mergedEndpoints = { ...state.settings.endpoints };
                    for (const key of Object.keys(parsed.settings.endpoints)) {
                        mergedEndpoints[key] = { ...(state.settings.endpoints[key] || {}), ...parsed.settings.endpoints[key] };
                    }
                    parsed.settings.endpoints = mergedEndpoints;
                }
                // Deep merge defaults too
                if (parsed.settings.defaults) {
                    parsed.settings.defaults = { ...state.settings.defaults, ...parsed.settings.defaults };
                }
                // Deep merge tools so new fields survive old localStorage data.
                if (parsed.settings.tools) {
                    parsed.settings.tools = { ...state.settings.tools, ...parsed.settings.tools };
                }
                // Deep merge heartbeat too (added later — absent in older saved blobs).
                if (parsed.settings.heartbeat) {
                    parsed.settings.heartbeat = { ...state.settings.heartbeat, ...parsed.settings.heartbeat };
                }
                state.settings = { ...state.settings, ...parsed.settings };
            }

            // Migration: fix outdated model strings from old localStorage
            const validClaude = ['claude-sonnet-5', 'claude-fable-5', 'claude-opus-4-8', 'claude-opus-4-7', 'claude-opus-4-6', 'claude-opus-4-5', 'claude-sonnet-4-6', 'claude-sonnet-4-5'];
            if (state.settings.endpoints.claude && !validClaude.includes(state.settings.endpoints.claude.model)) {
                state.settings.endpoints.claude.model = 'claude-opus-4-6';
            }
            const validNous = ['Hermes-4-405B', 'Hermes-4-70B'];
            if (state.settings.endpoints.nous && !validNous.includes(state.settings.endpoints.nous.model)) {
                state.settings.endpoints.nous.model = 'Hermes-4-405B';
            }

            // Migration: character card field changes (P3)
            // Remove deprecated firstMessage/safety, ensure systemPromptFile exists
            state.characters.forEach(char => {
                if (!char.systemPromptFile) {
                    char.systemPromptFile = 'none';
                }
                if (!char.voiceExamplesFile) {
                    char.voiceExamplesFile = 'none';
                }
                delete char.currentContextFile; // legacy manual current-context upload — superseded by voice examples
                if (typeof char.currentContextWorkingFile !== 'string') {
                    char.currentContextWorkingFile = '';
                }
                delete char.firstMessage;
                delete char.safety;
            });
        } catch (e) {
            console.error('Failed to load state:', e);
        }
    }

    // Restore autosaved conversation (separate from main state)
    const savedChat = localStorage.getItem('msl-chat-autosave');
    if (savedChat) {
        try {
            const parsed = JSON.parse(savedChat);
            state.currentChat.characterId = parsed.characterId || null;
            state.currentChat.personaId = parsed.personaId || null;
            state.currentChat.messages = parsed.messages || [];
            state.currentChat.dpoData = parsed.dpoData || [];
            state.currentChat.memoryLedger = Array.isArray(parsed.memoryLedger) ? parsed.memoryLedger : [];
            state.currentChat.heartbeatReceipts = Array.isArray(parsed.heartbeatReceipts) ? parsed.heartbeatReceipts : [];
            state.currentChat.gmNotes = parsed.gmNotes || null;
            state.currentChat.gmDebugVisible = parsed.gmDebugVisible || false;
        } catch (e) {
            console.warn('Chat autosave restore failed:', e.message);
        }
    }
}

// === Backup & Restore (full-state JSON export/import) ===
// API keys are intentionally EXCLUDED from exports — users keep those separately.
function exportState() {
    const settings = JSON.parse(JSON.stringify(state.settings || {}));
    const eps = settings.endpoints || {};
    Object.keys(eps).forEach(k => { if (eps[k] && 'key' in eps[k]) delete eps[k].key; });
    if (settings.tools) {
        delete settings.tools.braveKey;
        if (settings.tools.image) delete settings.tools.image.key;
    }

    let chatAutosave = null;
    try { chatAutosave = JSON.parse(localStorage.getItem('msl-chat-autosave') || 'null'); } catch (e) { /* ignore */ }

    const snapshot = {
        app: 'little-lantern',
        version: 1,
        characters: state.characters || [],
        personas: state.personas || [],
        memoryBooks: state.memoryBooks || [],
        settings,
        chatAutosave
    };

    const d = new Date();
    const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `little-lantern-backup-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importState(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        let data;
        try {
            data = JSON.parse(e.target.result);
        } catch (err) {
            alert('That file is not valid JSON. Import cancelled.');
            return;
        }
        // A single Memory Book file (from the per-book Save button, or a shipped example
        // like Lumen's). ADDED alongside existing books — replaces nothing.
        if (data && data.tag === 'll-memory-book') {
            if (!data.name || !Array.isArray(data.entries) || data.entries.length === 0) {
                alert('That memory book file has no name or no entries. Import cancelled.');
                return;
            }
            if (!confirm(`Import the memory book "${data.name}"? It will be added alongside your existing books — nothing is replaced.`)) return;
            const book = {
                id: generateId(),
                name: String(data.name),
                entries: data.entries
                    .filter(en => en && en.content)
                    .map(en => ({
                        triggers: String(en.triggers || ''),
                        content: String(en.content),
                        type: en.type === 'behaviour' ? 'behaviour' : 'memory'
                    }))
            };
            state.memoryBooks.push(book);
            saveState();
            renderMemoryBooks();
            alert(`Memory book "${book.name}" imported (${book.entries.length} entries). Open a companion and tick it under Attach Memory Books to use it.`);
            return;
        }

        if (!data || data.app !== 'little-lantern') {
            if (!confirm("This doesn't look like a Little Lantern backup. Import anyway?")) return;
        }
        if (!confirm('Import this backup? It replaces your current companions, personas, and memory books. Your saved API keys are left as they are.')) return;

        try {
            if (Array.isArray(data.characters)) state.characters = data.characters;
            if (Array.isArray(data.personas)) state.personas = data.personas;
            if (Array.isArray(data.memoryBooks)) state.memoryBooks = data.memoryBooks;

            if (data.settings) {
                // Merge endpoints/defaults/tools. Imported keys are absent (stripped on
                // export), so the spread keeps whatever keys are already in this browser.
                if (data.settings.endpoints) {
                    for (const k of Object.keys(data.settings.endpoints)) {
                        state.settings.endpoints[k] = { ...(state.settings.endpoints[k] || {}), ...data.settings.endpoints[k] };
                    }
                }
                if (data.settings.defaults) {
                    state.settings.defaults = { ...state.settings.defaults, ...data.settings.defaults };
                }
                if (data.settings.tools) {
                    state.settings.tools = { ...state.settings.tools, ...data.settings.tools };
                }
                const { endpoints, defaults, tools, ...rest } = data.settings;
                state.settings = { ...state.settings, ...rest };
            }

            if (data.chatAutosave) {
                localStorage.setItem('msl-chat-autosave', JSON.stringify(data.chatAutosave));
            }

            saveState();
            alert('Backup imported. Reloading…');
            location.reload();
        } catch (err) {
            alert('Import failed: ' + (err.message || err));
        }
    };
    reader.readAsText(file);
}

// === Navigation ===
function initNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const panelId = btn.dataset.panel;
            
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
            document.getElementById(`panel-${panelId}`).classList.add('active');
        });
    });
}

// === System Prompts ===
async function loadSystemPrompts() {
    try {
        const response = await fetch('/api/system-prompts');
        if (response.ok) {
            systemPromptList = await response.json();
        }
    } catch (e) {
        console.warn('Could not load system prompts:', e.message);
        systemPromptList = [];
    }
}

async function getSystemPromptContent(name) {
    if (systemPromptCache[name]) return systemPromptCache[name];
    try {
        const response = await fetch(`/api/system-prompts/${encodeURIComponent(name)}`);
        if (response.ok) {
            const data = await response.json();
            systemPromptCache[name] = data.content;
            return data.content;
        }
    } catch (e) {
        console.warn('Could not load system prompt:', name, e.message);
    }
    return '';
}

function populateSystemPromptDropdown(selectedValue) {
    const select = document.getElementById('characterSystemPrompt');
    select.innerHTML = '<option value="none">None</option>';
    systemPromptList.forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        select.appendChild(opt);
    });
    select.value = selectedValue || 'none';
}

// --- Voice & Interaction Examples files (per-companion, loaded into the stable bundle) ---
// User-curated sample exchanges that capture how a companion talks — used most when moving
// a companion in from claude.ai / ChatGPT. Static: the model never rewrites these.
async function loadVoiceExamplesFiles() {
    try {
        const response = await fetch('/api/voice-examples');
        if (response.ok) {
            voiceExamplesList = await response.json();
        }
    } catch (e) {
        console.warn('Could not load voice-examples list:', e.message);
        voiceExamplesList = [];
    }
}

// ~2K tokens — the desk-note slot stays bounded so it can't balloon the prompt.
const CURRENT_CONTEXT_MAX_CHARS = 8000;
// Voice examples can be a fuller set (several sample exchanges), so they get more room.
const VOICE_EXAMPLES_MAX_CHARS = 20000;

async function getVoiceExamplesContent(name) {
    // Read fresh from disk so a re-uploaded voice file lands without a page reload.
    // These are static, user-curated samples — nothing auto-rewrites them. The cache
    // is kept only as a fallback for when a fetch fails mid-conversation.
    try {
        const response = await fetch(`/api/voice-examples/${encodeURIComponent(name)}`);
        if (response.ok) {
            const data = await response.json();
            const trimmed = (data.content || '').slice(0, VOICE_EXAMPLES_MAX_CHARS);
            voiceExamplesCache[name] = trimmed;
            return trimmed;
        }
    } catch (e) {
        console.warn('Could not load voice-examples file:', name, e.message);
    }
    return voiceExamplesCache[name] || '';
}

// Read a companion's Desk Notes file (internally "current context") FRESH from the Working Directory (the sandbox
// folder), via the file_read proxy. This is the file the companion itself writes and tends,
// so reading it straight from the folder means its updates load automatically every chat —
// no manual re-upload. Returns '' if there's no working dir, no filename, or the read fails.
async function getWorkingDirContext(filename) {
    const workingDir = (state.settings.tools?.workingDir || '').trim();
    if (!workingDir || !filename) return '';
    try {
        const data = await postToolProxy('/api/tool/file_read', { working_dir: workingDir, path: filename });
        const trimmed = (data.content || '').slice(0, CURRENT_CONTEXT_MAX_CHARS);
        workingContextCache[filename] = trimmed;
        return trimmed;
    } catch (e) {
        console.warn('Could not read working-dir context file:', filename, e.message);
        return workingContextCache[filename] || '';
    }
}

function populateVoiceExamplesDropdown(selectedValue) {
    const select = document.getElementById('characterVoiceExamples');
    if (!select) return;
    select.innerHTML = '<option value="none">None</option>';
    voiceExamplesList.forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        select.appendChild(opt);
    });
    select.value = selectedValue || 'none';
}

// Upload a .txt/.md into the voice-examples/ folder, then select it for this companion.
async function handleVoiceExamplesFileImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
        const content = ev.target.result;
        const name = file.name.replace(/\.(txt|md|text)$/i, '');
        try {
            const response = await fetch('/api/voice-examples', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, content })
            });
            if (!response.ok) throw new Error('Save failed');
            const data = await response.json();
            voiceExamplesCache[data.name] = content;
            await loadVoiceExamplesFiles();
            populateVoiceExamplesDropdown(data.name);
        } catch (err) {
            alert('Could not save the Voice Examples file: ' + (err.message || err));
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

// Parameter support matrix from API_REFERENCE.md
const PROVIDER_SUPPORT = {
    local:       { temp: true, minP: true, topK: true, topP: true, maxTokens: true, repPen: true, reasoning: false },
    runpod:      { temp: true, minP: true, topK: true, topP: true, maxTokens: true, repPen: true, reasoning: false },
    openrouter:  { temp: true, minP: false, topK: true, topP: true, maxTokens: true, repPen: false, reasoning: false },
    claude:      { temp: true, minP: false, topK: false, topP: false, maxTokens: true, repPen: false, reasoning: false },
    openai:      { temp: true, minP: false, topK: false, topP: true, maxTokens: true, repPen: false, reasoning: true },
    nous:        { temp: true, minP: false, topK: false, topP: false, maxTokens: true, repPen: false, reasoning: false },
    gemini:      { temp: true, minP: false, topK: true, topP: true, maxTokens: true, repPen: false, reasoning: false },
    mistral:     { temp: true, minP: false, topK: false, topP: true, maxTokens: true, repPen: false, reasoning: false }
};

// === Sampler Visibility per Provider ===
function updateSamplerVisibility() {
    const endpoint = state.settings.activeEndpoint;
    const s = PROVIDER_SUPPORT[endpoint] || PROVIDER_SUPPORT.local;

    // Adaptive-thinking Claude models reject samplers — grey them out and use effort instead.
    const claudeEffort = endpoint === 'claude' && isClaudeEffortModel(state.settings.endpoints.claude.model);

    const toggle = (id, enabled) => {
        const el = document.getElementById(id);
        if (el) {
            if (enabled) {
                el.classList.remove('disabled');
            } else {
                el.classList.add('disabled');
            }
        }
    };

    toggle('samplerTemp', s.temp && !claudeEffort);
    toggle('samplerMinP', s.minP && !claudeEffort);
    toggle('samplerTopP', s.topP && !claudeEffort);
    toggle('samplerMaxTokens', s.maxTokens);
    toggle('samplerRepPen', s.repPen && !claudeEffort);

    // top_k hides entirely when unsupported (Anthropic/OpenAI guidance: leave off)
    const topKEl = document.getElementById('samplerTopK');
    if (topKEl) topKEl.style.display = (s.topK && !claudeEffort) ? '' : 'none';
}

// Claude models that reject samplers (temp/top_p/top_k -> 400) and use
// output_config.effort instead. Some require an explicit adaptive-thinking
// switch; Sonnet 5 / Fable 5 have adaptive thinking on by default.
function isClaudeEffortModel(model) {
    if (!model) return false;
    return model.startsWith('claude-sonnet-5')
        || model.startsWith('claude-opus-4-7') || model.startsWith('claude-opus-4-8')
        || model.startsWith('claude-fable-5');
}

function needsClaudeAdaptiveThinkingConfig(model) {
    if (!model) return false;
    return model.startsWith('claude-opus-4-7') || model.startsWith('claude-opus-4-8');
}

// OpenAI models that accept the `reasoning: { effort }` body field.
function isOpenAIThinkingModel(model) {
    if (!model) return false;
    // o-series reasoning models (o1, o3, o3-mini, o4-mini, ...) also reject
    // temperature/top_p and use reasoning effort instead.
    if (/^o[1-9]/.test(model)) return true;
    return model.startsWith('gpt-5.1')
        || model.startsWith('gpt-5.4')
        || model.startsWith('gpt-5.5');
}

// === Sampler Controls ===
function initSamplerControls() {
    const controls = [
        { slider: 'tempSlider', value: 'tempValue', default: 'temp' },
        { slider: 'minPSlider', value: 'minPValue', default: 'minP' },
        { slider: 'topKSlider', value: 'topKValue', default: 'topK' },
        { slider: 'topPSlider', value: 'topPValue', default: 'topP' },
        { slider: 'maxTokensSlider', value: 'maxTokensValue', default: 'maxTokens' },
        { slider: 'repPenSlider', value: 'repPenValue', default: 'repPen' }
    ];

    controls.forEach(ctrl => {
        const slider = document.getElementById(ctrl.slider);
        const valueEl = document.getElementById(ctrl.value);

        slider.value = state.settings.defaults[ctrl.default];
        valueEl.textContent = slider.value;

        slider.addEventListener('input', () => {
            valueEl.textContent = slider.value;
            // Sliders are the single source of truth now — persist live.
            const isInt = ctrl.default === 'topK' || ctrl.default === 'maxTokens';
            state.settings.defaults[ctrl.default] = isInt ? parseInt(slider.value) : parseFloat(slider.value);
            saveState();
        });
    });
}

function getSamplerSettings() {
    return {
        temperature: parseFloat(document.getElementById('tempSlider').value),
        min_p: parseFloat(document.getElementById('minPSlider').value),
        top_k: parseInt(document.getElementById('topKSlider').value),
        top_p: parseFloat(document.getElementById('topPSlider').value),
        max_tokens: parseInt(document.getElementById('maxTokensSlider').value),
        repetition_penalty: parseFloat(document.getElementById('repPenSlider').value)
    };
}

// === Chat ===
function initChat() {
    const sendBtn = document.getElementById('sendBtn');
    const userInput = document.getElementById('userInput');
    const newChatBtn = document.getElementById('newChatBtn');
    const exportChatBtn = document.getElementById('exportChatBtn');
    const exportDpoBtn = document.getElementById('exportDpoBtn');
    
    sendBtn.addEventListener('click', sendMessage);

    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Typing counts as activity so the heartbeat won't fire mid-thought.
    userInput.addEventListener('input', markActivity);

    // Attach file → paste its text into the message input.
    const attachBtn = document.getElementById('attachBtn');
    const attachFileInput = document.getElementById('attachFileInput');
    if (attachBtn && attachFileInput) {
        attachBtn.addEventListener('click', () => attachFileInput.click());
        attachFileInput.addEventListener('change', handleAttachFile);
    }

    // Generate image from current prompt (OpenAI gpt-image-2).
    const generateImageBtn = document.getElementById('generateImageBtn');
    if (generateImageBtn) {
        generateImageBtn.addEventListener('click', generateImageFromInput);
    }
    
    newChatBtn.addEventListener('click', () => {
        // Clearing the chat is destructive — nothing is auto-saved to a file.
        // Make the save reminder unmissable before we wipe the transcript.
        if (state.currentChat.messages.length > 0) {
            if (!confirm("⚠️ Did you save your chat to file 📂? If you haven't, you'll lose it 😭!")) {
                return; // Cancel — keep the chat
            }
        }
        if (state.currentChat.dpoData.length > 0) {
            if (confirm('You have unsaved DPO data. Save before clearing?')) {
                exportDpo();
            }
        }
        state.currentChat.messages = [];
        state.currentChat.dpoData = [];
        state.currentChat.memoryLedger = [];
        state.currentChat.heartbeatReceipts = [];
        state.currentChat.gmNotes = null;
        // Re-arm the heartbeat for the fresh chat.
        lastHeartbeatCount = 0;
        markActivity();
        renderChat();
        updateDpoCounter();
    });

    exportChatBtn.addEventListener('click', exportChat);
    exportDpoBtn.addEventListener('click', exportDpo);

    // GM Notes debug toggle
    document.getElementById('gmDebugToggle').addEventListener('change', (e) => {
        state.currentChat.gmDebugVisible = e.target.checked;
        renderChat();
    });
}

const ATTACH_FILE_MAX_BYTES = 1_000_000; // 1 MB per attachment
const ATTACH_IMAGE_MAX_BYTES = 15 * 1024 * 1024; // 15 MB raw image; downscaled before sending

async function handleAttachFile(event) {
    const fileInput = event.target;
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;

    // Image branch — attach a picture for vision-capable models.
    if (file.type && file.type.startsWith('image/')) {
        if (file.size > ATTACH_IMAGE_MAX_BYTES) {
            alert(`Image too large: ${(file.size / 1024 / 1024).toFixed(1)} MB. Limit is ${ATTACH_IMAGE_MAX_BYTES / 1024 / 1024} MB.`);
            fileInput.value = '';
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
            // Downscale (max 768px, JPEG) so it's cheap to send and fits local storage.
            resizeImage(ev.target.result, 768, 768, (resized) => {
                pendingImage = { dataUrl: resized, name: file.name };
                showAttachImagePreview();
            });
        };
        reader.readAsDataURL(file);
        fileInput.value = '';
        return;
    }

    // Text branch — paste the file's text into the message box.
    if (file.size > ATTACH_FILE_MAX_BYTES) {
        alert(`File too large: ${(file.size / 1024).toFixed(0)} KB. Limit is ${ATTACH_FILE_MAX_BYTES / 1024} KB.`);
        fileInput.value = '';
        return;
    }

    let text;
    try {
        text = await file.text();
    } catch (e) {
        alert(`Couldn't read file: ${e.message || e}`);
        fileInput.value = '';
        return;
    }

    // Paste the file contents into the input textarea so the user can edit/add to it before sending.
    const input = document.getElementById('userInput');
    const attachment = `Pasted file contents from "${file.name}" (already included inline below — read this text directly, do not use any file tool):\n\`\`\`\n${text}\n\`\`\``;
    input.value = input.value
        ? `${input.value}\n\n${attachment}`
        : attachment;
    input.focus();
    // Scroll textarea to the bottom so the user sees their file landed
    input.scrollTop = input.scrollHeight;

    fileInput.value = ''; // allow re-selecting the same file later
}

function showAttachImagePreview() {
    const el = document.getElementById('attachImagePreview');
    if (!el) return;
    if (!pendingImage) {
        el.style.display = 'none';
        el.innerHTML = '';
        return;
    }
    el.innerHTML = `
        <img class="attach-thumb" src="${pendingImage.dataUrl}" alt="attached image">
        <span class="attach-name">${escapeHtml(pendingImage.name || 'image')}</span>
        <button type="button" class="attach-remove" onclick="clearPendingImage()" title="Remove image">&times;</button>
    `;
    el.style.display = 'flex';
}

function clearPendingImage() {
    pendingImage = null;
    showAttachImagePreview();
}
window.clearPendingImage = clearPendingImage;

function markActivity() {
    lastActivity = Date.now();
}

async function sendMessage() {
    const input = document.getElementById('userInput');
    const message = input.value.trim();

    if (!message && !pendingImage) return;

    markActivity();

    // Add user message (with the attached image, if any)
    const userMsg = {
        role: 'user',
        content: message,
        messageId: generateId()
    };
    if (pendingImage) {
        userMsg.image = { dataUrl: pendingImage.dataUrl };
        clearPendingImage();
    }
    state.currentChat.messages.push(userMsg);

    input.value = '';
    renderChat();

    // Get assistant response
    await getAssistantResponse();
}

async function callImageGenerate(prompt) {
    const apiKey = (state?.settings?.tools?.image?.key || '').trim();
    if (!apiKey) {
        throw new Error('Missing Banana Studio API key');
    }
    return await postToolProxy('/api/tool/image_generate', {
        apiKey,
        prompt,
    });
}

async function generateImageFromInput() {
    const input = document.getElementById('userInput');
    const prompt = input.value.trim();
    if (!prompt) return;

    state.currentChat.messages.push({
        role: 'user',
        content: prompt,
        messageId: generateId()
    });

    const placeholderId = generateId();
    state.currentChat.messages.push({
        role: 'assistant',
        content: '(generating image...)',
        messageId: placeholderId,
        rejected: []
    });

    input.value = '';
    renderChat();

    try {
        const data = await callImageGenerate(prompt);
        const imageUrl = data?.image_url;
        const msg = state.currentChat.messages.find(m => m.messageId === placeholderId);
        if (!msg) return;
        if (imageUrl) {
            msg.content = `Image: ${prompt}`;
            msg.imageUrl = imageUrl;
        } else {
            msg.content = `[Image error: no image_url in response]`;
        }
        renderChat();
    } catch (error) {
        console.error('Image generation error:', error);
        const msg = state.currentChat.messages.find(m => m.messageId === placeholderId);
        if (msg) {
            msg.content = `[Image error: ${error.message}]`;
            renderChat();
        }
    }
}

async function getAssistantResponse() {
    // Ensure system prompt is cached before building messages
    const char = state.characters.find(c => c.id === state.currentChat.characterId);
    if (char && char.systemPromptFile && char.systemPromptFile !== 'none' && !systemPromptCache[char.systemPromptFile]) {
        await getSystemPromptContent(char.systemPromptFile);
    }
    if (char && char.voiceExamplesFile && char.voiceExamplesFile !== 'none') {
        // Re-read so a re-uploaded voice file lands without a page reload.
        await getVoiceExamplesContent(char.voiceExamplesFile);
    }
    if (char && char.currentContextWorkingFile) {
        // A context file the companion keeps in its Working Directory — read fresh each turn.
        await getWorkingDirContext(char.currentContextWorkingFile);
    }

    const messageData = buildMessages();

    try {
        const result = await callEndpoint(messageData);
        const responseText = result.text;

        // Parse GM notes from response
        const { publicContent, gmNotes } = parseGmNotes(responseText);

        // Replace-not-append: new GM notes overwrite old ones
        if (gmNotes) {
            state.currentChat.gmNotes = gmNotes;
        }

        state.currentChat.messages.push({
            role: 'assistant',
            content: publicContent,
            messageId: generateId(),
            rejected: [],
            gmNotes: gmNotes || null
        });

        markActivity();
        renderChat();
    } catch (error) {
        console.error('API Error:', error);
        state.currentChat.messages.push({
            role: 'assistant',
            content: `[Error: ${error.message}]`,
            messageId: generateId(),
            rejected: []
        });
        renderChat();
    }
}

async function rerollResponse(messageId) {
    // Find the message
    const msgIndex = state.currentChat.messages.findIndex(m => m.messageId === messageId);
    if (msgIndex === -1) return;
    
    const msg = state.currentChat.messages[msgIndex];
    if (msg.role !== 'assistant') return;

    markActivity();

    // Steering note is attached to THIS assistant message — applies one-shot to the reroll
    const rerollNote = (msg.pendingNote || '').trim();

    // Save current response as rejected with the steering note that drives the reroll
    msg.rejected.push({ content: msg.content, note: rerollNote });

    // Show loading state
    msg.content = '...';
    renderChat();

    // Ensure system prompt is cached
    const char = state.characters.find(c => c.id === state.currentChat.characterId);
    if (char && char.systemPromptFile && char.systemPromptFile !== 'none' && !systemPromptCache[char.systemPromptFile]) {
        await getSystemPromptContent(char.systemPromptFile);
    }
    if (char && char.voiceExamplesFile && char.voiceExamplesFile !== 'none') {
        // Re-read so a re-uploaded voice file lands without a page reload.
        await getVoiceExamplesContent(char.voiceExamplesFile);
    }
    if (char && char.currentContextWorkingFile) {
        // A context file the companion keeps in its Working Directory — read fresh each turn.
        await getWorkingDirContext(char.currentContextWorkingFile);
    }

    // Get new response, injecting the reroll steering as one-shot guidance
    const messageData = buildMessages(msgIndex, rerollNote);

    try {
        const result = await callEndpoint(messageData);
        const { publicContent, gmNotes } = parseGmNotes(result.text);
        if (gmNotes) {
            state.currentChat.gmNotes = gmNotes;
        }
        msg.content = publicContent;
        msg.gmNotes = gmNotes || null;
        msg.pendingNote = '';
        renderChat();
    } catch (error) {
        console.error('API Error:', error);
        msg.content = `[Error: ${error.message}]`;
        renderChat();
    }
}

// === Heartbeat (auto-memory) ===
// The engine that makes memory automatic: when the user goes idle, the companion
// takes ONE quiet background turn to review the chat, update its sandbox files, and
// save durable memories. It never writes to the visible transcript or DPO capture.
//
// Companion-specific details (which files it keeps: core/context/scratchpad) live in
// the companion's card / system prompt, NOT here. Code provides the hands; the card
// names the shelves.
const HEARTBEAT_INSTRUCTION =
    "Background housekeeping — the user has stepped away and will NOT see this as a normal message, " +
    "so don't write a monologue or grab their attention. Quietly: " +
    "(1) review what was said, decided, or discovered, and any new facts about the user; " +
    "(2) if you maintain sandbox files (a context note, scratchpad, etc.), update them with file_write — read first, then write the full file back; " +
    "(3) save durable associative memories with memory_add only for genuinely new durable facts (a summary ≤500 tokens, with good trigger words). " +
    "Before saving, check your Desk Notes and recalled background; do not save facts already visible there. " +
    "Only ever touch your OWN files and your OWN memory book. Never claim a tool you don't have. " +
    "Save nothing if there's nothing new. End with at most ONE short optional line of what you jotted.";

// Whether the active provider can run tools (everything except the hidden local/runpod).
function isToolCapableProvider(endpoint) {
    return endpoint !== 'local' && endpoint !== 'runpod';
}

function heartbeatShouldFire() {
    const hb = state.settings.heartbeat || {};
    if (!hb.enabled) return false;
    if (heartbeatRunning) return false;
    // Tools must be on AND the provider tool-capable, or the beat can't do its job.
    if (!toolsAreEnabled()) return false;
    if (!isToolCapableProvider(state.settings.activeEndpoint)) return false;
    const msgs = state.currentChat.messages;
    if (!msgs || msgs.length === 0) return false;
    // Fire once per silence gap: only when the user has spoken since the last beat.
    if (msgs.length <= lastHeartbeatCount) return false;
    const quietMs = (hb.quietMinutes || 10) * 60000;
    if (Date.now() - lastActivity < quietMs) return false;
    return true;
}

function checkHeartbeat() {
    if (heartbeatShouldFire()) runHeartbeat();
}

async function runHeartbeat() {
    if (heartbeatRunning) return;
    heartbeatRunning = true; // also suppresses tool-event chips (see renderToolEvent)
    heartbeatToolCalls = [];
    try {
        const char = state.characters.find(c => c.id === state.currentChat.characterId);
        // Same prep as a normal turn: ensure system prompt cached, re-read context fresh.
        if (char && char.systemPromptFile && char.systemPromptFile !== 'none' && !systemPromptCache[char.systemPromptFile]) {
            await getSystemPromptContent(char.systemPromptFile);
        }
        if (char && char.voiceExamplesFile && char.voiceExamplesFile !== 'none') {
            await getVoiceExamplesContent(char.voiceExamplesFile);
        }
        if (char && char.currentContextWorkingFile) {
            await getWorkingDirContext(char.currentContextWorkingFile);
        }

        const messageData = buildMessages();
        // Append ONE ephemeral instruction turn — NOT stored in the transcript.
        const beatTurn = { role: 'user', content: HEARTBEAT_INSTRUCTION, image: null };
        const beatData = {
            ...messageData,
            messages: [...messageData.messages, beatTurn],
            prompt: `${messageData.prompt}\n\nUser: ${HEARTBEAT_INSTRUCTION}\n${messageData.characterName}:`
        };

        const result = await callEndpoint(beatData);
        const line = (result?.text || '').trim();
        addHeartbeatReceipt(heartbeatToolCalls);
        showHeartbeatToast(line);

        // Mark this gap handled — won't fire again until the user speaks.
        lastHeartbeatCount = state.currentChat.messages.length;
    } catch (e) {
        console.warn('Heartbeat error:', e.message || e);
        // If the beat died mid-loop but tools already ran, the receipt must still say so.
        if (heartbeatToolCalls.length) addHeartbeatReceipt(heartbeatToolCalls);
    } finally {
        heartbeatRunning = false;
        // The beat may have left stray tool chips in the DOM; rebuild from state to clear them.
        renderChat();
    }
}

function showHeartbeatToast(line) {
    const el = document.createElement('div');
    el.className = 'heartbeat-toast';
    const trimmed = (line || '').replace(/\s+/g, ' ').slice(0, 140);
    el.textContent = `🪶 ${trimmed || 'tidied up while you were away'}`;
    document.body.appendChild(el);
    // Fade in, hold, fade out, remove.
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
        el.classList.remove('show');
        setTimeout(() => el.remove(), 600);
    }, 5000);
}

function initHeartbeat() {
    // Don't let a restored old conversation trigger a surprise beat on load — only
    // fire once the user adds something new this session.
    lastHeartbeatCount = state.currentChat.messages.length;
    markActivity();
    // Timer poll + a catch-up beat when the tab regains focus.
    setInterval(checkHeartbeat, 60000);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') checkHeartbeat();
    });
}

function acceptResponse(messageId) {
    // Find the message
    const msgIndex = state.currentChat.messages.findIndex(m => m.messageId === messageId);
    if (msgIndex === -1) return;
    
    const msg = state.currentChat.messages[msgIndex];
    if (msg.role !== 'assistant' || msg.rejected.length === 0) return;
    
    // Find the user prompt
    let userPrompt = '';
    for (let i = msgIndex - 1; i >= 0; i--) {
        if (state.currentChat.messages[i].role === 'user') {
            userPrompt = state.currentChat.messages[i].content;
            break;
        }
    }
    
    // Create DPO pairs - one for each rejected response
    msg.rejected.forEach(entry => {
        // Handle both old format (plain string) and new format ({content, note})
        const rejectedContent = typeof entry === 'string' ? entry : entry.content;
        const rejectedNote = typeof entry === 'string' ? '' : (entry.note || '');
        const pair = {
            prompt: userPrompt,
            chosen: msg.content,
            rejected: rejectedContent
        };
        if (rejectedNote) {
            pair.note = rejectedNote;
        }
        state.currentChat.dpoData.push(pair);
    });
    
    // Clear the rejected array (they've been saved)
    msg.rejected = [];
    
    renderChat();
    updateDpoCounter();
}

function updateMessageNote(messageId, note) {
    const msg = state.currentChat.messages.find(m => m.messageId === messageId);
    if (msg) {
        msg.pendingNote = note.trim().slice(0, 300);
    }
}

function updateDpoCounter() {
    const counter = document.getElementById('dpoCounter');
    if (counter) {
        counter.textContent = state.currentChat.dpoData.length;
        counter.style.display = state.currentChat.dpoData.length > 0 ? 'inline' : 'none';
    }
}

// === GM Notes ===
function parseGmNotes(rawContent) {
    let gmNotes = null;
    let publicContent = rawContent;

    // Extract GM notes
    const gmMatch = rawContent.match(/BEGIN_GM_NOTES\n?([\s\S]*?)\n?END_GM_NOTES/);
    if (gmMatch) {
        gmNotes = gmMatch[1].trim();
    }

    // Extract public content
    const publicMatch = rawContent.match(/BEGIN_PUBLIC\n?([\s\S]*?)\n?END_PUBLIC/);
    if (publicMatch) {
        publicContent = publicMatch[1].trim();
    } else if (gmMatch) {
        // No PUBLIC markers — everything outside GM_NOTES is public
        publicContent = rawContent.replace(/BEGIN_GM_NOTES\n?[\s\S]*?\n?END_GM_NOTES/, '').trim();
    }

    return { publicContent, gmNotes };
}

function getCompassInstruction() {
    // Count assistant messages
    const assistantCount = state.currentChat.messages.filter(m => m.role === 'assistant').length;
    // Every third assistant turn, request a compass line
    if ((assistantCount + 1) % 3 === 0) {
        return '\n[COMPASS CHECK: In your GM_NOTES, include a brief compass line summarizing: current scene location, story direction, active plot threads, and NPC states.]\n';
    }
    return '';
}

function buildPrompt(upToIndex = null, rerollSteer = '') {
    const parts = [];

    // Get character
    const character = state.characters.find(c => c.id === state.currentChat.characterId);

    // System prompt file content (if selected)
    if (character && character.systemPromptFile && character.systemPromptFile !== 'none') {
        const spContent = systemPromptCache[character.systemPromptFile];
        if (spContent) {
            parts.push(spContent + '\n');
        }
    }

    // Voice & Interaction Examples (per-companion, static) — sample exchanges that capture
    // how this companion talks. Used most when moving a companion in from another app.
    if (character && character.voiceExamplesFile && character.voiceExamplesFile !== 'none') {
        const veContent = voiceExamplesCache[character.voiceExamplesFile] || '';
        if (veContent) {
            parts.push(`\n### Voice & Interaction Examples:\n${veContent}\n`);
        }
    }

    // Desk Notes file (per-companion; internally "current context") — the companion keeps this in its
    // Working Directory and updates it itself; read fresh so its own edits load.
    let ccContent = '';
    if (character && character.currentContextWorkingFile && workingContextCache[character.currentContextWorkingFile]) {
        ccContent = workingContextCache[character.currentContextWorkingFile];
    }
    if (ccContent) {
        parts.push(`\n### Desk Notes:\n${ccContent}\n`);
    }

    // Current date & time from the user's computer clock
    const ccNow = new Date();
    parts.push(`\n### Current date & time (the user's local clock):\n${ccNow.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}, ${ccNow.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}\n`);

    if (character) {
        parts.push(`### Character: ${character.name}\n`);

        if (character.description) {
            parts.push(character.description + '\n');
        }

        if (character.backstory) {
            parts.push(`Backstory: ${character.backstory}\n`);
        }

        if (character.scenario) {
            parts.push(`Scenario: ${character.scenario}\n`);
        }

        // Trigger memory entries on the latest message from EITHER side (human or companion)
        const messages = upToIndex !== null
            ? state.currentChat.messages.slice(0, upToIndex)
            : state.currentChat.messages;
        const triggerText = getMemoryTriggerText(messages);

        if (character.memoryBookIds && character.memoryBookIds.length > 0 && triggerText) {
            const relevantEntries = getRelevantMemoryEntries(triggerText, character.memoryBookIds);
            if (relevantEntries.length > 0) {
                parts.push(formatTriggeredMemoryEntries(relevantEntries));
            }
        }
    }

    const memoryLedger = formatMemoryLedger();
    if (memoryLedger) {
        parts.push(memoryLedger);
    }

    const hbReceipts = formatHeartbeatReceipts();
    if (hbReceipts) {
        parts.push(hbReceipts);
    }

    // Get persona
    const persona = state.personas.find(p => p.id === state.currentChat.personaId);
    if (persona) {
        parts.push(`\n### User Persona:\n${persona.description}\n`);
    }

    // Inject GM notes if available
    if (state.currentChat.gmNotes) {
        parts.push(`\n### GM Notes (hidden from player, for your planning only):\n${state.currentChat.gmNotes}\n`);
    }

    // Compass check instruction
    const compass = getCompassInstruction();
    if (compass) {
        parts.push(compass);
    }

    // Conversation history
    const messages = upToIndex !== null
        ? state.currentChat.messages.slice(0, upToIndex)
        : state.currentChat.messages;

    if (messages.length > 0) {
        parts.push('\n### Conversation:\n');
        messages.forEach(msg => {
            const role = msg.role === 'user' ? 'User' : (character ? character.name : 'Assistant');
            parts.push(`${role}: ${msg.content}\n`);
        });
    }

    if (rerollSteer) {
        parts.push(`\n### Reroll steering (apply to THIS response only):\n${rerollSteer}\n`);
    }

    parts.push(`${character ? character.name : 'Assistant'}:`);

    return parts.join('\n');
}

// --- Per-provider image content converters (for vision) ---
// A message may carry { image: { dataUrl } }. Each provider wants images in its
// own shape; these turn a {role, content, image} message into the right content
// payload. Nous has no vision, so it just uses the plain text.
function imgParse(dataUrl) {
    const m = (dataUrl || '').match(/^data:([^;]+);base64,(.+)$/);
    return m ? { mediaType: m[1], base64: m[2] } : null;
}
function contentOpenAIChat(m) {
    if (!m.image) return m.content;
    return [
        { type: 'text', text: m.content || '' },
        { type: 'image_url', image_url: { url: m.image.dataUrl } }
    ];
}
function contentOpenAIResponses(m) {
    if (!m.image) return m.content;
    return [
        { type: 'input_text', text: m.content || '' },
        { type: 'input_image', image_url: m.image.dataUrl }
    ];
}
function contentMistral(m) {
    if (!m.image) return m.content;
    return [
        { type: 'text', text: m.content || '' },
        { type: 'image_url', image_url: m.image.dataUrl }
    ];
}
function contentClaude(m, cacheControl) {
    if (!m.image && !cacheControl) return m.content;
    const textBlock = { type: 'text', text: m.content || '' };
    if (cacheControl) textBlock.cache_control = cacheControl;
    const blocks = [textBlock];
    if (m.image) {
        const p = imgParse(m.image.dataUrl);
        if (p) blocks.push({ type: 'image', source: { type: 'base64', media_type: p.mediaType, data: p.base64 } });
    }
    return blocks;
}
function partsGemini(m) {
    const parts = [];
    if (m.content) parts.push({ text: m.content });
    if (m.image) {
        const p = imgParse(m.image.dataUrl);
        if (p) parts.push({ inlineData: { mimeType: p.mediaType, data: p.base64 } });
    }
    if (parts.length === 0) parts.push({ text: '' });
    return parts;
}

function buildMessages(upToIndex = null, rerollSteer = '') {
    const character = state.characters.find(c => c.id === state.currentChat.characterId);
    const persona = state.personas.find(p => p.id === state.currentChat.personaId);

    // --- Build system prompt content ---
    // Split into a STABLE bundle (cacheable: system prompt + companion + persona)
    // and a VOLATILE bundle (changes per turn: memory hits, GM notes, compass).
    const stableParts = [];
    const volatileParts = [];

    // 1. System prompt file (authoritative instructions) — stable
    if (character && character.systemPromptFile && character.systemPromptFile !== 'none') {
        const spContent = systemPromptCache[character.systemPromptFile];
        if (spContent) {
            stableParts.push(spContent + '\n');
        }
    }

    // 2. Character identity — stable
    if (character) {
        stableParts.push(`### Character: ${character.name}\n`);

        if (character.description) {
            stableParts.push(character.description + '\n');
        }

        if (character.backstory) {
            stableParts.push(`Backstory: ${character.backstory}\n`);
        }

        if (character.scenario) {
            stableParts.push(`Scenario: ${character.scenario}\n`);
        }
    }

    // 3. Persona — stable
    if (persona) {
        stableParts.push(`\n### User Persona:\n${persona.description}\n`);
    }

    // 3b. Voice & Interaction Examples (per-companion, static) — stable.
    // User-curated sample exchanges that capture how this companion talks (used most when
    // moving a companion in from another app). The model never rewrites these.
    if (character && character.voiceExamplesFile && character.voiceExamplesFile !== 'none') {
        const veContent = voiceExamplesCache[character.voiceExamplesFile] || '';
        if (veContent) {
            stableParts.push(`\n### Voice & Interaction Examples:\n${veContent}\n`);
        }
    }

    // 3c. Desk Notes file (per-companion; internally "current context") — stable.
    // The companion keeps this in its Working Directory and updates it itself; read fresh
    // so its own edits load automatically.
    let ccContent = '';
    if (character && character.currentContextWorkingFile && workingContextCache[character.currentContextWorkingFile]) {
        ccContent = workingContextCache[character.currentContextWorkingFile];
    }
    if (ccContent) {
        stableParts.push(`\n### Desk Notes:\n${ccContent}\n`);
    }

    // Current date & time from the user's own computer clock — volatile (refreshes every
    // turn, so it stays accurate and never sits in the cached prefix).
    const _now = new Date();
    const _dateStr = _now.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const _timeStr = _now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    volatileParts.push(`\n### Current date & time (the user's local clock):\n${_dateStr}, ${_timeStr}\n`);

    // --- Memory book entries (triggered by the latest message from EITHER side) — volatile ---
    const messages = upToIndex !== null
        ? state.currentChat.messages.slice(0, upToIndex)
        : state.currentChat.messages;
    const triggerText = getMemoryTriggerText(messages);

    if (character && character.memoryBookIds && character.memoryBookIds.length > 0 && triggerText) {
        const relevantEntries = getRelevantMemoryEntries(triggerText, character.memoryBookIds);
        if (relevantEntries.length > 0) {
            volatileParts.push(formatTriggeredMemoryEntries(relevantEntries));
        }
    }

    const memoryLedger = formatMemoryLedger();
    if (memoryLedger) {
        volatileParts.push(memoryLedger);
    }

    const hbReceipts = formatHeartbeatReceipts();
    if (hbReceipts) {
        volatileParts.push(hbReceipts);
    }

    // 5. Inject GM notes if available — volatile
    if (state.currentChat.gmNotes) {
        volatileParts.push(`\n### GM Notes (hidden from player, for your planning only):\n${state.currentChat.gmNotes}\n`);
    }

    // 6. Compass check instruction — volatile
    const compass = getCompassInstruction();
    if (compass) {
        volatileParts.push(compass);
    }

    // 7. One-shot reroll steering (only present when called from rerollResponse) — volatile
    if (rerollSteer) {
        volatileParts.push(`\n### Reroll steering (apply to THIS response only — the previous attempt was rejected):\n${rerollSteer}\n`);
    }

    const systemStable = stableParts.join('\n');
    const systemVolatile = volatileParts.join('\n');
    const system = [...stableParts, ...volatileParts].join('\n');

    // --- Build messages array (conversation history only) ---
    const messagesArray = messages.map(msg => ({ role: msg.role, content: msg.content, image: msg.image || null }));

    // --- Build legacy concatenated prompt for local/runpod ---
    const prompt = buildPrompt(upToIndex, rerollSteer);

    return {
        system,              // For Claude (separate field) or system role message content
        systemStable,        // Cacheable prefix (Gemini explicit caching)
        systemVolatile,      // Per-turn parts kept out of the cache
        messages: messagesArray,  // Conversation history as {role, content} array
        prompt,              // Full concatenated string for local/runpod
        characterName: character ? character.name : 'Assistant'
    };
}

// Trigger words are matched against the most recent message from EACH side — the
// human's last message AND the companion's last reply — so a memory resurfaces when
// EITHER of them uses a trigger word. (Without the assistant side, the user would have
// to repeat the companion's own words back to recall something it just raised.)
function getMemoryTriggerText(messages) {
    const reversed = [...messages].reverse();
    const lastUser = reversed.find(m => m.role === 'user');
    const lastAssistant = reversed.find(m => m.role === 'assistant');
    return [lastUser, lastAssistant].filter(Boolean).map(m => m.content || '').join(' ');
}

function normalizeMemoryText(text) {
    return String(text || '')
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/https?:\/\/\S+/g, ' ')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function getMemoryDedupeTokens(text) {
    const stopWords = new Set([
        'about', 'after', 'also', 'and', 'are', 'because', 'been', 'but', 'can',
        'did', 'does', 'for', 'from', 'had', 'has', 'have', 'her', 'him', 'his',
        'into', 'its', 'not', 'now', 'one', 'only', 'our', 'out', 'she', 'that',
        'the', 'their', 'them', 'then', 'there', 'they', 'this', 'was', 'were',
        'what', 'when', 'where', 'which', 'while', 'who', 'will', 'with', 'you',
        'your'
    ]);
    return normalizeMemoryText(text)
        .split(' ')
        .filter(token => token.length > 2 && !stopWords.has(token))
        .map(token => token.length > 4 && token.endsWith('s') ? token.slice(0, -1) : token);
}

function memoryEntriesSimilar(a, b) {
    const aNorm = normalizeMemoryText(a);
    const bNorm = normalizeMemoryText(b);
    if (!aNorm || !bNorm) return false;
    if (aNorm === bNorm) return true;
    if (aNorm.length > 40 && bNorm.length > 40 && (aNorm.includes(bNorm) || bNorm.includes(aNorm))) {
        return true;
    }

    const aSet = new Set(getMemoryDedupeTokens(aNorm));
    const bSet = new Set(getMemoryDedupeTokens(bNorm));
    if (aSet.size < MEMORY_DEDUPE_MIN_TOKENS || bSet.size < MEMORY_DEDUPE_MIN_TOKENS) {
        return false;
    }

    let shared = 0;
    aSet.forEach(token => {
        if (bSet.has(token)) shared++;
    });
    const union = aSet.size + bSet.size - shared;
    const jaccard = union ? shared / union : 0;
    const containment = shared / Math.min(aSet.size, bSet.size);
    return jaccard >= MEMORY_DEDUPE_JACCARD_THRESHOLD || containment >= MEMORY_DEDUPE_CONTAINMENT_THRESHOLD;
}

function dedupeMemoryEntries(entries) {
    const deduped = [];
    entries.forEach(entry => {
        if (entry.type === 'behaviour') {
            deduped.push(entry);
            return;
        }
        const alreadyIncluded = deduped.some(existing =>
            existing.type !== 'behaviour' && memoryEntriesSimilar(existing.content, entry.content)
        );
        if (!alreadyIncluded) {
            deduped.push(entry);
        }
    });
    return deduped;
}

function mergeMemoryTriggers(existing, incoming) {
    const seen = new Set();
    const merged = [];
    [existing, incoming].forEach(value => {
        String(value || '').split(',').forEach(part => {
            const trigger = part.trim();
            const key = trigger.toLowerCase();
            if (trigger && !seen.has(key)) {
                seen.add(key);
                merged.push(trigger);
            }
        });
    });
    return merged.join(', ');
}

function findDuplicateMemoryEntry(books, content) {
    for (const book of books) {
        const entries = Array.isArray(book.entries) ? book.entries : [];
        const entry = entries.find(candidate =>
            candidate.type !== 'behaviour' && memoryEntriesSimilar(candidate.content, content)
        );
        if (entry) {
            return { book, entry };
        }
    }
    return null;
}

function localDateStamp(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function compactLedgerText(text) {
    const compact = String(text || '').replace(/\s+/g, ' ').trim();
    if (compact.length <= MEMORY_LEDGER_SUMMARY_MAX_CHARS) return compact;
    return `${compact.slice(0, MEMORY_LEDGER_SUMMARY_MAX_CHARS - 1).trim()}…`;
}

function persistChatAutosave() {
    try {
        localStorage.setItem('msl-chat-autosave', JSON.stringify(state.currentChat));
    } catch (e) {
        console.warn('Chat autosave failed:', e.message);
    }
}

function addMemoryLedgerEntry({ status, bookName, triggers, content }) {
    if (!Array.isArray(state.currentChat.memoryLedger)) {
        state.currentChat.memoryLedger = [];
    }
    const summary = compactLedgerText(content);
    const summaryNorm = normalizeMemoryText(summary);
    const alreadyLogged = state.currentChat.memoryLedger.some(line => {
        const lineNorm = normalizeMemoryText(line);
        return line.includes(`"${bookName}"`) && (
            (summaryNorm && lineNorm.includes(summaryNorm)) ||
            memoryEntriesSimilar(line, summary)
        );
    });
    if (alreadyLogged) {
        return;
    }
    const line = `${localDateStamp()}: memory_add ${status} in "${bookName}" (triggers: ${triggers || 'none'}) — ${summary}`;
    state.currentChat.memoryLedger.push(line);
    if (state.currentChat.memoryLedger.length > MEMORY_LEDGER_MAX_ENTRIES) {
        state.currentChat.memoryLedger = state.currentChat.memoryLedger.slice(-MEMORY_LEDGER_MAX_ENTRIES);
    }
    persistChatAutosave();
}

function formatMemoryLedger() {
    const ledger = Array.isArray(state.currentChat.memoryLedger) ? state.currentChat.memoryLedger : [];
    if (ledger.length === 0) return '';
    return `\n### Memory operation ledger (this chat — actual memory_add tool results):\n${ledger.map(line => `- ${line}`).join('\n')}\n`;
}

// Heartbeat receipts: so the companion knows on the next turn that a beat fired
// and which tools it actually called — no self-logging, no guessing.
function addHeartbeatReceipt(toolLabels) {
    if (!Array.isArray(state.currentChat.heartbeatReceipts)) {
        state.currentChat.heartbeatReceipts = [];
    }
    const now = new Date();
    const hm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const did = toolLabels.length ? `tools called: ${toolLabels.join(', ')}` : 'no tool calls';
    state.currentChat.heartbeatReceipts.push(`${localDateStamp()} ${hm}: heartbeat ran — ${did}`);
    if (state.currentChat.heartbeatReceipts.length > HEARTBEAT_RECEIPTS_MAX) {
        state.currentChat.heartbeatReceipts = state.currentChat.heartbeatReceipts.slice(-HEARTBEAT_RECEIPTS_MAX);
    }
    persistChatAutosave();
}

function formatHeartbeatReceipts() {
    const receipts = Array.isArray(state.currentChat.heartbeatReceipts) ? state.currentChat.heartbeatReceipts : [];
    if (receipts.length === 0) return '';
    return `\n### Heartbeat receipts (idle housekeeping that actually ran while the user was away):\n${receipts.map(line => `- ${line}`).join('\n')}\n`;
}

function getRelevantMemoryEntries(text, memoryBookIds) {
    const relevant = [];
    const textLower = text.toLowerCase();
    
    memoryBookIds.forEach(bookId => {
        const book = state.memoryBooks.find(b => b.id === bookId);
        if (book && book.entries) {
            book.entries.forEach(entry => {
                const triggers = String(entry.triggers || '').toLowerCase().split(',').map(t => t.trim()).filter(Boolean);
                if (triggers.some(trigger => textLower.includes(trigger))) {
                    relevant.push(entry);
                }
            });
        }
    });
    
    return dedupeMemoryEntries(relevant);
}

// Render triggered memory-book entries by type. "behaviour" entries are rules the model
// must follow this turn, so they go in a clearly-delimited authoritative block. "memory"
// entries (the default for older entries with no type) are recalled context — framed gently
// so the model treats them as background, not commands.
function formatTriggeredMemoryEntries(entries) {
    const behaviour = entries.filter(e => e.type === 'behaviour');
    const memory = entries.filter(e => e.type !== 'behaviour');
    const out = [];

    if (behaviour.length > 0) {
        out.push('\nBEGIN_ACTIVE_BEHAVIOUR');
        out.push("Triggered by the user's current message. Treat the following as in force for THIS reply — active instructions, not optional background:");
        behaviour.forEach(entry => out.push(entry.content));
        out.push('END_ACTIVE_BEHAVIOUR\n');
    }

    if (memory.length > 0) {
        out.push('\n### Relevant background (recalled context — apply where it fits):');
        memory.forEach(entry => out.push(entry.content));
    }

    return out.join('\n');
}

async function callEndpoint(messageData) {
    imageGenCount = 0; // new turn — reset the per-turn image-generation cost cap
    const samplers = getSamplerSettings();
    const endpoint = state.settings.activeEndpoint;
    const config = state.settings.endpoints[endpoint];

    updateConnectionStatus('connecting');

    try {
        let result;

        if (endpoint === 'local' || endpoint === 'runpod') {
            result = await callLlamaCpp(config.url, messageData, samplers);
        } else if (endpoint === 'openrouter') {
            result = await callOpenRouter(config, messageData, samplers);
        } else if (endpoint === 'claude') {
            result = await callClaude(config, messageData, samplers);
        } else if (endpoint === 'nous') {
            result = await callNous(config, messageData, samplers);
        } else if (endpoint === 'openai') {
            result = await callOpenAI(config, messageData, samplers);
        } else if (endpoint === 'gemini') {
            result = await callGemini(config, messageData, samplers);
        } else if (endpoint === 'mistral') {
            result = await callMistral(config, messageData, samplers);
        }

        updateConnectionStatus('connected');
        updateCacheIndicator(result?.usage || null);
        return result;

    } catch (error) {
        updateConnectionStatus('error');
        throw error;
    }
}

// Map a provider config's cache fields to the dropdown value.
function cacheModeFromConfig(cfg) {
    if (!cfg || cfg.cacheEnabled === false) return 'off';
    return cfg.cacheTtl === '1h' ? '1h' : '5m';
}

// Build a cache_control block respecting the configured TTL.
function buildCacheControl(cfg) {
    const cc = { type: 'ephemeral' };
    if (cfg && cfg.cacheTtl === '1h') cc.ttl = '1h';
    return cc;
}

// === Cache usage extraction helpers ===
// Normalize provider-specific usage objects into { cacheRead, cacheWrite } (both optional).
function extractAnthropicUsage(usage) {
    if (!usage) return null;
    const read = usage.cache_read_input_tokens || 0;
    const write = usage.cache_creation_input_tokens || 0;
    if (!read && !write) return null;
    return { cacheRead: read, cacheWrite: write };
}
function extractOpenAIChatUsage(usage) {
    // Chat Completions puts cache reads under prompt_tokens_details.cached_tokens
    if (!usage) return null;
    const cached = usage.prompt_tokens_details?.cached_tokens || 0;
    if (!cached) return null;
    return { cacheRead: cached, cacheWrite: 0 };
}
function extractOpenAIResponsesUsage(usage) {
    // Responses API puts it under input_tokens_details.cached_tokens
    if (!usage) return null;
    const cached = usage.input_tokens_details?.cached_tokens || 0;
    if (!cached) return null;
    return { cacheRead: cached, cacheWrite: 0 };
}

// === Tool use (Claude + OpenAI) ===
// Five bundled tools:
//   calculator  — arithmetic in-browser (no network)
//   web_search  — Brave API, proxied through Python server
//   url_fetch   — fetch URL, strip HTML, return text; proxied through Python
//   file_read   — read a file from the user-configured working directory; proxied through Python
//   file_search — search text files under the working dir for terms (OR), returns chunks not full files
const TOOL_LOOP_MAX_ITERATIONS = 10;
// Per-memory-entry cap — summaries, not essays. Enforced in THREE places so it
// can't leak in: the editor textarea (maxlength), the save handler, and the
// memory_add tool. The book TOTAL stays uncapped — only each entry is limited.
const MEMORY_ENTRY_MAX_TOKENS = 500;
const MEMORY_ENTRY_MAX_CHARS = 2000; // ~500 tokens at ~4 chars/token
const MEMORY_DEDUPE_MIN_TOKENS = 6;
const MEMORY_DEDUPE_JACCARD_THRESHOLD = 0.72;
const MEMORY_DEDUPE_CONTAINMENT_THRESHOLD = 0.88;
const MEMORY_LEDGER_MAX_ENTRIES = 12;
const HEARTBEAT_RECEIPTS_MAX = 6;
const MEMORY_LEDGER_SUMMARY_MAX_CHARS = 180;
// OpenAI reasoning models (o-series, gpt-5.x) bill hidden reasoning against
// max_output_tokens, so on a small budget the reasoning can eat the whole lot and
// the visible answer comes back empty. Give reasoning its own headroom ON TOP of
// the user's max-tokens slider so the answer isn't starved. It's a ceiling, not a
// forced spend — the model only generates what it needs.
const OPENAI_REASONING_RESERVE = 8192;

const TOOL_DEFS = [
    {
        name: 'calculator',
        description: 'Evaluate a numeric arithmetic expression. Supports +, -, *, /, %, **, parentheses, and Math functions (sqrt, pow, log, sin, cos, tan, abs, floor, ceil, round, min, max, PI, E). Returns the numeric result.',
        input_schema: {
            type: 'object',
            properties: {
                expression: { type: 'string', description: 'An arithmetic expression, e.g. "2 * (3 + 4)" or "Math.sqrt(144)"' }
            },
            required: ['expression']
        }
    },
    {
        name: 'web_search',
        description: 'Search the web using Brave Search. Returns a list of results with title, url, and description. Use when you need current information from the internet.',
        input_schema: {
            type: 'object',
            properties: {
                query: { type: 'string', description: 'The search query' },
                count: { type: 'integer', description: 'Number of results (1-10, default 5)' }
            },
            required: ['query']
        }
    },
    {
        name: 'url_fetch',
        description: 'Fetch a web page and return its extracted text content (HTML tags stripped). Use after web_search to read a specific result, or to read a URL the user provides.',
        input_schema: {
            type: 'object',
            properties: {
                url: { type: 'string', description: 'The full http(s) URL to fetch' }
            },
            required: ['url']
        }
    },
    {
        name: 'file_read',
        description: 'Read a text file from the user\'s configured working directory. Path is relative to that directory. Use when the user wants you to look at one of their local files.',
        input_schema: {
            type: 'object',
            properties: {
                path: { type: 'string', description: 'Path relative to the configured working directory. May include subfolders (e.g. "src/app.js"). Must not escape the working dir.' }
            },
            required: ['path']
        }
    },
    {
        name: 'file_search',
        description: 'Find an exact word, phrase, or quote in the user\'s OWN local files (their configured working directory). This is the right tool whenever the user asks you to search, find, or look up something in their files, notes, documents, or working folder — as opposed to web_search, which is for the public internet. Searches text files for any of the given terms (OR match, case-insensitive) and returns matching chunks with file and line location, not full file contents. For .md files, returns the full section under the nearest header containing the match. For other text files, returns ~10 lines of context around each match. Also use it instead of file_read to explore large reference files (novel chapters, archives, notes) without loading them in full. Pass multiple terms in one call to avoid redundant searches.',
        input_schema: {
            type: 'object',
            properties: {
                terms: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'One or more search terms. Any match wins (OR logic). Case-insensitive substring match.'
                },
                path: {
                    type: 'string',
                    description: 'Optional. Restrict search to a single file or subfolder, relative to the working directory. Omit to search the whole working directory.'
                }
            },
            required: ['terms']
        }
    },
    {
        name: 'file_write',
        description: 'Create or overwrite a text file inside the user\'s working directory. To EDIT an existing file, read it first with file_read, change the text, then call file_write with the FULL new contents (it replaces the whole file). The path is relative to the working directory and cannot escape it; parent folders are created as needed. Use only when the user asks you to save or change a file.',
        input_schema: {
            type: 'object',
            properties: {
                path: { type: 'string', description: 'Path relative to the working directory, e.g. "notes/today.md". Must not escape the working dir.' },
                content: { type: 'string', description: 'The full text to write. This REPLACES the entire file contents.' }
            },
            required: ['path', 'content']
        }
    },
    {
        name: 'image_generate',
        description: 'Generate an image from a text prompt using the Banana Studio / imgeditor.co provider (gpt-image-2). The image is shown to the user automatically — do NOT paste any URL or link into your reply, and do NOT call this tool more than once per turn. Call it again only if the user explicitly asks for a different image.',
        input_schema: {
            type: 'object',
            properties: {
                prompt: { type: 'string', description: 'Text description of the desired image.' },
                aspect_ratio: { type: 'string', description: 'Optional aspect ratio, e.g. "1:1", "16:9", "9:16". Default "1:1".' },
                resolution: { type: 'string', description: 'Optional resolution tier, e.g. "1K", "2K". Default "1K".' },
                quality: { type: 'string', description: 'Optional quality, e.g. "standard", "high". Default "standard".' },
                output_format: { type: 'string', enum: ['jpeg', 'png'], description: 'Optional output format. Supported: "jpeg", "png". Default "jpeg".' }
            },
            required: ['prompt']
        }
    },
    {
        name: 'memory_add',
        description: "Save a durable memory into your OWN companion's memory book so you can recall it in a future chat. Use it for facts worth keeping — the user's preferences, names, what happened, ongoing threads. Store a SHORT SUMMARY, not an essay (max ~500 tokens). Choose trigger words that are likely to appear in a future message so the memory resurfaces when it's relevant. This only ever writes a normal recall memory — it cannot create binding behaviour rules; those are the user's to set.",
        input_schema: {
            type: 'object',
            properties: {
                triggers: { type: 'string', description: 'Comma-separated keywords that should bring this memory back, e.g. "tea, mornings, ritual". Pick words likely to appear in a future message.' },
                content: { type: 'string', description: 'The memory text — a concise summary (max ~500 tokens). Not an essay.' },
                book: { type: 'string', description: 'Optional. The name of which assigned memory book to write to, if this companion has more than one. Omit to use the first.' }
            },
            required: ['triggers', 'content']
        }
    }
];

// Convert Claude-style tool defs to OpenAI Responses / Chat Completions format.
function getClaudeToolDefs() {
    return TOOL_DEFS.map(t => ({
        name: t.name,
        description: t.description,
        input_schema: t.input_schema
    }));
}
function getOpenAIChatToolDefs() {
    // Chat Completions: { type: "function", function: { name, description, parameters } }
    return TOOL_DEFS.map(t => ({
        type: 'function',
        function: {
            name: t.name,
            description: t.description,
            parameters: t.input_schema
        }
    }));
}
function getOpenAIResponsesToolDefs() {
    // Responses API: { type: "function", name, description, parameters }
    return TOOL_DEFS.map(t => ({
        type: 'function',
        name: t.name,
        description: t.description,
        parameters: t.input_schema
    }));
}
function getGeminiToolDefs() {
    // Gemini: tools: [{ functionDeclarations: [{ name, description, parameters }] }]
    return [{
        functionDeclarations: TOOL_DEFS.map(t => ({
            name: t.name,
            description: t.description,
            parameters: t.input_schema
        }))
    }];
}

function toolsAreEnabled() {
    return !!state.settings.tools?.enabled;
}

// Safer calculator: evaluate arithmetic + a small allowlist of Math.* helpers.
function runCalculator(expr) {
    if (typeof expr !== 'string') throw new Error('expression must be a string');
    // Allow: digits, whitespace, operators, parens, dots, commas, and "Math.identifier"
    // Disallow bracket access, semicolons, backticks, assignment, control flow keywords.
    const stripped = expr.replace(/Math\.[A-Za-z_][A-Za-z0-9_]*/g, '');
    if (!/^[\d\s+\-*/%().,]*$/.test(stripped)) {
        throw new Error('Expression contains disallowed characters. Only numbers, + - * / % ** ( ) , and Math.* are allowed.');
    }
    // eslint-disable-next-line no-new-func
    const fn = new Function('Math', `"use strict"; return (${expr});`);
    const result = fn(Math);
    if (typeof result !== 'number' || !Number.isFinite(result)) {
        throw new Error('Result is not a finite number');
    }
    return result;
}

async function postToolProxy(path, body) {
    const resp = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    const data = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }));
    if (!resp.ok) {
        throw new Error(data.error || `HTTP ${resp.status}`);
    }
    return data;
}

// Execute a single tool call. Returns a string result (model-friendly).
// Throws on fatal errors; caller will format the error as a tool_result.
async function executeTool(name, input) {
    input = input || {};
    if (heartbeatRunning) {
        const hint = input.path || input.query || input.url || input.book || '';
        heartbeatToolCalls.push(hint ? `${name} (${String(hint).slice(0, 60)})` : name);
    }
    if (name === 'calculator') {
        const result = runCalculator(input.expression);
        return `${input.expression} = ${result}`;
    }
    if (name === 'web_search') {
        const braveKey = (state.settings.tools?.braveKey || '').trim();
        const data = await postToolProxy('/api/tool/web_search', {
            api_key: braveKey,
            query: input.query,
            count: input.count
        });
        const lines = [`Search results for: ${data.query}`];
        (data.results || []).forEach((r, i) => {
            lines.push(`\n[${i + 1}] ${r.title}\n${r.url}\n${r.description}`);
        });
        if (!data.results || data.results.length === 0) {
            lines.push('\n(no results)');
        }
        return lines.join('\n');
    }
    if (name === 'url_fetch') {
        const data = await postToolProxy('/api/tool/url_fetch', { url: input.url });
        const header = data.title ? `Title: ${data.title}\nURL: ${data.url}\n` : `URL: ${data.url}\n`;
        const note = data.truncated ? '\n\n[content truncated]' : '';
        return `${header}\n${data.text}${note}`;
    }
    if (name === 'file_read') {
        const workingDir = (state.settings.tools?.workingDir || '').trim();
        const data = await postToolProxy('/api/tool/file_read', {
            working_dir: workingDir,
            path: input.path
        });
        const note = data.truncated ? '\n\n[content truncated]' : '';
        return `File: ${data.path} (${data.size} bytes)\n\n${data.content}${note}`;
    }
    if (name === 'file_write') {
        const workingDir = (state.settings.tools?.workingDir || '').trim();
        const data = await postToolProxy('/api/tool/file_write', {
            working_dir: workingDir,
            path: input.path,
            content: input.content
        });
        const action = data.created ? 'Created' : 'Updated';
        return `${action} ${data.path} (${data.bytes_written} bytes written).`;
    }
    if (name === 'file_search') {
        const workingDir = (state.settings.tools?.workingDir || '').trim();
        const data = await postToolProxy('/api/tool/file_search', {
            working_dir: workingDir,
            terms: input.terms,
            path: input.path
        });
        if (!data.matches || data.matches.length === 0) {
            return `No matches for: ${(data.terms || []).join(', ')}\n(scanned ${data.files_scanned} file${data.files_scanned === 1 ? '' : 's'})`;
        }
        const header = `Found ${data.total_hits} hit${data.total_hits === 1 ? '' : 's'} across ${data.files_scanned} file${data.files_scanned === 1 ? '' : 's'} for: ${(data.terms || []).join(', ')}`;
        const chunks = data.matches.map((m, i) => {
            const loc = m.section ? `${m.file}:${m.line} — ${m.section}` : `${m.file}:${m.line}`;
            return `[${i + 1}] ${loc}  (matched "${m.term}")\n\n${m.content}`;
        });
        const tail = data.truncated ? `\n\n[showing first ${data.matches.length} matches — narrow terms or use path to scope]` : '';
        return `${header}\n\n${chunks.join('\n\n---\n\n')}${tail}`;
    }
    if (name === 'image_generate') {
        // Cost seatbelt: at most one image per turn. Without this, an excited model can
        // fire image_generate several times in a single turn, and each one costs real money.
        if (imageGenCount >= 1) {
            return 'Image NOT generated: one image per turn is the limit, and an image was already created and shown to the user this turn. Do not call image_generate again now. If the user wants another image, they can ask on their next message.';
        }
        const apiKey = (state?.settings?.tools?.image?.key || '').trim();
        if (!apiKey) {
            throw new Error('Missing Banana Studio API key');
        }
        // Only the prompt and aspect ratio are forwarded. Resolution, quality and format
        // are forced to cheap/JPEG values server-side (start.py) so the model can't run up
        // the bill by requesting a huge 2K/high/PNG image.
        const data = await postToolProxy('/api/tool/image_generate', {
            apiKey,
            prompt: input.prompt,
            aspect_ratio: input.aspect_ratio
        });
        const imageUrl = data.image_url;
        if (!imageUrl) {
            throw new Error('Image provider returned no image_url');
        }
        imageGenCount++;
        // Persist a chat message so the image stays in transcript across renders.
        state.currentChat.messages.push({
            role: 'assistant',
            content: `(image: ${input.prompt})`,
            messageId: generateId(),
            rejected: [],
            imageUrl: imageUrl
        });
        renderChat();
        // Do NOT return the raw URL — models tend to paste it into their reply as a link,
        // which confuses users (the image is already shown inline). Return a plain success
        // signal that also tells the model to stop.
        return 'Image generated successfully and displayed to the user in the chat. The user can see it now. Do NOT paste any URL or link into your reply, and do NOT call image_generate again unless the user explicitly asks for a different image.';
    }
    if (name === 'memory_add') {
        const triggers = (input.triggers || '').trim();
        const content = (input.content || '').trim();
        if (!triggers) throw new Error('memory_add needs trigger words.');
        if (!content) throw new Error('memory_add needs some content to save.');
        // Cap per entry — summaries, not essays. (Place 3 of 3.)
        const estTokens = estimateTokens(content);
        if (estTokens > MEMORY_ENTRY_MAX_TOKENS) {
            throw new Error(`That memory is too long (~${estTokens} tokens). Store a summary, not an essay — max ~${MEMORY_ENTRY_MAX_TOKENS} tokens.`);
        }
        const char = state.characters.find(c => c.id === state.currentChat.characterId);
        if (!char) throw new Error('No active companion is selected, so there is no memory book to save into.');
        const bookIds = char.memoryBookIds || [];
        // Scope is structural: only ever the ACTIVE companion's assigned books.
        const assignedBooks = bookIds
            .map(id => state.memoryBooks.find(b => b.id === id))
            .filter(Boolean);
        if (assignedBooks.length === 0) {
            throw new Error(`${char.name} has no memory book assigned, so there is nowhere to save this. The user can assign one in the companion editor.`);
        }
        let targetBook;
        if (input.book) {
            const wanted = String(input.book).trim().toLowerCase();
            targetBook = assignedBooks.find(b => (b.name || '').toLowerCase() === wanted);
            if (!targetBook) {
                throw new Error(`No assigned memory book named "${input.book}". This companion's books: ${assignedBooks.map(b => b.name).join(', ')}.`);
            }
        } else {
            targetBook = assignedBooks[0];
        }
        if (!Array.isArray(targetBook.entries)) targetBook.entries = [];
        const duplicate = findDuplicateMemoryEntry(assignedBooks, content);
        if (duplicate) {
            const mergedTriggers = mergeMemoryTriggers(duplicate.entry.triggers, triggers);
            if (mergedTriggers !== (duplicate.entry.triggers || '')) {
                duplicate.entry.triggers = mergedTriggers;
                addMemoryLedgerEntry({
                    status: 'already existed; triggers updated',
                    bookName: duplicate.book.name,
                    triggers: mergedTriggers,
                    content
                });
                saveState();
                renderMemoryBooks();
                return `Memory already existed in "${duplicate.book.name}", so no new entry was saved. Updated its triggers: ${mergedTriggers}. Do not call memory_add again for this fact.`;
            }
            addMemoryLedgerEntry({
                status: 'already existed; no new entry saved',
                bookName: duplicate.book.name,
                triggers: duplicate.entry.triggers || '',
                content
            });
            return `Memory already exists in "${duplicate.book.name}" (triggers: ${duplicate.entry.triggers || 'none'}). No new entry was saved. Do not call memory_add again for this fact.`;
        }
        // memory_add ONLY ever writes recall memories — never binding behaviour rules.
        // Behaviour entries (incl. the user's accessibility rules) are the user's to author.
        targetBook.entries.push({ triggers, content, type: 'memory' });
        addMemoryLedgerEntry({
            status: 'saved',
            bookName: targetBook.name,
            triggers,
            content
        });
        saveState();
        renderMemoryBooks();
        return `Saved a memory to "${targetBook.name}" (triggers: ${triggers}).`;
    }
    throw new Error(`Unknown tool: ${name}`);
}

// Render a tool call inline in the chat transcript (lightweight).
function renderToolEvent(toolName, input, outputPreview, isError) {
    // During a heartbeat the work is meant to be invisible — don't flash tool chips.
    if (heartbeatRunning) return;
    const container = document.getElementById('chatMessages');
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'tool-event' + (isError ? ' tool-error' : '');
    const argsStr = (() => {
        try { return JSON.stringify(input); } catch { return String(input); }
    })();
    const preview = (outputPreview || '').replace(/\s+/g, ' ').slice(0, 200);
    div.innerHTML = `
        <div class="tool-event-header">${isError ? 'tool error' : 'tool'} · <code>${escapeHtml(toolName)}</code></div>
        <div class="tool-event-args"><code>${escapeHtml(argsStr)}</code></div>
        ${preview ? `<div class="tool-event-output">${escapeHtml(preview)}${outputPreview && outputPreview.length > 200 ? '…' : ''}</div>` : ''}
    `;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

// Visible notice appended when a provider stops because it hit the token cap,
// so a truncated reply reads as cut-off instead of silently masquerading as a
// finished answer. Each provider passes its own truncation flag (the finish-
// reason field name differs per API).
const TRUNCATION_NOTICE = '⚠️ *Your **token max** slider is set too low for this response. Please adjust it in the Machine Room.*';
function withTruncationNotice(text, wasTruncated) {
    if (!wasTruncated) return text;
    return (text ? text + '\n\n' : '') + TRUNCATION_NOTICE;
}

// === Provider: Local llama.cpp / RunPod ===
async function callLlamaCpp(baseUrl, messageData, samplers) {
    // Local/RunPod uses the concatenated prompt string (completion-style)
    const body = {
        messages: [{ role: 'user', content: messageData.prompt }],
        temperature: samplers.temperature,
        min_p: samplers.min_p,
        top_p: samplers.top_p,
        max_tokens: samplers.max_tokens,
        repeat_penalty: samplers.repetition_penalty,
        stop: ['User:', '\nUser:', '\n### ']
    };
    if (PROVIDER_SUPPORT[state.settings.activeEndpoint]?.topK) {
        body.top_k = samplers.top_k;
    }

    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        throw new Error(`llama.cpp error: ${response.status}`);
    }

    const data = await response.json();
    return { text: withTruncationNotice(data.choices[0].message.content.trim(), data.choices[0].finish_reason === 'length'), usage: null };
}

// === Provider: OpenRouter ===
async function callOpenRouter(config, messageData, samplers) {
    // OpenRouter forwards body fields to the underlying provider, so route-specific
    // restrictions still apply. Detect by model slug prefix.
    const isAnthropic = typeof config.model === 'string' && config.model.startsWith('anthropic/');
    const isOpenAI = typeof config.model === 'string' && config.model.startsWith('openai/');
    // No prompt caching on OpenRouter — it routes to many different upstreams,
    // so a cache breakpoint isn't reliable.

    const apiMessages = [];
    if (messageData.system) {
        apiMessages.push({ role: 'system', content: messageData.system });
    }
    apiMessages.push(...messageData.messages.map(m => ({ role: m.role, content: contentOpenAIChat(m) })));

    const useTools = toolsAreEnabled();

    // OpenRouter surfaces Anthropic-style cache usage when routing to Anthropic.
    let aggUsage = null;
    const mergeUsage = (u) => {
        const norm = extractAnthropicUsage(u) || extractOpenAIChatUsage(u);
        if (!norm) return;
        if (!aggUsage) aggUsage = { cacheRead: 0, cacheWrite: 0 };
        aggUsage.cacheRead += norm.cacheRead || 0;
        aggUsage.cacheWrite += norm.cacheWrite || 0;
    };

    for (let iter = 0; iter < TOOL_LOOP_MAX_ITERATIONS; iter++) {
        const body = {
            model: config.model,
            messages: apiMessages,
            temperature: samplers.temperature,
            max_tokens: samplers.max_tokens,
            top_p: samplers.top_p
        };
        // Strip top_k when OpenRouter routes to a provider that doesn't accept it.
        if (PROVIDER_SUPPORT.openrouter.topK && !isAnthropic && !isOpenAI) {
            body.top_k = samplers.top_k;
        }
        if (useTools) {
            body.tools = getOpenAIChatToolDefs();
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.key}`,
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': "Little Lantern"
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            let errorMsg = `OpenRouter error: ${response.status}`;
            try {
                const error = await response.json();
                errorMsg = error.error?.message || errorMsg;
            } catch (e) { /* non-JSON error body */ }
            throw new Error(errorMsg);
        }

        const data = await response.json();
        mergeUsage(data.usage);
        recordTokens(data.usage);

        const msg = data.choices[0].message;
        const toolCalls = msg.tool_calls || [];

        if (!toolCalls.length) {
            return { text: withTruncationNotice((msg.content || '').trim(), data.choices[0].finish_reason === 'length'), usage: aggUsage };
        }

        // Append assistant turn (with tool_calls), then each tool result.
        apiMessages.push({
            role: 'assistant',
            content: msg.content || '',
            tool_calls: toolCalls
        });

        for (const call of toolCalls) {
            let parsedArgs;
            try { parsedArgs = JSON.parse(call.function?.arguments || '{}'); }
            catch { parsedArgs = {}; }
            let outputStr;
            let isError = false;
            try {
                outputStr = await executeTool(call.function?.name, parsedArgs);
            } catch (e) {
                outputStr = `Error: ${e.message || String(e)}`;
                isError = true;
            }
            renderToolEvent(call.function?.name, parsedArgs, outputStr, isError);
            apiMessages.push({
                role: 'tool',
                tool_call_id: call.id,
                content: outputStr
            });
        }
    }

    throw new Error(`OpenRouter tool loop exceeded ${TOOL_LOOP_MAX_ITERATIONS} iterations without final answer`);
}

// === Provider: Claude API (Anthropic) ===
async function callClaude(config, messageData, samplers) {
    const cacheOn = config.cacheEnabled !== false;
    const cacheControl = buildCacheControl(config);
    const useTools = toolsAreEnabled();

    // Build initial messages array. Cache_control goes on system + last user message.
    let workingMessages;
    if (cacheOn && messageData.messages.length > 0) {
        const baseMsgs = messageData.messages.slice(0, -1).map(m => ({ role: m.role, content: contentClaude(m, null) }));
        const lastMsg = messageData.messages[messageData.messages.length - 1];
        workingMessages = [
            ...baseMsgs,
            { role: lastMsg.role, content: contentClaude(lastMsg, cacheControl) }
        ];
    } else {
        workingMessages = messageData.messages.map(m => ({ role: m.role, content: contentClaude(m, null) }));
    }

    const systemField = messageData.system
        ? (cacheOn
            ? [{ type: 'text', text: messageData.system, cache_control: cacheControl }]
            : messageData.system)
        : undefined;

    const headers = {
        'Content-Type': 'application/json',
        'x-api-key': config.key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
    };
    if (cacheOn && config.cacheTtl === '1h') {
        headers['anthropic-beta'] = 'extended-cache-ttl-2025-04-11';
    }

    // Aggregate cache usage across the whole loop so the indicator reflects the turn.
    let aggUsage = null;
    const mergeUsage = (u) => {
        const norm = extractAnthropicUsage(u);
        if (!norm) return;
        if (!aggUsage) aggUsage = { cacheRead: 0, cacheWrite: 0 };
        aggUsage.cacheRead += norm.cacheRead || 0;
        aggUsage.cacheWrite += norm.cacheWrite || 0;
    };

    for (let iter = 0; iter < TOOL_LOOP_MAX_ITERATIONS; iter++) {
        const body = {
            model: config.model,
            max_tokens: samplers.max_tokens,
            messages: workingMessages
        };
        if (systemField !== undefined) body.system = systemField;

        if (isClaudeEffortModel(config.model)) {
            // Adaptive-thinking Claude models reject samplers. Use effort instead;
            // only the Opus 4.7/4.8 family needs an explicit thinking switch.
            if (needsClaudeAdaptiveThinkingConfig(config.model)) {
                body.thinking = { type: 'adaptive' };
            }
            body.output_config = { effort: config.effort || 'medium' };
        } else {
            // Sampler models (Opus 4.5/4.6, Sonnet 4.5/4.6): temperature only.
            // Claude rejects temp + top_p together; one knob is clearer for users.
            body.temperature = samplers.temperature;
        }

        if (useTools) {
            body.tools = getClaudeToolDefs();
        }

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            let errorMsg = `Claude error: ${response.status}`;
            try {
                const error = await response.json();
                errorMsg = error.error?.message || errorMsg;
            } catch (e) { /* non-JSON error body */ }
            throw new Error(errorMsg);
        }

        const data = await response.json();
        mergeUsage(data.usage);
        recordTokens(data.usage);

        const stopReason = data.stop_reason;
        const contentBlocks = data.content || [];

        if (stopReason !== 'tool_use') {
            // Final turn — extract text from any text blocks.
            const text = contentBlocks
                .filter(b => b.type === 'text')
                .map(b => b.text)
                .join('')
                .trim();
            return { text: withTruncationNotice(text, stopReason === 'max_tokens'), usage: aggUsage };
        }

        // Tool use requested. Append assistant turn and run each tool.
        workingMessages.push({ role: 'assistant', content: contentBlocks });
        const toolResultBlocks = [];
        for (const block of contentBlocks) {
            if (block.type !== 'tool_use') continue;
            let outputStr;
            let isError = false;
            try {
                outputStr = await executeTool(block.name, block.input);
            } catch (e) {
                outputStr = `Error: ${e.message || String(e)}`;
                isError = true;
            }
            renderToolEvent(block.name, block.input, outputStr, isError);
            toolResultBlocks.push({
                type: 'tool_result',
                tool_use_id: block.id,
                content: outputStr,
                ...(isError ? { is_error: true } : {})
            });
        }
        workingMessages.push({ role: 'user', content: toolResultBlocks });
    }

    throw new Error(`Claude tool loop exceeded ${TOOL_LOOP_MAX_ITERATIONS} iterations without final answer`);
}

// === Provider: Nous Research ===
async function callNous(config, messageData, samplers) {
    // OpenAI-compatible. No provider-specific caching markers documented;
    // toggle is wired so we can surface cache usage if the provider reports it.
    // Hermes is text-only — any attached image is dropped (the text still sends).
    const apiMessages = [];
    if (messageData.system) {
        apiMessages.push({ role: 'system', content: messageData.system });
    }
    apiMessages.push(...messageData.messages.map(m => ({ role: m.role, content: m.content })));

    const useTools = toolsAreEnabled();

    let aggUsage = null;
    const mergeUsage = (u) => {
        const norm = extractOpenAIChatUsage(u);
        if (!norm) return;
        if (!aggUsage) aggUsage = { cacheRead: 0, cacheWrite: 0 };
        aggUsage.cacheRead += norm.cacheRead || 0;
    };

    for (let iter = 0; iter < TOOL_LOOP_MAX_ITERATIONS; iter++) {
        const body = {
            model: config.model,
            messages: apiMessages,
            temperature: samplers.temperature,
            max_tokens: samplers.max_tokens
        };
        if (useTools) {
            body.tools = getOpenAIChatToolDefs();
        }

        const response = await fetch('https://inference-api.nousresearch.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.key}`
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            // Capture FULL error response body for debugging
            let errorMsg = `Nous error: ${response.status}`;
            try {
                const errorBody = await response.json();
                errorMsg = errorBody.error?.message || JSON.stringify(errorBody);
                console.error('Nous API error response body:', errorBody);
            } catch (e) {
                try {
                    const textBody = await response.text();
                    console.error('Nous API error response (text):', textBody);
                    errorMsg = textBody || errorMsg;
                } catch (e2) { /* couldn't read body at all */ }
            }
            throw new Error(errorMsg);
        }

        const data = await response.json();
        mergeUsage(data.usage);
        recordTokens(data.usage);

        const msg = data.choices[0].message;
        const toolCalls = msg.tool_calls || [];

        if (!toolCalls.length) {
            return { text: withTruncationNotice((msg.content || '').trim(), data.choices[0].finish_reason === 'length'), usage: aggUsage };
        }

        // Append assistant turn (with tool_calls), then each tool result.
        apiMessages.push({
            role: 'assistant',
            content: msg.content || '',
            tool_calls: toolCalls
        });

        for (const call of toolCalls) {
            let parsedArgs;
            try { parsedArgs = JSON.parse(call.function?.arguments || '{}'); }
            catch { parsedArgs = {}; }
            let outputStr;
            let isError = false;
            try {
                outputStr = await executeTool(call.function?.name, parsedArgs);
            } catch (e) {
                outputStr = `Error: ${e.message || String(e)}`;
                isError = true;
            }
            renderToolEvent(call.function?.name, parsedArgs, outputStr, isError);
            apiMessages.push({
                role: 'tool',
                tool_call_id: call.id,
                content: outputStr
            });
        }
    }

    throw new Error(`Nous tool loop exceeded ${TOOL_LOOP_MAX_ITERATIONS} iterations without final answer`);
}

// === Provider: Mistral ===
// OpenAI-compatible, with tools and vision. Note: image_url is a STRING here
// (not the {url:...} object OpenAI uses).
async function callMistral(config, messageData, samplers) {
    const apiMessages = [];
    if (messageData.system) {
        apiMessages.push({ role: 'system', content: messageData.system });
    }
    apiMessages.push(...messageData.messages.map(m => ({ role: m.role, content: contentMistral(m) })));

    const useTools = toolsAreEnabled();
    // All current Mistral dropdown models are tool-capable (incl. mistral-large-2512).
    const toolCapable = useTools;

    let aggUsage = null;
    const mergeUsage = (u) => {
        const norm = extractOpenAIChatUsage(u);
        if (!norm) return;
        if (!aggUsage) aggUsage = { cacheRead: 0, cacheWrite: 0 };
        aggUsage.cacheRead += norm.cacheRead || 0;
    };

    for (let iter = 0; iter < TOOL_LOOP_MAX_ITERATIONS; iter++) {
        const body = {
            model: config.model,
            messages: apiMessages,
            temperature: samplers.temperature,
            top_p: samplers.top_p,
            max_tokens: samplers.max_tokens,
            // Opt-in prompt caching: a stable per-companion key raises hit rate.
            // Cached tokens come back under usage.prompt_tokens_details.cached_tokens.
            prompt_cache_key: `ll-${state.currentChat.characterId || 'none'}-${state.currentChat.personaId || 'none'}`
        };
        if (toolCapable) {
            body.tools = getOpenAIChatToolDefs();
        }

        const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.key}`
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            let errorMsg = `Mistral error: ${response.status}`;
            try {
                const errorBody = await response.json();
                errorMsg = errorBody.error?.message || errorBody.message || JSON.stringify(errorBody);
                console.error('Mistral API error body:', errorBody);
            } catch (e) { /* non-JSON error body */ }
            throw new Error(errorMsg);
        }

        const data = await response.json();
        mergeUsage(data.usage);
        recordTokens(data.usage);

        const msg = data.choices[0].message;
        const toolCalls = msg.tool_calls || [];

        if (!toolCalls.length) {
            return { text: withTruncationNotice((msg.content || '').trim(), data.choices[0].finish_reason === 'length'), usage: aggUsage };
        }

        // Append assistant turn (with tool_calls), then each tool result.
        apiMessages.push({
            role: 'assistant',
            content: msg.content || '',
            tool_calls: toolCalls
        });

        for (const call of toolCalls) {
            let parsedArgs;
            try { parsedArgs = JSON.parse(call.function?.arguments || '{}'); }
            catch { parsedArgs = {}; }
            let outputStr;
            let isError = false;
            try {
                outputStr = await executeTool(call.function?.name, parsedArgs);
            } catch (e) {
                outputStr = `Error: ${e.message || String(e)}`;
                isError = true;
            }
            renderToolEvent(call.function?.name, parsedArgs, outputStr, isError);
            apiMessages.push({
                role: 'tool',
                tool_call_id: call.id,
                content: outputStr
            });
        }
    }

    throw new Error(`Mistral tool loop exceeded ${TOOL_LOOP_MAX_ITERATIONS} iterations without final answer`);
}

// === Provider: Gemini (Google) ===
// Little Lantern — Gemini safety filters fully open for adult
// companion/creative use on the user's OWN BYOK key.
// All FIVE adjustable categories named explicitly: an unnamed
// category silently falls back to Google's restrictive default,
// which is the exact silent-refusal this array exists to prevent.
const geminiSafetySettings = [
    { category: "HARM_CATEGORY_HARASSMENT",        threshold: "OFF" },
    { category: "HARM_CATEGORY_HATE_SPEECH",       threshold: "OFF" },
    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "OFF" },
    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "OFF" },
    { category: "HARM_CATEGORY_CIVIC_INTEGRITY",   threshold: "OFF" }
];

// === Gemini explicit context caching (stable system bundle) ===
// Rough token estimate (~4 chars/token) to gate cache eligibility.
function estimateTokens(text) {
    return Math.ceil((text || '').length / 4);
}
// Small stable hash to key a cache by its content (no crypto needed).
function hashString(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) {
        h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    }
    return (h >>> 0).toString(36);
}
const geminiCacheStore = new Map(); // key -> { name, expiresAt }

// Create (or reuse) a Gemini cachedContent for the stable system text.
// Returns the cache name, or null on any failure (caller falls back to inline).
async function getOrCreateGeminiCache(config, systemText) {
    const key = config.model + ':' + hashString(systemText);
    const existing = geminiCacheStore.get(key);
    if (existing && existing.expiresAt > Date.now()) return existing.name;
    try {
        const ttlSeconds = 300; // 5 min — matches the "normal" cache window
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/cachedContents?key=${encodeURIComponent(config.key)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: `models/${config.model}`,
                systemInstruction: { parts: [{ text: systemText }] },
                ttl: `${ttlSeconds}s`
            })
        });
        if (!resp.ok) {
            // Most common cause: bundle below the model's minimum cache size.
            console.warn(`Gemini cache create failed (${resp.status}); using inline system instead.`);
            return null;
        }
        const data = await resp.json();
        if (!data.name) return null;
        // Expire a little early so we don't race the server's TTL.
        geminiCacheStore.set(key, { name: data.name, expiresAt: Date.now() + (ttlSeconds - 30) * 1000 });
        return data.name;
    } catch (e) {
        console.warn('Gemini cache create error; using inline system instead.', e);
        return null;
    }
}

// Gemini supports structured tools via functionDeclarations. functionCall.args
// is an object (not a JSON string); results go back as a role:"user" turn with a
// functionResponse part. Verified vs ai.google.dev function-calling docs.
async function callGemini(config, messageData, samplers) {
    const useTools = toolsAreEnabled();

    // Gemini roles: 'user' and 'model' (not 'assistant').
    const contents = messageData.messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: partsGemini(m)
    }));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.model)}:generateContent?key=${encodeURIComponent(config.key)}`;

    // Explicit caching of the STABLE system bundle (system prompt + companion +
    // persona). Volatile parts (memory hits, GM notes, compass) change per turn,
    // so they ride inline. Only worthwhile above the model's minimum cache size.
    let cachedName = null;
    if (messageData.systemStable && estimateTokens(messageData.systemStable) >= 4096) {
        cachedName = await getOrCreateGeminiCache(config, messageData.systemStable);
    }

    for (let iter = 0; iter < TOOL_LOOP_MAX_ITERATIONS; iter++) {
        // When a cache holds the system instruction, volatile context can't also
        // ride in systemInstruction — prepend it to the first user turn instead.
        let reqContents = contents;
        if (cachedName && messageData.systemVolatile) {
            reqContents = contents.map(c => ({ role: c.role, parts: c.parts.slice() }));
            const firstUser = reqContents.find(c => c.role === 'user');
            if (firstUser) firstUser.parts = [{ text: messageData.systemVolatile + '\n' }, ...firstUser.parts];
        }

        const body = {
            contents: reqContents,
            safetySettings: geminiSafetySettings,
            generationConfig: {
                temperature: samplers.temperature,
                topP: samplers.top_p,
                topK: samplers.top_k,
                maxOutputTokens: samplers.max_tokens
            }
        };
        if (cachedName) {
            body.cachedContent = cachedName;
        } else if (messageData.system) {
            body.systemInstruction = { parts: [{ text: messageData.system }] };
        }
        if (useTools) {
            body.tools = getGeminiToolDefs();
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            // A referenced cache may have expired or been evicted — drop it and
            // retry this turn inline once before surfacing a real error.
            if (cachedName) {
                geminiCacheStore.delete(config.model + ':' + hashString(messageData.systemStable));
                cachedName = null;
                continue;
            }
            let errorMsg = `Gemini error: ${response.status}`;
            try {
                const error = await response.json();
                errorMsg = error.error?.message || JSON.stringify(error);
                console.error('Gemini API error body:', error);
            } catch (e) { /* non-JSON error body */ }
            throw new Error(errorMsg);
        }

        const data = await response.json();
        recordTokens(data.usageMetadata);
        const candidate = (data.candidates || [])[0];
        if (!candidate) {
            // A blocked prompt comes back with no candidate but a promptFeedback reason.
            const reason = data.promptFeedback?.blockReason;
            throw new Error(reason ? `Gemini blocked the request: ${reason}` : 'Gemini returned no candidates');
        }

        const parts = candidate.content?.parts || [];
        const functionCalls = parts.filter(p => p.functionCall).map(p => p.functionCall);

        if (!functionCalls.length) {
            // Gemini bills hidden thinking against maxOutputTokens, so a small
            // budget can be spent reasoning before the visible answer finishes.
            const text = parts.map(p => p.text || '').join('').trim();
            return { text: withTruncationNotice(text, candidate.finishReason === 'MAX_TOKENS'), usage: null };
        }

        // Append the model's turn (carries the functionCall parts), then one
        // user turn holding every functionResponse.
        contents.push(candidate.content);

        const responseParts = [];
        for (const fc of functionCalls) {
            const args = fc.args || {};
            let outputStr;
            let isError = false;
            try {
                outputStr = await executeTool(fc.name, args);
            } catch (e) {
                outputStr = `Error: ${e.message || String(e)}`;
                isError = true;
            }
            renderToolEvent(fc.name, args, outputStr, isError);
            const fr = { name: fc.name, response: { result: outputStr } };
            if (fc.id) fr.id = fc.id;
            responseParts.push({ functionResponse: fr });
        }
        contents.push({ role: 'user', parts: responseParts });
    }

    throw new Error(`Gemini tool loop exceeded ${TOOL_LOOP_MAX_ITERATIONS} iterations without final answer`);
}

// === Provider: OpenAI ===
async function callOpenAI(config, messageData, samplers) {
    if (config.useResponsesApi) {
        return await callOpenAIResponses(config, messageData, samplers);
    } else {
        return await callOpenAIChatCompletions(config, messageData, samplers);
    }
}

// OpenAI Responses API (primary route)
async function callOpenAIResponses(config, messageData, samplers) {
    const useTools = toolsAreEnabled();

    // Responses API uses "input" array, not "messages"
    const workingInput = [];
    if (messageData.system) {
        workingInput.push({ role: 'system', content: messageData.system });
    }
    workingInput.push(...messageData.messages.map(m => ({ role: m.role, content: contentOpenAIResponses(m) })));

    let aggUsage = null;
    const mergeUsage = (u) => {
        const norm = extractOpenAIResponsesUsage(u);
        if (!norm) return;
        if (!aggUsage) aggUsage = { cacheRead: 0, cacheWrite: 0 };
        aggUsage.cacheRead += norm.cacheRead || 0;
    };

    const isThinking = isOpenAIThinkingModel(config.model);
    for (let iter = 0; iter < TOOL_LOOP_MAX_ITERATIONS; iter++) {
        const body = {
            model: config.model,
            input: workingInput,
            // Reasoning models get headroom on top of the slider so hidden reasoning can't starve the answer.
            max_output_tokens: isThinking ? samplers.max_tokens + OPENAI_REASONING_RESERVE : samplers.max_tokens
        };
        // GPT-5.x reasoning models reject temperature/top_p/penalties/logprobs.
        if (!isThinking) {
            body.temperature = samplers.temperature;
            body.top_p = samplers.top_p;
        }
        if (isThinking && config.reasoningEffort && config.reasoningEffort !== 'none') {
            body.reasoning = { effort: config.reasoningEffort };
        }
        if (useTools) {
            body.tools = getOpenAIResponsesToolDefs();
        }

        const response = await fetch('https://api.openai.com/v1/responses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.key}`
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            let errorMsg = `OpenAI Responses API error: ${response.status}`;
            try {
                const error = await response.json();
                errorMsg = error.error?.message || JSON.stringify(error);
                console.error('OpenAI Responses API error body:', error);
            } catch (e) { /* non-JSON error body */ }
            throw new Error(errorMsg);
        }

        const data = await response.json();
        mergeUsage(data.usage);
        recordTokens(data.usage);

        const output = data.output || [];
        const functionCalls = output.filter(o => o.type === 'function_call');

        if (functionCalls.length === 0) {
            // No tool calls — extract final text.
            const text = output
                .filter(o => o.type === 'message')
                .flatMap(o => (o.content || []).filter(c => c.type === 'output_text').map(c => c.text))
                .join('')
                .trim();
            const truncated = data.status === 'incomplete' && data.incomplete_details?.reason === 'max_output_tokens';
            if (!text) {
                // Empty turn — usually a reasoning model that spent its whole budget
                // thinking. Surface a helpful message instead of a raw error dumped as the reply.
                console.error('OpenAI Responses returned no text. status:', data.status, data);
                if (truncated) return { text: TRUNCATION_NOTICE, usage: aggUsage };
                return { text: '⚠️ *The model returned no reply this turn (it may have spent the turn reasoning). Try again, or raise max tokens.*', usage: aggUsage };
            }
            return { text: withTruncationNotice(text, truncated), usage: aggUsage };
        }

        // Append the entire output (including reasoning + function_call items) to preserve conversation state.
        workingInput.push(...output);

        for (const call of functionCalls) {
            let parsedArgs;
            try { parsedArgs = JSON.parse(call.arguments || '{}'); }
            catch { parsedArgs = {}; }
            let outputStr;
            let isError = false;
            try {
                outputStr = await executeTool(call.name, parsedArgs);
            } catch (e) {
                outputStr = `Error: ${e.message || String(e)}`;
                isError = true;
            }
            renderToolEvent(call.name, parsedArgs, outputStr, isError);
            workingInput.push({
                type: 'function_call_output',
                call_id: call.call_id,
                output: outputStr
            });
        }
    }

    throw new Error(`OpenAI Responses tool loop exceeded ${TOOL_LOOP_MAX_ITERATIONS} iterations without final answer`);
}

// OpenAI Chat Completions API (fallback)
async function callOpenAIChatCompletions(config, messageData, samplers) {
    const useTools = toolsAreEnabled();

    const apiMessages = [];
    if (messageData.system) {
        apiMessages.push({ role: 'system', content: messageData.system });
    }
    apiMessages.push(...messageData.messages.map(m => ({ role: m.role, content: contentOpenAIChat(m) })));

    let aggUsage = null;
    const mergeUsage = (u) => {
        const norm = extractOpenAIChatUsage(u);
        if (!norm) return;
        if (!aggUsage) aggUsage = { cacheRead: 0, cacheWrite: 0 };
        aggUsage.cacheRead += norm.cacheRead || 0;
    };

    const isThinking = isOpenAIThinkingModel(config.model);
    for (let iter = 0; iter < TOOL_LOOP_MAX_ITERATIONS; iter++) {
        const body = {
            model: config.model,
            messages: apiMessages,
            max_tokens: samplers.max_tokens
        };
        // GPT-5.x reasoning models reject temperature/top_p/penalties/logprobs.
        if (!isThinking) {
            body.temperature = samplers.temperature;
            body.top_p = samplers.top_p;
        }
        if (useTools) {
            body.tools = getOpenAIChatToolDefs();
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.key}`
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            let errorMsg = `OpenAI Chat Completions error: ${response.status}`;
            try {
                const error = await response.json();
                errorMsg = error.error?.message || JSON.stringify(error);
                console.error('OpenAI Chat Completions error body:', error);
            } catch (e) { /* non-JSON error body */ }
            throw new Error(errorMsg);
        }

        const data = await response.json();
        mergeUsage(data.usage);
        recordTokens(data.usage);

        const msg = data.choices[0].message;
        const toolCalls = msg.tool_calls || [];

        if (!toolCalls.length) {
            return { text: withTruncationNotice((msg.content || '').trim(), data.choices[0].finish_reason === 'length'), usage: aggUsage };
        }

        // Append assistant turn (including tool_calls) then each tool result.
        apiMessages.push({
            role: 'assistant',
            content: msg.content || '',
            tool_calls: toolCalls
        });

        for (const call of toolCalls) {
            let parsedArgs;
            try { parsedArgs = JSON.parse(call.function?.arguments || '{}'); }
            catch { parsedArgs = {}; }
            let outputStr;
            let isError = false;
            try {
                outputStr = await executeTool(call.function?.name, parsedArgs);
            } catch (e) {
                outputStr = `Error: ${e.message || String(e)}`;
                isError = true;
            }
            renderToolEvent(call.function?.name, parsedArgs, outputStr, isError);
            apiMessages.push({
                role: 'tool',
                tool_call_id: call.id,
                content: outputStr
            });
        }
    }

    throw new Error(`OpenAI Chat Completions tool loop exceeded ${TOOL_LOOP_MAX_ITERATIONS} iterations without final answer`);
}

function updateConnectionStatus(status) {
    const statusEl = document.getElementById('connectionStatus');
    const dot = statusEl.querySelector('.status-dot');
    const text = statusEl.querySelector('.status-text');

    dot.className = 'status-dot';

    if (status === 'connected') {
        dot.classList.add('connected');
        text.textContent = 'Connected';
    } else if (status === 'connecting') {
        text.textContent = 'Connecting...';
    } else if (status === 'error') {
        dot.classList.add('error');
        text.textContent = 'Error';
    } else {
        dot.classList.add('disconnected');
        text.textContent = 'Not Connected';
    }
}

function updateCacheIndicator(usage) {
    const el = document.getElementById('cacheIndicator');
    const valueEl = document.getElementById('cacheIndicatorValue');
    if (!el || !valueEl) return;
    if (!usage || (!usage.cacheRead && !usage.cacheWrite)) {
        el.style.display = 'none';
        return;
    }
    const parts = [];
    if (usage.cacheRead) parts.push(`${usage.cacheRead} read`);
    if (usage.cacheWrite) parts.push(`${usage.cacheWrite} write`);
    valueEl.textContent = parts.join(' / ');
    el.style.display = 'flex';
}

// === Token odometer ===
// Cumulative input/output token counts, read from each call's response usage
// object (never pre-counted client-side) and accumulated. Persisted separately
// from settings under its own localStorage key.
let tokenOdometer = { tokensIn: 0, tokensOut: 0 };
const TOKEN_ODOMETER_KEY = 'msl-token-odometer';

// Normalize the many provider usage shapes to { input, output }.
function tokensFromUsage(raw) {
    if (!raw) return { input: 0, output: 0 };
    if (typeof raw.prompt_tokens === 'number') {
        // OpenAI-compatible chat completions (OpenAI, Nous, OpenRouter, Mistral)
        return { input: raw.prompt_tokens, output: raw.completion_tokens || 0 };
    }
    if (typeof raw.input_tokens === 'number') {
        // Anthropic + OpenAI Responses. Include cached input so the total is honest.
        const cached = (raw.cache_read_input_tokens || 0) + (raw.cache_creation_input_tokens || 0);
        return { input: raw.input_tokens + cached, output: raw.output_tokens || 0 };
    }
    if (typeof raw.promptTokenCount === 'number') {
        // Gemini usageMetadata
        return { input: raw.promptTokenCount, output: raw.candidatesTokenCount || 0 };
    }
    return { input: 0, output: 0 };
}

function recordTokens(rawUsage) {
    const { input, output } = tokensFromUsage(rawUsage);
    if (!input && !output) return;
    tokenOdometer.tokensIn += input;
    tokenOdometer.tokensOut += output;
    try { localStorage.setItem(TOKEN_ODOMETER_KEY, JSON.stringify(tokenOdometer)); } catch (e) { /* ignore */ }
    updateTokenOdometer();
}

function fmtTokens(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(2) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return String(n);
}

function updateTokenOdometer() {
    const valueEl = document.getElementById('tokenOdometerValue');
    if (!valueEl) return;
    valueEl.textContent = `↑${fmtTokens(tokenOdometer.tokensIn)} ↓${fmtTokens(tokenOdometer.tokensOut)}`;
}

function loadTokenOdometer() {
    try {
        const raw = localStorage.getItem(TOKEN_ODOMETER_KEY);
        if (raw) {
            const o = JSON.parse(raw);
            tokenOdometer = { tokensIn: o.tokensIn || 0, tokensOut: o.tokensOut || 0 };
        }
    } catch (e) { /* ignore */ }
    updateTokenOdometer();
    const resetBtn = document.getElementById('tokenOdometerReset');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            tokenOdometer = { tokensIn: 0, tokensOut: 0 };
            try { localStorage.setItem(TOKEN_ODOMETER_KEY, JSON.stringify(tokenOdometer)); } catch (e) { /* ignore */ }
            updateTokenOdometer();
        });
    }
}

function renderChat() {
    // Autosave current conversation to survive tab closures
    persistChatAutosave();

    const container = document.getElementById('chatMessages');
    
    if (state.currentChat.messages.length === 0) {
        container.innerHTML = `
            <div class="welcome-message">
                <p>Select a companion and an About You to begin.</p>
                <p>Or just start typing to chat with the raw model.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = state.currentChat.messages.map(msg => {
        if (msg.role === 'user') {
            return `
                <div class="message user" data-id="${msg.messageId}">
                    ${formatMessage(msg.content)}
                    ${msg.image ? `<img class="message-image" src="${msg.image.dataUrl}" alt="attached image">` : ''}
                </div>
            `;
        } else {
            const hasRejected = msg.rejected && msg.rejected.length > 0;
            const showGm = state.currentChat.gmDebugVisible && msg.gmNotes;
            return `
                <div class="message assistant ${hasRejected ? 'has-rejected' : ''}" data-id="${msg.messageId}">
                    ${formatMessage(msg.content)}
                    ${msg.imageBase64 ? `<img class="generated-image" src="data:${msg.imageMime || 'image/jpeg'};base64,${msg.imageBase64}" alt="generated image">` : ''}
                    ${msg.imageUrl ? `<img class="generated-image" src="${escapeHtml(msg.imageUrl)}" alt="generated image">` : ''}

                    ${showGm ? `
                        <div class="gm-notes-display">
                            <div class="gm-notes-label">GM Notes</div>
                            <div class="gm-notes-content">${formatMessage(msg.gmNotes)}</div>
                        </div>
                    ` : ''}

                    <div class="message-note">
                        <input type="text" class="note-input" maxlength="300"
                            placeholder="Steering note for reroll (optional, 300 char max)..."
                            value="${escapeHtml(msg.pendingNote || '')}"
                            onchange="updateMessageNote('${msg.messageId}', this.value)">
                    </div>

                    <div class="message-actions">
                        <button class="btn-reroll" onclick="rerollResponse('${msg.messageId}')" title="Reject and reroll with steering note">
                            Reroll
                        </button>
                        ${hasRejected ? `
                            <button class="btn-accept" onclick="acceptResponse('${msg.messageId}')" title="Accept and save DPO pairs">
                                Accept (${msg.rejected.length} rejected)
                            </button>
                        ` : ''}
                    </div>

                    ${hasRejected ? `
                        <div class="rejected-list">
                            <span class="rejected-label">Rejected:</span>
                            ${msg.rejected.map((r, i) => {
                                const rContent = typeof r === 'string' ? r : r.content;
                                const rNote = typeof r === 'string' ? '' : (r.note || '');
                                const tooltip = rNote
                                    ? `Note: ${escapeHtml(rNote)}\n---\n${escapeHtml(rContent)}`
                                    : escapeHtml(rContent);
                                return `<div class="rejected-preview ${rNote ? 'has-note' : ''}" title="${tooltip}">#${i + 1}${rNote ? ' *' : ''}</div>`;
                            }).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        }
    }).join('');
    
    if (window.hljs) {
        container.querySelectorAll('pre code').forEach(el => window.hljs.highlightElement(el));
    }

    container.scrollTop = container.scrollHeight;
    updateDpoCounter();
}

function formatMessage(content) {
    // 1. Extract code blocks before escaping
    const codeBlocks = [];
    let text = content.replace(/```(\w*)\n?([\s\S]*?)```/g, (match, lang, code) => {
        const idx = codeBlocks.length;
        const cls = lang ? ` class="language-${lang}"` : '';
        codeBlocks.push(`<pre><code${cls}>${escapeHtml(code.trim())}</code></pre>`);
        return `\n\n__CODEBLOCK${idx}__\n\n`;
    });

    // 2. Escape HTML
    text = escapeHtml(text);

    // 3. Inline code
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

    // 4. Bold **text**
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // 5. Italic *text* (not inside **)
    text = text.replace(/(?<!\*)\*(.+?)\*(?!\*)/g, '<em>$1</em>');

    // 6. Split into paragraphs and process
    return text.split('\n\n').map(p => {
        p = p.trim();
        if (!p) return '';

        // Code block placeholder
        const codeMatch = p.match(/^__CODEBLOCK(\d+)__$/);
        if (codeMatch) return codeBlocks[parseInt(codeMatch[1])];

        // Headers
        p = p.replace(/^### (.+)$/gm, '<h4>$1</h4>');
        p = p.replace(/^## (.+)$/gm, '<h3>$1</h3>');
        p = p.replace(/^# (.+)$/gm, '<h2>$1</h2>');

        if (p.startsWith('<h')) return p;
        return `<p>${p.replace(/\n/g, '<br>')}</p>`;
    }).filter(Boolean).join('\n');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Turn a free-text label into a filename-safe slug (spaces → hyphens, strip the rest).
function slugifyForFilename(text) {
    return (text || '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9_-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

function exportChat() {
    if (state.currentChat.messages.length === 0) {
        alert('No messages to save');
        return;
    }

    const character = state.characters.find(c => c.id === state.currentChat.characterId);
    const persona = state.personas.find(p => p.id === state.currentChat.personaId);

    // The user names their own chat — the file is theirs to find later, so the
    // subject has to come from them. Cancel = don't save; blank = "untitled".
    const subjectRaw = prompt('Name this chat (used in the filename, e.g. "tea ritual" or "Asgard planning"):', '');
    if (subjectRaw === null) return; // cancelled — abort the save
    const subject = slugifyForFilename(subjectRaw) || 'untitled';
    
    let content = '# Saved Chat\n\n';
    content += `Date: ${new Date().toISOString()}\n`;
    content += `Companion: ${character ? character.name : 'None'}\n`;
    content += `About You: ${persona ? persona.name : 'None'}\n\n`;
    content += '---\n\n';
    
    state.currentChat.messages.forEach(msg => {
        const role = msg.role === 'user' ? (persona ? persona.name : 'User') : (character ? character.name : 'Assistant');
        content += `**${role}:**\n${msg.content}\n\n`;
    });
    
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // Filename: YYYY-MM-DD-Companion-Subject.md
    const d = new Date();
    const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const companionSlug = slugifyForFilename(character ? character.name : 'Companion') || 'Companion';
    a.download = `${stamp}-${companionSlug}-${subject}.md`;
    a.click();
    URL.revokeObjectURL(url);
}

function exportDpo() {
    if (state.currentChat.dpoData.length === 0) {
        alert('No DPO pairs to save. Use Reroll to reject responses, then Accept to save pairs.');
        return;
    }
    
    const character = state.characters.find(c => c.id === state.currentChat.characterId);
    
    // Export as JSONL
    const content = state.currentChat.dpoData.map(pair => JSON.stringify(pair)).join('\n');
    
    const blob = new Blob([content], { type: 'application/jsonl' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dpo-${character ? character.name.toLowerCase().replace(/\s+/g, '-') : 'data'}-${Date.now()}.jsonl`;
    a.click();
    URL.revokeObjectURL(url);
    
    alert(`Exported ${state.currentChat.dpoData.length} DPO pairs!`);
    
    // Clear after export
    state.currentChat.dpoData = [];
    updateDpoCounter();
}

// === Characters ===
function initCharacters() {
    const newBtn = document.getElementById('newCharacterBtn');
    const closeBtn = document.getElementById('closeCharacterModal');
    const saveBtn = document.getElementById('saveCharacterBtn');
    const deleteBtn = document.getElementById('deleteCharacterBtn');
    const filterSelect = document.getElementById('characterSizeFilter');
    const imagePreview = document.getElementById('characterImagePreview');
    const imageInput = document.getElementById('characterImage');

    newBtn.addEventListener('click', () => openCharacterModal());
    closeBtn.addEventListener('click', closeCharacterModal);
    saveBtn.addEventListener('click', saveCharacter);
    deleteBtn.addEventListener('click', deleteCharacter);
    filterSelect.addEventListener('change', renderCharacters);

    imagePreview.addEventListener('click', () => imageInput.click());
    imageInput.addEventListener('change', handleCharacterImage);

    // File import
    const importBtn = document.getElementById('importFileBtn');
    const importInput = document.getElementById('characterFileImport');
    importBtn.addEventListener('click', () => importInput.click());
    importInput.addEventListener('change', handleCharacterFileImport);
    document.getElementById('closeImportPreviewBtn').addEventListener('click', closeImportPreview);

    // Voice Examples file upload (saves into voice-examples/ folder, then selects it)
    const veImportBtn = document.getElementById('voiceExamplesImportBtn');
    const veImportInput = document.getElementById('voiceExamplesFileImport');
    veImportBtn.addEventListener('click', () => veImportInput.click());
    veImportInput.addEventListener('change', handleVoiceExamplesFileImport);

    document.getElementById('characterModal').addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) closeCharacterModal();
    });
}

async function openCharacterModal(id = null) {
    state.editingId = id;
    const modal = document.getElementById('characterModal');
    const title = document.getElementById('characterModalTitle');
    const deleteBtn = document.getElementById('deleteCharacterBtn');

    // Reset fields
    document.getElementById('characterName').value = '';
    document.getElementById('characterSize').value = '34-70B';
    document.getElementById('characterDescription').value = '';
    document.getElementById('characterBackstory').value = '';
    document.getElementById('characterScenario').value = '';
    document.getElementById('characterImagePreview').innerHTML = '<span>Click to upload</span>';
    document.getElementById('importPreview').style.display = 'none';
    document.getElementById('characterFileImport').value = '';

    // Refresh system prompt list and populate dropdown
    await loadSystemPrompts();
    populateSystemPromptDropdown('none');
    populateVoiceExamplesDropdown('none');
    document.getElementById('characterCurrentContextWorking').value = '';

    renderMemoryBookCheckboxes('characterMemoryBooks', []);

    if (id) {
        title.textContent = 'Edit Companion';
        deleteBtn.style.display = 'block';

        const char = state.characters.find(c => c.id === id);
        if (char) {
            document.getElementById('characterName').value = char.name || '';
            document.getElementById('characterSize').value = char.size || '34-70B';
            document.getElementById('characterDescription').value = char.description || '';
            document.getElementById('characterBackstory').value = char.backstory || '';
            document.getElementById('characterScenario').value = char.scenario || '';
            populateSystemPromptDropdown(char.systemPromptFile || 'none');
            populateVoiceExamplesDropdown(char.voiceExamplesFile || 'none');
            document.getElementById('characterCurrentContextWorking').value = char.currentContextWorkingFile || '';

            if (char.image) {
                document.getElementById('characterImagePreview').innerHTML = `<img src="${char.image}" alt="Companion">`;
            }

            renderMemoryBookCheckboxes('characterMemoryBooks', char.memoryBookIds || []);
        }
    } else {
        title.textContent = 'New Companion';
        deleteBtn.style.display = 'none';
    }

    modal.classList.add('active');
}

function closeCharacterModal() {
    document.getElementById('characterModal').classList.remove('active');
    state.editingId = null;
}

function handleCharacterImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        resizeImage(event.target.result, 300, 300, (resized) => {
            document.getElementById('characterImagePreview').innerHTML = `<img src="${resized}" alt="Companion">`;
        });
    };
    reader.readAsDataURL(file);
}

function resizeImage(dataUrl, maxWidth, maxHeight, callback) {
    const img = new Image();
    img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
            if (width > maxWidth) {
                height *= maxWidth / width;
                width = maxWidth;
            }
        } else {
            if (height > maxHeight) {
                width *= maxHeight / height;
                height = maxHeight;
            }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        callback(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.src = dataUrl;
}

// === File Import for Character Cards ===
function handleCharacterFileImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        let content = event.target.result;

        // If it's a JSON file, pretty-print it
        if (file.name.endsWith('.json')) {
            try {
                const parsed = JSON.parse(content);
                content = JSON.stringify(parsed, null, 2);
            } catch (err) {
                // Not valid JSON - show raw content
            }
        }

        showImportPreview(content, file.name);
    };
    reader.readAsText(file);
}

function showImportPreview(content, filename) {
    document.getElementById('importPreviewFilename').textContent = filename;
    document.getElementById('importPreviewContent').value = content;
    document.getElementById('importPreview').style.display = 'block';
}

function applyImportToField(field) {
    const content = document.getElementById('importPreviewContent').value;
    if (!content) return;

    const fieldMap = {
        description: 'characterDescription',
        backstory: 'characterBackstory',
        scenario: 'characterScenario'
    };

    const el = document.getElementById(fieldMap[field]);
    if (el) {
        el.value = content;
    }
}

function closeImportPreview() {
    document.getElementById('importPreview').style.display = 'none';
}

function saveCharacter() {
    const name = document.getElementById('characterName').value.trim();
    if (!name) {
        alert('Please enter a companion name');
        return;
    }
    
    const imgEl = document.getElementById('characterImagePreview').querySelector('img');
    
    const memoryBookIds = [];
    document.querySelectorAll('#characterMemoryBooks input[type="checkbox"]:checked').forEach(cb => {
        memoryBookIds.push(cb.value);
    });
    
    const characterData = {
        name,
        size: document.getElementById('characterSize').value,
        description: document.getElementById('characterDescription').value,
        backstory: document.getElementById('characterBackstory').value,
        scenario: document.getElementById('characterScenario').value,
        systemPromptFile: document.getElementById('characterSystemPrompt').value,
        voiceExamplesFile: document.getElementById('characterVoiceExamples').value,
        currentContextWorkingFile: document.getElementById('characterCurrentContextWorking').value.trim(),
        image: imgEl ? imgEl.src : null,
        memoryBookIds
    };
    
    if (state.editingId) {
        const idx = state.characters.findIndex(c => c.id === state.editingId);
        if (idx !== -1) {
            state.characters[idx] = { ...state.characters[idx], ...characterData };
        }
    } else {
        characterData.id = generateId();
        state.characters.push(characterData);
    }
    
    saveState();
    closeCharacterModal();
    renderCharacters();
    renderQuickSelect();
}

function deleteCharacter() {
    if (!state.editingId) return;
    
    if (confirm('Delete this companion?')) {
        state.characters = state.characters.filter(c => c.id !== state.editingId);
        
        if (state.currentChat.characterId === state.editingId) {
            state.currentChat.characterId = null;
        }
        
        saveState();
        closeCharacterModal();
        renderCharacters();
        renderQuickSelect();
        updateCurrentSession();
    }
}

function renderCharacters() {
    const container = document.getElementById('characterGrid');
    const filter = document.getElementById('characterSizeFilter').value;
    
    let filtered = state.characters;
    if (filter !== 'all') {
        filtered = state.characters.filter(c => c.size === filter);
    }
    
    if (filtered.length === 0) {
        container.innerHTML = '<p class="placeholder-text" style="padding: 2rem;">No companions yet. Create one!</p>';
        return;
    }
    
    container.innerHTML = filtered.map(char => `
        <div class="card ${state.currentChat.characterId === char.id ? 'selected' : ''}" data-id="${char.id}">
            <div class="card-image">
                ${char.image ? `<img src="${char.image}" alt="${char.name}">` : char.name.charAt(0)}
            </div>
            <div class="card-info">
                <div class="card-name">${escapeHtml(char.name)}</div>
            </div>
        </div>
    `).join('');
    
    container.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.ctrlKey || e.metaKey) {
                openCharacterModal(card.dataset.id);
            } else {
                selectCharacter(card.dataset.id);
            }
        });
        
        card.addEventListener('dblclick', () => {
            openCharacterModal(card.dataset.id);
        });
    });
}

async function selectCharacter(id) {
    state.currentChat.characterId = id;
    // Pre-cache system prompt for selected character
    const char = state.characters.find(c => c.id === id);
    if (char && char.systemPromptFile && char.systemPromptFile !== 'none') {
        await getSystemPromptContent(char.systemPromptFile);
    }
    if (char && char.voiceExamplesFile && char.voiceExamplesFile !== 'none') {
        await getVoiceExamplesContent(char.voiceExamplesFile);
    }
    renderCharacters();
    renderQuickSelect();
    updateCurrentSession();
}

// === Personas ===
function initPersonas() {
    const newBtn = document.getElementById('newPersonaBtn');
    const closeBtn = document.getElementById('closePersonaModal');
    const saveBtn = document.getElementById('savePersonaBtn');
    const deleteBtn = document.getElementById('deletePersonaBtn');
    const imagePreview = document.getElementById('personaImagePreview');
    const imageInput = document.getElementById('personaImage');
    
    newBtn.addEventListener('click', () => openPersonaModal());
    closeBtn.addEventListener('click', closePersonaModal);
    saveBtn.addEventListener('click', savePersona);
    deleteBtn.addEventListener('click', deletePersona);
    
    imagePreview.addEventListener('click', () => imageInput.click());
    imageInput.addEventListener('change', handlePersonaImage);

    const importBtn = document.getElementById('personaImportBtn');
    const importInput = document.getElementById('personaFileImport');
    importBtn.addEventListener('click', () => importInput.click());
    importInput.addEventListener('change', handlePersonaFileImport);

    document.getElementById('personaModal').addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) closePersonaModal();
    });
}

// Upload a .txt/.md/.json file straight into the About You Description.
function handlePersonaFileImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const descEl = document.getElementById('personaDescription');
    if (descEl.value.trim() && !confirm("Replace the current Description with this file's contents?")) {
        e.target.value = '';
        return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
        let content = ev.target.result;
        if (file.name.toLowerCase().endsWith('.json')) {
            try { content = JSON.stringify(JSON.parse(content), null, 2); } catch (err) { /* leave raw */ }
        }
        descEl.value = content;
    };
    reader.readAsText(file);
    e.target.value = '';
}

function openPersonaModal(id = null) {
    state.editingId = id;
    const modal = document.getElementById('personaModal');
    const title = document.getElementById('personaModalTitle');
    const deleteBtn = document.getElementById('deletePersonaBtn');
    
    document.getElementById('personaName').value = '';
    document.getElementById('personaDescription').value = '';
    document.getElementById('personaImagePreview').innerHTML = '<span>Click to upload</span>';
    
    if (id) {
        title.textContent = 'Edit About You';
        deleteBtn.style.display = 'block';
        
        const persona = state.personas.find(p => p.id === id);
        if (persona) {
            document.getElementById('personaName').value = persona.name || '';
            document.getElementById('personaDescription').value = persona.description || '';
            
            if (persona.image) {
                document.getElementById('personaImagePreview').innerHTML = `<img src="${persona.image}" alt="About You">`;
            }
        }
    } else {
        title.textContent = 'New About You';
        deleteBtn.style.display = 'none';
    }
    
    modal.classList.add('active');
}

function closePersonaModal() {
    document.getElementById('personaModal').classList.remove('active');
    state.editingId = null;
}

function handlePersonaImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        resizeImage(event.target.result, 300, 300, (resized) => {
            document.getElementById('personaImagePreview').innerHTML = `<img src="${resized}" alt="About You">`;
        });
    };
    reader.readAsDataURL(file);
}

function savePersona() {
    const name = document.getElementById('personaName').value.trim();
    if (!name) {
        alert('Please enter an About You name');
        return;
    }
    
    const imgEl = document.getElementById('personaImagePreview').querySelector('img');
    
    const personaData = {
        name,
        description: document.getElementById('personaDescription').value,
        image: imgEl ? imgEl.src : null
    };
    
    if (state.editingId) {
        const idx = state.personas.findIndex(p => p.id === state.editingId);
        if (idx !== -1) {
            state.personas[idx] = { ...state.personas[idx], ...personaData };
        }
    } else {
        personaData.id = generateId();
        state.personas.push(personaData);
    }
    
    saveState();
    closePersonaModal();
    renderPersonas();
    renderQuickSelect();
}

function deletePersona() {
    if (!state.editingId) return;
    
    if (confirm('Delete this About You?')) {
        state.personas = state.personas.filter(p => p.id !== state.editingId);
        
        if (state.currentChat.personaId === state.editingId) {
            state.currentChat.personaId = null;
        }
        
        saveState();
        closePersonaModal();
        renderPersonas();
        renderQuickSelect();
        updateCurrentSession();
    }
}

function renderPersonas() {
    const container = document.getElementById('personaGrid');
    
    if (state.personas.length === 0) {
        container.innerHTML = '<p class="placeholder-text" style="padding: 2rem;">No About You profiles yet. Create one!</p>';
        return;
    }
    
    container.innerHTML = state.personas.map(persona => `
        <div class="card ${state.currentChat.personaId === persona.id ? 'selected' : ''}" data-id="${persona.id}">
            <div class="card-image">
                ${persona.image ? `<img src="${persona.image}" alt="${persona.name}">` : persona.name.charAt(0)}
            </div>
            <div class="card-info">
                <div class="card-name">${escapeHtml(persona.name)}</div>
            </div>
        </div>
    `).join('');
    
    container.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.ctrlKey || e.metaKey) {
                openPersonaModal(card.dataset.id);
            } else {
                selectPersona(card.dataset.id);
            }
        });
        
        card.addEventListener('dblclick', () => {
            openPersonaModal(card.dataset.id);
        });
    });
}

function selectPersona(id) {
    state.currentChat.personaId = id;
    renderPersonas();
    renderQuickSelect();
    updateCurrentSession();
}

// === Memory Books ===
function initMemoryBooks() {
    const newBtn = document.getElementById('newMemoryBookBtn');
    const closeBtn = document.getElementById('closeMemoryBookModal');
    const saveBtn = document.getElementById('saveMemoryBookBtn');
    const deleteBtn = document.getElementById('deleteMemoryBookBtn');
    const addEntryBtn = document.getElementById('addEntryBtn');
    
    newBtn.addEventListener('click', () => openMemoryBookModal());
    closeBtn.addEventListener('click', closeMemoryBookModal);
    saveBtn.addEventListener('click', saveMemoryBook);
    deleteBtn.addEventListener('click', deleteMemoryBook);
    addEntryBtn.addEventListener('click', () => addMemoryEntry());
    
    document.getElementById('memoryBookModal').addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) closeMemoryBookModal();
    });
}

function openMemoryBookModal(id = null) {
    state.editingId = id;
    const modal = document.getElementById('memoryBookModal');
    const title = document.getElementById('memoryBookModalTitle');
    const deleteBtn = document.getElementById('deleteMemoryBookBtn');
    
    document.getElementById('memoryBookName').value = '';
    document.getElementById('memoryBookEntries').innerHTML = '';
    document.getElementById('memoryBookTokens').textContent = '0';
    
    if (id) {
        title.textContent = 'Edit Memory Book';
        deleteBtn.style.display = 'block';
        
        const book = state.memoryBooks.find(b => b.id === id);
        if (book) {
            document.getElementById('memoryBookName').value = book.name || '';
            
            if (book.entries && book.entries.length > 0) {
                book.entries.forEach(entry => addMemoryEntry(entry));
            }
            
            updateTokenCount();
        }
    } else {
        title.textContent = 'New Memory Book';
        deleteBtn.style.display = 'none';
    }
    
    modal.classList.add('active');
}

function closeMemoryBookModal() {
    document.getElementById('memoryBookModal').classList.remove('active');
    state.editingId = null;
}

function addMemoryEntry(data = null) {
    const container = document.getElementById('memoryBookEntries');
    const entryId = generateId();
    const type = (data && data.type) ? data.type : 'memory';

    const entryHtml = `
        <div class="entry-item" data-entry-id="${entryId}">
            <button class="entry-remove" onclick="removeMemoryEntry('${entryId}')">&times; Remove</button>

            <div class="form-group">
                <label>Trigger Words (comma-separated)</label>
                <input type="text" class="entry-triggers" value="${data ? escapeHtml(data.triggers) : ''}" placeholder="e.g., Asgard, Thor, Odin" oninput="updateTokenCount()">
            </div>

            <div class="form-group">
                <label>Type</label>
                <select class="entry-type">
                    <option value="memory"${type === 'memory' ? ' selected' : ''}>Memory — what happened / what's true (recalled gently)</option>
                    <option value="behaviour"${type === 'behaviour' ? ' selected' : ''}>Behaviour — how to act / a rule (enforced this turn)</option>
                </select>
            </div>

            <div class="form-group">
                <label>Content <span class="field-hint">(a summary — max ~500 tokens / ${MEMORY_ENTRY_MAX_CHARS} chars)</span></label>
                <textarea class="entry-content" rows="3" maxlength="${MEMORY_ENTRY_MAX_CHARS}" placeholder="Information to inject when triggered..." oninput="updateTokenCount()">${data ? escapeHtml(data.content) : ''}</textarea>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', entryHtml);
    updateTokenCount();
}

function removeMemoryEntry(entryId) {
    const entry = document.querySelector(`[data-entry-id="${entryId}"]`);
    if (entry) {
        entry.remove();
        updateTokenCount();
    }
}

function updateTokenCount() {
    const entries = document.querySelectorAll('.entry-item');
    let totalText = '';
    
    entries.forEach(entry => {
        totalText += entry.querySelector('.entry-triggers').value + ' ';
        totalText += entry.querySelector('.entry-content').value + ' ';
    });
    
    const tokens = Math.ceil(totalText.length / 4);
    document.getElementById('memoryBookTokens').textContent = tokens;
    
    const counter = document.querySelector('.token-counter');
    if (tokens > 3000) {
        counter.style.color = 'var(--error)';
    } else if (tokens > 2500) {
        counter.style.color = 'var(--warning)';
    } else {
        counter.style.color = 'var(--text-muted)';
    }
}

function saveMemoryBook() {
    const name = document.getElementById('memoryBookName').value.trim();
    if (!name) {
        alert('Please enter a memory book name');
        return;
    }
    
    const entries = [];
    let overCap = null;
    document.querySelectorAll('.entry-item').forEach(entry => {
        const triggers = entry.querySelector('.entry-triggers').value.trim();
        const content = entry.querySelector('.entry-content').value.trim();
        const type = entry.querySelector('.entry-type').value;

        if (triggers && content) {
            // Per-entry cap (place 2 of 3) — also catches imported/older over-cap entries.
            if (estimateTokens(content) > MEMORY_ENTRY_MAX_TOKENS && !overCap) {
                overCap = triggers;
            }
            entries.push({ triggers, content, type });
        }
    });

    if (overCap) {
        alert(`One entry ("${overCap}") is over the ~${MEMORY_ENTRY_MAX_TOKENS}-token limit. Memory entries are summaries — please shorten it before saving.`);
        return;
    }

    const bookData = { name, entries };
    
    if (state.editingId) {
        const idx = state.memoryBooks.findIndex(b => b.id === state.editingId);
        if (idx !== -1) {
            state.memoryBooks[idx] = { ...state.memoryBooks[idx], ...bookData };
        }
    } else {
        bookData.id = generateId();
        state.memoryBooks.push(bookData);
    }
    
    saveState();
    closeMemoryBookModal();
    renderMemoryBooks();
}

function deleteMemoryBook() {
    if (!state.editingId) return;
    
    if (confirm('Delete this memory book?')) {
        state.memoryBooks = state.memoryBooks.filter(b => b.id !== state.editingId);
        
        state.characters.forEach(char => {
            if (char.memoryBookIds) {
                char.memoryBookIds = char.memoryBookIds.filter(id => id !== state.editingId);
            }
        });
        
        saveState();
        closeMemoryBookModal();
        renderMemoryBooks();
    }
}

function renderMemoryBooks() {
    const container = document.getElementById('memoryBookList');
    
    if (state.memoryBooks.length === 0) {
        container.innerHTML = '<p class="placeholder-text">No memory books yet. Create one!</p>';
        return;
    }
    
    container.innerHTML = state.memoryBooks.map(book => `
        <div class="memorybook-item" data-id="${book.id}">
            <span class="memorybook-item-name">${escapeHtml(book.name)}</span>
            <span class="memorybook-item-meta">${book.entries ? book.entries.length : 0} entries</span>
            <button class="btn-export-book" data-export="${book.id}" title="Save this book to a .json file">Save</button>
        </div>
    `).join('');

    container.querySelectorAll('.memorybook-item').forEach(item => {
        item.addEventListener('click', () => {
            openMemoryBookModal(item.dataset.id);
        });
    });

    // Export button — don't let its click bubble up and open the editor.
    container.querySelectorAll('.btn-export-book').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            exportMemoryBook(btn.dataset.export);
        });
    });
}

// Download a single memory book as a re-importable .json file.
function exportMemoryBook(id) {
    const book = state.memoryBooks.find(b => b.id === id);
    if (!book) return;
    const payload = { tag: 'll-memory-book', name: book.name, entries: book.entries || [] };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memory-book-${slugifyForFilename(book.name) || 'book'}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function renderMemoryBookCheckboxes(containerId, selectedIds) {
    const container = document.getElementById(containerId);
    
    if (state.memoryBooks.length === 0) {
        container.innerHTML = '<p class="placeholder-text">No memory books created yet</p>';
        return;
    }
    
    container.innerHTML = state.memoryBooks.map(book => `
        <label class="memorybook-checkbox">
            <input type="checkbox" value="${book.id}" ${selectedIds.includes(book.id) ? 'checked' : ''}>
            ${escapeHtml(book.name)}
        </label>
    `).join('');
}

// === System Prompts Panel ===
let editingSystemPrompt = null; // name of prompt being edited, or null for new

function initSystemPrompts() {
    const newBtn = document.getElementById('newSystemPromptBtn');
    const uploadBtn = document.getElementById('uploadSystemPromptBtn');
    const fileInput = document.getElementById('systemPromptFileImport');
    const saveBtn = document.getElementById('saveSystemPromptBtn');
    const deleteBtn = document.getElementById('deleteSystemPromptBtn');

    newBtn.addEventListener('click', () => selectSystemPrompt(null));
    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleSystemPromptFileUpload);
    saveBtn.addEventListener('click', saveSystemPrompt);
    deleteBtn.addEventListener('click', deleteSystemPrompt);
}

async function selectSystemPrompt(name) {
    editingSystemPrompt = name;
    const nameInput = document.getElementById('systemPromptName');
    const contentInput = document.getElementById('systemPromptContent');
    const deleteBtn = document.getElementById('deleteSystemPromptBtn');

    if (name) {
        nameInput.value = name;
        deleteBtn.style.display = 'inline-block';
        const content = await getSystemPromptContent(name);
        contentInput.value = content || '';
    } else {
        nameInput.value = '';
        contentInput.value = '';
        deleteBtn.style.display = 'none';
    }

    // Update active highlight in list
    document.querySelectorAll('.sp-list-item').forEach(item => {
        item.classList.toggle('active', item.dataset.name === name);
    });
}

function handleSystemPromptFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
        editingSystemPrompt = null;
        document.getElementById('systemPromptName').value = file.name.replace(/\.(txt|md|text)$/i, '');
        document.getElementById('systemPromptContent').value = ev.target.result;
        document.getElementById('deleteSystemPromptBtn').style.display = 'none';
        // Clear active highlight
        document.querySelectorAll('.sp-list-item').forEach(item => item.classList.remove('active'));
    };
    reader.readAsText(file);
    e.target.value = '';
}

async function saveSystemPrompt() {
    const name = document.getElementById('systemPromptName').value.trim();
    const content = document.getElementById('systemPromptContent').value;

    if (!name) {
        alert('Please enter a name for the system prompt');
        return;
    }

    try {
        const response = await fetch('/api/system-prompts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, content })
        });

        if (!response.ok) {
            const err = await response.json();
            alert('Save failed: ' + (err.error || 'Unknown error'));
            return;
        }

        systemPromptCache[name] = content;
        await loadSystemPrompts();
        editingSystemPrompt = name;
        renderSystemPrompts();
    } catch (e) {
        alert('Save failed: ' + e.message);
    }
}

async function deleteSystemPrompt() {
    const name = editingSystemPrompt;
    if (!name) return;

    if (!confirm(`Delete system prompt "${name}"?`)) return;

    try {
        const response = await fetch(`/api/system-prompts/${encodeURIComponent(name)}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            delete systemPromptCache[name];
            await loadSystemPrompts();
            selectSystemPrompt(null);
            renderSystemPrompts();
        }
    } catch (e) {
        alert('Delete failed: ' + e.message);
    }
}

function renderSystemPrompts() {
    const container = document.getElementById('systemPromptList');

    if (systemPromptList.length === 0) {
        container.innerHTML = '<p class="placeholder-text">No prompts yet</p>';
    } else {
        container.innerHTML = systemPromptList.map(name => `
            <div class="sp-list-item ${editingSystemPrompt === name ? 'active' : ''}" data-name="${escapeHtml(name)}">
                ${escapeHtml(name)}
            </div>
        `).join('');

        container.querySelectorAll('.sp-list-item').forEach(item => {
            item.addEventListener('click', () => selectSystemPrompt(item.dataset.name));
        });
    }
}

// === Settings ===
function initSettings() {
    const testConnectionBtn = document.getElementById('testConnectionBtn');
    
    const s = state.settings;
    
    document.getElementById('localEnabled').checked = s.endpoints.local.enabled;
    document.getElementById('localUrl').value = s.endpoints.local.url;
    
    document.getElementById('runpodEnabled').checked = s.endpoints.runpod.enabled;
    document.getElementById('runpodUrl').value = s.endpoints.runpod.url;
    
    document.getElementById('openrouterEnabled').checked = s.endpoints.openrouter.enabled;
    document.getElementById('openrouterKey').value = s.endpoints.openrouter.key;
    // OpenRouter: curated dropdown + persistent custom-slug slot.
    const orSel = document.getElementById('openrouterModel');
    const orCustom = document.getElementById('openrouterCustomModel');
    const orModel = s.endpoints.openrouter.model || '';
    const orCurated = Array.from(orSel.options).some(o => o.value === orModel && o.value !== '__custom__');
    if (orModel && orCurated) {
        orSel.value = orModel;
        orCustom.value = '';
    } else {
        orSel.value = '__custom__';
        orCustom.value = orModel;
    }

    document.getElementById('claudeEnabled').checked = s.endpoints.claude.enabled;
    document.getElementById('claudeKey').value = s.endpoints.claude.key;
    document.getElementById('claudeModel').value = s.endpoints.claude.model;
    document.getElementById('claudeEffort').value = s.endpoints.claude.effort || 'medium';
    document.getElementById('claudeCacheMode').value = cacheModeFromConfig(s.endpoints.claude);

    document.getElementById('nousEnabled').checked = s.endpoints.nous.enabled;
    document.getElementById('nousKey').value = s.endpoints.nous.key;
    document.getElementById('nousModel').value = s.endpoints.nous.model;

    document.getElementById('openaiEnabled').checked = s.endpoints.openai.enabled;
    document.getElementById('openaiKey').value = s.endpoints.openai.key;
    document.getElementById('openaiModel').value = s.endpoints.openai.model;
    document.getElementById('openaiApiMode').value = s.endpoints.openai.useResponsesApi ? 'responses' : 'chatcompletions';
    document.getElementById('openaiReasoningEffort').value = s.endpoints.openai.reasoningEffort || 'medium';
    document.getElementById('openaiCacheEnabled').checked = s.endpoints.openai.cacheEnabled !== false;

    document.getElementById('geminiEnabled').checked = s.endpoints.gemini.enabled;
    document.getElementById('geminiKey').value = s.endpoints.gemini.key;
    document.getElementById('geminiModel').value = s.endpoints.gemini.model;

    document.getElementById('mistralEnabled').checked = s.endpoints.mistral.enabled;
    document.getElementById('mistralKey').value = s.endpoints.mistral.key;
    document.getElementById('mistralModel').value = s.endpoints.mistral.model;

    document.getElementById('activeEndpoint').value = s.activeEndpoint;
    document.getElementById('sidebarEndpoint').value = s.activeEndpoint;

    // Tool-use controls
    document.getElementById('toolsEnabled').checked = !!s.tools?.enabled;
    document.getElementById('braveKey').value = s.tools?.braveKey || '';
    document.getElementById('toolsWorkingDir').value = s.tools?.workingDir || '';
    document.getElementById('nanoImageKey').value = s.tools?.image?.key || '';

    // Auto-memory heartbeat controls
    document.getElementById('heartbeatEnabled').checked = !!s.heartbeat?.enabled;
    document.getElementById('heartbeatQuietMinutes').value = s.heartbeat?.quietMinutes || 10;

    ['localEnabled', 'localUrl', 'runpodEnabled', 'runpodUrl',
     'openrouterEnabled', 'openrouterKey', 'openrouterModel', 'openrouterCustomModel',
     'claudeEnabled', 'claudeKey', 'claudeModel', 'claudeEffort', 'claudeCacheMode',
     'nousEnabled', 'nousKey', 'nousModel',
     'openaiEnabled', 'openaiKey', 'openaiModel', 'openaiApiMode', 'openaiReasoningEffort', 'openaiCacheEnabled',
     'geminiEnabled', 'geminiKey', 'geminiModel',
     'mistralEnabled', 'mistralKey', 'mistralModel',
     'toolsEnabled', 'braveKey', 'toolsWorkingDir', 'nanoImageKey',
     'heartbeatEnabled', 'heartbeatQuietMinutes',
     'activeEndpoint'].forEach(id => {
        document.getElementById(id).addEventListener('change', updateSettings);
    });
    // Text inputs — also save on blur/input so typing is captured
    ['braveKey', 'toolsWorkingDir', 'nanoImageKey', 'openrouterCustomModel', 'heartbeatQuietMinutes'].forEach(id => {
        document.getElementById(id).addEventListener('input', updateSettings);
    });

    // Show the OpenRouter custom-slug field only when "Custom" is selected
    const updateOpenRouterCustomVisibility = () => {
        document.getElementById('openrouterCustomGroup').style.display =
            document.getElementById('openrouterModel').value === '__custom__' ? 'block' : 'none';
    };
    document.getElementById('openrouterModel').addEventListener('change', updateOpenRouterCustomVisibility);
    updateOpenRouterCustomVisibility();

    // Show/hide reasoning effort based on selected OpenAI model
    const updateReasoningVisibility = () => {
        const model = document.getElementById('openaiModel').value;
        document.getElementById('reasoningEffortGroup').style.display =
            isOpenAIThinkingModel(model) ? 'block' : 'none';
    };
    document.getElementById('openaiModel').addEventListener('change', updateReasoningVisibility);
    updateReasoningVisibility();

    // Show/hide Claude effort selector based on selected Claude model (4.7/4.8 only)
    const updateClaudeEffortVisibility = () => {
        const model = document.getElementById('claudeModel').value;
        document.getElementById('claudeEffortGroup').style.display =
            isClaudeEffortModel(model) ? 'block' : 'none';
        updateSamplerVisibility();
    };
    document.getElementById('claudeModel').addEventListener('change', updateClaudeEffortVisibility);
    updateClaudeEffortVisibility();

    testConnectionBtn.addEventListener('click', testConnection);

    document.getElementById('exportStateBtn').addEventListener('click', exportState);
    document.getElementById('importStateBtn').addEventListener('click', () => document.getElementById('importStateFile').click());
    document.getElementById('importStateFile').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) importState(file);
        e.target.value = '';
    });
}

function updateSettings() {
    state.settings.endpoints.local = {
        enabled: document.getElementById('localEnabled').checked,
        url: document.getElementById('localUrl').value
    };
    
    state.settings.endpoints.runpod = {
        enabled: document.getElementById('runpodEnabled').checked,
        url: document.getElementById('runpodUrl').value
    };
    
    const orSelVal = document.getElementById('openrouterModel').value;
    const orModelVal = orSelVal === '__custom__'
        ? document.getElementById('openrouterCustomModel').value.trim()
        : orSelVal;
    state.settings.endpoints.openrouter = {
        enabled: document.getElementById('openrouterEnabled').checked,
        key: document.getElementById('openrouterKey').value,
        model: orModelVal
    };

    const clMode = document.getElementById('claudeCacheMode').value;
    state.settings.endpoints.claude = {
        enabled: document.getElementById('claudeEnabled').checked,
        key: document.getElementById('claudeKey').value,
        model: document.getElementById('claudeModel').value,
        effort: document.getElementById('claudeEffort').value,
        cacheEnabled: clMode !== 'off',
        cacheTtl: clMode === 'off' ? '5m' : clMode
    };

    state.settings.endpoints.nous = {
        enabled: document.getElementById('nousEnabled').checked,
        key: document.getElementById('nousKey').value,
        model: document.getElementById('nousModel').value
    };

    state.settings.endpoints.openai = {
        enabled: document.getElementById('openaiEnabled').checked,
        key: document.getElementById('openaiKey').value,
        model: document.getElementById('openaiModel').value,
        useResponsesApi: document.getElementById('openaiApiMode').value === 'responses',
        reasoningEffort: document.getElementById('openaiReasoningEffort').value,
        cacheEnabled: document.getElementById('openaiCacheEnabled').checked
    };

    state.settings.endpoints.gemini = {
        enabled: document.getElementById('geminiEnabled').checked,
        key: document.getElementById('geminiKey').value,
        model: document.getElementById('geminiModel').value,
        cacheEnabled: true
    };

    state.settings.endpoints.mistral = {
        enabled: document.getElementById('mistralEnabled').checked,
        key: document.getElementById('mistralKey').value,
        model: document.getElementById('mistralModel').value,
        cacheEnabled: true
    };

    state.settings.tools = {
        enabled: document.getElementById('toolsEnabled').checked,
        braveKey: document.getElementById('braveKey').value,
        workingDir: document.getElementById('toolsWorkingDir').value,
        image: { key: document.getElementById('nanoImageKey').value }
    };

    // Heartbeat — clamp quiet minutes to a sane 1–120 range.
    let quietMin = parseInt(document.getElementById('heartbeatQuietMinutes').value, 10);
    if (!Number.isFinite(quietMin) || quietMin < 1) quietMin = 1;
    if (quietMin > 120) quietMin = 120;
    state.settings.heartbeat = {
        enabled: document.getElementById('heartbeatEnabled').checked,
        quietMinutes: quietMin
    };

    state.settings.activeEndpoint = document.getElementById('activeEndpoint').value;
    document.getElementById('sidebarEndpoint').value = state.settings.activeEndpoint;
    updateSamplerVisibility();

    saveState();
}

const TEST_CONNECTION_MAX_TOKENS = 64;

async function testConnection() {
    const btn = document.getElementById('testConnectionBtn');
    btn.classList.add('loading');
    btn.disabled = true;
    
    try {
        const endpoint = state.settings.activeEndpoint;
        const config = state.settings.endpoints[endpoint];
        
        if (endpoint === 'local' || endpoint === 'runpod') {
            const response = await fetch(`${config.url}/v1/models`, { 
                method: 'GET',
                signal: AbortSignal.timeout(5000)
            });
            await ensureTestOk(response, 'llama.cpp');
        } else if (endpoint === 'openrouter') {
            if (!config.key) {
                throw new Error('API key not set');
            }
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.key}`,
                    'HTTP-Referer': 'http://localhost:3000',
                    'X-Title': 'Little Lantern'
                },
                body: JSON.stringify({
                    model: config.model,
                    messages: [{ role: 'user', content: 'ping' }],
                    max_tokens: TEST_CONNECTION_MAX_TOKENS
                }),
                signal: AbortSignal.timeout(15000)
            });
            await ensureTestOk(response, 'OpenRouter');
        } else if (endpoint === 'claude') {
            if (!config.key) {
                throw new Error('API key not set');
            }
            const body = {
                model: config.model,
                max_tokens: TEST_CONNECTION_MAX_TOKENS,
                messages: [{ role: 'user', content: 'ping' }]
            };
            if (isClaudeEffortModel(config.model)) {
                if (needsClaudeAdaptiveThinkingConfig(config.model)) {
                    body.thinking = { type: 'adaptive' };
                }
                body.output_config = { effort: config.effort || 'medium' };
            } else {
                body.temperature = 1;
            }
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': config.key,
                    'anthropic-version': '2023-06-01',
                    'anthropic-dangerous-direct-browser-access': 'true'
                },
                body: JSON.stringify(body),
                signal: AbortSignal.timeout(15000)
            });
            await ensureTestOk(response, 'Claude');
        } else if (endpoint === 'nous') {
            if (!config.key) {
                throw new Error('API key not set');
            }
            const response = await fetch('https://inference-api.nousresearch.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.key}`
                },
                body: JSON.stringify({
                    model: config.model,
                    messages: [{ role: 'user', content: 'ping' }],
                    temperature: 0,
                    max_tokens: TEST_CONNECTION_MAX_TOKENS
                }),
                signal: AbortSignal.timeout(15000)
            });
            await ensureTestOk(response, 'Nous');
        } else if (endpoint === 'openai') {
            if (!config.key) {
                throw new Error('API key not set');
            }
            const isThinking = isOpenAIThinkingModel(config.model);
            let response;
            if (config.useResponsesApi) {
                const body = {
                    model: config.model,
                    input: [{ role: 'user', content: 'ping' }],
                    max_output_tokens: TEST_CONNECTION_MAX_TOKENS
                };
                if (!isThinking) {
                    body.temperature = 0;
                }
                if (isThinking && config.reasoningEffort && config.reasoningEffort !== 'none') {
                    body.reasoning = { effort: config.reasoningEffort };
                }
                response = await fetch('https://api.openai.com/v1/responses', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${config.key}`
                    },
                    body: JSON.stringify(body),
                    signal: AbortSignal.timeout(15000)
                });
            } else {
                const body = {
                    model: config.model,
                    messages: [{ role: 'user', content: 'ping' }],
                    max_tokens: TEST_CONNECTION_MAX_TOKENS
                };
                if (!isThinking) {
                    body.temperature = 0;
                }
                response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${config.key}`
                    },
                    body: JSON.stringify(body),
                    signal: AbortSignal.timeout(15000)
                });
            }
            await ensureTestOk(response, 'OpenAI');
        } else if (endpoint === 'gemini') {
            if (!config.key) {
                throw new Error('API key not set');
            }
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.model)}:generateContent?key=${encodeURIComponent(config.key)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
                    safetySettings: geminiSafetySettings,
                    generationConfig: { maxOutputTokens: TEST_CONNECTION_MAX_TOKENS }
                }),
                signal: AbortSignal.timeout(15000)
            });
            await ensureTestOk(response, 'Gemini');
        } else if (endpoint === 'mistral') {
            if (!config.key) {
                throw new Error('API key not set');
            }
            const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.key}`
                },
                body: JSON.stringify({
                    model: config.model,
                    messages: [{ role: 'user', content: 'ping' }],
                    temperature: 0,
                    max_tokens: TEST_CONNECTION_MAX_TOKENS
                }),
                signal: AbortSignal.timeout(15000)
            });
            await ensureTestOk(response, 'Mistral');
        } else {
            throw new Error(`Unsupported endpoint: ${endpoint}`);
        }
        updateConnectionStatus('connected');
        alert('Connection successful!');
    } catch (error) {
        updateConnectionStatus('error');
        alert(`Connection failed: ${error.message}`);
    } finally {
        btn.classList.remove('loading');
        btn.disabled = false;
    }
}

async function ensureTestOk(response, providerName) {
    if (response.ok) return;
    let errorMsg = `${providerName} error: ${response.status}`;
    try {
        const data = await response.json();
        errorMsg = data.error?.message || data.message || JSON.stringify(data);
    } catch (e) {
        try {
            const text = await response.text();
            if (text) errorMsg = text;
        } catch (e2) { /* no readable body */ }
    }
    throw new Error(errorMsg);
}

// === Sidebar Endpoint ===
function initQuickSelect() {
    // Wire sidebar endpoint selector
    document.getElementById('sidebarEndpoint').addEventListener('change', (e) => {
        state.settings.activeEndpoint = e.target.value;
        document.getElementById('activeEndpoint').value = e.target.value;
        saveState();
        updateSamplerVisibility();
    });
}

function renderQuickSelect() {
    // Quick-select sidebar replaced by sampler sidebar in P4 layout redesign.
    // Character/persona display handled by updateCurrentSession().
}

function updateCurrentSession() {
    const charDisplay = document.getElementById('currentCharacterDisplay');
    const personaDisplay = document.getElementById('currentPersonaDisplay');

    const char = state.characters.find(c => c.id === state.currentChat.characterId);
    const persona = state.personas.find(p => p.id === state.currentChat.personaId);

    if (char) {
        charDisplay.innerHTML = `${char.image ? `<img src="${char.image}" class="session-thumb" alt="">` : ''}<strong>${escapeHtml(char.name)}</strong>`;
    } else {
        charDisplay.innerHTML = '<span class="placeholder-text">No companion</span>';
    }

    if (persona) {
        personaDisplay.innerHTML = `${persona.image ? `<img src="${persona.image}" class="session-thumb" alt="">` : ''}<strong>${escapeHtml(persona.name)}</strong>`;
    } else {
        personaDisplay.innerHTML = '<span class="placeholder-text">No About You set</span>';
    }
}

// === Utilities ===
function generateId() {
    return 'id_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function renderAll() {
    renderCharacters();
    renderPersonas();
    renderMemoryBooks();
    renderSystemPrompts();
    renderQuickSelect();
    updateCurrentSession();
    renderChat();
    updateDpoCounter();
}

// Make functions available globally for onclick handlers
window.removeMemoryEntry = removeMemoryEntry;
window.updateTokenCount = updateTokenCount;
window.rerollResponse = rerollResponse;
window.acceptResponse = acceptResponse;
