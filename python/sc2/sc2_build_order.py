from sc2.sc2_race_icon import sc2_race_icon
from common.build_order_tools import convert_txt_note_to_illustrated, check_valid_faction, FieldDefinition, \
    check_valid_steps

# Dictionary from Spawning Tool BO to SC2 stored images
sc2_pictures_dict = {
    'Baneling': 'zerg_units/Baneling.png',
    'Brood Lord': 'zerg_units/Brood_Lord.png',
    'Broodling': 'zerg_units/Broodling.png',
    'Changeling': 'zerg_units/Changeling.png',
    'Corruptor': 'zerg_units/Corruptor.png',
    'Drone': 'zerg_units/Drone.png',
    'Hydralisk': 'zerg_units/Hydralisk.png',
    'Infested Terran': 'zerg_units/Infested_Terran.png',
    'Infestor': 'zerg_units/Infestor.png',
    'Larva': 'zerg_units/Larva.png',
    'Lurker': 'zerg_units/Lurker.png',
    'Mutalisk': 'zerg_units/Mutalisk.png',
    'Overlord': 'zerg_units/Overlord.png',
    'Overseer': 'zerg_units/Overseer.png',
    'Queen': 'zerg_units/Queen.png',
    'Ravager': 'zerg_units/Ravager.png',
    'Roach': 'zerg_units/Roach.png',
    'Swarm Host': 'zerg_units/Swarm_Host.png',
    'Ultralisk': 'zerg_units/Ultralisk.png',
    'Viper': 'zerg_units/Viper.png',
    'Zergling': 'zerg_units/Zergling.png',

    'Baneling Nest': 'zerg_buildings/Baneling_Nest.png',
    'Creep Tumor': 'zerg_buildings/Creep_Tumor.png',
    'Evolution Chamber': 'zerg_buildings/Evolution_Chamber.png',
    'Extractor': 'zerg_buildings/Extractor.png',
    'Greater Spire': 'zerg_buildings/Greater_Spire.png',
    'Hatchery': 'zerg_buildings/Hatchery.png',
    'Hive': 'zerg_buildings/Hive.png',
    'Hydralisk Den': 'zerg_buildings/Hydralisk_Den.png',
    'Infestation Pit': 'zerg_buildings/Infestation_Pit.png',
    'Lair': 'zerg_buildings/Lair.png',
    'Lurker Den': 'zerg_buildings/LurkerDen.png',
    'Nydus Network': 'zerg_buildings/Nydus_Network.png',
    'Nydus Worm': 'zerg_buildings/Nydus_Worm.png',
    'Roach Warren': 'zerg_buildings/Roach_Warren.png',
    'Spawning Pool': 'zerg_buildings/Spawning_Pool.png',
    'Spine Crawler': 'zerg_buildings/Spine_Crawler.png',
    'Spire': 'zerg_buildings/Spire.png',
    'Spore Crawler': 'zerg_buildings/Spore_Crawler.png',
    'Ultralisk Cavern': 'zerg_buildings/Ultralisk_Cavern.png',

    'Adaptive Talons': 'zerg_techs/Adaptive_Talons.png',
    'Adrenal Glands': 'zerg_techs/Adrenal_glands.png',
    'Anabolic Synthesis': 'zerg_techs/Anabolic_Synthesis.png',
    'Burrow': 'zerg_techs/Burrow.png',
    'Centrifugal Hooks': 'zerg_techs/Centrifugal_hooks.png',
    'Chitinous Plating': 'zerg_techs/Chitinous_Plating.png',
    'Flyer Attack Level 1': 'zerg_techs/Flyer_attack_1.png',
    'Flyer Attack Level 2': 'zerg_techs/Flyer_attack_2.png',
    'Flyer Attack Level 3': 'zerg_techs/Flyer_attack_3.png',
    'Flyer Carapace Level 1': 'zerg_techs/Flyer_carapace_1.png',
    'Flyer Carapace Level 2': 'zerg_techs/Flyer_carapace_2.png',
    'Flyer Carapace Level 3': 'zerg_techs/Flyer_carapace_3.png',
    'Glial Reconstitution': 'zerg_techs/Glial_reconstitution.png',
    'Grooved Spines': 'zerg_techs/Grooved_Spines.png',
    'Ground Carapace Level 1': 'zerg_techs/Ground_carapace_1.png',
    'Ground Carapace Level 2': 'zerg_techs/Ground_carapace_2.png',
    'Ground Carapace Level 3': 'zerg_techs/Ground_carapace_3.png',
    'Melee Attacks Level 1': 'zerg_techs/Melee_attacks_1.png',
    'Melee Attacks Level 2': 'zerg_techs/Melee_attacks_2.png',
    'Melee Attacks Level 3': 'zerg_techs/Melee_attacks_3.png',
    'Metabolic Boost': 'zerg_techs/Metabolic_boost.png',
    'Microbial Shroud': 'zerg_techs/Microbial_Shroud.png',
    'Missile Attacks Level 1': 'zerg_techs/Missile_attacks_1.png',
    'Missile Attacks Level 2': 'zerg_techs/Missile_attacks_2.png',
    'Missile Attacks Level 3': 'zerg_techs/Missile_attacks_3.png',
    'Muscular Augments': 'zerg_techs/Muscular_Augments.png',
    'Mutate Ventral Sacs': 'zerg_techs/Mutate_Ventral_Sacs.png',
    'Neural Parasite': 'zerg_techs/Neural_parasite.png',
    'Pathogen Glands': 'zerg_techs/Pathogen_glands.png',
    'Pneumatized Carapace': 'zerg_techs/Pneumatized_carapace.png',
    'Seismic Spines': 'zerg_techs/Seismic_Spines.png',
    'Tunneling Claws': 'zerg_techs/Tunneling_claws.png',

    'Auto-turret': 'terran_units/Auto-turret.png',
    'Banshee': 'terran_units/Banshee.png',
    'Battlecruiser': 'terran_units/Battlecruiser.png',
    'Cyclone': 'terran_units/Cyclone.png',
    'Ghost': 'terran_units/Ghost.png',
    'Hellbat': 'terran_units/Hellbat.png',
    'Hellion': 'terran_units/Hellion.png',
    'Liberator': 'terran_units/Liberator.png',
    'Marauder': 'terran_units/Marauder.png',
    'Marine': 'terran_units/Marine.png',
    'Medivac': 'terran_units/Medivac.png',
    'MULE': 'terran_units/MULE.png',
    'Point Defense Drone': 'terran_units/Point_defense_drone.png',
    'Raven': 'terran_units/Raven.png',
    'Reaper': 'terran_units/Reaper.png',
    'SCV': 'terran_units/SCV.png',
    'Siege Tank': 'terran_units/SiegeTank.png',
    'Thor': 'terran_units/Thor.png',
    'Viking': 'terran_units/Viking.png',
    'Widow Mine': 'terran_units/WidowMine.png',

    'Armory': 'terran_buildings/Armory.png',
    'Barracks': 'terran_buildings/Barracks.png',
    'Bunker': 'terran_buildings/Bunker.png',
    'Command Center': 'terran_buildings/CommandCenter.png',
    'Engineering Bay': 'terran_buildings/EngineeringBay.png',
    'Factory': 'terran_buildings/Factory.png',
    'Fusion Core': 'terran_buildings/FusionCore.png',
    'Ghost Academy': 'terran_buildings/GhostAcademy.png',
    'Missile Turret': 'terran_buildings/MissileTurret.png',
    'Orbital Command': 'terran_buildings/OrbitalCommand.png',
    'Planetary Fortress': 'terran_buildings/PlanetaryFortress.png',
    'Reactor': 'terran_buildings/Reactor.png',
    'Refinery': 'terran_buildings/Refinery.png',
    'Sensor Tower': 'terran_buildings/SensorTower.png',
    'Starport': 'terran_buildings/Starport.png',
    'Supply Depot': 'terran_buildings/SupplyDepot.png',
    'TechLab': 'terran_buildings/TechLab.png',

    'Advanced Ballistics': 'terran_techs/Advanced_Ballistics.png',
    'Behemoth Reactor': 'terran_techs/Behemoth_reactor.png',
    'Build Reactor': 'terran_techs/Build_Reactor.png',
    'Tech Lab': 'terran_techs/Build_Tech_Lab.png',
    'Building Armor': 'terran_techs/Building_armor.png',
    'Calldown Extra Supplies': 'terran_techs/Calldown_extra_supplies.png',
    'Calldown Mule': 'terran_techs/Calldown_mule.png',
    'Cloak': 'terran_techs/Cloak.png',
    'Enhanced Shockwaves': 'terran_techs/Enhanced_Shockwaves.png',
    'High Capacity Fuel Tanks': 'terran_techs/High_Capacity_Fuel_Tanks.png',
    'Hisec Auto Tracking': 'terran_techs/Hisec_auto_tracking.png',
    'Infantry Armor Level 1': 'terran_techs/Infantry_armor_1.png',
    'Infantry Armor Level 2': 'terran_techs/Infantry_armor_2.png',
    'Infantry Armor Level 3': 'terran_techs/Infantry_armor_3.png',
    'Infantry Weapons Level 1': 'terran_techs/Infantry_weapons_1.png',
    'Infantry Weapons Level 2': 'terran_techs/Infantry_weapons_2.png',
    'Infantry Weapons Level 3': 'terran_techs/Infantry_weapons_3.png',
    'Lower': 'terran_techs/Lower.png',
    'Moebius Reactor': 'terran_techs/Moebius_reactor.png',
    'Neosteel Frames': 'terran_techs/Neosteel_frames.png',
    'Nuke': 'terran_techs/Nuke.png',
    'Scanner sweep': 'terran_techs/Scanner_sweep.png',
    'Ship Weapons Level 1': 'terran_techs/Ship_weapons_1.png',
    'Ship Weapons Level 2': 'terran_techs/Ship_weapons_2.png',
    'Ship Weapons Level 3': 'terran_techs/Ship_weapons_3.png',
    'Vehicle Plating Level 1': 'terran_techs/Vehicle_plating_1.png',
    'Vehicle Plating Level 2': 'terran_techs/Vehicle_plating_2.png',
    'Vehicle Plating Level 3': 'terran_techs/Vehicle_plating_3.png',
    'Vehicle Weapons Level 1': 'terran_techs/Vehicle_weapons_1.png',
    'Vehicle Weapons Level 2': 'terran_techs/Vehicle_weapons_2.png',
    'Vehicle Weapons Level 3': 'terran_techs/Vehicle_weapons_3.png',
    'Yamato Cannon': 'terran_techs/Yamato_cannon.png',

    'Adept': 'protoss_units/Adept.png',
    'Archon': 'protoss_units/Archon.png',
    'Carrier': 'protoss_units/Carrier.png',
    'Colossus': 'protoss_units/Colossus.png',
    'Dark Templar': 'protoss_units/Dark_Templar.png',
    'Disruptor': 'protoss_units/Disruptor.png',
    'High Templar': 'protoss_units/High_Templar.png',
    'Immortal': 'protoss_units/Immortal.png',
    'Mothership': 'protoss_units/Mothership.png',
    'Mothership Core': 'protoss_units/Mothership_Core.png',
    'Observer': 'protoss_units/Observer.png',
    'Oracle': 'protoss_units/Oracle.png',
    'Phoenix': 'protoss_units/Phoenix.png',
    'Probe': 'protoss_units/Probe.png',
    'Sentry': 'protoss_units/Sentry.png',
    'Stalker': 'protoss_units/Stalker.png',
    'Tempest': 'protoss_units/Tempest.png',
    'Void Ray': 'protoss_units/VoidRay.png',
    'Warp Prism': 'protoss_units/Warp_Prism.png',
    'Zealot': 'protoss_units/Zealot.png',

    'Assimilator': 'protoss_buildings/Assimilator.png',
    'Cybernetics Core': 'protoss_buildings/Cybernetics_Core.png',
    'Dark Shrine': 'protoss_buildings/Dark_Shrine.png',
    'Fleet Beacon': 'protoss_buildings/Fleet_Beacon.png',
    'Forge': 'protoss_buildings/Forge.png',
    'Gateway': 'protoss_buildings/Gateway.png',
    'Nexus': 'protoss_buildings/Nexus.png',
    'Photon Cannon': 'protoss_buildings/Photon_Cannon.png',
    'Pylon': 'protoss_buildings/Pylon.png',
    'Robotics Bay': 'protoss_buildings/Robotics_Bay.png',
    'Robotics Facility': 'protoss_buildings/Robotics_Facility.png',
    'Shield Battery': 'protoss_buildings/ShieldBattery.png',
    'Stargate': 'protoss_buildings/Stargate.png',
    'Stasis Ward': 'protoss_buildings/StasisWard.png',
    'Templar Archives': 'protoss_buildings/Templar_Archives.png',
    'Twilight Council': 'protoss_buildings/Twilight_Council.png',
    'Warp Gate': 'protoss_buildings/Warp_Gate.png',

    'Air Armor Level 1': 'protoss_techs/Air_armor_1.png',
    'Air Armor Level 2': 'protoss_techs/Air_armor_2.png',
    'Air Armor Level 3': 'protoss_techs/Air_armor_3.png',
    'Air Weapons Level 1': 'protoss_techs/Air_weapons_1.png',
    'Air Weapons Level 2': 'protoss_techs/Air_weapons_2.png',
    'Air Weapons Level 3': 'protoss_techs/Air_weapons_3.png',
    'Anion Pulse-Crystals': 'protoss_techs/Anion_Pulse-Crystals.png',
    'Battery Overcharge': 'protoss_techs/Battery_Overcharge.png',
    'Blink': 'protoss_techs/Blink.png',
    'Charge': 'protoss_techs/Charge.png',
    'Chrono Boost': 'protoss_techs/Chrono_boost.png',
    'Extended Thermal Lances': 'protoss_techs/Extended_thermal_lances.png',
    'Flux Vanes': 'protoss_techs/Flux_Vanes.png',
    'Gravitic Booster': 'protoss_techs/Gravitic_booster.png',
    'Gravitic Drive': 'protoss_techs/Gravitic_drive.png',
    'Graviton Catapult': 'protoss_techs/Graviton_catapult.png',
    'Ground Armor Level 1': 'protoss_techs/Ground_armor_1.png',
    'Ground Armor Level 2': 'protoss_techs/Ground_armor_2.png',
    'Ground Armor Level 3': 'protoss_techs/Ground_armor_3.png',
    'Ground Weapons Level 1': 'protoss_techs/Ground_weapons_1.png',
    'Ground Weapons Level 2': 'protoss_techs/Ground_weapons_2.png',
    'Ground Weapons Level 3': 'protoss_techs/Ground_weapons_3.png',
    'Guardian Shield': 'protoss_techs/Guardian_shield.png',
    'Mass Recall': 'protoss_techs/Mass_Recall.png',
    'Psionic Storm': 'protoss_techs/Psionic_storm.png',
    'Resonating Glaives': 'protoss_techs/Resonating_Glaives.png',
    'Shadow Stride': 'protoss_techs/Shadow_Stride.png',
    'Shields Level 1': 'protoss_techs/Shields_1.png',
    'Shields Level 2': 'protoss_techs/Shields_2.png',
    'Shields Level 3': 'protoss_techs/Shields_3.png',
    'Tectonic Destabilizers': 'protoss_techs/Tectonic_Destabilizers.png',
    'Transform Warpgate': 'protoss_techs/Transform_warpgate.png'
}


