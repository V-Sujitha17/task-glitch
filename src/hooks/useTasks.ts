import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Task, DerivedTask, Metrics } from '@/types';
import {
  computeMetrics,
  computeROI,
  sortTasksStable,
} from '@/utils/logic';

const STORAGE_KEY = 'taskglitch_tasks';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [lastDeleted, setLastDeleted] = useState<Task | null>(null);

  // ✅ BUG 1 FIX: prevent double fetch
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setTasks(JSON.parse(raw));
      }
    } catch (e) {
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  // Persist tasks
  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }
  }, [tasks, loading]);

  const addTask = useCallback((task: Omit<Task, 'id'> & { id?: string }) => {
    setTasks((prev) => [
      {
        ...task,
        id: task.id ?? crypto.randomUUID(),
      },
      ...prev,
    ]);
  }, []);

  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch } : t))
    );
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => {
      const target = prev.find((t) => t.id === id) || null;
      setLastDeleted(target);
      return prev.filter((t) => t.id !== id);
    });
  }, []);

  const undoDelete = useCallback(() => {
    if (!lastDeleted) return;
    setTasks((prev) => [lastDeleted, ...prev]);
    setLastDeleted(null);
  }, [lastDeleted]);

  // ✅ BUG 2 FIX
  const clearLastDeleted = useCallback(() => {
    setLastDeleted(null);
  }, []);

  // ✅ BUG 3 SUPPORT: stable sort
  const derivedSorted: DerivedTask[] = useMemo(() => {
    return sortTasksStable(tasks).map((t) => ({
      ...t,
      roi: computeROI(t.revenue, t.timeTaken),
    }));
  }, [tasks]);

  const metrics: Metrics = useMemo(() => {
    return computeMetrics(derivedSorted);
  }, [derivedSorted]);

  return {
    tasks,
    loading,
    error,
    derivedSorted,
    metrics,
    lastDeleted,
    addTask,
    updateTask,
    deleteTask,
    undoDelete,
    clearLastDeleted,
  };
}
