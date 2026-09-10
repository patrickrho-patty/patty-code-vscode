import type {
  ContentBlock,
  FSReadTextFileParams,
  FSWriteTextFileParams,
  PermissionRequestParams,
  PattySessionStatus,
  PattyStatusUpdateParams,
  SessionConfigOption,
  SessionUpdate,
  SessionUpdateParams,
  TerminalCreateParams,
  TerminalIDParams,
  UsageData,
} from "./acpTypes";

export const PATTY_STATUS_METHOD = "_patty.io/session/status";
export const PATTY_STATUS_UPDATE_METHOD = "_patty.io/session/status_update";
const PATTY_STATUS_SCHEMA_VERSION = 1;

export type ProtocolParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export function parseSessionUpdateParams(value: unknown): ProtocolParseResult<SessionUpdateParams> {
  if (!isRecord(value) || !nonEmptyString(value.sessionId) || !isRecord(value.update)) {
    return invalid("session/update params require sessionId and update");
  }
  const update = parseSessionUpdate(value.update);
  if (!update.ok) {
    return update;
  }
  return valid({ sessionId: value.sessionId, update: update.value });
}

export function supportsPattyStatusMethod(capabilities: unknown, method: string): boolean {
  if (!isRecord(capabilities) || !isRecord(capabilities._meta)) {
    return false;
  }
  const advertised = capabilities._meta[method];
  return isRecord(advertised) && advertised.schemaVersion === PATTY_STATUS_SCHEMA_VERSION;
}

export function parsePattySessionStatus(value: unknown): ProtocolParseResult<PattySessionStatus> {
  if (!isRecord(value) || value.schemaVersion !== PATTY_STATUS_SCHEMA_VERSION
    || !nonNegativeInteger(value.sequence) || !nonEmptyString(value.sessionId) || !isRecord(value.usage)
    || !isPattyStatusUsage(value.usage.turn) || !isPattyStatusUsage(value.usage.cumulative)) {
    return invalid("Mirr Code session status is malformed");
  }
  return valid(value as unknown as PattySessionStatus);
}

export function parsePattyStatusUpdateParams(value: unknown): ProtocolParseResult<PattyStatusUpdateParams> {
  if (!isRecord(value) || value.schemaVersion !== PATTY_STATUS_SCHEMA_VERSION
    || !nonNegativeInteger(value.sequence) || !nonEmptyString(value.sessionId) || !nonEmptyString(value.event)) {
    return invalid("Mirr Code status update is malformed");
  }
  const status = parsePattySessionStatus(value.status);
  if (!status.ok) {
    return status;
  }
  if (status.value.sequence !== value.sequence || status.value.sessionId !== value.sessionId) {
    return invalid("Mirr Code status update does not match its status snapshot");
  }
  return valid(value as unknown as PattyStatusUpdateParams);
}

export function usageDataFromPattyStatus(status: PattySessionStatus): UsageData {
  const turn = status.usage.turn;
  const cumulative = status.usage.cumulative;
  return {
    promptTokens: turn.promptTokens,
    completionTokens: turn.completionTokens,
    totalTokens: turn.promptTokens + turn.completionTokens,
    cacheHitTokens: turn.cacheHitTokens,
    cacheMissTokens: turn.cacheMissTokens,
    reasoningTokens: turn.reasoningTokens,
    sessionCacheHitTokens: cumulative.cacheHitTokens,
    sessionCacheMissTokens: cumulative.cacheMissTokens,
    ...(turn.estimatedCost === undefined || turn.estimatedCost === null ? {} : { cost: turn.estimatedCost }),
    ...(turn.currency === undefined || turn.currency === null ? {} : { currency: turn.currency }),
  };
}

