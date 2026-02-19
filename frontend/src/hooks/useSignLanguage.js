
import { useEffect, useRef, useState, useCallback } from 'react';
import { Hands, HAND_CONNECTIONS } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { recognizeGesture } from '../utils/gestureLogic';

export const useSignLanguage = (videoRef, canvasRef) => {
    const [gesture, setGesture] = useState(null);
    const [sentence, setSentence] = useState([]);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const lastSpokenTime = useRef(0);
    const lastWord = useRef(null);
    const silenceCounter = useRef(0);
    const buffer = useRef([]);
    const bufferSize = 10;
    const cooldownSeconds = 1.2;
    const silenceThreshold = 40;

    const speak = (text) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 1.1;
            window.speechSynthesis.speak(utterance);
        }
    };

    const processResults = useCallback((results) => {
        // If this function is called, the AI engine is definitely working!
        if (loading) {
            console.log("MediaPipe results received! AI is online.");
            setLoading(false);
        }

        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video) return;

        if (video.videoWidth > 0 && (canvas.width !== video.videoWidth)) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        }

        const canvasCtx = canvas.getContext('2d');
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

        // Mirror the drawing to match the mirrored video
        canvasCtx.translate(canvas.width, 0);
        canvasCtx.scale(-1, 1);

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            for (const landmarks of results.multiHandLandmarks) {
                drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS,
                    { color: '#10b981', lineWidth: 4 });
                drawLandmarks(canvasCtx, landmarks, { color: '#ffffff', lineWidth: 1, radius: 2 });
            }

            const landmarks = results.multiHandLandmarks[0];
            const currentPrediction = recognizeGesture(landmarks);

            if (currentPrediction) {
                silenceCounter.current = 0;
                buffer.current.push(currentPrediction);
                if (buffer.current.length > bufferSize) buffer.current.shift();

                if (buffer.current.length >= bufferSize / 2) {
                    const counts = {};
                    buffer.current.forEach(w => counts[w] = (counts[w] || 0) + 1);
                    const stabilized = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);

                    setGesture(stabilized);

                    const currentTime = Date.now() / 1000;
                    const timePassed = (currentTime - lastSpokenTime.current) > cooldownSeconds;
                    const isNewWord = stabilized !== lastWord.current;

                    if (timePassed && (isNewWord || lastWord.current === null)) {
                        lastWord.current = stabilized;
                        lastSpokenTime.current = currentTime;
                        speak(stabilized);
                        setSentence(prev => [...prev, stabilized]);
                    }
                }
            } else {
                setGesture(null);
            }
        } else {
            // No hands detected
            setGesture(null);
            silenceCounter.current += 1;
            if (silenceCounter.current > silenceThreshold) {
                lastWord.current = null;
            }
        }

        canvasCtx.restore();
    }, [canvasRef, videoRef, loading]);

    useEffect(() => {
        let hands = null;
        let camera = null;

        if (!isCameraActive) {
            setLoading(true); // Reset loading state for next time
            return;
        }

        const initTracking = async () => {
            try {
                console.log("Loading AI models...");
                hands = new Hands({
                    locateFile: (file) => {
                        // Use a specific version to avoid flaky CDN redirects
                        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`;
                    },
                });

                hands.setOptions({
                    maxNumHands: 1,
                    modelComplexity: 0,
                    minDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.5,
                    selfieMode: true // This matches our mirrored video feed
                });

                hands.onResults(processResults);

                // Wait for video to be ready before starting camera
                const startCamera = async () => {
                    if (videoRef.current) {
                        camera = new Camera(videoRef.current, {
                            onFrame: async () => {
                                if (hands && isCameraActive) {
                                    try {
                                        await hands.process({ image: videoRef.current });
                                    } catch (e) {
                                        console.error("Frame processing error:", e);
                                    }
                                }
                            },
                            width: 1280,
                            height: 720,
                        });
                        await camera.start();
                        console.log("Camera started");
                    }
                };

                startCamera();

                // Safety timeout: If AI doesn't resolve in 15 seconds, show an error
                const timeout = setTimeout(() => {
                    if (loading && isCameraActive) {
                        setError("AI initialization timed out. Please check your internet connection or try a different browser.");
                        setLoading(false);
                    }
                }, 15000);

                return () => clearTimeout(timeout);

            } catch (err) {
                console.error("AI engine failed:", err);
                setError("Failed to load AI engine: " + err.message);
                setLoading(false);
            }
        };

        initTracking();

        return () => {
            if (camera) camera.stop();
            if (hands) hands.close();
        };
    }, [videoRef, isCameraActive, processResults]);

    const toggleCamera = () => {
        setError(null);
        setIsCameraActive(!isCameraActive);
    };

    const clearSentence = () => {
        setSentence([]);
        lastWord.current = null;
    };

    return {
        gesture,
        sentence,
        isCameraActive,
        toggleCamera,
        clearSentence,
        loading,
        error
    };
};
