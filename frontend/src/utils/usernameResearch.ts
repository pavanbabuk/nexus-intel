/**
 * Sector: Persona & Handle Forensics (North Star Username Module)
 * Client-Side Helper & Platform Registry
 */

export interface SocialProbeTarget {
  name: string;
  category: 'Developer' | 'Tech & Crypto' | 'AI & Data' | 'Gaming & Esports' | 'Social & Media' | 'Creative';
  icon: string;
  profileUrl: string;
  checkUrl: string;
  checkType: 'cors_fetch' | 'cors_json' | 'jsonp' | 'direct_link';
}

export interface PlatformProbeResult {
  name: string;
  category: string;
  profileUrl: string;
  status: 'found' | 'not_found' | 'checking' | 'error' | 'blocked_by_cors';
  details?: Record<string, any>;
  avatarUrl?: string;
  latencyMs?: number;
}

export interface BreachComboRecord {
  account: string;
  maskedPassword?: string;
  source: string;
}

export interface PersonaHunterState {
  targetHandle: string;
  isScanning: boolean;
  progressPercent: number;
  totalPlatforms: number;
  foundCount: number;
  results: PlatformProbeResult[];
  breachRecords: BreachComboRecord[];
  pwnedPasswordCount?: number;
}

/**
 * Curated list of 30+ major platforms with clean direct profile formats
 */
