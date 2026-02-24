// -- WarCraft III (WC3) -- //

/**
 * Get the main HTML content of the resource line (excluding timing) for WC3.
 *
 * @param {int} currentStep  Requested step for the BO resource line.
 *
 * @returns HTML code corresponding to the requested line.
 */
function getResourceLineWC3(currentStep) {
  let htmlString = '';

  // Folders with requested pictures
  const gamePicturesFolder = 'assets/' + gameName + '/';
  const resourceFolder = gamePicturesFolder + 'resource/';

  htmlString += getBOImageValue(resourceFolder + 'gold.webp', currentStep, 'gold', true);
  htmlString += getBOImageValue(resourceFolder + 'lumber.webp', currentStep, 'lumber', true);
  htmlString += getBOImageValue(resourceFolder + 'food.webp', currentStep, 'food', true);

  return htmlString;
}

/**
 * Check if the build order is valid, for WC3.
 *
 * @param {boolean} nameBOMessage  true to add the BO name in the error message.
 *
 * @returns Array of size 2:
 *              0: true if valid build order, false otherwise.
 *              1: String indicating the error (empty if no error).
 */
function checkValidBuildOrderWC3(nameBOMessage) {
  let BONameStr = '';

  try {
    if (nameBOMessage) {
      BONameStr = dataBO['name'] + ' | ';
    }

    // Check correct race and opponent race
    const validRaceRes = checkValidFaction(BONameStr, 'race', true, false);
    if (!validRaceRes[0]) {
      return validRaceRes;
    }

    const validOpponentRaceRes = checkValidFaction(BONameStr, 'opponent_race', true);
    if (!validOpponentRaceRes[0]) {
      return validOpponentRaceRes;
    }

    fields = [
      new FieldDefinition('notes', 'array of strings', true),
      new FieldDefinition('time', 'string', false),
      new FieldDefinition('food', 'integer', false),
      new FieldDefinition('gold', 'integer', false),
      new FieldDefinition('lumber', 'integer', false),
    ];

    return checkValidSteps(BONameStr, fields);
  } catch (e) {
    return invalidMsg(BONameStr + e);
  }
}

/**
 * Get one step of the WC3 build order (template).
 *
 * @param {Array} buildOrderData  Array with the build order step, null for default values.
 * @param {int} copyStepID        ID of the step to copy, -1 for last step.
 *
 * @returns Dictionary with the build order step template.
 */
function getBOStepWC3(buildOrderData, copyStepID = -1) {
  if (buildOrderData && buildOrderData.length >= 1) {
    // Selected step or last step data (if not valid index)
    const data =
      0 <= copyStepID && copyStepID < buildOrderData.length
        ? buildOrderData[copyStepID]
        : buildOrderData.at(-1);
    return {
      food: 'food' in data ? data['food'] : -1,
      gold: 'gold' in data ? data['gold'] : -1,
      lumber: 'lumber' in data ? data['lumber'] : -1,
      notes: ['Note'],
    };
  } else {
    return { food: -1, gold: -1, lumber: -1, notes: ['Note'] };
  }
}

/**
 * Get the WC3 build order template (reset build order).
 *
 * @returns Dictionary with the build order template.
 */
function getBOTemplateWC3() {
  return {
    race: 'Humans',
    opponent_race: 'Any',
    name: 'Build order name',
    author: 'Author',
    source: 'Source',
    build_order: [getBOStepWC3(null)],
  };
}

/**
 * Get the images available for WC3, sorted by sub-folder.
 *
 * @returns Dictionary with all the images per sub-folder.
 */
function getImagesWC3() {
  // This is obtained using the 'python/utilities/list_images.py' script.
  let imagesDict = {
    human_building:
      'altar_of_kings.webp#arcane_sanctum.webp#arcane_vault.webp#barracks.webp#blacksmith.webp#farm.webp#gryphon_aviary.webp#lumber_mill.webp#scout_tower.webp#town_hall.webp#workshop.webp',
    human_hero: 'archmage.webp#blood_mage.webp#mountain_king.webp#paladin.webp',
    human_special: 'militia.webp#phoenix.webp#summon_water_elemental.webp',
    human_unit:
      'dragon_hawk_rider.webp#flying_machine.webp#footman.webp#gryphon_rider.webp#knight.webp#mortar_team.webp#peasant.webp#priest.webp#rifleman.webp#siege_engine.webp#sorceress.webp#spell_breaker.webp',
    night_elf_building:
      'altar_of_elders.webp#ancient_of_lore.webp#ancient_of_war.webp#ancient_of_wind.webp#ancient_of_wonders.webp#ancient_protector.webp#chimaera_roost.webp#hunters_hall.webp#moon_well.webp#tree_of_life.webp',
    night_elf_hero:
      'demon_hunter.webp#keeper_of_the_grove.webp#priestess_of_the_moon.webp#warden.webp',
    night_elf_special:
      'avatar_of_vengeance.webp#druid_of_the_claw.webp#druid_of_the_talon.webp#hippogryph_rider.webp#owl_scout.webp#spirit_of_vengeance.webp#treant.webp',
    night_elf_unit:
      'archer.webp#chimaera.webp#druid_of_the_claw.webp#druid_of_the_talon.webp#dryad.webp#faerie_dragon.webp#glaive_thrower.webp#hippogryph.webp#huntress.webp#mountain_giant.webp#wisp.webp',
    orc_building:
      'altar_of_storms.webp#barracks.webp#beastiary.webp#great_hall.webp#orc_burrow.webp#spirit_lodge.webp#tauren_totem.webp#voodoo_lounge.webp#war_mill.webp#watch_tower.webp',
    orc_hero: 'blademaster.webp#far_seer.webp#shadow_hunter.webp#tauren_chieftain.webp',
    orc_special: 'serpent_ward.webp#spirit_wolf.webp#troll_berserker.webp',
    orc_unit:
      'demolisher.webp#grunt.webp#kodo_beast.webp#peon.webp#raider.webp#shaman.webp#spirit_walker.webp#tauren.webp#troll_batrider.webp#troll_headhunter.webp#wind_rider.webp#witch_doctor.webp',
    race: 'dice.webp#human.webp#night_elf.webp#orc.webp#undead.webp',
    resource: 'food.webp#gold.webp#lumber.webp',
    undead_building:
      'altar_of_darkness.webp#boneyard.webp#crypt.webp#graveyard.webp#haunted_goldmine.webp#necropolis.webp#sacrificial_pit.webp#slaughter_house.webp#temple_of_the_damned.webp#tomb_of_relics.webp#ziggurat.webp',
    undead_hero: 'crypt_lord.webp#death_knight.webp#dread_lord.webp#lich.webp',
    undead_special:
      'carrion_beetle.webp#destroyer.webp#shade.webp#skeletal_mage.webp#skeleton_warrior.webp',
    undead_unit:
      'abomination.webp#acolyte.webp#banshee.webp#crypt_fiend.webp#frost_wyrm.webp#gargoyle.webp#ghoul.webp#meat_wagon.webp#necromancer.webp#obsidian_statue.webp',
  };

  // Split each string (e.g. 'image_0#image_1#image_2') in a list of images.
  for (const [key, value] of Object.entries(imagesDict)) {
    imagesDict[key] = value.split('#');
  }

  return imagesDict;
}

