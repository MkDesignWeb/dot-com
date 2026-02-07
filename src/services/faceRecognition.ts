import * as faceapi from "face-api.js";

const MODEL_BASE =
    "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js-models@master";

let modelsLoaded = false;

export async function loadFaceModels(): Promise<boolean> {
    if (modelsLoaded) return true;
    try {
        await Promise.all([
            faceapi.nets.ssdMobilenetv1.loadFromUri(`${MODEL_BASE}/ssd_mobilenetv1`),
            faceapi.nets.faceLandmark68Net.loadFromUri(`${MODEL_BASE}/face_landmark_68`),
            faceapi.nets.faceRecognitionNet.loadFromUri(`${MODEL_BASE}/face_recognition`),
        ]);
        modelsLoaded = true;
        return true;
    } catch (err) {
        console.error("Erro ao carregar modelos de reconhecimento:", err);
        return false;
    }
}

export async function getFaceDescriptorFromVideo(
    video: HTMLVideoElement
): Promise<Float32Array | null> {
    if (!modelsLoaded) {
        const ok = await loadFaceModels();
        if (!ok) return null;
    }
    try {
        const detection = await faceapi
            .detectSingleFace(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
            .withFaceLandmarks()
            .withFaceDescriptor();
        return detection ? detection.descriptor : null;
    } catch (err) {
        console.error("Erro ao obter descriptor da face:", err);
        return null;
    }
}

/** Distância máxima para considerar "mesma pessoa" (0.6 é um valor comum) */
const MATCH_THRESHOLD = 0.6;

export interface PessoaCadastrada {
    id: string;
    nome: string;
    descriptor: Float32Array;
}

/**
 * Compara o descriptor da foto com o banco de pessoas.
 * Retorna a pessoa encontrada ou null se não houver match.
 */
export function compararComBanco(
    descriptor: Float32Array,
    banco: PessoaCadastrada[]
): PessoaCadastrada | null {
    if (banco.length === 0) return null;
    let menorDistancia = Infinity;
    let pessoaEncontrada: PessoaCadastrada | null = null;
    for (const pessoa of banco) {
        const dist = faceapi.euclideanDistance(descriptor, pessoa.descriptor);
        if (dist < menorDistancia && dist <= MATCH_THRESHOLD) {
            menorDistancia = dist;
            pessoaEncontrada = pessoa;
        }
    }
    return pessoaEncontrada;
}
