import {searchTomTomAddress} from '../../lib/tomtom-places.mjs';
export async function onRequestGet({request,env}){
  const url=new URL(request.url),key=env?.TOMTOM_API_KEY?.trim();
  if(!key)return new Response(JSON.stringify({provider:'osm',error:'TomTom API Key 尚未配置'}),{
    status:503,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}
  });
  try{
    const data=await searchTomTomAddress(url.searchParams.get('q')||'',key);
    return new Response(JSON.stringify(data),{
      status:200,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}
    });
  }catch(e){
    return new Response(JSON.stringify({error:e.message||'TomTom 地址查询失败'}),{
      status:e.status||502,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}
    });
  }
}
