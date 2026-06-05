const startScreen = document.getElementById("startScreen");
const gameScreen = document.getElementById("gameScreen");
const endScreen = document.getElementById("endScreen");
const startBtn = document.getElementById("startBtn");
const menuBtn = document.getElementById("menuBtn");
const settingsBtn = document.getElementById("settingsBtn");
const startSettingsBtn = document.getElementById("startSettingsBtn");
const counter = document.getElementById("counter");
const hintTitle = document.getElementById("hintTitle");
const hintText = document.getElementById("hintText");
const puzzleModal = document.getElementById("puzzleModal");
const closeBtn = document.getElementById("closeBtn");
const puzzleType = document.getElementById("puzzleType");
const puzzleTitle = document.getElementById("puzzleTitle");
const puzzleText = document.getElementById("puzzleText");
const preview = document.getElementById("preview");
const solveBtn = document.getElementById("solveBtn");
const memoryModal = document.getElementById("memoryModal");
const memoryTitle = document.getElementById("memoryTitle");
const memoryText = document.getElementById("memoryText");
const continueBtn = document.getElementById("continueBtn");
const pathArrow = document.getElementById("pathArrow");
const settingsModal = document.getElementById("settingsModal");
const closeSettingsBtn = document.getElementById("closeSettingsBtn");
const qualityButtons = document.querySelectorAll(".quality-btn");
const timerToggle = document.getElementById("timerToggle");
const finalTime = document.getElementById("finalTime");

const memoryVideos = {
  one: document.getElementById("memoryVideoOne"),
  two: document.getElementById("memoryVideoTwo"),
  three: document.getElementById("memoryVideoThree")
};

let currentStage = 0;
let activePuzzle = null;
let timerEnabled = false;
let timerStartTime = null;
let timerEndTime = null;
let treeQuality = "normal";

const solved = { one: false, two: false, three: false };
const WALK_DURATION = 9000;

