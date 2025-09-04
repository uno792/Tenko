import { useState } from "react";
import styles from "./ProfileForm.module.css";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

export default function EditProfileForm({ profile, onSave, onCancel }: any) {
  const [formData, setFormData] = useState({
    username: profile.username || "",
    email: profile.email || "",
    phone: profile.phone || "",
    bio: profile.bio || "",
    institution: profile.institution || "",
    grade_year: profile.grade_year || "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.formCard}>
        <h2 className={styles.formHeader}>Edit Profile</h2>

        <form onSubmit={handleSubmit}>
          <div className={styles.formBody}>
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
            <PhoneInput
              country={"za"} // default South Africa
              value={formData.phone}
              onChange={(phone) => setFormData({ ...formData, phone })}
              inputProps={{ name: "phone", required: true }}
              inputClass={styles.phoneInput}
              // Key props:
              countryCodeEditable={false} // lock the +<code> but show it (with +)
              disableDropdown={false} // allow choosing any country
              // optional niceties:
              enableAreaCodes={true}
              autoFormat={true}
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
          </div>

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
