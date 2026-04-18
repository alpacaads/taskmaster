// Combat engine for Dead Light
window.Combat = (function () {

  const ENEMIES = {
    walker:       { name: "Walker",         art: "🧟",    hp: 4,  atk: [1, 2], speed: 1, desc: "Slow. Hungry. Relentless." },
    walker_cho:   { name: "Mrs. Cho",       art: "🧟‍♀️", hp: 3,  atk: [1, 2], speed: 1, desc: "She used to feed your cat." },
    walker_pair:  { name: "Two Walkers",    art: "🧟🧟", hp: 7,  atk: [1, 3], speed: 1, desc: "They move together.", pack: true },
    runner:       { name: "Runner",         art: "🧟‍♂️", hp: 3,  atk: [2, 3], speed: 2, desc: "Fresh. Fast. Furious." },
    bloater:      { name: "Bloater",        art: "🧟💀",  hp: 8,  atk: [2, 4], speed: 1, desc: "A swollen, leaking thing." },
    bandit:       { name: "Bandit",         art: "🧔🔫",  hp: 5,  atk: [2, 3], speed: 2, desc: "Smart. Armed. Desperate.", human: true },
    horde:        { name: "The Horde",      art: "🧟🧟🧟", hp: 14, atk: [2, 4], speed: 1, desc: "A tide of the dead." },
  };

  let state = null;

  function start(config) {
    const def = ENEMIES[config.enemy];
    if (!def) { console.error("Unknown enemy", config.enemy); return; }

    state = {
      enemy: { ...def, maxHp: def.hp, hp: def.hp },
      onWin: config.onWin,
      onLose: config.onLose,
      turn: 0,
      bracing: false,
    };

    document.getElementById("game-screen").classList.add("hidden");
    document.getElementById("combat-screen").classList.remove("hidden");

    document.getElementById("enemy-art").textContent = state.enemy.art;
    document.getElementById("enemy-name").textContent = state.enemy.name;

    const logEl = document.getElementById("combat-log");
    logEl.innerHTML = "";
    log(state.enemy.desc, "info");

    // Combat opening sound per enemy type
    if (config.enemy === "horde") Sound.play("hordeRoar");
    else if (config.enemy === "runner") Sound.play("runnerScream");
    else if (config.enemy === "bandit") Sound.play("drySnap");
    else Sound.play("groan");

    refreshHud();
    updateEnemyHp();
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
      log("You raise your guard.", "info");
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
      setTimeout(() => end("win"), 900);
      return;
    }

    // Enemy turn
    setTimeout(enemyTurn, 700);
  }

  function hitFlash() {
    const art = document.getElementById("enemy-art");
    art.classList.remove("hit");
    void art.offsetWidth;
    art.classList.add("hit");
  }

  function enemyTurn() {
    if (!state) return;
    const s = Game.state;
    const e = state.enemy;
    let dmg = rand(e.atk[0], e.atk[1]);
    if (state.bracing) dmg = Math.max(0, dmg - 2);

    const hit = Math.random() < (e.human ? 0.7 : 0.85);
    if (!hit) {
      log(`${e.name} lunges — you dodge.`, "info");
      Sound.play("dodge");
    } else {
      s.hp -= dmg;
      log(state.bracing
        ? `${e.name} strikes — you absorb most of it. ${dmg} damage.`
        : `${e.name} strikes — ${dmg} damage.`,
        "enemy");
      Sound.play(state.bracing ? "brace" : "damage");
    }

    refreshHud();

    if (s.hp <= 0) {
      log("You collapse.", "crit");
      Sound.play("death");
      setTimeout(() => end("lose"), 900);
    }
  }

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
