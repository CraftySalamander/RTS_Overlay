import time
from typing import Union
from threading import Thread, Event

from common.url_request import read_json_url


# ----- AoE2 output data -----

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


def team_color_sorting(elem: PlayerData, color_count: int = 8, invert_teams: bool = True) -> int:
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


# ----- Data from https://aoe2.net -----

def get_aoe2_net_parameters(timeout: int) -> dict:
    """Get the AoE2 parameters from https://aoe2.net

    Parameters
    ----------
    timeout    timeout for the url request

    Returns
    -------
    dictionary with the content, None if issue occurred
    """
    return read_json_url('https://aoe2.net/api/strings?game=aoe2de&language=en', timeout)


def get_aoe2_net_parameters_list(output: list, timeout: int):
    """Get the AoE2 parameters from https://aoe2.net, and add them to a list

    Parameters
    ----------
    output     output will be added (append) to this list: dictionary with the game parameters
    timeout    timeout for the url request
    """
    response = get_aoe2_net_parameters(timeout)
    output.append(response)


def get_aoe2_net_parameters_threading(output: list, timeout: int) -> Thread:
    """Get the AoE2 parameters from https://aoe2.net, using threading

    Parameters
    ----------
    output     output will be added (append) to this list: dictionary with the game parameters
    timeout    timeout for the url request

    Returns
    -------
    thread ID
    """
    x = Thread(target=get_aoe2_net_parameters_list, args=(output, timeout))
    x.start()
    return x


def get_aoe2_net_leaderboard(leaderboard_id: int, timeout: int, profile_id: int = None, steam_id: int = None,
                             name: str = None, players_count: int = 10) -> Union[dict, None]:
    """Get the AoE2 leaderboard for a player, from https://aoe2.net

    Parameters
    ----------
    leaderboard_id    ID of the leaderboard type
    timeout           timeout for the url request
    profile_id        profile ID, None to use another field
    steam_id          Steam ID, None to use another field
    name              player name, None to use another field
    players_count     maximal number of players to look for

    Returns
    -------
    dictionary with the content, None if issue occurred
    """
    assert (profile_id is not None) or (steam_id is not None) or (name is not None)
    url = f'https://aoe2.net/api/leaderboard?game=aoe2de&leaderboard_id={leaderboard_id}&start=1&count={players_count}'
    if profile_id is not None:
        url += f'&profile_id={profile_id}'
    elif steam_id is not None:
        url += f'&steam_id={steam_id}'
    else:
        url += f'&search={name}'

    out_search = read_json_url(url, timeout)

    if 'leaderboard' not in out_search:
        return None

    leaderboard_list = out_search['leaderboard']
    if len(leaderboard_list) == 0:
        return None
    elif len(leaderboard_list) > 1:
        if (profile_id is None) and (steam_id is None):
            out_search['leaderboard'][:] = [x for x in leaderboard_list if (x['name'] == name)]

    return out_search


def get_aoe2_net_player_profile_id(aoe2_net_parameters: dict, search_input: str, timeout: int,
                                   steam_threshold: int = 10) -> int:
    """Get the profile ID for a player, from https://aoe2.net

    Parameters
    ----------
    aoe2_net_parameters    AoE2 parameters obtained using 'get_aoe2_net_parameters'
    search_input           input to search: profile ID, steam ID or player name
    timeout                timeout for the url request
    steam_threshold        search_input integer length above this threshold means steam ID, otherwise profile ID

    Returns
    -------
    ID as int, -1 if not found
    """
    assert 'leaderboard' in aoe2_net_parameters
    for elem in aoe2_net_parameters['leaderboard']:
        if search_input.isnumeric():  # profile ID or steam ID
            search_int = int(search_input)
            if len(search_input) > steam_threshold:  # steam ID
                leaderboard_out = get_aoe2_net_leaderboard(
                    leaderboard_id=elem['id'], timeout=timeout, steam_id=search_int)
            else:  # profile ID
                leaderboard_out = get_aoe2_net_leaderboard(
                    leaderboard_id=elem['id'], timeout=timeout, profile_id=search_int)
        else:  # name search
            leaderboard_out = get_aoe2_net_leaderboard(leaderboard_id=elem['id'], timeout=timeout, name=search_input)

        # check if profile is found
        if leaderboard_out is not None:
            if len(leaderboard_out['leaderboard']) > 0:
                profile_id = leaderboard_out['leaderboard'][0]['profile_id']
                if profile_id >= 0:
                    return profile_id
    return -1  # profile ID not found


