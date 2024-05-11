// -- Define parameters -- //
const BO_IMAGE_HEIGHT = 30;  // Height of the images in the Build Order (BO).
const ACTION_BUTTON_HEIGHT = 20;  // Height of the action buttons.
const SLEEP_TIME = 100;           // Sleep time to resize the window [ms]

// -- Variables -- //
let gameName = 'aoe2';     // Name of the game (i.e. its picture folder)
let dataBO = null;         // Data of the selected BO
let stepCount = -1;        // Number of steps of the current BO
let stepID = -1;           // ID of the current BO step
let overlayWindow = null;  // Window for the overlay

/**
 * Sleep for a few ms
 *
 * @param {int} time_ms    Time to sleep [ms].
 *
 * @returns Function to sleep the requested time.
 */
function sleep(time_ms) {
  return new Promise(resolve => setTimeout(resolve, time_ms));
}

/**
 * Limit a value in the [min ; max] range
 *
 * @param {*} value    Value to limit.
 * @param {*} min      Minimal bound.
 * @param {*} max      Maximal bound.
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
  // Save upper right corner position
  const upperRightX = window.screenLeft + window.outerWidth;
  const upperRightY = window.screenTop;

  // Resize and move the overlay after a short time (wait for panel update)
  sleep(SLEEP_TIME).then(() => {
    const boPanelOverlay = document.getElementById('bo_panel');
    const heightOffset = window.outerHeight - window.innerHeight;
    const widthOffset = window.outerWidth - window.innerWidth;
    const newWidth = boPanelOverlay.offsetWidth + widthOffset;

    // Resize the panel
    window.resizeTo(newWidth, boPanelOverlay.offsetHeight + heightOffset);

    // Move the panel (keeping upper right corner at same position as before)
    window.moveTo(upperRightX - newWidth, upperRightY);
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
  stepID--;
  limitStepID();
  updateBOPanel(true);
  overlayResizeMove();
}

/**
 * Move to the next BO step (overlay window).
 */
function nextStepOverlay() {
  stepID++;
  limitStepID();
  updateBOPanel(true);
  overlayResizeMove();
}

/**
 * Get a basic template to work on a valid BO.
 *
 * @returns Requested BO.
 */