function refreshAframeScene() {
  const scene = document.getElementById("jungleScene");
  if (!scene) return;

  // Browser resize triggeren
  window.dispatchEvent(new Event("resize"));

  // A-Frame renderer expliciet opnieuw laten meten
  if (scene.renderer) {
    scene.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  if (scene.camera) {
    scene.camera.aspect = window.innerWidth / window.innerHeight;
    scene.camera.updateProjectionMatrix();
  }
}

const treeQualitySettings = {
  none: {
    label: "Super laag",
    rows: 0,
    treesPerRow: 0
  },
  low: {
    label: "Low",
    rows: 25,
    treesPerRow: 20
  },
  normal: {
    label: "Normal",
    rows: 30,
    treesPerRow: 45
  },
  high: {
    label: "High",
    rows: 35,
    treesPerRow: 50
  },
  ultra: {
    label: "Super mooi",
    rows: 60,
    treesPerRow: 85
  }
};

const pathStages = [
  { cameraPosition: "0 1.7 8", title: "Jungle path", text: "Je staat op het pad. Klik op Puzzle 1 om het eerste memory fragment vrij te spelen." },
  { cameraPosition: "0 1.7 -18", title: "Verder op het pad", text: "Je bent verder het pad op gelopen. Klik op Puzzle 2." },
  { cameraPosition: "0 1.7 -45", title: "Dieper in de jungle", text: "Je bent dieper in de jungle. Klik op Puzzle 3." },
  { cameraPosition: "0 1.7 -72", title: "Einde van het pad", text: "Alle memories zijn gevonden. Klik op de pijl om af te sluiten." }
];

const puzzleData = {
  one: { stage: 0, type: "Jigsaw puzzle", title: "Solve the puzzle", text: "Herstel het eerste fragment. Daarna wordt de pijl op het pad vrijgespeeld.", memoryTitle: "Memory 1 unlocked", memoryText: "Het eerste fragment is gevonden. De route vooruit wordt zichtbaar.", videoStart: 0, videoEnd: 25 },
  two: { stage: 1, type: "Maze puzzle", title: "Find the path", text: "Los het doolhof op. Deze puzzel past bij het idee dat de gebruiker de route door de jungle ontdekt.", memoryTitle: "Memory 2 unlocked", memoryText: "Het tweede fragment opent een langer stuk van hetzelfde junglepad.", videoStart: 0, videoEnd: 8 },
  three: { stage: 2, type: "Spot the difference", title: "Find the difference", text: "Zoek de verschillen om het laatste memory fragment vrij te spelen.", memoryTitle: "Memory 3 unlocked", memoryText: "Alle memories zijn gevonden. Het laatste stuk van het pad is nu open.", videoStart: 0, videoEnd: 8 }
};

function show(screen) {
  if (!screen) return;
  [startScreen, gameScreen, endScreen].forEach(item => item?.classList.remove("active"));
  screen.classList.add("active");
}

function setCamera(stage, walking = false) {
  const cameraRig = document.getElementById("cameraRig");
  if (!cameraRig || !stage) return;
  hintTitle.textContent = stage.title;
  hintText.textContent = stage.text;
  if (!walking) {
    cameraRig.removeAttribute("animation__walk");
    cameraRig.setAttribute("position", stage.cameraPosition);
    return;
  }
  cameraRig.removeAttribute("animation__walk");
  cameraRig.setAttribute("animation__walk", `property: position; to: ${stage.cameraPosition}; dur: ${WALK_DURATION}; easing: easeInOutSine`);
}

function setHotspotLocked(id, locked) {
  const hotspot = document.getElementById(id);
  if (!hotspot) return;

  const aura = hotspot.querySelector(".puzzle-aura");
  const particles = hotspot.querySelectorAll(".puzzle-particles a-sphere");

  const unlockedScales = {
    hotspotOne: "1.2 1.2 1.2",
    hotspotTwo: "0.9 0.9 0.9",
    hotspotThree: "1.1 1.1 1.1"
  };

  const lockedScales = {
    hotspotOne: "1.0 1.0 1.0",
    hotspotTwo: "0.75 0.75 0.75",
    hotspotThree: "0.9 0.9 0.9"
  };

  if (locked) {
    hotspot.classList.add("locked");
    hotspot.setAttribute("scale", lockedScales[id] || "0.8 0.8 0.8");

    if (aura) {
      aura.setAttribute(
        "material",
        "color: #ffd84a; transparent: true; opacity: 0.12"
      );
    }

    particles.forEach(particle => {
      particle.setAttribute(
        "material",
        "color: #ffd84a; transparent: true; opacity: 0.08"
      );
    });
  } else {
    hotspot.classList.remove("locked");
    hotspot.setAttribute("scale", unlockedScales[id] || "1 1 1");

    if (aura) {
      aura.setAttribute(
        "material",
        "color: #ffd84a; transparent: true; opacity: 0.35"
      );
    }

    particles.forEach(particle => {
      particle.setAttribute(
        "material",
        "color: #ffd84a; transparent: true; opacity: 0.55"
      );
    });
  }
}

function resetHotspots() {
  setHotspotLocked("hotspotOne", false);
  setHotspotLocked("hotspotTwo", true);
  setHotspotLocked("hotspotThree", true);
}

function reset() {
  currentStage = 0;
  activePuzzle = null;
  solved.one = false;
  solved.two = false;
  solved.three = false;
  resetHotspots();
  if (pathArrow) {
    pathArrow.disabled = true;
    pathArrow.querySelector("small").textContent = "Locked";
  }
  counter.textContent = "0 / 3";
  setCamera(pathStages[0], false);
}

function updateCounter() {
  const count = Object.values(solved).filter(Boolean).length;
  counter.textContent = `${count} / 3`;
}

function openSettings() {
  settingsModal?.classList.remove("hidden");
  updateQualityButtons();
}

function closeSettings() { settingsModal?.classList.add("hidden"); }

function setTreeQuality(quality) {
  if (!treeQualitySettings[quality]) return;
  treeQuality = quality;
  updateQualityButtons();
  if (gameScreen.classList.contains("active")) {
    createForest();
    hintTitle.textContent = "Graphics setting";
    hintText.textContent = `Boomkwaliteit: ${treeQualitySettings[treeQuality].label}`;
  }
}

function updateQualityButtons() {
  qualityButtons.forEach(button => button.classList.toggle("active", button.dataset.quality === treeQuality));
}

function createPathDots() {
  const pathDots = document.getElementById("pathDots");
  if (!pathDots) return;
  pathDots.innerHTML = "";
  for (let i = 0; i < 48; i++) {
    const dot = document.createElement("a-circle");
    dot.setAttribute("radius", "0.16");
    dot.setAttribute("color", "#4d3516");
    dot.setAttribute("rotation", "-90 0 0");
    dot.setAttribute("position", `0 0.065 ${6 - i * 2}`);
    pathDots.appendChild(dot);
  }
}

function setHotspotLocked(id, locked) {
  const hotspot = document.getElementById(id);
  if (!hotspot) return;

  const light = hotspot.querySelector("a-light");

  const unlockedScales = {
    hotspotOne: "2.2 2.2 2.2",   // spear
    hotspotTwo: "0.2 0.2 0.2",   // tea set
    hotspotThree: "0.4 0.4 0.4"  // bananas
  };

  const lockedScales = {
    hotspotOne: "2.2 2.2 2.2",   // spear
    hotspotTwo: "0.1 0.1 0.1",   // tea set
    hotspotThree: "0.2 0.2 0.2"  // bananas
  };

  if (locked) {
    hotspot.classList.add("locked");
    hotspot.setAttribute("scale", lockedScales[id] || "0.8 0.8 0.8");

    if (light) {
      light.setAttribute("intensity", "0.25");
    }
  } else {
    hotspot.classList.remove("locked");
    hotspot.setAttribute("scale", unlockedScales[id] || "1 1 1");

    if (light) {
      light.setAttribute("intensity", "1.8");
    }
  }
}

/* -------------------- A-FRAME PLACEMENT HELPERS -------------------- */

const PATH_HALF_WIDTH = 2.4;

/*
  Grotere afstand omdat GLB-modellen breder zijn dan hun position-point.
  Dus niet alleen het middelpunt moet naast het pad staan,
  het hele model moet visueel naast het pad blijven.
*/
const TREE_MIN_X = 65;
const DETAIL_MIN_X = 10;
const STONE_MIN_X = 10;

function randomSideX(min = 12, max = 32) {
  const side = Math.random() < 0.5 ? -1 : 1;
  const distance = min + Math.random() * (max - min);
  return side * distance;
}

function createForest() {
  const forest = document.getElementById("aframeForest");
  const details = document.getElementById("aframeDetails");

  if (!forest || !details) return;

  forest.innerHTML = "";
  details.innerHTML = "";

  const setting = treeQualitySettings[treeQuality];

  if (!setting || setting.rows === 0) {
    return;
  }

  const treeModels = ["#tree1Model", "#tree2Model", "#tree3Model"];

  const rows = setting.rows;
  const treesPerRow = setting.treesPerRow || 1;

  const startZ = 4;
  const endZ = -82;

  for (let row = 0; row < rows; row++) {
    const progress = row / Math.max(1, rows - 1);
    const zBase = startZ + progress * (endZ - startZ);

    for (let i = 0; i < treesPerRow; i++) {
      const tree = document.createElement("a-entity");

      const model = treeModels[Math.floor(Math.random() * treeModels.length)];

      const x = randomSideX(TREE_MIN_X, 90);
      const z = zBase + (Math.random() - 0.5) * 4.5;

      const scale = 1.15 + Math.random() * 5.75;
      const rotY = Math.floor(Math.random() * 360);

      tree.setAttribute("gltf-model", model);
      tree.setAttribute("position", `${x.toFixed(2)} 0 ${z.toFixed(2)}`);
      tree.setAttribute("rotation", `0 ${rotY} 0`);
      tree.setAttribute(
        "scale",
        `${scale.toFixed(2)} ${scale.toFixed(2)} ${scale.toFixed(2)}`
      );

      forest.appendChild(tree);
    }
  }

  if (treeQuality === "ultra") {
    createAframeGrass(details);
    createAframeStones(details);
  }
}

function createAframeGrass(parent) {
  if (!parent) return;

  const count = 500;

  for (let i = 0; i < count; i++) {
    const grass = document.createElement("a-entity");

    const x = randomSideX(DETAIL_MIN_X, 34);
    const z = 3 - Math.random() * 82;

    const scale = 0.35 + Math.random() * 0.35;
    const rotY = Math.floor(Math.random() * 360);

    grass.setAttribute("gltf-model", "#grassModel");
    grass.setAttribute("position", `${x.toFixed(2)} 0.02 ${z.toFixed(2)}`);
    grass.setAttribute("rotation", `0 ${rotY} 0`);
    grass.setAttribute(
      "scale",
      `${scale.toFixed(2)} ${scale.toFixed(2)} ${scale.toFixed(2)}`
    );

    parent.appendChild(grass);
  }
}

function createAframeStones(parent) {
  if (!parent) return;

  const stoneModels = ["#stoneModel", "#stoneBigModel"];
  const count = 40;

  for (let i = 0; i < count; i++) {
    const stone = document.createElement("a-entity");

    const model = stoneModels[Math.floor(Math.random() * stoneModels.length)];

    const x = randomSideX(STONE_MIN_X, 30);
    const z = -5 - Math.random() * 72;

    const scale = 0.45 + Math.random() * 0.45;
    const rotY = Math.floor(Math.random() * 360);

    stone.setAttribute("gltf-model", model);
    stone.setAttribute("position", `${x.toFixed(2)} 0.02 ${z.toFixed(2)}`);
    stone.setAttribute("rotation", `0 ${rotY} 0`);
    stone.setAttribute(
      "scale",
      `${scale.toFixed(2)} ${scale.toFixed(2)} ${scale.toFixed(2)}`
    );

    parent.appendChild(stone);
  }

  const trunk = document.createElement("a-entity");
  trunk.setAttribute("gltf-model", "#trunkModel");
  trunk.setAttribute("position", "-18 0 -48");
  trunk.setAttribute("rotation", "0 70 0");
  trunk.setAttribute("scale", "1.15 1.15 1.15");
  parent.appendChild(trunk);
}

function createAframeMiniTrees(parent) {
  for (let i = 0; i < 8; i++) {
    const side = Math.random() < 0.5 ? -1 : 1;
    const x = side * (4.5 + Math.random() * 7);
    const z = -8 - Math.random() * 70;
    const scale = 1.1 + Math.random() * 0.7;
    const rotY = Math.floor(Math.random() * 360);
    const mini = document.createElement("a-entity");
    mini.setAttribute("gltf-model", "#miniTreeModel");
    mini.setAttribute("position", `${x.toFixed(2)} 0 ${z.toFixed(2)}`);
    mini.setAttribute("rotation", `0 ${rotY} 0`);
    mini.setAttribute("scale", `${scale.toFixed(2)} ${scale.toFixed(2)} ${scale.toFixed(2)}`);
    parent.appendChild(mini);
  }
}

function createAframeTrunk(parent) {
  const trunk = document.createElement("a-entity");
  trunk.setAttribute("gltf-model", "#trunkModel");
  trunk.setAttribute("position", "-5 0 -48");
  trunk.setAttribute("rotation", "0 70 0");
  trunk.setAttribute("scale", "1.6 1.6 1.6");
  parent.appendChild(trunk);
}

/* -------------------- PUZZLE 1: JIGSAW -------------------- */
let jigsawState = { size: 4, tiles: [], firstSelected: null, imageSrc: "images/puzzle1.jpg", solved: false };
function shuffleArray(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function isJigsawSolved() { return jigsawState.tiles.every((tile, index) => tile.correctIndex === index); }

function renderJigsaw() {
  preview.className = "puzzle-preview";
  preview.innerHTML = `<div class="jigsaw-board" id="jigsawBoard"></div>`;
  const board = document.getElementById("jigsawBoard");
  jigsawState.tiles.forEach((tile, index) => {
    const tileEl = document.createElement("button");
    tileEl.className = "jigsaw-tile";
    tileEl.type = "button";
    const xPercent = (tile.col / (jigsawState.size - 1)) * 100;
    const yPercent = (tile.row / (jigsawState.size - 1)) * 100;
    tileEl.style.backgroundImage = `url(${jigsawState.imageSrc})`;
    tileEl.style.backgroundPosition = `${xPercent}% ${yPercent}%`;
    if (jigsawState.firstSelected === index) tileEl.classList.add("selected");
    if (tile.correctIndex === index) tileEl.classList.add("correct");
    tileEl.addEventListener("click", () => onJigsawTileClick(index));
    board.appendChild(tileEl);
  });
}

function onJigsawTileClick(index) {
  if (jigsawState.solved) return;
  if (jigsawState.firstSelected === null) { jigsawState.firstSelected = index; renderJigsaw(); return; }
  if (jigsawState.firstSelected === index) { jigsawState.firstSelected = null; renderJigsaw(); return; }
  const first = jigsawState.firstSelected;
  [jigsawState.tiles[first], jigsawState.tiles[index]] = [jigsawState.tiles[index], jigsawState.tiles[first]];
  jigsawState.firstSelected = null;
  renderJigsaw();
  if (isJigsawSolved()) {
    jigsawState.solved = true;
    setTimeout(() => solvePuzzle(), 400);
  }
}

function createJigsawPuzzle(imageSrc, size = 4) {
  jigsawState.size = size;
  jigsawState.imageSrc = imageSrc;
  jigsawState.firstSelected = null;
  jigsawState.solved = false;
  const tiles = [];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) tiles.push({ row, col, correctIndex: row * size + col });
  }
  jigsawState.tiles = shuffleArray(tiles);
  while (isJigsawSolved()) jigsawState.tiles = shuffleArray(tiles);
  renderJigsaw();
}

