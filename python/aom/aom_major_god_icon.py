# AoM major god icons (with 3 letters shortcut)
aom_major_god_icon = {
    # Greeks
    'Zeus': ['ZEU', 'zeus.webp'],
    'Hades': ['HAD', 'hades.webp'],
    'Poseidon': ['POS', 'poseidon.webp'],
    'Demeter': ['DEM', 'demeter.webp'],
    # Egyptians
    'Ra': ['RA', 'ra.webp'],
    'Isis': ['ISI', 'isis.webp'],
    'Set': ['SET', 'set.webp'],
    # Norse
    'Thor': ['THO', 'thor.webp'],
    'Odin': ['ODI', 'odin.webp'],
    'Loki': ['LOK', 'loki.webp'],
    'Freyr': ['FRE', 'freyr.webp'],
    # Atlanteans
    'Kronos': ['KRO', 'kronos.webp'],
    'Oranos': ['ORA', 'oranos.webp'],
    'Gaia': ['GAI', 'gaia.webp'],
    # Chinese
    'Fuxi': ['FUX', 'fuxi.webp'],
    'Nuwa': ['NUW', 'nuwa.webp'],
    'Shennong': ['SHE', 'shennong.webp'],
    # Japanese
    'Amaterasu': ['AMA', 'amaterasu.webp'],
    'Tsukuyomi': ['TSU', 'tsukuyomi.webp'],
    'Susanoo': ['SUS', 'susanoo.webp'],
    # Aztecs
    'Huitzilopochtli': ['HUI', 'huitzilopochtli.webp'],
    'Quetzalcoatl': ['QUE', 'quetzalcoatl.webp'],
    'Tezcatlipoca': ['TEZ', 'tezcatlipoca.webp'],
}


def get_aom_faction_selection() -> dict:
    """Get the dictionary used to select the AoM faction.

    Returns
    -------
    Dictionary with the faction selection choices and related images.
    """
    images_keys = []
    for key, values in aom_major_god_icon.items():
        images_keys.append({'key': key, 'image': 'major_god/' + values[1]})

    return {'root_folder': 'game', 'images_keys': images_keys}
