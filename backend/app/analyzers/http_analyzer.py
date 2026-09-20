import httpx
from typing import Dict
from app.models.schemas import TargetType, EntityType, RelationshipType
from app.analyzers.base import BaseAnalyzer
from app.core.graph import GraphManager

class HTTPAnalyzer(BaseAnalyzer):
    id = "http_profiler"
    name = "HTTP Security & Technology Profiler"
    description = "Inspects HTTP headers, server signatures, security policies, and web technologies."
    supported_targets = [TargetType.DOMAIN, TargetType.URL]
    is_passive = False

    async def run(self, target: str, target_type: TargetType, graph: GraphManager) -> None:
        if target.startswith("http://") or target.startswith("https://"):
            url = target
            domain_part = target.split("//")[1].split("/")[0].split(":")[0]
        else:
            domain_part = target.split("/")[0].split(":")[0]
            url = f"https://{domain_part}"

        root_id = f"{target_type.value}:{target.lower()}"
        graph.log(self.id, f"Connecting to {url} to inspect headers and technologies")

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 NexusIntel/1.0"
        }

        try:
            async with httpx.AsyncClient(timeout=6.0, follow_redirects=True, verify=False) as client:
                resp = await client.get(url, headers=headers)
                resp_headers: Dict[str, str] = {k.lower(): v for k, v in resp.headers.items()}

                # Extract Server & Powered-By
                server_val = resp_headers.get("server")
                powered_by = resp_headers.get("x-powered-by")
                cf_ray = resp_headers.get("cf-ray")

                techs = []
                if server_val:
                    techs.append(("Server", server_val))
                if powered_by:
                    techs.append(("Framework", powered_by))
                if cf_ray:
                    techs.append(("CDN/WAF", "Cloudflare"))

                # Check security headers
                hsts = "strict-transport-security" in resp_headers
                csp = "content-security-policy" in resp_headers
                xfo = resp_headers.get("x-frame-options", "Missing")

                # Store properties on target node
                if root_id in graph.nodes:
                    graph.nodes[root_id].properties.update({
                        "http_status": resp.status_code,
                        "hsts_enabled": hsts,
                        "csp_enabled": csp,
                        "x_frame_options": xfo,
                        "final_url": str(resp.url)
                    })

                # Create technology nodes
                for tech_category, tech_name in techs:
                    tech_id = f"technology:{tech_name.lower().replace(' ', '_')}"
                    graph.add_node(
                        node_id=tech_id,
                        label=f"{tech_category}: {tech_name}",
                        entity_type=EntityType.TECHNOLOGY,
                        value=tech_name,
                        source_module=self.id,
                        confidence=0.9,
                        properties={"category": tech_category}
                    )
                    graph.add_edge(
                        source_id=root_id,
                        target_id=tech_id,
                        rel_type=RelationshipType.RUNS_ON,
                        source_module=self.id,
                        confidence=0.9
                    )

                graph.log(
                    self.id,
                    f"HTTP response {resp.status_code} ({resp.url.scheme.upper()}). Identified: "
                    f"{', '.join(t[1] for t in techs) or 'Standard Web Server'}"
                )

        except Exception as e:
            graph.log(self.id, f"HTTP profiling failed: {str(e)}", "WARNING")
