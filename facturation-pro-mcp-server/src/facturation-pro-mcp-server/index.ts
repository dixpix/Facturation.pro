#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
  ListResourcesRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios, { AxiosInstance, AxiosError } from 'axios';

// Configuration depuis les variables d'environnement
const API_USERNAME = process.env.FACTURATION_API_USERNAME;
const API_PASSWORD = process.env.FACTURATION_API_PASSWORD;
const FIRM_ID = process.env.FACTURATION_FIRM_ID;
const BASE_URL = process.env.FACTURATION_BASE_URL || 'https://www.facturation.pro';

if (!API_USERNAME || !API_PASSWORD || !FIRM_ID) {
  throw new Error('FACTURATION_API_USERNAME, FACTURATION_API_PASSWORD and FACTURATION_FIRM_ID environment variables are required');
}

// Définition des erreurs custom
const isAxiosError = (error: any): error is AxiosError => {
  return error.isAxiosError === true;
};

const isRateLimitError = (error: AxiosError): boolean => {
  return error.response?.status === 429;
};

const isAuthError = (error: AxiosError): boolean => {
  return error.response?.status === 401 || error.response?.status === 403;
};

interface Customer {
  id: number;
  company_name?: string;
  individual: boolean;
  email?: string;
  phone?: string;
  city?: string;
  country?: string;
  created_at?: string;
  [key: string]: any;
}

interface Supplier {
  id: number;
  company_name?: string;
  email?: string;
  phone?: string;
  city?: string;
  country?: string;
  [key: string]: any;
}

interface Quote {
  id: number;
  quote_ref: string;
  customer_id: number;
  customer_identity?: string;
  total: number;
  total_with_vat: number;
  currency: string;
  invoiced_on?: string;
  term_on?: string;
  quote_status: number;
  [key: string]: any;
}

interface Invoice {
  id: number;
  invoice_ref: string;
  customer_id: number;
  customer_identity?: string;
  total: number;
  total_with_vat: number;
  currency: string;
  invoiced_on?: string;
  due_on?: string;
  payment_mode?: number;
  paid_on?: string;
  [key: string]: any;
}

class FacturationProServer {
  private server: Server;
  private apiClient: AxiosInstance;

