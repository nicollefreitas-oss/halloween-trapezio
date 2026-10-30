import { getStore } from "@netlify/blobs";
import { handle } from "../lib/handler.mjs";

export default async (req) => handle(req, getStore({ name: "votos-halloween-v2", consistency: "strong" }));

export const config = { path: "/api/votos" };
