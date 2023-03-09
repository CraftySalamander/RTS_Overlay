import json
from common.rts_settings import RTSConfigurationLayout, RTSLayout, RTSImages, RTSOverlaySettings, RTSBuildOrderLayout, \
    RTSBuildOrderInputLayout


class SC2BuildOrderInputLayout(RTSBuildOrderInputLayout):
    """Settings for the SC2 panel to input a new build order"""

    def __init__(self):
        """Constructor"""
        super().__init__()
        self.default_lines_per_step: int = 5  # default number of lines per step
        self.lines_per_step_max_count: int = 50  # maximum number of lines per step
        self.combo_lines_per_step_size: list = [60, 30]  # size of the combo box for number of lines per step
        self.icon_select_size: list = [32, 32]  # size of the icon for race selection
        self.edit_field_name_size: list = [240, 30]  # size of the editing field for build order name
        self.edit_field_patch_size = [120, 30]  # size of the editing field for build order patch
        self.edit_field_author_size: list = [120, 30]  # size of the editing field for build order author
        self.edit_field_source_size: list = [120, 30]  # size of the editing field for build order source


class SC2ConfigurationLayout(RTSConfigurationLayout):
    """Settings for the SC2 configuration layout"""

    def __init__(self):
        """Constructor"""
        super().__init__()
        self.icon_select_size: list = [32, 32]  # size of the icon for race selection
        self.build_order_search_size: list = [240, 30]  # size of the search bar for the build order


class SC2BuildOrderLayout(RTSBuildOrderLayout):
    """Settings for the RTS build order layout"""

    def __init__(self):
        """Constructor"""
        super().__init__()
        self.supply_image_height: int = 20  # height of the supply image
        self.time_image_height: int = 20  # height of the time image


class SC2Layout(RTSLayout):
    """Settings for the SC2 layout"""

    def __init__(self):
        """Constructor"""
        super().__init__()
        self.configuration: SC2ConfigurationLayout = SC2ConfigurationLayout()  # configuration layout
        self.build_order: SC2BuildOrderLayout = SC2BuildOrderLayout()  # build order layout


class SC2Images(RTSImages):
    """Settings for the SC2 images"""

    def __init__(self):
        """Constructor"""
        super().__init__()
        self.supply: str = 'icon/house.png'  # image to use for supply


class SC2OverlaySettings(RTSOverlaySettings):
    """Settings for the SC2 overlay"""

    def __init__(self):
        """Constructor"""
        super().__init__()

        self.panel_build_order = SC2BuildOrderInputLayout()  # panel to input a build order

        self.title: str = 'SC2 Overlay'  # application title

        # layout
        self.layout = SC2Layout()

        # images
        self.images = SC2Images()

        # panel to input a build order
        self.panel_build_order.build_order_website = ['Spawning Tool', 'https://lotv.spawningtool.com']
        self.panel_build_order.edit_init_text = \
            'Replace this text by any build order in correct format, then click on \'Add build order\'.' \
            '\n\nYou can manually write your build order as JSON format (following the guidelines in Readme.md) ' \
            'or (easier) copy-paste one from Spawning Tool.' \
            '\n\nFor the second option, click on the \'Spawning Tool\' button, and select any build order.' \
            '\nThen, copy all the lines starting with a supply value and' \
            ' paste them here (replace all these instructions).' \
            '\nFinally, adapt all the options (race, opponent race, lines per step, build order name, patch,' \
            ' author and source), before clicking on \'Add build order\'.' \
            '\n\nYou can find all your saved build orders as JSON files by clicking on \'Open build orders folder\'.' \
            '\nTo remove any build order, just delete the corresponding file and use \'reload settings\' ' \
            '(or relaunch the overlay).' \
            '\n\nHere is an example of text to paste.' \
            '\n-------------------------' \
            '\n13    0:12    Overlord' \
            '\n16    0:48    Hatchery' \
            '\n18    1:10    Extractor' \
            '\n17    1:14    Spawning Pool' \
            '\n20    1:53    Overlord' \
            '\n20    2:01    Queen x2' \
            '\n20    2:02    Zergling x4'


if __name__ == '__main__':
    sc2_settings_name = 'sc2_settings.json'

    settings_1 = SC2OverlaySettings()
    with open(sc2_settings_name, 'w') as f:
        f.write(json.dumps(settings_1.to_dict(), sort_keys=False, indent=4))

    settings_2 = SC2OverlaySettings()
    with open(sc2_settings_name, 'rb') as f:
        dict_data = json.load(f)
        settings_2.from_dict(dict_data)
