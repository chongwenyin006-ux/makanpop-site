import {fetchRestaurantData} from '../../lib/restaurant-query.mjs';
import {searchTomTom} from '../../lib/tomtom-places.mjs';
// GET /api/restaurants?lat=3.2&lon=101.7&radius=5000
export async function onRequestGet({request,env}){
  const url=new URL(request.url);
  try {
    const key=env?.TOMTOM_API_KEY?.trim();
    const data=key?await searchTomTom(url.searchParams,key):await fetchRestaurantData(url.searchParams);
    return new Response(JSON.stringify(data),{
      status:200,headers:{'Content-Type':'application/json; charset=utf-8',
        'Cache-Control':'no-store',
        'X-Content-Type-Options':'nosniff'}
    });
  }catch(e){
    return new Response(JSON.stringify({error:e.message||'地图服务器不可用'}),{
      status:e.status||502,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}
    });
  }
}
