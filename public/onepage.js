'use strict';
const $=id=>document.getElementById(id);
const LOCS=[
['PV15 · Setapak',3.202244,101.716311],['Klang / 巴生',3.044,101.445],['Bandar Bukit Tinggi',3.008,101.439],['Bandar Botanic',2.996,101.445],['Port Klang',3.007,101.389],['Setia Alam',3.109,101.461],['Bukit Raja',3.079,101.454],['Meru',3.109,101.417],['Kapar',3.138,101.378],['Pandamaran',3.019,101.412],['Kota Kemuning',3.003,101.541],['Shah Alam',3.074,101.519],['Seksyen 7 Shah Alam',3.082,101.488],['i-City',3.066,101.486],['Subang Jaya',3.049,101.586],['USJ',3.047,101.582],['Petaling Jaya',3.108,101.645],['Damansara Uptown',3.134,101.622],['Ara Damansara',3.113,101.577],['Sunway',3.072,101.605],['Puchong',3.026,101.615],['Kuala Lumpur',3.145,101.695],['Bukit Bintang',3.147,101.712],['KLCC',3.158,101.712],['Bangsar',3.129,101.671],['Mont Kiara',3.167,101.651],['Cheras',3.088,101.743],['Setapak',3.193,101.718],['Wangsa Maju',3.198,101.735],['Kepong',3.214,101.639],['Sri Petaling',3.071,101.691],['Ampang',3.151,101.764],['Kajang',2.995,101.789],['Putrajaya',2.926,101.696],['Cyberjaya',2.922,101.650],['Seremban',2.725,101.938],['Melaka',2.195,102.250],['George Town',5.414,100.328],['Butterworth',5.398,100.364],['Ipoh',4.597,101.09],['Johor Bahru',1.492,103.741],['Kota Kinabalu',5.98,116.073],['Kuching',1.554,110.359]
];
const FOOD=[
['Malay','🍛',['malay','malaysian','nasi','rendang','satay']],['Chinese','🥢',['chinese','cantonese','hokkien','dim sum','hakka']],['Indian','🍛',['indian','mamak','tamil']],['Mamak','🥘',['mamak','roti canai']],['Nasi Lemak','🍚',['nasi lemak','nasi_lemak']],['Kopitiam','☕',['kopitiam','coffee shop']],['Japanese','🍣',['japanese','sushi','ramen','udon']],['Korean','🍲',['korean','bibimbap']],['Thai','🌶️',['thai','tom yam']],['Vietnamese','🍜',['vietnamese','pho']],['Taiwanese','🧋',['taiwanese']],['Indonesian','🍢',['indonesian']],['Hotpot','🍲',['hotpot','steamboat','hot pot','shabu']],['BBQ','🥩',['bbq','barbecue','grill']],['Seafood','🦐',['seafood']],['Noodles','🍜',['noodle','ramen','laksa','mee','udon']],['Rice','🍚',['rice','nasi','biryani']],['Western','🍽️',['western','european','american','british']],['Italian','🍝',['italian','pasta']],['Burger','🍔',['burger']],['Fried Chicken','🍗',['fried chicken','chicken']],['Pizza','🍕',['pizza']],['Steak','🥩',['steak','steakhouse']],['Mexican','🌮',['mexican']],['Middle Eastern','🥙',['arab','turkish','lebanese']],['Cafe','☕',['cafe','coffee']],['Dessert','🍰',['dessert','cake','pastry','ice cream']],['Bakery','🥐',['bakery','bread']],['Bubble Tea','🧋',['bubble tea','bubble_tea']],['Vegetarian','🥗',['vegetarian','vegan']],['Ice Cream','🍦',['ice cream','gelato']],['Breakfast','🍳',['breakfast','brunch']]
];
const THEMES=[['coral','珊瑚红','#ed4b50'],['pink','樱花粉','#d96f98'],['green','抹茶绿','#4f9874'],['yellow','奶油黄','#d69a35'],['night','午夜色','#e65d67']];
const KEY='makanpop.onepage.v2';
const defaultState={location:{name:'选择位置 / Use GPS',lat:3.044,lon:101.445,kind:'unselected'},radius:5000,min:10,max:30,unknown:true,want:[],avoid:[],blacklist:[],closedReports:[],favorites:[],prices:{},theme:'coral',custom:''};
let old={};try{old=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){}
const s={...defaultState,...old,location:old.location&&Number.isFinite(old.location.lat)&&Number.isFinite(old.location.lon)?old.location:defaultState.location,places:[],cacheKey:'',recent:[],current:null,busy:false};
if(!Array.isArray(s.want))s.want=[];if(!Array.isArray(s.avoid))s.avoid=[];if(!Array.isArray(s.blacklist))s.blacklist=[];if(!Array.isArray(s.closedReports))s.closedReports=[];if(!Array.isArray(s.favorites))s.favorites=[];if(!s.prices||typeof s.prices!=='object')s.prices={};
function save(){try{const {location,radius,min,max,unknown,want,avoid,blacklist,closedReports,favorites,prices,theme,custom}=s;localStorage.setItem(KEY,JSON.stringify({location:location.kind==='gps'?defaultState.location:location,radius,min,max,unknown,want,avoid,blacklist,closedReports,favorites,prices,theme,custom}))}catch(e){}}
function esc(x){return String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function toast(msg){$('toast').textContent=msg;$('toast').classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>$('toast').classList.remove('show'),4000)}
function status(msg,error=false){$('status').textContent=msg;$('status').classList.toggle('error',error)}
function refresh(){document.body.dataset.theme=s.theme;if(s.custom)document.body.style.setProperty('--red',s.custom);else document.body.style.removeProperty('--red');$('where').textContent=s.location.name;$('money').textContent='RM '+s.min+'–'+s.max;$('radius').textContent=(s.radius/1000)+' km';save()}
function dist(a,b,c,d){const r=Math.PI/180,dlat=(c-a)*r,dlon=(d-b)*r,v=Math.sin(dlat/2)**2+Math.cos(a*r)*Math.cos(c*r)*Math.sin(dlon/2)**2;return 6371000*2*Math.atan2(Math.sqrt(v),Math.sqrt(1-v))}
function nameOf(t){return t['name:en']||t.name||t['name:ms']||t['name:zh']}
function isExplicitlyClosed(tags={}){
  const flag=value=>/^(yes|true|1)$/i.test(String(value??'').trim());
  for(const k of ['disused','abandoned','demolished','removed']){
    if(flag(tags[k]))return true;
  }
  if(['vacant','disused','closed'].includes(String(tags.shop||'').toLowerCase()))return true;
  if(['disused','abandoned','vacant'].includes(String(tags.amenity||'').toLowerCase()))return true;
  for(const k of ['status','business_status','operational_status']){
    if(['permanently_closed','closed_permanently','out_of_business','defunct','shut_down','disused','abandoned','closed'].includes(String(tags[k]||'').toLowerCase()))return true;
  }
  for(const k of ['disused:amenity','abandoned:amenity','closed:amenity','removed:amenity','demolished:amenity','was:amenity','construction:amenity','proposed:amenity']){
    if(tags[k])return true;
  }
  return ['closed','off','permanently closed'].includes(String(tags.opening_hours||'').trim().toLowerCase());
}

