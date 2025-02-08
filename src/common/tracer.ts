const tracer = require("dd-trace");

tracer.init({
    logInjection: false,
    runtimeMetrics: true
});

tracer.use("http", {
    client: {
        headers: ["x-correlation-id"]
    }
});

tracer.use("mongodb-core", {
    services: "street-noshery-db",
    measured: true // enable performance metrics
})

module.exports = tracer;