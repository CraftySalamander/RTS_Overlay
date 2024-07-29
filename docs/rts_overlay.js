// -- Define parameters -- //

const SELECT_IMAGE_HEIGHT = 35;  // Height of BO (Build Order) design images.
const TITLE_IMAGE_HEIGHT = 70;   // Height of the 'RTS Overlay' title.
const INFO_IMAGE_HEIGHT = 30;  // Height of the RTS Overlay information button.
const SALAMANDER_IMAGE_HEIGHT = 300;  // Height of the salamander image.
const SLEEP_TIME = 100;               // Sleep time to resize the window [ms].
const INTERVAL_CALL_TIME = 250;    // Time interval between regular calls [ms].
const SIZE_UPDATE_THRESHOLD = 5;   // Minimal thershold to update the size.
const MAX_ROW_SELECT_IMAGES = 16;  // Max number of images per row (BO design).
const DEFAULT_BO_PANEL_FONTSIZE = 1.0;    // Default font size for BO panel.
const DEFAULT_BO_PANEL_IMAGES_SIZE = 25;  // Default images size for BO panel.
// Height of the action buttons as a ratio of the images size for the BO panel.
const ACTION_BUTTON_HEIGHT_RATIO = 0.8;

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
  'aoe4': {'select faction': 8, 'civilization_flag': 12}
};

// Image to display when the requested image can not be loaded
const ERROR_IMAGE = 'assets/common/icon/question_mark.png';


// -- Variables -- //

