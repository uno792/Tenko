// src/components/AIAssistant/MessageBubble.tsx
import ReactMarkdown from "react-markdown";
import styles from "./MessageBubble.module.css";

type Props = {
  role: "user" | "assistant";
  text: string;
  time: string;
};

export default function MessageBubble({ role, text, time }: Props) {
  const isUser = role === "user";

  return (
    <div
      className={`${styles.bubbleRow} ${
        isUser ? styles.user : styles.assistant
      }`}
    >
      <div className={styles.bubble}>
        <ReactMarkdown
          components={{
            h1: ({ node, ...props }) => (
              <h1 className={styles.markdownHeading} {...props} />
            ),
            h2: ({ node, ...props }) => (
              <h2 className={styles.markdownHeading} {...props} />
            ),
            h3: ({ node, ...props }) => (
              <h3 className={styles.markdownHeading} {...props} />
            ),
            ul: ({ node, ...props }) => (
              <ul className={styles.markdownList} {...props} />
            ),
            li: ({ node, ...props }) => (
              <li className={styles.markdownListItem} {...props} />
            ),
            a: ({ node, ...props }) => (
              <a
                className={styles.markdownLink}
                target="_blank"
                rel="noopener noreferrer"
                {...props}
              />
            ),
            strong: ({ node, ...props }) => (
              <strong className={styles.markdownStrong} {...props} />
            ),
            p: ({ node, ...props }) => (
              <p className={styles.markdownParagraph} {...props} />
            ),
          }}
        >
          {text}
        </ReactMarkdown>

        <span className={styles.time}>{time}</span>
      </div>
    </div>
  );
}
