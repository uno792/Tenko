import React, { useEffect, useState } from "react";
import styles from "./Recommendations.module.css";
import { useUser } from "../../Users/UserContext";
import { getUniversities, getRecommendations } from "../../services/api";
import { addApplication } from "../../services/api";

export default function Recommendations() {
  const { user } = useUser();
  const userId = user?.id ?? null;

  const [uniId, setUniId] = useState<number | null>(null);
  const [universities, setUniversities] = useState<
    { id: number; name: string; abbreviation?: string | null }[]
  >([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const list = await getUniversities();
      setUniversities(list);
      const wits = list.find(
        (u) =>
          (u.abbreviation ?? "").toUpperCase().includes("WITS") ||
          /Witwatersrand/i.test(u.name)
      );
      setUniId(wits?.id ?? list[0]?.id ?? null);
    })().catch(console.error);
  }, []);

  useEffect(() => {
    if (!userId || !uniId) return;
    setLoading(true);
    getRecommendations(userId, uniId)
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId, uniId]);

  const onAdd = async (program_id: number) => {
    if (!userId) return;
    try {
      setBusy(program_id);
      await addApplication(userId, program_id);
      // keep UX simple; you can also trigger a banner "Added"
    } catch (e) {
      console.error(e);
      alert("Failed to add application");
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className={styles.card}>
      <div className={styles.head}>
        <h2 className={styles.title}>Recommended Programmes</h2>
        <select
          className={styles.uniSelect}
          value={uniId ?? ""}
          onChange={(e) => setUniId(Number(e.target.value))}
        >
          {universities.map((u) => {
            const tag = (u.abbreviation && u.abbreviation.trim()) || u.name;
            return (
              <option key={u.id} value={u.id}>
                {tag}
              </option>
            );
          })}
        </select>
      </div>

      {loading ? (
        <div className={styles.skeletonList}>
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
        </div>
      ) : items.length === 0 ? (
        <div className={styles.empty}>
          No matches yet. Make sure you’ve saved your APS profile.
        </div>
      ) : (
        <ul className={styles.list}>
          {items.map((it) => {
            const p = it.program;
            return (
              <li key={p.id} className={styles.item}>
                <div className={styles.topline}>
                  <div className={styles.name}>
                    {p.name}{" "}
                    <span className={styles.tag}>{p.university_tag}</span>
                  </div>
                  <div className={styles.right}>
                    {p.aps_requirement ? (
                      <span className={styles.apsReq}>
                        Min APS: {p.aps_requirement}
                      </span>
                    ) : null}
                    <button
                      className={styles.primary}
                      disabled={busy === p.id}
                      onClick={() => onAdd(p.id)}
                    >
                      {busy === p.id ? "Adding…" : "Add"}
                    </button>
                  </div>
                </div>
                <div className={styles.chips}>
                  {/* show subject requirement bubbles */}
                  {it.checks.map((c: any, idx: number) => (
                    <span
                      key={idx}
                      className={`${styles.chip} ${
                        c.ok ? styles.ok : styles.miss
                      }`}
                    >
                      {c.tag}
                      {c.need ? ` ≥ ${c.need}` : ""}
                    </span>
                  ))}
                  {p.application_close ? (
                    <span className={styles.deadline}>
                      Closes:{" "}
                      {new Date(p.application_close).toLocaleDateString()}
                    </span>
                  ) : null}
                </div>
                {p.requirement_notes ? (
                  <div className={styles.notes}>{p.requirement_notes}</div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
