// Combat engine for Dead Light
//
// No telegraph. No warnings. You react with what you have or you die.
// - Enemies hit hard; misses are rare. Every exchange costs you.
// - Brace costs a stamina and shaves a flat 2 off the next hit. No match
//   mini-game; a desperate flinch that occasionally saves you.
// - Companions fight alongside: Maya fires for real damage every 3
//   turns, Ren patches +1 HP every 4 turns. Uses existing flags.
window.Combat = (function () {

  const ENEMIES = {
    walker:       { name: "Walker",      art: "🧟",    hp: 4,  atk: [2, 3], speed: 1, desc: "Slow. Hungry. Relentless." },
    walker_cho:   { name: "Mrs. Cho",    art: "🧟‍♀️", hp: 3,  atk: [2, 3], speed: 1, desc: "She used to feed your cat." },
    walker_pair:  { name: "Two Walkers", art: "🧟🧟",  hp: 8,  atk: [2, 4], speed: 1, desc: "They move together.", pack: true },
    runner:       { name: "Runner",      art: "🧟‍♂️", hp: 4,  atk: [3, 4], speed: 2, desc: "Fresh. Fast. Furious." },
    bloater:      { name: "Bloater",     art: "🧟💀",  hp: 9,  atk: [3, 5], speed: 1, desc: "A swollen, leaking thing." },
    bandit:       { name: "Bandit",      art: "🧔🔫",  hp: 6,  atk: [3, 4], speed: 2, desc: "Smart. Armed. Desperate.", human: true },
    horde:        { name: "The Horde",   art: "🧟🧟🧟", hp: 16, atk: [3, 5], speed: 1, desc: "A tide of the dead." },
    // Mini-boss: the thing that was sealed inside the meat locker.
    // Mass of ruptured bodies fused together — slow, heavy, high HP.
    freezer_abom: { name: "Meatlocker Abomination", art: "🧟💀", hp: 11, atk: [3, 5], speed: 1, desc: "Grown together in the cold. It shouldn't still be moving.", savageRate: 0.2, boss: true },
    // The traitor has turned — boss: high HP, hard-hitting, savage often.
    traitor:      { name: "Calder (Turned)", art: "🧟‍♂️", hp: 14, atk: [4, 6], speed: 2, desc: "Not Calder any more. Something wearing his face.", savageRate: 0.28, boss: true },
  };

  // ---------- Loot tables ----------
  // Each entry rolls independently on a successful kill.
  //   chance   : 0..1 probability
  //   kind     : "ammo" | "food" | "weapon" | "item"
  //   n        : count for ammo/food
  //   pool     : array of {name, bonus, slot:"melee"|"ranged", ammo?}
  //   name+effect : one-off item with an optional state effect
  // Loot tables — `kind: "item"` pulls a random consumable from the
  // global ITEM_POOL (defined in game.js). Entries roll independently.
  const LOOT = {
    walker:  [
      { chance: 0.35, kind: "ammo", n: 1 },
      { chance: 0.3,  kind: "item" },
    ],
    walker_cho: [
      // Guaranteed gun from Mrs. Cho's nightstand.
      { chance: 1.0, kind: "weapon", pool: [
        { name: "Mrs. Cho's .22 Revolver",   bonus: 1, slot: "ranged", ammo: 3 },
        { name: "Her Husband's Service Pistol", bonus: 1, slot: "ranged", ammo: 4 },
        { name: "Pearl-grip Snub Nose",      bonus: 1, slot: "ranged", ammo: 2 },
      ] },
      // Plus 2 guaranteed + 1 likely random items from a wide pool so
      // each playthrough differs.
      { chance: 1.0, kind: "item" },
      { chance: 1.0, kind: "item" },
      { chance: 0.55, kind: "item" },
    ],
    walker_pair: [
      { chance: 0.55, kind: "ammo", n: 1 },
      { chance: 0.4,  kind: "item" },
      { chance: 0.15, kind: "weapon", pool: [
        { name: "Jagged Shard",      bonus: 1, slot: "melee" },
      ] },
    ],
    runner: [
      { chance: 0.55, kind: "ammo", n: 1 },
      { chance: 0.3,  kind: "item" },
    ],
    bloater: [
      { chance: 0.65, kind: "item" },
      { chance: 0.4,  kind: "ammo", n: 2 },
    ],
    bandit: [
      { chance: 1.0, kind: "ammo", n: 2 },
      { chance: 0.35, kind: "weapon", pool: [
        { name: "Sawed-off Shotgun", bonus: 2, slot: "ranged", ammo: 4 },
        { name: "Hunting Rifle",     bonus: 2, slot: "ranged", ammo: 3 },
      ] },
      { chance: 0.45, kind: "item" },
    ],
    traitor: [
      { chance: 1.0, kind: "weapon", pool: [
        { name: "Machete",           bonus: 2, slot: "melee" },
        { name: "Bowie Knife",       bonus: 2, slot: "melee" },
      ] },
      { chance: 1.0, kind: "ammo", n: 4 },
      { chance: 1.0, kind: "item" },
      { chance: 1.0, kind: "item" },
    ],
    freezer_abom: [
      { chance: 1.0, kind: "weapon", pool: [
        { name: "Butcher's Cleaver",        bonus: 2, slot: "melee" },
        { name: "Store Manager's Revolver", bonus: 2, slot: "ranged", ammo: 4 },
      ] },
      { chance: 1.0, kind: "item" },
      { chance: 1.0, kind: "item" },
      { chance: 0.6, kind: "ammo", n: 2 },
    ],
    horde: [],
  };

  function applyLoot(enemyId) {
    const drops = LOOT[enemyId] || [];
    const s = Game.state;
    drops.forEach(d => {
      if (Math.random() > d.chance) return;
      if (d.kind === "ammo") {
        s.ammo += d.n;
        Game.toast(`+${d.n} 🔫`);
      } else if (d.kind === "weapon") {
        const pick = d.pool[Math.floor(Math.random() * d.pool.length)];
        equipWeapon(pick);              // toasts its own 'Equipped X'
        if (pick.ammo) s.ammo += pick.ammo;
      } else if (d.kind === "item") {
        if (Game.giveRandomItem) Game.giveRandomItem();
      }
    });
  }

  // Always auto-equip a looted weapon. Every loot entry is designed to
  // be an upgrade (or at worst a lateral swap), so there's no menu —
  // you find it, you use it.
  function equipWeapon(w) {
    const s = Game.state;
    s.inventory = s.inventory || [];
    s.inventory.push({
      id: w.name,
      name: (w.slot === "ranged" ? "🔫 " : "🔪 ") + w.name,
      desc: `+${w.bonus} ${w.slot} damage`,
    });
    const slot = w.slot === "ranged" ? "bestRanged" : "bestMelee";
    const prev = s[slot];
    s[slot] = w;
    if (prev) {
      Game.toast(`Equipped ${w.name} (was ${prev.name})`);
    } else {
      Game.toast(`Equipped ${w.name}`);
    }
  }

  // ---------- Flags & helpers tied to Game.state ----------
  // Nora's with you if she's in companion2 AND (you're not currently on
  // a mission, or you explicitly brought her on this mission). Keeps her
  // out of hospital fights when you told her to stay at camp.
  function noraPresent() {
    const s = Game.state;
    if (s.companion2 !== "Nora") return false;
    // Horde defense happens at camp — she's hidden in the medbay but
    // still spotting for you, so the bonus applies.
    if (s.flags && s.flags.hordeDefense) return true;
    if (s.flags && "missionPartner" in s.flags) {
      return s.flags.bringNora === true;
    }
    return true;
  }
  function noraBonus()      { return noraPresent() ? 1 : 0; }
  function lovedMaya()      { return !!(Game.state.flags && Game.state.flags.lovedMaya); }
  function lovedRen()       { return !!(Game.state.flags && Game.state.flags.lovedRen);  }

  // Maya teaches you to read walkers. Base dodge bump while she's
  // with you, scales with bond (capped), extra if you're lovers.
  //   companion present : +0.20
  //   each bond point   : +0.02  (up to +0.10 for 5 bonds)
  //   loved             : +0.05 flat
  // Max cumulative ~0.35 (on top of normal ~0.10 base miss chance).
  function mayaDodge() {
    const s = Game.state;
    if (!mayaPresent()) return 0;
    let d = 0.20;
    const bond = Math.min(5, (s.bonds && s.bonds.maya) || 0);
    d += bond * 0.02;
    if (lovedMaya()) d += 0.05;
    return d;
  }

  // Ren stacks the cap buff and the heal amount with bond + love.
  // Used by game.js applyPartyBuffs for cap scaling and here for heals.
  function renCapMult() {
    const s = Game.state;
    if (!renPresent() && !lovedRen()) return 1;
    let m = 1.20;
    const bond = Math.min(5, (s.bonds && s.bonds.ren) || 0);
    m += bond * 0.02;
    if (lovedRen()) m += 0.05;
    return m;
  }
  function renHealAmount() {
    const s = Game.state;
    const bond = Math.min(5, (s.bonds && s.bonds.ren) || 0);
    return 1 + Math.floor(bond / 2) + (lovedRen() ? 1 : 0);
  }
  function renHealCooldown() {
    const bond = Math.min(5, (Game.state.bonds && Game.state.bonds.ren) || 0);
    if (lovedRen()) return 3;
    if (bond >= 3)  return 3;
    return 4;
  }

  // Nora's spotting sharpens as you look out for each other.
  // We haven't been tracking Nora's bond explicitly, so +1 base plus a
  // crit chance bump while she's with you.
  function noraCritBump() {
    return noraPresent() ? 0.05 : 0;
  }

  // Expose for game.js applyPartyBuffs.
  window.CombatBuffs = { mayaDodge, renCapMult, renHealAmount, renHealCooldown, noraBonus, noraCritBump };

  let state = null;

  // ---------- companion helpers ----------
  // missionPartner, when set, is the authoritative "who's with you right
  // now" flag — it overrides the long-lived companion relationship
  // (e.g. Maya is still your companion, but you left her at camp and
  // took Ren on the hospital run).
  //
  // hordeDefense overrides both: the camp is on the wall, so every
  // surviving ally is in this fight regardless of mission bookkeeping.
  function mayaPresent() {
    const s = Game.state;
    if (s.flags && s.flags.hordeDefense) return !!s.flags.maya;
    if (s.flags && "missionPartner" in s.flags) {
      return s.flags.missionPartner === "maya";
    }
    return s.companion === "Maya";
  }
  function renPresent() {
    const s = Game.state;
    if (s.flags && s.flags.hordeDefense) return true; // camp medic, always here
    if (s.flags && "missionPartner" in s.flags) {
      return s.flags.missionPartner === "ren";
    }
    return false;
  }
  // Vega rides along for the traitor confrontation on the "bring the
  // cavalry" path, and stands on the wall for the horde defense.
  function vegaPresent() {
    const s = Game.state;
    if (s.flags && s.flags.hordeDefense) return true;
    if (!s.flags || !s.flags.toldVega) return false;
    return !!state && state.enemyId === "traitor";
  }
  function renderAllies() {
    const wrap = document.getElementById("combat-allies");
    if (!wrap) return;
    const chips = [];
    const portraitURL = (key) => {
      const id = "portrait_" + key;
      const override = window.__OVERRIDES && window.__OVERRIDES[id];
      if (override) return override;
      return typeof window.sceneImageURL === "function"
        ? window.sceneImageURL(id)
        : "images/" + id + ".png";
    };
    const build = (key, face, label, ready, status) => {
      const src = portraitURL(key);
      // Image overlays the emoji. If it fails to load, onerror hides it
      // and the emoji underneath becomes visible — graceful fallback
      // until the user uploads portrait_<key>.png via admin.
      const onErr = "this.style.display='none'";
      return `<span class="ally-chip ${ready ? "ready" : ""}" data-ally="${key}">` +
        `<span class="ally-face"><span class="ally-emoji">${face}</span>` +
          `<img class="ally-portrait" alt="" src="${src}" onerror="${onErr}" />` +
        `</span>` +
        `<span class="ally-body">` +
          `<span class="ally-name">${label}</span>` +
          `<span class="ally-state">${status}</span>` +
        `</span>` +
      `</span>`;
    };
    if (mayaPresent()) {
      const ready = state.mayaCd <= 0;
      chips.push(build("maya", "👩‍🦰", "MAYA", ready, ready ? "NEXT SHOT" : `CD ${state.mayaCd}`));
    }
    if (renPresent()) {
      const ready = state.renCd <= 0;
      chips.push(build("ren", "🧑‍⚕️", "REN", ready, ready ? "TRIAGE" : `CD ${state.renCd}`));
    }
    if (vegaPresent()) {
      const ready = state.vegaCd <= 0;
      chips.push(build("vega", "🫡", "VEGA", ready, ready ? "RIFLE READY" : `CD ${state.vegaCd}`));
    }
    if (noraPresent()) {
      const ready = (state.noraCd || 0) <= 0;
      chips.push(build("nora", "👧", "NORA", ready, ready ? "SPOTTER" : `CD ${state.noraCd}`));
    }
    wrap.innerHTML = chips.join("");
  }

  // Brief flash on an ally chip the moment they act. Call AFTER re-rendering
  // allies (so the chip exists) — removes the class after the anim ends.
  function flashAlly(key) {
    renderAllies();
    const chip = document.querySelector(`.ally-chip[data-ally="${key}"]`);
    if (!chip) return;
    chip.classList.add("firing");
    setTimeout(() => {
      const c = document.querySelector(`.ally-chip[data-ally="${key}"]`);
      if (c) c.classList.remove("firing");
    }, 650);
  }

  // ---------- lifecycle ----------
  function start(config) {
    const def = ENEMIES[config.enemy];
    if (!def) { console.error("Unknown enemy", config.enemy); return; }

    // Risky encounters (story choices tagged RISKY or explicit risk:true)
    // scale the enemy up — +1 to both HP and each damage bound. Story
    // nodes can also override hp/atk outright for bespoke fights (e.g.
    // the camp-wide horde defense where the whole party is on the wall).
    const risky = !!config.risky;
    const baseHp = def.hp + (risky ? Math.max(1, Math.round(def.hp * 0.25)) : 0);
    const baseAtk = risky ? [def.atk[0] + 1, def.atk[1] + 1] : def.atk;
    const hp = config.hp !== undefined ? config.hp : baseHp;
    const atk = config.atk || baseAtk;

    state = {
      enemy: { ...def, hp, maxHp: hp, atk },
      onWin: config.onWin,
      onLose: config.onLose,
      enemyId: config.enemy,
      risky,
      turn: 0,
      bracing: false,
      // Romance lets the companion act one step sooner.
      mayaCd: lovedMaya() ? 0 : 1,
      renCd:  lovedRen()  ? 1 : 2,
      // Vega opens the scene with a rifle ready; she can fire turn one.
      vegaCd: 0,
      // Nora spots a threat every few turns — first warning around turn 3.
      noraCd: 3,
      noraWarn: false,
      startMs: Date.now(),
    };

    const combatScreen = document.getElementById("combat-screen");
    document.getElementById("game-screen").classList.add("hidden");
    combatScreen.classList.remove("hidden");

    // Start with the scene image as the fallback backdrop.
    const scnImg = document.querySelector("#scene-art .scene-image");
    combatScreen.style.setProperty(
      "--combat-backdrop",
      scnImg && scnImg.src ? `url("${scnImg.src}")` : "none"
    );

    // If there's a combat-specific image for this enemy (uploaded in
    // admin OR committed under images/combat_<id>.jpg), swap to it.
    // Admin override beats everything; otherwise probe the committed
    // file async and swap on load so a 404 just leaves the scene image.
    const combatKey = "combat_" + config.enemy;
    const override = window.__OVERRIDES && window.__OVERRIDES[combatKey];
    if (override) {
      combatScreen.style.setProperty("--combat-backdrop", `url("${override}")`);
    } else {
      const probe = new Image();
      probe.onload = () => {
        if (state && state.enemyId === config.enemy) {
          combatScreen.style.setProperty(
            "--combat-backdrop",
            `url("${probe.src}")`
          );
        }
      };
      probe.src = window.sceneImageURL
        ? window.sceneImageURL(combatKey)
        : "images/" + combatKey + ".jpg";
    }

    document.getElementById("enemy-art").textContent = state.enemy.art;
    document.getElementById("enemy-name").textContent = state.enemy.name;
    const descEl = document.getElementById("enemy-desc");
    if (descEl) descEl.textContent = state.enemy.desc || "";
    const chEl = document.getElementById("combat-chapter");
    if (chEl) chEl.textContent = "CONTACT";

    const logEl = document.getElementById("combat-log");
    logEl.innerHTML = "";

    if (config.enemy === "horde") Sound.play("hordeRoar");
    else if (config.enemy === "runner") Sound.play("runnerScream");
    else if (config.enemy === "bandit") Sound.play("drySnap");
    else Sound.play("groan");

    refreshHud();
    updateEnemyHp();
    renderAllies();
  }

  function log(msg, cls) {
    const logEl = document.getElementById("combat-log");
    const line = document.createElement("div");
    line.className = "line " + (cls || "");
    const secs = state ? Math.floor((Date.now() - state.startMs) / 1000) : 0;
    const mm = String(Math.floor(secs / 60)).padStart(2, "0");
    const ss = String(secs % 60).padStart(2, "0");
    line.dataset.ts = `[+${mm}:${ss}]`;
    line.appendChild(document.createTextNode(msg));
    logEl.appendChild(line);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function refreshHud() {
    const s = Game.state;
    document.getElementById("c-hp").textContent = Math.max(0, s.hp);
    document.getElementById("c-hpmax").textContent = s.hpMax;
    document.getElementById("c-stam").textContent = s.stam;
    document.getElementById("c-ammo").textContent = s.ammo;
    const hpPct   = Math.max(0, s.hp)   / Math.max(1, s.hpMax)   * 100;
    const stamPct = Math.max(0, s.stam) / Math.max(1, s.stamMax) * 100;
    const hpFill   = document.getElementById("c-hp-fill");
    const stamFill = document.getElementById("c-stam-fill");
    if (hpFill)   hpFill.style.width   = hpPct + "%";
    if (stamFill) stamFill.style.width = stamPct + "%";
  }

  function updateEnemyHp() {
    // 14-tick segmented HP strip
    const strip = document.getElementById("enemy-hp-strip");
    if (!strip) return;
    const total = 14;
    const hp = Math.max(0, state.enemy.hp);
    const ratio = hp / state.enemy.maxHp;
    const full = Math.round(total * ratio);
    strip.innerHTML = "";
    for (let i = 0; i < total; i++) {
      const s = document.createElement("span");
      if (i >= full) s.className = "empty";
      strip.appendChild(s);
    }
  }

  // Float a damage number over the enemy block.
  function floatDamage(n, kind) {
    const host = document.getElementById("combat-enemy");
    if (!host) return;
    const el = document.createElement("div");
    el.className = "dmg-float" + (kind ? " " + kind : "");
    el.textContent = (kind === "heal" ? "+" : "-") + n;
    host.appendChild(el);
    setTimeout(() => el.remove(), 900);
  }

  function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  // 'the Crowbar' but 'Her Husband's Service Pistol' (no article). Skips
  // the article when the weapon name already starts with a possessive
  // or an article. Keeps casing so proper nouns stay capitalised.
  function weaponPhrase(name) {
    return /^(the |a |an |mrs?\.|ms\.|her |his |their |your )/i.test(name)
      ? name
      : "the " + name;
  }

  // ---------- player turn ----------
  function act(action) {
    if (!state) return;
    const s = Game.state;

    if (action === "shoot" && !s.bestRanged) { Game.toast("No firearm"); Sound.play("drySnap"); return; }
    if (action === "shoot" && s.ammo <= 0) { Game.toast("Out of ammo"); Sound.play("drySnap"); return; }
    if (action === "melee" && s.stam <= 0) { Game.toast("Too exhausted"); Sound.play("back"); return; }
    if (action === "brace" && s.stam <= 0) { Game.toast("Too exhausted"); Sound.play("back"); return; }

    state.bracing = false;

    if (action === "melee") {
      s.stam -= 1;
      const base = rand(1, 3);
      const weaponBonus = s.bestMelee ? s.bestMelee.bonus : 0;
      // Brace-dodge on the previous turn sets up a counter: guaranteed
      // crit and a flat damage bonus, consumed by this swing.
      const counter = !!state.counterReady;
      state.counterReady = false;
      const critChance = counter ? 1 : (0.12 + noraCritBump());
      const crit = Math.random() < critChance;
      const counterBonus = counter ? 3 : 0;
      const dmg = base + weaponBonus + noraBonus() + counterBonus;
      const total = crit ? dmg + 2 : dmg;
      state.enemy.hp -= total;
      const weaponPhr = weaponPhrase(s.bestMelee ? s.bestMelee.name : "Crowbar");
      const prefix = counter ? "Reading the lunge — " : "";
      log(crit
        ? `${prefix}You drive ${weaponPhr} through its skull. CRITICAL ${total}.`
        : `You swing — ${total} damage.`,
        crit ? "crit" : "hero");
      Sound.play(crit ? "crit" : "melee");
      floatDamage(total, crit ? "crit" : null);
      hitFlash();
      spawnMark(crit ? "slashCrit" : "slash");
    }
    else if (action === "shoot") {
      state.counterReady = false;
      s.ammo -= 1;
      Sound.play("gunshot");
      gunFlash();
      const hit = Math.random() < (state.enemy.speed === 2 ? 0.75 : 0.9);
      if (!hit) {
        log("The shot misses. The sound draws more attention.", "info");
        spawnMark("miss");
      } else {
        const base = state.enemy.human ? rand(3, 5) : rand(2, 4);
        const weaponBonus = s.bestRanged ? s.bestRanged.bonus : 0;
        const dmg = base + weaponBonus + noraBonus();
        state.enemy.hp -= dmg;
        const weaponPhr = weaponPhrase(s.bestRanged ? s.bestRanged.name : "Handgun");
        log(`You fire ${weaponPhr} — ${dmg} damage.`, "hero");
        floatDamage(dmg);
        hitFlash();
        spawnMark("hit");
      }
    }
    else if (action === "brace") {
      state.counterReady = false;
      s.stam -= 1;
      state.bracing = true;
      log("You plant your feet.", "info");
      Sound.play("brace");
    }
    else if (action === "flee") {
      Sound.play("flee");
      // Bosses and fast / pack enemies can't be escaped.
      if (state.enemy.speed >= 2 || state.enemy.pack || state.enemy.boss) {
        const bite = rand(1, 2);
        s.hp -= bite;
        log(`No ground to give. It catches you — ${bite} damage.`, "enemy");
        Sound.play("damage");
        spawnEnemyBlood();
        screenShake();
        floatDamage(bite);
        if (s.hp <= 0) {
          refreshHud();
          log("You collapse.", "crit");
          Sound.play("death");
          setTimeout(() => end("lose"), 900);
          return;
        }
      } else {
        const fled = Math.random() < 0.55;
        if (fled) {
          log("You break away into the dark. Safe.", "info");
          // You dropped something while sprinting.
          if (Math.random() < 0.35) dropSomething();
          setTimeout(() => end("flee"), 700);
          return;
        }
        // Failed flee — it turns your back into an opening.
        const bite = rand(1, 3);
        s.hp -= bite;
        log(`You stumble — it closes and tears into you. ${bite} damage.`, "enemy");
        Sound.play("damage");
        spawnEnemyBlood();
        screenShake();
        floatDamage(bite);
        if (s.hp <= 0) {
          refreshHud();
          log("You collapse.", "crit");
          Sound.play("death");
          setTimeout(() => end("lose"), 900);
          return;
        }
      }
    }

    refreshHud();
    updateEnemyHp();

    if (state.enemy.hp <= 0) {
      log(`${state.enemy.name} falls.`, "crit");
      Sound.play("victory");
      applyLoot(state.enemyId);
      setTimeout(() => end("win"), 950);
      return;
    }

    setTimeout(enemyTurn, 600);
  }

  // Drop a random thing from the player's pack while fleeing.
  function dropSomething() {
    const s = Game.state;
    const opts = [];
    if (s.ammo > 0) opts.push("ammo");
    if (s.inventory && s.inventory.some(i => i.qty > 0 && (i.heal || i.stam || i.stamRefill))) opts.push("item");
    if (opts.length === 0) return;
    const pick = opts[Math.floor(Math.random() * opts.length)];
    if (pick === "ammo") {
      s.ammo = Math.max(0, s.ammo - 1);
      Game.toast("Dropped: 1 🔫");
    } else if (pick === "item") {
      const consumables = s.inventory.filter(i => i.qty > 0 && (i.heal || i.stam || i.stamRefill));
      const loser = consumables[Math.floor(Math.random() * consumables.length)];
      loser.qty -= 1;
      if (loser.qty <= 0) {
        const idx = s.inventory.indexOf(loser);
        s.inventory.splice(idx, 1);
      }
      Game.toast("Dropped: " + loser.name);
    }
  }

  function hitFlash() {
    const art = document.getElementById("enemy-art");
    art.classList.remove("hit");
    void art.offsetWidth;
    art.classList.add("hit");
  }

  // ---------- Hit marks ----------
  // - slash / slashCrit : curved tapered streak for melee
  // - hit / crit        : blood splatter for gun hits
  // - enemyHit          : your blood, darker
  // - miss / block      : nothing (log only)
  const SPLAT_SVG = `
    <svg viewBox="0 0 64 64">
      <g fill="currentColor">
        <path d="M32 22 Q22 20 20 30 Q18 40 28 44 Q38 46 42 38 Q44 28 36 22 Z"/>
        <circle cx="8"  cy="12" r="1.6"/>
        <circle cx="16" cy="7"  r="1.1"/>
        <circle cx="12" cy="22" r="2.1"/>
        <circle cx="52" cy="10" r="1.3"/>
        <circle cx="56" cy="22" r="1.9"/>
        <circle cx="54" cy="44" r="2.1"/>
        <circle cx="46" cy="56" r="1.3"/>
        <circle cx="34" cy="58" r="1"/>
        <circle cx="20" cy="56" r="1.6"/>
        <circle cx="6"  cy="50" r="1.8"/>
        <ellipse cx="7"  cy="34" rx="4"   ry="1"   transform="rotate(-18 7 34)"/>
        <ellipse cx="56" cy="30" rx="4.5" ry="1.2" transform="rotate(26 56 30)"/>
      </g>
    </svg>`;
  // Single curved tapered streak. Thin red fringe, bright core, tapered
  // ends. Two side droplets so the cut bleeds a little.
  const SLASH_SVG = `
    <svg viewBox="0 0 120 48">
      <defs>
        <linearGradient id="sl-core" x1="0" y1="0.5" x2="1" y2="0.5">
          <stop offset="0"   stop-color="rgba(255,255,255,0)"/>
          <stop offset="0.25" stop-color="rgba(255,240,230,0.95)"/>
          <stop offset="0.75" stop-color="rgba(255,240,230,0.95)"/>
          <stop offset="1"   stop-color="rgba(255,255,255,0)"/>
        </linearGradient>
        <linearGradient id="sl-edge" x1="0" y1="0.5" x2="1" y2="0.5">
          <stop offset="0"   stop-color="rgba(138,12,16,0)"/>
          <stop offset="0.2" stop-color="rgba(138,12,16,0.7)"/>
          <stop offset="0.5" stop-color="rgba(160,12,16,0.9)"/>
          <stop offset="0.8" stop-color="rgba(138,12,16,0.7)"/>
          <stop offset="1"   stop-color="rgba(138,12,16,0)"/>
        </linearGradient>
      </defs>
      <path d="M6 32 Q36 10 62 18 Q90 25 114 14"
            stroke="url(#sl-edge)" stroke-width="9" fill="none" stroke-linecap="round"/>
      <path d="M6 32 Q36 10 62 18 Q90 25 114 14"
            stroke="url(#sl-core)" stroke-width="3" fill="none" stroke-linecap="round"/>
      <circle cx="28" cy="36" r="1.8" fill="#8a0c10"/>
      <circle cx="52" cy="30" r="1.4" fill="#8a0c10"/>
      <circle cx="96" cy="28" r="1.6" fill="#8a0c10"/>
    </svg>`;

  function spawnMark(kind) {
    if (kind === "miss" || kind === "block") return;
    const host = document.getElementById("combat-screen");
    if (!host) return;
    const el = document.createElement("div");
    el.className = "splat " + kind;
    const isSlash = kind === "slash" || kind === "slashCrit";
    // Random jitter around a central band so repeated hits don't stack.
    const xJitter = 42 + Math.random() * 16;
    const yJitter = 32 + Math.random() * 16;
    // Slashes tilt just a bit; splatters spin freely.
    const rot = isSlash
      ? (-25 + Math.random() * 50)
      : Math.floor(Math.random() * 360);
    el.style.left = xJitter + "%";
    el.style.top  = yJitter + "%";
    el.style.setProperty("--rot", rot + "deg");
    el.innerHTML = isSlash ? SLASH_SVG : SPLAT_SVG;
    host.appendChild(el);
    setTimeout(() => el.remove(), 900);
  }

  // ---------- Zombie-hit: blood on the camera ----------
  // Three or four drippy streaks appear at random spots near the top
  // of the screen, each grows downward then fades. Reads like blood
  // splashed on the player's face/visor rather than a neat splatter.
  function spawnEnemyBlood() {
    const host = document.getElementById("combat-screen");
    if (!host) return;
    const el = document.createElement("div");
    el.className = "enemy-blood";
    const n = 3 + Math.floor(Math.random() * 3);  // 3-5 drips
    let drips = "";
    for (let i = 0; i < n; i++) {
      const x   = 8 + Math.random() * 84;                  // 8-92%
      const y   = Math.random() * 32;                      // 0-32%
      const len = 40 + Math.random() * 70;                 // 40-110px
      const rot = -12 + Math.random() * 24;                // slight tilt
      const dly = Math.random() * 0.14;                    // staggered start
      drips += `<div class="drip" style="left:${x}%;top:${y}%;--len:${len}px;--rot:${rot}deg;animation-delay:${dly}s"></div>`;
    }
    el.innerHTML = drips;
    host.appendChild(el);
    setTimeout(() => el.remove(), 1500);
  }

  // ---------- Gun muzzle flash (bottom-edge vignette) ----------
  // Fires on every trigger pull — hit or miss — so the act of shooting
  // is always felt. Mirrors the red hit-red vignette, but warm and from
  // the bottom where the gun would be held.
  function gunFlash() {
    const el = document.getElementById("combat-screen");
    if (!el) return;
    el.classList.remove("muzzle-flash");
    void el.offsetWidth;
    el.classList.add("muzzle-flash");
    setTimeout(() => el.classList.remove("muzzle-flash"), 260);
  }

  // ---------- enemy turn ----------
  function enemyTurn() {
    if (!state) return;
    const s = Game.state;
    const e = state.enemy;

    // Nora's warning from the previous round — consume it to force
    // a clean miss. Doesn't interact with brace counter (she's dodging
    // for you, not opening a guard).
    if (state.noraWarn) {
      state.noraWarn = false;
      log(`Nora's warning — the ${e.name} whiffs past you.`, "info");
      Sound.play("dodge");
      companionTurn();
      state.turn += 1;
      renderAllies();
      return;
    }

    let dmg = rand(e.atk[0], e.atk[1]);
    // Rare savage hit — ignores 1 of brace.
    const savage = Math.random() < 0.12;
    if (savage) dmg += 2;

    // Brace absorbs more now: -3 normal, -2 on savage.
    if (state.bracing) dmg = Math.max(0, dmg - (savage ? 2 : 3));

    // Misses are rare; you get hit. Maya teaches you to slip hits —
    // her dodge bonus is subtracted from the enemy's hit chance, with
    // a floor so the fight still matters. Brace also adds a flat
    // dodge bump for the turn you plant your feet.
    const baseHit = e.human ? 0.82 : 0.92;
    const braceDodge = state.bracing ? 0.25 : 0;
    const hitChance = Math.max(0.3, baseHit - mayaDodge() - braceDodge);
    const hit = Math.random() < hitChance;
    if (!hit) {
      // Brace-dodge sets up a counter: your next melee is a guaranteed
      // crit with a flat damage bonus.
      if (state.bracing) state.counterReady = true;
      const line = state.bracing
        ? `You plant your feet — the ${e.name} skims off your guard. Counter ready.`
        : mayaPresent() && Math.random() < 0.5
          ? `Maya's shout — you slip the ${e.name}'s lunge.`
          : `${e.name} lunges — you twist away.`;
      log(line, "info");
      Sound.play("dodge");
    } else if (dmg === 0) {
      // Full absorb through brace also opens a counter — you weathered it.
      if (state.bracing) state.counterReady = true;
      log(state.bracing
        ? `${e.name} hits — your guard swallows it. Counter ready.`
        : `${e.name} hits — you absorb it.`,
        "ally");
      Sound.play("brace");
      spawnMark("block");
    } else {
      // Armored vest (or any armor:true inventory item) eats one hit
      // and is destroyed. Big value, but gone after.
      const inv = s.inventory || [];
      const vestIdx = inv.findIndex(it => it && it.armor);
      if (vestIdx >= 0) {
        const vest = inv[vestIdx];
        inv.splice(vestIdx, 1);
        log(`${e.name} strikes — your ${vest.name.replace(/^[^\w]+\s*/, '')} takes it. Ruined.`, "ally");
        Sound.play("brace");
        spawnMark("block");
        screenShake();
      } else {
        s.hp -= dmg;
        const line = savage
          ? `${e.name} catches you — ${dmg} damage.`
          : `${e.name} strikes — ${dmg} damage.`;
        log(line, savage ? "crit" : "enemy");
        Sound.play(savage ? "crit" : "damage");
        spawnEnemyBlood();
        screenShake();
      }
    }

    refreshHud();

    if (s.hp <= 0) {
      log("You collapse.", "crit");
      Sound.play("death");
      setTimeout(() => end("lose"), 900);
      return;
    }

    companionTurn();

    state.turn += 1;
    renderAllies();
  }

  function screenShake() {
    const el = document.getElementById("combat-screen");
    if (!el) return;
    el.classList.remove("shake");
    el.classList.remove("hit-red");
    void el.offsetWidth;
    el.classList.add("shake");
    el.classList.add("hit-red");
  }

  // ---------- companion turn ----------
  function companionTurn() {
    const s = Game.state;
    if (!state || state.enemy.hp <= 0) return;

    if (mayaPresent()) {
      state.mayaCd = (state.mayaCd || 0) - 1;
      if (state.mayaCd <= 0) {
        // Lovers fight harder. +1 damage and a tighter cooldown.
        const bump = lovedMaya() ? 1 : 0;
        const dmg = (state.enemy.human ? rand(3, 4) : rand(2, 3)) + bump;
        state.enemy.hp -= dmg;
        log(`Maya fires from cover — ${dmg} damage.`, "ally");
        Sound.play("gunshot");
        gunFlash();
        spawnMark("hit");
        floatDamage(dmg);
        hitFlash();
        updateEnemyHp();
        state.mayaCd = lovedMaya() ? 2 : 3;
        flashAlly("maya");
        if (state.enemy.hp <= 0) {
          log(`${state.enemy.name} falls.`, "crit");
          Sound.play("victory");
          applyLoot(state.enemyId);
          setTimeout(() => end("win"), 950);
          return;
        }
      }
    }

    if (renPresent()) {
      state.renCd = (state.renCd || 0) - 1;
      // Heal amount + cooldown both scale with bond / love.
      const heal = renHealAmount();
      const cd   = renHealCooldown();
      if (state.renCd <= 0 && s.hp < s.hpMax) {
        s.hp = Math.min(s.hpMax, s.hp + heal);
        log(`Ren patches you — +${heal} HP.`, "ally");
        Sound.play("heal");
        floatDamage(heal, "heal");
        refreshHud();
        state.renCd = cd;
        flashAlly("ren");
      } else if (state.renCd <= 0) {
        state.renCd = 1;
      }
    }

    if (vegaPresent()) {
      state.vegaCd = (state.vegaCd || 0) - 1;
      if (state.vegaCd <= 0) {
        // Captain's rifle hits hard but the angle is tight — 3-4 dmg.
        const dmg = rand(3, 4);
        state.enemy.hp -= dmg;
        log(`Vega's rifle cracks — ${dmg} damage.`, "ally");
        Sound.play("gunshot");
        gunFlash();
        spawnMark("hit");
        floatDamage(dmg);
        hitFlash();
        updateEnemyHp();
        state.vegaCd = 2;
        flashAlly("vega");
        if (state.enemy.hp <= 0) {
          log(`${state.enemy.name} falls.`, "crit");
          Sound.play("victory");
          applyLoot(state.enemyId);
          setTimeout(() => end("win"), 950);
          return;
        }
      }
    }

    if (noraPresent()) {
      state.noraCd = (state.noraCd || 0) - 1;
      if (state.noraCd <= 0 && !state.noraWarn) {
        // Nora spots a feint and whispers the angle — next enemy swing
        // goes wide. Doesn't feed the brace counter (she's dodging for
        // you, not planting your feet).
        state.noraWarn = true;
        const cues = [
          "Nora whispers — \"Left side. Duck.\"",
          "Nora tugs your sleeve — \"It's going for your arm.\"",
          "Nora's eyes go wide — \"Behind the pipe. Now.\"",
        ];
        log(cues[rand(0, cues.length - 1)], "ally");
        Sound.play("dodge");
        flashAlly("nora");
        state.noraCd = 4;
      }
    }
  }

  // ---------- end ----------
  function end(result) {
    const cfg = state;
    state = null; // lock out further player input immediately
    // Hold on the combat screen for a beat so the final log line and
    // any loot/buff/trust toasts are actually readable before we wipe
    // to the next scene.
    const linger = result === "win" ? 1800 : result === "flee" ? 1000 : 1300;
    const combatEl = document.getElementById("combat-screen");
    combatEl.classList.add("fading-out");
    setTimeout(() => {
      combatEl.classList.remove("fading-out");
      combatEl.classList.add("hidden");
      document.getElementById("game-screen").classList.remove("hidden");
      if (result === "win" || result === "flee") Game.goto(cfg.onWin);
      else Game.goto(cfg.onLose);
    }, linger);
  }

  return { start, act };
})();
