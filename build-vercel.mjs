// Build a static, dependency-free deployment without publishing repository documentation.
import { mkdir, readdir, readFile, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
const root = new URL('.', import.meta.url);
const output = new URL('dist/', root);
await rm(output, {recursive:true, force:true});
await mkdir(output, {recursive:true});
const host = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
const siteUrl = process.env.SITE_URL || (host ? 'https://'+host : '');
const dataFiles = new Set(['idx-search-config.json','market-current.json']);
for (const name of await readdir(root)) {
  if (!/\.(html|css|js|svg|png|jpe?g|webp|ico)$/i.test(name) && name !== 'robots.txt' && name !== 'sitemap.xml' && !dataFiles.has(name) && !/^market-data-\d{4}-q[1-4]\.json$/.test(name)) continue;
  let content = await readFile(new URL(name,root));
  if (name.endsWith('.html') && siteUrl) {
    let html = content.toString('utf8');
    html = html.replace(/https:\/\/johnsonrob28-ai\.github\.io\/rgj-commercial-website\//g,siteUrl+'/').replace(/https:\/\/headless-jizhgzanvba-johnsonrob28-140c\.wix-site-host\.com\//g,siteUrl+'/');
    content = Buffer.from(html);
  }
  await writeFile(new URL(name, output),content);
}
console.log('Built the static site in dist; private form records remain in Wix.');