def get_aoe2_net_last_match(profile_id: int, timeout: int) -> dict:
    """Get the last match for an AoE2 player, from https://aoe2.net

    Parameters
    ----------
    profile_id    profile ID
    timeout       timeout for the url request

    Returns
    -------
    dictionary with the content, None if issue occurred
    """
    return read_json_url(f'https://aoe2.net/api/player/matches?game=aoe2de&profile_id={profile_id}&count=1', timeout)


def get_aoe2_net_player_stats(data: PlayerData, leaderboard_id: int, get_stats: bool, get_elo_solo: bool, timeout: int):
    """Get the statistics for a single player, from https://aoe2.net

    Parameters
    ----------
    data              data of the player (potentially partly filled), will be filled with additional data
    leaderboard_id    ID of the leaderboard type
    get_stats         True to get the full ELO-related statistics, False to only request name and country
    get_elo_solo      True to get the ELO as solo match
    timeout           timeout for the url request
    """
    if (data.name is None) and (data.profile_id is None):
        return

    player_leaderboard = get_aoe2_net_leaderboard(leaderboard_id=leaderboard_id, profile_id=data.profile_id,
                                                  timeout=timeout)
    if (player_leaderboard is not None) and ('leaderboard' in player_leaderboard) and (
            len(player_leaderboard['leaderboard']) == 1):
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


