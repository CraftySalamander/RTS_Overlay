# WC3 game overlay
import os

from PyQt5.QtWidgets import QComboBox, QApplication
from PyQt5.QtGui import QIcon
from PyQt5.QtCore import QSize

from common.useful_tools import widget_x_end, widget_y_end, scale_list_int
from common.rts_overlay import RTSGameOverlay, PanelID
from common.build_order_window import BuildOrderWindow
from common.build_order_tools import get_bo_design_instructions

from wc3.wc3_settings import WC3OverlaySettings
from wc3.wc3_build_order import check_valid_wc3_build_order
from wc3.wc3_build_order import get_wc3_build_order_step, get_wc3_build_order_template
from wc3.wc3_race_icon import wc3_race_icon, get_wc3_faction_selection


def initialize_race_combo(race_select: QComboBox, opponent_race_select: QComboBox,
                          race_combo_ids: list, opponent_race_combo_ids: list,
                          directory_game_pictures: str, icon_select_size: list,
                          color_background: list, color_default: list):
    """Initialize the combo boxes for race selection.

    Parameters
    ----------
    race_select                Combo box for the player race to select.
    opponent_race_select       Combo box for the opponent race to select.
    race_combo_ids             List of races corresponding to the combo box 'race_select'.
    opponent_race_combo_ids    List of races corresponding to the combo box 'opponent_race_select'.
    directory_game_pictures    Directory where the game pictures are located.
    icon_select_size           Size of the icon for race selection.
    color_background           Color of the background.
    color_default              Default color for the text.
    """
    for race_item in range(2):  # player race, then opponent race
        selected_race_select = race_select if (race_item == 0) else opponent_race_select
        selected_race_combo_ids = race_combo_ids if (race_item == 0) else opponent_race_combo_ids

        for race_name, race_image in wc3_race_icon.items():
            assert len(race_image) == 2
            if (race_name != 'Any') or (race_item == 1):  # any opponent race can be selected
                selected_race_select.addItem(
                    QIcon(os.path.join(directory_game_pictures, 'race', race_image[1])), '')
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


class WC3GameOverlay(RTSGameOverlay):
    """Game overlay application for WC3."""

    def __init__(self, app: QApplication, directory_main: str):
        """Constructor

        Parameters
        ----------
        app               Main application instance.
        directory_main    Directory where the main file is located.
        """
        super().__init__(app=app, directory_main=directory_main, name_game='wc3', settings_name='wc3_settings.json',
                         settings_class=WC3OverlaySettings, check_valid_build_order=check_valid_wc3_build_order,
                         get_build_order_step=get_wc3_build_order_step,
                         get_build_order_template=get_wc3_build_order_template,
                         get_faction_selection=get_wc3_faction_selection,
                         build_order_category_name='race')

        # build order instructions
        select_faction_lines = 'The \'select faction\' category provides all the available race names ' \
                               'for the \'race\' and \'opponent_race\' fields.'

        self.build_order_instructions = get_bo_design_instructions(False, select_faction_lines)

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

        self.update_panel_elements()  # update the current panel elements

    def reload(self, update_settings):
        """Reload the application settings, build orders...

        Parameters
        ----------
        update_settings   True to update (reload) the settings, False to keep the current ones.
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
        """Apply the scaling on the settings."""
        super().settings_scaling()
        assert 0 <= self.scaling_input_selected_id < len(self.scaling_input_combo_ids)
        scaling = self.scaling_input_combo_ids[self.scaling_input_selected_id] / 100.0

        self.settings.layout.configuration.icon_select_size = scale_list_int(
            scaling, self.unscaled_settings.layout.configuration.icon_select_size)

    def select_build_order_id(self, build_order_id: int = -1) -> bool:
        """Select build order ID.

        Parameters
        ----------
        build_order_id    ID of the build order, negative to select next build order.

        Returns
        -------
        True if valid build order selection.
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

    def hide_elements(self):
        """Hide elements."""
        super().hide_elements()

        self.race_select.hide()
        self.opponent_race_select.hide()

    def update_build_order_display(self):
        """Update the build order search matching display."""
        race_id = self.race_select.currentIndex()
        opponent_race_id = self.opponent_race_select.currentIndex()
        assert (0 <= race_id < len(self.race_combo_ids)) and (0 <= opponent_race_id < len(self.opponent_race_combo_ids))
        self.obtain_build_order_search(
            key_condition={'race': self.race_combo_ids[race_id],
                           'opponent_race': self.opponent_race_combo_ids[opponent_race_id]})
        self.config_panel_layout()

    def enter_key_actions(self):
        """Actions performed when pressing the Enter key."""
        if self.selected_panel == PanelID.CONFIG:
            if self.build_order_search.hasFocus():
                self.select_build_order(key_condition={
                    'race': self.race_combo_ids[self.race_select.currentIndex()],
                    'opponent_race': self.opponent_race_combo_ids[self.opponent_race_select.currentIndex()]})

            self.config_panel_layout()  # update layout

    def open_panel_add_build_order(self):
        """Open/close the panel to add a build order, specialized for WC3."""
        super().open_panel_add_build_order()

        if (self.panel_add_build_order is not None) and self.panel_add_build_order.isVisible():  # close panel
            self.panel_add_build_order.close()
            self.panel_add_build_order = None
        else:  # open new panel
            self.panel_add_build_order = BuildOrderWindow(
                app=self.app, parent=self, game_icon=self.game_icon, build_order_folder=self.directory_build_orders,
                panel_settings=self.settings.panel_build_order, edit_init_text=self.build_order_instructions,
                build_order_websites=[],
                directory_game_pictures=self.directory_game_pictures,
                directory_common_pictures=self.directory_common_pictures)

    def config_panel_layout(self):
        """Layout of the configuration panel."""
        super().config_panel_layout()
        if self.selected_panel != PanelID.CONFIG:
            return

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

        self.config_panel_layout_resize_move()  # size and position

    def update_build_order(self):
        """Update the build order panel."""
        super().update_build_order()

        # valid build order selected
        if (self.selected_build_order is not None) and ('build_order' in self.selected_build_order):

            layout = self.settings.layout
            spacing = ' ' * layout.build_order.resource_spacing  # space between the elements

            # get selected steps and corresponding IDs
            selected_steps, selected_steps_ids = self.get_build_order_selected_steps_and_ids()

            # resource line
            images = self.settings.images
            resource_step = selected_steps[selected_steps_ids[-1]]  # ID of the step to use to display the resources
            resources_line = ''

            if ('gold' in resource_step) and (resource_step['gold'] >= 0):
                resources_line += spacing + '@' + images.gold + '@ ' + str(resource_step['gold'])
            if ('lumber' in resource_step) and (resource_step['lumber'] >= 0):
                resources_line += spacing + '@' + images.lumber + '@ ' + str(resource_step['lumber'])
            if ('food' in resource_step) and (resource_step['food'] >= 0):
                resources_line += spacing + '@' + images.food + '@ ' + str(resource_step['food'])
            if layout.show_time_resource and ('time' in resource_step) and (resource_step['time'] != ''):
                resources_line += spacing + '@' + images.time + '@ ' + str(resource_step['time'])

            self.show_resources = (resources_line != '')
            if self.show_resources:
                resources_line = resources_line[layout.build_order.resource_spacing:]  # remove initial spacing
                self.build_order_resources.add_row_from_picture_line(parent=self, line=str(resources_line))

            # update the notes of the build order
            self.update_build_order_notes(selected_steps, selected_steps_ids)

        self.build_order_panel_layout()  # update layout
