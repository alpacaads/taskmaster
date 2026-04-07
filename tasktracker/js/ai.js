// ── Settings / brief ─────────────────────────────────────

let businessBrief = '';
let settingsOpen = false;
let aiOpen = false;
let aiPreviewTasks = [];
let recognizing = false;
let recognition = null;

async function loadBrief() {
  const { data } = await sb.from('settings').select('business_brief').eq('id', 1).single();
  if (data?.business_brief) {
    businessBrief = data.business_brief;
    document.getElementById('business-brief').value = businessBrief;
  }
}

async function saveBrief() {
  const brief = document.getElementById('business-brief').value.trim();
  businessBrief = brief;
  await sb.from('settings').upsert({ id: 1, business_brief: brief, updated_at: new Date().toISOString() });
  toggleSettings();
  showToast('Business brief saved');
}

function toggleSettings() {
  settingsOpen = !settingsOpen;
  document.getElementById('settings-panel').classList.toggle('hidden', !settingsOpen);
  if (settingsOpen) closeOtherPanels('settings');
}

// ── AI panel ──────────────────────────────────────────────

function toggleAI() {
  aiOpen = !aiOpen;
  document.getElementById('ai-panel').classList.toggle('hidden', !aiOpen);
  document.getElementById('ai-mode').value = mode;
  if (aiOpen) {
    closeOtherPanels('ai');
    document.getElementById('ai-prompt').focus();
  }
}

function closeOtherPanels(except) {
  if (except !== 'settings' && settingsOpen) toggleSettings();
  if (except !== 'ai' && aiOpen) { aiOpen = false; document.getElementById('ai-panel').classList.add('hidden'); }
  if (formOpen) toggleForm();
  if (clientMgrOpen) toggleClientMgr();
}

async function runAI() {
  const prompt = document.getElementById('ai-prompt').value.trim();
  if (!prompt) return;

  const btn = document.getElementById('ai-go-btn');
  const status = document.getElementById('ai-status');
  btn.disabled = true;
  btn.textContent = 'Thinking…';
  status.classList.remove('hidden');
  status.textContent = 'Analysing your goal…';

  const aiMode = document.getElementById('ai-mode').value;
  const clientList = clients.map(c => `- ${c.name} (id: ${c.id})`).join('\n') || 'No clients set up yet';
  const today = new Date().toISOString().split('T')[0];

  const systemPrompt = `You are a task planning assistant for a business owner. You break down goals into actionable tasks.

Business context:
${businessBrief || 'A small business owner managing projects and clients.'}

Today's date: ${today}

Available clients:
${clientList}

Rules:
- Return ONLY valid JSON, no markdown, no explanation
- Create between 3 and 12 tasks
- Each task must have: name, priority (high/med/low), due (YYYY-MM-DD or null), notes (string or null), client_id (match from client list or null), mode ("work" or "personal")
- Set realistic due dates relative to today
- Prioritise logically — setup tasks before execution tasks
- Keep task names concise (under 60 chars)
- Add brief notes only when genuinely useful

Return format:
{"tasks": [{"name":"...","priority":"high","due":"2026-04-10","notes":null,"client_id":"uuid-or-null","mode":"work"}]}`;

  try {
    const response = await fetch('/.netlify/functions/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: `Plan tasks for this goal (mode: ${aiMode}):\n\n${prompt}` }]
      })
    });

    const rawText = await response.text(); let data; try { data = JSON.parse(rawText); } catch(e) { throw new Error("Non-JSON response: " + rawText.slice(0,200)); }
    const text = data.content?.map(b => b.text || '').join('') || '';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    if (!parsed.tasks?.length) throw new Error('No tasks returned');

    aiPreviewTasks = parsed.tasks.map((t, i) => ({ ...t, _tempId: i }));
    showAIPreview(aiMode);
    status.classList.add('hidden');
    document.getElementById('ai-panel').classList.add('hidden');
    aiOpen = false;

  } catch (err) {
    const errDetail = data ? JSON.stringify(data).slice(0,200) : err.message; status.textContent = 'Error: ' + errDetail;
    console.error(err);
  }

  btn.disabled = false;
  btn.textContent = '✦ Plan tasks';
}

