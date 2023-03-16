import webbrowser
import subprocess

from PyQt5.QtWidgets import QMainWindow, QPushButton
from PyQt5.QtWidgets import QTextEdit
from PyQt5.QtGui import QFont, QIcon
from PyQt5.QtCore import Qt

from common.useful_tools import set_background_opacity, widget_x_end, widget_y_end


class BuildOrderWindow(QMainWindow):
    """Window to add a new build order"""

    def __init__(self, parent, game_icon: str, build_order_folder: str, font_police: str, font_size: int,
                 color_font: list, color_background: list, opacity: float, border_size: int,
                 edit_width: int, edit_height: int, edit_init_text: str, button_margin: int,
                 vertical_spacing: int, horizontal_spacing: int, build_order_website: list):
        """Constructor

        Parameters
        ----------
        parent                 parent window
        game_icon              icon of the game
        build_order_folder     folder where the build orders are saved
        font_police            font police type
        font_size              font size
        color_font             color of the font
        color_background       color of the background
        opacity                opacity of the window
        border_size            size of the borders
        edit_width             width for the build order text input
        edit_height            height for the build order text input
        edit_init_text         initial text for the build order text input
        button_margin          margin from text to button border
        vertical_spacing       vertical spacing between the elements
        horizontal_spacing     horizontal spacing between the elements
        build_order_website    list of 2 website elements [button name, website link], empty otherwise
        """
        super().__init__()

        # style to apply on the different parts
        self.style_description = f'color: rgb({color_font[0]}, {color_font[1]}, {color_font[2]})'
        self.style_text_edit = 'QWidget{' + self.style_description + '; border: 1px solid white}'
        self.style_button = 'QWidget{' + self.style_description + '; border: 1px solid white; padding: ' + str(
            button_margin) + 'px}'

        # text input for the build order
        self.text_input = QTextEdit(self)
        self.text_input.setPlainText(edit_init_text)
        self.text_input.setFont(QFont(font_police, font_size))
        self.text_input.setStyleSheet(self.style_text_edit)
        self.text_input.setVerticalScrollBarPolicy(Qt.ScrollBarAsNeeded)
        self.text_input.resize(edit_width, edit_height)
        self.text_input.move(border_size, border_size)
        self.text_input.show()
        self.max_width = border_size + self.text_input.width()

        # button to add build order
        self.update_button = QPushButton('Add build order', self)
        self.update_button.setFont(QFont(font_police, font_size))
        self.update_button.setStyleSheet(self.style_button)
        self.update_button.adjustSize()
        self.update_button.move(border_size, border_size + self.text_input.height() + vertical_spacing)
        self.update_button.clicked.connect(parent.add_build_order)
        self.update_button.show()

        # button to open build order folder
        self.folder_button = QPushButton('Open build orders folder', self)
        self.folder_button.setFont(QFont(font_police, font_size))
        self.folder_button.setStyleSheet(self.style_button)
        self.folder_button.adjustSize()
        self.folder_button.move(
            widget_x_end(self.update_button) + horizontal_spacing, self.update_button.y())
        self.folder_button.clicked.connect(lambda: subprocess.run(['explorer', build_order_folder]))
        self.folder_button.show()
        self.max_width = max(self.max_width, widget_x_end(self.folder_button))

        # open build order website
        self.website_link = None
        if len(build_order_website) == 2:
            assert isinstance(build_order_website[0], str) and isinstance(build_order_website[1], str)
            self.website_link = build_order_website[1]
            self.website_button = QPushButton(build_order_website[0], self)
            self.website_button.setFont(QFont(font_police, font_size))
            self.website_button.setStyleSheet(self.style_button)
            self.website_button.adjustSize()
            self.website_button.move(
                widget_x_end(self.folder_button) + horizontal_spacing, self.folder_button.y())
            self.website_button.clicked.connect(self.open_website)
            self.website_button.show()
            self.max_width = max(self.max_width, widget_x_end(self.website_button))

        # window properties and show
        self.setWindowTitle('New build order')
        self.setWindowIcon(QIcon(game_icon))
        self.resize(self.max_width + border_size, widget_y_end(self.update_button) + border_size)
        set_background_opacity(self, color_background, opacity)
        self.show()

    def open_website(self):
        """Open the build order website"""
        if self.website_link is not None:
            webbrowser.open(self.website_link)

    def closeEvent(self, _):
        """Called when clicking on the cross icon (closing window icon)"""
        super().close()