function getTemplateBO() {
  return `
  {
    "name": "POR Arena Castle Drop",
    "civilization": "Portuguese",
    "author": "Poop Lord",
    "source": "https://youtu.be/BjdliQYglog",
    "build_order": [
        {
            "villager_count": 4,
            "age": 1,
            "resources": {
                "wood": 0,
                "food": 4,
                "gold": 0,
                "stone": 0
            },
            "notes": [
                "Build 2 @other/House_aoe2DE.png@ | First 4 @resource/MaleVillDE.jpg@ to @animal/Sheep_aoe2DE.png@"
            ],
            "time": "0:25"
        },
        {
            "villager_count": 8,
            "age": 1,
            "resources": {
                "wood": 0,
                "food": 8,
                "gold": 0,
                "stone": 0
            },
            "notes": [
                "Next 4 @resource/MaleVillDE.jpg@ to @resource/BerryBushDE.png@ (build @mill/Mill_aoe2de.png@) | Start pushing @animal/Deer_aoe2DE.png@"
            ],
            "time": "2:05"
        },
        {
            "villager_count": 10,
            "age": 1,
            "resources": {
                "wood": 0,
                "food": 10,
                "gold": 0,
                "stone": 0
            },
            "notes": [
                "Next 2 @resource/MaleVillDE.jpg@ to @animal/Deer_aoe2DE.png@/@animal/Sheep_aoe2DE.png@"
            ],
            "time": "2:55"
        },
        {
            "villager_count": 11,
            "age": 1,
            "resources": {
                "wood": 0,
                "food": 10,
                "gold": 0,
                "stone": 0
            },
            "notes": [
                "Next @resource/MaleVillDE.jpg@ builds 1 @other/House_aoe2DE.png@, then lures 1st @animal/Boar_aoe2DE.png@"
            ],
            "time": "3:20"
        },
        {
            "villager_count": 14,
            "age": 1,
            "resources": {
                "wood": 0,
                "food": 14,
                "gold": 0,
                "stone": 0
            },
            "notes": [
                "Next 3 @resource/MaleVillDE.jpg@ to @animal/Boar_aoe2DE.png@/@animal/Deer_aoe2DE.png@"
            ],
            "time": "4:35"
        },
        {
            "villager_count": 18,
            "age": 1,
            "resources": {
                "wood": 4,
                "food": 14,
                "gold": 0,
                "stone": 0
            },
            "notes": [
                "Next 4 on @resource/Aoe2de_wood.png@ (@lumber_camp/Lumber_camp_aoe2de.png@) | Build 1 @other/House_aoe2DE.png@ with @resource/Aoe2de_wood.png@@resource/MaleVillDE.jpg@ (drop off)",
                "Lure 2nd @animal/Boar_aoe2DE.png@ with existing @resource/MaleVillDE.jpg@ | Eat @animal/Sheep_aoe2DE.png@ when needed"
            ],
            "time": "6:15"
        },
        {
            "villager_count": 21,
            "age": 1,
            "resources": {
                "wood": 4,
                "food": 14,
                "gold": 3,
                "stone": 0
            },
            "notes": [
                "Next 3 @resource/MaleVillDE.jpg@ on @resource/Aoe2de_gold.png@ (build @mining_camp/Mining_camp_aoe2de.png@) | 22 pop @age/FeudalAgeIconDE.png@"
            ],
            "time": "7:30"
        },
        {
            "villager_count": 21,
            "age": 2,
            "resources": {
                "wood": 6,
                "food": 12,
                "gold": 3,
                "stone": 0
            },
            "notes": [
                "Before @age/FeudalAgeIconDE.png@ | 2 @resource/MaleVillDE.jpg@ from @resource/Aoe2de_food.png@ to @resource/Aoe2de_wood.png@ | Scout opponent"
            ],
            "time": "9:40"
        },
        {
            "villager_count": 22,
            "age": 2,
            "resources": {
                "wood": 6,
                "food": 13,
                "gold": 3,
                "stone": 0
            },
            "notes": [
                "In @age/FeudalAgeIconDE.png@ | @resource/Aoe2de_wood.png@@resource/MaleVillDE.jpg@ build 1 @blacksmith/Blacksmith_aoe2de.png@ (1) & @market/Market_aoe2DE.png@ (3)",
                "Next @resource/MaleVillDE.jpg@ to @resource/Aoe2de_food.png@ | Research @town_center/LoomDE.png@ | 23 pop @age/CastleAgeIconDE.png@"
            ],
            "time": "10:25"
        },
        {
            "villager_count": 22,
            "age": 3,
            "resources": {
                "wood": 1,
                "food": 3,
                "gold": 1,
                "stone": 11,
                "builder": 6
            },
            "notes": [
                "Before @age/CastleAgeIconDE.png@ | 11 @resource/MaleVillDE.jpg@ (9 @animal/Sheep_aoe2DE.png@, 1 @resource/BerryBushDE.png@, 1 @resource/Aoe2de_gold.png@) to @resource/Aoe2de_stone.png@ (build @mining_camp/Mining_camp_aoe2de.png@)",
                "6 @resource/MaleVillDE.jpg@ (5 @resource/Aoe2de_wood.png@, 1 @resource/Aoe2de_gold.png@) forward build 1 @other/House_aoe2DE.png@ | Sell @resource/Aoe2de_food.png@ to buy @resource/Aoe2de_stone.png@"
            ],
            "time": "13:05"
        },
        {
            "villager_count": 23,
            "age": 3,
            "resources": {
                "wood": 8,
                "food": 3,
                "gold": 6,
                "stone": 0,
                "builder": 6
            },
            "notes": [
                "In @age/CastleAgeIconDE.png@ | Build forward @castle/Castle_aoe2DE.png@ | @resource/Aoe2de_stone.png@@resource/MaleVillDE.jpg@ (+ new) to @resource/Aoe2de_wood.png@ & @resource/Aoe2de_gold.png@"
            ],
            "time": "13:30"
        },
        {
            "villager_count": 24,
            "age": 3,
            "resources": {
                "wood": 8,
                "food": 3,
                "gold": 13,
                "stone": 0
            },
            "notes": [
                "6 @resource/Aoe2de_hammer.png@@resource/MaleVillDE.jpg@ to opponent @resource/Aoe2de_gold.png@ | Train @unique_unit/OrganGunIcon-DE.png@"
            ],
            "time": "13:55"
        }
    ]
}
  `;
}

