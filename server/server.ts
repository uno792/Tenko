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
        "id,name,aps_requirement,application_open,application_close,universities:universities(name,abbreviation)"
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
        "id,user_id,program_id,status,deadline,submitted_at,notes,program:programs(id,name,aps_requirement,application_close,universities:universities(name,abbreviation))"
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

    const { data, error } = await supabase
      .from("applications")
      .insert({
        user_id,
        program_id,
        status: "planning",
        deadline,
      })
      .select("*")
      .single();

    if (error) throw error;
    return res.status(201).json(data);
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

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});



export default router;
