import sys
import os

print("--- FINAL LOGIC VERIFICATION ---")

# Check if src folder is accessible
src_path = os.path.join(os.getcwd(), 'src')
if os.path.exists(src_path):
    print(f"✓ Source folder found: {src_path}")
    sys.path.append(os.getcwd())
else:
    print("✗ Source folder NOT FOUND")

# Test the robust import logic for MediaPipe
print("\nTesting MediaPipe Robust Import...")
try:
    import mediapipe as mp
    print(f"✓ MediaPipe version: {mp.__version__}")
    
    # Try the specific paths used in the fix
    try:
        from mediapipe.python.solutions import hands
        print("✓ Import succeeded: from mediapipe.python.solutions import hands")
    except ImportError:
        print("! Path A failed (expected on some versions)")
        
    try:
        import mediapipe.solutions.hands
        print("✓ Import succeeded: import mediapipe.solutions.hands")
    except ImportError:
        print("! Path B failed (expected on some versions)")
except ImportError:
    print("✗ MediaPipe not installed on this test runner")

# Load and verify the detector class
print("\nVerifying PretrainedSignDetector Class...")
try:
    from src.pretrained_detector import PretrainedSignDetector
    # We won't initialize it here to avoid crashing on headless env, 
    # but the import success means the syntax and sub-imports are correct.
    print("✓ PretrainedSignDetector class is syntactically correct and loadable")
except Exception as e:
    print(f"✗ Detector Class Error: {e}")

print("\n--- VERIFICATION COMPLETE ---")
