import styles from "./DashboardHeader.module.css";

interface DashboardHeaderProps {
  userName: string;
}

export default function DashboardHeader({ userName }: DashboardHeaderProps) {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>Welcome back, {userName} !</h1>
      <p className={styles.subtitle}>
        Here's an overview of your academic progress and upcoming tasks.
      </p>
    </header>
  );
}
