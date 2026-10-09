# 🚀 JobPilot AI — Subsystem Architecture & Manual Verification Guide

## 📌 Executive Summary
JobPilot AI is an AI-powered Job Search & Application Copilot built as a single-page application (SPA) running in the Anna AI OS desktop/mobile runtime environment. It empowers candidates to discover live jobs, parse resumes without data leakage, compute 6-vector match scores against target job specifications, generate grounded cover letters and recruiter DMs, track job applications across a 9-stage pipeline, and practice mock interviews using the STAR framework.

---

## 🏗 Subsystem Architecture & Implementation Summary

### Phase 0 & 1 — Architecture & Manifest Schema
- **Manifest**: `manifest.json` (Schema 3, Host APIs: `llm.*`, `web.*`, `aps.*`, `host.upload`).
- **Python Executa Plugin**: `executas/jobpilot/plugin.py` (JSON-RPC 2.0 stdio RPC server exposing 12 tools).
- **Core Stack**: React 18, TypeScript (strict), Vite, TailwindCSS, Zustand.

### Phase 2 — UI Shell & Navigation Layout
- Responsive desktop layout with collapsible sidebar (`w-64` expanded, `w-20` collapsed).
- **Logos & Branding**:
  - Expanded Sidebar: `/JobPilot_AI_dark.png`
  - Collapsed Sidebar / Mobile header: `/JobPilot.png`
- Header displaying current page title, sidebar toggle, Anna OS readiness chip, and Profile status chip.

### Phase 3 — Host API Abstraction Layer
- `annaClient.ts`, `annaLlm.ts`, `annaStorage.ts`, `annaFiles.ts`, `annaWeb.ts`, `annaTools.ts`, `annaCredentials.ts`, `annaMobile.ts`. Handles IPC communication with Anna AI OS, falling back seamlessly to mock standalone mode.

### Phase 4 — Candidate Profile Subsystem
- `profileDomain.ts`, `profileRepository.ts`. Stores candidate background (skills, experience, education, preferences), computes profile completeness %, and enforces confirmation guardrails before matching.

### Phase 5 — Resume Upload & AI Parsing Subsystem
- `resumeExtractor.ts`, Executa `parse_resume` tool.
- Validates file size (max 10MB) and format (.pdf, .docx, .txt). Extracts candidate skills, work history, and education.

### Phase 6 & 7 — Live Job Discovery & 3-Layer Deduplication Engine
- `jobProvider.ts`, `annaWebJobProvider.ts`, `jobRepository.ts`, `JobsView.tsx`.
- 3-Layer Deduplication: Provider ID matching, URL hash normalization, Title + Company similarity.
- Real-time search, initial seeding, freshness badges (e.g. "Just now", "2d ago"), loading skeletons, and error handling.

### Phase 8 — AI Job Analysis Subsystem
- `jobAnalyzer.ts`, Executa `analyze_job` tool.
- Schema-validated extraction of required skills, preferred skills, responsibilities, salary, location, remote policy, and potential concerns.

### Phase 9 — Deterministic 6-Vector Match Engine
- `matchEngine.ts`, Executa `match_candidate` tool.
- 6-Vector Weighted Match Scoring:
  1. Skills Match (40%)
  2. Experience Level (20%)
  3. Role Alignment (15%)
  4. Location Compatibility (10%)
  5. Seniority Matching (10%)
  6. Education Alignment (5%)
