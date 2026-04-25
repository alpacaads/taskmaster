// Story graph for Dead Light
// Each node: { art, sceneClass, chapter, speaker, text, choices: [{label, tag, next, effect, require, combat}] }
// effect: function(state) that mutates state
// require: function(state) returns bool
// combat: { enemy: 'walker'|'runner'|'bloater'|'bandit'|'horde', onWin, onLose }

// Pay off flags.goodwill once, the first time the player crosses into
// the Greenbelt camp proper. Bumped into a helper because two choices
// at greenbelt_in both lead into camp and either should redeem the gift.
function payGoodwillOnce(s) {
  if (s.flags && s.flags.goodwill && !s.flags.goodwill_paid) {
    s.ammo += 3;
    s.flags.goodwill_paid = true;
  }
}

// Vega slings you her personal ranger rifle if you earned her trust
// (bonds.vega >= 3). Fires from both Day-5 horde_warning choices — hold
// or flee, the gift is the gift — but only once per playthrough.
function equipVegaRifleOnce(s) {
  if ((s.bonds && s.bonds.vega >= 3) && !s.flags.vegaRifleGiven) {
    Game.giveWeapon({ name: "Vega's Ranger Rifle", bonus: 3, slot: "ranged" });
    s.ammo = (s.ammo || 0) + 8;
    s.flags.vegaRifleGiven = true;
    Game.toast("🔫 Vega's Ranger Rifle · +8 rounds");
  }
}

// ---- Day-5 flee-journey presence helpers ----
// The rearguard choice plus in-flight deaths determine who is walking
// beside you through the forest. These predicates are used by the 10
// flee_journey_* nodes to branch narration between the named-character
// variant (Maya, Ren, Vega, Nora) and the generic named-survivor beat.
function mayaInColumn(s) {
  return (s.flags && (s.flags.maya || s.companion === "Maya")) &&
         !s.flags.mayaSacrificed && !s.flags.mayaFellInFlight;
}
function renInColumn(s) {
  return !s.flags.renSacrificed && !s.flags.renFellInFlight;
}
function vegaInColumn(s) {
  return !!s.flags.vegaSaved && !s.flags.vegaFellInFlight;
}
function noraInColumn(s) {
  return s.companion2 === "Nora" && !s.flags.noraFellInFlight;
}

