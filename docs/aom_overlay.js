// -- Age of Mythology (AoM) -- //

/**
 * Get the main HTML content of the resource line (excluding timing) for AoM.
 *
 * @param {int} currentStep  Requested step for the BO resource line.
 *
 * @returns HTML code corresponding to the requested line.
 */
function getResourceLineAoM(currentStep) {
  let htmlString = '';

  // Folders with requested pictures
  const gamePicturesFolder = 'assets/' + gameName + '/';
  const resourceFolder = gamePicturesFolder + 'resource/';

  const resources = currentStep.resources;

  if (
    isBOImageValid(resources, 'food', true) ||
    isBOImageValid(resources, 'wood', true) ||
    isBOImageValid(resources, 'gold', true) ||
    isBOImageValid(resources, 'favor', true)
  ) {
    htmlString += getBOImageValue(resourceFolder + 'food.webp', resources, 'food');
    htmlString += getBOImageValue(resourceFolder + 'wood.webp', resources, 'wood');
    htmlString += getBOImageValue(resourceFolder + 'gold.webp', resources, 'gold');
    htmlString += getBOImageValue(resourceFolder + 'favor.webp', resources, 'favor');
  }
  htmlString += getBOImageValue(resourceFolder + 'repair.webp', resources, 'builder', true);
  htmlString += getBOImageValue(resourceFolder + 'worker.webp', currentStep, 'worker_count', true);

  // Age image
  const ageImage = {
    1: 'archaic_age.webp',
    2: 'classical_age.webp',
    3: 'heroic_age.webp',
    4: 'mythic_age.webp',
    5: 'wonder_age.webp',
  };

  if (currentStep.age in ageImage) {
    htmlString += getBOImageHTML(gamePicturesFolder + 'age/' + ageImage[currentStep.age]);
  }

  return htmlString;
}

/**
 * Check if the build order is valid, for AoM.
 *
 * @param {boolean} nameBOMessage  true to add the BO name in the error message.
 *
 * @returns Array of size 2:
 *              0: true if valid build order, false otherwise.
 *              1: String indicating the error (empty if no error).
 */
function checkValidBuildOrderAoM(nameBOMessage) {
  let BONameStr = '';

  try {
    if (nameBOMessage) {
      BONameStr = dataBO['name'] + ' | ';
    }

    // Check correct major god
    const validFactionRes = checkValidFaction(BONameStr, 'major_god', true, false);
    if (!validFactionRes[0]) {
      return validFactionRes;
    }

    fields = [
      new FieldDefinition('worker_count', 'integer', true),
      new FieldDefinition('age', 'integer', true, null, [-Infinity, 5]),
      new FieldDefinition('food', 'integer', true, 'resources'),
      new FieldDefinition('wood', 'integer', true, 'resources'),
      new FieldDefinition('gold', 'integer', true, 'resources'),
      new FieldDefinition('favor', 'integer', true, 'resources'),
      new FieldDefinition('builder', 'integer', false, 'resources'),
      new FieldDefinition('time', 'string', false),
      new FieldDefinition('notes', 'array of strings', true),
    ];

    return checkValidSteps(BONameStr, fields);
  } catch (e) {
    return invalidMsg(BONameStr + e);
  }
}

/**
 * Get one step of the AoM build order (template).
 *
 * @param {Array} buildOrderData  Array with the build order step, null for default values.
 * @param {int} copyStepID       ID of the step to copy, -1 for last step.
 *
 * @returns Dictionary with the build order step template.
 */
function getBOStepAoM(buildOrderData, copyStepID = -1) {
  if (buildOrderData && buildOrderData.length >= 1) {
    // Selected step or last step data (if not valid index)
    const data =
      0 <= copyStepID && copyStepID < buildOrderData.length
        ? buildOrderData[copyStepID]
        : buildOrderData.at(-1);
    return {
      worker_count: 'worker_count' in data ? data['worker_count'] : 0,
      age: 'age' in data ? data['age'] : 1,
      resources: 'resources' in data ? data['resources'] : { food: 0, wood: 0, gold: 0, favor: 0 },
      notes: ['Note'],
    };
  } else {
    return {
      worker_count: 0,
      age: 1,
      resources: { food: 0, wood: 0, gold: 0, favor: 0 },
      notes: ['Note'],
    };
  }
}

/**
 * Get the AoM build order template (reset build order).
 *
 * @returns Dictionary with the build order template.
 */
function getBOTemplateAoM() {
  return {
    major_god: 'Zeus',
    name: 'Build order name',
    author: 'Author',
    source: 'Source',
    build_order: [getBOStepAoM(null)],
  };
}

/**
 * Get the worker creation time, for AoM.
 *
 * @param {string} pantheon  Pantheon of the current BO.
 *
 * @returns Worker creation time [sec].
 */
function getWorkerTimeAoM(pantheon) {
  if (['Greeks', 'Egyptians', 'Norse', 'Chinese', 'Japanese'].includes(pantheon)) {
    return 18.0;
  } else if (pantheon === 'Aztecs') {
    return 17.0;
  } else if (pantheon === 'Atlanteans') {
    return 15.0; // 30 sec for a citizen with 2 pop
  } else {
    throw 'Unknown pantheon: ' + pantheon;
  }
}

/**
 * Get the pantheon corresponding to a major god.
 *
 * @param {string} majorGod  Major god to check.
 *
 * @returns Pantheon of the major god.
 */
