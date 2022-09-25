import os
import json
import webbrowser
import subprocess
from copy import deepcopy
from thefuzz import process

from PyQt5.QtWidgets import QMainWindow, QApplication, QLabel, QShortcut, QLineEdit, QPushButton
from PyQt5.QtWidgets import QWidget, QMessageBox, QComboBox, QDesktopWidget, QTextEdit
from PyQt5.QtGui import QKeySequence, QFont, QIcon, QCursor
from PyQt5.QtCore import Qt, QPoint, QSize

from common.build_order_tools import get_build_orders, check_build_order_key_values, is_build_order_new
from common.label_display import MultiQLabelDisplay, QLabelSettings
from common.useful_tools import TwinHoverButton, scale_int, scale_list_int, set_background_opacity, \
    OverlaySequenceEdit, widget_x_end, widget_y_end
from common.keyboard_management import KeyboardManagement


class HotkeysWindow(QMainWindow):
    """Window to configure the hotkeys"""

    def __init__(self, parent, game_icon: str, settings_folder: str, font_police: str, font_size: int, color_font: list,
                 color_background: list, opacity: float, border_size: int, edit_width: int, edit_height: int,
                 button_margin: int, vertical_spacing: int, horizontal_spacing: int):
        """Constructor

        Parameters
        ----------
        parent                parent window
        game_icon             icon of the game
        settings_folder       folder with the settings file
        font_police           font police type
        font_size             font size
        color_font            color of the font
        color_background      color of the background
        opacity               opacity of the window
        border_size           size of the borders
        edit_width            width for the hotkeys edit fields
        edit_height           height for the hotkeys edit fields
        button_margin         margin from text to button border
        vertical_spacing      vertical spacing between the elements
        horizontal_spacing    horizontal spacing between the elements
        """
        super().__init__()

        # description for the different hotkeys
        self.descriptions = {
            'next_panel': 'Move to next panel :',
            'show_hide': 'Show/hide overlay :',
            'build_order_previous_step': 'Go to previous BO step :',
            'build_order_next_step': 'Go to next BO step :'
        }

        # style to apply on the different parts
        style_description = f'color: rgb({color_font[0]}, {color_font[1]}, {color_font[2]})'
        style_sequence_edit = 'QWidget{' + style_description + '; border: 1px solid white}'
        style_button = 'QWidget{' + style_description + '; border: 1px solid white; padding: ' + str(
            button_margin) + 'px}'

        # labels display (descriptions)
        count = 0
        line_height = edit_height + vertical_spacing
        first_column_max_width = 0
        for description in self.descriptions.values():
            label = QLabel(description, self)
            label.setFont(QFont(font_police, font_size))
            label.setStyleSheet(style_description)
            label.adjustSize()
            label.move(border_size, border_size + count * line_height)
            first_column_max_width = max(first_column_max_width, label.width())
            count += 1

        # button to open settings folder
        self.folder_button = QPushButton('Open settings folder', self)
        self.folder_button.setFont(QFont(font_police, font_size))
        self.folder_button.setStyleSheet(style_button)
        self.folder_button.adjustSize()
        self.folder_button.move(border_size, border_size + len(self.descriptions) * line_height)
        self.folder_button.clicked.connect(lambda: subprocess.run(['explorer', settings_folder]))
        self.folder_button.show()
        first_column_max_width = max(first_column_max_width, self.folder_button.width())

        # hotkeys edit fields
        count = 0
        max_width = 0
        x_hotkey = border_size + first_column_max_width + horizontal_spacing
        self.hotkeys = {}  # storing the hotkeys
        for key in self.descriptions.keys():
            hotkey = OverlaySequenceEdit(self)
            hotkey.setFont(QFont(font_police, font_size))
            hotkey.setStyleSheet(style_sequence_edit)
            hotkey.resize(edit_width, edit_height)
            hotkey.move(x_hotkey, border_size + count * line_height)
            hotkey.setToolTip('Click to edit, then input hotkey combination.')
            hotkey.show()
            max_width = max(max_width, widget_x_end(hotkey))
            self.hotkeys[key] = hotkey
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
        super().close()


class BuildOrderWindow(QMainWindow):
    """Window to add a new build order"""

    def __init__(self, parent, game_icon: str, build_order_folder: str, font_police: str, font_size: int,
                 color_font: list, color_background: list, opacity: float, border_size: int,
                 edit_width: int, edit_height: int, edit_init_text: str, button_margin: int,
                 vertical_spacing: int, horizontal_spacing: int, build_order_website: list):
        """Constructor

        Parameters
        ----------
        parent                 parent window
        game_icon              icon of the game
        build_order_folder     folder where the build orders are saved
        font_police            font police type
        font_size              font size
        color_font             color of the font
        color_background       color of the background
        opacity                opacity of the window
        border_size            size of the borders
        edit_width             width for the build order text input
        edit_height            height for the build order text input
        edit_init_text         initial text for the build order text input
        button_margin          margin from text to button border
        vertical_spacing       vertical spacing between the elements
        horizontal_spacing     horizontal spacing between the elements
        build_order_website    list of 2 website elements [button name, website link], empty otherwise
        """
        super().__init__()

        # style to apply on the different parts
        style_description = f'color: rgb({color_font[0]}, {color_font[1]}, {color_font[2]})'
        style_text_edit = 'QWidget{' + style_description + '; border: 1px solid white}'
        style_button = 'QWidget{' + style_description + '; border: 1px solid white; padding: ' + str(
            button_margin) + 'px}'

        # text input for the build order
        self.text_input = QTextEdit(self)
        self.text_input.setPlainText(edit_init_text)
        self.text_input.setFont(QFont(font_police, font_size))
        self.text_input.setStyleSheet(style_text_edit)
        self.text_input.setVerticalScrollBarPolicy(Qt.ScrollBarAsNeeded)
        self.text_input.resize(edit_width, edit_height)
        self.text_input.move(border_size, border_size)
        self.text_input.show()
        max_width = border_size + self.text_input.width()

        # button to add build order
        self.update_button = QPushButton('Add build order', self)
        self.update_button.setFont(QFont(font_police, font_size))
        self.update_button.setStyleSheet(style_button)
        self.update_button.adjustSize()
        self.update_button.move(border_size, border_size + self.text_input.height() + vertical_spacing)
        self.update_button.clicked.connect(parent.add_build_order)
        self.update_button.show()

        # button to open build order folder
        self.folder_button = QPushButton('Open build orders folder', self)
        self.folder_button.setFont(QFont(font_police, font_size))
        self.folder_button.setStyleSheet(style_button)
        self.folder_button.adjustSize()
        self.folder_button.move(
            widget_x_end(self.update_button) + horizontal_spacing, self.update_button.y())
        self.folder_button.clicked.connect(lambda: subprocess.run(['explorer', build_order_folder]))
        self.folder_button.show()
        max_width = max(max_width, widget_x_end(self.folder_button))

        # open build order website
        self.website_link = None
        if len(build_order_website) == 2:
            assert isinstance(build_order_website[0], str) and isinstance(build_order_website[1], str)
            self.website_link = build_order_website[1]
            self.website_button = QPushButton(build_order_website[0], self)
            self.website_button.setFont(QFont(font_police, font_size))
            self.website_button.setStyleSheet(style_button)
            self.website_button.adjustSize()
            self.website_button.move(
                widget_x_end(self.folder_button) + horizontal_spacing, self.folder_button.y())
            self.website_button.clicked.connect(self.open_website)
            self.website_button.show()
            max_width = max(max_width, widget_x_end(self.website_button))

        # window properties and show
        self.setWindowTitle('New build order')
        self.setWindowIcon(QIcon(game_icon))
        self.resize(max_width + border_size, widget_y_end(self.update_button) + border_size)
        set_background_opacity(self, color_background, opacity)
        self.show()

    def open_website(self):
        """Open the build order website"""
        if self.website_link is not None:
            webbrowser.open(self.website_link)

    def closeEvent(self, _):
        """Called when clicking on the cross icon (closing window icon)"""
        super().close()


