export type SearchEngine = 'google' | 'duckduckgo' | 'bing' | 'github' | 'shodan';

export interface GhdbCategory {
  id: string;
  name: string;
  badge: string;
  icon: string;
  description: string;
}

export interface GhdbDork {
  id: string;
  category: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  queryTemplate: string;
}

export const GHDB_CATEGORIES: GhdbCategory[] = [
  {
    id: 'secrets',
    name: 'Secrets & Configs',
    badge: 'CRITICAL',
    icon: 'KeyRound',
    description: 'Exposed environment variables, private keys, database dumps, and API secrets.'
  },
  {
    id: 'admin',
    name: 'Admin & Login Portals',
    badge: 'HIGH',
    icon: 'ShieldAlert',
    description: 'Unauthenticated administrative panels, staging logins, and management consoles.'
  },
  {
    id: 'dirindex',
    name: 'Directory Listing',
    badge: 'MEDIUM',
    icon: 'FolderTree',
    description: 'Web servers exposing directory indexes (Index of /) with downloadable assets.'
  },
  {
    id: 'cloud',
    name: 'Cloud Storage & Buckets',
    badge: 'HIGH',
    icon: 'Cloud',
    description: 'Public AWS S3, Google Cloud Storage, and Azure Blob storage containers.'
  },
  {
    id: 'docs',
    name: 'Leaked Documents',
    badge: 'MEDIUM',
    icon: 'FileText',
    description: 'Confidential corporate PDFs, internal spreadsheets, financial reports, and NDAs.'
  },
  {
    id: 'errors',
    name: 'Stack Traces & Debug',
    badge: 'MEDIUM',
    icon: 'Bug',
    description: 'Application framework debug modes (Django, Laravel Ignition, PHP fatal errors).'
  },
  {
    id: 'code',
    name: 'Source Code & Repos',
    badge: 'HIGH',
    icon: 'Code2',
    description: 'Exposed .git folders, SVN repositories, source code backups, and Pastebin dumps.'
  },
  {
    id: 'vulns',
    name: 'Vulnerabilities & CVEs',
    badge: 'HIGH',
    icon: 'AlertTriangle',
    description: 'Outdated CMS setups, phpMyAdmin, Webmin, Jenkins, and vulnerable components.'
  }
];

