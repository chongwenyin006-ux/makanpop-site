'use strict';
const $=id=>document.getElementById(id);
const LOCS=[
['Klang / 巴生',3.044,101.445],['Bandar Bukit Tinggi',3.008,101.439],['Bandar Botanic',2.996,101.445],['Port Klang',3.007,101.389],['Setia Alam',3.109,101.461],['Bukit Raja',3.079,101.454],['Meru',3.109,101.417],['Kapar',3.138,101.378],['Pandamaran',3.019,101.412],['Kota Kemuning',3.003,101.541],['Shah Alam',3.074,101.519],['Seksyen 7 Shah Alam',3.082,101.488],['i-City',3.066,101.486],['Subang Jaya',3.049,101.586],['USJ',3.047,101.582],['Petaling Jaya',3.108,101.645],['Damansara Uptown',3.134,101.622],['Ara Damansara',3.113,101.577],['Sunway',3.072,101.605],['Puchong',3.026,101.615],['Kuala Lumpur',3.145,101.695],['Bukit Bintang',3.147,101.712],['KLCC',3.158,101.712],['Bangsar',3.129,101.671],['Mont Kiara',3.167,101.651],['Cheras',3.088,101.743],['Setapak',3.193,101.718],['Wangsa Maju',3.198,101.735],['Kepong',3.214,101.639],['Sri Petaling',3.071,101.691],['Ampang',3.151,101.764],['Kajang',2.995,101.789],['Putrajaya',2.926,101.696],['Cyberjaya',2.922,101.650],['Seremban',2.725,101.938],['Melaka',2.195,102.250],['George Town',5.414,100.328],['Butterworth',5.398,100.364],['Ipoh',4.597,101.09],['Johor Bahru',1.492,103.741],['Kota Kinabalu',5.98,116.073],['Kuching',1.554,110.359]
];
const FOOD=[
['Malay','🍛',['malay','malaysian','nasi','rendang','satay']],['Chinese','🥢',['chinese','cantonese','hokkien','dim sum','hakka']],['Indian','🍛',['indian','mamak','tamil']],['Mamak','🥘',['mamak','roti canai']],['Nasi Lemak','🍚',['nasi lemak','nasi_lemak']],['Kopitiam','☕',['kopitiam','coffee shop']],['Japanese','🍣',['japanese','sushi','ramen','udon']],['Korean','🍲',['korean','bibimbap']],['Thai','🌶️',['thai','tom yam']],['Vietnamese','🍜',['vietnamese','pho']],['Taiwanese','🧋',['taiwanese']],['Indonesian','🍢',['indonesian']],['Hotpot','🍲',['hotpot','steamboat','hot pot','shabu']],['BBQ','🥩',['bbq','barbecue','grill']],['Seafood','🦐',['seafood']],['Noodles','🍜',['noodle','ramen','laksa','mee','udon']],['Rice','🍚',['rice','nasi','biryani']],['Western','🍽️',['western','european','american','british']],['Italian','🍝',['italian','pasta']],['Burger','🍔',['burger']],['Fried Chicken','🍗',['fried chicken','chicken']],['Pizza','🍕',['pizza']],['Steak','🥩',['steak','steakhouse']],['Mexican','🌮',['mexican']],['Middle Eastern','🥙',['arab','turkish','lebanese']],['Cafe','☕',['cafe','coffee']],['Dessert','🍰',['dessert','cake','pastry','ice cream']],['Bakery','🥐',['bakery','bread']],['Bubble Tea','🧋',['bubble tea','bubble_tea']],['Vegetarian','🥗',['vegetarian','vegan']],['Ice Cream','🍦',['ice cream','gelato']],['Breakfast','🍳',['breakfast','brunch']]
];
const THEMES=[['coral','珊瑚红','#ed4b50'],['pink','樱花粉','#d96f98'],['green','抹茶绿','#4f9874'],['yellow','奶油黄','#d69a35'],['night','午夜色','#e65d67']];
const KEY='makanpop.onepage.v2';
const defaultState={location:{name:'Klang / 巴生',lat:3.044,lon:101.445,kind:'preset'},radius:5000,min:10,max:30,unknown:true,want:[],avoid:[],blacklist:[],favorites:[],prices:{},theme:'coral',custom:''};
let old={};try{old=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){}
const s={...defaultState,...old,location:old.location&&Number.isFinite(old.location.lat)&&Number.isFinite(old.location.lon)?old.location:defaultState.location,places:[],cacheKey:'',recent:[],current:null,busy:false};
if(!Array.isArray(s.want))s.want=[];if(!Array.isArray(s.avoid))s.avoid=[];if(!Array.isArray(s.blacklist))s.blacklist=[];if(!Array.isArray(s.favorites))s.favorites=[];if(!s.prices||typeof s.prices!=='object')s.prices={};
function save(){try{const {location,radius,min,max,unknown,want,avoid,blacklist,favorites,prices,theme,custom}=s;localStorage.setItem(KEY,JSON.stringify({location:location.kind==='gps'?defaultState.location:location,radius,min,max,unknown,want,avoid,blacklist,favorites,prices,theme,custom}))}catch(e){}}
function esc(x){return String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function toast(msg){$('toast').textContent=msg;$('toast').classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>$('toast').classList.remove('show'),4000)}
function status(msg,error=false){$('status').textContent=msg;$('status').classList.toggle('error',error)}
function refresh(){document.body.dataset.theme=s.theme;if(s.custom)document.body.style.setProperty('--red',s.custom);else document.body.style.removeProperty('--red');$('where').textContent=s.location.name;$('money').textContent='RM '+s.min+'–'+s.max;$('radius').textContent=(s.radius/1000)+' km';save()}
function dist(a,b,c,d){const r=Math.PI/180,dlat=(c-a)*r,dlon=(d-b)*r,v=Math.sin(dlat/2)**2+Math.cos(a*r)*Math.cos(c*r)*Math.sin(dlon/2)**2;return 6371000*2*Math.atan2(Math.sqrt(v),Math.sqrt(1-v))}
function nameOf(t){return t['name:en']||t.name||t['name:ms']||t['name:zh']}
function normalize(raw){const seen=new Set(),out=[];for(const p of raw||[]){const t=p.tags||{},lat=Number(p.lat??p.center?.lat),lon=Number(p.lon??p.center?.lon);if(!Number.isFinite(lat)||!Number.isFinite(lon))continue;const name=String(nameOf(t)||'').trim(),id=String(p.type)+':'+p.id;if(!name||seen.has(id))continue;seen.add(id);const d=dist(s.location.lat,s.location.lon,lat,lon);if(d>s.radius+250)continue;out.push({id,name,lat,lon,dist:d,tags:t,address:[t['addr:housenumber'],t['addr:street'],t['addr:suburb'],t['addr:city']].filter(Boolean).join(', ')})}return out.sort((a,b)=>a.dist-b.dist)}
function foodMatch(p,id){const row=FOOD.find(x=>x[0]===id);if(!row)return false;const tags=p.tags||{},text=String(tags.cuisine||'')+' '+String(tags.name||'')+' '+String(tags['name:en']||'')+' '+String(tags.description||'');const hay=text.toLowerCase().replace(/[_;,]/g,' ');return row[2].some(word=>hay.includes(word.replace(/_/g,' ')))||(id==='Cafe'&&tags.amenity==='cafe')||(id==='Ice Cream'&&tags.amenity==='ice_cream')}
function eligible(){return s.places.filter(p=>!s.blacklist.some(x=>x.id===p.id)).filter(p=>!s.want.length||s.want.some(id=>foodMatch(p,id))).filter(p=>!s.avoid.some(id=>foodMatch(p,id))).filter(p=>{const price=Number(s.prices[p.id]);return price>0?(price>=s.min&&price<=s.max):s.unknown})}
function locationHTML(){return '<div class="section"><h3>📍 今天在哪一区？</h3><p class="helper">默认 Klang。也可以选择其他地区或在 HTTPS 页面使用 GPS。</p><div class="controlrow"><button class="secondary" data-action="gps">◎ 使用我的位置</button><button class="secondary" data-place="Klang / 巴生">📍 Klang / 巴生</button></div><div class="field" style="margin-top:15px"><label for="placeInput">搜索马来西亚地区</label><input id="placeInput" list="placeList" placeholder="Klang、Setia Alam、Setapak…"><datalist id="placeList">'+LOCS.map(x=>'<option value="'+esc(x[0])+'">').join('')+'</datalist></div><button class="chip" data-action="place" style="margin-top:8px">选择这个地区 →</button><p class="helper">目前支持列表中的地区。其他地点可以使用 GPS，不会凭空生成餐厅。</p></div>'}
function foodChips(mode){return '<div class="chips">'+FOOD.map(x=>'<button class="chip '+(mode==='avoid'?'avoid':'')+'" data-food="'+esc(x[0])+'" data-mode="'+mode+'" aria-pressed="'+s[mode].includes(x[0])+'">'+x[1]+' '+esc(x[0])+'</button>').join('')+'</div>'}
function filterHTML(){return locationHTML()+'<div class="section"><h3>🍜 想吃什么？</h3><p class="helper">可多选。只有地图资料能识别的料理才可按类别准确筛选。</p>'+foodChips('want')+'</div><div class="section"><h3>🚫 今天不想吃？</h3><p class="helper">排除料理类型；公开地图没有完整食材／过敏原资料，不提供安全保证。</p>'+foodChips('avoid')+'</div><div class="section"><h3>💸 每人预算与距离</h3><div class="fieldset"><label class="field">最低预算 RM<input id="minInput" type="number" min="0" max="1000" value="'+s.min+'"></label><label class="field">最高预算 RM<input id="maxInput" type="number" min="1" max="1000" value="'+s.max+'"></label></div><div class="chips" style="margin-top:12px">'+[10,20,30,50,100].map(x=>'<button class="chip" data-budget="'+x+'">RM '+x+'</button>').join('')+'</div><div class="field" style="margin-top:16px"><label for="radiusInput">搜索半径</label><select id="radiusInput">'+[1000,3000,5000,8000,10000].map(x=>'<option value="'+x+'" '+(x===s.radius?'selected':'')+'>'+(x/1000)+' km</option>').join('')+'</select></div><label class="helper" style="display:flex;align-items:center;gap:8px;margin-top:15px"><input type="checkbox" id="unknownPrice" '+(s.unknown?'checked':'')+'>允许显示没有价格资料的真实餐厅</label><p class="helper">OpenStreetMap 通常没有菜单价钱。RM 筛选仅能核对你自己记录过的价格，不能保证其他餐厅符合预算。</p></div><div class="controlrow"><button class="secondary" data-action="clear">重置口味筛选</button></div>'}
function listHTML(type){const list=s[type];return '<p class="helper">记录保存在你自己的浏览器，换设备不会自动同步。</p>'+(list.length?list.map(x=>'<div class="listitem"><span>'+esc(x.name)+'</span><button data-remove="'+esc(x.id)+'" data-list="'+type+'">移除</button></div>').join(''):'<p class="empty">这里暂时没有餐厅。</p>')}
function themeHTML(){return '<div class="section"><h3>🎨 换一个心情</h3><div class="chips">'+THEMES.map(x=>'<button class="chip themechip" data-theme="'+x[0]+'" aria-pressed="'+(s.theme===x[0])+'"><span class="swatch" style="background:'+x[2]+'"></span>'+x[1]+'</button>').join('')+'</div></div><div class="section"><h3>自己选主色</h3><p class="helper">只改变界面强调色，餐厅资料不会改变。</p><input id="customColor" type="color" value="'+(s.custom||'#ed4b50')+'"><button class="chip" data-action="clear-color">恢复主题默认颜色</button></div>'}
let page='filters';
function openPanel(type){page=type;$('panelTitle').textContent=type==='filters'?'今天想吃什么？':type==='blacklist'?'我的 Blacklist':type==='favorites'?'我的收藏':'选择网站主题';$('panelContent').innerHTML=type==='filters'?filterHTML():type==='blacklist'?listHTML('blacklist'):type==='favorites'?listHTML('favorites'):themeHTML();$('panelDone').textContent=type==='filters'?'完成设置，去扭蛋 →':'完成';$('panel').showModal()}
function choosePlace(q){const term=String(q||'').trim().toLowerCase();const loc=LOCS.find(x=>x[0].toLowerCase()===term)||LOCS.find(x=>x[0].toLowerCase().includes(term)&&term.length>=3);if(!loc){toast('没有找到这个地区，请从列表选择或用 GPS。');return}s.location={name:loc[0],lat:loc[1],lon:loc[2],kind:'preset'};s.cacheKey='';s.places=[];s.recent=[];refresh();status('已选 '+loc[0]+'，点击 START GACHA 查询附近真实餐厅');openPanel('filters');toast('地点已更新：'+loc[0])}
async function gps(){if(!window.isSecureContext||!navigator.geolocation){toast('GPS 需要 HTTPS 和浏览器定位权限。');return}status('正在请求位置权限…');try{const pos=await new Promise((ok,fail)=>navigator.geolocation.getCurrentPosition(ok,fail,{enableHighAccuracy:false,timeout:16000,maximumAge:300000}));s.location={name:'我的 GPS 位置',lat:pos.coords.latitude,lon:pos.coords.longitude,kind:'gps'};s.cacheKey='';s.places=[];s.recent=[];refresh();if($('panel').open)openPanel('filters');status('GPS 定位成功，点击 START GACHA 获取附近餐厅');toast('定位成功！')}catch(e){const msg=e.code===1?'定位权限被拒绝，请允许浏览器使用位置':e.code===2?'目前无法获取设备位置':e.code===3?'GPS 定位超时':'定位失败';status(msg,true);toast(msg)}}
function key(){return [s.location.lat.toFixed(3),s.location.lon.toFixed(3),s.radius].join(':')}
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
  const message='无法连上免费地图服务器（不是 Klang 没有餐厅）。请稍后重试，或在正式 HTTPS 网站测试。';
  status(message,true);
  toast(message);
  console.warn('MakanPoP restaurant lookup failed:',errors.join(' | '));
  return false;
}

