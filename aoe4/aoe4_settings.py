import json
from common.settings_subclass import SettingsSubclass


class AoE4ConfigurationLayout(SettingsSubclass):
    """Settings for the AoE4 configuration layout"""

    def __init__(self):
        """Constructor"""
        self.search_spacing: int = 10  # space between the searching bars
        self.flag_select_size: list = [32, 24]  # size of the flag for civilization selection
        self.font_size_limits: list = [6, 25]  # limits for the police font selection choice
        # list of scaling values [%]
        self.scaling_list: list = [50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 175, 200, 225, 250, 275, 300]
        self.build_order_search_size: list = [130, 30]  # size of the search bar for the build order
        self.username_search_size: list = [130, 30]  # size of the search bar for the username
        self.build_order_selection_vertical_spacing: int = 3  # vertical spacing between two build order suggestions
        self.selected_build_order_color: list = [230, 159, 0]  # color for selected build order
        self.hovering_build_order_color: list = [204, 102, 0]  # color for build order hovered by mouse
        self.selected_username_color: list = [86, 180, 233]  # color for selected username
        self.bo_list_max_count: int = 15  # maximum count of valid build orders in the selection list


class AoE4BuildOrderLayout(SettingsSubclass):
    """Settings for the AoE4 build order layout"""

    def __init__(self):
        """Constructor"""
        self.image_height: int = 30  # height of the build order images
        self.resource_spacing: int = 2  # space between the build order resources
        self.bo_next_tab_spacing: int = 30  # horizontal spacing between build order last button and next tab button


class AoE4MatchDataLayout(SettingsSubclass):
    """Settings for the AoE4 match data display layout"""

    def __init__(self):
        """Constructor"""
        self.image_width: int = 27  # width of the civilization icons images (flags)
        self.image_height: int = 18  # height of the civilization icons images (flags)
        self.match_data_max_length: int = 14  # maximum number of characters to display for a match data element
        self.flag_width: int = 21  # width of the national flag image
        self.flag_height: int = 14  # width of the national flag image
        self.rank_class_height: int = 22  # height of the rank class icon
        self.resource_spacing: int = 2  # space between the elements
        self.color_player_1: list = [112, 146, 198]  # RGB color of player 1
        self.color_player_2: list = [230, 103, 104]  # RGB color of player 2
        self.color_player_3: list = [25, 212, 30]  # RGB color of player 3
        self.color_player_4: list = [243, 255, 29]  # RGB color of player 4
        self.color_player_5: list = [17, 217, 188]  # RGB color of player 5
        self.color_player_6: list = [225, 112, 222]  # RGB color of player 6
        self.color_player_7: list = [152, 159, 146]  # RGB color of player 7
        self.color_player_8: list = [237, 172, 32]  # RGB color of player 8
        self.color_map: list = [204, 153, 255]  # RGB color of the map name
        self.color_player_name: list = [255, 255, 255]  # RGB color of the player name
        self.color_elo_solo: list = [102, 178, 255]  # RGB color of the ELO for solo
        self.color_elo: list = [102, 178, 255]  # RGB color of ot the ELO of the current game type
        self.color_rank: list = [255, 255, 255]  # RGB color of the player rank
        self.color_win_rate: list = [255, 128, 0]  # RGB color of the win rate
        self.color_wins: list = [51, 255, 153]  # RGB color of the count of wins
        self.color_losses: list = [255, 102, 102]  # RGB color of the count of losses


