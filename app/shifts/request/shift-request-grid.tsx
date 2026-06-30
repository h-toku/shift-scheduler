"use client";

import { useActionState, useMemo, useState } from "react";
import type { UpsertPendingShiftRequestsState } from "@/app/admin-actions";

type Staff = {
  id: string;
  name: string;
};

type DateRow = {
  key: string;
  isoDate: string;
  date: Date;
};

type PendingCell = {
  pendingText: string;
  startTime: string;
  endTime: string;
};

type ShiftRequestGridProps = {
  editableStaffIds: string[];
  staffs: Staff[];
  visibleDates: DateRow[];
  pendingMap: Record<string, Record<string, PendingCell>>;
  submitAction: (
    state: UpsertPendingShiftRequestsState,
    formData: FormData
  ) => Promise<UpsertPendingShiftRequestsState>;
};

const initialState: UpsertPendingShiftRequestsState = {
  ok: false,
  message: null,
  errors: [],
};

function isValidTimeText(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export default function ShiftRequestGrid({
  editableStaffIds,
  staffs,
  visibleDates,
  pendingMap,
  submitAction,
}: ShiftRequestGridProps) {
  const [state, dispatch, isPending] = useActionState(submitAction, initialState);
  const [clientErrors, setClientErrors] = useState<string[]>([]);

  const [editableMap, setEditableMap] = useState<Record<string, { startTime: string; endTime: string }>>(() => {
    const seed: Record<string, { startTime: string; endTime: string }> = {};
    for (const date of visibleDates) {
      for (const staffId of editableStaffIds) {
        const key = `${staffId}__${date.isoDate}`;
        const pending = pendingMap[date.isoDate]?.[staffId];
        seed[key] = {
          startTime: pending?.startTime ?? "",
          endTime: pending?.endTime ?? "",
        };
      }
    }
    return seed;
  });

  const payload = useMemo(() => {
    return JSON.stringify(
      visibleDates.flatMap((date) =>
        editableStaffIds.map((staffId) => ({
          staffId,
          date: date.isoDate,
          startTime: editableMap[`${staffId}__${date.isoDate}`]?.startTime ?? "",
          endTime: editableMap[`${staffId}__${date.isoDate}`]?.endTime ?? "",
        }))
      )
    );
  }, [editableMap, editableStaffIds, visibleDates]);

  function updateTime(staffId: string, date: string, field: "startTime" | "endTime", value: string) {
    const key = `${staffId}__${date}`;
    setEditableMap((current) => ({
      ...current,
      [key]: {
        ...(current[key] ?? { startTime: "", endTime: "" }),
        [field]: value,
      },
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const errors: string[] = [];
    for (const staffId of editableStaffIds) {
      for (const date of visibleDates) {
        const value = editableMap[`${staffId}__${date.isoDate}`] ?? { startTime: "", endTime: "" };
        const start = value.startTime.trim();
        const end = value.endTime.trim();

        if (!start && !end) continue;
        if (!start || !end) {
          errors.push(`${date.isoDate}: 開始・終了時刻を両方入力してください。`);
          continue;
        }
        if (!isValidTimeText(start) || !isValidTimeText(end)) {
          errors.push(`${date.isoDate}: HH:mm形式で入力してください。`);
          continue;
        }
        if (start >= end) {
          errors.push(`${date.isoDate}: 開始時刻は終了時刻より前にしてください。`);
        }
      }
    }

    if (errors.length > 0) {
      event.preventDefault();
      setClientErrors(errors);
      return;
    }

    setClientErrors([]);
  }

  return (
    <form action={dispatch} onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="requests" value={payload} />

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
                    className={`sticky top-0 z-20 min-w-40 border-r border-b border-orange-100 px-2 py-2.5 font-bold last:border-r-0 ${
                      editableStaffIds.includes(staff.id) ? "bg-emerald-50 text-emerald-700" : "bg-orange-50"
                    }`}
                  >
                    {staff.name}
                    {editableStaffIds.includes(staff.id) ? "（編集可）" : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleDates.map((date, dateIndex) => (
                <tr key={date.key} className={dateIndex % 2 === 0 ? "bg-white" : "bg-orange-50/30"}>
                  <td className="sticky left-0 z-10 border-r border-b border-orange-100 bg-inherit px-3 py-2.5 align-top font-bold text-stone-700">
                    <div>{date.date.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })}</div>
                    <div className="text-[10px] font-bold tracking-[0.16em] text-stone-400">
                      {date.date.toLocaleDateString("ja-JP", { weekday: "short" })}
                    </div>
                  </td>
                  {staffs.map((staff) => {
                    const pendingText = pendingMap[date.isoDate]?.[staff.id]?.pendingText ?? "";
                    if (!editableStaffIds.includes(staff.id)) {
                      return (
                        <td
                          key={`${staff.id}-${date.isoDate}`}
                          className="border-r border-b border-orange-100 px-2 py-2 align-top font-medium text-stone-600 last:border-r-0"
                        >
                          <div className="rounded-xl border border-orange-100 bg-orange-50/40 px-2 py-1.5">
                            <p className="text-[10px] font-bold tracking-[0.16em] text-orange-400">PENDING</p>
                            <p className="mt-1 min-h-5 text-xs font-bold text-stone-700">{pendingText || " "}</p>
                          </div>
                        </td>
                      );
                    }

                    const editable = editableMap[`${staff.id}__${date.isoDate}`] ?? { startTime: "", endTime: "" };
                    return (
                      <td
                        key={`${staff.id}-${date.isoDate}`}
                        className="border-r border-b border-emerald-100 bg-emerald-50/20 px-2 py-2 align-top last:border-r-0"
                      >
                        <div className="space-y-2">
                          <div className="rounded-xl border border-orange-100 bg-orange-50/40 px-2 py-1.5">
                            <p className="text-[10px] font-bold tracking-[0.16em] text-orange-400">PENDING</p>
                            <p className="mt-1 min-h-5 text-xs font-bold text-stone-700">{pendingText || " "}</p>
                          </div>
                          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5">
                            <input
                              type="time"
                              value={editable.startTime}
                              onChange={(event) => updateTime(staff.id, date.isoDate, "startTime", event.target.value)}
                              className="rounded-lg border border-emerald-200 bg-white px-2 py-1.5 text-xs font-bold text-stone-700"
                            />
                            <span className="text-xs font-bold text-emerald-500">-</span>
                            <input
                              type="time"
                              value={editable.endTime}
                              onChange={(event) => updateTime(staff.id, date.isoDate, "endTime", event.target.value)}
                              className="rounded-lg border border-emerald-200 bg-white px-2 py-1.5 text-xs font-bold text-stone-700"
                            />
                          </div>
                        </div>
                      </td>
                    );
                  })}
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