function getPantheon(majorGod) {
  if (['Zeus', 'Hades', 'Poseidon', 'Demeter'].includes(majorGod)) {
    return 'Greeks';
  } else if (['Ra', 'Isis', 'Set'].includes(majorGod)) {
    return 'Egyptians';
  } else if (['Thor', 'Odin', 'Loki', 'Freyr'].includes(majorGod)) {
    return 'Norse';
  } else if (['Kronos', 'Oranos', 'Gaia'].includes(majorGod)) {
    return 'Atlanteans';
  } else if (['Fuxi', 'Nuwa', 'Shennong'].includes(majorGod)) {
    return 'Chinese';
  } else if (['Amaterasu', 'Tsukuyomi', 'Susanoo'].includes(majorGod)) {
    return 'Japanese';
  } else if (['Huitzilopochtli', 'Quetzalcoatl', 'Tezcatlipoca'].includes(majorGod)) {
    return 'Aztecs';
  } else {
    throw 'Unknown major god: ' + majorGod;
  }
}

/**
 * Get the research time to reach the next age, for AoM.
 *
 * @param {int} currentAge  Current age (1: Archaic Age, 2: Classical...).
 *
 * @returns Requested age up time [sec].
 */
function getResearchAgeUpTimeAoM(currentAge) {
  console.assert(1 <= currentAge && currentAge <= 4, 'Age expected in [1;4].');

  if (currentAge === 1) {
    // Classical age up
    return 60.0;
  } else if (currentAge === 2) {
    // Heroic age up
    return 75.0;
  } else if (currentAge === 3) {
    // Mythic age up
    return 120.0;
  } else {
    // Wonder age up
    return 0.0; // 5400 secs to build, but not part of TC
  }
}

/**
 * Evaluate the time indications for an AoM build order.
 *
 * @param {int} timeOffset  Offset to add on the time outputs [sec].
 */
function evaluateBOTimingAoM(timeOffset) {
  // Get the pantheon
  let pantheon = '';
  const majorGodData = dataBO['major_god'];
  if (Array.isArray(majorGodData)) {
    if (!majorGodData.length) {
      console.log("Warning: the array of 'major_god' is empty, timing cannot be evaluated.");
      return;
    }
    pantheon = getPantheon(majorGodData[0]);
  } else {
    pantheon = getPantheon(majorGodData);
  }

  let currentAge = 1; // Current age (1: Archaic Age, 2: Classical...)

  // Starting workers
  let lastWorkerCount = 3; // Egyptians and Norse
  if (['Greeks', 'Atlanteans'].includes(pantheon)) {
    lastWorkerCount = 4; // Atlanteans have 2 citizens, each with 2 pop
  } else if (pantheon === 'Chinese') {
    lastWorkerCount = 5; // 2 peasants + 1 Kuafu
  }

  // TC technologies or special units, with TC training/research time (in [sec])
  const TCUnitTechnologies = {
    'greeks_tech/divine_blood.webp': 30.0,
    'egyptians_tech/sundried_mud_brick.webp': 50.0,
    'egyptians_tech/book_of_thoth.webp': 40.0,
    'atlanteans_tech/horns_of_consecration.webp': 30.0,

    // The following technologies/units are not analyzed:
    //   * Assuming researched from store house: Vaults of Erebus.
    //   * Assuming trained/researched from temple:
    //         Egyptian priest, Golden Apples, Skin of the Rhino, Funeral Rites,
    //         Spirit of Maat, Nebty, New Kingdom, Channels.
    //   * Assuming trained from Longhouse: Berserk.
    //   * Egyptian mercenaries: Trained very fast and usually not part of BO.
  };

  if (!('build_order' in dataBO)) {
    console.log(
      "Warning: the 'build_order' field is missing from data when evaluating the timing."
    );
    return;
  }

  let lastTimeSec = timeOffset; // time of the last step

  let buildOrderData = dataBO['build_order'];
  const stepCount = buildOrderData.length;

  // Loop on all the build order steps
  for (const [currentStepID, currentStep] of enumerate(buildOrderData)) {
    let stepTotalTime = 0.0; // total time for this step

    // Worker count
    let workerCount = currentStep['worker_count'];
    const resources = currentStep['resources'];
    if (workerCount < 0) {
      workerCount =
        Math.max(0, resources['wood']) +
        Math.max(0, resources['food']) +
        Math.max(0, resources['gold']);
      if (pantheon === 'Greeks') {
        // Only Greeks villagers can gather favor
        workerCount += Math.max(0, resources['favor']);
      }
      if ('builder' in resources) {
        workerCount += Math.max(0, resources['builder']);
      }
    }

    workerCount = Math.max(lastWorkerCount, workerCount);
    const updateWorkerCount = workerCount - lastWorkerCount;
    lastWorkerCount = workerCount;

    // Update time based on the number and type of workers
    stepTotalTime += updateWorkerCount * getWorkerTimeAoM(pantheon);

    // Check for TC technologies or special units in notes
    for (note of currentStep['notes']) {
      for (const [tcItemImage, tcItemTime] of Object.entries(TCUnitTechnologies)) {
        if (note.includes('@' + tcItemImage + '@')) {
          stepTotalTime += tcItemTime;
        }
      }
    }

    // Next age
    const nextAge =
      1 <= currentStep['age'] && currentStep['age'] <= 5 ? currentStep['age'] : currentAge;
    if (nextAge === currentAge + 1) // researching next age up
    {
      stepTotalTime += getResearchAgeUpTimeAoM(currentAge);
    }
    currentAge = nextAge; // current age update

    // Update time
    lastTimeSec += stepTotalTime;

    // Update build order with time
    currentStep['time'] = buildOrderTimeToStr(Math.round(lastTimeSec));

    // Special case for last step
    // (add 1 sec to avoid displaying both at the same time).
    if (
      currentStepID === stepCount - 1 &&
      stepCount >= 2 &&
      currentStep['time'] === buildOrderData[currentStepID - 1]['time']
    ) {
      currentStep['time'] = buildOrderTimeToStr(Math.round(lastTimeSec + 1.0));
    }
  }
}

