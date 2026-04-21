// Story graph for Dead Light
// Each node: { art, sceneClass, chapter, speaker, text, choices: [{label, tag, next, effect, require, combat}] }
// effect: function(state) that mutates state
// require: function(state) returns bool
// combat: { enemy: 'walker'|'runner'|'bloater'|'bandit'|'horde', onWin, onLose }

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
      { label: "Take only the medicine. Leave her in peace.",
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
      { label: "Fight her", tag: "COMBAT", tagClass: "danger",
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
      { label: "Stay silent. Keep moving.", tag: "RISKY", tagClass: "warn", next: "alone_street" },
    ]
  },

  meet_maya: {
    art: "🧍🧍‍♀️",
    sceneClass: "night",
    chapter: "Day 1 — Stairwell",
    speaker: "Maya",
    text: "A woman, mid-thirties, army jacket, a hunting knife in her belt. \"Maya. 2F. I've been watching the street for two days — there's a pack of them at the corner store.\"\n\nShe pulls a crowbar from her pack and hands it to you. \"Better than that letter opener.\"",
    choices: [
      { label: "\"Stick together. Two's better than one.\"",
        effect: s => {
          s.companion = "Maya"; s.flags.maya = true;
          Game.giveWeapon({ name: "Crowbar", bonus: 1, slot: "melee" });
        },
        next: "street_plan" },
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

  freezer: {
    art: "🚪❄️👧",
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
        effect: s => { s.companion2 = "Nora"; s.flags.savedNora = true; Game.toast("Nora joined you"); },
        next: "road_out_child" },
      { label: "Close the door. It's not your problem.",
        effect: s => { s.flags.coward = true; Game.toast("You leave her behind"); },
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
        return "The girl's name is Nora. She's quiet for hours, keeping pace between you and Maya. When she speaks, it's to Maya — to the rifle across her back.\n\n\"My dad said there's people at the Greenbelt. Soldiers. Good ones.\"\n\nMaya nods without smiling. The girl slips her hand into yours anyway.";
      }
      return "The girl's name is Nora. She's quiet for hours, then: \"My dad said there's people at the Greenbelt. Soldiers. Good ones.\"\n\nShe slips her hand into yours.";
    },
    choices: [
      { label: "\"Then that's where we go.\"", next: "ambush" },
    ]
  },

  ambush: {
    art: "🌳🔫🧔",
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
        effect: s => { s.ammo = Math.max(0, s.ammo - 2); Game.toast("-2 🔫"); },
        next: "after_ambush_mercy" },
      { label: "Fight — you need these supplies", tag: "COMBAT", tagClass: "danger",
        combat: function (s) {
          return {
            enemy: "bandit",
            // Rested + spotted = you get the jump on them: non-risky
            // combat (no +25% HP / +1 damage bump on the bandits).
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
    sceneClass: "forest",
    chapter: "Day 2 — The Pines",
    text: function(s) {
      if (s.companion === "Maya") {
        return "Maya's hand is on her knife. You put yours on her shoulder — hold. Not yet.\n\nThe older bandit laughs, then stops. Something in your face shuts him up.\n\nHe nods at Nora. \"Go, kid. Run.\"\n\nShe looks at you. You nod. Maya steps in beside you, not behind you. She's not running either.";
      }
      return "The older bandit laughs, then stops. Something in your face shuts him up.\n\nHe nods at Nora. \"Go, kid. Run.\"\n\nShe looks at you. You nod.";
    },
    choices: [
      { label: "Fight for your life", tag: "COMBAT", tagClass: "danger",
        combat: { enemy: "bandit", onWin: "greenbelt_gate_hero", onLose: "death" } },
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
    sceneClass: "forest",
    chapter: "Day 2 — The Pines",
    text: function(s) {
      if (s.companion === "Maya") {
        return "It was ugly. It was quick. Maya wipes her blade on the bigger one's jacket and doesn't look up.\n\n\"We don't talk about this one,\" she says.\n\nYou take their shotgun, their jerky, and their silence between you.";
      }
      return "It was ugly. It was quick. You take their shotgun, their jerky, and their silence.";
    },
    choices: [
      { label: "Loot and move on",
        effect: s => {
          s.ammo += 4; s.flags.killedBandits = true;
          Game.giveRandomItem();
          Game.toast("+4 🔫");
        },
        next: "greenbelt_gate" },
    ]
  },

  greenbelt_gate: {
    art: "🚧🛡️⛺",
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
      { label: "Show your arms. No bites.", next: "greenbelt_in" },
      { label: "Offer supplies as a gift", require: s => s.ammo >= 2,
        effect: s => { s.ammo -= 2; s.flags.goodwill = true; Game.toast("-2 🔫"); },
        next: "greenbelt_in" },
    ]
  },

  greenbelt_gate_hero: {
    art: "🚧🛡️⛺",
    sceneClass: "forest",
    chapter: "Day 3 — Greenbelt",
    text: "You carry Nora the last mile. She's asleep by the time the gate slides open.\n\nThe guards look at you — bloodied, limping — and lower their rifles.",
    choices: [
      { label: "\"She needs food. Please.\"",
        effect: s => { s.flags.goodwill = true; },
        next: "greenbelt_in" },
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
        next: "ren_medbay_intro" },
      { label: "Sleep now. Tomorrow is another day.",
        effect: s => { s.hp = s.hpMax; s.stam = s.stamMax; Game.toast("❤️ ⚡ restored"); },
        next: "camp_morning" },
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
          s.bonds.ren += 1;
          Game.toast("❤️ ⚡ restored · Ren's trust +1");
        },
        next: "camp_morning" },
      { label: "Sit with her in silence until she finishes.",
        effect: s => {
          s.hp = s.hpMax; s.stam = s.stamMax;
          s.bonds.ren += 2;
          Game.toast("❤️ ⚡ restored · Ren's trust +2");
        },
        next: "camp_morning" },
    ]
  },

  camp_morning: {
    scene: "greenbelt_morning",
    sceneClass: "forest",
    chapter: "Day 4 — Greenbelt",
    speaker: "Captain Vega",
    text: "Coffee that tastes like dirt. Sun coming up through the pines.\n\n\"You earned a day before we put you to work,\" Vega says. \"Pick a hand to lend. Or don't. Free country — what's left of it.\"",
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
      { label: "Tell them about the boy in the subway fire",
        effect: s => { s.bonds.ren += 2; Game.toast("Ren's trust +2"); },
        next: "chore_done" },
      { label: "Change the subject. Some doors stay shut.",
        effect: s => { s.bonds.ren += 1; },
        next: "chore_done" },
    ]
  },

  chore_perimeter: {
    scene: "perimeter",
    sceneClass: "forest",
    chapter: "Day 4 — Perimeter",
    speaker: "Maya",
    text: "Maya climbs the watchtower like she was born there. You hand up coffee. She drinks it without taking her eyes off the treeline.\n\n\"My brother used to do this watch with me. Before.\" She doesn't look at you. \"Six months. Feels like six years.\"\n\nThe wind moves through the pines. She's closer than she needs to be.",
    choices: [
      { label: "\"Tell me about him.\"",
        effect: s => { s.bonds.maya += 2; Game.toast("Maya's trust +2"); },
        next: "chore_done" },
      { label: "Stand watch in silence. Some things don't need words.",
        effect: s => { s.bonds.maya += 1; },
        next: "chore_done" },
    ]
  },

  chore_kitchen: {
    scene: "camp_kitchen",
    sceneClass: "forest",
    chapter: "Day 4 — Kitchen",
    text: "You spend the morning peeling potatoes and listening to camp gossip. Three meals out of one rabbit. Magic.\n\nVega slaps your shoulder on her way past. \"You'll do.\"",
    choices: [
      { label: "Wash up and report in",
        effect: s => { Game.giveRandomItem(); Game.giveRandomItem(); },
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
      // Short tag scene acknowledging who noticed you weren't around
      // this morning, based on the chore you picked.
      let tag = "";
      if (s.flags.choreChosen === "medbay" && s.flags.maya) {
        tag = "Maya is in the corner of the tent, breaking down a rifle. She doesn't look up when you walk in. The treeline could've used a second pair of eyes today.\n\n";
      } else if (s.flags.choreChosen === "perimeter") {
        tag = "Ren's at the briefing too, clipboard balanced on her knee. \"Med inventory's thinner than it should be,\" she murmurs as you sit down. It's not a complaint. It lands like one anyway.\n\n";
      } else if (s.flags.choreChosen === "kitchen") {
        tag = "Ren sets a mug of something hot in front of you without meeting your eye. " +
          (s.flags.maya ? "Maya's across the table, back half-turned. The map is the only thing the three of you are willing to look at.\n\n"
                        : "Vega's the only other person here, and she's all business.\n\n");
      }
      return tag + "\"Old Mercy Hospital. Three klicks south. Pharmacy on the second floor — antibiotics, painkillers, anything that hasn't walked off.\"\n\nShe spreads a hand-drawn map. \"In and out. Don't be a hero. Pick someone to take.\"";
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
    text: "You're tightening a strap when small boots hit the dirt behind you. Nora — breathless, already wearing her little pack.\n\n\"Take me. I watch for things grown-ups miss. I'm quiet. I won't slow you down.\"\n\nShe's too small for what's out there. Her eyes are too big for what she already is.",
    choices: [
      { label: "\"Stay close. Do exactly what I say.\"", tag: "RISKY", tagClass: "warn",
        effect: s => {
          s.flags.bringNora = true;
          Game.toast("Nora is coming with you");
        },
        next: "mission_journey" },
      { label: "\"Not this one, kid. You're safer here.\"",
        effect: s => {
          s.flags.bringNora = false;
        },
        next: "mission_journey" },
    ]
  },

  horde_warning: {
    scene: "horde_charge",
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
      return intro + "\"We hold, or we run. Choose.\"";
    },
    choices: [
      { label: "Hold the wall.", tag: "COMBAT", tagClass: "danger",
        effect: s => {
          // Every saved ally is on the wall for this one.
          s.flags.hordeDefense = true;
        },
        combat: function (s) {
          // The party is much larger (Maya + Ren + Vega + Nora's spotting),
          // so scale the horde up accordingly — harder fight, more of us.
          // Camp isn't ready when you didn't warn them about the breach.
          const ready = !!s.flags.exposedTraitor;
          return {
            enemy: "horde",
            risky: !ready,
            hp: ready ? 38 : 46,
            atk: ready ? [4, 7] : [5, 8],
            onWin: "post_horde_win",
            onLose: "post_horde_lose",
          };
        } },
      { label: "Get the survivors out the back.", next: "post_horde_flee" },
    ]
  },

  post_horde_win: {
    scene: "ending_dawn",
    sceneClass: "blood",
    chapter: "Sunrise — After",
    text: function(s) {
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
      // she is. No romance, just presence.
      return "They'll say you held the line longer than any one person should.\n\nRen stays with you in the medbay when the others can't. She doesn't try to fix you — she knows. She just keeps one hand on yours and hums something low, a song from before.\n\nThey'll carve your name beside the others.";
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
      if (s.romance === "maya" && s.flags.lovedMaya) {
        return "Twenty survivors follow your light through the pines. Maya walks beside you, her hand finding yours in the dark. Neither of you lets go.";
      }
      if (s.romance === "ren" && s.flags.lovedRen) {
        return "Ren walks at the back, helping the slow ones. When you look over your shoulder, she looks up at you and smiles — small and certain.";
      }
      if (s.companion2 === "Nora") {
        return "Nora's hand is sticky in yours. She doesn't ask where you're going. None of them do. They follow your light.";
      }
      return "The camp burns behind you. You don't know where you're going. You know you'll keep going.";
    },
    choices: [
      { label: "— THE END —", next: function(s) {
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
      if (s.flags.missionPartner === "maya") {
        const skippedHerChore = s.flags.choreChosen && s.flags.choreChosen !== "perimeter";
        base = "Maya walks point. Three steps ahead, eyes everywhere. The pines thin into a service road.";
        if (skippedHerChore) {
          // She picked you for the mission anyway — but she noticed you
          // didn't pick her this morning. She's not letting it slide.
          base += "\n\n\"Ren's good with her hands,\" she says after a while, not turning around. \"I'm not pretending I'm not a little pissed you noticed that first.\"";
          base += "\n\nA long beat. Gravel under your boots.\n\n\"You ever miss anything from before?\"";
        } else {
          base += "\n\n\"You ever miss anything from before?\" she asks, not turning around.";
        }
      } else if (s.flags.missionPartner === "ren") {
        base = "Ren keeps pace beside you. She hums, low — a song you almost recognise.\n\n\"My grandmother used to sing it,\" she says when she catches you listening. \"It's the only thing of hers I have left.\"";
        base += "\n\nThe humming stops as the hospital squats into view.\n\n\"Worked Mercy's ER the first month,\" she says quietly, like it explains something. \"If my hands shake later — that's why.\"\n\nShe starts humming again.";
      } else {
        base = "You walk alone. Every shadow is a question. Every step is loud.";
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
      { label: "Push on alone",
        require: s => s.flags.solo_mission,
        next: "hospital_arrive" },
    ]
  },

  hospital_arrive: {
    scene: "hospital_ext",
    sceneClass: "city",
    chapter: "Day 4 — Old Mercy",
    text: "The hospital squats against the dusk like a wounded animal. The red cross above the door has bled brown.\n\nSomething moves inside.",
    choices: [
      { label: "Through the front. Loud and fast.",
        next: "pharmacy_combat" },
    ]
  },

  pharmacy_combat: {
    scene: "pharmacy_fight",
    sceneClass: "blood",
    chapter: "Day 4 — Pharmacy",
    text: "Two of them lurch out of the dark between the shelves. Pill bottles roll under your boots.",
    choices: [
      { label: "Fight", tag: "COMBAT", tagClass: "danger",
        combat: { enemy: "walker_pair", onWin: "hospital_lobby", onLose: "death" } },
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
      if (s.flags.missionPartner === "maya") {
        return "You drop into a row of waiting chairs. Maya sits beside you — not touching, but close.\n\n\"You handle yourself. I noticed.\"\n\nA streetlight, somehow still alive, hums outside. She hasn't looked away from you.";
      }
      if (s.flags.missionPartner === "ren") {
        return "Ren is shaking. She sits on the floor, back to a vending machine, knees up.\n\n\"I hate this part. After. When my hands remember.\"\n\nYou sit beside her. Her breath slows when you do.";
      }
      return "You sit alone in the dark. Stuff a backpack with what you came for. The hospital exhales around you — old breath, no life.";
    },
    choices: [
      { label: "Lean closer. Let her see you see her.",
        require: s => s.flags.missionPartner === "maya",
        effect: s => { s.bonds.maya += 2; Game.toast("Maya's trust +2"); },
        next: "mission_return" },
      { label: "Keep it professional. Stand up.",
        require: s => s.flags.missionPartner === "maya",
        next: "mission_return" },
      { label: "Take her hand. Say nothing.",
        require: s => s.flags.missionPartner === "ren",
        effect: s => { s.bonds.ren += 2; Game.toast("Ren's trust +2"); },
        next: "mission_return" },
      { label: "Give her space. Pack the bag.",
        require: s => s.flags.missionPartner === "ren",
        next: "mission_return" },
      { label: "Pack and leave",
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
      if (p === "ren") {
        return "Ren drops the med bag on the aid-tent table and is already sorting bottles by label before she's even shrugged her jacket off. She catches your eye, exhales once — that was close — then goes back to work.\n\nOn your way out of the tent you notice something at the south fence: a chain link, cleanly cut. Not zombies. Hands.";
      }
      if (p === "maya") {
        return "Maya lets you carry the med bag the last hundred yards. You hand it to Ren at the aid tent — who beams, just for a second — and Maya peels off to dump her rifle on her cot.\n\nOn your way back you notice something at the south fence: a chain link, cleanly cut. Not zombies. Hands.";
      }
      return "You hand the meds to Ren — who beams, just for a second — and then notice something at the south fence: a chain link, cleanly cut. Not zombies. Hands.";
    },
    choices: [
      { label: "Investigate the cut fence", tag: "CLUE", tagClass: "warn",
        effect: s => {
          s.flags.foundCut = true;
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
    text: "Bolt cutters in the brush. Fresh boot prints. Whoever did this is in the camp — and they're coming back.",
    choices: [
      { label: "Lie in wait", tag: "RISKY", tagClass: "warn", next: "confront_traitor" },
      { label: "Tell Vega and bring the cavalry",
        effect: s => { s.flags.toldVega = true; },
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
      if (s.flags.toldVega) {
        return "Vega moves like she's done this before — two rifles and a blinding flashlight at your back. The man crouched at the cut fence spins. A trader from two tents over — Calder. Sleeve pushed up. The bite mark on his forearm is fresh and black.\n\n\"Please. They said if I let them in, they'd let me live. I have a d—\"\n\nHis throat spasms. His eyes fog. The bite has already won — and you're between him and Vega's rifles.";
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
      if (s.flags.toldVega) {
        return "It's over. He's smaller now. Calder again, almost.\n\nVega lowers her rifle and spits into the grass. \"Whole camp hears about this before sunrise,\" she says, already turning toward the bell.\n\nRen is already at the fence by the time the bell starts. She catches your eye once — gratitude, quick as a blink — then kneels beside the body with a clean sheet.";
      }
      return "It's over. He's smaller now. Calder again, almost.\n\nYou stand in the dark with the weight of it — and the choice still yours.";
    },
    choices: [
      { label: "Bury him quietly. The camp will not know.", tag: "HARD", tagClass: "danger",
        require: s => !s.flags.toldVega,
        effect: s => {
          s.flags.killedTraitor = true;
          // Maya notices. She would've told Vega.
          if (s.flags.maya && s.bonds) s.bonds.maya = Math.max(0, (s.bonds.maya || 0) - 1);
          Game.toast("The camp will not know.");
        },
        next: "bonfire_invite" },
      { label: "Tell Vega. They deserve the truth.",
        require: s => !s.flags.toldVega,
        effect: s => {
          s.flags.exposedTraitor = true;
          // Vega opens the armory; camp reinforces the fence overnight.
          s.ammo += 2;
          Game.giveRandomItem();
          if (s.bonds) s.bonds.ren = (s.bonds.ren || 0) + 1;
          Game.toast("+2 🔫  · Ren's trust +1");
        },
        next: "bonfire_invite" },
      { label: "Help Vega rouse the camp. Reinforce the fence tonight.",
        require: s => s.flags.toldVega,
        effect: s => {
          s.flags.exposedTraitor = true;
          s.ammo += 2;
          Game.giveRandomItem();
          if (s.bonds) s.bonds.ren = (s.bonds.ren || 0) + 1;
          Game.toast("+2 🔫  · Ren's trust +1");
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
      let lines = "The fire burns low. Most of the camp has turned in. Two figures linger.\n\n";
      if (s.flags.maya && m >= 3) lines += "Maya catches your eye and tilts her head — toward her tent.\n";
      if (r >= 3) lines += "Ren leaves her guitar against the log when she stands. She waits, looking at you.\n";
      if ((!s.flags.maya || m < 3) && r < 3) lines += "You sit alone with the dying flames.\n";
      return lines;
    },
    choices: [
      { label: "Follow Maya", tag: "ROMANCE", tagClass: "warn",
        require: s => s.flags.maya && s.bonds.maya >= 3,
        effect: s => { s.romance = "maya"; },
        next: "romance_maya" },
      { label: "Follow Ren", tag: "ROMANCE", tagClass: "warn",
        require: s => s.bonds.ren >= 3,
        effect: s => { s.romance = "ren"; },
        next: "romance_ren" },
      { label: "Sit with the fire. Sleep alone.",
        effect: s => { s.hp = s.hpMax; s.stam = s.stamMax; Game.toast("Rested"); },
        next: "horde_warning" },
    ]
  },

  romance_maya: {
    scene: "intimate_bedroom",
    sceneClass: "indoor",
    chapter: "Day 4 — Maya's tent",
    speaker: "Maya",
    text: "Inside, she stops you with a hand on your chest. Not pushing. Just feeling.\n\n\"I'm not — I don't do soft. Not anymore. But I want this.\" Her voice is rougher than you've heard it. \"Tell me you do too.\"\n\nYou tell her.\n\nShe pulls you in, and the rest of the world goes quiet — the camp, the fence, the dead in the dark. Just her hands, your mouth, the small breath she lets out when you find the place at her throat where the muscle softens.\n\n*Later, the lantern out, her head on your shoulder.*",
    choices: [
      { label: "\"Don't disappear in the morning.\"",
        effect: s => { s.bonds.maya += 3; s.flags.lovedMaya = true; },
        next: "morning_after_maya" },
      { label: "Kiss her temple. Let her sleep.",
        effect: s => { s.bonds.maya += 2; s.flags.lovedMaya = true; },
        next: "morning_after_maya" },
    ]
  },

  romance_ren: {
    scene: "intimate_bedroom",
    sceneClass: "indoor",
    chapter: "Day 4 — Ren's medbay",
    speaker: "Ren",
    text: "She lights a single candle. Her hands shake — not from fear. From wanting.\n\n\"I haven't — since. I wasn't sure I still could.\" A small, embarrassed laugh. \"Be patient with me.\"\n\nYou take her hand and lay it flat against your chest, over your heart. Let her feel it.\n\nWhat happens next is slow. Slow as snow. Her mouth on yours, your fingers in her hair, both of you learning how to be this human again. After, she cries a little. She laughs through it. She thanks you, which breaks something in you in a good way.\n\n*The candle gutters. Her breathing evens out against your ribs.*",
    choices: [
      { label: "\"I've got you.\"",
        effect: s => { s.bonds.ren += 3; s.flags.lovedRen = true; },
        next: "morning_after_ren" },
      { label: "Hold her till the candle dies",
        effect: s => { s.bonds.ren += 2; s.flags.lovedRen = true; },
        next: "morning_after_ren" },
    ]
  },

  morning_after_maya: {
    scene: "greenbelt_morning",
    sceneClass: "forest",
    chapter: "Day 5 — Pre-dawn",
    speaker: "Maya",
    text: "She's already dressed when you wake. Rifle slung. She kisses the corner of your mouth like it's the most natural thing in the world.\n\n\"Whatever happens today,\" she says, \"I'm glad I met you in that stairwell.\"\n\nThe siren starts.",
    choices: [
      { label: "\"Together.\"", next: "horde_warning" },
    ]
  },

  morning_after_ren: {
    scene: "greenbelt_morning",
    sceneClass: "forest",
    chapter: "Day 5 — Pre-dawn",
    speaker: "Ren",
    text: "She wakes you with coffee. Her hair is doing something unholy. She looks at you like you're a small impossible thing.\n\n\"Don't die today,\" she says. \"I just got you.\"\n\nThe siren starts.",
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
