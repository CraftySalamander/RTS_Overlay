// -- Define parameters -- //

const EDITOR_IMAGE_HEIGHT = 30;           // Height of images for the editor.
const TITLE_IMAGE_HEIGHT = 70;            // Height of the 'RTS Overlay' title.
const INFO_IMAGE_HEIGHT = 30;             // Height of the RTS Overlay information button.
const TIMER_CHECK_HEIGHT = 20;            // Height of timer check icon.
const VISUAL_EDITOR_ICON_HEIGHT = 25;     // Height of the icons for Visual Editor.
const SALAMANDER_IMAGE_HEIGHT = 250;      // Height of the salamander image.
const SLEEP_TIME = 100;                   // Sleep time to resize the window [ms].
const INTERVAL_CALL_TIME = 250;           // Time interval between regular calls [ms].
const SIZE_UPDATE_THRESHOLD = 5;          // Minimal thershold to update the size.
const MAX_ROW_SELECT_IMAGES = 16;         // Max number of images per row (BO design).
const DEFAULT_BO_PANEL_FONTSIZE = 1.0;    // Default font size for BO panel.
const DEFAULT_BO_PANEL_IMAGES_SIZE = 25;  // Default images size for BO panel.
// Height of the action buttons as a ratio of the images size for the BO panel.
const ACTION_BUTTON_HEIGHT_RATIO = 0.8;
// Default choice for overlay on right or left side of the screen.
const DEFAULT_OVERLAY_ON_RIGHT_SIDE = false;
const MAX_SEARCH_RESULTS = 10;  // Maximum number of search results to display.
// Max error ratio threshold on the Levenshtein similarity to accept the match.
const LEVENSHTEIN_RATIO_THRESHOLD = 0.5;
// Minimum length for search elements after '@' (visual editor)
const MIN_LENGTH_AT_SEARCH = 2;
// Maximum number of suggested images to show (visual editor)
const MAX_NUMBER_SUGGESTION_IMAGES = 16;
// Visual grid image selector with '@' suggestions
const VISUAL_GRID_IMAGE_GAP = 5;                         // Gap between images
const VISUAL_GRID_PADDING = 10;                          // Grid padding
const VISUAL_GRID_OUTLINE_COLOR = 'rgb(255, 255, 255)';  // Color around image
const VISUAL_GRID_VERTICAL_SPACE = 10;                   // Vertical space between text and grid

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
    ['age4builder.com', 'https://age4builder.com/', 'Click on the salamander icon.']
  ],
  'aom': [
    ['thedodclan.com', 'https://thedodclan.com/build-orders', 'Click on the script icon.'],
    [
      'Export for DoD Clan', 'function:generateCSVForDodClan()',
      'Generate a CSV file to add your BO on the Deities of Death BO website<br>(visit <a>https://thedodclan.com/build-orders</a> for more info).'
    ]
  ]
};

// Fields of the faction name: player and (optionally) opponent
const FACTION_FIELD_NAMES = {
  'aoe2': {'player': 'civilization', 'opponent': null, 'skip_faction': null, 'skip_opponent': null},
  'aoe4': {'player': 'civilization', 'opponent': null, 'skip_faction': null, 'skip_opponent': null},
  'aom': {'player': 'major_god', 'opponent': null, 'skip_faction': null, 'skip_opponent': null},
  'sc2': {
    'player': 'race',
    'opponent': 'opponent_race',
    'skip_faction': ['Any'],
    'skip_opponent': null
  },
  'wc3': {
    'player': 'race',
    'opponent': 'opponent_race',
    'skip_faction': ['Any'],
    'skip_opponent': null
  }
};

// Calls to external APIs to initialize a build order,
// using the address '?gameId=GAME&buildOrderId=WEBSITE|XXXXX'
const EXTERNAL_API_CALLS_INITIALIZATION = {
  'aoe4': {'aoe4guides': 'https://aoe4guides.com/api/builds/XXXXX?overlay=true'}
};

// List of games where each step starts at the given time
// (step ending otherwise).
const TIMER_STEP_STARTING_FLAG = ['sc2', 'wc3'];
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

let gameName = 'aoe2';                   // Name of the game (i.e. its picture folder)
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
let imagesGame = {};               // Dictionary with images available for the game.
let imagesCommon = {};             // Dictionary with images available from common folder.
let factionsList = {};             // List of factions with 3 letters and icon.
let factionImagesFolder = '';      // Folder where the faction images are located.
// Font size for the BO text
let boPanelFontSize = DEFAULT_BO_PANEL_FONTSIZE;
// Height of the images in the Build Order (BO)
let imageHeightBO = DEFAULT_BO_PANEL_IMAGES_SIZE;
// Height of the action buttons.
let actionButtonHeight = ACTION_BUTTON_HEIGHT_RATIO * DEFAULT_BO_PANEL_IMAGES_SIZE;
// Overlay on right or left side of the screen.
let overlayOnRightSide = DEFAULT_OVERLAY_ON_RIGHT_SIDE;
let visualEditorActivated = false;  // true for visual editor, false for raw editor
// Table description for visual editor widget, null if unused.
let visualEditortableWidgetDescription = null;
// Visual grid image selector with '@' suggestions
let visualGridColumnCount = 0;     // grid columns count
let visualGridActiveIndex = -1;    // grid image selected ID
let visualGridMatchingNames = [];  //  matching image names for the grid
let visualGridImages = [];         // visible images for the grid
let visualGridAtString = null;     // location of the '@' character of interest for the grid
let welcomeMessageActive = false;  // true if welcome message is shown

