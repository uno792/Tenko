import { useEffect, useState } from "react";
import NotesHeader from "../components/Notes/NotesHeader";
import NotesSearchBar from "../components/Notes/NotesSearchBar";
import NotesCard from "../components/Notes/NotesCard";
import StatsCard from "../components/Notes/StatsCard";
import ContributorsCard from "../components/Notes/ContributorsCard";
import styles from "./notes.module.css";
import { baseURL } from "../config";

export default function NotesPage() {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSorted, setIsSorted] = useState(false);

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
          <p>Loading resources...</p>
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

/*import { useEffect, useState } from "react";
import NotesHeader from "../components/Notes/NotesHeader";
import NotesSearchBar from "../components/Notes/NotesSearchBar";
import NotesCard from "../components/Notes/NotesCard";
import StatsCard from "../components/Notes/StatsCard";
import ContributorsCard from "../components/Notes/ContributorsCard";
import styles from "./notes.module.css";

export default function NotesPage() {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResources() {
      try {
        const res = await fetch("http://localhost:3000/resources");
        if (!res.ok) throw new Error("Failed to fetch resources");
        const data = await res.json();
        setResources(data);
      } catch (err) {
        console.error("❌ fetchResources error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchResources();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.main}>
        <NotesHeader />
        <NotesSearchBar />

        {loading ? (
          <p>Loading resources...</p>
        ) : resources.length > 0 ? (
          resources.map((resource) => (
            <NotesCard
              key={resource.id}
              id={resource.id} // ✅ pass ID
              title={resource.title}
              type={resource.type}
              subject={resource.subject}
              grade={
                resource.grade_level ? `Grade ${resource.grade_level}` : "N/A"
              }
              author={resource.users?.username || "Unknown"}
              description={resource.description}
              downloads={resource.downloads}
              upvotes={resource.upvotes}
              date={new Date(resource.created_at).toLocaleDateString()}
              fileUrl={resource.file_url} // ✅ pass file URL
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
}*/

/*import NotesHeader from "../components/Notes/NotesHeader";
import NotesSearchBar from "../components/Notes/NotesSearchBar";
import NotesCard from "../components/Notes/NotesCard";
import StatsCard from "../components/Notes/StatsCard";
import ContributorsCard from "../components/Notes/ContributorsCard";
import styles from "./notes.module.css";

export default function NotesPage() {
  return (
    <div className={styles.container}>
      <div className={styles.main}>
        <NotesHeader />
        <NotesSearchBar />

        <NotesCard
          title="Mathematics Grade 12 - Calculus Notes"
          type="Notes"
          subject="Mathematics"
          grade="Grade 12"
          author="John D."
          description="Covers calculus basics, differentiation, and integration."
          downloads={245}
          upvotes={52}
          date="8/15/2024"
        />

        <NotesCard
          title="Physics - Electricity and Magnetism"
          type="Notes"
          subject="Physics"
          grade="Grade 12"
          author="Sarah M."
          description="Detailed study notes on electricity, circuits, and magnetism."
          downloads={189}
          upvotes={47}
          date="8/20/2024"
        />

        <NotesCard
          title="Life Sciences Final Exam Paper 2023"
          type="Past Paper"
          subject="Life Sciences"
          grade="Grade 12"
          author="Mike K."
          description="2023 final exam past paper with solutions."
          downloads={156}
          upvotes={36}
          date="8/22/2024"
        />
      </div>

      <div className={styles.sidebar}>
        <StatsCard />
        <ContributorsCard />
      </div>
    </div>
  );
}*/
