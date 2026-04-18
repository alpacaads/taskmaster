#!/usr/bin/env node
// Generate scene images for Dead Light using OpenAI DALL-E 3.
//
// Usage:
//   OPENAI_API_KEY=sk-... node tools/generate-images.js
//
// Notes:
// - Requires Node 18+ (uses built-in fetch).
// - Saves PNG files to zombie-rpg/images/<scene_id>.png
// - Skips any scene whose file already exists (resumable).
// - 1792x1024 (closest 16:9 DALL-E 3 supports). ~$0.08 per image.
//   49 images ≈ $4 USD.

const fs = require("fs");
const path = require("path");

const OUT_DIR = path.join(__dirname, "..", "images");
const STYLE = ", photorealistic, cinematic, dramatic chiaroscuro lighting, in the style of The Last of Us video game, gritty, 16:9 widescreen, highly detailed, no text, no logo, no watermark";

const PROMPTS = {
  intro:               "ruined city skyline at night, military helicopter flying away into the distance, abandoned skyscrapers, smoke rising, broken cars on the street, lone hooded survivor watching from a rooftop, faint moonlight",
  apt_hallway:         "dark narrow apartment building hallway at night, single flickering ceiling bulb, peeling wallpaper, ajar door with a chain dangling, dust in the air, abandoned, claustrophobic atmosphere",
  neighbour_apt:       "cluttered small apartment interior at night, elderly woman asleep in a quilted armchair facing away, pantry shelves with canned food, medical bag on a counter, dim warm lamp light, suspended dust motes",
  neighbour_wake:      "tense moment in a dimly lit cluttered apartment, elderly woman in a tattered nightgown standing slowly from her armchair, blurred motion, eerie greenish lamp light, vintage horror movie still",
  stairwell:           "concrete apartment stairwell descending into darkness at night, single shaky flashlight beam from above illuminating dust and water dripping, pitch black below, claustrophobic horror, oppressive silence",
  meet_maya:           "tense first meeting between two strangers in a dim concrete stairwell of a rundown apartment building at night, a tough woman in a faded army jacket cautiously holding out a crowbar toward a wary man with a flashlight, dust suspended in the flashlight beam, peeling paint, dripping water, claustrophobic, moody chiaroscuro lighting",
  alone_street:        "empty post-apocalyptic city street at night, abandoned cars choking the road, a single hunched silhouetted figure shambling between the wrecks, dim sodium streetlamp, fog, moonlight, oppressive stillness",
  street_plan:         "two survivors crouched behind an abandoned car at night, woman in army jacket pointing toward a corner store across a rubble-strewn street, dim flashlight, tense planning moment, gritty",
  grocery_front:       "dark abandoned supermarket entrance at night, jammed automatic glass doors, two slow shambling silhouetted figures in tattered clothing emerging past tipped shopping carts, broken neon sign, flickering interior fluorescent light, dust",
  grocery_inside:      "dark abandoned supermarket interior, ransacked shelves with scattered cans and broken bottles, lone survivor with a flashlight in the aisle, beam catching dust, dripping ceiling, eerie silence, deep shadows",
  grocery_quick_exit:  "rear loading dock of an abandoned supermarket at night, fast running silhouetted figure in tattered clothes emerging from the alley, scattered debris, single flickering security light overhead, motion blur, danger",
  freezer:             "walk-in freezer of an abandoned supermarket, frosted metal walls and dim interior light, a young girl with a worried expression huddled quietly in the corner wrapped in a coat, breath visible in cold air, atmospheric horror tone",
  road_out:            "long abandoned highway at dawn stretching into the distance, rows of stalled rusting cars, faint sun rising through smog, lone survivor walking with a backpack, hopeful but exhausted, wide cinematic shot",
  road_out_child:      "long abandoned highway at dawn, lone survivor walking hand in hand with a young child, both with backpacks, rows of stalled cars, sun rising through smog, tender quiet moment, cinematic wide shot",
  ambush:              "tense moment in a dark pine forest at dusk, two rough men in worn jackets stepping out from behind trees, fog low to the ground, moss covered logs, threatening atmosphere, cinematic still",
  sacrifice_intro:     "tense standoff in pine forest at dusk, exhausted weary survivor standing in front of a young child, two rough men hesitating, dramatic atmosphere, fog, ground level warm light, gritty cinematic still",
  after_ambush_mercy:  "lone survivor walking away in pine forest at dusk after losing their supplies, empty backpack, defeated but alive, fog, soft warm sunset light filtering through trees",
  after_ambush_fight:  "aftermath in a misty pine forest at dusk, lone weary survivor standing exhausted, scattered backpacks on the ground, fog, warm orange sunset light, somber painterly mood",
  greenbelt_gate:      "tall razor-wire topped chainlink fence at the edge of a pine forest, woman in tactical gear standing watch behind the gate, watchtower in background, fortified camp visible inside, warm dusk light, cinematic",
  greenbelt_gate_hero: "tall razor-wire fence at the edge of a forest, weary survivor carrying a sleeping young child on their back approaching a fortified gate, woman in tactical gear holding the gate open, warm dusk light, emotional cinematic moment",
  greenbelt_in:        "fortified survivor camp at dusk inside a pine forest, canvas tents, central bonfire with a stew pot, solar lanterns hanging from ropes, calm community of weary survivors gathering, smoke rising, hope amid ruin, painterly",
  camp_morning:        "fortified survivor camp at sunrise in pine forest, woman in tactical gear handing a steaming mug of coffee to a survivor, mist rising, golden hour light, hopeful peaceful moment",
  chore_medbay:        "improvised medbay inside a converted shipping container, calm gentle medic carefully bandaging a young child's knee while another adult assists, antiseptic supplies on shelves, acoustic guitar in corner, warm lamp light, intimate quiet caring moment",
  chore_perimeter:     "two survivors on a wooden watchtower at the perimeter of a forest camp, woman in army jacket scanning the treeline with binoculars, the other handing her a coffee mug, golden morning light filtering through pines, quiet companionship",
  chore_kitchen:       "communal outdoor camp kitchen at sunrise, survivor peeling potatoes over a battered iron pot on a campfire, other survivors chatting around tents, warm sunrise light, slice of life moment after the world ended",
  chore_done:          "interior of a canvas command tent at dusk, woman in fatigues spreading a hand-drawn map across a folding table, lit by a hurricane lamp, two survivors leaning in to study a marked location, intense focused planning",
  mission_journey:     "two survivors walking down a desolate countryside road at dusk between abandoned cars, dramatic warm sunset light through trees, quiet conversation, cinematic wide shot, hopeful but tense",
  hospital_arrive:     "ruined hospital exterior at dusk, large faded red medical cross above the entrance, broken windows, wreckage in the parking lot, smoke in the air, two cautious survivors approaching, oppressive atmosphere",
  pharmacy_combat:     "dark abandoned hospital pharmacy at night, scattered pill bottles on the floor, two slow shambling silhouetted figures emerging from the shadows between toppled shelves, single flashlight beam, dust, intense horror atmosphere",
  hospital_lobby:      "dim abandoned hospital lobby at night, two survivors sitting beside each other on a row of cracked plastic waiting chairs, exhausted, faint moonlight through broken windows, vending machine glow, tender quiet moment",
  mission_return:      "fortified survivor camp at dusk, returning survivors handing a medical bag to camp medic, joyful relief, in the background a freshly cut chainlink fence with bolt cutters lying in the grass, ominous detail, warm fading light",
  investigate_traitor: "moonlit gap in a chainlink fence at the edge of a survivor camp, fresh bolt cutters lying in the grass, fresh boot prints in mud leading inward, lone survivor crouched investigating with a flashlight, tense detective moment",
  confront_traitor:    "tense night confrontation at a perimeter fence, lone survivor facing a worried panicked man, sleeve pushed up showing a dark mark on his forearm, distant glow of a survivor camp behind them, moonlight, moral horror atmosphere",
  bonfire_invite:      "intimate bonfire at night inside a survivor camp, two figures lingering near the fading flames, sparks rising into a starry sky, pine trees silhouetted, warm orange glow on faces, quiet romantic tension",
  romance_maya:        "intimate emotional moment in a dimly lit canvas tent at night, a man and a red-haired woman in an army jacket sitting close, her hand resting on his shoulder, candlelight glow, soft focus, deeply emotional tender moment, painterly",
  romance_ren:         "intimate emotional moment in a small medbay at night, a single candle on a metal table, two figures sitting close on a cot, hands resting tenderly together, soft warm candlelight, deeply emotional vulnerable moment, painterly",
  morning_after_maya:  "soft pre-dawn light inside a canvas tent, a red-haired woman in fatigues smiling tenderly at a man, a rifle slung over her shoulder, gentle warm light, tender quiet moment before danger",
  morning_after_ren:   "soft pre-dawn light inside a small medbay, gentle medic with messy hair handing a steaming mug of coffee to a survivor still in a cot, warm intimate moment, soft focus, painterly",
  horde_warning:       "ominous wide cinematic shot at pre-dawn, hundreds of distant silhouetted shambling figures advancing down an abandoned highway toward a fortified survivor camp, blood red sky, smoke, dread atmosphere",
  post_horde_win:      "blood red dawn after a long night, fortified survivor camp behind a battered chainlink fence, scattered debris in the field below, weary survivors embracing on the wall, hope amid devastation, cinematic emotional",
  post_horde_lose:     "somber sunset memorial scene, simple wooden markers in a forest clearing beside a battered survivor camp, lone mourner kneeling quietly, flickering candles in jars, soft golden light, deep reverence and quiet grief",
  post_horde_flee:     "small group of survivors walking single file through a misty pine forest at dawn, leader carrying a flashlight, others carrying packs, smoke rising in the distance behind them, somber but determined, cinematic wide shot",
  ending_final_hero:        "blood red dawn over a fortified survivor camp, lone defender silhouetted on the wall, scattered debris in the field below, hopeful epilogue, cinematic painterly",
  ending_final_fallen:      "candlelit memorial at dusk in a pine forest, simple wooden marker with a name carved into it, mourners standing back, golden hour, deep sorrow, painterly cinematic",
  ending_final_escape:      "small band of survivors walking down a misty empty highway at dawn, lone leader with a flashlight in front, hopeful new beginning, cinematic wide shot",
  ending_final_lovers:      "two lovers embracing at dawn on a battered fortified wall above a misty field, blood red sunrise behind them, weary but alive, deeply emotional cinematic moment",
  ending_final_loverlost:   "lone grieving survivor kneeling at a wooden marker in a pine forest at sunset, candle flickering in a jar, deep sorrow, golden warm light, painterly cinematic",
  ending_final_lovers_road: "two lovers walking hand in hand at the front of a small group of survivors on a misty highway at dawn, hopeful new beginning together, cinematic wide shot",
  death:               "dark misty haze with deep red sky, faint silhouette of a wooden marker on the ground in the distance, deep somber painterly mood, cinematic finality",
};

