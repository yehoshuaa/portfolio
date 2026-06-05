const urlParams = new URLSearchParams(window.location.search);
const selectedRoom = urlParams.get("room") || "AC1.20";
const selectedCourse = "Advanced AR 2";

const buildingData = {
  Circus: {
    AC1: {
      image: "../pages/assets/circus-1.png",
      naturalWidth: 1182,
      naturalHeight: 790,
      routes: {
        "AC1.18": {
          main: [[926, 2829], [1103, 2557], [1116, 2027], [1040, 1331], [509, 1331], [496, 604]],
        },
        "AC1.20": {
          main: [[937, 2849], [1064, 2653], [1089, 1336], [506, 1330], [475, 1247]],
        },
        "AC1.22": {
          main: [[926, 2842], [1103, 2539], [1091, 2008], [1059, 1432], [996, 472]],
        },
        "AC1.24": {
          main: [[939, 2848], [1084, 2551], [1103, 1989], [1053, 1312], [983, 908]],
        },
        "AC1.26": {
          main: [[907, 2828], [1097, 2544], [1103, 2006], [1053, 1494], [1027, 1083], [958, 1027]],
        },
        "AC1.28": {
          main: [[914, 2847], [1103, 2550], [1078, 1987], [1078, 1425], [1217, 1248]],
        },
        "AC1.30": {
          main: [[926, 2856], [1110, 2540], [1116, 2009], [1059, 1503], [1072, 1358], [1261, 1320]],
        },
     
        }
      }
    },
    AC2: {
      image: "../pages/assets/circus-2.png",
      naturalWidth: 1039,
      naturalHeight: 808,
      routes: {
              
              
              
              
              
              
    }
  }
};

function mergeSavedRoutes() {
  const saved = localStorage.getItem("schoolRoutes");
  if (!saved) return;

  try {
    const parsedRoutes = JSON.parse(saved);

    Object.entries(parsedRoutes).forEach(([floorKey, roomRoutes]) => {
      if (!buildingData.Circus[floorKey]) return;
      buildingData.Circus[floorKey].routes = {
        ...buildingData.Circus[floorKey].routes,
        ...roomRoutes
      };
    });
  } catch (error) {
    console.warn("Could not parse saved routes.", error);
  }
}

function getFloorFromRoom(room) {
  if (room.startsWith("AC1.")) return "AC1";
  if (room.startsWith("AC2.")) return "AC2";
  return "AC1";
}

function getBuildingFromRoom(room) {
  if (room.startsWith("AC")) return "Circus";
  return "Circus";
}

function getRouteColor(type) {
  return {
    main: "#111111",
    accessible: "#1eb06a",
    quiet: "#4f94d3"
  }[type] || "#111111";
}

mergeSavedRoutes();

const currentBuilding = getBuildingFromRoom(selectedRoom);
const currentFloor = getFloorFromRoom(selectedRoom);
const floorData = buildingData[currentBuilding][currentFloor];

