import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ReportData } from "./reports";
import { getMonthLabel } from "./date-utils";

type JsPdfWithAutoTable = jsPDF & { lastAutoTable?: { finalY: number } };

export function exportReportPDF(report: ReportData): void {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: "a4",
  }) as JsPdfWithAutoTable;
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.text(
    `CRONOGRAMA ${getMonthLabel(report.year, report.month).toUpperCase()}`,
    pageWidth / 2,
    34,
    { align: "center" }
  );
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text("Pilates / Fisioterapia", pageWidth / 2, 50, { align: "center" });
  doc.setTextColor(17, 24, 39);

  const dayColumns = Array.from({ length: report.daysInMonth }, (_, i) => String(i + 1));
  const head = [["Paciente", ...dayColumns, "Total"]];
  const body = report.rows.map((row) => [
    // O estúdio precisa distinguir o avulso do paciente de pacote, então a nota vai
    // numa segunda linha da própria célula do nome.
    row.note ? `${row.patient.name}\n${row.note}` : row.patient.name,
    ...Array.from({ length: report.daysInMonth }, (_, i) =>
      row.daysDone.has(i + 1) ? "X" : ""
    ),
    String(row.total),
  ]);

  autoTable(doc, {
    startY: 64,
    head,
    body,
    styles: {
      fontSize: 7,
      cellPadding: 2,
      halign: "center",
      lineColor: [229, 231, 235],
      lineWidth: 0.5,
    },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "normal" },
    columnStyles: { 0: { halign: "left", cellWidth: 92 }, [report.daysInMonth + 1]: { fontStyle: "bold" } },
    theme: "grid",
  });

  const finalY = (doc.lastAutoTable?.finalY ?? 64) + 24;

  const totalsBody: [string, string][] = [
    ["Total de aulas realizadas", String(report.totals.totalRealizadas)],
    ["Aulas experimentais", String(report.totals.experimentais)],
    ["Atendimentos fisioterapêuticos", String(report.totals.fisioterapeuticos)],
    ["Total de aulas 1x na semana", String(report.totals.total1x)],
    ["Total de aulas 2x na semana", String(report.totals.total2x)],
    ["Total de aulas 3x na semana", String(report.totals.total3x)],
  ];

  autoTable(doc, {
    startY: finalY,
    body: totalsBody,
    styles: { fontSize: 9, cellPadding: 4, textColor: [17, 24, 39] },
    columnStyles: {
      0: { cellWidth: 220 },
      1: { cellWidth: 50, halign: "center", fontStyle: "bold" },
    },
    theme: "plain",
  });

  const fileName = `cronograma-${report.year}-${String(report.month).padStart(2, "0")}.pdf`;
  doc.save(fileName);
}
