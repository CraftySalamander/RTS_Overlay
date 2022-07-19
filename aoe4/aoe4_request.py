import time
from threading import Thread, Event

from common.url_request import read_json_url

# name translation for the civilization
aoe4_civ_name = {
    'english': 'English',
    'french': 'French',
    'delhi_sultanate': 'Delhi Sultanate',
    'mongols': 'Mongols',
    'holy_roman_empire': 'Holy Roman Empire',
    'chinese': 'Chinese',
    'abbasid_dynasty': 'Abbasid Dynasty',
    'rus': 'Rus'
}


class PlayerData:
    """Data related to a single player"""

    def __init__(self):
        """Constructor"""
        self.profile_id = None  # profile ID
        self.name = None  # name of the player
        self.country = None  # country
        self.elo = None  # ELO of the selected mode
        self.elo_solo = None  # ELO of the single player corresponding mode
        self.rank = None  # rank of the selected mode
        self.rank_class = None  # rank class on the ranked ladder
        self.wins = None  # wins of the selected mode
        self.losses = None  # losses of the selected mode
        self.win_rate = None  # win rate of the selected mode
        self.color = None  # color ID of the player
        self.team = None  # team ID of the player
        self.civ = None  # civilization of the player


class MatchData:
    """Data related to a single match"""

    def __init__(self, warnings: list = None):
        """Constructor

        Parameters
        ----------
        warnings    list of warnings, None if no warning
        """
        self.match_id = None  # ID of the match
        self.map_name = 'Unknown map'  # name of the map
        self.players = []  # list of players data as 'PlayerData'
        self.all_data_found = False  # true if all the data was found
        self.warnings = []
        if warnings is not None:  # list of warnings
            self.warnings = warnings


def get_player_profile_id(search_input: str, timeout: int):
    """Get the profile ID for a player

    Parameters
    ----------
    search_input    input to search: profile ID or player name
    timeout         timeout for the url request

    Returns
    -------
    ID as int, -1 if not found
    """
    if isinstance(search_input, int) or search_input.isnumeric():  # search with profile ID
        data = read_json_url(f'https://aoe4world.com/api/v0/players/{search_input}', timeout)
        if (data is not None) and ('name' in data):
            return int(search_input)

    # search with name
    data = read_json_url(f'https://aoe4world.com/api/v0/players/search?query={search_input}&exact=true', timeout)
    if (data is not None) and ('players' in data) and (len(data['players']) >= 1):
        if 'profile_id' in data['players'][0]:
            return int(data['players'][0]['profile_id'])

    return -1  # profile ID not found


def get_aoe4_last_match(profile_id: int, timeout: int):
    """Get the last match for an AoE4 player

    Parameters
    ----------
    profile_id    profile ID
    timeout       timeout for the url request

    Returns
    -------
    dictionary with the content, None if issue occurred
    """
    data = read_json_url(f'https://aoe4world.com/api/v0/players/{profile_id}/games?limit=1', timeout)
    if (data is not None) and ('games' in data) and (len(data['games']) >= 1):
        return data['games'][0]
    else:
        return None


