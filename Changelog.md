## [2.5.0] - 2025.05.07
* Web overlay
    * Web overlay visual editor added.
* AoE2
    * Added new images for update 141935.
    * Three Kingdoms DLC update (new civs, new images).
* AoE4
    * Update most images.

## [2.4.0] - 2025.04.08
* AoE4
    * Updated with Season 10 content (mainly 'House of Lancaster' and 'Knights Templar' factions).
* Python
    * Check sub-faction folder only contains a single faction.

## [2.3.0] - 2025.03.05
* AOM
    * Add Chinese faction.

## [2.2.0] - 2024.11.15
* Web overlay
    * Display the full BO in a single panel on a new page.
    * Adding `gameID=xxx` at the end of the url will open the overlay with the corresponding game instead of the default AoE2.
    * AoE4
        * The aoe4guides.com BOs can be directly fetched through the RTS Overlay URL.

## [2.1.0] - 2024.09.24
* First release of Age of Mythology (AoM).
* Python
    * Generic function to display the BO design instructions.
* AoE4
    * Update images.

## [2.0.0] - 2024.08.21
* New project folders structure.
* Web overlay
    * First release.
* Python overlay
    * Indication added in the BO search line (keywords or space).
    * BO timer deactivated when designing a BO.
    * Add a hide panel button.
    * Timer hotkeys not available when hidden window.
    * BO checking using generic function (like web overlay).
    * Correct mouse extra button issue (for pynput).
    * AoE2
        * Bengalis time evalutation affected by the 2 villagers bonus.

## [1.9.2] - 2024.07.09
* Replace "mouse" with "pynput" implementation (solving Linux issue).

## [1.9.1] - 2024.03.17
* Option to keep the BO writer and hotkeys configuration always on top.
* Add hotkeys to only start OR stop the BO timing run.
* BO writer panel
    * Switch to build order panel when opening the BO writer panel.
    * Button to display the BO being built.
    * Add BO step using resources from previous step if available.
    * Focus on the end of the BO when formatting or adding a step.
    * Check if BO is valid for timing and display it.
* AoE2
    * Do not copy sample BOs at creation (outdated BOs).
* AoE2 & AoE4
    * Build order timing evaluation function.
    * Build order timing feature available (like SC2).
    * Remove tooltip feature (generating issues with BO panel).

## [1.9.0] - 2024.02.11
* SC2
    * Timer feature added.
    * BOs format updated (similar to AoE format).

## [1.8.0] - 2023.12.30
* Build order writer helper added (template, format, factions/images selection).
* Code refactoring (more code in common section).

## [1.7.1] - 2023.11.17
* AoE4
    * Add Season 6 content (6 new civilizations).

## [1.7.0] - 2023.11.17
* Remove game match statisics feature.
    * Generating issues.
    * Not working in AoE2, already available in AoE4 Overlay.
* Reduce images size.
* Do not include readme images in releases.
* Only non-console version generated in releases.

## [1.6.3] - 2023.11.14
* Back from PySide6 to PyQt5.

## [1.6.2] - 2023.11.12
* Correct bug with screen size check using PySide6.

## [1.6.1] - 2023.10.31
* Correct bug preventing BO panel from appearing.

## [1.6.0] - 2023.10.30
* Update from PyQt5 to PySide6.
* Adapt `prepare_release.py` for new version of Nuitka.
* Adapt Readme for Python installation.
* AoE4
    * Add 3 letters to civilization name.
    * Update aoe4world requests for match type name.

## [1.5.4] - 2023.10.18
* AoE2
    * Armenians and Georgians added (civ emblems + unique units + mule cart + fortified church).

## [1.5.3] - 2023.08.18
* AoE2
    * Last match 'leaderboard_id' safety added for aoe2.net.
* AoE4
    * Images updated to align with aoe4guides.com.

## [1.5.2] - 2023.06.02
* AoE2
    * Romans added (civ emblem + unique units).
    * Dromon picture added.
    * aoe2.net: add safety for unknown map name.
* AoE4
    * Added pictures from aoe4-guides for Season 5.

## [1.5.1] - 2023.04.30
* Time only indicated if not set to empty.
* AoE2
    * Remove indian civ icon from selection.
    * Civ selection using 3 letters.
    * Remove Lithuanians 3 min drush BO (obsolete with new patch).
    * Gambesons picture added.
    * Add website link (and instructions) to buildorderguide.com.
* AoE4
    * Add website link (and instructions) to aoe4guides.com.
    * Add missing AoE4 pictures.

## [1.5.0] - 2023.03.22
* SC2
    * StarCraft 2 RTS Overlay first release.
* AoE2
    * Add new indian civs for match data icons.
    * Civilization filter available.
        * Note: BOs can be updated by adding `"civilization": "Any"` (or a specific civilization), but still works with old BO format.
* Adding `local_config` at the root of a folder allows to use it as a local configuration folder.
* Improving the build orders validity check.

## [1.4.3] - 2022.12.20
* AoE2
    * aoe2.net is back. The API was updated accordingly.
    * aoe2insights.com calls removed.

## [1.4.2] - 2022.11.01
* Keyboard and mouse hotkeys:
    * 'Esc' can be used to cancel a hotkey configuration.
    * Keyboard and mouse can be used as a combined hotkey (e.g. Ctrl+extra button 1).
    * Mouse inputs can be configured in the hotkeys panel.
* AoE4
    * Malians and Ottomans added.
    * Updated for Season 3 (naval units...).
    * Correct bug related to build orders with the same name.

## [1.4.1] - 2022.10.18
* Mouse keys can be used instead of hotkeys.
* AoE2
    * The website https://www.aoe2insights.com can be used to get the match data, instead of https://aoe2.net (currently down).
    * The match data panel can be disabled, or set to use either https://www.aoe2insights.com or https://aoe2.net.

## [1.4.0] - 2022.10.02
* Hotkeys can be updated by reloading the settings.
* Hotkeys can be configured with a dedicated panel, without going in the settings file.
* Build orders can be added in a dedicated panel, without having to create a file manually.
* Builders can be indicated in the resources (optional).
* Settings and build orders are saved in user folder.

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
