# Performance & Outputs

- **VRAM/RAM Stability:** Custom `AdvancedModelManager` effectively rotates multiple heavy models (Qwen, IndicF5, Kokoro) within limited hardware resources by automatically tracking usage and evicting idle models via an LRU cache.
- **Ultra-Low Latency:** Inference powered by Groq LPUs combined with local model management achieves near-instant conversational latency.
- **Automated Validation:** The built-in LLM-as-a-Judge Evaluation Lab accurately scores agents on Persona Adherence and Resistance to Prompt Injection.
- **Audio Quality:** Reliable zero-shot cloning with Qwen and crisp localized delivery with IndicF5.
