// -- Define parameters -- //

const SELECT_IMAGE_HEIGHT = 35;  // Height of BO (Build Order) design images.
const TITLE_IMAGE_HEIGHT = 70;   // Height of the 'RTS Overlay' title.
const INFO_IMAGE_HEIGHT = 30;  // Height of the RTS Overlay information button.
const FACTION_ICON_HEIGHT = 25;       // Height of faction selection icon.
const SALAMANDER_IMAGE_HEIGHT = 250;  // Height of the salamander image.
const SLEEP_TIME = 100;               // Sleep time to resize the window [ms].
const INTERVAL_CALL_TIME = 250;    // Time interval between regular calls [ms].
const SIZE_UPDATE_THRESHOLD = 5;   // Minimal thershold to update the size.
const MAX_ROW_SELECT_IMAGES = 16;  // Max number of images per row (BO design).
const DEFAULT_BO_PANEL_FONTSIZE = 1.0;    // Default font size for BO panel.
const DEFAULT_BO_PANEL_IMAGES_SIZE = 25;  // Default images size for BO panel.
// Height of the action buttons as a ratio of the images size for the BO panel.
const ACTION_BUTTON_HEIGHT_RATIO = 0.8;
// Default choice for overlay on right or left side of the screen.
const DEFAULT_OVERLAY_ON_RIGHT_SIDE = false;
const MAX_SEARCH_RESULTS = 10;  // Maximum number of search results to display.
// Max error ratio threshold on the Levenshtein similarity to accept the match.
const LEVENSHTEIN_RATIO_THRESHOLD = 0.5;

// Overlay panel keyboard shortcuts
// Hotkeys values can be found on the link below ('' to not use any hotkey).
// https://www.freecodecamp.org/news/javascript-keycode-list-keypress-event-key-codes/
const OVERLAY_KEYBOARD_SHORTCUTS = {
  'build_order_previous_step': 'ArrowLeft',  // Previous step / Timer -1 sec
  'build_order_next_step': 'ArrowRight',     // Next step / Timer +1 sec
  'switch_timer_manual': 'Tab',              // Switch BO timer/manual
  'start_timer': 'Space',                    // Start BO timer
  'stop_timer': 'Backspace',                 // Stop BO timer
  'start_stop_timer': 'Enter',               // Start/stop BO timer
  'reset_timer': 'Home'                      // Reset BO timer
};


// -- Application parameters -- //

// Links to external BO websites providing RTS Overlay format
// [website name, website address, instructions.]
const EXTERNAL_BO_WEBSITES = {
  'aoe2': [[
    'buildorderguide.com', 'https://buildorderguide.com/',
    'Click on \'Copy to clipboard for RTS Overlay\'.'
  ]],
  'aoe4': [
    [
      'aoe4guides.com', 'https://aoe4guides.com/',
      'Click on the 3 dots (upper right corner), then on the \'Overlay Tool\' copy button.'
    ],
    [
      'age4builder.com', 'https://age4builder.com/',
      'Click on the salamander icon.'
    ]
  ]
};

// Fields of the faction name: player and (optionally) opponent
const FACTION_FIELD_NAMES = {
  'aoe2': {'player': 'civilization', 'opponent': null},
  'aoe4': {'player': 'civilization', 'opponent': null},
  'aom': {'player': 'major_god', 'opponent': null},
  'sc2': {'player': 'race', 'opponent': 'opponent_race'}
};

// List of games where each step starts at the given time
// (step ending otherwise).
const TIMER_STEP_STARTING_FLAG = ['sc2'];
// Timer speed factor for specific games [-]
const TIMER_SPEED_FACTOR = {
  'aoe2': 1.608
};

// Special cases for the max number of images per row
// (MAX_ROW_SELECT_IMAGES otherwise).
const SPECIAL_MAX_ROW_SELECT_IMAGES = {
  'aoe4': {'select faction': 9, 'civilization_flag': 12}
};

// Image to display when the requested image can not be loaded
const ERROR_IMAGE = 'assets/common/icon/question_mark.png';


// -- Variables -- //

let gameName = 'aoe2';  // Name of the game (i.e. its picture folder)
let gameFullName = 'Age of Empires II';  // Full name of the game
let mainConfiguration = 'library';       // Main configuration mode
// Library with all the stored build orders for the current game
let library = {};
// List of valid keys from 'library' for the selected faction
let libraryValidKeys = [];
let selectedBOFromLibrary = null;  // Selected BO from library
let dataBO = null;                 // Data of the selected BO
let stepCount = -1;                // Number of steps of the current BO
let stepID = -1;                   // ID of the current BO step
let overlayWindow = null;          // Window for the overlay
let imagesGame = {};    // Dictionary with images available for the game.
let imagesCommon = {};  // Dictionary with images available from common folder.
let factionsList = {};  // List of factions with 3 letters and icon.
let factionImagesFolder = '';  // Folder where the faction images are located.
// Font size for the BO text
let bo_panel_font_size = DEFAULT_BO_PANEL_FONTSIZE;
// Height of the images in the Build Order (BO)
let imageHeightBO = DEFAULT_BO_PANEL_IMAGES_SIZE;
// Height of the action buttons.
let actionButtonHeight =
    ACTION_BUTTON_HEIGHT_RATIO * DEFAULT_BO_PANEL_IMAGES_SIZE;
// Overlay on right or left side of the screen.
let overlayOnRightSide = DEFAULT_OVERLAY_ON_RIGHT_SIDE;

// Build order timer elements
let buildOrderTimer = {
  'step_starting_flag': false,  // true if the timer steps starts at the
  // indicated time, false if ending at this time
  'use_timer':
      false,  // true to update BO with timer, false for manual selection
  'run_timer': false,  // true if the BO timer is running (false to stop)
  'absolute_time_init':
      0.0,             // last absolute time when the BO timer run started [sec]
  'time_sec': 0.0,     // time for the BO [sec]
  'time_int': 0,       // 'time_sec' with a cast to integer
  'last_time_int': 0,  // last value for 'time_int' [sec]
  'time_sec_init': 0.0,       // value of 'time_sec' when run started [sec]
  'last_time_label': '',      // last string value for the time label
  'steps': [],                // steps adapted for the timer feature
  'steps_ids': [],            // IDs to select the current steps from 'steps'
  'last_steps_ids': [],       // last value for 'steps_ids'
  'timer_speed_factor': -1.0  // speed factor to apply (if positive)
};


// -- Generic functions -- //

/**
 * Sleep for a few ms
 *
 * @param {int} time_ms  Time to sleep [ms].
 *
 * @returns Function to sleep the requested time.
 */
function sleep(time_ms) {
  return new Promise(resolve => setTimeout(resolve, time_ms));
}

/**
 * Get the current time.
 *
 * @returns Current time [s];
 */
function getCurrentTime() {
  const currentDate = new Date();
  return 1.0e-3 * currentDate.getTime();
}

/**
 * Limit a value in the [min ; max] range
 *
 * @param {*} value  Value to limit.
 * @param {*} min    Minimal bound.
 * @param {*} max    Maximal bound.
 *
 * @returns 'value' limited in the [min ; max] range.
 */
function limitValue(value, min, max) {
  return (value <= min) ? min : (value >= max ? max : value);
}

/**
 * Limit the step ID to valid values.
 */
function limitStepID() {
  if (stepCount < 1) {
    stepID = -1;
  } else {
    stepID = limitValue(stepID, 0, stepCount - 1);
  }
}

/**
 * Resize the overlay and move it to keep its top left/right corner
 * at the same position.
 */
function overlayResizeMove() {
  // Get current window width and height
  const currentWidth = window.outerWidth;
  const currentHeight = window.outerHeight;

  // Offset to take into account the window border
  const widthOffset = currentWidth - window.innerWidth;
  const heightOffset = currentHeight - window.innerHeight;

  // Compute the new requested size
  const boPanelOverlay = document.getElementById('bo_panel');
  const newWidth = boPanelOverlay.offsetWidth + widthOffset;
  const newHeight = boPanelOverlay.offsetHeight + heightOffset;

  // Check if width/height require a change
  const widthFlag = (newWidth > currentWidth) ||
      (newWidth < currentWidth - SIZE_UPDATE_THRESHOLD);
  const heightFlag = (newHeight > currentHeight) ||
      (newHeight < currentHeight - SIZE_UPDATE_THRESHOLD);

  // Apply modifications if at least one dimension requires an update
  if (widthFlag || heightFlag) {
    // Save upper right corner position
    const upperLeftX = window.screenLeft;
    const upperRightX = upperLeftX + currentWidth;
    const upperRightY = window.screenTop;

    // Resize the panel
    window.resizeTo(newWidth, newHeight);

    // Move the panel to keep one upper corner at same position as before
    if (overlayOnRightSide) {
      // Upper right corner at same position as before
      window.moveTo(upperRightX - newWidth, upperRightY);
    } else {
      // Upper left corner at same position as before
      window.moveTo(upperLeftX, upperRightY);
    }
  }
}

/**
 * Check font size, resize the overlay and move it to keep its top right corner
 * at the same position (after a short delay to wait for panel update).
 */
function overlayResizeMoveDelay() {
  sleep(SLEEP_TIME).then(() => {
    // Check font size
    const boPanelElement = document.getElementById('bo_panel');
    if (boPanelElement.style.fontSize !== bo_panel_font_size) {
      boPanelElement.style.fontSize = bo_panel_font_size;
    }

    // Resize and move the overlay
    overlayResizeMove();
  });
}

/**
 * Move to the previous BO step (configuration window).
 */
function previousStepConfig() {
  stepID--;
  limitStepID();
  updateBOPanel(false);
}

/**
 * Move to the next BO step (configuration window).
 */
function nextStepConfig() {
  stepID++;
  limitStepID();
  updateBOPanel(false);
}

/**
 * Move to the previous BO step (overlay window).
 */
function previousStepOverlay() {
  if (buildOrderTimer['use_timer']) {
    buildOrderTimer['time_sec'] -= 1.0;
    // Like the timer was started 1 sec later
    buildOrderTimer['absolute_time_init'] += 1.0;
    buildOrderTimer['time_int'] = Math.floor(buildOrderTimer['time_sec']);
  } else {
    stepID--;
    limitStepID();
  }
  updateBOPanel(true);
}

/**
 * Move to the next BO step (overlay window).
 */
function nextStepOverlay() {
  if (buildOrderTimer['use_timer']) {
    buildOrderTimer['time_sec'] += 1.0;
    // Like the timer was started 1 sec earlier
    buildOrderTimer['absolute_time_init'] -= 1.0;
    buildOrderTimer['time_int'] = Math.floor(buildOrderTimer['time_sec']);
  } else {
    stepID++;
    limitStepID();
  }
  updateBOPanel(true);
}

/**
 * Split a line based on the @ markers and remove first/last empty elements.
 *
 * @param {string} noteLine  Line corresponding to a note, to split.
 *
 * @returns Requested split line.
 */
function splitNoteLine(noteLine) {
  lineSplit = noteLine.split('@')

  if ((lineSplit.length > 0) && (lineSplit[0] === '')) {
    lineSplit.shift();  // Remove first element
  }
  if ((lineSplit.length > 0) && (lineSplit[-1] === '')) {
    lineSplit.pop();  // Remove last element
  }

  return lineSplit
}

/**
 * Get the path for an image.
 *
 * @param {string} imageSearch  Image to search, with extension and path
 *                              starting in 'common' or 'game' picture folder.
 *
 * @returns Image with its path, 'null' if not found.
 */
function getImagePath(imageSearch) {
  // Try first with the game folder
  for (const [subFolder, images] of Object.entries(imagesGame)) {
    for (let image of images) {
      if (imageSearch === subFolder + '/' + image) {
        return 'assets/' + gameName + '/' + imageSearch;
      }
    }
  }

  // Try then with the common folder
  for (const [subFolder, images] of Object.entries(imagesCommon)) {
    for (let image of images) {
      if (imageSearch === subFolder + '/' + image) {
        return 'assets/common' +
            '/' + imageSearch;
      }
    }
  }

  // not found
  return null;
}

/**
 * Get the HTML code to add an image.
 *
 * @param {string} imagePath     Image to display (with path and extension).
 * @param {int} imageHeight      Height of the image.
 * @param {string} functionName  Name of the function to call when clicking on
 *                               the image, null if no function to call.
 * @param {string} functionArgs  Arguments to use for the function,
 *                               null if no function or no argument.
 * @param {string} tooltipText   Text for the tooltip, null if no tooltip.
 * @param {string} imageID       ID of the image, null if no specific ID
 *
 * @returns Requested HTML code.
 */
function getImageHTML(
    imagePath, imageHeight, functionName = null, functionArgs = null,
    tooltipText = null, imageID = null) {
  let imageHTML = '';

  // Add tooltip
  if (tooltipText) {
    imageHTML += '<div class="tooltip">';
  }

  // Button with image
  if (functionName) {
    imageHTML += '<input type="image" src="' + imagePath + '"';
    imageHTML +=
        ' onerror="this.onerror=null; this.src=\'' + ERROR_IMAGE + '\'"';
    imageHTML += imageID ? ' id="' + imageID + '"' : '';
    imageHTML += ' height="' + imageHeight + '"';
    imageHTML += ' onclick="' + functionName +
        (functionArgs ? '(\'' + functionArgs.replaceAll('\'', '\\\'') + '\')"' :
                        '()"');
    imageHTML += '/>';
  }
  // Image (no button)
  else {
    imageHTML += '<img src="' + imagePath + '"';
    imageHTML +=
        ' onerror="this.onerror=null; this.src=\'' + ERROR_IMAGE + '\'"';
    imageHTML += imageID ? ' id="' + imageID + '"' : '';
    imageHTML += ' height="' + imageHeight + '">';
  }

  // Add tooltip
  if (tooltipText) {
    imageHTML += '<span class="tooltiptext_left">';
    imageHTML += '<div>' + tooltipText + '</div>';
    imageHTML += '</span></div>';
  }

  return imageHTML;
}

/**
 * Get the HTML code to add an image for the content of the BO.
 *
 * @param {string} imagePath  Image to display (with path and extension).
 *
 * @returns Requested HTML code.
 */
function getBOImageHTML(imagePath) {
  return getImageHTML(imagePath, imageHeightBO);
}

/**
 * Get the string for a resource.
 *
 * @param {int} resource  Resource to show.
 *
 * @returns Resource value or ' ' if negative.
 */
function getResourceString(resource) {
  return (resource >= 0) ? resource.toString() : ' ';
}

/**
 * Check if the requested value from 'getBOImageValue' is valid.
 *
 * @param {Object} container      Container with the requested item.
 * @param {string} name           Name of the item field in the container.
 * @param {boolean} positiveFlag  true to only output it when the item is
 *                                positive.
 *
 * @returns Requested HTML code.
 */
function isBOImageValid(container, name, positiveFlag = false) {
  return ((name in container) && (!positiveFlag || (container[name] >= 0)));
}

/**
 * Get an image and its value for the BO (typically resource value).
 *
 * @param {string} imagePath      Image to display (with path and extension).
 * @param {Object} container      Container with the requested item.
 * @param {string} name           Name of the item field in the container.
 * @param {boolean} positiveFlag  true to only output it when the item is
 *                                positive.
 *
 * @returns Requested HTML code.
 */
function getBOImageValue(imagePath, container, name, positiveFlag = false) {
  if (isBOImageValid(container, name, positiveFlag)) {
    return getBOImageHTML(imagePath) + getResourceString(container[name]);
  } else {
    return '';
  }
}

/**
 * Check if the BO is valid and updates the BO variables if not valid.
 *
 * @returns true if valid BO.
 */
function checkValidBO() {
  // Valid BO
  if (dataBO && (stepCount >= 1) && (stepID >= 0) && (stepID < stepCount)) {
    return true;
  }

  // Invalid BO
  updateInvalidDataBO();

  return false;
}

/**
 * Convert a note line to HTML with text and images.
 *
 * @param {string} note  Note line from a build order.
 *
 * @returns HTML code corresponding to the requested line, with text and images.
 */
function noteToTextImages(note) {
  let result = '';

  // Split note line between text and images
  const splitLine = splitNoteLine(note);
  const splitCount = splitLine.length;

  if (splitCount > 0) {
    // loop on the line parts
    for (let splitID = 0; splitID < splitCount; splitID++) {
      // Check if it is a valid image and get its path
      const imagePath = getImagePath(splitLine[splitID]);

      if (imagePath) {  // image
        result += getBOImageHTML(imagePath);
      } else {  // text
        result += splitLine[splitID];
      }
    }
  }

  return result;
}

/**
 * Get the content of the BO panel.
 *
 * @param {boolean} overlayFlag  true for overlay, false for
 *                               configuration window.
 * @param {int} BOStepID         Requested step ID for the BO.
 *
 * @returns String representing the HTML part of the BO panel.
 */
function getBOPanelContent(overlayFlag, BOStepID) {
  // Check if BO is valid
  if (!checkValidBO()) {
    return '<nobr><div class="bo_line">The build order is not valid.</div></nobr>';
  }

  // Prepare HTML content for the BO body
  let htmlString = '';

  // Folders with requested pictures
  const commonPicturesFolder = 'assets/common/';

  // Configuration from within the BO panel
  const justifyFlex =
      overlayOnRightSide ? 'justify_flex_end' : 'justify_flex_start';
  htmlString +=
      '<nobr><div class="bo_line bo_line_config ' + justifyFlex + '">';

  // true to use the timer, false for manual selection
  const timingFlag = buildOrderTimer['use_timer'];

  // Current step or time
  htmlString += '<div id="step_time_indication">';
  htmlString += timingFlag ? buildOrderTimer['last_time_label'] :
                             'Step: ' + (BOStepID + 1) + '/' + stepCount;
  htmlString += '</div>';

  // Previous or next step
  const stepFunctionSuffix = overlayFlag ? 'Overlay' : 'Config';

  htmlString += getImageHTML(
      commonPicturesFolder + 'action_button/previous.png', actionButtonHeight,
      'previousStep' + stepFunctionSuffix, null,
      timingFlag ? 'timer -1 sec' : 'previous BO step');
  htmlString += getImageHTML(
      commonPicturesFolder + 'action_button/next.png', actionButtonHeight,
      'nextStep' + stepFunctionSuffix, null,
      timingFlag ? 'timer +1 sec' : 'next BO step');

  // Update timer
  if (timingFlag) {
    htmlString += getImageHTML(
        commonPicturesFolder + 'action_button/' +
            (buildOrderTimer['run_timer'] ? 'start_stop_active.png' :
                                            'start_stop.png'),
        actionButtonHeight, 'startStopBuildOrderTimer', null,
        'start/stop the BO timer', 'start_stop_timer');
    htmlString += getImageHTML(
        commonPicturesFolder + 'action_button/timer_0.png', actionButtonHeight,
        'resetBuildOrderTimer', null, 'reset the BO timer');
  }

  // Switch between manual and timer
  if (overlayFlag && (buildOrderTimer['steps'].length > 0)) {
    htmlString += getImageHTML(
        commonPicturesFolder + 'action_button/manual_timer_switch.png',
        actionButtonHeight, 'switchBuildOrderTimerManual', null,
        'switch BO mode between timer and manual');
  }
  htmlString += '</div></nobr>';

  // Get selected steps and corresponding IDs
  const res = getBuildOrderSelectedStepsAndIDs(BOStepID);
  const selectedStepsIDs = res[0];
  const selectedSteps = res[1];

  // ID of the step to use to display the resources
  const resourceStep = selectedSteps[selectedStepsIDs.at(-1)];

  htmlString += '<div>';

  htmlString += '<nobr><div class="bo_line bo_line_resources">';

  htmlString += getResourceLine(resourceStep);

  if ('time' in resourceStep) {
    htmlString += getBOImageHTML(commonPicturesFolder + 'icon/time.png') +
        resourceStep.time;
  }
  htmlString += '</div></nobr>';

  // Line separating resources from notes
  htmlString += '<hr style="width:100%;text-align:left;margin-left:0"></div>';

  // Loop on the steps for notes
  selectedSteps.forEach(function(selectedStep, stepID) {
    // Check if emphasis must be added on the corresponding note
    const emphasisFlag =
        buildOrderTimer['run_timer'] && (selectedStepsIDs.includes(stepID));

    // Notes of the current BO step
    const notes = selectedStep.notes;
    const notesCount = notes.length;

    for (let noteID = 0; noteID < notesCount; noteID++) {
      const note = notes[noteID];  // current note line

      // Identify line for CSS properties
      htmlString += '<nobr><div class="bo_line bo_line_note ';
      if (emphasisFlag) {
        htmlString += 'bo_line_emphasis ';
      }
      if (noteID === 0) {
        htmlString += 'bo_line_note_first">';
      } else if (noteID === notesCount - 1) {
        htmlString += 'bo_line_note_last">';
      } else {
        htmlString += 'bo_line_note_middle">';
      }

      // Add timing indication
      if (timingFlag && ('time' in selectedStep)) {
        htmlString += '<div class="bo_line_note_timing">' +
            (noteID === 0 ? selectedStep.time : '') + '</div>';
      }

      // Convert note line to HTML with text and images
      htmlString += noteToTextImages(note);

      htmlString += '</div></nobr>';
    }
  });

  return htmlString;
}

/**
 * Update the BO data for invalid BO.
 */
function updateInvalidDataBO() {
  dataBO = null;
  buildOrderTimer['steps'] = [];
  stepCount = -1;
  stepID = -1;
}

/**
 * Show or hide the items depending on the BO validity, the game and
 * selected configuration.
 */
function showHideItems() {
  // List of items to show/hide.
  const libraryItems = [
    'from_library_text', 'bo_faction_selection', 'bo_search_results',
    'delete_bo_row', 'delete_current_bo'
  ];

  const websiteItems = ['external_bo_text', 'external_bo_webistes'];

  const designItems = [
    'design_bo_text', 'design_bo_row_main', 'image_category_line', 'image_copy',
    'images_bo_display'
  ];
  const designValidItems = ['add_bo_step', 'format_bo'];
  const designValidTimeItems = ['design_bo_row_time'];

  const saveItems = ['save_bo_text', 'save_row'];

  const displayItems =
      ['adapt_display_overlay', 'single_panel_page', 'diplay_overlay'];

  // Items corresponding to flex boxes
  const flexItems = [
    'bo_faction_selection', 'delete_bo_row', 'external_bo_webistes',
    'design_bo_row_main', 'design_bo_row_time', 'save_row'
  ];

  // Concatenation of all items
  const fullItems = libraryItems.concat(
      websiteItems, designItems, designValidItems, designValidTimeItems,
      saveItems, displayItems);

  // Loop on all the items
  for (const itemName of fullItems) {
    let showItem = false;

    // Check if the item can be shown
    if (displayItems.includes(itemName)) {
      showItem = dataBO !== null;
    } else {
      switch (mainConfiguration) {
        case 'library':
          if (libraryItems.includes(itemName)) {
            if (['bo_faction_selection', 'delete_bo_row'].includes(itemName)) {
              showItem = Object.keys(library).length !== 0;
            } else if (itemName === 'delete_current_bo') {
              showItem = selectedBOFromLibrary !== null;
            } else {
              showItem = true;
            }
          }
          break;

        case 'website':
          if (websiteItems.includes(itemName)) {
            showItem = true;
          } else if (saveItems.includes(itemName)) {
            showItem = dataBO !== null;
          }
          break;

        case 'design':
          if (designItems.includes(itemName)) {
            showItem = true;
          } else if (designValidItems.includes(itemName)) {
            showItem = dataBO !== null;
          } else if (designValidTimeItems.includes(itemName)) {
            showItem = (dataBO !== null) && isBOTimingEvaluationAvailable();
          } else if (saveItems.includes(itemName)) {
            showItem = dataBO !== null;
          }
          break;

        default:
          throw 'Unknwon main configuration name: ' + mainConfiguration;
      }
    }

    if (showItem) {  // Valid BO -> show items
      document.getElementById(itemName).style.display =
          flexItems.includes(itemName) ? 'flex' : 'block';
    } else {  // Invalid BO -> hide items
      document.getElementById(itemName).style.display = 'none';
    }
  }
}

/**
 * Reset the BO data and add a message to udpate the BO panel.
 */
function resetDataBOMsg() {
  updateInvalidDataBO();
  document.getElementById('bo_validity_message').textContent = '';
}

/**
 * Update the overlay content based on the BO design input.
 */
function updateDataBO() {
  const BODesingContent = document.getElementById('bo_design').value;

  let validBO = true;  // assuming valid BO
  let BOValidityMessage = '';

  try {
    // Parse the BO design JSON content
    dataBO = JSON.parse(BODesingContent);

    // Check if BO is valid for the selected game
    const BOCheckOutput = checkValidBuildOrder();
    validBO = BOCheckOutput[0];

    if (!validBO) {
      BOValidityMessage = BOCheckOutput[1];
    } else {
      if (checkValidBuildOrderTimer()) {
        BOValidityMessage = 'Valid build order (also valid for timing).';
        buildOrderTimer['steps'] = getBuildOrderTimerSteps();
      } else {
        BOValidityMessage = 'Valid build order (not valid for timing).';
        buildOrderTimer['steps'] = [];
      }
      stepCount = dataBO.build_order.length;
      // Back to last BO step if invalid BO before
      if ((stepID < 0) && (stepCount >= 1)) {
        stepID = stepCount - 1;
      }
      limitStepID();
    }
  } catch (e) {
    validBO = false;
    BOValidityMessage = 'Invalid build order: Could not parse the JSON format.';
  }

  // Display success/error message
  document.getElementById('bo_validity_message').textContent =
      BOValidityMessage;

  if (!validBO) {  // BO is not valid
    updateInvalidDataBO();
  }

  // Show/hide items based on the BO validity
  showHideItems();
}

/**
 * Update the image selection and copy its value to clipboard.
 *
 * @param {string} value  Value to copy.
 */
function updateImageCopyClipboard(value) {
  document.getElementById('image_copy').value = value;
  navigator.clipboard.writeText(value);
}

/**
 * Update the display of BO images to select.
 *
 * @param {string} subFolder  Name of the sub-folder containing the images.
 */
function updateImagesSelection(subFolder) {
  let imagesContent = '';
  let rowCount = 0;  // current number of images in the row

  // Maximum number of images per row
  let maxRowCount = MAX_ROW_SELECT_IMAGES;
  if ((gameName in SPECIAL_MAX_ROW_SELECT_IMAGES) &&
      (subFolder in SPECIAL_MAX_ROW_SELECT_IMAGES[gameName])) {
    maxRowCount = SPECIAL_MAX_ROW_SELECT_IMAGES[gameName][subFolder];
  }

  // Specific case for faction selection
  if (subFolder === 'select faction') {
    for (const [key, value] of Object.entries(factionsList)) {
      console.assert(
          value.length === 2, 'Faction list item should have a size of 2');

      // Check if it is a valid image and get its path
      const imagePath = getImagePath(factionImagesFolder + '/' + value[1]);
      if (imagePath) {
        if (rowCount === 0) {
          imagesContent += '<div class="row">';  // start new row
        }
        imagesContent += getImageHTML(
            imagePath, SELECT_IMAGE_HEIGHT, 'updateImageCopyClipboard', key);

        // Each row can have a maximum of images
        rowCount++;
        if (rowCount >= maxRowCount) {
          imagesContent += '</div>';  // end row
          rowCount = 0;
        }
      }
    }
  } else {  // Generic case (game of common folder images)
    images = imagesGame[subFolder];
    if (!images) {
      images = imagesCommon[subFolder];
    }
    for (let image of images) {
      // Check if it is a valid image and get its path
      const imagePath = getImagePath(subFolder + '/' + image);
      if (imagePath) {  // image
        if (rowCount === 0) {
          imagesContent += '<div class="row">';  // start new row
        }
        const imageWithSubFolder = '@' + subFolder + '/' + image + '@';
        imagesContent += getImageHTML(
            imagePath, SELECT_IMAGE_HEIGHT, 'updateImageCopyClipboard',
            imageWithSubFolder);

        // Each row can have a maximum of images
        rowCount++;
        if (rowCount >= maxRowCount) {
          imagesContent += '</div>';  // end row
          rowCount = 0;
        }
      }
    }
  }

  // End row, except if empty
  if (rowCount > 0) {
    imagesContent += '</div>';
  }

  // Update content
  document.getElementById('images_bo_display').innerHTML = imagesContent;
}

/**
 * Initialize the faction selection for the BO library filtering.
 */
function initBOFactionSelection() {
  // No BO currently selected
  selectedBOFromLibrary = null;

  // Filter on player faction, then on opponent faction
  for (const widgetID
           of ['bo_faction_select_widget',
               'bo_opponent_faction_select_widget']) {
    // Widget to select the faction (for BOs filtering)
    let factionSelectWidget = document.getElementById(widgetID);
    factionSelectWidget.innerHTML = null;  // Clear all options

    // Skip if no opponent faction filtering
    if ((widgetID === 'bo_opponent_faction_select_widget') &&
        !FACTION_FIELD_NAMES[gameName]['opponent']) {
      factionSelectWidget.style.display = 'none';
    }
    // Display faction filtering
    else {
      factionSelectWidget.style.display = 'block';

      console.assert(
          Object.keys(factionsList).length >= 1,
          'At least one faction expected.');
      // Loop on all the factions
      for (const [factionName, shortAndImage] of Object.entries(factionsList)) {
        console.assert(
            shortAndImage.length === 2,
            '\'shortAndImage\' should have a size of 2');

        let option = document.createElement('option');
        option.text = shortAndImage[0];
        option.value = factionName;
        factionSelectWidget.add(option);
      }
    }
  }

  // Update faction image according to choice.
  updateFactionImageSelection();
}

/**
 * Update the selected faction image for BOs filtering.
 */
function updateFactionImageSelection() {
  // Filter on player faction, then on opponent faction
  for (let i = 0; i < 2; i++) {
    let factionImage = document.getElementById(
        (i === 0) ? 'bo_faction_image' : 'bo_opponent_faction_image');

    // Skip if no opponent faction filtering
    if ((i === 1) && !FACTION_FIELD_NAMES[gameName]['opponent']) {
      factionImage.style.display = 'none';
    } else {
      factionImage.style.display = 'block';

      const widgetName = (i === 0) ? 'bo_faction_select_widget' :
                                     'bo_opponent_faction_select_widget';
      const shortAndImage =
          factionsList[document.getElementById(widgetName).value];
      console.assert(
          shortAndImage.length === 2,
          '\'shortAndImage\' should have a size of 2');
      factionImage.innerHTML = getImageHTML(
          getImagePath(factionImagesFolder + '/' + shortAndImage[1]),
          FACTION_ICON_HEIGHT);
    }
  }
}

