import json
from common.rts_settings import (
    RTSConfigurationLayout,
    RTSLayout,
    RTSOverlaySettings,
    RTSBuildOrderTimerLayout,
    RTSTimerHotkeys,
)


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


class AoE2OverlaySettings(RTSOverlaySettings):
    """Settings for the AoE2 overlay"""

    def __init__(self):
        """Constructor"""
        super().__init__()

        self.title: str = 'AoEII Overlay'  # application title

        # layout
        self.layout = AoE2Layout()

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
