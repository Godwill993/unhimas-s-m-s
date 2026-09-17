/**
 * PDF Generation Service
 *
 * Uses pdf-lib for lightweight, server-side PDF generation.
 * No headless browser needed — ideal for free-tier hosting.
 */

import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont } from 'pdf-lib';
import type { StudentReportData } from './reportService.js';

const SCHOOL_NAME = process.env.SCHOOL_NAME || 'Cameroon Excellence Academy';
const SCHOOL_MOTTO = process.env.SCHOOL_MOTTO || 'Knowledge, Integrity, Excellence';

const COLORS = {
  primary: rgb(0.059, 0.09, 0.165),       // Deep navy
  accent: rgb(0.961, 0.62, 0.043),        // Gold
  text: rgb(0.1, 0.1, 0.1),
  lightText: rgb(0.4, 0.4, 0.4),
  headerBg: rgb(0.059, 0.09, 0.165),
  white: rgb(1, 1, 1),
  lightGray: rgb(0.95, 0.95, 0.95),
  border: rgb(0.8, 0.8, 0.8),
  pass: rgb(0.063, 0.725, 0.506),         // Green
  fail: rgb(0.957, 0.243, 0.365),         // Red
};

/**
 * Generate a PDF report card for a single student
 */
export async function generatePDF(report: StudentReportData): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const page = doc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();
  let y = height - 40;

  // ── School Header ──
  y = drawSchoolHeader(page, fontBold, font, width, y);

  // ── Student Info ──
  y -= 15;
  y = drawStudentInfo(page, fontBold, font, report, width, y);

  // ── Scores Table ──
  y -= 15;
  y = drawScoresTable(page, fontBold, font, report, width, y);

  // ── Summary ──
  y -= 15;
  y = drawSummary(page, fontBold, font, report, width, y);

  // ── Attendance ──
  y -= 15;
  y = drawAttendance(page, fontBold, font, report, width, y);

  // ── Discipline ──
  y -= 15;
  y = drawDiscipline(page, fontBold, font, report, width, y);

  // ── Footer ──
  drawFooter(page, font, report, width);

  const pdfBytes = await doc.save();
  return Buffer.from(pdfBytes);
}

function drawSchoolHeader(
  page: PDFPage, fontBold: PDFFont, font: PDFFont,
  width: number, y: number
): number {
  // School name
  const nameSize = 18;
  const nameWidth = fontBold.widthOfTextAtSize(SCHOOL_NAME, nameSize);
  page.drawText(SCHOOL_NAME, {
    x: (width - nameWidth) / 2,
    y,
    size: nameSize,
    font: fontBold,
    color: COLORS.primary,
  });

  y -= 18;

  // Motto
  const mottoSize = 10;
  const mottoWidth = font.widthOfTextAtSize(SCHOOL_MOTTO, mottoSize);
  page.drawText(SCHOOL_MOTTO, {
    x: (width - mottoWidth) / 2,
    y,
    size: mottoSize,
    font,
    color: COLORS.accent,
  });

  y -= 14;

  // "REPORT CARD" title
  const titleText = 'REPORT CARD';
  const titleSize = 14;
  const titleWidth = fontBold.widthOfTextAtSize(titleText, titleSize);
  page.drawText(titleText, {
    x: (width - titleWidth) / 2,
    y,
    size: titleSize,
    font: fontBold,
    color: COLORS.primary,
  });

  y -= 8;

  // Divider line
  page.drawLine({
    start: { x: 40, y },
    end: { x: width - 40, y },
    thickness: 2,
    color: COLORS.accent,
  });

  return y;
}

function drawStudentInfo(
  page: PDFPage, fontBold: PDFFont, font: PDFFont,
  report: StudentReportData, width: number, y: number
): number {
  const leftX = 50;
  const rightX = width / 2 + 20;
  const size = 10;
  const lineHeight = 16;

  const leftItems = [
    ['Name:', report.student.full_name],
    ['Code:', report.student.student_code],
    ['Class:', `${report.student.class_name}${report.student.stream ? ` (${report.student.stream})` : ''}`],
  ];

  const rightItems = [
    ['Year:', report.period.year],
    ['Period:', report.period.label],
    ['Gender:', report.student.gender || 'N/A'],
  ];

  for (let i = 0; i < Math.max(leftItems.length, rightItems.length); i++) {
    if (leftItems[i]) {
      page.drawText(leftItems[i][0], { x: leftX, y, size, font: fontBold, color: COLORS.text });
      page.drawText(leftItems[i][1], { x: leftX + 50, y, size, font, color: COLORS.text });
    }
    if (rightItems[i]) {
      page.drawText(rightItems[i][0], { x: rightX, y, size, font: fontBold, color: COLORS.text });
      page.drawText(rightItems[i][1], { x: rightX + 55, y, size, font, color: COLORS.text });
    }
    y -= lineHeight;
  }

  return y;
}

