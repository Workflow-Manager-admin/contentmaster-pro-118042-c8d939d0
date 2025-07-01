const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ContentMaster Pro API',
      version: '1.0.0',
      description: 'A full-stack Content Management Dashboard API with role-based access control',
      contact: {
        name: 'ContentMaster Pro',
        email: 'support@contentmaster.pro'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints'
      },
      {
        name: 'Authentication',
        description: 'User authentication and authorization'
      },
      {
        name: 'Posts',
        description: 'Post management operations'
      },
      {
        name: 'Pages',
        description: 'Page management operations'
      },
      {
        name: 'Media',
        description: 'Media upload and management'
      },
      {
        name: 'Tags',
        description: 'Tag management operations'
      }
    ]
  },
  apis: ['./src/routes/*.js'], // Path to the API docs
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;
