import json


class AoE2ConfigurationLayout:
    """Settings for the AoE2 configuration layout"""

    def __init__(self, ):
        """Constructor"""
        self.search_spacing: int = 10  # space between the searching bars
        self.font_size_limits: list = [6, 25]  # limits for the font size selection choice
        # list of scaling values [%]
        self.scaling_list: list = [50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 175, 200, 225, 250, 275, 300]
        self.build_order_search_size: list = [130, 30]  # size of the search bar for the build order
        self.username_search_size: list = [130, 30]  # size of the search bar for the username
        self.build_order_selection_vertical_spacing: int = 3  # vertical spacing between two build order suggestions
        self.selected_build_order_color: list = [230, 159, 0]  # color for selected build order
        self.hovering_build_order_color: list = [204, 102, 0]  # color for build order hovered by mouse
        self.selected_username_color: list = [86, 180, 233]  # color for selected username
        self.bo_list_max_count: int = 15  # maximum count of valid build orders in the selection list

    def to_dict(self):
        """Convert content to dictionary

        Returns
        -------
        dictionary data
        """
        data = dict()
        data['search_spacing'] = self.search_spacing
        data['font_size_limits'] = self.font_size_limits
        data['scaling_list'] = self.scaling_list
        data['build_order_search_size'] = self.build_order_search_size
        data['username_search_size'] = self.username_search_size
        data['build_order_selection_vertical_spacing'] = self.build_order_selection_vertical_spacing
        data['selected_build_order_color'] = self.selected_build_order_color
        data['hovering_build_order_color'] = self.hovering_build_order_color
        data['selected_username_color'] = self.selected_username_color
        data['bo_list_max_count'] = self.bo_list_max_count
        return data

    def from_dict(self, data):
        """Update content from dictionary

        Parameters
        ----------
        data    dictionary data
        """
        self.search_spacing = data['search_spacing']
        self.font_size_limits = data['font_size_limits']
        self.scaling_list = data['scaling_list']
        self.build_order_search_size = data['build_order_search_size']
        self.username_search_size = data['username_search_size']
        self.build_order_selection_vertical_spacing = data['build_order_selection_vertical_spacing']
        self.selected_build_order_color = data['selected_build_order_color']
        self.hovering_build_order_color = data['hovering_build_order_color']
        self.selected_username_color = data['selected_username_color']
        self.bo_list_max_count = data['bo_list_max_count']


class AoE2BuildOrderLayout:
    """Settings for the AoE2 build order layout"""

    def __init__(self, ):
        """Constructor"""
        self.image_height: int = 30  # height of the build order images
        self.resource_spacing: int = 3  # space between the build order resources
        self.bo_next_tab_spacing: int = 30  # horizontal spacing between build order last button and next tab button

    def to_dict(self):
        """Convert content to dictionary

        Returns
        -------
        dictionary data
        """
        data = dict()
        data['image_height'] = self.image_height
        data['resource_spacing'] = self.resource_spacing
        data['bo_next_tab_spacing'] = self.bo_next_tab_spacing
        return data

    def from_dict(self, data):
        """Update content from dictionary

        Parameters
        ----------
        data    dictionary data
        """
        self.image_height = data['image_height']
        self.resource_spacing = data['resource_spacing']
        self.bo_next_tab_spacing = data['bo_next_tab_spacing']


class AoE2MatchDataLayout:
    """Settings for the AoE2 match data display layout"""

    def __init__(self, ):
        """Constructor"""
        self.image_height: int = 20  # height of the civilization icons images
        self.match_data_max_length: int = 14  # maximum number of characters to display for a match data element
        self.flag_width: int = 21  # width of the national flag image
        self.flag_height: int = 14  # width of the national flag image
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

    def to_dict(self):
        """Convert content to dictionary

        Returns
        -------
        dictionary data
        """
        data = dict()
        data['image_height'] = self.image_height
        data['match_data_max_length'] = self.match_data_max_length
        data['flag_width'] = self.flag_width
        data['flag_height'] = self.flag_height
        data['resource_spacing'] = self.resource_spacing
        data['color_player_1'] = self.color_player_1
        data['color_player_2'] = self.color_player_2
        data['color_player_3'] = self.color_player_3
        data['color_player_4'] = self.color_player_4
        data['color_player_5'] = self.color_player_5
        data['color_player_6'] = self.color_player_6
        data['color_player_7'] = self.color_player_7
        data['color_player_8'] = self.color_player_8
        data['color_map'] = self.color_map
        data['color_player_name'] = self.color_player_name
        data['color_elo_solo'] = self.color_elo_solo
        data['color_elo'] = self.color_elo
        data['color_rank'] = self.color_rank
        data['color_win_rate'] = self.color_win_rate
        data['color_wins'] = self.color_wins
        data['color_losses'] = self.color_losses
        return data

    def from_dict(self, data):
        """Update content from dictionary

        Parameters
        ----------
        data    dictionary data
        """
        self.image_height = data['image_height']
        self.match_data_max_length = data['match_data_max_length']
        self.flag_width = data['flag_width']
        self.flag_height = data['flag_height']
        self.resource_spacing = data['resource_spacing']
        self.color_player_1 = data['color_player_1']
        self.color_player_2 = data['color_player_2']
        self.color_player_3 = data['color_player_3']
        self.color_player_4 = data['color_player_4']
        self.color_player_5 = data['color_player_5']
        self.color_player_6 = data['color_player_6']
        self.color_player_7 = data['color_player_7']
        self.color_player_8 = data['color_player_8']
        self.color_map = data['color_map']
        self.color_player_name = data['color_player_name']
        self.color_elo_solo = data['color_elo_solo']
        self.color_elo = data['color_elo']
        self.color_rank = data['color_rank']
        self.color_win_rate = data['color_win_rate']
        self.color_wins = data['color_wins']
        self.color_losses = data['color_losses']


