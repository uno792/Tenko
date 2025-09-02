import React from "react";
import styles from "./EventCard.module.css";

type EventCardProps = {
  title: string;
  date: string;
  location: string;
  description: string;
  category: string;
  daysLeft?: number;
  reward?: string;
  tagColor: string;
};

const EventCard: React.FC<EventCardProps> = ({
  title,
  date,
  location,
  description,
  category,
  daysLeft,
  reward,
  tagColor,
}) => {
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.details}>
        <span> {date}</span>
        <span> {location}</span>
      </div>
      <p className={styles.description}>{description}</p>
      <div className={styles.footer}>
        <span className={styles.tag} style={{ backgroundColor: tagColor }}>
          {category}
        </span>
        {daysLeft && (
          <span className={styles.daysLeft}>{daysLeft} days left</span>
        )}
        {reward && <span className={styles.reward}>{reward}</span>}
      </div>
    </div>
  );
};

export default EventCard;
