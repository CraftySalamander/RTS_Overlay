import json
from common.rts_settings import RTSConfigurationLayout, RTSLayout, RTSOverlaySettings, \
    RTSTimerImages, RTSBuildOrderTimerLayout, RTSTimerHotkeys


class AoE2ConfigurationLayout(RTSConfigurationLayout):
    """Settings for the AoE2 configuration layout"""

    def __init__(self):
        """Constructor"""
        super().__init__()
        self.civilization_icon_select_size: list = [24, 24]  # size of the civilization icon for civilization selection


class AoE2Layout(RTSLayout):
    """Settings for the AoE2 layout"""

    def __init__(self):
        """Constructor"""
        super().__init__()
        self.configuration: AoE2ConfigurationLayout = AoE2ConfigurationLayout()  # configuration layout
        self.build_order: RTSBuildOrderTimerLayout = RTSBuildOrderTimerLayout()  # build order layout


class AoE2Images(RTSTimerImages):
    """Settings for the AoE2 images"""

    def __init__(self):
        """Constructor"""
        super().__init__()
        self.wood: str = 'resource/Aoe2de_wood.png'  # wood resource
        self.food: str = 'resource/Aoe2de_food.png'  # food resource
        self.gold: str = 'resource/Aoe2de_gold.png'  # gold resource
        self.stone: str = 'resource/Aoe2de_stone.png'  # stone resource
        self.builder: str = 'resource/Aoe2de_hammer.png'  # builder icon
        self.villager: str = 'resource/MaleVillDE_alpha.png'  # villager icon
        self.age_unknown: str = 'age/AgeUnknown.png'  # unknown age image
        self.age_1: str = 'age/DarkAgeIconDE_alpha.png'  # first age image (Dark Age)
        self.age_2: str = 'age/FeudalAgeIconDE_alpha.png'  # second age image (Feudal Age)
        self.age_3: str = 'age/CastleAgeIconDE_alpha.png'  # third age image (Castle Age)
        self.age_4: str = 'age/ImperialAgeIconDE_alpha.png'  # fourth age image (Imperial Age)


class AoE2OverlaySettings(RTSOverlaySettings):
    """Settings for the AoE2 overlay"""

    def __init__(self):
        """Constructor"""
        super().__init__()

        self.title: str = 'AoEII Overlay'  # application title

        # layout
        self.layout = AoE2Layout()

        # images
        self.images = AoE2Images()

        # hotkeys
        self.hotkeys = RTSTimerHotkeys()

        # timer speed factor
        self.timer_speed_factor = 1.608


if __name__ == '__main__':
    aoe2_settings_name = 'aoe2_settings.json'

    settings_1 = AoE2OverlaySettings()
    with open(aoe2_settings_name, 'w') as f:
        f.write(json.dumps(settings_1.to_dict(), sort_keys=False, indent=4))

    settings_2 = AoE2OverlaySettings()
    with open(aoe2_settings_name, 'rb') as f:
        dict_data = json.load(f)
        settings_2.from_dict(dict_data)
