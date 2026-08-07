import os
import sys
import uuid
import time
from fpdf import FPDF
import pypdf
from dotenv import load_dotenv

# Load env before importing backend
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend/.env.local"))
print(f"Loading env from {env_path}")
load_dotenv(env_path)
print("URL:", os.getenv("NEXT_PUBLIC_SUPABASE_URL"))

# Add backend to path so we can import modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import backend
from supabase import create_client

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Override backend's supabase and clients so retrieve_context uses ours
backend.supabase = supabase

from backend import embedding_model, chunk_text, retrieve_context, groq_client

def generate_test_pdf(filename="test_multi_page.pdf"):
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.set_font("Arial", size=12)
    
    pages_content = [
        "Page 1: The secret code to access the main vault is Alpha-Tango-99. It must be entered exactly at midnight.",
        "Page 2: The company was founded in 1985 by Dr. Jonathan Higgins in a small garage in Seattle.",
        "Page 3: The standard protocol for reactor meltdown involves flushing the core with liquid nitrogen for 45 minutes.",
        "Page 4: The latest financial report shows a Q3 revenue of $4.5 million, a 20% increase from the previous year.",
        "Page 5: To reset the main server, hold the red button for 10 seconds while turning the safety key counter-clockwise."
    ]
    
    for content in pages_content:
        pdf.add_page()
        pdf.cell(200, 10, txt=content, ln=True)
        
    pdf.output(filename)
    return pages_content

