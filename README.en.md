<p align="center">
  <img src="media/icon.svg" alt="Patty Code for VS Code" width="120"/>
</p>

<p align="center">
  <a href="./README.md">한국어</a>
  &nbsp;·&nbsp;
  <strong>English</strong>
  &nbsp;·&nbsp;
  <a href="https://github.com/patrickrho-patty/patty-code">Patty Code</a>
  &nbsp;·&nbsp;
  <a href="https://github.com/patrickrho-patty/patty-code-vscode/releases">Releases</a>
</p>

<p align="center">
  <a href="https://github.com/patrickrho-patty/patty-code-vscode/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/patrickrho-patty/patty-code-vscode/ci.yml?style=flat-square&label=CI&labelColor=111827" alt="CI status"/></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=SivanLiu.patty-code-vscode"><img src="https://img.shields.io/visual-studio-marketplace/v/SivanLiu.patty-code-vscode?style=flat-square&label=Marketplace&labelColor=111827" alt="Marketplace version"/></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-d6a84b.svg?style=flat-square&labelColor=111827" alt="MIT license"/></a>
</p>

<h3 align="center">A coding agent that thinks in Korean and ships from inside VS Code.</h3>

<p align="center">
  The official VS Code host for Patty Code 1.0 — chat, native sessions, editor context,<br/>
  tool approval, terminals, models, modes, and plans, right from the Activity Bar.
</p>

```text
╭─ Patty Code · Chat ───────────────────────────────────────────╮
│  ● Connected · workspace: patty-code-vscode                   │
│  ──────────────────────────────────────────────────────────  │
│  [15:42] You                                                   │
│          Polish the Korean wording of README.md.               │
│                                                               │
│  [15:42] Patty                                                │
│          Reading the README and adjusting the awkward bits.    │
│                                                               │
│  [15:42] ✅ Tool call · edit_file                              │
│          path: README.md · 1 line changed                      │
│          [Open diff]  [Allow once]                             │
╰───────────────────────────────────────────────────────────────╯

╭─ Input ────────────────────────────────────────────────────────╮
│  / commands · @ files/folders                                  │
│  Ask anything                                                  │
╰───────────────────────────────────────────────────────────────╯
       PATTY WORKFLOW · auto · medium · Enter to send
```

## What makes Patty Code for VS Code different

