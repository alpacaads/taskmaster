const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const CLIENT_COLORS = ['#378ADD','#1D9E75','#D85A30','#7F77DD','#D4537E','#BA7517','#639922','#E24B4A'];
const CLIENT_BG     = ['#E6F1FB','#E1F5EE','#FAECE7','#EEEDFE','#FBEAF0','#FAEEDA','#EAF3DE','#FCEBEB'];
const CLIENT_TEXT   = ['#0C447C','#085041','#712B13','#3C3489','#72243E','#633806','#27500A','#791F1F'];

let mode = 'work';
let filterClient = 'all';
let sortBy = 'priority';
let searchQuery = '';
let collapsed = {};
let clients = [];
let tasks = [];
let clientMgrOpen = false;
let formOpen = false;

async function init() {
  document.getElementById('task-area').innerHTML = '<div class="loading">Loading…</div>';
  await loadData();
  render();
}

async function loadData() {
  const [{ data: c }, { data: t }] = await Promise.all([
    sb.from('clients').select('*').order('created_at'),
    sb.from('tasks').select('*').order('created_at')
  ]);
  clients = c || [];
  tasks = t || [];
}

init();

// ── Clients ───────────────────────────────────────────────

function toggleClientMgr() {
  clientMgrOpen = !clientMgrOpen;
  document.getElementById('client-mgr').classList.toggle('hidden', !clientMgrOpen);
  renderClientMgr();
}

function renderClientMgr() {
  const el = document.getElementById('client-list-mgr');
  if (!clients.length) { el.innerHTML = '<div style="font-size:13px;color:var(--text-tertiary);">No clients yet</div>'; return; }
  el.innerHTML = clients.map(c => `
    <div class="client-row">
      <div class="color-dot" style="background:${c.color};"></div>
      <span>${c.name}</span>
      <button class="del-btn" onclick="deleteClient('${c.id}')">Remove</button>
    </div>`).join('');
}

async function addClient() {
  const inp = document.getElementById('new-client-name');
  const name = inp.value.trim();
  if (!name) return;
  const idx = clients.length % CLIENT_COLORS.length;
  const { data, error } = await sb.from('clients').insert({
    name, color: CLIENT_COLORS[idx], bg: CLIENT_BG[idx], text_color: CLIENT_TEXT[idx]
  }).select().single();
  if (!error) { clients.push(data); inp.value = ''; renderClientMgr(); render(); }
}

async function deleteClient(id) {
  await sb.from('clients').delete().eq('id', id);
  clients = clients.filter(c => c.id !== id);
  tasks = tasks.map(t => t.client_id === id ? { ...t, client_id: null } : t);
  renderClientMgr(); render();
}

// ── Add task ──────────────────────────────────────────────

function toggleForm() {
  formOpen = !formOpen;
  document.getElementById('add-form').classList.toggle('hidden', !formOpen);
  const sel = document.getElementById('new-client');
  if (mode === 'work') {
    sel.classList.remove('hidden');
    sel.innerHTML = '<option value="">— No client —</option>' +
      clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  } else { sel.classList.add('hidden'); }
  if (formOpen) document.getElementById('new-name').focus();
}

async function addTask() {
  const name = document.getElementById('new-name').value.trim();
  if (!name) return;
  const priority = document.getElementById('new-priority').value;
  const due = document.getElementById("new-due").value || null;
  const notes = document.getElementById("new-notes").value.trim() || null;
  
  const client_id = document.getElementById('new-client').value || null;
  const { data, error } = await sb.from('tasks').insert({
    name, mode, priority, due, notes, done: false, client_id
  }).select().single();
  if (!error) {
    tasks.push(data);
    document.getElementById('new-name').value = '';
    document.getElementById('new-due').value = '';
    document.getElementById('new-notes').value = '';
    document.getElementById('add-form').classList.add('hidden');
    formOpen = false;
    render();
  }
}

// ── Edit modal ────────────────────────────────────────────

