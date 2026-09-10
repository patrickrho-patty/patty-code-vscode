import { listSlashCommands, type SlashCommandInfo } from "./slashCommands";

export type ComposerTrigger = {
  kind: "slash" | "resource";
  start: number;
  end: number;
  query: string;
};

export type SlashSuggestion = SlashCommandInfo & {
  insertText: string;
  detail: string;
};

const koSlashDescriptions: Record<string, string> = {
  help: "내장된 Mirr Code 슬래시 명령을 확인합니다.",
  explain: "코드, 파일 또는 작업 영역의 일부를 설명합니다.",
  fix: "지정한 문제 또는 코드 영역을 수정합니다.",
  tests: "관련 테스트를 실행하고 위치를 찾거나 진단합니다.",
  search: "저장소를 검색하고 핵심 파일을 요약합니다.",
  mcp: "MCP 컨텍스트를 확인하고 관련 도구를 사용합니다.",
  skills: "상황에 맞는 Mirr Code/Codex 스킬을 사용합니다.",
};

export function getComposerTrigger(value: string, selectionStart: number, selectionEnd = selectionStart): ComposerTrigger | undefined {
  if (selectionStart !== selectionEnd || selectionStart < 0 || selectionStart > value.length) {
    return undefined;
  }
  const beforeCaret = value.slice(0, selectionStart);

  const slash = /^(\s*)\/([A-Za-z0-9_-]*)$/.exec(beforeCaret);
  if (slash) {
    return {
      kind: "slash",
      start: slash[1]?.length ?? 0,
      end: selectionStart,
      query: slash[2] ?? "",
    };
  }

  const mention = /(^|[\s([{])@([^\s)\]}>,;:"']*)$/.exec(beforeCaret);
  if (!mention) {
    return undefined;
  }
  const prefix = mention[1] ?? "";
  const query = mention[2] ?? "";
  return {
    kind: "resource",
    start: mention.index + prefix.length,
    end: selectionStart,
    query,
  };
}

export function replaceComposerTrigger(value: string, trigger: ComposerTrigger, insertText: string): { value: string; cursor: number } {
  const before = value.slice(0, trigger.start);
  const after = value.slice(trigger.end);
  const token = trigger.kind === "resource" ? `@${insertText}` : insertText.startsWith("/") ? insertText : `/${insertText}`;
  const replacement = /^\s/.test(after) ? token : `${token} `;
  const nextValue = `${before}${replacement}${after}`;
  return {
    value: nextValue,
    cursor: before.length + replacement.length,
  };
}

export function slashSuggestions(query: string, locale: string, limit = 8): SlashSuggestion[] {
  const normalized = query.replace(/^\//, "").toLowerCase();
  const localized = locale.toLowerCase().startsWith("ko") ? koSlashDescriptions : undefined;
  return listSlashCommands()
    .map((command, index) => {
      const detail = localized?.[command.name] ?? command.description;
      return {
        suggestion: {
          ...command,
          detail,
          insertText: `/${command.name}`,
        },
        index,
      };
    })
    .filter((entry) => matchesSlashCommand(entry.suggestion, normalized))
    .sort((a, b) => slashRank(a.suggestion, normalized) - slashRank(b.suggestion, normalized) || a.index - b.index)
    .slice(0, limit)
    .map((entry) => entry.suggestion);
}

function matchesSlashCommand(command: SlashSuggestion, query: string): boolean {
  if (query === "") {
    return true;
  }
  return slashTerms(command).some((term) => term.includes(query));
}

function slashRank(command: SlashSuggestion, query: string): number {
  if (query === "") {
    return 0;
  }
  const terms = slashTerms(command);
  if (terms.some((term) => term === query)) {
    return 0;
  }
  if (terms.some((term) => term.startsWith(query))) {
    return 1;
  }
  return 2;
}

function slashTerms(command: SlashSuggestion): string[] {
  return [command.name, ...command.aliases, command.detail].map((value) => value.toLowerCase());
}
