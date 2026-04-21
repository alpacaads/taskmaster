// Export every Story node to a Markdown document.
// Usage: node tools/gen_story_md.js > docs/story_flow.md
//
// Loads story.js with mocked browser globals. For function text /
// scene / speaker / next, tries a small set of state permutations and
// reports every distinct result so branching is legible in the export.

const fs = require("fs");
const path = require("path");

// ---- mock browser globals that story.js references ----
global.window = global;
global.Game = {
  toast: () => {},
  giveRandomItem: () => {},
  giveWeapon: () => {},
};
global.Sound = { play: () => {}, setAmbience: () => {} };

// Load story.js into the global scope.
require(path.join(__dirname, "..", "js", "story.js"));

const Story = global.Story || global.window.Story;
if (!Story) {
  console.error("Story not loaded");
  process.exit(1);
}

// ---- helpers ----
function dummyState(overrides = {}) {
  const s = {
    hp: 10, hpMax: 10, stam: 5, stamMax: 5, ammo: 3,
    companion: null, companion2: null,
    flags: {}, bonds: { maya: 0, ren: 0 }, romance: null,
    inventory: [],
  };
  if (overrides.flags) Object.assign(s.flags, overrides.flags);
  if (overrides.companion)  s.companion = overrides.companion;
  if (overrides.companion2) s.companion2 = overrides.companion2;
  if (overrides.romance) s.romance = overrides.romance;
  if (overrides.bonds) Object.assign(s.bonds, overrides.bonds);
  return s;
}

const PERMUTATIONS = [
  { tag: "default", state: {} },
  { tag: "with Maya companion", state: { companion: "Maya", flags: { maya: true } } },
  { tag: "mission partner = maya", state: { flags: { missionPartner: "maya", maya: true } } },
  { tag: "mission partner = ren",  state: { flags: { missionPartner: "ren",  maya: true } } },
  { tag: "solo mission",           state: { flags: { solo_mission: true } } },
  { tag: "saved Nora",             state: { flags: { savedNora: true }, companion2: "Nora" } },
  { tag: "bring Nora on mission",  state: { flags: { bringNora: true, savedNora: true, missionPartner: "maya", maya: true }, companion2: "Nora" } },
  { tag: "rested in car",          state: { flags: { restedInCar: true } } },
  { tag: "told Vega",              state: { flags: { toldVega: true } } },
  { tag: "chore: medbay",          state: { flags: { choreChosen: "medbay", maya: true } } },
  { tag: "chore: perimeter",       state: { flags: { choreChosen: "perimeter", maya: true } } },
  { tag: "chore: kitchen",         state: { flags: { choreChosen: "kitchen", maya: true } } },
  { tag: "exposed traitor",        state: { flags: { exposedTraitor: true, maya: true, savedNora: true } } },
  { tag: "killed traitor",         state: { flags: { killedTraitor: true } } },
  { tag: "romance Maya",           state: { companion: "Maya", flags: { maya: true, lovedMaya: true }, romance: "maya", bonds: { maya: 5 } } },
  { tag: "romance Ren",            state: { flags: { lovedRen: true }, romance: "ren", bonds: { ren: 5 } } },
];

function tryEnumerate(fn, permutations = PERMUTATIONS) {
  const results = new Map(); // output -> [tags]
  for (const p of permutations) {
    let out;
    try { out = fn(dummyState(p.state)); } catch (e) { continue; }
    if (typeof out === "undefined" || out === null) continue;
    const key = typeof out === "string" ? out : JSON.stringify(out);
    if (!results.has(key)) results.set(key, []);
    results.get(key).push(p.tag);
  }
  return [...results.entries()].map(([out, tags]) => ({ out, tags }));
}

function escapeMd(s) {
  return String(s || "")
    .replace(/\r/g, "")
    .replace(/\|/g, "\\|");
}

function fnSource(fn) {
  return String(fn).replace(/\s+/g, " ").trim();
}

function sceneLabel(node) {
  if (typeof node.scene === "function") {
    const variants = tryEnumerate(node.scene);
    return `fn → ${variants.map(v => `\`${v.out}\` _(${v.tags.join(", ")})_`).join(", ")}`;
  }
  if (node.scene) return `\`${node.scene}\``;
  return "(no explicit scene — uses node id)";
}

function speakerLabel(node) {
  if (typeof node.speaker === "function") {
    const variants = tryEnumerate(node.speaker).filter(v => v.out);
    if (!variants.length) return null;
    return variants.map(v => `**${v.out}** _(${v.tags.join(", ")})_`).join(" / ");
  }
  return node.speaker || null;
}

