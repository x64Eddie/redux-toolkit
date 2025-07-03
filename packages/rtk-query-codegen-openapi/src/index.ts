import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { generateApi, generateTypes } from './generate';
import type { CommonOptions, ConfigFile, GenerationOptions, OutputFileOptions } from './types';
import { isValidUrl, prettify } from './utils';
export type { ConfigFile } from './types';

const require = createRequire(__filename);

export async function generateEndpoints(options: GenerationOptions): Promise<string | void> {
  const schemaLocation = options.schemaFile;

  const schemaAbsPath = isValidUrl(options.schemaFile)
    ? options.schemaFile
    : path.resolve(process.cwd(), schemaLocation);

  // Generate type file if specified
  const { typeFile, prettierConfigFile } = options;
  if (typeFile) {
    const { typeDeclarations } = await enforceOazapftsTsVersion(async () => {
      return generateTypes(schemaAbsPath, options);
    });

    // Create a source file for types
    const resultFile = await import('typescript').then((ts) => {
      const factory = ts.factory;
      const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
      const sourceFile = ts.createSourceFile('types.ts', '', ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);

      const typeSourceFile = factory.createSourceFile(
        typeDeclarations as any,
        factory.createToken(ts.SyntaxKind.EndOfFileToken),
        ts.NodeFlags.None
      );

      return printer.printNode(ts.EmitHint.Unspecified, typeSourceFile, sourceFile);
    });

    fs.writeFileSync(path.resolve(process.cwd(), typeFile), await prettify(typeFile, resultFile, prettierConfigFile));
  }

  const sourceCode = await enforceOazapftsTsVersion(async () => {
    return generateApi(schemaAbsPath, options);
  });
  const { outputFile } = options;
  if (outputFile) {
    fs.writeFileSync(
      path.resolve(process.cwd(), outputFile),
      await prettify(outputFile, sourceCode, prettierConfigFile)
    );
  } else {
    return await prettify(null, sourceCode, prettierConfigFile);
  }
}

export function parseConfig(fullConfig: ConfigFile) {
  const outFiles: (CommonOptions & OutputFileOptions)[] = [];

  if ('outputFiles' in fullConfig) {
    const { outputFiles, ...commonConfig } = fullConfig;
    for (const [outputFile, specificConfig] of Object.entries(outputFiles)) {
      outFiles.push({
        ...commonConfig,
        ...specificConfig,
        outputFile,
      });
    }
  } else {
    outFiles.push(fullConfig);
  }
  return outFiles;
}

/**
 * Enforces `oazapfts` to use the same TypeScript version as this module itself uses.
 * That should prevent enums from running out of sync if both libraries use different TS versions.
 */
function enforceOazapftsTsVersion<T>(cb: () => T): T {
  const ozTsPath = require.resolve('typescript', { paths: [require.resolve('oazapfts')] });
  const tsPath = require.resolve('typescript');
  const originalEntry = require.cache[ozTsPath];
  try {
    require.cache[ozTsPath] = require.cache[tsPath];
    return cb();
  } finally {
    if (originalEntry) {
      require.cache[ozTsPath] = originalEntry;
    } else {
      delete require.cache[ozTsPath];
    }
  }
}
