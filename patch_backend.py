import re

with open('backend/backend.py', 'r') as f:
    content = f.read()

# 1. Add /api/engines endpoint before /health or somewhere early
engines_endpoint = """
@app.get("/api/engines")
async def get_engines():
    return [{"id": k, "name": v["name"]} for k, v in ENGINE_REGISTRY.items()]
"""
content = content.replace('@app.get("/health")', engines_endpoint + '\n@app.get("/health")')

# 2. _resolve_voice_model
content = content.replace(
    'async def _resolve_voice_model(voice_id: Optional[str], audio_file: Optional[UploadFile], transcript: str, use_transcript: bool) -> Tuple[Any, str]:',
    'async def _resolve_voice_model(voice_id: Optional[str], audio_file: Optional[UploadFile], transcript: str, use_transcript: bool, engine: str = "audio8_0_6b") -> Tuple[Any, str]:'
)
# replace model = await advanced_manager.load_model("audio8_0_6b") inside _resolve_voice_model (there is one inside the elif audio_file: block)
# We can use regex to replace it specifically in that function or generally?
# We have to be careful. Let's do a targeted regex replacement for this.
content = re.sub(
    r'(elif audio_file:.*?model = await advanced_manager\.load_model\()"audio8_0_6b"(\))',
    r'\1engine\2',
    content,
    flags=re.DOTALL
)

# 3. generate_with_progress
content = content.replace(
    'async def generate_with_progress(prompt, voice_id, audio_file, reference_text, use_transcript, temperature=0.8, top_p=0.8, top_k=50, repetition_penalty=1.1):',
    'async def generate_with_progress(prompt, voice_id, audio_file, reference_text, use_transcript, engine="audio8_0_6b", temperature=0.8, top_p=0.8, top_k=50, repetition_penalty=1.1):'
)

# in generate_with_progress, _resolve_voice_model call
content = content.replace(
    'voice_prompt, mode = await _resolve_voice_model(\n            voice_id, audio_file, reference_text, use_transcript\n        )',
    'voice_prompt, mode = await _resolve_voice_model(\n            voice_id, audio_file, reference_text, use_transcript, engine\n        )'
)

# inside generate_with_progress, replace model loading
content = re.sub(
    r'(for i, chunk in enumerate\(text_chunks\):.*?model = await advanced_manager\.load_model\()"audio8_0_6b"(\))',
    r'\1engine\2',
    content,
    flags=re.DOTALL
)

# 4. generate_voice_stream endpoint
content = content.replace(
    'voice_id: str = Form(None),\n    temperature: float = Form(0.8),',
    'voice_id: str = Form(None),\n    engine: str = Form("audio8_0_6b"),\n    temperature: float = Form(0.8),'
)
content = content.replace(
    'prompt, voice_id, audio_file, reference_text, use_transcript_bool,\n            temperature, top_p, top_k, repetition_penalty',
    'prompt, voice_id, audio_file, reference_text, use_transcript_bool, engine,\n            temperature, top_p, top_k, repetition_penalty'
)

# 5. generate_voice endpoint
content = content.replace(
    'audio_file: UploadFile = File(None),\n    voice_id: str = Form(None)\n):',
    'audio_file: UploadFile = File(None),\n    voice_id: str = Form(None),\n    engine: str = Form("audio8_0_6b")\n):'
)

# Replace "audio8_0_6b" with engine in generate_voice
content = re.sub(
    r'(if should_use_transcript and ref_text_to_use\.strip\(\):.*?model = await advanced_manager\.load_model\()"audio8_0_6b"(\))',
    r'\1engine\2',
    content,
    flags=re.DOTALL
)
content = re.sub(
    r'(else:.*?model = await advanced_manager\.load_model\()"audio8_0_6b"(\))',
    r'\1engine\2',
    content,
    flags=re.DOTALL
)
content = re.sub(
    r'(model = await advanced_manager\.load_model\()"audio8_0_6b"(\))',
    r'\1engine\2',
    content
) # Since there is a dangling `model = await advanced_manager.load_model("audio8_0_6b")` around line 880

with open('backend/backend.py', 'w') as f:
    f.write(content)

