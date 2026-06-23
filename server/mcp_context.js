import os from 'node:os';
import { existsSync } from 'node:fs';
import { getProcessId, getProcessStartTs } from './process.js';

// Resolved once at startup; install method can't change within a process.
const _install = existsSync('/.dockerenv')
  ? 'docker'
  : process.env.npm_config_user_agent
    ? 'npm'
    : 'local';

let _clientName = null;
let _clientVersion = null;
let _protocolVersion = null;
let _transport = null;

// Wraps the SDK's private `_oninitialize`; no public getter exposes clientInfo.
export function attachInitializeCapture(server, { transport = null } = {}) {
  _transport = transport;
  const orig = typeof server._oninitialize === 'function'
    ? server._oninitialize.bind(server)
    : null;
  if (!orig) return;
  server._oninitialize = async (request) => {
    const params = (request && request.params) || {};
    _clientName = params.clientInfo?.name ?? null;
    _clientVersion = params.clientInfo?.version ?? null;
    _protocolVersion = params.protocolVersion ?? null;
    return orig(request);
  };
}

export function getProcessContext(toolName = null) {
  return {
    'mcp.client.name': _clientName,
    'mcp.client.version': _clientVersion,
    'mcp.protocol.version': _protocolVersion,
    'mcp.transport': _transport,
    'mcp.tool.name': toolName,
    'mcp.process.id': getProcessId(),
    'mcp.process.start_ts': getProcessStartTs(),
    'mcp.os': `${os.platform()}-${os.arch()}`,
    'mcp.node': process.version,
    'mcp.install': _install,
    'mcp.promptguard.enabled': Boolean(process.env.HUGGINGFACE_API_TOKEN),
    'mcp.promptguard.timeout': Number(process.env.MODEL_TIMEOUT) || 10,
    'mcp.promptguard.allow_on_unavailable': process.env.MODEL_AVAILABILITY === 'true',
  };
}

export function resetMcpContextForTests() {
  _clientName = null;
  _clientVersion = null;
  _protocolVersion = null;
  _transport = null;
}
