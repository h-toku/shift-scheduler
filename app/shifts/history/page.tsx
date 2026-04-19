import Link from "next/link";
import HomeShell from "../../home-shell";
import prisma from "@/lib/prisma";
import { getAccessibleStores, pickSelectedStoreId, requireCurrentStaff } from "@/lib/auth";
import { getNavigationItems } from "@/lib/navigation";

type ShiftHistoryPageProps = {
  searchParams: Promise<{ year?: string | string[]; month?: string | string[]; storeId?: string | string[] }>;
};

type ShiftCellMap = Record<string, Record<string, string>>;

function pickParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function createMonthDate(yearParam: string | string[] | undefined, monthParam: string | string[] | undefined) {
  const today = new Date();
  const previousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

  const year = Number(pickParam(yearParam));
  const month = Number(pickParam(monthParam));

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return previousMonth;
  }

  return new Date(year, month - 1, 1);
}

function shiftMonth(baseDate: Date, delta: number) {
  return new Date(baseDate.getFullYear(), baseDate.getMonth() + delta, 1);
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isSameDate(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function getSpringEquinoxDay(year: number) {
  return Math.floor(20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
}

function getAutumnEquinoxDay(year: number) {
  return Math.floor(23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4));
}

function getNthMonday(year: number, monthIndex: number, nth: number) {
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const firstMonday = firstDay === 1 ? 1 : 9 - firstDay;
  return firstMonday + (nth - 1) * 7;
}

function getJapaneseHolidayName(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const fixedHolidays = new Map([
    ["1-1", "元日"],
    ["2-11", "建国記念の日"],
    ["2-23", "天皇誕生日"],
    ["4-29", "昭和の日"],
    ["5-3", "憲法記念日"],
    ["5-4", "みどりの日"],
    ["5-5", "こどもの日"],
    ["8-11", "山の日"],
    ["11-3", "文化の日"],
    ["11-23", "勤労感謝の日"],
  ]);

  const fixedHoliday = fixedHolidays.get(`${month}-${day}`);
  if (fixedHoliday) return fixedHoliday;

  if (month === 1 && day === getNthMonday(year, 0, 2)) return "成人の日";
  if (month === 7 && day === getNthMonday(year, 6, 3)) return "海の日";
  if (month === 9 && day === getNthMonday(year, 8, 3)) return "敬老の日";
  if (month === 10 && day === getNthMonday(year, 9, 2)) return "スポーツの日";
  if (month === 3 && day === getSpringEquinoxDay(year)) return "春分の日";
  if (month === 9 && day === getAutumnEquinoxDay(year)) return "秋分の日";

  return null;
}

function isJapaneseHoliday(date: Date) {
  if (getJapaneseHolidayName(date)) return true;

  const previousDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);
  if (date.getDay() === 1 && getJapaneseHolidayName(previousDate)) {
    return true;
  }

  if (date.getDay() !== 2) return false;

  const yesterday = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);
  const dayBeforeYesterday = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 2);

  return Boolean(
    getJapaneseHolidayName(dayBeforeYesterday) &&
      getJapaneseHolidayName(yesterday) &&
      !getJapaneseHolidayName(date)
  );
}

function getRowTone(date: Date, today: Date) {
  const isToday = isSameDate(date, today);
  const isHoliday = isJapaneseHoliday(date);
  const isSunday = date.getDay() === 0;
  const isSaturday = date.getDay() === 6;

  let tone = "bg-white hover:bg-orange-50/60";
  if (isSaturday) tone = "bg-sky-50 hover:bg-sky-100/70";
  if (isSunday || isHoliday) tone = "bg-rose-50 hover:bg-rose-100/70";
  if (isToday) tone += " ring-2 ring-orange-300 ring-inset";

  return tone;
}

function getStickyDateCellTone(date: Date) {
  const isHoliday = isJapaneseHoliday(date);
  const isSunday = date.getDay() === 0;
  const isSaturday = date.getDay() === 6;

  if (isSunday || isHoliday) return "bg-rose-50";
  if (isSaturday) return "bg-sky-50";
  return "bg-white";
}

