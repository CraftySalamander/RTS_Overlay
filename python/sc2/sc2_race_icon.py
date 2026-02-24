# SC2 race Icons
sc2_race_icon = {
    'Terran': ['TER', 'TerranIcon.webp'],
    'Protoss': ['PRO', 'ProtossIcon.webp'],
    'Zerg': ['ZRG', 'ZergIcon.webp'],
    'Any': ['ANY', 'AnyRaceIcon.webp'],
}


def get_sc2_faction_selection() -> dict:
    """Get the dictionary used to select the SC2 faction.

    Returns
    -------
    Dictionary with the faction selection choices and related images.
    """
    images_keys = []
    for key, race_image in sc2_race_icon.items():
        assert len(race_image) == 2
        images_keys.append({'key': key, 'image': 'race_icon/' + race_image[1]})

    return {'root_folder': 'game', 'images_keys': images_keys}
