import app from "./index.mjs";
import { controlCenterApi } from "./control-center-api.mjs";
import { trainingApi } from "./training-api.mjs";

export default {
  async fetch(request, env, context) {
    const path = new URL(request.url).pathname;
    const handler = path === "/api/control-center" ? controlCenterApi : path === "/api/training" ? trainingApi : null;
    if (!handler) return app.fetch(request, env, context);
    try {
      return await handler(request, env.DB);
    } catch {
      return Response.json({ error: "CareNear is temporarily unavailable." }, {
        status: 503, headers: { "Cache-Control": "no-store" },
      });
    }
  },
};
