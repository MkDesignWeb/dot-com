import * as faceapi from "@vladmandic/face-api";
import { useEffect, useRef, useState, useCallback, type RefObject } from "react";

interface UseFaceApiDetectionOptions {
  modelPath: string;
  detectorOptions: faceapi.TinyFaceDetectorOptions;
}

export const useFaceApiDetection = (
  videoRef: RefObject<HTMLVideoElement | null>,
  options: UseFaceApiDetectionOptions
) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [detection, setDetection] = useState<faceapi.FaceDetection | null>(null);
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const detectionFrameRef = useRef<number | null>(null);

  const stopCamera = useCallback(() => {
    if (detectionFrameRef.current !== null) {
      cancelAnimationFrame(detectionFrameRef.current);
      detectionFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsCameraReady(false);
    setDetection(null);
  }, [videoRef]);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraReady(true);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível acessar a câmera.";
      setError(message);
      setIsCameraReady(false);
      throw err;
    }
  }, [videoRef]);

  // Load models
  useEffect(() => {
    let isMounted = true;
    const loadModels = async () => {
      try {
        // Essential models for the current flow
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(options.modelPath),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri(options.modelPath),
          faceapi.nets.faceRecognitionNet.loadFromUri(options.modelPath),
        ]);
        if (isMounted) {
          setIsLoaded(true);
        }
      } catch (err) {
        if (isMounted) {
          setError("Erro ao carregar modelos do Face API.");
        }
      }
    };
    loadModels();
    return () => {
      isMounted = false;
    };
  }, [options.modelPath]);

  // Detection loop
  useEffect(() => {
    let cancelled = false;

    const detectFace = async () => {
      if (cancelled || !isLoaded || !isCameraReady || !videoRef.current) {
        return;
      }

      const video = videoRef.current;
      if (video.readyState < 2 || video.paused || video.ended) {
        detectionFrameRef.current = requestAnimationFrame(detectFace);
        return;
      }

      try {
        const result = await faceapi.detectSingleFace(video, options.detectorOptions);
        if (!cancelled) {
          setDetection(result || null);
        }
      } catch (err) {
        // Silently ignore detection errors in the loop
      }

      if (!cancelled) {
        detectionFrameRef.current = requestAnimationFrame(detectFace);
      }
    };

    if (isLoaded && isCameraReady) {
      detectionFrameRef.current = requestAnimationFrame(detectFace);
    }

    return () => {
      cancelled = true;
      if (detectionFrameRef.current !== null) {
        cancelAnimationFrame(detectionFrameRef.current);
        detectionFrameRef.current = null;
      }
    };
  }, [isLoaded, isCameraReady, options.detectorOptions, videoRef]);

  const captureDescriptor = useCallback(async () => {
    if (!videoRef.current || !isLoaded) {
      return null;
    }

    try {
      const result = await faceapi
        .detectSingleFace(videoRef.current, options.detectorOptions)
        .withFaceLandmarks(true)
        .withFaceDescriptor();

      return result || null;
    } catch (err) {
      console.error("Falha ao capturar descritor facial:", err);
      return null;
    }
  }, [isLoaded, options.detectorOptions, videoRef]);

  return {
    isLoaded,
    isCameraReady,
    detection,
    error,
    startCamera,
    stopCamera,
    captureDescriptor,
  };
};
