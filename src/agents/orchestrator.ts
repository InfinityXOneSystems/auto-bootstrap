/**
 * Agent Orchestrator
 * Coordinates multiple agents and manages task distribution
 */

import { EventEmitter } from "events";
import { v4 as uuidv4 } from "uuid";
import { ResearchAgent } from "./research.js";
import { TaskQueue } from "../utils/queue.js";
import { AgentTask, ResearchTask, AgentInfo } from "../types/index.js";

export class AgentOrchestrator extends EventEmitter {
  private researchAgents: ResearchAgent[] = [];
  private taskQueue: TaskQueue;
  private isRunning = false;

  constructor(maxConcurrent = 5) {
    super();
    this.taskQueue = new TaskQueue(maxConcurrent);

    // Create initial research agents
    for (let i = 0; i < 3; i++) {
      this.addResearchAgent();
    }

    this.setupEventHandlers();
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.taskQueue.on("task_started", (task: AgentTask) => {
      this.emit("task_started", task);
      this.assignTaskToAgent(task);
    });

    this.taskQueue.on("task_completed", (task: AgentTask) => {
      this.emit("task_completed", task);
    });

    this.taskQueue.on("task_failed", (task: AgentTask) => {
      this.emit("task_failed", task);
    });
  }

  /**
   * Add research agent
   */
  private addResearchAgent(): ResearchAgent {
    const agent = new ResearchAgent();
    this.researchAgents.push(agent);

    agent.on("task_completed", ({ task, result }) => {
      this.taskQueue.completeTask(task.id, result);
    });

    agent.on("task_failed", ({ task, error }) => {
      this.taskQueue.completeTask(task.id, undefined, String(error));
    });

    return agent;
  }

  /**
   * Submit research task
   */
  public async submitResearchTask(
    query: string,
    options?: {
      max_depth?: number;
      max_results?: number;
      priority?: "low" | "medium" | "high" | "critical";
    }
  ): Promise<string> {
    const taskId = uuidv4();

    const researchTask: ResearchTask = {
      id: taskId,
      type: "research",
      query,
      max_depth: options?.max_depth || 3,
      max_results: options?.max_results || 10,
    };

    const agentTask: AgentTask = {
      id: taskId,
      type: "research",
      status: "pending",
      priority: options?.priority || "medium",
      created_at: new Date().toISOString(),
      payload: researchTask,
    };

    this.taskQueue.enqueue(agentTask);

    return taskId;
  }

  /**
   * Assign task to available agent
   */
  private async assignTaskToAgent(task: AgentTask): Promise<void> {
    if (task.type === "research") {
      const availableAgent = this.researchAgents.find((a) => a.isAvailable());

      if (availableAgent) {
        const researchTask = task.payload as ResearchTask;
        // Fire and forget - agent will emit events when done
        availableAgent.executeResearch(researchTask).catch((error) => {
          console.error(`Agent execution error for task ${task.id}:`, error);
        });
      } else {
        // No agents available - task will remain in running state
        // This should be handled by adding more agents or task timeout
        console.warn(`No available agents for task ${task.id}`);
      }
    }
  }

  /**
   * Get task status
   */
  public getTask(taskId: string): AgentTask | undefined {
    return this.taskQueue.getTask(taskId);
  }

  /**
   * Get all tasks
   */
  public getAllTasks(): AgentTask[] {
    return this.taskQueue.getAllTasks();
  }

  /**
   * Cancel task
   */
  public cancelTask(taskId: string): boolean {
    return this.taskQueue.cancelTask(taskId);
  }

  /**
   * Get agent info
   */
  public getAgentsInfo(): AgentInfo[] {
    return this.researchAgents.map((agent) => agent.getInfo());
  }

  /**
   * Get orchestrator stats
   */
  public getStats() {
    return {
      agents: {
        research: this.researchAgents.length,
        total: this.researchAgents.length,
      },
      queue: this.taskQueue.getStats(),
    };
  }

  /**
   * Start orchestrator
   */
  public async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    this.emit("started");
  }

  /**
   * Stop orchestrator
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) return;
    this.isRunning = false;
    this.emit("stopped");
  }

  /**
   * Health check
   */
  public isHealthy(): boolean {
    return this.isRunning && this.researchAgents.length > 0;
  }
}
