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

  htmlString += getBOImageValue(resourceFolder + 'resource_food.png', resources, 'food');
  htmlString += getBOImageValue(resourceFolder + 'resource_wood.png', resources, 'wood');
  htmlString += getBOImageValue(resourceFolder + 'resource_gold.png', resources, 'gold');
  htmlString += getBOImageValue(resourceFolder + 'resource_stone.png', resources, 'stone');
  htmlString += getBOImageValue(resourceFolder + 'repair.png', resources, 'builder', true);
  htmlString += getBOImageValue(
      gamePicturesFolder + 'unit_worker/villager.png', currentStep, 'villager_count', true);
  htmlString += getBOImageValue(
      gamePicturesFolder + 'building_economy/house.png', currentStep, 'population_count', true);

  // Age image
  const ageImage = {1: 'age_1.png', 2: 'age_2.png', 3: 'age_3.png', 4: 'age_4.png'};

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
    'textiles': 'technology_economy/textiles.png',
    'imperial official': 'unit_chinese/imperial-official.png'
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
  let imagesDict =
      {
        'abilities': 'attack-move.png#repair.png#ronin_hire_single.png',
        'ability_chinese': 'collect_tax.png#supervise.png',
        'ability_jeanne':
            'ability-champion-companions-1.png#ability-consecrate-1.png#ability-divine-arrow-1.png#ability-divine-restoration-1.png#ability-field-commander-1.png#ability-gunpowder-monarch-1.png#ability-holy-wrath-1.png#ability-path-of-the-archer-1.png#ability-path-of-the-warrior-1.png#ability-rider-companions-1.png#ability-riders-ready-1.png#ability-strength-of-heaven-1.png#ability-to-arms-men-1.png#ability-valorous-inspiration-1.png',
        'ability_lancaster':
            'call_to_arms.png#earls_guard.png#hammer_throw.png#lancaster_patronage.png#lord_of_lancaster_aura.png#manor_ability.png#platemail_puncturing_projectile.png#shire_levy_2.png#shire_levy_3.png#silver_prospecting.png',
        'ability_templar':
            'battle_glory.png#castille_aura.png#confrere_aura.png#gunpowder_resistance.png#knightly_brotherhood.png#landscape_preservation.png#pilgrim_ability.png#pilgrim_loan_lrg.png#pilgrim_loan_med.png#pilgrim_loan_sml.png#spearman_aura.png#szlachta_atk_speed_reduction.png#teutonic_wrath.png',
        'age':
            'age_1.png#age_2.png#age_3.png#age_4.png#age_unknown.png#goldenagetier1.png#goldenagetier2.png#goldenagetier3.png#goldenagetier4.png#goldenagetier5.png#vizier_point.png',
        'building_byzantines':
            'aqueduct-1.png#cistern-1.png#mercenary-house-2.png#olive-grove-1.png',
        'building_chinese': 'granary.png#pagoda.png#village.png',
        'building_defensive':
            'keep.png#outpost.png#palisade-gate.png#palisade-wall.png#stone-wall-gate.png#stone-wall-tower.png#stone-wall.png',
        'building_economy':
            'farm.png#house.png#lumber-camp.png#market.png#mill.png#mining-camp.png#town-center.png',
        'building_japanese':
            'buddhist-temple-3.png#castle-4.png#farmhouse-1.png#forge-1.png#shinto-shrine-3.png',
        'building_lancaster': 'manor.png',
        'building_malians': 'cattle-ranch-2.png#pit-mine-1.png#toll-outpost-1.png',
        'building_military':
            'archery-range.png#barracks.png#dock.png#siege-workshop.png#stable.png',
        'building_mongols': 'ger.png#ovoo.png#pasture.png#prayer-tent.png',
        'building_ottomans': 'military-school-1.png',
        'building_poi':
            'forgotten_ruins.png#koth_site.png#merchant_camp.png#point_of_interest.png#ronin_building.png#ruined_outpost.png#wolf_den.png',
        'building_religious': 'monastery.png#mosque.png',
        'building_rus':
            'fortified-palisade-gate.png#fortified-palisade-wall.png#hunting-cabin.png#wooden-fortress.png',
        'building_technology': 'blacksmith.png#madrasa.png#university.png',
        'civilization_flag':
            'abb.png#ang.png#ant.png#ayy.png#byz.png#chi.png#CivIcon-AbbasidAoE4.png#CivIcon-AbbasidAoE4_spacing.png#CivIcon-AyyubidsAoE4.png#CivIcon-AyyubidsAoE4_spacing.png#CivIcon-ByzantinesAoE4.png#CivIcon-ByzantinesAoE4_spacing.png#CivIcon-ChineseAoE4.png#CivIcon-ChineseAoE4_spacing.png#CivIcon-DelhiAoE4.png#CivIcon-DelhiAoE4_spacing.png#CivIcon-EnglishAoE4.png#CivIcon-EnglishAoE4_spacing.png#CivIcon-FrenchAoE4.png#CivIcon-FrenchAoE4_spacing.png#CivIcon-HouseofLancasterAoE4.png#CivIcon-HouseofLancasterAoE4_spacing.png#CivIcon-HREAoE4.png#CivIcon-HREAoE4_spacing.png#CivIcon-JapaneseAoE4.png#CivIcon-JapaneseAoE4_spacing.png#CivIcon-JeanneDArcAoE4.png#CivIcon-JeanneDArcAoE4_spacing.png#CivIcon-KnightsTemplarAoE4.png#CivIcon-KnightsTemplarAoE4_spacing.png#CivIcon-MaliansAoE4.png#CivIcon-MaliansAoE4_spacing.png#CivIcon-MongolsAoE4.png#CivIcon-MongolsAoE4_spacing.png#CivIcon-OrderOfTheDragonAoE4.png#CivIcon-OrderOfTheDragonAoE4_spacing.png#CivIcon-OttomansAoE4.png#CivIcon-OttomansAoE4_spacing.png#CivIcon-RusAoE4.png#CivIcon-RusAoE4_spacing.png#CivIcon-ZhuXiLegacyAoE4.png#CivIcon-ZhuXiLegacyAoE4_spacing.png#del.png#dra.png#eng.png#fre.png#gen.png#hol.png#hos.png#hre.png#jap.png#jda.png#koc.png#kof.png#kte.png#mal.png#mon.png#ott.png#pol.png#rus.png#teu.png#ven.png#zxl.png',
        'landmark_abbasid':
            'culture-wing.png#economic-wing.png#house-of-wisdom.png#military-wing.png#prayer-hall-of-uqba.png#trade-wing.png',
        'landmark_byzantines': 'cathedral-of-divine-wisdom-4.png#cistern-of-the-first-hill-2.png#foreign-engineering-company-3.png#golden-horn-tower-2.png#grand-winery-1.png#imperial-hippodrome-1.png#palatine-school-3.png',
        'landmark_chinese':
            'astronomical-clocktower.png#barbican-of-the-sun.png#enclave-of-the-emperor.png#great-wall-gatehouse.png#imperial-academy.png#imperial-palace.png#spirit-way.png',
        'landmark_delhi':
            'compound-of-the-defender.png#dome-of-the-faith.png#great-palace-of-agra.png#hisar-academy.png#house-of-learning.png#palace-of-the-sultan.png#tower-of-victory.png',
        'landmark_english':
            'abbey-of-kings.png#berkshire-palace.png#cathedral-of-st-thomas.png#council-hall.png#kings-palace.png#the-white-tower.png#wynguard-palace.png',
        'landmark_french':
            'chamber-of-commerce.png#college-of-artillery.png#guild-hall.png#notre-dame.png#red-palace.png#royal-institute.png#school-of-cavalry.png',
        'landmark_hre':
            'aachen-chapel.png#burgrave-palace.png#elzbach-palace.png#great-palace-of-flensburg.png#meinwerk-palace.png#palace-of-swabia.png#regnitz-cathedral.png',
        'landmark_japanese':
            'castle-of-the-crow-4.png#floating-gate-2.png#koka-township-1.png#kura-storehouse-1.png#tanegashima-gunsmith-3.png#temple-of-equality-2.png#tokugawa-shrine-4.png',
        'landmark_lancaster': 'kings_college.png#lancaster_castle.png',
        'landmark_malians':
            'farimba-garrison-2.png#fort-of-the-huntress-3.png#grand-fulani-corral-2.png#great-mosque-4.png#griot-bara-3.png#mansa-quarry-2.png#saharan-trade-network-1.png',
        'landmark_mongols':
            'deer-stones.png#khaganate-palace.png#kurultai.png#monument-of-the-great-khan.png#steppe-redoubt.png#the-silver-tree.png#the-white-stupa.png',
        'landmark_ottomans':
            'azure-mosque-4.png#istanbul-imperial-palace-2.png#istanbul-observatory-3.png#mehmed-imperial-armory-2.png#sea-gate-castle-3.png#sultanhani-trade-network-1.png#twin-minaret-medrese-1.png',
        'landmark_rus':
            'abbey-of-the-trinity.png#cathedral-of-the-tsar.png#high-armory.png#high-trade-house.png#kremlin.png#spasskaya-tower.png#the-golden-gate.png',
        'landmark_templar': 'fortress.png',
        'landmark_zhuxi':
            'jiangnan-tower-2.png#meditation-gardens-1.png#mount-lu-academy-1.png#shaolin-monastery-2.png#temple-of-the-sun-3.png#zhu-xis-library-3.png',
        'resource':
            'berrybush.png#boar.png#bounty.png#cattle.png#deer.png#fish.png#gaiatreeprototypetree.png#oliveoil.png#rally.png#relics.png#repair.png#resource_food.png#resource_gold.png#resource_stone.png#resource_wood.png#sacred_sites.png#sheep.png#time.png#wolf.png',
        'technology_abbasid':
            'agriculture.png#armored-caravans.png#boot-camp.png#camel-handling.png#camel-rider-barding-4.png#camel-rider-shields.png#camel-support.png#composite-bows.png#faith.png#fertile-crescent-2.png#fresh-foodstuffs.png#grand-bazaar.png#improved-processing.png#medical-centers.png#phalanx.png#preservation-of-knowledge.png#public-library.png#spice-roads.png#teak-masts.png',
        'technology_ayyubids':
            'culture-wing-advancement-1.png#culture-wing-logistics-1.png#economic-wing-growth-1.png#economic-wing-industry-1.png#infantry-support-4.png#military-wing-master-smiths-1.png#military-wing-reinforcement-1.png#phalanx-2.png#siege-carpentry-3.png#sultans-mamluks-3.png#trade-wing-advisors-1.png#trade-wing-bazaar-1.png',
        'technology_byzantines':
            'border-settlements-2.png#eastern-mercenary-contract-1.png#elite-mercenaries-4.png#expilatores-2.png#ferocious-speed-4.png#greek-fire-projectiles-4.png#heavy-dromon-3.png#liquid-explosives-3.png#numeri-4.png#silk-road-mercenary-contract-1.png#teardrop-shields-3.png#trapezites-2.png#veteran-mercenaries-3.png#western-mercenary-contract-1.png',
        'technology_chinese':
            'ancient-techniques.png#battle-hardened.png#extra-hammocks.png#extra-materials.png#handcannon-slits.png#imperial-examination.png#pyrotechnics.png#reload-drills.png#reusable-barrels.png#thunderclap-bombs-4.png',
        'technology_defensive':
            'arrow-slits.png#boiling-oil.png#cannon-emplacement.png#court-architects.png#fortify-outpost.png#springald-emplacement.png',
        'technology_delhi':
            'all-seeing-eye.png#armored-beasts.png#efficient-production.png#forced-march.png#hearty-rations.png#honed-blades.png#lookout-towers.png#mahouts.png#manuscript-trade-1.png#paiks.png#reinforced-foundations.png#salvaged-materials.png#sanctity.png#siege-elephant.png#slow-burning-defenses.png#swiftness.png#tranquil-venue.png#village-fortresses.png#zeal.png',
        'technology_dragon':
            'bodkin-bolts-4.png#dragon-fire-2.png#dragon-scale-leather-3.png#golden-cuirass-2.png#war-horses-4.png#zornhau-3.png',
        'technology_economy':
            'acid-distilization.png#crosscut-saw.png#cupellation.png#double-broadaxe.png#drift-nets.png#extended-lines.png#fertilization.png#forestry.png#horticulture.png#lumber-preservation.png#precision-cross-breeding.png#professional-scouts.png#shaft-mining.png#specialized-pick.png#survival-techniques.png#textiles.png#wheelbarrow.png',
        'technology_english':
            'admiralty-2.png#armor-clad.png#arrow-volley.png#enclosures.png#network-of-citadels.png#setup-camp.png#shattering-projectiles.png',
        'technology_french':
            'cantled-saddles.png#chivalry.png#crossbow-stirrups.png#enlistment-incentives.png#gambesons.png#long-guns.png#merchant-guilds-4.png#royal-bloodlines.png',
        'technology_hre':
            'awl-pike.png#benediction.png#cistercian-churches.png#devoutness.png#fire-stations.png#heavy-maces.png#inspired-warriors.png#marching-drills.png#reinforced-defenses.png#riveted-chain-mail-2.png#slate-and-stone-construction.png#steel-barding-3.png#two-handed-weapon.png',
        'technology_japanese':
            'bunrei.png#copper-plating-3.png#daimyo-manor-1.png#daimyo-palace-2.png#do-maru-armor-4.png#explosives-4.png#five_ministries.png#fudasashi-3.png#gion_festival.png#heated-shot-4.png#hizukuri-2.png#kabura-ya-whistling-arrow-3.png#kobuse-gitae-3.png#nagae-yari-4.png#nehan.png#oda-tactics-4.png#odachi-3.png#shinto_rituals.png#shogunate-castle-3.png#swivel-cannon-4.png#takezaiku-2.png#tatara-1.png#towara-1.png#yaki-ire-4.png#zen.png',
        'technology_jeanne': 'companion-equipment-3.png#ordinance-company-3.png',
        'technology_lancaster':
            'billmen.png#burgundian_imports.png#collar_of_esses.png#condensed_land_practices.png#earlguardupgrade.png#hill_land_training.png#hobelar_upgrade_age3.png#hobelar_upgrade_age4.png#modern_military_tactics.png#open_field_system.png#padded_jack.png#scutage.png#ships_of_the_crown.png#synchronized_shot.png#warwolf_trebuchet.png#yeoman_upgrade_age3.png#yeoman_upgrade_age4.png',
        'technology_malians':
            'banco-repairs-2.png#canoe-tactics-2.png#farima-leadership-4.png#imported-armor-3.png#local-knowledge-4.png#poisoned-arrows-3.png#precision-training-4.png',
        'technology_military':
            'angled-surfaces.png#balanced-projectiles.png#biology.png#bloomery.png#chemistry.png#damascus-steel.png#decarbonization.png#elite-army-tactics.png#fitted-leatherwork.png#geometry.png#greased-axles.png#incendiary-arrows.png#insulated-helm.png#iron-undermesh.png#master-smiths.png#military-academy.png#platecutter-point.png#serpentine-powder.png#siege-engineering.png#siege-works.png#silk-bowstrings.png#steeled-arrow.png#wedge-rivets.png',
        'technology_mongols':
            'additional-torches.png#improved_production.png#monastic-shrines.png#piracy.png#raid-bounty.png#siha-bow-limbs.png#steppe-lancers.png#stone-bounty.png#stone-commerce.png#superior-mobility.png#whistling-arrows.png#yam-network.png',
        'technology_naval':
            'additional-sails.png#armored-hull.png#chaser-cannons.png#explosives.png#extra-ballista.png#incendiaries-3.png#naval-arrow-slits.png#navigator-lookout.png#shipwrights-4.png#springald-crews-3.png',
        'technology_ottomans':
            'advanced-academy-1.png#anatolian-hills-1.png#extensive-fortifications.png#fast-training-1.png#field-work-1.png#great-bombard-emplacement.png#great-bombard-vizier.png#imperial-fleet-4.png#janissary-company-1.png#janissary-guns-4.png#mehter-drums-1.png#military-campus-1.png#pax-ottomana.png#siege-crews-1.png#timariots.png#trade-bags-1.png',
        'technology_religious': 'herbal-medicine.png#piety.png#tithe-barns.png',
        'technology_rus':
            'adaptable-hulls-3.png#banded-arms.png#blessing-duration.png#boyars-fortitude.png#castle-turret.png#castle-watch.png#cedar-hulls.png#clinker-construction.png#double-time.png#fine-tuned-guns.png#improved-blessing.png#knight-sabers.png#mounted-training.png#saints-reach.png#saints-veneration-4.png#siege-crew-training.png#wandering-town.png#warrior_scout_2.png',
        'technology_templar':
            'brigandine.png#cavalier_confrere_upgrade_age3.png#cavalier_confrere_upgrade_age4.png#counterweight_defenses.png#cranequins.png#crusader_fleets.png#desert_citadel.png#desert_outpost.png#fanaticism.png#genitour_upgrade_age4.png#genoese_crossbowman_age4.png#heavy_spearman_age4.png#iron_clamps.png#knighthospitaller_age3.png#knighthospitaller_age4.png#lettre_de_change.png#ruleoftemplar.png#safepassage.png#sanctuary.png#serjeant_age3_up.png#serjeant_age4_up.png#templarbrother_age4.png#treasure_tower.png#trebuchet_emplacement.png',
        'technology_units':
            'adjustable-crossbars.png#lightweight-beams-4.png#roller-shutter-triggers.png#spyglass-4.png',
        'technology_zhuxi':
            '10000-bolts-4.png#advanced-administration-4.png#bolt-magazines.png#cloud-of-terror-4.png#dali-horses.png#dynastic-protectors-4.png#hard-cased-bombs.png#imperial-red-seals-3.png#military-affairs-bureau-1.png#roar-of-the-dragon-4.png',
        'unit_abbasid':
            'camel-archer-2.png#camel-rider-3.png#ghulam-3.png#imam.png#trade-caravan-1.png',
        'unit_ayyubids':
            'atabeg-1.png#bedouin-skirmisher-2.png#bedouin-swordsman-1.png#camel-lancer-3.png#dervish-3.png#desert-raider-2.png#manjaniq-3.png#tower-of-the-sultan-3.png',
        'unit_byzantines':
            'arbaletrier-3.png#camel-archer-2.png#camel-rider-3.png#cataphract-3.png#cheirosiphon-3.png#desert-raider-2.png#dromon-2.png#ghulam-3.png#grenadier-4.png#horse-archer-3.png#javelin-thrower-2.png#keshik-2.png#landsknecht-3.png#limitanei-1.png#longbowman-2.png#mangudai.png#musofadi-warrior-2.png#royal-knight-2.png#sipahi-2.png#streltsy.png#tower-elephant-3.png#tower-of-the-sultan-3.png#varangian-guard-3.png#war-elephant.png#zhuge-nu-2.png',
        'unit_cavalry': 'horseman-1.png#knight-2.png#lancer-3.png#lancer-4.png#scout.png',
        'unit_chinese':
            'fire-lancer-3.png#grenadier-4.png#imperial-official.png#junk.png#nest-of-bees.png#palace-guard-3.png#zhuge-nu-2.png',
        'unit_delhi':
            'ghazi-raider-2.png#scholar.png#sultans-elite-tower-elephant-4.png#tower-elephant-3.png#war-elephant.png',
        'unit_dragon':
            'dragon-handcannoneer-4.png#gilded-archer-2.png#gilded-crossbowman-3.png#gilded-horseman-2.png#gilded-knight-3.png#gilded-landsknecht-3.png#gilded-man-at-arms-2.png#gilded-spearman-1.png',
        'unit_english':
            'king-2.png#longbowman-2.png#wynguard-army-1.png#wynguard-footmen-1.png#wynguard-raiders-1.png#wynguard-ranger-4.png',
        'unit_events': 'land_monster.png#water_monster.png',
        'unit_french':
            'arbaletrier-3.png#cannon-4.png#galleass.png#royal-cannon-4.png#royal-culverin-4.png#royal-knight-2.png#royal-ribauldequin-4.png#war-cog.png',
        'unit_hre': 'black-rider-1.png#landsknecht-3.png#prelate.png',
        'unit_infantry':
            'archer-2.png#crossbowman-3.png#handcannoneer-4.png#man-at-arms-1.png#ronin_unit.png#spearman-1.png',
        'unit_japanese':
            'atakebune-4.png#buddhist-monk-3.png#katana-bannerman-2.png#mounted-samurai-3.png#onna-bugeisha-2.png#onna-musha-3.png#ozutsu-4.png#samurai-1.png#shinobi-2.png#shinto-priest-3.png#uma-bannerman-2.png#yumi-ashigaru-2.png#yumi-bannerman-2.png',
        'unit_jeanne':
            'jeanne-darc-blast-cannon-4.png#jeanne-darc-hunter-2.png#jeanne-darc-knight-3.png#jeanne-darc-markswoman-4.png#jeanne-darc-mounted-archer-3.png#jeanne-darc-peasant-1.png#jeanne-darc-woman-at-arms-2.png#jeannes-champion-3.png#jeannes-rider-3.png',
        'unit_lancaster':
            'champion.png#demilancer.png#earlretinue.png#elitechampion.png#garrisoncommand.png#gunpowder_contingent.png#hobelar_age2.png#hobelar_age3.png#hobelar_age4.png#lord_lancaster.png#yeoman_age2.png#yeoman_age3.png#yeoman_age4.png',
        'unit_malians':
            'donso-1.png#freeborn-mansa.png#hunting-canoe-2.png#javelin-thrower-2.png#javelin-thrower-mansa.png#musofadi-gunner-4.png#musofadi-mansa.png#musofadi-warrior-2.png#sofa-2.png#war-canoe-2.png#warrior-scout-2.png',
        'unit_mongols':
            'huihui-pao-1.png#keshik-2.png#khan-1.png#khans-hunter.png#light-junk.png#mangudai.png#shaman.png#traction-trebuchet.png',
        'unit_ottomans':
            'grand-galley-4.png#great-bombard-4.png#janissary-3.png#mehter-2.png#scout-ship-2.png#sipahi-2.png',
        'unit_religious': 'imam-3.png#monk-3.png',
        'unit_rus':
            'horse-archer-3.png#lodya-attack-ship.png#lodya-demolition-ship.png#lodya-fishing-boat.png#lodya-galley-3.png#lodya-trade-ship.png#lodya-transport-ship.png#militia-2.png#streltsy.png#warrior-monk.png',
        'unit_ship':
            'baghlah.png#baochuan.png#carrack.png#demolition-ship.png#dhow.png#explosive-dhow.png#explosive-junk.png#fishing-boat.png#galley.png#hulk.png#junk-3.png#light-junk-2.png#trade-ship.png#transport-ship.png#war-junk.png#xebec.png',
        'unit_siege':
            'battering-ram.png#bombard.png#culverin-4.png#mangonel-3.png#ribauldequin-4.png#siege-tower.png#springald.png#trebuchet.png',
        'unit_templar':
            'chevalier_confrere_age_2.png#chevalier_confrere_age_3.png#chevalier_confrere_age_4.png#condottiere.png#genitour_age_3.png#genitour_age_4.png#genoese_crossbowman_age_3.png#genoese_crossbowman_age_4.png#heavy_spearman_age_3.png#heavy_spearman_age_4.png#hospitaller_knight_age_2.png#hospitaller_knight_age_3.png#hospitaller_knight_age_4.png#king_baldwin_iv.png#odo_of_st_amand.png#pilgrim.png#serjeant_age_2.png#serjeant_age_3.png#serjeant_age_4.png#szlachta_age_4.png#templar_brother_age_3.png#templar_brother_age_4.png#teutonic_knight.png#venetian_galley.png',
        'unit_worker':
            'monk-3.png#trader.png#villager-abbasid.png#villager-china.png#villager-delhi.png#villager-japanese.png#villager-malians.png#villager-mongols.png#villager-ottomans.png#villager.png',
        'unit_zhuxi': 'imperial-guard-1.png#shaolin-monk-3.png#yuan-raider-4.png'
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
    new SinglePanelColumn('population_count', game + 'building_economy/house.png'),
    new SinglePanelColumn('villager_count', game + 'unit_worker/villager.png'),
    new SinglePanelColumn('resources/food', resource + 'resource_food.png'),
    new SinglePanelColumn('resources/wood', resource + 'resource_wood.png'),
    new SinglePanelColumn('resources/gold', resource + 'resource_gold.png'),
    new SinglePanelColumn('resources/stone', resource + 'resource_stone.png'),
    new SinglePanelColumn('resources/builder', resource + 'repair.png')
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
    [-1, '?', 'age/age_unknown.png'], [1, 'DAR', 'age/age_1.png'], [2, 'FEU', 'age/age_2.png'],
    [3, 'CAS', 'age/age_3.png'], [4, 'IMP', 'age/age_4.png']
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
    new SinglePanelColumn('population_count', game + 'building_economy/house.png'),
    new SinglePanelColumn('villager_count', game + 'unit_worker/villager.png'),
    new SinglePanelColumn('resources/builder', resource + 'repair.png'),
    new SinglePanelColumn('resources/food', resource + 'resource_food.png'),
    new SinglePanelColumn('resources/wood', resource + 'resource_wood.png'),
    new SinglePanelColumn('resources/gold', resource + 'resource_gold.png'),
    new SinglePanelColumn('resources/stone', resource + 'resource_stone.png')
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
      1: getBOImageHTML(game + 'age/age_1.png') + 'Dark Age',
      2: getBOImageHTML(game + 'age/age_2.png') + 'Feudal Age',
      3: getBOImageHTML(game + 'age/age_3.png') + 'Castle Age',
      4: getBOImageHTML(game + 'age/age_4.png') + 'Imperial Age'
    }
  };
  // Header for first line
  sectionsHeader['first_line'] = sectionsHeader.before;

  // Feed game description to generic function
  openSinglePanelPageFromDescription(columnsDescription, sectionsHeader);
}
