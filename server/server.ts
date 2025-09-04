import supabase from "./supabaseClient";
import express from "express";
import type { Request, Response } from 'express';
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
app.use(express.json());
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
      .select(`
        id,
        rating,
        comment,
        created_at,
        reviewer:reviewer_id (username)
      `)
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
      return res.status(400).json({ error: "Reviewer ID and rating are required" });
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
  const { data, error } = await supabase
    .from("users")
    .select("username"); 

  if (error) {
    console.error("❌ Supabase error:", error.message);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json(data); 
});
//checking if ID exists alreayd
router.get("/checkID", async (req, res) => {
  const {user_id}=req.query;
  const { data, error } = await supabase
    .from("users")
    .select("user_id")
    .eq("user_id",user_id);

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
    const { data: tutors, error } = await supabase
      .from("tutors")
      .select(`
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
          grade_year
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
  const {user_id,username}=req.body;
  if (!user_id || !username) {
    return res.status(400).json({ error: "user_id and username are required" });
  }
  const { data, error } = await supabase
    .from("users")
    .insert({user_id,username})
    .select('*')
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

    const { error } = await supabase.rpc("increment_upvotes", { resource_id: id });
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

    const { error } = await supabase.rpc("increment_downloads", { resource_id: id });
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
router.get("/resources/top-contributors", async (req: Request, res: Response) => {
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
});


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
    const { user_id, title, type, subject, grade_level, institution, description } = req.body;
    const file = req.file;

    // 🐞 Debugging log
    console.log("📥 Upload request body:", req.body);
    console.log("📎 File info:", file?.originalname, file?.mimetype, file?.size);

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

    return res.status(201).json({ message: "Upload successful", resource: data });
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
      return res.status(400).json({ error: error.message, details: error.details });
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
  const { user_id, subjects, bio, rate_per_hour, availability, grade_levels } = req.body;

  try {
    const { data, error } = await supabase
      .from("tutors")
      .insert([
        { user_id, subjects, bio, rate_per_hour, availability, grade_levels }
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
        grade_levels
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
    const sources: Array<{ name:string; url:string; kind:"Hackathon"|"Bursary"|"CareerFair"|"Other" }> =
      JSON.parse(raw);

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
    let q = supabase.from("subjects").select("id,name").order("name", { ascending: true });
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
    if (!user_id || !university_id) return res.status(400).json({ error: "user_id and university_id required" });

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
      .select("id,profile_id,kind,maths_stream,subject_id,band_key,aps_points,position")
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
        kind: "home_language" | "mathematics" | "life_orientation" | "additional_language" | "other";
        maths_stream?: "mathematics" | "maths_literacy";
        subject_id?: number | null;
        band_key: "90-100" | "80-89" | "70-79" | "60-69" | "50-59" | "40-49" | "30-39" | "0-29";
        aps_points: number;
        position: number; // 0 for fixed; 1..3 for 'other'
      }>;
    };

    if (!user_id || !university_id || typeof total_aps !== "number" || !Array.isArray(rows)) {
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

    res.status(200).json({ ok: true, profile_id: profileId, subjects_saved: inserted.length });
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
      return res.status(400).json({ error: "user_id and university_id required" });
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

    // Pull programmes for this university with requirement minima
    const { data: programs, error: progErr } = await supabase
      .from("programs")
      .select(`
        id, name, aps_requirement, application_close, points_model,
        min_home_language_level, min_home_language_percent,
        min_first_additional_language_level, min_first_additional_language_percent,
        min_mathematics_level, min_mathematics_percent,
        min_physical_sciences_level, min_physical_sciences_percent,
        requirement_notes,
        universities:universities(name,abbreviation,website)
      `)
      .eq("university_id", university_id)
      .order("name", { ascending: true });
    if (progErr) throw progErr;

    // Helper: turn our band into level & percent for checks
    const bandToPercent = (band: string) => {
      switch (band) {
        case "90-100": return 90;
        case "80-89":  return 80;
        case "70-79":  return 70;
        case "60-69":  return 60;
        case "50-59":  return 50;
        case "40-49":  return 40;
        case "30-39":  return 30;
        default:       return 0;
      }
    };
    // Approximate NSC level mapping by band midpoints (good enough for screening)
    const bandToLevel = (band: string) => {
      switch (band) {
        case "90-100": return 7;
        case "80-89":  return 7;
        case "70-79":  return 6;
        case "60-69":  return 5;
        case "50-59":  return 4;
        case "40-49":  return 3;
        case "30-39":  return 2;
        default:       return 1;
      }
    };

    const findRow = (kind: string) => rows.find(r => r.kind === kind);

    const results = programs.map((p: any) => {
      const hl = findRow("home_language");
      const al = findRow("additional_language");
      const mz = findRow("mathematics"); // includes maths_literacy in stream if needed
      const lo = findRow("life_orientation");

      const aps_ok = !p.aps_requirement || (profile.total_aps ?? 0) >= p.aps_requirement;

      // Build subject checks
      const checks: Array<{ tag: string; ok: boolean; need?: string; has?: string }> = [];

      // HL
      if (p.min_home_language_level || p.min_home_language_percent) {
        const hasLevel = hl ? bandToLevel(hl.band_key) : 0;
        const hasPct = hl ? bandToPercent(hl.band_key) : 0;
        const need = (p.min_home_language_level ? `L${p.min_home_language_level}` : "")
          + (p.min_home_language_percent ? `${p.min_home_language_level ? " / " : ""}${p.min_home_language_percent}%` : "");
        const ok = (!p.min_home_language_level || hasLevel >= p.min_home_language_level) &&
                   (!p.min_home_language_percent || hasPct >= p.min_home_language_percent);
        checks.push({ tag: "HL", ok, need, has: `L${hasLevel}` });
      }

      // AL (FAL)
      if (p.min_first_additional_language_level || p.min_first_additional_language_percent) {
        const hasLevel = al ? bandToLevel(al.band_key) : 0;
        const hasPct = al ? bandToPercent(al.band_key) : 0;
        const need = (p.min_first_additional_language_level ? `L${p.min_first_additional_language_level}` : "")
          + (p.min_first_additional_language_percent ? `${p.min_first_additional_language_level ? " / " : ""}${p.min_first_additional_language_percent}%` : "");
        const ok = (!p.min_first_additional_language_level || hasLevel >= p.min_first_additional_language_level) &&
                   (!p.min_first_additional_language_percent || hasPct >= p.min_first_additional_language_percent);
        checks.push({ tag: "FAL", ok, need, has: `L${hasLevel}` });
      }

      // Mathematics (treat both Maths and Maths Lit as “maths” minimums; you can split if programmes distinguish)
      if (p.min_mathematics_level || p.min_mathematics_percent) {
        const hasLevel = mz ? bandToLevel(mz.band_key) : 0;
        const hasPct = mz ? bandToPercent(mz.band_key) : 0;
        const need = (p.min_mathematics_level ? `L${p.min_mathematics_level}` : "")
          + (p.min_mathematics_percent ? `${p.min_mathematics_level ? " / " : ""}${p.min_mathematics_percent}%` : "");
        const ok = (!p.min_mathematics_level || hasLevel >= p.min_mathematics_level) &&
                   (!p.min_mathematics_percent || hasPct >= p.min_mathematics_percent);
        checks.push({ tag: mz?.maths_stream === "maths_literacy" ? "Maths Lit" : "Maths", ok, need, has: `L${hasLevel}` });
      }

      // Physical Sciences
      if (p.min_physical_sciences_level || p.min_physical_sciences_percent) {
        // Look for any “other” set to a science band — we didn’t save subject_id names here, so just reflect minimum
        // If you want a strict check, extend the profile rows to include subject_id for “other” and match by name/id = Physical Sciences.
        // For now treat as “if user entered a band for Physical Sciences in OTHER rows”. Not available here -> mark as unknown(false).
        const ok = false; // unknown unless you store and match the subject_id == "Physical Sciences"
        checks.push({
          tag: "Physical Sci",
          ok,
          need: (p.min_physical_sciences_level ? `L${p.min_physical_sciences_level}` : "") +
                (p.min_physical_sciences_percent ? `${p.min_physical_sciences_level ? " / " : ""}${p.min_physical_sciences_percent}%` : "")
        });
      }

      const all_ok = aps_ok && checks.every(c => c.ok !== false); // unknown treated as false
      return {
        program: {
          id: p.id,
          name: p.name,
          aps_requirement: p.aps_requirement,
          application_close: p.application_close,
          university_tag: p.universities?.abbreviation || p.universities?.name || "",
          website: p.universities?.website || null,
          requirement_notes: p.requirement_notes,
        },
        aps_ok,
        checks,
        score: (aps_ok ? 1 : 0) + checks.filter(c => c.ok).length, // simple ranking
      };
    });

    // Rank by score desc, then name
    results.sort((a, b) => b.score - a.score || a.program.name.localeCompare(b.program.name));
    res.json(results);
  } catch (e: any) {
    console.error("❌ GET /recommendations", e.message);
    res.status(500).json({ error: "Failed to compute recommendations" });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});



export default router;
