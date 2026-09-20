import uuid
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
from app.models.schemas import EntityNode, EntityEdge, EntityType, RelationshipType, InvestigationLog

class GraphManager:
    """Manages an in-memory graph representation of an investigation with persistence helpers."""

    def __init__(self, investigation_id: str, root_target: str, root_type: EntityType):
        self.investigation_id = investigation_id
        self.nodes: Dict[str, EntityNode] = {}
        self.edges: Dict[str, EntityEdge] = {}
        self.logs: List[InvestigationLog] = []

        # Add root target node
        root_node_id = f"{root_type.value}:{root_target.lower()}"
        self.add_node(
            node_id=root_node_id,
            label=root_target,
            entity_type=root_type,
            value=root_target,
            source_module="target_input",
            confidence=1.0,
            properties={"is_root": True, "initiated_at": datetime.now(timezone.utc).isoformat()}
        )

    def log(self, module: str, message: str, level: str = "INFO"):
        self.logs.append(InvestigationLog(
            timestamp=datetime.now(timezone.utc).isoformat(),
            level=level,
            module=module,
            message=message
        ))

    def add_node(
        self,
        node_id: str,
        label: str,
        entity_type: EntityType,
        value: str,
        source_module: str,
        confidence: float = 1.0,
        properties: Optional[Dict[str, Any]] = None
    ) -> EntityNode:
        clean_id = node_id.strip()
        props = properties or {}

        if clean_id in self.nodes:
            # Merge properties and preserve highest confidence
            existing = self.nodes[clean_id]
            existing.properties.update(props)
            existing.confidence = max(existing.confidence, confidence)
            return existing

        node = EntityNode(
            id=clean_id,
            label=label,
            type=entity_type,
            value=value,
            confidence=confidence,
            source_module=source_module,
            properties=props
        )
        self.nodes[clean_id] = node
        return node

    def add_edge(
        self,
        source_id: str,
        target_id: str,
        rel_type: RelationshipType,
        source_module: str,
        confidence: float = 1.0,
        properties: Optional[Dict[str, Any]] = None
    ) -> Optional[EntityEdge]:
        # Only add edge if both endpoints exist
        if source_id not in self.nodes or target_id not in self.nodes:
            return None

        edge_id = f"{source_id}->{rel_type.value}->{target_id}"
        props = properties or {}

        if edge_id in self.edges:
            existing = self.edges[edge_id]
            existing.properties.update(props)
            existing.confidence = max(existing.confidence, confidence)
            return existing

        edge = EntityEdge(
            id=edge_id,
            source=source_id,
            target=target_id,
            type=rel_type,
            confidence=confidence,
            source_module=source_module,
            properties=props
        )
        self.edges[edge_id] = edge
        return edge

    def to_cytoscape_elements(self) -> Dict[str, Any]:
        """Convert graph nodes and edges to standard Cytoscape.js format."""
        cytoscape_nodes = []
        for node in self.nodes.values():
            cytoscape_nodes.append({
                "data": {
                    "id": node.id,
                    "label": node.label,
                    "type": node.type.value,
                    "value": node.value,
                    "confidence": node.confidence,
                    "source_module": node.source_module,
                    **node.properties
                }
            })

        cytoscape_edges = []
        for edge in self.edges.values():
            cytoscape_edges.append({
                "data": {
                    "id": edge.id,
                    "source": edge.source,
                    "target": edge.target,
                    "label": edge.type.value,
                    "type": edge.type.value,
                    "confidence": edge.confidence,
                    "source_module": edge.source_module,
                    **edge.properties
                }
            })

        return {
            "nodes": cytoscape_nodes,
            "edges": cytoscape_edges
        }

    def to_stix_bundle(self) -> Dict[str, Any]:
        """Generate a STIX 2.1 compatible JSON bundle from discovered entities."""
        bundle_id = f"bundle--{uuid.uuid4()}"
        objects: List[Dict[str, Any]] = []

        # System Identity
        identity_id = f"identity--{uuid.uuid4()}"
        objects.append({
            "type": "identity",
            "spec_version": "2.1",
            "id": identity_id,
            "name": "NexusIntel OSINT Platform",
            "identity_class": "system"
        })

        node_stix_map: Dict[str, str] = {}

        # Convert nodes to STIX Observable / Indicator objects
        for node in self.nodes.values():
            stix_id = f"observable--{uuid.uuid4()}"
            node_stix_map[node.id] = stix_id

            stix_type = "x-osint-entity"
            if node.type in [EntityType.DOMAIN, EntityType.SUBDOMAIN]:
                stix_type = "domain-name"
            elif node.type == EntityType.IP:
                stix_type = "ipv4-addr"
            elif node.type == EntityType.URL:
                stix_type = "url"
            elif node.type == EntityType.ORGANIZATION:
                stix_type = "identity"

            objects.append({
                "type": stix_type,
                "spec_version": "2.1",
                "id": stix_id,
                "value": node.value,
                "x_nexus_label": node.label,
                "x_nexus_confidence": node.confidence,
                "x_nexus_source": node.source_module,
                "custom_properties": node.properties
            })

        # Convert edges to STIX Relationship objects
        for edge in self.edges.values():
            src_stix = node_stix_map.get(edge.source)
            tgt_stix = node_stix_map.get(edge.target)
            if src_stix and tgt_stix:
                objects.append({
                    "type": "relationship",
                    "spec_version": "2.1",
                    "id": f"relationship--{uuid.uuid4()}",
                    "source_ref": src_stix,
                    "target_ref": tgt_stix,
                    "relationship_type": edge.type.value.lower().replace("_", "-"),
                    "confidence": int(edge.confidence * 100),
                    "created_by_ref": identity_id
                })

        return {
            "type": "bundle",
            "id": bundle_id,
            "objects": objects
        }

    def to_markdown_report(self, target: str, target_type: str) -> str:
        """Generate a polished Markdown intelligence dossier report."""
        timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

        # Group nodes by entity type
        type_groups: Dict[str, List[EntityNode]] = {}
        for node in self.nodes.values():
            type_groups.setdefault(node.type.value, []).append(node)

        lines = [
            f"# NexusIntel OSINT Intelligence Dossier",
            f"**Target:** `{target}` ({target_type.upper()})  ",
            f"**Generated:** {timestamp}  ",
            f"**Investigation ID:** `{self.investigation_id}`  ",
            f"**Discovered Entities:** {len(self.nodes)} nodes | **Relationships:** {len(self.edges)} edges  ",
            "",
            "---",
            "",
            "## 1. Executive Summary",
            f"An automated Open Source Intelligence assessment was conducted on `{target}`. "
            f"Cross-referencing passive DNS records, Certificate Transparency logs, autonomous systems, "
            f"HTTP fingerprinting, and online identifiers yielded {len(self.nodes)} correlated entities.",
            "",
            "## 2. Entity Inventory by Classification",
            ""
        ]

        for ent_type, node_list in sorted(type_groups.items()):
            lines.append(f"### {ent_type.replace('_', ' ').title()} ({len(node_list)})")
            lines.append("| Entity Label / Value | Confidence | Source Module | Details |")
            lines.append("| :--- | :---: | :--- | :--- |")
            for n in node_list:
                details = ", ".join(f"{k}: {v}" for k, v in n.properties.items() if not k.startswith("is_"))
                lines.append(f"| `{n.value}` | `{int(n.confidence * 100)}%` | {n.source_module} | {details or '-'} |")
            lines.append("")

        lines.extend([
            "## 3. Key Relationships & Linkages",
            "| Source Entity | Relationship | Target Entity | Confidence |",
            "| :--- | :---: | :--- | :---: |"
        ])

        for edge in self.edges.values():
            src_node = self.nodes.get(edge.source)
            tgt_node = self.nodes.get(edge.target)
            src_label = src_node.label if src_node else edge.source
            tgt_label = tgt_node.label if tgt_node else edge.target
            lines.append(f"| `{src_label}` | **{edge.type.value}** | `{tgt_label}` | `{int(edge.confidence * 100)}%` |")

        lines.extend([
            "",
            "## 4. Audit Log & Investigation Timeline",
            "| Timestamp | Level | Module | Event Message |",
            "| :--- | :---: | :--- | :--- |"
        ])

        for l in self.logs[-20:]:
            lines.append(f"| {l.timestamp[:19]} | {l.level} | `{l.module}` | {l.message} |")

        lines.extend([
            "",
            "---",
            "*Report generated by NexusIntel - Open Source Intelligence Workbench.*"
        ])

        return "\n".join(lines)
