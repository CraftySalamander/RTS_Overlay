from common.settings_subclass import SettingsSubclass


class RTSConfigurationLayout(SettingsSubclass):
    """Settings for the RTS configuration layout"""

    def __init__(self):
        """Constructor"""
        self.font_size_limits: list = [6, 25]  # limits for the font size selection choice
        # list of scaling values [%]
        self.scaling_list: list = [50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 175, 200, 225, 250, 275, 300]
        self.build_order_search_size: list = [240, 30]  # size of the search bar for the build order
        self.build_order_selection_vertical_spacing: int = 3  # vertical spacing between two build order suggestions
        self.selected_build_order_color: list = [230, 159, 0]  # color for selected build order
        self.hovering_build_order_color: list = [204, 102, 0]  # color for build order hovered by mouse
        self.bo_list_max_count: int = 10  # maximum count of valid build orders in the selection list
        self.bo_list_fuzz_search: bool = True  # True to use fuzzy search, False for splitting words search
        self.bo_list_fuzz_score_cutoff: int = 50  # score cutoff parameter for the fuzzy search


class RTSBuildOrderLayout(SettingsSubclass):
    """Settings for the RTS build order layout"""

    def __init__(self):
        """Constructor"""
        self.image_height: int = 30  # height of the build order images
        self.resource_spacing: int = 3  # space between the build order resources
        self.bo_next_tab_spacing: int = 30  # horizontal spacing between build order last button and next tab button
        self.tooltip_timeout: int = 1500  # timeout after which the tooltip is removed [ms]


class RTSBuildOrderTimerLayout(RTSBuildOrderLayout):
    """Settings for the RTS build order layout"""

    def __init__(self):
        """Constructor"""
        super().__init__()
        self.timer_bo_lines: int = 4  # number of lines to display for the build order with timer
        self.color_row_emphasis: list = [50, 50, 255]  # color to use for the emphasis background rectangle
        self.extra_emphasis_height: int = 3  # extra pixels height for the color emphasis background rectangle


class RTSBuildOrderTooltipLayout(SettingsSubclass):
    """Settings for the RTS build order layout (tooltip part)"""

    def __init__(self):
        """Constructor"""
        self.color_default: list = [255, 255, 255]  # default text RGB color for the font
        self.color_background: list = [0, 0, 0]  # background RGB color of the tooltip window
        self.opacity: float = 0.8  # opacity of the tooltip window
        self.vertical_spacing: int = 2  # vertical spacing for the tooltip lines
        self.border_size: int = 5  # border size of the tooltip window
        self.timeout: int = 1500  # time after which the tooltip is removed [ms]


class RTSLayout(SettingsSubclass):
    """Settings for the RTS layout"""

    def __init__(self):
        """Constructor"""
        self.opacity: float = 0.75  # opacity of the window
        self.upper_right_position: list = [1870, 65]  # initial position of the upper right corner
        self.border_size: int = 15  # size of the borders
        self.vertical_spacing: int = 10  # vertical spacing
        self.horizontal_spacing: int = 6  # horizontal spacing
        self.font_police: str = 'Arial'  # font police type
        self.font_size: int = 11  # font size (selected value for 'font_size_limits')
        self.scaling: int = 100  # scaling value [%] (selected value for 'scaling_list')
        self.color_default: list = [255, 255, 255]  # default text RGB color for the font
        self.color_background: list = [30, 30, 30]  # background RGB color
        self.action_button_size: int = 22  # size of the action buttons
        self.action_button_spacing: int = 8  # horizontal spacing between the action buttons
        self.build_order_tooltip: RTSBuildOrderTooltipLayout = RTSBuildOrderTooltipLayout()  # build order tooltip


class RTSImages(SettingsSubclass):
    """Settings for the RTS images"""

    def __init__(self):
        """Constructor"""
        self.game_icon: str = 'icon/salamander_sword_shield.ico'  # game overlay icon
        self.next_panel: str = 'action_button/to_end.png'  # go to the next next_panel
        self.build_order_previous_step: str = 'action_button/previous.png'  # go to previous step in the build order
        self.build_order_next_step: str = 'action_button/next.png'  # go to next step in the build order
        self.quit: str = 'action_button/leave.png'  # quit the overlay
        self.save: str = 'action_button/save.png'  # save the settings
        self.load: str = 'action_button/load.png'  # load the settings
        self.config_hotkeys: str = 'action_button/gears.png'  # configure the hotkeys
        self.write_build_order: str = 'action_button/feather.png'  # write a build order
        self.time: str = 'icon/time.png'  # time for build order
        self.mouse: str = 'icon/mouse.png'  # mouse


