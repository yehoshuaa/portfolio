const searchBox = document.getElementById("searchBox");
const searchError = document.getElementById("searchError");
const ROOSTER_API_URL = "https://ical.windesheim.nl/api/Rooster-v10?culture=en&key=a77430f8-e6c3-4127-9864-ec966b839427";
const ROOSTER_PROXY_URL = `https://cors.utilitytool.app/${ROOSTER_API_URL}`;
const DAYS_TO_SHOW = 7;
const initialTab = new URLSearchParams(window.location.search).get("tab");
const DUTCH_DAY_NAMES = ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"];
const DUTCH_MONTH_NAMES = [
    "januari",
    "februari",
    "maart",
    "april",
    "mei",
    "juni",
    "juli",
    "augustus",
    "september",
    "oktober",
    "november",
    "december"
];

const hamburgerBtn = document.getElementById("hamburgerBtn");
const sideMenu = document.getElementById("sideMenu");
const overlay = document.getElementById("overlay");
const floorButtonsContainer = document.getElementById("floorButtons");
const mapImage = document.getElementById("mapImage");
const mapTab = document.getElementById("mapTab");
const roosterTab = document.getElementById("roosterTab");
const mapContent = document.getElementById("mapContent");
const roosterContent = document.getElementById("roosterContent");
const buildingSelect = document.getElementById("buildingSelect");
const scheduleList = document.getElementById("scheduleList");
const modalOverlay = document.getElementById("modalOverlay");
const contentToBlur = [mapContent, roosterContent, document.querySelector(".controls"), document.querySelector(".corner-decoration")];
const locationButtons = document.getElementById("locationButtons");
const locationModalCourse = document.getElementById("locationModalCourse");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelModalBtn = document.getElementById("cancelModalBtn");
const starterGuideOverlay = document.getElementById("starterGuideOverlay");
const starterGuideCloseBtn = document.getElementById("starterGuideCloseBtn");
const starterGuideSkipBtn = document.getElementById("starterGuideSkipBtn");
const starterGuideRoosterBtn = document.getElementById("starterGuideRoosterBtn");
const mapViewer = document.getElementById("mapViewer");
const zoomInBtn = document.getElementById("zoomInBtn");
const zoomOutBtn = document.getElementById("zoomOutBtn");
const resetMapBtn = document.getElementById("resetMapBtn");
const buildingImageSets = {
    circus: {
        prefix: "circus-",
        numbers: [1, 2]
    },
    landrost: {
        prefix: "AL-",
        numbers: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    }
};

function getPreferredBuildingValue() {
    if (!window.campusProfile) {
        return null;
    }

    const preferredLocation = window.campusProfile.getPreferences().preferredLocation;

    return {
        "Circus": "circus",
        "Landdrost": "landrost"
    }[preferredLocation] || null;
}

const validRooms = [
    "AC1.18",
    "AC1.20",
    "AC1.22",
    "AC1.24",
    "AC1.26",
    "AC1.28",
    "AC1.30"
];

function t(key, replacements = {}) {
    if (typeof window.translate === "function") {
        return window.translate(key, replacements);
    }

    return key;
}

function normalizeRoomInput(input) {
    if (!input) {
        return "";
    }

    return input
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "");
}

let mapScale = 1;
let mapOffsetX = 0;
let mapOffsetY = 0;
let isMapDragging = false;
let mapDragStartX = 0;
let mapDragStartY = 0;
let mapStartOffsetX = 0;
let mapStartOffsetY = 0;
let pinchStartDistance = 0;
let pinchStartScale = 1;

function showSearchError(message) {
    searchError.textContent = message;
}

function clearSearchError() {
    searchError.textContent = "";
}

function handleRoomSearch() {
    const normalizedRoom = normalizeRoomInput(searchBox.value);

    if (!normalizedRoom) {
        showSearchError(t("homeSearchEmpty"));
        return;
    }

    if (!validRooms.includes(normalizedRoom)) {
        showSearchError(t("homeSearchInvalid"));
        return;
    }

    clearSearchError();
    window.location.href = `Route.html?room=${encodeURIComponent(normalizedRoom)}`;
}

