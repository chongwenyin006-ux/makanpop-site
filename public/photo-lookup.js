/*
 * Restaurant-photo lookup — free and source-linked only.
 * Accepts only a Wikimedia Commons FILE that OSM explicitly links to the
 * selected restaurant (never a generic image search, chain photo or stock).
 * MediaWiki Commons CORS API: https://www.mediawiki.org/wiki/API:Cross-site_requests
 * Copyright stays with the credited Commons contributor; attribution links
 * to the source file and its full license.
 */
(function(){
  'use strict';
  let requestNumber=0;
  const el=id=>document.getElementById(id);
  const NO_PHOTO='🖼️ 这家餐厅暂无能确认来源的真实照片。不会使用其他店的图片代替。';
  const cleanText=s=>String(s||'').replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim().slice(0,130);
  function titleFromTag(value){
    const raw=String(value||'').trim();
    if(!raw)return null;
    let file=null;
    if(/^File:/i.test(raw))file=raw.substring(5);
    else if(/^https:\/\//i.test(raw)){
      try{
        const u=new URL(raw);
        if(u.hostname==='commons.wikimedia.org'){
          const match=u.pathname.match(/\/(?:wiki\/)?File:(.+)$/i);
          if(match)file=decodeURIComponent(match[1]);
          else if(/^File:/i.test(u.searchParams.get('title')||''))file=u.searchParams.get('title').substring(5);
        }else if(u.hostname==='upload.wikimedia.org'&&u.pathname.startsWith('/wikipedia/commons/')){
          const parts=u.pathname.split('/').filter(Boolean);
          file=decodeURIComponent(parts[parts.length-1]||'');
          if(u.pathname.includes('/thumb/'))file=decodeURIComponent(parts[parts.length-2]||'');
        }
      }catch(e){return null}
    }
    if(!file)return null;
    file=file.replaceAll('_',' ').trim();
    if(!/\.(?:jpe?g|png|webp)$/i.test(file)||file.length>240||/[\r\n<>]/.test(file))return null;
    return 'File:'+file;
  }
  function directSource(tags={}){
    // A category and a Wikidata link do NOT confirm this individual restaurant's photo.
    return titleFromTag(tags.wikimedia_commons)||titleFromTag(tags.image)||null;
  }
  function noPhoto(message=NO_PHOTO){
    el('restaurantPhoto').hidden=true;
    el('restaurantPhotoImg').removeAttribute('src');
    el('photoUnavailable').textContent=message;
    el('photoUnavailable').hidden=false;
    el('surpriseIcon').hidden=false;
  }
  async function show(place){
    const id=++requestNumber;
    noPhoto();
    const title=directSource(place?.tags);
    if(!title)return;
    el('photoUnavailable').textContent='正在验证这家店关联的照片和授权…';
    const query=new URLSearchParams({
      action:'query',prop:'imageinfo',iiprop:'url|extmetadata|mime',
      iiurlwidth:'1000',titles:title,format:'json',origin:'*'
    });
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),9000);
    try{
      const response=await fetch('https://commons.wikimedia.org/w/api.php?'+query.toString(),{
        mode:'cors',credentials:'omit',signal:controller.signal
      });
      if(!response.ok)throw Error('Photo API HTTP '+response.status);
      const data=await response.json();
      const pages=Object.values(data?.query?.pages||{});
      const info=pages[0]?.imageinfo?.[0];
      if(!info||!['image/jpeg','image/png','image/webp'].includes(info.mime))throw Error('No usable photo');
      const src=info.thumburl||info.url;
      const url=new URL(src);
      if(url.protocol!=='https:'||url.hostname!=='upload.wikimedia.org')throw Error('Invalid image host');
      const license=cleanText(info.extmetadata?.LicenseShortName?.value);
      if(!license||!info.descriptionurl)throw Error('Missing license/source information');
      const source=new URL(info.descriptionurl);
      if(source.protocol!=='https:'||source.hostname!=='commons.wikimedia.org')throw Error('Invalid source page');
      if(id!==requestNumber)return;
      const image=el('restaurantPhotoImg');
      image.onload=()=>{
        if(id!==requestNumber)return;
        el('photoUnavailable').hidden=true;
        el('surpriseIcon').hidden=true;
        el('restaurantPhoto').hidden=false;
      };
      image.onerror=()=>{if(id===requestNumber)noPhoto()};
      image.alt='OpenStreetMap 与 '+place.name+' 这条餐厅记录直接关联的图片；可能已过时';
      el('photoCreditText').textContent='Wikimedia Commons · '+cleanText(info.extmetadata?.Artist?.value||'来源详见原图')+' · '+license;
      el('photoCreditLink').href=source.href;
      image.src=url.href;
    }catch(err){
      if(id===requestNumber)noPhoto(NO_PHOTO);
      console.info('No verified restaurant-specific Commons photo:',err.message);
    }finally{clearTimeout(timer)}
  }
  window.MakanPoPPhotos={show,directSource,reset:()=>{requestNumber++;noPhoto()}};
})();
