import assert from "node:assert/strict";
import {
    describeTimeSource,
    formatUtcClock,
    parseTimeSource,
    UNKNOWN_TIME_SOURCE
} from "../utils/timeSource";

function run() {
    // ---- Leitura da resposta ----
    const oficial = parseTimeSource({
        serverTime: 1_788_000_000_000,
        officialTime: true,
        source: "a.st1.ntp.br",
        stale: false
    });
    assert.deepEqual(oficial, { official: true, source: "a.st1.ntp.br", stale: false });

    // Servidor anterior a esta versao responde so `serverTime`. Nao pode virar
    // "horario oficial": dizer isso sem ninguem ter verificado e pior que calar.
    assert.deepEqual(parseTimeSource({ serverTime: 1 }), UNKNOWN_TIME_SOURCE);
    assert.deepEqual(parseTimeSource(null), UNKNOWN_TIME_SOURCE);
    assert.deepEqual(parseTimeSource("14:00"), UNKNOWN_TIME_SOURCE);

    // So o `true` literal conta como oficial.
    assert.equal(parseTimeSource({ officialTime: "sim" }).official, false);
    // Idem para `stale`: na duvida, e antigo.
    assert.equal(parseTimeSource({ officialTime: true }).stale, true);

    // ---- Rotulo ----
    const sincronizado = describeTimeSource(oficial);
    assert.equal(sincronizado.text, "Horário oficial de Brasília");
    assert.equal(sincronizado.warning, false);
    assert.match(sincronizado.detail, /a\.st1\.ntp\.br/);

    // Oficial mas antigo: o horario pode ter escorregado, entao avisa.
    const antigo = describeTimeSource({ official: true, source: "a.st1.ntp.br", stale: true });
    assert.equal(antigo.text, "Horário oficial desatualizado");
    assert.equal(antigo.warning, true);

    // Servidor sem sincronismo: o caso traicoeiro, porque tudo parece certo.
    const naoVerificado = describeTimeSource(UNKNOWN_TIME_SOURCE);
    assert.equal(naoVerificado.text, "Horário do servidor (não verificado)");
    assert.equal(naoVerificado.warning, true);

    // ---- Precedencia ----
    // Sem servidor, o que importa nao e a procedencia da hora: e que ela esta
    // deixando de valer. Esse aviso vence mesmo com o servidor sincronizado.
    const semConexao = describeTimeSource(oficial, { isOutOfSync: true });
    assert.equal(semConexao.text, "Sem conexão com o servidor");
    assert.equal(semConexao.warning, true);

    // ---- UTC ----
    // 12:00Z e sempre 12:00 em UTC, independente do fuso da maquina — e por isso
    // que ele serve de conferencia.
    assert.equal(formatUtcClock(new Date("2026-09-03T12:00:00.000Z")), "12:00:00 UTC");
    assert.equal(formatUtcClock(new Date("2026-09-03T00:30:09.000Z")), "00:30:09 UTC");
    assert.equal(formatUtcClock(new Date("data inválida")), "");

    console.log("timeSource.check: ok");
}

run();
