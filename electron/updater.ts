import { app } from "electron";
import { spawn } from "child_process";
import { createHash } from "crypto";
import fs from "fs";
import os from "os";
import path from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";

import {
  expectedSha256,
  findChecksumAssetUrl,
  parseUpdateOrder,
  releaseTagCandidates,
  type UpdateOrder
} from "./updateVerify.js";

/**
 * Execucao da ordem de atualizacao.
 *
 * O caminho inteiro: o servidor manda a ordem na resposta do heartbeat, este
 * modulo busca no GitHub o hash que o arquivo precisa ter, baixa os bytes do
 * servidor (LAN, rapido), confere, e so entao executa o instalador.
 *
 * A ordem dos dois primeiros passos nao e acidental. O hash vem ANTES do
 * download: se o release nao publicou soma de verificacao, nao ha o que
 * conferir, e descobrir isso depois de baixar 100MB seria gastar a rede da
 * empresa para chegar na mesma recusa.
 *
 * Nada aqui lanca para quem chamou. Falhar em atualizar e um contratempo;
 * derrubar o aplicativo por causa disso transformaria um contratempo em
 * terminal parado.
 */

export type UpdateState = "downloading" | "verifying" | "installing" | "failed";

export type UpdateProgress = {
  campaignId: string;
  state: UpdateState;
  message: string | null;
};

const GITHUB_API = "https://api.github.com";
const METADATA_TIMEOUT_MS = 20 * 1000;
const DOWNLOAD_TIMEOUT_MS = 30 * 60 * 1000;

/**
 * Uma execucao por vez, para sempre.
 *
 * Nao e reentrante de proposito: o heartbeat continua batendo durante o
 * download, e a mesma ordem voltaria a cada resposta. Sem esta trava, dez
 * respostas virariam dez downloads simultaneos do mesmo arquivo pela mesma rede.
 */
let running = false;

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: { "User-Agent": `DotCom/${app.getVersion()}`, Accept: "application/vnd.github+json" },
    signal: AbortSignal.timeout(METADATA_TIMEOUT_MS)
  });

  if (!response.ok) throw new Error(`GitHub respondeu ${response.status}`);
  return await response.json();
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { "User-Agent": `DotCom/${app.getVersion()}` },
    signal: AbortSignal.timeout(METADATA_TIMEOUT_MS)
  });

  if (!response.ok) throw new Error(`GitHub respondeu ${response.status}`);
  return await response.text();
}

/**
 * Hash exigido, buscado no release publico por HTTPS.
 *
 * Esta funcao e a razao de o desenho inteiro se sustentar. O servidor tambem
 * manda um hash na ordem, mas conferir por ele seria perguntar ao proprio
 * servidor se o que o servidor mandou esta certo — nao prova nada contra quem
 * se passa por ele na rede local.
 */
async function fetchExpectedSha(order: UpdateOrder): Promise<string> {
  const errors: string[] = [];

  for (const tag of releaseTagCandidates(order.version)) {
    try {
      const release = await fetchJson(`${GITHUB_API}/repos/${order.repo}/releases/tags/${tag}`);
      const sumsUrl = findChecksumAssetUrl(release);
      if (!sumsUrl) {
        errors.push(`release ${tag} sem SHA256SUMS.txt`);
        continue;
      }

      const sha = expectedSha256(await fetchText(sumsUrl), order.fileName);
      if (!sha) {
        errors.push(`SHA256SUMS.txt do release ${tag} nao cita ${order.fileName}`);
        continue;
      }

      return sha;
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  throw new Error(`nao foi possivel obter o hash oficial (${errors.join("; ")})`);
}

/** Baixa do servidor e devolve o caminho local, ja com o hash calculado. */
async function download(fileUrl: string, target: string): Promise<string> {
  const response = await fetch(fileUrl, { signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS) });
  if (!response.ok || !response.body) {
    throw new Error(`servidor respondeu ${response.status} ao enviar o instalador`);
  }

  const hash = createHash("sha256");
  const source = Readable.fromWeb(response.body as any);
  source.on("data", (chunk: Buffer) => hash.update(chunk));

  await pipeline(source, fs.createWriteStream(target));
  return hash.digest("hex");
}

/**
 * Chama o instalador e sai.
 *
 * `detached` + `unref` porque o instalador precisa SOBREVIVER a este processo:
 * ele vai substituir o executavel que esta rodando agora. Sem isso, encerrar o
 * app mataria o instalador no meio e a maquina ficaria com a instalacao pela
 * metade.
 *
 * `/S` e o modo silencioso do NSIS. Ele reabre o aplicativo ao terminar, que e
 * o que faz o terminal voltar a bater ponto sozinho, sem ninguem ir ate a
 * maquina.
 */
function runInstaller(installerPath: string) {
  const child = spawn(installerPath, ["/S"], {
    detached: true,
    stdio: "ignore",
    windowsHide: true
  });

  child.unref();
}

/**
 * Executa a ordem. `report` leva o estado de volta ao renderer, que o inclui no
 * proximo heartbeat — e assim ele aparece na tela do administrador.
 */
export async function applyUpdate(
  rawOrder: unknown,
  fileUrl: string,
  report: (progress: UpdateProgress) => void
): Promise<void> {
  if (running) return;

  const order = parseUpdateOrder(rawOrder);
  if (!order) return;

  running = true;

  const dir = path.join(os.tmpdir(), "dot-com-update");
  const target = path.join(dir, order.fileName);

  try {
    // O hash vem primeiro: sem ele o download nao tem para que servir.
    report({ campaignId: order.campaignId, state: "downloading", message: null });
    const expected = await fetchExpectedSha(order);

    fs.mkdirSync(dir, { recursive: true });
    fs.rmSync(target, { force: true });

    const digest = await download(fileUrl, target);

    report({ campaignId: order.campaignId, state: "verifying", message: null });

    if (digest !== expected) {
      /**
       * Bytes reprovados sao apagados na hora. Um instalador divergente parado
       * no disco e um instalador que alguem, algum dia, clica duas vezes.
       */
      fs.rmSync(target, { force: true });
      throw new Error("o instalador recebido nao confere com o publicado no release");
    }

    report({ campaignId: order.campaignId, state: "installing", message: null });

    /**
     * O relato de "instalando" sai ANTES de chamar o instalador, porque depois
     * nao ha depois: o processo e substituido. Pela mesma razao nao existe
     * estado "concluido" — a prova de sucesso e este dispositivo reaparecer no
     * heartbeat com a versao nova.
     */
    runInstaller(target);
    setTimeout(() => app.quit(), 2000);
  } catch (error) {
    running = false;
    const message = error instanceof Error ? error.message : String(error);
    report({ campaignId: order.campaignId, state: "failed", message });
  }
}
