import fs from 'node:fs';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { generateEndpoints } from '../src';

const tmpDir = path.resolve(__dirname, 'tmp');

describe('typeFile and extraModels generation', () => {
  beforeAll(() => {
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir);
    }
  });

  it('should generate separate type file when typeFile is specified', async () => {
    const apiFile = path.join(tmpDir, 'petApi.ts');
    const typeFile = path.join(tmpDir, 'petTypes.ts');
    
    await generateEndpoints({
      apiFile: './fixtures/emptyApi.ts',
      schemaFile: './fixtures/petstore.json',
      outputFile: apiFile,
      typeFile: typeFile,
    });

    expect(fs.existsSync(apiFile)).toBe(true);
    expect(fs.existsSync(typeFile)).toBe(true);

    const apiContent = fs.readFileSync(apiFile, 'utf-8');
    const typeContent = fs.readFileSync(typeFile, 'utf-8');

    // Check that API file imports types
    expect(apiContent).toContain('import * as Types from "./petTypes"');
    
    // Check that types are in the type file
    expect(typeContent).toContain('export type Pet =');
    expect(typeContent).toContain('export type User =');
    
    // Check that types are NOT in the API file
    expect(apiContent).not.toContain('export type Pet =');
    expect(apiContent).not.toContain('export type User =');
  });

  it('should include extraModels when specified as true', async () => {
    const apiFile = path.join(tmpDir, 'petApiExtra.ts');
    const typeFile = path.join(tmpDir, 'petTypesExtra.ts');
    
    await generateEndpoints({
      apiFile: './fixtures/emptyApi.ts',
      schemaFile: './fixtures/petstore.json',
      outputFile: apiFile,
      typeFile: typeFile,
      extraModels: true,
    });

    const typeContent = fs.readFileSync(typeFile, 'utf-8');
    
    // Check that the unreferenced Customer schema is included
    expect(typeContent).toContain('export type Customer =');
  });

  it('should include only specified extraModels when array is provided', async () => {
    const apiFile = path.join(tmpDir, 'petApiSpecific.ts');
    const typeFile = path.join(tmpDir, 'petTypesSpecific.ts');
    
    await generateEndpoints({
      apiFile: './fixtures/emptyApi.ts',
      schemaFile: './fixtures/petstore.json',
      outputFile: apiFile,
      typeFile: typeFile,
      extraModels: ['Customer'],
    });

    const typeContent = fs.readFileSync(typeFile, 'utf-8');
    
    // Check that the specified Customer schema is included
    expect(typeContent).toContain('export type Customer =');
  });

  it('should generate all types inline when typeFile is not specified', async () => {
    const apiFile = path.join(tmpDir, 'petApiInline.ts');
    
    await generateEndpoints({
      apiFile: './fixtures/emptyApi.ts',
      schemaFile: './fixtures/petstore.json',
      outputFile: apiFile,
    });

    const apiContent = fs.readFileSync(apiFile, 'utf-8');

    // Check that types are in the API file
    expect(apiContent).toContain('export type Pet =');
    expect(apiContent).toContain('export type User =');
    
    // Check that there's no type import
    expect(apiContent).not.toContain('import * as Types');
  });
});