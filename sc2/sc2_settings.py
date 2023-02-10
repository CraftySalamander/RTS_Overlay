import json
from common.rts_settings import RTSConfigurationUsernameLayout, RTSLayout, RTSImages, RTSOverlaySettings


class SC2ConfigurationLayout(RTSConfigurationUsernameLayout):
    """Settings for the SC2 configuration layout"""

    def __init__(self):
        """Constructor"""
        super().__init__()
        self.icon_select_size: list = [32, 32]  # size of the icon for race selection


class SC2Layout(RTSLayout):
    """Settings for the SC2 layout"""

    def __init__(self):
        """Constructor"""
        super().__init__()
        self.configuration: SC2ConfigurationLayout = SC2ConfigurationLayout()  # configuration layout


class SC2Images(RTSImages):
    """Settings for the SC2 images"""

    def __init__(self):
        """Constructor"""
        super().__init__()
        self.minerals: str = 'resource/minerals.png'  # minerals resource
        self.vespene_gas: str = 'resource/vespene_gas.png'  # vespene gas resource


class SC2OverlaySettings(RTSOverlaySettings):
    """Settings for the SC2 overlay"""

    def __init__(self):
        """Constructor"""
        super().__init__()

        self.title: str = 'SC2 Overlay'  # application title

        # layout
        self.layout = SC2Layout()

        # images
        self.images = SC2Images()

        # panel to input a build order
        self.panel_build_order.build_order_website = ['Spawning Tool', 'https://lotv.spawningtool.com']
        self.panel_build_order.edit_init_text = \
            'Replace this text by any build order in correct JSON format (see Readme.md), ' \
            'then click on \'Add build order\'.' \
            '\nYou can also manually write your build order as JSON format, following the guidelines in Readme.md ' \
            'or adapt one of the existing ones.' \
            '\n\nYou can find all your saved build orders as JSON files by clicking on \'Open build orders folder\'.' \
            '\nTo remove any build order, just delete the corresponding file and use \'reload settings\' ' \
            '(or relaunch the overlay).'


if __name__ == '__main__':
    sc2_settings_name = 'sc2_settings.json'

    settings_1 = SC2OverlaySettings()
    with open(sc2_settings_name, 'w') as f:
        f.write(json.dumps(settings_1.to_dict(), sort_keys=False, indent=4))

    settings_2 = SC2OverlaySettings()
    with open(sc2_settings_name, 'rb') as f:
        dict_data = json.load(f)
        settings_2.from_dict(dict_data)
