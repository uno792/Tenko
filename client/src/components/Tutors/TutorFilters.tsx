import styles from "../../pages/tutorMarketplace.module.css";

interface Props {
  onNameSearch: (value: string) => void;
  onSubjectSearch: (value: string) => void;
  onRatingChange: (range: [number, number] | null) => void;
  onPriceChange: (range: [number, number] | null) => void;
}

export default function TutorFilters({
  onNameSearch,
  onSubjectSearch,
  onRatingChange,
  onPriceChange,
}: Props) {
  const handleRating = (value: string) => {
    if (value === "Any Rating") return onRatingChange(null);
    const [min, max] = value.split("-").map(Number);
    onRatingChange([min, max]);
  };

  const handlePrice = (value: string) => {
    if (value === "Any Price") return onPriceChange(null);
    if (value.includes("+")) {
      const min = parseInt(value);
      onPriceChange([min, Infinity]);
    } else {
      const [min, max] = value.split("-").map(Number);
      onPriceChange([min, max]);
    }
  };

  return (
    <section className={styles.filters}>
      <h2 className={styles.sectionTitle}>Filters</h2>

      <input
        type="text"
        placeholder="Search tutors by name..."
        className={styles.searchBar}
        onChange={(e) => onNameSearch(e.target.value)}
      />

      <div className={styles.filterGrid}>
        <div>
          <label>Subject</label>
          <input
            type="text"
            placeholder="Type subject name..."
            onChange={(e) => onSubjectSearch(e.target.value)}
          />
        </div>
        <div>
          <label>Rating Range</label>
          <select onChange={(e) => handleRating(e.target.value)}>
            <option>Any Rating</option>
            <option>0 - 1</option>
            <option>1 - 2</option>
            <option>2 - 3</option>
            <option>3 - 4</option>
            <option>4 - 5</option>
          </select>
        </div>
        <div>
          <label>Price Range</label>
          <select onChange={(e) => handlePrice(e.target.value)}>
            <option>Any Price</option>
            <option>0 - 50</option>
            <option>51 - 100</option>
            <option>101 - 150</option>
            <option>151 - 200</option>
            <option>200+</option>
          </select>
        </div>
      </div>

      <div className={styles.tipBox}>
        <strong>⭐ Pro Tip</strong>
        <p>
          Book multiple sessions with the same tutor for better rates and
          consistency in your learning journey.
        </p>
      </div>
    </section>
  );
}