export function parsePermissionRequestParams(value: unknown): ProtocolParseResult<PermissionRequestParams> {
  if (!isRecord(value) || !nonEmptyString(value.sessionId) || !isRecord(value.toolCall) || !Array.isArray(value.options)) {
    return invalid("permission request requires sessionId, toolCall, and options");
  }
  if (!nonEmptyString(value.toolCall.toolCallId)) {
    return invalid("permission toolCall requires toolCallId");
  }
  const options = value.options.filter(isPermissionOption);
  if (options.length !== value.options.length || options.length === 0) {
    return invalid("permission options are malformed or empty");
  }
  return valid(value as unknown as PermissionRequestParams);
}

export function parseFSReadTextFileParams(value: unknown): ProtocolParseResult<FSReadTextFileParams> {
  if (!isRecord(value) || !nonEmptyString(value.sessionId) || !nonEmptyString(value.path)) {
    return invalid("fs/read_text_file requires sessionId and path");
  }
  if (value.line !== undefined && !positiveInteger(value.line)) {
    return invalid("fs/read_text_file line must be a positive integer");
  }
  if (value.limit !== undefined && !positiveInteger(value.limit)) {
    return invalid("fs/read_text_file limit must be a positive integer");
  }
  return valid(value as unknown as FSReadTextFileParams);
}

export function parseFSWriteTextFileParams(value: unknown): ProtocolParseResult<FSWriteTextFileParams> {
  if (!isRecord(value) || !nonEmptyString(value.sessionId) || !nonEmptyString(value.path) || typeof value.content !== "string") {
    return invalid("fs/write_text_file requires sessionId, path, and content");
  }
  return valid(value as unknown as FSWriteTextFileParams);
}

export function parseTerminalCreateParams(value: unknown): ProtocolParseResult<TerminalCreateParams> {
  if (!isRecord(value) || !nonEmptyString(value.sessionId) || !nonEmptyString(value.command)) {
    return invalid("terminal/create requires sessionId and command");
  }
  if (value.args !== undefined && (!Array.isArray(value.args) || !value.args.every((arg) => typeof arg === "string"))) {
    return invalid("terminal/create args must be strings");
  }
  if (value.cwd !== undefined && typeof value.cwd !== "string") {
    return invalid("terminal/create cwd must be a string");
  }
  if (value.outputByteLimit !== undefined && !positiveInteger(value.outputByteLimit)) {
    return invalid("terminal/create outputByteLimit must be a positive integer");
  }
  return valid(value as unknown as TerminalCreateParams);
}

export function parseTerminalIDParams(value: unknown): ProtocolParseResult<TerminalIDParams> {
  if (!isRecord(value) || !nonEmptyString(value.sessionId) || !nonEmptyString(value.terminalId)) {
    return invalid("terminal request requires sessionId and terminalId");
  }
  return valid(value as unknown as TerminalIDParams);
}

function parseSessionUpdate(update: Record<string, unknown>): ProtocolParseResult<SessionUpdate> {
  const tag = update.sessionUpdate;
  if (typeof tag !== "string") {
    return invalid("session update is missing sessionUpdate");
  }
  switch (tag) {
    case "user_message_chunk":
    case "agent_message_chunk":
    case "agent_thought_chunk":
      return isContentBlock(update.content)
        ? valid(update as unknown as SessionUpdate)
        : invalid(`${tag} requires a valid content block`);
    case "tool_call":
      if (!nonEmptyString(update.toolCallId)) {
        return invalid("tool_call requires toolCallId");
      }
      if (update.locations !== undefined && (!Array.isArray(update.locations) || !update.locations.every(isToolLocation))) {
        return invalid("tool_call locations are malformed");
      }
      return valid(update as unknown as SessionUpdate);
    case "tool_call_update":
      if (!nonEmptyString(update.toolCallId)) {
        return invalid("tool_call_update requires toolCallId");
      }
      if (update.content !== undefined && (!Array.isArray(update.content) || !update.content.every(isToolContent))) {
        return invalid("tool_call_update content is malformed");
      }
      return valid(update as unknown as SessionUpdate);
    case "available_commands_update":
      return Array.isArray(update.availableCommands) && update.availableCommands.every(isAvailableCommand)
        ? valid(update as unknown as SessionUpdate)
        : invalid("available_commands_update requires valid commands");
    case "config_option_update":
      return Array.isArray(update.configOptions) && update.configOptions.every(isConfigOption)
        ? valid(update as unknown as SessionUpdate)
        : invalid("config_option_update requires valid configOptions");
    case "plan":
      return Array.isArray(update.entries) && update.entries.every(isPlanEntry)
        ? valid(update as unknown as SessionUpdate)
        : invalid("plan update requires valid entries");
    case "current_mode_update":
      return nonEmptyString(update.currentModeId)
        ? valid(update as unknown as SessionUpdate)
        : invalid("current_mode_update requires currentModeId");
    case "usage":
      return isUsage(update.usage)
        ? valid(update as unknown as SessionUpdate)
        : invalid("usage update is malformed");
    default:
      return invalid(`unsupported session update: ${tag}`);
  }
}

