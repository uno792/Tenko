import styles from "./ContributorsCard.module.css";

const contributors = [
  { name: "Sarah M.", uploads: 23, points: 1250 },
  { name: "John D.", uploads: 18, points: 980 },
  { name: "Mike K.", uploads: 15, points: 850 },
  { name: "Lisa R.", uploads: 12, points: 720 },
  { name: "David P.", uploads: 9, points: 540 },
];

export default function ContributorsCard() {
  return (
    <div className={styles.card}>
      <h3>Top Contributors</h3>
      <p>Leading the community</p>
      <ul className={styles.list}>
        {contributors.map((c, idx) => (
          <li key={idx} className={styles.item}>
            <span className={styles.rank}>{idx + 1}</span>
            <span className={styles.name}>{c.name}</span>
            <span className={styles.details}>
              {c.uploads} uploads • {c.points} points
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
