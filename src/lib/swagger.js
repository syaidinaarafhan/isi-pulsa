import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

export const swaggerSpec = swaggerJSDoc({
    definition: {
        openapi: "3.0.3",
        info: {
            title: "Slip Gaji API",
            version: "1.0.0",
        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
    },
    apis: ["./src/**/*.js"],
});

export const swaggerMiddleware = [
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
        swaggerOptions: { persistAuthorization: true }
    })
]