searchBox.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        handleRoomSearch();
    }
});
searchBox.addEventListener("input", function () {
    clearSearchError();
});


function getSelectedBuildingConfig() {
    return buildingImageSets[buildingSelect.value] || { prefix: "", numbers: [] };
}

function getActiveImageNumber() {
    const activeButton = floorButtonsContainer.querySelector(".floor-btn.active");

    if (!activeButton) {
        return null;
    }

    return activeButton.dataset.imageNumber;
}

function updateMapImage() {
    const selectedBuilding = buildingSelect.value;
    const buildingConfig = getSelectedBuildingConfig();
    const activeImageNumber = getActiveImageNumber();

    if (!buildingConfig.prefix || activeImageNumber === null) {
        mapImage.removeAttribute("src");
        mapImage.alt = t("homeNoMapAvailable", { building: selectedBuilding });
        return;
    }

    const imagePath = `assets/${buildingConfig.prefix}${activeImageNumber}.png`;

    mapImage.onload = function () {
        resetMapView();
    };

    mapImage.src = imagePath;
    mapImage.alt = `Plattegrond ${selectedBuilding} afbeelding ${activeImageNumber}`;
}

function clampMapOffsets() {
    if (!mapViewer || !mapImage.complete) {
        return;
    }

    const viewerWidth = mapViewer.clientWidth;
    const viewerHeight = mapViewer.clientHeight;

    const scaledWidth = mapImage.naturalWidth * mapScale;
    const scaledHeight = mapImage.naturalHeight * mapScale;

    let minX = viewerWidth - scaledWidth;
    let minY = viewerHeight - scaledHeight;

    if (scaledWidth <= viewerWidth) {
        minX = (viewerWidth - scaledWidth) / 2;
        mapOffsetX = minX;
    } else {
        mapOffsetX = Math.min(0, Math.max(minX, mapOffsetX));
    }

    if (scaledHeight <= viewerHeight) {
        minY = (viewerHeight - scaledHeight) / 2;
        mapOffsetY = minY;
    } else {
        mapOffsetY = Math.min(0, Math.max(minY, mapOffsetY));
    }
}

function applyMapTransform() {
    clampMapOffsets();
    mapImage.style.transform = `translate(${mapOffsetX}px, ${mapOffsetY}px) scale(${mapScale})`;
}

function getDistanceBetweenTouches(touchA, touchB) {
    const deltaX = touchA.clientX - touchB.clientX;
    const deltaY = touchA.clientY - touchB.clientY;
    return Math.hypot(deltaX, deltaY);
}

function zoomMapToPoint(nextScale, clientX, clientY) {
    if (!mapViewer || !mapImage.naturalWidth || !mapImage.naturalHeight) {
        return;
    }

    const clampedScale = Math.max(0.5, Math.min(4, nextScale));
    const viewerRect = mapViewer.getBoundingClientRect();
    const pointerX = clientX - viewerRect.left;
    const pointerY = clientY - viewerRect.top;
    const imageX = (pointerX - mapOffsetX) / mapScale;
    const imageY = (pointerY - mapOffsetY) / mapScale;

    mapScale = clampedScale;
    mapOffsetX = pointerX - imageX * mapScale;
    mapOffsetY = pointerY - imageY * mapScale;

    applyMapTransform();
}

function fitMapToViewer() {
    if (!mapViewer || !mapImage.naturalWidth || !mapImage.naturalHeight) {
        return;
    }

    const viewerWidth = mapViewer.clientWidth;
    const viewerHeight = mapViewer.clientHeight;

    const scaleX = viewerWidth / mapImage.naturalWidth;
    const scaleY = viewerHeight / mapImage.naturalHeight;

    mapScale = Math.max(scaleX, scaleY);
    mapOffsetX = 0;
    mapOffsetY = 0;

    applyMapTransform();
}

