# WC3 race Icons
wc3_race_icon = {
    'Humans': ['HUM', 'human.webp'],
    'Orcs': ['ORC', 'orc.webp'],
    'Night Elves': ['NIG', 'night_elf.webp'],
    'Undead': ['UND', 'undead.webp'],
    'Any': ['ANY', 'dice.webp'],
}


def get_wc3_faction_selection() -> dict:
    """Get the dictionary used to select the WC3 faction.

    Returns
    -------
    Dictionary with the faction selection choices and related images.
    """
    images_keys = []
    for key, race_image in wc3_race_icon.items():
        assert len(race_image) == 2
        images_keys.append({'key': key, 'image': 'race/' + race_image[1]})

    return {'root_folder': 'game', 'images_keys': images_keys}
