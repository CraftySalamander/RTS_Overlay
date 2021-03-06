def check_valid_aoe2_build_order(data: dict) -> bool:
    """Check if a build order is valid for AoE2

    Parameters
    ----------
    data    data of the build order JSON file

    Returns
    -------
    True if valid build order, False otherwise
    """
    name: str = data['name']
    build_order: list = data['build_order']

    count = len(build_order)  # size of the build order
    if count < 1:
        print(f'Build order \'{name}\' is empty.')
        return False

    # loop on the build order steps
    for item in build_order:
        # check main fields are there
        if ('villager_count' not in item) or ('age' not in item) or ('resources' not in item) or ('notes' not in item):
            print(f'Build order \'{name}\' does not have all the required fields.')
            return False

        # villager count
        if not isinstance(item['villager_count'], int):
            print(f'Build order \'{name}\' does not have a valid villager count.')
            return False

        # age
        if (not isinstance(item['age'], int)) or (int(item['age']) > 4):
            print(f'Build order \'{name}\' does not have a valid age number.')
            return False

        # resources
        resources = item['resources']
        if ('wood' not in resources) or ('food' not in resources) or ('gold' not in resources) or (
                'stone' not in resources):
            print(f'Build order \'{name}\' does not have all the resources fields.')
            return False

        if (not isinstance(resources['wood'], int)) or (not isinstance(resources['food'], int)) or (
                not isinstance(resources['gold'], int)) or (not isinstance(resources['stone'], int)):
            print(f'Build order \'{name}\' resources are not valid.')
            return False

        # notes
        notes = item['notes']
        for note in notes:
            if not isinstance(note, str):
                print(f'Build order \'{name}\' contains wrong notes.')
                return False
    return True
