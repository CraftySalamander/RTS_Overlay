import math
from aoe4.aoe4_civ_icon import aoe4_civilization_icon
from common.build_order_tools import check_valid_faction, FieldDefinition, check_valid_steps


def check_valid_aoe4_build_order(data: dict, bo_name_msg: bool = False) -> (bool, str):
    """Check if a build order is valid for AoE4.

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

        # Check correct civilization
        valid_faction, faction_msg = check_valid_faction(
            data,
            bo_name_str,
            faction_name='civilization',
            factions_list=aoe4_civilization_icon,
            requested=True,
            any_valid=True,
        )
        if not valid_faction:
            return False, faction_msg

        fields = [
            FieldDefinition('population_count', 'integer', True),
            FieldDefinition('villager_count', 'integer', True),
            FieldDefinition('age', 'integer', True, None, [-math.inf, 4]),
            FieldDefinition('food', 'integer', True, 'resources'),
            FieldDefinition('wood', 'integer', True, 'resources'),
            FieldDefinition('gold', 'integer', True, 'resources'),
            FieldDefinition('stone', 'integer', True, 'resources'),
            FieldDefinition('builder', 'integer', False, 'resources'),
            FieldDefinition('notes', 'array of strings', True),
            FieldDefinition('time', 'string', False),
        ]

        return check_valid_steps(data, bo_name_str, fields)

    except KeyError as err:
        return False, bo_name_str + f'Wrong JSON key: {err}.'

    except Exception as err:
        return False, bo_name_str + str(err)