function resetMapView() {
    fitMapToViewer();
}

function zoomMap(step) {
    if (!mapViewer) {
        return;
    }

    const viewerRect = mapViewer.getBoundingClientRect();
    zoomMapToPoint(mapScale + step, viewerRect.left + viewerRect.width / 2, viewerRect.top + viewerRect.height / 2);
}

function createFloorButtons() {
    const buildingConfig = getSelectedBuildingConfig();

    floorButtonsContainer.innerHTML = "";

    if (!buildingConfig.numbers.length) {
        const emptyMessage = document.createElement("div");
        emptyMessage.classList.add("no-floor-buttons");
        emptyMessage.textContent = t("homeNoImages");
        floorButtonsContainer.appendChild(emptyMessage);

        mapImage.removeAttribute("src");
        mapImage.alt = t("homeNoMapAvailable", { building: buildingSelect.value });
        return;
    }

    buildingConfig.numbers.forEach(function (number, index) {
        const button = document.createElement("button");
        button.classList.add("floor-btn");
        button.dataset.imageNumber = number;
        button.textContent = number;

        if (index === 0) {
            button.classList.add("active");
        }

        button.addEventListener("click", function () {
            const allButtons = floorButtonsContainer.querySelectorAll(".floor-btn");

            allButtons.forEach(function (btn) {
                btn.classList.remove("active");
            });

            button.classList.add("active");
            updateMapImage();
        });

        floorButtonsContainer.appendChild(button);
    });

    updateMapImage();
}


zoomInBtn.addEventListener("click", function () {
    zoomMap(0.2);
});

zoomOutBtn.addEventListener("click", function () {
    zoomMap(-0.2);
});

resetMapBtn.addEventListener("click", function () {
    resetMapView();
});

mapViewer.addEventListener("wheel", function (event) {
    event.preventDefault();
    zoomMapToPoint(mapScale + (event.deltaY < 0 ? 0.15 : -0.15), event.clientX, event.clientY);
}, { passive: false });

mapViewer.addEventListener("mousedown", function (event) {
    isMapDragging = true;
    mapDragStartX = event.clientX;
    mapDragStartY = event.clientY;
    mapStartOffsetX = mapOffsetX;
    mapStartOffsetY = mapOffsetY;
    mapViewer.classList.add("dragging");
});

mapViewer.addEventListener("touchstart", function (event) {
    if (event.touches.length === 1) {
        const touch = event.touches[0];
        isMapDragging = true;
        mapDragStartX = touch.clientX;
        mapDragStartY = touch.clientY;
        mapStartOffsetX = mapOffsetX;
        mapStartOffsetY = mapOffsetY;
        mapViewer.classList.add("dragging");
        return;
    }

    if (event.touches.length === 2) {
        isMapDragging = false;
        mapViewer.classList.remove("dragging");
        pinchStartDistance = getDistanceBetweenTouches(event.touches[0], event.touches[1]);
        pinchStartScale = mapScale;
    }
}, { passive: false });

mapViewer.addEventListener("touchmove", function (event) {
    if (event.touches.length === 1 && isMapDragging) {
        event.preventDefault();
        const touch = event.touches[0];
        mapOffsetX = mapStartOffsetX + (touch.clientX - mapDragStartX);
        mapOffsetY = mapStartOffsetY + (touch.clientY - mapDragStartY);
        applyMapTransform();
        return;
    }

    if (event.touches.length === 2) {
        event.preventDefault();
        const currentDistance = getDistanceBetweenTouches(event.touches[0], event.touches[1]);

        if (!pinchStartDistance) {
            pinchStartDistance = currentDistance;
            pinchStartScale = mapScale;
        }

        const midpointX = (event.touches[0].clientX + event.touches[1].clientX) / 2;
        const midpointY = (event.touches[0].clientY + event.touches[1].clientY) / 2;
        zoomMapToPoint(pinchStartScale * (currentDistance / pinchStartDistance), midpointX, midpointY);
    }
}, { passive: false });

