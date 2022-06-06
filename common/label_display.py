import os

from PyQt5.QtWidgets import QLabel
from PyQt5.QtGui import QPixmap, QFont
from PyQt5.QtCore import Qt


def split_multi_label_line(line: str):
    """Split a line based on the @ markers and remove first/last empty elements

    Parameters
    ----------
    line    line to split

    Returns
    -------
    requested split line
    """
    split_line = line.split('@')

    if (len(split_line) > 0) and (split_line[0] == ''):
        del split_line[0]
    if (len(split_line) > 0) and (split_line[-1] == ''):
        del split_line[-1]

    return split_line


def is_mouse_in_label(mouse_x: int, mouse_y: int, label: QLabel):
    """Check if mouse position is inside a label ROI

    Parameters
    ----------
    mouse_x    X position of the mouse (relative to window)
    mouse_y    Y position of the mouse (relative to window)
    label      label to check

    Returns
    -------
    True if inside the label
    """
    return (label.x() <= mouse_x <= label.x() + label.width()) and (
            label.y() <= mouse_y <= label.y() + label.height())


class QLabelSettings:
    """Settings for a QLabel"""

    def __init__(self, text_color: list = None, text_bold: bool = False, text_alignment: str = None,
                 background_color: list = None, image_width: int = None, image_height: int = None):
        """Constructor

        Parameters
        ----------
        text_color          color of the text [R, G, B], None for default
        text_bold           True for bold text, False for normal text
        text_alignment      text alignment: 'left', 'center' or 'right', None for default
        background_color    color of the background [R, G, B], None for default
        image_width         width to use for the image, None for default
        image_height        height to use for the image, None for default
        """
        self.text_color = text_color
        self.text_bold = text_bold
        self.background_color = background_color
        self.image_width = image_width
        self.image_height = image_height

        self.text_alignment = text_alignment
        if (text_alignment != 'left') and (text_alignment != 'center') and (text_alignment != 'right'):
            self.text_alignment = None


