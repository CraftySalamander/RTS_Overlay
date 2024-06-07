import json
import os.path

from common.useful_tools import list_directory_files


def is_build_order_new(existing_build_orders: list, new_build_order_data: dict, category_name: str = None) -> bool:
    """Check if a build order is new.

    Parameters
    ----------
    existing_build_orders    List of existing build orders.
    new_build_order_data     New build order data.
    category_name            If not None, accept build orders with same name, if they are in different categories.

    Returns
    -------
    True if new build order to add
    """
    # check if it is a new build order to add
    for build_order in existing_build_orders:
        if build_order['name'] == new_build_order_data['name']:
            if (category_name is None) or (build_order[category_name] == new_build_order_data[category_name]):
                return False  # already added
    return True


def get_build_orders(directory: str, check_valid_build_order, category_name: str = None) -> list:
    """Get the build orders.

    Parameters
    ----------
    directory                  Directory where the JSON build orders are located.
    check_valid_build_order    Function to check if a build order is valid.
    category_name              If not None, accept build orders with same name, if they are in different categories.

    Returns
    -------
    list of valid build orders.
    """
    build_order_files = list_directory_files(directory, extension='.json')

    build_orders = []

    for build_order_file in build_order_files:
        with open(build_order_file, 'rb') as f:
            try:
                data = json.load(f)

                if (category_name is not None) and (category_name not in data):  # check category
                    print(f'Category name \'{category_name}\' not in \'{build_order_file}\', skipping it.')
                    continue

                # check if it is a new build order to add
                if is_build_order_new(build_orders, data, category_name):  # new build order to add
                    valid_bo, bo_error_msg = check_valid_build_order(data)
                    if valid_bo:
                        build_orders.append(data)
                    else:
                        print(f'Could not add build order \'{os.path.basename(build_order_file)}\': {bo_error_msg}')
                else:  # already added this build order
                    name = data['name']
                    print(f'Build order \'{name}\' from \'{build_order_file}\' already added, skipping it.')

            except json.JSONDecodeError:
                print(f'Could not add build order \'{os.path.basename(build_order_file)}\': JSON decoding error.')

    return build_orders


def check_build_order_key_values(build_order: dict, key_condition: dict = None) -> bool:
    """Check if a build order fulfills the correct key conditions.

    Parameters
    ----------
    build_order      Build order to check.
    key_condition    Dictionary with the keys to look for and their value (to consider as valid), None to skip it.

    Returns
    -------
    True if no key condition or key conditions are correct.
    """
    if key_condition is None:  # no key condition to check
        return True

    for key, value in key_condition.items():  # loop  on the key conditions
        if key in build_order:
            data_check = build_order[key]
            if data_check in ['any', 'Any', 'Generic']:  # any build order data value is valid
                continue
            is_list = isinstance(data_check, list)
            if (is_list and (value not in data_check)) or ((not is_list) and (value != data_check)):
                return False  # at least one key condition not met

    return True  # all conditions met