function textBlock(node) {
  if (typeof node.text === "function") {
    const variants = tryEnumerate(node.text).filter(v => typeof v.out === "string" && v.out);
    if (!variants.length) return "_(function text — no resolvable variants)_";
    return variants.map(v =>
      `<details><summary>Variant: ${v.tags.join(" / ")}</summary>\n\n> ${escapeMd(v.out).replace(/\n/g, "\n> ")}\n\n</details>`
    ).join("\n\n");
  }
  if (!node.text) return "";
  return "> " + escapeMd(node.text).replace(/\n/g, "\n> ");
}

function choiceLine(c, i) {
  const parts = [];
  const labelBits = [];
  labelBits.push(`**${c.label || "(unlabeled)"}**`);
  if (c.tag) labelBits.push(`\`${c.tag}\``);
  if (typeof c.require === "function") {
    const ok = tryEnumerate(c.require).filter(v => v.out === true);
    const req = fnSource(c.require);
    labelBits.push(`_require:_ \`${req}\``);
  }
  parts.push(`${i + 1}. ${labelBits.join(" ")}`);

  const effectsAndTargets = [];
  if (typeof c.effect === "function") {
    effectsAndTargets.push(`   - _effect:_ \`${fnSource(c.effect)}\``);
  }
  if (c.combat) {
    if (typeof c.combat === "function") {
      const variants = tryEnumerate(c.combat);
      variants.forEach(v => {
        const cfg = tryParseJson(v.out);
        if (cfg) {
          effectsAndTargets.push(
            `   - ⚔ combat _(${v.tags.join(", ")})_: enemy \`${cfg.enemy}\`` +
            (cfg.risky ? " · risky" : "") +
            (cfg.hp !== undefined ? ` · hp=${cfg.hp}` : "") +
            (cfg.atk ? ` · atk=${JSON.stringify(cfg.atk)}` : "") +
            ` → win \`${cfg.onWin}\`` +
            (cfg.onLose ? ` / lose \`${cfg.onLose}\`` : "")
          );
        }
      });
    } else {
      const cfg = c.combat;
      effectsAndTargets.push(
        `   - ⚔ combat: enemy \`${cfg.enemy}\`` +
        (cfg.risky ? " · risky" : "") +
        ` → win \`${cfg.onWin}\`` +
        (cfg.onLose ? ` / lose \`${cfg.onLose}\`` : "")
      );
    }
  } else if (typeof c.next === "function") {
    const targets = [...new Set(tryEnumerate(c.next).map(v => v.out))];
    if (targets.length) effectsAndTargets.push(`   - → function targets: ${targets.map(t => `\`${t}\``).join(", ")}`);
    else effectsAndTargets.push(`   - → function next (no resolvable target)`);
  } else if (c.next) {
    effectsAndTargets.push(`   - → \`${c.next}\``);
  } else {
    effectsAndTargets.push(`   - _(no destination)_`);
  }
  return [parts.join(" "), ...effectsAndTargets].join("\n");
}

function tryParseJson(s) {
  try { return JSON.parse(s); } catch (e) { return null; }
}

// ---- emit ----
const lines = [];
lines.push(`# Dead Light — Story Flow\n`);
lines.push(`Auto-generated from \`zombie-rpg/js/story.js\`. ${new Date().toISOString().slice(0, 10)}\n`);
lines.push(`One section per story node, in definition order. Function-branching fields (text, scene, speaker, next, combat) are enumerated across a set of common state permutations so every reachable variant is legible.\n`);
lines.push(`---\n`);

const order = Object.keys(Story);
lines.push(`## Node index\n`);
order.forEach(id => {
  const node = Story[id];
  const ch = (node && node.chapter) || "";
  lines.push(`- [\`${id}\`](#${id.replace(/_/g, "_")}) — ${ch}`);
});
lines.push(`\n---\n`);

order.forEach(id => {
  const node = Story[id];
  if (!node) return;
  lines.push(`## <a id="${id.replace(/_/g, "_")}"></a>\`${id}\``);
  if (node.chapter) lines.push(`**Chapter:** ${node.chapter}  `);
  lines.push(`**Scene art:** ${sceneLabel(node)}  `);
  const speaker = speakerLabel(node);
  if (speaker) lines.push(`**Speaker:** ${speaker}  `);
  lines.push("");
  const tb = textBlock(node);
  if (tb) lines.push(tb + "\n");
  const choices = Array.isArray(node.choices) ? node.choices : [];
  if (choices.length) {
    lines.push(`**Choices:**\n`);
    choices.forEach((c, i) => {
      if (!c) return;
      lines.push(choiceLine(c, i));
    });
    lines.push("");
  } else {
    lines.push(`_(dead end — no choices)_\n`);
  }
  lines.push(`---\n`);
});

process.stdout.write(lines.join("\n"));
