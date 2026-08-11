import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { downloadAndUnzipVSCode, runTests } from "@vscode/test-electron";

async function main(): Promise<void> {
  const extensionDevelopmentPath = path.resolve(__dirname, "../../..");
  const extensionTestsPath = path.resolve(__dirname, "suite/index.js");
  const workspacePath = fs.mkdtempSync(path.join(os.tmpdir(), "patty-code-vscode-workspace-"));
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "patty-code-vscode-user-"));
  const fakeAcpScript = path.resolve(extensionDevelopmentPath, "test/vscode/fake-acp.cjs");
  const fakeAcp = path.join(workspacePath, process.platform === "win32" ? "pattyCode.cmd" : "patcode");
  const fakeLog = path.join(workspacePath, "fake-acp.log");
  const vscodeExecutablePath = process.env.VSCODE_EXECUTABLE_PATH;
  const binaryMode = process.argv.includes("--path") ? "path" : "configured";
  fs.writeFileSync(path.join(workspacePath, "sample.ts"), "const answer = 42;\n");
  fs.mkdirSync(path.join(workspacePath, "src"));
  fs.writeFileSync(path.join(workspacePath, "src", "helper.ts"), "export const helper = true;\n");
  writeFakeAcpWrapper(fakeAcp, fakeAcpScript);

  const testExecutable = vscodeExecutablePath ?? await downloadAndUnzipVSCode("stable");
  await runTests({
    vscodeExecutablePath: existingVSCodeExecutable(testExecutable),
    extensionDevelopmentPath,
    extensionTestsPath,
    launchArgs: [workspacePath, "--user-data-dir", userDataDir, "--disable-extensions", "--disable-workspace-trust"],
    extensionTestsEnv: {
      PATTY_FAKE_ACP: fakeAcp,
      PATTY_FAKE_LOG: fakeLog,
      PATTY_TEST_WORKSPACE: workspacePath,
      PATTY_TEST_COMMANDS: "1",
      PATTY_TEST_BINARY_MODE: binaryMode,
      PATH: `${workspacePath}${path.delimiter}${process.env.PATH ?? ""}`,
    },
  });
}

function existingVSCodeExecutable(downloadedExecutable: string): string {
  if (fs.existsSync(downloadedExecutable)) {
    return downloadedExecutable;
  }
  if (process.platform === "darwin" && downloadedExecutable.endsWith("/MacOS/Electron")) {
    const renamedExecutable = downloadedExecutable.slice(0, -"Electron".length) + "Code";
    if (fs.existsSync(renamedExecutable)) {
      return renamedExecutable;
    }
  }
  return downloadedExecutable;
}

function writeFakeAcpWrapper(target: string, script: string): void {
  if (process.platform === "win32") {
    fs.writeFileSync(target, `@echo off\r\n"${process.execPath}" "${script}" %*\r\n`);
    fs.writeFileSync(target.slice(0, -path.extname(target).length), `#!/bin/sh\n"${process.execPath}" "${script}" "$@"\n`);
    return;
  }
  fs.writeFileSync(target, `#!/bin/sh\nexec ${shQuote(process.execPath)} ${shQuote(script)} "$@"\n`);
  fs.chmodSync(target, 0o755);
}

function shQuote(value: string): string {
  return `'${value.replace(/'/g, "'\\''")}'`;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
