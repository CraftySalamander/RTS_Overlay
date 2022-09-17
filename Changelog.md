## [1.4.0] - in progress
* Hotkeys can be updated by reloading the settings.
* Hotkeys can be set with a dedicated panel, without going in the settings file.

## [1.3.4] - 2022.09.11
* Resource targets can be split between different resource subtypes, by hovering the mouse.
    * A tooltip appears on a separate window (if build order adapted for it).
* The search bar for the build order performs a fuzzy search to find the best build orders. 
* AoE2
    * Villagers and age only indicated if information available.
* AoE4
    * Villagers, population and age only indicated if information available.

## [1.3.3] - 2022.07.24
* AoE2
    * Add safety mechanisms and additional search for data fetch from https://aoe2.net.

## [1.3.2] - 2022.07.24
* Use requests library for url requests.
* Settings subclass usage for easier settings description.
* AoE2
    * Small modification for chinese_scouts_into_archers.json.
* AoE4
    * Correct build orders typos.
    * Use aoe4world.com to fetch match statistics.

## [1.3.1] - 2022.06.22
* Remove 'utf-8' to solve issues encountered on Linux with Python 10.

## [1.3.0] - 2022.06.14
* Using global hotkeys to change panel, show/hide overlay and select the build order step.
* Borders of the search boxes forced to white (to correct Windows 11 artifact).
* Add source files to the release versions.

## [1.2.0] - 2022.06.06
* Clicking on the build order name to select it.
* Time can be added in any step of a build order and appears next to resources.
* Numbers of BOs displayed up to 15 (from 10), for AoE2 and AoE4.

## [1.1.2] - 2022.06.05
* Safety added so that the overlay starts inside the screen.
* Settings saved at launch if no settings file existing.
* Numbers of BOs displayed up to 10 (from 5), for AoE2 and AoE4.

## [1.1.1] - 2022.06.05
* AoE4
    * HRE BO added : fast castle imperial
    * Chinese BO added:
        * song dynasty 2 town centers
        * song dynasty military

## [1.1.0] - 2022.05.31
* Possibility to have BOs with the same name, provided they have different key values.
    * Used to deal with BOs with the same name for different civilizations in AoE4.

## [1.0.1] - 2022.05.31
* AoE4
    * Delhi BO added : sacred sites horsemen archers
    * Mongols BO added: fast castle lancers
    * Rus BO added: feudal knights archers
    * Abbasid BO added: 2 town centers
    * Civilization flags pictures with space added.

## [1.0.0] - 2022.05.16
* First release.
