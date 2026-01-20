/**
 * Migration script to convert lectures from classId to sectionId
 * Run with: npx tsx scripts/migrate-lectures-to-sections.ts
 * 
 * This script:
 * 1. Finds all lectures with classId but no sectionId
 * 2. Tries to find a matching section by grade and academicYear
 * 3. Updates the lecture with the sectionId
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

// Load environment variables from .env.local
const envPath = resolve(__dirname, "../.env.local");
let convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl && require("fs").existsSync(envPath)) {
  const envContent = readFileSync(envPath, "utf-8");
  const match = envContent.match(/NEXT_PUBLIC_CONVEX_URL=(.+)/);
  if (match) {
    convexUrl = match[1].trim();
  }
}

if (!convexUrl) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL environment variable is required. Set it in .env.local or as an environment variable.");
}

const client = new ConvexHttpClient(convexUrl);

async function migrateLectures() {
  console.log("Starting migration of lectures from classId to sectionId...");
  
  // Get all lectures
  const lectures = await client.query(api.queries.lectures.getAll, {});
  
  // Filter lectures that have classId but no sectionId
  const lecturesToMigrate = lectures.filter((lecture: any) => 
    lecture.classId && !lecture.sectionId
  );
  
  console.log(`Found ${lecturesToMigrate.length} lectures to migrate`);
  
  if (lecturesToMigrate.length === 0) {
    console.log("No lectures need migration. All done!");
    return;
  }
  
  // Get all sections
  const sections = await client.query(api.queries.sections.getAll, {});
  
  let migrated = 0;
  let failed = 0;
  
  for (const lecture of lecturesToMigrate) {
    try {
      // Get the class data
      if (!lecture.classId) {
        console.log(`⚠ Lecture ${lecture._id}: No classId found, skipping`);
        continue;
      }
      const classData = await client.query(api.queries.classes.getById, {
        id: lecture.classId
      });
      
      if (!classData) {
        console.log(`⚠ Lecture ${lecture._id}: Class ${lecture.classId} not found, skipping`);
        failed++;
        continue;
      }
      
      // Find matching section by grade and academicYear
      const matchingSection = sections.find((section: any) => 
        section.grade === classData.grade && 
        section.academicYear === lecture.academicYear
      );
      
      if (!matchingSection) {
        console.log(`⚠ Lecture ${lecture._id}: No matching section found for grade "${classData.grade}" and year "${lecture.academicYear}"`);
        failed++;
        continue;
      }
      
      // Update the lecture with sectionId
      await client.mutation(api.mutations.lectures.update, {
        id: lecture._id,
        sectionId: matchingSection._id,
      });
      
      console.log(`✓ Migrated lecture ${lecture._id}: classId ${lecture.classId} → sectionId ${matchingSection._id} (${matchingSection.name})`);
      migrated++;
    } catch (error) {
      console.error(`✗ Failed to migrate lecture ${lecture._id}:`, error);
      failed++;
    }
  }
  
  console.log(`\nMigration complete!`);
  console.log(`  Migrated: ${migrated}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Total: ${lecturesToMigrate.length}`);
}

migrateLectures().catch(console.error);
