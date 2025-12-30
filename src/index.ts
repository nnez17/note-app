import { Elysia } from "elysia";
import { staticPlugin } from "@elysiajs/static";
import { cors } from "@elysiajs/cors";

// Firebase Admin SDK types (manual implementation for Bun)
interface User {
  id: string;
  email: string;
  password: string;
  createdAt: string;
}

interface Note {
  id: string;
  title: string;
  content: string;
  userId: string;
  createdAt: string;
}

interface FirestoreResponse {
  documents?: any[];
  name?: string;
  fields?: any;
}

// Firebase REST API configuration
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAms8wQyV4Ucj7WsqKGrZutwFV5Fc1pzpI",
  authDomain: "note-app-40dae.firebaseapp.com",
  databaseURL:
    "https://note-app-40dae-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "note-app-40dae",
};

const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents`;

// Helper function to make Firestore requests
async function firestoreRequest(
  path: string,
  method: string = "GET",
  body?: any
): Promise<FirestoreResponse> {
  const url = `${FIRESTORE_URL}${path}`;
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Firestore error: ${error}`);
  }

  return response.json() as Promise<FirestoreResponse>;
}

// Convert Firestore document to simple object
function firestoreToObject(doc: any): any {
  if (!doc.fields) return null;

  const obj: any = { id: doc.name.split("/").pop() };

  for (const [key, value] of Object.entries(doc.fields)) {
    const field: any = value;
    if (field.stringValue !== undefined) obj[key] = field.stringValue;
    else if (field.integerValue !== undefined)
      obj[key] = parseInt(field.integerValue);
    else if (field.booleanValue !== undefined) obj[key] = field.booleanValue;
    else if (field.timestampValue !== undefined)
      obj[key] = field.timestampValue;
  }

  return obj;
}

// Convert object to Firestore format
function objectToFirestore(obj: any): any {
  const fields: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      fields[key] = { stringValue: value };
    } else if (typeof value === "number") {
      fields[key] = { integerValue: value };
    } else if (typeof value === "boolean") {
      fields[key] = { booleanValue: value };
    }
  }

  return { fields };
}

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

