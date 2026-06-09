// `process_id` is per-MCP-process, not per-conversation: a client may reuse one
// process across many conversations, so treat this as process-lifetime identity.

import { randomUUID } from 'node:crypto';

let process_id = randomUUID();
let process_start_ts = Date.now();
let seq = 0;

export function getProcessId() {
  return process_id;
}

export function getProcessStartTs() {
  return process_start_ts;
}

export function nextSeq() {
  return ++seq;
}

export function peekSeq() {
  return seq;
}

export function resetProcessForTests() {
  process_id = randomUUID();
  process_start_ts = Date.now();
  seq = 0;
}
