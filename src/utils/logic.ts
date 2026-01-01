import { Task, DerivedTask, Metrics } from '@/types';

// ✅ BUG 5 FIX
export const computeROI = (revenue?: number, time?: number): number => {
  if (!revenue || !time || time <= 0) return 0;
  return Number((revenue / time).toFixed(2));
};

// ✅ BUG 3 FIX
export const sortTasksStable = (tasks: Task[]): Task[] => {
  const priorityRank: Record<string, number> = {
    High: 3,
    Medium: 2,
    Low: 1,
  };

  return [...tasks].sort((a, b) => {
    const roiDiff = computeROI(b.revenue, b.timeTaken) - computeROI(a.revenue, a.timeTaken);
    if (roiDiff !== 0) return roiDiff;

    const pDiff = priorityRank[b.priority] - priorityRank[a.priority];
    if (pDiff !== 0) return pDiff;

    return a.title.localeCompare(b.title); // stable tie-breaker
  });
};

export const computeMetrics = (tasks: DerivedTask[]): Metrics => {
  const totalRevenue = tasks.reduce((s, t) => s + t.revenue, 0);
  const totalTimeTaken = tasks.reduce((s, t) => s + t.timeTaken, 0);
  const averageROI =
    tasks.length === 0
      ? 0
      : Number(
          (
            tasks.reduce((s, t) => s + t.roi, 0) / tasks.length
          ).toFixed(2)
        );

  return {
    totalRevenue,
    totalTimeTaken,
    averageROI,
  } as Metrics;
};