const KEY = process.env.OPENAI_API_KEY;
if (!KEY) {
  console.error("ERROR: set OPENAI_API_KEY env var.");
  console.error("  OPENAI_API_KEY=sk-... node tools/generate-images.js");
  process.exit(1);
}

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

async function generate(id, prompt) {
  const body = {
    model: "dall-e-3",
    prompt: prompt + STYLE,
    n: 1,
    size: "1792x1024",   // closest to 16:9 DALL-E 3 supports
    quality: "standard", // or "hd" for ~2x cost
    response_format: "url",
  };
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`API ${res.status}: ${txt.slice(0, 300)}`);
  }
  const json = await res.json();
  const url = json.data && json.data[0] && json.data[0].url;
  if (!url) throw new Error("no url in response: " + JSON.stringify(json).slice(0, 300));
  const img = await fetch(url);
  if (!img.ok) throw new Error(`download ${img.status}`);
  const buf = Buffer.from(await img.arrayBuffer());
  fs.writeFileSync(path.join(OUT_DIR, id + ".png"), buf);
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Don't let unhandled errors abort the whole run — log + continue.
process.on("unhandledRejection", (e) => console.error("unhandledRejection:", e && e.message));
process.on("uncaughtException",  (e) => console.error("uncaughtException:",  e && e.message));

(async () => {
  const ids = Object.keys(PROMPTS);
  let done = 0, skipped = 0, failed = 0;
  for (const id of ids) {
    const out = path.join(OUT_DIR, id + ".png");
    if (fs.existsSync(out)) {
      skipped++;
      console.log(`[${++done}/${ids.length}] skip  ${id} (already exists)`);
      continue;
    }
    process.stdout.write(`[${++done}/${ids.length}] gen   ${id} ... `);
    try {
      await generate(id, PROMPTS[id]);
      console.log("OK");
    } catch (e) {
      failed++;
      console.log("FAIL: " + (e && e.message ? e.message : String(e)).slice(0, 200));
    }
    await sleep(1500); // gentle pacing for rate limits
  }
  console.log(`\nDone. ${ids.length - skipped - failed} new, ${skipped} skipped, ${failed} failed.`);
  if (failed > 0) console.log("Re-run the script — failed scenes will be retried.");
  // Always exit 0 — the workflow's commit step will pick up whatever was saved.
  process.exit(0);
})().catch(e => {
  console.error("top-level:", e && e.message);
  process.exit(0);
});
