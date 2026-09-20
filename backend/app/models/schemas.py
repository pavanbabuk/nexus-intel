from enum import Enum
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from datetime import datetime, timezone

class TargetType(str, Enum):
    DOMAIN = "domain"
    IP = "ip"
    USERNAME = "username"
    URL = "url"
    EMAIL = "email"

class EntityType(str, Enum):
    ROOT_TARGET = "root_target"
    DOMAIN = "domain"
    SUBDOMAIN = "subdomain"
    IP = "ip"
    ASN = "asn"
    NAMESERVER = "nameserver"
    MAILSERVER = "mailserver"
    CERTIFICATE = "certificate"
    ORGANIZATION = "organization"
    REGISTRAR = "registrar"
    URL = "url"
    USERNAME = "username"
    SOCIAL_PROFILE = "social_profile"
    TECHNOLOGY = "technology"
    DNS_RECORD = "dns_record"
    ORIGIN_IP = "origin_ip"

class RelationshipType(str, Enum):
    RESOLVES_TO = "RESOLVES_TO"
    SUBDOMAIN_OF = "SUBDOMAIN_OF"
    HOSTED_ON = "HOSTED_ON"
    SERVED_BY = "SERVED_BY"
    CERTIFIED_BY = "CERTIFIED_BY"
    REGISTERED_BY = "REGISTERED_BY"
    POINTS_TO = "POINTS_TO"
    PROFILED_AS = "PROFILED_AS"
    RUNS_ON = "RUNS_ON"
    ASSOCIATED_WITH = "ASSOCIATED_WITH"

class EntityNode(BaseModel):
    id: str = Field(description="Unique deterministic ID (e.g. type:value)")
    label: str
    type: EntityType
    value: str
    confidence: float = 1.0
    first_seen: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    source_module: str
    properties: Dict[str, Any] = Field(default_factory=dict)

class EntityEdge(BaseModel):
    id: str
    source: str = Field(description="Source node ID")
    target: str = Field(description="Target node ID")
    type: RelationshipType
    confidence: float = 1.0
    source_module: str
    properties: Dict[str, Any] = Field(default_factory=dict)

class InvestigationLog(BaseModel):
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    level: str = "INFO" # INFO, WARNING, ERROR, SUCCESS
    module: str
    message: str

class ScorecardFactor(BaseModel):
    category: str
    title: str
    impact: int
    status: str # pass, warn, fail
    description: str

class SecurityScorecard(BaseModel):
    score: int # 0 - 100
    grade: str # A+, A, B, C, D, F
    summary: str
    factors: List[ScorecardFactor]

class InvestigationCreate(BaseModel):
    target: str
    target_type: Optional[TargetType] = None
    enabled_analyzers: Optional[List[str]] = None
    case_name: Optional[str] = None

class InvestigationSummary(BaseModel):
    id: str
    case_name: str
    target: str
    target_type: str
    created_at: str
    status: str # running, completed, failed
    node_count: int
    edge_count: int

class InvestigationDetail(BaseModel):
    id: str
    case_name: str
    target: str
    target_type: str
    created_at: str
    status: str
    nodes: List[EntityNode]
    edges: List[EntityEdge]
    logs: List[InvestigationLog]
    active_analyzers: List[str]
    scorecard: Optional[SecurityScorecard] = None

class AnalyzerInfo(BaseModel):
    id: str
    name: str
    description: str
    supported_targets: List[TargetType]
    is_passive: bool
    requires_auth: bool = False

class MitreAttackTTP(BaseModel):
    t_id: str
    t_name: str
    phase: str
    severity: str
    description: str
    matched_assets: List[str]

class ThreatHypothesis(BaseModel):
    id: str
    confidence: float
    title: str
    analysis: str
    mitre_ref: str

class ReconDork(BaseModel):
    category: str
    query: str
    purpose: str

class CortexReport(BaseModel):
    target: str
    executive_summary: str
    risk_level: str
    mitre_ttps: List[MitreAttackTTP]
    hypotheses: List[ThreatHypothesis]
    recommended_dorks: List[ReconDork]
    generated_at: str

