import math
from aoe4.aoe4_civ_icon import aoe4_civilization_icon
from common.build_order_tools import build_order_time_to_str, check_valid_faction, FieldDefinition, check_valid_steps


def check_valid_aoe4_build_order(data: dict, bo_name_msg: bool = False) -> (bool, str):
    """Check if a build order is valid for AoE4.

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

        # Check correct civilization
        valid_faction, faction_msg = check_valid_faction(
            data, bo_name_str, faction_name='civilization', factions_list=aoe4_civilization_icon,
            requested=True, any_valid=True)
        if not valid_faction:
            return False, faction_msg

        fields = [
            FieldDefinition('population_count', 'integer', True),
            FieldDefinition('villager_count', 'integer', True),
            FieldDefinition('age', 'integer', True, None, [-math.inf, 4]),
            FieldDefinition('food', 'integer', True, 'resources'),
            FieldDefinition('wood', 'integer', True, 'resources'),
            FieldDefinition('gold', 'integer', True, 'resources'),
            FieldDefinition('stone', 'integer', True, 'resources'),
            FieldDefinition('builder', 'integer', False, 'resources'),
            FieldDefinition('notes', 'array of strings', True),
            FieldDefinition('time', 'string', False)
        ]

        return check_valid_steps(data, bo_name_str, fields)

    except KeyError as err:
        return False, bo_name_str + f'Wrong JSON key: {err}.'

    except Exception as err:
        return False, bo_name_str + str(err)


def get_aoe4_build_order_step(build_order_data: dict = None) -> dict:
    """Get one step of the AoE4 build order (template).

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
            'population_count': data['population_count'] if ('population_count' in data) else -1,
            'villager_count': data['villager_count'] if ('villager_count' in data) else 0,
            'age': data['age'] if ('age' in data) else 1,
            'resources': data['resources'] if ('resources' in data) else {
                'food': 0,
                'wood': 0,
                'gold': 0,
                'stone': 0
            },
            'notes': [
                'Note 1',
                'Note 2'
            ]
        }
    else:
        return {
            'population_count': -1,
            'villager_count': 0,
            'age': 1,
            'resources': {
                'food': 0,
                'wood': 0,
                'gold': 0,
                'stone': 0
            },
            'notes': [
                'Note 1',
                'Note 2'
            ]
        }


def get_aoe4_build_order_template() -> dict:
    """Get the AoE4 build order template (reset build order).

    Returns
    -------
    Dictionary with the build order template.
    """
    return {
        'civilization': 'Civilization name',
        'name': 'Build order name',
        'author': 'Author',
        'source': 'Source',
        'build_order': [get_aoe4_build_order_step()]
    }


def check_only_civilization(data: dict, civilization_name: str) -> bool:
    """Check if only one specified civilization is present.

    Parameters
    ----------
    data                 Data of the build order.
    civilization_name    Requested civilization name.

    Returns
    -------
    True if only one specified civilization is present (False otherwise).
    """
    civilization_data = data['civilization']
    if isinstance(civilization_data, list):
        return civilization_data == [civilization_name]
    else:
        return civilization_data == civilization_name


def update_town_center_time(initial_time: float, civilization_flags: dict, current_age: int) -> float:
    """Update the initially computed time based on the town center work rate.

    Parameters
    ----------
    initial_time          Initially computed time.
    civilization_flags    Dictionary with the civilization flags.
    current_age           Current age (1: Dark Age, 2: Feudal Age...).

    Returns
    -------
    Updated time based on town center work rate
    """
    if civilization_flags['French']:
        return initial_time / (1.0 + 0.05 * (current_age + 1))  # 10%/15%/20%/25% faster
    else:
        return initial_time


def get_villager_time(civilization_flags: dict, current_age: int) -> float:
    """Get the villager creation time.

    Parameters
    ----------
    civilization_flags    Dictionary with the civilization flags.
    current_age           Current age (1: Dark Age, 2: Feudal Age...).

    Returns
    -------
    Villager creation time [sec].
    """
    if civilization_flags['Dragon']:
        return 23.0
    else:  # generic
        assert 1 <= current_age <= 4
        return update_town_center_time(20.0, civilization_flags, current_age)


