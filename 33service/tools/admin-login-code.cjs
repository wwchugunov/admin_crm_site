const { execFileSync } = require("node:child_process");
const path = require("node:path");
const { totp } = require("../../platform/api/admin-auth.cjs");
const root = path.resolve(__dirname,"../..");
const read =
  "const fs=require('node:fs'),{DatabaseSync}=require('node:sqlite');const db=new DatabaseSync('/data/owner.sqlite',{readOnly:true});const last=db.prepare(\"SELECT value FROM admin_security WHERE name='totp-counter'\").get()?.value??-1;db.close();process.stdout.write(JSON.stringify({token:fs.readFileSync('/data/admin.secret','utf8').trim(),secret:fs.readFileSync('/data/admin-totp.secret','utf8').trim(),last}));";
async function main() {
  const access = JSON.parse(
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
        read,
      ],
      { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    ),
  );
  const counter = Math.max(Math.floor(Date.now() / 30000), access.last + 1);
  const delay = (counter - 1) * 30000 + 250 - Date.now();
  if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
  console.log("Admin secret: " + access.token);
  console.log("Code: " + totp(access.secret, counter));
  console.log(
    "Valid until: " +
      new Date((counter + 2) * 30000).toLocaleTimeString("ru-RU", {
        timeZone: "Europe/Kyiv",
        hour12: false,
      }),
  );
  console.log(
    "Use this code for one login only. Generate another code for the second panel.",
  );
}
main().catch(() => {
  console.error("Could not generate a code. Start the Docker API first.");
  process.exitCode = 1;
});
