import React, { useEffect, useMemo, useState } from "react";
import styles from "./ApsCalculatorV2.module.css";
import {
  getUniversities,
  listSubjects,
  loadApsProfile,
  saveApsProfile,
  type Uni,
  type SubjectLite,
  type ApsBandKey,
  type ApsProfileRow,
  type MathsStream,
} from "../../services/api";
import { useUser } from "../../Users/UserContext";

const BANDS: {
  key: ApsBandKey;
  label: string;
  other: number;
  engMath: number;
  lo: number;
}[] = [
  { key: "90-100", label: "90–100%", other: 8, engMath: 10, lo: 4 },
  { key: "80-89", label: "80–89%", other: 7, engMath: 9, lo: 3 },
  { key: "70-79", label: "70–79%", other: 6, engMath: 8, lo: 2 },
  { key: "60-69", label: "60–69%", other: 5, engMath: 7, lo: 1 },
  { key: "50-59", label: "50–59%", other: 4, engMath: 4, lo: 0 },
  { key: "40-49", label: "40–49%", other: 3, engMath: 3, lo: 0 },
  { key: "30-39", label: "30–39%", other: 0, engMath: 0, lo: 0 },
  { key: "0-29", label: "0–29%", other: 0, engMath: 0, lo: 0 },
];

function pts(
  kind:
    | "home_language"
    | "mathematics"
    | "life_orientation"
    | "additional_language"
    | "other",
  band: ApsBandKey
) {
  const b = BANDS.find((x) => x.key === band)!;
  if (kind === "life_orientation") return b.lo;
  if (kind === "home_language" || kind === "mathematics") return b.engMath;
  return b.other;
}

type OtherRow = {
  position: number;
  subject_id: number | null;
  band_key: ApsBandKey;
};

