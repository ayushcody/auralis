import os
import io
import time
import torch
import librosa
import numpy as np
import traceback
import soundfile as sf
import tempfile
import warnings
from typing import Optional

# Ensure expandable segments is set
os.environ['PYTORCH_CUDA_ALLOC_CONF'] = 'expandable_segments:True'

# Add backend to path so we can import modules
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from qwen_tts import Qwen3TTSModel

DEVICE = "cuda:0" if torch.cuda.is_available() else "cpu"
DTYPE = torch.float16 if torch.cuda.is_available() else torch.float32

def log_vram(stage):
    if torch.cuda.is_available():
        allocated = torch.cuda.memory_allocated() / (1024**3)
        reserved = torch.cuda.memory_reserved() / (1024**3)
        print(f"[{stage}] VRAM Allocated: {allocated:.2f} GB | Reserved: {reserved:.2f} GB")
    else:
        print(f"[{stage}] VRAM Tracking not available (running on {DEVICE})")

def get_audio_bytes(filepath):
    with open(filepath, "rb") as f:
        return f.read()

def safe_load_audio(filepath):
    try:
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
            tmp.write(get_audio_bytes(filepath))
            tmp_path = tmp.name
        
        audio, sr = librosa.load(tmp_path, sr=16000, mono=True)
        os.remove(tmp_path)
        return [(audio.astype(np.float32), 16000)]
    except Exception as e:
        print(f"Audio Load Exception: {e}")
        traceback.print_exc()
        return None

def main():
    print("="*60)
    print("VOICE CLONE DIAGNOSTIC TEST")
    print("="*60)
    
    log_vram("1. Before Model Load")
    
    print("\nLoading Qwen3-TTS-12Hz-0.6B-Base...")
    model = Qwen3TTSModel.from_pretrained(
        "Qwen/Qwen3-TTS-12Hz-0.6B-Base",
        device_map=DEVICE,
        dtype=DTYPE
    )
    if hasattr(model, 'model') and hasattr(model.model, 'eval'):
        model.model.eval()
    elif hasattr(model, 'eval'):
        model.eval()
        
    log_vram("2. After Model Load")
    
    file1 = ".venv/lib/python3.12/site-packages/gradio/media_assets/audio/heath_ledger.mp3"
    file2 = ".venv/lib/python3.12/site-packages/gradio/media_assets/audio/cate_blanch_2.mp3"
    
    print("\n--- Testing Voice 1 (Heath Ledger) ---")
    ref_audio_1 = safe_load_audio(file1)
        
    print("\nExtracting Embedding 1...")
    try:
        voice_prompt_1 = model.create_voice_clone_prompt(
            ref_audio=ref_audio_1,
            x_vector_only_mode=True
        )
        print(f"Embedding 1 generated. Type: {type(voice_prompt_1)}")
        if isinstance(voice_prompt_1, dict) and "ref_spk_embedding" in voice_prompt_1:
            emb = voice_prompt_1["ref_spk_embedding"]
            if hasattr(emb, "shape"):
                 print(f"Embedding 1 Shape: {emb.shape}")
                 print(f"Embedding 1 Mean: {emb.float().mean().item():.5f}, Std: {emb.float().std().item():.5f}")
                 print(f"Embedding 1 sum: {emb.float().sum().item():.5f}")
            elif isinstance(emb, list) and len(emb) > 0:
                 print(f"Embedding 1 is a list. First item shape: {emb[0].shape}")
                 print(f"Embedding 1 Mean: {emb[0].float().mean().item():.5f}")
        else:
             print("voice_prompt_1 content:", voice_prompt_1)
    except Exception as e:
        print(f"Embedding 1 Extraction failed: {e}")
        traceback.print_exc()

    print("\n--- Testing Voice 2 (Cate Blanchett) ---")
    ref_audio_2 = safe_load_audio(file2)
        
    print("\nExtracting Embedding 2...")
    try:
        voice_prompt_2 = model.create_voice_clone_prompt(
            ref_audio=ref_audio_2,
            x_vector_only_mode=True
        )
        print(f"Embedding 2 generated. Type: {type(voice_prompt_2)}")
        if isinstance(voice_prompt_2, dict) and "ref_spk_embedding" in voice_prompt_2:
            emb = voice_prompt_2["ref_spk_embedding"]
            if hasattr(emb, "shape"):
                 print(f"Embedding 2 Shape: {emb.shape}")
                 print(f"Embedding 2 Mean: {emb.float().mean().item():.5f}, Std: {emb.float().std().item():.5f}")
                 print(f"Embedding 2 sum: {emb.float().sum().item():.5f}")
            elif isinstance(emb, list) and len(emb) > 0:
                 print(f"Embedding 2 is a list. First item shape: {emb[0].shape}")
                 print(f"Embedding 2 Mean: {emb[0].float().mean().item():.5f}")
    except Exception as e:
        print(f"Embedding 2 Extraction failed: {e}")
        traceback.print_exc()
        
    print("\n--- Generating Audio 1 (Voice 1) ---")
    text_to_generate = "This is a diagnostic test of the voice cloning system."
    log_vram("3. Before Inference 1")
    
    try:
        wavs_1, sr_1 = model.generate_voice_clone(
            text=text_to_generate,
            language="Auto",
            voice_clone_prompt=voice_prompt_1
        )
        log_vram("4. After Inference 1")
        out_wav_1 = wavs_1[0]
        print(f"Generated Audio 1 Shape: {out_wav_1.shape}")
        sf.write("test_out_1.wav", out_wav_1, sr_1)
    except Exception as e:
        print(f"Inference 1 failed: {e}")
        traceback.print_exc()
        out_wav_1 = None

    print("\n--- Generating Audio 2 (Voice 2) ---")
    log_vram("5. Before Inference 2")
    try:
        wavs_2, sr_2 = model.generate_voice_clone(
            text=text_to_generate,
            language="Auto",
            voice_clone_prompt=voice_prompt_2
        )
        log_vram("6. After Inference 2")
        out_wav_2 = wavs_2[0]
        print(f"Generated Audio 2 Shape: {out_wav_2.shape}")
        sf.write("test_out_2.wav", out_wav_2, sr_2)
    except Exception as e:
        print(f"Inference 2 failed: {e}")
        traceback.print_exc()
        out_wav_2 = None
        
    if out_wav_1 is not None and out_wav_2 is not None:
        print("\n--- Comparing Outputs ---")
        length = min(len(out_wav_1), len(out_wav_2))
        
        diff = np.abs(out_wav_1[:length] - out_wav_2[:length])
        print(f"Mean absolute difference between waveforms: {np.mean(diff):.5f}")
        
        # Spectrogram comparison
        S1 = np.abs(librosa.stft(out_wav_1))
        S2 = np.abs(librosa.stft(out_wav_2))
        
        S_length = min(S1.shape[1], S2.shape[1])
        S_diff = np.abs(S1[:, :S_length] - S2[:, :S_length])
        
        print(f"Mean spectrogram difference: {np.mean(S_diff):.5f}")
        
        if np.mean(diff) < 1e-4:
            print("WARNING: The outputs are nearly identical. Voice cloning may be failing silently.")
        else:
            print("SUCCESS: The outputs are measurably different.")

if __name__ == "__main__":
    main()
