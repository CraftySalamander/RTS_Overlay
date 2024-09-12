# AoM game overlay
import os

from PyQt5.QtWidgets import QComboBox, QApplication
from PyQt5.QtGui import QIcon, QFont
from PyQt5.QtCore import QSize

from common.useful_tools import widget_x_end, widget_y_end
from common.rts_overlay import RTSGameOverlay, scale_list_int, PanelID
from common.build_order_window import BuildOrderWindow
from common.build_order_tools import get_bo_design_instructions

from aom.aom_settings import AoMOverlaySettings
from aom.aom_build_order import check_valid_aom_build_order
from aom.aom_build_order import get_aom_build_order_step, get_aom_build_order_template, \
    evaluate_aom_build_order_timing
from aom.aom_major_god_icon import aom_major_god_icon, get_aom_faction_selection


class AoMGameOverlay(RTSGameOverlay):
    """Game overlay application for AoM."""

    def __init__(self, app: QApplication, directory_main: str):
        """Constructor

        Parameters
        ----------
        app               Main application instance.
        directory_main    Directory where the main file is located.
        """
        super().__init__(app=app, directory_main=directory_main, name_game='aom', settings_name='aom_settings.json',
                         settings_class=AoMOverlaySettings, check_valid_build_order=check_valid_aom_build_order,
                         get_build_order_step=get_aom_build_order_step,
                         get_build_order_template=get_aom_build_order_template,
                         get_faction_selection=get_aom_faction_selection,
                         evaluate_build_order_timing=evaluate_aom_build_order_timing,
                         build_order_category_name='major_god',
                         build_order_timer_step_starting_flag=False)

        # build order instructions
        select_faction_lines = 'The \'select faction\' category provides all the available major god names ' \
                               'for the \'major_god\' field.'

        self.build_order_instructions = get_bo_design_instructions(True, select_faction_lines)

        # major god selection
        layout = self.settings.layout
        color_default = layout.color_default
        style_description = f'color: rgb({color_default[0]}, {color_default[1]}, {color_default[2]})'
        major_god_select_size = layout.configuration.major_god_select_size

        self.major_god_select = QComboBox(self)
        self.major_god_select.activated.connect(self.update_build_order_display)
        self.major_god_combo_ids = []  # corresponding IDs
        for major_god_name, letters_icon in aom_major_god_icon.items():
            assert len(letters_icon) == 2
            self.major_god_select.addItem(
                QIcon(os.path.join(self.directory_game_pictures, 'major_god', letters_icon[1])), letters_icon[0])
            self.major_god_combo_ids.append(major_god_name)
        self.major_god_select.setIconSize(QSize(major_god_select_size[0], major_god_select_size[1]))
        self.major_god_select.setStyleSheet(f'QWidget{{ {style_description} }};')
        self.major_god_select.setToolTip('select major god')
        self.major_god_select.setFont(QFont(layout.font_police, layout.font_size))
        self.major_god_select.adjustSize()

        self.update_panel_elements()  # update the current panel elements

    def reload(self, update_settings):
        """Reload the application settings, build orders...

        Parameters
        ----------
        update_settings   True to update (reload) the settings, False to keep the current ones.
        """
        super().reload(update_settings=update_settings)

        # major god selection
        layout = self.settings.layout
        color_default = layout.color_default
        style_description = f'color: rgb({color_default[0]}, {color_default[1]}, {color_default[2]})'
        major_god_select_size = layout.configuration.major_god_select_size

        self.major_god_select.setIconSize(QSize(major_god_select_size[0], major_god_select_size[1]))
        self.major_god_select.setStyleSheet(f'QWidget{{ {style_description} }};')
        self.major_god_select.setFont(QFont(layout.font_police, layout.font_size))
        self.major_god_select.adjustSize()

        self.update_panel_elements()  # update the current panel elements

    def settings_scaling(self):
        """Apply the scaling on the settings."""
        super().settings_scaling()
        assert 0 <= self.scaling_input_selected_id < len(self.scaling_input_combo_ids)
        scaling = self.scaling_input_combo_ids[self.scaling_input_selected_id] / 100.0

        self.settings.layout.configuration.major_god_select_size = scale_list_int(
            scaling, self.unscaled_settings.layout.configuration.major_god_select_size)

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
                major_god_id = self.major_god_select.currentIndex()
                assert 0 <= major_god_id < len(self.major_god_combo_ids)
                self.obtain_build_order_search(
                    key_condition={'major_god': self.major_god_combo_ids[major_god_id]})
                if build_order_id >= 0:  # directly select in case of clicking
                    self.select_build_order(key_condition={
                        'major_god': self.major_god_combo_ids[self.major_god_select.currentIndex()]})
                self.config_panel_layout()
                return True
        return False

    def hide_elements(self):
        """Hide elements."""
        super().hide_elements()

        self.major_god_select.hide()

    def get_age_image(self, age_id: int) -> str:
        """Get the image for a requested age.

        Parameters
        ----------
        age_id    ID of the age.

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
        elif age_id == 5:
            return self.settings.images.age_5
        else:
            raise Exception('Unknown age: ' + str(age_id))

    def update_build_order_display(self):
        """Update the build order search matching display."""
        major_god_id = self.major_god_select.currentIndex()
        assert 0 <= major_god_id < len(self.major_god_combo_ids)
        self.obtain_build_order_search(key_condition={'major_god': self.major_god_combo_ids[major_god_id]})
        self.config_panel_layout()

    def enter_key_actions(self):
        """Actions performed when pressing the Enter key."""
        if self.selected_panel == PanelID.CONFIG:
            if self.build_order_search.hasFocus():
                self.select_build_order(key_condition={
                    'major_god': self.major_god_combo_ids[self.major_god_select.currentIndex()]})

            self.config_panel_layout()  # update layout

    def open_panel_add_build_order(self):
        """Open/close the panel to add a build order."""
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
        self.major_god_select.show()

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

        # major god selection
        self.major_god_select.move(next_x, next_y)

        if self.major_god_select.height() > self.build_order_title.height():
            self.build_order_title.move(self.build_order_title.x(),
                                        widget_y_end(self.major_god_select) - self.build_order_title.height())
        next_y += max(self.build_order_title.height(), self.major_god_select.height()) + vertical_spacing

        # build order search
        self.build_order_search.move(border_size, next_y)
        next_y += self.build_order_search.height() + vertical_spacing

        if widget_x_end(self.build_order_search) > widget_x_end(self.major_god_select):
            self.major_god_select.move(
                widget_x_end(self.build_order_search) - self.major_god_select.width(), self.major_god_select.y())
        elif widget_x_end(self.build_order_search) < widget_x_end(self.major_god_select):
            self.build_order_search.resize(
                widget_x_end(self.major_god_select) - self.build_order_search.x(), self.build_order_search.height())

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

            # target resources
            target_resources = resource_step['resources']
            target_food = target_resources['food']
            target_wood = target_resources['wood']
            target_gold = target_resources['gold']
            target_favor = target_resources['favor']
            target_builder = target_resources['builder'] if ('builder' in target_resources) else -1
            target_worker = resource_step['worker_count']

            # line to display the target resources
            display_age = 1 <= resource_step['age'] <= 5
            display_time = layout.show_time_resource and ('time' in resource_step) and (resource_step['time'] != '')
            if (target_food >= 0) or (target_wood >= 0) or (target_gold >= 0) or (target_favor >= 0) or \
                    (target_builder >= 0) or (target_worker >= 0) or display_age or display_time:
                resources_line = images.food + '@ ' + (str(target_food) if (target_food >= 0) else ' ')
                resources_line += spacing + '@' + images.wood + '@ ' + (str(target_wood) if (target_wood >= 0) else ' ')
                resources_line += spacing + '@' + images.gold + '@ ' + (str(target_gold) if (target_gold >= 0) else ' ')
                resources_line += spacing + '@' + images.favor + '@ ' + (
                    str(target_favor) if (target_favor >= 0) else ' ')
                if target_builder >= 0:  # add builders count if indicated
                    resources_line += spacing + '@' + images.builder + '@ ' + str(target_builder)
                if target_worker >= 0:
                    resources_line += spacing + '@' + images.worker + '@ ' + str(target_worker)
                if display_age:
                    resources_line += spacing + '@' + self.get_age_image(resource_step['age'])
                # add time if indicated
                if display_time:
                    resources_line += '@' + spacing + '@' + self.settings.images.time + '@' + resource_step['time']

                self.build_order_resources.add_row_from_picture_line(parent=self, line=str(resources_line))

            # update the notes of the build order
            self.update_build_order_notes(selected_steps, selected_steps_ids)

        self.build_order_panel_layout()  # update layout