export const GHDB_DORKS: GhdbDork[] = [
  // 1. Secrets & Configs
  {
    id: 'sec-1',
    category: 'secrets',
    title: '.env Files with Database Passwords',
    description: 'Finds exposed environment files containing DB credentials and APP_KEYs.',
    severity: 'CRITICAL',
    queryTemplate: 'site:{domain} ext:env OR ext:yml OR ext:yaml "DB_PASSWORD" OR "DATABASE_URL"'
  },
  {
    id: 'sec-2',
    category: 'secrets',
    title: 'Private RSA / SSH Keys & Certificates',
    description: 'Detects accidentally exposed private keys (.pem, .key, .p12, id_rsa).',
    severity: 'CRITICAL',
    queryTemplate: 'site:{domain} ext:pem OR ext:key OR ext:p12 "BEGIN PRIVATE KEY" OR "BEGIN RSA PRIVATE KEY"'
  },
  {
    id: 'sec-3',
    category: 'secrets',
    title: 'SQL Database Backups & Dumps',
    description: 'Uncovers raw MySQL, PostgreSQL, or SQLite database dump files.',
    severity: 'CRITICAL',
    queryTemplate: 'site:{domain} ext:sql OR ext:sql.gz OR ext:dump OR ext:tar.gz "CREATE TABLE" OR "INSERT INTO"'
  },
  {
    id: 'sec-4',
    category: 'secrets',
    title: 'AWS & Cloud Credentials Configs',
    description: 'Discovers AWS access keys, S3 credentials, and cloud config files.',
    severity: 'CRITICAL',
    queryTemplate: 'site:{domain} "aws_access_key_id" OR "aws_secret_access_key" ext:json OR ext:txt OR ext:ini'
  },
  {
    id: 'sec-5',
    category: 'secrets',
    title: 'WordPress wp-config.php Backups',
    description: 'Looks for backup copies of wp-config.php containing DB passwords.',
    severity: 'CRITICAL',
    queryTemplate: 'site:{domain} inurl:wp-config.php.bak OR inurl:wp-config.php.save OR inurl:wp-config.php.txt'
  },
  {
    id: 'sec-6',
    category: 'secrets',
    title: 'Configuration Files (.conf, .ini, .cfg)',
    description: 'Finds server configuration files with sensitive variables.',
    severity: 'HIGH',
    queryTemplate: 'site:{domain} ext:conf OR ext:cfg OR ext:ini "password" OR "passwd" OR "auth"'
  },

  // 2. Admin & Login Portals
  {
    id: 'adm-1',
    category: 'admin',
    title: 'Administrative Login Panels',
    description: 'Finds administrative access portals and dashboards.',
    severity: 'HIGH',
    queryTemplate: 'site:{domain} inurl:admin OR inurl:login OR inurl:dashboard OR inurl:portal'
  },
  {
    id: 'adm-2',
    category: 'admin',
    title: 'cPanel / WebHost Manager Interfaces',
    description: 'Direct access to hosting management panels (ports 2082, 2083, 2086).',
    severity: 'HIGH',
    queryTemplate: 'site:{domain} inurl:cpanel OR inurl:whm OR inurl:kpanel OR intitle:"cPanel Login"'
  },
  {
    id: 'adm-3',
    category: 'admin',
    title: 'phpMyAdmin Database Control Panels',
    description: 'Exposed phpMyAdmin instances allowing web database management.',
    severity: 'CRITICAL',
    queryTemplate: 'site:{domain} inurl:phpmyadmin OR inurl:pma OR intitle:"phpMyAdmin" "Welcome to"'
  },
  {
    id: 'adm-4',
    category: 'admin',
    title: 'Single Sign-On (SSO) & Internal Auth Portals',
    description: 'Finds corporate Okta, Auth0, Keycloak, or SAML authentication endpoints.',
    severity: 'MEDIUM',
    queryTemplate: 'site:{domain} inurl:auth OR inurl:sso OR inurl:saml OR inurl:oauth'
  },
  {
    id: 'adm-5',
    category: 'admin',
    title: 'VPN & Remote Desktop Gateways',
    description: 'Exposed Cisco AnyConnect, Pulse Secure, GlobalProtect, or OpenVPN web portals.',
    severity: 'HIGH',
    queryTemplate: 'site:{domain} inurl:+CSCOE+ OR inurl:dana-na OR inurl:global-protect OR intitle:"SSL VPN Service"'
  },

  // 3. Directory Listing & Traversal
  {
    id: 'dir-1',
    category: 'dirindex',
    title: 'Open Root Directory Index',
    description: 'Web servers serving unauthenticated autoindex folder directories.',
    severity: 'MEDIUM',
    queryTemplate: 'site:{domain} intitle:"Index of /" -inurl:html'
  },
  {
    id: 'dir-2',
    category: 'dirindex',
    title: 'Index of /backup and /archive',
    description: 'Open backup directories with downloadable archives.',
    severity: 'HIGH',
    queryTemplate: 'site:{domain} intitle:"Index of" "backup" OR "archive" OR "dump"'
  },
  {
    id: 'dir-3',
    category: 'dirindex',
    title: 'Index of /uploads and /storage',
    description: 'Open folders storing user-uploaded files, receipts, and media.',
    severity: 'MEDIUM',
    queryTemplate: 'site:{domain} intitle:"Index of" "uploads" OR "storage" OR "media"'
  },
  {
    id: 'dir-4',
    category: 'dirindex',
    title: 'Index of /logs',
    description: 'Server access logs, error logs, and audit trails exposed via directory listing.',
    severity: 'HIGH',
    queryTemplate: 'site:{domain} intitle:"Index of" inurl:log OR inurl:logs "access.log" OR "error.log"'
  },

  // 4. Cloud Storage & Buckets
  {
    id: 'cld-1',
    category: 'cloud',
    title: 'Public AWS S3 Buckets for Target',
    description: 'Searches Amazon S3 global endpoints matching target brand name.',
    severity: 'HIGH',
    queryTemplate: 'site:s3.amazonaws.com "{brand}"'
  },
  {
    id: 'cld-2',
    category: 'cloud',
    title: 'Google Cloud Storage Buckets',
    description: 'Searches Google Cloud Storage containers matching target brand.',
    severity: 'HIGH',
    queryTemplate: 'site:storage.googleapis.com "{brand}"'
  },
  {
    id: 'cld-3',
    category: 'cloud',
    title: 'Microsoft Azure Blob Storage',
    description: 'Searches Azure Blob storage containers for target files.',
    severity: 'HIGH',
    queryTemplate: 'site:blob.core.windows.net "{brand}"'
  },
  {
    id: 'cld-4',
    category: 'cloud',
    title: 'DigitalOcean Spaces Buckets',
    description: 'Searches DigitalOcean Spaces storage endpoints.',
    severity: 'MEDIUM',
    queryTemplate: 'site:digitaloceanspaces.com "{brand}"'
  },

  // 5. Leaked Documents & Sensitive Files
  {
    id: 'doc-1',
    category: 'docs',
    title: 'Confidential PDFs & Strategy Documents',
    description: 'Searches for PDF documents tagged confidential or internal use only.',
    severity: 'MEDIUM',
    queryTemplate: 'site:{domain} ext:pdf "confidential" OR "internal use only" OR "privileged"'
  },
  {
    id: 'doc-2',
    category: 'docs',
    title: 'Excel / CSV Spreadsheets with Salaries / PII',
    description: 'Financial spreadsheets, employee salary matrices, and customer tables.',
    severity: 'HIGH',
    queryTemplate: 'site:{domain} ext:xlsx OR ext:xls OR ext:csv "salary" OR "budget" OR "ssn" OR "revenue"'
  },
  {
    id: 'doc-3',
    category: 'docs',
    title: 'Word Documents with Passwords / Credentials',
    description: 'Onboarding docs and internal guides containing default passwords.',
    severity: 'HIGH',
    queryTemplate: 'site:{domain} ext:docx OR ext:doc "password" OR "login details" OR "credentials"'
  },

  // 6. Stack Traces & Debug
  {
    id: 'err-1',
    category: 'errors',
    title: 'Django Debug Mode & Secret Key Leaks',
    description: 'Web applications running Django with DEBUG=True enabled.',
    severity: 'HIGH',
    queryTemplate: 'site:{domain} "DisallowedHost at /" OR "TemplateDoesNotExist" OR "Django Version"'
  },
  {
    id: 'err-2',
    category: 'errors',
    title: 'PHP Fatal Errors & File Paths',
    description: 'Exposed internal server file paths from unhandled PHP exceptions.',
    severity: 'MEDIUM',
    queryTemplate: 'site:{domain} "PHP Fatal error:" OR "PHP Warning:" OR "Call to undefined function"'
  },
  {
    id: 'err-3',
    category: 'errors',
    title: 'SQL Syntax Error Disclosures',
    description: 'Uncovered SQL injection attack surfaces or database schema errors.',
    severity: 'HIGH',
    queryTemplate: 'site:{domain} "SQL syntax" OR "mysql_fetch_array" OR "ORA-01756" OR "PostgreSQL error"'
  },
  {
    id: 'err-4',
    category: 'errors',
    title: 'Spring Boot Whitelabel Error Pages',
    description: 'Java Spring Boot applications in debug error state disclosing stack traces.',
    severity: 'MEDIUM',
    queryTemplate: 'site:{domain} "Whitelabel Error Page" "This application has no explicit mapping for /error"'
  },

  // 7. Source Code & Repos
  {
    id: 'cod-1',
    category: 'code',
    title: 'Exposed .git Folder & Repositories',
    description: 'Web directories exposing live .git repositories for source extraction.',
    severity: 'CRITICAL',
    queryTemplate: 'site:{domain} inurl:".git" "HEAD" OR "config"'
  },
  {
    id: 'cod-2',
    category: 'code',
    title: 'Exposed .svn and Mercurial Repositories',
    description: 'Subversion (.svn/entries) and Mercurial (.hg) folder structures.',
    severity: 'HIGH',
    queryTemplate: 'site:{domain} inurl:".svn/entries" OR inurl:".hg"'
  },
  {
    id: 'cod-3',
    category: 'code',
    title: 'Pastebin Leaks Matching Domain',
    description: 'Pastes on Pastebin containing credentials or code for target domain.',
    severity: 'HIGH',
    queryTemplate: 'site:pastebin.com "{domain}" OR "{brand}"'
  },
  {
    id: 'cod-4',
    category: 'code',
    title: 'GitHub Commits with Domain Secrets',
    description: 'GitHub code search for hardcoded secrets matching target domain.',
    severity: 'CRITICAL',
    queryTemplate: '"{domain}" (filename:.env OR filename:credentials OR "api_key")'
  },

  // 8. Vulnerabilities & Software
  {
    id: 'vul-1',
    category: 'vulns',
    title: 'Jenkins Automation Servers Exposed',
    description: 'Jenkins CI/CD automation interfaces without authentication.',
    severity: 'CRITICAL',
    queryTemplate: 'site:{domain} inurl:8080 intitle:"Dashboard [Jenkins]" OR "Manage Jenkins"'
  },
  {
    id: 'vul-2',
    category: 'vulns',
    title: 'Kibana / Elasticsearch Dashboards',
    description: 'Exposed Kibana data visualization dashboards and cluster health endpoints.',
    severity: 'CRITICAL',
    queryTemplate: 'site:{domain} inurl:5601 "app/kibana" OR inurl:9200 "_cat/indices"'
  },
  {
    id: 'vul-3',
    category: 'vulns',
    title: 'Swagger & OpenAPI Documentation',
    description: 'Interactive API documentation revealing endpoints, parameters, and tokens.',
    severity: 'MEDIUM',
    queryTemplate: 'site:{domain} inurl:swagger-ui.html OR inurl:api-docs OR inurl:openapi.json'
  }
];

