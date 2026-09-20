import uuid
import asyncio
from datetime import datetime, timezone
from typing import Dict, List, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks, Response
from fastapi.responses import PlainTextResponse

from app.models.schemas import (
    InvestigationCreate,
    InvestigationSummary,
    InvestigationDetail,
    AnalyzerInfo,
    EntityType,
    TargetType,
    EntityNode,
    EntityEdge,
    CortexReport
)
from app.core.graph import GraphManager
from app.core.scorecard import calculate_security_scorecard
from app.core.cortex import generate_cortex_report
from app.core.db import (
    save_investigation,
    get_investigation,
    list_investigations
)
from app.analyzers import (
    get_all_analyzers,
    get_analyzer,
    detect_target_type
)

router = APIRouter(prefix="/api")

# Active in-memory graph managers for ongoing or recently accessed investigations
ACTIVE_GRAPHS: Dict[str, GraphManager] = {}

async def _execute_investigation(
    inv_id: str,
    case_name: str,
    target: str,
    target_type: TargetType,
    enabled_analyzers: List[str]
):
    graph = ACTIVE_GRAPHS.get(inv_id)
    if not graph:
        return

    graph.log("orchestrator", f"Starting investigation on target: {target} (type: {target_type.value})")

    # Filter analyzers
    selected_analyzers = []
    for a_id in enabled_analyzers:
        analyzer = get_analyzer(a_id)
        if analyzer and analyzer.can_handle(target_type):
            selected_analyzers.append(analyzer)

    if not selected_analyzers:
        graph.log("orchestrator", "No compatible analyzers found for this target type", "WARNING")

    # Step 1: Run primary analyzers in parallel
    graph.log("orchestrator", f"Executing {len(selected_analyzers)} primary analyzer(s)...")
    tasks = [a.run(target, target_type, graph) for a in selected_analyzers]
    await asyncio.gather(*tasks, return_exceptions=True)

    # Step 2: Event-driven cascade (e.g., if target is Domain, IPAnalyzer enriches newly discovered IPs)
    if target_type == TargetType.DOMAIN:
        ip_analyzer = get_analyzer("ip_enrichment")
        if ip_analyzer and "ip_enrichment" in enabled_analyzers:
            graph.log("orchestrator", "Cascading: enriching newly discovered IPs from DNS...")
            await ip_analyzer.run(target, target_type, graph)

    graph.log("orchestrator", f"Investigation completed. Total: {len(graph.nodes)} nodes, {len(graph.edges)} edges.", "SUCCESS")

    # Persist to SQLite
    await save_investigation(
        inv_id=inv_id,
        case_name=case_name,
        target=target,
        target_type=target_type.value,
        status="completed",
        created_at=datetime.now(timezone.utc).isoformat(),
        active_analyzers=enabled_analyzers,
        raw_graph={
            "nodes": [n.model_dump() for n in graph.nodes.values()],
            "edges": [e.model_dump() for e in graph.edges.values()],
            "logs": [l.model_dump() for l in graph.logs]
        }
    )

@router.get("/analyzers", response_model=List[AnalyzerInfo])
async def list_available_analyzers():
    """Returns a list of all registered OSINT analyzers."""
    return [a.info() for a in get_all_analyzers()]

@router.post("/investigations", response_model=InvestigationSummary)
async def create_investigation(payload: InvestigationCreate, background_tasks: BackgroundTasks):
    """Launch a new OSINT investigation session."""
    target_clean = payload.target.strip()
    if not target_clean:
        raise HTTPException(status_code=400, detail="Target cannot be empty")

    target_type = payload.target_type or detect_target_type(target_clean)
    inv_id = str(uuid.uuid4())[:8]
    case_name = payload.case_name or f"Case-{inv_id.upper()} ({target_clean})"

    # Select analyzers
    enabled = payload.enabled_analyzers or [a.id for a in get_all_analyzers()]

    # Map target type to root entity type
    type_map = {
        TargetType.DOMAIN: EntityType.DOMAIN,
        TargetType.IP: EntityType.IP,
        TargetType.USERNAME: EntityType.USERNAME,
        TargetType.URL: EntityType.URL,
        TargetType.EMAIL: EntityType.ROOT_TARGET
    }
    root_entity = type_map.get(target_type, EntityType.ROOT_TARGET)

    # Initialize in-memory GraphManager
    graph = GraphManager(investigation_id=inv_id, root_target=target_clean, root_type=root_entity)
    ACTIVE_GRAPHS[inv_id] = graph

    # Save initial pending state
    created_at = datetime.now(timezone.utc).isoformat()
    await save_investigation(
        inv_id=inv_id,
        case_name=case_name,
        target=target_clean,
        target_type=target_type.value,
        status="running",
        created_at=created_at,
        active_analyzers=enabled,
        raw_graph={
            "nodes": [n.model_dump() for n in graph.nodes.values()],
            "edges": [e.model_dump() for e in graph.edges.values()],
            "logs": [l.model_dump() for l in graph.logs]
        }
    )

    # Dispatch asynchronous investigation job
    background_tasks.add_task(
        _execute_investigation,
        inv_id=inv_id,
        case_name=case_name,
        target=target_clean,
        target_type=target_type,
        enabled_analyzers=enabled
    )

    return InvestigationSummary(
        id=inv_id,
        case_name=case_name,
        target=target_clean,
        target_type=target_type.value,
        created_at=created_at,
        status="running",
        node_count=1,
        edge_count=0
    )

@router.get("/investigations", response_model=List[InvestigationSummary])
async def get_all_investigations():
    """List historical investigations from the database."""
    items = await list_investigations()
    return [InvestigationSummary(**i) for i in items]

