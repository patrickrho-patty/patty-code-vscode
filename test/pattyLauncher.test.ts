import assert from "node:assert/strict";
import test from "node:test";
import { normalizePattyPath, selectPattyPath } from "../src/pattyLauncher";

test("Windows PATH resolution preserves PATH precedence between runnable entries", () => {
  const stdout = [
    String.raw`C:\Users\dev\AppData\Roaming\npm\patcode`,
    String.raw`C:\Users\dev\AppData\Roaming\npm\patcode.cmd`,
    String.raw`C:\Tools\Patty\patcode.exe`,
  ].join("\r\n");

  assert.equal(selectPattyPath(stdout, "win32"), String.raw`C:\Users\dev\AppData\Roaming\npm\patcode.cmd`);
});

test("Windows PATH resolution prefers the npm cmd shim over its extensionless shell shim", () => {
  const stdout = [
    String.raw`C:\Program Files\nodejs\patcode`,
    String.raw`C:\Program Files\nodejs\patcode.cmd`,
  ].join("\r\n");

  assert.equal(selectPattyPath(stdout, "win32"), String.raw`C:\Program Files\nodejs\patcode.cmd`);
});

test("non-Windows PATH resolution preserves the first result", () => {
  assert.equal(selectPattyPath("/opt/patcode/bin/patcode\n/usr/bin/patcode\n", "darwin"), "/opt/patcode/bin/patcode");
});

test("an explicitly configured extensionless Windows shim resolves to a native sibling first", async () => {
  const configured = String.raw`C:\Program Files\nodejs\patcode`;
  const existing = new Set([`${configured}.exe`, `${configured}.cmd`]);

  assert.equal(await normalizePattyPath(configured, "win32", async (candidate) => existing.has(candidate)), `${configured}.exe`);
});

test("a global npm cmd shim resolves directly to the packaged native executable", async () => {
  const configured = String.raw`C:\Users\dev\AppData\Roaming\npm\patcode.cmd`;
  const executable = String.raw`C:\Users\dev\AppData\Roaming\npm\node_modules\patty-code\node_modules\@patty-code\cli-win32-x64\bin\patcode.exe`;

  assert.equal(
    await normalizePattyPath(configured, "win32", async (candidate) => candidate === executable, "x64"),
    executable,
  );
});

test("a local npm bin shim resolves a hoisted packaged native executable", async () => {
  const configured = String.raw`C:\workspace\node_modules\.bin\patcode.cmd`;
  const executable = String.raw`C:\workspace\node_modules\@patty-code\cli-win32-arm64\bin\patcode.exe`;

  assert.equal(
    await normalizePattyPath(configured, "win32", async (candidate) => candidate === executable, "arm64"),
    executable,
  );
});

test("an explicitly configured extensionless Windows shim falls back to its cmd sibling", async () => {
  const configured = String.raw`C:\Users\dev\AppData\Roaming\npm\patcode`;

  assert.equal(
    await normalizePattyPath(configured, "win32", async (candidate) => candidate === `${configured}.cmd`),
    `${configured}.cmd`,
  );
});

test("configured native and non-Windows paths are not rewritten", async () => {
  assert.equal(await normalizePattyPath(String.raw`C:\Patty\patcode.exe`, "win32"), String.raw`C:\Patty\patcode.exe`);
  assert.equal(await normalizePattyPath("/usr/local/bin/patcode", "linux"), "/usr/local/bin/patcode");
});

test("a custom cmd wrapper is not replaced by an adjacent Patty Code package", async () => {
  const configured = String.raw`C:\Tools\custom-patcode.cmd`;

  assert.equal(await normalizePattyPath(configured, "win32", async () => true, "x64"), configured);
});