/* -------------------- PUZZLE 2: MAZE -------------------- */
let mazeState = {
  canvas: null, ctx: null, image: null,
  start: { x: 145, y: 192 }, player: { x: 145, y: 192 }, goal: { x: 450, y: 555 },
  playerRadius: 11, active: false, followingMouse: false, solved: false
};
function createMazePuzzle() {
  preview.className = "puzzle-preview";
  preview.innerHTML = `<div class="maze-wrapper"><canvas class="maze-canvas" id="mazeCanvas" width="900" height="675"></canvas><p class="maze-info">Beweeg met je muis over het balletje bij START en volg het pad naar de EXIT.</p></div>`;
  mazeState.canvas = document.getElementById("mazeCanvas");
  mazeState.ctx = mazeState.canvas.getContext("2d", { willReadFrequently: true });
  mazeState.start = { x: 145, y: 192 };
  mazeState.player = { ...mazeState.start };
  mazeState.goal = { x: 450, y: 555 };
  mazeState.active = true;
  mazeState.followingMouse = false;
  mazeState.solved = false;
  mazeState.image = new Image();
  mazeState.image.onload = () => drawMaze();
  mazeState.image.onerror = () => {
    const ctx = mazeState.ctx;
    ctx.fillStyle = "#111"; ctx.fillRect(0, 0, mazeState.canvas.width, mazeState.canvas.height);
    ctx.fillStyle = "white"; ctx.font = "24px Georgia";
    ctx.fillText("Maze image kon niet laden", 40, 80);
    ctx.fillText("Check: images/puzzle2.png", 40, 120);
  };
  mazeState.image.src = "images/puzzle2.png";
  mazeState.canvas.addEventListener("mousemove", handleMazeMouseMove);
  mazeState.canvas.addEventListener("mouseleave", resetMazePlayer);
  mazeState.canvas.addEventListener("click", getMazeClickCoords);
}
function drawMaze() {
  const ctx = mazeState.ctx, canvas = mazeState.canvas;
  if (!mazeState.image || !mazeState.image.complete || mazeState.image.naturalWidth === 0) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(mazeState.image, 0, 0, canvas.width, canvas.height);
  ctx.beginPath(); ctx.arc(mazeState.goal.x, mazeState.goal.y, 15, 0, Math.PI * 2); ctx.fillStyle = "rgba(255, 215, 74, 0.75)"; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = "#111"; ctx.stroke();
  ctx.beginPath(); ctx.arc(mazeState.player.x, mazeState.player.y, mazeState.playerRadius, 0, Math.PI * 2); ctx.fillStyle = "#ffdf4d"; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = "#111"; ctx.stroke();
}
function getCanvasMousePosition(event) {
  const canvas = mazeState.canvas, rect = canvas.getBoundingClientRect();
  return { x: Math.round((event.clientX - rect.left) * (canvas.width / rect.width)), y: Math.round((event.clientY - rect.top) * (canvas.height / rect.height)) };
}
function handleMazeMouseMove(event) {
  if (!mazeState.active || mazeState.solved) return;
  const mouse = getCanvasMousePosition(event);
  const dx = mouse.x - mazeState.player.x, dy = mouse.y - mazeState.player.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (!mazeState.followingMouse) {
    if (distance <= mazeState.playerRadius + 12) mazeState.followingMouse = true;
    else return;
  }
  if (!canMoveTo(mouse.x, mouse.y)) { mazeState.followingMouse = false; drawMaze(); return; }
  mazeState.player.x = mouse.x; mazeState.player.y = mouse.y;
  drawMaze(); checkMazeGoal();
}
function resetMazePlayer() {
  if (!mazeState.active || mazeState.solved) return;
  mazeState.followingMouse = false;
  mazeState.player = { ...mazeState.start };
  drawMaze();
}
function isWalkablePixel(x, y) {
  const ctx = mazeState.ctx, canvas = mazeState.canvas;
  if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return false;
  const pixel = ctx.getImageData(x, y, 1, 1).data;
  const r = pixel[0], g = pixel[1], b = pixel[2];
  const looksLikeSand = r > 85 && g > 55 && b < 155 && r >= g - 55;
  const looksLikeStone = r > 50 && g > 40 && b > 30 && Math.abs(r - g) < 75 && Math.abs(g - b) < 85;
  const isVeryGreen = g > r + 35 && g > b + 35;
  return (looksLikeSand || looksLikeStone) && !isVeryGreen;
}
function canMoveTo(x, y) {
  const checkRadius = mazeState.playerRadius * 0.65;
  const points = [{ x, y }, { x: x + checkRadius, y }, { x: x - checkRadius, y }, { x, y: y + checkRadius }, { x, y: y - checkRadius }];
  return points.every(p => isWalkablePixel(Math.round(p.x), Math.round(p.y)));
}
function checkMazeGoal() {
  const dx = mazeState.player.x - mazeState.goal.x, dy = mazeState.player.y - mazeState.goal.y;
  if (Math.sqrt(dx * dx + dy * dy) < 34) {
    mazeState.solved = true; mazeState.active = false;
    setTimeout(() => solvePuzzle(), 500);
  }
}
function getMazeClickCoords(event) {
  if (!mazeState.canvas || !mazeState.ctx) return;
  const mouse = getCanvasMousePosition(event);
  console.log("Maze click coords:", mouse);
}

