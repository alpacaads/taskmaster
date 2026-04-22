# Dead Light — Story Flow

Auto-generated from `zombie-rpg/js/story.js`. 2026-04-22

One section per story node, in definition order. Function-branching fields (text, scene, speaker, next, combat) are enumerated across a set of common state permutations so every reachable variant is legible.

---

## Node index

- [`intro`](#intro) — Day 1 — The Outbreak
- [`apt_hallway`](#apt_hallway) — Day 1 — Apartment 3B
- [`neighbour_apt`](#neighbour_apt) — Day 1 — Apartment 3A
- [`neighbour_wake`](#neighbour_wake) — Day 1 — Apartment 3A
- [`cho_loot`](#cho_loot) — Day 1 — Apartment 3A
- [`stairwell_first`](#stairwell_first) — Day 1 — Stairwell
- [`meet_maya_card`](#meet_maya_card) — Day 1 — Stairwell
- [`meet_maya`](#meet_maya) — Day 1 — Stairwell
- [`alone_street`](#alone_street) — Day 1 — Market Street
- [`alone_street_sneak`](#alone_street_sneak) — Day 1 — Market Street
- [`street_plan`](#street_plan) — Day 1 — Market Street
- [`grocery_front`](#grocery_front) — Day 1 — Grocery
- [`grocery_front_win`](#grocery_front_win) — Day 1 — Grocery
- [`grocery_exterior`](#grocery_exterior) — Day 1 — Grocery (rear)
- [`grocery_inside`](#grocery_inside) — Day 1 — Grocery
- [`grocery_quick_exit`](#grocery_quick_exit) — Day 1 — Grocery
- [`meet_nora_card`](#meet_nora_card) — Day 1 — The Road
- [`freezer`](#freezer) — Day 1 — Freezer
- [`road_out`](#road_out) — Day 2 — The Road
- [`road_out_child`](#road_out_child) — Day 2 — The Road
- [`ambush`](#ambush) — Day 2 — The Pines
- [`sacrifice_intro`](#sacrifice_intro) — Day 2 — The Pines
- [`after_ambush_mercy`](#after_ambush_mercy) — Day 2 — The Pines
- [`after_ambush_fight`](#after_ambush_fight) — Day 2 — The Pines
- [`meet_vega_card`](#meet_vega_card) — Day 3 — Greenbelt
- [`meet_vega_card_hero`](#meet_vega_card_hero) — Day 3 — Greenbelt
- [`greenbelt_gate`](#greenbelt_gate) — Day 3 — Greenbelt
- [`greenbelt_gate_hero`](#greenbelt_gate_hero) — Day 3 — Greenbelt
- [`greenbelt_in`](#greenbelt_in) — Day 3 — Greenbelt Camp
- [`meet_ren_card`](#meet_ren_card) — Day 3 — Medbay
- [`ren_medbay_intro`](#ren_medbay_intro) — Day 3 — Medbay
- [`camp_morning`](#camp_morning) — Day 4 — Greenbelt
- [`chore_medbay`](#chore_medbay) — Day 4 — Medbay
- [`chore_perimeter`](#chore_perimeter) — Day 4 — Perimeter
- [`chore_kitchen`](#chore_kitchen) — Day 4 — Kitchen
- [`chore_done`](#chore_done) — Day 4 — Briefing
- [`nora_asks`](#nora_asks) — Day 4 — Camp gate
- [`horde_warning`](#horde_warning) — Day 5 — Sunrise
- [`flee_rearguard`](#flee_rearguard) — Day 5 — The Back Gate
- [`post_horde_win`](#post_horde_win) — Sunrise — After
- [`post_horde_lose`](#post_horde_lose) — Sunset — A Memorial
- [`post_horde_flee`](#post_horde_flee) — Dawn — The Long Road
- [`mission_journey`](#mission_journey) — Day 4 — South Road
- [`hospital_arrive`](#hospital_arrive) — Day 4 — Old Mercy
- [`pharmacy_combat`](#pharmacy_combat) — Day 4 — Pharmacy
- [`hospital_lobby`](#hospital_lobby) — Day 4 — Lobby
- [`mission_return`](#mission_return) — Day 4 — Camp, dusk
- [`investigate_traitor`](#investigate_traitor) — Day 4 — South Fence
- [`confront_traitor`](#confront_traitor) — Day 4 — South Fence
- [`traitor_aftermath`](#traitor_aftermath) — Day 4 — South Fence
- [`vega_gift`](#vega_gift) — Day 4 — Armory, after
- [`bonfire_invite`](#bonfire_invite) — Day 4 — Bonfire
- [`bonfire_crossroads`](#bonfire_crossroads) — Day 4 — Bonfire, at the edge
- [`romance_maya`](#romance_maya) — Day 4 — Maya's tent
- [`romance_ren`](#romance_ren) — Day 4 — Ren's medbay
- [`morning_after_maya`](#morning_after_maya) — Day 5 — Pre-dawn
- [`morning_after_ren`](#morning_after_ren) — Day 5 — Pre-dawn
- [`ending_final_hero`](#ending_final_hero) — Ending A — Defender
- [`ending_final_fallen`](#ending_final_fallen) — Ending B — Martyr
- [`ending_final_escape`](#ending_final_escape) — Ending C — Survivor
- [`ending_final_lovers`](#ending_final_lovers) — Ending D — Lovers, Saved
- [`ending_final_loverlost`](#ending_final_loverlost) — Ending E — Lover Lost
- [`ending_final_lovers_road`](#ending_final_lovers_road) — Ending F — Lovers, Walking
- [`ending_final_vega_fell`](#ending_final_vega_fell) — Ending G — Captain Held
- [`ending_final_maya_fell`](#ending_final_maya_fell) — Ending H — She Stayed
- [`ending_final_ren_fell`](#ending_final_ren_fell) — Ending I — The Medbay Door
- [`death`](#death) — You Died

---

## <a id="intro"></a>`intro`
**Chapter:** Day 1 — The Outbreak  
**Scene art:** `intro`  

> Three weeks since the fever spread. Three weeks since the dead stopped staying dead.
> 
> You are Ellis, a paramedic from the east suburbs. You held out in your apartment as long as you could. The food ran out yesterday.
> 
> A chopper thunders overhead and fades. You're alone now.

**Choices:**

1. **Check the hallway**
   - → `apt_hallway`

---

## <a id="apt_hallway"></a>`apt_hallway`
**Chapter:** Day 1 — Apartment 3B  
**Scene art:** (no explicit scene — uses node id)  

> The hallway stinks of rot. A streak of dried blood leads to the stairwell. Somewhere below, something drags its feet against concrete.
> 
> Your neighbour's door — Mrs. Cho, 3A — is ajar.

**Choices:**

1. **Search 3A for supplies** `RISKY`
   - → `neighbour_apt`
2. **Head straight for the stairwell**
   - → `stairwell_first`

---

## <a id="neighbour_apt"></a>`neighbour_apt`
**Chapter:** Day 1 — Apartment 3A  
**Scene art:** (no explicit scene — uses node id)  

> Mrs. Cho's apartment smells of incense and decay. She's slumped in her armchair, eyes closed. Peaceful, almost.
> 
> You spot a pantry of canned food and a medical bag on the counter.

**Choices:**

1. **Grab everything you can carry**
   - _effect:_ `s => { s.hp = Math.min(s.hpMax, s.hp + 2); Game.giveRandomItem(); Game.giveRandomItem(); Game.toast("+2 ❤️"); }`
   - → `neighbour_wake`
2. **Take only the medicine. Leave Mrs. Cho in peace.**
   - _effect:_ `s => { s.hp = Math.min(s.hpMax, s.hp + 3); s.flags.honourable = true; Game.toast("+3 ❤️"); }`
   - → `stairwell_first`

---

## <a id="neighbour_wake"></a>`neighbour_wake`
**Chapter:** Day 1 — Apartment 3A  
**Scene art:** (no explicit scene — uses node id)  

> The armchair creaks. Mrs. Cho's eyes open — milk-white, hungry.
> 
> She lunges.

**Choices:**

1. **Fight Mrs. Cho** `COMBAT`
   - ⚔ combat: enemy `walker_cho` → win `cho_loot` / lose `death`

---

## <a id="cho_loot"></a>`cho_loot`
**Chapter:** Day 1 — Apartment 3A  
**Scene art:** (no explicit scene — uses node id)  

> She's still. Truly still this time.
> 
> In the bottom dresser drawer, wrapped in an old service cloth: a well-kept .38 Special revolver. Her husband's name — HAN CHO — etched into the backstrap. A small box of six rounds beside it.
> 
> You're not a shooter. But you're not empty-handed anymore.

**Choices:**

1. **Take the pistol. Head for the stairs.**
   - _effect:_ `s => { Game.giveWeapon({ name: "Cho's .38", bonus: 1, slot: "ranged" }); s.ammo = 6; Game.toast("🔫 Cho's .38 · 6 rounds"); }`
   - → `stairwell_first`

---

## <a id="stairwell_first"></a>`stairwell_first`
**Chapter:** Day 1 — Stairwell  
**Scene art:** (no explicit scene — uses node id)  

> Four floors down. Your flashlight flickers. The dragging sound is louder now — more than one set of feet.
> 
> A voice, raspy but alive: "Hey. Don't scream. You bit?"

**Choices:**

1. **"I'm clean. Who are you?"**
   - → `meet_maya`
2. **Stay silent. Keep moving.** `RISKY`
   - _effect:_ `s => { s.flags.solo = true; }`
   - → `alone_street`

---

## <a id="meet_maya_card"></a>`meet_maya_card`
**Chapter:** Day 1 — Stairwell  
**Scene art:** `meet_maya_card`  

**Choices:**

1. **Fall in step with her.**
   - → `street_plan`

---

## <a id="meet_maya"></a>`meet_maya`
**Chapter:** Day 1 — Stairwell  
**Scene art:** (no explicit scene — uses node id)  
**Speaker:** Maya  

> A woman, mid-twenties, army jacket, a hunting knife in her belt. "Maya. 2F. I've been watching the street for two days — there's a pack of them at the corner store."
> 
> She pulls a crowbar from her pack and hands it to you. "Better than that letter opener."

**Choices:**

1. **"Stick together. Two's better than one."**
   - _effect:_ `s => { s.companion = "Maya"; s.flags.maya = true; Game.giveWeapon({ name: "Crowbar", bonus: 1, slot: "melee" }); }`
   - → `meet_maya_card`
2. **"I work better alone."**
   - _effect:_ `s => { s.flags.solo = true; Game.giveWeapon({ name: "Crowbar", bonus: 1, slot: "melee" }); }`
   - → `alone_street`

---

## <a id="alone_street"></a>`alone_street`
**Chapter:** Day 1 — Market Street  
**Scene art:** (no explicit scene — uses node id)  

> The street is a graveyard of cars. A walker shuffles between them, head twitching.
> 
> It hasn't seen you. Yet.

**Choices:**

1. **Sneak past** `STEALTH`
   - _effect:_ `s => { if (Math.random() < 0.5) { s.flags.spotted = true; } }`
   - → `alone_street_sneak`
2. **Charge it** `COMBAT`
   - ⚔ combat: enemy `walker` → win `grocery_exterior` / lose `death`

---

## <a id="alone_street_sneak"></a>`alone_street_sneak`
**Chapter:** Day 1 — Market Street  
**Scene art:** (no explicit scene — uses node id)  

<details><summary>Variant: default / with Maya companion / mission partner = maya / mission partner = ren / solo mission / saved Nora / bring Nora on mission / rested in car / told Vega / chore: medbay / chore: perimeter / chore: kitchen / exposed traitor / killed traitor / romance Maya / romance Ren</summary>

> You slide between the cars like a shadow. It never turns.
> 
> The grocery store sign buzzes ahead.

</details>

**Choices:**

1. **Run for the grocery** _require:_ `s => !s.flags.spotted`
   - → `grocery_exterior`
2. **Defend yourself** `COMBAT` _require:_ `s => s.flags.spotted`
   - ⚔ combat: enemy `runner` · risky → win `grocery_exterior` / lose `death`

---

## <a id="street_plan"></a>`street_plan`
**Chapter:** Day 1 — Market Street  
**Scene art:** (no explicit scene — uses node id)  
**Speaker:** Maya  

> "Grocery on the corner. Shelves might still have something. My cousin worked there — there's a back door, staff only."
> 
> She hands you a flashlight.

**Choices:**

1. **Front entrance — fast in, fast out**
   - → `grocery_front`
2. **Back door — safer but slower**
   - → `grocery_exterior`

---

## <a id="grocery_front"></a>`grocery_front`
**Chapter:** Day 1 — Grocery  
**Scene art:** (no explicit scene — uses node id)  

> The automatic doors jam half-open. Inside, two walkers lurch toward you past tipped-over carts.

**Choices:**

1. **Fight them together** `COMBAT` _require:_ `s => s.companion === "Maya"`
   - ⚔ combat: enemy `walker_pair` → win `grocery_front_win` / lose `death`
2. **Fight them alone** `COMBAT` _require:_ `s => s.companion !== "Maya"`
   - ⚔ combat: enemy `walker_pair` → win `grocery_front_win` / lose `death`

---

## <a id="grocery_front_win"></a>`grocery_front_win`
**Chapter:** Day 1 — Grocery  
**Scene art:** (no explicit scene — uses node id)  

> The second walker slumps against a tipped cart. One of them was wearing a police load-bearing vest — scarred up but the plates are intact. You cut it free and shrug into it.
> 
> It won't save your life twice. Once is more than nothing.

**Choices:**

1. **Take the vest and head deeper in**
   - _effect:_ `s => { s.inventory = s.inventory || []; s.inventory.push({ id: "vest", name: "🦺 Riot Vest", desc: "Absorbs one hit in combat. Breaks after.", armor: true, }); Game.toast("Riot Vest equipped"); }`
   - → `grocery_inside`

---

## <a id="grocery_exterior"></a>`grocery_exterior`
**Chapter:** Day 1 — Grocery (rear)  
**Scene art:** (no explicit scene — uses node id)  

> The back door hangs on one hinge. Inside: the smell of spoiled milk, the hum of a dying fridge.
> 
> Something knocks — steady, patient — from behind the shelves.

**Choices:**

1. **Investigate the knocking**
   - → `grocery_inside`
2. **Grab what's closest and leave**
   - _effect:_ `s => { Game.giveRandomItem(); }`
   - → `grocery_quick_exit`

---

## <a id="grocery_inside"></a>`grocery_inside`
**Chapter:** Day 1 — Grocery  
**Scene art:** (no explicit scene — uses node id)  

> Aisle four: canned beans, a bottle of aspirin, and — in the manager's office — a drawer with a handgun and three rounds.
> 
> You hear the knocking again. It's coming from the walk-in freezer.

**Choices:**

1. **Take supplies and leave**
   - _effect:_ `s => { s.ammo += 3; s.hp = Math.min(s.hpMax, s.hp + 1); Game.giveRandomItem(); Game.giveRandomItem(); Game.toast("+3 🔫, +1 ❤️"); }`
   - → `road_out`
2. **Open the freezer** `RISKY`
   - _effect:_ `s => { s.ammo += 3; s.hp = Math.min(s.hpMax, s.hp + 1); Game.toast("+3 🔫, +1 ❤️"); }`
   - ⚔ combat: enemy `freezer_abom` · risky → win `freezer` / lose `death`

---

## <a id="grocery_quick_exit"></a>`grocery_quick_exit`
**Chapter:** Day 1 — Grocery  
**Scene art:** (no explicit scene — uses node id)  

> You jog out the back. Something shuffles from the alley. Its mouth is black.

**Choices:**

1. **Keep running** `COMBAT`
   - ⚔ combat: enemy `runner` · risky → win `road_out` / lose `death`

---

## <a id="meet_nora_card"></a>`meet_nora_card`
**Chapter:** Day 1 — The Road  
**Scene art:** `meet_nora_card`  

**Choices:**

1. **Keep walking.**
   - → `road_out_child`

---

## <a id="freezer"></a>`freezer`
**Chapter:** Day 1 — Freezer  
**Scene art:** (no explicit scene — uses node id)  

<details><summary>Variant: default / mission partner = maya / mission partner = ren / solo mission / saved Nora / bring Nora on mission / rested in car / told Vega / chore: medbay / chore: perimeter / chore: kitchen / exposed traitor / killed traitor / romance Ren</summary>

> The thing finally stops moving. You don't want to look at what it used to be.
> 
> Breath fogging in the cold. Blood steaming on the floor.
> 
> Behind a wall of tipped shelving, small and perfectly still — a girl, maybe ten, a kitchen knife shaking in her hand.
> 
> "Don't. Don't touch me."

</details>

<details><summary>Variant: with Maya companion / romance Maya</summary>

> The thing finally stops moving. Neither of you want to look at what it used to be.
> 
> Breath fogging in the cold. Blood steaming on the floor.
> 
> Behind a wall of tipped shelving, small and perfectly still — a girl, maybe ten, a kitchen knife shaking in her hand.
> 
> Maya drops into a low crouch, hands wide. "Hey. Hey, kid. We're not going to hurt you."
> 
> The girl's eyes lock on you. "Don't. Don't touch me."

</details>

**Choices:**

1. **"It's okay. I'm not going to hurt you."**
   - _effect:_ `s => { s.companion2 = "Nora"; s.flags.savedNora = true; // Maya saw you risk yourself for a kid — tracks for her. if (s.companion === "Maya") { s.bonds.maya += 1; Game.toast("Nora joined you · Maya's trust +1"); } else Game.toast("Nora joined you"); }`
   - → `meet_nora_card`
2. **Close the door. It's not your problem.**
   - _effect:_ `s => { s.flags.coward = true; // Maya saw the opposite — and she does not forgive this one. if (s.companion === "Maya") { s.bonds.maya = Math.max(0, (s.bonds.maya || 0) - 2); Game.toast("You leave her behind · Maya's trust -2"); } else Game.toast("You leave her behind"); }`
   - → `road_out`

---

## <a id="road_out"></a>`road_out`
**Chapter:** Day 2 — The Road  
**Scene art:** (no explicit scene — uses node id)  

<details><summary>Variant: default / mission partner = maya / mission partner = ren / solo mission / saved Nora / bring Nora on mission / rested in car / told Vega / chore: medbay / chore: perimeter / chore: kitchen / exposed traitor / killed traitor / romance Ren</summary>

> You walk for hours. The highway is a museum of stalled cars. You've heard rumours of a camp — the Greenbelt — in the old state park.
> 
> Ahead, a hitchhiker sign: GREENBELT 12 MI.

</details>

<details><summary>Variant: with Maya companion / romance Maya</summary>

> You and Maya walk for hours. She keeps pace half a step behind you, eyes always on the treeline. The highway is a museum of stalled cars.
> 
> "Heard people talking about a camp," she says, not looking at you. "The Greenbelt. Old state park."
> 
> Ahead, a hitchhiker sign: GREENBELT 12 MI.

</details>

**Choices:**

1. **Keep walking. Find the camp.**
   - → `ambush`
2. **Rest in a station wagon**
   - _effect:_ `s => { s.hp = s.hpMax; s.stam = s.stamMax; // Rummage the cab — gloveboxes on this highway have been // picked over, but not all. Game.giveRandomItem(); s.flags.restedInCar = true; Game.toast("❤️ ⚡ restored + glovebox loot"); }`
   - → `ambush`

---

## <a id="road_out_child"></a>`road_out_child`
**Chapter:** Day 2 — The Road  
**Scene art:** (no explicit scene — uses node id)  
**Speaker:** Nora  

<details><summary>Variant: default / mission partner = maya / mission partner = ren / solo mission / saved Nora / bring Nora on mission / rested in car / told Vega / chore: medbay / chore: perimeter / chore: kitchen / exposed traitor / killed traitor / romance Ren</summary>

> The girl's name is Nora. She's quiet for hours, then: "My dad said there's people at the Greenbelt. Soldiers. Good ones."
> 
> She slips her hand into yours.

</details>

<details><summary>Variant: with Maya companion / romance Maya</summary>

> The girl's name is Nora. She's quiet for hours, keeping pace between you and Maya. When she speaks, it's to Maya — to the rifle across her back.
> 
> "My dad said there's people at the Greenbelt. Soldiers. Good ones."
> 
> Maya nods without smiling. The girl slips her hand into yours anyway.

</details>

**Choices:**

1. **"Then that's where we go."**
   - → `ambush`

---

## <a id="ambush"></a>`ambush`
**Chapter:** Day 2 — The Pines  
**Scene art:** (no explicit scene — uses node id)  
**Speaker:** ???  

<details><summary>Variant: default / mission partner = maya / mission partner = ren / solo mission / saved Nora / bring Nora on mission / told Vega / chore: medbay / chore: perimeter / chore: kitchen / exposed traitor / killed traitor / romance Ren</summary>

> A shotgun racks behind you. "Drop the bag. Slow."
> 
> Two men step out from the pines. Not infected — worse. Bandits.

</details>

<details><summary>Variant: with Maya companion / romance Maya</summary>

> A shotgun racks behind you. Maya's hand closes on your wrist. "Slow," she breathes.
> 
> Two men step out from the pines. Not infected — worse. Bandits.

</details>

<details><summary>Variant: rested in car</summary>

> You clocked their pickup a mile back through the station wagon's rear window — two men, rifles across the seats. When they step out of the pines shouting "drop the bag," you already have a plan.

</details>

**Choices:**

1. **Drop the bag. Live to fight another day.**
   - _effect:_ `s => { s.ammo = Math.max(0, s.ammo - 2); Game.toast("-2 🔫"); }`
   - → `after_ambush_mercy`
2. **Fight — you need these supplies** `COMBAT`
   - ⚔ combat _(default, with Maya companion, mission partner = maya, mission partner = ren, solo mission, saved Nora, bring Nora on mission, told Vega, chore: medbay, chore: perimeter, chore: kitchen, exposed traitor, killed traitor, romance Maya, romance Ren)_: enemy `bandit` · risky → win `after_ambush_fight` / lose `death`
   - ⚔ combat _(rested in car)_: enemy `bandit` → win `after_ambush_fight` / lose `death`
3. **"Take me. Let the kid go."** `SACRIFICE` _require:_ `s => s.companion2 === "Nora"`
   - → `sacrifice_intro`

---

## <a id="sacrifice_intro"></a>`sacrifice_intro`
**Chapter:** Day 2 — The Pines  
**Scene art:** (no explicit scene — uses node id)  

<details><summary>Variant: default / mission partner = maya / mission partner = ren / solo mission / saved Nora / bring Nora on mission / rested in car / told Vega / chore: medbay / chore: perimeter / chore: kitchen / exposed traitor / killed traitor / romance Ren</summary>

> The older bandit laughs, then stops. Something in your face shuts him up.
> 
> He jerks his chin at Nora. "Hide, kid. Behind the big pine. Eyes shut."
> 
> She looks at you. You nod once — go. She scrambles thirty feet into the brush and curls small behind a mossy log. You can still see the top of her head.

</details>

<details><summary>Variant: with Maya companion / romance Maya</summary>

> Maya's hand is on her knife. You put yours on her shoulder — hold. Not yet.
> 
> The older bandit laughs, then stops. Something in your face shuts him up.
> 
> He jerks his chin at Nora. "Hide, kid. Behind the big pine. Eyes shut."
> 
> She looks at you. You nod once — go. She scrambles thirty feet into the brush and curls small behind a mossy log. You can still see the top of her head.
> 
> Maya steps in beside you, not behind you. She's not going anywhere either.

</details>

**Choices:**

1. **Fight for your life** `COMBAT`
   - _effect:_ `s => { s.flags.carriedNora = true; }`
   - ⚔ combat: enemy `bandit` → win `greenbelt_gate_hero` / lose `death`

---

## <a id="after_ambush_mercy"></a>`after_ambush_mercy`
**Chapter:** Day 2 — The Pines  
**Scene art:** (no explicit scene — uses node id)  

> They take what they want and disappear into the trees. You're lighter now — but alive.

**Choices:**

1. **Push on to the Greenbelt**
   - → `greenbelt_gate`

---

## <a id="after_ambush_fight"></a>`after_ambush_fight`
**Chapter:** Day 2 — The Pines  
**Scene art:** (no explicit scene — uses node id)  

<details><summary>Variant: default / mission partner = maya / mission partner = ren / solo mission / saved Nora / bring Nora on mission / rested in car / told Vega / chore: medbay / chore: perimeter / chore: kitchen / exposed traitor / killed traitor / romance Ren</summary>

> It was ugly. It was quick. You take their shotgun, their jerky, and their silence.

</details>

<details><summary>Variant: with Maya companion / romance Maya</summary>

> It was ugly. It was quick. Maya wipes her blade on the bigger one's jacket and doesn't look up.
> 
> "We don't talk about this one," she says.
> 
> You take their shotgun, their jerky, and their silence between you.

</details>

**Choices:**

1. **Loot and move on**
   - _effect:_ `s => { s.ammo += 4; s.flags.killedBandits = true; Game.giveRandomItem(); Game.toast("+4 🔫"); }`
   - → `greenbelt_gate`

---

## <a id="meet_vega_card"></a>`meet_vega_card`
**Chapter:** Day 3 — Greenbelt  
**Scene art:** `meet_vega_card`  

**Choices:**

1. **Step inside the wire.**
   - → `greenbelt_in`

---

## <a id="meet_vega_card_hero"></a>`meet_vega_card_hero`
**Chapter:** Day 3 — Greenbelt  
**Scene art:** `meet_vega_card_hero`  

**Choices:**

1. **Step inside the wire.**
   - → `greenbelt_in`

---

## <a id="greenbelt_gate"></a>`greenbelt_gate`
**Chapter:** Day 3 — Greenbelt  
**Scene art:** (no explicit scene — uses node id)  
**Speaker:** Guard  

<details><summary>Variant: default / mission partner = maya / mission partner = ren / solo mission / saved Nora / bring Nora on mission / rested in car / told Vega / chore: medbay / chore: perimeter / chore: kitchen / exposed traitor / killed traitor / romance Ren</summary>

> A chain-link fence topped with razor wire. A woman in tactical gear studies you through the scope of a rifle.
> 
> "State your business. And show me your arms — both sides."

</details>

<details><summary>Variant: with Maya companion / romance Maya</summary>

> A chain-link fence topped with razor wire. A woman in tactical gear studies you — and Maya — through the scope of a rifle.
> 
> "Both of you. State your business. Show me your arms — both sides."
> 
> Maya raises her sleeves slow and steady. She's done this before.

</details>

**Choices:**

1. **Show your arms. No bites.**
   - → `meet_vega_card`
2. **Offer supplies as a gift** _require:_ `s => s.ammo >= 2`
   - _effect:_ `s => { s.ammo -= 2; s.flags.goodwill = true; s.bonds.vega = (s.bonds.vega || 0) + 1; Game.toast("-2 🔫 · Vega's trust +1"); }`
   - → `meet_vega_card`

---

## <a id="greenbelt_gate_hero"></a>`greenbelt_gate_hero`
**Chapter:** Day 3 — Greenbelt  
**Scene art:** (no explicit scene — uses node id)  

<details><summary>Variant: default / mission partner = maya / mission partner = ren / solo mission / saved Nora / bring Nora on mission / rested in car / told Vega / chore: medbay / chore: perimeter / chore: kitchen / exposed traitor / killed traitor / romance Ren</summary>

> Afterwards you call her out from behind the mossy log. She comes slow, eyes enormous. She doesn't say anything about the blood. She walks the first half-mile and then her legs stop working and you carry her the rest.
> 
> By the time the gate slides open she's asleep on your shoulder. The guards look at you — bloodied, limping, small weight against your neck — and lower their rifles.

</details>

<details><summary>Variant: with Maya companion / romance Maya</summary>

> Afterwards you call her out from behind the mossy log. She comes slow, eyes enormous. She doesn't say anything about the blood. She walks the first half-mile and then her legs stop working and you carry her the rest.
> 
> Maya walks three steps behind you the whole way, checking the treeline. She doesn't offer to carry the girl. She doesn't have to say it: this was the right call.
> 
> By the time the gate slides open she's asleep on your shoulder. The guards look at you — bloodied, limping, small weight against your neck — and lower their rifles.

</details>

**Choices:**

1. **"She needs food. Please."**
   - _effect:_ `s => { // goodwill flag stays narrowly tied to the 'offer supplies // at the gate' path — Vega's spare mag at the briefing // literally references the rounds you handed over. // The sacrifice path gets its reward via Maya's +2 bond, // a Vega +1 (she meets you at the gate carrying a bloodied // kid you nearly died for — that's where she clocks you), // and the carrying-Nora-through-the-gate narrative. if (s.companion === "Maya") { s.bonds.maya += 2; } s.bonds.vega = (s.bonds.vega || 0) + 1; Game.toast(s.companion === "Maya" ? "Maya's trust +2 · Vega's trust +1" : "Vega's trust +1"); }`
   - → `meet_vega_card_hero`

---

## <a id="greenbelt_in"></a>`greenbelt_in`
**Chapter:** Day 3 — Greenbelt Camp  
**Scene art:** (no explicit scene — uses node id)  

<details><summary>Variant: default / mission partner = maya / mission partner = ren / solo mission / rested in car / told Vega / chore: medbay / chore: perimeter / chore: kitchen / exposed traitor / killed traitor / romance Ren</summary>

> Inside: tents, solar lamps, the smell of stew. A radio crackles weather reports.
> 
> A young woman with calm hands and a quiet voice bandages your arm. "You're lucky. Most don't make it this far. I'm Ren."
> 
> Across the fire, another woman in tactical kit nods at you — Captain Vega. "Eat. Sleep. We talk in the morning."

</details>

<details><summary>Variant: with Maya companion / romance Maya</summary>

> Inside: tents, solar lamps, the smell of stew. A radio crackles weather reports.
> 
> Maya drops onto the bench beside you, rifle across her knees, already scanning the camp like she's mapping exits.
> 
> A young woman with calm hands and a quiet voice bandages your arm. "You're lucky. Most don't make it this far. I'm Ren."
> 
> Across the fire, another woman in tactical kit nods at all of you — Captain Vega. "Eat. Sleep. We talk in the morning."

</details>

<details><summary>Variant: saved Nora / bring Nora on mission</summary>

> Inside: tents, solar lamps, the smell of stew. A radio crackles weather reports.
> 
> Nora stays close to your leg, eyes enormous. Someone's kid offers her a wooden horse; she doesn't take it, but she doesn't shrink away either.
> 
> A young woman with calm hands and a quiet voice bandages your arm. "You're lucky. Most don't make it this far. I'm Ren."
> 
> Across the fire, another woman in tactical kit nods at all of you — Captain Vega. "Eat. Sleep. We talk in the morning."

</details>

**Choices:**

1. **Let Ren patch you up properly before bed.** `BOND`
   - _effect:_ `function payGoodwillOnce(s) { if (s.flags && s.flags.goodwill && !s.flags.goodwill_paid) { s.ammo += 3; s.flags.goodwill_paid = true; } }`
   - → `ren_medbay_intro`
2. **Sleep now. Tomorrow is another day.**
   - _effect:_ `s => { s.hp = s.hpMax; s.stam = s.stamMax; payGoodwillOnce(s); Game.toast("❤️ ⚡ restored"); }`
   - → `camp_morning`

---

## <a id="meet_ren_card"></a>`meet_ren_card`
**Chapter:** Day 3 — Medbay  
**Scene art:** `meet_ren_card`  

**Choices:**

1. **Step out into the camp.**
   - → `camp_morning`

---

## <a id="ren_medbay_intro"></a>`ren_medbay_intro`
**Chapter:** Day 3 — Medbay  
**Scene art:** (no explicit scene — uses node id)  
**Speaker:** Ren  

<details><summary>Variant: default / with Maya companion / mission partner = maya / mission partner = ren / solo mission / rested in car / told Vega / chore: medbay / chore: perimeter / chore: kitchen / exposed traitor / killed traitor / romance Maya / romance Ren</summary>

> The medbay is a converted shipping container. Clean linen, antiseptic bite in the air, one lamp hanging low. Ren sits you down, rolls a stool over, and starts on your arm without asking.
> 
> "Worked ER at Old Mercy the first month," she says, eyes on the stitch. "Saw what the fever did to a hallway. Stopped sleeping."
> 
> A long, steady pull of thread.
> 
> "If my hands shake later — that's why. They work anyway."

</details>

<details><summary>Variant: saved Nora / bring Nora on mission</summary>

> The medbay is a converted shipping container. Clean linen, antiseptic bite in the air, one lamp hanging low. Ren sits you down, rolls a stool over, and starts on your arm without asking.
> 
> "Worked ER at Old Mercy the first month," she says, eyes on the stitch. "Saw what the fever did to a hallway. Stopped sleeping."
> 
> A long, steady pull of thread.
> 
> "If my hands shake later — that's why. They work anyway."
> 
> Nora is curled on the spare cot in the corner, already asleep under a too-big blanket. Ren glances over every few stitches.

</details>

**Choices:**

1. **"Thank you."**
   - _effect:_ `s => { s.hp = s.hpMax; s.stam = s.stamMax; Game.toast("❤️ ⚡ restored"); }`
   - → `meet_ren_card`
2. **Sit with Ren in silence until she finishes.**
   - _effect:_ `s => { s.hp = s.hpMax; s.stam = s.stamMax; s.bonds.ren += 1; Game.toast("❤️ ⚡ restored · Ren's trust +1"); }`
   - → `meet_ren_card`

---

## <a id="camp_morning"></a>`camp_morning`
**Chapter:** Day 4 — Greenbelt  
**Scene art:** `greenbelt_morning`  
**Speaker:** Captain Vega  

> Coffee that tastes like dirt. Sun coming up through the pines.
> 
> "You earned a day before we put you to work," Vega says. "Pick a hand to lend. Or don't. Free country — what's left of it."

**Choices:**

1. **Help Ren in the medbay** `BOND`
   - _effect:_ `s => { s.flags.choreChosen = "medbay"; }`
   - → `chore_medbay`
2. **Walk the perimeter with Maya** `BOND` _require:_ `s => s.flags.maya`
   - _effect:_ `s => { s.flags.choreChosen = "perimeter"; }`
   - → `chore_perimeter`
3. **Cook for the camp**
   - _effect:_ `s => { s.flags.choreChosen = "kitchen"; }`
   - → `chore_kitchen`

---

## <a id="chore_medbay"></a>`chore_medbay`
**Chapter:** Day 4 — Medbay  
**Scene art:** `medbay`  
**Speaker:** Ren  

<details><summary>Variant: default / with Maya companion / mission partner = maya / mission partner = ren / solo mission / rested in car / told Vega / chore: medbay / chore: perimeter / chore: kitchen / exposed traitor / killed traitor / romance Maya / romance Ren</summary>

> Ren's medbay is a converted shipping container. Antiseptic, clean linen, a guitar in the corner.
> 
> "Hold this. Hands steady." You're stitching a cut on a kid's knee. Ren watches you work. "You've done this before."
> 
> "Paramedic. East side."
> 
> "Then you know how it gets — losing them." A long beat. "Tell me one you saved."

</details>

<details><summary>Variant: saved Nora / bring Nora on mission</summary>

> Ren's medbay is a converted shipping container. Antiseptic, clean linen, a guitar in the corner.
> 
> Nora is tucked cross-legged on the spare cot, drawing something on the back of a pill-label leaflet. Ren keeps one eye on her between stitches, like she's already decided.
> 
> "Hold this. Hands steady." You're stitching a cut on a kid's knee. Ren watches you work. "You've done this before."
> 
> "Paramedic. East side."
> 
> "Then you know how it gets — losing them." A long beat. "Tell me one you saved."

</details>

**Choices:**

1. **Tell Ren about the boy in the subway fire**
   - _effect:_ `s => { s.bonds.ren += 1; Game.toast("Ren's trust +1"); }`
   - → `chore_done`
2. **Change the subject. Some doors stay shut.**
   - → `chore_done`

---

## <a id="chore_perimeter"></a>`chore_perimeter`
**Chapter:** Day 4 — Perimeter  
**Scene art:** `perimeter`  
**Speaker:** Maya  

> Maya climbs the watchtower like she was born there. You hand up coffee. She drinks it without taking her eyes off the treeline.
> 
> "My brother used to do this watch with me. Before." She doesn't look at you. "Six months. Feels like six years."
> 
> The wind moves through the pines. She's closer than she needs to be.

**Choices:**

1. **"Tell me about your brother."**
   - _effect:_ `s => { s.bonds.maya += 2; Game.toast("Maya's trust +2"); }`
   - → `chore_done`
2. **Stand watch in silence. Some things don't need words.**
   - _effect:_ `s => { s.bonds.maya += 1; }`
   - → `chore_done`

---

## <a id="chore_kitchen"></a>`chore_kitchen`
**Chapter:** Day 4 — Kitchen  
**Scene art:** `camp_kitchen`  

<details><summary>Variant: default / with Maya companion / mission partner = maya / mission partner = ren / solo mission / rested in car / told Vega / chore: medbay / chore: perimeter / chore: kitchen / exposed traitor / killed traitor / romance Maya / romance Ren</summary>

> You spend the morning peeling potatoes and listening to camp gossip. Three meals out of one rabbit. Magic.
> 
> Vega slaps your shoulder on her way past. "You'll do."

</details>

<details><summary>Variant: saved Nora / bring Nora on mission</summary>

> You spend the morning peeling potatoes and listening to camp gossip. Three meals out of one rabbit. Magic.
> 
> Nora sits cross-legged by the fire stripping peas from a pod, tongue poking out in concentration. She steals one. Then another. You pretend not to notice.
> 
> Vega slaps your shoulder on her way past. "You'll do."

</details>

**Choices:**

1. **Wash up and report in**
   - _effect:_ `s => { Game.giveRandomItem(); Game.giveRandomItem(); // Cooking is Vega's domain — she clocks who pulls their weight // without being asked. Builds the trust that ends up with // her slinging you her ranger rifle at the horde. s.bonds.vega = (s.bonds.vega || 0) + 1; Game.toast("Vega's trust +1"); }`
   - → `chore_done`

---

## <a id="chore_done"></a>`chore_done`
**Chapter:** Day 4 — Briefing  
**Scene art:** fn → `chore_done` _(default, with Maya companion, mission partner = maya, mission partner = ren, solo mission, saved Nora, bring Nora on mission, rested in car, told Vega, exposed traitor, killed traitor, romance Maya, romance Ren)_, `chore_done_medbay` _(chore: medbay)_, `chore_done_perimeter` _(chore: perimeter)_, `chore_done_kitchen` _(chore: kitchen)_  
**Speaker:** Captain Vega  

<details><summary>Variant: default / with Maya companion / mission partner = maya / mission partner = ren / solo mission / saved Nora / bring Nora on mission / rested in car / told Vega / exposed traitor / killed traitor / romance Maya / romance Ren</summary>

> "Old Mercy Hospital. Three klicks south. Pharmacy on the second floor — antibiotics, painkillers, anything that hasn't walked off."
> 
> She spreads a hand-drawn map. "In and out. Don't be a hero. Pick someone to take."

</details>

<details><summary>Variant: chore: medbay</summary>

> Maya is in the corner of the tent, breaking down a rifle. She doesn't look up when you walk in. The treeline could've used a second pair of eyes today.
> 
> "Old Mercy Hospital. Three klicks south. Pharmacy on the second floor — antibiotics, painkillers, anything that hasn't walked off."
> 
> She spreads a hand-drawn map. "In and out. Don't be a hero. Pick someone to take."

</details>

<details><summary>Variant: chore: perimeter</summary>

> Ren's at the briefing too, clipboard balanced on her knee. "Med inventory's thinner than it should be," she murmurs as you sit down. It's not a complaint. It lands like one anyway.
> 
> "Old Mercy Hospital. Three klicks south. Pharmacy on the second floor — antibiotics, painkillers, anything that hasn't walked off."
> 
> She spreads a hand-drawn map. "In and out. Don't be a hero. Pick someone to take."

</details>

<details><summary>Variant: chore: kitchen</summary>

> Ren sets a mug of something hot in front of you without meeting your eye. Maya's across the table, back half-turned. The map is the only thing the three of you are willing to look at.
> 
> "Old Mercy Hospital. Three klicks south. Pharmacy on the second floor — antibiotics, painkillers, anything that hasn't walked off."
> 
> She spreads a hand-drawn map. "In and out. Don't be a hero. Pick someone to take."

</details>

**Choices:**

1. **Take Maya — she knows how to fight** _require:_ `s => s.flags.maya`
   - _effect:_ `s => { s.flags.missionPartner = "maya"; }`
   - → function targets: `mission_journey`, `nora_asks`
2. **Take Ren — she knows what to grab**
   - _effect:_ `s => { s.flags.missionPartner = "ren"; }`
   - → function targets: `mission_journey`, `nora_asks`
3. **Go alone. Less mouths, less risk.**
   - _effect:_ `s => { s.flags.missionPartner = null; s.flags.solo_mission = true; }`
   - → function targets: `mission_journey`, `nora_asks`

---

## <a id="nora_asks"></a>`nora_asks`
**Chapter:** Day 4 — Camp gate  
**Scene art:** (no explicit scene — uses node id)  
**Speaker:** Nora  

<details><summary>Variant: default / with Maya companion / mission partner = ren / solo mission / saved Nora / rested in car / told Vega / chore: medbay / chore: perimeter / chore: kitchen / exposed traitor / killed traitor / romance Maya / romance Ren</summary>

> You're tightening a strap when small boots hit the dirt behind you. Nora — breathless, already wearing her little pack.
> 
> "Take me. I watch for things grown-ups miss. I'm quiet. I won't slow you down."
> 
> She's too small for what's out there. Her eyes are too big for what she already is.

</details>

<details><summary>Variant: mission partner = maya / bring Nora on mission</summary>

> You're tightening a strap when small boots hit the dirt behind you. Nora — breathless, already wearing her little pack.
> 
> "Take me. I watch for things grown-ups miss. I'm quiet. I won't slow you down."
> 
> She's too small for what's out there. Her eyes are too big for what she already is.
> 
> Maya watches from ten feet off, rifle slung. She catches your eye once — you can read it: *don't.* Then looks away.

</details>

**Choices:**

1. **"Stay close. Do exactly what I say."** `RISKY`
   - _effect:_ `s => { s.flags.bringNora = true; // Maya explicitly warned you with the 'don't' look. Taking // the kid anyway sits with her. if (s.flags.missionPartner === "maya") { s.bonds.maya = Math.max(0, (s.bonds.maya || 0) - 2); Game.toast("Nora is coming · Maya's trust -2"); } else { Game.toast("Nora is coming with you"); } }`
   - → `mission_journey`
2. **"Not this one, kid. You're safer here."**
   - _effect:_ `s => { s.flags.bringNora = false; // Maya approves the sensible call. if (s.flags.missionPartner === "maya") { s.bonds.maya += 1; Game.toast("Maya's trust +1"); } }`
   - → `mission_journey`

---

## <a id="horde_warning"></a>`horde_warning`
**Chapter:** Day 5 — Sunrise  
**Scene art:** `horde_warning`  
**Speaker:** Captain Vega  

<details><summary>Variant: default / solo mission / rested in car / told Vega / romance Ren</summary>

> A siren shatters the morning. A horde — hundreds — pouring down the old highway. They'll hit the fence in minutes.
> 
> Something's wrong with the south fence — whatever it is, there's no time to fix it now.
> 
> Ren throws a med kit over her shoulder, Vega's already on the wall.
> 
> "We hold, or we run. Choose."

</details>

<details><summary>Variant: with Maya companion / mission partner = maya / mission partner = ren / chore: medbay / chore: perimeter / chore: kitchen</summary>

> A siren shatters the morning. A horde — hundreds — pouring down the old highway. They'll hit the fence in minutes.
> 
> Something's wrong with the south fence — whatever it is, there's no time to fix it now.
> 
> Maya racks her rifle, Ren throws a med kit over her shoulder, Vega's already on the wall.
> 
> "We hold, or we run. Choose."

</details>

<details><summary>Variant: saved Nora</summary>

> A siren shatters the morning. A horde — hundreds — pouring down the old highway. They'll hit the fence in minutes.
> 
> Something's wrong with the south fence — whatever it is, there's no time to fix it now.
> 
> Ren throws a med kit over her shoulder, Vega's already on the wall, Nora ducks into the medbay sandbags.
> 
> "We hold, or we run. Choose."

</details>

<details><summary>Variant: bring Nora on mission</summary>

> A siren shatters the morning. A horde — hundreds — pouring down the old highway. They'll hit the fence in minutes.
> 
> Something's wrong with the south fence — whatever it is, there's no time to fix it now.
> 
> Maya racks her rifle, Ren throws a med kit over her shoulder, Vega's already on the wall, Nora ducks into the medbay sandbags.
> 
> "We hold, or we run. Choose."

</details>

<details><summary>Variant: exposed traitor</summary>

> A siren shatters the morning. A horde — hundreds — pouring down the old highway. They'll hit the fence in minutes.
> 
> Thanks to last night's warning the camp is ready. The south fence is reinforced, the armory is open, every rifle is loaded.
> 
> Maya racks her rifle, Ren throws a med kit over her shoulder, Vega's already on the wall, Nora ducks into the medbay sandbags.
> 
> "We hold, or we run. Choose."

</details>

<details><summary>Variant: killed traitor</summary>

> A siren shatters the morning. A horde — hundreds — pouring down the old highway. They'll hit the fence in minutes.
> 
> No one knows what you did at the south fence. The camp is calm — until it isn't.
> 
> Ren throws a med kit over her shoulder, Vega's already on the wall.
> 
> "We hold, or we run. Choose."

</details>

<details><summary>Variant: romance Maya</summary>

> A siren shatters the morning. A horde — hundreds — pouring down the old highway. They'll hit the fence in minutes.
> 
> Something's wrong with the south fence — whatever it is, there's no time to fix it now.
> 
> Maya racks her rifle, Ren throws a med kit over her shoulder, Vega's already on the wall.
> 
> Ren passes you on her way to the wall, med kit bouncing. She catches your eye. A small, real smile. "Good," she says, and keeps moving.
> 
> "We hold, or we run. Choose."

</details>

**Choices:**

1. **Hold the wall.** `COMBAT`
   - _effect:_ `s => { // Every saved ally is on the wall for this one. s.flags.hordeDefense = true; }`
   - ⚔ combat _(default, with Maya companion, mission partner = maya, mission partner = ren, solo mission, saved Nora, bring Nora on mission, rested in car, told Vega, chore: medbay, chore: perimeter, chore: kitchen, killed traitor, romance Maya, romance Ren)_: enemy `horde` · risky · hp=46 · atk=[5,8] → win `post_horde_win` / lose `post_horde_lose`
   - ⚔ combat _(exposed traitor)_: enemy `horde` · hp=38 · atk=[4,7] → win `post_horde_win` / lose `post_horde_lose`
2. **Get the survivors out the back.**
   - → `flee_rearguard`

---

## <a id="flee_rearguard"></a>`flee_rearguard`
**Chapter:** Day 5 — The Back Gate  
**Scene art:** `flee_rearguard`  
**Speaker:** Captain Vega  

<details><summary>Variant: default / solo mission / rested in car / told Vega / killed traitor</summary>

> The back gate is a bottleneck. Twenty survivors, one path, and the horde already beginning to wrap the wall. Whoever goes last buys the minutes the rest need.
> 
> Vega racks her rifle. "I'm the one with the most rounds and the least family. I stay. I slow them."
> 
> Ren is further up, shepherding the walking wounded, med kit over her shoulder. She catches your eye once and keeps moving.
> 
> The first of them are at the inner fence.

</details>

<details><summary>Variant: with Maya companion / mission partner = maya / mission partner = ren / chore: medbay / chore: perimeter / chore: kitchen / exposed traitor</summary>

> The back gate is a bottleneck. Twenty survivors, one path, and the horde already beginning to wrap the wall. Whoever goes last buys the minutes the rest need.
> 
> Vega racks her rifle. "I'm the one with the most rounds and the least family. I stay. I slow them."
> 
> Maya is already at the gate, rifle braced across her forearm, pushing survivors through two at a time. She glances up at you. A short nod. Keep moving.
> 
> Ren is further up, shepherding the walking wounded, med kit over her shoulder. She catches your eye once and keeps moving.
> 
> The first of them are at the inner fence.

</details>

<details><summary>Variant: saved Nora</summary>

> The back gate is a bottleneck. Twenty survivors, one path, and the horde already beginning to wrap the wall. Whoever goes last buys the minutes the rest need.
> 
> Vega racks her rifle. Her eyes flick once to Nora clinging to your sleeve, then away. "I'm the one with the most rounds and the least family. I stay. I slow them. Get the kid out."
> 
> Ren is further up, shepherding the walking wounded, med kit over her shoulder. She catches your eye once and keeps moving.
> 
> The first of them are at the inner fence.

</details>

<details><summary>Variant: bring Nora on mission</summary>

> The back gate is a bottleneck. Twenty survivors, one path, and the horde already beginning to wrap the wall. Whoever goes last buys the minutes the rest need.
> 
> Vega racks her rifle. Her eyes flick once to Nora clinging to your sleeve, then away. "I'm the one with the most rounds and the least family. I stay. I slow them. Get the kid out."
> 
> Maya is already at the gate, rifle braced across her forearm, pushing survivors through two at a time. She glances up at you. A short nod. Keep moving.
> 
> Ren is further up, shepherding the walking wounded, med kit over her shoulder. She catches your eye once and keeps moving.
> 
> The first of them are at the inner fence.

</details>

<details><summary>Variant: romance Maya</summary>

> The back gate is a bottleneck. Twenty survivors, one path, and the horde already beginning to wrap the wall. Whoever goes last buys the minutes the rest need.
> 
> Vega racks her rifle. "I'm the one with the most rounds and the least family. I stay. I slow them."
> 
> Maya steps up beside her. She doesn't look at you — she can't. "I can shoot. I can hold a gate. Let me do it, Ellis."
> 
> Ren is further up, shepherding the walking wounded, med kit over her shoulder. She catches your eye once and keeps moving.
> 
> The first of them are at the inner fence.

</details>

<details><summary>Variant: romance Ren</summary>

> The back gate is a bottleneck. Twenty survivors, one path, and the horde already beginning to wrap the wall. Whoever goes last buys the minutes the rest need.
> 
> Vega racks her rifle. "I'm the one with the most rounds and the least family. I stay. I slow them."
> 
> Ren's voice is quiet beside you. "There are three in the medbay who can't walk. If I stay with them, the column moves twice as fast." She isn't asking.
> 
> The first of them are at the inner fence.

</details>

**Choices:**

1. **"No. We all go. Together."**
   - _effect:_ `s => { s.flags.vegaSaved = true; if (s.bonds) s.bonds.vega = (s.bonds.vega || 0) + 1; Game.toast("Vega's trust +1"); }`
   - → `post_horde_flee`
2. **"Go, Vega. We'll see you on the road."**
   - _effect:_ `s => { s.flags.vegaStayedBehind = true; }`
   - → `post_horde_flee`
3. **"Maya. Come back to me."** _require:_ `s => (s.companion === "Maya" || s.flags.maya) && s.romance === "maya" && s.flags.lovedMaya`
   - _effect:_ `s => { s.flags.mayaSacrificed = true; s.flags.vegaSaved = true; }`
   - → `post_horde_flee`
4. **"Ren. Stay with them. I'll find you."** _require:_ `s => s.romance === "ren" && s.flags.lovedRen`
   - _effect:_ `s => { s.flags.renSacrificed = true; s.flags.vegaSaved = true; }`
   - → `post_horde_flee`

---

## <a id="post_horde_win"></a>`post_horde_win`
**Chapter:** Sunrise — After  
**Scene art:** `ending_dawn`  

<details><summary>Variant: default / with Maya companion / mission partner = maya / mission partner = ren / solo mission / rested in car / told Vega / chore: medbay / chore: perimeter / chore: kitchen / exposed traitor / killed traitor</summary>

> The horde is a still field. The fence holds. Someone is laughing through tears.
> 
> Ren is at the wall, stitching a graze on a man's scalp with steady hands. She glances up at you as you pass, nods once — you did. We did.

</details>

<details><summary>Variant: saved Nora / bring Nora on mission</summary>

> The horde is a still field. The fence holds. Someone is laughing through tears.
> 
> Ren is at the wall, stitching a graze on a man's scalp with steady hands. She glances up at you as you pass, nods once — you did. We did.
> 
> A child finds your hand.

</details>

<details><summary>Variant: romance Maya</summary>

> Maya finds you in the smoke, blood on her sleeve and most of it not hers. She presses her forehead to yours and breathes out — a long, shaking exhale. Alive. Both of you. Alive.

</details>

<details><summary>Variant: romance Ren</summary>

> Ren is already at work — bandaging, splinting, refusing to look at the bodies on the fence. When you reach her she doesn't speak. She just buries her face in your shoulder and stays there for a long time.

</details>

**Choices:**

1. **— THE END —**
   - → function targets: `ending_final_hero`, `ending_final_lovers`

---

## <a id="post_horde_lose"></a>`post_horde_lose`
**Chapter:** Sunset — A Memorial  
**Scene art:** `ending_grave`  

<details><summary>Variant: default / with Maya companion / mission partner = maya / mission partner = ren / solo mission / rested in car / told Vega / chore: medbay / chore: perimeter / chore: kitchen / exposed traitor / killed traitor</summary>

> They'll say you held the line longer than any one person should.
> 
> Ren stays with you in the medbay when the others can't. She doesn't try to fix you — she knows. She just keeps one hand on yours and hums something low, a song from before.
> 
> They'll carve your name beside the others.

</details>

<details><summary>Variant: saved Nora / bring Nora on mission</summary>

> They'll say you held the line longer than any one person should.
> 
> Ren stays with you in the medbay when the others can't. She doesn't try to fix you — she knows. She just keeps one hand on yours and hums something low, a song from before.
> 
> Nora sits on the floor at the foot of the cot. Nobody tells her to. Nobody can make her leave either.
> 
> They'll carve your name beside the others.

</details>

<details><summary>Variant: romance Maya</summary>

> Maya carries you to the back of the camp when your legs give out. She's saying something — your name, over and over. The world dims softly, like a lantern turned down.
> 
> She holds your hand until it's cold.

</details>

<details><summary>Variant: romance Ren</summary>

> Ren sings the song. The one her grandmother taught her. She sings it the whole way through, and then again, and then once more.
> 
> You hear all three.

</details>

**Choices:**

1. **— THE END —**
   - → function targets: `ending_final_fallen`, `ending_final_loverlost`

---

## <a id="post_horde_flee"></a>`post_horde_flee`
**Chapter:** Dawn — The Long Road  
**Scene art:** `ending_road`  

<details><summary>Variant: default / solo mission / rested in car / told Vega / killed traitor</summary>

> The camp burns behind you. You don't know where you're going. You know you'll keep going.
> 
> Ren threads through the column, med kit over her shoulder, bandaging blisters, catching stragglers. When she passes you she squeezes your arm once and keeps going.

</details>

<details><summary>Variant: with Maya companion / mission partner = maya / mission partner = ren / chore: medbay / chore: perimeter / chore: kitchen / exposed traitor</summary>

> The camp burns behind you. You don't know where you're going. You know you'll keep going.
> 
> Maya walks the flank, rifle low, eyes on the trees. Ren threads through the column with her med kit, bandaging blisters, catching stragglers. Neither of them has stopped moving since the gate.

</details>

<details><summary>Variant: saved Nora</summary>

> Nora's hand is sticky in yours. She doesn't ask where you're going. None of them do. They follow your light.
> 
> Ren threads through the column, med kit over her shoulder, bandaging blisters, catching stragglers. When she passes you she squeezes your arm once and keeps going.

</details>

<details><summary>Variant: bring Nora on mission</summary>

> Nora's hand is sticky in yours. She doesn't ask where you're going. None of them do. They follow your light.
> 
> Maya walks the flank, rifle low, eyes on the trees. Ren threads through the column with her med kit, bandaging blisters, catching stragglers. Neither of them has stopped moving since the gate.

</details>

<details><summary>Variant: romance Maya</summary>

> Twenty survivors follow your light through the pines. Maya walks beside you, her hand finding yours in the dark. Neither of you lets go.
> 
> Ren threads through the column, med kit over her shoulder, bandaging blisters, catching stragglers. When she passes you she squeezes your arm once and keeps going.

</details>

<details><summary>Variant: romance Ren</summary>

> Ren walks at the back, helping the slow ones. When you look over your shoulder, she looks up at you and smiles — small and certain.

</details>

**Choices:**

1. **— THE END —**
   - → function targets: `ending_final_escape`, `ending_final_lovers_road`

---

## <a id="mission_journey"></a>`mission_journey`
**Chapter:** Day 4 — South Road  
**Scene art:** fn → `mission_journey_solo` _(default, with Maya companion, solo mission, saved Nora, rested in car, told Vega, chore: medbay, chore: perimeter, chore: kitchen, exposed traitor, killed traitor, romance Maya, romance Ren)_, `mission_journey_maya` _(mission partner = maya, bring Nora on mission)_, `mission_journey_ren` _(mission partner = ren)_  

<details><summary>Variant: default / with Maya companion / solo mission / saved Nora / rested in car / told Vega / chore: medbay / chore: perimeter / chore: kitchen / exposed traitor / killed traitor / romance Maya / romance Ren</summary>

> You walk alone. Every shadow is a question. Every step is loud.
> 
> A mile in, your boot knocks a hubcap and you flinch hard enough to bruise yourself. You stop. Listen. Nothing. Just pines.
> 
> You catch yourself thinking about the camp behind you. About what you left there.

</details>

<details><summary>Variant: mission partner = maya</summary>

> Maya walks point. Three steps ahead, eyes everywhere. The pines thin into a service road.
> 
> "You ever miss anything from before?" she asks, not turning around.

</details>

<details><summary>Variant: mission partner = ren</summary>

> Ren keeps pace beside you. She hums, low — a song you almost recognise.
> 
> "My grandmother used to sing it," she says when she catches you listening. "It's the only thing of hers I have left."
> 
> The humming stops as the hospital squats into view.
> 
> "Worked Mercy's ER the first month," she says quietly, like it explains something. "If my hands shake later — that's why."
> 
> She starts humming again.

</details>

<details><summary>Variant: bring Nora on mission</summary>

> Maya walks point. Three steps ahead, eyes everywhere. The pines thin into a service road.
> 
> "You ever miss anything from before?" she asks, not turning around.
> 
> Nora walks between you, one hand in your jacket. She watches the treeline like it might blink first.

</details>

**Choices:**

1. **"I should've walked the treeline with you."** _require:_ `s => s.flags.missionPartner === "maya" && s.flags.choreChosen && s.flags.choreChosen !== "perimeter"`
   - _effect:_ `s => { s.bonds.maya += 1; Game.toast("Maya's trust +1"); }`
   - → `hospital_arrive`
2. **"Coffee. Real coffee."** _require:_ `s => s.flags.missionPartner === "maya"`
   - _effect:_ `s => { s.bonds.maya += 1; }`
   - → `hospital_arrive`
3. **"My sister. She made me feel less alone."** _require:_ `s => s.flags.missionPartner === "maya"`
   - _effect:_ `s => { s.bonds.maya += 2; Game.toast("Maya's trust +2"); }`
   - → `hospital_arrive`
4. **"Sing it for me."** _require:_ `s => s.flags.missionPartner === "ren"`
   - _effect:_ `s => { s.bonds.ren += 2; Game.toast("Ren's trust +2"); }`
   - → `hospital_arrive`
5. **Walk in companionable silence** _require:_ `s => s.flags.missionPartner === "ren"`
   - _effect:_ `s => { s.bonds.ren += 1; }`
   - → `hospital_arrive`
6. **Let yourself remember a face from before. Just for a mile.** _require:_ `s => s.flags.solo_mission`
   - _effect:_ `s => { Game.toast("You let yourself grieve. Briefly."); }`
   - → `hospital_arrive`
7. **Don't. Count your steps. Five hundred more, then stop.** _require:_ `s => s.flags.solo_mission`
   - _effect:_ `s => { s.stam = s.stamMax; Game.toast("⚡ steadied"); }`
   - → `hospital_arrive`
8. **Push on in silence.** _require:_ `s => s.flags.solo_mission`
   - → `hospital_arrive`

---

## <a id="hospital_arrive"></a>`hospital_arrive`
**Chapter:** Day 4 — Old Mercy  
**Scene art:** fn → `hospital_arrive_solo` _(default, with Maya companion, solo mission, saved Nora, rested in car, told Vega, chore: medbay, chore: perimeter, chore: kitchen, exposed traitor, killed traitor, romance Maya, romance Ren)_, `hospital_arrive_maya` _(mission partner = maya, bring Nora on mission)_, `hospital_arrive_ren` _(mission partner = ren)_  

<details><summary>Variant: default / with Maya companion / mission partner = maya / mission partner = ren / solo mission / saved Nora / rested in car / told Vega / chore: medbay / chore: perimeter / chore: kitchen / exposed traitor / killed traitor / romance Maya / romance Ren</summary>

> The hospital squats against the dusk like a wounded animal. The red cross above the door has bled brown.
> 
> Something moves inside.

</details>

<details><summary>Variant: bring Nora on mission</summary>

> The hospital squats against the dusk like a wounded animal. The red cross above the door has bled brown.
> 
> Something moves inside.
> 
> Nora's hand tightens on your sleeve. You crouch, find her eyes. "Stay behind me. Don't look at what I do. If I say run, you run all the way back to the road. Okay?"
> 
> She nods once. She doesn't let go of your sleeve.

</details>

**Choices:**

1. **Through the front. Loud and fast.**
   - → `pharmacy_combat`

---

## <a id="pharmacy_combat"></a>`pharmacy_combat`
**Chapter:** Day 4 — Pharmacy  
**Scene art:** fn → `pharmacy_combat_solo` _(default, with Maya companion, solo mission, saved Nora, rested in car, told Vega, chore: medbay, chore: perimeter, chore: kitchen, exposed traitor, killed traitor, romance Maya, romance Ren)_, `pharmacy_combat_maya` _(mission partner = maya, bring Nora on mission)_, `pharmacy_combat_ren` _(mission partner = ren)_  

<details><summary>Variant: default / with Maya companion / mission partner = maya / mission partner = ren / solo mission / saved Nora / rested in car / told Vega / chore: medbay / chore: perimeter / chore: kitchen / exposed traitor / killed traitor / romance Maya / romance Ren</summary>

> Two of them lurch out of the dark between the shelves. Pill bottles roll under your boots.

</details>

<details><summary>Variant: bring Nora on mission</summary>

> Two of them lurch out of the dark between the shelves. Pill bottles roll under your boots.
> 
> You shove Nora down behind the checkout counter and put yourself between her and the aisle.

</details>

**Choices:**

1. **Fight** `COMBAT`
   - ⚔ combat: enemy `walker_pair` → win `hospital_lobby` / lose `death`

---

## <a id="hospital_lobby"></a>`hospital_lobby`
**Chapter:** Day 4 — Lobby  
**Scene art:** fn → `hospital_lobby_solo` _(default, with Maya companion, solo mission, saved Nora, rested in car, told Vega, chore: medbay, chore: perimeter, chore: kitchen, exposed traitor, killed traitor, romance Maya, romance Ren)_, `hospital_lobby_maya` _(mission partner = maya, bring Nora on mission)_, `hospital_lobby_ren` _(mission partner = ren)_  
**Speaker:** **Maya** _(mission partner = maya, bring Nora on mission)_ / **Ren** _(mission partner = ren)_  

<details><summary>Variant: default / with Maya companion / solo mission / saved Nora / rested in car / told Vega / chore: medbay / chore: perimeter / chore: kitchen / exposed traitor / killed traitor / romance Maya / romance Ren</summary>

> You sit alone in a row of cracked plastic chairs. Stuff a backpack with what you came for. The hospital exhales around you — old breath, no life.
> 
> The vending machine flickers. A poster on the wall says HAVE YOU WASHED YOUR HANDS. Someone drew a face on it a long time ago.
> 
> You could sit another minute. Or you could go.

</details>

<details><summary>Variant: mission partner = maya</summary>

> You drop into a row of waiting chairs. Maya sits beside you — not touching, but close.
> 
> "You handle yourself. I noticed."
> 
> A streetlight, somehow still alive, hums outside. She hasn't looked away from you.

</details>

<details><summary>Variant: mission partner = ren</summary>

> Ren is shaking. She sits on the floor, back to a vending machine, knees up.
> 
> "I hate this part. After. When my hands remember."
> 
> You sit beside her. Her breath slows when you do.

</details>

<details><summary>Variant: bring Nora on mission</summary>

> You drop into a row of waiting chairs. Maya sits beside you — not touching, but close.
> 
> "You handle yourself. I noticed."
> 
> A streetlight, somehow still alive, hums outside. She hasn't looked away from you.
> 
> Nora is already out from under the counter. She crosses the lobby without being told and presses herself against your side. You feel her shaking through your jacket.

</details>

**Choices:**

1. **Lean closer. Let Maya see you see her.** _require:_ `s => s.flags.missionPartner === "maya"`
   - _effect:_ `s => { s.bonds.maya += 2; // Explicit 'I'm into you' — locks Ren's bonfire option out. s.flags.committedMaya = true; Game.toast("Maya's trust +2"); }`
   - → `mission_return`
2. **Keep it professional. Stand up.** _require:_ `s => s.flags.missionPartner === "maya"`
   - → `mission_return`
3. **Take Ren's hand. Say nothing.** _require:_ `s => s.flags.missionPartner === "ren"`
   - _effect:_ `s => { s.bonds.ren += 2; s.flags.committedRen = true; Game.toast("Ren's trust +2"); }`
   - → `mission_return`
4. **Give Ren space. Pack the bag.** _require:_ `s => s.flags.missionPartner === "ren"`
   - → `mission_return`
5. **Sit the extra minute. You've earned it.** _require:_ `s => s.flags.solo_mission`
   - _effect:_ `s => { s.hp = s.hpMax; s.stam = s.stamMax; Game.toast("❤️ ⚡ restored"); }`
   - → `mission_return`
6. **Pack and go. Don't make yourself a target.** _require:_ `s => s.flags.solo_mission`
   - → `mission_return`

---

## <a id="mission_return"></a>`mission_return`
**Chapter:** Day 4 — Camp, dusk  
**Scene art:** `greenbelt_camp`  

<details><summary>Variant: default / with Maya companion / solo mission / saved Nora / rested in car / told Vega / chore: medbay / chore: perimeter / chore: kitchen / exposed traitor / killed traitor / romance Maya / romance Ren</summary>

> You hand the meds to Ren — who beams, just for a second.
> 
> On your way back you notice something at the south fence: a chain link, cleanly cut. Not zombies. Hands.

</details>

<details><summary>Variant: mission partner = maya</summary>

> Maya lets you carry the med bag the last hundred yards. You hand it to Ren at the aid tent — who beams, just for a second — and Maya peels off to dump her rifle on her cot.
> 
> On your way back you notice something at the south fence: a chain link, cleanly cut. Not zombies. Hands.

</details>

<details><summary>Variant: mission partner = ren</summary>

> Ren drops the med bag on the aid-tent table and is already sorting bottles by label before she's even shrugged her jacket off. She catches your eye, exhales once — that was close — then goes back to work.
> 
> On your way out of the tent you notice something at the south fence: a chain link, cleanly cut. Not zombies. Hands.

</details>

<details><summary>Variant: bring Nora on mission</summary>

> Maya lets you carry the med bag the last hundred yards. You hand it to Ren at the aid tent — who beams, just for a second — and Maya peels off to dump her rifle on her cot.
> 
> Nora doesn't let go of your jacket until you've both sat down on the cot. Then she does — slow, like she had to think about it.
> 
> On your way back you notice something at the south fence: a chain link, cleanly cut. Not zombies. Hands.

</details>

**Choices:**

1. **Investigate the cut fence** `CLUE`
   - _effect:_ `s => { // Sneaking out alone. Nobody's with you at the fence. delete s.flags.missionPartner; delete s.flags.solo_mission; delete s.flags.bringNora; }`
   - → `investigate_traitor`
2. **Mention it to Vega in the morning. Get warm by the fire.**
   - _effect:_ `s => { // Back at camp — the mission is over, companion rules apply again. delete s.flags.missionPartner; delete s.flags.solo_mission; delete s.flags.bringNora; }`
   - → `bonfire_invite`

---

## <a id="investigate_traitor"></a>`investigate_traitor`
**Chapter:** Day 4 — South Fence  
**Scene art:** `gate_ajar_night`  

<details><summary>Variant: default / mission partner = maya / mission partner = ren / solo mission / saved Nora / bring Nora on mission / rested in car / told Vega / chore: medbay / chore: perimeter / chore: kitchen / exposed traitor / killed traitor / romance Ren</summary>

> Bolt cutters in the brush. Fresh boot prints. Whoever did this is in the camp — and they're coming back.

</details>

<details><summary>Variant: with Maya companion / romance Maya</summary>

> Bolt cutters in the brush. Fresh boot prints. Whoever did this is in the camp — and they're coming back.
> 
> Maya is already there, rifle low, crouched beside you. She must have heard you slip out.
> 
> "Can't say I'm surprised," she murmurs. "What's the plan?"

</details>

**Choices:**

1. **Lie in wait** `RISKY`
   - → `confront_traitor`
2. **Tell Vega and bring the cavalry**
   - _effect:_ `s => { s.flags.toldVega = true; s.bonds.vega = (s.bonds.vega || 0) + 1; Game.toast("Vega's trust +1"); }`
   - → `confront_traitor`

---

## <a id="confront_traitor"></a>`confront_traitor`
**Chapter:** Day 4 — South Fence  
**Scene art:** fn → `confront_traitor` _(default, with Maya companion, mission partner = maya, mission partner = ren, solo mission, saved Nora, bring Nora on mission, rested in car, chore: medbay, chore: perimeter, chore: kitchen, exposed traitor, killed traitor, romance Maya, romance Ren)_, `confront_traitor_vega` _(told Vega)_  
**Speaker:** ???  

<details><summary>Variant: default / mission partner = maya / mission partner = ren / solo mission / saved Nora / bring Nora on mission / rested in car / chore: medbay / chore: perimeter / chore: kitchen / exposed traitor / killed traitor / romance Ren</summary>

> He freezes when he sees you. A trader from two tents over — Calder. Sleeve pushed up. The bite mark on his forearm is fresh and black.
> 
> "Please. They said if I let them in, they'd let me live. I have a d—"
> 
> His throat spasms. His eyes fog. The bite has already won.

</details>

<details><summary>Variant: with Maya companion / romance Maya</summary>

> You and Maya wait in the brush, motionless. He doesn't see her until after he sees you.
> 
> A trader from two tents over — Calder. Sleeve pushed up. The bite mark on his forearm is fresh and black.
> 
> "Please. They said if I let them in, they'd let me live. I have a d—"
> 
> His throat spasms. His eyes fog. The bite has already won.

</details>

<details><summary>Variant: told Vega</summary>

> Vega moves like she's done this before — rifle shouldered, blinding flashlight cutting the dust at your back. The man crouched at the cut fence spins. A trader from two tents over — Calder. Sleeve pushed up. The bite mark on his forearm is fresh and black.
> 
> "Please. They said if I let them in, they'd let me live. I have a d—"
> 
> His throat spasms. His eyes fog. The bite has already won — and you're between him and Vega's rifle.

</details>

**Choices:**

1. **He lunges. Put him down.** `BOSS`
   - ⚔ combat _(default, with Maya companion, mission partner = maya, mission partner = ren, solo mission, saved Nora, bring Nora on mission, rested in car, chore: medbay, chore: perimeter, chore: kitchen, exposed traitor, killed traitor, romance Maya, romance Ren)_: enemy `traitor` · risky → win `traitor_aftermath` / lose `death`
   - ⚔ combat _(told Vega)_: enemy `traitor` → win `traitor_aftermath` / lose `death`

---

## <a id="traitor_aftermath"></a>`traitor_aftermath`
**Chapter:** Day 4 — South Fence  
**Scene art:** fn → `traitor_aftermath` _(default, with Maya companion, mission partner = maya, mission partner = ren, solo mission, saved Nora, bring Nora on mission, rested in car, chore: medbay, chore: perimeter, chore: kitchen, exposed traitor, killed traitor, romance Maya, romance Ren)_, `traitor_aftermath_vega` _(told Vega)_  

<details><summary>Variant: default / mission partner = maya / mission partner = ren / solo mission / saved Nora / bring Nora on mission / rested in car / chore: medbay / chore: perimeter / chore: kitchen / exposed traitor / killed traitor / romance Ren</summary>

> It's over. He's smaller now. Calder again, almost.
> 
> You stand in the dark with the weight of it — and the choice still yours.

</details>

<details><summary>Variant: with Maya companion / romance Maya</summary>

> It's over. He's smaller now. Calder again, almost.
> 
> Maya lowers her rifle slow. "You okay?" she asks without taking her eyes off the body.
> 
> "No."
> 
> "Neither am I. Choice still yours, though."

</details>

<details><summary>Variant: told Vega</summary>

> It's over. He's smaller now. Calder again, almost.
> 
> Vega lowers her rifle and spits into the grass. "Whole camp hears about this before sunrise," she says, already turning toward the bell.
> 
> Ren is already at the fence by the time the bell starts. She catches your eye once — gratitude, quick as a blink — then kneels beside the body with a clean sheet.

</details>

**Choices:**

1. **Bury him quietly. The camp will not know.** `HARD` _require:_ `s => !s.flags.toldVega`
   - _effect:_ `s => { s.flags.killedTraitor = true; // Maya is ex-military — burying this instead of reporting // reads as a command failure to her. Costs her real trust. if (s.flags.maya && s.bonds) { s.bonds.maya = Math.max(0, (s.bonds.maya || 0) - 2); Game.toast("The camp will not know · Maya's trust -2"); } else { Game.toast("The camp will not know."); } }`
   - → `bonfire_invite`
2. **Tell Vega. They deserve the truth.** _require:_ `s => !s.flags.toldVega`
   - _effect:_ `s => { s.flags.exposedTraitor = true; // Vega opens the armory; camp reinforces the fence overnight. s.ammo += 2; Game.giveRandomItem(); if (s.bonds) { s.bonds.ren = (s.bonds.ren || 0) + 1; s.bonds.vega = (s.bonds.vega || 0) + 1; // Maya helped put him down. She approves of you owning it. if (s.companion === "Maya") s.bonds.maya = (s.bonds.maya || 0) + 1; } Game.toast(s.companion === "Maya" ? "+2 🔫 · Ren's trust +1 · Vega's trust +1 · Maya's trust +1" : "+2 🔫 · Ren's trust +1 · Vega's trust +1"); }`
   - → function targets: `bonfire_invite`
3. **Help Vega rouse the camp. Reinforce the fence tonight.** _require:_ `s => s.flags.toldVega`
   - _effect:_ `s => { s.flags.exposedTraitor = true; s.ammo += 2; Game.giveRandomItem(); if (s.bonds) { s.bonds.ren = (s.bonds.ren || 0) + 1; s.bonds.vega = (s.bonds.vega || 0) + 1; if (s.companion === "Maya") s.bonds.maya = (s.bonds.maya || 0) + 1; } Game.toast(s.companion === "Maya" ? "+2 🔫 · Ren's trust +1 · Vega's trust +1 · Maya's trust +1" : "+2 🔫 · Ren's trust +1 · Vega's trust +1"); }`
   - → function targets: `bonfire_invite`

---

## <a id="vega_gift"></a>`vega_gift`
**Chapter:** Day 4 — Armory, after  
**Scene art:** (no explicit scene — uses node id)  
**Speaker:** Captain Vega  

> Vega finds you outside the medbay. She wasn't looking for you. She's holding her own rifle — not the camp spares, hers — in one hand, already carrying a spare in the other.
> 
> "You didn't have to tell me about Calder. You did it anyway."
> 
> She presses the rifle into your hands. Walnut stock. Small scope. Feels older than it is.
> 
> "This was my father's. Feeds you when you feed it. Keep it on you tomorrow."
> 
> She's already walking away when you try to thank her.

**Choices:**

1. **Sling it. Turn toward the fire.**
   - _effect:_ `s => { equipVegaRifleOnce(s); }`
   - → `bonfire_invite`

---

## <a id="bonfire_invite"></a>`bonfire_invite`
**Chapter:** Day 4 — Bonfire  
**Scene art:** `bonfire_night`  

<details><summary>Variant: default / with Maya companion / mission partner = maya / mission partner = ren / solo mission / saved Nora / bring Nora on mission / rested in car / told Vega / chore: medbay / chore: perimeter / chore: kitchen / killed traitor</summary>

> The fire burns low. Most of the camp has turned in.
> 
> You sit alone with the dying flames.

</details>

<details><summary>Variant: exposed traitor</summary>

> The fire burns low. Most of the camp has turned in.
> 
> Ren is across the fire. When your eyes meet she gives you a small, grave nod. She knows.
> 
> You sit alone with the dying flames.

</details>

<details><summary>Variant: romance Maya</summary>

> The fire burns low. Most of the camp has turned in.
> 
> Maya catches your eye and tilts her head — toward her tent.

</details>

<details><summary>Variant: romance Ren</summary>

> The fire burns low. Most of the camp has turned in.
> 
> Ren leaves her guitar against the log when she stands. She waits, looking at you.

</details>

**Choices:**

1. **Follow Maya** `ROMANCE` _require:_ `s => s.flags.maya && s.bonds.maya >= 5 && !s.flags.committedRen && !(s.bonds.ren >= 4 && !s.flags.committedMaya)`
   - _effect:_ `s => { s.romance = "maya"; }`
   - → `romance_maya`
2. **Follow Ren** `ROMANCE` _require:_ `s => s.bonds.ren >= 4 && !s.flags.committedMaya && !(s.flags.maya && s.bonds.maya >= 5 && !s.flags.committedRen)`
   - _effect:_ `s => { s.romance = "ren"; }`
   - → `romance_ren`
3. **Walk to the fire's edge. Meet them.** `ROMANCE` _require:_ `s => s.flags.maya && s.bonds.maya >= 5 && !s.flags.committedRen && s.bonds.ren >= 4 && !s.flags.committedMaya`
   - → `bonfire_crossroads`
4. **Sit with the fire. Sleep alone.**
   - _effect:_ `s => { s.hp = s.hpMax; s.stam = s.stamMax; Game.toast("Rested"); }`
   - → `horde_warning`

---

## <a id="bonfire_crossroads"></a>`bonfire_crossroads`
**Chapter:** Day 4 — Bonfire, at the edge  
**Scene art:** `bonfire_crossroads`  

> You stand between them at the fire's edge. Close enough that you can hear each of them breathing.
> 
> Maya, arms folded, her jaw set the way it gets when she's not going to ask twice. Her eyes are steady. You know that look — it's the one she gives before she moves.
> 
> Ren, hands in her jacket pockets, weight on her heels, not sure where to put her hands. She's smiling, a little, at nothing. She does that when she's trying not to care about the answer.
> 
> Neither of them speaks. Neither of them looks at the other.
> 
> They're waiting.

**Choices:**

1. **Take Maya's hand.** `ROMANCE`
   - _effect:_ `s => { s.romance = "maya"; s.flags.committedMaya = true; s.flags.rejectedRen = true; }`
   - → `romance_maya`
2. **Take Ren's hand.** `ROMANCE`
   - _effect:_ `s => { s.romance = "ren"; s.flags.committedRen = true; s.flags.rejectedMaya = true; }`
   - → `romance_ren`
3. **"Not tonight. Not like this."**
   - _effect:_ `s => { s.hp = s.hpMax; s.stam = s.stamMax; // Neither rejected — you didn't pick, you stepped back. Both // notice; neither is owed anything. Game.toast("Rested"); }`
   - → `horde_warning`

---

## <a id="romance_maya"></a>`romance_maya`
**Chapter:** Day 4 — Maya's tent  
**Scene art:** `intimate_bedroom`  
**Speaker:** Maya  

<details><summary>Variant: default / with Maya companion / mission partner = maya / mission partner = ren / solo mission / rested in car / told Vega / chore: medbay / chore: perimeter / chore: kitchen / exposed traitor / killed traitor / romance Maya / romance Ren</summary>

> Inside, she stops you with a hand on your chest. Not pushing. Just feeling.
> 
> "I'm not — I don't do soft. Not anymore. But I want this." Her voice is rougher than you've heard it. "Tell me you do too."
> 
> You tell her.
> 
> She pulls you in, and the rest of the world goes quiet — the camp, the fence, the dead in the dark. Just her hands, your mouth, the small breath she lets out when you find the place at her throat where the muscle softens.
> 
> *Later, the lantern out, her head on your shoulder.*

</details>

<details><summary>Variant: saved Nora / bring Nora on mission</summary>

> Inside, she stops you with a hand on your chest. Not pushing. Just feeling.
> 
> "I'm not — I don't do soft. Not anymore. But I want this." Her voice is rougher than you've heard it. "Tell me you do too."
> 
> You tell her.
> 
> (Nora is two tents over, asleep against Ren's shoulder — they've been inseparable since you got back. You checked, twice, before coming here.)
> 
> She pulls you in, and the rest of the world goes quiet — the camp, the fence, the dead in the dark. Just her hands, your mouth, the small breath she lets out when you find the place at her throat where the muscle softens.
> 
> *Later, the lantern out, her head on your shoulder.*

</details>

**Choices:**

1. **"Don't disappear in the morning."**
   - _effect:_ `s => { s.bonds.maya += 3; s.flags.lovedMaya = true; }`
   - → `morning_after_maya`
2. **Kiss Maya's temple. Let her sleep.**
   - _effect:_ `s => { s.bonds.maya += 2; s.flags.lovedMaya = true; }`
   - → `morning_after_maya`

---

## <a id="romance_ren"></a>`romance_ren`
**Chapter:** Day 4 — Ren's medbay  
**Scene art:** `intimate_bedroom`  
**Speaker:** Ren  

<details><summary>Variant: default / with Maya companion / mission partner = maya / mission partner = ren / solo mission / rested in car / told Vega / chore: medbay / chore: perimeter / chore: kitchen / exposed traitor / killed traitor / romance Maya / romance Ren</summary>

> She lights a single candle. Her hands shake — not from fear. From wanting.
> 
> "I haven't — since. I wasn't sure I still could." A small, embarrassed laugh. "Be patient with me."
> 
> You take her hand and lay it flat against your chest, over your heart. Let her feel it.
> 
> What happens next is slow. Slow as snow. Her mouth on yours, your fingers in her hair, both of you learning how to be this human again. After, she cries a little. She laughs through it. She thanks you, which breaks something in you in a good way.
> 
> *The candle gutters. Her breathing evens out against your ribs.*

</details>

<details><summary>Variant: saved Nora / bring Nora on mission</summary>

> She lights a single candle. Her hands shake — not from fear. From wanting.
> 
> "She's with Captain Vega tonight," Ren says quietly, without having to name who. "I asked. Vega said of course."
> 
> "I haven't — since. I wasn't sure I still could." A small, embarrassed laugh. "Be patient with me."
> 
> You take her hand and lay it flat against your chest, over your heart. Let her feel it.
> 
> What happens next is slow. Slow as snow. Her mouth on yours, your fingers in her hair, both of you learning how to be this human again. After, she cries a little. She laughs through it. She thanks you, which breaks something in you in a good way.
> 
> *The candle gutters. Her breathing evens out against your ribs.*

</details>

**Choices:**

1. **"I've got you."**
   - _effect:_ `s => { s.bonds.ren += 3; s.flags.lovedRen = true; }`
   - → `morning_after_ren`
2. **Hold Ren till the candle dies**
   - _effect:_ `s => { s.bonds.ren += 2; s.flags.lovedRen = true; }`
   - → `morning_after_ren`

---

## <a id="morning_after_maya"></a>`morning_after_maya`
**Chapter:** Day 5 — Pre-dawn  
**Scene art:** `greenbelt_morning`  
**Speaker:** Maya  

<details><summary>Variant: default / with Maya companion / mission partner = maya / mission partner = ren / solo mission / rested in car / told Vega / chore: medbay / chore: perimeter / chore: kitchen / exposed traitor / killed traitor / romance Maya / romance Ren</summary>

> She's already dressed when you wake. Rifle slung. She kisses the corner of your mouth like it's the most natural thing in the world.
> 
> "Whatever happens today," she says, "I'm glad I met you in that stairwell."
> 
> The siren starts.

</details>

<details><summary>Variant: saved Nora / bring Nora on mission</summary>

> She's already dressed when you wake. Rifle slung. She kisses the corner of your mouth like it's the most natural thing in the world.
> 
> "Whatever happens today," she says, "I'm glad I met you in that stairwell."
> 
> Outside, Nora is perched on an ammo crate eating dry cereal from a mug. She doesn't ask where you spent the night. Kids know things.
> 
> The siren starts.

</details>

**Choices:**

1. **"Together."**
   - → `horde_warning`

---

## <a id="morning_after_ren"></a>`morning_after_ren`
**Chapter:** Day 5 — Pre-dawn  
**Scene art:** `greenbelt_morning`  
**Speaker:** Ren  

<details><summary>Variant: default / with Maya companion / mission partner = maya / mission partner = ren / solo mission / rested in car / told Vega / chore: medbay / chore: perimeter / chore: kitchen / exposed traitor / killed traitor / romance Maya / romance Ren</summary>

> She wakes you with coffee. Her hair is doing something unholy. She looks at you like you're a small impossible thing.
> 
> "Don't die today," she says. "I just got you."
> 
> The siren starts.

</details>

<details><summary>Variant: saved Nora / bring Nora on mission</summary>

> She wakes you with coffee. Her hair is doing something unholy. She looks at you like you're a small impossible thing.
> 
> "Don't die today," she says. "I just got you."
> 
> There's a small paper crown on the rolling tray beside the cot. Crayon on a pill-label leaflet. Nora must have left it sometime before dawn. Neither of you put it on, but Ren touches one of the points with her thumb and smiles.
> 
> The siren starts.

</details>

**Choices:**

1. **"You either."**
   - → `horde_warning`

---

## <a id="ending_final_hero"></a>`ending_final_hero`
**Chapter:** Ending A — Defender  
**Scene art:** `ending_dawn`  

> You chose to stand. You chose to matter.
> 
> Thanks for playing Dead Light.

**Choices:**

1. **Back to title**
   - → `__title__`

---

## <a id="ending_final_fallen"></a>`ending_final_fallen`
**Chapter:** Ending B — Martyr  
**Scene art:** `ending_grave`  

> You gave everything. They remember.
> 
> Thanks for playing Dead Light.

**Choices:**

1. **Back to title**
   - → `__title__`

---

## <a id="ending_final_escape"></a>`ending_final_escape`
**Chapter:** Ending C — Survivor  
**Scene art:** `ending_road`  

> You chose to keep walking. For yourself. For them.
> 
> Thanks for playing Dead Light.

**Choices:**

1. **Back to title**
   - → `__title__`

---

## <a id="ending_final_lovers"></a>`ending_final_lovers`
**Chapter:** Ending D — Lovers, Saved  
**Scene art:** fn → `ending_final_lovers` _(default, with Maya companion, mission partner = maya, mission partner = ren, solo mission, saved Nora, bring Nora on mission, rested in car, told Vega, chore: medbay, chore: perimeter, chore: kitchen, exposed traitor, killed traitor)_, `ending_final_lovers_maya` _(romance Maya)_, `ending_final_lovers_ren` _(romance Ren)_  

> You held the wall. You found someone worth holding the wall for.
> 
> Thanks for playing Dead Light.

**Choices:**

1. **Back to title**
   - → `__title__`

---

## <a id="ending_final_loverlost"></a>`ending_final_loverlost`
**Chapter:** Ending E — Lover Lost  
**Scene art:** fn → `ending_final_loverlost` _(default, with Maya companion, mission partner = maya, mission partner = ren, solo mission, saved Nora, bring Nora on mission, rested in car, told Vega, chore: medbay, chore: perimeter, chore: kitchen, exposed traitor, killed traitor)_, `ending_final_loverlost_maya` _(romance Maya)_, `ending_final_loverlost_ren` _(romance Ren)_  

> You loved them. You lost them. You loved them anyway.
> 
> Thanks for playing Dead Light.

**Choices:**

1. **Back to title**
   - → `__title__`

---

## <a id="ending_final_lovers_road"></a>`ending_final_lovers_road`
**Chapter:** Ending F — Lovers, Walking  
**Scene art:** fn → `ending_final_lovers_road` _(default, with Maya companion, mission partner = maya, mission partner = ren, solo mission, saved Nora, bring Nora on mission, rested in car, told Vega, chore: medbay, chore: perimeter, chore: kitchen, exposed traitor, killed traitor)_, `ending_final_lovers_road_maya` _(romance Maya)_, `ending_final_lovers_road_ren` _(romance Ren)_  

> Twenty people. One light. One hand in yours.
> 
> Thanks for playing Dead Light.

**Choices:**

1. **Back to title**
   - → `__title__`

---

## <a id="ending_final_vega_fell"></a>`ending_final_vega_fell`
**Chapter:** Ending G — Captain Held  
**Scene art:** `ending_final_vega_fell`  

<details><summary>Variant: default / with Maya companion / mission partner = maya / mission partner = ren / solo mission / rested in car / told Vega / chore: medbay / chore: perimeter / chore: kitchen / exposed traitor / killed traitor / romance Maya / romance Ren</summary>

> She held the gate. She held it long enough.
> 
> Thanks for playing Dead Light.

</details>

<details><summary>Variant: saved Nora / bring Nora on mission</summary>

> She held the gate. Long enough for a kid to see another dawn.
> 
> Thanks for playing Dead Light.

</details>

**Choices:**

1. **Back to title**
   - → `__title__`

---

## <a id="ending_final_maya_fell"></a>`ending_final_maya_fell`
**Chapter:** Ending H — She Stayed  
**Scene art:** `ending_final_maya_fell`  

> She stayed so you could walk. You keep walking.
> 
> Thanks for playing Dead Light.

**Choices:**

1. **Back to title**
   - → `__title__`

---

## <a id="ending_final_ren_fell"></a>`ending_final_ren_fell`
**Chapter:** Ending I — The Medbay Door  
**Scene art:** `ending_final_ren_fell`  

> She stayed with the ones who couldn't walk. You carry her song with you.
> 
> Thanks for playing Dead Light.

**Choices:**

1. **Back to title**
   - → `__title__`

---

## <a id="death"></a>`death`
**Chapter:** You Died  
**Scene art:** (no explicit scene — uses node id)  

> The world goes quiet. The last thing you see is the light fading behind the trees.
> 
> The dead don't forgive.

**Choices:**

1. **Try again**
   - → `__restart__`
2. **Back to title**
   - → `__title__`

---
