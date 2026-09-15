/**
 * Chama o electron-builder com um TEMP sem espacos.
 *
 * Por que isto existe: o electron-builder 26.x, no Windows, cria um `.bat`
 * temporario para consultar a arvore de dependencias do npm e o executa **sem
 * aspas no caminho**. Se a pasta temporaria do usuario tiver espaco — e ela tem
 * sempre que o nome da conta do Windows tiver, como "Cliente Especial" —, o
 * comando quebra na metade, o arquivo de saida sai vazio e o build morre com:
 *
 *     ⨯ No JSON content found in output
 *
 * A mensagem nao menciona espaco, caminho nem TEMP. Perder uma tarde nisso uma
 * vez ja e demais; perder de novo a cada maquina nova e evitavel.
 *
 * A correcao e apontar TEMP/TMP para uma pasta sem espaco durante o build. Nao
 * mexe em nada global: o ambiente alterado vale so para o processo filho.
 *
 * Um `set TEMP=...` direto no script do npm resolveria no cmd.exe e quebraria
 * em qualquer outro shell. Como este script e Node, funciona igual no cmd, no
 * PowerShell e no Git Bash.
 */
const { spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const SUBPASTA = "dot-com-build-temp";

/** Pasta utilizavel: sem espaco no caminho e onde da para escrever. */
function tempSemEspaco() {
  const atual = process.env.TEMP || process.env.TMP || os.tmpdir();

  // Se a do sistema ja serve, nao inventamos pasta nenhuma.
  if (!atual.includes(" ")) return atual;

  const systemDrive = process.env.SystemDrive || "C:";
  const candidatos = [
    path.join(systemDrive + "\\", "Users", "Public", SUBPASTA),
    path.join(systemDrive + "\\", "Temp", SUBPASTA),
    path.join(systemDrive + "\\", SUBPASTA)
  ];

  for (const candidato of candidatos) {
    if (candidato.includes(" ")) continue;

    try {
      fs.mkdirSync(candidato, { recursive: true });
      // Escrever de fato: a pasta pode existir e ainda assim ser somente
      // leitura para este usuario, e descobrir isso no meio do build seria pior.
      const teste = path.join(candidato, ".escrita");
      fs.writeFileSync(teste, "ok");
      fs.rmSync(teste, { force: true });
      return candidato;
    } catch {
      // Proximo candidato.
    }
  }

  return null;
}

const env = { ...process.env };

if (process.platform === "win32") {
  const temp = tempSemEspaco();

  if (temp) {
    if (temp !== (process.env.TEMP || "")) {
      console.log(`ℹ️  TEMP do build: ${temp} (o do sistema tem espaco no caminho)`);
    }
    env.TEMP = temp;
    env.TMP = temp;
  } else {
    // Segue mesmo assim: talvez a versao do electron-builder ja tenha corrigido
    // isso. Mas se falhar com "No JSON content found in output", o motivo esta
    // escrito aqui em cima.
    console.warn(
      "⚠️  Nao foi possivel criar uma pasta temporaria sem espacos. Se o build " +
        'falhar com "No JSON content found in output", e por causa disso.'
    );
  }
}

const resultado = spawnSync("npx", ["electron-builder", ...process.argv.slice(2)], {
  stdio: "inherit",
  shell: true,
  env
});

process.exit(resultado.status ?? 1);