export function cleanDomain(target: string): string {
  let cleaned = target.trim().toLowerCase();
  cleaned = cleaned.replace(/^https?:\/\//i, '');
  cleaned = cleaned.split('/')[0];
  cleaned = cleaned.split(':')[0];
  return cleaned;
}

export function extractBrandName(domain: string): string {
  const parts = domain.split('.');
  if (parts.length >= 2) {
    return parts[parts.length - 2];
  }
  return domain;
}

export function compileDorkQuery(template: string, rawTarget: string): string {
  const domain = cleanDomain(rawTarget) || 'example.com';
  const brand = extractBrandName(domain);

  return template
    .replace(/{domain}/g, domain)
    .replace(/{target}/g, domain)
    .replace(/{brand}/g, brand);
}

export function buildSearchEngineUrl(query: string, engine: SearchEngine): string {
  const enc = encodeURIComponent(query);
  switch (engine) {
    case 'google':
      return `https://www.google.com/search?q=${enc}`;
    case 'duckduckgo':
      return `https://duckduckgo.com/?q=${enc}`;
    case 'bing':
      return `https://www.bing.com/search?q=${enc}`;
    case 'github':
      return `https://github.com/search?type=code&q=${enc}`;
    case 'shodan':
      return `https://www.shodan.io/search?query=${enc}`;
    default:
      return `https://www.google.com/search?q=${enc}`;
  }
}
