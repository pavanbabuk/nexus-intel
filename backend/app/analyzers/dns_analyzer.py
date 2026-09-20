import dns.asyncresolver
import dns.resolver
from typing import List
from app.models.schemas import TargetType, EntityType, RelationshipType
from app.analyzers.base import BaseAnalyzer
from app.core.graph import GraphManager

class DNSAnalyzer(BaseAnalyzer):
    id = "dns_resolver"
    name = "DNS & Nameserver Resolver"
    description = "Queries authoritative DNS for A, AAAA, MX, NS, TXT, and CNAME records."
    supported_targets = [TargetType.DOMAIN]
    is_passive = True

    async def run(self, target: str, target_type: TargetType, graph: GraphManager) -> None:
        clean_target = target.strip().lower()
        # Remove any protocol prefix if present
        if clean_target.startswith("http://"):
            clean_target = clean_target[7:]
        elif clean_target.startswith("https://"):
            clean_target = clean_target[8:]
        clean_target = clean_target.split("/")[0].split(":")[0]

        root_id = f"domain:{clean_target}"
        graph.log(self.id, f"Initiating DNS resolution for {clean_target}")

        resolver = dns.asyncresolver.Resolver()
        resolver.timeout = 3.0
        resolver.lifetime = 5.0

        # 1. Resolve A (IPv4)
        try:
            answers = await resolver.resolve(clean_target, "A")
            for rdata in answers:
                ip_val = rdata.to_text()
                ip_id = f"ip:{ip_val}"
                graph.add_node(
                    node_id=ip_id,
                    label=f"IP {ip_val}",
                    entity_type=EntityType.IP,
                    value=ip_val,
                    source_module=self.id,
                    confidence=1.0,
                    properties={"record_type": "A", "ttl": answers.rrset.ttl}
                )
                graph.add_edge(
                    source_id=root_id,
                    target_id=ip_id,
                    rel_type=RelationshipType.RESOLVES_TO,
                    source_module=self.id,
                    confidence=1.0,
                    properties={"record_type": "A"}
                )
            graph.log(self.id, f"Resolved {len(answers)} IPv4 address(es) for {clean_target}")
        except Exception as e:
            graph.log(self.id, f"No A records found or error: {str(e)}", "DEBUG")

        # 2. Resolve AAAA (IPv6)
        try:
            answers = await resolver.resolve(clean_target, "AAAA")
            for rdata in answers:
                ip_val = rdata.to_text()
                ip_id = f"ip:{ip_val}"
                graph.add_node(
                    node_id=ip_id,
                    label=f"IPv6 {ip_val}",
                    entity_type=EntityType.IP,
                    value=ip_val,
                    source_module=self.id,
                    confidence=1.0,
                    properties={"record_type": "AAAA", "ttl": answers.rrset.ttl}
                )
                graph.add_edge(
                    source_id=root_id,
                    target_id=ip_id,
                    rel_type=RelationshipType.RESOLVES_TO,
                    source_module=self.id,
                    confidence=1.0,
                    properties={"record_type": "AAAA"}
                )
            graph.log(self.id, f"Resolved {len(answers)} IPv6 address(es) for {clean_target}")
        except Exception:
            pass

        # 3. Resolve MX (Mail Exchange)
        try:
            answers = await resolver.resolve(clean_target, "MX")
            for rdata in answers:
                mx_val = rdata.exchange.to_text().rstrip(".")
                mx_id = f"mailserver:{mx_val}"
                graph.add_node(
                    node_id=mx_id,
                    label=f"MX: {mx_val}",
                    entity_type=EntityType.MAILSERVER,
                    value=mx_val,
                    source_module=self.id,
                    confidence=1.0,
                    properties={"preference": rdata.preference}
                )
                graph.add_edge(
                    source_id=root_id,
                    target_id=mx_id,
                    rel_type=RelationshipType.SERVED_BY,
                    source_module=self.id,
                    confidence=1.0,
                    properties={"role": "mail_exchanger"}
                )
            graph.log(self.id, f"Resolved {len(answers)} MX host(s)")
        except Exception:
            pass

        # 4. Resolve NS (Nameservers)
        try:
            answers = await resolver.resolve(clean_target, "NS")
            for rdata in answers:
                ns_val = rdata.target.to_text().rstrip(".")
                ns_id = f"nameserver:{ns_val}"
                graph.add_node(
                    node_id=ns_id,
                    label=f"NS: {ns_val}",
                    entity_type=EntityType.NAMESERVER,
                    value=ns_val,
                    source_module=self.id,
                    confidence=1.0
                )
                graph.add_edge(
                    source_id=root_id,
                    target_id=ns_id,
                    rel_type=RelationshipType.SERVED_BY,
                    source_module=self.id,
                    confidence=1.0,
                    properties={"role": "authoritative_nameserver"}
                )
            graph.log(self.id, f"Resolved {len(answers)} Nameserver(s)")
        except Exception:
            pass

        # 5. Resolve TXT (Verification & Security SPF/DMARC)
        try:
            answers = await resolver.resolve(clean_target, "TXT")
            for rdata in answers:
                txt_str = b"".join(rdata.strings).decode("utf-8", errors="ignore")
                # Identify notable TXT signatures
                category = "General"
                if "v=spf1" in txt_str:
                    category = "SPF Policy"
                elif "verification" in txt_str.lower():
                    category = "Service Verification"

                txt_id = f"dns_record:{clean_target}:{hash(txt_str)}"
                graph.add_node(
                    node_id=txt_id,
                    label=f"TXT ({category})",
                    entity_type=EntityType.DNS_RECORD,
                    value=txt_str[:120] + ("..." if len(txt_str) > 120 else ""),
                    source_module=self.id,
                    confidence=0.95,
                    properties={"full_record": txt_str, "category": category}
                )
                graph.add_edge(
                    source_id=root_id,
                    target_id=txt_id,
                    rel_type=RelationshipType.ASSOCIATED_WITH,
                    source_module=self.id,
                    confidence=0.95
                )
        except Exception:
            pass
