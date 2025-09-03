import React, { useEffect, useMemo, useState } from "react";
import styles from "./AddApplicationModal.module.css";
import {
  getRecommendations,
  getUniversities,
  type ProgramRecommendation,
} from "../../services/api";
import { useUser } from "../../Users/UserContext";

type ProgramLike = {
  id: number;
  name: string;
  aps_requirement: number | null;
  application_close: string | null;
  university_tag: string;
  website: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onAdd: (p: {
    id: number;
    name: string;
    aps_requirement: number | null;
    application_open: string | null;
    application_close: string | null;
    universities: {
      id?: number;
      name: string;
      abbreviation?: string | null;
      website?: string | null;
    } | null;
  }) => void;
  existingProgramIds: Set<number>;
  busyProgramId: number | null;
};

// Build chips from checks
function buildRequirementChips(rec: ProgramRecommendation): string[] {
  return (rec.checks || []).map((c) =>
    c.need ? `${c.tag} ≥ ${c.need}` : c.tag
  );
}

// Is the programme already closed?
function isClosed(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false; // if unknown, assume not closed
  const close = new Date(dateStr);
  const now = new Date();
  // consider it closed if its date is strictly before today (at end of day)
  return close.getTime() < now.getTime();
}

// For sorting: open first; for open, sort soonest closing date first; for closed, sort by most recent close first
function compareRecommendations(
  a: ProgramRecommendation,
  b: ProgramRecommendation
) {
  const pa = a.program as ProgramLike;
  const pb = b.program as ProgramLike;

  const aClosed = isClosed(pa.application_close);
  const bClosed = isClosed(pb.application_close);

  if (aClosed !== bClosed) return aClosed ? 1 : -1; // open first

  // Both open or both closed: sort by closing date ascending (nulls last)
  const aTime = pa.application_close
    ? new Date(pa.application_close).getTime()
    : Number.POSITIVE_INFINITY;
  const bTime = pb.application_close
    ? new Date(pb.application_close).getTime()
    : Number.POSITIVE_INFINITY;

  if (aTime !== bTime) return aTime - bTime;

  // Tie-breaker: name
  return pa.name.localeCompare(pb.name);
}

export default function AddApplicationModal({
  open,
  onClose,
  onAdd,
  existingProgramIds,
  busyProgramId,
}: Props) {
  const { user } = useUser();
  const userId = user?.id ?? null;

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [recs, setRecs] = useState<ProgramRecommendation[]>([]);

  // Load WITS by default, then recommendations
  useEffect(() => {
    if (!open || !userId) return;
    (async () => {
      try {
        setLoading(true);
        const list = await getUniversities();
        const wits =
          list.find((u) =>
            (u.abbreviation ?? "").toUpperCase().includes("WITS")
          ) ||
          list.find((u) => /Witwatersrand/i.test(u.name ?? "")) ||
          list[0];
        if (wits?.id) {
          const data = await getRecommendations(userId, wits.id);
          setRecs(data);
        } else {
          setRecs([]);
        }
      } catch (e) {
        console.error(e);
        setRecs([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, userId]);

  // Reset when closed
  useEffect(() => {
    if (!open) {
      setSearch("");
      setRecs([]);
      setLoading(false);
    }
  }, [open]);

  // Client-side search + sorting (open first, closed bottom)
  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? recs.filter((r) => r.program.name.toLowerCase().includes(q))
      : recs.slice();
    return filtered.sort(compareRecommendations);
  }, [recs, search]);

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
            title="Close"
          >
            ✕
          </button>
        </div>

        <div className={styles.searchRow}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
        ) : list.length === 0 ? (
          <div className={styles.empty}>
            <p>No programmes match your saved APS for this university.</p>
          </div>
        ) : (
          <ul className={styles.gridCompact}>
            {list.map((r) => {
              const p = r.program as ProgramLike;
              const disabled =
                existingProgramIds.has(p.id) || busyProgramId === p.id;
              const closed = isClosed(p.application_close);
              const chips = buildRequirementChips(r);

              return (
                <li key={p.id} className={styles.cardCompact}>
                  <div className={styles.rowTop}>
                    <div className={styles.uniRow}>
                      <span className={styles.uniBadgeSmall}>
                        {p.university_tag}
                      </span>
                      <span className={styles.name}>{p.name}</span>
                    </div>
                    <div className={styles.metaInline}>
                      <span className={styles.metaItem}>
                        <strong>APS:</strong> {p.aps_requirement ?? "—"}
                      </span>
                      <span className={styles.metaItem}>
                        <strong>Closes:</strong>{" "}
                        {p.application_close
                          ? new Date(p.application_close).toLocaleDateString()
                          : "—"}
                      </span>
                    </div>
                  </div>

                  {chips.length > 0 && (
                    <div className={styles.reqChipsTight}>
                      {chips.map((c, i) => (
                        <span key={i} className={styles.reqChipTight}>
                          {c}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className={styles.actionsRight}>
                    {existingProgramIds.has(p.id) ? (
                      <span className={styles.already}>Already added</span>
                    ) : closed ? (
                      <span className={styles.closedPill} aria-disabled="true">
                        Closed
                      </span>
                    ) : (
                      <button
                        className={styles.primaryBtnSmall}
                        disabled={disabled}
                        onClick={() =>
                          onAdd({
                            id: p.id,
                            name: p.name,
                            aps_requirement: p.aps_requirement,
                            application_open: null,
                            application_close: p.application_close,
                            universities: {
                              name: p.university_tag,
                              abbreviation: p.university_tag,
                              website: p.website ?? undefined,
                            },
                          })
                        }
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