// ── AI preview ────────────────────────────────────────────

function showAIPreview(aiMode) {
  const preview = document.getElementById('ai-preview');
  preview.classList.remove('hidden');
  renderPreview();
}

function renderPreview() {
  const pLabel = { high: 'High', med: 'Medium', low: 'Low' };
  const pBadge = { high: 'p-high', med: 'p-med', low: 'p-low' };

  const html = aiPreviewTasks.map((t, i) => {
    const client = clients.find(c => c.id === t.client_id);
    return `<div class="preview-card" id="preview-${i}">
      <div class="preview-row">
        <input type="text" value="${escHtml(t.name)}" onchange="updatePreviewTask(${i},'name',this.value)" style="flex:1;font-size:13px;" />
        <button class="del-btn" onclick="removePreviewTask(${i})">✕</button>
      </div>
      <div class="preview-meta">
        <select onchange="updatePreviewTask(${i},'priority',this.value)" style="font-size:12px;">
          <option value="high"${t.priority==='high'?' selected':''}>High</option>
          <option value="med"${t.priority==='med'?' selected':''}>Medium</option>
          <option value="low"${t.priority==='low'?' selected':''}>Low</option>
        </select>
        <input type="date" value="${t.due||''}" onchange="updatePreviewTask(${i},'due',this.value||null)" style="font-size:12px;" />
        <select onchange="updatePreviewTask(${i},'client_id',this.value||null)" style="font-size:12px;">
          <option value="">No client</option>
          ${clients.map(c=>`<option value="${c.id}"${t.client_id===c.id?' selected':''}>${c.name}</option>`).join('')}
        </select>
      </div>
      ${t.notes ? `<div class="preview-notes">${escHtml(t.notes)}</div>` : ''}
    </div>`;
  }).join('');

  document.getElementById('ai-preview-list').innerHTML = html ||
    '<div class="empty">All tasks removed</div>';
}

function updatePreviewTask(i, field, value) {
  aiPreviewTasks[i][field] = value;
}

function removePreviewTask(i) {
  aiPreviewTasks.splice(i, 1);
  renderPreview();
}

function closeAIPreview() {
  document.getElementById('ai-preview').classList.add('hidden');
  aiPreviewTasks = [];
  document.getElementById('ai-prompt').value = '';
}

async function confirmAITasks() {
  if (!aiPreviewTasks.length) return;
  const btn = document.querySelector('#ai-preview .btn-ai-go');
  btn.disabled = true;
  btn.textContent = 'Saving…';

  const toInsert = aiPreviewTasks.map(t => ({
    name: t.name,
    mode: t.mode || mode,
    priority: t.priority,
    due: t.due || null,
    notes: t.notes || null,
    client_id: t.client_id || null,
    done: false
  }));

  const { data, error } = await sb.from('tasks').insert(toInsert).select();
  if (!error && data) {
    tasks.push(...data);
    closeAIPreview();
    render();
    showToast(`${data.length} tasks added`);
  }

  btn.disabled = false;
  btn.textContent = 'Save all tasks';
}

// ── Voice input ───────────────────────────────────────────

function toggleVoice() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) { showToast('Voice not supported in this browser'); return; }

  if (recognizing) {
    recognition.stop();
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = 'en-AU';
  recognition.continuous = false;
  recognition.interimResults = true;

  const btn = document.getElementById('mic-btn');
  const textarea = document.getElementById('ai-prompt');

  recognition.onstart = () => {
    recognizing = true;
    btn.classList.add('mic-active');
    btn.title = 'Listening… click to stop';
  };

  recognition.onresult = (e) => {
    const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
    textarea.value = transcript;
  };

  recognition.onend = () => {
    recognizing = false;
    btn.classList.remove('mic-active');
    btn.title = 'Voice input';
  };

  recognition.onerror = () => {
    recognizing = false;
    btn.classList.remove('mic-active');
    showToast('Voice input failed — try again');
  };

  recognition.start();
}

// ── Toast ─────────────────────────────────────────────────

function showToast(msg) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.className = 'toast show';
  setTimeout(() => el.classList.remove('show'), 2800);
}

// Init
loadBrief();