function normalize(raw){const seen=new Set(),out=[];for(const p of raw||[]){const t=p.tags||{},lat=Number(p.lat??p.center?.lat),lon=Number(p.lon??p.center?.lon);if(isExplicitlyClosed(t)||!Number.isFinite(lat)||!Number.isFinite(lon))continue;const name=String(nameOf(t)||'').trim(),id=String(p.type)+':'+p.id;if(!name||seen.has(id))continue;seen.add(id);const d=dist(s.location.lat,s.location.lon,lat,lon);if(d>s.radius+250)continue;out.push({id,name,lat,lon,dist:d,tags:t,address:[t['addr:place'],t['addr:unit']?'Unit '+t['addr:unit']:null,t['level:ref']?'Floor '+t['level:ref']:(t.level?'Level '+t.level:null),t['addr:housenumber'],t['addr:street'],t['addr:suburb'],t['addr:city']].filter(Boolean).join(', ')})}return out.sort((a,b)=>a.dist-b.dist)}
function foodMatch(p,id){const row=FOOD.find(x=>x[0]===id);if(!row)return false;const tags=p.tags||{},text=String(tags.cuisine||'')+' '+String(tags.name||'')+' '+String(tags['name:en']||'')+' '+String(tags.description||'');const hay=text.toLowerCase().replace(/[_;,]/g,' ');return row[2].some(word=>hay.includes(word.replace(/_/g,' ')))||(id==='Cafe'&&tags.amenity==='cafe')||(id==='Ice Cream'&&tags.amenity==='ice_cream')}
function eligible(){return s.places.filter(p=>!s.closedReports.some(x=>x.id===p.id)).filter(p=>!isExplicitlyClosed(p.tags)).filter(p=>!s.blacklist.some(x=>x.id===p.id)).filter(p=>!s.want.length||s.want.some(id=>foodMatch(p,id))).filter(p=>!s.avoid.some(id=>foodMatch(p,id))).filter(p=>{const price=Number(s.prices[p.id]);return price>0?(price>=s.min&&price<=s.max):s.unknown})}
function locationHTML(){return '<div class="section"><h3>📍 你想抽哪里的餐厅？</h3><p class="helper">人在 Klang，也可以输入 PV15、Setapak、具体地址或商场。选择手动地址后，不会使用当前 GPS。</p><div class="controlrow"><button class="secondary" data-action="gps">◎ 使用我的 GPS</button><button class="secondary" data-place="PV15 · Setapak">📍 PV15</button><button class="secondary" data-place="Klang / 巴生">📍 Klang</button></div><div class="field" style="margin-top:15px"><label for="placeInput">输入西马建筑物／街道／地址／坐标</label><input id="placeInput" list="placeList" autocomplete="street-address" placeholder="例如 PV15, Jalan Danau Saujana 1, Setapak"><datalist id="placeList">'+LOCS.map(x=>'<option value="'+esc(x[0])+'">').join('')+'</datalist></div><button class="chip" data-action="place" style="margin-top:8px">🔎 搜索这个地址 →</button><div id="addressMatches" class="address-matches" aria-live="polite"></div><p id="placeSearchState" class="helper">按搜索按钮才会查询，地址必须已收录于 OpenStreetMap；也可以粘贴纬度、经度。</p></div>'}
function foodChips(mode){return '<div class="chips">'+FOOD.map(x=>'<button class="chip '+(mode==='avoid'?'avoid':'')+'" data-food="'+esc(x[0])+'" data-mode="'+mode+'" aria-pressed="'+s[mode].includes(x[0])+'">'+x[1]+' '+esc(x[0])+'</button>').join('')+'</div>'}
function filterHTML(){return locationHTML()+'<div class="section"><h3>🍜 想吃什么？</h3><p class="helper">可多选。只有地图资料能识别的料理才可按类别准确筛选。</p>'+foodChips('want')+'</div><div class="section"><h3>🚫 今天不想吃？</h3><p class="helper">排除料理类型；公开地图没有完整食材／过敏原资料，不提供安全保证。</p>'+foodChips('avoid')+'</div><div class="section"><h3>💸 每人预算与距离</h3><div class="fieldset"><label class="field">最低预算 RM<input id="minInput" type="number" min="0" max="1000" value="'+s.min+'"></label><label class="field">最高预算 RM<input id="maxInput" type="number" min="1" max="1000" value="'+s.max+'"></label></div><div class="chips" style="margin-top:12px">'+[10,20,30,50,100].map(x=>'<button class="chip" data-budget="'+x+'">RM '+x+'</button>').join('')+'</div><div class="field" style="margin-top:16px"><label for="radiusInput">搜索半径</label><select id="radiusInput">'+[300,500,1000,3000,5000,8000,10000].map(x=>'<option value="'+x+'" '+(x===s.radius?'selected':'')+'>'+(x/1000)+' km</option>').join('')+'</select></div><label class="helper" style="display:flex;align-items:center;gap:8px;margin-top:15px"><input type="checkbox" id="unknownPrice" '+(s.unknown?'checked':'')+'>允许显示没有价格资料的真实餐厅</label><p class="helper">OpenStreetMap 通常没有菜单价钱。RM 筛选仅能核对你自己记录过的价格，不能保证其他餐厅符合预算。</p></div><div class="controlrow"><button class="secondary" data-action="clear">重置口味筛选</button></div>'}
function listHTML(type){const list=s[type];const result='<p class="helper">记录保存在你自己的浏览器，换设备不会自动同步。</p>'+(list.length?list.map(x=>'<div class="listitem"><span>'+esc(x.name)+'</span><button data-remove="'+esc(x.id)+'" data-list="'+type+'">移除</button></div>').join(''):'<p class="empty">这里暂时没有餐厅。</p>');return type==='blacklist'?result+'<div class="section"><h3>🚫 我标记为永久关闭的餐厅</h3><p class="helper">这些餐厅已在本设备的抽选中排除；尚未经过全站核实。</p>'+(s.closedReports.length?s.closedReports.map(x=>'<div class="listitem"><span>'+esc(x.name)+'</span><button data-remove="'+esc(x.id)+'" data-list="closedReports">撤销标记</button></div>').join(''):'<p class="empty">还没有标记的餐厅。</p>')+'</div>':result}
function themeHTML(){return '<div class="section"><h3>🎨 换一个心情</h3><div class="chips">'+THEMES.map(x=>'<button class="chip themechip" data-theme="'+x[0]+'" aria-pressed="'+(s.theme===x[0])+'"><span class="swatch" style="background:'+x[2]+'"></span>'+x[1]+'</button>').join('')+'</div></div><div class="section"><h3>自己选主色</h3><p class="helper">只改变界面强调色，餐厅资料不会改变。</p><input id="customColor" type="color" value="'+(s.custom||'#ed4b50')+'"><button class="chip" data-action="clear-color">恢复主题默认颜色</button></div>'}

