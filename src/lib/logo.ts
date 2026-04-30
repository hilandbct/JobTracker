import fs from "fs";
import path from "path";

/** Returns true if public/logo-black.png exists on disk (server-side only). */
export function hasLogo(): boolean {
  try {
    return fs.existsSync(path.join(process.cwd(), "public", "logo-black.png"));
  } catch {
    return false;
  }
}
