import re
import ipaddress
from typing import List, Optional, Dict
from app.models.schemas import TargetType
from app.analyzers.base import BaseAnalyzer
from app.analyzers.dns_analyzer import DNSAnalyzer
from app.analyzers.cert_analyzer import CertAnalyzer
from app.analyzers.ip_analyzer import IPAnalyzer
from app.analyzers.whois_analyzer import WhoisAnalyzer
from app.analyzers.http_analyzer import HTTPAnalyzer
from app.analyzers.username_analyzer import UsernameAnalyzer
from app.analyzers.unfurl_analyzer import UnfurlAnalyzer

ANALYZERS: List[BaseAnalyzer] = [
    DNSAnalyzer(),
    CertAnalyzer(),
    IPAnalyzer(),
    WhoisAnalyzer(),
    HTTPAnalyzer(),
    UsernameAnalyzer(),
    UnfurlAnalyzer()
]

ANALYZER_MAP: Dict[str, BaseAnalyzer] = {a.id: a for a in ANALYZERS}

def get_all_analyzers() -> List[BaseAnalyzer]:
    return ANALYZERS

def get_analyzer(analyzer_id: str) -> Optional[BaseAnalyzer]:
    return ANALYZER_MAP.get(analyzer_id)

def detect_target_type(target: str) -> TargetType:
    """Heuristically determine the target type from the raw string."""
    cleaned = target.strip()

    # URL Check
    if cleaned.startswith("http://") or cleaned.startswith("https://") or "/" in cleaned:
        return TargetType.URL

    # IP Address Check
    try:
        ipaddress.ip_address(cleaned)
        return TargetType.IP
    except ValueError:
        pass

    # Email Check
    if "@" in cleaned and "." in cleaned.split("@")[-1]:
        return TargetType.EMAIL

    # Domain Check (has dot, valid domain chars)
    if "." in cleaned and not cleaned.startswith("@"):
        return TargetType.DOMAIN

    # Default to Username
    return TargetType.USERNAME
