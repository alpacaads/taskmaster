// Combat engine for Dead Light
//
// No telegraph. No warnings. You react with what you have or you die.
// - Enemies hit hard; misses are rare. Every exchange costs you.
// - Brace costs a stamina and shaves a flat 2 off the next hit. No match
//   mini-game; a desperate flinch that occasionally saves you.
// - Companions fight alongside: Maya fires for real damage every 3
//   turns, Ren patches +1 HP every 4 turns. Uses existing flags.
window.Combat = (function () {

  // Enemy traits (what the stat keys mean):
  //   smallArmsResist : reduce ranged damage by N (min 1 damage still lands)
  //   meleeVulnerable : add N to every successful melee hit
  //   headshotBonus   : add N to aimed shots AND crit melee
  //   heavySwing      : dodge player's swings less reliably (bonus to your strike hit) — slow clumsy enemies
  //   panic           : chance (0..1) that a successful enemy hit jitters you — your next shot / swing has +25% miss
  //   shaky           : player's hit chance -N% against this enemy (narrative weight, e.g. Mrs. Cho)
  //   enemyCanAim     : sometimes skips attack to line up — next hit is a crit
  //   enemyCanBrace   : sometimes braces — halves damage to it for one player turn
  const ENEMIES = {
    // Ordinary walker: easy melee food, slight small-arms resist (one
    // round often isn't enough, aim for the head).
    walker:       { name: "Walker",      art: "🧟",    hp: 4,  atk: [2, 3], speed: 1, desc: "Slow. Hungry. Relentless.", smallArmsResist: 1, headshotBonus: 2 },
    // Mrs. Cho: she used to feed your cat. Shaky hands.
    walker_cho:   { name: "Mrs. Cho",    art: "🧟‍♀️", hp: 3,  atk: [2, 3], speed: 1, desc: "She used to feed your cat.", shaky: 0.2, smallArmsResist: 1, headshotBonus: 2 },
    walker_pair:  { name: "Two Walkers", art: "🧟🧟",  hp: 8,  atk: [2, 4], speed: 1, desc: "They move together.", pack: true, smallArmsResist: 1, headshotBonus: 2 },
    // Runners are accurate and fast — they make you panic, hurting your
    // own hit chance for a turn, but their bite isn't what kills you.
    runner:       { name: "Runner",      art: "🧟‍♂️", hp: 4,  atk: [3, 4], speed: 2, desc: "Fresh. Fast. Furious.", panic: 0.3 },
    // Bloater: slow clumsy giant — easy to dodge, hard to hurt, big hit.
    bloater:      { name: "Bloater",     art: "🧟💀",  hp: 12, atk: [3, 5], speed: 1, desc: "A swollen, leaking thing.", smallArmsResist: 2, heavySwing: true },
    bandit:       { name: "Bandit",      art: "🧔🔫",  hp: 10, atk: [3, 4], speed: 2, desc: "Smart. Armed. Desperate.", human: true, dodge: 0.22, telegraphEvery: 3 },
    // Two bandits — hardest humans in the game. They aim at you AND
    // they brace. Smart, disciplined, burn your resources.
    bandit_pair:  { name: "Two Bandits",  art: "🧔🔫🧔", hp: 24, atk: [3, 5], speed: 2, desc: "Smart. Armed. Coordinated.", human: true, pack: true, dodge: 0.25, repositionEvery: 4, telegraphEvery: 3, enemyCanAim: true, enemyCanBrace: true, panic: 0.15 },
    horde:        { name: "The Horde",   art: "🧟🧟🧟", hp: 16, atk: [3, 5], speed: 1, desc: "A tide of the dead.", smallArmsResist: 1, headshotBonus: 2 },
    // Mini-boss: the thing that was sealed inside the meat locker.
    // Mass of ruptured bodies fused together — slow, heavy, armoured,
    // but headshots (aimed) punch through.
    freezer_abom: { name: "Meatlocker Abomination", art: "🧟💀", hp: 14, atk: [3, 5], speed: 1, desc: "Grown together in the cold. It shouldn't still be moving.", savageRate: 0.2, boss: true, smallArmsResist: 3, headshotBonus: 4, heavySwing: true },
    // Calder turned — fast, sturdy, 9mm bounces off, but he's not quite
    // armoured against a crowbar to the skull.
    traitor:      { name: "Calder (Turned)", art: "🧟‍♂️", hp: 20, atk: [4, 6], speed: 2, desc: "Not Calder any more. Something wearing his face.", savageRate: 0.28, boss: true, smallArmsResist: 2, meleeVulnerable: 2, telegraphEvery: 4 },
  };

  // ---------- Loot tables ----------
  // Each entry rolls independently on a successful kill.
  //   chance   : 0..1 probability
  //   kind     : "ammo" | "item"
  //   n        : count for ammo
  // NOTE: weapons are not random loot — they come from intentional
  // story beats (meet_maya Crowbar, cho_loot Service Pistol,
  // grocery_front_win Riot Vest). Combat only yields ammo + consumables.
  const LOOT = {
    walker:  [
      { chance: 0.35, kind: "ammo", n: 1 },
      { chance: 0.3,  kind: "item" },
    ],
    walker_cho: [
      // Mrs. Cho's belongings are narrated by the cho_loot scene (her
      // husband's .38 + 6 rounds). Combat itself drops ammo + a few
      // consumables scavenged from the apartment.
      { chance: 1.0,  kind: "item" },
      { chance: 1.0,  kind: "item" },
      { chance: 0.55, kind: "item" },
    ],
    walker_pair: [
      { chance: 0.55, kind: "ammo", n: 1 },
      { chance: 0.4,  kind: "item" },
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
      // Bandits were armed; you can raid their rounds/kit but the
      // guns themselves don't automatically become yours.
      { chance: 1.0,  kind: "ammo", n: 2 },
      { chance: 0.45, kind: "item" },
    ],
    // Two-bandit kill. Main story reward (shotgun + ammo + items) is
    // granted by the after-combat scene (after_ambush_fight /
    // sacrifice_aftermath). This table is a fallback safety net for
    // any future config that jumps straight to a node without its
    // own reward effect.
    bandit_pair: [
      { chance: 1.0,  kind: "ammo", n: 3 },
      { chance: 0.5,  kind: "item" },
    ],
    traitor: [
      { chance: 1.0, kind: "ammo", n: 4 },
      { chance: 1.0, kind: "item" },
      { chance: 1.0, kind: "item" },
    ],
    freezer_abom: [
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
      } else if (d.kind === "item") {
        if (Game.giveRandomItem) Game.giveRandomItem();
      }
      // NOTE: no kind === 'weapon' — weapons come from story beats only.
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
    const eng = (state && state.engaged) || {};
    const ae = state && state.allyEnemy;
    const engagedLabel = (key) =>
      ae && ae.allyKey === key && ae.hp > 0
        ? `FIGHTING ${ae.hp}/${ae.maxHp}`
        : "ENGAGED";
    if (mayaPresent()) {
      if (eng.maya) {
        chips.push(build("maya", "👩‍🦰", "MAYA", false, engagedLabel("maya")));
      } else {
        const ready = state.mayaCd <= 0;
        chips.push(build("maya", "👩‍🦰", "MAYA", ready, ready ? "NEXT SHOT" : `CD ${state.mayaCd}`));
      }
    }
    if (renPresent()) {
      if (eng.ren) {
        chips.push(build("ren", "🧑‍⚕️", "REN", false, engagedLabel("ren")));
      } else {
        const ready = state.renCd <= 0;
        chips.push(build("ren", "🧑‍⚕️", "REN", ready, ready ? "TRIAGE" : `CD ${state.renCd}`));
      }
    }
    if (vegaPresent()) {
      if (eng.vega) {
        chips.push(build("vega", "🫡", "VEGA", false, engagedLabel("vega")));
      } else {
        const ready = state.vegaCd <= 0;
        chips.push(build("vega", "🫡", "VEGA", ready, ready ? "RIFLE READY" : `CD ${state.vegaCd}`));
      }
    }
    if (noraPresent()) {
      if (eng.nora) {
        chips.push(build("nora", "👧", "NORA", false, engagedLabel("nora")));
      } else {
        const ready = (state.noraCd || 0) <= 0;
        chips.push(build("nora", "👧", "NORA", ready, ready ? "SPOTTER" : `CD ${state.noraCd}`));
      }
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

    // Party-vs-party engagement. When a combat config declares
    // engagedAllies (e.g. the two-bandit ambush where Maya is tied
    // up fighting the second one), those allies can't assist from
    // the sidelines until engagementFlipAt is reached. At that
    // point the "second enemy" drops, the engagement lifts, and the
    // ally rejoins the fight. Extra hostile damage is applied while
    // the engagement is still live — the uncovered bandit takes
    // his own shots at you.
    const engagedAllies = Array.isArray(config.engagedAllies)
      ? config.engagedAllies.filter(a => typeof a === "string")
      : [];
    const engagedSet = {};
    engagedAllies.forEach(a => { engagedSet[a] = true; });

    // Ally engagement: ally is fighting their OWN enemy with its OWN
    // HP, running in parallel to yours. They're locked out of assist
    // until they kill it. See tickAllyFight.
    //   config.allyEngagement = { ally: "maya", enemy: "bandit" }
    let allyEnemy = null;
    if (config.allyEngagement && config.allyEngagement.ally && ENEMIES[config.allyEngagement.enemy]) {
      const aDef = ENEMIES[config.allyEngagement.enemy];
      allyEnemy = {
        id: config.allyEngagement.enemy,
        name: aDef.name,
        hp: aDef.hp,
        maxHp: aDef.hp,
        allyKey: config.allyEngagement.ally,
      };
      engagedSet[config.allyEngagement.ally] = true;
    }

    // Wave fights: config.waves is an array of enemy ids that come
    // after the opening one. The horde defense uses this to spawn a
    // mixed queue of walkers / runners / bloaters / pairs — 10 or so
    // enemies back-to-back with brief HP/stam breathers between.
    const waveQueue = Array.isArray(config.waves) ? config.waves.slice() : [];
    const totalWaves = 1 + waveQueue.length;

    state = {
      enemy: { ...def, hp, maxHp: hp, atk },
      onWin: config.onWin,
      onLose: config.onLose,
      enemyId: config.enemy,
      risky,
      turn: 0,
      bracing: false,
      // Allies always start a new fight with their cooldowns at zero —
      // whatever happened last fight, they're rested and ready to open
      // turn one here. Romance still shortens Maya's follow-up cooldown
      // after she fires (handled where state.mayaCd is reset post-action).
      mayaCd: 0,
      renCd:  0,
      vegaCd: 0,
      noraCd: 0,
      noraWarn: false,
      engaged: engagedSet,
      engagedInitial: engagedAllies.slice(),
      engagementFlipAt: engagementFlipAt,
      engagementLifted: false,
      allyEnemy: allyEnemy,
      waveQueue: waveQueue,
      waveIndex: 1,
      totalWaves: totalWaves,
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
    if (chEl) chEl.textContent = state.totalWaves > 1
      ? `WAVE ${state.waveIndex} / ${state.totalWaves}`
      : "CONTACT";

    const logEl = document.getElementById("combat-log");
    logEl.innerHTML = "";

    if (config.enemy === "horde") Sound.play("hordeRoar");
    else if (config.enemy === "runner") Sound.play("runnerScream");
    else if (config.enemy === "bandit" || config.enemy === "bandit_pair") Sound.play("drySnap");
    else Sound.play("groan");

    // Opening log line when an ally gets pinned down — gives the player
    // the 'one on you, one on yours' read before the first turn.
    if (state.engagedInitial && state.engagedInitial.length) {
      state.engagedInitial.forEach(a => {
        const name = a === "maya" ? "Maya" : a === "ren" ? "Ren" : a === "vega" ? "Vega" : a === "nora" ? "Nora" : a;
        log(`${name} breaks off — she's got the other one.`, "info");
      });
    }

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

  // Throw a grenade at the current enemy. Called from the inventory
  // modal's Use button when a combat is active. Caller is responsible
  // for only firing this when state is live — Game.inCombat gates it.
  function throwGrenade() {
    if (!state || state.enemy.hp <= 0) return;
    state.counterReady = false;
    const dmg = rand(7, 9);
    state.enemy.hp -= dmg;
    log(`You pull the pin. The grenade lands at their feet — BOOM. ${dmg} damage.`, "crit");
    Sound.play("gunshot");
    gunFlash();
    spawnMark("slashCrit");
    floatDamage(dmg);
    hitFlash();
    screenShake();
    refreshHud();
    updateEnemyHp();
    checkEngagementFlip();
    if (state.enemy.hp <= 0) {
      log(`${state.enemy.name} falls.`, "crit");
      finishOrAdvance();
      return;
    }
    // Grenade still triggers a hostile turn — they're shooting through
    // the smoke — same cadence as the removed act('grenade') branch.
    setTimeout(enemyTurn, 600);
  }

  // Enemy status chip — shows the enemy's CURRENT reactive state
  // (lined up after a telegraph, reeling after an interrupt, etc.).
  // Deliberately does NOT preview upcoming damage / strikes — that's
  // for the player to discover via combat, not read off the UI.
  function computeEnemyStatus() {
    if (!state || !state.enemy || state.enemy.hp <= 0) return null;
    if (state.interruptedEnemy) {
      return { kind: "reel", label: "💢 REELING" };
    }
    if (state.enemyAimed) {
      return { kind: "killshot", label: "🎯 SIGHTED ON YOU" };
    }
    if (state.telegraphPending) {
      return { kind: "killshot", label: "🎯 LINED UP ON YOU" };
    }
    if (state.enemyBracing) {
      return { kind: "reload", label: "🛡 BRACED" };
    }
    // Generic 'status' slot: future effects (stunned, bleeding, etc.)
    // can push labels onto state.enemy.statusEffects and they'll show
    // here without more plumbing.
    const fx = state && state.enemy && state.enemy.statusEffects;
    if (Array.isArray(fx) && fx.length) {
      return { kind: "fx", label: fx.join(" · ") };
    }
    return null;
  }

  function renderEnemyStatus() {
    const host = document.getElementById("enemy-intent");
    if (!host) return;
    const st = computeEnemyStatus();
    if (!st) { host.hidden = true; return; }
    host.className = "enemy-intent intent-" + st.kind;
    host.textContent = st.label;
    host.hidden = false;
  }

  // Status chip in the combat slug — 'AIMED' when next shot is primed,
  // '⚠ TELEGRAPHED' when the enemy is winding up (player should read
  // and decide). Also toggles the Aim button's availability.
  function refreshCombatStatus() {
    const chip = document.getElementById("combat-status");
    if (chip) {
      if (state && state.telegraphPending) {
        chip.textContent = "⚠ TELEGRAPHED";
        chip.className = "combat-status telegraphed";
        chip.hidden = false;
      } else if (state && state.aimReady) {
        chip.textContent = "🎯 AIMED";
        chip.className = "combat-status aimed";
        chip.hidden = false;
      } else {
        chip.hidden = true;
      }
    }
    const aimBtn = document.getElementById("combat-btn-aim");
    if (aimBtn) {
      const s = Game.state;
      const canAim = !!(s && s.bestRanged && s.ammo > 0) && !(state && state.aimReady);
      aimBtn.disabled = !canAim;
      aimBtn.hidden = !(s && s.bestRanged);
    }
    renderEnemyStatus();
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
    refreshCombatStatus();
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
    // Melee and Brace used to lock out entirely at 0 stam, which meant a
    // gunless hero with nothing left could only flee — and flee against
    // a boss/fast enemy auto-damages you. Keep both actions available;
    // flag them as 'desperate' so the damage / defense resolution can
    // downgrade the effect instead of refusing the input.
    const desperateMelee = action === "melee" && s.stam <= 0;
    const desperateBrace = action === "brace" && s.stam <= 0;

    state.bracing = false;
    state.desperateBrace = false;

    if (action === "melee") {
      // Aim is a ranged sight-line — any melee swing breaks it.
      state.aimReady = false;
      if (!desperateMelee) s.stam -= 1;
      // Interrupt check: if the enemy is mid-telegraph, your swing is
      // a gamble. 60% catches him cold, bonus damage, his next turn
      // is skipped. 40% you whiff into the wind-up and he lands it.
      let interruptBonus = 0;
      let interrupted = false;
      if (state.telegraphPending) {
        if (Math.random() < 0.6) {
          interrupted = true;
          interruptBonus = 2;
          state.interruptedEnemy = true;
          state.telegraphPending = false;
        } else {
          // Whiff — log a line, eat the incoming hit at the usual +2.
          log(`You read him wrong — your swing goes wide.`, "info");
          Sound.play("dodge");
          spawnMark("miss");
          Sound.play("melee");
          refreshCombatStatus();
          if (!desperateMelee) s.stam -= 0;
          // Skip to enemy turn — damage resolution handled below.
          refreshHud();
          updateEnemyHp();
          setTimeout(enemyTurn, 600);
          return;
        }
      }
      // Desperate swing: low dice, crit impossible, no counter payoff.
      const base = desperateMelee ? rand(0, 2) : rand(1, 3);
      const weaponBonus = s.bestMelee ? s.bestMelee.bonus : 0;
      // Brace-dodge on the previous turn sets up a counter: guaranteed
      // crit and a flat damage bonus, consumed by this swing.
      const counter = !!state.counterReady && !desperateMelee;
      state.counterReady = false;
      const critChance = desperateMelee ? 0 : (counter ? 1 : (0.12 + noraCritBump()));
      const crit = Math.random() < critChance;
      const counterBonus = counter ? 3 : 0;
      const headshotBonus = crit ? (state.enemy.headshotBonus || 0) : 0;
      const meleeVulnerable = state.enemy.meleeVulnerable || 0;
      let dmg = base + weaponBonus + noraBonus() + counterBonus + interruptBonus + headshotBonus + meleeVulnerable;
      // Enemy braced its last turn? Halve this swing's impact.
      if (state.enemyBracing) { dmg = Math.max(1, Math.floor(dmg / 2)); state.enemyBracing = false; }
      const total = crit ? dmg + 2 : dmg;
      const weaponPhr = weaponPhrase(s.bestMelee ? s.bestMelee.name : "Crowbar");
      // Interrupts always land — you caught him setting up. Counter-
      // crits too. Otherwise smart human enemies dodge sometimes.
      const enemyDodge = (!crit && !counter && !interrupted) ? (state.enemy.dodge || 0) : 0;
      const dodged = Math.random() < enemyDodge;
      if (dodged) {
        log(`He twists away — ${weaponPhr} hits air.`, "info");
        Sound.play("dodge");
        spawnMark("miss");
      } else {
        state.enemy.hp -= total;
        const prefix = interrupted ? "You read the wind-up — " : (counter ? "Reading the lunge — " : "");
        let line;
        if (desperateMelee && total <= 0) {
          line = `You can barely lift your arm. ${weaponPhr} clips its jaw. No give.`;
        } else if (desperateMelee) {
          line = `Muscle memory carries you. ${weaponPhr} lands — ${total} damage.`;
        } else if (interrupted) {
          line = `${prefix}${weaponPhr} catches him mid-draw. ${total} damage.`;
        } else if (crit) {
          line = `${prefix}You drive ${weaponPhr} through its skull. CRITICAL ${total}.`;
        } else {
          line = `You swing — ${total} damage.`;
        }
        log(line, (crit || interrupted) ? "crit" : "hero");
        Sound.play((crit || interrupted) ? "crit" : "melee");
        floatDamage(total, (crit || interrupted) ? "crit" : null);
        hitFlash();
        spawnMark((crit || interrupted) ? "slashCrit" : "slash");
      }
      refreshCombatStatus();
    }
    else if (action === "shoot") {
      state.counterReady = false;
      s.ammo -= 1;
      Sound.play("gunshot");
      gunFlash();
      // Aimed shot — guaranteed crit, +3 damage. Consumes aimReady.
      const aimed = !!state.aimReady;
      state.aimReady = false;
      // Interrupt check against a telegraph — shots are faster than
      // swings, so the odds are better (75%). Whiff eats the big hit.
      let interrupted = false;
      if (state.telegraphPending) {
        if (Math.random() < 0.75) {
          interrupted = true;
          state.interruptedEnemy = true;
          state.telegraphPending = false;
        } else {
          log("Your shot snaps wide — he was half-turned and you read it wrong.", "info");
          spawnMark("miss");
          refreshCombatStatus();
          refreshHud();
          updateEnemyHp();
          setTimeout(enemyTurn, 600);
          return;
        }
      }
      // Aimed shots and interrupts always land. Otherwise the speed-2
      // enemies (bandits, runners) still have their miss roll, and
      // 'shaky' / 'panicked' states drop your accuracy further.
      let baseHit = state.enemy.speed === 2 ? 0.75 : 0.9;
      baseHit -= (state.enemy.shaky || 0);          // hard to shoot someone you knew
      if (state.playerPanicked) baseHit -= 0.25;    // runner bit scared you
      const hit = aimed || interrupted || Math.random() < Math.max(0.3, baseHit);
      state.playerPanicked = false; // consumed either way
      if (!hit) {
        log("The shot misses. The sound draws more attention.", "info");
        spawnMark("miss");
      } else {
        const baseRoll = state.enemy.human ? rand(3, 5) : rand(2, 4);
        const weaponBonus = s.bestRanged ? s.bestRanged.bonus : 0;
        const aimBonus = aimed ? 3 : 0;
        const interruptBonus = interrupted ? 2 : 0;
        // Aimed shots + interrupts = headshots. Big bonus on armoured
        // enemies (abomination, traitor). Otherwise small-arms resist
        // shaves some damage off the bullet.
        const headshot = (aimed || interrupted) ? (state.enemy.headshotBonus || 0) : 0;
        const armour = state.enemy.smallArmsResist || 0;
        let dmg = baseRoll + weaponBonus + noraBonus() + aimBonus + interruptBonus + headshot;
        dmg = Math.max(1, dmg - armour);
        if (state.enemyBracing) { dmg = Math.max(1, Math.floor(dmg / 2)); state.enemyBracing = false; }
        state.enemy.hp -= dmg;
        const weaponPhr = weaponPhrase(s.bestRanged ? s.bestRanged.name : "Handgun");
        let line;
        if (aimed) line = `The sight settles. ${weaponPhr} speaks once. CRITICAL ${dmg}.`;
        else if (interrupted) line = `You catch him mid-draw — ${weaponPhr} puts him on the ground. ${dmg} damage.`;
        else line = `You fire ${weaponPhr} — ${dmg} damage.`;
        log(line, (aimed || interrupted) ? "crit" : "hero");
        floatDamage(dmg, (aimed || interrupted) ? "crit" : null);
        hitFlash();
        spawnMark((aimed || interrupted) ? "slashCrit" : "hit");
      }
      refreshCombatStatus();
    }
    else if (action === "aim") {
      // No damage this turn. Skip your defense, line up the shot.
      // Next fire is a guaranteed crit for +3 damage. Any non-fire
      // action breaks the sight line.
      if (!s.bestRanged) { Game.toast("No firearm"); Sound.play("drySnap"); return; }
      if (s.ammo <= 0)   { Game.toast("No shot to aim"); Sound.play("drySnap"); return; }
      state.counterReady = false;
      state.aimReady = true;
      // Aim shouldn't clear an active telegraph — you're sighting,
      // not reacting. But the wind-up will still land as a big hit.
      log("You drop to a knee and line up the shot. Steady.", "info");
      Sound.play("brace");
      refreshCombatStatus();
    }
    else if (action === "brace") {
      state.aimReady = false;
      state.counterReady = false;
      if (!desperateBrace) s.stam -= 1;
      state.bracing = true;
      // Desperate brace: stay standing, absorb but no counter-setup.
      // The damage math in enemyTurn reads state.desperateBrace to
      // halve the absorb + skip counterReady on a dodge.
      state.desperateBrace = desperateBrace;
      log(desperateBrace
        ? "You're out of good options. You put yourself between it and nothing else."
        : "You plant your feet.",
        "info");
      Sound.play("brace");
    }
    else if (action === "flee") {
      state.aimReady = false;
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

    // Passive stamina regen inside combat: if your action didn't cost
    // stam (shoot / aim / flee / pass), you catch a breath. Capped at
    // stamMax. Makes long fights survivable without making brace free.
    const breathingActions = new Set(["shoot", "aim", "flee"]);
    if (breathingActions.has(action) && s.stam < s.stamMax) {
      s.stam = Math.min(s.stamMax, s.stam + 1);
    }

    refreshHud();
    updateEnemyHp();
    checkEngagementFlip();

    if (state.enemy.hp <= 0) {
      log(`${state.enemy.name} falls.`, "crit");
      finishOrAdvance();
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

    // Interrupt payoff — player caught the enemy mid-wind-up last
    // turn. He loses this turn entirely.
    if (state.interruptedEnemy) {
      state.interruptedEnemy = false;
      state.telegraphPending = false;
      log(`${e.name} reels from the blow — no shot from him this turn.`, "info");
      Sound.play("brace");
      refreshCombatStatus();
      companionTurn();
      state.turn += 1;
      renderAllies();
      return;
    }

    // Telegraph turn — smart humans wind up. If the enemy can also
    // aim and brace (bandit_pair), pick randomly between: telegraph
    // a kill shot, line up an aimed shot (next hit auto-crit, +3
    // damage), or brace behind cover (halves player damage next
    // turn, no attack either).
    if (e.telegraphEvery && !state.telegraphPending && !state.enemyAimed && !state.enemyBracing
        && state.turn > 0 && (state.turn % e.telegraphEvery === 0)
        && (!state.engagementFlipAt || e.hp > state.engagementFlipAt)) {
      const opts = ["telegraph"];
      if (e.enemyCanAim) opts.push("aim");
      if (e.enemyCanBrace) opts.push("brace");
      const pick = opts[Math.floor(Math.random() * opts.length)];
      if (pick === "aim") {
        state.enemyAimed = true;
        log(`${e.name} drops into cover and lines up the shot. Sight picture locked.`, "warn");
      } else if (pick === "brace") {
        state.enemyBracing = true;
        log(`${e.name} pulls into cover. They're playing it safe this turn.`, "info");
      } else {
        state.telegraphPending = true;
        log(`${e.name} steadies — lining up the kill shot.`, "warn");
      }
      Sound.play("tense");
      refreshCombatStatus();
      companionTurn();
      state.turn += 1;
      renderAllies();
      return;
    }

    // Tactical reposition. Smart humans pull back to cover every few
    // turns — they don't attack and you don't get hit, but the fight
    // drags. Only fires when the enemy is still healthy enough to be
    // cautious (above the engagement flip threshold).
    if (e.repositionEvery && state.turn > 0 && (state.turn % e.repositionEvery === 0)
        && (!state.engagementFlipAt || e.hp > state.engagementFlipAt)) {
      log(`They pull back behind cover to reload. No shot from them this turn.`, "info");
      Sound.play("brace");
      companionTurn();
      state.turn += 1;
      renderAllies();
      return;
    }

    let dmg = rand(e.atk[0], e.atk[1]);
    // Rare savage hit — ignores 1 of brace.
    let savage = Math.random() < 0.12;
    if (savage) dmg += 2;
    // Enemy lined up the shot last turn — auto-savage, +3 damage.
    if (state.enemyAimed) { dmg += 3; savage = true; }
    // Cross-fire: while an ally is still tied up with their own
    // enemy, that enemy is also taking shots at the player through
    // the gaps. +1 damage per hostile turn until the ally wins.
    if (state.allyEnemy && state.allyEnemy.hp > 0) dmg += 1;
    // Telegraphed shot lands this turn — the player didn't interrupt.
    // +2 extra damage on top of everything else.
    const telegraphLanding = state.telegraphPending;
    if (telegraphLanding) dmg += 2;

    // Brace absorbs more now: -3 normal, -2 on savage. Desperate brace
    // (stam was 0) still absorbs something but only half as much.
    const desperate = state.bracing && state.desperateBrace;
    if (state.bracing) {
      const absorb = desperate
        ? (savage ? 1 : 2)
        : (savage ? 2 : 3);
      dmg = Math.max(0, dmg - absorb);
    }

    // Misses are rare; you get hit. Maya teaches you to slip hits —
    // her dodge bonus is subtracted from the enemy's hit chance, with
    // a floor so the fight still matters. Brace also adds a flat
    // dodge bump for the turn you plant your feet (reduced when
    // desperate).
    // Bloater-style 'heavySwing' enemies are slow — you dodge more.
    const baseHit = e.human ? 0.82 : (e.heavySwing ? 0.7 : 0.92);
    const braceDodge = state.bracing ? (desperate ? 0.12 : 0.25) : 0;
    const hitChance = Math.max(0.3, baseHit - mayaDodge() - braceDodge);
    const hit = Math.random() < hitChance;
    if (!hit) {
      // Brace-dodge sets up a counter: your next melee is a guaranteed
      // crit with a flat damage bonus. Desperate brace doesn't arm it.
      if (state.bracing && !desperate) state.counterReady = true;
      const line = state.bracing
        ? (desperate
            ? `You put yourself where it's going — the ${e.name} skims off your shoulder.`
            : `You plant your feet — the ${e.name} skims off your guard. Counter ready.`)
        : mayaPresent() && Math.random() < 0.5
          ? `Maya's shout — you slip the ${e.name}'s lunge.`
          : `${e.name} lunges — you twist away.`;
      log(line, "info");
      Sound.play("dodge");
    } else if (dmg === 0) {
      // Full absorb through brace also opens a counter — you weathered it.
      // Desperate version doesn't arm the counter either.
      if (state.bracing && !desperate) state.counterReady = true;
      log(state.bracing
        ? (desperate
            ? `${e.name} hits — your guard swallows it.`
            : `${e.name} hits — your guard swallows it. Counter ready.`)
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
        // Panic: a successful bite / shot can rattle your next attack.
        // Runners especially — they get in your head.
        if (e.panic && Math.random() < e.panic) {
          state.playerPanicked = true;
          log("You pull back, breath tight — your next shot is going to be shaky.", "info");
        }
      }
    }

    refreshHud();

    if (s.hp <= 0) {
      log("You collapse.", "crit");
      Sound.play("death");
      setTimeout(() => end("lose"), 900);
      return;
    }

    // Close pending windows after the hostile turn.
    state.telegraphPending = false;
    state.enemyAimed = false;
    refreshCombatStatus();

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

  // Ally's parallel fight — she chips her own enemy's HP down each
  // player action. When it hits zero, she's actually killed her
  // fighter and rejoins the assist rotation. Called from act() after
  // the player's action resolves.
  function tickAllyFight() {
    if (!state || !state.allyEnemy || state.allyEnemy.hp <= 0) return;
    const ae = state.allyEnemy;
    const key = ae.allyKey;
    // Ally damage per tick scales with romance / bonds. Maya is ex-
    // military so she deals clean damage; Ren is a medic and was
    // never in the game as an engagement-partner, but if she's ever
    // wired, she'd tick less (2-3).
    const s = Game.state;
    let tick;
    if (key === "maya") {
      const bump = (s.flags && s.flags.lovedMaya) ? 1 : 0;
      tick = rand(2, 4) + bump;
    } else if (key === "ren") {
      tick = rand(1, 3);
    } else if (key === "vega") {
      tick = rand(3, 4);
    } else {
      tick = rand(2, 3);
    }
    ae.hp = Math.max(0, ae.hp - tick);
    const niceName = key === "maya" ? "Maya" : key === "ren" ? "Ren" : key === "vega" ? "Vega" : key;
    log(`${niceName} trades shots with hers — ${tick} damage. (${ae.name}: ${ae.hp}/${ae.maxHp})`, "ally");
    renderAllies();
    if (ae.hp <= 0) {
      state.allyEnemy = null;
      if (state.engaged) state.engaged[key] = false;
      // Grace cooldown — don't fire on the same tick she closes out.
      if (key === "maya") state.mayaCd = Math.max(state.mayaCd || 0, 1);
      if (key === "ren")  state.renCd  = Math.max(state.renCd  || 0, 1);
      if (key === "vega") state.vegaCd = Math.max(state.vegaCd || 0, 1);
      log(`${niceName} drops hers — swings back to yours.`, "crit");
      renderAllies();
    }
  }

  // Legacy shim — old code paths call checkEngagementFlip. Route to
  // the new ally-fight tick.
  function checkEngagementFlip() { tickAllyFight(); }

  // ---------- companion turn ----------
  function companionTurn() {
    const s = Game.state;
    if (!state || state.enemy.hp <= 0) return;

    if (mayaPresent() && !(state.engaged && state.engaged.maya)) {
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
          finishOrAdvance();
          return;
        }
      }
    }

    if (renPresent() && !(state.engaged && state.engaged.ren)) {
      state.renCd = (state.renCd || 0) - 1;
      // Heal amount + cooldown both scale with bond / love.
      const heal = renHealAmount();
      const cd   = renHealCooldown();
      // Only actually spend the heal when it's worth spending:
      //   - hero below 60% (things are getting dicey), OR
      //   - hero low enough that the heal won't mostly overflow.
      const lowHp = s.hp <= Math.floor(s.hpMax * 0.6);
      const fullBenefit = s.hp <= s.hpMax - heal;
      const shouldHeal = state.renCd <= 0 && (lowHp || fullBenefit);
      if (shouldHeal) {
        s.hp = Math.min(s.hpMax, s.hp + heal);
        log(`Ren patches you — +${heal} HP.`, "ally");
        Sound.play("heal");
        floatDamage(heal, "heal");
        refreshHud();
        state.renCd = cd;
        flashAlly("ren");
      } else if (state.renCd < 0) {
        // Ready but not needed — hold, don't drift into deep negatives.
        state.renCd = 0;
      }
    }

    if (vegaPresent() && !(state.engaged && state.engaged.vega)) {
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
          finishOrAdvance();
          return;
        }
      }
    }

    if (noraPresent() && !(state.engaged && state.engaged.nora)) {
      state.noraCd = (state.noraCd || 0) - 1;
      // Hold the warning until you actually need it: she pipes up once
      // the fight turns (hero below ~60%) OR the enemy is still healthy
      // enough to keep hitting hard. Otherwise she keeps watching.
      const lowHp = s.hp <= Math.floor(s.hpMax * 0.6);
      const fightStillDangerous = state.enemy.hp > 5;
      const shouldWarn = state.noraCd <= 0 && !state.noraWarn
        && (lowHp || (state.turn >= 2 && fightStillDangerous));
      if (shouldWarn) {
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
      } else if (state.noraCd < 0) {
        state.noraCd = 0;
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

  // ---------- horde waves ----------
  // Pop the next enemy off the wave queue and re-seat state.enemy
  // without tearing down the combat screen. Also does a small breather
  // restore (+1 HP, +1 stam) so the fight stays human over 10 rounds.
  function advanceToNextWave() {
    if (!state || !state.waveQueue || !state.waveQueue.length) return false;
    const nextType = state.waveQueue.shift();
    const def = ENEMIES[nextType];
    if (!def) return false;
    const hp = def.hp;
    state.enemy = { ...def, hp, maxHp: hp, atk: def.atk };
    state.enemyId = nextType;
    state.waveIndex += 1;
    // Per-enemy flags reset — each new fighter starts fresh.
    state.telegraphPending = false;
    state.enemyAimed = false;
    state.enemyBracing = false;
    state.interruptedEnemy = false;
    state.bracing = false;
    state.counterReady = false;
    state.turn = 0;
    // Breather: small restore between waves. Crucial — without it you
    // get whittled down over 10 enemies and there's no answer.
    const s = Game.state;
    if (s.hp < s.hpMax)   s.hp   = Math.min(s.hpMax,   s.hp   + 1);
    if (s.stam < s.stamMax) s.stam = Math.min(s.stamMax, s.stam + 1);
    log(`Wave ${state.waveIndex} / ${state.totalWaves} — ${state.enemy.name} steps into the gap.`, "warn");
    document.getElementById("enemy-art").textContent = state.enemy.art;
    document.getElementById("enemy-name").textContent = state.enemy.name;
    const descEl = document.getElementById("enemy-desc");
    if (descEl) descEl.textContent = state.enemy.desc || "";
    const chEl = document.getElementById("combat-chapter");
    if (chEl) chEl.textContent = state.totalWaves > 1
      ? `WAVE ${state.waveIndex} / ${state.totalWaves}`
      : "CONTACT";
    refreshHud();
    updateEnemyHp();
    refreshCombatStatus();
    renderAllies();
    return true;
  }

  // Shared finisher — every spot that used to call end("win") now
  // goes through here. If there are more waves, advances; otherwise
  // plays the victory sting and exits combat.
  function finishOrAdvance() {
    applyLoot(state.enemyId);
    if (state.waveQueue && state.waveQueue.length > 0) {
      setTimeout(() => advanceToNextWave(), 950);
      return;
    }
    Sound.play("victory");
    setTimeout(() => end("win"), 950);
  }

  // Player spent their turn using a stam item from inventory. No
  // damage dealt, no aim line kept — hand to the enemy.
  function consumeItemTurn(item) {
    if (!state || state.enemy.hp <= 0) return;
    state.aimReady = false;
    state.counterReady = false;
    const itemName = item && item.name ? item.name.replace(/^[^\w]+\s*/, "") : "a breath";
    log(`You take a second for ${itemName}.`, "info");
    refreshHud();
    setTimeout(enemyTurn, 600);
  }

  return {
    start, act, throwGrenade, consumeItemTurn,
    // Is a combat instance currently active? Used by the inventory
    // modal's grenade-Use button to gate the throw.
    isActive: () => !!(state && state.enemy && state.enemy.hp > 0),
  };
})();
