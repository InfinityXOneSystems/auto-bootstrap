/**
 * Type Definitions for Agents Service
 */

// Task Types
export type TaskStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";
export type TaskPriority = "low" | "medium" | "high" | "critical";

// Research Task
export interface ResearchTask {
  id: string;
  type: "research";
  query: string;
  max_depth?: number;
  max_results?: number;
  sources?: string[];
  filters?: {
    date_range?: { start: string; end: string };
    domains?: string[];
    exclude_domains?: string[];
  };
}

// Agent Task (generic)
export interface AgentTask {
  id: string;
  type: string;
  status: TaskStatus;
  priority: TaskPriority;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  payload: ResearchTask | Record<string, unknown>;
  result?: unknown;
  error?: string;
  metadata?: {
    agent_id?: string;
    retry_count?: number;
    parent_task_id?: string;
  };
}

// Research Result
export interface ResearchResult {
  query: string;
  sources: Array<{
    url: string;
    title: string;
    snippet: string;
    relevance_score: number;
    crawled_at: string;
  }>;
  summary: string;
  key_findings: string[];
  related_queries: string[];
  confidence: number;
  metadata: {
    total_sources: number;
    avg_relevance: number;
    processing_time_ms: number;
  };
}

// Agent Info
export interface AgentInfo {
  id: string;
  name: string;
  type: string;
  status: "idle" | "busy" | "error";
  capabilities: string[];
  current_task_id?: string;
  tasks_completed: number;
  tasks_failed: number;
  uptime_ms: number;
}

// Service Health
export interface ServiceHealth {
  status: "healthy" | "degraded" | "unhealthy";
  service: string;
  version: string;
  timestamp: string;
  checks: {
    agents: "ok" | "error";
    queue: "ok" | "error";
    index_service: "ok" | "error";
  };
  stats: {
    active_agents: number;
    queued_tasks: number;
    running_tasks: number;
    completed_tasks_24h: number;
  };
}
