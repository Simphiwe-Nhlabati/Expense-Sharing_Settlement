# CI/CD Pipeline Blueprint (Fintech-Grade)

This repository now uses a layered CI/CD strategy focused on **speed**, **reliability**, and **security**.

## 1) Continuous Integration (`.github/workflows/ci.yml`)

### Goals
- Fast feedback on pull requests.
- Deterministic builds with Bun lockfile enforcement.
- Comprehensive quality gates before merge.

### Checks
1. `bun install --frozen-lockfile`
2. `bun run lint`
3. `bun run typecheck`
4. `bun run test:unit`
5. `bun run test:integration`
6. `bun run build`

### Performance
- Dependency caching for Bun package cache and `node_modules`.
- Concurrency cancellation to stop stale runs on force-pushes.

### Supply-chain guardrail
- `Dependency Review` job blocks risky dependency changes in PRs.

## 2) Security Pipeline (`.github/workflows/security.yml`)

### Security Controls
- **Secret scanning:** TruffleHog (verified secrets only).
- **Dependency vulnerability scanning:** OSV Scanner against `bun.lock`.
- **CodeQL:** existing advanced workflow remains active.

### Why this matters for fintech
- Helps prevent secret leakage and dependency-based compromise.
- Adds layered detection for common CI/CD attack vectors.

## 3) Continuous Deployment (`.github/workflows/deploy.yml`)

### Strategy
- Pre-deploy build verification on every main-branch push.
- Production deployment to Vercel when required secrets are present.
- Explicit skip message if deployment secrets are missing.

### Secrets required
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## 4) Branch Protection Recommendations

Apply in GitHub Settings:
- Require pull requests before merge.
- Require these status checks to pass:
  - `Lint, Typecheck, and Tests`
  - `Dependency Review (PR only)`
  - `Analyze (javascript-typescript)`
- Require branches to be up-to-date before merging.
- Restrict direct pushes to `main`.

## 5) Fintech Hardening Add-ons (next step)

- Enforce signed commits for release branches.
- Add SBOM generation and artifact attestation.
- Add DAST smoke tests against preview deployments.
- Add migration safety check gate for Drizzle SQL changes.
