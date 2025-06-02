# GitHub Actions Workflows

This directory contains GitHub Actions workflows for the Aldrin SDK project.

## Workflows

### 1. CI Workflow (`ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**What it does:**
- Tests the build process across multiple Node.js versions (16, 18, 20)
- Runs linting, tests, and builds
- Verifies the package can be packed for distribution
- Handles dependency installation issues gracefully

### 2. Publish to NPM Workflow (`publish.yml`)

**Triggers:**
- When a GitHub release is published
- Manual trigger via workflow_dispatch (with optional version parameter)

**What it does:**
- Installs dependencies and handles local file dependency issues
- Runs linting and tests to ensure quality
- Builds all distribution formats (CJS, ESM, UMD, types)
- Publishes the package to NPM registry

## Setup Requirements

### NPM Token

To enable automatic publishing, you need to set up an NPM token:

1. Create an NPM token with publish permissions:
   - Go to [npmjs.com](https://www.npmjs.com)
   - Navigate to Access Tokens in your account settings
   - Create a new "Automation" token
   
2. Add the token to GitHub repository secrets:
   - Go to your repository's Settings → Secrets and variables → Actions
   - Create a new repository secret named `NPM_TOKEN`
   - Paste your NPM token as the value

### Publishing Process

#### Automatic Publishing (Recommended)

1. Create a new release on GitHub:
   - Go to Releases → Create a new release
   - Create a new tag (e.g., `v0.4.52`)
   - Fill in release notes
   - Publish the release

2. The workflow will automatically:
   - Run tests and build the project
   - Publish to NPM if all checks pass

#### Manual Publishing

1. Go to Actions → Publish to NPM → Run workflow
2. Optionally specify a version number
3. The workflow will run and publish if successful

## Notes

- The workflows handle the local file dependency issue (`@project-serum/common`) by temporarily removing it during CI builds
- All builds are tested across multiple Node.js versions to ensure compatibility
- The publish workflow includes version verification and proper NPM authentication
- Both workflows include proper error handling and informative logging