/**
 * Get the images available for AoM, sorted by sub-folder.
 *
 * @returns Dictionary with all the images per sub-folder.
 */
function getImagesAoM() {
  // This is obtained using the 'python/utilities/list_images.py' script.
  let imagesDict = {
    age: 'age_unknown.webp#archaic_age.webp#classical_age.webp#heroic_age.webp#mythic_age.webp#wonder_age.webp',
    animal:
      'arctic_wolf.webp#aurochs.webp#baboon.webp#bear.webp#boar.webp#caribou.webp#chicken.webp#cow.webp#crocodile.webp#crowned_crane.webp#deer.webp#elephant.webp#elk.webp#fish.webp#gazelle.webp#giraffe.webp#goat.webp#hippopotamus.webp#hyena.webp#lion.webp#monkey.webp#pig.webp#polar_bear.webp#rhinoceros.webp#tiger.webp#walrus.webp#water_buffalo.webp#wolf.webp#zebra.webp',
    armory:
      'armory.webp#ballistics.webp#bronze_armor.webp#bronze_shields.webp#bronze_weapons.webp#burning_pitch.webp#copper_armor.webp#copper_shields.webp#copper_weapons.webp#iron_armor.webp#iron_shields.webp#iron_weapons.webp',
    atlanteans_building:
      'counter-barracks.webp#economic_guild.webp#manor.webp#military_barracks.webp#mirror_tower.webp#palace.webp#sky_passage.webp#time_shift.webp#town_center_atlantean.webp',
    atlanteans_civilian: 'caravan_atlantean.webp#citizen.webp',
    atlanteans_hero:
      'arcus_hero.webp#cheiroballista_hero.webp#citizen_hero.webp#contarius_hero.webp#destroyer_hero.webp#fanatic_hero.webp#katapeltes_hero.webp#murmillo_hero.webp#oracle_hero.webp#turma_hero.webp',
    atlanteans_human:
      'arcus.webp#contarius.webp#destroyer.webp#fanatic.webp#katapeltes.webp#murmillo.webp#oracle_unit.webp#turma.webp',
    atlanteans_minor_god:
      'atlas.webp#hekate.webp#helios.webp#hyperion.webp#leto.webp#oceanus.webp#prometheus.webp#rheia.webp#theia.webp',
    atlanteans_myth:
      'argus.webp#atlantean_titan.webp#automaton.webp#behemoth.webp#caladria.webp#centimanus.webp#dryad.webp#lampades.webp#man_o_war.webp#nereid.webp#promethean.webp#satyr.webp#servant.webp#stymphalian_bird.webp',
    atlanteans_power:
      'carnivora_power.webp#chaos.webp#deconstruction.webp#gaia_forest.webp#hesperides.webp#implode.webp#shockwave.webp#spider_lair.webp#tartarian_gate_power.webp#traitor.webp#valor.webp#vortex.webp',
    atlanteans_ship:
      'bireme.webp#fire_ship.webp#fishing_ship_atlantean.webp#siege_bireme.webp#transport_ship_atlantean.webp',
    atlanteans_siege: 'cheiroballista.webp#fire_siphon.webp',
    atlanteans_tech:
      'alluvial_clay.webp#asper_blood.webp#bite_of_the_shark.webp#celerity.webp#channels.webp#conscript_counter_soldiers.webp#conscript_mainline_soldiers.webp#conscript_palace_soldiers.webp#empyrian_speed.webp#eyes_of_atlas.webp#focus.webp#gemini.webp#guardian_of_io.webp#halo_of_the_sun.webp#heart_of_the_titans.webp#hephaestus_revenge.webp#heroic_renewal.webp#horns_of_consecration.webp#lance_of_stone.webp#lemuriandescendants.webp#levy_counter_soldiers.webp#levy_mainline_soldiers.webp#levy_palace_soldiers.webp#mythic_rejuvenation.webp#orichalcum_mail.webp#petrification.webp#poseidons_secret.webp#rheias_gift.webp#safe_passage.webp#temporal_chaos.webp#titan_shield.webp#volcanic_forge.webp#weightless_mace.webp',
    aztecs_building:
      'calpulli.webp#great_temple.webp#nobles_hut.webp#smoke_trap.webp#spike_trap.webp#tzompantli_tower.webp#war_hut.webp',
    aztecs_civilian: 'villager_aztec.webp',
    aztecs_hero:
      'huitzilopochtli_unit.webp#quetzalcoatl_unit.webp#teixiptla_huitzilopochtli.webp#teixiptla_quetzalcoatl.webp#teixiptla_tezcatlipoca.webp#tezcatlipoca_unit.webp#warrior_priest.webp',
    aztecs_human:
      'coyote_warrior.webp#eagle_warrior.webp#jaguar_rider.webp#ocelotl_warrior.webp#otontin_smasher.webp#quimichin_spy.webp#shorn_one.webp#tequihua_archer.webp#tlamanih_spearman.webp',
    aztecs_minor_god:
      'coatlicue.webp#coyolxauhqui.webp#huehuecoyotl.webp#itzpapalotl.webp#malinalxochitl.webp#mictlantecuhtli.webp#patecatl.webp#tlaloc.webp#xolotl.webp',
    aztecs_myth:
      'ahuizotl.webp#axolotl.webp#axolotl_mutant.webp#ayotochtli.webp#centzon_totochtin.webp#chaneque.webp#maquizcoatl.webp#obsidian_butterfly.webp#quinametzin.webp#soul_guide.webp#titan_cipactli.webp#tunkuluchu.webp#tzitzimitl.webp',
    aztecs_power:
      'agave_bloom.webp#blood_pact.webp#corrupted_ground.webp#earth_monster.webp#infestation.webp#lullaby.webp#obsidian_mirror_power.webp#pillar_of_tlalocan.webp#purge.webp#starfall.webp#tailwind.webp#volcano.webp',
    aztecs_ship: 'arrow_canoe.webp#atlatl_siege_canoe.webp#tepoztli_canoe.webp',
    aztecs_tech:
      'advanced_traps.webp#arrival_of_the_gods.webp#burnt_water.webp#centzon_huitznahua.webp#ceremonial_armor.webp#ceremonial_shields.webp#chinampas.webp#cipactlis_scales.webp#coatepec_shrines.webp#cosmic_guard.webp#coyolxauhqui_stone.webp#craft_workshop.webp#cuicacalli_training.webp#evening_star.webp#feast_of_sustenance.webp#feathered_armor.webp#feathered_shields.webp#flint_weapons.webp#flowery_wars.webp#four_jars.webp#jade_weapons.webp#livestock_pen.webp#lumber_outpost.webp#maguey_cultivation.webp#metzliapan.webp#mictecah.webp#nahuallatolli.webp#necklace_of_eyeballs.webp#new_fire_ceremony.webp#obsidian_knapping.webp#obsidian_weapons.webp#ocpatli_infusions.webp#old_coyotes_spirit.webp#omen_of_death.webp#omen_of_malinalco.webp#ometochtlis_revelry.webp#precious_bones.webp#sacred_armor.webp#sacred_shields.webp#serpent_skirt.webp#shards_of_itztli.webp#sting_of_yappan.webp#stoneskin_quinametzin.webp#string_of_hearts.webp#tecciztecatls_penance.webp#temiminaloyan_trials.webp#tepeyollotls_reach.webp#teponaztli_drums.webp#tlaloques.webp#toloache_trance.webp#tonacatepetl.webp#torch_of_misfortune.webp#twisted_limbs.webp#wings_of_itzpapalotl.webp#wings_of_the_south.webp',
    chinese_blessing:
      'creator_auspice.webp#shennong_gift_all.webp#yang.webp#yin.webp#yin_yang.webp',
    chinese_building:
      'baolei.webp#camp_tower.webp#camp_trainingyard.webp#crossbow_tower.webp#great_wall.webp#guard_tower_chinese.webp#imperial_academy.webp#machine_workshop.webp#military_camp.webp#silo.webp#watch_tower_chinese.webp',
    chinese_civilian:
      'clay_peasant.webp#kuafu.webp#mechanical_ox_caravan.webp#peasant.webp#sky_lantern.webp',
    chinese_hero:
      'jiang_ziya.webp#li_jing.webp#nezha.webp#nezha_child.webp#nezha_youth.webp#pioneer.webp#sage.webp#wen_zhong.webp#yang_jian.webp',
    chinese_human:
      'chu_ko_nu.webp#dao_swordsman.webp#fire_archer.webp#ge_halberdier.webp#summon_terracotta_riders.webp#terracotta_rider.webp#tiger_cavalry.webp#white_horse_cavalry.webp#wuzu_javelineer.webp',
    chinese_minor_god:
      'chiyou.webp#gonggong.webp#goumang.webp#houtu.webp#huangdi.webp#nuba.webp#rushou.webp#xuannu.webp#zhurong.webp',
    chinese_myth:
      'baihu.webp#chiwen.webp#hundun.webp#pixiu.webp#qilin.webp#qinglong.webp#qiongqi.webp#taotie.webp#taowu.webp#titan_chinese.webp#xuanwu.webp#yazi.webp#zhuque.webp',
    chinese_power:
      'blazing_prairie.webp#creation.webp#drought.webp#earth_wall_power.webp#fei_beasts.webp#forest_protection.webp#great_flood.webp#lightning_weapons.webp#peachblossomspring_power.webp#prosperous_seeds.webp#vanish.webp#yinglongs_wrath.webp',
    chinese_ship: 'doujian.webp#louchuan.webp#mengchong.webp',
    chinese_siege: 'axe_cart.webp#siege_crossbow.webp',
    chinese_tech:
      "abundance.webp#advanced_defenses.webp#autumn_of_abundance.webp#bottomless_stomach.webp#celestial_weapons.webp#champion_infantry_chinese.webp#chasing_the_sun.webp#conscript_baolei_soldiers.webp#divine_books.webp#divine_judgement.webp#divine_light.webp#drought_ships.webp#east_wind.webp#flaming_blood.webp#frenzied_dash.webp#gilded_shields.webp#heavy_infantry_chinese.webp#herbal_medicine.webp#hooves_of_the_wind.webp#imperial_order.webp#kuafu_chieftain.webp#last_stand.webp#leizu's_silk.webp#levy_baolei_soldiers.webp#maelstrom.webp#master_of_weaponry.webp#medium_infantry_chinese.webp#mountainous_might.webp#peach_of_immortality.webp#power_of_chaos.webp#qilin's_blessing.webp#rage_of_slaughter.webp#red_cliffs_fleet.webp#reincarnation.webp#rising_tide.webp#rock_solid.webp#scorching_feathers.webp#shaker_of_heaven.webp#silk_road.webp#sinister_defiance.webp#sky_fire.webp#slash_and_burn.webp#song_of_midsummer.webp#son_of_loong.webp#southern_fire.webp#spoils_of_war.webp#summon_terracotta_riders.webp#tai_chi.webp#tempestuous_storm.webp#vibrant_land.webp#xuanyuan's_bloodline.webp",
    defensive:
      'boiling_oil.webp#bronze_wall.webp#carrier_pigeons.webp#citadel_wall.webp#crenellations.webp#fortified_wall.webp#guard_tower_upgrade.webp#improvement_ballista_tower.webp#improvement_watch_tower.webp#iron_wall.webp#orichalkos_wall.webp#sentry_tower.webp#signal_fires.webp#stone_wall.webp#wooden_wall.webp',
    dock: 'arrowship_cladding.webp#champion_warships.webp#conscript_sailors.webp#dock.webp#enclosed_deck.webp#heavy_warships.webp#heroic_fleet.webp#naval_oxybeles.webp#purse_seine.webp#reinforced_ram.webp#salt_amphora.webp',
    economy:
      'bow_saw.webp#carpenters.webp#flood_control.webp#hand_axe.webp#husbandry.webp#irrigation.webp#pickaxe.webp#plow.webp#quarry.webp#shaft_mine.webp#survival_equipment.webp',
    egyptians_building:
      'barracks.webp#granary.webp#lighthouse.webp#lumber_camp.webp#migdol_stronghold.webp#mining_camp.webp#monument_to_villagers.webp#obelisk.webp#siege_works.webp#town_center_egyptian.webp',
    egyptians_civilian: 'caravan_egyptian.webp#laborer.webp',
    egyptians_hero: 'pharaoh.webp#priest.webp',
    egyptians_human:
      'axeman.webp#camel_rider.webp#chariot_archer.webp#mercenary.webp#mercenary_cavalry.webp#slinger.webp#spearman.webp#war_elephant.webp',
    egyptians_minor_god:
      'anubis.webp#bast.webp#horus.webp#nephthys.webp#osiris.webp#ptah.webp#sekhmet.webp#sobek.webp#thoth.webp',
    egyptians_myth:
      'anubite.webp#avenger.webp#egyptian_titan.webp#leviathan.webp#mummy.webp#petsuchos.webp#phoenix.webp#roc.webp#scarab.webp#scorpion_man.webp#son_of_osiris.webp#sphinx.webp#wadjet.webp#war_turtle.webp',
    egyptians_power:
      'ancestors.webp#citadel_power.webp#eclipse.webp#locust_swarm.webp#meteor.webp#plague_of_serpents.webp#prosperity.webp#rain.webp#shifting_sands.webp#son_of_osiris_power.webp#tornado.webp#vision.webp',
    egyptians_ship:
      'fishing_ship_egyptian.webp#kebenit.webp#ramming_galley.webp#transport_ship_egyptian.webp#war_barge.webp',
    egyptians_siege: 'catapult.webp#siege_tower.webp',
    egyptians_tech:
      'adze_of_wepwawet.webp#atef_crown.webp#axe_of_vengeance.webp#bone_bow.webp#book_of_thoth.webp#champion_axemen.webp#champion_camel_riders.webp#champion_chariot_archers.webp#champion_slingers.webp#champion_spearmen.webp#champion_war_elephants.webp#city_of_the_dead.webp#clairvoyance.webp#conscript_barracks_soldiers.webp#conscript_migdol_soldiers.webp#crimson_linen.webp#criosphinx.webp#crocodilopolis.webp#dark_water.webp#desert_wind.webp#electrum_bullets.webp#feet_of_the_jackal.webp#feral.webp#flood_of_the_nile.webp#force_of_the_west_wind.webp#funeral_barge.webp#funeral_rites.webp#greatest_of_fifty.webp#hands_of_the_pharaoh.webp#heavy_axemen.webp#heavy_camel_riders.webp#heavy_chariot_archers.webp#heavy_slingers.webp#heavy_spearmen.webp#heavy_war_elephants.webp#hieracosphinx.webp#leather_frame_shield.webp#levy_barracks_soldiers.webp#levy_migdol_soldiers.webp#medium_axemen.webp#medium_slingers.webp#medium_spearmen.webp#nebty.webp#necropolis.webp#new_kingdom.webp#sacred_cats.webp#scalloped_axe.webp#serpent_spear.webp#shaduf.webp#skin_of_the_rhino.webp#slings_of_the_sun.webp#solar_barque - copy.webp#solar_barque.webp#spear_of_horus.webp#spirit_of_maat.webp#stones_of_red_linen.webp#sundried_mud_brick.webp#tusks_of_apedemak.webp#valley_of_the_kings.webp',
    greeks_building:
      'archery_range.webp#fortress.webp#granary.webp#military_academy.webp#stable.webp#storehouse.webp#town_center_greek.webp#village_center_greeks.webp',
    greeks_civilian: 'caravan_greek.webp#villager_greek.webp',
    greeks_hero:
      'achilles.webp#ajax_spc.webp#atalanta.webp#bellerophon.webp#chiron.webp#heracles.webp#hippolyta.webp#icarus.webp#iolaus.webp#jason.webp#midas.webp#odysseus.webp#orpheus.webp#perseus.webp#polyphemus.webp#theseus.webp',
    greeks_human:
      'gastraphetoros.webp#hetairos.webp#hippeus.webp#hoplite.webp#hypaspist.webp#militia.webp#myrmidon.webp#peltast.webp#prodromos.webp#toxotes.webp',
    greeks_minor_god:
      'aphrodite.webp#apollo.webp#ares.webp#artemis.webp#athena.webp#dionysus.webp#hephaestus.webp#hera.webp#hermes.webp#hestia.webp#pan.webp#persephone.webp',
    greeks_myth:
      'carcinos.webp#centaur.webp#chimera.webp#colossus.webp#cyclops.webp#greek_titan.webp#hamadryad.webp#harpy.webp#hippocampus.webp#hydra.webp#lykaon.webp#lykaon_wolf.webp#manticore.webp#medusa.webp#minotaur.webp#nemean_lion.webp#pegasus.webp#scylla.webp#siren.webp',
    greeks_power:
      'arcadian_meadow.webp#bolt.webp#bronze.webp#ceasefire.webp#communal_hearth.webp#curse.webp#earthquake.webp#lightning_storm.webp#lure_power.webp#pestilence.webp#plenty_vault.webp#restoration.webp#sentinel_power.webp#underworld_invasion.webp#underworld_passage.webp#wither.webp',
    greeks_ship:
      'fishing_ship_greek.webp#juggernaut.webp#pentekonter.webp#transport_ship_greek.webp#trireme.webp',
    greeks_siege: 'helepolis.webp#petrobolos.webp',
    greeks_tech:
      'aegis_shield.webp#anastrophe.webp#argive_patronage.webp#conscript_cavalry.webp#conscript_infantry.webp#conscript_ranged_soldiers.webp#deimos_sword_of_dread.webp#dionysia.webp#divine_blood.webp#divine_Labor.webp#enchanted_hymn.webp#enyos_bow_of_horror.webp#face_of_the_gorgon.webp#fated_arrows.webp#flames_of_typhon.webp#forge_of_olympus.webp#golden_apples.webp#gracious_hospitality.webp#hallowed_woodlands.webp#hand_of_talos.webp#iron_grip.webp#labyrinth_of_minos.webp#levy_cavalry.webp#levy_infantry.webp#levy_ranged_soldiers.webp#lord_of_horses.webp#monstrous_rage.webp#olympian_parentage.webp#olympian_weapons.webp#oracle.webp#pans_pioneers.webp#phobos_spear_of_panic.webp#pious_sacrifice.webp#predatory_instinct.webp#roar_of_orthus.webp#sacred_land.webp#sarissa.webp#shafts_of_plague.webp#shoulder_of_talos.webp#spirited_charge.webp#sun_ray.webp#sylvan_lore.webp#temple_of_healing.webp#thorned_walls.webp#thracian_horses.webp#trierarch.webp#vaults_of_erebus.webp#will_of_kronos.webp#winged_messenger.webp',
    japanese_building:
      'castle.webp#dojo.webp#guardhouse.webp#japanese_stable.webp#mining_camp.webp#shrine.webp#watermill.webp',
    japanese_civilian: 'commoner.webp',
    japanese_hero: 'bushi.webp#daimyo.webp#miko.webp#onmyoji.webp#onna_musha.webp',
    japanese_human:
      'naginata_rider.webp#samurai.webp#shinobi.webp#yari_spearman.webp#yumi_archer.webp#yumi_horse_archer.webp',
    japanese_minor_god:
      'ame-no-uzume.webp#fujin.webp#hachiman.webp#inari_okami.webp#minakatatomi.webp#okuninushi.webp#raijin.webp#takemikazuchi.webp#watatsumi.webp',
    japanese_myth:
      'asura.webp#honengyo.webp#jorogumo.webp#kamaitachi.webp#kitsune.webp#oni.webp#onmoraki.webp#raiju.webp#shinigami.webp#tengu.webp#titan_japanese.webp#umibozu.webp#wanyudo.webp#wretch.webp',
    japanese_power:
      'divine_slash.webp#dragon_typhoon.webp#goshinboku.webp#kusanagi.webp#new_moon.webp#sacred_gate.webp#shogun.webp#shrine_of_the_hunt.webp#smiting_gust.webp#solar_shield.webp#swampland.webp#thunder_burst.webp',
    japanese_ship: 'junkozosen.webp#ramming_wasen.webp#wasen.webp',
    japanese_siege: 'oyumi.webp',
    japanese_tech:
      'ascetic_practices.webp#asymmetrical_bows.webp#burning_malevolence.webp#condemned_soul.webp#crushing_waves.webp#dan-no-ura_tactics.webp#deadly_rage.webp#deadly_snare.webp#den_den_drums.webp#divine_prefecture.webp#eight_banners.webp#eternal_haunting.webp#gales_fury.webp#gohei_wands.webp#golden_kite.webp#hannya_mask.webp#heavenly_barrage.webp#hunters_strength.webp#ivory_netsuke.webp#kagura.webp#katagi.webp#kumiki.webp#mechanical_artisans.webp#oni_mask.webp#onmyodo.webp#restless_army.webp#sacred_custodians.webp#sakura_gardens.webp#saltwater_spring.webp#sashimono_bannermen.webp#seaside_infiltrators.webp#sojutsu.webp#sumo_training.webp#ten-fist_sword.webp#tenshu.webp#thunderous_presence.webp#wind_sickles.webp#wisdom_of_nine.webp',
    major_god:
      'amaterasu.webp#demeter.webp#freyr.webp#fuxi.webp#gaia.webp#hades.webp#huitzilopochtli.webp#isis.webp#kronos.webp#loki.webp#nuwa.webp#odin.webp#oranos.webp#poseidon.webp#quetzalcoatl.webp#ra.webp#set.webp#shennong.webp#susanoo.webp#tezcatlipoca.webp#thor.webp#tsukuyomi.webp#zeus.webp',
    market: 'ambassadors.webp#coinage.webp#market.webp#tax_collectors.webp',
    norse_building:
      'dwarven_armory.webp#great_hall.webp#hill_fort.webp#longhouse.webp#town_center_norse.webp',
    norse_civilian: 'caravan_norse.webp#dwarf.webp#gatherer.webp#ox_cart.webp',
    norse_hero: 'godi.webp#hersir.webp',
    norse_human:
      'berserk.webp#hirdman.webp#huskarl.webp#jarl.webp#raiding_cavalry.webp#throwing_axeman.webp',
    norse_minor_god:
      'aegir.webp#baldr.webp#bragi.webp#forseti.webp#freyja.webp#heimdall.webp#hel.webp#njord.webp#skadi.webp#tyr.webp#ullr.webp#vidar.webp',
    norse_myth:
      'battle_boar.webp#draugr.webp#einherjar.webp#fafnir.webp#fenris_wolf_brood.webp#fimbulwinter_wolf.webp#fire_giant.webp#frost_giant.webp#jormun_elver.webp#kraken.webp#mountain_giant.webp#nidhogg_unit.webp#norse_titan.webp#raven.webp#rock_giant.webp#troll.webp#valkyrie.webp#walking_woods_unit.webp',
    norse_power:
      'asgardian_bastion.webp#dwarven_mine.webp#fimbulwinter.webp#flaming_weapons.webp#forest_fire.webp#frost.webp#great_hunt.webp#gullinbursti.webp#healing_spring_power.webp#inferno.webp#nidhogg.webp#ragnarok.webp#spy.webp#tempest.webp#undermine.webp#walking_woods_power.webp',
    norse_ship:
      'dragon_ship.webp#dreki.webp#fishing_ship_norse.webp#longboat.webp#transport_ship_norse.webp',
    norse_siege: 'ballista.webp#portable_ram.webp',
    norse_tech:
      "arctic_winds.webp#avenging_spirit.webp#berserkergang.webp#bravery.webp#call_of_valhalla.webp#cave_troll.webp#conscript_great_hall_soldiers.webp#conscript_hill_fort_soldiers.webp#conscript_longhouse_soldiers.webp#disablot.webp#dragonscale_shields.webp#dwarven_auger.webp#dwarven_breastplate.webp#dwarven_weapons.webp#eyes_in_the_forest.webp#feasts_of_renown.webp#freyr's_gift.webp#fury_of_the_fallen.webp#gjallarhorn.webp#granite_blood.webp#granite_maw.webp#grasp_of_ran.webp#hall_of_thanes.webp#hamask.webp#hammer_of_thunder.webp#huntress_axe.webp#levy_great_hall_soldiers.webp#levy_hill_fort_soldiers.webp#levy_longhouse_soldiers.webp#long_serpent.webp#meteoric_iron_armor.webp#nine_waves.webp#rampage.webp#rigsthula.webp#rime.webp#ring_giver.webp#ring_oath.webp#safeguard.webp#servants_of_glory.webp#sessrumnir.webp#silent_resolve.webp#sons_of_sleipnir.webp#swine_array.webp#thundering_hooves.webp#thurisaz_rune.webp#twilight_of_the_gods.webp#valgaldr.webp#winter_harvest.webp#wrath_of_the_deep.webp#ydalir.webp",
    other: 'farm.webp#house.webp#relic.webp#titan_gate.webp#wonder.webp',
    resource:
      'berry.webp#favor.webp#food.webp#gold.webp#repair.webp#tree.webp#wood.webp#worker.webp',
    tech_military:
      'champion_archers.webp#champion_cavalry.webp#champion_infantry.webp#draft_horses.webp#engineers.webp#heavy_archers.webp#heavy_cavalry.webp#heavy_infantry.webp#medium_archers.webp#medium_cavalry.webp#medium_infantry.webp#norse_champion_infantry.webp#norse_heavy_infantry.webp#norse_medium_infantry.webp',
    temple: 'omniscience.webp#temple.webp',
    town_center:
      'architects.webp#fortified_town_center.webp#masons.webp#town_center.webp#village_center.webp',
  };

  // Split each string (e.g. 'image_0#image_1#image_2') in a list of images.
  for (const [key, value] of Object.entries(imagesDict)) {
    imagesDict[key] = value.split('#');
  }

  return imagesDict;
}

