# Student Lab Board

A deliberately small, open-source project for students experimenting with a .NET backend, a single-page frontend, and AI-assisted development.

## Run it

Install the **.NET 10 SDK** and **Node.js 22.22+ with compatible npm** (Node 24 recommended). Combined verification also requires **PowerShell 7**. No database, cloud service, or API key is required.

From the project root:

```sh
npm ci
npm run build
dotnet run --project src/StudentLab --urls http://localhost:5080
```

Open http://localhost:5080. Stop the server with Ctrl+C. Vite packages the plain JavaScript SPA into `src/StudentLab/wwwroot/`; ASP.NET Core serves those generated files and the JSON API from the same origin. Run `npm run build` again after frontend edits and before a .NET build or publish. Do not edit the generated files.

For frontend development with live updates, start the backend with the command above, then run `npm run dev` in a second terminal and open http://localhost:5173. Vite proxies `/api` requests to the backend on port 5080. The development server is for local editing; the packaged site runs through .NET on port 5080.

This is a local, unauthenticated classroom demo using fictional data. All visitors share an in-memory board. Restarting resets it; it is not a hosted multi-user service. Authentication, ownership checks, persistence, and resource limits are extension exercises before any public deployment.

The backend app has no external NuGet packages. Backend tests use xUnit and the .NET test SDK from the public NuGet feed in `NuGet.Config`; the first test restore requires internet access. Frontend build/test tooling uses Vite and Vitest, installed by `npm ci` with versions resolved in `package-lock.json`.

## Where to start

| File | Purpose |
| --- | --- |
| `src/StudentLab/Program.cs` | HTTP endpoints, input validation, static frontend hosting |
| `src/StudentLab/ExperimentStore.cs` | Thread-safe in-memory data and sample experiments |
| `src/ClientApp/index.html` | Single-page layout |
| `src/ClientApp/app.js` and `api.js` | DOM updates and testable API requests |
| `src/ClientApp/styles.css` | Responsive styling |
| `vite.config.js` | SPA packaging and local API proxy |
| `vitest.config.js` | Frontend unit test configuration |
| `CLAUDE.md` | Short project instructions for an AI coding assistant |
| `.claude/skills/` | Small build, security, and review procedures |
| `docs/EXERCISES.md` | Independent student challenges |

## Verify

```sh
npm run build
dotnet build src/StudentLab
dotnet test tests/StudentLab.Tests
npm test
```

After `npm ci`, run all checks from the project root with **PowerShell 7**:

```sh
pwsh -File scripts/verify.ps1
```

The script packages the SPA with Vite, runs Vitest, builds the .NET solution, runs backend unit tests, then starts its own temporary server to check CRUD operations, validation, missing resources, and the generated assets. It stops its server and fails with a nonzero exit code on failures. The GitHub Actions workflow installs dependencies and runs the same checks. These checks do not automate browser interaction; also manually add, complete, and delete an experiment, try keyboard navigation, and check the narrow-screen layout.

Backend unit tests cover store isolation, immutable snapshots, updates/deletes, missing IDs, and concurrent additions. Vitest unit tests cover the SPA's actual HTTP helper (including validation, network errors, and empty responses), completion summary, and evidence helpers. Use `npm run test:watch` while editing. Playwright additionally checks browser CRUD, safe rendering, axe accessibility states, and bounded diagnostic timings; screen-reader use and broader accessibility checks remain manual.

## API

| Method | Route | Request / result |
| --- | --- | --- |
| GET | `/api/health` | `{ "status": "ok" }` |
| GET | `/api/experiments` | Array of experiments |
| GET | `/api/experiments/{id}` | Experiment or 404 |
| POST | `/api/experiments` | `{ "title": "My experiment" }`; 201 with Location |
| PUT | `/api/experiments/{id}` | `{ "isComplete": true }`; updated experiment |
| DELETE | `/api/experiments/{id}` | 204 or 404 |

An experiment has `id` (UUID), `title`, and `isComplete`. Titles are trimmed and must contain 1–100 characters. Invalid input returns 400; missing IDs return 404. Unknown API routes never return the SPA HTML. No permissive cross-origin access is enabled.

## AI-assisted work

Read `CLAUDE.md` and the relevant skill before changing behavior. Example prompt: “Add a client-side filter for incomplete experiments. Explain the change and list the checks you ran.” You can also use this project without an AI assistant.

The guidance supports academic practice in building, verification, security review, testing, and contribution review. Keep experiments small, reproducible, and based on fictional data.

Additional short skills cover accessibility, assurance/security cycles, end-to-end verification, performance experiments, CVE applicability, local runtime security checks, and threat modeling. Every skill includes tool discovery/setup commands. The security cycle uses the shared assurance procedure for security-focused work.

## Tools and autonomous assurance

```sh
npm run tools -- list assurance-cycle
npm run tools -- install assurance-cycle
npm run assurance -- run --domains security,accessibility,e2e
```

The installer probes prerequisites, installs locked project tools, restores backend test dependencies, and prepares local Chromium where needed. The assurance collector captures logs, source/artifact hashes, browser results, screenshots/traces, axe findings, and Markdown/HTML reports in `.local/assurance/`. Retests preserve their baseline. The agent follows a bounded local fix-and-retest procedure; scripts collect evidence and validate closure rather than generating arbitrary patches.

See [tool setup](docs/TOOLS.md) and [the autonomous assurance workflow](docs/ASSURANCE.md) for system installation, report commands, evidence recording, remediation limits, and coverage claims. Evidence remains local and ignored by Git; inspect it before sharing.

Contributions: see [CONTRIBUTING.md](CONTRIBUTING.md). License: [MIT](LICENSE). Created as an independent educational example; no institutional endorsement is implied.

Optional open-source [SonarQube Community Build](docs/SONAR.md) includes local server setup, a pinned scanner, quality gate evidence, and linked remediation retests. The [Kali/PentestGPT lab](docs/KALI-LAB.md) provides a supervised local exercise. Assurance reports use the versioned mapping in `security/framework-map.json` to explain selected OWASP, ASVS, CWE, and ATT&CK relationships; they identify control gaps rather than claiming full compliance.
