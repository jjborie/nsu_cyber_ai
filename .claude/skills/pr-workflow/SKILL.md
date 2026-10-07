---
name: pr-workflow
description: Prepare or review a focused open-source contribution to Student Lab Board.
---

# Contribution review

1. Inspect the actual changes and keep them within the requested exercise.
2. Use the build-and-verify skill; use security-review when trust boundaries change.
3. Check that documentation matches behavior and no private data or generated build output is included.
4. Describe the problem, resulting behavior, and observed verification. Mention relevant limitations.
5. Suggest a concise title such as `feat: add experiment filtering`.
6. Preparing a contribution does not itself authorize publishing, pushing, or merging it.

## Tool discovery and installation

Run from the project root:

```sh
npm run tools -- list pr-workflow
npm run tools -- install pr-workflow
```

Read [the shared tool guide](../../../docs/TOOLS.md) for required versions, system installation, browser setup, and permission failures. The catalog lists this skill's actual tools; source reasoning uses the agent, not an imaginary scanner. Install only what the selected task needs, reprobe readiness, and report missing tools as gaps.

For collected evidence and reports, use [the assurance workflow](../../../docs/ASSURANCE.md).
