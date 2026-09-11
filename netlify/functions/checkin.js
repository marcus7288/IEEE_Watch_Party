import { getStore } from "@netlify/blobs";

const STORE_NAME = "ieee-checkin-submissions";
const BLOB_KEY = "submissions";

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: { "content-type": "application/json" }
  });
}

function isAdmin(url) {
  const key = url.searchParams.get("key");
  const expected = process.env.INSTRUCTOR_KEY;
  return Boolean(expected) && key === expected;
}

function publicShape(entry) {
  return {
    name: entry.name,
    school: entry.school === "Other" ? (entry.schoolOther || "Other") : entry.school
  };
}

function fullShape(entry) {
  return {
    name: entry.name,
    school: entry.school === "Other" ? (entry.schoolOther || "Other") : entry.school,
    instructorCourse: entry.instructorCourse || "",
    companies: entry.companies || "",
    takeaway: entry.takeaway || "",
    email: entry.email || "",
    submittedAt: entry.submittedAt
  };
}

export default async (req) => {
  const url = new URL(req.url);
  const store = getStore(STORE_NAME);
  const admin = isAdmin(url);

  if (req.method === "GET") {
    const list = (await store.get(BLOB_KEY, { type: "json" })) || [];
    const ordered = list.slice().reverse();
    const body = {
      count: list.length,
      list: ordered.map(publicShape)
    };
    if (admin) body.full = ordered.map(fullShape);
    return jsonResponse(body);
  }

  if (req.method === "POST") {
    let payload;
    try {
      payload = await req.json();
    } catch (e) {
      return jsonResponse({ error: "Invalid request." }, 400);
    }

    const name = String(payload.name || "").trim();
    const school = String(payload.school || "").trim();
    if (!name || !school) {
      return jsonResponse({ error: "Name and school are required." }, 400);
    }
    const schoolOther = String(payload.schoolOther || "").trim();
    if (school === "Other" && !schoolOther) {
      return jsonResponse({ error: "Please specify your school." }, 400);
    }

    const entry = {
      id: Date.now() + "-" + Math.random().toString(36).slice(2, 8),
      name,
      school,
      schoolOther,
      instructorCourse: String(payload.instructorCourse || "").trim(),
      companies: String(payload.companies || "").trim(),
      takeaway: String(payload.takeaway || "").trim(),
      email: String(payload.email || "").trim(),
      submittedAt: new Date().toISOString()
    };

    // Blobs has no built-in compare-and-set here, so this is a short
    // read-modify-write retry rather than a true atomic transaction.
    // Fine for a room of students checking in over a few hours; a burst
    // of truly simultaneous submits could in rare cases race.
    let saved = false;
    for (let attempt = 0; attempt < 3 && !saved; attempt++) {
      const current = (await store.get(BLOB_KEY, { type: "json" })) || [];
      const next = current.concat([entry]);
      try {
        await store.setJSON(BLOB_KEY, next);
        saved = true;
      } catch (e) {
        if (attempt === 2) {
          return jsonResponse({ error: "Could not save, please try again." }, 500);
        }
      }
    }

    return jsonResponse({ ok: true, id: entry.id });
  }

  if (req.method === "DELETE") {
    if (!admin) {
      return jsonResponse({ error: "Not authorized." }, 403);
    }
    await store.setJSON(BLOB_KEY, []);
    return jsonResponse({ ok: true });
  }

  return jsonResponse({ error: "Method not allowed" }, 405);
};

export const config = {
  path: "/.netlify/functions/checkin"
};