@router.get("/investigations/{inv_id}", response_model=InvestigationDetail)
async def get_investigation_detail(inv_id: str):
    """Get full state of an investigation including nodes, edges, and logs."""
    # Check active memory first
    if inv_id in ACTIVE_GRAPHS:
        mgr = ACTIVE_GRAPHS[inv_id]
        nodes_list = list(mgr.nodes.values())
        target_val = nodes_list[0].value if nodes_list else ""
        target_t = list(mgr.nodes.keys())[0].split(":")[0] if mgr.nodes else "domain"
        card = calculate_security_scorecard(nodes_list, target_val, target_t)
        return InvestigationDetail(
            id=inv_id,
            case_name=f"Case-{inv_id}",
            target=target_val,
            target_type=target_t,
            created_at=datetime.now(timezone.utc).isoformat(),
            status="completed" if any(l.level == "SUCCESS" for l in mgr.logs) else "running",
            nodes=nodes_list,
            edges=list(mgr.edges.values()),
            logs=mgr.logs,
            active_analyzers=[a.id for a in get_all_analyzers()],
            scorecard=card
        )

    # Fallback to database
    record = await get_investigation(inv_id)
    if not record:
        raise HTTPException(status_code=404, detail="Investigation not found")

    raw = record.get("raw_graph") or {}
    raw_nodes = [EntityNode(**n) for n in raw.get("nodes", [])]
    raw_edges = [EntityEdge(**e) for e in raw.get("edges", [])]
    card = calculate_security_scorecard(raw_nodes, record["target"], record["target_type"])
    return InvestigationDetail(
        id=record["id"],
        case_name=record["case_name"],
        target=record["target"],
        target_type=record["target_type"],
        created_at=record["created_at"],
        status=record["status"],
        nodes=raw_nodes,
        edges=raw_edges,
        logs=raw.get("logs", []),
        active_analyzers=record["active_analyzers"],
        scorecard=card
    )

@router.get("/investigations/{inv_id}/graph")
async def get_cytoscape_graph(inv_id: str):
    """Retrieve graph formatted specifically for Cytoscape.js canvas rendering."""
    if inv_id in ACTIVE_GRAPHS:
        return ACTIVE_GRAPHS[inv_id].to_cytoscape_elements()

    record = await get_investigation(inv_id)
    if not record:
        raise HTTPException(status_code=404, detail="Investigation not found")

    raw = record.get("raw_graph") or {}
    nodes = [{"data": n} for n in raw.get("nodes", [])]
    edges = [{"data": e} for e in raw.get("edges", [])]
    return {"nodes": nodes, "edges": edges}

@router.get("/investigations/{inv_id}/export/{format}")
async def export_investigation(inv_id: str, format: str):
    """Export investigation as 'json', 'stix', or 'markdown'."""
    mgr = ACTIVE_GRAPHS.get(inv_id)
    if not mgr:
        record = await get_investigation(inv_id)
        if not record:
            raise HTTPException(status_code=404, detail="Investigation not found")

        raw = record.get("raw_graph") or {}
        # Reconstruct manager from persisted data
        target = record["target"]
        t_type = record["target_type"]
        mgr = GraphManager(inv_id, target, EntityType(t_type if t_type in [e.value for e in EntityType] else "root_target"))
        for n in raw.get("nodes", []):
            mgr.add_node(
                node_id=n["id"],
                label=n["label"],
                entity_type=EntityType(n["type"]),
                value=n["value"],
                source_module=n["source_module"],
                confidence=n.get("confidence", 1.0),
                properties=n.get("properties", {})
            )
        for e in raw.get("edges", []):
            mgr.add_edge(
                source_id=e["source"],
                target_id=e["target"],
                rel_type=e["type"],
                source_module=e["source_module"],
                confidence=e.get("confidence", 1.0),
                properties=e.get("properties", {})
            )

    fmt = format.lower()
    if fmt == "stix":
        stix_data = mgr.to_stix_bundle()
        return stix_data
    elif fmt == "markdown":
        md = mgr.to_markdown_report(target=mgr.investigation_id, target_type="observable")
        return PlainTextResponse(content=md, media_type="text/markdown")
    elif fmt == "json":
        return {
            "investigation_id": inv_id,
            "nodes": [n.model_dump() for n in mgr.nodes.values()],
            "edges": [e.model_dump() for e in mgr.edges.values()],
            "logs": [l.model_dump() for l in mgr.logs]
        }
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported format '{format}'. Supported: 'json', 'stix', 'markdown'")

@router.get("/investigations/{inv_id}/cortex", response_model=CortexReport)
async def get_cortex_report(inv_id: str):
    """Generates an autonomous Project CORTEX intelligence brief & MITRE ATT&CK breakdown."""
    mgr = ACTIVE_GRAPHS.get(inv_id)
    target = ""
    nodes = []
    edges = []

    if mgr:
        nodes = list(mgr.nodes.values())
        edges = list(mgr.edges.values())
        root_node = next((n for n in nodes if n.properties.get("is_root")), None)
        target = root_node.value if root_node else inv_id
    else:
        record = await get_investigation(inv_id)
        if not record:
            raise HTTPException(status_code=404, detail="Investigation not found")
        target = record["target"]
        raw = record.get("graph_data", {})
        nodes = [EntityNode(**n) for n in raw.get("nodes", [])]
        edges = [EntityEdge(**e) for e in raw.get("edges", [])]

    return generate_cortex_report(target=target, nodes=nodes, edges=edges)

