from sc2.sc2_race_icon import sc2_race_icon
from common.build_order_tools import (
    convert_txt_note_to_illustrated,
    check_valid_faction,
    FieldDefinition,
    check_valid_steps,
)

# Dictionary from Spawning Tool BO to SC2 stored images
sc2_pictures_dict = {
    'Baneling': 'zerg_units/Baneling.webp',
    'Brood Lord': 'zerg_units/Brood_Lord.webp',
    'Broodling': 'zerg_units/Broodling.webp',
    'Changeling': 'zerg_units/Changeling.webp',
    'Corruptor': 'zerg_units/Corruptor.webp',
    'Drone': 'zerg_units/Drone.webp',
    'Hydralisk': 'zerg_units/Hydralisk.webp',
    'Infested Terran': 'zerg_units/Infested_Terran.webp',
    'Infestor': 'zerg_units/Infestor.webp',
    'Larva': 'zerg_units/Larva.webp',
    'Lurker': 'zerg_units/Lurker.webp',
    'Mutalisk': 'zerg_units/Mutalisk.webp',
    'Overlord': 'zerg_units/Overlord.webp',
    'Overseer': 'zerg_units/Overseer.webp',
    'Queen': 'zerg_units/Queen.webp',
    'Ravager': 'zerg_units/Ravager.webp',
    'Roach': 'zerg_units/Roach.webp',
    'Swarm Host': 'zerg_units/Swarm_Host.webp',
    'Ultralisk': 'zerg_units/Ultralisk.webp',
    'Viper': 'zerg_units/Viper.webp',
    'Zergling': 'zerg_units/Zergling.webp',
    'Baneling Nest': 'zerg_buildings/Baneling_Nest.webp',
    'Creep Tumor': 'zerg_buildings/Creep_Tumor.webp',
    'Evolution Chamber': 'zerg_buildings/Evolution_Chamber.webp',
    'Extractor': 'zerg_buildings/Extractor.webp',
    'Greater Spire': 'zerg_buildings/Greater_Spire.webp',
    'Hatchery': 'zerg_buildings/Hatchery.webp',
    'Hive': 'zerg_buildings/Hive.webp',
    'Hydralisk Den': 'zerg_buildings/Hydralisk_Den.webp',
    'Infestation Pit': 'zerg_buildings/Infestation_Pit.webp',
    'Lair': 'zerg_buildings/Lair.webp',
    'Lurker Den': 'zerg_buildings/LurkerDen.webp',
    'Nydus Network': 'zerg_buildings/Nydus_Network.webp',
    'Nydus Worm': 'zerg_buildings/Nydus_Worm.webp',
    'Roach Warren': 'zerg_buildings/Roach_Warren.webp',
    'Spawning Pool': 'zerg_buildings/Spawning_Pool.webp',
    'Spine Crawler': 'zerg_buildings/Spine_Crawler.webp',
    'Spire': 'zerg_buildings/Spire.webp',
    'Spore Crawler': 'zerg_buildings/Spore_Crawler.webp',
    'Ultralisk Cavern': 'zerg_buildings/Ultralisk_Cavern.webp',
    'Adaptive Talons': 'zerg_techs/Adaptive_Talons.webp',
    'Adrenal Glands': 'zerg_techs/Adrenal_glands.webp',
    'Anabolic Synthesis': 'zerg_techs/Anabolic_Synthesis.webp',
    'Burrow': 'zerg_techs/Burrow.webp',
    'Centrifugal Hooks': 'zerg_techs/Centrifugal_hooks.webp',
    'Chitinous Plating': 'zerg_techs/Chitinous_Plating.webp',
    'Flyer Attack Level 1': 'zerg_techs/Flyer_attack_1.webp',
    'Flyer Attack Level 2': 'zerg_techs/Flyer_attack_2.webp',
    'Flyer Attack Level 3': 'zerg_techs/Flyer_attack_3.webp',
    'Flyer Carapace Level 1': 'zerg_techs/Flyer_carapace_1.webp',
    'Flyer Carapace Level 2': 'zerg_techs/Flyer_carapace_2.webp',
    'Flyer Carapace Level 3': 'zerg_techs/Flyer_carapace_3.webp',
    'Glial Reconstitution': 'zerg_techs/Glial_reconstitution.webp',
    'Grooved Spines': 'zerg_techs/Grooved_Spines.webp',
    'Ground Carapace Level 1': 'zerg_techs/Ground_carapace_1.webp',
    'Ground Carapace Level 2': 'zerg_techs/Ground_carapace_2.webp',
    'Ground Carapace Level 3': 'zerg_techs/Ground_carapace_3.webp',
    'Melee Attacks Level 1': 'zerg_techs/Melee_attacks_1.webp',
    'Melee Attacks Level 2': 'zerg_techs/Melee_attacks_2.webp',
    'Melee Attacks Level 3': 'zerg_techs/Melee_attacks_3.webp',
    'Metabolic Boost': 'zerg_techs/Metabolic_boost.webp',
    'Microbial Shroud': 'zerg_techs/Microbial_Shroud.webp',
    'Missile Attacks Level 1': 'zerg_techs/Missile_attacks_1.webp',
    'Missile Attacks Level 2': 'zerg_techs/Missile_attacks_2.webp',
    'Missile Attacks Level 3': 'zerg_techs/Missile_attacks_3.webp',
    'Muscular Augments': 'zerg_techs/Muscular_Augments.webp',
    'Mutate Ventral Sacs': 'zerg_techs/Mutate_Ventral_Sacs.webp',
    'Neural Parasite': 'zerg_techs/Neural_parasite.webp',
    'Pathogen Glands': 'zerg_techs/Pathogen_glands.webp',
    'Pneumatized Carapace': 'zerg_techs/Pneumatized_carapace.webp',
    'Seismic Spines': 'zerg_techs/Seismic_Spines.webp',
    'Tunneling Claws': 'zerg_techs/Tunneling_claws.webp',
    'Auto-turret': 'terran_units/Auto-turret.webp',
    'Banshee': 'terran_units/Banshee.webp',
    'Battlecruiser': 'terran_units/Battlecruiser.webp',
    'Cyclone': 'terran_units/Cyclone.webp',
    'Ghost': 'terran_units/Ghost.webp',
    'Hellbat': 'terran_units/Hellbat.webp',
    'Hellion': 'terran_units/Hellion.webp',
    'Liberator': 'terran_units/Liberator.webp',
    'Marauder': 'terran_units/Marauder.webp',
    'Marine': 'terran_units/Marine.webp',
    'Medivac': 'terran_units/Medivac.webp',
    'MULE': 'terran_units/MULE.webp',
    'Point Defense Drone': 'terran_units/Point_defense_drone.webp',
    'Raven': 'terran_units/Raven.webp',
    'Reaper': 'terran_units/Reaper.webp',
    'SCV': 'terran_units/SCV.webp',
    'Siege Tank': 'terran_units/SiegeTank.webp',
    'Thor': 'terran_units/Thor.webp',
    'Viking': 'terran_units/Viking.webp',
    'Widow Mine': 'terran_units/WidowMine.webp',
    'Armory': 'terran_buildings/Armory.webp',
    'Barracks': 'terran_buildings/Barracks.webp',
    'Bunker': 'terran_buildings/Bunker.webp',
    'Command Center': 'terran_buildings/CommandCenter.webp',
    'Engineering Bay': 'terran_buildings/EngineeringBay.webp',
    'Factory': 'terran_buildings/Factory.webp',
    'Fusion Core': 'terran_buildings/FusionCore.webp',
    'Ghost Academy': 'terran_buildings/GhostAcademy.webp',
    'Missile Turret': 'terran_buildings/MissileTurret.webp',
    'Orbital Command': 'terran_buildings/OrbitalCommand.webp',
    'Planetary Fortress': 'terran_buildings/PlanetaryFortress.webp',
    'Reactor': 'terran_buildings/Reactor.webp',
    'Refinery': 'terran_buildings/Refinery.webp',
    'Sensor Tower': 'terran_buildings/SensorTower.webp',
    'Starport': 'terran_buildings/Starport.webp',
    'Supply Depot': 'terran_buildings/SupplyDepot.webp',
    'TechLab': 'terran_buildings/TechLab.webp',
    'Advanced Ballistics': 'terran_techs/Advanced_Ballistics.webp',
    'Behemoth Reactor': 'terran_techs/Behemoth_reactor.webp',
    'Build Reactor': 'terran_techs/Build_Reactor.webp',
    'Tech Lab': 'terran_techs/Build_Tech_Lab.webp',
    'Building Armor': 'terran_techs/Building_armor.webp',
    'Calldown Extra Supplies': 'terran_techs/Calldown_extra_supplies.webp',
    'Calldown Mule': 'terran_techs/Calldown_mule.webp',
    'Cloak': 'terran_techs/Cloak.webp',
    'Enhanced Shockwaves': 'terran_techs/Enhanced_Shockwaves.webp',
    'High Capacity Fuel Tanks': 'terran_techs/High_Capacity_Fuel_Tanks.webp',
    'Hisec Auto Tracking': 'terran_techs/Hisec_auto_tracking.webp',
    'Infantry Armor Level 1': 'terran_techs/Infantry_armor_1.webp',
    'Infantry Armor Level 2': 'terran_techs/Infantry_armor_2.webp',
    'Infantry Armor Level 3': 'terran_techs/Infantry_armor_3.webp',
    'Infantry Weapons Level 1': 'terran_techs/Infantry_weapons_1.webp',
    'Infantry Weapons Level 2': 'terran_techs/Infantry_weapons_2.webp',
    'Infantry Weapons Level 3': 'terran_techs/Infantry_weapons_3.webp',
    'Lower': 'terran_techs/Lower.webp',
    'Moebius Reactor': 'terran_techs/Moebius_reactor.webp',
    'Neosteel Frames': 'terran_techs/Neosteel_frames.webp',
    'Nuke': 'terran_techs/Nuke.webp',
    'Scanner sweep': 'terran_techs/Scanner_sweep.webp',
    'Ship Weapons Level 1': 'terran_techs/Ship_weapons_1.webp',
    'Ship Weapons Level 2': 'terran_techs/Ship_weapons_2.webp',
    'Ship Weapons Level 3': 'terran_techs/Ship_weapons_3.webp',
    'Vehicle Plating Level 1': 'terran_techs/Vehicle_plating_1.webp',
    'Vehicle Plating Level 2': 'terran_techs/Vehicle_plating_2.webp',
    'Vehicle Plating Level 3': 'terran_techs/Vehicle_plating_3.webp',
    'Vehicle Weapons Level 1': 'terran_techs/Vehicle_weapons_1.webp',
    'Vehicle Weapons Level 2': 'terran_techs/Vehicle_weapons_2.webp',
    'Vehicle Weapons Level 3': 'terran_techs/Vehicle_weapons_3.webp',
    'Yamato Cannon': 'terran_techs/Yamato_cannon.webp',
    'Adept': 'protoss_units/Adept.webp',
    'Archon': 'protoss_units/Archon.webp',
    'Carrier': 'protoss_units/Carrier.webp',
    'Colossus': 'protoss_units/Colossus.webp',
    'Dark Templar': 'protoss_units/Dark_Templar.webp',
    'Disruptor': 'protoss_units/Disruptor.webp',
    'High Templar': 'protoss_units/High_Templar.webp',
    'Immortal': 'protoss_units/Immortal.webp',
    'Mothership': 'protoss_units/Mothership.webp',
    'Mothership Core': 'protoss_units/Mothership_Core.webp',
    'Observer': 'protoss_units/Observer.webp',
    'Oracle': 'protoss_units/Oracle.webp',
    'Phoenix': 'protoss_units/Phoenix.webp',
    'Probe': 'protoss_units/Probe.webp',
    'Sentry': 'protoss_units/Sentry.webp',
    'Stalker': 'protoss_units/Stalker.webp',
    'Tempest': 'protoss_units/Tempest.webp',
    'Void Ray': 'protoss_units/VoidRay.webp',
    'Warp Prism': 'protoss_units/Warp_Prism.webp',
    'Zealot': 'protoss_units/Zealot.webp',
    'Assimilator': 'protoss_buildings/Assimilator.webp',
    'Cybernetics Core': 'protoss_buildings/Cybernetics_Core.webp',
    'Dark Shrine': 'protoss_buildings/Dark_Shrine.webp',
    'Fleet Beacon': 'protoss_buildings/Fleet_Beacon.webp',
    'Forge': 'protoss_buildings/Forge.webp',
    'Gateway': 'protoss_buildings/Gateway.webp',
    'Nexus': 'protoss_buildings/Nexus.webp',
    'Photon Cannon': 'protoss_buildings/Photon_Cannon.webp',
    'Pylon': 'protoss_buildings/Pylon.webp',
    'Robotics Bay': 'protoss_buildings/Robotics_Bay.webp',
    'Robotics Facility': 'protoss_buildings/Robotics_Facility.webp',
    'Shield Battery': 'protoss_buildings/ShieldBattery.webp',
    'Stargate': 'protoss_buildings/Stargate.webp',
    'Stasis Ward': 'protoss_buildings/StasisWard.webp',
    'Templar Archives': 'protoss_buildings/Templar_Archives.webp',
    'Twilight Council': 'protoss_buildings/Twilight_Council.webp',
    'Warp Gate': 'protoss_buildings/Warp_Gate.webp',
    'Air Armor Level 1': 'protoss_techs/Air_armor_1.webp',
    'Air Armor Level 2': 'protoss_techs/Air_armor_2.webp',
    'Air Armor Level 3': 'protoss_techs/Air_armor_3.webp',
    'Air Weapons Level 1': 'protoss_techs/Air_weapons_1.webp',
    'Air Weapons Level 2': 'protoss_techs/Air_weapons_2.webp',
    'Air Weapons Level 3': 'protoss_techs/Air_weapons_3.webp',
    'Anion Pulse-Crystals': 'protoss_techs/Anion_Pulse-Crystals.webp',
    'Battery Overcharge': 'protoss_techs/Battery_Overcharge.webp',
    'Blink': 'protoss_techs/Blink.webp',
    'Charge': 'protoss_techs/Charge.webp',
    'Chrono Boost': 'protoss_techs/Chrono_boost.webp',
    'Extended Thermal Lances': 'protoss_techs/Extended_thermal_lances.webp',
    'Flux Vanes': 'protoss_techs/Flux_Vanes.webp',
    'Gravitic Booster': 'protoss_techs/Gravitic_booster.webp',
    'Gravitic Drive': 'protoss_techs/Gravitic_drive.webp',
    'Graviton Catapult': 'protoss_techs/Graviton_catapult.webp',
    'Ground Armor Level 1': 'protoss_techs/Ground_armor_1.webp',
    'Ground Armor Level 2': 'protoss_techs/Ground_armor_2.webp',
    'Ground Armor Level 3': 'protoss_techs/Ground_armor_3.webp',
    'Ground Weapons Level 1': 'protoss_techs/Ground_weapons_1.webp',
    'Ground Weapons Level 2': 'protoss_techs/Ground_weapons_2.webp',
    'Ground Weapons Level 3': 'protoss_techs/Ground_weapons_3.webp',
    'Guardian Shield': 'protoss_techs/Guardian_shield.webp',
    'Mass Recall': 'protoss_techs/Mass_Recall.webp',
    'Psionic Storm': 'protoss_techs/Psionic_storm.webp',
    'Resonating Glaives': 'protoss_techs/Resonating_Glaives.webp',
    'Shadow Stride': 'protoss_techs/Shadow_Stride.webp',
    'Shields Level 1': 'protoss_techs/Shields_1.webp',
    'Shields Level 2': 'protoss_techs/Shields_2.webp',
    'Shields Level 3': 'protoss_techs/Shields_3.webp',
    'Tectonic Destabilizers': 'protoss_techs/Tectonic_Destabilizers.webp',
    'Transform Warpgate': 'protoss_techs/Transform_warpgate.webp',
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
            data, bo_name_str, faction_name='race', factions_list=sc2_race_icon, requested=True, any_valid=False
        )
        if not valid_race:
            return False, race_msg

        valid_opponent_race, opponent_race_msg = check_valid_faction(
            data, bo_name_str, faction_name='opponent_race', factions_list=sc2_race_icon, requested=True, any_valid=True
        )
        if not valid_opponent_race:
            return False, opponent_race_msg

        fields = [
            FieldDefinition('notes', 'array of strings', True),
            FieldDefinition('time', 'string', False),
            FieldDefinition('supply', 'integer', False),
            FieldDefinition('minerals', 'integer', False),
            FieldDefinition('vespene_gas', 'integer', False),
        ]

        return check_valid_steps(data, bo_name_str, fields)

    except KeyError as err:
        return False, bo_name_str + f'Wrong JSON key: {err}.'

    except Exception as err:
        return False, bo_name_str + str(err)


