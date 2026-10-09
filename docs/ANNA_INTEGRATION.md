# Anna AI OS Integration Architecture for JobPilot AI

## 1. Overview
JobPilot AI is an AI Job Search & Application Copilot built as a native user-facing **Anna App** for **Anna AI OS**.
This document outlines the authoritative Anna OS platform architecture, SDK interfaces, Host API grants, manifest structures, Executa plugin protocols, and local/production pipelines based on official Anna Developer Hub specifications.

---

## 2. Platform Component Architecture & Technology Stack

### 2.1 Core Stack
- **Frontend Framework**: React 18+ with TypeScript, bundled using **Vite**.
- **Container Environment**: Sandboxed iframe mounted inside the Anna AI OS Client (`/anna-apps/<slug>/dev/index.html` locally, production edge served via Anna App UI engine).
- **Client Runtime SDK**: `@anna-ai/app-runtime` (serves `AnnaAppRuntime` ESM module over `postMessage` bridge).
- **Backend / Executa Plugins**: Python 3.10+ Executa stdio JSON-RPC 2.0 plugin located under `executas/jobpilot/`.
- **Tooling & CLI**: `@anna-ai/cli` (`anna-app`), `uv` (Astral Python runner), `anna-executa-test`, `@anna-ai/app-schema`.

### 2.2 System Flow Architecture
```
+-------------------------------------------------------------------------+
|                              ANNA AI OS                                 |
|                                                                         |
|  +---------------------------+       +-------------------------------+  |
|  |    JobPilot React SPA     |       |       Anna Assistant /        |  |
|  |  (Sandboxed UI Iframe)    |       |       Agent Controller        |  |
|  +-------------+-------------+       +---------------+---------------+  |
|                |                                     |                  |
|                | ESM SDK (postMessage)               | System Prompt &  |
|                v                                     | Tool Injections  |
|  +---------------------------------------------------+---------------+  |
|  |                    Anna Host RPC Dispatcher                       |  |
|  +-------+--------------------+---------------------+----------------+  |
|          |                    |                     |                   |
|          v                    v                     v                   |
|   +--------------+    +---------------+    +------------------+         |
|   |  llm.* &     |    |  storage.* &  |    |     web.*        |         |
|   |  agent.*     |    |  files.*      |    |  (Search/Fetch)  |         |
|   +--------------+    +---------------+    +------------------+         |
|                                                     |                   |
|                                                     v                   |
|                                            Live Job Search Providers    |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  |                     JobPilot Executa Tool                         |  |
|  |     (stdio JSON-RPC 2.0: parse_resume, match_candidate, etc.)       |  |
|  +-------------------------------------------------------------------+  |
+-------------------------------------------------------------------------+
```

---

## 3. Manifest Specifications (`manifest.json` & `app.json`)

JobPilot AI uses **schema 3** (or schema 2 with exact UI extensions).
Schema 3 introduces structured `storage` declarations and removes legacy un-enforced top-level `permissions`.

### 3.1 `manifest.json` Schema Structure
```json
{
  "$schema": "https://anna.partners/schemas/app-manifest.v3.json",
  "schema": 3,
  "required_executas": [
    {
      "tool_id": "tool-dev-jobpilot"
    }
  ],
  "optional_executas": [],
  "host_capabilities": [
    "llm.sample",
    "llm.complete",
    "llm.embed",
    "web.search",
    "web.fetch",
    "aps.kv",
    "aps.files",
    "host.upload"
  ],
  "storage": {
    "kv": true,
    "files": true,
    "scopes": {
      "user": "rw",
      "app": "rw"
    }
  },
  "system_prompt_addendum": "You are JobPilot AI, an expert career copilot. Help users discover matching jobs, parse resumes, calculate match scores, prepare cover letters, track applications, and practice interviews using JobPilot tools.",
  "user_message_prefix_template": "[JobPilot] {user_message}",
  "tags": ["career", "jobs", "productivity", "ai-copilot"],
  "ui": {
    "bundle": {
      "format": "static-spa",
      "entry": "index.html"
    },
    "form_factors": ["desktop", "mobile"],
    "views": [
      {
        "name": "main",
        "title": "JobPilot AI Dashboard",
        "default": true,
        "min_size": { "w": 480, "h": 360 },
        "default_size": { "w": 1024, "h": 720 },
        "max_size": { "w": 1920, "h": 1200 },
        "resizable": true,
        "movable": true,
        "single_instance": true,
        "summary_template": "JobPilot AI Career Workspace"
      }
    ],
    "host_api": {
      "tools": ["required:*"],
      "llm": ["complete", "stream", "embed"],
      "agent": {
        "session": { "auto": true, "fixed": false },
        "tools": ["*"]
      },
      "web": ["search", "fetch"],
      "storage": ["get", "set", "delete", "list"],
      "files": ["upload_init", "upload_finalize", "download_url", "download", "list", "delete"],
      "upload": ["inline", "negotiate", "confirm"],
      "window": ["set_title", "resize", "focus", "close", "open_view", "report_error"]
    }
  },
  "dev": {
    "seed_storage": {
      "booted_once": true
    },
    "user_id": 1
  }
}
```

### 3.2 `app.json` Store Metadata
```json
{
  "name": "JobPilot AI",
  "slug": "jobpilot",
  "tagline": "AI Job Search & Application Copilot",
  "category": "productivity",
  "bundled_executas": {
    "jobpilot": { "path": "executas/jobpilot" }
  }
}
```

