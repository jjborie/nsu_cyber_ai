---
name: security-threat-model
description: Model Student Lab Board assets, trust boundaries, plausible threats, mitigations, and evidence gaps when architecture or security questions change.
---

# Small threat model

1. Read the API, store, frontend rendering, and hosting settings. Name the source revision or changed files assessed.
2. Identify assets and boundaries: experiment data, browser input, HTTP API, shared in-memory store, static files, and server configuration. The current app has no login, database, file upload, LLM calls, or external API integrations; reassess if these are added.
3. For each boundary, consider spoofing, tampering, disclosure, availability, and privilege risks where applicable. Ground scenarios in the code: shared-board modification, unsafe rendering after a future change, invalid input, error disclosure, or unbounded item growth.
4. For each threat record: scenario, affected asset/boundary, likelihood and impact with rationale, existing/proposed mitigation, evidence, limitations, and next verification step. Use a small Markdown table in the response; save `docs/assessments/threat-model.md` only when requested.
5. Use [security-review](../security-review/SKILL.md) for source checks and [dast-deployment-guard](../dast-deployment-guard/SKILL.md) for requested runtime confirmation. A mitigation visible in code is proposed or source-supported until the relevant behavior has been tested.
6. Record gaps explicitly. Request-body size limits do not bound total stored items; local unauthenticated operation does not establish private student boards. Revisit the model after changes to routes, storage, identities, hosting, or external services.

Framework mappings are optional. If requested, verify the publisher's text, cite its edition and exact requirement, and distinguish supporting evidence from partial/missing coverage. A mapping is not certification, compliance, risk acceptance, or release approval.

## Tool discovery and installation

Run from the project root:

```sh
npm run tools -- list security-threat-model
npm run tools -- install security-threat-model
```

Read [the shared tool guide](../../../docs/TOOLS.md) for required versions, system installation, browser setup, and permission failures. The catalog lists this skill's actual tools; source reasoning uses the agent, not an imaginary scanner. Install only what the selected task needs, reprobe readiness, and report missing tools as gaps.

For collected evidence and reports, use [the assurance workflow](../../../docs/ASSURANCE.md).
