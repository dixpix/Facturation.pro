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

// Configuration depuis les variables d'environnement (format APIv2 corrigé)
const API_ID = process.env.FACTURATION_API_ID;
const API_KEY = process.env.FACTURATION_API_KEY;
const FIRM_ID = process.env.FACTURATION_FIRM_ID;
const BASE_URL = process.env.FACTURATION_BASE_URL || 'https://www.facturation.pro';

if (!API_ID || !API_KEY || !FIRM_ID) {
  throw new Error('FACTURATION_API_ID, FACTURATION_API_KEY and FACTURATION_FIRM_ID environment variables are required');
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
        username: API_ID!,
        password: API_KEY!,
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
          description: 'Créer un nouveau client (particulier ou entreprise/professionnel). Tous les champs de contact peuvent être utilisés pour tous les types de clients.',
          inputSchema: {
            type: 'object',
            required: ['company_name'],
            properties: {
              company_name: {
                type: 'string',
                description: 'Nom société (OBLIGATOIRE pour professionnels, optionnel/vide pour particuliers)'
              },
              first_name: {
                type: 'string',
                description: 'Prénom de la personne de contact (OBLIGATOIRE pour particuliers français, FACULTATIF pour professionnels = personne à contacter/dirigeant)'
              },
              last_name: {
                type: 'string',
                description: 'Nom de la personne de contact (OBLIGATOIRE pour particuliers français, FACULTATIF pour professionnels = personne à contacter/dirigeant)'
              },
              individual: {
                type: 'boolean',
                description: 'True=particulier (utiliser first_name+last_name obligatoires), False=professionnel (company_name obligatoire, contact optionnel)',
                default: false,
                examples: [
                  {
                    value: true,
                    description: 'PARTICULIER: individual=true + company_name vide + first_name/last_name/civility OBLIGATOIRES'
                  },
                  {
                    value: false,
                    description: 'PROFESSIONNEL: individual=false + company_name OBLIGATOIRE + contact optionnel (prénom/nom/civilité = personne de contact)'
                  }
                ]
              },
              civility: {
                type: 'string',
                description: 'Civilité de la personne de contact. Valeurs: M., Mme, Mlle, M. et Mme, M. ou Mme, Dr, Me, Pr, Sté, vide',
                enum: ['M.', 'Mme', 'Mlle', 'M. et Mme', 'M. ou Mme', 'Dr', 'Me', 'Pr', 'Sté', '']
              },
              email: {
                type: 'string',
                description: 'Email principal du client'
              },
              phone: {
                type: 'string',
                description: 'Téléphone principal du client'
              },
              street: {
                type: 'string',
                description: 'Adresse (numéro + rue)'
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
          description: 'Modifier un client existant (particulier ou entreprise/professionnel)',
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
                description: 'Nouveau nom société (professionnel) OU vide (particulier)'
              },
              first_name: {
                type: 'string',
                description: 'Nouveau prénom de contact (OBLIGATOIRE pour particuliers, FACULTATIF pour professionnels = personne de contact)'
              },
              last_name: {
                type: 'string',
                description: 'Nouveau nom de contact (OBLIGATOIRE pour particuliers, FACULTATIF pour professionnels = personne de contact)'
              },
              individual: {
                type: 'boolean',
                description: 'Modifier type client - false=professionnel, true=particulier'
              },
              civility: {
                type: 'string',
                description: 'Nouvelle civilité de contact: M., Mme, Mlle, etc.',
                enum: ['M.', 'Mme', 'Mlle', 'M. et Mme', 'M. ou Mme', 'Dr', 'Me', 'Pr', 'Sté', '']
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
        },

        // === MODULE DEVIS - OUTILS BASIQUES ===
        {
          name: 'create_quote',
          description: 'Créer un nouveau devis',
          inputSchema: {
            type: 'object',
            required: ['customer_id'],
            properties: {
              customer_id: {
                type: 'number',
                description: 'ID du client'
              },
              title: {
                type: 'string',
                description: 'Objet du devis'
              },
              currency: {
                type: 'string',
                description: 'Devise (EUR, USD, etc.)',
                default: 'EUR'
              },
              invoiced_on: {
                type: 'string',
                description: 'Date du devis (YYYY-MM-DD)'
              },
              term_on: {
                type: 'string',
                description: 'Valide jusqu\'au (YYYY-MM-DD)'
              },
              pay_before: {
                type: 'string',
                description: 'Délai de paiement (ex: "30", "30fm")',
                default: '30'
              },
              language: {
                type: 'string',
                description: 'Langue du PDF (fr, en, es)',
                default: 'fr'
              },
              items: {
                type: 'array',
                description: 'Liste des lignes de devis',
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
              }
            }
          }
        },

        {
          name: 'list_quotes',
          description: 'Liste des devis avec filtres et pagination',
          inputSchema: {
            type: 'object',
            properties: {
              page: {
                type: 'number',
                description: 'Numéro de page (par défaut: 1)'
              },
              with_details: {
                type: 'number',
                description: 'Inclure lignes et fichiers (0 ou 1)',
                enum: [0, 1]
              },
              customer_id: {
                type: 'number',
                description: 'Filtrer par ID client'
              },
              status: {
                type: 'string',
                description: 'Statut: pending, to_invoice, invoiced, 0, 1, 9'
              },
              period_start: {
                type: 'string',
                description: 'Période début (YYYY-MM-DD)'
              },
              period_end: {
                type: 'string',
                description: 'Période fin (YYYY-MM-DD)'
              }
            }
          }
        },
        {
          name: 'get_quote',
          description: 'Obtenir les détails complets d\'un devis avec lignes de facturation',
          inputSchema: {
            type: 'object',
            required: ['quote_id'],
            properties: {
              quote_id: {
                type: 'number',
                description: 'ID du devis'
              }
            }
          }
        },
        {
          name: 'update_quote',
          description: 'Modifier un devis existant',
          inputSchema: {
            type: 'object',
            required: ['quote_id'],
            properties: {
              quote_id: {
                type: 'number',
                description: 'ID du devis'
              },
              customer_id: {
                type: 'number',
                description: 'ID du client'
              },
              title: {
                type: 'string',
                description: 'Objet du devis'
              },
              penalty: {
                type: 'number',
                description: 'Pénalités de retard'
              },
              information: {
                type: 'string',
                description: 'Informations complémentaires'
              },
              quote_status: {
                type: 'number',
                description: '0=attente, 1=accepté, 9=refusé'
              },
              items: {
                type: 'array',
                description: 'Lignes de devis',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    position: { type: 'number' },
                    title: { type: 'string' },
                    quantity: { type: 'number' },
                    unit_price: { type: 'number' },
                    vat: { type: 'number' },
                    _destroy: { type: 'string', description: '1 pour supprimer' }
                  }
                }
              }
            }
          }
        },
        {
          name: 'delete_quote',
          description: 'Supprimer un devis',
          inputSchema: {
            type: 'object',
            required: ['quote_id'],
            properties: {
              quote_id: {
                type: 'number',
                description: 'ID du devis à supprimer'
              }
            }
          }
        },
        {
          name: 'download_quote_pdf',
          description: 'Télécharger le PDF d\'un devis',
          inputSchema: {
            type: 'object',
            required: ['quote_id'],
            properties: {
              quote_id: {
                type: 'number',
                description: 'ID du devis'
              },
              proforma: {
                type: 'number',
                description: '1 pour facture proforma, 0 pour devis normal',
                enum: [0, 1]
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

        // === MODULE DEVIS COMPLET - OUTILS MANQUANTS ===
        {
          name: 'update_quote_status',
          description: 'Changer le statut d\'un devis (0=Brouillon, 1=Accepté, 9=Refusé)',
          inputSchema: {
            type: 'object',
            required: ['quote_id', 'status'],
            properties: {
              quote_id: {
                type: 'number',
                description: 'ID du devis à modifier'
              },
              status: {
                type: 'number',
                description: 'Nouveau statut (0=Brouillon, 1=Accepté, 9=Refusé)',
                enum: [0, 1, 9]
              }
            }
          }
        },
        {
          name: 'upload_quote_file',
          description: 'Ajouter pièce jointe à un devis',
          inputSchema: {
            type: 'object',
            required: ['quote_id', 'filename'],
            properties: {
              quote_id: {
                type: 'number',
                description: 'ID du devis'
              },
              filename: {
                type: 'string',
                description: 'Nom du fichier à uploader'
              }
            }
          }
        },
        {
          name: 'send_quote_email',
          description: 'Envoyer devis par courriel',
          inputSchema: {
            type: 'object',
            required: ['quote_id', 'email'],
            properties: {
              quote_id: {
                type: 'number',
                description: 'ID du devis à envoyer'
              },
              email: {
                type: 'string',
                description: 'Adresse email destinataire'
              },
              subject: {
                type: 'string',
                description: 'Sujet de l\'email'
              },
              message: {
                type: 'string',
                description: 'Message personnalisé'
              }
            }
          }
        },

        // === MODULE FACTURES COMPLET - OUTILS MANQUANTS ===
        {
          name: 'list_invoices',
          description: 'Liste des factures avec filtres et pagination',
          inputSchema: {
            type: 'object',
            properties: {
              page: {
                type: 'number',
                description: 'Numéro de page (par défaut: 1)'
              },
              with_details: {
                type: 'number',
                description: 'Inclure lignes (0 ou 1)',
                enum: [0, 1]
              },
              with_settlements: {
                type: 'number',
                description: 'Inclure règlements (0 ou 1)',
                enum: [0, 1]
              },
              customer_id: {
                type: 'number',
                description: 'Filtrer par ID client'
              },
              bill_type: {
                type: 'string',
                description: 'Type: paid, unpaid, term, invoice, refund'
              },
              period_start: {
                type: 'string',
                description: 'Période début (YYYY-MM-DD)'
              },
              period_end: {
                type: 'string',
                description: 'Période fin (YYYY-MM-DD)'
              }
            }
          }
        },
        {
          name: 'get_invoice',
          description: 'Obtenir les détails d\'une facture',
          inputSchema: {
            type: 'object',
            required: ['invoice_id'],
            properties: {
              invoice_id: {
                type: 'number',
                description: 'ID de la facture'
              },
              type_doc: {
                type: 'string',
                description: 'Type: final ou draft',
                enum: ['final', 'draft']
              }
            }
          }
        },
        {
          name: 'delete_invoice',
          description: 'Supprimer une facture brouillon',
          inputSchema: {
            type: 'object',
            required: ['invoice_id'],
            properties: {
              invoice_id: {
                type: 'number',
                description: 'ID de la facture à supprimer'
              }
            }
          }
        },
        {
          name: 'upload_invoice_file',
          description: 'Ajouter un fichier à une facture',
          inputSchema: {
            type: 'object',
            required: ['invoice_id', 'filename'],
            properties: {
              invoice_id: {
                type: 'number',
                description: 'ID de la facture'
              },
              filename: {
                type: 'string',
                description: 'Nom du fichier'
              },
              visible: {
                type: 'number',
                description: 'Visible client (0 ou 1)',
                enum: [0, 1]
              }
            }
          }
        },
        {
          name: 'list_invoice_settlements',
          description: 'Liste des règlements partiels d\'une facture',
          inputSchema: {
            type: 'object',
            required: ['invoice_id'],
            properties: {
              invoice_id: {
                type: 'number',
                description: 'ID de la facture'
              }
            }
          }
        },
        {
          name: 'create_settlement',
          description: 'Enregistrer un règlement partiel',
          inputSchema: {
            type: 'object',
            required: ['invoice_id', 'total', 'payment_mode', 'paid_on'],
            properties: {
              invoice_id: {
                type: 'number',
                description: 'ID de la facture'
              },
              total: {
                type: 'number',
                description: 'Montant du règlement'
              },
              payment_mode: {
                type: 'number',
                description: 'Mode de paiement'
              },
              paid_on: {
                type: 'string',
                description: 'Date de paiement (YYYY-MM-DD)'
              },
              payment_ref: {
                type: 'string',
                description: 'Référence de paiement'
              }
            }
          }
        },
        {
          name: 'get_settlement',
          description: 'Détails d\'un règlement spécifique',
          inputSchema: {
            type: 'object',
            required: ['invoice_id', 'settlement_id'],
            properties: {
              invoice_id: {
                type: 'number',
                description: 'ID de la facture'
              },
              settlement_id: {
                type: 'number',
                description: 'ID du règlement'
              }
            }
          }
        },
        {
          name: 'delete_settlement',
          description: 'Supprimer un règlement',
          inputSchema: {
            type: 'object',
            required: ['invoice_id', 'settlement_id'],
            properties: {
              invoice_id: {
                type: 'number',
                description: 'ID de la facture'
              },
              settlement_id: {
                type: 'number',
                description: 'ID du règlement à supprimer'
              }
            }
          }
        },
        {
          name: 'create_invoice',
          description: 'Créer facture directe (sans devis préalable)',
          inputSchema: {
            type: 'object',
            required: ['customer_id'],
            properties: {
              customer_id: {
                type: 'number',
                description: 'ID du client'
              },
              title: {
                type: 'string',
                description: 'Objet de la facture'
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
              },
              invoiced_on: {
                type: 'string',
                description: 'Date de facturation (YYYY-MM-DD)'
              }
            }
          }
        },
        {
          name: 'update_invoice',
          description: 'Modifier facture existante',
          inputSchema: {
            type: 'object',
            required: ['invoice_id'],
            properties: {
              invoice_id: {
                type: 'number',
                description: 'ID de la facture à modifier'
              },
              title: {
                type: 'string',
                description: 'Nouvel objet de la facture'
              },
              pay_before: {
                type: 'string',
                description: 'Nouveau délai de paiement'
              },
              due_on: {
                type: 'string',
                description: 'Nouvelle date d\'échéance (YYYY-MM-DD)'
              }
            }
          }
        },
        {
          name: 'download_invoice_pdf',
          description: 'Télécharger PDF de facture',
          inputSchema: {
            type: 'object',
            required: ['invoice_id'],
            properties: {
              invoice_id: {
                type: 'number',
                description: 'ID de la facture'
              },
              type: {
                type: 'string',
                description: 'Type de PDF ("invoice" ou "acquitted")',
                enum: ['invoice', 'acquitted'],
                default: 'invoice'
              }
            }
          }
        },
        {
          name: 'create_invoice_refund',
          description: 'Créer avoir sur facture',
          inputSchema: {
            type: 'object',
            required: ['invoice_id'],
            properties: {
              invoice_id: {
                type: 'number',
                description: 'ID de la facture à rembourser'
              },
              title: {
                type: 'string',
                description: 'Objet de l\'avoir'
              },
              refund_amount: {
                type: 'number',
                description: 'Montant du remboursement'
              },
              refund_date: {
                type: 'string',
                description: 'Date du remboursement (YYYY-MM-DD)'
              }
            }
          }
        },

        // === MODULE PRODUITS ===
        {
          name: 'list_products',
          description: 'Liste des produits du catalogue',
          inputSchema: {
            type: 'object',
            properties: {
              page: {
                type: 'number',
                description: 'Numéro de page (par défaut: 1)'
              },
              ref: {
                type: 'string',
                description: 'Recherche par référence'
              },
              title: {
                type: 'string',
                description: 'Recherche par libellé'
              }
            }
          }
        },
        {
          name: 'create_product',
          description: 'Créer un nouveau produit',
          inputSchema: {
            type: 'object',
            required: ['ref', 'title', 'unit_price', 'vat'],
            properties: {
              ref: {
                type: 'string',
                description: 'Référence produit'
              },
              title: {
                type: 'string',
                description: 'Libellé du produit'
              },
              unit_price: {
                type: 'number',
                description: 'Prix unitaire HT'
              },
              vat: {
                type: 'number',
                description: 'Taux de TVA (ex: 0.2 pour 20%)'
              },
              measure: {
                type: 'string',
                description: 'Unité de mesure'
              },
              category_id: {
                type: 'number',
                description: 'ID de la catégorie'
              },
              notes: {
                type: 'string',
                description: 'Notes sur le produit'
              }
            }
          }
        },
        {
          name: 'get_product',
          description: 'Détails d\'un produit',
          inputSchema: {
            type: 'object',
            required: ['product_id'],
            properties: {
              product_id: {
                type: 'number',
                description: 'ID du produit'
              }
            }
          }
        },
        {
          name: 'update_product',
          description: 'Modifier un produit',
          inputSchema: {
            type: 'object',
            required: ['product_id'],
            properties: {
              product_id: {
                type: 'number',
                description: 'ID du produit'
              },
              ref: {
                type: 'string',
                description: 'Nouvelle référence'
              },
              title: {
                type: 'string',
                description: 'Nouveau libellé'
              },
              unit_price: {
                type: 'number',
                description: 'Nouveau prix HT'
              },
              vat: {
                type: 'number',
                description: 'Nouveau taux TVA'
              },
              notes: {
                type: 'string',
                description: 'Nouvelles notes'
              }
            }
          }
        },
        {
          name: 'delete_product',
          description: 'Supprimer un produit',
          inputSchema: {
            type: 'object',
            required: ['product_id'],
            properties: {
              product_id: {
                type: 'number',
                description: 'ID du produit à supprimer'
              }
            }
          }
        },

        // === MODULE FOURNISSEURS (outils 32-35) ===
        {
          name: 'list_suppliers',
          description: 'Lister fournisseurs avec filtres avancés',
          inputSchema: {
            type: 'object',
            properties: {
              company: {
                type: 'string',
                description: 'Recherche partielle sur société'
              },
              category_id: {
                type: 'number',
                description: 'Filtrer par catégorie'
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
          name: 'create_supplier',
          description: 'Créer nouveau fournisseur',
          inputSchema: {
            type: 'object',
            required: ['company_name'],
            properties: {
              company_name: {
                type: 'string',
                description: 'Nom société fournisseur'
              },
              email: {
                type: 'string',
                description: 'Email fournisseur'
              },
              phone: {
                type: 'string',
                description: 'Téléphone fournisseur'
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
                description: 'Pays',
                default: 'FR'
              }
            }
          }
        },
        {
          name: 'get_supplier',
          description: 'Détails fournisseur',
          inputSchema: {
            type: 'object',
            required: ['supplier_id'],
            properties: {
              supplier_id: {
                type: 'number',
                description: 'ID du fournisseur'
              }
            }
          }
        },
        {
          name: 'update_supplier',
          description: 'Modifier fournisseur existant',
          inputSchema: {
            type: 'object',
            required: ['supplier_id'],
            properties: {
              supplier_id: {
                type: 'number',
                description: 'ID fournisseur à modifier'
              },
              company_name: {
                type: 'string',
                description: 'Nouveau nom société'
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
              }
            }
          }
        },
        {
          name: 'delete_supplier',
          description: 'Supprimer fournisseur',
          inputSchema: {
            type: 'object',
            required: ['supplier_id'],
            properties: {
              supplier_id: {
                type: 'number',
                description: 'ID fournisseur à supprimer'
              }
            }
          }
        },

        // === MODULE ACHATS ===
        {
          name: 'list_purchases',
          description: 'Liste des achats avec filtres et pagination',
          inputSchema: {
            type: 'object',
            properties: {
              page: {
                type: 'number',
                description: 'Numéro de page (par défaut: 1)'
              },
              supplier_id: {
                type: 'number',
                description: 'Filtrer par fournisseur'
              },
              period_start: {
                type: 'string',
                description: 'Période début (YYYY-MM-DD)'
              },
              period_end: {
                type: 'string',
                description: 'Période fin (YYYY-MM-DD)'
              }
            }
          }
        },
        {
          name: 'create_purchase',
          description: 'Créer un nouvel achat',
          inputSchema: {
            type: 'object',
            required: ['supplier_id', 'title'],
            properties: {
              supplier_id: {
                type: 'number',
                description: 'ID du fournisseur'
              },
              title: {
                type: 'string',
                description: 'Objet de l\'achat'
              },
              invoiced_on: {
                type: 'string',
                description: 'Date d\'achat (YYYY-MM-DD)'
              },
              total: {
                type: 'number',
                description: 'Montant total HT'
              },
              vat_amount: {
                type: 'number',
                description: 'Montant TVA'
              },
              items: {
                type: 'array',
                description: 'Lignes d\'achat',
                items: {
                  type: 'object',
                  required: ['title', 'quantity', 'unit_price', 'vat'],
                  properties: {
                    title: { type: 'string' },
                    quantity: { type: 'number' },
                    unit_price: { type: 'number' },
                    vat: { type: 'number' }
                  }
                }
              }
            }
          }
        },
        {
          name: 'get_purchase',
          description: 'Détails d\'un achat',
          inputSchema: {
            type: 'object',
            required: ['purchase_id'],
            properties: {
              purchase_id: {
                type: 'number',
                description: 'ID de l\'achat'
              }
            }
          }
        },
        {
          name: 'update_purchase',
          description: 'Modifier un achat',
          inputSchema: {
            type: 'object',
            required: ['purchase_id'],
            properties: {
              purchase_id: {
                type: 'number',
                description: 'ID de l\'achat'
              },
              title: {
                type: 'string',
                description: 'Nouvel objet'
              },
              total: {
                type: 'number',
                description: 'Nouveau montant HT'
              },
              vat_amount: {
                type: 'number',
                description: 'Nouveau montant TVA'
              }
            }
          }
        },
        {
          name: 'delete_purchase',
          description: 'Supprimer un achat',
          inputSchema: {
            type: 'object',
            required: ['purchase_id'],
            properties: {
              purchase_id: {
                type: 'number',
                description: 'ID de l\'achat à supprimer'
              }
            }
          }
        },
        {
          name: 'upload_purchase_file',
          description: 'Ajouter un fichier à un achat',
          inputSchema: {
            type: 'object',
            required: ['purchase_id', 'filename'],
            properties: {
              purchase_id: {
                type: 'number',
                description: 'ID de l\'achat'
              },
              filename: {
                type: 'string',
                description: 'Nom du fichier'
              }
            }
          }
        },

        // === MODULE COMPTE ===
        {
          name: 'get_account',
          description: 'Obtenir les informations du compte utilisateur',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        },
        {
          name: 'list_subscription_orders',
          description: 'Liste des factures d\'abonnement payées',
          inputSchema: {
            type: 'object',
            properties: {}
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

        // === MODULE DEVIS - BASIQUES ===
        case 'list_quotes':
          return await this.handleListQuotes(request.params.arguments);
        case 'get_quote':
          return await this.handleGetQuote(request.params.arguments);
        case 'create_quote':
          return await this.handleCreateQuote(request.params.arguments);
        case 'update_quote':
          return await this.handleUpdateQuote(request.params.arguments);
        case 'delete_quote':
          return await this.handleDeleteQuote(request.params.arguments);
        case 'download_quote_pdf':
          return await this.handleDownloadQuotePdf(request.params.arguments);
        case 'convert_quote_to_invoice':
          return await this.handleConvertQuoteToInvoice(request.params.arguments);

        // === MODULE CATEGORIES ===
        case 'list_categories':
          return await this.handleListCategories(request.params.arguments);
        case 'create_category':
          return await this.handleCreateCategory(request.params.arguments);
        case 'update_category':
          return await this.handleUpdateCategory(request.params.arguments);
        case 'delete_category':
          return await this.handleDeleteCategory(request.params.arguments);

        // === MODULE DEVIS COMPLET ===
        case 'update_quote_status':
          return await this.handleUpdateQuoteStatus(request.params.arguments);
        case 'upload_quote_file':
          return await this.handleUploadQuoteFile(request.params.arguments);
        case 'send_quote_email':
          return await this.handleSendQuoteEmail(request.params.arguments);

        // === MODULE FACTURES COMPLET ===
        case 'list_invoices':
          return await this.handleListInvoices(request.params.arguments);
        case 'get_invoice':
          return await this.handleGetInvoice(request.params.arguments);
        case 'create_invoice':
          return await this.handleCreateInvoice(request.params.arguments);
        case 'update_invoice':
          return await this.handleUpdateInvoice(request.params.arguments);
        case 'delete_invoice':
          return await this.handleDeleteInvoice(request.params.arguments);
        case 'upload_invoice_file':
          return await this.handleUploadInvoiceFile(request.params.arguments);
        case 'download_invoice_pdf':
          return await this.handleDownloadInvoicePdf(request.params.arguments);
        case 'create_invoice_refund':
          return await this.handleCreateInvoiceRefund(request.params.arguments);
        case 'list_invoice_settlements':
          return await this.handleListInvoiceSettlements(request.params.arguments);
        case 'create_settlement':
          return await this.handleCreateSettlement(request.params.arguments);
        case 'get_settlement':
          return await this.handleGetSettlement(request.params.arguments);
        case 'delete_settlement':
          return await this.handleDeleteSettlement(request.params.arguments);

        // === MODULE PRODUITS ===
        case 'list_products':
          return await this.handleListProducts(request.params.arguments);
        case 'create_product':
          return await this.handleCreateProduct(request.params.arguments);
        case 'get_product':
          return await this.handleGetProduct(request.params.arguments);
        case 'update_product':
          return await this.handleUpdateProduct(request.params.arguments);
        case 'delete_product':
          return await this.handleDeleteProduct(request.params.arguments);

        // === MODULE FOURNISSEURS ===
        case 'list_suppliers':
          return await this.handleListSuppliers(request.params.arguments);
        case 'create_supplier':
          return await this.handleCreateSupplier(request.params.arguments);
        case 'get_supplier':
          return await this.handleGetSupplier(request.params.arguments);
        case 'update_supplier':
          return await this.handleUpdateSupplier(request.params.arguments);
        case 'delete_supplier':
          return await this.handleDeleteSupplier(request.params.arguments);

        // === MODULE ACHATS ===
        case 'list_purchases':
          return await this.handleListPurchases(request.params.arguments);
        case 'create_purchase':
          return await this.handleCreatePurchase(request.params.arguments);
        case 'get_purchase':
          return await this.handleGetPurchase(request.params.arguments);
        case 'update_purchase':
          return await this.handleUpdatePurchase(request.params.arguments);
        case 'delete_purchase':
          return await this.handleDeletePurchase(request.params.arguments);
        case 'upload_purchase_file':
          return await this.handleUploadPurchaseFile(request.params.arguments);

        // === MODULE COMPTE ===
        case 'get_account':
          return await this.handleGetAccount(request.params.arguments);
        case 'list_subscription_orders':
          return await this.handleListSubscriptionOrders(request.params.arguments);

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
    const customerData: any = {
      company_name: args.company_name,
      individual: args.individual || false,
      email: args.email || null,
      phone: args.phone || null,
      street: args.street || null,
      city: args.city || null,
      zip_code: args.zip_code || null,
      country: args.country || 'FR'
    };

    // Les champs de contact peuvent être utilisés pour tous les types de clients
    // Pour particuliers: OBLIGATOIRES
    // Pour professionnels: FACULTATIFS (personne de contact)
    if (args.first_name) customerData.first_name = args.first_name;
    if (args.last_name) customerData.last_name = args.last_name;
    if (args.civility) customerData.civility = args.civility;

    // Pour les particuliers, company_name doit être vide
    if (args.individual && customerData.company_name === undefined) {
      customerData.company_name = '';
    }

    const response = await this.apiClient.post(`/firms/${FIRM_ID}/customers.json`, customerData);

    return {
      content: [
        {
          type: 'text',
          text: `SUCCESS: Client créé avec succès\n${JSON.stringify(response.data, null, 2)}`,
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
    if (args.company_name !== undefined) customerData.company_name = args.company_name;
    if (args.first_name !== undefined) customerData.first_name = args.first_name;
    if (args.last_name !== undefined) customerData.last_name = args.last_name;
    if (args.individual !== undefined) customerData.individual = args.individual;
    if (args.civility !== undefined) customerData.civility = args.civility;
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
          text: `SUCCESS: Client ${args.customer_id} modifié avec succès\n${JSON.stringify(response.data, null, 2)}`,
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
          text: `SUCCESS: Client ${args.customer_id} supprimé avec succès`,
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
          text: `SUCCESS: Client ${args.customer_id} archivé avec succès`,
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
          text: `SUCCESS: Client ${args.customer_id} restauré avec succès`,
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
          text: `SUCCESS: Fichier ajouté au client ${args.customer_id}\n${JSON.stringify(response.data, null, 2)}`,
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
          text: `SUCCESS: Catégorie créée avec succès\n${JSON.stringify(response.data, null, 2)}`,
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
          text: `SUCCESS: Catégorie ${args.category_id} modifiée avec succès\n${JSON.stringify(response.data, null, 2)}`,
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
          text: `SUCCESS: Catégorie ${args.category_id} supprimée avec succès`,
        }
      ]
    };
  }

  // === MODULE FOURNISSEURS ===
  private async handleListSuppliers(args: any) {
    const params: any = { page: args.page || 1 };
    if (args.company) params.company = args.company;
    if (args.category_id) params.category_id = args.category_id;

    const response = await this.apiClient.get(`/firms/${FIRM_ID}/suppliers.json`, { params });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        }
      ]
    };
  }

  private async handleCreateSupplier(args: any) {
    const supplierData = {
      company_name: args.company_name,
      email: args.email || null,
      phone: args.phone || null,
      street: args.street || null,
      city: args.city || null,
      zip_code: args.zip_code || null,
      country: args.country || 'FR'
    };

    const response = await this.apiClient.post(`/firms/${FIRM_ID}/suppliers.json`, supplierData);

    return {
      content: [
        {
          type: 'text',
          text: `SUCCESS: Fournisseur créé avec succès\n${JSON.stringify(response.data, null, 2)}`,
        }
      ]
    };
  }

  private async handleGetSupplier(args: any) {
    const response = await this.apiClient.get(`/firms/${FIRM_ID}/suppliers/${args.supplier_id}.json`);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response.data, null, 2),
        }
      ]
    };
  }

  private async handleUpdateSupplier(args: any) {
    const supplierData: any = {};
    if (args.company_name) supplierData.company_name = args.company_name;
    if (args.email !== undefined) supplierData.email = args.email;
    if (args.phone !== undefined) supplierData.phone = args.phone;
    if (args.street !== undefined) supplierData.street = args.street;
    if (args.city !== undefined) supplierData.city = args.city;
    if (args.zip_code !== undefined) supplierData.zip_code = args.zip_code;
    if (args.country !== undefined) supplierData.country = args.country;

    const response = await this.apiClient.patch(`/firms/${FIRM_ID}/suppliers/${args.supplier_id}.json`, supplierData);

    return {
      content: [
        {
          type: 'text',
          text: `SUCCESS: Fournisseur ${args.supplier_id} modifié avec succès\n${JSON.stringify(response.data, null, 2)}`,
        }
      ]
    };
  }

  private async handleDeleteSupplier(args: any) {
    await this.apiClient.delete(`/firms/${FIRM_ID}/suppliers/${args.supplier_id}.json`);

    return {
      content: [
        {
          type: 'text',
          text: `SUCCESS: Fournisseur ${args.supplier_id} supprimé avec succès`,
        }
      ]
    };
  }

  // === MODULE DEVIS - BASIQUES ===
  private async handleListQuotes(args: any) {
    const params: any = {};
    if (args.page) params.page = args.page;
    if (args.with_details !== undefined) params.with_details = args.with_details;
    if (args.customer_id) params.customer_id = args.customer_id;
    if (args.status) params.status = args.status;
    if (args.period_start) params.period_start = args.period_start;
    if (args.period_end) params.period_end = args.period_end;

    const response = await this.apiClient.get(`/firms/${FIRM_ID}/quotes.json`, { params });

    return {
      content: [
        {
          type: 'text',
          text: `SUCCESS: Liste des devis\nTotal: ${response.data.length} devis\n${JSON.stringify(response.data, null, 2)}`,
        }
      ]
    };
  }

  private async handleGetQuote(args: any) {
    const response = await this.apiClient.get(`/firms/${FIRM_ID}/quotes/${args.quote_id}.json`);

    return {
      content: [
        {
          type: 'text',
          text: `SUCCESS: Détails du devis ${args.quote_id}\n${JSON.stringify(response.data, null, 2)}`,
        }
      ]
    };
  }

  private async handleCreateQuote(args: any) {
    const quoteData = {
      customer_id: args.customer_id,
      title: args.title,
      invoiced_on: args.invoiced_on,
      term_on: args.term_on,
      pay_before: args.pay_before || '30',
      currency: args.currency || 'EUR',
      language: args.language || 'fr',
      items: args.items || []
    };

    const response = await this.apiClient.post(`/firms/${FIRM_ID}/quotes.json`, quoteData);

    return {
      content: [
        {
          type: 'text',
          text: `SUCCESS: Devis créé avec succès\nRéférence: ${response.data.quote_ref}\n${JSON.stringify(response.data, null, 2)}`,
        }
      ]
    };
  }

  private async handleUpdateQuote(args: any) {
    const quoteData: any = {};
    if (args.customer_id) quoteData.customer_id = args.customer_id;
    if (args.title) quoteData.title = args.title;
    if (args.penalty) quoteData.penalty = args.penalty;
    if (args.information) quoteData.information = args.information;
    if (args.quote_status !== undefined) quoteData.quote_status = args.quote_status;
    if (args.items) quoteData.items = args.items;

    const response = await this.apiClient.patch(`/firms/${FIRM_ID}/quotes/${args.quote_id}.json`, quoteData);

    return {
      content: [
        {
          type: 'text',
          text: `SUCCESS: Devis ${args.quote_id} modifié avec succès\n${JSON.stringify(response.data, null, 2)}`,
        }
      ]
    };
  }

  private async handleDeleteQuote(args: any) {
    await this.apiClient.delete(`/firms/${FIRM_ID}/quotes/${args.quote_id}.json`);

    return {
      content: [
        {
          type: 'text',
          text: `SUCCESS: Devis ${args.quote_id} supprimé avec succès`,
        }
      ]
    };
  }

  private async handleDownloadQuotePdf(args: any) {
    const params: any = {};
    if (args.proforma) params.proforma = args.proforma;

    const response = await this.apiClient.get(`/firms/${FIRM_ID}/quotes/${args.quote_id}.pdf`, {
      params,
      responseType: 'arraybuffer'
    });

    return {
      content: [
        {
          type: 'text',
          text: `SUCCESS: PDF du devis ${args.quote_id} téléchargé (${response.data.byteLength} octets)`,
        }
      ]
    };
  }

  private async handleConvertQuoteToInvoice(args: any) {
    const response = await this.apiClient.post(`/firms/${FIRM_ID}/quotes/${args.quote_id}/to_invoice.json`);

    return {
      content: [
        {
          type: 'text',
          text: `SUCCESS: Devis ${args.quote_id} converti en facture\nFacture créée: ${response.data.invoice_ref}\n${JSON.stringify(response.data, null, 2)}`,
        }
      ]
    };
  }

  // === MODULE DEVIS COMPLET ===
  private async handleUpdateQuoteStatus(args: any) {
    const response = await this.apiClient.patch(`/firms/${FIRM_ID}/quotes/${args.quote_id}.json`, {
      quote_status: args.status
    });

    return {
      content: [
        {
          type: 'text',
          text: `SUCCESS: Statut devis ${args.quote_id} modifié à ${args.status === 0 ? 'Brouillon' : args.status === 1 ? 'Accepté' : 'Refusé'}\n${JSON.stringify(response.data, null, 2)}`,
        }
      ]
    };
  }

  private async handleUploadQuoteFile(args: any) {
    const formData = new FormData();
    formData.append('upload_file', args.file_data);
    formData.append('filename', args.filename);

    const response = await this.apiClient.post(`/firms/${FIRM_ID}/quotes/${args.quote_id}/upload.json`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return {
      content: [
        {
          type: 'text',
          text: `SUCCESS: Fichier ajouté au devis ${args.quote_id}\n${JSON.stringify(response.data, null, 2)}`,
        }
      ]
    };
  }

  private async handleSendQuoteEmail(args: any) {
    const emailData = {
      email: args.email,
      subject: args.subject || `Devis - ${new Date().toLocaleDateString()}`,
      message: args.message || 'Veuillez trouver ci-joint notre devis.'
    };

    const response = await this.apiClient.post(`/firms/${FIRM_ID}/quotes/${args.quote_id}/email.json`, emailData);

    return {
      content: [
        {
          type: 'text',
          text: `SUCCESS: Devis ${args.quote_id} envoyé à ${args.email} avec succès\n${JSON.stringify(response.data, null, 2)}`,
        }
      ]
    };
  }

  // === MODULE FACTURES COMPLET ===
  private async handleListInvoices(args: any) {
    const params: any = {};
    if (args.page) params.page = args.page;
    if (args.with_details !== undefined) params.with_details = args.with_details;
    if (args.with_settlements !== undefined) params.with_settlements = args.with_settlements;
    if (args.customer_id) params.customer_id = args.customer_id;
    if (args.bill_type) params.bill_type = args.bill_type;
    if (args.period_start) params.period_start = args.period_start;
    if (args.period_end) params.period_end = args.period_end;

    const response = await this.apiClient.get(`/firms/${FIRM_ID}/invoices.json`, { params });

    return {
      content: [
        {
          type: 'text',
          text: `SUCCESS: Liste des factures\nTotal: ${response.data.length} factures\n${JSON.stringify(response.data, null, 2)}`,
        }
      ]
    };
  }

  private async handleGetInvoice(args: any) {
    const params: any = {};
    if (args.type_doc) params.type_doc = args.type_doc;

    const response = await this.apiClient.get(`/firms/${FIRM_ID}/invoices/${args.invoice_id}.json`, { params });

    return {
      content: [
        {
          type: 'text',
          text: `SUCCESS: Détails de la facture ${args.invoice_id}\n${JSON.stringify(response.data, null, 2)}`,
        }
      ]
    };
  }

  private async handleCreateInvoice(args: any) {
    const invoiceData = {
      customer_id: args.customer_id,
      title: args.title,
      items: args.items,
      pay_before: args.pay_before || '30',
      invoiced_on: args.invoiced_on,
      language: 'fr',
      currency: 'EUR'
    };

    const response = await this.apiClient.post(`/firms/${FIRM_ID}/invoices.json`, invoiceData);

    return {
      content: [
        {
          type: 'text',
          text: `SUCCESS: Facture créée avec succès\nRéférence: ${response.data.invoice_ref}\n${JSON.stringify(response.data, null, 2)}`,
        }
      ]
    };
  }

  private async handleUpdateInvoice(args: any) {
    const invoiceData: any = {};
    if (args.title) invoiceData.title = args.title;
    if (args.pay_before) invoiceData.pay_before = args.pay_before;
    if (args.due_on) invoiceData.due_on = args.due_on;

    const response = await this.apiClient.patch(`/firms/${FIRM_ID}/invoices/${args.invoice_id}.json`, invoiceData);

    return {
      content: [
        {
          type: 'text',
          text: `SUCCESS: Facture ${args.invoice_id} modifiée avec succès\n${JSON.stringify(response.data, null, 2)}`,
        }
      ]
    };
  }

  private async handleDeleteInvoice(args: any) {
    await this.apiClient.delete(`/firms/${FIRM_ID}/invoices/${args.invoice_id}.json`);

    return {
      content: [
        {
          type: 'text',
          text: `SUCCESS: Facture ${args.invoice_id} supprimée avec succès`,
        }
      ]
    };
  }

  private async handleUploadInvoiceFile(args: any) {
    const formData = new FormData();
    formData.append('filename', args.filename);
    if (args.visible !== undefined) formData.append('visible', args.visible.toString());

    const response = await this.apiClient.post(`/firms/${FIRM_ID}/invoices/${args.invoice_id}/upload.json`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return {
      content: [
        {
          type: 'text',
          text: `SUCCESS: Fichier ajouté à la facture ${args.invoice_id}\n${JSON.stringify(response.data, null, 2)}`,
        }
      ]
    };
  }

  private async handleDownloadInvoicePdf(args: any) {
    const response = await this.apiClient.get(`/firms/${FIRM_ID}/invoices/${args.invoice_id}/pdf.json`, {
      params: { type: args.type || 'invoice' },
      responseType: 'arraybuffer'
    });

    // Convertir en base64 pour transmission
    const base64Pdf = Buffer.from(response.data).toString('base64');

    return {
      content: [
        {
          type: 'text',
          text: `SUCCESS: PDF facture ${args.invoice_id} généré (${args.type || 'invoice'})\nBase64: ${base64Pdf.substring(0, 100)}...`,
        }
      ]
    };
  }

  private async handleCreateInvoiceRefund(args: any) {
    const refundData = {
      title: args.title,
      refund_amount: args.refund_amount,
      refund_date: args.refund_date
    };

    const response = await this.apiClient.post(`/firms/${FIRM_ID}/invoices/${args.invoice_id}/refund.json`, refundData);

    return {
      content: [
        {
          type: 'text',
          text: `SUCCESS: Avoir créé sur facture ${args.invoice_id}\nMontant: ${args.refund_amount}€\n${JSON.stringify(response.data, null, 2)}`,
        }
      ]
    };
  }

  private async handleListInvoiceSettlements(args: any) {
    const response = await this.apiClient.get(`/firms/${FIRM_ID}/invoices/${args.invoice_id}/settlements.json`);

    return {
      content: [
        {
          type: 'text',
          text: `SUCCESS: Liste des règlements de la facture ${args.invoice_id}\n${JSON.stringify(response.data, null, 2)}`,
        }
      ]
    };
  }

  private async handleCreateSettlement(args: any) {
    const settlementData = {
      total: args.total,
      payment_mode: args.payment_mode,
      paid_on: args.paid_on,
      payment_ref: args.payment_ref
    };

    const response = await this.apiClient.post(`/firms/${FIRM_ID}/invoices/${args.invoice_id}/settlements.json`, settlementData);

    return {
      content: [
        {
          type: 'text',
          text: `SUCCESS: Règlement enregistré pour la facture ${args.invoice_id}\nMontant: ${args.total}€\n${JSON.stringify(response.data, null, 2)}`,
        }
      ]
    };
  }

  private async handleGetSettlement(args: any) {
    const response = await this.apiClient.get(`/firms/${FIRM_ID}/invoices/${args.invoice_id}/settlements/${args.settlement_id}.json`);

    return {
      content: [
        {
          type: 'text',
          text: `SUCCESS: Détails du règlement ${args.settlement_id}\n${JSON.stringify(response.data, null, 2)}`,
        }
      ]
    };
  }

  private async handleDeleteSettlement(args: any) {
    await this.apiClient.delete(`/firms/${FIRM_ID}/invoices/${args.invoice_id}/settlements/${args.settlement_id}.json`);

    return {
      content: [
        {
          type: 'text',
          text: `SUCCESS: Règlement ${args.settlement_id} supprimé de la facture ${args.invoice_id}`,
        }
      ]
    };
  }

  // === MODULE PRODUITS ===
  private async handleListProducts(args: any) {
    const params: any = {};
    if (args.page) params.page = args.page;
    if (args.ref) params.ref = args.ref;
    if (args.title) params.title = args.title;

    const response = await this.apiClient.get(`/firms/${FIRM_ID}/products.json`, { params });

    return {
      content: [
        {
          type: 'text',
          text: `SUCCESS: Liste des produits\nTotal: ${response.data.length} produits\n${JSON.stringify(response.data, null, 2)}`,
        }
      ]
    };
  }

  private async handleCreateProduct(args: any) {
    const productData = {
      ref: args.ref,
      title: args.title,
      unit_price: args.unit_price,
      vat: args.vat,
      measure: args.measure,
      category_id: args.category_id,
      notes: args.notes
    };

    const response = await this.apiClient.post(`/firms/${FIRM_ID}/products.json`, productData);

    return {
      content: [
        {
          type: 'text',
          text: `SUCCESS: Produit créé avec succès\nRéf: ${args.ref}\n${JSON.stringify(response.data, null, 2)}`,
        }
      ]
    };
  }

  private async handleGetProduct(args: any) {
    const response = await this.apiClient.get(`/firms/${FIRM_ID}/products/${args.product_id}.json`);

    return {
      content: [
        {
          type: 'text',
          text: `SUCCESS: Détails du produit ${args.product_id}\n${JSON.stringify(response.data, null, 2)}`,
        }
      ]
    };
  }

  private async handleUpdateProduct(args: any) {
    const productData: any = {};
    if (args.ref) productData.ref = args.ref;
    if (args.title) productData.title = args.title;
    if (args.unit_price !== undefined) productData.unit_price = args.unit_price;
    if (args.vat !== undefined) productData.vat = args.vat;
    if (args.notes) productData.notes = args.notes;

    const response = await this.apiClient.patch(`/firms/${FIRM_ID}/products/${args.product_id}.json`, productData);

    return {
      content: [
        {
          type: 'text',
          text: `SUCCESS: Produit ${args.product_id} modifié avec succès\n${JSON.stringify(response.data, null, 2)}`,
        }
      ]
    };
  }

  private async handleDeleteProduct(args: any) {
    await this.apiClient.delete(`/firms/${FIRM_ID}/products/${args.product_id}.json`);

    return {
      content: [
        {
          type: 'text',
          text: `SUCCESS: Produit ${args.product_id} supprimé avec succès`,
        }
      ]
    };
  }

  // === MODULE ACHATS ===
  private async handleListPurchases(args: any) {
    const params: any = {};
    if (args.page) params.page = args.page;
    if (args.supplier_id) params.supplier_id = args.supplier_id;
    if (args.period_start) params.period_start = args.period_start;
    if (args.period_end) params.period_end = args.period_end;

    const response = await this.apiClient.get(`/firms/${FIRM_ID}/purchases.json`, { params });

    return {
      content: [
        {
          type: 'text',
          text: `SUCCESS: Liste des achats\nTotal: ${response.data.length} achats\n${JSON.stringify(response.data, null, 2)}`,
        }
      ]
    };
  }

  private async handleCreatePurchase(args: any) {
    const purchaseData = {
      supplier_id: args.supplier_id,
      title: args.title,
      invoiced_on: args.invoiced_on,
      total: args.total,
      vat_amount: args.vat_amount,
      items: args.items
    };

    const response = await this.apiClient.post(`/firms/${FIRM_ID}/purchases.json`, purchaseData);

    return {
      content: [
        {
          type: 'text',
          text: `SUCCESS: Achat créé avec succès\n${JSON.stringify(response.data, null, 2)}`,
        }
      ]
    };
  }

  private async handleGetPurchase(args: any) {
    const response = await this.apiClient.get(`/firms/${FIRM_ID}/purchases/${args.purchase_id}.json`);

    return {
      content: [
        {
          type: 'text',
          text: `SUCCESS: Détails de l'achat ${args.purchase_id}\n${JSON.stringify(response.data, null, 2)}`,
        }
      ]
    };
  }

  private async handleUpdatePurchase(args: any) {
    const purchaseData: any = {};
    if (args.title) purchaseData.title = args.title;
    if (args.total !== undefined) purchaseData.total = args.total;
    if (args.vat_amount !== undefined) purchaseData.vat_amount = args.vat_amount;

    const response = await this.apiClient.patch(`/firms/${FIRM_ID}/purchases/${args.purchase_id}.json`, purchaseData);

    return {
      content: [
        {
          type: 'text',
          text: `SUCCESS: Achat ${args.purchase_id} modifié avec succès\n${JSON.stringify(response.data, null, 2)}`,
        }
      ]
    };
  }

  private async handleDeletePurchase(args: any) {
    await this.apiClient.delete(`/firms/${FIRM_ID}/purchases/${args.purchase_id}.json`);

    return {
      content: [
        {
          type: 'text',
          text: `SUCCESS: Achat ${args.purchase_id} supprimé avec succès`,
        }
      ]
    };
  }

  private async handleUploadPurchaseFile(args: any) {
    const formData = new FormData();
    formData.append('filename', args.filename);

    const response = await this.apiClient.post(`/firms/${FIRM_ID}/purchases/${args.purchase_id}/upload.json`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return {
      content: [
        {
          type: 'text',
          text: `SUCCESS: Fichier ajouté à l'achat ${args.purchase_id}\n${JSON.stringify(response.data, null, 2)}`,
        }
      ]
    };
  }

  // === MODULE COMPTE ===
  private async handleGetAccount(args: any) {
    const response = await this.apiClient.get('/account.json');

    return {
      content: [
        {
          type: 'text',
          text: `SUCCESS: Informations du compte\n${JSON.stringify(response.data, null, 2)}`,
        }
      ]
    };
  }

  private async handleListSubscriptionOrders(args: any) {
    const response = await this.apiClient.get(`/firms/${FIRM_ID}/orders.json`);

    return {
      content: [
        {
          type: 'text',
          text: `SUCCESS: Commandes d'abonnement\n${JSON.stringify(response.data, null, 2)}`,
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
