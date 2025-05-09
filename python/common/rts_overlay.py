import os
import json
import time
import appdirs
from math import floor
from enum import Enum
from copy import deepcopy
from thefuzz import process
from typing import Dict, Union

from PyQt5.QtWidgets import QMainWindow, QApplication, QLabel, QLineEdit
from PyQt5.QtWidgets import QWidget, QComboBox, QShortcut
from PyQt5.QtGui import QKeySequence, QFont, QIcon, QCursor
from PyQt5.QtCore import Qt, QPoint, QSize

from common.build_order_tools import get_build_orders, check_build_order_key_values, is_build_order_new, \
    get_build_order_timer_steps, get_build_order_timer_step_ids, get_build_order_timer_steps_display
from common.label_display import MultiQLabelDisplay, QLabelSettings
from common.useful_tools import TwinHoverButton, scale_int, scale_list_int, set_background_opacity, \
    widget_x_end, widget_y_end, popup_message
from common.keyboard_mouse import KeyboardMouseManagement
from common.rts_settings import KeyboardMouse
from common.hotkeys_window import HotkeysWindow


# ID of the panel to display
class PanelID(Enum):
    CONFIG = 0  # Configuration
    BUILD_ORDER = 1  # Display Build Order


class RTSGameOverlay(QMainWindow):
    """RTS game overlay application."""

    def __init__(self, app: QApplication, directory_main: str, name_game: str, settings_name: str, settings_class,
                 check_valid_build_order, get_build_order_step, get_build_order_template,
                 get_faction_selection, evaluate_build_order_timing=None, build_order_category_name: str = None,
                 build_order_timer_available: bool = True, build_order_timer_step_starting_flag: bool = True):
        """Constructor

        Parameters
        ----------
        app                                     Main application instance.
        directory_main                          Directory where the main file is located.
        name_game                               Name of the game (for pictures folder).
        settings_name                           Name of the settings (to load/save).
        settings_class                          Settings class.
        check_valid_build_order                 Function to check if a build order is valid.
        get_build_order_step                    Function to get one step of the build order.
        get_build_order_template                Function to get the build order template.
        get_faction_selection                   Function to get the faction selection dictionary.
        evaluate_build_order_timing             Function to evaluate the build order time indications.
        build_order_category_name               If not None, accept build orders with same name,
                                                provided they are in different categories.
        build_order_timer_available             True if the build order timer feature is available.
        build_order_timer_step_starting_flag    True if the timer steps starts at the requested time,
                                                False if ending at this time.
        """
        super().__init__()

        # application instance
        self.app = app

        # initialization not yet done
        self.init_done = False

        self.selected_panel = PanelID.CONFIG  # panel to display

        self.show_resources = True  # True to show the resources in the build order current display

        # directories
        self.name_game = name_game
        self.directory_main = directory_main  # main file
        self.directory_game_pictures = os.path.join(
            self.directory_main, '..', 'docs', 'assets', name_game)  # game pictures
        self.directory_common_pictures = os.path.join(
            self.directory_main, '..', 'docs', 'assets', 'common')  # common pictures
        # common configuration
        if os.path.isdir(os.path.join(self.directory_main, 'local_config')):  # check for local configuration folder
            self.directory_config_rts_overlay = os.path.join(self.directory_main, 'local_config')
        else:
            self.directory_config_rts_overlay = os.path.join(appdirs.user_data_dir(), 'RTS_Overlay')
        self.directory_config_game = os.path.join(self.directory_config_rts_overlay, name_game)  # game configuration
        self.directory_settings = os.path.join(self.directory_config_game, 'settings')  # settings file
        self.directory_build_orders = os.path.join(self.directory_config_game, 'build_orders')  # build orders

        # settings
        self.unscaled_settings = settings_class()
        self.default_settings = deepcopy(self.unscaled_settings)
        self.settings_file = os.path.join(self.directory_settings, settings_name)

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
            self.screen_position_safety()

        else:  # no settings file found
            print('Loading default parameters.')

            self.screen_position_safety()

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
        self.get_build_order_step = get_build_order_step
        self.get_build_order_template = get_build_order_template
        self.get_faction_selection = get_faction_selection
        self.evaluate_build_order_timing = evaluate_build_order_timing
        self.build_order_category_name = build_order_category_name
        self.build_orders = get_build_orders(self.directory_build_orders, check_valid_build_order,
                                             category_name=self.build_order_category_name)

        # move window
        self.setMouseTracking(True)  # mouse tracking
        self.left_click_start = False  # left click pressing started
        self.old_pos = self.pos()  # old position of the window
        self.init_x = self.frameGeometry().x()  # initial mouse X position
        self.init_y = self.frameGeometry().y()  # initial mouse Y position
        self.adapt_notes_to_columns = -1  # columns size adaptation for the notes

        # build order selection
        layout = self.settings.layout
        self.build_order_title = QLabel('Build order', self)
        self.build_order_search = QLineEdit(self)
        self.build_order_search.setPlaceholderText('keywords or space')
        self.build_order_search.textChanged.connect(self.update_build_order_display)
        self.build_order_selection = MultiQLabelDisplay(
            font_police=layout.font_police, font_size=layout.font_size, border_size=layout.border_size,
            vertical_spacing=layout.configuration.build_order_selection_vertical_spacing,
            color_default=layout.color_default)

        # configuration elements initialization
        self.build_order_step_time = QLabel('Step: 0/0', self)
        self.configuration_initialization()

        self.build_order_resources = MultiQLabelDisplay(
            font_police=layout.font_police, font_size=layout.font_size, image_height=layout.build_order.image_height,
            border_size=layout.border_size, vertical_spacing=layout.vertical_spacing,
            color_default=layout.color_default, game_pictures_folder=self.directory_game_pictures,
            common_pictures_folder=self.directory_common_pictures)

        color_row_emphasis = layout.build_order.color_row_emphasis if self.settings.timer_available else [0, 0, 0]
        extra_emphasis_height = layout.build_order.extra_emphasis_height if self.settings.timer_available else 0
        self.build_order_notes = MultiQLabelDisplay(
            font_police=layout.font_police, font_size=layout.font_size, image_height=layout.build_order.image_height,
            extra_emphasis_height=extra_emphasis_height, border_size=layout.border_size,
            vertical_spacing=layout.vertical_spacing, color_default=layout.color_default,
            color_row_emphasis=color_row_emphasis, game_pictures_folder=self.directory_game_pictures,
            common_pictures_folder=self.directory_common_pictures)

        # build order timer elements
        self.build_order_timer: Dict[
            str, Union[bool, bool, bool, float, float, int, int, float, str, list, list, list, list]] = {
            # True if the build order timer feature is available
            'available': build_order_timer_available and self.settings.timer_available,
            # True if the timer steps starts at the indicated time, False if ending at this time
            'step_starting_flag': build_order_timer_step_starting_flag,
            'use_timer': False,  # True to update BO with timer, False for manual selection
            'run_timer': False,  # True if the BO timer is running (False to stop)
            'absolute_time_init': time.time(),  # last absolute time when the BO timer run started [sec]
            'time_sec': 0.0,  # time for the BO [sec]
            'time_int': 0,  # 'time_sec' with a cast to integer
            'last_time_int': 0,  # last value for 'time_int' [sec]
            'time_sec_init': 0.0,  # value of 'time_sec' when run started [sec]
            'last_time_label': '',  # last string value for the time label
            'steps': [],  # steps adapted for the timer feature
            'steps_ids': [],  # IDs to select the current steps from 'steps'
            'last_steps_ids': [],  # last value for 'steps_ids'
        }

        # window color and position
        self.upper_left_position = [0, 0]
        self.upper_right_position = [0, 0]
        self.window_color_position_initialization()

        # next panel configuration button
        action_button_qsize = QSize(self.settings.layout.action_button_size, self.settings.layout.action_button_size)

        self.next_panel_button = TwinHoverButton(
            parent=self, click_connect=self.next_panel,
            icon=QIcon(os.path.join(self.directory_common_pictures, images.next_panel)),
            button_qsize=action_button_qsize, tooltip='next panel')

        self.hide_panel_button = TwinHoverButton(
            parent=self, click_connect=self.show_hide,
            icon=QIcon(os.path.join(self.directory_common_pictures, images.hide_panel)),
            button_qsize=action_button_qsize, tooltip='hide panel')

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
            parent=self, click_connect=self.open_panel_configure_hotkeys,
            icon=QIcon(os.path.join(self.directory_common_pictures, images.config_hotkeys)),
            button_qsize=action_button_qsize, tooltip='configure hotkeys')

        self.config_build_order_button = TwinHoverButton(
            parent=self, click_connect=self.open_panel_add_build_order,
            icon=QIcon(os.path.join(self.directory_common_pictures, images.write_build_order)),
            button_qsize=action_button_qsize, tooltip='add build order')

        # build order panel buttons
        bo_previous_tooltip = 'previous build order step / -1 sec' if build_order_timer_available else \
            'previous build order step'
        self.build_order_previous_button = TwinHoverButton(
            parent=self, click_connect=self.build_order_previous_step,
            icon=QIcon(os.path.join(self.directory_common_pictures, images.build_order_previous_step)),
            button_qsize=action_button_qsize, tooltip=bo_previous_tooltip)

        bo_next_tooltip = 'next build order step / +1 sec' if build_order_timer_available else 'next build order step'
        self.build_order_next_button = TwinHoverButton(
            parent=self, click_connect=self.build_order_next_step,
            icon=QIcon(os.path.join(self.directory_common_pictures, images.build_order_next_step)),
            button_qsize=action_button_qsize, tooltip=bo_next_tooltip)

        # timer features
        if self.settings.timer_available:
            self.build_order_switch_timer_manual = TwinHoverButton(
                parent=self, click_connect=self.switch_build_order_timer_manual,
                icon=QIcon(os.path.join(self.directory_common_pictures, images.switch_timer_manual)),
                button_qsize=action_button_qsize, tooltip='switch BO mode between timer and manual')

            self.build_order_start_stop_timer = TwinHoverButton(
                parent=self, click_connect=(lambda: self.start_stop_build_order_timer(invert_run=True)),
                icon=QIcon(os.path.join(self.directory_common_pictures, images.start_stop_timer)),
                button_qsize=action_button_qsize, tooltip='start/stop the BO timer')

            self.build_order_reset_timer = TwinHoverButton(
                parent=self, click_connect=self.reset_build_order_timer,
                icon=QIcon(os.path.join(self.directory_common_pictures, images.reset_timer)),
                button_qsize=action_button_qsize, tooltip='reset the BO timer')
        else:
            self.build_order_switch_timer_manual = None
            self.build_order_start_stop_timer = None
            self.build_order_reset_timer = None

        # enter key selection
        hotkeys = self.settings.hotkeys
        self.hotkey_enter = QShortcut(QKeySequence(hotkeys.enter), self)
        self.hotkey_enter.activated.connect(self.enter_key_actions)

        # select the next build order
        self.hotkey_next_build_order = QShortcut(QKeySequence(hotkeys.select_next_build_order), self)
        self.hotkey_next_build_order.activated.connect(self.select_build_order_id)

        # keyboard and mouse global hotkeys
        self.hotkey_names = ['next_panel', 'show_hide', 'build_order_previous_step', 'build_order_next_step']
        if self.build_order_timer['available']:
            self.hotkey_names.extend([
                'switch_timer_manual', 'start_timer', 'stop_timer', 'start_stop_timer', 'reset_timer'])

        self.keyboard_mouse = KeyboardMouseManagement(print_unset=False)

        self.mouse_buttons_dict = dict()  # dictionary as {keyboard_name: mouse_button_name}
        self.set_keyboard_mouse()

        # configure hotkeys
        self.panel_config_hotkeys = None

        # add build order
        self.panel_add_build_order = None

        # create build orders folder
        os.makedirs(self.directory_build_orders, exist_ok=True)

        # initialization done
        self.init_done = True

    def reload(self, update_settings):
        """Reload the application settings, build orders...

        Parameters
        ----------
        update_settings   True to update (reload) the settings, False to keep the current ones.
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

        # configuration elements initialization
        self.configuration_initialization()

        # display build order
        self.build_order_resources.update_settings(
            font_police=layout.font_police, font_size=layout.font_size,
            image_height=layout.build_order.image_height,
            border_size=layout.border_size, vertical_spacing=layout.vertical_spacing,
            color_default=layout.color_default)

        color_row_emphasis = layout.build_order.color_row_emphasis if self.settings.timer_available else [0, 0, 0]
        extra_emphasis_height = layout.build_order.extra_emphasis_height if self.settings.timer_available else 0
        self.build_order_notes.update_settings(
            font_police=layout.font_police, font_size=layout.font_size,
            image_height=layout.build_order.image_height, extra_emphasis_height=extra_emphasis_height,
            border_size=layout.border_size, vertical_spacing=layout.vertical_spacing,
            color_default=layout.color_default, color_row_emphasis=color_row_emphasis)

        self.deactivate_timer(self.build_order_timer['use_timer'])  # build order timer elements

        # window color and position
        self.window_color_position_initialization()

        # next panel configuration button
        action_button_qsize = QSize(self.settings.layout.action_button_size, self.settings.layout.action_button_size)

        self.next_panel_button.update_icon_size(
            icon=QIcon(os.path.join(self.directory_common_pictures, images.next_panel)),
            button_qsize=action_button_qsize)

        self.hide_panel_button.update_icon_size(
            icon=QIcon(os.path.join(self.directory_common_pictures, images.hide_panel)),
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

        # timer features
        if self.build_order_switch_timer_manual is None:
            self.settings.timer_available = False  # cannot be updated without relaunching the app
        if self.settings.timer_available:
            self.build_order_switch_timer_manual.update_icon_size(
                QIcon(os.path.join(self.directory_common_pictures, images.switch_timer_manual)), action_button_qsize)

            self.build_order_reset_timer.update_icon_size(
                QIcon(os.path.join(self.directory_common_pictures, images.reset_timer)), action_button_qsize)

            self.update_build_order_start_stop_timer_icon()

        # keyboard and mouse global hotkeys
        self.set_keyboard_mouse()

        # open popup message
        if update_settings:
            if os.path.exists(self.settings_file):
                msg_text = f'Settings reloaded using the parameters from {self.settings_file}.'
            else:
                msg_text = f'Settings reloaded with the default values ({self.settings_file} not generated).'
            popup_message('RTS Overlay - Reload', msg_text)

        # re-initialization done
        self.init_done = True

    def update_build_order_start_stop_timer_icon(self):
        """Update the icon for 'build_order_start_stop_timer'."""
        images = self.settings.images
        action_button_qsize = QSize(self.settings.layout.action_button_size, self.settings.layout.action_button_size)
        selected_image = images.start_stop_timer_active if self.build_order_timer[
            'run_timer'] else images.start_stop_timer

        self.build_order_start_stop_timer.update_icon_size(
            QIcon(os.path.join(self.directory_common_pictures, selected_image)), action_button_qsize)

    def deactivate_timer(self, build_order_timer_flag: bool = False):
        """Deactivate the timer functionalities (e.g. non valid BO for timer).

        Parameters
        ----------
        build_order_timer_flag   True to update BO with timer, False for manual selection.
        """
        self.build_order_timer['use_timer'] = build_order_timer_flag
        self.build_order_timer['run_timer'] = False
        self.build_order_timer['absolute_time_init'] = time.time()
        self.build_order_timer['time_sec'] = 0.0
        self.build_order_timer['time_int'] = 0
        self.build_order_timer['last_time_int'] = 0
        self.build_order_timer['time_sec_init'] = 0.0
        self.build_order_timer['last_time_label'] = ''
        self.build_order_timer['steps'] = []
        self.build_order_timer['steps_ids'] = []
        self.build_order_timer['last_steps_ids'] = []

    def screen_position_safety(self):
        """Check that the upper left/right corner is inside the screen."""
        screen_size = self.app.primaryScreen().size()
        screen_width = screen_size.width()
        screen_height = screen_size.height()

        layout = self.unscaled_settings.layout
        upper_position = layout.upper_right_position if layout.overlay_on_right_side else layout.upper_left_position

        if upper_position[0] >= screen_width:
            print(f'Upper right corner X position set to {(screen_width - 20)} (to stay inside screen).')
            upper_position[0] = screen_width - 20

        if upper_position[1] >= screen_height:
            print(f'Upper right corner Y position set to {(screen_height - 40)} (to stay inside screen).')
            upper_position[1] = screen_height - 40

    def set_keyboard_mouse(self):
        """Set the keyboard and mouse hotkey inputs."""

        # selection keys
        hotkey_settings = self.unscaled_settings.hotkeys
        self.hotkey_enter.setKey(QKeySequence(hotkey_settings.enter))
        self.hotkey_next_build_order.setKey(QKeySequence(hotkey_settings.select_next_build_order))

        self.mouse_buttons_dict.clear()  # clear mouse buttons
        print('Update hotkeys')

        # loop on all the hotkeys
        for hotkey_name in self.hotkey_names:
            if hasattr(hotkey_settings, hotkey_name):
                value = getattr(hotkey_settings, hotkey_name)
                if isinstance(value, KeyboardMouse):
                    # keyboard keys
                    keyboard_value = value.keyboard
                    self.keyboard_mouse.update_keyboard_hotkey(hotkey_name, keyboard_value)

                    # mouse buttons
                    mouse_value = value.mouse
                    if mouse_value != '':
                        mouse_button_names = self.keyboard_mouse.mouse_button_names
                        if mouse_value in mouse_button_names:
                            assert hotkey_name not in self.mouse_buttons_dict
                            self.mouse_buttons_dict[hotkey_name] = mouse_value
                        else:
                            print(f'Invalid mouse value: {mouse_value} | options: {mouse_button_names}')

                    # print
                    print_keyboard = 'not-set' if (keyboard_value == '') else keyboard_value
                    print_mouse = 'not-set' if (mouse_value == '') else mouse_value
                    print(f'    {hotkey_name}: keyboard:{print_keyboard} | mouse:{print_mouse}')
                else:
                    print(f'    KeyboardMouse instance expected for hotkey \'{hotkey_name}\'.')
            else:
                print(f'    Hotkey \'{hotkey_name}\' not found.')

        # all flags to not set
        self.keyboard_mouse.set_all_flags(False)

    def font_size_scaling_initialization(self):
        """Font size and scaling combo initialization (common to constructor and reload)."""
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
        """Configuration elements initialization (common to constructor and reload)."""
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

        # selected step of the build order
        self.build_order_step_time.setStyleSheet(color_default_str)
        self.build_order_step_time.setFont(QFont(layout.font_police, layout.font_size))
        self.build_order_step_time.adjustSize()

    def window_color_position_initialization(self):
        """Main window color and position initialization (common to constructor and reload)."""
        layout = self.settings.layout
        color_background = layout.color_background

        # color and opacity
        set_background_opacity(self, color_background, layout.opacity)

        # upper left and right positions
        self.upper_left_position = [layout.upper_left_position[0], layout.upper_left_position[1]]
        self.upper_right_position = [layout.upper_right_position[0], layout.upper_right_position[1]]
        self.update_position()

    def settings_scaling(self):
        """Apply the scaling on the settings."""
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
        configuration.build_order_search_size = scale_list_int(
            scaling, unscaled_configuration.build_order_search_size)
        configuration.build_order_selection_vertical_spacing = scale_int(
            scaling, unscaled_configuration.build_order_selection_vertical_spacing)

        build_order = layout.build_order
        unscaled_build_order = unscaled_layout.build_order
        build_order.image_height = scale_int(scaling, unscaled_build_order.image_height)
        build_order.resource_spacing = scale_int(scaling, unscaled_build_order.resource_spacing)
        build_order.bo_next_tab_spacing = scale_int(scaling, unscaled_build_order.bo_next_tab_spacing)

        panel_hotkeys = self.settings.panel_hotkeys
        unscaled_panel_hotkeys = self.unscaled_settings.panel_hotkeys
        panel_hotkeys.border_size = scale_int(scaling, unscaled_panel_hotkeys.border_size)
        panel_hotkeys.edit_width = scale_int(scaling, unscaled_panel_hotkeys.edit_width)
        panel_hotkeys.edit_height = scale_int(scaling, unscaled_panel_hotkeys.edit_height)
        panel_hotkeys.button_margin = scale_int(scaling, unscaled_panel_hotkeys.button_margin)
        panel_hotkeys.vertical_spacing = scale_int(scaling, unscaled_panel_hotkeys.vertical_spacing)
        panel_hotkeys.horizontal_spacing = scale_int(scaling, unscaled_panel_hotkeys.horizontal_spacing)

        panel_build_order = self.settings.panel_build_order
        unscaled_panel_build_order = self.unscaled_settings.panel_build_order
        panel_build_order.border_size = scale_int(scaling, unscaled_panel_build_order.border_size)
        panel_build_order.edit_width = scale_int(scaling, unscaled_panel_build_order.edit_width)
        panel_build_order.edit_height = scale_int(scaling, unscaled_panel_build_order.edit_height)
        panel_build_order.button_margin = scale_int(scaling, unscaled_panel_build_order.button_margin)
        panel_build_order.vertical_spacing = scale_int(scaling, unscaled_panel_build_order.vertical_spacing)
        panel_build_order.horizontal_spacing = scale_int(scaling, unscaled_panel_build_order.horizontal_spacing)
        panel_build_order.combo_extra_width = scale_int(scaling, unscaled_panel_build_order.combo_extra_width)
        panel_build_order.copy_line_width = scale_int(scaling, unscaled_panel_build_order.copy_line_width)
        panel_build_order.copy_line_height = scale_int(scaling, unscaled_panel_build_order.copy_line_height)
        panel_build_order.picture_size = scale_list_int(scaling, unscaled_panel_build_order.picture_size)

    def next_panel(self):
        """Select the next panel."""

        # saving the upper right corner position
        if self.selected_panel == PanelID.CONFIG:
            self.save_upper_corner_positions()

        if self.selected_panel == PanelID.CONFIG:
            self.selected_panel = PanelID.BUILD_ORDER
        elif self.selected_panel == PanelID.BUILD_ORDER:
            self.selected_panel = PanelID.CONFIG

        if self.selected_panel == PanelID.CONFIG:
            # configuration selected build order
            if self.selected_build_order is not None:
                self.build_order_search.setText(self.selected_build_order_name)

        self.update_panel_elements()  # update the elements of the panel to display
        self.update_position()  # restoring the upper right corner position

    def update_panel_elements(self):
        """Update the elements of the panel to display."""
        if self.selected_panel != PanelID.CONFIG:
            QApplication.restoreOverrideCursor()
        else:
            QApplication.setOverrideCursor(Qt.ArrowCursor)

        # window is transparent to mouse events, except for the configuration when not hidden
        self.setAttribute(Qt.WA_TransparentForMouseEvents, self.hidden or (self.selected_panel != PanelID.CONFIG))

        # remove the window title and stay always on top
        self.setWindowFlags(Qt.FramelessWindowHint | Qt.WindowStaysOnTopHint)

        # hide the elements by default
        self.hide_elements()

        if self.selected_panel == PanelID.CONFIG:  # Configuration
            self.config_panel_layout()
            self.build_order_search.setFocus()
        elif self.selected_panel == PanelID.BUILD_ORDER:  # Build Order
            self.update_build_order()

        # show the main window
        self.show()

    def mousePressEvent(self, event):
        """Actions related to the mouse pressing events.

        Parameters
        ----------
        event    Mouse event.
        """
        if self.selected_panel == PanelID.CONFIG:  # only needed when in configuration mode
            self.build_order_click_select(event)

    def mouseMoveEvent(self, event):
        """Actions related to the mouse moving events.

        Parameters
        ----------
        event    Mouse event.
        """
        if self.selected_panel == PanelID.CONFIG:  # only needed when in configuration mode
            self.move_window(event)

    def quit_application(self):
        """Quit the application."""
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
        self.hide_panel_button.close()
        self.build_order_previous_button.close()
        self.build_order_next_button.close()
        if self.settings.timer_available:
            self.build_order_switch_timer_manual.close()
            self.build_order_start_stop_timer.close()
            self.build_order_reset_timer.close()

        if (self.panel_config_hotkeys is not None) and self.panel_config_hotkeys.isVisible():
            self.panel_config_hotkeys.close()
            self.panel_config_hotkeys = None

        if (self.panel_add_build_order is not None) and self.panel_add_build_order.isVisible():
            self.panel_add_build_order.close()
            self.panel_add_build_order = None

        self.close()
        QApplication.quit()

    def font_size_combo_box_change(self, value):
        """Detect when the font size changed.

        Parameters
        ----------
        value    ID of the new font size in 'self.font_size_input_combo_ids'.
        """
        if self.init_done and (0 <= value < len(self.font_size_input_combo_ids)):
            new_font = self.font_size_input_combo_ids[value]
            # main font size
            self.settings.layout.font_size = new_font
            self.unscaled_settings.layout.font_size = new_font
            # panel to configure the hotkeys
            self.settings.panel_hotkeys.font_size = new_font
            self.unscaled_settings.panel_hotkeys.font_size = new_font
            # panel to input a build order
            self.settings.panel_build_order.font_size = new_font
            self.unscaled_settings.panel_build_order.font_size = new_font

            print(f'Font size updated to {new_font}.')
            self.reload(update_settings=False)

    def scaling_combo_box_change(self, value):
        """Detect when the scaling changed.

        Parameters
        ----------
        value    ID of the new scaling in 'self.scaling_input_combo_ids'.
        """
        if self.init_done and (0 <= value < len(self.scaling_input_combo_ids)):
            self.settings.layout.scaling = self.scaling_input_combo_ids[value]
            self.unscaled_settings.layout.scaling = self.scaling_input_combo_ids[value]
            print(f'Scaling updated to {self.scaling_input_combo_ids[value]}.')
            self.reload(update_settings=False)

    def open_panel_configure_hotkeys(self):
        """Open/close the panel to configure the hotkeys."""
        if (self.panel_config_hotkeys is not None) and self.panel_config_hotkeys.isVisible():  # close panel
            self.panel_config_hotkeys.close()
            self.panel_config_hotkeys = None
            self.keyboard_mouse.set_all_flags(False)
        else:  # open new panel
            self.panel_config_hotkeys = HotkeysWindow(
                parent=self, hotkeys=self.unscaled_settings.hotkeys, game_icon=self.game_icon,
                mouse_image=os.path.join(self.directory_common_pictures, self.settings.images.mouse),
                settings_folder=self.directory_settings, panel_settings=self.settings.panel_hotkeys,
                timer_flag=self.build_order_timer['available'])

    def get_hotkey_mouse_flag(self, name: str) -> bool:
        """Get the flag value for a global hotkey and/or mouse input.

        Parameters
        ----------
        name    Field to check.

        Returns
        -------
        True if flag activated, False if not activated or not found.
        """
        valid_keyboard = (name in self.keyboard_mouse.keyboard_hotkeys) and (
                self.keyboard_mouse.keyboard_hotkeys[name].sequence != '')
        mouse_button_name = self.mouse_buttons_dict[name] if (name in self.mouse_buttons_dict) else None
        valid_mouse = (mouse_button_name is not None) and (mouse_button_name in self.keyboard_mouse.mouse_button_names)

        if valid_keyboard and valid_mouse:  # both mouse and hotkey must be pressed
            if self.keyboard_mouse.is_keyboard_hotkey_pressed(name) and self.keyboard_mouse.get_mouse_flag(
                    mouse_button_name):
                return self.keyboard_mouse.get_mouse_elapsed_time(
                    mouse_button_name) < self.unscaled_settings.hotkeys.mouse_max_time
            else:
                return False

        elif valid_keyboard:  # check keyboard
            return self.keyboard_mouse.get_keyboard_hotkey_flag(name)

        elif valid_mouse:  # check mouse
            return self.keyboard_mouse.get_mouse_flag(mouse_button_name)

        return False  # not set

    def timer_build_order_call(self):
        """Function called on a timer for build order timer update."""
        if self.build_order_timer['run_timer']:
            elapsed_time = time.time() - self.build_order_timer['absolute_time_init']
            if hasattr(self.settings, 'timer_speed_factor'):  # in case timer value is not the same as real-time
                elapsed_time *= self.settings.timer_speed_factor
            self.build_order_timer['time_sec'] = self.build_order_timer['time_sec_init'] + elapsed_time
            self.build_order_timer['time_int'] = int(floor(self.build_order_timer['time_sec']))

            if self.selected_panel == PanelID.BUILD_ORDER:  # update build order panel display
                self.update_build_order_time_label()

                # time was updated (or no valid note ID)
                if (self.build_order_timer['last_time_int'] != self.build_order_timer['time_int']) or (
                        not self.build_order_timer['last_steps_ids']):
                    self.build_order_timer['last_time_int'] = self.build_order_timer['time_int']

                    # compute current note ID
                    self.build_order_timer['steps_ids'] = get_build_order_timer_step_ids(
                        self.build_order_timer['steps'], self.build_order_timer['time_int'],
                        self.build_order_timer['step_starting_flag'])

                    # note ID was updated
                    if self.build_order_timer['last_steps_ids'] != self.build_order_timer['steps_ids']:
                        self.build_order_timer['last_steps_ids'] = self.build_order_timer['steps_ids']

                        self.update_build_order()

    def timer_mouse_keyboard_call(self):
        """Function called on a timer for mouse and keyboard inputs."""
        self.update_mouse()  # update the mouse position

        # next panel button
        self.next_panel_button.hovering_show(self.is_mouse_in_roi_widget)

        # hide panel button
        self.hide_panel_button.hovering_show(self.is_mouse_in_roi_widget)

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

            bo_panel_open = self.selected_panel == PanelID.BUILD_ORDER  # is build order panel open

            # switch to next panel
            if self.get_hotkey_mouse_flag('next_panel'):
                self.next_panel()

            if self.get_hotkey_mouse_flag('show_hide'):  # show/hide overlay
                self.show_hide()

            # select previous step of the build order
            if self.get_hotkey_mouse_flag('build_order_previous_step') and bo_panel_open:
                self.build_order_previous_step()

            # select next step of the build order
            if self.get_hotkey_mouse_flag('build_order_next_step') and bo_panel_open:
                self.build_order_next_step()

            if self.build_order_timer['available']:
                # switch build order between timer/manual
                if self.get_hotkey_mouse_flag('switch_timer_manual') and bo_panel_open:
                    self.switch_build_order_timer_manual()

                # check if timer update can be applied
                apply_timer_update = (self.build_order_timer['use_timer'] and (not self.hidden) and bo_panel_open and
                                      self.build_order_timer['steps'])

                # start the build order timer
                if self.get_hotkey_mouse_flag('start_timer'):
                    if apply_timer_update:
                        self.start_stop_build_order_timer(invert_run=False, run_value=True)

                # stop the build order timer
                if self.get_hotkey_mouse_flag('stop_timer'):
                    if apply_timer_update:
                        self.start_stop_build_order_timer(invert_run=False, run_value=False)

                # start/stop the build order timer
                if self.get_hotkey_mouse_flag('start_stop_timer'):
                    if apply_timer_update:
                        self.start_stop_build_order_timer(invert_run=True)

                # reset the build order timer
                if self.get_hotkey_mouse_flag('reset_timer'):
                    if apply_timer_update:
                        self.reset_build_order_timer()

        if self.is_mouse_in_window():
            if self.selected_panel == PanelID.CONFIG:  # configuration specific buttons
                self.config_quit_button.hovering_show(self.is_mouse_in_roi_widget)
                self.config_save_button.hovering_show(self.is_mouse_in_roi_widget)
                self.config_reload_button.hovering_show(self.is_mouse_in_roi_widget)
                self.config_hotkey_button.hovering_show(self.is_mouse_in_roi_widget)
                self.config_build_order_button.hovering_show(self.is_mouse_in_roi_widget)

            elif self.selected_panel == PanelID.BUILD_ORDER:  # build order specific buttons
                self.build_order_previous_button.hovering_show(self.is_mouse_in_roi_widget)
                self.build_order_next_button.hovering_show(self.is_mouse_in_roi_widget)
                if self.build_order_timer['available'] and self.build_order_timer['steps']:
                    self.build_order_switch_timer_manual.hovering_show(self.is_mouse_in_roi_widget)
                    if self.build_order_timer['use_timer']:
                        self.build_order_start_stop_timer.hovering_show(self.is_mouse_in_roi_widget)
                        self.build_order_reset_timer.hovering_show(self.is_mouse_in_roi_widget)

    def show_hide(self):
        """Show or hide the windows."""
        self.hidden = not self.hidden  # change the hidden state

        # adapt opacity
        if self.hidden:
            self.setWindowOpacity(0.0)
        else:
            self.setWindowOpacity(self.settings.layout.opacity)

    def update_hotkeys(self):
        """Update the hotkeys and the settings file."""
        config_hotkeys = self.panel_config_hotkeys.hotkeys
        config_mouse_checkboxes = self.panel_config_hotkeys.mouse_checkboxes
        config_field_to_mouse = self.panel_config_hotkeys.field_to_mouse

        def split_keyboard_mouse(str_input: str):
            """Split an input between keyboard and mouse parts.

            Parameters
            ----------
            str_input    Input string from 'OverlaySequenceEdit'.

            Returns
            -------
            Keyboard input, '' if no keyboard input.
            Mouse input, '' if no valid mouse input.
            """
            if '+' not in str_input:  # single input
                if str_input in config_field_to_mouse:  # only mouse
                    return '', config_field_to_mouse[str_input]
                else:  # only keyboard
                    return str_input, ''

            else:  # several inputs
                in_split = str_input.split('+')
                keyboard_out = ''
                mouse_out = ''
                for elem in in_split:
                    if elem != '':
                        if elem in config_field_to_mouse:  # mouse part
                            mouse_out = config_field_to_mouse[elem]  # only one mouse input possible (take the last)
                        else:  # keyboard part
                            if keyboard_out == '':
                                keyboard_out = elem
                            else:
                                keyboard_out += '+' + elem
                return keyboard_out, mouse_out

        # update the hotkeys
        print('Hotkeys update:')
        for hotkey_name in self.hotkey_names:
            if hasattr(self.unscaled_settings.hotkeys, hotkey_name):
                hotkey_settings = getattr(self.unscaled_settings.hotkeys, hotkey_name)
                hotkey_str = config_hotkeys[hotkey_name].get_str()

                if config_mouse_checkboxes[hotkey_name].isChecked():  # consider mouse as input
                    keyboard_in, mouse_in = split_keyboard_mouse(hotkey_str)
                    hotkey_settings.keyboard = keyboard_in
                    hotkey_settings.mouse = mouse_in
                else:  # do not consider mouse as input
                    hotkey_settings.keyboard = hotkey_str
                    hotkey_settings.mouse = ''

        self.set_keyboard_mouse()
        self.save_settings()

    def add_build_order_json_data(self, build_order_data: dict) -> str:
        """Add a build order, from its JSON format.

        Parameters
        ----------
        build_order_data    Build order data in JSON format.

        Returns
        -------
        Text message about the loading action.
        """
        # check if build order content is valid
        valid_bo, bo_error_msg = self.check_valid_build_order(build_order_data, bo_name_msg=True)
        if valid_bo:
            name = build_order_data['name']  # name of the build order

            if name == '':  # filename safety: in case name is empty
                name = 'missing title'

            if name[0].isdigit():  # filename safety: must start with a letter
                name = 'BO_' + name

            for char in '<>:"/\\|?* ':  # filename safety: remove invalid characters for filename
                name = name.replace(char, '_')

            # check if build order is a new one
            if is_build_order_new(self.build_orders, build_order_data, self.build_order_category_name):

                # output filename
                output_name = f'{name}.json'
                if (self.build_order_category_name is not None) and (
                        self.build_order_category_name in build_order_data):
                    if isinstance(build_order_data[self.build_order_category_name], str):
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
            msg_text = f'Build order content is not valid: {bo_error_msg}'

        return msg_text

    def add_build_order(self):
        """Try to add the build order written in the new build order panel."""
        msg_text = None
        try:
            # get data as dictionary
            build_order_data = json.loads(self.panel_add_build_order.text_input.toPlainText())

            # check on '\n'
            for build_order_step in build_order_data['build_order']:
                for note_id, note in enumerate(build_order_step['notes']):
                    if isinstance(note, str):
                        note_split = note.split('\n')
                        if len(note_split) > 1:
                            build_order_step['notes'][note_id:note_id + 1] = note_split

            msg_text = self.add_build_order_json_data(build_order_data)

        except json.JSONDecodeError:
            if msg_text is None:
                msg_text = 'Error while trying to decode the build order JSON format (non valid JSON format).'

        except:
            if msg_text is None:
                msg_text = 'Unknown error while trying to add the build order.'

        # open popup message
        popup_message('RTS Overlay - Adding new build order', msg_text)

    def save_settings(self):
        """Save the settings."""
        msg_text = f'Settings saved in {self.settings_file}.'  # message to display
        os.makedirs(os.path.dirname(self.settings_file), exist_ok=True)
        with open(self.settings_file, 'w') as f:
            f.write(json.dumps(self.unscaled_settings.to_dict(), sort_keys=False, indent=4))
            print(msg_text)

        # open popup message
        popup_message('RTS Overlay - Settings saved', msg_text)

    def update_mouse(self):
        """Update the mouse position."""
        pos = QCursor().pos()
        self.mouse_x = pos.x()
        self.mouse_y = pos.y()

    def is_mouse_in_roi(self, x: int, y: int, width: int, height: int) -> bool:
        """Check if the last updated mouse position (using 'update_mouse') is in a ROI.

        Parameters
        ----------
        x         X position of the ROI (on the screen).
        y         Y position of the ROI (on the screen).
        width     Width of the ROI.
        height    Height of the ROI.

        Returns
        -------
        True if in the ROI.
        """
        return (x <= self.mouse_x <= x + width) and (y <= self.mouse_y <= y + height)

    def is_mouse_in_window(self) -> bool:
        """Checks if the mouse is in the current window.

        Returns
        -------
        True if mouse is in the window.
        """
        return self.is_mouse_in_roi(self.x(), self.y(), self.width(), self.height())

    def is_mouse_in_roi_widget(self, widget: QWidget) -> bool:
        """Check if the last updated mouse position (using 'update_mouse') is in the ROI of a widget.

        Parameters
        ----------
        widget    Widget to check.

        Returns
        -------
        True if mouse is in the ROI.
        """
        return self.is_mouse_in_roi(
            x=self.x() + widget.x(), y=self.y() + widget.y(), width=widget.width(), height=widget.height())

    def move_window(self, event):
        """Move the window according to the mouse motion.

        Parameters
        ----------
        event    Mouse event.
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
            self.settings.layout.upper_left_position = [self.x(), self.y()]
            self.unscaled_settings.layout.upper_left_position = [self.x(), self.y()]
            self.settings.layout.upper_right_position = [widget_x_end(self), self.y()]
            self.unscaled_settings.layout.upper_right_position = [widget_x_end(self), self.y()]

    def build_order_click_select(self, event):
        """Check if a build order is being clicked.

        Parameters
        ----------
        event    Mouse event.
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

    def save_upper_corner_positions(self):
        """Save of the upper left and right corner positions."""
        self.upper_left_position = [self.x(), self.y()]
        self.upper_right_position = [widget_x_end(self), self.y()]

    def update_position(self):
        """Update the position to stick to the saved upper left/right corner."""
        if self.settings.layout.overlay_on_right_side:
            self.move(self.upper_right_position[0] - self.width(), self.upper_right_position[1])
        else:
            self.move(self.upper_left_position[0], self.upper_left_position[1])

    def build_order_previous_step(self):
        """Select the previous step of the build order (or update to -1 sec for timer feature)."""
        if self.selected_panel == PanelID.BUILD_ORDER:

            if self.build_order_timer['use_timer']:  # update timer
                self.build_order_timer['time_sec'] -= 1.0
                self.build_order_timer['absolute_time_init'] += 1.0  # like the timer was started 1 sec later
                self.build_order_timer['time_int'] = int(floor(self.build_order_timer['time_sec']))
                self.update_build_order_time_label()
            else:  # update step
                old_selected_build_order_step_id = self.selected_build_order_step_id
                self.selected_build_order_step_id = max(0, min(self.selected_build_order_step_id - 1,
                                                               self.selected_build_order_step_count - 1))
                if old_selected_build_order_step_id != self.selected_build_order_step_id:
                    self.update_build_order()  # update the rendering

    def build_order_next_step(self):
        """Select the next step of the build order (or update to +1 sec for timer feature)."""
        if self.selected_panel == PanelID.BUILD_ORDER:

            if self.build_order_timer['use_timer']:  # update timer
                self.build_order_timer['time_sec'] += 1.0
                self.build_order_timer['absolute_time_init'] -= 1.0  # like the timer was started 1 sec earlier
                self.build_order_timer['time_int'] = int(floor(self.build_order_timer['time_sec']))
                self.update_build_order_time_label()
            else:  # update step
                old_selected_build_order_step_id = self.selected_build_order_step_id
                self.selected_build_order_step_id = max(0, min(self.selected_build_order_step_id + 1,
                                                               self.selected_build_order_step_count - 1))
                if old_selected_build_order_step_id != self.selected_build_order_step_id:
                    self.update_build_order()  # update the rendering

    def select_build_order_id(self, build_order_id: int = -1) -> bool:
        """Select build order ID.

        Parameters
        ----------
        build_order_id    ID of the build order, negative to select next build order.

        Returns
        -------
        True if valid build order selection.
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
        """Get the names of the valid build orders (with search bar).

        Parameters
        ----------
        key_condition   Dictionary with the keys to look for and their value (to consider as valid), None to skip it.
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
        """Obtain the valid build order from search bar.

        Parameters
        ----------
        key_condition   Dictionary with the keys to look for and their value (to consider as valid), None to skip it.
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
        """Select the requested valid build order.

        Parameters
        ----------
        key_condition   Dictionary with the keys to look for and their value (to consider as valid), None to skip it.
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

            # obtain build order time notes
            if self.build_order_timer['available']:
                self.build_order_timer['steps'] = get_build_order_timer_steps(self.selected_build_order)
                if not self.build_order_timer['steps']:  # non valid timer BO
                    self.deactivate_timer()
                else:  # valid timer BO
                    self.build_order_timer['steps_ids'] = [0]
                    self.build_order_timer['last_steps_ids'] = []
                    self.reset_build_order_timer()
                    self.start_stop_build_order_timer(invert_run=False, run_value=False)

        else:  # not valid
            self.selected_build_order = None
            self.selected_build_order_name = None
            self.selected_build_order_step_count = 0
            self.selected_build_order_step_id = -1
            self.build_order_selection.clear()
            self.build_order_selection.add_row_from_picture_line(parent=self, line='no build order')
        self.build_order_search.clearFocus()

    def hide_elements(self):
        """Hide elements."""

        # configuration buttons
        self.next_panel_button.hide()
        self.hide_panel_button.hide()

        self.config_quit_button.hide()
        self.config_save_button.hide()
        self.config_reload_button.hide()
        self.config_hotkey_button.hide()
        self.config_build_order_button.hide()

        self.build_order_step_time.hide()
        self.build_order_previous_button.hide()
        self.build_order_next_button.hide()
        if self.settings.timer_available:
            self.build_order_switch_timer_manual.hide()
            self.build_order_start_stop_timer.hide()
            self.build_order_reset_timer.hide()

        # police, scaling combo
        self.font_size_input.hide()
        self.scaling_input.hide()

        # search build order
        self.build_order_title.hide()
        self.build_order_search.hide()
        self.build_order_selection.hide()

        # display build order
        self.build_order_resources.hide()
        self.build_order_notes.hide()

    def update_build_order_display(self):
        """Update the build order search matching display."""
        pass  # will be implemented in daughter classes

    def enter_key_actions(self):
        """Actions performed when pressing the Enter key"""
        pass  # will be implemented in daughter classes

    def open_panel_add_build_order(self):
        """Open/close the panel to add a build order"""
        if (self.panel_add_build_order is None) or (not self.panel_add_build_order.isVisible()):  # open panel

            # reset selected build order
            self.deactivate_timer()
            self.selected_build_order = {
                'notes': ['Update the build order in the \'New build order\' window.']
            }
            self.selected_build_order_name = None
            self.selected_build_order_step_count = 0
            self.selected_build_order_step_id = -1

            if self.selected_panel == PanelID.CONFIG:
                self.save_upper_corner_positions()  # saving the upper right corner position
                self.selected_panel = PanelID.BUILD_ORDER  # switch to build order panel
                self.update_position()  # restoring the upper right corner position

            self.update_panel_elements()  # update the elements of the panel to display

    def config_panel_layout(self):
        """Layout of the configuration panel."""
        if self.selected_panel != PanelID.CONFIG:
            return

        # save corner position
        self.save_upper_corner_positions()

        # show elements
        self.config_quit_button.show()
        self.config_save_button.show()
        self.config_reload_button.show()
        self.config_hotkey_button.show()
        self.config_build_order_button.show()
        self.font_size_input.show()
        self.scaling_input.show()
        self.next_panel_button.show()
        self.hide_panel_button.show()
        self.build_order_title.show()
        self.build_order_search.show()
        self.build_order_selection.show()

        # configuration buttons
        layout = self.settings.layout
        border_size = layout.border_size
        horizontal_spacing = layout.horizontal_spacing
        action_button_size = layout.action_button_size
        action_button_spacing = layout.action_button_spacing

        next_x = border_size
        self.config_quit_button.move(next_x, border_size)
        next_x += action_button_size + action_button_spacing
        self.config_save_button.move(next_x, border_size)
        next_x += action_button_size + action_button_spacing
        self.config_reload_button.move(next_x, border_size)
        next_x += action_button_size + action_button_spacing
        self.config_hotkey_button.move(next_x, border_size)
        next_x += action_button_size + action_button_spacing
        self.config_build_order_button.move(next_x, border_size)
        next_x += action_button_size + horizontal_spacing
        self.font_size_input.move(next_x, border_size)
        next_x += self.font_size_input.width() + horizontal_spacing
        self.scaling_input.move(next_x, border_size)
        next_x += self.scaling_input.width() + horizontal_spacing
        self.hide_panel_button.move(next_x, border_size)
        next_x += self.hide_panel_button.width() + horizontal_spacing
        self.next_panel_button.move(next_x, border_size)

    def config_panel_layout_resize_move(self):
        """Layout of the configuration panel (resizing and moving to correct location)."""
        if self.selected_panel != PanelID.CONFIG:
            return

        border_size = self.settings.layout.border_size
        horizontal_spacing = self.settings.layout.horizontal_spacing

        max_x = max(self.next_panel_button.x_end(), widget_x_end(self.build_order_search),
                    self.build_order_selection.x() + self.build_order_selection.row_max_width)

        max_y = max(widget_y_end(self.build_order_search),
                    self.build_order_selection.y() + self.build_order_selection.row_total_height)

        # resize main window
        self.resize(max_x + border_size, max_y + border_size)

        # next panel and hide panel buttons on top right corner
        self.next_panel_button.move(self.width() - border_size - self.next_panel_button.width(), border_size)

        self.hide_panel_button.move(self.next_panel_button.x() - horizontal_spacing - self.hide_panel_button.width(),
                                    self.next_panel_button.y())

        # update position (in case the size changed)
        self.update_position()

    def update_build_order(self):
        """Update the build order panel."""
        # clear the elements (also hide them)
        self.build_order_resources.clear()
        self.build_order_notes.clear()

        if self.selected_build_order is None:  # no build order selected
            self.build_order_notes.add_row_from_picture_line(parent=self, line='No build order selected.')

        elif 'build_order' not in self.selected_build_order:  # only display notes
            assert 'notes' in self.selected_build_order
            for note in self.selected_build_order['notes']:
                self.build_order_notes.add_row_from_picture_line(parent=self, line=note)

        self.adapt_notes_to_columns = -1  # no column adaptation by default

        # valid build order selected
        if (self.selected_build_order is not None) and ('build_order' in self.selected_build_order):

            # display selected step
            if self.build_order_timer['use_timer']:
                self.update_build_order_time_label()
            else:
                self.update_build_order_step_label()

    def get_build_order_selected_steps_and_ids(self) -> (list, list):
        """Get the build order timer steps to display.

        Returns
        -------
        Step IDs of the output list (see below).
        List of steps to display.
        """

        if self.build_order_timer['use_timer'] and self.build_order_timer['steps']:
            # get steps to display
            selected_steps_ids, selected_steps = get_build_order_timer_steps_display(
                self.build_order_timer['steps'], self.build_order_timer['steps_ids'])
        else:
            selected_build_order_content = self.selected_build_order['build_order']

            # select current step
            assert 0 <= self.selected_build_order_step_id < self.selected_build_order_step_count
            selected_steps_ids = [0]
            selected_steps = [selected_build_order_content[self.selected_build_order_step_id]]
            assert selected_steps[0] is not None
        assert (len(selected_steps) > 0) and (len(selected_steps_ids) > 0)

        return selected_steps, selected_steps_ids

    def update_build_order_notes(self, selected_steps, selected_steps_ids):
        """Update the notes of the build order.

        Parameters
        ----------
        selected_steps        Step IDs of the output list (see below).
        selected_steps_ids    List of steps to display.
        """

        layout = self.settings.layout
        spacing = ' ' * layout.build_order.resource_spacing  # space between the elements

        # line before notes
        self.build_order_notes.add_row_color(
            parent=self, height=layout.build_order.height_line_notes, color=layout.build_order.color_line_notes)

        # loop on the steps for notes
        for step_id, selected_step in enumerate(selected_steps):

            # check if emphasis must be added on the corresponding note
            emphasis_flag = self.build_order_timer['run_timer'] and (step_id in selected_steps_ids)

            notes = selected_step['notes']
            for note_id, note in enumerate(notes):
                # add time if running timer and time available
                line = ''
                resource_step = selected_steps[selected_steps_ids[-1]]  # ID of the step to use to display the resources
                if (self.build_order_timer['use_timer']) and ('time' in resource_step) and hasattr(
                        layout.build_order, 'show_time_in_notes') and layout.build_order.show_time_in_notes:
                    line += (str(selected_step['time']) if (note_id == 0) else ' ') + '@' + spacing + '@'
                    self.adapt_notes_to_columns = 1
                line += note
                self.build_order_notes.add_row_from_picture_line(
                    parent=self, line=line, emphasis_flag=emphasis_flag)

    def build_order_panel_layout(self):
        """Layout of the Build order panel."""
        if self.selected_panel != PanelID.BUILD_ORDER:
            return

        # show elements
        if (self.selected_build_order is not None) and ('build_order' in self.selected_build_order):
            self.build_order_step_time.show()
            self.build_order_previous_button.show()
            self.build_order_next_button.show()
            if self.build_order_timer['available'] and self.build_order_timer['steps']:
                self.build_order_switch_timer_manual.show()
                if self.build_order_timer['use_timer']:
                    self.build_order_start_stop_timer.show()
                    self.build_order_reset_timer.show()
        self.next_panel_button.show()
        self.hide_panel_button.show()
        self.build_order_notes.show()

        # show elements
        if self.show_resources:
            self.build_order_resources.show()

        # size and position
        layout = self.settings.layout
        border_size = layout.border_size
        vertical_spacing = layout.vertical_spacing
        horizontal_spacing = layout.horizontal_spacing
        action_button_size = layout.action_button_size
        action_button_spacing = layout.action_button_spacing
        bo_next_tab_spacing = layout.build_order.bo_next_tab_spacing

        # action buttons
        next_y = border_size + action_button_size + vertical_spacing

        if self.selected_build_order is not None:
            self.build_order_step_time.adjustSize()
            next_y = max(next_y, border_size + self.build_order_step_time.height() + vertical_spacing)

        # build order resources
        if self.show_resources:
            self.build_order_resources.update_size_position(init_y=next_y)
            next_y += self.build_order_resources.row_total_height + vertical_spacing

        # maximum width
        buttons_count = 4  # previous step + next step + hide panel + next panel
        if self.build_order_timer['available']:
            buttons_count += 3 if self.build_order_timer[
                'use_timer'] else 1  # switch timer-manual (+ start/stop + reset timer)
        max_x = max(
            (self.build_order_step_time.width() + buttons_count * action_button_size +
             horizontal_spacing + (buttons_count - 2) * action_button_spacing + bo_next_tab_spacing),
            self.build_order_resources.row_max_width)

        # build order notes
        self.build_order_notes.update_size_position(
            init_y=next_y, panel_init_width=max_x + 2 * border_size,
            adapt_to_columns=self.adapt_notes_to_columns)

        # resize of the full window
        max_x = max(max_x, self.build_order_notes.row_max_width)
        self.resize(max_x + 2 * border_size, next_y + self.build_order_notes.row_total_height + border_size)

        button_space_size = action_button_size + action_button_spacing

        # fixed top right corner
        if layout.overlay_on_right_side:
            next_x = self.width() - border_size - action_button_size
            self.next_panel_button.move(next_x, border_size)

            next_x -= button_space_size
            self.hide_panel_button.move(next_x, border_size)

            if self.selected_build_order is not None:
                next_x -= (action_button_size + bo_next_tab_spacing)

                if self.build_order_timer['available'] and self.build_order_timer['steps']:
                    self.build_order_switch_timer_manual.move(next_x, border_size)
                    next_x -= button_space_size

                    if self.build_order_timer['use_timer']:
                        self.build_order_reset_timer.move(next_x, border_size)
                        next_x -= button_space_size

                        self.build_order_start_stop_timer.move(next_x, border_size)
                        next_x -= button_space_size

                self.build_order_next_button.move(next_x, border_size)
                next_x -= button_space_size

                self.build_order_previous_button.move(next_x, border_size)
                next_x -= (self.build_order_step_time.width() + action_button_spacing)

                self.build_order_step_time.move(next_x, border_size)

        # fixed top left corner
        else:
            next_x = border_size

            if self.selected_build_order is not None:
                self.build_order_step_time.move(next_x, border_size)
                next_x += (self.build_order_step_time.width() + action_button_spacing)

                self.build_order_previous_button.move(next_x, border_size)
                next_x += button_space_size

                self.build_order_next_button.move(next_x, border_size)

                if self.build_order_timer['available'] and self.build_order_timer['steps']:
                    next_x += button_space_size

                    if self.build_order_timer['use_timer']:
                        self.build_order_start_stop_timer.move(next_x, border_size)
                        next_x += button_space_size

                        self.build_order_reset_timer.move(next_x, border_size)
                        next_x += button_space_size

                    self.build_order_switch_timer_manual.move(next_x, border_size)

                next_x += (action_button_size + bo_next_tab_spacing)

            self.hide_panel_button.move(next_x, border_size)
            next_x += button_space_size

            self.next_panel_button.move(next_x, border_size)

        # position update to stay with the same upper right corner position
        self.update_position()

    def switch_build_order_timer_manual(self):
        """Switch the build order mode between timer and manual."""
        if self.build_order_timer['available'] and self.build_order_timer['steps']:
            self.build_order_timer['use_timer'] = not self.build_order_timer['use_timer']

            if self.build_order_timer['use_timer']:  # timer feature
                self.build_order_start_stop_timer.show()
                self.build_order_reset_timer.show()
                self.update_build_order_time_label()
            else:  # manual step selection
                self.build_order_timer['run_timer'] = False
                self.build_order_start_stop_timer.hide()
                self.build_order_reset_timer.hide()
                self.update_build_order_step_label()

            self.build_order_timer['last_time_label'] = ''
            self.build_order_timer['last_steps_ids'] = []

            # select current step
            if (not self.build_order_timer['use_timer']) and (len(self.build_order_timer['steps_ids']) > 0):
                self.selected_build_order_step_id = self.build_order_timer['steps_ids'][0]

            self.update_build_order_start_stop_timer_icon()
            self.update_build_order()
        else:
            self.build_order_timer['use_timer'] = False

    def start_stop_build_order_timer(self, invert_run: bool = True, run_value: bool = True):
        """Start or stop the build order timer.

        Parameters
        ----------
        invert_run    True to invert the running state.
        run_value     Value to set for the running state (ignored for invert_run set to True).
        """
        if self.build_order_timer['use_timer']:
            new_run_state = (not self.build_order_timer['run_timer']) if invert_run else run_value

            if new_run_state != self.build_order_timer['run_timer']:  # only update if change
                self.build_order_timer['run_timer'] = new_run_state

                # panel display
                self.update_build_order_start_stop_timer_icon()  # update icon
                self.build_order_timer['last_time_label'] = ''
                self.build_order_panel_layout()

                # time
                self.build_order_timer['absolute_time_init'] = time.time()
                self.build_order_timer['time_sec_init'] = self.build_order_timer['time_sec']

                self.update_build_order()

    def update_build_order_step_label(self):
        """Update the build order step label."""
        if self.selected_panel == PanelID.BUILD_ORDER:
            self.build_order_step_time.setText(
                f'Step: {self.selected_build_order_step_id + 1}/{self.selected_build_order_step_count}')

    def update_build_order_time_label(self):
        """Update the build order time label."""
        if self.selected_panel == PanelID.BUILD_ORDER:

            # check if time is negative
            if self.build_order_timer['time_int'] < 0:
                negative_time = True
                build_order_time_sec = -self.build_order_timer['time_int']
            else:
                negative_time = False
                build_order_time_sec = self.build_order_timer['time_int']

            # convert to 'x:xx' format
            time_min = build_order_time_sec // 60
            time_sec = build_order_time_sec % 60
            negative_str = '-' if (negative_time and (build_order_time_sec != 0)) else ''
            time_label = negative_str + str(time_min) + ':' + str('{:02d}'.format(time_sec))

            if time_label != self.build_order_timer['last_time_label']:
                # update label and layout
                self.build_order_step_time.setText(time_label)
                self.build_order_panel_layout()

                self.build_order_timer['last_time_label'] = time_label

    def reset_build_order_timer(self):
        """Reset the build order timer (set to 0 sec)."""
        if self.build_order_timer['use_timer']:
            self.build_order_timer['time_sec'] = 0.0
            self.build_order_timer['time_int'] = 0
            self.build_order_timer['last_time_int'] = 0
            self.build_order_timer['time_sec_init'] = 0.0
            self.build_order_timer['last_time_label'] = ''
            self.build_order_timer['absolute_time_init'] = time.time()
            self.build_order_timer['steps_ids'] = [0]
            self.build_order_timer['last_steps_ids'] = []
            if self.build_order_timer['use_timer']:
                self.update_build_order_time_label()
            else:
                self.update_build_order_step_label()
            self.update_build_order()
            self.build_order_panel_layout()