- **It is the VS Code host for Patty Code.** Implements the ACP v1 (`main-v2`) client surface used by [`patrickrho-patty/patty-code`](https://github.com/patrickrho-patty/patty-code). Model execution, tools, permissions, MCP, and transcripts are delegated to the local `patcode` backend.
- **Native session lifecycle.** `session/list`, `load`, `resume`, `close`, and `delete` with automatic reconnect and resume. Workspace-scoped session keys and history.
- **Editor context at the editor's own boundary.** The current file, selection, and cursor window are attached as ACP resource blocks. `@` mentions resolve to workspace files and folders. Context is added on user turns only — never to system prompts, tool schemas, or stable prefixes.
- **Stays inside the trusted workspace.** Filesystem callbacks read unsaved buffers, refuse stale concurrent edits, and refuse to follow symlinks outside the workspace. Terminal callbacks keep the working directory inside the workspace and bound captured output.
- **Visible mode controls.** Execution method (Standard · Plan · Goal), work mode (Lightweight · Balanced · Delivery), and tool approval (Ask · Auto · Yolo) are independent ACP axes — switch them any time before sending.
- **Inline approval and structured questions.** Tool calls resolve with one click. Backend-provided diff previews are shown first whenever they are safe. Ask questions get their own UI and are never auto-answered.
- **Built for Korean-first UX.** The webview ships English and Korean label tables and switches between them based on `pattyCode.uiLanguage`. Korean IME composition, grapheme boundaries, and Korean search matching are first-class.

## Quick start

### Prerequisites

- VS Code 1.92 or newer
- [`patcode`](https://github.com/patrickrho-patty/patty-code) CLI 1.0 or newer. Configure your provider credentials and models in Patty Code itself before using the extension.

### Install

```sh
npm i -g patty-code
```

If you use Homebrew on macOS:

```sh
brew install patty-io/patty/patcode
```

If `patcode` is not on `PATH`, set `pattyCode.binaryPath` in the extension settings to the absolute CLI path. On Windows the extension supports the npm-generated `patcode.cmd` launcher and resolves the packaged native executable when it is available.

### Your first session

1. Open a folder or multi-root workspace in VS Code.
2. Click the **Patty Code** icon in the Activity Bar, or run `Patty Code: Open Chat` from the command palette.
3. Open `Settings` inside the chat view (or run `Patty Code: Open Settings`) to verify the CLI path, model, language, context mode, auto start, and trace logging.
4. Start a session with `Patty Code: New Session` or the `+` button.
5. Type a prompt, pick an execution method, work mode, and tool-approval policy, then send with the button or `Cmd/Ctrl+Enter`.
6. Type `/` at the start of a prompt to open the slash-command menu the active session advertises. Type `@` to open workspace file and folder suggestions.

When a tool call needs approval, the extension reveals the chat view and shows an inline approval card. If the view cannot be opened, it falls back to a non-modal VS Code notification.

## Core features

### Chat and transcript

- VS Code-themed webview chat surface.
- Message chunks, thought summaries, tool calls, usage, and plans aligned in one column.
- Revisioned transcript splices so long sessions never freeze the renderer.
- `Patty Code: Send Selection` for one-click selection and cursor-window attachments.

### Native sessions

- `session/list` to browse past sessions and resume them.
- `session/load` and `session/resume` to restore context.
- Workspace-scoped session keys and history.
- Automatic reconnect and resume after backend crashes.

### Files and terminals

- Trusted-workspace filesystem overlay with unsaved-buffer reads.
- Guarded writes that refuse stale concurrent edits and out-of-workspace symlinks.
- Client-owned VS Code terminals streaming command output with a bounded byte cap.
- Terminal working directories stay inside the workspace.

### Modes and approval

- Independent ACP session axes: `normal` · `plan` · `goal`, `economy` · `balanced` · `delivery`, `ask` · `auto` · `yolo`.
- Inline approval that maps to `Once`, `Session`, and `Always` permission outcomes.
- Backend-provided diff previews are preferred whenever they are safe to compute.

### Resources and mentions

- `pattyCode.includeSelectionMode` switches automatic editor context between `off`, `selectionOnly`, and `nearby`.
- `@src/file.ts` and `@src/` mentions become bounded ACP resource blocks.
- Composer `+` menu attaches local files and images, references workspace paths and past sessions, and inserts slash commands.

### Telemetry and logging

- Usage and cache telemetry is shown only when the backend actually reports it.
- ACP JSON-RPC traffic diagnostics in the output channel via `pattyCode.trace`.
- Workspace and home-directory paths are redacted from the output channel automatically.

## Commands

| Command | Description |
| --- | --- |
| `Patty Code: Open Chat` | Opens the Patty Code Activity Bar chat view. |
| `Patty Code: New Session` | Stops the current ACP client for the active workspace and starts a fresh session. |
| `Patty Code: Send Selection` | Sends the current file path, language id, selection, or cursor window as user-turn context. |
| `Patty Code: Cancel Turn` | Sends `session/cancel` to the active Patty Code session. |
| `Patty Code: Pick Model` | Opens a model picker backed by the Patty Code ACP model list. |
| `Patty Code: Pick Effort` | Selects a reasoning level from the session's ACP config options. |
| `Patty Code: Pick UI Language` | Switches the chat UI between Auto, English, and Korean. |
| `Patty Code: Select CLI Binary` | Selects an installed Patty Code executable. |
| `Patty Code: Open Settings` | Opens the Patty Code settings view inside the Activity Bar chat view. |
| `Patty Code: Show Output` | Opens the Patty Code output channel. |

## Settings

| Setting | Default | Description |
| --- | --- | --- |
| `pattyCode.binaryPath` | `""` | Absolute path to the Patty Code CLI. When empty, the extension resolves `patcode` from `PATH`. |
| `pattyCode.model` | `""` | Optional provider/model reference passed to `patcode acp --model`. Empty means use the Patty Code config default. |
| `pattyCode.uiLanguage` | `auto` | Controls the chat UI language: `auto`, `en`, or `ko-KR`. |
| `pattyCode.autoStart` | `false` | Starts ACP when the chat view opens. |
| `pattyCode.trace` | `false` | Writes ACP JSON-RPC traffic diagnostics to the Patty Code output channel. |
| `pattyCode.includeSelectionMode` | `selectionOnly` | Controls editor context appended to prompts: `off`, `selectionOnly`, or `nearby`. |

## Context and privacy

Patty Code for VS Code keeps a narrow host boundary.

- The webview cannot access the shell, file system, or network directly.
- Editor context and mentions are attached as ACP resource blocks on user turns only — never to system prompts, tool schemas, or stable prefixes.
- Filesystem callbacks require a trusted workspace, stay inside it after symlink resolution, and refuse stale concurrent edits.
- Terminal callbacks require a trusted workspace, keep the working directory inside it, stream through a VS Code terminal, and bound captured output.
- The composer shows the active context mode and appends matching editor context automatically when the prompt is sent.
- Set the context mode to `Off` when a prompt should not include editor context.
- `Patty Code: Send Selection` is an explicit command for sending the active selection or cursor window.
- Output channel logs redact the active workspace path and home directory before display.

Use `pattyCode.trace` only when debugging protocol issues, because it increases diagnostic output.

## Diff and approval review

For edit and write tools, the extension prefers the backend-provided preview from Patty Code ACP. When available, it opens a VS Code diff preview before the approval decision. If a reliable diff cannot be computed, the approval card still shows the tool input so the decision remains explicit.

Approval options map to Patty Code permission outcomes.

- `Once` — allow this tool call.
- `Session` — allow matching calls for this session.
- `Always` — persist the permission when the backend supports it.
- `Reject` — deny the tool call.

## Troubleshooting

### `patcode` CLI was not found

Install Patty Code with `npm i -g patty-code`, make sure `patcode` is on `PATH`, or set `pattyCode.binaryPath`. On Windows, the extension supports the npm-generated `patcode.cmd` launcher, resolves the packaged native executable when available, and automatically prefers runnable entries over the extensionless shell shim returned by `where patcode`. Pointing `pattyCode.binaryPath` at either sibling is supported.

### The chat view says disconnected

Open `Patty Code: Show Output` and check the ACP process logs. Restart with `Patty Code: New Session`.

### Model or effort selection is unavailable

The active session did not advertise the relevant model or `thought_level` config option. Chat continues with the configured default.

### Diff preview did not open

Some edits cannot be previewed safely before execution, especially binary files, ambiguous replacements, or unsupported tool inputs. Review the approval card raw input before allowing the tool call.

### Korean input looks broken in the composer

Make sure your VS Code input method supports Korean IME composition and verify the ACP session is healthy via `Patty Code: Show Output`. If it still misbehaves, turn on `pattyCode.trace`, reproduce the issue, and file a GitHub issue with the log.

## Development

Install dependencies and build the extension:

```sh
npm install
npm run compile
```

Open a fresh VS Code Extension Development Host with the latest local build:

```sh
npm run dev:host
```

Useful checks:

```sh
npm run lint          # type check
npm test              # unit tests
npm run test:vscode   # VS Code host integration tests
npm run smoke:acp     # real patcode backend smoke test
npm run debug:extension  # lint + test + test:vscode + smoke:acp
```

Package a VSIX:

```sh
npm run package
```

`npm run test:vscode` uses `@vscode/test-electron` with a main-v2-shaped fake ACP server. It verifies independent execution/work/approval axes, cache-stable native profile switching, early command updates, native sessions, resource blocks, unsaved-buffer reads, guarded writes, VS Code terminals, plans, tool locations, Ask handling, cancellation, and reconnect/resume without a model call. Pass `-- --path` to exercise automatic PATH resolution instead of an explicitly configured fake CLI path; Windows CI runs both modes.

`npm run smoke:acp` starts the real `patcode acp` backend and checks capabilities, session state, list, mode switching, close, and cleanup without sending a prompt or invoking a model. Set `PATTY_BINARY=/absolute/path/to/patcode` to test a specific CLI. Set `PATTY_ACP_SMOKE_REQUIRED=1` if missing `patcode` should fail instead of skip.

## Release checklist

1. Run `npm run debug:extension && npm run package` to produce the VSIX.
2. Confirm the VSIX includes `dist/extension.js`, `media/webview.js`, `media/styles.css`, `media/icon.svg`, `scripts/acp-smoke.mjs`, `scripts/verify-vsix-contents.mjs`, `README.md`, `CHANGELOG.md`, `LICENSE`, and `package.json`.
3. Install the VSIX in VS Code or Cursor and run a manual smoke test with a real `patcode acp` backend.
4. Confirm the CI `Windows ACP Launcher` job passed.
5. Tag the release with `git tag vX.Y.Z` and push with `git push --tags` to trigger the GitHub Actions Release workflow.

## Related links

- [Patty Code](https://github.com/patrickrho-patty/patty-code) — the local coding-agent runtime.
- [Releases](https://github.com/patrickrho-patty/patty-code-vscode/releases) — VSIX archives and checksums.
- [Issues](https://github.com/patrickrho-patty/patty-code-vscode/issues) — bug reports and feature requests.
- [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=SivanLiu.patty-code-vscode) — the official distribution channel.

## License

[MIT](./LICENSE)