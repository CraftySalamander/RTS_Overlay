import json
from common.rts_settings import (
    RTSConfigurationLayout,
    RTSLayout,
    RTSOverlaySettings,
    RTSBuildOrderTimerLayout,
    RTSTimerHotkeys,
)


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


class AoE4OverlaySettings(RTSOverlaySettings):
    """Settings for the AoE4 overlay"""

    def __init__(self):
        """Constructor"""
        super().__init__()

        self.title: str = 'AoEIV Overlay'  # application title

        # layout
        self.layout = AoE4Layout()

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
