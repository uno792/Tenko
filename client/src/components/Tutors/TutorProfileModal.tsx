import { useState, useEffect } from "react";
import styles from "./tutorProfileModal.module.css";
import { useUser } from "../../Users/UserContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

interface TutorProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  tutor: any;
  // ✅ NEW: callback to update avg rating outside
  onReviewSubmitted?: (tutorId: number, newAvg: number) => void;
}

export default function TutorProfileModal({ 
  isOpen, 
  onClose, 
  tutor, 
  onReviewSubmitted 
}: TutorProfileModalProps) {
  const { user } = useUser(); // logged-in user

  const [activeTab, setActiveTab] = useState<"about" | "ratings" | "reviews">("about");
  const [rating, setRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState("");
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  const renderStars = (value: number, onClick?: (val: number) => void) => (
    <div className={styles.stars}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={i <= value ? styles.starFilled : styles.starEmpty}
          onClick={() => onClick?.(i)}
        >
          ★
        </span>
      ))}
      {onClick && <span className={styles.starLabel}>{value}/5</span>}
    </div>
  );

  useEffect(() => {
    if (!isOpen || !tutor) return;
    const fetchReviews = async () => {
      try {
        setLoadingReviews(true);
        const res = await fetch(`${API_BASE}/tutors/${tutor.id}/reviews`);
        if (!res.ok) throw new Error("Failed to fetch reviews");
        const data = await res.json();
        setReviews(data);
      } catch (err) {
        console.error("❌ Error fetching reviews:", err);
      } finally {
        setLoadingReviews(false);
      }
    };
    fetchReviews();
  }, [isOpen, tutor]);

  const handleSubmitReview = async () => {
    if (!rating) return alert("Please select a rating");
    try {
      const payload = {
        reviewer_id: user?.id,
        rating,
        comment: reviewText,
      };

      const res = await fetch(`${API_BASE}/tutors/${tutor.id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to submit review");
      const newReview = await res.json();

      // ✅ Update reviews in state
      const updated = [newReview, ...reviews];
      setReviews(updated);

      // ✅ Calculate new average
      const ratings = updated.map((r) => r.rating);
      const newAvg =
        ratings.length > 0
          ? parseFloat(
              (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
            )
          : 0;

      // ✅ Notify parent (TutorMarketplace) to update list
      if (onReviewSubmitted) {
        onReviewSubmitted(tutor.id, newAvg);
      }

      setReviewText("");
      setRating(0);
    } catch (err) {
      console.error("❌ Submit review failed:", err);
    }
  };

  if (!isOpen || !tutor) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.avatar}>
            {tutor?.users?.username?.[0]?.toUpperCase() || "?"}
          </div>
          <div className={styles.headerInfo}>
            <h2 className={styles.name}>{tutor?.users?.username}</h2>
            <p className={styles.meta}>
              {tutor?.subjects?.join(", ")} • {tutor?.grade_levels?.join(", ")}
            </p>
            <p className={styles.rating}>
              {renderStars(Math.round(tutor?.avg_rating || 0))}
              <span> {tutor?.avg_rating || 0} ({reviews.length} reviews)</span>
            </p>
          </div>
          <div className={styles.rateBox}>
            <span className={styles.rate}>R {tutor?.rate_per_hour}</span>
            <span className={styles.perHour}>/hour</span>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={activeTab === "about" ? styles.activeTab : ""}
            onClick={() => setActiveTab("about")}
          >
            About
          </button>
          <button
            className={activeTab === "ratings" ? styles.activeTab : ""}
            onClick={() => setActiveTab("ratings")}
          >
            Ratings
          </button>
          <button
            className={activeTab === "reviews" ? styles.activeTab : ""}
            onClick={() => setActiveTab("reviews")}
          >
            Reviews
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {activeTab === "about" && (
            <div className={styles.scrollContent}>
              <h3>About Me</h3>
              <p>{tutor?.bio || "No bio provided."}</p>

              <h3>Academic Information</h3>
              <ul>
                <li>{tutor?.users?.institution || "Unknown Institution"}</li>
                <li>Current Level: {tutor?.users?.grade_year || "N/A"}</li>
              </ul>

              <h3>Subjects I Teach</h3>
              <div className={styles.badges}>
                {tutor?.subjects?.map((s: string, i: number) => (
                  <span key={i} className={styles.badge}>{s}</span>
                ))}
              </div>

              <h3>Grades I Teach</h3>
              <div className={styles.badges}>
                {tutor?.grade_levels?.map((g: string, i: number) => (
                  <span key={i} className={styles.badge}>{g}</span>
                ))}
              </div>

              <h3>Availability</h3>
              <p>{tutor?.availability || "No availability info provided."}</p>

              <h3>Contact Information</h3>
              <p>{tutor?.users?.email || "No email provided"}</p>
              <p>{tutor?.users?.phone || "No phone provided"}</p>
            </div>
          )}

          {activeTab === "ratings" && (
            <div>
              <h3>Rate This Tutor</h3>
              {renderStars(rating, setRating)}
              <textarea
                placeholder="Write your review..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className={styles.textarea}
              />
              <button className={styles.submitBtn} onClick={handleSubmitReview}>
                Submit Review
              </button>
            </div>
          )}

          {activeTab === "reviews" && (
            <div className={styles.reviewsScroll}>
              {loadingReviews ? (
                <p>Loading reviews...</p>
              ) : reviews.length === 0 ? (
                <p>No reviews yet.</p>
              ) : (
                reviews.map((r) => (
                  <div key={r.id} className={styles.reviewCard}>
                    <div className={styles.reviewHeader}>
                      <strong>{r.reviewer?.username || "Anonymous"}</strong>
                      <span>{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                    {renderStars(r.rating)}
                    <p>{r.comment}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


/*import { useState, useEffect } from "react";
import styles from "./tutorProfileModal.module.css";
import { useUser } from "../../Users/UserContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

interface TutorProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  tutor: any;
}

export default function TutorProfileModal({ isOpen, onClose, tutor }: TutorProfileModalProps) {
  const { user } = useUser(); // logged-in user

  // ✅ hooks must always run
  const [activeTab, setActiveTab] = useState<"about" | "ratings" | "reviews">("about");
  const [rating, setRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState("");
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  // ✅ star renderer
  const renderStars = (value: number, onClick?: (val: number) => void) => (
    <div className={styles.stars}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={i <= value ? styles.starFilled : styles.starEmpty}
          onClick={() => onClick?.(i)}
        >
          ★
        </span>
      ))}
      {onClick && <span className={styles.starLabel}>{value}/5</span>}
    </div>
  );

  // ✅ fetch reviews when modal opens
  useEffect(() => {
    if (!isOpen || !tutor) return;
    const fetchReviews = async () => {
      try {
        setLoadingReviews(true);
        const res = await fetch(`${API_BASE}/tutors/${tutor.id}/reviews`);
        if (!res.ok) throw new Error("Failed to fetch reviews");
        const data = await res.json();
        setReviews(data);
      } catch (err) {
        console.error("❌ Error fetching reviews:", err);
      } finally {
        setLoadingReviews(false);
      }
    };
    fetchReviews();
  }, [isOpen, tutor]);

  // ✅ submit review
  const handleSubmitReview = async () => {
    if (!rating) return alert("Please select a rating");
    try {
      const payload = {
        reviewer_id: user?.id,
        rating,
        comment: reviewText,
      };

      const res = await fetch(`${API_BASE}/tutors/${tutor.id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to submit review");
      const newReview = await res.json();

      setReviews([newReview, ...reviews]);
      setReviewText("");
      setRating(0);
    } catch (err) {
      console.error("❌ Submit review failed:", err);
    }
  };

  // ✅ only hide UI here, after hooks have run
  if (!isOpen || !tutor) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>

      
        <div className={styles.header}>
          <div className={styles.avatar}>
            {tutor?.users?.username?.[0]?.toUpperCase() || "?"}
          </div>
          <div className={styles.headerInfo}>
            <h2 className={styles.name}>{tutor?.users?.username}</h2>
            <p className={styles.meta}>
              {tutor?.subjects?.join(", ")} • {tutor?.grade_levels?.join(", ")}
            </p>
            <p className={styles.rating}>
              {renderStars(Math.round(tutor?.avg_rating || 0))}
              <span> {tutor?.avg_rating || 0} ({reviews.length} reviews)</span>
            </p>
          </div>
          <div className={styles.rateBox}>
            <span className={styles.rate}>R {tutor?.rate_per_hour}</span>
            <span className={styles.perHour}>/hour</span>
          </div>
        </div>

     
        <div className={styles.tabs}>
          <button
            className={activeTab === "about" ? styles.activeTab : ""}
            onClick={() => setActiveTab("about")}
          >
            About
          </button>
          <button
            className={activeTab === "ratings" ? styles.activeTab : ""}
            onClick={() => setActiveTab("ratings")}
          >
            Ratings
          </button>
          <button
            className={activeTab === "reviews" ? styles.activeTab : ""}
            onClick={() => setActiveTab("reviews")}
          >
            Reviews
          </button>
        </div>


        <div className={styles.content}>
          {activeTab === "about" && (
            <div className={styles.scrollContent}>
              <h3>About Me</h3>
              <p>{tutor?.bio || "No bio provided."}</p>

              <h3>Academic Information</h3>
              <ul>
                <li>{tutor?.users?.institution || "Unknown Institution"}</li>
                <li>Current Level: {tutor?.users?.grade_year || "N/A"}</li>
              </ul>

              <h3>Subjects I Teach</h3>
              <div className={styles.badges}>
                {tutor?.subjects?.map((s: string, i: number) => (
                  <span key={i} className={styles.badge}>{s}</span>
                ))}
              </div>

              <h3>Grades I Teach</h3>
              <div className={styles.badges}>
                {tutor?.grade_levels?.map((g: string, i: number) => (
                  <span key={i} className={styles.badge}>{g}</span>
                ))}
              </div>

              <h3>Availability</h3>
              <p>{tutor?.availability || "No availability info provided."}</p>

              <h3>Contact Information</h3>
              <p>{tutor?.users?.email || "No email provided"}</p>
              <p>{tutor?.users?.phone || "No phone provided"}</p>
            </div>
          )}

          {activeTab === "ratings" && (
            <div>
              <h3>Rate This Tutor</h3>
              {renderStars(rating, setRating)}
              <textarea
                placeholder="Write your review..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className={styles.textarea}
              />
              <button className={styles.submitBtn} onClick={handleSubmitReview}>
                Submit Review
              </button>
            </div>
          )}

          {activeTab === "reviews" && (
            <div className={styles.reviewsScroll}>
              {loadingReviews ? (
                <p>Loading reviews...</p>
              ) : reviews.length === 0 ? (
                <p>No reviews yet.</p>
              ) : (
                reviews.map((r) => (
                  <div key={r.id} className={styles.reviewCard}>
                    <div className={styles.reviewHeader}>
                      <strong>{r.reviewer?.username || "Anonymous"}</strong>
                      <span>{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                    {renderStars(r.rating)}
                    <p>{r.comment}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}*/


/*import { useState, useEffect } from "react";
import styles from "./tutorProfileModal.module.css";
// ✅ import your user context so we know who is logged in
import { useUser } from "../../Users/UserContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

interface TutorProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  tutor: any;
}

export default function TutorProfileModal({ isOpen, onClose, tutor }: TutorProfileModalProps) {
  const { user } = useUser(); // ✅ get logged-in user
  const [activeTab, setActiveTab] = useState<"about" | "ratings" | "reviews">("about");
  const [rating, setRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState("");

  // ✅ NEW: reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  if (!isOpen || !tutor) return null;

  // ✅ Render stars (with optional onClick)
  const renderStars = (value: number, onClick?: (val: number) => void) => (
    <div className={styles.stars}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={i <= value ? styles.starFilled : styles.starEmpty}
          onClick={() => onClick?.(i)}
        >
          ★
        </span>
      ))}
      {onClick && <span className={styles.starLabel}>{value}/5</span>}
    </div>
  );

  // ✅ Fetch reviews when modal opens
  useEffect(() => {
    if (!isOpen || !tutor) return;
    const fetchReviews = async () => {
      try {
        setLoadingReviews(true);
        const res = await fetch(`${API_BASE}/tutors/${tutor.id}/reviews`);
        if (!res.ok) throw new Error("Failed to fetch reviews");
        const data = await res.json();
        setReviews(data);
      } catch (err) {
        console.error("❌ Error fetching reviews:", err);
      } finally {
        setLoadingReviews(false);
      }
    };
    fetchReviews();
  }, [isOpen, tutor]);

  // ✅ Submit review
  const handleSubmitReview = async () => {
    if (!rating) return alert("Please select a rating");
    try {
      const payload = {
        reviewer_id: user?.id, // ✅ use logged-in user id
        rating,
        comment: reviewText,
      };

      const res = await fetch(`${API_BASE}/tutors/${tutor.id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to submit review");
      const newReview = await res.json();

      setReviews([newReview, ...reviews]); // ✅ add to top of list
      setReviewText("");
      setRating(0);
    } catch (err) {
      console.error("❌ Submit review failed:", err);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>

        
        <div className={styles.header}>
          <div className={styles.avatar}>
            {tutor?.users?.username?.[0]?.toUpperCase() || "?"}
          </div>
          <div className={styles.headerInfo}>
            <h2 className={styles.name}>{tutor?.users?.username}</h2>
            <p className={styles.meta}>
              {tutor?.subjects?.join(", ")} • {tutor?.grade_levels?.join(", ")}
            </p>
            <p className={styles.rating}>
              {renderStars(Math.round(tutor?.avg_rating || 0))}
              <span>
                {" "}
                {tutor?.avg_rating || 0} ({reviews.length} reviews)
              </span>
            </p>
          </div>
          <div className={styles.rateBox}>
            <span className={styles.rate}>R {tutor?.rate_per_hour}</span>
            <span className={styles.perHour}>/hour</span>
          </div>
        </div>

        
        <div className={styles.tabs}>
          <button
            className={activeTab === "about" ? styles.activeTab : ""}
            onClick={() => setActiveTab("about")}
          >
            About
          </button>
          <button
            className={activeTab === "ratings" ? styles.activeTab : ""}
            onClick={() => setActiveTab("ratings")}
          >
            Ratings
          </button>
          <button
            className={activeTab === "reviews" ? styles.activeTab : ""}
            onClick={() => setActiveTab("reviews")}
          >
            Reviews
          </button>
        </div>

        
        <div className={styles.content}>
          {activeTab === "about" && (
            <div className={styles.scrollContent}>
              <h3>About Me</h3>
              <p>{tutor?.bio || "No bio provided."}</p>

              <h3>Academic Information</h3>
              <ul>
                <li>{tutor?.users?.institution || "Unknown Institution"}</li>
                <li>Current Level: {tutor?.users?.grade_year || "N/A"}</li>
              </ul>

              <h3>Subjects I Teach</h3>
              <div className={styles.badges}>
                {tutor?.subjects?.map((s: string, i: number) => (
                  <span key={i} className={styles.badge}>{s}</span>
                ))}
              </div>

              <h3>Grades I Teach</h3>
              <div className={styles.badges}>
                {tutor?.grade_levels?.map((g: string, i: number) => (
                  <span key={i} className={styles.badge}>{g}</span>
                ))}
              </div>

              <h3>Availability</h3>
              <p>{tutor?.availability || "No availability info provided."}</p>

              <h3>Contact Information</h3>
              <p>{tutor?.users?.email || "No email provided"}</p>
              <p>{tutor?.users?.phone || "No phone provided"}</p>
            </div>
          )}

          {activeTab === "ratings" && (
            <div>
              <h3>Rate This Tutor</h3>
              {renderStars(rating, setRating)}
              <textarea
                placeholder="Write your review..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className={styles.textarea}
              />
              <button className={styles.submitBtn} onClick={handleSubmitReview}>
                Submit Review
              </button>
            </div>
          )}

          {activeTab === "reviews" && (
            <div className={styles.reviewsScroll}>
              {loadingReviews ? (
                <p>Loading reviews...</p>
              ) : reviews.length === 0 ? (
                <p>No reviews yet.</p>
              ) : (
                reviews.map((r) => (
                  <div key={r.id} className={styles.reviewCard}>
                    <div className={styles.reviewHeader}>
                      <strong>{r.reviewer?.username || "Anonymous"}</strong>
                      <span>{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                    {renderStars(r.rating)}
                    <p>{r.comment}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}*/
