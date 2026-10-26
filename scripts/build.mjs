import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const out=path.join(root,'dist');
fs.rmSync(out,{recursive:true,force:true});
fs.mkdirSync(out,{recursive:true});
for(const name of fs.readdirSync(root)) if(name.endsWith('.html')||['_headers','robots.txt','assets'].includes(name)) fs.cpSync(path.join(root,name),path.join(out,name),{recursive:true});
console.log('Built static site in dist/');
