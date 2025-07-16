// -- Age of Empires -- //

/**
 * Check if only one specified civilization is present, for AoE games.
 *
 * @param {string} civilizationName  Requested civilization name.
 *
 * @returns true if only one specified civilization is present.
 */
function checkOnlyCivilizationAoE(civilizationName) {
  const civilizationData = dataBO['civilization'];
  if (Array.isArray(civilizationData)) {
    return civilizationData.toString() === [civilizationName].toString();
  } else {
    return civilizationData === civilizationName;
  }
}


// -- Age of Empires II (AoE2) -- //

/**
 * Get the main HTML content of the resource line (excluding timing) for AoE2.
 *
 * @param {int} currentStep  Requested step for the BO resource line.
 *
 * @returns HTML code corresponding to the requested line.
 */
function getResourceLineAoE2(currentStep) {
  let htmlString = '';

  // Folders with requested pictures
  const gamePicturesFolder = 'assets/' + gameName + '/';
  const resourceFolder = gamePicturesFolder + 'resource/';

  const resources = currentStep.resources;

  htmlString += getBOImageValue(resourceFolder + 'Aoe2de_wood.png', resources, 'wood');
  htmlString += getBOImageValue(resourceFolder + 'Aoe2de_food.png', resources, 'food');
  htmlString += getBOImageValue(resourceFolder + 'Aoe2de_gold.png', resources, 'gold');
  htmlString += getBOImageValue(resourceFolder + 'Aoe2de_stone.png', resources, 'stone');
  htmlString += getBOImageValue(resourceFolder + 'Aoe2de_hammer.png', resources, 'builder', true);
  htmlString +=
      getBOImageValue(resourceFolder + 'MaleVillDE_alpha.png', currentStep, 'villager_count', true);

  // Age image
  const ageImage = {
    1: 'DarkAgeIconDE_alpha.png',
    2: 'FeudalAgeIconDE_alpha.png',
    3: 'CastleAgeIconDE_alpha.png',
    4: 'ImperialAgeIconDE_alpha.png'
  };

  if (currentStep.age in ageImage) {
    htmlString += getBOImageHTML(gamePicturesFolder + 'age/' + ageImage[currentStep.age]);
  }

  return htmlString;
}

/**
 * Check if the build order is valid, for AoE2.
 *
 * @param {boolean} nameBOMessage  true to add the BO name in the error message.
 *
 * @returns Array of size 2:
 *              0: true if valid build order, false otherwise.
 *              1: String indicating the error (empty if no error).
 */
