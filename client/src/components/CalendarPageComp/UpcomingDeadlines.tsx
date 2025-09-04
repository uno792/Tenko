import React, { useEffect, useMemo, useState } from "react";
import styles from "./SideBar.module.css";
import { useUser } from "../../Users/UserContext";
import { getCalendar, type CalendarEvent } from "../../services/api";

// helper: YYYY-MM for a given date
function monthKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

// helper: format "15 Jan"
function prettyDay(iso: string) {
  const [y, m, d] = iso.split("-").map((n) => parseInt(n, 10));
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
  });
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
        // pull current and next month, merge, then filter client-side
        const [cur, nxt] = await Promise.all([
          getCalendar(userId, thisMonth, { signal: ac.signal }),
          getCalendar(userId, nextMonth, { signal: ac.signal }),
        ]);

        const todayISO = new Date().toISOString().slice(0, 10);

        const merged = [...cur, ...nxt]
          // keep anything from today onward
          .filter((e) => e.date >= todayISO)
          // prefer deadlines / end of window if present
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(0, 5);

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

  // group/label by source (optional)
  const rows = useMemo(() => {
    return items.map((e) => {
      let label = e.title;
      // small tweak: make it compact if it came from our unified sources
      if (e.source === "application" && !/deadline/i.test(label)) {
        label = `Application — ${label}`;
      } else if (e.source === "event" && !/event/i.test(label)) {
        label = `Event — ${label}`;
      }
      return { id: e.id, label, date: e.date };
    });
  }, [items]);

  return (
    <div className={styles.card}>
      <h3>Upcoming Deadlines</h3>
      {loading ? (
        <div className={styles.loading}>Loading…</div>
      ) : rows.length === 0 ? (
        <div className={styles.empty}>Nothing coming up. Add an event!</div>
      ) : (
        <ul>
          {rows.map((r) => (
            <li key={r.id} className={styles.row}>
              <span className={styles.labelWrap}>
                <span className={styles.dot} />
                <span className={styles.labelText}>{r.label}</span>
              </span>
              <small className={styles.date}>{prettyDay(r.date)}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UpcomingDeadlines;
