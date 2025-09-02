// src/pages/AIAssistantPage.tsx
import styles from "./AIAssistantPage.module.css";
import Chatbot from "../components/AIAssistant/Chatbot";
import AIToolsGrid from "../components/AIAssistant/AIToolsGrid";

export default function AIAssistantPage() {
  return (
    <div className={styles.container}>
      {/* Chat Section */}
      <Chatbot />

      {/* AI Tools Section */}
      <h2 className={styles.sectionHeading}>Specialized AI Tools</h2>
      <AIToolsGrid />
    </div>
  );
}
