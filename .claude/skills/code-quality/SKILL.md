---
name: code-quality
description: Run the Student Lab Board build and tests, review relevant quality risks, and report check completeness separately from findings.
---

# Code quality

1. Read the changed code and identify relevant checks. Use [build-and-verify](../build-and-verify/SKILL.md) for the canonical build, backend/frontend unit tests, and HTTP checks.
2. Check API/frontend contract agreement, readable error handling, accessible native controls, and documentation that matches behavior.
3. Use [security-review](../security-review/SKILL.md) when external input, rendering, access boundaries, or sensitive data change. Other assessment skills apply only to the requested scope.
4. Report each check's execution (completed, blocked, not run) and result (pass, fail, findings, unknown). Preserve a failure even when another check cannot run. Missing scanners or unavailable dependency advisory data are gaps, never clean scan results.
5. Fix observed defects within the task and rerun affected checks. Do not suppress warnings, weaken assertions, or claim browser verification from unit tests alone.

Use the project's actual commands; do not invent scanner output or deployment clearance. The security assurance collector runs dependency audits and selected runtime checks; general secret/static security scanners remain optional and uninstalled.

## Tool discovery and installation

Run from the project root:

```sh
npm run tools -- list code-quality
npm run tools -- install code-quality
```

Read [the shared tool guide](../../../docs/TOOLS.md) for required versions, system installation, browser setup, and permission failures. The catalog lists this skill's actual tools; source reasoning uses the agent, not an imaginary scanner. Install only what the selected task needs, reprobe readiness, and report missing tools as gaps.

For collected evidence and reports, use [the assurance workflow](../../../docs/ASSURANCE.md).

For optional SonarQube Community Build, list tools with `npm run tools -- list sonar`, install the scanner with `pwsh -File scripts/sonar.ps1 -Mode Install`, and follow [the Sonar workflow](../../../docs/SONAR.md). Include `--sonar` in baseline and linked retest runs. Retain the server analysis ID, gate, issues, and metrics; do not infer a pass when Docker, credentials, or server evidence are absent. Register issues and autonomously fix focused local defects within the existing remediation limits, then verify the original reproduction and independent tests.

Optional SonarQube Community Build: `npm run tools -- list sonar`; install scanner using `pwsh -File scripts/sonar.ps1 -Mode Install`. Follow [the Sonar workflow](../../../docs/SONAR.md). Include `--sonar` in baseline and linked retests. Retain analysis ID, gate, issues, and metrics. Missing server evidence is not a pass. Register reproduced issues, apply focused local remediation, and retest the original check plus independent verification.
