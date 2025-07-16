// -- Age of Empires IV (AoE4) -- //

/**
 * Get the main HTML content of the resource line (excluding timing) for AoE4.
 *
 * @param {int} currentStep  Requested step for the BO resource line.
 *
 * @returns HTML code corresponding to the requested line.
 */
function getResourceLineAoE4(currentStep) {
  let htmlString = '';

  // Folders with requested pictures
  const gamePicturesFolder = 'assets/' + gameName + '/';
  const resourceFolder = gamePicturesFolder + 'resource/';

  const resources = currentStep.resources;

  htmlString += getBOImageValue(resourceFolder + 'resource_food.webp', resources, 'food');
  htmlString += getBOImageValue(resourceFolder + 'resource_wood.webp', resources, 'wood');
  htmlString += getBOImageValue(resourceFolder + 'resource_gold.webp', resources, 'gold');
  htmlString += getBOImageValue(resourceFolder + 'resource_stone.webp', resources, 'stone');
  htmlString += getBOImageValue(resourceFolder + 'repair.webp', resources, 'builder', true);
  htmlString += getBOImageValue(
      gamePicturesFolder + 'unit_worker/villager.webp', currentStep, 'villager_count', true);
  htmlString += getBOImageValue(
      gamePicturesFolder + 'building_economy/house.webp', currentStep, 'population_count', true);

  // Age image
  const ageImage = {1: 'age_1.webp', 2: 'age_2.webp', 3: 'age_3.webp', 4: 'age_4.webp'};

  if (currentStep.age in ageImage) {
    htmlString += getBOImageHTML(gamePicturesFolder + 'age/' + ageImage[currentStep.age]);
  }

  return htmlString;
}

/**
 * Check if the build order is valid, for AoE4.
 *
 * @param {boolean} nameBOMessage  true to add the BO name in the error message.
 *
 * @returns Array of size 2:
 *              0: true if valid build order, false otherwise.
 *              1: String indicating the error (empty if no error).
 */
function checkValidBuildOrderAoE4(nameBOMessage) {
  let BONameStr = '';

  try {
    if (nameBOMessage) {
      BONameStr = dataBO['name'] + ' | ';
    }

    // Check correct civilization
    const validFactionRes = checkValidFaction(BONameStr, 'civilization', true);
    if (!validFactionRes[0]) {
      return validFactionRes;
    }

    fields = [
      new FieldDefinition('population_count', 'integer', true),
      new FieldDefinition('villager_count', 'integer', true),
      new FieldDefinition('age', 'integer', true, null, [-Infinity, 4]),
      new FieldDefinition('food', 'integer', true, 'resources'),
      new FieldDefinition('wood', 'integer', true, 'resources'),
      new FieldDefinition('gold', 'integer', true, 'resources'),
      new FieldDefinition('stone', 'integer', true, 'resources'),
      new FieldDefinition('builder', 'integer', false, 'resources'),
      new FieldDefinition('notes', 'array of strings', true),
      new FieldDefinition('time', 'string', false)
    ];

    return checkValidSteps(BONameStr, fields);

  } catch (e) {
    return invalidMsg(BONameStr + e);
  }
}

/**
 * Get one step of the AoE4 build order (template).
 *
 * @param {Array} buildOrderData  Array with the build order step, null for default values.
 * @param {int} copyStepID       ID of the step to copy, -1 for last step.
 *
 * @returns Dictionary with the build order step template.
 */
function getBOStepAoE4(buildOrderData, copyStepID = -1) {
  if (buildOrderData && buildOrderData.length >= 1) {
    // Selected step or last step data (if not valid index)
    const data = (0 <= copyStepID && copyStepID < buildOrderData.length) ?
        buildOrderData[copyStepID] :
        buildOrderData.at(-1);
    return {
      'population_count': ('population_count' in data) ? data['population_count'] : -1,
      'villager_count': ('villager_count' in data) ? data['villager_count'] : 0,
      'age': ('age' in data) ? data['age'] : 1,
      'resources': ('resources' in data) ? data['resources'] :
                                           {'food': 0, 'wood': 0, 'gold': 0, 'stone': 0},
      'notes': ['Note']
    };
  } else {
    return {
      'population_count': -1,
      'villager_count': 0,
      'age': 1,
      'resources': {'food': 0, 'wood': 0, 'gold': 0, 'stone': 0},
      'notes': ['Note']
    };
  }
}

/**
 * Get the AoE4 build order template (reset build order).
 *
 * @returns Dictionary with the build order template.
 */
function getBOTemplateAoE4() {
  return {
    'civilization': 'Abbasid Dynasty',
    'name': 'Build order name',
    'author': 'Author',
    'source': 'Source',
    'build_order': [getBOStepAoE4(null)]
  };
}

/**
 * Update the initially computed time based on the town center work rate, for AoE4.
 *
 * @param {float} initialTime         Initially computed time.
 * @param {Object} civilizationFlags  Dictionary with the civilization flags.
 * @param {int} currentAge            Current age (1: Dark Age, 2: Feudal...).
 *
 * @returns Updated time based on town center work rate.
 */
function updateTownCenterTimeAoE4(initialTime, civilizationFlags, currentAge) {
  if (civilizationFlags['French']) {
    return initialTime / (1.0 + 0.05 * (currentAge + 1));  // 10%/15%/20%/25% faster
  } else {
    return initialTime;
  }
}

/**
 * Get the villager creation time, for AoE4.
 *
 * @param {Object} civilizationFlags  Dictionary with the civilization flags.
 * @param {int} currentAge            Current age (1: Dark Age, 2: Feudal...).
 *
 * @returns Villager creation time [sec].
 */
