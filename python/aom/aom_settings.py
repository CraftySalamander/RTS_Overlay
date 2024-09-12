import json
from common.rts_settings import RTSConfigurationLayout, RTSLayout, RTSOverlaySettings, \
    RTSTimerImages, RTSBuildOrderTimerLayout, RTSTimerHotkeys


class AoMConfigurationLayout(RTSConfigurationLayout):
    """Settings for the AoM configuration layout"""

    def __init__(self):
        """Constructor"""
        super().__init__()
        self.major_god_select_size: list = [28, 28]  # size of the icon for major god selection


class AoMLayout(RTSLayout):
    """Settings for the AoM layout"""

    def __init__(self):
        """Constructor"""
        super().__init__()
        self.configuration: AoMConfigurationLayout = AoMConfigurationLayout()  # configuration layout
        self.build_order: RTSBuildOrderTimerLayout = RTSBuildOrderTimerLayout()  # build order layout


class AoMImages(RTSTimerImages):
    """Settings for the AoM images"""

    def __init__(self):
        """Constructor"""
        super().__init__()
        self.food: str = 'resource/food.png'  # food resource
        self.wood: str = 'resource/wood.png'  # wood resource
        self.gold: str = 'resource/gold.png'  # gold resource
        self.favor: str = 'resource/favor.png'  # favor resource
        self.builder: str = 'resource/repair.png'  # builder icon
        self.worker: str = 'greeks_civilian/villager_greek.png'  # worker icon
        self.age_1: str = 'age/archaic_age.png'  # first age image (Archaic Age)
        self.age_2: str = 'age/classical_age.png'  # second age image (Classical Age)
        self.age_3: str = 'age/heroic_age.png'  # third age image (Heroic Age)
        self.age_4: str = 'age/mythic_age.png'  # fourth age image (Mythic Age)
        self.age_5: str = 'age/wonder_age.png'  # fifth age image (Wonder Age)


class AoMOverlaySettings(RTSOverlaySettings):
    """Settings for the AoM overlay"""

    def __init__(self):
        """Constructor"""
        super().__init__()

        self.title: str = 'AoM Overlay'  # application title

        # layout
        self.layout = AoMLayout()

        # images
        self.images = AoMImages()

        # hotkeys
        self.hotkeys = RTSTimerHotkeys()


if __name__ == '__main__':
    aom_settings_name = 'aom_settings.json'

    settings_1 = AoMOverlaySettings()
    with open(aom_settings_name, 'w') as f:
        f.write(json.dumps(settings_1.to_dict(), sort_keys=False, indent=4))

    settings_2 = AoMOverlaySettings()
    with open(aom_settings_name, 'rb') as f:
        dict_data = json.load(f)
        settings_2.from_dict(dict_data)
