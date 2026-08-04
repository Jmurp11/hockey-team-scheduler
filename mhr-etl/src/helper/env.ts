import { config } from "dotenv";
import { resolve } from "node:path";

/**
 * Load environment variables for mhr-etl.
 *
 * `dotenv/config` resolves `.env` against the current working directory, which
 * breaks the documented workflow: the npm scripts run from the repo root, so
 * `mhr-etl/.env` would never be found. Load the package's own file first, then
 * fall back to the repo-root one.
 *
 * dotenv never overwrites variables that are already set, so real environment
 * variables (as supplied by GitHub Actions) always win over both files.
 */
config({ path: resolve(__dirname, "../../.env") });
config();
