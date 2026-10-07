---
name: performance
description: Design small, repeatable Student Lab Board performance experiments and distinguish measurements from hypotheses.
---

# Performance experiment

Use the local API or browser for small academic performance experiments.

After the SPA/backend build, `npm run test:browser -- --grep @performance` captures ten request-time samples and summary statistics. Use the assurance collector to retain the artifact. This is a diagnostic starting point, not a before/after comparison or regression verdict.

1. State one question: for example, how list rendering changes with a larger board. Identify the operation, input size, expected bottleneck, and a competing explanation before measuring.
2. Record the builds/files being compared, machine, runtime, browser if relevant, data size, and measurement method. Choose a bounded sample count and warm-up beforehand.
3. Use an isolated local instance. Keep hardware, build configuration, data, and background activity comparable. Do not modify the student's open board to prepare a benchmark.
4. Measure repeated runs with an appropriate tool: browser Performance/Network panels for rendering or HTTP timing for requests. For before/after comparisons, alternate measurements where practical to reduce drift. Preserve raw timings and error counts.
5. Report units, sample count, median and spread, and any errors. Distinguish browser rendering, network/request time, and server processing; one cannot stand in for another. Do not claim reliable tail percentiles from too few samples.
6. Treat noisy or incomparable results as inconclusive. Investigate one supported cause at a time; repeat the same experiment after an authorized optimization. Do not change the benchmark until a favorable result appears.

Never invent measurements or acceptance thresholds. A local timing experiment is diagnostic evidence, not a production capacity, load, or scalability guarantee. High-volume, stress, or long-running tests need an explicitly scoped task.

## Tool discovery and installation

Run from the project root:

```sh
npm run tools -- list performance
npm run tools -- install performance
```

Read [the shared tool guide](../../../docs/TOOLS.md) for required versions, system installation, browser setup, and permission failures. The catalog lists this skill's actual tools; source reasoning uses the agent, not an imaginary scanner. Install only what the selected task needs, reprobe readiness, and report missing tools as gaps.

For collected evidence and reports, use [the assurance workflow](../../../docs/ASSURANCE.md).