// Static OpenStreetMap data is mirrored on the public GitHub repository.
// This allows StackBlitz users to keep searching even if its local preview proxy
// cannot deliver an asset. No paid API key or card is needed.
const DATA_MIRRORS=[
  '',
  'https://raw.githubusercontent.com/chongwenyin006-ux/makanpop-site/main/public',
  'https://cdn.jsdelivr.net/gh/chongwenyin006-ux/makanpop-site@main/public'
];
async function fetchStaticJSON(path,validator){
  const problems=[];
  for(const base of DATA_MIRRORS){
    const url=base+path;
    const ctrl=new AbortController();
    const timer=setTimeout(()=>ctrl.abort(),base?11000:5000);
    try{
      const response=await fetch(url,{signal:ctrl.signal,cache:base?'default':'no-store'});
      if(!response.ok)throw Error('HTTP '+response.status);
      const json=await response.json();
      if(!validator(json))throw Error('数据文件格式不正确');
      if(base)console.info('MakanPoP: 已从备用公开资料源恢复',base);
      return json;
    }catch(err){
      problems.push((base||'网站预览')+': '+(err.name==='AbortError'?'超时':err.message));
    }finally{clearTimeout(timer)}
  }
  const error=new Error('连接失败：网站预览及两个公开数据备用地址均不可用');
  error.details=problems;
  throw error;
}

let directory=null;
let directoryPromise=null;
const directoryLabel=x=>x.name+' ('+(x.kind==='mall'?'Mall':x.kind)+(x.city?', '+x.city:'')+')';
async function ensureDirectory(){
  if(directory)return directory;
  if(directoryPromise)return directoryPromise;
  directoryPromise=(async()=>{
    try{
      const data=await fetchStaticJSON('/data/peninsula/places.json',
        x=>Array.isArray(x?.places)&&x.places.length>0);
      directory=data.places.filter(x=>Number.isFinite(x.lat)&&Number.isFinite(x.lon)&&x.name);
      return directory;
    }catch(e){
      console.info('Peninsula place catalogue not yet ready',e.message);
      return null;
    }finally{directoryPromise=null}
  })();
  return directoryPromise;
}
function updateLocationSuggestions(query=''){
  const dl=$('placeList');if(!dl)return;
  const term=String(query||'').toLocaleLowerCase().trim();
  const candidates=(directory||[]).filter(x=>x.name.toLocaleLowerCase().includes(term)||
    x.city&&x.city.toLocaleLowerCase().includes(term))
    .slice(0,50);
  dl.innerHTML=LOCS.map(x=>'<option value="'+esc(x[0])+'"></option>').join('')+
    candidates.map(x=>'<option value="'+esc(directoryLabel(x))+'"></option>').join('');
  const state=$('placeSearchState');
  if(state)state.textContent=directory?
    '西马地区／商场索引已载入，共 '+directory.length+' 个真实地图地点。商场内商店数量取决于地图收录。':
    '西马地点索引暂未生成。仍可使用上面的预设城市或 GPS。';
}

