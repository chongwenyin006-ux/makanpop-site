// TomTom Places Discover v3 - server-side only, free-tier friendly.
// https://docs.tomtom.com/places-search-api/documentation/places-search/discover
// This adapter never asserts that a returned POI is currently trading.
// API credentials must be supplied via TOMTOM_API_KEY server environment.
import {getParams} from './restaurant-query.mjs';

export const TOMTOM_SOURCE = 'TomTom Places Discover';
const TYPES = ['restaurant','fast_food','cafe','cafeteria','coffee_shop','food_court','ice_cream_shop','tea_house','juice_bar'];

function category(types){
  const ids=(Array.isArray(types)?types:[]).map(x=>String(x?.id||''));
  if(ids.some(x=>x.includes('ice_cream')))return 'ice_cream';
  if(ids.some(x=>x.includes('food_court')))return 'food_court';
  if(ids.some(x=>x.includes('fast_food')))return 'fast_food';
  if(ids.some(x=>x.includes('cafe')||x.includes('coffee')||x.includes('tea_house')))return 'cafe';
  return 'restaurant';
}
function isFood(results){
  return (Array.isArray(results)?results:[]).filter(x=>x.type==='poi'&&x.title&&
    Array.isArray(x.position?.coordinates)&&
    (x.poiTypes||[]).some(t=>TYPES.includes(t.id)||
      String(t.parentId||'')==='restaurant'));
}
export function convertTomTom(results){
  return isFood(results).map(x=>{
    const [lon,lat]=x.position.coordinates;
    if(!Number.isFinite(Number(lat))||!Number.isFinite(Number(lon)))return null;
    const tags={
      name:String(x.title).trim().slice(0,220),
      amenity:category(x.poiTypes),
      cuisine:(x.poiTypes||[]).map(x=>x.name||'').filter(Boolean).join(';').slice(0,250),
      'addr:street':String(x.address?.street||'').slice(0,180),
      'addr:housenumber':String(x.address?.houseNumber||'').slice(0,35),
      'addr:city':String(x.address?.municipality||'').slice(0,140),
      'addr:suburb':String(x.address?.municipalitySubdivision||'').slice(0,140),
    };
    return {type:'tomtom',id:String(x.id).slice(0,160),lat:Number(lat),lon:Number(lon),
      tags,provider:'tomtom',subtitle:(x.subtitles||[]).filter(v=>typeof v==='string').join(', ').slice(0,250)};
  }).filter(Boolean);
}
export async function searchTomTom(params,key,fetchFn=fetch){
  if(!key||typeof key!=='string')throw Object.assign(new Error('TomTom API Key 尚未配置'),{status:503});
  const {lat,lon,radius}=getParams(params);
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),14000);
  try{
    const res=await fetchFn('https://api.tomtom.com/maps/orbis/places/discover',{
      method:'POST',signal:ctrl.signal,headers:{
        'Content-Type':'application/json',
        'Accept':'application/json',
        'TomTom-Api-Key':key,
        'TomTom-Api-Version':'3',
        'Attributes':'results(id,title,type,position,poiTypes,address,subtitles)',
        'Accept-Language':'en-MY'
      },
      body:JSON.stringify({
        // Empty query + food POI filters allows cafés and food courts, not only restaurants.
        query:'',
        maxResults:100,
        origin:{type:'point',coordinates:[lon,lat]},
        filters:{
          types:['poi'],
          countryCodesIso2:['MY'],
          poiTypes:TYPES,
          geometry:{type:'circle',center:[lon,lat],radiusInMeters:radius}
        },
        preferences:{geometry:{type:'point',coordinates:[lon,lat]}}
      })
    });
    if(!res.ok){
      const msg=res.status===401||res.status===403?'TomTom API Key 无效或未获 Places Search 权限':
        res.status===429?'TomTom 免费配额或调用频率限制已触发':
        'TomTom 查询出错，HTTP '+res.status;
      throw Object.assign(new Error(msg),{status:res.status===429?429:502});
    }
    const json=await res.json();
    if(!Array.isArray(json?.results))throw Object.assign(new Error('TomTom 回传资料格式异常'),{status:502});
    const elements=convertTomTom(json.results);
    return {elements,count:elements.length,source:TOMTOM_SOURCE,provider:'tomtom',
      statusNote:'TomTom 地点索引不等于实时营业验证；图片和价格不包含在这个接口'};
  }finally{clearTimeout(timer)}
}


export async function searchTomTomAddress(query,key,fetchFn=fetch){
  const text=String(query||'').trim();
  if(text.length<2||text.length>220)throw Object.assign(new Error('地址长度必须在 2–220 字之间'),{status:400});
  if(!key)throw Object.assign(new Error('TomTom API Key 尚未配置'),{status:503});
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),11000);
  try{
    const response=await fetchFn('https://api.tomtom.com/maps/orbis/places/discover',{
      method:'POST',signal:ctrl.signal,
      headers:{
        'Content-Type':'application/json',
        'Accept':'application/json',
        'TomTom-Api-Key':key,
        'TomTom-Api-Version':'3',
        'Attributes':'results(id,title,type,position,address,subtitles)',
        'Accept-Language':'en-MY'
      },
      body:JSON.stringify({
        query:text,
        maxResults:10,
        filters:{types:['poi','address','street','area'],countryCodesIso2:['MY']}
      })
    });
    if(!response.ok)throw Object.assign(
      new Error(response.status===429?'TomTom 查询次数限制，请稍后再试':'TomTom 地址查询 HTTP '+response.status),
      {status:response.status===429?429:502});
    const json=await response.json();
    if(!Array.isArray(json.results))throw Object.assign(new Error('TomTom 地址结果格式异常'),{status:502});
    const locations=json.results.map(item=>{
      const position=item.position?.coordinates;
      if(!Array.isArray(position)||position.length<2)return null;
      const [lon,lat]=position;
      if(!Number.isFinite(Number(lat))||!Number.isFinite(Number(lon)))return null;
      if(lat<1||lat>7.5||lon<99||lon>105.3)return null;
      const state=String(item.address?.countrySubdivision||'');
      if(/sabah|sarawak|labuan/i.test(state))return null;
      return {name:String(item.title||'').trim().slice(0,160),
        lat:Number(lat),lon:Number(lon),kind:item.type||'address',
        label:(item.subtitles||[]).filter(x=>typeof x==='string').slice(0,3).join(', ').slice(0,200),
        source:'TomTom'};
    }).filter(p=>p?.name);
    return {locations,provider:'tomtom',source:'TomTom Places Discover',
      warning:'地图位置不等于营业验证'};
  }finally{clearTimeout(timer)}
}