let gameName = 'aoe2';     // Name of the game (i.e. its picture folder)
let dataBO = null;         // Data of the selected BO
let stepCount = -1;        // Number of steps of the current BO
let stepID = -1;           // ID of the current BO step
let overlayWindow = null;  // Window for the overlay
let imagesGame = {};       // Dictionary with images available for the game.
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
 * Resize the overlay and move it to keep its top right corner
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
    const upperRightX = window.screenLeft + currentWidth;
    const upperRightY = window.screenTop;

    // Resize the panel
    window.resizeTo(newWidth, newHeight);

    // Move the panel (keeping upper right corner at same position as before)
    window.moveTo(upperRightX - newWidth, upperRightY);
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
    imageHTML += ' onerror="this.src=\'' + ERROR_IMAGE + '\'"';
    imageHTML += imageID ? ' id="' + imageID + '"' : '';
    imageHTML += ' height="' + imageHeight + '"';
    imageHTML += ' onclick="' + functionName +
        (functionArgs ? '(\'' + functionArgs.replace('\'', '\\\'') + '\')"' :
                        '()"');
    imageHTML += '/>';
  }
  // Image (no button)
  else {
    imageHTML += '<img src="' + imagePath + '"';
    imageHTML += ' onerror="this.src=\'' + ERROR_IMAGE + '\'"';
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
  if ((name in container) && (!positiveFlag || (container[name] >= 0))) {
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
  htmlString += '<nobr><div class="bo_line bo_line_config">';

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

      // Split note line between text and images
      const splitLine = splitNoteLine(note);
      const splitCount = splitLine.length;

      if (splitCount > 0) {
        // loop on the line parts
        for (let splitID = 0; splitID < splitCount; splitID++) {
          // Check if it is a valid image and get its path
          imagePath = getImagePath(splitLine[splitID]);

          if (imagePath) {  // image
            htmlString += getBOImageHTML(imagePath);
          } else {  // text
            htmlString += splitLine[splitID];
          }
        }
      }

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
 * Show or hide the items depending on the BO validity.
 */
function showHideItemsBOValidity() {
  // List of items to show/hide.
  const itemNames = [
    'copy_to_clipboard', 'save_to_file', 'add_bo_step', 'format_bo',
    'diplay_overlay', 'evaluate_time', 'time_offset_widget'
  ];

  // Loop on all the items
  for (const itemName of itemNames) {
    // Check if the item can be shown
    let showItem = dataBO != null;
    if (showItem &&
        ['evaluate_time', 'time_offset_widget'].includes(itemName)) {
      showItem = isBOTimingEvaluationAvailable();
    }

    if (showItem) {  // Valid BO -> show items
      document.getElementById(itemName).style.display = 'block';
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
  showHideItemsBOValidity();
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
  if (subFolder == 'select faction') {
    for (const [key, value] of Object.entries(factionsList)) {
      console.assert(
          value.length == 2, 'Faction list item should have a size of 2');

      // Check if it is a valid image and get its path
      const imagePath = getImagePath(factionImagesFolder + '/' + value[1]);
      if (imagePath) {
        if (rowCount == 0) {
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
        if (rowCount == 0) {
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
    const mainFolder = (i == 0) ? imagesGame : imagesCommon;

    // Loop on the sub-folders with the images
    for (const subFolder of Object.keys(mainFolder)) {
      let option = document.createElement('option');
      option.text = subFolder.replace('_', ' ');
      option.value = subFolder;
      imageSelectWidget.add(option);
    }
  }

  // Update the selection of images
  updateImagesSelection(document.getElementById('image_class_selection').value);
}

/**
 * Update the links to the external BO websites.
 */
function updateExternalBOWebsites() {
  // Remove 'external_bo_webistes' if it exists
  const parent = document.getElementById('first_column');
  const child = document.getElementById('external_bo_webistes');
  if (child) {
    parent.removeChild(child);
  }

  // Check if external BO websites exist
  if (gameName in EXTERNAL_BO_WEBSITES) {
    let linksContent = '';

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

    // Insert after 'game_selection' <div>
    const previousElem = document.getElementById('game_selection');
    previousElem.insertAdjacentHTML(
        'afterend',
        '<div class="config_row" id="external_bo_webistes">' + linksContent +
            '</div>');
  }
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
<div>Use the left and right arrows to select the build order step.</div>
<div>In case valid timings are available for all steps, click on the feather/hourglass</div>
<div>to switch to the timer mode (updating the steps with a timer).</div>
<div>In timer mode, you can increment/decrement the clock by 1 second with the arrows,</div>
<div>start/stop the timer and set it back to <em>0:00</em>.</div>`;

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
 * Update the build order elements (font size and images size) based on sliders.
 */
function updateBOFromSliders() {
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
      imagesSize + ' (image)';

  if (imagesSize !== imageHeightBO) {
    imageHeightBO = imagesSize;
    actionButtonHeight = ACTION_BUTTON_HEIGHT_RATIO * imagesSize;
    updateBOPanel(false);
  }
}

/**
 * Initialize the configuration window.
 */
function initConfigWindow() {
  // Get the images available
  imagesGame = getImagesGame();
  imagesCommon = getImagesCommon();
  factionsList = getFactions();
  factionImagesFolder = getFactionImagesFolder();

  // Update the title of the configuration page.
  updateTitle();

  // Update the external BO website links
  updateExternalBOWebsites();

  // Update the information about RTS Overlay
  updateRTSOverlayInfo();

  // Update the hotkeys tooltip for 'Diplay overlay'
  document.getElementById('diplay_overlay_tooltiptext').innerHTML =
      getDiplayOverlayTooltiptext();

  // Initialize the BO panel
  resetDataBOMsg();
  document.getElementById('bo_design').value = getWelcomeMessage();
  updateSalamanderIcon();
  initImagesSelection();
  showHideItemsBOValidity();

  // Set default sliders values
  document.getElementById('bo_fontsize').value = DEFAULT_BO_PANEL_FONTSIZE;
  document.getElementById('bo_images_size').value =
      DEFAULT_BO_PANEL_IMAGES_SIZE;
  updateBOFromSliders();

  // Updating the variables when changing the game
  document.getElementById('select_game').addEventListener('input', function() {
    gameName = document.getElementById('select_game').value;

    imagesGame = getImagesGame();
    factionsList = getFactions();
    factionImagesFolder = getFactionImagesFolder();

    updateExternalBOWebsites();
    updateRTSOverlayInfo();

    resetDataBOMsg();
    document.getElementById('bo_design').value = getWelcomeMessage();
    updateSalamanderIcon();
    initImagesSelection();
    showHideItemsBOValidity();
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
    updateBOFromSliders();
  });

  document.getElementById('bo_images_size')
      .addEventListener('input', function() {
        updateBOFromSliders();
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
  content += '<span class="tooltiptext_left"><div>' + getInstructions() +
      '</div></span>';

  document.getElementById('rts_overlay_info').innerHTML = content;
}

/**
 * Replace the BO panel by the salamander with sword & shield icon.
 */
function updateSalamanderIcon() {
  document.getElementById('bo_panel').innerHTML = '';
  document.getElementById('bo_panel_sliders').style.display = 'none';
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

  // Show BO panel sliders if present
  let boPanelSliders = document.getElementById('bo_panel_sliders');
  if (boPanelSliders) {
    boPanelSliders.style.display = 'flex';
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
  // This is obtained using the 'utilities/list_images.py' script.
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
 * @param {Object} keyCondition  Dictionary with the keys to look for and their
 *                               value (to consider as valid), null to skip it.
 *
 * @returns true if no key condition or key conditions are correct.
 */
function checkBuildOrderKeyValues(keyCondition = null) {
  if (!keyCondition) {  // no key condition to check
    return true;
  }

  for (const [key, value] of Object.entries(keyCondition)) {
    if (key in dataBO) {
      const dataCheck = dataBO[key];
      // Any build order data value is valid
      if (['any', 'Any', 'Generic'].includes(dataCheck)) {
        continue;
      }
      const isList = Array.isArray(dataCheck);
      if ((isList && !dataCheck.includes(value)) ||
          (!isList && (value !== dataCheck))) {
        return false;  // at least one key condition not met
      }
    }
  }

  return true;
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
        updatedCheckNote = updatedCheckNote.replace(ignoreElem, '');
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
        beforeNote = beforeNote.replace(/^\s+/gm, '');  // lstrip in Python

        // Gather note parts after the found sub-note
        let afterNote = '';
        for (let afterID = firstID + gatherCount; afterID < splitCount;
             afterID++) {
          console.assert(
              0 <= afterID && afterID < splitCount,
              'afterID value not correct.');
          afterNote += ' ' + noteSplit[afterID];
        }
        afterNote = afterNote.replace(/^\s+/gm, '');  // lstrip in Python

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
    if ((buildOrderTimer['last_time_int'] != buildOrderTimer['time_int']) ||
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
 */
function saveBOToFile() {
  // Create a file with the BO content
  const file = new Blob(
      [document.getElementById('bo_design').value], {type: 'text/plain'});

  // Add file content in an object URL with <a> tag
  const link = document.createElement('a');
  link.href = URL.createObjectURL(file);

  // File name
  if (dataBO && Object.keys(dataBO).includes('name')) {
    // Replace all spaces by '_'
    link.download = dataBO.name.replace(/\s+/g, '_') + '.json';
  } else {
    link.download = 'rts_overlay.json';
  }

  // Add click event to <a> tag to save file
  link.click();
  URL.revokeObjectURL(link.href);
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
  htmlContent += '\n' + getBOImageValue.toString();
  htmlContent += '\n' + checkValidBO.toString();
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
    'Replace the text in the panel below by any build order in correct JSON format, then click',
    'on \'Display overlay\' (appearing on the left side of the screen when the build order is valid).'
  ];

  if (externalBOLines) {
    result = result.concat(['']);
    result = result.concat(externalBOLines);
  }

  const buttonsLines = [
    '',
    'You can' + (externalBOLines ? ' also' : '') +
        ' manually write your build order as JSON format, using the following buttons',
    'on the left (some buttons only appear when the build order is valid):',
    '&nbsp &nbsp - \'Reset build order\' : Reset the build order to a minimal template (adapt the initial fields).',
    '&nbsp &nbsp - \'Add step\' : Add a step to the build order.',
    '&nbsp &nbsp - \'Format\' : Format the build order to a proper JSON indentation.',
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
    'In the \'Image selection\' section below, you can get images by selecting a category and clicking on the',
    'requested image (this will copy its value to the clipboard). You can then paste it anywhere in the text panel.'
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
    'You can update the font size and the images height of the build order panel with the sliders on top of it.',
    '',
    'To save your build order, click on \'Save build order\' (on the left), which will save it as a JSON file.',
    'Alternatively, you can click on \'Copy to clipboard\', to copy the build order content, and paste it anywhere.',
    'To load a build order, drag and drop a file with the build order on this panel (or replace the text manually).'
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
\n\nHover briefly on the information button ("i" icon on top of this panel) to read the full instructions.\
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
      return true;

    default:
      return false;
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
  // This is obtained using the 'utilities/list_images.py' script.
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
                'CivIcon-Armenians.png#CivIcon-Aztecs.png#CivIcon-Bengalis.png#CivIcon-Berbers.png#CivIcon-Bohemians.png#CivIcon-Britons.png#CivIcon-Bulgarians.png#CivIcon-Burgundians.png#CivIcon-Burmese.png#CivIcon-Byzantines.png#CivIcon-Celts.png#CivIcon-Chinese.png#CivIcon-Cumans.png#CivIcon-Dravidians.png#CivIcon-Ethiopians.png#CivIcon-Franks.png#CivIcon-Georgians.png#CivIcon-Goths.png#CivIcon-Gurjaras.png#CivIcon-Hindustanis.png#CivIcon-Huns.png#CivIcon-Incas.png#CivIcon-Indians.png#CivIcon-Italians.png#CivIcon-Japanese.png#CivIcon-Khmer.png#CivIcon-Koreans.png#CivIcon-Lithuanians.png#CivIcon-Magyars.png#CivIcon-Malay.png#CivIcon-Malians.png#CivIcon-Mayans.png#CivIcon-Mongols.png#CivIcon-Persians.png#CivIcon-Poles.png#CivIcon-Portuguese.png#CivIcon-Romans.png#CivIcon-Saracens.png#CivIcon-Sicilians.png#CivIcon-Slavs.png#CivIcon-Spanish.png#CivIcon-Tatars.png#CivIcon-Teutons.png#CivIcon-Turks.png#CivIcon-Vietnamese.png#CivIcon-Vikings.png#question_mark.png',
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
                'Aoe2de_food.png#Aoe2de_gold.png#Aoe2de_hammer.png#Aoe2de_stone.png#Aoe2de_wood.png#BerryBushDE.png#MaleVillDE_alpha.png#MaleVillDE.jpg',
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
    'Generic': ['GEN', 'question_mark.png'],
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
    'You can get many build orders with the requested format from buildorderguide.com',
    '(you can use the shortcut on the left).',
    'Select a build order on buildorderguide.com, click on \'Copy to clipboard for RTS Overlay\',',
    'then paste the content in the text panel below.'
  ];
  return contentArrayToDiv(
      getArrayInstructions(true, selectFactionLines, externalBOLines));
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
    return 24.0;
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
  let lastVillagerCount = 6
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
  // This is obtained using the 'utilities/list_images.py' script.
  const imagesDict = {
    'abilities': 'attack-move.png#repair.png',
    'ability_jeanne':
        'ability-champion-companions-1.png#ability-consecrate-1.png#ability-divine-arrow-1.png#ability-divine-restoration-1.png#ability-field-commander-1.png#ability-gunpowder-monarch-1.png#ability-holy-wrath-1.png#ability-path-of-the-archer-1.png#ability-path-of-the-warrior-1.png#ability-rider-companions-1.png#ability-riders-ready-1.png#ability-strength-of-heaven-1.png#ability-to-arms-men-1.png#ability-valorous-inspiration-1.png',
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
    'building_malians': 'cattle-ranch-2.png#pit-mine-1.png#toll-outpost-1.png',
    'building_military':
        'archery-range.png#barracks.png#dock.png#siege-workshop.png#stable.png',
    'building_mongols': 'ger.png#ovoo.png#pasture.png#prayer-tent.png',
    'building_ottomans': 'military-school-1.png',
    'building_religious': 'monastery.png#mosque.png',
    'building_rus':
        'fortified-palisade-gate.png#fortified-palisade-wall.png#hunting-cabin.png#wooden-fortress.png',
    'building_technology': 'blacksmith.png#madrasa.png#university.png',
    'civilization_flag':
        'abb.png#ayy.png#byz.png#chi.png#CivIcon-AbbasidAoE4.png#CivIcon-AbbasidAoE4_spacing.png#CivIcon-AyyubidsAoE4.png#CivIcon-AyyubidsAoE4_spacing.png#CivIcon-ByzantinesAoE4.png#CivIcon-ByzantinesAoE4_spacing.png#CivIcon-ChineseAoE4.png#CivIcon-ChineseAoE4_spacing.png#CivIcon-DelhiAoE4.png#CivIcon-DelhiAoE4_spacing.png#CivIcon-EnglishAoE4.png#CivIcon-EnglishAoE4_spacing.png#CivIcon-FrenchAoE4.png#CivIcon-FrenchAoE4_spacing.png#CivIcon-HREAoE4.png#CivIcon-HREAoE4_spacing.png#CivIcon-JapaneseAoE4.png#CivIcon-JapaneseAoE4_spacing.png#CivIcon-JeanneDArcAoE4.png#CivIcon-JeanneDArcAoE4_spacing.png#CivIcon-MaliansAoE4.png#CivIcon-MaliansAoE4_spacing.png#CivIcon-MongolsAoE4.png#CivIcon-MongolsAoE4_spacing.png#CivIcon-OrderOfTheDragonAoE4.png#CivIcon-OrderOfTheDragonAoE4_spacing.png#CivIcon-OttomansAoE4.png#CivIcon-OttomansAoE4_spacing.png#CivIcon-RusAoE4.png#CivIcon-RusAoE4_spacing.png#CivIcon-ZhuXiLegacyAoE4.png#CivIcon-ZhuXiLegacyAoE4_spacing.png#del.png#dra.png#eng.png#fre.png#hre.png#jap.png#jda.png#mal.png#mon.png#ott.png#rus.png#zxl.png',
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
    'landmark_malians':
        'farimba-garrison-2.png#fort-of-the-huntress-3.png#grand-fulani-corral-2.png#great-mosque-4.png#griot-bara-3.png#mansa-quarry-2.png#saharan-trade-network-1.png',
    'landmark_mongols':
        'deer-stones.png#khaganate-palace.png#kurultai.png#monument-of-the-great-khan.png#steppe-redoubt.png#the-silver-tree.png#the-white-stupa.png',
    'landmark_ottomans':
        'azure-mosque-4.png#istanbul-imperial-palace-2.png#istanbul-observatory-3.png#mehmed-imperial-armory-2.png#sea-gate-castle-3.png#sultanhani-trade-network-1.png#twin-minaret-medrese-1.png',
    'landmark_rus':
        'abbey-of-the-trinity.png#cathedral-of-the-tsar.png#high-armory.png#high-trade-house.png#kremlin.png#spasskaya-tower.png#the-golden-gate.png',
    'landmark_zhuxi':
        'jiangnan-tower-2.png#meditation-gardens-1.png#mount-lu-academy-1.png#shaolin-monastery-2.png#temple-of-the-sun-3.png#zhu-xis-library-3.png',
    'rank':
        'bronze_1.png#bronze_2.png#bronze_3.png#conqueror_1.png#conqueror_2.png#conqueror_3.png#diamond_1.png#diamond_2.png#diamond_3.png#gold_1.png#gold_2.png#gold_3.png#platinum_1.png#platinum_2.png#platinum_3.png#silver_1.png#silver_2.png#silver_3.png',
    'resource':
        'berrybush.png#boar.png#bounty.png#cattle.png#deer.png#fish.png#gaiatreeprototypetree.png#rally.png#relics.png#repair.png#resource_food.png#resource_gold.png#resource_stone.png#resource_wood.png#sacred_sites.png#sheep.png#wolf.png',
    'technology_abbasid':
        'agriculture.png#armored-caravans.png#boot-camp.png#camel-barding.png#camel-handling.png#camel-rider-barding-4.png#camel-rider-shields.png#camel-support.png#composite-bows.png#faith.png#fertile-crescent-2.png#fresh-foodstuffs.png#grand-bazaar.png#improved-processing.png#medical-centers.png#phalanx.png#preservation-of-knowledge.png#spice-roads.png#teak-masts.png',
    'technology_ayyubids':
        'culture-wing-advancement-1.png#culture-wing-logistics-1.png#economic-wing-growth-1.png#economic-wing-industry-1.png#infantry-support-4.png#military-wing-master-smiths-1.png#military-wing-reinforcement-1.png#phalanx-2.png#siege-carpentry-3.png#sultans-mamluks-3.png#trade-wing-advisors-1.png#trade-wing-bazaar-1.png',
    'technology_byzantines':
        'border-settlements-2.png#expilatores-2.png#ferocious-speed-4.png#greek-fire-projectiles-4.png#heavy-dromon-3.png#liquid-explosives-3.png#numeri-4.png#teardrop-shields-3.png#trapezites-2.png',
    'technology_chinese':
        'ancient-techniques.png#battle-hardened.png#extra-hammocks.png#extra-materials.png#handcannon-slits.png#imperial-examination.png#pyrotechnics.png#reload-drills.png#reusable-barrels.png#thunderclap-bombs-4.png',
    'technology_defensive':
        'arrow-slits.png#boiling-oil.png#cannon-emplacement.png#court-architects.png#fortify-outpost.png#springald-emplacement.png',
    'technology_delhi':
        'all-seeing-eye.png#armored-beasts.png#efficient-production.png#forced-march.png#hearty-rations.png#honed-blades.png#lookout-towers.png#manuscript-trade-1.png#patchwork-repairs.png#reinforced-foundations.png#sanctity.png#siege-elephant.png#slow-burning-defenses.png#swiftness.png#tranquil-venue.png#village-fortresses.png#zeal.png',
    'technology_dragon':
        'bodkin-bolts-4.png#dragon-fire-2.png#dragon-scale-leather-3.png#golden-cuirass-2.png#war-horses-4.png#zornhau-3.png',
    'technology_economy':
        'acid-distilization.png#crosscut-saw.png#cupellation.png#double-broadaxe.png#drift-nets.png#extended-lines.png#fertilization.png#forestry.png#horticulture.png#lumber-preservation.png#precision-cross-breeding.png#professional-scouts.png#specialized-pick.png#survival-techniques.png#textiles.png#wheelbarrow.png',
    'technology_english':
        'admiralty-2.png#armor-clad.png#arrow-volley.png#enclosures.png#network-of-citadels.png#setup-camp.png#shattering-projectiles.png#shipwrights.png',
    'technology_french':
        'cantled-saddles.png#chivalry.png#crossbow-stirrups.png#enlistment-incentives.png#gambesons.png#long-guns.png#merchant-guilds-4.png#royal-bloodlines.png',
    'technology_hre':
        'benediction.png#devoutness.png#fire-stations.png#heavy-maces.png#inspired-warriors.png#marching-drills.png#reinforced-defenses.png#riveted-chain-mail-2.png#riveted-chain-mail.png#slate-and-stone-construction.png#steel-barding-3.png#two-handed-weapon.png',
    'technology_japanese':
        'copper-plating-3.png#daimyo-manor-1.png#daimyo-palace-2.png#do-maru-armor-4.png#explosives-4.png#fudasashi-3.png#heated-shot-4.png#hizukuri-2.png#kabura-ya-whistling-arrow-3.png#kobuse-gitae-3.png#nagae-yari-4.png#oda-tactics-4.png#odachi-3.png#shogunate-castle-3.png#swivel-cannon-4.png#takezaiku-2.png#tatara-1.png#towara-1.png#yaki-ire-4.png',
    'technology_jeanne': 'companion-equipment-3.png#ordinance-company-3.png',
    'technology_malians':
        'banco-repairs-2.png#canoe-tactics-2.png#farima-leadership-4.png#imported-armor-3.png#local-knowledge-4.png#poisoned-arrows-3.png#precision-training-4.png',
    'technology_military':
        'angled-surfaces.png#balanced-projectiles.png#biology.png#bloomery.png#chemistry.png#damascus-steel.png#decarbonization.png#elite-army-tactics.png#fitted-leatherwork.png#geometry.png#greased-axles.png#incendiary-arrows.png#insulated-helm.png#iron-undermesh.png#master-smiths.png#military-academy.png#platecutter-point.png#siege-engineering.png#siege-works.png#steeled-arrow.png#wedge-rivets.png',
    'technology_mongols':
        'additional-torches.png#monastic-shrines.png#piracy.png#raid-bounty.png#siha-bow-limbs.png#steppe-lancers.png#stone-bounty.png#stone-commerce.png#superior-mobility.png#whistling-arrows.png#yam-network.png',
    'technology_naval':
        'additional-sails.png#armored-hull.png#chaser-cannons.png#explosives.png#extra-ballista.png#incendiaries-3.png#naval-arrow-slits.png#navigator-lookout.png#shipwrights-4.png#springald-crews-3.png',
    'technology_ottomans':
        'advanced-academy-1.png#anatolian-hills-1.png#fast-training-1.png#field-work-1.png#great-bombard-emplacement.png#imperial-fleet-4.png#janissary-company-1.png#janissary-guns-4.png#mehter-drums-1.png#military-campus-1.png#siege-crews-1.png#trade-bags-1.png',
    'technology_religious': 'herbal-medicine.png#piety.png#tithe-barns.png',
    'technology_rus':
        'adaptable-hulls-3.png#banded-arms.png#blessing-duration.png#boyars-fortitude.png#castle-turret.png#castle-watch.png#cedar-hulls.png#clinker-construction.png#double-time.png#fine-tuned-guns.png#improved-blessing.png#knight-sabers.png#mounted-precision.png#mounted-training.png#saints-reach.png#saints-veneration-4.png#siege-crew-training.png#wandering-town.png#warrior_scout_2.png',
    'technology_units':
        'adjustable-crossbars.png#lightweight-beams-4.png#roller-shutter-triggers.png#spyglass-4.png',
    'technology_zhuxi':
        '10000-bolts-4.png#advanced-administration-4.png#cloud-of-terror-4.png#dynastic-protectors-4.png#imperial-red-seals-3.png#military-affairs-bureau-1.png#roar-of-the-dragon-4.png',
    'unit_abbasid':
        'camel-archer-2.png#camel-rider-3.png#ghulam-3.png#imam.png',
    'unit_ayyubids':
        'atabeg-1.png#bedouin-skirmisher-2.png#bedouin-swordsman-1.png#camel-lancer-3.png#dervish-3.png#desert-raider-2.png#manjaniq-3.png#tower-of-the-sultan-3.png',
    'unit_byzantines':
        'cataphract-3.png#cheirosiphon-3.png#dromon-2.png#limitanei-1.png#tower-of-the-sultan-3.png#varangian-guard-3.png',
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
    'unit_hre': 'landsknecht-3.png#prelate.png',
    'unit_infantry':
        'archer-2.png#crossbowman-3.png#handcannoneer-4.png#man-at-arms-1.png#spearman-1.png',
    'unit_japanese':
        'atakebune-4.png#buddhist-monk-3.png#katana-bannerman-2.png#mounted-samurai-3.png#onna-bugeisha-2.png#onna-musha-3.png#ozutsu-4.png#samurai-1.png#shinobi-2.png#shinto-priest-3.png#uma-bannerman-2.png#yumi-ashigaru-2.png#yumi-bannerman-2.png',
    'unit_jeanne':
        'jeanne-darc-blast-cannon-4.png#jeanne-darc-hunter-2.png#jeanne-darc-knight-3.png#jeanne-darc-markswoman-4.png#jeanne-darc-mounted-archer-3.png#jeanne-darc-peasant-1.png#jeanne-darc-woman-at-arms-2.png#jeannes-champion-3.png#jeannes-rider-3.png',
    'unit_malians':
        'donso-1.png#hunting-canoe-2.png#javelin-thrower-2.png#musofadi-gunner-4.png#musofadi-warrior-2.png#sofa-2.png#war-canoe-2.png#warrior-scout-2.png',
    'unit_mongols':
        'huihui-pao-1.png#keshik-2.png#khan-1.png#light-junk.png#mangudai.png#shaman.png#traction-trebuchet.png',
    'unit_ottomans':
        'grand-galley-4.png#great-bombard-4.png#janissary-3.png#mehter-2.png#scout-ship-2.png#sipahi-2.png',
    'unit_religious': 'imam-3.png#monk-3.png',
    'unit_rus':
        'horse-archer-3.png#lodya-attack-ship.png#lodya-demolition-ship.png#lodya-fishing-boat.png#lodya-galley-3.png#lodya-trade-ship.png#lodya-transport-ship.png#militia-2.png#streltsy.png#warrior-monk.png',
    'unit_ship':
        'baghlah.png#baochuan.png#carrack.png#demolition-ship.png#dhow.png#explosive-dhow.png#explosive-junk.png#fishing-boat.png#galley.png#hulk.png#junk-3.png#light-junk-2.png#trade-ship.png#transport-ship.png#war-junk.png#xebec.png',
    'unit_siege':
        'battering-ram.png#bombard.png#culverin-4.png#mangonel-3.png#ribauldequin-4.png#siege-tower.png#springald.png#trebuchet.png',
    'unit_worker':
        'monk-3.png#trader.png#villager-abbasid.png#villager-china.png#villager-delhi.png#villager-japanese.png#villager-malians.png#villager-mongols.png#villager-ottomans.png#villager.png',
    'unit_zhuxi': 'imperial-guard-1.png#shaolin-monk-3.png#yuan-raider-4.png'
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
    'Holy Roman Empire': ['HRE', 'CivIcon-HREAoE4.png'],
    'Japanese': ['JAP', 'CivIcon-JapaneseAoE4.png'],
    'Jeanne d\'Arc': ['JDA', 'CivIcon-JeanneDArcAoE4.png'],
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
    'You can get many build orders with the requested format from aoe4guides.com or age4builder.com',
    '(you can use the shortcuts on the left).',
    'On aoe4guides.com, select a build order, click on the 3 dots (upper right corner),',
    'click on the \'Overlay Tool\' copy button, and paste the content below.',
    'On age4builder.com, select a build order, click on the salamander icon, and paste the content below.'
  ];
  return contentArrayToDiv(
      getArrayInstructions(true, selectFactionLines, externalBOLines));
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
  // This is obtained using the 'utilities/list_images.py' script.
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
