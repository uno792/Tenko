import React, { useEffect, useMemo, useState } from "react";
import styles from "./ApsCalculator.module.css";
import { getUniversities } from "../../services/api";
import type { Uni } from "../../services/api";

/** Wits APS bands */
const BANDS = [
  { key: "90-100", label: "90–100%", other: 8, engMath: 10, lo: 4 },
  { key: "80-89", label: "80–89%", other: 7, engMath: 9, lo: 3 },
  { key: "70-79", label: "70–79%", other: 6, engMath: 8, lo: 2 },
  { key: "60-69", label: "60–69%", other: 5, engMath: 7, lo: 1 },
  { key: "50-59", label: "50–59%", other: 4, engMath: 4, lo: 0 },
  { key: "40-49", label: "40–49%", other: 3, engMath: 3, lo: 0 },
  { key: "30-39", label: "30–39%", other: 0, engMath: 0, lo: 0 },
  { key: "0-29", label: "0–29%", other: 0, engMath: 0, lo: 0 },
] as const;

type BandKey = (typeof BANDS)[number]["key"];

type SubjectRow =
  | { id: string; kind: "english"; name: string; band: BandKey } // ← “Home Language” (Wits English HL/FAL rule)
  | { id: string; kind: "maths"; name: string; band: BandKey }
  | { id: string; kind: "lo"; name: string; band: BandKey }
  | { id: string; kind: "other"; name: string; band: BandKey };

function bandPoints(kind: SubjectRow["kind"], band: BandKey) {
  const b = BANDS.find((x) => x.key === band)!;
  if (kind === "english" || kind === "maths") return b.engMath; // +2 rule baked in
  if (kind === "lo") return b.lo; // LO capped
  return b.other;
}

// Default rows (renamed to your spec)
const DEFAULT_ROWS: SubjectRow[] = [
  { id: "home", kind: "english", name: "Home Language", band: "70-79" },
  {
    id: "maths",
    kind: "maths",
    name: "Mathematics / Maths Lit",
    band: "70-79",
  },
  { id: "sci", kind: "other", name: "Physical Sciences", band: "60-69" },
  { id: "life", kind: "other", name: "Life Sciences", band: "60-69" },
  { id: "addlang", kind: "other", name: "Additional Language", band: "50-59" },
  { id: "geo", kind: "other", name: "Geography", band: "60-69" },
  { id: "lo", kind: "lo", name: "Life Orientation", band: "60-69" },
];

export default function ApsCalculator() {
  const [universities, setUniversities] = useState<Uni[]>([]);
  const [uniId, setUniId] = useState<number | null>(null);
  const [rows, setRows] = useState<SubjectRow[]>(DEFAULT_ROWS);
  const [hasNonEnglishHL, setHasNonEnglishHL] = useState(false);

  // Load universities and preselect WITS; show only abbreviation everywhere
  useEffect(() => {
    (async () => {
      try {
        const list = await getUniversities();
        setUniversities(list);
        const wits = list.find(
          (u) =>
            (u.abbreviation ?? "").toUpperCase().includes("WITS") ||
            /Witwatersrand/i.test(u.name ?? "")
        );
        setUniId(wits?.id ?? list[0]?.id ?? null);
      } catch {
        setUniversities([]);
        setUniId(null);
      }
    })();
  }, []);

  // Optional toggle: adds a separate “Home Language (non-English)” row as an “other” subject
  useEffect(() => {
    setRows((prev) => {
      const exists = prev.some((r) => r.id === "home-non-en");
      if (hasNonEnglishHL && !exists) {
        const idx = Math.max(
          0,
          prev.findIndex((r) => r.id === "lo")
        );
        const copy = prev.slice();
        copy.splice(idx, 0, {
          id: "home-non-en",
          kind: "other",
          name: "Home Language (non-English)",
          band: "60-69",
        });
        return copy;
      } else if (!hasNonEnglishHL && exists) {
        return prev.filter((r) => r.id !== "home-non-en");
      }
      return prev;
    });
  }, [hasNonEnglishHL]);

  const total = useMemo(
    () => rows.reduce((sum, r) => sum + bandPoints(r.kind, r.band), 0),
    [rows]
  );

  const updateRow = (id: string, band: BandKey) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, band } : r)));

  // Render: headless (no internal card/border/title) so it doesn’t double-wrap
  return (
    <div className={styles.wrap}>
      <div className={styles.topRow}>
        <div className={styles.bigScoreBlock}>
          <div className={styles.bigScore}>{total}</div>
          <div className={styles.scoreLabel}>Your Current APS Score</div>
        </div>

        <div className={styles.uniPicker}>
          <label className={styles.uniLabel}>University</label>
          <select
            className={styles.uniSelect}
            value={uniId ?? ""}
            onChange={(e) => setUniId(Number(e.target.value))}
            title="Select university"
          >
            {universities.map((u) => {
              const tag = (u.abbreviation && u.abbreviation.trim()) || u.name;
              return (
                <option
                  key={u.id ?? tag}
                  value={u.id ?? ""}
                  title={u.name} // full name on hover
                >
                  {tag}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      <div className={styles.toggleRow}>
        <label className={styles.toggleLabel}>
          <input
            type="checkbox"
            checked={hasNonEnglishHL}
            onChange={(e) => setHasNonEnglishHL(e.target.checked)}
          />
          My Home Language isn’t English
        </label>
      </div>

      <ul className={styles.grid}>
        {rows.map((r) => (
          <li key={r.id} className={styles.row}>
            <div className={styles.subject}>{r.name}</div>
            <select
              className={styles.bandSelect}
              value={r.band}
              onChange={(e) => updateRow(r.id, e.target.value as BandKey)}
            >
              {BANDS.map((b) => (
                <option key={b.key} value={b.key}>
                  {b.label}
                </option>
              ))}
            </select>
            <div className={styles.points}>{bandPoints(r.kind, r.band)}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
