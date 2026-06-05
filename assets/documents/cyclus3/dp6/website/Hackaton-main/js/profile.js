const popup = document.getElementById("passwordPopup");
const openBtn = document.getElementById("openPopupBtn");
const saveBtn = document.getElementById("saveBtn");
const newPasswordInput = document.getElementById("newPassword");
const repeatPasswordInput = document.getElementById("repeatPassword");

const locationRow = document.getElementById("locationRow");
const dropdown = document.getElementById("locationDropdown");
const selectedLocation = document.getElementById("selectedLocation");
const locationItems = document.querySelectorAll(".dropdown-item");

const notificationsToggle = document.getElementById("notificationsToggle");
const lessonReminderToggle = document.getElementById("lessonReminderToggle");
const routeUpdatesToggle = document.getElementById("routeUpdatesToggle");
const crowdAlertsToggle = document.getElementById("crowdAlertsToggle");
const largeTextToggle = document.getElementById("largeTextToggle");
const contrastToggle = document.getElementById("contrastToggle");
const wheelchairToggle = document.getElementById("wheelchairToggle");
const profileLanguageSelect = document.getElementById("profileLanguageSelect");
const logoutBtn = document.getElementById("logoutBtn");

function getProfilePreferences() {
    if (!window.campusProfile) {
        return null;
    }

    return window.campusProfile.getPreferences();
}

function updateProfilePreferences(nextPreferences) {
    if (!window.campusProfile) {
        return null;
    }

    return window.campusProfile.updatePreferences(nextPreferences);
}

function formatPreferredLocationLabel(location) {
    return `${location} ›`;
}

function syncProfileForm() {
    const preferences = getProfilePreferences();
    if (!preferences) {
        return;
    }

    notificationsToggle.checked = Boolean(preferences.notifications);
    lessonReminderToggle.checked = Boolean(preferences.lessonReminder);
    routeUpdatesToggle.checked = Boolean(preferences.routeUpdates);
    crowdAlertsToggle.checked = Boolean(preferences.crowdAlerts);
    largeTextToggle.checked = Boolean(preferences.largeText);
    contrastToggle.checked = Boolean(preferences.highContrast);
    wheelchairToggle.checked = Boolean(preferences.wheelchairRoute);
    profileLanguageSelect.value = preferences.language || "nl";
    selectedLocation.textContent = formatPreferredLocationLabel(preferences.preferredLocation);
}

function syncProfileLanguage() {
    if (typeof window.applyLanguage === "function") {
        window.applyLanguage(profileLanguageSelect.value || "nl");
    }
}

function saveTogglePreference(key, value) {
    updateProfilePreferences({ [key]: value });
}

if (openBtn) {
    openBtn.addEventListener("click", () => {
        popup.style.display = "flex";
    });
}

if (saveBtn) {
    saveBtn.addEventListener("click", () => {
        const newPassword = newPasswordInput.value.trim();
        const repeatPassword = repeatPasswordInput.value.trim();

        if (!newPassword || !repeatPassword) {
            alert(window.translate ? window.translate("profilePasswordTitle") : "Wachtwoord veranderen");
            return;
        }

        if (newPassword !== repeatPassword) {
            alert("Wachtwoorden komen niet overeen!");
            return;
        }

        localStorage.setItem("profilePasswordLastChangedAt", new Date().toISOString());
        alert("Wachtwoord gewijzigd!");
        popup.style.display = "none";
        newPasswordInput.value = "";
        repeatPasswordInput.value = "";
    });
}

window.addEventListener("click", (event) => {
    if (event.target === popup) {
        popup.style.display = "none";
    }

    if (dropdown.style.display === "block" && !event.target.closest("#locationRow") && !event.target.closest("#locationDropdown")) {
        dropdown.style.display = "none";
    }
});

if (locationRow) {
    locationRow.addEventListener("click", () => {
        dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
    });
}

locationItems.forEach((item) => {
    item.addEventListener("click", () => {
        const normalizedLocation = item.dataset.location || item.textContent.trim();
        saveTogglePreference("preferredLocation", normalizedLocation);
        selectedLocation.textContent = formatPreferredLocationLabel(window.campusProfile.normalizePreferredLocation(normalizedLocation));
        dropdown.style.display = "none";
    });
});

notificationsToggle.addEventListener("change", () => saveTogglePreference("notifications", notificationsToggle.checked));
lessonReminderToggle.addEventListener("change", () => saveTogglePreference("lessonReminder", lessonReminderToggle.checked));
routeUpdatesToggle.addEventListener("change", () => saveTogglePreference("routeUpdates", routeUpdatesToggle.checked));
crowdAlertsToggle.addEventListener("change", () => saveTogglePreference("crowdAlerts", crowdAlertsToggle.checked));
largeTextToggle.addEventListener("change", () => saveTogglePreference("largeText", largeTextToggle.checked));
contrastToggle.addEventListener("change", () => saveTogglePreference("highContrast", contrastToggle.checked));
wheelchairToggle.addEventListener("change", () => saveTogglePreference("wheelchairRoute", wheelchairToggle.checked));

profileLanguageSelect.addEventListener("change", () => {
    saveTogglePreference("language", profileLanguageSelect.value);
    syncProfileLanguage();
});

if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        sessionStorage.removeItem("loggedInUser");
        window.location.href = "index.html";
    });
}

document.addEventListener("DOMContentLoaded", () => {
    syncProfileForm();
    syncProfileLanguage();
});