/**
 * Split a line based on the @ markers and remove first/last empty elements.
 *
 * @param {string} noteLine    Line corresponding to a note, to split.
 *
 * @returns Requested split line.
 */
function splitNoteLine(noteLine) {
  lineSplit = noteLine.split('@')

  if ((lineSplit.length > 0) && (lineSplit[0] == '')) {
    lineSplit.shift();  // Remove first element
  }
  if ((lineSplit.length > 0) && (lineSplit[-1] == '')) {
    lineSplit.pop();  // Remove last element
  }

  return lineSplit
}

/**
 * Check if an image exist.
 *
 * @param {string} imageStr    Image to check (with path and extension).
 *
 * @returns True if valid image.
 */
function checkImageExist(imageStr) {
  if (!imageStr) {
    return false;
  }

  const extension = imageStr.split('.').pop();
  return (['png', 'jpg'].includes(extension));
}

/**
 * Get the path for an image.
 *
 * @param {string} imageSearch    Image to search, with extension and path
 *                                starting in 'common' or 'game' picture folder.
 *
 * @returns Image with its path, 'null' if not found.
 */
function getImagePath(imageSearch) {
  const gamePicturesFolder = '../pictures/' + gameName;
  const commonPicturesFolder = '../pictures/common';

  if (gamePicturesFolder != null)  // try first with the game folder
  {
    const gameImagePath = gamePicturesFolder + '/' + imageSearch;
    if (checkImageExist(gameImagePath)) {
      return gameImagePath;
    }
  }

  // try then with the common folder
  if (commonPicturesFolder != null) {
    const commonImagePath = commonPicturesFolder + '/' + imageSearch;
    if (checkImageExist(commonImagePath)) {
      return commonImagePath;
    }
  }

  // not found
  return null;
}

/**
 * Get the HTML code to add an image.
 *
 * @param {*} imagePath       Image to display (with path and extension).
 * @param {*} imageHeight     Height of the image.
 * @param {*} functionName    Name of the function to call when clicking on the
 *                            image, null if no function to call.
 *
 * @returns Requested HTML code.
 */
function getImageHTML(imagePath, imageHeight, functionName = null) {
  if (functionName) {
    return '<input type="image" src="' + imagePath + '" height="' +
        imageHeight + '" onclick="' + functionName + '()"/>';
  } else {
    return '<input type="image" src="' + imagePath + '" height="' +
        imageHeight + '"/>';
  }
}

/**
 * Check if the BO is valid and updates the BO variables if not valid.
 *
 * @returns True if valid BO.
 */
function checkValidBO() {
  // Valid BO
  if (dataBO && (stepCount >= 1) && (stepID >= 0) && (stepID < stepCount)) {
    return true;
  }

  // Invalid BO
  dataBO = null;
  stepCount = -1;
  stepID = -1;

  return false;
}

/**
 * Get the content of the BO panel.
 *
 * @param {bool} overlayFlag    True for overlay, false for
 *                              configuration window.
 * @param {int} idBO            Requested ID for the BO.
 *
 * @returns String representing the HTML part of the BO panel.
 */
