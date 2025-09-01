import supabase from "./supabaseClient";
import express from "express";
import type { Request, Response } from 'express';
import cors from "cors";

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

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
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

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});


export default router;
