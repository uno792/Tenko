import React, { useState } from "react";
import styles from "./CalendarModal.module.css";

interface CalendarModalProps {
  date: string;
  onClose: () => void;
  onSave: (title: string) => void;
}

const CalendarModal: React.FC<CalendarModalProps> = ({
  date,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState("");

  const handleSave = () => {
    if (title.trim() !== "") {
      onSave(title);
      setTitle("");
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3>Add Event for {date}</h3>
        <input
          type="text"
          placeholder="Event title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className={styles.actions}>
          <button onClick={onClose}>Cancel</button>
          <button onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
};

export default CalendarModal;
