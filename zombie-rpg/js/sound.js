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
    // Softer UI feedback — sine waves only, no square buzz.
    click:   () => tone({ freq: 480, type: "sine", dur: 0.04, vol: 0.07 }),
    select:  () => { tone({ freq: 540, type: "sine", dur: 0.06, vol: 0.10 });
                     tone({ freq: 760, type: "sine", dur: 0.08, vol: 0.07, delay: 0.05 }); },
    back:    () => { tone({ freq: 380, type: "sine", dur: 0.07, vol: 0.10, slideTo: 240 }); },

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
      // Low triangle moan, soft lowpass — no sawtooth buzz.
      if (!ensure() || muted) return;
      const t0 = now();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const f = ctx.createBiquadFilter();
      o.type = "triangle";
      o.frequency.setValueAtTime(88, t0);
      o.frequency.linearRampToValueAtTime(62, t0 + 0.4);
      o.frequency.linearRampToValueAtTime(78, t0 + 0.85);
      f.type = "lowpass"; f.frequency.value = 380; f.Q.value = 1.2;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.22, t0 + 0.12);
      g.gain.exponentialRampToValueAtTime(0.0008, t0 + 1.0);
      o.connect(f); f.connect(g); g.connect(master);
      o.start(t0); o.stop(t0 + 1.05);
    },

    runnerScream: () => {
      // Triangle base, lower top end so it's not piercing.
      if (!ensure() || muted) return;
      const t0 = now();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "triangle";
      o.frequency.setValueAtTime(190, t0);
      o.frequency.exponentialRampToValueAtTime(420, t0 + 0.30);
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.18, t0 + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0008, t0 + 0.42);
      o.connect(g); g.connect(master);
      o.start(t0); o.stop(t0 + 0.45);
      noise({ dur: 0.30, cutoff: 1100, q: 0.8, vol: 0.08 });
    },

    // Bloater — wet, low-frequency gurgle with a bubbling tail.
    // Sounds bloated and infected, like something speaking through fluid.
    bloaterGurgle: () => {
      // Triangle base, low Q lowpass — wet body without ringing.
      if (!ensure() || muted) return;
      const t0 = now();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const f = ctx.createBiquadFilter();
      o.type = "triangle";
      o.frequency.setValueAtTime(72, t0);
      o.frequency.linearRampToValueAtTime(56, t0 + 0.55);
      o.frequency.linearRampToValueAtTime(64, t0 + 0.95);
      f.type = "lowpass"; f.frequency.value = 280; f.Q.value = 1.0;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.24, t0 + 0.10);
      g.gain.exponentialRampToValueAtTime(0.0008, t0 + 1.10);
      o.connect(f); f.connect(g); g.connect(master);
      o.start(t0); o.stop(t0 + 1.15);
      // Bubbling tail — softer lowpass, no ring.
      noise({ dur: 0.45, cutoff: 200, q: 1.2, vol: 0.10, delay: 0.32 });
    },

    // Hunter — sharper, faster, predatory snarl. Mid-range, rises and
    // bites quickly. Reads as the smart-zombie that remembers how to hunt.
    hunterSnarl: () => {
      // Triangle on a soft lowpass — predator without the bandpass ring.
      if (!ensure() || muted) return;
      const t0 = now();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const f = ctx.createBiquadFilter();
      o.type = "triangle";
      o.frequency.setValueAtTime(120, t0);
      o.frequency.exponentialRampToValueAtTime(180, t0 + 0.18);
      o.frequency.exponentialRampToValueAtTime(95, t0 + 0.50);
      f.type = "lowpass"; f.frequency.value = 700; f.Q.value = 0.9;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.22, t0 + 0.06);
      g.gain.exponentialRampToValueAtTime(0.0008, t0 + 0.6);
      o.connect(f); f.connect(g); g.connect(master);
      o.start(t0); o.stop(t0 + 0.65);
      // Breath rasp — gentler, lower cutoff so it's air, not hiss.
      noise({ dur: 0.25, cutoff: 1200, q: 0.7, vol: 0.07, delay: 0.05 });
    },

    // Abomination — deep, monstrous, multi-layered roar. Two oscillators
    // detuned + a wet noise bottom for body. Long sustain so the freezer
    // mini-boss feels physically larger than everything else.
    abominationRoar: () => {
      // Triangle sub + sine harmonic — body without the square buzz.
      if (!ensure() || muted) return;
      const t0 = now();
      // Sub layer.
      const o1 = ctx.createOscillator();
      const g1 = ctx.createGain();
      o1.type = "triangle";
      o1.frequency.setValueAtTime(46, t0);
      o1.frequency.linearRampToValueAtTime(38, t0 + 1.2);
      o1.frequency.linearRampToValueAtTime(52, t0 + 1.65);
      g1.gain.setValueAtTime(0, t0);
      g1.gain.linearRampToValueAtTime(0.34, t0 + 0.22);
      g1.gain.exponentialRampToValueAtTime(0.0008, t0 + 1.85);
      o1.connect(g1); g1.connect(master);
      o1.start(t0); o1.stop(t0 + 1.9);
      // Mid harmonic — sine, not square.
      const o2 = ctx.createOscillator();
      const g2 = ctx.createGain();
      o2.type = "sine";
      o2.frequency.setValueAtTime(96, t0);
      o2.frequency.linearRampToValueAtTime(78, t0 + 1.3);
      g2.gain.setValueAtTime(0, t0);
      g2.gain.linearRampToValueAtTime(0.13, t0 + 0.30);
      g2.gain.exponentialRampToValueAtTime(0.0008, t0 + 1.6);
      o2.connect(g2); g2.connect(master);
      o2.start(t0); o2.stop(t0 + 1.65);
      // Wet body — gentler.
      noise({ dur: 1.10, cutoff: 180, q: 0.8, vol: 0.16, delay: 0.10 });
    },

    // Calder (traitor) — half-human gasp followed by a zombie groan
    // tail. The bite has already won, but his voice is still in there.
    calderGasp: () => {
      // Sine on a gentle lowpass — human warmth, no bandpass ring.
      if (!ensure() || muted) return;
      const t0 = now();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const f = ctx.createBiquadFilter();
      o.type = "sine";
      o.frequency.setValueAtTime(220, t0);
      o.frequency.exponentialRampToValueAtTime(280, t0 + 0.16);
      o.frequency.exponentialRampToValueAtTime(170, t0 + 0.65);
      f.type = "lowpass"; f.frequency.value = 600; f.Q.value = 0.9;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.18, t0 + 0.08);
      g.gain.exponentialRampToValueAtTime(0.0008, t0 + 0.75);
      o.connect(f); f.connect(g); g.connect(master);
      o.start(t0); o.stop(t0 + 0.80);
      // Zombie groan tail underneath, layered late.
      setTimeout(() => FX.groan && FX.groan(), 380);
    },

    hordeRoar: () => {
      noise({ dur: 1.6, cutoff: 380, q: 0.7, vol: 0.35 });
      for (let i = 0; i < 4; i++) setTimeout(() => FX.groan(), i * 320 + Math.random() * 200);
    },

    // Gunshot — softened: less treble in the noise crack, deeper body.
    gunshot: () => {
      noise({ dur: 0.06, cutoff: 1600, q: 0.4, vol: 0.45, decay: 0.10 });
      tone({ freq: 75, type: "sine", dur: 0.20, vol: 0.45, slideTo: 35, slideCurve: "exp" });
      noise({ dur: 0.30, cutoff: 500, q: 0.4, vol: 0.10, delay: 0.06, decay: 0.30 });
    },

    // ---- Per-firearm shots ----
    // Real-world layered construction: HF crack (supersonic gas snap)
    // → mid snap → low body boom → tail. Autoloaders also play a
    // mechanical slide/bolt cycle a beat after the shot. Pick via
    // Sound.fire(weaponName) so the trigger wires to the equipped gun.

    // Cho's .38 Special — short-barrel revolver. Sharp crack, healthy
    // low thump, no slide cycle. Slightly longer reverb tail than a
    // pistol because the cylinder gap leaks.
    shotRevolver: () => {
      if (!ensure() || muted) return;
      noise({ dur: 0.012, cutoff: 3400, q: 0.6, vol: 0.55, type: "highpass", decay: 0.05 });
      tone({ freq: 280, type: "sine", dur: 0.07,  vol: 0.42, slideTo: 90, slideCurve: "exp", attack: 0.001 });
      tone({ freq: 70,  type: "sine", dur: 0.22,  vol: 0.50, slideTo: 28, slideCurve: "exp", attack: 0.001 });
      noise({ dur: 0.34, cutoff: 460, q: 0.4, vol: 0.13, decay: 0.34, delay: 0.04 });
    },

    // Vega's Ranger Rifle — bolt-action .308-class. Heavier crack,
    // deeper boom, long reverberant tail, distinct bolt-cycle clack
    // ~700ms after the shot.
    shotRifle: () => {
      if (!ensure() || muted) return;
      noise({ dur: 0.022, cutoff: 2700, q: 0.5, vol: 0.65, type: "highpass", decay: 0.06 });
      tone({ freq: 200, type: "sine", dur: 0.10, vol: 0.50, slideTo: 60, slideCurve: "exp", attack: 0.001 });
      tone({ freq: 50,  type: "sine", dur: 0.36, vol: 0.55, slideTo: 22, slideCurve: "exp", attack: 0.001 });
      noise({ dur: 0.58, cutoff: 340, q: 0.3, vol: 0.16, decay: 0.58, delay: 0.06 });
      // Bolt lift + pull (clack)
      setTimeout(() => {
        if (!ensure() || muted) return;
        noise({ dur: 0.024, cutoff: 4000, q: 0.8, vol: 0.18, type: "highpass" });
        tone({ freq: 820, type: "triangle", dur: 0.04, vol: 0.10 });
      }, 700);
      // Bolt forward + lock (chack)
      setTimeout(() => {
        if (!ensure() || muted) return;
        noise({ dur: 0.030, cutoff: 3500, q: 0.7, vol: 0.16, type: "highpass" });
        tone({ freq: 620, type: "triangle", dur: 0.05, vol: 0.09 });
      }, 880);
    },

    // Generic semi-auto pistol — sharper than the revolver due to
    // higher chamber pressure, slightly less low body, quick slide
    // cycle ~60ms after the shot.
    shotPistol: () => {
      if (!ensure() || muted) return;
      noise({ dur: 0.010, cutoff: 4100, q: 0.7, vol: 0.50, type: "highpass", decay: 0.04 });
      tone({ freq: 240, type: "sine", dur: 0.06, vol: 0.40, slideTo: 90, slideCurve: "exp", attack: 0.001 });
      tone({ freq: 80,  type: "sine", dur: 0.16, vol: 0.42, slideTo: 32, slideCurve: "exp", attack: 0.001 });
      noise({ dur: 0.20, cutoff: 700, q: 0.4, vol: 0.10, decay: 0.20, delay: 0.03 });
      setTimeout(() => {
        if (!ensure() || muted) return;
        noise({ dur: 0.015, cutoff: 5000, q: 1.0, vol: 0.10, type: "highpass" });
        tone({ freq: 1200, type: "triangle", dur: 0.025, vol: 0.06 });
      }, 60);
    },

    drySnap: () => { // failed shot / dud — soft tick, no square buzz
      noise({ dur: 0.03, cutoff: 1800, q: 0.6, vol: 0.16 });
      tone({ freq: 200, type: "triangle", dur: 0.04, vol: 0.05 });
    },

    // Melee — wood-thump rather than buzzy slide.
    melee:   () => {
      tone({ freq: 220, type: "triangle", dur: 0.07, vol: 0.13, slideTo: 110 });
      noise({ dur: 0.12, cutoff: 500, q: 0.7, vol: 0.22, delay: 0.04 });
    },
    // Hit — low body thump, sine slide, no square ping.
    hit:     () => {
      noise({ dur: 0.08, cutoff: 380, q: 0.5, vol: 0.26 });
      tone({ freq: 90, type: "sine", dur: 0.14, vol: 0.20, slideTo: 50, slideCurve: "exp" });
    },
    // Crit — solid hit + warm triangle accent (no high square).
    crit:    () => {
      noise({ dur: 0.08, cutoff: 380, q: 0.5, vol: 0.30 });
      tone({ freq: 80, type: "sine", dur: 0.18, vol: 0.24, slideTo: 45, slideCurve: "exp" });
      tone({ freq: 660, type: "triangle", dur: 0.12, vol: 0.12, delay: 0.06 });
    },

    // Player took damage — sine slide, gentler noise tail.
    damage:  () => {
      tone({ freq: 160, type: "sine", dur: 0.18, vol: 0.26, slideTo: 70, slideCurve: "exp" });
      noise({ dur: 0.10, cutoff: 600, q: 0.6, vol: 0.10 });
    },
    // Dodge — soft air-whoosh, less hiss.
    dodge:   () => {
      noise({ dur: 0.10, cutoff: 1900, q: 0.4, vol: 0.10 });
    },
    // Brace — wood-thump pair, no square buzz.
    brace:   () => {
      tone({ freq: 220, type: "triangle", dur: 0.06, vol: 0.13 });
      tone({ freq: 165, type: "triangle", dur: 0.08, vol: 0.10, delay: 0.05 });
    },
    flee:    () => {
      for (let i = 0; i < 4; i++) {
        noise({ dur: 0.05, cutoff: 140, q: 0.6, vol: 0.13, delay: i * 0.11 });
      }
    },
    footstep:() => noise({ dur: 0.04, cutoff: 130, q: 0.6, vol: 0.10 }),

    // Death — soft fading sub. No sawtooth.
    death:   () => {
      tone({ freq: 200, type: "sine", dur: 0.55, vol: 0.30, slideTo: 50, slideCurve: "exp" });
      setTimeout(() => noise({ dur: 0.85, cutoff: 200, q: 0.6, vol: 0.22 }), 250);
    },
    victory: () => {
      const notes = [523, 659, 784, 1046];
      notes.forEach((f, i) => setTimeout(() => tone({
        freq: f, type: "triangle", dur: 0.22, vol: 0.18,
      }), i * 140));
    },
    // Tense / wind-up — low warble on sine, not sawtooth.
    tense:   () => {
      tone({ freq: 160, type: "sine", dur: 0.50, vol: 0.16, slideTo: 90 });
    },
    door:    () => {
      tone({ freq: 160, type: "sine", dur: 0.32, vol: 0.13, slideTo: 80 });
      noise({ dur: 0.18, cutoff: 380, q: 1.0, vol: 0.07, delay: 0.05 });
    },
    radio:   () => {
      noise({ dur: 0.30, cutoff: 1600, q: 0.8, vol: 0.10 });
      tone({ freq: 720, type: "triangle", dur: 0.07, vol: 0.06, delay: 0.10 });
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

  // ---- Scene-fit ambient pads ----
  // Each scene gets a small chord of detuned sines (warm pad), and an
  // optional "air" element appropriate to the setting:
  //   forest → very low band-passed wind, soft & moving
  //   night  → distant low rumble + a very faint cricket pulse
  //   city   → distant traffic rumble (low-passed brown-ish noise)
  //   indoor → barely-audible sine room hum (no square buzz)
  //   blood  → dissonant low pad + sub pulse
  // Volumes are intentionally low (≤ 0.05) so combat SFX cut through.
  const SCENE_CHORDS = {
    // Pitches in Hz. Stack of three keeps the harmony soft.
    night:  [55,   82.4, 110],     // A1 + E2 + A2 — minor, restful
    forest: [65.4, 98,   146.8],   // C2 + G2 + D3 — open, natural
    city:   [61.7, 92.5, 138.6],   // B1 + F#2 + C#3 — slight tension
    indoor: [98],                  // G2 — single soft hum
    blood:  [49,   58.3, 73.4],    // G1 + Bb1 + D2 — dread, dissonant
  };

  function setAmbience(scene) {
    if (!ensure()) return;
    if (scene === ambientScene) return;
    stopAmbient();
    ambientScene = scene;
    if (muted || !scene) return;

    const t0 = now();
    const chord = SCENE_CHORDS[scene] || SCENE_CHORDS.night;

    // Soft drone stack — detune each voice slightly so the chord
    // breathes instead of phasing. Each voice lowpass-filtered to keep
    // it warm and out of the way of dialogue / SFX.
    chord.forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const f = ctx.createBiquadFilter();
      o.type = "sine";
      o.frequency.value = freq;
      o.detune.value = (i - 1) * 4; // ±4 cents around center voice
      f.type = "lowpass";
      f.frequency.value = 800;
      f.Q.value = 0.6;
      const target = scene === "indoor" ? 0.02 : (i === 0 ? 0.04 : 0.025);
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(target, t0 + 2.0);
      o.connect(f); f.connect(g); g.connect(master);
      o.start(t0);
      ambientNodes.push(o);
    });

    // ---- Scene-specific air ----
    if (scene === "forest") {
      // Distant wind through pines: noise → narrow band-pass + slow LFO.
      // Much quieter and more focused than the old wide lowpass bed.
      const len = ctx.sampleRate * 3;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buf; src.loop = true;
      const f = ctx.createBiquadFilter();
      f.type = "bandpass"; f.frequency.value = 320; f.Q.value = 6;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.018, t0 + 3);
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.08;
      lfoGain.gain.value = 0.012;
      lfo.connect(lfoGain); lfoGain.connect(g.gain);
      src.connect(f); f.connect(g); g.connect(master);
      src.start(t0); lfo.start(t0);
      ambientNodes.push(src, lfo);
    }
    else if (scene === "night") {
      // A thin distant cricket-like pulse — sine LFO modulating a
      // narrow bandpass on noise. Very low, just texture.
      const len = ctx.sampleRate * 2;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buf; src.loop = true;
      const f = ctx.createBiquadFilter();
      f.type = "bandpass"; f.frequency.value = 4800; f.Q.value = 18;
      const g = ctx.createGain();
      g.gain.value = 0;
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.type = "sine";
      lfo.frequency.value = 4.5;
      lfoGain.gain.value = 0.012;
      lfo.connect(lfoGain); lfoGain.connect(g.gain);
      src.connect(f); f.connect(g); g.connect(master);
      src.start(t0); lfo.start(t0);
      ambientNodes.push(src, lfo);
    }
    else if (scene === "city") {
      // Distant low traffic rumble — heavily lowpassed noise, very low.
      const len = ctx.sampleRate * 3;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.5;
      const src = ctx.createBufferSource();
      src.buffer = buf; src.loop = true;
      const f = ctx.createBiquadFilter();
      f.type = "lowpass"; f.frequency.value = 140; f.Q.value = 0.7;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(0.022, t0 + 2.5);
      src.connect(f); f.connect(g); g.connect(master);
      src.start(t0);
      ambientNodes.push(src);
    }
    else if (scene === "blood") {
      // Sub pulse — very low sine modulated slowly for dread.
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      o.type = "sine";
      o.frequency.value = 36;
      lfo.frequency.value = 0.22;
      lfoGain.gain.value = 0.018;
      g.gain.value = 0.022;
      lfo.connect(lfoGain); lfoGain.connect(g.gain);
      o.connect(g); g.connect(master);
      o.start(t0); lfo.start(t0);
      ambientNodes.push(o, lfo);
    }
    // 'indoor' has only the soft drone — no extra air, since the
    // square fluorescent buzz was the worst offender.
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

  // Pick the right firearm sound for the equipped weapon. Falls back
  // to the generic semi-auto pistol crack for anything unrecognized.
  function fire(weaponName) {
    const n = String(weaponName || "").toLowerCase();
    if (n.includes("rifle")    || n.includes("ranger"))   return play("shotRifle");
    if (n.includes(".38")      || n.includes("revolver")) return play("shotRevolver");
    return play("shotPistol");
  }

  return { init, play, fire, setAmbience, stopAmbient, toggleMute, isMuted };
})();
