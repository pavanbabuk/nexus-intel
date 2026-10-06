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

### 13. 🖼️ Holographic Social Snapshot Studio (Ray.so for Cyber Recon & Roasting)
- **1-Click High-Res Canvas Card Generator:** Exports pixel-perfect cards formatted for **X/Twitter & LinkedIn (1200x630)**, **Square (1080x1080)**, or **TikTok/Stories (1080x1920)**.
- **"Roast My Perimeter" AI Meme Critic:** Generates witty, savage, or corporate threat hygiene summaries based on discovered leaks and letter grades (`A+` to `F`).
- **1-Click Image Clipboard & Viral Tweet:** Uses Clipboard API (`navigator.clipboard.write`) for instant pasting into Twitter/Slack/Discord and pre-fills viral tweet links with badges.

### 14. ⚔️ Head-to-Head "Cyber Duel" Mode (Tale of the Tape)
- **Direct Perimeter Confrontation:** Launch simultaneous dual-target reconnaissance comparing rival organizations (e.g. `openai.com vs anthropic.com`, `uber.com vs lyft.com`, `tesla.com vs rivian.com`).
- **Esports Battle Card & Victor Crown:** Side-by-side metrics confrontation comparing Resilience Scores, Origin Cloaking, Dark Web Breaches, and Attack Surface Area with automated AI referee verdict.
- **1-Click Esports Canvas Battle Card:** Renders 1200x630 split-screen Tale of the Tape card with instant clipboard copy and pre-formatted tweet launch.

### 15. 🔗 Zero-Backend Shareable Permalinks
- **100% Client-Side State Hydration:** Serializes and gzip-compresses the complete investigation graph directly into a URL hash (`#/share=<compressed_payload>`).
- **Instant Interactive Load:** Anyone opening the link experiences the full interactive Three.js 3D Threat Globe and Cytoscape graph immediately without requiring an account or database roundtrip.

### 16. 🛡️ Live GitHub README Posture Badges & Embed Studio
- **Dynamic Posture Badges:** Real-time Shields.io Markdown and custom SVG badges (`[![NexusIntel Posture](...)](...)`) for developers to showcase hardened perimeter security on their GitHub repositories.

### 17. 🦅 Sector Hawk: Image Geolocation & Visual Forensics (North Star Protocol)
- **100% Client-Side EXIF Binary Forensics:** Pure TypeScript parser extracting exact satellite GPS coordinates, altitude, camera make/model, aperture, focal length, ISO, and capture timestamp directly from raw image bytes.
- **Solar Astronomy & Shadow Math:** Calculates solar azimuth and elevation angles using date/coordinates to determine expected shadow directions and scientifically verify photo authenticity.
- **Interactive OpenStreetMap Embed & Reverse Geocoding:** Auto-resolves street address, neighborhood, and city, with 1-click links to Google Maps, Google Earth 3D, and OpenStreetMap.
- **Reverse Visual Search Matrix:** 1-click launchers for **Google Lens, Yandex Visual (landmark & facial matcher), Bing Visual, and TinEye**.
- **1-Click Privacy EXIF Scrubber:** Export sanitized images stripped of GPS tags and device metadata for safe social sharing.
- **Live Test Presets:** Built-in verified test images for instant demonstration (Eiffel Tower Paris, Times Square NYC, Tokyo Tower Japan).

### 18. 👤 Sector: Username Research & Persona Hunter (North Star Protocol)
- **High-Velocity Multi-Platform Footprint Audit:** Probes 30+ major platforms concurrently across Developer, AI/Data Science, Gaming/Esports, Fediverse, and Social ecosystems (GitHub, GitLab, DockerHub, HuggingFace, Codeforces, Chess.com, Lichess, Scratch, Mastodon, Telegram, npm, Dev.to, Replit, SoundCloud, and more).
- **Public Breach Sonar Integration (COMB 3.2 Billion Records):** Real-time queries against the Compilation of Many Breaches index and public stealer telemetry for target handles, displaying leaked accounts and safely masked credentials.
- **Zero-Knowledge k-Anonymity Password Safety Check:** Client-side SHA-1 hash prefix range lookup against HaveIBeenPwned API (only 5 characters ever leave the browser). Allows users to check if their passwords have been exposed in public breaches with 100% mathematical privacy.
- **Deep Link Cytoscape Investigation Pivot:** 1-click import from Persona Hunter directly into the interactive topology graph for automated MITRE ATT&CK and threat profiling.
- **Live Test Presets & Instant Audit:** Instant testing with verified sample handles (`@torvalds`, `@karpathy`, `@gargron`, `@sindresorhus`, `@hikaru`).

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
