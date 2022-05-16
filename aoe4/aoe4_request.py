import time
from threading import Thread, Event

from common.url_request import read_json_url


class MatchType:
    """Type of match"""

    def __init__(self, event_flag: bool, leaderboard_id: int, player_count: int):
        """Constructor
        
        Parameters
        ----------
        event_flag        True for match belonging to an event (e.g. Ranked Season)
        leaderboard_id    ID of the leaderboard
        player_count      number of players for this match type
        """
        self.event_flag = event_flag  # True for match belonging to an event (e.g. Ranked Season)
        self.leaderboard = 'event_leaderboard' if event_flag else 'leaderboard'  # leaderboard name
        self.leaderboard_id = leaderboard_id  # ID of the leaderboard
        self.player_count = player_count  # number of players for this match type


# list of available matches
match_type_list = dict()
match_type_list['Quick Match (1v1)'] = MatchType(event_flag=False, leaderboard_id=17, player_count=2)
match_type_list['Quick Match (2v2)'] = MatchType(event_flag=False, leaderboard_id=18, player_count=4)
match_type_list['Quick Match (3v3)'] = MatchType(event_flag=False, leaderboard_id=19, player_count=6)
match_type_list['Quick Match (4v4)'] = MatchType(event_flag=False, leaderboard_id=20, player_count=8)
match_type_list['Festival of Ages (Season 1)'] = MatchType(event_flag=True, leaderboard_id=1, player_count=2)


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


def get_aoe4_parameters(timeout: int):
    """Get the AoE4 parameters

    Parameters
    ----------
    timeout    timeout for the url request

    Returns
    -------
    dictionary with the content, None if issue occurred
    """
    return read_json_url('https://aoeiv.net/api/strings?game=aoe4&language=en', timeout)


def get_aoe4_parameters_list(output: list, timeout: int):
    """Get the AoE4 parameters, and add them to a list

    Parameters
    ----------
    output     output will be added (append) to this list: dictionary with the game parameters
    timeout    timeout for the url request
    """
    response = get_aoe4_parameters(timeout)
    output.append(response)


def get_aoe4_parameters_threading(output: list, timeout: int):
    """Get the AoE4 parameters, using threading

    Parameters
    ----------
    output     output will be added (append) to this list: dictionary with the game parameters
    timeout    timeout for the url request

    Returns
    -------
    thread ID
    """
    x = Thread(target=get_aoe4_parameters_list, args=(output, timeout))
    x.start()
    return x


def get_aoe4_leaderboard(event_leaderboard: bool, leaderboard_id: int, timeout: int,
                         profile_id: int = None, steam_id: int = None, name: str = None):
    """Get the AoE4 leaderboard for a player

    Parameters
    ----------
    event_leaderboard    True for leaderboard linked to an event (e.g. ranked season), False for Quick Match
    leaderboard_id       ID of the leaderboard type
    timeout              timeout for the url request
    profile_id           profile ID, None to use another field
    steam_id             Steam ID, None to use another field
    name                 player name, None to use another field

    Returns
    -------
    dictionary with the content, None if issue occurred
    """
    assert (profile_id is not None) or (steam_id is not None) or (name is not None)
    leaderboard_name = 'event_leaderboard_id' if event_leaderboard else 'leaderboard_id'
    url = f'https://aoeiv.net/api/leaderboard?game=aoe4&{leaderboard_name}={leaderboard_id}&start=1&count=1'
    if profile_id is not None:
        url += f'&profile_id={profile_id}'
    elif steam_id is not None:
        url += f'&steam_id={steam_id}'
    else:
        url += f'&search={name}'
    return read_json_url(url, timeout)


def get_player_profile_id(search_input: str, timeout: int, steam_threshold: int = 10):
    """Get the profile ID for a player

    Parameters
    ----------
    search_input       input to search: profile ID, steam ID or player name
    timeout            timeout for the url request
    steam_threshold    search_input integer length above this threshold means steam ID, otherwise profile ID

    Returns
    -------
    ID as int, -1 if not found
    """
    for key, value in match_type_list.items():
        if search_input.isnumeric():  # profile ID or steam ID
            search_int = int(search_input)
            if len(search_input) > steam_threshold:  # steam ID
                leaderboard_out = get_aoe4_leaderboard(
                    event_leaderboard=value.event_flag, leaderboard_id=value.leaderboard_id, timeout=timeout,
                    steam_id=search_int)
            else:  # profile ID
                leaderboard_out = get_aoe4_leaderboard(
                    event_leaderboard=value.event_flag, leaderboard_id=value.leaderboard_id, timeout=timeout,
                    profile_id=search_int)
        else:  # name search
            leaderboard_out = get_aoe4_leaderboard(
                event_leaderboard=value.event_flag, leaderboard_id=value.leaderboard_id, timeout=timeout,
                name=search_input)

        # check if profile is found
        if (leaderboard_out is not None) and (len(leaderboard_out['leaderboard']) > 0):
            profile_id = leaderboard_out['leaderboard'][0]['profile_id']
            if profile_id >= 0:
                return profile_id

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
    data = read_json_url(f'https://aoeiv.net/api/player/matches?game=aoe4&profile_id={profile_id}&count=1', timeout)
    if (data is not None) and (len(data) > 0):
        return data[0]
    else:
        return None


