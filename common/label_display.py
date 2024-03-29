import os
from typing import Union

from PyQt5.QtWidgets import QLabel, QMainWindow
from PyQt5.QtGui import QPixmap, QFont
from PyQt5.QtCore import Qt, QTimer
from typing import Optional

from common.useful_tools import widget_y_end


def split_multi_label_line(line: str) -> list:
    """Split a line based on the @ markers and remove first/last empty elements.

    Parameters
    ----------
    line    Line to split.

    Returns
    -------
    Requested split line.
    """
    split_line = line.split('@')

    if (len(split_line) > 0) and (split_line[0] == ''):
        del split_line[0]
    if (len(split_line) > 0) and (split_line[-1] == ''):
        del split_line[-1]

    return split_line


def is_mouse_in_label(mouse_x: int, mouse_y: int, label: QLabel) -> bool:
    """Check if mouse position is inside a label ROI.

    Parameters
    ----------
    mouse_x    X position of the mouse (relative to window).
    mouse_y    Y position of the mouse (relative to window).
    label      Label to check.

    Returns
    -------
    True if inside the label.
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
        text_color          Color of the text [R, G, B], None for default.
        text_bold           True for bold text, False for normal text.
        text_alignment      Text alignment: 'left', 'center' or 'right', None for default.
        background_color    Color of the background [R, G, B], None for default.
        image_width         Width to use for the image, None for default.
        image_height        Height to use for the image, None for default.
        """
        self.text_color = text_color
        self.text_bold = text_bold
        self.background_color = background_color
        self.image_width = image_width
        self.image_height = image_height

        self.text_alignment = text_alignment
        if (text_alignment != 'left') and (text_alignment != 'center') and (text_alignment != 'right'):
            self.text_alignment = None


class RectangleLimit:
    """Definition of a rectangle"""

    def __init__(self, x: int = 0, y: int = 0, width: int = 0, height: int = 0):
        """Constructor

        Parameters
        ----------
        x         Position in X of the first corner.
        y         Position in Y of the first corner.
        width     Rectangle width.
        height    Rectangle height.
        """
        self.x = x
        self.y = y
        self.width = width
        self.height = height

    def get_x_end(self) -> int:
        """Get the last X position."""
        return self.x + self.width

    def get_y_end(self) -> int:
        """Get the last Y position."""
        return self.y + self.height


