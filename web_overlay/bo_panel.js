// Configuration parameters
const SLEEP_TIME = 100

// Variables
let overlayWindow = null;
let dataBO = null;
let stepID = -1;
let stepCount = -1;
let overlayFlag = false;

// Limit a value in the [min ; max] range
function limitValue(value, min, max) {
  return (value <= min) ? min : (value >= max ? max : value);
}

// Sleep for a few ms
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Resize the overlay and move it to keep its top right corner at the same
 * position.
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

// Limit the step ID to valid values
function limitStepID() {
  if (stepCount < 1) {
    stepID = -1;
  } else {
    stepID = limitValue(stepID, 0, stepCount - 1);
  }
}

// Previous BO step (Configuration window)
function previousStepConfig() {
  stepID--;
  limitStepID();
  updateBOPanel(false);
}

// Next BO step (Configuration window)
function nextStepConfig() {
  stepID++;
  limitStepID();
  updateBOPanel(false);
}

// Previous BO step (Overlay window)
function previousStepOverlay() {
  stepID--;
  limitStepID();
  updateBOPanel(true);
  overlayResizeMove();
}

// Next BO step (Overlay window)
function nextStepOverlay() {
  stepID++;
  limitStepID();
  updateBOPanel(true);
  overlayResizeMove();
}

// Basic template to work on a valid BO
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

// Check if an image exist.
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
 * @param {string} imageSearch    Image to search.
 *
 * @returns Image with its path, None if not found.
 */
function getImagePath(imageSearch) {
  const gamePicturesFolder = '../pictures/aoe2';
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
 * Get the content of the BO panel.
 *
 * @param {int} idBO    Requested ID for the BO.
 *
 * @returns String representing the HTML part of the BO panel.
 */
function getBOPanelContent(idBO) {
  let htmlBOString = '<!-- Configuration from within the BO panel -->';

  if (!dataBO || (idBO < 0) || (idBO >= stepCount)) {
    return htmlBOString +
        '<nobr><div class="bo_line">Not valid BO</div></nobr>';
  }

  htmlBOString += '<nobr><div class="bo_line bo_line_config">0:00';

  if (overlayFlag) {
    htmlBOString += `
    <input type="image" src="../pictures/common/action_button/previous.png" height="20" onclick="previousStepOverlay()"/>
    <input type="image" src="../pictures/common/action_button/next.png" height="20" onclick="nextStepOverlay()"/>
    `;
  } else {
    htmlBOString += `
    <input type="image" src="../pictures/common/action_button/previous.png" height="20" onclick="previousStepConfig()"/>
    <input type="image" src="../pictures/common/action_button/next.png" height="20" onclick="nextStepConfig()"/>
    `;
  }

  htmlBOString += `
    <img src="../pictures/common/action_button/start_stop_active.png" height="20"> <img
          src="../pictures/common/action_button/timer_0.png" height="20">
          <img src="../pictures/common/action_button/manual_timer_switch.png"
          height="20">
  </div></nobr>
  `;

  htmlBOString += '<!-- Resources indication --><div>';

  currentStep = dataBO.build_order[stepID];
  resources = currentStep.resources;

  htmlBOString += '<nobr><div class="bo_line bo_line_resources">';

  htmlBOString +=
      '<img src="../pictures/aoe2/resource/Aoe2de_wood.png" height="30" />' +
      resources.wood;

  htmlBOString +=
      '<img src="../pictures/aoe2/resource/Aoe2de_food.png" height="30" />' +
      resources.food;

  htmlBOString +=
      '<img src="../pictures/aoe2/resource/Aoe2de_gold.png" height="30" />' +
      resources.gold;

  htmlBOString +=
      '<img src="../pictures/aoe2/resource/Aoe2de_stone.png" height="30" />' +
      resources.stone;

  htmlBOString +=
      '<img src="../pictures/aoe2/resource/MaleVillDE_alpha.png" height="30" />' +
      currentStep.villager_count;

  let ageImage = 'AgeUnknown.png';

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
      ageImage = 'AgeUnknown.png';
  }

  htmlBOString +=
      '<img src="../pictures/aoe2/age/' + ageImage + '" height="30" />';

  htmlBOString += '<img src="../pictures/common/icon/time.png" height="30" />' +
      currentStep.time;

  htmlBOString += '</div></nobr>';
  htmlBOString +=
      '<!-- Line separating resources from notes --><hr style="width:100%;text-align:left;margin-left:0"></div>';

  htmlBOString += '<!-- Notes of the current BO step -->';

  notes = currentStep.notes;

  for (note of notes) {
    htmlBOString +=
        '<nobr><div class="bo_line bo_line_note bo_line_note_first">';

    const timingFlag = false;

    if (timingFlag) {
      htmlBOString += '<div class="bo_line_note_timing">6:40</div>';
    }

    const splitLine = splitNoteLine(note);
    splitCount = splitLine.length

    if (splitCount > 0) {
      // loop on the line parts
      for (let splitID = 0; splitID < splitCount; splitID++) {
        imagePath = getImagePath(splitLine[splitID]);

        if (imagePath) {
          htmlBOString += '<img src="' + imagePath + '" height="30" />';
        } else {
          htmlBOString += splitLine[splitID];
        }
      }
    }

    htmlBOString += '</div></nobr>';
  }

  return htmlBOString;
}

// Update the overlay content based on the BO design input
function updateDataBO() {
  const BODesingContent = document.getElementById('bo_design').value;

  try {
    dataBO = JSON.parse(BODesingContent);
    stepCount = dataBO.build_order.length;
    stepID = 0;
    limitStepID();
  } catch (e) {
    dataBO = null;
    stepCount = -1;
    stepID = -1;
  }
}

// Initialize the configuration window
function initConfigWindow() {
  document.getElementById('bo_design').innerHTML = getTemplateBO();
  updateBOPanel(false);

  document.getElementById('bo_design')
      .addEventListener('input', function(event) {
        updateDataBO();
        updateBOPanel();
      });
}

// Update the BO panel rendering
function updateBOPanel() {
  document.getElementById('bo_panel').innerHTML = getBOPanelContent(stepID);
}

// Display (and create) the overlay window
function displayOverlay() {
  // Close window if already open
  if (overlayWindow != null) {
    overlayWindow.close();
  }

  // Create window
  overlayWindow = window.open('', '_blank', 'width=400, height=200');

  // Title
  const headContent = '<title>RTS Overlay</title>';

  // Build order initialized for step 0
  const bodyContent = '<div id="bo_panel">' + getBOPanelContent(0) + '</div>';

  // HTML content
  let htmlContent = '<!DOCTYPE html><html lang="en">';
  htmlContent += '<script src="bo_panel.js"></script>';
  htmlContent += '<head><link rel="stylesheet" href="layout.css">' +
      headContent + '</head>';
  htmlContent += '<body id=\"body_overlay\">' + bodyContent + '</body></html>';

  // Update overlay HTML content
  overlayWindow.document.write(htmlContent);

  // After a short time (so that elements can be properly updated), adjust the
  // size of the overlay.
  sleep(SLEEP_TIME).then(() => {
    const boPanelOverlay = overlayWindow.document.getElementById('bo_panel');
    const heightOffset = overlayWindow.outerHeight - overlayWindow.innerHeight;
    const widthOffset = overlayWindow.outerWidth - overlayWindow.innerWidth;

    overlayWindow.resizeTo(
        boPanelOverlay.offsetWidth + widthOffset,
        boPanelOverlay.offsetHeight + heightOffset);
  });
}