class RTSGameOverlay(QMainWindow):
    """RTS game overlay application"""

    def __init__(self, directory_main: str, name_game: str, settings_name: str, settings_class,
                 check_valid_build_order, build_order_category_name: str = None):
        """Constructor

        Parameters
        ----------
        directory_main               directory where the main file is located
        name_game                    name of the game (for pictures folder)
        settings_name                name of the settings (to load/save)
        settings_class               settings class
        check_valid_build_order      function to check if a build order is valid
        build_order_category_name    if not None, accept build orders with same name,
                                     provided they are in different categories
        """
        super().__init__()

        # initialization not yet done
        self.init_done = False

        # directories
        self.directory_main = directory_main  # main file
        self.directory_build_orders = os.path.join(self.directory_main, 'build_orders', name_game)  # build orders
        self.directory_game_pictures = os.path.join(self.directory_main, 'pictures', name_game)  # game pictures
        self.directory_common_pictures = os.path.join(self.directory_main, 'pictures', 'common')  # common pictures

        # settings
        self.unscaled_settings = settings_class()
        self.default_settings = deepcopy(self.unscaled_settings)
        self.settings_file = os.path.join(self.directory_main, settings_name)

        # check if settings can be loaded from existing file
        if os.path.exists(self.settings_file):  # settings file found
            try:
                with open(self.settings_file, 'rb') as f:
                    dict_data = json.load(f)
                    self.unscaled_settings.from_dict(dict_data)
                print(f'Loading parameters from {self.settings_file}.')
            except KeyError as e:
                print(f'Obtained KeyError {e} while reading the parameters from {self.settings_file}.')
                print('Loading default parameters.')
                del self.unscaled_settings
                self.unscaled_settings = settings_class()
        else:  # no settings file found
            print('Loading default parameters.')

            # check that the upper right corner is inside the screen
            screen_size = QDesktopWidget().screenGeometry(-1)

            if self.unscaled_settings.layout.upper_right_position[0] >= screen_size.width():
                print(f'Upper right corner X position set to {(screen_size.width() - 20)} (to stay inside screen).')
                self.unscaled_settings.layout.upper_right_position[0] = screen_size.width() - 20

            if self.unscaled_settings.layout.upper_right_position[1] >= screen_size.height():
                print(f'Upper right corner Y position set to {(screen_size.height() - 40)} (to stay inside screen).')
                self.unscaled_settings.layout.upper_right_position[1] = screen_size.height() - 40

            # save the settings
            self.save_settings()

        # font size and scaling combo
        self.font_size_input = QComboBox(self)
        self.font_size_input.currentIndexChanged.connect(self.font_size_combo_box_change)
        self.font_size_input_combo_ids = []  # corresponding IDs
        self.font_size_input_selected_id = 0  # selected ID for this combo box

        self.scaling_input = QComboBox(self)
        self.scaling_input.currentIndexChanged.connect(self.scaling_combo_box_change)
        self.scaling_input_combo_ids = []  # corresponding IDs
        self.scaling_input_selected_id = 0  # selected ID for this combo box

        self.font_size_scaling_initialization()

        # scaling the settings
        self.settings = deepcopy(self.unscaled_settings)
        self.settings_scaling()

        # title and icon
        images = self.settings.images
        self.setWindowTitle(self.settings.title)
        self.game_icon = os.path.join(self.directory_common_pictures, images.game_icon)
        self.setWindowIcon(QIcon(self.game_icon))

        # Display panel
        self.hidden = False  # True to hide the window (0 opacity), False to display it

        # mouse position
        self.mouse_x = 0
        self.mouse_y = 0

        self.stop_application = False  # True if application must be stopped

        # build order selection
        print('Loading the build orders.')
        self.valid_build_orders = []  # valid build orders names
        self.build_order_selection_id = 0  # ID selection of the build order in list
        self.selected_build_order = None  # selected build order
        self.selected_build_order_name = None  # selected build order name
        self.selected_build_order_step_count = 0  # selected build order count of steps
        self.selected_build_order_step_id = -1  # selected build order step ID
        self.check_valid_build_order = check_valid_build_order
        self.build_order_category_name = build_order_category_name
        self.build_orders = get_build_orders(self.directory_build_orders, check_valid_build_order,
                                             category_name=self.build_order_category_name)

        # selected username
        self.selected_username = self.settings.username if (len(self.settings.username) > 0) else None

        # move window
        self.setMouseTracking(True)  # mouse tracking
        self.left_click_start = False  # left click pressing started
        self.old_pos = self.pos()  # old position of the window
        self.init_x = self.frameGeometry().x()  # initial mouse X position
        self.init_y = self.frameGeometry().y()  # initial mouse Y position

        # build order selection
        layout = self.settings.layout
        self.build_order_title = QLabel('Build order', self)
        self.build_order_search = QLineEdit(self)
        self.build_order_search.textChanged.connect(self.update_build_order_display)
        self.build_order_selection = MultiQLabelDisplay(
            font_police=layout.font_police, font_size=layout.font_size, border_size=layout.border_size,
            vertical_spacing=layout.configuration.build_order_selection_vertical_spacing,
            color_default=layout.color_default)

        # username selection
        self.username_title = QLabel('Username', self)
        self.username_search = QLineEdit(self)
        self.username_selection = MultiQLabelDisplay(
            font_police=layout.font_police, font_size=layout.font_size, border_size=layout.border_size,
            vertical_spacing=layout.vertical_spacing, color_default=layout.color_default)

        # configuration elements initialization
        self.build_order_step = QLabel('Step: 0/0', self)
        self.configuration_initialization()

        self.build_order_resources = MultiQLabelDisplay(
            font_police=layout.font_police, font_size=layout.font_size, image_height=layout.build_order.image_height,
            border_size=layout.border_size, vertical_spacing=layout.vertical_spacing,
            color_default=layout.color_default, game_pictures_folder=self.directory_game_pictures,
            common_pictures_folder=self.directory_common_pictures)

        self.build_order_notes = MultiQLabelDisplay(
            font_police=layout.font_police, font_size=layout.font_size, image_height=layout.build_order.image_height,
            border_size=layout.border_size, vertical_spacing=layout.vertical_spacing,
            color_default=layout.color_default, game_pictures_folder=self.directory_game_pictures)

        # display match data information
        self.match_data_display = MultiQLabelDisplay(
            font_police=layout.font_police, font_size=layout.font_size,
            image_height=layout.match_data.image_height, border_size=layout.border_size,
            vertical_spacing=layout.vertical_spacing, color_default=layout.color_default,
            game_pictures_folder=self.directory_game_pictures, common_pictures_folder=self.directory_common_pictures)

        # window color and position
        self.upper_right_position = [0, 0]
        self.window_color_position_initialization()

        # next panel configuration button
        action_button_qsize = QSize(self.settings.layout.action_button_size, self.settings.layout.action_button_size)

        self.next_panel_button = TwinHoverButton(
            parent=self, click_connect=self.next_panel,
            icon=QIcon(os.path.join(self.directory_common_pictures, images.next_panel)),
            button_qsize=action_button_qsize, tooltip='next panel')

        # configuration panel buttons
        self.config_quit_button = TwinHoverButton(
            parent=self, click_connect=self.quit_application,
            icon=QIcon(os.path.join(self.directory_common_pictures, images.quit)),
            button_qsize=action_button_qsize, tooltip='quit application')

        self.config_save_button = TwinHoverButton(
            parent=self, click_connect=self.save_settings,
            icon=QIcon(os.path.join(self.directory_common_pictures, images.save)),
            button_qsize=action_button_qsize, tooltip='save settings')

        self.config_reload_button = TwinHoverButton(
            parent=self, click_connect=self.reload, click_connect_args=True,
            icon=QIcon(os.path.join(self.directory_common_pictures, images.load)),
            button_qsize=action_button_qsize, tooltip='reload settings')

        self.config_hotkey_button = TwinHoverButton(
            parent=self, click_connect=self.panel_configure_hotkeys,
            icon=QIcon(os.path.join(self.directory_common_pictures, images.config_hotkeys)),
            button_qsize=action_button_qsize, tooltip='configure hotkeys')

        self.config_build_order_button = TwinHoverButton(
            parent=self, click_connect=self.panel_add_build_order,
            icon=QIcon(os.path.join(self.directory_common_pictures, images.write_build_order)),
            button_qsize=action_button_qsize, tooltip='write/paste build order')

        # build order panel buttons
        self.build_order_previous_button = TwinHoverButton(
            parent=self, click_connect=self.build_order_previous_step,
            icon=QIcon(os.path.join(self.directory_common_pictures, images.build_order_previous_step)),
            button_qsize=action_button_qsize, tooltip='previous build order step')

        self.build_order_next_button = TwinHoverButton(
            parent=self, click_connect=self.build_order_next_step,
            icon=QIcon(os.path.join(self.directory_common_pictures, images.build_order_next_step)),
            button_qsize=action_button_qsize, tooltip='next build order step')

        # enter key selection
        hotkeys = self.settings.hotkeys
        self.hotkey_enter = QShortcut(QKeySequence(hotkeys.enter), self)
        self.hotkey_enter.activated.connect(self.enter_key_actions)

        # select the next build order
        self.hotkey_next_build_order = QShortcut(QKeySequence(hotkeys.select_next_build_order), self)
        self.hotkey_next_build_order.activated.connect(self.select_build_order_id)

        # keyboard global hotkeys
        self.hotkey_names = ['next_panel', 'show_hide', 'build_order_previous_step', 'build_order_next_step']
        self.keyboard = KeyboardManagement(print_unset=False)
        self.keyboard.update_hotkey('next_panel', hotkeys.next_panel)
        self.keyboard.update_hotkey('show_hide', hotkeys.show_hide)
        self.keyboard.update_hotkey('build_order_previous_step', hotkeys.build_order_previous_step)
        self.keyboard.update_hotkey('build_order_next_step', hotkeys.build_order_next_step)

        # configure hotkeys
        self.panel_config_hotkeys = None

        # add build order
        self.panel_add_build_order = None

        # initialization done
        self.init_done = True

    def reload(self, update_settings):
        """Reload the application settings, build orders...

        Parameters
        ----------
        update_settings   True to update (reload) the settings, False to keep the current ones
        """

        # re-initialization not yet done
        self.init_done = False
        self.config_reload_button.hide()

        # settings
        if update_settings:
            if os.path.exists(self.settings_file):
                with open(self.settings_file, 'rb') as f:
                    dict_data = json.load(f)
                    self.unscaled_settings.from_dict(dict_data)
                print(f'Reloading parameters from {self.settings_file}.')
            else:
                self.unscaled_settings = deepcopy(self.default_settings)
                print('No user settings file saved, resetting to default values.')
        else:
            print('Reload without updating the settings.')

        # font size and scaling combo
        self.font_size_scaling_initialization()

        # scaling the settings
        self.settings = deepcopy(self.unscaled_settings)
        self.settings_scaling()

        # title and icon
        images = self.settings.images
        self.setWindowTitle(self.settings.title)
        self.game_icon = os.path.join(self.directory_common_pictures, images.game_icon)
        self.setWindowIcon(QIcon(self.game_icon))

        # reset build order selection
        print('Reloading the build orders.')
        self.valid_build_orders = []
        self.build_order_selection_id = 0
        self.selected_build_order = None
        self.selected_build_order_name = None
        self.selected_build_order_step_count = 0
        self.selected_build_order_step_id = -1
        self.build_orders = get_build_orders(self.directory_build_orders, self.check_valid_build_order,
                                             category_name=self.build_order_category_name)

        # selected username
        self.selected_username = self.settings.username if (len(self.settings.username) > 0) else None

        # move window
        self.left_click_start = False  # left click pressing started
        self.old_pos = self.pos()  # old position of the window
        self.init_x = self.frameGeometry().x()  # initial mouse X position
        self.init_y = self.frameGeometry().y()  # initial mouse Y position

        # build order selection
        layout = self.settings.layout
        self.build_order_selection.update_settings(
            font_police=layout.font_police, font_size=layout.font_size, border_size=layout.border_size,
            vertical_spacing=layout.configuration.build_order_selection_vertical_spacing,
            color_default=layout.color_default)

        # username selection
        self.username_selection.update_settings(
            font_police=layout.font_police, font_size=layout.font_size, border_size=layout.border_size,
            vertical_spacing=layout.vertical_spacing, color_default=layout.color_default)

        # configuration elements initialization
        self.configuration_initialization()

        # display build order
        self.build_order_resources.update_settings(
            font_police=layout.font_police, font_size=layout.font_size,
            image_height=layout.build_order.image_height,
            border_size=layout.border_size, vertical_spacing=layout.vertical_spacing,
            color_default=layout.color_default)

        self.build_order_notes.update_settings(
            font_police=layout.font_police, font_size=layout.font_size,
            image_height=layout.build_order.image_height,
            border_size=layout.border_size, vertical_spacing=layout.vertical_spacing,
            color_default=layout.color_default)

        # display match data information
        self.match_data_display.update_settings(
            font_police=layout.font_police, font_size=layout.font_size,
            image_height=layout.match_data.image_height, border_size=layout.border_size,
            vertical_spacing=layout.vertical_spacing, color_default=layout.color_default)

        # window color and position
        self.window_color_position_initialization()

        # next panel configuration button
        action_button_qsize = QSize(self.settings.layout.action_button_size, self.settings.layout.action_button_size)

        self.next_panel_button.update_icon_size(
            icon=QIcon(os.path.join(self.directory_common_pictures, images.next_panel)),
            button_qsize=action_button_qsize)

        # configuration panel buttons
        self.config_quit_button.update_icon_size(
            QIcon(os.path.join(self.directory_common_pictures, images.quit)), action_button_qsize)

        self.config_save_button.update_icon_size(
            QIcon(os.path.join(self.directory_common_pictures, images.save)), action_button_qsize)

        self.config_reload_button.update_icon_size(
            QIcon(os.path.join(self.directory_common_pictures, images.load)), action_button_qsize)

        self.config_hotkey_button.update_icon_size(
            QIcon(os.path.join(self.directory_common_pictures, images.config_hotkeys)), action_button_qsize)

        self.config_build_order_button.update_icon_size(
            QIcon(os.path.join(self.directory_common_pictures, images.write_build_order)), action_button_qsize)

        # build order panel buttons
        self.build_order_previous_button.update_icon_size(
            QIcon(os.path.join(self.directory_common_pictures, images.build_order_previous_step)), action_button_qsize)

        self.build_order_next_button.update_icon_size(
            QIcon(os.path.join(self.directory_common_pictures, images.build_order_next_step)), action_button_qsize)

        # hotkeys
        hotkeys = self.settings.hotkeys
        self.hotkey_enter.setKey(QKeySequence(hotkeys.enter))
        self.hotkey_next_build_order.setKey(QKeySequence(hotkeys.select_next_build_order))

        # keyboard global hotkeys
        self.keyboard.update_hotkey('next_panel', hotkeys.next_panel)
        self.keyboard.update_hotkey('show_hide', hotkeys.show_hide)
        self.keyboard.update_hotkey('build_order_previous_step', hotkeys.build_order_previous_step)
        self.keyboard.update_hotkey('build_order_next_step', hotkeys.build_order_next_step)

        # open popup message
        if update_settings:
            msg = QMessageBox()
            msg.setWindowTitle('RTS Overlay - Reload')
            if os.path.exists(self.settings_file):
                msg.setText(f'Settings reloaded using the parameters from {self.settings_file}.')
            else:
                msg.setText(f'Settings reloaded with the default values ({self.settings_file} not generated).')
            msg.setIcon(QMessageBox.Information)
            msg.exec_()

        # re-initialization done
        self.init_done = True

    def font_size_scaling_initialization(self):
        """Font size and scaling combo initialization (common to constructor and reload)"""
        layout = self.unscaled_settings.layout
        color_default = layout.color_default
        color_default_str = f'color: rgb({color_default[0]}, {color_default[1]}, {color_default[2]})'
        qwidget_color_default_str = f'QWidget{{ {color_default_str} }};'

        # font size combo
        font_size_limits = layout.configuration.font_size_limits
        assert len(font_size_limits) == 2
        self.font_size_input.clear()
        self.font_size_input_combo_ids = []
        self.font_size_input_selected_id = 0

        # loop on the font size inputs
        for count, font_size in enumerate(range(font_size_limits[0], font_size_limits[1] + 1)):
            self.font_size_input.addItem(f'{font_size} p')
            self.font_size_input_combo_ids.append(font_size)
            if font_size == layout.font_size:
                self.font_size_input_selected_id = count

        self.font_size_input.setStyleSheet(qwidget_color_default_str)
        self.font_size_input.setFont(QFont(layout.font_police, layout.font_size))
        self.font_size_input.setCurrentIndex(self.font_size_input_selected_id)
        self.font_size_input.setToolTip('font size')
        self.font_size_input.adjustSize()

        # scaling combo
        assert len(layout.configuration.scaling_list) > 0
        self.scaling_input.clear()
        self.scaling_input_combo_ids = []
        self.scaling_input_selected_id = 0

        for count, scaling in enumerate(layout.configuration.scaling_list):  # loop on the scaling inputs
            self.scaling_input.addItem(f'{scaling} %')
            self.scaling_input_combo_ids.append(scaling)
            if scaling == layout.scaling:
                self.scaling_input_selected_id = count

        self.scaling_input.setStyleSheet(qwidget_color_default_str)
        self.scaling_input.setFont(QFont(layout.font_police, layout.font_size))
        self.scaling_input.setCurrentIndex(self.scaling_input_selected_id)
        self.scaling_input.setToolTip('scaling of pictures, spacing...')
        self.scaling_input.adjustSize()

    def configuration_initialization(self):
        """Configuration elements initialization (common to constructor and reload)"""
        layout = self.settings.layout
        color_default = layout.color_default
        color_default_str = f'color: rgb({color_default[0]}, {color_default[1]}, {color_default[2]})'
        qwidget_color_default_str = f'QWidget{{ {color_default_str}; border: 1px solid white }};'

        # title for the build order search bar
        self.build_order_title.setStyleSheet(color_default_str)
        self.build_order_title.setFont(QFont(layout.font_police, layout.font_size))
        self.build_order_title.adjustSize()

        # build order search bar
        self.build_order_search.resize(layout.configuration.build_order_search_size[0],
                                       layout.configuration.build_order_search_size[1])
        self.build_order_search.setStyleSheet(qwidget_color_default_str)
        self.build_order_search.setFont(QFont(layout.font_police, layout.font_size))
        self.build_order_search.setToolTip('build order keywords, separated by spaces')

        # indicating the build orders selection
        self.build_order_selection.clear()
        self.build_order_selection.add_row_from_picture_line(parent=self, line='no build order')

        # title for the username search bar
        self.username_title.setStyleSheet(color_default_str)
        self.username_title.setFont(QFont(layout.font_police, layout.font_size))
        self.username_title.adjustSize()

        # username search bar
        self.username_search.resize(layout.configuration.username_search_size[0],
                                    layout.configuration.username_search_size[1])
        self.username_search.setStyleSheet(qwidget_color_default_str)
        self.username_search.setFont(QFont(layout.font_police, layout.font_size))
        self.username_search.setToolTip('username, profile ID or steam ID')

        # indicating the selected username
        self.select_username(self.settings.username)

        # selected step of the build order
        self.build_order_step.setStyleSheet(color_default_str)
        self.build_order_step.setFont(QFont(layout.font_police, layout.font_size))
        self.build_order_step.adjustSize()

    def window_color_position_initialization(self):
        """Main window color and position initialization (common to constructor and reload)"""
        layout = self.settings.layout
        color_background = layout.color_background

        # color and opacity
        set_background_opacity(self, color_background, layout.opacity)

        # upper right position
        self.upper_right_position = [layout.upper_right_position[0], layout.upper_right_position[1]]
        self.update_position()

    def settings_scaling(self):
        """Apply the scaling on the settings"""
        assert 0 <= self.scaling_input_selected_id < len(self.scaling_input_combo_ids)
        layout = self.settings.layout
        unscaled_layout = self.unscaled_settings.layout
        scaling = self.scaling_input_combo_ids[self.scaling_input_selected_id] / 100.0  # [%] -> [-]

        layout.border_size = scale_int(scaling, unscaled_layout.border_size)
        layout.vertical_spacing = scale_int(scaling, unscaled_layout.vertical_spacing)
        layout.horizontal_spacing = scale_int(scaling, unscaled_layout.horizontal_spacing)
        layout.action_button_size = scale_int(scaling, unscaled_layout.action_button_size)
        layout.action_button_spacing = scale_int(scaling, unscaled_layout.action_button_spacing)

        configuration = layout.configuration
        unscaled_configuration = unscaled_layout.configuration
        configuration.search_spacing = scale_int(scaling, unscaled_configuration.search_spacing)
        configuration.build_order_search_size = scale_list_int(
            scaling, unscaled_configuration.build_order_search_size)
        configuration.username_search_size = scale_list_int(scaling, unscaled_configuration.username_search_size)
        configuration.build_order_selection_vertical_spacing = scale_int(
            scaling, unscaled_configuration.build_order_selection_vertical_spacing)

        build_order = layout.build_order
        unscaled_build_order = unscaled_layout.build_order
        build_order.image_height = scale_int(scaling, unscaled_build_order.image_height)
        build_order.resource_spacing = scale_int(scaling, unscaled_build_order.resource_spacing)
        build_order.bo_next_tab_spacing = scale_int(scaling, unscaled_build_order.bo_next_tab_spacing)

        match_data = layout.match_data
        unscaled_match_data = unscaled_layout.match_data
        match_data.image_height = scale_int(scaling, unscaled_match_data.image_height)
        match_data.flag_width = scale_int(scaling, unscaled_match_data.flag_width)
        match_data.flag_height = scale_int(scaling, unscaled_match_data.flag_height)
        match_data.resource_spacing = scale_int(scaling, unscaled_match_data.resource_spacing)

    def quit_application(self):
        """Quit the application"""
        self.stop_application = True
        print('Stopping the application.')

        self.hide()  # hide the application while closing it
        self.config_quit_button.hide()

        self.config_quit_button.close()
        self.config_save_button.close()
        self.config_reload_button.close()
        self.config_hotkey_button.close()
        self.config_build_order_button.close()

        self.next_panel_button.close()
        self.build_order_previous_button.close()
        self.build_order_next_button.close()

        if (self.panel_config_hotkeys is not None) and self.panel_config_hotkeys.isVisible():
            self.panel_config_hotkeys.close()
            self.panel_config_hotkeys = None

        if (self.panel_add_build_order is not None) and self.panel_add_build_order.isVisible():
            self.panel_add_build_order.close()
            self.panel_add_build_order = None

    def font_size_combo_box_change(self, value):
        """Detect when the font size changed

        Parameters
        ----------
        value    ID of the new font size in 'self.font_size_input_combo_ids'
        """
        if self.init_done and (0 <= value < len(self.font_size_input_combo_ids)):
            self.settings.layout.font_size = self.font_size_input_combo_ids[value]
            self.unscaled_settings.layout.font_size = self.font_size_input_combo_ids[value]
            print(f'Font size updated to {self.font_size_input_combo_ids[value]}.')
            self.reload(update_settings=False)

    def scaling_combo_box_change(self, value):
        """Detect when the scaling changed

        Parameters
        ----------
        value    ID of the new scaling in 'self.scaling_input_combo_ids'
        """
        if self.init_done and (0 <= value < len(self.scaling_input_combo_ids)):
            self.settings.layout.scaling = self.scaling_input_combo_ids[value]
            self.unscaled_settings.layout.scaling = self.scaling_input_combo_ids[value]
            print(f'Scaling updated to {self.scaling_input_combo_ids[value]}.')
            self.reload(update_settings=False)

    def panel_configure_hotkeys(self):
        """Open/close the panel to configure the hotkeys"""
        if (self.panel_config_hotkeys is not None) and self.panel_config_hotkeys.isVisible():  # close panel
            self.panel_config_hotkeys.close()
            self.panel_config_hotkeys = None
        else:  # open new panel
            config = self.settings.panel_hotkeys
            self.panel_config_hotkeys = HotkeysWindow(
                parent=self, game_icon=self.game_icon, settings_folder=self.directory_main,
                font_police=config.font_police, font_size=config.font_size,
                color_font=config.color_font, color_background=config.color_background, opacity=config.opacity,
                border_size=config.border_size, edit_width=config.edit_width, edit_height=config.edit_height,
                button_margin=config.button_margin, vertical_spacing=config.vertical_spacing,
                horizontal_spacing=config.horizontal_spacing)

    def panel_add_build_order(self):
        """Open/close the panel to add a build order"""
        if (self.panel_add_build_order is not None) and self.panel_add_build_order.isVisible():  # close panel
            self.panel_add_build_order.close()
            self.panel_add_build_order = None
        else:  # open new panel
            config = self.settings.panel_build_order
            self.panel_add_build_order = BuildOrderWindow(
                parent=self, game_icon=self.game_icon, build_order_folder=self.directory_build_orders,
                font_police=config.font_police, font_size=config.font_size, color_font=config.color_font,
                color_background=config.color_background, opacity=config.opacity, border_size=config.border_size,
                edit_width=config.edit_width, edit_height=config.edit_height, edit_init_text=config.edit_init_text,
                button_margin=config.button_margin, vertical_spacing=config.vertical_spacing,
                horizontal_spacing=config.horizontal_spacing, build_order_website=config.build_order_website)

    def timer_mouse_keyboard_call(self):
        """Function called on a timer (related to mouse and keyboard inputs)"""
        self.update_mouse()  # update the mouse position

        # next panel button
        self.next_panel_button.hovering_show(self.is_mouse_in_roi_widget)

        # build order hovering
        if len(self.valid_build_orders) > 1:  # more than one build order for hovering color
            # get build order ID for hovering
            build_order_ids = self.build_order_selection.get_mouse_label_id(
                self.mouse_x - self.x(), self.mouse_y - self.y())
            hovering_id = build_order_ids[0] if ((len(build_order_ids) == 2) and (build_order_ids[1] == 0) and (
                    0 <= build_order_ids[0] < len(self.valid_build_orders))) else -1

            # loop on the build order suggestions
            for row_id in range(len(self.valid_build_orders)):
                if row_id != self.build_order_selection_id:
                    self.build_order_selection.set_color_label(
                        row_id, 0,
                        color=self.settings.layout.configuration.hovering_build_order_color if (
                                row_id == hovering_id) else None)

        # keyboard action flags
        if (self.panel_config_hotkeys is None) or (not self.panel_config_hotkeys.isVisible()):
            if self.keyboard.get_flag('next_panel'):  # switch to next panel
                self.next_panel()

            if self.keyboard.get_flag('show_hide'):  # show/hide overlay
                self.show_hide()

            if self.keyboard.get_flag('build_order_previous_step'):  # select previous step of the build order
                self.build_order_previous_step()

            if self.keyboard.get_flag('build_order_next_step'):  # select next step of the build order
                self.build_order_next_step()

    def show_hide(self):
        """Show or hide the windows"""
        self.hidden = not self.hidden  # change the hidden state

        # adapt opacity
        if self.hidden:
            self.setWindowOpacity(0.0)
        else:
            self.setWindowOpacity(self.settings.layout.opacity)

    def update_hotkeys(self):
        """Update the hotkeys and the settings file"""
        config_hotkeys = self.panel_config_hotkeys.hotkeys
        settings_hotkeys = self.unscaled_settings.hotkeys

        # update the hotkeys
        print('Hotkeys update:')
        for hotkey_name in self.hotkey_names:
            hotkey_str = config_hotkeys[hotkey_name].get_str()
            if hotkey_str == '':
                self.keyboard.remove_hotkey(hotkey_name)
                print(f'    {hotkey_name}: disabled')
            else:
                self.keyboard.update_hotkey(hotkey_name, hotkey_str)
                print(f'    {hotkey_name}: {hotkey_str}')

        # save the settings with the updated hotkeys
        settings_hotkeys.next_panel = config_hotkeys['next_panel'].get_str()
        settings_hotkeys.show_hide = config_hotkeys['show_hide'].get_str()
        settings_hotkeys.build_order_previous_step = config_hotkeys['build_order_previous_step'].get_str()
        settings_hotkeys.build_order_next_step = config_hotkeys['build_order_next_step'].get_str()
        self.save_settings()

    def add_build_order(self):
        """Try to add the build order written in the new build order panel"""
        msg_text = None
        try:
            # get data as dictionary
            build_order_data = json.loads(self.panel_add_build_order.text_input.toPlainText())

            # check if build order content is valid
            if self.check_valid_build_order(build_order_data):
                name = build_order_data['name']  # name of the build order

                # check if build order is a new one
                if is_build_order_new(self.build_orders, build_order_data, self.build_order_category_name):

                    # output filename
                    output_name = f'{name}.json'
                    if (self.build_order_category_name is not None) and (
                            self.build_order_category_name in build_order_data):
                        output_name = os.path.join(build_order_data[self.build_order_category_name], output_name)
                    output_name = output_name.replace(' ', '_')  # replace spaces in the name
                    out_filename = os.path.join(self.directory_build_orders, output_name)

                    # check file does not exist
                    if not os.path.isfile(out_filename):
                        # create output directory if not existent
                        os.makedirs(os.path.dirname(out_filename), exist_ok=True)
                        # write JSON file
                        with open(out_filename, 'w') as f:
                            f.write(json.dumps(build_order_data, sort_keys=False, indent=4))
                        # add build order to list
                        self.build_orders.append(build_order_data)
                        # clear input
                        self.panel_add_build_order.text_input.clear()
                        msg_text = f'Build order \'{name}\' added and saved as \'{out_filename}\'.'
                    else:
                        msg_text = f'Output file \'{out_filename}\' already exists (build order not added).'
                else:
                    msg_text = f'Build order already exists with the name \'{name}\' (not added).'
            else:
                msg_text = 'Build order content is not valid.'

        except json.JSONDecodeError:
            if msg_text is None:
                msg_text = 'Error while trying to decode the build order JSON format (non valid JSON format).'

        except:
            if msg_text is None:
                msg_text = 'Unknown error while trying to add the build order.'

        # open popup message
        msg = QMessageBox()
        msg.setWindowTitle('RTS Overlay - Adding new build order')
        msg.setText(msg_text)
        msg.setIcon(QMessageBox.Information)
        msg.exec_()

    def save_settings(self):
        """Save the settings"""
        msg_text = f'Settings saved in {self.settings_file}.'  # message to display
        with open(self.settings_file, 'w') as f:
            f.write(json.dumps(self.unscaled_settings.to_dict(), sort_keys=False, indent=4))
            print(msg_text)

        # open popup message
        msg = QMessageBox()
        msg.setWindowTitle('RTS Overlay - Settings saved')
        msg.setText(msg_text)
        msg.setIcon(QMessageBox.Information)
        msg.exec_()

    def update_mouse(self):
        """Update the mouse position"""
        pos = QCursor().pos()
        self.mouse_x = pos.x()
        self.mouse_y = pos.y()

    def is_mouse_in_roi(self, x: int, y: int, width: int, height: int) -> bool:
        """Check if the last updated mouse position (using 'update_mouse') is in a ROI

        Parameters
        ----------
        x         X position of the ROI (on the screen)
        y         Y position of the ROI (on the screen)
        width     width of the ROI
        height    height of the ROI

        Returns
        -------
        True if in the ROI
        """
        return (x <= self.mouse_x <= x + width) and (y <= self.mouse_y <= y + height)

    def is_mouse_in_window(self) -> bool:
        """Checks if the mouse is in the current window

        Returns
        -------
        True if mouse is in the window
        """
        return self.is_mouse_in_roi(self.x(), self.y(), self.width(), self.height())

    def is_mouse_in_roi_widget(self, widget: QWidget) -> bool:
        """Check if the last updated mouse position (using 'update_mouse') is in the ROI of a widget

        Parameters
        ----------
        widget    widget to check

        Returns
        -------
        True if mouse is in the ROI
        """
        return self.is_mouse_in_roi(
            x=self.x() + widget.x(), y=self.y() + widget.y(), width=widget.width(), height=widget.height())

    def move_window(self, event):
        """Move the window according to the mouse motion

        Parameters
        ----------
        event    mouse event
        """
        QApplication.setOverrideCursor(Qt.ArrowCursor)  # set arrow cursor

        if event.buttons() == Qt.NoButton:  # no button pressed
            self.left_click_start = False
        elif event.buttons() == Qt.LeftButton:  # pressing the left button
            if not self.left_click_start:  # starting to press the button
                self.init_x = self.frameGeometry().x()
                self.init_y = self.frameGeometry().y()
                self.old_pos = event.globalPos()
                self.left_click_start = True

            delta = QPoint(event.globalPos() - self.old_pos)  # motion of the mouse
            self.move(self.init_x + delta.x(), self.init_y + delta.y())  # moving the window accordingly
            # update the window position in the settings (for potential save)
            self.settings.layout.upper_right_position = [widget_x_end(self), self.y()]
            self.unscaled_settings.layout.upper_right_position = [widget_x_end(self), self.y()]

    def build_order_click_select(self, event):
        """Check if a build order is being clicked

        Parameters
        ----------
        event    mouse event
        """
        if event.buttons() == Qt.LeftButton:  # pressing the left button
            if len(self.valid_build_orders) >= 1:  # at least one build order
                self.update_mouse()
                build_order_ids = self.build_order_selection.get_mouse_label_id(
                    self.mouse_x - self.x(), self.mouse_y - self.y())
                if (len(build_order_ids) == 2) and (build_order_ids[1] == 0) and (
                        0 <= build_order_ids[0] < len(self.valid_build_orders)):
                    if not self.select_build_order_id(build_order_ids[0]):
                        print(f'Could not select build order with ID {build_order_ids[0]}.')

    def save_upper_right_position(self):
        """Save of the upper right corner position"""
        self.upper_right_position = [widget_x_end(self), self.y()]

    def update_position(self):
        """Update the position to stick to the saved upper right corner"""
        self.move(self.upper_right_position[0] - self.width(), self.upper_right_position[1])

    def build_order_previous_step(self) -> bool:
        """Select the previous step of the build order

        Returns
        -------
        True if build order step changed
        """
        old_selected_build_order_step_id = self.selected_build_order_step_id
        self.selected_build_order_step_id = max(0, min(self.selected_build_order_step_id - 1,
                                                       self.selected_build_order_step_count - 1))
        return old_selected_build_order_step_id != self.selected_build_order_step_id

    def build_order_next_step(self) -> bool:
        """Select the next step of the build order

        Returns
        -------
        True if build order step changed
        """
        old_selected_build_order_step_id = self.selected_build_order_step_id
        self.selected_build_order_step_id = max(0, min(self.selected_build_order_step_id + 1,
                                                       self.selected_build_order_step_count - 1))
        return old_selected_build_order_step_id != self.selected_build_order_step_id

    def select_build_order_id(self, build_order_id: int = -1) -> bool:
        """Select build order ID

        Parameters
        ----------
        build_order_id    ID of the build order, negative to select next build order

        Returns
        -------
        True if valid build order selection
        """
        if len(self.valid_build_orders) >= 1:  # at least one build order
            if build_order_id >= 0:  # build order ID given
                if 0 <= build_order_id < len(self.valid_build_orders):
                    self.build_order_selection_id = build_order_id
                else:
                    return False
            else:  # select next build order
                self.build_order_selection_id += 1
                if self.build_order_selection_id >= len(self.valid_build_orders):
                    self.build_order_selection_id = 0
            return True
        return False

    def get_valid_build_orders(self, key_condition: dict = None):
        """Get the names of the valid build orders (with search bar)

        Parameters
        ----------
        key_condition   dictionary with the keys to look for and their value (to consider as valid), None to skip it
        """
        self.valid_build_orders = []  # reset the list
        build_order_search_string = self.build_order_search.text()

        if build_order_search_string == '':  # no text added
            return

        # only keep build orders with valid key conditions
        if key_condition is not None:
            valid_key_build_orders = [build_order for build_order in self.build_orders if
                                      check_build_order_key_values(build_order, key_condition)]
        else:
            valid_key_build_orders = self.build_orders

        configuration = self.settings.layout.configuration
        if build_order_search_string == ' ':  # special case: select any build order, up to the limit count
            for count, build_order in enumerate(valid_key_build_orders):
                if count >= configuration.bo_list_max_count:
                    break
                self.valid_build_orders.append(build_order['name'])

        elif configuration.bo_list_fuzz_search:  # do a fuzzy search for matching build orders
            self.valid_build_orders = [match[0] for match in process.extractBests(
                build_order_search_string,
                [build_order['name'] for build_order in valid_key_build_orders],
                score_cutoff=configuration.bo_list_fuzz_score_cutoff,
                limit=configuration.bo_list_max_count
            )]

        else:  # search by splitting the words
            search_split = build_order_search_string.split(' ')  # split according to spaces

            for build_order in self.build_orders:
                if len(self.valid_build_orders) >= configuration.bo_list_max_count:
                    break

                valid_name = True  # assumes valid name
                build_order_name = build_order['name']
                for search_part in search_split:  # loop on the sub-parts to find
                    if search_part.lower() not in build_order_name.lower():
                        valid_name = False
                        break
                if valid_name:  # add valid build order
                    self.valid_build_orders.append(build_order_name)

        # check all elements are unique
        assert len(set(self.valid_build_orders)) == len(self.valid_build_orders)

        # limit build order selection ID
        if self.build_order_selection_id >= len(self.valid_build_orders):
            self.build_order_selection_id = max(0, len(self.valid_build_orders) - 1)

    def obtain_build_order_search(self, key_condition: dict = None):
        """Obtain the valid build order from search bar

        Parameters
        ----------
        key_condition   dictionary with the keys to look for and their value (to consider as valid), None to skip it
        """
        self.get_valid_build_orders(key_condition)
        valid_count = len(self.valid_build_orders)
        self.build_order_selection.clear()

        if valid_count > 0:
            assert 0 <= self.build_order_selection_id < valid_count

            for i in range(valid_count):
                if i == self.build_order_selection_id:
                    self.build_order_selection.add_row_from_picture_line(
                        parent=self, line=self.valid_build_orders[i], labels_settings=[QLabelSettings(
                            text_bold=True, text_color=self.settings.layout.configuration.selected_build_order_color)])
                else:
                    self.build_order_selection.add_row_from_picture_line(parent=self, line=self.valid_build_orders[i])
        else:
            if self.selected_build_order is None:
                self.build_order_selection.add_row_from_picture_line(parent=self, line='no build order')

    def select_build_order(self, key_condition: dict = None):
        """Select the requested valid build order

        Parameters
        ----------
        key_condition   dictionary with the keys to look for and their value (to consider as valid), None to skip it
        """
        self.build_order_selection.clear()

        if len(self.valid_build_orders) > 0:  # valid
            assert 0 <= self.build_order_selection_id < len(self.valid_build_orders)
            self.selected_build_order_name = self.valid_build_orders[self.build_order_selection_id]

            self.selected_build_order = None
            for build_order in self.build_orders:
                if (build_order['name'] == self.selected_build_order_name) and check_build_order_key_values(
                        build_order, key_condition):
                    self.selected_build_order = build_order
                    break
            assert self.selected_build_order is not None

            self.selected_build_order_step_id = 0
            self.selected_build_order_step_count = len(self.selected_build_order['build_order'])
            assert self.selected_build_order_step_count > 0

            self.build_order_search.setText('')
            self.build_order_selection.add_row_from_picture_line(
                parent=self, line=self.selected_build_order_name, labels_settings=[QLabelSettings(
                    text_bold=True, text_color=self.settings.layout.configuration.selected_build_order_color)])
        else:  # not valid
            self.selected_build_order = None
            self.selected_build_order_name = None
            self.selected_build_order_step_count = 0
            self.selected_build_order_step_id = -1
            self.build_order_selection.clear()
            self.build_order_selection.add_row_from_picture_line(parent=self, line='no build order')
        self.build_order_search.clearFocus()

    def select_username(self, username: str = None):
        """Select the username

        Parameters
        ----------
        username    username to use, None to look in 'self.username_search'
        """
        username_search_string = username if (username is not None) else self.username_search.text()
        self.username_selection.clear()

        if username_search_string != '':
            self.selected_username = username_search_string
            self.username_search.setText('')
            self.username_selection.add_row_from_picture_line(
                parent=self, line=self.selected_username, labels_settings=[QLabelSettings(
                    text_bold=True, text_color=self.settings.layout.configuration.selected_username_color)])
            self.settings.username = self.selected_username
            self.unscaled_settings.username = self.selected_username
        else:
            self.selected_username = None
            self.username_selection.add_row_from_picture_line(parent=self, line='no username')
            self.settings.username = ''
            self.unscaled_settings.username = ''
        self.username_search.clearFocus()

    def hide_elements(self):
        """Hide elements"""

        # configuration buttons
        self.next_panel_button.hide()

        self.config_quit_button.hide()
        self.config_save_button.hide()
        self.config_reload_button.hide()
        self.config_hotkey_button.hide()
        self.config_build_order_button.hide()

        self.build_order_step.hide()
        self.build_order_previous_button.hide()
        self.build_order_next_button.hide()

        # police, scaling combo
        self.font_size_input.hide()
        self.scaling_input.hide()

        # search build order
        self.build_order_title.hide()
        self.build_order_search.hide()
        self.build_order_selection.hide()

        # search username
        self.username_title.hide()
        self.username_search.hide()
        self.username_selection.hide()

        # display build order
        self.build_order_resources.hide()
        self.build_order_notes.hide()

        # display match data
        self.match_data_display.hide()