def get_aoe2_net_match_data(stop_event: Event, search_input: str, timeout: int, aoe2_net_parameters: dict = None,
                            last_match_id: str = '', last_data_found: bool = False) -> MatchData:
    """Get all the data for a match, from https://aoe2.net

    Parameters
    ----------
    stop_event             set it to True to stop the thread
    search_input           input to search: profile ID, steam ID or player name
    timeout                timeout for the url request
    aoe2_net_parameters    AoE2 parameters as obtained from 'get_aoe2_net_parameters', None to re-compute them
    last_match_id          last match ID for which data was retrieved
    last_data_found        True if all the data was found for the last retrieve call

    Returns
    -------
    'MatchData' data
    """
    try:
        data = MatchData()

        # get AoE2 parameters if not provided
        if aoe2_net_parameters is None:
            aoe2_net_parameters = get_aoe2_net_parameters(timeout=timeout)

        if aoe2_net_parameters is None:  # still not found
            return MatchData([
                'Could not fetch the parameters from https://aoe2.net.',
                'In case it takes too long, check if https://aoe2.net is working.'])

        # player profile ID
        player_profile_id = get_aoe2_net_player_profile_id(aoe2_net_parameters, search_input, timeout)
        if (player_profile_id is None) or (player_profile_id < 0):  # check valid profile ID
            return MatchData([f'Player profile ID not found for user \'{search_input}\'.'])

        if stop_event.wait(0):  # stop if requested
            return MatchData(['Search stop requested.'])

        # corresponding last match
        last_match_data = get_aoe2_net_last_match(player_profile_id, timeout)
        last_match = last_match_data[0]

        if stop_event.wait(0):  # stop if requested
            return MatchData(['Search stop requested.'])

        # no update if still the same match or invalid match ID
        data.match_id = last_match['match_id']
        if (data.match_id is None) or (last_data_found and (data.match_id == last_match_id)):
            if data.match_id is None:
                data.warnings.append('Last match not found for user \'{search_input}\'.')
            data.match_id = None
            return data

        # find selected map
        for map_type in aoe2_net_parameters['map_type']:
            if map_type['id'] == last_match['map_type']:
                data.map_name = map_type['string']
                break

        civ_list = aoe2_net_parameters['civ']  # list of civilizations

        # fill with data already available for the players
        players = last_match['players']  # get the players

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

        # get the IDs of the games types
        leaderboard_ids = dict()
        for item in aoe2_net_parameters['leaderboard']:
            leaderboard_ids[item['string']] = item['id']

        match_leaderboard_id = last_match['leaderboard_id']  # type of leaderboard to request depending on the match

        # safety (e.g. Quick Match) -> select 'Unranked'
        if match_leaderboard_id is None:
            if aoe2_net_parameters['leaderboard'][0]['string'] == 'Unranked':
                match_leaderboard_id = 0

        if match_leaderboard_id == leaderboard_ids['Unranked']:  # replace Unranked by Random Map
            if last_match['num_players'] > 2:
                match_leaderboard_id = leaderboard_ids['Team Random Map']
            else:
                match_leaderboard_id = leaderboard_ids['Random Map']

        # refine data collection for the different players
        all_players_full_data_found = True  # assuming all data found
        for player_data in data.players:  # loop on the players data
            if stop_event.wait(0):  # stop if requested
                return MatchData(['Search stop requested.'])

            # get stats for the currently selected match
            try:
                get_aoe2_net_player_stats(player_data, leaderboard_id=match_leaderboard_id, get_stats=True,
                                          get_elo_solo=False,
                                          timeout=timeout)
            except:
                name = player_data['name'] if ('name' in player_data) else 'Unknown'
                print(f'Could not find the full data for player \'{name}\'.')
                all_players_full_data_found = False
                continue

            if stop_event.wait(0):  # stop if requested
                return MatchData(['Search stop requested.'])

            # get solo ELO
            try:
                if match_leaderboard_id == leaderboard_ids['Team Random Map']:
                    get_aoe2_net_player_stats(player_data, leaderboard_id=leaderboard_ids['Random Map'],
                                              get_stats=False,
                                              get_elo_solo=True, timeout=timeout)
                elif match_leaderboard_id == leaderboard_ids['Team Empire Wars']:
                    get_aoe2_net_player_stats(player_data, leaderboard_id=leaderboard_ids['Empire Wars'],
                                              get_stats=False,
                                              get_elo_solo=True, timeout=timeout)
                elif match_leaderboard_id == leaderboard_ids['Team Death Match']:
                    get_aoe2_net_player_stats(player_data, leaderboard_id=leaderboard_ids['Death Match'],
                                              get_stats=False,
                                              get_elo_solo=True, timeout=timeout)
            except:
                name = player_data['name'] if ('name' in player_data) else 'Unknown'
                print(f'Could not find the solo ELO for player \'{name}\'.')
                all_players_full_data_found = False
                continue

            if stop_event.wait(0):  # stop if requested
                return MatchData(['Search stop requested.'])

        data.players.sort(key=team_color_sorting)  # sorting the players

        data.match_id = last_match['match_id']  # match ID

        data.all_data_found = all_players_full_data_found  # all data found

        print(f'New game match data loaded for user {search_input}.')
        return data

    except:
        print('Some issue occurred while trying to get the match data.')
        return MatchData(['Failed to fetch the match data from aoe2.net.'])


def get_aoe2_net_match_data_list(output: list, stop_event: Event, search_input: str, timeout: int,
                                 aoe2_net_parameters: dict = None,
                                 last_match_id: str = '', last_data_found: bool = False):
    """Get all the data for a match (from https://aoe2.net), and add it to a list

    Parameters
    ----------
    output                 output will be added (append) to this list: 'MatchData' data
    stop_event             set it to True to stop the thread
    search_input           input to search: profile ID, steam ID or player name
    timeout                timeout for the url request
    aoe2_net_parameters    AoE2 parameters as obtained from 'get_aoe2_net_parameters', None to re-compute them
    last_match_id          last match ID for which data was retrieved
    last_data_found        True if all the data was found for the last retrieve call
    """
    response = get_aoe2_net_match_data(stop_event, search_input, timeout, aoe2_net_parameters, last_match_id,
                                       last_data_found)
    output.append(response)


