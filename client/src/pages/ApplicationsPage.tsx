import React, { useEffect, useMemo, useState, useCallback } from "react";
import styles from "./ApplicationsPage.module.css";

import {
  addApplication,
  deleteApplication,
  getApplications,
  updateApplication,
  type ApplicationRow,
  type Program,
} from "../services/api";

import ApplicationCard from "../components/ApplicationCard/ApplicationCard";
import AddApplicationModal from "../components/AddApplicationModal/AddApplicationModal";
import ApsCalculatorV2 from "../components/ApsCalculator/ApsCalculatorV2";
import { useUser } from "../Users/UserContext";

function daysLeft(dateStr: string | null | undefined) {
  if (!dateStr) return null;
  const now = new Date();
  const d = new Date(dateStr);
  const diff = d.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function ApplicationsPage() {
  const { user } = useUser();
  const userId = user?.id;

  const [apps, setApps] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      setLoading(true);
      try {
        const data = await getApplications(userId);
        setApps(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const existingProgramIds = useMemo(
    () => new Set(apps.map((a) => a.program_id)),
    [apps]
  );

  const handleAdd = async (p: Program) => {
    if (!userId) return;
    try {
      setBusyId(p.id);
      await addApplication(userId, p.id);
      // refetch to hydrate program join
      const fresh = await getApplications(userId);
      setApps(fresh);
    } catch (err) {
      console.error(err);
      alert("Failed to add application");
    } finally {
      setBusyId(null);
      setAddOpen(false);
    }
  };

  const handleRemove = async (id: number) => {
    const prev = apps;
    setApps((xs) => xs.filter((x) => x.id !== id));
    try {
      await deleteApplication(id);
    } catch (err) {
      console.error(err);
      alert("Failed to remove. Restoring previous state.");
      setApps(prev);
    }
  };

  const handleMarkApplied = useCallback(async (id: number) => {
    try {
      const updated = await updateApplication(id, { status: "submitted" });
      setApps((xs) =>
        xs.map((x) => (x.id === id ? { ...x, status: updated.status } : x))
      );
    } catch (e) {
      console.error(e);
      alert("Failed to update application");
    }
  }, []);

  const handleApplyNow = useCallback((website?: string | null) => {
    if (!website) return;
    window.open(website, "_blank", "noopener,noreferrer");
  }, []);

  const upcoming = useMemo(
    () =>
      apps
        .filter((a) => a.status === "planning")
        .map((a) => {
          const when = a.deadline ?? a.program?.application_close ?? null;
          return {
            id: a.id,
            name: a.program?.name ?? "Programme",
            when,
            left: daysLeft(when),
          };
        })
        .filter((x) => x.when)
        .sort((a, b) => (a.when! < b.when! ? -1 : 1))
        .slice(0, 6),
    [apps]
  );

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>University Application Hub</h1>
          <p className={styles.subtitle}>
            Your complete guide to SA applications, requirements, and deadlines.
          </p>
        </div>
      </header>

      <div className={styles.grid}>
        {/* Left: APS calculator stays auto-height */}
        <section className={`${styles.card} ${styles.slimCard}`}>
          <div className={styles.cardHeadTight}>
            <h2 className={styles.cardTitle}>APS Calculator</h2>
          </div>
          <ApsCalculatorV2 compact />
        </section>

        {/* Middle + Right: stretch together */}
        <div className={styles.flexPair}>
          {/* Applications */}
          <section className={styles.card}>
            <div className={styles.cardHead}>
              <h2 className={styles.cardTitle}>Applications</h2>
              <button
                className={styles.primaryBtn}
                onClick={() => setAddOpen(true)}
              >
                <span className={styles.plus}>＋</span> Add
              </button>
            </div>

            {loading ? (
              <div className={styles.skeletonList}>
                <div className={styles.skeleton} />
                <div className={styles.skeleton} />
                <div className={styles.skeleton} />
              </div>
            ) : apps.length === 0 ? (
              <div className={styles.empty}>
                <p>No applications yet.</p>
                <button
                  className={styles.linkBtn}
                  onClick={() => setAddOpen(true)}
                >
                  Add your first application →
                </button>
              </div>
            ) : (
              <ul className={styles.list}>
                {apps.map((a) => (
                  <ApplicationCard
                    key={a.id}
                    app={a}
                    onRemove={() => handleRemove(a.id)}
                    onApplyNow={() =>
                      handleApplyNow(a.program?.universities?.website)
                    }
                    onMarkApplied={() => handleMarkApplied(a.id)}
                  />
                ))}
              </ul>
            )}
          </section>

          {/* Upcoming Deadlines */}
          <section className={styles.card}>
            <div className={styles.cardHead}>
              <h2 className={styles.cardTitle}>Upcoming Deadlines</h2>
            </div>
            {upcoming.length === 0 ? (
              <div className={styles.emptySmall}>Nothing coming up.</div>
            ) : (
              <ul className={styles.deadlines}>
                {upcoming.map((d) => (
                  <li key={d.id} className={styles.deadlineItem}>
                    <span className={styles.dot} />
                    <div className={styles.deadlineMain}>
                      <div className={styles.deadlineName}>{d.name}</div>
                      <div className={styles.deadlineDate}>
                        {new Date(d.when!).toLocaleDateString()}
                      </div>
                      <span className={styles.daysChip}>
                        {d.left === null
                          ? "—"
                          : d.left >= 0
                          ? `${d.left} days left`
                          : "Closed"}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <AddApplicationModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={handleAdd}
        existingProgramIds={existingProgramIds}
        busyProgramId={busyId}
      />
    </div>
  );
}
