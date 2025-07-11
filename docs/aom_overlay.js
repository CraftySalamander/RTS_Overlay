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

  if (isBOImageValid(resources, 'food', true) || isBOImageValid(resources, 'wood', true) ||
      isBOImageValid(resources, 'gold', true) || isBOImageValid(resources, 'favor', true)) {
    htmlString += getBOImageValue(resourceFolder + 'food.png', resources, 'food');
    htmlString += getBOImageValue(resourceFolder + 'wood.png', resources, 'wood');
    htmlString += getBOImageValue(resourceFolder + 'gold.png', resources, 'gold');
    htmlString += getBOImageValue(resourceFolder + 'favor.png', resources, 'favor');
  }
  htmlString += getBOImageValue(resourceFolder + 'repair.png', resources, 'builder', true);
  htmlString += getBOImageValue(resourceFolder + 'worker.png', currentStep, 'worker_count', true);

  // Age image
  const ageImage = {
    1: 'archaic_age.png',
    2: 'classical_age.png',
    3: 'heroic_age.png',
    4: 'mythic_age.png',
    5: 'wonder_age.png'
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
      new FieldDefinition('notes', 'array of strings', true)
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
    const data = (0 <= copyStepID && copyStepID < buildOrderData.length) ?
        buildOrderData[copyStepID] :
        buildOrderData.at(-1);
    return {
      'worker_count': ('worker_count' in data) ? data['worker_count'] : 0,
      'age': ('age' in data) ? data['age'] : 1,
      'resources': ('resources' in data) ? data['resources'] :
                                           {'food': 0, 'wood': 0, 'gold': 0, 'favor': 0},
      'notes': ['Note']
    };
  } else {
    return {
      'worker_count': 0,
      'age': 1,
      'resources': {'food': 0, 'wood': 0, 'gold': 0, 'favor': 0},
      'notes': ['Note']
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
    'major_god': 'Zeus',
    'name': 'Build order name',
    'author': 'Author',
    'source': 'Source',
    'build_order': [getBOStepAoM(null)]
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
  if (['Greeks', 'Egyptians', 'Norse', 'Chinese'].includes(pantheon)) {
    return 15.0;
  } else if (pantheon === 'Atlanteans') {
    return 12.5;  // 25 sec for a citizen with 2 pop
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
  if (['Zeus', 'Hades', 'Poseidon'].includes(majorGod)) {
    return 'Greeks';
  } else if (['Ra', 'Isis', 'Set'].includes(majorGod)) {
    return 'Egyptians';
  } else if (['Thor', 'Odin', 'Loki', 'Freyr'].includes(majorGod)) {
    return 'Norse';
  } else if (['Kronos', 'Oranos', 'Gaia'].includes(majorGod)) {
    return 'Atlanteans';
  } else if (['Fuxi', 'Nuwa', 'Shennong'].includes(majorGod)) {
    return 'Chinese';
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

  if (currentAge === 1) {  // Classical age up
    return 60.0
  } else if (currentAge === 2) {  // Heroic age up
    return 75.0;
  } else if (currentAge === 3) {  // Mythic age up
    return 120.0;
  } else {       // Wonder age up
    return 0.0;  // 5400 secs to build, but not part of TC
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
      console.log('Warning: the array of \'major_god\' is empty, timing cannot be evaluated.')
      return;
    }
    pantheon = getPantheon(majorGodData[0]);
  } else {
    pantheon = getPantheon(majorGodData);
  }

  let currentAge = 1  // Current age (1: Archaic Age, 2: Classical...)

  // Starting workers
  let lastWorkerCount = 3;  // Egyptians and Norse
  if (['Greeks', 'Atlanteans'].includes(pantheon)) {
    lastWorkerCount = 4;  // Atlanteans have 2 citizens, each with 2 pop
  } else if (pantheon === 'Chinese') {
    lastWorkerCount = 5;  // 2 peasants + 1 Kuafu
  }

  // TC technologies or special units, with TC training/research time (in [sec])
  const TCUnitTechnologies = {
    'greeks_tech/divine_blood.png': 30.0,
    'egyptians_tech/sundried_mud_brick.png': 50.0,
    'egyptians_tech/book_of_thoth.png': 40.0,
    'atlanteans_tech/horns_of_consecration.png': 30.0

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
        'Warning: the \'build_order\' field is missing from data when evaluating the timing.')
    return;
  }

  let lastTimeSec = timeOffset;  // time of the last step

  let buildOrderData = dataBO['build_order'];
  const stepCount = buildOrderData.length;

  // Loop on all the build order steps
  for (const [currentStepID, currentStep] of enumerate(buildOrderData)) {
    let stepTotalTime = 0.0;  // total time for this step

    // Worker count
    let workerCount = currentStep['worker_count'];
    const resources = currentStep['resources'];
    if (workerCount < 0) {
      workerCount = Math.max(0, resources['wood']) + Math.max(0, resources['food']) +
          Math.max(0, resources['gold']);
      if (pantheon === 'Greeks') {  // Only Greeks villagers can gather favor
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
        (1 <= currentStep['age'] && currentStep['age'] <= 5) ? currentStep['age'] : currentAge;
    if (nextAge === currentAge + 1)  // researching next age up
    {
      stepTotalTime += getResearchAgeUpTimeAoM(currentAge);
    }
    currentAge = nextAge;  // current age update

    // Update time
    lastTimeSec += stepTotalTime;

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
 * Get the images available for AoM, sorted by sub-folder.
 *
 * @returns Dictionary with all the images per sub-folder.
 */
function getImagesAoM() {
  // This is obtained using the 'python/utilities/list_images.py' script.
  let imagesDict =
      {
        'age':
            'age_unknown.png#archaic_age.png#classical_age.png#heroic_age.png#mythic_age.png#wonder_age.png',
        'animal':
            'arctic_wolf.png#aurochs.png#baboon.png#bear.png#boar.png#caribou.png#chicken.png#cow.png#crocodile.png#crowned_crane.png#deer.png#elephant.png#elk.png#fish.png#gazelle.png#giraffe.png#goat.png#hippopotamus.png#hyena.png#lion.png#monkey.png#pig.png#polar_bear.png#rhinoceros.png#tiger.png#walrus.png#water_buffalo.png#wolf.png#zebra.png',
        'armory':
            'armory.png#ballistics.png#bronze_armor.png#bronze_shields.png#bronze_weapons.png#burning_pitch.png#copper_armor.png#copper_shields.png#copper_weapons.png#iron_armor.png#iron_shields.png#iron_weapons.png',
        'atlanteans_building':
            'counter-barracks.png#economic_guild.png#manor.png#military_barracks.png#mirror_tower.png#palace.png#sky_passage.png#time_shift.png#town_center_atlantean.png',
        'atlanteans_civilian': 'caravan_atlantean.png#citizen.png',
        'atlanteans_hero':
            'arcus_hero.png#cheiroballista_hero.png#citizen_hero.png#contarius_hero.png#destroyer_hero.png#fanatic_hero.png#katapeltes_hero.png#murmillo_hero.png#oracle_hero.png#turma_hero.png',
        'atlanteans_human':
            'arcus.png#contarius.png#destroyer.png#fanatic.png#katapeltes.png#murmillo.png#oracle_unit.png#turma.png',
        'atlanteans_minor_god':
            'atlas.png#hekate.png#helios.png#hyperion.png#leto.png#oceanus.png#prometheus.png#rheia.png#theia.png',
        'atlanteans_myth':
            'argus.png#atlantean_titan.png#automaton.png#behemoth.png#caladria.png#centimanus.png#dryad.png#lampades.png#man_o_war.png#nereid.png#promethean.png#satyr.png#servant.png#stymphalian_bird.png',
        'atlanteans_power':
            'carnivora_power.png#chaos.png#deconstruction.png#gaia_forest.png#hesperides.png#implode.png#shockwave.png#spider_lair.png#tartarian_gate_power.png#traitor.png#valor.png#vortex.png',
        'atlanteans_ship':
            'bireme.png#fire_ship.png#fishing_ship_atlantean.png#siege_bireme.png#transport_ship_atlantean.png',
        'atlanteans_siege': 'cheiroballista.png#fire_siphon.png',
        'atlanteans_tech':
            'alluvial_clay.png#asper_blood.png#bite_of_the_shark.png#celerity.png#channels.png#conscript_counter_soldiers.png#conscript_mainline_soldiers.png#conscript_palace_soldiers.png#empyrian_speed.png#eyes_of_atlas.png#focus.png#gemini.png#guardian_of_io.png#halo_of_the_sun.png#heart_of_the_titans.png#hephaestus_revenge.png#heroic_renewal.png#horns_of_consecration.png#lance_of_stone.png#lemuriandescendants.png#levy_counter_soldiers.png#levy_mainline_soldiers.png#levy_palace_soldiers.png#mythic_rejuvenation.png#orichalcum_mail.png#petrification.png#poseidons_secret.png#rheias_gift.png#safe_passage.png#temporal_chaos.png#titan_shield.png#volcanic_forge.png#weightless_mace.png',
        'chinese_blessing':
            'creator_auspice.png#shennong_gift_all.png#yang.png#yin.png#yin_yang.png',
        'chinese_building':
            'baolei.png#camp_tower.png#camp_trainingyard.png#crossbow_tower.png#great_wall.png#guard_tower_chinese.png#imperial_academy.png#machine_workshop.png#military_camp.png#silo.png#watch_tower_chinese.png',
        'chinese_civilian':
            'clay_peasant.png#kuafu.png#mechanical_ox_caravan.png#peasant.png#sky_lantern.png',
        'chinese_hero':
            'jiang_ziya.png#li_jing.png#nezha.png#nezha_child.png#nezha_youth.png#pioneer.png#sage.png#wen_zhong.png#yang_jian.png',
        'chinese_human':
            'chu_ko_nu.png#dao_swordsman.png#fire_archer.png#ge_halberdier.png#summon_terracotta_riders.png#terracotta_rider.png#tiger_cavalry.png#white_horse_cavalry.png#wuzu_javelineer.png',
        'chinese_minor_god':
            'chiyou.png#gonggong.png#goumang.png#houtu.png#huangdi.png#nuba.png#rushou.png#xuannu.png#zhurong.png',
        'chinese_myth':
            'baihu.png#chiwen.png#hundun.png#pixiu.png#qilin.png#qinglong.png#qiongqi.png#taotie.png#taowu.png#titan_chinese.png#xuanwu.png#yazi.png#zhuque.png',
        'chinese_power':
            'blazing_prairie.png#creation.png#drought.png#earth_wall_power.png#fei_beasts.png#forest_protection.png#great_flood.png#lightning_weapons.png#peachblossomspring_power.png#prosperous_seeds.png#vanish.png#yinglongs_wrath.png',
        'chinese_ship': 'doujian.png#louchuan.png#mengchong.png',
        'chinese_siege': 'axe_cart.png#siege_crossbow.png',
        'chinese_tech':
            'abundance.png#advanced_defenses.png#autumn_of_abundance.png#bottomless_stomach.png#celestial_weapons.png#champion_infantry_chinese.png#chasing_the_sun.png#conscript_baolei_soldiers.png#divine_books.png#divine_judgement.png#divine_light.png#drought_ships.png#east_wind.png#flaming_blood.png#frenzied_dash.png#gilded_shields.png#heavy_infantry_chinese.png#herbal_medicine.png#hooves_of_the_wind.png#imperial_order.png#kuafu_chieftain.png#last_stand.png#leizu\'s_silk.png#levy_baolei_soldiers.png#maelstrom.png#master_of_weaponry.png#medium_infantry_chinese.png#mountainous_might.png#peach_of_immortality.png#power_of_chaos.png#qilin\'s_blessing.png#rage_of_slaughter.png#red_cliffs_fleet.png#reincarnation.png#rising_tide.png#rock_solid.png#scorching_feathers.png#shaker_of_heaven.png#silk_road.png#sinister_defiance.png#sky_fire.png#slash_and_burn.png#song_of_midsummer.png#son_of_loong.png#southern_fire.png#spoils_of_war.png#summon_terracotta_riders.png#tai_chi.png#tempestuous_storm.png#vibrant_land.png#xuanyuan\'s_bloodline.png',
        'defensive':
            'boiling_oil.png#bronze_wall.png#carrier_pigeons.png#citadel_wall.png#crenellations.png#fortified_wall.png#guard_tower_upgrade.png#improvement_ballista_tower.png#improvement_watch_tower.png#iron_wall.png#orichalkos_wall.png#sentry_tower.png#signal_fires.png#stone_wall.png#wooden_wall.png',
        'dock':
            'arrowship_cladding.png#champion_warships.png#conscript_sailors.png#dock.png#enclosed_deck.png#heavy_warships.png#heroic_fleet.png#naval_oxybeles.png#purse_seine.png#reinforced_ram.png#salt_amphora.png',
        'economy':
            'bow_saw.png#carpenters.png#flood_control.png#hand_axe.png#husbandry.png#irrigation.png#pickaxe.png#plow.png#quarry.png#shaft_mine.png#survival_equipment.png',
        'egyptians_building':
            'barracks.png#granary.png#lighthouse.png#lumber_camp.png#migdol_stronghold.png#mining_camp.png#monument_to_villagers.png#obelisk.png#siege_works.png#town_center_egyptian.png',
        'egyptians_civilian': 'caravan_egyptian.png#laborer.png',
        'egyptians_hero': 'pharaoh.png#priest.png',
        'egyptians_human':
            'axeman.png#camel_rider.png#chariot_archer.png#mercenary.png#mercenary_cavalry.png#slinger.png#spearman.png#war_elephant.png',
        'egyptians_minor_god':
            'anubis.png#bast.png#horus.png#nephthys.png#osiris.png#ptah.png#sekhmet.png#sobek.png#thoth.png',
        'egyptians_myth':
            'anubite.png#avenger.png#egyptian_titan.png#leviathan.png#mummy.png#petsuchos.png#phoenix.png#roc.png#scarab.png#scorpion_man.png#son_of_osiris.png#sphinx.png#wadjet.png#war_turtle.png',
        'egyptians_power':
            'ancestors.png#citadel_power.png#eclipse.png#locust_swarm.png#meteor.png#plague_of_serpents.png#prosperity.png#rain.png#shifting_sands.png#son_of_osiris_power.png#tornado.png#vision.png',
        'egyptians_ship':
            'fishing_ship_egyptian.png#kebenit.png#ramming_galley.png#transport_ship_egyptian.png#war_barge.png',
        'egyptians_siege': 'catapult.png#siege_tower.png',
        'egyptians_tech':
            'adze_of_wepwawet.png#atef_crown.png#axe_of_vengeance.png#bone_bow.png#book_of_thoth.png#champion_axemen.png#champion_camel_riders.png#champion_chariot_archers.png#champion_slingers.png#champion_spearmen.png#champion_war_elephants.png#clairvoyance.png#conscript_barracks_soldiers.png#conscript_migdol_soldiers.png#crimson_linen.png#criosphinx.png#crocodilopolis.png#dark_water.png#desert_wind.png#electrum_bullets.png#feet_of_the_jackal.png#feral.png#flood_of_the_nile.png#force_of_the_west_wind.png#funeral_barge.png#funeral_rites.png#greatest_of_fifty.png#hands_of_the_pharaoh.png#heavy_axemen.png#heavy_camel_riders.png#heavy_chariot_archers.png#heavy_slingers.png#heavy_spearmen.png#heavy_war_elephants.png#hieracosphinx.png#leather_frame_shield.png#levy_barracks_soldiers.png#levy_migdol_soldiers.png#medium_axemen.png#medium_slingers.png#medium_spearmen.png#nebty.png#necropolis.png#new_kingdom.png#sacred_cats.png#scalloped_axe.png#serpent_spear.png#shaduf.png#skin_of_the_rhino.png#slings_of_the_sun.png#solar_barque - copy.png#solar_barque.png#spear_of_horus.png#spirit_of_maat.png#stones_of_red_linen.png#sundried_mud_brick.png#tusks_of_apedemak.png#valley_of_the_kings.png#city_of_the_dead.jpg',
        'greeks_building':
            'archery_range.png#fortress.png#granary.png#military_academy.png#stable.png#storehouse.png#town_center_greek.png#village_center_greeks.png',
        'greeks_civilian': 'caravan_greek.png#villager_greek.png',
        'greeks_hero':
            'achilles.png#ajax_spc.png#atalanta.png#bellerophon.png#chiron.png#heracles.png#hippolyta.png#jason.png#odysseus.png#perseus.png#polyphemus.png#theseus.png',
        'greeks_human':
            'gastraphetoros.png#hetairos.png#hippeus.png#hoplite.png#hypaspist.png#militia.png#myrmidon.png#peltast.png#prodromos.png#toxotes.png',
        'greeks_minor_god':
            'aphrodite.png#apollo.png#ares.png#artemis.png#athena.png#dionysus.png#hephaestus.png#hera.png#hermes.png',
        'greeks_myth':
            'carcinos.png#centaur.png#chimera.png#colossus.png#cyclops.png#greek_titan.png#hippocampus.png#hydra.png#manticore.png#medusa.png#minotaur.png#nemean_lion.png#pegasus.png#scylla.png',
        'greeks_power':
            'bolt.png#bronze.png#ceasefire.png#curse.png#earthquake.png#lightning_storm.png#lure_power.png#pestilence.png#plenty_vault.png#restoration.png#sentinel_power.png#underworld_passage.png',
        'greeks_ship':
            'fishing_ship_greek.png#juggernaut.png#pentekonter.png#transport_ship_greek.png#trireme.png',
        'greeks_siege': 'helepolis.png#petrobolos.png',
        'greeks_tech':
            'aegis_shield.png#anastrophe.png#argive_patronage.png#conscript_cavalry.png#conscript_infantry.png#conscript_ranged_soldiers.png#deimos_sword_of_dread.png#dionysia.png#divine_blood.png#enyos_bow_of_horror.png#face_of_the_gorgon.png#flames_of_typhon.png#forge_of_olympus.png#golden_apples.png#hand_of_talos.png#labyrinth_of_minos.png#levy_cavalry.png#levy_infantry.png#levy_ranged_soldiers.png#lord_of_horses.png#monstrous_rage.png#olympian_parentage.png#olympian_weapons.png#oracle.png#phobos_spear_of_panic.png#roar_of_orthus.png#sarissa.png#shafts_of_plague.png#shoulder_of_talos.png#spirited_charge.png#sun_ray.png#sylvan_lore.png#temple_of_healing.png#thracian_horses.png#trierarch.png#vaults_of_erebus.png#will_of_kronos.png#winged_messenger.png',
        'major_god':
            'freyr.png#fuxi.png#gaia.png#hades.png#isis.png#kronos.png#loki.png#nuwa.png#odin.png#oranos.png#poseidon.png#ra.png#set.png#shennong.png#thor.png#zeus.png',
        'market': 'ambassadors.png#coinage.png#market.png#tax_collectors.png',
        'norse_building':
            'dwarven_armory.png#great_hall.png#hill_fort.png#longhouse.png#town_center_norse.png',
        'norse_civilian': 'caravan_norse.png#dwarf.png#gatherer.png#ox_cart.png',
        'norse_hero': 'godi.png#hersir.png',
        'norse_human':
            'berserk.png#hirdman.png#huskarl.png#jarl.png#raiding_cavalry.png#throwing_axeman.png',
        'norse_minor_god':
            'aegir.png#baldr.png#bragi.png#forseti.png#freyja.png#heimdall.png#hel.png#njord.png#skadi.png#tyr.png#ullr.png#vidar.png',
        'norse_myth':
            'battle_boar.png#draugr.png#einherjar.png#fafnir.png#fenris_wolf_brood.png#fimbulwinter_wolf.png#fire_giant.png#frost_giant.png#jormun_elver.png#kraken.png#mountain_giant.png#nidhogg_unit.png#norse_titan.png#raven.png#rock_giant.png#troll.png#valkyrie.png#walking_woods_unit.png',
        'norse_power':
            'asgardian_bastion.png#dwarven_mine.png#fimbulwinter.png#flaming_weapons.png#forest_fire.png#frost.png#great_hunt.png#gullinbursti.png#healing_spring_power.png#inferno.png#nidhogg.png#ragnarok.png#spy.png#tempest.png#undermine.png#walking_woods_power.png',
        'norse_ship':
            'dragon_ship.png#dreki.png#fishing_ship_norse.png#longboat.png#transport_ship_norse.png',
        'norse_siege': 'ballista.png#portable_ram.png',
        'norse_tech':
            'arctic_winds.png#avenging_spirit.png#berserkergang.png#bravery.png#call_of_valhalla.png#cave_troll.png#conscript_great_hall_soldiers.png#conscript_hill_fort_soldiers.png#conscript_longhouse_soldiers.png#disablot.png#dragonscale_shields.png#dwarven_auger.png#dwarven_breastplate.png#dwarven_weapons.png#eyes_in_the_forest.png#feasts_of_renown.png#freyr\'s_gift.png#fury_of_the_fallen.png#gjallarhorn.png#granite_blood.png#granite_maw.png#grasp_of_ran.png#hall_of_thanes.png#hamask.png#hammer_of_thunder.png#huntress_axe.png#levy_great_hall_soldiers.png#levy_hill_fort_soldiers.png#levy_longhouse_soldiers.png#long_serpent.png#meteoric_iron_armor.png#nine_waves.png#rampage.png#rigsthula.png#rime.png#ring_giver.png#ring_oath.png#safeguard.png#servants_of_glory.png#sessrumnir.png#silent_resolve.png#sons_of_sleipnir.png#swine_array.png#thundering_hooves.png#thurisaz_rune.png#twilight_of_the_gods.png#valgaldr.png#winter_harvest.png#wrath_of_the_deep.png#ydalir.png',
        'other': 'farm.png#house.png#relic.png#titan_gate.png#wonder.png',
        'resource': 'berry.png#favor.png#food.png#gold.png#repair.png#tree.png#wood.png#worker.png',
        'tech_military':
            'champion_archers.png#champion_cavalry.png#champion_infantry.png#draft_horses.png#engineers.png#heavy_archers.png#heavy_cavalry.png#heavy_infantry.png#medium_archers.png#medium_cavalry.png#medium_infantry.png#norse_champion_infantry.png#norse_heavy_infantry.png#norse_medium_infantry.png',
        'temple': 'omniscience.png#temple.png',
        'town_center':
            'architects.png#fortified_town_center.png#masons.png#town_center.png#village_center.png'
      };

  // Split each string (e.g. 'image_0#image_1#image_2') in a list of images.
  for (const [key, value] of Object.entries(imagesDict)) {
    imagesDict[key] = value.split('#');
  }

  return imagesDict;
}

/**
 * Get the images conversion from RTS Overlay to DoD (Deities of Death) Clan icons (AoM).
 *
 * @returns Dictionary with conversion as 'RTS Overlay image: DoD Clan icon'.
 */
function getAoMConvertDodClan() {
  const convertDict = {
    'animal':
        'baboon.png:baboon#chicken.png:chicken#cow.png:cow#gazelle.png:hunt#goat.png:goat#pig.png:pig',
    'armory':
        'armory.png:armory#copper_armor.png:copper armor#copper_shields.png:copper shields#copper_weapons.png:copper weapons',
    'atlanteans_building':
        'counter-barracks.png:counter barrack#economic_guild.png:economic guild#manor.png:manor#military_barracks.png:military barrack',
    'atlanteans_civilian': 'citizen.png:citizen',
    'atlanteans_hero': 'oracle_hero.png:oracle hero',
    'atlanteans_human':
        'arcus.png:arcus#contarius.png:contarius#katapeltes.png:katapeltes#murmillo.png:murmillo#turma.png:turma',
    'atlanteans_myth':
        'automaton.png:automaton#dryad.png:dryad#promethean.png:promethean#servant.png:servant',
    'atlanteans_power':
        'deconstruction.png:deconstruction#gaia_forest.png:gaia forest#valor.png:valor',
    'chinese_building': 'imperial_academy.png:imperial academy',
    'chinese_civilian': 'kuafu.png:kuafu#peasant.png:villager',
    'chinese_hero': 'nezha_child.png:nezha#pioneer.png:pioneer',
    'chinese_human': 'fire_archer.png:fire archer#ge_halberdier.png:ge halberdier',
    'chinese_myth': 'qilin.png:qilin#qiongqi.png:qiongqi#yazi.png:yazi',
    'chinese_power':
        'creation.png:creation#peachblossomspring_power.png:peach blossom spring#prosperous_seeds.png:prosperous seeds',
    'chinese_tech': 'kuafu_chieftain.png:kuafu chieftain',
    'dock': 'dock.png:dock#purse_seine.png:purse seine',
    'economy':
        'bow_saw.png:bow saw#hand_axe.png:hand axe#husbandry.png:husbandry#pickaxe.png:pickaxe#quarry.png:quarry#shaft_mine.png:shaft mine',
    'egyptians_civilian': 'laborer.png:villager',
    'egyptians_hero': 'pharaoh.png:pharaoh#priest.png:priest',
    'egyptians_human':
        'axeman.png:axeman#camel_rider.png:camel rider#chariot_archer.png:chariot archer#slinger.png:slinger#spearman.png:spearman#war_elephant.png:war elephant',
    'egyptians_myth':
        'anubite.png:anubite#leviathan.png:leviathan#sphinx.png:sphinx#wadjet.png:wadjet',
    'egyptians_power': 'prosperity.png:prosperity#rain.png:rain#vision.png:vision',
    'egyptians_ship': 'ramming_galley.png:ramming galley',
    'egyptians_tech':
        'adze_of_wepwawet.png:adze of wepwawet#criosphinx.png:criosphinx#electrum_bullets.png:electrum bullets#feet_of_the_jackal.png:feet of the jackal#flood_of_the_nile.png:flood of the nile#heavy_chariot_archers.png:heavy chariot archer#hieracosphinx.png:hieracosphinx#levy_migdol_soldiers.png:levy migdol soldiers#medium_axemen.png:medium axemen#medium_slingers.png:medium slingers#medium_spearmen.png:medium spearmen#sacred_cats.png:sacred cat#serpent_spear.png:serpent spear#shaduf.png:shaduf',
    'greeks_building': 'military_academy.png:military academy',
    'greeks_civilian': 'villager_greek.png:villager',
    'greeks_hero':
        'achilles.png:achilles#ajax_spc.png:ajax#atalanta.png:atalanta#heracles.png:heracles#jason.png:jason#theseus.png:theseus',
    'greeks_human':
        'hippeus.png:hippeus#hoplite.png:hoplite#hypaspist.png:hypaspist#peltast.png:peltast#toxotes.png:toxotes',
    'greeks_myth': 'centaur.png:centaur#cyclops.png:cyclops#pegasus.png:pegasus#scylla.png:scylla',
    'greeks_power': 'bolt.png:bolt#lure_power.png:lure god power#sentinel_power.png:sentinel',
    'greeks_tech': 'oracle.png:oracle',
    'market': 'coinage.png:coinage#market.png:market',
    'norse_building': 'dwarven_armory.png:dwarven armory#great_hall.png:great hall',
    'norse_civilian': 'dwarf.png:dwarf#gatherer.png:villager',
    'norse_hero': 'godi.png:godi#hersir.png:hersir',
    'norse_human':
        'berserk.png:berserk#huskarl.png:huskarl#jarl.png:jarl#raiding_cavalry.png:raiding cavalry#throwing_axeman.png:throwing axeman',
    'norse_myth':
        'battle_boar.png:battle boar#einherjar.png:einheri#mountain_giant.png:mountain giant#raven.png:raven#troll.png:troll#valkyrie.png:valkyrie',
    'norse_power': 'dwarven_mine.png:dwarven mine#great_hunt.png:great_hunt#spy.png:spy',
    'norse_ship': 'fishing_ship_norse.png:fishing ship',
    'norse_tech':
        'dwarven_breastplate.png:dwarven breastplate#hammer_of_thunder.png:hammer of thunder#rigsthula.png:rigsthula#safeguard.png:safeguard#winter_harvest.png:winter harvest',
    'other': 'house.png:house',
    'resource': 'favor.png:favor#food.png:food#gold.png:gold#wood.png:wood#worker.png:villager',
    'tech_military':
        'heavy_archers.png:heavy archers#heavy_cavalry.png:heavy cavalry#heavy_infantry.png:heavy infantry#medium_archers.png:medium archers#medium_cavalry.png:medium cavalry#medium_infantry.png:medium infantry',
    'temple': 'temple.png:temple',
    'atlanteans_minor_god':
        'atlas.png:atlas#hekate.png:hecate#helios.png:helios#hyperion.png:hyperion#leto.png:leto#oceanus.png:oceanus#prometheus.png:prometheus#rheia.png:rheia#theia.png:theia',
    'chinese_minor_god':
        'chiyou.png:chiyou#gonggong.png:gonggong#goumang.png:goumang#houtu.png:houtu#huangdi.png:huangdi#nuba.png:nuba#rushou.png:rushou#xuannu.png:xuannu#zhurong.png:zhurong',
    'egyptians_minor_god':
        'anubis.png:anubis#bast.png:bast#horus.png:horus#nephthys.png:nephthys#osiris.png:osiris#ptah.png:ptah#sekhmet.png:sekhmet#sobek.png:sobek#thoth.png:thoth',
    'greeks_minor_god':
        'aphrodite.png:aphrodite#apollo.png:apollo#ares.png:ares#artemis.png:artemis#athena.png:athena#dionysus.png:dionysus#hephaestus.png:hephaestus#hera.png:hera#hermes.png:hermes',
    'major_god':
        'freyr.png:freyr#fuxi.png:fuxi#gaia.png:gaia#hades.png:hades#isis.png:isis#kronos.png:kronos#loki.png:loki#nuwa.png:nuwa#odin.png:odin#oranos.png:oranos#poseidon.png:poseidon#ra.png:ra#set.png:set#shennong.png:shennong#thor.png:thor#zeus.png:zeus',
    'norse_minor_god':
        'aegir.png:aegir#baldr.png:baldr#bragi.png:bragi#forseti.png:forseti#freyja.png:freyja#heimdall.png:heimdall#hel.png:hel#njord.png:njord#skadi.png:skadi#tyr.png:tyr#ullr.png:ullr#vidar.png:vidar'
  };

  // Split each string in a list of conversion from RTS Overlay to DoD clan icons.
  let result = {};
  for (const [folder, imagesConvert] of Object.entries(convertDict)) {
    for (const imageConvert of imagesConvert.split('#')) {
      const convertSplit = imageConvert.split(':');
      console.assert(convertSplit.length === 2);
      result[folder + '/' + convertSplit[0]] = convertSplit[1];
    }
  }

  return result;
}

/**
 * Generate a CSV file to provide to DoD (Deities of Death) Clan members to add on
 * 'https://thedodclan.com/build-orders'.
 */
function generateCSVForDodClan() {
  // Check if build order is valid.
  if (!checkValidBO()) {
    alert(
        'Build order is not valid and cannot be exported as CSV file to upload on DoD (Deities of Death) Clan page.');
  } else {
    // Get dictionary to convert images from RTS Overlay to DoD Clan icons
    const convertDict = getAoMConvertDodClan();

    // Age tracking
    let currentAge = 1;  // Age 1 is Archaic
    let advanceStep = false;

    const ages = {1: 'Archaic', 2: 'Classical', 3: 'Heroic', 4: 'Mythic'};

    // Name of the CSV file to export
    const csvName = dataBO.major_god.toLowerCase().replace(/\s+/g, '_') + '_' +
        dataBO.name.toLowerCase().replace(/\s+/g, '_') + '.csv';

    // Convert BO content to string to add in a CSV file
    let csvContent = 'sep=;';
    csvContent += '\n' + dataBO.name + ';;;';
    csvContent += '\nArchaic;;;';
    csvContent += '\nFood / Wood / Gold / Favor / Villager;;;';

    // Loop on all the BO steps
    for (let i = 0; i < dataBO.build_order.length; i++) {
      const step = dataBO.build_order[i];
      const resources = step.resources;

      // Check if age was updated
      if (step.age > currentAge) {  // Advance to next age
        csvContent += '\nAdvance to ' + (ages[step.age] || 'Wonder') + ' age;;;';
        csvContent += '\nFood / Wood / Gold / Favor / Villager;;;';
        currentAge = step.age;
        advanceStep = true;
      } else if (advanceStep) {  // Arriving to next age
        csvContent += '\n' + (ages[currentAge] || 'Wonder') + ';;;';
        csvContent += '\nFood / Wood / Gold / Favor / Villager;;;';
        advanceStep = false;
      }

      // Add resources in the first column
      csvContent += '\n' + (resources.food < 0 ? 'xx' : resources.food) + ' / ' +
          (resources.wood < 0 ? 'xx' : resources.wood) + ' / ' +
          (resources.gold < 0 ? 'xx' : resources.gold) + ' / ' +
          (resources.favor < 0 ? 'xx' : resources.favor) + ' / ' +
          (step.worker_count < 0 ? 'xx' : step.worker_count);

      // Add time if present
      if ('time' in step) {
        csvContent += ' (' + step.time + ')';
      }

      // Loop on the notes
      const notes = step.notes;
      let noteCount = 0;
      for (let j = 0; j < notes.length; j++) {
        const note = notes[j];

        // Replace each image entry with the DOD Clan image name, or an easy-to-read name
        let updatedNote = note.replace(/@([^@]+)@/g, (match, p1) => {
          let replacement;
          if (convertDict.hasOwnProperty(p1)) {  // Image is present in the conversion dictionary
            replacement = convertDict[p1];
          } else {  // Image is missing from the dictionary
            // Extract the file name (no path, no extension)
            let parts = p1.split('/');
            let fileName = parts.pop();
            // Remove the extension
            const dotIndex = fileName.lastIndexOf('.');
            if (dotIndex !== -1) {
              fileName = fileName.substring(0, dotIndex);
            }
            replacement = fileName.replace(/_/g, ' ');  // Replace underscores with spaces
          }
          // Always add one space before and after the replacement
          return ' ' + replacement + ' ';
        });

        // Replace consecutive spaces with a single space, then trim the result
        updatedNote = updatedNote.replace(/\s+/g, ' ').trim();

        // Remove extra spaces inside parantheses
        updatedNote = updatedNote.replace(/\(\s+/g, '(').replace(/\s+\)/g, ')');

        // Max 4 columns, so max 3 notes per row (1st column is the resource distribution)
        if (noteCount >= 3) {
          csvContent += '\n';
          noteCount = 0;
        }
        csvContent += ';' + updatedNote;
        noteCount++;
      }

      // Add remaining ';' to keep 4 columns (1st column is the resource distribution)
      for (let j = noteCount; j < 3; j++) {
        csvContent += ';';
      }
    }

    // Export as CSV
    const blob = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', csvName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Message to suggest CSV file to DoD Clan
    if (localStorage.getItem('hideExportDoDMessage') !== 'true') {
      const userChoice = confirm(
          'Your build order was exported as a CSV file (' + csvName +
          '). Visit https://thedodclan.com/build-orders to see how to suggest it (to publish on the corresponding website).' +
          '\n\nHide this message next time?');
      if (userChoice) {
        localStorage.setItem('hideExportDoDMessage', 'true');
      }
    }
  }
}

/**
 * Get the factions with 3 letters shortcut and icon, for AoM.
 *
 * @returns Dictionary with faction name as key, and its 3 letters + image as value.
 */
function getFactionsAoM() {
  return {
    // Greeks
    'Zeus': ['ZEU', 'zeus.png'],
    'Hades': ['HAD', 'hades.png'],
    'Poseidon': ['POS', 'poseidon.png'],
    // Egyptians
    'Ra': ['RA', 'ra.png'],
    'Isis': ['ISI', 'isis.png'],
    'Set': ['SET', 'set.png'],
    // Norse
    'Thor': ['THO', 'thor.png'],
    'Odin': ['ODI', 'odin.png'],
    'Loki': ['LOK', 'loki.png'],
    'Freyr': ['FRE', 'freyr.png'],
    // Atlanteans
    'Kronos': ['KRO', 'kronos.png'],
    'Oranos': ['ORA', 'oranos.png'],
    'Gaia': ['GAI', 'gaia.png'],
    // Chinese
    'Fuxi': ['FUX', 'fuxi.png'],
    'Nuwa': ['NUW', 'nuwa.png'],
    'Shennong': ['SHE', 'shennong.png']
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
    new SinglePanelColumn('age'), new SinglePanelColumn('time', common + 'icon/time.png'),
    new SinglePanelColumn('worker_count', resource + 'worker.png'),
    new SinglePanelColumn('resources/food', resource + 'food.png'),
    new SinglePanelColumn('resources/wood', resource + 'wood.png'),
    new SinglePanelColumn('resources/gold', resource + 'gold.png'),
    new SinglePanelColumn('resources/favor', resource + 'favor.png'),
    new SinglePanelColumn('resources/builder', resource + 'repair.png')
  ];

  columnsDescription[0].text = 'Age';                       // age selection
  columnsDescription[0].isSelectwidget = true;              // age selection
  columnsDescription[1].italic = true;                      // time
  columnsDescription[1].optional = true;                    // time
  columnsDescription[2].bold = true;                        // worker count
  columnsDescription[2].backgroundColor = [50, 50, 50];     // worker count
  columnsDescription[3].backgroundColor = [153, 94, 89];    // food
  columnsDescription[4].backgroundColor = [94, 72, 56];     // wood
  columnsDescription[5].backgroundColor = [135, 121, 78];   // gold
  columnsDescription[6].backgroundColor = [100, 100, 100];  // favor
  columnsDescription[7].optional = true;                    // builder

  columnsDescription[1].tooltip = 'step end time as \'x:yy\'';  // time
  columnsDescription[2].tooltip = 'number of workers';          // worker count
  columnsDescription[3].tooltip = 'villagers on food';          // food
  columnsDescription[4].tooltip = 'villagers on wood';          // wood
  columnsDescription[5].tooltip = 'villagers on gold';          // gold
  columnsDescription[6].tooltip = 'favor gatherers';            // favor
  columnsDescription[7].tooltip = 'number of builders';         // builder

  // Show only positive characters for resources
  for (let i = 2; i <= 7; i++) {
    columnsDescription[i].isIntegerInRawBO = true;
    columnsDescription[i].showOnlyPositive = true;
  }
  columnsDescription[0].isIntegerInRawBO = true;  // age selection

  // Age selection
  visualEditortableWidgetDescription = [
    [-1, '?', 'age/age_unknown.png'], [1, 'ARC', 'age/archaic_age.png'],
    [2, 'CLA', 'age/classical_age.png'], [3, 'HER', 'age/heroic_age.png'],
    [4, 'MYT', 'age/mythic_age.png'], [5, 'WON', 'age/wonder_age.png']
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
    new SinglePanelColumn('time', common + 'icon/time.png'),
    new SinglePanelColumn('worker_count', resource + 'worker.png'),
    new SinglePanelColumn('resources/builder', resource + 'repair.png'),
    new SinglePanelColumn('resources/food', resource + 'food.png'),
    new SinglePanelColumn('resources/wood', resource + 'wood.png'),
    new SinglePanelColumn('resources/gold', resource + 'gold.png'),
    new SinglePanelColumn('resources/favor', resource + 'favor.png')
  ];

  columnsDescription[0].italic = true;                      // time
  columnsDescription[0].hideIfAbsent = true;                // time
  columnsDescription[0].textAlign = 'right';                // time
  columnsDescription[1].bold = true;                        // worker count
  columnsDescription[2].hideIfAbsent = true;                // builder
  columnsDescription[3].backgroundColor = [153, 94, 89];    // food
  columnsDescription[4].backgroundColor = [94, 72, 56];     // wood
  columnsDescription[5].backgroundColor = [135, 121, 78];   // gold
  columnsDescription[6].backgroundColor = [100, 100, 100];  // favor

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
      2: topArrow + 'Aging up to Classical Age',
      3: topArrow + 'Aging up to Heroic Age',
      4: topArrow + 'Aging up to Mythic Age',
      5: topArrow + 'Aging up to Wonder Age'
    },
    // Header after the current row
    'after': {
      1: getBOImageHTML(game + 'age/archaic_age.png') + 'Archaic Age',
      2: getBOImageHTML(game + 'age/classical_age.png') + 'Classical Age',
      3: getBOImageHTML(game + 'age/heroic_age.png') + 'Heroic Age',
      4: getBOImageHTML(game + 'age/mythic_age.png') + 'Mythic Age',
      5: getBOImageHTML(game + 'age/wonder_age.png') + 'Wonder Age'
    }
  };
  // Header for first line
  sectionsHeader['first_line'] = sectionsHeader.after;

  // Feed game description to generic function
  openSinglePanelPageFromDescription(columnsDescription, sectionsHeader);
}
