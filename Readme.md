Presentation
============
The **RTS Overlay** is a tool used to display build orders and match data (if available), related to Real-Time Strategy (RTS) games.

![RTS Overlay](/pictures/common/icon/salamander_sword_shield.png)

At the moment, the following games are supported:

* [Age of Empires II Definitive Edition](https://www.ageofempires.com/games/aoeiide/)
    * Design, select and display build orders.
    * Download any build order from [buildorderguide.com](https://buildorderguide.com) (click on *Copy to clipboard for RTS Overlay*).
    * Show match data with the player main statistics.
    * [DOWNLOAD HERE](https://github.com/CraftySalamander/RTS_Overlay/releases/download/1.5.3/aoe2_overlay.zip) (Windows only) or run the program with python scripts (see **Python configuration** section).
    * See YouTube demo [here](https://youtu.be/hC7FMA6zgYo).

[![AoE2 build order in action](/pictures/common/readme/aoe2_build_order_demo.png)](https://youtu.be/hC7FMA6zgYo)

* [Age of Empires IV](https://www.ageofempires.com/games/age-of-empires-iv/)
    * Design, select and display build orders.
    * Download any build order from [age4builder.com](https://age4builder.com) (click on the salamander icon) or from [aoe4guides.com](https://aoe4guides.com) (click on *Overlay Tool*).
    * Show match data with the player main statistics.
    * [DOWNLOAD HERE](https://github.com/CraftySalamander/RTS_Overlay/releases/download/1.5.3/aoe4_overlay.zip) (Windows only) or run the program with python scripts.
    * See YouTube demo [here](https://youtu.be/RmsofE58YEg) (the more detailed [AoE2 video](https://youtu.be/hC7FMA6zgYo) is also relevant for AoE4).

[![AoE4 build order in action](/pictures/common/readme/aoe4_build_order_demo.png)](https://youtu.be/RmsofE58YEg)

* [StarCraft II](https://starcraft2.com)
    * Design, select and display build orders.
    * Download build orders from [Spawning Tool](https://lotv.spawningtool.com) (instructions in RTS Overlay tool).
    * [DOWNLOAD HERE](https://github.com/CraftySalamander/RTS_Overlay/releases/download/1.5.0/sc2_overlay.zip) (Windows only) or run the program with python scripts.
    * The [AoE2 video](https://youtu.be/hC7FMA6zgYo) is also relevant for SC2.

![SC2 build order in action](/pictures/common/readme/sc2_build_order_demo.png)

Use the standalone library (release version)
============================================

Download the zip folder of the requested game (see above).
Unzip it in any location on your computer (ideally in a location where no special computer rights are requested).
To launch the program, simply launch the executable of the requested game (all these executables are located at the root, see specific details for each game).

To update the library to a new release, just delete the old folder and replace it with the new release.
Note that your settings and build orders are saved in the user data directory (e.g. *C:\Users\XXXXX\AppData\Local\RTS_Overlay*). So, updating to a new release should not remove your old settings, nor your build orders.
In case you want to use a local configuration folder, create a folder called *"local_config"* at the root of the main folder (i.e. next to the *"pictures"* folder). The configuration (and build orders) will be saved there. 

On some computers, you might need to allow the access to the executable or the whole folder. In particular, if you see "cannot proceed because python38.dll was not found", you must unblock the zip folder before extracting it (right click on the zip folder, select properties and then select "unblock").


Configuration panel
===================

When you launch the executable, you first see the *Configuration panel*.
It is used to configure the layout, the build order and your username (to fetch match data, if available).

![Configuration panel](/pictures/common/readme/aoe2_panel_configuration.png)

Buttons of the first row
------------------------

The first row contains the following action buttons (from left to right):

* [Quit application](pictures/common/action_button/leave.png): Quit the tool.
* [Save settings](pictures/common/action_button/save.png): Save the configuration in a settings file (e.g. *aoe2_settings.py*).
* [Load settings](pictures/common/action_button/load.png): Load the settings of the aforementioned file (this file is automatically loaded at launch).
* [Configure hotkeys](pictures/common/action_button/gears.png): Configure the hotkeys (using keyboard and/or mouse inputs) and open the folder where the corresponding settings are saved. The following hotkeys are global in the sense that they can be used even when you do not have the focus on the overlay (typically while playing the game):
    * *next_panel*: cycle through the next panel
    * *show_hide*: show/hide the application
    * *build_order_previous_step*: go to the previous build order step (see below)
    * *build_order_next_step*: go to the next build order step (see below)
* [Add build order](pictures/common/action_button/feather.png): Add a build order (write it or copy it from a dedicated website) and open the folder where the build orders are stored. If a website can generate build orders with the correct format, a button will be available to reach this website.
* Choose the font size of the text police.
* Choose the scaling of the layout (images, spacing...).
    * When using a 4K display, you can for instance set this value to *200 %*.
* [Next panel](pictures/common/action_button/to_end.png): go to the Next panel (cycling through *Configuration*, *Build Order* and *Match Data*).

You can move the window with drag and drop, using the left click. Because the window will be resized depending on its content, what matters is only the upper right corner position. This upper right position will be maintained (and saved in the settings file using the [Save settings](pictures/common/action_button/save.png) button).

The overlay window should stay on top of your other applications (game included). Sometimes, it might not work properly at launch, but clicking a single time on [Next panel](pictures/common/action_button/to_end.png) should solve the issue.

More options are available in this settings file (police font, size of the images...). Click on [Configure hotkeys](pictures/common/action_button/gears.png), then on `Open settings folder` to find it. You can edit it (JSON format) with any text editor and reload it (using the [Load settings](pictures/common/action_button/load.png) button or by quitting and relaunching the application).


Build order selection
---------------------

Below, you find the **Build Order** search bar. To choose the build order to display, start by typing a few keywords. A list of up to 10 corresponding build orders appear. This is performed using a fuzzy search. Alternatively, you can deactivate this fuzzy search (or tune it) in the aforementioned settings file (JSON format) with the `bo_list_fuzz_search` flag. When set to False, all the keywords separated by spaces must appear in the selected build orders names. Finally, if you only type a single space character, the first 10 build orders will appear. Most games have a filtering option to select your faction or a generic build order (and potentially the one of your opponent).

Press *Enter* to select the build order appearing in bold. By default, the one selected is the first of the list, but you can use *Tab* to select another one. Another solution is to click with the mouse on the requested build order.

Username
--------

Next to this **Build order** search bar, you can find the **Username** search bar (for the compatible games). Simply input your username (profile ID and Steam ID are sometimes also valid) and press *Enter*. In contrast to the build order, this choice is saved in the settings file (if you click on [Save settings](pictures/common/action_button/save.png)).


Build Order panel
=================

After clicking on the [Next panel](pictures/common/action_button/to_end.png) button, the *Build Order panel* appears. It displays one step of the build order selected on the *Configuration panel*.

![Build Order panel](/pictures/common/readme/aoe2_panel_build_order.png)

Using the build order panel
---------------------------

In contrast to the *Configuration* tab, you cannot click on this window (allowing to still click on the game behind it), except on the buttons of the first row.

Close to the [Next panel](pictures/common/action_button/to_end.png) button (which will bring you to the Match Data panel), you can only select the step of the build order, using the two [arrow buttons](pictures/common/action_button/previous.png). The current step of the build order is indicated on the left. You can also use the aforementioned hotkeys to change the build order step, even when you do not have the focus on the overlay.

The build order typically indicates the number of workers to assign to each resource, the total number of workers (targets to reach at the end of this step) and some notes.
When applicable, the age to reach, the time and/or the number of builders are also indicated.
Also, on some build orders, it is possible to hover the mouse over some resources to get a tooltip with extra information (e.g. how to allocate the workers on different resources sub-types).

Designing a build order
-----------------------

When available, the easiest way to design a build order is through a dedicated website which can output the build orders in correct format (e.g. [buildorderguide.com](https://buildorderguide.com)). On top of that, many existing build orders can be found on these websites.

Otherwise, to write yourself a build order, copy a template provided in the [build_orders](build_orders) folder, and configure it as follows:

* The *"name"* field is used to select your build order using the corresponding search bar (in the *Configuration panel*).
* The *"author"* and *"source"* fields describe the origin of the build order, but do not affect the application.
* The *"build_order"* field contains the different steps of the build order.
    * *"notes"*: Extra notes indicating what to do.
        * You can replace words by images located in the [pictures](pictures) folder.
            * Write the name of the picture, with its path relative to the game folder ([pictures/aoe2/](pictures/aoe2/) for AoE2) between `@` markers.
    * *"time"*: Optional field (for each step) where you can add a target time indicated as a string.
    * The other items of *"build_order"* are dependent on the game.


Match Data panel
================

To display the *Match Data* panel, click on the [Next panel](pictures/common/action_button/to_end.png) button from the *Build Order* panel. It will indicate match statistics related to the last match you played (assuming you correctly inputed your username in the *Configuration panel*).
If the website used to fetch this data updates the statistics during the match, you will get the information about the match being currently played. Thus, you should get the information shortly after starting the match.

![Match Data panel](/pictures/common/readme/aoe2_panel_match_data.png)

Similarly to the *Build Order* tab, you cannot click on this window, except on the upper right button ([Next panel](pictures/common/action_button/to_end.png) to go to the *Configuration panel*).

The Match Data can take a bit of time to be updated. Its content is dependent on the game being played.

This is not available for all games, or when some specific options are deactivated (see below, for each game).


Age of Empires II Definitive Edition (AoE2)
===========================================

Launch one of these two executables: *aoe2_overlay.exe* or *aoe2_overlay_console_output.exe*. They are identical except that the second one opens an additional window to display the console output (and so is better suited in case there is an issue to check).

Designing/downloading a build order
-----------------------------------

Most of the information is provided in the **Build Order panel** section. Here is the additional information relative to AoE2 (adaptations for the other games are available in their corresponding sections).

You can download build orders from [buildorderguide.com](https://buildorderguide.com) by clicking on *Copy to clipboard for RTS Overlay* on any build order.

Otherwise, here are the instructions to manually design a build order (JSON format).
* Add a *"civilization"* field: The selected civilization (to choose among the ones of [aoe2/aoe2_civ_icon.py](aoe2/aoe2_civ_icon.py)).
    * You can add a single civilization or put several in an array (e.g. ["Aztecs", "Incas", "Mayans"]).
    * You can also set it as *"Any"* if the build order is generic and works for any (or most) civilization.

Each step of the *"build_order"* field must contain (on top of the aforementioned *"notes"*):
* *"villager_count"*: The total count of villagers to reach at the end of this step, negative if irrelevant.
* *"age"*: The age to reach at the end of this step (1: *Dark*, 2: *Feudal*, 3: *Castle*, 4: *Imperial*), negative if irrelevant.
* *"resources"*: The number of villagers to assign to each resource by the end of this step, negative if irrelevant.
    * The required fields are `"food"`, `"wood"`, `"gold"` and `"stone"`. The field `"builder` can be added as an optional 5th resource to indicate the number of builders to add.
    * Instead of writing a single value per resource, it is possible to write a dictionary like `{name_1: value_1, name_2: value_2}` where `name_x` is any string or an image in [build_orders/aoe2](build_orders/aoe2) and `value_x` is an integer.

Match Data panel
----------------

This is the content of the columns (from left to right):

* Player ID and color.
* Player civilization.
* Map being played and player name.
* Elo:
    * If single column labelled *Elo*: Elo of the current game type.
    * Otherwise, two columns corresponding to the single player and team games Elo scores (of the current game type).
* Rank for the current game type.
* Winrate for the current game type.
* Count of wins for the current game type.
* Count of losses for the current game type.
* National flag of the player.

Note that you can activate/deactivate this panel with the *"fetch_match_data"* field in the settings file (you must restart the overlay to take it into account). The accepted values are *'aoe2.net'* or *''* (to deactivate it).


Age of Empires IV (AoE4)
========================

Launch one of these two executables: *aoe4_overlay.exe* or *aoe4_overlay_console_output.exe*. They are identical except that the second one opens an additional window to display the console output (and so is better suited in case there is an issue to check).

This overlay is similar to the AoE2 overlay, except:
* Each build order step indicates the number of villagers and the population space expected (only number of villagers in AoE2).
* You can download compatible build orders from [age4builder.com](https://age4builder.com) by clicking on the salamander icon on any build order, or from [aoe4guides.com](https://aoe4guides.com) by clicking on *Overlay Tool* on any build order.
    * Read additional instructions in the [Add build order panel](pictures/common/action_button/feather.png).
* To design a build order manually:
    * You must also specify the civilization (*"civilization"* to choose among the ones of [aoe4/aoe4_civ_icon.py](aoe4/aoe4_civ_icon.py)).
        * You can add a single civilization or put several in an array (e.g. ["English", "Chinese"]).
    * You must also specify the population count in the "population_count" field of each step.
        * Use -1 if it is irrelevant for this step of the build order.
* In the *Match Data panel*:
    * The icon of your ranking class (e.g. *Gold II*) is indicated for ranked games.
    * The player ID and colors are currently not available.


StarCraft II (SC2)
==================

Launch one of these two executables: *sc2_overlay.exe* or *sc2_overlay_console_output.exe*. They are identical except that the second one opens an additional window to display the console output (and so is better suited in case there is an issue to check).

This overlay is similar to the AoE2 overlay, except:
* No match data is available (and so no *Match Data* panel).
* You must specify both your race and the one of your opponent (generic is an option for your opponent).
* You can copy any build order from [Spawning Tool](https://lotv.spawningtool.com).
    * Read additional instructions in the [Add build order panel](pictures/common/action_button/feather.png).
* Except the initial information of a build order (*race*, *opponent race*, *name*, *patch*, *author* and *source*), only *notes* can be added to any step of the build order.
    * These notes contain:
        * *"supply"*: the population supply.
        * *"time"*: the expected timing.
        * *"note"*: the note with the instructions (similar to the other games).
    * See folder [build_orders/sc2](build_orders/sc2/) for samples.


Python configuration
====================

If you want to run the application without the standalone version (or you want to adapt it), use the following manual.

Install a Python [Conda](https://docs.conda.io/en/latest/) environment, for instance with [Mamba](https://github.com/conda-forge/miniforge#mambaforge).

Create an environment:

```
conda create --name rts_overlay python=3.8
conda activate rts_overlay

conda install -c anaconda pyqt // main library (PyQt5)
pip install keyboard // global hotkeys (without focus on window)
pip install mouse // global mouse buttons (without focus on window)

// build order fuzzy search
pip install thefuzz
conda install python-Levenshtein

// match data
pip install requests // url requests

// only needed to prepare the standalone library
pip install Nuitka
pip install orderedset
```

You can also use the [requirements.txt](requirements.txt) file.

To run the application with python, simply run `python aoe2_overlay.py` (for AoE2, similar for other games).

The command `python prepare_release.py` will create the standalone libraries of all games, and prepare additional files for the releases.

On Linux, if the overlay does not stay on top of other applications, use `Alt+Space` to bring out the titlebar menu for non-GTK applications in Gnome, then just press "Always on top".
It was successfully tested on Linux with X11.
