import asyncio
import json
import os
import sys
import tempfile
import time
from typing import Dict, Any, Optional
import psutil
from server.sandbox.security import validate_code_safety, SecurityViolationError

class SandboxExecutionError(Exception):
    pass

class SandboxRunner:
    def __init__(
        self,
        timeout_seconds: float = 10.0,
        max_memory_mb: int = 512,
    ):
        self.timeout_seconds = timeout_seconds
        self.max_memory_mb = max_memory_mb

    async def execute(
        self,
        code: str,
        input_params: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        params = input_params or {}
        validate_code_safety(code)

        start_time = time.perf_counter()
        temp_dir = tempfile.mkdtemp(prefix="sovereign_sandbox_")
        input_file = os.path.join(temp_dir, "input.json")
        output_file = os.path.join(temp_dir, "output.json")
        script_file = os.path.join(temp_dir, "run.py")

        with open(input_file, "w", encoding="utf-8") as f:
            json.dump(params, f)

        wrapper_code = f"""
import json
import sys
import socket

def _blocked_socket(*args, **kwargs):
    raise PermissionError("Outbound network sockets are disabled in the sovereign sandbox.")

socket.socket = _blocked_socket

with open(r"{input_file}", "r", encoding="utf-8") as _f_in:
    inputs = json.load(_f_in)

result = None

{code}

output_payload = {{
    "result": result
}}

with open(r"{output_file}", "w", encoding="utf-8") as _f_out:
    json.dump(output_payload, _f_out)
"""

        with open(script_file, "w", encoding="utf-8") as f:
            f.write(wrapper_code)

        process = None
        try:
            process = await asyncio.create_subprocess_exec(
                sys.executable,
                script_file,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=temp_dir,
            )

            pid = process.pid
            timed_out = False
            memory_exceeded = False

            async def monitor_limits():
                nonlocal memory_exceeded
                try:
                    p = psutil.Process(pid)
                    while process.returncode is None:
                        mem_mb = p.memory_info().rss / (1024 * 1024)
                        if mem_mb > self.max_memory_mb:
                            memory_exceeded = True
                            process.kill()
                            break
                        await asyncio.sleep(0.1)
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    pass

            monitor_task = asyncio.create_task(monitor_limits())

            try:
                stdout_data, stderr_data = await asyncio.wait_for(
                    process.communicate(),
                    timeout=self.timeout_seconds,
                )
            except asyncio.TimeoutError:
                timed_out = True
                if process:
                    try:
                        process.kill()
                    except ProcessLookupError:
                        pass
                stdout_data, stderr_data = b"", b"Execution timed out."
            finally:
                monitor_task.cancel()

            elapsed_ms = int((time.perf_counter() - start_time) * 1000)
            stdout_str = stdout_data.decode("utf-8", errors="replace")
            stderr_str = stderr_data.decode("utf-8", errors="replace")

            if timed_out:
                return {
                    "status": "TIMEOUT",
                    "calculated_output": None,
                    "execution_time_ms": elapsed_ms,
                    "stdout": stdout_str,
                    "stderr": "Execution exceeded maximum allowed timeout.",
                    "verification_passed": False,
                }

            if memory_exceeded:
                return {
                    "status": "MEMORY_EXCEEDED",
                    "calculated_output": None,
                    "execution_time_ms": elapsed_ms,
                    "stdout": stdout_str,
                    "stderr": f"Execution exceeded {self.max_memory_mb}MB memory limit.",
                    "verification_passed": False,
                }

            if process.returncode != 0:
                return {
                    "status": "RUNTIME_ERROR",
                    "calculated_output": None,
                    "execution_time_ms": elapsed_ms,
                    "stdout": stdout_str,
                    "stderr": stderr_str.strip(),
                    "verification_passed": False,
                }

            calculated_output = None
            if os.path.exists(output_file):
                try:
                    with open(output_file, "r", encoding="utf-8") as f_out:
                        output_json = json.load(f_out)
                        calculated_output = output_json.get("result")
                except Exception as e:
                    stderr_str += f" Failed to read output: {str(e)}"

            return {
                "status": "SUCCESS",
                "calculated_output": calculated_output,
                "execution_time_ms": elapsed_ms,
                "stdout": stdout_str.strip(),
                "stderr": stderr_str.strip(),
                "verification_passed": True if calculated_output is not None else False,
            }

        finally:
            for root, dirs, files in os.walk(temp_dir, topdown=False):
                for name in files:
                    try:
                        os.remove(os.path.join(root, name))
                    except OSError:
                        pass
                for name in dirs:
                    try:
                        os.rmdir(os.path.join(root, name))
                    except OSError:
                        pass
            try:
                os.rmdir(temp_dir)
            except OSError:
                pass
