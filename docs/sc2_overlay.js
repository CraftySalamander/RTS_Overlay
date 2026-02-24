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

  htmlString += getBOImageValue(resourceFolder + 'minerals.webp', currentStep, 'minerals', true);
  htmlString += getBOImageValue(
    resourceFolder + 'vespene_gas.webp',
    currentStep,
    'vespene_gas',
    true
  );
  htmlString += getBOImageValue(
    commonPicturesFolder + 'icon/house.webp',
    currentStep,
    'supply',
    true
  );

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
      new FieldDefinition('time', 'string', false),
      new FieldDefinition('supply', 'integer', false),
      new FieldDefinition('minerals', 'integer', false),
      new FieldDefinition('vespene_gas', 'integer', false),
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
    const data =
      0 <= copyStepID && copyStepID < buildOrderData.length
        ? buildOrderData[copyStepID]
        : buildOrderData.at(-1);
    return {
      supply: 'supply' in data ? data['supply'] : -1,
      minerals: 'minerals' in data ? data['minerals'] : -1,
      vespene_gas: 'vespene_gas' in data ? data['vespene_gas'] : -1,
      notes: ['Note'],
    };
  } else {
    return { supply: -1, minerals: -1, vespene_gas: -1, notes: ['Note'] };
  }
}

/**
 * Get the SC2 build order template (reset build order).
 *
 * @returns Dictionary with the build order template.
 */
