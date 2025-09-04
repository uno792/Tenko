import React, { useEffect, useMemo, useState } from "react";
import DashboardHeader from "../components/Dashboard/DashboardHeader";
import DeadlineCard from "../components/Dashboard/DeadlineCard";
import EventCard from "../components/Dashboard/EventCard";
import QuickActions from "../components/Dashboard/QuickActions";
import LeaderboardPreview from "../components/Dashboard/LeaderboardPreview";
import styles from "./home.module.css";

import { useUser } from "../Users/UserContext";
import { getCalendar } from "../services/api"; // ensure this exists

type CalendarEvent = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  endDate?: string | null;
  source: "application" | "event" | "deadline";
  source_id: number | string;
  meta?: Record<string, any>;
};

/* ───── helpers ────────────────────────────────────────────── */

function monthKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function formatDateLong(iso: string) {
  const [y, m, d] = iso.split("-").map((n) => parseInt(n, 10));
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function daysUntil(iso: string) {
  const [y, m, d] = iso.split("-").map((n) => parseInt(n, 10));
  const target = new Date(y, m - 1, d, 23, 59, 59);
  const now = new Date();
  const ms = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function properCase(s: string | null | undefined) {
  const t = String(s ?? "").toLowerCase();
  if (!t) return "";
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** Try to pull course + university from our standard app title:
 *  "Application deadline — BA (Arts) (WITS)"
 */
function splitAppTitle(e: CalendarEvent) {
  const uniFromMeta =
    (e.meta?.university?.abbreviation as string) ||
    (e.meta?.university?.name as string) ||
    "";

  const m = /^Application deadline — (.+?)\s+\(([^)]+)\)$/.exec(e.title ?? "");
  if (m) {
    return { course: m[1], uni: m[2] || uniFromMeta || "University" };
  }
  return {
    course: e.title?.replace(/^Application deadline —\s*/, "") || "Programme",
    uni: uniFromMeta || "University",
  };
}

/* ───── component ─────────────────────────────────────────── */

export default function HomePage() {
  const { user } = useUser();
  const userId = user?.id ?? null;

  // 👇 derive a first name from user context (fallbacks: username, email prefix)
  const fullName =
    (user?.name ?? (user as any)?.username ?? (user as any)?.displayName ?? "")
      ?.toString?.()
      .trim() || "";

  const firstName =
    (fullName && fullName.split(/\s+/)[0]) ||
    (user?.email ? user.email.split("@")[0] : "there");

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setEvents([]);
      return;
    }

    const ac = new AbortController();

    (async () => {
      try {
        setLoading(true);
        const now = new Date();
        const thisMonth = monthKey(now);
        const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const nextMonth = monthKey(next);

        const [cur, nxt] = await Promise.all([
          getCalendar(userId, thisMonth, { signal: ac.signal }),
          getCalendar(userId, nextMonth, { signal: ac.signal }),
        ]);

        setEvents([...cur, ...nxt]);
      } catch (e: any) {
        if (e?.name !== "AbortError")
          console.error("Dashboard calendar load failed:", e);
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [userId]);

  const todayISO = new Date().toISOString().slice(0, 10);

  const applicationCards = useMemo(() => {
    return events
      .filter((e) => e.source === "application" && e.date >= todayISO)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 3)
      .map((e) => {
        const { uni, course } = splitAppTitle(e);
        const daysLeft = daysUntil(e.date);
        const urgent = daysLeft <= 14;
        return {
          key: e.id,
          uni,
          course,
          date: formatDateLong(e.date),
          daysLeft,
          urgent,
        };
      });
  }, [events, todayISO]);

  const upcomingEventCards = useMemo(() => {
    return events
      .filter((e) => e.source === "event" && e.date >= todayISO)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 3)
      .map((e) => {
        const daysLeft = daysUntil(e.date);
        const urgent = daysLeft <= 14;
        const category =
          properCase(String(e.meta?.type ?? "")) ||
          (/bursary/i.test(e.title) ? "Bursary" : "Event");

        return {
          key: e.id,
          title: e.title,
          category,
          date: formatDateLong(e.date),
          daysLeft,
          urgent,
        };
      });
  }, [events, todayISO]);

  return (
    <div className={styles.container}>
      {/* use first name in the header */}
      <DashboardHeader userName={firstName} />

      <div className={styles.dashboardGrid}>
        <section>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Application Deadlines</h2>
            <a href="/applications" className={styles.sectionLink}>
              View All →
            </a>
          </div>

          {loading && applicationCards.length === 0 ? (
            <p className={styles.muted}>Loading…</p>
          ) : applicationCards.length === 0 ? (
            <p className={styles.muted}>No upcoming deadlines.</p>
          ) : (
            applicationCards.map((c) => (
              <DeadlineCard
                key={c.key}
                uni={c.uni}
                course={c.course}
                date={c.date}
                daysLeft={c.daysLeft}
                urgent={c.urgent}
              />
            ))
          )}
        </section>

        <section>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Upcoming Events</h2>
            <a href="/events" className={styles.sectionLink}>
              View All →
            </a>
          </div>

          {loading && upcomingEventCards.length === 0 ? (
            <p className={styles.muted}>Loading…</p>
          ) : upcomingEventCards.length === 0 ? (
            <p className={styles.muted}>No upcoming events.</p>
          ) : (
            upcomingEventCards.map((c) => (
              <EventCard
                key={c.key}
                title={c.title}
                category={c.category}
                date={c.date}
                daysLeft={c.daysLeft}
                urgent={c.urgent}
              />
            ))
          )}
        </section>
      </div>

      <div className={styles.fullWidth}>
        <QuickActions />
      </div>

      <div className={styles.fullWidth}>
        <LeaderboardPreview />
      </div>
    </div>
  );
}
