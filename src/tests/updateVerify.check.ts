import assert from "node:assert/strict";
import {
  expectedSha256,
  findChecksumAssetUrl,
  parseSha256Sums,
  parseUpdateOrder,
  releaseTagCandidates,
  safeFileName,
} from "../../electron/updateVerify";

/**
 * Conferencia do instalador, no lado do dispositivo.
 *
 * Este e o ponto do sistema com a maior distancia entre "um bug pequeno" e "a
 * consequencia": entre a ordem chegar pela rede e um executavel rodar nesta
 * maquina so existe este arquivo. A rede local e HTTP puro, entao quem
 * conseguir se passar pelo servidor manda bytes arbitrarios para todos os
 * terminais — inclusive, num relogio de ponto, para a maquina de quem tem
 * interesse em fraudar batida.
 *
 * Por isso toda funcao aqui devolve `null` em vez de um palpite: `null`
 * significa "nao instale", e nunca "instale assim mesmo".
 */
function run() {
  // ---- Tag do release ----
  // "v1.2.0" e "1.2.0" ambos aparecem: o electron-builder publica com "v" e uma
  // tag feita a mao costuma vir sem. Procurar so uma delas faria a busca pelo
  // hash falhar em metade dos casos.
  assert.deepEqual(releaseTagCandidates("1.2.0"), ["v1.2.0", "1.2.0"]);
  assert.deepEqual(releaseTagCandidates("v1.2.0"), ["v1.2.0", "1.2.0"]);

  // ---- SHA256SUMS ----
  const text =
    "a".repeat(64) + "  Dot Com Setup 1.2.0.exe\n" +
    "b".repeat(64) + " *outro.exe\n" +
    "nao e linha valida\n";

  const sums = parseSha256Sums(text);
  // O nome pode conter espacos, entao ele e todo o resto da linha — nunca "o
  // segundo campo". Errar isso faz a busca nunca encontrar o arquivo e a
  // atualizacao falhar sem motivo aparente.
  assert.equal(sums.get("Dot Com Setup 1.2.0.exe"), "a".repeat(64));
  assert.equal(sums.size, 2);

  assert.equal(expectedSha256(text, "Dot Com Setup 1.2.0.exe"), "a".repeat(64));
  // Arquivo nao citado no release: nao da para saber, entao nao se instala.
  assert.equal(expectedSha256(text, "arquivo-que-nao-esta-la.exe"), null);
  assert.equal(expectedSha256(undefined, "qualquer.exe"), null);

  // ---- Anexo das somas ----
  assert.equal(
    findChecksumAssetUrl({
      assets: [
        { name: "Setup.exe", browser_download_url: "https://x/setup" },
        { name: "SHA256SUMS.txt", browser_download_url: "https://x/sums" },
      ],
    }),
    "https://x/sums"
  );
  // Release sem soma publicada nao rende instalacao nenhuma.
  assert.equal(findChecksumAssetUrl({ assets: [{ name: "Setup.exe" }] }), null);
  assert.equal(findChecksumAssetUrl(null), null);

  // ---- Nome de arquivo ----
  // O nome vira caminho em disco e vem de fora desta maquina.
  assert.equal(safeFileName("..\\..\\algo.exe"), "algo.exe");
  assert.equal(safeFileName("../../algo.exe"), "algo.exe");
  assert.equal(safeFileName("Dot Com Setup 1.2.0.exe"), "Dot Com Setup 1.2.0.exe");
  // Sem extensao conhecida, o arquivo ainda e gravado como .exe: e o que ele e,
  // e mascarar isso so esconderia o que esta prestes a ser executado.
  assert.equal(safeFileName("instalador"), "instalador.exe");
  assert.equal(safeFileName(".."), "");

  // ---- A ordem inteira ----
  const valid = {
    campaignId: "2026-09-14T12:00:00.000Z",
    app: "terminal",
    version: "1.2.0",
    fileName: "Dot Com Setup 1.2.0.exe",
    size: 90000000,
    sha256: "A".repeat(64),
    url: "/updates/file/terminal",
    repo: "Dono/dot-com",
  };

  const order = parseUpdateOrder(valid);
  assert.equal(order?.version, "1.2.0");
  assert.equal(order?.repo, "Dono/dot-com");
  assert.equal(order?.sha256, "a".repeat(64));

  // SEM repositorio publico nao ha onde conferir o hash oficial, e sem isso a
  // rede local seria a unica autoridade sobre o que vale executar como
  // administrador em cada maquina da empresa. Recusar aqui tambem evita baixar
  // 100MB para chegar na mesma recusa no fim.
  assert.equal(parseUpdateOrder({ ...valid, repo: "" }), null);
  assert.equal(parseUpdateOrder({ ...valid, repo: "nao-e-repo" }), null);

  assert.equal(parseUpdateOrder({ ...valid, version: "qualquer" }), null);
  assert.equal(parseUpdateOrder({ ...valid, campaignId: "" }), null);
  assert.equal(parseUpdateOrder({ ...valid, url: "" }), null);
  assert.equal(parseUpdateOrder(null), null);

  // Nome hostil e saneado, e nao recusado: o release e nosso, e o caso real
  // aqui e um nome estranho, nao um ataque pelo proprio GitHub. O que nao pode
  // e o caminho escapar da pasta temporaria.
  assert.equal(parseUpdateOrder({ ...valid, fileName: "..\\..\\dev.db" })?.fileName, "dev.db.exe");

  console.log("updateVerify.check: ok");
}

run();
