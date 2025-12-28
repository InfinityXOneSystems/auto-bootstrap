import logging

from fastapi import FastAPI, Request
import asyncio
from orchestrator import core

app = FastAPI(title="Infinity-X Orchestrator", version="2.0")
app.include_router(core.router)
async def startup(): logging.info("✅ Orchestrator Phase 2 active")
@app.on_event("startup")
async def startup(): logging.info("✅ Orchestrator Phase 2 active")

@app.get("/health")
def health(): return {"status":"ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
