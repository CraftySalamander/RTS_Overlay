# AoE4 civilization Icons (with 3 letters shortcut)
aoe4_civilization_icon = {
    'Abbasid Dynasty': ['ABB', 'CivIcon-AbbasidAoE4.png'],
    'Ayyubids': ['AYY', 'CivIcon-AyyubidsAoE4.png'],
    'Byzantines': ['BYZ', 'CivIcon-ByzantinesAoE4.png'],
    'Chinese': ['CHI', 'CivIcon-ChineseAoE4.png'],
    'Delhi Sultanate': ['DEL', 'CivIcon-DelhiAoE4.png'],
    'English': ['ENG', 'CivIcon-EnglishAoE4.png'],
    'French': ['FRE', 'CivIcon-FrenchAoE4.png'],
    'House of Lancaster': ['HOL', 'CivIcon-HouseofLancasterAoE4.png'],
    'Holy Roman Empire': ['HRE', 'CivIcon-HREAoE4.png'],
    'Japanese': ['JAP', 'CivIcon-JapaneseAoE4.png'],
    'Jeanne d\'Arc': ['JDA', 'CivIcon-JeanneDArcAoE4.png'],
    'Knights Templar': ['KTP', 'CivIcon-KnightsTemplarAoE4.png'],
    'Malians': ['MAL', 'CivIcon-MaliansAoE4.png'],
    'Mongols': ['MON', 'CivIcon-MongolsAoE4.png'],
    'Order of the Dragon': ['OOD', 'CivIcon-OrderOfTheDragonAoE4.png'],
    'Ottomans': ['OTT', 'CivIcon-OttomansAoE4.png'],
    'Rus': ['RUS', 'CivIcon-RusAoE4.png'],
    'Zhu Xi\'s Legacy': ['ZXL', 'CivIcon-ZhuXiLegacyAoE4.png']
}


def get_aoe4_faction_selection() -> dict:
    """Get the dictionary used to select the AoE4 faction.

    Returns
    -------
    Dictionary with the faction selection choices and related images.
    """
    images_keys = []
    for key, values in aoe4_civilization_icon.items():
        images_keys.append({
            'key': key,
            'image': 'civilization_flag/' + values[1]
        })

    return {
        'root_folder': 'game',
        'images_keys': images_keys
    }