function isContentBlock(value: unknown): value is ContentBlock {
  if (!isRecord(value)) {
    return false;
  }
  if (value.type === "text") {
    return typeof value.text === "string";
  }
  if (value.type === "image") {
    return typeof value.data === "string" && nonEmptyString(value.mimeType);
  }
  return value.type === "resource" && isRecord(value.resource) && nonEmptyString(value.resource.uri)
    && (value.resource.text === undefined || typeof value.resource.text === "string")
    && (value.resource.mimeType === undefined || typeof value.resource.mimeType === "string");
}

function isToolContent(value: unknown): boolean {
  return isRecord(value) && typeof value.type === "string" && isContentBlock(value.content);
}

function isToolLocation(value: unknown): boolean {
  return isRecord(value) && nonEmptyString(value.path) && (value.line === undefined || positiveInteger(value.line));
}

function isAvailableCommand(value: unknown): boolean {
  return isRecord(value) && nonEmptyString(value.name) && typeof value.description === "string"
    && (value.input === undefined || (isRecord(value.input) && typeof value.input.hint === "string"));
}

function isConfigOption(value: unknown): value is SessionConfigOption {
  return isRecord(value) && nonEmptyString(value.id) && nonEmptyString(value.name)
    && typeof value.type === "string" && typeof value.currentValue === "string"
    && Array.isArray(value.options) && value.options.every((option) =>
      isRecord(option) && typeof option.value === "string" && nonEmptyString(option.name));
}

function isPlanEntry(value: unknown): boolean {
  return isRecord(value) && typeof value.content === "string" && typeof value.priority === "string" && typeof value.status === "string";
}

function isUsage(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }
  return ["promptTokens", "completionTokens", "totalTokens", "cacheHitTokens", "cacheMissTokens", "sessionCacheHitTokens", "sessionCacheMissTokens"]
    .every((key) => typeof value[key] === "number" && Number.isFinite(value[key]));
}

function isPattyStatusUsage(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }
  const counts = ["promptTokens", "completionTokens", "reasoningTokens", "cacheHitTokens", "cacheMissTokens"];
  return counts.every((key) => nonNegativeInteger(value[key]))
    && (value.estimated === undefined || typeof value.estimated === "boolean")
    && optionalFiniteNumber(value.cacheHitRatio)
    && optionalFiniteNumber(value.estimatedCost)
    && (value.currency === undefined || value.currency === null || typeof value.currency === "string")
    && typeof value.usageSource === "string";
}

function optionalFiniteNumber(value: unknown): boolean {
  return value === undefined || value === null || (typeof value === "number" && Number.isFinite(value));
}

function isPermissionOption(value: unknown): boolean {
  return isRecord(value) && nonEmptyString(value.optionId) && nonEmptyString(value.name) && nonEmptyString(value.kind);
}

function positiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function nonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function valid<T>(value: T): ProtocolParseResult<T> {
  return { ok: true, value };
}

function invalid<T>(error: string): ProtocolParseResult<T> {
  return { ok: false, error };
}