/**
 * Initialize the images selection utility.
 */
function initImagesSelection() {
  let imageSelectWidget = document.getElementById('image_class_selection');
  imageSelectWidget.innerHTML = null;  // Clear all options

  // Special case to select the faction
  let selectFactionOption = document.createElement('option');
  selectFactionOption.text = 'select faction';
  selectFactionOption.value = selectFactionOption.text;
  imageSelectWidget.add(selectFactionOption);

  // First process the images of 'imagesGame', then of 'imagesCommon'.
  for (let i = 0; i < 2; i++) {
    const mainFolder = (i === 0) ? imagesGame : imagesCommon;

    // Loop on the sub-folders with the images
    for (const subFolder of Object.keys(mainFolder)) {
      let option = document.createElement('option');
      option.text = subFolder.replaceAll('_', ' ');
      option.value = subFolder;
      imageSelectWidget.add(option);
    }
  }

  // Update the selection of images
  updateImagesSelection(document.getElementById('image_class_selection').value);
}

/**
 * Update the main configuration selection depending on the game.
 */
function updateMainConfigSelection() {
  const fromLibrary =
      '<input type="radio" id="config_library" name="main_config_radios" value="library" checked>' +
      '<label for="config_library" class="button">From library</label>';

  const fromWebsite =
      '<input type="radio" id="config_website" name="main_config_radios" value="website">' +
      '<label for="config_website" class="button">From external website</label>';

  const designYourOwn =
      '<input type="radio" id="config_design" name="main_config_radios" value="design">' +
      '<label for="config_design" class="button">Design your own</label>';

  // Add or not the website section (checking if there is at least one website).
  const fullContent = (gameName in EXTERNAL_BO_WEBSITES) ?
      fromLibrary + fromWebsite + designYourOwn :
      fromLibrary + designYourOwn;

  document.getElementById('main_configuration').innerHTML = fullContent;

  // Updating to library configuration
  mainConfiguration = 'library';
  showHideItems();

  // Updating when selecting another configuration
  let radios = document.querySelectorAll('input[name="main_config_radios"]');
  for (let i = 0; i < radios.length; i++) {
    radios[i].addEventListener('change', function() {
      mainConfiguration = this.value;
      showHideItems();
    });
  }
}

/**
 * Update the links to the external BO websites.
 */
function updateExternalBOWebsites() {
  let linksContent = '';

  // Check if website configuration and external BO websites exist
  if (gameName in EXTERNAL_BO_WEBSITES) {
    // Add links to all websites
    for (const entry of EXTERNAL_BO_WEBSITES[gameName]) {
      console.assert(
          entry.length === 3,
          'All entries in \'EXTERNAL_BO_WEBSITES\' must have a size of 3.');
      linksContent +=
          '<form action="' + entry[1] + '" target="_blank" class="tooltip">';
      linksContent +=
          '<input class="button" type="submit" value="' + entry[0] + '" />';
      linksContent += '<span class="tooltiptext_right">';
      linksContent +=
          '<div>External build order website providing build orders with RTS Overlay format.</div>';
      linksContent += '-----';
      linksContent += '<div>To import the requested build order:</div>';
      linksContent +=
          '<div>1. Select the requested build order on ' + entry[0] + '.</div>';
      linksContent += '<div>2. ' + entry[2] + '</div>';
      linksContent +=
          '<div>3. Paste the clipboard content on the right panel.</div>';
      linksContent += '</span>';
      linksContent += '</form>';
    }
  }
  document.getElementById('external_bo_webistes').innerHTML = linksContent;
}

/**
 * Update the tooltip for 'Diplay overlay'.
 *
 * @returns Requested HTML sequence.
 */
function getDiplayOverlayTooltiptext() {
  let htmlString = `
<div>Display the overlay in a separate window, to be used while in-game.</div>
<div>-----</div>
<div>To keep it on top of your game while playing, use an <em>Always On Top</em> application.</div>
<div>For Windows, <em>PowerToys</em> is a good solution.</div>
<div>It is free, developed by Microsoft and available on the <em>Microsoft Store</em>.</div>
<div>Other solutions are detailed in the Readme (link on the bottom of this page).</div>
<div>-----</div>
<div>Use the left and right arrow buttons to select the build order step.</div>
<div>In case valid timings are available for all steps, click on the feather/hourglass</div>
<div>to switch to the timer mode (updating the steps with a timer).</div>
<div>In timer mode, you can increment/decrement the clock by 1 second with the</div>
<div>arrow buttons, start/stop the timer and set it back to <em>0:00</em>.</div>`;

  htmlString += `
<div>-----</div>
<div>The following hotkeys are available (can be customized in <em>docs/rts_overlay.js</em>):</div>`;

  let atLeastOneHotkey = false;
  for (const [key, value] of Object.entries(OVERLAY_KEYBOARD_SHORTCUTS)) {
    if (value !== '') {
      let description = '';
      switch (key) {
        case 'build_order_previous_step':
          description = 'Previous step / Timer -1 sec';
          break;
        case 'build_order_next_step':
          description = 'Next step / Timer +1 sec';
          break;
        case 'switch_timer_manual':
          description = 'Switch build order timer/manual';
          break;
        case 'start_timer':
          description = 'Start build order timer';
          break;
        case 'stop_timer':
          description = 'Stop build order timer';
          break;
        case 'start_stop_timer':
          description = 'Start/stop build order timer';
          break;
        case 'reset_timer':
          description = 'Reset build order timer';
          break;
      }

      if (description !== '') {
        atLeastOneHotkey = true;
        htmlString += '<div>- ' + description + ': "' + value + '"</div>';
      }
    }
  }

  // No hotkey
  if (!atLeastOneHotkey) {
    htmlString += '<div>- No hotkey defined.</div>';
  }

  htmlString += `
<div>-----</div>
<div>On Windows, use '<em>chrome.exe --app=site_path</em>' in the <em>Run</em> app to run it with</div>
<div>a smaller header on Chrome (solution depending on the selected web browser).</div>
  `;

  return htmlString;
}

/**
 * Update the build order elements (font size, images size and position)
 * based on widgets.
 */
function updateBOFromWidgets() {
  // Font size
  const fontSize = parseFloat(document.getElementById('bo_fontsize').value)
                       .toFixed(1)
                       .toString();
  document.getElementById('bo_fontsize_value').innerHTML = fontSize + ' (font)';

  let boPanelElement = document.getElementById('bo_panel');
  boPanelElement.style.fontSize = fontSize + 'em';

  // Images size
  const imagesSize = parseInt(document.getElementById('bo_images_size').value);
  document.getElementById('bo_images_size_value').innerHTML =
      imagesSize + ' (images)';

  if (imagesSize !== imageHeightBO) {
    imageHeightBO = imagesSize;
    actionButtonHeight = ACTION_BUTTON_HEIGHT_RATIO * imagesSize;
    updateBOPanel(false);
  }

  // Fixed top corner choice
  const newOverlayOnRightSide =
      document.getElementById('left_right_side').checked;
  if (newOverlayOnRightSide !== overlayOnRightSide) {
    overlayOnRightSide = newOverlayOnRightSide;
    document.getElementById('side_selection_text').innerHTML =
        'overlay on the ' + (overlayOnRightSide ? 'right' : 'left');
    updateBOPanel(false);
  }
}

/**
 * Update the game and corresponding variables from its short name.
 *
 * @param {string} newGameName  Short name of the game (e.g. 'aoe2').
 *
 * @return true if game name found and updated, false if no update.
 */
function updateGameWithName(newGameName) {
  let selectGame = document.getElementById('select_game');

  // Loop on all the available games
  for (let i = 0; i < selectGame.options.length; i++) {
    if (selectGame.options[i].value === newGameName) {
      selectGame.selectedIndex = i;
      gameName = newGameName;
      gameFullName = selectGame.options[i].text;

      updateGame();  // Update the other variables
      return true;
    }
  }

  return false;
}

/**
 * Update the variables after selecting a game.
 * The variables 'gameName' and 'gameFullName' must already be defined.
 */
function updateGame() {
  // Get the images available
  imagesGame = getImagesGame();
  factionsList = getFactions();
  factionImagesFolder = getFactionImagesFolder();

  // Update the main configuration selection
  updateMainConfigSelection();

  // Update the external BO website links
  updateExternalBOWebsites();

  // Update the information about RTS Overlay
  updateRTSOverlayInfo();

  // Initialize the images selection utility
  initImagesSelection();

  // Update the library search
  initBOFactionSelection();
  readLibrary();
  updateLibrarySearch();

  // Initialize the BO panel
  resetDataBOMsg();
  document.getElementById('bo_design').value = getWelcomeMessage();
  updateSalamanderIcon();

  // Show or hide elements
  showHideItems();
}

/**
 * Get a build order from an API url.
 *
 * @param {string} apiUrl  API url providing the requested BO.
 *
 * @returns String with BO as JSON content, null if error happened.
 */
function getBOFromApi(apiUrl) {
  return fetch(apiUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(
              'Could not fetch data from ' + apiUrl + ' | ' + response.status);
        }
        return response.json();
      })
      .then(data => JSON.stringify(data, null, 4))
      .catch(error => {
        console.error('Fetch error: ' + error);
        return null;
      });
}

/**
 * Initialize the configuration window.
 */
function initConfigWindow() {
  // Pre-load error image (for potential installation)
  let preloadErrorImager = new Image();
  preloadErrorImager.src = ERROR_IMAGE;

  // Get the requested game from the URL options
  const params = new URLSearchParams(new URL(window.location.href).search);

  // Select the game
  const urlGameId = params.get('gameId');
  if (urlGameId) {
    updateGameWithName(urlGameId);
  }

  // Fetch a build order from an external API
  const urlBuildOrderId = params.get('buildOrderId');
  if (urlBuildOrderId) {
    const arrayOptions = urlBuildOrderId.split('|');

    if (arrayOptions.length == 2) {
      if ((gameName === 'aoe4') && (arrayOptions[0] === 'aoe4guides')) {
        const apiUrl = 'https://aoe4guides.com/api/builds/' + arrayOptions[1] +
            '?overlay=true';

        getBOFromApi(apiUrl).then(result => {
          if (result) {
            document.getElementById('bo_design').value = result;
            updateDataBO();
            stepID = 0;
            limitStepID();
            updateBOPanel(false);
          } else {
            console.log('Could not fetch the build order from aoe4guides.com.');
          }
        });
      }
    }
  }

  // Get the images available
  imagesCommon = getImagesCommon();

  // Update the title of the configuration page
  updateTitle();

  // Update the hotkeys tooltip for 'Diplay overlay'
  document.getElementById('diplay_overlay_tooltiptext').innerHTML =
      getDiplayOverlayTooltiptext();

  // Set default sliders values
  document.getElementById('bo_fontsize').value = DEFAULT_BO_PANEL_FONTSIZE;
  document.getElementById('bo_images_size').value =
      DEFAULT_BO_PANEL_IMAGES_SIZE;
  document.getElementById('left_right_side').checked =
      DEFAULT_OVERLAY_ON_RIGHT_SIDE;
  updateBOFromWidgets();

  // Update elements depending on the selected game
  updateGame();

  // Updating the variables when changing the game
  document.getElementById('select_game').addEventListener('input', function() {
    const selectGame = document.getElementById('select_game');
    gameName = selectGame.value;
    gameFullName = selectGame.options[selectGame.selectedIndex].text;

    updateGame();
  });

  // Panel is automatically updated when the BO design panel is changed
  document.getElementById('bo_design').addEventListener('input', function() {
    updateDataBO();
    updateBOPanel(false);
  });

  // Update the selection images each time a new category is selected
  document.getElementById('image_class_selection')
      .addEventListener('input', function() {
        updateImagesSelection(
            document.getElementById('image_class_selection').value);
      });

  // Update BO elements when any slider is moving
  document.getElementById('bo_fontsize').addEventListener('input', function() {
    updateBOFromWidgets();
  });

  document.getElementById('bo_images_size')
      .addEventListener('input', function() {
        updateBOFromWidgets();
      });

  // Update BO side selection when updating the corresponding toggle
  document.getElementById('left_right_side')
      .addEventListener('input', function() {
        updateBOFromWidgets();
      });

  // Update the library search for each new input or faction selection
  document.getElementById('bo_faction_text')
      .addEventListener('input', function() {
        updateLibrarySearch();
      });

  document.getElementById('bo_faction_select_widget')
      .addEventListener('input', function() {
        updateFactionImageSelection();
        updateLibraryValidKeys();
        updateLibrarySearch();
      });

  document.getElementById('bo_opponent_faction_select_widget')
      .addEventListener('input', function() {
        updateFactionImageSelection();
        updateLibraryValidKeys();
        updateLibrarySearch();
      });
}

/**
 * Update the title of the configuration page.
 */
function updateTitle() {
  document.getElementById('rts_overlay_title').innerHTML =
      getImageHTML('assets/common/title/rts_overlay.png', TITLE_IMAGE_HEIGHT);
}

/**
 * Update the information about RTS Overlay.
 */
function updateRTSOverlayInfo() {
  let content = '<div>' +
      getImageHTML('assets/common/icon/info.png', INFO_IMAGE_HEIGHT) + '</div>';
  content +=
      '<span id="tooltip_rts_overlay_info" class="tooltiptext_left"><div>' +
      getInstructions() + '</div></span>';

  document.getElementById('rts_overlay_info').innerHTML = content;
}

/**
 * Replace the BO panel by the salamander with sword & shield icon.
 */
function updateSalamanderIcon() {
  document.getElementById('bo_panel').innerHTML = '';
  document.getElementById('bo_panel_sliders').style.display = 'none';
  document.getElementById('left_right_toggle').style.display = 'none';
  document.getElementById('salamander').innerHTML = getImageHTML(
      'assets/common/icon/salamander_sword_shield.png',
      SALAMANDER_IMAGE_HEIGHT);
}

/**
 * Update the BO panel rendering.
 *
 * @param {boolean} overlayFlag  true for overlay, false for configuration
 *                               window.
 */
function updateBOPanel(overlayFlag) {
  // Remove salamander icon if present
  let salamaderIcon = document.getElementById('salamander');
  if (salamaderIcon) {
    salamaderIcon.innerHTML = '';
  }

  // Show BO panel sliders and left/right toggle if present
  let boPanelSliders = document.getElementById('bo_panel_sliders');
  if (boPanelSliders) {
    boPanelSliders.style.display = 'flex';
  }

  let leftRightToggle = document.getElementById('left_right_toggle');
  if (leftRightToggle) {
    leftRightToggle.style.display = 'flex';
  }

  // Update BO content
  document.getElementById('bo_panel').innerHTML =
      getBOPanelContent(overlayFlag, stepID);

  // Updates for the overlay BO panel
  if (overlayFlag) {
    if (buildOrderTimer['use_timer']) {
      updateBuildOrderStartStopTimerIcon();
      updateBuildOrderTimeLabel();
    }

    overlayResizeMoveDelay();
  }
}

/**
 * Initialize the overlay window.
 */
function initOverlayWindow() {
  // Using hotkeys to interact with the overlay
  document.addEventListener('keydown', function(event) {
    const code = event.code;
    if (code !== '') {
      switch (code) {
        case OVERLAY_KEYBOARD_SHORTCUTS['build_order_previous_step']:
          previousStepOverlay();
          break;
        case OVERLAY_KEYBOARD_SHORTCUTS['build_order_next_step']:
          nextStepOverlay();
          break;
        case OVERLAY_KEYBOARD_SHORTCUTS['switch_timer_manual']:
          switchBuildOrderTimerManual();
          break;
        case OVERLAY_KEYBOARD_SHORTCUTS['start_timer']:
          startStopBuildOrderTimer(false, true);
          break;
        case OVERLAY_KEYBOARD_SHORTCUTS['stop_timer']:
          startStopBuildOrderTimer(false, false);
          break;
        case OVERLAY_KEYBOARD_SHORTCUTS['start_stop_timer']:
          startStopBuildOrderTimer(true);
          break;
        case OVERLAY_KEYBOARD_SHORTCUTS['reset_timer']:
          resetBuildOrderTimer();
          break;
      }
    }
  });

  // First overaly resize
  overlayResizeMoveDelay();

  // Calling functions at regular interval

  // Update the BO using a timer
  setInterval(timerBuildOrderCall, INTERVAL_CALL_TIME);
  // Check for correct size
  setInterval(overlayResizeMove, INTERVAL_CALL_TIME);
}

/**
 * Get the images available for the common folder, sorted by sub-folder.
 *
 * @returns Dictionary with all the images per sub-folder.
 */
function getImagesCommon() {
  // This is obtained using the 'python/utilities/list_images.py' script.
  let imagesDict = {
    'action_button':
        'feather.png#gears.png#leave.png#load.png#manual_timer_switch.png#next.png#pause.png#previous.png#save.png#start_stop.png#start_stop_active.png#timer_0.png#to_beginning.png#to_end.png',
    'icon':
        'house.png#mouse.png#question_mark.png#salamander_sword_shield.png#time.png'
  };

  // Split each string (e.g. 'image_0#image_1#image_2') in a list of images.
  for (const [key, value] of Object.entries(imagesDict)) {
    imagesDict[key] = value.split('#');
  }

  return imagesDict;
}

/**
 * Check if a build order fulfills the correct key conditions.
 *
 * @param {Object} buildOrder    Build order to check.
 * @param {Object} keyCondition  Dictionary with the keys to look for and their
 *                               value (to consider as valid), null to skip it.
 *
 * @returns true if no key condition or all key conditions are correct.
 */
function checkBuildOrderKeyValues(buildOrder, keyCondition = null) {
  if (keyCondition === null) {  // no key condition to check
    return true;
  }

  // Loop  on the key conditions
  for (const [key, target] of Object.entries(keyCondition)) {
    if (key in buildOrder) {
      const dataCheck = buildOrder[key];
      // Any build order data value is valid
      if (['any', 'Any', 'Generic'].includes(dataCheck) ||
          ['any', 'Any'].includes(target)) {
        continue;
      }
      const isArray = Array.isArray(dataCheck);
      if ((isArray && (!dataCheck.includes(target))) ||
          (!isArray && (target !== dataCheck))) {
        return false;  // at least one key condition not met
      }
    }
  }

  return true;  // all conditions met
}

/**
 * Convert a note written as only TXT to a note with illustrated format, looking
 * initially for patterns of maximal size, and then decreasing progressively the
 * size of the checked patterns.
 *
 * @param {string} note         Note in raw TXT.
 * @param {Object} convertDict  Dictionary for conversions.
 * @param {boolean} toLower     true to look in the dictionary with key set in
 *                              lower case.
 * @param {int} maxSize         Maximal size of the split note pattern, less
 *                              than 1 to take the full split length.
 * @param {Array} ignoreInDict  List of symbols to ignore when checking if it is
 *                              in the dictionary, null if nothing to ignore.
 *
 * @returns Updated note (potentially with illustration).
 */
function convertTXTNoteToIllustrated(
    note, convertDict, toLower = false, maxSize = -1, ignoreInDict = null) {
  const noteSplit = note.split(' ');    // note split based on spaces
  const splitCount = noteSplit.length;  // number of elements in the split

  if (splitCount < 1) {  // safety if no element
    return '';
  }

  if (!ignoreInDict) {  // set as empty list
    ignoreInDict = [];
  }

  // Initial gather count size
  const initGatherCount = (maxSize < 1) ? splitCount : maxSize;

  // number of elements to gather for dictionary check
  for (let gatherCount = initGatherCount; gatherCount > 0; gatherCount--) {
    // number of gather sets that can be made
    const setCount = splitCount - gatherCount + 1;
    console.assert(
        1 <= setCount && setCount <= splitCount, 'setCount value not correct.');

    // ID of the first element
    for (let firstID = 0; firstID < setCount; firstID++) {
      console.assert(
          0 <= firstID && firstID < splitCount, 'firstID value not correct.');
      let checkNote = noteSplit[firstID];

      for (let nextElemID = firstID + 1; nextElemID < firstID + gatherCount;
           nextElemID++) {  // gather the next elements
        console.assert(
            1 <= nextElemID && nextElemID < splitCount,
            'nextElemID not correct.');
        checkNote += ' ' + noteSplit[nextElemID];
      }

      let updatedCheckNote =
          checkNote.slice(0);  // update based on requests (slice for copy)

      for (const ignoreElem of ignoreInDict) {  // ignore parts in dictionary
        updatedCheckNote = updatedCheckNote.replaceAll(ignoreElem, '');
      }

      if (toLower) {  // to lower case
        updatedCheckNote = updatedCheckNote.toLowerCase();
      }

      // Note to check is available in dictionary
      if (updatedCheckNote in convertDict) {
        // Used to retrieve ignored parts
        let ignoreBefore = '';
        let ignoreAfter = '';

        if (ignoreInDict.length > 0) {
          // Get back ignored parts (before dictionary replace)
          const checkNoteLen = checkNote.length;

          for (let characterID = 0; characterID < checkNoteLen; characterID++) {
            if (ignoreInDict.includes(checkNote[characterID])) {
              ignoreBefore += checkNote[characterID];
            } else {
              break;
            }
          }

          // Get back ignored parts (after dictionary replace)
          for (let characterID = checkNoteLen - 1; characterID >= 0;
               characterID--) {
            if (ignoreInDict.includes(checkNote[characterID])) {
              ignoreAfter += checkNote[characterID];
            } else {
              break;
            }
          }

          if (ignoreAfter !== '') {  // reverse order
            ignoreAfter = ignoreAfter.split('').reverse().join('');
          }
        }

        // Gather note parts before the found sub-note
        let beforeNote = '';
        for (let beforeID = 0; beforeID < firstID; beforeID++) {
          console.assert(
              0 <= beforeID && beforeID < splitCount,
              'beforeID value not correct.');
          beforeNote += ' ' + noteSplit[beforeID];
        }
        beforeNote = beforeNote.replaceAll(/^\s+/gm, '');  // lstrip in Python

        // Gather note parts after the found sub-note
        let afterNote = '';
        for (let afterID = firstID + gatherCount; afterID < splitCount;
             afterID++) {
          console.assert(
              0 <= afterID && afterID < splitCount,
              'afterID value not correct.');
          afterNote += ' ' + noteSplit[afterID];
        }
        afterNote = afterNote.replaceAll(/^\s+/gm, '');  // lstrip in Python

        // Compose final note with part before, sub-note found and part after
        let finalNote = '';
        if (beforeNote !== '') {
          finalNote +=
              convertTXTNoteToIllustrated(
                  beforeNote, convertDict, toLower, maxSize, ignoreInDict) +
              ' ';
        }

        finalNote += ignoreBefore + '@' + convertDict[updatedCheckNote] + '@' +
            ignoreAfter;

        if (afterNote !== '') {
          finalNote +=
              ' ' +
              convertTXTNoteToIllustrated(
                  afterNote, convertDict, toLower, maxSize, ignoreInDict);
        }

        return finalNote;
      }
    }
  }

  // Note (and sub-notes parts) not found, returning the initial TXT note
  return note;
}

/**
 * Convert a time in seconds to the corresponding string (as 'x:xx').
 *
 * @param {int} timeSec  Time in seconds.
 *
 * @returns Corresponding string (as 'x:xx'), '0:00' if not valid (or negative)
 *          time.
 */
function buildOrderTimeToStr(timeSec) {
  if (!Number.isInteger(timeSec) || (timeSec <= 0)) {
    return '0:00';
  }

  return Math.floor(timeSec / 60).toString() + ':' +
      ('0' + (timeSec % 60).toString()).slice(-2);
}

/**
 * Convert a string with time (as 'x:xx') to a number of seconds.
 *
 * @param {string} timeStr  String with time as 'x:xx'.
 *
 * @returns Elapsed time in seconds (positive) or -1 if not valid string.
 */
function buildOrderTimeToSec(timeStr) {
  // Split between minutes and seconds
  if (typeof timeStr !== 'string') {
    return -1;
  }
  const timeSplit = timeStr.split(':');
  if (timeSplit.length !== 2) {
    return -1;
  }

  // Convert to [minutes, seconds] integer list
  let intVec = [];
  for (const splitElem of timeSplit) {
    if (isNaN(splitElem)) {  // if not a digit
      return -1;
    }
    const intValue = parseInt(splitElem);
    if (!Number.isInteger(intValue) || (intValue < 0)) {
      return -1;
    }
    intVec.push(intValue);
  }
  console.assert(intVec.length === 2, 'intVec length should be 2.');

  // Convert to seconds
  return 60 * intVec[0] + intVec[1];
}

/**
 * Check if a build order can use the timer feature.
 *
 * @returns true if the build order is valid for timer feature.
 */
function checkValidBuildOrderTimer() {
  if (!('build_order' in dataBO)) {
    return false;
  }
  const buildOrderData = dataBO['build_order'];
  if (!Array.isArray(buildOrderData)) {
    return false;
  }

  let lastTimeSec = -1;  // last time of the build order [sec]

  // Loop on all the steps
  for (const buildOrderStep of buildOrderData) {
    if (!('notes' in buildOrderStep) || !('time' in buildOrderStep)) {
      return false;
    }

    const timeSec = buildOrderTimeToSec(buildOrderStep['time']);
    if ((timeSec < 0) || (timeSec < lastTimeSec)) {  // check valid time
      return false;
    }
    lastTimeSec = timeSec;
  }

  return true;  // build order is compatible with timer feature
}

/**
 * Check if a build order can use the timer feature and return the corresponding
 * steps.
 *
 * @returns Build order steps in correct format (with time in sec), empty
 *          if build order is not valid for timer feature.
 */
function getBuildOrderTimerSteps() {
  if (!('build_order' in dataBO)) {
    return [];
  }
  const buildOrderData = dataBO['build_order'];
  if (!Array.isArray(buildOrderData)) {
    return [];
  }

  let lastTimeSec = -1;  // last time of the build order [sec]
  let fullSteps = [];    // store the full steps

  // Loop on all the steps
  for (const buildOrderStep of buildOrderData) {
    if (!('notes' in buildOrderStep) || !('time' in buildOrderStep)) {
      return [];
    }

    const timeSec = buildOrderTimeToSec(buildOrderStep['time']);
    if ((timeSec < 0) || (timeSec < lastTimeSec)) {  // check valid time
      return [];
    }
    lastTimeSec = timeSec;

    // Update step and store it
    let updatedStep = Object.assign({}, buildOrderStep);  // copy the object
    updatedStep['time_sec'] = timeSec;
    fullSteps.push(updatedStep);
  }

  return fullSteps;
}

/**
 * Get the IDs to display for the timer steps.
 *
 * @param {Array} steps           Steps obtained with
 *                                'getBuildOrderTimerSteps'.
 * @param {int} currentTimeSec    Current game time [sec].
 * @param {boolean} startingFlag  true if the timer steps starts at the
 *                                indicated time, false if ending at this time.
 *
 * @returns List of IDs of the steps to show, empty list if 'steps' is empty.
 */
function getBuildOrderTimerStepIDs(steps, currentTimeSec, startingFlag = true) {
  const stepsCount = steps.length;
  if (stepsCount === 0) {
    return [];
  }

  let lastTimeSec = -1;
  let selectedIDs = [0];  // showing first element if nothing else valid found

  // Range of steps to analyze
  let stepRange = [...Array(stepsCount).keys()];

  // Going in reverse order when timing indicates finishing step
  if (!startingFlag) {
    stepRange = stepRange.reverse();
    selectedIDs = [stepsCount - 1];
  }

  // Loop on the steps in ascending/descending order
  for (const currentStepID of stepRange) {
    const step = steps[currentStepID];
    if ((startingFlag && (currentTimeSec >= step['time_sec'])) ||
        (!startingFlag && (currentTimeSec <= step['time_sec']))) {
      if (step['time_sec'] !== lastTimeSec) {
        selectedIDs = [currentStepID];
        lastTimeSec = step['time_sec'];
      } else {
        selectedIDs.push(currentStepID);
      }
    } else {
      break;
    }
  }

  selectedIDs.sort();
  return selectedIDs;
}

/**
 * Get the build order timer steps to display.
 *
 * @param {Array} steps    Steps obtained with 'getBuildOrderTimerSteps'.
 * @param {Array} stepIDs  IDs of the current steps, obtained from
 *                         'getBuildOrderTimerStepIDs'.
 *
 * @returns Array of size 2:
 *          [step IDs of the output list (see below), list of steps to display].
 */
function getBuildOrderTimerStepsDisplay(steps, stepIDs) {
  // Safety and sorting
  console.assert(stepIDs.length > 0, 'stepIDs must be > 0.');
  for (const stepID of stepIDs) {
    console.assert(
        0 <= stepID && stepID < steps.length, 'Invalid value for stepID.');
  }
  stepIDs.sort();  // safety (should already be the case)

  // Check if first and last steps are selected
  const firstStepFlag = stepIDs[0] === 0;
  const lastStepFlag = stepIDs.at(-1) === steps.length - 1;

  // Check if everything can be returned
  if (firstStepFlag || lastStepFlag) {
    if (steps.length <= 2) {
      return [stepIDs, steps];
    }
  } else {
    if (steps.length <= 3) {
      return [stepIDs, steps];
    }
  }

  // Show the previous step (or current if first step)
  const initID = Math.max(0, stepIDs[0] - 1);

  // Show the next step (or current if last step)
  // +2 because ID is not selected with slice
  const finalID = Math.min(steps.length, stepIDs.at(-1) + 2);

  console.assert(
      0 <= initID && initID < finalID && finalID <= steps.length,
      'Invalid values for initID and/or finalID.');

  const outSteps = steps.slice(initID, finalID);
  let outStepIDs = [];
  for (const stepID of stepIDs) {
    const outStepID = stepID - initID;
    if (0 <= outStepID && outStepID < outSteps.length) {
      outStepIDs.push(outStepID);
    }
  }

  console.assert(
      (outStepIDs.length > 0) && (outSteps.length > 0),
      'Wrong size for the selected steps and/or IDs');
  return [outStepIDs, outSteps];
}

/**
 * Switch the build order mode between timer and manual.
 */