mapViewer.addEventListener("touchend", function (event) {
    if (event.touches.length === 0) {
        isMapDragging = false;
        pinchStartDistance = 0;
        mapViewer.classList.remove("dragging");
        return;
    }

    if (event.touches.length === 1) {
        const touch = event.touches[0];
        isMapDragging = true;
        mapDragStartX = touch.clientX;
        mapDragStartY = touch.clientY;
        mapStartOffsetX = mapOffsetX;
        mapStartOffsetY = mapOffsetY;
        pinchStartDistance = 0;
    }
});

window.addEventListener("mousemove", function (event) {
    if (!isMapDragging) {
        return;
    }

    mapOffsetX = mapStartOffsetX + (event.clientX - mapDragStartX);
    mapOffsetY = mapStartOffsetY + (event.clientY - mapDragStartY);
    applyMapTransform();
});

window.addEventListener("mouseup", function () {
    isMapDragging = false;
    mapViewer.classList.remove("dragging");
});

hamburgerBtn.addEventListener("click", function () {
    sideMenu.classList.toggle("open");
    overlay.classList.toggle("show");
});

overlay.addEventListener("click", function () {
    sideMenu.classList.remove("open");
    overlay.classList.remove("show");
});

function showMapTab() {
    mapTab.classList.add("active");
    roosterTab.classList.remove("active");

    mapContent.classList.remove("hide");
    roosterContent.classList.remove("show");
}

function showRoosterTab() {
    roosterTab.classList.add("active");
    mapTab.classList.remove("active");

    mapContent.classList.add("hide");
    roosterContent.classList.add("show");
}

mapTab.addEventListener("click", showMapTab);
roosterTab.addEventListener("click", showRoosterTab);

if (starterGuideCloseBtn) {
    starterGuideCloseBtn.addEventListener("click", closeStarterGuide);
}

if (starterGuideSkipBtn) {
    starterGuideSkipBtn.addEventListener("click", closeStarterGuide);
}

if (starterGuideRoosterBtn) {
    starterGuideRoosterBtn.addEventListener("click", function () {
        closeStarterGuide();
        showRoosterTab();
    });
}

if (starterGuideOverlay) {
    starterGuideOverlay.addEventListener("click", function (event) {
        if (event.target === starterGuideOverlay) {
            closeStarterGuide();
        }
    });
}

buildingSelect.addEventListener("change", function () {
    createFloorButtons();
});

function openModal() {
    modalOverlay.classList.add("show");
    contentToBlur.forEach(function (element) {
        if (element) {
            element.classList.add("blur");
        }
    });
}

function closeModal() {
    modalOverlay.classList.remove("show");
    contentToBlur.forEach(function (element) {
        if (element) {
            element.classList.remove("blur");
        }
    });
    locationButtons.innerHTML = "";
    locationModalCourse.textContent = "📍 Onbekende les";
}

function openStarterGuide() {
    if (starterGuideOverlay) {
        starterGuideOverlay.classList.add("show");
    }
}

function closeStarterGuide() {
    if (starterGuideOverlay) {
        starterGuideOverlay.classList.remove("show");
    }
}

function pad(value) {
    return String(value).padStart(2, "0");
}

