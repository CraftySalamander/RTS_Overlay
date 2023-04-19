# SC2 game overlay
import os
import json
from enum import Enum

from PyQt5.QtWidgets import QComboBox, QApplication, QLabel, QLineEdit
from PyQt5.QtGui import QIcon, QFont
from PyQt5.QtCore import QSize, Qt

from common.useful_tools import widget_x_end, widget_y_end, scale_list_int, popup_message
from common.rts_overlay import RTSGameOverlay
from common.label_display import QLabelSettings, split_multi_label_line
from common.build_order_window import BuildOrderWindow

from sc2.sc2_settings import SC2OverlaySettings
from sc2.sc2_build_order import check_valid_sc2_build_order, get_sc2_build_order_from_spawning_tool
from sc2.sc2_race_icon import sc2_race_icon


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

    def __init__(self, parent, game_icon: str, build_order_folder: str, font_police: str, font_size: int,
                 color_font: list, color_background: list, opacity: float, border_size: int,
                 edit_width: int, edit_height: int, edit_init_text: str, button_margin: int,
                 vertical_spacing: int, horizontal_spacing: int, build_order_websites: list,
                 directory_game_pictures: str, icon_size: list, default_lines_per_step: int,
                 lines_per_step_max_count: int, combo_lines_per_step_size: list,
                 bo_name_size: list, bo_patch_size: list, bo_author_size: list, bo_source_size: list):
        """Constructor

        Parameters
        ----------
        parent                       parent window
        game_icon                    icon of the game
        build_order_folder           folder where the build orders are saved
        font_police                  font police type
        font_size                    font size
        color_font                   color of the font
        color_background             color of the background
        opacity                      opacity of the window
        border_size                  size of the borders
        edit_width                   width for the build order text input
        edit_height                  height for the build order text input
        edit_init_text               initial text for the build order text input
        button_margin                margin from text to button border
        vertical_spacing             vertical spacing between the elements
        horizontal_spacing           horizontal spacing between the elements
        build_order_websites         list of website elements as [[button name 0, website link 0], [...]],
                                     (each item contains these 2 elements)
        directory_game_pictures      directory where the game pictures are located
        icon_size                    size of the icon for race selection
        default_lines_per_step       default number of lines per step
        lines_per_step_max_count     maximum number of lines per step
        combo_lines_per_step_size    size of the combo box for number of lines per step
        bo_name_size                 size of the editing field for build order name
        bo_patch_size                size of the editing field for build order patch
        bo_author_size               size of the editing field for build order author
        bo_source_size               size of the editing field for build order source
        """
        super().__init__(parent, game_icon, build_order_folder, font_police, font_size, color_font, color_background,
                         opacity, border_size, edit_width, edit_height, edit_init_text, button_margin,
                         vertical_spacing, horizontal_spacing, build_order_websites)

        # static texts
        self.race_text = QLabel('Race :', self)
        self.opponent_race_text = QLabel('Opponent :', self)
        self.lines_per_step_text = QLabel('Lines/step :', self)
        list_text = [self.race_text, self.opponent_race_text, self.lines_per_step_text]

        for text_item in list_text:
            text_item.setStyleSheet(self.style_description)
            text_item.setFont(QFont(font_police, font_size))
            text_item.adjustSize()

        # races selection widgets
        self.race_select = QComboBox(self)
        self.opponent_race_select = QComboBox(self)

        self.race_combo_ids = []  # corresponding IDs
        self.opponent_race_combo_ids = []

        initialize_race_combo(self.race_select, self.opponent_race_select, self.race_combo_ids,
                              self.opponent_race_combo_ids, directory_game_pictures,
                              icon_size, color_background, color_font)

        # position for the races selection widgets
        y_position = widget_y_end(self.update_button) + vertical_spacing
        y_position_text = y_position + (self.race_select.height() - self.race_text.height()) / 2

        self.race_text.move(border_size, y_position_text)
        self.race_select.move(widget_x_end(self.race_text), y_position)

        self.opponent_race_text.move(widget_x_end(self.race_select) + horizontal_spacing, y_position_text)
        self.opponent_race_select.move(widget_x_end(self.opponent_race_text), y_position)

        # lines per step
        self.lines_per_step = QComboBox(self)
        for i in range(lines_per_step_max_count):
            self.lines_per_step.addItem(str(i + 1))

        if 1 <= default_lines_per_step <= lines_per_step_max_count:
            self.lines_per_step.setCurrentIndex(default_lines_per_step - 1)
        else:
            print(f'Warning: default lines per step count is invalid: {default_lines_per_step}, set to 1')
            self.lines_per_step.setCurrentIndex(0)

        self.lines_per_step.setStyleSheet(f'QWidget{{ {self.style_description} }};')
        self.lines_per_step.setFont(QFont(font_police, font_size))
        self.lines_per_step.setToolTip('set the number of lines per step')
        self.lines_per_step.resize(combo_lines_per_step_size[0], combo_lines_per_step_size[1])

        self.lines_per_step_text.move(widget_x_end(self.opponent_race_select) + horizontal_spacing, y_position_text)
        self.lines_per_step.move(widget_x_end(self.lines_per_step_text), y_position)

        # edit fields
        self.build_order_name = QLineEdit(self)
        self.build_order_name.resize(bo_name_size[0], bo_name_size[1])
        self.build_order_name.setStyleSheet(self.style_text_edit)
        self.build_order_name.setFont(QFont(font_police, font_size))
        self.build_order_name.setToolTip('Build order name')
        self.build_order_name.setText('Build order name')

        self.build_order_patch = QLineEdit(self)
        self.build_order_patch.resize(bo_patch_size[0], bo_patch_size[1])
        self.build_order_patch.setStyleSheet(self.style_text_edit)
        self.build_order_patch.setFont(QFont(font_police, font_size))
        self.build_order_patch.setToolTip('Build order patch')
        self.build_order_patch.setText('Patch')

        self.build_order_author = QLineEdit(self)
        self.build_order_author.resize(bo_author_size[0], bo_author_size[1])
        self.build_order_author.setStyleSheet(self.style_text_edit)
        self.build_order_author.setFont(QFont(font_police, font_size))
        self.build_order_author.setToolTip('Build order author')
        self.build_order_author.setText('Author')

        self.build_order_source = QLineEdit(self)
        self.build_order_source.resize(bo_source_size[0], bo_source_size[1])
        self.build_order_source.setStyleSheet(self.style_text_edit)
        self.build_order_source.setFont(QFont(font_police, font_size))
        self.build_order_source.setToolTip('Build order source')
        self.build_order_source.setText('Source')

        # move edit fields
        self.build_order_name.move(widget_x_end(self.lines_per_step) + horizontal_spacing, y_position)
        self.build_order_patch.move(widget_x_end(self.build_order_name) + horizontal_spacing, y_position)
        self.build_order_author.move(widget_x_end(self.build_order_patch) + horizontal_spacing, y_position)
        self.build_order_source.move(widget_x_end(self.build_order_author) + horizontal_spacing, y_position)

        self.max_width = max(self.max_width, widget_x_end(self.build_order_source))

        # adapt text input width if smaller than other elements
        if widget_x_end(self.text_input) < self.max_width:
            self.text_input.resize(self.max_width - border_size, edit_height)

        # show elements
        self.race_text.show()
        self.race_select.show()
        self.opponent_race_text.show()
        self.opponent_race_select.show()
        self.lines_per_step_text.show()
        self.lines_per_step.show()
        self.build_order_name.show()
        self.build_order_patch.show()
        self.build_order_author.show()
        self.build_order_source.show()

        # resize the window
        self.resize(self.max_width + border_size, widget_y_end(self.opponent_race_select) + border_size)