function switchBuildOrderTimerManual() {
  if (buildOrderTimer['steps'].length > 0) {
    buildOrderTimer['use_timer'] = !buildOrderTimer['use_timer'];

    if (!buildOrderTimer['use_timer']) {  // manual step selection
      buildOrderTimer['run_timer'] = false;
    }

    buildOrderTimer['last_time_label'] = '';
    buildOrderTimer['last_steps_ids'] = [];

    // Select current step
    if (!buildOrderTimer['use_timer'] &&
        (buildOrderTimer['steps_ids'].length > 0)) {
      stepID = buildOrderTimer['steps_ids'][0];
    }

    updateBOPanel(true);
  } else {
    buildOrderTimer['use_timer'] = false;
  }
}

/**
 * Update the icon for 'buildOrderStartStopTimer'.
 */
function updateBuildOrderStartStopTimerIcon() {
  let elem = document.getElementById('start_stop_timer');
  if (elem) {
    elem.src = 'assets/common/action_button/' +
        (buildOrderTimer['run_timer'] ? 'start_stop_active.png' :
                                        'start_stop.png');
  }
}

/**
 * Start or stop the build order timer.
 *
 * @param {boolean} invertRun  true to invert the running state.
 * @param {boolean} runValue   Value to set for the running state
 *                             (ignored for invertRun set to true).
 */
function startStopBuildOrderTimer(invertRun = true, runValue = true) {
  if (buildOrderTimer['use_timer']) {
    const newRunState = invertRun ? (!buildOrderTimer['run_timer']) : runValue;

    if (newRunState !==
        buildOrderTimer['run_timer']) {  // only update if change
      buildOrderTimer['run_timer'] = newRunState;

      // Time
      buildOrderTimer['last_time_label'] = '';
      buildOrderTimer['absolute_time_init'] = getCurrentTime();
      buildOrderTimer['time_sec_init'] = buildOrderTimer['time_sec'];

      updateBOPanel(true);
    }
  }
}

/**
 * Reset the build order timer (set to 0 sec).
 */
function resetBuildOrderTimer() {
  if (buildOrderTimer['use_timer']) {
    buildOrderTimer['time_sec'] = 0.0;
    buildOrderTimer['time_int'] = 0;
    buildOrderTimer['last_time_int'] = 0;
    buildOrderTimer['time_sec_init'] = 0.0;
    buildOrderTimer['last_time_label'] = '';
    buildOrderTimer['absolute_time_init'] = getCurrentTime();
    buildOrderTimer['steps_ids'] = [0];
    buildOrderTimer['last_steps_ids'] = [];
    updateBOPanel(true);
  }
}

/**
 * Get the build order timer steps to display.
 *
 * @param {int} BOStepID         Requested step ID for the BO.
 *
 * @returns Array of size 2:
 *          [step IDs of the output list (see below), list of steps to display].
 */
function getBuildOrderSelectedStepsAndIDs(BOStepID) {
  if (buildOrderTimer['use_timer'] && buildOrderTimer['steps'].length > 0) {
    // Get steps to display
    return getBuildOrderTimerStepsDisplay(
        buildOrderTimer['steps'], buildOrderTimer['steps_ids']);
  } else {
    const buildOrderData = dataBO['build_order'];

    // Select current step
    console.assert(0 <= BOStepID && BOStepID < stepCount, 'Invalid step ID');
    const selectedStepsIDs = [0];
    const selectedSteps = [buildOrderData[BOStepID]];
    console.assert(selectedSteps[0] !== null, 'Selected steps are not valid');
    console.assert(
        (selectedSteps.length > 0) && (selectedStepsIDs.length > 0),
        'Wrong size for the selected steps and/or IDs');
    return [selectedStepsIDs, selectedSteps];
  }
}

/**
 * Return an array indicating a success, with a potential message.
 *
 * @param {string} msg  Message to use for the success.
 *
 * @returns Array of size 2: [true, string indicating success].
 */
function validMsg(msg = '') {
  return [true, msg];
}

/**
 * Return an array indicating a failure, with a potential message.
 *
 * @param {string} msg  Message to use for the failure.
 *
 * @returns Array of size 2: [false, string indicating failure].
 */
function invalidMsg(msg = '') {
  return [false, msg];
}

/**
 * Check if the faction(s) provided is correct.
 *
 * @param {string} BONameStr    Message prefix with the build order name.
 * @param {string} factionName  Name of the faction field.
 * @param {boolean} requested   true if faction field is requested.
 * @param {boolean} anyValid    true if 'any' or 'Any' accepted.
 *
 * @returns Array of size 2:
 *              0: true if valid faction name, false otherwise.
 *              1: String indicating the error (empty if no error).
 */
function checkValidFaction(BONameStr, factionName, requested, anyValid = true) {
  // Faction is provided
  if (factionName in dataBO) {
    const factionData = dataBO[factionName];

    if (Array.isArray(factionData)) {  // List of factions
      if (factionData.length === 0) {
        return invalidMsg(
            BONameStr + 'Valid "' + factionName + '" list is empty.');
      }

      for (const faction of factionData) {  // Loop on the provided factions
        const anyFlag = ['any', 'Any'].includes(faction);
        if (!(!anyFlag && (faction in factionsList)) &&
            !(anyFlag && anyValid)) {
          return invalidMsg(
              BONameStr + 'Unknown ' + factionName + ' "' + faction +
              '" (check spelling).');
        }
      }
    }
    // Single faction provided
    else {
      const anyFlag = ['any', 'Any'].includes(factionData);
      if (!(!anyFlag && (factionData in factionsList)) &&
          !(anyFlag && anyValid)) {
        return invalidMsg(
            BONameStr + 'Unknown ' + factionName + ' "' + factionData +
            '" (check spelling).');
      }
    }
  }
  // Faction is not provided
  else if (requested) {
    return invalidMsg(BONameStr + 'Missing "' + factionName + '" field.');
  }

  return validMsg();  // Valid faction(s)
}

/**
 * Definition of a BO field.
 */
class FieldDefinition {
  /**
   * Constructor.
   *
   * @param {string} name        Name of the field.
   * @param {string} type        Type name of the field
   *                             (integer, string, boolean, array of strings).
   * @param {boolean} requested  true if requested field.
   * @param {string} parentName  Name of the parent field
   *                             (null if no parent field).
   * @param {Array} validRange   Range of valid values, null if no range.
   */
  constructor(name, type, requested, parentName = null, validRange = null) {
    // Check input types
    if (typeof name !== 'string' || typeof type !== 'string' ||
        (parentName && typeof parentName !== 'string')) {
      throw 'FieldDefinition expected strings for \'name\', \'type\' and \'parentName\'.';
    }

    if (typeof requested !== 'boolean') {
      throw 'FieldDefinition expected boolean for \'requested\'.';
    }

    if (validRange && !Array.isArray(validRange)) {
      throw 'FieldDefinition expected Array for \'validRange\'.';
    }

    if (validRange && validRange.length !== 2) {
      throw 'FieldDefinition \'validRange\' must have a size of 2.';
    }

    this.name = name;
    this.type = type;
    this.requested = requested;
    this.parentName = parentName;
    this.validRange = validRange;
  }

  /**
   * Check if the type of value is correct.
   *
   * @param {*} value  Value whose type needs to be checked.
   *
   * @return true if valid type.
   */
  checkType(value) {
    switch (this.type) {
      case 'integer':
        return Number.isInteger(value);
      case 'string':
        return typeof value === 'string';
      case 'boolean':
        return typeof value === 'boolean';
      case 'array of strings':
        if (!Array.isArray(value)) {
          return false;
        }
        for (const item of value) {
          if (typeof item !== 'string') {
            return false;
          }
        }
        return true;
      default:
        throw 'Unknown type: ' + this.type;
    }
  }

  /**
   * Check if an integer value is in a given range.
   *
   * @param {int} value  Integer value to check.
   *
   * @returns true if inside the valid range.
   */
  checkRange(value) {
    // Check only needed for integer values with defined range
    if (this.type !== 'integer' || !Number.isInteger(value) ||
        !this.validRange) {
      return true;
    }

    return (this.validRange[0] <= value) && (value <= this.validRange[1]);
  }

  /**
   * Check if a value is correct.
   *
   * @param {*} value  Value to check.
   *
   * @returns Array of size 2:
   *              0: true if valid value, false otherwise.
   *              1: String indicating the error (empty if no error).
   */
  check(value) {
    if (!this.checkType(value)) {
      return invalidMsg(
          'Wrong value (' + value + '), expected ' + this.type + ' type.');
    }

    if (!this.checkRange(value)) {
      return invalidMsg(
          'Wrong value (' + value + '), must be in [' + this.validRange[0] +
          ' ; ' + this.validRange[1] + '] range.');
    }

    return validMsg();
  }
}

/**
 * Enumerate function for array.
 *
 * @param {*} iterable    Iterable for array.
 */
function* enumerate(iterable) {
  let i = 0;
  for (const x of iterable) {
    yield [i, x];
    i++;
  }
}

/**
 * Check if all the steps of the BO are correct.
 *
 * @param {string} BONameStr  Potential name for the BO.
 * @param {Array} fields      Expected fiels of the BO, with their definition.
 *
 * @returns Array of size 2:
 *              0: true if all steps are correct.
 *              1: String indicating the error (empty if no error).
 */
function checkValidSteps(BONameStr, fields) {
  // Size of the build order
  const buildOrderData = dataBO['build_order'];
  if (buildOrderData.length < 1) {
    return invalidMsg(BONameStr + 'Build order is empty.');
  }

  // Loop on the build order steps
  for (const [stepID, step] of enumerate(buildOrderData)) {
    // Prefix before error message
    const prefixMsg = BONameStr + 'Step ' + (stepID + 1).toString() + '/' +
        buildOrderData.length + ' | ';

    // Loop on all the step fields
    for (const field of fields) {
      if (!(field instanceof FieldDefinition)) {
        throw 'Wrong field definition.';
      }

      // Present in parent element
      if (field.parentName) {
        if (field.parentName in step) {
          if (field.name in step[field.parentName]) {
            const res = field.check(step[field.parentName][field.name]);
            if (!res[0]) {
              return invalidMsg(
                  prefixMsg + '"' + field.parentName + '/' + field.name +
                  '" | ' + res[1]);
            }
          }
          // Child field is missing
          else if (field.requested) {
            return invalidMsg(
                prefixMsg + 'Missing field: "' + field.parentName + '/' +
                field.name + '".');
          }
        }
        // Parent field missing
        else if (field.requested) {
          return invalidMsg(
              prefixMsg + 'Missing field: "' + field.parentName + '".');
        }
      }
      // Not present in a parent
      else if (field.name in step) {
        const res = field.check(step[field.name]);
        if (!res[0]) {
          return invalidMsg(prefixMsg + '"' + field.name + '" | ' + res[1]);
        }
      }
      // Field is missing
      else if (field.requested) {
        return invalidMsg(prefixMsg + 'Missing field: "' + field.name + '".');
      }
    }
  }

  return validMsg();
}

/**
 * Evaluate the time indications for the current build order.
 */
function evaluateTime() {
  if (dataBO) {
    // Compute timing with potential offset
    const timeOffset = parseInt(document.getElementById('time_offset').value);
    evaluateBOTiming(timeOffset);

    // Update text editing space
    document.getElementById('bo_design').value =
        JSON.stringify(dataBO, null, 4);

    // Update BO and panel
    updateDataBO();
    updateBOPanel(false);
  }
}

/**
 * Update the build order time label.
 */
function updateBuildOrderTimeLabel() {
  // Check if time is negative
  let buildOrderTimeSec = 0.0;

  if (buildOrderTimer['time_int'] < 0) {
    negative_time = true;
    buildOrderTimeSec = -buildOrderTimer['time_int'];
  } else {
    negative_time = false;
    buildOrderTimeSec = buildOrderTimer['time_int'];
  }

  // Convert to 'x:xx' format
  const negativeStr = (negative_time && (buildOrderTimeSec !== 0)) ? '-' : '';
  const timeLabel = negativeStr + buildOrderTimeToStr(buildOrderTimeSec);

  if (timeLabel !== buildOrderTimer['last_time_label']) {
    // Update label and layout
    document.getElementById('step_time_indication').innerHTML = timeLabel;
    buildOrderTimer['last_time_label'] = timeLabel;
  }
}

/**
 * Function called on a timer for build order timer update.
 */
function timerBuildOrderCall() {
  if (buildOrderTimer['run_timer']) {
    let elapsedTime = getCurrentTime() - buildOrderTimer['absolute_time_init'];
    // In case timer value is not the same as real-time
    if (buildOrderTimer['timer_speed_factor'] > 0.0) {
      elapsedTime *= buildOrderTimer['timer_speed_factor'];
    }
    buildOrderTimer['time_sec'] =
        buildOrderTimer['time_sec_init'] + elapsedTime;
    buildOrderTimer['time_int'] = Math.floor(buildOrderTimer['time_sec']);

    // Time was updated (or no valid note IDs)
    if ((buildOrderTimer['last_time_int'] !== buildOrderTimer['time_int']) ||
        (buildOrderTimer['last_steps_ids'].length === 0)) {
      buildOrderTimer['last_time_int'] = buildOrderTimer['time_int'];

      // Compute current note IDs
      buildOrderTimer['steps_ids'] = getBuildOrderTimerStepIDs(
          buildOrderTimer['steps'], buildOrderTimer['time_int'],
          buildOrderTimer['step_starting_flag']);

      // Note IDs were updated
      if (buildOrderTimer['last_steps_ids'] !== buildOrderTimer['steps_ids']) {
        buildOrderTimer['last_steps_ids'] =
            buildOrderTimer['steps_ids'].slice();  // slice for copy
        updateBOPanel(true);
      }
    }
  }
}

/**
 * Format the build order.
 */
function formatBuildOrder() {
  if (dataBO) {
    document.getElementById('bo_design').value =
        JSON.stringify(dataBO, null, 4);
    updateDataBO();
    updateBOPanel(false);
  }
}

/**
 * Reset the build order design to the game template.
 */
function resetBuildOrder() {
  dataBO = getBOTemplate();
  formatBuildOrder();
}

/**
 * Add a step to the current build order.
 */
function addBuildOrderStep() {
  if (dataBO && Object.keys(dataBO).includes('build_order')) {
    dataBO.build_order.push(getBOStep(dataBO.build_order));
    stepCount = dataBO.build_order.length;
    stepID = stepCount - 1;
    limitStepID();
    formatBuildOrder();
  }
}

/**
 * Copy build order to clipboard.
 */
function copyBOToClipboard() {
  navigator.clipboard.writeText(document.getElementById('bo_design').value);
}

/**
 * Handle a file dropping on the BO desing text area.
 *
 * @param {*} ev  Event to process when dropping a file.
 */
function BODesignDropHandler(ev) {
  // Prevent default behavior (file being opened)
  ev.preventDefault();

  // File to read
  const file = ev.dataTransfer.files[0];

  // Use file content for 'bo_design' text area
  let reader = new FileReader();
  reader.onload = function(e) {
    bo_design.value = e.target.result;
    updateDataBO();
    updateBOPanel(false);
  };
  reader.readAsText(file, 'UTF-8');
}

/**
 * Save the build order in a file.
 *
 * @param {Object} data  Build order content, null
 *                       to use the 'bo_design' panel content.
 */
function saveBOToFile(data = null) {
  // Get from 'bo_design' panel if BO not provided
  if (!data) {
    data = JSON.parse(document.getElementById('bo_design').value);
  }

  // Create a file with the BO content
  const file = new Blob([JSON.stringify(data, null, 4)], {type: 'text/plain'});

  // Add file content in an object URL with <a> tag
  const link = document.createElement('a');
  link.href = URL.createObjectURL(file);

  // File name
  if (data && Object.keys(data).includes('name')) {
    // Replace all spaces by '_'
    link.download = data.name.replaceAll(/\s+/g, '_') + '.json';
  } else {
    link.download = 'rts_overlay.json';
  }

  // Add click event to <a> tag to save file
  link.click();
  URL.revokeObjectURL(link.href);
}

/**
 * Delete the selected build order.
 */
function deleteSelectedBO() {
  if (!selectedBOFromLibrary) {
    alert('No build order from library currently selected.');
    return;
  }
  const keyName = gameName + '|' + selectedBOFromLibrary;

  if (!localStorage.getItem(keyName)) {
    alert('No build order in local storage with key name \'' + keyName + '\'.');
    return;
  }

  const text = 'Are you sure you want to delete the build order \'' +
      selectedBOFromLibrary + '\' (' + gameFullName +
      ') from your local storage?\nThis cannot be undone.';
  if (confirm(text)) {
    localStorage.removeItem(keyName);
    readLibrary();
    updateLibrarySearch();
    alert('Build order removed: \'' + selectedBOFromLibrary + '\'.');
  }
}

/**
 * Delete all build orders.
 */
function deleteAllBOs() {
  const text = 'Are you sure you want to delete ALL BUILD ORDERS (from ' +
      gameFullName + ') from your local storage?' +
      '\nThis cannot be undone.';

  if (confirm(text)) {
    const gamePrefix = gameName + '|';

    // List all keys to remove (without removing, to keep localStorage intact)
    let keysToRemove = [];
    for (let i = 0, len = localStorage.length; i < len; i++) {
      const keyName = localStorage.key(i);
      if (keyName.startsWith(gamePrefix)) {
        keysToRemove.push(keyName);
      }
    }

    // Remove all the requested keys
    for (const keyName of keysToRemove) {
      localStorage.removeItem(keyName);
    }

    readLibrary();
    updateLibrarySearch();
    alert('All build orders from ' + gameFullName + ' removed.');
  }
}

/**
 * Export all build orders.
 */
function exportAllBOs() {
  const gamePrefix = gameName + '|';
  for (let i = 0, len = localStorage.length; i < len; i++) {
    const keyName = localStorage.key(i);
    if (keyName.startsWith(gamePrefix)) {
      saveBOToFile(JSON.parse(localStorage.getItem(keyName)));
    }
  }
}

/**
 * Add current BO to the library (local storage).
 */
function addToLocalStorage() {
  if (dataBO) {
    const keyName = gameName + '|' + dataBO['name'];

    if (localStorage.getItem(keyName)) {
      const text = 'There is already a build order with name \'' +
          dataBO['name'] + '\' for ' + gameFullName +
          '.\nDo you want to replace it with your new build order?';
      if (!confirm(text)) {
        return;
      }
    } else {
      const text = 'Do you want to save your build order with name \'' +
          dataBO['name'] + '\' for ' + gameFullName + '?';
      if (!confirm(text)) {
        return;
      }
    }

    localStorage.setItem(keyName, JSON.stringify(dataBO));
    readLibrary();
    updateLibrarySearch();
    alert(
        'Build order saved with key name \'' + keyName +
        '\' in local storage.');

  } else {
    alert('Build order is not valid. It cannot be saved.');
  }
}

/**
 * Compute the Levenshtein distance between two words.
 *
 * @param {string} strA  First word to compare.
 * @param {string} strB  Second word to compare.
 *
 * @returns Requested Levenshtein distance.
 */
function computeLevenshtein(strA, strB) {
  const lenA = strA.length;
  const lenB = strB.length;

  let matrix = Array(lenA + 1);
  for (let i = 0; i <= lenA; i++) {
    matrix[i] = Array(lenB + 1);
  }

  for (let i = 0; i <= lenA; i++) {
    matrix[i][0] = i;
  }

  for (let j = 0; j <= lenB; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= lenA; i++) {
    for (let j = 1; j <= lenB; j++) {
      if (strA[i - 1] === strB[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1, matrix[i][j - 1] + 1,
            matrix[i - 1][j - 1] + 1);
      }
    }
  }

  return matrix[lenA][lenB];
}

/**
 * Compute the minimal Levenshtein error score, by sliding a small string on a
 * larger one. It is assumed that the smaller string is not included in the
 * larger one.
 *
 * @param {string} strSmall  Smaller string to compare.
 * @param {string} strLarge  Larger string to compare.
 *
 * @returns Minimal Levenshtein error score.
 */
function computeSameSizeLevenshtein(strSmall, strLarge) {
  // Check string lengths
  const lenSmall = strSmall.length;
  const lenLarge = strLarge.length;
  console.assert(
      lenSmall <= lenLarge, '\'strSmall\' must be smaller than \'strLarge\'.');

  // Normal Levenshtein computation is same size
  if (lenSmall === lenLarge) {
    return computeLevenshtein(strA, strB);
  }

  // Start on the first part of the larger string
  let minScore = computeLevenshtein(strSmall, strLarge.slice(0, lenSmall));
  if (minScore === 1) {  // Cannot be smaller than 1 if not included
    return 1;
  }

  // Slide on the larger string
  const maxId = lenLarge - lenSmall;

  for (let i = 1; i <= maxId; i++) {
    const currentScore =
        computeLevenshtein(strSmall, strLarge.slice(i, i + lenSmall));
    if (currentScore === 1) {  // Cannot be smaller than 1 if not included
      return 1;
    } else if (currentScore < minScore) {
      minScore = currentScore;
    }
  }

  return minScore;
}

/**
 * Compute the Levenshtein score by comparing same-size tokens, and apply a
 * threshold to filter wrong matches.
 *
 * @param {float} ratio_thres  Ratio applied on the smallest word length.
 *                             The ratio of errors (Levenshtein score) must be
 *                             smaller than this threshold.
 * @param {string} strA        First string to compare.
 * @param {string} strB        Second string to compare.
 *
 * @returns Minimal Levenshtein score, -1 if match is too bad (threshold).
 */
function computeSameSizeLevenshteinThreshold(ratio_thres, strA, strB) {
  // String lengths
  const lenA = strA.length;
  const lenB = strB.length;

  // Select smallest string
  const smallA = lenA <= lenB;
  const strSmall = smallA ? strA : strB;
  const strLarge = smallA ? strB : strA;

  // Score of 0 (no error) if small string fully included in larger one.
  if (strLarge.includes(strSmall)) {
    return 0;
  }

  // Compute error threshold
  const lenSmall = smallA ? lenA : lenB;
  const errorThreshold = Math.floor(ratio_thres * lenSmall);

  // Not valid if not included and threshold does not allow any error
  if (errorThreshold < 1) {
    return -1;
  }

  // Compute the same-size Levenshtein error
  const score = computeSameSizeLevenshtein(strSmall, strLarge);

  // Check if lower or equal to error threshold
  return (score > errorThreshold) ? -1 : score;
}

/**
 * Read the library content and update the corresponding variables.
 */
function readLibrary() {
  library = {};

  const gamePrefix = gameName + '|';
  for (let i = 0, len = localStorage.length; i < len; i++) {
    const keyName = localStorage.key(i);
    if (keyName.startsWith(gamePrefix)) {
      const nameBO = keyName.replaceAll(gamePrefix, '');
      library[nameBO] = JSON.parse(localStorage.getItem(keyName));
    }
  }

  updateLibraryValidKeys();
}

/**
 * Get key condition dictionary for build order sorting.
 *
 * @returns Requested key condition dictionary.
 */
function getKeyCondition() {
  const playerFactionName = FACTION_FIELD_NAMES[gameName]['player'];
  const opponentFactionName = FACTION_FIELD_NAMES[gameName]['opponent'];

  let keyCondition = {};
  if (playerFactionName) {
    keyCondition[playerFactionName] =
        document.getElementById('bo_faction_select_widget').value;
  }
  if (opponentFactionName) {
    keyCondition[opponentFactionName] =
        document.getElementById('bo_opponent_faction_select_widget').value;
  }

  return keyCondition;
}

/**
 * Update the library of valid keys (filtering) based on the player
 * (and optionally) opponent faction.
 */
function updateLibraryValidKeys() {
  // Get key condition dictionary
  const keyCondition = getKeyCondition();

  // Fill valid keys based on the dictionary
  libraryValidKeys = [];
  for (const [key, dataBO] of Object.entries(library)) {
    if (checkBuildOrderKeyValues(dataBO, keyCondition)) {
      libraryValidKeys.push(key);
    }
  }
}

/**
 * Compare two key names based on score.
 *
 * @param {Object} librayKeyScores  Score for each key of the library.
 * @param {string} keyA             First key to compare.
 * @param {string} keyB             Second key to compare.
 *
 * @returns -1, 0 or +1, to be used with the 'sort' function.
 */
function compareLibraryKeys(librayKeyScores, keyA, keyB) {
  // The lowest score will appear first.
  const scoreA = librayKeyScores[keyA];
  const scoreB = librayKeyScores[keyB];

  if (scoreA < scoreB) {
    return -1;
  } else if (scoreA > scoreB) {
    return 1;
  } else {
    return 0;
  }
}

/**
 * Compare two library BO names based on target faction(s).
 *
 * @param {Object} keyCondition  Dictionary with the keys to look for and their
 *                               value (to consider as valid).
 * @param {string} itemA         First library BO to compare.
 * @param {string} itemB         Second library BO to compare.
 *
 * @returns -1, 0 or +1, to be used with the 'sort' function.
 */
function compareLibraryFaction(keyCondition, itemA, itemB) {
  for (const [fieldName, targetValue] of Object.entries(keyCondition)) {
    const validA = library[itemA][fieldName] === targetValue;
    const validB = library[itemB][fieldName] === targetValue;

    if (validA && !validB) {
      return -1;
    } else if (!validA && validB) {
      return 1;
    }
  }
  return 0;
}

/**
 * Remove the 'search_key_select' for all the search lines results.
 */
function clearSearchResultSelect() {
  let elements = document.getElementsByClassName('search_key_line');

  Array.prototype.forEach.call(elements, function(el) {
    document.getElementById(el.id).classList.remove('search_key_select');
  });
}

/**
 * Update the class of a search result line when hovering on it.
 *
 * @param {int} id  ID of the search result line.
 */
function mouseOverSearchResult(id) {
  clearSearchResultSelect();

  document.getElementById('search_key_line_' + id)
      .classList.add('search_key_select');
}

/**
 * Update the selected BO when clicking on a search result line.
 *
 * @param {string} key  Key of the selected build order.
 */
function mouseClickSearchResult(key) {
  // Set the build order design panel content to the one of the library,
  // and update the BO display accordingly.
  console.assert(key in library, 'Library has not key \'' + key + '\'.')
  document.getElementById('bo_design').value = JSON.stringify(library[key]);
  updateDataBO();
  formatBuildOrder();
  updateBOPanel(false);

  // Update build order search lines
  let boSearchText =
      '<div " class="search_key_line">Selected build order:</div>';
  boSearchText +=
      '<div " class="search_key_line search_key_select">' + key + '</div>';

  document.getElementById('bo_faction_text').value = '';
  document.getElementById('bo_search_results').innerHTML = boSearchText;

  // Save value of selected build order
  selectedBOFromLibrary = key;
  showHideItems();
}

/**
 * Updates based on the library search.
 */
function updateLibrarySearch() {
  // Value to search in lower case
  const searchStr =
      document.getElementById('bo_faction_text').value.toLowerCase();

  // Selected BO is null if the search field is not empty
  if (searchStr !== '') {
    selectedBOFromLibrary = null;
  }

  let boSearchText = '';  // Text printed for the BO search

  // Library is empty
  if (Object.keys(library).length === 0) {
    boSearchText +=
        '<div>No build order in library for <i>' + gameFullName + '</i>.</div>';
    if (gameName in EXTERNAL_BO_WEBSITES) {
      boSearchText +=
          '<div>Download one <b>from an external website</b> or <b>design your own</b>.</div>';
    } else {
      boSearchText +=
          '<div><b>Design your own</b> build order in the corresponding panel.</div>';
    }
  }
  // No build order for the currently selected faction condition
  else if (libraryValidKeys.length === 0) {
    boSearchText += '<div>No build order in your library for faction <b>' +
        document.getElementById('bo_faction_select_widget').value + '</b>';
    if (FACTION_FIELD_NAMES[gameName]['opponent']) {
      boSearchText += ' with opponent <b>' +
          document.getElementById('bo_opponent_faction_select_widget').value +
          '</b>';
    }
    boSearchText += '.</div>';
  }
  // At least one valid build order for the currently selected faction condition
  else {
    // Nothing added in the search field
    if (searchStr.length === 0) {
      const factionName =
          document.getElementById('bo_faction_select_widget').value;
      boSearchText += '<div>Select the player faction above (' +
          factionsList[factionName][0] + ': <b>' + factionName + '</b>)';

      if (FACTION_FIELD_NAMES[gameName]['opponent']) {
        const opponentFactionName =
            document.getElementById('bo_opponent_faction_select_widget').value;
        boSearchText += ' and opponent faction (' +
            factionsList[opponentFactionName][0] + ': <b>' +
            opponentFactionName + '</b>)';
      }
      boSearchText += '.</div>';

      boSearchText +=
          '<div>Then, add <b>keywords</b> in the text field to search any build order from your library.</div>';
      boSearchText +=
          '<div>Alternatively, use <b>a single space</b> to select the first ' +
          MAX_SEARCH_RESULTS + ' build orders.</div>';
      boSearchText +=
          '<div>Finally, click on the requested build order from the list (will appear here).</div>';
    }
    // Look for pattern in search field
    else {
      let librarySortedKeys = [];

      // Get key condition dictionary
      const keyCondition = getKeyCondition();

      // If not single space, look for best pattern matching
      if (searchStr !== ' ') {
        // Compute metrics for
        let librayKeyScores = {};
        for (const key of libraryValidKeys) {
          const keyLowerCase = key.toLowerCase();
          const score = computeSameSizeLevenshteinThreshold(
              LEVENSHTEIN_RATIO_THRESHOLD, searchStr, keyLowerCase);
          if (score >= 0) {  // Valid match
            librayKeyScores[key] = score;
            librarySortedKeys.push(key);
          }
        }
        // Sort the keys based on the metrics above
        librarySortedKeys.sort(
            (a, b) => compareLibraryKeys(librayKeyScores, a, b));

        // Only keep the first results
        librarySortedKeys = librarySortedKeys.slice(0, MAX_SEARCH_RESULTS);

        // Sort by faction requirement
        librarySortedKeys.sort(
            (a, b) => compareLibraryFaction(keyCondition, a, b));
      }
      // Take the first results, sorting only by faction requirement
      else {
        // Copy full list of valid keys
        librarySortedKeys = libraryValidKeys.slice();

        // Sort by faction requirement
        librarySortedKeys.sort(
            (a, b) => compareLibraryFaction(keyCondition, a, b));

        // Only keep the first results
        librarySortedKeys = librarySortedKeys.slice(0, MAX_SEARCH_RESULTS);
      }

      // Print the corresponding build order keys (names) with
      // hovering and clicking interactions.
      let keyID = 0;
      for (const key of librarySortedKeys) {
        boSearchText += '<div id="search_key_line_' + keyID +
            '" class="search_key_line" onmouseover="mouseOverSearchResult(' +
            keyID +
            ')" onmouseleave="clearSearchResultSelect()" onclick="mouseClickSearchResult(\'' +
            key.replaceAll('\'', '\\\'') + '\')">' + key + '</div>';
        keyID++;
      }
    }
  }

  // Print text for the BO search
  document.getElementById('bo_search_results').innerHTML = boSearchText;
  showHideItems();
}

