# SonarQube Community Build

Use the open-source Community Build locally to study maintainability findings, security findings, duplication, and a quality gate. Sonar complements Semgrep and dependency advisory checks. A green gate is not an application compliance certificate.

## List and install

Run `npm run tools -- list sonar` to inspect Node, .NET, and Docker. `npm run tools -- install sonar --system` installs missing system prerequisites on Windows. Docker Desktop must then be running; its licensing is separate from the open-source SonarQube server. Linux students can use Docker Engine. Install the pinned .NET scanner with `pwsh -File scripts/sonar.ps1 -Mode Install`.

Start the server with `docker compose -f security/sonar-compose.yml up -d`. Open http://localhost:9000, change the initial administrator password, create the `nsu-student-lab` project, and generate a project analysis token. Keep the token in the current shell's `SONAR_TOKEN` environment variable, never in Git or evidence. The classroom script restricts the server to loopback. Stop the server with the same compose command ending in `stop`.

The official `sonarqube:community` image follows updates. For repeatable class exercises, record its digest with `docker image inspect sonarqube:community --format '{{json .RepoDigests}}'`, retain the output with evidence, and replace the image reference with the chosen digest. Do not claim a fixed server version from the floating tag.

## Scan and evidence

Build the SPA first (`npm run build`). Run `npm run assurance -- --domains security,e2e --sonar` to include a real Sonar analysis. Without `--sonar`, the report explicitly records Sonar as not run. Standalone use: `pwsh -File scripts/sonar.ps1 -Mode Scan`.

The scanner runs begin/build/end, waits for the quality gate, and collects the server analysis ID, quality gate, first 100 issues, and available metrics into `sonar.json`. Scanner output is retained with token redaction. The token is passed internally as required by the .NET scanner and can be visible to local process inspection; use a scoped, revocable local token. Never publish raw secrets. A failed gate remains a failed check. Missing coverage is not reported as zero; coverage import is a separate student extension. Check analyzed file scope in the server before interpreting frontend coverage. Independent normal builds and unit/browser tests remain mandatory.

Agent remediation: choose one reproducible issue, register a finding against the `sonar` check and its evidence, make a focused correction, then run a linked assurance retest with `--parent BASELINE --sonar`. Close only when the original reproduction, Sonar check, and independent verification pass. Human review is still needed for security hotspots and risk acceptance.

Sources: [Community Build Docker installation](https://docs.sonarsource.com/sonarqube-community-build/setup-and-upgrade/install-the-server/installing-sonarqube-from-docker), [official .NET scanner workflow](https://docs.sonarsource.com/sonarqube-community-build/analyzing-source-code/scanners/dotnet/using).
