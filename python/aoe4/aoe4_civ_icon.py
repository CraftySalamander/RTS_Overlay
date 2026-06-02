# AoE4 civilization Icons (with 3 letters shortcut)
aoe4_civilization_icon = {
    'Abbasid Dynasty': ['ABB', 'CivIcon-AbbasidAoE4.webp'],
    'Ayyubids': ['AYY', 'CivIcon-AyyubidsAoE4.webp'],
    'Byzantines': ['BYZ', 'CivIcon-ByzantinesAoE4.webp'],
    'Chinese': ['CHI', 'CivIcon-ChineseAoE4.webp'],
    'Delhi Sultanate': ['DEL', 'CivIcon-DelhiAoE4.webp'],
    'English': ['ENG', 'CivIcon-EnglishAoE4.webp'],
    'French': ['FRE', 'CivIcon-FrenchAoE4.webp'],
    'Golden Horde': ['GOL', 'CivIcon-GoldenHordeAoE4.webp'],
    'House of Lancaster': ['HOL', 'CivIcon-HouseofLancasterAoE4.webp'],
    'Holy Roman Empire': ['HRE', 'CivIcon-HREAoE4.webp'],
    'Japanese': ['JAP', 'CivIcon-JapaneseAoE4.webp'],
    'Jeanne d\'Arc': ['JDA', 'CivIcon-JeanneDArcAoE4.webp'],
    'Jin Dynasty': ['JIN', 'CivIcon-JinDynastyAoE4.webp'],
    'Knights Templar': ['KTP', 'CivIcon-KnightsTemplarAoE4.webp'],
    'Macedonian Dynasty': ['MAC', 'CivIcon-MacedonianDynastyAoE4.webp'],
    'Malians': ['MAL', 'CivIcon-MaliansAoE4.webp'],
    'Mongols': ['MON', 'CivIcon-MongolsAoE4.webp'],
    'Order of the Dragon': ['OOD', 'CivIcon-OrderOfTheDragonAoE4.webp'],
    'Ottomans': ['OTT', 'CivIcon-OttomansAoE4.webp'],
    'Rus': ['RUS', 'CivIcon-RusAoE4.webp'],
    'Sengoku Daimyo': ['SEN', 'CivIcon-SengokuDaimyoAoE4.webp'],
    'Tughlaq Dynasty': ['TUG', 'CivIcon-TughlaqDynastyAoE4.webp'],
    'Zhu Xi\'s Legacy': ['ZXL', 'CivIcon-ZhuXiLegacyAoE4.webp'],
}


def get_aoe4_faction_selection() -> dict:
    """Get the dictionary used to select the AoE4 faction.

    Returns
    -------
    Dictionary with the faction selection choices and related images.
    """
    images_keys = []
    for key, values in aoe4_civilization_icon.items():
        images_keys.append({'key': key, 'image': 'civilization_flag/' + values[1]})

    return {'root_folder': 'game', 'images_keys': images_keys}
