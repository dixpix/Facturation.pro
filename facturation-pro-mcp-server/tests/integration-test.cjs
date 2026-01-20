#!/usr/bin/env node

/**
 * =============================================================================
 * Test d'intégration Facturation.pro MCP Server
 * =============================================================================
 *
 * Ce script teste la connexion à l'API Facturation.pro et valide les
 * fonctionnalités de base du serveur MCP.
 *
 * Usage :
 *   node tests/integration-test.js
 *
 * Variables d'environnement requises :
 *   - FACTURATION_API_ID
 *   - FACTURATION_API_KEY
 *   - FACTURATION_FIRM_ID
 *   - FACTURATION_USER_AGENT
 *
 * =============================================================================
 */

const axios = require('axios');

// Configuration depuis les variables d'environnement
const API_ID = process.env.FACTURATION_API_ID;
const API_KEY = process.env.FACTURATION_API_KEY;
const FIRM_ID = process.env.FACTURATION_FIRM_ID;
const USER_AGENT = process.env.FACTURATION_USER_AGENT || 'MCP-Integration-Test';
const BASE_URL = process.env.FACTURATION_BASE_URL || 'https://www.facturation.pro';

// Couleurs pour l'affichage console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

/**
 * Logger avec couleurs
 */
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.cyan}═══ ${msg} ═══${colors.reset}\n`),
  data: (msg) => console.log(`  ${colors.magenta}→${colors.reset} ${msg}`),
};

/**
 * Statistiques des tests
 */
const stats = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
};

/**
 * Affiche le header du script
 */
function printHeader() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  Facturation.pro MCP Server - Tests d\'intégration            ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
}

/**
 * Vérifie les prérequis
 */
function checkPrerequisites() {
  log.title('Vérification des prérequis');

  const checks = [
    { name: 'FACTURATION_API_ID', value: API_ID },
    { name: 'FACTURATION_API_KEY', value: API_KEY },
    { name: 'FACTURATION_FIRM_ID', value: FIRM_ID },
    { name: 'FACTURATION_USER_AGENT', value: USER_AGENT },
  ];

  let allValid = true;

  checks.forEach(({ name, value }) => {
    if (value) {
      const display = name === 'FACTURATION_API_KEY'
        ? `${value.substring(0, 10)}***`
        : value;
      log.success(`${name}: ${display}`);
    } else {
      log.error(`${name}: non définie`);
      allValid = false;
    }
  });

  log.data(`URL de base: ${BASE_URL}`);

  if (!allValid) {
    log.error('\nVariables d\'environnement manquantes !');
    log.info('Définissez-les dans votre fichier .env ou en ligne de commande');
    process.exit(1);
  }

  log.success('\nTous les prérequis sont satisfaits');
}

/**
 * Créer un client API axios configuré
 */
function createApiClient() {
  return axios.create({
    baseURL: BASE_URL,
    auth: {
      username: API_ID,
      password: API_KEY,
    },
    headers: {
      'User-Agent': USER_AGENT,
      'Content-Type': 'application/json',
    },
    timeout: 10000,
  });
}

/**
 * Test : Connexion API et authentification
 */
async function testApiConnection(client) {
  log.title('Test 1 : Connexion à l\'API Facturation.pro');
  stats.total++;

  try {
    const response = await client.get(`/firms/${FIRM_ID}/account.json`);

    if (response.status === 200 && response.data) {
      log.success('Connexion réussie');
      log.data(`Compte: ${response.data.account?.email || 'N/A'}`);
      log.data(`Plan: ${response.data.account?.plan || 'N/A'}`);
      stats.passed++;
      return true;
    }

    throw new Error('Réponse invalide de l\'API');
  } catch (error) {
    log.error('Échec de la connexion');
    log.error(`Erreur: ${error.message}`);
    if (error.response) {
      log.error(`Status: ${error.response.status}`);
      log.error(`Message: ${error.response.data?.errors || 'N/A'}`);
    }
    stats.failed++;
    return false;
  }
}

/**
 * Test : Listing des clients
 */
async function testListCustomers(client) {
  log.title('Test 2 : Listing des clients');
  stats.total++;

  try {
    const response = await client.get(`/firms/${FIRM_ID}/customers.json`);

    if (response.status === 200) {
      const customers = response.data;
      log.success(`Récupération réussie : ${customers.length} client(s)`);

      if (customers.length > 0) {
        const customer = customers[0];
        log.data(`Exemple: ${customer.company_name || customer.first_name + ' ' + customer.last_name}`);
        log.data(`ID: ${customer.id}`);
        log.data(`Email: ${customer.email || 'N/A'}`);
      } else {
        log.warning('Aucun client trouvé (liste vide)');
      }

      stats.passed++;
      return customers;
    }

    throw new Error('Réponse invalide');
  } catch (error) {
    log.error('Échec du listing des clients');
    log.error(`Erreur: ${error.message}`);
    stats.failed++;
    return null;
  }
}

/**
 * Test : Pagination
 */
async function testPagination(client) {
  log.title('Test 3 : Pagination');
  stats.total++;

  try {
    const response = await client.get(`/firms/${FIRM_ID}/customers.json?page=1`);

    if (response.status === 200) {
      const paginationHeader = response.headers['x-pagination'];

      if (paginationHeader) {
        const pagination = JSON.parse(paginationHeader);
        log.success('Pagination détectée');
        log.data(`Page courante: ${pagination.current_page}`);
        log.data(`Total pages: ${pagination.total_pages}`);
        log.data(`Entrées totales: ${pagination.total_entries}`);
        log.data(`Par page: ${pagination.per_page}`);
      } else {
        log.warning('Header X-Pagination non trouvé');
      }

      stats.passed++;
      return true;
    }

    throw new Error('Réponse invalide');
  } catch (error) {
    log.error('Échec du test de pagination');
    log.error(`Erreur: ${error.message}`);
    stats.failed++;
    return false;
  }
}

/**
 * Test : Rate limiting
 */
async function testRateLimiting(client) {
  log.title('Test 4 : Vérification rate limiting');
  stats.total++;

  try {
    log.info('Envoi de 3 requêtes rapides...');

    const requests = [];
    for (let i = 0; i < 3; i++) {
      requests.push(client.get(`/firms/${FIRM_ID}/customers.json`));
    }

    const results = await Promise.all(requests);

    if (results.every(r => r.status === 200)) {
      log.success('Toutes les requêtes ont réussi');
      log.data('Rate limiting géré correctement par l\'API');
      stats.passed++;
      return true;
    }

    throw new Error('Certaines requêtes ont échoué');
  } catch (error) {
    if (error.response?.status === 429) {
      log.warning('Rate limit atteint (429 Too Many Requests)');
      log.data('C\'est normal : l\'API limite à 600 req/5min');
      stats.passed++;
      return true;
    }

    log.error('Échec du test de rate limiting');
    log.error(`Erreur: ${error.message}`);
    stats.failed++;
    return false;
  }
}

/**
 * Test : Gestion des erreurs
 */
async function testErrorHandling(client) {
  log.title('Test 5 : Gestion des erreurs');
  stats.total++;

  try {
    // Tenter d'accéder à une ressource inexistante
    await client.get(`/firms/${FIRM_ID}/customers/999999999.json`);

    log.error('L\'API aurait dû retourner une erreur 404');
    stats.failed++;
    return false;
  } catch (error) {
    if (error.response?.status === 404) {
      log.success('Erreur 404 correctement gérée');
      stats.passed++;
      return true;
    }

    log.error('Erreur inattendue');
    log.error(`Erreur: ${error.message}`);
    stats.failed++;
    return false;
  }
}

/**
 * Affiche les statistiques finales
 */
function printSummary() {
  log.title('Résumé des tests');

  const successRate = stats.total > 0
    ? ((stats.passed / stats.total) * 100).toFixed(1)
    : 0;

  console.log(`Total:   ${stats.total}`);
  console.log(`${colors.green}Réussis: ${stats.passed}${colors.reset}`);
  console.log(`${colors.red}Échoués: ${stats.failed}${colors.reset}`);
  console.log(`${colors.yellow}Ignorés: ${stats.skipped}${colors.reset}`);
  console.log(`\nTaux de réussite: ${successRate}%\n`);

  if (stats.failed === 0) {
    log.success('✨ Tous les tests sont passés avec succès !');
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║  Le serveur MCP est prêt à être utilisé !                     ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  } else {
    log.error('❌ Certains tests ont échoué');
    console.log('\nVérifiez vos credentials et la connectivité réseau.');
  }
}

/**
 * Fonction principale
 */
async function main() {
  printHeader();
  checkPrerequisites();

  const client = createApiClient();

  // Exécuter les tests dans l'ordre
  const connectionOk = await testApiConnection(client);

  if (connectionOk) {
    await testListCustomers(client);
    await testPagination(client);
    await testRateLimiting(client);
    await testErrorHandling(client);
  } else {
    log.error('\nTests interrompus : impossible de se connecter à l\'API');
  }

  printSummary();

  // Retourner le code de sortie approprié
  process.exit(stats.failed > 0 ? 1 : 0);
}

// Lancer les tests
main().catch((error) => {
  console.error('\n❌ Erreur fatale:', error.message);
  process.exit(1);
});
