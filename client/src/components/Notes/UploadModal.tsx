import { useState } from "react";
import styles from "./UploadModal.module.css";
import { useUser } from "../../Users/UserContext"; // 👈 get logged-in user

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
}

export default function UploadModal({
  isOpen,
  onClose,
  onSubmit,
}: UploadModalProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Notes");
  const [subject, setSubject] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [institution, setInstitution] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const { user } = useUser(); // 👈 from context
  const currentUserId = user?.id; // will be Supabase UUID

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !currentUserId) {
      alert("You must be logged in and select a file to upload.");
      return;
    }

    const data = new FormData();
    data.append("user_id", currentUserId); // 👈 real Supabase user id
    data.append("title", title);
    data.append("type", type);
    data.append("subject", subject);
    data.append("grade_level", gradeLevel);
    data.append("institution", institution);
    data.append("description", description);
    data.append("file", file);

    onSubmit(data);
    onClose();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2>⬆ Upload Study Resource</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label>Title *</label>
              <input
                type="text"
                placeholder="e.g. Mathematics Grade 12 – Calculus Notes"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className={styles.field}>
              <label>Resource Type *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                required
              >
                <option>Notes</option>
                <option>Past Paper</option>
                <option>Exam Paper</option>
              </select>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label>Subject / Course *</label>
              <input
                type="text"
                placeholder="e.g. Mathematics, Physics, Chemistry"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>
            <div className={styles.field}>
              <label>Grade Level *</label>
              <input
                type="text"
                placeholder="e.g. Grade 12, First Year, Honors"
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.field}>
            <label>School / Institution</label>
            <input
              type="text"
              placeholder="e.g. University of Cape Town, Rondebosch High School"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label>Description</label>
            <textarea
              placeholder="Brief summary of what this resource covers..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label>Upload File *</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx"
              onChange={(e) =>
                setFile(e.target.files ? e.target.files[0] : null)
              }
              required
            />
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancel} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.upload}>
              Upload Resource
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/*import { useState } from "react";
import styles from "./UploadModal.module.css";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
}

export default function UploadModal({ isOpen, onClose, onSubmit }: UploadModalProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Notes");
  const [subject, setSubject] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [school, setSchool] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const data = new FormData();
    data.append("title", title);
    data.append("type", type);
    data.append("subject", subject);
    data.append("gradeLevel", gradeLevel);
    data.append("school", school);
    data.append("description", description);
    data.append("file", file);

    onSubmit(data);
    onClose();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2>⬆ Upload Study Resource</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label>Title *</label>
              <input
                type="text"
                placeholder="e.g. Mathematics Grade 12 – Calculus Notes"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className={styles.field}>
              <label>Resource Type *</label>
              <select value={type} onChange={(e) => setType(e.target.value)} required>
                <option>Notes</option>
                <option>Past Paper</option>
                <option>Exam Paper</option>
              </select>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label>Subject / Course *</label>
              <input
                type="text"
                placeholder="e.g. Mathematics, Physics, Chemistry"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>
            <div className={styles.field}>
              <label>Grade Level *</label>
              <input
                type="text"
                placeholder="e.g. Grade 12, First Year, Honors"
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                required
              />
            </div>
          </div>

          <div className={styles.field}>
            <label>School / Institution</label>
            <input
              type="text"
              placeholder="e.g. University of Cape Town, Rondebosch High School"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label>Description</label>
            <textarea
              placeholder="Brief summary of what this resource covers..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label>Upload File *</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx"
              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
              required
            />
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancel} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.upload}>
              Upload Resource
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}*/
