---
name: assurance-cycle
description: Run an autonomous Student Lab Board assurance cycle with tool setup, evidence collection, reports, focused agent remediation, and linked retests.
---

# Assurance cycle

Use one bounded assessment plan. A single focused question can go directly to its specialist skill. Work sequentially by default; this simplified procedure does not require additional agents.

## Autonomous execution

Read [docs/ASSURANCE.md](../../../docs/ASSURANCE.md) for executable commands, artifact formats, and closure rules. Install/probe tools for selected areas; run `npm run assurance -- run --domains security,accessibility,e2e` with only the requested domains. The collector retains logs, source/artifact hashes, browser JSON, axe attachments, screenshots/traces, and Markdown/HTML reports in a unique `.local/assurance/<run-id>/` folder.

When an autonomous assessment is requested, diagnose confirmed findings and make focused local fixes without another confirmation for routine reversible work. Record the baseline finding before changing code, add useful regression coverage, retest with `--parent BASELINE_ID`, and verify the original case. Use at most two fix/retest iterations per finding. Stop with the finding open for repeated failure, unknown cause, missing prerequisites/human evaluation, or actions beyond the task. Do not weaken tests or widen scope to force success.

Use the collector's `record`, `finding`, `resolve`, and `report` modes to retain agent reasoning, findings, matching-check retests, and final reports. Automatic closure requires linked, passing, current-source evidence; manual/source findings require a documented fresh review. Self-review remains labeled as such. Include remaining gaps and report links in the final response.

1. Record the requested areas, affected files, source revision or local changes, runtime target if needed, and checks planned. Do not expand to every area automatically.
2. Capture a baseline before making fixes. Use the applicable skill:
   - Security: [security-review](../security-review/SKILL.md), [security-threat-model](../security-threat-model/SKILL.md), and [dast-deployment-guard](../dast-deployment-guard/SKILL.md) for running-app checks. Use [cve-assessment](../cve-assessment/SKILL.md) only for a dependency advisory question.
   - Accessibility: [accessibility](../accessibility/SKILL.md).
   - Performance: [performance](../performance/SKILL.md).
3. Run shared verification through [build-and-verify](../build-and-verify/SKILL.md). Use [e2e-gate](../e2e-gate/SKILL.md) when browser journeys are part of the requested scope. Shared verification is a separate check, not another assessment area.
4. Consolidate findings without changing their evidence strength. Distinguish failures, passed checks, blocked checks, and untested behavior; a build pass cannot override a runtime failure.
5. When fixes are within the user's task, make focused changes, run regression checks, and repeat the original assessment. Preserve the original finding and record the retest alongside it. If an independent review was requested, obtain it or say it remains outstanding; do not label self-review independent.
6. Deliver one concise report: scope and source identity, results per area, shared verification, findings/fixes, and remaining gaps. The collector always generates local Markdown/HTML reports; save a curated report under `docs/assessments/` only when requested.

Do not invent an overall “secure,” “compliant,” or deployment-approved verdict from a collection of checks. Keep the assessment small and evidence-based, using the project's existing tools.

## Tool discovery and installation

Run from the project root:

```sh
npm run tools -- list assurance-cycle
npm run tools -- install assurance-cycle
```

Read [the shared tool guide](../../../docs/TOOLS.md) for required versions, system installation, browser setup, and permission failures. The catalog lists this skill's actual tools; source reasoning uses the agent, not an imaginary scanner. Install only what the selected task needs, reprobe readiness, and report missing tools as gaps.

For collected evidence and reports, use [the assurance workflow](../../../docs/ASSURANCE.md).

Optional SonarQube Community Build: `npm run tools -- list sonar`; install scanner using `pwsh -File scripts/sonar.ps1 -Mode Install`. Follow [the Sonar workflow](../../../docs/SONAR.md). Include `--sonar` in baseline and linked retests. Retain analysis ID, gate, issues, and metrics. Missing server evidence is not a pass. Register reproduced issues, apply focused local remediation, and retest the original check plus independent verification.
