---
name: security-cycle
description: Coordinate a security-focused Student Lab Board assessment using the shared assurance procedure.
---

# Security cycle

Use the shared assurance procedure to coordinate security checks and retests.

Read [the assurance cycle](../assurance-cycle/SKILL.md) and select **security only**, unless the user requested other areas. Its security activities are source review, threat modeling, bounded local runtime checks, and named-CVE assessment only when relevant. Retain that cycle's evidence and retest rules.

Do not run accessibility or performance merely because those skills exist. This entry adds no scripts, tool installation, release decision, or authority to test another system.

## Tool discovery and installation

Run from the project root:

```sh
npm run tools -- list security-cycle
npm run tools -- install security-cycle
```

Read [the shared tool guide](../../../docs/TOOLS.md) for required versions, system installation, browser setup, and permission failures. The catalog lists this skill's actual tools; source reasoning uses the agent, not an imaginary scanner. Install only what the selected task needs, reprobe readiness, and report missing tools as gaps.

For collected evidence and reports, use [the assurance workflow](../../../docs/ASSURANCE.md).

Optional SonarQube Community Build: `npm run tools -- list sonar`; install scanner using `pwsh -File scripts/sonar.ps1 -Mode Install`. Follow [the Sonar workflow](../../../docs/SONAR.md). Include `--sonar` in baseline and linked retests. Retain analysis ID, gate, issues, and metrics. Missing server evidence is not a pass. Register reproduced issues, apply focused local remediation, and retest the original check plus independent verification.
