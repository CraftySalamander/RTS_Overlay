// -- StarCraft II (SC2) -- //

/**
 * Get the main HTML content of the resource line (excluding timing) for SC2.
 *
 * @param {int} currentStep  Requested step for the BO resource line.
 *
 * @returns HTML code corresponding to the requested line.
 */
function getResourceLineSC2(currentStep) {
  let htmlString = '';

  // Folders with requested pictures
  const commonPicturesFolder = 'assets/common/';
  const gamePicturesFolder = 'assets/' + gameName + '/';
  const resourceFolder = gamePicturesFolder + 'resource/';

  htmlString += getBOImageValue(resourceFolder + 'minerals.png', currentStep, 'minerals', true);
  htmlString +=
      getBOImageValue(resourceFolder + 'vespene_gas.png', currentStep, 'vespene_gas', true);
  htmlString +=
      getBOImageValue(commonPicturesFolder + 'icon/house.png', currentStep, 'supply', true);

  return htmlString;
}

/**
 * Check if the build order is valid, for SC2.
 *
 * @param {boolean} nameBOMessage  true to add the BO name in the error message.
 *
 * @returns Array of size 2:
 *              0: true if valid build order, false otherwise.
 *              1: String indicating the error (empty if no error).
 */
function checkValidBuildOrderSC2(nameBOMessage) {
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
      new FieldDefinition('time', 'string', false), new FieldDefinition('supply', 'integer', false),
      new FieldDefinition('minerals', 'integer', false),
      new FieldDefinition('vespene_gas', 'integer', false)
    ];

    return checkValidSteps(BONameStr, fields);

  } catch (e) {
    return invalidMsg(BONameStr + e);
  }
}

/**
 * Get one step of the SC2 build order (template).
 *
 * @param {Array} buildOrderData  Array with the build order step, null for default values.
 * @param {int} copyStepID       ID of the step to copy, -1 for last step.
 *
 * @returns Dictionary with the build order step template.
 */
function getBOStepSC2(buildOrderData, copyStepID = -1) {
  if (buildOrderData && buildOrderData.length >= 1) {
    // Selected step or last step data (if not valid index)
    const data = (0 <= copyStepID && copyStepID < buildOrderData.length) ?
        buildOrderData[copyStepID] :
        buildOrderData.at(-1);
    return {
      'supply': ('supply' in data) ? data['supply'] : -1,
      'minerals': ('minerals' in data) ? data['minerals'] : -1,
      'vespene_gas': ('vespene_gas' in data) ? data['vespene_gas'] : -1,
      'notes': ['Note']
    };
  } else {
    return {'supply': -1, 'minerals': -1, 'vespene_gas': -1, 'notes': ['Note']};
  }
}

/**
 * Get the SC2 build order template (reset build order).
 *
 * @returns Dictionary with the build order template.
 */
function getBOTemplateSC2() {
  return {
    'race': 'Terran',
    'opponent_race': 'Any',
    'name': 'Build order name',
    'patch': 'x.y.z',
    'author': 'Author',
    'source': 'Source',
    'build_order': [getBOStepSC2(null)]
  };
}

/**
 * Get the images available for SC2, sorted by sub-folder.
 *
 * @returns Dictionary with all the images per sub-folder.
 */
