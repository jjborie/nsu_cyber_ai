---
name: e2e-gate
description: Verify or diagnose Student Lab Board HTTP checks and browser journeys with explicit coverage and preserved failure evidence.
---

# End-to-end verification

1. Read `README.md` and identify the exact journey or failure being checked. Record the source revision or changed files and the target address.
2. After `npm ci`, run `pwsh -File scripts/verify.ps1` from the project root. It packages the SPA, runs Vitest and backend unit tests, builds and starts its own temporary server, checks the API/generated assets, and stops only that process. The runtime checks are HTTP integration checks, not automated browser tests.
3. After the SPA/backend build, run `npm run test:browser -- --grep @e2e`. Playwright starts its own disposable server and exercises keyboard add, complete, delete, and agreement with the API. Check additional requested states manually or extend the suite; do not touch the student's open board.
4. Record expected versus actual results, checks executed, console/network errors, and relevant server output. Redact sensitive values before saving evidence. Name untested or skipped journeys explicitly.
5. Diagnose failures as setup/readiness, API contract, backend behavior, or frontend behavior using evidence from both sides. Keep the first failure; do not retry blindly until green or weaken assertions during assessment.
6. If a fix is authorized, retest the affected case and run the existing HTTP checks when API behavior changed. Confirm whether the fix changed the source being assessed. Stop repeated investigation when no new evidence is available and report the blocker.

Use manual browser checks honestly; propose browser automation only when the task needs it. A previous pass describes the source and environment tested, not every later build.

## Tool discovery and installation

Run from the project root:

```sh
npm run tools -- list e2e-gate
npm run tools -- install e2e-gate
```

Read [the shared tool guide](../../../docs/TOOLS.md) for required versions, system installation, browser setup, and permission failures. The catalog lists this skill's actual tools; source reasoning uses the agent, not an imaginary scanner. Install only what the selected task needs, reprobe readiness, and report missing tools as gaps.

For collected evidence and reports, use [the assurance workflow](../../../docs/ASSURANCE.md).