def check_valid_sc2_build_order(data: dict, bo_name_msg: bool = False) -> (bool, str):
    """Check if a build order is valid for SC2.

    Parameters
    ----------
    data           Data of the build order JSON file.
    bo_name_msg    True to add the build order name in the error message.

    Returns
    -------
    True if valid build order, False otherwise.
    String indicating the error (empty if no error).
    """
    bo_name_str: str = ''
    try:
        if bo_name_msg:
            bo_name_str = data['name'] + ' | '

        # Check correct race and opponent race
        valid_race, race_msg = check_valid_faction(
            data, bo_name_str, faction_name='race', factions_list=sc2_race_icon, requested=True, any_valid=False)
        if not valid_race:
            return False, race_msg

        valid_opponent_race, opponent_race_msg = check_valid_faction(
            data, bo_name_str, faction_name='opponent_race', factions_list=sc2_race_icon,
            requested=True, any_valid=True)
        if not valid_opponent_race:
            return False, opponent_race_msg

        fields = [
            FieldDefinition('notes', 'array of strings', True),
            FieldDefinition('time', 'string', False),
            FieldDefinition('supply', 'integer', False),
            FieldDefinition('minerals', 'integer', False),
            FieldDefinition('vespene_gas', 'integer', False)
        ]

        return check_valid_steps(data, bo_name_str, fields)

    except KeyError as err:
        return False, bo_name_str + f'Wrong JSON key: {err}.'

    except Exception as err:
        return False, bo_name_str + str(err)


