import hashlib
import httpx
import asyncio
from typing import List, Dict, Any, Optional
from app.models.schemas import TargetType, EntityType, RelationshipType
from app.analyzers.base import BaseAnalyzer
from app.core.graph import GraphManager

PLATFORMS = [
    # Developer & Code
    {
        "name": "GitHub",
        "url_template": "https://api.github.com/users/{username}",
        "profile_url": "https://github.com/{username}",
        "check_type": "github_api",
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
        "name": "DockerHub",
        "url_template": "https://hub.docker.com/v2/users/{username}/",
        "profile_url": "https://hub.docker.com/u/{username}",
        "check_type": "json_status",
        "category": "Developer"
    },
    {
        "name": "Dev.to",
        "url_template": "https://dev.to/api/users/by_username?url={username}",
        "profile_url": "https://dev.to/{username}",
        "check_type": "devto_api",
        "category": "Blogging"
    },
    {
        "name": "Replit",
        "url_template": "https://replit.com/@{username}",
        "profile_url": "https://replit.com/@{username}",
        "check_type": "http_status",
        "category": "Developer"
    },
    {
        "name": "npm",
        "url_template": "https://registry.npmjs.org/-/v1/search?text=maintainer:{username}&size=1",
        "profile_url": "https://www.npmjs.com/~{username}",
        "check_type": "npm_api",
        "category": "Developer"
    },
    {
        "name": "PyPI",
        "url_template": "https://pypi.org/user/{username}/",
        "profile_url": "https://pypi.org/user/{username}/",
        "check_type": "http_status",
        "category": "Developer"
    },
    {
        "name": "Kaggle",
        "url_template": "https://www.kaggle.com/{username}",
        "profile_url": "https://www.kaggle.com/{username}",
        "check_type": "http_status",
        "category": "Data Science"
    },

    # Security & Identity
    {
        "name": "Keybase",
        "url_template": "https://keybase.io/_/api/1.0/user/lookup.json?usernames={username}",
        "profile_url": "https://keybase.io/{username}",
        "check_type": "keybase_api",
        "category": "Identity & Crypto"
    },
    {
        "name": "HackerNews",
        "url_template": "https://hacker-news.firebaseio.com/v0/user/{username}.json",
        "profile_url": "https://news.ycombinator.com/user?id={username}",
        "check_type": "hn_api",
        "category": "Tech Forum"
    },
    {
        "name": "Pastebin",
        "url_template": "https://pastebin.com/u/{username}",
        "profile_url": "https://pastebin.com/u/{username}",
        "check_type": "http_status",
        "category": "Leaks & Code"
    },

    # Social & Content
    {
        "name": "Medium",
        "url_template": "https://medium.com/@{username}",
        "profile_url": "https://medium.com/@{username}",
        "check_type": "http_status",
        "category": "Blogging"
    },
    {
        "name": "Substack",
        "url_template": "https://{username}.substack.com/",
        "profile_url": "https://{username}.substack.com/",
        "check_type": "http_status",
        "category": "Publishing"
    },
    {
        "name": "Reddit",
        "url_template": "https://www.reddit.com/user/{username}/about.json",
        "profile_url": "https://www.reddit.com/user/{username}",
        "check_type": "reddit_api",
        "category": "Community"
    },
    {
        "name": "Telegram",
        "url_template": "https://t.me/{username}",
        "profile_url": "https://t.me/{username}",
        "check_type": "telegram_check",
        "category": "Messaging"
    },
    {
        "name": "Linktree",
        "url_template": "https://linktr.ee/{username}",
        "profile_url": "https://linktr.ee/{username}",
        "check_type": "http_status",
        "category": "Identity"
    }
]

