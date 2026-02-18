# 🖐️ SignToWords: AI Sign Language Translator

![SignToWords Banner](https://img.shields.io/badge/AI-SignLanguage-brightgreen?style=for-the-badge&logo=mediamark)
![Python](https://img.shields.io/badge/Python-3.8+-blue?style=for-the-badge&logo=python)
![MediaPipe](https://img.shields.io/badge/MediaPipe-0.10.x-orange?style=for-the-badge&logo=google)

**SignToWords** is a high-performance, real-time Sign Language to Speech translator. Using Google's MediaPipe for ultra-fast hand tracking and a custom gesture recognition engine, it bridges the communication gap by converting hand signs into spoken words instantly.

---

## ✨ Features

*   **⚡ Real-Time Recognition:** Minimal latency using asynchronous processing.
*   **🔊 Voice Synthesis:** Integration with `pyttsx3` for high-quality, continuous speech output.
*   **📐 Auto-Scaling UI:** Premium OpenCV interface with "Glassmorphism" effects and letterboxed scaling to maintain aspect ratio on any screen size.
*   **🧠 Temporal Stabilization:** Advanced buffer logic to filter out "jumpy" detections and ensure only deliberate signs are spoken.
*   **📝 Sentence Mode:** Intelligent silence detection automatically groups signs into complete sentences.
*   **📂 No Training Required:** Works out of the box with a pre-tuned heuristic model.

---

## 🚀 Getting Started

### Prerequisites

*   Python 3.8 or higher
*   A webcam

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Ankur3509/SignToWords.git
    cd SignToWords
    ```

2.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Run the application:**
    ```bash
    python main_pretrained.py
    ```
    *Alternatively, Windows users can simply double-click `run_pretrained.bat`.*

---

## 🖐️ Supported Gestures

| Category | Gestures |
| :--- | :--- |
| **Numbers** | One, Two, Three, Four |
| **Greetings** | Hello, Thank You, Stop |
| **Responses** | Yes (Fist), OK, Good (Thumbs up) |
| **Expressions** | Peace, I Love You, Help |

For detailed visual instructions, see the **[Visual Gesture Guide](GESTURE_GUIDE.md)**.

---

## 🛠️ Tech Stack

*   **[MediaPipe](https://mediapipe.dev/):** Used for robust 21-point hand landmark detection.
*   **[OpenCV](https://opencv.org/):** Handles video stream processing and the custom UI overlay.
*   **[Pyttsx3](https://pyttsx3.readthedocs.io/):** Offline Text-to-Speech synthesis with multi-threading support.
*   **[NumPy](https://numpy.org/):** Optimized vector math for gesture geometry calculations.

---

## 💡 How it Works

1.  **Hand Landmark Extraction:** MediaPipe identifies 21 spatial coordinates of the hand.
2.  **Gesture Heuristics:** The `PretrainedSignDetector` analyzes finger extension angles and palm orientation.
3.  **Stabilization:** A sliding window buffer ensures a gesture is held for a minimum duration before recognition.
4.  **TTS Queue:** Words are pushed to a thread-safe queue for seamless, non-blocking audio output.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---
*Created with ❤️ by Ankur and the SignToWords Team*