function getBOTemplateSC2() {
  return {
    race: 'Terran',
    opponent_race: 'Any',
    name: 'Build order name',
    patch: 'x.y.z',
    author: 'Author',
    source: 'Source',
    build_order: [getBOStepSC2(null)],
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
    protoss_buildings:
      'Assimilator.webp#Cybernetics_Core.webp#Dark_Shrine.webp#Fleet_Beacon.webp#Forge.webp#Gateway.webp#Nexus.webp#Photon_Cannon.webp#Pylon.webp#Robotics_Bay.webp#Robotics_Facility.webp#ShieldBattery.webp#Stargate.webp#StasisWard.webp#Templar_Archives.webp#Twilight_Council.webp#Warp_Gate.webp',
    protoss_techs:
      'Air_armor_1.webp#Air_armor_2.webp#Air_armor_3.webp#Air_weapons_1.webp#Air_weapons_2.webp#Air_weapons_3.webp#Anion_Pulse-Crystals.webp#Battery_Overcharge.webp#Blink.webp#Charge.webp#Chrono_boost.webp#Extended_thermal_lances.webp#Flux_Vanes.webp#Gravitic_booster.webp#Gravitic_drive.webp#Graviton_catapult.webp#Ground_armor_1.webp#Ground_armor_2.webp#Ground_armor_3.webp#Ground_weapons_1.webp#Ground_weapons_2.webp#Ground_weapons_3.webp#Guardian_shield.webp#Mass_Recall.webp#Psionic_storm.webp#Resonating_Glaives.webp#Shadow_Stride.webp#Shields_1.webp#Shields_2.webp#Shields_3.webp#Tectonic_Destabilizers.webp#Transform_warpgate.webp',
    protoss_units:
      'Adept.webp#Archon.webp#Carrier.webp#Colossus.webp#Dark_Templar.webp#Disruptor.webp#High_Templar.webp#Immortal.webp#Mothership.webp#Mothership_Core.webp#Observer.webp#Oracle.webp#Phoenix.webp#Probe.webp#Sentry.webp#Stalker.webp#Tempest.webp#VoidRay.webp#Warp_Prism.webp#Zealot.webp',
    race_icon: 'AnyRaceIcon.webp#ProtossIcon.webp#TerranIcon.webp#ZergIcon.webp',
    resource: 'minerals.webp#vespene_gas.webp',
    terran_buildings:
      'Armory.webp#Barracks.webp#Bunker.webp#CommandCenter.webp#EngineeringBay.webp#Factory.webp#FusionCore.webp#GhostAcademy.webp#MissileTurret.webp#OrbitalCommand.webp#PlanetaryFortress.webp#Reactor.webp#Refinery.webp#SensorTower.webp#Starport.webp#SupplyDepot.webp#TechLab.webp',
    terran_techs:
      'Advanced_Ballistics.webp#Behemoth_reactor.webp#Building_armor.webp#Build_Reactor.webp#Build_Tech_Lab.webp#Calldown_extra_supplies.webp#Calldown_mule.webp#Cloak.webp#Enhanced_Shockwaves.webp#High_Capacity_Fuel_Tanks.webp#Hisec_auto_tracking.webp#Infantry_armor_1.webp#Infantry_armor_2.webp#Infantry_armor_3.webp#Infantry_weapons_1.webp#Infantry_weapons_2.webp#Infantry_weapons_3.webp#Lower.webp#Moebius_reactor.webp#Neosteel_frames.webp#Nuke.webp#Scanner_sweep.webp#Ship_weapons_1.webp#Ship_weapons_2.webp#Ship_weapons_3.webp#Vehicle_plating_1.webp#Vehicle_plating_2.webp#Vehicle_plating_3.webp#Vehicle_weapons_1.webp#Vehicle_weapons_2.webp#Vehicle_weapons_3.webp#Yamato_cannon.webp',
    terran_units:
      'Auto-turret.webp#Banshee.webp#Battlecruiser.webp#Cyclone.webp#Ghost.webp#Hellbat.webp#Hellion.webp#Liberator.webp#Marauder.webp#Marine.webp#Medivac.webp#MULE.webp#Point_defense_drone.webp#Raven.webp#Reaper.webp#SCV.webp#SiegeTank.webp#Thor.webp#Viking.webp#WidowMine.webp',
    zerg_buildings:
      'Baneling_Nest.webp#Creep_Tumor.webp#Evolution_Chamber.webp#Extractor.webp#Greater_Spire.webp#Hatchery.webp#Hive.webp#Hydralisk_Den.webp#Infestation_Pit.webp#Lair.webp#LurkerDen.webp#Nydus_Network.webp#Nydus_Worm.webp#Roach_Warren.webp#Spawning_Pool.webp#Spine_Crawler.webp#Spire.webp#Spore_Crawler.webp#Ultralisk_Cavern.webp',
    zerg_techs:
      'Adaptive_Talons.webp#Adrenal_glands.webp#Anabolic_Synthesis.webp#Burrow.webp#Centrifugal_hooks.webp#Chitinous_Plating.webp#Flyer_attack_1.webp#Flyer_attack_2.webp#Flyer_attack_3.webp#Flyer_carapace_1.webp#Flyer_carapace_2.webp#Flyer_carapace_3.webp#Glial_reconstitution.webp#Grooved_Spines.webp#Ground_carapace_1.webp#Ground_carapace_2.webp#Ground_carapace_3.webp#Melee_attacks_1.webp#Melee_attacks_2.webp#Melee_attacks_3.webp#Metabolic_boost.webp#Microbial_Shroud.webp#Missile_attacks_1.webp#Missile_attacks_2.webp#Missile_attacks_3.webp#Muscular_Augments.webp#Mutate_Ventral_Sacs.webp#Neural_parasite.webp#Pathogen_glands.webp#Pneumatized_carapace.webp#Seismic_Spines.webp#Tunneling_claws.webp',
    zerg_units:
      'Baneling.webp#Broodling.webp#Brood_Lord.webp#Changeling.webp#Corruptor.webp#Drone.webp#Hydralisk.webp#Infested_Terran.webp#Infestor.webp#Larva.webp#Lurker.webp#Mutalisk.webp#Overlord.webp#Overseer.webp#Queen.webp#Ravager.webp#Roach.webp#Swarm_Host.webp#Ultralisk.webp#Viper.webp#Zergling.webp',
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
    Terran: ['TER', 'TerranIcon.webp'],
    Protoss: ['PRT', 'ProtossIcon.webp'],
    Zerg: ['ZRG', 'ZergIcon.webp'],
    Any: ['ANY', 'AnyRaceIcon.webp'],
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
    new SinglePanelColumn('time', common + 'icon/time.webp'),
    new SinglePanelColumn('supply', common + 'icon/house.webp'),
    new SinglePanelColumn('minerals', resource + 'minerals.webp'),
    new SinglePanelColumn('vespene_gas', resource + 'vespene_gas.webp'),
  ];

  columnsDescription[0].italic = true; // time
  columnsDescription[1].bold = true; // supply
  columnsDescription[1].backgroundColor = [50, 50, 50]; // supply
  columnsDescription[2].backgroundColor = [77, 103, 136]; // minerals
  columnsDescription[3].backgroundColor = [67, 96, 57]; // vespene gas

  columnsDescription[0].tooltip = "step time as 'x:yy'"; // time
  columnsDescription[1].tooltip = 'supply count'; // supply
  columnsDescription[2].tooltip = 'workers on minerals'; // minerals
  columnsDescription[3].tooltip = 'workers on vespene gas'; // vespene gas

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
    new SinglePanelColumn('time', common + 'icon/time.webp'),
    new SinglePanelColumn('supply', common + 'icon/house.webp'),
    new SinglePanelColumn('minerals', resource + 'minerals.webp'),
    new SinglePanelColumn('vespene_gas', resource + 'vespene_gas.webp'),
  ];

  columnsDescription[0].italic = true; // time
  columnsDescription[0].textAlign = 'right'; // time
  columnsDescription[1].bold = true; // supply
  columnsDescription[2].backgroundColor = [77, 103, 136]; // minerals
  columnsDescription[3].backgroundColor = [67, 96, 57]; // vespene gas

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
