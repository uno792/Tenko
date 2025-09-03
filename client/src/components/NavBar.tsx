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

const Navbar: React.FC = () => {
  const location = useLocation();

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
    {
      to: "/notes",
      label: "Notes & Papers",
      icon: <BookOpen size={18} />,
    },
    { to: "/findtutor", label: "Tutors", icon: <Users size={18} /> },

    { to: "/events", label: "Events", icon: <Star size={18} /> },

    { to: "/profile", label: "My Profile", icon: <Users size={18} /> },
  ];

  return (
    <nav className={styles.navbar}>
      <ul className={styles.menu}>
        {links.map((link) => (
          <li
            key={link.to}
            className={`${styles.menuItem} ${
              location.pathname === link.to ? styles.active : ""
            }`}
          >
            <Link to={link.to} className={styles.link}>
              {link.icon}
              <span>{link.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Navbar;