// Build order timer elements
let buildOrderTimer = {
  'step_starting_flag': false,  // true if the timer steps starts at the
  // indicated time, false if ending at this time
  'use_timer': false,         // true to update BO with timer, false for manual selection
  'run_timer': false,         // true if the BO timer is running (false to stop)
  'absolute_time_init': 0.0,  // last absolute time when the BO timer run started [sec]
  'time_sec': 0.0,            // time for the BO [sec]
  'time_int': 0,              // 'time_sec' with a cast to integer
  'last_time_int': 0,         // last value for 'time_int' [sec]
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
  const widthFlag = (newWidth > currentWidth) || (newWidth < currentWidth - SIZE_UPDATE_THRESHOLD);
  const heightFlag =
      (newHeight > currentHeight) || (newHeight < currentHeight - SIZE_UPDATE_THRESHOLD);

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
    if (boPanelElement.style.fontSize !== boPanelFontSize) {
      boPanelElement.style.fontSize = boPanelFontSize;
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
  const extensions = ['.png', '.jpg', '.webp'];  // different extensions to try

  // Extract current extension (if any)
  const currentExtMatch = imageSearch.match(/\.(png|jpg|webp)$/);
  const currentExt = currentExtMatch ? currentExtMatch[0] : null;

  // Get base path without extension
  const basePath = currentExt ? imageSearch.slice(0, -currentExt.length) : imageSearch;

  // Reorder extensions to start with current one (if present)
  const orderedExtensions =
      currentExt ? [currentExt, ...extensions.filter(ext => ext !== currentExt)] : extensions;

  // Loop through extension variations
  for (const ext of orderedExtensions) {
    const imageSearchExtension = `${basePath}${ext}`;

    // Try first with the game folder
    for (const [subFolder, images] of Object.entries(imagesGame)) {
      for (let image of images) {
        if (imageSearchExtension === subFolder + '/' + image) {
          return 'assets/' + gameName + '/' + imageSearchExtension;
        }
      }
    }

    // Try then with the common folder
    for (const [subFolder, images] of Object.entries(imagesCommon)) {
      for (let image of images) {
        if (imageSearchExtension === subFolder + '/' + image) {
          return 'assets/common' +
              '/' + imageSearchExtension;
        }
      }
    }
  }

  // not found
  return null;
}

/**
 * Get the HTML code to add an image.
 *
 * @param {string} imagePath       Image to display (with path and extension).
 * @param {int} imageHeight        Height of the image.
 * @param {string} functionName    Name of the function to call when clicking on
 *                                 the image, null if no function to call.
 * @param {string} functionArgs    Arguments to use for the function,
 *                                 null if no function or no argument.
 * @param {string} tooltipText     Text for the tooltip, null if no tooltip.
 * @param {string} imageID         ID of the image, null if no specific ID
 * @param {boolean} tooltipOnLeft  true for tooltip on left (if any), false for right
 * @param {boolean} argsInQuotes   true to put 'functionArgs' inside quotes.
 *
 * @returns Requested HTML code.
 */
function getImageHTML(
    imagePath, imageHeight, functionName = null, functionArgs = null, tooltipText = null,
    imageID = null, tooltipOnLeft = true, argsInQuotes = true) {
  let imageHTML = '';

  // Add tooltip
  if (tooltipText) {
    imageHTML += '<div class="tooltip">';
  }

  // Button with image
  if (functionName) {
    imageHTML += '<input type="image" src="' + imagePath + '"';
    imageHTML += ' onerror="this.onerror=null; this.src=\'' + ERROR_IMAGE + '\'"';
    imageHTML += imageID ? ' id="' + imageID + '"' : '';
    imageHTML += ' height="' + imageHeight + '"';
    const argsQuotes = argsInQuotes ? '\'' : '';
    imageHTML += ' onclick="' + functionName +
        (functionArgs ?
             '(' + argsQuotes + functionArgs.replaceAll('\'', '\\\'') + argsQuotes + ')"' :
             '()"');
    imageHTML += '/>';
  }
  // Image (no button)
  else {
    imageHTML += '<img src="' + imagePath + '"';
    imageHTML += ' onerror="this.onerror=null; this.src=\'' + ERROR_IMAGE + '\'"';
    imageHTML += imageID ? ' id="' + imageID + '"' : '';
    imageHTML += ' height="' + imageHeight + '">';
  }

  // Add tooltip
  if (tooltipText) {
    imageHTML +=
        '<span class="' + (tooltipOnLeft ? 'tooltiptext_left' : 'tooltiptext_right') + '">';
    imageHTML += '<div>' + tooltipText + '</div>';
    imageHTML += '</span></div>';
  }

  return imageHTML;
}

/**
 * Get the HTML code to add an image for the content of the BO.
 *
 * @param {string} imagePath  Image to display (with path and extension).
 * @param {int} imageHeight   Height of the image, <= 0 to take 'imageHeightBO'.
 *
 * @returns Requested HTML code.
 */
function getBOImageHTML(imagePath, imageHeight = -1) {
  return getImageHTML(imagePath, (imageHeight >= 1) ? imageHeight : imageHeightBO);
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
 * @param {boolean} positiveFlag  true to only output it when the item is positive.
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
 * @param {boolean} positiveFlag  true to only output it when the item is positive.
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
 * @param {string} note       Note line from a build order.
 * @param {int} imageHeight   Height of the images, <= 0 to take 'imageHeightBO'.
 *
 * @returns HTML code corresponding to the requested line, with text and images.
 */
function noteToTextImages(note, imageHeight = -1) {
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
        result += getBOImageHTML(imagePath, imageHeight);
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
 * @param {boolean} overlayFlag  true for overlay, false for configuration window.
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
  const justifyFlex = overlayOnRightSide ? 'justify_flex_end' : 'justify_flex_start';
  htmlString += '<nobr><div class="bo_line bo_line_config ' + justifyFlex + '">';

  // true to use the timer, false for manual selection
  const timingFlag = buildOrderTimer['use_timer'];

  // Current step or time
  htmlString += '<div id="step_time_indication">';
  htmlString +=
      timingFlag ? buildOrderTimer['last_time_label'] : 'Step: ' + (BOStepID + 1) + '/' + stepCount;
  htmlString += '</div>';

  // Previous or next step
  const stepFunctionSuffix = overlayFlag ? 'Overlay' : 'Config';

  htmlString += getImageHTML(
      commonPicturesFolder + 'action_button/previous.png', actionButtonHeight,
      'previousStep' + stepFunctionSuffix, null, timingFlag ? 'timer -1 sec' : 'previous BO step');
  htmlString += getImageHTML(
      commonPicturesFolder + 'action_button/next.png', actionButtonHeight,
      'nextStep' + stepFunctionSuffix, null, timingFlag ? 'timer +1 sec' : 'next BO step');

  // Update timer
  if (timingFlag) {
    htmlString += getImageHTML(
        commonPicturesFolder + 'action_button/' +
            (buildOrderTimer['run_timer'] ? 'start_stop_active.png' : 'start_stop.png'),
        actionButtonHeight, 'startStopBuildOrderTimer', null, 'start/stop the BO timer',
        'start_stop_timer');
    htmlString += getImageHTML(
        commonPicturesFolder + 'action_button/timer_0.png', actionButtonHeight,
        'resetBuildOrderTimer', null, 'reset the BO timer');
  }

  // Switch between manual and timer
  if (overlayFlag && (buildOrderTimer['steps'].length > 0)) {
    htmlString += getImageHTML(
        commonPicturesFolder + 'action_button/manual_timer_switch.png', actionButtonHeight,
        'switchBuildOrderTimerManual', null, 'switch BO mode between timer and manual');
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
    htmlString += getBOImageHTML(commonPicturesFolder + 'icon/time.png') + resourceStep.time;
  }
  htmlString += '</div></nobr>';

  // Line separating resources from notes
  htmlString += '<hr style="width:100%;text-align:left;margin-left:0"></div>';

  // Loop on the steps for notes
  selectedSteps.forEach(function(selectedStep, stepID) {
    // Check if emphasis must be added on the corresponding note
    const emphasisFlag = buildOrderTimer['run_timer'] && (selectedStepsIDs.includes(stepID));

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
 * Show or hide the items depending on the BO validity, the game and selected configuration.
 */
function showHideItems() {
  // List of items to show/hide.
  const libraryItems = [
    'from_library_text', 'bo_faction_selection', 'bo_search_results', 'delete_bo_row',
    'delete_current_bo'
  ];

  const websiteItems = ['external_bo_text', 'external_bo_webistes'];

  const designItems =
      ['design_bo_text', 'design_bo_row_main', 'image_category_line', 'images_bo_display'];
  const rawDesignValidItems = ['add_bo_step', 'format_bo'];
  const designValidTimeItems = ['design_bo_row_time'];
  const designItemsVisualOnly = ['drag_and_drop_note'];
  const designItemsRawOnly = ['image_copy'];

  const saveItems = ['save_bo_text', 'save_row'];

  const displayItems = ['adapt_display_overlay', 'single_panel_page', 'diplay_overlay'];

  // Concatenation of all items
  const fullItems = libraryItems.concat(
      websiteItems, designItems, rawDesignValidItems, designValidTimeItems, designItemsVisualOnly,
      designItemsRawOnly, saveItems, displayItems);

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
          } else if (designItemsRawOnly.includes(itemName)) {
            showItem = !visualEditorActivated;
          } else if (designItemsVisualOnly.includes(itemName)) {
            showItem = visualEditorActivated;
          } else if (rawDesignValidItems.includes(itemName)) {
            showItem = (dataBO !== null) && !visualEditorActivated;
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

    const element = document.getElementById(itemName);
    if (showItem) {  // Valid BO -> show items
      element.style.display =
          element.dataset.originalDisplay ? element.dataset.originalDisplay : 'block';
    } else {  // Invalid BO -> hide items
      if (!element.dataset.originalDisplay) {
        // Save initial display
        element.dataset.originalDisplay = getComputedStyle(element).display;
      }
      element.style.display = 'none';
    }
  }
}

/**
 * Reset the BO data and the BO desing indication message/radio box.
 */
function resetDataBOMsg() {
  updateInvalidDataBO();
  document.getElementById('bo_design_indication').innerHTML = null;
}

/**
 * Initialize the select widgets from the visual editor.
 */
function initVisualEditorSelectWidgets() {
  if (FACTION_FIELD_NAMES[gameName]['player']) {
    let playerFaction = dataBO[FACTION_FIELD_NAMES[gameName]['player']];
    if (Array.isArray(playerFaction)) {
      if (playerFaction.length < 1) {
        return;
      } else {
        playerFaction = playerFaction[0];
      }
    }
    initSelectFaction(
        'visual_edit_faction_select', false, playerFaction,
        FACTION_FIELD_NAMES[gameName]['skip_faction']);
  }

  if (FACTION_FIELD_NAMES[gameName]['opponent']) {
    let opponentFaction = dataBO[FACTION_FIELD_NAMES[gameName]['opponent']];
    if (Array.isArray(opponentFaction)) {
      if (opponentFaction.length < 1) {
        return;
      } else {
        opponentFaction = opponentFaction[0];
      }
    }
    initSelectFaction(
        'visual_edit_opponent_faction_select', false, opponentFaction,
        FACTION_FIELD_NAMES[gameName]['skip_opponent']);
  }

  if (visualEditortableWidgetDescription) {
    const elements = document.querySelectorAll('.visual_edit_bo_select_widget');
    for (const element of elements) {
      initSelecWidgetImages(
          visualEditortableWidgetDescription, element.id, element.getAttribute('defaultValue'));
    }
  }
}

/**
 * Activate the BO visual editor and deactivate the raw editor.
 */
function activateVisualEditor() {
  if (visualEditorActivated) {
    return;
  }
  visualEditorActivated = true;

  const editorVisu = document.getElementById('editor_visu');
  const editorRaw = document.getElementById('editor_raw');
  if (editorVisu && editorRaw) {
    editorVisu.checked = true;
    editorRaw.checked = false;
  }

  updateImagesSelection(document.getElementById('image_class_selection').value);

  document.getElementById('bo_design_raw').style.display = 'none';
  document.getElementById('bo_design_visual').style.display = 'block';
  document.getElementById('bo_design_visual').innerHTML = getVisualEditor();
  document.getElementById('image_copy').style.display = 'none';
  document.getElementById('drag_and_drop_note').style.display = 'block';

  // Initialize the select widgets
  initVisualEditorSelectWidgets();

  showHideItems();  // Update elements to show
}

/**
 * Activate the BO raw editor and deactivate the visual editor.
 */
function activateRawEditor() {
  if (!visualEditorActivated) {
    return;
  }
  visualEditorActivated = false;

  const editorVisu = document.getElementById('editor_visu');
  const editorRaw = document.getElementById('editor_raw');
  if (editorVisu && editorRaw) {
    editorVisu.checked = false;
    editorRaw.checked = true;
  }

  updateImagesSelection(document.getElementById('image_class_selection').value);

  document.getElementById('bo_design_raw').style.display = 'block';
  document.getElementById('bo_design_visual').style.display = 'none';
  document.getElementById('image_copy').style.display = 'block';
  document.getElementById('drag_and_drop_note').style.display = 'none';

  showHideItems();  // Update elements to show
}

/**
 * Update the overlay content based on the BO design input.
 */
function updateDataBO() {
  const BODesingContent = document.getElementById('bo_design_raw').value;

  let validBO = true;      // assuming valid BO
  let validTimer = false;  // assuming BO is not valid for timer
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
        buildOrderTimer['steps'] = getBuildOrderTimerSteps();
        validTimer = true;
      } else {
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

  if (validBO) {  // valid BO
    const commonPicturesFolder = 'assets/common/';
    const checkTimerImage =
        commonPicturesFolder + (validTimer ? 'icon/valid_timing.png' : 'icon/invalid_timing.png');
    const checkTimerHint = validTimer ?
        'This build order is compatible with the timer feature.' :
        'All steps should have a valid timing (as \'x:yy\') in ascending order to use the timer feature.';
    const checkTimerFeature = getImageHTML(
        checkTimerImage, TIMER_CHECK_HEIGHT, null, null, checkTimerHint, 'valid_timing_icon');

    // Radio buttons already existing
    if (document.querySelector('input[type="radio"][name="config_editor"]')) {
      document.getElementById('valid_timing_icon').closest('div').outerHTML = checkTimerFeature;
    } else {  // Radio buttons to create
      const visuEditor =
          '<input type="radio" id="editor_visu" name="config_editor" value="visu" onclick="activateVisualEditor()">' +
          '<label for="editor_visu" class="button">Visual editor</label>';

      const rawEditor =
          '<input type="radio" id="editor_raw" name="config_editor" value="raw" onclick="activateRawEditor()" checked>' +
          '<label for="editor_raw" class="button">Raw editor</label>';

      document.getElementById('bo_design_indication').innerHTML =
          visuEditor + rawEditor + checkTimerFeature;

      // Activate raw editor by default
      activateRawEditor();
    }
  }
  // BO is not valid
  else {
    updateInvalidDataBO();
    // Display error message
    document.getElementById('bo_design_indication').innerHTML = BOValidityMessage;
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
      console.assert(value.length === 2, 'Faction list item should have a size of 2');

      // Check if it is a valid image and get its path
      const imagePath = getImagePath(factionImagesFolder + '/' + value[1]);
      if (imagePath) {
        if (rowCount === 0) {
          imagesContent += '<div class="row">';  // start new row
        }
        if (visualEditorActivated) {
          imagesContent += getImageHTML(imagePath, EDITOR_IMAGE_HEIGHT);
        } else {
          imagesContent +=
              getImageHTML(imagePath, EDITOR_IMAGE_HEIGHT, 'updateImageCopyClipboard', key);
        }

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
        if (visualEditorActivated) {
          imagesContent += getImageHTML(imagePath, EDITOR_IMAGE_HEIGHT);
        } else {
          imagesContent += getImageHTML(
              imagePath, EDITOR_IMAGE_HEIGHT, 'updateImageCopyClipboard', imageWithSubFolder);
        }

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
 * Update the image next to a select, based on this select value.
 *
 * @param {element} selectElement  Select element.
 * @param {string} imageElemID     String ID of the image element to update.
 * @param {int} imageSize          Size of the image to update.
 */
function updateImageFromSelect(selectElement, imageElemID, imageSize) {
  let image = document.getElementById(imageElemID);
  const selectedOption = selectElement.options[selectElement.selectedIndex];

  image.innerHTML =
      getImageHTML(getImagePath(selectedOption.getAttribute('associated_image')), imageSize);

  updateRawBOFromVisualEditor();
}

/**
 * Initialize a select widget to select a faction.
 *
 * @param {string} selectWidgetID     ID of the select widget to update.
 * @param {boolean} displayShortName  true to display short name, false for full name.
 * @param {string} defaultValue       Default value for initialization
 *                                    (null to keep the first option).
 * @param {string} skipFactions       List of faction to skip, null to keep all of them.
 */
function initSelectFaction(
    selectWidgetID, displayShortName, defaultValue = null, skipFactions = null) {
  let selectWidget = document.getElementById(selectWidgetID);

  selectWidget.innerHTML = null;  // clear all options
  selectWidget.style.display = 'block';

  console.assert(Object.keys(factionsList).length >= 1, 'At least one faction expected.');

  // Loop on all the factions
  for (const [factionName, shortAndImage] of Object.entries(factionsList)) {
    if (skipFactions && skipFactions.includes(factionName)) {
      continue;
    }
    console.assert(shortAndImage.length === 2, '\'shortAndImage\' should have a size of 2');

    let option = document.createElement('option');
    option.text = displayShortName ? shortAndImage[0] : factionName;
    option.value = factionName;
    option.setAttribute('associated_image', factionImagesFolder + '/' + shortAndImage[1]);
    selectWidget.add(option);
  }

  // Set default value if provided
  if (defaultValue) {
    // Special case for 'any', 'Any' and 'Generic', which are synonymous
    const specialValues = ['any', 'Any', 'Generic'];
    if (specialValues.includes(defaultValue) &&
        !Array.from(selectWidget.options).some(option => option.value === defaultValue)) {
      for (let option of selectWidget.options) {
        if (specialValues.includes(option.value)) {
          defaultValue = option.value;
          break;
        }
      }
    }

    selectWidget.value = defaultValue;
  }

  // Force first 'onchange'
  let event = new Event('change');
  selectWidget.dispatchEvent(event);
}

/**
 * Initialize a selction widget with images.
 *
 * @param {Array} tableDescription  Table with each option as [value, text,
 *     image].
 * @param {string} selectWidgetID   Selection widget ID.
 * @param {string} defaultValue     Default value for initialization
 *                                  (null to keep the first option).
 */
function initSelecWidgetImages(tableDescription, selectWidgetID, defaultValue = null) {
  let selectWidget = document.getElementById(selectWidgetID);

  selectWidget.innerHTML = null;  // clear all options
  selectWidget.style.display = 'block';

  // Loop on all entries
  tableDescription.forEach(entry => {
    const [value, text, image] = entry;

    let option = document.createElement('option');
    option.text = text;
    option.value = value;
    option.setAttribute('associated_image', image);
    selectWidget.add(option);
  });

  // Set default value if provided
  if (defaultValue) {
    selectWidget.value = defaultValue;
  }

  // Force first 'onchange'
  let event = new Event('change');
  selectWidget.dispatchEvent(event);
}

/**
 * Initialize the faction selection for the BO library filtering.
 */
function initLibraryFactionSelection() {
  // No BO currently selected
  selectedBOFromLibrary = null;

  // Filter on player faction, then on opponent faction
  for (const widgetID of ['library_faction_select_widget', 'bo_opponent_faction_select_widget']) {
    // Widget to select the faction (for BOs filtering)
    let factionSelectWidget = document.getElementById(widgetID);

    // Skip if no opponent faction filtering
    if ((widgetID === 'bo_opponent_faction_select_widget') &&
        !FACTION_FIELD_NAMES[gameName]['opponent']) {
      factionSelectWidget.innerHTML = null;  // clear all options
      factionSelectWidget.style.display = 'none';
      document.getElementById('bo_opponent_faction_image').innerHTML = null;
    }
    // Display faction filtering
    else {
      initSelectFaction(widgetID, true);
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
      '<input type="radio" id="config_library" name="main_config_radios" value="library"' +
      ' checked onchange="mainConfigUpdate(this)">' +
      '<label for="config_library" class="button">From library</label>';

  const fromWebsite =
      '<input type="radio" id="config_website" name="main_config_radios" value="website"' +
      ' onchange="mainConfigUpdate(this)">' +
      '<label for="config_website" class="button">From external website</label>';

  const designYourOwn =
      '<input type="radio" id="config_design" name="main_config_radios" value="design"' +
      ' onchange="mainConfigUpdate(this)">' +
      '<label for="config_design" class="button">Design your own</label>';

  // Add or not the website section (checking if there is at least one website).
  const fullContent = (gameName in EXTERNAL_BO_WEBSITES) ?
      fromLibrary + fromWebsite + designYourOwn :
      fromLibrary + designYourOwn;

  document.getElementById('main_configuration').innerHTML = fullContent;

  // Updating to library configuration
  mainConfiguration = 'library';
  showHideItems();
}

/**
 * Updating when selecting another main configuration
 *
 * @param {Object} radio  Radio element being updated
 */
function mainConfigUpdate(radio) {
  mainConfiguration = radio.value;
  showHideItems();

  if (mainConfiguration == 'website') {
    activateRawEditor();  // Set to raw editor for external website
  } else if (mainConfiguration == 'design') {
    // Reset build order if welcome message still active
    if (welcomeMessageActive &&
        document.getElementById('bo_design_raw').value === getWelcomeMessage()) {
      resetBuildOrder();
      welcomeMessageActive = false;
    }
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
          entry.length === 3, 'All entries in \'EXTERNAL_BO_WEBSITES\' must have a size of 3.');

      // Clicking on the button calls a function
      if (entry[1].startsWith('function:')) {
        let functionName = entry[1].substring(9);  // Remove the "function:" prefix.

        linksContent +=
            '<button type="button" class="button tooltip" onclick="' + functionName + '">';
        linksContent += entry[0];
        linksContent += '<span class="tooltiptext_right">';
        linksContent += '<div>' + entry[2] + '</div>';
        linksContent += '</span>';
        linksContent += '</button>';
      } else {  // Clicking on the button opens a tab with the specified website
        linksContent += '<form action="' + entry[1] + '" target="_blank" class="tooltip">';
        linksContent += '<input class="button" type="submit" value="' + entry[0] + '" />';
        linksContent += '<span class="tooltiptext_right">';
        linksContent +=
            '<div>External build order website providing build orders with RTS Overlay format.</div>';
        linksContent += '-----';
        linksContent += '<div>To import the requested build order:</div>';
        linksContent += '<div>1. Select the requested build order on ' + entry[0] + '.</div>';
        linksContent += '<div>2. ' + entry[2] + '</div>';
        linksContent += '<div>3. Paste the clipboard content on the right panel.</div>';
        linksContent += '</span>';
        linksContent += '</form>';
      }
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
<div>On Windows, use '<em>chrome.exe --app=https://rts-overlay.github.io</em>' in the <em>Run</em> app to run it with</div>
<div>a smaller header on Chrome (solution depending on the selected web browser).</div>
  `;

  return htmlString;
}

/**
 * Update the build order elements (font size, images size and position) based on widgets.
 */
function updateBOFromWidgets() {
  // Font size
  const fontSize = parseFloat(document.getElementById('bo_fontsize').value).toFixed(1).toString();
  let boPanelElement = document.getElementById('bo_panel');
  boPanelElement.style.fontSize = fontSize + 'em';

  // Images size
  const imagesSize = parseInt(document.getElementById('bo_images_size').value);

  if (imagesSize !== imageHeightBO) {
    imageHeightBO = imagesSize;
    actionButtonHeight = ACTION_BUTTON_HEIGHT_RATIO * imagesSize;
    updateBOPanel(false);
  }

  // Fixed top corner choice
  const newOverlayOnRightSide = document.getElementById('left_right_side').checked;
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
 * @param {string} newGameName  Short name of the game.
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
  initLibraryFactionSelection();
  readLibrary();
  updateLibrarySearch();

  // Initialize the BO panel
  resetDataBOMsg();
  activateRawEditor();
  document.getElementById('bo_design_raw').value = getWelcomeMessage();
  welcomeMessageActive = true;
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
          throw new Error('Could not fetch data from ' + apiUrl + ' | ' + response.status);
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

    // Initialize BO from external API call
    if (arrayOptions.length == 2) {
      if (EXTERNAL_API_CALLS_INITIALIZATION.hasOwnProperty(gameName)) {
        const gameDict = EXTERNAL_API_CALLS_INITIALIZATION[gameName];

        if (gameDict.hasOwnProperty(arrayOptions[0])) {
          const templateUrl = gameDict[arrayOptions[0]];
          const apiUrl = templateUrl.replace('XXXXX', arrayOptions[1]);

          getBOFromApi(apiUrl).then(result => {
            if (result) {
              document.getElementById('bo_design_raw').value = result;
              updateDataBO();
              stepID = 0;
              limitStepID();
              updateBOPanel(false);
              if (dataBO) {
                activateVisualEditor();
                document.getElementById('bo_design_visual').innerHTML = getVisualEditor();
                initVisualEditorSelectWidgets();
              }
            } else {
              console.log(
                  'Could not fetch the build order for ' + gameName + ' from ' + arrayOptions[0] +
                  '.');
            }
          });
        }
      }
    }
  }

  // Get the images available
  imagesCommon = getImagesCommon();

  // Update the title of the configuration page
  updateTitle();

  // Update the hotkeys tooltip for 'Diplay overlay'
  document.getElementById('diplay_overlay_tooltiptext').innerHTML = getDiplayOverlayTooltiptext();

  // Set default sliders values
  document.getElementById('bo_fontsize').value = DEFAULT_BO_PANEL_FONTSIZE;
  document.getElementById('bo_images_size').value = DEFAULT_BO_PANEL_IMAGES_SIZE;
  document.getElementById('left_right_side').checked = DEFAULT_OVERLAY_ON_RIGHT_SIDE;
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
  document.getElementById('bo_design_raw').addEventListener('input', function() {
    updateDataBO();
    updateBOPanel(false);
  });

  // Update the selection images each time a new category is selected
  document.getElementById('image_class_selection').addEventListener('input', function() {
    updateImagesSelection(document.getElementById('image_class_selection').value);
  });

  // Update BO elements when any slider is moving
  document.getElementById('bo_fontsize').addEventListener('input', function() {
    updateBOFromWidgets();
  });

  document.getElementById('bo_images_size').addEventListener('input', function() {
    updateBOFromWidgets();
  });

  // Update BO side selection when updating the corresponding toggle
  document.getElementById('left_right_side').addEventListener('input', function() {
    updateBOFromWidgets();
  });

  // Update the library search for each new input or faction selection
  document.getElementById('bo_faction_text').addEventListener('input', function() {
    updateLibrarySearch();
  });

  document.getElementById('library_faction_select_widget').addEventListener('input', function() {
    updateLibraryValidKeys();
    updateLibrarySearch();
  });

  document.getElementById('bo_opponent_faction_select_widget')
      .addEventListener('input', function() {
        updateLibraryValidKeys();
        updateLibrarySearch();
      });

  // Using arrow keys and enter to select image from the visual grid
  document.addEventListener('keydown', function(event) {
    if (visualGridColumnCount >= 1 && visualGridActiveIndex >= 0 &&
        visualGridMatchingNames.length >= 1 && visualGridImages.length >= 1) {
      let visualGridNewIndex = visualGridActiveIndex;

      // Move on the grid with arrow keys
      if (event.key === 'ArrowRight' &&
          visualGridActiveIndex % visualGridColumnCount !== visualGridColumnCount - 1)
        visualGridNewIndex++;
      else if (event.key === 'ArrowLeft' && visualGridActiveIndex % visualGridColumnCount !== 0)
        visualGridNewIndex--;
      else if (event.key === 'ArrowDown')
        visualGridNewIndex += visualGridColumnCount;
      else if (event.key === 'ArrowUp')
        visualGridNewIndex -= visualGridColumnCount;

      // Update only if different and valid cell ID
      if (visualGridNewIndex !== visualGridActiveIndex && 0 <= visualGridNewIndex &&
          visualGridNewIndex < visualGridMatchingNames.length) {
        visualGridImages[visualGridActiveIndex].style.outline = '';
        visualGridActiveIndex = visualGridNewIndex;
        visualGridImages[visualGridActiveIndex].style.outline =
            VISUAL_GRID_IMAGE_GAP + 'px solid ' + VISUAL_GRID_OUTLINE_COLOR;
      }

      if (event.key === 'Enter') {  // select image
        applyVisualImageGrid(visualGridImages[visualGridActiveIndex].dataset.relativePath);
      } else if (event.key === 'Escape') {  // remove grid selection
        removeVisualImagesGrid();
      }
    }
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
  let content = '<div>' + getImageHTML('assets/common/icon/info.png', INFO_IMAGE_HEIGHT) + '</div>';
  content += '<span id="tooltip_rts_overlay_info" class="tooltiptext_left"><div>' +
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
  document.getElementById('salamander').innerHTML =
      getImageHTML('assets/common/icon/salamander_sword_shield.png', SALAMANDER_IMAGE_HEIGHT);
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
  document.getElementById('bo_panel').innerHTML = getBOPanelContent(overlayFlag, stepID);

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
        'feather.png#gears.png#hide.png#leave.png#load.png#manual_timer_switch.png#next.png#pause.png#previous.png#save.png#start_stop.png#start_stop_active.png#timer_0.png#to_beginning.png#to_end.png',
    'icon':
        'blue_plus.png#cross.png#down_arrow.png#grey_return.png#house.png#info.png#invalid_timing.png#light_blue_plus.png#logo-192.png#logo-512.png#mouse.png#orange_cross.png#question_mark.png#red_cross.png#salamander_sword_shield.png#salamander_sword_shield_small.png#time.png#top_arrow.png#valid_timing.png'
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
      if (['any', 'Any', 'Generic'].includes(dataCheck) || ['any', 'Any'].includes(target)) {
        continue;
      }
      const isArray = Array.isArray(dataCheck);
      if ((isArray && (!dataCheck.includes(target))) || (!isArray && (target !== dataCheck))) {
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
 * @param {boolean} toLower     true to look in the dictionary with key set in lower case.
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
    console.assert(1 <= setCount && setCount <= splitCount, 'setCount value not correct.');

    // ID of the first element
    for (let firstID = 0; firstID < setCount; firstID++) {
      console.assert(0 <= firstID && firstID < splitCount, 'firstID value not correct.');
      let checkNote = noteSplit[firstID];

      for (let nextElemID = firstID + 1; nextElemID < firstID + gatherCount;
           nextElemID++) {  // gather the next elements
        console.assert(1 <= nextElemID && nextElemID < splitCount, 'nextElemID not correct.');
        checkNote += ' ' + noteSplit[nextElemID];
      }

      let updatedCheckNote = checkNote.slice(0);  // update based on requests (slice for copy)

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
          for (let characterID = checkNoteLen - 1; characterID >= 0; characterID--) {
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
          console.assert(0 <= beforeID && beforeID < splitCount, 'beforeID value not correct.');
          beforeNote += ' ' + noteSplit[beforeID];
        }
        beforeNote = beforeNote.replaceAll(/^\s+/gm, '');  // lstrip in Python

        // Gather note parts after the found sub-note
        let afterNote = '';
        for (let afterID = firstID + gatherCount; afterID < splitCount; afterID++) {
          console.assert(0 <= afterID && afterID < splitCount, 'afterID value not correct.');
          afterNote += ' ' + noteSplit[afterID];
        }
        afterNote = afterNote.replaceAll(/^\s+/gm, '');  // lstrip in Python

        // Compose final note with part before, sub-note found and part after
        let finalNote = '';
        if (beforeNote !== '') {
          finalNote +=
              convertTXTNoteToIllustrated(beforeNote, convertDict, toLower, maxSize, ignoreInDict) +
              ' ';
        }

        finalNote += ignoreBefore + '@' + convertDict[updatedCheckNote] + '@' + ignoreAfter;

        if (afterNote !== '') {
          finalNote += ' ' +
              convertTXTNoteToIllustrated(afterNote, convertDict, toLower, maxSize, ignoreInDict);
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
 * @returns Corresponding string (as 'x:xx'), '0:00' if not valid (or negative) time.
 */
function buildOrderTimeToStr(timeSec) {
  if (!Number.isInteger(timeSec) || (timeSec <= 0)) {
    return '0:00';
  }

  return Math.floor(timeSec / 60).toString() + ':' + ('0' + (timeSec % 60).toString()).slice(-2);
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
 * @param {Array} steps           Steps obtained with 'getBuildOrderTimerSteps'.
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
 * @returns Array of size 2: [step IDs of the output list (see below), list of steps to display].
 */
function getBuildOrderTimerStepsDisplay(steps, stepIDs) {
  // Safety and sorting
  console.assert(stepIDs.length > 0, 'stepIDs must be > 0.');
  for (const stepID of stepIDs) {
    console.assert(0 <= stepID && stepID < steps.length, 'Invalid value for stepID.');
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
    if (!buildOrderTimer['use_timer'] && (buildOrderTimer['steps_ids'].length > 0)) {
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
        (buildOrderTimer['run_timer'] ? 'start_stop_active.png' : 'start_stop.png');
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

    if (newRunState !== buildOrderTimer['run_timer']) {  // only update if change
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
 * @returns Array of size 2: [step IDs of the output list (see below), list of steps to display].
 */
function getBuildOrderSelectedStepsAndIDs(BOStepID) {
  if (buildOrderTimer['use_timer'] && buildOrderTimer['steps'].length > 0) {
    // Get steps to display
    return getBuildOrderTimerStepsDisplay(buildOrderTimer['steps'], buildOrderTimer['steps_ids']);
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
        return invalidMsg(BONameStr + 'Valid "' + factionName + '" list is empty.');
      }

      for (const faction of factionData) {  // Loop on the provided factions
        const anyFlag = ['any', 'Any'].includes(faction);
        if (!(!anyFlag && (faction in factionsList)) && !(anyFlag && anyValid)) {
          return invalidMsg(
              BONameStr + 'Unknown ' + factionName + ' "' + faction + '" (check spelling).');
        }
      }
    }
    // Single faction provided
    else {
      const anyFlag = ['any', 'Any'].includes(factionData);
      if (!(!anyFlag && (factionData in factionsList)) && !(anyFlag && anyValid)) {
        return invalidMsg(
            BONameStr + 'Unknown ' + factionName + ' "' + factionData + '" (check spelling).');
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
    if (this.type !== 'integer' || !Number.isInteger(value) || !this.validRange) {
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
      return invalidMsg('Wrong value (' + value + '), expected ' + this.type + ' type.');
    }

    if (!this.checkRange(value)) {
      return invalidMsg(
          'Wrong value (' + value + '), must be in [' + this.validRange[0] + ' ; ' +
          this.validRange[1] + '] range.');
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
    const prefixMsg =
        BONameStr + 'Step ' + (stepID + 1).toString() + '/' + buildOrderData.length + ' | ';

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
                  prefixMsg + '"' + field.parentName + '/' + field.name + '" | ' + res[1]);
            }
          }
          // Child field is missing
          else if (field.requested) {
            return invalidMsg(
                prefixMsg + 'Missing field: "' + field.parentName + '/' + field.name + '".');
          }
        }
        // Parent field missing
        else if (field.requested) {
          return invalidMsg(prefixMsg + 'Missing field: "' + field.parentName + '".');
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
    document.getElementById('bo_design_raw').value = JSON.stringify(dataBO, null, 4);

    // Update BO and panel
    updateDataBO();
    updateBOPanel(false);

    // Update visual editor
    if (visualEditorActivated) {
      updateVisualEditorAfterButton();
    }
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
    buildOrderTimer['time_sec'] = buildOrderTimer['time_sec_init'] + elapsedTime;
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
        buildOrderTimer['last_steps_ids'] = buildOrderTimer['steps_ids'].slice();  // slice for copy
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
    document.getElementById('bo_design_raw').value = JSON.stringify(dataBO, null, 4);
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
  activateVisualEditor();

  // Update visual editor
  if (visualEditorActivated) {
    document.getElementById('bo_design_visual').innerHTML = getVisualEditor();
    initVisualEditorSelectWidgets();
  }
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
  navigator.clipboard.writeText(document.getElementById('bo_design_raw').value);
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

  // Use file content for 'bo_design_raw' text area
  let reader = new FileReader();
  reader.onload = function(e) {
    bo_design_raw.value = e.target.result;
    updateDataBO();
    updateBOPanel(false);

    if (visualEditorActivated) {  // Update visual editor if active
      document.getElementById('bo_design_visual').innerHTML = getVisualEditor();
      initVisualEditorSelectWidgets();
    }
  };
  reader.readAsText(file, 'UTF-8');
}

/**
 * Save the build order in a file.
 *
 * @param {Object} data  Build order content, null to use the 'bo_design_raw' panel content.
 */
function saveBOToFile(data = null) {
  // Get from 'bo_design_raw' panel if BO not provided
  if (!data) {
    data = JSON.parse(document.getElementById('bo_design_raw').value);
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

  const text = 'Are you sure you want to delete the build order \'' + selectedBOFromLibrary +
      '\' (' + gameFullName + ') from your local storage?\nThis cannot be undone.';
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
  const text = 'Are you sure you want to delete ALL BUILD ORDERS (from ' + gameFullName +
      ') from your local storage?' +
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
      const text = 'There is already a build order with name \'' + dataBO['name'] + '\' for ' +
          gameFullName + '.\nDo you want to replace it with your new build order?';
      if (!confirm(text)) {
        return;
      }
    } else {
      const text = 'Do you want to save your build order with name \'' + dataBO['name'] +
          '\' for ' + gameFullName + '?';
      if (!confirm(text)) {
        return;
      }
    }

    localStorage.setItem(keyName, JSON.stringify(dataBO));
    readLibrary();
    updateLibrarySearch();
    alert('Build order saved with key name \'' + keyName + '\' in local storage.');

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
        matrix[i][j] =
            Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + 1);
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
  console.assert(lenSmall <= lenLarge, '\'strSmall\' must be smaller than \'strLarge\'.');

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
    const currentScore = computeLevenshtein(strSmall, strLarge.slice(i, i + lenSmall));
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
        document.getElementById('library_faction_select_widget').value;
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

  document.getElementById('search_key_line_' + id).classList.add('search_key_select');
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
  document.getElementById('bo_design_raw').value = JSON.stringify(library[key]);
  updateDataBO();
  formatBuildOrder();
  updateBOPanel(false);

  if (dataBO) {
    activateVisualEditor();
    document.getElementById('bo_design_visual').innerHTML = getVisualEditor();
    initVisualEditorSelectWidgets();
  }

  // Update build order search lines
  let boSearchText = '<div " class="search_key_line">Selected build order:</div>';
  boSearchText += '<div " class="search_key_line search_key_select">' + key + '</div>';

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
  const searchStr = document.getElementById('bo_faction_text').value.toLowerCase();

  // Selected BO is null if the search field is not empty
  if (searchStr !== '') {
    selectedBOFromLibrary = null;
  }

  let boSearchText = '';  // Text printed for the BO search

  // Library is empty
  if (Object.keys(library).length === 0) {
    boSearchText += '<div>No build order in library for <i>' + gameFullName + '</i>.</div>';
    if (gameName in EXTERNAL_BO_WEBSITES) {
      boSearchText +=
          '<div>Download one <b>from an external website</b> or <b>design your own</b>.</div>';
    } else {
      boSearchText += '<div><b>Design your own</b> build order in the corresponding panel.</div>';
    }
  }
  // No build order for the currently selected faction condition
  else if (libraryValidKeys.length === 0) {
    boSearchText += '<div>No build order in your library for faction <b>' +
        document.getElementById('library_faction_select_widget').value + '</b>';
    if (FACTION_FIELD_NAMES[gameName]['opponent']) {
      boSearchText += ' with opponent <b>' +
          document.getElementById('bo_opponent_faction_select_widget').value + '</b>';
    }
    boSearchText += '.</div>';
  }
  // At least one valid build order for the currently selected faction condition
  else {
    // Nothing added in the search field
    if (searchStr.length === 0) {
      const factionName = document.getElementById('library_faction_select_widget').value;
      boSearchText += '<div>Select the player faction above (' + factionsList[factionName][0] +
          ': <b>' + factionName + '</b>)';

      if (FACTION_FIELD_NAMES[gameName]['opponent']) {
        const opponentFactionName =
            document.getElementById('bo_opponent_faction_select_widget').value;
        boSearchText += ' and opponent faction (' + factionsList[opponentFactionName][0] + ': <b>' +
            opponentFactionName + '</b>)';
      }
      boSearchText += '.</div>';

      boSearchText +=
          '<div>Then, add <b>keywords</b> in the text field to search any build order from your library.</div>';
      boSearchText += '<div>Alternatively, use <b>a single space</b> to select the first ' +
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
        librarySortedKeys.sort((a, b) => compareLibraryKeys(librayKeyScores, a, b));

        // Only keep the first results
        librarySortedKeys = librarySortedKeys.slice(0, MAX_SEARCH_RESULTS);

        // Sort by faction requirement
        librarySortedKeys.sort((a, b) => compareLibraryFaction(keyCondition, a, b));
      }
      // Take the first results, sorting only by faction requirement
      else {
        // Copy full list of valid keys
        librarySortedKeys = libraryValidKeys.slice();

        // Sort by faction requirement
        librarySortedKeys.sort((a, b) => compareLibraryFaction(keyCondition, a, b));

        // Only keep the first results
        librarySortedKeys = librarySortedKeys.slice(0, MAX_SEARCH_RESULTS);
      }

      // Print the corresponding build order keys (names) with hovering and clicking interactions.
      let keyID = 0;
      for (const key of librarySortedKeys) {
        boSearchText += '<div id="search_key_line_' + keyID +
            '" class="search_key_line" onmouseover="mouseOverSearchResult(' + keyID +
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
   * @param {string} text                Text to use instead of an image.
   * @param {boolean} italic             true for italic.
   * @param {boolean} bold               true for bold.
   * @param {boolean} optional           true if field is optional.
   * @param {boolean} isIntegerInRawBO   true if field is represented by an integer in raw BO.
   * @param {boolean} hideIfAbsent       true to  hide if fully absent.
   * @param {boolean} displayIfPositive  true to display only if it is > 0,
   *                                     should be 'false' for non-integers.
   * @param {boolean} showOnlyPositive   true to only show the positive characters.
   * @param {Array} backgroundColor      Color of the background, null to keep default.
   * @param {string} textAlign           Value for 'text-align', null for default.
   * @param {string} tooltip             Tootlip to show, null for no tooltip.
   * @param {boolean} isSelectwidget     true if selection widget column.
   */
  constructor(
      field, image = null, text = null, italic = false, bold = false, optional = false,
      isIntegerInRawBO = false, hideIfAbsent = false, displayIfPositive = false,
      showOnlyPositive = false, backgroundColor = null, textAlign = null, tooltip = null,
      isSelectwidget = false) {
    this.field = field;
    this.image = image;
    this.text = text;
    this.italic = italic;
    this.bold = bold;
    this.optional = optional;
    this.isIntegerInRawBO = isIntegerInRawBO;
    this.hideIfAbsent = hideIfAbsent;
    this.displayIfPositive = displayIfPositive;
    this.showOnlyPositive = showOnlyPositive;
    this.backgroundColor = backgroundColor;
    this.textAlign = textAlign;
    this.tooltip = tooltip;
    this.isSelectwidget = isSelectwidget;
  }
}

/**
 * Get the HTML code to represent a circle button.
 *
 * @param {string} imageName       Name of the image (with relative path and extension).
 * @param {int} buttonSize         Vertical size of the button.
 * @param {string} functionName    Name of the function to call when clicking on the button.
 * @param {string} tooltipText     Optional tooltip to add (null to skip).
 * @param {boolean} tooltipOnLeft  true for tooltip on left (if any), false for right.
 *
 * @returns Requested HTML code.
 */
function getCircleButton(
    imageName, buttonSize, functionName, tooltipText = null, tooltipOnLeft = true) {
  htmlResult = '<button class="button circle_button">';
  htmlResult += getImageHTML(
      'assets/common/' + imageName, buttonSize, functionName, 'this', tooltipText, null,
      tooltipOnLeft, false);
  htmlResult += '</button>';

  return htmlResult;
}

/**
 * Get the table <tr> line corresponding to an image button being clicked.
 *
 * @param {Object} buttonImage  Image of the button with the 'onclick' event.
 *
 * @returns Requested <tr> line, null if not found.
 */
function getVisualEditorLinefromButtonImage(buttonImage) {
  // Safety checks
  if (!dataBO && !Object.keys(dataBO).includes('build_order')) {
    return;
  }
  if (!buttonImage) {
    return null;
  }
  // Button is 2 steps above its image, corresponding <tr> line is 2 steps above the button.
  let targetElement = buttonImage.parentElement?.parentElement?.parentElement?.parentElement;

  if (targetElement && targetElement.classList.contains('visual_editor_button_line')) {
    return targetElement;
  }
  return null;
}

/**
 * Update the visual editor (and other dependent parts) after clicking on button.
 */
function updateVisualEditorAfterButton() {
  document.getElementById('bo_design_raw').value = JSON.stringify(dataBO, null, 4);
  document.getElementById('bo_design_visual').innerHTML = getVisualEditor();
  initVisualEditorSelectWidgets();
}

/**
 * Add a metadata optional line.
 *
 * @param {Object} buttonImage  Instance of the image corresponding to the button.
 */
function addMetaDataLine(buttonImage) {
  // Get line of the button
  const trLine = getVisualEditorLinefromButtonImage(buttonImage);
  if (!trLine) {
    console.log('No visual editor line found when adding a metadata line.');
    return;
  }

  // Name of the new key
  let newKey = 'field name';
  if (newKey in dataBO) {  // Set it to 'field name X', with X >= 2
    let counter = 2;
    while (`${newKey} ${counter}` in dataBO) {
      counter++;
    }
    newKey = `${newKey} ${counter}`;
  }

  // Instert new key after 'insertKey'
  let insertKey = '';
  if (trLine.id === 'visual_editor_faction_line') {
    insertKey = FACTION_FIELD_NAMES[gameName]['player'];
  } else if (trLine.id === 'visual_editor_opponent_faction_line') {
    insertKey = FACTION_FIELD_NAMES[gameName]['opponent'];
  } else {
    const firstTd = trLine.querySelector('td');  // Find the first <td> child
    if (firstTd) {
      insertKey = firstTd.textContent;
    } else {
      console.log('No <td> element found inside the trLine.');
    }
  }

  // Assign the new metadata just after the insert key
  if (insertKey !== '' && dataBO.hasOwnProperty(insertKey)) {
    const updatedDataBO = {};
    const keys = Object.keys(dataBO);

    keys.forEach(key => {
      updatedDataBO[key] = dataBO[key];

      if (key === insertKey) {
        updatedDataBO[newKey] = 'Note';
      }
    });
    dataBO = updatedDataBO;
    updateVisualEditorAfterButton();
  } else {
    console.log('No valid insertion key found.');
  }
}

/**
 * Remove a metadata optional line.
 *
 * @param {Object} buttonImage  Instance of the image corresponding to the button.
 */
function removeMetaDataLine(buttonImage) {
  // Get line of the button
  const trLine = getVisualEditorLinefromButtonImage(buttonImage);
  if (!trLine) {
    console.log('No visual editor line found when removing a metadata line.');
    return;
  }

  const firstTd = trLine.querySelector('td');  // Find the first <td> child
  if (firstTd) {
    delete dataBO[firstTd.textContent];
    updateVisualEditorAfterButton();
  } else {
    console.log('No <td> element found inside the trLine.');
  }
}

/**
 * Move a step (field and note lines) upwards.
 *
 * @param {Object} buttonImage  Instance of the image corresponding to the button.
 */
function moveStepLinesUp(buttonImage) {
  // Get line of the button
  const trLine = getVisualEditorLinefromButtonImage(buttonImage);
  if (!trLine) {
    console.log('No visual editor line found when moving a step upwards.');
    return;
  }

  const match = trLine.id.match(/^visual_edit_bo_field_row_(\d+)$/);  // Get step ID
  if (match) {
    const currentStepID = parseInt(match[1]);
    let buildOrderData = dataBO['build_order'];

    if (1 <= currentStepID && currentStepID <= buildOrderData.length - 1) {
      // Swap position with previous element
      [buildOrderData[currentStepID - 1], buildOrderData[currentStepID]] =
          [buildOrderData[currentStepID], buildOrderData[currentStepID - 1]];
      updateVisualEditorAfterButton();
    } else {
      console.log('Step ID is not valid to move a step upwards.');
    }
  } else {
    console.log('No matching integer found for step ID.');
  }
}

/**
 * Move a step (field and note lines) downwards.
 *
 * @param {Object} buttonImage  Instance of the image corresponding to the button.
 */
function moveStepLinesDown(buttonImage) {
  // Get line of the button
  const trLine = getVisualEditorLinefromButtonImage(buttonImage);
  if (!trLine) {
    console.log('No visual editor line found when moving a step downwards.');
    return;
  }

  const match = trLine.id.match(/^visual_edit_bo_field_row_(\d+)$/);  // Get step ID
  if (match) {
    const currentStepID = parseInt(match[1]);
    let buildOrderData = dataBO['build_order'];

    if (0 <= currentStepID && currentStepID <= buildOrderData.length - 2) {
      // Swap position with previous element
      [buildOrderData[currentStepID], buildOrderData[currentStepID + 1]] =
          [buildOrderData[currentStepID + 1], buildOrderData[currentStepID]];
      updateVisualEditorAfterButton();
    } else {
      console.log('Step ID is not valid to move a step downwards.');
    }
  } else {
    console.log('No matching integer found for step ID.');
  }
}

/**
 * Add a step (field and note lines) below the selected step.
 *
 * @param {Object} buttonImage  Instance of the image corresponding to the button.
 */
function addStepLinesBelow(buttonImage) {
  // Get line of the button
  const trLine = getVisualEditorLinefromButtonImage(buttonImage);
  if (!trLine) {
    console.log('No visual editor line found when adding a step below the selected step.');
    return;
  }

  const match = trLine.id.match(/^visual_edit_bo_field_row_(\d+)$/);  // Get step ID
  if (match) {
    const currentStepID = parseInt(match[1]);
    let buildOrderData = dataBO['build_order'];

    if (0 <= currentStepID && currentStepID < buildOrderData.length) {
      buildOrderData.splice(currentStepID + 1, 0, getBOStep(dataBO.build_order, currentStepID));
      stepCount = buildOrderData.length;
      stepID = currentStepID + 1;
      limitStepID();
      updateVisualEditorAfterButton();
    } else {
      console.log('Step ID is not valid to add a new step.');
    }
  } else {
    console.log('No matching integer found for step ID.');
  }
}

/**
 * Remove a step (field and note lines).
 *
 * @param {Object} buttonImage  Instance of the image corresponding to the button.
 */
function removeStepLines(buttonImage) {
  // Get line of the button
  const trLine = getVisualEditorLinefromButtonImage(buttonImage);
  if (!trLine) {
    console.log('No visual editor line found when removing a step.');
    return;
  }

  const match = trLine.id.match(/^visual_edit_bo_field_row_(\d+)$/);  // Get step ID
  if (match) {
    const currentStepID = parseInt(match[1]);
    let buildOrderData = dataBO['build_order'];

    if (0 <= currentStepID && currentStepID < buildOrderData.length) {
      buildOrderData.splice(currentStepID, 1);
      stepCount = buildOrderData.length;
      limitStepID();
      updateVisualEditorAfterButton();
    } else {
      console.log('Step ID is not valid to remove a step.');
    }
  } else {
    console.log('No matching integer found for step ID.');
  }
}

/**
 * Add a note line below the selected note.
 *
 * @param {Object} buttonImage  Instance of the image corresponding to the button.
 */
function addNoteLineBelow(buttonImage) {
  // Get line of the button
  const trLine = getVisualEditorLinefromButtonImage(buttonImage);
  if (!trLine) {
    console.log('No visual editor line found when adding a note below the selected note.');
    return;
  }

  const match = trLine.id.match(/^visual_edit_note_line_(\d+)_(\d+)$/);  // Get step and note IDs
  if (match) {
    const currentStepID = parseInt(match[1]);
    const currentNoteID = parseInt(match[2]);
    let buildOrderData = dataBO['build_order'];

    if (0 <= currentStepID && currentStepID < buildOrderData.length) {
      let noteData = buildOrderData[currentStepID]['notes'];
      if (0 <= currentNoteID && currentNoteID < noteData.length) {
        noteData.splice(currentNoteID + 1, 0, 'Note');
        updateVisualEditorAfterButton();
      } else {
        console.log('Note ID is not valid to add a note.');
      }
    } else {
      console.log('Step ID is not valid to add a note.');
    }
  } else {
    console.log('No matching integer found for step and note IDs.');
  }
}

/**
 * Remove a note line.
 *
 * @param {Object} buttonImage  Instance of the image corresponding to the button.
 */
function removeNoteLine(buttonImage) {
  // Get line of the button
  const trLine = getVisualEditorLinefromButtonImage(buttonImage);
  if (!trLine) {
    console.log('No visual editor line found when removing a note.');
    return;
  }

  const match = trLine.id.match(/^visual_edit_note_line_(\d+)_(\d+)$/);  // Get step and note IDs
  if (match) {
    const currentStepID = parseInt(match[1]);
    const currentNoteID = parseInt(match[2]);
    let buildOrderData = dataBO['build_order'];

    if (0 <= currentStepID && currentStepID < buildOrderData.length) {
      let noteData = buildOrderData[currentStepID]['notes'];
      if (0 <= currentNoteID && currentNoteID < noteData.length) {
        noteData.splice(currentNoteID, 1);
        updateVisualEditorAfterButton();
      } else {
        console.log('Note ID is not valid to remove a note.');
      }
    } else {
      console.log('Step ID is not valid to remove a note.');
    }
  } else {
    console.log('No matching integer found for step and note IDs.');
  }
}

/**
 * Add a button to add an optional metadata line.
 *
 * @returns Requested HTML code.
 */
function addMetaDataButton() {
  return getCircleButton(
      'icon/light_blue_plus.png', VISUAL_EDITOR_ICON_HEIGHT, 'addMetaDataLine',
      'add optional metadata');
}

/**
 * Add a button to remove an optional metadata line.
 *
 * @returns Requested HTML code.
 */
function removeMetaDataButton() {
  return getCircleButton(
      'icon/orange_cross.png', VISUAL_EDITOR_ICON_HEIGHT, 'removeMetaDataLine', 'remove this line');
}

/**
 * Capitalize the first letter of a string.
 *
 * @param {String} s  String to capitalize.
 *
 * @returns Capitalized string.
 */
function capitalizeFirstLetter(s) {
  const len = s.length;
  if (len === 0) {
    return '';
  } else if (len === 1) {
    return s.toUpperCase();
  } else {
    return String(s[0]).toUpperCase() + String(s).slice(1);
  }
}

/**
 * Update the content of a cell so that it can only display a positive number.
 *
 * @param {cell} cell  Cell content to update.
 */
function onlyKeepPositiveInteger(cell) {
  const cleanedValue = cell.innerText.replace(/[^0-9]/g, '');
  if (cleanedValue !== cell.innerText) {
    cell.innerText = cleanedValue;
  }
  updateRawBOFromVisualEditor();
}

/**
 * Update the raw build order from visual editor content.
 */
function updateRawBOFromVisualEditor() {
  // Check if BO Name is available (if not, then visual editor is not ready)
  const boNameElem = document.getElementById('visual_edit_bo_name');
  if (!boNameElem) {
    return;
  }

  // Check that all select factions widgets are initialized
  const selects = document.querySelectorAll('.visual_edit_factions_select');
  for (let select of selects) {
    if (select.options.length === 0) {
      return;
    }
  }

  // update the Raw BO in 'result'
  let result = {'name': boNameElem.innerText};

  // Selected faction (and optional opponent faction)
  let selectFactionElement = document.getElementById('visual_edit_faction_select');
  if (!selectFactionElement) {
    return;
  }
  result[FACTION_FIELD_NAMES[gameName]['player']] =
      selectFactionElement.options[selectFactionElement.selectedIndex].text;

  if (FACTION_FIELD_NAMES[gameName]['opponent']) {
    let selectOpponentFactionElement =
        document.getElementById('visual_edit_opponent_faction_select');
    if (!selectOpponentFactionElement) {
      return;
    }
    result[FACTION_FIELD_NAMES[gameName]['opponent']] =
        selectOpponentFactionElement.options[selectOpponentFactionElement.selectedIndex].text;
  }

  // Optional BO metadata fields
  const cells = document.querySelectorAll('td.visual_edit_optional_name');

  // Loop through each <td>
  cells.forEach((cell) => {
    const nameText = cell.innerText;

    // Get the next sibling <td>
    const nextCell = cell.nextElementSibling;

    // Validate if the next <td> has the class "visual_edit_optional_value"
    if (nextCell && nextCell.classList.contains('visual_edit_optional_value')) {
      result[nameText] = nextCell.innerText;
    }
  });

  // Build order steps
  result['build_order'] = [];
  let boResult = result['build_order'];

  // Loop on all the rows with field edit (one row per BO step)
  document.querySelectorAll('tr.visual_edit_bo_field_row').forEach(trField => {
    let stepData = {};  // Store the data from this BO step

    // Loop on all the columns with field values for this BO step
    trField.querySelectorAll('td').forEach(td => {
      if (td.classList.contains('visual_edit_bo_select') ||
          td.classList.contains('visual_edit_bo_field')) {
        // Get field name, value (as string), and booleans decribing if it is optional and integer
        let name = '';
        let strValue = '';
        let isOptional = false;
        let isInteger = false;
        if (td.classList.contains('visual_edit_bo_select')) {
          const selectElement = td.querySelector('select');
          name = selectElement.getAttribute('column_field_name');
          strValue = selectElement.value;
          isOptional = selectElement.getAttribute('column_is_optional') == 'true';
          isInteger = selectElement.getAttribute('column_is_integer') == 'true';
        } else {
          name = td.getAttribute('column_field_name');
          strValue = td.innerText;
          isOptional = td.getAttribute('column_is_optional') == 'true';
          isInteger = td.getAttribute('column_is_integer') == 'true';
        }

        // Check if a valid string value can be read
        const isValidStrValue = strValue && (strValue !== '');

        // Only add if not optional or string value is valid
        if (!isOptional || isValidStrValue) {
          let value = strValue;
          if (isInteger) {
            value = isValidStrValue ? parseInt(strValue) : -1;
          }

          // Split in levels based on '/'
          const keys = name.split('/');
          let temp = stepData;
          keys.forEach((key, index) => {
            if (index === keys.length - 1) {  // Last level
              temp[key] = value;
            } else {  // Not last level
              if (!temp.hasOwnProperty(key)) {
                temp[key] = {};
              }
              temp = temp[key];  // Go one level below
            }
          });
        }
      }
    });

    // Loop on the notes
    stepData['notes'] = [];
    let boStepNotes = stepData['notes'];

    // Each note is a <tr> with "visual_edit_bo_note_row" class
    let nextRow = trField.nextElementSibling;
    while (nextRow && nextRow.matches('tr.visual_edit_bo_note_row')) {
      let noteString = nextRow.querySelector('td.visual_edit_note').innerHTML;

      // Remove error image
      noteString = noteString.replace(
          /onerror=["']?this\.onerror=null;\s*this\.src=['"]assets\/common\/icon\/question_mark\.png['"]["']?/g,
          '');

      // Replace all the <img> by their img.src value and add '@' in front and behind each img.src.
      noteString = noteString.replace(/<img[^>]+src=["']?([^"'>\s]+)["']?[^>]*>/g, '@$1@');

      // Remove 'assets/common' and 'assets/gameName' from image path
      // (+ remove characters before, up to previous '@')
      noteString = noteString.replace(/(@)[^@]*?assets\/common\//g, '$1');

      const regex = new RegExp(`(@)[^@]*?assets/${gameName}/`, 'g');
      noteString = noteString.replace(regex, '$1');

      // Replace '&amp;' by '&' and '&nbsp;' by ' '
      noteString = noteString.replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ');

      // Add current note line
      boStepNotes.push(noteString);

      // Find next note row
      nextRow = nextRow.nextElementSibling;

      // Stop if the next row is another 'visual_edit_bo_field_row'
      if (nextRow && nextRow.matches('tr.visual_edit_bo_field_row')) {
        break;
      }
    }

    // Add current step to the BO
    boResult.push(stepData);
  });

  // Update raw BO text and BO panel
  document.getElementById('bo_design_raw').value = JSON.stringify(result, null, 4);
  updateDataBO();
  updateBOPanel(false);
}

/**
 * Extract the positions of each '@' character and its following string
 * (string finishing at the next space character).
 *
 * @param {string} cellID     ID of the array cell to analyse.
 * @param {string} str        String to evaluate.
 * @param {int} minStrLength  Minimal length for the string.
 *
 * @returns Array of {id_at: @ ID, followingStr: string following @}.
 */
function extractAtStrings(cellID, str, minStrLength) {
  let results = [];
  // Matching '@' followed by non-space characters (including non-breaking space)
  const regex = /@([^\s\u00A0]+)/g;

  let match;
  while ((match = regex.exec(str)) !== null) {
    if (match[1].length >= minStrLength) {
      // Get characters following '@' (with safety for non-breaking space)
      let followingStr = match[1];
      const index = followingStr.indexOf('&nbsp;');
      if (index !== -1) {
        followingStr = followingStr.slice(0, index);
      }

      results.push({
        cell_id: cellID,            // cell ID
        id_at: match.index,         // '@' index
        followingStr: followingStr  // characters after '@' until any space
      });
    }
  }

  return results;
}

/**
 * Find the first element of new results to be different from old results.
 *
 * @param {Array} oldAtStrings  Old results obtained with 'extractAtStrings'.
 * @param {Array} newAtStrings  New results obtained with 'extractAtStrings'.
 *
 * @returns First element ({id_at: @ ID, followingStr: string following @})
 *          different in the new results, null if not found.
 */
function findFirstAtDifference(oldAtStrings, newAtStrings) {
  // Not valid if the new output contains less results
  if (oldAtStrings.length > newAtStrings.length) {
    return null;
  }

  // Loop on the elements in common
  for (let i = 0; i < oldAtStrings.length; i++) {
    const oldResult = oldAtStrings[i];
    const newResult = newAtStrings[i];

    // Return first element with differnt following string
    if (oldResult.followingStr !== newResult.followingStr) {
      return newResult;
    }
  }
  // If no difference found, but different number of results, then it is the
  // last element of the new results.
  if (newAtStrings.length > oldAtStrings.length) {
    return newAtStrings.at(-1);
  }

  return null;  // no difference found
}

/**
 * Set the caret after a chosen image (for innerHTML content update).
 *
 * @param {Object} cell     Cell to update.
 * @param {string} imageID  ID of the image after which the caret must be located.
 */
function setCaretAfterSelectedImage(cell, imageID) {
  const childNodes = cell.childNodes;  // Get all the child nodes of the cell

  let imgCounter = 0;  // Counter to track <img> elements
  for (let i = 0; i < childNodes.length; i++) {
    const node = childNodes[i];

    // Check if the current node is an <img> element
    if (node.nodeName === 'IMG') {
      imgCounter++;

      // Check if this is the selected <img> element
      if (imgCounter === imageID) {
        const range = document.createRange();

        // Set the range after the <img> node
        range.setStartAfter(node);
        range.collapse(true);  // Collapse to make it a caret

        const selection = window.getSelection();
        selection.removeAllRanges();  // Clear existing selections
        selection.addRange(range);    // Add the new range

        return;
      }
    }
  }

  console.log('Could not find the <img> number ' + imageID + ' element in the cell.');
}

/**
 * Apply visual grid image selection choice.
 *
 * @param {string} imagePath  Relative path to selected image.
 */
function applyVisualImageGrid(imagePath) {
  // Update requested cell 'innerHTML'
  const cell = document.getElementById(visualGridAtString.cell_id);
  const id_at = visualGridAtString.id_at;
  const initSubString = cell.innerHTML.substring(0, id_at);
  const endSubString = cell.innerHTML.substring(id_at + 1 + visualGridAtString.followingStr.length);
  const imageHTML = getImageHTML(imagePath, EDITOR_IMAGE_HEIGHT);
  cell.innerHTML = initSubString + imageHTML + endSubString;

  // Count the number of images before the new inserted image
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = initSubString;
  const initImgCount = tempDiv.querySelectorAll('img').length;

  // Set caret after newly created image
  setCaretAfterSelectedImage(cell, initImgCount + 1);

  // Remove visual grid
  removeVisualImagesGrid();

  // Update Raw BO
  updateRawBOFromVisualEditor();
}

/**
 * Remove the grid with images for visual image selection.
 */
function removeVisualImagesGrid() {
  // Reset corresponding variables
  visualGridColumnCount = 0;
  visualGridActiveIndex = -1;
  visualGridMatchingNames = [];
  visualGridImages = [];
  visualGridAtString = null;

  const grid = document.getElementById('image_selector_grid');
  if (!grid) {  // not existing
    return;
  }

  // Remove child images
  const images = grid.getElementsByClassName('visual_grid_image');

  Array.from(images).forEach((img) => {
    img.onclick = null;
    grid.removeChild(img);
  });

  grid.remove();  // remove grid from DOM
}

/**
 * Prevent the effect on some keys for a note cell.
 *
 * @param {Object} event  Event detected.
 */
function preventNoteCellKeys(event) {
  if (event.key === 'Enter') {
    event.preventDefault();  // Enter should never work
  }
  // Deactivate arrows when using visual grid selector
  else if (visualGridImages.length > 0) {
    const keysToDeactivate = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
    if (keysToDeactivate.includes(event.key)) {
      event.preventDefault();
    }
  }
}

/**
 * Detect the strings following the '@' character, and suggest images accordingly.
 *
 * @param {string} cellID  ID of the array cell to analyse.
 */
function detectAtSuggestImages(cellID) {
  // Remove image selector if already existing
  removeVisualImagesGrid();

  // Get requested cell
  const cell = document.getElementById(cellID);

  // Get new inner text string and old one (from previous call).
  const newStr = cell.innerHTML;
  if (!cell.dataset.lastStr) {
    cell.dataset.lastStr = newStr;
    return;
  }
  const oldStr = cell.dataset.lastStr;
  cell.dataset.lastStr = newStr;  // save for next call

  // Extract '@' positions with corresponding strings
  oldAtStrings = extractAtStrings(cellID, oldStr, MIN_LENGTH_AT_SEARCH);
  newAtStrings = extractAtStrings(cellID, newStr, MIN_LENGTH_AT_SEARCH);

  // Get new '@' with corresponding string (or null if not valid)
  visualGridAtString = findFirstAtDifference(oldAtStrings, newAtStrings);

  // Valid new string found after '@' character
  if (visualGridAtString) {
    // Sub-string to search
    const searchSubString = visualGridAtString.followingStr.toLowerCase();

    // Gather all images matching the requested sub-string
    console.assert(
        visualGridMatchingNames.length == 0, '\'visualGridMatchingNames\' should be empty.');

    for (let i = 0; i < 2; i++) {  // game, then common folder
      for (const [subFolder, images] of Object.entries(i == 0 ? imagesGame : imagesCommon)) {
        for (let image of images) {
          const imageLowerCase = image.toLowerCase();
          if (imageLowerCase.includes(searchSubString)) {
            visualGridMatchingNames.push({
              'id': imageLowerCase.indexOf(searchSubString),
              'image': 'assets/' + (i == 0 ? gameName : 'common') + '/' + subFolder + '/' + image
            });
          }
        }
      }
    }

    if (visualGridMatchingNames.length >= 1) {
      // Sort according to first occurance of sub-string
      visualGridMatchingNames.sort((a, b) => a.id - b.id);

      // Only keep the MAX_NUMBER_SUGGESTION_IMAGES first elements
      visualGridMatchingNames = visualGridMatchingNames.slice(0, MAX_NUMBER_SUGGESTION_IMAGES);

      // Get caret position to draw image selector
      const selection = window.getSelection();
      if (selection.rangeCount) {
        const range = selection.getRangeAt(0);
        // Get caret position as a rectangle
        const rect = range.getBoundingClientRect();

        // Number of grid columns, depending on the number of elements to show
        if (visualGridMatchingNames.length <= 1) {
          visualGridColumnCount = 1;
        } else if (visualGridMatchingNames.length <= 4) {
          visualGridColumnCount = 2;
        } else if (visualGridMatchingNames.length <= 9) {
          visualGridColumnCount = 3;
        } else {
          visualGridColumnCount = 4;
        }

        // Create a grid to contain images
        const grid = document.createElement('div');
        grid.id = 'image_selector_grid';
        grid.style.position = 'absolute';
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = `repeat(${visualGridColumnCount}, auto)`;
        grid.style.gap = VISUAL_GRID_IMAGE_GAP + 'px';
        grid.style.padding = VISUAL_GRID_PADDING + 'px';

        // Create the images
        console.assert(visualGridImages.length == 0, '\'visualGridImages\' should be empty');

        for (let i = 0; i < visualGridMatchingNames.length; i++) {
          const img = document.createElement('img');
          img.classList.add('visual_grid_image');
          img.dataset.relativePath = visualGridMatchingNames[i].image;
          img.src = img.dataset.relativePath;
          img.height = EDITOR_IMAGE_HEIGHT;
          grid.appendChild(img);
          visualGridImages.push(img);

          // Select image with click
          img.onclick = function() {
            applyVisualImageGrid(img.dataset.relativePath);
          };
        }

        // Image outline color
        visualGridActiveIndex = 0;
        visualGridImages[visualGridActiveIndex].style.outline =
            VISUAL_GRID_IMAGE_GAP + 'px solid ' + VISUAL_GRID_OUTLINE_COLOR;

        // Add the rectangle to the document
        document.body.appendChild(grid);

        // Position the rectangle with upper right corner below caret
        grid.style.left = `${rect.right - grid.offsetWidth}px`;
        grid.style.top = `${rect.bottom + VISUAL_GRID_VERTICAL_SPACE}px`;
      }
    }
  }
}

/**
 * Get HTML code for the visual editor sample based on table descriptions.
 *
 * @param {Array} columnsDescription  Array of 'SinglePanelColumn' describing
 *                                    each column (except buttons and notes).
 *
 * @returns HTML code
 */
function getVisualEditorFromDescription(columnsDescription) {
  // Visual header
  let htmlResult = '<table id="bo_design_visual_header" class="bo_design_visual_table"';
  htmlResult += ' ondrop="BODesignDropHandler(event)">';

  // BO Name
  htmlResult += '<tr id="visual_editor_bo_name_line"><td class="non_editable_field">BO Name</td>';
  htmlResult += '<td id="visual_edit_bo_name"';
  htmlResult += ' contenteditable="true"';
  htmlResult += ' oninput="updateRawBOFromVisualEditor()">' + dataBO.name + '</td></tr>';

  // Player faction selection
  htmlResult +=
      '<tr id="visual_editor_faction_line" class="visual_editor_button_line"><td class="non_editable_field">' +
      capitalizeFirstLetter(FACTION_FIELD_NAMES[gameName]['player']).replace(/_/g, ' ') + '</td>';
  htmlResult += '<td><div class="bo_design_select_with_image">';
  htmlResult += '<select id="visual_edit_faction_select"';
  htmlResult += ' class="visual_edit_factions_select"';
  htmlResult += ' onchange="updateImageFromSelect(this, \'bo_design_faction_image\', ' +
      EDITOR_IMAGE_HEIGHT + ')"></select>';
  htmlResult += '<div id="bo_design_faction_image"></div></div></td>';
  if (!FACTION_FIELD_NAMES[gameName]['opponent']) {
    htmlResult += '<td class="bo_visu_design_buttons_left">';
    htmlResult += addMetaDataButton() + '</td>';
  }
  htmlResult += '</tr>';

  // Opponent faction selection
  if (FACTION_FIELD_NAMES[gameName]['opponent']) {
    htmlResult +=
        '<tr id="visual_editor_opponent_faction_line" class="visual_editor_button_line"><td class="non_editable_field">' +
        capitalizeFirstLetter(FACTION_FIELD_NAMES[gameName]['opponent']).replace(/_/g, ' ') +
        '</td>';
    htmlResult += '<td><div class="bo_design_select_with_image">';
    htmlResult += '<select id="visual_edit_opponent_faction_select"';
    htmlResult += ' class="visual_edit_factions_select"';
    htmlResult += ' onchange="updateImageFromSelect(this, \'bo_design_opponent_faction_image\', ' +
        EDITOR_IMAGE_HEIGHT + ')"></select>';
    htmlResult += '<div id="bo_design_opponent_faction_image"></div></div></td>';
    htmlResult += '<td class="bo_visu_design_buttons_left">';
    htmlResult += addMetaDataButton() + '</td></tr>';
  }

  // Add remaining attributes
  for (let attribute in dataBO) {
    if (dataBO.hasOwnProperty(attribute) &&
        !['name', 'build_order', FACTION_FIELD_NAMES[gameName]['player'],
          FACTION_FIELD_NAMES[gameName]['opponent']]
             .includes(attribute)) {
      htmlResult +=
          '<tr class="visual_editor_button_line"><td contenteditable="true" class="visual_edit_optional_name"';
      htmlResult += ' oninput="updateRawBOFromVisualEditor()">';
      htmlResult += attribute + '</td>';
      htmlResult += '<td contenteditable="true" class="visual_edit_optional_value"';
      htmlResult += ' oninput="updateRawBOFromVisualEditor()">';
      htmlResult += dataBO[attribute] + '</td>';
      htmlResult += '<td class="bo_visu_design_buttons_left">';
      htmlResult += addMetaDataButton();
      htmlResult += removeMetaDataButton();
      htmlResult += '</td></tr>';
    }
  }
  htmlResult += '</table>';

  // Resources header
  htmlResult += '<table id="bo_design_visual_content" class="bo_design_visual_table">';
  htmlResult += '<tr id="bo_design_resources_header"><td></td>';

  for (const column of columnsDescription) {
    const textImage = column.image ?
        getImageHTML(column.image, EDITOR_IMAGE_HEIGHT, null, null, column.tooltip) :
        column.text;
    htmlResult += '<td>' + textImage + '</td>';
  }
  htmlResult += '<td></td></tr>';

  // Loop on all the BO steps
  const buildOrderData = dataBO['build_order'];
  for (const [stepID, currentStep] of buildOrderData.entries()) {  // loop on all BO steps

    // Buttons on the left for resource values
    htmlResult += '<tr class="border_top visual_edit_bo_field_row visual_editor_button_line"';
    htmlResult += ' id="visual_edit_bo_field_row_' + stepID + '">';
    htmlResult += '<td class="bo_visu_design_buttons_right">';
    if (stepCount >= 2) {
      if (stepID >= 1) {
        htmlResult += getCircleButton(
            'icon/top_arrow.png', VISUAL_EDITOR_ICON_HEIGHT, 'moveStepLinesUp', 'move step up',
            false);
      }
      if (stepID <= stepCount - 2) {
        htmlResult += getCircleButton(
            'icon/down_arrow.png', VISUAL_EDITOR_ICON_HEIGHT, 'moveStepLinesDown', 'move step down',
            false);
      }
    }
    htmlResult += getCircleButton(
        'icon/light_blue_plus.png', VISUAL_EDITOR_ICON_HEIGHT, 'addStepLinesBelow',
        'add step below', false);
    if (stepCount >= 2) {
      htmlResult += getCircleButton(
          'icon/orange_cross.png', VISUAL_EDITOR_ICON_HEIGHT, 'removeStepLines', 'remove this step',
          false);
    }
    htmlResult += '</td>';

    for (const column of columnsDescription) {
      // Check field presence (potentially after splitting part_0/part_1/...)
      let fieldValue = currentStep;

      for (const subField of column.field.split('/')) {
        if (!(subField in fieldValue)) {
          fieldValue = '';
          break;
        }
        fieldValue = fieldValue[subField];
      }

      // Selection widget
      if (column.isSelectwidget) {
        if (visualEditortableWidgetDescription) {
          htmlResult +=
              '<td class="visual_edit_bo_select"><div class="bo_design_select_with_image">';
          htmlResult += '<select id="visual_edit_bo_select_widget_' + stepID + '"';
          htmlResult += ' class="visual_edit_bo_select_widget"';
          htmlResult += ' column_field_name="' + column.field + '"';
          htmlResult += ' column_is_optional="' + column.optional + '"';
          htmlResult += ' column_is_integer="' + column.isIntegerInRawBO + '"';
          htmlResult += ' onchange="updateImageFromSelect(this, \'bo_design_select_image_' +
              stepID + '\', ' + EDITOR_IMAGE_HEIGHT + ')" ';
          htmlResult += ' defaultValue=' + fieldValue + '></select>'
          htmlResult += '<div id="bo_design_select_image_' + stepID + '"></div></div></td>';
        } else {
          throw '\'visualEditortableWidgetDescription\' should not be null.'
        }
      }
      // Normal field
      else {
        htmlResult += '<td contenteditable="true"';
        htmlResult += ' class="visual_edit_bo_field"';
        htmlResult += ' column_field_name="' + column.field + '"';
        htmlResult += ' column_is_optional="' + column.optional + '"';
        htmlResult += ' column_is_integer="' + column.isIntegerInRawBO + '"';
        if (column.showOnlyPositive) {
          htmlResult += ' oninput="onlyKeepPositiveInteger(this)"';
        } else {
          htmlResult += ' oninput="updateRawBOFromVisualEditor()"';
        }
        htmlResult += ' style="';
        // Black border
        htmlResult += 'border-left: 1px solid black;';
        htmlResult += 'border-right: 1px solid black;';
        htmlResult += 'border-bottom: 1px solid black;';
        if (column.italic) {
          htmlResult += 'font-style: italic;'
        }
        if (column.bold) {
          htmlResult += 'font-weight: bold;'
        }
        if (column.backgroundColor) {
          color = column.backgroundColor;
          console.assert(color.length == 3, 'Background color length should be of size 3.');
          htmlResult += 'background-color: rgb(' + color[0].toString() + ', ' +
              color[1].toString() + ', ' + color[2].toString() + ');';
        }
        if (column.showOnlyPositive && parseInt(fieldValue) < 0) {
          fieldValue = '';
        }
        htmlResult += '">' + fieldValue + '</td>';
      }
    }
    htmlResult += '</tr>';

    // Loop on the notes
    const noteCount = currentStep['notes'].length;
    for (const [noteID, note] of currentStep['notes'].entries()) {
      // Buttons on the left for notes
      const noteLineStringID = 'visual_edit_note_line_' + stepID + '_' + noteID;
      htmlResult += '<tr class="visual_edit_bo_note_row visual_editor_button_line"';
      htmlResult += ' id="' + noteLineStringID + '">';
      htmlResult += '<td class="bo_visu_design_buttons_right">';
      htmlResult += getCircleButton(
          'icon/grey_return.png', VISUAL_EDITOR_ICON_HEIGHT, 'addNoteLineBelow',
          'add note on a new line', false);
      if (noteCount >= 2) {
        htmlResult += getCircleButton(
            'icon/orange_cross.png', VISUAL_EDITOR_ICON_HEIGHT, 'removeNoteLine',
            'remove this note line', false);
      }
      htmlResult += '</td>';

      // Note
      const noteStringID = 'visual_edit_note_' + stepID + '_' + noteID;
      htmlResult += '<td colspan="' + (columnsDescription.length + 1).toString();
      htmlResult += '" contenteditable="true"';
      htmlResult += ' class="visual_edit_note"';
      htmlResult += ' id="' + noteStringID + '"';
      htmlResult += ' ondrop="updateRawBOFromVisualEditor()"';
      htmlResult += ' onkeydown="preventNoteCellKeys(event)"';
      htmlResult += ' oninput="detectAtSuggestImages(\'' + noteStringID +
          '\'); updateRawBOFromVisualEditor();"';
      htmlResult += ' style="text-align: left; padding-right: 15px;">';
      htmlResult += noteToTextImages(note, EDITOR_IMAGE_HEIGHT) + '</td>';

      htmlResult += '</tr>';
    }
  }

  htmlResult += '</table>';

  return htmlResult;
}

/**
 * Open a new page displaying the full BO in a single panel,
 * based on table descriptions.
 *
 * @param {Array} columnsDescription  Array of 'SinglePanelColumn' describing
 *                                    each column (except the notes).
 * @param {Object} sectionsHeader     Disctionary describing the sections headers, containing 'key',
 *                                    'before' and 'after', null if no section.
 */
function openSinglePanelPageFromDescription(columnsDescription, sectionsHeader = null) {
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
                'Warning: Exepcted integer for \'' + field + '\', but received \'' + num + '\'.');
          }
        } else {
          displayColumns[index] = true;
        }
      }
    }
  }

  // Update the columns description to only keep the ones to display
  let updatedColumnsDescription = [];

  let validColumnsCount = 0;
  for (const [index, column] of columnsDescription.entries()) {
    if (displayColumns[index]) {
      updatedColumnsDescription.push(column);
      validColumnsCount++;
    }
  }

  // Create window
  let fullPageWindow = window.open('', '_blank');

  // Prepare HTML main content
  let htmlContent = '<!DOCTYPE html>\n<html lang="en">\n\n';
  htmlContent += '<head>\n';

  // Title
  htmlContent += indentSpace(1) + '<title>RTS Overlay - ' + dataBO['name'] + '</title>\n';

  // Style
  htmlContent += indentSpace(1) + '<style>\n';

  htmlContent += indentSpace(2) + 'body {\n';
  htmlContent += indentSpace(3) + 'font-family: Arial, Helvetica, sans-serif;\n';
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
    if (column.italic || column.bold || column.backgroundColor || column.textAlign) {
      htmlContent += indentSpace(2) + '.column-' + index.toString() + ' {\n';

      if (column.italic) {
        htmlContent += indentSpace(3) + 'font-style: italic;\n';
      }
      if (column.bold) {
        htmlContent += indentSpace(3) + 'font-weight: bold;\n';
      }
      if (column.backgroundColor) {
        color = column.backgroundColor;
        console.assert(color.length == 3, 'Background color length should be of size 3.');
        htmlContent += indentSpace(3) + 'background-color: rgb(' + color[0].toString() + ', ' +
            color[1].toString() + ', ' + color[2].toString() + ');\n';
      }
      if (column.textAlign) {
        htmlContent += indentSpace(3) + 'text-align: ' + column.textAlign + ';\n';
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
      htmlContent += indentSpace(3) + '<td>' + getBOImageHTML(column.image) + '</td>\n';
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
      if (sectionsHeader.first_line && (currentSectionHeaderKey in sectionsHeader.first_line) &&
          !lastSectionHeaderKey) {
        htmlContent += indentSpace(2) + '<tr class="border_top">\n';
        htmlContent += indentSpace(3) +
            '<td class="full_line" colspan=' + validColumnsCount.toString() + '>' +
            sectionsHeader.first_line[currentSectionHeaderKey] + '</td>\n';
        htmlContent += indentSpace(2) + '</tr>\n';
      }

      // Header section before current line
      if (sectionsHeader.before && (currentSectionHeaderKey in sectionsHeader.before) &&
          lastSectionHeaderKey && (currentSectionHeaderKey !== lastSectionHeaderKey)) {
        htmlContent += indentSpace(2) + '<tr class="border_top">\n';
        htmlContent += indentSpace(3) +
            '<td class="full_line" colspan=' + validColumnsCount.toString() + '>' +
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
                  'Warning: Exepcted integer for \'' + field + '\', but received \'' + fieldValue +
                  '\'.');
            }
          }

          // Display field value
          htmlContent += indentSpace(3) + '<td class="column-' + index.toString() + '">' +
              fieldValue + '</td>\n';
        }
      }
      // Only add notes for the next lines (i.e. no column content).
      else {
        htmlContent += indentSpace(2) + '<tr>\n';
        for (let index = 0; index < updatedColumnsDescription.length; index++) {
          htmlContent += indentSpace(3) + '<td class="column-' + index.toString() + '"></td>\n';
        }
      }

      // Add the current note line
      htmlContent += indentSpace(3) + '<td class="note">\n' + indentSpace(4) + '<div>' +
          noteToTextImages(note) + '</div>\n' + indentSpace(3) + '</td>\n';
      htmlContent += indentSpace(2) + '</tr>\n';
    }

    if (sectionsHeader) {
      // Header section after current line
      if (sectionsHeader.after && (currentSectionHeaderKey in sectionsHeader.after) &&
          lastSectionHeaderKey && (currentSectionHeaderKey !== lastSectionHeaderKey)) {
        htmlContent += indentSpace(2) + '<tr class="border_top">\n';
        htmlContent += indentSpace(3) +
            '<td class="full_line" colspan=' + validColumnsCount.toString() + '>' +
            sectionsHeader.after[currentSectionHeaderKey] + '</td>\n';
        htmlContent += indentSpace(2) + '</tr>\n';
      }

      // Save last key value seen
      lastSectionHeaderKey = currentSectionHeaderKey;
    }
  }

  htmlContent += indentSpace(1) + '</table>\n';

  // Copy HTML for export
  const htmlContentCopy = JSON.parse(JSON.stringify(htmlContent)) + '</body>\n\n</html>';

  // Name for file export
  const exportName =
      (Object.keys(dataBO).includes('name')) ? dataBO.name.replaceAll(/\s+/g, '_') : 'rts_overlay';

  // Buttons to export HTML and build order
  htmlContent += '\n<button id="export_html">Export HTML</button>\n';
  htmlContent += '\n<button id="export_bo">Export build order</button>\n';

  htmlContent += indentSpace(1) + '<script>\n';

  htmlContent += indentSpace(2) + 'const dataHTML = ' + JSON.stringify(htmlContentCopy) + ';\n\n';
  htmlContent += indentSpace(2) + 'const dataBO = ' + JSON.stringify(dataBO) + ';\n\n';

  // Export HTML
  htmlContent += indentSpace(2) +
      'document.getElementById(\'export_html\').addEventListener(\'click\', function() {\n';
  htmlContent +=
      indentSpace(3) + 'const fileHTML = new Blob([dataHTML], {type: \'text/plain\'});\n';
  htmlContent += indentSpace(3) + 'const link = document.createElement(\'a\');\n';
  htmlContent += indentSpace(3) + 'link.href = URL.createObjectURL(fileHTML);\n';
  htmlContent += indentSpace(3) + 'link.download = \'' + exportName + '.html\';\n';
  htmlContent += indentSpace(3) + 'link.click();\n';
  htmlContent += indentSpace(3) + 'URL.revokeObjectURL(link.href);\n';
  htmlContent += indentSpace(2) + '});\n\n';

  // Export BO
  htmlContent += indentSpace(2) +
      'document.getElementById(\'export_bo\').addEventListener(\'click\', function() {\n';
  htmlContent += indentSpace(3) +
      'const fileBO = new Blob([JSON.stringify(dataBO, null, 4)], {type: \'text/plain\'});\n';
  htmlContent += indentSpace(3) + 'const link = document.createElement(\'a\');\n';
  htmlContent += indentSpace(3) + 'link.href = URL.createObjectURL(fileBO);\n';
  htmlContent += indentSpace(3) + 'link.download = \'' + exportName + '.json\';\n';
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
  const bodyContent = '<div id="bo_panel">' + getBOPanelContent(true, validBO ? 0 : -1) + '</div>';

  // HTML content
  let htmlContent = '<!DOCTYPE html><html lang="en">';

  htmlContent += '\n<script>';

  htmlContent += '\nconst actionButtonHeight = ' + actionButtonHeight + ';';
  htmlContent += '\nconst overlayOnRightSide = ' + overlayOnRightSide + ';';
  htmlContent += '\nconst SLEEP_TIME = ' + SLEEP_TIME + ';';
  htmlContent += '\nconst INTERVAL_CALL_TIME = ' + INTERVAL_CALL_TIME + ';';
  htmlContent += '\nconst SIZE_UPDATE_THRESHOLD = ' + SIZE_UPDATE_THRESHOLD + ';';
  htmlContent +=
      '\nconst OVERLAY_KEYBOARD_SHORTCUTS = ' + JSON.stringify(OVERLAY_KEYBOARD_SHORTCUTS) + ';';
  htmlContent += '\nconst ERROR_IMAGE = "' + ERROR_IMAGE + '";';

  htmlContent += '\nconst gameName = \'' + gameName + '\';';
  htmlContent += '\nconst dataBO = ' + (validBO ? JSON.stringify(dataBO) : 'null') + ';';
  htmlContent += '\nconst stepCount = ' + (validBO ? stepCount : -1) + ';';
  htmlContent += '\nlet stepID = ' + (validBO ? 0 : -1) + ';';
  htmlContent += '\nconst imagesGame = ' + JSON.stringify(imagesGame) + ';';
  htmlContent += '\nconst imagesCommon = ' + JSON.stringify(imagesCommon) + ';';
  htmlContent += '\nconst imageHeightBO = ' + imageHeightBO + ';';

  const fontsizeSlider = document.getElementById('bo_fontsize');
  htmlContent += '\nconst boPanelFontSize = \'' + fontsizeSlider.value.toString(1) + 'em\';';

  // Adapt timer variables for overlay
  let timerOverlay = Object.assign({}, buildOrderTimer);  // copy the object
  timerOverlay['step_starting_flag'] = TIMER_STEP_STARTING_FLAG.includes(gameName);
  timerOverlay['absolute_time_init'] = getCurrentTime();
  timerOverlay['steps_ids'] = [0];
  if (gameName in TIMER_SPEED_FACTOR) {
    timerOverlay['timer_speed_factor'] = TIMER_SPEED_FACTOR[gameName];
  }
  htmlContent += '\nlet buildOrderTimer = ' + JSON.stringify(timerOverlay) + ';';

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
  htmlContent += '\n' + getResourceLineString(gameName);

  htmlContent += '\n</script>';

  htmlContent += '\n<head><link rel="stylesheet" href="layout.css">' + headContent + '</head>';
  htmlContent += '\n<body id=\"body_overlay\">' + bodyContent + '</body></html>';

  if (localStorage.getItem('hideAlwaysOnTopNote') !== 'true') {
    const userChoice = confirm(
        'To keep the overlay on top of your game while playing, use an Always On Top application.\n' +
        'For Windows, PowerToys is a good solution.\n' +
        'It is free, developed by Microsoft and available on the Microsoft Store.' +
        '\n\nHide this message next time?');
    if (userChoice) {
      localStorage.setItem('hideAlwaysOnTopNote', 'true');
    }
  }

  // Update overlay HTML content
  overlayWindow.document.write(htmlContent);
}

/**
 * Convert an array with content (i.e. string lines) to <div> for HTML.
 *
 * @param {Array} content    Content as array of string lines, '' for a vertical space.
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
 * @param {Array} externalBOLines  Lines for external BO websites, null if no external BO website.
 *
 * @returns Requested instructions.
 */
function getArrayInstructions(externalBOLines = null) {
  let result = [
    'Update the panel below with the requested build order, then click on \'Open full page\' or \'Display overlay\'',
    '(appearing on the left side of the screen when the build order is valid). You will need an <i>Always On Top</i> application',
    'to keep the overlay visible while playing. Hover briefly on the \'Display overlay\' button to get more information.',
    '', 'Filter and select (or delete) your stored build orders in the <b>From library</b> section.'
  ];

  if (externalBOLines) {
    result = result.concat(['']);
    result = result.concat(externalBOLines);
  }

  const buttonsLines = [
    '',
    (externalBOLines ? 'You can also write' : 'Write') +
        ' your own build order in the <b>Design your own</b> section.',
    'Some helper buttons will appear in this section (on the left side). On the top right side, select between:',
    '&nbsp &nbsp - <i>Visual editor</i> (recommended): use the widgets to describe each step of the build order.',
    '&nbsp &nbsp - <i>Raw editor</i> (advanced use): write the build order in JSON format.'
  ];
  result = result.concat(buttonsLines);

  const imagesSelectionLines = [
    '',
    'In the \'Image selection\' section on the bottom right (select first <b>Design your own</b>), you can get images',
    'by selecting a category and clicking on the requested image (<i>Raw editor</i>) or by dragging and dropping (<i>Visual editor</i>).',
    'For <i>Visual editor</i>, you can also write <b>@</b>, followed be the image name to search, then use the arrow keys and Enter.'
  ];
  result = result.concat(imagesSelectionLines);

  const validityFontSizeSavePart = [
    '',
    'The build order validity is constantly checked. If it is not valid, a message appears on top of the text panel to explain',
    'what the issue is. An hourglass icon also appears on the top to check if the timer feature is compatible with the build order.',
    '',
    'To save your build order, click on \'Add to library\' (on the left when valid build order). This will save the build order',
    'in your local storage, allowing you to load it from the <b>From library</b> section (persisting after re-opening the app).',
    'You can also click on \'Export file\' to save it as a JSON file or  \'Copy to clipboard\', to copy the build order content.',
    'To re-load a build order, drag and drop a file with the build order on the bottom text panel (or replace the text manually).',
    '',
    'You can download a local copy of RTS Overlay to improve its speed, work offline and customize your experience.',
    'Hover briefly on \'Local version\' for more information.', '',
    'Finally, you can also download RTS Overlay as an EXE app, to get an improved experience.',
    'Hover briefly on \'Download exe app\' for more information.'
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