function getLocalDateKey(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatDayLabel(date) {
    return `${DUTCH_DAY_NAMES[date.getDay()]} ${date.getDate()} ${DUTCH_MONTH_NAMES[date.getMonth()]}`;
}

function formatTime(date) {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function parseIcsText(icsText) {
    const unfoldedLines = icsText.replace(/\r?\n[ \t]/g, "").split(/\r?\n/);
    const events = [];
    let currentEvent = null;

    unfoldedLines.forEach(function (line) {
        if (line === "BEGIN:VEVENT") {
            currentEvent = {};
            return;
        }

        if (line === "END:VEVENT") {
            if (currentEvent) {
                events.push(currentEvent);
            }

            currentEvent = null;
            return;
        }

        if (!currentEvent) {
            return;
        }

        const separatorIndex = line.indexOf(":");

        if (separatorIndex === -1) {
            return;
        }

        const rawKey = line.slice(0, separatorIndex);
        const value = line.slice(separatorIndex + 1);
        const key = rawKey.split(";")[0];

        currentEvent[key] = value;
    });

    return events;
}

function decodeIcsText(value) {
    if (!value) {
        return "";
    }

    return value
        .replace(/\\n/g, "\n")
        .replace(/\\,/g, ",")
        .replace(/\\;/g, ";")
        .replace(/\\\\/g, "\\");
}

function parseIcsDate(value) {
    if (!value) {
        return null;
    }

    const cleanValue = value.replace("Z", "");
    const datePart = cleanValue.slice(0, 8);
    const year = Number(datePart.slice(0, 4));
    const month = Number(datePart.slice(4, 6)) - 1;
    const day = Number(datePart.slice(6, 8));

    if (cleanValue.length === 8) {
        return new Date(year, month, day);
    }

    const timePart = cleanValue.slice(9);
    const hours = Number(timePart.slice(0, 2));
    const minutes = Number(timePart.slice(2, 4));
    const seconds = Number(timePart.slice(4, 6) || 0);

    return new Date(year, month, day, hours, minutes, seconds);
}

function extractTeacher(description) {
    const decodedDescription = decodeIcsText(description);
    const match = decodedDescription.match(/Teacher\(s\):\s*(.+)/i);

    return match ? match[1].trim() : "";
}

function splitRooms(roomValue) {
    if (!roomValue) {
        return [];
    }

    return roomValue
        .split(";")
        .map(function (room) {
            return room.trim();
        })
        .filter(Boolean);
}

function mapEventToLesson(event) {
    const start = parseIcsDate(event.DTSTART);
    const end = parseIcsDate(event.DTEND);

    if (!start || !end || event.DTSTART.length === 8) {
        return null;
    }

    const room = decodeIcsText(event.LOCATION || "");
    const rooms = splitRooms(room);

    return {
        dateKey: getLocalDateKey(start),
        start: start,
        time: `${formatTime(start)}\n${formatTime(end)}`,
        title: decodeIcsText(event.SUMMARY || t("homeUnknownLesson")).replace(/\s+,.*$/, "").trim(),
        room: room,
        rooms: rooms,
        teacher: extractTeacher(event.DESCRIPTION),
        highlight: false
    };
}

function createDayBlocks(lessons) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const groupedLessons = lessons.reduce(function (groups, lesson) {
        if (!groups[lesson.dateKey]) {
            groups[lesson.dateKey] = [];
        }

        groups[lesson.dateKey].push(lesson);
        return groups;
    }, {});

    return Array.from({ length: DAYS_TO_SHOW }, function (_, index) {
        const date = addDays(today, index);
        const dateKey = getLocalDateKey(date);
        const dayLessons = groupedLessons[dateKey] || [];

        dayLessons.sort(function (lessonA, lessonB) {
            return lessonA.start - lessonB.start;
        });

        return {
            day: formatDayLabel(date),
            lessons: dayLessons
        };
    });
}

function renderScheduleMessage(message) {
    scheduleList.innerHTML = "";

    const messageElement = document.createElement("div");
    messageElement.classList.add("empty-day");
    messageElement.textContent = message;

    scheduleList.appendChild(messageElement);
}

function renderRooster(dayBlocks) {
    scheduleList.innerHTML = "";

    dayBlocks.forEach(function (dayBlock) {
        const dayGroup = document.createElement("div");
        dayGroup.classList.add("day-group");

        const dayTitle = document.createElement("h3");
        dayTitle.classList.add("day-title");
        dayTitle.textContent = dayBlock.day;
        dayGroup.appendChild(dayTitle);

        if (dayBlock.lessons.length === 0) {
            const emptyDay = document.createElement("div");
            emptyDay.classList.add("empty-day");
            emptyDay.textContent = t("homeNoLessonsPlanned");
            dayGroup.appendChild(emptyDay);
        } else {
            dayBlock.lessons.forEach(function (lesson) {
                const lessonRow = document.createElement("div");
                lessonRow.classList.add("lesson-row");

                const lessonTime = document.createElement("div");
                lessonTime.classList.add("lesson-time");
                lessonTime.textContent = lesson.time;

                const lessonCard = document.createElement("div");
                lessonCard.classList.add("lesson-card");

                if (lesson.highlight) {
                    lessonCard.classList.add("highlight");
                }

                if (lesson.rooms.length > 0) {
                    lessonCard.dataset.lokalen = lesson.rooms.join(",");
                }

                lessonCard.dataset.lessonTitle = lesson.title;

                let lessonHtml = `<div class="lesson-title">${lesson.title}</div>`;

                if (lesson.room) {
                    lessonHtml += `<div class="lesson-info"><span class="lesson-icon">📍</span>${lesson.room}</div>`;
                }

                if (lesson.teacher) {
                    lessonHtml += `<div class="lesson-info"><span class="lesson-icon">👤</span>${lesson.teacher}</div>`;
                }

                lessonCard.innerHTML = lessonHtml;

                lessonRow.appendChild(lessonTime);
                lessonRow.appendChild(lessonCard);
                dayGroup.appendChild(lessonRow);
            });
        }

        scheduleList.appendChild(dayGroup);
    });
}



async function loadRooster() {
    renderScheduleMessage(t("homeLoadingSchedule"));

    try {
        let response;

        try {
            response = await fetch(ROOSTER_API_URL);
        } catch (directFetchError) {
            response = await fetch(ROOSTER_PROXY_URL);
        }

        if (!response.ok) {
            response = await fetch(ROOSTER_PROXY_URL);
        }

        if (!response.ok) {
            throw new Error(`Rooster ophalen mislukt (${response.status})`);
        }

        const icsText = await response.text();
        const lessons = parseIcsText(icsText)
            .map(mapEventToLesson)
            .filter(Boolean);

        renderRooster(createDayBlocks(lessons));
    } catch (error) {
        console.error(error);
        renderScheduleMessage(t("homeScheduleLoadError"));
    }
}

scheduleList.addEventListener("click", function (event) {
    const lessonCard = event.target.closest(".lesson-card");

    if (!lessonCard || !lessonCard.dataset.lokalen) {
        return;
    }

    const lokalen = lessonCard.dataset.lokalen
        .split(",")
        .map(function (lokaal) {
            return lokaal.trim();
        })
        .filter(Boolean);

    if (lokalen.length === 0) {
        return;
    }

    if (lokalen.length === 1) {
        window.location.href = `Route.html?room=${encodeURIComponent(lokalen[0])}`;
        return;
    }

    const lessonTitle = lessonCard.dataset.lessonTitle || "Onbekende les";
    locationButtons.innerHTML = "";
    locationModalCourse.textContent = `📍 ${lessonTitle}`;

    lokalen.forEach(function (lokaal) {
        const button = document.createElement("button");
        button.classList.add("location-option-btn");
        button.textContent = lokaal;

        button.addEventListener("click", function () {
            window.location.href = `Route.html?room=${encodeURIComponent(lokaal)}`;
        });

        locationButtons.appendChild(button);
    });

    openModal();
});



closeModalBtn.addEventListener("click", closeModal);
cancelModalBtn.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", function (event) {
    if (event.target === modalOverlay) {
        closeModal();
    }
});

loadRooster();

const preferredBuildingValue = getPreferredBuildingValue();
if (preferredBuildingValue && buildingSelect.querySelector(`option[value="${preferredBuildingValue}"]`)) {
    buildingSelect.value = preferredBuildingValue;
}

createFloorButtons();

if (initialTab === "rooster") {
    showRoosterTab();
} else {
    showMapTab();
}

if (sessionStorage.getItem("showStarterGuide") === "true") {
    sessionStorage.removeItem("showStarterGuide");
    openStarterGuide();
}
