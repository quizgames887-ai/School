/**
 * Script to seed default periods matching the Arabic school timetable format
 * Run with: npx tsx scripts/seed-periods.ts
 * 
 * This creates 7 periods + 1 break period matching the format:
 * - Period 1: 8:10 - 8:50
 * - Period 2: 8:50 - 9:30
 * - Period 3: 9:30 - 10:10
 * - Break: 10:10 - 10:35
 * - Period 4: 10:35 - 11:15
 * - Period 5: 11:15 - 11:55
 * - Period 6: 11:55 - 12:35
 * - Period 7: 12:35 - 13:15
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

const defaultPeriods = [
  {
    name: "First",
    nameAr: "الاولى",
    startTime: "08:10",
    endTime: "08:50",
    isBreak: false,
    order: 1,
  },
  {
    name: "Second",
    nameAr: "الثانية",
    startTime: "08:50",
    endTime: "09:30",
    isBreak: false,
    order: 2,
  },
  {
    name: "Third",
    nameAr: "الثالثة",
    startTime: "09:30",
    endTime: "10:10",
    isBreak: false,
    order: 3,
  },
  {
    name: "Break",
    nameAr: "فرصة",
    startTime: "10:10",
    endTime: "10:35",
    isBreak: true,
    order: 4,
  },
  {
    name: "Fourth",
    nameAr: "الرابعة",
    startTime: "10:35",
    endTime: "11:15",
    isBreak: false,
    order: 5,
  },
  {
    name: "Fifth",
    nameAr: "الخامسة",
    startTime: "11:15",
    endTime: "11:55",
    isBreak: false,
    order: 6,
  },
  {
    name: "Sixth",
    nameAr: "السادسة",
    startTime: "11:55",
    endTime: "12:35",
    isBreak: false,
    order: 7,
  },
  {
    name: "Seventh",
    nameAr: "السابعة",
    startTime: "12:35",
    endTime: "13:15",
    isBreak: false,
    order: 8,
  },
];

async function seedPeriods(academicYear: string = "2024-2025") {
  console.log(`Seeding periods for academic year: ${academicYear}`);
  
  // Check if periods already exist
  const existingPeriods = await client.query(api.queries.periods.getByAcademicYear, {
    academicYear,
  });

  if (existingPeriods.length > 0) {
    console.log(
      `Periods already exist for ${academicYear}. Found ${existingPeriods.length} periods.`
    );
    console.log("Skipping seed. Delete existing periods first if you want to re-seed.");
    return;
  }

  // Create periods
  for (const period of defaultPeriods) {
    try {
      const id = await client.mutation(api.mutations.periods.create, {
        ...period,
        academicYear,
      });
      console.log(`Created period: ${period.nameAr || period.name} (${id})`);
    } catch (error) {
      console.error(`Error creating period ${period.name}:`, error);
    }
  }

  console.log(`Successfully seeded ${defaultPeriods.length} periods for ${academicYear}`);
}

// Run if called directly
if (require.main === module) {
  const academicYear = process.argv[2] || "2024-2025";
  seedPeriods(academicYear)
    .then(() => {
      console.log("Done!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Error:", error);
      process.exit(1);
    });
}

export { seedPeriods };