function checkValidBuildOrderAoE2(nameBOMessage) {
  let BONameStr = '';

  try {
    if (nameBOMessage) {
      BONameStr = dataBO['name'] + ' | ';
    }

    // Check correct civilization
    const validFactionRes = checkValidFaction(BONameStr, 'civilization', false);
    if (!validFactionRes[0]) {
      return validFactionRes;
    }

    fields = [
      new FieldDefinition('villager_count', 'integer', true),
      new FieldDefinition('age', 'integer', true, null, [-Infinity, 4]),
      new FieldDefinition('wood', 'integer', true, 'resources'),
      new FieldDefinition('food', 'integer', true, 'resources'),
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
 * Get one step of the AoE2 build order (template).
 *
 * @param {Array} buildOrderData  Array with the build order step, null for default values.
 * @param {int} copyStepID       ID of the step to copy, -1 for last step.
 *
 * @returns Dictionary with the build order step template.
 */
function getBOStepAoE2(buildOrderData, copyStepID = -1) {
  if (buildOrderData && buildOrderData.length >= 1) {
    // Selected step or last step data (if not valid index)
    const data = (0 <= copyStepID && copyStepID < buildOrderData.length) ?
        buildOrderData[copyStepID] :
        buildOrderData.at(-1);
    return {
      'villager_count': ('villager_count' in data) ? data['villager_count'] : 0,
      'age': ('age' in data) ? data['age'] : 1,
      'resources': ('resources' in data) ? data['resources'] :
                                           {'wood': 0, 'food': 0, 'gold': 0, 'stone': 0},
      'notes': ['Note']
    };
  } else {
    return {
      'villager_count': 0,
      'age': 1,
      'resources': {'wood': 0, 'food': 0, 'gold': 0, 'stone': 0},
      'notes': ['Note']
    };
  }
}

/**
 * Get the AoE2 build order template (reset build order).
 *
 * @returns Dictionary with the build order template.
 */
function getBOTemplateAoE2() {
  return {
    'name': 'Build order name',
    'civilization': 'Generic',
    'author': 'Author',
    'source': 'Source',
    'build_order': [getBOStepAoE2(null)]
  };
}

/**
 * Get the AoE2 villager creation time.
 *
 * @param {Object} civilizationFlags  Dictionary with the civilization flags.
 * @param {int} currentAge            Current age (1: Dark Age, 2: Feudal...).
 *
 * @returns Villager creation time [sec].
 */
function getVillagerTimeAoE2(civilizationFlags, currentAge) {
  console.assert(1 <= currentAge && currentAge <= 4, 'Age expected in [1;4].');
  const genericTime = 25.0;
  if (civilizationFlags['Persians']) {
    return genericTime / (1.0 + 0.05 * currentAge);  // 5%/10%/15%/20% faster
  } else {                                           // generic
    return genericTime;
  }
}

/**
 * Get the research time to reach the next age, for AoE2.
 *
 * @param {Object} civilizationFlags  Dictionary with the civilization flags.
 * @param {int} currentAge            Current age (1: Dark Age, 2: Feudal...).
 *
 * @returns Requested age up time [sec].
 */
function getResearchAgeUpTimeAoE2(civilizationFlags, currentAge) {
  console.assert(1 <= currentAge && currentAge <= 3, 'Age expected in [1;3].');

  let genericTime = 190.0;  // # Imperial age up
  if (currentAge === 1) {   // Feudal age up
    genericTime = 130.0;
  } else if (currentAge === 2) {  // Castle age up
    genericTime = 160.0;
  }

  if (civilizationFlags['Persians']) {
    return genericTime / (1.0 + 0.05 * currentAge);  // 5%/10%/15%/20% faster
  } else if (civilizationFlags['Malay']) {
    return genericTime / 1.66;  // 66% faster
  } else {
    return genericTime;
  }
}

/**
 * Get the loom research time, for AoE2.
 *
 * @param {Object} civilizationFlags  Dictionary with the civilization flags.
 * @param {int} currentAge            Current age (1: Dark Age, 2: Feudal...).
 *
 * @returns Loom research time [sec].
 */
function getLoomTimeAoE2(civilizationFlags, currentAge) {
  console.assert(1 <= currentAge && currentAge <= 4, 'Age expected in [1;4].');
  const genericTime = 25.0;
  if (civilizationFlags['Persians']) {
    return genericTime / (1.0 + 0.05 * currentAge);  // 5%/10%/15%/20% faster
  } else if (civilizationFlags['Goths']) {
    return 0.0;  // instantaneous
  } else if (civilizationFlags['Portuguese']) {
    return genericTime / 1.25;  // 25% faster
  } else {
    return genericTime;
  }
}

/**
 * Get the wheelbarrow/handcart research time, for AoE2.
 *
 * @param {Object} civilizationFlags  Dictionary with the civilization flags.
 * @param {int} currentAge            Current age (1: Dark Age, 2: Feudal...).
 * @param {boolean} wheelbarrowFlag   true: wheelbarrow / false: handcart.
 *
 * @returns Requested research time [sec].
 */
function getWheelbarrowHandcartTimeAoE2(civilizationFlags, currentAge, wheelbarrowFlag) {
  console.assert(1 <= currentAge && currentAge <= 4, 'Age expected in [1;4].');
  const genericTime = wheelbarrowFlag ? 75.0 : 55.0;
  if (civilizationFlags['Persians']) {
    return genericTime / (1.0 + 0.05 * currentAge);  // 5%/10%/15%/20% faster
  } else if (civilizationFlags['Vietnamese']) {
    return genericTime / 2.0;  // 100% faster
  } else if (civilizationFlags['Vikings']) {
    return 0.0;  // free & instantaneous
  } else if (civilizationFlags['Portuguese']) {
    return genericTime / 1.25;  // 25% faster
  } else {
    return genericTime;
  }
}

/**
 * Get the town watch/patrol research time, for AoE2.
 *
 * @param {Object} civilizationFlags  Dictionary with the civilization flags.
 * @param {int} currentAge            Current age (1: Dark Age, 2: Feudal...).
 * @param {boolean} townWatchFlag     true: town watch / false: town patrol.
 *
 * @returns Requested research time [sec].
 */
function getTownWatchPatrolTimeAoE2(civilizationFlags, currentAge, townWatchFlag) {
  console.assert(1 <= currentAge && currentAge <= 4, 'Age expected in [1;4].');
  const genericTime = townWatchFlag ? 25.0 : 40.0;
  if (civilizationFlags['Persians']) {
    return genericTime / (1.0 + 0.05 * currentAge);  // 5%/10%/15%/20% faster
  } else if (civilizationFlags['Byzantines']) {
    return 0.0;  // free & instantaneous
  } else if (civilizationFlags['Portuguese']) {
    return genericTime / 1.25;  // 25% faster
  } else {
    return genericTime;
  }
}

/**
 * Get the research time for a given Town Center technology, for AoE2.
 *
 * @param {string} technologyName     Name of the requested technology.
 * @param {Object} civilizationFlags  Dictionary with the civilization flags.
 * @param {int} currentAge            Current age (1: Dark Age, 2: Feudal...).
 *
 * @returns Requested research time [sec].
 */
function getTownCenterResearchTimeAoE2(technologyName, civilizationFlags, currentAge) {
  if (technologyName === 'loom') {
    return getLoomTimeAoE2(civilizationFlags, currentAge);
  } else if (technologyName === 'wheelbarrow') {
    return getWheelbarrowHandcartTimeAoE2(civilizationFlags, currentAge, true);
  } else if (technologyName === 'handcart') {
    return getWheelbarrowHandcartTimeAoE2(civilizationFlags, currentAge, false);
  } else if (technologyName === 'town_watch') {
    return getTownWatchPatrolTimeAoE2(civilizationFlags, currentAge, true);
  } else if (technologyName === 'town_patrol') {
    return getTownWatchPatrolTimeAoE2(civilizationFlags, currentAge, false);
  } else {
    console.log('Warning: unknown TC technology name \'' + technologyName + '\'.');
    return 0.0;
  }
}

/**
 * Evaluate the time indications for an AoE2 build order.
 *
 * @param {int} timeOffset  Offset to add on the time outputs [sec].
 */
function evaluateBOTimingAoE2(timeOffset) {
  // Specific civilization flags
  civilizationFlags = {
    'Bengalis': checkOnlyCivilizationAoE('Bengalis'),
    'Chinese': checkOnlyCivilizationAoE('Chinese'),
    'Goths': checkOnlyCivilizationAoE('Goths'),
    'Malay': checkOnlyCivilizationAoE('Malay'),
    'Mayans': checkOnlyCivilizationAoE('Mayans'),
    'Persians': checkOnlyCivilizationAoE('Persians'),
    'Portuguese': checkOnlyCivilizationAoE('Portuguese'),
    'Vietnamese': checkOnlyCivilizationAoE('Vietnamese'),
    'Vikings': checkOnlyCivilizationAoE('Vikings')
  }

  // Starting villagers
  let lastVillagerCount = 3;
  if (civilizationFlags['Chinese']) {
    lastVillagerCount = 6;
  } else if (civilizationFlags['Mayans']) {
    lastVillagerCount = 4;
  }

  let currentAge = 1  // Current age (1: Dark Age, 2: Feudal Age...)

  // TC technologies to research
  TCTechnologies = {
    'loom': {'researched': false, 'image': 'town_center/LoomDE.png'},
    'wheelbarrow': {'researched': false, 'image': 'town_center/WheelbarrowDE.png'},
    'handcart': {'researched': false, 'image': 'town_center/HandcartDE.png'},
    'town_watch': {'researched': false, 'image': 'town_center/TownWatchDE.png'},
    'town_patrol': {'researched': false, 'image': 'town_center/TownPatrolDE.png'}
  };

  let lastTimeSec = timeOffset;  // time of the last step

  if (!('build_order' in dataBO)) {
    console.log(
        'Warning: the "build_order" field is missing from data when evaluating the timing.');
    return;
  }

  const buildOrderData = dataBO['build_order'];
  const stepCount = buildOrderData.length;

  let nextAgeFlag = false;  // true when next age is being researched

  // Loop on all the build order steps
  for (const [currentStepID, currentStep] of enumerate(buildOrderData)) {
    stepTotalTime = 0.0;  // total time for this step

    // Villager count
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

    stepTotalTime += updateVillagerCount * getVillagerTimeAoE2(civilizationFlags, currentAge);

    // Next age
    const nextAge =
        (1 <= currentStep['age'] && currentStep['age'] <= 4) ? currentStep['age'] : currentAge;
    if (nextAge === currentAge + 1)  // researching next age up
    {
      stepTotalTime += getResearchAgeUpTimeAoE2(civilizationFlags, currentAge);
      nextAgeFlag = true;
    } else if (nextAgeFlag) {  // age up was just researched the step before
      if (civilizationFlags['Bengalis']) {
        // Spawn 2 villagers when reaching next age
        stepTotalTime -= 2 * getVillagerTimeAoE2(civilizationFlags, currentAge);
      }
      nextAgeFlag = false;
    }

    // Check for TC technologies in notes
    for (const note of currentStep['notes']) {
      for (const [technologyName, technologyData] of Object.entries(TCTechnologies)) {
        if ((!technologyData['researched']) &&
            (note.includes('@' + technologyData['image'] + '@'))) {
          stepTotalTime +=
              getTownCenterResearchTimeAoE2(technologyName, civilizationFlags, currentAge);
          technologyData['researched'] = true;
        }
      }
    }

    // Update time
    lastTimeSec += stepTotalTime;

    currentAge = nextAge;  // current age update

    // Update build order with time
    currentStep['time'] = buildOrderTimeToStr(Math.round(lastTimeSec));

    // Special case for last step (add 1 sec to avoid displaying both at the
    // same time)
    if ((currentStepID === stepCount - 1) && (stepCount >= 2) &&
        (currentStep['time'] === buildOrderData[currentStepID - 1]['time'])) {
      currentStep['time'] = buildOrderTimeToStr(Math.round(lastTimeSec + 1.0));
    }
  }
}

/**
 * Get the images available for AoE2, sorted by sub-folder.
 *
 * @returns Dictionary with all the images per sub-folder.
 */
function getImagesAoE2() {
  // This is obtained using the 'python/utilities/list_images.py' script.
  let imagesDict =
      {
        'age':
            'AgeUnknown.png#CastleAgeIconDE.png#CastleAgeIconDE_alpha.png#DarkAgeIconDE.png#DarkAgeIconDE_alpha.png#FeudalAgeIconDE.png#FeudalAgeIconDE_alpha.png#ImperialAgeIconDE.png#ImperialAgeIconDE_alpha.png',
        'animal':
            'AoE2DE_ingame_goose_icon.png#AoE2DE_ingame_ibex_icon.png#AoE2_DE_box_turtles_icon.png#AoE2_DE_dolphin_icon.png#AoE2_DE_dorado_icon.png#AoE2_DE_marlin_icon.png#AoE2_DE_perch_icon.png#AoE2_DE_salmon_icon.png#AoE2_DE_shore_fish_icon.png#AoE2_DE_snapper_icon.png#AoE2_DE_tuna_icon.png#Boar_aoe2DE.png#CowDE.png#Deer_aoe2DE.png#Elephant_aoe2DE.png#Goat_aoe2DE.png#Llama_aoe2DE.png#Ostrich_icon_aoe2de.png#Pig_aoe2DE.png#Rhinoceros_aoe2DE.png#Sheep_aoe2DE.png#Turkey_aoe2DE.png#Wild_Chicken.png#Yak_aoe2DE.png#Zebra_aoe2DE.png',
        'archery_range':
            'Aoe2de_DOI_elephant_archer_icon.png#ArbalestDE.png#Arbalester_aoe2DE.png#Archery_range_aoe2DE.png#Archer_aoe2DE.png#Cavalryarcher_aoe2DE.png#Crossbowman_aoe2DE.png#ElephantArcherIcon-DE.png#Elite_skirmisher_aoe2DE.png#Hand_cannoneer_aoe2DE.png#Heavycavalryarcher_aoe2de.png#ImperialSkirmisherUpgDE.png#ParthianTacticsDE.png#Skirmisher_aoe2DE.png#ThumbRingDE.png#Heavy-cavalry-archer-resear.jpg',
        'barracks':
            'Aoe2-infantry-2-pikeman.png#ArsonDE.png#Barracks_aoe2DE.png#ChampionUpgDE.png#Champion_aoe2DE.png#Eaglescout_aoe2DE.png#EagleWarriorUpgDE.png#Eaglewarrior_aoe2DE.png#EliteEagleWarriorUpgDE.png#EliteEaglewarrior_aoe2DE.png#Elite_Fire_Lancer.png#Fire_Lancer.png#GambesonsDE.png#HalberdierDE.png#Halberdier_aoe2DE.png#LongSwordmanUpgDE.png#Longswordsman_aoe2DE.png#ManAtArmsUpgDE.png#Manatarms_aoe2DE.png#MilitiaDE.png#PikemanUpDE.png#Spearman_aoe2DE.png#SquiresDE.png#Suplliesicon.png#TwoHandedSwordsmanUpgDE.png#Twohanded_aoe2DE.png',
        'blacksmith':
            'Blacksmith_aoe2de.png#BlastFurnaceDE.png#BodkinArrowDE.png#BracerDE.png#ChainBardingDE.png#ChainMailArmorDE.png#FletchingDE.png#Forging_aoe2de.png#IronCastingDE.png#LeatherArcherArmorDE.png#PaddedArcherArmorDE.png#PlateBardingArmorDE.png#PlateMailArmorDE.png#RingArcherArmorDE.png#ScaleBardingArmorDE.png#ScaleMailArmorDE.png',
        'castle':
            'CastleAgeUnique.png#Castle_aoe2DE.png#ConscriptionDE.png#HoardingsDE.png#Petard_aoe2DE.png#SapperDE.png#SpiesDE.png#Trebuchet_aoe2DE.png#Unique-tech-imperial.jpg',
        'civilization':
            'CivIcon-Armenians.png#CivIcon-Aztecs.png#CivIcon-Bengalis.png#CivIcon-Berbers.png#CivIcon-Bohemians.png#CivIcon-Britons.png#CivIcon-Bulgarians.png#CivIcon-Burgundians.png#CivIcon-Burmese.png#CivIcon-Byzantines.png#CivIcon-Celts.png#CivIcon-Chinese.png#CivIcon-Cumans.png#CivIcon-Dravidians.png#CivIcon-Ethiopians.png#CivIcon-Franks.png#CivIcon-Georgians.png#CivIcon-Goths.png#CivIcon-Gurjaras.png#CivIcon-Hindustanis.png#CivIcon-Huns.png#CivIcon-Incas.png#CivIcon-Indians.png#CivIcon-Italians.png#CivIcon-Japanese.png#CivIcon-Jurchens.png#CivIcon-Khitans.png#CivIcon-Khmer.png#CivIcon-Koreans.png#CivIcon-Lithuanians.png#CivIcon-Magyars.png#CivIcon-Malay.png#CivIcon-Malians.png#CivIcon-Mayans.png#CivIcon-Mongols.png#CivIcon-Persians.png#CivIcon-Poles.png#CivIcon-Portuguese.png#CivIcon-Romans.png#CivIcon-Saracens.png#CivIcon-Shu.png#CivIcon-Sicilians.png#CivIcon-Slavs.png#CivIcon-Spanish.png#CivIcon-Tatars.png#CivIcon-Teutons.png#CivIcon-Turks.png#CivIcon-Vietnamese.png#CivIcon-Vikings.png#CivIcon-Wei.png#CivIcon-Wu.png#question_mark.png#question_mark_black.png',
        'defensive_structures':
            'Bombard_tower_aoe2DE.png#Donjon_aoe2DE.png#FortifiedWallDE.png#Gate_aoe2de.png#Krepost_aoe2de.png#Outpost_aoe2de.png#Palisade_gate_aoe2DE.png#Palisade_wall_aoe2de.png#Stone_wall_aoe2de.png#Tower_aoe2de.png',
        'dock':
            'Cannon_galleon_aoe2DE.png#CareeningDE.png#Demoraft_aoe2DE.png#Demoship_aoe2DE.png#Dock_aoe2de.png#Dragonship.png#DryDockDE.png#Elite-cannon-galleon-resear.png#Elite_cannon_galleon_aoe2de.png#Fastfireship_aoe2DE.png#Fireship_aoe2DE.png#Fire_galley_aoe2DE.png#FishingShipDE.png#Fish_trap_aoe2DE.png#GalleonUpgDE.png#Galleon_aoe2DE.png#Galley_aoe2DE.png#GillnetsDE.png#Heavydemoship_aoe2de.png#Lou_Chuan.png#ShipwrightDE.png#Trade_cog_aoe2DE.png#Transportship_aoe2DE.png#WarGalleyDE.png#War_galley_aoe2DE.png',
        'hero': 'Cao_Cao.png#Liu_Bei.png#Sun_Jian.png',
        'lumber_camp':
            'BowSawDE.png#DoubleBitAxe_aoe2DE.png#Lumber_camp_aoe2de.png#TwoManSawDE.png',
        'market':
            'BankingDE.png#CaravanDE.png#CoinageDE.png#GuildsDE.png#Market_aoe2DE.png#Tradecart_aoe2DE.png',
        'mill':
            'Aoe2-icon--folwark.png#CropRotationDE.png#Domestication.png#FarmDE.png#HeavyPlowDE.png#HorseCollarDE.png#Mill_aoe2de.png#Pastoralism.png#Pasture.png#Transhumance.png',
        'mining_camp':
            'GoldMiningDE.png#GoldShaftMiningDE.png#Mining_camp_aoe2de.png#StoneMiningDE.png#StoneShaftMiningDE.png',
        'monastery':
            'AtonementDE.png#BlockPrintingDE.png#FaithDE.png#FervorDE.png#FortifiedChurch.png#HerbalDE.png#HeresyDE.png#IlluminationDE.png#MonasteryAoe2DE.png#Monk_aoe2DE.png#RedemptionDE.png#SanctityDE.png#TheocracyDE.png',
        'other':
            'Ao2de_caravanserai_icon.png#Feitoria_aoe2DE.png#House_aoe2DE.png#MuleCart.png#Wonder_aoe2DE.png',
        'resource':
            'Aoe2de_food.png#Aoe2de_gold.png#Aoe2de_hammer.png#Aoe2de_stone.png#Aoe2de_wood.png#BerryBushDE.png#MaleVillDE_alpha.png#tree.png#FEMALEVILLDE.jpg#MaleVillDE.jpg#villager.jpg',
        'siege_workshop':
            'AoE2DE_Armored_Elephant_icon.png#AoE2DE_Siege_Elephant_icon.png#Battering_ram_aoe2DE.png#Bombard_cannon_aoe2DE.png#CappedRamDE.png#Capped_ram_aoe2DE.png#HeavyScorpionDE.png#Heavyscorpion_aoe2DE.png#Heavy_Rocket_Cart.png#Mangonel_aoe2DE.png#OnagerDE.png#Onager_aoe2DE.png#Rocket_Cart.png#Scorpion_aoe2DE.png#SiegeOnagerDE.png#Siegetower_aoe2DE.png#Siege_onager_aoe2DE.png#Siege_ram_aoe2DE.png#Siege_workshop_aoe2DE.png#Traction_Trebuchet.png#Siege-ram-research.jpg',
        'stable':
            'Aoe2de_camel_scout.png#Aoe2_heavycamelriderDE.png#Battle_elephant_aoe2DE.png#BloodlinesDE.png#Camelrider_aoe2DE.png#Cavalier_aoe2DE.png#EliteBattleElephantUpg.png#Elitesteppelancericon.png#EliteSteppeLancerUpgDE.png#Elite_battle_elephant_aoe2DE.png#HeavyCamelUpgDE.png#Heavy_Hei_Guang_Cavalry.png#Hei_Guang_Cavalry.png#HusbandryDE.png#Hussar_aoe2DE.png#Hussar_upgrade_aoe2de.png#Knight_aoe2DE.png#Lightcavalry_aoe2DE.png#Paladin_aoe2DE.png#Scoutcavalry_aoe2DE.png#Stable_aoe2DE.png#Steppelancericon.png#Winged-hussar_upgrade.png#Cavalier-research.jpg#Light-cavalry-research.jpg#Paladin-research.jpg',
        'town_center':
            'HandcartDE.png#LoomDE.png#Towncenter_aoe2DE.png#TownPatrolDE.png#TownWatchDE.png#WheelbarrowDE.png',
        'unique_unit':
            'Aoe2-icon--houfnice.png#Aoe2-icon--obuch.png#Aoe2-icon-coustillier.png#Aoe2-icon-flemish-militia.png#Aoe2-icon-hussite-wagon.png#Aoe2-icon-serjeant.png#Aoe2de_camel_scout.png#Aoe2de_Chakram.png#Aoe2de_Ghulam.png#Aoe2de_ratha_ranged.png#Aoe2de_shrivamsha_rider.png#Aoe2de_Thirisadai.png#Aoe2de_Urumi.png#Arambaiicon-DE.png#Ballistaelephanticon-DE.png#BerserkIcon-DE.png#BoyarIcon-DE.png#CamelArcherIcon-DE.png#CaravelIcon-DE.png#CataphractIcon-DE.png#Centurion-DE.png#ChukoNuIcon-DE.png#CompositeBowman.png#CondottieroIcon-DE.png#ConquistadorIcon-DE.png#Dromon-DE.png#Fire_Archer.png#Flaming_camel_icon.png#GbetoIcon-DE.png#GenitourIcon-DE.png#GenoeseCrossbowmanIcon-DE.png#Grenadier.png#HuskarlIcon-DE.png#ImperialCamelRiderIcon-DE.png#Imperialskirmishericon-DE.png#Iron_Pagoda.png#JaguarWarriorIcon-DE.png#JanissaryIcon-DE.png#Jian_Swordsman_strong.png#KamayukIcon-DE.png#Karambitwarrioricon-DE.png#Keshikicon.png#Kipchakicon.png#Konnikicon.png#Legionary-DE.png#Leitisicon.png#Liao_Dao.png#LongboatIcon-DE.png#LongbowmanIcon-DE.png#MagyarHuszarIcon-DE.png#MamelukeIcon-DE.png#MangudaiIcon-DE.png#MissionaryIcon-DE.png#Mounted_Trebuchet.png#OrganGunIcon-DE.png#PlumedArcherIcon-DE.png#Rattanarchericon-DE.png#SamuraiIcon-DE.png#Shotelwarrioricon-DE.png#SlingerIcon-DE.png#TarkanIcon-DE.png#TeutonicKnightIcon-DE.png#ThrowingAxemanIcon-DE.png#Tiger_Cavalry.png#TurtleShipIcon-DE.png#WarElephantIcon-DE.png#WarWagonIcon-DE.png#War_Chariot.png#White_Feather_Guard.png#WoadRaiderIcon-DE.png#Xianbei_Raider.png#Monaspa.jpg#WarriorPriest.jpg',
        'university':
            'ArchitectureDE.png#ArrowSlitsDE.png#BallisticsDE.png#BombardTower_aoe2DE.png#ChemistryDE.png#FortifiedWallDE.png#HeatedShotDE.png#Masonry_aoe2de.png#MurderHolesDE.png#SiegeEngineersDE.png#Tower_aoe2de.png#TreadmillCraneDE.png#University_AoE2_DE.png'
      };

  // Split each string (e.g. 'image_0#image_1#image_2') in a list of images.
  for (const [key, value] of Object.entries(imagesDict)) {
    imagesDict[key] = value.split('#');
  }

  return imagesDict;
}

/**
 * Get the factions with 3 letters shortcut and icon, for AoE2.
 *
 * @returns Dictionary with faction name as key, and its 3 letters + image as value.
 */
function getFactionsAoE2() {
  // AoE2 civilization Icons (with 3 letters shortcut)
  return {
    'Generic': ['GEN', 'question_mark_black.png'],
    'Armenians': ['ARM', 'CivIcon-Armenians.png'],
    'Aztecs': ['AZT', 'CivIcon-Aztecs.png'],
    'Bengalis': ['BEN', 'CivIcon-Bengalis.png'],
    'Berbers': ['BER', 'CivIcon-Berbers.png'],
    'Bohemians': ['BOH', 'CivIcon-Bohemians.png'],
    'Britons': ['BRI', 'CivIcon-Britons.png'],
    'Burgundians': ['BUG', 'CivIcon-Burgundians.png'],
    'Bulgarians': ['BUL', 'CivIcon-Bulgarians.png'],
    'Burmese': ['BUM', 'CivIcon-Burmese.png'],
    'Byzantines': ['BYZ', 'CivIcon-Byzantines.png'],
    'Celts': ['CEL', 'CivIcon-Celts.png'],
    'Chinese': ['CHI', 'CivIcon-Chinese.png'],
    'Cumans': ['CUM', 'CivIcon-Cumans.png'],
    'Dravidians': ['DRA', 'CivIcon-Dravidians.png'],
    'Ethiopians': ['ETH', 'CivIcon-Ethiopians.png'],
    'Franks': ['FRA', 'CivIcon-Franks.png'],
    'Georgians': ['GEO', 'CivIcon-Georgians.png'],
    'Goths': ['GOT', 'CivIcon-Goths.png'],
    'Gurjaras': ['GUR', 'CivIcon-Gurjaras.png'],
    'Hindustanis': ['HIN', 'CivIcon-Hindustanis.png'],
    'Huns': ['HUN', 'CivIcon-Huns.png'],
    'Incas': ['INC', 'CivIcon-Incas.png'],
    'Italians': ['ITA', 'CivIcon-Italians.png'],
    'Japanese': ['JAP', 'CivIcon-Japanese.png'],
    'Jurchens': ['JUR', 'CivIcon-Jurchens.png'],
    'Khitans': ['KHI', 'CivIcon-Khitans.png'],
    'Khmer': ['KHM', 'CivIcon-Khmer.png'],
    'Koreans': ['KOR', 'CivIcon-Koreans.png'],
    'Lithuanians': ['LIT', 'CivIcon-Lithuanians.png'],
    'Magyars': ['MAG', 'CivIcon-Magyars.png'],
    'Mayans': ['MAY', 'CivIcon-Mayans.png'],
    'Malay': ['MLA', 'CivIcon-Malay.png'],
    'Malians': ['MLI', 'CivIcon-Malians.png'],
    'Mongols': ['MON', 'CivIcon-Mongols.png'],
    'Persians': ['PER', 'CivIcon-Persians.png'],
    'Poles': ['POL', 'CivIcon-Poles.png'],
    'Portuguese': ['POR', 'CivIcon-Portuguese.png'],
    'Romans': ['ROM', 'CivIcon-Romans.png'],
    'Saracens': ['SAR', 'CivIcon-Saracens.png'],
    'Shu': ['SHU', 'CivIcon-Shu.png'],
    'Sicilians': ['SIC', 'CivIcon-Sicilians.png'],
    'Slavs': ['SLA', 'CivIcon-Slavs.png'],
    'Spanish': ['SPA', 'CivIcon-Spanish.png'],
    'Tatars': ['TAT', 'CivIcon-Tatars.png'],
    'Teutons': ['TEU', 'CivIcon-Teutons.png'],
    'Turks': ['TUR', 'CivIcon-Turks.png'],
    'Vietnamese': ['VIE', 'CivIcon-Vietnamese.png'],
    'Vikings': ['VIK', 'CivIcon-Vikings.png'],
    'Wei': ['WEI', 'CivIcon-Wei.png'],
    'Wu': ['WU', 'CivIcon-Wu.png']
  };
}

/**
 * Get the folder containing the faction images, for AoE2.
 *
 * @returns Requested folder name.
 */
function getFactionImagesFolderAoE2() {
  return 'civilization';
}

/**
 * Get the instructions for AoE2.
 *
 * @returns Requested instructions.
 */
function getInstructionsAoE2() {
  const externalBOLines = [
    'In the <b>From external website</b> section, you can get many build orders with the requested format from',
    'buildorderguide.com (you can use the shortcut on the left). Select a build order on buildorderguide.com,',
    'click on \'Copy to clipboard for RTS Overlay\', then paste the content in the text panel below.'
  ];
  return contentArrayToDiv(getArrayInstructions(externalBOLines));
}

/**
 * Get HTML code for the visual editor sample, for AoE2.
 *
 * @returns HTML code
 */
function getVisualEditorAoE2() {
  // Image folders
  const common = 'assets/common/';
  const game = 'assets/' + gameName + '/';
  const resource = game + '/resource/';

  // Description for each column
  let columnsDescription = [
    new SinglePanelColumn('age'), new SinglePanelColumn('time', common + 'icon/time.png'),
    new SinglePanelColumn('villager_count', resource + 'MaleVillDE_alpha.png'),
    new SinglePanelColumn('resources/wood', resource + 'Aoe2de_wood.png'),
    new SinglePanelColumn('resources/food', resource + 'Aoe2de_food.png'),
    new SinglePanelColumn('resources/gold', resource + 'Aoe2de_gold.png'),
    new SinglePanelColumn('resources/stone', resource + 'Aoe2de_stone.png'),
    new SinglePanelColumn('resources/builder', resource + 'Aoe2de_hammer.png')
  ];

  columnsDescription[0].text = 'Age';                       // age selection
  columnsDescription[0].isSelectwidget = true;              // age selection
  columnsDescription[1].italic = true;                      // time
  columnsDescription[1].optional = true;                    // time
  columnsDescription[2].bold = true;                        // villager count
  columnsDescription[2].backgroundColor = [50, 50, 50];     // villager count
  columnsDescription[3].backgroundColor = [94, 72, 56];     // wood
  columnsDescription[4].backgroundColor = [153, 94, 89];    // food
  columnsDescription[5].backgroundColor = [135, 121, 78];   // gold
  columnsDescription[6].backgroundColor = [100, 100, 100];  // stone
  columnsDescription[7].optional = true;                    // builder

  columnsDescription[1].tooltip = 'step end time as \'x:yy\'';  // time
  columnsDescription[2].tooltip = 'number of villagers';        // villager count
  columnsDescription[3].tooltip = 'villagers on wood';          // wood
  columnsDescription[4].tooltip = 'villagers on food';          // food
  columnsDescription[5].tooltip = 'villagers on gold';          // gold
  columnsDescription[6].tooltip = 'villagers on stone';         // stone
  columnsDescription[7].tooltip = 'number of builders';         // builder

  // Show only positive characters for resources
  for (let i = 2; i <= 7; i++) {
    columnsDescription[i].isIntegerInRawBO = true;
    columnsDescription[i].showOnlyPositive = true;
  }
  columnsDescription[0].isIntegerInRawBO = true;  // age selection

  // Age selection
  visualEditortableWidgetDescription = [
    [-1, '?', 'age/AgeUnknown.png'], [1, 'DAR', 'age/DarkAgeIconDE_alpha.png'],
    [2, 'FEU', 'age/FeudalAgeIconDE_alpha.png'], [3, 'CAS', 'age/CastleAgeIconDE_alpha.png'],
    [4, 'IMP', 'age/ImperialAgeIconDE_alpha.png']
  ];

  return getVisualEditorFromDescription(columnsDescription);
}

/**
 * Open a new page displaying the full BO in a single panel, for AoE2.
 */
function openSinglePanelPageAoE2() {
  // Image folders
  const common = 'assets/common/';
  const game = 'assets/' + gameName + '/';
  const resource = game + '/resource/';

  // Description for each column
  let columnsDescription = [
    new SinglePanelColumn('time', common + 'icon/time.png'),
    new SinglePanelColumn('villager_count', resource + 'MaleVillDE_alpha.png'),
    new SinglePanelColumn('resources/builder', resource + 'Aoe2de_hammer.png'),
    new SinglePanelColumn('resources/wood', resource + 'Aoe2de_wood.png'),
    new SinglePanelColumn('resources/food', resource + 'Aoe2de_food.png'),
    new SinglePanelColumn('resources/gold', resource + 'Aoe2de_gold.png'),
    new SinglePanelColumn('resources/stone', resource + 'Aoe2de_stone.png')
  ];

  columnsDescription[0].italic = true;                      // time
  columnsDescription[0].hideIfAbsent = true;                // time
  columnsDescription[0].textAlign = 'right';                // time
  columnsDescription[1].bold = true;                        // villager count
  columnsDescription[2].hideIfAbsent = true;                // builder
  columnsDescription[3].backgroundColor = [94, 72, 56];     // wood
  columnsDescription[4].backgroundColor = [153, 94, 89];    // food
  columnsDescription[5].backgroundColor = [135, 121, 78];   // gold
  columnsDescription[6].backgroundColor = [100, 100, 100];  // stone

  // all columns, except time
  for (let i = 1; i <= 6; i++) {
    columnsDescription[i].displayIfPositive = true;
  }

  // Sections Header
  const topArrow = getBOImageHTML(common + 'icon/top_arrow.png');
  const sectionsHeader = {
    'key': 'age',  // Key to look for
    // Header before the current row
    'before': {
      2: topArrow + 'Aging up to Feudal Age',
      3: topArrow + 'Aging up to Castle Age',
      4: topArrow + 'Aging up to Imperial Age'
    },
    // Header after the current row
    'after': {
      1: getBOImageHTML(game + 'age/DarkAgeIconDE_alpha.png') + 'Dark Age',
      2: getBOImageHTML(game + 'age/FeudalAgeIconDE_alpha.png') + 'Feudal Age',
      3: getBOImageHTML(game + 'age/CastleAgeIconDE_alpha.png') + 'Castle Age',
      4: getBOImageHTML(game + 'age/ImperialAgeIconDE_alpha.png') + 'Imperial Age'
    }
  };
  // Header for first line
  sectionsHeader['first_line'] = sectionsHeader.after;

  // Feed game description to generic function
  openSinglePanelPageFromDescription(columnsDescription, sectionsHeader);
}
