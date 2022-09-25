import json
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
            is_list = isinstance(data_check, list)
            if (is_list and (value not in data_check)) or ((not is_list) and (value != data_check)):
                return False  # at least on key condition not met

    return True  # all conditions met