def get_sc2_build_order_from_spawning_tool(
    data: str,
    race: str = 'Terran',
    opponent_race: str = 'Any',
    name: str = 'Build order name',
    patch: str = 'x.y.z',
    author: str = 'Author',
    source: str = 'Source',
) -> dict:
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
            current_step['notes'] = [
                convert_txt_note_to_illustrated(
                    data_item, sc2_pictures_dict, ignore_in_dict=[',', ';', '.', '[', ']', '(', ')']
                )
            ]
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
            'supply': data['supply'] if ('supply' in data) else -1,
            'minerals': data['minerals'] if ('minerals' in data) else -1,
            'vespene_gas': data['vespene_gas'] if ('vespene_gas' in data) else -1,
            'notes': ['Note 1', 'Note 2'],
        }
    else:
        return {'supply': -1, 'minerals': -1, 'vespene_gas': -1, 'notes': ['Note 1', 'Note 2']}


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
        'build_order': [get_sc2_build_order_step()],
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
        'Lurker, (Lurker Den) Stalker Infantry Weapons Level 2 x3',
    ]
    for test in tests:
        print(test)
        print(
            convert_txt_note_to_illustrated(test, sc2_pictures_dict, ignore_in_dict=[',', ';', '.', '[', ']', '(', ')'])
        )
        print('--------------------')