def convert_txt_note_to_illustrated(note: str, convert_dict: dict, to_lower: bool = False, max_size: int = -1,
                                    ignore_in_dict: list = None) -> str:
    """Convert a note written as only TXT to a note with illustrated format,
       looking initially for patterns of maximal size, and then decreasing progressively
       the size of the checked patterns.

    Parameters
    ----------
    note              Note in raw TXT.
    convert_dict      Dictionary for conversions.
    to_lower          True to look in the dictionary with key set in lower case.
    max_size          Maximal size of the split note pattern, less than 1 to take the full split length.
    ignore_in_dict    List of symbols to ignore when checking if it is in the dictionary,
                      None if nothing to ignore.

    Returns
    -------
    Updated note (potentially with illustration).
    """

    note_split = note.split(' ')  # note split based on spaces
    split_count = len(note_split)  # number of elements in the split

    if split_count < 1:  # safety if no element
        return ''

    if ignore_in_dict is None:  # set as empty list
        ignore_in_dict = []

    # initial gather count size
    init_gather_count = split_count if (max_size < 1) else max_size

    for gather_count in range(init_gather_count, 0, -1):  # number of elements to gather for dictionary check
        set_count = split_count - gather_count + 1  # number of gather sets that can be made
        assert 1 <= set_count <= split_count

        for first_id in range(set_count):  # ID of the first element
            assert 0 <= first_id < split_count
            check_note = note_split[first_id]
            for next_elem_id in range(first_id + 1, first_id + gather_count):  # gather the next elements
                assert 1 <= next_elem_id < split_count
                check_note += ' ' + note_split[next_elem_id]

            updated_check_note = str(check_note)  # update based on requests

            for ignore_elem in ignore_in_dict:  # ignore parts in dictionary
                updated_check_note = updated_check_note.replace(ignore_elem, '')

            if to_lower:  # to lower case
                updated_check_note = updated_check_note.lower()

            if updated_check_note in convert_dict:  # note to check is available in dictionary

                # used to retrieve ignored parts
                ignore_before = ''
                ignore_after = ''

                if len(ignore_in_dict) > 0:
                    # get back ignored parts (before dictionary replace)
                    check_note_len = len(check_note)
                    for character_id in range(check_note_len):
                        if check_note[character_id] in ignore_in_dict:
                            ignore_before += check_note[character_id]
                        else:
                            break

                    # get back ignored parts (after dictionary replace)
                    for character_id in range(check_note_len - 1, -1, -1):
                        if check_note[character_id] in ignore_in_dict:
                            ignore_after += check_note[character_id]
                        else:
                            break
                    if ignore_after != '':  # reverse order
                        ignore_after = ignore_after[::-1]

                before_note = ''  # gather note parts before the found sub-note
                for before_id in range(first_id):
                    assert 0 <= before_id < split_count
                    before_note += ' ' + note_split[before_id]
                before_note = before_note.lstrip()

                after_note = ''  # gather note parts after the found sub-note
                for after_id in range(first_id + gather_count, split_count):
                    assert 0 <= after_id < split_count
                    after_note += ' ' + note_split[after_id]
                after_note = after_note.lstrip()

                # compose final note with part before, sub-note found and part after
                final_note = ''
                if before_note != '':
                    final_note += convert_txt_note_to_illustrated(
                        before_note, convert_dict, to_lower, max_size, ignore_in_dict) + ' '

                final_note += ignore_before + '@' + convert_dict[updated_check_note] + '@' + ignore_after

                if after_note != '':
                    final_note += ' ' + convert_txt_note_to_illustrated(
                        after_note, convert_dict, to_lower, max_size, ignore_in_dict)

                return final_note

    # note (and sub-notes parts) not found, returning the initial TXT note
    return note


