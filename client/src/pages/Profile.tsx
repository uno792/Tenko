import { useEffect, useState } from "react";
import styles from "./profile.module.css";
import EditProfileForm from "../components/Profile/EditProfileForm";
import BecomeTutorForm from "../components/Profile/BecomeTutorForm";
import { useUser } from "../Users/UserContext";
import { useNavigate } from "react-router-dom";
import EditTutorForm from "../components/Profile/EditTutorForm";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default function ProfilePage() {
  const { user } = useUser();
  const userId = user?.id;

  const [isEditing, setIsEditing] = useState(false);
  const [showTutorForm, setShowTutorForm] = useState(false);
  const [isTutor, setIsTutor] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const navigate = useNavigate();

  /* ============================
     Fetch Profile
  ============================ */
  const fetchProfile = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE}/profile/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      setProfile(data);
      setIsTutor(!!data.tutor);
    } catch (err) {
      console.error("❌ Fetch profile failed:", err);
    }
  };

  useEffect(() => {
    if (!userId) {
      navigate("/login", { replace: true });
    }
  }, [userId, navigate]);

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  /* ============================
     Save Profile
  ============================ */
  const handleSaveProfile = async (updatedData: any) => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE}/profile/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      if (!res.ok) throw new Error("Failed to update profile");

      await fetchProfile();
      setIsEditing(false);
    } catch (err) {
      console.error("❌ Profile update failed:", err);
    }
  };

  /* ============================
     Upload Profile Pic
  ============================ */
  const handleUploadPic = (e: any) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = (reader.result as string).split(",")[1];
      try {
        await fetch(`${API_BASE}/profile/${userId}/profilepic`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profilepic: base64String }),
        });
        await fetchProfile();
      } catch (err) {
        console.error("❌ Upload failed:", err);
      }
    };
    reader.readAsDataURL(file);
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
        <button
          className={styles.editButton}
          onClick={() => setIsEditing(true)}
        >
          Edit Profile
        </button>
      </div>

      {/* Personal Info */}
      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Personal Information</h2>
        <div className={styles.personalGrid}>
          <div className={styles.avatar}>
            {profile.profilepic ? (
              <img
                src={`data:image/png;base64,${profile.profilepic}`}
                alt="Profile"
              />
            ) : (
              <>
                {profile.username?.charAt(0)}
                {profile.username?.split(" ")[1]?.charAt(0)}
              </>
            )}
          </div>

          <div>
            <input
              type="file"
              id="profilePicUpload"
              style={{ display: "none" }}
              accept="image/*"
              onChange={handleUploadPic}
            />
            <button
              className={styles.picButton}
              onClick={() =>
                document.getElementById("profilePicUpload")?.click()
              }
            >
              Edit Profile Pic
            </button>
          </div>

          <div className={styles.info}>
            <p>
              <strong>Full Name</strong>
              <br />
              {profile.username}
            </p>
            <p>
              <strong>Phone Number</strong>
              <br />
              {profile.phone || "—"}
            </p>
          </div>
          <div className={styles.info}>
            <p>
              <strong>Email</strong>
              <br />
              {profile.email || "—"}
            </p>
            <p>
              <strong>Bio</strong>
              <br />
              {profile.bio || "—"}
            </p>
          </div>
        </div>
      </section>

      {/* Academic Info */}
      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Academic Information</h2>
        <div className={styles.academicGrid}>
          <p>
            <strong>Institution</strong>
            <br />
            {profile.institution || "—"}
          </p>
          <p>
            <strong>Grade/Year</strong>
            <br />
            {profile.grade_year || "—"}
          </p>
          <p>
            <strong>Member Since</strong>
            <br />
            {new Date(profile.created_at).toLocaleDateString()}
          </p>
        </div>
      </section>

      {/* Tutoring */}
      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Tutoring</h2>

        {profile.tutor ? (
          <>
            <div>
              <p>
                <strong>Subjects:</strong>{" "}
                {profile.tutor.subjects?.join(", ") || "—"}
              </p>
              <p>
                <strong>Rate per Hour:</strong>{" "}
                {profile.tutor.rate_per_hour || "—"}
              </p>
              <p>
                <strong>Availability:</strong>{" "}
                {profile.tutor.availability || "—"}
              </p>
              <p>
                <strong>Grade Levels:</strong>{" "}
                {profile.tutor.grade_levels?.join(", ") || "—"}
              </p>
            </div>
            <button
              className={styles.editButton}
              onClick={() => setShowTutorForm(true)}
            >
              Edit Tutor Details
            </button>
          </>
        ) : (
          <>
            <p>
              Share your knowledge and help other students succeed by becoming a
              tutor.
            </p>
            <button
              className={styles.tutorButton}
              onClick={() => setShowTutorForm(true)}
            >
              Apply to Tutor
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
        <EditTutorForm
          tutor={profile.tutor}
          onSubmit={() => {}}
          onCancel={() => setShowTutorForm(false)}
        />
      )}
    </div>
  );
}
