import supabase from "./supabaseClient";
import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import { readFile } from "node:fs/promises";
import { fetchText } from "./scripts/lib/fetchers";
import { llmExtract } from "./scripts/lib/llm";
import { upsertEvents } from "./scripts/lib/supabase";
import path from "node:path";
import multer from "multer"; // middleware for handling file uploads
import { v4 as uuidv4 } from "uuid";

// set up multer to store files in memory (not on disk)
const upload = multer({ storage: multer.memoryStorage() });

const app = express();
const PORT = process.env.PORT || 3000;
const router = express.Router();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(router);

app.get("/api", (req: Request, res: Response) => {
  res.send("Hello from the API");
});

app.get("/status", (req: Request, res: Response) => {
  res.json({ status: "The server is running" });
});

function assertServiceRole() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is undefined");
  }
  try {
    const payload = JSON.parse(
      Buffer.from(key.split(".")[1], "base64url").toString("utf8")
    );
    console.log("Supabase key role:", payload.role); // should be "service_role"
  } catch {
    console.warn("Could not decode SUPABASE_SERVICE_ROLE_KEY (not a JWT?)");
  }
}
assertServiceRole();

// ✅ Get reviews for a tutor
router.get("/tutors/:id/reviews", async (req, res) => {
  try {
    const tutorId = req.params.id;
    const { data, error } = await supabase
      .from("tutor_reviews")
      .select(
        `
        id,
         reviewer_id,
        rating,
        comment,
        created_at,
        reviewer:reviewer_id (username)
      `
      )
      .eq("tutor_id", tutorId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (err: any) {
    console.error("❌ Fetch reviews failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Post a new review
router.post("/tutors/:id/reviews", async (req, res) => {
  try {
    const tutorId = req.params.id;
    const { reviewer_id, rating, comment } = req.body;

    if (!reviewer_id || !rating) {
      return res
        .status(400)
        .json({ error: "Reviewer ID and rating are required" });
    }

    const { data, error } = await supabase
      .from("tutor_reviews")
      .insert([
        {
          tutor_id: tutorId,
          reviewer_id,
          rating,
          comment,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (err: any) {
    console.error("❌ Create review failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// getting names to display
router.get("/names", async (req, res) => {
  const { data, error } = await supabase.from("users").select("username");

  if (error) {
    console.error("❌ Supabase error:", error.message);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json(data);
});
//checking if ID exists alreayd
router.get("/checkID", async (req, res) => {
  const { user_id } = req.query;
  const { data, error } = await supabase
    .from("users")
    .select("user_id")
    .eq("user_id", user_id);

  if (error) {
    console.error("❌ Supabase error:", error.message);
    return res.status(500).json({ error: error.message });
  }

  const exists = data && data.length > 0;

  return res.status(200).json({ exists });
});

// Get all tutors with user info + avg rating
router.get("/tutors", async (req, res) => {
  try {
    const { data: tutors, error } = await supabase.from("tutors").select(`
        id,
        user_id,
        subjects,
        bio,
        rate_per_hour,
        grade_levels,
        users:user_id (
          username,
          email,
          phone,
          institution,
          grade_year,
          profilepic
        )
      `);

    if (error) throw error;

    // fetch reviews separately and compute avg rating (default 0 if none)
    const tutorsWithRatings = await Promise.all(
      tutors.map(async (tutor: any) => {
        const { data: reviews } = await supabase
          .from("tutor_reviews")
          .select("rating")
          .eq("tutor_id", tutor.id);

        const ratings = reviews?.map((r) => r.rating) || [];
        const avg_rating =
          ratings.length > 0
            ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
            : 0; // 👈 default to 0

        return { ...tutor, avg_rating };
      })
    );

    res.json(tutorsWithRatings);
  } catch (err: any) {
    console.error("❌ Fetch tutors failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});

//adding user to the DB
router.post("/addUser", async (req, res) => {
  console.log("BODY /addUser:", req.body); // should log { user_id, username }
  const { user_id, username } = req.body;
  if (!user_id || !username) {
    return res.status(400).json({ error: "user_id and username are required" });
  }
  const { data, error } = await supabase
    .from("users")
    .insert({ user_id, username })
    .select("*")
    .single();

  if (error) {
    console.error("❌ Supabase error:", error.message);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ data });
});

router.get("/programs", async (req, res) => {
  try {
    const q = (req.query.query as string | undefined)?.trim();

    let query = supabase
      .from("programs")
      .select(
        // ⬇️ add website here
        "id,name,aps_requirement,application_open,application_close,universities:universities(name,abbreviation,website)"
      )
      .order("name", { ascending: true })
      .limit(30);

    if (q && q.length > 0) {
      query = query.ilike("name", `%${q}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return res.status(200).json(data);
  } catch (err: any) {
    console.error("❌ /programs error:", err.message);
    return res.status(500).json({ error: "Failed to fetch programs" });
  }
});

// Upvote
router.patch("/resources/:id/upvote", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid resource ID" });

    const { error } = await supabase.rpc("increment_upvotes", {
      resource_id: id,
    });
    if (error) throw error;

    return res.status(200).json({ message: "Upvote added" });
  } catch (err: any) {
    console.error("❌ PATCH /resources/:id/upvote error:", err.message);
    return res.status(500).json({ error: "Failed to upvote resource" });
  }
});

// Download
router.patch("/resources/:id/download", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid resource ID" });

    const { error } = await supabase.rpc("increment_downloads", {
      resource_id: id,
    });
    if (error) throw error;

    return res.status(200).json({ message: "Download incremented" });
  } catch (err: any) {
    console.error("❌ PATCH /resources/:id/download error:", err.message);
    return res.status(500).json({ error: "Failed to increment downloads" });
  }
});

// ==============================
// NEW: Get top contributors
// ==============================
router.get(
  "/resources/top-contributors",
  async (req: Request, res: Response) => {
    try {
      const limit = Number(req.query.limit) || 5;

      // Query with user join
      const { data, error } = await supabase
        .from("resources")
        .select("user_id, upvotes, downloads, users(username)")
        .order("upvotes", { ascending: false });

      if (error) throw error;

      // Aggregate by user
      const contributors: Record<
        string,
        { username: string; uploads: number; downloads: number; points: number }
      > = {};

      (data || []).forEach((r: any) => {
        if (!r.user_id) return;
        if (!contributors[r.user_id]) {
          contributors[r.user_id] = {
            username: (r.users as any)?.username || "Unknown", // 👈 cast to any to silence TS
            uploads: 0,
            downloads: 0,
            points: 0,
          };
        }
        contributors[r.user_id].uploads += 1;
        contributors[r.user_id].downloads += r.downloads || 0;
        contributors[r.user_id].points += r.upvotes || 0;
      });

      // Sort by points
      const sorted = Object.values(contributors)
        .sort((a, b) => b.points - a.points)
        .slice(0, limit);

      res.json(sorted);
    } catch (err: any) {
      console.error("❌ GET /resources/top-contributors error:", err.message);
      res.status(500).json({ error: "Failed to fetch top contributors" });
    }
  }
);

// ==============================
// NEW: Get stats for a user
// ==============================
router.get("/resources/stats", async (req: Request, res: Response) => {
  try {
    const user_id = (req.query.user_id as string) || "test-user-123"; // fallback for now

    // count uploads
    const { count: uploads, error: uploadsError } = await supabase
      .from("resources")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user_id);
    if (uploadsError) throw uploadsError;

    // sum downloads
    const { data: dlData, error: dlError } = await supabase
      .from("resources")
      .select("downloads")
      .eq("user_id", user_id);
    if (dlError) throw dlError;
    const downloads = dlData.reduce((sum, r) => sum + (r.downloads || 0), 0);

    // sum upvotes (points)
    const { data: upData, error: upError } = await supabase
      .from("resources")
      .select("upvotes")
      .eq("user_id", user_id);
    if (upError) throw upError;
    const points = upData.reduce((sum, r) => sum + (r.upvotes || 0), 0);

    // very basic "rank": count how many users have more points
    const { data: allUsers, error: allErr } = await supabase
      .from("resources")
      .select("user_id, upvotes");
    if (allErr) throw allErr;

    const totals: Record<string, number> = {};
    allUsers.forEach((r) => {
      totals[r.user_id] = (totals[r.user_id] || 0) + (r.upvotes || 0);
    });
    const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    const rank = sorted.findIndex(([id]) => id === user_id) + 1;

    res.json({ uploads, downloads, points, rank });
  } catch (err: any) {
    console.error("❌ GET /resources/stats error:", err.message);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// ==============================
// NEW: Get resources (with optional filters)
// ==============================
router.get("/resources", async (req: Request, res: Response) => {
  try {
    let query = supabase.from("resources").select(`
      id,
      user_id,
      title,
      type,
      subject,
      grade_level,
      institution,
      description,
      file_url,
      downloads,
      upvotes,
      created_at,
      users(username)
    `);

    // 🔍 Title search
    if (req.query.search) {
      query = query.ilike("title", `%${req.query.search}%`);
    }

    // 📌 Optional filters
    if (req.query.subject) {
      query = query.eq("subject", req.query.subject as string);
    }
    if (req.query.type) {
      query = query.eq("type", req.query.type as string);
    }

    // 🔝 Sort toggle
    if (req.query.sort === "upvotes") {
      query = query.order("upvotes", { ascending: false });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const { data, error } = await query;
    if (error) throw error;

    return res.status(200).json(data);
  } catch (err: any) {
    console.error("❌ GET /resources error:", err.message);
    return res.status(500).json({ error: "Failed to fetch resources" });
  }
});

/**
 * POST /resources/upload
 * Handles file upload + DB insert
 */
router.post("/resources/upload", upload.single("file"), async (req, res) => {
  try {
    const {
      user_id,
      title,
      type,
      subject,
      grade_level,
      institution,
      description,
    } = req.body;
    const file = req.file;

    // 🐞 Debugging log
    console.log("📥 Upload request body:", req.body);
    console.log(
      "📎 File info:",
      file?.originalname,
      file?.mimetype,
      file?.size
    );

    if (!file) {
      return res.status(400).json({ error: "File is required" });
    }
    if (!user_id || !title || !type) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Generate unique file name to avoid collisions
    const fileExt = file.originalname.split(".").pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    // Upload file to Supabase storage
    const { error: storageError } = await supabase.storage
      .from("resources_files")
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
      });

    if (storageError) {
      console.error("❌ Storage upload error:", storageError.message);
      return res.status(500).json({ error: "Failed to upload file" });
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("resources_files")
      .getPublicUrl(filePath);

    const file_url = publicUrlData.publicUrl;

    // Insert metadata into DB
    const { data, error } = await supabase
      .from("resources")
      .insert({
        user_id,
        title,
        type,
        subject,
        grade_level: grade_level ? parseInt(grade_level) : null,
        institution,
        description,
        file_url,
      })
      .select("*")
      .single();

    if (error) {
      console.error("❌ DB insert error:", error.message);
      return res.status(500).json({ error: "Failed to save resource" });
    }

    return res
      .status(201)
      .json({ message: "Upload successful", resource: data });
  } catch (err: any) {
    console.error("❌ /resources/upload error:", err.message);
    return res.status(500).json({ error: "Unexpected server error" });
  }
});

router.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.url}`, {
    body: req.body,
    query: req.query,
  });
  next();
});

/* ============================
   Profile Routes
============================ */

// Fetch user + tutor data
router.get("/profile/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (userError) throw userError;

    const { data: tutor } = await supabase
      .from("tutors")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    return res.json({ ...user, tutor });
  } catch (err: any) {
    console.error("❌ Profile fetch error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Update user info
router.put("/profile/:userId", async (req, res) => {
  const { userId } = req.params;
  const { username, email, phone, institution, grade_year, bio } = req.body;

  try {
    console.log("➡️ Updating profile for:", userId, "with data:", req.body);

    const { data, error } = await supabase
      .from("users")
      .update({
        username,
        email,
        phone,
        institution,
        grade_year,
        bio,
      })
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("❌ Supabase update error:", error.message, error.details);
      return res
        .status(400)
        .json({ error: error.message, details: error.details });
    }

    console.log("✅ Updated profile:", data);
    return res.json(data);
  } catch (err: any) {
    console.error("❌ Profile update error:", err);
    return res.status(500).json({ error: err.message });
  }
});

/*router.put("/profile/:userId", async (req, res) => {
  const { userId } = req.params;
  const { username, email, phone, institution, grade_year, bio } = req.body;

  try {
    const { data, error } = await supabase
      .from("users")
      .update({
        username: username,
        email,
        phone,
        institution,
        grade_year,
        bio,
      })
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;

    console.log("✅ Profile updated for user:", userId);
    return res.json(data);
  } catch (err: any) {
    console.error("❌ Profile update error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});*/

/* ============================
   Tutor Routes
============================ */

// Create tutor record
router.post("/tutor", async (req, res) => {
  const { user_id, subjects, bio, rate_per_hour, availability, grade_levels } =
    req.body;

  try {
    const { data, error } = await supabase
      .from("tutors")
      .insert([
        { user_id, subjects, bio, rate_per_hour, availability, grade_levels },
      ])
      .select()
      .single();

    if (error) throw error;

    console.log("✅ Tutor created for user:", user_id);
    return res.json(data);
  } catch (err: any) {
    console.error("❌ Tutor create error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

/*router.post("/tutor", async (req, res) => {
  const { user_id, subjects, bio, rate_per_hour, availability } = req.body;

  try {
    const { data, error } = await supabase
      .from("tutors")
      .insert([
        { user_id, subjects, bio, rate_per_hour, availability }
      ])
      .select()
      .single();

    if (error) throw error;

    console.log("✅ Tutor created for user:", user_id);
    return res.json(data);
  } catch (err: any) {
    console.error("❌ Tutor create error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});*/

// Update tutor record
router.put("/tutor/:userId", async (req, res) => {
  const { userId } = req.params;
  const { subjects, bio, rate_per_hour, availability, grade_levels } = req.body;

  try {
    const { data, error } = await supabase
      .from("tutors")
      .update({
        subjects,
        bio,
        rate_per_hour,
        availability,
        grade_levels,
      })
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;

    console.log("✅ Tutor updated for user:", userId);
    return res.json(data);
  } catch (err: any) {
    console.error("❌ Tutor update error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

/* =========================
   NEW: APPLICATIONS CRUD
   - GET /applications?user_id=...
   - POST /applications  { user_id, program_id }
     -> inserts status='planning', deadline=program.application_close
   - DELETE /applications/:id
   - PATCH /applications/:id { status?, deadline?, notes? }
   ========================= */
router.get("/applications", async (req, res) => {
  try {
    const user_id = (req.query.user_id as string | undefined)?.trim();
    if (!user_id) {
      return res.status(400).json({ error: "user_id is required" });
    }

    const { data, error } = await supabase
      .from("applications")
      .select(
        // ⬇️ add website here
        "id,user_id,program_id,status,deadline,submitted_at,notes,program:programs(id,name,aps_requirement,application_close,universities:universities(name,abbreviation,website))"
      )
      .eq("user_id", user_id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return res.status(200).json(data);
  } catch (err: any) {
    console.error("❌ /applications error:", err.message);
    return res.status(500).json({ error: "Failed to fetch applications" });
  }
});

router.post("/applications", async (req, res) => {
  try {
    const { user_id, program_id } = req.body as {
      user_id?: string;
      program_id?: number;
    };
    if (!user_id || !program_id) {
      return res
        .status(400)
        .json({ error: "user_id and program_id are required" });
    }

    // look up program close date
    const { data: prog, error: pErr } = await supabase
      .from("programs")
      .select("id,application_close")
      .eq("id", program_id)
      .single();
    if (pErr) throw pErr;

    const deadline = prog?.application_close ?? null;

    // 1) Insert minimal row to get the new id
    const { data: inserted, error: insErr } = await supabase
      .from("applications")
      .insert({
        user_id,
        program_id,
        status: "planning",
        deadline,
      })
      .select("id,user_id,program_id,status,deadline,submitted_at,notes")
      .single();
    if (insErr) throw insErr;

    // 2) Re-select with joins so the client immediately gets program + university website
    const { data: joined, error: joinErr } = await supabase
      .from("applications")
      .select(
        "id,user_id,program_id,status,deadline,submitted_at,notes,program:programs(id,name,aps_requirement,application_close,universities:universities(name,abbreviation,website))"
      )
      .eq("id", inserted.id)
      .single();
    if (joinErr) throw joinErr;

    return res.status(201).json(joined);
  } catch (err: any) {
    console.error("❌ POST /applications error:", err.message);
    return res.status(500).json({ error: "Failed to create application" });
  }
});

router.delete("/applications/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "invalid id" });

    const { error } = await supabase.from("applications").delete().eq("id", id);
    if (error) throw error;

    return res.status(204).send();
  } catch (err: any) {
    console.error("❌ DELETE /applications/:id error:", err.message);
    return res.status(500).json({ error: "Failed to delete application" });
  }
});

router.patch("/applications/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: "invalid id" });

    const patch = {
      status: req.body.status,
      deadline: req.body.deadline,
      notes: req.body.notes,
    };

    const { data, error } = await supabase
      .from("applications")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    return res.status(200).json(data);
  } catch (err: any) {
    console.error("❌ PATCH /applications/:id error:", err.message);
    return res.status(500).json({ error: "Failed to update application" });
  }
});

router.post("/ingest/events", async (req, res) => {
  try {
    const token = req.headers["x-cron-secret"];
    if (process.env.CRON_SECRET && token !== process.env.CRON_SECRET) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // __dirname here is .../server
    const sourcesPath = path.resolve(__dirname, "scripts", "sources.json");
    const raw = await readFile(sourcesPath, "utf8");
    const sources: Array<{
      name: string;
      url: string;
      kind: "Hackathon" | "Bursary" | "CareerFair" | "Other";
    }> = JSON.parse(raw);

    let total = 0;
    for (const s of sources) {
      const text = await fetchText(s.url);
      const items = await llmExtract(text, s.kind);
      const { inserted } = await upsertEvents(items as any);
      total += inserted;
    }
    res.json({ ok: true, inserted: total });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e?.message || "failed" });
  }
});

router.get("/universities", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("universities")
      .select("id,name,abbreviation,website")
      .order("name", { ascending: true });
    if (error) throw error;
    res.status(200).json(data);
  } catch (err: any) {
    console.error("❌ GET /universities error:", err.message);
    res.status(500).json({ error: "Failed to fetch universities" });
  }
});

// ==============================
// SUBJECTS (for dropdowns)
// ==============================
router.get("/subjects", async (req, res) => {
  try {
    let q = supabase
      .from("subjects")
      .select("id,name")
      .order("name", { ascending: true });
    const search = (req.query.search as string | undefined)?.trim();
    if (search) q = q.ilike("name", `%${search}%`);
    const { data, error } = await q;
    if (error) throw error;
    res.json(data);
  } catch (e: any) {
    console.error("❌ GET /subjects", e.message);
    res.status(500).json({ error: "Failed to fetch subjects" });
  }
});

// ==============================
// APS PROFILES (load + save)
// ==============================
// GET /aps/profile?user_id=...&university_id=...
router.get("/aps/profile", async (req, res) => {
  try {
    const user_id = (req.query.user_id as string)?.trim();
    const university_id = Number(req.query.university_id);
    if (!user_id || !university_id)
      return res
        .status(400)
        .json({ error: "user_id and university_id required" });

    // find current profile
    const { data: profile, error: pErr } = await supabase
      .from("user_aps_profiles")
      .select("*")
      .eq("user_id", user_id)
      .eq("university_id", university_id)
      .eq("is_current", true)
      .maybeSingle();
    if (pErr) throw pErr;

    if (!profile) return res.json({ profile: null, subjects: [] });

    const { data: rows, error: rErr } = await supabase
      .from("user_aps_profile_subjects")
      .select(
        "id,profile_id,kind,maths_stream,subject_id,band_key,aps_points,position"
      )
      .eq("profile_id", profile.id)
      .order("kind", { ascending: true })
      .order("position", { ascending: true });
    if (rErr) throw rErr;

    res.json({ profile, subjects: rows });
  } catch (e: any) {
    console.error("❌ GET /aps/profile", e.message);
    res.status(500).json({ error: "Failed to load profile" });
  }
});

// POST /aps/profile
// { user_id, university_id, total_aps, rows: [{kind,maths_stream?,subject_id?,band_key,aps_points,position}] }
router.post("/aps/profile", async (req, res) => {
  try {
    const { user_id, university_id, total_aps, rows } = req.body as {
      user_id: string;
      university_id: number;
      total_aps: number;
      rows: Array<{
        kind:
          | "home_language"
          | "mathematics"
          | "life_orientation"
          | "additional_language"
          | "other";
        maths_stream?: "mathematics" | "maths_literacy";
        subject_id?: number | null;
        band_key:
          | "90-100"
          | "80-89"
          | "70-79"
          | "60-69"
          | "50-59"
          | "40-49"
          | "30-39"
          | "0-29";
        aps_points: number;
        position: number; // 0 for fixed; 1..3 for 'other'
      }>;
    };

    if (
      !user_id ||
      !university_id ||
      typeof total_aps !== "number" ||
      !Array.isArray(rows)
    ) {
      return res.status(400).json({ error: "Invalid body" });
    }

    // upsert profile (current)
    const { data: existing, error: selErr } = await supabase
      .from("user_aps_profiles")
      .select("*")
      .eq("user_id", user_id)
      .eq("university_id", university_id)
      .eq("is_current", true)
      .maybeSingle();
    if (selErr) throw selErr;

    let profileId: number;

    if (!existing) {
      const { data: ins, error: insErr } = await supabase
        .from("user_aps_profiles")
        .insert({ user_id, university_id, total_aps, is_current: true })
        .select("*")
        .single();
      if (insErr) throw insErr;
      profileId = ins.id as number;
    } else {
      const { data: upd, error: updErr } = await supabase
        .from("user_aps_profiles")
        .update({ total_aps })
        .eq("id", existing.id)
        .select("*")
        .single();
      if (updErr) throw updErr;
      profileId = upd.id as number;
    }

    // replace all rows for this profile
    const { error: delErr } = await supabase
      .from("user_aps_profile_subjects")
      .delete()
      .eq("profile_id", profileId);
    if (delErr) throw delErr;

    const payload = rows.map((r) => ({
      profile_id: profileId,
      kind: r.kind,
      maths_stream: r.maths_stream ?? null,
      subject_id: r.subject_id ?? null,
      band_key: r.band_key,
      aps_points: r.aps_points,
      position: r.position,
    }));

    const { data: inserted, error: rowsErr } = await supabase
      .from("user_aps_profile_subjects")
      .insert(payload)
      .select("*");
    if (rowsErr) throw rowsErr;

    res.status(200).json({
      ok: true,
      profile_id: profileId,
      subjects_saved: inserted.length,
    });
  } catch (e: any) {
    console.error("❌ POST /aps/profile", e.message);
    res.status(500).json({ error: "Failed to save profile" });
  }
});

// ==============================
// Universities list (for the calculator)
// ==============================
router.get("/universities", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("universities")
      .select("id,name,abbreviation,website")
      .order("name", { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (e: any) {
    console.error("❌ GET /universities", e.message);
    res.status(500).json({ error: "Failed to fetch universities" });
  }
});

/**
 * GET /recommendations?user_id=...&university_id=...
 * Returns programmes where user meets APS and subject minima.
 */
router.get("/recommendations", async (req, res) => {
  try {
    const user_id = (req.query.user_id as string)?.trim();
    const university_id = Number(req.query.university_id);
    if (!user_id || !university_id) {
      return res
        .status(400)
        .json({ error: "user_id and university_id required" });
    }

    // Load current profile + rows
    const { data: profile, error: pErr } = await supabase
      .from("user_aps_profiles")
      .select("*")
      .eq("user_id", user_id)
      .eq("university_id", university_id)
      .eq("is_current", true)
      .maybeSingle();
    if (pErr) throw pErr;
    if (!profile) return res.json([]);

    const { data: rows, error: rErr } = await supabase
      .from("user_aps_profile_subjects")
      .select("kind, band_key, aps_points, maths_stream")
      .eq("profile_id", profile.id);
    if (rErr) throw rErr;

    // Index rows by kind for easy access
    const findRow = (k: string) => rows?.find((r) => r.kind === k);
    const hl = findRow("home_language");
    const al = findRow("additional_language");
    const lo = findRow("life_orientation");
    const mz = findRow("mathematics"); // we also use this for maths_stream
    const others = rows?.filter((r) => r.kind === "other") ?? [];

    // APS total
    const total_aps =
      rows?.reduce((sum, r) => sum + (r.aps_points ?? 0), 0) ?? 0;

    // Programmes for this university
    const { data: programs, error: progErr } = await supabase
      .from("programs")
      .select(
        `
        id, name, aps_requirement, application_close, requirement_notes,
        min_home_language_level, min_home_language_percent,
        min_first_additional_language_level, min_first_additional_language_percent,
        min_mathematics_level, min_mathematics_percent,
        min_physical_sciences_level, min_physical_sciences_percent,
        accepts_maths_literacy, min_maths_literacy_level, min_maths_literacy_percent,
        universities:universities(name,abbreviation,website)
      `
      )
      .eq("university_id", university_id)
      .order("name", { ascending: true });
    if (progErr) throw progErr;

    // Helpers to derive levels/percents from bands
    const bandToPercent = (band: string) => {
      switch (band) {
        case "90-100":
          return 90;
        case "80-89":
          return 80;
        case "70-79":
          return 70;
        case "60-69":
          return 60;
        case "50-59":
          return 50;
        case "40-49":
          return 40;
        case "30-39":
          return 30;
        default:
          return 0;
      }
    };
    const bandToLevel = (band: string) => {
      switch (band) {
        case "90-100":
          return 7;
        case "80-89":
          return 7;
        case "70-79":
          return 6;
        case "60-69":
          return 5;
        case "50-59":
          return 4;
        case "40-49":
          return 3;
        case "30-39":
          return 2;
        default:
          return 1;
      }
    };

    const results = programs.map((p: any) => {
      const aps_ok = p.aps_requirement ? total_aps >= p.aps_requirement : true;
      const checks: Array<{
        tag: string;
        ok: boolean;
        need: string;
        has?: string;
      }> = [];

      // HL
      if (p.min_home_language_level || p.min_home_language_percent) {
        const hasLevel = hl ? bandToLevel(hl.band_key) : 0;
        const hasPct = hl ? bandToPercent(hl.band_key) : 0;
        const need =
          (p.min_home_language_level ? `L${p.min_home_language_level}` : "") +
          (p.min_home_language_percent
            ? `${p.min_home_language_level ? " / " : ""}${
                p.min_home_language_percent
              }%`
            : "");
        const ok =
          (!p.min_home_language_level ||
            hasLevel >= p.min_home_language_level) &&
          (!p.min_home_language_percent ||
            hasPct >= p.min_home_language_percent);
        checks.push({ tag: "HL", ok, need, has: `L${hasLevel}` });
      }

      // AL / FAL
      if (
        p.min_first_additional_language_level ||
        p.min_first_additional_language_percent
      ) {
        const hasLevel = al ? bandToLevel(al.band_key) : 0;
        const hasPct = al ? bandToPercent(al.band_key) : 0;
        const need =
          (p.min_first_additional_language_level
            ? `L${p.min_first_additional_language_level}`
            : "") +
          (p.min_first_additional_language_percent
            ? `${p.min_first_additional_language_level ? " / " : ""}${
                p.min_first_additional_language_percent
              }%`
            : "");
        const ok =
          (!p.min_first_additional_language_level ||
            hasLevel >= p.min_first_additional_language_level) &&
          (!p.min_first_additional_language_percent ||
            hasPct >= p.min_first_additional_language_percent);
        checks.push({ tag: "FAL", ok, need, has: `L${hasLevel}` });
      }

      // Mathematics / Maths Literacy — enforce correct stream
      if (
        p.min_mathematics_level ||
        p.min_mathematics_percent ||
        p.accepts_maths_literacy ||
        p.min_maths_literacy_level ||
        p.min_maths_literacy_percent
      ) {
        const stream =
          mz?.maths_stream === "maths_literacy"
            ? "maths_literacy"
            : "mathematics";
        const hasLevel = mz ? bandToLevel(mz.band_key) : 0;
        const hasPct = mz ? bandToPercent(mz.band_key) : 0;

        let ok = true;
        let need = "";
        let tag = stream === "maths_literacy" ? "Maths Lit" : "Maths";

        if (stream === "maths_literacy") {
          // If programme does NOT accept Maths Literacy, fail immediately.
          if (!p.accepts_maths_literacy) {
            ok = false;
            need = "Pure Maths required";
          } else {
            // Programme accepts Maths Lit — enforce Maths Lit minima if present.
            const needParts: string[] = [];
            if (p.min_maths_literacy_level) {
              needParts.push(`L${p.min_maths_literacy_level}`);
              if (hasLevel < p.min_maths_literacy_level) ok = false;
            }
            if (p.min_maths_literacy_percent) {
              needParts.push(`${p.min_maths_literacy_percent}%`);
              if (hasPct < p.min_maths_literacy_percent) ok = false;
            }
            need = needParts.join(" / ") || "Accepted";
          }
        } else {
          // Pure Maths stream — enforce pure Maths minima.
          const needParts: string[] = [];
          if (p.min_mathematics_level) {
            needParts.push(`L${p.min_mathematics_level}`);
            if (hasLevel < p.min_mathematics_level) ok = false;
          }
          if (p.min_mathematics_percent) {
            needParts.push(`${p.min_mathematics_percent}%`);
            if (hasPct < p.min_mathematics_percent) ok = false;
          }
          need = needParts.join(" / ") || "—";
        }

        checks.push({ tag, ok, need, has: `L${hasLevel}` });
      }

      // Physical Sciences (kept conservative; mark unknown unless you match subject_id)
      if (p.min_physical_sciences_level || p.min_physical_sciences_percent) {
        const ok = false; // Unknown without explicit subject_id match
        const need =
          (p.min_physical_sciences_level
            ? `L${p.min_physical_sciences_level}`
            : "") +
          (p.min_physical_sciences_percent
            ? `${p.min_physical_sciences_level ? " / " : ""}${
                p.min_physical_sciences_percent
              }%`
            : "");
        checks.push({ tag: "Physical Sci", ok, need });
      }

      const all_ok = aps_ok && checks.every((c) => c.ok !== false); // unknown treated as false
      return {
        program: {
          id: p.id,
          name: p.name,
          aps_requirement: p.aps_requirement,
          application_close: p.application_close,
          university_tag:
            p.universities?.abbreviation || p.universities?.name || "",
          website: p.universities?.website || null,
          requirement_notes: p.requirement_notes,
        },
        aps_ok,
        checks,
        all_ok,
      };
    });

    res.json(results);
  } catch (e: any) {
    console.error("❌ GET /recommendations", e.message);
    res.status(500).json({ error: "Failed to compute recommendations" });
  }
});

router.get("/events", async (req, res) => {
  try {
    const tags = (req.query.tags as string)?.split(",").filter(Boolean) ?? [];
    const types = (req.query.types as string)?.split(",").filter(Boolean) ?? [];
    const urgent = req.query.urgent === "1" || req.query.urgent === "true";
    const limit = Math.min(
      parseInt((req.query.limit as string) || "100", 10),
      200
    );
    const offset = parseInt((req.query.offset as string) || "0", 10);

    let q = supabase
      .from("events")
      .select("*")
      .order("start_date", { ascending: true })
      .range(offset, offset + limit - 1);

    if (tags.length) {
      // overlap: faculty_tags && {tags}
      q = q.overlaps("faculty_tags", tags as any);
    }
    if (types.length) {
      q = q.in("type", types as any);
    }
    if (urgent) {
      // we can't do date math server-side easily with the client; so approximate:
      const soon = new Date();
      soon.setDate(soon.getDate() + 10);
      const soonISO = soon.toISOString().slice(0, 10);

      // (end_date <= soon) OR (end_date IS NULL AND start_date <= soon)
      // Supabase doesn't support OR easily in one call; we can broad filter by start_date
      // and handle more precise filtering client-side. To keep simple: filter by start_date <= soon.
      q = q.lte("start_date", soonISO);
    }

    const { data, error } = await q;
    if (error) throw error;

    return res.status(200).json(data || []);
  } catch (err: any) {
    console.error("❌ GET /events error:", err.message);
    return res.status(500).json({ error: "Failed to fetch events" });
  }
});

// GET /api/events/status?user_id=abc
// Returns [{ event_id, status }]
router.get("/events/status", async (req, res) => {
  try {
    const user_id = (req.query.user_id as string) || "";
    if (!user_id) return res.status(400).json({ error: "user_id is required" });

    const { data, error } = await supabase
      .from("event_signups")
      .select("event_id,status")
      .eq("user_id", user_id);

    if (error) throw error;
    return res.status(200).json(data || []);
  } catch (err: any) {
    console.error("❌ GET /events/status error:", err.message);
    return res.status(500).json({ error: "Failed to fetch event statuses" });
  }
});

// POST /api/events/:id/applied  body: { user_id }
router.post("/events/:id/applied", async (req, res) => {
  try {
    const eventId = Number(req.params.id);
    const { user_id } = req.body || {};
    if (!eventId) return res.status(400).json({ error: "Invalid event id" });
    if (!user_id) return res.status(400).json({ error: "user_id is required" });

    const payload = {
      user_id,
      event_id: eventId,
      status: "applied",
      registered_at: new Date().toISOString(),
    };

    // upsert on (user_id,event_id)
    const { data, error } = await supabase
      .from("event_signups")
      .upsert(payload, { onConflict: "user_id,event_id" })
      .select("*")
      .single();

    if (error) throw error;
    return res.status(200).json(data);
  } catch (err: any) {
    console.error("❌ POST /events/:id/applied error:", err.message);
    return res.status(500).json({ error: "Failed to mark applied" });
  }
});

// POST /api/events/:id/save   body: { user_id }
router.post("/events/:id/save", async (req, res) => {
  try {
    const eventId = Number(req.params.id);
    const { user_id } = req.body || {};
    if (!eventId) return res.status(400).json({ error: "Invalid event id" });
    if (!user_id) return res.status(400).json({ error: "user_id is required" });

    const payload = {
      user_id,
      event_id: eventId,
      status: "saved",
      registered_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("event_signups")
      .upsert(payload, { onConflict: "user_id,event_id" })
      .select("*")
      .single();

    if (error) throw error;
    return res.status(200).json(data);
  } catch (err: any) {
    console.error("❌ POST /events/:id/save error:", err.message);
    return res.status(500).json({ error: "Failed to save" });
  }
});

// DELETE /api/events/:id/save?user_id=abc
router.delete("/events/:id/save", async (req, res) => {
  try {
    const eventId = Number(req.params.id);
    const user_id = req.query.user_id as string;
    if (!eventId) return res.status(400).json({ error: "Invalid event id" });
    if (!user_id) return res.status(400).json({ error: "user_id is required" });

    const { error } = await supabase
      .from("event_signups")
      .delete()
      .eq("user_id", user_id)
      .eq("event_id", eventId)
      .eq("status", "saved");

    if (error) throw error;
    return res.status(204).end();
  } catch (err: any) {
    console.error("❌ DELETE /events/:id/save error:", err.message);
    return res.status(500).json({ error: "Failed to unsave" });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

router.put("/tutor/:userId", async (req, res) => {
  const { userId } = req.params;
  const { subjects, bio, rate_per_hour, availability, grade_levels } = req.body;

  const { data, error } = await supabase
    .from("tutors")
    .update({
      subjects,
      bio,
      rate_per_hour,
      availability,
      grade_levels,
    })
    .eq("user_id", userId)
    .select();

  if (error) {
    console.error("❌ Supabase error:", error.message);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json(data[0]);
});
// routes/profile.js

// Update profile picture
router.put("/profile/:userId/profilepic", async (req, res) => {
  const { userId } = req.params;
  const { profilepic } = req.body; // base64 string

  if (!profilepic) {
    return res.status(400).json({ error: "profilepic (base64) is required" });
  }

  const { data, error } = await supabase
    .from("users")
    .update({ profilepic })
    .eq("user_id", userId)
    .select("user_id, profilepic");

  if (error) {
    console.error("❌ Supabase error:", error.message);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json(data[0]);
});

// Fetch profile picture only
router.get("/profile/:userId/profilepic", async (req, res) => {
  const { userId } = req.params;

  const { data, error } = await supabase
    .from("users")
    .select("profilepic")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("❌ Supabase error:", error.message);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json(data);
});

router.delete("/resources/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body; // pass from frontend to validate ownership

    // Fetch resource first
    const { data: resource, error: fetchError } = await supabase
      .from("resources")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !resource) {
      return res.status(404).json({ error: "Resource not found" });
    }

    // Ownership check
    if (resource.user_id !== user_id) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this resource" });
    }

    // Delete file from storage (if exists)
    if (resource.file_url) {
      // file_url looks like https://xxxx.supabase.co/storage/v1/object/public/resources_files/uploads/abc.pdf
      const path = resource.file_url.split("/resources_files/")[1]; // get the relative path
      if (path) {
        const { error: storageError } = await supabase.storage
          .from("resources_files")
          .remove([path]);

        if (storageError) {
          console.error("❌ Storage delete error:", storageError.message);
        }
      }
    }

    // Delete row from DB
    const { error: deleteError } = await supabase
      .from("resources")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("❌ DB delete error:", deleteError.message);
      return res.status(500).json({ error: "Failed to delete resource" });
    }

    return res.json({ message: "Resource deleted successfully" });
  } catch (err: any) {
    console.error("❌ DELETE /resources/:id error:", err.message);
    return res.status(500).json({ error: "Unexpected server error" });
  }
});

// ✅ Delete a review
router.delete("/reviews/:id", async (req, res) => {
  try {
    const reviewId = req.params.id;
    const { user_id } = req.body; // sent from frontend

    // First check that this review belongs to the user
    const { data: review, error: fetchError } = await supabase
      .from("tutor_reviews")
      .select("id, reviewer_id")
      .eq("id", reviewId)
      .single();

    if (fetchError) throw fetchError;

    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    if (review.reviewer_id !== user_id) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this review" });
    }

    // Delete the review
    const { error: deleteError } = await supabase
      .from("tutor_reviews")
      .delete()
      .eq("id", reviewId);

    if (deleteError) throw deleteError;

    return res.status(200).json({ message: "Review deleted successfully" });
  } catch (err: any) {
    console.error("❌ Delete review failed:", err.message);
    res.status(500).json({ error: "Failed to delete review" });
  }
});

// --- Calendar types & helpers ---
type CalendarEventDTO = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD (anchor date)
  endDate?: string | null; // for multi-day events
  source: "application" | "event" | "deadline";
  source_id: number | string;
  meta?: Record<string, any>;
};

// Safe date-only normalizer (no timezone drift)
function toISODateOnly(d: string | Date | null | undefined): string | null {
  if (!d) return null;

  if (typeof d === "string") {
    // Already a date-only string?
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return null;
    return dt.toISOString().slice(0, 10);
  }

  const dt = d as Date;
  if (isNaN(dt.getTime())) return null;
  return dt.toISOString().slice(0, 10);
}

function monthRange(year: number, month0: number) {
  const start = new Date(Date.UTC(year, month0, 1)).toISOString().slice(0, 10);
  const end = new Date(Date.UTC(year, month0 + 1, 0))
    .toISOString()
    .slice(0, 10);
  return { start, end };
}

function inRange(iso: string | null, startISO?: string, endISO?: string) {
  if (!iso) return false;
  if (!startISO || !endISO) return true;
  return iso >= startISO && iso <= endISO;
}

// Does an event window [start,end] overlap the month window [startISO,endISO]?
function overlapsMonth(
  start: string | null,
  end: string | null,
  startISO?: string,
  endISO?: string
) {
  if (!startISO || !endISO) return !!(start || end);
  const s = (start ?? end)!;
  const e = (end ?? start)!;
  return s <= endISO && e >= startISO;
}

/**
 * GET /calendar
 * Returns a unified list of events:
 * - your applications' deadlines (applications.deadline or programs.application_close)
 * - your saved/applied event signups (events.start_date/end_date)
 * - your personal/manual items from 'deadlines'
 */
// =========================
// Calendar: unified events
// GET /calendar?user_id=...&month=YYYY-MM
// =========================
router.get("/calendar", async (req, res) => {
  try {
    const user_id = (req.query.user_id as string | undefined)?.trim();
    const month = (req.query.month as string | undefined)?.trim(); // "YYYY-MM"
    if (!user_id) return res.status(400).json({ error: "user_id is required" });

    let startISO: string | undefined;
    let endISO: string | undefined;
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [y, m] = month.split("-").map((x) => parseInt(x, 10));
      const r = monthRange(y, m - 1);
      startISO = r.start;
      endISO = r.end;
    }

    // 1) Applications (joined to program + university)
    const { data: apps, error: appsErr } = await supabase
      .from("applications")
      .select(
        `
        id, user_id, program_id, status, deadline,
        programs:program_id (
          id, name, application_close,
          universities:university_id ( id, name, abbreviation )
        )
      `
      )
      .eq("user_id", user_id);
    if (appsErr) throw appsErr;

    const appEvents: CalendarEventDTO[] = (apps ?? [])
      .map((row: any): CalendarEventDTO => {
        const programName = row?.programs?.name ?? "Program";
        const uniAbbr =
          row?.programs?.universities?.abbreviation ??
          row?.programs?.universities?.name ??
          "University";
        const d =
          toISODateOnly(row?.deadline) ||
          toISODateOnly(row?.programs?.application_close);

        return {
          id: `application:${row.id}`,
          title: `Application deadline — ${programName} (${uniAbbr})`,
          date: d || "",
          source: "application" as const,
          source_id: row.id as number,
          meta: {
            status: row?.status ?? "planning",
            program_id: row?.program_id,
            university: row?.programs?.universities ?? null,
          },
        };
      })
      .filter((e) => !!e.date && inRange(e.date, startISO, endISO));

    // 2) Event signups (joined to events)
    const { data: signups, error: evErr } = await supabase
      .from("event_signups")
      .select(
        `
        id, status, registered_at,
        events:event_id ( id, title, type, start_date, end_date, location, link )
      `
      )
      .eq("user_id", user_id);
    if (evErr) throw evErr;

    const eventEvents: CalendarEventDTO[] = (signups ?? [])
      .map((row: any): CalendarEventDTO | null => {
        const s = toISODateOnly(row?.events?.start_date);
        const e = toISODateOnly(row?.events?.end_date);
        const anchor = e || s; // show by deadline if available
        if (!anchor) return null;

        return {
          id: `event:${row?.events?.id ?? row.id}`,
          title: row?.events?.title ?? "Event",
          date: anchor, // anchor on end_date (deadline) when present
          endDate: e ?? null,
          source: "event" as const,
          source_id: (row?.events?.id ?? row.id) as number,
          meta: {
            signup_status: row?.status,
            type: row?.events?.type ?? null,
            location: row?.events?.location ?? null,
            link: row?.events?.link ?? null,
            start_date: s,
            end_date: e,
          },
        };
      })
      .filter((e): e is CalendarEventDTO => {
        if (!e) return false;
        const s = (e.meta?.start_date as string | null) ?? e.date;
        const ed = (e.meta?.end_date as string | null) ?? e.date;
        return overlapsMonth(s, ed, startISO, endISO);
      });

    // 3) Personal deadlines
    const { data: deadlines, error: dlErr } = await supabase
      .from("deadlines")
      .select("id, title, description, due_date, type, external_id")
      .eq("user_id", user_id);
    if (dlErr) throw dlErr;

    const dlEvents: CalendarEventDTO[] = (deadlines ?? [])
      .map((row: any): CalendarEventDTO => {
        const date = toISODateOnly(row?.due_date);
        let label = row?.title ?? "Reminder";
        if (row?.type === "application_deadline")
          label = `Application — ${label}`;
        if (row?.type === "event") label = `Event — ${label}`;

        return {
          id: `deadline:${row.id}`,
          title: label,
          date: date || "",
          source: "deadline" as const,
          source_id: row.id as number,
          meta: {
            type: row?.type ?? "personal",
            external_id: row?.external_id ?? null,
            description: row?.description ?? null,
          },
        };
      })
      .filter((e) => !!e.date && inRange(e.date, startISO, endISO));

    // Combine + sort
    const all = [...appEvents, ...eventEvents, ...dlEvents].sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    res.status(200).json(all);
  } catch (err: any) {
    console.error("❌ GET /calendar error:", err.message);
    res.status(500).json({ error: "Failed to load calendar" });
  }
});

router.post("/calendar/event", async (req, res) => {
  try {
    const { user_id, title, date, description } = req.body as {
      user_id?: string;
      title?: string;
      date?: string; // YYYY-MM-DD
      description?: string;
    };

    if (!user_id || !title || !date) {
      return res
        .status(400)
        .json({ error: "user_id, title and date are required" });
    }

    const due_date = toISODateOnly(date);
    if (!due_date) {
      return res.status(400).json({ error: "date must be valid YYYY-MM-DD" });
    }

    const { data, error } = await supabase
      .from("deadlines")
      .insert({
        user_id,
        title,
        description: description ?? null,
        due_date, // 'YYYY-MM-DD' string is fine for a DATE column
        type: "personal",
        external_id: null,
      })
      .select("id,title,description,due_date,type,external_id")
      .single();

    if (error) throw error;

    // Return in the same shape the calendar GET uses
    const event = {
      id: `deadline:${data.id}`,
      title: data.title,
      date: toISODateOnly(data.due_date)!, // keep as 'YYYY-MM-DD'
      source: "deadline" as const,
      source_id: data.id,
      meta: {
        type: data.type,
        description: data.description ?? null,
        external_id: data.external_id ?? null,
      },
    };

    return res.status(201).json(event);
  } catch (err: any) {
    console.error("❌ POST /calendar/event error:", err.message);
    return res.status(500).json({ error: "Failed to add event" });
  }
});

export default router;
