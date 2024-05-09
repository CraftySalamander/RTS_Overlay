from aoe2.aoe2_civ_icon import aoe2_civilization_icon
from common.build_order_tools import build_order_time_to_str


def check_valid_aoe2_build_order(data: dict, bo_name_msg: bool = False) -> (bool, str):
    """Check if a build order is valid for AoE2.

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
        name = data['name']
        if bo_name_msg:
            bo_name_str: str = f'{name} | '

        build_order: list = data['build_order']

        # check correct civilization
        if 'civilization' in data:
            civilization_data = data['civilization']
            if isinstance(civilization_data, list):  # list of civilizations
                if len(civilization_data) == 0:
                    return False, bo_name_str + 'Valid civilization list is empty.'

                for civilization in civilization_data:
                    if (civilization not in aoe2_civilization_icon) and (civilization not in ['Any', 'any']):
                        return False, bo_name_str + f'Unknown civilization \'{civilization}\' (check spelling).'
            # single civilization provided
            elif (civilization_data not in aoe2_civilization_icon) and (civilization_data not in ['Any', 'any']):
                return False, bo_name_str + f'Unknown civilization \'{civilization_data}\' (check spelling).'

        if len(build_order) < 1:  # size of the build order
            return False, bo_name_str + f'Build order is empty.'

        # loop on the build order steps
        for step_id, item in enumerate(build_order):
            step_str = f'Step {step_id}'

            # check if main fields are there
            if 'villager_count' not in item:
                return False, bo_name_str + f'{step_str} is missing the \'villager_count\' field.'

            if 'age' not in item:
                return False, bo_name_str + f'{step_str} is missing the \'age\' field.'

            if 'resources' not in item:
                return False, bo_name_str + f'{step_str} is missing the \'resources\' field.'

            if 'notes' not in item:
                return False, bo_name_str + f'{step_str} is missing the \'notes\' field.'

            # villager count
            if not isinstance(item['villager_count'], int):
                return False, bo_name_str + f'{step_str} has invalid villager count ({item["villager_count"]}).'

            # age
            if (not isinstance(item['age'], int)) or (int(item['age']) > 4):
                return False, bo_name_str + f'{step_str} has invalid age number ({item["age"]}) (max: 4 for Imperial).'

            # resources
            resources = item['resources']

            if 'wood' not in resources:
                return False, bo_name_str + f'{step_str} is missing the \'wood\' field in \'resources\'.'

            if 'food' not in resources:
                return False, bo_name_str + f'{step_str} is missing the \'food\' field in \'resources\'.'

            if 'gold' not in resources:
                return False, bo_name_str + f'{step_str} is missing the \'gold\' field in \'resources\'.'

            if 'stone' not in resources:
                return False, bo_name_str + f'{step_str} is missing the \'stone\' field in \'resources\'.'

            if not isinstance(resources['wood'], int):
                return False, bo_name_str + f'{step_str} has an invalid \'wood\' resource ({resources["wood"]}).'

            if not isinstance(resources['food'], int):
                return False, bo_name_str + f'{step_str} has an invalid \'food\' resource ({resources["food"]}).'

            if not isinstance(resources['gold'], int):
                return False, bo_name_str + f'{step_str} has an invalid \'gold\' resource ({resources["gold"]}).'

            if not isinstance(resources['stone'], int):
                return False, bo_name_str + f'{step_str} has an invalid \'stone\' resource ({resources["stone"]}).'

            # optional builder count
            if ('builder' in resources) and (not isinstance(resources['builder'], int)):
                return False, bo_name_str + f'{step_str} has an invalid \'builder\' resource.'

            # notes
            notes = item['notes']
            for note in notes:
                if not isinstance(note, str):
                    return False, bo_name_str + f'{step_str} note \'{note}\' is not a string.'

    except KeyError as err:
        return False, bo_name_str + f'Wrong JSON key: {err}.'

    except Exception as err:
        return False, bo_name_str + str(err)

    return True, ''  # valid build order, no error message


def aoe2_build_order_sorting(elem: dict) -> int:
    """Sorting key used to order the build orders:
       civilizations set as 'Any'/'any'/'Generic' (or not specified) appear at the end.

    Parameters
    ----------
    elem    Build order data to analyze.

    Returns
    -------
    Key value for sorting.
    """
    return 1 if (('civilization' not in elem) or (elem['civilization'] in ['any', 'Any', 'Generic'])) else 0


def get_aoe2_build_order_step(build_order_data: dict = None) -> dict:
    """Get one step of the AoE2 build order (template).

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
            'villager_count': data['villager_count'] if ('villager_count' in data) else 0,
            'age': data['age'] if ('age' in data) else 1,
            'resources': data['resources'] if ('resources' in data) else {
                'wood': 0,
                'food': 0,
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
            'villager_count': 0,
            'age': 1,
            'resources': {
                'wood': 0,
                'food': 0,
                'gold': 0,
                'stone': 0
            },
            'notes': [
                'Note 1',
                'Note 2'
            ]
        }


