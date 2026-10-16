// Local preview server for StackBlitz. Not deployed to Cloudflare Pages.
// No extra packages or API keys required.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {fetchRestaurantData} from './lib/restaurant-query.mjs';

const projectDir = path.dirname(fileURLToPath(import.meta.url));
const staticDir = path.resolve(projectDir, 'public');
const port = Number(process.env.PORT || 3000);
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.json':'application/json; charset=utf-8', '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml', '.ico':'image/x-icon' };

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', 'http://localhost');
    if(url.pathname === '/api/restaurants'){
      try{
        const data=await fetchRestaurantData(url.searchParams);
        res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'public, max-age=900'});
        return res.end(JSON.stringify(data));
      }catch(e){
        res.writeHead(e.status||502,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
        return res.end(JSON.stringify({error:e.message||'查询失败'}));
      }
    }
    const name = decodeURIComponent(url.pathname);
    const file = path.resolve(staticDir, '.' + (name === '/' ? '/index.html' : name));
    if (file !== staticDir && !file.startsWith(staticDir + path.sep)) {
      res.writeHead(403); return res.end('Forbidden');
    }
    const body = await readFile(file);
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-store');
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type':'text/plain; charset=utf-8' });
    res.end('Not found');
  }
}).listen(port, '0.0.0.0', () => console.log(`MakanPop preview: http://localhost:${port}`));
