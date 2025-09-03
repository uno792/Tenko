import React, { useState } from "react";
import styles from "./ApplicationCard.module.css";
import type { ApplicationRow } from "../../services/api";

function daysLeft(dateStr: string | null | undefined) {
  if (!dateStr) return null;
  const now = new Date();
  const d = new Date(dateStr);
  const diff = d.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
function chipColor(days: number | null) {
  if (days === null) return "#9b9b9b";
  if (days <= 7) return "#b00020";
  if (days <= 30) return "#cc334d";
  return "#9b9b9b";
}

export default function ApplicationCard({
  app,
  onRemove,
  onMarkApplied,
}: {
  app: ApplicationRow;
  onRemove: () => void;
  onMarkApplied: () => void;
}) {
  const uni = app.program?.universities;
  const website = uni?.website || null;
  const deadline = app.deadline ?? app.program?.application_close ?? null;
  const left = daysLeft(deadline);

  // local footer state: when user clicks "Apply now", show choice buttons
  const [choose, setChoose] = useState(false);
  const showAppliedBadge = app.status === "submitted";

  return (
    <li className={styles.card}>
      <div className={styles.main}>
        <div className={styles.head}>
          <h3 className={styles.name}>{app.program?.name ?? "Programme"}</h3>
          <span className={styles.chip} style={{ background: chipColor(left) }}>
            {left === null ? "—" : left >= 0 ? `${left} days left` : "Closed"}
          </span>
        </div>

        <div className={styles.meta}>
          <span className={styles.mitem}>
            <strong>University:</strong>{" "}
            {uni?.abbreviation
              ? `${uni.abbreviation} — ${uni.name}`
              : uni?.name ?? "—"}
          </span>
          <span className={styles.mitem}>
            <strong>APS:</strong> {app.program?.aps_requirement ?? "—"}
          </span>
          <span className={styles.mitem}>
            <strong>Deadline:</strong>{" "}
            {deadline ? new Date(deadline).toLocaleDateString() : "—"}
          </span>
          <span className={`${styles.status} ${styles[app.status]}`}>
            {app.status}
          </span>
        </div>
      </div>

      <div className={styles.actions}>
        <button className={styles.ghostDanger} onClick={onRemove}>
          Remove
        </button>

        {showAppliedBadge ? (
          <span className={styles.appliedPill}>Applied</span>
        ) : choose ? (
          <div className={styles.choiceRow}>
            <button
              className={styles.secondaryBtn}
              onClick={() => setChoose(false)}
            >
              Later
            </button>
            <button
              className={styles.primaryBtnSmall}
              onClick={() => {
                onMarkApplied();
                setChoose(false);
              }}
            >
              Applied
            </button>
          </div>
        ) : website ? (
          // Open new tab AND flip into choice mode
          <a
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.applyBtn}
            onClick={() => setChoose(true)}
          >
            Apply now →
          </a>
        ) : (
          <button className={`${styles.applyBtn} ${styles.disabled}`} disabled>
            Apply now →
          </button>
        )}
      </div>
    </li>
  );
}
