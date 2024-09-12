# Game overlay application for Age of Mythology (AoM)
import sys
import pathlib
from PyQt5.QtWidgets import QApplication
from PyQt5.QtCore import QTimer

from aom.aom_game_overlay import AoMGameOverlay

if __name__ == '__main__':
    app = QApplication(sys.argv)
    window = AoMGameOverlay(app=app, directory_main=str(pathlib.Path(__file__).parent.resolve()))

    # timer to call the functions related to mouse and keyboard inputs
    timer = QTimer()
    timer.timeout.connect(window.timer_build_order_call)
    timer.timeout.connect(window.timer_mouse_keyboard_call)
    timer.setInterval(window.settings.call_ms)
    timer.start()

    exit_event = app.exec()
    sys.exit(exit_event)