const buildingLabel = document.getElementById("buildingLabel");
const floorLabel = document.getElementById("floorLabel");
const roomLabel = document.getElementById("roomLabel");
const pageTitle = document.getElementById("pageTitle");
const modalRoomText = document.getElementById("modalRoomText");
const modalCourseText = document.getElementById("modalCourseText");
const statusChip = document.getElementById("statusChip");
const startLabel = document.getElementById("startLabel");
const startRouteBtn = document.getElementById("startRouteBtn");
const toggleAltRoutesBtn = document.getElementById("toggleAltRoutesBtn");
const arrivedBtn = document.getElementById("arrivedBtn");
const zoomInBtn = document.getElementById("zoomInBtn");
const zoomOutBtn = document.getElementById("zoomOutBtn");
const centerBtn = document.getElementById("centerBtn");
const arrivalModal = document.getElementById("arrivalModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const sidebar = document.getElementById("sidebar");
const routePageMenuBtn = document.getElementById("routePageMenuBtn");
const routePageMenu = document.getElementById("routePageMenu");
const routePageOverlay = document.getElementById("routePageOverlay");
const routePageCloseMenuBtn = document.getElementById("routePageCloseMenuBtn");
const mobileRouteType = document.getElementById("mobileRouteType");
const routeTypeButtons = document.querySelectorAll(".route-type-btn");
const profilePreferences = window.campusProfile ? window.campusProfile.getPreferences() : null;

function t(key, replacements = {}) {
  if (typeof window.translate === "function") {
    return window.translate(key, replacements);
  }

  return key;
}

function getInitialRouteType() {
  if (!profilePreferences || !profilePreferences.wheelchairRoute) {
    return "main";
  }

  const roomRoutes = floorData.routes[selectedRoom];
  if (roomRoutes && roomRoutes.accessible && roomRoutes.accessible.length > 0) {
    return "accessible";
  }

  return "main";
}

let canvas;
let ctx;
let currentImage = null;
let currentRouteType = getInitialRouteType();
let currentRoute = null;
let showAlternativeState = false;
let zoomLevel = 1;
let panX = 0;
let panY = 0;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let panStartX = 0;
let panStartY = 0;
let pinchStartDistance = 0;
let pinchStartZoom = 1;
let isRouteGuidanceActive = false;
let routeAnimationFrameId = 0;
let routeDashOffset = 0;
let routeBlinkPhase = 0;

buildingLabel.textContent = currentBuilding;
floorLabel.textContent = currentFloor;
roomLabel.textContent = selectedRoom;
pageTitle.textContent = selectedRoom;
modalRoomText.textContent = t("routeRoomLabel", { room: selectedRoom });
modalCourseText.textContent = selectedCourse;

function getCanvasWrapperSize() {
  const wrapper = canvas.parentElement;
  return {
    width: wrapper.clientWidth,
    height: wrapper.clientHeight
  };
}

function resizeCanvasToWrapper() {
  const { width, height } = getCanvasWrapperSize();
  canvas.width = width;
  canvas.height = height;
}

function getImageDrawData() {
  if (!currentImage) return null;

  const baseScale = Math.min(
    canvas.width / currentImage.width,
    canvas.height / currentImage.height
  );
  const scale = baseScale * zoomLevel;
  const drawWidth = currentImage.width * scale;
  const drawHeight = currentImage.height * scale;
  const offsetX = (canvas.width - drawWidth) / 2 + panX;
  const offsetY = (canvas.height - drawHeight) / 2 + panY;

  return { scale, drawWidth, drawHeight, offsetX, offsetY };
}

function getResponsiveRouteMetrics() {
  const isPhone = window.innerWidth <= 640;

  return {
    lineWidth: isPhone ? 5 : 8,
    startRadius: isPhone ? 7 : 10,
    pointRadius: isPhone ? 4 : 6,
    outlineWidth: isPhone ? 1.5 : 2,
    arrowSize: isPhone ? 14 : 20,
    labelOffsetX: isPhone ? 12 : 16,
    labelOffsetY: isPhone ? 12 : 16,
    font: isPhone ? "700 14px Segoe UI" : "700 18px Segoe UI"
  };
}

function drawRoute(points, color, opacity, scale, offsetX, offsetY) {
  if (!points || points.length === 0) return;

  const metrics = getResponsiveRouteMetrics();

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.strokeStyle = color;
  ctx.lineWidth = metrics.lineWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(points[0][0] * scale + offsetX, points[0][1] * scale + offsetY);

  for (let i = 1; i < points.length; i += 1) {
    ctx.lineTo(points[i][0] * scale + offsetX, points[i][1] * scale + offsetY);
  }
  ctx.stroke();

  if (isRouteGuidanceActive) {
    ctx.save();
    ctx.globalAlpha = 0.35 + (Math.sin(routeBlinkPhase) + 1) * 0.25;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = Math.max(3, metrics.lineWidth * 0.45);
    ctx.setLineDash([18, 12]);
    ctx.lineDashOffset = routeDashOffset;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(points[0][0] * scale + offsetX, points[0][1] * scale + offsetY);

    for (let i = 1; i < points.length; i += 1) {
      ctx.lineTo(points[i][0] * scale + offsetX, points[i][1] * scale + offsetY);
    }

    ctx.stroke();
    ctx.restore();
  }

  ctx.fillStyle = color;
  points.forEach((point, index) => {
    const drawX = point[0] * scale + offsetX;
    const drawY = point[1] * scale + offsetY;

    ctx.beginPath();
    ctx.arc(drawX, drawY, index === 0 ? metrics.startRadius : metrics.pointRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "white";
    ctx.lineWidth = metrics.outlineWidth;
    ctx.stroke();
  });

  const startPoint = points[0];
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#111111";
  ctx.font = metrics.font;
  ctx.fillText(
    t("routeStartLabel"),
    startPoint[0] * scale + offsetX + metrics.labelOffsetX,
    startPoint[1] * scale + offsetY - metrics.labelOffsetY
  );

  if (points.length > 1) {
    const last = points[points.length - 1];
    const prev = points[points.length - 2];
    const lastX = last[0] * scale + offsetX;
    const lastY = last[1] * scale + offsetY;
    const prevX = prev[0] * scale + offsetX;
    const prevY = prev[1] * scale + offsetY;
    const angle = Math.atan2(lastY - prevY, lastX - prevX);
    const size = metrics.arrowSize;

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(
      lastX - size * Math.cos(angle - Math.PI / 6),
      lastY - size * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      lastX - size * Math.cos(angle + Math.PI / 6),
      lastY - size * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

function drawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!currentImage) return;

  const drawData = getImageDrawData();
  if (!drawData) return;

  const { scale, drawWidth, drawHeight, offsetX, offsetY } = drawData;

  ctx.drawImage(
    currentImage,
    0,
    0,
    currentImage.width,
    currentImage.height,
    offsetX,
    offsetY,
    drawWidth,
    drawHeight
  );

  if (currentRoute) {
    drawRoute(currentRoute.points, getRouteColor(currentRoute.routeType), 1, scale, offsetX, offsetY);
  }
}

function syncRouteButtons(routeType) {
  routeTypeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.routeType === routeType);
  });

  if (mobileRouteType) {
    mobileRouteType.value = routeType;
  }
}

