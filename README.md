# NexusIntel - Graph-Native OSINT Intelligence Platform

NexusIntel is an open-source, next-generation Open Source Intelligence (OSINT) and reconnaissance platform inspired by industry benchmarks including **SpiderFoot**, **IntelOwl**, **OpenCTI**, and **Maltego**.

It combines asynchronous passive and active OSINT analyzers, event-driven cascading, an interactive force-directed graph canvas (Cytoscape.js), and multi-standard reporting (STIX 2.1, Cytoscape JSON, and Markdown Dossier reports).

---

## ⚡ Key Features

- 🌐 **Interactive Graph Canvas:** Dynamic node-link visualization with confidence weighting, custom entity coloring, layout switching (CoSE force-directed, concentric, circle, breadthfirst), and camera snapshot export.
- 🎯 **Target Auto-Detection:** Automatically classifies inputs into Domains, IPs, Usernames, URLs, or Emails.
- 🔄 **Event-Driven Cascading:** When a domain yields IP addresses, the platform automatically cascades to enrich geolocation, ASN, and network boundaries.
- 🔍 **Pluggable Analyzers:**
  - **DNS & Nameserver Resolver (`dns_resolver`):** Authoritative A, AAAA, MX, NS, TXT, and CNAME enumeration.
  - **Certificate Transparency (`cert_transparency`):** Passive subdomain harvesting and CA identification via `crt.sh`.
  - **IP Geolocation & ASN (`ip_enrichment`):** Geographic location, Autonomous System Numbers (ASNs), and network prefixes.
  - **WHOIS & RDAP Domain Registry (`whois_rdap`):** ICANN RDAP domain lifecycle, creation/expiration dates, and registrar identification.
  - **HTTP & Technology Profiler (`http_profiler`):** Web server detection, CDN/WAF detection (Cloudflare, etc.), and security header auditing (HSTS, CSP, X-Frame-Options).
  - **Identity & Social Footprinter (`username_footprint`):** Multi-platform presence auditing across GitHub, GitLab, Reddit, Dev.to, HackerNews, Medium, Keybase, and Docker Hub.
  - **URL Unfurl & Redirect Tracer (`url_unfurl`):** Tracking token isolation (`utm_*`, `fbclid`), parameter deconstruction, and multi-hop HTTP redirect inspection.
- 📄 **Multi-Format Export & Compliance:**
  - **STIX 2.1:** OASIS Cyber Threat Intelligence bundle format with Observables and Relationships.
  - **Markdown Intelligence Dossier:** Executive briefing tables and audit logs.
  - **Cytoscape JSON:** Full node and edge payload for external graph analytics.

---

## 🛠 Tech Stack

- **Backend:** Python 3, FastAPI, Uvicorn, Pydantic v2, dnspython, httpx, aiosqlite, pytest.
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Cytoscape.js, Lucide Icons.
- **Data Persistence:** SQLite (`nexus_intel.db`) storing investigations, entity graphs, and timeline event logs.

---

## 🚀 Quickstart

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Launch with One Command
```bash
./run.sh
```
This automatically sets up the Python virtual environment, builds the React frontend, and starts the unified server at `http://localhost:8000`.

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

Run the automated backend test suite:
```bash
PYTHONPATH=backend ./venv/bin/pytest backend/tests/
```

---

## 🗺 Grand Roadmap

- [x] **Phase 1: Foundation & Core Ingestion Hub** (FastAPI, SQLite, BaseAnalyzer architecture, DNS, Certs, IP/ASN, Whois/RDAP, HTTP Profiler, Username Footprinting, URL Unfurl).
- [x] **Phase 2: Graph Canvas & Timeline** (Cytoscape.js canvas, confidence scoring, entity inspector drawer, STIX 2.1 & Markdown exports).
- [ ] **Phase 3: Deep Modules & Proxying** (Tor / residential proxy rotator, headless Playwright page captures, ExifTool metadata parsing, dark web `.onion` passive search).
- [ ] **Phase 4: AI Enrichment & Entity Resolution** (Local LLM / Ollama integration for NER extraction from raw HTML, entity merge deduplication).
- [ ] **Phase 5: Enterprise TIP & Watchtower** (OpenCTI connector, MISP export, scheduled diff alert monitors).
