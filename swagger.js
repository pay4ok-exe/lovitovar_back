const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const path = require("path");

const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Lovitovar API",
      version: "1.0.0",
      description: "API документация для Lovitovar",
    },
    servers: [
      {
        url: "http://localhost:5000", // Замените на ваш серверный URL, если нужно
      },
    ],
  },
  apis: [path.join(__dirname, "./controllers/*.js")], // Укажите путь к вашим контроллерам
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

module.exports = (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
};
