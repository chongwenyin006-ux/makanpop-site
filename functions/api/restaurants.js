import {fetchRestaurantData} from '../../lib/restaurant-query.mjs';
// GET /api/restaurants?lat=3.2&lon=101.7&radius=5000
export async function onRequestGet({request}){
  const url=new URL(request.url);
  try {
    const data=await fetchRestaurantData(url.searchParams);
    return new Response(JSON.stringify(data),{
      status:200,headers:{'Content-Type':'application/json; charset=utf-8',
        'Cache-Control':'public, max-age=900',
        'X-Content-Type-Options':'nosniff'}
    });
  }catch(e){
    return new Response(JSON.stringify({error:e.message||'地图服务器不可用'}),{
      status:e.status||502,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}
    });
  }
}
