import test from "node:test";
import assert from "node:assert/strict";
import {
  parseFSReadTextFileParams,
  parsePermissionRequestParams,
  parsePattySessionStatus,
  parsePattyStatusUpdateParams,
  parseSessionUpdateParams,
  parseTerminalCreateParams,
  PATTY_STATUS_METHOD,
  PATTY_STATUS_UPDATE_METHOD,
  supportsPattyStatusMethod,
  usageDataFromPattyStatus,
} from "../src/acpProtocol";

test("parseSessionUpdateParams accepts main-v2 command, plan, and location updates", () => {
  const commands = parseSessionUpdateParams({
    sessionId: "s1",
    update: {
      sessionUpdate: "available_commands_update",
      availableCommands: [{ name: "review", description: "Review changes", input: { hint: "scope" } }],
    },
  });
  const plan = parseSessionUpdateParams({
    sessionId: "s1",
    update: { sessionUpdate: "plan", entries: [{ content: "Inspect", priority: "high", status: "in_progress" }] },
  });
  const tool = parseSessionUpdateParams({
    sessionId: "s1",
    update: { sessionUpdate: "tool_call", toolCallId: "t1", locations: [{ path: "src/app.ts", line: 7 }] },
  });

  assert.equal(commands.ok, true);
  assert.equal(plan.ok, true);
  assert.equal(tool.ok, true);
});

test("parseSessionUpdateParams rejects unknown or malformed frames without throwing", () => {
  const unknown = parseSessionUpdateParams({ sessionId: "s1", update: { sessionUpdate: "future_update", value: 1 } });
  const malformed = parseSessionUpdateParams({ sessionId: "s1", update: { sessionUpdate: "tool_call", locations: [] } });

  assert.deepEqual(unknown, { ok: false, error: "unsupported session update: future_update" });
  assert.equal(malformed.ok, false);
});

test("parseSessionUpdateParams keeps legacy Patty Code usage updates compatible", () => {
  assert.equal(parseSessionUpdateParams({
    sessionId: "s1",
    update: {
      sessionUpdate: "usage",
      usage: {
        promptTokens: 100,
        completionTokens: 25,
        totalTokens: 125,
        cacheHitTokens: 80,
        cacheMissTokens: 20,
        sessionCacheHitTokens: 180,
        sessionCacheMissTokens: 20,
      },
    },
  }).ok, true);
});

test("ACP client request parsers enforce required fields", () => {
  assert.equal(parseFSReadTextFileParams({ sessionId: "s1", path: "README.md", line: 1, limit: 20 }).ok, true);
  assert.equal(parseFSReadTextFileParams({ sessionId: "s1", path: "README.md", line: 0 }).ok, false);
  assert.equal(parseTerminalCreateParams({ sessionId: "s1", command: "npm", args: ["test"], outputByteLimit: 8192 }).ok, true);
  assert.equal(parseTerminalCreateParams({ sessionId: "s1", command: "npm", args: [3] }).ok, false);
  assert.equal(parsePermissionRequestParams({
    sessionId: "s1",
    toolCall: { toolCallId: "ask-1" },
    options: [{ optionId: "q:1", name: "One", kind: "allow_once" }],
  }).ok, true);
});

test("Patty Code status capability and current schema expose usage telemetry", () => {
  const capabilities = {
    _meta: {
      [PATTY_STATUS_METHOD]: { schemaVersion: 1 },
      [PATTY_STATUS_UPDATE_METHOD]: { schemaVersion: 1 },
    },
  };
  assert.equal(supportsPattyStatusMethod(capabilities, PATTY_STATUS_METHOD), true);
  assert.equal(supportsPattyStatusMethod(capabilities, PATTY_STATUS_UPDATE_METHOD), true);
  assert.equal(supportsPattyStatusMethod({ _meta: { [PATTY_STATUS_METHOD]: { schemaVersion: 2 } } }, PATTY_STATUS_METHOD), false);

  const status = pattyStatus(7, 120, 30, 80, 40, 180, 60);
  const parsed = parsePattySessionStatus(status);
  assert.equal(parsed.ok, true);
  assert.deepEqual(parsed.ok ? usageDataFromPattyStatus(parsed.value) : undefined, {
    promptTokens: 120,
    completionTokens: 30,
    totalTokens: 150,
    cacheHitTokens: 80,
    cacheMissTokens: 40,
    reasoningTokens: 12,
    sessionCacheHitTokens: 180,
    sessionCacheMissTokens: 60,
    cost: 0.0042,
    currency: "USD",
  });

  assert.equal(parsePattyStatusUpdateParams({
    schemaVersion: 1,
    sequence: 7,
    sessionId: "s1",
    event: "usage",
    status,
  }).ok, true);
});

test("Patty Code status parser rejects malformed and mismatched snapshots", () => {
  const status = pattyStatus(7, 120, 30, 80, 40, 180, 60);
  assert.equal(parsePattySessionStatus({ ...status, usage: { ...status.usage, turn: { ...status.usage.turn, promptTokens: -1 } } }).ok, false);
  assert.equal(parsePattyStatusUpdateParams({
    schemaVersion: 1,
    sequence: 8,
    sessionId: "s1",
    event: "usage",
    status,
  }).ok, false);
});

function pattyStatus(
  sequence: number,
  promptTokens: number,
  completionTokens: number,
  cacheHitTokens: number,
  cacheMissTokens: number,
  sessionCacheHitTokens: number,
  sessionCacheMissTokens: number,
) {
  const usage = (prompt: number, completion: number, hit: number, miss: number, cost: number | null) => ({
    promptTokens: prompt,
    completionTokens: completion,
    reasoningTokens: 12,
    cacheHitTokens: hit,
    cacheMissTokens: miss,
    estimated: false,
    cacheHitRatio: hit + miss > 0 ? hit / (hit + miss) : null,
    estimatedCost: cost,
    currency: cost === null ? null : "USD",
    usageSource: "executor",
  });
  return {
    schemaVersion: 1,
    sequence,
    sessionId: "s1",
    usage: {
      turn: usage(promptTokens, completionTokens, cacheHitTokens, cacheMissTokens, 0.0042),
      cumulative: usage(promptTokens, completionTokens, sessionCacheHitTokens, sessionCacheMissTokens, 0.0042),
    },
  };
}
