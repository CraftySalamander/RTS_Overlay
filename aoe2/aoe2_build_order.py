from aoe2.aoe2_civ_icon import aoe2_civilization_icon
from common.build_order_tools import is_valid_resource


def check_valid_aoe2_build_order(data: dict, bo_name_msg: bool = False) -> (bool, str):
    """Check if a build order is valid for AoE2

    Parameters
    ----------
    data           data of the build order JSON file
    bo_name_msg    True to add the build order name in the error message

    Returns
    -------
    True if valid build order, False otherwise
    string indicating the error (empty if no error)
    """
    bo_name_str: str = ''
    try:
        name = data['name']
        if bo_name_msg:
            bo_name_str: str = f'{name} | '

        build_order: list = data['build_order']

        # check correct civilization
        if 'civilization' in data:
            civilization_data = data['civilization']
            if isinstance(civilization_data, list):  # list of civilizations
                if len(civilization_data) == 0:
                    return False, bo_name_str + 'Valid civilization list is empty.'

                for civilization in civilization_data:
                    if (civilization not in aoe2_civilization_icon) and (civilization != 'Any'):
                        return False, bo_name_str + f'Unknown civilization \'{civilization}\' (check spelling).'
            # single civilization provided
            elif (civilization_data not in aoe2_civilization_icon) and (civilization_data != 'Any'):
                return False, bo_name_str + f'Unknown civilization \'{civilization_data}\' (check spelling).'

        if len(build_order) < 1:  # size of the build order
            return False, bo_name_str + f'Build order is empty.'

        # loop on the build order steps
        for step_id, item in enumerate(build_order):
            step_str = f'Step {step_id}'

            # check if main fields are there
            if 'villager_count' not in item:
                return False, bo_name_str + f'{step_str} is missing the \'villager_count\' field.'

            if 'age' not in item:
                return False, bo_name_str + f'{step_str} is missing the \'age\' field.'

            if 'resources' not in item:
                return False, bo_name_str + f'{step_str} is missing the \'resources\' field.'

            if 'notes' not in item:
                return False, bo_name_str + f'{step_str} is missing the \'notes\' field.'

            # villager count
            if not isinstance(item['villager_count'], int):
                return False, bo_name_str + f'{step_str} has invalid villager count ({item["villager_count"]}).'

            # age
            if (not isinstance(item['age'], int)) or (int(item['age']) > 4):
                return False, bo_name_str + f'{step_str} has invalid age number ({item["age"]}) (max: 4 for Imperial).'

            # resources
            resources = item['resources']

            if 'wood' not in resources:
                return False, bo_name_str + f'{step_str} is missing the \'wood\' field in \'resources\'.'

            if 'food' not in resources:
                return False, bo_name_str + f'{step_str} is missing the \'food\' field in \'resources\'.'

            if 'gold' not in resources:
                return False, bo_name_str + f'{step_str} is missing the \'gold\' field in \'resources\'.'

            if 'stone' not in resources:
                return False, bo_name_str + f'{step_str} is missing the \'stone\' field in \'resources\'.'

            if not is_valid_resource(resources['wood']):
                return False, bo_name_str + f'{step_str} has an invalid \'wood\' resource ({resources["wood"]}).'

            if not is_valid_resource(resources['food']):
                return False, bo_name_str + f'{step_str} has an invalid \'food\' resource ({resources["food"]}).'

            if not is_valid_resource(resources['gold']):
                return False, bo_name_str + f'{step_str} has an invalid \'gold\' resource ({resources["gold"]}).'

            if not is_valid_resource(resources['stone']):
                return False, bo_name_str + f'{step_str} has an invalid \'stone\' resource ({resources["stone"]}).'

            # optional builder count
            if ('builder' in resources) and (not is_valid_resource(resources['builder'])):
                return False, bo_name_str + f'{step_str} has an invalid \'builder\' resource.'

            # notes
            notes = item['notes']
            for note in notes:
                if not isinstance(note, str):
                    return False, bo_name_str + f'{step_str} note \'{note}\' is not a string.'

    except KeyError as err:
        return False, bo_name_str + f'Wrong JSON key: {err}.'

    except Exception as err:
        return False, bo_name_str + str(err)

    return True, ''  # valid build order, no error message


def build_order_sorting(elem: dict):
    """Sorting key used to order the build orders: civilizations set as 'Any' (or not specified) appear at the end.

    Parameters
    ----------
    elem    build order data to analyze

    Returns
    -------
    key value for sorting
    """
    return 1 if (('civilization' not in elem) or (elem['civilization'] == 'Any')) else 0