/**
 * Add space indentation.
 *
 * @param {int} indentCount  Number of indentations to make.
 * @param {int} indentSize   Number of spaces per indentation.
 *
 * @returns String with the indentations as sequence of spaces.
 */
function indentSpace(indentCount, indentSize = 4) {
  return ' '.repeat(indentCount * indentSize);
}

/**
 * Definition of a column for BO in a single panel.
 */
class SinglePanelColumn {
  /**
   * Constructor.
   *
   * @param {string} field               Name of the field to display.
   * @param {string} image               Path of the image on top of
   *                                     the column (null to hide).
   * @param {boolean} italic             true for italic.
   * @param {boolean} bold               true for bold.
   * @param {boolean} hideIfAbsent       true to  hide if fully absent.
   * @param {boolean} displayIfPositive  true to display only if it is > 0,
   *                                     should be 'false' for non-integers.
   * @param {Array} backgroundColor      Color of the background,
   *                                     null to keep default.
   * @param {string} textAlign           Value for 'text-align',
   *                                     null for default.
   */
  constructor(
      field, image = null, italic = false, bold = false, hideIfAbsent = false,
      displayIfPositive = false, backgroundColor = null, textAlign = null) {
    // Check input types
    if (typeof field !== 'string' || (image && typeof image !== 'string') ||
        (textAlign && typeof textAlign !== 'string')) {
      throw 'SinglePanelColumn expected strings for \'field\', \'image\' and \'textAlign\'.';
    }

    if (typeof italic !== 'boolean' || typeof bold !== 'boolean' ||
        typeof hideIfAbsent !== 'boolean' ||
        typeof displayIfPositive !== 'boolean') {
      throw 'SinglePanelColumn expected boolean for \'italic\',  \'bold\',  \'hideIfAbsent\' and  \'displayIfPositive\'.';
    }

    if (backgroundColor && !Array.isArray(backgroundColor)) {
      throw 'SinglePanelColumn expected Array for \'backgroundColor\'.';
    }

    if (backgroundColor && backgroundColor.length !== 3) {
      throw 'SinglePanelColumn \'backgroundColor\' must have a size of 3.';
    }

    this.field = field;
    this.image = image;
    this.italic = italic;
    this.bold = bold;
    this.hideIfAbsent = hideIfAbsent;
    this.displayIfPositive = displayIfPositive;
    this.backgroundColor = backgroundColor;
    this.textAlign = textAlign;
  }
}

/**
 * Open a new page displaying the full BO in a single panel,
 * based on table descriptions.
 *
 * @param {Array} columnsDescription  Array of 'SinglePanelColumn' describing
 *                                    each column (except the notes).
 * @param {Object} sectionsHeader     Disctionary describing the sections
 *                                    headers, containing 'key', 'before'
 *                                    and 'after', null if no section.
 */
function openSinglePanelPageFromDescription(
    columnsDescription, sectionsHeader = null) {
  // Check if valid BO data
  if (!checkValidBO()) {
    return;
  }
  const buildOrderData = dataBO['build_order'];

  // Check which columns need to be displayed
  let displayColumns = new Array(columnsDescription.length).fill(false);

  for (const currentStep of buildOrderData) {  // loop on all BO steps
    // Loop on all the columns
    for (const [index, column] of columnsDescription.entries()) {
      // Colmun already validated
      if (displayColumns[index]) {
        continue;
      }

      // Check valid description
      if (!(column instanceof SinglePanelColumn)) {
        throw 'Wrong column definition.';
      }

      // No need to hide the column (even if totally absent)
      if (!column.hideIfAbsent) {
        displayColumns[index] = true;
        continue;
      }

      // Check field presence (potentially after splitting part_0/part_1/...)
      let subPart = currentStep;
      let valid = true;

      for (const subField of column.field.split('/')) {
        if (!(subField in subPart)) {
          valid = false;
          break;
        }
        subPart = subPart[subField];
      }
      if (valid) {
        if (column.displayIfPositive) {  // Check if valid number
          const num = Number(subPart);
          if (Number.isInteger(num)) {
            if (num > 0) {
              displayColumns[index] = true;
            }
          } else {
            console.log(
                'Warning: Exepcted integer for \'' + field +
                '\', but received \'' + fieldValue + '\'.');
          }
        } else {
          displayColumns[index] = true;
        }
      }
    }
  }

  // Update the columns description to only keep the ones to display
  let updatedColumnsDescription = [];

  for (const [index, column] of columnsDescription.entries()) {
    if (displayColumns[index]) {
      updatedColumnsDescription.push(column);
    }
  }

  // Create window
  let fullPageWindow = window.open('', '_blank');

  // Prepare HTML main content
  let htmlContent = '<!DOCTYPE html>\n<html lang="en">\n\n';
  htmlContent += '<head>\n';

  // Title
  htmlContent +=
      indentSpace(1) + '<title>RTS Overlay - ' + dataBO['name'] + '</title>\n';

  // Style
  htmlContent += indentSpace(1) + '<style>\n';

  htmlContent += indentSpace(2) + 'body {\n';
  htmlContent +=
      indentSpace(3) + 'font-family: Arial, Helvetica, sans-serif;\n';
  htmlContent += indentSpace(3) + 'background-color: rgb(220, 220, 220);\n';
  htmlContent += indentSpace(2) + '}\n\n';

  htmlContent += indentSpace(2) + 'table {\n';
  htmlContent += indentSpace(3) + 'color: rgb(255, 255, 255);\n';
  htmlContent += indentSpace(3) + 'background-color: rgb(70, 70, 70);\n';
  htmlContent += indentSpace(3) + 'margin: 0 auto;\n';
  htmlContent += indentSpace(3) + 'border-radius: 15px;\n';
  htmlContent += indentSpace(3) + 'border-collapse: collapse;\n';
  htmlContent += indentSpace(3) + 'margin-bottom: 30px;\n';
  htmlContent += indentSpace(2) + '}\n\n';

  htmlContent += indentSpace(2) + 'td {\n';
  htmlContent += indentSpace(3) + 'text-align: center;\n';
  htmlContent += indentSpace(3) + 'vertical-align: middle;\n';
  htmlContent += indentSpace(3) + 'padding: 10px;\n';
  htmlContent += indentSpace(2) + '}\n\n';

  htmlContent += indentSpace(2) + 'img {\n';
  htmlContent += indentSpace(3) + 'vertical-align: middle;\n';
  htmlContent += indentSpace(2) + '}\n\n';

  htmlContent += indentSpace(2) + '.note {\n';
  htmlContent += indentSpace(3) + 'text-align: left;\n';
  htmlContent += indentSpace(3) + 'padding-right: 25px;\n';
  htmlContent += indentSpace(2) + '}\n\n';

  htmlContent += indentSpace(2) + '.full_line {\n';
  htmlContent += indentSpace(3) + 'text-align: left;\n';
  htmlContent += indentSpace(3) + 'font-weight: bold;\n';
  htmlContent += indentSpace(3) + 'padding-left: 25px;\n';
  htmlContent += indentSpace(2) + '}\n\n';

  htmlContent += indentSpace(2) + '.full_line img {\n';
  htmlContent += indentSpace(3) + 'margin-right: 10px;\n';
  htmlContent += indentSpace(2) + '}\n\n';

  htmlContent += indentSpace(2) + '.border_top {\n';
  htmlContent += indentSpace(3) + 'position: relative;\n';
  htmlContent += indentSpace(2) + '}\n\n';

  htmlContent += indentSpace(2) + '.border_top::after {\n';
  htmlContent += indentSpace(3) + 'content: \'\';\n';
  htmlContent += indentSpace(3) + 'position: absolute;\n';
  htmlContent += indentSpace(3) + 'top: 0;\n';
  htmlContent += indentSpace(3) + 'left: 2.5%;\n';
  htmlContent += indentSpace(3) + 'width: 95%;\n';
  htmlContent += indentSpace(3) + 'border: 1px solid rgb(150, 150, 150);\n';
  htmlContent += indentSpace(2) + '}\n\n';

  htmlContent += indentSpace(2) + 'button {\n';
  htmlContent += indentSpace(3) + 'background-color: rgb(255, 255, 255);\n';
  htmlContent += indentSpace(3) + 'border: 1px rgb(0, 0, 0) solid;\n';
  htmlContent += indentSpace(3) + 'border-radius: 5px;\n';
  htmlContent += indentSpace(3) + 'padding-top: 3px;\n';
  htmlContent += indentSpace(3) + 'padding-bottom: 3px;\n';
  htmlContent += indentSpace(3) + 'padding-left: 6px;\n';
  htmlContent += indentSpace(3) + 'padding-right: 6px;\n';
  htmlContent += indentSpace(3) + 'margin-left: 3px;\n';
  htmlContent += indentSpace(3) + 'margin-right: 3px;\n';
  htmlContent += indentSpace(2) + '}\n\n';

  htmlContent += indentSpace(2) + 'button:hover {\n';
  htmlContent += indentSpace(3) + 'box-shadow: 2px 2px 2px rgb(0, 0, 0);\n';
  htmlContent += indentSpace(3) + 'position: relative;\n';
  htmlContent += indentSpace(3) + 'left: -2px;\n';
  htmlContent += indentSpace(3) + 'top: -2px;\n';
  htmlContent += indentSpace(2) + '}\n\n';

  htmlContent += indentSpace(2) + '.column-0 {\n';
  htmlContent += indentSpace(3) + 'padding-left: 25px;\n';
  htmlContent += indentSpace(2) + '}\n\n';

  // Style from column description
  for (const [index, column] of updatedColumnsDescription.entries()) {
    if (column.italic || column.bold || column.backgroundColor ||
        column.textAlign) {
      htmlContent += indentSpace(2) + '.column-' + index.toString() + ' {\n';

      if (column.italic) {
        htmlContent += indentSpace(3) + 'font-style: italic;\n';
      }
      if (column.bold) {
        htmlContent += indentSpace(3) + 'font-weight: bold;\n';
      }
      if (column.backgroundColor) {
        color = column.backgroundColor;
        console.assert(
            color.length == 3, 'Background color length should be of size 3.');
        htmlContent += indentSpace(3) + 'background-color: rgb(' +
            color[0].toString() + ', ' + color[1].toString() + ', ' +
            color[2].toString() + ');\n';
      }
      if (column.textAlign) {
        htmlContent +=
            indentSpace(3) + 'text-align: ' + column.textAlign + ';\n';
      }
      htmlContent += indentSpace(2) + '}\n\n';
    }
  }

  htmlContent += indentSpace(1) + '</style>\n\n';
  htmlContent += '</head>\n\n';

  // Main body
  htmlContent += '<body>\n';
  htmlContent += indentSpace(1) + '<table>\n';

  // Icons header
  htmlContent += indentSpace(2) + '<tr id="header">\n';

  for (const column of updatedColumnsDescription) {
    if (column.image) {
      htmlContent +=
          indentSpace(3) + '<td>' + getBOImageHTML(column.image) + '</td>\n';
    } else {
      indentSpace(3) + '<td></td>\n';
    }
  }
  htmlContent += indentSpace(2) + '</tr>\n';

  let lastSectionHeaderKey = null;  // last key value for section header

  // Loop on all the build order steps
  for (const currentStep of buildOrderData) {
    const notes = currentStep['notes'];

    let currentSectionHeaderKey = null;  // current key value for section header

    if (sectionsHeader) {
      // Key to check for section header
      console.assert(
          sectionsHeader.key in currentStep,
          'Current step is missing \'' + sectionsHeader.key + '\'.');
      currentSectionHeaderKey = currentStep[sectionsHeader.key];

      // Header section before first line
      if (sectionsHeader.first_line &&
          (currentSectionHeaderKey in sectionsHeader.first_line) &&
          !lastSectionHeaderKey) {
        htmlContent += indentSpace(2) + '<tr class="border_top">\n';
        htmlContent += indentSpace(3) + '<td class="full_line" colspan=8>' +
            sectionsHeader.first_line[currentSectionHeaderKey] + '</td>\n';
        htmlContent += indentSpace(2) + '</tr>\n';
      }

      // Header section before current line
      if (sectionsHeader.before &&
          (currentSectionHeaderKey in sectionsHeader.before) &&
          lastSectionHeaderKey &&
          (currentSectionHeaderKey !== lastSectionHeaderKey)) {
        htmlContent += indentSpace(2) + '<tr class="border_top">\n';
        htmlContent += indentSpace(3) + '<td class="full_line" colspan=8>' +
            sectionsHeader.before[currentSectionHeaderKey] + '</td>\n';
        htmlContent += indentSpace(2) + '</tr>\n';
      }
    }

    // Loop on the notes
    for (const [noteID, note] of enumerate(notes)) {
      // Add column content for the first line of the notes.
      if (noteID == 0) {
        htmlContent += indentSpace(2) + '<tr class="border_top">\n';

        // Loop on the columns to show
        for (const [index, column] of updatedColumnsDescription.entries()) {
          // Get the value of the current field
          const field = column.field;
          let subPart = currentStep;
          for (const subField of field.split('/')) {
            if (!(subField in subPart)) {  // field not found
              subPart = '';
              break;
            }
            subPart = subPart[subField];
          }
          let fieldValue = subPart;

          // Only show numbers > 0
          if (column.displayIfPositive && (fieldValue !== '')) {
            const num = Number(fieldValue);
            if (Number.isInteger(num)) {
              if (num <= 0) {
                fieldValue = '';
              }
            } else {
              console.log(
                  'Warning: Exepcted integer for \'' + field +
                  '\', but received \'' + fieldValue + '\'.');
            }
          }

          // Display field value
          htmlContent += indentSpace(3) + '<td class="column-' +
              index.toString() + '">' + fieldValue + '</td>\n';
        }
      }
      // Only add notes for the next lines (i.e. no column content).
      else {
        htmlContent += indentSpace(2) + '<tr>\n';
        for (let index = 0; index < updatedColumnsDescription.length; index++) {
          htmlContent += indentSpace(3) + '<td class="column-' +
              index.toString() + '"></td>\n';
        }
      }

      // Add the current note line
      htmlContent += indentSpace(3) + '<td class="note">\n' + indentSpace(4) +
          '<div>' + noteToTextImages(note) + '</div>\n' + indentSpace(3) +
          '</td>\n';
      htmlContent += indentSpace(2) + '</tr>\n';
    }

    if (sectionsHeader) {
      // Header section after current line
      if (sectionsHeader.after &&
          (currentSectionHeaderKey in sectionsHeader.after) &&
          lastSectionHeaderKey &&
          (currentSectionHeaderKey !== lastSectionHeaderKey)) {
        htmlContent += indentSpace(2) + '<tr class="border_top">\n';
        htmlContent += indentSpace(3) + '<td class="full_line" colspan=8>' +
            sectionsHeader.after[currentSectionHeaderKey] + '</td>\n';
        htmlContent += indentSpace(2) + '</tr>\n';
      }

      // Save last key value seen
      lastSectionHeaderKey = currentSectionHeaderKey;
    }
  }

  htmlContent += indentSpace(1) + '</table>\n';

  // Copy HTML for export
  const htmlContentCopy =
      JSON.parse(JSON.stringify(htmlContent)) + '</body>\n\n</html>';

  // Name for file export
  const exportName = (Object.keys(dataBO).includes('name')) ?
      dataBO.name.replaceAll(/\s+/g, '_') :
      'rts_overlay';

  // Buttons to export HTML and build order
  htmlContent += '\n<button id="export_html">Export HTML</button>\n';
  htmlContent += '\n<button id="export_bo">Export build order</button>\n';

  htmlContent += indentSpace(1) + '<script>\n';

  htmlContent += indentSpace(2) +
      'const dataHTML = ' + JSON.stringify(htmlContentCopy) + ';\n\n';
  htmlContent +=
      indentSpace(2) + 'const dataBO = ' + JSON.stringify(dataBO) + ';\n\n';

  // Export HTML
  htmlContent += indentSpace(2) +
      'document.getElementById(\'export_html\').addEventListener(\'click\', function() {\n';
  htmlContent += indentSpace(3) +
      'const fileHTML = new Blob([dataHTML], {type: \'text/plain\'});\n';
  htmlContent +=
      indentSpace(3) + 'const link = document.createElement(\'a\');\n';
  htmlContent +=
      indentSpace(3) + 'link.href = URL.createObjectURL(fileHTML);\n';
  htmlContent +=
      indentSpace(3) + 'link.download = \'' + exportName + '.html\';\n';
  htmlContent += indentSpace(3) + 'link.click();\n';
  htmlContent += indentSpace(3) + 'URL.revokeObjectURL(link.href);\n';
  htmlContent += indentSpace(2) + '});\n\n';

  // Export BO
  htmlContent += indentSpace(2) +
      'document.getElementById(\'export_bo\').addEventListener(\'click\', function() {\n';
  htmlContent += indentSpace(3) +
      'const fileBO = new Blob([JSON.stringify(dataBO, null, 4)], {type: \'text/plain\'});\n';
  htmlContent +=
      indentSpace(3) + 'const link = document.createElement(\'a\');\n';
  htmlContent += indentSpace(3) + 'link.href = URL.createObjectURL(fileBO);\n';
  htmlContent +=
      indentSpace(3) + 'link.download = \'' + exportName + '.json\';\n';
  htmlContent += indentSpace(3) + 'link.click();\n';
  htmlContent += indentSpace(3) + 'URL.revokeObjectURL(link.href);\n';
  htmlContent += indentSpace(2) + '});\n\n';

  htmlContent += indentSpace(1) + '</script>\n';

  htmlContent += '</body>\n\n</html>';

  // Update overlay HTML content
  fullPageWindow.document.write(htmlContent);
}

/**
 * Display (and create) the overlay window.
 */
function displayOverlay() {
  // Close window if already open
  if (overlayWindow !== null) {
    overlayWindow.close();
  }

  // Check if BO is valid
  const validBO = checkValidBO();

  // Create window
  overlayWindow = window.open('', '_blank', 'width=400, height=200');

  // Title
  const headContent = '<title>RTS Overlay</title>';

  // Build order initialized for step 0
  const bodyContent = '<div id="bo_panel">' +
      getBOPanelContent(true, validBO ? 0 : -1) + '</div>';

  // HTML content
  let htmlContent = '<!DOCTYPE html><html lang="en">';

  htmlContent += '\n<script>';

  htmlContent += '\nconst actionButtonHeight = ' + actionButtonHeight + ';';
  htmlContent += '\nconst overlayOnRightSide = ' + overlayOnRightSide + ';';
  htmlContent += '\nconst SLEEP_TIME = ' + SLEEP_TIME + ';';
  htmlContent += '\nconst INTERVAL_CALL_TIME = ' + INTERVAL_CALL_TIME + ';';
  htmlContent +=
      '\nconst SIZE_UPDATE_THRESHOLD = ' + SIZE_UPDATE_THRESHOLD + ';';
  htmlContent += '\nconst OVERLAY_KEYBOARD_SHORTCUTS = ' +
      JSON.stringify(OVERLAY_KEYBOARD_SHORTCUTS) + ';';
  htmlContent += '\nconst ERROR_IMAGE = "' + ERROR_IMAGE + '";';

  htmlContent += '\nconst gameName = \'' + gameName + '\';';
  htmlContent +=
      '\nconst dataBO = ' + (validBO ? JSON.stringify(dataBO) : 'null') + ';';
  htmlContent += '\nconst stepCount = ' + (validBO ? stepCount : -1) + ';';
  htmlContent += '\nlet stepID = ' + (validBO ? 0 : -1) + ';';
  htmlContent += '\nconst imagesGame = ' + JSON.stringify(imagesGame) + ';';
  htmlContent += '\nconst imagesCommon = ' + JSON.stringify(imagesCommon) + ';';
  htmlContent += '\nconst imageHeightBO = ' + imageHeightBO + ';';

  const fontsizeSlider = document.getElementById('bo_fontsize');
  htmlContent += '\nconst bo_panel_font_size = \'' +
      fontsizeSlider.value.toString(1) + 'em\';';

  // Adapt timer variables for overlay
  let timerOverlay = Object.assign({}, buildOrderTimer);  // copy the object
  timerOverlay['step_starting_flag'] =
      TIMER_STEP_STARTING_FLAG.includes(gameName);
  timerOverlay['absolute_time_init'] = getCurrentTime();
  timerOverlay['steps_ids'] = [0];
  if (gameName in TIMER_SPEED_FACTOR) {
    timerOverlay['timer_speed_factor'] = TIMER_SPEED_FACTOR[gameName];
  }
  htmlContent +=
      '\nlet buildOrderTimer = ' + JSON.stringify(timerOverlay) + ';';

  htmlContent += '\ninitOverlayWindow();';

  // Generic functions
  htmlContent += '\n' + sleep.toString();
  htmlContent += '\n' + getCurrentTime.toString();
  htmlContent += '\n' + limitValue.toString();
  htmlContent += '\n' + limitStepID.toString();
  htmlContent += '\n' + overlayResizeMove.toString();
  htmlContent += '\n' + overlayResizeMoveDelay.toString();
  htmlContent += '\n' + previousStepOverlay.toString();
  htmlContent += '\n' + nextStepOverlay.toString();
  htmlContent += '\n' + splitNoteLine.toString();
  htmlContent += '\n' + getImagePath.toString();
  htmlContent += '\n' + getImageHTML.toString();
  htmlContent += '\n' + getBOImageHTML.toString();
  htmlContent += '\n' + getResourceString.toString();
  htmlContent += '\n' + isBOImageValid.toString();
  htmlContent += '\n' + getBOImageValue.toString();
  htmlContent += '\n' + checkValidBO.toString();
  htmlContent += '\n' + noteToTextImages.toString();
  htmlContent += '\n' + getBOPanelContent.toString();
  htmlContent += '\n' + updateBOPanel.toString();
  htmlContent += '\n' + getResourceLine.toString();
  htmlContent += '\n' + updateBuildOrderTimeLabel.toString();
  htmlContent += '\n' + timerBuildOrderCall.toString();
  htmlContent += '\n' + buildOrderTimeToStr.toString();
  htmlContent += '\n' + getBuildOrderTimerStepIDs.toString();
  htmlContent += '\n' + getBuildOrderTimerStepsDisplay.toString();
  htmlContent += '\n' + switchBuildOrderTimerManual.toString();
  htmlContent += '\n' + updateBuildOrderStartStopTimerIcon.toString();
  htmlContent += '\n' + startStopBuildOrderTimer.toString();
  htmlContent += '\n' + resetBuildOrderTimer.toString();
  htmlContent += '\n' + getBuildOrderSelectedStepsAndIDs.toString();
  htmlContent += '\n' + initOverlayWindow.toString();

  // Game specific functions
  switch (gameName) {
    case 'aoe2':
      htmlContent += '\n' + getResourceLineAoE2.toString();
      break;
    case 'aoe4':
      htmlContent += '\n' + getResourceLineAoE4.toString();
      break;
    case 'aom':
      htmlContent += '\n' + getResourceLineAoM.toString();
      break;
    case 'sc2':
      htmlContent += '\n' + getResourceLineSC2.toString();
      break;
    default:
      throw 'Unknown game: ' + gameName;
  }

  htmlContent += '\n</script>';

  htmlContent += '\n<head><link rel="stylesheet" href="layout.css">' +
      headContent + '</head>';
  htmlContent +=
      '\n<body id=\"body_overlay\">' + bodyContent + '</body></html>';

  // Update overlay HTML content
  overlayWindow.document.write(htmlContent);
}


// -- Select game function -- //

/**
 * Get the main HTML content of the resource line (excluding timing).
 *
 * @param {int} currentStep  Requested step for the BO resource line.
 *
 * @returns HTML code corresponding to the requested line.
 */
function getResourceLine(currentStep) {
  switch (gameName) {
    case 'aoe2':
      return getResourceLineAoE2(currentStep);
    case 'aoe4':
      return getResourceLineAoE4(currentStep);
    case 'aom':
      return getResourceLineAoM(currentStep);
    case 'sc2':
      return getResourceLineSC2(currentStep);
    default:
      throw 'Unknown game: ' + gameName;
  }
}

/**
 * Get the images available for the game folder, sorted by sub-folder.
 *
 * @returns Dictionary with all the images per sub-folder.
 */
function getImagesGame() {
  switch (gameName) {
    case 'aoe2':
      return getImagesAoE2();
    case 'aoe4':
      return getImagesAoE4();
    case 'aom':
      return getImagesAoM();
    case 'sc2':
      return getImagesSC2();
    default:
      throw 'Unknown game: ' + gameName;
  }
}

/**
 * Convert an array with content (i.e. string lines) to <div> for HTML.
 *
 * @param {Array} content    Content as array of string lines,
 *                           '' for a vertical space.
 *
 * @returns Requested <div> content for HTML.
 */
function contentArrayToDiv(content) {
  let newParagraph = false;
  let result = '';

  // Loop on all the lines of the array
  for (const line of content) {
    if (line === '') {  // vertical space
      newParagraph = true;
    } else {  // new line with content
      result += newParagraph ? '<div class="div_space">' : '<div>';
      result += line;
      result += '</div>';

      newParagraph = false;
    }
  }

  return result;
}

/**
 * Get the RTS Overlay instructions.
 *
 * @param {boolean} evaluateTimeFlag  true if timing evaluation available.
 * @param {Array} selectFactionLines  Lines for faction selection,
 *                                    null if no indication.
 * @param {Array} externalBOLines     Lines for the external BO websites,
 *                                    null if no external BO website.
 *
 * @returns Requested instructions.
 */
function getArrayInstructions(
    evaluateTimeFlag, selectFactionLines = null, externalBOLines = null) {
  let result = [
    'Replace the text in the panel below by any build order in correct JSON format, then click on \'Open full page\' or \'Display overlay\'',
    '(appearing on the left side of the screen when the build order is valid). You will need an Always On Top application',
    'to keep the overlay visible while playing. Hover briefly on the \'Display overlay\' button to get more information.',
    '',
    'Filter and select (or delete) your stored build orders in the <b>From library</b> section.'
  ];

  if (externalBOLines) {
    result = result.concat(['']);
    result = result.concat(externalBOLines);
  }

  const buttonsLines = [
    '',
    'You can' + (externalBOLines ? ' also' : '') +
        ' manually write your build order as JSON format, using the following buttons',
    'from the <b>Design your own</b> section (some buttons only appear when the build order is valid):',
    '&nbsp &nbsp - \'Reset build order\' : Reset the build order to a minimal template (adapt the initial fields).',
    '&nbsp &nbsp - \'Add step\' : Add a step to the build order.',
    '&nbsp &nbsp - \'Format\' : Format the build order to a proper JSON indentation.',
    '&nbsp &nbsp - \'Open full page\' : Open the full build order in a new page (when ready).',
    '&nbsp &nbsp - \'Display overlay\' : Display the build order as separate overlay (when ready).'
  ];
  result = result.concat(buttonsLines);

  if (evaluateTimeFlag) {
    const timeEvaluationPart = [
      '&nbsp &nbsp - \'Evaluate time\' : Evaluate the time for each step (you can apply a timing offset if needed).'
    ];
    result = result.concat(timeEvaluationPart);
  }

  const imagesSelectionLines = [
    '',
    'In the \'Image selection\' section on the bottom right (select first <b>Design your own</b>), you can get images',
    'by selecting a category and clicking on the requested image (this will copy its value to the clipboard).',
    'You can then paste it anywhere in the text panel.'
  ];
  result = result.concat(imagesSelectionLines);

  if (selectFactionLines) {
    result = result.concat(selectFactionLines);
  }

  const validityFontSizeSavePart = [
    '',
    'The build order validity is constantly checked. If it is not valid, a message appears on top of the text panel',
    'to explain what the issue is. This message will also tell if the build order can use the timing feature.',
    '',
    'To save your build order, click on \'Add to library\' (on the left when valid build order). This will save the build order',
    'in your local storage, allowing you to load it from the <b>From library</b> section (persisting after re-opening the app).',
    'You can also click on \'Export file\' to save it as a JSON file or  \'Copy to clipboard\', to copy the build order content.',
    'To re-load a build order, drag and drop a file with the build order on the bottom text panel (or replace the text manually).',
    '',
    'It is highly recommended to download a local copy of RTS Overlay to improve the speed, work offline',
    'and customize your experience. Hover briefly on \'Download local copy\' for more information.'
  ];
  return result.concat(validityFontSizeSavePart);
}

/**
 * Get the welcome message with initial instructions for the text area.
 *
 * @returns Requested message.
 */
function getWelcomeMessage() {
  return `
Welcome to RTS Overlay! \
\n\nRTS Overlay allows you to easily design or import build orders for Real-Time Strategy games \
(select your favorite game on the left part of the screen). \
\nYour build order can then be displayed on top of the game, allowing you to use it with a single monitor. \
\nUpdating the build order step in-game is done manually via buttons/hotkeys/timer.\
\nIt does not interact with the game (no screen analysis, no controller interaction).\
\n\nHover on the information button ("i" icon on top of this panel) to read the full instructions.\
\nTooltips are available for the buttons on the left (by hovering during a short time). \
\n\nHave fun!`;
}

/**
 * Get the instructions for the currently selected game.
 *
 * @returns Requested instructions.
 */
function getInstructions() {
  switch (gameName) {
    case 'aoe2':
      return getInstructionsAoE2();
    case 'aoe4':
      return getInstructionsAoE4();
    case 'aom':
      return getInstructionsAoM();
    case 'sc2':
      return getInstructionsSC2();
    default:
      throw 'Unknown game: ' + gameName;
  }
}

/**
 * Get the factions with 3 letters shortcut and icon.
 *
 * @returns Dictionary with faction name as key,
 *          and its 3 letters + image as value.
 */
function getFactions() {
  switch (gameName) {
    case 'aoe2':
      return getFactionsAoE2();
    case 'aoe4':
      return getFactionsAoE4();
    case 'aom':
      return getFactionsAoM();
    case 'sc2':
      return getFactionsSC2();
    default:
      throw 'Unknown game: ' + gameName;
  }
}

/**
 * Get the folder containing the faction images.
 *
 * @returns Requested folder name.
 */