function getVillagerTimeAoE4(civilizationFlags, currentAge) {
  if (civilizationFlags['Dragon']) {
    return 23.0;
  } else {  // generic
    console.assert(1 <= currentAge && currentAge <= 4, 'Age expected in [1;4].');
    return updateTownCenterTimeAoE4(20.0, civilizationFlags, currentAge);
  }
}

/**
 * Get the training time for a non-villager unit or the research time for a
 * technology (from Town Center), for AoE4.
 *
 * @param {string} name               Name of the requested unit/technology.
 * @param {Object} civilizationFlags  Dictionary with the civilization flags.
 * @param {int} currentAge            Current age (1: Dark Age, 2: Feudal...).
 *
 * @returns Requested research time [sec].
 */
function getTownCenterUnitResearchTimeAoE4(name, civilizationFlags, currentAge) {
  console.assert(1 <= currentAge && currentAge <= 4, 'Age expected in [1;4].');
  if (name === 'textiles') {
    if (civilizationFlags['Delhi']) {
      return 25.0;
    } else {
      return update_town_center_time(20.0, civilizationFlags, currentAge);
    }
  } else if (name === 'imperial official') {
    // Only for Chinese in Dark Age (assuming Chinese Imperial Academy in Feudal
    // and starting with 1 for Zhu Xi).
    if (civilizationFlags['Chinese'] && (currentAge === 1)) {
      return 20.0;
    } else {
      return 0.0;
    }
  } else {
    console.log('Warning: unknown TC unit/technology name: ' + name);
    return 0.0;
  }
}

/**
 * Evaluate the time indications for an AoE4 build order.
 *
 * @param {int} timeOffset  Offset to add on the time outputs [sec].
 */
function evaluateBOTimingAoE4(timeOffset) {
  // Specific civilization flags
  civilizationFlags = {
    'Abbasid': checkOnlyCivilizationAoE('Abbasid Dynasty'),
    'Chinese': checkOnlyCivilizationAoE('Chinese'),
    'Delhi': checkOnlyCivilizationAoE('Delhi Sultanate'),
    'French': checkOnlyCivilizationAoE('French'),
    'HRE': checkOnlyCivilizationAoE('Holy Roman Empire'),
    'Jeanne': checkOnlyCivilizationAoE('Jeanne d\'Arc'),
    'Malians': checkOnlyCivilizationAoE('Malians'),
    'Dragon': checkOnlyCivilizationAoE('Order of the Dragon'),
    'Rus': checkOnlyCivilizationAoE('Rus'),
    'Zhu Xi': checkOnlyCivilizationAoE('Zhu Xi\'s Legacy')
  };

  // Starting villagers
  let lastVillagerCount = 6;
  if (civilizationFlags['Dragon'] || civilizationFlags['Zhu Xi']) {
    lastVillagerCount = 5;
  }

  let currentAge = 1;  // current age (1: Dark Age, 2: Feudal Age...)

  // TC technologies or special units
  const TCUnitTechnologies = {
    'textiles': 'technology_economy/textiles.webp',
    'imperial official': 'unit_chinese/imperial-official.webp'
    // The following technologies/units are not analyzed:
    //     * Banco Repairs (Malians) is usually researched after 2nd TC.
    //     * Prelate only for HRE before Castle Age, but already starting with 1
    //     prelate.
    //     * Civilizations are usually only using the starting scout, except Rus
    //     (but from Hunting Cabin).
  };

  let lastTimeSec = timeOffset;  // time of the last step

  if (!('build_order' in dataBO)) {
    console.log(
        'Warning: the \'build_order\' field is missing from data when evaluating the timing.')
    return;
  }

  let buildOrderData = dataBO['build_order'];
  const stepCount = buildOrderData.length;

  let jeanneMilitaryFlag = false;  // true when Jeanne becomes a military unit

  // Loop on all the build order steps
  for (const [currentStepID, currentStep] of enumerate(buildOrderData)) {
    let stepTotalTime = 0.0;  // total time for this step

    // villager count
    let villagerCount = currentStep['villager_count'];
    if (villagerCount < 0) {
      const resources = currentStep['resources'];
      villagerCount = Math.max(0, resources['wood']) + Math.max(0, resources['food']) +
          Math.max(0, resources['gold']) + Math.max(0, resources['stone']);
      if ('builder' in resources) {
        villagerCount += Math.max(0, resources['builder']);
      }
    }

    villagerCount = Math.max(lastVillagerCount, villagerCount);
    const updateVillagerCount = villagerCount - lastVillagerCount;
    lastVillagerCount = villagerCount;

    stepTotalTime += updateVillagerCount * getVillagerTimeAoE4(civilizationFlags, currentAge);

    // next age
    const nextAge =
        (1 <= currentStep['age'] && currentStep['age'] <= 4) ? currentStep['age'] : currentAge;

    // Jeanne becomes a soldier in Feudal
    if (civilizationFlags['Jeanne'] && !jeanneMilitaryFlag && (nextAge > 1)) {
      stepTotalTime +=
          get_villager_time(civilizationFlags, currentAge);  // one extra villager to create
      jeanneMilitaryFlag = true;
    }

    // Check for TC technologies or special units in notes
    for (note of currentStep['notes']) {
      for (const [tcItemName, tcItemImage] of Object.entries(TCUnitTechnologies)) {
        if (note.includes('@' + tcItemImage + '@')) {
          stepTotalTime +=
              getTownCenterUnitResearchTimeAoE4(tcItemName, civilizationFlags, currentAge);
        }
      }
    }

    // Update time
    lastTimeSec += stepTotalTime;

    currentAge = nextAge;  // current age update

    // Update build order with time
    currentStep['time'] = buildOrderTimeToStr(Math.round(lastTimeSec));

    // Special case for last step
    // (add 1 sec to avoid displaying both at the same time).
    if ((currentStepID === stepCount - 1) && (stepCount >= 2) &&
        (currentStep['time'] === buildOrderData[currentStepID - 1]['time'])) {
      currentStep['time'] = buildOrderTimeToStr(Math.round(lastTimeSec + 1.0));
    }
  }
}