class MultiQLabelDisplay:
    """Display of several QLabel items"""

    def __init__(self, font_police: str, font_size: int, border_size: int, vertical_spacing: int,
                 color_default: list, image_height: int = -1,
                 game_pictures_folder: str = None, common_pictures_folder: str = None):
        """Constructor

        Parameters
        ----------
        font_police               police to use for the font
        font_size                 size of the font to use
        border_size               size of the borders
        vertical_spacing          vertical space between elements
        color_default             default text RGB color for the font
        image_height              height of the images, negative if no picture to use
        game_pictures_folder      folder where the game pictures are located, None if no game picture to use
        common_pictures_folder    folder where the common pictures are located, None if no common picture to use
        """
        # font and images
        self.font_police = font_police
        self.font_size = font_size
        self.image_height = image_height

        # layout
        self.border_size = border_size
        self.vertical_spacing = vertical_spacing

        # default text RGB color for the font
        assert (len(color_default) == 3) or (len(color_default) == 4)
        self.color_default = color_default

        # folders with pictures
        self.game_pictures_folder = game_pictures_folder if (
                (game_pictures_folder is not None) and os.path.isdir(game_pictures_folder)) else None

        self.common_pictures_folder = common_pictures_folder if (
                (common_pictures_folder is not None) and os.path.isdir(common_pictures_folder)) else None

        if (self.game_pictures_folder is not None) or (self.common_pictures_folder is not None):
            assert self.image_height > 0  # valid height must be provided

        self.labels = []  # labels to display
        self.shown = False  # True if labels currently shown

        self.row_max_width = 0  # maximal width of a row
        self.row_total_height = 0  # cumulative height of all the rows (with vertical spacing)

    def update_settings(self, font_police: str, font_size: int, border_size: int,
                        vertical_spacing: int, color_default: list, image_height: int = -1):
        """Update the settings

        Parameters
        ----------
        font_police         police to use for the font
        font_size           size of the font to use
        border_size         size of the borders
        vertical_spacing    vertical space between elements
        color_default       default text RGB color for the font
        image_height        height of the images, negative if no picture to use
        """
        self.clear()  # clear current content

        # font and images
        self.font_police = font_police
        self.font_size = font_size
        self.image_height = image_height

        if (self.game_pictures_folder is not None) or (self.common_pictures_folder is not None):
            assert self.image_height > 0  # valid height must be provided

        # layout
        self.border_size = border_size
        self.vertical_spacing = vertical_spacing

        # default text RGB color for the font
        assert (len(color_default) == 3) or (len(color_default) == 4)
        self.color_default = color_default

        self.labels = []  # labels to display
        self.shown = False  # True if labels currently shown

        self.row_max_width = 0  # maximal width of a row
        self.row_total_height = 0  # cumulative height of all the rows (with vertical spacing)

    def x(self):
        """Get X position of the first element

        Returns
        -------
        X position of the first element, 0 if no element
        """
        if (len(self.labels) > 0) and (len(self.labels[0]) > 0):
            return self.labels[0][0].x()
        else:
            return 0

    def y(self):
        """Get Y position of the first element

        Returns
        -------
        Y position of the first element, 0 if no element
        """
        if (len(self.labels) > 0) and (len(self.labels[0]) > 0):
            return self.labels[0][0].y()
        else:
            return 0

    def show(self):
        """Show all the labels"""
        for row in self.labels:
            for label in row:
                label.show()
        self.shown = True

    def hide(self):
        """Hide all the labels"""
        for row in self.labels:
            for label in row:
                label.hide()
        self.shown = False

    def clear(self):
        """Hide and remove all labels"""
        for row in self.labels:
            for label in row:
                label.deleteLater()
            row.clear()
        self.labels.clear()
        self.hide()

    def set_qlabel_settings(self, label: QLabel, settings: QLabelSettings = None):
        """Adapt the settings (color, boldness...) of a QLabel

        Parameters
        ----------
        label       QLabel to update
        settings    settings of the QLabel, None for default
        """
        if settings is None:  # use default settings
            settings = QLabelSettings()

        # font text color
        text_color = self.color_default if (settings.text_color is None) else settings.text_color
        style_str = f'color: rgb({text_color[0]}, {text_color[1]}, {text_color[2]})'

        # background color
        if settings.background_color is not None:
            background_color = settings.background_color
            style_str += f';background-color: rgb({background_color[0]}, {background_color[1]}, {background_color[2]})'

        if settings.text_bold:  # bold font
            style_str += ';font-weight: bold'

        label.setStyleSheet(style_str)

        # text alignment
        text_alignment = settings.text_alignment
        if text_alignment is not None:
            if text_alignment == 'left':
                label.setAlignment(Qt.AlignLeft)
            elif text_alignment == 'center':
                label.setAlignment(Qt.AlignCenter)
            elif text_alignment == 'right':
                label.setAlignment(Qt.AlignRight)

    def add_row_from_picture_line(self, parent, line: str, labels_settings: list = None):
        """Add a row of labels based on a line mixing text and images.

        Parameters
        ----------
        parent             parent element of this object
        line               string text line with images between @ markers (e.g. 'text @image@ text')
        labels_settings    settings for the QLabel elements, must be the same size as the line after splitting,
                           see 'split_multi_label_line' function (None for default settings).
        """
        if len(line) == 0:
            return

        if (self.game_pictures_folder is None) and (self.common_pictures_folder is None):  # no picture
            label = QLabel('', parent)
            label.setFont(QFont(self.font_police, self.font_size))
            label.setText(line)
            if labels_settings is not None:
                if len(labels_settings) == 1:
                    self.set_qlabel_settings(label, labels_settings[0])
                else:
                    print(f'Wrong size for \'labels_settings\' ({len(labels_settings)} vs 1).')
                    self.set_qlabel_settings(label)
            else:
                self.set_qlabel_settings(label)
            self.labels.append([label])
        else:  # pictures available
            split_line = split_multi_label_line(line)
            split_count = len(split_line)

            if split_count > 0:
                # check labels_settings items count
                if labels_settings is not None:
                    if len(labels_settings) != split_count:
                        print(f'Wrong size for \'labels_settings\' ({len(labels_settings)} vs {split_count}).')
                        labels_settings = None

                row = []
                for split_id in range(split_count):  # loop on the line parts
                    label = QLabel('', parent)

                    image_path = None  # assuming no image found

                    if self.game_pictures_folder is not None:  # try first with the game folder
                        game_image_path = os.path.join(self.game_pictures_folder, split_line[split_id])
                        if os.path.isfile(game_image_path):
                            image_path = game_image_path

                    # try then with the common folder
                    if (self.common_pictures_folder is not None) and (image_path is None):
                        common_image_path = os.path.join(self.common_pictures_folder, split_line[split_id])
                        if os.path.isfile(common_image_path):
                            image_path = common_image_path

                    if image_path is not None:  # image found

                        # resize the image according to the settings
                        image_width = None
                        image_height = self.image_height  # scaled to height by default
                        if labels_settings is not None:
                            if labels_settings[split_id].image_width is not None:
                                image_width = labels_settings[split_id].image_width
                            if labels_settings[split_id].image_height is not None:
                                image_height = labels_settings[split_id].image_height

                        if image_height is not None:
                            if image_width is not None:  # scale to width and height
                                label.setPixmap(QPixmap(image_path).scaled(image_width, image_height,
                                                                           transformMode=Qt.SmoothTransformation))
                            else:  # scale to height
                                label.setPixmap(
                                    QPixmap(image_path).scaledToHeight(image_height, mode=Qt.SmoothTransformation))
                        elif image_width is not None:  # scale to width
                            label.setPixmap(
                                QPixmap(image_path).scaledToWidth(image_width, mode=Qt.SmoothTransformation))
                    else:  # image not found
                        label.setText(split_line[split_id])
                        label.setFont(QFont(self.font_police, self.font_size))

                    if labels_settings is not None:
                        self.set_qlabel_settings(label, labels_settings[split_id])
                    else:
                        self.set_qlabel_settings(label)

                    row.append(label)

                self.labels.append(row)

    def update_size_position(self, init_x: int = -1, init_y: int = -1, adapt_to_columns: bool = False):
        """Update the size and position of all the labels

        Parameters
        ----------
        init_x              initial X position of the first label, negative for border size
        init_y              initial Y position of the first label, negative for border size
        adapt_to_columns    adapt the width to have columns in case each row has the same number of elements
        """

        # adjust the size of the items
        for row in self.labels:
            for label in row:
                label.adjustSize()

        # adjust width to have columns
        if adapt_to_columns and (len(self.labels) >= 2):  # at least two rows needed
            column_count = len(self.labels[0])  # number of expected columns
            column_width = [0] * column_count  # store the maximum width for each column
            valid_column_count = True  # assuming valid number of columns for each row
            for row in self.labels:  # loop on the rows
                if len(row) != column_count:
                    print(f'Non-consistent column counts: {column_count} vs {len(row)}.')
                    valid_column_count = False
                    break
                for column_id, label in enumerate(row):  # loop on the columns
                    column_width[column_id] = max(column_width[column_id], label.width())

            if valid_column_count:  # columns count were consistent
                for row in self.labels:
                    for column_id, label in enumerate(row):
                        label.resize(column_width[column_id], label.height())

        # starting position
        init_x = init_x if (init_x >= 0) else self.border_size
        init_y = init_y if (init_y >= 0) else self.border_size

        # reset width and height measures
        self.row_max_width = 0
        self.row_total_height = 0

        label_y = init_y  # current Y position

        row_count = len(self.labels)
        for row_id, row in enumerate(self.labels):  # loop on all the rows
            total_width = 0
            max_height = 0
            label_x = init_x  # current X position

            for label in row:  # loop on all the labels of the row
                label.move(label_x, label_y)
                label_x += label.width()
                total_width += label.width()
                max_height = max(max_height, label.height())

            # adapt to center along the max height
            for label in row:
                cur_height = label.height()
                if cur_height < max_height:
                    diff_height = max_height - cur_height
                    label.move(label.x(), label.y() + diff_height // 2)

            # update maximal width and total height
            self.row_max_width = max(self.row_max_width, total_width)
            self.row_total_height += max_height
            if row_id < row_count - 1:  # not the last row
                self.row_total_height += self.vertical_spacing
                label_y += max_height + self.vertical_spacing

    def get_mouse_label_id(self, mouse_x: int, mouse_y: int):
        """Get the IDs of the label hovered by the mouse

        Parameters
        ----------
        mouse_x    mouse X position (inside the window)
        mouse_y    mouse Y position (inside the window)

        Returns
        -------
        [row ID, column ID] of the label, [-1, -1] if not hovering any label
        """
        for row_id, row in enumerate(self.labels):
            for column_id, label in enumerate(row):
                if is_mouse_in_label(mouse_x, mouse_y, label):
                    return [row_id, column_id]
        return [-1, -1]

    def set_color_label(self, row_id: int, column_id: int, color: list = None):
        """Set the color of a label element

        Parameters
        ----------
        row_id       row ID of the label
        column_id    column ID of the label
        color        color to set, None to set the default color
        """
        # check color
        if color is not None:
            assert len(color) == 3

        # select label
        if 0 <= row_id < len(self.labels):
            row = self.labels[row_id]
            if 0 <= column_id < len(row):
                self.set_qlabel_settings(row[column_id], settings=QLabelSettings(text_color=color))
            else:
                print(f'Wrong column ID to set the color: {column_id}.')
        else:
            print(f'Wrong row ID to set the color: {row_id}.')