export const PLATFORM_REGISTRY: SocialProbeTarget[] = [
  // Developer & Code
  {
    name: 'GitHub',
    category: 'Developer',
    icon: '💻',
    profileUrl: 'https://github.com/{username}',
    checkUrl: 'https://api.github.com/users/{username}',
    checkType: 'cors_json'
  },
  {
    name: 'GitLab',
    category: 'Developer',
    icon: '🦊',
    profileUrl: 'https://gitlab.com/{username}',
    checkUrl: 'https://gitlab.com/api/v4/users?username={username}',
    checkType: 'cors_json'
  },
  {
    name: 'DockerHub',
    category: 'Developer',
    icon: '🐳',
    profileUrl: 'https://hub.docker.com/u/{username}',
    checkUrl: 'https://hub.docker.com/v2/users/{username}/',
    checkType: 'direct_link'
  },
  {
    name: 'npm',
    category: 'Developer',
    icon: '📦',
    profileUrl: 'https://www.npmjs.com/~{username}',
    checkUrl: 'https://registry.npmjs.org/-/v1/search?text=maintainer:{username}&size=1',
    checkType: 'cors_json'
  },
  {
    name: 'Dev.to',
    category: 'Developer',
    icon: '✍️',
    profileUrl: 'https://dev.to/{username}',
    checkUrl: 'https://dev.to/api/users/by_username?url={username}',
    checkType: 'cors_json'
  },
  {
    name: 'Replit',
    category: 'Developer',
    icon: '🌀',
    profileUrl: 'https://replit.com/@{username}',
    checkUrl: 'https://replit.com/@{username}',
    checkType: 'direct_link'
  },
  {
    name: 'StackOverflow',
    category: 'Developer',
    icon: '🥞',
    profileUrl: 'https://stackoverflow.com/users/{username}',
    checkUrl: 'https://stackoverflow.com/users/{username}',
    checkType: 'direct_link'
  },

  // Tech & Crypto
  {
    name: 'Keybase',
    category: 'Tech & Crypto',
    icon: '🔑',
    profileUrl: 'https://keybase.io/{username}',
    checkUrl: 'https://keybase.io/_/api/1.0/user/lookup.json?usernames={username}',
    checkType: 'cors_json'
  },
  {
    name: 'HackerNews',
    category: 'Tech & Crypto',
    icon: '🧡',
    profileUrl: 'https://news.ycombinator.com/user?id={username}',
    checkUrl: 'https://hacker-news.firebaseio.com/v0/user/{username}.json',
    checkType: 'cors_json'
  },
  {
    name: 'ProductHunt',
    category: 'Tech & Crypto',
    icon: '😸',
    profileUrl: 'https://www.producthunt.com/@{username}',
    checkUrl: 'https://www.producthunt.com/@{username}',
    checkType: 'direct_link'
  },

  // AI & Data Science
  {
    name: 'HuggingFace',
    category: 'AI & Data',
    icon: '🤗',
    profileUrl: 'https://huggingface.co/{username}',
    checkUrl: 'https://huggingface.co/api/users/{username}/overview',
    checkType: 'cors_json'
  },
  {
    name: 'Kaggle',
    category: 'AI & Data',
    icon: '📊',
    profileUrl: 'https://www.kaggle.com/{username}',
    checkUrl: 'https://www.kaggle.com/{username}',
    checkType: 'direct_link'
  },
  {
    name: 'Codeforces',
    category: 'AI & Data',
    icon: '⚔️',
    profileUrl: 'https://codeforces.com/profile/{username}',
    checkUrl: 'https://codeforces.com/api/user.info?handles={username}',
    checkType: 'cors_json'
  },

  // Gaming & Esports
  {
    name: 'Chess.com',
    category: 'Gaming & Esports',
    icon: '♟️',
    profileUrl: 'https://www.chess.com/member/{username}',
    checkUrl: 'https://api.chess.com/pub/player/{username}',
    checkType: 'cors_json'
  },
  {
    name: 'Lichess',
    category: 'Gaming & Esports',
    icon: '♞',
    profileUrl: 'https://lichess.org/@/{username}',
    checkUrl: 'https://lichess.org/api/user/{username}',
    checkType: 'cors_json'
  },
  {
    name: 'Steam',
    category: 'Gaming & Esports',
    icon: '🎮',
    profileUrl: 'https://steamcommunity.com/id/{username}',
    checkUrl: 'https://steamcommunity.com/id/{username}',
    checkType: 'direct_link'
  },
  {
    name: 'Roblox',
    category: 'Gaming & Esports',
    icon: '🟥',
    profileUrl: 'https://www.roblox.com/user.aspx?username={username}',
    checkUrl: 'https://www.roblox.com/user.aspx?username={username}',
    checkType: 'direct_link'
  },

  // Creative & Media
  {
    name: 'Scratch',
    category: 'Creative',
    icon: '🐱',
    profileUrl: 'https://scratch.mit.edu/users/{username}',
    checkUrl: 'https://api.scratch.mit.edu/users/{username}',
    checkType: 'cors_json'
  },
  {
    name: 'SoundCloud',
    category: 'Creative',
    icon: '🎵',
    profileUrl: 'https://soundcloud.com/{username}',
    checkUrl: 'https://soundcloud.com/{username}',
    checkType: 'direct_link'
  },
  {
    name: 'Spotify',
    category: 'Creative',
    icon: '🎧',
    profileUrl: 'https://open.spotify.com/user/{username}',
    checkUrl: 'https://open.spotify.com/user/{username}',
    checkType: 'direct_link'
  },
  {
    name: 'Dribbble',
    category: 'Creative',
    icon: '🏀',
    profileUrl: 'https://dribbble.com/{username}',
    checkUrl: 'https://dribbble.com/{username}',
    checkType: 'direct_link'
  },
  {
    name: 'Behance',
    category: 'Creative',
    icon: '🎨',
    profileUrl: 'https://www.behance.net/{username}',
    checkUrl: 'https://www.behance.net/{username}',
    checkType: 'direct_link'
  },

  // Social & Media
  {
    name: 'Mastodon',
    category: 'Social & Media',
    icon: '🐘',
    profileUrl: 'https://mastodon.social/@{username}',
    checkUrl: 'https://mastodon.social/api/v1/accounts/lookup?acct={username}',
    checkType: 'cors_json'
  },
  {
    name: 'Telegram',
    category: 'Social & Media',
    icon: '✈️',
    profileUrl: 'https://t.me/{username}',
    checkUrl: 'https://t.me/{username}',
    checkType: 'direct_link'
  },
  {
    name: 'Reddit',
    category: 'Social & Media',
    icon: '🤖',
    profileUrl: 'https://www.reddit.com/user/{username}',
    checkUrl: 'https://www.reddit.com/user/{username}',
    checkType: 'direct_link'
  },
  {
    name: 'X (Twitter)',
    category: 'Social & Media',
    icon: '🐦',
    profileUrl: 'https://x.com/{username}',
    checkUrl: 'https://x.com/{username}',
    checkType: 'direct_link'
  },
  {
    name: 'TikTok',
    category: 'Social & Media',
    icon: '📱',
    profileUrl: 'https://www.tiktok.com/@{username}',
    checkUrl: 'https://www.tiktok.com/@{username}',
    checkType: 'direct_link'
  },
  {
    name: 'Pinterest',
    category: 'Social & Media',
    icon: '📌',
    profileUrl: 'https://www.pinterest.com/{username}/',
    checkUrl: 'https://www.pinterest.com/{username}/',
    checkType: 'direct_link'
  },
  {
    name: 'Substack',
    category: 'Social & Media',
    icon: '📰',
    profileUrl: 'https://{username}.substack.com',
    checkUrl: 'https://{username}.substack.com',
    checkType: 'direct_link'
  },
  {
    name: 'Medium',
    category: 'Social & Media',
    icon: '📖',
    profileUrl: 'https://medium.com/@{username}',
    checkUrl: 'https://medium.com/@{username}',
    checkType: 'direct_link'
  },
  {
    name: 'Disqus',
    category: 'Social & Media',
    icon: '💬',
    profileUrl: 'https://disqus.com/by/{username}/',
    checkUrl: 'https://disqus.com/by/{username}/',
    checkType: 'direct_link'
  },
  {
    name: 'Linktree',
    category: 'Social & Media',
    icon: '🌲',
    profileUrl: 'https://linktr.ee/{username}',
    checkUrl: 'https://linktr.ee/{username}',
    checkType: 'direct_link'
  }
];

/**
 * Checks HIBP Pwned Passwords via pure client-side k-Anonymity (SHA-1 prefix range).
 * Never transmits the target password or full hash across the wire!
 */
export async function checkPwnedPasswordKAnonymity(password: string): Promise<number> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const fullHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    const prefix = fullHash.substring(0, 5);
    const suffix = fullHash.substring(5);

    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    if (!res.ok) return 0;
    const text = await res.text();
    const lines = text.split('\n');

    for (const line of lines) {
      const [h, countStr] = line.trim().split(':');
      if (h === suffix) {
        return parseInt(countStr, 10) || 0;
      }
    }
    return 0;
  } catch (err) {
    console.warn('Pwned password k-anonymity check failed:', err);
    return 0;
  }
}
