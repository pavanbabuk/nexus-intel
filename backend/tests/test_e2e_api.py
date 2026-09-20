import pytest
import os
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_full_api_lifecycle():
    os.environ["NEXUS_DB_PATH"] = ":memory:"
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Health check
        resp = await client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "healthy"

        # 2. List analyzers
        resp = await client.get("/api/analyzers")
        assert resp.status_code == 200
        analyzers = resp.json()
        assert len(analyzers) >= 7
        analyzer_ids = [a["id"] for a in analyzers]
        assert "dns_resolver" in analyzer_ids
        assert "cert_transparency" in analyzer_ids
        assert "ip_enrichment" in analyzer_ids
        assert "whois_rdap" in analyzer_ids
        assert "http_profiler" in analyzer_ids
        assert "username_footprint" in analyzer_ids
        assert "url_unfurl" in analyzer_ids

        # 3. Create investigation on an offline mock target
        resp = await client.post("/api/investigations", json={
            "target": "example.com",
            "case_name": "Test Operation Olympus",
            "enabled_analyzers": ["dns_resolver"]
        })
        assert resp.status_code == 200
        inv = resp.json()
        inv_id = inv["id"]
        assert inv["target"] == "example.com"
        assert inv["status"] in ["running", "completed"]

        # 4. Fetch detail
        resp = await client.get(f"/api/investigations/{inv_id}")
        assert resp.status_code == 200
        detail = resp.json()
        assert detail["id"] == inv_id
        assert len(detail["nodes"]) >= 1

        # 5. Fetch Cytoscape graph
        resp = await client.get(f"/api/investigations/{inv_id}/graph")
        assert resp.status_code == 200
        graph_data = resp.json()
        assert "nodes" in graph_data
        assert "edges" in graph_data

        # 6. Export as Markdown
        resp = await client.get(f"/api/investigations/{inv_id}/export/markdown")
        assert resp.status_code == 200
        assert "NexusIntel OSINT Intelligence Dossier" in resp.text

        # 7. Export as STIX 2.1
        resp = await client.get(f"/api/investigations/{inv_id}/export/stix")
        assert resp.status_code == 200
        stix = resp.json()
        assert stix["type"] == "bundle"

        # 8. Export as JSON
        resp = await client.get(f"/api/investigations/{inv_id}/export/json")
        assert resp.status_code == 200
        assert "nodes" in resp.json()
