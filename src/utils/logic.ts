import { Task, DerivedTask, Metrics } from '@/types';

/**
 * ✅ BUG 5 FIX
 * Safe ROI calculation
 */
export const computeROI = (revenue?: number, time?: number): number => {
  if (revenue == null || time == null || time <= 0) return 0;
  return Number((revenue / time).toFixed(2));
};

/**
 * ✅ BUG 3 FIX
 * Stable, deterministic task sorting
 */
export const sortTasksStable = (tasks: Task[]): Task[] => {
  const priorityRank: Record<string, number> = {
    High: 3,
    Medium: 2,
    Low: 1,
  };

  return [...tasks].sort((a, b) => {
    // Primary: ROI
    const roiDiff =
      computeROI(b.revenue, b.timeTaken) -
      computeROI(a.revenue, a.timeTaken);
    if (roiDiff !== 0) return roiDiff;

    // Secondary: Priority
    const pDiff =
      (priorityRank[b.priority] ?? 0) -
      (priorityRank[a.priority] ?? 0);
    if (pDiff !== 0) return pDiff;

    // Tertiary: Stable tie-breaker
    return a.title.localeCompare(b.title);
  });
};

/**
 * Metrics calculation
 */
export const computeMetrics = (tasks: DerivedTask[]): Metrics => {
  const totalRevenue = tasks.reduce((sum, t) => sum + t.revenue, 0);
  const totalTimeTaken = tasks.reduce((sum, t) => sum + t.timeTaken, 0);

  const averageROI =
    tasks.length === 0
      ? 0
      : Number(
          (
            tasks.reduce((sum, t) => sum + t.roi, 0) / tasks.length
          ).toFixed(2)
        );

  return {
    totalRevenue,
    totalTimeTaken,
    averageROI,
  } as Metrics;
};