/* -------------------- PUZZLE 3: SPOT THE DIFFERENCE -------------------- */
let diffState = {
  leftCanvas: null, rightCanvas: null, leftCtx: null, rightCtx: null,
  originalImage: null, editedImage: null, active: false, solved: false,
  differences: [
    { x: 274, y: 309, radius: 28, found: false },
    { x: 623, y: 170, radius: 28, found: false },
    { x: 488, y: 262, radius: 28, found: false }
  ]
};
function createDifferencePuzzle() {
  preview.className = "puzzle-preview";
  preview.innerHTML = `<div class="diff-wrapper"><div class="diff-images"><div class="diff-panel"><p>Origineel</p><canvas class="diff-canvas" id="diffOriginalCanvas" width="800" height="450"></canvas></div><div class="diff-panel"><p>Aangepast - klik hier</p><canvas class="diff-canvas" id="diffEditedCanvas" width="800" height="450"></canvas></div></div><p class="diff-status" id="diffStatus">Gevonden: 0 / 3</p></div>`;
  diffState.leftCanvas = document.getElementById("diffOriginalCanvas");
  diffState.rightCanvas = document.getElementById("diffEditedCanvas");
  diffState.leftCtx = diffState.leftCanvas.getContext("2d");
  diffState.rightCtx = diffState.rightCanvas.getContext("2d");
  diffState.active = true; diffState.solved = false;
  diffState.differences.forEach(d => d.found = false);
  diffState.originalImage = new Image(); diffState.editedImage = new Image();
  let loadedCount = 0;
  function onImageLoaded() { loadedCount++; if (loadedCount === 2) drawDifferencePuzzle(); }
  diffState.originalImage.onload = onImageLoaded; diffState.editedImage.onload = onImageLoaded;
  diffState.originalImage.onerror = () => console.error("Originele afbeelding kon niet laden: images/puzzle3.jpg");
  diffState.editedImage.onerror = () => console.error("Aangepaste afbeelding kon niet laden: images/puzzle3-1.png");
  diffState.originalImage.src = "images/puzzle3.jpg";
  diffState.editedImage.src = "images/puzzle3-1.png";
  diffState.rightCanvas.addEventListener("click", handleDifferenceClick);
}
function drawDifferencePuzzle() {
  const left = diffState.leftCtx, right = diffState.rightCtx;
  left.clearRect(0, 0, 800, 450); right.clearRect(0, 0, 800, 450);
  left.drawImage(diffState.originalImage, 0, 0, 800, 450);
  right.drawImage(diffState.editedImage, 0, 0, 800, 450);
  diffState.differences.forEach(diff => { if (diff.found) { drawDifferenceMarker(left, diff.x, diff.y); drawDifferenceMarker(right, diff.x, diff.y); } });
  updateDifferenceStatus();
}
function drawDifferenceMarker(ctx, x, y) {
  ctx.beginPath(); ctx.arc(x, y, 24, 0, Math.PI * 2); ctx.lineWidth = 5; ctx.strokeStyle = "#ffd54a"; ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fillStyle = "#ffd54a"; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = "#111"; ctx.stroke();
}
function getDiffCanvasClickPosition(event) {
  const canvas = diffState.rightCanvas, rect = canvas.getBoundingClientRect();
  return { x: Math.round((event.clientX - rect.left) * (canvas.width / rect.width)), y: Math.round((event.clientY - rect.top) * (canvas.height / rect.height)) };
}
function handleDifferenceClick(event) {
  if (!diffState.active || diffState.solved) return;
  const click = getDiffCanvasClickPosition(event);
  const foundDiff = diffState.differences.find(diff => {
    if (diff.found) return false;
    const dx = click.x - diff.x, dy = click.y - diff.y;
    return Math.sqrt(dx * dx + dy * dy) <= diff.radius;
  });
  if (foundDiff) {
    foundDiff.found = true;
    drawDifferencePuzzle();
    if (diffState.differences.every(diff => diff.found)) {
      diffState.solved = true; diffState.active = false;
      setTimeout(() => solvePuzzle(), 600);
    }
    return;
  }
  drawDifferencePuzzle();
  const ctx = diffState.rightCtx;
  ctx.beginPath(); ctx.arc(click.x, click.y, 8, 0, Math.PI * 2); ctx.fillStyle = "red"; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = "white"; ctx.stroke();
  ctx.fillStyle = "white"; ctx.font = "18px Georgia"; ctx.fillText(`x: ${click.x}, y: ${click.y}`, click.x + 12, click.y - 12);
}
function updateDifferenceStatus() {
  const status = document.getElementById("diffStatus");
  if (!status) return;
  status.textContent = `Gevonden: ${diffState.differences.filter(diff => diff.found).length} / ${diffState.differences.length}`;
}

