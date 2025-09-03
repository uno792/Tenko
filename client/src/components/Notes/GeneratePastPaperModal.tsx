import { useState } from "react";
import styles from "./GeneratePastPaperModal.module.css";

interface Resource {
  id: number;
  title: string;
  subject: string;
  grade: string;
  institution: string;
  description: string;
  type: string;
}

interface GeneratePastPaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  resources: Resource[];
  onGenerate: (selected: Resource[], difficulty: string) => void;
}

export default function GeneratePastPaperModal({
  isOpen,
  onClose,
  resources,
  onGenerate,
}: GeneratePastPaperModalProps) {
  const [search, setSearch] = useState("");
  const [institution, setInstitution] = useState("");
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [difficulty, setDifficulty] = useState("Mixed");
  const [selected, setSelected] = useState<number[]>([]);

  if (!isOpen) return null;

  const toggleSelect = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const handleGenerate = () => {
    const selectedResources = resources.filter((r) => selected.includes(r.id));
    onGenerate(selectedResources, difficulty);
    onClose();
  };

  const filteredResources = resources.filter((r) => {
    return (
      (search === "" ||
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.subject.toLowerCase().includes(search.toLowerCase())) &&
      (institution === "" || r.institution === institution) &&
      (subject === "" || r.subject === subject) &&
      (grade === "" || r.grade === grade)
    );
  });

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2>🧩 Generate Custom Past Paper</h2>

        {/* Search and Filters */}
        <div className={styles.filters}>
          <input
            type="text"
            placeholder="Search past papers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={institution} onChange={(e) => setInstitution(e.target.value)}>
            <option value="">All institutions</option>
            <option>University of Cape Town</option>
            <option>Stellenbosch University</option>
            <option>University of the Witwatersrand</option>
          </select>
          <select value={subject} onChange={(e) => setSubject(e.target.value)}>
            <option value="">All subjects</option>
            <option>Mathematics</option>
            <option>Physics</option>
            <option>Chemistry</option>
          </select>
          <select value={grade} onChange={(e) => setGrade(e.target.value)}>
            <option value="">All grades</option>
            <option>Grade 11</option>
            <option>Grade 12</option>
            <option>First Year</option>
          </select>
          <button
            className={styles.clearBtn}
            onClick={() => {
              setInstitution("");
              setSubject("");
              setGrade("");
            }}
          >
            Clear Filters
          </button>
        </div>

        {/* Resource List */}
        <div className={styles.resourceList}>
          {filteredResources.map((r) => (
            <div
              key={r.id}
              className={`${styles.resourceCard} ${
                selected.includes(r.id) ? styles.selected : ""
              }`}
              onClick={() => toggleSelect(r.id)}
            >
              <h4>
                {r.title} <span className={styles.tag}>{r.type}</span>
              </h4>
              <p className={styles.meta}>
                {r.subject} • {r.grade} • {r.institution}
              </p>
              <p className={styles.desc}>{r.description}</p>
            </div>
          ))}
        </div>

        {/* Difficulty + Actions */}
        <div className={styles.footer}>
          <div className={styles.difficulty}>
            <label>Difficulty Level:</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
              <option>Mixed</option>
            </select>
          </div>
          <div className={styles.actions}>
            <button className={styles.cancel} onClick={onClose}>
              Cancel
            </button>
            <button className={styles.generate} onClick={handleGenerate}>
              Generate Past Paper
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