class AoE2Layout:
    """Settings for the AoE2 layout"""

    def __init__(self, ):
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
        self.configuration: AoE2ConfigurationLayout = AoE2ConfigurationLayout()  # configuration layout
        self.build_order: AoE2BuildOrderLayout = AoE2BuildOrderLayout()  # build order layout
        self.match_data: AoE2MatchDataLayout = AoE2MatchDataLayout()  # match data layout

    def to_dict(self):
        """Convert content to dictionary

        Returns
        -------
        dictionary data
        """
        data = dict()
        data['opacity'] = self.opacity
        data['upper_right_position'] = self.upper_right_position
        data['border_size'] = self.border_size
        data['vertical_spacing'] = self.vertical_spacing
        data['horizontal_spacing'] = self.horizontal_spacing
        data['font_police'] = self.font_police
        data['scaling'] = self.scaling
        data['font_size'] = self.font_size
        data['color_default'] = self.color_default
        data['color_background'] = self.color_background
        data['action_button_size'] = self.action_button_size
        data['action_button_spacing'] = self.action_button_spacing
        data['configuration'] = self.configuration.to_dict()
        data['build_order'] = self.build_order.to_dict()
        data['match_data'] = self.match_data.to_dict()
        return data

    def from_dict(self, data):
        """Update content from dictionary

        Parameters
        ----------
        data    dictionary data
        """
        self.opacity = data['opacity']
        self.upper_right_position = data['upper_right_position']
        self.border_size = data['border_size']
        self.vertical_spacing = data['vertical_spacing']
        self.horizontal_spacing = data['horizontal_spacing']
        self.font_police = data['font_police']
        self.scaling = data['scaling']
        self.font_size = data['font_size']
        self.color_default = data['color_default']
        self.color_background = data['color_background']
        self.action_button_size = data['action_button_size']
        self.action_button_spacing = data['action_button_spacing']
        self.configuration.from_dict(data['configuration'])
        self.build_order.from_dict(data['build_order'])
        self.match_data.from_dict(data['match_data'])


class AoE2Images:
    """Settings for the AoE2 images"""

    def __init__(self, ):
        """Constructor"""
        self.wood: str = 'resource/Aoe2de_wood.png'  # wood resource
        self.food: str = 'resource/Aoe2de_food.png'  # food resource
        self.gold: str = 'resource/Aoe2de_gold.png'  # gold resource
        self.stone: str = 'resource/Aoe2de_stone.png'  # stone resource
        self.villager: str = 'resource/MaleVillDE_alpha.png'  # villager icon
        self.game_icon: str = 'icon/salamander_sword_shield.ico'  # game overlay icon
        self.age_unknown: str = 'age/AgeUnknown.png'  # unknown age image
        self.age_1: str = 'age/DarkAgeIconDE_alpha.png'  # first age image (Dark Age)
        self.age_2: str = 'age/FeudalAgeIconDE_alpha.png'  # second age image (Feudal Age)
        self.age_3: str = 'age/CastleAgeIconDE_alpha.png'  # third age image (Castle Age)
        self.age_4: str = 'age/ImperialAgeIconDE_alpha.png'  # fourth age image (Imperial Age)
        self.next_panel: str = 'action_button/to_end.png'  # go to the next next_panel
        self.build_order_previous_step: str = 'action_button/previous.png'  # go to previous step in the build order
        self.build_order_next_step: str = 'action_button/next.png'  # go to next step in the build order
        self.quit: str = 'action_button/leave.png'  # quit the overlay
        self.save: str = 'action_button/save.png'  # save the settings
        self.load: str = 'action_button/load.png'  # load the settings
        self.time: str = 'icon/time.png'  # time for build order

    def to_dict(self):
        """Convert content to dictionary

        Returns
        -------
        dictionary data
        """
        data = dict()
        data['wood'] = self.wood
        data['food'] = self.food
        data['gold'] = self.gold
        data['stone'] = self.stone
        data['villager'] = self.villager
        data['game_icon'] = self.game_icon
        data['age_unknown'] = self.age_unknown
        data['age_1'] = self.age_1
        data['age_2'] = self.age_2
        data['age_3'] = self.age_3
        data['age_4'] = self.age_4
        data['next_panel'] = self.next_panel
        data['build_order_previous_step'] = self.build_order_previous_step
        data['build_order_next_step'] = self.build_order_next_step
        data['quit'] = self.quit
        data['save'] = self.save
        data['load'] = self.load
        data['time'] = self.time
        return data

    def from_dict(self, data):
        """Update content from dictionary

        Parameters
        ----------
        data    dictionary data
        """
        self.wood = data['wood']
        self.food = data['food']
        self.gold = data['gold']
        self.stone = data['stone']
        self.villager = data['villager']
        self.game_icon = data['game_icon']
        self.age_unknown = data['age_unknown']
        self.age_1 = data['age_1']
        self.age_2 = data['age_2']
        self.age_3 = data['age_3']
        self.age_4 = data['age_4']
        self.next_panel = data['next_panel']
        self.build_order_previous_step = data['build_order_previous_step']
        self.build_order_next_step = data['build_order_next_step']
        self.quit = data['quit']
        self.save = data['save']
        self.load = data['load']
        self.time = data['time']


