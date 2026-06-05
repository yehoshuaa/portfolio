const CAMPUS_PROFILE_STORAGE_KEY = "campusProfilePreferences";

const CAMPUS_PROFILE_DEFAULTS = {
  notifications: true,
  lessonReminder: true,
  routeUpdates: false,
  crowdAlerts: false,
  preferredLocation: "Circus",
  largeText: false,
  highContrast: false,
  wheelchairRoute: false,
  language: localStorage.getItem("selectedLanguage") || "nl"
};

function normalizePreferredLocation(value) {
  const normalized = (value || "").trim().toLowerCase();

  if (normalized === "circus" || normalized === "'t circus") {
    return "Circus";
  }

  if (normalized === "de aardbei" || normalized === "aardbei") {
    return "De aardbei";
  }

  if (normalized === "landdrost" || normalized === "landrost") {
    return "Landdrost";
  }

  return CAMPUS_PROFILE_DEFAULTS.preferredLocation;
}

function readCampusProfilePreferences() {
  try {
    const saved = localStorage.getItem(CAMPUS_PROFILE_STORAGE_KEY);
    if (!saved) {
      return { ...CAMPUS_PROFILE_DEFAULTS };
    }

    const parsed = JSON.parse(saved);
    return {
      ...CAMPUS_PROFILE_DEFAULTS,
      ...parsed,
      preferredLocation: normalizePreferredLocation(parsed.preferredLocation),
      language: parsed.language || localStorage.getItem("selectedLanguage") || "nl"
    };
  } catch (error) {
    console.warn("Could not read campus profile preferences.", error);
    return { ...CAMPUS_PROFILE_DEFAULTS };
  }
}

function writeCampusProfilePreferences(nextPreferences) {
  const merged = {
    ...readCampusProfilePreferences(),
    ...nextPreferences
  };

  merged.preferredLocation = normalizePreferredLocation(merged.preferredLocation);
  merged.language = merged.language || "nl";

  localStorage.setItem(CAMPUS_PROFILE_STORAGE_KEY, JSON.stringify(merged));
  localStorage.setItem("largeText", String(Boolean(merged.largeText)));
  localStorage.setItem("highContrast", String(Boolean(merged.highContrast)));
  localStorage.setItem("wheelchairRoute", String(Boolean(merged.wheelchairRoute)));
  localStorage.setItem("selectedLanguage", merged.language);

  return merged;
}

function applyCampusProfilePreferences(preferences = readCampusProfilePreferences()) {
  document.documentElement.lang = preferences.language || "nl";

  if (document.body) {
    document.body.classList.toggle("large-text", Boolean(preferences.largeText));
    document.body.classList.toggle("high-contrast", Boolean(preferences.highContrast));
    document.body.dataset.preferredLocation = preferences.preferredLocation;
  }

  if (typeof window.applyLanguage === "function") {
    window.applyLanguage(preferences.language || "nl");
  }

  return preferences;
}

function updateCampusProfilePreferences(nextPreferences) {
  const saved = writeCampusProfilePreferences(nextPreferences);
  applyCampusProfilePreferences(saved);
  return saved;
}

window.campusProfile = {
  defaults: { ...CAMPUS_PROFILE_DEFAULTS },
  normalizePreferredLocation,
  getPreferences: readCampusProfilePreferences,
  setPreferences: writeCampusProfilePreferences,
  updatePreferences: updateCampusProfilePreferences,
  applyPreferences: applyCampusProfilePreferences
};

applyCampusProfilePreferences();
