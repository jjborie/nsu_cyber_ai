# Autonomous academic assurance

The coding agent runs a bounded assess → diagnose → fix → verify → retest loop. The scripts execute known checks, collect evidence, and generate reports; they do not autonomously invent or execute code patches. The agent reads the findings and makes the local edits.

## Prepare and assess

```sh
npm run tools -- list assurance-cycle
npm run tools -- install assurance-cycle
npm run assurance -- run --domains security,accessibility,e2e
```

Select only requested areas: `security`, `accessibility`, `performance`, and `e2e`. The default is security/accessibility. Shared verification always runs. Browser checks use a disposable server on loopback port 5091, refuse to reuse an existing listener, and never touch the open student board on 5080. The collector continues gathering independent evidence after a failure; dependent browser checks are blocked when the app fails verification. A failed or blocked check gives a nonzero exit code.

Every run prints `RUN_ID` and creates `.local/assurance/<run-id>/` with:

- `manifest.json`: UTC timestamps, requested domains, source-file hashes, commands, results, parent baseline, findings, artifact hashes, and coverage gaps.
- Per-check `output.txt`: bounded captured output with common credential patterns redacted before writing.
- Browser `results.json`, axe state attachments, diagnostic timing samples, screenshots, and failure traces when produced.
- `report.md` and standalone `report.html`: check results, findings, source freshness, and outstanding limitations. Open the HTML file to review/share the report after checking its contents.

Child commands have a three-minute timeout and a two-megabyte textual output limit. Missing tools, timeout, truncated output, or unusable advisory responses are blocked/unknown evidence. No retry-until-green behavior. Runs have unique folders and are never overwritten by retests. Reporting checks artifact hashes; source changes make the previous run stale. This is a local integrity check, not tamper-proof storage or a digital signature.

Capture uses fictional test data only. Text logs redact common credential patterns; screenshots, JSON attachments, and binary traces do not have a universal redactor. Do not use real credentials or personal data in the test instance. Keep `.local/` ignored and inspect artifacts before sharing. Browser traces can be opened with `npx playwright show-trace <trace.zip>`.

## Record agent evidence and findings

Source review and manual checks stay visible as gaps until performed. Create a JSON review file locally with `scope`, `author`, `method`, `observations`, `gaps` (array), and optional `domain`, then record it:

```sh
npm run assurance -- record --run RUN_ID --file .local/review.json
```

The record is labeled `recorded`, never silently converted into an automated pass. Its source snapshot and method distinguish agent source reasoning from a human screen-reader check.

To register a defect, create a JSON file containing `title`, `check` (original manifest check ID), `evidence` (run-relative file path), `reproduction`, `expected`, and `actual`. Include file/line evidence and the exact failed assertion. Then:

```sh
npm run assurance -- finding --run BASELINE_ID --file .local/finding.json
```

The tool prints a finding ID and records it as open. Original evidence remains in place.

## Agent automatic remediation

When the user requests an autonomous assurance cycle, local diagnosis, focused fixes, regression checks, evidence recording, and reporting are part of that task. Continue through them without asking again for routine reversible edits.

1. Preserve the baseline and register each confirmed defect. Prioritize reproducible failures, then supported source findings. Do not “fix” a missing scanner by hiding the gap.
2. Read the affected code and relevant specialist skill. Make the smallest explanatory fix; add a regression test at the narrowest useful layer. Update documentation for changed contracts.
3. Run the full collector again with the same domains and `--parent BASELINE_ID`. Inspect the exact original assertion as well as shared verification. Source-review findings need a fresh recorded review; an unrelated passing test cannot close them.
4. Use at most **two fix/retest iterations per finding**. Stop earlier for an unknown cause, repeated unchanged failure, destructive/shared-system change, unavailable prerequisite, or missing required human evaluation. Keep the finding open and report the blocker.
5. For an automated finding, close only with the matching original check from a linked, passing, current-source retest, and explain the changed files:

```sh
npm run assurance -- run --domains security,accessibility,e2e --parent BASELINE_ID
npm run assurance -- resolve --run BASELINE_ID --finding FINDING_ID --retest RETEST_ID --check browser-security --fix "Changed affected files and repeated the original reproduction"
```

The closure tool refuses unrelated checks, stale source, and unlinked retests. The agent must also confirm that the original case actually ran; a suite pass with the failed assertion removed is invalid. Manual/source findings remain open until their original evidence is re-evaluated and documented; the automated closure tool does not pretend to verify them. Do not remove tests, weaken assertions, bypass controls, accept risks, publish, or deploy as a remediation shortcut.

Agent self-review is explicitly labeled. If independent review is required, arrange a separate authorized reviewer or mark it pending; do not invent one. Additional agents are optional and only used when explicitly authorized. Findings are `remediated` after a verified fix, not certified or independently approved.

## Final report

```sh
npm run assurance -- report --run RUN_ID
```

Report the initial defects, local changes, original and retest IDs, observed results, and remaining blockers. Link the HTML report and relevant artifacts. Keep security, accessibility, performance, and shared verification conclusions separate. “No automated failures observed” is narrower than “secure” or “accessible.” The performance check is diagnostic timing collection, not a qualified regression comparison. No overall release clearance is produced.

## Generated example

Read the [historical report summary](examples/assurance-report.md), or download/open the [full NSU HTML example](examples/assurance-report.html) locally. It preserves the actual October 7, 2026 run results and framework mapping. Artifact names are references; raw local evidence is not published. Generate a new run for current-source evidence. GitHub shows HTML source rather than hosting this report as a website.
