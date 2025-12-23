import asyncio

from fastapi import FastAPI, Request

from orchestrator import core

app = FastAPI(title="Infinity-X Orchestrator", version="2.0")
app.include_router(core.router)


@app.on_event("startup")
async def startup():
    print("✅ Orchestrator Phase 2 active")


@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8080)
