import { cp, rm, writeFile } from "node:fs/promises";

// Sites expects its Worker entry and static assets in this directory layout.
await rm("dist", { recursive: true, force: true });
await cp(".output/server", "dist/server", {
  recursive: true,
  filter: (path) => !path.endsWith("/wrangler.json"),
});
await cp(".output/public", "dist/client", { recursive: true });
await writeFile("dist/server/index.js", 'export { default } from "./index.mjs";\n');
