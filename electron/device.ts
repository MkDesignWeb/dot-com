import { app } from "electron";
import { randomUUID } from "crypto";
import os from "os";
import store from "./store.js";

/**
 * Identidade desta instalacao perante o servidor — este app e o terminal de batida.
 *
 * Mora no processo principal, e nao no renderer, porque e a unica parte que
 * precisa SOBREVIVER: o `deviceId` e gravado em disco na primeira execucao e
 * nunca mais muda. Se fosse gerado na tela, cada reload criaria um dispositivo
 * novo e a lista do painel encheria de fantasmas da mesma maquina.
 *
 * O envio do heartbeat, esse sim, fica no renderer: e la que o endereco do
 * servidor ja foi descoberto e o cliente HTTP ja existe.
 */

const DEVICE_ID_KEY = "deviceId";

export type DeviceIdentity = {
  deviceId: string;
  app: "terminal";
  version: string;
  hostname: string | null;
};

/**
 * `randomUUID` e nao algo derivado da maquina (MAC, nome, serial) de proposito:
 * identificador derivado de hardware muda sozinho quando trocam a placa de rede
 * e vaza informacao da maquina para uma rota publica. Aqui o id nao significa
 * nada alem de "sou o mesmo de ontem".
 */
function ensureDeviceId(): string {
  const saved = store.get(DEVICE_ID_KEY);
  if (typeof saved === "string" && saved.length >= 8) {
    return saved;
  }

  const deviceId = randomUUID();
  store.set(DEVICE_ID_KEY, deviceId);
  return deviceId;
}

export function getDeviceIdentity(): DeviceIdentity {
  let hostname: string | null = null;
  try {
    hostname = os.hostname() || null;
  } catch {
    // Nome da maquina e conveniencia para o humano reconhecer a linha na tela.
    // Nao ter nao impede nada.
    hostname = null;
  }

  return {
    deviceId: ensureDeviceId(),
    app: "terminal",
    // A versao vem do `package.json` empacotado, e nao de uma constante
    // duplicada: e ela que decide se este dispositivo precisa atualizar.
    version: app.getVersion(),
    hostname
  };
}
