import json
from typing import Optional, Dict, Any, AsyncGenerator
import redis.asyncio as aioredis
from server.core.config import settings

class RedisQueueManager:
    def __init__(self, redis_url: Optional[str] = None):
        self.redis_url = redis_url or settings.REDIS_URL
        self._pool: Optional[aioredis.ConnectionPool] = None

    def get_pool(self) -> aioredis.ConnectionPool:
        if self._pool is None:
            self._pool = aioredis.ConnectionPool.from_url(
                self.redis_url,
                max_connections=20,
                decode_responses=True,
            )
        return self._pool

    def get_client(self) -> aioredis.Redis:
        return aioredis.Redis(connection_pool=self.get_pool())

    async def enqueue(self, queue_name: str, payload: Dict[str, Any]) -> int:
        client = self.get_client()
        serialized = json.dumps(payload)
        return await client.rpush(queue_name, serialized)

    async def dequeue(self, queue_name: str, timeout: int = 1) -> Optional[Dict[str, Any]]:
        client = self.get_client()
        result = await client.blpop(queue_name, timeout=timeout)
        if result:
            _, item_data = result
            return json.loads(item_data)
        return None

    async def get_queue_length(self, queue_name: str) -> int:
        client = self.get_client()
        return await client.llen(queue_name)

    async def publish_event(self, task_id: str, event_type: str, data: Dict[str, Any]) -> int:
        client = self.get_client()
        channel = f"task_events:{task_id}"
        message = {
            "task_id": task_id,
            "event_type": event_type,
            "data": data,
        }
        return await client.publish(channel, json.dumps(message))

    async def subscribe_events(self, task_id: str) -> aioredis.client.PubSub:
        client = self.get_client()
        pubsub = client.pubsub()
        channel = f"task_events:{task_id}"
        await pubsub.subscribe(channel)
        return pubsub

    async def set_task_state(self, task_id: str, state: Dict[str, Any], expire_seconds: int = 86400) -> None:
        client = self.get_client()
        key = f"task_state:{task_id}"
        await client.set(key, json.dumps(state), ex=expire_seconds)

    async def get_task_state(self, task_id: str) -> Optional[Dict[str, Any]]:
        client = self.get_client()
        key = f"task_state:{task_id}"
        val = await client.get(key)
        if val:
            return json.loads(val)
        return None

    async def set_cancel_flag(self, task_id: str) -> None:
        client = self.get_client()
        key = f"task_cancel:{task_id}"
        await client.set(key, "1", ex=3600)

    async def is_cancelled(self, task_id: str) -> bool:
        client = self.get_client()
        key = f"task_cancel:{task_id}"
        val = await client.get(key)
        return val is not None

    async def close(self) -> None:
        if self._pool is not None:
            await self._pool.disconnect()
            self._pool = None

queue_manager = RedisQueueManager()