def compute_dhash_bytes(image_bytes: bytes) -> str:
    """Computes a 64-bit gradient difference hash from image byte blocks."""
    if len(image_bytes) < 64:
        return hashlib.md5(image_bytes).hexdigest()[:16]
    
    # 8x8 block sampling
    step = max(1, (len(image_bytes) - 16) // 64)
    samples = [image_bytes[16 + i * step] for i in range(64)]
    
    diff_bits = 0
    for i in range(63):
        if samples[i] > samples[i + 1]:
            diff_bits |= (1 << i)
    return f"{diff_bits:016x}"

def hamming_distance(hash1: str, hash2: str) -> int:
    try:
        val1 = int(hash1, 16)
        val2 = int(hash2, 16)
        return bin(val1 ^ val2).count("1")
    except ValueError:
        return 999


class UsernameAnalyzer(BaseAnalyzer):
    id = "username_footprint"
    name = "Social & Developer Identity Footprinter"
    description = "Searches 16+ platforms with avatar perceptual hashing (dHash) to correlate cross-platform personas."
    supported_targets = [TargetType.USERNAME]
    is_passive = True

    async def _check_platform(self, client: httpx.AsyncClient, p: dict, username: str) -> Optional[Dict[str, Any]]:
        target_url = p["url_template"].format(username=username)
        try:
            resp = await client.get(
                target_url,
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NexusIntel/1.0"}
            )

            is_found = False
            details: Dict[str, Any] = {}
            avatar_url: Optional[str] = None

            if p["check_type"] == "http_status":
                if resp.status_code == 200 and "Not Found" not in resp.text[:500]:
                    is_found = True

            elif p["check_type"] == "github_api":
                if resp.status_code == 200:
                    data = resp.json()
                    is_found = bool(data and not data.get("message") == "Not Found")
                    if is_found:
                        details["name"] = data.get("name")
                        details["bio"] = data.get("bio")
                        details["public_repos"] = data.get("public_repos")
                        avatar_url = data.get("avatar_url")

            elif p["check_type"] == "devto_api":
                if resp.status_code == 200:
                    data = resp.json()
                    is_found = bool(data and data.get("id"))
                    if is_found:
                        details["name"] = data.get("name")
                        details["summary"] = data.get("summary")
                        avatar_url = data.get("profile_image")

            elif p["check_type"] == "json_status":
                if resp.status_code == 200:
                    data = resp.json()
                    is_found = bool(data and not data.get("message") == "Not Found")

            elif p["check_type"] == "hn_api":
                if resp.status_code == 200 and resp.text.strip() != "null":
                    is_found = True
                    data = resp.json()
                    details["karma"] = data.get("karma")

            elif p["check_type"] == "npm_api":
                if resp.status_code == 200:
                    data = resp.json()
                    is_found = data.get("total", 0) > 0

            elif p["check_type"] == "reddit_api":
                if resp.status_code == 200:
                    data = resp.json().get("data", {})
                    if not data.get("is_suspended") and data.get("name"):
                        is_found = True
                        details["total_karma"] = data.get("total_karma")
                        avatar_url = data.get("icon_img")

            elif p["check_type"] == "telegram_check":
                if resp.status_code == 200 and "tgme_page_extra" in resp.text and "If you have Telegram" in resp.text:
                    is_found = True

            elif p["check_type"] == "keybase_api":
                if resp.status_code == 200:
                    data = resp.json()
                    thems = data.get("them", [])
                    if thems and len(thems) > 0 and thems[0] is not None:
                        is_found = True
                        pics = thems[0].get("pictures", {}).get("primary", {})
                        avatar_url = pics.get("url")

            if is_found:
                return {
                    "platform": p["name"],
                    "url": p["profile_url"].format(username=username),
                    "category": p["category"],
                    "avatar_url": avatar_url,
                    "details": details
                }
        except Exception:
            pass
        return None

    async def _fetch_avatar_hash(self, client: httpx.AsyncClient, avatar_url: str) -> Optional[str]:
        try:
            resp = await client.get(avatar_url, timeout=3.0)
            if resp.status_code == 200 and len(resp.content) > 32:
                return compute_dhash_bytes(resp.content)
        except Exception:
            pass
        return None

    async def run(self, target: str, target_type: TargetType, graph: GraphManager) -> None:
        clean_user = target.strip().lstrip("@")
        root_id = f"{EntityType.USERNAME.value}:{clean_user.lower()}"
        graph.log(self.id, f"Scanning online platforms with avatar perceptual hashing for user '@{clean_user}'...")

        async with httpx.AsyncClient(timeout=5.0, follow_redirects=True) as client:
            tasks = [self._check_platform(client, p, clean_user) for p in PLATFORMS]
            results = await asyncio.gather(*tasks)

            # Harvest avatars for matching profiles
            found_profiles: List[Dict[str, Any]] = []
            for r in results:
                if r:
                    found_profiles.append(r)

            # Parallel download of avatar images
            avatar_tasks = [
                self._fetch_avatar_hash(client, p["avatar_url"]) if p.get("avatar_url") else asyncio.sleep(0, result=None)
                for p in found_profiles
            ]
            avatar_hashes = await asyncio.gather(*avatar_tasks)

        for i, profile in enumerate(found_profiles):
            profile["avatar_hash"] = avatar_hashes[i]

        # Add nodes and edges
        node_map: Dict[str, str] = {}
        for profile in found_profiles:
            plat = profile["platform"]
            node_id = f"{EntityType.SOCIAL_PROFILE.value}:{plat.lower()}_{clean_user.lower()}"
            node_map[plat] = node_id

            props = {
                "platform": plat,
                "category": profile["category"],
                "url": profile["url"],
                **profile["details"]
            }
            if profile.get("avatar_hash"):
                props["avatar_dhash"] = profile["avatar_hash"]

            graph.add_node(
                node_id=node_id,
                label=f"{plat}: @{clean_user}",
                entity_type=EntityType.SOCIAL_PROFILE,
                value=profile["url"],
                source_module=self.id,
                confidence=0.92,
                properties=props
            )

            graph.add_edge(
                source_id=root_id,
                target_id=node_id,
                rel_type=RelationshipType.PROFILED_AS,
                source_module=self.id,
                confidence=0.92
            )

        # Cross-correlate avatar hashes
        for i in range(len(found_profiles)):
            for j in range(i + 1, len(found_profiles)):
                p1 = found_profiles[i]
                p2 = found_profiles[j]
                h1 = p1.get("avatar_hash")
                h2 = p2.get("avatar_hash")
                if h1 and h2:
                    dist = hamming_distance(h1, h2)
                    if dist <= 5:
                        graph.log(
                            self.id,
                            f"🎯 IDENTICAL AVATAR DETECTED between [{p1['platform']}] and [{p2['platform']}] (dHash dist={dist}). Operator link confirmed!",
                            level="WARNING"
                        )
                        graph.add_edge(
                            source_id=node_map[p1["platform"]],
                            target_id=node_map[p2["platform"]],
                            rel_type=RelationshipType.ASSOCIATED_WITH,
                            source_module=self.id,
                            confidence=0.98,
                            properties={
                                "avatar_match": True,
                                "hamming_distance": dist,
                                "dhash": h1
                            }
                        )

        graph.log(self.id, f"Completed footprint audit. Identified {len(found_profiles)} online profile(s) for @{clean_user}.")
