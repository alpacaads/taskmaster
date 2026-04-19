// Combat engine for Dead Light
//
// Upgrades over the original button-mash loop:
//   - Enemies telegraph their next attack (heavy / light / ranged / swarm)
//     so the player can react. The telegraph shows above the enemy's HP bar.
//   - Brace is now matchup-dependent: fully blocks a HEAVY wind-up, partially
//     mitigates LIGHT / RANGED, minimal against SWARM. Rewards reading.
//   - Companions fight alongside you: Maya fires every 3 turns, Ren heals
//     every 4 turns. Uses the existing companion / missionPartner flags.
window.Combat = (function () {

  // Each enemy has a pool of attack kinds it picks from each turn.
  //   heavy   - slow, big, signposted; BRACE fully blocks
  //   light   - quick swipe; BRACE softens (-1)
  //   ranged  - firearm; BRACE softens (-1)
  //   swarm   - wave of bodies; BRACE barely helps (-1 from a bigger hit)
  const ENEMIES = {
    walker:       { name: "Walker",      art: "🧟",    hp: 4,  atk: [1, 2], speed: 1, desc: "Slow. Hungry. Relentless.",  kinds: ["heavy", "heavy", "light"] },
    walker_cho:   { name: "Mrs. Cho",    art: "🧟‍♀️", hp: 3,  atk: [1, 2], speed: 1, desc: "She used to feed your cat.", kinds: ["heavy", "light"] },
    walker_pair:  { name: "Two Walkers", art: "🧟🧟",  hp: 7,  atk: [1, 3], speed: 1, desc: "They move together.",         kinds: ["heavy", "light", "light"], pack: true },
    runner:       { name: "Runner",      art: "🧟‍♂️", hp: 3,  atk: [2, 3], speed: 2, desc: "Fresh. Fast. Furious.",       kinds: ["light", "light", "heavy"] },
    bloater:      { name: "Bloater",     art: "🧟💀",  hp: 8,  atk: [2, 4], speed: 1, desc: "A swollen, leaking thing.",   kinds: ["heavy"] },
    bandit:       { name: "Bandit",      art: "🧔🔫",  hp: 5,  atk: [2, 3], speed: 2, desc: "Smart. Armed. Desperate.",    kinds: ["ranged", "ranged", "light"], human: true },
    horde:        { name: "The Horde",   art: "🧟🧟🧟", hp: 14, atk: [2, 4], speed: 1, desc: "A tide of the dead.",         kinds: ["swarm", "swarm", "heavy"] },
  };

  // Flavour per telegraphed kind. One string picked at random per turn.
  const TELEGRAPH_COPY = {
    heavy:  { icon: "💢", lines: ["winding up — big hit", "rearing back to bite", "charging"] },
    light:  { icon: "⚡", lines: ["quick swipe incoming", "teeth snapping", "claw coming in"] },
    ranged: { icon: "🎯", lines: ["taking aim", "drawing a bead", "reloading"] },
    swarm:  { icon: "🌊", lines: ["the wave is cresting", "bodies piling in", "surging forward"] },
  };

  let state = null;

  // ---------- companion helpers ----------
  function mayaPresent() {
    const s = Game.state;
    return s.companion === "Maya" || (s.flags && s.flags.missionPartner === "maya");
  }
  function renPresent() {
    const s = Game.state;
    return s.flags && s.flags.missionPartner === "ren";
  }
  function renderAllies() {
    const wrap = document.getElementById("combat-allies");
    if (!wrap) return;
    const chips = [];
    if (mayaPresent()) {
      const ready = state.mayaCd <= 0;
      chips.push(`<span class="ally-chip ${ready ? "ready" : ""}">` +
        `<span class="ally-dot"></span>🧍‍♀️ Maya ` +
        (ready ? "— firing next" : `— ${state.mayaCd} turn${state.mayaCd === 1 ? "" : "s"}`) +
        `</span>`);
    }
    if (renPresent()) {
      const ready = state.renCd <= 0;
      chips.push(`<span class="ally-chip ${ready ? "ready" : ""}">` +
        `<span class="ally-dot"></span>🩹 Ren ` +
        (ready ? "— patching next" : `— ${state.renCd} turn${state.renCd === 1 ? "" : "s"}`) +
        `</span>`);
    }
    wrap.innerHTML = chips.join("");
  }

  // ---------- lifecycle ----------
  function start(config) {
    const def = ENEMIES[config.enemy];
    if (!def) { console.error("Unknown enemy", config.enemy); return; }

    state = {
      enemy: { ...def, maxHp: def.hp, hp: def.hp },
      onWin: config.onWin,
      onLose: config.onLose,
      turn: 0,
      bracing: false,
      nextAttack: pickKind(def),
      // Start companions slightly pre-charged so they contribute early.
      mayaCd: 1,
      renCd:  2,
    };

    document.getElementById("game-screen").classList.add("hidden");
    document.getElementById("combat-screen").classList.remove("hidden");

    document.getElementById("enemy-art").textContent = state.enemy.art;
    document.getElementById("enemy-name").textContent = state.enemy.name;

    const logEl = document.getElementById("combat-log");
    logEl.innerHTML = "";
    log(state.enemy.desc, "info");

    if (config.enemy === "horde") Sound.play("hordeRoar");
    else if (config.enemy === "runner") Sound.play("runnerScream");
    else if (config.enemy === "bandit") Sound.play("drySnap");
    else Sound.play("groan");

    refreshHud();
    updateEnemyHp();
    showTelegraph();
    renderAllies();
  }

  function log(msg, cls) {
    const logEl = document.getElementById("combat-log");
    const line = document.createElement("div");
    line.className = "line " + (cls || "");
    line.textContent = msg;
    logEl.appendChild(line);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function refreshHud() {
    const s = Game.state;
    document.getElementById("c-hp").textContent = s.hp;
    document.getElementById("c-hpmax").textContent = s.hpMax;
    document.getElementById("c-stam").textContent = s.stam;
    document.getElementById("c-ammo").textContent = s.ammo;
  }

  function updateEnemyHp() {
    const pct = Math.max(0, (state.enemy.hp / state.enemy.maxHp) * 100);
    document.getElementById("enemy-hp-fill").style.width = pct + "%";
  }

  function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function pickKind(def) { return pick(def.kinds || ["heavy"]); }

  function showTelegraph() {
    const el = document.getElementById("enemy-telegraph");
    if (!el) return;
    if (!state || state.enemy.hp <= 0) { el.hidden = true; return; }
    const meta = TELEGRAPH_COPY[state.nextAttack] || TELEGRAPH_COPY.heavy;
    el.className = "enemy-telegraph kind-" + state.nextAttack;
    el.hidden = false;
    document.getElementById("telegraph-icon").textContent = meta.icon;
    document.getElementById("telegraph-text").textContent = pick(meta.lines).toUpperCase();
  }

  // ---------- player turn ----------
  function act(action) {
    if (!state) return;
    const s = Game.state;

    if (action === "shoot" && s.ammo <= 0) { Game.toast("Out of ammo"); Sound.play("drySnap"); return; }
    if (action === "melee" && s.stam <= 0) { Game.toast("Too exhausted"); Sound.play("back"); return; }
    if (action === "brace" && s.stam <= 0) { Game.toast("Too exhausted"); Sound.play("back"); return; }

    state.bracing = false;

    if (action === "melee") {
      s.stam -= 1;
      const dmg = rand(1, 3);
      const crit = Math.random() < 0.15;
      const total = crit ? dmg + 2 : dmg;
      state.enemy.hp -= total;
      log(crit
        ? `You drive the crowbar through its skull. CRITICAL ${total}!`
        : `You swing — ${total} damage.`,
        crit ? "crit" : "hero");
      Sound.play(crit ? "crit" : "melee");
      hitFlash();
    }
    else if (action === "shoot") {
      s.ammo -= 1;
      Sound.play("gunshot");
      const hit = Math.random() < (state.enemy.speed === 2 ? 0.7 : 0.9);
      if (!hit) {
        log("The shot misses. The sound draws more attention.", "info");
      } else {
        const dmg = state.enemy.human ? rand(3, 5) : rand(2, 4);
        state.enemy.hp -= dmg;
        log(`You fire — ${dmg} damage.`, "hero");
        hitFlash();
      }
    }
    else if (action === "brace") {
      s.stam -= 1;
      state.bracing = true;
      const flavour = {
        heavy:  "You set your stance. Let it come.",
        light:  "You raise your guard — partial cover.",
        ranged: "You tuck behind cover.",
        swarm:  "You plant your feet. It won't be enough.",
      }[state.nextAttack] || "You raise your guard.";
      log(flavour, "info");
      Sound.play("brace");
    }
    else if (action === "flee") {
      Sound.play("flee");
      if (state.enemy.speed >= 2 || state.enemy.pack) {
        log("You can't outrun it. It's on you.", "info");
      } else {
        const fled = Math.random() < 0.6;
        if (fled) {
          log("You break away into the dark. Safe.", "info");
          setTimeout(() => end("flee"), 700);
          return;
        }
        log("You stumble. It closes the distance.", "info");
      }
    }

    refreshHud();
    updateEnemyHp();

    if (state.enemy.hp <= 0) {
      log(`${state.enemy.name} falls.`, "crit");
      Sound.play("victory");
      document.getElementById("enemy-telegraph").hidden = true;
      setTimeout(() => end("win"), 900);
      return;
    }

    setTimeout(enemyTurn, 700);
  }

  function hitFlash() {
    const art = document.getElementById("enemy-art");
    art.classList.remove("hit");
    void art.offsetWidth;
    art.classList.add("hit");
  }

  // ---------- enemy turn ----------
  function enemyTurn() {
    if (!state) return;
    const s = Game.state;
    const e = state.enemy;
    const kind = state.nextAttack;
    let dmg = rand(e.atk[0], e.atk[1]);
    // Kind shapes damage slightly so the telegraph carries weight.
    if (kind === "heavy") dmg += 1;
    if (kind === "swarm") dmg += 1;
    if (kind === "light") dmg = Math.max(1, dmg - 1);

    // Brace mitigation by kind.
    let braceNote = "";
    if (state.bracing) {
      if (kind === "heavy") { dmg = 0; braceNote = " Your brace absorbs it."; }
      else if (kind === "light" || kind === "ranged") { dmg = Math.max(0, dmg - 1); braceNote = " Your guard softens it."; }
      else if (kind === "swarm") { dmg = Math.max(0, dmg - 1); braceNote = " You weather the first wave."; }
    }

    const hit = kind === "ranged"
      ? Math.random() < (e.human ? 0.7 : 0.85)
      : true; // melee/swarm always connect (mitigation comes from Brace)
    if (!hit) {
      log(`${e.name} misses — you duck the shot.`, "info");
      Sound.play("dodge");
    } else if (dmg === 0) {
      log(`${e.name} hits — you absorb it completely.${braceNote}`, "ally");
      Sound.play("brace");
    } else {
      s.hp -= dmg;
      const verb = kind === "ranged" ? "fires" : kind === "swarm" ? "crashes in" : "strikes";
      log(`${e.name} ${verb} — ${dmg} damage.${braceNote}`, "enemy");
      Sound.play(state.bracing ? "brace" : "damage");
    }

    refreshHud();

    if (s.hp <= 0) {
      log("You collapse.", "crit");
      Sound.play("death");
      document.getElementById("enemy-telegraph").hidden = true;
      setTimeout(() => end("lose"), 900);
      return;
    }

    // Companion support — ticks after enemy's hit lands.
    companionTurn();

    // Pick the next telegraphed attack for the following round.
    state.turn += 1;
    state.nextAttack = pickKind(e);
    showTelegraph();
    renderAllies();
  }

  // ---------- companion turn ----------
  function companionTurn() {
    const s = Game.state;
    if (!state || state.enemy.hp <= 0) return;

    if (mayaPresent()) {
      state.mayaCd = (state.mayaCd || 0) - 1;
      if (state.mayaCd <= 0) {
        const dmg = state.enemy.human ? rand(3, 4) : rand(2, 3);
        state.enemy.hp -= dmg;
        log(`Maya fires from cover — ${dmg} damage.`, "ally");
        Sound.play("gunshot");
        hitFlash();
        updateEnemyHp();
        state.mayaCd = 3;
        if (state.enemy.hp <= 0) {
          log(`${state.enemy.name} falls.`, "crit");
          Sound.play("victory");
          document.getElementById("enemy-telegraph").hidden = true;
          setTimeout(() => end("win"), 900);
          return;
        }
      }
    }

    if (renPresent()) {
      state.renCd = (state.renCd || 0) - 1;
      if (state.renCd <= 0 && s.hp < s.hpMax) {
        s.hp = Math.min(s.hpMax, s.hp + 1);
        log("Ren patches a cut — +1 HP.", "ally");
        Sound.play("heal");
        refreshHud();
        state.renCd = 4;
      } else if (state.renCd <= 0) {
        // No healing needed; keep her ready rather than wasting the tick.
        state.renCd = 1;
      }
    }
  }

  // ---------- end ----------
  function end(result) {
    const cfg = state;
    state = null;
    document.getElementById("combat-screen").classList.add("hidden");
    document.getElementById("game-screen").classList.remove("hidden");

    if (result === "win" || result === "flee") {
      Game.goto(cfg.onWin);
    } else {
      Game.goto(cfg.onLose);
    }
  }

  return { start, act };
})();
