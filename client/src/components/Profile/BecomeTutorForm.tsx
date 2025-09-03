import { useState } from "react";
import styles from "./ProfileForm.module.css";

export default function BecomeTutorForm({ onSubmit, onCancel }: any) {
  const [formData, setFormData] = useState({
    subjects: "",
    bio: "",
    rate: "",
    availability: "",
    gradeLevels: "",
  });

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    // Validation: make sure all required tutor fields are filled
    if (
      !formData.subjects ||
      !formData.bio ||
      !formData.rate ||
      !formData.availability ||
      !formData.gradeLevels
    ) {
      alert("All fields are required!");
      return;
    }

    // Clean up subjects & grade levels into arrays
    const tutorData = {
      subjects: formData.subjects
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s !== ""), // ✅ array of subjects
      bio: formData.bio,
      rate_per_hour: parseFloat(formData.rate),
      availability: formData.availability,
      gradeLevels: formData.gradeLevels
        .split(",")
        .map((g) => g.trim())
        .filter((g) => g !== ""), // ✅ array of grade/year levels
    };

    onSubmit(tutorData);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.formCard}>
        <h2>Become a Tutor</h2>
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
            name="gradeLevels"
            value={formData.gradeLevels}
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
  );
}
