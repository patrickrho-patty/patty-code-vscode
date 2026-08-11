<p align="center">
  <img src="media/icon.svg" alt="Patty Code for VS Code" width="120"/>
</p>

<p align="center">
  <strong>한국어</strong>
  &nbsp;·&nbsp;
  <a href="./README.en.md">English</a>
  &nbsp;·&nbsp;
  <a href="https://github.com/patrickrho-patty/patty-code">Patty Code</a>
  &nbsp;·&nbsp;
  <a href="https://github.com/patrickrho-patty/patty-code-vscode/releases">릴리스</a>
</p>

<p align="center">
  <a href="https://github.com/patrickrho-patty/patty-code-vscode/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/patrickrho-patty/patty-code-vscode/ci.yml?style=flat-square&label=CI&labelColor=111827" alt="CI 상태"/></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=SivanLiu.patty-code-vscode"><img src="https://img.shields.io/visual-studio-marketplace/v/SivanLiu.patty-code-vscode?style=flat-square&label=Marketplace&labelColor=111827" alt="Marketplace 버전"/></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-d6a84b.svg?style=flat-square&labelColor=111827" alt="MIT 라이선스"/></a>
</p>

<h3 align="center">VS Code 안에서, 한국어로 끝까지 일하는 코딩 에이전트.</h3>

<p align="center">
  Patty Code 1.0의 ACP v1 클라이언트 확장으로, 채팅과 네이티브 세션, 에디터 컨텍스트,<br/>
  도구 승인, 터미널, 모델, 모드, 계획을 VS Code 액티비티 바에서 그대로 다룹니다.
</p>

```text
╭─ Patty Code · 채팅 ──────────────────────────────────────────╮
│  ● 정상 연결됨 · 작업 영역: patty-code-vscode                  │
│  ──────────────────────────────────────────────────────────  │
│  [15:42] 사용자                                                │
│          README.md의 한국어 톤을 자연스럽게 다듬어줘            │
│                                                               │
│  [15:42] Patty                                                │
│          README를 읽고 어색한 표현을 찾아 수정하겠습니다.      │
│                                                               │
│  [15:42] ✅ 도구 호출 · edit_file                              │
│          경로: README.md · 1줄 변경                            │
│          [Diff 열기]  [Once로 허용]                             │
╰───────────────────────────────────────────────────────────────╯

╭─ 입력 ────────────────────────────────────────────────────────╮
│  / 명령 · @ 파일/폴더                                          │
│  무엇이든 물어보세요                                            │
╰───────────────────────────────────────────────────────────────╯
       PATTY 작업 흐름 · 자동 · medium · Enter 전송
```

## Patty Code for VS Code가 다른 점

