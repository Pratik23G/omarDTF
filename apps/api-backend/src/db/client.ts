import { fileURLToPath } from "node:url";
import path from "node:path";
import Database from "better-sqlite3";

const DB_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "data.db");

export const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    productId TEXT NOT NULL,
    authorName TEXT NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_reviews_productId ON reviews (productId);
`);

const { count } = db.prepare("SELECT COUNT(*) as count FROM reviews").get() as { count: number };
if (count === 0) {
  const seed = db.prepare(
    "INSERT INTO reviews (id, productId, authorName, rating, comment, createdAt) VALUES (@id, @productId, @authorName, @rating, @comment, @createdAt)",
  );
  seed.run({
    id: "rev_1",
    productId: "2",
    authorName: "Priya S.",
    rating: 5,
    comment: "Print quality is amazing and it survived a dozen washes with zero cracking. Ordered two more.",
    createdAt: "2026-08-14T10:00:00.000Z",
  });
  seed.run({
    id: "rev_2",
    productId: "2",
    authorName: "Marcus T.",
    rating: 4,
    comment: "Runs a little big, sized down and it fits great now. Fast turnaround too.",
    createdAt: "2026-08-22T16:30:00.000Z",
  });
}
