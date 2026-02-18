import sys
import os
import time

print("--- DIAGNOSTIC START ---")

# 1. Dependency Check
print("Checking Dependencies...")
try:
    import cv2
    print(f"✓ OpenCV version: {cv2.__version__}")
except ImportError:
    print("✗ OpenCV NOT FOUND")

try:
    import numpy as np
    print(f"✓ NumPy version: {np.__version__}")
except ImportError:
    print("✗ NumPy NOT FOUND")

try:
    import pyttsx3
    print("✓ pyttsx3 found")
except ImportError:
    print("✗ pyttsx3 NOT FOUND")

# 2. MediaPipe Robust Import Check
print("\nChecking MediaPipe Initialization...")
try:
    import mediapipe as mp
    print(f"MediaPipe Base Version: {mp.__version__}")
    
    # Simulate the robust import logic
    mp_hands = None
    try:
        from mediapipe.python.solutions import hands as mp_hands
        print("✓ Path A valid (mediapipe.python.solutions.hands)")
    except:
        try:
            import mediapipe.solutions.hands as mp_hands
            print("✓ Path B valid (mediapipe.solutions.hands)")
        except:
            print("✗ All known MediaPipe paths failed")

except ImportError:
    print("✗ MediaPipe NOT FOUND")

# 3. Detector Class Initialization
print("\nInitializing Detector Class...")
try:
    project_root = os.getcwd()
    sys.path.append(project_root)
    from src.pretrained_detector import PretrainedSignDetector
    
    detector = PretrainedSignDetector()
    print("✓ PretrainedSignDetector class created successfully")
    
    if hasattr(detector, 'hands') and detector.hands is not None:
        print("✓ MediaPipe Hands object initialized correctly")
    else:
        print("✗ MediaPipe Hands object is NONE")
        
except Exception as e:
    print(f"✗ Detector Initialization Error: {e}")

# 4. Camera Presence Check (Index 0)
print("\nChecking Camera Hardware...")
cap = cv2.VideoCapture(0)
if cap.isOpened():
    ret, frame = cap.read()
    if ret:
        print("✓ Camera index 0 connected and sending frames")
    else:
        print("? Camera 0 found but failed to read frame (might be in use by another app)")
    cap.release()
else:
    print("✗ Camera index 0 not found")

print("\n--- DIAGNOSTIC COMPLETE ---")