function getMissingMapState() {
  if (window.routeStateHelpers && typeof window.routeStateHelpers.formatMissingMapState === "function") {
    return window.routeStateHelpers.formatMissingMapState(selectedRoom, t);
  }

  return {
    startLabel: t("routeNoRoute"),
    statusChip: t("routeNoDataForRoom", { room: selectedRoom })
  };
}

function handleMapImageError() {
  const missingMapState = getMissingMapState();

  stopRouteGuidance(false);
  currentImage = null;
  currentRoute = null;
  startLabel.textContent = missingMapState.startLabel;
  statusChip.textContent = missingMapState.statusChip;
  syncRouteButtons("main");

  if (ctx && canvas) {
    drawCanvas();
  }
}

function animateRouteGuidance() {
  if (!isRouteGuidanceActive) {
    routeAnimationFrameId = 0;
    return;
  }

  routeDashOffset -= 2;
  routeBlinkPhase += 0.14;
  drawCanvas();
  routeAnimationFrameId = window.requestAnimationFrame(animateRouteGuidance);
}

function startRouteGuidance() {
  if (!currentRoute) {
    return;
  }

  isRouteGuidanceActive = true;

  if (!routeAnimationFrameId) {
    routeAnimationFrameId = window.requestAnimationFrame(animateRouteGuidance);
  }
}

