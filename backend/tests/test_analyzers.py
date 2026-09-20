import pytest
import os
from app.models.schemas import EntityType, RelationshipType, TargetType
from app.core.graph import GraphManager
from app.core.db import init_db, save_investigation, get_investigation
from app.analyzers import detect_target_type, get_all_analyzers, get_analyzer
from app.analyzers.unfurl_analyzer import UnfurlAnalyzer

@pytest.mark.asyncio
async def test_target_type_detection():
    assert detect_target_type("example.com") == TargetType.DOMAIN
    assert detect_target_type("8.8.8.8") == TargetType.IP
    assert detect_target_type("https://github.com/torvalds?tab=repositories") == TargetType.URL
    assert detect_target_type("john_doe_99") == TargetType.USERNAME
    assert detect_target_type("admin@company.org") == TargetType.EMAIL

@pytest.mark.asyncio
async def test_graph_manager_and_deduplication():
    graph = GraphManager(investigation_id="test-123", root_target="test.com", root_type=EntityType.DOMAIN)
    assert len(graph.nodes) == 1

    # Add IP node
    ip_node = graph.add_node(
        node_id="ip:1.1.1.1",
        label="IP 1.1.1.1",
        entity_type=EntityType.IP,
        value="1.1.1.1",
        source_module="test_module",
        confidence=0.9,
        properties={"city": "San Francisco"}
    )
    assert ip_node.value == "1.1.1.1"

    # Add duplicate IP node with new property -> should merge, not duplicate
    merged = graph.add_node(
        node_id="ip:1.1.1.1",
        label="IP 1.1.1.1",
        entity_type=EntityType.IP,
        value="1.1.1.1",
        source_module="test_module_2",
        confidence=0.95,
        properties={"isp": "Cloudflare"}
    )
    assert len(graph.nodes) == 2
    assert merged.properties.get("city") == "San Francisco"
    assert merged.properties.get("isp") == "Cloudflare"
    assert merged.confidence == 0.95

    # Connect edge
    edge = graph.add_edge(
        source_id="domain:test.com",
        target_id="ip:1.1.1.1",
        rel_type=RelationshipType.RESOLVES_TO,
        source_module="test_module"
    )
    assert edge is not None
    assert len(graph.edges) == 1

    # Verify Cytoscape formatting
    cyto = graph.to_cytoscape_elements()
    assert len(cyto["nodes"]) == 2
    assert len(cyto["edges"]) == 1

    # Verify STIX bundle formatting
    stix = graph.to_stix_bundle()
    assert stix["type"] == "bundle"
    assert len(stix["objects"]) >= 3 # Identity + 2 observables + relationship

    # Verify Markdown report
    md = graph.to_markdown_report(target="test.com", target_type="domain")
    assert "NexusIntel OSINT Intelligence Dossier" in md
    assert "1.1.1.1" in md

@pytest.mark.asyncio
async def test_unfurl_analyzer_offline():
    graph = GraphManager("unfurl-test", "https://example.com/search?q=osint&utm_source=twitter", EntityType.URL)
    analyzer = UnfurlAnalyzer()
    await analyzer.run("https://example.com/search?q=osint&utm_source=twitter", TargetType.URL, graph)

    # Domain node should have been created
    assert "domain:example.com" in graph.nodes
    # Tracking parameter detected
    root_node = graph.nodes["url:https://example.com/search?q=osint&utm_source=twitter"]
    assert "tracking_parameters" in root_node.properties
    assert "utm_source" in root_node.properties["tracking_parameters"]

@pytest.mark.asyncio
async def test_db_persistence():
    os.environ["NEXUS_DB_PATH"] = ":memory:"
    await init_db()
    await save_investigation(
        inv_id="db-test-01",
        case_name="Case Alpha",
        target="1.1.1.1",
        target_type="ip",
        status="completed",
        created_at="2026-09-18T12:00:00",
        active_analyzers=["ip_enrichment"],
        raw_graph={"nodes": [{"id": "ip:1.1.1.1"}], "edges": []}
    )
    res = await get_investigation("db-test-01")
    assert res is not None
    assert res["case_name"] == "Case Alpha"
    assert res["status"] == "completed"