def build_order_time_to_str(time_sec: int) -> str:
    """Convert a time in seconds to the corresponding string (as 'x:xx').

    Parameters
    ----------
    time_sec    Time in seconds.

    Returns
    -------
    Corresponding string (as 'x:xx'), '0:00' if not valid (or negative) time.
    """
    if not isinstance(time_sec, int) or time_sec <= 0:
        return '0:00'

    return str(time_sec // 60) + ':' + f'{(time_sec % 60):02}'


def build_order_time_to_sec(time_str: str) -> int:
    """Convert a string with time (as 'x:xx') to a number of seconds.

    Parameters
    ----------
    time_str   String with time as 'x:xx'.

    Returns
    -------
    Elapsed time in seconds (positive) or -1 if not valid string.
    """

    # split between minutes and seconds
    if not isinstance(time_str, str):
        return -1
    time_split = time_str.split(':')
    if len(time_split) != 2:
        return -1

    # convert to [minutes, seconds] integer list
    int_vec = []
    for split_elem in time_split:
        if not split_elem.isdigit():
            return -1
        int_value = int(split_elem)
        if (not isinstance(int_value, int)) or (int_value < 0):
            return -1
        int_vec.append(int_value)
    assert len(int_vec) == 2

    # convert to seconds
    return 60 * int_vec[0] + int_vec[1]


def check_valid_build_order_timer(data: dict) -> bool:
    """Check if a build order can use the timer feature.

    Parameters
    ----------
    data   Build order data.

    Returns
    -------
    True if the build order is valid for timer feature.
    """
    if 'build_order' not in data:
        return False
    build_order_data = data['build_order']
    if not isinstance(build_order_data, list):
        return False

    last_time_sec = -1  # last time of the build order [sec]

    for build_order_step in build_order_data:  # loop on all the steps
        if ('notes' not in build_order_step) or ('time' not in build_order_step):
            return False

        time_sec = build_order_time_to_sec(build_order_step['time'])
        if (time_sec < 0) or (time_sec < last_time_sec):  # check valid time
            return False
        last_time_sec = time_sec

    return True  # build order is compatible with timer feature


def get_build_order_timer_steps(data: dict) -> list:
    """Check if a build order can use the timer feature and return the corresponding steps.

    Parameters
    ----------
    data   Build order data.

    Returns
    -------
    Build order steps in correct format (with time in sec), empty if build order is not valid for timer feature.
    """
    if 'build_order' not in data:
        return []
    build_order_data = data['build_order']
    if not isinstance(build_order_data, list):
        return []

    last_time_sec = -1  # last time of the build order [sec]
    full_steps = []  # store the full steps

    for build_order_step in build_order_data:  # loop on all the steps
        if ('notes' not in build_order_step) or ('time' not in build_order_step):
            return []

        time_sec = build_order_time_to_sec(build_order_step['time'])
        if (time_sec < 0) or (time_sec < last_time_sec):  # check valid time
            return []
        last_time_sec = time_sec

        # update step and store it
        updated_step = build_order_step.copy()
        updated_step['time_sec'] = time_sec
        full_steps.append(updated_step)

    return full_steps


def get_build_order_timer_step_ids(steps: list, current_time_sec: int, starting_flag: bool = True) -> list:
    """Get the IDs to display for the timer steps.

    Parameters
    ----------
    steps               Steps obtained with 'get_build_order_timer_steps'.
    current_time_sec    Current game time [sec].
    starting_flag       True if the timer steps starts at the indicated time, False if ending at this time.

    Returns
    -------
    List of IDs of the steps to show, empty list if 'steps' is empty.
    """
    steps_count = len(steps)
    if steps_count == 0:
        return []

    last_time_sec = -1
    selected_ids = [0]  # showing first element if nothing else valid found

    # range of steps to analyze
    step_range = range(steps_count)
    if not starting_flag:  # going in reverse order when timing indicates finishing step
        step_range = reversed(step_range)
        selected_ids = [steps_count - 1]

    for step_id in step_range:  # loop on the steps in ascending/descending order
        step = steps[step_id]
        if (starting_flag and (current_time_sec >= step['time_sec'])) or (
                (not starting_flag) and (current_time_sec <= step['time_sec'])):
            if step['time_sec'] != last_time_sec:
                selected_ids = [step_id]
                last_time_sec = step['time_sec']
            else:
                selected_ids.append(step_id)
        else:
            break

    selected_ids.sort()
    return selected_ids


def get_build_order_timer_steps_display(steps: list, step_ids: list) -> (list, list):
    """Get the build order timer steps to display.

    Parameters
    ----------
    steps       Steps obtained with 'get_build_order_timer_steps'.
    step_ids    IDs of the current steps, obtained from 'get_build_order_timer_step_ids'.

    Returns
    -------
    Step IDs of the output list (see below).
    List of steps to display.
    """
    assert len(step_ids) > 0
    for step_id in step_ids:
        assert 0 <= step_id < len(steps)
    step_ids.sort()  # safety (should already be the case)

    # check if first and last steps are selected
    first_step_flag = step_ids[0] == 0
    last_step_flag = step_ids[-1] == len(steps) - 1

    # check if everything can be returned
    if first_step_flag or last_step_flag:
        if len(steps) <= 2:
            return step_ids[:], steps[:]
    else:
        if len(steps) <= 3:
            return step_ids[:], steps[:]

    # show the previous step (or current if first step)
    init_id = max(0, step_ids[0] - 1)

    # show the next step (or current if last step)
    final_id = min(len(steps), step_ids[-1] + 2)  # +2 because ID is not selected in Python

    assert 0 <= init_id < final_id <= len(steps)

    out_steps = steps[init_id:final_id]
    out_step_ids = []
    for step_id in step_ids:
        out_step_id = step_id - init_id
        if 0 <= out_step_id < len(out_steps):
            out_step_ids.append(out_step_id)
    return out_step_ids, out_steps
