// process_id is per-process, not per-conversation.
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

export function resetProcessForTests() {
  process_id = randomUUID();
  process_start_ts = Date.now();
  seq = 0;
}
