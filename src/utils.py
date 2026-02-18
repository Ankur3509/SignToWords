import time
from collections import Counter

class GestureManager:
    def __init__(self, buffer_size=10, cooldown_seconds=0.8, silence_threshold=15):
        """
        Manages gesture recognition with temporal smoothing.
        
        Args:
            buffer_size: Number of frames to buffer for stabilization
            cooldown_seconds: Time between recognizing different words (default: 0.8s)
            silence_threshold: Frames without hand to finalize sentence (default: 15)
        """
        self.buffer = []
        self.buffer_size = buffer_size
        self.cooldown_seconds = cooldown_seconds
        self.last_spoken_time = 0
        self.last_word = None
        
        self.silence_counter = 0
        self.silence_threshold = silence_threshold
        
        self.sentence = []

    def update(self, word):
        """Adds a word to the buffer and returns the stabilized prediction."""
        if word is None:
            self.silence_counter += 1
            if self.silence_counter > self.silence_threshold:
                self.last_word = None # Reset last word so it can be repeated
            return None
        
        self.silence_counter = 0
        self.buffer.append(word)
        if len(self.buffer) > self.buffer_size:
            self.buffer.pop(0)
            
        # Get the most frequent word in the buffer
        if len(self.buffer) < self.buffer_size // 2:
            return None
            
        most_common = Counter(self.buffer).most_common(1)[0][0]
        return most_common

    def get_final_word(self, stabilized_word):
        """Handles cooldown and returns a word if it's ready to be 'spoken/written'."""
        current_time = time.time()
        
        # If we have a stabilized word and enough time has passed
        if stabilized_word:
            # Allow repetition if enough time has passed OR if it's a new word
            time_passed = (current_time - self.last_spoken_time) > self.cooldown_seconds
            is_new_word = stabilized_word != self.last_word
            
            if time_passed and (is_new_word or self.last_word is None):
                self.last_word = stabilized_word
                self.last_spoken_time = current_time
                self.sentence.append(stabilized_word)
                return stabilized_word
        return None

    def should_finalize_sentence(self):
        """Check if hands have been down long enough to complete a sentence."""
        if self.silence_counter >= self.silence_threshold and len(self.sentence) > 0:
            full_sentence = " ".join(self.sentence)
            self.sentence = []
            self.silence_counter = 0
            return full_sentence
        return None

class FPS:
    def __init__(self):
        self.prev_time = 0
        
    def get_fps(self):
        curr_time = time.time()
        fps = 1 / (curr_time - self.prev_time) if (curr_time - self.prev_time) > 0 else 0
        self.prev_time = curr_time
        return int(fps)
