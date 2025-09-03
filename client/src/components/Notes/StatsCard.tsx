import { useEffect, useState } from "react";
import styles from "./StatsCard.module.css";
import { baseURL } from "../../config";
export default function StatsCard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch(
          `${baseURL}/resources/stats?user_id=test-user-123`
        );
        if (!res.ok) throw new Error("Failed to fetch stats");
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("❌ fetchStats error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) return <div className={styles.card}>Loading stats...</div>;
  if (!stats) return <div className={styles.card}>No stats available.</div>;

  return (
    <div className={styles.card}>
      <h3>Your Stats</h3>
      <p>Your contribution overview</p>
      <p>
        <strong>Uploads:</strong> {stats.uploads}
      </p>
      <p>
        <strong>Downloads:</strong> {stats.downloads}
      </p>
      <p>
        <strong>Points:</strong>{" "}
        <span className={styles.points}>{stats.points}</span>
      </p>
      <p>
        <strong>Rank:</strong> #{stats.rank}
      </p>
    </div>
  );
}

/*import styles from "./StatsCard.module.css";

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
}*/
