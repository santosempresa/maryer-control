"use client";

import { useRef, useState } from "react";
import clsx from "clsx";
import { ChevronLeft, ChevronRight, GripVertical } from "lucide-react";
import { MoveSessionSheet, type PendingMove } from "@/components/sessions/MoveSessionSheet";
import {
  addDaysISO,
  formatDisplayDate,
  getJsDay,
  getWeekDatesISO,
  timeToMinutes,
  todayISO,
} from "@/lib/date-utils";
import type { Patient, Session, SessionStatus } from "@/lib/types";

interface WeekViewProps {
  sessions: Session[];
  patients: Patient[];
  selectedDate: string;
  onSelectedDateChange: (date: string) => void;
  onSelectSession: (date: string) => void;
  onChange: () => void;
}

const DAY_LABELS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const STATUS_LABEL: Record<SessionStatus, string> = {
  pending: "Pendente",
  done: "Realizado",
  rescheduled: "Remarcado",
  missed: "Falta",
};

const STATUS_DOT: Record<SessionStatus, string> = {
  pending: "bg-gray-300",
  done: "bg-success",
  rescheduled: "bg-info",
  missed: "bg-danger",
};

const STATUS_CELL: Record<SessionStatus, string> = {
  pending: "bg-gray-50 border-gray-200 text-gray-600",
  done: "bg-green-50 border-green-200 text-success",
  rescheduled: "bg-blue-50 border-blue-200 text-info",
  missed: "bg-red-50 border-red-200 text-danger",
};

// Distância a partir da qual o gesto vira arrasto em vez de clique.
const DRAG_THRESHOLD_PX = 6;

interface DragState {
  session: Session;
  patient: Patient;
  x: number;
  y: number;
  target: { date: string; time: string } | null;
}

function cellUnder(x: number, y: number): { date: string; time: string } | null {
  const element = document.elementFromPoint(x, y);
  const cell = element?.closest<HTMLElement>("[data-cell-date]");
  const date = cell?.dataset.cellDate;
  const time = cell?.dataset.cellTime;
  return date && time ? { date, time } : null;
}

