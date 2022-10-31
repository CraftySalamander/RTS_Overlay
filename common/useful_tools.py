import os

from PyQt5.QtWidgets import QWidget, QPushButton, QKeySequenceEdit, QMessageBox
from PyQt5.QtGui import QIcon
from PyQt5.QtCore import Qt, QSize


def widget_x_end(widget: QWidget) -> int:
    """Get the end position of a widget, along its X axis

    Parameters
    ----------
    widget    widget to measure

    Returns
    -------
    end position of a widget, along its X axis
    """
    return widget.x() + widget.width()


def widget_y_end(widget: QWidget) -> int:
    """Get the end position of a widget, along its Y axis

    Parameters
    ----------
    widget    widget to measure

    Returns
    -------
    end position of a widget, along its Y axis
    """
    return widget.y() + widget.height()


def list_directory_files(directory: str, extension: str = None, recursive: bool = True) -> list:
    """List files in directory

    Parameters
    ----------
    directory    directory to check
    extension    extension of the files to look for, None if not relevant
    recursive    True if recursive search, False for search only at the root

    Returns
    -------
    list of requested files
    """
    if recursive:  # recursive search
        result = []
        for (root, _, files) in os.walk(directory):
            for f in files:
                if (os.path.isfile(os.path.join(root, f)) and (len(os.path.splitext(f)) == 2) and (
                        (extension is None) or (os.path.splitext(f)[1] == extension))):
                    result.append(os.path.join(root, f))
        return result
    else:  # non recursive search
        return [os.path.join(directory, f) for f in os.listdir(directory) if
                (os.path.isfile(os.path.join(directory, f)) and (len(os.path.splitext(f)) == 2) and (
                        (extension is None) or (os.path.splitext(f)[1] == extension)))]


def cut_name_length(name: str, max_length: int) -> str:
    """Cut a name to a maximum length (and remove starting and ending spaces)

    Parameters
    ----------
    name          name to cut
    max_length    maximum length of the name (number of characters)

    Returns
    -------
    Name with correct size, space removed (and dot added if needed)
    """
    name = name.strip()  # remove spaces
    if len(name) <= max_length:
        return name
    else:
        return name[:max_length - 1].strip() + '.'


def scale_int(scaling: float, value: int) -> int:
    """Scaling an integer

    Parameters
    ----------
    scaling    scaling factor
    value      integer to scale

    Returns
    -------
    scaled integer
    """
    return int(round(scaling * value))


def scale_list_int(scaling: float, in_list: list) -> list:
    """Scaling a list of integers

    Parameters
    ----------
    scaling    scaling factor
    in_list    input list of integers to scale

    Returns
    -------
    output list corresponding to the input list scaled
    """
    out_list = []
    for i in range(len(in_list)):
        out_list.append(scale_int(scaling, in_list[i]))
    return out_list


