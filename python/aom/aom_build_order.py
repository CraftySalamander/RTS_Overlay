import math
from aom.aom_major_god_icon import aom_major_god_icon
from common.build_order_tools import build_order_time_to_str, check_valid_faction, FieldDefinition, check_valid_steps


def check_valid_aom_build_order(data: dict, bo_name_msg: bool = False) -> (bool, str):
    """Check if a build order is valid for AoM.

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

        # Check correct major god
        valid_faction, faction_msg = check_valid_faction(
            data, bo_name_str, faction_name='major_god', factions_list=aom_major_god_icon,
            requested=True, any_valid=False)
        if not valid_faction:
            return False, faction_msg

        fields = [
            FieldDefinition('worker_count', 'integer', True),
            FieldDefinition('age', 'integer', True, None, [-math.inf, 5]),
            FieldDefinition('food', 'integer', True, 'resources'),
            FieldDefinition('wood', 'integer', True, 'resources'),
            FieldDefinition('gold', 'integer', True, 'resources'),
            FieldDefinition('favor', 'integer', True, 'resources'),
            FieldDefinition('builder', 'integer', False, 'resources'),
            FieldDefinition('time', 'string', False),
            FieldDefinition('notes', 'array of strings', True)
        ]

        return check_valid_steps(data, bo_name_str, fields)

    except KeyError as err:
        return False, bo_name_str + f'Wrong JSON key: {err}.'

    except Exception as err:
        return False, bo_name_str + str(err)


def get_aom_build_order_step(build_order_data: dict = None) -> dict:
    """Get one step of the AoM build order (template).

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
            'worker_count': data['worker_count'] if ('worker_count' in data) else 0,
            'age': data['age'] if ('age' in data) else 1,
            'resources': data['resources'] if ('resources' in data) else {
                'food': 0,
                'wood': 0,
                'gold': 0,
                'favor': 0
            },
            'notes': [
                'Note 1',
                'Note 2'
            ]
        }
    else:
        return {
            'worker_count': 0,
            'age': 1,
            'resources': {
                'food': 0,
                'wood': 0,
                'gold': 0,
                'favor': 0
            },
            'notes': [
                'Note 1',
                'Note 2'
            ]
        }


def get_aom_build_order_template() -> dict:
    """Get the AoM build order template (reset build order).

    Returns
    -------
    Dictionary with the build order template.
    """
    return {
        'major_god': 'Major god name',
        'name': 'Build order name',
        'author': 'Author',
        'source': 'Source',
        'build_order': [get_aom_build_order_step()]
    }


def get_worker_time(pantheon: str, gold_ratio: float) -> float:
    """Get the worker creation time.

    Parameters
    ----------
    pantheon      Pantheon of the current BO.
    gold_ratio    Ratio of the number of gold worker vs total number of workers. Only used for Norse pantheon.

    Returns
    -------
    Worker creation time [sec].
    """
    if pantheon in ['Greeks', 'Egyptians']:
        return 14.0
    elif pantheon == 'Norse':
        # Gatherer trains in 14 sec, dwarf in 16 sec.
        # Assuming all dwarfs are on gold and no gatherer on gold.
        # This formula provides the average time needed to produce a worker.
        return (1.0 - gold_ratio) * 14.0 + gold_ratio * 16.0
    elif pantheon == 'Atlanteans':
        return 12.5  # 25 sec for a citizen with 2 pop
    else:
        raise Exception('Unknown pantheon: ' + pantheon)


def get_pantheon(major_god):
    """Get the pantheon corresponding to a major god.

    Parameters
    ----------
    major_god    Major god to check.

    Returns
    -------
    Pantheon of the major god.
    """
    if major_god in ['Zeus', 'Hades', 'Poseidon']:
        return 'Greeks'
    elif major_god in ['Ra', 'Isis', 'Set']:
        return 'Egyptians'
    elif major_god in ['Thor', 'Odin', 'Loki', 'Freyr']:
        return 'Norse'
    elif major_god in ['Kronos', 'Oranos', 'Gaia']:
        return 'Atlanteans'
    else:
        raise Exception('Unknown major god: ' + major_god)


