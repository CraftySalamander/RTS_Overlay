from sc2.sc2_race_icon import sc2_race_icon


def check_valid_sc2_build_order(data: dict) -> bool:
    """Check if a build order is valid for SC2

    Parameters
    ----------
    data    data of the build order JSON file

    Returns
    -------
    True if valid build order, False otherwise
    """
    try:
        race_data: str = data['race']
        opponent_race_data: str = data['opponent_race']
        name: str = data['name']
        build_order: list = data['build_order']

        # check correct race
        if (race_data not in sc2_race_icon) or (race_data == 'Any'):
            print(f'Unknown race \'{race_data}\' (check spelling) for build order \'{name}\'.')
            return False

        # check correct opponent race
        if isinstance(opponent_race_data, list):  # list of races
            if len(opponent_race_data) == 0:
                print('Opponent race list empty.')
                return False

            for opponent_race in opponent_race_data:
                if opponent_race not in sc2_race_icon:
                    print(f'Unknown opponent race \'{opponent_race}\' (check spelling) for build order \'{name}\'.')
                    return False
        elif opponent_race_data not in sc2_race_icon:  # single race provided
            print(f'Unknown opponent race \'{opponent_race_data}\' (check spelling) for build order \'{name}\'.')
            return False

        count = len(build_order)  # size of the build order
        if count < 1:
            print(f'Build order \'{name}\' is empty.')
            return False

        # loop on the build order steps
        for item in build_order:
            # check main fields are there
            if 'notes' not in item:
                print(f'Build order \'{name}\' is missing a \'notes\' field.')
                return False

            # notes
            notes = item['notes']
            for note in notes:
                if 'note' not in note:
                    print(f'The \'note\' field is missing in build order \'{name}\'.')
                    return False

                if not isinstance(note['note'], str):
                    print(f'All \'note\' values in build order \'{name}\' should be of string type.')
                    return False

                if ('supply' in note) and (not isinstance(note['supply'], int)):
                    print(f'All \'supply\' values in build order \'{name}\' should be of integer type.')
                    return False

                if ('time' in note) and (not isinstance(note['time'], str)):
                    print(f'All \'time\' values in build order \'{name}\' should be of string type.')
                    return False

        return True

    except KeyError:
        print('Wrong key detected when checking for valid SC2 build order.')
        return False


def get_sc2_build_order_from_spawning_tool(
        data: str, race: str, opponent_race: str, lines_per_step: int,
        name: str, patch: str, author: str, source: str) -> dict:
    """Get the StarCraft 2 build order from the text copied on https://lotv.spawningtool.com.

    Parameters
    ----------
    data              data copied from https://lotv.spawningtool.com
    race              player race
    opponent_race     opponent race (can also be 'Any')
    lines_per_step    number of lines to print per step
    name              name of the build order
    patch             patch of the build order
    author            author of the build order
    source            source of the build order

    Returns
    -------
    Build order in the requested JSON-like (dictionary) format.
    """
    out_data = dict()  # output data as build order dictionary

    # races
    out_data['race'] = race
    out_data['opponent_race'] = ['Terran', 'Protoss', 'Zerg', 'Any'] if (opponent_race == 'Any') else opponent_race

    # editable fields
    out_data['name'] = name
    out_data['patch'] = patch
    out_data['author'] = author
    out_data['source'] = source

    # store all the build order notes
    count = 0
    current_note = {}  # storing current note
    build_order_data = []  # store all BO data

    for data_item in data.split('\n'):
        if (data_item == '') or (data_item.isspace()):  # ignore when containing only spaces (or empty)
            continue
        data_item = data_item.strip()  # remove extra spaces at beginning and end

        if count >= 3:  # 3 elements per line
            build_order_data.append(current_note)
            current_note = {}
            count = 0

        if count == 0:  # supply
            if not data_item.isdigit():
                raise Exception(f'Expected integer (for supply), instead of \'{data_item}\'.')
            current_note['supply'] = int(data_item)
        elif count == 1:  # time
            current_note['time'] = data_item
        elif count == 2:  # note
            current_note['note'] = data_item
        else:
            raise Exception(f'Invalid count of items per line for \'{data_item}\'.')

        count += 1

    if current_note:  # add last note if not empty
        build_order_data.append(current_note)

    # divide in steps
    count = 0
    current_step = []
    out_data['build_order'] = []

    for data in build_order_data:
        if count >= lines_per_step:
            out_data['build_order'].append({'notes': current_step})
            current_step = []
            count = 0

        current_step.append(data)
        count += 1

    if len(current_step) > 0:  # add last step if not empty
        out_data['build_order'].append({'notes': current_step})

    return out_data
