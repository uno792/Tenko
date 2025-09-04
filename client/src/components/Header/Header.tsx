import React, { useEffect, useState } from "react";
import styles from "./Header.module.css";
import logo from "../../assets/logo.png";
import { Link } from "react-router-dom";
import { useUser } from "../../Users/UserContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const Header: React.FC = () => {
  const { user } = useUser();
  const userId = user?.id;

  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/profile/${userId}`);
        if (!res.ok) throw new Error("Failed to fetch profile");
        const data = await res.json();
        setProfile(data);
      } catch (err) {
        console.error("❌ Failed to fetch profile in Header:", err);
      }
    })();
  }, [userId]);

  const getInitials = () => {
    if (!profile?.username) return "?";
    const parts = profile.username.split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <img src={logo} alt="Tenko Logo" className={styles.logo} />
      </div>
      <div className={styles.right}>
        <Link to="/profile">
          {profile ? (
            profile.profilepic ? (
              <img
                src={`data:image/png;base64,${profile.profilepic}`}
                alt="Profile"
                className={styles.avatar}
              />
            ) : (
              <div className={styles.avatarFallback}>{getInitials()}</div>
            )
          ) : null}
        </Link>
      </div>
    </header>
  );
};

export default Header;
