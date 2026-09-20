import httpx
import re
from app.models.schemas import TargetType, EntityType, RelationshipType
from app.analyzers.base import BaseAnalyzer
from app.core.graph import GraphManager

class IPAnalyzer(BaseAnalyzer):
    id = "ip_enrichment"
    name = "IP Geolocation & Autonomous System (ASN)"
    description = "Enriches IPv4/IPv6 addresses with ISP, Geolocation, ASN, and organizational data."
    supported_targets = [TargetType.IP, TargetType.DOMAIN]
    is_passive = True

    async def run(self, target: str, target_type: TargetType, graph: GraphManager) -> None:
        ips_to_query = []

        if target_type == TargetType.IP:
            ips_to_query.append(target.strip())
        else:
            # Find IP nodes already in graph from DNS analyzer
            for node in list(graph.nodes.values()):
                if node.type == EntityType.IP:
                    ips_to_query.append(node.value)

        if not ips_to_query:
            graph.log(self.id, "No IP targets found to enrich", "DEBUG")
            return

        graph.log(self.id, f"Enriching {len(ips_to_query)} IP address(es)")

        async with httpx.AsyncClient(timeout=8.0) as client:
            for ip_val in ips_to_query[:5]: # Query first 5 IPs to respect public quotas
                ip_id = f"ip:{ip_val}"
                try:
                    # Query ip-api free json endpoint (no auth required)
                    resp = await client.get(
                        f"http://ip-api.com/json/{ip_val}?fields=status,message,country,city,lat,lon,isp,org,as,asname,query"
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        if data.get("status") == "success":
                            country = data.get("country", "")
                            city = data.get("city", "")
                            isp = data.get("isp", "")
                            org = data.get("org", "")
                            as_info = data.get("as", "")
                            asname = data.get("asname", "")

                            # Update the IP node's properties
                            if ip_id in graph.nodes:
                                graph.nodes[ip_id].properties.update({
                                    "country": country,
                                    "city": city,
                                    "isp": isp,
                                    "lat": data.get("lat"),
                                    "lon": data.get("lon"),
                                    "asn": as_info
                                })

                            # Extract ASN node (e.g. AS15169 Google LLC)
                            asn_match = re.match(r"(AS\d+)", as_info)
                            if asn_match:
                                asn_number = asn_match.group(1)
                                asn_id = f"asn:{asn_number.lower()}"
                                graph.add_node(
                                    node_id=asn_id,
                                    label=f"{asn_number} ({asname or isp})",
                                    entity_type=EntityType.ASN,
                                    value=asn_number,
                                    source_module=self.id,
                                    confidence=1.0,
                                    properties={
                                        "as_name": asname or isp,
                                        "full_as": as_info
                                    }
                                )
                                graph.add_edge(
                                    source_id=ip_id,
                                    target_id=asn_id,
                                    rel_type=RelationshipType.HOSTED_ON,
                                    source_module=self.id,
                                    confidence=1.0
                                )

                            # Extract Organization node if distinct
                            if org and org not in [isp, asname]:
                                org_id = f"organization:{org.lower().replace(' ', '_')}"
                                graph.add_node(
                                    node_id=org_id,
                                    label=f"Org: {org}",
                                    entity_type=EntityType.ORGANIZATION,
                                    value=org,
                                    source_module=self.id,
                                    confidence=0.85
                                )
                                graph.add_edge(
                                    source_id=ip_id,
                                    target_id=org_id,
                                    rel_type=RelationshipType.ASSOCIATED_WITH,
                                    source_module=self.id,
                                    confidence=0.85
                                )

                            graph.log(self.id, f"Enriched {ip_val}: {city}, {country} via {isp} ({as_info})")
                        else:
                            graph.log(self.id, f"IP lookup failed for {ip_val}: {data.get('message')}", "DEBUG")
                except Exception as e:
                    graph.log(self.id, f"IP enrichment exception for {ip_val}: {str(e)}", "WARNING")