export function WeekView({
  sessions,
  patients,
  selectedDate,
  onSelectedDateChange,
  onSelectSession,
  onChange,
}: WeekViewProps) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);
  const startRef = useRef<{ x: number; y: number; session: Session; patient: Patient } | null>(null);
  const draggedRef = useRef(false);

  const weekDates = getWeekDatesISO(selectedDate);
  const patientById = new Map(patients.map((p) => [p.id, p]));
  const weekSessions = sessions.filter((s) => weekDates.includes(s.scheduled_date));

  const times = Array.from(new Set(weekSessions.map((s) => s.scheduled_time))).sort(
    (a, b) => timeToMinutes(a) - timeToMinutes(b)
  );

  function sessionsAt(date: string, time: string) {
    return weekSessions.filter((s) => s.scheduled_date === date && s.scheduled_time === time);
  }

  // Uma sessão remarcada é só o rastro da original: quem carrega o atendimento de
  // verdade é a que a substituiu, então mover o rastro não faria sentido.
  function canDrag(session: Session) {
    return session.status !== "rescheduled";
  }

  function handlePointerDown(e: React.PointerEvent, session: Session, patient: Patient) {
    if (!canDrag(session)) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    draggedRef.current = false;
    startRef.current = { x: e.clientX, y: e.clientY, session, patient };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    const start = startRef.current;
    if (!start) return;
    const moved = Math.hypot(e.clientX - start.x, e.clientY - start.y);
    if (!draggedRef.current && moved < DRAG_THRESHOLD_PX) return;
    draggedRef.current = true;
    setDrag({
      session: start.session,
      patient: start.patient,
      x: e.clientX,
      y: e.clientY,
      target: cellUnder(e.clientX, e.clientY),
    });
  }

  function handlePointerUp(e: React.PointerEvent) {
    const start = startRef.current;
    startRef.current = null;
    setDrag(null);
    if (!start || !draggedRef.current) return;

    const target = cellUnder(e.clientX, e.clientY);
    const { session, patient } = start;
    const sameSlot =
      target && target.date === session.scheduled_date && target.time === session.scheduled_time;
    if (!target || sameSlot) return;

    setPendingMove({
      session,
      patientName: patient.name,
      toDate: target.date,
      toTime: target.time,
    });
  }

  function handlePointerCancel() {
    startRef.current = null;
    draggedRef.current = false;
    setDrag(null);
  }

  function handleClick(session: Session) {
    // O pointerup do arrasto ainda dispara o clique do botão: sem isso, soltar o card
    // levaria pra visão do dia junto.
    if (draggedRef.current) {
      draggedRef.current = false;
      return;
    }
    onSelectSession(session.scheduled_date);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between rounded-xl border border-border bg-white px-3 py-2.5">
        <button
          type="button"
          onClick={() => onSelectedDateChange(addDaysISO(selectedDate, -7))}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-background-alt"
          aria-label="Semana anterior"
        >
          <ChevronLeft size={18} />
        </button>
        <p className="text-sm font-medium text-foreground">
          Semana de {formatDisplayDate(weekDates[0])} a {formatDisplayDate(weekDates[6])}
        </p>
        <button
          type="button"
          onClick={() => onSelectedDateChange(addDaysISO(selectedDate, 7))}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-background-alt"
          aria-label="Próxima semana"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {times.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-white px-4 py-10 text-center text-sm text-muted">
          Nenhuma sessão prevista nesta semana.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-white">
          <table className="w-full min-w-[720px] border-collapse text-xs">
            <thead>
              <tr>
                <th className="w-16 border-b border-r border-border bg-background-alt px-2 py-2" />
                {weekDates.map((date) => {
                  const count = weekSessions.filter((s) => s.scheduled_date === date).length;
                  return (
                    <th
                      key={date}
                      className={clsx(
                        "min-w-[110px] border-b border-border px-2 py-2 text-center font-medium",
                        date === todayISO() ? "bg-blue-50 text-primary" : "text-muted"
                      )}
                    >
                      <div>{DAY_LABELS_SHORT[getJsDay(date)]}</div>
                      <div className="text-[11px] font-normal">{formatDisplayDate(date)}</div>
                      <div className="mt-1 text-[11px] font-normal tabular-nums">
                        {count === 0 ? (
                          <span className="text-muted/60">sem atendimento</span>
                        ) : (
                          <span>
                            {count} {count === 1 ? "atendimento" : "atendimentos"}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {times.map((time) => (
                <tr key={time}>
                  <td className="border-b border-r border-border bg-background-alt px-2 py-2 text-center font-medium text-muted">
                    {time}
                  </td>
                  {weekDates.map((date) => {
                    const cellSessions = sessionsAt(date, time);
                    const isTarget =
                      drag?.target?.date === date && drag?.target?.time === time;
                    return (
                      <td
                        key={date}
                        data-cell-date={date}
                        data-cell-time={time}
                        className={clsx(
                          "border-b border-border px-1.5 py-1.5 align-top transition-colors",
                          isTarget && "bg-primary/10 outline outline-2 -outline-offset-2 outline-primary"
                        )}
                      >
                        <div className="flex min-h-[28px] flex-col gap-1">
                          {cellSessions.map((s) => {
                            const patient = patientById.get(s.patient_id);
                            if (!patient) return null;
                            const draggable = canDrag(s);
                            const isBeingDragged = drag?.session.id === s.id;
                            return (
                              <button
                                key={s.id}
                                type="button"
                                onPointerDown={(e) => handlePointerDown(e, s, patient)}
                                onPointerMove={handlePointerMove}
                                onPointerUp={handlePointerUp}
                                onPointerCancel={handlePointerCancel}
                                onClick={() => handleClick(s)}
                                style={draggable ? { touchAction: "none" } : undefined}
                                className={clsx(
                                  "flex items-center gap-1 rounded-md border px-1.5 py-1 text-left text-[11px] font-medium transition-colors hover:brightness-95",
                                  STATUS_CELL[s.status],
                                  draggable && "cursor-grab active:cursor-grabbing",
                                  isBeingDragged && "opacity-40"
                                )}
                                title={
                                  draggable
                                    ? `${patient.name} (arraste para outro dia ou horário)`
                                    : patient.name
                                }
                              >
                                {draggable && (
                                  <GripVertical size={11} className="shrink-0 opacity-50" />
                                )}
                                <span className="truncate">{patient.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {times.length > 0 && (
        <p className="mt-3 text-xs text-muted">
          Arraste um card para outro dia ou horário para corrigir onde o atendimento aconteceu,
          inclusive em dias que já passaram. Clique no card para abrir o dia.
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted">
        {(Object.keys(STATUS_LABEL) as SessionStatus[]).map((status) => (
          <div key={status} className="flex items-center gap-1.5">
            <span className={clsx("h-2.5 w-2.5 rounded-full", STATUS_DOT[status])} />
            {STATUS_LABEL[status]}
          </div>
        ))}
      </div>

      {drag && (
        <div
          className="pointer-events-none fixed z-[80] -translate-x-1/2 -translate-y-1/2 rounded-md border border-primary bg-white px-2 py-1 text-[11px] font-medium text-foreground shadow-lg"
          style={{ left: drag.x, top: drag.y }}
        >
          {drag.patient.name}
        </div>
      )}

      {pendingMove && (
        <MoveSessionSheet
          key={`${pendingMove.session.id}-${pendingMove.toDate}-${pendingMove.toTime}`}
          move={pendingMove}
          onClose={() => setPendingMove(null)}
          onDone={() => {
            setPendingMove(null);
            onChange();
          }}
        />
      )}
    </div>
  );
}
