import pyttsx3
import threading
import queue
import pythoncom
import os
import time

class VoiceEngine:
    def __init__(self):
        # Initialize the engine in the main thread
        # This is more stable on Windows for certain pyttsx3 drivers
        self.speech_queue = queue.Queue()
        self.running = True
        
        try:
            print("✓ Initializing TTS engine...")
            self.engine = pyttsx3.init()
            self.engine.setProperty('rate', 160)
            self.engine.setProperty('volume', 1.0)
            
            voices = self.engine.getProperty('voices')
            if len(voices) > 1:
                self.engine.setProperty('voice', voices[1].id)
            print(f"✓ TTS Engine ready with {len(voices)} voices found.")
        except Exception as e:
            print(f"FAILED to init TTS: {e}")
            self.engine = None

        # Start the speech thread
        self.speech_thread = threading.Thread(target=self._speech_worker, daemon=True)
        self.speech_thread.start()
        print("✓ Voice engine thread started.")

    def _speech_worker(self):
        """Background worker that processes speech requests."""
        if not self.engine:
            return

        try:
            # Initialize COM for the background thread (Critical for Windows SAPI5)
            if os.name == 'nt':
                pythoncom.CoInitialize()
            
            # Process queue
            while self.running:
                try:
                    text = self.speech_queue.get(timeout=0.1)
                    if text:
                        print(f"[Voice] Speaking now: '{text}'")
                        self.engine.say(text)
                        self.engine.runAndWait()
                        print(f"[Voice] Finished speaking: '{text}'")
                    self.speech_queue.task_done()
                except queue.Empty:
                    continue
                except Exception as e:
                    print(f"TTS Loop Error: {e}")
            
            if os.name == 'nt':
                pythoncom.CoUninitialize()
                
        except Exception as e:
            print(f"TTS Fatal Error: {e}")
            import traceback
            traceback.print_exc()

    def speak(self, text):
        """Public method to speak text without blocking."""
        if text:
            # print(f"DEBUG: Adding to queue: {text}")
            self.speech_queue.put(text)
    
    def stop(self):
        """Stop the speech engine."""
        self.running = False
        if hasattr(self, 'speech_thread') and self.speech_thread.is_alive():
            # Don't wait too long for join to avoid hanging on exit
            self.speech_thread.join(timeout=0.5)

# For quick testing
if __name__ == "__main__":
    v = VoiceEngine()
    print("Testing VoiceEngine... (Waiting 2s)")
    v.speak("First word.")
    time.sleep(1)
    v.speak("Second word.")
    time.sleep(1)
    v.speak("Third word.")
    time.sleep(5)
    v.stop()
    print("Test complete.")
