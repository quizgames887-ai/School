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
  const { jsPDF } = await import("jspdf");
  const { autoTable } = await import("jspdf-autotable");
  const rows = buildRosterRows(
    weekDates,
    dutyTypes,
    assignmentsByDateAndType,
    teacherById,
    configWorkingDays
  );
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  doc.setFontSize(14);
  doc.text("Duty Roster", 14, 12);
  doc.setFontSize(10);
  const headers = ["Date", "Day", ...dutyTypes.map((dt) => dt.name)];
  const body = rows.map((r) => [r.date, r.dayName, ...r.cells]);
  autoTable(doc, {
    head: [headers],
    body,
    startY: 18,
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 12 },
      ...Object.fromEntries(
        dutyTypes.map((_, i) => [i + 2, { cellWidth: 35 }])
      ),
    },
  });
  doc.save(filename);
}