/* -------------------- TIMER -------------------- */
function startTimer() {
  if (!timerEnabled) return;
  timerStartTime = Date.now(); timerEndTime = null;
  if (finalTime) { finalTime.classList.add("hidden"); finalTime.textContent = ""; }
}
function stopTimer() {
  if (!timerEnabled || !timerStartTime) return;
  timerEndTime = Date.now();
  const formattedTime = formatTime(timerEndTime - timerStartTime);
  if (finalTime) { finalTime.textContent = `Jouw tijd: ${formattedTime}`; finalTime.classList.remove("hidden"); }
}
function resetTimer() {
  timerStartTime = null; timerEndTime = null;
  if (finalTime) { finalTime.classList.add("hidden"); finalTime.textContent = ""; }
}
function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/* -------------------- PUZZLE OPEN / SOLVE -------------------- */
function openPuzzle(key) {
  const data = puzzleData[key];
  if (!data) return;
  if (data.stage !== currentStage) return;
  if (solved[key]) return;
  activePuzzle = key;
  puzzleType.textContent = data.type;
  puzzleTitle.textContent = data.title;
  puzzleText.textContent = data.text;
  solveBtn.style.display = "none";
  if (key === "one") createJigsawPuzzle("images/puzzle1.jpg", 4);
  if (key === "two") createMazePuzzle();
  if (key === "three") createDifferencePuzzle();
  puzzleModal.classList.remove("hidden");
}
function closePuzzle() {
  puzzleModal?.classList.add("hidden");
  mazeState.active = false; mazeState.followingMouse = false; diffState.active = false;
}
function solvePuzzle() {
  if (!activePuzzle) return;
  const data = puzzleData[activePuzzle];
  solved[activePuzzle] = true;
  updateCounter(); closePuzzle();
  memoryTitle.textContent = data.memoryTitle;
  memoryText.textContent = data.memoryText;
  memoryModal.classList.remove("hidden");
  playMemoryVideoForPuzzle(activePuzzle, data.videoStart || 0, data.videoEnd || 8);
  if (pathArrow) { pathArrow.disabled = false; pathArrow.querySelector("small").textContent = activePuzzle === "three" ? "Finish" : "Open"; }
  if (activePuzzle === "one") hintText.textContent = "Puzzle 1 is opgelost. Klik op de pijl om naar Puzzle 2 te lopen.";
  if (activePuzzle === "two") hintText.textContent = "Puzzle 2 is opgelost. Klik op de pijl om verder het pad op te lopen.";
  if (activePuzzle === "three") hintText.textContent = "Puzzle 3 is opgelost. Klik op de pijl om het laatste stuk van het pad te volgen.";
}

