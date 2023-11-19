# Game overlay application for Age of Empires IV (AoE4)
import sys
import pathlib
from PyQt5.QtWidgets import QApplication
from PyQt5.QtCore import QTimer

from aoe4.aoe4_game_overlay import AoE4GameOverlay

if __name__ == '__main__':
    app = QApplication(sys.argv)
    window = AoE4GameOverlay(app=app, directory_main=str(pathlib.Path(__file__).parent.resolve()))

    # timer to call the functions related to mouse and keyboard inputs
    timer_mouse = QTimer()
    timer_mouse.timeout.connect(window.timer_mouse_keyboard_call)
    timer_mouse.setInterval(window.settings.mouse_call_ms)
    timer_mouse.start()

    exit_event = app.exec()
    sys.exit(exit_event)
