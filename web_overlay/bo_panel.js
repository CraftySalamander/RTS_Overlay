var stepID = 0;
var overlayWindow = null;

function limitValue(value, min, max) {
  return (value <= min) ? min : (value >= max ? max : value);
}

function previousStep() {
  stepID = limitValue(stepID - 1, 0, 2);
  console.log('Previous Step', stepID);
  updateBOPanelMainPage();
}

function nextStep() {
  stepID = limitValue(stepID + 1, 0, 2);
  console.log('Next Step', stepID);
  updateBOPanelMainPage();
}

function getBOPanelContent(idBO) {
  var htmlBOString = `
  <!-- Configuration from within the BO panel -->
  <div class="bo_line bo_line_config">7:08
  <button type="submit" class="bo_panel_button" onclick="previousStep()"><img src="../pictures/common/action_button/previous.png" height="20"></button>
  <button type="submit" class="bo_panel_button" onclick="nextStep()"><img src="../pictures/common/action_button/next.png" height="20"></button>
      <img src="../pictures/common/action_button/start_stop_active.png"
          height="20"> <img
          src="../pictures/common/action_button/timer_0.png" height="20">
          <img src="../pictures/common/action_button/manual_timer_switch.png"
          height="20">
  </div>

  <!-- Resources indication -->
  <div>
      <div class="bo_line bo_line_resources"><img
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
      </div>

      <!-- Line separating resources from notes -->
      <hr style="width:100%;text-align:left;margin-left:0">
  </div>

  <!-- Notes of the current BO step -->
  `;
  //<img src="../pictures/common/icon/time.png" height="30" /> 7:55

  if (idBO >= 0) {
    htmlBOString += `
      <div class="bo_line bo_line_note bo_line_note_first">
      <div class="bo_line_note_timing">6:40</div> Next <img
      src="../pictures/aoe2/resource/MaleVillDE.jpg"
      height="30" />
      seeds
      <img src="../pictures/aoe2/mill/FarmDE.png" height="30" />
      </div>
      `;
  }

  if (idBO >= 1) {
    htmlBOString += `
  <div class="bo_line bo_line_note bo_line_note_middle bo_line_emphasis">
      <div class="bo_line_note_timing">7:55</div> Next 3 to <img
          src="../pictures/aoe2/resource/Aoe2de_wood.png" height="30" />
      (1st <img src="../pictures/aoe2/lumber_camp/Lumber_camp_aoe2de.png"
      height="30" />) | Move 2 from <img
      src="../pictures/aoe2/animal/Sheep_aoe2DE.png" height="30" /> to <img
          src="../pictures/aoe2/mill/FarmDE.png" height="30" />
  </div>
  `;
  }

  if (idBO >= 1) {
    htmlBOString += `
  <div class="bo_line bo_line_note bo_line_note_middle bo_line_emphasis">
      <div class="bo_line_note_timing"></div> Research 23 pop <img
          src="../pictures/aoe2/age/FeudalAgeIconDE.png" height="30" />
      (no loom)
  </div>
  `;
  }

  if (idBO >= 2) {
    htmlBOString += `
  <div class="bo_line bo_line_note bo_line_note_last">
      <div class="bo_line_note_timing">10:05</div> Before<img
          src="../pictures/aoe2/age/FeudalAgeIconDE.png" height="30" /> |
          Build <img src="../pictures/aoe2/barracks/Barracks_aoe2DE.png"
          height="30" />
  </div>
  `;
  }

  return htmlBOString;
}

function updateBOPanelMainPage() {
  document.getElementById('bo_panel').innerHTML = getBOPanelContent(stepID);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function displayOverlay() {
  overlayWindow = window.open('', '_blank', 'width=400, height=200');

  var headContent = '<title>RTS Overlay</title>';
  var bodyContent =
      '<div id="bo_panel">' + getBOPanelContent(stepID) + '</div>';

  var htmlContent = '<!DOCTYPE html><html lang="en">';
  htmlContent += '<script src="bo_panel.js"></script>';
  htmlContent += '<head><link rel="stylesheet" href="layout.css">' +
      headContent + '</head>';
  htmlContent += '<body id=\"panel_body\" style=\"display: inline-block\">' +
      bodyContent + '</body></html>';

  overlayWindow.document.write(htmlContent);

  sleep(100).then(() => {
    document.getElementById('bo_panel');
    var panelWidth = bo_panel.offsetWidth;
    var panelHeight = bo_panel.offsetHeight;
    var heightOffset = overlayWindow.outerHeight - overlayWindow.innerHeight;
    var widthOffset = overlayWindow.outerWidth - overlayWindow.innerWidth;

    // +1 for width offset with Flexbox
    overlayWindow.resizeTo(
        panelWidth + widthOffset + 1, panelHeight + heightOffset);
  });
}