/**
 * Get the factions with 3 letters shortcut and icon, for WC3.
 *
 * @returns Dictionary with faction name as key, and its 3 letters + image as value.
 */
function getFactionsWC3() {
  return {
    Humans: ['HUM', 'human.webp'],
    Orcs: ['ORC', 'orc.webp'],
    'Night Elves': ['NIG', 'night_elf.webp'],
    Undead: ['UND', 'undead.webp'],
    Any: ['ANY', 'dice.webp'],
  };
}

/**
 * Get the folder containing the faction images, for WC3.
 *
 * @returns Requested folder name.
 */
function getFactionImagesFolderWC3() {
  return 'race';
}

/**
 * Get the instructions for WC3.
 *
 * @returns Requested instructions.
 */
function getInstructionsWC3() {
  return contentArrayToDiv(getArrayInstructions());
}

/**
 * Get HTML code for the visual editor sample, for WC3.
 *
 * @returns HTML code
 */
function getVisualEditorWC3() {
  // Image folders
  const common = 'assets/common/';
  const game = 'assets/' + gameName + '/';
  const resource = game + '/resource/';

  // Description for each column
  let columnsDescription = [
    new SinglePanelColumn('time', common + 'icon/time.webp'),
    new SinglePanelColumn('food', resource + 'food.webp'),
    new SinglePanelColumn('gold', resource + 'gold.webp'),
    new SinglePanelColumn('lumber', resource + 'lumber.webp'),
  ];

  columnsDescription[0].italic = true; // time
  columnsDescription[1].bold = true; // food
  columnsDescription[1].backgroundColor = [50, 50, 50]; // food
  columnsDescription[2].backgroundColor = [167, 115, 0]; // gold
  columnsDescription[3].backgroundColor = [80, 100, 0]; // lumber

  columnsDescription[0].tooltip = "step time as 'x:yy'"; // time
  columnsDescription[1].tooltip = 'food count'; // food
  columnsDescription[2].tooltip = 'workers on gold'; // gold
  columnsDescription[3].tooltip = 'workers on lumber'; // lumber

  // Show only positive characters
  for (let i = 1; i <= 3; i++) {
    columnsDescription[i].isIntegerInRawBO = true;
    columnsDescription[i].showOnlyPositive = true;
  }

  // All field values are optional
  for (let i = 0; i <= 3; i++) {
    columnsDescription[i].optional = true;
  }

  // No select widget
  visualEditortableWidgetDescription = null;

  return getVisualEditorFromDescription(columnsDescription);
}

/**
 * Open a new page displaying the full BO in a single panel, for WC3.
 */
function openSinglePanelPageWC3() {
  // Image folders
  const common = 'assets/common/';
  const game = 'assets/' + gameName + '/';
  const resource = game + '/resource/';

  // Description for each column
  let columnsDescription = [
    new SinglePanelColumn('time', common + 'icon/time.webp'),
    new SinglePanelColumn('food', resource + 'food.webp'),
    new SinglePanelColumn('gold', resource + 'gold.webp'),
    new SinglePanelColumn('lumber', resource + 'lumber.webp'),
  ];

  columnsDescription[0].italic = true; // time
  columnsDescription[0].textAlign = 'right'; // time
  columnsDescription[1].bold = true; // food
  columnsDescription[2].backgroundColor = [167, 115, 0]; // gold
  columnsDescription[3].backgroundColor = [80, 100, 0]; // lumber

  // all columns
  for (let i = 0; i <= 3; i++) {
    columnsDescription[i].hideIfAbsent = true;
  }

  // all columns, except time
  for (let i = 1; i <= 3; i++) {
    columnsDescription[i].displayIfPositive = true;
  }

  // Feed game description to generic function
  openSinglePanelPageFromDescription(columnsDescription);
}
