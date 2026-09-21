# NexusIntel - Tactical Sci-Fi OSINT & Recon Platform

[![GitHub](https://img.shields.io/badge/GitHub-pavanbabuk%2Fnexus--intel-00f2fe?logo=github)](https://github.com/pavanbabuk/nexus-intel)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.10%2B-brightgreen.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.2%2B-61dafb.svg)](https://react.dev)
[![Three.js](https://img.shields.io/badge/Three.js-3D%20Globe-black.svg)](https://threejs.org)

**NexusIntel** is an open-source, next-generation Open Source Intelligence (OSINT) and cyber reconnaissance platform inspired by **Palantir Gotham**, **SpiderFoot**, **OpenCTI**, and **Maltego**.

Designed with a high-immersion **tactical cyberpunk HUD**, it combines asynchronous analyzers, event-driven cascading, an interactive force-directed graph canvas (Cytoscape.js), an orthographic **3D Threat Globe** (Three.js), and an autonomous **AI Reasoning Copilot (Project CORTEX)** mapped directly to the **MITRE ATT&CK Enterprise Matrix**.

---

## ⚡ 6 Killer Sci-Fi OSINT Features

### 1. 🔊 Cyberpunk Audio Telemetry HUD & Quake Command Console (`Ctrl+K` / `~`)
- **Zero-Latency Web Audio Synthesizer:** Pure browser `AudioContext` generating tactical clicks, radar blips, warning sirens, and laser layout sweeps without external audio assets.
- **Quake Drop-down Terminal:** Press `Ctrl+K` or `~` to trigger a fast keyboard-driven command palette (`:scan <target>`, `:globe`, `:graph`, `:filter <term>`, `:layout <type>`, `:crt`, `:audio`, `:scorecard`, `:cortex`, `:export`).
- **Retro CRT Phosphor Scanlines:** Toggleable hardware-accelerated retro CRT scanline raster overlay.

### 2. ⚡ Cloudflare & WAF Origin IP Hunter ("Direct-to-Metal Sonar")
- **Origin IP Unmasking:** Bypasses reverse proxies (Cloudflare, Akamai, CloudFront) to uncover the real backend hosting server.
- **Pure Python MMH3 Favicon Hasher:** Computes 32-bit MurmurHash3 on base64 favicon bytes (`http.favicon.hash:<hash>`) with zero C/C++ compilation overhead for instant Shodan/Censys correlation.
- **MX & Direct Subdomain Probing:** Probes unproxied DNS hostnames (`mail`, `direct`, `origin`, `cpanel`, `dev`, `stage`) and validates response headers via direct HTTP requests with host spoofing.

### 3. 🌐 3D Orthographic Threat Globe (Three.js)
- **Geospatial Battle Map:** Renders target IP infrastructure across continents on a dark-matter rotating 3D Earth sphere.
- **Extruded Neon Pillars & Cyber Arcs:** Displays exposed origin servers as red beacons and projects quadratic Bezier curves for undersea cable and satellite traceroute hops.
- **Interactive Raycasting:** Click pins on the globe to inspect node attributes in the slide-out drawer.

### 4. 🧠 "Project CORTEX" - Autonomous AI Copilot & MITRE ATT&CK Profiler
- **Cognitive Threat Synthesis:** Correlates hundreds of raw graph nodes into automated tactical hypotheses.
- **MITRE ATT&CK Enterprise Mapping:** Automatically classifies exposed assets into techniques (**T1190** Exploit Public-Facing Application, **T1596** Search Technical Databases, **T1590** Network Information, **T1589** Identity Information, **T1595** Active Scanning).
- **Targeted Recon Dorks:** Synthesizes copy-pasteable Shodan, GitHub, and Google dorks customized to the target.

### 5. 👤 Social Graph De-Anonymizer & Avatar Perceptual Hashing (dHash)
- **Multi-Platform Footprinting:** Probes 16+ developer, crypto, and community platforms (GitHub, GitLab, DockerHub, Dev.to, Keybase, HackerNews, Reddit, Telegram, npm, PyPI, Kaggle, Pastebin, Medium, Substack, Linktree).
- **Avatar dHash Correlation:** Computes 64-bit gradient difference hashes (dHash) of profile photos and cross-links accounts with identical photos using Hamming distance (`<= 5` = 98% operator confidence).

### 6. 🕷️ Dark Web & Infostealer Breach Sonar
- **Passive Leak Auditing:** Scans public paste dumps and credential leak telemetry for compromised corporate emails and credentials.
- **Malware Attribution:** Tags compromised credentials with infostealer botnet family telemetry (*RedLine, Lumma, Vidar*).

### 7. 🔎 Google Hacking Database (GHDB) Recon Matrix (100% Client-Side)
- **Zero Server Footprint & Total Privacy:** 100% browser-native execution (`window.open`) with zero server requests, proxying, or telemetry logging. Queries originate directly from the operator's browser and network.
- **50+ Curated Tactical Dork Templates:** Categorized across 8 operational domains (*Secrets & Configs, Admin & Login Portals, Cloud Storage & Buckets, Vulnerabilities & CVEs, Directory Listing, Leaked Documents, Stack Traces, Source Code*).
- **Multi-Engine Compilation:** Instantly re-compiles dork syntax across **Google, DuckDuckGo, Bing, GitHub Code Search, and Shodan** with 1-click clipboard copying or batch launching.

### 8. 🗖 NOC Battle Station & Multi-View Workspace (Split / PiP / Graph / Globe)
- **Split-Screen 50/50 & PiP:** Real-time synchronized dual-view rendering Cytoscape force-directed graph alongside Three.js 3D threat globe with responsive layout physics.
- **Ambient Tactical Signal Stream:** Streaming real-time telemetry ticker monitoring target events, MITRE TTPs, and discoveries with military timestamps.

### 9. ⚡ Tactical Node Radial Action Wheel & Pivot Engine
- **Orbital Context Menu:** Right-click or tap any node to invoke the 6-sector radial wheel (`Pivot Scan`, `Blast Radius`, `Pin Evidence`, `GHDB Dork`, `Isolate Subgraph`, `Copy Value`).
- **Graph Blast Radius:** Calculates multi-hop reachability from exposed origin IPs/credentials and dims irrelevant infrastructure.

### 10. ⏳ Forensic Time-Travel Scrubber
- **Temporal Replay:** Interactive scrub bar allowing operators to play, pause, and scrub backward through the investigation timeline to watch the topology unfold.
- **Keyframe Discovery Markers:** Visual pings along the scrub bar highlighting critical leak moments.

### 11. 📋 Analyst Evidence Notebook & Standalone Dossier Studio
- **Chain of Custody:** Pin key findings and categorize with tags (`CONFIRMED`, `SUSPECT`, `EXPOSED_ORIGIN`, `CREDENTIAL_LEAK`, `PIVOT_ROOT`).
- **1-Click Declassified HTML Dossier:** Exports a self-contained, standalone single-file HTML report with dark-mode cyberpunk design, classified stamps, and evidence tables.

### 12. 🎨 Multi-Palette HUD Theme Engine
- **4 Operator HUD Themes:** Seamless 1-click toggling between **Cyberpunk Neon**, **Amber Alert NOC**, **Matrix Phosphor**, and **Obsidian Stealth** with matching Web Audio sound frequencies.

---

## 🛠 Tech Stack

- **Backend:** Python 3.10+, FastAPI, Uvicorn, Pydantic v2, dnspython, httpx, aiosqlite, pytest.
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Three.js, Cytoscape.js, Lucide Icons, Web Audio API.
- **Data Persistence:** SQLite (`nexus_intel.db`) storing investigations, entity graphs, and timeline logs.

---

## 🚀 Quickstart

### 1. Launch with One Command
```bash
./run.sh
```
This automatically sets up the Python virtual environment, installs dependencies, builds the React frontend, and starts the server at `http://localhost:8000`.

### 2. Development Mode
To run frontend and backend separately with hot module reloading:

**Backend:**
```bash
source venv/bin/activate
PYTHONPATH=backend uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm run dev
```

Visit the application at `http://localhost:5173`.

---

## 🧪 Testing

Run the automated backend test suite (12 test suites):
```bash
PYTHONPATH=backend ./venv/bin/pytest backend/tests/
```

Verify frontend TypeScript compilation:
```bash
cd frontend && npm run build
```