let page='filters';
function openPanel(type){page=type;$('panelTitle').textContent=type==='filters'?'今天想吃什么？':type==='blacklist'?'我的 Blacklist':type==='favorites'?'我的收藏':'选择网站主题';$('panelContent').innerHTML=type==='filters'?filterHTML():type==='blacklist'?listHTML('blacklist'):type==='favorites'?listHTML('favorites'):themeHTML();$('panelDone').textContent=type==='filters'?'完成设置，去扭蛋 →':'完成';if(!$('panel').open)$('panel').showModal();if(type==='filters'){ensureDirectory().then(()=>updateLocationSuggestions($('placeInput')?.value||''))}}
// Address search is fully static; no external public geocoding API is used.
// A user explicitly submits their typed text, and chooses from real OSM locations.
const addressShards=new Map();
let addressMatches=[];
function addressTokens(value){
  return String(value||'').normalize('NFKC').toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu,' ').trim().split(/\s+/).filter(Boolean);
}
async function readAddressShard(first){
  if(addressShards.has(first))return addressShards.get(first);
  const data=await fetchStaticJSON('/data/peninsula/address-index/'+first+'.json',
    x=>Array.isArray(x?.addresses));
  const list=data.addresses.filter(x=>Number.isFinite(x.lat)&&Number.isFinite(x.lon));
  addressShards.set(first,list);
  return list;
}
function applyLocation(item,kind='address'){
  s.location={name:item.name,lat:item.lat,lon:item.lon,kind};
  s.cacheKey='';s.places=[];s.recent=[];
  refresh();status('已选择 '+item.name+'，现在可以抽这里附近的真实餐厅。');
  if($('panel').open)openPanel('filters');
  toast('搜索地点：'+item.name+' · 与你目前 GPS 位置无关');
}
async function searchAddress(query){
  const text=String(query||'').trim();
  if(text.length<2){toast('请输入至少两个字的地址或建筑物名称');return true;}
  // Explicit coordinates can be pasted from a map, even where an address has
  // not yet been mapped as a searchable building/road.
  const pair=text.match(/^\s*(-?\d{1,2}\.\d+)\s*[,，]\s*(-?\d{2,3}\.\d+)\s*$/);
  if(pair){
    const lat=Number(pair[1]),lon=Number(pair[2]);
    if(!(lat>=1&&lat<=7.5&&lon>=99&&lon<=105.3)){
      toast('仅支持西马经纬度，例：3.20209, 101.71627');return true;
    }
    applyLocation({name:lat.toFixed(5)+', '+lon.toFixed(5),lat,lon});
    return true;
  }
  if(/\bpv\s*15\b|platinum\s+victory\s*15/i.test(text)){
    applyLocation({name:'PV15 · Setapak, Kuala Lumpur',lat:3.20209,lon:101.71627});
    return true;
  }
  const tokens=addressTokens(text);
  if(!tokens.length)return false;
  // Road/address terms such as 'Jalan' or house numbers are not useful
  // shard keys. Use distinctive building/street words, like 'Danau'.
  const commonWords=new Set(['jalan','jln','lorong','persiaran','taman','kampung',
    'kg','no','lot','unit','block','blok','jalanraya','jalanr','street',
    'road','rd','apartment','apartments']);
  const useful=tokens.filter(x=>!commonWords.has(x)&&!/^\d+[a-z]?$/.test(x));
  const choices=useful.length?useful:tokens;
  const firsts=[...new Set(choices.slice(0,4)
    .map(t=>/^[a-z0-9]+$/.test(t)?t.slice(0,3):'other'))];
  if($('placeSearchState'))$('placeSearchState').textContent='正在从西马地址索引寻找匹配…';
  let rows=[];
  for(const letter of firsts){
    try{rows.push(...await readAddressShard(letter));}
    catch(err){console.info('Address shard not available:',letter,err.message);}
  }
  if(!rows.length){
    if($('placeSearchState'))$('placeSearchState').textContent='地址资料暂未准备好。可以改用已知地点、PV15 或经纬度。';
    return false;
  }
  const scored=[];
  for(const x of rows){
    const full=[x.n,x.a,x.s,x.c,x.p].filter(Boolean).join(' ');
    const hay=addressTokens(full).join(' ');
    const name=addressTokens(x.n).join(' ');
    if(!name)continue;
    const queryNorm=tokens.join(' ');
    const every=tokens.every(t=>hay.includes(t));
    if(!every&&!name.includes(queryNorm))continue;
    let score=name===queryNorm?120:name.startsWith(queryNorm)?100:
      name.includes(queryNorm)?90:every?60:0;
    if(x.a&&addressTokens(x.a).join(' ').includes(queryNorm))score+=15;
    if(x.p&&tokens.includes(x.p))score+=12;
    if(!score)continue;
    scored.push({x,score});
  }
  scored.sort((a,b)=>b.score-a.score||a.x.n.length-b.x.n.length);
  addressMatches=scored.slice(0,9).map(v=>({
    name:[v.x.n,v.x.a?v.x.a:null,v.x.c?v.x.c:null].filter(Boolean).join(' · '),
    lat:v.x.lat,lon:v.x.lon
  }));
  const box=$('addressMatches');
  if(box){
    if(addressMatches.length){
      box.innerHTML='<p class="helper">找到以下真实地图地址，请选择正确地点：</p>'+
        addressMatches.map((m,i)=>'<button type="button" class="address-result" data-address-index="'+i+'">📍 '+esc(m.name)+' <span>→</span></button>').join('');
      $('placeSearchState').textContent='不是所有门牌都有地图资料；请选择与目标一致的结果。';
    }else{
      box.innerHTML='<p class="helper">未找到这条完整地址。试试街道或建筑物名称，也可以输入经纬度。</p>';
      $('placeSearchState').textContent='OpenStreetMap 未收录的地址暂时无法自动定位。';
    }
  }
  return true;
}
async function choosePlace(q){
  const term=String(q||'').trim().toLowerCase();
  if(!term){toast('请输入西马城市或商场名称');return}
  const loc=LOCS.find(x=>x[0].toLowerCase()===term)||
    LOCS.find(x=>x[0].toLowerCase().includes(term)&&term.length>=3);
  let selected=loc?{name:loc[0],lat:loc[1],lon:loc[2]}:null;
  if(!selected){
    const results=await ensureDirectory();
    const match=results?.find(x=>directoryLabel(x).toLowerCase()===term)||
      results?.find(x=>x.name.toLowerCase()===term)||
      results?.find(x=>x.name.toLowerCase().includes(term)&&term.length>=4);
    if(match){selected={name:match.name+(match.kind==='mall'?' · Mall':''),lat:match.lat,lon:match.lon};if(match.kind==='mall'){s.radius=500;toast('已选购物商场；先显示商场周边 500m 地点。店铺是否在商场内部以地图标记为准。')}}
  }
  if(!selected){await searchAddress(q);return}
  applyLocation(selected,'address');
}
async function gps(){if(!window.isSecureContext||!navigator.geolocation){toast('GPS 需要 HTTPS 和浏览器定位权限。');return}status('正在请求位置权限…');try{const pos=await new Promise((ok,fail)=>navigator.geolocation.getCurrentPosition(ok,fail,{enableHighAccuracy:false,timeout:16000,maximumAge:300000}));s.location={name:'我的 GPS 位置',lat:pos.coords.latitude,lon:pos.coords.longitude,kind:'gps'};s.cacheKey='';s.places=[];s.recent=[];refresh();if($('panel').open)openPanel('filters');status('GPS 定位成功，点击 START GACHA 获取附近餐厅');toast('定位成功！')}catch(e){const msg=e.code===1?'定位权限被拒绝，请允许浏览器使用位置':e.code===2?'目前无法获取设备位置':e.code===3?'GPS 定位超时':'定位失败';status(msg,true);toast(msg)}}
function key(){return [s.location.lat.toFixed(3),s.location.lon.toFixed(3),s.radius].join(':')}

