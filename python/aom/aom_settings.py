import json
from common.rts_settings import (
    RTSConfigurationLayout,
    RTSLayout,
    RTSOverlaySettings,
    RTSBuildOrderTimerLayout,
    RTSTimerHotkeys,
)


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


class AoMOverlaySettings(RTSOverlaySettings):
    """Settings for the AoM overlay"""

    def __init__(self):
        """Constructor"""
        super().__init__()

        self.title: str = 'AoM Overlay'  # application title

        # layout
        self.layout = AoMLayout()

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