def get_sc2_build_order_from_spawning_tool(
        data: str, race: str = 'Terran', opponent_race: str = 'Any',
        name: str = 'Build order name', patch: str = 'x.y.z', author: str = 'Author', source: str = 'Source') -> dict:
    """Get the StarCraft 2 build order from the text copied on https://lotv.spawningtool.com.

    Parameters
    ----------
    data             Data copied from https://lotv.spawningtool.com.
    race             Player race.
    opponent_race    Opponent race (can also be 'Any').
    name             Name of the build order.
    patch            Patch of the build order.
    author           Author of the build order.
    source           Source of the build order.

    Returns
    -------
    Build order in the requested JSON-like (dictionary) format.
    """
    out_data = dict()  # output data as build order dictionary

    # races
    out_data['race'] = race
    out_data['opponent_race'] = opponent_race

    # editable fields
    out_data['name'] = name
    out_data['patch'] = patch
    out_data['author'] = author
    out_data['source'] = source

    # store all the build order notes
    count = 0
    current_step = {}  # storing current step
    out_data['build_order'] = []

    for data_item in data.split('\n'):
        if (data_item == '') or (data_item.isspace()):  # ignore when containing only spaces (or empty)
            continue
        data_item = data_item.strip()  # remove extra spaces at beginning and end

        if count >= 3:  # 3 elements per line
            out_data['build_order'].append(current_step)
            current_step = {}
            count = 0

        if count == 0:  # supply
            if not data_item.isdigit():
                raise Exception(f'Expected integer (for supply), instead of \'{data_item}\'.')
            current_step['supply'] = int(data_item)
        elif count == 1:  # time
            current_step['time'] = data_item
        elif count == 2:  # note
            current_step['notes'] = [convert_txt_note_to_illustrated(
                data_item, sc2_pictures_dict, ignore_in_dict=[',', ';', '.', '[', ']', '(', ')'])]
        else:
            raise Exception(f'Invalid count of items per line for \'{data_item}\'.')

        count += 1

    if current_step:  # add last note if not empty
        out_data['build_order'].append(current_step)

    return out_data