function drawScoresTable(
  page: PDFPage, fontBold: PDFFont, font: PDFFont,
  report: StudentReportData, width: number, y: number
): number {
  const marginX = 50;
  const tableWidth = width - 2 * marginX;
  const rowHeight = 18;
  const size = 9;

  // Column widths (relative to tableWidth)
  const cols = [
    { label: 'Subject', width: 0.30 },
    { label: 'Coeff', width: 0.10 },
    { label: 'Mark/20', width: 0.12 },
    { label: 'Mark×Coeff', width: 0.15 },
    { label: 'Grade', width: 0.10 },
    { label: 'Remark', width: 0.23 },
  ];

  // Header row background
  page.drawRectangle({
    x: marginX,
    y: y - rowHeight + 4,
    width: tableWidth,
    height: rowHeight,
    color: COLORS.primary,
  });

  // Header text
  let colX = marginX + 5;
  for (const col of cols) {
    page.drawText(col.label, {
      x: colX,
      y: y - rowHeight + 9,
      size: size,
      font: fontBold,
      color: COLORS.white,
    });
    colX += col.width * tableWidth;
  }

  y -= rowHeight;

  // Data rows
  for (let i = 0; i < report.subjects.length; i++) {
    const subject = report.subjects[i];

    // Alternating row background
    if (i % 2 === 0) {
      page.drawRectangle({
        x: marginX,
        y: y - rowHeight + 4,
        width: tableWidth,
        height: rowHeight,
        color: COLORS.lightGray,
      });
    }

    colX = marginX + 5;
    const rowData = [
      subject.name,
      subject.coefficient.toString(),
      subject.mark.toString(),
      subject.weighted_mark.toString(),
      subject.grade,
      subject.remark,
    ];

    for (let j = 0; j < rowData.length; j++) {
      const textColor = j === 2 ? (subject.mark >= 10 ? COLORS.pass : COLORS.fail) : COLORS.text;
      page.drawText(rowData[j], {
        x: colX,
        y: y - rowHeight + 9,
        size: size,
        font: j === 0 ? fontBold : font,
        color: textColor,
      });
      colX += cols[j].width * tableWidth;
    }

    y -= rowHeight;
  }

  // Bottom border
  page.drawLine({
    start: { x: marginX, y: y + 4 },
    end: { x: marginX + tableWidth, y: y + 4 },
    thickness: 1,
    color: COLORS.border,
  });

  return y;
}

function drawSummary(
  page: PDFPage, fontBold: PDFFont, font: PDFFont,
  report: StudentReportData, _width: number, y: number
): number {
  const x = 50;
  const size = 11;
  const lineHeight = 18;

  page.drawText('SUMMARY', {
    x, y, size: 12, font: fontBold, color: COLORS.primary,
  });
  y -= lineHeight;

  const avgColor = report.summary.weighted_average >= 10 ? COLORS.pass : COLORS.fail;

  page.drawText(`Weighted Average: ${report.summary.weighted_average}/20`, {
    x, y, size, font: fontBold, color: avgColor,
  });

  page.drawText(`Overall Grade: ${report.summary.overall_grade} — ${report.summary.overall_remark}`, {
    x: 280, y, size, font, color: COLORS.text,
  });
  y -= lineHeight;

  if (report.summary.class_rank !== null) {
    page.drawText(`Class Rank: ${report.summary.class_rank} out of ${report.summary.class_size}`, {
      x, y, size, font, color: COLORS.text,
    });
    y -= lineHeight;
  }

  return y;
}

function drawAttendance(
  page: PDFPage, fontBold: PDFFont, font: PDFFont,
  report: StudentReportData, _width: number, y: number
): number {
  const x = 50;
  const size = 10;
  const lineHeight = 16;

  page.drawText('ATTENDANCE', {
    x, y, size: 12, font: fontBold, color: COLORS.primary,
  });
  y -= lineHeight;

  const { present, absent, late, total } = report.attendance;
  page.drawText(
    `Present: ${present}  |  Absent: ${absent}  |  Late: ${late}  |  Total Sessions: ${total}`,
    { x, y, size, font, color: COLORS.text }
  );
  y -= lineHeight;

  return y;
}

function drawDiscipline(
  page: PDFPage, fontBold: PDFFont, font: PDFFont,
  report: StudentReportData, _width: number, y: number
): number {
  const x = 50;
  const size = 10;
  const lineHeight = 16;

  page.drawText('DISCIPLINARY REMARKS', {
    x, y, size: 12, font: fontBold, color: COLORS.primary,
  });
  y -= lineHeight;

  if (report.discipline.length === 0) {
    page.drawText('No incidents recorded.', { x, y, size, font, color: COLORS.pass });
    y -= lineHeight;
  } else {
    for (const record of report.discipline.slice(0, 5)) {
      const text = record.notes
        ? `${record.date} — ${record.type}: ${record.notes}`
        : `${record.date} — ${record.type}`;

      // Truncate long text
      const displayText = text.length > 80 ? text.substring(0, 77) + '...' : text;
      page.drawText(displayText, { x, y, size, font, color: COLORS.text });
      y -= lineHeight;
    }
  }

  return y;
}

function drawFooter(
  page: PDFPage, font: PDFFont,
  report: StudentReportData, width: number
): void {
  const y = 30;
  const size = 8;

  const dateText = `Generated: ${new Date(report.generatedAt).toLocaleDateString()}`;
  page.drawText(dateText, { x: 50, y, size, font, color: COLORS.lightText });

  const byText = `By: ${report.generatedBy}`;
  const byWidth = font.widthOfTextAtSize(byText, size);
  page.drawText(byText, { x: width - 50 - byWidth, y, size, font, color: COLORS.lightText });
}

/**
 * Merge multiple PDF buffers into a single PDF
 */
export async function mergePDFs(pdfBuffers: Buffer[]): Promise<Buffer> {
  const mergedDoc = await PDFDocument.create();

  for (const buffer of pdfBuffers) {
    const srcDoc = await PDFDocument.load(buffer);
    const pages = await mergedDoc.copyPages(srcDoc, srcDoc.getPageIndices());
    for (const page of pages) {
      mergedDoc.addPage(page);
    }
  }

  const mergedBytes = await mergedDoc.save();
  return Buffer.from(mergedBytes);
}
