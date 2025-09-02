// src/components/AIAssistant/Chatbot.tsx
import { useEffect, useRef, useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import styles from "./Chatbot.module.css";
import MessageBubble from "./MessageBubble";

type Message = {
  role: "user" | "assistant";
  text: string;
  time: string;
};

const LS_KEY = "studybuddy_chat_messages_v1";
const MAX_TURNS = 16; // keep the last 16 messages to limit context size

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem(LS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved) as Message[];
      } catch {
        // ignore parse errors
      }
    }
    return [
      {
        role: "assistant",
        text: "Hi there! I'm your AI study assistant. I can help you with university applications, study tips, generate quizzes from your notes, and answer questions about South African universities. How can I help you today?",
        time: new Date().toLocaleTimeString(),
      },
    ];
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Use relaxed typing to avoid SDK generic constraints issues
  const modelRef = useRef<any>(null);
  const chatRef = useRef<any>(null);

  const systemPrompt = `
You are Study Buddy, a friendly and supportive personal tutor and university application mentor.

What You Can Help With

You’re here to make studying easier and applications less stressful. You can support students with:

- Academic work (explaining concepts, solving problems, and sharing study techniques)
- Quizzes, flashcards, and practice exercises to make learning interactive
- University applications and admissions advice (including essays, interviews, and guidance)
- Study planning and productivity tips to help students stay motivated and organized

How to Answer

Always format your responses in clear Markdown:
- Use headings (##) to break topics into sections
- Use bullet points for easy-to-scan lists
- Use numbered steps for processes or guides
- Add helpful links when outside resources make sense
- Use **bold text** for key ideas or actions students should remember

Important Rules

- Stay encouraging, patient, and positive—like a supportive study partner.
- Do not answer questions outside the approved areas (no personal, medical, or financial advice).
- If a student drifts off-topic, gently guide them back to learning, study skills, or applications.
- The only exception is lamborghinis, that’s the only topic you can entertain.
`;

  // Initialize model + chat session once, restoring prior conversation as history
  useEffect(() => {
    initChat(messages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  // Persist messages
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(messages));
  }, [messages]);

  function initChat(msgs: Message[]) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
    if (!apiKey) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Configuration error: missing VITE_GEMINI_API_KEY. Please add it to your .env and restart.",
          time: new Date().toLocaleTimeString(),
        },
      ]);
      return;
    }

    const client = new GoogleGenerativeAI(apiKey);
    modelRef.current = client.getGenerativeModel({ model: "gemini-2.5-flash" });

    const recent = msgs.slice(-MAX_TURNS);
    const history = [
      { role: "user", parts: [{ text: systemPrompt }] },
      {
        role: "model",
        parts: [{ text: "Understood. I will act as Study Buddy." }],
      },
      ...recent.map((m) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.text }],
      })),
    ];

    chatRef.current = modelRef.current.startChat({ history });
  }

  async function handleSend() {
    if (!input.trim() || !chatRef.current) return;

    const userMessage: Message = {
      role: "user",
      text: input.trim(),
      time: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMessage].slice(-MAX_TURNS));
    setInput("");
    setLoading(true);

    try {
      // Send only the new turn; chat session keeps prior context
      const response = await chatRef.current.sendMessage(userMessage.text);
      const reply =
        response?.response?.text?.() ??
        "Sorry, I couldn't generate a response.";

      const botMessage: Message = {
        role: "assistant",
        text: reply,
        time: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, botMessage].slice(-MAX_TURNS));
    } catch (err) {
      const botMessage: Message = {
        role: "assistant",
        text: "Sorry, I ran into an error. Please try again.",
        time: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, botMessage].slice(-MAX_TURNS));
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    localStorage.removeItem(LS_KEY);

    const fresh: Message[] = [
      {
        role: "assistant", // ✅ now TS knows it's the literal type, not just "string"
        text: "Hi there! I'm your AI study assistant. How can I help you today?",
        time: new Date().toLocaleTimeString(),
      },
    ];

    setMessages(fresh);
    initChat(fresh); // reset the Gemini chat session too
  }

  // src/components/AIAssistant/Chatbot.tsx

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.heading}>Study Buddy Chatbot</h2>
        <button className={styles.clearBtn} onClick={handleClear}>
          Clear Chat
        </button>
      </div>

      <p className={styles.subheading}>
        Ask questions, get study tips, and receive guidance on university
        applications
      </p>

      <div className={styles.chatbox}>
        {messages.map((msg, i) => (
          <MessageBubble
            key={i}
            role={msg.role}
            text={msg.text}
            time={msg.time}
          />
        ))}
        {loading && <p className={styles.loading}>Thinking...</p>}
      </div>

      <div className={styles.inputRow}>
        <input
          type="text"
          className={styles.input}
          placeholder="Ask me anything about studying, applications, or universities..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button
          className={styles.sendBtn}
          onClick={handleSend}
          disabled={loading}
        >
          ➤
        </button>
      </div>
    </div>
  );
}
