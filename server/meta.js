// `mcp.seq` counts outbound API calls, not tool invocations.
import { getProcessContext, resetMcpContextForTests } from './mcp_context.js';
import { nextSeq, resetProcessForTests } from './process.js';

export const HEADER_NAME = 'X-Jellyfish-MCP-Meta';

export function getMetaPayload({ toolName = null } = {}) {
  return {
    ...getProcessContext(toolName),
    'mcp.seq': nextSeq(),
  };
}

export function buildOutboundHeaders(baseHeaders, { toolName = null } = {}) {
  return {
    ...baseHeaders,
    [HEADER_NAME]: JSON.stringify(getMetaPayload({ toolName })),
  };
}

export function resetMetaForTests() {
  resetProcessForTests();
  resetMcpContextForTests();
}
