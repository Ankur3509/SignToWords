
import { useEffect, useRef, useState, useCallback } from 'react';
import { recognizeGesture } from '../utils/gestureLogic';

/* 
  NOTE: We are using the MediaPipe scripts loaded in index.html via CDN 
  to avoid Vite/NPM bundling issues like "process is not a function".
*/

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
    const frameCount = useRef(0);

    const speak = (text) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            window.speechSynthesis.speak(utterance);
        }
    };

    const processResults = useCallback((results) => {
        if (loading) setLoading(false);
        frameCount.current++;

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

        // Pulse indicator
        canvasCtx.fillStyle = '#10b981';
        canvasCtx.beginPath();
        canvasCtx.arc(30, 30, (frameCount.current % 10) + 5, 0, Math.PI * 2);
        canvasCtx.fill();

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            // Use window.drawConnectors and window.drawLandmarks from drawing_utils.js
            if (window.drawConnectors && window.drawLandmarks && window.HAND_CONNECTIONS) {
                for (const landmarks of results.multiHandLandmarks) {
                    window.drawConnectors(canvasCtx, landmarks, window.HAND_CONNECTIONS,
                        { color: '#10b981', lineWidth: 4 });
                    window.drawLandmarks(canvasCtx, landmarks, { color: '#ffffff', lineWidth: 1, radius: 2 });
                }
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
                    if ((currentTime - lastSpokenTime.current) > cooldownSeconds) {
                        if (stabilized !== lastWord.current || lastWord.current === null) {
                            lastWord.current = stabilized;
                            lastSpokenTime.current = currentTime;
                            speak(stabilized);
                            setSentence(prev => [...prev, stabilized]);
                        }
                    }
                }
            }
        } else {
            setGesture(null);
            silenceCounter.current++;
            if (silenceCounter.current > silenceThreshold) {
                lastWord.current = null;
            }
        }

        canvasCtx.restore();
    }, [canvasRef, videoRef, loading]);

    useEffect(() => {
        let hands = null;
        let camera = null;

        if (!isCameraActive) return;

        // Check if scripts are loaded
        if (!window.Hands || !window.Camera) {
            console.error("MediaPipe scripts not loaded from CDN!");
            setError("AI engine files failed to load. Please check your internet connection.");
            setLoading(false);
            return;
        }

        const init = async () => {
            try {
                console.log("Initializing MediaPipe Hands (CDN version)...");

                hands = new window.Hands({
                    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
                });

                hands.setOptions({
                    maxNumHands: 1,
                    modelComplexity: 0,
                    minDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.5,
                    selfieMode: true
                });

                hands.onResults(processResults);

                if (videoRef.current) {
                    camera = new window.Camera(videoRef.current, {
                        onFrame: async () => {
                            if (hands) {
                                // The CDN version sometimes uses .send() or .process() depending on build
                                try {
                                    await hands.send({ image: videoRef.current });
                                } catch (e) {
                                    try {
                                        await hands.process({ image: videoRef.current });
                                    } catch (e2) {
                                        console.error("Critical: Camera hand processing failed.", e2);
                                    }
                                }
                            }
                        },
                        width: 1280,
                        height: 720,
                    });
                    await camera.start();
                }
            } catch (err) {
                console.error("Initialization Error:", err);
                setError(err.message);
            }
        };

        init();

        return () => {
            if (camera) camera.stop();
            if (hands) hands.close();
        };
    }, [isCameraActive, videoRef, processResults]);

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
