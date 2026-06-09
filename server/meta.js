// `mcp.seq` increments per request, so outbound calls from one process can be
// ordered relative to each other.

import { getProcessContext, resetMcpContextForTests } from './mcp_context.js';
import { nextSeq, peekSeq, resetProcessForTests } from './process.js';

export const HEADER_NAME = 'X-Jellyfish-MCP-Meta';

export function getMetaPayload({ consumeSeq = true } = {}) {
  return {
    ...getProcessContext(),
    'mcp.seq': consumeSeq ? nextSeq() : peekSeq(),
  };
}

export function buildOutboundHeaders(baseHeaders) {
  return {
    ...baseHeaders,
    [HEADER_NAME]: JSON.stringify(getMetaPayload()),
  };
}

export function resetMetaForTests() {
  resetProcessForTests();
  resetMcpContextForTests();
}
