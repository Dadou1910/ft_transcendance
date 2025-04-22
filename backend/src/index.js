const fastify = require("fastify")({ logger: true });

fastify.get("/", async (request, reply) => {
    return { message: "Backend ft_transcendence prêt !" };
});

const start = async () => {
    try {
        await fastify.listen({ port: 3000, host: "0.0.0.0" });
        console.log("Serveur lancé sur http://localhost:3000");
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start();
