// Game controller for Dead Light
window.Game = (function () {

  const SAVE_KEY = "dead_light_save_v1";

  const DEFAULT_STATE = () => ({
    name: "Ellis",
    hp: 10, hpMax: 10,
    stam: 5, stamMax: 5,
    ammo: 0,
    companion: null,
    companion2: null,
    node: "intro",
    flags: {},
    bonds: { maya: 0, ren: 0 },
    romance: null,
    // Equipped weapons — starter kit is a pocket knife only. Your first
    // firearm is looted from Mrs. Cho's apartment; every drop after
    // that is an upgrade. Bonuses stack into the per-swing / per-shot
    // dice in combat.js on top of the base damage range.
    bestMelee:  { name: "Pocket Knife", bonus: 0, slot: "melee" },
    bestRanged: null,
    // Looted consumables and keepsakes. Each entry has {id, name, desc,
    // qty, heal?, stam?, stamRefill?}. Consumables (any heal/stam field)
    // render a 'Use' button in the inventory modal.
    inventory: [
      { id: "bandages", name: "🩹 Bandages", desc: "Patch yourself up.", qty: 2, heal: 3 },
    ],
  });

  // ------- Consumables / loot item pool (widened) -------
  // Referenced from combat.js when a loot entry rolls `kind: "item"`.
  // Keep to ~8-10 entries so drops feel varied across a playthrough.
  window.ITEM_POOL = [
    { id: "bandages",    name: "🩹 Bandages",       desc: "Clean gauze. Stops bleeding.", heal: 3 },
    { id: "pills",       name: "💊 Pill Bottle",    desc: "Dulls the pain.",              heal: 2 },
    { id: "antiseptic",  name: "🧪 Antiseptic",     desc: "Cleans wounds properly.",      heal: 4 },
    { id: "painkillers", name: "💉 Painkillers",    desc: "Push through the worst.",      heal: 1, stam: 1 },
    { id: "adrenaline",  name: "⚡ Adrenaline Shot", desc: "Refills stamina to full.",     stamRefill: true },
    { id: "canned_fruit",name: "🍑 Canned Fruit",   desc: "Sweet. Unexpected.",           heal: 1 },
    { id: "granola",     name: "🥣 Granola Bar",    desc: "Stale. Still calories.",       heal: 1 },
    { id: "water",       name: "💧 Water Bottle",   desc: "Clean, for once.",             heal: 1, stam: 1 },
    { id: "jerky",       name: "🥓 Jerky Strip",    desc: "Salt and survival.",           heal: 1 },
    { id: "energy_bar",  name: "🍫 Energy Bar",     desc: "Chocolatey grit.",             stam: 2 },
  ];

  // Add one item to inventory, stacking quantity if already present.
  // Called from combat loot and from story effects that hand you things.
  function giveItem(id) {
    const def = window.ITEM_POOL.find(d => d.id === id);
    if (!def) return;
    state.inventory = state.inventory || [];
    const existing = state.inventory.find(i => i.id === def.id);
    if (existing) existing.qty = (existing.qty || 1) + 1;
    else state.inventory.push({ ...def, qty: 1 });
  }

  // Roll a random item from the full pool and give it.
  function giveRandomItem() {
    const pool = window.ITEM_POOL;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    giveItem(pick.id);
    toast("Found: " + pick.name);
    return pick;
  }

  // Consume one from the inventory, apply its effect, decrement qty.
  function useItem(id) {
    if (!state.inventory) return;
    const idx = state.inventory.findIndex(i => i.id === id);
    if (idx < 0) return;
    const it = state.inventory[idx];
    let applied = false;
    if (it.heal && state.hp < state.hpMax) {
      state.hp = Math.min(state.hpMax, state.hp + it.heal);
      applied = true;
    }
    if (it.stamRefill && state.stam < state.stamMax) {
      state.stam = state.stamMax;
      applied = true;
    } else if (it.stam && state.stam < state.stamMax) {
      state.stam = Math.min(state.stamMax, state.stam + it.stam);
      applied = true;
    }
    if (!applied) { toast("Nothing to fix right now."); return; }
    Sound.play("heal");
    it.qty = (it.qty || 1) - 1;
    if (it.qty <= 0) state.inventory.splice(idx, 1);
    updateHud();
    openInventory();   // re-render with the new state
    toast("Used: " + it.name);
  }

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

    // Fade in the new scene content so jumps don't feel instant.
    // Re-triggering the CSS animation via a reflow is cheap and resets
    // cleanly even when the same element gets updated back-to-back.
    [art, document.getElementById("narrative"), choicesEl].forEach(el => {
      if (!el) return;
      el.classList.remove("scene-fade-in");
      void el.offsetWidth;
      el.classList.add("scene-fade-in");
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
      // Support state-aware combat configs (fn(state) -> {enemy,...}).
      const cfg = typeof c.combat === "function" ? c.combat(state) : c.combat;
      Combat.start(cfg);
      return;
    }
    // Out-of-combat upkeep — run BEFORE measuring hp delta so the +1
    // from Nora still lights up as a heal sound / animation.
    applyUpkeep();
    updateHud();
    if (state.hp > before.hp)        Sound.play("heal");
    else if (state.food > before.food || state.ammo > before.ammo) Sound.play("pickup");
    else if (state.hp < before.hp)   Sound.play("damage");
    else                             Sound.play("click");

    if (c.next) {
      const nextId = typeof c.next === "function" ? c.next(state) : c.next;
      goto(nextId);
    }
  }

  // Who's actually standing next to the hero right now? missionPartner
  // overrides the persistent companion during a mission; bringNora
  // gates Nora on missions; hordeDefense keeps her on the roster at
  // camp. Mirrors combat.js presence helpers — single source of truth
  // for the HUD + per-action upkeep.
  function currentParty() {
    const s = state;
    const out = [];
    const onMission = s.flags && "missionPartner" in s.flags;
    if (onMission) {
      if (s.flags.missionPartner === "maya") out.push("Maya");
      else if (s.flags.missionPartner === "ren") out.push("Ren");
    } else if (s.companion) {
      out.push(s.companion);
    }
    if (s.companion2 === "Nora") {
      if (onMission) {
        if (s.flags.bringNora === true) out.push("Nora");
      } else if (s.flags && s.flags.hordeDefense) {
        out.push("Nora");
      } else {
        out.push("Nora");
      }
    }
    return out;
  }
  function noraWithYou() {
    const s = state;
    if (s.companion2 !== "Nora") return false;
    if (s.flags && "missionPartner" in s.flags) return s.flags.bringNora === true;
    return true;
  }

  // Per-action passive effects outside of combat. Nora with you = +1 HP
  // regen per action (capped at hpMax). Keeps the kid narratively
  // useful even though she can't fight.
  function applyUpkeep() {
    if (noraWithYou() && state.hp < state.hpMax) {
      state.hp = Math.min(state.hpMax, state.hp + 1);
    }
  }

  // Recompute hp/stam ceilings from the base values plus active party
  // buffs. Called at the top of every HUD refresh so the bars always
  // reflect the current party. Ren adds +20%% to both caps while she's
  // either your mission partner or a romantic partner.
  const BASE_HP_MAX   = 10;
  const BASE_STAM_MAX = 5;
  function applyPartyBuffs() {
    let hpMax = BASE_HP_MAX;
    let stamMax = BASE_STAM_MAX;
    // Ren's cap multiplier scales with her bond + love; CombatBuffs
    // owns the math so gameplay logic stays in one file.
    if (window.CombatBuffs && window.CombatBuffs.renCapMult) {
      const m = window.CombatBuffs.renCapMult();
      hpMax   = Math.round(hpMax   * m);
      stamMax = Math.round(stamMax * m);
    }
    state.hpMax   = hpMax;
    state.stamMax = stamMax;
    // Clamp current values if a buff dropped off and current > new max.
    state.hp   = Math.min(state.hp,   state.hpMax);
    state.stam = Math.min(state.stam, state.stamMax);
  }

  function updateHud() {
    applyPartyBuffs();
    const party = currentParty();
    document.getElementById("hud-name").textContent = party.length
      ? `${state.name} + ${party.join(" + ")}`
      : state.name;
    document.getElementById("stat-hp").textContent = Math.max(0, state.hp);
    document.getElementById("stat-hpmax").textContent = state.hpMax;
    document.getElementById("stat-stam").textContent = state.stam;
    document.getElementById("stat-stammax").textContent = state.stamMax;
    document.getElementById("stat-ammo").textContent = state.ammo;
    const hpPct   = Math.max(0, state.hp)   / Math.max(1, state.hpMax)   * 100;
    const stamPct = Math.max(0, state.stam) / Math.max(1, state.stamMax) * 100;
    const hpFill = document.getElementById("stat-hp-fill");
    if (hpFill)   hpFill.style.width = hpPct + "%";
    const stamFill = document.getElementById("stat-stam-fill");
    if (stamFill) stamFill.style.width = stamPct + "%";
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
    // Top-of-list read-only stats.
    const rows = [
      { readonly: true, name: "❤️ Health",     qty: `${state.hp}/${state.hpMax}` },
      { readonly: true, name: "⚡ Stamina",    qty: `${state.stam}/${state.stamMax}` },
      { readonly: true, name: "🔫 Ammunition", qty: state.ammo },
    ];
    if (state.bestMelee) {
      const b = state.bestMelee.bonus;
      rows.push({ readonly: true,
        name: "🔪 " + state.bestMelee.name,
        desc: b > 0 ? `Equipped · +${b} melee damage` : "Equipped · melee",
      });
    }
    if (state.bestRanged) {
      const b = state.bestRanged.bonus;
      rows.push({ readonly: true,
        name: "🔫 " + state.bestRanged.name,
        desc: b > 0 ? `Equipped · +${b} ranged damage` : "Equipped · ranged",
      });
    }
    // Looted items — dedupe against equipped weapons.
    const equippedNames = new Set();
    if (state.bestMelee)  equippedNames.add(state.bestMelee.name);
    if (state.bestRanged) equippedNames.add(state.bestRanged.name);
    (state.inventory || []).forEach(it => {
      const plainName = (it.name || "").replace(/^[^\s]+\s+/, "");
      if (equippedNames.has(plainName)) return;
      rows.push(it);
    });
    rows.forEach(it => {
      const row = document.createElement("div");
      row.className = "inv-item";
      const consumable = !it.readonly && (it.heal || it.stam || it.stamRefill);
      const label = consumable
        ? `<button class="inv-use" data-id="${escapeHtml(it.id)}">Use</button>`
        : `<span class="qty">${escapeHtml(String(it.qty ?? 1))}</span>`;
      const desc = it.desc ? `<div class="inv-desc">${escapeHtml(it.desc)}</div>` : "";
      row.innerHTML =
        `<div class="inv-main">
           <span class="inv-name">${escapeHtml(it.name)}${it.qty > 1 ? ` · ${it.qty}` : ""}</span>
           ${desc}
         </div>
         ${label}`;
      list.appendChild(row);
    });
    if (rows.length === 0) {
      list.innerHTML = `<div class="inv-empty">Empty.</div>`;
    }
    // Wire up the Use buttons.
    list.querySelectorAll(".inv-use").forEach(btn => {
      btn.addEventListener("click", () => useItem(btn.dataset.id));
    });
    show("inventory-modal");
  }
  function closeInventory() { hide("inventory-modal"); }

  function showCredits() { show("credits-modal"); }
  function hideCredits() { hide("credits-modal"); }

  function show(id) { document.getElementById(id).classList.remove("hidden"); }
  function hide(id) { document.getElementById(id).classList.add("hidden"); }

  // Toasts queue so rapid-fire events (loot drops, for example) all
  // get seen instead of the last one stomping every previous message.
  const toastQueue = [];
  let toastActive = false;
  function toast(msg) {
    toastQueue.push(String(msg));
    if (!toastActive) flushToast();
  }
  function flushToast() {
    if (toastQueue.length === 0) { toastActive = false; return; }
    toastActive = true;
    const el = document.getElementById("toast");
    const msg = toastQueue.shift();
    el.textContent = msg;
    el.classList.remove("hidden");
    // Re-trigger animation.
    el.style.animation = "none";
    void el.offsetWidth;
    el.style.animation = "";
    // Display each message long enough to read; queue processes back-to-back.
    const holdMs = toastQueue.length > 2 ? 900 : 1500;
    setTimeout(() => {
      el.classList.add("hidden");
      setTimeout(flushToast, 120);
    }, holdMs);
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
    // node.scene as a function branches on state (per-partner variants).
    // node.scene as a string is a legacy static override.
    const dynamicScene = typeof node.scene === "function" ? node.scene(state) : null;
    const staticScene  = typeof node.scene === "string"   ? node.scene : null;
    // Priority, most specific first:
    // 1. Dynamic function-scene wins (e.g. mission_journey_maya).
    if (dynamicScene && P[dynamicScene]) return dynamicScene;
    // 2. The node ID itself has a baked image — the narrative-specific
    //    choice. Beats static legacy overrides.
    if (P[nodeId]) return nodeId;
    // 3. Static scene override has a baked image.
    if (staticScene && P[staticScene]) return staticScene;
    // 4. Legacy SVG scene name -> remap to the closest baked image.
    if (staticScene && STORY_SCENE_REMAP[staticScene]) return STORY_SCENE_REMAP[staticScene];
    // 4. nodeId aliased to a known scene (legacy aliases table).
    if (SCENE_ALIASES[nodeId] && P[SCENE_ALIASES[nodeId]]) return SCENE_ALIASES[nodeId];
    // 5. Raw SCENES primitives, for completeness.
    if (dynamicScene && S[dynamicScene]) return dynamicScene;
    if (staticScene && S[staticScene]) return staticScene;
    if (S[nodeId]) return nodeId;
    if (SCENE_ALIASES[nodeId]) return SCENE_ALIASES[nodeId];
    return dynamicScene || staticScene || nodeId;
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

  // Story-side helper so narrative effects can equip a weapon without
  // reaching into Combat's private equipWeapon() directly.
  function giveWeapon(w) {
    state.inventory = state.inventory || [];
    const prev = w.slot === "ranged" ? state.bestRanged : state.bestMelee;
    state[w.slot === "ranged" ? "bestRanged" : "bestMelee"] = w;
    state.inventory.push({
      id: w.name,
      name: (w.slot === "ranged" ? "🔫 " : "🔪 ") + w.name,
      desc: `+${w.bonus} ${w.slot} damage`,
    });
    if (prev && prev.name !== w.name) {
      toast(`Equipped ${w.name} (was ${prev.name})`);
    } else {
      toast(`Equipped ${w.name}`);
    }
  }

  return {
    startNew, continueGame, save, quitToTitle, goto,
    openInventory, closeInventory, showCredits, hideCredits,
    toggleMute, toast, fallbackToSVG, giveWeapon,
    giveItem, giveRandomItem, useItem,
    get state() { return state; },
  };
})();