async def run_rag_test():
    print("="*60)
    print("RAG / KNOWLEDGE HUB DIAGNOSTIC TEST")
    print("="*60)
    
    # 1. Get an existing agent
    print("Fetching existing agent...")
    try:
        res = supabase.table("agents").select("id").limit(1).execute()
        if not res.data:
            print("No agents found in database. Using a dummy UUID for agent_id.")
            agent_id = str(uuid.uuid4())
        else:
            agent_id = res.data[0]["id"]
    except Exception as e:
        print(f"Error querying agents table: {e}")
        print("CRITICAL: The 'agents' table (and likely the entire schema) does not exist in this Supabase instance!")
        agent_id = str(uuid.uuid4())
        
    print(f"Using agent ID: {agent_id}")
    
    # 2. Generate and chunk PDF
    print("Generating 5-page PDF with distinct facts...")
    generate_test_pdf("test_document.pdf")
    
    print("Extracting text and chunking...")
    pdf_reader = pypdf.PdfReader("test_document.pdf")
    full_text = ""
    for page in pdf_reader.pages:
        extracted = page.extract_text()
        if extracted:
            full_text += extracted + "\n"
            
    chunks = chunk_text(full_text, chunk_size=50, overlap=10)
    
    # 3. Embed and Upload
    print("Embedding chunks and uploading to Supabase...")
    embeddings = embedding_model.encode(chunks)
    
    document_id = str(uuid.uuid4())
    
    try:
        supabase.table("documents").insert({
            "id": document_id,
            "agent_id": agent_id,
            "filename": "test_document.pdf",
            "content_type": "application/pdf"
        }).execute()
        print("Documents table exists!")
    except Exception as e:
        print(f"Error inserting into documents: {e}")
        
    chunks_data = []
    for idx, (chunk, emb) in enumerate(zip(chunks, embeddings)):
        chunks_data.append({
            "document_id": document_id,
            "chunk_text": chunk,
            "embedding": emb.tolist(),
            "chunk_index": idx
        })
        
    try:
        supabase.table("document_chunks").insert(chunks_data).execute()
        print("Document chunks table exists!")
    except Exception as e:
        print(f"Error inserting into document_chunks: {e}")
    
    # 4. Check Embedding Dimensions
    print("Checking database embedding dimensions...")
    res = supabase.table("document_chunks").select("embedding").eq("document_id", document_id).limit(1).execute()
    if res.data and "embedding" in res.data[0]:
        # Usually returned as a list or string representation
        emb_data = res.data[0]["embedding"]
        import json
        if isinstance(emb_data, str):
             emb_data = json.loads(emb_data)
        print(f"Stored embedding dimension is exactly: {len(emb_data)}")
        if len(emb_data) == 384:
            print("Dimension verified as 384!")
        else:
            print("WARNING: Dimension mismatch.")
    
    # 5. Question 1 (Page 1)
    q1 = "What is the secret code to access the main vault?"
    print(f"\n--- Question 1 (Page 1): {q1} ---")
    retrieved1 = []
    try:
        retrieved1 = await retrieve_context(agent_id, q1)
    except Exception as e:
        print(f"Error calling retrieve_context: {e}")
    
    try:
        q_emb = embedding_model.encode(q1).tolist()
        match_res = supabase.rpc("match_document_chunks", {
            "query_embedding": q_emb,
            "match_count": 4,
            "target_agent_id": agent_id
        }).execute()
        
        print("Top 4 Chunks Retrieved:")
        for idx, row in enumerate(match_res.data):
            print(f" Rank {idx+1}: {row}")
    except Exception as e:
        print(f"Error calling RPC match_document_chunks: {e}")
        
    # Test LLM response
    system_prompt = f"""You are RAG Test Agent, a helpful assistant.
You must answer only using the information in the CONTEXT block below.
If the answer is not in the context, say you don't have that information — do not invent facts.

CONTEXT:
{chr(10).join(retrieved1)}

USER: {q1}"""
    
    try:
        chat_completion = groq_client.chat.completions.create(
            messages=[{"role": "system", "content": system_prompt}],
            model="llama-3.3-70b-versatile",
        )
        print(f"LLM Answer 1: {chat_completion.choices[0].message.content}")
    except Exception as e:
        print(f"Error calling Groq: {e}")

    # 6. Question 2 (Unanswerable)
    q2 = "Who won the World Series in 1999?"
    print(f"\n--- Question 2 (Unanswerable): {q2} ---")
    retrieved2 = []
    try:
        retrieved2 = await retrieve_context(agent_id, q2)
    except Exception as e:
        print(f"Error calling retrieve_context: {e}")
    
    try:
        q_emb2 = embedding_model.encode(q2).tolist()
        match_res2 = supabase.rpc("match_document_chunks", {
            "query_embedding": q_emb2,
            "match_count": 4,
            "target_agent_id": agent_id
        }).execute()
        
        print("Top 4 Chunks Retrieved:")
        for idx, row in enumerate(match_res2.data):
            print(f" Rank {idx+1}: {row}")
    except Exception as e:
        print(f"Error calling RPC match_document_chunks: {e}")
        
    system_prompt2 = f"""You are RAG Test Agent, a helpful assistant.
You must answer only using the information in the CONTEXT block below.
If the answer is not in the context, say you don't have that information — do not invent facts.

CONTEXT:
{chr(10).join(retrieved2)}

USER: {q2}"""
    
    try:
        chat_completion2 = groq_client.chat.completions.create(
            messages=[{"role": "system", "content": system_prompt2}],
            model="llama-3.3-70b-versatile",
        )
        print(f"LLM Answer 2: {chat_completion2.choices[0].message.content}")
    except Exception as e:
        print(f"Error calling Groq: {e}")
    
    # 7. Check for IVFFLAT index
    # We can query pg_indexes if possible
    print("\n--- Database Index Check ---")
    try:
        idx_res = supabase.table("pg_indexes").select("indexdef").eq("tablename", "document_chunks").execute()
        print("Indexes on document_chunks:")
        for r in idx_res.data:
            print(r['indexdef'])
    except Exception as e:
        print("Could not query pg_indexes directly via anon key. Will check if we can query another way, or manually state it.")
        
    # Cleanup
    # supabase.table("agents").delete().eq("id", agent_id).execute()

if __name__ == "__main__":
    import asyncio
    asyncio.run(run_rag_test())
