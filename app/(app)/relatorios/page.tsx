"use client";

import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { PageContent, PageHeader } from "@/components/layout/Page";
import { PageSpinner } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { ReportTable } from "@/components/reports/ReportTable";
import { ReportTotals } from "@/components/reports/ReportTotals";
import { useToast } from "@/components/ui/ToastProvider";
import { getPatients, getSessions } from "@/lib/db";
import { buildReport } from "@/lib/reports";
import { exportReportPDF } from "@/lib/pdf";
import { getMonthLabel } from "@/lib/date-utils";
import type { Patient, Session } from "@/lib/types";

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export default function RelatoriosPage() {
  const { showToast } = useToast();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<{ patients: Patient[]; sessions: Session[] } | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    Promise.all([getPatients(), getSessions()])
      .then(([patients, sessions]) => setData({ patients, sessions }))
      .catch((error) => {
        console.error(error);
        setData({ patients: [], sessions: [] });
        showToast("error", "Não foi possível carregar o relatório.");
      });
  }, [showToast]);

  const report = useMemo(() => {
    if (!data) return null;
    return buildReport(data.patients, data.sessions, year, month);
  }, [data, year, month]);

  const yearOptions = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  function handleExport() {
    if (!report) return;
    setExporting(true);
    setTimeout(() => {
      exportReportPDF(report);
      setExporting(false);
      showToast("success", "PDF exportado.");
    }, 0);
  }

  return (
    <>
      <PageHeader
        title="Relatórios"
        description="Espelho do cronograma mensal para prestação de contas ao estúdio"
        action={
          <Button
            onClick={handleExport}
            loading={exporting}
            disabled={!report || report.rows.length === 0}
          >
            <Download size={16} />
            Exportar PDF
          </Button>
        }
      />
      <PageContent className="space-y-6">
        <div className="flex flex-wrap gap-3">
          <Select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="w-auto"
          >
            {MONTH_NAMES.map((name, idx) => (
              <option key={name} value={idx + 1}>
                {name}
              </option>
            ))}
          </Select>
          <Select value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-auto">
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
        </div>

        {!report && <PageSpinner />}

        {report && (
          <>
            <ReportTotals totals={report.totals} />
            <div>
              <h2 className="mb-3 text-sm font-medium text-foreground">
                Cronograma {getMonthLabel(report.year, report.month)}
              </h2>
              <ReportTable report={report} />
            </div>
          </>
        )}
      </PageContent>
    </>
  );
}