def get_sc2_build_order_step(build_order_data: dict = None) -> dict:
    """Get one step of the SC2 build order (template).

    Parameters
    ----------
    build_order_data    Data with the build order.

    Returns
    -------
    Dictionary with the build order step template.
    """
    if build_order_data is not None:
        assert isinstance(build_order_data, list) and len(build_order_data) >= 1
        data = build_order_data[-1]  # last step data
        return {
            'time': data['time'] if ('time' in data) else '0:00',
            'supply': data['supply'] if ('supply' in data) else -1,
            'minerals': data['minerals'] if ('minerals' in data) else -1,
            'vespene_gas': data['vespene_gas'] if ('vespene_gas' in data) else -1,
            'notes': [
                'Note 1',
                'Note 2'
            ]
        }
    else:
        return {
            'time': '0:00',
            'supply': -1,
            'minerals': -1,
            'vespene_gas': -1,
            'notes': [
                'Note 1',
                'Note 2'
            ]
        }


def get_sc2_build_order_template() -> dict:
    """Get the SC2 build order template (reset build order).

    Returns
    -------
    Dictionary with the build order template.
    """
    return {
        'race': 'Terran',
        'opponent_race': 'Any',
        'name': 'Build order name',
        'patch': 'x.y.z',
        'author': 'Author',
        'source': 'Source',
        'build_order': [get_sc2_build_order_step()]
    }


if __name__ == '__main__':
    # check that the conversions work as expected
    tests = [
        '',
        'Not in dictionary',
        'Stalker',
        'Stalker x2',
        'Test Stalker x2',
        'Stalker Infantry Weapons Level 2 x3',
        'Lurker Den',
        'Lurker Lurker Den Lurker x4',
        'Lurker Den,',
        '(Lurker Den)',
        'Lurker, (Lurker Den) Stalker Infantry Weapons Level 2 x3'
    ]
    for test in tests:
        print(test)
        print(convert_txt_note_to_illustrated(
            test, sc2_pictures_dict, ignore_in_dict=[',', ';', '.', '[', ']', '(', ')']))
        print('--------------------')
