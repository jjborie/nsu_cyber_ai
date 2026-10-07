# Tools for academic skills

Each skill uses the shared catalog in `scripts/tool-catalog.json` and has explicit list/install commands. No global security scanner is required. Version probes report missing tools without treating them as passed checks.

```sh
npm run tools -- list accessibility
npm run tools -- install accessibility
```

Replace `accessibility` with any skill folder name. `list` changes nothing. `install` installs missing locked project packages with `npm ci`, restores test packages with `dotnet restore`, and downloads the matching Chromium build when required. Chromium is kept inside `.local/browsers/`. Existing tools are probed first; there are no silent package upgrades. Re-probe after installation.

System prerequisites are Node.js 22.22+ (24 recommended) with a compatible npm, .NET 10 SDK, PowerShell 7 where listed, and Git where listed. If npm is unavailable, bootstrap Node/npm from [Node.js](https://nodejs.org/en/download), then use the commands above. Scripts cannot bootstrap the runtime needed to execute themselves.

On Windows, a requested setup task can install missing system tools with:

```sh
npm run tools -- install assurance-cycle --system
```

This uses exact WinGet package IDs from the catalog, only for missing/incompatible tools. It does not uninstall existing versions. Installer elevation remains subject to the host's permissions; after installation, restart the terminal if PATH has changed, then rerun the probe. On macOS/Linux, use the publisher links printed by the tool and an approved native installer. Playwright Linux system libraries may require `npx playwright install-deps chromium`; this is a separate system change, not part of the project-only installer.

## What each tool provides

| Tools | Purpose |
| --- | --- |
| Node/npm, Vite, Vitest | Frontend packaging and unit checks; built-in file hashing, JSON/HTML reporting, and bounded process capture |
| .NET SDK, xUnit, PowerShell | Backend unit tests and disposable HTTP verification |
| Playwright, Chromium | Real browser journeys, screenshots, failure traces, JSON test results |
| axe through `@axe-core/playwright` | Automated accessibility checks with violations and needs-review results |
| npm audit, .NET package audit | Dependency advisory evidence; network failures are coverage gaps |
| Git | Diff and revision review when the folder is a repository; absence of a repository does not block file fingerprinting |

Security source review, threat modeling, advisory applicability, and remediation reasoning are agent activities. They do not need a separate scanner. Browser developer tools and assistive technologies can supplement accessibility/performance checks; name the actual tool and evaluator in the evidence. Do not auto-install screen readers or paid services just to populate a checklist.

References: [Playwright browser installation](https://playwright.dev/docs/browsers), [Playwright accessibility testing](https://playwright.dev/docs/accessibility-testing), [.NET installation](https://learn.microsoft.com/dotnet/core/install/windows), [PowerShell installation](https://learn.microsoft.com/powershell/scripting/install/install-powershell).
# Optional Sonar tooling

See [SonarQube Community Build](SONAR.md) for Docker server setup, pinned scanner installation, real analysis, evidence collection, and remediation. Use the `sonar` tool profile to list/install prerequisites. [Kali/PentestGPT](KALI-LAB.md) is a separate supervised exercise.
