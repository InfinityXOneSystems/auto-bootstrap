from fastapi import APIRouter
from orchestrator import scheduler
from orchestrator.adapters import vertex, groq, mcp

router = APIRouter()

@router.post("/execute")
async def execute(task: dict):
    model = task.get("model","vertex")
    handler = {"vertex": vertex, "groq": groq, "mcp": mcp}.get(model, vertex)
    return {"result": handler.run(task)}

@router.post("/schedule")
async def schedule_task(task: dict):
    job_id = scheduler.enqueue(task)
    return {"scheduled": job_id}
@app.get("/health")
def health(): return {"status":"ok"}
@app.get("/ready")
def ready(): return {"ready":True}
