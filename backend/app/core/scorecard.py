from typing import List, Dict, Any
from app.models.schemas import EntityNode, EntityType, SecurityScorecard, ScorecardFactor

def calculate_security_scorecard(nodes: List[EntityNode], target: str, target_type: str) -> SecurityScorecard:
    """
    Computes an external security posture & exposure scorecard (0-100, Grade A+ to F)
    based on passively and actively discovered infrastructure facts.
    """
    score = 100
    factors: List[ScorecardFactor] = []
    
    # Target node extraction
    root_node = next((n for n in nodes if n.properties.get("is_root")), None)
    root_props = root_node.properties if root_node else {}

    # 1. HSTS (Strict-Transport-Security) Check
    hsts = root_props.get("hsts_enabled")
    if hsts is True:
        factors.append(ScorecardFactor(
            category="Web Security",
            title="HSTS Enforced",
            impact=10,
            status="pass",
            description="HTTP Strict Transport Security is enabled, preventing SSL-stripping attacks."
        ))
    elif hsts is False:
        score -= 15
        factors.append(ScorecardFactor(
            category="Web Security",
            title="Missing HSTS Header",
            impact=-15,
            status="fail",
            description="Strict-Transport-Security header is absent. Connections may be vulnerable to downgrade attacks."
        ))

    # 2. Content Security Policy (CSP) Check
    csp = root_props.get("csp_enabled")
    if csp is True:
        factors.append(ScorecardFactor(
            category="Web Security",
            title="Content Security Policy (CSP)",
            impact=10,
            status="pass",
            description="CSP header is active, protecting users from cross-site scripting (XSS) and data injection."
        ))
    elif csp is False:
        score -= 10
        factors.append(ScorecardFactor(
            category="Web Security",
            title="Missing Content Security Policy",
            impact=-10,
            status="warn",
            description="No Content-Security-Policy detected. Recommended to mitigate injection risks."
        ))

    # 3. Clickjacking Protection (X-Frame-Options)
    xfo = root_props.get("x_frame_options")
    if xfo and xfo.lower() in ["deny", "sameorigin"]:
        factors.append(ScorecardFactor(
            category="Web Security",
            title="Anti-Clickjacking Protection",
            impact=5,
            status="pass",
            description=f"X-Frame-Options set to '{xfo}', preventing malicious framing."
        ))
    elif xfo == "Missing" or not xfo:
        score -= 5
        factors.append(ScorecardFactor(
            category="Web Security",
            title="Missing X-Frame-Options",
            impact=-5,
            status="warn",
            description="X-Frame-Options header is missing; site may be vulnerable to clickjacking."
        ))

    # 4. Email Spoofing & Domain Protection (SPF & DMARC)
    txt_nodes = [n for n in nodes if n.type == EntityType.DNS_RECORD]
    spf_record = next((n for n in txt_nodes if "v=spf1" in (n.properties.get("full_record") or "")), None)
    
    if spf_record:
        rec_text = spf_record.properties.get("full_record", "")
        if "-all" in rec_text:
            factors.append(ScorecardFactor(
                category="Email Defense",
                title="Strict SPF Policy (-all)",
                impact=15,
                status="pass",
                description="Sender Policy Framework strictly rejects unauthorized mail servers."
            ))
        elif "~all" in rec_text:
            factors.append(ScorecardFactor(
                category="Email Defense",
                title="SoftFail SPF Policy (~all)",
                impact=5,
                status="pass",
                description="SPF SoftFail is enabled, providing basic sender authentication."
            ))
        else:
            score -= 10
            factors.append(ScorecardFactor(
                category="Email Defense",
                title="Permissive SPF Policy",
                impact=-10,
                status="warn",
                description="SPF record exists but does not actively reject unauthorized senders."
            ))
    else:
        if target_type == "domain":
            score -= 20
            factors.append(ScorecardFactor(
                category="Email Defense",
                title="Missing SPF Record",
                impact=-20,
                status="fail",
                description="No SPF record found! Anyone can spoof emails originating from this domain."
            ))

    # 5. Attack Surface Exposure (Subdomain Footprint)
    subdomains = [n for n in nodes if n.type == EntityType.SUBDOMAIN]
    staging_dev_patterns = ["dev.", "staging.", "test.", "stage.", "admin.", "internal.", "api-dev.", "corp."]
    exposed_sensitive = [s.value for s in subdomains if any(p in s.value.lower() for p in staging_dev_patterns)]

    if exposed_sensitive:
        score -= 15
        factors.append(ScorecardFactor(
            category="Attack Surface",
            title=f"Exposed Non-Prod Subdomains ({len(exposed_sensitive)})",
            impact=-15,
            status="warn",
            description=f"Public certificate logs expose dev/staging subdomains: {', '.join(exposed_sensitive[:3])}"
        ))
    else:
        factors.append(ScorecardFactor(
            category="Attack Surface",
            title="Clean Subdomain Perimeter",
            impact=5,
            status="pass",
            description="No obvious staging, development, or internal subdomains exposed in public CT logs."
        ))

    # 6. Web Server & Infrastructure Fingerprinting
    tech_nodes = [n for n in nodes if n.type == EntityType.TECHNOLOGY]
    has_cdn = any(n.properties.get("category") == "CDN/WAF" or "cloudflare" in n.value.lower() or "fastly" in n.value.lower() for n in tech_nodes)
    if has_cdn:
        factors.append(ScorecardFactor(
            category="Resilience",
            title="Cloud Edge / WAF Shield Active",
            impact=10,
            status="pass",
            description="Traffic is fronted by an enterprise edge CDN / WAF network, shielding the origin IP."
        ))
    else:
        factors.append(ScorecardFactor(
            category="Resilience",
            title="Direct Origin Exposure",
            impact=-5,
            status="warn",
            description="No primary Cloud Edge or DDoS mitigation provider detected fronting the main endpoint."
        ))

    # 7. Overall Score Clamping & Grade Assignment
    final_score = max(5, min(100, score))
    
    if final_score >= 95:
        grade = "A+"
    elif final_score >= 90:
        grade = "A"
    elif final_score >= 80:
        grade = "B"
    elif final_score >= 70:
        grade = "C"
    elif final_score >= 60:
        grade = "D"
    else:
        grade = "F"

    # Executive Summary Roast / Appraisal
    if grade in ["A+", "A"]:
        summary = f"Excellent defensive posture! {target} demonstrates enterprise-grade headers and solid email spoofing protection."
    elif grade == "B":
        summary = f"Good security baseline for {target}, but minor header configuration and perimeter cleanup could eliminate attack surface."
    elif grade == "C":
        summary = f"Moderate security exposure detected on {target}. Key security headers or email authentication policies need tightening."
    elif grade == "D":
        summary = f"Elevated exposure level for {target}! Critical email defenses or modern transport security controls are missing."
    else:
        summary = f"Severe security posture vulnerabilities found on {target}. Immediate remediation of domain, email, and transport controls recommended."

    return SecurityScorecard(
        score=final_score,
        grade=grade,
        summary=summary,
        factors=factors
    )
