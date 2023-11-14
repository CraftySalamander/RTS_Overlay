import subprocess

from PyQt5.QtWidgets import QMainWindow, QLabel, QPushButton
from PyQt5.QtWidgets import QCheckBox
from PyQt5.QtGui import QFont, QIcon, QPixmap
from PyQt5.QtCore import Qt

from common.useful_tools import set_background_opacity, OverlaySequenceEdit, widget_x_end, widget_y_end
from common.rts_settings import RTSHotkeys, KeyboardMouse


class HotkeysWindow(QMainWindow):
    """Window to configure the hotkeys"""

    def __init__(self, parent, hotkeys: RTSHotkeys, game_icon: str, mouse_image: str, mouse_height: int,
                 settings_folder: str, font_police: str, font_size: int, color_font: list, color_background: list,
                 opacity: float, border_size: int, edit_width: int, edit_height: int, button_margin: int,
                 vertical_spacing: int, section_vertical_spacing: int, horizontal_spacing: int, mouse_spacing: int):
        """Constructor

        Parameters
        ----------
        parent                      parent window
        hotkeys                     hotkeys current definition
        game_icon                   icon of the game
        mouse_image                 image for the mouse
        mouse_height                height for the mouse image
        settings_folder             folder with the settings file
        font_police                 font police type
        font_size                   font size
        color_font                  color of the font
        color_background            color of the background
        opacity                     opacity of the window
        border_size                 size of the borders
        edit_width                  width for the hotkeys edit fields
        edit_height                 height for the hotkeys edit fields
        button_margin               margin from text to button border
        vertical_spacing            vertical spacing between the elements
        section_vertical_spacing    vertical spacing between the sections
        horizontal_spacing          horizontal spacing between the elements
        mouse_spacing               horizontal spacing between the field and the mouse icon
        """
        super().__init__()
        self.parent = parent

        # text for the manual describing how to set up the hotkeys
        manual_text: str = \
            'Set hotkey sequence or \'Esc\' to cancel. Click on \'Update hotkeys\' to confirm your choice.' \
            '\n\nClick on the mouse checkbox to consider \'L\' as left click, \'R\' as right click, ' \
            '\'M\' as middle button,\n\'1\' as first extra button and \'2\' as second extra button.' \
            '\nSo, the input \'Ctrl+1\' with mouse option means Ctrl + first extra button.' \
            '\n\nNote that hotkeys are ignored while this window is open.'

        # description for the different hotkeys
        self.descriptions = {
            'next_panel': 'Move to next panel :',
            'show_hide': 'Show/hide overlay :',
            'build_order_previous_step': 'Go to previous BO step :',
            'build_order_next_step': 'Go to next BO step :'
        }
        for description in self.descriptions:
            assert description in parent.hotkey_names

        # style to apply on the different parts
        style_description = f'color: rgb({color_font[0]}, {color_font[1]}, {color_font[2]})'
        style_sequence_edit = 'QWidget{' + style_description + '; border: 1px solid white}'
        style_button = 'QWidget{' + style_description + '; border: 1px solid white; padding: ' + str(
            button_margin) + 'px}'

        # manual
        manual_label = QLabel(manual_text, self)
        manual_label.setFont(QFont(font_police, font_size))
        manual_label.setStyleSheet(style_description)
        manual_label.adjustSize()
        manual_label.move(border_size, border_size)
        y_hotkeys = widget_y_end(manual_label) + section_vertical_spacing  # vertical position for hotkeys
        max_width = widget_x_end(manual_label)

        # labels display (descriptions)
        count = 0
        y_buttons = y_hotkeys  # vertical position for the buttons
        line_height = edit_height + vertical_spacing
        first_column_max_width = 0
        for description in self.descriptions.values():
            label = QLabel(description, self)
            label.setFont(QFont(font_police, font_size))
            label.setStyleSheet(style_description)
            label.adjustSize()
            label.move(border_size, y_hotkeys + count * line_height)
            first_column_max_width = max(first_column_max_width, widget_x_end(label))
            y_buttons = widget_y_end(label) + section_vertical_spacing
            count += 1

        # button to open settings folder
        self.folder_button = QPushButton('Open settings folder', self)
        self.folder_button.setFont(QFont(font_police, font_size))
        self.folder_button.setStyleSheet(style_button)
        self.folder_button.adjustSize()
        self.folder_button.move(border_size, y_buttons)
        self.folder_button.clicked.connect(lambda: subprocess.run(['explorer', settings_folder]))
        self.folder_button.show()
        first_column_max_width = max(first_column_max_width, widget_x_end(self.folder_button))

        # mouse dictionaries
        self.mouse_to_field = {'left': 'L', 'middle': 'M', 'right': 'R', 'x': '1', 'x2': '2'}
        self.field_to_mouse = {v: k for k, v in self.mouse_to_field.items()}

        # hotkeys edit fields
        count = 0
        x_hotkey = first_column_max_width + horizontal_spacing  # horizontal position for the hotkey fields
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

            hotkey.setFont(QFont(font_police, font_size))
            hotkey.setStyleSheet(style_sequence_edit)
            hotkey.resize(edit_width, edit_height)
            hotkey.move(x_hotkey, y_hotkeys + count * line_height)
            hotkey.setToolTip('Click to edit, then input hotkey combination.')
            hotkey.show()
            self.hotkeys[key] = hotkey

            # icon for the mouse
            mouse_icon = QLabel('', self)
            mouse_icon.setPixmap(QPixmap(mouse_image).scaledToHeight(mouse_height, mode=Qt.SmoothTransformation))
            mouse_icon.adjustSize()
            mouse_icon.move(widget_x_end(hotkey) + mouse_spacing, hotkey.y())
            mouse_icon.show()

            # checkbox for the mouse
            mouse_checkbox = QCheckBox('', self)
            mouse_checkbox.setChecked(valid_mouse_input)
            mouse_checkbox.adjustSize()
            mouse_checkbox.move(widget_x_end(mouse_icon) + horizontal_spacing, hotkey.y())
            mouse_checkbox.show()
            max_width = max(max_width, widget_x_end(mouse_checkbox))
            self.mouse_checkboxes[key] = mouse_checkbox

            count += 1

        # send update button
        self.update_button = QPushButton("Update hotkeys", self)
        self.update_button.setFont(QFont(font_police, font_size))
        self.update_button.setStyleSheet(style_button)
        self.update_button.adjustSize()
        self.update_button.move(x_hotkey, self.folder_button.y())
        self.update_button.clicked.connect(parent.update_hotkeys)
        self.update_button.show()
        max_width = max(max_width, widget_x_end(self.update_button))

        # window properties and show
        self.setWindowTitle('Configure hotkeys')
        self.setWindowIcon(QIcon(game_icon))
        self.resize(max_width + border_size, widget_y_end(self.update_button) + border_size)
        set_background_opacity(self, color_background, opacity)
        self.show()

    def closeEvent(self, _):
        """Called when clicking on the cross icon (closing window icon)"""
        self.parent.keyboard_mouse.set_all_flags(False)
        super().close()
