// Procedural sound engine for Dead Light.
// Uses Web Audio API — no external assets, works offline.
// Must be "unlocked" by a user gesture; first Sound.play() call does that.
window.Sound = (function () {

  const MUTE_KEY = "dead_light_muted_v1";
  let ctx = null;
  let master = null;
  let muted = localStorage.getItem(MUTE_KEY) === "1";
  let ambientNodes = [];
  let ambientScene = null;

  function init() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.55;
    master.connect(ctx.destination);
  }

  function now() { return ctx ? ctx.currentTime : 0; }

  function ensure() {
    if (!ctx) init();
    if (ctx && ctx.state === "suspended") {
      // Fire and don't await — the unlock listener and the resume on
      // first user gesture do the heavy lifting. Sounds queued before
      // resume completes are flushed by flushPending() once running.
      try { ctx.resume(); } catch (e) {}
    }
    return !!ctx;
  }

  // Sounds requested while the context is still resuming get queued
  // here and flushed once it's actually running, so the very first
  // 'select' / opening 'door' isn't dropped on cold-start.
  const pending = [];
  function flushPending() {
    while (pending.length) {
      const name = pending.shift();
      const fn = FX[name];
      if (fn) { try { fn(); } catch (e) { console.warn("sound", name, e); } }
    }
  }

  // --- building blocks ---

  function tone({ freq = 440, type = "sine", dur = 0.2, vol = 0.3, slideTo = null, slideCurve = "linear", attack = 0.005, delay = 0 }) {
    if (!ensure() || muted) return;
    const t0 = now() + delay;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo != null) {
      if (slideCurve === "exp") {
        o.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + dur);
      } else {
        o.frequency.linearRampToValueAtTime(slideTo, t0 + dur);
      }
    }
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
    o.connect(g); g.connect(master);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }

  function noise({ dur = 0.15, cutoff = 1000, q = 1, vol = 0.4, type = "lowpass", delay = 0, decay = null }) {
    if (!ensure() || muted) return;
    const t0 = now() + delay;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = cutoff;
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0008, t0 + (decay || dur));
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t0);
    src.stop(t0 + dur + 0.05);
    return src;
  }

  // --- SFX ---

  const FX = {
    click:   () => tone({ freq: 560, type: "square",   dur: 0.05, vol: 0.1 }),
    select:  () => { tone({ freq: 660, type: "sine", dur: 0.07, vol: 0.15 });
                     tone({ freq: 990, type: "sine", dur: 0.09, vol: 0.1, delay: 0.06 }); },
    back:    () => { tone({ freq: 420, type: "sine", dur: 0.08, vol: 0.15, slideTo: 260 }); },

    pickup:  () => {
      tone({ freq: 523, type: "triangle", dur: 0.08, vol: 0.2 });
      tone({ freq: 659, type: "triangle", dur: 0.09, vol: 0.2, delay: 0.07 });
      tone({ freq: 880, type: "triangle", dur: 0.12, vol: 0.18, delay: 0.16 });
    },
    heal:    () => {
      tone({ freq: 392, type: "sine", dur: 0.12, vol: 0.2 });
      tone({ freq: 523, type: "sine", dur: 0.14, vol: 0.18, delay: 0.1 });
      tone({ freq: 659, type: "sine", dur: 0.18, vol: 0.16, delay: 0.22 });
    },

    groan:   () => {
      // Low sawtooth moan, low-passed
      if (!ensure() || muted) return;
      const t0 = now();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const f = ctx.createBiquadFilter();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(88, t0);
      o.frequency.linearRampToValueAtTime(62, t0 + 0.4);
      o.frequency.linearRampToValueAtTime(78, t0 + 0.85);
      f.type = "lowpass"; f.frequency.value = 420; f.Q.value = 4;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.28, t0 + 0.12);
      g.gain.exponentialRampToValueAtTime(0.0008, t0 + 1.0);
      o.connect(f); f.connect(g); g.connect(master);
      o.start(t0); o.stop(t0 + 1.05);
    },

    runnerScream: () => {
      if (!ensure() || muted) return;
      const t0 = now();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(180, t0);
      o.frequency.exponentialRampToValueAtTime(540, t0 + 0.35);
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.25, t0 + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0008, t0 + 0.5);
      o.connect(g); g.connect(master);
      o.start(t0); o.stop(t0 + 0.55);
      noise({ dur: 0.4, cutoff: 1600, q: 2, vol: 0.15 });
    },

    hordeRoar: () => {
      noise({ dur: 1.6, cutoff: 380, q: 0.7, vol: 0.35 });
      for (let i = 0; i < 4; i++) setTimeout(() => FX.groan(), i * 320 + Math.random() * 200);
    },

    gunshot: () => {
      noise({ dur: 0.08, cutoff: 2400, q: 0.5, vol: 0.7, decay: 0.12 });
      tone({ freq: 90, type: "sine", dur: 0.18, vol: 0.5, slideTo: 40 });
      noise({ dur: 0.35, cutoff: 700, q: 0.5, vol: 0.18, delay: 0.06, decay: 0.35 }); // tail
    },
    drySnap: () => { // failed shot / dud
      noise({ dur: 0.04, cutoff: 3200, q: 1, vol: 0.25 });
      tone({ freq: 220, type: "square", dur: 0.05, vol: 0.08 });
    },

    melee:   () => {
      tone({ freq: 260, type: "square", dur: 0.06, vol: 0.15, slideTo: 140 });
      noise({ dur: 0.14, cutoff: 700, q: 2, vol: 0.35, delay: 0.04 });
    },
    hit:     () => {
      noise({ dur: 0.1, cutoff: 500, q: 1, vol: 0.35 });
      tone({ freq: 120, type: "square", dur: 0.12, vol: 0.22, slideTo: 60 });
    },
    crit:    () => {
      tone({ freq: 660, type: "square", dur: 0.05, vol: 0.2 });
      FX.hit();
      tone({ freq: 880, type: "triangle", dur: 0.1, vol: 0.2, delay: 0.08 });
    },

    damage:  () => {
      tone({ freq: 200, type: "sawtooth", dur: 0.18, vol: 0.3, slideTo: 80, slideCurve: "exp" });
      noise({ dur: 0.1, cutoff: 900, q: 1.5, vol: 0.15 });
    },
    dodge:   () => {
      noise({ dur: 0.08, cutoff: 3800, q: 0.6, vol: 0.15 });
    },
    brace:   () => {
      tone({ freq: 300, type: "square", dur: 0.06, vol: 0.18 });
      tone({ freq: 220, type: "square", dur: 0.08, vol: 0.14, delay: 0.06 });
    },
    flee:    () => {
      for (let i = 0; i < 4; i++) {
        noise({ dur: 0.06, cutoff: 180, q: 1, vol: 0.18, delay: i * 0.12 });
      }
    },
    footstep:() => noise({ dur: 0.05, cutoff: 160, q: 1, vol: 0.15 }),

    death:   () => {
      tone({ freq: 220, type: "sawtooth", dur: 0.5, vol: 0.35, slideTo: 55, slideCurve: "exp" });
      setTimeout(() => noise({ dur: 0.9, cutoff: 250, q: 0.8, vol: 0.35 }), 250);
    },
    victory: () => {
      const notes = [523, 659, 784, 1046];
      notes.forEach((f, i) => setTimeout(() => tone({
        freq: f, type: "triangle", dur: 0.22, vol: 0.22,
      }), i * 140));
    },
    tense:   () => {
      tone({ freq: 180, type: "sawtooth", dur: 0.6, vol: 0.22, slideTo: 80 });
    },
    door:    () => {
      tone({ freq: 180, type: "sawtooth", dur: 0.35, vol: 0.15, slideTo: 85 });
      noise({ dur: 0.2, cutoff: 400, q: 2, vol: 0.1, delay: 0.05 });
    },
    radio:   () => {
      noise({ dur: 0.35, cutoff: 1800, q: 1, vol: 0.12 });
      tone({ freq: 800, type: "square", dur: 0.08, vol: 0.08, delay: 0.1 });
    },
  };

  function play(name) {
    if (!ensure() || muted) return;
    const fn = FX[name];
    if (!fn) return;
    // Context may still be resuming after a tab-switch or first
    // gesture — queue the sound and let flushPending() pick it up.
    if (ctx.state !== "running") {
      pending.push(name);
      return;
    }
    try { fn(); } catch (e) { console.warn("sound", name, e); }
  }

  // --- Ambient drone ---

  function stopAmbient() {
    ambientNodes.forEach(n => { try { n.stop(); } catch (_) {} });
    ambientNodes = [];
    ambientScene = null;
  }

  function setAmbience(scene) {
    if (!ensure()) return;
    if (scene === ambientScene) return;
    stopAmbient();
    ambientScene = scene;
    if (muted || !scene) return;

    const t0 = now();
    // Pad drone — two detuned sines in the sub/low range
    const base = { night: 55, forest: 68, city: 62, indoor: 96, blood: 44 }[scene] || 64;

    const mk = (f, detune, vol, type = "sine") => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = f;
      o.detune.value = detune;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(vol, t0 + 1.5);
      o.connect(g); g.connect(master);
      o.start(t0);
      ambientNodes.push(o);
      return { o, g };
    };

    mk(base,     -6, 0.05);
    mk(base * 2, +8, 0.025);

    // Slow LFO on a filtered noise bed for wind / dread
    if (scene === "night" || scene === "forest" || scene === "blood") {
      const len = ctx.sampleRate * 2;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buf; src.loop = true;
      const f = ctx.createBiquadFilter();
      f.type = "lowpass"; f.frequency.value = scene === "blood" ? 260 : 380; f.Q.value = 0.8;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(scene === "blood" ? 0.08 : 0.05, t0 + 2.5);
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.15;
      lfoGain.gain.value = scene === "blood" ? 0.04 : 0.025;
      lfo.connect(lfoGain); lfoGain.connect(g.gain);
      src.connect(f); f.connect(g); g.connect(master);
      src.start(t0); lfo.start(t0);
      ambientNodes.push(src, lfo);
    }

    // Indoor: subtle fluorescent buzz
    if (scene === "indoor") {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "square";
      o.frequency.value = 118;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.012, t0 + 1.5);
      o.connect(g); g.connect(master);
      o.start(t0);
      ambientNodes.push(o);
    }
  }

  function toggleMute() {
    muted = !muted;
    try { localStorage.setItem(MUTE_KEY, muted ? "1" : "0"); } catch (_) {}
    if (master) master.gain.value = muted ? 0 : 0.55;
    if (muted) stopAmbient();
    else if (ambientScene) {
      const s = ambientScene; ambientScene = null; setAmbience(s);
    }
    return muted;
  }

  function isMuted() { return muted; }

  // Document-level audio unlock — every tap / click / keypress
   // resumes the context if the browser suspended it. Modern Chrome
   // and iOS Safari require a user gesture before audio plays; without
   // this, sounds went hit-or-miss after tab-switches or scene
   // transitions that weren't directly inside a click handler.
  function unlock() {
    if (!ctx) init();
    if (ctx && ctx.state === "suspended") {
      const p = ctx.resume();
      if (p && typeof p.then === "function") p.then(flushPending, () => {});
      else flushPending();
    } else if (ctx && ctx.state === "running") {
      flushPending();
    }
  }
  if (typeof document !== "undefined") {
    const opts = { passive: true };
    document.addEventListener("pointerdown", unlock, opts);
    document.addEventListener("touchstart",  unlock, opts);
    document.addEventListener("keydown",     unlock, opts);
    // Some browsers also re-suspend when the tab becomes hidden —
    // resume on visibility return.
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") unlock();
    });
  }

  return { init, play, setAmbience, stopAmbient, toggleMute, isMuted };
})();