function getFactionImagesFolder() {
  switch (gameName) {
    case 'aoe2':
      return getFactionImagesFolderAoE2();
    case 'aoe4':
      return getFactionImagesFolderAoE4();
    case 'aom':
      return getFactionImagesFolderAoM();
    case 'sc2':
      return getFactionImagesFolderSC2();
    default:
      throw 'Unknown game: ' + gameName;
  }
}

/**
 * Check if the build order is valid.
 *
 * @param {boolean} nameBOMessage  true to add the BO name in the error message.
 *
 * @returns Array of size 2:
 *              0: true if valid build order, false otherwise.
 *              1: String indicating the error (empty if no error).
 */
function checkValidBuildOrder(nameBOMessage = false) {
  switch (gameName) {
    case 'aoe2':
      return checkValidBuildOrderAoE2(nameBOMessage);
    case 'aoe4':
      return checkValidBuildOrderAoE4(nameBOMessage);
    case 'aom':
      return checkValidBuildOrderAoM(nameBOMessage);
    case 'sc2':
      return checkValidBuildOrderSC2(nameBOMessage);
    default:
      throw 'Unknown game: ' + gameName;
  }
}

/**
 * Get one step of the build order (template).
 *
 * @param {Array} builOrderData  Array with the build order step,
 *                               null for default values.
 *
 * @returns Dictionary with the build order step template.
 */
function getBOStep(builOrderData) {
  switch (gameName) {
    case 'aoe2':
      return getBOStepAoE2(builOrderData);
    case 'aoe4':
      return getBOStepAoE4(builOrderData);
    case 'aom':
      return getBOStepAoM(builOrderData);
    case 'sc2':
      return getBOStepSC2(builOrderData);
    default:
      throw 'Unknown game: ' + gameName;
  }
}

/**
 * Get the build order template (reset build order).
 *
 * @returns Dictionary with the build order template.
 */
function getBOTemplate() {
  switch (gameName) {
    case 'aoe2':
      return getBOTemplateAoE2();
    case 'aoe4':
      return getBOTemplateAoE4();
    case 'aom':
      return getBOTemplateAoM();
    case 'sc2':
      return getBOTemplateSC2();
    default:
      throw 'Unknown game: ' + gameName;
  }
}

/**
 * Evaluate the time indications for a build order.
 *
 * @param {int} timeOffset  Offset to add on the time outputs [sec].
 */
function evaluateBOTiming(timeOffset = 0) {
  switch (gameName) {
    case 'aoe2':
      evaluateBOTimingAoE2(timeOffset);
      break;
    case 'aoe4':
      evaluateBOTimingAoE4(timeOffset);
      break;
    case 'aom':
      evaluateBOTimingAoM(timeOffset);
      break;
    default:
      return;  // no time evaluation available
  }
}

/**
 * Check it the functionality to evaluate the time is available
 * (see 'evaluateBOTiming').
 *
 * @returns true if available.
 */
function isBOTimingEvaluationAvailable() {
  switch (gameName) {
    case 'aoe2':
    case 'aoe4':
    case 'aom':
      return true;

    default:
      return false;
  }
}

/**
 * Open a new page displaying the full BO in a single panel.
 */
function openSinglePanelPage() {
  switch (gameName) {
    case 'aoe2':
      openSinglePanelPageAoE2();
      break;
    case 'aoe4':
      openSinglePanelPageAoE4();
      break;
    case 'aom':
      openSinglePanelPageAoM();
      break;
    case 'sc2':
      openSinglePanelPageSC2();
      break;
    default:
      throw 'Unknown game: ' + gameName;
  }
}


// -- Age of Empires -- //

/**
 * Check if only one specified civilization is present, for AoE games.
 *
 * @param {string} civilizationName  Requested civilization name.
 *
 * @returns true if only one specified civilization is present.
 */
function checkOnlyCivilizationAoE(civilizationName) {
  const civilizationData = dataBO['civilization'];
  if (Array.isArray(civilizationData)) {
    return civilizationData.toString() === [civilizationName].toString();
  } else {
    return civilizationData === civilizationName;
  }
}


// -- Age of Empires II (AoE2) -- //

/**
 * Get the main HTML content of the resource line (excluding timing) for AoE2.
 *
 * @param {int} currentStep  Requested step for the BO resource line.
 *
 * @returns HTML code corresponding to the requested line.
 */
function getResourceLineAoE2(currentStep) {
  let htmlString = '';

  // Folders with requested pictures
  const gamePicturesFolder = 'assets/' + gameName + '/';
  const resourceFolder = gamePicturesFolder + 'resource/';

  const resources = currentStep.resources;

  htmlString +=
      getBOImageValue(resourceFolder + 'Aoe2de_wood.png', resources, 'wood');
  htmlString +=
      getBOImageValue(resourceFolder + 'Aoe2de_food.png', resources, 'food');
  htmlString +=
      getBOImageValue(resourceFolder + 'Aoe2de_gold.png', resources, 'gold');
  htmlString +=
      getBOImageValue(resourceFolder + 'Aoe2de_stone.png', resources, 'stone');
  htmlString += getBOImageValue(
      resourceFolder + 'Aoe2de_hammer.png', resources, 'builder', true);
  htmlString += getBOImageValue(
      resourceFolder + 'MaleVillDE_alpha.png', currentStep, 'villager_count',
      true);

  // Age image
  const ageImage = {
    1: 'DarkAgeIconDE_alpha.png',
    2: 'FeudalAgeIconDE_alpha.png',
    3: 'CastleAgeIconDE_alpha.png',
    4: 'ImperialAgeIconDE_alpha.png'
  };

  if (currentStep.age in ageImage) {
    htmlString +=
        getBOImageHTML(gamePicturesFolder + 'age/' + ageImage[currentStep.age]);
  }

  return htmlString;
}

/**
 * Check if the build order is valid, for AoE2.
 *
 * @param {boolean} nameBOMessage  true to add the BO name in the error
 *                                 message.
 *
 * @returns Array of size 2:
 *              0: true if valid build order, false otherwise.
 *              1: String indicating the error (empty if no error).
 */
function checkValidBuildOrderAoE2(nameBOMessage) {
  let BONameStr = '';

  try {
    if (nameBOMessage) {
      BONameStr = dataBO['name'] + ' | ';
    }

    // Check correct civilization
    const validFactionRes = checkValidFaction(BONameStr, 'civilization', false);
    if (!validFactionRes[0]) {
      return validFactionRes;
    }

    fields = [
      new FieldDefinition('villager_count', 'integer', true),
      new FieldDefinition('age', 'integer', true, null, [-Infinity, 4]),
      new FieldDefinition('wood', 'integer', true, 'resources'),
      new FieldDefinition('food', 'integer', true, 'resources'),
      new FieldDefinition('gold', 'integer', true, 'resources'),
      new FieldDefinition('stone', 'integer', true, 'resources'),
      new FieldDefinition('builder', 'integer', false, 'resources'),
      new FieldDefinition('notes', 'array of strings', true),
      new FieldDefinition('time', 'string', false)
    ];

    return checkValidSteps(BONameStr, fields);

  } catch (e) {
    return invalidMsg(BONameStr + e);
  }
}

/**
 * Get one step of the AoE2 build order (template).
 *
 * @param {Array} builOrderData  Array with the build order step,
 *                               null for default values.
 *
 * @returns Dictionary with the build order step template.
 */
function getBOStepAoE2(builOrderData) {
  if (builOrderData && builOrderData.length >= 1) {
    const data = builOrderData.at(-1);  // Last step data
    return {
      'villager_count': ('villager_count' in data) ? data['villager_count'] : 0,
      'age': ('age' in data) ? data['age'] : 1,
      'resources': ('resources' in data) ?
          data['resources'] :
          {'wood': 0, 'food': 0, 'gold': 0, 'stone': 0},
      'notes': ['Note 1', 'Note 2']
    };
  } else {
    return {
      'villager_count': 0,
      'age': 1,
      'resources': {'wood': 0, 'food': 0, 'gold': 0, 'stone': 0},
      'notes': ['Note 1', 'Note 2']
    };
  }
}

/**
 * Get the AoE2 build order template (reset build order).
 *
 * @returns Dictionary with the build order template.
 */
function getBOTemplateAoE2() {
  return {
    'name': 'Build order name',
    'civilization': 'Generic',
    'author': 'Author',
    'source': 'Source',
    'build_order': [getBOStepAoE2(null)]
  };
}

/**
 * Get the AoE2 villager creation time.
 *
 * @param {Object} civilizationFlags  Dictionary with the civilization flags.
 * @param {int} currentAge            Current age (1: Dark Age, 2: Feudal...).
 *
 * @returns Villager creation time [sec].
 */
function getVillagerTimeAoE2(civilizationFlags, currentAge) {
  console.assert(1 <= currentAge && currentAge <= 4, 'Age expected in [1;4].');
  const genericTime = 25.0;
  if (civilizationFlags['Persians']) {
    return genericTime / (1.0 + 0.05 * currentAge);  // 5%/10%/15%/20% faster
  } else {                                           // generic
    return genericTime;
  }
}

/**
 * Get the research time to reach the next age, for AoE2.
 *
 * @param {Object} civilizationFlags  Dictionary with the civilization flags.
 * @param {int} currentAge            Current age (1: Dark Age, 2: Feudal...).
 *
 * @returns Requested age up time [sec].
 */
function getResearchAgeUpTimeAoE2(civilizationFlags, currentAge) {
  console.assert(1 <= currentAge && currentAge <= 3, 'Age expected in [1;3].');

  let genericTime = 190.0;  // # Imperial age up
  if (currentAge === 1) {   // Feudal age up
    genericTime = 130.0;
  } else if (currentAge === 2) {  // Castle age up
    genericTime = 160.0;
  }

  if (civilizationFlags['Persians']) {
    return genericTime / (1.0 + 0.05 * currentAge);  // 5%/10%/15%/20% faster
  } else if (civilizationFlags['Malay']) {
    return genericTime / 1.66;  // 66% faster
  } else {
    return genericTime;
  }
}

/**
 * Get the loom research time, for AoE2.
 *
 * @param {Object} civilizationFlags  Dictionary with the civilization flags.
 * @param {int} currentAge            Current age (1: Dark Age, 2: Feudal...).
 *
 * @returns Loom research time [sec].
 */
function getLoomTimeAoE2(civilizationFlags, currentAge) {
  console.assert(1 <= currentAge && currentAge <= 4, 'Age expected in [1;4].');
  const genericTime = 25.0;
  if (civilizationFlags['Persians']) {
    return genericTime / (1.0 + 0.05 * currentAge);  // 5%/10%/15%/20% faster
  } else if (civilizationFlags['Goths']) {
    return 0.0;  // instantaneous
  } else if (civilizationFlags['Portuguese']) {
    return genericTime / 1.25;  // 25% faster
  } else {
    return genericTime;
  }
}

/**
 * Get the wheelbarrow/handcart research time, for AoE2.
 *
 * @param {Object} civilizationFlags  Dictionary with the civilization flags.
 * @param {int} currentAge            Current age (1: Dark Age, 2: Feudal...).
 * @param {boolean} wheelbarrowFlag   true: wheelbarrow / false: handcart.
 *
 * @returns Requested research time [sec].
 */
function getWheelbarrowHandcartTimeAoE2(
    civilizationFlags, currentAge, wheelbarrowFlag) {
  console.assert(1 <= currentAge && currentAge <= 4, 'Age expected in [1;4].');
  const genericTime = wheelbarrowFlag ? 75.0 : 55.0;
  if (civilizationFlags['Persians']) {
    return genericTime / (1.0 + 0.05 * currentAge);  // 5%/10%/15%/20% faster
  } else if (civilizationFlags['Vietnamese']) {
    return genericTime / 2.0;  // 100% faster
  } else if (civilizationFlags['Vikings']) {
    return 0.0;  // free & instantaneous
  } else if (civilizationFlags['Portuguese']) {
    return genericTime / 1.25;  // 25% faster
  } else {
    return genericTime;
  }
}

/**
 * Get the town watch/patrol research time, for AoE2.
 *
 * @param {Object} civilizationFlags  Dictionary with the civilization flags.
 * @param {int} currentAge            Current age (1: Dark Age, 2: Feudal...).
 * @param {boolean} townWatchFlag     true: town watch / false: town patrol.
 *
 * @returns Requested research time [sec].
 */
function getTownWatchPatrolTimeAoE2(
    civilizationFlags, currentAge, townWatchFlag) {
  console.assert(1 <= currentAge && currentAge <= 4, 'Age expected in [1;4].');
  const genericTime = townWatchFlag ? 25.0 : 40.0;
  if (civilizationFlags['Persians']) {
    return genericTime / (1.0 + 0.05 * currentAge);  // 5%/10%/15%/20% faster
  } else if (civilizationFlags['Byzantines']) {
    return 0.0;  // free & instantaneous
  } else if (civilizationFlags['Portuguese']) {
    return genericTime / 1.25;  // 25% faster
  } else {
    return genericTime;
  }
}

/**
 * Get the research time for a given Town Center technology, for AoE2.
 *
 * @param {string} technologyName     Name of the requested technology.
 * @param {Object} civilizationFlags  Dictionary with the civilization flags.
 * @param {int} currentAge            Current age (1: Dark Age, 2: Feudal...).
 *
 * @returns Requested research time [sec].
 */
function getTownCenterResearchTimeAoE2(
    technologyName, civilizationFlags, currentAge) {
  if (technologyName === 'loom') {
    return getLoomTimeAoE2(civilizationFlags, currentAge);
  } else if (technologyName === 'wheelbarrow') {
    return getWheelbarrowHandcartTimeAoE2(civilizationFlags, currentAge, true);
  } else if (technologyName === 'handcart') {
    return getWheelbarrowHandcartTimeAoE2(civilizationFlags, currentAge, false);
  } else if (technologyName === 'town_watch') {
    return getTownWatchPatrolTimeAoE2(civilizationFlags, currentAge, true);
  } else if (technologyName === 'town_patrol') {
    return getTownWatchPatrolTimeAoE2(civilizationFlags, currentAge, false);
  } else {
    console.log(
        'Warning: unknown TC technology name \'' + technologyName + '\'.');
    return 0.0;
  }
}

/**
 * Evaluate the time indications for an AoE2 build order.
 *
 * @param {int} timeOffset  Offset to add on the time outputs [sec].
 */
function evaluateBOTimingAoE2(timeOffset) {
  // Specific civilization flags
  civilizationFlags = {
    'Bengalis': checkOnlyCivilizationAoE('Bengalis'),
    'Chinese': checkOnlyCivilizationAoE('Chinese'),
    'Goths': checkOnlyCivilizationAoE('Goths'),
    'Malay': checkOnlyCivilizationAoE('Malay'),
    'Mayans': checkOnlyCivilizationAoE('Mayans'),
    'Persians': checkOnlyCivilizationAoE('Persians'),
    'Portuguese': checkOnlyCivilizationAoE('Portuguese'),
    'Vietnamese': checkOnlyCivilizationAoE('Vietnamese'),
    'Vikings': checkOnlyCivilizationAoE('Vikings')
  }

  // Starting villagers
  let lastVillagerCount = 3;
  if (civilizationFlags['Chinese']) {
    lastVillagerCount = 6;
  } else if (civilizationFlags['Mayans']) {
    lastVillagerCount = 4;
  }

  let currentAge = 1  // Current age (1: Dark Age, 2: Feudal Age...)

  // TC technologies to research
  TCTechnologies = {
    'loom': {'researched': false, 'image': 'town_center/LoomDE.png'},
    'wheelbarrow':
        {'researched': false, 'image': 'town_center/WheelbarrowDE.png'},
    'handcart': {'researched': false, 'image': 'town_center/HandcartDE.png'},
    'town_watch': {'researched': false, 'image': 'town_center/TownWatchDE.png'},
    'town_patrol':
        {'researched': false, 'image': 'town_center/TownPatrolDE.png'}
  };

  let lastTimeSec = timeOffset;  // time of the last step

  if (!('build_order' in dataBO)) {
    console.log(
        'Warning: the "build_order" field is missing from data when evaluating the timing.');
    return;
  }

  const buildOrderData = dataBO['build_order'];
  const stepCount = buildOrderData.length;

  let nextAgeFlag = false;  // true when next age is being researched

  // Loop on all the build order steps
  for (const [currentStepID, currentStep] of enumerate(buildOrderData)) {
    stepTotalTime = 0.0;  // total time for this step

    // Villager count
    let villagerCount = currentStep['villager_count'];
    if (villagerCount < 0) {
      const resources = currentStep['resources'];
      villagerCount = Math.max(0, resources['wood']) +
          Math.max(0, resources['food']) + Math.max(0, resources['gold']) +
          Math.max(0, resources['stone']);
      if ('builder' in resources) {
        villagerCount += Math.max(0, resources['builder']);
      }
    }

    villagerCount = Math.max(lastVillagerCount, villagerCount);
    const updateVillagerCount = villagerCount - lastVillagerCount;
    lastVillagerCount = villagerCount;

    stepTotalTime += updateVillagerCount *
        getVillagerTimeAoE2(civilizationFlags, currentAge);

    // Next age
    const nextAge = (1 <= currentStep['age'] && currentStep['age'] <= 4) ?
        currentStep['age'] :
        currentAge;
    if (nextAge === currentAge + 1)  // researching next age up
    {
      stepTotalTime += getResearchAgeUpTimeAoE2(civilizationFlags, currentAge);
      nextAgeFlag = true;
    } else if (nextAgeFlag) {  // age up was just researched the step before
      if (civilizationFlags['Bengalis']) {
        // Spawn 2 villagers when reaching next age
        stepTotalTime -= 2 * getVillagerTimeAoE2(civilizationFlags, currentAge);
      }
      nextAgeFlag = false;
    }

    // Check for TC technologies in notes
    for (const note of currentStep['notes']) {
      for (const [technologyName, technologyData] of Object.entries(
               TCTechnologies)) {
        if ((!technologyData['researched']) &&
            (note.includes('@' + technologyData['image'] + '@'))) {
          stepTotalTime += getTownCenterResearchTimeAoE2(
              technologyName, civilizationFlags, currentAge);
          technologyData['researched'] = true;
        }
      }
    }

    // Update time
    lastTimeSec += stepTotalTime;

    currentAge = nextAge;  // current age update

    // Update build order with time
    currentStep['time'] = buildOrderTimeToStr(Math.round(lastTimeSec));

    // Special case for last step (add 1 sec to avoid displaying both at the
    // same time)
    if ((currentStepID === stepCount - 1) && (stepCount >= 2) &&
        (currentStep['time'] === buildOrderData[currentStepID - 1]['time'])) {
      currentStep['time'] = buildOrderTimeToStr(Math.round(lastTimeSec + 1.0));
    }
  }
}

/**
 * Get the images available for AoE2, sorted by sub-folder.
 *
 * @returns Dictionary with all the images per sub-folder.
 */
function getImagesAoE2() {
  // This is obtained using the 'python/utilities/list_images.py' script.
  const
      imagesDict =
          {
            'age':
                'AgeUnknown.png#CastleAgeIconDE.png#CastleAgeIconDE_alpha.png#DarkAgeIconDE.png#DarkAgeIconDE_alpha.png#FeudalAgeIconDE.png#FeudalAgeIconDE_alpha.png#ImperialAgeIconDE.png#ImperialAgeIconDE_alpha.png',
            'animal':
                'AoE2DE_ingame_goose_icon.png#AoE2DE_ingame_ibex_icon.png#AoE2_DE_box_turtles_icon.png#AoE2_DE_dolphin_icon.png#AoE2_DE_dorado_icon.png#AoE2_DE_marlin_icon.png#AoE2_DE_perch_icon.png#AoE2_DE_salmon_icon.png#AoE2_DE_shore_fish_icon.png#AoE2_DE_snapper_icon.png#AoE2_DE_tuna_icon.png#Boar_aoe2DE.png#CowDE.png#Deer_aoe2DE.png#Elephant_aoe2DE.png#Goat_aoe2DE.png#Llama_aoe2DE.png#Ostrich_icon_aoe2de.png#Pig_aoe2DE.png#Rhinoceros_aoe2DE.png#Sheep_aoe2DE.png#Turkey_aoe2DE.png#Yak_aoe2DE.png#Zebra_aoe2DE.png',
            'archery_range':
                'Aoe2de_DOI_elephant_archer_icon.png#ArbalestDE.png#Arbalester_aoe2DE.png#Archery_range_aoe2DE.png#Archer_aoe2DE.png#Cavalryarcher_aoe2DE.png#Crossbowman_aoe2DE.png#ElephantArcherIcon-DE.png#Elite_skirmisher_aoe2DE.png#Hand_cannoneer_aoe2DE.png#Heavycavalryarcher_aoe2de.png#ImperialSkirmisherUpgDE.png#ParthianTacticsDE.png#Skirmisher_aoe2DE.png#ThumbRingDE.png#Heavy-cavalry-archer-resear.jpg',
            'barracks':
                'Aoe2-infantry-2-pikeman.png#ArsonDE.png#Barracks_aoe2DE.png#ChampionUpgDE.png#Champion_aoe2DE.png#Eaglescout_aoe2DE.png#EagleWarriorUpgDE.png#Eaglewarrior_aoe2DE.png#EliteEagleWarriorUpgDE.png#EliteEaglewarrior_aoe2DE.png#GambesonsDE.png#HalberdierDE.png#Halberdier_aoe2DE.png#LongSwordmanUpgDE.png#Longswordsman_aoe2DE.png#ManAtArmsUpgDE.png#Manatarms_aoe2DE.png#MilitiaDE.png#PikemanUpDE.png#Spearman_aoe2DE.png#SquiresDE.png#Suplliesicon.png#TwoHandedSwordsmanUpgDE.png#Twohanded_aoe2DE.png',
            'blacksmith':
                'Blacksmith_aoe2de.png#BlastFurnaceDE.png#BodkinArrowDE.png#BracerDE.png#ChainBardingDE.png#ChainMailArmorDE.png#FletchingDE.png#Forging_aoe2de.png#IronCastingDE.png#LeatherArcherArmorDE.png#PaddedArcherArmorDE.png#PlateBardingArmorDE.png#PlateMailArmorDE.png#RingArcherArmorDE.png#ScaleBardingArmorDE.png#ScaleMailArmorDE.png',
            'castle':
                'CastleAgeUnique.png#Castle_aoe2DE.png#ConscriptionDE.png#HoardingsDE.png#Petard_aoe2DE.png#SapperDE.png#SpiesDE.png#Trebuchet_aoe2DE.png#Unique-tech-imperial.jpg',
            'civilization':
                'CivIcon-Armenians.png#CivIcon-Aztecs.png#CivIcon-Bengalis.png#CivIcon-Berbers.png#CivIcon-Bohemians.png#CivIcon-Britons.png#CivIcon-Bulgarians.png#CivIcon-Burgundians.png#CivIcon-Burmese.png#CivIcon-Byzantines.png#CivIcon-Celts.png#CivIcon-Chinese.png#CivIcon-Cumans.png#CivIcon-Dravidians.png#CivIcon-Ethiopians.png#CivIcon-Franks.png#CivIcon-Georgians.png#CivIcon-Goths.png#CivIcon-Gurjaras.png#CivIcon-Hindustanis.png#CivIcon-Huns.png#CivIcon-Incas.png#CivIcon-Indians.png#CivIcon-Italians.png#CivIcon-Japanese.png#CivIcon-Khmer.png#CivIcon-Koreans.png#CivIcon-Lithuanians.png#CivIcon-Magyars.png#CivIcon-Malay.png#CivIcon-Malians.png#CivIcon-Mayans.png#CivIcon-Mongols.png#CivIcon-Persians.png#CivIcon-Poles.png#CivIcon-Portuguese.png#CivIcon-Romans.png#CivIcon-Saracens.png#CivIcon-Sicilians.png#CivIcon-Slavs.png#CivIcon-Spanish.png#CivIcon-Tatars.png#CivIcon-Teutons.png#CivIcon-Turks.png#CivIcon-Vietnamese.png#CivIcon-Vikings.png#question_mark.png#question_mark_black.png',
            'defensive_structures':
                'Bombard_tower_aoe2DE.png#Donjon_aoe2DE.png#FortifiedWallDE.png#Gate_aoe2de.png#Krepost_aoe2de.png#Outpost_aoe2de.png#Palisade_gate_aoe2DE.png#Palisade_wall_aoe2de.png#Stone_wall_aoe2de.png#Tower_aoe2de.png',
            'dock':
                'Cannon_galleon_aoe2DE.png#CareeningDE.png#Demoraft_aoe2DE.png#Demoship_aoe2DE.png#Dock_aoe2de.png#DryDockDE.png#Elite-cannon-galleon-resear.png#Elite_cannon_galleon_aoe2de.png#Fastfireship_aoe2DE.png#Fireship_aoe2DE.png#Fire_galley_aoe2DE.png#FishingShipDE.png#Fish_trap_aoe2DE.png#GalleonUpgDE.png#Galleon_aoe2DE.png#Galley_aoe2DE.png#GillnetsDE.png#Heavydemoship_aoe2de.png#ShipwrightDE.png#Trade_cog_aoe2DE.png#Transportship_aoe2DE.png#WarGalleyDE.png#War_galley_aoe2DE.png',
            'lumber_camp':
                'BowSawDE.png#DoubleBitAxe_aoe2DE.png#Lumber_camp_aoe2de.png#TwoManSawDE.png',
            'market':
                'BankingDE.png#CaravanDE.png#CoinageDE.png#GuildsDE.png#Market_aoe2DE.png#Tradecart_aoe2DE.png',
            'mill':
                'Aoe2-icon--folwark.png#CropRotationDE.png#FarmDE.png#HeavyPlowDE.png#HorseCollarDE.png#Mill_aoe2de.png',
            'mining_camp':
                'GoldMiningDE.png#GoldShaftMiningDE.png#Mining_camp_aoe2de.png#StoneMiningDE.png#StoneShaftMiningDE.png',
            'monastery':
                'AtonementDE.png#BlockPrintingDE.png#FaithDE.png#FervorDE.png#FortifiedChurch.png#HerbalDE.png#HeresyDE.png#IlluminationDE.png#MonasteryAoe2DE.png#Monk_aoe2DE.png#RedemptionDE.png#SanctityDE.png#TheocracyDE.png',
            'other':
                'Ao2de_caravanserai_icon.png#Feitoria_aoe2DE.png#House_aoe2DE.png#MuleCart.png#Wonder_aoe2DE.png',
            'resource':
                'Aoe2de_food.png#Aoe2de_gold.png#Aoe2de_hammer.png#Aoe2de_stone.png#Aoe2de_wood.png#BerryBushDE.png#MaleVillDE_alpha.png#tree.png#MaleVillDE.jpg',
            'siege_workshop':
                'AoE2DE_Armored_Elephant_icon.png#AoE2DE_Siege_Elephant_icon.png#Battering_ram_aoe2DE.png#Bombard_cannon_aoe2DE.png#CappedRamDE.png#Capped_ram_aoe2DE.png#HeavyScorpionDE.png#Heavyscorpion_aoe2DE.png#Mangonel_aoe2DE.png#OnagerDE.png#Onager_aoe2DE.png#Scorpion_aoe2DE.png#SiegeOnagerDE.png#Siegetower_aoe2DE.png#Siege_onager_aoe2DE.png#Siege_ram_aoe2DE.png#Siege_workshop_aoe2DE.png#Siege-ram-research.jpg',
            'stable':
                'Aoe2de_camel_scout.png#Aoe2_heavycamelriderDE.png#Battle_elephant_aoe2DE.png#BloodlinesDE.png#Camelrider_aoe2DE.png#Cavalier_aoe2DE.png#EliteBattleElephantUpg.png#Elitesteppelancericon.png#EliteSteppeLancerUpgDE.png#Elite_battle_elephant_aoe2DE.png#HeavyCamelUpgDE.png#HusbandryDE.png#Hussar_aoe2DE.png#Hussar_upgrade_aoe2de.png#Knight_aoe2DE.png#Lightcavalry_aoe2DE.png#Paladin_aoe2DE.png#Scoutcavalry_aoe2DE.png#Stable_aoe2DE.png#Steppelancericon.png#Winged-hussar_upgrade.png#Cavalier-research.jpg#Light-cavalry-research.jpg#Paladin-research.jpg',
            'town_center':
                'HandcartDE.png#LoomDE.png#Towncenter_aoe2DE.png#TownPatrolDE.png#TownWatchDE.png#WheelbarrowDE.png',
            'unique_unit':
                'Aoe2-icon--houfnice.png#Aoe2-icon--obuch.png#Aoe2-icon-coustillier.png#Aoe2-icon-flemish-militia.png#Aoe2-icon-hussite-wagon.png#Aoe2-icon-serjeant.png#Aoe2de_camel_scout.png#Aoe2de_Chakram.png#Aoe2de_Ghulam.png#Aoe2de_ratha_ranged.png#Aoe2de_shrivamsha_rider.png#Aoe2de_Thirisadai.png#Aoe2de_Urumi.png#Arambaiicon-DE.png#Ballistaelephanticon-DE.png#BerserkIcon-DE.png#BoyarIcon-DE.png#CamelArcherIcon-DE.png#CaravelIcon-DE.png#CataphractIcon-DE.png#Centurion-DE.png#ChukoNuIcon-DE.png#CompositeBowman.png#CondottieroIcon-DE.png#ConquistadorIcon-DE.png#Dromon-DE.png#Flaming_camel_icon.png#GbetoIcon-DE.png#GenitourIcon-DE.png#GenoeseCrossbowmanIcon-DE.png#HuskarlIcon-DE.png#ImperialCamelRiderIcon-DE.png#Imperialskirmishericon-DE.png#JaguarWarriorIcon-DE.png#JanissaryIcon-DE.png#KamayukIcon-DE.png#Karambitwarrioricon-DE.png#Keshikicon.png#Kipchakicon.png#Konnikicon.png#Legionary-DE.png#Leitisicon.png#LongboatIcon-DE.png#LongbowmanIcon-DE.png#MagyarHuszarIcon-DE.png#MamelukeIcon-DE.png#MangudaiIcon-DE.png#MissionaryIcon-DE.png#OrganGunIcon-DE.png#PlumedArcherIcon-DE.png#Rattanarchericon-DE.png#SamuraiIcon-DE.png#Shotelwarrioricon-DE.png#SlingerIcon-DE.png#TarkanIcon-DE.png#TeutonicKnightIcon-DE.png#ThrowingAxemanIcon-DE.png#TurtleShipIcon-DE.png#WarElephantIcon-DE.png#WarWagonIcon-DE.png#WoadRaiderIcon-DE.png#Monaspa.jpg#WarriorPriest.jpg',
            'university':
                'ArchitectureDE.png#ArrowSlitsDE.png#BallisticsDE.png#BombardTower_aoe2DE.png#ChemistryDE.png#FortifiedWallDE.png#HeatedShotDE.png#Masonry_aoe2de.png#MurderHolesDE.png#SiegeEngineersDE.png#Tower_aoe2de.png#TreadmillCraneDE.png#University_AoE2_DE.png'
          };

  // Split each string (e.g. 'image_0#image_1#image_2') in a list of images.
  for (const [key, value] of Object.entries(imagesDict)) {
    imagesDict[key] = value.split('#');
  }

  return imagesDict;
}

