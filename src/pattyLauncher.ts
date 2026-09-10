import crossSpawn = require("cross-spawn");
import type { ChildProcessWithoutNullStreams } from "node:child_process";
import { access } from "node:fs/promises";
import * as path from "node:path";

const windowsExecutableExtensions = [".exe", ".com", ".cmd", ".bat"] as const;

type PathExists = (candidate: string) => Promise<boolean>;

export function selectPattyPath(stdout: string, platform: NodeJS.Platform = process.platform): string | undefined {
  const candidates = stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "");
  if (platform !== "win32") {
    return candidates[0];
  }
  return candidates.find(isRunnableWindowsPath) ?? candidates[0];
}

export async function normalizePattyPath(
  configured: string,
  platform: NodeJS.Platform = process.platform,
  pathExists: PathExists = defaultPathExists,
  arch: string = process.arch,
): Promise<string> {
  const candidate = configured.trim();
  if (platform !== "win32") {
    return candidate;
  }
  const extension = path.win32.extname(candidate).toLowerCase();
  if (extension === ".exe" || extension === ".com") {
    return candidate;
  }
  const bundledExecutable = await findBundledWindowsExecutable(candidate, arch, pathExists);
  if (bundledExecutable) {
    return bundledExecutable;
  }
  if (extension !== "") {
    return candidate;
  }
  for (const extension of windowsExecutableExtensions) {
    const sibling = `${candidate}${extension}`;
    if (await pathExists(sibling)) {
      return sibling;
    }
  }
  return candidate;
}

export function spawnPatty(binaryPath: string, args: readonly string[], cwd: string): ChildProcessWithoutNullStreams {
  return crossSpawn(binaryPath, [...args], {
    cwd,
    env: process.env,
    stdio: ["pipe", "pipe", "pipe"],
    windowsHide: true,
  }) as ChildProcessWithoutNullStreams;
}

function isRunnableWindowsPath(candidate: string): boolean {
  const extension = path.win32.extname(candidate).toLowerCase();
  return windowsExecutableExtensions.includes(extension as typeof windowsExecutableExtensions[number]);
}

async function findBundledWindowsExecutable(candidate: string, arch: string, pathExists: PathExists): Promise<string | undefined> {
  const extension = path.win32.extname(candidate);
  const commandName = path.win32.basename(candidate, extension).toLowerCase();
  if (commandName !== "patcode" && commandName !== "mirr") {
    return undefined;
  }
  const shimDirectory = path.win32.dirname(candidate);
  const nodeModules = path.win32.basename(shimDirectory).toLowerCase() === ".bin"
    ? path.win32.dirname(shimDirectory)
    : path.win32.join(shimDirectory, "node_modules");
  const platformPackage = `cli-win32-${arch}`;
  // The typed shim resolves its own executable first; both spellings ship in
  // the same platform package, so the other name is the fallback.
  const fallbackName = commandName === "mirr" ? "patcode.exe" : "mirr.exe";
  const executableCandidates = [
    path.win32.join(nodeModules, "patty-code", "node_modules", "@patty-code", platformPackage, "bin", `${commandName}.exe`),
    path.win32.join(nodeModules, "@patty-code", platformPackage, "bin", `${commandName}.exe`),
    path.win32.join(nodeModules, "patty-code", "node_modules", "@patty-code", platformPackage, "bin", fallbackName),
    path.win32.join(nodeModules, "@patty-code", platformPackage, "bin", fallbackName),
  ];
  for (const executable of executableCandidates) {
    if (await pathExists(executable)) {
      return executable;
    }
  }
  return undefined;
}

async function defaultPathExists(candidate: string): Promise<boolean> {
  try {
    await access(candidate);
    return true;
  } catch {
    return false;
  }
}