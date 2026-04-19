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
        effect: s => { s.food += 2; s.hp = Math.min(s.hpMax, s.hp + 2); Game.toast("+2 🥫 food, +2 ❤️"); },
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
        combat: { enemy: "walker_cho", onWin: "stairwell_first", onLose: "death" } },
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
    text: "A woman, mid-thirties, army jacket, a hunting knife in her belt. \"Maya. 2F. I've been watching the street for two days — there's a pack of them at the corner store.\"\n\nShe offers you a crowbar.",
    choices: [
      { label: "\"Stick together. Two's better than one.\"",
        effect: s => { s.companion = "Maya"; s.flags.maya = true; Game.toast("Maya joined you"); },
        next: "street_plan" },
      { label: "\"I work better alone.\"",
        effect: s => { s.flags.solo = true; },
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
        combat: { enemy: "walker_pair", onWin: "grocery_inside", onLose: "death" } },
      { label: "Fight them alone", tag: "COMBAT", tagClass: "danger",
        require: s => s.companion !== "Maya",
        combat: { enemy: "walker_pair", onWin: "grocery_inside", onLose: "death" } },
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
        effect: s => { s.food += 1; Game.toast("+1 🥫"); },
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
        effect: s => { s.food += 2; s.ammo += 3; s.hp = Math.min(s.hpMax, s.hp + 1); Game.toast("+2 🥫, +3 🔫, +1 ❤️"); },
        next: "road_out" },
      { label: "Open the freezer", tag: "RISKY", tagClass: "warn",
        effect: s => { s.food += 2; s.ammo += 3; s.hp = Math.min(s.hpMax, s.hp + 1); Game.toast("+2 🥫, +3 🔫, +1 ❤️"); },
        next: "freezer" },
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
    text: "Inside, a girl — maybe ten — pressed into the corner, a kitchen knife shaking in her hand.\n\n\"Don't. Don't touch me.\"",
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
    text: "You walk for hours. The highway is a museum of stalled cars. You've heard rumours of a camp — the Greenbelt — in the old state park.\n\nAhead, a hitchhiker sign: GREENBELT 12 MI.",
    choices: [
      { label: "Keep walking. Find the camp.", next: "ambush" },
      { label: "Rest in a station wagon",
        effect: s => { s.hp = Math.min(s.hpMax, s.hp + 2); s.stam = s.stamMax; Game.toast("+2 ❤️, ⚡ refilled"); },
        next: "ambush" },
    ]
  },

  road_out_child: {
    art: "🛣️🌅👧",
    sceneClass: "forest",
    chapter: "Day 2 — The Road",
    speaker: "Nora",
    text: "The girl's name is Nora. She's quiet for hours, then: \"My dad said there's people at the Greenbelt. Soldiers. Good ones.\"\n\nShe slips her hand into yours.",
    choices: [
      { label: "\"Then that's where we go.\"", next: "ambush" },
    ]
  },

  ambush: {
    art: "🌳🔫🧔",
    sceneClass: "forest",
    chapter: "Day 2 — The Pines",
    speaker: "???",
    text: "A shotgun racks behind you. \"Drop the bag. Slow.\"\n\nTwo men step out from the pines. Not infected — worse. Bandits.",
    choices: [
      { label: "Drop the bag. Live to fight another day.",
        effect: s => { s.food = Math.max(0, s.food - 2); s.ammo = Math.max(0, s.ammo - 2); Game.toast("-2 🥫, -2 🔫"); },
        next: "after_ambush_mercy" },
      { label: "Fight — you need these supplies", tag: "COMBAT", tagClass: "danger",
        combat: { enemy: "bandit", risky: true, onWin: "after_ambush_fight", onLose: "death" } },
      { label: "\"Take me. Let the kid go.\"", tag: "SACRIFICE", tagClass: "warn",
        require: s => s.companion2 === "Nora",
        next: "sacrifice_intro" },
    ]
  },

  sacrifice_intro: {
    art: "🧍👧🌲",
    sceneClass: "forest",
    chapter: "Day 2 — The Pines",
    text: "The older bandit laughs, then stops. Something in your face shuts him up.\n\nHe nods at Nora. \"Go, kid. Run.\"\n\nShe looks at you. You nod.",
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
    text: "It was ugly. It was quick. You take their shotgun, their jerky, and their silence.",
    choices: [
      { label: "Loot and move on",
        effect: s => { s.ammo += 4; s.food += 2; s.flags.killedBandits = true; Game.toast("+4 🔫, +2 🥫"); },
        next: "greenbelt_gate" },
    ]
  },

  greenbelt_gate: {
    art: "🚧🛡️⛺",
    sceneClass: "forest",
    chapter: "Day 3 — Greenbelt",
    speaker: "Guard",
    text: "A chain-link fence topped with razor wire. A woman in tactical gear studies you through the scope of a rifle.\n\n\"State your business. And show me your arms — both sides.\"",
    choices: [
      { label: "Show your arms. No bites.", next: "greenbelt_in" },
      { label: "Offer supplies as a gift", require: s => s.food >= 1,
        effect: s => { s.food -= 1; s.flags.goodwill = true; Game.toast("-1 🥫"); },
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
    text: "Inside: tents, solar lamps, the smell of stew. A radio crackles weather reports.\n\nA young woman with calm hands and a quiet voice bandages your arm. \"You're lucky. Most don't make it this far. I'm Ren.\"\n\nAcross the fire, another woman in tactical kit nods at you — Captain Vega. \"Eat. Sleep. We talk in the morning.\"",
    choices: [
      { label: "Sleep. Tomorrow is another day.",
        effect: s => { s.hp = s.hpMax; s.stam = s.stamMax; Game.toast("❤️ ⚡ restored"); },
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
      { label: "Help Ren in the medbay", tag: "BOND", tagClass: "warn", next: "chore_medbay" },
      { label: "Walk the perimeter with Maya",
        require: s => s.flags.maya,
        tag: "BOND", tagClass: "warn", next: "chore_perimeter" },
      { label: "Cook for the camp", next: "chore_kitchen" },
    ]
  },

  chore_medbay: {
    scene: "medbay",
    sceneClass: "indoor",
    chapter: "Day 4 — Medbay",
    speaker: "Ren",
    text: "Ren's medbay is a converted shipping container. Antiseptic, clean linen, a guitar in the corner.\n\n\"Hold this. Hands steady.\" You're stitching a cut on a kid's knee. Ren watches you work. \"You've done this before.\"\n\n\"Paramedic. East side.\"\n\n\"Then you know how it gets — losing them.\" A long beat. \"Tell me one you saved.\"",
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
        effect: s => { s.food += 2; Game.toast("+2 🥫"); },
        next: "chore_done" },
    ]
  },

  chore_done: {
    scene: "briefing_tent",
    sceneClass: "indoor",
    chapter: "Day 4 — Briefing",
    speaker: "Captain Vega",
    text: "\"Old Mercy Hospital. Three klicks south. Pharmacy on the second floor — antibiotics, painkillers, anything that hasn't walked off.\"\n\nShe spreads a hand-drawn map. \"In and out. Don't be a hero. Pick someone to take.\"",
    choices: [
      { label: "Take Maya — she knows how to fight",
        require: s => s.flags.maya,
        effect: s => { s.flags.missionPartner = "maya"; },
        next: "mission_journey" },
      { label: "Take Ren — she knows what to grab",
        effect: s => { s.flags.missionPartner = "ren"; },
        next: "mission_journey" },
      { label: "Go alone. Less mouths, less risk.",
        effect: s => { s.flags.missionPartner = null; s.flags.solo_mission = true; },
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
      if (s.flags.exposedTraitor) intro += "Vega has the camp ready. The fence is reinforced. Every rifle is loaded. Calder is in restraints.\n\n";
      else if (s.flags.killedTraitor) intro += "No one knows what you did at the south fence. The camp is calm — until it isn't.\n\n";
      else intro += "Something's wrong with the south fence — whatever it is, there's no time to fix it now.\n\n";
      return intro + "\"We hold, or we run. Choose.\"";
    },
    choices: [
      { label: "Hold the wall.", tag: "COMBAT", tagClass: "danger",
        combat: { enemy: "horde", onWin: "post_horde_win", onLose: "post_horde_lose" } },
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
      return "The horde is a still field. The fence holds. Someone is laughing through tears. A child finds your hand.";
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
      return "They'll say you held the line longer than any one person should. They'll carve your name beside the others.";
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
    scene: "highway_dawn",
    sceneClass: "forest",
    chapter: "Day 4 — South Road",
    text: function(s) {
      if (s.flags.missionPartner === "maya") {
        return "Maya walks point. Three steps ahead, eyes everywhere. The pines thin into a service road.\n\n\"You ever miss anything from before?\" she asks, not turning around.";
      }
      if (s.flags.missionPartner === "ren") {
        return "Ren keeps pace beside you. She hums, low — a song you almost recognise.\n\n\"My grandmother used to sing it,\" she says when she catches you listening. \"It's the only thing of hers I have left.\"";
      }
      return "You walk alone. Every shadow is a question. Every step is loud.";
    },
    choices: [
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
    scene: "hospital_lobby",
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
    text: "You hand the meds to Ren — who beams, just for a second — and then notice something at the south fence: a chain link, cleanly cut. Not zombies. Hands.",
    choices: [
      { label: "Investigate the cut fence", tag: "CLUE", tagClass: "warn",
        effect: s => { s.flags.foundCut = true; },
        next: "investigate_traitor" },
      { label: "Mention it to Vega in the morning. Get warm by the fire.",
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
    scene: "confront_traitor",
    sceneClass: "night",
    chapter: "Day 4 — South Fence",
    speaker: "???",
    text: "He freezes when he sees you. A trader from two tents over — Calder. Sleeve pushed up. The bite mark on his forearm is fresh and black.\n\n\"Please. They said if I let them in, they'd let me live. I have a d—\"\n\nHis throat spasms. His eyes fog. The bite has already won.",
    choices: [
      { label: "He lunges. Put him down.", tag: "BOSS", tagClass: "danger",
        combat: { enemy: "traitor", risky: true, onWin: "traitor_aftermath", onLose: "death" } },
    ]
  },

  traitor_aftermath: {
    scene: "confront_traitor",
    sceneClass: "night",
    chapter: "Day 4 — South Fence",
    text: "It's over. He's smaller now. Calder again, almost.\n\nYou stand in the dark with the weight of it — and the choice still yours.",
    choices: [
      { label: "Bury him quietly. The camp will not know.", tag: "HARD", tagClass: "danger",
        effect: s => { s.flags.killedTraitor = true; Game.toast("The camp will not know."); },
        next: "bonfire_invite" },
      { label: "Tell Vega. They deserve the truth.",
        effect: s => { s.flags.exposedTraitor = true; Game.toast("The camp prepares."); },
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

  ending_fallen: {
    art: "🌅🕯️",
    sceneClass: "blood",
    chapter: "Ending — Fallen",
    text: "They'll say you held the line longer than any man should.\n\nThey'll carve your name into the wall beside the others.\n\nDead Light — for the living.",
    choices: [
      { label: "— THE END —", next: "ending_final_fallen" },
    ]
  },

  ending_escape: {
    art: "🌲🚶🚶‍♀️👧",
    sceneClass: "forest",
    chapter: "Ending — The Long Road",
    text: "The camp burns behind you. Twenty survivors follow your flashlight through the pines.\n\nYou don't know where you're going. You know you'll keep going.\n\nThat's what the living do.",
    choices: [
      { label: "— THE END —", next: "ending_final_escape" },
    ]
  },

  ending_final_hero:        { scene: "ending_dawn",  sceneClass: "forest", chapter: "Ending A — Defender",  text: "You chose to stand. You chose to matter.\n\nThanks for playing Dead Light.", choices: [{ label: "Back to title", next: "__title__" }] },
  ending_final_fallen:      { scene: "ending_grave", sceneClass: "blood",  chapter: "Ending B — Martyr",    text: "You gave everything. They remember.\n\nThanks for playing Dead Light.",       choices: [{ label: "Back to title", next: "__title__" }] },
  ending_final_escape:      { scene: "ending_road",  sceneClass: "forest", chapter: "Ending C — Survivor",  text: "You chose to keep walking. For yourself. For them.\n\nThanks for playing Dead Light.", choices: [{ label: "Back to title", next: "__title__" }] },
  ending_final_lovers:      { scene: "ending_dawn",  sceneClass: "forest", chapter: "Ending D — Lovers, Saved", text: "You held the wall. You found someone worth holding the wall for.\n\nThanks for playing Dead Light.", choices: [{ label: "Back to title", next: "__title__" }] },
  ending_final_loverlost:   { scene: "ending_grave", sceneClass: "blood",  chapter: "Ending E — Lover Lost", text: "You loved them. You lost them. You loved them anyway.\n\nThanks for playing Dead Light.", choices: [{ label: "Back to title", next: "__title__" }] },
  ending_final_lovers_road: { scene: "ending_road",  sceneClass: "forest", chapter: "Ending F — Lovers, Walking", text: "Twenty people. One light. One hand in yours.\n\nThanks for playing Dead Light.", choices: [{ label: "Back to title", next: "__title__" }] },

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
