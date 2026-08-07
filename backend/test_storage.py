from backend import supabase
import os

print(f"Key starts with: {os.getenv('SUPABASE_SERVICE_ROLE_KEY')[:10] if os.getenv('SUPABASE_SERVICE_ROLE_KEY') else 'None'}")
try:
    buckets = supabase.storage.list_buckets()
    print("Buckets found:")
    for b in buckets:
        print(f" - {b.name}")
except Exception as e:
    print(f"Error listing buckets: {e}")
