(() => {
const K='numberwalk.v03';
const API_SESSION_KEY='numberwalk.googleKey.session';
const DEFAULT_DAILY_API_LIMIT=250;
const DEFAULT_STATE={session:null,records:[],dailyApiLimit:DEFAULT_DAILY_API_LIMIT,apiUsage:{date:'',count:0},rememberApiKey:false};
function loadState(){
  try{
    const parsed=JSON.parse(localStorage.getItem(K)||'null');
    const s=parsed&&typeof parsed==='object'?parsed:{};
    const merged={...DEFAULT_STATE,...s};
    if(!Array.isArray(merged.records))merged.records=[];
    if(!Number.isFinite(+merged.dailyApiLimit)||+merged.dailyApiLimit<1)merged.dailyApiLimit=DEFAULT_DAILY_API_LIMIT;
    if(!merged.apiUsage||typeof merged.apiUsage!=='object')merged.apiUsage={date:'',count:0};
    // v0.5 migration: move a previously persisted key into session storage, then remove it from local storage.
    if(typeof merged.googleKey==='string'&&merged.googleKey.trim()){
      try{sessionStorage.setItem(API_SESSION_KEY,merged.googleKey.trim())}catch(_){}
      delete merged.googleKey;
      merged.rememberApiKey=false;
      try{localStorage.setItem(K,JSON.stringify(merged))}catch(_){}
    }
    return merged;
  }catch(e){
    console.warn('Could not read NumberWalk browser data; starting with a clean state.',e);
    return {...DEFAULT_STATE,records:[],apiUsage:{date:'',count:0}};
  }
}
const state=loadState();
let map,reviewMap,selectedMarker,googleMarker,selectedLatLng=null,gpsCircle=null,currentPos=null,queueFilter='to-submit',photoData=null,googleMapsPromise=null,googleMapsKeyLoaded='';
const $=id=>document.getElementById(id);
function save(){
  const copy={...state};
  delete copy.googleKey;
  try{localStorage.setItem(K,JSON.stringify(copy));return true}
  catch(e){console.error('Could not save NumberWalk data',e);alert('NumberWalk could not save data. Browser storage may be full. Remove large reference photos or clear old site data.');return false}
}
function getGoogleKey(){
  try{return (sessionStorage.getItem(API_SESSION_KEY)||'').trim()}catch(_){return ''}
}
function setGoogleKey(key,remember){
  const clean=(key||'').trim();
  try{if(clean)sessionStorage.setItem(API_SESSION_KEY,clean);else sessionStorage.removeItem(API_SESSION_KEY)}catch(_){}
  state.rememberApiKey=!!remember;
  if(remember&&clean)state.persistedGoogleKey=clean;else delete state.persistedGoogleKey;
  save();
}
function hydrateRememberedKey(){
  if(state.rememberApiKey&&typeof state.persistedGoogleKey==='string'&&state.persistedGoogleKey.trim()){
    try{sessionStorage.setItem(API_SESSION_KEY,state.persistedGoogleKey.trim())}catch(_){}
  }
}
hydrateRememberedKey();
function initMap(){map=L.map('map',{zoomControl:false}).setView([51.591,-2.756],18); L.control.zoom({position:'bottomright'}).addTo(map); addLayers(map); map.on('click',e=>setSelected(e.latlng));}
function addLayers(m){const aerial=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:20,attribution:'Tiles © Esri'}).addTo(m); const osm=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:20,attribution:'© OpenStreetMap contributors'}); L.control.layers({'Aerial':aerial,'Street map':osm},null,{position:'topleft'}).addTo(m)}
function setSelected(latlng){selectedLatLng=latlng;if(!selectedMarker){selectedMarker=L.marker(latlng,{draggable:true}).addTo(map);selectedMarker.on('dragend',()=>setSelected(selectedMarker.getLatLng()));}else selectedMarker.setLatLng(latlng);$('selectedPosition').textContent=`${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`; $('googlePosition').textContent='Not checked';$('shiftRow').classList.add('hidden');if(googleMarker){map.removeLayer(googleMarker);googleMarker=null}}
function locate(){if(!navigator.geolocation){$('gpsStatus').textContent='GPS not supported';return} $('gpsStatus').textContent='Getting location…';navigator.geolocation.getCurrentPosition(p=>{currentPos={lat:p.coords.latitude,lng:p.coords.longitude,accuracy:p.coords.accuracy};map.setView([currentPos.lat,currentPos.lng],19); if(gpsCircle)map.removeLayer(gpsCircle);gpsCircle=L.circle([currentPos.lat,currentPos.lng],{radius:Math.max(2,currentPos.accuracy),weight:1}).addTo(map);$('gpsStatus').textContent=`GPS ±${Math.round(currentPos.accuracy)} m`;},e=>$('gpsStatus').textContent='Location unavailable — allow precise location',{enableHighAccuracy:true,maximumAge:2000,timeout:12000});}
function address(){if(!state.session)return '';return [$('houseNumber').value.trim(),state.session.street,state.session.locality,state.session.postcode].filter(Boolean).join(', ')}
function updatePreview(){$('addressPreview').textContent=address()||'Start a street session';}
function step(dir){let v=$('houseNumber').value.trim();let m=v.match(/^(\d+)(.*)$/);if(!m)return;let n=+m[1]+dir*((state.session&&state.session.step)||2);$('houseNumber').value=Math.max(1,n)+m[2];updatePreview();selectedLatLng=null;if(selectedMarker){map.removeLayer(selectedMarker);selectedMarker=null}$('selectedPosition').textContent='Tap a building';}
function openSession(){const d=$('sessionDialog');if(state.session){$('street').value=state.session.street;$('locality').value=state.session.locality;$('postcode').value=state.session.postcode;$('startNumber').value=$('houseNumber').value||state.session.startNumber;$('sideMode').value=state.session.mode}d.showModal()}
function renderSession(){const s=state.session;if(!s){$('sessionBanner').classList.add('hidden');openSession();return}$('sessionBanner').classList.remove('hidden');$('sessionStreet').textContent=s.street;$('sessionMeta').textContent=[s.locality,s.postcode,s.mode==='all'?'every number':`${s.mode} numbers`].filter(Boolean).join(' · ');if(!$('houseNumber').value)$('houseNumber').value=s.startNumber;updatePreview()}
function saveRecord(){if(!state.session){openSession();return}if(!selectedLatLng){alert('Tap the centre of the correct building first.');return}const rec={id:Date.now().toString(),house:$('houseNumber').value.trim(),address:address(),lat:selectedLatLng.lat,lng:selectedLatLng.lng,note:$('note').value.trim(),photo:photoData,created:new Date().toISOString(),submitted:false,sessionId:state.session.id};state.records.push(rec);save();$('note').value='';photoData=null;$('photoStatus').classList.add('hidden');renderAll();step(1)}
function makeButton(label,attrs={},classes='small-button'){
  const b=document.createElement('button');b.type='button';b.className=classes;b.textContent=label;
  Object.entries(attrs).forEach(([k,v])=>b.dataset[k]=String(v));return b;
}
function makeCard(){const d=document.createElement('div');d.className='card';return d}
function renderReview(){
  const records=state.session?state.records.filter(r=>r&&r.sessionId===state.session.id):[];
  $('reviewSummary').textContent=`${records.length} house${records.length===1?'':'s'} captured`;
  const list=$('reviewList');list.replaceChildren();
  if(!records.length){const c=makeCard();c.textContent='No houses captured yet.';list.appendChild(c)}
  records.slice().reverse().forEach(r=>{
    if(!Number.isFinite(+r.lat)||!Number.isFinite(+r.lng))return;
    const c=makeCard(),h=document.createElement('h3'),meta=document.createElement('div'),actions=document.createElement('div');
    h.textContent=`${String(r.house||'')} · ${String(state.session?.street||'')}`;meta.className='muted';meta.textContent=`${(+r.lat).toFixed(6)}, ${(+r.lng).toFixed(6)}${r.note?' · '+String(r.note):''}`;
    actions.className='card-actions';actions.append(makeButton('Google Maps',{open:r.id}),makeButton('Delete',{delete:r.id},'small-button danger'));
    c.append(h,meta,actions);list.appendChild(c);
  });
  if(reviewMap){reviewMap.remove();reviewMap=null}
  reviewMap=L.map('reviewMap').setView(currentPos?[currentPos.lat,currentPos.lng]:[51.591,-2.756],18);addLayers(reviewMap);const pts=[];
  records.forEach(r=>{if(!Number.isFinite(+r.lat)||!Number.isFinite(+r.lng))return;const safeHouse=esc(String(r.house||''));const icon=L.divIcon({className:'',html:`<div class="review-number">${safeHouse}</div>`,iconSize:[32,28],iconAnchor:[16,14]});L.marker([+r.lat,+r.lng],{icon}).addTo(reviewMap);pts.push([+r.lat,+r.lng])});
  if(pts.length)reviewMap.fitBounds(pts,{padding:[25,25],maxZoom:20});setTimeout(()=>reviewMap.invalidateSize(),50)
}
function renderQueue(){
  const records=state.records.filter(r=>r&&typeof r==='object');
  const list=records.filter(r=>queueFilter==='all'||(queueFilter==='submitted'?!!r.submitted:!r.submitted));
  $('queueBadge').textContent=records.filter(r=>!r.submitted).length;
  const holder=$('queueList');holder.replaceChildren();
  if(!list.length){const c=makeCard();c.textContent='Nothing in this view.';holder.appendChild(c);return}
  list.slice().reverse().forEach(r=>{
    const c=makeCard(),h=document.createElement('h3'),meta=document.createElement('div'),actions=document.createElement('div');
    h.textContent=String(r.address||'');meta.className='muted';const dt=new Date(r.created);meta.textContent=`Surveyed ${Number.isNaN(dt.getTime())?'unknown time':dt.toLocaleString()}`;
    c.append(h,meta);if(r.note){const p=document.createElement('p');p.textContent=String(r.note);c.appendChild(p)}
    actions.className='card-actions';actions.append(makeButton('Open Google Maps',{open:r.id}),makeButton(r.submitted?'Mark not submitted':'Mark submitted',{submit:r.id}));c.appendChild(actions);holder.appendChild(c);
  })
}
function renderAll(){renderSession();renderQueue()}
function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function openGoogle(id){const r=state.records.find(x=>x.id===id);if(!r)return;const q=encodeURIComponent(r.address);window.open(`https://www.google.com/maps/search/?api=1&query=${q}`,'_blank','noopener')}
function loadGoogleMaps(){
  const key=getGoogleKey();
  if(!key)return Promise.reject(new Error('NO_KEY'));
  if(window.google?.maps?.Geocoder){googleMapsKeyLoaded=key;return Promise.resolve(window.google.maps)}
  if(googleMapsPromise){
    if(googleMapsKeyLoaded && googleMapsKeyLoaded!==key)return Promise.reject(new Error('KEY_CHANGED'));
    return googleMapsPromise;
  }
  googleMapsKeyLoaded=key;
  googleMapsPromise=new Promise((resolve,reject)=>{
    const callback='numberWalkGoogleReady_'+Date.now();
    const script=document.createElement('script');
    const timer=setTimeout(()=>{cleanup();googleMapsPromise=null;reject(new Error('LOAD_TIMEOUT'))},15000);
    function cleanup(){clearTimeout(timer);try{delete window[callback]}catch(_){window[callback]=undefined}}
    window[callback]=()=>{cleanup();if(window.google?.maps?.Geocoder)resolve(window.google.maps);else{googleMapsPromise=null;reject(new Error('LOAD_FAILED'))}};
    script.async=true;script.defer=true;
    script.src=`https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&loading=async&callback=${callback}`;
    script.onerror=()=>{cleanup();googleMapsPromise=null;reject(new Error('LOAD_FAILED'))};
    document.head.appendChild(script);
  });
  return googleMapsPromise;
}

