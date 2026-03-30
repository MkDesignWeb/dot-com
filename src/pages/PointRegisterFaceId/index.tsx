import "@tensorflow/tfjs";
import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import PasswordRoundedIcon from "@mui/icons-material/PasswordRounded";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { usePointRegistration } from "../../hooks/usePointRegistration";

const MODEL_PATH = "/models";
const DETECTOR_OPTIONS = new faceapi.TinyFaceDetectorOptions({
  inputSize: 320,
  scoreThreshold: 0.5,
});

const formatPtBrDateTime = (value: string) => {
  if (!value) return "";

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) return value;

  return parsedDate.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
};

const drawGuide = (
  canvas: HTMLCanvasElement,
  detection?: faceapi.FaceDetection,
  sourceWidth?: number,
  sourceHeight?: number,
) => {
  const context = canvas.getContext("2d");
  if (!context) return;

  context.clearRect(0, 0, canvas.width, canvas.height);

  context.strokeStyle = "rgba(255, 255, 255, 0.85)";
  context.lineWidth = 3;
  const horizontalMargin = Math.max(canvas.width * 0.14, 28);
  const verticalMargin = Math.max(canvas.height * 0.12, 34);
  const guideWidth = canvas.width - horizontalMargin * 2;
  const guideHeight = canvas.height - verticalMargin * 2;
  context.strokeRect(horizontalMargin, verticalMargin, guideWidth, guideHeight);

  if (detection) {
    const scaleX = canvas.width / (sourceWidth || canvas.width);
    const scaleY = canvas.height / (sourceHeight || canvas.height);
    const { x, y, width, height } = detection.box;

    context.strokeStyle = "rgba(0, 166, 81, 0.95)";
    context.lineWidth = 4;
    context.strokeRect(x * scaleX, y * scaleY, width * scaleX, height * scaleY);
  }
};

