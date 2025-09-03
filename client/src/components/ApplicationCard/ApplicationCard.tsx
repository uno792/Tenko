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
  onApplyNow,
  onMarkApplied,
}: {
  app: ApplicationRow;
  onRemove: () => void;
  onApplyNow: () => void;
  onMarkApplied: () => void;
}) {
  const uni = app.program?.universities;
  const deadline = app.deadline ?? app.program?.application_close ?? null;
  const left = daysLeft(deadline);
  const [prompt, setPrompt] = useState(false);

  const showPrompt = app.status === "planning" && prompt;

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

        {app.status === "planning" && !showPrompt && (
          <button
            className={styles.primaryBtn}
            onClick={() => {
              onApplyNow();
              setPrompt(true);
            }}
          >
            Apply now →
          </button>
        )}

        {showPrompt && (
          <>
            <button className={styles.ghost} onClick={() => setPrompt(false)}>
              Later
            </button>
            <button
              className={styles.primaryBtn}
              onClick={async () => {
                await onMarkApplied();
                setPrompt(false);
              }}
            >
              Applied ✓
            </button>
          </>
        )}
      </div>
    </li>
  );
}
