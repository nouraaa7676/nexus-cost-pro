import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/copilot")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        const body = (await request.json()) as {
          messages?: { role: "user" | "assistant" | "system"; content: string }[];
          context?: string;
        };
        if (!Array.isArray(body.messages)) return new Response("messages required", { status: 400 });

        const system = `You are the AI Co-Pilot inside the e& Budget Intelligence & Cost Optimization Platform. You help finance leaders, executives and budget owners analyse CAPEX/OPEX spend, forecast year-end positions, identify cost-saving opportunities and explain variances. Be concise, executive-ready, and use AED currency. When the user asks for an analysis, structure with short headers + bullets. Refer only to the data context the user provides below; never invent figures.\n\nDATA CONTEXT (live from the platform):\n${body.context ?? "(no data yet)"}`;

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{ role: "system", content: system }, ...body.messages],
            stream: false,
          }),
        });

        if (upstream.status === 429) return new Response("Rate limit exceeded. Please try again in a moment.", { status: 429 });
        if (upstream.status === 402) return new Response("AI credits exhausted. Please add credits in the workspace.", { status: 402 });
        if (!upstream.ok) {
          const text = await upstream.text();
          return new Response(`AI gateway error: ${text}`, { status: upstream.status });
        }

        const json = (await upstream.json()) as { choices?: { message?: { content?: string } }[] };
        const content = json.choices?.[0]?.message?.content ?? "(no response)";
        return Response.json({ content });
      },
    },
  },
});