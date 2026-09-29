// Bundling and Node's test runner only. No Vite development/test server.
import { build } from "esbuild";
import { spawnSync } from "node:child_process";
import path from "node:path";
const suites = [
  { name: "ui", mocks: { api: "api", AuthContext: "auth-context" } },
  { name: "session", mocks: { "amazon-cognito-identity-js": "cognito" } },
  { name: "api", mocks: { "auth/session": "session" } },
];
for (const suite of suites) {
  await build({
    entryPoints: [`test/${suite.name}.test.jsx`],
    outfile: `.test-build/${suite.name}.test.mjs`,
    bundle: true,
    packages: "external",
    platform: "node",
    format: "esm",
    jsx: "automatic",
    define: {
      "import.meta.env.VITE_COGNITO_USER_POOL_ID": '"us-east-1_test"',
      "import.meta.env.VITE_COGNITO_CLIENT_ID": '"test-client"',
      "import.meta.env.VITE_API_BASE_URL": '"http://localhost:8081/api"',
    },
    plugins: [
      {
        name: "in-memory-mocks",
        setup(builder) {
          builder.onResolve({ filter: /.*/ }, (args) => {
            for (const [key, file] of Object.entries(suite.mocks)) {
              if (args.path === key || args.path.endsWith("/" + key))
                return { path: path.resolve(`test/mocks/${file}.js`) };
            }
          });
        },
      },
    ],
  });
}
const result = spawnSync(
  process.execPath,
  ["--import", "./test/setup.js", "--test", ...suites.map((s) => `.test-build/${s.name}.test.mjs`)],
  { stdio: "inherit" },
);
process.exit(result.status ?? 1);