def get_player_stats(data: PlayerData, event_leaderboard: bool, leaderboard_id: int, get_stats: bool,
                     get_elo_solo: bool, timeout: int):
    """Get the statistics for a single player

    Parameters
    ----------
    data                 data of the player (potentially partly filled), will be filled with additional data
    event_leaderboard    True for leaderboard linked to an event (e.g. ranked season), False for Quick Match
    leaderboard_id       ID of the leaderboard type
    get_stats            True to get the full ELO-related statistics, False to only request name and country
    get_elo_solo         True to get the ELO as solo match
    timeout              timeout for the url request
    """
    player_leaderboard = get_aoe4_leaderboard(event_leaderboard=event_leaderboard, leaderboard_id=leaderboard_id,
                                              profile_id=data.profile_id, timeout=timeout)
    if len(player_leaderboard['leaderboard']) == 1:
        leaderboard = player_leaderboard['leaderboard'][0]
        if data.name is None:
            data.name = leaderboard['name']
        if data.country is None:
            data.country = leaderboard['country']

        if get_stats:  # ELO-related statistics
            if data.elo is None:
                data.elo = leaderboard['rating']
            if data.rank is None:
                data.rank = leaderboard['rank']
            if data.wins is None:
                data.wins = leaderboard['wins']
            if data.losses is None:
                data.losses = leaderboard['losses']

            if (data.wins is not None) and (data.losses is not None):
                denominator = data.wins + data.losses
                data.win_rate = round(100.0 * data.wins / denominator, 1) if (denominator >= 1) else 0.0

        if get_elo_solo:  # ELO as solo match ELO
            if data.elo_solo is None:
                data.elo_solo = leaderboard['rating']


def get_rank_from_elo(elo: int):
    """Get the rank class from the player ELO

    Parameters
    ----------
    elo    ELO of the player

    Returns
    -------
    rank class, None if unknown
    """
    if isinstance(elo, int):
        if elo < 400:
            return 'bronze_1'
        elif elo < 600:
            return 'bronze_2'
        elif elo < 770:
            return 'bronze_3'
        elif elo < 800:
            return 'silver_1'
        elif elo < 840:
            return 'silver_2'
        elif elo < 880:
            return 'silver_3'
        elif elo < 930:
            return 'gold_1'
        elif elo < 980:
            return 'gold_2'
        elif elo < 1015:
            return 'gold_3'
        elif elo < 1050:
            return 'platinum_1'
        elif elo < 1090:
            return 'platinum_2'
        elif elo < 1130:
            return 'platinum_3'
        elif elo < 1230:
            return 'diamond_1'
        elif elo < 1300:
            return 'diamond_2'
        elif elo < 1400:
            return 'diamond_3'
        elif elo < 1500:
            return 'conqueror_1'
        elif elo < 1600:
            return 'conqueror_2'
        else:
            return 'conqueror_3'
    else:
        return None


