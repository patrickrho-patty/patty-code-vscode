import * as assert from "node:assert/strict";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as vscode from "vscode";

type TestRecord = Record<string, any>;

export async function run(): Promise<void> {
  const fakeAcp = process.env.PATTY_FAKE_ACP;
  const fakeLog = process.env.PATTY_FAKE_LOG;
  const workspacePath = process.env.PATTY_TEST_WORKSPACE;
  const binaryMode = process.env.PATTY_TEST_BINARY_MODE;
  assert.ok(fakeAcp);
  assert.ok(fakeLog);
  assert.ok(workspacePath);

  const folder = await waitForWorkspace();
  assert.equal(comparablePath(folder.uri.fsPath), comparablePath(workspacePath));

  const extension = vscode.extensions.getExtension("SivanLiu.patty-code-vscode");
  assert.ok(extension);
  await extension.activate();
  await waitForCommand("pattyCode.newSession");

  await vscode.workspace.getConfiguration("patcode").update("binaryPath", binaryMode === "path" ? "" : fakeAcp, vscode.ConfigurationTarget.Workspace);
  await vscode.workspace.getConfiguration("patcode").update("model", "fake/default", vscode.ConfigurationTarget.Workspace);
  await vscode.workspace.getConfiguration("patcode").update("trace", false, vscode.ConfigurationTarget.Workspace);
  await vscode.workspace.getConfiguration("patcode").update("includeSelectionMode", "off", vscode.ConfigurationTarget.Workspace);
  await waitForConfig("binaryPath", binaryMode === "path" ? "" : fakeAcp);
  await waitForConfig("model", "fake/default");
  await waitForConfig("includeSelectionMode", "off");

  await vscode.commands.executeCommand("pattyCode.openChat");
  await vscode.commands.executeCommand("pattyCode.newSession");
  const startEvent = await waitForLog(fakeLog, "process/start");
  assert.deepEqual(startEvent.argv, ["acp", "--model", "fake/default"]);
  const initialize = await waitForLog(fakeLog, "initialize");
  assert.deepEqual(initialize.params?.clientCapabilities, {
    fs: { readTextFile: true, writeTextFile: true },
    terminal: true,
  });
  await waitForLog(fakeLog, "session/new");
  const initialSnapshot = await waitForSnapshot((state) => Array.isArray(state.availableCommands) && state.availableCommands.length === 2);
  assert.equal(initialSnapshot.modes?.currentModeId, "normal");
  assert.equal(initialSnapshot.configOptions?.length, 4);
  assert.equal(initialSnapshot.sessions?.length, 1);
  await waitForLog(fakeLog, "_patty.io/session/status");

  await vscode.commands.executeCommand("pattyCode.test.webviewMessage", { command: "sendPrompt", text: "usage_probe" });
  const usageSnapshot = await waitForSnapshot((state) => Array.isArray(state.items)
    && state.items.some((item: TestRecord) => item.type === "usage"));
  const usageItem = usageSnapshot.items.find((item: TestRecord) => item.type === "usage");
  assert.equal(usageItem.usage.totalTokens, 150);
  assert.equal(usageItem.usage.promptTokens, 120);
  assert.equal(usageItem.usage.completionTokens, 30);
  assert.equal(usageItem.usage.sessionCacheHitTokens, 180);
  assert.equal(usageSnapshot.usage.sessionCacheMissTokens, 60);
  assert.equal(Math.round((usageSnapshot.usage.sessionCacheHitTokens
    / (usageSnapshot.usage.sessionCacheHitTokens + usageSnapshot.usage.sessionCacheMissTokens)) * 100), 75);

  await vscode.commands.executeCommand("pattyCode.test.webviewMessage", { command: "setModel", value: "fake/fast" });
  const modelSwitch = await waitForLogMatch(fakeLog, (event) => event.method === "session/set_config_option" && event.params?.configId === "model" && event.params?.value === "fake/fast", "webview model switch");
  assert.equal(modelSwitch.params?.value, "fake/fast");
  await waitForConfig("model", "fake/fast");
  await vscode.commands.executeCommand("pattyCode.test.webviewMessage", { command: "setEffort", optionId: "effort", value: "high" });
  const effortSwitch = await waitForLogMatch(fakeLog, (event) => event.method === "session/set_config_option" && event.params?.configId === "effort" && event.params?.value === "high", "webview effort switch");
  assert.equal(effortSwitch.params?.value, "high");
  await vscode.commands.executeCommand("pattyCode.test.webviewMessage", { command: "setExecutionMode", value: "goal" });
  const goalSwitch = await waitForLogMatch(fakeLog, (event) => event.method === "session/set_mode" && event.params?.modeId === "goal", "webview goal mode switch");
  assert.equal(goalSwitch.params?.modeId, "goal");
  await vscode.commands.executeCommand("pattyCode.test.webviewMessage", { command: "setWorkMode", optionId: "work_mode", value: "delivery" });
  const deliverySwitch = await waitForLogMatch(fakeLog, (event) => event.method === "session/set_config_option" && event.params?.configId === "work_mode" && event.params?.value === "delivery", "webview delivery mode switch");
  assert.equal(deliverySwitch.params?.value, "delivery");
  await vscode.commands.executeCommand("pattyCode.test.webviewMessage", { command: "setToolApprovalMode", optionId: "tool_approval", value: "auto" });
  const approvalSwitch = await waitForLogMatch(fakeLog, (event) => event.method === "session/set_config_option" && event.params?.configId === "tool_approval" && event.params?.value === "auto", "webview approval mode switch");
  assert.equal(approvalSwitch.params?.value, "auto");
  await vscode.commands.executeCommand("pattyCode.test.webviewMessage", {
    command: "sendPrompt",
    text: "profile_native_probe",
    collaborationMode: "goal",
    tokenMode: "economy",
    toolApprovalMode: "auto",
  });
  await waitForLogMatch(fakeLog, (event) => event.method === "session/set_config_option" && event.params?.configId === "work_mode" && event.params?.value === "economy", "native economy profile switch");
  const nativeProfilePrompt = await waitForLogMatch(fakeLog, (event) => event.method === "session/prompt" && JSON.stringify(event.params).includes("profile_native_probe"), "profile-native prompt");
  assert.doesNotMatch(JSON.stringify(nativeProfilePrompt.params), /Token economy mode|Goal mode:/);

  await vscode.commands.executeCommand("pattyCode.openSettings");
  await vscode.commands.executeCommand("pattyCode.showOutput");
  await vscode.commands.executeCommand("pattyCode.test.webviewMessage", { command: "updateSetting", key: "uiLanguage", value: "ko-KR" });
  await waitForConfig("uiLanguage", "ko-KR");
  await vscode.commands.executeCommand("pattyCode.test.webviewMessage", { command: "updateSetting", key: "trace", value: true });
  await waitForConfig("trace", true);
  await vscode.commands.executeCommand("pattyCode.test.webviewMessage", { command: "setContextMode", mode: "nearby" });
  await waitForConfig("includeSelectionMode", "nearby");
  await vscode.commands.executeCommand("pattyCode.test.webviewMessage", { command: "setContextMode", mode: "off" });
  await waitForConfig("includeSelectionMode", "off");

  const doc = await vscode.workspace.openTextDocument(path.join(workspacePath, "sample.ts"));
  const editor = await vscode.window.showTextDocument(doc);
  editor.selection = new vscode.Selection(new vscode.Position(0, 0), new vscode.Position(0, doc.lineAt(0).text.length));
  await editor.edit((edit) => edit.replace(doc.lineAt(0).range, "const answer = 84;"));

  await vscode.workspace.getConfiguration("patcode").update("includeSelectionMode", "selectionOnly", vscode.ConfigurationTarget.Workspace);
  await waitForConfig("includeSelectionMode", "selectionOnly");
  await vscode.commands.executeCommand("pattyCode.test.webviewMessage", { command: "sendPrompt", text: "context_auto_probe" });
  const automaticContext = await waitForLogMatch(fakeLog, (event) => event.method === "session/prompt" && JSON.stringify(event.params).includes("context_auto_probe"), "automatic editor context");
  assert.match(JSON.stringify(automaticContext.params), /sample\.ts/);
  assert.match(JSON.stringify(automaticContext.params), /const answer = 84/);

  await vscode.workspace.getConfiguration("patcode").update("includeSelectionMode", "off", vscode.ConfigurationTarget.Workspace);
  await waitForConfig("includeSelectionMode", "off");
  await vscode.commands.executeCommand("pattyCode.test.webviewMessage", { command: "sendPrompt", text: "context_off_probe" });
  const contextOff = await waitForLogMatch(fakeLog, (event) => event.method === "session/prompt" && JSON.stringify(event.params).includes("context_off_probe"), "disabled editor context");
  assert.doesNotMatch(JSON.stringify(contextOff.params), /VS Code selection/);

  await vscode.commands.executeCommand("pattyCode.sendSelection");
  const explicitContext = await waitForLogMatch(fakeLog, (event) => event.method === "session/prompt" && JSON.stringify(event.params).includes("Use the current VS Code editor context"), "explicit editor context");
  assert.match(JSON.stringify(explicitContext.params), /sample\.ts/);
  assert.match(JSON.stringify(explicitContext.params), /const answer = 84/);

  await vscode.commands.executeCommand("pattyCode.test.webviewMessage", { command: "sendPrompt", text: "fs_read_probe" });
  const fsRead = await waitForLog(fakeLog, "fs-read/response");
  assert.match(JSON.stringify(fsRead), /const answer = 84/);

  await vscode.commands.executeCommand("pattyCode.test.webviewMessage", {
    command: "sendPrompt",
    text: "fs_write_probe",
  });
  await waitForLog(fakeLog, "fs-write/response");
  assert.equal(await fs.readFile(path.join(workspacePath, "bridge-output.txt"), "utf8"), "written through VS Code");

  await vscode.commands.executeCommand("pattyCode.test.webviewMessage", { command: "sendPrompt", text: "terminal_probe" });
  const terminal = await waitForLog(fakeLog, "terminal/captured");
  assert.match(JSON.stringify(terminal), /patty-terminal/);

  await vscode.commands.executeCommand("pattyCode.test.webviewMessage", {
    command: "sendPrompt",
    text: "/review focused @sample.ts @src/",
  });
  const nativePrompt = await waitForLogMatch(fakeLog, (event) => {
    const serialized = JSON.stringify(event);
    return event.method === "session/prompt" && serialized.includes("/review focused") && serialized.includes("const answer = 42");
  }, "native ACP slash command with resource blocks");
  assert.doesNotMatch(JSON.stringify(nativePrompt), /patty_file_mentions/);
  assert.match(JSON.stringify(nativePrompt), /\"type\":\"resource\"/);

  await vscode.commands.executeCommand("pattyCode.test.webviewMessage", {
    command: "sendPrompt",
    text: "plan_probe",
    collaborationMode: "plan",
    tokenMode: "balanced",
    toolApprovalMode: "ask",
  });
  const planMode = await waitForLogMatch(fakeLog, (event) => event.method === "session/set_mode" && event.params?.modeId === "plan", "plan mode switch");
  assert.equal(planMode.params?.modeId, "plan");
  const planSnapshot = await waitForSnapshot((state) => Array.isArray(state.items) && state.items.some((item: TestRecord) => item.type === "plan"));
  assert.ok(planSnapshot.items.some((item: TestRecord) => item.type === "tool" && item.locations?.[0]?.path === "sample.ts"));

  await vscode.commands.executeCommand("pattyCode.test.webviewMessage", {
    command: "sendPrompt",
    text: "permission_probe auto",
    toolApprovalMode: "auto",
  });
  const autoPermission = await waitForLogMatch(fakeLog, (event) => event.method === "permission/server-auto" && event.mode === "auto", "Patty Code-owned auto approval");
  assert.equal(autoPermission.mode, "auto");

  await vscode.commands.executeCommand("pattyCode.test.webviewMessage", {
    command: "sendPrompt",
    text: "permission_probe yolo",
    toolApprovalMode: "yolo",
  });
  const yoloPermission = await waitForLogMatch(fakeLog, (event) => event.method === "permission/server-auto" && event.mode === "yolo", "Patty Code-owned yolo approval");
  assert.equal(yoloPermission.mode, "yolo");

  const cancelledApprovalTurn = vscode.commands.executeCommand("pattyCode.test.webviewMessage", {
    command: "sendPrompt",
    text: "permission_probe cancel",
    toolApprovalMode: "ask",
  });
  await waitForSnapshot((state) => Array.isArray(state.items) && state.items.some((item: TestRecord) => item.type === "approval" && item.status === "pending"));
  await vscode.commands.executeCommand("pattyCode.test.webviewMessage", { command: "cancel" });
  const cancelledPermission = await waitForLogMatch(fakeLog, (event) => event.method === "permission/response" && JSON.stringify(event).includes("cancelled"), "cancelled pending approval");
  assert.match(JSON.stringify(cancelledPermission), /cancelled/);
  await cancelledApprovalTurn;
  await waitForSnapshot((state) => state.running === false && state.items.some((item: TestRecord) => item.type === "approval" && item.status === "cancelled"));

  const askTurn = vscode.commands.executeCommand("pattyCode.test.webviewMessage", {
    command: "sendPrompt",
    text: "ask_probe",
    toolApprovalMode: "yolo",
  });
  await waitForLogMatch(fakeLog, (event) => event.method === "session/request_permission" && JSON.stringify(event).includes("ask-fake-question-choice"), "structured Ask request");
  await vscode.commands.executeCommand("pattyCode.test.webviewMessage", {
    command: "approvalDecision",
    id: "ask-fake-question-choice",
    optionId: "choice:2",
  });
  await askTurn;
  const askResponse = await waitForLog(fakeLog, "ask/response");
  assert.match(JSON.stringify(askResponse), /choice:2/);

  const slowTurn = vscode.commands.executeCommand("pattyCode.test.webviewMessage", {
    command: "sendPrompt",
    text: "slow_prompt",
    toolApprovalMode: "ask",
  });
  await waitForLog(fakeLog, "slow/prompt");
  await vscode.commands.executeCommand("pattyCode.test.webviewMessage", { command: "cancel" });
  await waitForLog(fakeLog, "session/cancel");
  await waitForLog(fakeLog, "session/prompt/cancelled");
  await slowTurn;

  await vscode.commands.executeCommand("pattyCode.test.webviewMessage", {
    command: "sendPrompt",
    text: "long_webview_probe",
  });
  await waitForLog(fakeLog, "webview/long-history-sent");
  await waitForSnapshot((state) => state.items?.some((item: TestRecord) => item.text?.includes("long-history-tail")));
  await vscode.commands.executeCommand("pattyCode.openChat");
  await vscode.commands.executeCommand("pattyCode.test.webviewMessage", {
    command: "sendPrompt",
    text: "post_history_probe",
  });
  await waitForLog(fakeLog, "webview/post-history-prompt");

  await vscode.commands.executeCommand("pattyCode.test.webviewMessage", { command: "sendPrompt", text: "disconnect_probe" });
  await waitForLog(fakeLog, "process/disconnect-probe");
  await waitForLog(fakeLog, "session/resume");
}

function comparablePath(value: string): string {
  const resolved = path.resolve(value);
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

async function waitForCommand(command: string): Promise<void> {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if ((await vscode.commands.getCommands(true)).includes(command)) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for command ${command}`);
}

async function waitForWorkspace(): Promise<vscode.WorkspaceFolder> {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    const folder = vscode.workspace.workspaceFolders?.[0];
    if (folder) {
      return folder;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Timed out waiting for workspace folder");
}

async function waitForLog(file: string, method: string): Promise<TestRecord> {
  return await waitForLogMatch(file, (event) => event.method === method, method);
}

async function waitForLogMatch(file: string, matches: (event: TestRecord) => boolean, label: string): Promise<TestRecord> {
  const deadline = Date.now() + 30_000;
  let last = "";
  while (Date.now() < deadline) {
    try {
      const content = await fs.readFile(file, "utf8");
      last = content;
      for (const line of content.trim().split(/\r?\n/)) {
        if (!line) {
          continue;
        }
        const event = JSON.parse(line) as TestRecord;
        if (matches(event)) {
          return event;
        }
      }
    } catch {
      // Wait until the fake ACP creates the log.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for ${label}. Log:\n${last}`);
}

async function waitForSnapshot(matches: (state: TestRecord) => boolean): Promise<TestRecord> {
  const deadline = Date.now() + 30_000;
  let last: TestRecord = {};
  while (Date.now() < deadline) {
    last = await vscode.commands.executeCommand<TestRecord>("pattyCode.test.snapshot") ?? {};
    if (matches(last)) {
      return last;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for Patty Code snapshot: ${JSON.stringify(last)}`);
}

async function assertQuickPrompt(fakeLog: string, action: "explainFile" | "fixSelection" | "runTests" | "searchRepo", promptPattern: RegExp): Promise<void> {
  await vscode.commands.executeCommand("pattyCode.test.webviewMessage", { command: "quickPrompt", action });
  const prompt = await waitForLogMatch(fakeLog, (event) => {
    const serialized = JSON.stringify(event);
    return event.method === "session/prompt" && promptPattern.test(serialized);
  }, `quick prompt ${action}`);
  assert.match(JSON.stringify(prompt), promptPattern);
}

async function assertWebviewPrompt(fakeLog: string, text: string, promptPattern: RegExp): Promise<void> {
  await vscode.commands.executeCommand("pattyCode.test.webviewMessage", { command: "sendPrompt", text });
  const prompt = await waitForLogMatch(fakeLog, (event) => {
    const serialized = JSON.stringify(event);
    return event.method === "session/prompt" && promptPattern.test(serialized);
  }, `webview prompt ${text}`);
  assert.match(JSON.stringify(prompt), promptPattern);
}

async function waitForConfig(key: string, expected: string | boolean): Promise<void> {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (vscode.workspace.getConfiguration("patcode").get<unknown>(key) === expected) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for pattyCode.${key}`);
}
