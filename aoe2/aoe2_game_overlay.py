# AoE2 game overlay
import os
import shutil
from enum import Enum
from threading import Event

from PyQt5.QtWidgets import QApplication, QComboBox
from PyQt5.QtGui import QIcon, QFont
from PyQt5.QtCore import Qt, QSize

from common.label_display import QLabelSettings
from common.useful_tools import cut_name_length, widget_x_end, widget_y_end, popup_message
from common.rts_overlay import RTSGameMatchDataOverlay, scale_list_int
from common.build_order_tools import get_total_on_resource, get_build_orders
from common.build_order_window import BuildOrderWindow

from aoe2.aoe2_settings import AoE2OverlaySettings
from aoe2.aoe2_build_order import check_valid_aoe2_build_order, build_order_sorting
from aoe2.aoe2_request import get_match_data_threading, is_valid_fetch_match_data
from aoe2.aoe2_civ_icon import aoe2_civilization_icon


# ID of the panel to display
class PanelID(Enum):
    CONFIG = 0  # Configuration
    BUILD_ORDER = 1  # Display Build Order
    MATCH_DATA = 2  # Display Match Data


class AoE2GameOverlay(RTSGameMatchDataOverlay):
    """Game overlay application for AoE2"""

    def __init__(self, directory_main: str):
        """Constructor

        Parameters
        ----------
        directory_main    directory where the main file is located
        """
        super().__init__(directory_main=directory_main, name_game='aoe2', settings_name='aoe2_settings.json',
                         settings_class=AoE2OverlaySettings, check_valid_build_order=check_valid_aoe2_build_order)

        # build order instructions
        self.build_order_instructions = \
            'Replace this text by any build order in correct JSON format (see Readme.md), ' \
            'then click on \'Add build order\'.' \
            '\n\nYou can get many build orders with the requested format from buildorderguide.com ' \
            '(use the corresponding button below).' \
            '\nAfter selecting a build order, click on \'Copy to clipboard for RTS Overlay\' ' \
            '(on buildorderguide.com), then paste the content here.' \
            '\nYou can also manually write your build order as JSON format, following the guidelines in Readme.md ' \
            'or adapt one of the existing ones.' \
            '\n\nYou can find all your saved build orders as JSON files by clicking on \'Open build orders folder\'.' \
            '\nTo remove any build order, just delete the corresponding file and use \'reload settings\' ' \
            '(or relaunch the overlay).'

        self.selected_panel = PanelID.CONFIG  # panel to display

        # civilization selection
        layout = self.settings.layout
        color_default = layout.color_default
        style_description = f'color: rgb({color_default[0]}, {color_default[1]}, {color_default[2]})'
        configuration = layout.configuration
        civilization_icon_select_size = configuration.civilization_icon_select_size

        self.civilization_select = QComboBox(self)
        self.civilization_select.activated.connect(self.update_build_order_display)
        self.civilization_combo_ids = []  # corresponding IDs
        for civ_name, letters_icon in aoe2_civilization_icon.items():
            assert len(letters_icon) == 2
            self.civilization_select.addItem(
                QIcon(os.path.join(self.directory_game_pictures, 'civilization', letters_icon[1])), letters_icon[0])
            self.civilization_combo_ids.append(civ_name)
        self.civilization_select.setIconSize(QSize(civilization_icon_select_size[0], civilization_icon_select_size[1]))
        self.civilization_select.setStyleSheet(f'QWidget{{ {style_description} }};')
        self.civilization_select.setToolTip('select your civilization (or use generic)')
        self.civilization_select.setFont(QFont(layout.font_police, layout.font_size))
        self.civilization_select.adjustSize()

        # match data
        self.match_data_thread_started = False  # True after the first call to 'get_match_data_threading'
        self.store_match_data = []  # used for url requests in parallel thread
        self.match_data = None  # match data to use
        self.match_data_warnings = []  # warnings related to match data not found
        self.match_data_thread_id = None
        self.match_data_stop_flag = Event()

        # initialize build orders if folder does not exist and copy the samples
        self.sample_directory_build_orders = os.path.join(self.directory_main, 'build_orders', self.name_game)
        if not os.path.isdir(self.directory_build_orders):
            os.makedirs(self.directory_build_orders, exist_ok=True)  # create directory

            # copy files
            for file_name in os.listdir(self.sample_directory_build_orders):
                source = os.path.join(self.sample_directory_build_orders, file_name)
                destination = os.path.join(self.directory_build_orders, file_name)
                if os.path.isfile(source):
                    shutil.copy(source, destination)

            # load build orders
            self.build_orders = get_build_orders(self.directory_build_orders, self.check_valid_build_order,
                                                 category_name=self.build_order_category_name)

            # display popup message
            popup_message('AoE2 build orders initialization',
                          f'AoE2 sample build orders copied in {self.directory_build_orders}.')

        # sort build orders
        self.build_orders.sort(key=build_order_sorting)

        self.update_panel_elements()  # update the current panel elements

    def reload(self, update_settings):
        """Reload the application settings, build orders...

        Parameters
        ----------
        update_settings   True to update (reload) the settings, False to keep the current ones
        """
        super().reload(update_settings=update_settings)

        # civilization selection
        layout = self.settings.layout
        color_default = layout.color_default
        style_description = f'color: rgb({color_default[0]}, {color_default[1]}, {color_default[2]})'
        configuration = layout.configuration
        civilization_icon_select_size = configuration.civilization_icon_select_size

        self.civilization_select.setIconSize(QSize(civilization_icon_select_size[0], civilization_icon_select_size[1]))
        self.civilization_select.setStyleSheet(f'QWidget{{ {style_description} }};')
        self.civilization_select.setFont(QFont(layout.font_police, layout.font_size))
        self.civilization_select.adjustSize()

        # game match data
        self.match_data = None  # match data to use
        self.match_data_warnings = []  # warnings related to match data not found

        # sort build orders
        self.build_orders.sort(key=build_order_sorting)

        self.update_panel_elements()  # update the current panel elements

    def settings_scaling(self):
        """Apply the scaling on the settings"""
        super().settings_scaling()
        assert 0 <= self.scaling_input_selected_id < len(self.scaling_input_combo_ids)
        layout = self.settings.layout
        unscaled_layout = self.unscaled_settings.layout
        scaling = self.scaling_input_combo_ids[self.scaling_input_selected_id] / 100.0

        configuration = layout.configuration
        unscaled_configuration = unscaled_layout.configuration

        configuration.civilization_icon_select_size = scale_list_int(
            scaling, unscaled_configuration.civilization_icon_select_size)

    def quit_application(self):
        """Quit the application"""
        super().quit_application()

        self.match_data_stop_flag.set()
        if self.match_data_thread_id is not None:
            self.match_data_thread_id.join()

        self.close()

    def mousePressEvent(self, event):
        """Actions related to the mouse pressing events

        Parameters
        ----------
        event    mouse event
        """
        if self.selected_panel == PanelID.CONFIG:  # only needed when in configuration mode
            self.build_order_click_select(event)

    def mouseMoveEvent(self, event):
        """Actions related to the mouse moving events

        Parameters
        ----------
        event    mouse event
        """
        if self.selected_panel == PanelID.CONFIG:  # only needed when in configuration mode
            self.move_window(event)

    def update_panel_elements(self):
        """Update the elements of the panel to display"""
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
        elif self.selected_panel == PanelID.MATCH_DATA:  # Display Match Data
            self.update_match_data_display()

        # show the main window
        self.show()

    def next_panel(self):
        """Select the next panel"""

        # clear tooltip
        self.build_order_tooltip.clear()

        # saving the upper right corner position
        if self.selected_panel == PanelID.CONFIG:
            self.save_upper_right_position()

        if self.selected_panel == PanelID.CONFIG:
            self.selected_panel = PanelID.BUILD_ORDER
        elif self.selected_panel == PanelID.BUILD_ORDER:
            if is_valid_fetch_match_data(self.settings.fetch_match_data):
                self.selected_panel = PanelID.MATCH_DATA
            else:
                self.selected_panel = PanelID.CONFIG
        elif self.selected_panel == PanelID.MATCH_DATA:
            self.selected_panel = PanelID.CONFIG

        if self.selected_panel == PanelID.CONFIG:
            # configuration selected build order
            if self.selected_build_order is not None:
                self.build_order_search.setText(self.selected_build_order_name)

        self.update_panel_elements()  # update the elements of the panel to display
        self.update_position()  # restoring the upper right corner position

    def hide_elements(self):
        """Hide elements"""
        super().hide_elements()

        self.civilization_select.hide()

    def get_age_image(self, age_id: int) -> str:
        """Get the image for a requested age

        Parameters
        ----------
        age_id    ID of the age

        Returns
        -------
        age image with path
        """
        if age_id == 1:
            return self.settings.images.age_1
        elif age_id == 2:
            return self.settings.images.age_2
        elif age_id == 3:
            return self.settings.images.age_3
        elif age_id == 4:
            return self.settings.images.age_4
        else:
            return self.settings.images.age_unknown

    def add_build_order_json_data(self, build_order_data: dict) -> str:
        """Add a build order, from its JSON format

        Parameters
        ----------
        build_order_data    build order data in JSON format

        Returns
        -------
        Text message about the loading action.
        """
        msg_text = super().add_build_order_json_data(build_order_data)

        # sort build orders
        self.build_orders.sort(key=build_order_sorting)

        return msg_text

    def update_build_order_display(self):
        """Update the build order search matching display"""
        civilization_id = self.civilization_select.currentIndex()
        assert 0 <= civilization_id < len(self.civilization_combo_ids)
        self.obtain_build_order_search(key_condition={'civilization': self.civilization_combo_ids[civilization_id]})
        self.config_panel_layout()

    def config_panel_layout(self):
        """Layout of the configuration panel"""

        # save corner position
        self.save_upper_right_position()

        # show elements
        self.config_quit_button.show()
        self.config_save_button.show()
        self.config_reload_button.show()
        self.config_hotkey_button.show()
        self.config_build_order_button.show()
        self.font_size_input.show()
        self.scaling_input.show()
        self.next_panel_button.show()

        self.civilization_select.show()

        self.build_order_title.show()
        self.build_order_search.show()
        self.build_order_selection.show()

        self.username_title.show()
        self.username_search.show()
        self.username_selection.show()

        # configuration buttons
        layout = self.settings.layout
        border_size = layout.border_size
        vertical_spacing = layout.vertical_spacing
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
        self.next_panel_button.move(next_x, border_size)
        next_y = border_size + max(action_button_size, self.font_size_input.height(),
                                   self.scaling_input.height()) + vertical_spacing  # next Y position

        # build order selection
        self.build_order_title.move(border_size, next_y)
        next_x = border_size + self.build_order_title.width() + horizontal_spacing

        # civilization selection
        self.civilization_select.move(next_x, next_y)

        if self.civilization_select.height() > self.build_order_title.height():
            self.build_order_title.move(self.build_order_title.x(),
                                        widget_y_end(self.civilization_select) - self.build_order_title.height())
        next_y += max(self.build_order_title.height(), self.civilization_select.height()) + vertical_spacing

        # build order search
        self.build_order_search.move(border_size, next_y)
        next_y += self.build_order_search.height() + vertical_spacing

        if widget_x_end(self.build_order_search) > widget_x_end(self.civilization_select):
            self.civilization_select.move(
                widget_x_end(self.build_order_search) - self.civilization_select.width(), self.civilization_select.y())
        elif widget_x_end(self.build_order_search) < widget_x_end(self.civilization_select):
            self.build_order_search.resize(
                widget_x_end(self.civilization_select) - self.build_order_search.x(), self.build_order_search.height())

        self.build_order_selection.update_size_position(init_y=next_y)

        # username selection
        layout_configuration = layout.configuration
        next_x = layout_configuration.search_spacing + max(
            widget_x_end(self.civilization_select), widget_x_end(self.build_order_search),
            self.build_order_selection.x() + self.build_order_selection.row_max_width)

        self.username_title.move(next_x, self.build_order_title.y())
        self.username_search.move(next_x, self.build_order_search.y())
        self.username_selection.update_size_position(init_x=next_x, init_y=next_y)

        max_x = max(widget_x_end(self.next_panel_button),
                    widget_x_end(self.username_title), widget_x_end(self.username_search),
                    self.username_selection.x() + self.username_selection.row_max_width)

        max_y = max(widget_y_end(self.build_order_search),
                    self.build_order_selection.y() + self.build_order_selection.row_total_height,
                    widget_y_end(self.username_search),
                    self.username_selection.y() + self.username_selection.row_total_height)

        # resize main window
        self.resize(max_x + border_size, max_y + border_size)

        # next panel on the top right corner
        self.next_panel_button.move(self.width() - border_size - self.next_panel_button.width(), border_size)

        # update position (in case the size changed)
        self.update_position()

    def build_order_previous_step(self):
        """Select the previous step of the build order"""
        if (self.selected_panel == PanelID.BUILD_ORDER) and super().build_order_previous_step():
            self.update_build_order()  # update the rendering

    def build_order_next_step(self):
        """Select the next step of the build order"""
        if (self.selected_panel == PanelID.BUILD_ORDER) and super().build_order_next_step():
            self.update_build_order()  # update the rendering

    def select_build_order_id(self, build_order_id: int = -1) -> bool:
        """Select build order ID

        Parameters
        ----------
        build_order_id    ID of the build order, negative to select next build order

        Returns
        -------
        True if valid build order selection
        """
        if self.selected_panel == PanelID.CONFIG:
            if super().select_build_order_id(build_order_id):
                civilization_id = self.civilization_select.currentIndex()
                assert 0 <= civilization_id < len(self.civilization_combo_ids)
                self.obtain_build_order_search(
                    key_condition={'civilization': self.civilization_combo_ids[civilization_id]})
                if build_order_id >= 0:  # directly select in case of clicking
                    self.select_build_order(key_condition={
                        'civilization': self.civilization_combo_ids[self.civilization_select.currentIndex()]})
                self.config_panel_layout()
                return True
        return False

    def update_build_order(self):
        """Update the build order panel"""

        # clear the elements (also hide them)
        self.build_order_resources.clear()
        self.build_order_notes.clear()

        if self.selected_build_order is None:  # no build order selected
            self.build_order_notes.add_row_from_picture_line(parent=self, line='No build order selected.')

        else:  # valid build order selected
            selected_build_order_content = self.selected_build_order['build_order']

            # select current step
            assert 0 <= self.selected_build_order_step_id < self.selected_build_order_step_count
            selected_step = selected_build_order_content[self.selected_build_order_step_id]
            assert selected_step is not None

            # target resources
            target_resources = selected_step['resources']
            target_wood = get_total_on_resource(target_resources['wood'])
            target_food = get_total_on_resource(target_resources['food'])
            target_gold = get_total_on_resource(target_resources['gold'])
            target_stone = get_total_on_resource(target_resources['stone'])
            target_builder = get_total_on_resource(target_resources['builder']) if (
                    'builder' in target_resources) else -1
            target_villager = selected_step['villager_count']

            # space between the resources
            spacing = ''
            layout = self.settings.layout
            for i in range(layout.build_order.resource_spacing):
                spacing += ' '

            # display selected step
            self.build_order_step.setText(
                f'Step: {self.selected_build_order_step_id + 1}/{self.selected_build_order_step_count}')

            images = self.settings.images

            # line to display the target resources
            resources_line = images.wood + '@ ' + (str(target_wood) if (target_wood >= 0) else ' ')
            resources_line += spacing + '@' + images.food + '@ ' + (str(target_food) if (target_food >= 0) else ' ')
            resources_line += spacing + '@' + images.gold + '@ ' + (str(target_gold) if (target_gold >= 0) else ' ')
            resources_line += spacing + '@' + images.stone + '@ ' + (
                str(target_stone) if (target_stone >= 0) else ' ')
            if target_builder > 0:  # add builders count if indicated
                resources_line += spacing + '@' + images.builder + '@ ' + str(target_builder)
            if target_villager >= 0:
                resources_line += spacing + '@' + images.villager + '@ ' + str(target_villager)
            if 1 <= selected_step['age'] <= 4:
                resources_line += spacing + '@' + self.get_age_image(selected_step['age'])
            if ('time' in selected_step) and (selected_step['time'] != ''):  # add time if indicated
                resources_line += '@' + spacing + '@' + self.settings.images.time + '@' + selected_step['time']

            # for dict type target_resources, create a tooltip to associate with the resource icon
            mapping = {'wood': images.wood, 'food': images.food, 'gold': images.gold, 'stone': images.stone}
            tooltip = dict((mapping[key], value) for (key, value) in target_resources.items() if type(value) is dict)
            self.build_order_resources.add_row_from_picture_line(
                parent=self, line=str(resources_line), tooltips=tooltip)

            # notes of the current step
            notes = selected_step['notes']
            for note in notes:
                self.build_order_notes.add_row_from_picture_line(parent=self, line=note)

        self.build_order_panel_layout()  # update layout

    def build_order_panel_layout(self):
        """Layout of the Build order panel"""

        # show elements
        if self.selected_build_order is not None:
            self.build_order_step.show()
            self.build_order_previous_button.show()
            self.build_order_next_button.show()
        self.next_panel_button.show()
        self.build_order_notes.show()
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
            self.build_order_step.adjustSize()
            next_y = max(next_y, border_size + self.build_order_step.height() + vertical_spacing)

        # build order resources
        self.build_order_resources.update_size_position(init_y=next_y)
        next_y += self.build_order_resources.row_total_height + vertical_spacing
        self.build_order_notes.update_size_position(init_y=next_y)

        # resize of the full window
        max_x = border_size + max(
            (self.build_order_step.width() + 3 * action_button_size +
             horizontal_spacing + action_button_spacing + bo_next_tab_spacing),
            self.build_order_resources.row_max_width,
            self.build_order_notes.row_max_width)

        self.resize(max_x + border_size, next_y + self.build_order_notes.row_total_height + border_size)

        # action buttons on the top right corner
        next_x = self.width() - border_size - action_button_size
        self.next_panel_button.move(next_x, border_size)

        if self.selected_build_order is not None:
            next_x -= (action_button_size + bo_next_tab_spacing)
            self.build_order_next_button.move(next_x, border_size)

            next_x -= (action_button_size + action_button_spacing)
            self.build_order_previous_button.move(next_x, border_size)

            next_x -= (self.build_order_step.width() + horizontal_spacing)
            self.build_order_step.move(next_x, border_size)

        # position update to stay with the same upper right corner position
        self.update_position()

    def fetch_game_match_data(self):
        """Fetch the game match data"""
        if self.selected_username is not None:  # only available if valid username
            # new tread call can be launched
            if (not self.match_data_thread_started) or (len(self.store_match_data) >= 1):

                # update valid new match found if last url calls are done
                if len(self.store_match_data) >= 1:
                    if self.store_match_data[0] is not None:
                        if self.store_match_data[0].match_id is not None:
                            self.match_data = self.store_match_data[0]
                        elif self.match_data is None:
                            self.match_data_warnings = self.store_match_data[0].warnings
                    self.store_match_data.clear()

                # launch new thread search
                if is_valid_fetch_match_data(self.settings.fetch_match_data):
                    if self.match_data is None:
                        self.match_data_thread_id = get_match_data_threading(
                            self.settings.fetch_match_data, self.store_match_data, stop_event=self.match_data_stop_flag,
                            search_input=self.selected_username, timeout=self.settings.url_timeout)
                    else:
                        self.match_data_thread_id = get_match_data_threading(
                            self.settings.fetch_match_data, self.store_match_data, stop_event=self.match_data_stop_flag,
                            search_input=self.selected_username, timeout=self.settings.url_timeout,
                            last_match_id=self.match_data.match_id, last_data_found=self.match_data.all_data_found)
                else:
                    self.match_data_thread_id = None

                self.match_data_thread_started = True

    def update_match_data_display(self):
        """Display match data panel"""
        self.match_data_display.clear()

        if self.selected_username is None:
            self.match_data_display.add_row_from_picture_line(
                parent=self, line='No username provided to find match data.')

        elif self.match_data_thread_id is None:  # match data search not started
            self.match_data_display.add_row_from_picture_line(
                parent=self, line='Match data search not yet started.')

        elif self.match_data is None:  # user match data not found
            self.match_data_display.add_row_from_picture_line(
                parent=self, line=f'No match found (yet) for \'{self.selected_username}\'.')
            for warning_comment in self.match_data_warnings:
                self.match_data_display.add_row_from_picture_line(parent=self, line=warning_comment)

        else:  # valid match available
            # check if some columns must be shown (available for one player or more)
            country_show = False  # check if country flags must be shown
            single_elo_show = False  # check if single ELO must be shown
            win_loss_show = False  # check if wins and losses must be shown
            for cur_player in self.match_data.players:
                if cur_player.country is not None:
                    country_show = True
                if cur_player.elo_solo is not None:
                    single_elo_show = True
                if cur_player.win_rate is not None:
                    win_loss_show = True

            # color for the ELO
            layout_match_data = self.settings.layout.match_data  # settings of the match data layout
            color_elo = layout_match_data.color_elo if win_loss_show else layout_match_data.color_elo_no_win_loss
            color_elo_solo = layout_match_data.color_elo_solo if win_loss_show else \
                layout_match_data.color_elo_solo_no_win_loss

            max_length = layout_match_data.match_data_max_length  # max length of the data to display

            # separation spaces between elements
            separation = '@'
            for i in range(layout_match_data.resource_spacing):
                separation += ' '
            separation += '@'

            # describe the title row with its settings
            title_line = ''
            title_labels_settings = []

            # player color
            title_line += ' '
            title_labels_settings.append(None)

            # civilization icon
            title_line += separation + ' '
            title_labels_settings.append(None)
            title_labels_settings.append(None)

            # player name column, used to display the map name
            if self.match_data.map_name is not None:
                title_line += separation + cut_name_length(self.match_data.map_name, max_length)
            else:
                title_line += separation + cut_name_length('Unknown map', max_length)
            title_labels_settings.append(None)
            title_labels_settings.append(
                QLabelSettings(text_color=layout_match_data.color_map, text_bold=True, text_alignment='left'))

            # single ELO show
            if single_elo_show:
                title_line += separation + 'Solo'
                title_labels_settings.append(None)
                title_labels_settings.append(QLabelSettings(text_color=color_elo_solo, text_bold=True,
                                                            text_alignment='center'))

            # game type ELO
            if single_elo_show:
                title_line += separation + 'Team'
            else:
                title_line += separation + 'Elo'
            title_labels_settings.append(None)
            title_labels_settings.append(
                QLabelSettings(text_color=color_elo, text_bold=True, text_alignment='center'))

            # player rank
            title_line += separation + 'Rank'
            title_labels_settings.append(None)
            title_labels_settings.append(
                QLabelSettings(text_color=layout_match_data.color_rank, text_bold=True, text_alignment='center'))

            # player win rate
            if win_loss_show:
                title_line += separation + 'Win%'
                title_labels_settings.append(None)
                title_labels_settings.append(
                    QLabelSettings(text_color=layout_match_data.color_win_rate, text_bold=True,
                                   text_alignment='center'))

            # player wins
            if win_loss_show:
                title_line += separation + 'Win'
                title_labels_settings.append(None)
                title_labels_settings.append(
                    QLabelSettings(text_color=layout_match_data.color_wins, text_bold=True, text_alignment='center'))

            # player losses
            if win_loss_show:
                title_line += separation + 'Loss'
                title_labels_settings.append(None)
                title_labels_settings.append(
                    QLabelSettings(text_color=layout_match_data.color_losses, text_bold=True, text_alignment='center'))

            # next panel (+ optional country flag)
            title_line += separation + ' '
            title_labels_settings.append(None)
            title_labels_settings.append(None)

            # display title line
            self.match_data_display.add_row_from_picture_line(parent=self, line=title_line,
                                                              labels_settings=title_labels_settings)

            # loop on the players
            for cur_player in self.match_data.players:
                player_line = ''
                player_labels_settings = []

                # player color
                color_str = '?'  # assuming unknown color string
                color = self.settings.layout.color_default  # use default color

                color_id = cur_player.color
                if (color_id is not None) and isinstance(color_id, int):
                    color_str = str(color_id)

                    if color_id == 1:
                        color = layout_match_data.color_player_1
                    elif color_id == 2:
                        color = layout_match_data.color_player_2
                    elif color_id == 3:
                        color = layout_match_data.color_player_3
                    elif color_id == 4:
                        color = layout_match_data.color_player_4
                    elif color_id == 5:
                        color = layout_match_data.color_player_5
                    elif color_id == 6:
                        color = layout_match_data.color_player_6
                    elif color_id == 7:
                        color = layout_match_data.color_player_7
                    elif color_id == 8:
                        color = layout_match_data.color_player_8
                    else:
                        print(f'Unknown color ID {color_id}.')

                if not isinstance(color, list):
                    print(f'Invalid player color {color}, using the default one.')
                    color = self.settings.layout.color_default

                player_line += color_str
                player_labels_settings.append(QLabelSettings(text_alignment='center', text_color=color, text_bold=True))

                # civilization icon
                if cur_player.civ is not None:
                    player_line += separation + f'civilization/{aoe2_civilization_icon[cur_player.civ][1]}' if (
                            cur_player.civ in aoe2_civilization_icon) else cur_player.civ
                else:
                    player_line += separation + '?'
                player_labels_settings.append(None)
                player_labels_settings.append(QLabelSettings(text_alignment='center'))

                # player name
                if cur_player.name is not None:
                    player_line += separation + cut_name_length(cur_player.name, max_length)
                else:
                    player_line += separation + 'Unknown'
                player_labels_settings.append(None)
                player_labels_settings.append(
                    QLabelSettings(text_color=layout_match_data.color_player_name, text_alignment='left'))

                # single ELO show
                if single_elo_show:
                    player_labels_settings.append(None)
                    if cur_player.elo_solo is not None:
                        player_line += separation + str(cur_player.elo_solo)
                        player_labels_settings.append(
                            QLabelSettings(text_color=color_elo_solo, text_alignment='right'))
                    else:
                        player_line += separation + '-'
                        player_labels_settings.append(
                            QLabelSettings(text_color=color_elo_solo, text_alignment='center'))

                # game type ELO
                if cur_player.elo is not None:
                    player_line += separation + str(cur_player.elo)
                else:
                    player_line += separation + '-'
                player_labels_settings.append(None)
                player_labels_settings.append(
                    QLabelSettings(text_color=color_elo, text_alignment='right'))

                # player rank
                if cur_player.rank is not None:
                    player_line += separation + '#' + str(cur_player.rank)
                else:
                    player_line += separation + '-'
                player_labels_settings.append(None)
                player_labels_settings.append(
                    QLabelSettings(text_color=layout_match_data.color_rank, text_alignment='right'))

                # player win rate
                if win_loss_show:
                    if cur_player.win_rate is not None:
                        player_line += separation + str(cur_player.win_rate) + '%'
                    else:
                        player_line += separation + '-'
                    player_labels_settings.append(None)
                    player_labels_settings.append(
                        QLabelSettings(text_color=layout_match_data.color_win_rate, text_alignment='right'))

                # player wins
                if win_loss_show:
                    if cur_player.wins is not None:
                        player_line += separation + str(cur_player.wins)
                    else:
                        player_line += separation + '-'
                    player_labels_settings.append(None)
                    player_labels_settings.append(
                        QLabelSettings(text_color=layout_match_data.color_wins, text_alignment='right'))

                # player losses
                if win_loss_show:
                    if cur_player.losses is not None:
                        player_line += separation + str(cur_player.losses)
                    else:
                        player_line += separation + '-'
                    player_labels_settings.append(None)
                    player_labels_settings.append(
                        QLabelSettings(text_color=layout_match_data.color_losses, text_alignment='right'))

                # country flag
                player_labels_settings.append(None)
                if country_show:
                    flag_name = cur_player.country if (cur_player.country is not None) else 'unknown'
                    country_flag_image = os.path.join(self.directory_common_pictures, 'national_flag',
                                                      f'{flag_name.lower()}.png')
                    player_line += separation + f'national_flag/{flag_name.lower()}.png' if os.path.isfile(
                        country_flag_image) else flag_name
                    player_labels_settings.append(QLabelSettings(image_width=layout_match_data.flag_width,
                                                                 image_height=layout_match_data.flag_height,
                                                                 text_alignment='center'))
                else:
                    player_line += separation
                    for i in range(layout_match_data.flag_space_no_country):
                        player_line += ' '
                    player_labels_settings.append(None)

                # display player line
                self.match_data_display.add_row_from_picture_line(parent=self, line=player_line,
                                                                  labels_settings=player_labels_settings)

        self.game_match_data_layout()  # update layout

    def game_match_data_layout(self):
        """Layout of the game match panel"""
        self.match_data_display.show()
        self.next_panel_button.show()

        # size and position
        self.match_data_display.update_size_position(adapt_to_columns=True)

        # resize of the full window
        border_size = self.match_data_display.border_size

        width = 2 * border_size + self.match_data_display.row_max_width
        if self.match_data is None:  # increase size for the next frame button
            width += self.settings.layout.horizontal_spacing + self.settings.layout.action_button_size

        self.resize(width, 2 * border_size + self.match_data_display.row_total_height)

        # next panel on the top right corner
        self.next_panel_button.move(self.width() - border_size - self.next_panel_button.width(), border_size)
        self.next_panel_button.raise_()  # raise to the top of the parent widget's stack

        # update position (in case the size changed)
        self.update_position()

    def timer_mouse_keyboard_call(self):
        """Function called on a timer (related to mouse and keyboard inputs)"""
        super().timer_mouse_keyboard_call()
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

                # tooltip display
                if not self.build_order_tooltip.is_visible():  # no build order tooltip still active
                    tooltip, label_x, label_y = self.build_order_resources.get_hover_tooltip(
                        0, self.mouse_x - self.x(), self.mouse_y - self.y())
                    if tooltip is not None:  # valid tooltip to display
                        self.build_order_tooltip.display_dictionary(
                            tooltip, self.x() + label_x, self.y() + label_y,
                            self.settings.layout.build_order.tooltip_timeout)

    def timer_match_data_call(self):
        """Function called on a timer (related to match data)"""
        if not self.stop_application:
            self.fetch_game_match_data()

            if self.selected_panel == PanelID.MATCH_DATA:
                self.update_match_data_display()  # layout updated in function

    def enter_key_actions(self):
        """Actions performed when pressing the Enter key"""
        if self.selected_panel == PanelID.CONFIG:
            if self.build_order_search.hasFocus():
                self.select_build_order(key_condition={
                    'civilization': self.civilization_combo_ids[self.civilization_select.currentIndex()]})

            if self.username_search.hasFocus():
                self.select_username()  # update username
                self.fetch_game_match_data()  # launch potential new game search

            self.config_panel_layout()  # update layout

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
                edit_width=config.edit_width, edit_height=config.edit_height,
                edit_init_text=self.build_order_instructions, button_margin=config.button_margin,
                vertical_spacing=config.vertical_spacing, horizontal_spacing=config.horizontal_spacing,
                build_order_websites=[['buildorderguide.com', 'https://buildorderguide.com']])
