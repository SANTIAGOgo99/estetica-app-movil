/* Sincroniza la matriz revisada. Sin --apply solo muestra el alcance.
 * Requiere gh autenticado con acceso al repositorio y Projects.
 * No elimina issues ni ramas. Las pruebas anteriores se archivan al finalizar.
 */
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
const plan = JSON.parse(fs.readFileSync('docs/testing/plan.json', 'utf8'));
const REPO = 'repos/SANTIAGOgo99/estetica-app-movil';
const PROJECT = 'PVT_kwHOChYle84BjnPG';
const q = JSON.stringify;
function gh(args, input) {
  const r = spawnSync('gh', args, { encoding: 'utf8', input: input ? JSON.stringify(input) : undefined, maxBuffer: 25 * 1024 * 1024 });
  if (r.status !== 0) throw Error(r.stderr || r.stdout);
  const data = JSON.parse(r.stdout || '{}');
  if (data.errors) throw Error(JSON.stringify(data.errors));
  return data;
}
const api = (path, method='GET', body) => gh(['api', path, '--method', method, ...(body ? ['--input', '-'] : [])], body);
const gql = query => api('graphql', 'POST', { query }).data;
const save = (path, data) => fs.writeFileSync(path, JSON.stringify(data, null, 2)+'\n');
function fieldsMutation(itemId, values, fields, prefix='') {
  return Object.entries(values).map(([name,value],i) => {
    const field = fields.find(f => f.name === name);
    if (!field) throw Error(`Falta campo ${name}`);
    const option = field.options?.find(o => o.name === value);
    if (field.options && !option) throw Error(`Falta opción ${name}:${value}`);
    return `f${prefix}${i}:updateProjectV2ItemFieldValue(input:{projectId:${q(PROJECT)},itemId:${q(itemId)},fieldId:${q(field.id)},value:${option ? `{singleSelectOptionId:${q(option.id)}}` : `{date:${q(value)}}`}}){projectV2Item{id}}`;
  });
}
async function main() {
  if (!process.argv.includes('--apply')) {
    console.log('18 historias; conservar 59 tareas; crear/reutilizar 126 pruebas; archivar 26 anteriores. Usar --apply para sincronizar.');
    return;
  }
  fs.mkdirSync('.planning', { recursive: true });
  const issues = gh(['api', `${REPO}/issues?state=all&per_page=100`, '--paginate', '--slurp']).flat().filter(i => !i.pull_request);
  let items = gh(['project','item-list','1','--owner','SANTIAGOgo99','--limit','500','--format','json']).items;
  const fields = gh(['project','field-list','1','--owner','SANTIAGOgo99','--format','json']).fields;
  const meta = gql('{repository(owner:"SANTIAGOgo99",name:"estetica-app-movil"){id label(name:"PRUEBA"){id} owner{id}}}').repository;
  const backup='.planning/tests-before-2026-10-16.json';
  if (!fs.existsSync(backup)) save(backup, { issues, items, fields });
  const result = [];
  for (const story of plan.stories) {
    const parent = issues.find(i => i.number === story.issueNumber);
    if (!parent) throw Error(`Falta padre ${story.key}`);
    const tests = plan.rows.filter(r => r.type === 'Prueba' && r.parent === story.key);
    if (tests.length !== 7) throw Error(`Cantidad incorrecta ${story.key}`);
    for (const t of tests) {
      t.body=`## Objetivo\n${t.detail}\n\n## Alcance y relación\n- Historia: ${story.key}, #${parent.number}.\n- Módulo: ${story.module}.\n- Sprint: Sprint ${story.sprint}; repetir el flujo integrado al cierre.\n- Rama: \`${story.branch}\`.\n- Ejecución: ${t.category === 'esfuerzo' ? 'manual, fuera del YAML' : t.category === 'aceptacion' || t.category === 'rendimiento' ? 'job en develop; complementar casos y dispositivo según cobertura' : 'job en rama HU y develop'}.\n\n## Evidencia y criterio de cierre\n${t.evidence}\n\nConsultar docs/testing/stories/${story.key}.md y docs/testing/README.md. No cerrar por crear el issue ni por un job que no cubra este caso.\n\n## Planeación\n- Responsable: @SANTIAGOgo99\n- Estado inicial: ${t.status}\n- Tipo: Prueba\n- Prioridad: Alta\n- Fecha inicio original: ${t.start}\n- Fecha termino original: ${t.end}\n- Corrección de planeación: 2026-10-16. Fechas heredadas, no ejecución retroactiva.\n`;
    }
    const missing=tests.filter(t=>!issues.some(i=>i.title===t.title));
    if (missing.length) {
      const created=gql('mutation{'+missing.map((t,i)=>`c${i}:createIssue(input:{repositoryId:${q(meta.id)},title:${q(t.title)},body:${q(t.body)},assigneeIds:[${q(meta.owner.id)}],labelIds:[${q(meta.label.id)}]}){issue{id number url databaseId title}}`).join('\n')+'}');
      missing.forEach((t,i)=> {const x=created[`c${i}`].issue; issues.push({number:x.number,node_id:x.id,id:x.databaseId,title:x.title,html_url:x.url});});
    }
    for (const t of tests) t.issue=issues.find(i=>i.title===t.title);
    const children=api(`${REPO}/issues/${parent.number}/sub_issues?per_page=100`);
    const unlinked=tests.filter(t=>!children.some(c=>c.number===t.issue.number));
    if(unlinked.length) gql('mutation{'+unlinked.map((t,i)=>`s${i}:addSubIssue(input:{issueId:${q(parent.node_id)},subIssueId:${q(t.issue.node_id)}}){__typename}`).join('\n')+'}');
    items = gh(['project','item-list','1','--owner','SANTIAGOgo99','--limit','500','--format','json']).items;
    const absent=tests.filter(t=>!items.some(i=>i.content?.number===t.issue.number));
    if(absent.length){
      try { const added=gql('mutation{'+absent.map((t,i)=>`a${i}:addProjectV2ItemById(input:{projectId:${q(PROJECT)},contentId:${q(t.issue.node_id)}}){item{id}}`).join('\n')+'}');
      absent.forEach((t,i)=>items.push({id:added[`a${i}`].item.id,content:{number:t.issue.number}}));
      } catch(error) { if (!error.message.includes('Content already exists')) throw error; items=gh(['project','item-list','1','--owner','SANTIAGOgo99','--limit','500','--format','json']).items; if(tests.some(t=>!items.some(i=>i.content?.number===t.issue.number))) throw error; }
    }
    const fieldUpdates=[];
    for(const [index,t] of tests.entries()){
      const item=items.find(i=>i.content?.number===t.issue.number);
      fieldUpdates.push(...fieldsMutation(item.id,{'Status':item.status??t.status,'Prioridad':'Alta','Sprint':`Sprint ${t.sprint}`,'Tipo':'Prueba','Fecha inicio':t.start,'Fecha termino':t.end},fields,index+'_'));
      result.push({key:t.key,number:t.issue.number,url:t.issue.html_url,itemId:item.id,parent:story.key});
    }
    gql('mutation{'+fieldUpdates.join('\n')+'}');
    const marker='\n\n## Organización de pruebas — revisión 2026-10-16';
    const base=(parent.body??'').split(marker)[0];
    api(`${REPO}/issues/${parent.number}`,'PATCH',{body:base+marker+`\n\nRama: \`${story.branch}\`; integración hacia \`develop\`. Módulo: ${story.module}; Sprint ${story.sprint}.\n\n`+tests.map(t=>`- ${t.key}: #${t.issue.number} (${t.category}).`).join('\n')+'\n\nCuatro verificaciones en rama HU; seis en develop. Esfuerzo manual. Revisar evidencia por requerimiento, módulo y sprint; no cerrar sin criterios y validaciones pendientes. Ver docs/testing/README.md.\n'});
    save('.planning/test-sync-progress.json',result);
    console.log(`${story.key}: siete pruebas relacionadas y calendarizadas (${result.length}/126).`);
    await new Promise(resolve=>setTimeout(resolve,1200));
  }
  // Comprobar relaciones antes de retirar las pruebas dispersas de la vista activa.
  for(const story of plan.stories){
    const children=api(`${REPO}/issues/${story.issueNumber}/sub_issues?per_page=100`);
    const expected=result.filter(r=>r.parent===story.key);
    if(expected.some(r=>!children.some(c=>c.number===r.number))) throw Error(`Falta relación de ${story.key}`);
  }
  const old=issues.filter(i=>i.number>=80&&i.number<=105&&i.labels?.some(l=>l.name==='PRUEBA'));
  for(const issue of old){
    const parentMatch=plan.stories.find(s=>s.issueNumber===({80:10,81:18,82:19,85:28,86:3,90:10}[issue.number]));
    if(parentMatch){
      const children=api(`${REPO}/issues/${parentMatch.issueNumber}/sub_issues?per_page=100`);
      if(children.some(c=>c.number===issue.number)) api(`${REPO}/issues/${parentMatch.issueNumber}/sub_issue`,'DELETE',{sub_issue_id:issue.id});
    }
    const note='\n\n## Sustituida por organización por historia — 2026-10-16\nEsta tarea dispersa fue sustituida por P01–P07 de cada HU (ver docs/testing/plan.json). Se conserva el contenido y la evidencia histórica. Cerrada como no planificada, NO como prueba aprobada.\n';
    api(`${REPO}/issues/${issue.number}`,'PATCH',{body:(issue.body??'').split('\n\n## Sustituida por organización por historia')[0]+note,state:'closed',state_reason:'not_planned'});
    const item=items.find(i=>i.content?.number===issue.number);
    if(item) gql(`mutation{archiveProjectV2Item(input:{projectId:${q(PROJECT)},itemId:${q(item.id)}}){__typename}}`);
  }
  const current=gh(['project','view','1','--owner','SANTIAGOgo99','--format','json']);
  const heading='\n\nSeguimiento de pruebas — revisión 2026-10-16';
  gh(['project','edit','1','--owner','SANTIAGOgo99','--readme',(current.readme??'').split(heading)[0]+heading+'\nCada HU tiene siete sub-issues de pruebas (P01–P07). Cuatro verificaciones en su rama y seis en develop; esfuerzo se ejecuta manualmente. main conserva entregas estables. Las ramas anteriores se conservan como historial. El alcance se registra por requerimiento, módulo y sprint. Consultar docs/testing/README.md y las evidencias vinculadas. Las 26 pruebas dispersas anteriores están archivadas, no aprobadas.']);
  save('.planning/test-sync-result.json',{revision:'2026-10-16',tests:result,archived:old.map(i=>i.number)});
  const links=Object.fromEntries(result.map(r=>[r.key,r]));
  save('.planning/test-github-links.json',links);
  console.log('Verificado: 126 pruebas, 18 padres; 26 pruebas anteriores conservadas y archivadas.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
