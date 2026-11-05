export type MarkdownBlock =
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "code"; language: string; text: string }
  | { type: "list"; ordered: boolean; items: string[] };

export function parseSafeMarkdown(markdown: string): MarkdownBlock[] {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let index = 0;
  const lineAt = (lineIndex: number) => lines[lineIndex] ?? "";

  while (index < lines.length) {
    const line = lineAt(index);
    if (!line.trim()) {
      index += 1;
      continue;
    }
    const fence = line.match(/^```([\w-]*)\s*$/);
    if (fence) {
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !/^```\s*$/.test(lineAt(index))) {
        code.push(lineAt(index));
        index += 1;
      }
      if (index < lines.length) index += 1;
      blocks.push({ type: "code", language: fence[1] || "text", text: code.join("\n") });
      continue;
    }
    const heading = line.match(/^(##|###)\s+(.+)$/);
    if (heading) {
      blocks.push({ type: "heading", level: heading[1] === "##" ? 2 : 3, text: heading[2] ?? "" });
      index += 1;
      continue;
    }
    if (/^\s*[-*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      const ordered = /^\s*\d+\.\s+/.test(line);
      const items: string[] = [];
      const pattern = ordered ? /^\s*\d+\.\s+(.+)$/ : /^\s*[-*]\s+(.+)$/;
      while (index < lines.length) {
        const item = lineAt(index).match(pattern);
        if (!item) break;
        items.push(item[1] ?? "");
        index += 1;
      }
      blocks.push({ type: "list", ordered, items });
      continue;
    }
    const paragraph = [line.trim()];
    index += 1;
    while (index < lines.length) {
      const nextLine = lineAt(index);
      if (
        !nextLine.trim() || /^```/.test(nextLine) || /^(##|###)\s+/.test(nextLine) ||
        /^\s*[-*]\s+/.test(nextLine) || /^\s*\d+\.\s+/.test(nextLine)
      ) break;
      paragraph.push(nextLine.trim());
      index += 1;
    }
    blocks.push({ type: "paragraph", text: paragraph.join(" ") });
  }
  return blocks;
}
