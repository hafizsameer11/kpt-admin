# Kipit admin — DevOps

## Branch rules

| Branch | Purpose |
|---|---|
| `main` | Production. VPS auto-deploys from here only. |
| `feat/*`, `fix/*`, `chore/*` | Work branches. Open a PR into `main`. |

## Remotes

- `client` — **https://github.com/Kipitapp/kipit-admin.git**

## Auto deploy

Merge to `main` → GitHub Actions SSH → `scripts/deploy.sh`.

Enable with variable `ENABLE_AUTO_DEPLOY=true` after VPS secrets are set.
