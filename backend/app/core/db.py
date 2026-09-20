import os
import json
import aiosqlite
from typing import List, Optional, Dict, Any

DB_PATH = os.environ.get("NEXUS_DB_PATH", "nexus_intel.db")

async def init_db():
    """Initialize database tables for investigations, nodes, and edges."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS investigations (
                id TEXT PRIMARY KEY,
                case_name TEXT NOT NULL,
                target TEXT NOT NULL,
                target_type TEXT NOT NULL,
                status TEXT NOT NULL,
                created_at TEXT NOT NULL,
                active_analyzers TEXT NOT NULL,
                raw_graph TEXT
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS investigation_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                investigation_id TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                level TEXT NOT NULL,
                module TEXT NOT NULL,
                message TEXT NOT NULL,
                FOREIGN KEY (investigation_id) REFERENCES investigations (id)
            )
        """)
        await db.commit()

async def save_investigation(
    inv_id: str,
    case_name: str,
    target: str,
    target_type: str,
    status: str,
    created_at: str,
    active_analyzers: List[str],
    raw_graph: Dict[str, Any]
):
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            INSERT OR REPLACE INTO investigations 
            (id, case_name, target, target_type, status, created_at, active_analyzers, raw_graph)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            inv_id,
            case_name,
            target,
            target_type,
            status,
            created_at,
            json.dumps(active_analyzers),
            json.dumps(raw_graph)
        ))
        await db.commit()

async def get_investigation(inv_id: str) -> Optional[Dict[str, Any]]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT * FROM investigations WHERE id = ?", (inv_id,)) as cursor:
            row = await cursor.fetchone()
            if not row:
                return None
            return {
                "id": row["id"],
                "case_name": row["case_name"],
                "target": row["target"],
                "target_type": row["target_type"],
                "status": row["status"],
                "created_at": row["created_at"],
                "active_analyzers": json.loads(row["active_analyzers"]),
                "raw_graph": json.loads(row["raw_graph"]) if row["raw_graph"] else None
            }

async def list_investigations() -> List[Dict[str, Any]]:
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT id, case_name, target, target_type, status, created_at, raw_graph FROM investigations ORDER BY created_at DESC") as cursor:
            rows = await cursor.fetchall()
            results = []
            for r in rows:
                raw = json.loads(r["raw_graph"]) if r["raw_graph"] else {}
                nodes = raw.get("nodes", [])
                edges = raw.get("edges", [])
                results.append({
                    "id": r["id"],
                    "case_name": r["case_name"],
                    "target": r["target"],
                    "target_type": r["target_type"],
                    "status": r["status"],
                    "created_at": r["created_at"],
                    "node_count": len(nodes),
                    "edge_count": len(edges)
                })
            return results
