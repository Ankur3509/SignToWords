import cv2
import time
from src.pretrained_detector import PretrainedSignDetector
from src.voice import VoiceEngine
from src.utils import GestureManager, FPS

# --- CONFIGURATION ---
CONFIDENCE_THRESHOLD = 0.7
# ---------------------

def run_app():
    """
    Main application using pre-trained gesture recognition.
    No training required - works out of the box!
    """
    # Initialize components
    cap = cv2.VideoCapture(0)
    
    # Check if camera opened successfully
    if not cap.isOpened():
        print("=" * 60)
        print("ERROR: Could not open camera!")
        print("=" * 60)
        print("\nPlease check if:")
        print("  1. Your camera is connected")
        print("  2. No other application is using the camera")
        print("  3. Camera permissions are granted")
        print("\nTroubleshooting:")
        print("  • Close Zoom, Teams, Skype, etc.")
        print("  • Check Windows Settings → Privacy → Camera")
        print("  • Try unplugging and replugging USB camera")
        print("=" * 60)
        input("\nPress Enter to exit...")
        return
    
    print("=" * 60)
    print("       SignToWords - Pre-trained Sign Language AI")
    print("=" * 60)
    print("\n✓ Camera initialized successfully!")
    print("✓ Pre-trained model loaded!")
    print("\n📚 Supported Signs:")
    print("  • Greetings: Hello, Thank You")
    print("  • Responses: Yes, OK, Good")
    print("  • Actions: Stop, Help, Peace, I Love You")
    print("  • Numbers: One, Two, Three, Four")
    print("\n💡 How to use:")
    print("  • Show your hand sign clearly to the camera")
    print("  • Hold the gesture steady for recognition")
    print("  • The AI will recognize and speak the word")
    print("  • Lower your hand for 2 seconds to finish a sentence")
    print("  • Press 'Q' to exit")
    print("=" * 60)
    print("\n🚀 Starting in 3 seconds...")
    time.sleep(3)
    
    detector = PretrainedSignDetector()
    voice = VoiceEngine()
    manager = GestureManager()  # Using optimized defaults
    fps_counter = FPS()
    
    # Create a resizable window
    window_name = "SignToWords - AI Sign Language Translator"
    cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
    # Ensure window maintains Aspect Ratio when resized
    cv2.setWindowProperty(window_name, cv2.WND_PROP_ASPECT_RATIO, cv2.WINDOW_KEEPRATIO)
    # OPTIONAL: Set a better default size that isn't too small
    cv2.resizeWindow(window_name, 1280, 720)
    
    print("\n✓ Application started! Show your signs...\n")

    frame_count = 0
    while True:
        success, img = cap.read()
        if not success:
            print("Warning: Failed to read frame from camera")
            break
        
        frame_count += 1
        img = cv2.flip(img, 1)
        display_img = img.copy()
        
        # 1. Detect Hands (Process every frame for smoothness)
        display_img = detector.find_hands(display_img)
        landmarks = detector.get_landmarks(img)
        
        current_prediction = None
        
        # 2. Recognize gesture if hand is present
        if landmarks:
            gesture = detector.recognize_gesture(landmarks)
            if gesture:
                current_prediction = gesture
        else:
            # Clear buffer when no hand detected
            detector.gesture_buffer.clear()
        
        # 3. Temporal stabilization with GestureManager
        stabilized = manager.update(current_prediction)
        
        # 4. Handle "Final" word detection (cooldown/new word)
        final_word = manager.get_final_word(stabilized)
        if final_word:
            print(f"DEBUG: Gesture detected and ready: {final_word}")
            voice.speak(final_word)
            print(f"🔊 Speaking: {final_word}")
            
        # 5. Sentence Finalization (Silence detection)
        sentence_to_speak = manager.should_finalize_sentence()
        if sentence_to_speak:
            print(f"✓ Sentence completed: {sentence_to_speak}")
            # Also speak the whole sentence for better context
            voice.speak(f"Sentence completed: {sentence_to_speak}")

        # --- PREMIUM UI OVERLAY ---
        h, w = display_img.shape[:2]
        
        # Semi-transparent top bar (Glassmorphism effect)
        overlay = display_img.copy()
        cv2.rectangle(overlay, (0, 0), (w, 90), (40, 40, 40), -1)
        cv2.addWeighted(overlay, 0.6, display_img, 0.4, 0, display_img)
        
        # Top boundary line (accent)
        cv2.line(display_img, (0, 90), (w, 90), (0, 255, 127), 2)
        
        # Current Prediction with better styling
        word_text = stabilized if stabilized else "..."
        color = (0, 255, 127) if stabilized else (200, 200, 200)
        cv2.putText(display_img, f"SIGN: {word_text.upper()}", 
                    (25, 60), cv2.FONT_HERSHEY_DUPLEX, 1.2, color, 2)
        
        # FPS Indicator
        fps = fps_counter.get_fps()
        cv2.putText(display_img, f"FPS: {fps}", (w - 140, 55), 
                    cv2.FONT_HERSHEY_PLAIN, 1.2, (255, 255, 255), 1)
        
        # Semi-transparent bottom bar
        overlay_bottom = display_img.copy()
        cv2.rectangle(overlay_bottom, (0, h - 100), (w, h), (30, 30, 30), -1)
        cv2.addWeighted(overlay_bottom, 0.7, display_img, 0.3, 0, display_img)
        cv2.line(display_img, (0, h - 100), (w, h - 100), (0, 165, 255), 2)
        
        # Sentence Display
        current_sentence = " ".join(manager.sentence)
        if not current_sentence:
            current_sentence = "Ready for signs..."
        
        # Wrap/Truncate sentence
        if len(current_sentence) > 45:
            current_sentence = "..." + current_sentence[-42:]
        
        cv2.putText(display_img, f"SENTENCE: {current_sentence}", 
                    (25, h - 45), cv2.FONT_HERSHEY_DUPLEX, 0.9, (255, 255, 255), 1)
        
        # Instructions (Subtle)
        cv2.putText(display_img, "Press 'Q' to quit | Lower hand to end sentence", 
                    (w - 380, h - 15), cv2.FONT_HERSHEY_PLAIN, 0.8, (180, 180, 180), 1)

        # Get current window size to prevent stretching
        win_w, win_h = 1280, 720 # Default
        try:
            _, _, cur_w, cur_h = cv2.getWindowImageRect(window_name)
            if cur_w > 0 and cur_h > 0:
                win_w, win_h = cur_w, cur_h
        except:
            pass
            
        # Calculate scaling to fit without stretching (Letterboxing)
        scale_w = win_w / w
        scale_h = win_h / h
        scale = min(scale_w, scale_h)
        
        new_w = int(w * scale)
        new_h = int(h * scale)
        
        # Resize image
        resized = cv2.resize(display_img, (new_w, new_h), interpolation=cv2.INTER_AREA)
        
        # Create a black canvas of window size
        canvas = np.zeros((win_h, win_w, 3), dtype=np.uint8)
        
        # Center the resized image on canvas
        start_y = (win_h - new_h) // 2
        start_x = (win_w - new_w) // 2
        canvas[start_y:start_y+new_h, start_x:start_x+new_w] = resized

        cv2.imshow(window_name, canvas)
        
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q') or key == ord('Q'):
            print("\n" + "=" * 60)
            print("Shutting down cleanly...")
            break

    cap.release()
    cv2.destroyAllWindows()
    voice.stop()
    print("✓ SignToWords closed successfully!")
    print("=" * 60)

if __name__ == "__main__":
    import numpy as np # Ensure numpy is available for canvas
    try:
        run_app()
    except KeyboardInterrupt:
        print("\n\n" + "=" * 60)
        print("Application interrupted by user.")
        print("=" * 60)
    except Exception as e:
        print("\n\n" + "=" * 60)
        print(f"ERROR: {e}")
        print("=" * 60)
        import traceback
        traceback.print_exc()
        input("\nPress Enter to exit...")
