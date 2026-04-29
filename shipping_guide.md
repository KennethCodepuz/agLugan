# Shipping agLugan — A DevOps Primer

> This guide is written specifically for your stack:
> **Spring Boot backend → Docker → Railway/Render** and **React Native → EAS → APK**

---

## 1. The Big Picture — What "Shipping" Actually Means

Every change you make goes through three questions:

```
Did it work on my machine?   →  DEV
Does it work like production?  →  STAGING
Is it live for real users?   →  PRODUCTION
```

Right now you only have **DEV** (your laptop). The goal of this guide is to give you all three.

---

## 2. The Three Environments

| | Dev | Staging | Production |
|---|---|---|---|
| **Where** | Your laptop | Cloud server | Cloud server |
| **Database** | Neon (same for now) | Neon (separate branch/DB) | Neon (main DB) |
| **Backend URL** | `10.0.2.2:8080` | `staging.aglugan.com` | `api.aglugan.com` |
| **APK** | Debug build | Preview APK (internal testers) | Release APK |
| **Who uses it** | Just you | You + testers | Real commuters & drivers |
| **Can it break?** | Yes, that's fine | Yes, acceptable | **Never** |

### Why staging exists
You don't push straight to production because you can't un-ring a bell.  
If you push a bad backend to production and 50 users are mid-ride, their WebSocket  
drops. Staging is where you catch that first.

---

## 3. CI/CD — What It Is

**CI = Continuous Integration**  
Every time you push code to GitHub, an automated system:
- Builds your app
- Runs your tests
- Tells you if it broke

**CD = Continuous Delivery/Deployment**  
If CI passes, the system automatically:
- Packages your app (Docker image / APK)
- Deploys it to the right environment

### Without CI/CD (what you have now):
```
You write code → manually build → manually deploy → hope it works
```

### With CI/CD:
```
You push to GitHub → pipeline runs → tests pass → auto-deploys to staging
                                  → tests fail  → you get notified, nothing breaks
```

---

## 4. Branching Strategy (Git)

This is the foundation everything else builds on.

```
main ─────────────────────────────────────────────── (PRODUCTION)
  │
  └── staging ──────────────────────────────────────  (STAGING)
        │
        └── feat/user-status ──── (your feature branch)
        └── fix/cancel-bug   ──── (your bugfix branch)
```

### The rules:
| Branch | Rule |
|---|---|
| `main` | **Never push directly.** Only merges from `staging` via Pull Request. Auto-deploys to production. |
| `staging` | Merges from feature branches. Auto-deploys to staging server. |
| `feat/*` or `fix/*` | Where you actually write code. Delete after merging. |

### Your daily workflow:
```bash
# 1. Start a feature
git checkout staging
git pull
git checkout -b feat/driver-route-display

# 2. Write code, commit often
git add .
git commit -m "feat: show driver route on map"

# 3. Push and open a Pull Request → staging
git push -u origin feat/driver-route-display
# Open PR on GitHub: feat/driver-route-display → staging

# 4. After staging tests look good, open PR: staging → main
# That triggers the production deploy
```

---

## 5. GitHub Actions — Your CI/CD Engine

GitHub Actions is free for public repos and runs your pipeline automatically.  
You write a YAML file in `.github/workflows/` and GitHub runs it on every push.

### Your Backend Pipeline (what we'll build)

```
Push to staging branch
        │
        ▼
 GitHub Actions runs:
  1. Checkout code
  2. Build Docker image (./agLugan/Dockerfile)
  3. Push image to Docker Hub or GHCR
  4. Tell Railway/Render to pull the new image
        │
        ▼
   Staging server updates automatically
```

### Your Frontend Pipeline

```
Push to staging branch
        │
        ▼
 GitHub Actions runs:
  1. Checkout code
  2. Run: eas build --platform android --profile preview
  3. EAS builds the APK in the cloud
  4. Download link sent to your email / Slack
```

---

