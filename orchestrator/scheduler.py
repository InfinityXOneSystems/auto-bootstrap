import logging

import uuid, asyncio
_tasks = {}

def enqueue(task):
    job_id = str(uuid.uuid4())
    _tasks[job_id] = task
    asyncio.create_task(run(task))
    return job_id

    logging.info(f"🧠 Executed task: {task}")
    await asyncio.sleep(0.1)
    logging.info(f"🧠 Executed task: {task}")
