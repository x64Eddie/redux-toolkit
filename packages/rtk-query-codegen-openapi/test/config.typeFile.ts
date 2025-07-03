import type { ConfigFile } from '../src';

const config: ConfigFile = {
  schemaFile: './fixtures/petstore.json',
  apiFile: './fixtures/emptyApi.ts',
  outputFile: './test-output-api.ts',
  typeFile: './test-output-types.ts',
  extraModels: true,
  hooks: true,
};

export default config;