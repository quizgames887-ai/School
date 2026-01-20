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

async function seedClasses() {
  const academicYear = "2024-2025";
  
  const classes = [
    { name: "Grade 1", grade: "Grade 1", academicYear },
    { name: "Grade 2", grade: "Grade 2", academicYear },
    { name: "Grade 3", grade: "Grade 3", academicYear },
    { name: "Grade 4", grade: "Grade 4", academicYear },
    { name: "Grade 5", grade: "Grade 5", academicYear },
    { name: "Grade 6", grade: "Grade 6", academicYear },
  ];

  console.log(`Seeding ${classes.length} classes for ${academicYear}...`);

  for (const classData of classes) {
    try {
      const id = await client.mutation(api.mutations.classes.create, classData);
      console.log(`✓ Created class: ${classData.name} (${id})`);
    } catch (error) {
      console.error(`✗ Failed to create class ${classData.name}:`, error);
    }
  }

  console.log("Done seeding classes!");
}

seedClasses().catch(console.error);
