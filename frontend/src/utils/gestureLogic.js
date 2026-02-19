
export const recognizeGesture = (landmarks) => {
  if (!landmarks || landmarks.length !== 21) return null;

  const getExtendedFingers = () => {
    const ext = [];
    const lm = landmarks;

    // Thumb: More complex logic needed for JS/Webcam mirror
    // We use the distance between thumb tip and pinky base as a heuristic for extension
    // or just compare x coordinates.
    // In MediaPipe JS, x increases from left to right.
    const isThumbExtended = lm[5].x > lm[17].x 
      ? lm[4].x > lm[2].x 
      : lm[4].x < lm[2].x;
    ext.push(isThumbExtended);

    // Fingers: 8, 12, 16, 20 are tips; 6, 10, 14, 18 are mid-joints
    for (let i = 0; i < 4; i++) {
      const tip = [8, 12, 16, 20][i];
      const mid = [6, 10, 14, 18][i];
      // On web, y = 0 is top. So tip.y < mid.y means tip is above mid.
      ext.push(lm[tip].y < lm[mid].y);
    }
    return ext;
  };

  const ext = getExtendedFingers();
  const count = ext.filter(x => x).length;

  const dist = (p1, p2) => Math.sqrt(
    Math.pow(p1.x - p2.x, 2) + 
    Math.pow(p1.y - p2.y, 2) + 
    Math.pow(p1.z - p2.z, 2)
  );

  const thumbIndexDist = dist(landmarks[4], landmarks[8]);

  // Specific Gesture Logic
  
  // 1. Complex/Specific multi-finger gestures
  if (thumbIndexDist < 0.05 && count >= 3) return "OK";
  if (ext[0] && ext[1] && ext[4] && !ext[2] && !ext[3]) return "I Love You";
  if (ext[1] && ext[2] && !ext[0] && !ext[3] && !ext[4]) return "Peace";
  
  // 2. Specific palm-based gestures
  // Stop sign - open palm facing forward (hand center above wrist)
  if (count === 5 && landmarks[9].y < landmarks[0].y) return "Stop";
  
  // Numbers
  if (ext[1] && !ext[2] && !ext[3] && !ext[4]) return "One";
  if (ext[1] && ext[2] && !ext[3] && !ext[4]) return "Two";
  if (!ext[0] && ext[1] && ext[2] && ext[3] && !ext[4]) return "Three";
  if (!ext[0] && ext[1] && ext[2] && ext[3] && ext[4]) return "Four";
  
  // All fingers extended (General)
  if (count === 5) return "Hello";
  
  // Thumbs up/Good
  if (ext[0] && count === 1) return "Good";
  
  // Fist/Yes
  if (count === 0) return "Yes";
  
  // Help - Raised hand with specific 3 fingers (Middle, Ring, Pinky)
  if (!ext[1] && ext[2] && ext[3] && ext[4]) return "Help";
  
  // Thank You - open palm
  if (count >= 4 && ext[0]) return "Thank You";

  return null;
};
