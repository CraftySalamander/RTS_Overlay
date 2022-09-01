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

        if (not is_valid_resource(resources['wood'])) or (not is_valid_resource(resources['food'])) or (
                not is_valid_resource(resources['gold'])) or (not is_valid_resource(resources['stone'])):
            print(f'Build order \'{name}\' resources are not valid.')
            return False

        # notes
        notes = item['notes']
        for note in notes:
            if not isinstance(note, str):
                print(f'Build order \'{name}\' contains wrong notes.')
                return False
    return True


def is_valid_resource(resource: [int, dict]) -> bool:
    """
    Checks if a resource is valid. It can either be an integer or a list of sub resources
    Parameters
    ----------
    resource: int or dict of resources

    Returns
    -------
    boolean, wether the resource is valid
    """
    if isinstance(resource, int):
        return True
    if isinstance(resource, dict) and all([isinstance(sub_resource, int) for sub_resource in resource.values()]):
        return True
    return False

