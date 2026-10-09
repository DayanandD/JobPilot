# JobPilot AI — Architectural Specification

## 1. System High Level Overview
JobPilot AI is structured as an Anna App bundle composed of:
1. **Frontend**: React 18 + TypeScript + Vite SPA rendering inside Anna's sandboxed iframe container.
2. **Backend Tools**: Python Executa stdio JSON-RPC plugin registered as `executas/jobpilot/plugin.py`.
3. **Anna Host APIs**: Seamlessly integration with host services (`llm.*`, `agent.*`, `web.*`, `storage.*`, `files.*`, `tools.*`).

## 2. Directory Structure
```
JobPilot/
├── manifest.json              # Anna App Schema 3 manifest
├── app.json                   # App Store metadata & bundled executas reference
├── package.json               # Frontend dependencies & build scripts
├── vite.config.ts             # Vite configuration targeting outDir: "bundle"
├── tsconfig.json              # Strict TypeScript configuration
├── tailwind.config.js         # Styling system
├── index.html                 # Main entry HTML
├── bundle/                    # Build output directory for Anna App UI deployment
├── docs/                      # Comprehensive technical documentation
│   ├── ANNA_INTEGRATION.md
│   ├── ARCHITECTURE.md
│   └── DEVELOPMENT.md
├── executas/
│   └── jobpilot/              # Stdio Executa Python plugin
│       ├── executa.json
│       ├── pyproject.toml
│       └── plugin.py
└── src/                       # React SPA Source code
    ├── app/                   # App root state & providers
    ├── anna/                  # Isolated Anna Host API Service Wrappers
    ├── domain/                # Pure business logic (match engine, skill normalization)
    ├── features/              # Feature modules (onboarding, profile, jobs, applications, interview)
    ├── components/            # Reusable UI components
    └── test/                  # Test setup & unit test specs
```

## 3. Core Subsystems
- **Profile Subsystem**: Structured candidate profile representation with AI parsing & user confirmation guardrails.
- **Job Discovery Subsystem**: Direct integration with Anna `web.*` API and pluggable job providers.
- **Match Engine**: 6-factor deterministic scoring function (Skills 40%, Experience 20%, Role 15%, Location 10%, Seniority 10%, Education 5%).
- **Application Copilot**: Grounded cover letter, recruiter message, and application Q&A generator.
- **Application Tracker**: Full lifecycle status management (Saved, Preparing, Applied, Interviewing, Offer, etc.).
- **Interview Copilot**: Generative interview preparation & interactive mock interview simulator.
