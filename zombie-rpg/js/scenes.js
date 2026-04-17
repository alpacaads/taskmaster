// SVG scene renderer for Dead Light.
// Composes painted environments with silhouette characters and props.
// Each scene is a viewBox 0 0 400 200, drawn as inline SVG injected into .scene-art.
window.Scenes = (function () {

  // ---------- shared SVG defs (gradients, filters) ----------
  const DEFS = `
    <defs>
      <linearGradient id="skyNight" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"  stop-color="#070d18"/>
        <stop offset="60%" stop-color="#101a2c"/>
        <stop offset="100%" stop-color="#1a2436"/>
      </linearGradient>
      <linearGradient id="skyDusk" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"  stop-color="#1a1430"/>
        <stop offset="55%" stop-color="#5b2a3a"/>
        <stop offset="100%" stop-color="#a8552e"/>
      </linearGradient>
      <linearGradient id="skyDawn" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"  stop-color="#1d2a3e"/>
        <stop offset="60%" stop-color="#c46c46"/>
        <stop offset="100%" stop-color="#f0b07a"/>
      </linearGradient>
      <linearGradient id="skyForest" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"  stop-color="#0c1410"/>
        <stop offset="60%" stop-color="#1a2a1c"/>
        <stop offset="100%" stop-color="#26341f"/>
      </linearGradient>
      <linearGradient id="skyBlood" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"  stop-color="#1a0606"/>
        <stop offset="50%" stop-color="#52131a"/>
        <stop offset="100%" stop-color="#8c2a25"/>
      </linearGradient>
      <linearGradient id="skyIndoor" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"  stop-color="#0e0b07"/>
        <stop offset="100%" stop-color="#1d160d"/>
      </linearGradient>
      <radialGradient id="moonGlow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0%"  stop-color="#fff8d6" stop-opacity="0.95"/>
        <stop offset="60%" stop-color="#dfd9a2" stop-opacity="0.45"/>
        <stop offset="100%" stop-color="#dfd9a2" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="fireGlow" cx="0.5" cy="0.6" r="0.5">
        <stop offset="0%"  stop-color="#ffb84a" stop-opacity="0.9"/>
        <stop offset="60%" stop-color="#a14017" stop-opacity="0.4"/>
        <stop offset="100%" stop-color="#3a0c00" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="lampGlow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0%"  stop-color="#ffe79a" stop-opacity="0.85"/>
        <stop offset="100%" stop-color="#ffe79a" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="bloodHaze" cx="0.5" cy="1" r="0.7">
        <stop offset="0%"  stop-color="#ff6b3a" stop-opacity="0.45"/>
        <stop offset="100%" stop-color="#ff6b3a" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="groundDark" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0a0d08"/>
        <stop offset="100%" stop-color="#000000"/>
      </linearGradient>
      <linearGradient id="roadGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#2a2722"/>
        <stop offset="100%" stop-color="#0c0b08"/>
      </linearGradient>
    </defs>
  `;

  // ---------- background painters ----------
  const BG = {
    nightCity: () => `
      <rect width="400" height="200" fill="url(#skyNight)"/>
      ${stars(60)}
      <ellipse cx="60" cy="45" rx="22" ry="22" fill="url(#moonGlow)"/>
      <circle cx="60" cy="45" r="14" fill="#f3edc4"/>
      <rect y="160" width="400" height="40" fill="url(#groundDark)"/>
    `,
    nightStreet: () => `
      <rect width="400" height="200" fill="url(#skyNight)"/>
      ${stars(40)}
      <rect y="140" width="400" height="60" fill="#0a0d08"/>
      <rect y="158" width="400" height="3" fill="#1a1d18"/>
      <ellipse cx="320" cy="120" rx="60" ry="45" fill="url(#lampGlow)"/>
    `,
    forestNight: () => `
      <rect width="400" height="200" fill="url(#skyForest)"/>
      <ellipse cx="340" cy="35" rx="14" ry="14" fill="url(#moonGlow)"/>
      <circle cx="340" cy="35" r="9" fill="#d8d2a0"/>
      <rect y="155" width="400" height="45" fill="#06080a"/>
    `,
    forestDawn: () => `
      <rect width="400" height="200" fill="url(#skyDawn)"/>
      <ellipse cx="340" cy="60" rx="20" ry="20" fill="#fff1bb"/>
      <rect y="155" width="400" height="45" fill="#1c1208"/>
    `,
    highway: () => `
      <rect width="400" height="200" fill="url(#skyDusk)"/>
      <ellipse cx="200" cy="160" rx="220" ry="18" fill="#4a2418" opacity="0.7"/>
      <polygon points="0,200 400,200 260,140 140,140" fill="url(#roadGrad)"/>
      <line x1="200" y1="200" x2="200" y2="142" stroke="#7a6a44" stroke-dasharray="8 8" stroke-width="2"/>
    `,
    indoor: () => `
      <rect width="400" height="200" fill="url(#skyIndoor)"/>
      <rect y="0" width="400" height="155" fill="#15110b"/>
      <rect y="155" width="400" height="45" fill="#0a0805"/>
      <rect x="50" y="40" width="60" height="80" fill="#0a0805" stroke="#3a2e1f" stroke-width="2"/>
      <line x1="80" y1="40" x2="80" y2="120" stroke="#3a2e1f" stroke-width="1"/>
      <line x1="50" y1="80" x2="110" y2="80" stroke="#3a2e1f" stroke-width="1"/>
      <ellipse cx="80" cy="80" rx="80" ry="55" fill="url(#lampGlow)" opacity="0.45"/>
    `,
    indoorRuined: () => `
      <rect width="400" height="200" fill="url(#skyIndoor)"/>
      <rect y="0" width="400" height="155" fill="#150f0a"/>
      <polygon points="0,155 400,155 400,200 0,200" fill="#070503"/>
      <polygon points="220,40 250,30 270,80 230,90" fill="#1d1208"/>
      <ellipse cx="120" cy="60" rx="60" ry="40" fill="url(#lampGlow)" opacity="0.3"/>
    `,
    grocery: () => `
      <rect width="400" height="200" fill="#0d0a06"/>
      <rect y="0" width="400" height="160" fill="#15110b"/>
      ${shelf(20, 60)} ${shelf(20, 100)} ${shelf(20, 140)}
      ${shelf(220, 60)} ${shelf(220, 100)} ${shelf(220, 140)}
      <rect y="160" width="400" height="40" fill="#0a0805"/>
      <ellipse cx="200" cy="60" rx="120" ry="40" fill="url(#lampGlow)" opacity="0.35"/>
    `,
    camp: () => `
      <rect width="400" height="200" fill="url(#skyDusk)"/>
      <ellipse cx="340" cy="55" rx="18" ry="18" fill="#fff1bb"/>
      <rect y="150" width="400" height="50" fill="#1a0e07"/>
      ${pine(40, 150, 0.7)} ${pine(85, 150, 0.6)} ${pine(360, 150, 0.65)}
      ${tent(140, 150)} ${tent(260, 150)}
      <ellipse cx="200" cy="170" rx="80" ry="30" fill="url(#fireGlow)"/>
      ${campfire(200, 168)}
    `,
    bloodDawn: () => `
      <rect width="400" height="200" fill="url(#skyBlood)"/>
      <rect width="400" height="200" fill="url(#bloodHaze)"/>
      <ellipse cx="200" cy="80" rx="50" ry="50" fill="#f0d896" opacity="0.9"/>
      <rect y="155" width="400" height="45" fill="#1a0606"/>
    `,
    fenceForest: () => `
      <rect width="400" height="200" fill="url(#skyForest)"/>
      ${pine(30, 150, 0.8)} ${pine(370, 150, 0.85)}
      <rect y="155" width="400" height="45" fill="#0a0e08"/>
      ${fence(20, 110, 360)}
    `,
    cliff: () => `
      <rect width="400" height="200" fill="url(#skyDawn)"/>
      <polygon points="0,200 400,200 400,140 250,130 150,150 0,160" fill="#1a1208"/>
      <polygon points="0,200 220,200 180,150 0,170" fill="#0a0604"/>
    `,
    bedroomNight: () => `
      <rect width="400" height="200" fill="#0c0a08"/>
      <rect y="0" width="400" height="160" fill="#16110c"/>
      <rect y="160" width="400" height="40" fill="#0a0805"/>
      <rect x="40" y="30" width="50" height="70" fill="#0a0805" stroke="#2a2018" stroke-width="2"/>
      <ellipse cx="65" cy="65" rx="60" ry="45" fill="url(#moonGlow)" opacity="0.5"/>
      <rect x="220" y="120" width="160" height="40" fill="#241a12" rx="3"/>
      <rect x="225" y="115" width="150" height="10" fill="#3a2818" rx="2"/>
      <ellipse cx="350" cy="60" rx="40" ry="30" fill="url(#lampGlow)" opacity="0.45"/>
    `,
  };

  // ---------- atmospheric helpers ----------
  function stars(n) {
    let out = "";
    let seed = 1;
    function rng() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    for (let i = 0; i < n; i++) {
      const x = Math.floor(rng() * 400);
      const y = Math.floor(rng() * 130);
      const r = rng() < 0.85 ? 0.6 : 1.1;
      const o = (0.4 + rng() * 0.5).toFixed(2);
      out += `<circle cx="${x}" cy="${y}" r="${r}" fill="#cfd5e8" opacity="${o}"/>`;
    }
    return out;
  }

  function shelf(x, y) {
    return `
      <rect x="${x}" y="${y}" width="160" height="20" fill="#1f1812" stroke="#2c241a" stroke-width="1"/>
      <rect x="${x+4}"   y="${y+4}" width="14" height="14" fill="#3a2c1c"/>
      <rect x="${x+22}"  y="${y+4}" width="14" height="14" fill="#2a3a44"/>
      <rect x="${x+40}"  y="${y+4}" width="14" height="14" fill="#5a3018"/>
      <rect x="${x+58}"  y="${y+4}" width="14" height="14" fill="#3a2c1c"/>
      <rect x="${x+76}"  y="${y+4}" width="14" height="14" fill="#2a3a44"/>
      <rect x="${x+94}"  y="${y+4}" width="14" height="14" fill="#5a3018"/>
      <rect x="${x+112}" y="${y+4}" width="14" height="14" fill="#3a2c1c"/>
      <rect x="${x+130}" y="${y+4}" width="14" height="14" fill="#2a3a44"/>
    `;
  }

  function pine(x, baseY, scale = 1) {
    const w = 22 * scale, h = 50 * scale;
    return `
      <g transform="translate(${x},${baseY})">
        <rect x="${-2}" y="${-6}" width="4" height="8" fill="#180e08"/>
        <polygon points="0,${-h} ${-w*0.6},${-h*0.55} ${-w*0.45},${-h*0.55} ${-w*0.85},${-h*0.25} ${-w*0.65},${-h*0.25} ${-w},0 ${w},0 ${w*0.65},${-h*0.25} ${w*0.85},${-h*0.25} ${w*0.45},${-h*0.55} ${w*0.6},${-h*0.55}" fill="#0a1408" stroke="#0d1c0a" stroke-width="0.5"/>
      </g>
    `;
  }

  function tent(x, y) {
    return `
      <g transform="translate(${x},${y})">
        <polygon points="-22,0 22,0 0,-30" fill="#322014" stroke="#1a1008" stroke-width="1"/>
        <polygon points="-3,0 3,0 0,-22" fill="#0a0604"/>
      </g>
    `;
  }

  function campfire(x, y) {
    return `
      <g transform="translate(${x},${y})" class="fire">
        <ellipse cx="0" cy="2" rx="14" ry="3" fill="#0a0604"/>
        <polygon points="-6,2 -2,-12 2,-6 6,-14 4,2" fill="#ffb84a"/>
        <polygon points="-3,2 0,-8 3,2" fill="#ffe7a0"/>
        <line x1="-10" y1="2" x2="2" y2="-2" stroke="#3a2010" stroke-width="2"/>
        <line x1="10" y1="2" x2="-2" y2="-2" stroke="#3a2010" stroke-width="2"/>
      </g>
    `;
  }

  function fence(x, y, w) {
    let out = `<rect x="${x}" y="${y}" width="${w}" height="2" fill="#2a2018"/>
               <rect x="${x}" y="${y+25}" width="${w}" height="2" fill="#2a2018"/>`;
    for (let i = x; i <= x + w; i += 14) {
      out += `<rect x="${i}" y="${y-5}" width="3" height="40" fill="#1d150e"/>`;
    }
    return out;
  }

  // ---------- character renderers ----------
  // All characters drawn at base scale 1, anchored at feet.
  // tone: 'cool' (night), 'warm' (firelit), 'pale' (dawn), 'red' (blood)
  const TONE = {
    cool: { skin: "#1a1c22", cloth: "#0a0c10", cloth2: "#161922", hair: "#080808", rim: "#3a4a5a" },
    warm: { skin: "#2a1d12", cloth: "#1c120a", cloth2: "#2a1c10", hair: "#0a0604", rim: "#a1502a" },
    pale: { skin: "#322218", cloth: "#1a120c", cloth2: "#2a1c12", hair: "#0a0604", rim: "#d8a070" },
    red:  { skin: "#1a0a0a", cloth: "#0e0404", cloth2: "#1a0808", hair: "#000000", rim: "#a02828" },
    fire: { skin: "#2a1a0c", cloth: "#1a0c06", cloth2: "#2c1808", hair: "#0a0402", rim: "#ff9b3a" },
  };

  // Render a character as a sized emoji inside the SVG scene.
  // The emoji sits naturally in the painted environment and gets per-character
  // animation via a wrapping <g class="char anim-…">.
  // Characters are encoded as HTML comment markers in the SVG output.
  // The render() function strips them out and renders them as positioned
  // HTML divs over the SVG, sidestepping all SVG-text emoji rendering issues.
  function emojiChar(x, y, glyph, opts = {}) {
    const { size = 50, anim = "breathe", flip = false } = opts;
    // Encode glyph as URL-safe (it's pure unicode so just use as-is)
    return `<!--CHAR|${glyph}|${x}|${y}|${size}|${anim}|${flip ? 1 : 0}-->` +
      `<ellipse cx="${x}" cy="${y+2}" rx="${size*0.4}" ry="${size*0.08}" fill="#000" opacity="0.5"/>`;
  }

  function survivor(x, y, opts = {}) {
    const { scale = 1, flip = false, anim = "breathe", build = "m", named = null } = opts;
    let glyph = build === "f" ? "🧍‍♀️" : "🧍";
    if (named === "maya")  glyph = "👩‍🦰";
    if (named === "ren")   glyph = "🧑‍⚕️";
    if (named === "vega")  glyph = "👩‍✈️";
    if (named === "ellis") glyph = "🧑";
    return emojiChar(x, y, glyph, { size: 50 * scale, anim, flip });
  }

  function child(x, y, opts = {}) {
    const { scale = 0.85, flip = false, anim = "breathe" } = opts;
    return emojiChar(x, y, "👧", { size: 38 * scale, anim, flip });
  }

  function zombie(x, y, opts = {}) {
    const { scale = 1, flip = false, variant = "walker", anim = "shamble" } = opts;
    const glyph = variant === "runner"  ? "🧟‍♂️"
                : variant === "bloater" ? "🧟"
                : variant === "female"  ? "🧟‍♀️"
                : "🧟";
    const size = variant === "bloater" ? 56 * scale : 50 * scale;
    return emojiChar(x, y, glyph, { size, anim, flip });
  }

  function bandit(x, y, opts = {}) {
    const { scale = 1, flip = false, weapon = "rifle" } = opts;
    const glyph = weapon === "rifle" ? "🤠" : "🥷";
    const out = emojiChar(x, y, glyph, { size: 48 * scale, anim: "stand", flip });
    // Add a small weapon emoji beside them
    const wx = x + (flip ? -22 : 22) * scale;
    const wpn = weapon === "rifle" ? "🔫" : "🔪";
    return out + `<g transform="translate(${wx},${y - 22 * scale}) scale(${flip ? -1 : 1},1)" filter="drop-shadow(0 1px 1px rgba(0,0,0,0.6))">
      <text x="0" y="0" font-size="${22*scale}" text-anchor="middle">${wpn}</text>
    </g>`;
  }

  function horde(x, y, opts = {}) {
    const { scale = 1 } = opts;
    let out = "";
    const slots = [
      { x: -70, s: 0.85, t: 6,  v: "walker",  flip: false },
      { x: -35, s: 1.0,  t: 0,  v: "runner",  flip: false },
      { x: 0,   s: 1.1,  t: 4,  v: "bloater", flip: false },
      { x: 35,  s: 0.95, t: 0,  v: "female",  flip: true  },
      { x: 70,  s: 0.85, t: 6,  v: "walker",  flip: true  },
      { x: -55, s: 0.7,  t: 14, v: "walker",  flip: false },
      { x: 55,  s: 0.7,  t: 14, v: "runner",  flip: true  },
    ];
    slots.forEach((s, i) => {
      out += zombie(x + s.x * scale, y + s.t * scale, {
        scale: s.s * scale, variant: s.v, flip: s.flip,
        anim: i % 2 ? "shamble" : "shamble-2",
      });
    });
    return out;
  }

  function chopper(x, y) {
    return `<g class="prop anim-fly" transform="translate(${x},${y})">
      <ellipse cx="0" cy="0" rx="14" ry="4" fill="#0c100a"/>
      <rect x="8" y="-1" width="14" height="3" fill="#0c100a"/>
      <line x1="-22" y1="-4" x2="22" y2="-4" stroke="#0c100a" stroke-width="1.5"/>
      <line x1="0" y1="-4" x2="0" y2="-8" stroke="#0c100a" stroke-width="1"/>
    </g>`;
  }

  function ruinedBuilding(x, y, w, h, opts = {}) {
    const { tone = "#0a0a0c" } = opts;
    let windows = "";
    const cols = Math.floor(w / 14), rows = Math.floor(h / 18);
    let seed = x + y;
    function rng() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const wx = x + 4 + c * 14, wy = y + 6 + r * 18;
        const lit = rng() < 0.18;
        const broken = rng() < 0.35;
        const fill = lit ? "#ffd76b" : (broken ? "#000" : "#1a1814");
        windows += `<rect x="${wx}" y="${wy}" width="6" height="9" fill="${fill}" opacity="${lit ? 0.85 : 1}"/>`;
      }
    }
    const roof = rng() < 0.5
      ? `<polygon points="${x},${y} ${x+w*0.5},${y-6} ${x+w},${y} ${x+w*0.7},${y+4} ${x+w*0.3},${y+4}" fill="${tone}"/>`
      : `<rect x="${x}" y="${y-3}" width="${w}" height="3" fill="${tone}"/>`;
    return `${roof}<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${tone}"/>${windows}`;
  }

  function car(x, y, opts = {}) {
    const { flip = false, color = "#1a1814" } = opts;
    const sx = flip ? -1 : 1;
    return `<g transform="translate(${x},${y}) scale(${sx},1)">
      <rect x="-25" y="-8" width="50" height="10" rx="2" fill="${color}"/>
      <rect x="-18" y="-16" width="36" height="9" rx="3" fill="${color}"/>
      <rect x="-13" y="-15" width="11" height="7" fill="#2a2820"/>
      <rect x="2"   y="-15" width="11" height="7" fill="#2a2820"/>
      <ellipse cx="-15" cy="3" rx="5" ry="4" fill="#0a0a08"/>
      <ellipse cx="15"  cy="3" rx="5" ry="4" fill="#0a0a08"/>
      <ellipse cx="-22" cy="-4" rx="2" ry="2" fill="#3a2a08"/>
    </g>`;
  }

  function streetlamp(x, y) {
    return `<g transform="translate(${x},${y})">
      <rect x="-1" y="-90" width="2" height="90" fill="#1a1812"/>
      <path d="M 0 -90 Q 14 -90 14 -78" stroke="#1a1812" stroke-width="2" fill="none"/>
      <ellipse cx="14" cy="-72" rx="6" ry="4" fill="#3a2c1c"/>
      <ellipse cx="14" cy="-72" rx="3" ry="2" fill="#ffe79a"/>
    </g>`;
  }

  function gate(x, y) {
    return `<g transform="translate(${x},${y})">
      <rect x="-4" y="-90" width="3" height="90" fill="#241c12"/>
      <rect x="60" y="-90" width="3" height="90" fill="#241c12"/>
      ${"".concat(...Array.from({length: 12}, (_, i) =>
        `<line x1="0" y1="${-i*7}" x2="60" y2="${-i*7}" stroke="#3a2c1c" stroke-width="0.5"/>` +
        `<line x1="${i*5}" y1="0" x2="${i*5}" y2="-84" stroke="#3a2c1c" stroke-width="0.5"/>`
      ))}
      <path d="M 0 -90 L 30 -100 L 60 -90" stroke="#5a1818" stroke-width="1" fill="none"/>
    </g>`;
  }

  function bed(x, y) {
    return `<g transform="translate(${x},${y})">
      <rect x="0" y="0" width="120" height="22" fill="#2a1c10" rx="2"/>
      <rect x="2" y="-6" width="116" height="8" fill="#3a2820" rx="1"/>
      <rect x="6" y="-12" width="40" height="10" fill="#5a4030" rx="2"/>
    </g>`;
  }

  function moon(x, y, r = 18) {
    return `<ellipse cx="${x}" cy="${y}" rx="${r+8}" ry="${r+8}" fill="url(#moonGlow)"/>
            <circle cx="${x}" cy="${y}" r="${r-4}" fill="#f3edc4"/>`;
  }

  // ---------- scene compositions ----------
  // Each scene returns an SVG body (not the wrapper).
  const SCENES = {

    intro: () => BG.nightCity() + chopper(370, 35) +
      ruinedBuilding(20,  120, 60, 75) +
      ruinedBuilding(95,  100, 80, 95) +
      ruinedBuilding(190, 110, 60, 85) +
      ruinedBuilding(265, 95,  85, 100) +
      ruinedBuilding(360, 115, 40, 80) +
      survivor(200, 175, { tone: "cool" }),

    apt_hallway: () => BG.indoor() +
      `<rect x="280" y="40" width="50" height="120" fill="#0a0805" stroke="#3a2e1f" stroke-width="2"/>
       <ellipse cx="305" cy="100" rx="40" ry="30" fill="url(#lampGlow)" opacity="0.3"/>
       <path d="M 100 200 L 180 195 L 200 198 L 220 196" stroke="#5a1818" stroke-width="1.2" fill="none" opacity="0.7"/>` +
      survivor(180, 178, { tone: "warm" }),

    neighbour_apt: () => BG.indoor() +
      `<rect x="200" y="120" width="60" height="40" fill="#2a1c10"/>
       <rect x="200" y="115" width="60" height="6" fill="#3a2818"/>
       <rect x="280" y="80" width="80" height="80" fill="#1a1208" stroke="#3a2c1c"/>` +
      survivor(120, 178, { tone: "warm" }),

    neighbour_wake: () => BG.indoorRuined() +
      zombie(220, 178, { tone: "warm", variant: "walker", anim: "lurch" }) +
      survivor(120, 178, { tone: "warm", flip: true }),

    stairwell: () => `<rect width="400" height="200" fill="#06070a"/>
      ${"".concat(...Array.from({length: 6}, (_, i) =>
        `<polygon points="${50+i*40},200 ${90+i*40},200 ${90+i*40},${175-i*15} ${50+i*40},${175-i*15}" fill="#0c0e10" stroke="#1a1c22" stroke-width="0.5"/>`
      ))}
      <ellipse cx="100" cy="120" rx="60" ry="50" fill="url(#lampGlow)" opacity="0.4"/>
      ${survivor(100, 178, { tone: "cool" })}`,

    meet_maya: () => BG.nightStreet() +
      streetlamp(330, 180) +
      survivor(160, 178, { tone: "cool" }) +
      survivor(220, 178, { tone: "cool", build: "f", flip: true, jacket: "#2a3024" }),

    alone_street: () => BG.nightStreet() +
      streetlamp(50, 180) +
      car(120, 175, { color: "#1a1814" }) +
      car(260, 175, { flip: true, color: "#221a14" }) +
      zombie(330, 178, { tone: "cool", variant: "walker" }) +
      survivor(60, 178, { tone: "cool" }),

    grocery_front: () => BG.grocery() +
      zombie(180, 178, { tone: "warm", variant: "walker" }) +
      zombie(240, 178, { tone: "warm", variant: "runner", flip: true }) +
      survivor(80, 178, { tone: "warm" }),

    grocery_inside: () => BG.grocery() +
      survivor(200, 178, { tone: "warm" }),

    freezer: () => `<rect width="400" height="200" fill="#0a0e10"/>
      <rect y="0" width="400" height="160" fill="#101418"/>
      <rect y="160" width="400" height="40" fill="#06080a"/>
      <rect x="40" y="40" width="320" height="120" fill="none" stroke="#2a3038" stroke-width="2"/>
      <ellipse cx="200" cy="80" rx="120" ry="40" fill="#cfdde8" opacity="0.08"/>
      ${child(280, 175, { tone: "pale" })}
      ${survivor(120, 178, { tone: "pale" })}`,

    highway_dawn: () => BG.highway() +
      car(80, 175, { color: "#1a1814" }) +
      car(320, 175, { flip: true, color: "#221814" }) +
      survivor(190, 178, { tone: "pale" }),

    highway_with_child: () => BG.highway() +
      car(60, 175) +
      survivor(190, 178, { tone: "pale" }) +
      child(215, 178, { tone: "pale", flip: true }),

    forest_ambush: () => BG.forestNight() +
      pine(40, 155, 1.0) + pine(80, 155, 0.8) + pine(360, 155, 1.1) + pine(330, 155, 0.7) +
      bandit(280, 178, { tone: "cool", weapon: "rifle" }) +
      bandit(330, 178, { tone: "cool", weapon: "shotgun", flip: true }) +
      survivor(120, 178, { tone: "cool" }),

    sacrifice: () => BG.forestNight() +
      pine(40, 155, 1.0) + pine(360, 155, 1.0) +
      survivor(160, 178, { tone: "cool" }) +
      child(110, 178, { tone: "cool" }) +
      bandit(290, 178, { tone: "cool", flip: true }),

    greenbelt_gate: () => BG.fenceForest() +
      gate(170, 155) +
      survivor(80, 178, { tone: "warm" }) +
      survivor(310, 178, { tone: "warm", named: "maya", flip: true }),

    greenbelt_camp: () => BG.camp() +
      survivor(110, 178, { tone: "fire" }) +
      survivor(180, 178, { tone: "fire", named: "maya" }) +
      survivor(290, 178, { tone: "fire", build: "f", jacket: "#3a2820", flip: true }),

    greenbelt_morning: () => BG.forestDawn() +
      pine(50, 155, 0.8) + pine(360, 155, 0.9) +
      tent(120, 165) + tent(280, 165) +
      survivor(200, 178, { tone: "pale" }),

    medbay: () => BG.indoor() +
      bed(100, 140) +
      child(140, 158, { anim: "rest" }) +
      survivor(220, 178, { named: "ren" }) +
      survivor(290, 178, { named: "ellis", flip: true }),

    bonfire_night: () => `<rect width="400" height="200" fill="url(#skyNight)"/>
      ${stars(50)}
      ${pine(30, 155, 0.9)} ${pine(370, 155, 0.85)}
      <rect y="155" width="400" height="45" fill="#0a0805"/>
      <ellipse cx="200" cy="170" rx="90" ry="35" fill="url(#fireGlow)"/>
      ${campfire(200, 168)}
      ${survivor(140, 178, { tone: "fire" })}
      ${survivor(260, 178, { tone: "fire", named: "maya", flip: true })}`,

    intimate_bedroom: () => BG.bedroomNight() +
      bed(220, 145) +
      `<g transform="translate(280, 135)" class="anim-breathe">
         <ellipse cx="0" cy="0" rx="40" ry="6" fill="#3a2820"/>
         <ellipse cx="-12" cy="-4" rx="8" ry="6" fill="#1a1c22"/>
         <ellipse cx="14"  cy="-4" rx="8" ry="6" fill="#1a1c22"/>
       </g>`,

    cliff_dawn: () => BG.cliff() +
      survivor(180, 165, { tone: "pale" }) +
      survivor(220, 165, { tone: "pale", named: "maya", flip: true }),

    horde_wall: () => BG.bloodDawn() +
      fence(20, 130, 360) +
      horde(200, 175, { scale: 0.95 }) +
      survivor(110, 178, { tone: "fire" }) +
      survivor(290, 178, { tone: "fire", flip: true }),

    horde_charge: () => BG.bloodDawn() +
      horde(200, 178, { scale: 1.05 }),

    ending_dawn: () => BG.bloodDawn() +
      fence(20, 130, 360) +
      survivor(180, 178, { tone: "fire" }) +
      survivor(220, 178, { tone: "fire", named: "maya", flip: true }),

    ending_grave: () => `<rect width="400" height="200" fill="url(#skyDusk)"/>
      <rect y="155" width="400" height="45" fill="#1a0e07"/>
      ${pine(50, 155, 0.7)} ${pine(360, 155, 0.7)}
      <rect x="190" y="120" width="20" height="40" fill="#3a2820" rx="2"/>
      <rect x="180" y="115" width="40" height="6" fill="#3a2820"/>
      <ellipse cx="200" cy="165" rx="30" ry="4" fill="#0a0604"/>
      ${survivor(280, 178, { tone: "warm", named: "maya" })}`,

    ending_road: () => BG.highway() +
      survivor(180, 178, { tone: "pale" }) +
      survivor(210, 178, { tone: "pale", named: "maya" }) +
      child(238, 178, { tone: "pale", flip: true }) +
      survivor(265, 178, { tone: "pale" }),

    camp_kitchen: () => BG.camp() +
      `<rect x="170" y="155" width="60" height="20" fill="#3a2818" rx="2"/>
       <ellipse cx="200" cy="155" rx="22" ry="6" fill="#1a1208"/>
       <ellipse cx="200" cy="150" rx="14" ry="4" fill="#2a3a44" opacity="0.5"/>` +
      survivor(140, 178, { tone: "fire" }) +
      survivor(260, 178, { tone: "fire", named: "maya", flip: true }),

    perimeter: () => BG.fenceForest() +
      `<rect x="80" y="60" width="40" height="100" fill="#1a1208" stroke="#2a1c10" stroke-width="2"/>
       <rect x="78" y="58" width="44" height="6" fill="#3a2818"/>
       <line x1="100" y1="160" x2="100" y2="60" stroke="#2a1c10" stroke-width="1"/>` +
      survivor(100, 80, { scale: 0.6, tone: "cool" }) +
      survivor(220, 178, { tone: "cool" }) +
      survivor(280, 178, { tone: "cool", named: "maya", flip: true }),

    briefing_tent: () => `<rect width="400" height="200" fill="#0d0a06"/>
      <polygon points="0,200 400,200 400,40 200,15 0,40" fill="#231609"/>
      <polygon points="0,200 400,200 400,50 200,25 0,50" fill="#1a0f06" opacity="0.6"/>
      <rect x="180" y="120" width="40" height="55" fill="#1a1208" rx="2"/>
      <rect x="178" y="115" width="44" height="8" fill="#3a2818"/>
      <ellipse cx="200" cy="100" rx="80" ry="40" fill="url(#lampGlow)" opacity="0.5"/>
      ${survivor(120, 178, { named: "ellis" })}
      ${survivor(280, 178, { named: "vega", flip: true })}`,

    hospital_ext: () => `<rect width="400" height="200" fill="url(#skyDusk)"/>
      ${ruinedBuilding(60, 30, 280, 130, { tone: "#15110b" })}
      <rect x="170" y="120" width="60" height="40" fill="#0a0805"/>
      <rect x="172" y="115" width="56" height="6" fill="#5a1818"/>
      <text x="200" y="108" text-anchor="middle" font-size="9" fill="#7a2020" font-family="serif">+</text>
      <rect y="160" width="400" height="40" fill="#0a0604"/>
      ${survivor(140, 178, { tone: "warm" })}
      ${survivor(180, 178, { tone: "warm", named: "maya", flip: true })}`,

    hospital_lobby: () => `<rect width="400" height="200" fill="#0a0c10"/>
      <rect y="0" width="400" height="160" fill="#10141a"/>
      <rect y="160" width="400" height="40" fill="#06080a"/>
      <rect x="40" y="90" width="320" height="6" fill="#1a2028"/>
      <rect x="60" y="96" width="40" height="40" fill="#1a2028"/>
      <rect x="120" y="96" width="40" height="40" fill="#1a2028"/>
      <rect x="240" y="96" width="40" height="40" fill="#1a2028"/>
      <rect x="300" y="96" width="40" height="40" fill="#1a2028"/>
      <rect x="180" y="40" width="40" height="50" fill="#0a0c10" stroke="#2a3038"/>
      <ellipse cx="200" cy="80" rx="100" ry="35" fill="url(#lampGlow)" opacity="0.3"/>
      ${survivor(160, 178, { tone: "cool" })}
      ${survivor(240, 178, { tone: "cool", named: "maya", flip: true })}`,

    pharmacy_fight: () => BG.grocery() +
      zombie(160, 178, { tone: "cool", variant: "walker" }) +
      zombie(220, 178, { tone: "cool", variant: "runner", flip: true }) +
      survivor(80, 178, { tone: "cool" }),

    gate_ajar_night: () => BG.fenceForest() +
      `<g transform="translate(170,155) rotate(-22 0 -90)">
         <rect x="-4" y="-90" width="3" height="90" fill="#241c12"/>
         <rect x="60" y="-90" width="3" height="90" fill="#241c12"/>
         ${"".concat(...Array.from({length: 12}, (_, i) =>
           `<line x1="0" y1="${-i*7}" x2="60" y2="${-i*7}" stroke="#3a2c1c" stroke-width="0.5"/>` +
           `<line x1="${i*5}" y1="0" x2="${i*5}" y2="-84" stroke="#3a2c1c" stroke-width="0.5"/>`))}
       </g>` +
      survivor(280, 178, { tone: "cool" }),

    confront_traitor: () => BG.fenceForest() +
      survivor(140, 178, { tone: "cool" }) +
      survivor(260, 178, { tone: "cool", flip: true, jacket: "#3a2820" }),

    rooftop_dawn: () => BG.bloodDawn() +
      `<polygon points="0,200 400,200 400,140 0,140" fill="#1a1208"/>
       <rect x="0" y="140" width="400" height="6" fill="#2a1c10"/>
       <rect x="80" y="100" width="20" height="40" fill="#1a1208"/>
       <rect x="320" y="80" width="20" height="60" fill="#1a1208"/>` +
      survivor(180, 140, { tone: "fire" }) +
      survivor(220, 140, { tone: "fire", named: "maya", flip: true }),

    death: () => `<rect width="400" height="200" fill="#0a0404"/>
      <rect width="400" height="200" fill="url(#bloodHaze)"/>
      <ellipse cx="200" cy="180" rx="80" ry="8" fill="#3a0808"/>
      <text x="200" y="100" text-anchor="middle" fill="#5a1818" font-size="48" font-family="serif" font-weight="900" opacity="0.7">✝</text>`,
  };

  // ---------- public render ----------
  // Extracts CHAR markers from the SVG body and renders characters as
  // absolutely-positioned HTML divs (so emoji always render correctly).
  function render(sceneId) {
    const fn = SCENES[sceneId];
    let body = fn ? fn() : BG.nightCity();

    const chars = [];
    body = body.replace(
      /<!--CHAR\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)\|([^|]+)-->/g,
      (_, glyph, x, y, size, anim, flip) => {
        chars.push({ glyph, x: +x, y: +y, size: +size, anim, flip: flip === "1" });
        return "";
      }
    );

    const charLayer = chars.map(c => {
      const leftPct = (c.x / 400) * 100;
      const topPct  = (c.y / 200) * 100;
      const sizePct = (c.size / 200) * 100; // size relative to 200-unit viewBox height
      const sx = c.flip ? -1 : 1;
      const wrap =
        `position:absolute;left:${leftPct}%;top:${topPct}%;` +
        `transform:translate(-50%,-100%);font-size:${sizePct}cqh;line-height:1;` +
        `--flip:${sx};filter:drop-shadow(0 2px 3px rgba(0,0,0,0.75));`;
      return `<div class="char-emoji anim-${c.anim}" style="${wrap}">${c.glyph}</div>`;
    }).join("");

    return `<div class="scene-stage">` +
      `<svg class="scene-svg" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice">${DEFS}${body}</svg>` +
      `<div class="char-layer">${charLayer}</div>` +
      `</div>`;
  }

  return { render, SCENES };
})();

