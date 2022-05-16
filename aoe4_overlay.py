# Game overlay application for Age of Empires IV (AoE4)
import sys
import pathlib
from PyQt5.QtWidgets import QApplication
from PyQt5.QtCore import QTimer

from aoe4.aoe4_game_overlay import AoE4GameOverlay

if __name__ == '__main__':
    App = QApplication(sys.argv)
    window = AoE4GameOverlay(directory_main=str(pathlib.Path(__file__).parent.resolve()))

    # timer to call the functions related to mouse motion
    timer_mouse = QTimer()
    timer_mouse.timeout.connect(window.timer_mouse_call)
    timer_mouse.setInterval(window.settings.mouse_call_ms)
    timer_mouse.start()

    # timer to call the functions related to match data
    timer_match_data = QTimer()
    timer_match_data.timeout.connect(window.timer_match_data_call)
    timer_match_data.setInterval(window.settings.match_data_call_ms)
    timer_match_data.start()

    exit_event = App.exec()
    sys.exit(exit_event)
