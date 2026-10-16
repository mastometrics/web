import type { APIRoute } from "astro";

export const GET: APIRoute = () => new Response("ping", { status: 200 });
