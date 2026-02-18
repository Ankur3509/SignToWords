import cv2
import numpy as np
from collections import Counter
import time
import sys

# ULTRA-ROBUST MEDIAPIPE IMPORT
# This tries multiple paths to find the hands and drawing modules
try:
    import mediapipe as mp
    
    # Try different import paths for version compatibility (0.10.x)
    try:
        from mediapipe.python.solutions import hands as mp_hands
        from mediapipe.python.solutions import drawing_utils as mp_draw
        from mediapipe.python.solutions import drawing_styles as mp_drawing_styles
        print("✓ MediaPipe loaded via path A")
    except (ImportError, ModuleNotFoundError):
        try:
            import mediapipe.solutions.hands as mp_hands
            import mediapipe.solutions.drawing_utils as mp_draw
            import mediapipe.solutions.drawing_styles as mp_drawing_styles
            print("✓ MediaPipe loaded via path B")
        except (ImportError, ModuleNotFoundError):
            # Fallback for some specific 0.10.x builds
            import mediapipe.python.solutions.hands as mp_hands
            import mediapipe.python.solutions.drawing_utils as mp_draw
            import mediapipe.python.solutions.drawing_styles as mp_drawing_styles
            print("✓ MediaPipe loaded via path C")

except Exception as e:
    print(f"CRITICAL ERROR: Could not find MediaPipe. Error: {e}")
    print("Please run: pip uninstall mediapipe && pip install mediapipe")
    sys.exit(1)

class PretrainedSignDetector:
    """
    Uses MediaPipe Hands + custom gesture mapping.
    Compatible with all recent MediaPipe versions.
    """
    
    def __init__(self):
        try:
            self.mp_hands = mp_hands
            self.mp_draw = mp_draw
            self.mp_drawing_styles = mp_drawing_styles
            
            # Initialize the Hands object
            self.hands = self.mp_hands.Hands(
                static_image_mode=False,
                max_num_hands=1,
                min_detection_confidence=0.7,
                min_tracking_confidence=0.7
            )
            print("✓ Hand Tracking initialized successfully")
            
        except Exception as e:
            print(f"Failed to initialize MediaPipe Hands: {e}")
            raise RuntimeError("Hand Tracking Init Failed. Try reinstalling mediapipe.")
        
        self.results = None
        self.gesture_buffer = []
        self.buffer_size = 10
        
    def find_hands(self, img, draw=True):
        """Detect hands and draw landmarks"""
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        self.results = self.hands.process(img_rgb)
        
        if self.results.multi_hand_landmarks:
            for hand_lms in self.results.multi_hand_landmarks:
                if draw:
                    self.mp_draw.draw_landmarks(
                        img, 
                        hand_lms, 
                        self.mp_hands.HAND_CONNECTIONS,
                        self.mp_drawing_styles.get_default_hand_landmarks_style(),
                        self.mp_drawing_styles.get_default_hand_connections_style()
                    )
        return img
    
    def get_landmarks(self, img):
        """Extract hand landmarks"""
        if not self.results or not self.results.multi_hand_landmarks:
            return None
        
        hand = self.results.multi_hand_landmarks[0]
        landmarks = []
        for lm in hand.landmark:
            landmarks.append([lm.x, lm.y, lm.z])
        return landmarks
    
    def recognize_gesture(self, landmarks):
        """Recognize signs based on finger orientation and hand geometry"""
        if not landmarks or len(landmarks) != 21: return None
        lm = np.array(landmarks)
        
        # Calculate extended fingers with improved accuracy
        ext = []
        # Thumb: compare tip (4) to base (2) considering hand orientation
        # FIXED: Inverted the logic to correctly handle mirrored coordinates
        ext.append(lm[4][0] > lm[2][0] if lm[5][0] > lm[17][0] else lm[4][0] < lm[2][0]) 
        # Fingers: compare tips (8, 12, 16, 20) to mid-joints (6, 10, 14, 18)
        for tip, mid in [(8, 6), (12, 10), (16, 14), (20, 18)]:
            ext.append(lm[tip][1] < lm[mid][1])
            
        count = sum(ext)
        
        # Calculate distances for complex gestures
        thumb_index_dist = np.linalg.norm(lm[4] - lm[8])
        
        # Recognition logic (ordered by specificity - specific gestures FIRST)
        
        # 1. Complex/Specific multi-finger gestures
        if thumb_index_dist < 0.05 and count >= 3: return "OK"
        if ext[0] and ext[1] and ext[4] and not ext[2] and not ext[3]: return "I Love You"
        if ext[1] and ext[2] and not ext[0] and not ext[3] and not ext[4]: return "Peace"
        
        # 2. Specific palm-based gestures
        # Stop sign - open palm facing forward/ready
        if count == 5 and lm[9][1] < lm[0][1]: return "Stop"
        
        # Numbers
        # "One" - Index only
        if ext[1] and not ext[2] and not ext[3] and not ext[4]: return "One"
        # "Two" - Index and Middle (Peace handled above)
        if ext[1] and ext[2] and not ext[3] and not ext[4]: return "Two"
        # "Three" - Index, Middle, Ring (Added logic)
        if not ext[0] and ext[1] and ext[2] and ext[3] and not ext[4]: return "Three"
        # "Four" - All except Thumb
        if not ext[0] and ext[1] and ext[2] and ext[3] and ext[4]: return "Four"
        
        # All fingers extended (General)
        if count == 5: return "Hello"
        
        # Thumbs up/Good
        if ext[0] and count == 1: return "Good"
        
        # Fist/Yes
        if count == 0: return "Yes"
        
        # Help - Raised hand with specific 3 fingers (Middle, Ring, Pinky)
        if not ext[1] and ext[2] and ext[3] and ext[4]: return "Help"
        
        # Thank You - open palm
        if count >= 4 and ext[0]: return "Thank You"
        
        return None

    def get_stabilized_gesture(self, current_gesture):
        if current_gesture:
            self.gesture_buffer.append(current_gesture)
            if len(self.gesture_buffer) > self.buffer_size: self.gesture_buffer.pop(0)
        if not self.gesture_buffer: return None
        count = Counter(self.gesture_buffer)
        most = count.most_common(1)[0]
        return most[0] if most[1] >= self.buffer_size // 2 else None