function localDateKey(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function refreshApiUsage(){const today=localDateKey();if(!state.apiUsage||state.apiUsage.date!==today){state.apiUsage={date:today,count:0};save()}return state.apiUsage}
function apiLimit(){const n=parseInt(state.dailyApiLimit,10);return Number.isFinite(n)&&n>=1?n:DEFAULT_DAILY_API_LIMIT}
function apiRemaining(){const u=refreshApiUsage();return Math.max(0,apiLimit()-u.count)}
function updateApiUsageDisplay(){const el=$('apiUsageStatus');if(el){const u=refreshApiUsage();el.textContent=`Google comparisons today: ${u.count} / ${apiLimit()} (${apiRemaining()} remaining)`}}
function consumeApiCall(){const u=refreshApiUsage();if(u.count>=apiLimit())return false;u.count+=1;save();updateApiUsageDisplay();return true}

function geocodeInBrowser(maps,addressText){
  return new Promise((resolve,reject)=>{
    const geocoder=new maps.Geocoder();
    geocoder.geocode({address:addressText},(results,status)=>{
      if(status==='OK'&&results?.length)resolve(results[0]);
      else reject(new Error(status||'NO_RESULTS'));
    });
  });
}
async function compare(){
  if(!selectedLatLng){alert('Select the correct building first.');return}
  if(!getGoogleKey()){$('settingsDialog').showModal();return}
  if(apiRemaining()<=0){alert(`Daily Google comparison limit reached (${apiLimit()}). NumberWalk will allow comparisons again tomorrow. You can change the local limit in Settings.`);return}
  $('googlePosition').textContent='Checking…';
  try{
    if(!consumeApiCall())return;
    const maps=await loadGoogleMaps();
    const result=await geocodeInBrowser(maps,address());
    const loc=result.geometry.location;
    const p={lat:loc.lat(),lng:loc.lng()};
    if(googleMarker)map.removeLayer(googleMarker);
    const icon=L.divIcon({className:'google-marker',iconSize:[16,16]});
    googleMarker=L.marker([p.lat,p.lng],{icon}).addTo(map);
    const d=distance(selectedLatLng.lat,selectedLatLng.lng,p.lat,p.lng);
    $('googlePosition').textContent=`${p.lat.toFixed(6)}, ${p.lng.toFixed(6)}`;
    $('shiftRow').textContent=`Your surveyed point is ${Math.round(d)} m from Google's geocoded position.`;
    $('shiftRow').classList.remove('hidden');
  }catch(e){
    console.error('Google comparison failed',e);
    $('googlePosition').textContent='Comparison failed';
    let message='Google comparison failed. Check that Maps JavaScript API and Geocoding API are enabled and that the API key allows this GitHub Pages website.';
    if(e.message==='KEY_CHANGED')message='The Google API key changed after Google Maps loaded. Reload NumberWalk and try again.';
    if(e.message==='LOAD_TIMEOUT'||e.message==='LOAD_FAILED')message='Google Maps could not load. Check the API key, billing, API restrictions and website restriction, then try again.';
    alert(message);
  }
}

function preparePhoto(file){
  return new Promise((resolve,reject)=>{
    const rd=new FileReader();rd.onerror=reject;rd.onload=()=>{
      const img=new Image();img.onerror=reject;img.onload=()=>{
        const max=1280,scale=Math.min(1,max/Math.max(img.width,img.height)),w=Math.max(1,Math.round(img.width*scale)),h=Math.max(1,Math.round(img.height*scale));
        const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d');if(!ctx)return reject(new Error('Canvas unavailable'));ctx.drawImage(img,0,0,w,h);
        resolve(canvas.toDataURL('image/jpeg',0.76));
      };img.src=rd.result;
    };rd.readAsDataURL(file);
  })
}
function distance(a,b,c,d){const R=6371000,x=(c-a)*Math.PI/180,y=(d-b)*Math.PI/180,z=Math.sin(x/2)**2+Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(y/2)**2;return 2*R*Math.atan2(Math.sqrt(z),Math.sqrt(1-z))}
function tab(name){document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===name));document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));$(name+'Tab').classList.add('active');if(name==='review')renderReview();if(name==='queue')renderQueue();setTimeout(()=>{if(name==='survey')map.invalidateSize()},50)}
document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>tab(b.dataset.tab));$('gpsBtn').onclick=locate;$('prevNumberBtn').onclick=()=>step(-1);$('nextNumberBtn').onclick=()=>step(1);$('houseNumber').oninput=updatePreview;$('changeSessionBtn').onclick=openSession;$('cancelSessionBtn').onclick=()=>$('sessionDialog').close();$('sessionForm').onsubmit=e=>{e.preventDefault();const mode=$('sideMode').value;state.session={id:Date.now().toString(),street:$('street').value.trim(),locality:$('locality').value.trim(),postcode:$('postcode').value.trim(),startNumber:$('startNumber').value.trim(),mode,step:mode==='all'?1:2};$('houseNumber').value=state.session.startNumber;save();$('sessionDialog').close();renderAll();};$('saveNextBtn').onclick=saveRecord;$('compareBtn').onclick=compare;$('settingsBtn').onclick=()=>{$('googleApiKey').value=getGoogleKey();$('rememberApiKey').checked=!!state.rememberApiKey;$('dailyApiLimit').value=apiLimit();updateApiUsageDisplay();$('settingsDialog').showModal()};
$('saveKeyBtn').onclick=()=>{const next=$('googleApiKey').value.trim();if(next!==getGoogleKey()&&googleMapsPromise){alert('API key saved. Reload NumberWalk before using Google comparison with the new key.')}setGoogleKey(next,$('rememberApiKey').checked);const lim=parseInt($('dailyApiLimit').value,10);state.dailyApiLimit=Number.isFinite(lim)&&lim>=1?Math.min(lim,10000):DEFAULT_DAILY_API_LIMIT;save();updateApiUsageDisplay();$('settingsDialog').close()};
$('clearKeyBtn').onclick=()=>{setGoogleKey('',false);$('googleApiKey').value='';$('rememberApiKey').checked=false};
$('clearLocalDataBtn').onclick=()=>{if(!confirm('Clear all NumberWalk street sessions, survey records, photos, settings and API-key storage on this device? This cannot be undone.'))return;try{localStorage.removeItem(K);sessionStorage.removeItem(API_SESSION_KEY)}catch(_){};location.reload()};
$('photoInput').onchange=async()=>{const f=$('photoInput').files[0];if(!f)return;if(!f.type.startsWith('image/')){alert('Please choose an image file.');return}if(f.size>12*1024*1024){alert('Photo is too large. Choose an image under 12 MB.');return}try{photoData=await preparePhoto(f);$('photoStatus').textContent=`Reference photo attached: ${f.name}`;$('photoStatus').classList.remove('hidden')}catch(e){console.error(e);alert('Could not prepare that photo. Try a different image.')}};$('reviewMapBtn').onclick=()=>renderReview();document.body.onclick=e=>{const o=e.target.closest('[data-open]');if(o)openGoogle(o.dataset.open);const d=e.target.closest('[data-delete]');if(d&&confirm('Delete this surveyed house?')){state.records=state.records.filter(r=>r.id!==d.dataset.delete);save();renderReview();renderQueue()}const s=e.target.closest('[data-submit]');if(s){const r=state.records.find(r=>r.id===s.dataset.submit);if(r){r.submitted=!r.submitted;save();renderQueue()}}};document.querySelectorAll('.filter-button').forEach(b=>b.onclick=()=>{queueFilter=b.dataset.filter;document.querySelectorAll('.filter-button').forEach(x=>x.classList.toggle('active',x===b));renderQueue()});
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});initMap();renderAll();locate();
})();
