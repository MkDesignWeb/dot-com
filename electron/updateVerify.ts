/**
 * Conferencia do instalador — a parte sem rede, sem disco e sem Electron.
 *
 * Por que ela existe separada do resto: e a unica coisa entre "o servidor
 * mandou atualizar" e "um executavel roda nesta maquina". A rede local e HTTP
 * puro, entao quem conseguir se passar pelo servidor consegue mandar bytes
 * arbitrarios para todos os terminais da empresa — incluindo, num relogio de
 * ponto, a maquina de quem quer fraudar batida.
 *
 * A ancora de confianca NAO e o servidor: e o release publico no GitHub, por
 * HTTPS. O servidor da os bytes (rapido, pela LAN) e o GitHub diz qual hash
 * esses bytes precisam ter. Sem essa segunda metade, a primeira nao deveria
 * acontecer — por isso toda funcao aqui devolve `null` em vez de um palpite, e
 * quem chama trata `null` como "nao instale".
 */

/** Candidatos de tag para a mesma versao: "v1.2.0" e "1.2.0" ambos aparecem. */
export function releaseTagCandidates(version: string): string[] {
  const clean = version.trim().replace(/^v/i, "");
  return [`v${clean}`, clean];
}

/**
 * Le o `SHA256SUMS.txt`.
 *
 * O nome do arquivo pode conter espacos — o electron-builder gera
 * "Dot Com ADM Setup 1.2.0.exe" — entao o nome e todo o resto da linha, e nunca
 * "o segundo campo".
 */
export function parseSha256Sums(text: unknown): Map<string, string> {
  const result = new Map<string, string>();
  if (typeof text !== "string") return result;

  for (const line of text.split(/\r?\n/)) {
    const match = /^([0-9a-fA-F]{64})\s+\*?(.+?)\s*$/.exec(line);
    if (!match) continue;

    result.set(match[2], match[1].toLowerCase());
  }

  return result;
}

/** URL do anexo com as somas de verificacao, dentro do release. */
export function findChecksumAssetUrl(release: unknown): string | null {
  const assets = (release as { assets?: unknown })?.assets;
  if (!Array.isArray(assets)) return null;

  for (const asset of assets) {
    const item = (asset ?? {}) as Record<string, unknown>;
    if (item.name === "SHA256SUMS.txt" && typeof item.browser_download_url === "string") {
      return item.browser_download_url;
    }
  }

  return null;
}

/**
 * Hash que estes bytes precisam ter, segundo o release publico.
 *
 * `null` significa "nao da para saber" — e "nao da para saber" e motivo para
 * NAO instalar, nunca para instalar assim mesmo. Um release sem soma de
 * verificacao publicada nao e uma inconveniencia a contornar: e a ausencia da
 * unica evidencia de que o arquivo e o que diz ser.
 */
export function expectedSha256(sumsText: unknown, fileName: string): string | null {
  return parseSha256Sums(sumsText).get(fileName) ?? null;
}

export type UpdateOrder = {
  campaignId: string;
  app: string;
  version: string;
  fileName: string;
  size: number;
  sha256: string;
  url: string;
  repo: string | null;
};

/**
 * Valida a ordem vinda do servidor antes de agir sobre ela.
 *
 * Tudo que chega por HTTP na rede local e entrada hostil ate prova em
 * contrario. Em especial `fileName`, que vira caminho em disco: sem o corte
 * aqui, uma ordem com "..\\..\\algo.exe" escreveria fora da pasta temporaria.
 */
export function parseUpdateOrder(raw: unknown): UpdateOrder | null {
  const order = (raw ?? {}) as Record<string, unknown>;

  const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

  const campaignId = text(order.campaignId);
  const app = text(order.app);
  const version = text(order.version);
  const url = text(order.url);
  const repo = text(order.repo);

  if (!campaignId || !version || !url) return null;
  if (!/^\d+(\.\d+){0,3}(-[0-9A-Za-z.-]+)?$/.test(version)) return null;

  // Sem repositorio publico nao ha onde conferir o hash, e sem conferir o hash
  // nao se executa nada. Recusar aqui e mais honesto do que baixar 100MB para
  // descobrir isso no fim.
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) return null;

  const fileName = safeFileName(text(order.fileName));
  if (!fileName) return null;

  return {
    campaignId,
    app,
    version,
    fileName,
    size: typeof order.size === "number" && order.size > 0 ? order.size : 0,
    sha256: text(order.sha256).toLowerCase(),
    url,
    repo
  };
}

/** Nome de arquivo sem diretorio e sem surpresa. */
export function safeFileName(name: string): string {
  const base = name.replace(/\\/g, "/").split("/").pop() ?? "";
  const cleaned = base.replace(/[^A-Za-z0-9 ._-]/g, "_").trim();
  if (!cleaned || cleaned === "." || cleaned === "..") return "";
  return cleaned.toLowerCase().endsWith(".exe") ? cleaned : `${cleaned}.exe`;
}
