import React, { useMemo, useState } from "react";
import styles from "./EventCard.module.css";
import { type EventItem, markApplied } from "../../services/eventsApi";

type Props = {
  userId: string | null;
  event: EventItem;
  onStatusChange?: (id: number, status: "applied" | "saved" | null) => void;
};

const TYPE_COLORS: Record<string, string> = {
  Hackathon: "#ef4444", // red
  Bursary: "#10b981", // emerald
  CareerFair: "#7c3aed", // violet
  Workshop: "#f59e0b", // amber
  Conference: "#0ea5e9", // sky
  Other: "#8b1c32", // maroon
};

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString() : "";

function daysBetween(from: Date, to: Date) {
  const a = new Date(from);
  a.setHours(0, 0, 0, 0);
  const b = new Date(to);
  b.setHours(0, 0, 0, 0);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function humanizeDays(n: number) {
  if (n === 0) return "today";
  if (n === 1) return "in 1 day";
  if (n < 0) return `${Math.abs(n)} day${n === -1 ? "" : "s"} ago`;
  return `in ${n} days`;
}

export default function EventCard({ userId, event, onStatusChange }: Props) {
  const [mode, setMode] = useState<"idle" | "choice" | "applied">(
    event.user_status === "applied" ? "applied" : "idle"
  );
  const [busy, setBusy] = useState(false);

  // derive UI state: status headline + severity color
  const timeline = useMemo(() => {
    const now = new Date();
    const start = event.start_date ? new Date(event.start_date) : null;
    const end = event.end_date ? new Date(event.end_date) : null;

    // all-year
    if (event.is_all_year) {
      return {
        headline: "Available all year",
        severity: "neutral" as const,
        line: null as string | null,
      };
    }

    // only end ⇒ treat as deadline
    if (!start && end) {
      const d = daysBetween(now, end);
      return {
        headline: d < 0 ? "Closed" : `Deadline ${humanizeDays(d)}`,
        severity:
          d < 0
            ? ("closed" as const)
            : d <= 3
            ? ("critical" as const)
            : d <= 10
            ? ("soon" as const)
            : ("ok" as const),
        line: `Closes: ${fmtDate(event.end_date)}`,
      };
    }

    // only start
    if (start && !end) {
      const d = daysBetween(now, start);
      if (d > 0)
        return {
          headline: `Opens ${humanizeDays(d)}`,
          severity: "info" as const,
          line: `Opens: ${fmtDate(event.start_date)}`,
        };
      if (d === 0)
        return {
          headline: "Opens today",
          severity: "ok" as const,
          line: `Opens: ${fmtDate(event.start_date)}`,
        };
      return {
        headline: "Open now",
        severity: "ok" as const,
        line: `Opened: ${fmtDate(event.start_date)}`,
      };
    }

    // both dates
    if (start && end) {
      const dStart = daysBetween(now, start);
      const dEnd = daysBetween(now, end);

      if (dEnd < 0) {
        return {
          headline: "Closed",
          severity: "closed" as const,
          line: `Applications: ${fmtDate(event.start_date)} → ${fmtDate(
            event.end_date
          )}`,
        };
      }
      if (dStart > 0) {
        return {
          headline: `Opens ${humanizeDays(dStart)}`,
          severity: "info" as const,
          line: `Applications: ${fmtDate(event.start_date)} → ${fmtDate(
            event.end_date
          )}`,
        };
      }
      // within window
      const label =
        dEnd === 0 ? "Closes today" : `Deadline ${humanizeDays(dEnd)}`;
      const sev = dEnd <= 3 ? "critical" : dEnd <= 10 ? "soon" : "ok";
      return {
        headline: label,
        severity: sev as "critical" | "soon" | "ok",
        line: `Applications: ${fmtDate(event.start_date)} → ${fmtDate(
          event.end_date
        )}`,
      };
    }

    // no dates
    return {
      headline: "Check details",
      severity: "neutral" as const,
      line: null as string | null,
    };
  }, [event.start_date, event.end_date, event.is_all_year]);

  const leftColor = TYPE_COLORS[event.type || "Other"] || TYPE_COLORS.Other;

  const openApply = () => {
    window.open(event.link, "_blank", "noopener,noreferrer");
    if (mode === "idle") setMode("choice");
  };

  const doApplied = async () => {
    if (!userId) {
      alert("Please sign in to track applications.");
      return;
    }
    try {
      setBusy(true);
      await markApplied(userId, event.id);
      setMode("applied");
      onStatusChange?.(event.id, "applied");
    } finally {
      setBusy(false);
    }
  };

  const doLater = () => {
    setMode("idle");
    onStatusChange?.(event.id, null);
  };

  return (
    <div className={styles.card} style={{ borderLeftColor: leftColor }}>
      {/* header */}
      <div className={styles.header}>
        <a
          className={styles.titleLink}
          href={event.link}
          target="_blank"
          rel="noreferrer"
        >
          {event.title}
        </a>
        <span
          className={`${styles.status} ${styles[`sev_${timeline.severity}`]}`}
        >
          {timeline.headline}
        </span>
      </div>

      {/* meta row */}
      <div className={styles.metaRow}>
        {event.start_date && (
          <span className={styles.metaItem}>
            <CalendarIcon /> Starts: {fmtDate(event.start_date)}
          </span>
        )}
        {event.location && (
          <span className={styles.metaItem}>
            <LocationIcon /> {event.location}
          </span>
        )}
      </div>

      {/* application window */}
      {timeline.line && (
        <div className={styles.appsLine}>
          <DoorIcon /> {timeline.line}
        </div>
      )}

      {/* description */}
      {event.description && <p className={styles.desc}>{event.description}</p>}

      {/* footer */}
      <div className={styles.footer}>
        <span
          className={styles.typePill}
          style={{ backgroundColor: leftColor }}
        >
          {event.type || "Opportunity"}
        </span>

        <div className={styles.tags}>
          {(event.faculty_tags || []).slice(0, 6).map((t) => (
            <span key={t} className={styles.tag}>
              {t}
            </span>
          ))}
        </div>

        <div className={styles.actions}>
          {mode === "idle" && (
            <button className={styles.applyBtn} onClick={openApply}>
              Apply
            </button>
          )}
          {mode === "choice" && (
            <>
              <button
                className={styles.primaryBtn}
                disabled={busy}
                onClick={doApplied}
              >
                I Applied
              </button>
              <button
                className={styles.ghostBtn}
                disabled={busy}
                onClick={doLater}
              >
                Later
              </button>
            </>
          )}
          {mode === "applied" && (
            <span className={styles.appliedBadge}>Applied</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* —— tiny inline icons, no deps —— */
function CalendarIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      className={styles.icon}
      aria-hidden
    >
      <path
        d="M7 2v3M17 2v3M3 10h18M5 6h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}
function LocationIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      className={styles.icon}
      aria-hidden
    >
      <path
        d="M12 22s8-6.5 8-12a8 8 0 1 0-16 0c0 5.5 8 12 8 12z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle
        cx="12"
        cy="10"
        r="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}
function DoorIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      className={styles.icon}
      aria-hidden
    >
      <path
        d="M4 21h16M7 20V4a2 2 0 0 1 2-2h6v18M15 10h.01"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}