def get_town_center_unit_research_time(name: str, civilization_flags: dict, current_age: int) -> float:
    """Get the training time for a non-villager unit or the research time for a technology (from Town Center).

    Parameters
    ----------
    name                  Name of the requested unit/technology.
    civilization_flags    Dictionary with the civilization flags.
    current_age           Current age (1: Dark Age, 2: Feudal Age...).

    Returns
    -------
    Requested research time [sec].
    """
    assert 1 <= current_age <= 4
    if name == 'textiles':
        if civilization_flags['Delhi']:
            return 25.0
        else:
            return update_town_center_time(20.0, civilization_flags, current_age)
    elif name == 'imperial official':
        # Only for Chinese in Dark Age (assuming Chinese Imperial Academy in Feudal and starting with 1 for Zhu Xi).
        if civilization_flags['Chinese'] and (current_age == 1):
            return 20.0
        else:
            return 0.0
    else:
        print(f'Warning: unknown TC unit/technology name \'{name}\'.')
        return 0.0


def evaluate_aoe4_build_order_timing(data: dict, time_offset: int = 0):
    """Evaluate the time indications for an AoE4 build order.

    Parameters
    ----------
    data           Data of the build order (will be updated).
    time_offset    Offset to add on the time outputs [sec].
    """

    # specific civilization flags
    civilization_flags = {
        'Abbasid': check_only_civilization(data, 'Abbasid Dynasty'),
        'Chinese': check_only_civilization(data, 'Chinese'),
        'Delhi': check_only_civilization(data, 'Delhi Sultanate'),
        'French': check_only_civilization(data, 'French'),
        'HRE': check_only_civilization(data, 'Holy Roman Empire'),
        'Jeanne': check_only_civilization(data, 'Jeanne d\'Arc'),
        'Malians': check_only_civilization(data, 'Malians'),
        'Dragon': check_only_civilization(data, 'Order of the Dragon'),
        'Rus': check_only_civilization(data, 'Rus'),
        'Zhu Xi': check_only_civilization(data, 'Zhu Xi\'s Legacy')
    }

    # starting villagers
    last_villager_count: int = 6
    if civilization_flags['Dragon'] or civilization_flags['Zhu Xi']:
        last_villager_count = 5

    current_age: int = 1  # current age (1: Dark Age, 2: Feudal Age...)

    # TC technologies or special units
    tc_unit_technologies = {
        'textiles': 'technology_economy/textiles.png',
        'imperial official': 'unit_chinese/imperial-official.png'
        # The following technologies/units are not analyzed:
        #     * Banco Repairs (Malians) is usually researched after 2nd TC.
        #     * Prelate only for HRE before Castle Age, but already starting with 1 prelate.
        #     * Civilizations are usually only using the starting scout, except Rus (but from Hunting Cabin).
    }

    last_time_sec: float = float(time_offset)  # time of the last step

    if 'build_order' not in data:
        print('The \'build_order\' field is missing from data when evaluating the timing.')
        return

    build_order_data = data['build_order']
    step_count = len(build_order_data)

    jeanne_military_flag = False  # True when Jeanne becomes a military unit

    for step_id, step in enumerate(build_order_data):  # loop on all the build order steps

        step_total_time: float = 0.0  # total time for this step

        # villager count
        villager_count = step['villager_count']
        if villager_count < 0:
            resources = step['resources']
            villager_count = max(0, resources['wood']) + max(0, resources['food']) + max(
                0, resources['gold']) + max(0, resources['stone'])
            if 'builder' in resources:
                villager_count += max(0, resources['builder'])

        villager_count = max(last_villager_count, villager_count)
        update_villager_count = villager_count - last_villager_count
        last_villager_count = villager_count

        step_total_time += update_villager_count * get_villager_time(civilization_flags, current_age)

        # next age
        next_age = step['age'] if (1 <= step['age'] <= 4) else current_age

        # Jeanne becomes a soldier in Feudal
        if civilization_flags['Jeanne'] and (not jeanne_military_flag) and (next_age > 1):
            step_total_time += get_villager_time(civilization_flags, current_age)  # one extra villager to create
            jeanne_military_flag = True

        # check for TC technologies or special units in notes
        for note in step['notes']:
            for tc_item_name, tc_item_image in tc_unit_technologies.items():
                if ('@' + tc_item_image + '@') in note:
                    step_total_time += get_town_center_unit_research_time(tc_item_name, civilization_flags, current_age)

        # update time
        last_time_sec += step_total_time

        current_age = next_age  # current age update

        # update build order with time
        step['time'] = build_order_time_to_str(int(round(last_time_sec)))

        # special case for last step (add 1 sec to avoid displaying both at the same time)
        if (step_id == step_count - 1) and (step_count >= 2) and (
                step['time'] == build_order_data[step_id - 1]['time']):
            step['time'] = build_order_time_to_str(int(round(last_time_sec + 1.0)))
