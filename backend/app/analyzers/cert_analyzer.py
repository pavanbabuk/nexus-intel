import httpx
from typing import Set
from app.models.schemas import TargetType, EntityType, RelationshipType
from app.analyzers.base import BaseAnalyzer
from app.core.graph import GraphManager

class CertAnalyzer(BaseAnalyzer):
    id = "cert_transparency"
    name = "Certificate Transparency (crt.sh)"
    description = "Passively enumerates subdomains and SSL/TLS issuers via public CT logs."
    supported_targets = [TargetType.DOMAIN]
    is_passive = True

    async def run(self, target: str, target_type: TargetType, graph: GraphManager) -> None:
        clean_target = target.strip().lower()
        if clean_target.startswith("http://"):
            clean_target = clean_target[7:]
        elif clean_target.startswith("https://"):
            clean_target = clean_target[8:]
        clean_target = clean_target.split("/")[0].split(":")[0]

        root_id = f"domain:{clean_target}"
        graph.log(self.id, f"Querying Certificate Transparency logs for %{clean_target}")

        url = f"https://crt.sh/?q=%.{clean_target}&output=json"
        headers = {
            "User-Agent": "NexusIntel-OSINT/1.0 (Defensive Research Scanner)"
        }

        discovered_subdomains: Set[str] = set()
        issuers: Set[str] = set()

        try:
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                resp = await client.get(url, headers=headers)
                if resp.status_code == 200:
                    try:
                        data = resp.json()
                    except Exception:
                        data = []

                    for entry in data[:80]: # Limit to top 80 most recent certificates
                        name_value = entry.get("name_value", "")
                        issuer_name = entry.get("issuer_name", "")

                        # Split multi-domain certificates
                        names = name_value.split("\n")
                        for n in names:
                            n = n.strip().lower()
                            if n.startswith("*."):
                                n = n[2:]
                            if n and n != clean_target and n.endswith(clean_target):
                                discovered_subdomains.add(n)

                        if issuer_name:
                            # Extract O= or CN= from issuer string
                            for part in issuer_name.split(","):
                                part = part.strip()
                                if part.startswith("O=") or part.startswith("CN="):
                                    issuers.add(part[3:].replace('"', ''))

                    graph.log(self.id, f"Discovered {len(discovered_subdomains)} unique subdomains and {len(issuers)} issuers in CT logs")
                else:
                    graph.log(self.id, f"crt.sh returned status {resp.status_code}", "WARNING")

        except Exception as e:
            graph.log(self.id, f"Certificate transparency lookup failed or timed out: {str(e)}", "WARNING")

        # Add subdomains to graph
        for sub in list(discovered_subdomains)[:40]: # Cap at 40 to keep graph responsive
            sub_id = f"subdomain:{sub}"
            graph.add_node(
                node_id=sub_id,
                label=sub,
                entity_type=EntityType.SUBDOMAIN,
                value=sub,
                source_module=self.id,
                confidence=0.95,
                properties={"parent_domain": clean_target}
            )
            graph.add_edge(
                source_id=sub_id,
                target_id=root_id,
                rel_type=RelationshipType.SUBDOMAIN_OF,
                source_module=self.id,
                confidence=0.95
            )

        # Add Certificate Issuers
        for issuer in list(issuers)[:5]:
            cert_id = f"certificate:{issuer.lower().replace(' ', '_')}"
            graph.add_node(
                node_id=cert_id,
                label=f"CA: {issuer}",
                entity_type=EntityType.CERTIFICATE,
                value=issuer,
                source_module=self.id,
                confidence=0.9,
                properties={"role": "certificate_authority"}
            )
            graph.add_edge(
                source_id=root_id,
                target_id=cert_id,
                rel_type=RelationshipType.CERTIFIED_BY,
                source_module=self.id,
                confidence=0.9
            )
