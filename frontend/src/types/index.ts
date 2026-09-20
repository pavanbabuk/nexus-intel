export type TargetType = 'domain' | 'ip' | 'username' | 'url' | 'email';

export type EntityType =
  | 'root_target'
  | 'domain'
  | 'subdomain'
  | 'ip'
  | 'asn'
  | 'nameserver'
  | 'mailserver'
  | 'certificate'
  | 'organization'
  | 'registrar'
  | 'url'
  | 'username'
  | 'social_profile'
  | 'technology'
  | 'dns_record';

export interface EntityNode {
  id: string;
  label: string;
  type: EntityType;
  value: string;
  confidence: number;
  first_seen: string;
  source_module: string;
  properties: Record<string, any>;
}

export interface EntityEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  confidence: number;
  source_module: string;
  properties: Record<string, any>;
}

export interface InvestigationLog {
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'DEBUG';
  module: string;
  message: string;
}

export interface InvestigationSummary {
  id: string;
  case_name: string;
  target: string;
  target_type: string;
  created_at: string;
  status: 'running' | 'completed' | 'failed';
  node_count: number;
  edge_count: number;
}

export interface InvestigationDetail {
  id: string;
  case_name: string;
  target: string;
  target_type: string;
  created_at: string;
  status: string;
  nodes: EntityNode[];
  edges: EntityEdge[];
  logs: InvestigationLog[];
  active_analyzers: string[];
  scorecard?: SecurityScorecard;
}

export interface ScorecardFactor {
  category: string;
  title: string;
  impact: number;
  status: 'pass' | 'warn' | 'fail';
  description: string;
}

export interface SecurityScorecard {
  score: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  summary: string;
  factors: ScorecardFactor[];
}

export interface AnalyzerInfo {
  id: string;
  name: string;
  description: string;
  supported_targets: TargetType[];
  is_passive: boolean;
  requires_auth: boolean;
}
