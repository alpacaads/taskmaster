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
    bonds: { maya: 0, ren: 0 },
    romance: null,
    // Best-equipped weapons — loot bumps their damage bonus. Nulls mean
    // the base crowbar/handgun stats from combat.js apply.
    bestMelee: null,
    bestRanged: null,
    // Every looted item lives here so the inventory screen can list them.
    inventory: [
      { id: "crowbar", name: "🔧 Crowbar", desc: "Dependable. Heavy." },
      { id: "bandages", name: "🩹 Bandages", desc: "For the small cuts.", qty: 2 },
    ],
  });

  let state = DEFAULT_STATE();

  let preloadHandle = null;
  function startPreload() {
    // Disabled: we serve local committed images, no Pollinations preload needed.
    // Preloading was saturating Safari's connection pool and blocking local
    // image loads.
  }

  function startNew() {
    state = DEFAULT_STATE();
    Sound.init(); Sound.play("select");
    show("game-screen");
    hide("title-screen");
    startPreload();
    goto("intro");
  }

  function continueGame() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) { toast("No save found"); Sound.play("back"); return; }
    try {
      state = JSON.parse(raw);
      Sound.init(); Sound.play("select");
      show("game-screen");
      hide("title-screen");
      startPreload();
      goto(state.node || "intro");
    } catch (e) {
      toast("Save corrupted");
    }
  }

  function save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      toast("Saved"); Sound.play("pickup");
    } catch (e) {
      toast("Couldn't save");
    }
  }

  function hasSave() {
    return !!localStorage.getItem(SAVE_KEY);
  }

  function quitToTitle() {
    Sound.stopAmbient();
    Sound.play("back");
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
    Sound.setAmbience(node.sceneClass || null);

    // Scene-entry sting
    if (nodeId === "death") Sound.play("death");
    else if (nodeId.startsWith("ending_final_")) Sound.play("victory");
    else if (nodeId === "horde_warning") Sound.play("hordeRoar");
    else if (nodeId === "neighbour_wake") Sound.play("groan");
    else if (nodeId === "ambush") Sound.play("tense");
    else if (nodeId === "greenbelt_in") Sound.play("radio");
    else if (nodeId === "freezer") Sound.play("door");
    const art = document.getElementById("scene-art");
    const sceneId = resolveScene(nodeId, node) || nodeId;
    art.innerHTML = Scenes.render(sceneId);
    art.classList.remove("shake");
    if (node.sceneClass === "blood") {
      void art.offsetWidth;
      art.classList.add("shake");
    }
    document.getElementById("scene-chapter").textContent = node.chapter || "";

    // Narrative
    const speaker = typeof node.speaker === "function" ? node.speaker(state) : node.speaker;
    document.getElementById("speaker").textContent = speaker || "";
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

    // Preload images for the scenes the player might click into next,
    // so clicking a choice feels instant.
    if (window.Scenes && Scenes.preloadScenes && window.Story) {
      const nextIds = (node.choices || [])
        .map(c => c.next)
        .filter(n => n && window.Story[n])
        .map(nextId => resolveScene(nextId, window.Story[nextId]))
        .filter(Boolean);
      Scenes.preloadScenes(nextIds);
    }

    updateHud();

    // Auto-save on new node
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  function handleChoice(c) {
    const before = { hp: state.hp, food: state.food, ammo: state.ammo };
    if (c.effect) {
      try { c.effect(state); } catch (e) { console.error(e); }
      updateHud();
    }
    // Pick a sound based on what the choice did
    if (c.combat) {
      Sound.play("select");
      Combat.start(c.combat);
      return;
    }
    if (state.hp > before.hp)        Sound.play("heal");
    else if (state.food > before.food || state.ammo > before.ammo) Sound.play("pickup");
    else if (state.hp < before.hp)   Sound.play("damage");
    else                             Sound.play("click");

    if (c.next) {
      const nextId = typeof c.next === "function" ? c.next(state) : c.next;
      goto(nextId);
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

  function toggleMute() {
    const m = Sound.toggleMute();
    const btn = document.getElementById("mute-btn");
    if (btn) btn.textContent = m ? "🔇" : "🔊";
    toast(m ? "Sound off" : "Sound on");
  }

  function openInventory() {
    const list = document.getElementById("inv-list");
    list.innerHTML = "";
    const items = [
      { name: "❤️ Health", qty: `${state.hp}/${state.hpMax}` },
      { name: "⚡ Stamina", qty: `${state.stam}/${state.stamMax}` },
      { name: "🔫 Ammunition", qty: state.ammo },
      { name: "🥫 Food rations", qty: state.food },
    ];
    if (state.bestMelee) {
      items.push({ name: "🔪 " + state.bestMelee.name,
        desc: `+${state.bestMelee.bonus} melee damage` });
    }
    if (state.bestRanged) {
      items.push({ name: "🔫 " + state.bestRanged.name,
        desc: `+${state.bestRanged.bonus} ranged damage` });
    }
    items.push(...(state.inventory || []));
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

  // Map story node ID -> scene ID. Most match by name; aliases below.
  const SCENE_ALIASES = {
    stairwell_first:    "stairwell",
    alone_street_sneak: "alone_street",
    grocery_quick_exit: "grocery_inside",
    street_plan:        "meet_maya",
    road_out:           "highway_dawn",
    road_out_child:     "highway_with_child",
    ambush:             "forest_ambush",
    sacrifice_intro:    "sacrifice",
    after_ambush_mercy: "forest_ambush",
    after_ambush_fight: "forest_ambush",
    greenbelt_gate_hero:"greenbelt_gate",
    greenbelt_in:       "greenbelt_camp",
    horde_warning:      "horde_charge",
    ending_hero:        "horde_wall",
    ending_fallen:      "ending_grave",
    ending_escape:      "ending_road",
    ending_final_hero:  "ending_dawn",
    ending_final_fallen:"ending_grave",
    ending_final_escape:"ending_road",
  };
  // Legacy SVG-era scene IDs (used in story.js node.scene values) that have
  // no committed PNG of their own. Map them to the closest scene with a
  // baked image so the game shows a real picture instead of the missing
  // placeholder.
  const STORY_SCENE_REMAP = {
    greenbelt_morning:  "camp_morning",
    medbay:             "chore_medbay",
    perimeter:          "chore_perimeter",
    camp_kitchen:       "chore_kitchen",
    briefing_tent:      "chore_done",
    horde_charge:       "horde_warning",
    ending_dawn:        "ending_final_hero",
    ending_grave:       "ending_final_fallen",
    ending_road:        "ending_final_escape",
    highway_dawn:       "road_out",
    highway_with_child: "road_out_child",
    hospital_ext:       "hospital_arrive",
    pharmacy_fight:     "pharmacy_combat",
    greenbelt_camp:     "greenbelt_in",
    gate_ajar_night:    "investigate_traitor",
    bonfire_night:      "bonfire_invite",
    intimate_bedroom:   "romance_maya",
    forest_ambush:      "ambush",
    sacrifice:          "sacrifice_intro",
    horde_wall:         "post_horde_win",
  };
  function resolveScene(nodeId, node) {
    const P = (window.Scenes && Scenes.PROMPTS) || {};
    const S = (window.Scenes && Scenes.SCENES)  || {};
    // Priority, most specific first:
    // 1. The node ID itself has a baked image -> use it (this is the
    //    narrative-specific choice and should win over legacy node.scene
    //    values left over from the SVG-composition era).
    if (P[nodeId]) return nodeId;
    // 2. node.scene is set and has a baked image -> use it.
    if (node.scene && P[node.scene]) return node.scene;
    // 3. Legacy SVG scene name -> remap to the closest baked image.
    if (node.scene && STORY_SCENE_REMAP[node.scene]) return STORY_SCENE_REMAP[node.scene];
    // 4. nodeId aliased to a known scene (legacy aliases table).
    if (SCENE_ALIASES[nodeId] && P[SCENE_ALIASES[nodeId]]) return SCENE_ALIASES[nodeId];
    // 5. Raw SCENES primitives, for completeness.
    if (node.scene && S[node.scene]) return node.scene;
    if (S[nodeId]) return nodeId;
    if (SCENE_ALIASES[nodeId]) return SCENE_ALIASES[nodeId];
    return node.scene || nodeId;
  }

  // Map a grapheme (single visible glyph) to an animation class.
  // Adds life to the emoji art: zombies shamble, fires pulse, trees sway, etc.
  const ANIM_MAP = {
    lurch:   ["🧟","🧟‍♂️","🧟‍♀️","💀"],
    shamble: ["🧔","🧍","🧍‍♀️","👧","🚶","🚶‍♀️","🏃"],
    sway:    ["🌳","🌲","🌴","🎄","🌾","🏚️","🏢","🏬","🏪","⛺","🚧","🛡️"],
    pulse:   ["🔥","💥","🕯️","🧨","☀️"],
    glow:    ["🌕","🌑","🌒","🌓","🌔","✨","🕊️"],
    flicker: ["🔦","💡","💫","🔌"],
    hover:   ["💨","💭","🌫️","☁️","🎵","🌅","🌃","🌆"],
    fly:     ["🚁","🕊️","🦅","🦇"],
    drip:    ["🩸","💧","❄️"],
    breathe: ["🎒","🥫","🧻","🪜","🚪","🗺️","🔫"],
    tremble: ["⚠️","📯","🔔"],
  };
  const CHAR_TO_ANIM = (() => {
    const m = new Map();
    for (const [cls, chars] of Object.entries(ANIM_MAP)) {
      for (const c of chars) m.set(c, cls);
    }
    return m;
  })();

  function renderAnimatedArt(el, text) {
    el.innerHTML = "";
    if (!text) return;
    let graphemes;
    try {
      const seg = new Intl.Segmenter("en", { granularity: "grapheme" });
      graphemes = [...seg.segment(text)].map(s => s.segment);
    } catch (_) {
      graphemes = [...text];
    }
    graphemes.forEach((ch, i) => {
      if (ch === " ") {
        el.appendChild(document.createTextNode(" "));
        return;
      }
      const span = document.createElement("span");
      span.className = "g";
      const cls = CHAR_TO_ANIM.get(ch);
      if (cls) span.classList.add(cls);
      else span.classList.add("hover"); // gentle bob for anything unmapped
      // Stagger so characters aren't perfectly in sync
      span.style.animationDelay = (i * 0.18).toFixed(2) + "s";
      span.textContent = ch;
      el.appendChild(span);
    });
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

  // Load admin-uploaded image overrides (if any) before any scene renders.
  // User lands on the title screen first, so there's time for IDB to resolve.
  document.addEventListener("DOMContentLoaded", () => {
    if (window.Overrides) window.Overrides.loadAll();
  });

  // On load, sync the mute button icon with saved preference
  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("mute-btn");
    if (btn && Sound.isMuted()) btn.textContent = "🔇";
  });

  function fallbackToSVG(sceneId) {
    if (!window.Scenes || !Scenes.renderSVG) return;
    const art = document.getElementById("scene-art");
    if (!art) return;
    art.innerHTML = Scenes.renderSVG(sceneId);
  }

  return {
    startNew, continueGame, save, quitToTitle, goto,
    openInventory, closeInventory, showCredits, hideCredits,
    toggleMute, toast, fallbackToSVG,
    get state() { return state; },
  };
})();
