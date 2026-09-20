import httpx
from urllib.parse import urlparse, parse_qs
from app.models.schemas import TargetType, EntityType, RelationshipType
from app.analyzers.base import BaseAnalyzer
from app.core.graph import GraphManager

class UnfurlAnalyzer(BaseAnalyzer):
    id = "url_unfurl"
    name = "URL Unfurl & Redirect Tracer"
    description = "Deconstructs query parameters, traces HTTP redirect hops, and detects marketing trackers."
    supported_targets = [TargetType.URL]
    is_passive = False

    async def run(self, target: str, target_type: TargetType, graph: GraphManager) -> None:
        url = target.strip()
        if not (url.startswith("http://") or url.startswith("https://")):
            url = f"https://{url}"

        root_id = f"url:{url.lower()}"
        graph.log(self.id, f"Unfurling URL and following redirect chain: {url}")

        parsed = urlparse(url)
        domain = parsed.netloc.split(":")[0]

        # Connect URL to its Domain
        if domain:
            dom_id = f"domain:{domain.lower()}"
            graph.add_node(
                node_id=dom_id,
                label=f"Domain: {domain}",
                entity_type=EntityType.DOMAIN,
                value=domain,
                source_module=self.id,
                confidence=1.0
            )
            graph.add_edge(
                source_id=root_id,
                target_id=dom_id,
                rel_type=RelationshipType.POINTS_TO,
                source_module=self.id,
                confidence=1.0
            )

        # Parse query params
        query_params = parse_qs(parsed.query)
        trackers = {}
        for k, v in query_params.items():
            if k.lower().startswith("utm_") or k.lower() in ["fbclid", "gclid", "ref", "aff"]:
                trackers[k] = v[0] if v else ""

        if trackers:
            graph.nodes[root_id].properties["tracking_parameters"] = trackers
            graph.log(self.id, f"Detected {len(trackers)} tracking / campaign parameter(s)")

        # Trace redirects
        try:
            async with httpx.AsyncClient(timeout=8.0, follow_redirects=False) as client:
                curr_url = url
                hop_count = 0
                max_hops = 5

                while hop_count < max_hops:
                    resp = await client.head(curr_url, headers={"User-Agent": "Mozilla/5.0 NexusIntel/1.0"})
                    if resp.status_code in [301, 302, 303, 307, 308]:
                        next_url = resp.headers.get("Location")
                        if not next_url:
                            break
                        hop_count += 1
                        graph.log(self.id, f"Hop {hop_count} ({resp.status_code}): {curr_url} -> {next_url}")

                        next_id = f"url:{next_url.lower()}"
                        graph.add_node(
                            node_id=next_id,
                            label=f"Redirect Hop #{hop_count}",
                            entity_type=EntityType.URL,
                            value=next_url,
                            source_module=self.id,
                            confidence=0.98,
                            properties={"http_status": resp.status_code, "hop_number": hop_count}
                        )
                        graph.add_edge(
                            source_id=f"url:{curr_url.lower()}",
                            target_id=next_id,
                            rel_type=RelationshipType.POINTS_TO,
                            source_module=self.id,
                            confidence=0.98,
                            properties={"status_code": resp.status_code}
                        )
                        curr_url = next_url
                    else:
                        break

                graph.nodes[root_id].properties["redirect_hops"] = hop_count
        except Exception as e:
            graph.log(self.id, f"URL redirect tracing failed: {str(e)}", "DEBUG")
