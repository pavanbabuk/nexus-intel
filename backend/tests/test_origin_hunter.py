import pytest
from unittest.mock import AsyncMock, patch
from app.models.schemas import EntityType, RelationshipType, TargetType
from app.core.graph import GraphManager
from app.analyzers.origin_hunter import (
    OriginHunterAnalyzer,
    is_cloudflare_ip,
    mmh3_32,
    calculate_shodan_favicon_hash
)

def test_mmh3_and_favicon_hash():
    # Verify MurmurHash3 calculation
    assert isinstance(mmh3_32(b"test_payload"), int)
    
    # Test sample favicon bytes
    fake_favicon = b"\x00\x00\x01\x00\x01\x00\x10\x10\x00\x00\x01\x00\x20\x00\x68\x04"
    shodan_hash = calculate_shodan_favicon_hash(fake_favicon)
    assert isinstance(shodan_hash, int)
    assert shodan_hash != 0

def test_cloudflare_ip_detection():
    # Known Cloudflare IP ranges
    assert is_cloudflare_ip("104.16.123.45") is True
    assert is_cloudflare_ip("172.64.0.1") is True
    assert is_cloudflare_ip("108.162.192.1") is True

    # Non-Cloudflare IP ranges
    assert is_cloudflare_ip("8.8.8.8") is False
    assert is_cloudflare_ip("185.199.108.153") is False
    assert is_cloudflare_ip("invalid_ip") is False

@pytest.mark.asyncio
async def test_origin_hunter_mocked_leak():
    analyzer = OriginHunterAnalyzer()
    graph = GraphManager(investigation_id="test-origin", root_target="target.corp", root_type=EntityType.DOMAIN)

    # Mock candidate discovery to return non-CDN origin IP
    candidate_ips = [("198.51.100.22", "MX Host [mail.target.corp]")]

    with patch.object(analyzer, "_harvest_favicon_hash", AsyncMock(return_value=-123456789)), \
         patch.object(analyzer, "_discover_candidate_origin_ips", AsyncMock(return_value=candidate_ips)), \
         patch.object(analyzer, "_probe_direct_origin", AsyncMock(return_value=(True, "HTTP 200 OK (nginx)"))):
        
        await analyzer.run("target.corp", TargetType.DOMAIN, graph)

        # Check that origin_ip node was created
        origin_node = graph.nodes.get("origin_ip:198.51.100.22")
        assert origin_node is not None
        assert origin_node.type == EntityType.ORIGIN_IP
        assert origin_node.confidence >= 0.95
        assert origin_node.properties.get("is_origin_leak") is True
        assert origin_node.properties.get("threat_severity") == "CRITICAL"

        # Check edge
        edges = [e for e in graph.edges.values() if e.target == "origin_ip:198.51.100.22"]
        assert len(edges) == 1
        assert edges[0].properties.get("origin_bypass") is True