function stopRouteGuidance(shouldRedraw = true) {
  isRouteGuidanceActive = false;

  if (routeAnimationFrameId) {
    window.cancelAnimationFrame(routeAnimationFrameId);
    routeAnimationFrameId = 0;
  }

  routeDashOffset = 0;
  routeBlinkPhase = 0;

  if (shouldRedraw && ctx && canvas) {
    drawCanvas();
  }
}

function renderRoute(routeType = "main") {
  const roomRoutes = floorData.routes[selectedRoom];

  if (!roomRoutes) {
    stopRouteGuidance(false);
    currentRoute = null;
    startLabel.textContent = t("routeNoRoute");
    statusChip.textContent = t("routeNoDataForRoom", { room: selectedRoom });
    drawCanvas();
    return;
  }

  const points = roomRoutes[routeType];
  if (!points || points.length === 0) {
    stopRouteGuidance(false);
    currentRoute = null;
    startLabel.textContent = t("routeNoRoute");
    statusChip.textContent = t("routeNoTypeForRoom", { type: routeType, room: selectedRoom });
    drawCanvas();
    return;
  }

  currentRouteType = routeType;
  currentRoute = { points, routeType };
  startLabel.textContent = "Roltrap";
  statusChip.textContent = `${selectedRoom} • ${routeType} route`;
  syncRouteButtons(routeType);
  drawCanvas();

  if (isRouteGuidanceActive) {
    startRouteGuidance();
  }
}

function setZoom(nextZoom) {
  zoomLevel = Math.max(1, Math.min(nextZoom, 3));
  drawCanvas();
}

function setZoomAroundPoint(nextZoom, anchorX, anchorY) {
  const clampedZoom = Math.max(1, Math.min(nextZoom, 3));
  if (clampedZoom === zoomLevel) return;

  const zoomRatio = clampedZoom / zoomLevel;
  panX = anchorX - (anchorX - panX) * zoomRatio;
  panY = anchorY - (anchorY - panY) * zoomRatio;
  zoomLevel = clampedZoom;
  drawCanvas();
}

function resetView() {
  zoomLevel = 1;
  panX = 0;
  panY = 0;
  drawCanvas();
}

function beginDrag(clientX, clientY) {
  isDragging = true;
  dragStartX = clientX;
  dragStartY = clientY;
  panStartX = panX;
  panStartY = panY;
  canvas.style.cursor = "grabbing";
}

function updateDrag(clientX, clientY) {
  if (!isDragging) return;

  panX = panStartX + (clientX - dragStartX);
  panY = panStartY + (clientY - dragStartY);
  drawCanvas();
}

function endDrag() {
  isDragging = false;
  canvas.style.cursor = "grab";
}

function toggleAlternativeMode() {
  showAlternativeState = !showAlternativeState;

  if (!showAlternativeState) {
    renderRoute("main");
    return;
  }

  if (currentRouteType === "main") {
    renderRoute("accessible");
    return;
  }

  if (currentRouteType === "accessible") {
    renderRoute("quiet");
    return;
  }

  renderRoute("main");
}

function openRoutePageMenu() {
  routePageMenu.classList.add("open");
  routePageOverlay.classList.add("show");
}

function closeRoutePageMenu() {
  routePageMenu.classList.remove("open");
  routePageOverlay.classList.remove("show");
}

