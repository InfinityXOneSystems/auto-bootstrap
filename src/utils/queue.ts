/**
 * Task Queue Manager
 * Manages agent task queue with priorities and concurrency control
 */

import { EventEmitter } from "events";
import { AgentTask, TaskStatus, TaskPriority } from "../types/index.js";

export class TaskQueue extends EventEmitter {
  private queue: AgentTask[] = [];
  private running: Map<string, AgentTask> = new Map();
  private completed: Map<string, AgentTask> = new Map();
  private maxConcurrent: number;

  constructor(maxConcurrent = 5) {
    super();
    this.maxConcurrent = maxConcurrent;
  }

  /**
   * Add task to queue
   */
  public enqueue(task: AgentTask): void {
    this.queue.push(task);
    this.sortQueue();
    this.emit("task_queued", task);
    this.processQueue();
  }

  /**
   * Get task by ID
   */
  public getTask(taskId: string): AgentTask | undefined {
    // Check running tasks
    if (this.running.has(taskId)) {
      return this.running.get(taskId);
    }

    // Check completed tasks
    if (this.completed.has(taskId)) {
      return this.completed.get(taskId);
    }

    // Check queued tasks
    return this.queue.find((t) => t.id === taskId);
  }

  /**
   * Get all tasks
   */
  public getAllTasks(): AgentTask[] {
    return [
      ...this.queue,
      ...Array.from(this.running.values()),
      ...Array.from(this.completed.values()),
    ];
  }

  /**
   * Get queue stats
   */
  public getStats() {
    return {
      queued: this.queue.length,
      running: this.running.size,
      completed: this.completed.size,
      max_concurrent: this.maxConcurrent,
    };
  }

  /**
   * Mark task as started
   */
  public startTask(taskId: string): void {
    const taskIndex = this.queue.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) return;

    const task = this.queue.splice(taskIndex, 1)[0];
    task.status = "running";
    task.started_at = new Date().toISOString();

    this.running.set(taskId, task);
    this.emit("task_started", task);
  }

  /**
   * Complete task
   */
  public completeTask(taskId: string, result?: unknown, error?: string): void {
    const task = this.running.get(taskId);
    if (!task) return;

    task.status = error ? "failed" : "completed";
    task.completed_at = new Date().toISOString();
    task.result = result;
    task.error = error;

    this.running.delete(taskId);
    this.completed.set(taskId, task);

    this.emit(error ? "task_failed" : "task_completed", task);
    this.processQueue();
  }

  /**
   * Cancel task
   */
  public cancelTask(taskId: string): boolean {
    // Check if in queue
    const queueIndex = this.queue.findIndex((t) => t.id === taskId);
    if (queueIndex !== -1) {
      const task = this.queue.splice(queueIndex, 1)[0];
      task.status = "cancelled";
      task.completed_at = new Date().toISOString();
      this.completed.set(taskId, task);
      this.emit("task_cancelled", task);
      return true;
    }

    // Cannot cancel running tasks (would need agent cooperation)
    return false;
  }

  /**
   * Process queue (start tasks if slots available)
   */
  private processQueue(): void {
    while (this.running.size < this.maxConcurrent && this.queue.length > 0) {
      const task = this.queue[0];
      this.startTask(task.id);
    }
  }

  /**
   * Sort queue by priority
   */
  private sortQueue(): void {
    const priorityMap: Record<TaskPriority, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    };

    this.queue.sort((a, b) => {
      const priorityDiff = priorityMap[b.priority] - priorityMap[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // If same priority, sort by creation time (FIFO)
      return (
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    });
  }

  /**
   * Clear old completed tasks
   */
  public cleanup(maxAge = 24 * 60 * 60 * 1000): number {
    const now = Date.now();
    let removed = 0;

    for (const [id, task] of this.completed.entries()) {
      if (task.completed_at) {
        const age = now - new Date(task.completed_at).getTime();
        if (age > maxAge) {
          this.completed.delete(id);
          removed++;
        }
      }
    }

    return removed;
  }
}
