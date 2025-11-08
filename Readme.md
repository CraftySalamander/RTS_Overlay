Presentation
============
**RTS Overlay** is a tool used to design or import build orders for Real-Time Strategy (RTS) games.
The build orders can then be displayed on top of the game, and thus can be used with a single monitor.

Updating the build order step in-game is done manually via buttons/hotkeys/timer.
RTS Overlay does not interact with the game (no screen analysis, no controller interaction).

Read the main instructions [here](#main-instructions-and-download) to use the overlay.

![RTS Overlay](/docs/assets/common/icon/salamander_sword_shield_small.png)


Table of contents
=================

* [Main instructions and download](#main-instructions-and-download)
* [Using the overlay through a web browser or with an EXE](#using-the-overlay-through-a-web-browser-or-with-an-exe)
* [Supported games](#supported-games)
* [Web solution](#web-solution)
    * [Always On Top](#always-on-top)
* [EXE/Python solution](#exepython-solution)
    * [EXE solution](#exe-solution)
    * [Python configuration](#python-configuration)
    * [Configuration panel](#configuration-panel)
    * [Build order selection](#build-order-selection)
* [Common to Web and EXE/Python solutions](#common-to-web-and-exepython-solutions)
    * [Designing a build order](#designing-a-build-order)
    * [Using the build order panel](#using-the-build-order-panel)
* [Game-specific instructions](#game-specific-instructions)
    * [Age of Empires II (AoE2)](#age-of-empires-ii-aoe2)
    * [Age of Empires IV (AoE4)](#age-of-empires-iv-aoe4)
    * [Age of Mythology (AoM)](#age-of-mythology-aom)
    * [StarCraft II (SC2)](#starcraft-ii-sc2)
    * [WarCraft III (WC3)](#warcraft-iii-wc3)
* [Troubleshooting](#troubleshooting)
    * [Web version](#web-version)
    * [EXE/Python version](#exepython-version)
* [Additional notes](#additional-notes)


# Main instructions and download

As explained in the [next section](#using-the-overlay-through-a-web-browser-or-with-an-exe), there are two methods to use the overlay:
* Through a web browser
    * [YouTube demo](https://youtu.be/dst2b8b4_fo)
    * Go to [rts-overlay.github.io](https://rts-overlay.github.io/) and follow the instructions.
* Using an EXE (or running from its Python source code)
    * [YouTube demo](https://youtu.be/qFBkpTnRzWQ)
    * Download the EXE (only for Windows) using these links:
        * [Age of Empires II](https://github.com/CraftySalamander/RTS_Overlay/releases/download/2.5.0/aoe2_overlay.zip)
        * [Age of Empires IV](https://github.com/CraftySalamander/RTS_Overlay/releases/download/2.9.0/aoe4_overlay.zip)
        * [Age of Mythology](https://github.com/CraftySalamander/RTS_Overlay/releases/download/2.8.0/aom_overlay.zip)
        * [Starcraft II](https://github.com/CraftySalamander/RTS_Overlay/releases/download/2.0.0/sc2_overlay.zip)
        * [Warcraft III](https://github.com/CraftySalamander/RTS_Overlay/releases/download/2.7.0/wc3_overlay.zip)
    * Alternatively, run from Python source code, by following the instructions in the [Python configuration](#python-configuration) section.


# Using the overlay through a web browser or with an EXE

RTS Overlay is available either through a [web browser](https://rts-overlay.github.io/) or as an EXE/Python solution (the EXE solution can be used by downloading the pre-compiled EXE [here](#main-instructions-and-download) or running from Python source code).

The web-based solution is easier to use and is a good first step when trying *RTS Overlay*.
The Exe/Python solution (from source or pre-compiled) offers some additional functionalities:
1. *Less intrusive*: No header, semi-transparent (opacity) and does not interfere with mouse clicks.
2. *Global hotkeys*: Both versions support hotkeys, but the web-based version only accepts hotkeys when the focus is on the overlay. The EXE/Python solution listens to hotkeys, even when the focus is on the game.

How to run:
* **Web solution**: Go to [rts-overlay.github.io](https://rts-overlay.github.io/) and follow the instructions.
    * To keep it on top of your game while playing, use an *Always On Top* application. For Windows, [PowerToys](https://learn.microsoft.com/en-us/windows/powertoys/) is a good solution. It is free, developed by Microsoft and available on the [Microsoft Store](https://apps.microsoft.com/).
    * You can also download a local version to improve the speed, work offline and customize the experience. [Click here](https://github.com/CraftySalamander/RTS_Overlay/archive/refs/heads/master.zip), unzip and open *docs/index.html* with any web browser. Alternatively, you can click on the installation button in the URL bar (for Chrome and Edge) to install it locally.
    * The development (non-stable) version is available [here](https://craftysalamander.github.io/RTS_Overlay/).
* **EXE/Python solution**: Download the EXE [here](#main-instructions-and-download) or follow the Python instructions [here](#python-configuration).
    * The EXE is a pre-compiled version (obtained from Python source code) in a zip package. No need to install the python environment, only unzip and click on the game EXE (in the *overlay* sub-folder). Note that some antivirus softwares do not like EXE in zip files downloaded from the internet (and you might need to ask an exception if you decide to use this solution).


# Supported games

At the moment, the following games are supported:

* [Age of Empires II Definitive Edition](https://www.ageofempires.com/games/aoeiide/)
    * Download any build order from [buildorderguide.com](https://buildorderguide.com) (click on *Copy to clipboard for RTS Overlay*).
    * See YouTube demo [here](https://youtu.be/tONaR2oOt3I) (Web solution) or [here](https://youtu.be/qFBkpTnRzWQ) (EXE/Python solution).

[![AoE2 build order in action](/readme/aoe2_build_order_demo.png)](https://youtu.be/tONaR2oOt3I)

* [Age of Empires IV](https://www.ageofempires.com/games/age-of-empires-iv/)
    * Download any build order from [aoe4guides.com](https://aoe4guides.com) (click on *Overlay Tool*) or from [age4builder.com](https://age4builder.com) (click on the salamander icon).
    * See YouTube demo [here](https://youtu.be/RmsofE58YEg).

[![AoE4 build order in action](/readme/aoe4_build_order_demo.png)](https://youtu.be/RmsofE58YEg)

* [Age of Mythology](https://www.ageofempires.com/games/aom/age-of-mythology-retold/)
    * See YouTube demo [here](https://youtu.be/f11ISkuVhnU).

[![AoM build order in action](/readme/aom_build_order_demo.png)](https://youtu.be/f11ISkuVhnU)

* [StarCraft II](https://starcraft2.com)
    * Download build orders from [Spawning Tool](https://lotv.spawningtool.com) (only for EXE/Python solution, instructions in RTS Overlay tool).

![SC2 build order in action](/readme/sc2_build_order_demo.png)

* [Warcraft III](https://warcraft3.blizzard.com/)


# Web solution

The main page of the [web version](https://rts-overlay.github.io/) is visible below.
Full instructions are available when hovering during a short time on the "i" icon on the top right of the page.

![Web-based version of RTS Overlay](/readme/rts_overlay_web.png)

## Always On Top

Once the build order is ready, click on the *Display overlay* button to generate a new (small) window with the requested build order.
Be sure to use an *Always On Top* application to keep it on top of your game.

[Microsoft PowerToys](https://learn.microsoft.com/en-us/windows/powertoys/) is a good solution. It is free, developed by Microsoft and available on the *Microsoft Store*.
Download it from the *Microsoft Store*, configure the hotkey for the *Always On Top* feature (you can also configure the border color) and use it on the *RTS Overlay* window.

# EXE/Python solution

Select one of the two methods below (*EXE solution* or *Python configuration*). As mentioned above, there are two added benefits (compared to the web-based solution): *Less intrusive* and *Global hotkeys*.

## EXE solution

This method is easier to do and runs a compiled version (so more efficient) of the overlay.
The python code was compiled and zipped with all the dependencies in a zip folder.
Note that some antivirus softwares do not appreciate zip folders with executables and dependencies downloaded from the internet, and will potentially send false positive warnings.
Here are the instructions:

1. Download the zip folder of the requested game [here](#main-instructions-and-download). On some computers, you might need to unblock the zip folder before extracting it (right click on the zip folder, select properties and then select "unblock").
2. Unzip it in any location on your computer (ideally in a location where no special computer rights are requested).
3. To launch the program, simply launch the executable of the requested game (all these executables are located in the *overlay* sub-folder, see specific details for each game).

To update the library to a new release, just delete the old folder and replace it with the new release.
Note that your settings and build orders are saved in the user data directory (e.g. *C:\Users\XXXXX\AppData\Local\RTS_Overlay*). So, updating to a new release should not remove your old settings, nor your build orders.
In case you want to use a local configuration folder, create a folder called *"local_config"* in the *overlay* sub-folder. The configuration (and build orders) will be saved there.

If you encounter issues, have a look at the [Troubleshooting](#troubleshooting) section.

## Python configuration

You can run the program from source using Python. It should not be difficult to do, even without any coding knowledge.
Here are the instructions:

1. If you do not yet have a Python environment, you can download and install a Python distribution with conda package manager using the [Anaconda installer](https://www.anaconda.com/download) (other distributions can also work like [Miniforge](https://github.com/conda-forge/miniforge#miniforge3)).
Optionnaly, you can add the program (e.g. Anaconda3) to your PATH environment variable (to run it from any terminal).
2. Download the code of RTS Overlay: click on the *Code* button (on top of [this page](https://github.com/CraftySalamander/RTS_Overlay)), then on *Download ZIP*  and extract the ZIP folder (or clone it with [Git](https://git-scm.com/)).
3. Open *Anaconda Prompt*. If you added the python path to your PATH environment variable, you can open any terminal (e.g. *Command Prompt* on Windows).
4. Go to the python directory of your extracted folder (e.g. `cd RTS_Overlay-master/python`).
5. Create the Conda environment: `conda create --name rts_overlay python=3.8`
6. Activate your environment: `conda activate rts_overlay`
7. Install the library requirements: `pip install -r utilities/requirements.txt`
8. Optionally, run `pip install python-Levenshtein==0.12.2` (for slightly faster performances).
9. Run the application: `python main_aoe2.py` (for AoE2, similar for other games).

Steps 3, 4, 6 and 9 must be re-done each time you want to launch the program.

In case you want to build the application as an *exe* program, the command `python prepare_release.py` (after `cd utilities`) will create the standalone libraries, and prepare additional files for the releases (you will need `pip install nuitka==1.0.6` and `pip install orderedset==2.0.3`).


## Configuration panel

When you launch the EXE/Python version of *RTS Overlay*, you first see the *Configuration panel*.
It is used to configure the layout and the build order.

![Configuration panel](/readme/aoe2_panel_configuration.png)

The first row contains the following action buttons (from left to right):

* [Quit application](docs/assets/common/action_button/leave.png): Quit the tool.
* [Save settings](docs/assets/common/action_button/save.png): Save the configuration in a settings file (e.g. *aoe2_settings.py*).
* [Load settings](docs/assets/common/action_button/load.png): Load the settings of the aforementioned file (this file is automatically loaded at launch).
* [Configure hotkeys](docs/assets/common/action_button/gears.png): Configure the hotkeys (using keyboard and/or mouse inputs) and open the folder where the corresponding settings are saved. The following hotkeys are global in the sense that they can be used even when you do not have the focus on the overlay (typically while playing the game):
    * *next_panel*: cycle through the next panel
    * *show_hide*: show/hide the application
    * *build_order_previous_step*: go to the previous build order step, or update the timer to -1 sec (see below)
    * *build_order_next_step*: go to the next build order step, or update the timer to +1 sec (see below)
    * *switch_timer_manual*: swicth between manual and timer-based transitions (see below)
    * *start_timer*: start the timer
    * *stop_timer*: stop the timer
    * *start_stop_timer*: start or stop the timer
    * *reset_timer*: reset the timer to *0:00*
* [Add build order](docs/assets/common/action_button/feather.png): Add a build order (write it using widgets or copy it from a dedicated website) and open the folder where the build orders are stored. If a website can generate build orders with the correct format, a button will be available to reach this website.
* Choose the font size of the text police.
* Choose the scaling of the layout (images, spacing...).
    * When using a 4K display, you can for instance set this value to *200 %*.
* [Next panel](docs/assets/common/action_button/to_end.png): go to the Next panel (cycling between *Configuration* and *Build Order*).

You can move the window with drag and drop, using the left click. Because the window will be resized depending on its content, what matters is only the upper right corner position. This upper right position will be maintained (and saved in the settings file using the [Save settings](docs/assets/common/action_button/save.png) button).

The overlay window should stay on top of your other applications (game included). Sometimes, it might not work properly at launch, but clicking a single time on [Next panel](docs/assets/common/action_button/to_end.png) should solve the issue.

More options are available in this settings file (police font, size of the images...). Click on [Configure hotkeys](docs/assets/common/action_button/gears.png), then on `Open settings folder` to find it. You can edit it (JSON format) with any text editor and reload it (using the [Load settings](docs/assets/common/action_button/load.png) button or by quitting and relaunching the application).

## Build order selection

In the configuration panel, you find the **Build Order** search bar. To choose the build order to display, start by typing a few keywords. A list of up to 10 corresponding build orders appear. This is performed using a fuzzy search. Alternatively, you can deactivate this fuzzy search (or tune it) in the aforementioned settings file (JSON format) with the `bo_list_fuzz_search` flag. When set to False, all the keywords separated by spaces must appear in the selected build orders names. Finally, if you only type a single space character, the first 10 build orders will appear. The overlay has a filtering option to select your faction or a generic build order (and potentially the one of your opponent).

Press *Enter* to select the build order appearing in bold. By default, the one selected is the first of the list, but you can use *Tab* to select another one. Another solution is to click with the mouse on the requested build order.


# Common to Web and EXE/Python solutions

## Designing a build order

When available, the easiest way to design a build order is through a dedicated website which can output the build orders in correct format (e.g. [buildorderguide.com](https://buildorderguide.com) for AoE2). Many existing build orders can be found on these websites.

Alternatively, you can write it in the build order design panel by clicking on **Design your own** in the [web version](https://rts-overlay.github.io/) (see demo [here](https://youtu.be/dst2b8b4_fo)). For the EXE/Python solution, use the [Add build order button](docs/assets/common/action_button/feather.png).
The generated build orders are identical for the two versions. It is way easier to do it via the web interface, even if the BO will be used in the the EXE/Python application.

![Build Order Design](/readme/rts_overlay_aoe2_editor.gif)

## Using the build order panel

On the EXE/Python version, you cannot click on this window (allowing to still click on the game behind it), except on the buttons of the first row. The web version does not have this feature (i.e. it is not transparent to mouse interactions).

You can select the step of the build order, using the two [arrow buttons](docs/assets/common/action_button/previous.png). The current step of the build order is indicated next to it. You can also use the aforementioned hotkeys to change the build order step, even when you do not have the focus on the overlay.

In case the timer update feature is available and is compatible with the current build order, the [feather/hourglass button](docs/assets/common/action_button/manual_timer_switch.png) will appear. When clicking on it, the build order update will use timing instructions. To stop/run, click on the [corresponding button](docs/assets/common/action_button/start_stop.png). The [arrow buttons](docs/assets/common/action_button/previous.png) now updates the timer by 1 second, while the [reset button](docs/assets/common/action_button/timer_0.png) with set the timer to *0:00*. When running, the current instruction is highlighted, while the previous and next ones are also shown. Hotkeys are also available for all these actions.

The build order typically indicates the number of workers to assign to each resource, the total number of workers/supply and some notes.
When applicable, the age to reach, the time and/or the number of builders are also indicated.

![Build Order panel](/readme/aoe2_panel_build_order.png)


# Game-specific instructions

## Age of Empires II (AoE2)

To run the application, select Age of Empires II (web version) or launch *aoe2_overlay.exe* (download [here](#main-instructions-and-download), or run from [Python source](#python-configuration)).

You can download build orders from [buildorderguide.com](https://buildorderguide.com) by clicking on *Copy to clipboard for RTS Overlay* on any build order.


## Age of Empires IV (AoE4)

To run the application, select Age of Empires IV (web version) or launch *aoe4_overlay.exe* (download [here](#main-instructions-and-download), or run from [Python source](#python-configuration)).

You can download compatible build orders from [aoe4guides.com](https://aoe4guides.com) by clicking on `Overlay Tool` on any build order, or from [age4builder.com](https://age4builder.com) by clicking on the salamander icon on any build order.


## Age of Mythology (AoM)

To run the application, select Age of Mythology (web version) or launch *aom_overlay.exe* (download [here](#main-instructions-and-download), or run from [Python source](#python-configuration)).


## StarCraft II (SC2)

To run the application, select StarCraft II (web version) or launch *sc2_overlay.exe* (download [here](#main-instructions-and-download), or run from [Python source](#python-configuration)).


## WarCraft III (WC3)

To run the application, select WarCraft III (web version) or launch *wc3_overlay.exe* (download [here](#main-instructions-and-download), or run from [Python source](#python-configuration)).


# Troubleshooting

In case of issues, try first the tips below. If none of them solve the issue, you can add an issue on GitHub (https://github.com/CraftySalamander/RTS_Overlay/issues) describing your problem (the more details, the better).
For the EXE/Python solution, be sure to mention the version number (located in *version.json* at the root of the folder).

## Web version

If you encounter issues with the web-based version, you can try to run with another web browser (Chrome, Edge...) to see if the same issue still appears. For this overlay, Edge and Chrome seem to work better than other browsers like Firefox.

## EXE/Python version

On some computers, you might need to allow the access to the executable or the whole folder. In particular, if you see "cannot proceed because python38.dll was not found", you must unblock the zip folder before extracting it (right click on the zip folder, select properties and then select "unblock").

Similarly, Windows (or your antivirus) might read *.exe* files as threats and remove them. You might have to add some defender exceptions.

In case the application launches (i.e. you can see its icon in the Taskbar) but is not visible, it might be that the overlay appears outside your screen (e.g. in case you used multiple monitors and unplugged one of them). Check if the settings seem correct (the file will most likely be located in *C:\Users\xxx\AppData\Local\RTS_Overlay\xxx\settings\xxx_settings.json*). For instance, the location of the overlay upper corners are saved in the settings `layout > upper_right_position` (for `overlay_on_right_side` set to `True`) and `layout > upper_left_position` (for `overlay_on_right_side` set to `False`).

On Linux, if the overlay does not stay on top of other applications, use `Alt+Space` to bring out the titlebar menu for non-GTK applications in Gnome, then just press "Always on top".
It was successfully tested on Linux with X11.

If the aforementioned tips are not enough, you might try to run the application from sources (using Python).
This is documented in the [Python configuration](#python-configuration) section (and should not be difficult, even without Python knowledge).


# Additional notes
**RTS Overlay** is not associated with the developers/publishers of the aforementioned games.

For Blizzard-Microsoft games, **RTS Overlay** was created under Microsoft's "[Game Content Usage Rules](https://www.xbox.com/en-us/developers/rules)" using assets from the corresponding games, and it is not endorsed by or affiliated with Microsoft.
