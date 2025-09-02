import styles from "./StatsCard.module.css";

export default function StatsCard() {
  return (
    <div className={styles.card}>
      <h3>Your Stats</h3>
      <p>Your contribution overview</p>
      <p>
        <strong>Uploads:</strong> 7
      </p>
      <p>
        <strong>Downloads:</strong> 89
      </p>
      <p>
        <strong>Points:</strong> <span className={styles.points}>435</span>
      </p>
      <p>
        <strong>Rank:</strong> #12
      </p>
    </div>
  );
}