function getImagesSC2() {
  // This is obtained using the 'python/utilities/list_images.py' script.
  let imagesDict = {
    'protoss_buildings':
        'Assimilator.png#Cybernetics_Core.png#Dark_Shrine.png#Fleet_Beacon.png#Forge.png#Gateway.png#Nexus.png#Photon_Cannon.png#Pylon.png#Robotics_Bay.png#Robotics_Facility.png#ShieldBattery.png#Stargate.png#StasisWard.png#Templar_Archives.png#Twilight_Council.png#Warp_Gate.png',
    'protoss_techs':
        'Air_armor_1.png#Air_armor_2.png#Air_armor_3.png#Air_weapons_1.png#Air_weapons_2.png#Air_weapons_3.png#Anion_Pulse-Crystals.png#Battery_Overcharge.png#Blink.png#Charge.png#Chrono_boost.png#Extended_thermal_lances.png#Flux_Vanes.png#Gravitic_booster.png#Gravitic_drive.png#Graviton_catapult.png#Ground_armor_1.png#Ground_armor_2.png#Ground_armor_3.png#Ground_weapons_1.png#Ground_weapons_2.png#Ground_weapons_3.png#Guardian_shield.png#Mass_Recall.png#Psionic_storm.png#Resonating_Glaives.png#Shadow_Stride.png#Shields_1.png#Shields_2.png#Shields_3.png#Tectonic_Destabilizers.png#Transform_warpgate.png',
    'protoss_units':
        'Adept.png#Archon.png#Carrier.png#Colossus.png#Dark_Templar.png#Disruptor.png#High_Templar.png#Immortal.png#Mothership.png#Mothership_Core.png#Observer.png#Oracle.png#Phoenix.png#Probe.png#Sentry.png#Stalker.png#Tempest.png#VoidRay.png#Warp_Prism.png#Zealot.png',
    'race_icon': 'AnyRaceIcon.png#ProtossIcon.png#TerranIcon.png#ZergIcon.png',
    'resource': 'minerals.png#vespene_gas.png',
    'terran_buildings':
        'Armory.png#Barracks.png#Bunker.png#CommandCenter.png#EngineeringBay.png#Factory.png#FusionCore.png#GhostAcademy.png#MissileTurret.png#OrbitalCommand.png#PlanetaryFortress.png#Reactor.png#Refinery.png#SensorTower.png#Starport.png#SupplyDepot.png#TechLab.png',
    'terran_techs':
        'Advanced_Ballistics.png#Behemoth_reactor.png#Building_armor.png#Build_Reactor.png#Build_Tech_Lab.png#Calldown_extra_supplies.png#Calldown_mule.png#Cloak.png#Enhanced_Shockwaves.png#High_Capacity_Fuel_Tanks.png#Hisec_auto_tracking.png#Infantry_armor_1.png#Infantry_armor_2.png#Infantry_armor_3.png#Infantry_weapons_1.png#Infantry_weapons_2.png#Infantry_weapons_3.png#Lower.png#Moebius_reactor.png#Neosteel_frames.png#Nuke.png#Scanner_sweep.png#Ship_weapons_1.png#Ship_weapons_2.png#Ship_weapons_3.png#Vehicle_plating_1.png#Vehicle_plating_2.png#Vehicle_plating_3.png#Vehicle_weapons_1.png#Vehicle_weapons_2.png#Vehicle_weapons_3.png#Yamato_cannon.png',
    'terran_units':
        'Auto-turret.png#Banshee.png#Battlecruiser.png#Cyclone.png#Ghost.png#Hellbat.png#Hellion.png#Liberator.png#Marauder.png#Marine.png#Medivac.png#MULE.png#Point_defense_drone.png#Raven.png#Reaper.png#SCV.png#SiegeTank.png#Thor.png#Viking.png#WidowMine.png',
    'zerg_buildings':
        'Baneling_Nest.png#Creep_Tumor.png#Evolution_Chamber.png#Extractor.png#Greater_Spire.png#Hatchery.png#Hive.png#Hydralisk_Den.png#Infestation_Pit.png#Lair.png#LurkerDen.png#Nydus_Network.png#Nydus_Worm.png#Roach_Warren.png#Spawning_Pool.png#Spine_Crawler.png#Spire.png#Spore_Crawler.png#Ultralisk_Cavern.png',
    'zerg_techs':
        'Adaptive_Talons.png#Adrenal_glands.png#Anabolic_Synthesis.png#Burrow.png#Centrifugal_hooks.png#Chitinous_Plating.png#Flyer_attack_1.png#Flyer_attack_2.png#Flyer_attack_3.png#Flyer_carapace_1.png#Flyer_carapace_2.png#Flyer_carapace_3.png#Glial_reconstitution.png#Grooved_Spines.png#Ground_carapace_1.png#Ground_carapace_2.png#Ground_carapace_3.png#Melee_attacks_1.png#Melee_attacks_2.png#Melee_attacks_3.png#Metabolic_boost.png#Microbial_Shroud.png#Missile_attacks_1.png#Missile_attacks_2.png#Missile_attacks_3.png#Muscular_Augments.png#Mutate_Ventral_Sacs.png#Neural_parasite.png#Pathogen_glands.png#Pneumatized_carapace.png#Seismic_Spines.png#Tunneling_claws.png',
    'zerg_units':
        'Baneling.png#Broodling.png#Brood_Lord.png#Changeling.png#Corruptor.png#Drone.png#Hydralisk.png#Infested_Terran.png#Infestor.png#Larva.png#Lurker.png#Mutalisk.png#Overlord.png#Overseer.png#Queen.png#Ravager.png#Roach.png#Swarm_Host.png#Ultralisk.png#Viper.png#Zergling.png'
  };

  // Split each string (e.g. 'image_0#image_1#image_2') in a list of images.
  for (const [key, value] of Object.entries(imagesDict)) {
    imagesDict[key] = value.split('#');
  }

  return imagesDict;
}