function openEdit(id) {
  const t = tasks.find(t => t.id === id);
  if (!t) return;
  const clientOpts = '<option value="">— No client —</option>' +
    clients.map(c => `<option value="${c.id}"${t.client_id===c.id?' selected':''}>${c.name}</option>`).join('');
  showModal(`
    <div class="modal-title">Edit task</div>
    <input type="text" id="edit-name" value="${escHtml(t.name)}" />
    <div class="row">
      <select id="edit-priority">
        <option value="high"${t.priority==='high'?' selected':''}>High priority</option>
        <option value="med"${t.priority==='med'?' selected':''}>Medium priority</option>
        <option value="low"${t.priority==='low'?' selected':''}>Low priority</option>
      </select>
      <input type="date" id="edit-due" value="${t.due||''}" />
    </div>
    ${mode==='work'?`<select id="edit-client">${clientOpts}</select>`:''}
    <textarea id="edit-notes" placeholder="Notes (optional)" rows="3">${escHtml(t.notes||'')}</textarea>
    <div class="modal-actions">
      <button class="del-task-btn" onclick="deleteTask('${id}')">Delete task</button>
      <div style="display:flex;gap:8px;">
        <button onclick="closeModal()">Cancel</button>
        <button class="save" onclick="saveEdit('${id}')">Save</button>
      </div>
    </div>`);
  setTimeout(() => document.getElementById('edit-name').focus(), 50);
}

async function saveEdit(id) {
  const name = document.getElementById('edit-name').value.trim();
  if (!name) return;
  const priority = document.getElementById('edit-priority').value;
  const due = document.getElementById('edit-due').value || null;
  const notes = document.getElementById('edit-notes').value.trim() || null;
  const clientEl = document.getElementById('edit-client');
  const client_id = clientEl ? (clientEl.value || null) : null;
  const updates = { name, priority, due, notes, client_id };
  const t = tasks.find(t => t.id === id);
  if (t) Object.assign(t, updates);
  closeModal();
  render();
  await sb.from('tasks').update(updates).eq('id', id);
}

async function deleteTask(id) {
  if (!confirm('Delete this task?')) return;
  await sb.from('tasks').delete().eq('id', id);
  tasks = tasks.filter(t => t.id !== id);
  closeModal(); render();
}

async function toggleDone(id) {
  const t = tasks.find(t => t.id === id);
  if (!t) return;
  t.done = !t.done;
  render();
  await sb.from('tasks').update({ done: t.done }).eq('id', id);
}

// ── Bulk clear done ───────────────────────────────────────

async function clearDone(clientId) {
  const toDelete = tasks.filter(t =>
    t.mode === mode && t.done &&
    (clientId === 'personal' ? true : t.client_id === (clientId || null))
  );
  if (!toDelete.length || !confirm(`Clear ${toDelete.length} completed task${toDelete.length>1?'s':''}?`)) return;
  const ids = toDelete.map(t => t.id);
  await sb.from('tasks').delete().in('id', ids);
  tasks = tasks.filter(t => !ids.includes(t.id));
  render();
}

// ── Export CSV ────────────────────────────────────────────

function exportCSV() {
  const rows = [['Name','Mode','Priority','Due','Done','Client','Notes']];
  tasks.forEach(t => {
    const client = clients.find(c => c.id === t.client_id);
    rows.push([
      `"${(t.name||'').replace(/"/g,'""')}"`,
      t.mode, t.priority, t.due||'', t.done?'Yes':'No',
      client ? `"${client.name.replace(/"/g,'""')}"` : '',
      `"${(t.notes||'').replace(/"/g,'""')}"`
    ]);
  });
  const csv = rows.map(r => r.join(',')).join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = 'tasks.csv';
  a.click();
}

// ── Modal helper ──────────────────────────────────────────

function showModal(html) {
  const el = document.getElementById('modal');
  el.innerHTML = `<div class="modal-backdrop" onclick="closeModal()"></div><div class="modal-box">${html}</div>`;
  el.classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
}

// ── UI state ──────────────────────────────────────────────

