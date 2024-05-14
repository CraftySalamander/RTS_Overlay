# SC2 race Icons
sc2_race_icon = {
    'Terran': 'TerranIcon.png',
    'Protoss': 'ProtossIcon.png',
    'Zerg': 'ZergIcon.png',
    'Any': 'AnyRaceIcon.png'
}


def get_sc2_faction_selection() -> dict:
    """Get the dictionary used to select the SC2 faction.

    Returns
    -------
    Dictionary with the faction selection choices and related images.
    """
    images_keys = []
    for key, race_image in sc2_race_icon.items():
        images_keys.append({
            'key': key,
            'image': 'race_icon/' + race_image
        })

    return {
        'root_folder': 'game',
        'images_keys': images_keys
    }