---

## 4. Host API Surface & SDK Usage

The React SPA imports and connects via `@anna-ai/app-runtime`:
```typescript
import { AnnaAppRuntime } from "/static/anna-apps/_sdk/latest/index.js";

const anna = await AnnaAppRuntime.connect();
```

### 4.1 Native Host API Services Supported
1. **LLM (`anna.llm.*`)**:
   - `anna.llm.complete({ messages, maxTokens, modelPreferences })`: Stateless completion for resume parsing, cover letter generation, and interview question synthesis.
   - `anna.llm.stream(...)`: Long-form response generation (up to 65,536 output tokens).
   - `anna.llm.embed({ text | texts })`: High-dimensional vector embeddings for candidate/job semantic similarity.
2. **Agent Sessions (`anna.agent.*`)**:
   - Multi-turn interactive career counseling and mock interview sessions with tool access.
3. **Web Search & Discovery (`anna.web.*`)**:
   - `anna.web.search({ query, max_results, search_depth })`: Real-time web job discovery across trusted job platforms.
   - `anna.web.fetch({ urls, format: "markdown" })`: Extract job description text cleanly without running external scrapers.
4. **Persistent Storage (`anna.storage.*`)**:
   - User profile, job search preferences, saved jobs, application status tracking, and interview history stored durably in Anna Persistent Storage (APS).
5. **File & Document Storage (`anna.files.*` & `anna.upload.*`)**:
   - Storage for resume files (PDF, DOCX) and generated cover letter artifacts.
6. **Tool Invocation (`anna.tools.*`)**:
   - Synchronous `anna.tools.invoke({ tool_id, method, args })` and asynchronous `anna.tools.invokeAsync` for complex processing tasks.
7. **Window Management (`anna.window.*`)**:
   - Control window geometry, titles, focus, views, and error reporting.

---

## 5. JobPilot Executa Plugin Protocol & Architecture

The backend plugin `executas/jobpilot/plugin.py` runs as a standalone process speaking JSON-RPC 2.0 over stdio:

### 5.1 Tool Specifications
1. `search_jobs`: Search and normalize live job listings using parameters (keywords, location, remote preference, experience).
2. `parse_resume`: Structured extraction of candidate skills, experience, education, and achievements from raw resume text/file.
3. `analyze_job`: AI extraction of required skills, preferred skills, responsibilities, and seniority from raw job descriptions.
4. `match_candidate`: Deterministic 6-vector match scoring (Skills 40%, Experience 20%, Role 15%, Location 10%, Seniority 10%, Education 5%).
5. `save_job`: Persist saved job entry into APS.
6. `list_saved_jobs`: Fetch candidate saved job collection.
7. `create_application`: Create an entry in the application tracker.
8. `update_application`: Update application status (Preparing, Applied, Recruiter Contacted, Interviewing, Offer, Rejected).
9. `generate_cover_letter`: Synthesize grounded, non-hallucinated cover letters.
10. `generate_recruiter_message`: Synthesize short direct messages for hiring managers.
11. `generate_interview_questions`: Generate role-specific technical/behavioral interview questions.
12. `evaluate_interview_answer`: Provide feedback and structural scoring on candidate mock interview responses.

---

## 6. Deterministic Match Engine Architecture

To eliminate LLM hallucination in candidate-job scoring, JobPilot AI uses a **pure deterministic scoring function** with configurable weights:

$$\text{Final Score} = S_{\text{skills}} \cdot 0.40 + S_{\text{exp}} \cdot 0.20 + S_{\text{role}} \cdot 0.15 + S_{\text{loc}} \cdot 0.10 + S_{\text{sen}} \cdot 0.10 + S_{\text{edu}} \cdot 0.05$$

- **Skills Component ($40\%$)**: Exact matching + normalized technology equivalents (e.g., `ASP.NET Core` $\equiv$ `.NET Core`, `React.js` $\equiv$ `React`, `PostgreSQL` $\equiv$ `Postgres`) + optional semantic embedding boost.
- **Experience Component ($20\%$)**: Ratio of candidate total years vs required years.
- **Role Component ($15\%$)**: Title string similarity & domain alignment.
- **Location Component ($10\%$)**: Exact match or remote/hybrid policy compatibility.
- **Seniority Component ($10\%$)**: Seniority level match (Junior, Mid, Senior, Lead, Staff).
- **Education Component ($5\%$)**: Degree requirement match.

---

## 7. Development, Verification, & Publishing Pipeline

### 7.1 Local Development Workflow
1. Scaffold: `anna-app init jobpilot --slug jobpilot`
2. Launch harness: `anna-app dev --storage aps`
3. Access local UI: `http://127.0.0.1:5180/`

### 7.2 Automated Testing Pipeline
- **SPA Component & Unit Tests**: Vitest + React Testing Library (90%+ business logic coverage).
- **Executa Tool Tests**: Pytest with `anna-executa-test` plugin.
- **App Integration Tests**: `mountBundle` from `@anna-ai/cli/test`.

### 7.3 Store Review Readiness Checklist
- Zero hardcoded API keys or external AI dependencies.
- No automatic application submissions (explicit user navigation only).
- Strict AI grounding (zero hallucinated work history or credentials).
- Responsive UI adaptative to desktop and mobile form factors.
- Full compliance with `anna-app validate --strict`.
