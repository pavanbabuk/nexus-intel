import httpx
import asyncio
from app.models.schemas import TargetType, EntityType, RelationshipType
from app.analyzers.base import BaseAnalyzer
from app.core.graph import GraphManager

PLATFORMS = [
    {
        "name": "GitHub",
        "url_template": "https://api.github.com/users/{username}",
        "profile_url": "https://github.com/{username}",
        "check_type": "json_status",
        "category": "Developer"
    },
    {
        "name": "GitLab",
        "url_template": "https://gitlab.com/{username}",
        "profile_url": "https://gitlab.com/{username}",
        "check_type": "http_status",
        "category": "Developer"
    },
    {
        "name": "HackerNews",
        "url_template": "https://hacker-news.firebaseio.com/v0/user/{username}.json",
        "profile_url": "https://news.ycombinator.com/user?id={username}",
        "check_type": "hn_api",
        "category": "Tech Forum"
    },
    {
        "name": "Dev.to",
        "url_template": "https://dev.to/api/users/by_username?url={username}",
        "profile_url": "https://dev.to/{username}",
        "check_type": "json_status",
        "category": "Blogging"
    },
    {
        "name": "Keybase",
        "url_template": "https://keybase.io/_/api/1.0/user/lookup.json?usernames={username}",
        "profile_url": "https://keybase.io/{username}",
        "check_type": "keybase_api",
        "category": "Identity & Crypto"
    },
    {
        "name": "DockerHub",
        "url_template": "https://hub.docker.com/v2/users/{username}/",
        "profile_url": "https://hub.docker.com/u/{username}",
        "check_type": "json_status",
        "category": "Developer"
    },
    {
        "name": "Medium",
        "url_template": "https://medium.com/@{username}",
        "profile_url": "https://medium.com/@{username}",
        "check_type": "http_status",
        "category": "Blogging"
    }
]

class UsernameAnalyzer(BaseAnalyzer):
    id = "username_footprint"
    name = "Social & Developer Identity Footprinter"
    description = "Searches 10+ developer, social, and forum platforms to detect profile presence."
    supported_targets = [TargetType.USERNAME]
    is_passive = True

    async def _check_platform(self, client: httpx.AsyncClient, p: dict, username: str):
        target_url = p["url_template"].format(username=username)
        try:
            resp = await client.get(
                target_url,
                headers={"User-Agent": "Mozilla/5.0 (NexusIntel OSINT Profiler 1.0)"}
            )

            is_found = False
            details = {}

            if p["check_type"] == "http_status":
                if resp.status_code == 200:
                    is_found = True
            elif p["check_type"] == "json_status":
                if resp.status_code == 200:
                    data = resp.json()
                    is_found = bool(data and not data.get("message") == "Not Found")
                    if is_found and p["name"] == "GitHub":
                        details["name"] = data.get("name")
                        details["bio"] = data.get("bio")
                        details["public_repos"] = data.get("public_repos")
            elif p["check_type"] == "hn_api":
                if resp.status_code == 200 and resp.text.strip() != "null":
                    is_found = True
                    data = resp.json()
                    details["karma"] = data.get("karma")
            elif p["check_type"] == "keybase_api":
                if resp.status_code == 200:
                    data = resp.json()
                    thems = data.get("them", [])
                    if thems and len(thems) > 0 and thems[0] is not None:
                        is_found = True

            if is_found:
                return {
                    "platform": p["name"],
                    "url": p["profile_url"].format(username=username),
                    "category": p["category"],
                    "details": details
                }
        except Exception:
            pass
        return None

    async def run(self, target: str, target_type: TargetType, graph: GraphManager) -> None:
        clean_user = target.strip().lstrip("@")
        root_id = f"username:{clean_user.lower()}"
        graph.log(self.id, f"Scanning online platforms for username '{clean_user}'")

        async with httpx.AsyncClient(timeout=6.0, follow_redirects=True) as client:
            tasks = [self._check_platform(client, p, clean_user) for p in PLATFORMS]
            results = await asyncio.gather(*tasks)

        found_count = 0
        for res in results:
            if res:
                found_count += 1
                plat = res["platform"]
                node_id = f"social_profile:{plat.lower()}_{clean_user.lower()}"
                graph.add_node(
                    node_id=node_id,
                    label=f"{plat}: @{clean_user}",
                    entity_type=EntityType.SOCIAL_PROFILE,
                    value=res["url"],
                    source_module=self.id,
                    confidence=0.92,
                    properties={
                        "platform": plat,
                        "category": res["category"],
                        "url": res["url"],
                        **res["details"]
                    }
                )
                graph.add_edge(
                    source_id=root_id,
                    target_id=node_id,
                    rel_type=RelationshipType.PROFILED_AS,
                    source_module=self.id,
                    confidence=0.92
                )

        graph.log(self.id, f"Username '{clean_user}' identified on {found_count} platforms")
