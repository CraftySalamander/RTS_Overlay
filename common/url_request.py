import ssl
import time
import json
import socket
import threading
import urllib.request
from urllib.error import HTTPError, URLError


def read_json_url(url: str, timeout: int) -> dict:
    """Read the content of an URL and get its content as a dictionary from JSON

    Parameters
    ----------
    url        url to request
    timeout    timeout for the url request

    Returns
    -------
    JSON with the content, None if issue occurred
    """
    response = None

    try:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE  # avoid 'SSL: CERTIFICATE_VERIFY_FAILED'
        response = json.loads(urllib.request.urlopen(url, context=ctx, timeout=timeout).read().decode('utf-8'))
    except HTTPError as error:
        print(f'Data not retrieved because {error} with URL {url}.')
    except URLError as error:
        if isinstance(error.reason, socket.timeout):
            print(f'Socket timed out for {url}.')
        else:
            print(f'Some URL issue happened while requesting {url}.')
    except:
        print(f'Some unknown issue happened while requesting {url} for JSON content.')

    return response


def read_json_url_list(output: list, url: str, timeout: int):
    """Read the content of an URL, get its content as a dictionary, and add it to a list
    
    Parameters
    ----------
    output     output will be added (append) to this list: dictionary with the content, None if issue occurred
    url        url to request
    timeout    timeout for the url request
    """
    response = read_json_url(url, timeout)
    output.append(response)


if __name__ == '__main__':
    # perform request with threading to avoid stopping the program
    test_url = 'https://aoe2.net/api/leaderboard?game=aoe2de&leaderboard_id=4&start=1&count=1&search=GL.TheViper'
    url_response = []
    x = threading.Thread(target=read_json_url_list, args=(url_response, test_url, 10))  # 10s timeout
    x.start()
    while len(url_response) == 0:
        print('waiting')
        time.sleep(0.2)  # sleep every 0.2 s
    print(url_response[0])
