import { readFileSync, writeFileSync } from 'node:fs';
import { validateEasProject } from './release-config.mjs';

const project = validateEasProject(JSON.parse(readFileSync('output/release/project-status.json', 'utf8')));
writeFileSync('output/release/project.json', JSON.stringify(project, null, 2) + '\n');
console.log(`Acceso confirmado a ${project.fullName} (${project.id}); no se creó otro proyecto.`);