class AoE2Hotkeys:
    """Settings for the AoE2 hotkeys"""

    def __init__(self, ):
        """Constructor"""
        self.enter: str = 'Return'  # enter selection key
        self.select_next_build_order: str = 'Tab'  # select the next build order
        self.next_panel: str = '<ctrl>+<alt>+q'  # select the next panel
        self.show_hide: str = '<ctrl>+<alt>+w'  # show/hide the application
        self.build_order_previous_step: str = '<ctrl>+<alt>+e'  # go to the previous build order step
        self.build_order_next_step: str = '<ctrl>+<alt>+r'  # go to the next build order step

    def to_dict(self):
        """Convert content to dictionary

        Returns
        -------
        dictionary data
        """
        data = dict()
        data['enter'] = self.enter
        data['select_next_build_order'] = self.select_next_build_order
        data['next_panel'] = self.next_panel
        data['show_hide'] = self.show_hide
        data['build_order_previous_step'] = self.build_order_previous_step
        data['build_order_next_step'] = self.build_order_next_step
        return data

    def from_dict(self, data):
        """Update content from dictionary

        Parameters
        ----------
        data    dictionary data
        """
        self.enter = data['enter']
        self.select_next_build_order = data['select_next_build_order']
        self.next_panel = data['next_panel']
        self.show_hide = data['show_hide']
        self.build_order_previous_step = data['build_order_previous_step']
        self.build_order_next_step = data['build_order_next_step']


class AoE2OverlaySettings:
    """Settings for the AoE2 overlay"""

    def __init__(self):
        """Constructor"""
        self.title: str = 'AoEII Overlay'  # application title

        self.username: str = ''  # username

        self.mouse_call_ms = 20  # interval between 2 calls related to mouse motion [ms]
        self.match_data_call_ms = 10000  # interval between 2 calls related to match data [ms]

        # timeout for URL requests [s]
        self.url_timeout = 10

        # layout
        self.layout = AoE2Layout()

        # images
        self.images = AoE2Images()

        # hotkeys
        self.hotkeys = AoE2Hotkeys()

    def to_dict(self):
        """Convert content to dictionary

        Returns
        -------
        dictionary data
        """
        data = dict()
        data['title'] = self.title
        data['username'] = self.username
        data['mouse_call_ms'] = self.mouse_call_ms
        data['match_data_call_ms'] = self.match_data_call_ms
        data['url_timeout'] = self.url_timeout
        data['layout'] = self.layout.to_dict()
        data['images'] = self.images.to_dict()
        data['hotkeys'] = self.hotkeys.to_dict()
        return data

    def from_dict(self, data):
        """Update content from dictionary

        Parameters
        ----------
        data    dictionary data
        """
        self.title = data['title']
        self.username = data['username']
        self.mouse_call_ms = data['mouse_call_ms']
        self.match_data_call_ms = data['match_data_call_ms']
        self.url_timeout = data['url_timeout']
        self.layout.from_dict(data['layout'])
        self.images.from_dict(data['images'])
        self.hotkeys.from_dict(data['hotkeys'])


if __name__ == '__main__':
    aoe2_settings_name = 'aoe2_settings.json'

    settings_1 = AoE2OverlaySettings()
    with open(aoe2_settings_name, 'w') as f:
        f.write(json.dumps(settings_1.to_dict(), sort_keys=False, indent=4))

    settings_2 = AoE2OverlaySettings()
    with open(aoe2_settings_name, 'r') as f:
        dict_data = json.load(f)
        settings_2.from_dict(dict_data)
