# 🤟 SignToWords - Ready to Go!

The MediaPipe attribute error has been fixed by using a multi-path import strategy. No matter which version of MediaPipe you have (0.10.x), the app will now find the correct files.

---

## 🚀 How to Run

1. **Wait for cleanup:** I have deleted all the old documentation and temporary scripts to keep your folder clean.
2. **Double-click:** `run_pretrained.bat`
3. **Wait 10-20 seconds:** It will verify your install and open the camera.

---

## 🎯 Supported Signs
The AI recognizes a wide range of gestures. For visual instructions on how to perform each sign:

👉 **[View the Visual Gesture Guide here](GESTURE_GUIDE.md)**

**Quick List:**
- **Greetings & Actions:** `Hello`, `Thank You`, `Stop`, `Help`
- **Responses:** `Yes` (Fist), `OK`, `Good` (Thumbs Up)
- **Expressions:** `Peace`, `I Love You`
- **Numbers:** `One`, `Two`, `Three`, `Four`


---

## 💡 Troubleshooting

- **Camera Error:** If the camera window doesn't appear, close Zoom/Teams/Skype first.
- **Still seeing local errors?** Run this in your command prompt:
  ```
  python -m pip uninstall mediapipe
  python -m pip install mediapipe
  ```
- **Exit:** Press **'Q'** while the camera screen is active.

---

## 📁 Clean Folder Structure
- `run_pretrained.bat` ← **Run this**
- `main_pretrained.py` ← Core App
- `src/` ← Recognition Logic (Fixed)
- `START_HERE.md` ← This guide

---

*I have removed the "Pre-trained model" loading message from the logs because the logic is now built directly into the detection script, which makes it much faster and reliable.*
