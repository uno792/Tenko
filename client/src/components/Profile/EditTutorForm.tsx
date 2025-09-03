import { useState } from "react";
import styles from "./ProfileForm.module.css";

interface Tutor {
  subjects: string[];
  bio: string;
  rate_per_hour: number;
  availability: string;
  grade_levels: string[];
}

interface EditTutorFormProps {
  tutor: Tutor;
  onSubmit: (data: Partial<Tutor>) => void;
  onCancel: () => void;
}

export default function EditTutorForm({
  tutor,
  onSubmit,
  onCancel,
}: EditTutorFormProps) {
  const [formData, setFormData] = useState({
    subjects: tutor.subjects?.join(", ") || "",
    bio: tutor.bio || "",
    rate: tutor.rate_per_hour?.toString() || "",
    availability: tutor.availability || "",
    gradeLevels: tutor.grade_levels?.join(", ") || "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const subjects =
      formData.subjects.trim() !== ""
        ? formData.subjects.split(",").map((s: string) => s.trim())
        : tutor.subjects;

    const bio = formData.bio.trim() !== "" ? formData.bio : tutor.bio;

    const rate =
      formData.rate.trim() !== ""
        ? parseFloat(formData.rate)
        : tutor.rate_per_hour;

    const availability =
      formData.availability.trim() !== ""
        ? formData.availability
        : tutor.availability;

    const gradeLevels =
      formData.gradeLevels.trim() !== ""
        ? formData.gradeLevels.split(",").map((g: string) => g.trim())
        : tutor.grade_levels;

    const tutorData: Partial<Tutor> = {
      subjects,
      bio,
      rate_per_hour: rate,
      availability,
      grade_levels: gradeLevels,
    };

    onSubmit(tutorData);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.formCard}>
        <h2>Edit Tutor Details</h2>
        <form onSubmit={handleSubmit}>
          <label>Subjects (comma separated)</label>
          <input
            name="subjects"
            value={formData.subjects}
            onChange={handleChange}
            type="text"
          />

          <label>Tutor Bio</label>
          <textarea name="bio" value={formData.bio} onChange={handleChange} />

          <label>Rate per Hour</label>
          <input
            name="rate"
            type="number"
            value={formData.rate}
            onChange={handleChange}
          />

          <label>Availability</label>
          <input
            name="availability"
            value={formData.availability}
            onChange={handleChange}
            type="text"
          />

          <label>Grade/Year Levels Taught (comma separated)</label>
          <input
            name="gradeLevels"
            value={formData.gradeLevels}
            onChange={handleChange}
            type="text"
          />

          <div className={styles.actions}>
            <button type="submit">Save Changes</button>
            <button type="button" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
