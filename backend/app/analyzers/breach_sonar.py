import re
import httpx
import asyncio
from typing import List, Dict, Any, Optional
from app.models.schemas import TargetType, EntityType, RelationshipType
from app.analyzers.base import BaseAnalyzer
from app.core.graph import GraphManager

# Common public paste & leak dump endpoints for passive footprinting
PUBLIC_LEAK_INDEX_APIS = [
    {
        "name": "Pastebin Dump Monitor",
        "url": "https://psbdmp.ws/api/search/{term}",
        "type": "paste_search"
    }
]

class BreachSonarAnalyzer(BaseAnalyzer):
    """
    Dark Web & Infostealer Breach Sonar.
    Passively scans public leak archives, paste dumps, and credential breach telemetry
    for compromised corporate emails, hashes, and stealer log entries.
    """

    id: str = "breach_sonar"
    name: str = "Dark Web & Breach Sonar"
    description: str = "Passive sonar scanning public leak repositories, pastebin dumps, and compromised credential telemetry."
    supported_targets: List[TargetType] = [TargetType.DOMAIN, TargetType.EMAIL]
    is_passive: bool = True

    async def run(self, target: str, target_type: TargetType, graph: GraphManager) -> None:
        clean_target = target.strip().lower()
        root_id = f"{EntityType.DOMAIN.value if target_type == TargetType.DOMAIN else EntityType.ROOT_TARGET.value}:{clean_target}"
        graph.log(self.id, f"Initializing Dark Web & Breach Sonar audit for [{clean_target}]...")

        async with httpx.AsyncClient(timeout=4.0, follow_redirects=True) as client:
            # 1. Search public pastebin monitor for domain leaks
            leaks = await self._search_public_pastes(client, clean_target, graph)

            # 2. Check corporate email breach exposure
            compromised_identities = await self._check_breach_telemetry(client, clean_target, graph)

        total_findings = len(leaks) + len(compromised_identities)

        if total_findings == 0:
            graph.log(self.id, f"Sonar sweep complete. No active credential dump telemetry identified for [{clean_target}].")
            return

        graph.log(
            self.id,
            f"⚠️ DETECTED {total_findings} LEAK RECORD(S) in public dump telemetry for [{clean_target}]!",
            level="WARNING"
        )

        for leak in leaks:
            paste_id = leak["id"]
            node_id = f"leak:paste_{paste_id}"
            graph.add_node(
                node_id=node_id,
                label=f"Leak: {leak['title']}",
                entity_type=EntityType.DNS_RECORD,  # mapped to record observable
                value=leak["url"],
                source_module=self.id,
                confidence=0.88,
                properties={
                    "is_leak": True,
                    "paste_url": leak["url"],
                    "leak_type": "Public Paste Dump",
                    "threat_severity": "HIGH",
                    "date": leak.get("date")
                }
            )

            graph.add_edge(
                source_id=root_id,
                target_id=node_id,
                rel_type=RelationshipType.ASSOCIATED_WITH,
                source_module=self.id,
                confidence=0.88,
                properties={"breach_exposure": True}
            )

        for comp in compromised_identities:
            node_id = f"leak:credential_{comp['email']}"
            graph.add_node(
                node_id=node_id,
                label=f"Compromised: {comp['email']}",
                entity_type=EntityType.USERNAME,
                value=comp["email"],
                source_module=self.id,
                confidence=0.95,
                properties={
                    "is_breach": True,
                    "breach_name": comp.get("breach_name", "Infostealer Log Dump"),
                    "threat_severity": "CRITICAL",
                    "malware_family": comp.get("malware_family", "RedLine/Lumma")
                }
            )

            graph.add_edge(
                source_id=root_id,
                target_id=node_id,
                rel_type=RelationshipType.ASSOCIATED_WITH,
                source_module=self.id,
                confidence=0.95,
                properties={"leaked_credentials": True}
            )

    async def _search_public_pastes(self, client: httpx.AsyncClient, query: str, graph: GraphManager) -> List[Dict[str, Any]]:
        findings = []
        try:
            url = f"https://psbdmp.ws/api/search/{query}"
            resp = await client.get(url, headers={"User-Agent": "NexusIntel-BreachSonar/1.0"})
            if resp.status_code == 200:
                data = resp.json()
                data_list = data if isinstance(data, list) else data.get("data", [])
                for item in data_list[:5]:
                    pid = item.get("id") or item.get("key")
                    if pid:
                        findings.append({
                            "id": pid,
                            "title": f"Pastebin Dump #{pid[:8]}",
                            "url": f"https://pastebin.com/{pid}",
                            "date": item.get("time") or item.get("date")
                        })
        except Exception:
            pass
        return findings

    async def _check_breach_telemetry(self, client: httpx.AsyncClient, domain_or_email: str, graph: GraphManager) -> List[Dict[str, Any]]:
        """Passive lookup for known breach appearances."""
        results = []
        try:
            # Check HIBP-style public API endpoint
            if "@" in domain_or_email:
                encoded = domain_or_email
                url = f"https://haveibeenpwned.com/api/v3/breachedaccount/{encoded}?truncateResponse=false"
                resp = await client.get(url, headers={"User-Agent": "NexusIntel-OSINT"})
                if resp.status_code == 200:
                    for b in resp.json()[:3]:
                        results.append({
                            "email": domain_or_email,
                            "breach_name": b.get("Name", "Corporate Leak"),
                            "malware_family": "Account Breach"
                        })
        except Exception:
            pass
        return results
