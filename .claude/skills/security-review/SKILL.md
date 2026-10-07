---
name: security-review
description: Review Student Lab Board changes involving external input, output rendering, access control, or sensitive data.
---

# Security review

1. Trace browser input through the endpoint, store, response, and DOM.
2. Check server validation, allowed fields, and request size. Reject invalid data explicitly.
3. Check that user content uses `textContent`, not `innerHTML`. Keep the content security policy effective.
4. Keep secrets and real personal data out of code, responses, and logs.
5. The current API is intentionally public on a local shared demo. If adding accounts, check ownership on every read and write; frontend visibility is not authorization.
6. If adding a database, use parameterized queries. If adding cookie authentication, assess CSRF for mutations.
7. Exercise invalid-input and missing-resource cases. Report findings with file/line evidence and distinguish confirmed defects from suggested extensions.

For each finding include the entry point, unsafe data flow, reproduction or source evidence, expected control, impact, suggested fix, and retest. Separate source-supported concerns from demonstrated runtime behavior. Capture findings before remediation and retain the original evidence beside the retest.

Use [security-threat-model](../security-threat-model/SKILL.md) for architectural threats, [cve-assessment](../cve-assessment/SKILL.md) for named advisories, and [dast-deployment-guard](../dast-deployment-guard/SKILL.md) for bounded runtime checks. This source review is not a scanner, a penetration test, or a security certification.

## Tool discovery and installation

Run from the project root:

```sh
npm run tools -- list security-review
npm run tools -- install security-review
```

Read [the shared tool guide](../../../docs/TOOLS.md) for required versions, system installation, browser setup, and permission failures. The catalog lists this skill's actual tools; source reasoning uses the agent, not an imaginary scanner. Install only what the selected task needs, reprobe readiness, and report missing tools as gaps.

For collected evidence and reports, use [the assurance workflow](../../../docs/ASSURANCE.md).