class MultiQLabelDisplay:
    """Display of several QLabel items"""

    def __init__(self, font_police: str, font_size: int, border_size: int, vertical_spacing: int,
                 color_default: list, color_row_emphasis: list = (0, 0, 0), image_height: int = -1,
                 extra_emphasis_height=0, game_pictures_folder: str = None, common_pictures_folder: str = None):
        """Constructor

        Parameters
        ----------
        font_police               Police to use for the font.
        font_size                 Size of the font to use.
        border_size               Size of the borders.
        vertical_spacing          Vertical space between elements.
        color_default             Default text RGB color for the font.
        color_row_emphasis        Color for the (optional) row emphasis.
        image_height              Height of the images, negative if no picture to use.
        extra_emphasis_height     Extra pixels height for the color emphasis background rectangle.
        game_pictures_folder      Folder where the game pictures are located, None if no game picture to use.
        common_pictures_folder    Folder where the common pictures are located, None if no common picture to use.
        """
        # font and images
        self.font_police = font_police
        self.font_size = font_size
        self.image_height = image_height
        self.extra_emphasis_height = extra_emphasis_height

        # layout
        self.border_size = border_size
        self.vertical_spacing = vertical_spacing

        # default text RGB color for the font
        assert (len(color_default) == 3) or (len(color_default) == 4)
        self.color_default = color_default

        # color for the (optional) row emphasis
        assert len(color_row_emphasis) == 3
        self.color_row_emphasis = color_row_emphasis

        # folders with pictures
        self.game_pictures_folder = game_pictures_folder if (
                (game_pictures_folder is not None) and os.path.isdir(game_pictures_folder)) else None

        self.common_pictures_folder = common_pictures_folder if (
                (common_pictures_folder is not None) and os.path.isdir(common_pictures_folder)) else None

        if (self.game_pictures_folder is not None) or (self.common_pictures_folder is not None):
            assert self.image_height > 0  # valid height must be provided

        self.labels = []  # labels to display
        self.row_emphasis = None  # rectangle used to add emphasis on rows with background color
        self.row_emphasis_ids = []  # store the row IDs requiring emphasis
        self.row_color_ids = []  # store the row IDs for color rectangles
        self.shown = False  # True if labels currently shown

        self.row_max_width = 0  # maximal width of a row
        self.row_total_height = 0  # cumulative height of all the rows (with vertical spacing)
        self.rows_roi_limits = []  # list of rows rectangular limits

    def update_settings(self, font_police: str, font_size: int, border_size: int,
                        vertical_spacing: int, color_default: list, color_row_emphasis: list = (0, 0, 0),
                        image_height: int = -1, extra_emphasis_height=0):
        """Update the settings.

        Parameters
        ----------
        font_police              Police to use for the font.
        font_size                Size of the font to use.
        border_size              Size of the borders.
        vertical_spacing         Vertical space between elements.
        color_default            Default text RGB color for the font.
        color_row_emphasis       Color for the (optional) row emphasis.
        image_height             Height of the images, negative if no picture to use.
        extra_emphasis_height    Extra pixels height for the color emphasis background rectangle.
        """
        self.clear()  # clear current content

        # font and images
        self.font_police = font_police
        self.font_size = font_size
        self.image_height = image_height
        self.extra_emphasis_height = extra_emphasis_height

        if (self.game_pictures_folder is not None) or (self.common_pictures_folder is not None):
            assert self.image_height > 0  # valid height must be provided

        # layout
        self.border_size = border_size
        self.vertical_spacing = vertical_spacing

        # default text RGB color for the font
        assert (len(color_default) == 3) or (len(color_default) == 4)
        self.color_default = color_default

        # color for the (optional) row emphasis
        assert len(color_row_emphasis) == 3
        self.color_row_emphasis = color_row_emphasis

        self.clear()  # clear elements
        self.shown = False  # True if labels currently shown

        self.row_max_width = 0  # maximal width of a row
        self.row_total_height = 0  # cumulative height of all the rows (with vertical spacing)
        self.rows_roi_limits = []  # list of rows rectangular limits

    def x(self) -> int:
        """Get X position of the first element.

        Returns
        -------
        X position of the first element, 0 if no element.
        """
        if (len(self.labels) > 0) and (len(self.labels[0]) > 0):
            return self.labels[0][0].x()
        else:
            return 0

    def y(self) -> int:
        """Get Y position of the first element.

        Returns
        -------
        Y position of the first element, 0 if no element.
        """
        if (len(self.labels) > 0) and (len(self.labels[0]) > 0):
            return self.labels[0][0].y()
        else:
            return 0

    def show(self):
        """Show all the labels."""
        if self.row_emphasis is not None:
            self.row_emphasis.show()

        for row in self.labels:
            for label in row:
                label.show()

        self.shown = True

    def hide(self):
        """Hide all the labels."""
        if self.row_emphasis is not None:
            self.row_emphasis.hide()

        for row in self.labels:
            for label in row:
                label.hide()

        self.shown = False

    def is_visible(self) -> bool:
        """Check if any element is visible.

        Returns
        -------
        True if any element visible.
        """
        if (self.row_emphasis is not None) and self.row_emphasis.isVisible():
            return True

        for row in self.labels:
            for label in row:
                if label.isVisible():
                    return True

        return False

    def clear(self):
        """Hide and remove all labels."""
        if self.row_emphasis is not None:
            self.row_emphasis.deleteLater()
        self.row_emphasis = None
        self.row_emphasis_ids.clear()
        self.row_color_ids.clear()

        for row in self.labels:
            for label in row:
                label.deleteLater()
            row.clear()
        self.labels.clear()

        self.hide()

    def set_qlabel_settings(self, label: QLabel, settings: QLabelSettings = None):
        """Adapt the settings (color, boldness...) of a QLabel.

        Parameters
        ----------
        label       QLabel to update.
        settings    Settings of the QLabel, None for default.
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

    def get_image_path(self, image_search: str) -> Union[str, None]:
        """Get the path for an image.

        Parameters
        ----------
        image_search    Image to search.

        Returns
        -------
        Image with its path, None if not found.
        """
        if self.game_pictures_folder is not None:  # try first with the game folder
            game_image_path = os.path.join(self.game_pictures_folder, image_search)
            if os.path.isfile(game_image_path):
                return game_image_path

        # try then with the common folder
        if self.common_pictures_folder is not None:
            common_image_path = os.path.join(self.common_pictures_folder, image_search)
            if os.path.isfile(common_image_path):
                return common_image_path

        # not found
        return None

    def add_row_from_picture_line(self, parent, line: str, labels_settings: list = None, emphasis_flag: bool = False):
        """Add a row of labels based on a line mixing text and images.

        Parameters
        ----------
        parent             Parent element of this object.
        line               String text line with images between @ markers (e.g. 'text @image@ text').
        labels_settings    Settings for the QLabel elements, must be the same size as the line after splitting,
                           see 'split_multi_label_line' function (None for default settings).
        emphasis_flag      True to add background color emphasis on this row.
        """
        if len(line) == 0:
            return

        if emphasis_flag:  # add emphasis color background
            row_id = len(self.labels)
            assert row_id not in self.row_emphasis_ids
            self.row_emphasis_ids.append(row_id)

            if self.row_emphasis is None:
                self.row_emphasis = QLabel('', parent)
                self.row_emphasis.setStyleSheet(
                    f'background-color: rgb('
                    f'{self.color_row_emphasis[0]}, {self.color_row_emphasis[1]}, {self.color_row_emphasis[2]})')

        if (self.game_pictures_folder is None) and (self.common_pictures_folder is None):  # no picture
            label = QLabel('', parent)
            label.setFont(QFont(self.font_police, self.font_size))
            label.setText(line)

            if labels_settings is not None:
                if len(labels_settings) == 1:
                    current_label_settings = labels_settings[0]
                else:
                    print(f'Wrong size for \'labels_settings\' ({len(labels_settings)} vs 1).')
                    current_label_settings = QLabelSettings()
            else:
                current_label_settings = QLabelSettings()

            if emphasis_flag and (current_label_settings.background_color is None):
                current_label_settings.background_color = self.color_row_emphasis
            self.set_qlabel_settings(label, current_label_settings)
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
                    label.setObjectName(split_line[split_id])

                    # get image path
                    image_path = self.get_image_path(split_line[split_id])

                    if (labels_settings is not None) and (labels_settings[split_id] is not None):
                        current_label_settings = labels_settings[split_id]
                    else:
                        current_label_settings = QLabelSettings()

                    if image_path is not None:  # image found

                        # resize the image according to the settings
                        image_width = None
                        image_height = self.image_height  # scaled to height by default

                        if current_label_settings.image_width is not None:
                            image_width = current_label_settings.image_width
                        if current_label_settings.image_height is not None:
                            image_height = current_label_settings.image_height

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

                    if emphasis_flag and (current_label_settings.background_color is None):
                        current_label_settings.background_color = self.color_row_emphasis
                    self.set_qlabel_settings(label, current_label_settings)
                    row.append(label)

                self.labels.append(row)
            else:
                self.labels.append([QLabel('', parent)])

    def add_row_color(self, parent, height: int, color: list):
        """Add a row with only a single rectangular color fitting all the width.

        Parameters
        ----------
        parent    Parent element of this object.
        height    Height of the color rectangle.
        color     Color of the rectangle.
        """
        assert len(color) == 3

        if height < 1:  # check minimal size
            return

        self.row_color_ids.append(len(self.labels))  # store corresponding label ID

        label = QLabel('', parent)
        label.resize(1, height)  # width will be adapted later
        label.setStyleSheet(f';background-color: rgb({color[0]}, {color[1]}, {color[2]})')
        self.labels.append([label])

    def update_size_position(self, init_x: int = -1, init_y: int = -1, panel_init_width: int = -1,
                             adapt_to_columns: int = -1):
        """Update the size and position of all the labels.

        Parameters
        ----------
        init_x              Initial X position of the first label, negative for border size.
        init_y              Initial Y position of the first label, negative for border size.
        panel_init_width    Initial width of the panel.
        adapt_to_columns    Adapt the width to have columns for the X first columns
                            (negative to ignore it, 0 to apply on the column count of the first row).
        """

        # adjust the size of the items
        for row_id, row in enumerate(self.labels):
            if row_id in self.row_color_ids:  # color rows
                for label in row:
                    label.resize(1, label.height())
            else:  # normal rows
                for label in row:
                    label.adjustSize()

        # adjust width to have columns
        if (adapt_to_columns >= 0) and (len(self.labels) >= 2):  # at least two rows needed
            # number of requested columns
            column_count = len(self.labels[0]) if (adapt_to_columns == 0) else adapt_to_columns
            column_width = [0] * column_count  # store the maximum width for each column
            for row_id, row in enumerate(self.labels):  # loop on the rows
                if row_id in self.row_color_ids:  # skip color rows
                    continue
                for column_id, label in enumerate(row):  # loop on the columns
                    if column_id < column_count:
                        column_width[column_id] = max(column_width[column_id], label.width())

            for row_id, row in enumerate(self.labels):
                if row_id in self.row_color_ids:  # skip color rows
                    continue
                for column_id, label in enumerate(row):
                    if column_id < column_count:
                        label.resize(column_width[column_id], label.height())

        # starting position
        init_x = init_x if (init_x >= 0) else self.border_size
        init_y = init_y if (init_y >= 0) else self.border_size

        # reset width/height measures and rectangular limits
        self.row_max_width = 0
        self.row_total_height = 0
        self.rows_roi_limits = []

        label_y = init_y  # current Y position

        row_count = len(self.labels)
        for row_id, row in enumerate(self.labels):  # loop on all the rows
            total_width = 0
            max_height = 0
            label_x = 0 if (row_id in self.row_color_ids) else init_x  # current X position

            for label in row:  # loop on all the labels of the row
                label.move(label_x, label_y)
                label_x += label.width()
                total_width += label.width()
                max_height = max(max_height, label.height())

            self.rows_roi_limits.append(RectangleLimit(x=init_x, y=label_y, width=total_width, height=max_height))

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
                label_y += max_height + self.vertical_spacing
                self.row_total_height += self.vertical_spacing

        # total width of the panel
        panel_total_width = max(panel_init_width, self.row_max_width + 2 * self.border_size)

        # update row color width
        for row_id in self.row_color_ids:
            assert len(self.labels[row_id]) == 1
            self.labels[row_id][0].resize(panel_total_width, self.labels[row_id][0].height())

        # update the emphasis background color rectangles position and size
        if self.row_emphasis is not None:
            assert len(self.row_emphasis_ids) > 0

            # find Y limits
            y0 = -1
            y1 = -1
            for row_id in self.row_emphasis_ids:
                assert 0 <= row_id < len(self.rows_roi_limits)
                row_roi_limits = self.rows_roi_limits[row_id]

                if row_id - 1 in self.row_color_ids:  # no gap with previous color line
                    current_y0 = max(0, widget_y_end(self.labels[row_id - 1][0]))
                else:
                    current_y0 = max(0, row_roi_limits.y - self.extra_emphasis_height)
                current_y1 = row_roi_limits.y + row_roi_limits.height + self.extra_emphasis_height
                if y0 < 0:
                    y0 = current_y0
                else:
                    y0 = min(y0, current_y0)

                if y1 < 0:
                    y1 = current_y1
                else:
                    y1 = max(y1, current_y1)

            assert 0 <= y0 < y1
            self.row_emphasis.move(0, y0)
            self.row_emphasis.resize(panel_total_width, y1 - y0)

    def get_mouse_label_id(self, mouse_x: int, mouse_y: int) -> list:
        """Get the IDs of the label hovered by the mouse.

        Parameters
        ----------
        mouse_x    Mouse X position (inside the window).
        mouse_y    Mouse Y position (inside the window).

        Returns
        -------
        [row ID, column ID] of the label, [-1, -1] if not hovering any label.
        """
        for row_id, row in enumerate(self.labels):
            for column_id, label in enumerate(row):
                if is_mouse_in_label(mouse_x, mouse_y, label):
                    return [row_id, column_id]
        return [-1, -1]

    def set_color_label(self, row_id: int, column_id: int, color: list = None):
        """Set the color of a label element.

        Parameters
        ----------
        row_id       Row ID of the label.
        column_id    Column ID of the label.
        color        Color to set, None to set the default color.
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
