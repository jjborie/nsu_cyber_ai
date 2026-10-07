# Student Lab Board — project guidance

## Purpose and layout

Keep this an approachable student sandbox: .NET 10 Minimal API, plain JavaScript SPA, and in-memory sample data. Avoid adding services or frameworks unless the requested exercise needs them.

- Backend: `src/StudentLab/Program.cs` and `ExperimentStore.cs`.
- Frontend source: `src/ClientApp/`; Vite output: `src/StudentLab/wwwroot/` (generated, never hand-edit).
- Frontend tooling: `vite.config.js`, `vitest.config.js`, and `package.json`.
- Exercises: `docs/EXERCISES.md`.
- Verification: `scripts/verify.ps1`.

## Commands (from the repository root)

```sh
npm ci
npm run build
dotnet run --project src/StudentLab --urls http://localhost:5080
npm run dev
dotnet build src/StudentLab
dotnet test tests/StudentLab.Tests
npm test
pwsh -File scripts/verify.ps1
npm run tools -- list assurance-cycle
npm run tools -- install assurance-cycle
npm run assurance -- run --domains security,accessibility,e2e
```

## Working rules

1. Read the affected code first; make one understandable change at a time.
2. Validate input on the server. Keep frontend and API field names in agreement.
3. Render user input as text, never raw HTML. Do not commit secrets or real student data.
4. Surface errors to users; do not hide exceptions or claim partial work is complete.
5. Add focused regression checks for changed behavior. Report checks actually run and any limits.
6. Preserve accessibility: labels, keyboard access, visible focus, and error feedback.
7. Keep examples fictional. The shared board is unauthenticated and resets on restart; document any change to that model.
8. Update the README when commands, API contracts, or setup change.
9. Package the frontend before .NET build/publish. Use Vite on port 5173 for live editing with API proxying to .NET on port 5080; use the .NET-hosted package for integration checks.

## Short skills

Read the applicable file explicitly; do not assume it loaded automatically.

- `.claude/skills/build-and-verify/SKILL.md`: build, test, and report evidence.
- `.claude/skills/security-review/SKILL.md`: review input, output, and access boundaries.
- `.claude/skills/pr-workflow/SKILL.md`: prepare a focused, reviewable contribution.
- `.claude/skills/code-quality/SKILL.md`: run relevant checks and report coverage and findings separately.
- `.claude/skills/accessibility/SKILL.md`: inspect semantics and check keyboard, focus, and status feedback.
- `.claude/skills/security-cycle/SKILL.md`: coordinate a security-focused assessment and retests.
- `.claude/skills/assurance-cycle/SKILL.md`: coordinate requested assessment areas and retests.
- `.claude/skills/e2e-gate/SKILL.md`: HTTP verification, browser journeys, and failure diagnosis.
- `.claude/skills/performance/SKILL.md`: bounded, repeatable local timing experiments.
- `.claude/skills/cve-assessment/SKILL.md`: assess named advisories against actual dependencies and runtime.
- `.claude/skills/dast-deployment-guard/SKILL.md`: check security behavior on an owned disposable local instance.
- `.claude/skills/security-threat-model/SKILL.md`: identify assets, boundaries, threats, and evidence gaps.

These skills are short academic procedures for Student Lab Board. Read only relevant skills. Each links tool setup and the shared evidence/reporting workflow. Autonomous assurance requests include tool preparation, baseline capture, focused local remediation, regression checks, linked retests, and reports within the requested scope. Follow `docs/ASSURANCE.md`; do not replace missing evidence with a successful claim.
