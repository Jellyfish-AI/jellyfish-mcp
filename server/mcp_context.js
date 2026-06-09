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
let _tools = null;

function setClientInfo(info) {
  if (info && typeof info === 'object') {
    _clientName = info.name ?? null;
    _clientVersion = info.version ?? null;
  } else {
    _clientName = null;
    _clientVersion = null;
  }
}

export function setProtocolVersion(v) {
  _protocolVersion = v ?? null;
}

// No public getter exposes these post-handshake, so we wrap the SDK's
// private `_oninitialize`. No-op if the SDK changes.
export function attachInitializeCapture(server) {
  const orig = typeof server._oninitialize === 'function'
    ? server._oninitialize.bind(server)
    : null;
  if (!orig) return;
  server._oninitialize = async (request) => {
    const params = (request && request.params) || {};
    if (params.protocolVersion) setProtocolVersion(params.protocolVersion);
    if (params.clientInfo) setClientInfo(params.clientInfo);
    return orig(request);
  };
}

export function setTransport(t) {
  _transport = t ?? null;
}

// The tool invoked on the current call, set per CallTool request.
export function setTools(t) {
  _tools = t ?? null;
}

export function getProcessContext() {
  return {
    'mcp.client.name': _clientName,
    'mcp.client.version': _clientVersion,
    'mcp.protocol.version': _protocolVersion,
    'mcp.transport': _transport,
    'mcp.tools': _tools,
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
  _tools = null;
}
