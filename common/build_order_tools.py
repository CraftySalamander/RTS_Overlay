import json
from common.useful_tools import list_directory_files


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
                new_build_order = True  # assuming new build order
                for build_order in build_orders:
                    if build_order['name'] == data['name']:
                        if (category_name is None) or (build_order[category_name] == data[category_name]):
                            new_build_order = False  # already added
                            break

                if new_build_order:  # new build order to add
                    if check_valid_build_order(data):
                        build_orders.append(data)
                else:  # already added this build order
                    name = data['name']
                    print(f'Build order \'{name}\' from \'{build_order_file}\' already added, skipping it.')

            except json.JSONDecodeError:
                print(f'JSON decoding error while trying to read {build_order_file}.')

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
