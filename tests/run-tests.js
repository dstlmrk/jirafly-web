#!/usr/bin/env node
/**
 * Test Runner for JiraFly Web Application
 *
 * Usage:
 *   npm test              - Run all tests
 *   npm test unit         - Run only unit tests
 *   npm test integration  - Run only integration tests
 *   npm test api          - Run only API tests
 *   npm test auth         - Run only auth tests
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const TESTS_DIR = __dirname;
const TEST_CATEGORIES = {
  unit: 'unit',
  integration: 'integration',
  api: 'api',
  auth: 'auth',
  manual: 'manual'
};

// Parse command line arguments
const args = process.argv.slice(2);
const category = args[0] || 'all';

// ANSI colors for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function getTestFiles(category) {
  if (category === 'all') {
    const allTests = [];
    Object.values(TEST_CATEGORIES).forEach(cat => {
      const categoryPath = path.join(TESTS_DIR, cat);
      if (fs.existsSync(categoryPath)) {
        const files = fs.readdirSync(categoryPath)
          .filter(f => f.endsWith('.test.js'))
          .map(f => path.join(categoryPath, f));
        allTests.push(...files);
      }
    });
    return allTests;
  }

  if (!TEST_CATEGORIES[category]) {
    log(`❌ Neznámá kategorie: ${category}`, 'red');
    log(`\nDostupné kategorie: ${Object.keys(TEST_CATEGORIES).join(', ')}`, 'yellow');
    process.exit(1);
  }

  const categoryPath = path.join(TESTS_DIR, category);
  if (!fs.existsSync(categoryPath)) {
    log(`⚠️  Kategorie ${category} neobsahuje žádné testy`, 'yellow');
    return [];
  }

  return fs.readdirSync(categoryPath)
    .filter(f => f.endsWith('.test.js'))
    .map(f => path.join(categoryPath, f));
}

function runTest(testFile) {
  return new Promise((resolve) => {
    const testName = path.basename(testFile, '.test.js');
    const category = path.basename(path.dirname(testFile));

    log(`\n${'='.repeat(60)}`, 'cyan');
    log(`▶ Spouštím: ${category}/${testName}`, 'bright');
    log('='.repeat(60), 'cyan');

    const child = spawn('node', [testFile], {
      stdio: 'inherit',
      env: { ...process.env }
    });

    child.on('close', (code) => {
      if (code === 0) {
        log(`✅ ${category}/${testName} - ÚSPĚCH`, 'green');
        resolve({ name: `${category}/${testName}`, success: true });
      } else {
        log(`❌ ${category}/${testName} - SELHÁNÍ (exit code: ${code})`, 'red');
        resolve({ name: `${category}/${testName}`, success: false, code });
      }
    });

    child.on('error', (error) => {
      log(`❌ ${category}/${testName} - CHYBA: ${error.message}`, 'red');
      resolve({ name: `${category}/${testName}`, success: false, error: error.message });
    });
  });
}

async function runAllTests(testFiles) {
  const startTime = Date.now();
  const results = [];

  log('\n🧪 TESTOVÁNÍ JIRAFLY WEB', 'bright');
  log(`Kategorie: ${category}`, 'cyan');
  log(`Počet testů: ${testFiles.length}\n`, 'cyan');

  for (const testFile of testFiles) {
    const result = await runTest(testFile);
    results.push(result);
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // Print summary
  log('\n' + '='.repeat(60), 'cyan');
  log('📊 SHRNUTÍ TESTŮ', 'bright');
  log('='.repeat(60), 'cyan');

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  log(`\nCelkový počet testů: ${results.length}`, 'cyan');
  log(`✅ Úspěšné: ${passed}`, 'green');
  log(`❌ Selhané: ${failed}`, failed > 0 ? 'red' : 'reset');
  log(`⏱️  Celková doba: ${duration}s`, 'yellow');

  if (failed > 0) {
    log('\n❌ Selhané testy:', 'red');
    results.filter(r => !r.success).forEach(r => {
      log(`   - ${r.name}`, 'red');
    });
    process.exit(1);
  } else {
    log('\n🎉 Všechny testy prošly!', 'green');
    process.exit(0);
  }
}

// Main execution
const testFiles = getTestFiles(category);

if (testFiles.length === 0) {
  log('⚠️  Žádné testy k spuštění', 'yellow');
  process.exit(0);
}

runAllTests(testFiles);
