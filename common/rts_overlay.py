import os
import json
import appdirs
from copy import deepcopy
from thefuzz import process

from PyQt5.QtWidgets import QMainWindow, QApplication, QLabel, QShortcut, QLineEdit
from PyQt5.QtWidgets import QWidget, QComboBox, QDesktopWidget
from PyQt5.QtGui import QKeySequence, QFont, QIcon, QCursor
from PyQt5.QtCore import Qt, QPoint, QSize

from common.build_order_tools import get_build_orders, check_build_order_key_values, is_build_order_new
from common.label_display import MultiQLabelDisplay, QLabelSettings, MultiQLabelWindow
from common.useful_tools import TwinHoverButton, scale_int, scale_list_int, set_background_opacity, widget_x_end, \
    popup_message
from common.keyboard_mouse import KeyboardMouseManagement
from common.rts_settings import KeyboardMouse
from common.hotkeys_window import HotkeysWindow


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
        self.name_game = name_game
        self.directory_main = directory_main  # main file
        self.directory_game_pictures = os.path.join(self.directory_main, 'pictures', name_game)  # game pictures
        self.directory_common_pictures = os.path.join(self.directory_main, 'pictures', 'common')  # common pictures
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
            color_default=layout.color_default, game_pictures_folder=self.directory_game_pictures,
            common_pictures_folder=self.directory_common_pictures)

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
            button_qsize=action_button_qsize, tooltip='add build order')

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

        # keyboard and mouse global hotkeys
        self.hotkey_names = ['next_panel', 'show_hide', 'build_order_previous_step', 'build_order_next_step']
        self.keyboard_mouse = KeyboardMouseManagement(print_unset=False)

        self.mouse_buttons_dict = dict()  # dictionary as {keyboard_name: mouse_button_name}
        self.set_keyboard_mouse()

        # build order tooltip
        layout = self.settings.layout
        tooltip = layout.build_order_tooltip
        self.build_order_tooltip = MultiQLabelWindow(
            font_police=layout.font_police, font_size=layout.font_size, image_height=layout.build_order.image_height,
            border_size=tooltip.border_size, vertical_spacing=tooltip.vertical_spacing,
            color_default=tooltip.color_default, color_background=tooltip.color_background, opacity=tooltip.opacity,
            game_pictures_folder=self.directory_game_pictures, common_pictures_folder=self.directory_common_pictures)

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

        self.build_order_notes.update_settings(
            font_police=layout.font_police, font_size=layout.font_size,
            image_height=layout.build_order.image_height,
            border_size=layout.border_size, vertical_spacing=layout.vertical_spacing,
            color_default=layout.color_default)

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

        # keyboard and mouse global hotkeys
        self.set_keyboard_mouse()

        # build order tooltip
        layout = self.settings.layout
        tooltip = layout.build_order_tooltip
        self.build_order_tooltip.update_settings(
            font_police=layout.font_police, font_size=layout.font_size, image_height=layout.build_order.image_height,
            border_size=tooltip.border_size, vertical_spacing=tooltip.vertical_spacing,
            color_default=tooltip.color_default, color_background=tooltip.color_background, opacity=tooltip.opacity)

        # open popup message
        if update_settings:
            if os.path.exists(self.settings_file):
                msg_text = f'Settings reloaded using the parameters from {self.settings_file}.'
            else:
                msg_text = f'Settings reloaded with the default values ({self.settings_file} not generated).'
            popup_message('RTS Overlay - Reload', msg_text)

        # re-initialization done
        self.init_done = True

    def set_keyboard_mouse(self):
        """Set the keyboard and mouse hotkey inputs"""

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

        self.build_order_tooltip.close()

    def font_size_combo_box_change(self, value):
        """Detect when the font size changed

        Parameters
        ----------
        value    ID of the new font size in 'self.font_size_input_combo_ids'
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
            self.keyboard_mouse.set_all_flags(False)
        else:  # open new panel
            config = self.settings.panel_hotkeys
            self.panel_config_hotkeys = HotkeysWindow(
                parent=self, hotkeys=self.unscaled_settings.hotkeys, game_icon=self.game_icon,
                mouse_image=os.path.join(self.directory_common_pictures, self.settings.images.mouse),
                mouse_height=config.mouse_height, settings_folder=self.directory_settings,
                font_police=config.font_police, font_size=config.font_size, color_font=config.color_font,
                color_background=config.color_background, opacity=config.opacity, border_size=config.border_size,
                edit_width=config.edit_width, edit_height=config.edit_height, button_margin=config.button_margin,
                vertical_spacing=config.vertical_spacing, section_vertical_spacing=config.section_vertical_spacing,
                horizontal_spacing=config.horizontal_spacing, mouse_spacing=config.mouse_spacing)

    def panel_add_build_order(self):
        """Open/close the panel to add a build order"""
        pass  # will be re-implemented in daughter classes

    def get_hotkey_mouse_flag(self, name: str) -> bool:
        """Get the flag value for a global hotkey and/or mouse input

        Parameters
        ----------
        name    field to check

        Returns
        -------
        True if flag activated, False if not activated or not found
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
            # switch to next panel
            if self.get_hotkey_mouse_flag('next_panel'):
                self.next_panel()

            if self.get_hotkey_mouse_flag('show_hide'):  # show/hide overlay
                self.show_hide()

            if self.get_hotkey_mouse_flag('build_order_previous_step'):  # select previous step of the build order
                self.build_order_previous_step()

            if self.get_hotkey_mouse_flag('build_order_next_step'):  # select next step of the build order
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
        config_mouse_checkboxes = self.panel_config_hotkeys.mouse_checkboxes
        config_field_to_mouse = self.panel_config_hotkeys.field_to_mouse

        def split_keyboard_mouse(str_input: str):
            """Split an input between keyboard and mouse parts

            Parameters
            ----------
            str_input    input string from 'OverlaySequenceEdit'

            Returns
            -------
            keyboard input, '' if no keyboard input
            mouse input, '' if no valid mouse input
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
        """Add a build order, from its JSON format

        Parameters
        ----------
        build_order_data    build order data in JSON format

        Returns
        -------
        Text message about the loading action.
        """
        # check if build order content is valid
        valid_bo, bo_error_msg = self.check_valid_build_order(build_order_data, bo_name_msg=True)
        if valid_bo:
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
            msg_text = f'Build order content is not valid: {bo_error_msg}'

        return msg_text

    def add_build_order(self):
        """Try to add the build order written in the new build order panel"""
        msg_text = None
        try:
            # get data as dictionary
            build_order_data = json.loads(self.panel_add_build_order.text_input.toPlainText())
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
        """Save the settings"""
        msg_text = f'Settings saved in {self.settings_file}.'  # message to display
        os.makedirs(os.path.dirname(self.settings_file), exist_ok=True)
        with open(self.settings_file, 'w') as f:
            f.write(json.dumps(self.unscaled_settings.to_dict(), sort_keys=False, indent=4))
            print(msg_text)

        # open popup message
        popup_message('RTS Overlay - Settings saved', msg_text)

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
        self.build_order_tooltip.clear()  # clear tooltip

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
        self.build_order_tooltip.clear()  # clear tooltip

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

        # display build order
        self.build_order_resources.hide()
        self.build_order_notes.hide()


class RTSGameMatchDataOverlay(RTSGameOverlay):
    """RTS game overlay application, including match data"""

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
        super().__init__(directory_main, name_game, settings_name, settings_class, check_valid_build_order,
                         build_order_category_name)

        # selected username
        self.selected_username = self.settings.username if (len(self.settings.username) > 0) else None

        # username selection
        layout = self.settings.layout
        self.username_title = QLabel('Username', self)
        self.username_search = QLineEdit(self)
        self.username_selection = MultiQLabelDisplay(
            font_police=layout.font_police, font_size=layout.font_size, border_size=layout.border_size,
            vertical_spacing=layout.vertical_spacing, color_default=layout.color_default)

        # display match data information
        layout = self.settings.layout
        self.match_data_display = MultiQLabelDisplay(
            font_police=layout.font_police, font_size=layout.font_size,
            image_height=layout.match_data.image_height, border_size=layout.border_size,
            vertical_spacing=layout.vertical_spacing, color_default=layout.color_default,
            game_pictures_folder=self.directory_game_pictures, common_pictures_folder=self.directory_common_pictures)

        self.configuration_initialization_2()

    def reload(self, update_settings):
        """Reload the application settings, build orders...

        Parameters
        ----------
        update_settings   True to update (reload) the settings, False to keep the current ones
        """
        super().reload(update_settings)

        # selected username
        self.selected_username = self.settings.username if (len(self.settings.username) > 0) else None

        # username selection
        layout = self.settings.layout
        self.username_selection.update_settings(
            font_police=layout.font_police, font_size=layout.font_size, border_size=layout.border_size,
            vertical_spacing=layout.vertical_spacing, color_default=layout.color_default)

        # display match data information
        self.match_data_display.update_settings(
            font_police=layout.font_police, font_size=layout.font_size,
            image_height=layout.match_data.image_height, border_size=layout.border_size,
            vertical_spacing=layout.vertical_spacing, color_default=layout.color_default)

        self.configuration_initialization_2()

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
        super().hide_elements()

        # search username
        self.username_title.hide()
        self.username_search.hide()
        self.username_selection.hide()

        # display match data
        self.match_data_display.hide()

    def settings_scaling(self):
        """Apply the scaling on the settings"""
        super().settings_scaling()

        assert 0 <= self.scaling_input_selected_id < len(self.scaling_input_combo_ids)
        layout = self.settings.layout
        unscaled_layout = self.unscaled_settings.layout
        scaling = self.scaling_input_combo_ids[self.scaling_input_selected_id] / 100.0  # [%] -> [-]

        configuration = layout.configuration
        unscaled_configuration = unscaled_layout.configuration

        configuration.search_spacing = scale_int(scaling, unscaled_configuration.search_spacing)
        configuration.username_search_size = scale_list_int(scaling, unscaled_configuration.username_search_size)

        match_data = layout.match_data
        unscaled_match_data = unscaled_layout.match_data
        match_data.image_height = scale_int(scaling, unscaled_match_data.image_height)
        match_data.flag_width = scale_int(scaling, unscaled_match_data.flag_width)
        match_data.flag_height = scale_int(scaling, unscaled_match_data.flag_height)
        match_data.resource_spacing = scale_int(scaling, unscaled_match_data.resource_spacing)

    def configuration_initialization_2(self):
        """Configuration elements initialization (common to constructor and reload),
        cannot be called before the end of the constructor."""
        layout = self.settings.layout
        color_default = layout.color_default
        color_default_str = f'color: rgb({color_default[0]}, {color_default[1]}, {color_default[2]})'
        qwidget_color_default_str = f'QWidget{{ {color_default_str}; border: 1px solid white }};'

        # indicating the selected username
        self.select_username(self.settings.username)

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
