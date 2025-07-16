import json
from common.rts_settings import RTSConfigurationLayout, RTSLayout, RTSOverlaySettings, \
    RTSTimerImages, RTSBuildOrderTimerLayout, RTSTimerHotkeys


class AoE4ConfigurationLayout(RTSConfigurationLayout):
    """Settings for the AoE4 configuration layout"""

    def __init__(self):
        """Constructor"""
        super().__init__()
        self.flag_select_size: list = [32, 24]  # size of the flag for civilization selection


class AoE4Layout(RTSLayout):
    """Settings for the AoE4 layout"""

    def __init__(self):
        """Constructor"""
        super().__init__()
        self.configuration: AoE4ConfigurationLayout = AoE4ConfigurationLayout()  # configuration layout
        self.build_order: RTSBuildOrderTimerLayout = RTSBuildOrderTimerLayout()  # build order layout


class AoE4Images(RTSTimerImages):
    """Settings for the AoE4 images"""

    def __init__(self):
        """Constructor"""
        super().__init__()
        self.wood: str = 'resource/resource_wood.webp'  # wood resource
        self.food: str = 'resource/resource_food.webp'  # food resource
        self.gold: str = 'resource/resource_gold.webp'  # gold resource
        self.stone: str = 'resource/resource_stone.webp'  # stone resource
        self.builder: str = 'resource/repair.webp'  # builder icon
        self.population: str = 'building_economy/house.webp'  # population icon
        self.villager: str = 'unit_worker/villager.webp'  # villager icon
        self.age_unknown: str = 'age/age_unknown.png'  # unknown age image
        self.age_1: str = 'age/age_1.webp'  # first age image (Dark Age)
        self.age_2: str = 'age/age_2.webp'  # second age image (Feudal Age)
        self.age_3: str = 'age/age_3.webp'  # third age image (Castle Age)
        self.age_4: str = 'age/age_4.webp'  # fourth age image (Imperial Age)


class AoE4OverlaySettings(RTSOverlaySettings):
    """Settings for the AoE4 overlay"""

    def __init__(self):
        """Constructor"""
        super().__init__()

        self.title: str = 'AoEIV Overlay'  # application title

        # layout
        self.layout = AoE4Layout()

        # images
        self.images = AoE4Images()

        # hotkeys
        self.hotkeys = RTSTimerHotkeys()


if __name__ == '__main__':
    aoe4_settings_name = 'aoe4_settings.json'

    settings_1 = AoE4OverlaySettings()
    with open(aoe4_settings_name, 'w') as f:
        f.write(json.dumps(settings_1.to_dict(), sort_keys=False, indent=4))

    settings_2 = AoE4OverlaySettings()
    with open(aoe4_settings_name, 'rb') as f:
        dict_data = json.load(f)
        settings_2.from_dict(dict_data)
