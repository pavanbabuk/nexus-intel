import pytest
from app.models.schemas import EntityNode, EntityEdge, EntityType, RelationshipType
from app.core.cortex import generate_cortex_report

def test_generate_cortex_report():
    nodes = [
        EntityNode(
            id="domain:corp.com",
            label="corp.com",
            type=EntityType.ROOT_TARGET,
            value="corp.com",
            source_module="test",
            properties={"is_root": True}
        ),
        EntityNode(
            id="origin_ip:198.51.100.44",
            label="ORIGIN: 198.51.100.44",
            type=EntityType.ORIGIN_IP,
            value="198.51.100.44",
            source_module="origin_hunter",
            properties={"is_origin_leak": True, "discovered_via": "MX Host [mail.corp.com]"}
        ),
        EntityNode(
            id="subdomain:stage.corp.com",
            label="stage.corp.com",
            type=EntityType.SUBDOMAIN,
            value="stage.corp.com",
            source_module="cert_transparency"
        ),
        EntityNode(
            id="technology:favicon_mmh3_12345",
            label="Favicon MMH3: 12345",
            type=EntityType.TECHNOLOGY,
            value="12345",
            source_module="origin_hunter",
            properties={"shodan_dork": "http.favicon.hash:12345"}
        )
    ]

    edges = [
        EntityEdge(
            id="e1",
            source="domain:corp.com",
            target="origin_ip:198.51.100.44",
            type=RelationshipType.RESOLVES_TO,
            source_module="origin_hunter"
        )
    ]

    report = generate_cortex_report(target="corp.com", nodes=nodes, edges=edges)

    assert report.target == "corp.com"
    assert report.risk_level == "CRITICAL"  # because origin IP is exposed
    assert len(report.mitre_ttps) > 0

    # Verify T1190 is flagged
    t1190 = next((t for t in report.mitre_ttps if t.t_id == "T1190"), None)
    assert t1190 is not None
    assert t1190.severity == "CRITICAL"

    # Verify hypothesis contains origin leak
    assert any("Unproxied Origin" in h.title for h in report.hypotheses)

    # Verify Shodan and GitHub dorks are generated
    assert any("http.favicon.hash:12345" in d.query for d in report.recommended_dorks)
    assert any("filename:.env" in d.query for d in report.recommended_dorks)
