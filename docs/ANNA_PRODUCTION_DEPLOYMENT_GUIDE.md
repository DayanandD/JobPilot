# 🚀 JobPilot AI — Anna AI OS Production Deployment & Execution Guide

This guide provides step-by-step instructions for deploying, installing, and running **JobPilot AI** inside the **Anna AI OS Production App Runtime**.

---

## 📋 Prerequisites

1. **Node.js** (v18+ or v20+) and **npm** installed.
2. **Python** (3.9+ or 3.11+) installed (required for the Executa stdio JSON-RPC 2.0 plugin).
3. **Anna AI OS** desktop environment or **Antigravity CLI (`agy`)** installed on your system.

---

## 🛠️ Step 1: Build the Production App Bundle

Before installing or running inside Anna AI OS, compile the production single-page app (SPA) bundle:

```bash
# Navigate to project directory
cd e:\project\project\R_D_Projects\JobPilot

# Run TypeScript check and Vite production build
npm run build
```

### Output Verification:
Verify that Vite creates the `bundle/` directory containing:
- `bundle/index.html` (main SPA entry point)
- `bundle/assets/` (bundled JS, CSS, logos, favicons)

---

## ⚙️ Step 2: Verify Manifest & App Specifications

Ensure the root configuration files are properly configured:

### 1. `manifest.json` (Schema 3):
```json
{
  "schema": 3,
  "required_executas": [
    {
      "tool_id": "tool-dev-jobpilot"
    }
  ],
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
  "ui": {
    "bundle": {
      "format": "static-spa",
      "entry": "index.html"
    }
  }
}
```

### 2. `app.json`:
```json
{
  "name": "JobPilot AI",
  "slug": "jobpilot",
  "tagline": "AI Job Search & Application Copilot",
  "category": "productivity",
  "bundled_executas": {
    "jobpilot": {
      "path": "executas/jobpilot"
    }
  }
}
```

### 3. `executas/jobpilot/plugin.py`:
Ensure `plugin.py` is executable and python is accessible in your system path.

---

## 🚀 Step 3: Launch & Connect in Anna AI OS

### Method A: Live Developer Mode with Anna CLI (`agy`)

Use the `agy` CLI to start an Anna AI OS dev session:

```bash
# Register and launch JobPilot in Anna dev container
agy app dev .
```

What `agy app dev` does:
1. Starts the host Executa JSON-RPC 2.0 python process (`executas/jobpilot/plugin.py`).
2. Mounts the compiled `bundle/` folder inside the sandboxed Anna App Container.
3. Injects `window.AnnaAppRuntime` into the browser window context.
4. Opens the JobPilot AI application window inside Anna AI OS.

---

### Method B: Install to Anna App Launcher / App Store

To permanently install JobPilot AI as an application inside your Anna AI OS desktop workspace:

```bash
# Install package to local Anna AI OS app registry
agy app install .
```

After installation:
1. Open **Anna AI OS Desktop Launcher**.
2. Click **JobPilot AI** icon in the Productivity app directory.
3. Anna AI OS opens JobPilot in a native sandboxed desktop window.

---

## 🔍 Step 4: Verify Anna SDK Connection Sequence

When JobPilot launches inside the Anna AI OS window:

1. **Global Injection**: Anna AI OS automatically injects `window.AnnaAppRuntime` into the window context before the React app boots.
2. **Handshake**: `AppLayout.tsx` calls `initAnnaClient()`, which executes:
   ```ts
   const connectedRuntime = await window.AnnaAppRuntime.connect();
   ```
3. **Capability Negotiation**: The runtime grants access to Anna Host APIs:
   - `llm.complete`: Anna LLM model access
   - `tools.invoke`: Python Executa `parse_resume`, `analyze_job`, etc.
   - `upload.inline`: Anna File Storage
   - `aps.kv`: Anna Persistent Storage
   - `web.search / web.fetch`: Live Web Discovery
4. **Header Connection Chip**:
   - In the top-right header, observe the status chip change to **`Anna OS Ready`** (with an emerald CPU icon).

---

## 🧪 Step 5: Test Real Production Workflows

Once **`Anna OS Ready`** is displayed:

### 1. Real Resume Upload & AI Parsing:
- Go to **My Profile** > **Upload Resume**.
- Select a PDF or DOCX file (<10MB).
- `pdfjs-dist` / `mammoth` extracts readable text page streams.
- Invokes Executa `parse_resume` tool via `runtime.tools.invoke()`.
- Extracts structured Candidate Profile data into UI fields.
- Review and click **Confirm & Save Profile**.

### 2. Real Job Discovery & Matching:
- Go to **Job Search** and search for `React` or `.NET`.
- Click **Analyze & Match** to run the 6-Vector Match Engine against live requirements.

### 3. Application Copilot & Cover Letter:
- Click **Generate Cover Letter** to invoke Anna LLM for grounded outreach text.
