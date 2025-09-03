// src/components/AddApplicationModal/AddApplicationModal.tsx
import React, { useEffect, useState } from "react";
import styles from "./AddApplicationModal.module.css";
import { searchPrograms } from "../../services/api";
import type { Program } from "../../services/api";

export default function AddApplicationModal({
  open,
  onClose,
  onAdd,
  existingProgramIds,
  busyProgramId,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (p: Program) => void;
  existingProgramIds: Set<number>;
  busyProgramId: number | null;
}) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Program[]>([]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchPrograms(q);
        setResults(data);
      } catch (err) {
        console.error(err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q, open]);

  useEffect(() => {
    if (!open) {
      setQ("");
      setResults([]);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3>Add an Application</h3>
          <button
            className={styles.iconBtn}
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className={styles.searchRow}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by programme name (e.g., 'Computer Science')"
            className={styles.searchInput}
            autoFocus
          />
        </div>

        {loading ? (
          <div className={styles.skeletonList}>
            <div className={styles.skeleton} />
            <div className={styles.skeleton} />
            <div className={styles.skeleton} />
          </div>
        ) : results.length === 0 ? (
          <div className={styles.empty}>
            <p>No programmes found.</p>
          </div>
        ) : (
          <ul className={styles.grid}>
            {results.map((p) => {
              const uni = p.universities;
              const disabled =
                existingProgramIds.has(p.id) || busyProgramId === p.id;
              return (
                <li key={p.id} className={styles.card}>
                  <div className={styles.top}>
                    <div className={styles.uniRow}>
                      {uni?.abbreviation ? (
                        <span className={styles.uniBadge}>
                          {uni.abbreviation}
                        </span>
                      ) : null}
                      <span className={styles.uniName}>{uni?.name ?? "—"}</span>
                    </div>
                    <div className={styles.name}>{p.name}</div>
                  </div>

                  <div className={styles.meta}>
                    <div>
                      <strong>APS:</strong> {p.aps_requirement ?? "—"}
                    </div>
                    <div>
                      <strong>Closes:</strong>{" "}
                      {p.application_close
                        ? new Date(p.application_close).toLocaleDateString()
                        : "—"}
                    </div>
                  </div>

                  <div className={styles.actions}>
                    {existingProgramIds.has(p.id) ? (
                      <span className={styles.already}>Already added</span>
                    ) : (
                      <button
                        className={styles.primaryBtn}
                        disabled={disabled}
                        onClick={() => onAdd(p)}
                      >
                        {busyProgramId === p.id ? "Adding..." : "Add"}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
