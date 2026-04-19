// Combat silhouettes — minimal SVG cut-outs of the enemy, rendered on
// top of the darkened scene backdrop. Each enemy has one figure; we
// animate state via CSS classes on the wrapping .enemy-silhouette:
//   .idle   - gentle sway + breathing (default)
//   .lunge  - tilt forward + step-in (enemy attacks)
//   .hit    - horizontal judder + white flash (player lands a blow)
//   .die    - slump + fade (enemy defeated)
//
// Keep shapes simple; the point is silhouette + motion, not detail.
window.Silhouettes = (function () {

  const RIM_COLOUR = "rgba(230,227,216,0.16)";
  const BODY_COLOUR = "#05070a";

  // Shared wrapper. A viewBox taller than wide feels cinematic and
  // leaves room for wide-stance figures (bandit, pair, horde).
  function wrap(inner, opts = {}) {
    const viewBox = opts.viewBox || "0 0 260 320";
    return (
      `<svg class="enemy-silhouette-svg" viewBox="${viewBox}" ` +
      `preserveAspectRatio="xMidYEnd meet" aria-hidden="true">` +
      `<defs>
        <radialGradient id="silFloor" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stop-color="rgba(0,0,0,0.85)"/>
          <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
        </radialGradient>
      </defs>` +
      // ground shadow
      `<ellipse class="sil-shadow" cx="130" cy="300" rx="80" ry="10" fill="url(#silFloor)"/>` +
      inner +
      `</svg>`
    );
  }

  function styled(path) {
    return `<g class="sil-body" fill="${BODY_COLOUR}" stroke="${RIM_COLOUR}" stroke-width="1.2" stroke-linejoin="round">${path}</g>`;
  }

  // --- humanoid base: standing, slightly slumped ---
  const humanoid = styled(`
    <!-- head -->
    <ellipse cx="130" cy="72" rx="24" ry="26"/>
    <!-- neck -->
    <path d="M 118 94 L 142 94 L 140 108 L 120 108 Z"/>
    <!-- torso -->
    <path d="M 96 108 Q 92 180 104 232 L 156 232 Q 168 180 164 108 Z"/>
    <!-- arms -->
    <path d="M 96 112 L 78 196 L 84 242 L 96 244 L 104 200 Z"/>
    <path d="M 164 112 L 182 196 L 176 242 L 164 244 L 156 200 Z"/>
    <!-- legs -->
    <path d="M 108 232 L 102 294 L 122 294 L 124 232 Z"/>
    <path d="M 136 232 L 138 294 L 158 294 L 152 232 Z"/>
  `);

  // --- hunched (smaller/older) ---
  const hunched = styled(`
    <ellipse cx="130" cy="86" rx="22" ry="24"/>
    <path d="M 120 106 L 140 106 L 138 118 L 122 118 Z"/>
    <!-- rounded back -->
    <path d="M 100 122 Q 90 188 108 238 L 156 238 Q 172 182 156 122 Z"/>
    <path d="M 102 126 L 86 204 L 94 244 L 106 246 L 112 208 Z"/>
    <path d="M 156 126 L 174 206 L 170 244 L 158 246 L 150 208 Z"/>
    <path d="M 110 238 L 102 296 L 122 296 L 126 238 Z"/>
    <path d="M 134 238 L 138 296 L 158 296 L 154 238 Z"/>
  `);

  // --- pair (two overlapping walkers) ---
  const pair = (() => {
    const one = `
      <ellipse cx="98" cy="86" rx="20" ry="22"/>
      <path d="M 90 104 L 106 104 L 104 114 L 92 114 Z"/>
      <path d="M 72 118 Q 66 184 82 232 L 122 232 Q 132 184 126 118 Z"/>
      <path d="M 74 122 L 60 200 L 68 240 L 78 242 L 84 204 Z"/>
      <path d="M 126 122 L 140 200 L 134 240 L 124 242 L 118 204 Z"/>
      <path d="M 84 232 L 76 294 L 96 294 L 100 232 Z"/>
      <path d="M 110 232 L 114 294 L 132 294 L 126 232 Z"/>
    `;
    const two = `
      <ellipse cx="170" cy="80" rx="22" ry="24"/>
      <path d="M 160 100 L 180 100 L 178 112 L 162 112 Z"/>
      <path d="M 140 116 Q 134 182 152 236 L 196 236 Q 206 182 198 116 Z"/>
      <path d="M 142 120 L 128 202 L 134 244 L 146 246 L 152 206 Z"/>
      <path d="M 198 120 L 214 202 L 208 244 L 198 246 L 190 206 Z"/>
      <path d="M 152 236 L 146 296 L 164 296 L 168 236 Z"/>
      <path d="M 178 236 L 180 296 L 196 296 L 192 236 Z"/>
    `;
    return styled(two + one); // back figure then front
  })();

  // --- runner: leaned forward, arms back ---
  const runner = styled(`
    <ellipse cx="118" cy="90" rx="22" ry="24" transform="rotate(-12 118 90)"/>
    <path d="M 108 108 L 126 108 L 126 120 L 110 122 Z"/>
    <path d="M 92 124 Q 94 180 128 216 L 168 200 Q 166 144 152 112 Z"/>
    <!-- front arm reaching -->
    <path d="M 150 118 L 206 168 L 208 188 L 194 188 L 140 148 Z"/>
    <!-- back arm trailing -->
    <path d="M 96 128 L 58 180 L 56 212 L 72 210 L 104 164 Z"/>
    <!-- legs mid-stride -->
    <path d="M 120 214 L 96 270 L 112 282 L 136 222 Z"/>
    <path d="M 150 208 L 170 274 L 188 262 L 162 212 Z"/>
  `);

  // --- bloater: bulky, round, heavy ---
  const bloater = styled(`
    <ellipse cx="130" cy="70" rx="26" ry="24"/>
    <path d="M 118 92 L 142 92 L 146 106 L 114 106 Z"/>
    <!-- bulbous torso -->
    <path d="M 82 110 Q 64 186 92 244 L 168 244 Q 196 186 178 110 Z"/>
    <path d="M 84 116 L 62 210 L 74 252 L 90 254 L 98 214 Z"/>
    <path d="M 176 116 L 198 210 L 186 252 L 170 254 L 162 214 Z"/>
    <path d="M 104 244 L 92 298 L 118 298 L 124 244 Z"/>
    <path d="M 136 244 L 142 298 L 168 298 L 156 244 Z"/>
  `);

  // --- bandit: upright, rifle across body ---
  const bandit = (() => {
    const body = `
      <ellipse cx="130" cy="72" rx="22" ry="24"/>
      <path d="M 120 92 L 140 92 L 138 106 L 122 106 Z"/>
      <path d="M 100 108 L 102 226 L 158 226 L 160 108 Z"/>
      <path d="M 100 114 L 86 196 L 92 238 L 104 238 L 108 200 Z"/>
      <path d="M 160 114 L 174 196 L 168 238 L 156 238 L 152 200 Z"/>
      <path d="M 108 226 L 104 298 L 124 298 L 128 226 Z"/>
      <path d="M 134 226 L 138 298 L 156 298 L 152 226 Z"/>
    `;
    // rifle across torso
    const rifle = `<rect x="80" y="148" width="104" height="6" rx="1" fill="#0a0e14" stroke="${RIM_COLOUR}" stroke-width="0.8" transform="rotate(-18 130 151)"/>`;
    return styled(body) + rifle;
  })();

  // --- horde: many silhouettes receding ---
  const horde = (() => {
    const fig = (cx, cy, s, o) =>
      `<g transform="translate(${cx} ${cy}) scale(${s})" opacity="${o}">` +
        `<ellipse cx="0" cy="-64" rx="18" ry="22"/>` +
        `<path d="M -16 -40 Q -20 28 0 76 L 16 76 Q 24 28 16 -40 Z"/>` +
        `<path d="M -16 -36 L -28 36 L -22 72 L -12 72 L -8 40 Z"/>` +
        `<path d="M 16 -36 L 28 36 L 22 72 L 12 72 L 8 40 Z"/>` +
      `</g>`;
    return styled(
      fig(130, 260, 1.1, 1)     // front centre
      + fig(80, 250, 0.85, 0.9) // mid-left
      + fig(180, 250, 0.85, 0.9) // mid-right
      + fig(50, 230, 0.65, 0.7)
      + fig(210, 230, 0.65, 0.7)
      + fig(110, 220, 0.55, 0.55)
      + fig(150, 220, 0.55, 0.55)
      + fig(30, 210, 0.45, 0.4)
      + fig(230, 210, 0.45, 0.4)
    );
  })();

  // Map enemy id -> silhouette markup.
  const FOR = {
    walker:      wrap(humanoid),
    walker_cho:  wrap(hunched),
    walker_pair: wrap(pair),
    runner:      wrap(runner),
    bloater:     wrap(bloater),
    bandit:      wrap(bandit),
    horde:       wrap(horde),
  };

  function forEnemy(id) {
    return FOR[id] || FOR.walker;
  }

  return { forEnemy };
})();