class AoE4Layout(SettingsSubclass):
    """Settings for the AoE4 layout"""

    def __init__(self):
        """Constructor"""
        self.opacity: float = 0.75  # opacity of the window
        self.upper_right_position: list = [1871, 67]  # initial position of the upper right corner
        self.border_size: int = 15  # size of the borders
        self.vertical_spacing: int = 10  # vertical spacing
        self.horizontal_spacing: int = 6  # horizontal spacing
        self.font_police: str = 'Arial'  # font police type
        self.font_size: int = 11  # font size (selected value for 'font_size_limits')
        self.scaling: int = 100  # scaling value [%] (selected value for 'scaling_list')
        self.color_default: list = [255, 255, 255]  # default text RGB color for the font
        self.color_background: list = [30, 30, 30]  # background RGB color
        self.action_button_size: int = 22  # size of the action buttons
        self.action_button_spacing: int = 8  # horizontal spacing between the action buttons
        self.configuration: AoE4ConfigurationLayout = AoE4ConfigurationLayout()  # configuration layout
        self.build_order: AoE4BuildOrderLayout = AoE4BuildOrderLayout()  # build order layout
        self.match_data: AoE4MatchDataLayout = AoE4MatchDataLayout()  # match data layout


class AoE4Images(SettingsSubclass):
    """Settings for the AoE4 images"""

    def __init__(self):
        """Constructor"""
        self.wood: str = 'resource/resource_wood.png'  # wood resource
        self.food: str = 'resource/resource_food.png'  # food resource
        self.gold: str = 'resource/resource_gold.png'  # gold resource
        self.stone: str = 'resource/resource_stone.png'  # stone resource
        self.population: str = 'building_economy/house.png'  # population icon
        self.villager: str = 'unit_worker/villager.png'  # villager icon
        self.game_icon: str = 'icon/salamander_sword_shield.ico'  # game overlay icon
        self.age_unknown: str = 'age/age_unknown.png'  # unknown age image
        self.age_1: str = 'age/age_1.png'  # first age image (Dark Age)
        self.age_2: str = 'age/age_2.png'  # second age image (Feudal Age)
        self.age_3: str = 'age/age_3.png'  # third age image (Castle Age)
        self.age_4: str = 'age/age_4.png'  # fourth age image (Imperial Age)
        self.next_panel: str = 'action_button/to_end.png'  # go to the next next_panel
        self.build_order_previous_step: str = 'action_button/previous.png'  # go to previous step in the build order
        self.build_order_next_step: str = 'action_button/next.png'  # go to next step in the build order
        self.quit: str = 'action_button/leave.png'  # quit the overlay
        self.save: str = 'action_button/save.png'  # save the settings
        self.load: str = 'action_button/load.png'  # load the settings
        self.time: str = 'icon/time.png'  # time for build order


class AoE4Hotkeys(SettingsSubclass):
    """Settings for the AoE4 hotkeys"""

    def __init__(self):
        """Constructor"""
        self.enter: str = 'Return'  # enter selection key
        self.select_next_build_order: str = 'Tab'  # select the next build order
        self.next_panel: str = '<ctrl>+<alt>+q'  # cycle through the next panel
        self.show_hide: str = '<ctrl>+<alt>+w'  # show/hide the application
        self.build_order_previous_step: str = '<ctrl>+<alt>+e'  # go to the previous build order step
        self.build_order_next_step: str = '<ctrl>+<alt>+r'  # go to the next build order step


class AoE4OverlaySettings(SettingsSubclass):
    """Settings for the AoE4 overlay"""

    def __init__(self):
        """Constructor"""
        self.title: str = 'AoEIV Overlay'  # application title

        self.username: str = ''  # username

        self.mouse_call_ms = 20  # interval between 2 calls related to mouse motion [ms]
        self.match_data_call_ms = 10000  # interval between 2 calls related to match data [ms]

        # timeout for URL requests [s]
        self.url_timeout = 20

        # layout
        self.layout = AoE4Layout()

        # images
        self.images = AoE4Images()

        # hotkeys
        self.hotkeys = AoE4Hotkeys()


if __name__ == '__main__':
    aoe4_settings_name = 'aoe4_settings.json'

    settings_1 = AoE4OverlaySettings()
    with open(aoe4_settings_name, 'w') as f:
        f.write(json.dumps(settings_1.to_dict(), sort_keys=False, indent=4))

    settings_2 = AoE4OverlaySettings()
    with open(aoe4_settings_name, 'rb') as f:
        dict_data = json.load(f)
        settings_2.from_dict(dict_data)
