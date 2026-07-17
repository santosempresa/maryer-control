import type { ReportData } from "@/lib/reports";

export function ReportTable({ report }: { report: ReportData }) {
  const dayNumbers = Array.from({ length: report.daysInMonth }, (_, i) => i + 1);

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-white">
      <table className="min-w-max border-collapse text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 min-w-[140px] border-b border-r border-border bg-background-alt px-3 py-2 text-left font-medium text-muted">
              Paciente
            </th>
            {dayNumbers.map((day) => (
              <th
                key={day}
                className="w-7 border-b border-border bg-background-alt px-1 py-2 text-center font-medium text-muted"
              >
                {day}
              </th>
            ))}
            <th className="w-14 border-b border-border bg-background-alt px-2 py-2 text-center font-medium text-muted">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {report.rows.map((row) => (
            <tr key={row.patient.id}>
              <td className="sticky left-0 z-10 border-b border-r border-border bg-white px-3 py-2 text-foreground">
                <span className="font-medium">{row.patient.name}</span>
                {row.note && (
                  <span className="mt-0.5 block text-[10px] font-normal text-warning">
                    {row.note}
                  </span>
                )}
              </td>
              {dayNumbers.map((day) => (
                <td key={day} className="border-b border-border px-1 py-2 text-center">
                  {row.daysDone.has(day) ? <span className="font-medium text-success">X</span> : null}
                </td>
              ))}
              <td className="border-b border-border px-2 py-2 text-center font-medium text-foreground">
                {row.total}
              </td>
            </tr>
          ))}
          {report.rows.length === 0 && (
            <tr>
              <td colSpan={dayNumbers.length + 2} className="px-3 py-8 text-center text-muted">
                Nenhuma sessão realizada neste período.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
