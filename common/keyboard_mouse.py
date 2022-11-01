import time
from keyboard import add_hotkey, remove_hotkey, is_pressed
from mouse import on_button


class HotkeyFlagData:
    """Flag for a hotkey, with related data (sequence and timestamp)"""

    def __init__(self, flag: bool = False, sequence: str = ''):
        """Constructor

        Parameters
        ----------
        flag        True if hotkey flag activated
        sequence    sequence corresponding to the hotkey (keyboard or mouse)
        """
        self.sequence: str = sequence
        self.flag: bool = False
        self.timestamp: float = 0  # last timestamp when the flag was set to True [s]
        self.set_flag(flag)

    def set_flag(self, flag: bool):
        """Set the value for a flag and update the timestamp if flag set to True

        Parameters
        ----------
        flag    True if hotkey flag activated
        """
        self.flag = flag
        if flag:
            self.timestamp = time.time()

    def get_elapsed_time(self) -> float:
        """Get the elapsed time since last timestamp

        Returns
        -------
        Elapsed time [s]
        """
        return time.time() - self.timestamp


class KeyboardMouseManagement:
    """Keyboard global hotkeys and mouse global buttons management"""

    def __init__(self, print_unset: bool = True):
        """Constructor

        Parameters
        ----------
        print_unset    True to print unset hotkey & button warnings.
        """
        self.print_unset = print_unset

        self.hotkeys = dict()  # list of hotkeys available as {name: HotkeyFlagData}
        self.hotkey_ids = []  # IDs of hotkeys, as received from 'add_hotkey'

        # names of the available mouse buttons
        self.mouse_button_names = ['left', 'middle', 'right', 'x', 'x2']

        self.mouse_buttons = dict()  # list of mouse buttons available as {name: HotkeyFlagData}
        for mouse_button_name in self.mouse_button_names:
            assert mouse_button_name not in self.mouse_buttons
            self.mouse_buttons[mouse_button_name] = HotkeyFlagData(sequence=mouse_button_name)
            on_button(self.set_mouse_flag, args=(mouse_button_name, True), buttons=mouse_button_name, types='up')

    def set_all_flags(self, value: bool):
        """Set all the flags (keyboard and mouse) to the same value

        Parameters
        ----------
        value    value to set for the flags
        """
        for key in self.hotkeys.keys():
            self.hotkeys[key].set_flag(value)

        for key in self.mouse_buttons.keys():
            self.mouse_buttons[key].set_flag(value)

    def update_hotkey(self, name: str, sequence: str) -> bool:
        """Update the hotkey binds for a new hotkey definition.

        Parameters
        ----------
        name        name of the hotkey
        sequence    sequence for the keyboard 'add_hotkey' function, '' to ignore the hotkey

        Returns
        -------
        True if hotkey created or updated
        """
        try:
            if name == '':  # safety on the hotkey name
                print('Name missing to update hotkey.')
                return False

            if (name in self.hotkeys) and (self.hotkeys[name].sequence == sequence):  # no change for this hotkey
                return False

            self.hotkeys[name] = HotkeyFlagData(sequence=sequence)  # add/update hotkey in dictionary

            # remove all hotkeys (start bindings from scratch)
            for hotkey_id in self.hotkey_ids:
                remove_hotkey(hotkey_id)
            self.hotkey_ids.clear()

            # dictionary of sequences to bind as {sequence: [names]}
            add_hotkey_dict = dict()
            for name, value in self.hotkeys.items():
                sequence = value.sequence
                if sequence != '':  # valid sequence
                    if sequence not in add_hotkey_dict:  # new sequence
                        add_hotkey_dict[sequence] = [name]
                    else:  # existing sequence
                        assert name not in add_hotkey_dict[sequence]
                        add_hotkey_dict[sequence].append(name)

            # bind hotkey for sequences
            for sequence, names in add_hotkey_dict.items():
                assert sequence != ''
                self.hotkey_ids.append(add_hotkey(sequence, self.set_hotkey_flags, args=(names, True)))
            return True

        except Exception:
            print(f'Could not set hotkey \'{name}\' with sequence \'{sequence}\'.')
            return False

    def set_hotkey_flags(self, names: list, value: bool):
        """Set the flags related to a list of hotkeys.

        Parameters
        ----------
        names    list of names for the hotkeys
        value    new value for the hotkey flags
        """
        for name in names:  # loop on all the hotkey names
            if name in self.hotkeys:
                self.hotkeys[name].set_flag(value)
            elif self.print_unset:
                print(f'Unknown hotkey name received ({name}) to set the flag.')

    def is_hotkey_pressed(self, name: str) -> bool:
        """Check if a hotkey is pressed

        Parameters
        ----------
        name    name of the hotkey to look for

        Returns
        -------
        True if hotkey currently pressed, False if non-existent hotkey
        """
        if name in self.hotkeys:
            return is_pressed(self.hotkeys[name].sequence)
        else:
            if self.print_unset:
                print(f'Unknown hotkey name received ({name}) to check if it is pressed.')
            return False

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
            flag_value = self.hotkeys[name].flag
            self.hotkeys[name].set_flag(False)
            return flag_value
        else:
            if self.print_unset:
                print(f'Unknown hotkey name received ({name}) to get the flag value.')
            return False

    def get_hotkey_elapsed_time(self, name: str) -> float:
        """Get the elapsed time related to a specific hotkey name.

        Parameters
        ----------
        name    name of the hotkey to look for

        Returns
        -------
        Elapsed_time, -1.0 if non-existent hotkey
        """
        if name in self.hotkeys:
            return self.hotkeys[name].get_elapsed_time()
        else:
            if self.print_unset:
                print(f'Unknown hotkey name received ({name}) to get the timestamp.')
            return -1.0

    def set_mouse_flag(self, name: str, value: bool):
        """Set the flag related to a mouse button.

        Parameters
        ----------
        name     name of the mouse button
        value    new value for the mouse flag
        """
        if name in self.mouse_buttons:
            self.mouse_buttons[name].set_flag(value)
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
            flag_value = self.mouse_buttons[name].flag
            self.mouse_buttons[name].set_flag(False)
            return flag_value
        else:
            if self.print_unset:
                print(f'Unknown mouse button name received ({name}) to get the flag value.')
            return False

    def get_mouse_elapsed_time(self, name: str) -> float:
        """Get the elapsed time related to a specific mouse button name.

        Parameters
        ----------
        name    name of the mouse button to look for

        Returns
        -------
        Elapsed_time, -1.0 if non-existent mouse button
        """
        if name in self.mouse_buttons:
            return self.mouse_buttons[name].get_elapsed_time()
        else:
            if self.print_unset:
                print(f'Unknown mouse button name received ({name}) to get the timestamp.')
            return -1.0


