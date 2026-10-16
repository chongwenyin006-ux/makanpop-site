// Shared request logic for StackBlitz local preview and Cloudflare Pages Functions.
// Data source: OpenStreetMap / public Overpass API. NOT a commercial SLA.
const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter'
];
export function getParams(params){
  const lat=Number(params.get('lat')), lon=Number(params.get('lon')),
        rawDistance=Number(params.get('radius')||5000);
  if(!Number.isFinite(lat)||!Number.isFinite(lon)||!Number.isFinite(rawDistance)||
     !params.has('lat')||!params.has('lon')||Math.abs(lat)>90||Math.abs(lon)>180||
     rawDistance<100||rawDistance>10000){
    const err = new Error('地点坐标或搜索范围无效，请重新定位');err.status=400;throw err;
  }
  // ~100m rounding: avoids unnecessarily fine-grained location in upstream query.
  return {lat:Math.round(lat*1000)/1000,lon:Math.round(lon*1000)/1000,
    radius:Math.round(rawDistance)};
}
export async function fetchRestaurantData(params, fetchFn=fetch){
  const {lat,lon,radius}=getParams(params);
  const query=`[out:json][timeout:20];nwr(around:${radius},${lat},${lon})[amenity~"^(restaurant|cafe|fast_food|food_court|ice_cream)$"][name];out center 500;`;
  let lastError;
  for(let i=0;i<ENDPOINTS.length;i++){
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),24000);
    try{
      const response=await fetchFn(ENDPOINTS[i],{
        method:'POST',
        headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8',
          'Accept':'application/json'},
        body:new URLSearchParams({data:query}), signal:controller.signal
      });
      if(!response.ok){
        const err=new Error(response.status===429?'公开地图服务忙碌或达到访问限制，请稍后再试':`地图服务错误 HTTP ${response.status}`);
        err.status=(response.status===429?503:502);
        if(response.status===429){throw Object.assign(err,{noRetry:true});}
        if(response.status<500){throw Object.assign(err,{noRetry:true});}
        throw err;
      }
      const json=await response.json();
      if(!json||!Array.isArray(json.elements))throw new Error('地图资料格式错误');
      return {elements:json.elements,source:'OpenStreetMap / Overpass',count:json.elements.length};
    }catch(e){
      lastError=e;
      if(e.noRetry)break;
      if(i===ENDPOINTS.length-1)break;
    }finally{clearTimeout(timer)}
  }
  const err=new Error(lastError?.name==='AbortError'?'地图服务回应超时，请稍后再试':lastError?.message||'无法连接到公开地图服务');
  err.status=lastError?.status||502;
  throw err;
}