export const PointRegisterFaceId = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const processingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionFrameRef = useRef<number | null>(null);

  const { status, errorMessage, systemLocalDate, employeeName, registerPointWithDescriptor, reset } = usePointRegistration();

  const [isBooting, setIsBooting] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [fatalError, setFatalError] = useState("");
  const [showPasswordFallback, setShowPasswordFallback] = useState(false);

  const syncOverlay = () => {
    const video = videoRef.current;
    const overlay = overlayCanvasRef.current;
    if (!video || !overlay) return;

    const width = video.clientWidth;
    const height = video.clientHeight;
    if (!width || !height) return;

    overlay.width = width;
    overlay.height = height;
    drawGuide(overlay);
  };

  useEffect(() => {
    const overlayCanvas = overlayCanvasRef.current;
    const video = videoRef.current;

    if (!overlayCanvas || !video || !isReady || isBusy || status === "success" || fatalError) {
      if (overlayCanvas) {
        drawGuide(overlayCanvas);
      }
      if (detectionFrameRef.current !== null) {
        window.cancelAnimationFrame(detectionFrameRef.current);
        detectionFrameRef.current = null;
      }
      return undefined;
    }

    let cancelled = false;

    const detectFaceInRealtime = async () => {
      if (cancelled) return;

      const currentVideo = videoRef.current;
      const currentOverlay = overlayCanvasRef.current;

      if (!currentVideo || !currentOverlay || currentVideo.readyState < 2 || !currentVideo.videoWidth || !currentVideo.videoHeight) {
        detectionFrameRef.current = window.requestAnimationFrame(() => {
          void detectFaceInRealtime();
        });
        return;
      }

      try {
        const detection = await faceapi.detectSingleFace(currentVideo, DETECTOR_OPTIONS);

        if (!cancelled && overlayCanvasRef.current) {
          drawGuide(
            overlayCanvasRef.current,
            detection,
            currentVideo.videoWidth,
            currentVideo.videoHeight,
          );
        }
      } catch {
        if (!cancelled && overlayCanvasRef.current) {
          drawGuide(overlayCanvasRef.current);
        }
      }

      detectionFrameRef.current = window.requestAnimationFrame(() => {
        void detectFaceInRealtime();
      });
    };

    detectionFrameRef.current = window.requestAnimationFrame(() => {
      void detectFaceInRealtime();
    });

    return () => {
      cancelled = true;
      if (detectionFrameRef.current !== null) {
        window.cancelAnimationFrame(detectionFrameRef.current);
        detectionFrameRef.current = null;
      }
    };
  }, [fatalError, isAnalyzing, isBooting, isReady, status]);

  useEffect(() => {
    let isMounted = true;

    const startCameraFlow = async () => {
      try {
        setIsBooting(true);
        setFatalError("");
        setFeedbackMessage("Carregando reconhecimento facial...");

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_PATH),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_PATH),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_PATH),
        ]);

        if (!isMounted) return;

        setFeedbackMessage("Solicitando acesso a camera...");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        const video = videoRef.current;
        if (!video) throw new Error("Camera indisponivel.");

        video.srcObject = stream;
        await video.play();

        if (!isMounted) return;

        syncOverlay();
        setFeedbackMessage("");
        setIsReady(true);
      } catch (error) {
        if (!isMounted) return;

        const message =
          error instanceof Error && error.message
            ? error.message
            : "Nao foi possivel inicializar a camera para o reconhecimento facial.";

        setFatalError(message);
        setShowPasswordFallback(true);
        setIsReady(false);
      } finally {
        if (isMounted) {
          setIsBooting(false);
        }
      }
    };

    void startCameraFlow();

    const handleResize = () => syncOverlay();
    window.addEventListener("resize", handleResize);

    return () => {
      isMounted = false;
      window.removeEventListener("resize", handleResize);
      if (detectionFrameRef.current !== null) {
        window.cancelAnimationFrame(detectionFrameRef.current);
        detectionFrameRef.current = null;
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      reset();
    };
  }, []);

  useEffect(() => {
    if (status === "success") {
      setFeedbackMessage(
        `Ponto registrado com sucesso${systemLocalDate ? ` em ${formatPtBrDateTime(systemLocalDate)}` : ""}.`,
      );
      setIsReady(false);

      const timer = window.setTimeout(() => {
        navigate("/");
      }, 3000);

      return () => window.clearTimeout(timer);
    }

    if (status === "error" || status === "maxPunch") {
      setFeedbackMessage(errorMessage);
      setShowPasswordFallback(true);
      setIsReady(Boolean(videoRef.current) && !fatalError);
    }

    return undefined;
  }, [errorMessage, fatalError, navigate, status, systemLocalDate]);

  const handleCameraTap = async () => {
    if (!isReady || isBooting || isAnalyzing || status === "loading" || fatalError) return;

    const video = videoRef.current;
    const processingCanvas = processingCanvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;

    if (!video || !processingCanvas || !overlayCanvas || !video.videoWidth || !video.videoHeight) {
      setFatalError("A camera ainda nao esta pronta para capturar o rosto.");
      setShowPasswordFallback(true);
      return;
    }

    try {
      setIsAnalyzing(true);
      setFeedbackMessage("");
      reset();

      processingCanvas.width = video.videoWidth;
      processingCanvas.height = video.videoHeight;
      const context = processingCanvas.getContext("2d");

      if (!context) {
        throw new Error("Nao foi possivel preparar a captura da camera.");
      }

      context.drawImage(video, 0, 0, processingCanvas.width, processingCanvas.height);

      const detections = await faceapi
        .detectAllFaces(processingCanvas, DETECTOR_OPTIONS)
        .withFaceLandmarks(true)
        .withFaceDescriptors();

      if (!detections.length) {
        setFeedbackMessage("Nenhum rosto foi identificado. Tente novamente olhando para a camera.");
        drawGuide(overlayCanvas);
        return;
      }

      if (detections.length > 1) {
        setFeedbackMessage("Mais de um rosto foi encontrado. Deixe apenas uma pessoa na camera.");
        drawGuide(overlayCanvas);
        return;
      }

      drawGuide(overlayCanvas, detections[0].detection, video.videoWidth, video.videoHeight);
      await registerPointWithDescriptor(Array.from(detections[0].descriptor));
    } catch (error) {
      const message =
        error instanceof Error && error.message ? error.message : "Nao foi possivel processar o rosto capturado.";
      setFeedbackMessage(message);
      setShowPasswordFallback(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const isBusy = isBooting || isAnalyzing || status === "loading";
  const overlayTitle = status === "success" ? "Ponto confirmado" : isBusy ? "Processando" : "";
  const overlayText =
    status === "success"
      ? feedbackMessage
      : isBooting
        ? feedbackMessage || "Preparando camera..."
        : isAnalyzing || status === "loading"
          ? "Capturando e enviando a referencia facial..."
          : "";

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        maxHeight: "100%",
        minHeight: 0,
        overflow: "hidden",
        bgcolor: "#08120d",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: 16,
          left: 16,
          zIndex: 4,
        }}
      >
        <Button
          component={RouterLink}
          to="/"
          variant="contained"
          color="secondary"
          startIcon={<ArrowBackRoundedIcon />}
          disabled={isBusy}
        >
          Voltar
        </Button>
      </Box>

      {showPasswordFallback ? (
        <Button
          component={RouterLink}
          to="/pointRegister/password"
          variant="contained"
          color="primary"
          startIcon={<PasswordRoundedIcon />}
          sx={{
            position: "absolute",
            left: "50%",
            bottom: 110,
            transform: "translateX(-50%)",
            zIndex: 4,
            minHeight: 64,
            px: 2.5,
          }}
        >
          Registrar com senha
        </Button>
      ) : null}

      <Box
        role="button"
        tabIndex={0}
        onClick={() => void handleCameraTap()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            void handleCameraTap();
          }
        }}
        sx={{
          position: "relative",
          display: "flex",
          justifyContent: "center",
          height: "100%",
          width: "100%",
          maxHeight: "100%",
          minHeight: 0,
          boxSizing: "border-box",
          overflow: "hidden",
          borderLeft: "4px solid rgba(255, 255, 255, 0.18)",
          borderRight: "4px solid rgba(255, 255, 255, 0.18)",
          outline: "none",
          cursor: isReady && !isBusy ? "pointer" : "default",
        }}
      >
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          onLoadedMetadata={syncOverlay}
          style={{
            display: "block",
            height: "100%",
            maxHeight: "100%",
            objectFit: "cover",
            filter: isBusy || status === "success" ? "brightness(0.7)" : "none",
          }}
        />

        <canvas
          ref={overlayCanvasRef}
          style={{
            position: "absolute",
            height: "100%",
            pointerEvents: "none",
          }}
        />

        <canvas ref={processingCanvasRef} style={{ display: "none" }} />

        <Box
          sx={{
            position: "absolute",
            insetInline: 0,
            bottom: 0,
            p: { xs: 3, md: 4 },
            background: "linear-gradient(180deg, rgba(8,18,13,0) 0%, rgba(8,18,13,0.76) 55%, rgba(8,18,13,0.92) 100%)",
            pointerEvents: "none",
          }}
        >
          <Stack spacing={1} alignItems="center" textAlign="center">
            <Typography variant="h4" sx={{ color: "#fff", fontWeight: 700 }}>
              Registrar ponto com Face ID
            </Typography>
            <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.9)", maxWidth: 720 }}>
              Pressione em qualquer lugar da camera para registrar o ponto.
            </Typography>
          </Stack>
        </Box>

        {feedbackMessage && status !== "success" && !isBusy ? (
          <Alert
          
            severity={fatalError ? "error" : "warning"}
            sx={{
              position: "absolute",
              left: "50%",
              top: 12,
              transform: "translateX(-50%)",
              width: "min(640px, calc(100% - 32px))",
              zIndex: 3,
            }}
          >
            {fatalError || feedbackMessage}
          </Alert>
        ) : null}

        {fatalError && !feedbackMessage ? (
          <Alert
            severity="error"
            sx={{
              position: "absolute",
              left: "50%",
              top: 12,
              transform: "translateX(-50%)",
              width: "min(640px, calc(100% - 32px))",
              zIndex: 3,
            }}
          >
            {fatalError}
          </Alert>
        ) : null}

        {(isBusy || status === "success") && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              bgcolor: "rgba(8, 18, 13, 0.45)",
              zIndex: 2,
            }}
          >
            <Stack
              spacing={2}
              alignItems="center"
              sx={{
                px: { xs: 3, md: 5 },
                py: { xs: 3, md: 4 },
                borderRadius: 3,
                bgcolor:
                  status === "success"
                    ? "rgba(10, 73, 38, 0.92)"
                    : "rgba(8, 18, 13, 0.72)",
                border:
                  status === "success"
                    ? "1px solid rgba(108, 255, 163, 0.45)"
                    : "1px solid rgba(255, 255, 255, 0.08)",
                boxShadow:
                  status === "success"
                    ? "0 20px 48px rgba(7, 56, 29, 0.42)"
                    : "none",
                color: "#fff",
              }}
            >
              {status !== "success" ? <CircularProgress color="inherit" size={34} /> : null}
              <Typography
                variant={status === "success" ? "h4" : "h5"}
                sx={{
                  fontWeight: status === "success" ? 800 : 600,
                  color: status === "success" ? "#b8ffd1" : "#fff",
                  textAlign: "center",
                }}
              >
                {overlayTitle}
              </Typography>
              {status === "success" && employeeName ? (
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    textAlign: "center",
                    color: "#ffffff",
                  }}
                >
                  {employeeName}
                </Typography>
              ) : null}
              <Typography
                variant={status === "success" ? "h6" : "body2"}
                sx={{
                  textAlign: "center",
                  maxWidth: status === "success" ? 440 : 320,
                  color: status === "success" ? "rgba(233,255,241,0.96)" : "rgba(255,255,255,0.88)",
                  fontSize: status === "success" ? { xs: "1.05rem", md: "1.2rem" } : undefined,
                  lineHeight: status === "success" ? 1.5 : undefined,
                }}
              >
                {overlayText}
              </Typography>
            </Stack>
          </Box>
        )}
      </Box>
    </Box>
  );
};
