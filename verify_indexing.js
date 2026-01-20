/**
 * MongoDB Auto-Grader for Advanced Indexing (Prac-04)
 * Verifies the existence of specific indexes and data presence.
 */

const { MongoClient } = require("mongodb");
const fs = require("fs");

const MONGO_URL = "mongodb://localhost:27017";
const DB_NAME = "movieDB";
const SUBMISSION_FILE = "solution_indexing.mongodb";

async function verify() {
  let score = 0;
  const report = [];

  // 1. Static File Check (Look for explain() usage)
  try {
    const content = fs.readFileSync(SUBMISSION_FILE, "utf8");
    if (content.includes("explain")) {
        score += 5;
        report.push("Static Check: PASS (Usage of explain() found)");
    } else {
        report.push("Static Check: FAIL (explain() not used in script)");
    }
  } catch (err) {
    console.error("CRITICAL: solution_indexing.mongodb not found!");
    process.exit(1);
  }

  const client = new MongoClient(MONGO_URL);
  
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const movies = db.collection("movies");
    
    // 2. Data Verification
    const count = await movies.countDocuments();
    if (count >= 15) {
        score += 10;
        report.push(`Task 0: PASS (Found ${count} movies)`);
    } else {
        report.push(`Task 0: FAIL (Found ${count} movies, expected 15+)`);
    }

    // Fetch all indexes
    const indexes = await movies.indexes();
    const indexKeys = indexes.map(i => JSON.stringify(i.key));

    // 3. Rating Index (Task 2) -> Key: { rating: 1 }
    if (indexKeys.includes('{"rating":1}')) {
        score += 15;
        report.push("Task 2: PASS (Index on 'rating' found)");
    } else {
        report.push("Task 2: FAIL (Index on 'rating' missing)");
    }

    // 4. Year Index (Task 3) -> Key: { year: 1 }
    if (indexKeys.includes('{"year":1}')) {
        score += 15;
        report.push("Task 3: PASS (Index on 'year' found)");
    } else {
        report.push("Task 3: FAIL (Index on 'year' missing)");
    }

    // 5. Compound Index (Task 4) -> Key: { director: 1, year: 1 }
    if (indexKeys.includes('{"director":1,"year":1}')) {
        score += 15;
        report.push("Task 4: PASS (Compound Index 'director + year' found)");
    } else {
        report.push("Task 4: FAIL (Compound Index missing)");
    }

    // 6. Text Index (Task 6) -> Key contains _fts: "text"
    const hasTextIndex = indexes.some(i => i.key._fts === "text");
    if (hasTextIndex) {
        score += 20;
        report.push("Task 6: PASS (Text Index on 'plot' found)");
    } else {
        report.push("Task 6: FAIL (Text Index missing)");
    }

  } catch (err) {
    report.push("DB Connection Error: " + err.message);
  } finally {
    await client.close();
  }

  /* -------------------------------------------------
     FINAL REPORT
  ------------------------------------------------- */
  console.log("========== Indexing Lab Auto-Report ==========");
  report.forEach(r => console.log(r));
  console.log("----------------------------------------------");
  console.log(`TOTAL SCORE: ${score} / 80`);

  // Pass if score is decent (allow some partial failures)
  process.exit(score >= 50 ? 0 : 1);
}

verify();