function wait(ms){return new Promise(r=>setTimeout(r,ms))}
async function spin(){if(s.busy)return;s.busy=true;$('spin').disabled=true;$('spin').textContent='正在寻找美食…';try{if(!(await fetchPlaces()))return;const candidates=eligible();if(!candidates.length){const txt=s.places.length?'没有符合当前筛选的餐厅。试试取消食物偏好、扩大预算或允许未知价格。':'这个范围没有取得餐厅记录。试试增加搜索距离或换一个地点。';status(txt,true);toast(txt);return}const unseen=candidates.filter(x=>!s.recent.includes(x.id));const pool=unseen.length?unseen:candidates;const p=pool[Math.floor(Math.random()*pool.length)];s.recent=[p.id,...s.recent].slice(0,Math.min(6,candidates.length-1));s.current=p;const machine=$('machine');machine.classList.add('spinning');status('转出一颗美食胶囊中…');await wait(1850);machine.classList.remove('spinning');result(p);status('抽中了 '+p.name+' · 来自真实地图资料')}finally{$('machine').classList.remove('spinning');s.busy=false;$('spin').disabled=false;$('spin').textContent='◉ START GACHA ↗'}}
function result(p){const cuisine=String(p.tags.cuisine||'').replaceAll(';',' / ')||({cafe:'咖啡馆',fast_food:'快餐',restaurant:'餐厅',food_court:'美食广场',ice_cream:'冰淇淋'}[p.tags.amenity]||'餐饮地点');$('resultName').textContent=p.name;$('resultType').textContent=cuisine;$('resultDist').textContent=(p.dist/1000).toFixed(1)+' km';$('resultAddress').textContent=p.address||'地图坐标 '+p.lat.toFixed(5)+', '+p.lon.toFixed(5);const price=Number(s.prices[p.id]);$('resultPrice').textContent=price>0?'你记录的人均 RM'+price:'价格未知';$('resultNote').textContent=price>0?'这是你自己的消费记录，不是餐厅官方菜单报价。':'OpenStreetMap 没有提供可核实的菜单价格；当前预算可能不匹配。';$('navLink').href='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(p.lat+','+p.lon);$('favAction').textContent=s.favorites.some(x=>x.id===p.id)?'♥ 已收藏':'♡ 收藏';$('blackAction').textContent=s.blacklist.some(x=>x.id===p.id)?'✓ 已 Blacklist':'⊘ Blacklist';$('spendForm').hidden=true;$('result').showModal()}
function toggleList(type){const p=s.current;if(!p)return;const already=s[type].some(x=>x.id===p.id);s[type]=already?s[type].filter(x=>x.id!==p.id):[...s[type],{id:p.id,name:p.name}];save();if(type==='blacklist'&&!already){$('result').close();toast(p.name+' 已加入 Blacklist，以后不会抽中')}else{toast(already?'已从列表移除':'已收藏');resultUpdateActions()}}
function resultUpdateActions(){if(!s.current)return;$('favAction').textContent=s.favorites.some(x=>x.id===s.current.id)?'♥ 已收藏':'♡ 收藏';$('blackAction').textContent=s.blacklist.some(x=>x.id===s.current.id)?'✓ 已 Blacklist':'⊘ Blacklist'}
$('openFilters').onclick=()=>openPanel('filters');$('openBlack').onclick=()=>openPanel('blacklist');$('openThemes').onclick=()=>openPanel('themes');$('openPrefs').onclick=()=>openPanel('filters');document.querySelectorAll('[data-open]').forEach(b=>b.addEventListener('click',()=>openPanel('filters')));$('closePanel').onclick=()=>$('panel').close();$('panelDone').onclick=()=>{$('panel').close();if(page==='filters')spin()};$('panelContent').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.food){const type=b.dataset.mode,id=b.dataset.food;const other=type==='want'?'avoid':'want';s[type]=s[type].includes(id)?s[type].filter(x=>x!==id):[...s[type],id];s[other]=s[other].filter(x=>x!==id);save();openPanel('filters');return}if(b.dataset.place){choosePlace(b.dataset.place);return}if(b.dataset.budget){s.max=Number(b.dataset.budget);s.min=Math.min(s.min,s.max);refresh();openPanel('filters');return}if(b.dataset.theme){s.theme=b.dataset.theme;s.custom='';refresh();openPanel('themes');return}if(b.dataset.remove){s[b.dataset.list]=s[b.dataset.list].filter(x=>x.id!==b.dataset.remove);save();openPanel(page);return}if(b.dataset.action==='place'){choosePlace($('placeInput').value);return}if(b.dataset.action==='gps'){gps();return}if(b.dataset.action==='clear'){s.want=[];s.avoid=[];refresh();openPanel('filters');return}if(b.dataset.action==='clear-color'){s.custom='';refresh();openPanel('themes')}});
$('panelContent').addEventListener('change',e=>{const el=e.target;if(el.id==='radiusInput'){s.radius=Number(el.value);s.cacheKey='';s.places=[]}if(el.id==='minInput'){s.min=Math.max(0,Math.min(1000,Number(el.value)||0))}if(el.id==='maxInput'){s.max=Math.min(1000,Math.max(s.min,Number(el.value)||1))}if(el.id==='unknownPrice')s.unknown=el.checked;if(el.id==='customColor')s.custom=el.value;refresh()});
$('panelContent').addEventListener('keydown',e=>{if(e.target.id==='placeInput'&&e.key==='Enter'){e.preventDefault();choosePlace(e.target.value)}});
$('spin').onclick=spin;$('knob').onclick=spin;let pt=null;$('knob').addEventListener('pointerdown',e=>{pt=[e.clientX,e.clientY]});$('knob').addEventListener('pointerup',e=>{if(pt&&Math.hypot(e.clientX-pt[0],e.clientY-pt[1])>24)spin();pt=null});
$('closeResult').onclick=()=>$('result').close();$('reroll').onclick=()=>{$('result').close();spin()};$('favAction').onclick=()=>toggleList('favorites');$('blackAction').onclick=()=>toggleList('blacklist');$('spendAction').onclick=()=>{$('spendForm').hidden=!$('spendForm').hidden};$('saveSpend').onclick=()=>{const price=Number($('spendInput').value);if(!(price>0&&price<=1000)){toast('请输入 RM1–RM1000 的金额');return}if(!s.current)return;s.prices[s.current.id]=price;save();$('resultPrice').textContent='你记录的人均 RM'+price;$('resultNote').textContent='这是你的个人消费记录，不是官方菜单价格。';$('spendForm').hidden=true;toast('保存成功！')};
refresh();status('Klang 已准备好 · 点击 START GACHA 查询真实餐厅');
