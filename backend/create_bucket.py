from backend import supabase

try:
    print("Creating bucket...")
    res = supabase.storage.create_bucket("audio-assets", options={"public": False})
    print(f"Result: {res}")
except Exception as e:
    print(f"Error: {e}")
