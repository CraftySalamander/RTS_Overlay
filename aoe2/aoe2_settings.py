import json
from common.settings_subclass import SettingsSubclass
from common.rts_settings import RTSConfigurationUsernameLayout, RTSLayout, RTSImages, RTSOverlaySettings


class AoE2MatchDataLayout(SettingsSubclass):
    """Settings for the AoE2 match data display layout"""

    def __init__(self):
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
        self.color_elo_solo_no_win_loss: list = [230, 159, 0]  # 'color_elo_solo' when no win & loss available
        self.color_elo_no_win_loss: list = [86, 180, 233]  # 'color_elo' when no win & loss available
        self.flag_space_no_country: int = 5  # number of spaces when no country flag is visible
        self.color_rank: list = [255, 255, 255]  # RGB color of the player rank
        self.color_win_rate: list = [255, 128, 0]  # RGB color of the win rate
        self.color_wins: list = [51, 255, 153]  # RGB color of the count of wins
        self.color_losses: list = [255, 102, 102]  # RGB color of the count of losses


class AoE2Layout(RTSLayout):
    """Settings for the AoE2 layout"""

    def __init__(self):
        """Constructor"""
        super().__init__()
        self.configuration: RTSConfigurationUsernameLayout = RTSConfigurationUsernameLayout()  # configuration layout
        self.match_data: AoE2MatchDataLayout = AoE2MatchDataLayout()  # match data layout


class AoE2Images(RTSImages):
    """Settings for the AoE2 images"""

    def __init__(self):
        """Constructor"""
        super().__init__()
        self.wood: str = 'resource/Aoe2de_wood.png'  # wood resource
        self.food: str = 'resource/Aoe2de_food.png'  # food resource
        self.gold: str = 'resource/Aoe2de_gold.png'  # gold resource
        self.stone: str = 'resource/Aoe2de_stone.png'  # stone resource
        self.builder: str = 'resource/Aoe2de_hammer.png'  # builder icon
        self.villager: str = 'resource/MaleVillDE_alpha.png'  # villager icon
        self.age_unknown: str = 'age/AgeUnknown.png'  # unknown age image
        self.age_1: str = 'age/DarkAgeIconDE_alpha.png'  # first age image (Dark Age)
        self.age_2: str = 'age/FeudalAgeIconDE_alpha.png'  # second age image (Feudal Age)
        self.age_3: str = 'age/CastleAgeIconDE_alpha.png'  # third age image (Castle Age)
        self.age_4: str = 'age/ImperialAgeIconDE_alpha.png'  # fourth age image (Imperial Age)


class AoE2OverlaySettings(RTSOverlaySettings):
    """Settings for the AoE2 overlay"""

    def __init__(self):
        """Constructor"""
        super().__init__()

        self.match_data_call_ms = 10000  # interval between 2 calls related to match data [ms]

        self.url_timeout = 10  # timeout for URL requests [s]

        self.title: str = 'AoEII Overlay'  # application title

        self.username: str = ''  # username

        # how to fetch match data: 'aoe2.net', 'aoe2insights.com' or '' for no match data
        self.fetch_match_data = ''

        # layout
        self.layout = AoE2Layout()

        # images
        self.images = AoE2Images()

        # panel to input a build order
        self.panel_build_order.edit_init_text = \
            'Replace this text by any build order in correct JSON format, then click on \'Add build order\'.' \
            '\n\nWrite your build order as JSON format, following the guidelines in Readme.md ' \
            'or adapt one of the existing ones.' \
            '\n\nYou can find all your saved build orders as JSON files by clicking on \'Open build orders folder\'.' \
            '\nTo remove any build order, just delete the corresponding file and use \'reload settings\' ' \
            '(or relaunch the overlay).'


if __name__ == '__main__':
    aoe2_settings_name = 'aoe2_settings.json'

    settings_1 = AoE2OverlaySettings()
    with open(aoe2_settings_name, 'w') as f:
        f.write(json.dumps(settings_1.to_dict(), sort_keys=False, indent=4))

    settings_2 = AoE2OverlaySettings()
    with open(aoe2_settings_name, 'rb') as f:
        dict_data = json.load(f)
        settings_2.from_dict(dict_data)
