# JobPilot AI — Local Development & Operations Guide

## 1. Local Prerequisites
- **Node.js**: v22+
- **Python**: v3.10+
- **uv**: `curl -LsSf https://astral.sh/uv/install.sh | sh`
- **anna-app CLI**: `npm install -g @anna-ai/cli`

## 2. Setting Up the Workspace
```bash
# Install node dependencies
npm install
```

## 3. Running Local Development Harness
```bash
# Boot Anna App dev harness with real APS storage parity
anna-app dev --storage aps
```

Open the harness URL printed in stdout (`http://127.0.0.1:5180/`).

## 4. Running Validation & Diagnostics
```bash
# Validate manifest schema, UI static rules, and tool references
anna-app validate

# Perform strict ACL coverage check against bundle code
anna-app validate --strict
```

## 5. Running Tests
```bash
# Frontend unit and component tests
npm run test

# TypeScript type checking
npm run typecheck

# Production build
npm run build
```