/**
 * Get the factions with 3 letters shortcut and icon, for AoM.
 *
 * @returns Dictionary with faction name as key, and its 3 letters + image as value.
 */
function getFactionsAoM() {
  return {
    // Greeks
    Zeus: ['ZEU', 'zeus.webp'],
    Hades: ['HAD', 'hades.webp'],
    Poseidon: ['POS', 'poseidon.webp'],
    Demeter: ['DEM', 'demeter.webp'],
    // Egyptians
    Ra: ['RA', 'ra.webp'],
    Isis: ['ISI', 'isis.webp'],
    Set: ['SET', 'set.webp'],
    // Norse
    Thor: ['THO', 'thor.webp'],
    Odin: ['ODI', 'odin.webp'],
    Loki: ['LOK', 'loki.webp'],
    Freyr: ['FRE', 'freyr.webp'],
    // Atlanteans
    Kronos: ['KRO', 'kronos.webp'],
    Oranos: ['ORA', 'oranos.webp'],
    Gaia: ['GAI', 'gaia.webp'],
    // Chinese
    Fuxi: ['FUX', 'fuxi.webp'],
    Nuwa: ['NUW', 'nuwa.webp'],
    Shennong: ['SHE', 'shennong.webp'],
    // Japanese
    Amaterasu: ['AMA', 'amaterasu.webp'],
    Tsukuyomi: ['TSU', 'tsukuyomi.webp'],
    Susanoo: ['SUS', 'susanoo.webp'],
    // Aztecs
    Huitzilopochtli: ['HUI', 'huitzilopochtli.webp'],
    Quetzalcoatl: ['QUE', 'quetzalcoatl.webp'],
    Tezcatlipoca: ['TEZ', 'tezcatlipoca.webp'],
  };
}