if __name__ == '__main__':
    # initialize keyboard-mouse management
    keyboard_mouse = KeyboardMouseManagement()

    # set initial hotkeys
    keyboard_mouse.update_hotkey('print_hello', 'ctrl+h')
    keyboard_mouse.update_hotkey('quit', 'ctrl+q')
    keyboard_mouse.update_hotkey('change_hotkey', 'alt+s')
    keyboard_mouse.update_hotkey('hotkey_mouse_together', 'ctrl')  # check activation of hotkey and mouse together
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
            current_sequence = keyboard_mouse.hotkeys['change_hotkey'].sequence
            if current_sequence == 'alt+s':
                keyboard_mouse.update_hotkey('change_hotkey', 'alt+d')
                print('Changing hotkey from \'alt+s\' to \'alt+d\'.')
            elif current_sequence == 'alt+d':
                keyboard_mouse.update_hotkey('change_hotkey', 'alt+s')
                print('Changing hotkey from \'alt+d\' to \'alt+s\'.')

        # hotkey and mouse button together
        if keyboard_mouse.is_hotkey_pressed('hotkey_mouse_together') and keyboard_mouse.get_mouse_flag('x'):
            print('Ctrl and mouse first button combined.')

        # mouse buttons
        for mouse_name in keyboard_mouse.mouse_button_names:
            if keyboard_mouse.get_mouse_flag(mouse_name):
                print(f'Mouse button: {mouse_name}')

        # sleeping 50 ms
        time.sleep(0.05)

    print('End of the script.')
