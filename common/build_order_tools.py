import json
from common.useful_tools import list_directory_files


def get_build_orders(directory: str, check_valid_build_order) -> dict:
    """Get the build orders

    Parameters
    ----------
    directory                  directory where the JSON build orders are located
    check_valid_build_order    function to check if a build order is valid

    Returns
    -------
    dictionary of build orders
    """
    build_order_files = list_directory_files(directory, extension='.json')

    build_orders = dict()

    for build_order_file in build_order_files:
        with open(build_order_file, 'r') as f:
            try:
                data = json.load(f)
                name = data['name']
                if name not in build_orders:
                    if check_valid_build_order(data):
                        build_orders[name] = data
                else:
                    print(f'Build order \'{name}\' from \'{build_order_file}\' already added, skipping it.')
            except json.JSONDecodeError:
                print(f'JSON decoding error while trying to read {build_order_file}.')

    return build_orders
