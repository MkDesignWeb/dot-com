/**
 * Marca os instantes em que o terminal NAO pode ser interrompido.
 *
 * Existe por causa da atualizacao remota. O instalador substitui o executavel e
 * reinicia o aplicativo; se isso acontecer entre o funcionario encostar o rosto
 * na camera e o servidor gravar a batida, a batida se perde. Perder batida num
 * relogio de ponto nao e um erro de software — e hora trabalhada que some da
 * folha de alguem.
 *
 * O contador e um numero, e nao um booleano, porque duas operacoes podem se
 * sobrepor: com booleano, a que terminasse primeiro liberaria a trava da outra.
 */

let pending = 0;

export function isAppBusy(): boolean {
  return pending > 0;
}

/**
 * Roda algo marcando o terminal como ocupado.
 *
 * `finally` para o contador voltar mesmo quando a operacao falha: uma batida
 * recusada pelo servidor nao pode deixar o terminal ocupado para sempre, o que
 * na pratica significaria uma maquina que nunca mais atualiza.
 */
export async function whileBusy<T>(operation: () => Promise<T>): Promise<T> {
  pending += 1;

  try {
    return await operation();
  } finally {
    pending -= 1;
  }
}
