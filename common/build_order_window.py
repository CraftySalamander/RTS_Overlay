import os
import json
import webbrowser
import subprocess
from functools import partial

from PyQt5.QtWidgets import QMainWindow, QPushButton, QLineEdit
from PyQt5.QtWidgets import QTextEdit, QLabel, QComboBox, QApplication
from PyQt5.QtGui import QFont, QIcon, QIntValidator
from PyQt5.QtCore import Qt, QSize

from common.rts_overlay import RTSGameOverlay
from common.rts_settings import RTSBuildOrderInputLayout
from common.useful_tools import set_background_opacity, widget_x_end, widget_y_end, list_directory_files
from common.build_order_tools import check_valid_build_order_timer


def open_website(website_link):
    """Open the build order website.

    Parameters
    ----------
    website_link    Link to the website to open.
    """
    if website_link is not None:
        webbrowser.open(website_link)


class BuildOrderWindow(QMainWindow):
    """Window to add a new build order"""

    def __init__(self, app: QApplication, parent: RTSGameOverlay, game_icon: str, build_order_folder: str,
                 panel_settings: RTSBuildOrderInputLayout, edit_init_text: str, build_order_websites: list,
                 directory_game_pictures: str, directory_common_pictures: str):
        """Constructor

        Parameters
        ----------
        app                          Main application instance.
        parent                       The parent window.
        game_icon                    Icon of the game.
        build_order_folder           Folder where the build orders are saved.
        panel_settings               Settings for the panel layout.
        edit_init_text               Initial text for the build order text input.
        build_order_websites         List of website elements as [[button name 0, website link 0], [...]],
                                     (each item contains these 2 elements).
        directory_game_pictures      Directory where the game pictures are located.
        directory_common_pictures    Directory where the common pictures are located.
        """
        super().__init__()

        self.app = app
        self.parent = parent  # parent window
        self.build_order = None  # dictionary with the current build order

        # panel settings
        self.border_size = panel_settings.border_size
        self.vertical_spacing = panel_settings.vertical_spacing
        self.horizontal_spacing = panel_settings.horizontal_spacing
        self.font_police = panel_settings.font_police
        self.font_size = panel_settings.font_size
        self.color_font = panel_settings.color_font
        self.button_margin = panel_settings.button_margin
        self.edit_width = panel_settings.edit_width
        self.edit_height = panel_settings.edit_height
        self.color_background = panel_settings.color_background
        self.opacity = panel_settings.opacity
        self.combo_extra_width = panel_settings.combo_extra_width
        self.copy_line_width = panel_settings.copy_line_width
        self.copy_line_height = panel_settings.copy_line_height
        self.pictures_column_max_count = panel_settings.pictures_column_max_count
        self.picture_size: QSize = QSize(panel_settings.picture_size[0], panel_settings.picture_size[1])

        # pictures folders
        self.directory_game_pictures = directory_game_pictures
        self.directory_common_pictures = directory_common_pictures

        # style to apply on the different parts
        self.style_description = f'color: rgb({self.color_font[0]}, {self.color_font[1]}, {self.color_font[2]})'
        self.style_text_edit = 'QWidget{' + self.style_description + '; border: 1px solid white}'
        self.style_button = 'QWidget{' + self.style_description + '; border: 1px solid white; padding: ' + str(
            self.button_margin) + 'px}'

        # text input for the build order
        self.text_input = QTextEdit(self)
        self.text_input.setPlainText(edit_init_text)
        self.text_input.setFont(QFont(self.font_police, self.font_size))
        self.text_input.setStyleSheet(self.style_text_edit)
        self.text_input.setVerticalScrollBarPolicy(Qt.ScrollBarAsNeeded)
        self.text_input.resize(self.edit_width, self.edit_height)
        self.text_input.move(self.border_size, self.border_size)
        self.text_input.textChanged.connect(self.check_valid_input_bo)
        self.text_input.show()
        self.max_width = self.border_size + self.text_input.width()
        self.max_y = self.border_size + self.text_input.height()

        # button to add build order
        self.update_button = self.add_button(
            'Add build order', parent.add_build_order,
            self.border_size, self.max_y + self.vertical_spacing)

        # button to open build order folder
        self.folder_button = self.add_button(
            'Open build orders folder', lambda: subprocess.run(['explorer', build_order_folder]),
            widget_x_end(self.update_button) + self.horizontal_spacing, self.update_button.y())
        self.max_width = max(self.max_width, widget_x_end(self.folder_button))

        # button(s) to open build order website(s)
        self.website_buttons = []
        website_button_x = widget_x_end(self.folder_button) + self.horizontal_spacing
        for build_order_website in build_order_websites:
            if len(build_order_website) == 2:
                assert isinstance(build_order_website[0], str) and isinstance(build_order_website[1], str)
                website_link = build_order_website[1]
                website_button = self.add_button(
                    build_order_website[0], partial(open_website, website_link),
                    website_button_x, self.folder_button.y())
                self.website_buttons.append(website_button)
                website_button_x += website_button.width() + self.horizontal_spacing
                self.max_width = max(self.max_width, widget_x_end(website_button))

        # button to reset the build order
        self.reset_bo_button = self.add_button(
            'Reset build order', self.reset_build_order,
            self.border_size, self.max_y + self.vertical_spacing)

        # button to display the build order
        self.display_bo_button = self.add_button(
            'Display', self.display_build_order,
            widget_x_end(self.reset_bo_button) + self.horizontal_spacing, self.reset_bo_button.y())

        # button to add a new step
        self.add_step_button = self.add_button(
            'Add step', self.add_build_order_step,
            widget_x_end(self.display_bo_button) + self.horizontal_spacing, self.display_bo_button.y())
        self.add_step_button.hide()

        # button to format the build order
        self.format_bo_button = self.add_button(
            'Format', self.format_build_order,
            widget_x_end(self.add_step_button) + self.horizontal_spacing, self.add_step_button.y())
        self.max_width = max(self.max_width, widget_x_end(self.format_bo_button))
        self.format_bo_button.hide()

        # button to evaluate the time indications
        if self.parent.evaluate_build_order_timing is not None:
            # button to evaluate the time indications
            self.evaluate_timing_button = self.add_button(
                'Evaluate time', self.evaluate_build_order_timing,
                widget_x_end(self.format_bo_button) + self.horizontal_spacing, self.format_bo_button.y())

            self.timing_offset_input = QLineEdit(self)  # seconds input offset
            self.timing_offset_input.setValidator(QIntValidator())
            self.timing_offset_input.setAlignment(Qt.AlignRight)
            self.timing_offset_input.setFont(QFont(self.font_police, self.font_size))
            self.timing_offset_input.setStyleSheet(self.style_text_edit)
            self.timing_offset_input.setText('0')
            self.timing_offset_input.setMaxLength(panel_settings.timing_offset_max_length)
            self.timing_offset_input.resize(panel_settings.timing_offset_width, self.evaluate_timing_button.height())
            self.timing_offset_input.setToolTip('timing evaluation offset [sec]')
            self.timing_offset_input.move(
                widget_x_end(self.evaluate_timing_button) + self.horizontal_spacing, self.evaluate_timing_button.y())

            self.evaluate_timing_button.hide()
            self.timing_offset_input.hide()

            self.max_width = max(self.max_width, widget_x_end(self.timing_offset_input))
        else:
            self.evaluate_timing_button = None
            self.timing_offset_input = None

        # Check valid BO TXT input
        self.check_valid_input = QLabel('Update the build order in the top panel.', self)
        self.check_valid_input.setFont(QFont(self.font_police, self.font_size))
        self.check_valid_input.setStyleSheet(self.style_description)
        self.check_valid_input.adjustSize()
        self.check_valid_input.move(self.border_size, self.max_y + self.vertical_spacing)
        self.max_y = widget_y_end(self.check_valid_input)
        self.check_valid_input.show()

        # BO writer helper: get list of icons
        raw_icons_list = dict()  # raw list of pictures
        raw_icons_list['game'] = list_directory_files(
            directory=directory_game_pictures, extension=['.png', '.jpg'], recursive=True)
        raw_icons_list['common'] = list_directory_files(
            directory=directory_common_pictures, extension=['.png', '.jpg'], recursive=True)

        self.icons_list = dict()  # divide in sub-classes
        for key, sub_raw_icons_list in raw_icons_list.items():
            directory_pictures = directory_game_pictures if (key == 'game') else directory_common_pictures

            self.icons_list[key] = dict()
            sub_icons_list = self.icons_list[key]

            for raw_icon in sub_raw_icons_list:  # loop on the icons
                file_name = os.path.relpath(raw_icon, directory_pictures)
                dir_name = os.path.relpath(os.path.dirname(raw_icon), directory_pictures)
                if dir_name in sub_icons_list:
                    sub_icons_list[dir_name].append(file_name)
                else:
                    sub_icons_list[dir_name] = [file_name]

        # image selection text
        label_image_selection = QLabel('Image selection', self)
        label_image_selection.setFont(QFont(self.font_police, self.font_size))
        label_image_selection.setStyleSheet(self.style_description)
        label_image_selection.adjustSize()
        label_image_selection.move(self.border_size, self.max_y + self.vertical_spacing)
        self.max_y = widget_y_end(label_image_selection)
        label_image_selection.show()

        self.combobox = QComboBox(self)
        self.combobox_dict = dict()
        self.combobox.addItem('-- Select category --')
        self.combobox_dict[self.combobox.count() - 1] = None

        # faction selection
        self.combobox.addItem('select faction')
        self.combobox_dict[self.combobox.count() - 1] = self.parent.get_faction_selection()

        # build order notes images
        for section_1, values in self.icons_list.items():
            for section_2, images in values.items():
                images_keys = []
                for image in images:
                    images_keys.append({
                        'key': '@' + image + '@',
                        'image': image
                    })
                self.combobox.addItem(section_2.replace('_', ' '))
                self.combobox_dict[self.combobox.count() - 1] = {
                    'root_folder': section_1,
                    'images_keys': images_keys
                }

        self.image_icon_list = []  # icon list is initially empty

        # image category combobox
        self.combobox.setFont(QFont(self.font_police, self.font_size))
        self.combobox.setStyleSheet('QWidget{' + self.style_description + '; border: 1px solid white}')
        self.combobox.adjustSize()
        self.combobox.resize(self.combobox.width() + self.combo_extra_width, self.combobox.height())
        self.combobox.move(widget_x_end(label_image_selection) + self.horizontal_spacing,
                           label_image_selection.y())
        self.combobox.currentIndexChanged.connect(self.update_icons)
        self.max_y = max(self.max_y, widget_y_end(self.combobox))
        self.max_width = max(self.max_width, widget_x_end(self.combobox))
        self.combobox.show()

        # copy line widget
        self.copy_line = QLineEdit(self)
        self.copy_line.setText('')
        self.copy_line.setFont(QFont(self.font_police, self.font_size))
        self.copy_line.setStyleSheet(self.style_description)
        self.copy_line.setReadOnly(True)
        self.copy_line.resize(self.copy_line_width, self.copy_line_height)
        self.copy_line.move(self.border_size, self.max_y + self.vertical_spacing)
        self.max_y = widget_y_end(self.copy_line)
        self.max_y_init = self.max_y  # maximum y position (before adding optional images)
        self.max_width_init = self.max_width  # maximum width (before adding optional images)

        # window properties and show
        self.setWindowTitle('New build order')
        self.setWindowIcon(QIcon(game_icon))
        if panel_settings.stay_on_top:
            self.setWindowFlags(Qt.WindowStaysOnTopHint)  # window staying on top
        self.resize(self.max_width + self.border_size, self.max_y + self.border_size)
        set_background_opacity(self, self.color_background, self.opacity)
        self.show()

    def closeEvent(self, _):
        """Called when clicking on the cross icon (closing window icon)."""
        super().close()

    def add_button(self, label: str, click_function, pos_x: int, pos_y: int) -> QPushButton:
        """Add a QPushButton.

        Parameters
        ----------
        label             Label of the button.
        click_function    Function called when clicking on the button.
        pos_x             Button position (X coordinate).
        pos_y             Button position (Y coordinate).

        Returns
        -------
        Requested button.
        """
        button = QPushButton(label, self)
        button.setFont(QFont(self.font_police, self.font_size))
        button.setStyleSheet(self.style_button)
        button.adjustSize()
        button.move(pos_x, pos_y)
        button.clicked.connect(click_function)
        button.show()

        self.max_width = max(self.max_width, widget_x_end(button))
        self.max_y = max(self.max_y, widget_y_end(button))

        return button

    def update_icons(self):
        """Update the images selection icons."""

        # clear old list
        for image_icon in self.image_icon_list:
            image_icon.deleteLater()
        self.image_icon_list.clear()
        self.image_icon_list = []

        # reset size to the case without images
        self.max_width = self.max_width_init
        self.max_y = self.max_y_init

        # get data for selected category
        combobox_id = self.combobox.currentIndex()
        assert 0 <= combobox_id < len(self.combobox_dict)
        data = self.combobox_dict[combobox_id]

        if data is not None:  # check if images are provided
            image_x = self.border_size
            image_y = self.max_y_init + self.vertical_spacing
            column_id = 0

            for images_keys in data['images_keys']:
                root_folder = self.directory_game_pictures if (
                        data['root_folder'] == 'game') else self.directory_common_pictures
                image_path = os.path.join(root_folder, images_keys['image'])
                image_icon = QPushButton(self)
                image_icon.setIcon(QIcon(image_path))
                image_icon.setIconSize(self.picture_size)
                image_icon.resize(self.picture_size)
                image_icon.setToolTip(images_keys['key'])
                image_icon.clicked.connect(partial(self.copy_icon_path, images_keys['key']))
                image_icon.move(image_x, image_y)
                image_icon.show()

                self.max_width = max(self.max_width, widget_x_end(image_icon))
                self.max_y = max(self.max_y, widget_y_end(image_icon))

                # check if nex line
                if column_id >= self.pictures_column_max_count:
                    image_x = self.border_size
                    image_y = self.max_y + self.vertical_spacing
                    column_id = 0
                else:
                    column_id += 1
                    image_x = widget_x_end(image_icon) + self.horizontal_spacing

                self.image_icon_list.append(image_icon)  # add image

        # resize full window
        self.resize(self.max_width + self.border_size, self.max_y + self.border_size)

    def check_valid_input_bo(self):
        """Check if the BO input is valid (and update message accordingly)."""
        try:
            # get data as dictionary
            self.build_order = json.loads(self.text_input.toPlainText())

            # check if BO is valid
            valid_bo, bo_error_msg = self.parent.check_valid_build_order(self.build_order, bo_name_msg=False)

            if valid_bo:
                if self.parent.build_order_timer['available']:
                    if check_valid_build_order_timer(self.build_order):  # valid timing BO
                        self.check_valid_input.setText('Valid build order (also valid for timing).')
                    else:
                        self.check_valid_input.setText('Valid build order (non-valid for timing).')
                else:
                    self.check_valid_input.setText('Valid build order.')
            else:
                self.build_order = None
                self.check_valid_input.setText('Invalid BO: ' + bo_error_msg)
        except json.JSONDecodeError:
            self.build_order = None
            self.check_valid_input.setText('Build order input is not a valid JSON format.')
        except:
            self.build_order = None
            self.check_valid_input.setText('BO text input cannot be parsed (unknown error).')

        # build order additional buttons only when valid
        if self.build_order is not None:
            self.add_step_button.show()
            self.format_bo_button.show()
            if self.evaluate_timing_button is not None:
                self.evaluate_timing_button.show()
            if self.timing_offset_input is not None:
                self.timing_offset_input.show()
        else:
            self.add_step_button.hide()
            self.format_bo_button.hide()
            if self.evaluate_timing_button is not None:
                self.evaluate_timing_button.hide()
            if self.timing_offset_input is not None:
                self.timing_offset_input.hide()

        self.check_valid_input.adjustSize()

    def display_build_order(self):
        """Display the current build order in the parent main window."""

        if self.build_order is not None:
            # show valid build order in main panel
            self.parent.selected_build_order = self.build_order
            self.parent.selected_build_order_step_count = len(self.parent.selected_build_order['build_order'])
            self.parent.selected_build_order_step_id = self.parent.selected_build_order_step_count - 1
            assert self.parent.selected_build_order_step_count > 0
        else:
            # show build order issue in main panel
            self.parent.selected_build_order = {
                'notes': [self.check_valid_input.text()]
            }
            self.parent.selected_build_order_step_count = 1
            self.parent.selected_build_order_step_id = 0

        self.parent.update_panel_elements()  # display in main panel

    def copy_icon_path(self, name: str):
        """Copy the path to the icon in clipboard and copy line.

        Parameters
        ----------
        name   Name to copy.
        """
        name = name.replace('\\', '/')
        self.copy_line.setText(name)
        self.app.clipboard().setText(name)

    def format_build_order(self):
        """Format the build order to have a nice JSON presentation."""
        try:
            if self.build_order is not None:
                self.text_input.setText(json.dumps(self.build_order, indent=4))

            # scroll bar to the end
            self.text_input.verticalScrollBar().setValue(self.text_input.verticalScrollBar().maximum())
        except:
            print('Error when trying to format the build order')

    def reset_build_order(self):
        """Reset the build order to its template value."""
        self.build_order = self.parent.get_build_order_template()
        self.format_build_order()

    def add_build_order_step(self):
        """Add a step to the build order."""
        self.build_order['build_order'].append(self.parent.get_build_order_step(self.build_order['build_order']))
        self.format_build_order()

    def evaluate_build_order_timing(self):
        """Evaluate the time indications for the build order."""
        if (self.parent.evaluate_build_order_timing is not None) and (self.build_order is not None):
            offset_str = self.timing_offset_input.text()
            time_offset = int(offset_str) if offset_str.lstrip('-').isdigit() else 0
            self.parent.evaluate_build_order_timing(self.build_order, time_offset)
            self.format_build_order()
            self.display_build_order()