function getDateList(monthStart: Date) {
  const dates: Date[] = [];
  const month = monthStart.getMonth();
  const cursor = new Date(monthStart);

  while (cursor.getMonth() === month) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

function formatShiftTime(date: Date) {
  return date.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildHistoryHref(monthDate: Date, storeId: string) {
  const params = new URLSearchParams({
    year: String(monthDate.getFullYear()),
    month: String(monthDate.getMonth() + 1),
    storeId,
  });

  return `/shifts/history?${params.toString()}`;
}

export default async function ShiftHistoryPage({ searchParams }: ShiftHistoryPageProps) {
  const actor = await requireCurrentStaff();
  const resolvedParams = await searchParams;
  const accessibleStores = await getAccessibleStores(actor.role, actor.storeId, actor.store.companyId);

  const selectedStoreId = pickSelectedStoreId(
    resolvedParams.storeId,
    accessibleStores.map((store) => store.id),
    actor.storeId
  );
  const selectedStore = accessibleStores.find((store) => store.id === selectedStoreId) ?? actor.store;

  const selectedMonthStart = createMonthDate(resolvedParams.year, resolvedParams.month);
  const nextMonthStart = shiftMonth(selectedMonthStart, 1);
  const previousMonthStart = shiftMonth(selectedMonthStart, -1);
  const followingMonthStart = shiftMonth(selectedMonthStart, 1);
  const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const storeStaffs = await prisma.staff.findMany({
    where: { storeId: selectedStoreId },
    orderBy: [{ deletedAt: "asc" }, { role: "asc" }, { name: "asc" }],
  });

  const shifts = await prisma.shift.findMany({
    where: {
      staffId: {
        in: storeStaffs.map((staff) => staff.id),
      },
      status: "APPROVED",
      date: {
        gte: selectedMonthStart,
        lt: nextMonthStart,
      },
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  const shiftedStaffIds = new Set(shifts.map((shift) => shift.staffId));
  const staffList = storeStaffs.filter((staff) => staff.deletedAt === null || shiftedStaffIds.has(staff.id));

  const shiftMap = shifts.reduce<ShiftCellMap>((acc, shift) => {
    const dateKey = formatDateKey(new Date(shift.date));
    acc[dateKey] ??= {};

    const value = `${formatShiftTime(new Date(shift.startTime))} - ${formatShiftTime(new Date(shift.endTime))}`;
    acc[dateKey][shift.staffId] = acc[dateKey][shift.staffId]
      ? `${acc[dateKey][shift.staffId]} / ${value}`
      : value;

    return acc;
  }, {});

  const visibleDates = getDateList(selectedMonthStart);
  const monthLabel = selectedMonthStart.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
  });
  const today = new Date();
  const navigationItems = getNavigationItems(actor.role);

  return (
    <HomeShell
      staffName={actor.name}
      storeName={actor.store.name}
      navigationItems={navigationItems}
      currentPath="/shifts/history"
    >
      <div className="mb-8 rounded-[32px] border border-orange-100 bg-white p-8 shadow-xl shadow-orange-950/5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.32em] text-orange-400">Shift History</p>
            <h2 className="mt-3 text-3xl font-black text-stone-800">{monthLabel}の過去シフト</h2>
            <p className="mt-3 text-sm font-medium text-stone-500">
              {selectedStore.name}
              {selectedStore.deletedAt ? " / 削除済み店舗" : ""}
              {selectedStore.company ? ` / ${selectedStore.company.name}` : ""}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:items-end">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={buildHistoryHref(previousMonthStart, selectedStoreId)}
                className="rounded-2xl border border-orange-100 px-4 py-3 text-sm font-bold text-stone-500 hover:text-orange-600"
              >
                前月
              </Link>
              <Link
                href={buildHistoryHref(currentMonthStart, selectedStoreId)}
                className="rounded-2xl border border-orange-100 px-4 py-3 text-sm font-bold text-stone-500 hover:text-orange-600"
              >
                今月
              </Link>
              <Link
                href={buildHistoryHref(followingMonthStart, selectedStoreId)}
                className="rounded-2xl border border-orange-100 px-4 py-3 text-sm font-bold text-stone-500 hover:text-orange-600"
              >
                翌月
              </Link>
            </div>

            <form className="flex flex-wrap items-center gap-3" method="get">
              <label className="text-sm font-bold text-stone-500" htmlFor="historyYear">
                年
              </label>
              <select
                id="historyYear"
                name="year"
                defaultValue={String(selectedMonthStart.getFullYear())}
                className="rounded-2xl border border-orange-100 bg-orange-50/60 px-4 py-3 text-sm font-bold text-stone-700"
              >
                {Array.from({ length: 5 }, (_, index) => currentMonthStart.getFullYear() - 2 + index).map((year) => (
                  <option key={year} value={year}>
                    {year}年
                  </option>
                ))}
              </select>

              <label className="text-sm font-bold text-stone-500" htmlFor="historyMonth">
                月
              </label>
              <select
                id="historyMonth"
                name="month"
                defaultValue={String(selectedMonthStart.getMonth() + 1)}
                className="rounded-2xl border border-orange-100 bg-orange-50/60 px-4 py-3 text-sm font-bold text-stone-700"
              >
                {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
                  <option key={month} value={month}>
                    {month}月
                  </option>
                ))}
              </select>

              <label className="text-sm font-bold text-stone-500" htmlFor="historyStoreId">
                店舗
              </label>
              <select
                id="historyStoreId"
                name="storeId"
                defaultValue={selectedStoreId}
                className="rounded-2xl border border-orange-100 bg-orange-50/60 px-4 py-3 text-sm font-bold text-stone-700"
              >
                {accessibleStores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}{store.deletedAt ? "（削除済み）" : ""}
                  </option>
                ))}
              </select>

              <button className="rounded-2xl border border-orange-100 px-4 py-3 text-sm font-bold text-stone-500 hover:text-orange-600">
                表示
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[32px] border border-orange-100 bg-white shadow-lg shadow-orange-950/5">
        <div className="max-h-[46rem] overflow-auto">
          <table className="min-w-full border-separate border-spacing-0 text-xs">
            <thead>
              <tr className="text-center text-stone-600">
                <th className="sticky top-0 left-0 z-30 min-w-24 border-r border-b border-orange-100 bg-orange-50 px-3 py-3 text-left font-bold">
                  日付
                </th>
                {staffList.map((staff) => (
                  <th
                    key={staff.id}
                    className={`sticky top-0 z-20 min-w-20 border-r border-b border-orange-100 px-1.5 py-2.5 font-bold leading-tight break-words last:border-r-0 ${
                      staff.deletedAt ? "bg-stone-200 text-stone-500" : "bg-orange-50"
                    }`}
                  >
                    {staff.name}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {visibleDates.map((date) => {
                const dateKey = formatDateKey(date);
                const holiday = isJapaneseHoliday(date);
                const dayLabel = date.toLocaleDateString("ja-JP", { weekday: "short" });
                const isToday = isSameDate(date, today);

                return (
                  <tr key={dateKey} className={getRowTone(date, today)}>
                    <td
                      className={`sticky left-0 z-10 border-r border-b border-orange-100 px-3 py-2.5 align-top shadow-[8px_0_16px_-16px_rgba(0,0,0,0.18)] ${getStickyDateCellTone(date)}`}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-stone-800">
                          {date.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })}
                        </span>
                        <span className="text-[10px] font-bold tracking-[0.16em] text-stone-400">
                          {dayLabel}
                          {holiday ? " HOLIDAY" : ""}
                          {isToday ? " TODAY" : ""}
                        </span>
                      </div>
                    </td>

                    {staffList.map((staff) => (
                      <td
                        key={staff.id}
                        className={`border-r border-b border-orange-100 px-1.5 py-2 align-top font-medium last:border-r-0 ${
                          staff.deletedAt ? "bg-stone-100 text-stone-500" : "text-stone-600"
                        }`}
                      >
                        {shiftMap[dateKey]?.[staff.id] || ""}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </HomeShell>
  );
}
