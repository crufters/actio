import ts from 'typescript';
import path from 'path';
import fs from 'fs';

function extractParameterData(sourceFile: ts.SourceFile) {
  const parameterData: { [key: string]: string[] } = {};

  function visit(node: ts.Node) {
    if (ts.isMethodDeclaration(node) || ts.isFunctionDeclaration(node)) {
      const functionName = node.name?.getText() || 'anonymous';
      const parameters = node.parameters.map(param => {
        const parameterName = param.name.getText();
        const parameterType = param.type ? param.type.getText(sourceFile) : 'any';
        return `${parameterName}: ${parameterType}`;
      });
      parameterData[functionName] = parameters;
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return parameterData;
}

function extractFileParameterData(filePath: string) {
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(filePath, fileContents, ts.ScriptTarget?.Latest);
  const parameterData = extractParameterData(sourceFile);
  return parameterData;
}

function extractDirectoryParameterData(directoryPath: string) {
  const parameterData: { [key: string]: string[] } = {};

  function processDirectory(dirPath: string) {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        processDirectory(filePath);
      } else if (stats.isFile() && path.extname(filePath) === '.ts') {
        const fileParameterData = extractFileParameterData(filePath);
        Object.keys(fileParameterData).forEach(functionName => {
          parameterData[`${file}:${functionName}`] = fileParameterData[functionName];
        });
      }
    }
  }

  processDirectory(directoryPath);
  return parameterData;
}

function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Please provide a file or directory path as the first argument');
    process.exit(1);
  }
  const targetPath = args[0];
  const isDirectory = fs.statSync(targetPath).isDirectory();
  const parameterData = isDirectory ? extractDirectoryParameterData(targetPath) : extractFileParameterData(targetPath);
  console.log(JSON.stringify(parameterData, null, 2));
}

main();
