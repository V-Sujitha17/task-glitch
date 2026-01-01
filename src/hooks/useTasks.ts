import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Task, DerivedTask } from '@/types';
import { computeROI, sortTasksStable, computeMetrics } from '@/utils/logic';

const STORAGE_KEY = 'task-glitch-tasks';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);
  const [lastDeleted, setLastDeleted] = useState<Task | null>(null);

  const didLoad = useRef(false); // ✅ BUG 1 FIX

  useEffect(() => {
    if (didLoad.current) return;
    didLoad.current = true;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      setTasks(stored ? JSON.parse(stored) : []);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const addTask = useCallback((task: Omit<Task, 'id'> & { id?: string }) => {
    setTasks(prev => [
      ...prev,
      { ...task, id: task.id ?? crypto.randomUUID() },
    ]);
  }, []);

  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, ...patch } : t))
    );
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => {
      const found = prev.find(t => t.id === id) || null;
      setLastDeleted(found);
      return prev.filter(t => t.id !== id);
    });
  }, []);

  const undoDelete = useCallback(() => {
    if (!lastDeleted) return;
    setTasks(prev => [...prev, lastDeleted]);
    setLastDeleted(null);
  }, [lastDeleted]);

  const clearLastDeleted = useCallback(() => {
    setLastDeleted(null);
  }, []);

  const derivedSorted: DerivedTask[] = useMemo(() => {
    return sortTasksStable(tasks).map(t => ({
      ...t,
      roi: computeROI(t.revenue, t.timeTaken),
    }));
  }, [tasks]);

  const metrics = useMemo(() => computeMetrics(derivedSorted), [derivedSorted]);

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
