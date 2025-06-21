from wc3.wc3_race_icon import wc3_race_icon
from common.build_order_tools import check_valid_faction, FieldDefinition, check_valid_steps


def check_valid_wc3_build_order(data: dict, bo_name_msg: bool = False) -> (bool, str):
    """Check if a build order is valid for WC3.

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
            data, bo_name_str, faction_name='race', factions_list=wc3_race_icon, requested=True, any_valid=False)
        if not valid_race:
            return False, race_msg

        valid_opponent_race, opponent_race_msg = check_valid_faction(
            data, bo_name_str, faction_name='opponent_race', factions_list=wc3_race_icon,
            requested=True, any_valid=True)
        if not valid_opponent_race:
            return False, opponent_race_msg

        fields = [
            FieldDefinition('notes', 'array of strings', True),
            FieldDefinition('time', 'string', False),
            FieldDefinition('food', 'integer', False),
            FieldDefinition('gold', 'integer', False),
            FieldDefinition('lumber', 'integer', False)
        ]

        return check_valid_steps(data, bo_name_str, fields)

    except KeyError as err:
        return False, bo_name_str + f'Wrong JSON key: {err}.'

    except Exception as err:
        return False, bo_name_str + str(err)


def get_wc3_build_order_step(build_order_data: dict = None) -> dict:
    """Get one step of the WC3 build order (template).

    Parameters
    ----------
    build_order_data    Data with the build order.

    Returns
    -------
    Dictionary with the build order step template.
    """
    if build_order_data is not None:
        assert isinstance(build_order_data, list) and len(build_order_data) >= 1
        data = build_order_data[-1]  # last step data
        return {
            'time': data.get('time', '0:00'),
            'food': data.get('food', -1),
            'gold': data.get('gold', -1),
            'lumber': data.get('lumber', -1),
            'notes': [
                'Note 1',
                'Note 2'
            ]
        }
    else:
        return {
            'time': '0:00',
            'food': -1,
            'gold': -1,
            'lumber': -1,
            'notes': [
                'Note 1',
                'Note 2'
            ]
        }


def get_wc3_build_order_template() -> dict:
    """Get the WC3 build order template (reset build order).

    Returns
    -------
    Dictionary with the build order template.
    """
    return {
        'race': 'Humans',
        'opponent_race': 'Any',
        'name': 'Build order name',
        'author': 'Author',
        'source': 'Source',
        'build_order': [get_wc3_build_order_step()]
    }
