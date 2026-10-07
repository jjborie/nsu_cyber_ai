---
name: build-and-verify
description: Build and verify changes to Student Lab Board and report observed results.
---

# Build and verify

1. Read `CLAUDE.md` and identify the behavior being changed.
2. Install locked frontend dependencies with `npm ci` when needed. Run `npm run build` before `dotnet build StudentLab.slnx` from the repository root. Run `dotnet test tests/StudentLab.Tests` and `npm test` for backend and Vitest frontend unit tests respectively. Use `npm run test:watch` for iterative frontend work.
3. Run `pwsh -File scripts/verify.ps1` for the Vite package, both unit suites, .NET build, and HTTP checks of the packaged site. Add a focused check if the changed behavior is not covered. Avoid repeating an already completed check without a reason.
4. For UI changes, run the app and check the affected flow, error feedback, keyboard access, and a narrow viewport.
5. Fix observed failures at their cause. Do not remove checks or suppress warnings to obtain a pass.
6. Report commands run, results, and anything unverified. A successful build alone does not prove a browser flow works.

## Tool discovery and installation

Run from the project root:

```sh
npm run tools -- list build-and-verify
npm run tools -- install build-and-verify
```

Read [the shared tool guide](../../../docs/TOOLS.md) for required versions, system installation, browser setup, and permission failures. The catalog lists this skill's actual tools; source reasoning uses the agent, not an imaginary scanner. Install only what the selected task needs, reprobe readiness, and report missing tools as gaps.

For collected evidence and reports, use [the assurance workflow](../../../docs/ASSURANCE.md).
