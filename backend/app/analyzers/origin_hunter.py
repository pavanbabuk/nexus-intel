import re
import codecs
import socket
import asyncio
import ipaddress
import urllib.parse
from typing import List, Optional, Tuple, Dict, Any
import httpx
import dns.resolver
from app.models.schemas import TargetType, EntityType, RelationshipType
from app.analyzers.base import BaseAnalyzer
from app.core.graph import GraphManager

# Standard Cloudflare IPv4 CIDR blocks
CLOUDFLARE_IPV4_NETWORKS = [
    ipaddress.ip_network(net) for net in [
        "173.245.48.0/20",
        "103.21.244.0/22",
        "103.22.200.0/22",
        "103.31.4.0/22",
        "141.101.64.0/18",
        "108.162.192.0/18",
        "190.93.240.0/20",
        "188.114.96.0/20",
        "197.234.240.0/22",
        "198.41.128.0/17",
        "162.158.0.0/15",
        "104.16.0.0/13",
        "104.24.0.0/14",
        "172.64.0.0/13",
        "131.0.72.0/22"
    ]
]

def is_cloudflare_ip(ip_str: str) -> bool:
    """Check if an IP address belongs to known Cloudflare edge networks."""
    try:
        addr = ipaddress.ip_address(ip_str)
        return any(addr in net for net in CLOUDFLARE_IPV4_NETWORKS)
    except ValueError:
        return False

def mmh3_32(data: bytes, seed: int = 0) -> int:
    """Pure Python implementation of 32-bit MurmurHash3 for zero-dependency Shodan compatibility."""
    length = len(data)
    nblocks = length // 4
    h1 = seed
    c1 = 0xcc9e2d51
    c2 = 0x1b873593

    for i in range(0, nblocks * 4, 4):
        k1 = data[i] | (data[i+1] << 8) | (data[i+2] << 16) | (data[i+3] << 24)
        k1 = (k1 * c1) & 0xFFFFFFFF
        k1 = ((k1 << 15) | (k1 >> 17)) & 0xFFFFFFFF
        k1 = (k1 * c2) & 0xFFFFFFFF

        h1 ^= k1
        h1 = ((h1 << 13) | (h1 >> 19)) & 0xFFFFFFFF
        h1 = (h1 * 5 + 0xe6546b64) & 0xFFFFFFFF

    tail = data[nblocks * 4:]
    k1 = 0
    if len(tail) == 3:
        k1 ^= tail[2] << 16
    if len(tail) >= 2:
        k1 ^= tail[1] << 8
    if len(tail) >= 1:
        k1 ^= tail[0]
        k1 = (k1 * c1) & 0xFFFFFFFF
        k1 = ((k1 << 15) | (k1 >> 17)) & 0xFFFFFFFF
        k1 = (k1 * c2) & 0xFFFFFFFF
        h1 ^= k1

    h1 ^= length
    h1 ^= (h1 >> 16)
    h1 = (h1 * 0x85ebca6b) & 0xFFFFFFFF
    h1 ^= (h1 >> 13)
    h1 = (h1 * 0xc2b2ae35) & 0xFFFFFFFF
    h1 ^= (h1 >> 16)

    if h1 >= 0x80000000:
        h1 -= 0x100000000
    return h1

def calculate_shodan_favicon_hash(content: bytes) -> int:
    """Calculates the exact MurmurHash3 Shodan hash on base64 chunked bytes."""
    b64 = codecs.encode(content, "base64")
    return mmh3_32(b64)