# ID of the panel to display
class PanelID(Enum):
    CONFIG = 0  # Configuration
    BUILD_ORDER = 1  # Display Build Order


class SC2GameOverlay(RTSGameOverlay):
    """Game overlay application for SC2"""

    def __init__(self, directory_main: str):
        """Constructor

        Parameters
        ----------
        directory_main    directory where the main file is located
        """
        super().__init__(directory_main=directory_main, name_game='sc2', settings_name='sc2_settings.json',
                         settings_class=SC2OverlaySettings, check_valid_build_order=check_valid_sc2_build_order,
                         build_order_category_name='race')

        # build order instructions
        self.build_order_instructions = \
            'Replace this text by any build order in correct format, then click on \'Add build order\'.' \
            '\n\nYou can manually write your build order as JSON format (following the guidelines in Readme.md) ' \
            'or (easier) copy-paste one from Spawning Tool.' \
            '\n\nFor the second option, click on the \'Spawning Tool\' button, and select any build order.' \
            '\nThen, copy all the lines starting with a supply value and' \
            ' paste them here (replace all these instructions).' \
            '\nThree columns are expected (supply, time, note). Adapt the pasted text if needed.' \
            '\nFinally, adapt all the options (race, opponent race, lines per step, build order name, patch,' \
            ' author and source), before clicking on \'Add build order\'.' \
            '\n\nYou can find all your saved build orders as JSON files by clicking on \'Open build orders folder\'.' \
            '\nTo remove any build order, just delete the corresponding file and use \'reload settings\' ' \
            '(or relaunch the overlay).' \
            '\n\nHere is an example of text to paste.' \
            '\n-------------------------' \
            '\n13    0:12    Overlord' \
            '\n16    0:48    Hatchery' \
            '\n18    1:10    Extractor' \
            '\n17    1:14    Spawning Pool' \
            '\n20    1:53    Overlord' \
            '\n20    2:01    Queen x2' \
            '\n20    2:02    Zergling x4'

        self.selected_panel = PanelID.CONFIG  # panel to display

        # race selection
        layout = self.settings.layout
        color_default = layout.color_default
        color_background = layout.color_background
        icon_select_size = layout.configuration.icon_select_size

        self.race_select = QComboBox(self)
        self.opponent_race_select = QComboBox(self)

        self.race_combo_ids = []  # corresponding IDs
        self.opponent_race_combo_ids = []

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

        panel_build_order = self.settings.panel_build_order
        unscaled_panel_build_order = self.unscaled_settings.panel_build_order

        panel_build_order.combo_lines_per_step_size = scale_list_int(
            scaling, unscaled_panel_build_order.combo_lines_per_step_size)
        panel_build_order.icon_select_size = scale_list_int(
            scaling, unscaled_panel_build_order.icon_select_size)
        panel_build_order.edit_field_name_size = scale_list_int(
            scaling, unscaled_panel_build_order.edit_field_name_size)
        panel_build_order.edit_field_patch_size = scale_list_int(
            scaling, unscaled_panel_build_order.edit_field_patch_size)
        panel_build_order.edit_field_author_size = scale_list_int(
            scaling, unscaled_panel_build_order.edit_field_author_size)
        panel_build_order.edit_field_source_size = scale_list_int(
            scaling, unscaled_panel_build_order.edit_field_source_size)

    def quit_application(self):
        """Quit the application"""
        super().quit_application()

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

        self.race_select.show()
        self.opponent_race_select.show()

        self.build_order_title.show()
        self.build_order_search.show()
        self.build_order_selection.show()

        # configuration buttons
        layout = self.settings.layout
        border_size = layout.border_size
        horizontal_spacing = layout.horizontal_spacing
        vertical_spacing = layout.vertical_spacing
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

        self.build_order_selection.update_size_position(init_y=next_y)

        max_x = widget_x_end(self.next_panel_button)

        max_y = max(widget_y_end(self.build_order_search),
                    self.build_order_selection.y() + self.build_order_selection.row_total_height)

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
        self.build_order_notes.clear()

        if self.selected_build_order is None:  # no build order selected
            self.build_order_notes.add_row_from_picture_line(parent=self, line='No build order selected.')

        else:  # valid build order selected
            selected_build_order_content = self.selected_build_order['build_order']

            # select current step
            assert 0 <= self.selected_build_order_step_id < self.selected_build_order_step_count
            selected_step = selected_build_order_content[self.selected_build_order_step_id]
            assert selected_step is not None

            # space between the elements
            spacing = ''
            layout = self.settings.layout
            for i in range(layout.build_order.resource_spacing):
                spacing += ' '

            # display selected step
            self.build_order_step.setText(
                f'Step: {self.selected_build_order_step_id + 1}/{self.selected_build_order_step_count}')

            images = self.settings.images
            build_order_layout = self.settings.layout.build_order

            # notes of the current step
            notes = selected_step['notes']
            for note_elements in notes:
                note = note_elements['note']

                line = ''
                labels_settings = []

                if 'supply' in note_elements:
                    line += str(note_elements['supply']) + '@ @' + images.supply
                    labels_settings += [None, None, QLabelSettings(image_height=build_order_layout.supply_image_height)]

                if ('time' in note_elements) and (note_elements['time'] != ''):
                    if line != '':
                        line += '@' + spacing + '@'
                        labels_settings += [None]

                    line += note_elements['time'] + '@ @' + images.time
                    labels_settings += [None, None, QLabelSettings(image_height=build_order_layout.time_image_height)]

                if line != '':
                    line += '@' + spacing + '@'
                    labels_settings += [None]

                # remove redundant '@'
                updated_note = note[1:] if ((line != '') and (len(note) > 0) and (note[0] == '@')) else note

                line += updated_note
                labels_settings += [None] * len(split_multi_label_line(updated_note))

                self.build_order_notes.add_row_from_picture_line(parent=self, line=line,
                                                                 labels_settings=labels_settings)

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

        self.build_order_notes.update_size_position(init_y=next_y)

        # resize of the full window
        max_x = border_size + max(
            (self.build_order_step.width() + 3 * action_button_size +
             horizontal_spacing + action_button_spacing + bo_next_tab_spacing),
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

    def timer_mouse_keyboard_call(self):
        """Function called on a timer (related to mouse and keyboard inputs)"""
        super().timer_mouse_keyboard_call()

        if self.selected_panel == PanelID.CONFIG:  # configuration specific buttons
            self.config_quit_button.hovering_show(self.is_mouse_in_roi_widget)
            self.config_save_button.hovering_show(self.is_mouse_in_roi_widget)
            self.config_reload_button.hovering_show(self.is_mouse_in_roi_widget)
            self.config_hotkey_button.hovering_show(self.is_mouse_in_roi_widget)
            self.config_build_order_button.hovering_show(self.is_mouse_in_roi_widget)

        elif self.selected_panel == PanelID.BUILD_ORDER:  # build order specific buttons
            self.build_order_previous_button.hovering_show(self.is_mouse_in_roi_widget)
            self.build_order_next_button.hovering_show(self.is_mouse_in_roi_widget)

    def enter_key_actions(self):
        """Actions performed when pressing the Enter key"""
        if self.selected_panel == PanelID.CONFIG:
            if self.build_order_search.hasFocus():
                self.select_build_order(key_condition={
                    'race': self.race_combo_ids[self.race_select.currentIndex()],
                    'opponent_race': self.opponent_race_combo_ids[self.opponent_race_select.currentIndex()]})

            self.config_panel_layout()  # update layout

    def panel_add_build_order(self):
        """Open/close the panel to add a build order, specialized for SC2"""
        if (self.panel_add_build_order is not None) and self.panel_add_build_order.isVisible():  # close panel
            self.panel_add_build_order.close()
            self.panel_add_build_order = None
        else:  # open new panel
            config = self.settings.panel_build_order
            self.panel_add_build_order = SC2BuildOrderWindow(
                parent=self, game_icon=self.game_icon, build_order_folder=self.directory_build_orders,
                font_police=config.font_police, font_size=config.font_size, color_font=config.color_font,
                color_background=config.color_background, opacity=config.opacity, border_size=config.border_size,
                edit_width=config.edit_width, edit_height=config.edit_height,
                edit_init_text=self.build_order_instructions, button_margin=config.button_margin,
                vertical_spacing=config.vertical_spacing, horizontal_spacing=config.horizontal_spacing,
                build_order_websites=[['Spawning Tool', 'https://lotv.spawningtool.com']],
                directory_game_pictures=self.directory_game_pictures,
                icon_size=config.icon_select_size, default_lines_per_step=config.default_lines_per_step,
                lines_per_step_max_count=config.lines_per_step_max_count,
                combo_lines_per_step_size=config.combo_lines_per_step_size,
                bo_name_size=config.edit_field_name_size, bo_patch_size=config.edit_field_patch_size,
                bo_author_size=config.edit_field_author_size, bo_source_size=config.edit_field_source_size)

    def add_build_order(self):
        """Try to add the build order written in the new build order panel"""
        msg_text = None
        try:
            try:  # try to load text data as if it is already written in JSON format
                build_order_data = json.loads(self.panel_add_build_order.text_input.toPlainText())

            except json.JSONDecodeError:  # not JSON format, using Spawning Tool format
                # races
                race_select_id = self.panel_add_build_order.race_select.currentIndex()
                opponent_race_select_id = self.panel_add_build_order.opponent_race_select.currentIndex()
                assert (0 <= race_select_id < len(self.panel_add_build_order.race_combo_ids)) and (
                        0 <= opponent_race_select_id < len(self.panel_add_build_order.opponent_race_combo_ids))

                race = self.panel_add_build_order.race_combo_ids[race_select_id]
                opponent_race = self.panel_add_build_order.opponent_race_combo_ids[opponent_race_select_id]

                # lines per step
                lines_per_step = self.panel_add_build_order.lines_per_step.currentIndex() + 1
                assert 1 <= lines_per_step

                # editable fields
                name = self.panel_add_build_order.build_order_name.text()
                patch = self.panel_add_build_order.build_order_patch.text()
                author = self.panel_add_build_order.build_order_author.text()
                source = self.panel_add_build_order.build_order_source.text()

                # get the SC2 BO in the requested JSON-like (dictionary) format
                build_order_data = get_sc2_build_order_from_spawning_tool(
                    data=self.panel_add_build_order.text_input.toPlainText(),
                    race=race, opponent_race=opponent_race, lines_per_step=lines_per_step,
                    name=name, patch=patch, author=author, source=source)

            # get data as dictionary
            msg_text = self.add_build_order_json_data(build_order_data)

        except json.JSONDecodeError:
            if msg_text is None:
                msg_text = 'Error while trying to decode the build order (JSON format error).'

        except Exception as msg:
            if msg_text is None:
                msg_text = str(msg)

        # open popup message
        popup_message('RTS Overlay - Adding new build order', msg_text)
