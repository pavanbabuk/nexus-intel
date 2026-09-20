from datetime import datetime, timezone
from typing import List, Dict, Any, Set
from app.models.schemas import (
    EntityNode,
    EntityEdge,
    EntityType,
    CortexReport,
    MitreAttackTTP,
    ThreatHypothesis,
    ReconDork
)

def generate_cortex_report(
    target: str,
    nodes: List[EntityNode],
    edges: List[EntityEdge]
) -> CortexReport:
    """
    Project CORTEX AI Engine:
    Synthesizes graph observables into MITRE ATT&CK TTP mappings,
    threat hypotheses, and targeted recon dorks.
    """
    ttps: List[MitreAttackTTP] = []
    hypotheses: List[ThreatHypothesis] = []
    dorks: List[ReconDork] = []

    # Category sets
    origin_ips = [n for n in nodes if n.type == EntityType.ORIGIN_IP or n.properties.get("is_origin_leak")]
    ip_nodes = [n for n in nodes if n.type == EntityType.IP]
    subdomains = [n for n in nodes if n.type == EntityType.SUBDOMAIN]
    cert_nodes = [n for n in nodes if n.type == EntityType.CERTIFICATE]
    tech_nodes = [n for n in nodes if n.type == EntityType.TECHNOLOGY]
    usernames = [n for n in nodes if n.type in [EntityType.USERNAME, EntityType.SOCIAL_PROFILE]]
    mailservers = [n for n in nodes if n.type == EntityType.MAILSERVER]

    # Check for Favicon MMH3 hash
    fav_node = next((n for n in tech_nodes if "favicon_mmh3" in n.value or "favicon_mmh3" in n.id), None)

    # 1. MITRE ATT&CK Mapping
    # T1596: Search Open Technical Databases
    db_assets = [n.label for n in cert_nodes[:4]] + [n.label for n in subdomains[:3]]
    if db_assets:
        ttps.append(MitreAttackTTP(
            t_id="T1596",
            t_name="Search Open Technical Databases",
            phase="Reconnaissance",
            severity="LOW",
            description="Passive extraction of historical subdomains and Certificate Transparency logs via crt.sh/RDAP.",
            matched_assets=db_assets
        ))

    # T1590: Gather Victim Network Information
    net_assets = [n.label for n in ip_nodes[:4]] + [n.label for n in mailservers[:2]]
    if net_assets:
        ttps.append(MitreAttackTTP(
            t_id="T1590",
            t_name="Gather Victim Network Information",
            phase="Reconnaissance",
            severity="MEDIUM",
            description="Discovery of Autonomous System Numbers (ASNs), network prefixes, and authoritative nameservers.",
            matched_assets=net_assets
        ))

    # T1589: Gather Victim Identity Information
    id_assets = [n.label for n in usernames[:5]]
    if id_assets:
        ttps.append(MitreAttackTTP(
            t_id="T1589",
            t_name="Gather Victim Identity Information",
            phase="Reconnaissance",
            severity="MEDIUM",
            description="Identified cross-platform handles, social presence, and developer footprint.",
            matched_assets=id_assets
        ))

    # T1190: Exploit Public-Facing Application (High/Critical if Origin IP leaked or unproxied)
    if origin_ips:
        leak_assets = [n.label for n in origin_ips]
        ttps.append(MitreAttackTTP(
            t_id="T1190",
            t_name="Exploit Public-Facing Application (WAF Bypass)",
            phase="Initial Access",
            severity="CRITICAL",
            description="Direct origin server IP addresses discovered bypassing Cloudflare/Akamai reverse proxy protections.",
            matched_assets=leak_assets
        ))
    elif tech_nodes:
        tech_assets = [n.label for n in tech_nodes[:4]]
        ttps.append(MitreAttackTTP(
            t_id="T1190",
            t_name="Exploit Public-Facing Application",
            phase="Initial Access",
            severity="MEDIUM",
            description="Publicly exposed web servers, framework versions, and HTTP technology stacks identified.",
            matched_assets=tech_assets
        ))

    # T1595: Active Scanning
    if origin_ips or tech_nodes:
        ttps.append(MitreAttackTTP(
            t_id="T1595",
            t_name="Active Scanning & Banner Grabbing",
            phase="Reconnaissance",
            severity="LOW",
            description="Target application banners, SSL cipher suites, and HTTP headers probed.",
            matched_assets=[target]
        ))

    # 2. Automated Threat Hypotheses Generation
    if origin_ips:
        for leak in origin_ips:
            method = leak.properties.get("discovered_via", "DNS history or MX certificate leak")
            evidence = leak.properties.get("evidence", "HTTP probe without Cloudflare headers")
            hypotheses.append(ThreatHypothesis(
                id=f"hypo-{len(hypotheses) + 1}",
                confidence=0.94,
                title=f"Cloudflare Bypass via Unproxied Origin ({leak.value})",
                analysis=(
                    f"The backend origin host {leak.value} was exposed via {method}. "
                    f"Adversaries can direct HTTP requests with 'Host: {target}' straight to this IP ({evidence}), "
                    "completely circumventing rate limiting, WAF rules, and DDoS protection."
                ),
                mitre_ref="T1190 / T1590"
            ))

    dev_subdomains = [s for s in subdomains if any(k in s.label.lower() for k in ["dev", "stage", "test", "internal", "admin", "vpn", "corp", "auth"])]
    if dev_subdomains:
        sub_names = ", ".join([s.label for s in dev_subdomains[:3]])
        hypotheses.append(ThreatHypothesis(
            id=f"hypo-{len(hypotheses) + 1}",
            confidence=0.86,
            title="Pre-Production / Debug Environment Exposure",
            analysis=(
                f"Identified staging or administrative subdomains ({sub_names}). "
                "These hosts frequently run weaker authentication, unpatched test code, or exposed OpenAPI / Swagger documentation."
            ),
            mitre_ref="T1596 / T1190"
        ))

    if usernames:
        hypotheses.append(ThreatHypothesis(
            id=f"hypo-{len(hypotheses) + 1}",
            confidence=0.82,
            title="Target Persona Social & Developer Footprint",
            analysis=(
                f"Identified {len(usernames)} cross-platform accounts matching handle '{target}'. "
                "Adversaries can correlate code commits on GitHub/DockerHub with public social posts for targeted spearphishing."
            ),
            mitre_ref="T1589 / T1566"
        ))

    if not hypotheses:
        hypotheses.append(ThreatHypothesis(
            id="hypo-1",
            confidence=0.75,
            title="Baseline Infrastructure Profile",
            analysis=f"Target {target} exhibits standard edge CDN protection with no critical origin leaks detected.",
            mitre_ref="T1596"
        ))

    # 3. Targeted Recon Dorks
    if fav_node:
        dork_hash = fav_node.properties.get("shodan_dork", f"http.favicon.hash:{fav_node.value}")
        dorks.append(ReconDork(
            category="Shodan",
            query=dork_hash,
            purpose="Query Shodan globally for unmasked web servers presenting the exact same Favicon hash."
        ))

    if origin_ips:
        for leak in origin_ips[:2]:
            dorks.append(ReconDork(
                category="Shodan",
                query=f"ip:{leak.value}",
                purpose=f"Inspect exposed open ports and banners on confirmed origin IP {leak.value}."
            ))

    dorks.append(ReconDork(
        category="GitHub",
        query=f'"{target}" filename:.env OR filename:credentials',
        purpose="Harvest exposed API keys, database credentials, and secret environment files on GitHub."
    ))

    dorks.append(ReconDork(
        category="Google Dork",
        query=f"site:{target} inurl:admin | inurl:login | inurl:staging",
        purpose="Locate indexable administrative login panels and staging environments."
    ))

    # Determine risk level
    if origin_ips:
        risk_level = "CRITICAL"
    elif dev_subdomains or len(tech_nodes) > 4:
        risk_level = "ELEVATED"
    else:
        risk_level = "LOW"

    # Executive summary
    exec_summary = (
        f"Project CORTEX completed autonomous graph synthesis for target [{target}]. "
        f"Correlated {len(nodes)} entities across {len(edges)} topology relationships. "
        f"Detected {len(origin_ips)} origin server leak(s), {len(subdomains)} subdomains, "
        f"and {len(ttps)} relevant MITRE ATT&CK technique vectors. "
        f"Overall exposure assessment: {risk_level}."
    )

    return CortexReport(
        target=target,
        executive_summary=exec_summary,
        risk_level=risk_level,
        mitre_ttps=ttps,
        hypotheses=hypotheses,
        recommended_dorks=dorks,
        generated_at=datetime.now(timezone.utc).isoformat()
    )
