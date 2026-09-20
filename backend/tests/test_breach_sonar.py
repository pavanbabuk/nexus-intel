import pytest
from unittest.mock import AsyncMock, patch
from app.models.schemas import EntityType, TargetType, RelationshipType
from app.core.graph import GraphManager
from app.analyzers.breach_sonar import BreachSonarAnalyzer

@pytest.mark.asyncio
async def test_breach_sonar_leak_detection():
    analyzer = BreachSonarAnalyzer()
    graph = GraphManager(investigation_id="test-breach", root_target="target.corp", root_type=EntityType.DOMAIN)

    mock_pastes = [
        {
            "id": "AbCdEf12",
            "title": "Pastebin Dump #AbCdEf12",
            "url": "https://pastebin.com/AbCdEf12",
            "date": "2026-09-18"
        }
    ]

    mock_breaches = [
        {
            "email": "target.corp",
            "breach_name": "Infostealer Lumma Dumps",
            "malware_family": "Account Breach"
        }
    ]

    with patch.object(analyzer, "_search_public_pastes", AsyncMock(return_value=mock_pastes)), \
         patch.object(analyzer, "_check_breach_telemetry", AsyncMock(return_value=mock_breaches)):
        
        await analyzer.run("target.corp", TargetType.DOMAIN, graph)

        # Check that leak paste node was added
        paste_node = graph.nodes.get("leak:paste_AbCdEf12")
        assert paste_node is not None
        assert paste_node.properties.get("is_leak") is True
        assert paste_node.properties.get("threat_severity") == "HIGH"

        # Check edge
        edges = [e for e in graph.edges.values() if e.target == "leak:paste_AbCdEf12"]
        assert len(edges) == 1
        assert edges[0].properties.get("breach_exposure") is True