function setMode(m) {
  mode = m; filterClient = 'all'; searchQuery = '';
  document.getElementById('search-input').value = '';
  document.getElementById('btn-work').classList.toggle('active', m==='work');
  document.getElementById('btn-personal').classList.toggle('active', m==='personal');
  document.getElementById('client-mgr-btn').classList.toggle('hidden', m!=='work');
  render();
}

function setFilter(v) { filterClient = v; render(); }
function toggleCollapse(key) { collapsed[key] = !collapsed[key]; render(); }
function setSort(v) { sortBy = v; render(); }
function setSearch(v) { searchQuery = v.toLowerCase(); render(); }

// ── Helpers ───────────────────────────────────────────────

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fmtDue(due) {
  if (!due) return null;
  const d = new Date(due + 'T00:00:00');
  const today = new Date(); today.setHours(0,0,0,0);
  const diff = Math.round((d - today) / 86400000);
  if (diff < 0) return { text: 'Overdue', overdue: true };
  if (diff === 0) return { text: 'Today', overdue: false };
  if (diff === 1) return { text: 'Tomorrow', overdue: false };
  return { text: d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }), overdue: false };
}

function sortTasks(list) {
  return [...list].sort((a, b) => {
    if (sortBy === 'due') {
      if (!a.due && !b.due) return 0;
      if (!a.due) return 1;
      if (!b.due) return -1;
      return a.due.localeCompare(b.due);
    }
    if (sortBy === 'created') return (a.created_at||'').localeCompare(b.created_at||'');
    const po = { high:0, med:1, low:2 };
    return po[a.priority] - po[b.priority] || (a.due||'zzz').localeCompare(b.due||'zzz');
  });
}

function taskCard(t) {
  const pBadge = { high:'p-high', med:'p-med', low:'p-low' };
  const pLabel = { high:'High', med:'Medium', low:'Low' };
  const due = fmtDue(t.due);
  return `<div class="task-card${t.done?' done':''}">
    <div class="check${t.done?' checked':''}" onclick="toggleDone('${t.id}')">
      <svg width="9" height="7" viewBox="0 0 9 7"><polyline points="1,3.5 3.5,6 8,1" fill="none" stroke="#1D9E75" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </div>
    <div class="task-body" onclick="openEdit('${t.id}')">
      <span class="task-name">${escHtml(t.name)}</span>
      ${t.notes ? `<span class="task-notes">${escHtml(t.notes)}</span>` : ''}
    </div>
    ${due ? `<span class="due${due.overdue?' overdue':''}">${due.text}</span>` : ''}
    ${!t.done ? `<span class="badge ${pBadge[t.priority]}">${pLabel[t.priority]}</span>` : ''}
  </div>`;
}

// ── Render ────────────────────────────────────────────────

