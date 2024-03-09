import subprocess

from PyQt5.QtWidgets import QMainWindow, QLabel, QPushButton
from PyQt5.QtWidgets import QCheckBox
from PyQt5.QtGui import QFont, QIcon, QPixmap
from PyQt5.QtCore import Qt

from common.useful_tools import set_background_opacity, OverlaySequenceEdit, widget_x_end, widget_y_end
from common.rts_settings import RTSHotkeys, KeyboardMouse, RTSHotkeysConfigurationLayout


class HotkeysWindow(QMainWindow):
    """Window to configure the hotkeys"""

    def __init__(self, parent, hotkeys: RTSHotkeys, game_icon: str, mouse_image: str,
                 settings_folder: str, panel_settings: RTSHotkeysConfigurationLayout,
                 timer_flag: bool = False):
        """Constructor

        Parameters
        ----------
        parent             Parent window.
        hotkeys            Hotkeys current definition.
        game_icon          Icon of the game.
        mouse_image        Image for the mouse.
        settings_folder    Folder with the settings file.
        panel_settings     Settings for the panel layout.
        timer_flag         True to add the timer hotkeys.
        """
        super().__init__()
        self.parent = parent

        # panel settings
        self.color_font = panel_settings.color_font
        self.button_margin = panel_settings.button_margin
        self.font_police = panel_settings.font_police
        self.font_size = panel_settings.font_size
        self.border_size = panel_settings.border_size
        self.section_vertical_spacing = panel_settings.section_vertical_spacing
        self.edit_width = panel_settings.edit_width
        self.edit_height = panel_settings.edit_height
        self.vertical_spacing = panel_settings.vertical_spacing
        self.horizontal_spacing = panel_settings.horizontal_spacing
        self.mouse_height = panel_settings.mouse_height
        self.mouse_spacing = panel_settings.mouse_spacing
        self.color_background = panel_settings.color_background
        self.opacity = panel_settings.opacity

        # text for the manual describing how to set up the hotkeys
        manual_text: str = \
            'Set hotkey sequence or \'Esc\' to cancel. Click on \'Update hotkeys\' to confirm your choice.' \
            '\n\nClick on the mouse checkbox to consider \'L\' as left click, \'R\' as right click, ' \
            '\'M\' as middle button,\n\'1\' as first extra button and \'2\' as second extra button.' \
            '\nSo, the input \'Ctrl+1\' with mouse option means Ctrl + first extra button.' \
            '\n\nNote that hotkeys are ignored while this window is open.'

        # description for the different hotkeys
        if timer_flag:  # including timer hotkeys
            self.descriptions = {
                'next_panel': 'Move to next panel :',
                'show_hide': 'Show/hide overlay :',
                'build_order_previous_step': 'Previous step / Timer -1 sec :',
                'build_order_next_step': 'Next step / Timer +1 sec :',
                'switch_timer_manual': 'Switch BO timer/manual :',
                'start_timer': 'Start BO timer :',
                'stop_timer': 'Stop BO timer :',
                'start_stop_timer': 'Start/stop BO timer :',
                'reset_timer': 'Reset BO timer :',
            }
        else:  # without timer hotkeys
            self.descriptions = {
                'next_panel': 'Move to next panel :',
                'show_hide': 'Show/hide overlay :',
                'build_order_previous_step': 'Go to previous BO step :',
                'build_order_next_step': 'Go to next BO step :'
            }

        for description in self.descriptions:
            assert description in self.parent.hotkey_names

        # style to apply on the different parts
        self.style_description = f'color: rgb({self.color_font[0]}, {self.color_font[1]}, {self.color_font[2]})'
        self.style_sequence_edit = 'QWidget{' + self.style_description + '; border: 1px solid white}'
        self.style_button = 'QWidget{' + self.style_description + '; border: 1px solid white; padding: ' + str(
            self.button_margin) + 'px}'

        # manual
        manual_label = QLabel(manual_text, self)
        manual_label.setFont(QFont(self.font_police, self.font_size))
        manual_label.setStyleSheet(self.style_description)
        manual_label.adjustSize()
        manual_label.move(self.border_size, self.border_size)
        y_hotkeys = widget_y_end(manual_label) + self.section_vertical_spacing  # vertical position for hotkeys
        max_width = widget_x_end(manual_label)

        # labels display (descriptions)
        count = 0
        y_buttons = y_hotkeys  # vertical position for the buttons
        line_height = self.edit_height + self.vertical_spacing
        first_column_max_width = 0
        for description in self.descriptions.values():
            label = QLabel(description, self)
            label.setFont(QFont(self.font_police, self.font_size))
            label.setStyleSheet(self.style_description)
            label.adjustSize()
            label.move(self.border_size, y_hotkeys + count * line_height)
            first_column_max_width = max(first_column_max_width, widget_x_end(label))
            y_buttons = widget_y_end(label) + self.section_vertical_spacing
            count += 1

        # button to open settings folder
        self.folder_button = QPushButton('Open settings folder', self)
        self.folder_button.setFont(QFont(self.font_police, self.font_size))
        self.folder_button.setStyleSheet(self.style_button)
        self.folder_button.adjustSize()
        self.folder_button.move(self.border_size, y_buttons)
        self.folder_button.clicked.connect(lambda: subprocess.run(['explorer', settings_folder]))
        self.folder_button.show()
        first_column_max_width = max(first_column_max_width, widget_x_end(self.folder_button))

        # mouse dictionaries
        self.mouse_to_field = {'left': 'L', 'middle': 'M', 'right': 'R', 'x': '1', 'x2': '2'}
        self.field_to_mouse = {v: k for k, v in self.mouse_to_field.items()}

        # hotkeys edit fields
        count = 0
        x_hotkey = first_column_max_width + self.horizontal_spacing  # horizontal position for the hotkey fields
        self.hotkeys = {}  # storing the hotkeys
        self.mouse_checkboxes = {}  # storing the mouse checkboxes
        for key in self.descriptions.keys():
            hotkey = OverlaySequenceEdit(self)

            valid_mouse_input = False  # check if valid mouse input provided
            if hasattr(hotkeys, key):
                value = getattr(hotkeys, key)
                if isinstance(value, KeyboardMouse):
                    valid_mouse_input = value.mouse in self.mouse_to_field
                    if (value.keyboard != '') and valid_mouse_input:
                        hotkey.setKeySequence(value.keyboard + '+' + self.mouse_to_field[value.mouse])
                    elif value.keyboard != '':
                        hotkey.setKeySequence(value.keyboard)
                    elif valid_mouse_input:
                        hotkey.setKeySequence(self.mouse_to_field[value.mouse])

            hotkey.setFont(QFont(self.font_police, self.font_size))
            hotkey.setStyleSheet(self.style_sequence_edit)
            hotkey.resize(self.edit_width, self.edit_height)
            hotkey.move(x_hotkey, y_hotkeys + count * line_height)
            hotkey.setToolTip('Click to edit, then input hotkey combination.')
            hotkey.show()
            self.hotkeys[key] = hotkey

            # icon for the mouse
            mouse_icon = QLabel('', self)
            mouse_icon.setPixmap(QPixmap(mouse_image).scaledToHeight(self.mouse_height, mode=Qt.SmoothTransformation))
            mouse_icon.adjustSize()
            mouse_icon.move(widget_x_end(hotkey) + self.mouse_spacing, hotkey.y())
            mouse_icon.show()

            # checkbox for the mouse
            mouse_checkbox = QCheckBox('', self)
            mouse_checkbox.setChecked(valid_mouse_input)
            mouse_checkbox.adjustSize()
            mouse_checkbox.move(widget_x_end(mouse_icon) + self.horizontal_spacing, hotkey.y())
            mouse_checkbox.show()
            max_width = max(max_width, widget_x_end(mouse_checkbox))
            self.mouse_checkboxes[key] = mouse_checkbox

            count += 1

        # send update button
        self.update_button = QPushButton("Update hotkeys", self)
        self.update_button.setFont(QFont(self.font_police, self.font_size))
        self.update_button.setStyleSheet(self.style_button)
        self.update_button.adjustSize()
        self.update_button.move(x_hotkey, self.folder_button.y())
        self.update_button.clicked.connect(self.parent.update_hotkeys)
        self.update_button.show()
        max_width = max(max_width, widget_x_end(self.update_button))

        # window properties and show
        self.setWindowTitle('Configure hotkeys')
        self.setWindowIcon(QIcon(game_icon))
        if panel_settings.stay_on_top:
            self.setWindowFlags(Qt.WindowStaysOnTopHint)  # window staying on top
        self.resize(max_width + self.border_size, widget_y_end(self.update_button) + self.border_size)
        set_background_opacity(self, self.color_background, self.opacity)
        self.show()

    def closeEvent(self, _):
        """Called when clicking on the cross icon (closing window icon)."""
        self.parent.keyboard_mouse.set_all_flags(False)
        super().close()
