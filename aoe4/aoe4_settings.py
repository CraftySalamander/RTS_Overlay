import json
from common.settings_subclass import SettingsSubclass
from common.rts_settings import RTSConfigurationUsernameLayout, RTSLayout, RTSImages, RTSOverlaySettings


class AoE4ConfigurationLayout(RTSConfigurationUsernameLayout):
    """Settings for the AoE4 configuration layout"""

    def __init__(self):
        """Constructor"""
        super().__init__()
        self.flag_select_size: list = [32, 24]  # size of the flag for civilization selection


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


class AoE4Layout(RTSLayout):
    """Settings for the AoE4 layout"""

    def __init__(self):
        """Constructor"""
        super().__init__()
        self.configuration: AoE4ConfigurationLayout = AoE4ConfigurationLayout()  # configuration layout
        self.match_data: AoE4MatchDataLayout = AoE4MatchDataLayout()  # match data layout


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

        self.match_data_call_ms = 10000  # interval between 2 calls related to match data [ms]

        self.url_timeout = 20  # timeout for URL requests [s]

        self.title: str = 'AoEIV Overlay'  # application title

        self.username: str = ''  # username

        # layout
        self.layout = AoE4Layout()

        # images
        self.images = AoE4Images()

        # panel to input a build order
        self.panel_build_order.build_order_website = ['age4builder.com', 'https://age4builder.com']
        self.panel_build_order.edit_init_text = \
            'Replace this text by any build order in correct JSON format (see Readme.md), ' \
            'then click on \'Add build order\'.' \
            '\n\nYou can get many build orders with the requested format from age4builder.com ' \
            '(use the corresponding button below).' \
            '\nAfter selecting a build order, click on the salamander icon (on age4builder.com), ' \
            'then paste it here.' \
            '\nYou can also manually write your build order as JSON format, following the guidelines in Readme.md ' \
            'or adapt one of the existing ones.' \
            '\n\nYou can find all your saved build orders as JSON files by clicking on \'Open build orders folder\'.' \
            '\nTo remove any build order, just delete the corresponding file and use \'reload settings\' ' \
            '(or relaunch the overlay).'


if __name__ == '__main__':
    aoe4_settings_name = 'aoe4_settings.json'

    settings_1 = AoE4OverlaySettings()
    with open(aoe4_settings_name, 'w') as f:
        f.write(json.dumps(settings_1.to_dict(), sort_keys=False, indent=4))

    settings_2 = AoE4OverlaySettings()
    with open(aoe4_settings_name, 'rb') as f:
        dict_data = json.load(f)
        settings_2.from_dict(dict_data)
