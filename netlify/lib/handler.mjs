// Lógica da votação: um voto por aparelho. Nada de nome, e-mail ou IP é guardado.
export const TOTAL_FANTASIAS = 7;
const ID_OK = /^[a-zA-Z0-9-]{16,64}$/;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

async function placar(store) {
  const counts = {};
  for (let i = 1; i <= TOTAL_FANTASIAS; i++) counts[i] = 0;
  let total = 0;
  const { blobs } = await store.list({ prefix: "c/" });
  for (const b of blobs) {
    const n = Number(b.key.split("/")[1]);
    if (counts[n] !== undefined) { counts[n]++; total++; }
  }
  return { counts, total };
}

export async function handle(req, store) {
  const url = new URL(req.url);
  if (req.method === "GET") {
    const res = await placar(store);
    const device = url.searchParams.get("device");
    let meuVoto = null;
    if (device && ID_OK.test(device)) {
      const marca = await store.get("d/" + device);
      if (marca) meuVoto = Number(marca);
    }
    return json({ ...res, meuVoto });
  }
  if (req.method === "POST") {
    let body;
    try { body = await req.json(); } catch { return json({ erro: "Pedido inválido." }, 400); }
    const fantasia = Number(body?.fantasia);
    const device = String(body?.device || "");
    if (!Number.isInteger(fantasia) || fantasia < 1 || fantasia > TOTAL_FANTASIAS)
      return json({ erro: "Escolha uma fantasia." }, 400);
    if (!ID_OK.test(device)) return json({ erro: "Não foi possível identificar o aparelho. Recarregue a página." }, 400);
    const ja = await store.get("d/" + device);
    if (ja) return json({ erro: "Este aparelho já votou.", meuVoto: Number(ja), ...(await placar(store)) }, 409);
    await store.set("d/" + device, String(fantasia));
    await store.set(`c/${fantasia}/${device}`, "1");
    return json({ ok: true, meuVoto: fantasia, ...(await placar(store)) });
  }
  return json({ erro: "Método não permitido." }, 405);
}
