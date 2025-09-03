import React, { useEffect, useMemo, useState } from "react";
import styles from "./ApplicationsPage.module.css";
import {
  addApplication,
  deleteApplication,
  getApplications,
  updateApplication,
} from "../services/api";
import type { ApplicationRow, Program } from "../services/api";
import ApplicationCard from "../components/ApplicationCard/ApplicationCard";
import AddApplicationModal from "../components/AddApplicationModal/AddApplicationModal";
import { useUser } from "../Users/UserContext";
import LoginRequiredPanel from "../components/LoginRequiredPanel/LoginRequiredPanel";

export default function ApplicationsPage() {
  const { user } = useUser();
  const userId = user?.id ?? null;

  const [apps, setApps] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!userId) {
        setApps([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await getApplications(userId);
        if (alive) setApps(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [userId]);

  const existingProgramIds = useMemo(
    () => new Set(apps.map((a) => a.program_id)),
    [apps]
  );

  const handleAdd = async (p: Program) => {
    if (!userId) {
      alert("Please sign in to add an application.");
      return;
    }
    try {
      setBusyId(p.id);
      const row = await addApplication(userId, p.id);
      // If the server (for any reason) didn’t include the join, enrich with the Program the user chose
      const enriched: ApplicationRow = row.program
        ? row
        : {
            ...row,
            program: {
              id: p.id,
              name: p.name,
              aps_requirement: p.aps_requirement,
              application_open: p.application_open,
              application_close: p.application_close,
              universities: p.universities ?? null,
            },
          };
      setApps((prev) => [enriched, ...prev]);
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

  const handleMarkApplied = async (id: number) => {
    const prev = apps;
    setApps((xs) =>
      xs.map((x) => (x.id === id ? { ...x, status: "submitted" } : x))
    );
    try {
      await updateApplication(id, { status: "submitted" });
    } catch (err) {
      console.error(err);
      alert("Failed to mark as applied. Restoring previous state.");
      setApps(prev);
    }
  };

  if (!userId) {
    return (
      <div className={styles.wrap}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>University Application Hub</h1>
            <p className={styles.subtitle}>
              Sign in to start tracking your applications, deadlines, and APS.
            </p>
          </div>
        </header>
        <LoginRequiredPanel />
      </div>
    );
  }

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
        <section className={styles.card}>
          <div className={styles.cardHead}>
            <h2 className={styles.cardTitle}>APS Calculator</h2>
          </div>
          <p className={styles.muted}>Plug in your existing APS inputs here.</p>
        </section>

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
                  onMarkApplied={() => handleMarkApplied(a.id)}
                />
              ))}
            </ul>
          )}
        </section>

        {/* Deadlines: hide submitted */}
        <section className={styles.card}>
          <div className={styles.cardHead}>
            <h2 className={styles.cardTitle}>Upcoming Deadlines</h2>
          </div>
          <ul className={styles.deadlines}>
            {apps
              .filter((a) => a.status !== "submitted")
              .map((a) => ({
                id: a.id,
                name: a.program?.name ?? "Programme",
                when: a.deadline ?? a.program?.application_close ?? null,
              }))
              .filter((x) => x.when)
              .sort((a, b) => (a.when! < b.when! ? -1 : 1))
              .slice(0, 5)
              .map((d) => (
                <li key={d.id} className={styles.deadlineItem}>
                  <span className={styles.dot} />
                  <div>
                    <div className={styles.deadlineName}>{d.name}</div>
                    <div className={styles.deadlineDate}>
                      {new Date(d.when!).toLocaleDateString()}
                    </div>
                  </div>
                </li>
              ))}
          </ul>
        </section>
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