/**
 * Get the images available for AoE4, sorted by sub-folder.
 *
 * @returns Dictionary with all the images per sub-folder.
 */
function getImagesAoE4() {
  // This is obtained using the 'python/utilities/list_images.py' script.
  let imagesDict = {
    'age':
        'age_unknown.png#age_1.webp#age_2.webp#age_3.webp#age_4.webp#goldenagetier1.webp#goldenagetier2.webp#goldenagetier3.webp#goldenagetier4.webp#goldenagetier5.webp#vizier_point.webp',
    'civilization_flag':
        'CivIcon-AbbasidAoE4.png#CivIcon-AbbasidAoE4_spacing.png#CivIcon-AyyubidsAoE4.png#CivIcon-AyyubidsAoE4_spacing.png#CivIcon-ByzantinesAoE4.png#CivIcon-ByzantinesAoE4_spacing.png#CivIcon-ChineseAoE4.png#CivIcon-ChineseAoE4_spacing.png#CivIcon-DelhiAoE4.png#CivIcon-DelhiAoE4_spacing.png#CivIcon-EnglishAoE4.png#CivIcon-EnglishAoE4_spacing.png#CivIcon-FrenchAoE4.png#CivIcon-FrenchAoE4_spacing.png#CivIcon-HouseofLancasterAoE4.png#CivIcon-HouseofLancasterAoE4_spacing.png#CivIcon-HREAoE4.png#CivIcon-HREAoE4_spacing.png#CivIcon-JapaneseAoE4.png#CivIcon-JapaneseAoE4_spacing.png#CivIcon-JeanneDArcAoE4.png#CivIcon-JeanneDArcAoE4_spacing.png#CivIcon-KnightsTemplarAoE4.png#CivIcon-KnightsTemplarAoE4_spacing.png#CivIcon-MaliansAoE4.png#CivIcon-MaliansAoE4_spacing.png#CivIcon-MongolsAoE4.png#CivIcon-MongolsAoE4_spacing.png#CivIcon-OrderOfTheDragonAoE4.png#CivIcon-OrderOfTheDragonAoE4_spacing.png#CivIcon-OttomansAoE4.png#CivIcon-OttomansAoE4_spacing.png#CivIcon-RusAoE4.png#CivIcon-RusAoE4_spacing.png#CivIcon-ZhuXiLegacyAoE4.png#CivIcon-ZhuXiLegacyAoE4_spacing.png#abb.webp#ang.webp#ant.webp#ayy.webp#byz.webp#chi.webp#del.webp#dra.webp#eng.webp#fre.webp#gen.webp#hol.webp#hos.webp#hre.webp#jap.webp#jda.webp#koc.webp#kof.webp#kte.webp#mal.webp#mon.webp#ott.webp#pol.webp#rus.webp#teu.webp#ven.webp#zxl.webp',
    'abilities': 'attack-move.webp#repair.webp#ronin_hire_single.webp',
    'ability_chinese': 'collect_tax.webp#supervise.webp',
    'ability_jeanne':
        'ability-champion-companions-1.webp#ability-consecrate-1.webp#ability-divine-arrow-1.webp#ability-divine-restoration-1.webp#ability-field-commander-1.webp#ability-gunpowder-monarch-1.webp#ability-holy-wrath-1.webp#ability-path-of-the-archer-1.webp#ability-path-of-the-warrior-1.webp#ability-rider-companions-1.webp#ability-riders-ready-1.webp#ability-strength-of-heaven-1.webp#ability-to-arms-men-1.webp#ability-valorous-inspiration-1.webp',
    'ability_lancaster':
        'call_to_arms.webp#earls_guard.webp#hammer_throw.webp#lancaster_patronage.webp#lord_of_lancaster_aura.webp#manor_ability.webp#platemail_puncturing_projectile.webp#shire_levy_2.webp#shire_levy_3.webp#silver_prospecting.webp',
    'ability_templar':
        'battle_glory.webp#castille_aura.webp#confrere_aura.webp#gunpowder_resistance.webp#knightly_brotherhood.webp#landscape_preservation.webp#pilgrim_ability.webp#pilgrim_loan_lrg.webp#pilgrim_loan_med.webp#pilgrim_loan_sml.webp#spearman_aura.webp#szlachta_atk_speed_reduction.webp#teutonic_wrath.webp',
    'building_byzantines':
        'aqueduct-1.webp#cistern-1.webp#mercenary-house-2.webp#olive-grove-1.webp',
    'building_chinese': 'granary.webp#pagoda.webp#village.webp',
    'building_defensive':
        'keep.webp#outpost.webp#palisade-gate.webp#palisade-wall.webp#stone-wall-gate.webp#stone-wall-tower.webp#stone-wall.webp',
    'building_economy':
        'farm.webp#house.webp#lumber-camp.webp#market.webp#mill.webp#mining-camp.webp#town-center.webp',
    'building_japanese':
        'buddhist-temple-3.webp#castle-4.webp#farmhouse-1.webp#forge-1.webp#shinto-shrine-3.webp',
    'building_lancaster': 'manor.webp',
    'building_malians': 'cattle-ranch-2.webp#pit-mine-1.webp#toll-outpost-1.webp',
    'building_military':
        'archery-range.webp#barracks.webp#dock.webp#siege-workshop.webp#stable.webp',
    'building_mongols': 'ger.webp#ovoo.webp#pasture.webp#prayer-tent.webp',
    'building_ottomans': 'military-school-1.webp',
    'building_poi':
        'forgotten_ruins.webp#koth_site.webp#merchant_camp.webp#point_of_interest.webp#ronin_building.webp#ruined_outpost.webp#wolf_den.webp',
    'building_religious': 'monastery.webp#mosque.webp',
    'building_rus':
        'fortified-palisade-gate.webp#fortified-palisade-wall.webp#hunting-cabin.webp#wooden-fortress.webp',
    'building_technology': 'blacksmith.webp#madrasa.webp#university.webp',
    'landmark_abbasid':
        'culture-wing.webp#economic-wing.webp#house-of-wisdom.webp#military-wing.webp#prayer-hall-of-uqba.webp#trade-wing.webp',
    'landmark_byzantines':
        'cathedral-of-divine-wisdom-4.webp#cistern-of-the-first-hill-2.webp#foreign-engineering-company-3.webp#golden-horn-tower-2.webp#grand-winery-1.webp#imperial-hippodrome-1.webp#palatine-school-3.webp',
    'landmark_chinese':
        'astronomical-clocktower.webp#barbican-of-the-sun.webp#enclave-of-the-emperor.webp#great-wall-gatehouse.webp#imperial-academy.webp#imperial-palace.webp#spirit-way.webp',
    'landmark_delhi':
        'compound-of-the-defender.webp#dome-of-the-faith.webp#great-palace-of-agra.webp#hisar-academy.webp#house-of-learning.webp#palace-of-the-sultan.webp#tower-of-victory.webp',
    'landmark_english':
        'abbey-of-kings.webp#berkshire-palace.webp#cathedral-of-st-thomas.webp#council-hall.webp#kings-palace.webp#the-white-tower.webp#wynguard-palace.webp',
    'landmark_french':
        'chamber-of-commerce.webp#college-of-artillery.webp#guild-hall.webp#notre-dame.webp#red-palace.webp#royal-institute.webp#school-of-cavalry.webp',
    'landmark_hre':
        'aachen-chapel.webp#burgrave-palace.webp#elzbach-palace.webp#great-palace-of-flensburg.webp#meinwerk-palace.webp#palace-of-swabia.webp#regnitz-cathedral.webp',
    'landmark_japanese':
        'castle-of-the-crow-4.webp#floating-gate-2.webp#koka-township-1.webp#kura-storehouse-1.webp#tanegashima-gunsmith-3.webp#temple-of-equality-2.webp#tokugawa-shrine-4.webp',
    'landmark_lancaster': 'kings_college.webp#lancaster_castle.webp',
    'landmark_malians':
        'farimba-garrison-2.webp#fort-of-the-huntress-3.webp#grand-fulani-corral-2.webp#great-mosque-4.webp#griot-bara-3.webp#mansa-quarry-2.webp#saharan-trade-network-1.webp',
    'landmark_mongols':
        'deer-stones.webp#khaganate-palace.webp#kurultai.webp#monument-of-the-great-khan.webp#steppe-redoubt.webp#the-silver-tree.webp#the-white-stupa.webp',
    'landmark_ottomans':
        'azure-mosque-4.webp#istanbul-imperial-palace-2.webp#istanbul-observatory-3.webp#mehmed-imperial-armory-2.webp#sea-gate-castle-3.webp#sultanhani-trade-network-1.webp#twin-minaret-medrese-1.webp',
    'landmark_rus':
        'abbey-of-the-trinity.webp#cathedral-of-the-tsar.webp#high-armory.webp#high-trade-house.webp#kremlin.webp#spasskaya-tower.webp#the-golden-gate.webp',
    'landmark_templar': 'fortress.webp',
    'landmark_zhuxi':
        'jiangnan-tower-2.webp#meditation-gardens-1.webp#mount-lu-academy-1.webp#shaolin-monastery-2.webp#temple-of-the-sun-3.webp#zhu-xis-library-3.webp',
    'resource':
        'berrybush.webp#boar.webp#bounty.webp#cattle.webp#deer.webp#fish.webp#gaiatreeprototypetree.webp#oliveoil.webp#rally.webp#relics.webp#repair.webp#resource_food.webp#resource_gold.webp#resource_stone.webp#resource_wood.webp#sacred_sites.webp#sheep.webp#time.webp#wolf.webp',
    'technology_abbasid':
        'agriculture.webp#armored-caravans.webp#boot-camp.webp#camel-handling.webp#camel-rider-barding-4.webp#camel-rider-shields.webp#camel-support.webp#composite-bows.webp#faith.webp#fertile-crescent-2.webp#fresh-foodstuffs.webp#grand-bazaar.webp#improved-processing.webp#medical-centers.webp#phalanx.webp#preservation-of-knowledge.webp#public-library.webp#spice-roads.webp#teak-masts.webp',
    'technology_ayyubids':
        'culture-wing-advancement-1.webp#culture-wing-logistics-1.webp#economic-wing-growth-1.webp#economic-wing-industry-1.webp#infantry-support-4.webp#military-wing-master-smiths-1.webp#military-wing-reinforcement-1.webp#phalanx-2.webp#siege-carpentry-3.webp#sultans-mamluks-3.webp#trade-wing-advisors-1.webp#trade-wing-bazaar-1.webp',
    'technology_byzantines':
        'border-settlements-2.webp#eastern-mercenary-contract-1.webp#elite-mercenaries-4.webp#expilatores-2.webp#ferocious-speed-4.webp#greek-fire-projectiles-4.webp#heavy-dromon-3.webp#liquid-explosives-3.webp#numeri-4.webp#silk-road-mercenary-contract-1.webp#teardrop-shields-3.webp#trapezites-2.webp#veteran-mercenaries-3.webp#western-mercenary-contract-1.webp',
    'technology_chinese':
        'ancient-techniques.webp#battle-hardened.webp#extra-hammocks.webp#extra-materials.webp#handcannon-slits.webp#imperial-examination.webp#pyrotechnics.webp#reload-drills.webp#reusable-barrels.webp#thunderclap-bombs-4.webp',
    'technology_defensive':
        'arrow-slits.webp#boiling-oil.webp#cannon-emplacement.webp#court-architects.webp#fortify-outpost.webp#springald-emplacement.webp',
    'technology_delhi':
        'all-seeing-eye.webp#armored-beasts.webp#efficient-production.webp#forced-march.webp#hearty-rations.webp#honed-blades.webp#lookout-towers.webp#mahouts.webp#manuscript-trade-1.webp#paiks.webp#reinforced-foundations.webp#salvaged-materials.webp#sanctity.webp#siege-elephant.webp#slow-burning-defenses.webp#swiftness.webp#tranquil-venue.webp#village-fortresses.webp#zeal.webp',
    'technology_dragon':
        'bodkin-bolts-4.webp#dragon-fire-2.webp#dragon-scale-leather-3.webp#golden-cuirass-2.webp#war-horses-4.webp#zornhau-3.webp',
    'technology_economy':
        'acid-distilization.webp#crosscut-saw.webp#cupellation.webp#double-broadaxe.webp#drift-nets.webp#extended-lines.webp#fertilization.webp#forestry.webp#horticulture.webp#lumber-preservation.webp#precision-cross-breeding.webp#professional-scouts.webp#shaft-mining.webp#specialized-pick.webp#survival-techniques.webp#textiles.webp#wheelbarrow.webp',
    'technology_english':
        'admiralty-2.webp#armor-clad.webp#arrow-volley.webp#enclosures.webp#network-of-citadels.webp#setup-camp.webp#shattering-projectiles.webp',
    'technology_french':
        'cantled-saddles.webp#chivalry.webp#crossbow-stirrups.webp#enlistment-incentives.webp#gambesons.webp#long-guns.webp#merchant-guilds-4.webp#royal-bloodlines.webp',
    'technology_hre':
        'awl-pike.webp#benediction.webp#cistercian-churches.webp#devoutness.webp#fire-stations.webp#heavy-maces.webp#inspired-warriors.webp#marching-drills.webp#reinforced-defenses.webp#riveted-chain-mail-2.webp#slate-and-stone-construction.webp#steel-barding-3.webp#two-handed-weapon.webp',
    'technology_japanese':
        'bunrei.webp#copper-plating-3.webp#daimyo-manor-1.webp#daimyo-palace-2.webp#do-maru-armor-4.webp#explosives-4.webp#five_ministries.webp#fudasashi-3.webp#gion_festival.webp#heated-shot-4.webp#hizukuri-2.webp#kabura-ya-whistling-arrow-3.webp#kobuse-gitae-3.webp#nagae-yari-4.webp#nehan.webp#oda-tactics-4.webp#odachi-3.webp#shinto_rituals.webp#shogunate-castle-3.webp#swivel-cannon-4.webp#takezaiku-2.webp#tatara-1.webp#towara-1.webp#yaki-ire-4.webp#zen.webp',
    'technology_jeanne': 'companion-equipment-3.webp#ordinance-company-3.webp',
    'technology_lancaster':
        'billmen.webp#burgundian_imports.webp#collar_of_esses.webp#condensed_land_practices.webp#earlguardupgrade.webp#hill_land_training.webp#hobelar_upgrade_age3.webp#hobelar_upgrade_age4.webp#modern_military_tactics.webp#open_field_system.webp#padded_jack.webp#scutage.webp#ships_of_the_crown.webp#synchronized_shot.webp#warwolf_trebuchet.webp#yeoman_upgrade_age3.webp#yeoman_upgrade_age4.webp',
    'technology_malians':
        'banco-repairs-2.webp#canoe-tactics-2.webp#farima-leadership-4.webp#imported-armor-3.webp#local-knowledge-4.webp#poisoned-arrows-3.webp#precision-training-4.webp',
    'technology_military':
        'angled-surfaces.webp#balanced-projectiles.webp#biology.webp#bloomery.webp#chemistry.webp#damascus-steel.webp#decarbonization.webp#elite-army-tactics.webp#fitted-leatherwork.webp#geometry.webp#greased-axles.webp#incendiary-arrows.webp#insulated-helm.webp#iron-undermesh.webp#master-smiths.webp#military-academy.webp#platecutter-point.webp#serpentine-powder.webp#siege-engineering.webp#siege-works.webp#silk-bowstrings.webp#steeled-arrow.webp#wedge-rivets.webp',
    'technology_mongols':
        'additional-torches.webp#improved_production.webp#monastic-shrines.webp#piracy.webp#raid-bounty.webp#siha-bow-limbs.webp#steppe-lancers.webp#stone-bounty.webp#stone-commerce.webp#superior-mobility.webp#whistling-arrows.webp#yam-network.webp',
    'technology_naval':
        'additional-sails.webp#armored-hull.webp#chaser-cannons.webp#explosives.webp#extra-ballista.webp#incendiaries-3.webp#naval-arrow-slits.webp#navigator-lookout.webp#shipwrights-4.webp#springald-crews-3.webp',
    'technology_ottomans':
        'advanced-academy-1.webp#anatolian-hills-1.webp#extensive-fortifications.webp#fast-training-1.webp#field-work-1.webp#great-bombard-emplacement.webp#great-bombard-vizier.webp#imperial-fleet-4.webp#janissary-company-1.webp#janissary-guns-4.webp#mehter-drums-1.webp#military-campus-1.webp#pax-ottomana.webp#siege-crews-1.webp#timariots.webp#trade-bags-1.webp',
    'technology_religious': 'herbal-medicine.webp#piety.webp#tithe-barns.webp',
    'technology_rus':
        'adaptable-hulls-3.webp#banded-arms.webp#blessing-duration.webp#boyars-fortitude.webp#castle-turret.webp#castle-watch.webp#cedar-hulls.webp#clinker-construction.webp#double-time.webp#fine-tuned-guns.webp#improved-blessing.webp#knight-sabers.webp#mounted-training.webp#saints-reach.webp#saints-veneration-4.webp#siege-crew-training.webp#wandering-town.webp#warrior_scout_2.webp',
    'technology_templar':
        'brigandine.webp#cavalier_confrere_upgrade_age3.webp#cavalier_confrere_upgrade_age4.webp#counterweight_defenses.webp#cranequins.webp#crusader_fleets.webp#desert_citadel.webp#desert_outpost.webp#fanaticism.webp#genitour_upgrade_age4.webp#genoese_crossbowman_age4.webp#heavy_spearman_age4.webp#iron_clamps.webp#knighthospitaller_age3.webp#knighthospitaller_age4.webp#lettre_de_change.webp#ruleoftemplar.webp#safepassage.webp#sanctuary.webp#serjeant_age3_up.webp#serjeant_age4_up.webp#templarbrother_age4.webp#treasure_tower.webp#trebuchet_emplacement.webp',
    'technology_units':
        'adjustable-crossbars.webp#lightweight-beams-4.webp#roller-shutter-triggers.webp#spyglass-4.webp',
    'technology_zhuxi':
        '10000-bolts-4.webp#advanced-administration-4.webp#bolt-magazines.webp#cloud-of-terror-4.webp#dali-horses.webp#dynastic-protectors-4.webp#hard-cased-bombs.webp#imperial-red-seals-3.webp#military-affairs-bureau-1.webp#roar-of-the-dragon-4.webp',
    'unit_abbasid':
        'camel-archer-2.webp#camel-rider-3.webp#ghulam-3.webp#imam.webp#trade-caravan-1.webp',
    'unit_ayyubids':
        'atabeg-1.webp#bedouin-skirmisher-2.webp#bedouin-swordsman-1.webp#camel-lancer-3.webp#dervish-3.webp#desert-raider-2.webp#manjaniq-3.webp#tower-of-the-sultan-3.webp',
    'unit_byzantines':
        'arbaletrier-3.webp#camel-archer-2.webp#camel-rider-3.webp#cataphract-3.webp#cheirosiphon-3.webp#desert-raider-2.webp#dromon-2.webp#ghulam-3.webp#grenadier-4.webp#horse-archer-3.webp#javelin-thrower-2.webp#keshik-2.webp#landsknecht-3.webp#limitanei-1.webp#longbowman-2.webp#mangudai.webp#musofadi-warrior-2.webp#royal-knight-2.webp#sipahi-2.webp#streltsy.webp#tower-elephant-3.webp#tower-of-the-sultan-3.webp#varangian-guard-3.webp#war-elephant.webp#zhuge-nu-2.webp',
    'unit_cavalry': 'horseman-1.webp#knight-2.webp#lancer-3.webp#lancer-4.webp#scout.webp',
    'unit_chinese':
        'fire-lancer-3.webp#grenadier-4.webp#imperial-official.webp#junk.webp#nest-of-bees.webp#palace-guard-3.webp#zhuge-nu-2.webp',
    'unit_delhi':
        'ghazi-raider-2.webp#scholar.webp#sultans-elite-tower-elephant-4.webp#tower-elephant-3.webp#war-elephant.webp',
    'unit_dragon':
        'dragon-handcannoneer-4.webp#gilded-archer-2.webp#gilded-crossbowman-3.webp#gilded-horseman-2.webp#gilded-knight-3.webp#gilded-landsknecht-3.webp#gilded-man-at-arms-2.webp#gilded-spearman-1.webp',
    'unit_english':
        'king-2.webp#longbowman-2.webp#wynguard-army-1.webp#wynguard-footmen-1.webp#wynguard-raiders-1.webp#wynguard-ranger-4.webp',
    'unit_events': 'land_monster.webp#water_monster.webp',
    'unit_french':
        'arbaletrier-3.webp#cannon-4.webp#galleass.webp#royal-cannon-4.webp#royal-culverin-4.webp#royal-knight-2.webp#royal-ribauldequin-4.webp#war-cog.webp',
    'unit_hre': 'black-rider-1.webp#landsknecht-3.webp#prelate.webp',
    'unit_infantry':
        'archer-2.webp#crossbowman-3.webp#handcannoneer-4.webp#man-at-arms-1.webp#ronin_unit.webp#spearman-1.webp',
    'unit_japanese':
        'atakebune-4.webp#buddhist-monk-3.webp#katana-bannerman-2.webp#mounted-samurai-3.webp#onna-bugeisha-2.webp#onna-musha-3.webp#ozutsu-4.webp#samurai-1.webp#shinobi-2.webp#shinto-priest-3.webp#uma-bannerman-2.webp#yumi-ashigaru-2.webp#yumi-bannerman-2.webp',
    'unit_jeanne':
        'jeanne-darc-blast-cannon-4.webp#jeanne-darc-hunter-2.webp#jeanne-darc-knight-3.webp#jeanne-darc-markswoman-4.webp#jeanne-darc-mounted-archer-3.webp#jeanne-darc-peasant-1.webp#jeanne-darc-woman-at-arms-2.webp#jeannes-champion-3.webp#jeannes-rider-3.webp',
    'unit_lancaster':
        'champion.webp#demilancer.webp#earlretinue.webp#elitechampion.webp#garrisoncommand.webp#gunpowder_contingent.webp#hobelar_age2.webp#hobelar_age3.webp#hobelar_age4.webp#lord_lancaster.webp#yeoman_age2.webp#yeoman_age3.webp#yeoman_age4.webp',
    'unit_malians':
        'donso-1.webp#freeborn-mansa.webp#hunting-canoe-2.webp#javelin-thrower-2.webp#javelin-thrower-mansa.webp#musofadi-gunner-4.webp#musofadi-mansa.webp#musofadi-warrior-2.webp#sofa-2.webp#war-canoe-2.webp#warrior-scout-2.webp',
    'unit_mongols':
        'huihui-pao-1.webp#keshik-2.webp#khan-1.webp#khans-hunter.webp#light-junk.webp#mangudai.webp#shaman.webp#traction-trebuchet.webp',
    'unit_ottomans':
        'grand-galley-4.webp#great-bombard-4.webp#janissary-3.webp#mehter-2.webp#scout-ship-2.webp#sipahi-2.webp',
    'unit_religious': 'imam-3.webp#monk-3.webp',
    'unit_rus':
        'horse-archer-3.webp#lodya-attack-ship.webp#lodya-demolition-ship.webp#lodya-fishing-boat.webp#lodya-galley-3.webp#lodya-trade-ship.webp#lodya-transport-ship.webp#militia-2.webp#streltsy.webp#warrior-monk.webp',
    'unit_ship':
        'baghlah.webp#baochuan.webp#carrack.webp#demolition-ship.webp#dhow.webp#explosive-dhow.webp#explosive-junk.webp#fishing-boat.webp#galley.webp#hulk.webp#junk-3.webp#light-junk-2.webp#trade-ship.webp#transport-ship.webp#war-junk.webp#xebec.webp',
    'unit_siege':
        'battering-ram.webp#bombard.webp#culverin-4.webp#mangonel-3.webp#ribauldequin-4.webp#siege-tower.webp#springald.webp#trebuchet.webp',
    'unit_templar':
        'chevalier_confrere_age_2.webp#chevalier_confrere_age_3.webp#chevalier_confrere_age_4.webp#condottiere.webp#genitour_age_3.webp#genitour_age_4.webp#genoese_crossbowman_age_3.webp#genoese_crossbowman_age_4.webp#heavy_spearman_age_3.webp#heavy_spearman_age_4.webp#hospitaller_knight_age_2.webp#hospitaller_knight_age_3.webp#hospitaller_knight_age_4.webp#king_baldwin_iv.webp#odo_of_st_amand.webp#pilgrim.webp#serjeant_age_2.webp#serjeant_age_3.webp#serjeant_age_4.webp#szlachta_age_4.webp#templar_brother_age_3.webp#templar_brother_age_4.webp#teutonic_knight.webp#venetian_galley.webp',
    'unit_worker':
        'monk-3.webp#trader.webp#villager-abbasid.webp#villager-china.webp#villager-delhi.webp#villager-japanese.webp#villager-malians.webp#villager-mongols.webp#villager-ottomans.webp#villager.webp',
    'unit_zhuxi': 'imperial-guard-1.webp#shaolin-monk-3.webp#yuan-raider-4.webp'
  };

  // Split each string (e.g. 'image_0#image_1#image_2') in a list of images.
  for (const [key, value] of Object.entries(imagesDict)) {
    imagesDict[key] = value.split('#');
  }

  return imagesDict;
}

