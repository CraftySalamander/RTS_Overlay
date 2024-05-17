// -- Define parameters -- //

const BO_IMAGE_HEIGHT = 30;  // Height of the images in the Build Order (BO).
const ACTION_BUTTON_HEIGHT = 20;  // Height of the action buttons.
const SLEEP_TIME = 100;           // Sleep time to resize the window [ms]
const INTERVAL_CALL_TIME = 1000;  // Time interval between regular calls [ms]

// Image to display when the requested image can not be loaded
const ERROR_IMAGE = '../pictures/common/icon/question_mark.png';


// -- Variables -- //

let gameName = 'aoe2';     // Name of the game (i.e. its picture folder)
let dataBO = null;         // Data of the selected BO
let stepCount = -1;        // Number of steps of the current BO
let stepID = -1;           // ID of the current BO step
let overlayWindow = null;  // Window for the overlay
let imagesGame = {}        // Dictionary with images available for the game.
let imagesCommon = {}  // Dictionary with images available from common folder.


// -- Generic functions -- //

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

  // Check if width/height require a change (no change for 1 unit smaller)
  const widthFlag = (newWidth > currentWidth) || (newWidth < currentWidth - 1);
  const heightFlag =
      (newHeight > currentHeight) || (newHeight < currentHeight - 1);

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
 * Resize the overlay and move it to keep its top right corner
 * at the same position (after a short delay to wait for panel update).
 */
