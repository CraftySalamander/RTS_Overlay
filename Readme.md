Presentation
============
The **RTS Overlay** is a tool used to design and display build orders, related to Real-Time Strategy (RTS) games.

![RTS Overlay](/pictures/common/icon/salamander_sword_shield.png)

At the moment, the following games are supported:

* [Age of Empires II Definitive Edition](https://www.ageofempires.com/games/aoeiide/)
    * Design, select and display build orders.
    * Download any build order from [buildorderguide.com](https://buildorderguide.com) (click on *Copy to clipboard for RTS Overlay*).
    * [DOWNLOAD HERE](https://github.com/CraftySalamander/RTS_Overlay/releases/download/1.9.1/aoe2_overlay.zip) (Windows only) or run the program with python scripts (see **Python configuration** section).
    * See YouTube demo [here](https://youtu.be/qFBkpTnRzWQ).

[![AoE2 build order in action](/pictures/readme/aoe2_build_order_demo.png)](https://youtu.be/qFBkpTnRzWQ)

* [Age of Empires IV](https://www.ageofempires.com/games/age-of-empires-iv/)
    * Design, select and display build orders.
    * Download any build order from [aoe4guides.com](https://aoe4guides.com) (click on *Overlay Tool*) or from [age4builder.com](https://age4builder.com) (click on the salamander icon).
    * [DOWNLOAD HERE](https://github.com/CraftySalamander/RTS_Overlay/releases/download/1.9.1/aoe4_overlay.zip) (Windows only) or run the program with python scripts (see **Python configuration** section).
    * See YouTube demo [here](https://youtu.be/RmsofE58YEg) (the more detailed [AoE2 video](https://youtu.be/qFBkpTnRzWQ) is also relevant for AoE4).

[![AoE4 build order in action](/pictures/readme/aoe4_build_order_demo.png)](https://youtu.be/RmsofE58YEg)

* [StarCraft II](https://starcraft2.com)
    * Design, select and display build orders (manual update or using a timer).
    * Download build orders from [Spawning Tool](https://lotv.spawningtool.com) (instructions in RTS Overlay tool).
    * [DOWNLOAD HERE](https://github.com/CraftySalamander/RTS_Overlay/releases/download/1.9.1/sc2_overlay.zip) (Windows only) or run the program with python scripts (see **Python configuration** section).
    * The [AoE2 video](https://youtu.be/qFBkpTnRzWQ) is also relevant for SC2.

![SC2 build order in action](/pictures/readme/sc2_build_order_demo.png)

Use the standalone library (release version)
============================================

Download the zip folder of the requested game (see above).
On some computers, you might need to unblock the zip folder before extracting it (right click on the zip folder, select properties and then select "unblock").
Unzip it in any location on your computer (ideally in a location where no special computer rights are requested).
To launch the program, simply launch the executable of the requested game (all these executables are located at the root, see specific details for each game).

To update the library to a new release, just delete the old folder and replace it with the new release.
Note that your settings and build orders are saved in the user data directory (e.g. *C:\Users\XXXXX\AppData\Local\RTS_Overlay*). So, updating to a new release should not remove your old settings, nor your build orders.
In case you want to use a local configuration folder, create a folder called *"local_config"* at the root of the main folder (i.e. next to the *"pictures"* folder). The configuration (and build orders) will be saved there.

If you encounter issues, have a look at the **Troubleshooting** section.


Configuration panel
===================

When you launch the executable, you first see the *Configuration panel*.
It is used to configure the layout and the build order.

![Configuration panel](/pictures/readme/aoe2_panel_configuration.png)

Buttons of the first row
------------------------

The first row contains the following action buttons (from left to right):

* [Quit application](pictures/common/action_button/leave.png): Quit the tool.
* [Save settings](pictures/common/action_button/save.png): Save the configuration in a settings file (e.g. *aoe2_settings.py*).
* [Load settings](pictures/common/action_button/load.png): Load the settings of the aforementioned file (this file is automatically loaded at launch).
* [Configure hotkeys](pictures/common/action_button/gears.png): Configure the hotkeys (using keyboard and/or mouse inputs) and open the folder where the corresponding settings are saved. The following hotkeys are global in the sense that they can be used even when you do not have the focus on the overlay (typically while playing the game):
    * *next_panel*: cycle through the next panel
    * *show_hide*: show/hide the application
    * *build_order_previous_step*: go to the previous build order step, or update the timer to -1 sec (see below)
    * *build_order_next_step*: go to the next build order step, or update the timer to +1 sec (see below)
    * *switch_timer_manual*: swicth between manual and timer-based transitions (see below)
    * *start_timer*: start the timer
    * *stop_timer*: stop the timer
    * *start_stop_timer*: start or stop the timer
    * *reset_timer*: reset the timer to *0:00*
* [Add build order](pictures/common/action_button/feather.png): Add a build order (write it using widgets or copy it from a dedicated website) and open the folder where the build orders are stored. If a website can generate build orders with the correct format, a button will be available to reach this website.
* Choose the font size of the text police.
* Choose the scaling of the layout (images, spacing...).
    * When using a 4K display, you can for instance set this value to *200 %*.
* [Next panel](pictures/common/action_button/to_end.png): go to the Next panel (cycling between *Configuration* and *Build Order*).

You can move the window with drag and drop, using the left click. Because the window will be resized depending on its content, what matters is only the upper right corner position. This upper right position will be maintained (and saved in the settings file using the [Save settings](pictures/common/action_button/save.png) button).

The overlay window should stay on top of your other applications (game included). Sometimes, it might not work properly at launch, but clicking a single time on [Next panel](pictures/common/action_button/to_end.png) should solve the issue.

More options are available in this settings file (police font, size of the images...). Click on [Configure hotkeys](pictures/common/action_button/gears.png), then on `Open settings folder` to find it. You can edit it (JSON format) with any text editor and reload it (using the [Load settings](pictures/common/action_button/load.png) button or by quitting and relaunching the application).


Build order selection
---------------------

Below, you find the **Build Order** search bar. To choose the build order to display, start by typing a few keywords. A list of up to 10 corresponding build orders appear. This is performed using a fuzzy search. Alternatively, you can deactivate this fuzzy search (or tune it) in the aforementioned settings file (JSON format) with the `bo_list_fuzz_search` flag. When set to False, all the keywords separated by spaces must appear in the selected build orders names. Finally, if you only type a single space character, the first 10 build orders will appear. The overlay has a filtering option to select your faction or a generic build order (and potentially the one of your opponent).

Press *Enter* to select the build order appearing in bold. By default, the one selected is the first of the list, but you can use *Tab* to select another one. Another solution is to click with the mouse on the requested build order.


Build Order panel
=================

After clicking on the [Next panel](pictures/common/action_button/to_end.png) button, the *Build Order panel* appears. It displays one step of the build order selected on the *Configuration panel*.

![Build Order panel](/pictures/readme/aoe2_panel_build_order.png)

Using the build order panel
---------------------------

In contrast to the *Configuration* tab, you cannot click on this window (allowing to still click on the game behind it), except on the buttons of the first row.

Close to the [Next panel](pictures/common/action_button/to_end.png) button (which will bring you to the Configuration panel), you can select the step of the build order, using the two [arrow buttons](pictures/common/action_button/previous.png). The current step of the build order is indicated on the left. You can also use the aforementioned hotkeys to change the build order step, even when you do not have the focus on the overlay.

In case the timer update feature is available and is compatible with the current build order, the [feather/hourglass button](pictures/common/action_button/manual_timer_switch.png) will appear. When clicking on it, the build order update will use timing instructions. To stop/run, click on the [corresponding button](pictures/common/action_button/start_stop.png). The [arrow buttons](pictures/common/action_button/previous.png) now updates the timer by 1 second, while the [reset button](pictures/common/action_button/timer_0.png) with set the timer to *0:00*. When running, the current instruction is highlighted, while the previous and next ones are also shown. Hotkeys are also available for all these actions (see above).

The build order typically indicates the number of workers to assign to each resource, the total number of workers/supply and some notes.
When applicable, the age to reach, the time and/or the number of builders are also indicated.

Designing a build order
-----------------------

When available, the easiest way to design a build order is through a dedicated website which can output the build orders in correct format (e.g. [buildorderguide.com](https://buildorderguide.com) for AoE2). On top of that, many existing build orders can be found on these websites.

Alternatively, you can write it in the [Add build order](pictures/common/action_button/feather.png) panel. A few helper buttons allow you to automatically get a basic template, format it, display it and select images by clicking on them. For some games, it is also possible to evaluate the time for each step (to be used with the timer feature).
See the full instuctions on the corresponding panel.
You can also copy and adapt a sample provided in the [build_orders](build_orders) folder.

Here are the main fields of any build order:

* The *"name"* field is used to select your build order using the corresponding search bar (in the *Configuration panel*).
* The *"author"* and *"source"* fields describe the origin of the build order, but do not affect the application.
* The *"build_order"* field contains the different steps of the build order.
    * *"notes"*: Extra notes indicating what to do.
        * You can replace words by images located in the [pictures](pictures) folder.
            * Write the name of the picture, with its path relative to the game folder ([pictures/aoe2/](pictures/aoe2/) for AoE2) between `@` markers.
    * *"time"*: Optional field (for each step) where you can add a target time indicated as a string.
    * The other items of *"build_order"* are game dependent.


Age of Empires II Definitive Edition (AoE2)
===========================================

To run the application, launch *aoe2_overlay.exe*.

Designing/downloading a build order
-----------------------------------

Most of the information is provided in the **Build Order panel** section. Here is the additional information relative to AoE2 (adaptations for the other games are available in their corresponding sections).

You can download build orders from [buildorderguide.com](https://buildorderguide.com) by clicking on *Copy to clipboard for RTS Overlay* on any build order.

Otherwise, here are the instructions to manually design a build order (JSON format).
* Add a *"civilization"* field: The selected civilization (to choose among the ones of [aoe2/aoe2_civ_icon.py](aoe2/aoe2_civ_icon.py)).
    * You can add a single civilization or put several in an array (e.g. ["Aztecs", "Incas", "Mayans"]).
    * You can also set it as *"Any"*/*"Generic"* if the build order is generic and works for any (or most) civilization.

Each step of the *"build_order"* field must contain (on top of the aforementioned *"notes"*):
* *"villager_count"*: The total count of villagers to reach at the end of this step, negative if irrelevant.
* *"age"*: The age to reach at the end of this step (1: *Dark*, 2: *Feudal*, 3: *Castle*, 4: *Imperial*), negative if irrelevant.
* *"resources"*: The number of villagers to assign to each resource by the end of this step, negative if irrelevant.
    * The required fields are `"food"`, `"wood"`, `"gold"` and `"stone"`. The field `"builder` can be added as an optional 5th resource to indicate the number of builders to add.
    * Instead of writing a single value per resource, it is possible to write a dictionary like `{name_1: value_1, name_2: value_2}` where `name_x` is any string or an image in [build_orders/aoe2](build_orders/aoe2) and `value_x` is an integer.


Age of Empires IV (AoE4)
========================

To run the application, launch *aoe4_overlay.exe*.

This overlay is similar to the AoE2 overlay, except:
* Each build order step indicates the number of villagers and the population space expected (only number of villagers in AoE2).
* You can download compatible build orders from [aoe4guides.com](https://aoe4guides.com) by clicking on `Overlay Tool` on any build order, or from [age4builder.com](https://age4builder.com) by clicking on the salamander icon on any build order.
    * Read additional instructions in the [Add build order panel](pictures/common/action_button/feather.png).
* To design a build order manually:
    * You must also specify the civilization (*"civilization"* to choose among the ones of [aoe4/aoe4_civ_icon.py](aoe4/aoe4_civ_icon.py)).
        * You can add a single civilization or put several in an array (e.g. ["English", "Chinese"]).
    * You must also specify the population count in the "population_count" field of each step.
        * Use -1 if it is irrelevant for this step of the build order.


StarCraft II (SC2)
==================

To run the application, launch *sc2_overlay.exe*.

This overlay is similar to the AoE2 overlay, except:
* You must specify both your race and the one of your opponent ("Any" is an option for your opponent).
* You can copy any build order from [Spawning Tool](https://lotv.spawningtool.com).
    * Read additional instructions in the [Add build order panel](pictures/common/action_button/feather.png).
* Except the initial information of a build order (*race*, *opponent race*, *name*, *patch*, *author* and *source*), you need to fill each step of the build order containing *notes* (compulsory) and the following optional fiels: *time*, *supply*, *minerals* & *vespene_gas*.
    * See folder [build_orders/sc2](build_orders/sc2/) for samples.


Python configuration
====================

You can run the program from source using Python.

1. If you do not yet have a Python environment, you can download and install a Python distribution with conda package manager using the [Anaconda installer](https://www.anaconda.com/download) (other distributions can also work like [Miniforge](https://github.com/conda-forge/miniforge#miniforge3)).
Optionnaly, you can add the program (e.g. Anaconda3) to your PATH environment variable (to run it from any terminal).
2. Download the code of RTS Overlay: click on the *Code* button (on top of [this page](https://github.com/CraftySalamander/RTS_Overlay)), then on *Download ZIP*  and extract the ZIP folder (or clone it with [Git](https://git-scm.com/)).
3. Open *Anaconda Prompt*. If you added the python path to your PATH environment variable, you can open any terminal (e.g. *Command Prompt* on Windows).
4. Go to your extracted folder (e.g. `cd RTS_Overlay-master`).
5. Create the Conda environment: `conda create --name rts_overlay python=3.8`
6. Activate your environment: `conda activate rts_overlay`
7. Install the library requirements: `pip install -r requirements.txt`
8. Optionally, run `pip install python-Levenshtein==0.12.2` (for slightly faster performances).
9. Run the application: `python aoe2_overlay.py` (for AoE2, similar for other games).

Steps 3, 4, 6 and 9 must be re-done each time you want to launch the program.

In case you want to build the application as an *exe* program, the command `python prepare_release.py` will create the standalone libraries, and prepare additional files for the releases (you will need `pip install nuitka==1.0.6` and `pip install orderedset==2.0.3`).

Troubleshooting
===============

On some computers, you might need to allow the access to the executable or the whole folder. In particular, if you see "cannot proceed because python38.dll was not found", you must unblock the zip folder before extracting it (right click on the zip folder, select properties and then select "unblock").

Similarly, Windows (or your antivirus) might read *.exe* files as threats and remove them. You might have to add some defender exceptions.

In case the application launches (i.e. you can see its icon in the Taskbar) but is not visible, it might be that the overlay appears outside your screen (e.g. in case you used multiple monitors and unplugged one of them). Check if the settings seem correct (the file will most likely be located in *C:\Users\xxx\AppData\Local\RTS_Overlay\xxx\settings\xxx_settings.json*). For instance, the location of the overlay upper right corner is saved in the setting `layout > upper_right_position`.

If the aforementioned tips are not enough, you might try to run the application from sources (using Python).
This is documented in the **Python configuration** section (and should not be difficult, even without Python knowledge).

Finally, if none of these tips solve the issue, you can add an issue on GitHub (https://github.com/CraftySalamander/RTS_Overlay/issues) describing your problem (the more details, the better).
Always mention the version number (located in *version.json* at the root of the folder).

On Linux, if the overlay does not stay on top of other applications, use `Alt+Space` to bring out the titlebar menu for non-GTK applications in Gnome, then just press "Always on top".
It was successfully tested on Linux with X11.
