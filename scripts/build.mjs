#!/usr/bin/env node
/*
  Monta el index.html publicable de la Pizarra comercial a partir de src/pizarra.html:
    1. sustituye «__LOGO_AZUL__» y «__LOGO_BLANCO__» por los logos horizontales (SVG) en base64;
    2. sustituye «const CLOUD=/*__CLOUD__*\/null;» por la conexión con el repositorio privado de datos,
       con los tokens de GitHub cifrados con las contraseñas.

  Uso (publicar):
      node build.mjs --secrets /ruta/fuera/pizarra-secretos.json --out ../index.html
      node build.mjs --secrets pizarra-secretos.json --tokens /ruta/secretos-del-dashboard.json --out ../index.html
  Uso (probar en este ordenador, sin nube: versiones y fotos en el navegador):
      node build.mjs --local --config ../datos-locales/config.json --out ../datos-locales/prueba.html

  pizarra-secretos.json (FUERA del repositorio, no se comparte):
      {
        "owner": "Juan-biofy", "repo": "pizarra-datos", "branch": "main", "dir": "pizarra",
        "pw_ver":   "contraseña para ver la pizarra (la TV, los comerciales)",
        "pw_admin": "contraseña de administrador (subir PDF, borrar versiones, fotos)",
        "read_token":  "github_pat_… (Contents: solo lectura, solo del repo pizarra-datos)",
        "write_token": "github_pat_… (Contents: lectura y escritura, solo del repo pizarra-datos)"
      }
  Opcional: --tokens otro.json toma de ese fichero los campos que falten (owner, repo, read_token, write_token).

  Qué abre cada contraseña:
      read  = pw_ver   -> read_token    (solo ver la última versión y cambiar claro/oscuro)
      write = pw_admin -> write_token   (administrador: subir PDF, elegir y borrar versiones, fotos)

  El script nunca escribe los tokens ni las contraseñas en pantalla.
  Requiere Node 18 o superior. Sin dependencias.
*/
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { encrypt, decrypt } from './encrypt.mjs';

const aqui = dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const flag = k => process.argv.includes('--' + k);
const src = arg('src', join(aqui, '../src/pizarra.html'));
const logoAzul = arg('logo', join(aqui, '../src/logo-horizontal-blue.svg'));
const logoBlanco = arg('logo-blanco', join(aqui, '../src/logo-horizontal-white.svg'));
const out = arg('out', join(aqui, '../index.html'));

let html = readFileSync(src, 'utf8');
const MARK = 'const CLOUD=/*__CLOUD__*/null;', MARKC = 'const LOCAL_CONFIG=/*__CONFIG__*/null;';
if (!html.includes(MARK) || !html.includes(MARKC)) { console.error('No encuentro las marcas __CLOUD__ / __CONFIG__ en ' + src); process.exit(1); }
html = html.split('__LOGO_AZUL__').join(readFileSync(logoAzul).toString('base64'))
  .split('__LOGO_BLANCO__').join(readFileSync(logoBlanco).toString('base64'));

let cloud = null;
if (flag('local')) {
  const cfg = arg('config');
  if (!cfg) { console.error('Con --local hace falta --config config.json'); process.exit(1); }
  html = html.replace(MARKC, 'const LOCAL_CONFIG=' + JSON.stringify(JSON.parse(readFileSync(cfg, 'utf8'))) + ';');
} else {
  const S = JSON.parse(readFileSync(arg('secrets', 'pizarra-secretos.json'), 'utf8'));
  const tf = arg('tokens');
  if (tf) {
    const T = JSON.parse(readFileSync(tf, 'utf8'));
    for (const k of ['owner', 'repo', 'read_token', 'write_token']) if (!S[k] && T[k]) S[k] = T[k];
  }
  for (const k of ['owner', 'repo', 'read_token', 'write_token'])
    if (!S[k]) { console.error('Falta «' + k + '» en los secretos'); process.exit(1); }
  // Sistema único de contraseñas (17/11): una por persona, desde el archivo de accesos común
  const accP = arg('accesos');
  if (!accP) { console.error('Falta --accesos /Users/diseno/claves-biofy/accesos.json'); process.exit(1); }
  const U = JSON.parse(readFileSync(accP, 'utf8')).usuarios.filter(u => u.webs && u.webs.pizarra);
  const ver = U.filter(u => u.webs.pizarra === 'ver'), adm = U.filter(u => u.webs.pizarra === 'admin');
  cloud = {
    owner: S.owner, repo: S.repo, branch: S.branch || 'main', dir: S.dir || 'pizarra',
    reads: [], writes: [],
  };
  for (const u of ver) cloud.reads.push(await encrypt(u.pw, S.read_token));
  for (const u of adm) cloud.writes.push(await encrypt(u.pw, S.write_token));
  let ok = true;
  for (const u of ver) ok = ok && (await Promise.all(cloud.reads.map(x => decrypt(x, u.pw)))).includes(S.read_token) && !(await Promise.all(cloud.writes.map(x => decrypt(x, u.pw)))).some(Boolean);
  for (const u of adm) ok = ok && (await Promise.all(cloud.writes.map(x => decrypt(x, u.pw)))).includes(S.write_token);
  console.log(`Personas: ${ver.length} solo ver · ${adm.length} administrador`);
  if (!ok) { console.error('La comprobación del cifrado ha fallado'); process.exit(1); }
}
html = html.replace(MARK, 'const CLOUD=' + JSON.stringify(cloud) + ';');
writeFileSync(out, html);
console.log(`Hecho: ${out} (${cloud ? 'modo nube: ' + cloud.owner + '/' + cloud.repo + '/' + cloud.dir : 'modo local de pruebas'})`);
