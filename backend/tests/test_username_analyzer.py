import pytest
from unittest.mock import AsyncMock, patch
from app.models.schemas import EntityType, TargetType, RelationshipType
from app.core.graph import GraphManager
from app.analyzers.username_analyzer import (
    UsernameAnalyzer,
    compute_dhash_bytes,
    hamming_distance
)

def test_dhash_and_hamming_distance():
    bytes1 = b"A" * 128
    bytes2 = b"A" * 128
    bytes3 = b"B" * 64 + b"C" * 64

    hash1 = compute_dhash_bytes(bytes1)
    hash2 = compute_dhash_bytes(bytes2)
    hash3 = compute_dhash_bytes(bytes3)

    assert hash1 == hash2
    assert hamming_distance(hash1, hash2) == 0
    assert isinstance(hamming_distance(hash1, hash3), int)

@pytest.mark.asyncio
async def test_username_analyzer_avatar_correlation():
    analyzer = UsernameAnalyzer()
    graph = GraphManager(investigation_id="test-user", root_target="shadow_recon", root_type=EntityType.USERNAME)

    # Mock two platforms returning profiles with identical avatars
    identical_hash = "abcdef1234567890"

    mock_profiles = [
        {
            "platform": "GitHub",
            "url": "https://github.com/shadow_recon",
            "category": "Developer",
            "avatar_url": "https://avatars.githubusercontent.com/u/123",
            "details": {"name": "Shadow"}
        },
        {
            "platform": "Dev.to",
            "url": "https://dev.to/shadow_recon",
            "category": "Blogging",
            "avatar_url": "https://dev-to-uploads.s3.amazonaws.com/uploads/user/123.jpg",
            "details": {"summary": "Hacker"}
        }
    ]

    with patch.object(analyzer, "_check_platform") as mock_check, \
         patch.object(analyzer, "_fetch_avatar_hash", AsyncMock(return_value=identical_hash)):
        
        mock_check.side_effect = [
            mock_profiles[0],
            mock_profiles[1],
            *[None] * 20
        ]

        await analyzer.run("shadow_recon", TargetType.USERNAME, graph)

        # Verify profiles created
        gh_node = graph.nodes.get("social_profile:github_shadow_recon")
        dev_node = graph.nodes.get("social_profile:dev.to_shadow_recon")
        assert gh_node is not None
        assert dev_node is not None
        assert gh_node.properties.get("avatar_dhash") == identical_hash

        # Verify cross-platform ASSOCIATED_WITH edge created for matching avatars!
        assoc_edges = [
            e for e in graph.edges.values()
            if e.type == RelationshipType.ASSOCIATED_WITH
        ]
        assert len(assoc_edges) >= 1
        assert assoc_edges[0].properties.get("avatar_match") is True
        assert assoc_edges[0].confidence >= 0.95