/**
 * Get the folder containing the faction images, for AoM.
 *
 * @returns Requested folder name.
 */
function getFactionImagesFolderAoM() {
  return 'major_god';
}

/**
 * Get the instructions for AoM.
 *
 * @returns Requested instructions.
 */
function getInstructionsAoM() {
  return contentArrayToDiv(getArrayInstructions());
}

/**
 * Get HTML code for the visual editor sample, for AoM.
 *
 * @returns HTML code
 */
function getVisualEditorAoM() {
  // Image folders
  const common = 'assets/common/';
  const game = 'assets/' + gameName + '/';
  const resource = game + '/resource/';

  // Description for each column
  let columnsDescription = [
    new SinglePanelColumn('age'),
    new SinglePanelColumn('time', common + 'icon/time.webp'),
    new SinglePanelColumn('worker_count', resource + 'worker.webp'),
    new SinglePanelColumn('resources/food', resource + 'food.webp'),
    new SinglePanelColumn('resources/wood', resource + 'wood.webp'),
    new SinglePanelColumn('resources/gold', resource + 'gold.webp'),
    new SinglePanelColumn('resources/favor', resource + 'favor.webp'),
    new SinglePanelColumn('resources/builder', resource + 'repair.webp'),
  ];

  columnsDescription[0].text = 'Age'; // age selection
  columnsDescription[0].isSelectwidget = true; // age selection
  columnsDescription[1].italic = true; // time
  columnsDescription[1].optional = true; // time
  columnsDescription[2].bold = true; // worker count
  columnsDescription[2].backgroundColor = [50, 50, 50]; // worker count
  columnsDescription[3].backgroundColor = [153, 94, 89]; // food
  columnsDescription[4].backgroundColor = [94, 72, 56]; // wood
  columnsDescription[5].backgroundColor = [135, 121, 78]; // gold
  columnsDescription[6].backgroundColor = [100, 100, 100]; // favor
  columnsDescription[7].optional = true; // builder

  columnsDescription[1].tooltip = "step end time as 'x:yy'"; // time
  columnsDescription[2].tooltip = 'number of workers'; // worker count
  columnsDescription[3].tooltip = 'villagers on food'; // food
  columnsDescription[4].tooltip = 'villagers on wood'; // wood
  columnsDescription[5].tooltip = 'villagers on gold'; // gold
  columnsDescription[6].tooltip = 'favor gatherers'; // favor
  columnsDescription[7].tooltip = 'number of builders'; // builder

  // Show only positive characters for resources
  for (let i = 2; i <= 7; i++) {
    columnsDescription[i].isIntegerInRawBO = true;
    columnsDescription[i].showOnlyPositive = true;
  }
  columnsDescription[0].isIntegerInRawBO = true; // age selection

  // Age selection
  visualEditortableWidgetDescription = [
    [-1, '?', 'age/age_unknown.webp'],
    [1, 'ARC', 'age/archaic_age.webp'],
    [2, 'CLA', 'age/classical_age.webp'],
    [3, 'HER', 'age/heroic_age.webp'],
    [4, 'MYT', 'age/mythic_age.webp'],
    [5, 'WON', 'age/wonder_age.webp'],
  ];

  return getVisualEditorFromDescription(columnsDescription);
}

