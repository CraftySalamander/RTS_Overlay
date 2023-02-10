# SC2 game overlay
import os
from enum import Enum

from PyQt5.QtWidgets import QComboBox, QApplication
from PyQt5.QtGui import QIcon
from PyQt5.QtCore import QSize, Qt

from common.build_order_tools import get_total_on_resource
from common.useful_tools import widget_x_end, widget_y_end
from common.rts_overlay import RTSGameOverlay, scale_list_int

from sc2.sc2_settings import SC2OverlaySettings
from sc2.sc2_build_order import check_valid_sc2_build_order
from sc2.sc2_race_icon import sc2_race_icon


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

        self.selected_panel = PanelID.CONFIG  # panel to display

        # race selection
        layout = self.settings.layout
        color_default = layout.color_default
        color_background = layout.color_background
        icon_select_size = layout.configuration.icon_select_size

        self.race_select = QComboBox(self)
        self.race_select.activated.connect(self.update_build_order_display)
        self.race_combo_ids = []  # corresponding IDs
        for race_name, race_image in sc2_race_icon.items():
            self.race_select.addItem(
                QIcon(os.path.join(self.directory_game_pictures, 'race_icon', race_image)), '')
            self.race_combo_ids.append(race_name)
        self.race_select.setIconSize(QSize(icon_select_size[0], icon_select_size[1]))

        self.race_select.setStyleSheet(
            'QComboBox {' +
            f'background-color: rgb({color_background[0]}, {color_background[1]}, {color_background[2]});' +
            f'color: rgb({color_default[0]}, {color_default[1]}, {color_default[2]});' +
            'border: 0px' +
            '}'
        )
        self.race_select.setToolTip('select race')
        self.race_select.adjustSize()

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

        self.race_select.setIconSize(QSize(icon_select_size[0], icon_select_size[1]))
        self.race_select.setStyleSheet(
            'QComboBox {' +
            f'background-color: rgb({color_background[0]}, {color_background[1]}, {color_background[2]});' +
            f'color: rgb({color_default[0]}, {color_default[1]}, {color_default[2]});' +
            'border: 0px' +
            '}'
        )
        self.race_select.adjustSize()

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

    def update_build_order_display(self):
        """Update the build order search matching display"""
        race_id = self.race_select.currentIndex()
        assert 0 <= race_id < len(self.race_combo_ids)
        self.obtain_build_order_search(
            key_condition={'race': self.race_combo_ids[race_id]})
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

        if self.race_select.height() > self.build_order_title.height():
            self.build_order_title.move(self.build_order_title.x(),
                                        widget_y_end(self.race_select) - self.build_order_title.height())
        next_y += max(self.build_order_title.height(), self.race_select.height()) + vertical_spacing

        # build order search
        self.build_order_search.move(border_size, next_y)
        next_y += self.build_order_search.height() + vertical_spacing

        if widget_x_end(self.build_order_search) > widget_x_end(self.race_select):
            self.race_select.move(
                widget_x_end(self.build_order_search) - self.race_select.width(),
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
                assert 0 <= race_id < len(self.race_combo_ids)
                self.obtain_build_order_search(
                    key_condition={'race': self.race_combo_ids[race_id]})
                if build_order_id >= 0:  # directly select in case of clicking
                    self.select_build_order(key_condition={
                        'race': self.race_combo_ids[self.race_select.currentIndex()]})
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
            target_minerals = get_total_on_resource(target_resources['minerals'])
            target_vespene_gas = get_total_on_resource(target_resources['vespene_gas'])

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
            resources_line = images.minerals + '@ ' + (str(target_minerals) if (target_minerals >= 0) else ' ')
            resources_line += spacing + '@' + images.vespene_gas + '@ ' + (
                str(target_vespene_gas) if (target_vespene_gas >= 0) else ' ')
            if 'time' in selected_step:  # add time if indicated
                resources_line += '@' + spacing + '@' + self.settings.images.time + '@' + selected_step['time']

            # for dict type target_resources, create a tooltip to associate with the resource icon
            mapping = {'minerals': images.minerals, 'vespene_gas': images.vespene_gas}
            tooltip = dict(
                (mapping[key], value) for (key, value) in target_resources.items() if type(value) is dict)
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

            # tooltip display
            if not self.build_order_tooltip.is_visible():  # no build order tooltip still active
                tooltip, label_x, label_y = self.build_order_resources.get_hover_tooltip(
                    0, self.mouse_x - self.x(), self.mouse_y - self.y())
                if tooltip is not None:  # valid tooltip to display
                    self.build_order_tooltip.display_dictionary(
                        tooltip, self.x() + label_x, self.y() + label_y,
                        self.settings.layout.build_order.tooltip_timeout)

    def enter_key_actions(self):
        """Actions performed when pressing the Enter key"""
        if self.selected_panel == PanelID.CONFIG:
            if self.build_order_search.hasFocus():
                self.select_build_order(key_condition={
                    'race': self.race_combo_ids[self.race_select.currentIndex()]})

            self.config_panel_layout()  # update layout
