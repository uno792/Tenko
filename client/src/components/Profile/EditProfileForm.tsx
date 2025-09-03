import { useState } from "react";
import styles from "./ProfileForm.module.css";

export default function EditProfileForm({ profile, onSave, onCancel }: any) {
  // Normalize profile keys so formData always matches DB
  const [formData, setFormData] = useState({
    username: profile.username || "",
    email: profile.email || "",
    phone: profile.phone || "",
    bio: profile.bio || "",
    institution: profile.institution || "",
    grade_year: profile.grade_year || "",
  });

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    onSave(formData); // Send DB-ready keys back to ProfilePage
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.formCard}>
        <h2>Edit Profile</h2>
        <form onSubmit={handleSubmit}>
          <label>Full Name</label>
          <input
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />

          <label>Email</label>
          <input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <label>Phone Number</label>
          <input
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            required
          />

          <label>Bio</label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            required
          />

          <label>Institution</label>
          <input
            name="institution"
            value={formData.institution}
            onChange={handleChange}
            required
          />

          <label>Grade/Year</label>
          <input
            name="grade_year"
            value={formData.grade_year}
            onChange={handleChange}
            required
          />

          <div className={styles.actions}>
            <button type="submit">Save</button>
            <button type="button" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