def get_aoe2_build_order_template() -> dict:
    """Get the AoE2 build order template (reset build order).

    Returns
    -------
    Dictionary with the build order template.
    """
    return {
        'name': 'Build order name',
        'civilization': 'Generic',
        'author': 'Author',
        'source': 'Source',
        'build_order': [get_aoe2_build_order_step()]
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
    assert 1 <= current_age <= 4
    generic_time: float = 25.0
    if civilization_flags['Persians']:
        return generic_time / (1.0 + 0.05 * current_age)  # 5%/10%/15%/20% faster
    else:  # generic
        return generic_time


def get_research_age_up_time(civilization_flags: dict, current_age: int) -> float:
    """Get the research time to reach the next age.

    Parameters
    ----------
    civilization_flags    Dictionary with the civilization flags.
    current_age           Current age (1: Dark Age, 2: Feudal Age...).

    Returns
    -------
    Requested age up time [sec].
    """
    assert 1 <= current_age <= 3
    if current_age == 1:  # Feudal age up
        generic_time: float = 130.0
    elif current_age == 2:  # Castle age up
        generic_time: float = 160.0
    else:  # Imperial age up
        generic_time: float = 190.0

    if civilization_flags['Persians']:
        return generic_time / (1.0 + 0.05 * current_age)  # 5%/10%/15%/20% faster
    elif civilization_flags['Malay']:
        return generic_time / 1.66  # 66% faster
    else:  # generic
        return generic_time


def get_loom_time(civilization_flags: dict, current_age: int) -> float:
    """Get the loom research time.

    Parameters
    ----------
    civilization_flags    Dictionary with the civilization flags.
    current_age           Current age (1: Dark Age, 2: Feudal Age...).

    Returns
    -------
    Loom research time [sec].
    """
    assert 1 <= current_age <= 4
    generic_time: float = 25.0
    if civilization_flags['Persians']:
        return generic_time / (1.0 + 0.05 * current_age)  # 5%/10%/15%/20% faster
    elif civilization_flags['Goths']:
        return 0.0  # instantaneous
    elif civilization_flags['Portuguese']:
        return generic_time / 1.25  # 25% faster
    else:  # generic
        return generic_time


def get_wheelbarrow_handcart_time(civilization_flags: dict, current_age: int, wheelbarrow_flag: bool) -> float:
    """Get the wheelbarrow/handcart research time.

    Parameters
    ----------
    civilization_flags    Dictionary with the civilization flags.
    current_age           Current age (1: Dark Age, 2: Feudal Age...).
    wheelbarrow_flag      True: wheelbarrow / False: handcart.

    Returns
    -------
    Requested research time [sec].
    """
    assert 1 <= current_age <= 4
    generic_time: float = 75.0 if wheelbarrow_flag else 55.0
    if civilization_flags['Persians']:
        return generic_time / (1.0 + 0.05 * current_age)  # 5%/10%/15%/20% faster
    if civilization_flags['Vietnamese']:
        return generic_time / 2.0  # 100% faster
    elif civilization_flags['Vikings']:
        return 0.0  # free & instantaneous
    elif civilization_flags['Portuguese']:
        return generic_time / 1.25  # 25% faster
    else:  # generic
        return generic_time


def get_town_watch_patrol_time(civilization_flags: dict, current_age: int, town_watch_flag: bool) -> float:
    """Get the town watch/patrol research time.

    Parameters
    ----------
    civilization_flags    Dictionary with the civilization flags.
    current_age           Current age (1: Dark Age, 2: Feudal Age...).
    town_watch_flag       True: town watch / False: town patrol.

    Returns
    -------
    Requested research time [sec].
    """
    assert 1 <= current_age <= 4
    generic_time: float = 25.0 if town_watch_flag else 40.0
    if civilization_flags['Persians']:
        return generic_time / (1.0 + 0.05 * current_age)  # 5%/10%/15%/20% faster
    elif civilization_flags['Byzantines']:
        return 0.0  # free & instantaneous
    elif civilization_flags['Portuguese']:
        return generic_time / 1.25  # 25% faster
    else:  # generic
        return generic_time


def get_town_center_research_time(technology_name: str, civilization_flags: dict, current_age: int) -> float:
    """Get the research time for a given Town Center technology.

    Parameters
    ----------
    technology_name       Name of the requested technology.
    civilization_flags    Dictionary with the civilization flags.
    current_age           Current age (1: Dark Age, 2: Feudal Age...).

    Returns
    -------
    Requested research time [sec].
    """
    if technology_name == 'loom':
        return get_loom_time(civilization_flags, current_age)
    elif technology_name == 'wheelbarrow':
        return get_wheelbarrow_handcart_time(civilization_flags, current_age, wheelbarrow_flag=True)
    elif technology_name == 'handcart':
        return get_wheelbarrow_handcart_time(civilization_flags, current_age, wheelbarrow_flag=False)
    elif technology_name == 'town_watch':
        return get_town_watch_patrol_time(civilization_flags, current_age, town_watch_flag=True)
    elif technology_name == 'town_patrol':
        return get_town_watch_patrol_time(civilization_flags, current_age, town_watch_flag=False)
    else:
        print(f'Warning: unknown TC technology name \'{technology_name}\'.')
        return 0.0


def evaluate_aoe2_build_order_timing(data: dict, time_offset: int = 0):
    """Evaluate the time indications for an AoE2 build order.

    Parameters
    ----------
    data           Data of the build order (will be updated).
    time_offset    Offset to add on the time outputs [sec].
    """

    # specific civilization flags
    civilization_flags = {
        'Chinese': check_only_civilization(data, 'Chinese'),
        'Goths': check_only_civilization(data, 'Goths'),
        'Malay': check_only_civilization(data, 'Malay'),
        'Mayans': check_only_civilization(data, 'Mayans'),
        'Persians': check_only_civilization(data, 'Persians'),
        'Portuguese': check_only_civilization(data, 'Portuguese'),
        'Vietnamese': check_only_civilization(data, 'Vietnamese'),
        'Vikings': check_only_civilization(data, 'Vikings')
    }

    # starting villagers
    last_villager_count: int = 3
    if civilization_flags['Chinese']:
        last_villager_count = 6
    elif civilization_flags['Mayans']:
        last_villager_count = 4

    current_age: int = 1  # current age (1: Dark Age, 2: Feudal Age...)

    # TC technologies to research
    tc_technologies = {
        'loom': {'researched': False, 'image': 'town_center/LoomDE.png'},
        'wheelbarrow': {'researched': False, 'image': 'town_center/WheelbarrowDE.png'},
        'handcart': {'researched': False, 'image': 'town_center/HandcartDE.png'},
        'town_watch': {'researched': False, 'image': 'town_center/TownWatchDE.png'},
        'town_patrol': {'researched': False, 'image': 'town_center/TownPatrolDE.png'}
    }

    last_time_sec: float = float(time_offset)  # time of the last step

    if 'build_order' not in data:
        print('The \'build_order\' field is missing from data when evaluating the timing.')
        return

    build_order_data = data['build_order']
    step_count = len(build_order_data)

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
        if next_age == current_age + 1:  # researching next age up
            step_total_time += get_research_age_up_time(civilization_flags, current_age)

        # check for TC technologies in notes
        for note in step['notes']:
            for technology_name, technology_data in tc_technologies.items():
                if (not technology_data['researched']) and (('@' + technology_data['image'] + '@') in note):
                    step_total_time += get_town_center_research_time(technology_name, civilization_flags, current_age)
                    technology_data['researched'] = True

        # update time
        last_time_sec += step_total_time

        current_age = next_age  # current age update

        # update build order with time
        step['time'] = build_order_time_to_str(int(round(last_time_sec)))

        # special case for last step (add 1 sec to avoid displaying both at the same time)
        if (step_id == step_count - 1) and (step_count >= 2) and (
                step['time'] == build_order_data[step_id - 1]['time']):
            step['time'] = build_order_time_to_str(int(round(last_time_sec + 1.0)))
