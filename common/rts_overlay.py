import os
import json
from copy import deepcopy

from PyQt5.QtWidgets import QMainWindow, QApplication, QLabel, QShortcut, QLineEdit
from PyQt5.QtWidgets import QWidget, QMessageBox, QComboBox, QDesktopWidget
from PyQt5.QtGui import QKeySequence, QFont, QIcon, QCursor
from PyQt5.QtCore import Qt, QPoint, QSize

from common.build_order_tools import get_build_orders
from common.label_display import MultiQLabelDisplay, QLabelSettings
from common.useful_tools import TwinHoverButton, scale_int, scale_list_int


def check_build_order_key_values(build_order: dict, key_condition: dict = None):
    """Check if a build order fulfills the correct key conditions

    Parameters
    ----------
    build_order      build order to check
    key_condition    dictionary with the keys to look for and their value (to consider as valid), None to skip it

    Returns
    -------
    True if no key condition or key conditions are correct
    """
    if key_condition is None:  # no key condition to check
        return True

    for key, value in key_condition.items():  # loop  on the key conditions
        if key in build_order:
            data_check = build_order[key]
            is_list = isinstance(data_check, list)
            if (is_list and (value not in data_check)) or ((not is_list) and (value != data_check)):
                return False  # at least on key condition not met

    return True  # all conditions met


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
                with open(self.settings_file, 'r') as f:
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
        self.setWindowIcon(QIcon(os.path.join(self.directory_common_pictures, images.game_icon)))

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
            color_default=layout.color_default, game_pictures_folder=self.directory_game_pictures)

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

        # build order panel buttons
        self.build_order_previous_button = TwinHoverButton(
            parent=self, click_connect=self.build_order_previous_step,
            icon=QIcon(os.path.join(self.directory_common_pictures, images.build_order_previous_step)),
            button_qsize=action_button_qsize, tooltip='previous build order step')

        self.build_order_next_button = TwinHoverButton(
            parent=self, click_connect=self.build_order_next_step,
            icon=QIcon(os.path.join(self.directory_common_pictures, images.build_order_next_step)),
            button_qsize=action_button_qsize, tooltip='next build order step')

        # hide the application
        hotkeys = self.settings.hotkeys
        self.hotkey_hide = QShortcut(QKeySequence(hotkeys.hide), self)
        self.hotkey_hide.activated.connect(self.show_hide)

        # select the next build order
        self.hotkey_next_build_order = QShortcut(QKeySequence(hotkeys.select_next_build_order), self)
        self.hotkey_next_build_order.activated.connect(self.select_build_order_id)

        # go to the previous step of the build order
        self.hotkey_build_order_previous_step = QShortcut(
            QKeySequence(hotkeys.build_order_previous_step), self)
        self.hotkey_build_order_previous_step.activated.connect(self.build_order_previous_step)

        # go to the next step of the build order
        self.hotkey_build_order_next_step = QShortcut(QKeySequence(hotkeys.build_order_next_step), self)
        self.hotkey_build_order_next_step.activated.connect(self.build_order_next_step)

        # select the next panel
        self.hotkey_panel = QShortcut(QKeySequence(hotkeys.next_panel), self)
        self.hotkey_panel.activated.connect(self.next_panel)

        # enter key selection
        self.hotkey_enter = QShortcut(QKeySequence(hotkeys.enter), self)
        self.hotkey_enter.activated.connect(self.enter_key_actions)

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
                with open(self.settings_file, 'r') as f:
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
        self.setWindowIcon(QIcon(os.path.join(self.directory_common_pictures, images.game_icon)))

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

        # build order panel buttons
        self.build_order_previous_button.update_icon_size(
            QIcon(os.path.join(self.directory_common_pictures, images.build_order_previous_step)), action_button_qsize)

        self.build_order_next_button.update_icon_size(
            QIcon(os.path.join(self.directory_common_pictures, images.build_order_next_step)), action_button_qsize)

        # hotkeys
        hotkeys = self.settings.hotkeys
        self.hotkey_hide.setKey(QKeySequence(hotkeys.hide))
        self.hotkey_next_build_order.setKey(QKeySequence(hotkeys.select_next_build_order))
        self.hotkey_build_order_previous_step.setKey(QKeySequence(hotkeys.build_order_previous_step))
        self.hotkey_build_order_next_step.setKey(QKeySequence(hotkeys.build_order_next_step))
        self.hotkey_panel.setKey(QKeySequence(hotkeys.next_panel))
        self.hotkey_enter.setKey(QKeySequence(hotkeys.enter))

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
        qwidget_color_default_str = f'QWidget{{ {color_default_str} }};'

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
        self.setStyleSheet(
            f'background-color: rgb({color_background[0]}, {color_background[1]}, {color_background[2]})')
        self.setWindowOpacity(layout.opacity)

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

        self.next_panel_button.close()
        self.build_order_previous_button.close()
        self.build_order_next_button.close()

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

    def timer_mouse_call(self):
        """Function called on a timer (related to mouse motion)"""
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

    def show_hide(self):
        """Show or hide the windows"""
        self.hidden = not self.hidden  # change the hidden state

        # adapt opacity
        if self.hidden:
            self.setWindowOpacity(0.0)
        else:
            self.setWindowOpacity(self.settings.layout.opacity)

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

    def is_mouse_in_roi(self, x: int, y: int, width: int, height: int):
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

    def is_mouse_in_roi_widget(self, widget: QWidget):
        """Check if the last updated mouse position (using 'update_mouse') is in the ROI of a widget

        Parameters
        ----------
        widget    widget to check
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
            self.settings.layout.upper_right_position = [self.x() + self.width(), self.y()]
            self.unscaled_settings.layout.upper_right_position = [self.x() + self.width(), self.y()]

    def build_order_click_select(self, event):
        """Check if a build order is being clicked

        Parameters
        ----------
        event    mouse event
        """
        if event.buttons() == Qt.LeftButton:  # pressing the left button
            if len(self.valid_build_orders) > 1:  # more than one build order for change
                self.update_mouse()
                build_order_ids = self.build_order_selection.get_mouse_label_id(
                    self.mouse_x - self.x(), self.mouse_y - self.y())
                if (len(build_order_ids) == 2) and (build_order_ids[1] == 0) and (
                        0 <= build_order_ids[0] < len(self.valid_build_orders)):
                    if not self.select_build_order_id(build_order_ids[0]):
                        print(f'Could not select build order with ID {build_order_ids[0]}.')

    def save_upper_right_position(self):
        """Save of the upper right corner position"""
        self.upper_right_position = [self.x() + self.width(), self.y()]

    def update_position(self):
        """Update the position to stick to the saved upper right corner"""
        self.move(self.upper_right_position[0] - self.width(), self.upper_right_position[1])

    def build_order_previous_step(self):
        """Select the previous step of the build order

        Returns
        -------
        True if build order step changed
        """
        old_selected_build_order_step_id = self.selected_build_order_step_id
        self.selected_build_order_step_id = max(0, min(self.selected_build_order_step_id - 1,
                                                       self.selected_build_order_step_count - 1))
        return old_selected_build_order_step_id != self.selected_build_order_step_id

    def build_order_next_step(self):
        """Select the next step of the build order

        Returns
        -------
        True if build order step changed
        """
        old_selected_build_order_step_id = self.selected_build_order_step_id
        self.selected_build_order_step_id = max(0, min(self.selected_build_order_step_id + 1,
                                                       self.selected_build_order_step_count - 1))
        return old_selected_build_order_step_id != self.selected_build_order_step_id

    def select_build_order_id(self, build_order_id: int = -1):
        """Select build order ID

        Parameters
        ----------
        build_order_id    ID of the build order, negative to select next build order

        Returns
        -------
        True if build order changed
        """
        if len(self.valid_build_orders) > 1:  # more than one build order
            if build_order_id >= 0:  # build order ID given
                if (0 <= build_order_id < len(self.valid_build_orders)) and (
                        build_order_id != self.build_order_selection_id):
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
        search_split = build_order_search_string.split(' ')  # split according to spaces

        for build_order in self.build_orders:  # loop on the build orders
            # only select a maximum of number of valid build orders
            if len(self.valid_build_orders) >= self.settings.layout.configuration.bo_list_max_count:
                break

            # check that key conditions are met
            if not check_build_order_key_values(build_order, key_condition):
                continue  # check the next build order (this one does not meet all the key requirements)

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

        # sort by string length
        self.valid_build_orders.sort(key=len)

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
