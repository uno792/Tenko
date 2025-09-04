import { useEffect, useState } from "react";
import styles from "./tutorMarketplace.module.css";
import TutorFilters from "../components/Tutors/TutorFilters";
import TutorCard from "../components/Tutors/TutorCard";

// ✅ NEW: import the modal
import TutorProfileModal from "../components/Tutors/TutorProfileModal";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default function TutorMarketplace() {
  const [tutors, setTutors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortByRating, setSortByRating] = useState(false);

  // filter states
  const [nameQuery, setNameQuery] = useState("");
  const [subjectQuery, setSubjectQuery] = useState("");
  const [ratingRange, setRatingRange] = useState<[number, number] | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);

  // ✅ NEW: modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState<any>(null);

  useEffect(() => {
    const fetchTutors = async () => {
      try {
        const res = await fetch(`${API_BASE}/tutors`);
        if (!res.ok) throw new Error("Failed to fetch tutors");
        const data = await res.json();
        setTutors(data);
      } catch (err) {
        console.error("❌ Error fetching tutors:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTutors();
  }, []);

  let displayedTutors = [...tutors];

  // name filter
  if (nameQuery) {
    displayedTutors = displayedTutors.filter((t) =>
      t.users?.username?.toLowerCase().includes(nameQuery.toLowerCase())
    );
  }

  // subject filter
  if (subjectQuery) {
    displayedTutors = displayedTutors.filter((t) =>
      t.subjects?.some((s: string) =>
        s.toLowerCase().includes(subjectQuery.toLowerCase())
      )
    );
  }

  // rating filter
  if (ratingRange) {
    displayedTutors = displayedTutors.filter((t) => {
      const r = parseFloat(t.avg_rating || 0);
      return r >= ratingRange[0] && r <= ratingRange[1];
    });
  }

  // price filter
  if (priceRange) {
    displayedTutors = displayedTutors.filter((t) => {
      const rate = parseFloat(t.rate_per_hour || 0);
      return rate >= priceRange[0] && rate <= priceRange[1];
    });
  }

  // sort
  displayedTutors = displayedTutors.sort((a, b) =>
    sortByRating ? (b.avg_rating || 0) - (a.avg_rating || 0) : 0
  );

  if (loading) return <p>Loading tutors...</p>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Tutor Marketplace</h1>
        <p className={styles.subtitle}>
          Connect with experienced peer tutors in your area.
        </p>
      </header>

      <TutorFilters
        onNameSearch={setNameQuery}
        onSubjectSearch={setSubjectQuery}
        onRatingChange={setRatingRange}
        onPriceChange={setPriceRange}
      />

      <div className={styles.resultsHeader}>
        <p>{displayedTutors.length} tutors found</p>
        <button
          className={styles.sortButton}
          onClick={() => setSortByRating(!sortByRating)}
        >
          Sort by: {sortByRating ? "Default" : "Highest Rating"}
        </button>
      </div>

      <div className={styles.grid}>
        {displayedTutors.map((tutor) => (
          <TutorCard
            key={tutor.id}
            tutor={tutor}
            // ✅ pass in a function that opens modal
            onViewProfile={(t) => {
              setSelectedTutor(t);
              setIsModalOpen(true);
            }}
          />
        ))}
      </div>

      {/* ✅ include modal here */}
      <TutorProfileModal
        isOpen={isModalOpen}
        tutor={selectedTutor}
        onClose={() => setIsModalOpen(false)}
        // ✅ NEW: update tutor rating instantly after review submit
        onReviewSubmitted={(tutorId: number, newAvg: number) => {
          setTutors((prev) =>
            prev.map((t) =>
              t.id === tutorId ? { ...t, avg_rating: newAvg } : t
            )
          );
          if (selectedTutor?.id === tutorId) {
            setSelectedTutor((prev: any) =>
              prev ? { ...prev, avg_rating: newAvg } : prev
            );
          }
        }}
      />
    </div>
  );
}


/*import { useEffect, useState } from "react";
import styles from "./tutorMarketplace.module.css";
import TutorFilters from "../components/Tutors/TutorFilters";
import TutorCard from "../components/Tutors/TutorCard";

// ✅ NEW: import the modal
import TutorProfileModal from "../components/Tutors/TutorProfileModal";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default function TutorMarketplace() {
  const [tutors, setTutors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortByRating, setSortByRating] = useState(false);

  // filter states
  const [nameQuery, setNameQuery] = useState("");
  const [subjectQuery, setSubjectQuery] = useState("");
  const [ratingRange, setRatingRange] = useState<[number, number] | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);

  // ✅ NEW: modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState<any>(null);

  useEffect(() => {
    const fetchTutors = async () => {
      try {
        const res = await fetch(`${API_BASE}/tutors`);
        if (!res.ok) throw new Error("Failed to fetch tutors");
        const data = await res.json();
        setTutors(data);
      } catch (err) {
        console.error("❌ Error fetching tutors:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTutors();
  }, []);

  let displayedTutors = [...tutors];

  // name filter
  if (nameQuery) {
    displayedTutors = displayedTutors.filter((t) =>
      t.users?.username?.toLowerCase().includes(nameQuery.toLowerCase())
    );
  }

  // subject filter
  if (subjectQuery) {
    displayedTutors = displayedTutors.filter((t) =>
      t.subjects?.some((s: string) =>
        s.toLowerCase().includes(subjectQuery.toLowerCase())
      )
    );
  }

  // rating filter
  if (ratingRange) {
    displayedTutors = displayedTutors.filter((t) => {
      const r = parseFloat(t.avg_rating || 0);
      return r >= ratingRange[0] && r <= ratingRange[1];
    });
  }

  // price filter
  if (priceRange) {
    displayedTutors = displayedTutors.filter((t) => {
      const rate = parseFloat(t.rate_per_hour || 0);
      return rate >= priceRange[0] && rate <= priceRange[1];
    });
  }

  // sort
  displayedTutors = displayedTutors.sort((a, b) =>
    sortByRating ? (b.avg_rating || 0) - (a.avg_rating || 0) : 0
  );

  if (loading) return <p>Loading tutors...</p>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Tutor Marketplace</h1>
        <p className={styles.subtitle}>
          Connect with experienced peer tutors in your area.
        </p>
      </header>

      <TutorFilters
        onNameSearch={setNameQuery}
        onSubjectSearch={setSubjectQuery}
        onRatingChange={setRatingRange}
        onPriceChange={setPriceRange}
      />

      <div className={styles.resultsHeader}>
        <p>{displayedTutors.length} tutors found</p>
        <button
          className={styles.sortButton}
          onClick={() => setSortByRating(!sortByRating)}
        >
          Sort by: {sortByRating ? "Default" : "Highest Rating"}
        </button>
      </div>

      <div className={styles.grid}>
        {displayedTutors.map((tutor) => (
          <TutorCard
            key={tutor.id}
            tutor={tutor}
            // ✅ NEW: pass in a function that opens modal
            onViewProfile={(t) => {
              setSelectedTutor(t);
              setIsModalOpen(true);
            }}
          />
        ))}
      </div>

      
      <TutorProfileModal
        isOpen={isModalOpen}
        tutor={selectedTutor}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}*/


/*import { useEffect, useState } from "react";
import styles from "./tutorMarketplace.module.css";
import TutorFilters from "../components/Tutors/TutorFilters";
import TutorCard from "../components/Tutors/TutorCard";
import TutorProfileModal from "../components/Tutors/TutorProfileModal";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export default function TutorMarketplace() {
  const [tutors, setTutors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortByRating, setSortByRating] = useState(false);

  // filter states
  const [nameQuery, setNameQuery] = useState("");
  const [subjectQuery, setSubjectQuery] = useState("");
  const [ratingRange, setRatingRange] = useState<[number, number] | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState<any>(null);


  useEffect(() => {
    const fetchTutors = async () => {
      try {
        const res = await fetch(`${API_BASE}/tutors`);
        if (!res.ok) throw new Error("Failed to fetch tutors");
        const data = await res.json();
        setTutors(data);
      } catch (err) {
        console.error("❌ Error fetching tutors:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTutors();
  }, []);

  let displayedTutors = [...tutors];

  // name filter
  if (nameQuery) {
    displayedTutors = displayedTutors.filter((t) =>
      t.users?.username?.toLowerCase().includes(nameQuery.toLowerCase())
    );
  }

  // subject filter
  if (subjectQuery) {
    displayedTutors = displayedTutors.filter((t) =>
      t.subjects?.some((s: string) =>
        s.toLowerCase().includes(subjectQuery.toLowerCase())
      )
    );
  }

  // rating filter
  if (ratingRange) {
    displayedTutors = displayedTutors.filter((t) => {
      const r = parseFloat(t.avg_rating || 0);
      return r >= ratingRange[0] && r <= ratingRange[1];
    });
  }

  // price filter
  if (priceRange) {
    displayedTutors = displayedTutors.filter((t) => {
      const rate = parseFloat(t.rate_per_hour || 0);
      return rate >= priceRange[0] && rate <= priceRange[1];
    });
  }

  // sort
  displayedTutors = displayedTutors.sort((a, b) =>
    sortByRating ? (b.avg_rating || 0) - (a.avg_rating || 0) : 0
  );

  if (loading) return <p>Loading tutors...</p>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Tutor Marketplace</h1>
        <p className={styles.subtitle}>
          Connect with experienced peer tutors in your area.
        </p>
      </header>

      <TutorFilters
        onNameSearch={setNameQuery}
        onSubjectSearch={setSubjectQuery}
        onRatingChange={setRatingRange}
        onPriceChange={setPriceRange}
      />

      <div className={styles.resultsHeader}>
        <p>{displayedTutors.length} tutors found</p>
        <button
          className={styles.sortButton}
          onClick={() => setSortByRating(!sortByRating)}
        >
          Sort by: {sortByRating ? "Default" : "Highest Rating"}
        </button>
      </div>

      <div className={styles.grid}>
        {displayedTutors.map((tutor) => (
          <TutorCard key={tutor.id} tutor={tutor} />
        ))}
      </div>
    </div>
  );
}*/

