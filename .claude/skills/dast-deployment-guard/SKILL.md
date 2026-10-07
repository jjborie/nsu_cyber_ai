---
name: dast-deployment-guard
description: Perform bounded local runtime security checks of Student Lab Board and report observed controls and deployment gaps.
---

# Local runtime security check

DAST means checking the running application. After building the SPA and backend, run `npm run test:browser -- --grep @security` for bounded runtime checks against the test-owned local server. Use the assurance collector for captured results and reports. These scenarios are not a general penetration scanner.

1. Confirm the requested target is your own disposable Student Lab Board instance on loopback, with fictional data. Record its address and the build/source you started. A responding URL alone does not prove it is this checkout.
2. Use [build-and-verify](../build-and-verify/SKILL.md) for build/setup. `scripts/verify.ps1` owns its temporary server; do not stop unrelated processes or reuse the student's open board for mutating security checks.
3. Run bounded cases: blank/oversized titles, missing or invalid completion fields, malformed JSON, missing IDs, unknown API routes, and error responses. Observe status and response content; source validation alone is not a runtime result.
4. In the browser, confirm user-supplied markup renders as literal text. Inspect actual content-security-policy and content-type protection headers. Assess cross-origin behavior if relevant; absence of a CORS header alone is not proof of authorization or CSRF protection.
5. The current local shared board is deliberately unauthenticated. Record that limitation. If accounts are introduced, test anonymous access and owner/non-owner reads and writes with separate test identities. Do not invent controls that are absent.
6. Report each case as pass, fail, blocked, or not tested, with expected/observed behavior, request, response, source identity, and scope. Preserve failures before authorized fixes and repeat the same check afterward.

Keep request count/time bounded and redact evidence. Stop if the target is not the owned local instance. Third-party targets, exploit execution, destructive checks, high-volume scanning, and tool installation require separate task authorization. A local HTTP assessment does not verify production TLS, proxies, hosting configuration, or authorize deployment.

## Tool discovery and installation

Run from the project root:

```sh
npm run tools -- list dast-deployment-guard
npm run tools -- install dast-deployment-guard
```

Read [the shared tool guide](../../../docs/TOOLS.md) for required versions, system installation, browser setup, and permission failures. The catalog lists this skill's actual tools; source reasoning uses the agent, not an imaginary scanner. Install only what the selected task needs, reprobe readiness, and report missing tools as gaps.

For collected evidence and reports, use [the assurance workflow](../../../docs/ASSURANCE.md).
