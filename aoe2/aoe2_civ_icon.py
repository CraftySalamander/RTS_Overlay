# AoE2 civilization Icons (with 3 letters shortcut)
aoe2_civilization_icon = {
    'Generic': ['GEN', 'question_mark.png'],
    'Armenians': ['ARM', 'CivIcon-Armenians.png'],
    'Aztecs': ['AZT', 'CivIcon-Aztecs.png'],
    'Bengalis': ['BEN', 'CivIcon-Bengalis.png'],
    'Berbers': ['BER', 'CivIcon-Berbers.png'],
    'Bohemians': ['BOH', 'CivIcon-Bohemians.png'],
    'Britons': ['BRI', 'CivIcon-Britons.png'],
    'Burgundians': ['BUG', 'CivIcon-Burgundians.png'],
    'Bulgarians': ['BUL', 'CivIcon-Bulgarians.png'],
    'Burmese': ['BUM', 'CivIcon-Burmese.png'],
    'Byzantines': ['BYZ', 'CivIcon-Byzantines.png'],
    'Celts': ['CEL', 'CivIcon-Celts.png'],
    'Chinese': ['CHI', 'CivIcon-Chinese.png'],
    'Cumans': ['CUM', 'CivIcon-Cumans.png'],
    'Dravidians': ['DRA', 'CivIcon-Dravidians.png'],
    'Ethiopians': ['ETH', 'CivIcon-Ethiopians.png'],
    'Franks': ['FRA', 'CivIcon-Franks.png'],
    'Georgians': ['GEO', 'CivIcon-Georgians.png'],
    'Goths': ['GOT', 'CivIcon-Goths.png'],
    'Gurjaras': ['GUR', 'CivIcon-Gurjaras.png'],
    'Hindustanis': ['HIN', 'CivIcon-Hindustanis.png'],
    'Huns': ['HUN', 'CivIcon-Huns.png'],
    'Incas': ['INC', 'CivIcon-Incas.png'],
    'Italians': ['ITA', 'CivIcon-Italians.png'],
    'Japanese': ['JAP', 'CivIcon-Japanese.png'],
    'Khmer': ['KHM', 'CivIcon-Khmer.png'],
    'Koreans': ['KOR', 'CivIcon-Koreans.png'],
    'Lithuanians': ['LIT', 'CivIcon-Lithuanians.png'],
    'Magyars': ['MAG', 'CivIcon-Magyars.png'],
    'Mayans': ['MAY', 'CivIcon-Mayans.png'],
    'Malay': ['MLA', 'CivIcon-Malay.png'],
    'Malians': ['MLI', 'CivIcon-Malians.png'],
    'Mongols': ['MON', 'CivIcon-Mongols.png'],
    'Persians': ['PER', 'CivIcon-Persians.png'],
    'Poles': ['POL', 'CivIcon-Poles.png'],
    'Portuguese': ['POR', 'CivIcon-Portuguese.png'],
    'Romans': ['ROM', 'CivIcon-Romans.png'],
    'Saracens': ['SAR', 'CivIcon-Saracens.png'],
    'Sicilians': ['SIC', 'CivIcon-Sicilians.png'],
    'Slavs': ['SLA', 'CivIcon-Slavs.png'],
    'Spanish': ['SPA', 'CivIcon-Spanish.png'],
    'Tatars': ['TAT', 'CivIcon-Tatars.png'],
    'Teutons': ['TEU', 'CivIcon-Teutons.png'],
    'Turks': ['TUR', 'CivIcon-Turks.png'],
    'Vietnamese': ['VIE', 'CivIcon-Vietnamese.png'],
    'Vikings': ['VIK', 'CivIcon-Vikings.png']
}


def get_aoe2_faction_selection() -> dict:
    """Get the dictionary used to select the AoE2 faction.

    Returns
    -------
    Dictionary with the faction selection choices and related images.
    """
    images_keys = []
    for key, values in aoe2_civilization_icon.items():
        images_keys.append({
            'key': key,
            'image': 'civilization/' + values[1]
        })

    return {
        'root_folder': 'game',
        'images_keys': images_keys
    }
