const LESSON_NOTIFICATION_API_URL = "https://ical.windesheim.nl/api/Rooster-v10?culture=en&key=a77430f8-e6c3-4127-9864-ec966b839427";
const LESSON_NOTIFICATION_PROXY_URL = `https://cors.utilitytool.app/${LESSON_NOTIFICATION_API_URL}`;
const LESSON_NOTIFICATION_CACHE_KEY = "lessonNotificationCache";
const LESSON_NOTIFICATION_DISMISSED_KEY = "lessonNotificationDismissed";
const LESSON_NOTIFICATION_LOOKAHEAD_MINUTES = 10;
const LESSON_NOTIFICATION_POLL_MS = 60000;
const LESSON_NOTIFICATION_CACHE_MS = 5 * 60 * 1000;

let lessonNotificationPopup = null;
let lessonNotificationMessage = null;
let lessonNotificationRouteBtn = null;
let lessonNotificationLaterBtn = null;
let lessonNotificationCloseBtn = null;
let activeLessonNotification = null;

function getLessonNotificationPreferences() {
  if (!window.campusProfile) {
    return {
      notifications: true,
      lessonReminder: true
    };
  }

  return window.campusProfile.getPreferences();
}

function parseLessonIcsDate(value) {
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

function decodeLessonIcsText(value) {
  return (value || "")
    .replace(/\\n/g, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\")
    .trim();
}

function splitLessonRooms(roomValue) {
  return decodeLessonIcsText(roomValue)
    .split(";")
    .map((room) => room.trim())
    .filter(Boolean);
}

function parseLessonIcsText(icsText) {
  const unfoldedLines = icsText.replace(/\r?\n[ \t]/g, "").split(/\r?\n/);
  const events = [];
  let currentEvent = null;

  unfoldedLines.forEach((line) => {
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
    const rawValue = line.slice(separatorIndex + 1);
    const key = rawKey.split(";")[0];

    currentEvent[key] = rawValue;
  });

  return events;
}

function mapEventToNotificationLesson(event) {
  const start = parseLessonIcsDate(event.DTSTART);
  const end = parseLessonIcsDate(event.DTEND);

  if (!start || !end || event.DTSTART.length === 8) {
    return null;
  }

  const summary = decodeLessonIcsText(event.SUMMARY || "Onbekende les").replace(/\s+,.*$/, "").trim();
  const rooms = splitLessonRooms(event.LOCATION || "");

  return {
    id: `${summary}-${start.toISOString()}`,
    title: summary,
    start,
    end,
    rooms,
    primaryRoom: rooms[0] || ""
  };
}

function getCachedLessons() {
  try {
    const raw = localStorage.getItem(LESSON_NOTIFICATION_CACHE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!parsed.fetchedAt || !Array.isArray(parsed.lessons)) {
      return null;
    }

    if (Date.now() - parsed.fetchedAt > LESSON_NOTIFICATION_CACHE_MS) {
      return null;
    }

    return parsed.lessons.map((lesson) => ({
      ...lesson,
      start: new Date(lesson.start),
      end: new Date(lesson.end)
    }));
  } catch (error) {
    console.warn("Could not read cached lesson notifications.", error);
    return null;
  }
}

function cacheLessons(lessons) {
  const serializableLessons = lessons.map((lesson) => ({
    ...lesson,
    start: lesson.start.toISOString(),
    end: lesson.end.toISOString()
  }));

  localStorage.setItem(LESSON_NOTIFICATION_CACHE_KEY, JSON.stringify({
    fetchedAt: Date.now(),
    lessons: serializableLessons
  }));
}

async function fetchLessonNotifications() {
  const cachedLessons = getCachedLessons();
  if (cachedLessons) {
    return cachedLessons;
  }

  let response;

  try {
    response = await fetch(LESSON_NOTIFICATION_API_URL);
  } catch (error) {
    response = await fetch(LESSON_NOTIFICATION_PROXY_URL);
  }

  if (!response.ok) {
    response = await fetch(LESSON_NOTIFICATION_PROXY_URL);
  }

  if (!response.ok) {
    throw new Error(`Rooster ophalen mislukt (${response.status})`);
  }

  const icsText = await response.text();
  const lessons = parseLessonIcsText(icsText)
    .map(mapEventToNotificationLesson)
    .filter(Boolean);

  cacheLessons(lessons);
  return lessons;
}

function getDismissedNotifications() {
  try {
    return JSON.parse(localStorage.getItem(LESSON_NOTIFICATION_DISMISSED_KEY) || "{}");
  } catch (error) {
    return {};
  }
}

function dismissNotification(notificationId, untilTimestamp) {
  const dismissed = getDismissedNotifications();
  dismissed[notificationId] = untilTimestamp;
  localStorage.setItem(LESSON_NOTIFICATION_DISMISSED_KEY, JSON.stringify(dismissed));
}

function isDismissed(notificationId) {
  const dismissed = getDismissedNotifications();
  const untilTimestamp = dismissed[notificationId];

  if (!untilTimestamp) {
    return false;
  }

  if (Date.now() > untilTimestamp) {
    delete dismissed[notificationId];
    localStorage.setItem(LESSON_NOTIFICATION_DISMISSED_KEY, JSON.stringify(dismissed));
    return false;
  }

  return true;
}

function getUpcomingLessonForNotification(lessons) {
  const now = Date.now();
  const upperBound = now + LESSON_NOTIFICATION_LOOKAHEAD_MINUTES * 60 * 1000;

  return lessons
    .filter((lesson) => lesson.start.getTime() > now && lesson.start.getTime() <= upperBound)
    .sort((lessonA, lessonB) => lessonA.start - lessonB.start)
    .find((lesson) => !isDismissed(lesson.id));
}

function ensureLessonNotificationUi() {
  if (lessonNotificationPopup) {
    return;
  }

  const style = document.createElement("style");
  style.textContent = `
    .lesson-notification-popup {
      position: fixed;
      top: 24px;
      right: 24px;
      width: min(337px, calc(100vw - 32px));
      min-height: 115px;
      display: none;
      grid-template-columns: 1fr auto;
      gap: 14px;
      align-items: start;
      padding: 18px 20px 18px 14px;
      background: #ef6486;
      border: 2px solid #2f2f2f;
      border-radius: 0;
      box-shadow: 0 14px 34px rgba(0, 0, 0, 0.22);
      z-index: 5000;
    }

    .lesson-notification-popup.show {
      display: grid;
    }

    .lesson-notification-main {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 10px;
      align-items: start;
    }

    .lesson-notification-close {
      border: none;
      background: transparent;
      color: #111;
      font-size: 26px;
      line-height: 1;
      cursor: pointer;
      padding: 0;
      margin-top: -2px;
    }

    .lesson-notification-message {
      margin: 0;
      color: #111;
      font: 600 17px/1.15 "Roboto", Arial, sans-serif;
      white-space: pre-line;
    }

    .lesson-notification-actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
      align-self: center;
    }

    .lesson-notification-action {
      min-width: 118px;
      padding: 8px 16px;
      border: none;
      background: #fff;
      color: #222;
      font: 500 17px/1 "Roboto", Arial, sans-serif;
      cursor: pointer;
    }

    body.high-contrast .lesson-notification-popup {
      background: #000;
      border-color: #fff;
    }

    body.high-contrast .lesson-notification-message,
    body.high-contrast .lesson-notification-close,
    body.high-contrast .lesson-notification-action {
      color: #fff;
    }

    body.high-contrast .lesson-notification-action {
      background: #000;
      border: 1px solid #fff;
    }

    @media (max-width: 640px) {
      .lesson-notification-popup {
        top: 16px;
        right: 16px;
        grid-template-columns: 1fr;
      }

      .lesson-notification-actions {
        width: 100%;
      }

      .lesson-notification-action {
        width: 100%;
      }
    }
  `;
  document.head.appendChild(style);

  lessonNotificationPopup = document.createElement("div");
  lessonNotificationPopup.className = "lesson-notification-popup";
  lessonNotificationPopup.innerHTML = `
    <div class="lesson-notification-main">
      <button class="lesson-notification-close" type="button" aria-label="Sluiten">×</button>
      <p class="lesson-notification-message"></p>
    </div>
    <div class="lesson-notification-actions">
      <button class="lesson-notification-action lesson-notification-route" type="button">Route</button>
      <button class="lesson-notification-action lesson-notification-later" type="button">Later</button>
    </div>
  `;

  document.body.appendChild(lessonNotificationPopup);

  lessonNotificationMessage = lessonNotificationPopup.querySelector(".lesson-notification-message");
  lessonNotificationRouteBtn = lessonNotificationPopup.querySelector(".lesson-notification-route");
  lessonNotificationLaterBtn = lessonNotificationPopup.querySelector(".lesson-notification-later");
  lessonNotificationCloseBtn = lessonNotificationPopup.querySelector(".lesson-notification-close");

  lessonNotificationCloseBtn.addEventListener("click", () => {
    if (activeLessonNotification) {
      dismissNotification(activeLessonNotification.id, activeLessonNotification.start.getTime());
    }
    hideLessonNotification();
  });

  lessonNotificationLaterBtn.addEventListener("click", () => {
    if (activeLessonNotification) {
      dismissNotification(activeLessonNotification.id, activeLessonNotification.start.getTime());
    }
    hideLessonNotification();
  });

  lessonNotificationRouteBtn.addEventListener("click", () => {
    if (!activeLessonNotification) {
      return;
    }

    dismissNotification(activeLessonNotification.id, activeLessonNotification.start.getTime());
    const targetRoom = activeLessonNotification.primaryRoom;
    hideLessonNotification();

    if (targetRoom) {
      window.location.href = `Route.html?room=${encodeURIComponent(targetRoom)}`;
    }
  });
}

function showLessonNotification(lesson) {
  ensureLessonNotificationUi();

  const minutesUntilStart = Math.max(
    1,
    Math.ceil((lesson.start.getTime() - Date.now()) / 60000)
  );

  activeLessonNotification = lesson;
  lessonNotificationMessage.textContent = `Je les in lokaal ${lesson.primaryRoom || "onbekend"}\nbegint over ${minutesUntilStart} minuten`;
  lessonNotificationRouteBtn.disabled = !lesson.primaryRoom;
  lessonNotificationPopup.classList.add("show");
}

function hideLessonNotification() {
  activeLessonNotification = null;

  if (lessonNotificationPopup) {
    lessonNotificationPopup.classList.remove("show");
  }
}

async function checkLessonNotifications() {
  const preferences = getLessonNotificationPreferences();
  if (!preferences.notifications || !preferences.lessonReminder) {
    hideLessonNotification();
    return;
  }

  try {
    const lessons = await fetchLessonNotifications();
    const upcomingLesson = getUpcomingLessonForNotification(lessons);

    if (!upcomingLesson) {
      hideLessonNotification();
      return;
    }

    if (!activeLessonNotification || activeLessonNotification.id !== upcomingLesson.id) {
      showLessonNotification(upcomingLesson);
      return;
    }

    showLessonNotification(upcomingLesson);
  } catch (error) {
    console.warn("Could not load lesson notifications.", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  ensureLessonNotificationUi();
  checkLessonNotifications();
  window.setInterval(checkLessonNotifications, LESSON_NOTIFICATION_POLL_MS);
});
