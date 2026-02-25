import math
from aom.aom_major_god_icon import aom_major_god_icon
from common.build_order_tools import check_valid_faction, FieldDefinition, check_valid_steps


def check_valid_aom_build_order(data: dict, bo_name_msg: bool = False) -> (bool, str):
    """Check if a build order is valid for AoM.

    Parameters
    ----------
    data           Data of the build order JSON file.
    bo_name_msg    True to add the build order name in the error message.

    Returns
    -------
    True if valid build order, False otherwise.
    String indicating the error (empty if no error).
    """
    bo_name_str: str = ''
    try:
        if bo_name_msg:
            bo_name_str = data['name'] + ' | '

        # Check correct major god
        valid_faction, faction_msg = check_valid_faction(
            data,
            bo_name_str,
            faction_name='major_god',
            factions_list=aom_major_god_icon,
            requested=True,
            any_valid=False,
        )
        if not valid_faction:
            return False, faction_msg

        fields = [
            FieldDefinition('worker_count', 'integer', True),
            FieldDefinition('age', 'integer', True, None, [-math.inf, 5]),
            FieldDefinition('food', 'integer', True, 'resources'),
            FieldDefinition('wood', 'integer', True, 'resources'),
            FieldDefinition('gold', 'integer', True, 'resources'),
            FieldDefinition('favor', 'integer', True, 'resources'),
            FieldDefinition('builder', 'integer', False, 'resources'),
            FieldDefinition('time', 'string', False),
            FieldDefinition('notes', 'array of strings', True),
        ]

        return check_valid_steps(data, bo_name_str, fields)

    except KeyError as err:
        return False, bo_name_str + f'Wrong JSON key: {err}.'

    except Exception as err:
        return False, bo_name_str + str(err)
