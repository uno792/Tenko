import styles from "./Header.module.css";
//import { useUser } from "../../../Users/UserContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Header() {
  //const u = useUser();
  //const username = u?.username || "Guest";
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // Helper component for comic buttons
  const ComicButton = ({ text, to }: { text: string; to: string }) => (
    <button className={styles.comicBrutalButton} onClick={() => navigate(to)}>
      <div className={styles.buttonInner}>
        <span className={styles.buttonText}>{text}</span>
        <div className={styles.halftoneOverlay}></div>
        <div className={styles.inkSplatter}></div>
      </div>
      <div className={styles.buttonShadow}></div>
      <div className={styles.buttonFrame}></div>
    </button>
  );

  return (
    <header className={styles.nav}>
      <button
        className={styles.hamburger}
        onClick={() => setOpen(!open)}
        aria-label="Toggle navigation"
      >
        <span />
        <span />
        <span />
      </button>

      <nav className={`${styles.links} ${open ? styles.open : ""}`}>
        <ComicButton text="Home" to="/" />
        <ComicButton text="Find Tutor" to="/findtutor" />
        {/* New Practice link */}
        <ComicButton text="Practice" to="/practice" />
      </nav>
    </header>
  );
}