class RTSTimerImages(RTSImages):
    """Settings for the RTS images (with timer hotkeys)"""

    def __init__(self):
        """Constructor"""
        super().__init__()
        self.switch_timer_manual: str = 'action_button/manual_timer_switch.png'  # switch build order timer/manual
        self.start_stop_timer: str = 'action_button/start_stop.png'  # start/stop the build order timer
        # start/stop the build order timer (activated)
        self.start_stop_timer_active: str = 'action_button/start_stop_active.png'
        self.reset_timer: str = 'action_button/timer_0.png'  # reset the build order timer


class RTSHotkeysConfigurationLayout(SettingsSubclass):
    """Settings for the panel to configure the RTS hotkeys layout"""

    def __init__(self):
        """Constructor"""
        self.font_police: str = 'Arial'  # font police type
        self.font_size: int = 11  # font size
        self.color_font: list = [255, 255, 255]  # color of the font
        self.color_background: list = [30, 30, 30]  # color of the background
        self.opacity: float = 0.8  # opacity of the window
        self.border_size: int = 20  # size of the borders
        self.edit_width: int = 200  # width for the hotkeys edit fields
        self.edit_height: int = 30  # height for the hotkeys edit fields
        self.button_margin: int = 5  # margin from text to button border
        self.vertical_spacing: int = 10  # vertical spacing between the elements
        self.section_vertical_spacing: int = 20  # vertical spacing between the sections
        self.horizontal_spacing: int = 10  # horizontal spacing between the elements
        self.mouse_height: int = 25  # height for the mouse image
        self.mouse_spacing: int = 30  # horizontal spacing between the field and the mouse icon


class RTSBuildOrderInputLayout(SettingsSubclass):
    """Settings for the panel to input a new build order"""

    def __init__(self):
        """Constructor"""
        self.font_police: str = 'Arial'  # font police type
        self.font_size: int = 11  # font size
        self.color_font: list = [255, 255, 255]  # color of the font
        self.color_background: list = [30, 30, 30]  # color of the background
        self.opacity: float = 0.8  # opacity of the window
        self.border_size: int = 10  # size of the borders
        self.edit_width: int = 800  # width for the build order text input
        self.edit_height: int = 400  # height for the build order text input
        self.button_margin: int = 5  # margin from text to button border
        self.vertical_spacing: int = 10  # vertical spacing between the elements
        self.horizontal_spacing: int = 10  # horizontal spacing between the elements
        self.combo_extra_width: int = 10  # extra width for the combo selection size
        self.copy_line_width: int = 600  # width for the line to copy
        self.copy_line_height: int = 30  # height for the line to copy
        self.pictures_column_max_count: int = 12  # maximum number of columns for the pictures
        self.picture_size: list = [40, 40]  # size for the pictures selection icons


class KeyboardMouse(SettingsSubclass):
    """Fields for keyboard and mouse together"""

    def __init__(self):
        """Constructor"""
        self.keyboard: str = ''  # keyboard input, '' for no input
        self.mouse: str = ''  # mouse input, '' for no input


class RTSHotkeys(SettingsSubclass):
    """Settings for the RTS hotkeys"""

    def __init__(self):
        """Constructor"""
        self.mouse_accepted_values: str = '\'left\', \'middle\', \'right\', \'x\', \'x2\', \'\' (unset)'  # mouse manual
        self.enter: str = 'Return'  # enter selection key
        self.select_next_build_order: str = 'Tab'  # select the next build order
        self.next_panel: KeyboardMouse = KeyboardMouse()  # cycle through the next panel
        self.show_hide: KeyboardMouse = KeyboardMouse()  # show/hide the application
        self.build_order_previous_step: KeyboardMouse = KeyboardMouse()  # go to the previous build order step
        self.build_order_next_step: KeyboardMouse = KeyboardMouse()  # go to the next build order step
        self.mouse_max_time: float = 0.1  # maximum time since last mouse button click (for combined hotkey) [s]


class RTSTimerHotkeys(RTSHotkeys):
    """Settings for the RTS hotkeys (with timer hotkeys)"""

    def __init__(self):
        """Constructor"""
        super().__init__()
        self.switch_timer_manual: KeyboardMouse = KeyboardMouse()  # switch build order between timer/manual
        self.start_stop_timer: KeyboardMouse = KeyboardMouse()  # start/stop the build order timer
        self.reset_timer: KeyboardMouse = KeyboardMouse()  # reset the build order timer


class RTSOverlaySettings(SettingsSubclass):
    """Settings for the RTS overlay"""

    def __init__(self):
        """Constructor"""
        self.timer_available: bool = False  # True if timer feature available

        self.call_ms: int = 20  # interval between 2 calls (e.g. for mouse motion) [ms]

        # panel to configure the hotkeys
        self.panel_hotkeys: RTSHotkeysConfigurationLayout = RTSHotkeysConfigurationLayout()

        # panel to input a build order
        self.panel_build_order = RTSBuildOrderInputLayout()