def get_aoe2_net_match_data_threading(output: list, stop_event: Event, search_input: str, timeout: int,
                                      aoe2_net_parameters: dict = None, last_match_id: str = '',
                                      last_data_found: bool = False) -> Thread:
    """Get all the data for a match (from https://aoe2.net), using threading

    Parameters
    ----------
    output                 output will be added (append) to this list: 'MatchData' data
    stop_event             set it to True to stop the thread
    search_input           input to search: profile ID, steam ID or player name
    timeout                timeout for the url request
    aoe2_net_parameters    AoE2 parameters as obtained from 'get_aoe2_net_parameters', None to re-compute them
    last_match_id          last match ID for which data was retrieved
    last_data_found        True if all the data was found for the last retrieve call

    Returns
    -------
    thread ID
    """
    x = Thread(target=get_aoe2_net_match_data_list,
               args=(output, stop_event, search_input, timeout, aoe2_net_parameters, last_match_id, last_data_found))
    x.start()
    return x


# ----- Select search method -----

def is_valid_fetch_match_data(fetch_match_data: str) -> bool:
    """Check if 'fetch_match_data' parameter is valid

    Parameters
    ----------
    fetch_match_data    how to fetch match data: 'aoe2.net' or '' for no match data

    Returns
    -------
    True if valid
    """
    return fetch_match_data in ['aoe2.net']


def get_match_data_threading(fetch_match_data: str, output: list, stop_event: Event, search_input: str, timeout: int,
                             last_match_id: str = '', last_data_found: bool = False) -> Union[Thread, None]:
    """Get all the data for a match , using threading

    Parameters
    ----------
    fetch_match_data    how to fetch match data: 'aoe2.net' or '' for no match data
    output              output will be added (append) to this list: 'MatchData' data
    stop_event          set it to True to stop the thread
    search_input        input to search: profile ID, steam ID or player name
    timeout             timeout for the url request
    last_match_id       last match ID for which data was retrieved
    last_data_found     True if all the data was found for the last retrieve call

    Returns
    -------
    thread ID, None if not valid
    """
    if fetch_match_data == 'aoe2.net':
        return get_aoe2_net_match_data_threading(output=output, stop_event=stop_event, search_input=search_input,
                                                 timeout=timeout, aoe2_net_parameters=None, last_match_id=last_match_id,
                                                 last_data_found=last_data_found)
    elif fetch_match_data != '':
        print(f'No valid \'fetch_match_data\' parameter (\'{fetch_match_data}\').',
              'Accepted values: \'aoe2.net\' or \'\'')
    return None


if __name__ == '__main__':
    max_time_request = 10  # maximal time for url request [s]
    player_name = 'GL.DauT'  # name to look for

    stop_flag = Event()  # stop event: setting to True to stop the thread
    out_data = []
    thread_id = get_match_data_threading(
        'aoe2.net', out_data, stop_event=stop_flag, search_input=player_name, timeout=max_time_request)
    assert thread_id is not None

    start_time = time.time()
    close_time = 20.0  # after this time, the thread will be closed [s]

    while len(out_data) == 0:
        print('waiting')
        time.sleep(1.0)  # sleep every 1 s
        if time.time() - start_time > close_time:  # stop the thread if too long
            stop_flag.set()
            thread_id.join()
    print('Match ID:', out_data[0].match_id)
    print('Map name:', out_data[0].map_name)
    for cur_player in out_data[0].players:
        print('Name:', cur_player.name, '| ELO:', cur_player.elo, '| team:', cur_player.team, '| color:',
              cur_player.color)