  constructor() {
    this.server = new Server(
      {
        name: 'facturation-pro-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.apiClient = axios.create({
      baseURL: BASE_URL,
      auth: {
        username: API_USERNAME,
        password: API_PASSWORD,
      },
      headers: {
        'User-Agent': 'Facturation-PRO-MCP-Server (contact@example.com)',
        'Content-Type': 'application/json',
      },
    });

    // Gestion des erreurs et retry automatique
    this.apiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (isAxiosError(error)) {
          if (isRateLimitError(error)) {
            // Attendre un peu avant de retry (rate limiting)
            await new Promise(resolve => setTimeout(resolve, 1000));
            // Retry une fois
            return this.apiClient.request(error.config!);
          }
          if (isAuthError(error)) {
            throw new McpError(ErrorCode.InvalidRequest, 'Authentification échouée - Vérifiez vos credentials');
          }
        }
        // Erreur par défaut
        const message = error.response?.data?.errors || error.message;
        throw new McpError(ErrorCode.InternalError, `API Error: ${message}`);
      }
    );

    this.setupToolHandlers();
    this.setupResourceHandlers();

    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // === MODULE CLIENTS (outils 1-8) ===
        {
          name: 'list_customers',
          description: 'Lister les clients de l\'entreprise',
          inputSchema: {
            type: 'object',
            properties: {
              company: {
                type: 'string',
                description: 'Recherche partielle sur le nom de société'
              },
              email: {
                type: 'string',
                description: 'Recherche partielle sur l\'email'
              },
              page: {
                type: 'number',
                description: 'Numéro de page (par défaut: 1)',
                default: 1
              }
            }
          }
        },
        {
          name: 'create_customer',
          description: 'Créer un nouveau client',
          inputSchema: {
            type: 'object',
            required: ['company_name'],
            properties: {
              company_name: {
                type: 'string',
                description: 'Nom de la société'
              },
              individual: {
                type: 'boolean',
                description: 'True pour particulier, false pour entreprise',
                default: false
              },
              email: {
                type: 'string',
                description: 'Adresse email'
              },
              phone: {
                type: 'string',
                description: 'Numéro de téléphone'
              },
              street: {
                type: 'string',
                description: 'Adresse'
              },
              city: {
                type: 'string',
                description: 'Ville'
              },
              zip_code: {
                type: 'string',
                description: 'Code postal'
              },
              country: {
                type: 'string',
                description: 'Code pays (FR, US, etc.)',
                default: 'FR'
              }
            }
          }
        },
        {
          name: 'get_customer',
          description: 'Détails d\'un client existant',
          inputSchema: {
            type: 'object',
            required: ['customer_id'],
            properties: {
              customer_id: {
                type: 'number',
                description: 'ID du client'
              }
            }
          }
        },
        {
          name: 'update_customer',
          description: 'Modifier un client existant',
          inputSchema: {
            type: 'object',
            required: ['customer_id'],
            properties: {
              customer_id: {
                type: 'number',
                description: 'ID du client à modifier'
              },
              company_name: {
                type: 'string',
                description: 'Nouveau nom société'
              },
              individual: {
                type: 'boolean',
                description: 'Type client'
              },
              email: {
                type: 'string',
                description: 'Nouvel email'
              },
              phone: {
                type: 'string',
                description: 'Nouveau téléphone'
              },
              street: {
                type: 'string',
                description: 'Nouvelle adresse'
              },
              city: {
                type: 'string',
                description: 'Nouvelle ville'
              },
              zip_code: {
                type: 'string',
                description: 'Nouveau code postal'
              },
              country: {
                type: 'string',
                description: 'Nouveau pays'
              },
              category_id: {
                type: 'number',
                description: 'Nouvelle catégorie'
              }
            }
          }
        },
        {
          name: 'delete_customer',
          description: 'Supprimer un client',
          inputSchema: {
            type: 'object',
            required: ['customer_id'],
            properties: {
              customer_id: {
                type: 'number',
                description: 'ID du client à supprimer'
              }
            }
          }
        },
        {
          name: 'archive_customer',
          description: 'Archiver un client',
          inputSchema: {
            type: 'object',
            required: ['customer_id'],
            properties: {
              customer_id: {
                type: 'number',
                description: 'ID du client à archiver'
              }
            }
          }
        },
        {
          name: 'unarchive_customer',
          description: 'Restaurer un client archivé',
          inputSchema: {
            type: 'object',
            required: ['customer_id'],
            properties: {
              customer_id: {
                type: 'number',
                description: 'ID du client à restaurer'
              }
            }
          }
        },
        {
          name: 'upload_customer_file',
          description: 'Ajouter fichier joint au client',
          inputSchema: {
            type: 'object',
            required: ['customer_id', 'filename'],
            properties: {
              customer_id: {
                type: 'number',
                description: 'ID du client'
              },
              filename: {
                type: 'string',
                description: 'Nom du fichier'
              }
            }
          }
        },

        // === MODULE CATEGORIES (outils 8-11) ===
        {
          name: 'list_categories',
          description: 'Lister les catégories avec filtres',
          inputSchema: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                description: 'Filtrer par titre (recherche partielle)'
              },
              status: {
                type: 'number',
                description: 'Filtrer par statut (1=Achat, 2=Vente)'
              },
              page: {
                type: 'number',
                description: 'Numéro de page (par défaut: 1)',
                default: 1
              }
            }
          }
        },
        {
          name: 'create_category',
          description: 'Créer une nouvelle catégorie',
          inputSchema: {
            type: 'object',
            required: ['title', 'status'],
            properties: {
              title: {
                type: 'string',
                description: 'Titre de la catégorie'
              },
              status: {
                type: 'number',
                description: 'Statut (1=Achat, 2=Vente)',
                enum: [1, 2]
              }
            }
          }
        },
        {
          name: 'update_category',
          description: 'Modifier une catégorie',
          inputSchema: {
            type: 'object',
            required: ['category_id'],
            properties: {
              category_id: {
                type: 'number',
                description: 'ID de la catégorie'
              },
              title: {
                type: 'string',
                description: 'Nouveau titre de la catégorie'
              },
              status: {
                type: 'number',
                description: 'Nouveau statut (1=Achat, 2=Vente)',
                enum: [1, 2]
              }
            }
          }
        },
        {
          name: 'delete_category',
          description: 'Supprimer une catégorie',
          inputSchema: {
            type: 'object',
            required: ['category_id'],
            properties: {
              category_id: {
                type: 'number',
                description: 'ID de la catégorie à supprimer'
              }
            }
          }
        }
      ]
    }));

    // Gestionnaire principal des outils
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        // === MODULE CLIENTS ===
        case 'list_customers':
          return await this.handleListCustomers(request.params.arguments);
        case 'create_customer':
          return await this.handleCreateCustomer(request.params.arguments);
        case 'get_customer':
          return await this.handleGetCustomer(request.params.arguments);
        case 'update_customer':
          return await this.handleUpdateCustomer(request.params.arguments);
        case 'delete_customer':
          return await this.handleDeleteCustomer(request.params.arguments);
        case 'archive_customer':
          return await this.handleArchiveCustomer(request.params.arguments);
        case 'unarchive_customer':
          return await this.handleUnarchiveCustomer(request.params.arguments);
        case 'upload_customer_file':
          return await this.handleUploadCustomerFile(request.params.arguments);

        // === MODULE CATEGORIES ===
        case 'list_categories':
          return await this.handleListCategories(request.params.arguments);
        case 'create_category':
          return await this.handleCreateCategory(request.params.arguments);
        case 'update_category':
          return await this.handleUpdateCategory(request.params.arguments);
        case 'delete_category':
          return await this.handleDeleteCategory(request.params.arguments);

        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Tool inconnu: ${request.params.name}`
          );
      }
    });
  }

  private setupResourceHandlers() {
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: `facturation://firms/${FIRM_ID}/customers`,
          name: 'Clients actifs de l\'entreprise',
          description: 'Accès aux clients actifs de votre entreprise',
          mimeType: 'application/json',
        },
        {
          uri: `facturation://firms/${FIRM_ID}/categories`,
          name: 'Catégories de l\'entreprise',
          description: 'Accès aux catégories (achats/ventes)',
          mimeType: 'application/json',
        }
      ]
    }));

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const parts = request.params.uri.split('/');
      const resource = parts[parts.length - 1];
      const category = parts[parts.length - 2];

      try {
        let data: any;
        switch (category) {
          case 'customers':
            const customersResponse = await this.apiClient.get(`/firms/${FIRM_ID}/customers.json?page=1&mode=company`);
            data = customersResponse.data;
            break;
          case 'categories':
            const categoriesResponse = await this.apiClient.get(`/firms/${FIRM_ID}/categories.json?page=1`);
            data = categoriesResponse.data;
            break;
          default:
            throw new McpError(ErrorCode.InvalidRequest, `Ressource inconnue: ${request.params.uri}`);
        }

        return {
          contents: [
            {
              uri: request.params.uri,
              mimeType: 'application/json',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      } catch (error) {
        const message = isAxiosError(error) ? error.message : 'Erreur inconnue';
        return {
          contents: [
            {
              uri: request.params.uri,
              mimeType: 'application/json',
              text: JSON.stringify({ error: message }, null, 2),
            },
          ],
        };
      }
    });
  }

  // === MODULE CLIENTS ===
  private async handleListCustomers(args: any) {
    const params: any = {
      page: args.page || 1,
      sort: 'asc',
      order: 'created'
    };

    if (args.company) params.company = args.company;
    if (args.email) params.email = args.email;

    const response = await this.apiClient.get(`/firms/${FIRM_ID}/customers.json`, { params });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        }
      ]
    };
  }

  private async handleCreateCustomer(args: any) {
    const customerData = {
      company_name: args.company_name,
      individual: args.individual || false,
      email: args.email || null,
      phone: args.phone || null,
      street: args.street || null,
      city: args.city || null,
      zip_code: args.zip_code || null,
      country: args.country || 'FR'
    };

    const response = await this.apiClient.post(`/firms/${FIRM_ID}/customers.json`, customerData);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Client créé avec succès\n${JSON.stringify(response.data, null, 2)}`,
        }
      ]
    };
  }

  private async handleGetCustomer(args: any) {
    const response = await this.apiClient.get(`/firms/${FIRM_ID}/customers/${args.customer_id}.json`);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        }
      ]
    };
  }

  private async handleUpdateCustomer(args: any) {
    const customerData: any = {};
    if (args.company_name) customerData.company_name = args.company_name;
    if (args.individual !== undefined) customerData.individual = args.individual;
    if (args.email !== undefined) customerData.email = args.email;
    if (args.phone !== undefined) customerData.phone = args.phone;
    if (args.street !== undefined) customerData.street = args.street;
    if (args.city !== undefined) customerData.city = args.city;
    if (args.zip_code !== undefined) customerData.zip_code = args.zip_code;
    if (args.country !== undefined) customerData.country = args.country;
    if (args.category_id !== undefined) customerData.category_id = args.category_id;

    const response = await this.apiClient.patch(`/firms/${FIRM_ID}/customers/${args.customer_id}.json`, customerData);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Client ${args.customer_id} modifié avec succès\n${JSON.stringify(response.data, null, 2)}`,
        }
      ]
    };
  }

  private async handleDeleteCustomer(args: any) {
    await this.apiClient.delete(`/firms/${FIRM_ID}/customers/${args.customer_id}.json`);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Client ${args.customer_id} supprimé avec succès`,
        }
      ]
    };
  }

  private async handleArchiveCustomer(args: any) {
    await this.apiClient.post(`/firms/${FIRM_ID}/customers/${args.customer_id}/archive.json`);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Client ${args.customer_id} archivé avec succès`,
        }
      ]
    };
  }

  private async handleUnarchiveCustomer(args: any) {
    await this.apiClient.post(`/firms/${FIRM_ID}/customers/${args.customer_id}/unarchive.json`);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Client ${args.customer_id} restauré avec succès`,
        }
      ]
    };
  }

  private async handleUploadCustomerFile(args: any) {
    const formData = new FormData();
    formData.append('upload_file', args.file_data);
    formData.append('filename', args.filename);

    const response = await this.apiClient.post(`/firms/${FIRM_ID}/customers/${args.customer_id}/upload.json`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return {
      content: [
        {
          type: 'text',
          text: `✅ Fichier ajouté au client ${args.customer_id}\n${JSON.stringify(response.data, null, 2)}`,
        }
      ]
    };
  }

  // === MODULE CATEGORIES ===
  private async handleListCategories(args: any) {
    const params: any = { page: args.page || 1 };
    if (args.title) params.title = args.title;
    if (args.status !== undefined) params.status = args.status;

    const response = await this.apiClient.get(`/firms/${FIRM_ID}/categories.json`, { params });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        }
      ]
    };
  }

  private async handleCreateCategory(args: any) {
    const categoryData = {
      title: args.title,
      status: args.status
    };

    const response = await this.apiClient.post(`/firms/${FIRM_ID}/categories.json`, categoryData);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Catégorie créée avec succès\n${JSON.stringify(response.data, null, 2)}`,
        }
      ]
    };
  }

  private async handleUpdateCategory(args: any) {
    const categoryData: any = {};
    if (args.title) categoryData.title = args.title;
    if (args.status !== undefined) categoryData.status = args.status;

    const response = await this.apiClient.patch(`/firms/${FIRM_ID}/categories/${args.category_id}.json`, categoryData);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Catégorie ${args.category_id} modifiée avec succès\n${JSON.stringify(response.data, null, 2)}`,
        }
      ]
    };
  }

  private async handleDeleteCategory(args: any) {
    await this.apiClient.delete(`/firms/${FIRM_ID}/categories/${args.category_id}.json`);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Catégorie ${args.category_id} supprimée avec succès`,
        }
      ]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Facturation.PRO MCP server listening on stdio');
  }
}

const server = new FacturationProServer();
server.run().catch(console.error);