let nationalManifest=null;
let nationalPromise=null;
let nationalLastAttempt=0;
async function ensureNationalManifest(){
  if(nationalManifest)return nationalManifest;
  if(nationalPromise)return nationalPromise;
  if(Date.now()-nationalLastAttempt<60000)return null;
  nationalLastAttempt=Date.now();
  nationalPromise=(async()=>{
    try{
      const m=await fetchStaticJSON('/data/peninsula/manifest.json',
        x=>Array.isArray(x?.tiles)&&x.tiles.length>=20&&Number.isFinite(x.tileSize));
      nationalManifest={...m,tileSet:new Set(m.tiles)};
      return nationalManifest;
    }catch(e){console.info('Nationwide catalogue not ready:',e.message);return null}
    finally{nationalPromise=null}
  })();
  return nationalPromise;
}
async function loadPeninsulaFood(k){
  const manifest=await ensureNationalManifest();
  if(!manifest)return false;
  // Fetch only tiles intersecting the requested search circle's bounding box.
  // At 500m most searches need one tile rather than nine.
  const halfLat=s.radius/110574;
  const halfLon=s.radius/(111320*Math.max(0.05,Math.cos(s.location.lat*Math.PI/180)));
  const keys=[];
  for(let a=Math.floor((s.location.lat-halfLat)/manifest.tileSize);a<=Math.floor((s.location.lat+halfLat)/manifest.tileSize);a++){
    for(let b=Math.floor((s.location.lon-halfLon)/manifest.tileSize);b<=Math.floor((s.location.lon+halfLon)/manifest.tileSize);b++){
      const cell='t'+a+'_'+b;
      if(manifest.tileSet.has(cell))keys.push(cell);
    }
  }
  if(!keys.length)return false;
  status('正在读取附近 '+keys.length+' 个真实餐厅数据分区…');
  const results=await Promise.allSettled(keys.map(cell=>
    fetchStaticJSON('/data/peninsula/'+cell+'.json',x=>Array.isArray(x?.elements))
  ));
  const successful=results.filter(x=>x.status==='fulfilled');
  if(!successful.length){
    const reason=results.map((x,i)=>keys[i]+': '+x.reason?.message).join(' | ');
    throw Error('附近餐厅文件均无法读取：'+reason);
  }
  const dedup=new Map();
  for(const result of successful)for(const p of result.value.elements)dedup.set(p.type+':'+p.id,p);
  const partial=successful.length<keys.length;
  useRestaurantData([...dedup.values()],k,
    '西马真实地图资料（更新于 '+new Date(manifest.generatedAt).toLocaleDateString('zh-MY')+'）'+(partial?'，部分地区资料未加载':''));
  if(partial)toast('部分餐厅数据分区加载失败，当前结果可能不完整。');
  writeRestaurantCache(k,[...dedup.values()]);
  return true;
}

