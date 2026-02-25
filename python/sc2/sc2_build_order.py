from sc2.sc2_race_icon import sc2_race_icon
from common.build_order_tools import (
    check_valid_faction,
    FieldDefinition,
    check_valid_steps,
)


def check_valid_sc2_build_order(data: dict, bo_name_msg: bool = False) -> (bool, str):
    """Check if a build order is valid for SC2.

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

        # Check correct race and opponent race
        valid_race, race_msg = check_valid_faction(
            data, bo_name_str, faction_name='race', factions_list=sc2_race_icon, requested=True, any_valid=False
        )
        if not valid_race:
            return False, race_msg

        valid_opponent_race, opponent_race_msg = check_valid_faction(
            data, bo_name_str, faction_name='opponent_race', factions_list=sc2_race_icon, requested=True, any_valid=True
        )
        if not valid_opponent_race:
            return False, opponent_race_msg

        fields = [
            FieldDefinition('notes', 'array of strings', True),
            FieldDefinition('time', 'string', False),
            FieldDefinition('supply', 'integer', False),
            FieldDefinition('minerals', 'integer', False),
            FieldDefinition('vespene_gas', 'integer', False),
        ]

        return check_valid_steps(data, bo_name_str, fields)

    except KeyError as err:
        return False, bo_name_str + f'Wrong JSON key: {err}.'

    except Exception as err:
        return False, bo_name_str + str(err)
