const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
// The server runs the same company database code as the desktop app. When both projects sit side by
// side (development), the copies must be identical so a fix never lands in only one of them.
test("The server store is an exact copy of the desktop app store", (t) => {
  const app = path.join(__dirname, "..", "..", "..", "app_crm", "src", "store.cjs");
  if (!fs.existsSync(app)) return t.skip("desktop project not next to the server");
  assert.equal(
    fs.readFileSync(path.join(__dirname, "..", "src", "store.cjs"), "utf8"),
    fs.readFileSync(app, "utf8"),
    "copy app_crm/src/store.cjs to orbit_admin/src/store.cjs",
  );
});
