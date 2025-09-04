import { useState } from "react";
import styles from "./ProfileForm.module.css";

export default function BecomeTutorForm({ onSubmit, onCancel }: any) {
  const [formData, setFormData] = useState({
    subjects: "",
    bio: "",
    rate: "",
    availability: "",
    grade_levels: "", // ✅ use snake_case directly
  });

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (
      !formData.subjects ||
      !formData.bio ||
      !formData.rate ||
      !formData.availability ||
      !formData.grade_levels
    ) {
      alert("All fields are required!");
      return;
    }

    const tutorData = {
      subjects: formData.subjects
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s !== ""),
      bio: formData.bio,
      rate_per_hour: parseFloat(formData.rate),
      availability: formData.availability,
      grade_levels: formData.grade_levels
        .split(",")
        .map((g) => g.trim())
        .filter((g) => g !== ""),
    };

    onSubmit(tutorData);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.formCard}>
        <h2>Become a Tutor</h2>

        <div className={styles.formBody}>
          <form onSubmit={handleSubmit}>
            <label>Subjects (comma separated)</label>
            <input
              name="subjects"
              value={formData.subjects}
              onChange={handleChange}
              required
            />

            <label>Tutor Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              required
            />

            <label>Rate per Hour</label>
            <input
              name="rate"
              type="number"
              value={formData.rate}
              onChange={handleChange}
              required
            />

            <label>Availability</label>
            <input
              name="availability"
              value={formData.availability}
              onChange={handleChange}
              required
            />

            <label>Grade/Year Levels Taught (comma separated)</label>
            <input
              name="grade_levels" // ✅ matches backend
              value={formData.grade_levels}
              onChange={handleChange}
              required
            />

            <div className={styles.actions}>
              <button type="submit">Submit</button>
              <button type="button" onClick={onCancel}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