function overlayResizeMoveDelay() {
  sleep(SLEEP_TIME).then(() => {
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
  stepID--;
  limitStepID();
  updateBOPanel(true);
  overlayResizeMoveDelay();
}

/**
 * Move to the next BO step (overlay window).
 */
function nextStepOverlay() {
  stepID++;
  limitStepID();
  updateBOPanel(true);
  overlayResizeMoveDelay();
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
 * @param {string} imageSearch    Image to search, with extension and path
 *                                starting in 'common' or 'game' picture folder.
 *
 * @returns Image with its path, 'null' if not found.
 */
function getImagePath(imageSearch) {
  // Try first with the game folder
  for (const [sub_folder, images] of Object.entries(imagesGame)) {
    for (let image of images) {
      if (imageSearch === sub_folder + '/' + image) {
        return '../pictures/' + gameName + '/' + imageSearch;
      }
    }
  }

  // Try then with the common folder
  for (const [sub_folder, images] of Object.entries(imagesCommon)) {
    for (let image of images) {
      if (imageSearch === sub_folder + '/' + image) {
        return '../pictures/common' +
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
 * @param {*} imagePath       Image to display (with path and extension).
 * @param {*} imageHeight     Height of the image.
 * @param {*} functionName    Name of the function to call when clicking on the
 *                            image, null if no function to call.
 *
 * @returns Requested HTML code.
 */
function getImageHTML(imagePath, imageHeight, functionName = null) {
  // Button with image
  if (functionName) {
    imageHTML = '<input type="image" src="' + imagePath + '"';
    imageHTML += ' onerror="this.src=\'' + ERROR_IMAGE + '\'"';
    imageHTML += ' height="' + imageHeight + '"';
    return imageHTML + ' onclick="' + functionName + '()"/>';
  }
  // Image (no button)
  else {
    imageHTML = '<img src="' + imagePath + '"';
    imageHTML += ' onerror="this.src=\'' + ERROR_IMAGE + '\'"';
    return imageHTML + ' height="' + imageHeight + '">';
  }
}

/**
 * Get the HTML code to add an image for the content of the BO.
 *
 * @param {*} imagePath    Image to display (with path and extension).
 *
 * @returns Requested HTML code.
 */
function getBOImageHTML(imagePath) {
  return getImageHTML(imagePath, BO_IMAGE_HEIGHT);
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
 * @param {int} BOStepID        Requested step ID for the BO.
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
  const commonPicturesFolder = '../pictures/common/';

  // Configuration from within the BO panel
  htmlString += '<nobr><div class="bo_line bo_line_config">';

  const timingFlag = false;  // TODO Implement time function

  // Current step or time
  htmlString +=
      timingFlag ? '0:00' : 'Step: ' + (BOStepID + 1) + '/' + stepCount;

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
  const currentStep = dataBO.build_order[BOStepID];

  htmlString += '<div>';

  htmlString += '<nobr><div class="bo_line bo_line_resources">';

  htmlString += getResourceLine(BOStepID);

  if ('time' in currentStep) {
    htmlString += getBOImageHTML(commonPicturesFolder + 'icon/time.png') +
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
    if (noteID === 0) {
      htmlString += 'bo_line_note_first">';
    } else if (noteID === notesCount - 1) {
      htmlString += 'bo_line_note_last">';
    } else {
      htmlString += 'bo_line_note_middle">';
    }

    // Add timing indication
    if (timingFlag && ('time' in currentStep)) {
      htmlString += '<div class="bo_line_note_timing">' +
          (noteID === 0 ? currentStep.time : '') + '</div>';
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
          htmlString += getBOImageHTML(imagePath);
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
  // Get the images available
  imagesGame = getImagesGame();
  imagesCommon = getImagesCommon();

  // Initialize the BO panel
  document.getElementById('bo_design').innerHTML = getTemplateBO();
  updateDataBO();
  updateBOPanel(false);

  // Updating the variables when changing the game
  document.getElementById('select_game')
      .addEventListener('input', function(event) {
        gameName = document.getElementById('select_game').value;

        imagesGame = getImagesGame();

        document.getElementById('bo_design').innerHTML = getTemplateBO();
        updateDataBO();
        updateBOPanel(false);
      });

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
 * Initialize the overlay window.
 */
function initOverlayWindow() {
  // First overaly resize
  overlayResizeMoveDelay();

  // Check for correct size on a timer
  setInterval(overlayResizeMove, INTERVAL_CALL_TIME);
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
  htmlContent += '\nconst INTERVAL_CALL_TIME = ' + INTERVAL_CALL_TIME + ';';
  htmlContent += '\nconst ERROR_IMAGE = "' + ERROR_IMAGE + '";';

  htmlContent += '\nconst gameName = \'' + gameName + '\';';
  htmlContent +=
      '\nconst dataBO = ' + (validBO ? JSON.stringify(dataBO) : 'null') + ';';
  htmlContent += '\nconst stepCount = ' + (validBO ? stepCount : -1) + ';';
  htmlContent += '\nlet stepID = ' + (validBO ? 0 : -1) + ';';
  htmlContent += '\nconst imagesGame = ' + JSON.stringify(imagesGame) + ';';
  htmlContent += '\nconst imagesCommon = ' + JSON.stringify(imagesCommon) + ';';
  htmlContent += '\ninitOverlayWindow();';

  // Generic functions
  htmlContent += '\n' + sleep.toString();
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
  htmlContent += '\n' + checkValidBO.toString();
  htmlContent += '\n' + getBOPanelContent.toString();
  htmlContent += '\n' + updateBOPanel.toString();
  htmlContent += '\n' + getResourceString.toString();
  htmlContent += '\n' + getResourceLine.toString();
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

/**
 * Get the string for a resource.
 *
 * @param {int} resource    Resource to show.
 *
 * @returns Resource value or ' ' if negative.
 */
function getResourceString(resource) {
  return (resource >= 0) ? resource.toString() : ' ';
}

/**
 * Get the main HTML content of the resource line (excluding timing).
 *
 * @param {int} BOStepID     Requested step ID for the BO.
 *
 * @returns HTML code corresponding to the requested line.
 */
function getResourceLine(BOStepID) {
  switch (gameName) {
    case 'aoe2':
      return getResourceLineAoE2(BOStepID);

    case 'aoe4':
      return getResourceLineAoE4(BOStepID);

    case 'sc2':
      return getResourceLineSC2(BOStepID);

    default:
      throw 'Unknown game: ' + gameName;
  }
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
        'house.png#mouse.png#question_mark.png#salamander_sword_shield.png#time.png',
    'national_flag':
        'ad.png#ae.png#af.png#ag.png#ai.png#al.png#am.png#ao.png#aq.png#ar.png#as.png#at.png#au.png#aw.png#ax.png#az.png#ba.png#bb.png#bd.png#be.png#bf.png#bg.png#bh.png#bi.png#bj.png#bl.png#bm.png#bn.png#bo.png#bq.png#br.png#bs.png#bt.png#bv.png#bw.png#by.png#bz.png#ca.png#cc.png#cd.png#cf.png#cg.png#ch.png#ci.png#ck.png#cl.png#cm.png#cn.png#co.png#cr.png#cu.png#cv.png#cw.png#cx.png#cy.png#cz.png#de.png#dj.png#dk.png#dm.png#do.png#dz.png#ec.png#ee.png#eg.png#eh.png#er.png#es.png#et.png#fi.png#fj.png#fk.png#fm.png#fo.png#fr.png#ga.png#gb-eng.png#gb-nir.png#gb-sct.png#gb-wls.png#gb.png#gd.png#ge.png#gf.png#gg.png#gh.png#gi.png#gl.png#gm.png#gn.png#gp.png#gq.png#gr.png#gs.png#gt.png#gu.png#gw.png#gy.png#hk.png#hm.png#hn.png#hr.png#ht.png#hu.png#id.png#ie.png#il.png#im.png#in.png#io.png#iq.png#ir.png#is.png#it.png#je.png#jm.png#jo.png#jp.png#ke.png#kg.png#kh.png#ki.png#km.png#kn.png#kp.png#kr.png#kw.png#ky.png#kz.png#la.png#lb.png#lc.png#li.png#lk.png#lr.png#ls.png#lt.png#lu.png#lv.png#ly.png#ma.png#mc.png#md.png#me.png#mf.png#mg.png#mh.png#mk.png#ml.png#mm.png#mn.png#mo.png#mp.png#mq.png#mr.png#ms.png#mt.png#mu.png#mv.png#mw.png#mx.png#my.png#mz.png#na.png#nc.png#ne.png#nf.png#ng.png#ni.png#nl.png#no.png#np.png#nr.png#nu.png#nz.png#om.png#pa.png#pe.png#pf.png#pg.png#ph.png#pk.png#pl.png#pm.png#pn.png#pr.png#ps.png#pt.png#pw.png#py.png#qa.png#re.png#ro.png#rs.png#ru.png#rw.png#sa.png#sb.png#sc.png#sd.png#se.png#sg.png#sh.png#si.png#sj.png#sk.png#sl.png#sm.png#sn.png#so.png#sr.png#ss.png#st.png#sv.png#sx.png#sy.png#sz.png#tc.png#td.png#tf.png#tg.png#th.png#tj.png#tk.png#tl.png#tm.png#tn.png#to.png#tr.png#tt.png#tv.png#tw.png#tz.png#ua.png#ug.png#um.png#unknown.png#us.png#uy.png#uz.png#va.png#vc.png#ve.png#vg.png#vi.png#vn.png#vu.png#wf.png#ws.png#xk.png#ye.png#yt.png#za.png#zm.png#zw.png'
  };

  // Split each string (e.g. 'image_0#image_1#image_2') in a list of images.
  for (const [key, value] of Object.entries(imagesDict)) {
    imagesDict[key] = value.split('#');
  }

  return imagesDict;
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
 * Get the template BO for the currently selected game.
 *
 * @returns Requested template BO.
 */
function getTemplateBO() {
  switch (gameName) {
    case 'aoe2':
      return getTemplateBOAoE2();

    case 'aoe4':
      return getTemplateBOAoE4();

    case 'sc2':
      return getTemplateBOSC2();

    default:
      throw 'Unknown game: ' + gameName;
  }
}


// -- Age of Empires II (AoE2) -- //

/**
 * Get the main HTML content of the resource line (excluding timing) for AoE2.
 *
 * @param {int} BOStepID     Requested step ID for the BO.
 *
 * @returns HTML code corresponding to the requested line.
 */
function getResourceLineAoE2(BOStepID) {
  let htmlString = '';

  // Folders with requested pictures
  const gamePicturesFolder = '../pictures/' + gameName + '/';
  const resourceFolder = gamePicturesFolder + 'resource/';

  const currentStep = dataBO.build_order[BOStepID];
  const resources = currentStep.resources;

  htmlString += getBOImageHTML(resourceFolder + 'Aoe2de_wood.png') +
      getResourceString(resources.wood);

  htmlString += getBOImageHTML(resourceFolder + 'Aoe2de_food.png') +
      getResourceString(resources.food);

  htmlString += getBOImageHTML(resourceFolder + 'Aoe2de_gold.png') +
      getResourceString(resources.gold);

  htmlString += getBOImageHTML(resourceFolder + 'Aoe2de_stone.png') +
      getResourceString(resources.stone);

  if (('builder' in resources) && (resources.builder >= 0)) {
    htmlString += getBOImageHTML(resourceFolder + 'Aoe2de_hammer.png') +
        getResourceString(resources.builder);
  }

  if (resources.villager_count >= 0) {
    htmlString += getBOImageHTML(resourceFolder + 'MaleVillDE_alpha.png') +
        getResourceString(resources.villager_count);
  }


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
    htmlString += getBOImageHTML(gamePicturesFolder + 'age/' + ageImage);
  }

  return htmlString;
}

/**
 * Get the images available for AoE2, sorted by sub-folder.
 *
 * @returns Dictionary with all the images per sub-folder.
 */
function getImagesAoE2() {
  // This is obtained using the 'utilities/list_images.py' script.
  let
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


// -- Age of Empires IV (AoE4) -- //

/**
 * Get the main HTML content of the resource line (excluding timing) for AoE4.
 *
 * @param {int} BOStepID     Requested step ID for the BO.
 *
 * @returns HTML code corresponding to the requested line.
 */
function getResourceLineAoE4(BOStepID) {
  let htmlString = '';

  // Folders with requested pictures
  const gamePicturesFolder = '../pictures/' + gameName + '/';
  const resourceFolder = gamePicturesFolder + 'resource/';

  const currentStep = dataBO.build_order[BOStepID];
  const resources = currentStep.resources;

  htmlString += getBOImageHTML(resourceFolder + 'resource_food.png') +
      getResourceString(resources.food);

  htmlString += getBOImageHTML(resourceFolder + 'resource_wood.png') +
      getResourceString(resources.wood);

  htmlString += getBOImageHTML(resourceFolder + 'resource_gold.png') +
      getResourceString(resources.gold);

  htmlString += getBOImageHTML(resourceFolder + 'resource_stone.png') +
      getResourceString(resources.stone);

  if (('builder' in resources) && (resources.builder >= 0)) {
    htmlString += getBOImageHTML(resourceFolder + 'repair.png') +
        getResourceString(resources.builder);
  }

  if (resources.villager_count >= 0) {
    htmlString +=
        getBOImageHTML(gamePicturesFolder + 'unit_worker/villager.png') +
        getResourceString(resources.villager_count);
  }

  if (resources.population_count >= 0) {
    htmlString +=
        getBOImageHTML(gamePicturesFolder + 'building_economy/house.png') +
        getResourceString(resources.population_count);
  }

  // Age image
  let ageImage = null;

  switch (currentStep.age) {
    case 1:
      ageImage = 'age_1.png';
      break;
    case 2:
      ageImage = 'age_2.png';
      break;
    case 3:
      ageImage = 'age_3.png';
      break;
    case 4:
      ageImage = 'age_4.png';
      break;
    default:
      ageImage = null;
  }

  if (ageImage) {
    htmlString += getBOImageHTML(gamePicturesFolder + 'age/' + ageImage);
  }

  return htmlString;
}

/**
 * Get the images available for AoE4, sorted by sub-folder.
 *
 * @returns Dictionary with all the images per sub-folder.
 */
function getImagesAoE4() {
  // This is obtained using the 'utilities/list_images.py' script.
  let imagesDict = {
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


// -- StarCraft II (SC2) -- //

/**
 * Get the main HTML content of the resource line (excluding timing) for SC2.
 *
 * @param {int} BOStepID     Requested step ID for the BO.
 *
 * @returns HTML code corresponding to the requested line.
 */
function getResourceLineSC2(BOStepID) {
  let htmlString = '';

  const currentStep = dataBO.build_order[BOStepID];

  // Folders with requested pictures
  const commonPicturesFolder = '../pictures/common/';
  const gamePicturesFolder = '../pictures/' + gameName + '/';
  const resourceFolder = gamePicturesFolder + 'resource/';

  if (('minerals' in currentStep) && (currentStep.minerals >= 0)) {
    htmlString += getBOImageHTML(resourceFolder + 'minerals.png') +
        getResourceString(currentStep.minerals);
  }

  if (('vespene_gas' in currentStep) && (currentStep.vespene_gas >= 0)) {
    htmlString += getBOImageHTML(resourceFolder + 'vespene_gas.png') +
        getResourceString(currentStep.vespene_gas);
  }

  if (('supply' in currentStep) && (currentStep.supply >= 0)) {
    htmlString += getBOImageHTML(commonPicturesFolder + 'icon/house.png') +
        getResourceString(currentStep.supply);
  }

  return htmlString;
}

/**
 * Get the images available for SC2, sorted by sub-folder.
 *
 * @returns Dictionary with all the images per sub-folder.
 */
function getImagesSC2() {
  // This is obtained using the 'utilities/list_images.py' script.
  let
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


// -- Temporary -- //

/**
 * Get a basic template to work on a valid BO for AoE2.
 *
 * @returns Requested BO.
 */
function getTemplateBOAoE2() {
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
 * Get a basic template to work on a valid BO for AoE4.
 *
 * @returns Requested BO.
 */
function getTemplateBOAoE4() {
  return `
  {
    "civilization": "Ottomans",
    "name": "OTT 2 TC",
    "author": "BeastyQt",
    "source": "https://youtu.be/GR1YprGU1go",
    "season": 6,
    "build_order": [
        {
            "population_count": -1,
            "villager_count": 9,
            "age": 1,
            "resources": {
                "food": 9,
                "wood": 0,
                "gold": 0,
                "stone": 0
            },
            "notes": [
                "5 @unit_worker/villager-ottomans.png@ on @resource/resource_stone.png@, then @resource/gaiatreeprototypetree.png@ (no @building_economy/mining-camp.png@, no @building_economy/lumber-camp.png@, single trip)",
                "All other @unit_worker/villager-ottomans.png@ on @resource/sheep.png@ (5 first too after @resource/resource_stone.png@ & @resource/resource_wood.png@)",
                "Build @building_ottomans/military-school-1.png@ with 2 @unit_worker/villager-ottomans.png@ from @resource/sheep.png@ (except >< @civilization_flag/CivIcon-EnglishAoE4_spacing.png@)"
            ],
            "time": "1:00"
        },
        {
            "population_count": -1,
            "villager_count": 12,
            "age": 1,
            "resources": {
                "food": 9,
                "wood": 0,
                "gold": 3,
                "stone": 0
            },
            "notes": [
                "Next 3 @unit_worker/villager-ottomans.png@ on @resource/resource_gold.png@ | Build 1 @building_economy/house.png@ | Harass with @unit_infantry/spearman-1.png@"
            ],
            "time": "2:00"
        },
        {
            "population_count": -1,
            "villager_count": 14,
            "age": 1,
            "resources": {
                "food": 11,
                "wood": 0,
                "gold": 3,
                "stone": 0
            },
            "notes": [
                "Next 2 @unit_worker/villager-ottomans.png@ to @resource/sheep.png@"
            ],
            "time": "2:40"
        },
        {
            "population_count": -1,
            "villager_count": 17,
            "age": 1,
            "resources": {
                "food": 4,
                "wood": 9,
                "gold": 0,
                "stone": 0,
                "builder": 4
            },
            "notes": [
                "Move 3 from @resource/resource_gold.png@ (> 200) to @resource/gaiatreeprototypetree.png@ | Build @landmark_ottomans/twin-minaret-medrese-1.png@ (+@building_economy/house.png@) with 4 @unit_worker/villager-ottomans.png@",
                "Keep 4 on @resource/sheep.png@ | All other @unit_worker/villager-ottomans.png@ to @resource/gaiatreeprototypetree.png@/@resource/resource_wood.png@ (@building_economy/lumber-camp.png@ when possible)"
            ],
            "time": "3:40"
        },
        {
            "population_count": -1,
            "villager_count": 19,
            "age": 1,
            "resources": {
                "food": 4,
                "wood": 5,
                "gold": 0,
                "stone": 6,
                "builder": 4
            },
            "notes": [
                "Keep 5 on @resource/resource_wood.png@, add new @unit_worker/villager-ottomans.png@ (+4 from @resource/resource_wood.png@) to @resource/resource_stone.png@ (up to 6)"
            ],
            "time": "4:20"
        },
        {
            "population_count": -1,
            "villager_count": 21,
            "age": 2,
            "resources": {
                "food": 5,
                "wood": 10,
                "gold": 0,
                "stone": 6
            },
            "notes": [
                "5 @unit_worker/villager-ottomans.png@ on @resource/berrybush.png@ from @landmark_ottomans/twin-minaret-medrese-1.png@ (in @age/age_2.png@) | Others to @resource/resource_wood.png@ | @building_ottomans/military-school-1.png@ on @unit_ottomans/sipahi-2.png@"
            ],
            "time": "5:00"
        },
        {
            "population_count": -1,
            "villager_count": 24,
            "age": 2,
            "resources": {
                "food": 5,
                "wood": 2,
                "gold": 0,
                "stone": 9,
                "builder": 8
            },
            "notes": [
                "Add 3 to @resource/resource_stone.png@ | Build 2nd @building_economy/town-center.png@ (on @resource/resource_gold.png@) with 8 @unit_worker/villager-ottomans.png@ from @resource/resource_wood.png@"
            ],
            "time": "6:00"
        },
        {
            "population_count": -1,
            "villager_count": 28,
            "age": 2,
            "resources": {
                "food": 11,
                "wood": 9,
                "gold": 8,
                "stone": 0
            },
            "notes": [
                "Next @unit_worker/villager-ottomans.png@ on @resource/resource_wood.png@ | Get @technology_ottomans/anatolian-hills-1.png@ | Build @building_military/barracks.png@ (@unit_infantry/spearman-1.png@) >< @unit_cavalry/knight-2.png@ civs",
                "@building_economy/town-center.png@ builders to @resource/resource_gold.png@ | At 300 @resource/resource_stone.png@, move @unit_worker/villager-ottomans.png@ on @resource/resource_food.png@/@resource/resource_wood.png@"
            ],
            "time": "7:20"
        },
        {
            "population_count": -1,
            "villager_count": 36,
            "age": 2,
            "resources": {
                "food": 16,
                "wood": 7,
                "gold": 13,
                "stone": 0
            },
            "notes": [
                "Add @building_ottomans/military-school-1.png@, then @building_technology/blacksmith.png@, then @building_ottomans/military-school-1.png@ | Research @technology_economy/double-broadaxe.png@, @technology_economy/horticulture.png@, @technology_economy/specialized-pick.png@, @technology_economy/wheelbarrow.png@..."
            ],
            "time": "10:00"
        }
    ]
}
  `;
}

/**
 * Get a basic template to work on a valid BO for SC2.
 *
 * @returns Requested BO.
 */
function getTemplateBOSC2() {
  return `
  {
    "race": "Zerg",
    "opponent_race": "Any",
    "name": "HuShang's Beginner Zerg (Timing Attack)",
    "patch": "4.11.0",
    "author": "hushang",
    "source": "https://lotv.spawningtool.com/build/163886/",
    "build_order": [
        {
            "supply": 13,
            "time": "0:12",
            "notes": [
                "@zerg_units/Overlord.png@"
            ]
        },
        {
            "supply": 16,
            "time": "0:48",
            "notes": [
                "@zerg_buildings/Hatchery.png@"
            ]
        },
        {
            "supply": 18,
            "time": "1:10",
            "notes": [
                "@zerg_buildings/Extractor.png@"
            ]
        },
        {
            "supply": 17,
            "time": "1:14",
            "notes": [
                "@zerg_buildings/Spawning_Pool.png@"
            ]
        },
        {
            "supply": 20,
            "time": "1:53",
            "notes": [
                "@zerg_units/Overlord.png@"
            ]
        },
        {
            "supply": 20,
            "time": "2:01",
            "notes": [
                "@zerg_units/Queen.png@ x2"
            ]
        },
        {
            "supply": 20,
            "time": "2:02",
            "notes": [
                "@zerg_units/Zergling.png@ x4"
            ]
        },
        {
            "supply": 32,
            "time": "2:43",
            "notes": [
                "@zerg_units/Overlord.png@"
            ]
        },
        {
            "supply": 32,
            "time": "2:48",
            "notes": [
                "@zerg_buildings/Lair.png@"
            ]
        },
        {
            "supply": 36,
            "time": "3:06",
            "notes": [
                "@zerg_units/Overlord.png@"
            ]
        },
        {
            "supply": 42,
            "time": "3:14",
            "notes": [
                "@zerg_buildings/Extractor.png@ x2"
            ]
        },
        {
            "supply": 42,
            "time": "3:16",
            "notes": [
                "@zerg_buildings/Spore_Crawler.png@"
            ]
        },
        {
            "supply": 42,
            "time": "3:18",
            "notes": [
                "@zerg_buildings/Roach_Warren.png@"
            ]
        },
        {
            "supply": 38,
            "time": "3:26",
            "notes": [
                "@zerg_buildings/Spore_Crawler.png@"
            ]
        },
        {
            "supply": 47,
            "time": "3:54",
            "notes": [
                "@zerg_units/Overlord.png@"
            ]
        },
        {
            "supply": 48,
            "time": "3:55",
            "notes": [
                "@zerg_buildings/Hatchery.png@"
            ]
        },
        {
            "supply": 48,
            "time": "4:00",
            "notes": [
                "@zerg_techs/Glial_reconstitution.png@"
            ]
        },
        {
            "supply": 47,
            "time": "4:15",
            "notes": [
                "@zerg_units/Roach.png@ x7"
            ]
        },
        {
            "supply": 59,
            "time": "4:21",
            "notes": [
                "@zerg_units/Roach.png@"
            ]
        },
        {
            "supply": 59,
            "time": "4:22",
            "notes": [
                "@zerg_units/Overseer.png@"
            ]
        },
        {
            "supply": 63,
            "time": "4:46",
            "notes": [
                "@zerg_units/Roach.png@ x2"
            ]
        }
    ]
}
  `;
}