def get_player_stats(data: PlayerData, match_type: str, get_stats: bool,
                     get_elo_solo: bool, timeout: int):
    """Get the statistics for a single player

    Parameters
    ----------
    data                 data of the player (potentially partly filled), will be filled with additional data
    match_type           type of match: 'rm_1v1', 'qm_1v1', 'qm_2v2', 'qm_3v3', 'qm_4v4'
    get_stats            True to get the full ELO-related statistics, False to only request name and country
    get_elo_solo         True to get the ELO as solo match
    timeout              timeout for the url request
    """
    assert match_type in ['rm_1v1', 'qm_1v1', 'qm_2v2', 'qm_3v3', 'qm_4v4']
    player_search = read_json_url(f'https://aoe4world.com/api/v0/players/search?query={data.name}&exact=true', timeout)

    if ('players' in player_search) and (len(player_search['players']) >= 1):
        player = player_search['players'][0]

        if ('leaderboards' in player) and (match_type in player['leaderboards']):
            leaderboard = player['leaderboards'][match_type]

            if get_stats:  # ELO-related statistics
                if data.elo is None:
                    data.elo = leaderboard['rating']
                if data.rank is None:
                    data.rank = leaderboard['rank']
                if data.rank_class is None:
                    data.rank_class = leaderboard['rank_level']
                if data.wins is None:
                    data.wins = leaderboard['wins_count']
                if data.losses is None:
                    data.losses = leaderboard['losses_count']

                if (data.wins is not None) and (data.losses is not None):
                    denominator = data.wins + data.losses
                    data.win_rate = round(100.0 * data.wins / denominator, 1) if (denominator >= 1) else 0.0

            if get_elo_solo:  # ELO as solo match ELO
                if data.elo_solo is None:
                    data.elo_solo = leaderboard['rating']


def get_match_data(stop_event: Event, search_input: str, timeout: int,
                   last_match_id: str = '', last_data_found: bool = False) -> MatchData:
    """Get all the data for a match

    Parameters
    ----------
    stop_event         set it to True to stop the thread
    search_input       input to search: profile ID or player name
    timeout            timeout for the url request
    last_match_id      last match ID for which data was retrieved
    last_data_found    True if all the data was found for the last retrieve call

    Returns
    -------
    'MatchData' data
    """
    try:
        data = MatchData()

        # player profile ID
        player_profile_id = get_player_profile_id(search_input, timeout)
        if player_profile_id < 0:  # check valid profile ID
            msg = f'Player profile ID not found for user \'{search_input}\'.'
            print(msg)
            return MatchData([msg])

        if stop_event.wait(0):  # stop if requested
            return MatchData(['Search stop requested.'])

        # corresponding last match
        last_match = get_aoe4_last_match(player_profile_id, timeout)

        if stop_event.wait(0):  # stop if requested
            return MatchData(['Search stop requested.'])

        # no update if still the same match or invalid match ID
        data.match_id = last_match['game_id']
        if (data.match_id is None) or (last_data_found and (data.match_id == last_match_id)):
            if data.match_id is None:
                data.warnings.append('Last match not found for user \'{search_input}\'.')
            data.match_id = None
            return data

        players = []
        for team_id, team in enumerate(last_match['teams']):
            for player in team:
                if 'player' in player:
                    player = player['player']
                    if 'team' not in player:
                        player['team'] = team_id
                    players.append(player)

        # find type of match
        selected_match_type = last_match['kind']

        if selected_match_type not in ['rm_1v1', 'qm_1v1', 'qm_2v2', 'qm_3v3', 'qm_4v4']:
            selected_match_type = 'qm_1v1'
            print(f'Unknown match type, using \'{selected_match_type}\'.')

        # find selected map
        data.map_name = last_match['map']

        # fill with data already available for the players
        for player in players:
            player_data = PlayerData()

            # main player details
            player_data.profile_id = player['profile_id']
            player_data.name = player['name']

            # player current match data
            player_data.team = player['team']
            player_data.civ = aoe4_civ_name[player['civilization']] if (
                    player['civilization'] in aoe4_civ_name) else 'Unknown civ'

            data.players.append(player_data)  # add to the list of players

        # refine data collection for the different players
        all_players_full_data_found = True  # assuming all data found
        for player_data in data.players:  # loop on the players data
            if stop_event.wait(0):  # stop if requested
                return MatchData(['Search stop requested.'])

            # get stats for the currently selected match
            try:
                get_player_stats(data=player_data, match_type=selected_match_type,
                                 get_stats=True, get_elo_solo=False, timeout=timeout)
            except:
                print(f'Could not find the full data for player \'{player_data.name}\'.')
                all_players_full_data_found = False
                continue

            if stop_event.wait(0):  # stop if requested
                return MatchData(['Search stop requested.'])

            # get solo ELO
            try:
                if selected_match_type in ['qm_2v2', 'qm_3v3', 'qm_4v4']:
                    get_player_stats(data=player_data, match_type='qm_1v1',
                                     get_stats=False, get_elo_solo=True, timeout=timeout)
            except:
                print(f'Could not find the solo ELO for player \'{player_data.name}\'.')
                all_players_full_data_found = False
                continue

            if stop_event.wait(0):  # stop if requested
                return MatchData(['Search stop requested.'])

        def team_color_sorting(elem: PlayerData, color_count: int = 8, invert_teams: bool = True):
            """Sorting key used for the players data, based on team and color

            Parameters
            ----------
            elem            'PlayerData' element to analyze
            color_count     number of colors
            invert_teams    True to invert the teams order

            Returns
            -------
            key value for sorting
            """
            team_value = elem.team if (elem.team is not None) else 0
            color_value = elem.color if (elem.color is not None) else 0
            if invert_teams:
                return -team_value * color_count + color_value
            else:
                return team_value * color_count + color_value

        data.players.sort(key=team_color_sorting)  # sorting the players

        data.match_id = last_match['game_id']  # match ID

        data.all_data_found = all_players_full_data_found  # all data found

        print(f'New game match data loaded for user {search_input}.')
        return data

    except:
        print('Some issue occurred while trying to get the match data.')
        return MatchData(['Failed to fetch the match data.'])


