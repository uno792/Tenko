import styles from "./QuickActions.module.css";

const actions = [
  { label: "APS Calculator", link: "/applications" },
  { label: "AI Quiz Generator", link: "/practice" },
  { label: "AI Assistant", link: "/ai-assistant" },
  { label: "Upload Notes", link: "/notes" },
  { label: "Find Tutors", link: "/findtutor" },
  { label: "Build CV", link: "/career" },
];

export default function QuickActions() {
  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Quick Actions</h2>
      <div className={styles.grid}>
        {actions.map((action) => (
          <a key={action.label} href={action.link} className={styles.button}>
            {action.label}
          </a>
        ))}
      </div>
    </div>
  );
}
