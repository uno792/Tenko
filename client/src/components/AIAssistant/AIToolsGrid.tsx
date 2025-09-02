// src/components/AIAssistant/AIToolsGrid.tsx
import styles from "./AIToolsGrid.module.css";
import AIToolCard from "./AIToolCard";
import { useNavigate } from "react-router-dom";

export default function AIToolsGrid() {
  const navigate = useNavigate();

  const tools = [
    {
      title: "Quiz/Flashcards Maker",
      description:
        "Generates quizzes or flashcards from notes, textbooks, or past papers, complete with answers and explanations",
      icon: "📝",
      action: () => navigate("/practice"),
    },
    {
      title: "Mini Course Builder",
      description:
        "Builds short, personalized courses on any topic, broken into lessons, exercises, and summaries",
      icon: "📚",
      action: () => alert("Mini Course Builder coming soon!"),
    },
    {
      title: "NSC Matric Study Tool",
      description:
        "Subject-based assistant aligned with the South African National Senior Certificate curriculum",
      icon: "📖",
      action: () => alert("NSC Matric Study Tool coming soon!"),
    },
  ];

  return (
    <div className={styles.grid}>
      {tools.map((tool, i) => (
        <AIToolCard key={i} {...tool} />
      ))}
    </div>
  );
}