def get_match_data(stop_event: Event, search_input: str, aoe4_parameters: dict, timeout: int,
                   last_match_id: str = '', last_data_found: bool = False) -> MatchData:
    """Get all the data for a match

    Parameters
    ----------
    stop_event         set it to True to stop the thread
    search_input       input to search: profile ID, steam ID or player name
    aoe4_parameters    AoE4 parameters as obtained from 'get_aoe4_parameters'
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
        if (player_profile_id is None) or (player_profile_id < 0):  # check valid profile ID
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
        data.match_id = last_match['match_id']
        if (data.match_id is None) or (last_data_found and (data.match_id == last_match_id)):
            if data.match_id is None:
                data.warnings.append('Last match not found for user \'{search_input}\'.')
            data.match_id = None
            return data

        players = last_match['players']  # get the players
        players_count = len(players)

        # find type of match
        selected_match_type = 'Unknown'
        if players_count == 2:  # solo game
            if 'rating_type_id' in last_match:
                if last_match['rating_type_id'] == 15:  # Quick Match
                    selected_match_type = 'Quick Match (1v1)'
                else:  # Ranked Season
                    selected_match_type = 'Festival of Ages (Season 1)'
        else:  # team game
            for key, value in match_type_list.items():
                if value.player_count == players_count:
                    selected_match_type = key

        if selected_match_type == 'Unknown':
            selected_match_type = 'Quick Match (1v1)'
            print(f'Unknown match type, using \'{selected_match_type}\'.')

        # find selected map
        if 'map_type' in last_match:
            for map_type in aoe4_parameters['map_type']:
                if map_type['id'] == last_match['map_type']:
                    data.map_name = map_type['string']
                    break

        civ_list = aoe4_parameters['civ']  # list of civilizations

        # fill with data already available for the players
        for player in players:
            player_data = PlayerData()

            # main player details
            player_data.profile_id = player['profile_id']
            player_data.name = player['name']
            player_data.country = player['country']

            # player current match data
            player_data.color = player['color']
            player_data.team = player['team']
            player_civ_id = player['civ']
            player_data.civ = None

            for civ in civ_list:
                if civ['id'] == player_civ_id:
                    player_data.civ = civ['string']

            data.players.append(player_data)  # add to the list of players

        # refine data collection for the different players
        all_players_full_data_found = True  # assuming all data found
        for player_data in data.players:  # loop on the players data
            if stop_event.wait(0):  # stop if requested
                return MatchData(['Search stop requested.'])

            # get stats for the currently selected match
            try:
                get_player_stats(data=player_data, event_leaderboard=match_type_list[selected_match_type].event_flag,
                                 leaderboard_id=match_type_list[selected_match_type].leaderboard_id,
                                 get_stats=True, get_elo_solo=False, timeout=timeout)
            except:
                name = player_data['name'] if ('name' in player_data) else 'Unknown'
                print(f'Could not find the full data for player \'{name}\'.')
                all_players_full_data_found = False
                continue

            if stop_event.wait(0):  # stop if requested
                return MatchData(['Search stop requested.'])

            # get solo ELO
            try:
                if match_type_list[selected_match_type].player_count > 2:
                    get_player_stats(data=player_data, event_leaderboard=False,
                                     leaderboard_id=match_type_list['Quick Match (1v1)'].leaderboard_id,
                                     get_stats=False, get_elo_solo=True, timeout=timeout)
            except:
                name = player_data['name'] if ('name' in player_data) else 'Unknown'
                print(f'Could not find the solo ELO for player \'{name}\'.')
                all_players_full_data_found = False
                continue

            # get rank class
            if match_type_list[selected_match_type].event_flag and (
                    match_type_list[selected_match_type].player_count == 2):
                player_data.rank_class = get_rank_from_elo(player_data.elo)

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

        data.match_id = last_match['match_id']  # match ID

        data.all_data_found = all_players_full_data_found  # all data found

        print(f'New game match data loaded for user {search_input}.')
        return data

    except:
        print('Some issue occurred while trying to get the match data.')
        return MatchData(['Failed to fetch the match data.'])


def get_match_data_list(output: list, stop_event: Event, search_input: str, aoe4_parameters: dict, timeout: int,
                        last_match_id: str = '', last_data_found: bool = False):
    """Get all the data for a match, and add it to a list

    Parameters
    ----------
    output             output will be added (append) to this list: 'MatchData' data
    stop_event         set it to True to stop the thread
    search_input       input to search: profile ID, steam ID or player name
    aoe4_parameters    AoE4 parameters as obtained from 'get_aoe4_parameters'
    timeout            timeout for the url request
    last_match_id      last match ID for which data was retrieved
    last_data_found    True if all the data was found for the last retrieve call
    """
    response = get_match_data(stop_event, search_input, aoe4_parameters, timeout, last_match_id, last_data_found)
    output.append(response)


def get_match_data_threading(output: list, stop_event: Event, search_input: str, aoe4_parameters: dict, timeout: int,
                             last_match_id: str = '', last_data_found: bool = False):
    """Get all the data for a match, using threading

    Parameters
    ----------
    output             output will be added (append) to this list: 'MatchData' data
    stop_event         set it to True to stop the thread
    search_input       input to search: profile ID, steam ID or player name
    aoe4_parameters    AoE4 parameters as obtained from 'get_aoe4_parameters'
    timeout            timeout for the url request
    last_match_id      last match ID for which data was retrieved
    last_data_found    True if all the data was found for the last retrieve call

    Returns
    -------
    thread ID
    """
    x = Thread(target=get_match_data_list,
               args=(output, stop_event, search_input, aoe4_parameters, timeout, last_match_id, last_data_found))
    x.start()
    return x


if __name__ == '__main__':
    max_time_request = 20  # maximal time for url request [s]
    player_name = 'Beastyqt'  # name to look for

    # obtain AoE4 parameters
    aoe4_params = get_aoe4_parameters(timeout=max_time_request)
    print('AoE4 parameters:', aoe4_params)

    stop_flag = Event()  # stop event: setting to True to stop the thread
    out_data = []
    thread_id = get_match_data_threading(out_data, stop_event=stop_flag, search_input=player_name,
                                         aoe4_parameters=aoe4_params, timeout=max_time_request)

    start_time = time.time()
    close_time = 30.0  # after this time, the thread will be closed [s]

    while len(out_data) == 0:
        print('waiting')
        time.sleep(1.0)  # sleep every 1 s
        if time.time() - start_time > close_time:  # stop the thread if too long
            stop_flag.set()
            thread_id.join()
    print('Match ID:', out_data[0].match_id)
    print('Map name:', out_data[0].map_name)
    for cur_player in out_data[0].players:
        print('Name:', cur_player.name, '| Country:', cur_player.country, '| ELO:', cur_player.elo)
