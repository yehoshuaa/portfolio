const test = require("node:test");
const assert = require("node:assert/strict");
const { formatMissingMapState } = require("../js/route-state-helpers.js");

test("returns clear fallback state when the route image cannot be loaded", () => {
  const state = formatMissingMapState("AC1.20", (key, replacements = {}) => {
    if (key === "routeNoRoute") {
      return "Geen route";
    }

    if (key === "routeNoDataForRoom") {
      return `Geen routegegevens gevonden voor ${replacements.room}`;
    }

    return key;
  });

  assert.equal(state.startLabel, "Geen route");
  assert.equal(state.statusChip, "Geen routegegevens gevonden voor AC1.20");
});
