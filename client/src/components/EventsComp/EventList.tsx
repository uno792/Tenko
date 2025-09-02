import React from "react";
import EventCard from "./EventCard";
import styles from "./EventList.module.css";

type Event = {
  title: string;
  date: string;
  location: string;
  description: string;
  category: string;
  daysLeft?: number;
  reward?: string;
  tagColor: string;
};

type EventListProps = {
  filter: string;
};

const events: Event[] = [
  {
    title: "Tech Innovation Hackathon 2024",
    date: "15 Feb 2024",
    location: "Innovation Hub, Cape Town",
    description:
      "Build innovative solutions for real-world problems. Open to all university students with coding experience.",
    category: "Hackathon",
    daysLeft: 5,
    reward: "R50,000",
    tagColor: "#e74c3c",
  },
  {
    title: "Graduate Career Fair 2024",
    date: "28 Feb 2024",
    location: "CTICC, Cape Town",
    description:
      "Connect with top employers across various industries. Over 100 companies recruiting graduates and interns.",
    category: "Career Fair",
    daysLeft: 20,
    reward: "Job Opportunities",
    tagColor: "#6a1b9a",
  },
  {
    title: "Engineering Excellence Bursary",
    date: "01 Mar 2024",
    location: "Online Application",
    description:
      "Full tuition bursary for outstanding engineering students. Covers tuition, accommodation, and study materials.",
    category: "Bursary",
    daysLeft: 25,
    reward: "R120,000/year",
    tagColor: "#388e3c",
  },
  {
    title: "Youth Leadership Summit",
    date: "15 Mar 2024",
    location: "University of Cape Town",
    description:
      "Develop your leadership skills and network with like-minded young professionals. Interactive workshops.",
    category: "Summit",
    tagColor: "#e67e22",
  },
];

const EventList: React.FC<EventListProps> = ({ filter }) => {
  const filteredEvents = events.filter((event) => {
    if (filter === "Urgent Deadlines")
      return event.daysLeft !== undefined && event.daysLeft <= 10;
    if (filter === "Recommended")
      return event.category === "Hackathon" || event.category === "Bursary";
    return true; // "All Events"
  });

  return (
    <div className={styles.list}>
      {filteredEvents.map((event, index) => (
        <EventCard key={index} {...event} />
      ))}
    </div>
  );
};

export default EventList;
