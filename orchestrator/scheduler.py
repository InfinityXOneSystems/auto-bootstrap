import uuid, asyncio
_tasks = {}

def enqueue(task):
    job_id = str(uuid.uuid4())
    _tasks[job_id] = task
    asyncio.create_task(run(task))
    return job_id

async def run(task):
    await asyncio.sleep(0.1)
    print(f"🧠 Executed task: {task}")
