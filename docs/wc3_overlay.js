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

  htmlString += getBOImageValue(resourceFolder + 'gold.png', currentStep, 'gold', true);
  htmlString += getBOImageValue(resourceFolder + 'lumber.png', currentStep, 'lumber', true);
  htmlString += getBOImageValue(resourceFolder + 'food.png', currentStep, 'food', true);

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
      new FieldDefinition('time', 'string', false), new FieldDefinition('food', 'integer', false),
      new FieldDefinition('gold', 'integer', false), new FieldDefinition('lumber', 'integer', false)
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
    const data = (0 <= copyStepID && copyStepID < buildOrderData.length) ?
        buildOrderData[copyStepID] :
        buildOrderData.at(-1);
    return {
      'food': ('food' in data) ? data['food'] : -1,
      'gold': ('gold' in data) ? data['gold'] : -1,
      'lumber': ('lumber' in data) ? data['lumber'] : -1,
      'notes': ['Note']
    };
  } else {
    return {'food': -1, 'gold': -1, 'lumber': -1, 'notes': ['Note']};
  }
}

/**
 * Get the WC3 build order template (reset build order).
 *
 * @returns Dictionary with the build order template.
 */
function getBOTemplateWC3() {
  return {
    'race': 'Humans',
    'opponent_race': 'Any',
    'name': 'Build order name',
    'author': 'Author',
    'source': 'Source',
    'build_order': [getBOStepWC3(null)]
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
    'human_building':
        'altar_of_kings.png#arcane_sanctum.png#arcane_vault.png#barracks.png#blacksmith.png#farm.png#gryphon_aviary.png#lumber_mill.png#scout_tower.png#town_hall.png#workshop.png',
    'human_hero': 'archmage.png#blood_mage.png#mountain_king.png#paladin.png',
    'human_special': 'militia.png#phoenix.png#summon_water_elemental.png',
    'human_unit':
        'dragon_hawk_rider.png#flying_machine.png#footman.png#gryphon_rider.png#knight.png#mortar_team.png#peasant.png#priest.png#rifleman.png#siege_engine.png#sorceress.png#spell_breaker.png',
    'night_elf_building':
        'altar_of_elders.png#ancient_of_lore.png#ancient_of_war.png#ancient_of_wind.png#ancient_of_wonders.png#ancient_protector.png#chimaera_roost.png#hunters_hall.png#moon_well.png#tree_of_life.png',
    'night_elf_hero':
        'demon_hunter.png#keeper_of_the_grove.png#priestess_of_the_moon.png#warden.png',
    'night_elf_special':
        'avatar_of_vengeance.png#druid_of_the_claw.png#druid_of_the_talon.png#hippogryph_rider.png#owl_scout.png#spirit_of_vengeance.png#treant.png',
    'night_elf_unit':
        'archer.png#chimaera.png#druid_of_the_claw.png#druid_of_the_talon.png#dryad.png#faerie_dragon.png#glaive_thrower.png#hippogryph.png#huntress.png#mountain_giant.png#wisp.png',
    'orc_building':
        'altar_of_storms.png#barracks.png#beastiary.png#great_hall.png#orc_burrow.png#spirit_lodge.png#tauren_totem.png#voodoo_lounge.png#war_mill.png#watch_tower.png',
    'orc_hero': 'blademaster.png#far_seer.png#shadow_hunter.png#tauren_chieftain.png',
    'orc_special': 'serpent_ward.png#spirit_wolf.png#troll_berserker.png',
    'orc_unit':
        'demolisher.png#grunt.png#kodo_beast.png#peon.png#raider.png#shaman.png#spirit_walker.png#tauren.png#troll_batrider.png#troll_headhunter.png#wind_rider.png#witch_doctor.png',
    'race': 'dice.png#human.png#night_elf.png#orc.png#undead.png',
    'resource': 'food.png#gold.png#lumber.png',
    'undead_building':
        'altar_of_darkness.png#boneyard.png#crypt.png#graveyard.png#haunted_goldmine.png#necropolis.png#sacrificial_pit.png#slaughter_house.png#temple_of_the_damned.png#tomb_of_relics.png#ziggurat.png',
    'undead_hero': 'crypt_lord.png#death_knight.png#dread_lord.png#lich.png',
    'undead_special':
        'carrion_beetle.png#destroyer.png#shade.png#skeletal_mage.png#skeleton_warrior.png',
    'undead_unit':
        'abomination.png#acolyte.png#banshee.png#crypt_fiend.png#frost_wyrm.png#gargoyle.png#ghoul.png#meat_wagon.png#necromancer.png#obsidian_statue.png'
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
    'Humans': ['HUM', 'human.png'],
    'Orcs': ['ORC', 'orc.png'],
    'Night Elves': ['NIG', 'night_elf.png'],
    'Undead': ['UND', 'undead.png'],
    'Any': ['ANY', 'dice.png']
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
    new SinglePanelColumn('time', common + 'icon/time.png'),
    new SinglePanelColumn('food', resource + 'food.png'),
    new SinglePanelColumn('gold', resource + 'gold.png'),
    new SinglePanelColumn('lumber', resource + 'lumber.png')
  ];

  columnsDescription[0].italic = true;                    // time
  columnsDescription[1].bold = true;                      // food
  columnsDescription[1].backgroundColor = [50, 50, 50];   // food
  columnsDescription[2].backgroundColor = [167, 115, 0];  // gold
  columnsDescription[3].backgroundColor = [80, 100, 0];   // lumber

  columnsDescription[0].tooltip = 'step time as \'x:yy\'';  // time
  columnsDescription[1].tooltip = 'food count';             // food
  columnsDescription[2].tooltip = 'workers on gold';        // gold
  columnsDescription[3].tooltip = 'workers on lumber';      // lumber

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
    new SinglePanelColumn('time', common + 'icon/time.png'),
    new SinglePanelColumn('food', resource + 'food.png'),
    new SinglePanelColumn('gold', resource + 'gold.png'),
    new SinglePanelColumn('lumber', resource + 'lumber.png')
  ];

  columnsDescription[0].italic = true;                    // time
  columnsDescription[0].textAlign = 'right';              // time
  columnsDescription[1].bold = true;                      // food
  columnsDescription[2].backgroundColor = [167, 115, 0];  // gold
  columnsDescription[3].backgroundColor = [80, 100, 0];   // lumber

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
