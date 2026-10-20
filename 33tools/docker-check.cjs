const assert = require("node:assert/strict");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { totp } = require("../orbit_admin/owner/admin-auth.cjs");
const root = path.resolve(__dirname, "..");
const compose = JSON.parse(
  execFileSync(
    "docker",
    [
      "compose",
      "-f",
      path.join(root, "compose.yaml"),
      "config",
      "--format",
      "json",
    ],
    { cwd: root, encoding: "utf8" },
  ),
);
const origin = (service) => {
  const port = compose.services[service].ports[0];
  assert.equal(port.host_ip, "127.0.0.1");
  return `http://127.0.0.1:${port.published}`;
};
const credentialsScript =
  "const fs=require('node:fs'),{DatabaseSync}=require('node:sqlite');const db=new DatabaseSync('/data/owner.sqlite',{readOnly:true});const last=db.prepare(\"SELECT value FROM admin_security WHERE name='totp-counter'\").get()?.value??-1;db.close();process.stdout.write(JSON.stringify({token:fs.readFileSync('/data/admin.secret','utf8').trim(),secret:fs.readFileSync('/data/admin-totp.secret','utf8').trim(),last}));";
function credentials() {
  return JSON.parse(
    execFileSync(
      "docker",
      [
        "compose",
        "-f",
        path.join(root, "compose.yaml"),
        "exec",
        "-T",
        "api",
        "node",
        "-e",
        credentialsScript,
      ],
      { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    ),
  );
}
async function request(base, route, body, cookie = "") {
  return fetch(base + route, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      Origin: base,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(15000),
  });
}
(async () => {
  assert.deepEqual(Object.keys(compose.services).sort(), [
    "api",
    "app-admin",
    "app-web",
    "site-admin",
    "website",
  ]);
  for (const [service, route] of [
    ["api", "/healthz"],
    ["website", "/healthz"],
    ["website", "/"],
    ["site-admin", "/"],
    ["app-admin", "/"],
  ]) {
    const response = await request(origin(service), route);
    assert.equal(response.status, 200, `${service}${route}`);
  }
  const website = await request(origin("website"), "/public/site");
  const api = await request(origin("api"), "/public/site");
  assert.equal(website.status, 200);
  assert.deepEqual(await website.json(), await api.json());
  assert.equal((await request(origin("api"), "/admin/snapshot")).status, 401);
  const access = credentials();
  const counter = Math.floor(Date.now() / 30000);
  const first = Math.max(access.last + 1, counter - 1);
  assert(
    first + 1 <= counter + 1,
    "Wait for a new authenticator code before repeating the authenticated smoke check",
  );
  const cookies = [];
  for (const [index, service] of ["site-admin", "app-admin"].entries()) {
    const login = await request(origin(service), "/web/login", {
      token: access.token,
      otp: totp(access.secret, first + index),
    });
    assert.equal(login.status, 200, `${service} sign-in`);
    const cookie = login.headers.get("set-cookie");
    assert(cookie.includes("HttpOnly"));
    assert(cookie.includes("SameSite=Strict"));
    cookies.push(cookie.split(";")[0]);
  }
  assert.notEqual(cookies[0].split("=")[0], cookies[1].split("=")[0]);
  const sharedCookieHeader = cookies.join("; ");
  for (const service of ["site-admin", "app-admin"]) {
    const snapshot = await request(
      origin(service),
      "/web/call",
      { channel: "owner:snapshot" },
      sharedCookieHeader,
    );
    assert.equal(snapshot.status, 200, `${service} shared-browser snapshot`);
    const value = await snapshot.json();
    assert(value.website);
    if (service === "site-admin") assert.equal(value.mail, undefined);
  }
  assert.equal(
    (
      await request(
        origin("site-admin"),
        "/web/call",
        { channel: "owner:user:add", args: [] },
        sharedCookieHeader,
      )
    ).status,
    403,
  );
  for (const service of ["site-admin", "app-admin"])
    assert.equal(
      (await request(origin(service), "/web/logout", {}, sharedCookieHeader))
        .status,
      200,
    );
  console.log(
    "Docker stack verified: four services, public API gateway, signed/TOTP admin sign-in, independent cookies and site-admin permissions. No desktop CRM included.",
  );
})().catch((error) => {
  // Never print request bodies, cookies, or administrator credentials.
  console.error(error.message);
  process.exitCode = 1;
});
