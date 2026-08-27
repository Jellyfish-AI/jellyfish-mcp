import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import yaml from 'js-yaml';

const repositoryRoot = process.cwd();
const skippedDirectories = new Set(['.git', 'node_modules']);

function findSkillFiles(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const skillFiles = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!skippedDirectories.has(entry.name)) {
        skillFiles.push(...findSkillFiles(path.join(directory, entry.name)));
      }
      continue;
    }

    if (entry.isFile() && entry.name === 'SKILL.md') {
      skillFiles.push(path.join(directory, entry.name));
    }
  }

  return skillFiles;
}

function parseFrontmatter(contents) {
  const openingDelimiter = /^---\r?\n/;
  const openingMatch = contents.match(openingDelimiter);
  if (!openingMatch) {
    throw new Error('missing opening frontmatter delimiter');
  }

  const closingStart = openingMatch[0].length;
  const closingMatch = contents.slice(closingStart).match(/^---\r?\n?/m);
  if (!closingMatch) {
    throw new Error('missing closing frontmatter delimiter');
  }

  const frontmatter = contents.slice(closingStart, closingStart + closingMatch.index);
  const parsed = yaml.load(frontmatter);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('frontmatter must be a YAML object');
  }
}

function validateSkillFile(filePath) {
  try {
    parseFrontmatter(fs.readFileSync(filePath, 'utf8'));
    return null;
  } catch (error) {
    return `${path.relative(repositoryRoot, filePath)}: ${error.message}`;
  }
}

const errors = findSkillFiles(repositoryRoot)
  .map(validateSkillFile)
  .filter(Boolean);

if (errors.length > 0) {
  console.error('Invalid SKILL.md frontmatter:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
} else {
  console.log('All SKILL.md files have valid YAML frontmatter.');
}
