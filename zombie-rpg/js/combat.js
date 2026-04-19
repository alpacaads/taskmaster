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
        `MAYA ` + (ready ? "— NEXT SHOT" : `— ${state.mayaCd}`) +
        `</span>`);
    }
    if (renPresent()) {
      const ready = state.renCd <= 0;
      chips.push(`<span class="ally-chip ${ready ? "ready" : ""}">` +
        `REN ` + (ready ? "— TRIAGE" : `— ${state.renCd}`) +
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
      const crit = Math.random() < 0.12;
      const total = crit ? dmg + 2 : dmg;
      state.enemy.hp -= total;
      log(crit
        ? `You drive the crowbar through its skull. CRITICAL ${total}.`
        : `You swing — ${total} damage.`,
        crit ? "crit" : "hero");
      Sound.play(crit ? "crit" : "melee");
      hitFlash();
    }
    else if (action === "shoot") {
      s.ammo -= 1;
      Sound.play("gunshot");
      const hit = Math.random() < (state.enemy.speed === 2 ? 0.75 : 0.9);
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
      log("You plant your feet.", "info");
      Sound.play("brace");
    }
    else if (action === "flee") {
      Sound.play("flee");
      if (state.enemy.speed >= 2 || state.enemy.pack) {
        log("No ground to give. It's on you.", "info");
      } else {
        const fled = Math.random() < 0.55;
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
      setTimeout(() => end("win"), 900);
      return;
    }

    setTimeout(enemyTurn, 600);
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
    let dmg = rand(e.atk[0], e.atk[1]);
    // Rare savage hit — ignores 1 of brace.
    const savage = Math.random() < 0.12;
    if (savage) dmg += 2;

    if (state.bracing) dmg = Math.max(0, dmg - (savage ? 1 : 2));

    // Misses are rare; you get hit.
    const hit = Math.random() < (e.human ? 0.82 : 0.92);
    if (!hit) {
      log(`${e.name} lunges — you twist away.`, "info");
      Sound.play("dodge");
    } else if (dmg === 0) {
      log(`${e.name} hits — you absorb it.`, "ally");
      Sound.play("brace");
    } else {
      s.hp -= dmg;
      const line = savage
        ? `${e.name} catches you — ${dmg} damage.`
        : `${e.name} strikes — ${dmg} damage.`;
      log(line, savage ? "crit" : "enemy");
      Sound.play(savage ? "crit" : "damage");
      screenShake();
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
    void el.offsetWidth;
    el.classList.add("shake");
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
        state.renCd = 1; // keep her ready; don't waste the tick
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
