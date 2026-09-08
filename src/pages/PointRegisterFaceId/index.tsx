import "@tensorflow/tfjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as faceapi from "@vladmandic/face-api";
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
import { useFaceApiDetection } from "../../hooks/useFaceApiDetection";

const MODEL_PATH = "models";

/**
 * Tempo que a confirmacao fica na tela antes de voltar sozinha.
 * Subiu de 3s: agora ha o rotulo da marcacao para ler, e quem esta na fila
 * precisa do terminal livre sem depender de alguem tocar.
 */
const CONFIRMATION_MS = 6000;

/**
 * Tamanho da foto arquivada com a batida.
 *
 * 640px de largura mantem o rosto reconhecivel numa auditoria e deixa o arquivo
 * em ~40KB. O quadro em tamanho natural continua sendo usado para o
 * reconhecimento — so a evidencia e reduzida.
 */
const PHOTO_MAX_WIDTH = 640;
const PHOTO_QUALITY = 0.8;

const drawGuide = (
  canvas: HTMLCanvasElement,
  detection?: faceapi.FaceDetection | null,
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
  /** Fora da tela: guarda o quadro congelado em tamanho natural, para a leitura do rosto. */
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  /** Fora da tela: versao reduzida, exibida e arquivada como evidencia. */
  const photoCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const {
    status,
    errorMessage,
    confirmation,
    employeeName,
    registerPointWithDescriptor,
    reset,
  } = usePointRegistration();

  const detectorOptions = useMemo(
    () =>
      new faceapi.TinyFaceDetectorOptions({
        inputSize: 320,
        scoreThreshold: 0.5,
      }),
    []
  );

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [fatalError, setFatalError] = useState("");
  const [showPasswordFallback, setShowPasswordFallback] = useState(false);
  /** Foto congelada no toque. Enquanto existir, a tela mostra ela no lugar do video. */
  const [photo, setPhoto] = useState<string | null>(null);
  /** Muda a cada captura para reiniciar a animacao do flash. */
  const [flashKey, setFlashKey] = useState(0);

  /**
   * Ultimo rosto lido. Fica em ref, e nao em estado: serve so para redesenhar o
   * canvas — inclusive no "resize", que precisa do valor atual sem depender de
   * um novo render.
   */
  const lastDetectionRef = useRef<faceapi.FaceDetection | null>(null);

  /** Desenha a guia e o retangulo direto no canvas, sem passar pelo React. */
  const syncOverlay = useCallback((detection: faceapi.FaceDetection | null) => {
    const video = videoRef.current;
    const overlay = overlayCanvasRef.current;
    if (!video || !overlay) return;

    const width = video.clientWidth;
    const height = video.clientHeight;
    if (!width || !height) return;

    overlay.width = width;
    overlay.height = height;
    drawGuide(overlay, detection, video.videoWidth, video.videoHeight);
  }, []);

  const handleDetection = useCallback(
    (detection: faceapi.FaceDetection | null) => {
      lastDetectionRef.current = detection;
      syncOverlay(detection);
    },
    [syncOverlay]
  );

  const {
    isLoaded,
    isCameraReady,
    error: hookError,
    startCamera,
    stopCamera,
    captureDescriptor,
  } = useFaceApiDetection(videoRef, {
    modelPath: MODEL_PATH,
    detectorOptions,
    onDetection: handleDetection,
    // Enquanto a batida esta sendo enviada ou a confirmacao esta na tela, o
    // retangulo nao serve para nada — nao ha por que rodar o modelo.
    enabled: !isAnalyzing && status !== "loading" && status !== "success",
  });

  useEffect(() => {
    const handleResize = () => syncOverlay(lastDetectionRef.current);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      stopCamera();
      reset();
    };
    // Montagem e desmontagem apenas: stopCamera e reset aqui desligariam a
    // camera a cada render em que mudassem de identidade.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isLoaded && !isCameraReady && !fatalError && !hookError) {
      setFeedbackMessage("Solicitando acesso à câmera...");
      startCamera()
        .then(() => setFeedbackMessage(""))
        .catch((err) => {
          setFatalError(err.message || "Falha ao iniciar câmera.");
          setShowPasswordFallback(true);
        });
    }
  }, [isLoaded, isCameraReady, fatalError, hookError, startCamera]);

  useEffect(() => {
    if (hookError) {
      setFatalError(hookError);
      setShowPasswordFallback(true);
    }
  }, [hookError]);

  useEffect(() => {
    if (status === "success") {
      setFeedbackMessage(confirmation?.detail ?? "");

      const timer = window.setTimeout(() => {
        navigate("/");
      }, CONFIRMATION_MS);

      return () => window.clearTimeout(timer);
    }

    if (status === "inactive") {
      // Sem fallback de senha: o `set` por senha aplica a mesma guarda, entao
      // oferecer a alternativa so mandaria a pessoa numa tentativa que ja se
      // sabe que falha. O caminho aqui e procurar o supervisor.
      setFeedbackMessage(errorMessage);
      setShowPasswordFallback(false);
      return undefined;
    }

    if (status === "error" || status === "maxPunch") {
      setFeedbackMessage(errorMessage);
      setShowPasswordFallback(true);
    }

    return undefined;
  }, [confirmation, errorMessage, navigate, status]);

  /**
   * Congela o quadro atual da camera.
   *
   * Devolve duas coisas diferentes de proposito:
   *
   * - `canvas`: tamanho natural, usado para LER o rosto. Reduzir a entrada do
   *   reconhecimento pioraria a precisao do match.
   * - `dataUrl`: reduzido, usado para EXIBIR e para arquivar como evidencia.
   *   Para reconhecer uma pessoa numa auditoria, 640px bastam — e o payload cai
   *   de ~270KB para ~50KB em base64.
   */
  const freezeFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = captureCanvasRef.current;
    const thumbnail = photoCanvasRef.current;
    if (!video || !canvas || !thumbnail || !video.videoWidth || !video.videoHeight) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    if (!context) return null;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const scale = Math.min(1, PHOTO_MAX_WIDTH / canvas.width);
    thumbnail.width = Math.round(canvas.width * scale);
    thumbnail.height = Math.round(canvas.height * scale);

    const thumbnailContext = thumbnail.getContext("2d");
    if (!thumbnailContext) return null;

    // Quadro inteiro, sem recortar o rosto: o valor da evidencia esta no
    // contexto — um celular na mao, outra pessoa junto, um rosto numa tela.
    thumbnailContext.drawImage(video, 0, 0, thumbnail.width, thumbnail.height);

    return { canvas, dataUrl: thumbnail.toDataURL("image/jpeg", PHOTO_QUALITY) };
  }, []);

  const handleCameraTap = async () => {
    if (!isCameraReady || !isLoaded || isAnalyzing || status === "loading" || fatalError || status === "success") return;

    const frame = freezeFrame();
    if (!frame) {
      setFeedbackMessage("A câmera ainda não está pronta.");
      return;
    }

    try {
      setIsAnalyzing(true);
      setFeedbackMessage("");
      reset();

      // A foto entra na tela antes da leitura: o toque tem resposta imediata,
      // sem esperar o modelo nem a rede.
      setPhoto(frame.dataUrl);
      setFlashKey((previous) => previous + 1);

      const result = await captureDescriptor(frame.canvas);

      if (!result) {
        setPhoto(null);
        setFeedbackMessage("Nenhum rosto foi identificado. Tente novamente olhando para a câmera.");
        return;
      }

      await registerPointWithDescriptor(Array.from(result.descriptor), frame.dataUrl);
    } catch (error) {
      setPhoto(null);
      const message =
        error instanceof Error && error.message ? error.message : "Não foi possível processar o rosto capturado.";
      setFeedbackMessage(message);
      setShowPasswordFallback(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // A foto congelada some quando a tentativa falha: sem isto o funcionario
  // ficaria olhando a propria imagem parada sem entender que pode tentar de novo.
  useEffect(() => {
    if (status === "error" || status === "maxPunch" || status === "inactive") {
      setPhoto(null);
    }
  }, [status]);

  const isCapturing = isAnalyzing || status === "loading";
  const isBusy = !isLoaded || !isCameraReady || isCapturing;
  const overlayTitle =
    status === "success"
      ? (confirmation?.title ?? "Ponto confirmado")
      : isCapturing
      ? "Registrando ponto"
      : isBusy
      ? "Processando"
      : "";
  const overlayText =
    status === "success"
      ? feedbackMessage
      : !isLoaded
      ? "Carregando modelos..."
      : !isCameraReady
      ? feedbackMessage || "Preparando câmera..."
      : isCapturing
      ? "Confirmando com o servidor..."
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
          disabled={status === "loading" || isAnalyzing}
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
          // Contexto de empilhamento proprio: os z-index de dentro (foto, flash,
          // cartao) nao podem disputar com os botoes irmaos "Voltar" e
          // "Registrar com senha", que ficam por cima da camera inteira.
          isolation: "isolate",
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
          cursor: isCameraReady && !isBusy && status !== "success" ? "pointer" : "default",
        }}
      >
        {/* O video segue montado e tocando por tras da foto: parar e religar a
            camera a cada tentativa deixaria um atraso visivel no retorno. */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          onLoadedMetadata={() => syncOverlay(lastDetectionRef.current)}
          style={{
            display: "block",
            height: "100%",
            maxHeight: "100%",
            objectFit: "cover",
            visibility: photo ? "hidden" : "visible",
            filter: isBusy || status === "success" ? "brightness(0.7)" : "none",
          }}
        />

        {photo ? (
          <Box
            component="img"
            src={photo}
            alt=""
            sx={{
              position: "absolute",
              top: 0,
              left: "50%",
              transform: "translateX(-50%)",
              height: "100%",
              maxHeight: "100%",
              objectFit: "cover",
              filter: "brightness(0.7)",
              zIndex: 1,
            }}
          />
        ) : null}

        {/* Clarao do disparo. A chave reinicia a animacao a cada captura. */}
        {photo ? (
          <Box
            key={flashKey}
            sx={{
              position: "absolute",
              inset: 0,
              bgcolor: "#fff",
              zIndex: 3,
              pointerEvents: "none",
              animation: "capture-flash 320ms ease-out forwards",
              "@keyframes capture-flash": {
                from: { opacity: 0.85 },
                to: { opacity: 0 },
              },
            }}
          />
        ) : null}

        <canvas
          ref={overlayCanvasRef}
          style={{
            // A guia acompanha o rosto ao vivo; sobre a foto congelada ela
            // apontaria para uma posicao que nao existe mais.
            position: "absolute",
            display: isCameraReady && !photo ? "block" : "none",
            height: "100%",
            pointerEvents: "none",
          }}
        />

        <canvas ref={captureCanvasRef} style={{ display: "none" }} />
        <canvas ref={photoCanvasRef} style={{ display: "none" }} />

        <Box
          sx={{
            position: "absolute",
            insetInline: 0,
            bottom: 0,
            p: { xs: 3, md: 4 },
            background: "linear-gradient(180deg, rgba(8,18,13,0) 0%, rgba(8,18,13,0.76) 55%, rgba(8,18,13,0.92) 100%)",
            pointerEvents: "none",
            zIndex: 2,
          }}
        >
          <Stack spacing={1} alignItems="center" textAlign="center">
            <Typography variant="h4" sx={{ color: "#fff", fontWeight: 700 }}>
              Registrar ponto com Face ID
            </Typography>
            {/* Com a foto congelada nao ha o que pressionar: a instrucao so
                confundiria quem esta esperando a confirmacao. */}
            {!photo ? (
              <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.9)", maxWidth: 720 }}>
                Pressione em qualquer lugar da câmera para registrar o ponto.
              </Typography>
            ) : null}

            {/* O aviso E o mecanismo: a foto arquivada so inibe o uso de imagem
                de terceiro se quem bate souber que ela fica guardada. Alem
                disso, ser transparente sobre a coleta e exigencia da LGPD. */}
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.62)", maxWidth: 720 }}>
              Sua foto é registrada junto com a marcação e fica disponível para conferência.
            </Typography>
          </Stack>
        </Box>

        {(feedbackMessage || fatalError) && status !== "success" && !isAnalyzing && status !== "loading" ? (
          <Alert
            severity={fatalError ? "error" : "warning"}
            sx={{
              position: "absolute",
              left: "50%",
              top: 12,
              transform: "translateX(-50%)",
              width: "min(640px, calc(100% - 32px))",
              zIndex: 5,
            }}
          >
            {fatalError || feedbackMessage}
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
              zIndex: 4,
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