/* -------------------- MEMORY VIDEO -------------------- */
function hideAllMemoryVideos() {
  Object.values(memoryVideos).forEach(video => { if (!video) return; video.pause(); video.currentTime = 0; video.style.display = "none"; });
}
function playMemoryVideoForPuzzle(puzzleKey, startTime = 0, endTime = 8) {
  hideAllMemoryVideos();
  const video = memoryVideos[puzzleKey];
  if (!video) return console.error("Geen video gevonden voor:", puzzleKey);
  video.style.display = "block"; video.currentTime = startTime;
  const stopClip = () => { if (video.currentTime >= endTime) { video.pause(); video.removeEventListener("timeupdate", stopClip); } };
  video.removeEventListener("timeupdate", stopClip);
  video.addEventListener("timeupdate", stopClip);
  video.play().catch(error => console.warn("Autoplay geblokkeerd of video kon niet starten:", error));
}
function closeMemory() { memoryModal?.classList.add("hidden"); hideAllMemoryVideos(); }

/* -------------------- PATH FOLLOW -------------------- */
function followPath() {
  if (currentStage === 0 && !solved.one) return;
  if (currentStage === 1 && !solved.two) return;
  if (currentStage === 2 && !solved.three) return;
  if (pathArrow) { pathArrow.disabled = true; pathArrow.querySelector("small").textContent = "Locked"; }
  if (currentStage === 3) { show(endScreen); stopTimer(); return; }
  currentStage += 1;
  if (currentStage === 1) setHotspotLocked("hotspotTwo", false);
  if (currentStage === 2) setHotspotLocked("hotspotThree", false);
  setCamera(pathStages[currentStage], true);
  if (currentStage === 3) {
    setTimeout(() => { if (!pathArrow) return; pathArrow.disabled = false; pathArrow.querySelector("small").textContent = "End"; }, WALK_DURATION);
  }
}

