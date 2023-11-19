import json
from common.rts_settings import RTSConfigurationLayout, RTSLayout, RTSImages, RTSOverlaySettings, \
    RTSBuildOrderLayout, RTSBuildOrderInputLayout


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
        self.build_order: RTSBuildOrderLayout = RTSBuildOrderLayout()  # build order layout


class AoE4Images(RTSImages):
    """Settings for the AoE4 images"""

    def __init__(self):
        """Constructor"""
        super().__init__()
        self.wood: str = 'resource/resource_wood.png'  # wood resource
        self.food: str = 'resource/resource_food.png'  # food resource
        self.gold: str = 'resource/resource_gold.png'  # gold resource
        self.stone: str = 'resource/resource_stone.png'  # stone resource
        self.builder: str = 'resource/repair.png'  # builder icon
        self.population: str = 'building_economy/house.png'  # population icon
        self.villager: str = 'unit_worker/villager.png'  # villager icon
        self.age_unknown: str = 'age/age_unknown.png'  # unknown age image
        self.age_1: str = 'age/age_1.png'  # first age image (Dark Age)
        self.age_2: str = 'age/age_2.png'  # second age image (Feudal Age)
        self.age_3: str = 'age/age_3.png'  # third age image (Castle Age)
        self.age_4: str = 'age/age_4.png'  # fourth age image (Imperial Age)


class AoE4OverlaySettings(RTSOverlaySettings):
    """Settings for the AoE4 overlay"""

    def __init__(self):
        """Constructor"""
        super().__init__()

        self.panel_build_order = RTSBuildOrderInputLayout()  # panel to input a build order

        self.title: str = 'AoEIV Overlay'  # application title

        # layout
        self.layout = AoE4Layout()

        # images
        self.images = AoE4Images()


if __name__ == '__main__':
    aoe4_settings_name = 'aoe4_settings.json'

    settings_1 = AoE4OverlaySettings()
    with open(aoe4_settings_name, 'w') as f:
        f.write(json.dumps(settings_1.to_dict(), sort_keys=False, indent=4))

    settings_2 = AoE4OverlaySettings()
    with open(aoe4_settings_name, 'rb') as f:
        dict_data = json.load(f)
        settings_2.from_dict(dict_data)
