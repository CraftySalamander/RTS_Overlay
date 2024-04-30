// Configuration parameters
const SLEEP_TIME = 100

// Variables
var stepID = 0;
var overlayWindow = null;

// Limit a value in the [min ; max] range
function limitValue(value, min, max) {
  return (value <= min) ? min : (value >= max ? max : value);
}

// Sleep for a few ms
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Resize the overlay and move it to keep its top right corner at the same
// position.
function overlayResizeMove() {
  // Save upper right corner position
  var upperRightX = window.screenLeft + window.outerWidth;
  var upperRightY = window.screenTop;

  // Resize and move the overlay after a short time (wait for panel update)
  sleep(SLEEP_TIME).then(() => {
    var boPanelOverlay = document.getElementById('bo_panel');
    var panelWidth = boPanelOverlay.offsetWidth;
    var panelHeight = boPanelOverlay.offsetHeight;
    var heightOffset = window.outerHeight - window.innerHeight;
    var widthOffset = window.outerWidth - window.innerWidth;
    var newWidth = panelWidth + widthOffset;

    // Resize the panel
    window.resizeTo(newWidth, panelHeight + heightOffset);

    // Move the panel (keeping upper right corner at same position as before)
    window.moveTo(upperRightX - newWidth, upperRightY);
  });
}

// Previous BO step (Configuration window)
function previousStepConfig() {
  stepID = limitValue(stepID - 1, 0, 2);
  updateBOPanel(false);
}

// Next BO step (Configuration window)
function nextStepConfig() {
  stepID = limitValue(stepID + 1, 0, 2);
  updateBOPanel(false);
}

// Previous BO step (Overlay window)
function previousStepOverlay() {
  stepID = limitValue(stepID - 1, 0, 2);
  updateBOPanel(true);
  overlayResizeMove();
}

// Next BO step (Overlay window)
function nextStepOverlay() {
  stepID = limitValue(stepID + 1, 0, 2);
  updateBOPanel(true);
  overlayResizeMove();
}

// Get the HTML content of the BO
function getBOPanelContent(overlayFlag, idBO) {
  var htmlBOString = `
  <!-- Configuration from within the BO panel -->
  <nobr><div class="bo_line bo_line_config">7:08
  `;

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

  htmlBOString += `
  <!-- Resources indication -->
  <div>
      <nobr><div class="bo_line bo_line_resources"><img
      src="../pictures/aoe2/resource/Aoe2de_wood.png"
              height="30" /> 7
          <img src="../pictures/aoe2/resource/Aoe2de_food.png" height="30" />
          15 <img
              src="../pictures/aoe2/resource/Aoe2de_gold.png" height="30" />
              0 <img src="../pictures/aoe2/resource/Aoe2de_stone.png"
              height="30" /> 0 <img
              src="../pictures/aoe2/resource/MaleVillDE_alpha.png"
              height="30" /> 22 <img
              src="../pictures/aoe2/age/DarkAgeIconDE_alpha.png" height="30"/>   
              <img src="../pictures/common/icon/time.png" height="30" /> 7:55
      </div></nobr>

      <!-- Line separating resources from notes -->
      <hr style="width:100%;text-align:left;margin-left:0">
  </div>

  <!-- Notes of the current BO step -->
  `;

  if (idBO >= 0) {
    htmlBOString += `
      <nobr><div class="bo_line bo_line_note bo_line_note_first">
      <div class="bo_line_note_timing">6:40</div> Next <img
      src="../pictures/aoe2/resource/MaleVillDE.jpg"
      height="30" />
      seeds
      <img src="../pictures/aoe2/mill/FarmDE.png" height="30" />
      </div></nobr>
      `;
  }

  if (idBO >= 1) {
    htmlBOString += `
    <nobr><div class="bo_line bo_line_note bo_line_note_middle bo_line_emphasis">
      <div class="bo_line_note_timing">7:55</div> Next 3 to <img
          src="../pictures/aoe2/resource/Aoe2de_wood.png" height="30" />
      (1st <img src="../pictures/aoe2/lumber_camp/Lumber_camp_aoe2de.png"
      height="30" />) | Move 2 from <img
      src="../pictures/aoe2/animal/Sheep_aoe2DE.png" height="30" /> to <img
          src="../pictures/aoe2/mill/FarmDE.png" height="30" />
  </div></nobr>
  `;
  }

  if (idBO >= 1) {
    htmlBOString += `
    <nobr><div class="bo_line bo_line_note bo_line_note_middle bo_line_emphasis">
      <div class="bo_line_note_timing"></div> Research 23 pop <img
          src="../pictures/aoe2/age/FeudalAgeIconDE.png" height="30" />
      (no loom)
  </div></nobr>
  `;
  }

  if (idBO >= 2) {
    htmlBOString += `
    <nobr><div class="bo_line bo_line_note bo_line_note_last">
      <div class="bo_line_note_timing">10:05</div> Before<img
          src="../pictures/aoe2/age/FeudalAgeIconDE.png" height="30" /> |
          Build <img src="../pictures/aoe2/barracks/Barracks_aoe2DE.png"
          height="30" />
  </div></nobr>
  `;
  }

  return htmlBOString;
}

// Update the BO panel rendering
function updateBOPanel(overlayFlag) {
  document.getElementById('bo_panel').innerHTML =
      getBOPanelContent(overlayFlag, stepID);
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
  var headContent = '<title>RTS Overlay</title>';

  // Build order initialized for step 0
  var bodyContent =
      '<div id="bo_panel">' + getBOPanelContent(true, 0) + '</div>';

  // HTML content
  var htmlContent = '<!DOCTYPE html><html lang="en">';
  htmlContent += '<script src="bo_panel.js"></script>';
  htmlContent += '<head><link rel="stylesheet" href="layout.css">' +
      headContent + '</head>';
  htmlContent += '<body id=\"body_overlay\">' + bodyContent + '</body></html>';

  // Update overlay HTML content
  overlayWindow.document.write(htmlContent);

  // After a short time (so that elements can be properly updated), adjust the
  // size of the overlay.
  sleep(SLEEP_TIME).then(() => {
    var boPanelOverlay = overlayWindow.document.getElementById('bo_panel');
    var panelWidth = boPanelOverlay.offsetWidth;
    var panelHeight = boPanelOverlay.offsetHeight;
    var heightOffset = overlayWindow.outerHeight - overlayWindow.innerHeight;
    var widthOffset = overlayWindow.outerWidth - overlayWindow.innerWidth;

    overlayWindow.resizeTo(
        panelWidth + widthOffset, panelHeight + heightOffset);
  });
}
