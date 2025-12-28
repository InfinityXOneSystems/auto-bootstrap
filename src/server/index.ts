/**
 * Agents Service HTTP Server
 * Express-based REST API for agent orchestration
 */

import express, { Request, Response, NextFunction } from "express";
import { AgentOrchestrator } from "../agents/orchestrator.js";
import { ServiceHealth } from "../types/index.js";

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || "development";
const MAX_CONCURRENT = parseInt(process.env.MAX_CONCURRENT_TASKS || "5", 10);

// Initialize orchestrator
const orchestrator = new AgentOrchestrator(MAX_CONCURRENT);

// Middleware
app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, X-API-Key"
  );
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// HEALTH CHECK ENDPOINTS
// ============================================================================

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "infinity-agents",
    timestamp: new Date().toISOString(),
  });
});

app.get("/healthz", (req, res) => {
  res.json({
    status: "healthy",
    service: "infinity-agents",
    timestamp: new Date().toISOString(),
  });
});

app.get("/readyz", (req, res) => {
  try {
    const isReady = orchestrator.isHealthy();

    if (!isReady) {
      res.status(503).json({
        status: "not ready",
        service: "infinity-agents",
        timestamp: new Date().toISOString(),
        error: "Orchestrator not healthy",
      });
      return;
    }

    const health: ServiceHealth = {
      status: "healthy",
      service: "infinity-agents",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      checks: {
        agents: "ok",
        queue: "ok",
        index_service: "ok", // TODO: Check index service connectivity
      },
      stats: {
        active_agents: orchestrator.getAgentsInfo().length,
        queued_tasks: orchestrator.getStats().queue.queued,
        running_tasks: orchestrator.getStats().queue.running,
        completed_tasks_24h: orchestrator.getStats().queue.completed,
      },
    };

    res.json(health);
  } catch (error) {
    res.status(503).json({
      status: "not ready",
      service: "infinity-agents",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// ============================================================================
// AGENT OPERATIONS
// ============================================================================

/**
 * Execute research task
 */
app.post("/agents/research/execute", async (req, res) => {
  try {
    const { query, max_depth, max_results, priority } = req.body;

    if (!query || typeof query !== "string") {
      res.status(400).json({
        error: "Invalid request",
        message: "query is required and must be a string",
      });
      return;
    }

    const taskId = await orchestrator.submitResearchTask(query, {
      max_depth,
      max_results,
      priority,
    });

    res.status(202).json({
      task_id: taskId,
      status: "accepted",
      message: "Research task queued",
      query,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to submit research task",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * Get all tasks
 */
app.get("/agents/tasks", (req, res) => {
  try {
    const tasks = orchestrator.getAllTasks();

    const { status, type } = req.query;

    let filtered = tasks;

    if (status) {
      filtered = filtered.filter((t) => t.status === status);
    }

    if (type) {
      filtered = filtered.filter((t) => t.type === type);
    }

    res.json({
      total: filtered.length,
      tasks: filtered.map((t) => ({
        id: t.id,
        type: t.type,
        status: t.status,
        priority: t.priority,
        created_at: t.created_at,
        started_at: t.started_at,
        completed_at: t.completed_at,
      })),
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to get tasks",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * Get task status
 */
app.get("/agents/tasks/:id", (req, res) => {
  try {
    const task = orchestrator.getTask(req.params.id);

    if (!task) {
      res.status(404).json({
        error: "Task not found",
        task_id: req.params.id,
      });
      return;
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({
      error: "Failed to get task",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * Cancel task
 */
app.delete("/agents/tasks/:id", (req, res) => {
  try {
    const cancelled = orchestrator.cancelTask(req.params.id);

    if (!cancelled) {
      res.status(404).json({
        error: "Task not found or cannot be cancelled",
        task_id: req.params.id,
        message: "Task may be already running or completed",
      });
      return;
    }

    res.json({
      message: "Task cancelled",
      task_id: req.params.id,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to cancel task",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * Get agent info
 */
app.get("/agents/info", (req, res) => {
  try {
    const agents = orchestrator.getAgentsInfo();
    res.json({
      total: agents.length,
      agents,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to get agent info",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * Get orchestrator stats
 */
app.get("/agents/stats", (req, res) => {
  try {
    const stats = orchestrator.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({
      error: "Failed to get stats",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

// ============================================================================
// ROOT ENDPOINT
// ============================================================================

app.get("/", (req, res) => {
  res.json({
    service: "Infinity XOS Agents Service",
    version: "1.0.0",
    description: "Multi-agent orchestration and autonomous research",
    endpoints: {
      health: {
        "GET /health": "Health check",
        "GET /healthz": "Kubernetes health check",
        "GET /readyz": "Readiness check with detailed status",
      },
      agents: {
        "POST /agents/research/execute": "Execute research task",
        "GET /agents/tasks":
          "List all tasks (supports ?status=pending&type=research)",
        "GET /agents/tasks/:id": "Get task status and results",
        "DELETE /agents/tasks/:id": "Cancel pending task",
        "GET /agents/info": "Get all agent information",
        "GET /agents/stats": "Get orchestrator statistics",
      },
    },
    documentation: "https://github.com/InfinityXOneSystems/agents",
  });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error("Error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  });
});

// ============================================================================
// START SERVER
// ============================================================================

async function start() {
  try {
    // Start orchestrator
    await orchestrator.start();
    console.log("✅ Agent orchestrator started");

    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`\n🚀 Infinity XOS Agents Service started`);
      console.log(`📍 Listening on http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${NODE_ENV}`);
      console.log(`📖 API docs at http://localhost:${PORT}/\n`);

      const stats = orchestrator.getStats();
      console.log(`🤖 Active agents: ${stats.agents.total}`);
      console.log(`⚡ Max concurrent tasks: ${MAX_CONCURRENT}\n`);
    });
  } catch (error) {
    console.error("❌ Failed to start service:", error);
    process.exit(1);
  }
}

// Handle shutdown
process.on("SIGTERM", async () => {
  console.log("\n⏹️  Shutting down gracefully...");
  await orchestrator.stop();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("\n⏹️  Shutting down gracefully...");
  await orchestrator.stop();
  process.exit(0);
});

start();

export default app;