class OriginHunterAnalyzer(BaseAnalyzer):
    """
    Tactical WAF & Origin IP Hunter.
    Discovers unproxied backend servers hiding behind reverse proxies (Cloudflare, Akamai, etc.)
    using MX record leakage, direct host probes, SSL SAN cross-matching, and Favicon MMH3 fingerprinting.
    """

    id: str = "origin_hunter"
    name: str = "WAF & Origin IP Hunter"
    description: str = "Bypasses Cloudflare/WAF to uncover real origin backend IPs via MX leaks, common direct hosts, and Favicon MMH3 hashes."
    supported_targets: List[TargetType] = [TargetType.DOMAIN, TargetType.URL]
    is_passive: bool = False

    COMMON_ORIGIN_SUBDOMAINS = [
        "mail", "direct", "origin", "direct-connect", "cpanel",
        "webmail", "dev", "stage", "backend", "admin", "vpn"
    ]

    async def run(self, target: str, target_type: TargetType, graph: GraphManager) -> None:
        domain = self._extract_domain(target)
        if not domain:
            graph.log(self.id, f"Could not parse valid domain from {target}", level="WARNING")
            return

        domain_node_id = f"{EntityType.DOMAIN.value}:{domain}"
        graph.log(self.id, f"Initializing WAF & Origin IP Hunter for [{domain}]...")

        # Step 1: Favicon MMH3 Fingerprinting (Shodan/Censys query hash)
        favicon_hash = await self._harvest_favicon_hash(domain, graph)

        # Step 2: Identify edge IPs vs candidate non-CDN origin hosts
        candidate_ips = await self._discover_candidate_origin_ips(domain, graph)

        if not candidate_ips:
            graph.log(self.id, "No candidate origin IPs discovered from DNS/MX analysis.")
            return

        # Step 3: Verify Candidate IPs against target domain
        verified_count = 0
        for candidate_ip, source_label in candidate_ips:
            if is_cloudflare_ip(candidate_ip):
                graph.log(self.id, f"Candidate IP {candidate_ip} ({source_label}) belongs to Cloudflare Edge. Skipping direct probe.")
                continue

            # Verify direct HTTP/HTTPS probe with Host header
            is_match, evidence = await self._probe_direct_origin(candidate_ip, domain)
            if is_match:
                verified_count += 1
                origin_node_id = f"{EntityType.ORIGIN_IP.value}:{candidate_ip}"

                graph.log(
                    self.id,
                    f"🎯 CONFIRMED ORIGIN IP LEAK: {candidate_ip} bypasses CDN! Evidence: {evidence}",
                    level="WARNING"
                )

                graph.add_node(
                    node_id=origin_node_id,
                    label=f"ORIGIN: {candidate_ip}",
                    entity_type=EntityType.ORIGIN_IP,
                    value=candidate_ip,
                    source_module=self.id,
                    confidence=0.96,
                    properties={
                        "is_origin_leak": True,
                        "discovered_via": source_label,
                        "evidence": evidence,
                        "shodan_query": f"ip:{candidate_ip}",
                        "bypassed_proxy": "Cloudflare/Edge CDN",
                        "threat_severity": "CRITICAL"
                    }
                )

                graph.add_edge(
                    source_id=domain_node_id,
                    target_id=origin_node_id,
                    rel_type=RelationshipType.RESOLVES_TO,
                    source_module=self.id,
                    confidence=0.96,
                    properties={"origin_bypass": True, "method": source_label}
                )

        if verified_count == 0:
            graph.log(self.id, "Origin scan complete. No direct origin IP leaks identified for active subdomains.")
        else:
            graph.log(self.id, f"Origin scan complete. Successfully isolated {verified_count} direct origin server(s)!")

    def _extract_domain(self, target: str) -> Optional[str]:
        cleaned = target.strip()
        if cleaned.startswith("http://") or cleaned.startswith("https://"):
            parsed = urllib.parse.urlparse(cleaned)
            return parsed.hostname
        return cleaned.split("/")[0].split(":")[0]

    async def _harvest_favicon_hash(self, domain: str, graph: GraphManager) -> Optional[int]:
        """Fetch favicon.ico and compute 32-bit MurmurHash3."""
        urls_to_try = [
            f"https://{domain}/favicon.ico",
            f"http://{domain}/favicon.ico"
        ]

        async with httpx.AsyncClient(timeout=4.0, verify=False, follow_redirects=True) as client:
            for url in urls_to_try:
                try:
                    resp = await client.get(url)
                    if resp.status_code == 200 and len(resp.content) > 10:
                        hash_val = calculate_shodan_favicon_hash(resp.content)
                        graph.log(
                            self.id,
                            f"Discovered Favicon MMH3 Hash: [{hash_val}]. Shodan Dork: [http.favicon.hash:{hash_val}]"
                        )

                        # Create technology observable node for the Favicon Hash
                        fav_node_id = f"{EntityType.TECHNOLOGY.value}:favicon_mmh3_{hash_val}"
                        graph.add_node(
                            node_id=fav_node_id,
                            label=f"Favicon MMH3: {hash_val}",
                            entity_type=EntityType.TECHNOLOGY,
                            value=str(hash_val),
                            source_module=self.id,
                            confidence=1.0,
                            properties={
                                "shodan_dork": f"http.favicon.hash:{hash_val}",
                                "censys_dork": f"services.http.response.favicons.md5_hash:{hash_val}",
                                "byte_size": len(resp.content)
                            }
                        )
                        graph.add_edge(
                            source_id=f"{EntityType.DOMAIN.value}:{domain}",
                            target_id=fav_node_id,
                            rel_type=RelationshipType.PROFILED_AS,
                            source_module=self.id,
                            confidence=1.0
                        )
                        return hash_val
                except Exception:
                    continue
        return None

    async def _discover_candidate_origin_ips(self, domain: str, graph: GraphManager) -> List[Tuple[str, str]]:
        """Harvest candidate IPs from MX records and common origin-bypass hostnames."""
        candidates: List[Tuple[str, str]] = []
        resolver = dns.resolver.Resolver()
        resolver.timeout = 2.0
        resolver.lifetime = 2.0

        loop = asyncio.get_running_loop()

        # 1. Check MX records
        try:
            mx_answers = await loop.run_in_executor(None, lambda: resolver.resolve(domain, 'MX'))
            for rdata in mx_answers:
                mx_host = str(rdata.exchange).rstrip('.')
                try:
                    a_answers = await loop.run_in_executor(None, lambda: resolver.resolve(mx_host, 'A'))
                    for ip_rdata in a_answers:
                        ip_str = str(ip_rdata)
                        candidates.append((ip_str, f"MX Host [{mx_host}]"))
                except Exception:
                    continue
        except Exception:
            pass

        # 2. Check common origin subdomains
        for sub in self.COMMON_ORIGIN_SUBDOMAINS:
            candidate_host = f"{sub}.{domain}"
            try:
                a_answers = await loop.run_in_executor(None, lambda: resolver.resolve(candidate_host, 'A'))
                for ip_rdata in a_answers:
                    ip_str = str(ip_rdata)
                    candidates.append((ip_str, f"Subdomain [{candidate_host}]"))
            except Exception:
                continue

        # Deduplicate
        seen = set()
        deduped = []
        for ip_str, source in candidates:
            if ip_str not in seen:
                seen.add(ip_str)
                deduped.append((ip_str, source))

        return deduped

    async def _probe_direct_origin(self, ip_str: str, domain: str) -> Tuple[bool, str]:
        """Probe candidate IP with Host header to verify whether it serves the target domain."""
        async with httpx.AsyncClient(timeout=3.5, verify=False, follow_redirects=False) as client:
            # Probe HTTP & HTTPS directly against the candidate IP
            for protocol in ["https", "http"]:
                url = f"{protocol}://{ip_str}/"
                headers = {"Host": domain, "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NexusIntel-OriginHunter/1.0"}
                try:
                    resp = await client.get(url, headers=headers)
                    # Check if response doesn't have Cloudflare headers
                    is_cf = any(h.lower().startswith("cf-") or "cloudflare" in resp.headers.get("server", "").lower() for h in resp.headers)
                    
                    if not is_cf and resp.status_code in [200, 301, 302, 401, 403]:
                        evidence = f"HTTP {resp.status_code} on {protocol}://{ip_str} without Cloudflare headers (Server: {resp.headers.get('server', 'unknown')})"
                        return True, evidence
                except Exception:
                    continue

        return False, ""