/**
 * Get the factions with 3 letters shortcut and icon, for AoE2.
 *
 * @returns Dictionary with faction name as key,
 *          and its 3 letters + image as value.
 */
function getFactionsAoE2() {
  // AoE2 civilization Icons (with 3 letters shortcut)
  return {
    'Generic': ['GEN', 'question_mark_black.png'],
    'Armenians': ['ARM', 'CivIcon-Armenians.png'],
    'Aztecs': ['AZT', 'CivIcon-Aztecs.png'],
    'Bengalis': ['BEN', 'CivIcon-Bengalis.png'],
    'Berbers': ['BER', 'CivIcon-Berbers.png'],
    'Bohemians': ['BOH', 'CivIcon-Bohemians.png'],
    'Britons': ['BRI', 'CivIcon-Britons.png'],
    'Burgundians': ['BUG', 'CivIcon-Burgundians.png'],
    'Bulgarians': ['BUL', 'CivIcon-Bulgarians.png'],
    'Burmese': ['BUM', 'CivIcon-Burmese.png'],
    'Byzantines': ['BYZ', 'CivIcon-Byzantines.png'],
    'Celts': ['CEL', 'CivIcon-Celts.png'],
    'Chinese': ['CHI', 'CivIcon-Chinese.png'],
    'Cumans': ['CUM', 'CivIcon-Cumans.png'],
    'Dravidians': ['DRA', 'CivIcon-Dravidians.png'],
    'Ethiopians': ['ETH', 'CivIcon-Ethiopians.png'],
    'Franks': ['FRA', 'CivIcon-Franks.png'],
    'Georgians': ['GEO', 'CivIcon-Georgians.png'],
    'Goths': ['GOT', 'CivIcon-Goths.png'],
    'Gurjaras': ['GUR', 'CivIcon-Gurjaras.png'],
    'Hindustanis': ['HIN', 'CivIcon-Hindustanis.png'],
    'Huns': ['HUN', 'CivIcon-Huns.png'],
    'Incas': ['INC', 'CivIcon-Incas.png'],
    'Italians': ['ITA', 'CivIcon-Italians.png'],
    'Japanese': ['JAP', 'CivIcon-Japanese.png'],
    'Khmer': ['KHM', 'CivIcon-Khmer.png'],
    'Koreans': ['KOR', 'CivIcon-Koreans.png'],
    'Lithuanians': ['LIT', 'CivIcon-Lithuanians.png'],
    'Magyars': ['MAG', 'CivIcon-Magyars.png'],
    'Mayans': ['MAY', 'CivIcon-Mayans.png'],
    'Malay': ['MLA', 'CivIcon-Malay.png'],
    'Malians': ['MLI', 'CivIcon-Malians.png'],
    'Mongols': ['MON', 'CivIcon-Mongols.png'],
    'Persians': ['PER', 'CivIcon-Persians.png'],
    'Poles': ['POL', 'CivIcon-Poles.png'],
    'Portuguese': ['POR', 'CivIcon-Portuguese.png'],
    'Romans': ['ROM', 'CivIcon-Romans.png'],
    'Saracens': ['SAR', 'CivIcon-Saracens.png'],
    'Sicilians': ['SIC', 'CivIcon-Sicilians.png'],
    'Slavs': ['SLA', 'CivIcon-Slavs.png'],
    'Spanish': ['SPA', 'CivIcon-Spanish.png'],
    'Tatars': ['TAT', 'CivIcon-Tatars.png'],
    'Teutons': ['TEU', 'CivIcon-Teutons.png'],
    'Turks': ['TUR', 'CivIcon-Turks.png'],
    'Vietnamese': ['VIE', 'CivIcon-Vietnamese.png'],
    'Vikings': ['VIK', 'CivIcon-Vikings.png']
  };
}

/**
 * Get the folder containing the faction images, for AoE2.
 *
 * @returns Requested folder name.
 */
function getFactionImagesFolderAoE2() {
  return 'civilization';
}

/**
 * Get the instructions for AoE2.
 *
 * @returns Requested instructions.
 */
function getInstructionsAoE2() {
  const selectFactionLines = [
    'The \'select faction\' category provides all the available civilization names for the \'civilization\' field.'
  ];
  const externalBOLines = [
    'In the <b>From external website</b> section, you can get many build orders with the requested format from',
    'buildorderguide.com (you can use the shortcut on the left). Select a build order on buildorderguide.com,',
    'click on \'Copy to clipboard for RTS Overlay\', then paste the content in the text panel below.'
  ];
  return contentArrayToDiv(
      getArrayInstructions(true, selectFactionLines, externalBOLines));
}

/**
 * Open a new page displaying the full BO in a single panel, for AoE2.
 */
function openSinglePanelPageAoE2() {
  // Image folders
  const common = 'assets/common/';
  const game = 'assets/' + gameName + '/';
  const resource = game + '/resource/';

  // Description for each column
  let columnsDescription = [
    new SinglePanelColumn('time', common + 'icon/time.png'),
    new SinglePanelColumn('villager_count', resource + 'MaleVillDE_alpha.png'),
    new SinglePanelColumn('resources/builder', resource + 'Aoe2de_hammer.png'),
    new SinglePanelColumn('resources/wood', resource + 'Aoe2de_wood.png'),
    new SinglePanelColumn('resources/food', resource + 'Aoe2de_food.png'),
    new SinglePanelColumn('resources/gold', resource + 'Aoe2de_gold.png'),
    new SinglePanelColumn('resources/stone', resource + 'Aoe2de_stone.png')
  ];

  columnsDescription[0].italic = true;                      // time
  columnsDescription[0].hideIfAbsent = true;                // time
  columnsDescription[0].textAlign = 'right';                // time
  columnsDescription[1].bold = true;                        // villager count
  columnsDescription[2].hideIfAbsent = true;                // builder
  columnsDescription[3].backgroundColor = [94, 72, 56];     // wood
  columnsDescription[4].backgroundColor = [153, 94, 89];    // food
  columnsDescription[5].backgroundColor = [135, 121, 78];   // gold
  columnsDescription[6].backgroundColor = [100, 100, 100];  // stone

  // all columns, except time
  for (let i = 1; i <= 6; i++) {
    columnsDescription[i].displayIfPositive = true;
  }

  // Sections Header
  const topArrow = getBOImageHTML(common + 'icon/top_arrow.png');
  const sectionsHeader = {
    'key': 'age',  // Key to look for
    // Header before the current row
    'before': {
      2: topArrow + 'Aging up to Feudal Age',
      3: topArrow + 'Aging up to Castle Age',
      4: topArrow + 'Aging up to Imperial Age'
    },
    // Header after the current row
    'after': {
      1: getBOImageHTML(game + 'age/DarkAgeIconDE_alpha.png') + 'Dark Age',
      2: getBOImageHTML(game + 'age/FeudalAgeIconDE_alpha.png') + 'Feudal Age',
      3: getBOImageHTML(game + 'age/CastleAgeIconDE_alpha.png') + 'Castle Age',
      4: getBOImageHTML(game + 'age/ImperialAgeIconDE_alpha.png') +
          'Imperial Age'
    }
  };
  // Header for first line
  sectionsHeader['first_line'] = sectionsHeader.after;

  // Feed game description to generic function
  openSinglePanelPageFromDescription(columnsDescription, sectionsHeader);
}


// -- Age of Empires IV (AoE4) -- //

/**
 * Get the main HTML content of the resource line (excluding timing) for AoE4.
 *
 * @param {int} currentStep  Requested step for the BO resource line.
 *
 * @returns HTML code corresponding to the requested line.
 */
function getResourceLineAoE4(currentStep) {
  let htmlString = '';

  // Folders with requested pictures
  const gamePicturesFolder = 'assets/' + gameName + '/';
  const resourceFolder = gamePicturesFolder + 'resource/';

  const resources = currentStep.resources;

  htmlString +=
      getBOImageValue(resourceFolder + 'resource_food.png', resources, 'food');
  htmlString +=
      getBOImageValue(resourceFolder + 'resource_wood.png', resources, 'wood');
  htmlString +=
      getBOImageValue(resourceFolder + 'resource_gold.png', resources, 'gold');
  htmlString += getBOImageValue(
      resourceFolder + 'resource_stone.png', resources, 'stone');
  htmlString += getBOImageValue(
      resourceFolder + 'repair.png', resources, 'builder', true);
  htmlString += getBOImageValue(
      gamePicturesFolder + 'unit_worker/villager.png', currentStep,
      'villager_count', true);
  htmlString += getBOImageValue(
      gamePicturesFolder + 'building_economy/house.png', currentStep,
      'population_count', true);

  // Age image
  const ageImage =
      {1: 'age_1.png', 2: 'age_2.png', 3: 'age_3.png', 4: 'age_4.png'};

  if (currentStep.age in ageImage) {
    htmlString +=
        getBOImageHTML(gamePicturesFolder + 'age/' + ageImage[currentStep.age]);
  }

  return htmlString;
}

/**
 * Check if the build order is valid, for AoE4.
 *
 * @param {boolean} nameBOMessage  true to add the BO name in the error
 *                                 message.
 *
 * @returns Array of size 2:
 *              0: true if valid build order, false otherwise.
 *              1: String indicating the error (empty if no error).
 */
function checkValidBuildOrderAoE4(nameBOMessage) {
  let BONameStr = '';

  try {
    if (nameBOMessage) {
      BONameStr = dataBO['name'] + ' | ';
    }

    // Check correct civilization
    const validFactionRes = checkValidFaction(BONameStr, 'civilization', true);
    if (!validFactionRes[0]) {
      return validFactionRes;
    }

    fields = [
      new FieldDefinition('population_count', 'integer', true),
      new FieldDefinition('villager_count', 'integer', true),
      new FieldDefinition('age', 'integer', true, null, [-Infinity, 4]),
      new FieldDefinition('food', 'integer', true, 'resources'),
      new FieldDefinition('wood', 'integer', true, 'resources'),
      new FieldDefinition('gold', 'integer', true, 'resources'),
      new FieldDefinition('stone', 'integer', true, 'resources'),
      new FieldDefinition('builder', 'integer', false, 'resources'),
      new FieldDefinition('notes', 'array of strings', true),
      new FieldDefinition('time', 'string', false)
    ];

    return checkValidSteps(BONameStr, fields);

  } catch (e) {
    return invalidMsg(BONameStr + e);
  }
}

/**
 * Get one step of the AoE4 build order (template).
 *
 * @param {Array} builOrderData  Array with the build order step,
 *                               null for default values.
 *
 * @returns Dictionary with the build order step template.
 */
function getBOStepAoE4(builOrderData) {
  if (builOrderData && builOrderData.length >= 1) {
    const data = builOrderData.at(-1);  // Last step data
    return {
      'population_count':
          ('population_count' in data) ? data['population_count'] : -1,
      'villager_count': ('villager_count' in data) ? data['villager_count'] : 0,
      'age': ('age' in data) ? data['age'] : 1,
      'resources': ('resources' in data) ?
          data['resources'] :
          {'food': 0, 'wood': 0, 'gold': 0, 'stone': 0},
      'notes': ['Note 1', 'Note 2']
    };
  } else {
    return {
      'population_count': -1,
      'villager_count': 0,
      'age': 1,
      'resources': {'food': 0, 'wood': 0, 'gold': 0, 'stone': 0},
      'notes': ['Note 1', 'Note 2']
    };
  }
}

/**
 * Get the AoE4 build order template (reset build order).
 *
 * @returns Dictionary with the build order template.
 */
function getBOTemplateAoE4() {
  return {
    'civilization': 'Civilization name',
    'name': 'Build order name',
    'author': 'Author',
    'source': 'Source',
    'build_order': [getBOStepAoE4(null)]
  };
}

/**
 * Update the initially computed time based on the town center work rate,
 * for AoE4.
 *
 * @param {float} initialTime         Initially computed time.
 * @param {Object} civilizationFlags  Dictionary with the civilization flags.
 * @param {int} currentAge            Current age (1: Dark Age, 2: Feudal...).
 *
 * @returns Updated time based on town center work rate.
 */
function updateTownCenterTimeAoE4(initialTime, civilizationFlags, currentAge) {
  if (civilizationFlags['French']) {
    return initialTime /
        (1.0 + 0.05 * (currentAge + 1));  // 10%/15%/20%/25% faster
  } else {
    return initialTime;
  }
}

/**
 * Get the villager creation time, for AoE4.
 *
 * @param {Object} civilizationFlags  Dictionary with the civilization flags.
 * @param {int} currentAge            Current age (1: Dark Age, 2: Feudal...).
 *
 * @returns Villager creation time [sec].
 */
function getVillagerTimeAoE4(civilizationFlags, currentAge) {
  if (civilizationFlags['Dragon']) {
    return 23.0;
  } else {  // generic
    console.assert(
        1 <= currentAge && currentAge <= 4, 'Age expected in [1;4].');
    return updateTownCenterTimeAoE4(20.0, civilizationFlags, currentAge);
  }
}

/**
 * Get the training time for a non-villager unit or the research time for a
 * technology (from Town Center), for AoE4.
 *
 * @param {string} name               Name of the requested unit/technology.
 * @param {Object} civilizationFlags  Dictionary with the civilization flags.
 * @param {int} currentAge            Current age (1: Dark Age, 2: Feudal...).
 *
 * @returns Requested research time [sec].
 */
function getTownCenterUnitResearchTimeAoE4(
    name, civilizationFlags, currentAge) {
  console.assert(1 <= currentAge && currentAge <= 4, 'Age expected in [1;4].');
  if (name === 'textiles') {
    if (civilizationFlags['Delhi']) {
      return 25.0;
    } else {
      return update_town_center_time(20.0, civilizationFlags, currentAge);
    }
  } else if (name === 'imperial official') {
    // Only for Chinese in Dark Age (assuming Chinese Imperial Academy in Feudal
    // and starting with 1 for Zhu Xi).
    if (civilizationFlags['Chinese'] && (currentAge === 1)) {
      return 20.0;
    } else {
      return 0.0;
    }
  } else {
    console.log('Warning: unknown TC unit/technology name: ' + name);
    return 0.0;
  }
}

/**
 * Evaluate the time indications for an AoE4 build order.
 *
 * @param {int} timeOffset  Offset to add on the time outputs [sec].
 */
function evaluateBOTimingAoE4(timeOffset) {
  // Specific civilization flags
  civilizationFlags = {
    'Abbasid': checkOnlyCivilizationAoE('Abbasid Dynasty'),
    'Chinese': checkOnlyCivilizationAoE('Chinese'),
    'Delhi': checkOnlyCivilizationAoE('Delhi Sultanate'),
    'French': checkOnlyCivilizationAoE('French'),
    'HRE': checkOnlyCivilizationAoE('Holy Roman Empire'),
    'Jeanne': checkOnlyCivilizationAoE('Jeanne d\'Arc'),
    'Malians': checkOnlyCivilizationAoE('Malians'),
    'Dragon': checkOnlyCivilizationAoE('Order of the Dragon'),
    'Rus': checkOnlyCivilizationAoE('Rus'),
    'Zhu Xi': checkOnlyCivilizationAoE('Zhu Xi\'s Legacy')
  };

  // Starting villagers
  let lastVillagerCount = 6;
  if (civilizationFlags['Dragon'] || civilizationFlags['Zhu Xi']) {
    lastVillagerCount = 5;
  }

  let currentAge = 1;  // current age (1: Dark Age, 2: Feudal Age...)

  // TC technologies or special units
  const TCUnitTechnologies = {
    'textiles': 'technology_economy/textiles.png',
    'imperial official': 'unit_chinese/imperial-official.png'
    // The following technologies/units are not analyzed:
    //     * Banco Repairs (Malians) is usually researched after 2nd TC.
    //     * Prelate only for HRE before Castle Age, but already starting with 1
    //     prelate.
    //     * Civilizations are usually only using the starting scout, except Rus
    //     (but from Hunting Cabin).
  };

  let lastTimeSec = timeOffset;  // time of the last step

  if (!('build_order' in dataBO)) {
    console.log(
        'Warning: the \'build_order\' field is missing from data when evaluating the timing.')
    return;
  }

  let buildOrderData = dataBO['build_order'];
  const stepCount = buildOrderData.length;

  let jeanneMilitaryFlag = false;  // true when Jeanne becomes a military unit

  // Loop on all the build order steps
  for (const [currentStepID, currentStep] of enumerate(buildOrderData)) {
    let stepTotalTime = 0.0;  // total time for this step

    // villager count
    let villagerCount = currentStep['villager_count'];
    if (villagerCount < 0) {
      const resources = currentStep['resources'];
      villagerCount = Math.max(0, resources['wood']) +
          Math.max(0, resources['food']) + Math.max(0, resources['gold']) +
          Math.max(0, resources['stone']);
      if ('builder' in resources) {
        villagerCount += Math.max(0, resources['builder']);
      }
    }

    villagerCount = Math.max(lastVillagerCount, villagerCount);
    const updateVillagerCount = villagerCount - lastVillagerCount;
    lastVillagerCount = villagerCount;

    stepTotalTime += updateVillagerCount *
        getVillagerTimeAoE4(civilizationFlags, currentAge);

    // next age
    const nextAge = (1 <= currentStep['age'] && currentStep['age'] <= 4) ?
        currentStep['age'] :
        currentAge;

    // Jeanne becomes a soldier in Feudal
    if (civilizationFlags['Jeanne'] && !jeanneMilitaryFlag && (nextAge > 1)) {
      stepTotalTime += get_villager_time(
          civilizationFlags, currentAge);  // one extra villager to create
      jeanneMilitaryFlag = true;
    }

    // Check for TC technologies or special units in notes
    for (note of currentStep['notes']) {
      for (const [tcItemName, tcItemImage] of Object.entries(
               TCUnitTechnologies)) {
        if (note.includes('@' + tcItemImage + '@')) {
          stepTotalTime += getTownCenterUnitResearchTimeAoE4(
              tcItemName, civilizationFlags, currentAge);
        }
      }
    }

    // Update time
    lastTimeSec += stepTotalTime;

    currentAge = nextAge;  // current age update

    // Update build order with time
    currentStep['time'] = buildOrderTimeToStr(Math.round(lastTimeSec));

    // Special case for last step
    // (add 1 sec to avoid displaying both at the same time).
    if ((currentStepID === stepCount - 1) && (stepCount >= 2) &&
        (currentStep['time'] === buildOrderData[currentStepID - 1]['time'])) {
      currentStep['time'] = buildOrderTimeToStr(Math.round(lastTimeSec + 1.0));
    }
  }
}

/**
 * Get the images available for AoE4, sorted by sub-folder.
 *
 * @returns Dictionary with all the images per sub-folder.
 */
