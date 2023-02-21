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
        if race_data not in sc2_race_icon:
            print(f'Unknown race \'{race_data}\' (check spelling) for build order \'{name}\'.')
            return False

        # check correct opponent race
        if (opponent_race_data not in sc2_race_icon) and (opponent_race_data != 'Any'):
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
