import React, { useEffect, useMemo, useState } from "react";
import styles from "./SideBar.module.css";
import { useUser } from "../../Users/UserContext";
import { getCalendar, type CalendarEvent } from "../../services/api";

// YYYY-MM for a given date
function monthKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

// "18 Sept"
function prettyDay(iso: string) {
  const [y, m, d] = iso.split("-").map((n) => parseInt(n, 10));
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
  });
}

/** ─────────────────────────────────────────────────────────────
 * Color mapping (matches your legend screenshot)
 *  - University Deadlines: purple
 *  - Tutoring Sessions: blue
 *  - Bursary Applications: red
 *  - Career Events (career fairs / hackathons): green
 *  - Study Sessions: orange
 *  - Default / unknown: grey
 *  Uses `event.source` and `event.meta.type` + a few keywords.
 * ──────────────────────────────────────────────────────────── */
const COLORS = {
  university: "#6A1B9A",
  tutoring: "#1E88E5",
  bursary: "#D93025",
  career: "#2E7D32",
  study: "#F39C12",
  default: "#B0B0B0",
};

function colorFor(e: CalendarEvent): string {
  const source = e.source; // "application" | "event" | "deadline"
  const typ = String(e.meta?.type ?? "").toLowerCase();
  const label = (e.title || "").toLowerCase();

  // University application deadlines
  if (
    source === "application" ||
    typ === "application_deadline" ||
    /application deadline/.test(label)
  )
    return COLORS.university;

  // Bursary applications (from events feed)
  if (source === "event" && (typ === "bursary" || /bursary/.test(label)))
    return COLORS.bursary;

  // Career events: career fairs & hackathons
  if (
    source === "event" &&
    (typ === "careerfair" ||
      typ === "hackathon" ||
      /career|hackathon/.test(label))
  )
    return COLORS.career;

  // Tutoring sessions (personal items with tutoring keywords)
  if (source === "deadline" && /tutor|lesson|class|session.*tutor/.test(label))
    return COLORS.tutoring;

  // Study sessions (personal items)
  if (source === "deadline" && /study|revision|exam prep|mock test/.test(label))
    return COLORS.study;

  return COLORS.default;
}

const UpcomingDeadlines: React.FC = () => {
  const { user } = useUser();
  const userId = user?.id ?? null;

  const [items, setItems] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setItems([]);
      return;
    }

    const now = new Date();
    const thisMonth = monthKey(now);
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextMonth = monthKey(next);

    const ac = new AbortController();

    (async () => {
      try {
        setLoading(true);

        // Pull current and next month, merge, then filter client-side
        const [cur, nxt] = await Promise.all([
          getCalendar(userId, thisMonth, { signal: ac.signal }),
          getCalendar(userId, nextMonth, { signal: ac.signal }),
        ]);

        const todayISO = new Date().toISOString().slice(0, 10);
        const merged = [...cur, ...nxt]
          .filter((e) => e.date >= todayISO) // only upcoming
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(0, 5); // show top 5

        setItems(merged);
      } catch (e: any) {
        if (e?.name !== "AbortError")
          console.error("Deadlines load failed:", e);
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [userId]);

  const rows = useMemo(
    () =>
      items.map((e) => {
        let label = e.title;
        if (e.source === "application" && !/deadline/i.test(label)) {
          label = `Application — ${label}`;
        } else if (e.source === "event" && !/event/i.test(label)) {
          label = `Event — ${label}`;
        }
        return { id: e.id, label, date: e.date, color: colorFor(e) };
      }),
    [items]
  );

  return (
    <div className={styles.card}>
      <h3>Upcoming Deadlines</h3>
      {loading ? (
        <div className={styles.loading}>Loading…</div>
      ) : rows.length === 0 ? (
        <div className={styles.empty}>Nothing coming up. Add an event!</div>
      ) : (
        <ul className={styles.list}>
          {rows.map((r) => (
            <li key={r.id} className={styles.row}>
              <span className={styles.left}>
                <span
                  className={styles.dot}
                  style={{ backgroundColor: r.color }}
                />
                <span className={styles.labelText}>{r.label}</span>
              </span>
              <span className={styles.date}>{prettyDay(r.date)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UpcomingDeadlines;