/**
 * Get the factions with 3 letters shortcut and icon, for AoE4.
 *
 * @returns Dictionary with faction name as key, and its 3 letters + image as value.
 */
function getFactionsAoE4() {
  return {
    'Abbasid Dynasty': ['ABB', 'CivIcon-AbbasidAoE4.png'],
    'Ayyubids': ['AYY', 'CivIcon-AyyubidsAoE4.png'],
    'Byzantines': ['BYZ', 'CivIcon-ByzantinesAoE4.png'],
    'Chinese': ['CHI', 'CivIcon-ChineseAoE4.png'],
    'Delhi Sultanate': ['DEL', 'CivIcon-DelhiAoE4.png'],
    'English': ['ENG', 'CivIcon-EnglishAoE4.png'],
    'French': ['FRE', 'CivIcon-FrenchAoE4.png'],
    'House of Lancaster': ['HOL', 'CivIcon-HouseofLancasterAoE4.png'],
    'Holy Roman Empire': ['HRE', 'CivIcon-HREAoE4.png'],
    'Japanese': ['JAP', 'CivIcon-JapaneseAoE4.png'],
    'Jeanne d\'Arc': ['JDA', 'CivIcon-JeanneDArcAoE4.png'],
    'Knights Templar': ['KTP', 'CivIcon-KnightsTemplarAoE4.png'],
    'Malians': ['MAL', 'CivIcon-MaliansAoE4.png'],
    'Mongols': ['MON', 'CivIcon-MongolsAoE4.png'],
    'Order of the Dragon': ['OOD', 'CivIcon-OrderOfTheDragonAoE4.png'],
    'Ottomans': ['OTT', 'CivIcon-OttomansAoE4.png'],
    'Rus': ['RUS', 'CivIcon-RusAoE4.png'],
    'Zhu Xi\'s Legacy': ['ZXL', 'CivIcon-ZhuXiLegacyAoE4.png']
  };
}