function getImagesAoE4() {
  // This is obtained using the 'python/utilities/list_images.py' script.
  const
      imagesDict =
          {
            'abilities': 'attack-move.png#repair.png#ronin_hire_single.png',
            'ability_chinese': 'collect_tax.png#supervise.png',
            'ability_jeanne':
                'ability-champion-companions-1.png#ability-consecrate-1.png#ability-divine-arrow-1.png#ability-divine-restoration-1.png#ability-field-commander-1.png#ability-gunpowder-monarch-1.png#ability-holy-wrath-1.png#ability-path-of-the-archer-1.png#ability-path-of-the-warrior-1.png#ability-rider-companions-1.png#ability-riders-ready-1.png#ability-strength-of-heaven-1.png#ability-to-arms-men-1.png#ability-valorous-inspiration-1.png',
            'ability_lancaster':
                'call_to_arms.png#earls_guard.png#hammer_throw.png#lancaster_patronage.png#lord_of_lancaster_aura.png#manor_ability.png#platemail_puncturing_projectile.png#shire_levy_2.png#shire_levy_3.png#silver_prospecting.png',
            'ability_templar':
                'battle_glory.png#castille_aura.png#confrere_aura.png#gunpowder_resistance.png#knightly_brotherhood.png#landscape_preservation.png#pilgrim_ability.png#pilgrim_loan_lrg.png#pilgrim_loan_med.png#pilgrim_loan_sml.png#spearman_aura.png#szlachta_atk_speed_reduction.png#teutonic_wrath.png',
            'age':
                'age_1.png#age_2.png#age_3.png#age_4.png#age_unknown.png#goldenagetier1.png#goldenagetier2.png#goldenagetier3.png#goldenagetier4.png#goldenagetier5.png#vizier_point.png',
            'building_byzantines':
                'aqueduct-1.png#cistern-1.png#mercenary-house-2.png#olive-grove-1.png',
            'building_chinese': 'granary.png#pagoda.png#village.png',
            'building_defensive':
                'keep.png#outpost.png#palisade-gate.png#palisade-wall.png#stone-wall-gate.png#stone-wall-tower.png#stone-wall.png',
            'building_economy':
                'farm.png#house.png#lumber-camp.png#market.png#mill.png#mining-camp.png#town-center.png',
            'building_japanese':
                'buddhist-temple-3.png#castle-4.png#farmhouse-1.png#forge-1.png#shinto-shrine-3.png',
            'building_lancaster': 'manor.png',
            'building_malians':
                'cattle-ranch-2.png#pit-mine-1.png#toll-outpost-1.png',
            'building_military':
                'archery-range.png#barracks.png#dock.png#siege-workshop.png#stable.png',
            'building_mongols': 'ger.png#ovoo.png#pasture.png#prayer-tent.png',
            'building_ottomans': 'military-school-1.png',
            'building_poi':
                'forgotten_ruins.png#koth_site.png#merchant_camp.png#point_of_interest.png#ronin_building.png#ruined_outpost.png#wolf_den.png',
            'building_religious': 'monastery.png#mosque.png',
            'building_rus':
                'fortified-palisade-gate.png#fortified-palisade-wall.png#hunting-cabin.png#wooden-fortress.png',
            'building_technology': 'blacksmith.png#madrasa.png#university.png',
            'civilization_flag':
                'abb.png#ang.png#ant.png#ayy.png#byz.png#chi.png#CivIcon-AbbasidAoE4.png#CivIcon-AbbasidAoE4_spacing.png#CivIcon-AyyubidsAoE4.png#CivIcon-AyyubidsAoE4_spacing.png#CivIcon-ByzantinesAoE4.png#CivIcon-ByzantinesAoE4_spacing.png#CivIcon-ChineseAoE4.png#CivIcon-ChineseAoE4_spacing.png#CivIcon-DelhiAoE4.png#CivIcon-DelhiAoE4_spacing.png#CivIcon-EnglishAoE4.png#CivIcon-EnglishAoE4_spacing.png#CivIcon-FrenchAoE4.png#CivIcon-FrenchAoE4_spacing.png#CivIcon-HouseofLancasterAoE4.png#CivIcon-HouseofLancasterAoE4_spacing.png#CivIcon-HREAoE4.png#CivIcon-HREAoE4_spacing.png#CivIcon-JapaneseAoE4.png#CivIcon-JapaneseAoE4_spacing.png#CivIcon-JeanneDArcAoE4.png#CivIcon-JeanneDArcAoE4_spacing.png#CivIcon-KnightsTemplarAoE4.png#CivIcon-KnightsTemplarAoE4_spacing.png#CivIcon-MaliansAoE4.png#CivIcon-MaliansAoE4_spacing.png#CivIcon-MongolsAoE4.png#CivIcon-MongolsAoE4_spacing.png#CivIcon-OrderOfTheDragonAoE4.png#CivIcon-OrderOfTheDragonAoE4_spacing.png#CivIcon-OttomansAoE4.png#CivIcon-OttomansAoE4_spacing.png#CivIcon-RusAoE4.png#CivIcon-RusAoE4_spacing.png#CivIcon-ZhuXiLegacyAoE4.png#CivIcon-ZhuXiLegacyAoE4_spacing.png#del.png#dra.png#eng.png#fre.png#gen.png#hol.png#hos.png#hre.png#jap.png#jda.png#koc.png#kof.png#kte.png#mal.png#mon.png#ott.png#pol.png#rus.png#teu.png#ven.png#zxl.png',
            'landmark_abbasid':
                'culture-wing.png#economic-wing.png#house-of-wisdom.png#military-wing.png#prayer-hall-of-uqba.png#trade-wing.png',
            'landmark_byzantines':
                'cathedral-of-divine-wisdom-4.png#cistern-of-the-first-hill-2.png#foreign-engineering-company-3.png#golden-horn-tower-2.png#grand-winery-1.png#imperial-hippodrome-1.png#palatine-school-3.png',
            'landmark_chinese':
                'astronomical-clocktower.png#barbican-of-the-sun.png#enclave-of-the-emperor.png#great-wall-gatehouse.png#imperial-academy.png#imperial-palace.png#spirit-way.png',
            'landmark_delhi':
                'compound-of-the-defender.png#dome-of-the-faith.png#great-palace-of-agra.png#hisar-academy.png#house-of-learning.png#palace-of-the-sultan.png#tower-of-victory.png',
            'landmark_english':
                'abbey-of-kings.png#berkshire-palace.png#cathedral-of-st-thomas.png#council-hall.png#kings-palace.png#the-white-tower.png#wynguard-palace.png',
            'landmark_french':
                'chamber-of-commerce.png#college-of-artillery.png#guild-hall.png#notre-dame.png#red-palace.png#royal-institute.png#school-of-cavalry.png',
            'landmark_hre':
                'aachen-chapel.png#burgrave-palace.png#elzbach-palace.png#great-palace-of-flensburg.png#meinwerk-palace.png#palace-of-swabia.png#regnitz-cathedral.png',
            'landmark_japanese':
                'castle-of-the-crow-4.png#floating-gate-2.png#koka-township-1.png#kura-storehouse-1.png#tanegashima-gunsmith-3.png#temple-of-equality-2.png#tokugawa-shrine-4.png',
            'landmark_lancaster': 'kings_college.png#lancaster_castle.png',
            'landmark_malians':
                'farimba-garrison-2.png#fort-of-the-huntress-3.png#grand-fulani-corral-2.png#great-mosque-4.png#griot-bara-3.png#mansa-quarry-2.png#saharan-trade-network-1.png',
            'landmark_mongols':
                'deer-stones.png#khaganate-palace.png#kurultai.png#monument-of-the-great-khan.png#steppe-redoubt.png#the-silver-tree.png#the-white-stupa.png',
            'landmark_ottomans':
                'azure-mosque-4.png#istanbul-imperial-palace-2.png#istanbul-observatory-3.png#mehmed-imperial-armory-2.png#sea-gate-castle-3.png#sultanhani-trade-network-1.png#twin-minaret-medrese-1.png',
            'landmark_rus':
                'abbey-of-the-trinity.png#cathedral-of-the-tsar.png#high-armory.png#high-trade-house.png#kremlin.png#spasskaya-tower.png#the-golden-gate.png',
            'landmark_templar': 'fortress.png',
            'landmark_zhuxi':
                'jiangnan-tower-2.png#meditation-gardens-1.png#mount-lu-academy-1.png#shaolin-monastery-2.png#temple-of-the-sun-3.png#zhu-xis-library-3.png',
            'resource':
                'berrybush.png#boar.png#bounty.png#cattle.png#deer.png#fish.png#gaiatreeprototypetree.png#oliveoil.png#rally.png#relics.png#repair.png#resource_food.png#resource_gold.png#resource_stone.png#resource_wood.png#sacred_sites.png#sheep.png#time.png#wolf.png',
            'technology_abbasid':
                'agriculture.png#armored-caravans.png#boot-camp.png#camel-handling.png#camel-rider-barding-4.png#camel-rider-shields.png#camel-support.png#composite-bows.png#faith.png#fertile-crescent-2.png#fresh-foodstuffs.png#grand-bazaar.png#improved-processing.png#medical-centers.png#phalanx.png#preservation-of-knowledge.png#public-library.png#spice-roads.png#teak-masts.png',
            'technology_ayyubids':
                'culture-wing-advancement-1.png#culture-wing-logistics-1.png#economic-wing-growth-1.png#economic-wing-industry-1.png#infantry-support-4.png#military-wing-master-smiths-1.png#military-wing-reinforcement-1.png#phalanx-2.png#siege-carpentry-3.png#sultans-mamluks-3.png#trade-wing-advisors-1.png#trade-wing-bazaar-1.png',
            'technology_byzantines':
                'border-settlements-2.png#eastern-mercenary-contract-1.png#elite-mercenaries-4.png#expilatores-2.png#ferocious-speed-4.png#greek-fire-projectiles-4.png#heavy-dromon-3.png#liquid-explosives-3.png#numeri-4.png#silk-road-mercenary-contract-1.png#teardrop-shields-3.png#trapezites-2.png#veteran-mercenaries-3.png#western-mercenary-contract-1.png',
            'technology_chinese':
                'ancient-techniques.png#battle-hardened.png#extra-hammocks.png#extra-materials.png#handcannon-slits.png#imperial-examination.png#pyrotechnics.png#reload-drills.png#reusable-barrels.png#thunderclap-bombs-4.png',
            'technology_defensive':
                'arrow-slits.png#boiling-oil.png#cannon-emplacement.png#court-architects.png#fortify-outpost.png#springald-emplacement.png',
            'technology_delhi':
                'all-seeing-eye.png#armored-beasts.png#efficient-production.png#forced-march.png#hearty-rations.png#honed-blades.png#lookout-towers.png#mahouts.png#manuscript-trade-1.png#paiks.png#reinforced-foundations.png#salvaged-materials.png#sanctity.png#siege-elephant.png#slow-burning-defenses.png#swiftness.png#tranquil-venue.png#village-fortresses.png#zeal.png',
            'technology_dragon':
                'bodkin-bolts-4.png#dragon-fire-2.png#dragon-scale-leather-3.png#golden-cuirass-2.png#war-horses-4.png#zornhau-3.png',
            'technology_economy':
                'acid-distilization.png#crosscut-saw.png#cupellation.png#double-broadaxe.png#drift-nets.png#extended-lines.png#fertilization.png#forestry.png#horticulture.png#lumber-preservation.png#precision-cross-breeding.png#professional-scouts.png#shaft-mining.png#specialized-pick.png#survival-techniques.png#textiles.png#wheelbarrow.png',
            'technology_english':
                'admiralty-2.png#armor-clad.png#arrow-volley.png#enclosures.png#network-of-citadels.png#setup-camp.png#shattering-projectiles.png',
            'technology_french':
                'cantled-saddles.png#chivalry.png#crossbow-stirrups.png#enlistment-incentives.png#gambesons.png#long-guns.png#merchant-guilds-4.png#royal-bloodlines.png',
            'technology_hre':
                'awl-pike.png#benediction.png#cistercian-churches.png#devoutness.png#fire-stations.png#heavy-maces.png#inspired-warriors.png#marching-drills.png#reinforced-defenses.png#riveted-chain-mail-2.png#slate-and-stone-construction.png#steel-barding-3.png#two-handed-weapon.png',
            'technology_japanese':
                'bunrei.png#copper-plating-3.png#daimyo-manor-1.png#daimyo-palace-2.png#do-maru-armor-4.png#explosives-4.png#five_ministries.png#fudasashi-3.png#gion_festival.png#heated-shot-4.png#hizukuri-2.png#kabura-ya-whistling-arrow-3.png#kobuse-gitae-3.png#nagae-yari-4.png#nehan.png#oda-tactics-4.png#odachi-3.png#shinto_rituals.png#shogunate-castle-3.png#swivel-cannon-4.png#takezaiku-2.png#tatara-1.png#towara-1.png#yaki-ire-4.png#zen.png',
            'technology_jeanne':
                'companion-equipment-3.png#ordinance-company-3.png',
            'technology_lancaster':
                'billmen.png#burgundian_imports.png#collar_of_esses.png#condensed_land_practices.png#earlguardupgrade.png#hill_land_training.png#hobelar_upgrade_age3.png#hobelar_upgrade_age4.png#modern_military_tactics.png#open_field_system.png#padded_jack.png#scutage.png#ships_of_the_crown.png#synchronized_shot.png#warwolf_trebuchet.png#yeoman_upgrade_age3.png#yeoman_upgrade_age4.png',
            'technology_malians':
                'banco-repairs-2.png#canoe-tactics-2.png#farima-leadership-4.png#imported-armor-3.png#local-knowledge-4.png#poisoned-arrows-3.png#precision-training-4.png',
            'technology_military':
                'angled-surfaces.png#balanced-projectiles.png#biology.png#bloomery.png#chemistry.png#damascus-steel.png#decarbonization.png#elite-army-tactics.png#fitted-leatherwork.png#geometry.png#greased-axles.png#incendiary-arrows.png#insulated-helm.png#iron-undermesh.png#master-smiths.png#military-academy.png#platecutter-point.png#serpentine-powder.png#siege-engineering.png#siege-works.png#silk-bowstrings.png#steeled-arrow.png#wedge-rivets.png',
            'technology_mongols':
                'additional-torches.png#improved_production.png#monastic-shrines.png#piracy.png#raid-bounty.png#siha-bow-limbs.png#steppe-lancers.png#stone-bounty.png#stone-commerce.png#superior-mobility.png#whistling-arrows.png#yam-network.png',
            'technology_naval':
                'additional-sails.png#armored-hull.png#chaser-cannons.png#explosives.png#extra-ballista.png#incendiaries-3.png#naval-arrow-slits.png#navigator-lookout.png#shipwrights-4.png#springald-crews-3.png',
            'technology_ottomans':
                'advanced-academy-1.png#anatolian-hills-1.png#extensive-fortifications.png#fast-training-1.png#field-work-1.png#great-bombard-emplacement.png#great-bombard-vizier.png#imperial-fleet-4.png#janissary-company-1.png#janissary-guns-4.png#mehter-drums-1.png#military-campus-1.png#pax-ottomana.png#siege-crews-1.png#timariots.png#trade-bags-1.png',
            'technology_religious':
                'herbal-medicine.png#piety.png#tithe-barns.png',
            'technology_rus':
                'adaptable-hulls-3.png#banded-arms.png#blessing-duration.png#boyars-fortitude.png#castle-turret.png#castle-watch.png#cedar-hulls.png#clinker-construction.png#double-time.png#fine-tuned-guns.png#improved-blessing.png#knight-sabers.png#mounted-training.png#saints-reach.png#saints-veneration-4.png#siege-crew-training.png#wandering-town.png#warrior_scout_2.png',
            'technology_templar':
                'brigandine.png#cavalier_confrere_upgrade_age3.png#cavalier_confrere_upgrade_age4.png#counterweight_defenses.png#cranequins.png#crusader_fleets.png#desert_citadel.png#desert_outpost.png#fanaticism.png#genitour_upgrade_age4.png#genoese_crossbowman_age4.png#heavy_spearman_age4.png#iron_clamps.png#knighthospitaller_age3.png#knighthospitaller_age4.png#lettre_de_change.png#ruleoftemplar.png#safepassage.png#sanctuary.png#serjeant_age3_up.png#serjeant_age4_up.png#templarbrother_age4.png#treasure_tower.png#trebuchet_emplacement.png',
            'technology_units':
                'adjustable-crossbars.png#lightweight-beams-4.png#roller-shutter-triggers.png#spyglass-4.png',
            'technology_zhuxi':
                '10000-bolts-4.png#advanced-administration-4.png#bolt-magazines.png#cloud-of-terror-4.png#dali-horses.png#dynastic-protectors-4.png#hard-cased-bombs.png#imperial-red-seals-3.png#military-affairs-bureau-1.png#roar-of-the-dragon-4.png',
            'unit_abbasid':
                'camel-archer-2.png#camel-rider-3.png#ghulam-3.png#imam.png#trade-caravan-1.png',
            'unit_ayyubids':
                'atabeg-1.png#bedouin-skirmisher-2.png#bedouin-swordsman-1.png#camel-lancer-3.png#dervish-3.png#desert-raider-2.png#manjaniq-3.png#tower-of-the-sultan-3.png',
            'unit_byzantines':
                'arbaletrier-3.png#camel-archer-2.png#camel-rider-3.png#cataphract-3.png#cheirosiphon-3.png#desert-raider-2.png#dromon-2.png#ghulam-3.png#grenadier-4.png#horse-archer-3.png#javelin-thrower-2.png#keshik-2.png#landsknecht-3.png#limitanei-1.png#longbowman-2.png#mangudai.png#musofadi-warrior-2.png#royal-knight-2.png#sipahi-2.png#streltsy.png#tower-elephant-3.png#tower-of-the-sultan-3.png#varangian-guard-3.png#war-elephant.png#zhuge-nu-2.png',
            'unit_cavalry':
                'horseman-1.png#knight-2.png#lancer-3.png#lancer-4.png#scout.png',
            'unit_chinese':
                'fire-lancer-3.png#grenadier-4.png#imperial-official.png#junk.png#nest-of-bees.png#palace-guard-3.png#zhuge-nu-2.png',
            'unit_delhi':
                'ghazi-raider-2.png#scholar.png#sultans-elite-tower-elephant-4.png#tower-elephant-3.png#war-elephant.png',
            'unit_dragon':
                'dragon-handcannoneer-4.png#gilded-archer-2.png#gilded-crossbowman-3.png#gilded-horseman-2.png#gilded-knight-3.png#gilded-landsknecht-3.png#gilded-man-at-arms-2.png#gilded-spearman-1.png',
            'unit_english':
                'king-2.png#longbowman-2.png#wynguard-army-1.png#wynguard-footmen-1.png#wynguard-raiders-1.png#wynguard-ranger-4.png',
            'unit_events': 'land_monster.png#water_monster.png',
            'unit_french':
                'arbaletrier-3.png#cannon-4.png#galleass.png#royal-cannon-4.png#royal-culverin-4.png#royal-knight-2.png#royal-ribauldequin-4.png#war-cog.png',
            'unit_hre': 'black-rider-1.png#landsknecht-3.png#prelate.png',
            'unit_infantry':
                'archer-2.png#crossbowman-3.png#handcannoneer-4.png#man-at-arms-1.png#ronin_unit.png#spearman-1.png',
            'unit_japanese':
                'atakebune-4.png#buddhist-monk-3.png#katana-bannerman-2.png#mounted-samurai-3.png#onna-bugeisha-2.png#onna-musha-3.png#ozutsu-4.png#samurai-1.png#shinobi-2.png#shinto-priest-3.png#uma-bannerman-2.png#yumi-ashigaru-2.png#yumi-bannerman-2.png',
            'unit_jeanne':
                'jeanne-darc-blast-cannon-4.png#jeanne-darc-hunter-2.png#jeanne-darc-knight-3.png#jeanne-darc-markswoman-4.png#jeanne-darc-mounted-archer-3.png#jeanne-darc-peasant-1.png#jeanne-darc-woman-at-arms-2.png#jeannes-champion-3.png#jeannes-rider-3.png',
            'unit_lancaster':
                'champion.png#demilancer.png#earlretinue.png#elitechampion.png#garrisoncommand.png#gunpowder_contingent.png#hobelar_age2.png#hobelar_age3.png#hobelar_age4.png#lord_lancaster.png#yeoman_age2.png#yeoman_age3.png#yeoman_age4.png',
            'unit_malians':
                'donso-1.png#freeborn-mansa.png#hunting-canoe-2.png#javelin-thrower-2.png#javelin-thrower-mansa.png#musofadi-gunner-4.png#musofadi-mansa.png#musofadi-warrior-2.png#sofa-2.png#war-canoe-2.png#warrior-scout-2.png',
            'unit_mongols':
                'huihui-pao-1.png#keshik-2.png#khan-1.png#khans-hunter.png#light-junk.png#mangudai.png#shaman.png#traction-trebuchet.png',
            'unit_ottomans':
                'grand-galley-4.png#great-bombard-4.png#janissary-3.png#mehter-2.png#scout-ship-2.png#sipahi-2.png',
            'unit_religious': 'imam-3.png#monk-3.png',
            'unit_rus':
                'horse-archer-3.png#lodya-attack-ship.png#lodya-demolition-ship.png#lodya-fishing-boat.png#lodya-galley-3.png#lodya-trade-ship.png#lodya-transport-ship.png#militia-2.png#streltsy.png#warrior-monk.png',
            'unit_ship':
                'baghlah.png#baochuan.png#carrack.png#demolition-ship.png#dhow.png#explosive-dhow.png#explosive-junk.png#fishing-boat.png#galley.png#hulk.png#junk-3.png#light-junk-2.png#trade-ship.png#transport-ship.png#war-junk.png#xebec.png',
            'unit_siege':
                'battering-ram.png#bombard.png#culverin-4.png#mangonel-3.png#ribauldequin-4.png#siege-tower.png#springald.png#trebuchet.png',
            'unit_templar':
                'chevalier_confrere_age_2.png#chevalier_confrere_age_3.png#chevalier_confrere_age_4.png#condottiere.png#genitour_age_3.png#genitour_age_4.png#genoese_crossbowman_age_3.png#genoese_crossbowman_age_4.png#heavy_spearman_age_3.png#heavy_spearman_age_4.png#hospitaller_knight_age_2.png#hospitaller_knight_age_3.png#hospitaller_knight_age_4.png#king_baldwin_iv.png#odo_of_st_amand.png#pilgrim.png#serjeant_age_2.png#serjeant_age_3.png#serjeant_age_4.png#szlachta_age_4.png#templar_brother_age_3.png#templar_brother_age_4.png#teutonic_knight.png#venetian_galley.png',
            'unit_worker':
                'monk-3.png#trader.png#villager-abbasid.png#villager-china.png#villager-delhi.png#villager-japanese.png#villager-malians.png#villager-mongols.png#villager-ottomans.png#villager.png',
            'unit_zhuxi':
                'imperial-guard-1.png#shaolin-monk-3.png#yuan-raider-4.png'
          };

  // Split each string (e.g. 'image_0#image_1#image_2') in a list of images.
  for (const [key, value] of Object.entries(imagesDict)) {
    imagesDict[key] = value.split('#');
  }

  return imagesDict;
}

/**
 * Get the factions with 3 letters shortcut and icon, for AoE4.
 *
 * @returns Dictionary with faction name as key,
 *          and its 3 letters + image as value.
 */
function getFactionsAoE4() {
  return {
    'Abbasid Dynasty': ['ABB', 'CivIcon-AbbasidAoE4.png'],
    'Ayyubids': ['AYY', 'CivIcon-AyyubidsAoE4.png'],
    'Byzantines': ['BYZ', 'CivIcon-ByzantinesAoE4.png'],
    'Chinese': ['CHI', 'CivIcon-ChineseAoE4.png'],
    'Delhi Sultanate': ['DEL', 'CivIcon-DelhiAoE4.png'],
    'English': ['ENG', 'CivIcon-EnglishAoE4.png'],
    'French': ['FRE', 'CivIcon-FrenchAoE4.png'],
    'House of Lancaster': ['HOL', 'CivIcon-HouseofLancasterAoE4.png'],
    'Holy Roman Empire': ['HRE', 'CivIcon-HREAoE4.png'],
    'Japanese': ['JAP', 'CivIcon-JapaneseAoE4.png'],
    'Jeanne d\'Arc': ['JDA', 'CivIcon-JeanneDArcAoE4.png'],
    'Knights Templar': ['KTP', 'CivIcon-KnightsTemplarAoE4.png'],
    'Malians': ['MAL', 'CivIcon-MaliansAoE4.png'],
    'Mongols': ['MON', 'CivIcon-MongolsAoE4.png'],
    'Order of the Dragon': ['OOD', 'CivIcon-OrderOfTheDragonAoE4.png'],
    'Ottomans': ['OTT', 'CivIcon-OttomansAoE4.png'],
    'Rus': ['RUS', 'CivIcon-RusAoE4.png'],
    'Zhu Xi\'s Legacy': ['ZXL', 'CivIcon-ZhuXiLegacyAoE4.png']
  };
}

/**
 * Get the folder containing the faction images, for AoE4.
 *
 * @returns Requested folder name.
 */
function getFactionImagesFolderAoE4() {
  return 'civilization_flag';
}

/**
 * Get the instructions for AoE4.
 *
 * @returns Requested instructions.
 */
function getInstructionsAoE4() {
  const selectFactionLines = [
    'The \'select faction\' category provides all the available civilization names for the \'civilization\' field.'
  ];
  const externalBOLines = [
    'In the <b>From external website</b> section, you can get many build orders with the requested format from',
    'aoe4guides.com or age4builder.com (use the shortcuts on the left). On aoe4guides.com, select a build order,',
    'click on the 3 dots (upper right corner), click on the \'Overlay Tool\' copy button, and paste the content below.',
    'On age4builder.com, select a build order, click on the salamander icon, and paste the content below.'
  ];
  return contentArrayToDiv(
      getArrayInstructions(true, selectFactionLines, externalBOLines));
}

/**
 * Open a new page displaying the full BO in a single panel, for AoE4.
 */
function openSinglePanelPageAoE4() {
  // Image folders
  const common = 'assets/common/';
  const game = 'assets/' + gameName + '/';
  const resource = game + '/resource/';

  // Description for each column
  let columnsDescription = [
    new SinglePanelColumn('time', common + 'icon/time.png'),
    new SinglePanelColumn(
        'population_count', game + 'building_economy/house.png'),
    new SinglePanelColumn('villager_count', game + 'unit_worker/villager.png'),
    new SinglePanelColumn('resources/builder', resource + 'repair.png'),
    new SinglePanelColumn('resources/food', resource + 'resource_food.png'),
    new SinglePanelColumn('resources/wood', resource + 'resource_wood.png'),
    new SinglePanelColumn('resources/gold', resource + 'resource_gold.png'),
    new SinglePanelColumn('resources/stone', resource + 'resource_stone.png')
  ];

  columnsDescription[0].italic = true;                      // time
  columnsDescription[0].hideIfAbsent = true;                // time
  columnsDescription[0].textAlign = 'right';                // time
  columnsDescription[1].hideIfAbsent = true;                // population count
  columnsDescription[2].bold = true;                        // villager count
  columnsDescription[3].hideIfAbsent = true;                // builder
  columnsDescription[4].backgroundColor = [153, 94, 89];    // food
  columnsDescription[5].backgroundColor = [94, 72, 56];     // wood
  columnsDescription[6].backgroundColor = [135, 121, 78];   // gold
  columnsDescription[7].backgroundColor = [100, 100, 100];  // stone

  // all columns, except time
  for (let i = 1; i <= 7; i++) {
    columnsDescription[i].displayIfPositive = true;
  }

  // Sections Header
  const sectionsHeader = {
    'key': 'age',  // Key to look for
    // Header before the current row
    'before': {
      1: getBOImageHTML(game + 'age/age_1.png') + 'Dark Age',
      2: getBOImageHTML(game + 'age/age_2.png') + 'Feudal Age',
      3: getBOImageHTML(game + 'age/age_3.png') + 'Castle Age',
      4: getBOImageHTML(game + 'age/age_4.png') + 'Imperial Age'
    }
  };
  // Header for first line
  sectionsHeader['first_line'] = sectionsHeader.before;

  // Feed game description to generic function
  openSinglePanelPageFromDescription(columnsDescription, sectionsHeader);
}


// -- Age of Mythology (AoM) -- //

/**
 * Get the main HTML content of the resource line (excluding timing) for AoM.
 *
 * @param {int} currentStep  Requested step for the BO resource line.
 *
 * @returns HTML code corresponding to the requested line.
 */
function getResourceLineAoM(currentStep) {
  let htmlString = '';

  // Folders with requested pictures
  const gamePicturesFolder = 'assets/' + gameName + '/';
  const resourceFolder = gamePicturesFolder + 'resource/';

  const resources = currentStep.resources;

  if (isBOImageValid(resources, 'food', true) ||
      isBOImageValid(resources, 'wood', true) ||
      isBOImageValid(resources, 'gold', true) ||
      isBOImageValid(resources, 'favor', true)) {
    htmlString +=
        getBOImageValue(resourceFolder + 'food.png', resources, 'food');
    htmlString +=
        getBOImageValue(resourceFolder + 'wood.png', resources, 'wood');
    htmlString +=
        getBOImageValue(resourceFolder + 'gold.png', resources, 'gold');
    htmlString +=
        getBOImageValue(resourceFolder + 'favor.png', resources, 'favor');
  }
  htmlString += getBOImageValue(
      resourceFolder + 'repair.png', resources, 'builder', true);
  htmlString += getBOImageValue(
      resourceFolder + 'worker.png', currentStep, 'worker_count', true);

  // Age image
  const ageImage = {
    1: 'archaic_age.png',
    2: 'classical_age.png',
    3: 'heroic_age.png',
    4: 'mythic_age.png',
    5: 'wonder_age.png'
  };

  if (currentStep.age in ageImage) {
    htmlString +=
        getBOImageHTML(gamePicturesFolder + 'age/' + ageImage[currentStep.age]);
  }

  return htmlString;
}

/**
 * Check if the build order is valid, for AoM.
 *
 * @param {boolean} nameBOMessage  true to add the BO name in the error
 *                                 message.
 *
 * @returns Array of size 2:
 *              0: true if valid build order, false otherwise.
 *              1: String indicating the error (empty if no error).
 */
function checkValidBuildOrderAoM(nameBOMessage) {
  let BONameStr = '';

  try {
    if (nameBOMessage) {
      BONameStr = dataBO['name'] + ' | ';
    }

    // Check correct major god
    const validFactionRes =
        checkValidFaction(BONameStr, 'major_god', true, false);
    if (!validFactionRes[0]) {
      return validFactionRes;
    }

    fields = [
      new FieldDefinition('worker_count', 'integer', true),
      new FieldDefinition('age', 'integer', true, null, [-Infinity, 5]),
      new FieldDefinition('food', 'integer', true, 'resources'),
      new FieldDefinition('wood', 'integer', true, 'resources'),
      new FieldDefinition('gold', 'integer', true, 'resources'),
      new FieldDefinition('favor', 'integer', true, 'resources'),
      new FieldDefinition('builder', 'integer', false, 'resources'),
      new FieldDefinition('time', 'string', false),
      new FieldDefinition('notes', 'array of strings', true)
    ];

    return checkValidSteps(BONameStr, fields);

  } catch (e) {
    return invalidMsg(BONameStr + e);
  }
}

/**
 * Get one step of the AoM build order (template).
 *
 * @param {Array} builOrderData  Array with the build order step,
 *                               null for default values.
 *
 * @returns Dictionary with the build order step template.
 */
function getBOStepAoM(builOrderData) {
  if (builOrderData && builOrderData.length >= 1) {
    const data = builOrderData.at(-1);  // Last step data
    return {
      'worker_count': ('worker_count' in data) ? data['worker_count'] : 0,
      'age': ('age' in data) ? data['age'] : 1,
      'resources': ('resources' in data) ?
          data['resources'] :
          {'food': 0, 'wood': 0, 'gold': 0, 'favor': 0},
      'notes': ['Note 1', 'Note 2']
    };
  } else {
    return {
      'worker_count': 0,
      'age': 1,
      'resources': {'food': 0, 'wood': 0, 'gold': 0, 'favor': 0},
      'notes': ['Note 1', 'Note 2']
    };
  }
}

/**
 * Get the AoM build order template (reset build order).
 *
 * @returns Dictionary with the build order template.
 */
function getBOTemplateAoM() {
  return {
    'major_god': 'Major god name',
    'name': 'Build order name',
    'author': 'Author',
    'source': 'Source',
    'build_order': [getBOStepAoM(null)]
  };
}

/**
 * Get the worker creation time, for AoM.
 *
 * @param {string} pantheon  Pantheon of the current BO.
 *
 * @returns Worker creation time [sec].
 */
function getWorkerTimeAoM(pantheon) {
  if (['Greeks', 'Egyptians', 'Norse', 'Chinese'].includes(pantheon)) {
    return 15.0;
  } else if (pantheon === 'Atlanteans') {
    return 12.5;  // 25 sec for a citizen with 2 pop
  } else {
    throw 'Unknown pantheon: ' + pantheon;
  }
}

/**
 * Get the pantheon corresponding to a major god.
 *
 * @param {string} majorGod  Major god to check.
 *
 * @returns Pantheon of the major god.
 */
function getPantheon(majorGod) {
  if (['Zeus', 'Hades', 'Poseidon'].includes(majorGod)) {
    return 'Greeks';
  } else if (['Ra', 'Isis', 'Set'].includes(majorGod)) {
    return 'Egyptians';
  } else if (['Thor', 'Odin', 'Loki', 'Freyr'].includes(majorGod)) {
    return 'Norse';
  } else if (['Kronos', 'Oranos', 'Gaia'].includes(majorGod)) {
    return 'Atlanteans';
  } else if (['Fuxi', 'Nuwa', 'Shennong'].includes(majorGod)) {
    return 'Chinese';
  } else {
    throw 'Unknown major god: ' + majorGod;
  }
}

/**
 * Get the research time to reach the next age, for AoM.
 *
 * @param {int} currentAge  Current age (1: Archaic Age, 2: Classical...).
 *
 * @returns Requested age up time [sec].
 */
function getResearchAgeUpTimeAoM(currentAge) {
  console.assert(1 <= currentAge && currentAge <= 4, 'Age expected in [1;4].');

  if (currentAge === 1) {  // Classical age up
    return 60.0
  } else if (currentAge === 2) {  // Heroic age up
    return 75.0;
  } else if (currentAge === 3) {  // Mythic age up
    return 120.0;
  } else {       // Wonder age up
    return 0.0;  // 5400 secs to build, but not part of TC
  }
}

/**
 * Evaluate the time indications for an AoM build order.
 *
 * @param {int} timeOffset  Offset to add on the time outputs [sec].
 */
function evaluateBOTimingAoM(timeOffset) {
  // Get the pantheon
  let pantheon = '';
  const majorGodData = dataBO['major_god'];
  if (Array.isArray(majorGodData)) {
    if (!majorGodData.length) {
      console.log(
          'Warning: the array of \'major_god\' is empty, timing cannot be evaluated.')
      return;
    }
    pantheon = getPantheon(majorGodData[0]);
  } else {
    pantheon = getPantheon(majorGodData);
  }

  let currentAge = 1  // Current age (1: Archaic Age, 2: Classical...)

  // Starting workers
  let lastWorkerCount = 3;  // Egyptians and Norse
  if (['Greeks', 'Atlanteans'].includes(pantheon)) {
    lastWorkerCount = 4;  // Atlanteans have 2 citizens, each with 2 pop
  } else if (pantheon === 'Chinese') {
    lastWorkerCount = 5;  // 2 peasants + 1 Kuafu
  }

  // TC technologies or special units, with TC training/research time (in [sec])
  const TCUnitTechnologies = {
    'greeks_tech/divine_blood.png': 30.0,
    'egyptians_tech/sundried_mud_brick.png': 50.0,
    'egyptians_tech/book_of_thoth.png': 40.0,
    'atlanteans_tech/horns_of_consecration.png': 30.0

    // The following technologies/units are not analyzed:
    //   * Assuming researched from store house: Vaults of Erebus.
    //   * Assuming trained/researched from temple:
    //         Egyptian priest, Golden Apples, Skin of the Rhino, Funeral Rites,
    //         Spirit of Maat, Nebty, New Kingdom, Channels.
    //   * Assuming trained from Longhouse: Berserk.
    //   * Egyptian mercenaries: Trained very fast and usually not part of BO.
  };

  if (!('build_order' in dataBO)) {
    console.log(
        'Warning: the \'build_order\' field is missing from data when evaluating the timing.')
    return;
  }

  let lastTimeSec = timeOffset;  // time of the last step

  let buildOrderData = dataBO['build_order'];
  const stepCount = buildOrderData.length;

  // Loop on all the build order steps
  for (const [currentStepID, currentStep] of enumerate(buildOrderData)) {
    let stepTotalTime = 0.0;  // total time for this step

    // Worker count
    let workerCount = currentStep['worker_count'];
    const resources = currentStep['resources'];
    if (workerCount < 0) {
      workerCount = Math.max(0, resources['wood']) +
          Math.max(0, resources['food']) + Math.max(0, resources['gold']);
      if (pantheon === 'Greeks') {  // Only Greeks villagers can gather favor
        workerCount += Math.max(0, resources['favor']);
      }
      if ('builder' in resources) {
        workerCount += Math.max(0, resources['builder']);
      }
    }

    workerCount = Math.max(lastWorkerCount, workerCount);
    const updateWorkerCount = workerCount - lastWorkerCount;
    lastWorkerCount = workerCount;

    // Update time based on the number and type of workers
    stepTotalTime += updateWorkerCount * getWorkerTimeAoM(pantheon);

    // Check for TC technologies or special units in notes
    for (note of currentStep['notes']) {
      for (const [tcItemImage, tcItemTime] of Object.entries(
               TCUnitTechnologies)) {
        if (note.includes('@' + tcItemImage + '@')) {
          stepTotalTime += tcItemTime;
        }
      }
    }

    // Next age
    const nextAge = (1 <= currentStep['age'] && currentStep['age'] <= 5) ?
        currentStep['age'] :
        currentAge;
    if (nextAge === currentAge + 1)  // researching next age up
    {
      stepTotalTime += getResearchAgeUpTimeAoM(currentAge);
    }
    currentAge = nextAge;  // current age update

    // Update time
    lastTimeSec += stepTotalTime;

    // Update build order with time
    currentStep['time'] = buildOrderTimeToStr(Math.round(lastTimeSec));

    // Special case for last step
    // (add 1 sec to avoid displaying both at the same time).
    if ((currentStepID === stepCount - 1) && (stepCount >= 2) &&
        (currentStep['time'] === buildOrderData[currentStepID - 1]['time'])) {
      currentStep['time'] = buildOrderTimeToStr(Math.round(lastTimeSec + 1.0));
    }
  }
}

/**
 * Get the images available for AoM, sorted by sub-folder.
 *
 * @returns Dictionary with all the images per sub-folder.
 */
