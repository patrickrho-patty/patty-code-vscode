import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const styles = readFileSync(join(process.cwd(), "media", "styles.css"), "utf8");

function rgb(hex: string): [number, number, number] {
  const channels = hex.match(/[a-f\d]{2}/gi)?.map((channel) => Number.parseInt(channel, 16));
  assert.equal(channels?.length, 3);
  return channels as [number, number, number];
}

function mix(first: string, firstWeight: number, second: string): string {
  const firstRgb = rgb(first);
  const secondRgb = rgb(second);
  const channels = firstRgb.map((channel, index) => Math.round(channel * firstWeight + secondRgb[index] * (1 - firstWeight)));
  return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function relativeLuminance(hex: string): number {
  const channels = rgb(hex).map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrast(first: string, second: string): number {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  return (Math.max(firstLuminance, secondLuminance) + 0.05) / (Math.min(firstLuminance, secondLuminance) + 0.05);
}

test("webview surfaces derive from VS Code theme colors", () => {
  assert.match(styles, /--rx-bg:\s*var\(--vscode-sideBar-background\)/);
  assert.match(
    styles,
    /--rx-panel:\s*color-mix\(in srgb, var\(--vscode-sideBar-background\) 94%, var\(--vscode-descriptionForeground\)\)/,
  );
  assert.match(
    styles,
    /--rx-border:\s*color-mix\(in srgb, var\(--vscode-descriptionForeground\) 24%, transparent\)/,
  );
  assert.match(styles, /--rx-shadow:\s*var\(--vscode-widget-shadow\)/);
  assert.match(
    styles,
    /--rx-orange-foreground:\s*color-mix\(in srgb, var\(--vscode-foreground\) 90%, var\(--rx-orange\)\)/,
  );
  assert.match(
    styles,
    /--rx-blue-foreground:\s*color-mix\(in srgb, var\(--vscode-foreground\) 90%, var\(--rx-blue\)\)/,
  );
  assert.match(
    styles,
    /--rx-green-foreground:\s*color-mix\(in srgb, var\(--vscode-foreground\) 90%, var\(--rx-green\)\)/,
  );
});

test("webview styles do not reintroduce the old dark-only palette", () => {
  const darkOnlyColors = [
    "#0153e5",
    "#05070b",
    "#101217",
    "#14171d",
    "#15171d",
    "#17191f",
    "#21242b",
    "#3d414b",
    "#b9f2dd",
    "#dfe8ff",
    "#ffd5bd",
    "rgba(255, 255, 255",
  ];

  for (const color of darkOnlyColors) {
    assert.equal(styles.includes(color), false, `${color} should be replaced by a theme-derived token`);
  }
});

test("theme-sensitive controls share the derived surface tokens", () => {
  assert.match(styles, /.patty-mark\s*\{[^}]*background:\s*transparent;[^}]*box-shadow:\s*none;/s);
  assert.match(styles, /\.composer-mode-chip\s*\{[^}]*background:\s*var\(--rx-subtle\);/s);
  assert.match(styles, /\.suggestion-menu\s*\{[^}]*background:\s*var\(--rx-panel\);/s);
  assert.match(styles, /\.attachment-chip\s*\{[^}]*background:\s*var\(--rx-subtle\);/s);
});

test("derived brand foregrounds retain readable contrast across representative themes", () => {
  const themes = [
    { name: "light", background: "#fafafd", foreground: "#181818" },
    { name: "dark", background: "#181818", foreground: "#cccccc" },
    { name: "mid-tone dark", background: "#6f6978", foreground: "#ffffff" },
    { name: "mid-tone light", background: "#a6a0aa", foreground: "#111111" },
  ];
  const brandColors = ["#ff7a3d", "#2f6df6", "#11a979"];

  for (const theme of themes) {
    for (const brandColor of brandColors) {
      const derivedForeground = mix(theme.foreground, 0.9, brandColor);
      assert.ok(
        contrast(derivedForeground, theme.background) >= 4.5,
        `${brandColor} should remain readable in the ${theme.name} theme`,
      );
    }
  }
});
