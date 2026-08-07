import torch
import numpy as np
import librosa
import tempfile
import os
import soundfile as sf
from transformers import AutoModel, AutoProcessor

class Audio8TTSModel:
    def __init__(self, model, processor, device, dtype):
        self.model = model
        self.processor = processor
        self.device = device
        self.dtype = dtype

    @classmethod
    def from_pretrained(cls, model_name="AutoArk-AI/Audio8-TTS-Preview-0.6b", device_map="auto", dtype=torch.float16):
        print(f"[Audio8TTS] Loading model: {model_name}...")
        try:
            processor = AutoProcessor.from_pretrained(model_name, trust_remote_code=True)
            model = AutoModel.from_pretrained(
                model_name,
                trust_remote_code=True,
                torch_dtype=dtype,
            )
            
            if device_map != "auto" and device_map != "cpu":
                model = model.to(device_map)
                
            model.eval()
            return cls(model, processor, device_map, dtype)
            
        except Exception as e:
            print(f"[Audio8TTS] Error loading model: {e}")
            raise e

    def create_voice_clone_prompt(self, ref_audio, ref_text=None, x_vector_only_mode=False):
        """
        Stores the reference audio and text to be used during generation.
        ref_audio: List of (audio_array, sample_rate)
        """
        audio_array, sr = ref_audio[0]
        
        return {
            "audio_array": audio_array,
            "sample_rate": sr,
            "ref_text": ref_text,
            "x_vector_only_mode": x_vector_only_mode
        }

    def generate_voice_clone(self, text, voice_clone_prompt, language="Auto", temperature=0.8, top_p=0.95, top_k=50, repetition_penalty=1.1):
        """
        Generates speech from text using the cloned voice prompt.
        """
        
        audio_array = voice_clone_prompt.get("audio_array")
        sr = voice_clone_prompt.get("sample_rate")
        ref_text = voice_clone_prompt.get("ref_text")
        
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            sf.write(tmp.name, audio_array, sr)
            tmp_path = tmp.name
        
        try:
            if ref_text and ref_text.strip():
                inputs = self.processor(
                    text=[text],
                    reference_audio=[tmp_path],
                    reference_text=[ref_text],
                    return_tensors="pt",
                )
            else:
                inputs = self.processor(
                    text=[text],
                    return_tensors="pt",
                )
                
            inputs = {name: value.to(self.model.device) for name, value in inputs.items()}
            
            with torch.inference_mode():
                output = self.model.generate(
                    **inputs,
                    max_new_tokens=1024,
                    temperature=temperature,
                    top_p=top_p,
                    top_k=top_k,
                    repetition_penalty=repetition_penalty,
                    do_sample=True,
                    return_dict_in_generate=True,
                )
                waveforms, waveform_lengths = self.model.decode_audio(output.codes)
                
            audio = waveforms[0, : int(waveform_lengths[0])].float().cpu().numpy()
            return [audio], self.model.config.codec_sample_rate
            
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
