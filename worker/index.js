import { Client } from "pg";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      const client = new Client({
        connectionString: env.HYPERDRIVE.connectionString,
      });

      try {
        await client.connect();
        const result = await client.query("SELECT NOW() AS time");
        return Response.json({
          ok: true,
          database: true,
          time: result.rows[0].time,
        });
      } catch (error) {
        return Response.json(
          {
            ok: false,
            database: false,
            message: "Database connection failed",
          },
          { status: 500 }
        );
      } finally {
        await client.end().catch(() => {});
      }
    }

    return env.ASSETS.fetch(request);
  },
};
