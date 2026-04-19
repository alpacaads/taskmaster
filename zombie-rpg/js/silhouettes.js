// Combat silhouettes — horror-movie cut-outs.
// Shapes are deliberately broken: cocked heads, matted hair, uneven
// shoulders, long dangling claw-arms, tattered hems. Each figure is
// positioned as a near-full-height looming menace over the backdrop.
//
// States animated via CSS on the wrapping .enemy-silhouette:
//   .idle   - slow sway + occasional head twitch (default)
//   .lunge  - snap forward + step-in (enemy attacks)
//   .hit    - horizontal judder + flash (player lands a blow)
//   .die    - slump + rotate + fade (enemy defeated)
window.Silhouettes = (function () {

  const BODY  = "#04060a";
  const RIM   = "rgba(230,227,216,0.14)";
  const CLOTH = "#0a0d12";

  function wrap(inner, opts = {}) {
    const viewBox = opts.viewBox || "0 0 280 360";
    return (
      `<svg class="enemy-silhouette-svg" viewBox="${viewBox}" ` +
      `preserveAspectRatio="xMidYEnd meet" aria-hidden="true">` +
      `<defs>
        <radialGradient id="silFloor" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stop-color="rgba(0,0,0,0.9)"/>
          <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
        </radialGradient>
      </defs>` +
      `<ellipse class="sil-shadow" cx="140" cy="342" rx="96" ry="10" fill="url(#silFloor)"/>` +
      inner +
      `</svg>`
    );
  }

  // Put the whole figure in one <g class="sil-body"> so the animations
  // transform the silhouette as a unit.
  function body(paths) {
    return (
      `<g class="sil-body" fill="${BODY}" stroke="${RIM}" stroke-width="1.1" stroke-linejoin="miter">` +
      paths +
      `</g>`
    );
  }

  // --- helpers ---
  // Jagged crown of hair — a little different each time via the caller.
  function hair(cx, cy, spread) {
    const p = [];
    const n = 9;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const x = cx - spread + t * spread * 2;
      const y = cy - 18 - Math.sin(t * Math.PI) * 24 + (i % 2 === 0 ? 4 : 0);
      p.push(`${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    p.push(`L ${cx + spread} ${cy} L ${cx - spread} ${cy} Z`);
    return `<path d="${p.join(" ")}"/>`;
  }

  // Claw-hand: five jagged fingers splayed downward or out.
  function claw(x, y, dir, scale) {
    const s = scale || 1;
    const d = dir || 1; // 1 = right-handed, -1 = left
    const f = [];
    for (let i = 0; i < 5; i++) {
      const dx = (i - 2) * 3 * s;
      const dy = 14 * s + (i === 2 ? 3 * s : 0);
      f.push(`M ${x + dx * d} ${y} L ${x + (dx + 1.5 * d) * d} ${y + dy} L ${x + (dx - 1.5 * d) * d} ${y + dy - 2} Z`);
    }
    return `<path d="${f.join(" ")}"/>`;
  }

  // =========================================================
  //  WALKER — adult zombie: broken posture, long right claw
  // =========================================================
  const walker = body(
    hair(128, 58, 30) +
    // head (tilted right)
    `<g transform="rotate(-12 132 78)">` +
      `<ellipse cx="132" cy="78" rx="26" ry="30"/>` +
      // jaw line (hanging)
      `<path d="M 120 96 Q 132 118 146 104 L 146 100 L 118 100 Z" fill="${CLOTH}"/>` +
    `</g>` +
    // neck (short, exposed)
    `<path d="M 118 106 L 148 108 L 146 128 L 120 126 Z"/>` +
    // tattered torso (asymmetric — left shoulder higher)
    `<path d="M 86 124 L 104 120 L 116 128 L 152 128 L 168 122 L 180 138 Q 184 220 172 262 L 176 282 L 150 268 L 128 276 L 104 266 L 88 278 Q 76 218 86 124 Z"/>` +
    // ragged cloth flap over stomach
    `<path d="M 112 208 L 118 244 L 124 216 L 138 248 L 148 212 L 158 242 L 162 210 Z" fill="${CLOTH}"/>` +
    // left arm (bent up, menacing)
    `<path d="M 94 140 L 64 188 L 60 224 L 78 226 L 90 192 L 104 168 Z"/>` +
    claw(58, 228, -1, 1.1) +
    // right arm (LONG, dangling claw past hips)
    `<path d="M 176 142 L 206 204 L 218 272 L 236 298 L 218 302 L 204 282 L 194 268 L 182 218 L 168 172 Z"/>` +
    claw(226, 302, 1, 1.2) +
    // left leg (forward stride)
    `<path d="M 108 272 L 96 334 L 120 338 L 128 276 Z"/>` +
    // right leg (planted, uneven)
    `<path d="M 148 272 L 154 336 L 172 334 L 164 268 Z"/>`
  );

  // =========================================================
  //  WALKER_CHO — old woman: hunched, long nightgown, no legs visible
  // =========================================================
  const walker_cho = body(
    // stringy hair drooping down past shoulders
    `<path d="M 108 60 L 100 72 L 94 96 L 88 138 L 80 172 L 88 176 L 98 140 L 108 108 L 116 82 Z"/>` +
    `<path d="M 154 60 L 162 74 L 172 102 L 182 140 L 186 174 L 174 176 L 166 142 L 158 110 L 152 86 Z"/>` +
    hair(132, 66, 28) +
    // head (tilted forward, chin down)
    `<ellipse cx="132" cy="78" rx="22" ry="25" transform="rotate(-8 132 78)"/>` +
    // hunched back
    `<path d="M 100 108 Q 82 186 96 242 L 176 244 Q 194 192 176 106 Q 160 98 140 98 Q 116 98 100 108 Z"/>` +
    // long nightgown (trails to floor)
    `<path d="M 90 232 L 72 316 L 88 330 L 110 322 L 132 330 L 152 322 L 174 330 L 192 314 L 180 230 Z"/>` +
    // ragged hem
    `<path d="M 72 316 L 86 308 L 96 318 L 106 306 L 120 316 L 130 304 L 144 318 L 156 308 L 168 318 L 180 306 L 192 314 L 180 330 L 72 330 Z" fill="${CLOTH}"/>` +
    // left arm (dangling)
    `<path d="M 100 120 L 76 198 L 82 238 L 96 238 L 108 200 Z"/>` +
    claw(80, 238, -1, 1) +
    // right arm (dangling)
    `<path d="M 174 120 L 196 202 L 190 244 L 176 244 L 166 204 Z"/>` +
    claw(196, 244, 1, 1)
  );

  // =========================================================
  //  WALKER_PAIR — two overlapping twisted figures
  // =========================================================
  const walker_pair = body(
    // back figure (taller, offset right)
    `<g transform="translate(24 -8)">` +
      hair(150, 58, 26) +
      `<ellipse cx="150" cy="80" rx="22" ry="26" transform="rotate(10 150 80)"/>` +
      `<path d="M 126 110 L 172 110 L 180 148 Q 188 220 176 276 L 128 272 Q 114 216 124 148 Z"/>` +
      `<path d="M 126 128 L 108 196 L 116 236 L 126 234 Z"/>` +
      `<path d="M 180 128 L 198 210 L 206 256 L 194 258 L 184 218 Z"/>` +
      claw(200, 256, 1, 0.9) +
    `</g>` +
    // front figure (shorter, offset left, head cocked opposite way)
    `<g transform="translate(-20 16)">` +
      hair(108, 72, 24) +
      `<ellipse cx="108" cy="90" rx="20" ry="23" transform="rotate(-14 108 90)"/>` +
      `<path d="M 88 118 L 128 118 L 138 158 Q 144 228 130 286 L 86 284 Q 76 224 84 158 Z"/>` +
      // long left claw arm
      `<path d="M 86 132 L 58 196 L 50 258 L 64 264 L 74 216 L 90 172 Z"/>` +
      claw(56, 264, -1, 1.1) +
      `<path d="M 138 132 L 162 184 L 164 226 L 150 230 L 140 198 Z"/>` +
      // legs
      `<path d="M 92 284 L 80 338 L 102 338 L 110 284 Z"/>` +
      `<path d="M 118 284 L 122 338 L 140 338 L 132 284 Z"/>` +
    `</g>`
  );

  // =========================================================
  //  RUNNER — aggressive forward-lean, arms thrown back, mid-sprint
  // =========================================================
  const runner = body(
    // streaming hair back
    `<path d="M 114 52 L 82 44 L 62 54 L 78 68 L 102 74 Z"/>` +
    `<path d="M 120 46 L 98 36 L 80 40 L 98 52 Z"/>` +
    // head (tilted hard forward)
    `<ellipse cx="124" cy="82" rx="22" ry="24" transform="rotate(-30 124 82)"/>` +
    // open howling mouth
    `<path d="M 114 92 L 138 100 L 132 110 L 118 106 Z" fill="${CLOTH}"/>` +
    // torso leaning forward
    `<path d="M 98 108 Q 88 168 130 210 L 178 194 Q 180 134 158 102 Z"/>` +
    // back arm trailing
    `<path d="M 102 120 L 62 170 L 40 208 L 56 220 L 80 196 L 112 160 Z"/>` +
    claw(40, 220, -1, 1) +
    // front arm reaching toward camera
    `<path d="M 162 110 L 218 156 L 246 200 L 226 208 L 206 196 L 172 156 Z"/>` +
    claw(246, 208, 1, 1.3) +
    // back leg (pushed off)
    `<path d="M 112 208 L 72 270 L 88 294 L 120 232 Z"/>` +
    // front leg (driving forward)
    `<path d="M 150 202 L 178 274 L 212 274 L 184 208 Z"/>`
  );

  // =========================================================
  //  BLOATER — massive, asymmetric, grotesque mass
  // =========================================================
  const bloater = body(
    // lumpy head — off-center, second lump above right
    `<ellipse cx="128" cy="80" rx="30" ry="28"/>` +
    `<ellipse cx="148" cy="64" rx="12" ry="10"/>` +
    // hanging tongue/jaw mess
    `<path d="M 116 104 L 132 130 L 144 108 Z" fill="${CLOTH}"/>` +
    // BLOATED torso with asymmetric bulges
    `<path d="M 76 116 Q 46 182 64 240 L 90 258 Q 100 260 136 258 Q 186 260 210 250 Q 230 190 208 122 Q 178 96 138 96 Q 104 96 76 116 Z"/>` +
    // extra growth on left
    `<ellipse cx="62" cy="172" rx="18" ry="22"/>` +
    // extra growth on right shoulder
    `<ellipse cx="216" cy="148" rx="14" ry="16"/>` +
    // short bloated arms
    `<path d="M 74 140 L 44 210 L 50 252 L 70 254 L 80 216 Z"/>` +
    claw(50, 252, -1, 0.9) +
    `<path d="M 214 140 L 242 210 L 236 252 L 216 254 L 206 216 Z"/>` +
    claw(238, 252, 1, 0.9) +
    // stubby legs, buckling
    `<path d="M 102 254 L 90 328 L 122 330 L 128 256 Z"/>` +
    `<path d="M 156 254 L 166 330 L 194 328 L 180 254 Z"/>`
  );

  // =========================================================
  //  BANDIT — human, rifle at hip, imposing
  // =========================================================
  const bandit = (() => {
    const silhouette = body(
      // knit cap
      `<path d="M 108 48 L 148 48 L 152 68 L 104 68 Z"/>` +
      // head
      `<ellipse cx="128" cy="78" rx="20" ry="22"/>` +
      // scruff beard shadow
      `<path d="M 114 92 L 142 92 L 138 100 L 118 100 Z" fill="${CLOTH}"/>` +
      // neck
      `<path d="M 118 98 L 138 98 L 138 110 L 118 110 Z"/>` +
      // heavy coat torso (wider shoulders)
      `<path d="M 86 112 L 100 108 L 124 114 L 140 114 L 156 108 L 172 112 L 182 132 Q 184 220 170 262 L 88 264 Q 76 222 76 132 Z"/>` +
      // belt line
      `<path d="M 80 200 L 178 200 L 178 210 L 80 210 Z" fill="${CLOTH}"/>` +
      // arms (holding rifle across body)
      `<path d="M 86 128 L 66 190 L 80 228 L 98 226 L 106 192 Z"/>` +
      `<path d="M 172 128 L 192 190 L 178 228 L 160 226 L 152 192 Z"/>` +
      // legs (cargo pants)
      `<path d="M 96 262 L 88 336 L 120 336 L 124 264 Z"/>` +
      `<path d="M 138 262 L 142 336 L 170 336 L 164 264 Z"/>`
    );
    // rifle held across torso — separate so it sits above body fill
    const rifle =
      `<g transform="rotate(-20 128 184)" fill="#0a0d12" stroke="${RIM}" stroke-width="0.8">` +
        // stock
        `<rect x="60" y="178" width="46" height="10" rx="1"/>` +
        // receiver
        `<rect x="106" y="180" width="34" height="8"/>` +
        // barrel
        `<rect x="140" y="182" width="70" height="5"/>` +
        // magazine
        `<rect x="118" y="188" width="10" height="16"/>` +
      `</g>`;
    return silhouette + rifle;
  })();

  // =========================================================
  //  HORDE — receding crowd of varied menacing figures
  // =========================================================
  const horde = (() => {
    function fig(x, y, s, o, tilt) {
      return (
        `<g transform="translate(${x} ${y}) scale(${s}) rotate(${tilt || 0})" opacity="${o}">` +
          // hair tufts
          `<path d="M -14 -100 L -22 -110 L -18 -94 L -10 -108 L -6 -96 L 2 -110 L 6 -96 L 14 -108 L 12 -94 L 20 -110 L 14 -100 L 20 -86 L -20 -86 Z"/>` +
          // head
          `<ellipse cx="0" cy="-78" rx="18" ry="22"/>` +
          // torso
          `<path d="M -22 -54 Q -26 24 -12 80 L 14 80 Q 26 24 22 -54 L 10 -58 L -10 -58 Z"/>` +
          // left arm (dangling)
          `<path d="M -22 -50 L -36 10 L -28 56 L -18 56 L -12 16 Z"/>` +
          // right arm
          `<path d="M 22 -50 L 36 14 L 28 60 L 18 60 L 12 20 Z"/>` +
        `</g>`
      );
    }
    return body(
      // distant silhouettes first (smaller, fainter)
      fig(42, 292, 0.42, 0.35,  4) +
      fig(240, 288, 0.44, 0.38, -5) +
      fig(96, 282, 0.55, 0.55,  2) +
      fig(188, 284, 0.55, 0.55, -4) +
      fig(72, 312, 0.72, 0.75,  3) +
      fig(220, 314, 0.74, 0.78, -6) +
      // mid
      fig(122, 316, 0.9, 0.9,  -3) +
      fig(170, 318, 0.95, 0.92, 4) +
      // front figure (closest, full colour)
      fig(146, 340, 1.15, 1,    0)
    );
  })();

  const FOR = {
    walker:      wrap(walker),
    walker_cho:  wrap(walker_cho),
    walker_pair: wrap(walker_pair),
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
