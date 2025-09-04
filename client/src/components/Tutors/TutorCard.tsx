import styles from "../../pages/tutorMarketplace.module.css";

interface TutorCardProps {
  tutor: {
    id: number;
    subjects: string[];
    bio: string;
    rate_per_hour: number;
    grade_levels: string[];
    avg_rating?: number;
    users?: {
      username: string;
      email: string;
      phone: string;
      institution?: string;
      grade_year?: string;
      profilepic?: string; // ✅ added profilepic
    };
  };
  onViewProfile: (tutor: any) => void;
}

export default function TutorCard({ tutor, onViewProfile }: TutorCardProps) {
  const initials =
    tutor.users?.username
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "?";

  return (
    <div className={styles.card}>
      <div className={styles.avatar}>
        {tutor.users?.profilepic ? (
          <img
            src={`data:image/png;base64,${tutor.users.profilepic}`}
            alt={tutor.users?.username || "Tutor"}
          />
        ) : (
          initials
        )}
      </div>

      <div className={styles.cardContent}>
        <h3 className={styles.cardName}>
          {tutor.users?.username} <span className={styles.verified}>✔</span>
        </h3>
        <p className={styles.cardMeta}>
          {tutor.subjects?.join(", ")} • {tutor.grade_levels?.join(", ")}
        </p>
        <p className={styles.cardRating}>
          ⭐ {tutor.avg_rating || "No rating"}
        </p>
        <p className={styles.cardContact}>
          {tutor.users?.email} • {tutor.users?.phone}
        </p>
        <p className={styles.cardRate}>R {tutor.rate_per_hour}/hour</p>
        <p className={styles.cardBio}>{tutor.bio}</p>

        <button
          className={styles.viewButton}
          onClick={() => onViewProfile(tutor)}
        >
          View Profile
        </button>
      </div>
    </div>
  );
}
