
import { useEffect, useRef, useState, useCallback } from 'react';
import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { recognizeGesture } from '../utils/gestureLogic';

export const useSignLanguage = (videoRef, canvasRef) => {
    const [gesture, setGesture] = useState(null);
    const [sentence, setSentence] = useState([]);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [loading, setLoading] = useState(true);

    // Refs for tracking state without re-renders
    const lastSpokenTime = useRef(0);
    const lastWord = useRef(null);
    const silenceCounter = useRef(0);
    const buffer = useRef([]);
    const bufferSize = 10;
    const cooldownSeconds = 1.2;
    const silenceThreshold = 40; // Number of frames without hand to finish sentence

    const speak = (text) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // Stop current speech
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 1.1;
            window.speechSynthesis.speak(utterance);
        }
    };

    const processResults = useCallback((results) => {
        setLoading(false);
        const canvasCtx = canvasRef.current.getContext('2d');
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        // Draw landmarks if needed (optional visualization)
        // if (results.multiHandLandmarks) { ... }

        let currentPrediction = null;

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            currentPrediction = recognizeGesture(landmarks);
            silenceCounter.current = 0;
        } else {
            silenceCounter.current += 1;
            if (silenceCounter.current > silenceThreshold) {
                if (sentence.length > 0) {
                    // Finalize sentence if needed
                    // speak("Sentence completed: " + sentence.join(' '));
                    // setSentence([]);
                }
                lastWord.current = null;
            }
        }

        // Temporal stabilization (similar to GestureManager.py)
        if (currentPrediction) {
            buffer.current.push(currentPrediction);
            if (buffer.current.length > bufferSize) buffer.current.shift();

            if (buffer.current.length >= bufferSize / 2) {
                const counts = {};
                buffer.current.forEach(w => counts[w] = (counts[w] || 0) + 1);
                const stabilized = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);

                setGesture(stabilized);

                // Final word detection logic
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
    }, [canvasRef, sentence]);

    useEffect(() => {
        const hands = new Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.7,
            minTrackingConfidence: 0.7,
        });

        hands.onResults(processResults);

        let camera = null;
        if (videoRef.current) {
            camera = new Camera(videoRef.current, {
                onFrame: async () => {
                    await hands.process({ image: videoRef.current });
                },
                width: 1280,
                height: 720,
            });

            if (isCameraActive) {
                camera.start();
            }
        }

        return () => {
            if (camera) camera.stop();
            hands.close();
        };
    }, [videoRef, isCameraActive, processResults]);

    const toggleCamera = () => setIsCameraActive(!isCameraActive);
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
        loading
    };
};
