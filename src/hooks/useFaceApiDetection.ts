import * as faceapi from "@vladmandic/face-api";
import { useEffect, useRef, useState, useCallback, type RefObject } from "react";
import {
  DEFAULT_DETECTION_INTERVAL_MS,
  createDetectionThrottle,
} from "../utils/detectionThrottle";

interface UseFaceApiDetectionOptions {
  modelPath: string;
  detectorOptions: faceapi.TinyFaceDetectorOptions;
  /** Milissegundos entre leituras do modelo. Ver `detectionThrottle`. */
  detectionIntervalMs?: number;
  /** `false` pausa a deteccao sem desligar a camera (imagem continua na tela). */
  enabled?: boolean;
  /**
   * Chamada a cada leitura, com o rosto encontrado (ou `null`).
   *
   * E um callback, e nao estado do React, de proposito: a deteccao so serve
   * para desenhar o retangulo no canvas. Guardar isso em `useState` fazia a
   * pagina inteira re-renderizar a cada leitura.
   */
  onDetection?: (detection: faceapi.FaceDetection | null) => void;
}

export const useFaceApiDetection = (
  videoRef: RefObject<HTMLVideoElement | null>,
  options: UseFaceApiDetectionOptions
) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const detectionFrameRef = useRef<number | null>(null);

  const {
    modelPath,
    detectorOptions,
    detectionIntervalMs = DEFAULT_DETECTION_INTERVAL_MS,
    enabled = true,
    onDetection,
  } = options;

  // O callback muda de identidade a cada render da pagina; guardar a versao
  // atual num ref evita reiniciar o laco de deteccao por causa disso.
  const onDetectionRef = useRef(onDetection);
  useEffect(() => {
    onDetectionRef.current = onDetection;
  }, [onDetection]);

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
    onDetectionRef.current?.(null);
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

  /**
   * Roda cada rede uma vez, contra uma imagem cinza descartavel.
   *
   * A primeira inferencia de uma rede no WebGL paga a compilacao dos shaders e
   * a subida dos pesos para a GPU — dezenas de vezes mais lenta que as
   * seguintes. O laco de previa so exercita o DETECTOR; os pontos do rosto e a
   * rede de reconhecimento so rodavam quando alguem tocava na tela, entao esse
   * custo caia inteiro sobre a PRIMEIRA batida do dia.
   *
   * Aqui ele e pago enquanto a pessoa ainda esta se posicionando. As redes sao
   * chamadas diretamente porque o caminho normal (`detectSingleFace` encadeado)
   * abandona a cadeia quando nao encontra rosto — e numa imagem cinza nunca
   * encontra, entao nada seria aquecido.
   */
  const warmUpNets = useCallback(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 160;
    canvas.height = 160;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.fillStyle = "#808080";
    context.fillRect(0, 0, canvas.width, canvas.height);

    try {
      await faceapi.nets.tinyFaceDetector.locateFaces(canvas, detectorOptions);
      await faceapi.nets.faceLandmark68TinyNet.detectLandmarks(canvas);
      await faceapi.nets.faceRecognitionNet.computeFaceDescriptor(canvas);
    } catch {
      // Aquecimento e otimizacao, nao requisito: falhar aqui so significa que
      // a primeira batida sera a lenta, como era antes.
    }
  }, [detectorOptions]);

  // Carrega os modelos
  useEffect(() => {
    let isMounted = true;

    const loadModels = async () => {
      try {
        // Modelos essenciais para o fluxo atual
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(modelPath),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri(modelPath),
          faceapi.nets.faceRecognitionNet.loadFromUri(modelPath),
        ]);
        if (!isMounted) return;

        setIsLoaded(true);
        void warmUpNets();
      } catch {
        if (isMounted) {
          setError("Erro ao carregar modelos do Face API.");
        }
      }
    };

    void loadModels();

    return () => {
      isMounted = false;
    };
  }, [modelPath, warmUpNets]);

  /**
   * Laco de deteccao.
   *
   * O `requestAnimationFrame` continua sendo o relogio — ele pausa sozinho
   * quando a janela nao esta visivel — mas so os quadros liberados pelo
   * acelerador rodam o modelo. E o `await` garante que uma leitura so comece
   * depois que a anterior terminou, sem enfileirar inferencias.
   */
  useEffect(() => {
    if (!isLoaded || !isCameraReady || !enabled) {
      return;
    }

    let cancelled = false;
    const throttle = createDetectionThrottle(detectionIntervalMs);

    const detectFace = async () => {
      if (cancelled || !videoRef.current) {
        return;
      }

      const scheduleNext = () => {
        if (!cancelled) {
          detectionFrameRef.current = requestAnimationFrame(detectFace);
        }
      };

      const video = videoRef.current;
      if (video.readyState < 2 || video.paused || video.ended) {
        scheduleNext();
        return;
      }

      if (!throttle.shouldRun(performance.now())) {
        scheduleNext();
        return;
      }

      try {
        const result = await faceapi.detectSingleFace(video, detectorOptions);
        if (!cancelled) {
          onDetectionRef.current?.(result ?? null);
        }
      } catch {
        // Erro de uma leitura isolada e ignorado: o proximo quadro tenta de novo.
      }

      scheduleNext();
    };

    detectionFrameRef.current = requestAnimationFrame(detectFace);

    return () => {
      cancelled = true;
      if (detectionFrameRef.current !== null) {
        cancelAnimationFrame(detectionFrameRef.current);
        detectionFrameRef.current = null;
      }
      // Sem isto, o retangulo do ultimo rosto ficaria congelado na tela.
      onDetectionRef.current?.(null);
    };
  }, [isLoaded, isCameraReady, enabled, detectionIntervalMs, detectorOptions, videoRef]);

  /**
   * Le o descritor facial de um quadro.
   *
   * Aceita a fonte por parametro para que a tela possa passar o quadro que ela
   * ja congelou: lendo do video ao vivo, a pessoa pode ter se mexido entre a
   * foto exibida e a leitura enviada ao servidor — e a foto na tela deixaria de
   * ser a que gerou o reconhecimento.
   */
  const captureDescriptor = useCallback(
    async (source?: HTMLVideoElement | HTMLCanvasElement) => {
      const input = source ?? videoRef.current;
      if (!input || !isLoaded) {
        return null;
      }

      try {
        const result = await faceapi
          .detectSingleFace(input, detectorOptions)
          .withFaceLandmarks(true)
          .withFaceDescriptor();

        return result || null;
      } catch (err) {
        console.error("Falha ao capturar descritor facial:", err);
        return null;
      }
    },
    [isLoaded, detectorOptions, videoRef]
  );

  return {
    isLoaded,
    isCameraReady,
    error,
    startCamera,
    stopCamera,
    captureDescriptor,
  };
};
