---
name: accessibility
description: Review Student Lab Board accessibility, including semantics, keyboard use, focus, forms, and status feedback.
---

# Accessibility review

Review this project's plain JavaScript SPA source in `src/ClientApp/`. Check the packaged site or the Vite development server as appropriate and record which was used.

1. Identify the page states to check: loading, populated, empty, completed items, invalid input, and request failure/retry.
2. Inspect native controls, labels, heading order, document language, and status messages. Prefer HTML elements with built-in behavior over custom controls and extra ARIA.
3. In a running browser, use only the keyboard to add, complete, delete, and retry. Check tab order, visible focus, and where focus goes after the list is rebuilt. Verify that removing a focused control does not strand the user.
4. Check zoom, narrow layouts, text/control contrast, and screen-reader announcements for changed results and errors. Record which browsers or assistive tools were actually used.
5. Prepare the listed tools, then run `npm run test:browser -- --grep @a11y` after frontend/backend build. Report axe violations and results needing manual review separately; describe missing tools or unrun states as gaps.
6. Report each issue with state, file/line or element, reproduction, expected behavior, and a retest method. Capture the initial finding before fixing it, then repeat the affected check after an authorized change.

Label the evidence precisely: source inspection, axe automated scan, or manual browser/assistive check. A clean scan or source review alone is not a WCAG conformance assessment; untested states remain untested.

## Tool discovery and installation

Run from the project root:

```sh
npm run tools -- list accessibility
npm run tools -- install accessibility
```

Read [the shared tool guide](../../../docs/TOOLS.md) for required versions, system installation, browser setup, and permission failures. The catalog lists this skill's actual tools; source reasoning uses the agent, not an imaginary scanner. Install only what the selected task needs, reprobe readiness, and report missing tools as gaps.

For collected evidence and reports, use [the assurance workflow](../../../docs/ASSURANCE.md).
