import { useEffect, useState } from "react";
import styles from "./profile.module.css";
import EditProfileForm from "../components/Profile/EditProfileForm";
import BecomeTutorForm from "../components/Profile/BecomeTutorForm";
import { useUser } from "../Users/UserContext"; // ✅ import context

const API_BASE = import.meta.env.VITE_API_BASE_URL; // ✅ use env var

export default function ProfilePage() {
  const { user } = useUser(); // ✅ get logged-in user
  const userId = user?.id;

  const [isEditing, setIsEditing] = useState(false);
  const [showTutorForm, setShowTutorForm] = useState(false);
  const [isTutor, setIsTutor] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  /* ============================
     Fetch Profile (Reusable)
  ============================ */
  const fetchProfile = async () => {
    if (!userId) return;
    try {
      console.log("➡️ Fetching profile for", userId);
      const res = await fetch(`${API_BASE}/profile/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      console.log("✅ Profile data loaded:", data);
      setProfile(data);
      setIsTutor(!!data.tutor);
    } catch (err) {
      console.error("❌ Fetch profile failed:", err);
    }
  };

  // Fetch on page load and when user changes
  useEffect(() => {
    fetchProfile();
  }, [userId]);

  /* ============================
     Save Profile
  ============================ */
  const handleSaveProfile = async (updatedData: any) => {
    if (!userId) return;
    try {
      console.log("➡️ Updating profile...", updatedData);

      const res = await fetch(`${API_BASE}/profile/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      if (!res.ok) throw new Error("Failed to update profile");

      console.log("✅ Profile updated, refetching...");
      await fetchProfile();
      setIsEditing(false);
    } catch (err) {
      console.error("❌ Profile update failed:", err);
    }
  };

  /* ============================
     Become Tutor
  ============================ */
  const handleBecomeTutor = async (tutorData: any) => {
    if (!userId) return;
    try {
      console.log("➡️ Preparing tutor data...", tutorData);

      const payload = {
        user_id: userId,
        subjects: tutorData.subjects, // array
        bio: tutorData.bio,
        rate_per_hour: tutorData.rate_per_hour,
        availability: tutorData.availability,
        grade_levels: tutorData.gradeLevels, // ✅ map camelCase → snake_case
      };

      console.log("➡️ Submitting tutor payload to backend:", payload);

      const res = await fetch(`${API_BASE}/tutor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create tutor profile");

      const data = await res.json();
      console.log("✅ Tutor profile created:", data);

      await fetchProfile();
      setShowTutorForm(false);
    } catch (err) {
      console.error("❌ Tutor creation failed:", err);
    }
  };

  if (!userId) return <p>Please log in to view your profile.</p>;
  if (!profile) return <p>Loading...</p>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>My Profile</h1>
          <p className={styles.subtitle}>
            Manage your personal information and preferences
          </p>
        </div>
        <button className={styles.editButton} onClick={() => setIsEditing(true)}>
          Edit Profile
        </button>
      </div>

      {/* Personal Info */}
      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Personal Information</h2>
        <div className={styles.personalGrid}>
          <div className={styles.avatar}>
            {profile.username?.charAt(0)}
            {profile.username?.split(" ")[1]?.charAt(0)}
          </div>
          <div className={styles.info}>
            <p>
              <strong>Full Name</strong><br />{profile.username}
            </p>
            <p>
              <strong>Phone Number</strong><br />{profile.phone || "—"}
            </p>
          </div>
          <div className={styles.info}>
            <p>
              <strong>Email</strong><br />{profile.email || "—"}
            </p>
            <p>
              <strong>Bio</strong><br />{profile.bio || "—"}
            </p>
          </div>
        </div>
      </section>

      {/* Academic Info */}
      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Academic Information</h2>
        <div className={styles.academicGrid}>
          <p><strong>Institution</strong><br />{profile.institution || "—"}</p>
          <p><strong>Grade/Year</strong><br />{profile.grade_year || "—"}</p>
          <p><strong>Member Since</strong><br />{new Date(profile.created_at).toLocaleDateString()}</p>
        </div>
      </section>

      {/* Tutoring */}
      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Tutoring</h2>
        {profile.tutor ? (
          <div>
            <p><strong>Subjects:</strong> {profile.tutor.subjects?.join(", ") || "—"}</p>
            <p><strong>Rate per Hour:</strong> {profile.tutor.rate_per_hour || "—"}</p>
            <p><strong>Availability:</strong> {profile.tutor.availability || "—"}</p>
            <p><strong>Grade Levels:</strong> {profile.tutor.grade_levels?.join(", ") || "—"}</p>
          </div>
        ) : (
          <>
            <p>Share your knowledge and help other students succeed by becoming a tutor.</p>
            <button
              className={`${styles.tutorButton} ${isTutor ? styles.tutorActive : ""}`}
              onClick={() => !isTutor && setShowTutorForm(true)}
            >
              {isTutor ? "✔ Tutor" : "Become a Tutor"}
            </button>
          </>
        )}
      </section>

      {/* Popups */}
      {isEditing && (
        <EditProfileForm
          profile={profile}
          onSave={handleSaveProfile}
          onCancel={() => setIsEditing(false)}
        />
      )}

      {showTutorForm && (
        <BecomeTutorForm
          onSubmit={handleBecomeTutor}
          onCancel={() => setShowTutorForm(false)}
        />
      )}
    </div>
  );
}
