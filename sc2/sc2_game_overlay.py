# SC2 game overlay
import os
import json

from PyQt5.QtWidgets import QComboBox, QApplication
from PyQt5.QtGui import QIcon
from PyQt5.QtCore import QSize

from common.useful_tools import widget_x_end, widget_y_end, scale_list_int
from common.rts_overlay import RTSGameOverlay, PanelID
from common.build_order_window import BuildOrderWindow
from common.build_order_tools import get_build_order_timer_steps_display

from sc2.sc2_settings import SC2OverlaySettings, RTSBuildOrderInputLayout
from sc2.sc2_build_order import check_valid_sc2_build_order, get_sc2_build_order_from_spawning_tool
from sc2.sc2_build_order import get_sc2_build_order_step, get_sc2_build_order_template
from sc2.sc2_race_icon import sc2_race_icon, get_sc2_faction_selection


def initialize_race_combo(race_select: QComboBox, opponent_race_select: QComboBox,
                          race_combo_ids: list, opponent_race_combo_ids: list,
                          directory_game_pictures: str, icon_select_size: list,
                          color_background: list, color_default: list):
    """Initialize the combo boxes for race selection

    Parameters
    ----------
    race_select                combo box for the player race to select
    opponent_race_select       combo box for the opponent race to select
    race_combo_ids             list of races corresponding to the combo box 'race_select'
    opponent_race_combo_ids    list of races corresponding to the combo box 'opponent_race_select'
    directory_game_pictures    directory where the game pictures are located
    icon_select_size           size of the icon for race selection
    color_background           color of the background
    color_default              default color for the text
    """
    for race_item in range(2):  # player race, then opponent race
        selected_race_select = race_select if (race_item == 0) else opponent_race_select
        selected_race_combo_ids = race_combo_ids if (race_item == 0) else opponent_race_combo_ids

        for race_name, race_image in sc2_race_icon.items():
            if (race_name != 'Any') or (race_item == 1):  # any opponent race can be selected
                selected_race_select.addItem(
                    QIcon(os.path.join(directory_game_pictures, 'race_icon', race_image)), '')
                selected_race_combo_ids.append(race_name)
        selected_race_select.setIconSize(QSize(icon_select_size[0], icon_select_size[1]))

        selected_race_select.setStyleSheet(
            'QComboBox {' +
            f'background-color: rgb({color_background[0]}, {color_background[1]}, {color_background[2]});' +
            f'color: rgb({color_default[0]}, {color_default[1]}, {color_default[2]});' +
            'border: 0px' +
            '}'
        )
        selected_race_select.setToolTip('select race')
        selected_race_select.adjustSize()


class SC2BuildOrderWindow(BuildOrderWindow):
    """Window to add a new build order, for SC2"""

    def __init__(self, app: QApplication, parent: RTSGameOverlay, game_icon: str, build_order_folder: str,
                 panel_settings: RTSBuildOrderInputLayout, edit_init_text: str, build_order_websites: list,
                 directory_game_pictures: str, directory_common_pictures: str):
        """Constructor

        Parameters
        ----------
        app                          main application instance
        parent                       the parent window
        game_icon                    icon of the game
        build_order_folder           folder where the build orders are saved
        panel_settings               settings for the panel layout
        edit_init_text               initial text for the build order text input
        build_order_websites         list of website elements as [[button name 0, website link 0], [...]],
                                     (each item contains these 2 elements)
        directory_game_pictures      directory where the game pictures are located
        directory_common_pictures    directory where the common pictures are located
        """
        super().__init__(app=app, parent=parent, game_icon=game_icon, build_order_folder=build_order_folder,
                         panel_settings=panel_settings, edit_init_text=edit_init_text,
                         build_order_websites=build_order_websites, directory_game_pictures=directory_game_pictures,
                         directory_common_pictures=directory_common_pictures)

        # button to go from Spawning Tool to JSON data
        assert len(self.website_buttons) >= 1
        self.add_button(
            'Spawning Tool to JSON', self.spawning_tool_to_json,
            widget_x_end(self.website_buttons[-1]) + self.horizontal_spacing, self.folder_button.y())

        # resize the full windows
        self.resize(self.max_width + self.border_size, self.max_y + self.border_size)

    def spawning_tool_to_json(self):
        """Convert the Spawning Tool input to the build order JSON data."""
        init_text = self.text_input.toPlainText()

        try:
            json_data = get_sc2_build_order_from_spawning_tool(data=init_text)
            self.text_input.setText(json.dumps(json_data, indent=4))
            self.check_valid_input_bo()
        except:
            self.build_order = None
            self.text_input.setText(init_text)
            self.check_valid_input.setText('Could not convert the data from Spawning Tool format.')
            self.check_valid_input.adjustSize()


