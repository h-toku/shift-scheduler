"use client";

import { useActionState, useMemo, useState } from "react";
import type { ApplyShiftDecisionsState } from "@/app/admin-actions";

type DateRow = {
  key: string;
  label: string;
  isoDate: string;
};

type Staff = {
  id: string;
  name: string;
};

type PendingCell = {
  pendingText: string;
  pendingShiftIds: string[];
};

type CellDecision = {
  action: "approve" | "reject";
  pendingShiftIds: string[];
  staffId: string;
  staffName: string;
  date: string;
  pendingText: string;
  approvedText: string;
};

type ShiftApprovalGridProps = {
  storeId: string;
  staffs: Staff[];
  visibleDates: DateRow[];
  pendingMap: Record<string, Record<string, PendingCell>>;
  applyAction: (
    state: ApplyShiftDecisionsState,
    formData: FormData
  ) => Promise<ApplyShiftDecisionsState>;
};

const initialState: ApplyShiftDecisionsState = {
  ok: false,
  message: null,
  errors: [],
};

function cellKey(staffId: string, date: string) {
  return `${staffId}__${date}`;
}

export default function ShiftApprovalGrid({
  storeId,
  staffs,
  visibleDates,
  pendingMap,
  applyAction,
}: ShiftApprovalGridProps) {
  const [decisions, setDecisions] = useState<Record<string, CellDecision>>({});
  const [clientErrors, setClientErrors] = useState<string[]>([]);
  const [state, dispatch, isPending] = useActionState(applyAction, initialState);

  const rows = useMemo(() => {
    return visibleDates.map((date) => {
      return staffs.map((staff) => {
        const pending = pendingMap[date.isoDate]?.[staff.id] ?? { pendingText: "", pendingShiftIds: [] };
        const key = cellKey(staff.id, date.isoDate);
        const decision = decisions[key];
        return {
          key,
          staff,
          date,
          pendingText: decision?.pendingText ?? pending.pendingText,
          approvedText: decision?.approvedText ?? "",
          pendingShiftIds: decision?.pendingShiftIds ?? pending.pendingShiftIds,
          action: decision?.action ?? null,
        };
      });
    });
  }, [visibleDates, staffs, pendingMap, decisions]);

  function adopt(staffId: string, staffName: string, date: string, pendingText: string, pendingShiftIds: string[]) {
    const key = cellKey(staffId, date);
    setDecisions((current) => ({
      ...current,
      [key]: {
        action: "approve",
        pendingShiftIds,
        staffId,
        staffName,
        date,
        pendingText,
        approvedText: pendingText,
      },
    }));
  }

  function reject(staffId: string, staffName: string, date: string, pendingText: string, pendingShiftIds: string[]) {
    const key = cellKey(staffId, date);
    setDecisions((current) => ({
      ...current,
      [key]: {
        action: "reject",
        pendingShiftIds,
        staffId,
        staffName,
        date,
        pendingText: "",
        approvedText: "",
      },
    }));
  }

  function clearDecision(staffId: string, date: string) {
    const key = cellKey(staffId, date);
    setDecisions((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function buildPayload() {
    return Object.values(decisions).map((item) => ({
      staffId: item.staffId,
      staffName: item.staffName,
      date: item.date,
      pendingShiftIds: item.pendingShiftIds,
      action: item.action,
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const nextErrors: string[] = [];
    for (const item of Object.values(decisions)) {
      if (item.pendingShiftIds.length === 0) {
        nextErrors.push(`希望にないシフトを登録しようとしています（${item.staffName} / ${item.date}）`);
      }
    }
    if (nextErrors.length > 0) {
      event.preventDefault();
      setClientErrors(nextErrors);
      return;
    }
    setClientErrors([]);
  }

  const serializedDecisions = JSON.stringify(buildPayload());

  return (
    <form action={dispatch} onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="storeId" value={storeId} />
      <input type="hidden" name="decisions" value={serializedDecisions} />

      {clientErrors.length > 0 ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600">
          {clientErrors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      ) : null}

      {state.errors.length > 0 ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600">
          {state.errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      ) : null}

      {state.message ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          {state.message}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-[32px] border border-orange-100 bg-white shadow-lg shadow-orange-950/5">
        <div className="max-h-[46rem] overflow-auto">
          <table className="min-w-full border-separate border-spacing-0 text-xs">
            <thead>
              <tr className="text-center text-stone-600">
                <th className="sticky top-0 left-0 z-30 min-w-24 border-r border-b border-orange-100 bg-orange-50 px-3 py-3 text-left font-bold">
                  日付
                </th>
                {staffs.map((staff) => (
                  <th
                    key={staff.id}
                    className="sticky top-0 z-20 min-w-36 border-r border-b border-orange-100 bg-orange-50 px-2 py-2.5 font-bold last:border-r-0"
                  >
                    {staff.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleDates.map((date, dateIndex) => (
                <tr key={date.key} className={dateIndex % 2 === 0 ? "bg-white" : "bg-orange-50/30"}>
                  <td className="sticky left-0 z-10 border-r border-b border-orange-100 bg-inherit px-3 py-2.5 align-top font-bold text-stone-700">
                    {date.label}
                  </td>
                  {rows[dateIndex].map((cell) => (
                    <td key={cell.key} className="border-r border-b border-orange-100 p-2 align-top last:border-r-0">
                      <div className="space-y-2">
                        <div className="rounded-xl border border-orange-100 bg-orange-50/40 px-2 py-1.5">
                          <p className="text-[10px] font-bold tracking-[0.16em] text-orange-400">PENDING</p>
                          <p className="mt-1 min-h-5 text-xs font-bold text-stone-700">{cell.pendingText || " "}</p>
                        </div>
                        <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 px-2 py-1.5">
                          <p className="text-[10px] font-bold tracking-[0.16em] text-emerald-500">採用結果</p>
                          <p className="mt-1 min-h-5 text-xs font-bold text-stone-700">{cell.approvedText || " "}</p>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              adopt(
                                cell.staff.id,
                                cell.staff.name,
                                cell.date.isoDate,
                                cell.pendingText,
                                cell.pendingShiftIds
                              )
                            }
                            className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700"
                          >
                            採用
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              reject(
                                cell.staff.id,
                                cell.staff.name,
                                cell.date.isoDate,
                                cell.pendingText,
                                cell.pendingShiftIds
                              )
                            }
                            className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-700"
                          >
                            却下
                          </button>
                          <button
                            type="button"
                            onClick={() => clearDecision(cell.staff.id, cell.date.isoDate)}
                            className="rounded-lg border border-stone-200 bg-stone-50 px-2 py-1 text-[11px] font-bold text-stone-500"
                          >
                            解除
                          </button>
                        </div>
                        {cell.action ? (
                          <p className="text-[10px] font-bold text-stone-400">
                            操作: {cell.action === "approve" ? "採用" : "却下"}
                          </p>
                        ) : null}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <button
          disabled={isPending}
          className="rounded-2xl bg-orange-500 px-6 py-3 text-sm font-black text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "登録中..." : "登録"}
        </button>
      </div>
    </form>
  );
}