/* -------------------- glow -------------------- */

function createPuzzleParticles() {
  document.querySelectorAll(".puzzle-particles").forEach(container => {
    container.innerHTML = "";

    for (let i = 0; i < 8; i++) {
      const particle = document.createElement("a-sphere");

      const x = (Math.random() - 0.5) * 1.2;
      const y = Math.random() * 0.4;
      const z = (Math.random() - 0.5) * 1.2;

      const endY = y + 0.8 + Math.random() * 0.6;
      const duration = 1400 + Math.random() * 900;

      particle.setAttribute("radius", "0.035");
      particle.setAttribute("position", `${x.toFixed(2)} ${y.toFixed(2)} ${z.toFixed(2)}`);
      particle.setAttribute(
        "material",
        "color: #ffd84a; transparent: true; opacity: 0.55"
      );

      particle.setAttribute(
        "animation__float",
        `property: position; to: ${x.toFixed(2)} ${endY.toFixed(2)} ${z.toFixed(2)}; dur: ${duration}; loop: true; dir: alternate; easing: easeInOutSine`
      );

      particle.setAttribute(
        "animation__fade",
        `property: material.opacity; from: 0.15; to: 0.65; dur: ${duration}; loop: true; dir: alternate; easing: easeInOutSine`
      );

      container.appendChild(particle);
    }
  });
}