const app = new Elysia()
  .use(cors())

  // Auth Routes
  .post("/api/auth/register", async ({ body, set }) => {
    const { email, password } = body as { email: string; password: string };

    // Validation
    if (!email || !password) {
      set.status = 400;
      return { error: "Email and password are required" };
    }

    if (password.length < 6) {
      set.status = 400;
      return { error: "Password must be at least 6 characters" };
    }

    try {
      // Check if user exists
      const usersQuery = await firestoreRequest(`/users?pageSize=1000`);

      if (usersQuery.documents) {
        const existingUser = usersQuery.documents.find((doc: any) => {
          const user = firestoreToObject(doc);
          return user.email === email;
        });

        if (existingUser) {
          set.status = 400;
          return { error: "User already exists" };
        }
      }

      // Create new user
      const userId = generateId();
      const newUser = {
        email,
        password, // Note: In production, hash passwords!
        createdAt: new Date().toISOString(),
      };

      await firestoreRequest(
        `/users/${userId}`,
        "PATCH",
        objectToFirestore(newUser)
      );

      // Generate simple token
      const token = `token-${Date.now()}-${userId}`;

      return {
        user: { id: userId, email: newUser.email },
        token,
      };
    } catch (error: any) {
      console.error("Register error:", error);
      set.status = 500;
      return { error: "Registration failed: " + error.message };
    }
  })

  .post("/api/auth/login", async ({ body, set }) => {
    const { email, password } = body as { email: string; password: string };

    // Validation
    if (!email || !password) {
      set.status = 400;
      return { error: "Email and password are required" };
    }

    try {
      // Find user
      const usersQuery = await firestoreRequest(`/users?pageSize=1000`);

      let foundUser = null;
      if (usersQuery.documents) {
        for (const doc of usersQuery.documents) {
          const user = firestoreToObject(doc);
          if (user.email === email && user.password === password) {
            foundUser = user;
            break;
          }
        }
      }

      if (!foundUser) {
        set.status = 401;
        return { error: "Invalid credentials" };
      }

      const token = `token-${Date.now()}-${foundUser.id}`;

      return {
        user: { id: foundUser.id, email: foundUser.email },
        token,
      };
    } catch (error: any) {
      console.error("Login error:", error);
      set.status = 500;
      return { error: "Login failed: " + error.message };
    }
  })

  // Notes Routes
  .get("/api/notes", async ({ query, set }) => {
    const userId = query.userId || "";

    if (!userId) {
      return { notes: [] };
    }

    try {
      const notesQuery = await firestoreRequest(`/notes?pageSize=1000`);

      if (!notesQuery.documents) {
        return { notes: [] };
      }

      const userNotes = notesQuery.documents
        .map((doc: any) => firestoreToObject(doc))
        .filter((note: any) => note.userId === userId)
        .sort(
          (a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

      return { notes: userNotes };
    } catch (error: any) {
      console.error("Get notes error:", error);
      set.status = 500;
      return { error: "Failed to fetch notes: " + error.message };
    }
  })

  .post("/api/notes", async ({ body, set }) => {
    const { title, content, userId } = body as {
      title: string;
      content: string;
      userId: string;
    };

    if (!title || !content || !userId) {
      set.status = 400;
      return { error: "Missing required fields" };
    }

    try {
      const noteId = generateId();
      const newNote = {
        title,
        content,
        userId,
        createdAt: new Date().toISOString(),
      };

      await firestoreRequest(
        `/notes/${noteId}`,
        "PATCH",
        objectToFirestore(newNote)
      );

      return { note: { id: noteId, ...newNote } };
    } catch (error: any) {
      console.error("Create note error:", error);
      set.status = 500;
      return { error: "Failed to create note: " + error.message };
    }
  })

  .put("/api/notes/:id", async ({ params, body, set }) => {
    const id = params.id;
    const { title, content } = body as {
      title: string;
      content: string;
    };

    if (!title || !content) {
      set.status = 400;
      return { error: "Title and content are required" };
    }

    try {
      // Get existing note
      const existingDoc = await firestoreRequest(`/notes/${id}`);
      const existingNote = firestoreToObject(existingDoc);

      if (!existingNote) {
        set.status = 404;
        return { error: "Note not found" };
      }

      // Update note
      const updatedNote = {
        title,
        content,
        userId: existingNote.userId,
        createdAt: new Date().toISOString(),
      };

      await firestoreRequest(
        `/notes/${id}`,
        "PATCH",
        objectToFirestore(updatedNote)
      );

      return { note: { id, ...updatedNote } };
    } catch (error: any) {
      console.error("Update note error:", error);
      set.status = 500;
      return { error: "Failed to update note: " + error.message };
    }
  })

  .delete("/api/notes/:id", async ({ params, set }) => {
    const id = params.id;

    try {
      await firestoreRequest(`/notes/${id}`, "DELETE");
      return { success: true };
    } catch (error: any) {
      console.error("Delete note error:", error);
      set.status = 500;
      return { error: "Failed to delete note: " + error.message };
    }
  })

  // Health check endpoint
  .get("/api/health", async () => {
    try {
      const usersQuery = await firestoreRequest(`/users?pageSize=1`);
      const notesQuery = await firestoreRequest(`/notes?pageSize=1`);

      return {
        status: "ok",
        database: "firestore",
        connected: true,
      };
    } catch (error) {
      return {
        status: "error",
        database: "firestore",
        connected: false,
      };
    }
  })

  // Serve static files - must be last
  .use(
    staticPlugin({
      assets: "./public",
      prefix: "/",
    })
  )

  .listen(3000);

console.log(
  `🚀 ElysiaJS server running at http://${app.server?.hostname}:${app.server?.port}`
);
console.log(`📝 Note Keep API ready with Firebase Firestore!`);
console.log(`🔥 Firebase Project: ${FIREBASE_CONFIG.projectId}`);
