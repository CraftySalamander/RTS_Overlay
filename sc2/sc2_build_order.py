from sc2.sc2_race_icon import sc2_race_icon
from common.build_order_tools import is_valid_resource


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
        name: str = data['name']
        build_order: list = data['build_order']

        # check correct race
        if isinstance(race_data, list):  # list of races
            if len(race_data) == 0:
                print('Valid race list empty.')
                return False

            for race in race_data:
                if race not in sc2_race_icon:
                    print(f'Unknown race \'{race}\' (check spelling) for build order \'{name}\'.')
                    return False
        elif race_data not in sc2_race_icon:  # single race provided
            print(f'Unknown race \'{race_data}\' (check spelling) for build order \'{name}\'.')
            return False

        count = len(build_order)  # size of the build order
        if count < 1:
            print(f'Build order \'{name}\' is empty.')
            return False

        # loop on the build order steps
        for item in build_order:
            # check main fields are there
            if ('resources' not in item) or ('notes' not in item):
                print(f'Build order \'{name}\' does not have all the required fields.')
                return False

            # resources
            resources = item['resources']
            if ('minerals' not in resources) or ('vespene_gas' not in resources):
                print(f'Build order \'{name}\' does not have all the resources fields.')
                return False

            if (not is_valid_resource(resources['minerals'])) or (not is_valid_resource(resources['vespene_gas'])):
                print(f'Build order \'{name}\' resources are not valid.')
                return False

            # notes
            notes = item['notes']
            for note in notes:
                if not isinstance(note, str):
                    print(f'Build order \'{name}\' contains wrong notes.')
                    return False
        return True
    except KeyError:
        print('Wrong key detected when checking for valid SC2 build order.')
        return False