function setupPuzzleHoverEffects() {
  ["hotspotOne", "hotspotTwo", "hotspotThree"].forEach(id => {
    const hotspot = document.getElementById(id);
    if (!hotspot) return;

    const aura = hotspot.querySelector(".puzzle-aura");

    hotspot.addEventListener("mouseenter", () => {
      if (hotspot.classList.contains("locked")) return;

      if (aura) {
        aura.setAttribute(
          "material",
          "color: #ffd84a; transparent: true; opacity: 0.85"
        );

        aura.setAttribute(
          "animation__pulse",
          "property: scale; from: 1 1 1; to: 1.25 1.25 1.25; dur: 500; dir: alternate; loop: true; easing: easeInOutSine"
        );
      }
    });

    hotspot.addEventListener("mouseleave", () => {
      if (aura) {
        const opacity = hotspot.classList.contains("locked") ? 0.12 : 0.35;

        aura.setAttribute(
          "material",
          `color: #ffd84a; transparent: true; opacity: ${opacity}`
        );

        aura.removeAttribute("animation__pulse");
        aura.setAttribute("scale", "1 1 1");
      }
    });
  });
}

/* -------------------- EVENTS -------------------- */
startBtn?.addEventListener("click", () => {
  reset();
  resetTimer();
  createPathDots();
  createForest();
  createPuzzleParticles();

  show(gameScreen);

  setTimeout(() => {
    refreshAframeScene();
  }, 100);

  setTimeout(() => {
    refreshAframeScene();
  }, 400);

  startTimer();
});
window.addEventListener("resize", () => { if (gameScreen && gameScreen.classList.contains("active")) createForest(); });
menuBtn?.addEventListener("click", () => { reset(); resetTimer(); show(startScreen); });
settingsBtn?.addEventListener("click", openSettings);
startSettingsBtn?.addEventListener("click", openSettings);
closeSettingsBtn?.addEventListener("click", closeSettings);
qualityButtons.forEach(button => button.addEventListener("click", () => setTreeQuality(button.dataset.quality)));
["hotspotOne", "hotspotTwo", "hotspotThree"].forEach(id => {
  const hotspot = document.getElementById(id);
  if (!hotspot) return;
  hotspot.addEventListener("click", () => { if (hotspot.classList.contains("locked")) return; openPuzzle(hotspot.getAttribute("data-puzzle")); });
});
pathArrow?.addEventListener("click", followPath);
closeBtn?.addEventListener("click", closePuzzle);
solveBtn?.addEventListener("click", solvePuzzle);
continueBtn?.addEventListener("click", closeMemory);
timerToggle?.addEventListener("change", () => { timerEnabled = timerToggle.checked; });
document.addEventListener("keydown", event => { if (event.key === "Escape") { closePuzzle(); closeMemory(); closeSettings(); } });
updateQualityButtons();

