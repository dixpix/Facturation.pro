#!/usr/bin/env node
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
  ListResourcesRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const axios = require('axios');

// Configuration depuis les variables d'environnement
const API_KEY = process.env.FACTURATION_API_KEY;
const FIRM_ID = process.env.FACTURATION_FIRM_ID;
const BASE_URL = process.env.FACTURATION_BASE_URL || 'https://www.facturation.pro';

if (!API_KEY || !FIRM_ID) {
  throw new Error('FACTURATION_API_KEY and FACTURATION_FIRM_ID environment variables are required');
}

class FacturationProServer {
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
      headers: {
        'X-API-Key': API_KEY,
        'User-Agent': 'Facturation-Pro-MCP-Server (contact@example.com)',
        'Content-Type': 'application/json',
      },
    });

    // Gestion des erreurs et retry automatique
    this.apiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 429) {
          // Attendre un peu avant de retry (rate limiting)
          await new Promise(resolve => setTimeout(resolve, 1000));
          // Retry une fois
          return this.apiClient.request(error.config);
        }
        if (error.response?.status === 401 || error.response?.status === 403) {
          throw new McpError(ErrorCode.InvalidRequest, 'Authentification échouée - Vérifiez vos credentials');
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

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
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
              city: {
                type: 'string',
                description: 'Ville'
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
          name: 'create_quote',
          description: 'Créer un devis',
          inputSchema: {
            type: 'object',
            required: ['customer_id', 'title', 'items'],
            properties: {
              customer_id: {
                type: 'number',
                description: 'ID du client'
              },
              title: {
                type: 'string',
                description: 'Objet du devis'
              },
              items: {
                type: 'array',
                description: 'Liste des lignes de facturation',
                items: {
                  type: 'object',
                  required: ['title', 'quantity', 'unit_price', 'vat'],
                  properties: {
                    title: {
                      type: 'string',
                      description: 'Libellé'
                    },
                    quantity: {
                      type: 'number',
                      description: 'Quantité'
                    },
                    unit_price: {
                      type: 'number',
                      description: 'Prix unitaire HT'
                    },
                    vat: {
                      type: 'number',
                      description: 'Taux de TVA (ex: 0.2 pour 20%)'
                    }
                  }
                }
              },
              pay_before: {
                type: 'string',
                description: 'Délai de paiement (ex: "30", "30fm")',
                default: '30'
              }
            }
          }
        },
        {
          name: 'convert_quote_to_invoice',
          description: 'Convertir un devis en facture',
          inputSchema: {
            type: 'object',
            required: ['quote_id'],
            properties: {
              quote_id: {
                type: 'number',
                description: 'ID du devis à convertir'
              }
            }
          }
        },
        {
          name: 'list_invoices',
          description: 'Lister les factures',
          inputSchema: {
            type: 'object',
            properties: {
              bill_type: {
                type: 'string',
                description: 'Type de facture (unpaid, paid, term, etc.)'
              },
              page: {
                type: 'number',
                description: 'Numéro de page',
                default: 1
              }
            }
          }
        },
        {
          name: 'mark_invoice_paid',
          description: 'Marquer une facture comme payée',
          inputSchema: {
            type: 'object',
            required: ['invoice_id', 'payment_date'],
            properties: {
              invoice_id: {
                type: 'number',
                description: 'ID de la facture'
              },
              payment_date: {
                type: 'string',
                description: 'Date de paiement (format YYYY-MM-DD)',
                pattern: '^\d{4}-\d{2}-\d{2}$'
              },
              payment_mode: {
                type: 'number',
                description: 'Mode de paiement (3=Virement, 2=CB, etc.)',
                default: 3
              }
            }
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'list_customers':
          return await this.handleListCustomers(args);
        case 'create_customer':
          return await this.handleCreateCustomer(args);
        case 'create_quote':
          return await this.handleCreateQuote(args);
        case 'convert_quote_to_invoice':
          return await this.handleConvertQuoteToInvoice(args);
        case 'list_invoices':
          return await this.handleListInvoices(args);
        case 'mark_invoice_paid':
          return await this.handleMarkInvoicePaid(args);
        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Tool inconnu: ${name}`
          );
      }
    });
  }

  setupResourceHandlers() {
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: `facturation://firms/${FIRM_ID}/customers`,
          name: 'Clients actifs de l\'entreprise',
          description: 'Accès aux clients actifs de votre entreprise',
          mimeType: 'application/json',
        }
      ]
    }));

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      try {
        if (request.params.uri === `facturation://firms/${FIRM_ID}/customers`) {
          const response = await this.apiClient.get(`/firms/${FIRM_ID}/customers.json?page=1&mode=company`);
          return {
            contents: [
              {
                uri: request.params.uri,
                mimeType: 'application/json',
                text: JSON.stringify(response.data, null, 2),
              },
            ],
          };
        }
        throw new McpError(ErrorCode.InvalidRequest, `Ressource inconnue: ${request.params.uri}`);
      } catch (error) {
        const message = error.response?.data?.message || error.message;
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

  async handleListCustomers(args) {
    const params = {
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

  async handleCreateCustomer(args) {
    const customerData = {
      company_name: args.company_name,
      individual: args.individual || false,
      email: args.email || null,
      phone: args.phone || null,
      city: args.city || null,
      country: args.country || 'FR'
    };

    const response = await this.apiClient.post(`/firms/${FIRM_ID}/customers.json`, customerData);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Client "${args.company_name}" créé avec succès\nID: ${response.data.id}`,
        }
      ]
    };
  }

  async handleCreateQuote(args) {
    const quoteData = {
      customer_id: args.customer_id,
      title: args.title,
      items: args.items,
      pay_before: args.pay_before || '30',
      language: 'fr',
      currency: 'EUR'
    };

    const response = await this.apiClient.post(`/firms/${FIRM_ID}/quotes.json`, quoteData);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Devis "${args.title}" créé avec succès\nRéférence: ${response.data.quote_ref}`,
        }
      ]
    };
  }

  async handleConvertQuoteToInvoice(args) {
    const response = await this.apiClient.post(`/firms/${FIRM_ID}/quotes/${args.quote_id}/invoice.json`);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Devis converti en facture\nFacture Référence: ${response.data.invoice_ref}`,
        }
      ]
    };
  }

  async handleListInvoices(args) {
    const params = { page: args.page || 1 };
    if (args.bill_type) params.bill_type = args.bill_type;

    const response = await this.apiClient.get(`/firms/${FIRM_ID}/invoices.json`, { params });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        }
      ]
    };
  }

  async handleMarkInvoicePaid(args) {
    await this.apiClient.patch(`/firms/${FIRM_ID}/invoices/${args.invoice_id}.json`, {
      paid_on: args.payment_date,
      payment_mode: args.payment_mode || 3
    });

    return {
      content: [
        {
          type: 'text',
          text: `✅ Facture ${args.invoice_id} marquée comme payée le ${args.payment_date}`,
        }
      ]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Facturation.pro MCP server listening on stdio');
  }
}

const server = new FacturationProServer();
server.run().catch(console.error);
