import os
import sys
import time
import asyncio
import random
import psutil
from datetime import datetime

# Add backend to path so we can import modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend import AdvancedModelManager

async def main():
    print("="*60)
    print("ADVANCED MODEL MANAGER LOAD TEST")
    print("="*60)
    
    # Initialize the manager exactly as in backend.py
    manager = AdvancedModelManager(max_gpu_memory_gb=12.0, idle_timeout_sec=300.0, min_residence_sec=60.0)
    await manager.start_cleanup_loop()
    
    models_to_test = ["kokoro", "qwen3_0_6b", "indic_f5"]
    
    results = []
    
    # Track peak memory
    peak_vmem = 0.0
    
    for i in range(1, 21):
        engine_key = random.choice(models_to_test)
        
        start_time = time.time()
        
        try:
            print(f"\n[Req {i}] Requesting {engine_key}...")
            model = await manager.load_model(engine_key)
            latency = (time.time() - start_time) * 1000
            
            # Check if it was warm or cold
            # A fresh load will take significantly longer.
            # We can also infer from the manager's print statements.
            
            mem = psutil.virtual_memory()
            if mem.percent > peak_vmem:
                peak_vmem = mem.percent
                
            results.append({
                "req": i,
                "engine": engine_key,
                "latency_ms": latency,
                "status": "success",
                "mem_percent": mem.percent
            })
            print(f"[Req {i}] Latency: {latency:.2f} ms | System Mem: {mem.percent}%")
            
        except Exception as e:
            latency = (time.time() - start_time) * 1000
            results.append({
                "req": i,
                "engine": engine_key,
                "latency_ms": latency,
                "status": f"error: {str(e)}",
                "mem_percent": psutil.virtual_memory().percent
            })
            print(f"[Req {i}] FAILED: {str(e)} | Latency: {latency:.2f} ms")
            
        # Small sleep between requests to simulate rapid traffic
        await asyncio.sleep(0.5)
        
    print("\n" + "="*60)
    print("LOAD TEST RESULTS SUMMARY")
    print("="*60)
    
    print(f"Total Requests: {len(results)}")
    
    warm_latencies = []
    cold_latencies = []
    
    # We heuristically classify cold vs warm based on latency > 500ms since loading weights takes seconds
    for r in results:
        if r["status"] == "success":
            if r["latency_ms"] > 1000:
                cold_latencies.append(r["latency_ms"])
            else:
                warm_latencies.append(r["latency_ms"])
                
    if cold_latencies:
        print(f"Average Cold Load Latency: {sum(cold_latencies)/len(cold_latencies):.2f} ms (N={len(cold_latencies)})")
    if warm_latencies:
        print(f"Average Warm Load Latency: {sum(warm_latencies)/len(warm_latencies):.2f} ms (N={len(warm_latencies)})")
        
    print(f"Peak System Memory Usage: {peak_vmem}%")
    
    errors = [r for r in results if r["status"] != "success"]
    print(f"Errors (OOM or otherwise): {len(errors)}")
    for e in errors:
        print(f" - Req {e['req']} ({e['engine']}): {e['status']}")

if __name__ == "__main__":
    asyncio.run(main())
