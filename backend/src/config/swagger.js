// src/config/swagger.js

import swaggerJsdoc from "swagger-jsdoc";

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",

    info: {
      title: "AidFlow API",

      version: "1.0.0",
    },
  },

  apis: ["./src/modules/**/*.js"],
});
