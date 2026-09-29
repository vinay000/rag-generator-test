# Team Git and Deployment Workflow

## Branching Strategy (Trunk-Based Development)
The engineering team follows Trunk-Based Development with short-lived feature branches:
1. `main` is the production branch and is always deployable. Direct commits to `main` are blocked by branch protection rules.
2. Feature branches must branch off `main` using the naming convention: `feature/JIRA-123-short-description` or `fix/JIRA-456-bug-title`.
3. Feature branches should live for no longer than 48 hours to minimize merge conflicts.

## Pull Request and Code Review Rules
- Every pull request requires a minimum of two approvals from senior engineers.
- All automated CI checks (linter, unit tests, integration tests, security scanner) must pass with 100% success before merging.
- PRs must be squashed and merged with a conventional commit message format (e.g., `feat(auth): add OAuth2 provider support`).

## Release and Rollback Automation
- Merges to `main` trigger an automated continuous deployment pipeline to staging within 5 minutes.
- Production deployments occur automatically after staging health checks pass, utilizing canary deployment with 10% traffic for the first 15 minutes.
- If the error rate exceeds 0.5% during canary rollout, the deployment is automatically rolled back to the previous stable release.
