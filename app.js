(() => {
const K='numberwalk.v03';
const DEFAULT_DAILY_API_LIMIT=250;
const state=JSON.parse(localStorage.getItem(K)||'{"session":null,"records":[],"googleKey":""}');
if(!Number.isFinite(+state.dailyApiLimit))state.dailyApiLimit=DEFAULT_DAILY_API_LIMIT;
if(!state.apiUsage)state.apiUsage={date:"",count:0};
let map,reviewMap,selectedMarker,googleMarker,selectedLatLng=null,gpsCircle=null,currentPos=null,queueFilter='to-submit',photoData=null,googleMapsPromise=null,googleMapsKeyLoaded='';
const $=id=>document.getElementById(id); const save=()=>localStorage.setItem(K,JSON.stringify(state));
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
function renderReview(){const records=state.session?state.records.filter(r=>r.sessionId===state.session.id):[];$('reviewSummary').textContent=`${records.length} house${records.length===1?'':'s'} captured`;$('reviewList').innerHTML=records.slice().reverse().map(r=>`<div class="card"><h3>${esc(r.house)} · ${esc(state.session?.street||'')}</h3><div class="muted">${r.lat.toFixed(6)}, ${r.lng.toFixed(6)}${r.note?' · '+esc(r.note):''}</div><div class="card-actions"><button class="small-button" data-open="${r.id}">Google Maps</button><button class="small-button danger" data-delete="${r.id}">Delete</button></div></div>`).join('')||'<div class="card">No houses captured yet.</div>';if(reviewMap){reviewMap.remove();reviewMap=null}reviewMap=L.map('reviewMap').setView(currentPos?[currentPos.lat,currentPos.lng]:[51.591,-2.756],18);addLayers(reviewMap);const pts=[];records.forEach(r=>{const icon=L.divIcon({className:'',html:`<div class="review-number">${esc(r.house)}</div>`,iconSize:[32,28],iconAnchor:[16,14]});L.marker([r.lat,r.lng],{icon}).addTo(reviewMap);pts.push([r.lat,r.lng])});if(pts.length)reviewMap.fitBounds(pts,{padding:[25,25],maxZoom:20});setTimeout(()=>reviewMap.invalidateSize(),50)}
function renderQueue(){const list=state.records.filter(r=>queueFilter==='all'||(queueFilter==='submitted'?r.submitted:!r.submitted));$('queueBadge').textContent=state.records.filter(r=>!r.submitted).length;$('queueList').innerHTML=list.slice().reverse().map(r=>`<div class="card"><h3>${esc(r.address)}</h3><div class="muted">Surveyed ${new Date(r.created).toLocaleString()}</div>${r.note?`<p>${esc(r.note)}</p>`:''}<div class="card-actions"><button class="small-button" data-open="${r.id}">Open Google Maps</button><button class="small-button" data-submit="${r.id}">${r.submitted?'Mark not submitted':'Mark submitted'}</button></div></div>`).join('')||'<div class="card">Nothing in this view.</div>'}
function renderAll(){renderSession();renderQueue()}
function esc(s=''){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function openGoogle(id){const r=state.records.find(x=>x.id===id);if(!r)return;const q=encodeURIComponent(r.address);window.open(`https://www.google.com/maps/search/?api=1&query=${q}`,'_blank','noopener')}
function loadGoogleMaps(){
  const key=(state.googleKey||'').trim();
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
  if(!state.googleKey){$('settingsDialog').showModal();return}
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
function distance(a,b,c,d){const R=6371000,x=(c-a)*Math.PI/180,y=(d-b)*Math.PI/180,z=Math.sin(x/2)**2+Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(y/2)**2;return 2*R*Math.atan2(Math.sqrt(z),Math.sqrt(1-z))}
function tab(name){document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===name));document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));$(name+'Tab').classList.add('active');if(name==='review')renderReview();if(name==='queue')renderQueue();setTimeout(()=>{if(name==='survey')map.invalidateSize()},50)}
document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>tab(b.dataset.tab));$('gpsBtn').onclick=locate;$('prevNumberBtn').onclick=()=>step(-1);$('nextNumberBtn').onclick=()=>step(1);$('houseNumber').oninput=updatePreview;$('changeSessionBtn').onclick=openSession;$('cancelSessionBtn').onclick=()=>$('sessionDialog').close();$('sessionForm').onsubmit=e=>{e.preventDefault();const mode=$('sideMode').value;state.session={id:Date.now().toString(),street:$('street').value.trim(),locality:$('locality').value.trim(),postcode:$('postcode').value.trim(),startNumber:$('startNumber').value.trim(),mode,step:mode==='all'?1:2};$('houseNumber').value=state.session.startNumber;save();$('sessionDialog').close();renderAll();};$('saveNextBtn').onclick=saveRecord;$('compareBtn').onclick=compare;$('settingsBtn').onclick=()=>{$('googleApiKey').value=state.googleKey||'';$('dailyApiLimit').value=apiLimit();updateApiUsageDisplay();$('settingsDialog').showModal()};$('saveKeyBtn').onclick=()=>{const next=$('googleApiKey').value.trim();if(next!==state.googleKey&&googleMapsPromise){alert('API key saved. Reload NumberWalk before using Google comparison with the new key.')}state.googleKey=next;const lim=parseInt($('dailyApiLimit').value,10);state.dailyApiLimit=Number.isFinite(lim)&&lim>=1?lim:DEFAULT_DAILY_API_LIMIT;save();updateApiUsageDisplay();$('settingsDialog').close()};$('clearKeyBtn').onclick=()=>{state.googleKey='';$('googleApiKey').value='';save()};$('photoInput').onchange=()=>{const f=$('photoInput').files[0];if(!f)return;const rd=new FileReader();rd.onload=()=>{photoData=rd.result;$('photoStatus').textContent=`Reference photo attached: ${f.name}`;$('photoStatus').classList.remove('hidden')};rd.readAsDataURL(f)};$('reviewMapBtn').onclick=()=>renderReview();document.body.onclick=e=>{const o=e.target.closest('[data-open]');if(o)openGoogle(o.dataset.open);const d=e.target.closest('[data-delete]');if(d&&confirm('Delete this surveyed house?')){state.records=state.records.filter(r=>r.id!==d.dataset.delete);save();renderReview();renderQueue()}const s=e.target.closest('[data-submit]');if(s){const r=state.records.find(r=>r.id===s.dataset.submit);if(r){r.submitted=!r.submitted;save();renderQueue()}}};document.querySelectorAll('.filter-button').forEach(b=>b.onclick=()=>{queueFilter=b.dataset.filter;document.querySelectorAll('.filter-button').forEach(x=>x.classList.toggle('active',x===b));renderQueue()});
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});initMap();renderAll();locate();
})();
