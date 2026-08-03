import asyncio
import aiohttp
import random
import time
import os
import sys

# Configure target URL
BASE_URL = os.environ.get("BASE_URL", "http://localhost:8000")
ENDPOINT = f"{BASE_URL}/api/voices/generate"
TOKEN = os.environ.get("SUPABASE_TOKEN")

if not TOKEN:
    print("❌ ERROR: Please set SUPABASE_TOKEN environment variable to run the load test.")
    print("You can copy your Bearer token from the Network tab in your browser when logged in to Auralis.")
    print(f"Usage: SUPABASE_TOKEN='your_jwt_here' python {sys.argv[0]}")
    exit(1)

# Payloads designed to hit different engines via route_engine logic:
# 1. Kokoro: lang="en", clone=False
# 2. Qwen3: clone=True (needs a voice_id)
# 3. IndicF5: lang="hi"
REQUESTS = [
    {"text": "Testing fast english without clone.", "language": "en", "mode": "fast", "voice_id": ""},       # Hits Kokoro
    {"text": "Testing english with voice cloning.", "language": "en", "mode": "expressive", "voice_id": "test_id"}, # Hits Qwen3
    {"text": "नमस्ते दुनिया, यह एक परीक्षण है", "language": "hi", "mode": "base", "voice_id": ""},             # Hits IndicF5
]

async def fire_request(session, req_id):
    payload = random.choice(REQUESTS)
    data = aiohttp.FormData()
    data.add_field('text', payload['text'])
    data.add_field('language', payload['language'])
    data.add_field('mode', payload['mode'])
    data.add_field('voice_id', payload['voice_id'])
    
    headers = {"Authorization": f"Bearer {TOKEN}"}
    
    engine_hint = "Kokoro" if not payload['voice_id'] and payload['language'] == 'en' else "Qwen3" if payload['voice_id'] else "IndicF5"
    
    print(f"[Req {req_id}] Firing request -> target engine approx: {engine_hint}")
    start = time.time()
    try:
        async with session.post(ENDPOINT, data=data, headers=headers) as response:
            status = response.status
            # read some bytes to ensure request completes
            _ = await response.read()
            latency = time.time() - start
            print(f"[Req {req_id}] Completed with status {status} in {latency:.2f}s")
    except Exception as e:
        print(f"[Req {req_id}] Failed: {e}")

async def main():
    print("=====================================================")
    print(" Auralis Multi-Model GPU Load Test")
    print("=====================================================")
    print(f"Targeting: {ENDPOINT}")
    print("This script will rapidly alternate requests to force VRAM pressure.")
    print("Watch the FastAPI backend console for AdvancedModelManager logs.")
    print("-----------------------------------------------------\n")
    
    async with aiohttp.ClientSession() as session:
        # Fire 15 concurrent requests to hammer the GPU logic and force evictions
        tasks = []
        for i in range(15):
            tasks.append(fire_request(session, i))
            # Sleep slightly to stagger them, simulating a burst of traffic
            await asyncio.sleep(0.5)
            
        await asyncio.gather(*tasks)
        
    print("\n[✔] Load test complete.")

if __name__ == "__main__":
    asyncio.run(main())
