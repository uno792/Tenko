import React, { useEffect, useState } from "react";
import styles from "./LeaderboardPreview.module.css";
import { baseURL } from "../../config";

type Contributor = {
  username: string;
  uploads: number;
  downloads: number;
  points: number;
};

export default function LeaderboardPreview() {
  const [leaders, setLeaders] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await fetch(
          `${baseURL}/resources/top-contributors?limit=5`,
          { signal: ac.signal }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: Contributor[] = await res.json();
        setLeaders(data ?? []);
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          console.error("❌ top-contributors fetch failed:", e);
          setErr("Couldn't load leaderboard");
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, []);

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Top Contributors</h2>

      {loading ? (
        <ul className={styles.list}>
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className={`${styles.item} ${styles.skeleton}`}>
              <span className={styles.left}>
                <span className={styles.rankBox}>#{i + 1}</span>
                <span className={styles.name} />
              </span>
              <span className={styles.points} />
            </li>
          ))}
        </ul>
      ) : err ? (
        <div className={styles.muted}>{err}</div>
      ) : leaders.length === 0 ? (
        <div className={styles.muted}>No contributors yet.</div>
      ) : (
        <ul className={styles.list}>
          {leaders.map((c, idx) => (
            <li key={idx} className={styles.item}>
              <span className={styles.left}>
                <span className={styles.rankBox}>#{idx + 1}</span>
                <span className={styles.name}>{c.username || "Unknown"}</span>
                <span className={styles.meta}>
                  {c.uploads} uploads • {c.downloads} downloads
                </span>
              </span>
              <span className={styles.points}>{c.points} pts</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
