import app from "./index.mjs";
import { trainingApi } from "./training-api.mjs";

export default {
  async fetch(request, env, context) {
    if (new URL(request.url).pathname !== "/api/training") return app.fetch(request, env, context);
    try {
      return await trainingApi(request, env.DB);
    } catch {
      return Response.json({ error: "Shared training is temporarily unavailable." }, {
        status: 503, headers: { "Cache-Control": "no-store" },
      });
    }
  },
};
