# How Auralis Works

- **Phase 1 (Ingestion & RAG):** User uploads a PDF. Text is chunked, embedded locally on CPU, and stored in Supabase pgvector.
- **Phase 2 (ASR & Intent):** User speaks. Audio is transcribed in milliseconds via Groq Whisper. 
- **Phase 3 (LLM Reasoning):** The transcript queries the RAG database. Context + Prompt goes to Groq LLaMA-3.3-70B.
- **Phase 4 (Hardware-Aware TTS):** The Voice Router dynamically routes the text to the correct model (Kokoro/Qwen/IndicF5). The `AdvancedModelManager` evicts idle models if VRAM/RAM fills up.
- **Phase 5 (Delivery):** Audio is streamed back to the frontend in a slick, low-latency UI.
