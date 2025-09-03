import { useState } from "react";
import UploadModal from "./UploadModal";
import GeneratePastPaperModal from "./GeneratePastPaperModal";
import styles from "./NotesHeader.module.css";
import { baseURL } from "../../config";
export default function NotesHeader() {
  const [isUploadOpen, setUploadOpen] = useState(false);
  const [isGenerateOpen, setGenerateOpen] = useState(false);

  // ✅ Actually send uploads to backend
  const handleUpload = async (formData: FormData) => {
    try {
      const res = await fetch(`${baseURL}/resources/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Upload failed: ${res.statusText}`);
      }

      const data = await res.json();
      console.log("✅ Upload successful:", data);

      // Close modal after success
      setUploadOpen(false);

      // Refresh resources (basic way for now)
      window.location.reload();
    } catch (err) {
      console.error("❌ Upload error:", err);
      alert("Failed to upload resource. Please try again.");
    }
  };

  const handleGenerate = (selected: any, difficulty: string) => {
    console.log(
      "Generating Past Paper with:",
      selected,
      "Difficulty:",
      difficulty
    );
    // TODO: hook up Gemini API here later
  };

  return (
    <div className={styles.header}>
      <div>
        <h1 className={styles.title}>Notes & Papers</h1>
        <p className={styles.subtitle}>Share and access study materials</p>
      </div>
      <div className={styles.actions}>
        <button
          className={styles.uploadBtn}
          onClick={() => setUploadOpen(true)}
        >
          ⬆ Upload Notes
        </button>
        <button
          className={styles.generateBtn}
          onClick={() => setGenerateOpen(true)}
        >
          🧩 Generate Past Paper
        </button>
      </div>

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setUploadOpen(false)}
        onSubmit={handleUpload}
      />

      <GeneratePastPaperModal
        isOpen={isGenerateOpen}
        onClose={() => setGenerateOpen(false)}
        resources={[
          {
            id: 1,
            title: "Mathematics Final Exam 2023",
            subject: "Mathematics",
            grade: "Grade 12",
            institution: "University of Cape Town",
            description: "Covers calculus, algebra, and statistics",
            type: "Past Paper",
          },
          {
            id: 2,
            title: "Physics Midterm 2023",
            subject: "Physics",
            grade: "Grade 12",
            institution: "Stellenbosch University",
            description: "Mechanics, thermodynamics, electromagnetism",
            type: "Exam Paper",
          },
        ]}
        onGenerate={handleGenerate}
      />
    </div>
  );
}

/*import { useState } from "react";
import UploadModal from "./UploadModal";
import GeneratePastPaperModal from "./GeneratePastPaperModal";
import styles from "./NotesHeader.module.css";

export default function NotesHeader() {
  const [isUploadOpen, setUploadOpen] = useState(false);
  const [isGenerateOpen, setGenerateOpen] = useState(false);

  const handleUpload = (formData: FormData) => {
    console.log("Uploading:", Object.fromEntries(formData.entries()));
  };

  const handleGenerate = (selected: any, difficulty: string) => {
    console.log("Generating Past Paper with:", selected, "Difficulty:", difficulty);
    // later: call Gemini API here
  };

  return (
    <div className={styles.header}>
      <div>
        <h1 className={styles.title}>Notes & Papers</h1>
        <p className={styles.subtitle}>Share and access study materials</p>
      </div>
      <div className={styles.actions}>
        <button className={styles.uploadBtn} onClick={() => setUploadOpen(true)}>
          ⬆ Upload Notes
        </button>
        <button className={styles.generateBtn} onClick={() => setGenerateOpen(true)}>
          🧩 Generate Past Paper
        </button>
      </div>

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setUploadOpen(false)}
        onSubmit={handleUpload}
      />

      <GeneratePastPaperModal
        isOpen={isGenerateOpen}
        onClose={() => setGenerateOpen(false)}
        resources={[
          {
            id: 1,
            title: "Mathematics Final Exam 2023",
            subject: "Mathematics",
            grade: "Grade 12",
            institution: "University of Cape Town",
            description: "Covers calculus, algebra, and statistics",
            type: "Past Paper",
          },
          {
            id: 2,
            title: "Physics Midterm 2023",
            subject: "Physics",
            grade: "Grade 12",
            institution: "Stellenbosch University",
            description: "Mechanics, thermodynamics, electromagnetism",
            type: "Exam Paper",
          },
        ]}
        onGenerate={handleGenerate}
      />
    </div>
  );
}*/
