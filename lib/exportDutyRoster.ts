/**
 * Export duty roster to Excel (xlsx) and PDF (jspdf-autotable).
 * Uses dynamic data passed from the roster table.
 */

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export type DutyType = { _id: string; name: string; requiredTeachers: number };
export type AssignmentCell = { id: string; teacherId: string }[];
export type TeacherById = Map<string, { name: string }>;

export function buildRosterRows(
  weekDates: string[],
  dutyTypes: DutyType[],
  assignmentsByDateAndType: Map<string, AssignmentCell>,
  teacherById: TeacherById,
  configWorkingDays: number[]
): { date: string; dayName: string; isWorking: boolean; cells: string[] }[] {
  return weekDates.map((dateStr) => {
    const d = new Date(dateStr);
    const dayOfWeek = d.getDay();
    const isWorking = configWorkingDays.includes(dayOfWeek);
    const cells = dutyTypes.map((dt) => {
      const key = `${dateStr}-${dt._id}`;
      const list = assignmentsByDateAndType.get(key) ?? [];
      return list
        .map((a) => teacherById.get(a.teacherId)?.name ?? "—")
        .join(", ") || (isWorking ? "—" : "");
    });
    return {
      date: dateStr,
      dayName: DAY_NAMES[dayOfWeek],
      isWorking,
      cells,
    };
  });
}

export async function exportDutyRosterToExcel(
  weekDates: string[],
  dutyTypes: DutyType[],
  assignmentsByDateAndType: Map<string, AssignmentCell>,
  teacherById: TeacherById,
  configWorkingDays: number[],
  filename = "duty-roster.xlsx"
): Promise<void> {
  const XLSX = await import("xlsx");
  const rows = buildRosterRows(
    weekDates,
    dutyTypes,
    assignmentsByDateAndType,
    teacherById,
    configWorkingDays
  );
  const headerRow = ["Date", "Day", ...dutyTypes.map((dt) => dt.name)];
  const dataRows = rows.map((r) => [
    r.date,
    r.dayName,
    ...r.cells,
  ]);
  const aoa = [headerRow, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Roster");
  XLSX.writeFile(wb, filename);
}

export async function exportDutyRosterToPDF(
  weekDates: string[],
  dutyTypes: DutyType[],
  assignmentsByDateAndType: Map<string, AssignmentCell>,
  teacherById: TeacherById,
  configWorkingDays: number[],
  filename = "duty-roster.pdf"
): Promise<void> {
  const jspdfMod = await import("jspdf");
  const jsPDF =
    (jspdfMod as { default?: unknown }).default ??
    (jspdfMod as { jsPDF?: unknown }).jsPDF;
  if (typeof jsPDF !== "function") {
    throw new Error("jsPDF could not be loaded. Try refreshing the page.");
  }
  const rows = buildRosterRows(
    weekDates,
    dutyTypes,
    assignmentsByDateAndType,
    teacherById,
    configWorkingDays
  );
  const DocClass = jsPDF as new (opts?: Record<string, string>) => {
    setFontSize: (n: number) => void;
    text: (t: string, x: number, y: number, opts?: { maxWidth?: number }) => void;
    save: (name: string) => void;
    getTextWidth: (t: string) => number;
  };
  const doc = new DocClass({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });
  const pageW = 297;
  const pageH = 210;
  const margin = 10;
  const fontSize = 8;
  const rowHeight = 6;
  const colWidth = Math.max(20, (pageW - 2 * margin - 22 - 12) / Math.max(1, dutyTypes.length));

  doc.setFontSize(14);
  doc.text("Duty Roster", margin, 12);
  doc.setFontSize(fontSize);

  const headers = ["Date", "Day", ...dutyTypes.map((dt) => dt.name)];
  let y = 18;
  let x = margin;
  headers.forEach((h, i) => {
    const w = i === 0 ? 22 : i === 1 ? 12 : colWidth;
    const text = String(h).slice(0, 15);
    doc.text(text, x, y);
    x += w;
  });
  y += rowHeight;

  for (const r of rows) {
    x = margin;
    const rowCells = [r.date, r.dayName, ...r.cells];
    rowCells.forEach((cell, i) => {
      const w = i === 0 ? 22 : i === 1 ? 12 : colWidth;
      const text = String(cell).slice(0, 18);
      if (y > pageH - 15) {
        (doc as { addPage?: (format?: string, orientation?: string) => void }).addPage?.("a4", "landscape");
        y = 15;
      }
      doc.text(text, x, y, { maxWidth: w - 2 });
      x += w;
    });
    y += rowHeight;
  }

  doc.save(filename);
}