/**
 * Get the folder containing the faction images, for AoE4.
 *
 * @returns Requested folder name.
 */
function getFactionImagesFolderAoE4() {
  return 'civilization_flag';
}

/**
 * Get the instructions for AoE4.
 *
 * @returns Requested instructions.
 */
function getInstructionsAoE4() {
  const externalBOLines = [
    'In the <b>From external website</b> section, you can get many build orders with the requested format from',
    'aoe4guides.com or age4builder.com (use the shortcuts on the left). On aoe4guides.com, select a build order,',
    'click on the 3 dots (upper right corner), click on the \'Overlay Tool\' copy button, and paste the content below.',
    'On age4builder.com, select a build order, click on the salamander icon, and paste the content below.'
  ];
  return contentArrayToDiv(getArrayInstructions(externalBOLines));
}

/**
 * Get HTML code for the visual editor sample, for AoE4.
 *
 * @returns HTML code
 */
function getVisualEditorAoE4() {
  // Image folders
  const common = 'assets/common/';
  const game = 'assets/' + gameName + '/';
  const resource = game + '/resource/';

  // Description for each column
  let columnsDescription = [
    new SinglePanelColumn('age'), new SinglePanelColumn('time', common + 'icon/time.png'),
    new SinglePanelColumn('population_count', game + 'building_economy/house.webp'),
    new SinglePanelColumn('villager_count', game + 'unit_worker/villager.webp'),
    new SinglePanelColumn('resources/food', resource + 'resource_food.webp'),
    new SinglePanelColumn('resources/wood', resource + 'resource_wood.webp'),
    new SinglePanelColumn('resources/gold', resource + 'resource_gold.webp'),
    new SinglePanelColumn('resources/stone', resource + 'resource_stone.webp'),
    new SinglePanelColumn('resources/builder', resource + 'repair.webp')
  ];

  columnsDescription[0].text = 'Age';                       // age selection
  columnsDescription[0].isSelectwidget = true;              // age selection
  columnsDescription[1].italic = true;                      // time
  columnsDescription[1].optional = true;                    // time
  columnsDescription[3].bold = true;                        // villager count
  columnsDescription[3].backgroundColor = [50, 50, 50];     // villager count
  columnsDescription[4].backgroundColor = [153, 94, 89];    // food
  columnsDescription[5].backgroundColor = [94, 72, 56];     // wood
  columnsDescription[6].backgroundColor = [135, 121, 78];   // gold
  columnsDescription[7].backgroundColor = [100, 100, 100];  // stone
  columnsDescription[8].optional = true;                    // builder

  columnsDescription[1].tooltip = 'step end time as \'x:yy\'';  // time
  columnsDescription[2].tooltip = 'population count';           // population count
  columnsDescription[3].tooltip = 'number of villagers';        // villager count
  columnsDescription[4].tooltip = 'villagers on food';          // food
  columnsDescription[5].tooltip = 'villagers on wood';          // wood
  columnsDescription[6].tooltip = 'villagers on gold';          // gold
  columnsDescription[7].tooltip = 'villagers on stone';         // stone
  columnsDescription[8].tooltip = 'number of builders';         // builder

  // Show only positive characters for resources
  for (let i = 2; i <= 8; i++) {
    columnsDescription[i].isIntegerInRawBO = true;
    columnsDescription[i].showOnlyPositive = true;
  }
  columnsDescription[0].isIntegerInRawBO = true;  // age selection

  // Age selection
  visualEditortableWidgetDescription = [
    [-1, '?', 'age/age_unknown.png'], [1, 'DAR', 'age/age_1.webp'], [2, 'FEU', 'age/age_2.webp'],
    [3, 'CAS', 'age/age_3.webp'], [4, 'IMP', 'age/age_4.webp']
  ];

  return getVisualEditorFromDescription(columnsDescription);
}

