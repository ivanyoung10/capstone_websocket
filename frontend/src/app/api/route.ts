export async function POST(req: Request) {
  const { prompt } = await req.json();

  const r = await fetch(process.env.GATEWAY_API_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    //   "x-api-key": process.env.GATEWAY_API_KEY!,
    },
    body: JSON.stringify({ prompt })
  });

  const json = await r.json();
  const raw = json.results?.[0]?.outputText ?? "";
  const cleaned = raw.trim().replace("Bot:", "").trim();

  return new Response(cleaned, { status: 200 }); // ← required
}