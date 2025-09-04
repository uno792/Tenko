import React, { useEffect, useState } from "react";
import styles from "./EventList.module.css";
import EventCard from "./EventCard";
import Loader from "../Loader/Loader";
import {
  type EventItem,
  fetchEvents,
  fetchEventStatuses,
} from "../../services/eventsApi";

type Props = {
  userId: string | null;
  mode: "All Events" | "Recommended" | "Urgent Deadlines";
  selectedTags: string[];
};

const EventList: React.FC<Props> = ({ userId, mode, selectedTags }) => {
  const [items, setItems] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const urgent = mode === "Urgent Deadlines";
      const types =
        mode === "Recommended" ? ["Hackathon", "Bursary"] : undefined;

      try {
        const events = await fetchEvents({
          tags: selectedTags,
          types,
          urgent,
          limit: 200,
        });

        if (userId) {
          const statuses = await fetchEventStatuses(userId);
          const byId = new Map<number, "applied" | "saved">(
            statuses.map((s) => [s.event_id, s.status])
          );
          events.forEach((ev) => {
            ev.user_status = byId.get(ev.id) ?? null;
          });
        }

        if (alive) setItems(events);
      } catch (e) {
        console.error(e);
        if (alive) setItems([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [userId, mode, selectedTags]);

  if (loading) return <Loader />;
  if (items.length === 0)
    return (
      <div className={styles.empty}>No events match your filters yet.</div>
    );

  return (
    <div className={styles.list}>
      {items.map((ev) => (
        <EventCard key={ev.id} userId={userId} event={ev} />
      ))}
    </div>
  );
};

export default EventList;
