#!/usr/bin/env python3
"""
Debug Environment File Content
Check exactly what's in the environment file
"""

def debug_env_file():
    """Debug environment file content"""
    print("🔍 DEBUGGING ENVIRONMENT FILE CONTENT")
    print("="*60)
    
    env_file = 'apps/backend-fastapi/.env'
    
    try:
        with open(env_file, 'r') as f:
            lines = f.readlines()
        
        print(f"File: {env_file}")
        print(f"Total lines: {len(lines)}")
        print("\nAll lines containing 'FLUTTER', 'CLIENT', or 'LIVE':")
        
        for i, line in enumerate(lines, 1):
            if 'FLUTTER' in line.upper() or 'CLIENT' in line.upper() or 'LIVE' in line.upper():
                print(f"Line {i}: {line.strip()}")
        
        print("\nAll environment variables found:")
        env_vars = {}
        for line in lines:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                env_vars[key] = value
                if 'FLUTTER' in key.upper() or 'CLIENT' in key.upper() or 'LIVE' in key.upper():
                    print(f"  {key} = {value}")
        
        # Check what our service would pick up (with new priority order)
        print("\nWhat FlutterwavePaymentService would use:")
        secret_key = (
            env_vars.get('FLUTTERWAVE_LIVE_SECRET_KEY') or
            env_vars.get('FLUTTERWAVE_SECRET_KEY') or 
            env_vars.get('FLUTTERWAVE_CLIENT_SECRET_KEY')
        )
        public_key = (
            env_vars.get('FLUTTERWAVE_LIVE_PUBLIC_KEY') or
            env_vars.get('FLUTTERWAVE_PUBLIC_KEY') or 
            env_vars.get('FLUTTERWAVE_CLIENT_ID')
        )
        
        print(f"Secret Key: {secret_key}")
        print(f"Public Key: {public_key}")
        
    except Exception as e:
        print(f"Error reading file: {e}")

if __name__ == "__main__":
    debug_env_file()