def evaluate_aom_build_order_timing(data: dict, time_offset: int = 0):
    """Evaluate the time indications for an AoM build order.

    Parameters
    ----------
    data           Data of the build order (will be updated).
    time_offset    Offset to add on the time outputs [sec].
    """

    # Get the pantheon
    major_god_data = data['major_god']
    if isinstance(major_god_data, list):
        if len(major_god_data) == 0:
            print('Warning: the list of \'major_god\' is empty, timing cannot be evaluated.')
            return
        pantheon = get_pantheon(major_god_data[0])
    else:
        pantheon = get_pantheon(major_god_data)

    # Starting workers
    last_worker_count = 3  # Egyptians and Norse
    if pantheon in ['Greeks', 'Atlanteans']:
        last_worker_count = 4  # Atlanteans have 2 citizens, each with 2 pop

    # Assuming none of the starting workers on gold (for Norse)
    last_gold_count = 0

    # TC technologies or special units, with TC training/research time (in [sec])
    tc_unit_technologies = {
        'greeks_tech/divine_blood.png': 30.0,
        'egyptians_tech/sundried_mud_brick.png': 50.0,
        'egyptians_tech/book_of_thoth.png': 40.0,
        'atlanteans_tech/horns_of_consecration.png': 30.0

        # The following technologies/units are not analyzed:
        #   * Assuming researched from store house: Vaults of Erebus.
        #   * Assuming trained/researched from temple:
        #         Egyptian priest, Golden Apples, Skin of the Rhino, Funeral Rites,
        #         Spirit of Maat, Nebty, New Kingdom, Channels.
        #   * Assuming trained from Longhouse: Berserk.
        #   * Egyptian mercenaries: Trained very fast and usually not part of BO.
    }

    if 'build_order' not in data:
        print('The \'build_order\' field is missing from data when evaluating the timing.')
        return

    last_time_sec: float = float(time_offset)  # time of the last step

    build_order_data = data['build_order']
    step_count = len(build_order_data)

    for step_id, step in enumerate(build_order_data):  # loop on all the build order steps

        step_total_time: float = 0.0  # total time for this step

        # worker count
        worker_count = step['worker_count']
        resources = step['resources']
        if worker_count < 0:
            worker_count = max(0, resources['food']) + max(0, resources['wood']) + max(0, resources['gold'])
            if pantheon == 'Greeks':  # Only Greeks villagers can gather favor
                worker_count += max(0, resources['favor'])
            if 'builder' in resources:
                worker_count += max(0, resources['builder'])

        worker_count = max(last_worker_count, worker_count)
        update_worker_count = worker_count - last_worker_count
        last_worker_count = worker_count

        # Gold workers count and ratio
        gold_count = max(last_gold_count, resources['gold'])
        update_gold_count = gold_count - last_gold_count
        last_gold_count = gold_count

        gold_ratio = 0.0
        if (pantheon == 'Norse') and (update_worker_count >= 1):
            gold_ratio = update_gold_count / update_worker_count

        # Update time based on the number and type of workers
        step_total_time += update_worker_count * get_worker_time(pantheon, gold_ratio)

        # check for TC technologies or special units in notes
        for note in step['notes']:
            for tc_item_image, tc_item_time in tc_unit_technologies.items():
                if ('@' + tc_item_image + '@') in note:
                    step_total_time += tc_item_time

        # update time
        last_time_sec += step_total_time

        # update build order with time
        step['time'] = build_order_time_to_str(int(round(last_time_sec)))

        # special case for last step (add 1 sec to avoid displaying both at the same time)
        if (step_id == step_count - 1) and (step_count >= 2) and (
                step['time'] == build_order_data[step_id - 1]['time']):
            step['time'] = build_order_time_to_str(int(round(last_time_sec + 1.0)))
