// Game controller for Dead Light
window.Game = (function () {

  const SAVE_KEY = "dead_light_save_v1";

  const DEFAULT_STATE = () => ({
    name: "Ellis",
    hp: 10, hpMax: 10,
    stam: 5, stamMax: 5,
    ammo: 3,
    food: 2,
    companion: null,
    companion2: null,
    node: "intro",
    flags: {},
    inventory: [
      { id: "crowbar", name: "🔧 Crowbar", desc: "Dependable. Heavy." },
      { id: "bandages", name: "🩹 Bandages", desc: "For the small cuts.", qty: 2 },
    ],
  });

  let state = DEFAULT_STATE();

  function startNew() {
    state = DEFAULT_STATE();
    show("game-screen");
    hide("title-screen");
    goto("intro");
  }

  function continueGame() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) { toast("No save found"); return; }
    try {
      state = JSON.parse(raw);
      show("game-screen");
      hide("title-screen");
      goto(state.node || "intro");
    } catch (e) {
      toast("Save corrupted");
    }
  }

  function save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      toast("Saved");
    } catch (e) {
      toast("Couldn't save");
    }
  }

  function hasSave() {
    return !!localStorage.getItem(SAVE_KEY);
  }

  function quitToTitle() {
    hide("game-screen");
    hide("combat-screen");
    show("title-screen");
    refreshContinueBtn();
  }

  function refreshContinueBtn() {
    const btn = document.getElementById("continue-btn");
    if (!btn) return;
    btn.disabled = !hasSave();
  }

  function goto(nodeId) {
    if (nodeId === "__title__") { quitToTitle(); return; }
    if (nodeId === "__restart__") { startNew(); return; }

    const node = Story[nodeId];
    if (!node) { console.error("Missing node", nodeId); return; }

    state.node = nodeId;

    // Update scene
    const sceneEl = document.getElementById("scene");
    sceneEl.className = "scene " + (node.sceneClass || "");
    const art = document.getElementById("scene-art");
    art.textContent = node.art || "";
    art.classList.remove("shake");
    if (node.sceneClass === "blood") {
      void art.offsetWidth;
      art.classList.add("shake");
    }
    document.getElementById("scene-chapter").textContent = node.chapter || "";

    // Narrative
    document.getElementById("speaker").textContent = node.speaker || "";
    const text = typeof node.text === "function" ? node.text(state) : node.text;
    document.getElementById("story-text").textContent = text || "";

    // Choices
    const choicesEl = document.getElementById("choices");
    choicesEl.innerHTML = "";
    (node.choices || []).forEach(c => {
      if (c.require && !c.require(state)) return;
      const btn = document.createElement("button");
      btn.className = "choice-btn";
      btn.innerHTML = escapeHtml(c.label) + (c.tag
        ? ` <span class="tag ${c.tagClass || ''}">${escapeHtml(c.tag)}</span>`
        : "");
      btn.addEventListener("click", () => handleChoice(c));
      choicesEl.appendChild(btn);
    });

    updateHud();

    // Auto-save on new node
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  function handleChoice(c) {
    if (c.effect) {
      try { c.effect(state); } catch (e) { console.error(e); }
      updateHud();
    }
    if (c.combat) {
      Combat.start(c.combat);
      return;
    }
    if (c.next) {
      goto(c.next);
    }
  }

  function updateHud() {
    document.getElementById("hud-name").textContent = state.companion
      ? `${state.name} + ${state.companion}${state.companion2 ? " + " + state.companion2 : ""}`
      : state.name;
    document.getElementById("stat-hp").textContent = Math.max(0, state.hp);
    document.getElementById("stat-hpmax").textContent = state.hpMax;
    document.getElementById("stat-stam").textContent = state.stam;
    document.getElementById("stat-stammax").textContent = state.stamMax;
    document.getElementById("stat-ammo").textContent = state.ammo;
    document.getElementById("stat-food").textContent = state.food;
  }

  function openInventory() {
    const list = document.getElementById("inv-list");
    list.innerHTML = "";
    const items = [
      { name: "❤️ Health", qty: `${state.hp}/${state.hpMax}` },
      { name: "⚡ Stamina", qty: `${state.stam}/${state.stamMax}` },
      { name: "🔫 Ammunition", qty: state.ammo },
      { name: "🥫 Food rations", qty: state.food },
      ...(state.inventory || []),
    ];
    items.forEach(it => {
      const row = document.createElement("div");
      row.className = "inv-item";
      row.innerHTML = `<span>${escapeHtml(it.name)}</span><span class="qty">${escapeHtml(String(it.qty ?? 1))}</span>`;
      list.appendChild(row);
    });
    if (items.length === 0) {
      list.innerHTML = `<div class="inv-empty">Empty.</div>`;
    }
    show("inventory-modal");
  }
  function closeInventory() { hide("inventory-modal"); }

  function showCredits() { show("credits-modal"); }
  function hideCredits() { hide("credits-modal"); }

  function show(id) { document.getElementById(id).classList.remove("hidden"); }
  function hide(id) { document.getElementById(id).classList.add("hidden"); }

  function toast(msg) {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.classList.remove("hidden");
    clearTimeout(toast._t);
    // Re-trigger animation
    el.style.animation = "none";
    void el.offsetWidth;
    el.style.animation = "";
    toast._t = setTimeout(() => el.classList.add("hidden"), 2500);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // Init
  document.addEventListener("DOMContentLoaded", refreshContinueBtn);

  return {
    startNew, continueGame, save, quitToTitle, goto,
    openInventory, closeInventory, showCredits, hideCredits,
    toast,
    get state() { return state; },
  };
})();
