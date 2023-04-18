import json
import os.path

from common.useful_tools import list_directory_files


def is_build_order_new(existing_build_orders: list, new_build_order_data: dict, category_name: str = None) -> bool:
    """Check if a build order is new

    Parameters
    ----------
    existing_build_orders    list of existing build orders
    new_build_order_data     new build order data
    category_name            if not None, accept build orders with same name, if they are in different categories

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
    """Get the build orders

    Parameters
    ----------
    directory                  directory where the JSON build orders are located
    check_valid_build_order    function to check if a build order is valid
    category_name              if not None, accept build orders with same name, if they are in different categories

    Returns
    -------
    list of valid build orders
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


def is_valid_resource(resource: [int, dict]) -> bool:
    """Checks if a resource is valid. It can either be an integer or a list of sub resources.

    Parameters
    ----------
    resource    int or dict of resources

    Returns
    -------
    boolean, if the resource is valid
    """
    if isinstance(resource, int):
        return True
    if isinstance(resource, dict) and all([isinstance(sub_resource, int) for sub_resource in resource.values()]):
        return True
    return False


def get_total_on_resource(resource: [int, dict]) -> int:
    """Gets an integer from either an int or a dict of sub resources.

    Parameters
    ----------
    resource    int or dict of resources

    Returns
    -------
    integer amount of villagers on that resource
    """
    if isinstance(resource, int):
        return resource
    elif isinstance(resource, dict):
        return sum([sub_resource for sub_resource in resource.values()])
    else:
        raise AttributeError("Unexpected resource data type.")


def check_build_order_key_values(build_order: dict, key_condition: dict = None) -> bool:
    """Check if a build order fulfills the correct key conditions

    Parameters
    ----------
    build_order      build order to check
    key_condition    dictionary with the keys to look for and their value (to consider as valid), None to skip it

    Returns
    -------
    True if no key condition or key conditions are correct
    """
    if key_condition is None:  # no key condition to check
        return True

    for key, value in key_condition.items():  # loop  on the key conditions
        if key in build_order:
            data_check = build_order[key]
            if (data_check == 'Any') or (data_check == 'any'):  # any build order data value is valid
                continue
            is_list = isinstance(data_check, list)
            if (is_list and (value not in data_check)) or ((not is_list) and (value != data_check)):
                return False  # at least on key condition not met

    return True  # all conditions met


def convert_txt_note_to_illustrated(note: str, convert_dict: dict, to_lower: bool = False, max_size: int = -1,
                                    ignore_in_dict: list = None) -> str:
    """Convert a note written as only TXT to a note with illustrated format,
       looking initially for patterns of maximal size, and then decreasing progressively
       the size of the checked patterns.

    Parameters
    ----------
    note              note in raw TXT
    convert_dict      dictionary for conversions
    to_lower          True to look in the dictionary with key set in lower case
    max_size          maximal size of the split note pattern, less than 1 to take the full split length
    ignore_in_dict    list of symbols to ignore when checking if it is in the dictionary,
                      None if nothing to ignore

    Returns
    -------
    updated note (potentially with illustration)
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
