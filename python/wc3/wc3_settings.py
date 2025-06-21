from common.rts_settings import RTSConfigurationLayout, RTSLayout, RTSOverlaySettings, \
    RTSTimerImages, RTSBuildOrderTimerLayout, RTSTimerHotkeys


class WC3ConfigurationLayout(RTSConfigurationLayout):
    """Settings for the WC3 configuration layout"""

    def __init__(self):
        """Constructor"""
        super().__init__()
        self.icon_select_size: list = [32, 32]  # size of the icon for race selection


class WC3BuildOrderLayout(RTSBuildOrderTimerLayout):
    """Settings for the RTS build order layout"""

    def __init__(self):
        """Constructor"""
        super().__init__()
        self.image_height: int = 35  # height of the build order images


class WC3Layout(RTSLayout):
    """Settings for the WC3 layout"""

    def __init__(self):
        """Constructor"""
        super().__init__()
        self.configuration: WC3ConfigurationLayout = WC3ConfigurationLayout()  # configuration layout
        self.build_order: WC3BuildOrderLayout = WC3BuildOrderLayout()  # build order layout


class WC3Images(RTSTimerImages):
    """Settings for the WC3 images"""

    def __init__(self):
        """Constructor"""
        super().__init__()
        self.food: str = 'resource/food.png'  # food cap
        self.gold: str = 'resource/gold.png'  # gold
        self.lumber: str = 'resource/lumber.png'  # lumber


class WC3OverlaySettings(RTSOverlaySettings):
    """Settings for the WC3 overlay"""

    def __init__(self):
        """Constructor"""
        super().__init__()

        self.title: str = 'WC3 Overlay'  # application title

        # layout
        self.layout = WC3Layout()

        # images
        self.images = WC3Images()

        # hotkeys
        self.hotkeys = RTSTimerHotkeys()