function getBOPanelContent(overlayFlag, idBO) {
  // Check if BO is valid
  if (!checkValidBO()) {
    return '<nobr><div class="bo_line">The build order is not valid.</div></nobr>';
  }

  // Prepare HTML content for the BO body
  let htmlString = '';

  // Folders with requested pictures
  const gamePicturesFolder = '../pictures/' + gameName + '/';
  const commonPicturesFolder = '../pictures/common/';

  // Configuration from within the BO panel
  htmlString += '<nobr><div class="bo_line bo_line_config">';

  const timingFlag = false;  // TODO Implement time function

  // Current step or time
  htmlString += timingFlag ? '0:00' : 'Step: ' + (idBO + 1) + '/' + stepCount;

  // Previous or next step
  const stepFunctionSuffix = overlayFlag ? 'Overlay' : 'Config';

  htmlString += getImageHTML(
      commonPicturesFolder + 'action_button/previous.png', ACTION_BUTTON_HEIGHT,
      'previousStep' + stepFunctionSuffix);
  htmlString += getImageHTML(
      commonPicturesFolder + 'action_button/next.png', ACTION_BUTTON_HEIGHT,
      'nextStep' + stepFunctionSuffix);

  // Update timer
  if (timingFlag) {
    htmlString += getImageHTML(
        commonPicturesFolder + 'action_button/start_stop_active.png',
        ACTION_BUTTON_HEIGHT);
    htmlString += getImageHTML(
        commonPicturesFolder + 'action_button/timer_0.png',
        ACTION_BUTTON_HEIGHT);
  }

  // Switch between manual and timer
  if (overlayFlag) {
    htmlString += getImageHTML(
        commonPicturesFolder + 'action_button/manual_timer_switch.png',
        ACTION_BUTTON_HEIGHT);
  }
  htmlString += '</div></nobr>';

  // Resources
  const currentStep = dataBO.build_order[idBO];
  const resources = currentStep.resources;

  htmlString += '<div>';

  htmlString += '<nobr><div class="bo_line bo_line_resources">';

  const resourceFolder = gamePicturesFolder + 'resource/';
  htmlString +=
      getImageHTML(resourceFolder + 'Aoe2de_wood.png', BO_IMAGE_HEIGHT) +
      resources.wood;

  htmlString +=
      getImageHTML(resourceFolder + 'Aoe2de_food.png', BO_IMAGE_HEIGHT) +
      resources.food;

  htmlString +=
      getImageHTML(resourceFolder + 'Aoe2de_gold.png', BO_IMAGE_HEIGHT) +
      resources.gold;

  htmlString +=
      getImageHTML(resourceFolder + 'Aoe2de_stone.png', BO_IMAGE_HEIGHT) +
      resources.stone;

  htmlString +=
      getImageHTML(resourceFolder + 'MaleVillDE_alpha.png', BO_IMAGE_HEIGHT) +
      currentStep.villager_count;

  // Age image
  let ageImage = null;

  switch (currentStep.age) {
    case 1:
      ageImage = 'DarkAgeIconDE_alpha.png';
      break;
    case 2:
      ageImage = 'FeudalAgeIconDE_alpha.png';
      break;
    case 3:
      ageImage = 'CastleAgeIconDE_alpha.png';
      break;
    case 4:
      ageImage = 'ImperialAgeIconDE_alpha.png';
      break;
    default:
      ageImage = null;
  }

  if (ageImage) {
    htmlString +=
        getImageHTML(gamePicturesFolder + 'age/' + ageImage, BO_IMAGE_HEIGHT);
  }

  if ('time' in currentStep) {
    htmlString +=
        getImageHTML(commonPicturesFolder + 'icon/time.png', BO_IMAGE_HEIGHT) +
        currentStep.time;
  }
  htmlString += '</div></nobr>';

  // Line separating resources from notes
  htmlString += '<hr style="width:100%;text-align:left;margin-left:0"></div>';

  // Notes of the current BO step
  const notes = currentStep.notes;
  const notesCount = notes.length;

  for (let noteID = 0; noteID < notesCount; noteID++) {
    const note = notes[noteID];  // current note line

    // Identify line for CSS properties
    htmlString += '<nobr><div class="bo_line bo_line_note ';
    if (noteID == 0) {
      htmlString += 'bo_line_note_first">';
    } else if (noteID == notesCount - 1) {
      htmlString += 'bo_line_note_last">';
    } else {
      htmlString += 'bo_line_note_middle">';
    }

    // Add timing indication
    if (timingFlag && ('time' in currentStep)) {
      htmlString += '<div class="bo_line_note_timing">' +
          (noteID == 0 ? currentStep.time : '') + '</div>';
    }

    // Split note line between text and images
    const splitLine = splitNoteLine(note);
    const splitCount = splitLine.length

    if (splitCount > 0) {
      // loop on the line parts
      for (let splitID = 0; splitID < splitCount; splitID++) {
        // Check if it is a valid image and get its path
        imagePath = getImagePath(splitLine[splitID]);

        if (imagePath) {  // image
          htmlString += getImageHTML(imagePath, BO_IMAGE_HEIGHT);
        } else {  // text
          htmlString += splitLine[splitID];
        }
      }
    }

    htmlString += '</div></nobr>';
  }

  return htmlString;
}

