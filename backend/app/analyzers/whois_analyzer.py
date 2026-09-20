import httpx
from app.models.schemas import TargetType, EntityType, RelationshipType
from app.analyzers.base import BaseAnalyzer
from app.core.graph import GraphManager

class WhoisAnalyzer(BaseAnalyzer):
    id = "whois_rdap"
    name = "WHOIS & RDAP Domain Registry"
    description = "Retrieves authoritative ICANN RDAP records, registrar info, and domain lifecycle dates."
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
        graph.log(self.id, f"Querying RDAP registry for {clean_target}")

        url = f"https://rdap.org/domain/{clean_target}"

        try:
            async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    data = resp.json()

                    # Extract events (registration, expiration, last changed)
                    events = {}
                    for event in data.get("events", []):
                        action = event.get("eventAction")
                        date = event.get("eventDate")
                        if action and date:
                            events[action] = date[:10]

                    # Update domain root properties
                    if root_id in graph.nodes:
                        graph.nodes[root_id].properties.update({
                            "registration_date": events.get("registration", "Unknown"),
                            "expiration_date": events.get("expiration", "Unknown"),
                            "last_changed": events.get("last changed", "Unknown"),
                            "handle": data.get("handle")
                        })

                    # Extract Registrar Entity
                    registrar_name = None
                    for entity in data.get("entities", []):
                        roles = entity.get("roles", [])
                        if "registrar" in roles:
                            # Try to find vcard formatted name
                            vcard = entity.get("vcardArray", [])
                            if len(vcard) > 1:
                                for entry in vcard[1]:
                                    if entry[0] == "fn":
                                        registrar_name = entry[3]
                                        break
                            if not registrar_name and "handle" in entity:
                                registrar_name = entity["handle"]

                    if registrar_name:
                        reg_id = f"registrar:{registrar_name.lower().replace(' ', '_')}"
                        graph.add_node(
                            node_id=reg_id,
                            label=f"Registrar: {registrar_name}",
                            entity_type=EntityType.REGISTRAR,
                            value=registrar_name,
                            source_module=self.id,
                            confidence=1.0,
                            properties={"registration_date": events.get("registration")}
                        )
                        graph.add_edge(
                            source_id=root_id,
                            target_id=reg_id,
                            rel_type=RelationshipType.REGISTERED_BY,
                            source_module=self.id,
                            confidence=1.0
                        )

                    graph.log(
                        self.id,
                        f"RDAP data parsed: Registrar '{registrar_name or 'N/A'}', "
                        f"Created: {events.get('registration', 'N/A')}, Expires: {events.get('expiration', 'N/A')}"
                    )
                else:
                    graph.log(self.id, f"RDAP endpoint returned status {resp.status_code}", "DEBUG")

        except Exception as e:
            graph.log(self.id, f"RDAP resolution failed: {str(e)}", "WARNING")