/**
 * Open a new page displaying the full BO in a single panel, for AoM.
 */
function openSinglePanelPageAoM() {
  // Image folders
  const common = 'assets/common/';
  const game = 'assets/' + gameName + '/';
  const resource = game + '/resource/';

  // Description for each column
  let columnsDescription = [
    new SinglePanelColumn('time', common + 'icon/time.webp'),
    new SinglePanelColumn('worker_count', resource + 'worker.webp'),
    new SinglePanelColumn('resources/builder', resource + 'repair.webp'),
    new SinglePanelColumn('resources/food', resource + 'food.webp'),
    new SinglePanelColumn('resources/wood', resource + 'wood.webp'),
    new SinglePanelColumn('resources/gold', resource + 'gold.webp'),
    new SinglePanelColumn('resources/favor', resource + 'favor.webp'),
  ];

  columnsDescription[0].italic = true; // time
  columnsDescription[0].hideIfAbsent = true; // time
  columnsDescription[0].textAlign = 'right'; // time
  columnsDescription[1].bold = true; // worker count
  columnsDescription[2].hideIfAbsent = true; // builder
  columnsDescription[3].backgroundColor = [153, 94, 89]; // food
  columnsDescription[4].backgroundColor = [94, 72, 56]; // wood
  columnsDescription[5].backgroundColor = [135, 121, 78]; // gold
  columnsDescription[6].backgroundColor = [100, 100, 100]; // favor

  // all columns, except time
  for (let i = 1; i <= 6; i++) {
    columnsDescription[i].displayIfPositive = true;
  }

  // Sections Header
  const topArrow = getBOImageHTML(common + 'icon/top_arrow.webp');
  const sectionsHeader = {
    key: 'age', // Key to look for
    // Header before the current row
    before: {
      2: topArrow + 'Aging up to Classical Age',
      3: topArrow + 'Aging up to Heroic Age',
      4: topArrow + 'Aging up to Mythic Age',
      5: topArrow + 'Aging up to Wonder Age',
    },
    // Header after the current row
    after: {
      1: getBOImageHTML(game + 'age/archaic_age.webp') + 'Archaic Age',
      2: getBOImageHTML(game + 'age/classical_age.webp') + 'Classical Age',
      3: getBOImageHTML(game + 'age/heroic_age.webp') + 'Heroic Age',
      4: getBOImageHTML(game + 'age/mythic_age.webp') + 'Mythic Age',
      5: getBOImageHTML(game + 'age/wonder_age.webp') + 'Wonder Age',
    },
  };
  // Header for first line
  sectionsHeader['first_line'] = sectionsHeader.after;

  // Feed game description to generic function
  openSinglePanelPageFromDescription(columnsDescription, sectionsHeader);
}