function render() {
  const pOrder = { high:0, med:1, low:2 };
  let list = tasks.filter(t => t.mode === mode);

  // search filter
  if (searchQuery) list = list.filter(t =>
    t.name.toLowerCase().includes(searchQuery) ||
    (t.notes||'').toLowerCase().includes(searchQuery)
  );

  // overdue badge
  const overdueCount = tasks.filter(t => {
    if (t.done || !t.due) return false;
    return new Date(t.due+'T00:00:00') < new Date(new Date().setHours(0,0,0,0));
  }).length;
  const badge = document.getElementById('overdue-badge');
  if (overdueCount > 0) {
    badge.textContent = overdueCount + ' overdue';
    badge.classList.remove('hidden');
  } else { badge.classList.add('hidden'); }

  if (mode === 'personal') {
    document.getElementById('client-filter-bar').innerHTML = '';
    const active = sortTasks(list.filter(t => !t.done));
    const done = list.filter(t => t.done);
    let html = '';
    if (!active.length && !done.length) html = '<div class="empty">No tasks yet — add one above</div>';
    else {
      if (active.length) html += '<div class="task-list">' + active.map(taskCard).join('') + '</div>';
      if (done.length) html += `<div class="done-header"><span class="section-label">Done (${done.length})</span><button class="clear-btn" onclick="clearDone('personal')">Clear all</button></div><div class="task-list">${done.map(taskCard).join('')}</div>`;
    }
    document.getElementById('task-area').innerHTML = html;
    return;
  }

  const usedClientIds = [...new Set(tasks.filter(t=>t.mode===mode).map(t => t.client_id).filter(Boolean))];
  const visibleClients = filterClient === 'all'
    ? clients.filter(c => usedClientIds.includes(c.id))
    : clients.filter(c => c.id === filterClient);

  document.getElementById('client-filter-bar').innerHTML = `
    <div class="toolbar">
      <div class="client-filter">
        <button class="cf-btn${filterClient==='all'?' active':''}" onclick="setFilter('all')">All</button>
        ${clients.filter(c=>usedClientIds.includes(c.id)).map(c=>
          `<button class="cf-btn${filterClient===c.id?' active':''}" onclick="setFilter('${c.id}')">${c.name}</button>`
        ).join('')}
      </div>
      <div style="display:flex;gap:8px;align-items:center;flex-shrink:0;">
        <select onchange="setSort(this.value)" style="font-size:12px;padding:4px 8px;border:0.5px solid var(--border);border-radius:6px;background:transparent;color:var(--text-secondary);">
          <option value="priority"${sortBy==='priority'?' selected':''}>By priority</option>
          <option value="due"${sortBy==='due'?' selected':''}>By due date</option>
          <option value="created"${sortBy==='created'?' selected':''}>By date added</option>
        </select>
        <button class="btn" style="font-size:12px;padding:4px 10px;" onclick="exportCSV()">Export CSV</button>
      </div>
    </div>`;

  let html = '';
  visibleClients.forEach(c => {
    const cTasks = list.filter(t => t.client_id === c.id);
    const active = sortTasks(cTasks.filter(t => !t.done));
    const done = cTasks.filter(t => t.done);
    const isCollapsed = collapsed[c.id];
    html += `<div class="section-block">
      <div class="client-header" onclick="toggleCollapse('${c.id}')">
        <div class="color-dot" style="background:${c.color};"></div>
        <span class="client-name">${c.name}</span>
        <span class="client-count">${active.length} open${done.length?', '+done.length+' done':''}</span>
        <span class="chevron${isCollapsed?'':' open'}">&#9654;</span>
      </div>`;
    if (!isCollapsed) {
      if (!cTasks.length) html += '<div style="font-size:13px;color:var(--text-tertiary);padding:4px 0 8px 18px;">No tasks</div>';
      else {
        if (active.length) html += '<div class="task-list">'+active.map(taskCard).join('')+'</div>';
        if (done.length) html += `<div class="done-header" style="padding-left:18px;"><span class="section-label">Done (${done.length})</span><button class="clear-btn" onclick="clearDone('${c.id}')">Clear</button></div><div class="task-list">${done.map(taskCard).join('')}</div>`;
      }
    }
    html += '</div>';
  });

  const unassigned = filterClient === 'all' ? list.filter(t => !t.client_id) : [];
  if (unassigned.length) {
    const active = sortTasks(unassigned.filter(t => !t.done));
    const done = unassigned.filter(t => t.done);
    html += `<div class="section-block">
      <div class="client-header" onclick="toggleCollapse('none')">
        <div class="color-dot" style="background:var(--text-tertiary);"></div>
        <span class="client-name" style="color:var(--text-secondary);">Unassigned</span>
        <span class="client-count">${active.length} open</span>
        <span class="chevron${collapsed['none']?'':' open'}">&#9654;</span>
      </div>`;
    if (!collapsed['none']) {
      if (active.length) html += '<div class="task-list">'+active.map(taskCard).join('')+'</div>';
      if (done.length) html += `<div class="done-header"><span class="section-label">Done (${done.length})</span><button class="clear-btn" onclick="clearDone(null)">Clear</button></div><div class="task-list">${done.map(taskCard).join('')}</div>`;
    }
    html += '</div>';
  }

  if (!html) html = '<div class="empty">No tasks yet — add one above</div>';
  document.getElementById('task-area').innerHTML = html;
}
