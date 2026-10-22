// Deliberately never returns the secret API key or user credentials.
export async function onRequestGet({env}){
  const enabled=Boolean(env?.TOMTOM_API_KEY?.trim());
  return new Response(JSON.stringify({
    provider:enabled?'tomtom':'osm',
    tomtomEnabled:enabled,
    message:enabled?'TomTom 已配置，可查询 Places 地点（非营业实时验证）':
      'TomTom 尚未配置 API Key，目前仅能查询旧 OSM 数据'
  }),{status:200,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
}