function getImagesAoM() {
  // This is obtained using the 'python/utilities/list_images.py' script.
  const
      imagesDict =
          {
            'age':
                'archaic_age.png#classical_age.png#heroic_age.png#mythic_age.png#wonder_age.png',
            'animal':
                'arctic_wolf.png#aurochs.png#baboon.png#bear.png#boar.png#caribou.png#chicken.png#cow.png#crocodile.png#crowned_crane.png#deer.png#elephant.png#elk.png#fish.png#gazelle.png#giraffe.png#goat.png#hippopotamus.png#hyena.png#lion.png#monkey.png#pig.png#polar_bear.png#rhinoceros.png#tiger.png#walrus.png#water_buffalo.png#wolf.png#zebra.png',
            'armory':
                'armory.png#ballistics.png#bronze_armor.png#bronze_shields.png#bronze_weapons.png#burning_pitch.png#copper_armor.png#copper_shields.png#copper_weapons.png#iron_armor.png#iron_shields.png#iron_weapons.png',
            'atlanteans_building':
                'counter-barracks.png#economic_guild.png#manor.png#military_barracks.png#mirror_tower.png#palace.png#sky_passage.png#time_shift.png#town_center_atlantean.png',
            'atlanteans_civilian': 'caravan_atlantean.png#citizen.png',
            'atlanteans_hero':
                'arcus_hero.png#cheiroballista_hero.png#citizen_hero.png#contarius_hero.png#destroyer_hero.png#fanatic_hero.png#katapeltes_hero.png#murmillo_hero.png#oracle_hero.png#turma_hero.png',
            'atlanteans_human':
                'arcus.png#contarius.png#destroyer.png#fanatic.png#katapeltes.png#murmillo.png#oracle_unit.png#turma.png',
            'atlanteans_minor_god':
                'atlas.png#hekate.png#helios.png#hyperion.png#leto.png#oceanus.png#prometheus.png#rheia.png#theia.png',
            'atlanteans_myth':
                'argus.png#atlantean_titan.png#automaton.png#behemoth.png#caladria.png#centimanus.png#lampades.png#man_o_war.png#nereid.png#promethean.png#satyr.png#servant.png#stymphalian_bird.png',
            'atlanteans_power':
                'carnivora_power.png#chaos.png#deconstruction.png#gaia_forest.png#hesperides.png#implode.png#shockwave.png#spider_lair.png#tartarian_gate_power.png#traitor.png#valor.png#vortex.png',
            'atlanteans_ship':
                'bireme.png#fire_ship.png#fishing_ship_atlantean.png#siege_bireme.png#transport_ship_atlantean.png',
            'atlanteans_siege': 'cheiroballista.png#fire_siphon.png',
            'atlanteans_tech':
                'alluvial_clay.png#asper_blood.png#bite_of_the_shark.png#celerity.png#channels.png#conscript_counter_soldiers.png#conscript_mainline_soldiers.png#conscript_palace_soldiers.png#empyrian_speed.png#eyes_of_atlas.png#focus.png#gemini.png#guardian_of_io.png#halo_of_the_sun.png#heart_of_the_titans.png#hephaestus_revenge.png#heroic_renewal.png#horns_of_consecration.png#lance_of_stone.png#lemuriandescendants.png#levy_counter_soldiers.png#levy_mainline_soldiers.png#levy_palace_soldiers.png#mythic_rejuvenation.png#orichalcum_mail.png#petrification.png#poseidons_secret.png#rheias_gift.png#safe_passage.png#temporal_chaos.png#titan_shield.png#volcanic_forge.png#weightless_mace.png',
            'chinese_blessing':
                'creator_auspice.png#shennong_gift_all.png#yang.png#yin.png#yin_yang.png',
            'chinese_building':
                'baolei.png#camp_tower.png#camp_trainingyard.png#crossbow_tower.png#great_wall.png#guard_tower_chinese.png#imperial_academy.png#machine_workshop.png#military_camp.png#silo.png#watch_tower_chinese.png',
            'chinese_civilian':
                'clay_peasant.png#kuafu.png#mechanical_ox_caravan.png#peasant.png#sky_lantern.png',
            'chinese_hero':
                'jiang_ziya.png#li_jing.png#nezha.png#nezha_child.png#nezha_youth.png#pioneer.png#sage.png#wen_zhong.png#yang_jian.png',
            'chinese_human':
                'chu_ko_nu.png#dao_swordsman.png#fire_archer.png#ge_halberdier.png#summon_terracotta_riders.png#terracotta_rider.png#tiger_cavalry.png#white_horse_cavalry.png#wuzu_javelineer.png',
            'chinese_minor_god':
                'chiyou.png#gonggong.png#goumang.png#houtu.png#huangdi.png#nuba.png#rushou.png#xuannu.png#zhurong.png',
            'chinese_myth':
                'baihu.png#chiwen.png#hundun.png#pixiu.png#qilin.png#qinglong.png#qiongqi.png#taotie.png#taowu.png#titan_chinese.png#xuanwu.png#yazi.png#zhuque.png',
            'chinese_power': 'blazing_prairie.png#creation.png#drought.png#earth_wall_power.png#fei_beasts.png#forest_protection.png#great_flood.png#lightning_weapons.png#peachblossomspring_power.png#prosperous_seeds.png#vanish.png#yinglongs_wrath.png',
            'chinese_ship': 'doujian.png#louchuan.png#mengchong.png',
            'chinese_siege': 'axe_cart.png#siege_crossbow.png',
            'chinese_tech':
                'abundance.png#advanced_defenses.png#autumn_of_abundance.png#bottomless_stomach.png#celestial_weapons.png#champion_infantry_chinese.png#chasing_the_sun.png#conscript_baolei_soldiers.png#divine_books.png#divine_judgement.png#divine_light.png#drought_ships.png#east_wind.png#flaming_blood.png#frenzied_dash.png#gilded_shields.png#heavy_infantry_chinese.png#herbal_medicine.png#hooves_of_the_wind.png#imperial_order.png#kuafu_chieftain.png#last_stand.png#leizu\'s_silk.png#levy_baolei_soldiers.png#maelstrom.png#master_of_weaponry.png#medium_infantry_chinese.png#mountainous_might.png#peach_of_immortality.png#power_of_chaos.png#qilin\'s_blessing.png#rage_of_slaughter.png#red_cliffs_fleet.png#reincarnation.png#rising_tide.png#rock_solid.png#scorching_feathers.png#shaker_of_heaven.png#silk_road.png#sinister_defiance.png#sky_fire.png#slash_and_burn.png#song_of_midsummer.png#son_of_loong.png#southern_fire.png#spoils_of_war.png#summon_terracotta_riders.png#tai_chi.png#tempestuous_storm.png#vibrant_land.png#xuanyuan\'s_bloodline.png',
            'defensive':
                'boiling_oil.png#bronze_wall.png#carrier_pigeons.png#citadel_wall.png#crenellations.png#fortified_wall.png#guard_tower_upgrade.png#improvement_ballista_tower.png#improvement_watch_tower.png#iron_wall.png#orichalkos_wall.png#sentry_tower.png#signal_fires.png#stone_wall.png#wooden_wall.png',
            'dock':
                'arrowship_cladding.png#champion_warships.png#conscript_sailors.png#dock.png#enclosed_deck.png#heavy_warships.png#heroic_fleet.png#naval_oxybeles.png#purse_seine.png#reinforced_ram.png#salt_amphora.png',
            'economy':
                'bow_saw.png#carpenters.png#flood_control.png#hand_axe.png#husbandry.png#irrigation.png#pickaxe.png#plow.png#quarry.png#shaft_mine.png#survival_equipment.png',
            'egyptians_building':
                'barracks.png#granary.png#lighthouse.png#lumber_camp.png#migdol_stronghold.png#mining_camp.png#monument_to_villagers.png#obelisk.png#siege_works.png#town_center_egyptian.png',
            'egyptians_civilian': 'caravan_egyptian.png#laborer.png',
            'egyptians_hero': 'pharaoh.png#priest.png',
            'egyptians_human':
                'axeman.png#camel_rider.png#chariot_archer.png#mercenary.png#mercenary_cavalry.png#slinger.png#spearman.png#war_elephant.png',
            'egyptians_minor_god':
                'anubis.png#bast.png#horus.png#nephthys.png#osiris.png#ptah.png#sekhmet.png#sobek.png#thoth.png',
            'egyptians_myth':
                'anubite.png#avenger.png#egyptian_titan.png#leviathan.png#mummy.png#petsuchos.png#phoenix.png#roc.png#scarab.png#scorpion_man.png#son_of_osiris.png#sphinx.png#wadjet.png#war_turtle.png',
            'egyptians_power':
                'ancestors.png#citadel_power.png#eclipse.png#locust_swarm.png#meteor.png#plague_of_serpents.png#prosperity.png#rain.png#shifting_sands.png#son_of_osiris_power.png#tornado.png#vision.png',
            'egyptians_ship':
                'fishing_ship_egyptian.png#kebenit.png#ramming_galley.png#transport_ship_egyptian.png#war_barge.png',
            'egyptians_siege': 'catapult.png#siege_tower.png',
            'egyptians_tech':
                'adze_of_wepwawet.png#atef_crown.png#axe_of_vengeance.png#bone_bow.png#book_of_thoth.png#champion_axemen.png#champion_camel_riders.png#champion_chariot_archers.png#champion_slingers.png#champion_spearmen.png#champion_war_elephants.png#clairvoyance.png#conscript_barracks_soldiers.png#conscript_migdol_soldiers.png#crimson_linen.png#criosphinx.png#crocodilopolis.png#dark_water.png#desert_wind.png#electrum_bullets.png#feet_of_the_jackal.png#feral.png#flood_of_the_nile.png#force_of_the_west_wind.png#funeral_barge.png#funeral_rites.png#greatest_of_fifty.png#hands_of_the_pharaoh.png#heavy_axemen.png#heavy_camel_riders.png#heavy_chariot_archers.png#heavy_slingers.png#heavy_spearmen.png#heavy_war_elephants.png#hieracosphinx.png#leather_frame_shield.png#levy_barracks_soldiers.png#levy_migdol_soldiers.png#medium_axemen.png#medium_slingers.png#medium_spearmen.png#nebty.png#necropolis.png#new_kingdom.png#sacred_cats.png#scalloped_axe.png#serpent_spear.png#shaduf.png#skin_of_the_rhino.png#slings_of_the_sun.png#solar_barque - copy.png#solar_barque.png#spear_of_horus.png#spirit_of_maat.png#stones_of_red_linen.png#sundried_mud_brick.png#tusks_of_apedemak.png#valley_of_the_kings.png#city_of_the_dead.jpg',
            'greeks_building':
                'archery_range.png#fortress.png#granary.png#military_academy.png#stable.png#storehouse.png#town_center_greek.png#village_center_greeks.png',
            'greeks_civilian': 'caravan_greek.png#villager_greek.png',
            'greeks_hero':
                'achilles.png#ajax_spc.png#atalanta.png#bellerophon.png#chiron.png#heracles.png#hippolyta.png#jason.png#odysseus.png#perseus.png#polyphemus.png#theseus.png',
            'greeks_human':
                'gastraphetoros.png#hetairos.png#hippeus.png#hoplite.png#hypaspist.png#militia.png#myrmidon.png#peltast.png#prodromos.png#toxotes.png',
            'greeks_minor_god':
                'aphrodite.png#apollo.png#ares.png#artemis.png#athena.png#dionysus.png#hephaestus.png#hera.png#hermes.png',
            'greeks_myth':
                'carcinos.png#centaur.png#chimera.png#colossus.png#cyclops.png#greek_titan.png#hippocampus.png#hydra.png#manticore.png#medusa.png#minotaur.png#nemean_lion.png#pegasus.png#scylla.png',
            'greeks_power':
                'bolt.png#bronze.png#ceasefire.png#curse.png#earthquake.png#lightning_storm.png#lure_power.png#pestilence.png#plenty_vault.png#restoration.png#sentinel_power.png#underworld_passage.png',
            'greeks_ship':
                'fishing_ship_greek.png#juggernaut.png#pentekonter.png#transport_ship_greek.png#trireme.png',
            'greeks_siege': 'helepolis.png#petrobolos.png',
            'greeks_tech':
                'aegis_shield.png#anastrophe.png#argive_patronage.png#conscript_cavalry.png#conscript_infantry.png#conscript_ranged_soldiers.png#deimos_sword_of_dread.png#dionysia.png#divine_blood.png#enyos_bow_of_horror.png#face_of_the_gorgon.png#flames_of_typhon.png#forge_of_olympus.png#golden_apples.png#hand_of_talos.png#labyrinth_of_minos.png#levy_cavalry.png#levy_infantry.png#levy_ranged_soldiers.png#lord_of_horses.png#monstrous_rage.png#olympian_parentage.png#olympian_weapons.png#oracle.png#phobos_spear_of_panic.png#roar_of_orthus.png#sarissa.png#shafts_of_plague.png#shoulder_of_talos.png#spirited_charge.png#sun_ray.png#sylvan_lore.png#temple_of_healing.png#thracian_horses.png#trierarch.png#vaults_of_erebus.png#will_of_kronos.png#winged_messenger.png',
            'major_god':
                'freyr.png#fuxi.png#gaia.png#hades.png#isis.png#kronos.png#loki.png#nuwa.png#odin.png#oranos.png#poseidon.png#ra.png#set.png#shennong.png#thor.png#zeus.png',
            'market':
                'ambassadors.png#coinage.png#market.png#tax_collectors.png',
            'norse_building':
                'dwarven_armory.png#great_hall.png#hill_fort.png#longhouse.png#town_center_norse.png',
            'norse_civilian':
                'caravan_norse.png#dwarf.png#gatherer.png#ox_cart.png',
            'norse_hero': 'godi.png#hersir.png',
            'norse_human':
                'berserk.png#hirdman.png#huskarl.png#jarl.png#raiding_cavalry.png#throwing_axeman.png',
            'norse_minor_god':
                'aegir.png#baldr.png#bragi.png#forseti.png#freyja.png#heimdall.png#hel.png#njord.png#skadi.png#tyr.png#ullr.png#vidar.png',
            'norse_myth':
                'battle_boar.png#draugr.png#einherjar.png#fafnir.png#fenris_wolf_brood.png#fimbulwinter_wolf.png#fire_giant.png#frost_giant.png#jormun_elver.png#kraken.png#mountain_giant.png#nidhogg_unit.png#norse_titan.png#raven.png#rock_giant.png#troll.png#valkyrie.png#walking_woods_unit.png',
            'norse_power':
                'asgardian_bastion.png#dwarven_mine.png#fimbulwinter.png#flaming_weapons.png#forest_fire.png#frost.png#great_hunt.png#gullinbursti.png#healing_spring_power.png#inferno.png#nidhogg.png#ragnarok.png#spy.png#tempest.png#undermine.png#walking_woods_power.png',
            'norse_ship':
                'dragon_ship.png#dreki.png#fishing_ship_norse.png#longboat.png#transport_ship_norse.png',
            'norse_siege': 'ballista.png#portable_ram.png',
            'norse_tech':
                'arctic_winds.png#avenging_spirit.png#berserkergang.png#bravery.png#call_of_valhalla.png#cave_troll.png#conscript_great_hall_soldiers.png#conscript_hill_fort_soldiers.png#conscript_longhouse_soldiers.png#disablot.png#dragonscale_shields.png#dwarven_auger.png#dwarven_breastplate.png#dwarven_weapons.png#eyes_in_the_forest.png#feasts_of_renown.png#freyr\'s_gift.png#fury_of_the_fallen.png#gjallarhorn.png#granite_blood.png#granite_maw.png#grasp_of_ran.png#hall_of_thanes.png#hamask.png#hammer_of_thunder.png#huntress_axe.png#levy_great_hall_soldiers.png#levy_hill_fort_soldiers.png#levy_longhouse_soldiers.png#long_serpent.png#meteoric_iron_armor.png#nine_waves.png#rampage.png#rime.png#ring_giver.png#ring_oath.png#safeguard.png#servants_of_glory.png#sessrumnir.png#silent_resolve.png#sons_of_sleipnir.png#swine_array.png#thundering_hooves.png#thurisaz_rune.png#twilight_of_the_gods.png#valgaldr.png#winter_harvest.png#wrath_of_the_deep.png#ydalir.png',
            'other': 'farm.png#house.png#relic.png#titan_gate.png#wonder.png',
            'resource':
                'berry.png#favor.png#food.png#gold.png#repair.png#tree.png#wood.png#worker.png',
            'tech_military':
                'champion_archers.png#champion_cavalry.png#champion_infantry.png#draft_horses.png#engineers.png#heavy_archers.png#heavy_cavalry.png#heavy_infantry.png#medium_archers.png#medium_cavalry.png#medium_infantry.png#norse_champion_infantry.png#norse_heavy_infantry.png#norse_medium_infantry.png',
            'temple': 'omniscience.png#temple.png',
            'town_center':
                'architects.png#fortified_town_center.png#masons.png#town_center.png#village_center.png'
          };

  // Split each string (e.g. 'image_0#image_1#image_2') in a list of images.
  for (const [key, value] of Object.entries(imagesDict)) {
    imagesDict[key] = value.split('#');
  }

  return imagesDict;
}

/**
 * Get the factions with 3 letters shortcut and icon, for AoM.
 *
 * @returns Dictionary with faction name as key,
 *          and its 3 letters + image as value.
 */
function getFactionsAoM() {
  return {
    // Greeks
    'Zeus': ['ZEU', 'zeus.png'],
    'Hades': ['HAD', 'hades.png'],
    'Poseidon': ['POS', 'poseidon.png'],
    // Egyptians
    'Ra': ['RA', 'ra.png'],
    'Isis': ['ISI', 'isis.png'],
    'Set': ['SET', 'set.png'],
    // Norse
    'Thor': ['THO', 'thor.png'],
    'Odin': ['ODI', 'odin.png'],
    'Loki': ['LOK', 'loki.png'],
    'Freyr': ['FRE', 'freyr.png'],
    // Atlanteans
    'Kronos': ['KRO', 'kronos.png'],
    'Oranos': ['ORA', 'oranos.png'],
    'Gaia': ['GAI', 'gaia.png'],
    // Chinese
    'Fuxi': ['FUX', 'fuxi.png'],
    'Nuwa': ['NUW', 'nuwa.png'],
    'Shennong': ['SHE', 'shennong.png']
  };
}

/**
 * Get the folder containing the faction images, for AoM.
 *
 * @returns Requested folder name.
 */
function getFactionImagesFolderAoM() {
  return 'major_god';
}

/**
 * Get the instructions for AoM.
 *
 * @returns Requested instructions.
 */
function getInstructionsAoM() {
  const selectFactionLines = [
    'The \'select faction\' category provides all the available major god names for the \'major_god\' field.'
  ];
  return contentArrayToDiv(getArrayInstructions(true, selectFactionLines));
}

/**
 * Open a new page displaying the full BO in a single panel, for AoM.
 */
function openSinglePanelPageAoM() {
  // Image folders
  const common = 'assets/common/';
  const game = 'assets/' + gameName + '/';
  const resource = game + '/resource/';

  // Description for each column
  let columnsDescription = [
    new SinglePanelColumn('time', common + 'icon/time.png'),
    new SinglePanelColumn('worker_count', resource + 'worker.png'),
    new SinglePanelColumn('resources/builder', resource + 'repair.png'),
    new SinglePanelColumn('resources/food', resource + 'food.png'),
    new SinglePanelColumn('resources/wood', resource + 'wood.png'),
    new SinglePanelColumn('resources/gold', resource + 'gold.png'),
    new SinglePanelColumn('resources/favor', resource + 'favor.png')
  ];

  columnsDescription[0].italic = true;                      // time
  columnsDescription[0].hideIfAbsent = true;                // time
  columnsDescription[0].textAlign = 'right';                // time
  columnsDescription[1].bold = true;                        // worker count
  columnsDescription[2].hideIfAbsent = true;                // builder
  columnsDescription[3].backgroundColor = [153, 94, 89];    // food
  columnsDescription[4].backgroundColor = [94, 72, 56];     // wood
  columnsDescription[5].backgroundColor = [135, 121, 78];   // gold
  columnsDescription[6].backgroundColor = [100, 100, 100];  // favor

  // all columns, except time
  for (let i = 1; i <= 6; i++) {
    columnsDescription[i].displayIfPositive = true;
  }

  // Sections Header
  const topArrow = getBOImageHTML(common + 'icon/top_arrow.png');
  const sectionsHeader = {
    'key': 'age',  // Key to look for
    // Header before the current row
    'before': {
      2: topArrow + 'Aging up to Classical Age',
      3: topArrow + 'Aging up to Heroic Age',
      4: topArrow + 'Aging up to Mythic Age',
      5: topArrow + 'Aging up to Wonder Age'
    },
    // Header after the current row
    'after': {
      1: getBOImageHTML(game + 'age/archaic_age.png') + 'Archaic Age',
      2: getBOImageHTML(game + 'age/classical_age.png') + 'Classical Age',
      3: getBOImageHTML(game + 'age/heroic_age.png') + 'Heroic Age',
      4: getBOImageHTML(game + 'age/mythic_age.png') + 'Mythic Age',
      5: getBOImageHTML(game + 'age/wonder_age.png') + 'Wonder Age'
    }
  };
  // Header for first line
  sectionsHeader['first_line'] = sectionsHeader.after;

  // Feed game description to generic function
  openSinglePanelPageFromDescription(columnsDescription, sectionsHeader);
}


// -- StarCraft II (SC2) -- //

/**
 * Get the main HTML content of the resource line (excluding timing) for SC2.
 *
 * @param {int} currentStep  Requested step for the BO resource line.
 *
 * @returns HTML code corresponding to the requested line.
 */
function getResourceLineSC2(currentStep) {
  let htmlString = '';

  // Folders with requested pictures
  const commonPicturesFolder = 'assets/common/';
  const gamePicturesFolder = 'assets/' + gameName + '/';
  const resourceFolder = gamePicturesFolder + 'resource/';

  htmlString += getBOImageValue(
      resourceFolder + 'minerals.png', currentStep, 'minerals', true);
  htmlString += getBOImageValue(
      resourceFolder + 'vespene_gas.png', currentStep, 'vespene_gas', true);
  htmlString += getBOImageValue(
      commonPicturesFolder + 'icon/house.png', currentStep, 'supply', true);

  return htmlString;
}

/**
 * Check if the build order is valid, for SC2.
 *
 * @param {boolean} nameBOMessage  true to add the BO name in the error
 *                                 message.
 *
 * @returns Array of size 2:
 *              0: true if valid build order, false otherwise.
 *              1: String indicating the error (empty if no error).
 */
function checkValidBuildOrderSC2(nameBOMessage) {
  let BONameStr = '';

  try {
    if (nameBOMessage) {
      BONameStr = dataBO['name'] + ' | ';
    }

    // Check correct race and opponent race
    const validRaceRes = checkValidFaction(BONameStr, 'race', true, false);
    if (!validRaceRes[0]) {
      return validRaceRes;
    }

    const validOpponentRaceRes =
        checkValidFaction(BONameStr, 'opponent_race', true);
    if (!validOpponentRaceRes[0]) {
      return validOpponentRaceRes;
    }

    fields = [
      new FieldDefinition('notes', 'array of strings', true),
      new FieldDefinition('time', 'string', false),
      new FieldDefinition('supply', 'integer', false),
      new FieldDefinition('minerals', 'integer', false),
      new FieldDefinition('vespene_gas', 'integer', false)
    ];

    return checkValidSteps(BONameStr, fields);

  } catch (e) {
    return invalidMsg(BONameStr + e);
  }
}

/**
 * Get one step of the SC2 build order (template).
 *
 * @param {Array} builOrderData  Array with the build order step,
 *                               null for default values.
 *
 * @returns Dictionary with the build order step template.
 */
function getBOStepSC2(builOrderData) {
  if (builOrderData && builOrderData.length >= 1) {
    const data = builOrderData.at(-1);  // Last step data
    return {
      'time': ('time' in data) ? data['time'] : '0:00',
      'supply': ('supply' in data) ? data['supply'] : -1,
      'minerals': ('minerals' in data) ? data['minerals'] : -1,
      'vespene_gas': ('vespene_gas' in data) ? data['vespene_gas'] : -1,
      'notes': ['Note 1', 'Note 2']
    };
  } else {
    return {
      'time': '0:00',
      'supply': -1,
      'minerals': -1,
      'vespene_gas': -1,
      'notes': ['Note 1', 'Note 2']
    };
  }
}

/**
 * Get the SC2 build order template (reset build order).
 *
 * @returns Dictionary with the build order template.
 */
function getBOTemplateSC2() {
  return {
    'race': 'Race name',
    'opponent_race': 'Any',
    'name': 'Build order name',
    'patch': 'x.y.z',
    'author': 'Author',
    'source': 'Source',
    'build_order': [getBOStepSC2(null)]
  };
}

/**
 * Get the images available for SC2, sorted by sub-folder.
 *
 * @returns Dictionary with all the images per sub-folder.
 */
function getImagesSC2() {
  // This is obtained using the 'python/utilities/list_images.py' script.
  const
      imagesDict =
          {
            'protoss_buildings':
                'Assimilator.png#Cybernetics_Core.png#Dark_Shrine.png#Fleet_Beacon.png#Forge.png#Gateway.png#Nexus.png#Photon_Cannon.png#Pylon.png#Robotics_Bay.png#Robotics_Facility.png#ShieldBattery.png#Stargate.png#StasisWard.png#Templar_Archives.png#Twilight_Council.png#Warp_Gate.png',
            'protoss_techs':
                'Air_armor_1.png#Air_armor_2.png#Air_armor_3.png#Air_weapons_1.png#Air_weapons_2.png#Air_weapons_3.png#Anion_Pulse-Crystals.png#Battery_Overcharge.png#Blink.png#Charge.png#Chrono_boost.png#Extended_thermal_lances.png#Flux_Vanes.png#Gravitic_booster.png#Gravitic_drive.png#Graviton_catapult.png#Ground_armor_1.png#Ground_armor_2.png#Ground_armor_3.png#Ground_weapons_1.png#Ground_weapons_2.png#Ground_weapons_3.png#Guardian_shield.png#Mass_Recall.png#Psionic_storm.png#Resonating_Glaives.png#Shadow_Stride.png#Shields_1.png#Shields_2.png#Shields_3.png#Tectonic_Destabilizers.png#Transform_warpgate.png',
            'protoss_units':
                'Adept.png#Archon.png#Carrier.png#Colossus.png#Dark_Templar.png#Disruptor.png#High_Templar.png#Immortal.png#Mothership.png#Mothership_Core.png#Observer.png#Oracle.png#Phoenix.png#Probe.png#Sentry.png#Stalker.png#Tempest.png#VoidRay.png#Warp_Prism.png#Zealot.png',
            'race_icon':
                'AnyRaceIcon.png#ProtossIcon.png#TerranIcon.png#ZergIcon.png',
            'resource': 'minerals.png#vespene_gas.png',
            'terran_buildings':
                'Armory.png#Barracks.png#Bunker.png#CommandCenter.png#EngineeringBay.png#Factory.png#FusionCore.png#GhostAcademy.png#MissileTurret.png#OrbitalCommand.png#PlanetaryFortress.png#Reactor.png#Refinery.png#SensorTower.png#Starport.png#SupplyDepot.png#TechLab.png',
            'terran_techs':
                'Advanced_Ballistics.png#Behemoth_reactor.png#Building_armor.png#Build_Reactor.png#Build_Tech_Lab.png#Calldown_extra_supplies.png#Calldown_mule.png#Cloak.png#Enhanced_Shockwaves.png#High_Capacity_Fuel_Tanks.png#Hisec_auto_tracking.png#Infantry_armor_1.png#Infantry_armor_2.png#Infantry_armor_3.png#Infantry_weapons_1.png#Infantry_weapons_2.png#Infantry_weapons_3.png#Lower.png#Moebius_reactor.png#Neosteel_frames.png#Nuke.png#Scanner_sweep.png#Ship_weapons_1.png#Ship_weapons_2.png#Ship_weapons_3.png#Vehicle_plating_1.png#Vehicle_plating_2.png#Vehicle_plating_3.png#Vehicle_weapons_1.png#Vehicle_weapons_2.png#Vehicle_weapons_3.png#Yamato_cannon.png',
            'terran_units':
                'Auto-turret.png#Banshee.png#Battlecruiser.png#Cyclone.png#Ghost.png#Hellbat.png#Hellion.png#Liberator.png#Marauder.png#Marine.png#Medivac.png#MULE.png#Point_defense_drone.png#Raven.png#Reaper.png#SCV.png#SiegeTank.png#Thor.png#Viking.png#WidowMine.png',
            'zerg_buildings':
                'Baneling_Nest.png#Creep_Tumor.png#Evolution_Chamber.png#Extractor.png#Greater_Spire.png#Hatchery.png#Hive.png#Hydralisk_Den.png#Infestation_Pit.png#Lair.png#LurkerDen.png#Nydus_Network.png#Nydus_Worm.png#Roach_Warren.png#Spawning_Pool.png#Spine_Crawler.png#Spire.png#Spore_Crawler.png#Ultralisk_Cavern.png',
            'zerg_techs':
                'Adaptive_Talons.png#Adrenal_glands.png#Anabolic_Synthesis.png#Burrow.png#Centrifugal_hooks.png#Chitinous_Plating.png#Flyer_attack_1.png#Flyer_attack_2.png#Flyer_attack_3.png#Flyer_carapace_1.png#Flyer_carapace_2.png#Flyer_carapace_3.png#Glial_reconstitution.png#Grooved_Spines.png#Ground_carapace_1.png#Ground_carapace_2.png#Ground_carapace_3.png#Melee_attacks_1.png#Melee_attacks_2.png#Melee_attacks_3.png#Metabolic_boost.png#Microbial_Shroud.png#Missile_attacks_1.png#Missile_attacks_2.png#Missile_attacks_3.png#Muscular_Augments.png#Mutate_Ventral_Sacs.png#Neural_parasite.png#Pathogen_glands.png#Pneumatized_carapace.png#Seismic_Spines.png#Tunneling_claws.png',
            'zerg_units':
                'Baneling.png#Broodling.png#Brood_Lord.png#Changeling.png#Corruptor.png#Drone.png#Hydralisk.png#Infested_Terran.png#Infestor.png#Larva.png#Lurker.png#Mutalisk.png#Overlord.png#Overseer.png#Queen.png#Ravager.png#Roach.png#Swarm_Host.png#Ultralisk.png#Viper.png#Zergling.png'
          };

  // Split each string (e.g. 'image_0#image_1#image_2') in a list of images.
  for (const [key, value] of Object.entries(imagesDict)) {
    imagesDict[key] = value.split('#');
  }

  return imagesDict;
}

/**
 * Get the factions with 3 letters shortcut and icon, for SC2.
 *
 * @returns Dictionary with faction name as key,
 *          and its 3 letters + image as value.
 */
function getFactionsSC2() {
  return {
    'Terran': ['TER', 'TerranIcon.png'],
    'Protoss': ['PRT', 'ProtossIcon.png'],
    'Zerg': ['ZRG', 'ZergIcon.png'],
    'Any': ['ANY', 'AnyRaceIcon.png']
  };
}

/**
 * Get the folder containing the faction images, for SC2.
 *
 * @returns Requested folder name.
 */
function getFactionImagesFolderSC2() {
  return 'race_icon';
}

/**
 * Get the instructions for SC2.
 *
 * @returns Requested instructions.
 */
function getInstructionsSC2() {
  const selectFactionLines = [
    'The \'select faction\' category provides all the available race names for the \'race\' and \'opponent_race\' fields.'
  ];
  return contentArrayToDiv(getArrayInstructions(false, selectFactionLines));
}

/**
 * Open a new page displaying the full BO in a single panel, for SC2.
 */
function openSinglePanelPageSC2() {
  // Image folders
  const common = 'assets/common/';
  const game = 'assets/' + gameName + '/';
  const resource = game + '/resource/';

  // Description for each column
  let columnsDescription = [
    new SinglePanelColumn('time', common + 'icon/time.png'),
    new SinglePanelColumn('supply', common + 'icon/house.png'),
    new SinglePanelColumn('minerals', resource + 'minerals.png'),
    new SinglePanelColumn('vespene_gas', resource + 'vespene_gas.png')
  ];

  columnsDescription[0].italic = true;                     // time
  columnsDescription[0].textAlign = 'right';               // time
  columnsDescription[1].bold = true;                       // supply
  columnsDescription[2].backgroundColor = [77, 103, 136];  // minerals
  columnsDescription[3].backgroundColor = [67, 96, 57];    // vespene gas

  // all columns
  for (let i = 0; i <= 3; i++) {
    columnsDescription[i].hideIfAbsent = true;
  }

  // all columns, except time
  for (let i = 1; i <= 3; i++) {
    columnsDescription[i].displayIfPositive = true;
  }

  // Feed game description to generic function
  openSinglePanelPageFromDescription(columnsDescription);
}