- Normalizes tech equivalences (e.g., C# ↔ .NET, React ↔ React.js).

### Phase 10 — Saved Jobs Subsystem
- `savedJobsRepository.ts`, `SavedJobsView.tsx`.
- Persistent KV storage via Anna APS (`aps.kv`), bookmarking toggle, instant filtering.

### Phase 11 — Application Tracker Subsystem
- `applicationRepository.ts`, `ApplicationsView.tsx`.
- 9-stage status state machine: `saved` → `preparing` → `applied` → `recruiter_contacted` → `interview_scheduled` → `interviewing` → `offer` / `rejected` / `withdrawn`.
- Enforces explicit user application click (no automated auto-apply). Status history timestamps and note-taking.

### Phase 12 — Application Copilot Subsystem
- `applicationCopilot.ts`, Executa `generate_cover_letter` tool.
- Generates grounded, hallucination-free cover letters, direct recruiter outreach DMs, and tailored application question answers.

### Phase 13 & 14 — Interview Copilot & Executa Plugin Suite
- `interviewCopilot.ts`, Executa `generate_interview_questions` & `evaluate_interview_answer` tools.
- STAR framework (Situation, Task, Action, Result) evaluation, scoring (0-100), and improvement tips.

---

## 🧪 How to Test Everything Manually

Follow this step-by-step testing guide to manually test every feature in JobPilot AI.

### 1. Launching the Application & Running Tests

#### Run Automated Vitest Unit Tests
```bash
npm test
```
*Expected Result*: All 34 unit tests across 9 test files pass cleanly with `exit code 0`.

#### Build Production SPA Bundle
```bash
npm run build
```
*Expected Result*: Build completes cleanly, outputting `bundle/index.html` and bundled assets into `bundle/assets/`.

#### Launch Vite Development Server
```bash
npm run dev
```
*Expected Result*: Local server starts at `http://localhost:5173`. Open in any browser.

---

### 2. Manual Testing Workflows

#### Test 1: Navigation & Collapsible Sidebar
1. Open `http://localhost:5173`.
2. Observe the expanded sidebar (`w-64`) displaying the full brand logo `JobPilot_AI_dark.png`.
3. Click the **Collapse Sidebar** button (`PanelLeftClose` icon in Header or bottom of Sidebar).
4. **Verify**:
   - Sidebar smoothly shrinks to compact width (`w-20`).
   - Logo switches to compact icon `JobPilot.png`.
   - Navigation links display centered icons with hover tooltip titles.
5. Click **Expand Sidebar**.
   - **Verify**: Sidebar expands back to full width with `JobPilot_AI_dark.png`.

#### Test 2: Candidate Profile Setup & Resume Upload
1. Click **My Profile** in the sidebar (or **Setup Profile** button in Header).
2. Click **Upload Resume** tab.
3. Select a sample PDF or DOCX file (or paste resume text).
4. Click **Parse Resume with AI**.
5. **Verify**:
   - Profile fields (Name, Title, Years of Exp, Skills, Experience) populate automatically.
   - Click **Confirm & Activate Profile**.
   - Header status chip changes from `Setup Profile` (amber) to `Profile Active` (emerald).

#### Test 3: Live Job Search & Deduplication
1. Click **Job Search** in sidebar.
2. Type `React` or `.NET` or `Engineer` in search box and select location `Hyderabad` or `Remote`.
3. Click **Search Jobs**.
4. **Verify**:
   - Job cards render with title, company, location, remote tags, and freshness badges.
   - Click **Bookmark / Save Job** icon on a job card.
   - Observe the saved jobs count badge increment in the Sidebar next to **Saved Jobs**.

#### Test 4: AI Job Analysis & Deterministic Match Scoring
1. On any job card in **Job Search**, click **Analyze & Match**.
2. **Verify**:
   - A detailed breakdown displays overall Match Score (e.g. `85% Match`).
   - Breakdown shows 6 vectors: Skills (40%), Experience (20%), Role (15%), Location (10%), Seniority (10%), Education (5%).
   - Highlights matched skills (green chips) and missing skills (amber chips).

#### Test 5: Application Copilot (Cover Letter & Recruiter DM Generator)
1. On an analyzed job card or saved job, click **Generate Cover Letter**.
2. **Verify**:
   - Tailored cover letter is generated, grounded in candidate profile data.
   - Click **Copy to Clipboard**.
   - Click **Generate Recruiter DM** to generate a direct outreach message.

#### Test 6: Application Tracker State Machine
1. Click **Add to Applications** on a job card.
2. Navigate to **Applications** tab in sidebar.
3. **Verify**:
   - Job appears with status `Saved` or `Preparing`.
   - Change status dropdown from `Saved` → `Applied` → `Interviewing`.
   - Observe status badge color change and timestamp update in status history.

#### Test 7: Interview Copilot & Mock Simulator
1. Click **Interview Copilot** in sidebar.
2. Select a target job title or role.
3. Click **Generate Interview Questions**.
4. **Verify**:
   - 4 categorized questions appear (Technical, Behavioral, Role Alignment, Project Experience).
5. Select a question (e.g. "Describe a production performance issue you resolved").
6. Type a detailed STAR answer (e.g., "Situation: slow database queries... Task: reduce latency... Action: indexed tables & added Redis... Result: latency dropped 80%").
7. Click **Submit Answer for AI Feedback**.
8. **Verify**:
   - Scores answer out of 100 with feedback on STAR structure, technical correctness, and improvement tips.
