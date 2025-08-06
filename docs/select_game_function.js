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
    case 'wc3':
      return getResourceLineWC3(currentStep);
    default:
      throw 'Unknown game: ' + gameName;
  }
}

/**
 * Get the code associated to 'getResourceLine'.
 *
 * @returns Requested code as string.
 */
function getResourceLineString(gameName) {
  switch (gameName) {
    case 'aoe2':
      return getResourceLineAoE2.toString();
    case 'aoe4':
      return getResourceLineAoE4.toString();
    case 'aom':
      return getResourceLineAoM.toString();
    case 'sc2':
      return getResourceLineSC2.toString();
    case 'wc3':
      return getResourceLineWC3.toString();
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
    case 'wc3':
      return getImagesWC3();
    default:
      throw 'Unknown game: ' + gameName;
  }
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
    case 'wc3':
      return getInstructionsWC3();
    default:
      throw 'Unknown game: ' + gameName;
  }
}

/**
 * Get the factions with 3 letters shortcut and icon.
 *
 * @returns Dictionary with faction name as key, and its 3 letters + image as value.
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
    case 'wc3':
      return getFactionsWC3();
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
    case 'wc3':
      return getFactionImagesFolderWC3();
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
    case 'wc3':
      return checkValidBuildOrderWC3(nameBOMessage);
    default:
      throw 'Unknown game: ' + gameName;
  }
}

/**
 * Get one step of the build order (template).
 *
 * @param {Array} buildOrderData  Array with the build order step, null for default values.
 * @param {int} copyStepID       ID of the step to copy, -1 for last step.
 *
 * @returns Dictionary with the build order step template.
 */
function getBOStep(buildOrderData, copyStepID = -1) {
  switch (gameName) {
    case 'aoe2':
      return getBOStepAoE2(buildOrderData, copyStepID);
    case 'aoe4':
      return getBOStepAoE4(buildOrderData, copyStepID);
    case 'aom':
      return getBOStepAoM(buildOrderData, copyStepID);
    case 'sc2':
      return getBOStepSC2(buildOrderData, copyStepID);
    case 'wc3':
      return getBOStepWC3(buildOrderData, copyStepID);
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
    case 'wc3':
      return getBOTemplateWC3();
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
 * Check it the functionality to evaluate the time is available (see 'evaluateBOTiming').
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
    case 'wc3':
      openSinglePanelPageWC3();
      break;
    default:
      throw 'Unknown game: ' + gameName;
  }
}

/**
 * Get HTML code for the visual editor sample.
 *
 * @returns HTML code
 */
function getVisualEditor() {
  switch (gameName) {
    case 'aoe2':
      return getVisualEditorAoE2();
    case 'aoe4':
      return getVisualEditorAoE4();
    case 'aom':
      return getVisualEditorAoM();
    case 'sc2':
      return getVisualEditorSC2();
    case 'wc3':
      return getVisualEditorWC3();
    default:
      throw 'Unknown game: ' + gameName;
  }
}
