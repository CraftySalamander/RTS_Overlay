# AoM major god icons (with 3 letters shortcut)
aom_major_god_icon = {
    # Greeks
    'Zeus': ['ZEU', 'zeus.png'],
    'Hades': ['HAD', 'hades.png'],
    'Poseidon': ['POS', 'poseidon.png'],
    # Egyptians
    'Ra': ['RA', 'ra.png'],
    'Isis': ['ISI', 'isis.png'],
    'Set': ['SET', 'set.png'],
    # Norse
    'Thor': ['THO', 'thor.png'],
    'Odin': ['ODI', 'odin.png'],
    'Loki': ['LOK', 'loki.png'],
    'Freyr': ['FRE', 'freyr.png'],
    # Atlanteans
    'Kronos': ['KRO', 'kronos.png'],
    'Oranos': ['ORA', 'oranos.png'],
    'Gaia': ['GAI', 'gaia.png'],
    # Chinese
    'Fuxi': ['FUX', 'fuxi.png'],
    'Nuwa': ['NUW', 'nuwa.png'],
    'Shennong': ['SHE', 'shennong.png']
}


def get_aom_faction_selection() -> dict:
    """Get the dictionary used to select the AoM faction.

    Returns
    -------
    Dictionary with the faction selection choices and related images.
    """
    images_keys = []
    for key, values in aom_major_god_icon.items():
        images_keys.append({
            'key': key,
            'image': 'major_god/' + values[1]
        })

    return {
        'root_folder': 'game',
        'images_keys': images_keys
    }
