import { FileBlockProps, getLanguageFromFilename } from "@githubnext/blocks";
import SyntaxHighlighter, { createElement } from "react-syntax-highlighter";
import { Box, Button, ButtonGroup, Tooltip } from "@primer/react";
import "./index.css";
import { useEffect, useState } from "react";

export default function (props: FileBlockProps) {
  const { context, content, onStoreSet, onStoreGet, onRequestGitHubData } = props;

  const [username, setUsername] = useState<string>("Wattenberger");
  const [emojiMap, setEmojiMap] = useState<EmojiMap>({});

  const onEmojiChange = (emojiMap: EmojiMap) => {
    setEmojiMap(emojiMap);
    onStoreSet(context.path, emojiMap);
  }

  useEffect(() => {
    onRequestGitHubData('/user').then(user => setUsername(user.login));
    onStoreGet(context.path).then(emojiMap => setEmojiMap(emojiMap || {}));
  }, [])

  const language = Boolean(context.path)
    ? getLanguageFromFilename(context.path)
    : "N/A";

  return (
    <Box p={4}>
      <SyntaxHighlighter
        language={syntaxHighlighterLanguageMap[language] || "javascript"}
        useInlineStyles={false}
        showLineNumbers
        lineNumberStyle={{ opacity: 0.45 }}
        wrapLines
        wrapLongLines
        renderer={({ rows, stylesheet, useInlineStyles }) => CodeRenderer({ rows, stylesheet, useInlineStyles, emojiMap, username, onEmojiChange })}
      >
        {content}
      </SyntaxHighlighter>
    </Box>
  );
}

const syntaxHighlighterLanguageMap = {
  JavaScript: "javascript",
  TypeScript: "typescript",
} as Record<string, string>;

const emojiOptions = [
  "😍", "😃", "🤓", "🤔", "👍"
]
type Emoji = typeof emojiOptions[number];
type Username = string
type LineEmoji = Record<Emoji, Username[]>;
type EmojiMap = Record<number, LineEmoji>;

type Row = {
  type: "element",
  properties: Record<string, any>,
  children: any[],
  style?: Record<string, any>,
  tagName: "span",
}

const CodeRenderer = ({ rows, stylesheet, useInlineStyles, emojiMap, username, onEmojiChange }: {
  rows: Row[],
  stylesheet: unknown,
  useInlineStyles: boolean,
  emojiMap: EmojiMap,
  username: string,
  onEmojiChange: (emojiMap: EmojiMap) => void,
}) => {
  console.log(rows)
  return (
    rows.map((row, index) => (
      <Row
        key={index}
        row={row}
        stylesheet={stylesheet}
        useInlineStyles={useInlineStyles}
        username={username}
        activeEmoji={emojiMap[index] || {}}
        onEmojiChange={(emoji: Emoji) => {
          const emojiLine = emojiMap[index] || {};
          const isSelected = emojiLine[emoji]?.includes(username);
          console.log(isSelected, emojiLine[emoji], username)
          const newEmojiLine = isSelected
            ? { ...emojiLine, [emoji]: emojiLine[emoji]?.filter(u => u !== username) }
            : { ...emojiLine, [emoji]: [...(emojiLine[emoji] || []), username] }
          console.log(newEmojiLine)
          const newEmojiMap = { ...emojiMap, [index]: newEmojiLine };
          console.log(newEmojiMap)
          onEmojiChange(newEmojiMap);
        }}
      />
    ))
  )
}

const Row = ({ row, stylesheet, useInlineStyles, username, activeEmoji, onEmojiChange }: {
  row: Row,
  stylesheet: unknown,
  useInlineStyles: boolean,
  username: string,
  activeEmoji: LineEmoji,
  onEmojiChange: (emoji: Emoji) => void,
}) => {
  const [isShowingPicker, setIsShowingPicker] = useState(false);

  const node = createElement({
    node: row,
    stylesheet,
    style: row.style || {},
    useInlineStyles,
  })

  const hasAnyEmoji = activeEmoji && Object.keys(activeEmoji)?.find(e => activeEmoji[e]?.length > 0)

  return (
    <div
      className="line"
      onMouseEnter={() => setIsShowingPicker(true)}
      onMouseLeave={() => setIsShowingPicker(false)}
    >
      <div>
        {node}
      </div>

      {(hasAnyEmoji || isShowingPicker) && (
        <ButtonGroup className="emoji-set">
          {emojiOptions.map(emoji => {
            const count = activeEmoji[emoji]?.length || 0;
            if (!isShowingPicker && !count) return null;
            return (
              <button
                key={emoji}
                onClick={() => {
                  onEmojiChange(emoji);
                }}>
                <Tooltip
                  aria-label={activeEmoji[emoji]?.length ? `Reactions from ${activeEmoji[emoji].join(", ")}` : "No reactions yet"}
                >
                  <div className="emoji" style={{
                    background: activeEmoji[emoji]?.includes(username) ? "rgba(84,174,255,0.4)" : "#f4f4f4",
                  }}>
                    {emoji}
                    {activeEmoji[emoji]?.length > 0 && <span className="count">{activeEmoji[emoji].length}</span>}
                  </div>
                </Tooltip>
              </button>
            )
          })}
        </ButtonGroup>
      )}
    </div>
  )
}