/**
 * Open a new page displaying the full BO in a single panel, for AoE4.
 */
function openSinglePanelPageAoE4() {
  // Image folders
  const common = 'assets/common/';
  const game = 'assets/' + gameName + '/';
  const resource = game + '/resource/';

  // Description for each column
  let columnsDescription = [
    new SinglePanelColumn('time', common + 'icon/time.png'),
    new SinglePanelColumn('population_count', game + 'building_economy/house.webp'),
    new SinglePanelColumn('villager_count', game + 'unit_worker/villager.webp'),
    new SinglePanelColumn('resources/builder', resource + 'repair.webp'),
    new SinglePanelColumn('resources/food', resource + 'resource_food.webp'),
    new SinglePanelColumn('resources/wood', resource + 'resource_wood.webp'),
    new SinglePanelColumn('resources/gold', resource + 'resource_gold.webp'),
    new SinglePanelColumn('resources/stone', resource + 'resource_stone.webp')
  ];

  columnsDescription[0].italic = true;                      // time
  columnsDescription[0].hideIfAbsent = true;                // time
  columnsDescription[0].textAlign = 'right';                // time
  columnsDescription[1].hideIfAbsent = true;                // population count
  columnsDescription[2].bold = true;                        // villager count
  columnsDescription[3].hideIfAbsent = true;                // builder
  columnsDescription[4].backgroundColor = [153, 94, 89];    // food
  columnsDescription[5].backgroundColor = [94, 72, 56];     // wood
  columnsDescription[6].backgroundColor = [135, 121, 78];   // gold
  columnsDescription[7].backgroundColor = [100, 100, 100];  // stone

  // all columns, except time
  for (let i = 1; i <= 7; i++) {
    columnsDescription[i].displayIfPositive = true;
  }

  // Sections Header
  const sectionsHeader = {
    'key': 'age',  // Key to look for
    // Header before the current row
    'before': {
      1: getBOImageHTML(game + 'age/age_1.webp') + 'Dark Age',
      2: getBOImageHTML(game + 'age/age_2.webp') + 'Feudal Age',
      3: getBOImageHTML(game + 'age/age_3.webp') + 'Castle Age',
      4: getBOImageHTML(game + 'age/age_4.webp') + 'Imperial Age'
    }
  };
  // Header for first line
  sectionsHeader['first_line'] = sectionsHeader.before;

  // Feed game description to generic function
  openSinglePanelPageFromDescription(columnsDescription, sectionsHeader);
}
