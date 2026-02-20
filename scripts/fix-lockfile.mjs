import { execSync } from "child_process";
import { unlinkSync, existsSync } from "fs";

// Remove the stale package-lock.json so npm can regenerate it
const lockPath = "/vercel/share/v0-project/package-lock.json";
if (existsSync(lockPath)) {
  unlinkSync(lockPath);
  console.log("Deleted stale package-lock.json");
}

// Also remove node_modules to ensure clean install
console.log("Running npm install to regenerate lock file...");
execSync("cd /vercel/share/v0-project && npm install --legacy-peer-deps", {
  stdio: "inherit",
});
console.log("Done! package-lock.json has been regenerated.");
