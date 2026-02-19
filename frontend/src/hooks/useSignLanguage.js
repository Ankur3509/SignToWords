
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

    // Refs for tracking state
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
        if (loading) setLoading(false);

        const canvas = canvasRef.current;
        if (!canvas || !videoRef.current) return;

        // Auto-fix canvas resolution
        const video = videoRef.current;
        if (video.videoWidth > 0 && (canvas.width !== video.videoWidth)) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        }

        const canvasCtx = canvas.getContext('2d');
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

        // MIRROR FIX: The video is mirrored in CSS, so we must mirror the canvas context
        // This makes sure the green skeleton aligns with the hand on screen
        canvasCtx.translate(canvas.width, 0);
        canvasCtx.scale(-1, 1);

        // Draw landmarks for VISUAL FEEDBACK
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            for (const landmarks of results.multiHandLandmarks) {
                drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS,
                    { color: '#10b981', lineWidth: 4 });
                drawLandmarks(canvasCtx, landmarks, { color: '#ffffff', lineWidth: 1, radius: 2 });
            }
        }

        let currentPrediction = null;

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            currentPrediction = recognizeGesture(landmarks);
            silenceCounter.current = 0;
        } else {
            silenceCounter.current += 1;
            if (silenceCounter.current > silenceThreshold) {
                lastWord.current = null;
            }
        }

        if (currentPrediction) {
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

        canvasCtx.restore();
    }, [canvasRef, videoRef, loading]);

    useEffect(() => {
        let hands = null;
        let camera = null;

        const initTracking = async () => {
            try {
                hands = new Hands({
                    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
                });

                // modelComplexity 0 is faster and works better on many webcams
                hands.setOptions({
                    maxNumHands: 1,
                    modelComplexity: 0,
                    minDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.5,
                });

                hands.onResults(processResults);

                if (videoRef.current && isCameraActive) {
                    camera = new Camera(videoRef.current, {
                        onFrame: async () => {
                            if (hands) {
                                await hands.process({ image: videoRef.current });
                            }
                        },
                        width: 1280,
                        height: 720,
                    });

                    await camera.start();
                    console.log("Tracking engine started");
                }
            } catch (err) {
                console.error("Tracking error:", err);
                setError(err.message);
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
