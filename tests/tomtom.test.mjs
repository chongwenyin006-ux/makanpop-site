import test from 'node:test';
import assert from 'node:assert/strict';
import {searchTomTom,convertTomTom} from '../lib/tomtom-places.mjs';

const opts=new URLSearchParams({lat:'3.202244',lon:'101.716311',radius:'1200'});
const fixture={
  results:[
    {id:'tt-good-1',type:'poi',title:'Cafe Test',poiTypes:[{id:'cafe',name:'Cafe'}],
      position:{type:'Point',coordinates:[101.716,3.203]},
      address:{countryCodeIso2:'MY',municipality:'Kuala Lumpur',street:'Jalan Danau Saujana 1'}},
    {id:'tt-good-2',type:'poi',title:'Restaurant Test',
      poiTypes:[{id:'chinese_restaurant',parentId:'restaurant',name:'Chinese restaurant'}],
      position:{type:'Point',coordinates:[101.717,3.2025]}},
    {id:'tt-bad-1',type:'address',title:'Not a restaurant',position:{coordinates:[101.716,3.203]}},
    {id:'tt-bad-2',type:'poi',title:'Not food',poiTypes:[{id:'car_wash'}],
      position:{coordinates:[101.716,3.203]}}
  ]
};
test('requires key but does not expose it in error',async()=>{
  await assert.rejects(searchTomTom(opts,''),/Key/);
});
test('filters non-food results and preserves names/coordinates',()=>{
  const out=convertTomTom(fixture.results);
  assert.equal(out.length,2);
  assert.deepEqual(out.map(p=>p.tags.amenity),['cafe','restaurant']);
  assert.equal(out[0].lon,101.716);
  assert.equal(out[0].lat,3.203);
});
test('TomTom is called once server side with correct v3 discover and safe filters',async()=>{
  let calls=0,req;
  const fakeFetch=async(url,opts)=>{
    calls++;req={url,opts};
    return {ok:true,json:async()=>fixture};
  };
  const res=await searchTomTom(opts,'SECRET_NOT_FOR_BROWSER',fakeFetch);
  assert.equal(calls,1);
  assert.equal(res.provider,'tomtom');
  assert.equal(res.count,2);
  assert.equal(req.url,'https://api.tomtom.com/maps/orbis/places/discover');
  assert.equal(req.opts.headers['TomTom-Api-Version'],'3');
  assert.equal(req.opts.headers['TomTom-Api-Key'],'SECRET_NOT_FOR_BROWSER');
  const body=JSON.parse(req.opts.body);
  assert.deepEqual(body.origin.coordinates,[101.716,3.202]);
  assert.equal(body.maxResults,100);
  assert.deepEqual(body.filters.countryCodesIso2,['MY']);
  assert.equal(body.filters.geometry.radiusInMeters,1200);
  assert.ok(body.filters.poiTypes.includes('restaurant'));
  assert.ok(body.filters.poiTypes.includes('cafe'));
  assert.ok(!JSON.stringify(res).includes('SECRET_NOT_FOR_BROWSER'));
});
test('reports quota limit without switching source',async()=>{
  const fetch429=async()=>({ok:false,status:429});
  await assert.rejects(searchTomTom(opts,'TESTKEY',fetch429),/配额|调用频率/);
});
