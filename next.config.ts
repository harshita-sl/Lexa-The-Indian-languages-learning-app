import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Loaded conditionally in db/drizzle.ts — keep as native requires
  // so PGlite's WASM and pg's native bindings aren't webpack-bundled.
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
};

export default nextConfig;