class SC2GameOverlay(RTSGameOverlay):
    """Game overlay application for SC2"""

    def __init__(self, app: QApplication, directory_main: str):
        """Constructor

        Parameters
        ----------
        app               main application instance
        directory_main    directory where the main file is located
        """
        super().__init__(app=app, directory_main=directory_main, name_game='sc2', settings_name='sc2_settings.json',
                         settings_class=SC2OverlaySettings, check_valid_build_order=check_valid_sc2_build_order,
                         get_build_order_step=get_sc2_build_order_step,
                         get_build_order_template=get_sc2_build_order_template,
                         get_faction_selection=get_sc2_faction_selection,
                         build_order_category_name='race',
                         build_order_timer_available=True)

        # build order instructions
        self.build_order_instructions = \
            'Replace this text by any build order in correct format, then click on \'Add build order\'.' \
            '\n\nYou can manually write your build order as JSON format, using the following buttons:' \
            '\n    * \'Reset build order\' : Reset the build order to a minimal template (adapt the initial fields).' \
            '\n    * \'Add step\' : Add a step (i.e. a new page) to the build order.' \
            '\n    * \'Format\' : Format the build order to a proper JSON indentation.' \
            '\n\nIn the \'Image selection\' section, you can obtain images by selecting a category and clicking ' \
            'on the requested image. You can then paste it anywhere in this panel.' \
            '\nThe \'select faction\' category provides all the available race names ' \
            'for the \'race\' and \'opponent_race\' fields.' \
            '\n\nThe build order validity is constantly checked. If it is not valid, a message appears below ' \
            'to explain what is the issue.' \
            '\nFor more details, check the Readme.md and the existing samples.' \
            '\n\nAlternatively, you can copy-paste build orders from Spawning Tool. To do so, click on ' \
            'the \'Spawning Tool\' button, and select any build order.' \
            '\nThen, copy all the lines starting with a supply value and' \
            ' paste them here (replace all these instructions).' \
            '\nThree columns are expected (supply, time, note). Adapt the pasted text if needed.' \
            '\nClick on \'Spawning Tool to JSON\' to convert it to JSON format.' \
            '\nFinally, adapt all the options (race, opponent race, build order name, patch,' \
            ' author and source), before clicking on \'Add build order\'.' \
            '\n\nYou can find all your saved build orders as JSON files by clicking on \'Open build orders folder\'.' \
            '\nTo remove any build order, just delete the corresponding file and use \'reload settings\' ' \
            '(or relaunch the overlay).' \
            '\n\nHere is an example of text to paste from Spawning Tool.' \
            '\n-------------------------' \
            '\n13    0:12    Overlord' \
            '\n16    0:48    Hatchery' \
            '\n18    1:10    Extractor' \
            '\n17    1:14    Spawning Pool' \
            '\n20    1:53    Overlord' \
            '\n20    2:01    Queen x2' \
            '\n20    2:02    Zergling x4'

        # race selection
        layout = self.settings.layout
        color_default = layout.color_default
        color_background = layout.color_background
        icon_select_size = layout.configuration.icon_select_size

        self.race_select = QComboBox(self)
        self.opponent_race_select = QComboBox(self)

        self.race_combo_ids = []  # corresponding IDs
        self.opponent_race_combo_ids = []

        self.show_resources = False  # True to show the resources in the build order current display

        initialize_race_combo(self.race_select, self.opponent_race_select, self.race_combo_ids,
                              self.opponent_race_combo_ids, self.directory_game_pictures,
                              icon_select_size, color_background, color_default)

        self.race_select.activated.connect(self.update_build_order_display)
        self.opponent_race_select.activated.connect(self.update_build_order_display)

        # create build orders folder
        os.makedirs(self.directory_build_orders, exist_ok=True)

        self.update_panel_elements()  # update the current panel elements

    def reload(self, update_settings):
        """Reload the application settings, build orders...

        Parameters
        ----------
        update_settings   True to update (reload) the settings, False to keep the current ones
        """
        super().reload(update_settings=update_settings)

        # race selection
        layout = self.settings.layout
        color_default = layout.color_default
        color_background = layout.color_background
        icon_select_size = layout.configuration.icon_select_size

        for race_item in range(2):  # player race, then opponent race
            race_select = self.race_select if (race_item == 0) else self.opponent_race_select

            race_select.setIconSize(QSize(icon_select_size[0], icon_select_size[1]))
            race_select.setStyleSheet(
                'QComboBox {' +
                f'background-color: rgb({color_background[0]}, {color_background[1]}, {color_background[2]});' +
                f'color: rgb({color_default[0]}, {color_default[1]}, {color_default[2]});' +
                'border: 0px' +
                '}'
            )
            race_select.adjustSize()

        self.update_panel_elements()  # update the current panel elements

    def settings_scaling(self):
        """Apply the scaling on the settings"""
        super().settings_scaling()
        assert 0 <= self.scaling_input_selected_id < len(self.scaling_input_combo_ids)
        layout = self.settings.layout
        unscaled_layout = self.unscaled_settings.layout
        scaling = self.scaling_input_combo_ids[self.scaling_input_selected_id] / 100.0

        layout.configuration.icon_select_size = scale_list_int(
            scaling, unscaled_layout.configuration.icon_select_size)

    def hide_elements(self):
        """Hide elements"""
        super().hide_elements()

        self.race_select.hide()
        self.opponent_race_select.hide()

    def update_build_order_display(self):
        """Update the build order search matching display"""
        race_id = self.race_select.currentIndex()
        opponent_race_id = self.opponent_race_select.currentIndex()
        assert (0 <= race_id < len(self.race_combo_ids)) and (0 <= opponent_race_id < len(self.opponent_race_combo_ids))
        self.obtain_build_order_search(
            key_condition={'race': self.race_combo_ids[race_id],
                           'opponent_race': self.opponent_race_combo_ids[opponent_race_id]})
        self.config_panel_layout()

    def config_panel_layout(self):
        """Layout of the configuration panel"""
        super().config_panel_layout()

        # show elements
        self.race_select.show()
        self.opponent_race_select.show()

        layout = self.settings.layout
        border_size = layout.border_size
        horizontal_spacing = layout.horizontal_spacing
        vertical_spacing = layout.vertical_spacing
        action_button_size = layout.action_button_size

        # next Y position
        next_y = border_size + max(action_button_size, self.font_size_input.height(),
                                   self.scaling_input.height()) + vertical_spacing

        # build order selection
        self.build_order_title.move(border_size, next_y)
        next_x = border_size + self.build_order_title.width() + horizontal_spacing

        # race selection
        self.race_select.move(next_x, next_y)
        next_x += self.race_select.width() + horizontal_spacing
        self.opponent_race_select.move(next_x, next_y)

        if self.race_select.height() > self.build_order_title.height():
            self.build_order_title.move(self.build_order_title.x(),
                                        widget_y_end(self.race_select) - self.build_order_title.height())
        next_y += max(self.build_order_title.height(), self.race_select.height()) + vertical_spacing

        # build order search
        self.build_order_search.move(border_size, next_y)
        next_y += self.build_order_search.height() + vertical_spacing

        if widget_x_end(self.build_order_search) > widget_x_end(self.opponent_race_select):
            self.opponent_race_select.move(widget_x_end(self.build_order_search) - self.opponent_race_select.width(),
                                           self.opponent_race_select.y())
            self.race_select.move(self.opponent_race_select.x() - horizontal_spacing - self.race_select.width(),
                                  self.race_select.y())
        elif widget_x_end(self.build_order_search) < widget_x_end(self.opponent_race_select):
            self.build_order_search.resize(
                widget_x_end(self.opponent_race_select) - self.build_order_search.x(), self.build_order_search.height())

        self.build_order_selection.update_size_position(init_y=next_y)

        max_x = max(widget_x_end(self.next_panel_button), widget_x_end(self.build_order_search),
                    self.build_order_selection.x() + self.build_order_selection.row_max_width)

        max_y = max(widget_y_end(self.build_order_search),
                    self.build_order_selection.y() + self.build_order_selection.row_total_height)

        # resize main window
        self.resize(max_x + border_size, max_y + border_size)

        # next panel on top right corner
        self.next_panel_button.move(self.width() - border_size - self.next_panel_button.width(), border_size)

        # update position (in case the size changed)
        self.update_position()

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
                race_id = self.race_select.currentIndex()
                opponent_race_id = self.opponent_race_select.currentIndex()
                assert 0 <= race_id < len(self.race_combo_ids)
                assert 0 <= opponent_race_id < len(self.opponent_race_combo_ids)
                self.obtain_build_order_search(
                    key_condition={'race': self.race_combo_ids[race_id],
                                   'opponent_race': self.opponent_race_combo_ids[opponent_race_id]})
                if build_order_id >= 0:  # directly select in case of clicking
                    self.select_build_order(key_condition={
                        'race': self.race_combo_ids[self.race_select.currentIndex()],
                        'opponent_race': self.opponent_race_combo_ids[self.opponent_race_select.currentIndex()]})
                self.config_panel_layout()
                return True
        return False

    def update_build_order(self):
        """Update the build order panel"""

        # clear the elements (also hide them)
        self.build_order_resources.clear()
        self.build_order_notes.clear()

        layout = self.settings.layout

        if self.selected_build_order is None:  # no build order selected
            self.build_order_notes.add_row_from_picture_line(parent=self, line='No build order selected.')

        else:  # valid build order selected
            if self.build_order_timer['use_timer'] and self.build_order_timer['steps']:
                # get steps to display
                selected_steps_ids, selected_steps = get_build_order_timer_steps_display(
                    self.build_order_timer['steps'], self.build_order_timer['steps_ids'],
                    max_lines=layout.build_order.timer_bo_lines)
            else:
                selected_build_order_content = self.selected_build_order['build_order']

                # select current step
                assert 0 <= self.selected_build_order_step_id < self.selected_build_order_step_count
                selected_steps_ids = [0]
                selected_steps = [selected_build_order_content[self.selected_build_order_step_id]]
                assert selected_steps[0] is not None
            assert (len(selected_steps) > 0) and (len(selected_steps_ids) > 0)

            # space between the elements
            spacing = ''
            for i in range(layout.build_order.resource_spacing):
                spacing += ' '

            # display selected step
            if self.build_order_timer['use_timer']:
                self.update_build_order_time_label()
            else:
                self.update_build_order_step_label()

            images = self.settings.images

            # resource line
            resource_step = selected_steps[selected_steps_ids[-1]]  # ID of the step to use to display the resources
            resources_line = ''

            if 'minerals' in resource_step:
                resources_line += spacing + '@' + images.minerals + '@ ' + str(resource_step['minerals'])
            if 'vespene_gas' in resource_step:
                resources_line += spacing + '@' + images.vespene_gas + '@ ' + str(resource_step['vespene_gas'])
            if 'supply' in resource_step:
                resources_line += spacing + '@' + images.supply + '@ ' + str(resource_step['supply'])
            if 'time' in resource_step:
                resources_line += spacing + '@' + images.time + '@ ' + str(resource_step['time'])

            self.show_resources = (resources_line != '')
            if self.show_resources:
                resources_line = resources_line[layout.build_order.resource_spacing:]  # remove initial spacing
                self.build_order_resources.add_row_from_picture_line(parent=self, line=str(resources_line))

            # loop on the steps for notes
            for step_id, selected_step in enumerate(selected_steps):

                # check if emphasis must be added on the corresponding note
                emphasis_flag = self.build_order_timer['run_timer'] and (step_id in selected_steps_ids)

                notes = selected_step['notes']
                for note in notes:
                    # add time if running timer and time available
                    line = ''
                    if (self.build_order_timer['use_timer']) and ('time' in resource_step) and hasattr(
                            layout.build_order, 'show_time_in_notes') and layout.build_order.show_time_in_notes:
                        line += str(selected_step['time']) + spacing
                    line += note
                    self.build_order_notes.add_row_from_picture_line(
                        parent=self, line=line, emphasis_flag=emphasis_flag)

        self.build_order_panel_layout()  # update layout

    def build_order_panel_layout(self):
        """Layout of the Build order panel"""
        super().build_order_panel_layout()

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

        self.build_order_notes.update_size_position(init_y=next_y)

        # resize of the full window
        buttons_count = 3  # previous step + next step + next panel
        if self.build_order_timer['available']:
            buttons_count += 3 if self.build_order_timer[
                'use_timer'] else 1  # switch timer-manual (+ start/stop + reset timer)
        max_x = border_size + max(
            (self.build_order_step_time.width() + buttons_count * action_button_size +
             horizontal_spacing + (buttons_count - 2) * action_button_spacing + bo_next_tab_spacing),
            self.build_order_resources.row_max_width,
            self.build_order_notes.row_max_width)

        self.resize(max_x + border_size, next_y + self.build_order_notes.row_total_height + border_size)

        # adapt buttons positions after window resize
        self.build_order_panel_layout_action_buttons()

        # position update to stay with the same upper right corner position
        self.update_position()

    def enter_key_actions(self):
        """Actions performed when pressing the Enter key"""
        if self.selected_panel == PanelID.CONFIG:
            if self.build_order_search.hasFocus():
                self.select_build_order(key_condition={
                    'race': self.race_combo_ids[self.race_select.currentIndex()],
                    'opponent_race': self.opponent_race_combo_ids[self.opponent_race_select.currentIndex()]})

            self.config_panel_layout()  # update layout

    def open_panel_add_build_order(self):
        """Open/close the panel to add a build order, specialized for SC2"""
        if (self.panel_add_build_order is not None) and self.panel_add_build_order.isVisible():  # close panel
            self.panel_add_build_order.close()
            self.panel_add_build_order = None
        else:  # open new panel
            config = self.settings.panel_build_order
            self.panel_add_build_order = SC2BuildOrderWindow(
                app=self.app, parent=self, game_icon=self.game_icon, build_order_folder=self.directory_build_orders,
                panel_settings=self.settings.panel_build_order, edit_init_text=self.build_order_instructions,
                build_order_websites=[['Spawning Tool', 'https://lotv.spawningtool.com']],
                directory_game_pictures=self.directory_game_pictures,
                directory_common_pictures=self.directory_common_pictures)
