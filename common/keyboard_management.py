import time
from keyboard import add_hotkey, remove_hotkey


class KeyboardManagement:
    """Keyboard global hotkeys management"""

    def __init__(self, print_unset: bool = True):
        """Constructor

        Parameters
        ----------
        print_unset    True to print unset hotkey warnings.
        """
        self.hotkeys = dict()  # list of hotkeys available as {name: {'flag': bool, 'sequence': str}}
        self.print_unset = print_unset

    def remove_hotkey(self, name) -> bool:
        """Remove a hotkey

        Parameters
        ----------
        name    name of the hotkey to remove

        Returns
        -------
        True if hotkey found and removed
        """
        if name in self.hotkeys:
            remove_hotkey(self.hotkeys[name]['sequence'])
            del self.hotkeys[name]
            return True
        else:
            if self.print_unset:
                print(f'Hotkey \'{name}\' (to remove) was not found.')
            return False

    def update_hotkey(self, name: str, sequence: str) -> bool:
        """Update (or create if non-existent) a hotkey bind.

        Parameters
        ----------
        name        name of the hotkey
        sequence    sequence for the keyboard 'add_hotkey' function

        Returns
        -------
        True if hotkey created or updated
        """
        if sequence == '':  # check for empty sequence
            if self.print_unset:
                print(f'Hotkey \'{name}\' cannot be set because its sequence is empty.')
            return False

        try:
            for key in list(self.hotkeys.keys()):  # loop on the existing hotkeys
                # this hotkey already exists and must be removed
                if key == name:
                    remove_hotkey(self.hotkeys[key]['sequence'])
                    del self.hotkeys[key]

                # this keyboard sequence is already used
                elif self.hotkeys[key]['sequence'] == sequence:
                    print(f'Cannot set hotkey \'{name}\' because'
                          f'the sequence \'{sequence}\' is already used by \'{key}\'.')
                    return False

            # create hotkey with the requested sequence
            self.hotkeys[name] = {'flag': False, 'sequence': sequence}
            add_hotkey(sequence, self.set_flag, args=(name, True))
            return True
        except Exception:
            print(f'Could not set hotkey \'{name}\' with sequence \'{sequence}\'.')
            return False

    def set_flag(self, name: str, value: bool):
        """Set the flag related to any hotkey.

        Parameters
        ----------
        name     name of the hotkey
        value    new value for the hotkey flag
        """
        if name in self.hotkeys:
            self.hotkeys[name]['flag'] = value
        else:
            if self.print_unset:
                print(f'Unknown hotkey name received ({name}) to set the flag.')

    def get_flag(self, name: str) -> bool:
        """Get the flag related to a specific hotkey name, and set the corresponding flag to False.

        Parameters
        ----------
        name    name of the hotkey to look for

        Returns
        -------
        Flag value, False if non-existent hotkey
        """
        if name in self.hotkeys:
            flag_value = self.hotkeys[name]['flag']
            self.hotkeys[name]['flag'] = False
            return flag_value
        else:
            if self.print_unset:
                print(f'Unknown hotkey name received ({name}) to get the flag value.')
            return False


if __name__ == '__main__':
    # initialize keyboard management
    keyboard_management = KeyboardManagement()

    # set initial hotkeys
    keyboard_management.update_hotkey('print_hello', 'ctrl+h')
    keyboard_management.update_hotkey('quit', 'ctrl+q')
    keyboard_management.update_hotkey('change_hotkey', 'alt+s')
    keyboard_management.update_hotkey('unusable_duplicate_sequence', 'alt+s')
    keyboard_management.update_hotkey('unusable_wrong_sequence', '<alt>+s')

    while True:
        # print message
        if keyboard_management.get_flag('print_hello'):
            print('Hello world!')

        # quit the script
        if keyboard_management.get_flag('quit'):
            break

        # change a hotkey
        if keyboard_management.get_flag('change_hotkey'):
            current_sequence = keyboard_management.hotkeys['change_hotkey']['sequence']
            if current_sequence == 'alt+s':
                keyboard_management.update_hotkey('change_hotkey', 'alt+d')
                print('Changing hotkey from \'alt+s\' to \'alt+d\'.')
            elif current_sequence == 'alt+d':
                keyboard_management.update_hotkey('change_hotkey', 'alt+s')
                print('Changing hotkey from \'alt+d\' to \'alt+s\'.')

        # sleeping 50 ms
        time.sleep(0.05)

    print('End of the script.')