export default function ApsCalculatorV2() {
  const { user } = useUser();
  const userId = user?.id ?? null;

  const [universities, setUniversities] = useState<Uni[]>([]);
  const [uniId, setUniId] = useState<number | null>(null);
  const [subjects, setSubjects] = useState<SubjectLite[]>([]);

  // fixed rows
  const [hlBand, setHlBand] = useState<ApsBandKey>("70-79");
  const [mathBand, setMathBand] = useState<ApsBandKey>("70-79");
  const [mathStream, setMathStream] = useState<MathsStream>("mathematics");
  const [loBand, setLoBand] = useState<ApsBandKey>("60-69");
  const [alBand, setAlBand] = useState<ApsBandKey>("50-59");

  // up to 3 others
  const [others, setOthers] = useState<OtherRow[]>([
    { position: 1, subject_id: null, band_key: "60-69" },
  ]);

  // save UI state
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const total = useMemo(() => {
    let t = 0;
    t += pts("home_language", hlBand);
    t += pts("mathematics", mathBand);
    t += pts("life_orientation", loBand);
    t += pts("additional_language", alBand);
    for (const o of others) t += pts("other", o.band_key);
    return t;
  }, [hlBand, mathBand, loBand, alBand, others]);

  // universities, WITS default
  useEffect(() => {
    (async () => {
      const list = await getUniversities();
      setUniversities(list);
      const wits = list.find(
        (u) =>
          (u.abbreviation ?? "").toUpperCase().includes("WITS") ||
          /Witwatersrand/i.test(u.name ?? "")
      );
      setUniId(wits?.id ?? list[0]?.id ?? null);
    })().catch(console.error);
  }, []);

  // subjects for dropdowns
  useEffect(() => {
    listSubjects().then(setSubjects).catch(console.error);
  }, []);

  // load saved profile
  useEffect(() => {
    if (!userId || !uniId) return;
    (async () => {
      const { profile, subjects: rows } = await loadApsProfile(userId, uniId);
      if (!profile) return;
      const hl = rows.find((r) => r.kind === "home_language");
      const m = rows.find((r) => r.kind === "mathematics");
      const lo = rows.find((r) => r.kind === "life_orientation");
      const al = rows.find((r) => r.kind === "additional_language");
      const otherRows = rows
        .filter((r) => r.kind === "other")
        .sort((a, b) => a.position - b.position);
      if (hl) setHlBand(hl.band_key);
      if (m) {
        setMathBand(m.band_key);
        setMathStream((m.maths_stream ?? "mathematics") as MathsStream);
      }
      if (lo) setLoBand(lo.band_key);
      if (al) setAlBand(al.band_key);
      if (otherRows.length) {
        setOthers(
          otherRows.map((r) => ({
            position: r.position,
            subject_id: r.subject_id ?? null,
            band_key: r.band_key,
          }))
        );
      }
    })().catch(console.error);
  }, [userId, uniId]);

  const addOther = () => {
    if (others.length >= 3) return;
    const nextPos =
      (others
        .map((o) => o.position)
        .sort((a, b) => a - b)
        .pop() ?? 0) + 1;
    setOthers((prev) => [
      ...prev,
      { position: nextPos, subject_id: null, band_key: "60-69" },
    ]);
  };

  const updateOther = (pos: number, patch: Partial<OtherRow>) => {
    setOthers((prev) =>
      prev.map((o) => (o.position === pos ? { ...o, ...patch } : o))
    );
  };

  const onSave = async () => {
    if (!userId || !uniId) return;
    setSaving(true);
    setSaved(false);

    const rows: ApsProfileRow[] = [
      {
        kind: "home_language",
        band_key: hlBand,
        aps_points: pts("home_language", hlBand),
        position: 0,
      },
      {
        kind: "mathematics",
        band_key: mathBand,
        aps_points: pts("mathematics", mathBand),
        position: 0,
        maths_stream: mathStream,
      },
      {
        kind: "life_orientation",
        band_key: loBand,
        aps_points: pts("life_orientation", loBand),
        position: 0,
      },
      {
        kind: "additional_language",
        band_key: alBand,
        aps_points: pts("additional_language", alBand),
        position: 0,
      },
      ...others.slice(0, 3).map((o) => ({
        kind: "other" as const,
        band_key: o.band_key,
        aps_points: pts("other", o.band_key),
        position: o.position,
        subject_id: o.subject_id ?? null,
      })),
    ];
    try {
      await saveApsProfile({
        user_id: userId,
        university_id: uniId,
        total_aps: total,
        rows,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (e) {
      console.error(e);
      // keep simple — you can add inline error text if you like
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.topRow}>
        <div className={styles.scoreBlock}>
          <div className={styles.bigScore}>{total}</div>
          <div className={styles.label}>Your Current APS Score</div>
        </div>
        <div className={styles.uniPick}>
          <label className={styles.uniLbl}>University</label>
          <select
            className={styles.uniSelect}
            value={uniId ?? ""}
            onChange={(e) => setUniId(Number(e.target.value))}
          >
            {universities.map((u) => {
              const tag = (u.abbreviation && u.abbreviation.trim()) || u.name;
              return (
                <option key={u.id ?? tag} value={u.id ?? ""} title={u.name}>
                  {tag}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      <ul className={styles.grid}>
        <li className={styles.row}>
          <div className={styles.subject}>Home Language</div>
          <select
            className={styles.band}
            value={hlBand}
            onChange={(e) => setHlBand(e.target.value as ApsBandKey)}
          >
            {BANDS.map((b) => (
              <option key={b.key} value={b.key}>
                {b.label}
              </option>
            ))}
          </select>
          <div className={styles.points}>{pts("home_language", hlBand)}</div>
        </li>

        <li className={styles.row}>
          <div className={styles.subject}>
            Mathematics / Maths Lit
            <div className={styles.subSwitch}>
              <label>
                <input
                  type="radio"
                  name="mathStream"
                  checked={mathStream === "mathematics"}
                  onChange={() => setMathStream("mathematics")}
                />{" "}
                Maths
              </label>
              <label>
                <input
                  type="radio"
                  name="mathStream"
                  checked={mathStream === "maths_literacy"}
                  onChange={() => setMathStream("maths_literacy")}
                />{" "}
                Maths Lit
              </label>
            </div>
          </div>
          <select
            className={styles.band}
            value={mathBand}
            onChange={(e) => setMathBand(e.target.value as ApsBandKey)}
          >
            {BANDS.map((b) => (
              <option key={b.key} value={b.key}>
                {b.label}
              </option>
            ))}
          </select>
          <div className={styles.points}>{pts("mathematics", mathBand)}</div>
        </li>

        <li className={styles.row}>
          <div className={styles.subject}>Life Orientation</div>
          <select
            className={styles.band}
            value={loBand}
            onChange={(e) => setLoBand(e.target.value as ApsBandKey)}
          >
            {BANDS.map((b) => (
              <option key={b.key} value={b.key}>
                {b.label}
              </option>
            ))}
          </select>
          <div className={styles.points}>{pts("life_orientation", loBand)}</div>
        </li>

        <li className={styles.row}>
          <div className={styles.subject}>Additional Language</div>
          <select
            className={styles.band}
            value={alBand}
            onChange={(e) => setAlBand(e.target.value as ApsBandKey)}
          >
            {BANDS.map((b) => (
              <option key={b.key} value={b.key}>
                {b.label}
              </option>
            ))}
          </select>
          <div className={styles.points}>
            {pts("additional_language", alBand)}
          </div>
        </li>

        {others.map((o) => (
          <li key={o.position} className={styles.row}>
            <div className={styles.subject}>
              <select
                className={styles.subSelect}
                value={o.subject_id ?? ""}
                onChange={(e) =>
                  updateOther(o.position, {
                    subject_id: e.target.value ? Number(e.target.value) : null,
                  })
                }
              >
                <option value="">Select subject…</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <select
              className={styles.band}
              value={o.band_key}
              onChange={(e) =>
                updateOther(o.position, {
                  band_key: e.target.value as ApsBandKey,
                })
              }
            >
              {BANDS.map((b) => (
                <option key={b.key} value={b.key}>
                  {b.label}
                </option>
              ))}
            </select>
            <div className={styles.points}>{pts("other", o.band_key)}</div>
          </li>
        ))}
      </ul>

      <div className={styles.actions}>
        {others.length < 3 && (
          <button type="button" className={styles.secondary} onClick={addOther}>
            + Add subject
          </button>
        )}
        <div className={styles.spacer} />
        <button
          type="button"
          className={styles.primary}
          onClick={onSave}
          disabled={!userId || !uniId || saving}
        >
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save"}
        </button>
      </div>
    </div>
  );
}
