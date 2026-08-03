# Limitations & Future Scope

**Current Gaps:** 
- Strict hardware limits heavily constrain how many TTS models can be kept "warm" in VRAM concurrently.
- RAG Context Windows limit the size of documents an agent can reliably query at once.
- Ethical risks regarding zero-shot voice spoofing requiring strict consent protocols.

**Future Scope:**
- **Edge Deployment:** Compressing the entire architecture into an on-device app.
- **Multimodal Agents:** Adding vision capabilities (camera input) into the conversation pipeline.
- **Security:** Implementing robust acoustic watermarking to identify AI-generated clones.