window.onload = function() {
  canvas = document.getElementById("mapCanvas");
  ctx = canvas.getContext("2d");
  canvas.style.cursor = "grab";

  currentImage = new Image();
  currentImage.onload = function() {
    resizeCanvasToWrapper();
    renderRoute(currentRouteType);
  };
  currentImage.onerror = handleMapImageError;
  currentImage.src = floorData.image;

  startRouteBtn.addEventListener("click", () => {
    renderRoute(currentRouteType);
    startRouteGuidance();
  });
  toggleAltRoutesBtn.addEventListener("click", toggleAlternativeMode);
  arrivedBtn.addEventListener("click", () => arrivalModal.classList.remove("hidden"));
  closeModalBtn.addEventListener("click", () => {
    stopRouteGuidance();
    arrivalModal.classList.add("hidden");
    window.location.href = "HomePagina.html";
  });
  zoomInBtn.addEventListener("click", () => setZoom(zoomLevel * 1.2));
  zoomOutBtn.addEventListener("click", () => setZoom(zoomLevel / 1.2));
  centerBtn.addEventListener("click", resetView);

  routeTypeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      showAlternativeState = button.dataset.routeType !== "main";
      renderRoute(button.dataset.routeType);
    });
  });

  if (mobileRouteType) {
    mobileRouteType.addEventListener("change", (event) => {
      showAlternativeState = event.target.value !== "main";
      renderRoute(event.target.value);
    });
  }

  routePageMenuBtn.addEventListener("click", openRoutePageMenu);
  routePageCloseMenuBtn.addEventListener("click", closeRoutePageMenu);
  routePageOverlay.addEventListener("click", closeRoutePageMenu);

  window.addEventListener("click", (event) => {
    const clickedRoutePageMenu = event.target.closest("#routePageMenu");
    const clickedRoutePageMenuBtn = event.target.closest("#routePageMenuBtn");
    const clickedSidebar = event.target.closest("#sidebar");

    if (!clickedRoutePageMenu && !clickedRoutePageMenuBtn && event.target !== routePageOverlay) {
      closeRoutePageMenu();
    }

    if (window.innerWidth <= 980 && !clickedSidebar) {
      sidebar.classList.remove("open");
    }
  });

  canvas.addEventListener("mousedown", (event) => {
    beginDrag(event.clientX, event.clientY);
  });

  window.addEventListener("mousemove", (event) => {
    updateDrag(event.clientX, event.clientY);
  });

  window.addEventListener("mouseup", () => {
    endDrag();
  });

  canvas.addEventListener("touchstart", (event) => {
    if (event.touches.length === 2) {
      const [touchA, touchB] = event.touches;
      pinchStartDistance = Math.hypot(
        touchB.clientX - touchA.clientX,
        touchB.clientY - touchA.clientY
      );
      pinchStartZoom = zoomLevel;
      isDragging = false;
      return;
    }

    if (event.touches.length === 1) {
      beginDrag(event.touches[0].clientX, event.touches[0].clientY);
    }
  });

  canvas.addEventListener("touchmove", (event) => {
    if (event.touches.length === 2) {
      const [touchA, touchB] = event.touches;
      const currentDistance = Math.hypot(
        touchB.clientX - touchA.clientX,
        touchB.clientY - touchA.clientY
      );

      if (pinchStartDistance > 0) {
        const rect = canvas.getBoundingClientRect();
        const anchorX = ((touchA.clientX + touchB.clientX) / 2) - rect.left;
        const anchorY = ((touchA.clientY + touchB.clientY) / 2) - rect.top;
        const nextZoom = pinchStartZoom * (currentDistance / pinchStartDistance);
        setZoomAroundPoint(nextZoom, anchorX, anchorY);
      }
      return;
    }

    if (!isDragging || event.touches.length !== 1) return;

    updateDrag(event.touches[0].clientX, event.touches[0].clientY);
  }, { passive: true });

  canvas.addEventListener("touchend", () => {
    pinchStartDistance = 0;
    pinchStartZoom = zoomLevel;
    endDrag();
  });

  canvas.addEventListener("wheel", (event) => {
    event.preventDefault();

    const rect = canvas.getBoundingClientRect();
    const anchorX = event.clientX - rect.left;
    const anchorY = event.clientY - rect.top;
    const zoomFactor = event.deltaY < 0 ? 1.1 : 1 / 1.1;

    setZoomAroundPoint(zoomLevel * zoomFactor, anchorX, anchorY);
  }, { passive: false });
};

window.addEventListener("resize", () => {
  if (!canvas || !ctx || !currentImage) return;
  resizeCanvasToWrapper();
  drawCanvas();
});
