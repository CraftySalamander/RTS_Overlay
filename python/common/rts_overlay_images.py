class RTSOverlayImages:
    """RTS Overlay images"""

    def __init__(self):
        """Constructor"""
        self.game_icon: str = 'icon/salamander_sword_shield.ico'  # game overlay icon
        self.next_panel: str = 'action_button/to_end.webp'  # go to the next panel
        self.hide_panel: str = 'action_button/hide.webp'  # hide the panel
        self.build_order_previous_step: str = 'action_button/previous.webp'  # go to previous step in the build order
        self.build_order_next_step: str = 'action_button/next.webp'  # go to next step in the build order
        self.quit: str = 'action_button/leave.webp'  # quit the overlay
        self.save: str = 'action_button/save.webp'  # save the settings
        self.load: str = 'action_button/load.webp'  # load the settings
        self.config_hotkeys: str = 'action_button/gears.webp'  # configure the hotkeys
        self.open_build_order_folder: str = 'action_button/feather.webp'  # open build order folder
        self.time: str = 'icon/time.webp'  # time for build order
        self.mouse: str = 'icon/mouse.webp'  # mouse
        self.switch_timer_manual: str = 'action_button/manual_timer_switch.webp'  # switch build order timer/manual
        self.start_stop_timer: str = 'action_button/start_stop.webp'  # start/stop the build order timer
        self.start_stop_timer_active: str = 'action_button/start_stop_active.webp'
        self.reset_timer: str = 'action_button/timer_0.webp'  # reset the build order timer
