# AoE2 civilization Icons (with 3 letters shortcut)
aoe2_civilization_icon = {
    'Generic': ['GEN', 'question_mark.webp'],
    'Armenians': ['ARM', 'CivIcon-Armenians.webp'],
    'Aztecs': ['AZT', 'CivIcon-Aztecs.webp'],
    'Bengalis': ['BEN', 'CivIcon-Bengalis.webp'],
    'Berbers': ['BER', 'CivIcon-Berbers.webp'],
    'Bohemians': ['BOH', 'CivIcon-Bohemians.webp'],
    'Britons': ['BRI', 'CivIcon-Britons.webp'],
    'Burgundians': ['BUG', 'CivIcon-Burgundians.webp'],
    'Bulgarians': ['BUL', 'CivIcon-Bulgarians.webp'],
    'Burmese': ['BUM', 'CivIcon-Burmese.webp'],
    'Byzantines': ['BYZ', 'CivIcon-Byzantines.webp'],
    'Celts': ['CEL', 'CivIcon-Celts.webp'],
    'Chinese': ['CHI', 'CivIcon-Chinese.webp'],
    'Cumans': ['CUM', 'CivIcon-Cumans.webp'],
    'Dravidians': ['DRA', 'CivIcon-Dravidians.webp'],
    'Ethiopians': ['ETH', 'CivIcon-Ethiopians.webp'],
    'Franks': ['FRA', 'CivIcon-Franks.webp'],
    'Georgians': ['GEO', 'CivIcon-Georgians.webp'],
    'Goths': ['GOT', 'CivIcon-Goths.webp'],
    'Gurjaras': ['GUR', 'CivIcon-Gurjaras.webp'],
    'Hindustanis': ['HIN', 'CivIcon-Hindustanis.webp'],
    'Huns': ['HUN', 'CivIcon-Huns.webp'],
    'Incas': ['INC', 'CivIcon-Incas.webp'],
    'Italians': ['ITA', 'CivIcon-Italians.webp'],
    'Japanese': ['JAP', 'CivIcon-Japanese.webp'],
    'Jurchens': ['JUR', 'CivIcon-Jurchens.webp'],
    'Khitans': ['KHI', 'CivIcon-Khitans.webp'],
    'Khmer': ['KHM', 'CivIcon-Khmer.webp'],
    'Koreans': ['KOR', 'CivIcon-Koreans.webp'],
    'Lithuanians': ['LIT', 'CivIcon-Lithuanians.webp'],
    'Magyars': ['MAG', 'CivIcon-Magyars.webp'],
    'Mapuche': ['MAP', 'CivIcon-Mapuche.webp'],
    'Mayans': ['MAY', 'CivIcon-Mayans.webp'],
    'Malay': ['MLA', 'CivIcon-Malay.webp'],
    'Malians': ['MLI', 'CivIcon-Malians.webp'],
    'Mongols': ['MON', 'CivIcon-Mongols.webp'],
    'Muisca': ['MUI', 'CivIcon-Muisca.webp'],
    'Persians': ['PER', 'CivIcon-Persians.webp'],
    'Poles': ['POL', 'CivIcon-Poles.webp'],
    'Portuguese': ['POR', 'CivIcon-Portuguese.webp'],
    'Romans': ['ROM', 'CivIcon-Romans.webp'],
    'Saracens': ['SAR', 'CivIcon-Saracens.webp'],
    'Shu': ['SHU', 'CivIcon-Shu.webp'],
    'Sicilians': ['SIC', 'CivIcon-Sicilians.webp'],
    'Slavs': ['SLA', 'CivIcon-Slavs.webp'],
    'Spanish': ['SPA', 'CivIcon-Spanish.webp'],
    'Tatars': ['TAT', 'CivIcon-Tatars.webp'],
    'Teutons': ['TEU', 'CivIcon-Teutons.webp'],
    'Tupi': ['TUP', 'CivIcon-Tupi.webp'],
    'Turks': ['TUR', 'CivIcon-Turks.webp'],
    'Vietnamese': ['VIE', 'CivIcon-Vietnamese.webp'],
    'Vikings': ['VIK', 'CivIcon-Vikings.webp'],
    'Wei': ['WEI', 'CivIcon-Wei.webp'],
    'Wu': ['WU', 'CivIcon-Wu.webp'],
}


def get_aoe2_faction_selection() -> dict:
    """Get the dictionary used to select the AoE2 faction.

    Returns
    -------
    Dictionary with the faction selection choices and related images.
    """
    images_keys = []
    for key, values in aoe2_civilization_icon.items():
        images_keys.append({'key': key, 'image': 'civilization/' + values[1]})

    return {'root_folder': 'game', 'images_keys': images_keys}
