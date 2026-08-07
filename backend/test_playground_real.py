import asyncio
import json
import os
import io
import time
from fastapi.testclient import TestClient
from backend import app, supabase, groq_client

client = TestClient(app)
headers = {"storage-mode": "local"}

print("\n--- 1. Create Agent ---")
agent_id = None
resp = client.post("/api/agents", headers=headers, json={
    "project_id": "test-project-123",
    "name": "E2E Test Agent",
    "role_description": "You are a friendly guide who speaks concisely."
})
print(f"Create Agent Status: {resp.status_code}")
agent_data = resp.json()
agent_id = agent_data.get("agent", {}).get("id") or agent_data.get("id")
print(f"Created Agent ID: {agent_id}")

print("\n--- 2. Knowledge Hub RAG Upload ---")
with open("secret.pdf", "rb") as f:
    resp = client.post("/api/knowledge/upload", headers=headers, data={"agent_id": agent_id}, files={"file": ("secret.pdf", f, "application/pdf")})
print(f"Upload Status: {resp.status_code}")

chunks_res = supabase.table("document_chunks").select("chunk_text, chunk_index").execute()
print(f"Total chunks in DB for agent: {len(chunks_res.data)}")
for i, c in enumerate(chunks_res.data):
    print(f"Chunk {i}: {c['chunk_text']}")

print("\n--- 3. Live Playground (RAG + LLM) ---")
with open("question.m4a", "rb") as f:
    resp = client.post(f"/api/conversations/{agent_id}/turn", headers=headers, files={"audio": ("question.m4a", f, "audio/m4a")})
print(f"Playground Status: {resp.status_code}")

print("\n--- 4. Verify LLM Output ---")
history_res = supabase.table("conversation_turns").select("*").order("created_at", desc=True).limit(2).execute()
for t in history_res.data:
    print(f"{t['role'].upper()}: {t['text_content']}")
