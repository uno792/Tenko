import { useEffect, useState } from "react";
import NotesHeader from "../components/Notes/NotesHeader";
import NotesSearchBar from "../components/Notes/NotesSearchBar";
import NotesCard from "../components/Notes/NotesCard";
import StatsCard from "../components/Notes/StatsCard";
import ContributorsCard from "../components/Notes/ContributorsCard";
import styles from "./notes.module.css";
import { baseURL } from "../config";
import { useUser } from "../Users/UserContext";

// ✅ import Loader
import Loader from "../components/Loader/Loader";

export default function NotesPage() {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSorted, setIsSorted] = useState(false);

  const { user } = useUser();
  const currentUserId = user?.id || "";

  async function fetchResources(query = searchQuery, sorted = isSorted) {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (query) params.append("search", query);
      if (sorted) params.append("sort", "upvotes");

      const res = await fetch(`${baseURL}/resources?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch resources");
      const data = await res.json();
      setResources(data);
    } catch (err) {
      console.error("❌ fetchResources error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchResources();
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    fetchResources(query, isSorted);
  };

  const handleToggleSort = () => {
    setIsSorted((prev) => {
      const newSort = !prev;
      fetchResources(searchQuery, newSort);
      return newSort;
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.main}>
        <NotesHeader />
        <NotesSearchBar
          onSearch={handleSearch}
          onToggleSort={handleToggleSort}
          isSorted={isSorted}
        />

        {loading ? (
          <Loader />
        ) : resources.length > 0 ? (
          resources.map((resource) => (
            <NotesCard
              key={resource.id}
              id={resource.id}
              title={resource.title}
              type={resource.type}
              subject={resource.subject}
              grade={
                resource.grade_level ? `Grade ${resource.grade_level}` : "N/A"
              }
              author={resource.users?.username || "Unknown"}
              authorId={resource.user_id}
              currentUserId={currentUserId}
              description={resource.description}
              downloads={resource.downloads}
              upvotes={resource.upvotes}
              date={new Date(resource.created_at).toLocaleDateString()}
              fileUrl={resource.file_url}
            />
          ))
        ) : (
          <p>No resources found.</p>
        )}
      </div>

      <div className={styles.sidebar}>
        <StatsCard />
        <ContributorsCard />
      </div>
    </div>
  );
}