def get_match_data_list(output: list, stop_event: Event, search_input: str, timeout: int,
                        last_match_id: str = '', last_data_found: bool = False):
    """Get all the data for a match, and add it to a list

    Parameters
    ----------
    output             output will be added (append) to this list: 'MatchData' data
    stop_event         set it to True to stop the thread
    search_input       input to search: profile ID or player name
    timeout            timeout for the url request
    last_match_id      last match ID for which data was retrieved
    last_data_found    True if all the data was found for the last retrieve call
    """
    response = get_match_data(stop_event, search_input, timeout, last_match_id, last_data_found)
    output.append(response)


def get_match_data_threading(output: list, stop_event: Event, search_input: str, timeout: int,
                             last_match_id: str = '', last_data_found: bool = False):
    """Get all the data for a match, using threading

    Parameters
    ----------
    output             output will be added (append) to this list: 'MatchData' data
    stop_event         set it to True to stop the thread
    search_input       input to search: profile ID or player name
    timeout            timeout for the url request
    last_match_id      last match ID for which data was retrieved
    last_data_found    True if all the data was found for the last retrieve call

    Returns
    -------
    thread ID
    """
    x = Thread(target=get_match_data_list,
               args=(output, stop_event, search_input, timeout, last_match_id, last_data_found))
    x.start()
    return x


if __name__ == '__main__':
    max_time_request = 20  # maximal time for url request [s]
    player_name = 'Salamaaaaander'  # name to look for

    stop_flag = Event()  # stop event: setting to True to stop the thread
    out_data = []
    thread_id = get_match_data_threading(out_data, stop_event=stop_flag, search_input=player_name,
                                         timeout=max_time_request)

    start_time = time.time()
    close_time = 40.0  # after this time, the thread will be closed [s]

    while len(out_data) == 0:
        print('waiting')
        time.sleep(1.0)  # sleep every 1 s
        if time.time() - start_time > close_time:  # stop the thread if too long
            stop_flag.set()
            thread_id.join()
    print('Match ID:', out_data[0].match_id)
    print('Map name:', out_data[0].map_name)
    for cur_player in out_data[0].players:
        print(f'Name: {cur_player.name} | Civ: {cur_player.civ} | Elo: {cur_player.elo} '
              f'| Win%: {cur_player.win_rate} | Rank class: {cur_player.rank_class}')