/**
 * Get the factions with 3 letters shortcut and icon, for SC2.
 *
 * @returns Dictionary with faction name as key, and its 3 letters + image as value.
 */
function getFactionsSC2() {
  return {
    'Terran': ['TER', 'TerranIcon.png'],
    'Protoss': ['PRT', 'ProtossIcon.png'],
    'Zerg': ['ZRG', 'ZergIcon.png'],
    'Any': ['ANY', 'AnyRaceIcon.png']
  };
}

/**
 * Get the folder containing the faction images, for SC2.
 *
 * @returns Requested folder name.
 */
function getFactionImagesFolderSC2() {
  return 'race_icon';
}

/**
 * Get the instructions for SC2.
 *
 * @returns Requested instructions.
 */
function getInstructionsSC2() {
  return contentArrayToDiv(getArrayInstructions());
}

/**
 * Get HTML code for the visual editor sample, for SC2.
 *
 * @returns HTML code
 */
function getVisualEditorSC2() {
  // Image folders
  const common = 'assets/common/';
  const game = 'assets/' + gameName + '/';
  const resource = game + '/resource/';

  // Description for each column
  let columnsDescription = [
    new SinglePanelColumn('time', common + 'icon/time.png'),
    new SinglePanelColumn('supply', common + 'icon/house.png'),
    new SinglePanelColumn('minerals', resource + 'minerals.png'),
    new SinglePanelColumn('vespene_gas', resource + 'vespene_gas.png')
  ];

  columnsDescription[0].italic = true;                     // time
  columnsDescription[1].bold = true;                       // supply
  columnsDescription[1].backgroundColor = [50, 50, 50];    // supply
  columnsDescription[2].backgroundColor = [77, 103, 136];  // minerals
  columnsDescription[3].backgroundColor = [67, 96, 57];    // vespene gas

  columnsDescription[0].tooltip = 'step time as \'x:yy\'';   // time
  columnsDescription[1].tooltip = 'supply count';            // supply
  columnsDescription[2].tooltip = 'workers on minerals';     // minerals
  columnsDescription[3].tooltip = 'workers on vespene gas';  // vespene gas

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
 * Open a new page displaying the full BO in a single panel, for SC2.
 */
function openSinglePanelPageSC2() {
  // Image folders
  const common = 'assets/common/';
  const game = 'assets/' + gameName + '/';
  const resource = game + '/resource/';

  // Description for each column
  let columnsDescription = [
    new SinglePanelColumn('time', common + 'icon/time.png'),
    new SinglePanelColumn('supply', common + 'icon/house.png'),
    new SinglePanelColumn('minerals', resource + 'minerals.png'),
    new SinglePanelColumn('vespene_gas', resource + 'vespene_gas.png')
  ];

  columnsDescription[0].italic = true;                     // time
  columnsDescription[0].textAlign = 'right';               // time
  columnsDescription[1].bold = true;                       // supply
  columnsDescription[2].backgroundColor = [77, 103, 136];  // minerals
  columnsDescription[3].backgroundColor = [67, 96, 57];    // vespene gas

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
