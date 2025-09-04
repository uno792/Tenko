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
      title: "Generate Exam Paper",
      description:
        "Automatically creates exam papers with a variety of questions, difficulty levels, and marking guidelines",
      icon: "📄",
      action: () => navigate("/generate"),
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