const CACHE_PREFIX='makanpop.osm.lookup.v1.';
function readRestaurantCache(k,maxAge=7*86400000){
  try{
    const item=JSON.parse(localStorage.getItem(CACHE_PREFIX+k)||'null');
    if(item&&Array.isArray(item.elements)&&Number.isFinite(item.at)&&Date.now()-item.at<maxAge)return item;
  }catch(e){}
  return null;
}
function writeRestaurantCache(k,elements){
  try{localStorage.setItem(CACHE_PREFIX+k,JSON.stringify({at:Date.now(),elements:elements.slice(0,300)}))}catch(e){}
}
async function fetchJsonWithDeadline(url,ms,opts={}){
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),ms);
  try{
    const response=await fetch(url,{...opts,signal:ctrl.signal,cache:'no-store'});
    if(!response.ok){
      let message='HTTP '+response.status;
      try{const result=await response.json();message=result.error||message}catch(e){}
      throw Error(message);
    }
    const json=await response.json();
    if(!json||!Array.isArray(json.elements))throw Error('餐厅资料格式不正确');
    return json;
  }finally{clearTimeout(timer)}
}
function useRestaurantData(elements,k,label){
  s.places=normalize(elements);s.cacheKey=k;s.recent=[];
  status(label+'：找到 '+s.places.length+' 家真实餐厅记录');
  return true;
}
async function fetchPlaces(){
  const k=key();
  if(s.location.lon>105.3||s.location.lat>7.5||s.location.lat<1||s.location.lon<99){
    status('目前只支持西马（不包括 Sabah、Sarawak 和 Labuan），请改用西马地区。',true);
    return false;
  }
  try{if(await loadPeninsulaFood(k))return true;}catch(e){console.warn('MakanPoP 西马数据连接问题:',e.message,e.details||'');status('西马资料连接未成功，正在尝试其他方式…',true);}

  if(s.cacheKey===k&&s.places.length)return true;
  // A short-term cache avoids repeatedly loading public Overpass servers.
  // Klang snapshot is a real OSM extract prepared once, then served as a static file.
  // Only use it when its geographic coverage contains the entire requested search circle.
  const snapshotCenter={lat:3.044,lon:101.445},snapshotRadius=14500;
  const eligibleForSnapshot=dist(s.location.lat,s.location.lon,snapshotCenter.lat,snapshotCenter.lon)+s.radius<=snapshotRadius;
  if(eligibleForSnapshot){
    try{
      const snapshot=await fetchJsonWithDeadline('/data/klang-restaurants.json',7000);
      if(snapshot.elements.length>=20){
        const date=snapshot.generatedAt?new Date(snapshot.generatedAt).toLocaleDateString('zh-MY'):'日期未知';
        const result=useRestaurantData(snapshot.elements,k,'Klang 实际 OpenStreetMap 餐厅资料（更新于 '+date+'）');
        // Keep a local backup if the static file becomes temporarily unavailable.
        writeRestaurantCache(k,snapshot.elements);
        return result;
      }
    }catch(e){console.info('Klang static data not available; using live lookup:',e.message)}
  }
  const fresh=readRestaurantCache(k,30*60000);
  if(fresh)return useRestaurantData(fresh.elements,k,'已读取最近缓存的地图资料');
  const q=new URLSearchParams({lat:s.location.lat,lon:s.location.lon,radius:s.radius});
  const errors=[];
  status('正在查找 '+s.location.name+' 的真实餐厅…');
  try{
    const data=await fetchJsonWithDeadline('/api/restaurants?'+q.toString(),25000);
    writeRestaurantCache(k,data.elements);
    return useRestaurantData(data.elements,k,'地图查询成功');
  }catch(e){errors.push('站内接口 '+e.message)}
  // StackBlitz WebContainers can fail when proxying cross-origin server requests.
  // Browsers are allowed to query Overpass directly with CORS, subject to limits.
  const query='[out:json][timeout:15];nwr(around:'+s.radius+','+
    (Math.round(s.location.lat*1000)/1000)+','+
    (Math.round(s.location.lon*1000)/1000)+
    ')[amenity~"^(restaurant|cafe|fast_food|food_court|ice_cream)$"][name];out center 450;';
  const endpoints=[
    'https://overpass.private.coffee/api/interpreter',
    'https://overpass-api.de/api/interpreter'
  ];
  for(const endpoint of endpoints){
    status('站内连接失败，正在尝试备用地图查询…');
    try{
      const url=endpoint+'?data='+encodeURIComponent(query);
      const data=await fetchJsonWithDeadline(url,15000,{mode:'cors',credentials:'omit'});
      writeRestaurantCache(k,data.elements);
      return useRestaurantData(data.elements,k,'备用地图查询成功');
    }catch(e){errors.push('备用服务 '+e.message)}
  }
  const previous=readRestaurantCache(k);
  if(previous){
    const stamp=new Date(previous.at).toLocaleString('zh-MY');
    useRestaurantData(previous.elements,k,'当前地图服务不可用，使用之前获取的真实餐厅缓存');
    toast('当前网络查询失败，已使用 '+stamp+' 保存的地图记录。餐厅资料可能已变动。');
    return true;
  }
  s.places=[];s.cacheKey='';
  const message='餐厅资料暂时连不上。请打开独立预览页重新试；如果整个网页都打不开，请换一个浏览器。';
  status(message,true);
  toast(message);
  console.warn('MakanPoP restaurant lookup failed:',errors.join(' | '));
  return false;
}

