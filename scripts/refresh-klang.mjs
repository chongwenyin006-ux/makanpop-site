// A deliberately low-frequency OpenStreetMap snapshot for Klang.
// The file is published as a static asset; end users never query Overpass for Klang.
// Data © OpenStreetMap contributors, ODbL 1.0: https://www.openstreetmap.org/copyright
import {mkdir,writeFile} from 'node:fs/promises';
const lat=3.044,lon=101.445,radius=14500;
const query='[out:json][timeout:45];nwr(around:'+radius+','+lat+','+lon+')[amenity~"^(restaurant|cafe|fast_food|food_court|ice_cream)$"][name];out center 3500;';
const providers=[
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass-api.de/api/interpreter'
];
let elements=null,provider='';
for(const url of providers){
  try{
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),65000);
    let response;
    try{
      response=await fetch(url,{
        method:'POST',
        headers:{
          'Accept':'application/json',
          'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8',
          'User-Agent':'MakanPoP-Klang-OSM-Snapshot/1.0 (https://github.com/chongwenyin006-ux/makanpop-site)'
        },
        body:new URLSearchParams({data:query}),
        signal:controller.signal
      });
    }finally{clearTimeout(timer)}
    if(!response.ok)throw Error('HTTP '+response.status);
    const json=await response.json();
    if(!Array.isArray(json.elements))throw Error('Invalid Overpass format');
    elements=json.elements.map(x=>{
      const p={id:x.id,type:x.type,tags:x.tags||{}};
      if(x.lat!==undefined)p.lat=x.lat;
      if(x.lon!==undefined)p.lon=x.lon;
      if(x.center)p.center=x.center;
      return p;
    }).filter(x=>x.tags.name&&Number.isFinite(Number(x.lat??x.center?.lat))&&Number.isFinite(Number(x.lon??x.center?.lon)));
    if(elements.length<20)throw Error('Suspiciously few named food places: '+elements.length);
    provider=url;
    break;
  }catch(err){
    console.warn('Snapshot source unavailable:',url,err.message);
    elements=null;
  }
}
if(!elements)throw Error('Could not fetch real OSM places. Existing snapshot is preserved, no invented replacements.');
await mkdir('public/data',{recursive:true});
const payload={
  source:'OpenStreetMap',
  attribution:'© OpenStreetMap contributors',
  license:'ODbL-1.0',
  licenseUrl:'https://www.openstreetmap.org/copyright',
  generatedAt:new Date().toISOString(),
  center:{lat,lon},radius,
  provider,
  count:elements.length,
  elements
};
await writeFile('public/data/klang-restaurants.json',JSON.stringify(payload));
console.log('Saved',elements.length,'real OSM food locations around Klang');
