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
      startMs: Date.now(),
    };

    const combatScreen = document.getElementById("combat-screen");
    document.getElementById("game-screen").classList.add("hidden");
    combatScreen.classList.remove("hidden");

    // Use the currently-rendered scene image as the combat backdrop.
    const scnImg = document.querySelector("#scene-art .scene-image");
    combatScreen.style.setProperty(
      "--combat-backdrop",
      scnImg && scnImg.src ? `url("${scnImg.src}")` : "none"
    );

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
    document.getElementById("c-hp").textContent = s.hp;
    document.getElementById("c-hpmax").textContent = s.hpMax;
    document.getElementById("c-stam").textContent = s.stam;
    document.getElementById("c-ammo").textContent = s.ammo;
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
      floatDamage(total, crit ? "crit" : null);
      hitFlash();
      spawnMark(crit ? "slashCrit" : "slash");
    }
    else if (action === "shoot") {
      s.ammo -= 1;
      Sound.play("gunshot");
      const hit = Math.random() < (state.enemy.speed === 2 ? 0.75 : 0.9);
      if (!hit) {
        log("The shot misses. The sound draws more attention.", "info");
        spawnMark("miss");
      } else {
        const dmg = state.enemy.human ? rand(3, 5) : rand(2, 4);
        state.enemy.hp -= dmg;
        log(`You fire — ${dmg} damage.`, "hero");
        floatDamage(dmg);
        hitFlash();
        spawnMark("hit");
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
      setTimeout(() => end("win"), 950);
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
      spawnMark("block");
    } else {
      s.hp -= dmg;
      const line = savage
        ? `${e.name} catches you — ${dmg} damage.`
        : `${e.name} strikes — ${dmg} damage.`;
      log(line, savage ? "crit" : "enemy");
      Sound.play(savage ? "crit" : "damage");
      spawnMark("enemyHit");
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
        const dmg = state.enemy.human ? rand(3, 4) : rand(2, 3);
        state.enemy.hp -= dmg;
        log(`Maya fires from cover — ${dmg} damage.`, "ally");
        Sound.play("gunshot");
        spawnMark("hit");
        floatDamage(dmg);
        hitFlash();
        updateEnemyHp();
        state.mayaCd = 3;
        if (state.enemy.hp <= 0) {
          log(`${state.enemy.name} falls.`, "crit");
          Sound.play("victory");
              setTimeout(() => end("win"), 950);
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
        floatDamage(1, "heal");
        refreshHud();
        state.renCd = 4;
      } else if (state.renCd <= 0) {
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
