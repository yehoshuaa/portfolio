(function (globalScope) {
  function fallbackTranslate(key, replacements = {}) {
    const messages = {
      routeNoRoute: "Geen route",
      routeNoDataForRoom: `Geen routegegevens gevonden voor ${replacements.room || ""}`.trim()
    };

    return messages[key] || key;
  }

  function formatMissingMapState(room, translate) {
    const translateFn = typeof translate === "function" ? translate : fallbackTranslate;

    return {
      startLabel: translateFn("routeNoRoute"),
      statusChip: translateFn("routeNoDataForRoom", { room })
    };
  }

  const helpers = {
    formatMissingMapState
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = helpers;
  }

  globalScope.routeStateHelpers = helpers;
})(typeof window !== "undefined" ? window : globalThis);
