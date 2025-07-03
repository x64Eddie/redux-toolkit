const { generateEndpoints } = require('./src/index.ts');
const path = require('path');

async function test() {
  try {
    console.log('Testing typeFile and extraModels implementation...');
    
    // Test 1: Generate with typeFile
    await generateEndpoints({
      apiFile: './test/fixtures/emptyApi.ts',
      schemaFile: './test/fixtures/petstore.json',
      outputFile: './test-output-api.ts',
      typeFile: './test-output-types.ts',
      extraModels: true
    });
    
    console.log('✅ Generation completed successfully!');
    console.log('Check test-output-api.ts and test-output-types.ts');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

test();