function wait(ms){return new Promise(r=>setTimeout(r,ms))}
async function spin(){if(s.busy)return;if(s.location.kind==='unselected'){openPanel('filters');toast('先用 GPS 定位，或输入你想搜的西马城市／商场');return;}s.busy=true;$('spin').disabled=true;$('spin').textContent='正在寻找美食…';try{if(!(await fetchPlaces()))return;const candidates=eligible();if(!candidates.length){const txt=s.places.length?'没有符合当前筛选的餐厅。试试取消食物偏好、扩大预算或允许未知价格。':'这个范围没有取得餐厅记录。试试增加搜索距离或换一个地点。';status(txt,true);toast(txt);return}const unseen=candidates.filter(x=>!s.recent.includes(x.id));const pool=unseen.length?unseen:candidates;const p=pool[Math.floor(Math.random()*pool.length)];s.recent=[p.id,...s.recent].slice(0,Math.min(6,candidates.length-1));s.current=p;const machine=$('machine');machine.classList.add('spinning');status('转出一颗美食胶囊中…');await wait(1850);machine.classList.remove('spinning');result(p);status('抽中了 '+p.name+' · 来自真实地图资料')}finally{$('machine').classList.remove('spinning');s.busy=false;$('spin').disabled=false;$('spin').textContent='◉ START GACHA ↗'}}
function result(p){window.MakanPoPPhotos?.show(p);$('osmPlaceLink').href='https://www.openstreetmap.org/'+encodeURIComponent(p.id.split(':')[0])+'/'+encodeURIComponent(p.id.split(':')[1]);$('photosSearchLink').href='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(p.name+', '+(p.address||'')+', '+p.lat+','+p.lon);const cuisine=String(p.tags.cuisine||'').replaceAll(';',' / ')||({cafe:'咖啡馆',fast_food:'快餐',restaurant:'餐厅',food_court:'美食广场',ice_cream:'冰淇淋'}[p.tags.amenity]||'餐饮地点');$('resultName').textContent=p.name;$('resultType').textContent=cuisine;$('resultDist').textContent=(p.dist/1000).toFixed(1)+' km';$('resultAddress').textContent=p.address||'地图坐标 '+p.lat.toFixed(5)+', '+p.lon.toFixed(5);const price=Number(s.prices[p.id]);$('resultPrice').textContent=price>0?'你记录的人均 RM'+price:'价格未知';$('resultNote').textContent=price>0?'这是你自己的消费记录，不是餐厅官方菜单报价。':'OpenStreetMap 没有提供可核实的菜单价格；当前预算可能不匹配。';$('navLink').href='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(p.lat+','+p.lon);$('favAction').textContent=s.favorites.some(x=>x.id===p.id)?'♥ 已收藏':'♡ 收藏';$('blackAction').textContent=s.blacklist.some(x=>x.id===p.id)?'✓ 已 Blacklist':'⊘ Blacklist';$('spendForm').hidden=true;$('result').showModal()}
function toggleList(type){const p=s.current;if(!p)return;const already=s[type].some(x=>x.id===p.id);s[type]=already?s[type].filter(x=>x.id!==p.id):[...s[type],{id:p.id,name:p.name}];save();if(type==='blacklist'&&!already){$('result').close();toast(p.name+' 已加入 Blacklist，以后不会抽中')}else{toast(already?'已从列表移除':'已收藏');resultUpdateActions()}}
function resultUpdateActions(){if(!s.current)return;$('favAction').textContent=s.favorites.some(x=>x.id===s.current.id)?'♥ 已收藏':'♡ 收藏';$('blackAction').textContent=s.blacklist.some(x=>x.id===s.current.id)?'✓ 已 Blacklist':'⊘ Blacklist'}
$('openFilters').onclick=()=>openPanel('filters');$('openBlack').onclick=()=>openPanel('blacklist');$('openThemes').onclick=()=>openPanel('themes');$('openPrefs').onclick=()=>openPanel('filters');document.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>openPanel('filters')));$('closePanel').onclick=()=>$('panel').close();$('panelDone').onclick=()=>{$('panel').close();if(page==='filters')spin()};$('panelContent').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.food){const type=b.dataset.mode,id=b.dataset.food;const other=type==='want'?'avoid':'want';s[type]=s[type].includes(id)?s[type].filter(x=>x!==id):[...s[type],id];s[other]=s[other].filter(x=>x!==id);save();openPanel('filters');return}if(b.dataset.place){choosePlace(b.dataset.place);return}if(b.dataset.budget){s.max=Number(b.dataset.budget);s.min=Math.min(s.min,s.max);refresh();openPanel('filters');return}if(b.dataset.theme){s.theme=b.dataset.theme;s.custom='';refresh();openPanel('themes');return}if(b.dataset.remove){s[b.dataset.list]=s[b.dataset.list].filter(x=>x.id!==b.dataset.remove);save();openPanel(page);return}if(b.dataset.action==='place'){choosePlace($('placeInput').value);return}if(b.dataset.addressIndex!==undefined){const match=addressMatches[Number(b.dataset.addressIndex)];if(match)applyLocation(match);return}if(b.dataset.action==='gps'){gps();return}if(b.dataset.action==='clear'){s.want=[];s.avoid=[];refresh();openPanel('filters');return}if(b.dataset.action==='clear-color'){s.custom='';refresh();openPanel('themes')}});
$('panelContent').addEventListener('change',e=>{const el=e.target;if(el.id==='radiusInput'){s.radius=Number(el.value);s.cacheKey='';s.places=[]}if(el.id==='minInput'){s.min=Math.max(0,Math.min(1000,Number(el.value)||0))}if(el.id==='maxInput'){s.max=Math.min(1000,Math.max(s.min,Number(el.value)||1))}if(el.id==='unknownPrice')s.unknown=el.checked;if(el.id==='customColor')s.custom=el.value;refresh()});
$('panelContent').addEventListener('input',e=>{if(e.target.id==='placeInput')updateLocationSuggestions(e.target.value)});
$('panelContent').addEventListener('keydown',e=>{if(e.target.id==='placeInput'&&e.key==='Enter'){e.preventDefault();choosePlace(e.target.value)}});
$('spin').onclick=spin;
const knobButton=$('knob');
let knobDrag=null,knobRotation=0,suppressKnobClick=false;
function pointerKnobAngle(e){
  const rect=knobButton.getBoundingClientRect();
  return Math.atan2(e.clientY-(rect.top+rect.height/2),
                    e.clientX-(rect.left+rect.width/2));
}
knobButton.addEventListener('pointerdown',e=>{
  if(s.busy)return;
  knobDrag={id:e.pointerId,last:pointerKnobAngle(e),travel:0,
    downX:e.clientX,downY:e.clientY};
  knobButton.setPointerCapture?.(e.pointerId);
});
knobButton.addEventListener('pointermove',e=>{
  if(!knobDrag||knobDrag.id!==e.pointerId||s.busy)return;
  const angle=pointerKnobAngle(e);
  let delta=angle-knobDrag.last;
  while(delta>Math.PI)delta-=2*Math.PI;
  while(delta<-Math.PI)delta+=2*Math.PI;
  knobDrag.last=angle;
  knobDrag.travel+=Math.abs(delta);
  knobRotation+=delta*180/Math.PI;
  knobButton.style.setProperty('--dial-angle',knobRotation.toFixed(1)+'deg');
});
knobButton.addEventListener('pointerup',e=>{
  if(!knobDrag||knobDrag.id!==e.pointerId)return;
  const moved=Math.hypot(e.clientX-knobDrag.downX,e.clientY-knobDrag.downY);
  const turn=knobDrag.travel;
  knobDrag=null;
  if(moved>9){
    suppressKnobClick=true;
    if(turn>1.15){navigator.vibrate?.(18);spin()}
    else toast('再转动把手一点，就能出扭蛋！');
    setTimeout(()=>{suppressKnobClick=false},0);
  }
});
knobButton.addEventListener('pointercancel',()=>{knobDrag=null});
knobButton.onclick=()=>{
  if(suppressKnobClick||s.busy)return;
  knobRotation+=180;
  knobButton.style.setProperty('--dial-angle',knobRotation+'deg');
  navigator.vibrate?.(13);
  spin();
};
$('reportClosed').onclick=()=>{
  const p=s.current;
  if(!p)return;
  if(!window.confirm('确定这家餐厅已经永久关闭吗？\n确认后只会从你当前设备的扭蛋中排除；不会直接修改全站地图资料。'))return;
  if(!s.closedReports.some(x=>x.id===p.id))s.closedReports.push({id:p.id,name:p.name,at:Date.now()});
  save();$('result').close();window.MakanPoPPhotos?.reset();
  toast('已从此设备的未来扭蛋中排除 '+p.name+'。如需全站更新，可在 OpenStreetMap 提交核实的修正。');
};
$('personalPhotoInput').addEventListener('change',async e=>{
  const file=e.target.files?.[0];e.target.value='';
  if(!file||!s.current)return;
  try{
    await window.MakanPoPPhotos.savePersonalPhoto(s.current,file);
    toast('餐厅实拍照已保存至你的浏览器，只有你在这台设备可以看到。');
  }catch(err){
    toast('无法储存这张实拍照片：'+(err?.message||'请换一张图片'));
  }
});
$('closeResult').onclick=()=>$('result').close();$('reroll').onclick=()=>{$('result').close();window.MakanPoPPhotos?.reset();spin()};$('favAction').onclick=()=>toggleList('favorites');$('blackAction').onclick=()=>toggleList('blacklist');$('spendAction').onclick=()=>{$('spendForm').hidden=!$('spendForm').hidden};$('saveSpend').onclick=()=>{const price=Number($('spendInput').value);if(!(price>0&&price<=1000)){toast('请输入 RM1–RM1000 的金额');return}if(!s.current)return;s.prices[s.current.id]=price;save();$('resultPrice').textContent='你记录的人均 RM'+price;$('resultNote').textContent='这是你的个人消费记录，不是官方菜单价格。';$('spendForm').hidden=true;toast('保存成功！')};
refresh();status(s.location.kind==='unselected'?'先选择西马位置或使用 GPS，再开始扭蛋':'已选择 '+s.location.name+' · 点击 START GACHA');