/**
 * Update the overlay content based on the BO design input.
 */
function updateDataBO() {
  const BODesingContent = document.getElementById('bo_design').value;

  try {
    dataBO = JSON.parse(BODesingContent);
    stepCount = dataBO.build_order.length;
    stepID = 0;
    limitStepID();

    if (stepCount < 1) {  // at least one step
      dataBO = null;
      stepCount = -1;
      stepID = -1;
    }
  } catch (e) {
    dataBO = null;
    stepCount = -1;
    stepID = -1;
  }
}

/**
 * Initialize the configuration window.
 */
function initConfigWindow() {
  // Initialize the BO panel
  document.getElementById('bo_design').innerHTML = getTemplateBO();
  updateDataBO();
  updateBOPanel(false);

  // Panel is automatically updated when the BO design panel is changed
  document.getElementById('bo_design')
      .addEventListener('input', function(event) {
        updateDataBO();
        updateBOPanel(false);
      });
}

/**
 * Update the BO panel rendering.
 *
 * @param {bool} overlayFlag    True for overlay, false for configuration
 *                              window.
 */
function updateBOPanel(overlayFlag) {
  document.getElementById('bo_panel').innerHTML =
      getBOPanelContent(overlayFlag, stepID);
}

/**
 * Display (and create) the overlay window.
 */
function displayOverlay() {
  // Close window if already open
  if (overlayWindow != null) {
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

  htmlContent += '\nconst BO_IMAGE_HEIGHT = ' + BO_IMAGE_HEIGHT + ';';
  htmlContent += '\nconst ACTION_BUTTON_HEIGHT = ' + ACTION_BUTTON_HEIGHT + ';';
  htmlContent += '\nconst SLEEP_TIME = ' + SLEEP_TIME + ';';

  htmlContent += '\nconst gameName = \'' + gameName + '\';';
  htmlContent +=
      '\nconst dataBO = ' + (validBO ? JSON.stringify(dataBO) : 'null') + ';';
  htmlContent += '\nconst stepCount = ' + (validBO ? stepCount : -1) + ';';
  htmlContent += '\nlet stepID = ' + (validBO ? 0 : -1) + ';';

  htmlContent += '\n' + sleep.toString();
  htmlContent += '\n' + limitValue.toString();
  htmlContent += '\n' + limitStepID.toString();
  htmlContent += '\n' + overlayResizeMove.toString();
  htmlContent += '\n' + previousStepOverlay.toString();
  htmlContent += '\n' + nextStepOverlay.toString();
  htmlContent += '\n' + splitNoteLine.toString();
  htmlContent += '\n' + checkImageExist.toString();
  htmlContent += '\n' + getImagePath.toString();
  htmlContent += '\n' + getImageHTML.toString();
  htmlContent += '\n' + checkValidBO.toString();
  htmlContent += '\n' + getBOPanelContent.toString();
  htmlContent += '\n' + updateBOPanel.toString();

  htmlContent += '\n</script>';

  htmlContent += '\n<head><link rel="stylesheet" href="layout.css">' +
      headContent + '</head>';
  htmlContent +=
      '\n<body id=\"body_overlay\">' + bodyContent + '</body></html>';

  // Update overlay HTML content
  overlayWindow.document.write(htmlContent);

  // After a short time (so that elements can be properly updated),
  // adjust the size of the overlay.
  sleep(SLEEP_TIME).then(() => {
    const boPanelOverlay = overlayWindow.document.getElementById('bo_panel');
    const heightOffset = overlayWindow.outerHeight - overlayWindow.innerHeight;
    const widthOffset = overlayWindow.outerWidth - overlayWindow.innerWidth;

    overlayWindow.resizeTo(
        boPanelOverlay.offsetWidth + widthOffset,
        boPanelOverlay.offsetHeight + heightOffset);
  });
}
