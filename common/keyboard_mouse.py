import time
from keyboard import add_hotkey, remove_hotkey
from mouse import on_button


class KeyboardMouseManagement:
    """Keyboard global hotkeys and mouse global buttons management"""

    def __init__(self, print_unset: bool = True):
        """Constructor

        Parameters
        ----------
        print_unset    True to print unset hotkey & button warnings.
        """
        self.print_unset = print_unset

        self.hotkeys = dict()  # list of hotkeys available as {name: {'flag': bool, 'sequence': str}}

        # names of the available mouse buttons
        self.mouse_button_names = ['left', 'middle', 'right', 'x', 'x2']

        self.mouse_buttons = dict()  # list of mouse buttons available as {name: bool}
        for mouse_button_name in self.mouse_button_names:
            assert mouse_button_name not in self.mouse_buttons
            self.mouse_buttons[mouse_button_name] = False
            on_button(self.set_mouse_flag, args=(mouse_button_name, True), buttons=mouse_button_name, types='up')

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
            add_hotkey(sequence, self.set_hotkey_flag, args=(name, True))
            return True
        except Exception:
            print(f'Could not set hotkey \'{name}\' with sequence \'{sequence}\'.')
            return False

    def set_hotkey_flag(self, name: str, value: bool):
        """Set the flag related to any hotkey.

        Parameters
        ----------
        name     name of the hotkey
        value    new value for the hotkey flag
        """
        if name in self.hotkeys:
            self.hotkeys[name]['flag'] = value
        elif self.print_unset:
            print(f'Unknown hotkey name received ({name}) to set the flag.')

    def get_hotkey_flag(self, name: str) -> bool:
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

    def set_mouse_flag(self, name: str, value: bool):
        """Set the flag related to a mouse button.

        Parameters
        ----------
        name     name of the mouse button
        value    new value for the mouse flag
        """
        if name in self.mouse_buttons:
            self.mouse_buttons[name] = value
        elif self.print_unset:
            print(f'Unknown mouse button name received ({name}) to set the flag.')

    def get_mouse_flag(self, name: str) -> bool:
        """Get the flag related to a specific mouse button name, and set the corresponding flag to False.

        Parameters
        ----------
        name    name of the mouse button to look for

        Returns
        -------
        Flag value, False if non-existent mouse button
        """
        if name in self.mouse_buttons:
            flag_value = self.mouse_buttons[name]
            self.mouse_buttons[name] = False
            return flag_value
        else:
            if self.print_unset:
                print(f'Unknown mouse button name received ({name}) to get the flag value.')
            return False


if __name__ == '__main__':
    # initialize keyboard-mouse management
    keyboard_mouse = KeyboardMouseManagement()

    # set initial hotkeys
    keyboard_mouse.update_hotkey('print_hello', 'ctrl+h')
    keyboard_mouse.update_hotkey('quit', 'ctrl+q')
    keyboard_mouse.update_hotkey('change_hotkey', 'alt+s')
    keyboard_mouse.update_hotkey('unusable_duplicate_sequence', 'alt+s')  # wrong hotkey to check if detected
    keyboard_mouse.update_hotkey('unusable_wrong_sequence', '<alt>+r')  # wrong hotkey to check if detected

    while True:
        # print message
        if keyboard_mouse.get_hotkey_flag('print_hello'):
            print('Hello world!')

        # quit the script
        if keyboard_mouse.get_hotkey_flag('quit'):
            break

        # change a hotkey
        if keyboard_mouse.get_hotkey_flag('change_hotkey'):
            current_sequence = keyboard_mouse.hotkeys['change_hotkey']['sequence']
            if current_sequence == 'alt+s':
                keyboard_mouse.update_hotkey('change_hotkey', 'alt+d')
                print('Changing hotkey from \'alt+s\' to \'alt+d\'.')
            elif current_sequence == 'alt+d':
                keyboard_mouse.update_hotkey('change_hotkey', 'alt+s')
                print('Changing hotkey from \'alt+d\' to \'alt+s\'.')

        # mouse buttons
        for mouse_name in keyboard_mouse.mouse_button_names:
            if keyboard_mouse.get_mouse_flag(mouse_name):
                print(f'Mouse button: {mouse_name}')

        # sleeping 50 ms
        time.sleep(0.05)

    print('End of the script.')
