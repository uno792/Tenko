import { useEffect, useState } from "react";
import styles from "./ContributorsCard.module.css";

interface Contributor {
  username: string;
  uploads: number;
  downloads: number;
  points: number;
}

export default function ContributorsCard() {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchContributors() {
      try {
        const res = await fetch("http://localhost:3000/resources/top-contributors?limit=5");
        if (!res.ok) throw new Error("Failed to fetch contributors");
        const data = await res.json();
        setContributors(data);
      } catch (err) {
        console.error("❌ fetchContributors error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchContributors();
  }, []);

  if (loading) return <div className={styles.card}>Loading top contributors...</div>;
  if (!contributors.length) return <div className={styles.card}>No contributors yet.</div>;

  return (
    <div className={styles.card}>
      <h3>Top Contributors</h3>
      <ul className={styles.list}>
        {contributors.map((c, index) => (
          <li key={index} className={styles.item}>
            <span className={styles.rank}>#{index + 1}</span>
            <span className={styles.name}>{c.username}</span>
            <span className={styles.stats}>
              {c.uploads} uploads • {c.downloads} downloads • {c.points} pts
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}


/*import styles from "./ContributorsCard.module.css";

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
}*/
