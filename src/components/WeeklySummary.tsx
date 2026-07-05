import { DailyLog } from "../types";
import { Award, BarChart2, Calendar, Target } from "lucide-react";

interface WeeklySummaryProps {
  logs: DailyLog[];
}

interface WeekStats {
  weekNum: number;
  daysRange: string;
  skyCount: number;
  multivitaminCount: number;
  omegaDinnerCount: number;
  eveningCount: number;
  totalHabitsCount: number;
  completedHabitsCount: number;
}

export default function WeeklySummary({ logs }: WeeklySummaryProps) {
  // Generate the 13 weeks stats
  const weeks: WeekStats[] = Array.from({ length: 13 }).map((_, i) => {
    const weekNum = i + 1;
    const startDay = i * 7 + 1;
    const endDay = weekNum === 13 ? 90 : startDay + 6;
    const daysRange = `Day ${startDay}–${endDay}`;

    // Get logs for this week
    const weekLogs = logs.filter(
      (l) => l.dayNumber >= startDay && l.dayNumber <= endDay
    );

    const skyCount = weekLogs.filter((l) => l.morningSky === "done").length;
    const multivitaminCount = weekLogs.filter((l) => l.multivitamin === "done").length;
    const omegaDinnerCount = weekLogs.filter((l) => l.omega3Dinner === "done").length;
    const eveningCount = weekLogs.filter((l) => l.eveningPractice === "done").length;

    // Additional month-tracker checks
    const stillnessCount = weekLogs.filter((l) => l.stillnessSitting === "done").length;
    const deepStudyCount = weekLogs.filter((l) => l.deepStudy === "done").length;
    const mobileCount = weekLogs.filter((l) => l.noMobileHours === "done").length;
    const revisionCount = weekLogs.filter((l) => l.revision === "done").length;

    const totalHabitsCount = weekLogs.length * 8; // 8 habits tracked per day
    const completedHabitsCount =
      skyCount +
      multivitaminCount +
      omegaDinnerCount +
      eveningCount +
      stillnessCount +
      deepStudyCount +
      mobileCount +
      revisionCount;

    return {
      weekNum,
      daysRange,
      skyCount,
      multivitaminCount,
      omegaDinnerCount,
      eveningCount,
      totalHabitsCount,
      completedHabitsCount
    };
  });

  const totalSky = weeks.reduce((sum, w) => sum + w.skyCount, 0);
  const totalMultivitamin = weeks.reduce((sum, w) => sum + w.multivitaminCount, 0);
  const totalOmegaDinner = weeks.reduce((sum, w) => sum + w.omegaDinnerCount, 0);
  const totalEvening = weeks.reduce((sum, w) => sum + w.eveningCount, 0);

  const overallCompletionRate =
    (weeks.reduce((sum, w) => sum + w.completedHabitsCount, 0) /
      (90 * 8)) *
    100;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6" id="weekly-summary-container">
      {/* Cards stats header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-100/60 flex items-center gap-3">
          <div className="p-2.5 bg-teal-500 text-white rounded-lg">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
              SKY Practices
            </span>
            <span className="text-xl font-bold text-teal-800">{totalSky} / 90</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100/60 flex items-center gap-3">
          <div className="p-2.5 bg-amber-500 text-white rounded-lg">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
              Multivitamin
            </span>
            <span className="text-xl font-bold text-amber-800">{totalMultivitamin} / 90</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100/60 flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500 text-white rounded-lg">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
              Omega-3 (Dinner)
            </span>
            <span className="text-xl font-bold text-indigo-800">{totalOmegaDinner} / 90</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-100/60 flex items-center gap-3">
          <div className="p-2.5 bg-rose-500 text-white rounded-lg">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
              Overall Routine Finish
            </span>
            <span className="text-xl font-bold text-rose-800">{overallCompletionRate.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Weekly Progress Summary</h3>
          <p className="text-xs text-slate-500">
            Real-time calculations of ticks for key roadmap habits each week. Goal is 7/7 ticks.
          </p>
        </div>
      </div>

      {/* Progress Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 uppercase tracking-wider font-semibold">
              <th className="p-4 font-semibold w-24">Week</th>
              <th className="p-4 font-semibold w-28">Days</th>
              <th className="p-4 font-semibold text-center text-teal-700 bg-teal-50/20">Morning SKY</th>
              <th className="p-4 font-semibold text-center text-amber-700 bg-amber-50/20">Multivitamin</th>
              <th className="p-4 font-semibold text-center text-indigo-700 bg-indigo-50/20">Omega-3 Dinner</th>
              <th className="p-4 font-semibold text-center text-rose-700 bg-rose-50/20">Evening Practice</th>
              <th className="p-4 font-semibold text-center">Week Performance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {weeks.map((week) => {
              const weekMax = week.weekNum === 13 ? 6 : 7;
              const completePercentage = week.totalHabitsCount > 0
                ? (week.completedHabitsCount / week.totalHabitsCount) * 100
                : 0;

              return (
                <tr key={week.weekNum} className="hover:bg-slate-50/80 transition-all" id={`week-row-${week.weekNum}`}>
                  <td className="p-4 font-bold text-slate-800">
                    Week {week.weekNum}
                  </td>
                  <td className="p-4 text-slate-500 font-medium">
                    {week.daysRange}
                  </td>
                  <td className="p-4 text-center font-semibold bg-teal-50/10 text-teal-800 text-sm">
                    {week.skyCount} <span className="text-[10px] text-slate-400 font-normal">/ {weekMax}</span>
                  </td>
                  <td className="p-4 text-center font-semibold bg-amber-50/10 text-amber-800 text-sm">
                    {week.multivitaminCount} <span className="text-[10px] text-slate-400 font-normal">/ {weekMax}</span>
                  </td>
                  <td className="p-4 text-center font-semibold bg-indigo-50/10 text-indigo-800 text-sm">
                    {week.omegaDinnerCount} <span className="text-[10px] text-slate-400 font-normal">/ {weekMax}</span>
                  </td>
                  <td className="p-4 text-center font-semibold bg-rose-50/10 text-rose-800 text-sm">
                    {week.eveningCount} <span className="text-[10px] text-slate-400 font-normal">/ {weekMax}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${completePercentage}%` }}
                        />
                      </div>
                      <span className="font-mono text-[10px] text-slate-500 w-10 text-right">
                        {completePercentage.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
            <tr className="bg-slate-50 font-bold border-t border-slate-200">
              <td className="p-4 text-slate-800">Total Ticks</td>
              <td className="p-4">90 Days</td>
              <td className="p-4 text-center text-teal-800 text-sm bg-teal-100/40">{totalSky} / 90</td>
              <td className="p-4 text-center text-amber-800 text-sm bg-amber-100/40">{totalMultivitamin} / 90</td>
              <td className="p-4 text-center text-indigo-800 text-sm bg-indigo-100/40">{totalOmegaDinner} / 90</td>
              <td className="p-4 text-center text-rose-800 text-sm bg-rose-100/40">{totalEvening} / 90</td>
              <td className="p-4 text-right text-slate-700 text-xs">
                {overallCompletionRate.toFixed(1)}% Core Completion
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
