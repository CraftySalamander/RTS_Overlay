# Game overlay application for Starcraft II (SC2)
import sys
import pathlib
from PyQt5.QtWidgets import QApplication
from PyQt5.QtCore import QTimer

from sc2.sc2_game_overlay import SC2GameOverlay

if __name__ == '__main__':
    App = QApplication(sys.argv)
    window = SC2GameOverlay(directory_main=str(pathlib.Path(__file__).parent.resolve()))

    # timer to call the functions related to mouse and keyboard inputs
    timer_mouse = QTimer()
    timer_mouse.timeout.connect(window.timer_mouse_keyboard_call)
    timer_mouse.setInterval(window.settings.mouse_call_ms)
    timer_mouse.start()

    exit_event = App.exec()
    sys.exit(exit_event)
