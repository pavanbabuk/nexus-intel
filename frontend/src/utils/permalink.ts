import { InvestigationDetail } from '../types';

/**
 * Compresses an investigation into a compact URL-safe hash string.
 * Uses native CompressionStream('gzip') with Base64URL encoding.
 */
export async function compressInvestigation(detail: InvestigationDetail): Promise<string> {
  // Minimize the payload by stripping heavy unnecessary fields
  const slimDetail = {
    id: detail.id,
    target: detail.target,
    target_type: detail.target_type,
    case_name: detail.case_name,
    created_at: detail.created_at,
    status: detail.status,
    active_analyzers: detail.active_analyzers || [],
    nodes: detail.nodes.map(n => ({
      id: n.id,
      label: n.label,
      type: n.type,
      value: n.value,
      confidence: n.confidence,
      first_seen: n.first_seen,
      source_module: n.source_module,
      properties: {
        origin_ip: n.properties?.origin_ip,
        is_origin_server: n.properties?.is_origin_server,
        exposed: n.properties?.exposed,
        latitude: n.properties?.latitude,
        longitude: n.properties?.longitude,
        country: n.properties?.country,
        city: n.properties?.city,
        title: n.properties?.title
      }
    })),
    edges: detail.edges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: e.type,
      confidence: e.confidence,
      source_module: e.source_module,
      properties: e.properties || {}
    })),
    scorecard: detail.scorecard,
    logs: detail.logs.slice(-20) // Keep last 20 audit events
  };

  const jsonStr = JSON.stringify(slimDetail);

  // Modern browser CompressionStream
  if (typeof CompressionStream !== 'undefined') {
    try {
      const stream = new Blob([jsonStr]).stream().pipeThrough(new CompressionStream('gzip'));
      const response = new Response(stream);
      const buffer = await response.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } catch (e) {
      console.warn('CompressionStream failed, falling back to base64', e);
    }
  }

  // Fallback to URL-safe base64
  return btoa(encodeURIComponent(jsonStr)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Decompresses a URL-safe hash string into an InvestigationDetail object.
 */
export async function decompressInvestigation(hash: string): Promise<InvestigationDetail | null> {
  try {
    let base64 = hash.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';

    if (typeof DecompressionStream !== 'undefined') {
      try {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
        const response = new Response(stream);
        const text = await response.text();
        return JSON.parse(text) as InvestigationDetail;
      } catch {
        // Fallback if not gzip compressed
      }
    }

    // Try standard base64 fallback
    const raw = decodeURIComponent(atob(base64));
    return JSON.parse(raw) as InvestigationDetail;
  } catch (err) {
    console.error('Failed to hydrate investigation permalink from hash', err);
    return null;
  }
}

/**
 * Generates a full shareable permalink URL.
 */
export async function generatePermalinkUrl(detail: InvestigationDetail): Promise<string> {
  const hash = await compressInvestigation(detail);
  const origin = window.location.origin;
  const pathname = window.location.pathname;
  return `${origin}${pathname}#/share=${hash}`;
}