- **Patty Code의 VS Code 호스트입니다.** [`patrickrho-patty/patty-code`](https://github.com/patrickrho-patty/patty-code)의 ACP v1(`main-v2`) 클라이언트 표면을 그대로 구현합니다. 모델 실행, 도구, 권한, MCP, 트랜스크립트는 모두 로컬 `patcode` 백엔드에 위임합니다.
- **네이티브 세션 생명주기.** `session/list`, `load`, `resume`, `close`, `delete`를 자동으로 재연결·재개와 함께 제공합니다. VS Code 워크스페이스 단위로 분리된 세션 기록을 보존합니다.
- **에디터와 같은 경계의 컨텍스트.** 현재 파일, 선택 영역, 커서 주변 코드를 ACP 리소스 블록으로 첨부하고, `@` 멘션은 워크스페이스 파일/폴더를 정확히 가리킵니다. 첨부 컨텍스트는 사용자 턴에만 추가되며 시스템 프롬프트나 도구 스키마에는 섞이지 않습니다.
- **신뢰할 수 있는 워크스페이스 안에서만 움직입니다.** 파일 시스템 콜백은 저장되지 않은 버퍼를 읽고, 워크스페이스 외부로 나가는 심볼릭 링크와 동시 편집을 거부합니다. 터미널 콜백은 작업 디렉터리를 워크스페이스 내부에 가두고 출력을 제한된 크기로 캡처합니다.
- **보이는 모드 컨트롤.** 실행 방식(Standard · Plan · Goal), 작업 모드(Lightweight · Balanced · Delivery), 도구 승인(Ask · Auto · Yolo)을 ACP 세션 축에 묶어 보내기 전에 자유롭게 바꿀 수 있습니다.
- **인라인 승인, 구조화된 질문.** 도구 호출은 한 번의 클릭으로 결정하며, 백엔드가 제공한 diff 미리보기를 먼저 보여줍니다. Ask 질문은 별도로 표시되고 자동으로 답하지 않습니다.
- **한국어를 기본으로 설계된 UI.** 웹뷰는 한국어와 영어 레이블 테이블을 함께 싣고 `pattyCode.uiLanguage` 설정에 따라 즉시 전환합니다. 한국어 IME 조합, 입력 경계, 한국어 본문 검색도 별도로 다룹니다.

## 빠른 시작

### 전제 조건

- VS Code 1.92 이상
- [`patcode`](https://github.com/patrickrho-patty/patty-code) 1.0 이상 CLI. 모델과 provider 자격 증명은 Patty Code 자체에서 미리 설정해 두세요.

### 설치

```sh
npm i -g patty-code
```

macOS에서 Homebrew를 쓸 수 있다면:

```sh
brew install patty-io/patty/patcode
```

`patcode`가 `PATH`에 없으면 확장 설정의 `pattyCode.binaryPath`에 절대 경로를 지정하세요. Windows에서는 npm이 만든 `patcode.cmd` 런처와 패키지 내부 네이티브 실행 파일을 자동으로 찾아 사용합니다.

### 첫 세션

1. VS Code에서 폴더 또는 멀티 루트 워크스페이스를 엽니다.
2. 사이드바의 **Patty Code** 아이콘을 누르거나 명령 팔레트에서 `Patty Code: Open Chat`을 실행합니다.
3. 채팅 뷰 안의 톱니바퀴를 눌러 `Settings`를 열고 CLI 경로, 모델, 언어, 컨텍스트 모드, 자동 시작, 추적 로그를 확인합니다.
4. `Patty Code: New Session` 또는 채팅 뷰의 `+` 버튼으로 새 세션을 시작합니다.
5. 프롬프트를 입력하고 실행 방식·작업 모드·도구 승인 정책을 고른 다음 버튼 또는 `Cmd/Ctrl+Enter`로 보냅니다.
6. 프롬프트 맨 앞에 `/`를 입력하면 활성 세션이 알리는 슬래시 명령 메뉴가 열리고, `@`를 입력하면 워크스페이스 파일·폴더 추천이 열립니다.

도구 호출 승인이 필요하면 채팅 뷰가 자동으로 열리고 인라인 승인 카드를 보여줍니다. 뷰를 열 수 없는 상황이면 모달이 아닌 VS Code 알림으로 대체합니다.

## 핵심 기능

### 채팅과 트랜스크립트

- VS Code 테마를 따르는 웹뷰 채팅 표면
- 메시지 청크, 사고 요약, 도구 호출, 사용량, 계획을 한 화면에 정렬
- 슬라이스 기반 트랜스크립트 동기화로 긴 세션에서도 렌더가 멈추지 않음
- 선택 영역과 주변 커서 윈도우를 빠르게 보낼 수 있는 `Patty Code: Send Selection`

### 네이티브 세션

- `session/list`로 과거 세션을 보고 그대로 이어 열기
- `session/load`, `session/resume`로 컨텍스트를 복원
- 워크스페이스 단위로 분리된 세션 키와 세션 기록
- 백엔드 충돌 시 자동 재연결과 재개

### 파일과 터미널

- 신뢰된 워크스페이스 안에서만 읽고 쓰는 파일 시스템 오버레이
- 저장되지 않은 버퍼를 백엔드에 그대로 전달
- VS Code 터미널에서 명령을 스트리밍하고 출력을 제한된 크기로 캡처
- 터미널 작업 디렉터리는 워크스페이스를 벗어나지 않음

### 모드와 승인

- 독립적인 ACP 세션 축: `normal` · `plan` · `goal`, `economy` · `balanced` · `delivery`, `ask` · `auto` · `yolo`
- `Once`, `Session`, `Always` 권한 결과에 매핑되는 인라인 승인
- 백엔드가 제공한 diff 미리보기를 가능한 경우 우선 사용

### 리소스와 멘션

- `pattyCode.includeSelectionMode`로 자동 첨부 범위(`off` · `selectionOnly` · `nearby`)를 즉시 전환
- `@src/file.ts`나 `@src/` 형태의 워크스페이스 멘션을 ACP 리소스 블록으로 변환
- 컴포저 `+` 메뉴로 파일/이미지 첨부, 과거 세션 참조, 슬래시 명령 삽입

### 원격 측정과 로깅

- 백엔드가 보고할 때만 표시되는 사용량과 캐시 원격 측정
- 출력 채널에 기록되는 ACP JSON-RPC 트래픽 진단(`pattyCode.trace`)
- 워크스페이스 경로와 홈 디렉터리 경로를 표시 전에 자동으로 가림

## 명령

| 명령 | 설명 |
| --- | --- |
| `Patty Code: Open Chat` | Patty Code 액티비티 바 채팅 뷰를 엽니다. |
| `Patty Code: New Session` | 활성 워크스페이스의 현재 ACP 클라이언트를 멈추고 새 세션을 시작합니다. |
| `Patty Code: Send Selection` | 현재 파일 경로, 언어 ID, 선택 영역 또는 커서 주변 윈도우를 사용자 턴 컨텍스트로 보냅니다. |
| `Patty Code: Cancel Turn` | 활성 Patty Code 세션에 `session/cancel`을 보냅니다. |
| `Patty Code: Pick Model` | Patty Code ACP 모델 목록을 사용하는 모델 선택기를 엽니다. |
| `Patty Code: Pick Effort` | 세션의 ACP 설정 옵션에서 추론 강도를 선택합니다. |
| `Patty Code: Pick UI Language` | 채팅 UI 언어를 Auto, English, 한국어 사이에서 전환합니다. |
| `Patty Code: Select CLI Binary` | 설치된 Patty Code 실행 파일을 선택합니다. |
| `Patty Code: Open Settings` | 액티비티 바 채팅 뷰 안의 Patty Code 설정 뷰를 엽니다. |
| `Patty Code: Show Output` | Patty Code 출력 채널을 엽니다. |

## 설정

| 설정 | 기본값 | 설명 |
| --- | --- | --- |
| `pattyCode.binaryPath` | `""` | Patty Code CLI의 절대 경로. 비워두면 `PATH`에서 `patcode`를 찾습니다. |
| `pattyCode.model` | `""` | `patcode acp --model`에 전달되는 선택적 provider/model 참조. 비워두면 Patty Code 설정의 기본값을 사용합니다. |
| `pattyCode.uiLanguage` | `auto` | 채팅 UI 언어를 결정합니다: `auto`, `en`, `ko-KR`. |
| `pattyCode.autoStart` | `false` | 채팅 뷰를 열면 ACP를 자동으로 시작합니다. |
| `pattyCode.trace` | `false` | Patty Code 출력 채널에 ACP JSON-RPC 트래픽 진단을 기록합니다. |
| `pattyCode.includeSelectionMode` | `selectionOnly` | 프롬프트에 추가되는 에디터 컨텍스트 범위를 결정합니다: `off`, `selectionOnly`, `nearby`. |

## 컨텍스트와 프라이버시

Patty Code for VS Code는 좁은 호스트 경계를 유지합니다.

- 웹뷰는 셸, 파일 시스템, 네트워크에 직접 접근하지 않습니다.
- 에디터 컨텍스트와 멘션은 사용자 턴의 ACP 리소스 블록으로만 전송되며 시스템 프롬프트, 도구 스키마, 안정 접두사에는 추가되지 않습니다.
- 파일 시스템 콜백은 신뢰할 수 있는 워크스페이스를 요구하고, 심볼릭 링크 해석 후에도 워크스페이스 내부에 머무르며, 오래된 동시 편집을 거부합니다.
- 터미널 콜백은 신뢰할 수 있는 워크스페이스를 요구하고, 작업 디렉터리를 워크스페이스 내부에 유지하며, VS Code 터미널을 통해 스트리밍하고 출력은 제한된 크기로 캡처합니다.
- 컴포저는 활성 컨텍스트 모드를 표시하고, 프롬프트 전송 시 일치하는 에디터 컨텍스트가 자동으로 첨부됩니다.
- 프롬프트에 에디터 컨텍스트를 포함하지 않으려면 컨텍스트 모드를 `Off`로 설정하세요.
- `Patty Code: Send Selection`은 활성 선택 영역 또는 커서 주변 윈도우를 명시적으로 보내는 명령입니다.
- 출력 채널 로그는 표시 전에 활성 워크스페이스 경로와 홈 디렉터리를 가립니다.

진단 출력이 늘어나므로 프로토콜 문제를 디버깅할 때만 `pattyCode.trace`를 켜세요.

## Diff와 승인 검토

편집과 쓰기 도구에서는 가능하면 Patty Code ACP가 제공한 미리보기를 우선 사용합니다. 사용할 수 있으면 승인 결정 전에 VS Code diff 미리보기를 엽니다. 안정적인 diff를 계산할 수 없으면 승인 카드의 도구 입력을 그대로 보여 결정이 명시적이 되도록 합니다.

승인 옵션은 Patty Code 권한 결과에 매핑됩니다.

- `Once` — 이 도구 호출을 허용합니다.
- `Session` — 이 세션에서 같은 호출을 허용합니다.
- `Always` — 백엔드가 지원하면 권한을 영구 저장합니다.
- `Reject` — 도구 호출을 거부합니다.

## 문제 해결

### `patcode` CLI를 찾을 수 없음

`npm i -g patty-code`로 설치하고 `PATH`에 들어 있는지 확인하거나 `pattyCode.binaryPath`에 절대 경로를 지정하세요. Windows에서는 npm이 만든 `patcode.cmd` 런처를 자동으로 사용하고, 패키지 내부 네이티브 실행 파일을 우선 선택합니다. `where patcode`가 반환한 확장자 없는 셸 심볼릭 링크보다는 실행 가능한 진입점을 우선 사용합니다. `pattyCode.binaryPath`가 둘 중 어느 쪽을 가리켜도 괜찮습니다.

### 채팅 뷰가 연결 끊김으로 표시됨

`Patty Code: Show Output`을 열고 ACP 프로세스 로그를 확인하세요. `Patty Code: New Session`으로 다시 시작하세요.

### 모델 또는 추론 강도 선택을 사용할 수 없음

활성 세션이 관련 모델 또는 `thought_level` 설정 옵션을 알리지 않았습니다. 채팅은 설정된 기본값으로 계속 동작합니다.

### Diff 미리보기가 열리지 않음

일부 편집은 실행 전에 안전하게 미리볼 수 없습니다. 특히 바이너리 파일, 모호한 교체, 지원되지 않는 도구 입력이 그렇습니다. 도구 호출을 허용하기 전에 승인 카드의 원시 입력을 검토하세요.

### 한국어 입력이 컴포저에서 깨져 보임

VS Code의 입력기가 한국어 IME와 호환되는지 확인하고, `Patty Code: Show Output`으로 ACP 세션이 정상인지 확인하세요. 그래도 깨지면 `pattyCode.trace`를 켜 재현 후 GitHub 이슈로 알려 주세요.

## 개발

의존성 설치와 확장 빌드:

```sh
npm install
npm run compile
```

최신 로컬 빌드로 새 VS Code 확장 개발 호스트를 열기:

```sh
npm run dev:host
```

유용한 검사 명령:

```sh
npm run lint       # 타입 검사
npm test           # 단위 테스트
npm run test:vscode # VS Code 호스트 통합 테스트
npm run smoke:acp  # 실제 patcode 백엔드 스모크 테스트
npm run debug:extension  # lint + test + test:vscode + smoke:acp
```

VSIX 패키징:

```sh
npm run package
```

`npm run test:vscode`는 `@vscode/test-electron`과 main-v2 모양의 가짜 ACP 서버를 사용합니다. 독립적인 실행·작업·승인 축, 캐시 안정적인 네이티브 프로필 전환, 빠른 명령 갱신, 네이티브 세션, 리소스 블록, 저장되지 않은 버퍼 읽기, 보호된 쓰기, VS Code 터미널, 계획, 도구 위치, Ask 처리, 취소, 재연결·재개를 모델 호출 없이 검증합니다. 명시적으로 설정된 가짜 CLI 경로 대신 자동 PATH 해석을 확인하려면 `-- --path`를 함께 실행하세요. Windows CI는 두 모드를 모두 실행합니다.

`npm run smoke:acp`는 실제 `patcode acp` 백엔드를 시작해 capability, 세션 상태, 목록, 모드 전환, close, 정리를 프롬프트나 모델 호출 없이 검증합니다. 특정 CLI를 검사하려면 `PATTY_BINARY=/absolute/path/to/patcode`를 설정하세요. `patcode`가 없을 때 스킵 대신 실패시키려면 `PATTY_ACP_SMOKE_REQUIRED=1`을 설정하세요.

## 릴리스 체크리스트

1. `npm run debug:extension && npm run package`로 VSIX를 만듭니다.
2. VSIX에 `dist/extension.js`, `media/webview.js`, `media/styles.css`, `media/icon.svg`, `scripts/acp-smoke.mjs`, `scripts/verify-vsix-contents.mjs`, `README.md`, `CHANGELOG.md`, `LICENSE`, `package.json`이 포함됐는지 확인합니다.
3. VS Code 또는 Cursor에 VSIX를 설치하고 실제 `patcode acp` 백엔드로 수동 스모크 테스트를 진행합니다.
4. CI의 Windows ACP Launcher 잡이 통과했는지 확인합니다.
5. `git tag vX.Y.Z`로 태그를 만들고 `git push --tags`로 푸시해 GitHub Actions의 Release 워크플로우를 트리거합니다.

## 관련 링크

- [Patty Code](https://github.com/patrickrho-patty/patty-code) — 로컬 코딩 에이전트 런타임
- [Releases](https://github.com/patrickrho-patty/patty-code-vscode/releases) — VSIX 아카이브와 체크섬
- [Issues](https://github.com/patrickrho-patty/patty-code-vscode/issues) — 버그 신고와 기능 요청
- [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=SivanLiu.patty-code-vscode) — 정식 배포 채널

## 라이선스

[MIT](./LICENSE)