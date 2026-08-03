# Core AI Concepts

- **Retrieval-Augmented Generation (RAG):** Splitting PDF text into chunks and matching semantic intent using `all-MiniLM-L6-v2` embeddings, ensuring agents don't hallucinate.
- **Dynamic Multi-Model TTS:** Routing speech to the best engine based on language and cloning needs (Qwen for cloning, Kokoro for speed, IndicF5 for Hindi/Marathi).
- **GPU LRU Eviction Logic:** A dynamic queue tracking VRAM/RAM usage. Idle models are unloaded to free space, bypassing Mac/Nvidia hardware constraints smoothly.
- **LLM-as-a-Judge:** Using a secondary LLaMA-3.3-70b model to grade and evaluate the conversational agent's outputs.
