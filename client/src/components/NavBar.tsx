import React from "react";
import { Link, useLocation } from "react-router-dom";
import styles from "./NavBar.module.css";
import {
  LayoutDashboard,
  FileText,
  Calendar,
  BookOpen,
  Users,
  MessageSquare,
  Star,
} from "lucide-react";

// ⬇️ import your user context (adjust the relative path if needed)
import { useUser } from "../Users/UserContext";

const Navbar: React.FC = () => {
  const location = useLocation();
  const { user } = useUser();
  const loggedIn = !!user?.id;

  const links = [
    { to: "/", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    {
      to: "/ai-assistant",
      label: "AI Assistant",
      icon: <MessageSquare size={18} />,
    },
    {
      to: "/applications",
      label: "University Applications",
      icon: <FileText size={18} />,
    },
    { to: "/calendar", label: "Calendar", icon: <Calendar size={18} /> },
    { to: "/notes", label: "Notes & Papers", icon: <BookOpen size={18} /> },
    { to: "/findtutor", label: "Tutors", icon: <Users size={18} /> },
    { to: "/events", label: "Events", icon: <Star size={18} /> },
    { to: "/profile", label: "My Profile", icon: <Users size={18} /> },
  ];

  return (
    <nav className={styles.navbar}>
      <ul className={styles.menu}>
        {links.map((link) => {
          const isProfile = link.to === "/profile";
          const isDisabled = !loggedIn && !isProfile;
          const isActive = location.pathname === link.to && !isDisabled;

          return (
            <li
              key={link.to}
              className={`${styles.menuItem} ${isActive ? styles.active : ""}`}
            >
              {isDisabled ? (
                // disabled: look like a link but not clickable
                <div
                  className={`${styles.link} ${styles.disabled}`}
                  aria-disabled="true"
                  title="Sign in to access"
                  role="link"
                >
                  {link.icon}
                  <span>{link.label}</span>
                </div>
              ) : (
                <Link to={link.to} className={styles.link}>
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default Navbar;