class TwinHoverButton:
    """Button with a twin to handle mouse hovering"""

    def __init__(self, parent, icon: QIcon, button_qsize: QSize, click_connect=None, click_connect_args=None,
                 tooltip: str = None):
        """Constructor

        Parameters
        ----------
        parent                parent window of the main button
        icon                  icon of the button
        button_qsize          size of the button
        click_connect         function to activate when clicking on the button, None to skip it
        click_connect_args    arguments for 'click_connect', None if no argument
        tooltip               tooltip to display, None for no tooltip
        """
        # main button
        self.parent = parent
        self.button = QPushButton(self.parent)

        # twin hovering button
        self.hovering_button = QPushButton()  # when hovering the mouse on mouse transparent window
        self.hovering_button.setWindowFlags(Qt.FramelessWindowHint | Qt.WindowStaysOnTopHint | Qt.CoverWindow)

        # update the icon and the size
        self.update_icon_size(icon=icon, button_qsize=button_qsize)

        # update the function to activate when clicking on the button
        self.update_click_connect(click_connect=click_connect, click_connect_args=click_connect_args)

        # update tooltip
        self.update_tooltip(tooltip=tooltip)

    def update_icon_size(self, icon: QIcon, button_qsize: QSize):
        """Update the icon and the size of both buttons

        Parameters
        ----------
        icon            icon of the button
        button_qsize    size of the button
        """
        self.button.setIcon(icon)
        self.button.setIconSize(button_qsize)
        self.button.resize(button_qsize)

        self.hovering_button.setIcon(icon)
        self.hovering_button.setIconSize(button_qsize)
        self.hovering_button.resize(button_qsize)

    def update_click_connect(self, click_connect, click_connect_args):
        """Update the function to activate when clicking on the button

        Parameters
        ----------
        click_connect         function to activate when clicking on the button, None to not skip it
        click_connect_args    arguments for 'click_connect', None if no argument
        """
        if click_connect is not None:
            if click_connect_args is None:  # no argument provided
                self.button.clicked.connect(click_connect)
                self.hovering_button.clicked.connect(click_connect)
            else:  # arguments provided
                self.button.clicked.connect(lambda: click_connect(click_connect_args))
                self.hovering_button.clicked.connect(lambda: click_connect(click_connect_args))

    def update_tooltip(self, tooltip: str = None):
        """Update the buttons tooltip

        Parameters
        ----------
        tooltip    tooltip to display, None for no tooltip
        """
        if tooltip is not None:
            self.button.setToolTip(tooltip)
            self.hovering_button.setToolTip(tooltip)

    def show(self):
        """Show the main button"""
        self.button.show()

    def hide(self):
        """Hide both buttons"""
        self.button.hide()
        self.hovering_button.hide()

    def close(self):
        """Close both buttons"""
        self.button.close()
        self.hovering_button.close()

    def move(self, x, y):
        """Move the main button

        Parameters
        ----------
        x    X position
        y    Y position
        """
        self.button.move(x, y)

    def x(self) -> int:
        """Get the X position of the main button"""
        return self.button.x()

    def y(self) -> int:
        """Get the Y position of the main button"""
        return self.button.y()

    def x_end(self) -> int:
        """Get the X end position of the main button"""
        return widget_x_end(self.button)

    def y_end(self) -> int:
        """Get the Y end position of the main button"""
        return widget_y_end(self.button)

    def width(self) -> int:
        """Get the width of the main button"""
        return self.button.width()

    def height(self) -> int:
        """Get the height of the main button"""
        return self.button.height()

    def raise_(self):
        """Raise to the top of the parent widget's stack"""
        self.button.raise_()

    def hovering_show(self, is_mouse_in_roi_widget):
        """Detect if the twin hovering button must be shown, and update it accordingly

        Parameters
        ----------
        is_mouse_in_roi_widget    function to check if hovering on the button
        """
        # only when button is visible
        if self.button.isVisible():
            if is_mouse_in_roi_widget(self.button) and (not self.parent.hidden):
                self.hovering_button.move(self.parent.pos() + self.button.pos())
                self.hovering_button.show()
            else:
                self.hovering_button.hide()


def set_background_opacity(window, color_background: list, opacity: float):
    """Set the background color and opacity of a window

    Parameters
    ----------
    window              window to update
    color_background    color of the background for the window
    opacity             opacity of the window
    """
    assert len(color_background) == 3
    window.setStyleSheet(
        f'background-color: rgb({color_background[0]}, {color_background[1]}, {color_background[2]})')
    window.setWindowOpacity(opacity)


class OverlaySequenceEdit(QKeySequenceEdit):
    """Update on QKeySequenceEdit to adjust some inputs"""

    def __init__(self, parent):
        """Constructor

        Parameters
        ----------
        parent    parent window
        """
        super().__init__(parent)

    def keyPressEvent(self, QKeyEvent):
        """Handle key input

        Parameters
        ----------
        QKeyEvent    key event
        """
        super().keyPressEvent(QKeyEvent)

        value = self.keySequence().toString()

        if ', ' in value:  # only last value accepted
            value = value.split(', ')[-1]
            self.setKeySequence('' if (value == 'Esc') else value)

        # 'Esc' key used to cancel the value
        if value == 'Esc':
            self.setKeySequence('')

    def get_str(self) -> str:
        """Get the hotkey value as a string

        Returns
        -------
        requested string
        """
        out_str = self.keySequence().toString()

        # replace some wrong input characters
        replace_dict = {
            'É': 'é',
            'È': 'è'
        }
        for x, y in replace_dict.items():
            out_str = out_str.replace(x, y)

        return out_str


def popup_message(title: str, msg_text: str):
    """Open a popup message

    Parameters
    ----------
    title       title of the popup window
    msg_text    message to display
    """
    msg = QMessageBox()
    msg.setWindowTitle(title)
    msg.setText(msg_text)
    msg.setIcon(QMessageBox.Information)
    msg.exec_()
