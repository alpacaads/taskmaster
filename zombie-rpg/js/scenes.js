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

  // ---- Detailed graphic-novel-style characters (proof of concept) ----
  // Drawn in a 100x200 local viewBox, transformed into scene coordinates.
  function mayaPortrait(x, y, opts = {}) {
    const { scale = 1, flip = false, anim = "breathe" } = opts;
    // y is feet position; height is ~75 in scene units, anchored at feet.
    const height = 75 * scale;
    const width  = 36 * scale;
    const tx = x - width / 2;
    const ty = y - height;
    const sx = flip ? -1 : 1;
    const transform = `translate(${tx + width/2},${ty}) scale(${(width/100) * sx},${height/200}) translate(-50,0)`;
    return `<g class="svg-char svg-anim-${anim}" transform="${transform}">
      <ellipse cx="50" cy="198" rx="22" ry="3" fill="#000" opacity="0.55"/>
      <path d="M 35 195 L 38 130 L 47 130 L 45 195 Z" fill="#100c08"/>
      <path d="M 53 195 L 55 130 L 64 130 L 62 195 Z" fill="#100c08"/>
      <ellipse cx="40" cy="195" rx="10" ry="4" fill="#050302"/>
      <ellipse cx="60" cy="195" rx="10" ry="4" fill="#050302"/>
      <rect x="33" y="125" width="34" height="7" fill="#0a0604"/>
      <rect x="48" y="123" width="4" height="11" fill="#3a2818"/>
      <rect x="62" y="128" width="3" height="14" fill="#2a2218"/>
      <rect x="60.5" y="142" width="6" height="9" fill="#3a3a3a"/>
      <path d="M 36 78 L 30 132 L 38 132 L 42 78 Z" fill="#2a2a30"/>
      <path d="M 64 78 L 70 132 L 62 132 L 58 78 Z" fill="#2a2a30"/>
      <path d="M 32 80 L 26 132 L 38 132 L 41 80 Z" fill="#3d4a2a"/>
      <path d="M 68 80 L 74 132 L 62 132 L 59 80 Z" fill="#3d4a2a"/>
      <path d="M 32 80 L 26 132 L 30 132 L 36 80 Z" fill="#283520"/>
      <path d="M 68 80 L 74 132 L 70 132 L 64 80 Z" fill="#283520"/>
      <path d="M 36 78 L 50 92 L 64 78 L 62 86 L 50 96 L 38 86 Z" fill="#283520"/>
      <path d="M 26 80 Q 18 105 22 134 L 33 134 L 36 105 L 32 80 Z" fill="#3d4a2a"/>
      <path d="M 74 80 Q 82 105 78 134 L 67 134 L 64 105 L 68 80 Z" fill="#3d4a2a"/>
      <path d="M 26 80 Q 18 105 22 134 L 26 134 L 28 105 L 27 80 Z" fill="#283520"/>
      <ellipse cx="22" cy="135" rx="5" ry="6" fill="#caa382"/>
      <ellipse cx="78" cy="135" rx="5" ry="6" fill="#caa382"/>
      <rect x="43" y="66" width="14" height="14" fill="#caa382"/>
      <path d="M 43 66 L 57 66 L 55 80 L 45 80 Z" fill="#a8866a"/>
      <ellipse cx="50" cy="50" rx="16" ry="19" fill="#caa382"/>
      <path d="M 35 50 L 35 60 Q 36 56 38 53 Q 36 48 36 42 Q 38 32 50 30 Q 64 32 65 44 Q 66 52 64 58 L 67 64 Q 64 50 60 46 Q 50 40 42 46 Q 36 56 35 65 Z" fill="#7a2e10"/>
      <path d="M 60 38 Q 70 50 67 70 Q 64 76 60 78 Q 64 60 62 48 Z" fill="#5a1f08"/>
      <path d="M 35 50 Q 33 64 36 78 L 39 76 Q 37 64 39 54 Z" fill="#9a3a14"/>
      <ellipse cx="42" cy="42" rx="3" ry="1.5" fill="#0a0604" opacity="0.7"/>
      <ellipse cx="58" cy="42" rx="3" ry="1.5" fill="#0a0604" opacity="0.7"/>
      <path d="M 41 51 Q 44 50 47 51" stroke="#0a0604" stroke-width="0.8" fill="none" stroke-linecap="round"/>
      <path d="M 53 51 Q 56 50 59 51" stroke="#0a0604" stroke-width="0.8" fill="none" stroke-linecap="round"/>
      <path d="M 50 56 L 49 60 L 51 60 Z" fill="#a08266"/>
      <path d="M 46 64 Q 50 65 54 64" stroke="#5a2010" stroke-width="0.9" fill="none" stroke-linecap="round"/>
      <path d="M 60 75 Q 70 78 75 95" stroke="#7a8854" stroke-width="0.7" fill="none" opacity="0.7"/>
      <path d="M 65 35 Q 67 32 67 28" stroke="#7a8854" stroke-width="0.6" fill="none" opacity="0.6"/>
    </g>`;
  }

  function ellisPortrait(x, y, opts = {}) {
    const { scale = 1, flip = false, anim = "breathe" } = opts;
    const height = 78 * scale;
    const width  = 38 * scale;
    const tx = x - width / 2;
    const ty = y - height;
    const sx = flip ? -1 : 1;
    const transform = `translate(${tx + width/2},${ty}) scale(${(width/100) * sx},${height/200}) translate(-50,0)`;
    return `<g class="svg-char svg-anim-${anim}" transform="${transform}">
      <ellipse cx="50" cy="198" rx="22" ry="3" fill="#000" opacity="0.55"/>
      <path d="M 36 195 L 39 130 L 47 130 L 45 195 Z" fill="#0a0a08"/>
      <path d="M 53 195 L 55 130 L 64 130 L 61 195 Z" fill="#0a0a08"/>
      <ellipse cx="40" cy="195" rx="10" ry="4" fill="#040302"/>
      <ellipse cx="60" cy="195" rx="10" ry="4" fill="#040302"/>
      <rect x="34" y="124" width="32" height="8" fill="#0a0604"/>
      <path d="M 34 78 L 28 132 L 72 132 L 66 78 Z" fill="#1c2a3a"/>
      <path d="M 34 78 L 28 132 L 36 132 L 40 78 Z" fill="#14202c"/>
      <path d="M 66 78 L 72 132 L 64 132 L 60 78 Z" fill="#14202c"/>
      <path d="M 28 80 Q 22 105 25 134 L 35 134 L 38 105 L 34 80 Z" fill="#1c2a3a"/>
      <path d="M 72 80 Q 78 105 75 134 L 65 134 L 62 105 L 66 80 Z" fill="#1c2a3a"/>
      <path d="M 38 80 L 50 92 L 62 80 L 60 88 L 50 96 L 40 88 Z" fill="#0e1620"/>
      <rect x="46" y="86" width="8" height="6" fill="#a82820"/>
      <rect x="49" y="84" width="2" height="10" fill="#a82820"/>
      <ellipse cx="25" cy="135" rx="5" ry="6" fill="#b88860"/>
      <rect x="20" y="118" width="3" height="22" fill="#5a4a3a"/>
      <rect x="18" y="114" width="7" height="6" fill="#3a3a40"/>
      <ellipse cx="75" cy="135" rx="5" ry="6" fill="#b88860"/>
      <rect x="44" y="66" width="12" height="14" fill="#b88860"/>
      <path d="M 44 66 L 56 66 L 55 80 L 45 80 Z" fill="#8a6448"/>
      <ellipse cx="50" cy="52" rx="14" ry="17" fill="#b88860"/>
      <path d="M 36 50 Q 36 38 50 36 Q 64 38 64 50 L 64 44 Q 60 38 50 38 Q 40 38 36 44 Z" fill="#1a1208"/>
      <path d="M 38 44 Q 50 41 62 44 L 60 47 Q 50 44 40 47 Z" fill="#0a0604"/>
      <ellipse cx="43" cy="52" rx="2" ry="1.5" fill="#0a0604"/>
      <ellipse cx="57" cy="52" rx="2" ry="1.5" fill="#0a0604"/>
      <path d="M 41 49 L 46 49" stroke="#1a1208" stroke-width="0.7"/>
      <path d="M 54 49 L 59 49" stroke="#1a1208" stroke-width="0.7"/>
      <path d="M 50 56 L 49 60 L 51 60 Z" fill="#8a6448"/>
      <path d="M 46 65 L 54 65" stroke="#3a1a08" stroke-width="0.8" stroke-linecap="round"/>
      <path d="M 40 50 L 38 78" stroke="#1a1208" stroke-width="0.4" opacity="0.5"/>
      <path d="M 60 75 Q 70 80 76 100" stroke="#3a4a5a" stroke-width="0.7" fill="none" opacity="0.7"/>
    </g>`;
  }

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
    if (named === "ren")   glyph = "👩‍⚕️";
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

    meet_maya: () => imageScene(
      "cinematic still from a post-apocalyptic survival horror video game, " +
      "tense first meeting between two strangers in a dim concrete stairwell " +
      "of a rundown apartment building at night, a tough woman in a faded " +
      "army jacket cautiously holding out a crowbar toward a wary man with " +
      "a flashlight, dust suspended in the flashlight beam, peeling paint, " +
      "dripping water, claustrophobic, moody chiaroscuro lighting, " +
      "photorealistic, in the style of The Last of Us, 16:9 widescreen, no text",
      { seed: 2206 }
    ),

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

  // ---------- AI image prompts (per scene id) ----------
  // Each prompt depicts the specific story moment. Style stays consistent:
  // photorealistic, cinematic, post-apocalyptic, The Last of Us / The Road tone.
  const STYLE_SUFFIX =
    ", photorealistic, cinematic, dramatic chiaroscuro lighting, " +
    "in the style of The Last of Us video game, gritty, 16:9 widescreen, " +
    "highly detailed, no text, no logo, no watermark";

  // Images are served from the same origin as the game HTML.
  // GitHub Pages serves them directly with correct MIME types and no
  // sandbox CSP, so relative paths work reliably.
  const IMG_BASE = "images/";
  // Smart cache-bust: only applied to scenes the admin has marked as
  // recently committed. Normal (unchanged) scenes keep using the
  // browser's HTTP cache for speed.
  //
  // dl_committed_overrides is written by admin.html on every successful
  // commit as { sceneId: timestampMs }. We read it here and append the
  // scene's timestamp as ?v=... to force Safari past its 10-minute
  // Cache-Control: max-age=600 on just that file.
  function readCommitTimes() {
    try { return JSON.parse(localStorage.getItem("dl_committed_overrides") || "{}") || {}; }
    catch (e) { return {}; }
  }
  function globalCacheBust() {
    try { return localStorage.getItem("dl_game_cache_bust") || ""; }
    catch (e) { return ""; }
  }
  function imgUrlFor(sceneId) {
    const perScene = readCommitTimes()[sceneId];
    const global = globalCacheBust();
    const v = perScene || global;
    return IMG_BASE + sceneId + ".jpg" + (v ? "?v=" + v : "");
  }
  const PROMPTS = {
    intro:               "ruined city skyline at night, military helicopter flying away into the distance, abandoned skyscrapers, smoke rising, broken cars on the street, lone hooded survivor watching from a rooftop, faint moonlight",
    apt_hallway:         "dark narrow apartment building hallway at night, single flickering ceiling bulb, dried blood streak on the floor leading away, peeling wallpaper, ajar door with chain dangling, claustrophobic horror atmosphere",
    neighbour_apt:       "cluttered small apartment interior at night, elderly woman slumped in an armchair facing away, pantry shelves with canned food, medical bag on a counter, dim warm lamp light, suspended dust motes",
    neighbour_wake:      "horror still, elderly woman zombie rising from an armchair lunging forward with milky white eyes, mouth open, tattered nightgown, dim apartment interior, motion blur, shocking moment",
    stairwell:           "concrete apartment stairwell descending into darkness at night, single shaky flashlight beam from above illuminating dust and water dripping, pitch black below, claustrophobic horror, oppressive silence",
    meet_maya:           "tense first meeting between two strangers in a dim concrete stairwell of a rundown apartment building at night, a tough woman in a faded army jacket cautiously holding out a crowbar toward a wary man with a flashlight, dust suspended in the flashlight beam, peeling paint, dripping water, claustrophobic, moody chiaroscuro lighting",
    alone_street:        "empty post-apocalyptic city street at night, abandoned cars choking the road, a single shambling zombie silhouette between the wrecks, dim sodium streetlamp, fog, moonlight, oppressive stillness",
    street_plan:         "two survivors crouched behind an abandoned car at night, woman in army jacket pointing toward a corner store across a rubble-strewn street, dim flashlight, tense planning moment, gritty",
    grocery_front:       "dark abandoned supermarket entrance at night, jammed automatic glass doors, two zombies lurching out past tipped shopping carts, broken neon sign, flickering interior fluorescent light, blood smears on glass",
    grocery_exterior:    "back loading dock of an abandoned supermarket at night, rusted back door hanging off one hinge, dumpsters and scattered crates, dim sodium light from a distant streetlamp, fog, oppressive silence, atmospheric horror",
    grocery_inside:      "dark abandoned supermarket interior, ransacked shelves with scattered cans and broken bottles, lone survivor with a flashlight in the aisle, beam catching dust, dripping ceiling, eerie silence, deep shadows",
    grocery_quick_exit:  "rear loading dock of an abandoned supermarket at night, fast zombie runner emerging from the alley with bared teeth, scattered debris, single flickering security light overhead, motion, danger",
    freezer:             "walk-in freezer of an abandoned supermarket, frosted metal walls and dim interior light, a frightened ten year old girl pressed into the corner gripping a kitchen knife, breath visible in cold air, blood on the floor outside the door",
    road_out:            "long abandoned highway at dawn stretching into the distance, rows of stalled rusting cars, faint sun rising through smog, lone survivor walking with a backpack, hopeful but exhausted, wide cinematic shot",
    road_out_child:      "long abandoned highway at dawn, lone survivor walking hand in hand with a small girl, both with backpacks, rows of stalled cars, sun rising through smog, tender quiet moment, cinematic wide shot",
    ambush:              "tense ambush in dark pine forest at dusk, two rough armed bandits stepping out from behind trees with a shotgun and a rifle aimed at the camera, fog low to the ground, moss-covered logs, threatening atmosphere",
    sacrifice_intro:     "tense moral standoff in pine forest at dusk, exhausted survivor stepping protectively in front of a small girl, two armed bandits hesitating, dramatic confrontation, fog, ground-level light, gritty",
    after_ambush_mercy:  "lone survivor walking away in pine forest at dusk after losing supplies, empty backpack, defeated but alive, fog, soft warm sunset light filtering through trees",
    after_ambush_fight:  "aftermath of a violent fight in pine forest at dusk, survivor standing over fallen bandits, shotgun in hand, blood on the ground, fog, warm sunset light, somber mood",
    greenbelt_gate:      "tall razor-wire-topped chainlink fence at the edge of a pine forest, female sentry in tactical gear aiming a rifle from behind the gate at approaching survivor, watchtower, fortified survivor camp visible inside, dusk warm light, cinematic",
    greenbelt_gate_hero: "tall razor-wire fence at the edge of a forest, exhausted survivor carrying a sleeping young girl on their back approaching a fortified gate, female guard lowering her rifle, warm dusk light, emotional moment",
    greenbelt_in:        "fortified survivor camp at dusk inside a pine forest, canvas tents, central bonfire with stew pot, solar lanterns hanging from ropes, calm community of weary survivors, smoke rising, hope amid ruin, painterly",
    camp_morning:        "fortified survivor camp at sunrise in pine forest, woman captain in tactical gear handing a steaming mug of coffee to a survivor, mist rising, golden hour light, hopeful peaceful moment",
    chore_medbay:        "improvised medbay inside a converted shipping container, calm gentle young woman medic with dark hair tending a small child's bandaged knee while another survivor assists, antiseptic supplies on shelves, acoustic guitar in corner, warm lamp light, intimate quiet caring moment",
    chore_perimeter:     "two survivors on a wooden watchtower at the perimeter of a forest camp, woman in army jacket gripping a rifle scanning the treeline, the other handing her a coffee, golden morning light filtering through pines, quiet companionship",
    chore_kitchen:       "communal outdoor camp kitchen at sunrise, survivor peeling potatoes over a battered iron pot on a campfire, other survivors chatting around tents, warm sunrise light, slice of life moment in the apocalypse",
    chore_done:          "interior of a tactical command tent at dusk, female captain in fatigues spreading a hand-drawn map across a folding table, lit by a hurricane lamp, two survivors leaning in to study a marked hospital, mission briefing, intense focus",
    mission_journey:     "two survivors walking down a desolate countryside road at dusk between abandoned cars, dramatic warm sunset light through trees, quiet conversation, cinematic wide shot, hopeful but tense",
    hospital_arrive:     "ruined hospital exterior at dusk, large red faded medical cross above the entrance, broken windows, wreckage in the parking lot, smoke in the air, two cautious survivors approaching with weapons drawn, oppressive atmosphere",
    pharmacy_combat:     "dark abandoned hospital pharmacy at night, scattered pill bottles on the floor, two zombies lurching out of the shadows between toppled shelves, single flashlight beam, blood smears, intense horror combat moment",
    hospital_lobby:      "dim abandoned hospital lobby at night, two survivors sitting beside each other on a row of cracked plastic waiting chairs, exhausted, faint moonlight through broken windows, vending machine glow, tender quiet moment after violence",
    mission_return:      "fortified survivor camp at dusk, returning survivors handing a medical bag to camp medic, joyful relief, in the background a freshly cut chainlink fence with bolt cutters lying in the grass, ominous detail, warm fading light",
    investigate_traitor: "moonlit gap in a chainlink fence at the edge of a survivor camp, fresh bolt cutters lying in the grass, fresh boot prints in mud leading inward, lone survivor crouched investigating with a flashlight, tense detective moment",
    confront_traitor:    "tense night confrontation at a perimeter fence, lone survivor confronting a panicked man with a fresh black bite mark on his forearm, sleeve pushed up, distant glow of a survivor camp behind them, moonlight, moral horror",
    traitor_aftermath:   "aftermath at a chainlink fence at night, a man's body slumped against the fence, lone survivor standing over him exhaling, distant campfires, moonlight, dust suspended, quiet moral weight",
    bonfire_invite:      "intimate bonfire at night inside a survivor camp, two figures lingering near the fading flames, sparks rising into a starry sky, pine trees silhouetted, warm orange glow on faces, quiet romantic tension",
    romance_maya:        "intimate emotional moment in a dimly lit canvas tent at night, a man and a red-haired woman in an army jacket facing each other very close, her hand on his chest, candlelight glow, soft focus, suggestive but tasteful, deep emotional tone",
    romance_ren:         "intimate emotional moment in a small medbay at night, a single candle on a metal table, two figures sitting close on a cot, hands touching tenderly, soft warm candlelight, suggestive but tasteful, deep emotional tone, vulnerable",
    morning_after_maya:  "soft pre-dawn light inside a canvas tent, a red-haired woman in fatigues kissing a man on the corner of his mouth, a rifle slung over her shoulder, gentle warm light, tender quiet moment before danger",
    morning_after_ren:   "soft pre-dawn light inside a small medbay, young woman medic with messy dark hair handing a steaming mug of coffee to a survivor still in a cot, warm intimate moment, soft focus, painterly",
    horde_warning:       "ominous massive zombie horde at pre-dawn, hundreds of silhouetted shambling figures advancing down an abandoned highway toward a fortified survivor camp, blood red sky, smoke, dread, wide cinematic shot",
    post_horde_win:      "blood-red dawn after a battle, fortified survivor camp behind a battered chainlink fence, smoking bodies of fallen zombies in a field, weary survivors embracing on the wall, hope amid devastation, cinematic emotional",
    post_horde_lose:     "somber sunset memorial scene, simple wooden grave markers in a forest clearing beside a battered survivor camp, lone mourner kneeling, flickering candles in jars, soft golden light, deep grief and quiet reverence",
    post_horde_flee:     "small group of survivors walking single file through a misty pine forest at dawn, leader carrying a flashlight, others carrying packs, smoke from a burning camp visible behind them, somber but determined, cinematic wide shot",
    ending_final_hero:        "blood-red dawn over a fortified survivor camp, lone defender silhouetted on the wall holding a rifle, fallen horde in the field below, hopeful epilogue, cinematic",
    ending_final_fallen:      "candlelit memorial at dusk in a pine forest, simple wooden grave marker with a name carved into it, mourners standing back, golden hour, deep sorrow, painterly",
    ending_final_escape:      "small band of survivors walking down a misty empty highway at dawn, lone leader with a flashlight in front, hopeful new beginning, cinematic wide shot",
    ending_final_lovers:      "two lovers embracing at dawn on a battered fortified wall above a ruined battlefield, blood-red sunrise behind them, weary but alive, deep emotional moment, cinematic",
    ending_final_loverlost:   "lone grieving survivor kneeling at a fresh grave in a pine forest at sunset, candle flickering in a jar, deep sorrow, golden warm light, painterly cinematic",
    ending_final_lovers_road: "two lovers walking hand in hand at the front of a small group of survivors on a misty highway at dawn, hopeful new beginning together, cinematic wide shot",
    death:               "dark blood-red haze, faint silhouette of a fallen body on the ground, faint cross marker in the distance, deep grief, oppressive horror finality, painterly cinematic",
  };

  // ---------- AI image scenes ----------
  // Returns an HTML <img> wrapped in a stage div. The image is generated by
  // Pollinations.ai (free, no auth) using the given prompt + seed.
  function imageURL(prompt, opts = {}) {
    const { width = 768, height = 384, seed = 1, model = "flux" } = opts;
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
      `?width=${width}&height=${height}&seed=${seed}&nologo=true&model=${model}` +
      `&enhance=false`;
  }
  function imageScene(prompt, opts = {}) {
    return `__IMG__${imageURL(prompt, opts)}__/IMG__`;
  }
  function hashSeed(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    return Math.abs(h) % 999983;
  }

  // Build the image scene element. All 50 scenes have committed PNGs in
  // images/, so we no longer fall back to Pollinations AI on error —
  // that fallback used to fire for stale cached 404s and cause the game
  // to show a freshly AI-generated image instead of the committed one.
  // On error now, show a simple placeholder; the image is missing.
  function renderImageScene(sceneId) {
    // Admin override: if the user uploaded a replacement via admin.html,
    // window.__OVERRIDES[sceneId] holds an objectURL for that blob.
    // Lets you preview a new image in-game before committing it.
    const override = (window.__OVERRIDES && window.__OVERRIDES[sceneId]) || null;
    const localUrl = override || imgUrlFor(sceneId);
    const onLoad  = "this.closest('.scene-stage').classList.add('loaded');";
    const onError =
      "var s=this.closest('.scene-stage');" +
      "s.classList.add('loaded','error');" +
      "var e=s.querySelector('.scene-image-error');" +
      "if(e)e.textContent='image failed: '+this.src;" +
      "this.style.display='none';";
    return `<div class="scene-stage scene-image-stage">` +
      `<div class="scene-image-loading">loading…</div>` +
      `<div class="scene-image-error">image missing: ${sceneId}.jpg</div>` +
      `<img class="scene-image" alt="" src="${localUrl}" ` +
      `loading="eager" decoding="async" fetchpriority="high" ` +
      `onload="${onLoad}" onerror="${onError.replace(/"/g, '&quot;')}"/>` +
      `</div>`;
  }

  // Preload a batch of scene images in the background. Called by game.js
  // with the node's choices so the next screens are already cached.
  function preloadScenes(ids) {
    (ids || []).forEach(id => {
      if (!id) return;
      const img = new Image();
      img.decoding = "async";
      img.src = imgUrlFor(id);
    });
  }

  // Expose the resolver so admin.html can use the same URL pattern.
  window.sceneImageURL = imgUrlFor;

  // Public helper: render only the SVG (no AI image) for a scene id.
  function renderSVG(sceneId) {
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
      const sizePct = (c.size / 200) * 100;
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

  // ---------- public render ----------
  // Extracts CHAR markers from the SVG body and renders characters as
  // absolutely-positioned HTML divs (so emoji always render correctly).
  function render(sceneId) {
    // Always render as an AI image scene. The fallback chain inside
    // renderImageScene tries local PNG, then Pollinations flux, then turbo.
    return renderImageScene(sceneId);
    // (Old SVG composition path retained below but unreachable.)
    const fn = SCENES[sceneId];
    let body = fn ? fn() : BG.nightCity();

    // Image scene (AI-generated full-bleed background)
    const imgMatch = body.match(/^__IMG__(.+?)__\/IMG__$/);
    if (imgMatch) {
      const url = imgMatch[1];
      return `<div class="scene-stage scene-image-stage">` +
        `<div class="scene-image-loading">generating scene…</div>` +
        `<img class="scene-image" src="${url}" alt="" ` +
        `onload="this.parentNode.classList.add('loaded')" ` +
        `onerror="this.parentNode.classList.add('error')"/>` +
        `</div>`;
    }

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

  // Preload all scene images in the background, spaced out to avoid
  // rate limits. By the time the player reaches each scene, the image
  // is typically already in the browser HTTP cache.
  function preloadAll({ delayMs = 1500, onProgress } = {}) {
    const ids = Object.keys(PROMPTS);
    let done = 0, failed = 0;
    let cancelled = false;
    function next() {
      if (cancelled) return;
      if (ids.length === 0) {
        if (onProgress) onProgress({ done, failed, total: done + failed, finished: true });
        return;
      }
      const id = ids.shift();
      const seed = hashSeed(id);
      const prompt = PROMPTS[id] + STYLE_SUFFIX;
      const url = imageURL(prompt, { seed, model: "flux" });
      const img = new Image();
      img.decoding = "async";
      let settled = false;
      function settle(ok) {
        if (settled) return;
        settled = true;
        if (ok) done++; else failed++;
        if (onProgress) onProgress({ done, failed, total: done + failed, id, ok });
        setTimeout(next, delayMs);
      }
      img.onload  = () => settle(true);
      img.onerror = () => settle(false);
      img.src = url;
      // Hard timeout so one slow image doesn't stall the queue
      setTimeout(() => settle(false), 45000);
    }
    next();
    return { cancel: () => { cancelled = true; } };
  }

  return { render, renderSVG, preloadAll, preloadScenes, SCENES, PROMPTS };
})();

