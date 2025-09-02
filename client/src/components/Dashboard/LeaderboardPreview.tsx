import styles from "./LeaderboardPreview.module.css";

const sampleLeaders = [
  { name: "Aisha", points: 120 },
  { name: "Thabo", points: 100 },
  { name: "Naledi", points: 95 },
];

export default function LeaderboardPreview() {
  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Top Contributors</h2>
      <ul className={styles.list}>
        {sampleLeaders.map((leader, idx) => (
          <li key={idx} className={styles.item}>
            <span>{leader.name}</span>
            <span className={styles.points}>{leader.points} pts</span>
          </li>
        ))}
      </ul>
      <a href="/leaderboard" className={styles.link}>
        See Full Leaderboard
      </a>
    </div>
  );
}