window.Story = {

  intro: {
    scene: "intro",
    art: "🌆🚁💨",
    sceneClass: "city",
    chapter: "Day 1 — The Outbreak",
    speaker: "",
    text: "Three weeks since the fever spread. Three weeks since the dead stopped staying dead.\n\nYou are Ellis, a paramedic from the east suburbs. You held out in your apartment as long as you could. The food ran out yesterday.\n\nA chopper thunders overhead and fades. You're alone now.",
    choices: [
      { label: "Check the hallway", next: "apt_hallway" },
    ]
  },

  apt_hallway: {
    art: "🚪🩸",
    sceneClass: "indoor",
    chapter: "Day 1 — Apartment 3B",
    text: "The hallway stinks of rot. A streak of dried blood leads to the stairwell. Somewhere below, something drags its feet against concrete.\n\nYour neighbour's door — Mrs. Cho, 3A — is ajar.",
    choices: [
      { label: "Search 3A for supplies", tag: "RISKY", tagClass: "warn", next: "neighbour_apt" },
      { label: "Head straight for the stairwell", next: "stairwell_first" },
    ]
  },

  neighbour_apt: {
    art: "🏠🥫💊",
    sceneClass: "indoor",
    chapter: "Day 1 — Apartment 3A",
    text: "Mrs. Cho's apartment smells of incense and decay. She's slumped in her armchair, eyes closed. Peaceful, almost.\n\nYou spot a pantry of canned food and a medical bag on the counter.",
    choices: [
      { label: "Grab everything you can carry",
        effect: s => {
          s.hp = Math.min(s.hpMax, s.hp + 2);
          Game.giveRandomItem(); Game.giveRandomItem();
          Game.toast("+2 ❤️");
        },
        next: "neighbour_wake" },
      { label: "Take only the medicine. Leave Mrs. Cho in peace.",
        effect: s => { s.hp = Math.min(s.hpMax, s.hp + 3); s.flags.honourable = true; Game.toast("+3 ❤️"); },
        next: "stairwell_first" },
    ]
  },

  neighbour_wake: {
    art: "🧟‍♀️😱",
    sceneClass: "blood",
    chapter: "Day 1 — Apartment 3A",
    text: "The armchair creaks. Mrs. Cho's eyes open — milk-white, hungry.\n\nShe lunges.",
    choices: [
      { label: "Fight Mrs. Cho", tag: "COMBAT", tagClass: "danger",
        combat: { enemy: "walker_cho", onWin: "cho_loot", onLose: "death" } },
    ]
  },

  cho_loot: {
    sceneClass: "indoor",
    chapter: "Day 1 — Apartment 3A",
    text: "She's still. Truly still this time.\n\nIn the bottom dresser drawer, wrapped in an old service cloth: a well-kept .38 Special revolver. Her husband's name — HAN CHO — etched into the backstrap. A small box of six rounds beside it.\n\nYou're not a shooter. But you're not empty-handed anymore.",
    choices: [
      { label: "Take the pistol. Head for the stairs.",
        effect: s => {
          Game.giveWeapon({ name: "Cho's .38", bonus: 1, slot: "ranged" });
          s.ammo = 6;
          Game.toast("🔫 Cho's .38 · 6 rounds");
        },
        next: "stairwell_first" },
    ]
  },

  stairwell_first: {
    art: "🪜🕯️",
    sceneClass: "night",
    chapter: "Day 1 — Stairwell",
    text: "Four floors down. Your flashlight flickers. The dragging sound is louder now — more than one set of feet.\n\nA voice, raspy but alive: \"Hey. Don't scream. You bit?\"",
    choices: [
      { label: "\"I'm clean. Who are you?\"", next: "meet_maya" },
      { label: "Stay silent. Keep moving.", tag: "RISKY", tagClass: "warn",
        // Silent path is a solo path too. Make the flag consistent so
        // later scenes (greenbelt_in, post-horde) can acknowledge it.
        effect: s => { s.flags.solo = true; },
        next: "alone_street" },
    ]
  },

  meet_maya_card: {
    scene: "meet_maya_card",
    sceneClass: "night",
    portraitCard: true,
    chapter: "Day 1 — Stairwell",
    profile: {
      name: "MAYA",
      role: "Late 20s · Ex-military",
      tags: [
        "Messy dark red hair, shoulder-length",
        "Faded olive army jacket, grey undershirt",
        "Scar through one eyebrow",
        "Hunting knife on her belt",
      ],
    },
    text: "",
    choices: [
      { label: "Fall in step with her.", next: "street_plan" },
    ]
  },

  meet_maya: {
    art: "🧍🧍‍♀️",
    sceneClass: "night",
    chapter: "Day 1 — Stairwell",
    speaker: "Maya",
    text: "A woman, mid-twenties, army jacket, a hunting knife in her belt. \"Maya. 2F. I've been watching the street for two days — there's a pack of them at the corner store.\"\n\nShe pulls a crowbar from her pack and hands it to you. \"Better than that letter opener.\"",
    choices: [
      { label: "\"Stick together. Two's better than one.\"",
        effect: s => {
          s.companion = "Maya"; s.flags.maya = true;
          Game.giveWeapon({ name: "Crowbar", bonus: 1, slot: "melee" });
        },
        next: "meet_maya_card" },
      { label: "\"I work better alone.\"",
        effect: s => {
          s.flags.solo = true;
          Game.giveWeapon({ name: "Crowbar", bonus: 1, slot: "melee" });
        },
        next: "alone_street" },
    ]
  },

  alone_street: {
    art: "🌃🚗🧟",
    sceneClass: "night",
    chapter: "Day 1 — Market Street",
    text: "The street is a graveyard of cars. A walker shuffles between them, head twitching.\n\nIt hasn't seen you. Yet.",
    choices: [
      { label: "Sneak past", tag: "STEALTH", tagClass: "warn",
        effect: s => { if (Math.random() < 0.5) { s.flags.spotted = true; } },
        next: "alone_street_sneak" },
      { label: "Charge it", tag: "COMBAT", tagClass: "danger",
        combat: { enemy: "walker", onWin: "grocery_exterior", onLose: "death" } },
    ]
  },

  alone_street_sneak: {
    art: "🤫🚗",
    sceneClass: "night",
    chapter: "Day 1 — Market Street",
    text: function(s) {
      if (s.flags.spotted) {
        return "Your boot knocks a soda can. The walker's head snaps around — mouth open, teeth bared. It RUNS.";
      }
      return "You slide between the cars like a shadow. It never turns.\n\nThe grocery store sign buzzes ahead.";
    },
    choices: [
      { label: "Run for the grocery",
        require: s => !s.flags.spotted,
        next: "grocery_exterior" },
      { label: "Defend yourself", tag: "COMBAT", tagClass: "danger",
        require: s => s.flags.spotted,
        combat: { enemy: "runner", risky: true, onWin: "grocery_exterior", onLose: "death" } },
    ]
  },

  street_plan: {
    art: "🗺️🔦",
    sceneClass: "night",
    chapter: "Day 1 — Market Street",
    speaker: "Maya",
    text: "\"Grocery on the corner. Shelves might still have something. My cousin worked there — there's a back door, staff only.\"\n\nShe hands you a flashlight.",
    choices: [
      { label: "Front entrance — fast in, fast out", next: "grocery_front" },
      { label: "Back door — safer but slower", next: "grocery_exterior" },
    ]
  },

  grocery_front: {
    art: "🏪💥🧟🧟",
    sceneClass: "blood",
    chapter: "Day 1 — Grocery",
    text: "The automatic doors jam half-open. Inside, two walkers lurch toward you past tipped-over carts.",
    choices: [
      { label: "Fight them together", tag: "COMBAT", tagClass: "danger",
        require: s => s.companion === "Maya",
        combat: { enemy: "walker_pair", onWin: "grocery_front_win", onLose: "death" } },
      { label: "Fight them alone", tag: "COMBAT", tagClass: "danger",
        require: s => s.companion !== "Maya",
        combat: { enemy: "walker_pair", onWin: "grocery_front_win", onLose: "death" } },
    ]
  },

  grocery_front_win: {
    sceneClass: "indoor",
    chapter: "Day 1 — Grocery",
    text: "The second walker slumps against a tipped cart. One of them was wearing a police load-bearing vest — scarred up but the plates are intact. You cut it free and shrug into it.\n\nIt won't save your life twice. Once is more than nothing.",
    choices: [
      { label: "Take the vest and head deeper in",
        effect: s => {
          s.inventory = s.inventory || [];
          s.inventory.push({
            id: "vest",
            name: "🦺 Riot Vest",
            desc: "Absorbs one hit in combat. Breaks after.",
            armor: true,
          });
          Game.toast("Riot Vest equipped");
        },
        next: "grocery_inside" },
    ]
  },

  grocery_exterior: {
    art: "🏪🚪",
    sceneClass: "night",
    chapter: "Day 1 — Grocery (rear)",
    text: "The back door hangs on one hinge. Inside: the smell of spoiled milk, the hum of a dying fridge.\n\nSomething knocks — steady, patient — from behind the shelves.",
    choices: [
      { label: "Investigate the knocking", next: "grocery_inside" },
      { label: "Grab what's closest and leave",
        effect: s => { Game.giveRandomItem(); },
        next: "grocery_quick_exit" },
    ]
  },

  grocery_inside: {
    art: "🥫🧻🔦",
    sceneClass: "indoor",
    chapter: "Day 1 — Grocery",
    text: "Aisle four: canned beans, a bottle of aspirin, and — in the manager's office — a drawer with a handgun and three rounds.\n\nYou hear the knocking again. It's coming from the walk-in freezer.",
    choices: [
      { label: "Take supplies and leave",
        effect: s => {
          s.ammo += 3; s.hp = Math.min(s.hpMax, s.hp + 1);
          Game.giveRandomItem(); Game.giveRandomItem();
          Game.toast("+3 🔫, +1 ❤️");
        },
        next: "road_out" },
      { label: "Open the freezer", tag: "RISKY", tagClass: "warn",
        effect: s => { s.ammo += 3; s.hp = Math.min(s.hpMax, s.hp + 1); Game.toast("+3 🔫, +1 ❤️"); },
        combat: { enemy: "freezer_abom", risky: true, onWin: "freezer", onLose: "death" } },
    ]
  },

  grocery_quick_exit: {
    art: "🏃🧟‍♂️",
    sceneClass: "night",
    chapter: "Day 1 — Grocery",
    text: "You jog out the back. Something shuffles from the alley. Its mouth is black.",
    choices: [
      { label: "Keep running", tag: "COMBAT", tagClass: "danger",
        combat: { enemy: "runner", risky: true, onWin: "road_out", onLose: "death" } },
    ]
  },

  meet_nora_card: {
    scene: "meet_nora_card",
    sceneClass: "indoor",
    portraitCard: true,
    chapter: "Day 1 — The Road",
    profile: {
      name: "NORA",
      role: "About 10 · Alone",
      tags: [
        "Messy copper-brown hair, loose ponytail",
        "Oversized grey hoodie, small olive jacket",
        "Dirt-smudged cheeks, big hazel eyes",
        "Kitchen knife too big for her hand",
      ],
    },
    text: "",
    choices: [
      { label: "Keep walking.", next: "road_out_child" },
    ]
  },

  freezer: {
    art: "🚪❄️👧",
    scene: function(s) { return s.companion === "Maya" ? "freezer_maya" : "freezer"; },
    sceneClass: "indoor",
    chapter: "Day 1 — Freezer",
    text: function(s) {
      if (s.companion === "Maya") {
        return "The thing finally stops moving. Neither of you want to look at what it used to be.\n\nBreath fogging in the cold. Blood steaming on the floor.\n\nBehind a wall of tipped shelving, small and perfectly still — a girl, maybe ten, a kitchen knife shaking in her hand.\n\nMaya drops into a low crouch, hands wide. \"Hey. Hey, kid. We're not going to hurt you.\"\n\nThe girl's eyes lock on you. \"Don't. Don't touch me.\"";
      }
      return "The thing finally stops moving. You don't want to look at what it used to be.\n\nBreath fogging in the cold. Blood steaming on the floor.\n\nBehind a wall of tipped shelving, small and perfectly still — a girl, maybe ten, a kitchen knife shaking in her hand.\n\n\"Don't. Don't touch me.\"";
    },
    choices: [
      { label: "\"It's okay. I'm not going to hurt you.\"",
        effect: s => {
          s.companion2 = "Nora"; s.flags.savedNora = true;
          // Maya saw you risk yourself for a kid — tracks for her.
          if (s.companion === "Maya") { s.bonds.maya += 1; Game.toast("Nora joined you · Maya's trust +1"); }
          else Game.toast("Nora joined you");
        },
        next: "meet_nora_card" },
      { label: "Close the door. It's not your problem.",
        effect: s => {
          s.flags.coward = true;
          // Maya saw the opposite — and she does not forgive this one.
          if (s.companion === "Maya") { s.bonds.maya = Math.max(0, (s.bonds.maya || 0) - 2); Game.toast("You leave her behind · Maya's trust -2"); }
          else Game.toast("You leave her behind");
        },
        next: "road_out" },
    ]
  },

  road_out: {
    art: "🛣️🌅",
    sceneClass: "forest",
    chapter: "Day 2 — The Road",
    text: function(s) {
      if (s.companion === "Maya") {
        return "You and Maya walk for hours. She keeps pace half a step behind you, eyes always on the treeline. The highway is a museum of stalled cars.\n\n\"Heard people talking about a camp,\" she says, not looking at you. \"The Greenbelt. Old state park.\"\n\nAhead, a hitchhiker sign: GREENBELT 12 MI.";
      }
      return "You walk for hours. The highway is a museum of stalled cars. You've heard rumours of a camp — the Greenbelt — in the old state park.\n\nAhead, a hitchhiker sign: GREENBELT 12 MI.";
    },
    choices: [
      { label: "Keep walking. Find the camp.", next: "ambush" },
      { label: "Rest in a station wagon",
        effect: s => {
          s.hp = s.hpMax;
          s.stam = s.stamMax;
          // Rummage the cab — gloveboxes on this highway have been
          // picked over, but not all.
          Game.giveRandomItem();
          s.flags.restedInCar = true;
          Game.toast("❤️ ⚡ restored + glovebox loot");
        },
        next: "ambush" },
    ]
  },

  road_out_child: {
    art: "🛣️🌅👧",
    sceneClass: "forest",
    chapter: "Day 2 — The Road",
    speaker: "Nora",
    text: function(s) {
      if (s.companion === "Maya") {
        return "Nora is quiet for hours, keeping pace between you and Maya. When she finally speaks, it's to Maya — to the rifle across her back.\n\n\"My dad said there's people at the Greenbelt. Soldiers. Good ones.\"\n\nMaya nods without smiling. Nora slips her hand into yours anyway.";
      }
      return "Nora is quiet for hours. Then, small: \"My dad said there's people at the Greenbelt. Soldiers. Good ones.\"\n\nShe slips her hand into yours.";
    },
    choices: [
      { label: "\"Then that's where we go.\"", next: "ambush" },
    ]
  },

  ambush: {
    art: "🌳🔫🧔",
    scene: function(s) { return s.companion === "Maya" ? "ambush_maya" : "ambush"; },
    sceneClass: "forest",
    chapter: "Day 2 — The Pines",
    speaker: "???",
    text: function(s) {
      const withMaya = s.companion === "Maya";
      if (s.flags.restedInCar && withMaya) {
        return "You and Maya clocked their pickup a mile back through the station wagon's rear window — two men, rifles across the seats. When they step out of the pines shouting \"drop the bag,\" the two of you already had a plan.";
      }
      if (s.flags.restedInCar) {
        return "You clocked their pickup a mile back through the station wagon's rear window — two men, rifles across the seats. When they step out of the pines shouting \"drop the bag,\" you already have a plan.";
      }
      if (withMaya) {
        return "A shotgun racks behind you. Maya's hand closes on your wrist. \"Slow,\" she breathes.\n\nTwo men step out from the pines. Not infected — worse. Bandits.";
      }
      return "A shotgun racks behind you. \"Drop the bag. Slow.\"\n\nTwo men step out from the pines. Not infected — worse. Bandits.";
    },
    choices: [
      { label: "Drop the bag. Live to fight another day.",
        effect: s => {
          // Bandits take the bag AND the bigger weapon. You're reduced
          // to the pocket knife you started Day 1 with. Armor stays —
          // it's on your body, not in the bag.
          const lost = [];
          if (s.bestRanged) { lost.push(s.bestRanged.name); s.bestRanged = null; }
          if (s.ammo > 0)   { lost.push(`${s.ammo} rounds`); s.ammo = 0; }
          if (s.bestMelee && s.bestMelee.name !== "Pocket Knife") {
            lost.push(s.bestMelee.name);
            s.bestMelee = { name: "Pocket Knife", bonus: 0, slot: "melee" };
          }
          const keep = (s.inventory || []).filter(it => it && it.armor);
          const dropped = (s.inventory || []).filter(it => it && !it.armor);
          if (dropped.length) lost.push(`${dropped.length} supplies`);
          s.inventory = keep;
          Game.toast(lost.length ? `They take: ${lost.join(" · ")}` : "They wave you through");
        },
        next: "after_ambush_mercy" },
      { label: "Fight — you need these supplies", tag: "COMBAT", tagClass: "danger",
        combat: function (s) {
          // Two people, two fights. With Maya she engages the Older one
          // (experienced — she matches him), you take the Younger.
          // Solo you fight both in sequence: Younger first (rattled),
          // Older second (steadier).
          if (s.companion === "Maya") {
            return {
              enemy: "bandit_younger",
              allyEngagement: { ally: "maya", enemy: "bandit_older" },
              risky: !s.flags.restedInCar,
              onWin: "after_ambush_fight",
              onLose: "death",
            };
          }
          return {
            enemy: "bandit_younger",
            waves: ["bandit_older"],
            risky: !s.flags.restedInCar,
            onWin: "after_ambush_fight",
            onLose: "death",
          };
        } },
      { label: "\"Take me. Let the kid go.\"", tag: "SACRIFICE", tagClass: "warn",
        require: s => s.companion2 === "Nora",
        next: "sacrifice_intro" },
    ]
  },

  sacrifice_intro: {
    art: "🧍👧🌲",
    scene: function(s) { return s.companion === "Maya" ? "sacrifice_intro_maya" : "sacrifice_intro"; },
    sceneClass: "forest",
    chapter: "Day 2 — The Pines",
    text: function(s) {
      const base =
        "The older bandit laughs, then stops. Something in your face shuts him up.\n\n" +
        "He jerks his chin at Nora. \"Hide, kid. Behind the big pine. Eyes shut.\"\n\n" +
        "She looks at you. You nod once — go. She scrambles thirty feet into the brush and curls small behind a mossy log. You can still see the top of her head.";
      if (s.companion === "Maya") {
        return "Maya's hand is on her knife. You put yours on her shoulder — hold. Not yet.\n\n" +
          base + "\n\nMaya steps in beside you, not behind you. She's not going anywhere either.";
      }
      return base;
    },
    choices: [
      { label: "Fight for your life", tag: "COMBAT", tagClass: "danger",
        effect: s => { s.flags.carriedNora = true; },
        // Older / Younger bandit — Maya takes the Older one, you face
        // the Younger; or solo, Younger then Older back to back.
        combat: function (s) {
          if (s.companion === "Maya") {
            return {
              enemy: "bandit_younger",
              allyEngagement: { ally: "maya", enemy: "bandit_older" },
              onWin: "sacrifice_loot",
              onLose: "death",
            };
          }
          return {
            enemy: "bandit_younger",
            waves: ["bandit_older"],
            onWin: "sacrifice_loot",
            onLose: "death",
          };
        } },
    ]
  },

  // The looting beat: breath back, hands shaking, you pat down the
  // bigger one. The reward (grenade + shells) is narrated here, not
  // shoved into the 'carry the kid out' scene that comes next.
  sacrifice_loot: {
    scene: function(s) { return s.companion === "Maya" ? "sacrifice_loot_maya" : "sacrifice_loot"; },
    sceneClass: "forest",
    chapter: "Day 2 — After the Fight",
    text: function(s) {
      let base = "The pines go quiet before your breath does. Two bodies. Both of theirs. You stand over the bigger one a long moment — long enough to feel your hands shake — then go to a knee and start patting him down.";
      if (s.companion === "Maya") {
        base += "\n\nMaya keeps her rifle up, scanning. She doesn't help. She doesn't need to say why.";
      }
      base += "\n\nA spare magazine. A handful of shells. A battered tin box. And on his webbing — clipped tight, pin still in — a military-issue fragmentation grenade. You unclip it carefully, wrap your fingers around the lever, and let out a long, thin breath.\n\nYou slide the grenade onto your own belt.";
      return base;
    },
    choices: [
      { label: "Stand up. Call for Nora.",
        effect: s => {
          s.flags.killedBandits = true;
          s.ammo += 4;
          s.inventory = s.inventory || [];
          const existing = s.inventory.find(i => i && i.grenade);
          if (existing) existing.qty = (existing.qty || 1) + 1;
          else s.inventory.push({
            id: "grenade",
            name: "🧨 Grenade",
            desc: "One-time combat throw. Big damage.",
            grenade: true,
            qty: 1,
          });
          Game.toast("+4 🔫 · 🧨 Grenade on your belt");
        },
        next: "sacrifice_aftermath" },
    ]
  },

  // Between the loot beat and the camp gate: Nora comes out from
  // behind the mossy log, you carry her the last half-mile.
  sacrifice_aftermath: {
    scene: function(s) { return s.companion === "Maya" ? "sacrifice_aftermath_maya" : "sacrifice_aftermath"; },
    sceneClass: "forest",
    chapter: "Day 2 — After the Pines",
    text: function(s) {
      let base = "You call her out from behind the mossy log. She comes slow, eyes enormous. She doesn't say anything about the blood.\n\nShe walks the first half-mile and then her legs stop working. You pick her up. She weighs almost nothing.";
      if (s.companion === "Maya") {
        base += "\n\nMaya walks three steps behind you, checking the treeline. She doesn't offer to carry the girl. She doesn't have to say it: this was the right call.";
      }
      return base;
    },
    choices: [
      { label: "Keep moving toward the Greenbelt.", next: "greenbelt_gate_hero" },
    ]
  },

  after_ambush_mercy: {
    art: "🌲🎒",
    sceneClass: "forest",
    chapter: "Day 2 — The Pines",
    text: "They take what they want and disappear into the trees. You're lighter now — but alive.",
    choices: [
      { label: "Push on to the Greenbelt", next: "greenbelt_gate" },
    ]
  },

  after_ambush_fight: {
    art: "🌲🩸",
    scene: function(s) { return s.companion === "Maya" ? "after_ambush_fight_maya" : "after_ambush_fight"; },
    sceneClass: "forest",
    chapter: "Day 2 — The Pines",
    text: function(s) {
      if (s.companion === "Maya") {
        return "It was ugly. It was quick. Maya wipes her blade on the bigger one's jacket and doesn't look up.\n\n\"We don't talk about this one,\" she says.\n\nYou pat the bigger bandit down. A spare mag. A handful of shells. Jerky. And — clipped tight to his webbing, pin still in — a fragmentation grenade.\n\nYou unclip it very carefully and slide it onto your belt. Maya watches you do it. She doesn't say anything. Neither do you.";
      }
      return "It was ugly. It was quick. You pat the bigger bandit down — spare mag, shells, jerky — and find, clipped tight to his webbing, a fragmentation grenade, pin still in. You unclip it carefully and slide it onto your belt. The silence presses in.";
    },
    choices: [
      { label: "Loot and move on",
        effect: s => {
          // Two armed humans = real reward. The big one had a pull-pin
          // grenade clipped to his webbing — one-time use, huge damage
          // when you throw it. Also rounds, jerky, a spare consumable.
          s.flags.killedBandits = true;
          s.ammo += 6;
          s.inventory = s.inventory || [];
          const existing = s.inventory.find(i => i && i.grenade);
          if (existing) existing.qty = (existing.qty || 1) + 1;
          else s.inventory.push({
            id: "grenade",
            name: "🧨 Grenade",
            desc: "One-time combat throw. Big damage.",
            grenade: true,
            qty: 1,
          });
          Game.giveRandomItem();
          Game.giveRandomItem();
          Game.toast("+6 🔫 · 🧨 Grenade stashed");
        },
        next: "greenbelt_gate" },
    ]
  },

  meet_vega_card: {
    scene: "meet_vega_card",
    sceneClass: "forest",
    portraitCard: true,
    chapter: "Day 3 — Greenbelt",
    profile: {
      name: "CAPTAIN VEGA",
      role: "Mid 30s · Camp CO",
      tags: [
        "Black hair pulled back tight",
        "Tactical fatigues, captain's patch",
        "Thin scar along her cheekbone",
        "Rock-steady scope, jaw set",
      ],
    },
    text: "",
    choices: [
      { label: "Step inside the wire.", next: "greenbelt_in" },
    ]
  },

  // Sacrifice-path variant: Vega has already lowered her rifle. The
  // framing is softer — she clocks the kid, reads the blood, waves
  // you in. Different image + different tags so the mood matches.
  meet_vega_card_hero: {
    scene: "meet_vega_card_hero",
    sceneClass: "forest",
    portraitCard: true,
    chapter: "Day 3 — Greenbelt",
    profile: {
      name: "CAPTAIN VEGA",
      role: "Mid 30s · Camp CO",
      tags: [
        "Black hair pulled back tight",
        "Tactical fatigues, captain's patch",
        "Thin scar along her cheekbone",
        "Rifle lowered · clocking the kid on your shoulder",
      ],
    },
    text: "",
    choices: [
      { label: "Step inside the wire.", next: "greenbelt_in" },
    ]
  },

  greenbelt_gate: {
    art: "🚧🛡️⛺",
    scene: function(s) { return s.companion === "Maya" ? "greenbelt_gate_maya" : "greenbelt_gate"; },
    sceneClass: "forest",
    chapter: "Day 3 — Greenbelt",
    speaker: "Guard",
    text: function(s) {
      if (s.companion === "Maya") {
        return "A chain-link fence topped with razor wire. A woman in tactical gear studies you — and Maya — through the scope of a rifle.\n\n\"Both of you. State your business. Show me your arms — both sides.\"\n\nMaya raises her sleeves slow and steady. She's done this before.";
      }
      return "A chain-link fence topped with razor wire. A woman in tactical gear studies you through the scope of a rifle.\n\n\"State your business. And show me your arms — both sides.\"";
    },
    choices: [
      { label: "Show your arms. No bites.", next: "meet_vega_card" },
      { label: "Offer supplies as a gift", require: s => s.ammo >= 2,
        effect: s => {
          s.ammo -= 2; s.flags.goodwill = true;
          s.bonds.vega = (s.bonds.vega || 0) + 1;
          Game.toast("-2 🔫  · Vega's trust +1");
        },
        next: "meet_vega_card" },
      { label: "Offer the grenade — \"You'll use this better than me.\"",
        tag: "GIFT", tagClass: "warn",
        require: s => (s.inventory || []).some(it => it && it.grenade && (it.qty === undefined || it.qty > 0)),
        effect: s => {
          // Consume one grenade. Vega lights up — this is exactly the
          // kind of thing her armoury could do something with. Bigger
          // bond bump than a handful of rounds, and she'll remember it
          // at the mission briefing.
          const inv = s.inventory || [];
          const gi = inv.findIndex(it => it && it.grenade && (it.qty === undefined || it.qty > 0));
          if (gi >= 0) {
            const g = inv[gi];
            if (g.qty && g.qty > 1) g.qty -= 1;
            else inv.splice(gi, 1);
          }
          s.flags.goodwill = true;
          s.flags.gaveGrenade = true;
          s.bonds.vega = (s.bonds.vega || 0) + 2;
          Game.toast("🧨 handed off · Vega's trust +2");
        },
        next: "meet_vega_card" },
    ]
  },

  greenbelt_gate_hero: {
    art: "🚧🛡️⛺",
    scene: function(s) { return s.companion === "Maya" ? "greenbelt_gate_hero_maya" : "greenbelt_gate_hero"; },
    sceneClass: "forest",
    chapter: "Day 3 — Greenbelt",
    text: function(s) {
      let base = "The gate slides open to the squeal of rusted track.\n\nShe's asleep on your shoulder now — small weight against your neck, a trace of blood drying in her hair that isn't hers. The guards look at you — bloodied, limping, the kid — and lower their rifles.";
      if (s.companion === "Maya") {
        base += "\n\nMaya stands half a step behind you. She doesn't say anything. She doesn't have to.";
      }
      return base;
    },
    choices: [
      { label: "\"She needs food. Please.\"",
        effect: s => {
          // goodwill flag stays narrowly tied to the 'offer supplies
          // at the gate' path — Vega's spare mag at the briefing
          // literally references the rounds you handed over.
          // The sacrifice path gets its reward via Maya's +2 bond,
          // a Vega +1 (she meets you at the gate carrying a bloodied
          // kid you nearly died for — that's where she clocks you),
          // and the carrying-Nora-through-the-gate narrative.
          if (s.companion === "Maya") { s.bonds.maya += 2; }
          s.bonds.vega = (s.bonds.vega || 0) + 1;
          Game.toast(s.companion === "Maya"
            ? "Maya's trust +2 · Vega's trust +1"
            : "Vega's trust +1");
        },
        next: "meet_vega_card_hero" },
    ]
  },

  greenbelt_in: {
    art: "⛺🔥🍲",
    sceneClass: "forest",
    chapter: "Day 3 — Greenbelt Camp",
    text: function(s) {
      const withMaya = s.companion === "Maya";
      const withNora = s.companion2 === "Nora";
      let opener = "Inside: tents, solar lamps, the smell of stew. A radio crackles weather reports.\n\n";
      if (withMaya) {
        opener += "Maya drops onto the bench beside you, rifle across her knees, already scanning the camp like she's mapping exits.\n\n";
      } else if (s.flags.solo) {
        // Read the 'I work better alone' flag — acknowledge the cost.
        opener += "The woman from the stairwell isn't here. You don't know if she found another way in. You didn't wait to ask.\n\n";
      }
      if (withNora) {
        opener += "Nora stays close to your leg, eyes enormous. Someone's kid offers her a wooden horse; she doesn't take it, but she doesn't shrink away either.\n\n";
      }
      opener += "A young woman with calm hands and a quiet voice bandages your arm. \"You're lucky. Most don't make it this far. I'm Ren.\"\n\n";
      opener += "Across the fire, another woman in tactical kit nods at ";
      opener += (withMaya || withNora) ? "all of you" : "you";
      opener += " — Captain Vega. \"Eat. Sleep. We talk in the morning.\"";
      return opener;
    },
    choices: [
      { label: "Let Ren patch you up properly before bed.", tag: "BOND", tagClass: "warn",
        effect: payGoodwillOnce,
        next: "ren_medbay_intro" },
      { label: "Sleep now. Tomorrow is another day.",
        effect: s => {
          s.hp = s.hpMax; s.stam = s.stamMax;
          payGoodwillOnce(s);
          Game.toast("❤️ ⚡ restored");
        },
        next: "camp_morning" },
    ]
  },

  meet_ren_card: {
    scene: "meet_ren_card",
    sceneClass: "indoor",
    portraitCard: true,
    chapter: "Day 3 — Medbay",
    profile: {
      name: "REN",
      role: "Mid 20s · Camp medic",
      tags: [
        "Messy dark brown hair, tucked behind one ear",
        "Warm brown eyes, faint freckles",
        "Grey scrubs under a worn olive jacket",
        "Small silver stethoscope · guitar in the corner",
      ],
    },
    text: "",
    choices: [
      { label: "Step out into the camp.", next: "camp_morning" },
    ]
  },

  ren_medbay_intro: {
    sceneClass: "indoor",
    chapter: "Day 3 — Medbay",
    speaker: "Ren",
    text: function(s) {
      let base = "The medbay is a converted shipping container. Clean linen, antiseptic bite in the air, one lamp hanging low. Ren sits you down, rolls a stool over, and starts on your arm without asking.\n\n\"Worked ER at Old Mercy the first month,\" she says, eyes on the stitch. \"Saw what the fever did to a hallway. Stopped sleeping.\"\n\nA long, steady pull of thread.\n\n\"If my hands shake later — that's why. They work anyway.\"";
      if (s.companion2 === "Nora") {
        base += "\n\nNora is curled on the spare cot in the corner, already asleep under a too-big blanket. Ren glances over every few stitches.";
      }
      return base;
    },
    choices: [
      { label: "\"Thank you.\"",
        effect: s => {
          s.hp = s.hpMax; s.stam = s.stamMax;
          Game.toast("❤️ ⚡ restored");
        },
        next: "meet_ren_card" },
      { label: "Sit with Ren in silence until she finishes.",
        effect: s => {
          s.hp = s.hpMax; s.stam = s.stamMax;
          s.bonds.ren += 1;
          Game.toast("❤️ ⚡ restored · Ren's trust +1");
        },
        next: "meet_ren_card" },
    ]
  },

  camp_morning: {
    scene: "greenbelt_morning",
    sceneClass: "forest",
    chapter: "Day 4 — Morning",
    speaker: "Captain Vega",
    text: "You sleep in fits on a camp cot, and when you wake it's already light.\n\nDay 4. Coffee that tastes like dirt, sun coming up through the pines, the camp beginning to stir. Vega finds you by the fire and sits down opposite.\n\n\"You earned a day before we put you to work,\" she says, low. \"Pick a hand to lend. Or don't. Free country — what's left of it.\"",
    choices: [
      { label: "Help Ren in the medbay", tag: "BOND", tagClass: "warn",
        effect: s => { s.flags.choreChosen = "medbay"; },
        next: "chore_medbay" },
      { label: "Walk the perimeter with Maya",
        require: s => s.flags.maya,
        tag: "BOND", tagClass: "warn",
        effect: s => { s.flags.choreChosen = "perimeter"; },
        next: "chore_perimeter" },
      { label: "Cook for the camp",
        effect: s => { s.flags.choreChosen = "kitchen"; },
        next: "chore_kitchen" },
    ]
  },

  chore_medbay: {
    scene: "medbay",
    sceneClass: "indoor",
    chapter: "Day 4 — Medbay",
    speaker: "Ren",
    text: function(s) {
      let base = "Ren's medbay is a converted shipping container. Antiseptic, clean linen, a guitar in the corner.\n\n";
      if (s.companion2 === "Nora") {
        base += "Nora is tucked cross-legged on the spare cot, drawing something on the back of a pill-label leaflet. Ren keeps one eye on her between stitches, like she's already decided.\n\n";
      }
      base += "\"Hold this. Hands steady.\" You're stitching a cut on a kid's knee. Ren watches you work. \"You've done this before.\"\n\n\"Paramedic. East side.\"\n\n\"Then you know how it gets — losing them.\" A long beat. \"Tell me one you saved.\"";
      return base;
    },
    choices: [
      { label: "Tell Ren about the boy in the subway fire",
        effect: s => { s.bonds.ren += 1; Game.toast("Ren's trust +1"); },
        next: "chore_done" },
      { label: "Change the subject. Some doors stay shut.",
        next: "chore_done" },
    ]
  },

  chore_perimeter: {
    scene: "perimeter",
    sceneClass: "forest",
    chapter: "Day 4 — Perimeter",
    speaker: "Maya",
    text: "Maya climbs the watchtower like she was born there. You hand up coffee. She drinks it without taking her eyes off the treeline.\n\n\"Me and my brother used to pull watch like this,\" she says. \"Different fence. Different pines. Same air.\" She doesn't look at you. \"Six months. Feels like six years.\"\n\nThe wind moves through the pines. She's closer than she needs to be.",
    choices: [
      { label: "\"Tell me about your brother.\"",
        effect: s => {
          s.bonds.maya += 2;
          s.flags.mayaToldBrother = true;
          Game.toast("Maya's trust +2");
        },
        next: "chore_perimeter_brother" },
      { label: "Stand watch in silence. Some things don't need words.",
        effect: s => { s.bonds.maya += 1; },
        next: "chore_done" },
    ]
  },

  // A brief follow-up when you ask about her brother — gives the line
  // some ground under it. Stays in the watchtower; continues to the
  // briefing afterwards.
  chore_perimeter_brother: {
    scene: "perimeter",
    sceneClass: "forest",
    chapter: "Day 4 — Perimeter",
    speaker: "Maya",
    text: "She doesn't turn, but her shoulders let go a half-inch.\n\n\"Two years older. We were both Guard — weekend-warrior stuff, mostly. Flood duty. A hurricane, once. Fire season in the back country.\" A pause. \"When it started, he was on a call up north. I drove out to meet him. Got to the roadblock too late.\"\n\nThe treeline moves. She's already scanning it again.\n\n\"He'd have liked you. He liked people who didn't look away.\"",
    choices: [
      { label: "\"I'm glad you're still pulling watch.\"", next: "chore_done" },
      { label: "Let the quiet do the rest of the work.", next: "chore_done" },
    ]
  },

  chore_kitchen: {
    scene: "camp_kitchen",
    sceneClass: "forest",
    chapter: "Day 4 — Kitchen",
    text: function(s) {
      let base = "You spend the morning peeling potatoes and listening to camp gossip. Three meals out of one rabbit. Magic.";
      if (s.companion2 === "Nora") {
        base += "\n\nNora sits cross-legged by the fire stripping peas from a pod, tongue poking out in concentration. She steals one. Then another. You pretend not to notice.";
      }
      base += "\n\nVega slaps your shoulder on her way past. \"You'll do.\"";
      return base;
    },
    choices: [
      { label: "Wash up and report in",
        effect: s => {
          Game.giveRandomItem(); Game.giveRandomItem();
          // Cooking is Vega's domain — she clocks who pulls their weight
          // without being asked. Builds the trust that ends up with
          // her slinging you her ranger rifle at the horde.
          s.bonds.vega = (s.bonds.vega || 0) + 1;
          Game.toast("Vega's trust +1");
        },
        next: "chore_done" },
    ]
  },

  chore_done: {
    scene: function(s) {
      const c = s.flags && s.flags.choreChosen;
      // Variant images depict Maya in the corner or across the table;
      // only use them when Maya's actually at camp. Otherwise the art
      // contradicts the text for solo runs.
      if (c === "medbay" && s.flags.maya)    return "chore_done_medbay";
      if (c === "perimeter")                  return "chore_done_perimeter";
      if (c === "kitchen" && s.flags.maya)    return "chore_done_kitchen";
      return "chore_done";
    },
    sceneClass: "indoor",
    chapter: "Day 4 — Briefing",
    speaker: "Captain Vega",
    text: function(s) {
      // Afternoon — you're called into the command tent. Each chore
      // gets a tag beat acknowledging who's already there and how
      // they're reading your morning.
      let setup = "By mid-afternoon the light's shifted and the camp smells of cookfire and oil. Vega waves you into the command tent — a canvas square, a folding table, a hurricane lamp not lit yet because the sun still is.\n\n";
      if (s.flags.choreChosen === "medbay" && s.flags.maya) {
        setup += "Maya is already in the corner, breaking down a rifle. She doesn't look up when you walk in. The treeline could've used a second pair of eyes today.\n\n";
      } else if (s.flags.choreChosen === "perimeter") {
        setup += "Maya walks in with you from the watchtower and drops onto the bench at your side, still in watchtower dust. Across the table Ren is already there, clipboard balanced on her knee.\n\n\"Med inventory's thinner than it should be,\" Ren murmurs as you sit down. It's not a complaint. It lands like one anyway.\n\n";
      } else if (s.flags.choreChosen === "kitchen") {
        setup += "Ren sets a mug of something hot in front of you without meeting your eye. ";
        setup += s.flags.maya
          ? "Maya's across the table, back half-turned. The map is the only thing the three of you are willing to look at.\n\n"
          : "Vega's the only other person here, and she's all business.\n\n";
      }
      let briefing = "Vega taps the map with two fingers. \"Old Mercy Hospital. Three klicks south. Pharmacy on the second floor — antibiotics, painkillers, anything that hasn't walked off.\"";
      if (s.flags.goodwill) {
        // Pay off the gate 'offer supplies as a gift' choice.
        briefing += "\n\nShe slides something across the table before she unfolds the map — a clean spare magazine. \"For the rounds you handed me at the gate. We remember that here.\"";
      }
      briefing += "\n\nShe spreads a hand-drawn map. \"In and out. Don't be a hero. Pick someone to take.\"";
      return setup + briefing;
    },
    choices: [
      { label: "Take Maya — she knows how to fight",
        require: s => s.flags.maya,
        effect: s => { s.flags.missionPartner = "maya"; },
        next: s => s.flags.savedNora ? "nora_asks" : "mission_journey" },
      { label: "Take Ren — she knows what to grab",
        effect: s => { s.flags.missionPartner = "ren"; },
        next: s => s.flags.savedNora ? "nora_asks" : "mission_journey" },
      { label: "Go alone. Less mouths, less risk.",
        effect: s => { s.flags.missionPartner = null; s.flags.solo_mission = true; },
        next: s => s.flags.savedNora ? "nora_asks" : "mission_journey" },
    ]
  },

  nora_asks: {
    sceneClass: "forest",
    chapter: "Day 4 — Camp gate",
    speaker: "Nora",
    text: function(s) {
      let base = "You're tightening a strap when small boots hit the dirt behind you. Nora — breathless, already wearing her little pack.\n\n\"Take me. I watch for things grown-ups miss. I'm quiet. I won't slow you down.\"\n\nShe's too small for what's out there. Her eyes are too big for what she already is.";
      if (s.flags.missionPartner === "maya") {
        base += "\n\nMaya watches from ten feet off, rifle slung. She catches your eye once — you can read it: *don't.* Then looks away.";
      }
      return base;
    },
    choices: [
      { label: "\"Stay close. Do exactly what I say.\"", tag: "RISKY", tagClass: "warn",
        effect: s => {
          s.flags.bringNora = true;
          // Maya explicitly warned you with the 'don't' look. Taking
          // the kid anyway sits with her.
          if (s.flags.missionPartner === "maya") {
            s.bonds.maya = Math.max(0, (s.bonds.maya || 0) - 2);
            Game.toast("Nora is coming · Maya's trust -2");
          } else {
            Game.toast("Nora is coming with you");
          }
        },
        next: "mission_journey" },
      { label: "\"Not this one, kid. You're safer here.\"",
        effect: s => {
          s.flags.bringNora = false;
          // Maya approves the sensible call.
          if (s.flags.missionPartner === "maya") {
            s.bonds.maya += 1;
            Game.toast("Maya's trust +1");
          }
        },
        next: "mission_journey" },
    ]
  },

  horde_warning: {
    scene: "horde_warning",
    sceneClass: "blood",
    chapter: "Day 5 — Sunrise",
    speaker: "Captain Vega",
    text: function(s) {
      let intro = "A siren shatters the morning. A horde — hundreds — pouring down the old highway. They'll hit the fence in minutes.\n\n";
      if (s.flags.exposedTraitor) intro += "Thanks to last night's warning the camp is ready. The south fence is reinforced, the armory is open, every rifle is loaded.\n\n";
      else if (s.flags.killedTraitor) intro += "No one knows what you did at the south fence. The camp is calm — until it isn't.\n\n";
      else intro += "Something's wrong with the south fence — whatever it is, there's no time to fix it now.\n\n";
      const rally = [];
      if (s.flags.maya) rally.push("Maya racks her rifle");
      rally.push("Ren throws a med kit over her shoulder");
      rally.push("Vega's already on the wall");
      if (s.flags.savedNora) rally.push("Nora ducks into the medbay sandbags");
      intro += rally.join(", ") + ".\n\n";
      // Love-triangle acknowledgments. If the crossroads made the call
      // explicit (rejectedRen / rejectedMaya), the beat goes a shade
      // quieter — still steady, a little more costly.
      if (s.romance === "maya" && s.flags.lovedMaya) {
        if (s.flags.rejectedRen) {
          intro += "Ren passes you on her way to the wall, med kit bouncing. She doesn't stop. Her hand brushes your shoulder once as she goes by — a medic's hand, not a lover's. Steady. Brief. \"Be careful today,\" she says, and then she's past you.\n\n";
        } else {
          intro += "Ren passes you on her way to the wall, med kit bouncing. She catches your eye. A small, real smile. \"Good,\" she says, and keeps moving.\n\n";
        }
      } else if (s.romance === "ren" && s.flags.lovedRen && s.flags.maya) {
        // Mirror beat from Maya's side when you're with Ren.
        if (s.flags.rejectedMaya) {
          intro += "Maya is already at the wall, rifle checked, jaw set. She looks down the line at you once — a long look, all the things she isn't saying — and then she's sighting down the road again. \"Don't get yourself killed, paramedic.\"\n\n";
        } else {
          intro += "Maya is already at the wall, rifle checked. She catches your eye, jerks her chin at the line. \"Stay on my left,\" she calls over. It's the kindest thing she has time for.\n\n";
        }
      }
      return intro + "\"We hold, or we run. Choose.\"";
    },
    choices: [
      { label: "Hold the wall.", tag: "COMBAT", tagClass: "danger",
        effect: s => {
          // Every saved ally is on the wall for this one.
          s.flags.hordeDefense = true;
        },
        combat: function (s) {
          // Horde fight = 25 sequential enemies. Each one is a
          // distinct engagement — walkers, runners, bloaters, hunters
          // (Calder-types) — using _horde enemy ids so each has its
          // own combat backdrop image slot. Composition is mixed so
          // every mechanic (aim / brace / melee / close / panic) gets
          // play time across the stretch.
          //
          // Camp-ready (exposedTraitor): you saw threats early. More
          // walker breathers, fewer runners, two bloaters, one hunter.
          // Camp-not-ready: tighter everywhere — more runners for
          // panic chains, three bloaters, two hunters, zero breathers.
          const ready = !!s.flags.exposedTraitor;
          const waves = ready
            ? // 25 enemies — first is opener, next 24 are waves
              // Mix: 13 walkers, 6 runners, 4 bloaters, 2 hunters
              ["walker_horde", "runner_horde", "walker_horde", "walker_horde",
               "bloater_horde", "walker_horde", "runner_horde", "walker_horde",
               "walker_horde", "bloater_horde", "runner_horde", "walker_horde",
               "hunter_horde", "walker_horde", "bloater_horde", "runner_horde",
               "walker_horde", "walker_horde", "runner_horde", "bloater_horde",
               "walker_horde", "hunter_horde", "walker_horde", "runner_horde"]
            : // Meaner: 8 walkers, 9 runners, 5 bloaters, 3 hunters
              ["runner_horde", "walker_horde", "runner_horde", "bloater_horde",
               "walker_horde", "runner_horde", "hunter_horde", "bloater_horde",
               "runner_horde", "walker_horde", "runner_horde", "bloater_horde",
               "hunter_horde", "walker_horde", "runner_horde", "bloater_horde",
               "walker_horde", "runner_horde", "hunter_horde", "walker_horde",
               "bloater_horde", "runner_horde", "walker_horde", "runner_horde"];
          return {
            enemy: ready ? "walker_horde" : "walker_horde",
            waves: waves,
            onWin: "post_horde_win",
            onLose: "post_horde_lose",
          };
        } },
      { label: "Get the survivors out the back.", next: "flee_rearguard" },
    ]
  },

  // Who buys the column the minutes it needs? One real choice — the
  // flee route used to be a shrug; now it's a cost. Sets vegaStayedBehind
  // / vegaSaved / mayaSacrificed / renSacrificed, which post_horde_flee
  // and the final ending branch on.
  flee_rearguard: {
    scene: "flee_rearguard",
    sceneClass: "blood",
    chapter: "Day 5 — The Back Gate",
    speaker: "Captain Vega",
    text: function(s) {
      let intro = "The back gate is a bottleneck. Twenty survivors, one path, and the horde already beginning to wrap the wall. Whoever goes last buys the minutes the rest need.\n\n";
      // Nora in the column shifts Vega's tone — she's seen the kid.
      if (s.companion2 === "Nora") {
        intro += "Vega racks her rifle. Her eyes flick once to Nora clinging to your sleeve, then away. \"I'm the one with the most rounds and the least family. I stay. I slow them. Get the kid out.\"\n\n";
      } else {
        intro += "Vega racks her rifle. \"I'm the one with the most rounds and the least family. I stay. I slow them.\"\n\n";
      }
      // Maya will offer if she's your partner AND you're committed —
      // she's not throwing her life at a stranger.
      const mayaOffer = (s.companion === "Maya" || s.flags.maya) && s.romance === "maya" && s.flags.lovedMaya;
      if (mayaOffer) {
        intro += "Maya steps up beside her. She doesn't look at you — she can't. \"I can shoot. I can hold a gate. Let me do it, Ellis.\"\n\n";
      } else if (s.flags.maya) {
        // Maya didn't volunteer to stay (wrong romance, or not committed),
        // but she's in the camp. Give her a beat so she doesn't vanish.
        intro += "Maya is already at the gate, rifle braced across her forearm, pushing survivors through two at a time. She glances up at you. A short nod. Keep moving.\n\n";
      }
      // Ren doesn't volunteer to hold a gate — she volunteers to stay
      // with the too-wounded-to-walk so the column can move faster.
      const renOffer = s.romance === "ren" && s.flags.lovedRen;
      if (renOffer) {
        intro += "Ren's voice is quiet beside you. \"There are three in the medbay who can't walk. If I stay with them, the column moves twice as fast.\" She isn't asking.\n\n";
      } else {
        // Ren's always in camp by Day 5. If she isn't the one offering,
        // she's still here — med kit, steady hands, funneling the injured.
        intro += "Ren is further up, shepherding the walking wounded, med kit over her shoulder. She catches your eye once and keeps moving.\n\n";
      }
      intro += "The first of them are at the inner fence.";
      return intro;
    },
    choices: [
      { label: "\"No. We all go. Together.\"",
        effect: s => {
          s.flags.vegaSaved = true;
          s.flags.vegaSurvived = true;
          if (s.bonds) s.bonds.vega = (s.bonds.vega || 0) + 1;
          Game.toast("Vega's trust +1");
        },
        next: "flee_journey_1" },
      { label: "\"Go, Vega. We'll see you on the road.\"",
        effect: s => {
          s.flags.vegaStayedBehind = true;
        },
        next: "flee_journey_1" },
      { label: "\"Maya. Come back to me.\"",
        require: s => (s.companion === "Maya" || s.flags.maya) && s.romance === "maya" && s.flags.lovedMaya,
        effect: s => {
          s.flags.mayaSacrificed = true;
          s.flags.vegaSaved = true;
          s.flags.vegaSurvived = true;
        },
        next: "flee_journey_1" },
      { label: "\"Ren. Stay with them. I'll find you.\"",
        require: s => s.romance === "ren" && s.flags.lovedRen,
        effect: s => {
          s.flags.renSacrificed = true;
          s.flags.vegaSaved = true;
          s.flags.vegaSurvived = true;
        },
        next: "flee_journey_1" },
    ]
  },

  // ===== Day-5 flee journey: ten staggered engagements between the
  // back gate and the creek crossing. Only nodes in this block use the
  // timerSeconds / onTimeout countdown mechanic — deliberately scoped.
  // Each engagement sets a "_FellInFlight" flag on the lost character
  // so post_horde_flee narration + the final ending can pay it off.

  flee_journey_1: {
    scene: "flee_journey_runner_grab",
    sceneClass: "blood",
    chapter: "Day 5 — The Flight",
    speaker: "",
    text: "Ten minutes past the back gate. The column is bent low, breathing hard through the pines.\n\nAt the tail, Marisol — a mother of two, the one who darned your jacket last week — goes down hard. A runner has her calf in its teeth.\n\nShe screams your name.",
    timerSeconds: 7,
    onTimeout: "flee_journey_1_late",
    choices: [
      { label: "Drop the runner. Now.", tag: "COMBAT", tagClass: "danger",
        combat: { enemy: "runner_flee", onWin: "flee_journey_2", onLose: "death" } },
      { label: "Keep the column moving. Don't look back.",
        effect: s => {
          s.flags.marisolDied = true;
          s.flags.fleeLosses = (s.flags.fleeLosses || 0) + 1;
          Game.toast("Marisol — lost");
        },
        next: "flee_journey_2" },
    ]
  },

  flee_journey_1_late: {
    scene: "flee_journey_fallen",
    sceneClass: "blood",
    chapter: "Day 5 — The Flight",
    onEnter: s => {
      s.flags.marisolDied = true;
      s.flags.fleeLosses = (s.flags.fleeLosses || 0) + 1;
    },
    text: "Too long. The scream cuts off in the middle of your name.\n\nThe column doesn't stop. You don't either.",
    choices: [ { label: "Keep moving.", next: "flee_journey_2" } ]
  },

  flee_journey_2: {
    scene: "flee_journey_hunter",
    sceneClass: "forest",
    chapter: "Day 5 — The Flight",
    text: "Movement in the pines ahead — low, fast, wrong-shaped. Not shambling. Stalking.\n\nOne of them broke off from the horde and ran ahead to cut the column off. Smart, for something that used to be a man.",
    choices: [
      { label: "Hold the line. Put it down.", tag: "COMBAT", tagClass: "danger",
        combat: { enemy: "hunter_flee", onWin: "flee_journey_3", onLose: "death" } },
      { label: "Push through — don't give it a target.",
        effect: s => {
          s.hp = Math.max(1, s.hp - 2);
          Game.toast("−2 ❤️ (caught a swipe)");
        },
        next: "flee_journey_3" },
    ]
  },

  flee_journey_3: {
    scene: s => mayaInColumn(s) ? "flee_journey_maya" : "flee_journey_tomas",
    sceneClass: "blood",
    chapter: "Day 5 — The Flight",
    text: s => {
      if (mayaInColumn(s)) {
        return "A crash in the brush — Maya's voice, sharp, not scared. She's on her back in the pine needles, a walker clamped onto her jacket sleeve, her knife hand pinned under it.\n\nShe twists her head, finds you.\n\n\"Ellis —\"";
      }
      return "Tomás — the quiet one, the one who drew your map — goes down at the flank. A walker has him by the pack straps. He isn't a fighter. He was never a fighter.";
    },
    timerSeconds: s => mayaInColumn(s) ? 8 : 5,
    onTimeout: "flee_journey_3_late",
    choices: [
      { label: "Cover her — punch the walker off.",
        require: s => mayaInColumn(s),
        tag: "COMBAT", tagClass: "danger",
        combat: { enemy: "walker_flee", onWin: "flee_journey_4", onLose: "death" } },
      { label: "Pull Tomás free. Shoot the walker.",
        require: s => !mayaInColumn(s),
        tag: "COMBAT", tagClass: "danger",
        combat: { enemy: "walker_flee", onWin: "flee_journey_4", onLose: "death" } },
      { label: "\"Get yourself free. I have to hold the line.\"",
        require: s => mayaInColumn(s),
        effect: s => {
          // Maya's a fighter — 50/50 she claws her own way out.
          if (Math.random() < 0.5) {
            s.flags.mayaFellInFlight = true;
            s.flags.fleeLosses = (s.flags.fleeLosses || 0) + 1;
            Game.toast("Maya — fell");
          } else {
            Game.toast("Maya fought free.");
          }
        },
        next: "flee_journey_4" },
      { label: "Keep the column moving. He wouldn't want us stopping.",
        require: s => !mayaInColumn(s),
        effect: s => {
          s.flags.tomasDied = true;
          s.flags.fleeLosses = (s.flags.fleeLosses || 0) + 1;
          Game.toast("Tomás — lost");
        },
        next: "flee_journey_4" },
    ]
  },

  flee_journey_3_late: {
    scene: "flee_journey_fallen",
    sceneClass: "blood",
    chapter: "Day 5 — The Flight",
    onEnter: s => {
      if (mayaInColumn(s)) {
        // Timer expired — Maya gets the fighter's 50/50.
        if (Math.random() < 0.5) {
          s.flags.mayaFellInFlight = true;
          s.flags.fleeLosses = (s.flags.fleeLosses || 0) + 1;
        }
      } else {
        s.flags.tomasDied = true;
        s.flags.fleeLosses = (s.flags.fleeLosses || 0) + 1;
      }
    },
    text: s => {
      if (s.flags.mayaFellInFlight) return "By the time you turn, the walker's loose on her throat. Maya doesn't make a sound. That's the worst of it.";
      if (mayaInColumn(s)) return "She drags herself free with her teeth set and blood on her sleeve. She doesn't look at you as she passes.";
      return "Tomás goes quiet halfway through a scream. You don't turn around.";
    },
    choices: [ { label: "Keep moving.", next: "flee_journey_4" } ]
  },

  flee_journey_4: {
    scene: "flee_journey_parallel",
    sceneClass: "blood",
    chapter: "Day 5 — The Flight",
    text: "Two screams at once, from opposite flanks.\n\nDawit — the old mechanic who fixed the camp generator every Sunday — is on his back in the brush, a walker on top of him.\n\nKline — the kid who carried water for his grandmother — is stumbling, a runner lunging for his throat.\n\nYou can only reach one.",
    timerSeconds: 6,
    onTimeout: "flee_journey_4_late",
    choices: [
      { label: "Dawit. He's closer.",
        effect: s => {
          s.flags.klineDied = true;
          s.flags.fleeLosses = (s.flags.fleeLosses || 0) + 1;
          Game.toast("Kline — lost");
        },
        next: "flee_journey_5" },
      { label: "Kline. He's just a kid.",
        effect: s => {
          s.flags.dawitDied = true;
          s.flags.fleeLosses = (s.flags.fleeLosses || 0) + 1;
          Game.toast("Dawit — lost");
        },
        next: "flee_journey_5" },
    ]
  },

  flee_journey_4_late: {
    scene: "flee_journey_fallen",
    sceneClass: "blood",
    chapter: "Day 5 — The Flight",
    onEnter: s => {
      s.flags.dawitDied = true;
      s.flags.klineDied = true;
      s.flags.fleeLosses = (s.flags.fleeLosses || 0) + 2;
    },
    text: "You freeze.\n\nBy the time you pick, both screams are gone. The forest absorbs them the way forest absorbs anything.",
    choices: [ { label: "Keep moving.", next: "flee_journey_5" } ]
  },

  flee_journey_5: {
    scene: "flee_journey_hunter_pack",
    sceneClass: "forest",
    chapter: "Day 5 — The Flight",
    text: "The column crests a low ridge. Below, a dry creek bed.\n\nAnd in the creek bed: three hunters in a loose fan, already turning their heads toward your light.",
    choices: [
      { label: "Turn and put them down.", tag: "COMBAT", tagClass: "danger",
        combat: { enemy: "hunter_flee", onWin: "flee_journey_6", onLose: "death" } },
      { label: "Drive the column through. Shoulders down, run.",
        effect: s => {
          s.hp = Math.max(1, s.hp - 3);
          s.flags.fleeLosses = (s.flags.fleeLosses || 0) + 1;
          Game.toast("−3 ❤️ · someone in the column didn't make it");
        },
        next: "flee_journey_6" },
    ]
  },

  flee_journey_6: {
    scene: s => noraInColumn(s) ? "flee_journey_nora" : "flee_journey_mara",
    sceneClass: "blood",
    chapter: "Day 5 — The Flight",
    text: s => {
      if (noraInColumn(s)) {
        return "Nora trips. She hits the pine needles hard, loses the hand she had on your jacket.\n\nA runner is five paces from her and closing.\n\nShe doesn't scream. She just looks at you.";
      }
      return "Mara — barely sixteen, one of the ones the camp took in last month — catches a root with her boot. A walker has her by the hair before she's even fully down.";
    },
    // Non-combatants get the shortest timer — mandatory save.
    timerSeconds: 4,
    onTimeout: "flee_journey_6_late",
    choices: [
      { label: "Dive between them. Take the runner.",
        require: s => noraInColumn(s),
        tag: "COMBAT", tagClass: "danger",
        combat: { enemy: "runner_flee", onWin: "flee_journey_7", onLose: "death" } },
      { label: "Put the walker down before it tears.",
        require: s => !noraInColumn(s),
        tag: "COMBAT", tagClass: "danger",
        combat: { enemy: "walker_flee", onWin: "flee_journey_7", onLose: "death" } },
    ]
  },

  flee_journey_6_late: {
    scene: "flee_journey_fallen",
    sceneClass: "blood",
    chapter: "Day 5 — The Flight",
    onEnter: s => {
      if (noraInColumn(s)) {
        s.flags.noraFellInFlight = true;
        s.flags.fleeLosses = (s.flags.fleeLosses || 0) + 1;
      } else {
        s.flags.maraDied = true;
        s.flags.fleeLosses = (s.flags.fleeLosses || 0) + 1;
      }
    },
    text: s => s.flags.noraFellInFlight
      ? "You move. You're not fast enough.\n\nThe column keeps walking because the column has to keep walking. You don't. You just stand there for a long time."
      : "She was sixteen. That's all you can think, after.",
    choices: [ { label: "Keep moving.", next: "flee_journey_7" } ]
  },

  flee_journey_7: {
    scene: s => vegaInColumn(s) ? "flee_journey_vega" : "flee_journey_runner_pair",
    sceneClass: "blood",
    chapter: "Day 5 — The Flight",
    text: s => {
      if (vegaInColumn(s)) {
        return "You look back. Vega's fallen to the rear, carbine barking in short controlled bursts — and she's tangled. Three walkers in close on her, a fourth lurching in from the trees.\n\nShe doesn't call for help. She never would.";
      }
      return "Two runners break from the pines at the column's flank, sprinting low. No finesse, just speed. The column recoils.";
    },
    timerSeconds: s => vegaInColumn(s) ? 8 : 6,
    onTimeout: "flee_journey_7_late",
    choices: [
      { label: "Fall back to her. Cover fire.",
        require: s => vegaInColumn(s),
        tag: "COMBAT", tagClass: "danger",
        combat: { enemy: "hunter_flee", onWin: "flee_journey_8", onLose: "death" } },
      { label: "Trust her. Keep the column moving.",
        require: s => vegaInColumn(s),
        effect: s => {
          if (Math.random() < 0.5) {
            s.flags.vegaFellInFlight = true;
            s.flags.fleeLosses = (s.flags.fleeLosses || 0) + 1;
            Game.toast("Vega — fell");
          } else {
            Game.toast("Vega cut her way free.");
          }
        },
        next: "flee_journey_8" },
      { label: "Meet them. Drop both.",
        require: s => !vegaInColumn(s),
        tag: "COMBAT", tagClass: "danger",
        combat: { enemy: "runner_flee", onWin: "flee_journey_8", onLose: "death" } },
    ]
  },

  flee_journey_7_late: {
    scene: "flee_journey_fallen",
    sceneClass: "blood",
    chapter: "Day 5 — The Flight",
    onEnter: s => {
      if (vegaInColumn(s)) {
        if (Math.random() < 0.5) {
          s.flags.vegaFellInFlight = true;
          s.flags.fleeLosses = (s.flags.fleeLosses || 0) + 1;
        }
      } else {
        s.hp = Math.max(1, s.hp - 2);
        s.flags.fleeLosses = (s.flags.fleeLosses || 0) + 1;
      }
    },
    text: s => {
      if (s.flags.vegaFellInFlight) return "By the time the shots behind you stop, they stop for good.";
      if (vegaInColumn(s)) return "Vega's rifle coughs twice more, then goes silent, then — three minutes later — coughs again. She's catching up. She's still on her feet.";
      return "The runners tear through the line before anyone braces. Someone goes down. You keep everyone else moving.";
    },
    choices: [ { label: "Keep moving.", next: "flee_journey_8" } ]
  },

  flee_journey_8: {
    scene: s => renInColumn(s) ? "flee_journey_ren" : "flee_journey_ezra",
    sceneClass: "blood",
    chapter: "Day 5 — The Flight",
    text: s => {
      if (renInColumn(s)) {
        return "Ren is kneeling beside one of the walking wounded — a man from the kitchen crew whose leg opened up a mile back. She has his belt around his thigh as a tourniquet.\n\nA walker is six paces away and closing on them both.\n\nRen isn't moving. She's trying to keep him alive.";
      }
      return "Ezra — the scout who taught you to read trail sign — goes down in a heap, clutching his side. A runner is on him in two heartbeats.";
    },
    timerSeconds: s => renInColumn(s) ? 6 : 5,
    onTimeout: "flee_journey_8_late",
    choices: [
      { label: "Cover her. Drop the walker.",
        require: s => renInColumn(s),
        tag: "COMBAT", tagClass: "danger",
        combat: { enemy: "walker_flee", onWin: "flee_journey_9", onLose: "death" } },
      { label: "\"Ren — he's gone. Leave him.\"",
        require: s => renInColumn(s),
        effect: s => {
          // Ren obeys — she abandons the dying man to save herself.
          // The wounded man counts as a loss; Ren survives.
          s.flags.keekDied = true;
          s.flags.fleeLosses = (s.flags.fleeLosses || 0) + 1;
          s.flags.renLeftPatient = true;
          Game.toast("She left him. She won't forget it.");
        },
        next: "flee_journey_9" },
      { label: "Cut the runner off Ezra.",
        require: s => !renInColumn(s),
        tag: "COMBAT", tagClass: "danger",
        combat: { enemy: "runner_flee", onWin: "flee_journey_9", onLose: "death" } },
    ]
  },

  flee_journey_8_late: {
    scene: "flee_journey_fallen",
    sceneClass: "blood",
    chapter: "Day 5 — The Flight",
    onEnter: s => {
      if (renInColumn(s)) {
        s.flags.renFellInFlight = true;
        s.flags.keekDied = true;
        s.flags.fleeLosses = (s.flags.fleeLosses || 0) + 2;
      } else {
        s.flags.ezraDied = true;
        s.flags.fleeLosses = (s.flags.fleeLosses || 0) + 1;
      }
    },
    text: s => s.flags.renFellInFlight
      ? "She wouldn't leave him. She never would have. You get there a second too late for both of them."
      : "Ezra goes still before you can reach him. You turn the column away from the sound.",
    choices: [ { label: "Keep moving.", next: "flee_journey_9" } ]
  },

  flee_journey_9: {
    scene: "flee_journey_parallel2",
    sceneClass: "blood",
    chapter: "Day 5 — The Flight",
    text: s => {
      if (mayaInColumn(s) && noraInColumn(s)) {
        return "Two different kinds of scream.\n\nMaya — to your left, teeth bared, driven back step by step by a hunter she can't quite shake.\n\nNora — to your right, in the grass, not screaming, hands over her head, a walker dragging itself toward her.\n\nYou pick. You live with it.";
      }
      if (mayaInColumn(s)) {
        return "Maya's pinned against a pine trunk, a hunter ducking under her rifle, too close for the barrel.\n\nShe's good. She might not be good enough.";
      }
      if (noraInColumn(s)) {
        return "Nora. Fallen. A walker's hand already closing on her ankle.\n\nShe's looking at you.";
      }
      // Nobody named left — two strangers.
      return "Two strangers go down at the same moment — Ines, the camp gardener, and Otto, the boy who mended fences.\n\nYou can only save one.";
    },
    timerSeconds: 5,
    onTimeout: "flee_journey_9_late",
    choices: [
      { label: "Nora. Always Nora.",
        require: s => mayaInColumn(s) && noraInColumn(s),
        effect: s => {
          // Maya gets the fighter's 50/50.
          if (Math.random() < 0.5) {
            s.flags.mayaFellInFlight = true;
            s.flags.fleeLosses = (s.flags.fleeLosses || 0) + 1;
            Game.toast("Maya — fell");
          } else {
            Game.toast("Maya cut herself free.");
          }
        },
        next: "flee_journey_10" },
      { label: "Maya. She can't fight alone forever.",
        require: s => mayaInColumn(s) && noraInColumn(s),
        effect: s => {
          // Nora can't survive alone. Hard loss.
          s.flags.noraFellInFlight = true;
          s.flags.fleeLosses = (s.flags.fleeLosses || 0) + 1;
          Game.toast("Nora — lost");
        },
        next: "flee_journey_10" },
      { label: "Pull the hunter off her.",
        require: s => mayaInColumn(s) && !noraInColumn(s),
        tag: "COMBAT", tagClass: "danger",
        combat: { enemy: "hunter_flee", onWin: "flee_journey_10", onLose: "death" } },
      { label: "Dive for Nora.",
        require: s => !mayaInColumn(s) && noraInColumn(s),
        tag: "COMBAT", tagClass: "danger",
        combat: { enemy: "walker_flee", onWin: "flee_journey_10", onLose: "death" } },
      { label: "Otto. He's the kid.",
        require: s => !mayaInColumn(s) && !noraInColumn(s),
        effect: s => {
          s.flags.inesDied = true;
          s.flags.fleeLosses = (s.flags.fleeLosses || 0) + 1;
          Game.toast("Ines — lost");
        },
        next: "flee_journey_10" },
      { label: "Ines. She has people waiting.",
        require: s => !mayaInColumn(s) && !noraInColumn(s),
        effect: s => {
          s.flags.ottoDied = true;
          s.flags.fleeLosses = (s.flags.fleeLosses || 0) + 1;
          Game.toast("Otto — lost");
        },
        next: "flee_journey_10" },
    ]
  },

  flee_journey_9_late: {
    scene: "flee_journey_fallen",
    sceneClass: "blood",
    chapter: "Day 5 — The Flight",
    onEnter: s => {
      if (noraInColumn(s)) {
        // Non-combatant can't survive alone — she dies on timeout.
        s.flags.noraFellInFlight = true;
        s.flags.fleeLosses = (s.flags.fleeLosses || 0) + 1;
      }
      if (mayaInColumn(s)) {
        // Maya gets her 50/50.
        if (Math.random() < 0.5) {
          s.flags.mayaFellInFlight = true;
          s.flags.fleeLosses = (s.flags.fleeLosses || 0) + 1;
        }
      }
      if (!mayaInColumn(s) && !noraInColumn(s)) {
        s.flags.inesDied = true;
        s.flags.ottoDied = true;
        s.flags.fleeLosses = (s.flags.fleeLosses || 0) + 2;
      }
    },
    text: s => s.flags.noraFellInFlight && s.flags.mayaFellInFlight
      ? "You froze. Both gone."
      : s.flags.noraFellInFlight
      ? "You froze. Nora's gone. You'll carry that."
      : s.flags.mayaFellInFlight
      ? "You froze. Maya's down. You'll carry that."
      : "You froze for a heartbeat too long. Two names you won't say out loud tonight.",
    choices: [ { label: "Keep moving.", next: "flee_journey_10" } ]
  },

  flee_journey_10: {
    scene: "flee_journey_final",
    sceneClass: "blood",
    chapter: "Day 5 — The Flight",
    text: "The creek ford. Water to your knees. The column is halfway across when the last of them breaks from the treeline behind you — two hunters, running flat out.\n\nThis is the last one. Then it's over.",
    choices: [
      { label: "Turn. Meet them in the water.", tag: "COMBAT", tagClass: "danger",
        combat: { enemy: "hunter_flee", onWin: "post_horde_flee", onLose: "death" } },
    ]
  },

  post_horde_win: {
    scene: "ending_dawn",
    sceneClass: "blood",
    chapter: "Sunrise — After",
    text: function(s) {
      // Vega stood the wall with you and lived through it. Mark her
      // survival for any Part 2 carryover.
      s.flags.vegaSurvived = true;
      if (s.romance === "maya" && s.flags.lovedMaya) {
        return "Maya finds you in the smoke, blood on her sleeve and most of it not hers. She presses her forehead to yours and breathes out — a long, shaking exhale. Alive. Both of you. Alive.";
      }
      if (s.romance === "ren" && s.flags.lovedRen) {
        return "Ren is already at work — bandaging, splinting, refusing to look at the bodies on the fence. When you reach her she doesn't speak. She just buries her face in your shoulder and stays there for a long time.";
      }
      let base = "The horde is a still field. The fence holds. Someone is laughing through tears.";
      // Camp medic survived — acknowledge her even without romance.
      base += "\n\nRen is at the wall, stitching a graze on a man's scalp with steady hands. She glances up at you as you pass, nods once — you did. We did.";
      if (s.companion2 === "Nora") {
        base += "\n\nA child finds your hand.";
      } else if (s.flags.coward) {
        // Callback for closing the freezer door on Day 1.
        base += "\n\nYou think, unbidden, of a freezer you didn't open. You wonder what colour the walls went.";
      } else if (s.flags.solo) {
        // Pay off the 'I work better alone' / silent-stairwell beat.
        base += "\n\nNo one finds your hand. You made it alone. That was the whole idea.";
      }
      if (s.flags.honourable) {
        // Callback for leaving Mrs. Cho in peace. Folded in at the end
        // as a grace note, independent of the companion branch above.
        base += "\n\nA long breath. You think of an armchair. Of a small door you left shut. Of a woman who didn't have to become something she never wanted to be.";
      }
      return base;
    },
    choices: [
      { label: "— THE END —", next: function(s) {
        return s.romance ? "ending_final_lovers" : "ending_final_hero";
      } },
    ]
  },

  post_horde_lose: {
    scene: "ending_grave",
    sceneClass: "blood",
    chapter: "Sunset — A Memorial",
    text: function(s) {
      if (s.romance === "maya" && s.flags.lovedMaya) {
        return "Maya carries you to the back of the camp when your legs give out. She's saying something — your name, over and over. The world dims softly, like a lantern turned down.\n\nShe holds your hand until it's cold.";
      }
      if (s.romance === "ren" && s.flags.lovedRen) {
        return "Ren sings the song. The one her grandmother taught her. She sings it the whole way through, and then again, and then once more.\n\nYou hear all three.";
      }
      // Ren is the camp medic — if nobody else is with the dying hero,
      // she is. No romance, just presence. If Nora survived too, she
      // sits on the floor at the foot of the cot and doesn't leave.
      let base = "They'll say you held the line longer than any one person should.\n\nRen stays with you in the medbay when the others can't. She doesn't try to fix you — she knows. She just keeps one hand on yours and hums something low, a song from before.";
      if (s.companion2 === "Nora") {
        base += "\n\nNora sits on the floor at the foot of the cot. Nobody tells her to. Nobody can make her leave either.";
      }
      return base + "\n\nThey'll carve your name beside the others.";
    },
    choices: [
      { label: "— THE END —", next: function(s) {
        return s.romance ? "ending_final_loverlost" : "ending_final_fallen";
      } },
    ]
  },

  post_horde_flee: {
    scene: "ending_road",
    sceneClass: "forest",
    chapter: "Dawn — The Long Road",
    text: function(s) {
      // Rearguard beats come first — they colour everything after.
      let opener = "";
      if (s.flags.mayaSacrificed) {
        opener = "Maya stayed. You didn't argue — you couldn't. The last thing you saw was her profile in the muzzle flash, calm, picking targets. The gate held long enough. Long enough is what she gave you.\n\n";
      } else if (s.flags.renSacrificed) {
        opener = "Ren stayed. Three cots she couldn't move — three hands she wouldn't let go of. The medbay door shut behind her with a soft click you shouldn't have been close enough to hear. You heard it anyway.\n\n";
      } else if (s.flags.vegaStayedBehind && s.flags.gaveGrenade) {
        // She had the pull-pin you handed her at the gate. That
        // changes the math — she breaks the line with it and catches
        // up to the column. If Nora's with you, the catch-up plays
        // through her question: she asks where Vega is, Vega's voice
        // answers from behind.
        opener = "Vega stayed.\n\nTwenty minutes down the pines, a flat concussive thump rolls through the trees behind you — that grenade you gave her at the gate, finally good for something.\n\n";
        if (s.companion2 === "Nora") {
          opener += "Two hours in, Nora's small voice at your hip: \"Where's Captain Vega?\"\n\nBefore you can answer — boots on the path behind the column. A low voice, steady as a heartbeat: \"Right here, kid.\"\n\nThe column parts for her. Vega's catching up, smoke still on her jacket, a graze above one eye. Nora's grip on your sleeve loosens. Vega passes her hand once across the top of Nora's head without breaking stride — and falls in at your shoulder.\n\n";
        } else {
          opener += "Half an hour later, boots on the path behind the column. She catches up at the first creek crossing, smoke still on her jacket, a graze above one eye. She doesn't say anything. She just falls in at your shoulder and keeps walking.\n\n";
        }
      } else if (s.flags.vegaStayedBehind) {
        opener = "Vega stayed. Somewhere behind you — four minutes back, then five, then gone — her rifle was still working. Then it wasn't. The column kept walking. She'd have wanted that.\n\n";
      } else if (s.flags.vegaSaved && s.flags.vegaFellInFlight) {
        opener = "Nobody stayed at the gate — but the forest took its price anyway. Vega went down on the road, tangled in three of them with her carbine dry. She didn't call for help. She never would have.\n\n";
      } else if (s.flags.vegaSaved) {
        opener = "Nobody stayed. Vega walks the column's flank with her rifle low and her jaw tight. Every so often she glances back, checking no one's lagging. Nobody is.\n\n";
      }
      // Flight losses — in-column deaths between the gate and the creek.
      // Layered after the rearguard opener so the rearguard beat still
      // sets the tone. Named characters get their own lines; generic
      // stranger losses get a summary body-count.
      let flightLosses = "";
      if (s.flags.mayaFellInFlight) {
        flightLosses += "Maya went down in the pines, a walker on her before she could bring her knife up. You didn't see the end of it. You made yourself not look.\n\n";
      }
      if (s.flags.renFellInFlight) {
        flightLosses += "Ren wouldn't leave the wounded man she was working on. You reached them a heartbeat late. Both of them.\n\n";
      }
      if (s.flags.noraFellInFlight) {
        flightLosses += "Nora didn't make the creek. You still feel the absence where her hand should be.\n\n";
      }
      const strangers = [
        s.flags.marisolDied && "Marisol",
        s.flags.tomasDied && "Tomás",
        s.flags.dawitDied && "Dawit",
        s.flags.klineDied && "Kline",
        s.flags.maraDied && "Mara",
        s.flags.keekDied && "a man whose name you never caught",
        s.flags.ezraDied && "Ezra",
        s.flags.inesDied && "Ines",
        s.flags.ottoDied && "Otto",
      ].filter(Boolean);
      if (strangers.length) {
        const names = strangers.length === 1 ? strangers[0]
                    : strangers.length === 2 ? strangers[0] + " and " + strangers[1]
                    : strangers.slice(0, -1).join(", ") + ", and " + strangers[strangers.length - 1];
        flightLosses += "Between the gate and the creek, the forest took " + names + ". You remember each one's face. You'll keep remembering.\n\n";
      }
      // Nora's voice in the column when someone didn't make it. One
      // small beat — she asks once, and you have to answer. Skip for
      // Vega if she caught up via the grenade you gave her.
      let noraTail = "";
      const vegaLost = s.flags.vegaStayedBehind && !s.flags.gaveGrenade;
      if (s.companion2 === "Nora" && (s.flags.mayaSacrificed || s.flags.renSacrificed || vegaLost)) {
        const who = s.flags.mayaSacrificed ? "Maya"
                  : s.flags.renSacrificed  ? "Ren"
                  : "Captain Vega";
        noraTail = "\n\nTwo hours in, Nora's small voice at your hip: \"Where's " + who + "?\" You don't have a good answer. You tell her the true one anyway.";
      }
      let body;
      if (s.flags.mayaSacrificed) {
        // Romance-specific close-outs take priority; but Maya-sacrifice
        // overrides the lover-walking line since she isn't walking.
        body = "You walk point. The pines swallow the light of the burning camp. Twenty people follow you because somebody has to lead. You keep your eyes forward. If you look back, you won't keep going.";
      } else if (s.flags.renSacrificed) {
        // Same structure — Ren isn't walking either.
        body = "You walk point. You carry her stethoscope in your jacket pocket. Twenty people follow you. You keep walking because that's what she stayed for.";
      } else if (s.romance === "maya" && s.flags.lovedMaya) {
        body = "Twenty survivors follow your light through the pines. Maya walks beside you, her hand finding yours in the dark. Neither of you lets go.";
      } else if (s.romance === "ren" && s.flags.lovedRen) {
        body = "Ren walks at the back, helping the slow ones. When you look over your shoulder, she looks up at you and smiles — small and certain.";
      } else if (s.companion2 === "Nora") {
        body = "Nora's hand is sticky in yours. She doesn't ask where you're going. None of them do. They follow your light.";
      } else if (s.flags.solo) {
        body = "You walk point. Nobody walks beside you. The others are back there in the dark, hands in each other's pockets; you picked this gap a long time ago, in a stairwell, in a pine forest, at a gate. You keep walking.";
      } else {
        body = "The camp burns behind you. You don't know where you're going. You know you'll keep going.";
      }
      // Acknowledge survivors who made it out. Skip if they're the
      // romance lead (already covered) or they were the one who stayed.
      let aside = "";
      const mayaAlive = s.flags.maya && !s.flags.mayaSacrificed && !s.flags.mayaFellInFlight && !(s.romance === "maya" && s.flags.lovedMaya);
      const renAlive  = !s.flags.renSacrificed && !s.flags.renFellInFlight && !(s.romance === "ren"  && s.flags.lovedRen);
      if (mayaAlive && renAlive) {
        aside = "\n\nMaya walks the flank, rifle low, eyes on the trees. Ren threads through the column with her med kit, bandaging blisters, catching stragglers. Neither of them has stopped moving since the gate.";
      } else if (mayaAlive) {
        aside = "\n\nMaya walks the flank, rifle low, eyes on the trees. Every so often she drifts in close enough to check you're still on your feet, then drifts out again.";
      } else if (renAlive) {
        aside = "\n\nRen threads through the column, med kit over her shoulder, bandaging blisters, catching stragglers. When she passes you she squeezes your arm once and keeps going.";
      }
      return opener + flightLosses + body + aside + noraTail;
    },
    choices: [
      { label: "— THE END —", next: function(s) {
        // Sacrifices at the gate take precedence; a rearguard loss is
        // a different grief than a flight loss. Then flight deaths of
        // named characters, then Vega-at-gate, then the default road.
        if (s.flags.mayaSacrificed || s.flags.mayaFellInFlight) return "ending_final_maya_fell";
        if (s.flags.renSacrificed  || s.flags.renFellInFlight)  return "ending_final_ren_fell";
        if (s.flags.vegaStayedBehind && s.flags.gaveGrenade) return "vega_epilogue";
        // Vega fell — at the gate, or on the road. Image + memorial
        // text plays on every path.
        if (s.flags.vegaStayedBehind || s.flags.vegaFellInFlight) return "ending_final_vega_fell";
        return s.romance ? "ending_final_lovers_road" : "ending_final_escape";
      } },
    ]
  },

  mission_journey: {
    scene: function(s) {
      const p = s.flags && s.flags.missionPartner;
      if (p === "maya") return "mission_journey_maya";
      if (p === "ren")  return "mission_journey_ren";
      return "mission_journey_solo";
    },
    sceneClass: "forest",
    chapter: "Day 4 — South Road",
    text: function(s) {
      let base;
      // Common opener — you're actually leaving camp now.
      const opener = "You shoulder the pack. The camp gate opens behind you and shuts again. Late afternoon light through the trees, long shadows crossing the service road.\n\n";
      if (s.flags.missionPartner === "maya") {
        const skippedHerChore = s.flags.choreChosen && s.flags.choreChosen !== "perimeter";
        base = opener + "Maya walks point. Three steps ahead, eyes everywhere. The pines thin into a service road.";
        if (skippedHerChore) {
          // She picked you for the mission anyway — but she noticed you
          // didn't pick her this morning. She's not letting it slide.
          base += "\n\n\"Ren's good with her hands,\" she says after a while, not turning around. \"I'm not pretending I'm not a little pissed you noticed that first.\"";
          base += "\n\nA long beat. Gravel under your boots.\n\n\"You ever miss anything from before?\"";
        } else {
          base += "\n\n\"You ever miss anything from before?\" she asks, not turning around.";
        }
      } else if (s.flags.missionPartner === "ren") {
        base = opener + "Ren keeps pace beside you. She hums, low — a song you almost recognise.\n\n\"My grandmother used to sing it,\" she says when she catches you listening. \"It's the only thing of hers I have left.\"";
        base += "\n\nThe humming stops as the hospital squats into view.\n\n\"Worked Mercy's ER the first month,\" she says quietly, like it explains something. \"If my hands shake later — that's why.\"\n\nShe starts humming again.";
      } else {
        base = opener + "You walk alone. Every shadow is a question. Every step is loud.\n\nA mile in, your boot knocks a hubcap and you flinch hard enough to bruise yourself. You stop. Listen. Nothing. Just pines.";
        if (s.flags.solo) {
          base += "\n\nA memory tries the door. You don't open it.";
        } else {
          base += "\n\nYou catch yourself thinking about the camp behind you. About what you left there.";
        }
      }
      if (s.flags.bringNora) {
        base += "\n\nNora walks between you, one hand in your jacket. She watches the treeline like it might blink first.";
      }
      return base;
    },
    choices: [
      { label: "\"I should've walked the treeline with you.\"",
        require: s => s.flags.missionPartner === "maya"
          && s.flags.choreChosen && s.flags.choreChosen !== "perimeter",
        effect: s => { s.bonds.maya += 1; Game.toast("Maya's trust +1"); },
        next: "hospital_arrive" },
      { label: "\"Coffee. Real coffee.\"",
        require: s => s.flags.missionPartner === "maya",
        effect: s => { s.bonds.maya += 1; },
        next: "hospital_arrive" },
      { label: "\"My sister. She made me feel less alone.\"",
        require: s => s.flags.missionPartner === "maya",
        effect: s => { s.bonds.maya += 2; Game.toast("Maya's trust +2"); },
        next: "hospital_arrive" },
      { label: "\"Sing it for me.\"",
        require: s => s.flags.missionPartner === "ren",
        effect: s => { s.bonds.ren += 2; Game.toast("Ren's trust +2"); },
        next: "hospital_arrive" },
      { label: "Walk in companionable silence",
        require: s => s.flags.missionPartner === "ren",
        effect: s => { s.bonds.ren += 1; },
        next: "hospital_arrive" },
      { label: "Let yourself remember a face from before. Just for a mile.",
        require: s => s.flags.solo_mission,
        effect: s => { Game.toast("You let yourself grieve. Briefly."); },
        next: "hospital_arrive" },
      { label: "Don't. Count your steps. Five hundred more, then stop.",
        require: s => s.flags.solo_mission,
        effect: s => { s.stam = s.stamMax; Game.toast("⚡ steadied"); },
        next: "hospital_arrive" },
      { label: "Push on in silence.",
        require: s => s.flags.solo_mission,
        next: "hospital_arrive" },
    ]
  },

  hospital_arrive: {
    scene: function(s) {
      const p = s.flags && s.flags.missionPartner;
      if (p === "maya") return "hospital_arrive_maya";
      if (p === "ren")  return "hospital_arrive_ren";
      return "hospital_arrive_solo";
    },
    sceneClass: "city",
    chapter: "Day 4 — Old Mercy",
    text: function(s) {
      let base = "The hospital squats against the dusk like a wounded animal. The red cross above the door has bled brown.\n\nSomething moves inside.";
      if (s.flags.bringNora) {
        base += "\n\nNora's hand tightens on your sleeve. You crouch, find her eyes. \"Stay behind me. Don't look at what I do. If I say run, you run all the way back to the road. Okay?\"\n\nShe nods once. She doesn't let go of your sleeve.";
      }
      return base;
    },
    choices: [
      { label: "Through the front. Loud and fast.",
        next: "pharmacy_combat" },
    ]
  },

  pharmacy_combat: {
    scene: function(s) {
      const p = s.flags && s.flags.missionPartner;
      if (p === "maya") return "pharmacy_combat_maya";
      if (p === "ren")  return "pharmacy_combat_ren";
      return "pharmacy_combat_solo";
    },
    sceneClass: "blood",
    chapter: "Day 4 — Pharmacy",
    text: function(s) {
      let base = "Something heavy shifts at the back of the aisle — wrong-shaped, bloated, its skin split open in seeping black fissures. A bloater. The air around it shimmers; your eyes sting before it even turns.\n\nDon't close. Don't let it grab you.";
      if (s.flags.bringNora) {
        base += "\n\nYou shove Nora down behind the checkout counter and wave her farther back. The gas drifts low.";
      }
      return base;
    },
    choices: [
      { label: "Fight", tag: "COMBAT", tagClass: "danger",
        combat: { enemy: "bloater", onWin: "hospital_lobby", onLose: "death" } },
    ]
  },

  hospital_lobby: {
    scene: function(s) {
      const p = s.flags && s.flags.missionPartner;
      if (p === "maya") return "hospital_lobby_maya";
      if (p === "ren")  return "hospital_lobby_ren";
      return "hospital_lobby_solo";
    },
    sceneClass: "indoor",
    chapter: "Day 4 — Lobby",
    speaker: function(s) {
      return s.flags.missionPartner === "maya" ? "Maya"
           : s.flags.missionPartner === "ren"  ? "Ren"
           : "";
    },
    text: function(s) {
      let base;
      if (s.flags.missionPartner === "maya") {
        base = "You drop into a row of waiting chairs. Maya sits beside you — not touching, but close.\n\n\"You handle yourself. I noticed.\"\n\nA streetlight, somehow still alive, hums outside. She hasn't looked away from you.";
      } else if (s.flags.missionPartner === "ren") {
        base = "Ren is shaking. She sits on the floor, back to a vending machine, knees up.\n\n\"I hate this part. After. When my hands remember.\"\n\nYou sit beside her. Her breath slows when you do.";
      } else {
        base = "You sit alone in a row of cracked plastic chairs. Stuff a backpack with what you came for. The hospital exhales around you — old breath, no life.\n\nThe vending machine flickers. A poster on the wall says HAVE YOU WASHED YOUR HANDS. Someone drew a face on it a long time ago.\n\nYou could sit another minute. Or you could go.";
      }
      if (s.flags.bringNora) {
        base += "\n\nNora is already out from under the counter. She crosses the lobby without being told and presses herself against your side. You feel her shaking through your jacket.";
      }
      return base;
    },
    choices: [
      { label: "Lean closer. Let Maya see you see her.",
        require: s => s.flags.missionPartner === "maya",
        effect: s => {
          s.bonds.maya += 2;
          // Explicit 'I'm into you' — locks Ren's bonfire option out.
          s.flags.committedMaya = true;
          Game.toast("Maya's trust +2");
        },
        next: "mission_return" },
      { label: "Keep it professional. Stand up.",
        require: s => s.flags.missionPartner === "maya",
        next: "mission_return" },
      { label: "Take Ren's hand. Say nothing.",
        require: s => s.flags.missionPartner === "ren",
        effect: s => {
          s.bonds.ren += 2;
          s.flags.committedRen = true;
          Game.toast("Ren's trust +2");
        },
        next: "mission_return" },
      { label: "Give Ren space. Pack the bag.",
        require: s => s.flags.missionPartner === "ren",
        next: "mission_return" },
      { label: "Sit the extra minute. You've earned it.",
        require: s => s.flags.solo_mission,
        effect: s => {
          s.hp = s.hpMax;
          s.stam = s.stamMax;
          Game.toast("❤️ ⚡ restored");
        },
        next: "mission_return" },
      { label: "Pack and go. Don't make yourself a target.",
        require: s => s.flags.solo_mission,
        next: "mission_return" },
    ]
  },

  mission_return: {
    scene: "greenbelt_camp",
    sceneClass: "forest",
    chapter: "Day 4 — Camp, dusk",
    text: function(s) {
      const p = s.flags.missionPartner;
      let base;
      if (p === "ren") {
        base = "Ren drops the med bag on the aid-tent table and is already sorting bottles by label before she's even shrugged her jacket off. She catches your eye, exhales once — that was close — then goes back to work.";
      } else if (p === "maya") {
        base = "Maya lets you carry the med bag the last hundred yards. You hand it to Ren at the aid tent — who beams, just for a second — and Maya peels off to dump her rifle on her cot.";
      } else {
        base = "You hand the meds to Ren — who beams, just for a second.";
      }
      if (s.flags.bringNora) {
        base += "\n\nNora doesn't let go of your jacket until you've both sat down on the cot. Then she does — slow, like she had to think about it.";
      }
      base += "\n\nOn your way " + (p === "ren" ? "out of the tent" : "back") + " you notice something at the south fence: a chain link, cleanly cut. Not zombies. Hands.";
      return base;
    },
    choices: [
      { label: "Investigate the cut fence", tag: "CLUE", tagClass: "warn",
        effect: s => {
          // Sneaking out alone. Nobody's with you at the fence.
          delete s.flags.missionPartner;
          delete s.flags.solo_mission;
          delete s.flags.bringNora;
        },
        next: "investigate_traitor" },
      { label: "Mention it to Vega in the morning. Get warm by the fire.",
        effect: s => {
          // Back at camp — the mission is over, companion rules apply again.
          delete s.flags.missionPartner;
          delete s.flags.solo_mission;
          delete s.flags.bringNora;
        },
        next: "bonfire_invite" },
    ]
  },

  investigate_traitor: {
    scene: "gate_ajar_night",
    sceneClass: "night",
    chapter: "Day 4 — South Fence",
    text: function(s) {
      if (s.companion === "Maya") {
        return "Bolt cutters in the brush. Fresh boot prints. Whoever did this is in the camp — and they're coming back.\n\nMaya is already there, rifle low, crouched beside you. She must have heard you slip out.\n\n\"Can't say I'm surprised,\" she murmurs. \"What's the plan?\"";
      }
      return "Bolt cutters in the brush. Fresh boot prints. Whoever did this is in the camp — and they're coming back.";
    },
    choices: [
      { label: "Lie in wait", tag: "RISKY", tagClass: "warn", next: "confront_traitor" },
      { label: "Tell Vega and bring the cavalry",
        effect: s => {
          s.flags.toldVega = true;
          s.bonds.vega = (s.bonds.vega || 0) + 1;
          Game.toast("Vega's trust +1");
        },
        next: "confront_traitor" },
    ]
  },

  confront_traitor: {
    scene: function(s) {
      return s.flags && s.flags.toldVega ? "confront_traitor_vega" : "confront_traitor";
    },
    sceneClass: "night",
    chapter: "Day 4 — South Fence",
    speaker: "???",
    text: function(s) {
      const withMaya = s.companion === "Maya";
      if (s.flags.toldVega) {
        if (withMaya) {
          return "Vega on your left with a blinding rifle flashlight. Maya on your right, rifle up, breath even. You between them. The man crouched at the cut fence spins — a trader from two tents over. Calder. Sleeve pushed up. The bite mark on his forearm is fresh and black.\n\n\"Please. They said if I let them in, they'd let me live. I have a d—\"\n\nHis throat spasms. His eyes fog. The bite has already won — and you're the only clean angle.";
        }
        return "Vega moves like she's done this before — rifle shouldered, blinding flashlight cutting the dust at your back. The man crouched at the cut fence spins. A trader from two tents over — Calder. Sleeve pushed up. The bite mark on his forearm is fresh and black.\n\n\"Please. They said if I let them in, they'd let me live. I have a d—\"\n\nHis throat spasms. His eyes fog. The bite has already won — and you're between him and Vega's rifle.";
      }
      if (withMaya) {
        return "You and Maya wait in the brush, motionless. He doesn't see her until after he sees you.\n\nA trader from two tents over — Calder. Sleeve pushed up. The bite mark on his forearm is fresh and black.\n\n\"Please. They said if I let them in, they'd let me live. I have a d—\"\n\nHis throat spasms. His eyes fog. The bite has already won.";
      }
      return "He freezes when he sees you. A trader from two tents over — Calder. Sleeve pushed up. The bite mark on his forearm is fresh and black.\n\n\"Please. They said if I let them in, they'd let me live. I have a d—\"\n\nHis throat spasms. His eyes fog. The bite has already won.";
    },
    choices: [
      { label: "He lunges. Put him down.", tag: "BOSS", tagClass: "danger",
        combat: function (s) {
          return {
            enemy: "traitor",
            // Vega's rifles cover you on the cavalry path — not risky.
            risky: !s.flags.toldVega,
            onWin: "traitor_aftermath",
            onLose: "death",
          };
        } },
    ]
  },

  traitor_aftermath: {
    scene: function(s) {
      return s.flags && s.flags.toldVega ? "traitor_aftermath_vega" : "traitor_aftermath";
    },
    sceneClass: "night",
    chapter: "Day 4 — South Fence",
    text: function(s) {
      const withMaya = s.companion === "Maya";
      if (s.flags.toldVega) {
        let base = "It's over. He's smaller now. Calder again, almost.\n\nVega lowers her rifle and spits into the grass. \"Whole camp hears about this before sunrise,\" she says, already turning toward the bell.";
        if (withMaya) {
          base += "\n\nMaya drops into a crouch beside the body and starts checking pockets, professional. \"Names in his wallet,\" she says without looking up. \"If he was signalling, the ones on the outside aren't far.\"";
        }
        base += "\n\nRen is already at the fence by the time the bell starts. She catches your eye once — gratitude, quick as a blink — then kneels beside the body with a clean sheet.";
        return base;
      }
      if (withMaya) {
        return "It's over. He's smaller now. Calder again, almost.\n\nMaya lowers her rifle slow. \"You okay?\" she asks without taking her eyes off the body.\n\n\"No.\"\n\n\"Neither am I. Choice still yours, though.\"";
      }
      return "It's over. He's smaller now. Calder again, almost.\n\nYou stand in the dark with the weight of it — and the choice still yours.";
    },
    choices: [
      { label: "Bury him quietly. The camp will not know.", tag: "HARD", tagClass: "danger",
        require: s => !s.flags.toldVega,
        effect: s => {
          s.flags.killedTraitor = true;
          // Maya is ex-military — burying this instead of reporting
          // reads as a command failure to her. Costs her real trust.
          if (s.flags.maya && s.bonds) {
            s.bonds.maya = Math.max(0, (s.bonds.maya || 0) - 2);
            Game.toast("The camp will not know · Maya's trust -2");
          } else {
            Game.toast("The camp will not know.");
          }
        },
        next: "bonfire_invite" },
      { label: "Tell Vega. They deserve the truth.",
        require: s => !s.flags.toldVega,
        effect: s => {
          s.flags.exposedTraitor = true;
          // Vega opens the armory; camp reinforces the fence overnight.
          s.ammo += 2;
          Game.giveRandomItem();
          if (s.bonds) {
            s.bonds.ren = (s.bonds.ren || 0) + 1;
            s.bonds.vega = (s.bonds.vega || 0) + 1;
            // Maya helped put him down. She approves of you owning it.
            if (s.companion === "Maya") s.bonds.maya = (s.bonds.maya || 0) + 1;
          }
          Game.toast(s.companion === "Maya"
            ? "+2 🔫  · Ren's trust +1 · Vega's trust +1 · Maya's trust +1"
            : "+2 🔫  · Ren's trust +1 · Vega's trust +1");
        },
        next: s => (s.bonds.vega >= 3 && !s.flags.vegaRifleGiven) ? "vega_gift" : "bonfire_invite" },
      { label: "Help Vega rouse the camp. Reinforce the fence tonight.",
        require: s => s.flags.toldVega,
        effect: s => {
          s.flags.exposedTraitor = true;
          s.ammo += 2;
          Game.giveRandomItem();
          if (s.bonds) {
            s.bonds.ren = (s.bonds.ren || 0) + 1;
            s.bonds.vega = (s.bonds.vega || 0) + 1;
            if (s.companion === "Maya") s.bonds.maya = (s.bonds.maya || 0) + 1;
          }
          Game.toast(s.companion === "Maya"
            ? "+2 🔫  · Ren's trust +1 · Vega's trust +1 · Maya's trust +1"
            : "+2 🔫  · Ren's trust +1 · Vega's trust +1");
        },
        next: s => (s.bonds.vega >= 3 && !s.flags.vegaRifleGiven) ? "vega_gift" : "bonfire_invite" },
    ]
  },

  vega_gift: {
    sceneClass: "forest",
    chapter: "Day 4 — Armory, after",
    speaker: "Captain Vega",
    text: "Vega finds you outside the medbay. She wasn't looking for you. She's holding her own rifle — not the camp spares, hers — in one hand, already carrying a spare in the other.\n\n\"You didn't have to tell me about Calder. You did it anyway.\"\n\nShe presses the rifle into your hands. Walnut stock. Small scope. Feels older than it is.\n\n\"This was my father's. Feeds you when you feed it. Keep it on you tomorrow.\"\n\nShe's already walking away when you try to thank her.",
    choices: [
      { label: "Sling it. Turn toward the fire.",
        effect: s => {
          equipVegaRifleOnce(s);
        },
        next: "bonfire_invite" },
    ]
  },

  bonfire_invite: {
    scene: "bonfire_night",
    sceneClass: "night",
    chapter: "Day 4 — Bonfire",
    text: function(s) {
      const m = s.bonds.maya, r = s.bonds.ren;
      const mayaSignal = !!(s.flags.maya && m >= 5) && !s.flags.committedRen;
      const renSignal  = r >= 4 && !s.flags.committedMaya;
      // Late that night — the camp has turned in, you haven't.
      let lines = "By the time the stars are out, the camp has turned in. You sit by the bonfire with your boots off, listening to pine needles snap in the coals.\n\nThe fire burns low.\n\n";
      if (s.flags.exposedTraitor && !s.flags.toldVega) {
        // Solo 'Tell Vega' path — Ren wasn't at the fence but she heard.
        lines += "Ren is across the fire. When your eyes meet she gives you a small, grave nod. She knows.\n\n";
      }
      if (mayaSignal && renSignal) {
        // Crossroads: both earned, neither committed. Weigh it.
        lines += "Two figures linger.\n\n" +
          "Maya catches your eye and tilts her head — toward her tent. A breath later, across the fire, Ren leaves her guitar leaned against the log and stands too, waiting.\n\n" +
          "They don't look at each other. They look at you.\n\n" +
          "You can't be in two places tonight.";
      } else if (mayaSignal) {
        lines += "Maya catches your eye and tilts her head — toward her tent.";
      } else if (renSignal) {
        lines += "Ren leaves her guitar against the log when she stands. She waits, looking at you.";
      } else {
        lines += "You sit alone with the dying flames.";
      }
      return lines;
    },
    choices: [
      { label: "Follow Maya", tag: "ROMANCE", tagClass: "warn",
        require: s => s.flags.maya && s.bonds.maya >= 5 && !s.flags.committedRen && !(s.bonds.ren >= 4 && !s.flags.committedMaya),
        effect: s => { s.romance = "maya"; },
        next: "romance_maya" },
      { label: "Follow Ren", tag: "ROMANCE", tagClass: "warn",
        require: s => s.bonds.ren >= 4 && !s.flags.committedMaya && !(s.flags.maya && s.bonds.maya >= 5 && !s.flags.committedRen),
        effect: s => { s.romance = "ren"; },
        next: "romance_ren" },
      { label: "Walk to the fire's edge. Meet them.", tag: "ROMANCE", tagClass: "warn",
        require: s => s.flags.maya && s.bonds.maya >= 5 && !s.flags.committedRen && s.bonds.ren >= 4 && !s.flags.committedMaya,
        next: "bonfire_crossroads" },
      { label: "Sit with the fire. Sleep alone.",
        effect: s => { s.hp = s.hpMax; s.stam = s.stamMax; Game.toast("Rested"); },
        next: "horde_warning" },
    ]
  },

  // Both earned, neither committed. You can only pick one — and the
  // other is standing right there. Sets rejectedMaya / rejectedRen so
  // morning_after and horde_warning can carry the weight of the choice.
  bonfire_crossroads: {
    scene: "bonfire_crossroads",
    sceneClass: "night",
    chapter: "Day 4 — Bonfire, at the edge",
    text: "You stand between them at the fire's edge. Close enough that you can hear each of them breathing.\n\nMaya, arms folded, her jaw set the way it gets when she's not going to ask twice. Her eyes are steady. You know that look — it's the one she gives before she moves.\n\nRen, hands in her jacket pockets, weight on her heels, not sure where to put her hands. She's smiling, a little, at nothing. She does that when she's trying not to care about the answer.\n\nNeither of them speaks. Neither of them looks at the other.\n\nThey're waiting.",
    choices: [
      { label: "Take Maya's hand.", tag: "ROMANCE", tagClass: "warn",
        effect: s => {
          s.romance = "maya";
          s.flags.committedMaya = true;
          s.flags.rejectedRen = true;
        },
        next: "romance_maya" },
      { label: "Take Ren's hand.", tag: "ROMANCE", tagClass: "warn",
        effect: s => {
          s.romance = "ren";
          s.flags.committedRen = true;
          s.flags.rejectedMaya = true;
        },
        next: "romance_ren" },
      { label: "\"Not tonight. Not like this.\"",
        effect: s => {
          s.hp = s.hpMax; s.stam = s.stamMax;
          // Neither rejected — you didn't pick, you stepped back. Both
          // notice; neither is owed anything.
          Game.toast("Rested");
        },
        next: "horde_warning" },
    ]
  },

  romance_maya: {
    scene: "intimate_bedroom",
    sceneClass: "indoor",
    chapter: "Day 4 — Maya's tent",
    speaker: "Maya",
    text: function(s) {
      let base = "Inside, she stops you with a hand on your chest. Not pushing. Just feeling.\n\n\"I'm not — I don't do soft. Not anymore. But I want this.\" Her voice is rougher than you've heard it. \"Tell me you do too.\"\n\nYou tell her.";
      if (s.companion2 === "Nora") {
        base += "\n\n(Nora is two tents over, asleep against Ren's shoulder — they've been inseparable since you got back. You checked, twice, before coming here.)";
      }
      base += "\n\nShe pulls you in, and the rest of the world goes quiet — the camp, the fence, the dead in the dark. Just her hands, your mouth, the small breath she lets out when you find the place at her throat where the muscle softens.\n\nLater — the lantern out, her head on your shoulder.";
      return base;
    },
    choices: [
      { label: "\"Don't disappear in the morning.\"",
        effect: s => { s.bonds.maya += 3; s.flags.lovedMaya = true; },
        next: "morning_after_maya" },
      { label: "Kiss Maya's temple. Let her sleep.",
        effect: s => { s.bonds.maya += 2; s.flags.lovedMaya = true; },
        next: "morning_after_maya" },
    ]
  },

  romance_ren: {
    scene: "intimate_bedroom",
    sceneClass: "indoor",
    chapter: "Day 4 — Ren's medbay",
    speaker: "Ren",
    text: function(s) {
      let opener = "She lights a single candle. Her hands shake — not from fear. From wanting.";
      if (s.companion2 === "Nora") {
        opener += "\n\n\"She's with Captain Vega tonight,\" Ren says quietly, without having to name who. \"I asked. Vega said of course.\"";
      }
      opener += "\n\n\"I haven't — since. I wasn't sure I still could.\" A small, embarrassed laugh. \"Be patient with me.\"\n\nYou take her hand and lay it flat against your chest, over your heart. Let her feel it.\n\nWhat happens next is slow. Slow as snow. Her mouth on yours, your fingers in her hair, both of you learning how to be this human again. After, she cries a little. She laughs through it. She thanks you, which breaks something in you in a good way.\n\nLater — the candle gutters. Her breathing evens out against your ribs.";
      return opener;
    },
    choices: [
      { label: "\"I've got you.\"",
        effect: s => { s.bonds.ren += 3; s.flags.lovedRen = true; },
        next: "morning_after_ren" },
      { label: "Hold Ren till the candle dies",
        effect: s => { s.bonds.ren += 2; s.flags.lovedRen = true; },
        next: "morning_after_ren" },
    ]
  },

  morning_after_maya: {
    scene: "greenbelt_morning",
    sceneClass: "forest",
    chapter: "Day 5 — Pre-dawn",
    speaker: "Maya",
    text: function(s) {
      let base = "She's already dressed when you wake. Rifle slung. She kisses the corner of your mouth like it's the most natural thing in the world.\n\n\"Whatever happens today,\" she says, \"I'm glad I met you in that stairwell.\"";
      if (s.companion2 === "Nora") {
        base += "\n\nOutside, Nora is perched on an ammo crate eating dry cereal from a mug. She doesn't ask where you spent the night. Kids know things.";
      }
      base += "\n\nThe siren starts.";
      return base;
    },
    choices: [
      { label: "\"Together.\"", next: "horde_warning" },
    ]
  },

  morning_after_ren: {
    scene: "greenbelt_morning",
    sceneClass: "forest",
    chapter: "Day 5 — Pre-dawn",
    speaker: "Ren",
    text: function(s) {
      let base = "She wakes you with coffee. Her hair is doing something unholy. She looks at you like you're a small impossible thing.\n\n\"Don't die today,\" she says. \"I just got you.\"";
      if (s.companion2 === "Nora") {
        base += "\n\nThere's a small paper crown on the rolling tray beside the cot. Crayon on a pill-label leaflet. Nora must have left it sometime before dawn. Neither of you put it on, but Ren touches one of the points with her thumb and smiles.";
      }
      base += "\n\nThe siren starts.";
      return base;
    },
    choices: [
      { label: "\"You either.\"", next: "horde_warning" },
    ]
  },

  ending_final_hero:        { scene: "ending_dawn",  sceneClass: "forest", chapter: "Ending A — Defender",  text: "You chose to stand. You chose to matter.\n\nThanks for playing Dead Light.", choices: [{ label: "Back to title", next: "__title__" }] },
  ending_final_fallen:      { scene: "ending_grave", sceneClass: "blood",  chapter: "Ending B — Martyr",    text: "You gave everything. They remember.\n\nThanks for playing Dead Light.",       choices: [{ label: "Back to title", next: "__title__" }] },
  ending_final_escape:      { scene: "ending_road",  sceneClass: "forest", chapter: "Ending C — Survivor",  text: "You chose to keep walking. For yourself. For them.\n\nThanks for playing Dead Light.", choices: [{ label: "Back to title", next: "__title__" }] },
  ending_final_lovers:      { scene: function(s) { return s.romance === "ren" ? "ending_final_lovers_ren" : s.romance === "maya" ? "ending_final_lovers_maya" : "ending_final_lovers"; }, sceneClass: "forest", chapter: "Ending D — Lovers, Saved", text: "You held the wall. You found someone worth holding the wall for.\n\nThanks for playing Dead Light.", choices: [{ label: "Back to title", next: "__title__" }] },
  ending_final_loverlost:   { scene: function(s) { return s.romance === "ren" ? "ending_final_loverlost_ren" : s.romance === "maya" ? "ending_final_loverlost_maya" : "ending_final_loverlost"; }, sceneClass: "blood",  chapter: "Ending E — Lover Lost", text: "You loved them. You lost them. You loved them anyway.\n\nThanks for playing Dead Light.",       choices: [{ label: "Back to title", next: "__title__" }] },
  ending_final_lovers_road: { scene: function(s) { return s.romance === "ren" ? "ending_final_lovers_road_ren" : s.romance === "maya" ? "ending_final_lovers_road_maya" : "ending_final_lovers_road"; }, sceneClass: "forest", chapter: "Ending F — Lovers, Walking", text: "Twenty people. One light. One hand in yours.\n\nThanks for playing Dead Light.", choices: [{ label: "Back to title", next: "__title__" }] },
  ending_final_vega_fell: {
    scene: "ending_final_vega_fell",
    sceneClass: "blood",
    chapter: "Ending G — Captain Held",
    text: function(s) {
      let base = s.companion2 === "Nora"
        ? "She held the gate. Long enough for a kid to see another dawn."
        : "She held the gate. She held it long enough.";
      // Only the terminal (no-romance) card signs off here. On
      // romance paths this scene is intermediate — the lovers_road
      // ending will do the sign-off.
      if (!s.romance) base += "\n\nThanks for playing Dead Light.";
      return base;
    },
    choices: [
      { label: "Walk on.",
        require: s => !!s.romance,
        next: "ending_final_lovers_road" },
      { label: "Back to title",
        require: s => !s.romance,
        next: "__title__" },
    ]
  },
  ending_final_maya_fell:   { scene: "ending_final_maya_fell",  sceneClass: "blood", chapter: "Ending H — She Stayed", text: "She stayed so you could walk. You keep walking.\n\nThanks for playing Dead Light.", choices: [{ label: "Back to title", next: "__title__" }] },
  ending_final_ren_fell:    { scene: "ending_final_ren_fell",   sceneClass: "blood", chapter: "Ending I — The Medbay Door", text: "She stayed with the ones who couldn't walk. You carry her song with you.\n\nThanks for playing Dead Light.", choices: [{ label: "Back to title", next: "__title__" }] },
  // Epilogue (not a terminal ending) — fires between post_horde_flee
  // and the final ending card when Vega survived via the grenade you
  // gave her. Sets vegaSurvived flag so a Part 2 can carry it.
  vega_epilogue: {
    scene: "vega_epilogue",
    sceneClass: "forest",
    chapter: "Day 6 — First Camp",
    speaker: "Captain Vega",
    text: function(s) {
      const romance = s.romance === "maya" ? "Maya" : s.romance === "ren" ? "Ren" : "";
      let base = "The column makes camp at dusk in a dry gully. Small fires, no arguments about them. First time in a week anyone's been warm.\n\nVega plants her rifle butt in the dirt and sits down beside your fire — not across from it. A bandolier of empty shells across her chest. A graze above one eye she hasn't bothered to clean.\n\nShe hands you a battered flask.\n\n\"For the one who made it.\"\n\nYou drink. It's whiskey and kerosene and something that was almost coffee once. She watches the treeline the whole time. Never stops watching.";
      if (romance) {
        base += `\n\n${romance} squeezes your shoulder as she passes. Doesn't say anything. Doesn't need to.`;
      }
      return base;
    },
    choices: [
      { label: "Raise the flask. Dawn can wait.",
        effect: s => { s.flags.vegaSurvived = true; },
        next: function(s) {
          return s.romance ? "ending_final_lovers_road" : "ending_final_escape";
        } },
    ]
  },

  death: {
    art: "💀",
    sceneClass: "blood",
    chapter: "You Died",
    text: "The world goes quiet. The last thing you see is the light fading behind the trees.\n\nThe dead don't forgive.",
    choices: [
      { label: "Try again", next: "__restart__" },
      { label: "Back to title", next: "__title__" },
    ]
  },

};