## 6. The Workflow Files (we'll add these)

### `.github/workflows/backend-deploy.yml`
```yaml
name: Backend — Build & Deploy

on:
  push:
    branches: [staging, main]
    paths: ['agLugan/**']      # only triggers if backend code changed

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Log in to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_TOKEN }}

      - name: Build & push Docker image
        uses: docker/build-push-action@v5
        with:
          context: ./agLugan
          push: true
          tags: |
            yourdockerhub/aglugan-backend:${{ github.ref_name }}
            yourdockerhub/aglugan-backend:latest

      - name: Trigger Railway redeploy
        run: |
          curl -X POST "${{ secrets.RAILWAY_WEBHOOK_URL }}"
```

### `.github/workflows/frontend-build.yml`
```yaml
name: Frontend — EAS Preview Build

on:
  push:
    branches: [staging]
    paths: ['frontend/**']     # only triggers if frontend code changed

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        working-directory: frontend/agLugan
        run: npm ci

      - name: Build preview APK
        working-directory: frontend/agLugan
        run: eas build --platform android --profile preview --non-interactive
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

---

## 7. Secrets Management

You never put real passwords in code. GitHub has a **Secrets vault**.

Go to: `GitHub repo → Settings → Secrets and variables → Actions`

Add these:

| Secret Name | What it is |
|---|---|
| `DOCKER_USERNAME` | Your Docker Hub username |
| `DOCKER_TOKEN` | Docker Hub access token (not your password) |
| `RAILWAY_WEBHOOK_URL` | Railway deploy webhook URL |
| `EXPO_TOKEN` | Your EAS/Expo access token (`eas whoami --json`) |

These are injected as `${{ secrets.NAME }}` in the workflow — never visible in logs.

---

## 8. Your Deployment Flow — End to End

```
┌──────────────────────────────────────────────────────────┐
│  You write code on feat/user-status branch               │
└────────────────────────┬─────────────────────────────────┘
                         │  git push + open PR → staging
                         ▼
┌──────────────────────────────────────────────────────────┐
│  GitHub Actions runs on staging merge:                   │
│  • Backend changed? → Docker build → push → Railway      │
│  • Frontend changed? → EAS build → preview APK           │
└────────────────────────┬─────────────────────────────────┘
                         │  You test on staging
                         ▼
┌──────────────────────────────────────────────────────────┐
│  Looks good? Open PR: staging → main                     │
│  GitHub Actions runs AGAIN on main:                      │
│  • Docker push → production Railway service              │
│  • EAS build → production APK                            │
└──────────────────────────────────────────────────────────┘
```

---

## 9. What To Do Right Now (in order)

- [ ] **Step 1** — Deploy backend to Railway manually (just to get it running)
- [ ] **Step 2** — Create `staging` branch in Git
- [ ] **Step 3** — Set up GitHub Secrets (Docker Hub + Railway webhook)
- [ ] **Step 4** — Add `.github/workflows/backend-deploy.yml`
- [ ] **Step 5** — Verify: push a small change to `staging` → watch Railway auto-update
- [ ] **Step 6** — Set up EAS account + `eas login`
- [ ] **Step 7** — Add `.github/workflows/frontend-build.yml`
- [ ] **Step 8** — Update `eas.json` with real production server URL
- [ ] **Step 9** — Build first production APK

---

## 10. Key Terms Cheat Sheet

| Term | Plain English |
|---|---|
| **CI** | Automated checks that run every time you push |
| **CD** | Automated deployment after checks pass |
| **Pipeline** | The sequence of automated steps |
| **Artifact** | The thing a build produces (Docker image, APK) |
| **Staging** | A production clone — safe to break |
| **Environment variable** | A secret value injected at runtime, not in code |
| **Webhook** | A URL you call to trigger something (e.g., redeploy) |
| **Registry** | Where Docker images are stored (Docker Hub, GHCR) |
| **PR / Pull Request** | A request to merge one branch into another — code review happens here |
