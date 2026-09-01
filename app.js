
function openFindMyAddress(addressText){
  // FindMyAddress intentionally limits free personal searches.
  // We open the official site only; NumberWalk does not scrape or automate it.
  const url = 'https://www.findmyaddress.co.uk/search';
  const w = window.open(url, '_blank', 'noopener');
  if(!w){
    alert('Safari blocked the new tab. Allow pop-ups for NumberWalk or open findmyaddress.co.uk manually.');
  }
}

(() => {
'use strict';
const K='numberwalk.v03';
const API_SESSION_KEY='numberwalk.googleKey.session';
const DEFAULT_DAILY_API_LIMIT=250;
const DEFAULT_STATE={session:null,records:[],dailyApiLimit:DEFAULT_DAILY_API_LIMIT,apiUsage:{date:'',count:0},rememberApiKey:false};
const $=id=>document.getElementById(id);

function loadState(){
  try{
    const parsed=JSON.parse(localStorage.getItem(K)||'null');
    const s=parsed&&typeof parsed==='object'?parsed:{};
    const merged={...DEFAULT_STATE,...s};
    if(!Array.isArray(merged.records))merged.records=[];
    if(!Number.isFinite(+merged.dailyApiLimit)||+merged.dailyApiLimit<1)merged.dailyApiLimit=DEFAULT_DAILY_API_LIMIT;
    if(!merged.apiUsage||typeof merged.apiUsage!=='object')merged.apiUsage={date:'',count:0};
    if(typeof merged.googleKey==='string'&&merged.googleKey.trim()){
      try{sessionStorage.setItem(API_SESSION_KEY,merged.googleKey.trim())}catch(_){ }
      delete merged.googleKey;merged.rememberApiKey=false;
      try{localStorage.setItem(K,JSON.stringify(merged))}catch(_){ }
    }
    if(merged.session){
      if(!Number.isFinite(+merged.session.nextStep))merged.session.nextStep=Number.isFinite(+merged.session.step)?+merged.session.step:2;
      merged.session.nextStep=Math.max(-2,Math.min(2,+merged.session.nextStep));
    }
    return merged;
  }catch(e){
    console.warn('Could not read NumberWalk browser data; starting with a clean state.',e);
    return {...DEFAULT_STATE,records:[],apiUsage:{date:'',count:0}};
  }
}
const state=loadState();
let map,reviewMap,selectedMarker,googleMarker,surveyLayer,selectedLatLng=null,gpsCircle=null,currentPos=null,queueFilter='to-submit',googleMapsPromise=null,googleMapsKeyLoaded='',lastGoogleComparison=null;

function save(){
  const copy={...state};delete copy.googleKey;
  try{localStorage.setItem(K,JSON.stringify(copy));return true}
  catch(e){console.error('Could not save NumberWalk data',e);alert('NumberWalk could not save data. Browser storage may be full.');return false}
}
function getGoogleKey(){try{return (sessionStorage.getItem(API_SESSION_KEY)||'').trim()}catch(_){return ''}}
function setGoogleKey(key,remember){
  const clean=(key||'').trim();
  try{if(clean)sessionStorage.setItem(API_SESSION_KEY,clean);else sessionStorage.removeItem(API_SESSION_KEY)}catch(_){ }
  state.rememberApiKey=!!remember;
  if(remember&&clean)state.persistedGoogleKey=clean;else delete state.persistedGoogleKey;
  save();
}
function hydrateRememberedKey(){if(state.rememberApiKey&&typeof state.persistedGoogleKey==='string'&&state.persistedGoogleKey.trim()){try{sessionStorage.setItem(API_SESSION_KEY,state.persistedGoogleKey.trim())}catch(_){ }}}
hydrateRememberedKey();

function addLayers(m){
  const aerial=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:20,attribution:'Tiles © Esri'}).addTo(m);
  const osm=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:20,attribution:'© OpenStreetMap contributors'});
  L.control.layers({'Aerial':aerial,'Street map':osm},null,{position:'topleft'}).addTo(m);
}
function initMap(){
  map=L.map('map',{zoomControl:false,rotate:true,touchRotate:true,dragRotate:false,shiftKeyRotate:false,bearing:0}).setView([51.591,-2.756],18);
  L.control.zoom({position:'bottomright'}).addTo(map);addLayers(map);
  surveyLayer=L.layerGroup().addTo(map);
  map.on('click',e=>setSelected(e.latlng));
  map.on('rotate',updateBearingStatus);
  renderSurveyMarkers();
}
function updateBearingStatus(){
  const bearing=typeof map?.getBearing==='function'?((map.getBearing()%360)+360)%360:0;
  $('bearingStatus').textContent=bearing<1||bearing>359?'N':`${Math.round(bearing)}°`;
}
function rotateMap(delta){if(typeof map?.setBearing!=='function')return;const current=map.getBearing()||0;map.setBearing((current+delta+360)%360);updateBearingStatus()}
function northUp(){if(typeof map?.setBearing==='function')map.setBearing(0);updateBearingStatus()}
function houseIcon(r,cls='survey-number'){
  const el=document.createElement('div');el.className=`${cls}${r.submitted?' submitted':''}`;el.textContent=String(r.house||'?');
  return L.divIcon({className:'',html:el.outerHTML,iconSize:[36,27],iconAnchor:[18,14]});
}
function renderSurveyMarkers(){
  if(!surveyLayer)return;surveyLayer.clearLayers();
  state.records.forEach(r=>{
    if(!Number.isFinite(+r.lat)||!Number.isFinite(+r.lng))return;
    const m=L.marker([+r.lat,+r.lng],{icon:houseIcon(r),interactive:false}).addTo(surveyLayer);
    m.bindTooltip(String(r.address||r.house||''),{direction:'top',offset:[0,-12]});
  });
}
function setSelected(latlng){
  selectedLatLng=latlng;lastGoogleComparison=null;
  if(!selectedMarker){selectedMarker=L.marker(latlng,{draggable:true}).addTo(map);selectedMarker.on('dragend',()=>setSelected(selectedMarker.getLatLng()));}
  else selectedMarker.setLatLng(latlng);
  $('selectedPosition').textContent=`Selected ${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`;
  $('googlePosition').textContent='Not checked';$('shiftRow').classList.add('hidden');
  if(googleMarker){map.removeLayer(googleMarker);googleMarker=null}
}
function clearSelection(){
  selectedLatLng=null;lastGoogleComparison=null;if(selectedMarker){map.removeLayer(selectedMarker);selectedMarker=null}
  if(googleMarker){map.removeLayer(googleMarker);googleMarker=null}
  $('selectedPosition').textContent='Tap a building';$('googlePosition').textContent='Not checked';$('shiftRow').classList.add('hidden');
}
function locate(){
  if(!navigator.geolocation){$('gpsStatus').textContent='GPS not supported';return}
  $('gpsStatus').textContent='Getting location…';
  navigator.geolocation.getCurrentPosition(p=>{
    currentPos={lat:p.coords.latitude,lng:p.coords.longitude,accuracy:p.coords.accuracy};
    map.setView([currentPos.lat,currentPos.lng],19);
    if(gpsCircle)map.removeLayer(gpsCircle);
    gpsCircle=L.circle([currentPos.lat,currentPos.lng],{radius:Math.max(2,currentPos.accuracy),weight:1}).addTo(map);
    $('gpsStatus').textContent=`GPS ±${Math.round(currentPos.accuracy)} m`;
  },e=>{
    const msg=e?.code===1?'Location permission denied':e?.code===3?'GPS timed out':'Location unavailable';$('gpsStatus').textContent=msg;
  },{enableHighAccuracy:true,maximumAge:2000,timeout:12000});
}
function address(){if(!state.session)return '';return [$('houseNumber').value.trim(),state.session.street,state.session.locality,state.session.postcode].filter(Boolean).join(', ')}
function changeNumber(delta){
  const v=$('houseNumber').value.trim(),m=v.match(/^(\d+)(.*)$/);if(!m)return;
  const n=Math.max(0,+m[1]+delta);$('houseNumber').value=String(n)+m[2];clearSelection();
}
function setNextStep(v){
  const n=Math.max(-2,Math.min(2,Number(v)||0));if(state.session)state.session.nextStep=n;save();
  document.querySelectorAll('.next-step').forEach(b=>b.classList.toggle('active',+b.dataset.step===n));
}
function advanceAfterSave(){const n=state.session?+state.session.nextStep:0;if(n!==0)changeNumber(n);else clearSelection()}
function openSession(){
  const d=$('sessionDialog');
  if(state.session){$('street').value=state.session.street||'';$('locality').value=state.session.locality||'';$('postcode').value=state.session.postcode||'';$('startNumber').value=$('houseNumber').value||state.session.startNumber||'1';$('defaultStep').value=String(state.session.nextStep??2)}
  d.showModal();
}
function renderSession(){
  const s=state.session;if(!s){$('sessionBanner').classList.add('hidden');openSession();return}
  $('sessionBanner').classList.remove('hidden');$('sessionStreet').textContent=s.street||'Street';$('sessionMeta').textContent=[s.locality,s.postcode].filter(Boolean).join(' · ');
  if(!$('houseNumber').value)$('houseNumber').value=s.startNumber||'1';setNextStep(s.nextStep??2);
}
function saveRecord(){
  if(!state.session){openSession();return}if(!selectedLatLng){alert('Tap the centre of the correct building first.');return}
  const rec={id:`${Date.now()}-${Math.random().toString(36).slice(2,7)}`,house:$('houseNumber').value.trim(),address:address(),lat:selectedLatLng.lat,lng:selectedLatLng.lng,created:new Date().toISOString(),submitted:false,sessionId:state.session.id};
  if(lastGoogleComparison&&Number.isFinite(+lastGoogleComparison.lat)&&Number.isFinite(+lastGoogleComparison.lng)){
    rec.googleLat=+lastGoogleComparison.lat;rec.googleLng=+lastGoogleComparison.lng;rec.googleComparedAt=new Date().toISOString();
  }
  state.records.push(rec);save();renderSurveyMarkers();renderQueue();advanceAfterSave();
}
function makeButton(label,attrs={},classes='small-button'){const b=document.createElement('button');b.type='button';b.className=classes;b.textContent=label;Object.entries(attrs).forEach(([k,v])=>b.dataset[k]=String(v));return b}
function makeCard(){const d=document.createElement('div');d.className='card';return d}
function renderReview(){
  const records=state.records.filter(r=>r&&typeof r==='object');
  $('reviewSummary').textContent=`${records.length} house${records.length===1?'':'s'} captured in total`;
  const list=$('reviewList');list.replaceChildren();
  if(!records.length){const c=makeCard();c.textContent='No houses captured yet.';list.appendChild(c)}
  records.slice().reverse().forEach(r=>{
    if(!Number.isFinite(+r.lat)||!Number.isFinite(+r.lng))return;
    const c=makeCard(),h=document.createElement('h3'),meta=document.createElement('div'),actions=document.createElement('div');
    h.textContent=String(r.address||r.house||'');meta.className='muted';meta.textContent=`${(+r.lat).toFixed(6)}, ${(+r.lng).toFixed(6)}`;
    actions.className='card-actions';actions.append(makeButton('Google Maps',{open:r.id}),makeButton('Delete',{delete:r.id},'small-button danger'));
    c.append(h,meta,actions);list.appendChild(c);
  });
  if(reviewMap){reviewMap.remove();reviewMap=null}
  reviewMap=L.map('reviewMap',{rotate:true,touchRotate:true}).setView(currentPos?[currentPos.lat,currentPos.lng]:[51.591,-2.756],18);addLayers(reviewMap);const pts=[];
  records.forEach(r=>{if(!Number.isFinite(+r.lat)||!Number.isFinite(+r.lng))return;L.marker([+r.lat,+r.lng],{icon:houseIcon(r,'review-number'),interactive:false}).addTo(reviewMap);pts.push([+r.lat,+r.lng])});
  if(pts.length)reviewMap.fitBounds(pts,{padding:[25,25],maxZoom:20});setTimeout(()=>reviewMap.invalidateSize(),50);
}
function renderQueue(){
  const records=state.records.filter(r=>r&&typeof r==='object');const list=records.filter(r=>queueFilter==='all'||(queueFilter==='submitted'?!!r.submitted:!r.submitted));
  $('queueBadge').textContent=records.filter(r=>!r.submitted).length;const holder=$('queueList');holder.replaceChildren();
  if(!list.length){const c=makeCard();c.textContent='Nothing in this view.';holder.appendChild(c);return}
  list.slice().reverse().forEach(r=>{
    const c=makeCard(),h=document.createElement('h3'),meta=document.createElement('div'),actions=document.createElement('div');
    h.textContent=String(r.address||'');meta.className='muted';const dt=new Date(r.created);meta.textContent=`Surveyed ${Number.isNaN(dt.getTime())?'unknown time':dt.toLocaleString()}`;
    actions.className='card-actions';
    actions.append(makeButton('Show both positions',{both:r.id}),makeButton('Edit address',{open:r.id}),makeButton('Official address',{official:r.id}),makeButton(r.submitted?'Mark not submitted':'Mark submitted',{submit:r.id}));
    if(Number.isFinite(+r.googleLat)&&Number.isFinite(+r.googleLng)){const compared=document.createElement('div');compared.className='muted queue-compare-note';compared.textContent=`Google position saved · ${Math.round(distance(+r.lat,+r.lng,+r.googleLat,+r.googleLng))} m from survey`;c.append(h,meta,compared,actions)}else c.append(h,meta,actions);
    holder.appendChild(c);
  });
}
function renderAll(){renderSession();renderSurveyMarkers();renderQueue()}
function googleSearchUrl(r){return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.address||'')}`}
function surveyedPinUrl(r){return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${r.lat},${r.lng}`)}`}
function comparisonMapUrl(r){
  if(!Number.isFinite(+r.googleLat)||!Number.isFinite(+r.googleLng)||!Number.isFinite(+r.lat)||!Number.isFinite(+r.lng))return '';
  const origin=`${(+r.googleLat).toFixed(7)},${(+r.googleLng).toFixed(7)}`,destination=`${(+r.lat).toFixed(7)},${(+r.lng).toFixed(7)}`;
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=walking`;
}
function openGoogle(id){const r=state.records.find(x=>x.id===id);if(r)window.open(googleSearchUrl(r),'_blank','noopener')}
async function openBothPositions(id){
  const r=state.records.find(x=>x.id===id);if(!r)return;
  if(Number.isFinite(+r.googleLat)&&Number.isFinite(+r.googleLng)){window.open(comparisonMapUrl(r),'_blank','noopener');return}
  if(!getGoogleKey()){alert("Use Compare Google during surveying, or add your Google Maps browser API key in Settings. NumberWalk needs Google's current geocoded position before it can show both points.");return}
  if(apiRemaining()<=0){alert(`Daily Google comparison limit reached (${apiLimit()}).`);return}
  const popup=window.open('about:blank','_blank');if(!popup){alert('Safari blocked the comparison window. Allow pop-ups for NumberWalk and try again.');return}
  try{popup.document.title='NumberWalk – finding Google position';popup.document.body.textContent='Finding Google position…';popup.opener=null}catch(_){ }
  try{
    if(!consumeApiCall()){popup.close();return}
    const maps=await loadGoogleMaps(),result=await geocodeInBrowser(maps,r.address||''),loc=result.geometry.location;
    r.googleLat=loc.lat();r.googleLng=loc.lng();r.googleComparedAt=new Date().toISOString();save();renderQueue();
    popup.location.href=comparisonMapUrl(r);
  }catch(e){console.error('Could not prepare comparison map',e);try{popup.close()}catch(_){ }alert("Could not get Google's current position for this address. Check the API key and Google API settings.")}
}

function csvCell(v){const s=String(v??'');return /[",\n\r]/.test(s)?`"${s.replace(/"/g,'""')}"`:s}
function backupCsv(){
  const header=['house','address','latitude','longitude','surveyed_at','submitted','google_latitude','google_longitude','google_address_link','surveyed_pin_link','comparison_map_link'];
  const rows=state.records.filter(r=>Number.isFinite(+r.lat)&&Number.isFinite(+r.lng)).map(r=>[r.house,r.address,(+r.lat).toFixed(7),(+r.lng).toFixed(7),r.created||'',r.submitted?'yes':'no',Number.isFinite(+r.googleLat)?(+r.googleLat).toFixed(7):'',Number.isFinite(+r.googleLng)?(+r.googleLng).toFixed(7):'',googleSearchUrl(r),surveyedPinUrl(r),comparisonMapUrl(r)]);
  return [header,...rows].map(row=>row.map(csvCell).join(',')).join('\r\n');
}
async function shareBackup(){
  if(!state.records.length){alert('There is nothing to back up yet.');return}
  const stamp=new Date().toISOString().slice(0,10),csv=backupCsv(),file=new File([csv],`numberwalk-backup-${stamp}.csv`,{type:'text/csv'});
  try{
    if(navigator.share&&navigator.canShare?.({files:[file]})){
      await navigator.share({title:`NumberWalk backup ${stamp}`,text:`NumberWalk survey backup with ${state.records.length} surveyed addresses. Choose Mail to email yourself a copy.`,files:[file]});return;
    }
  }catch(e){if(e?.name==='AbortError')return;console.warn('Share failed',e)}
  const blobUrl=URL.createObjectURL(file),a=document.createElement('a');a.href=blobUrl;a.download=file.name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(blobUrl),1000);
  const lines=state.records.slice(0,30).map(r=>`${r.address}\n${googleSearchUrl(r)}\nSurveyed pin: ${surveyedPinUrl(r)}`).join('\n\n');
  if(state.records.length<=30){window.location.href=`mailto:?subject=${encodeURIComponent(`NumberWalk backup ${stamp}`)}&body=${encodeURIComponent(lines+'\n\nA CSV backup has also been downloaded.')}`}
  else alert('The CSV backup has been downloaded. This browser cannot attach it automatically; email the downloaded CSV file to yourself.');
}

function loadGoogleMaps(){
  const key=getGoogleKey();if(!key)return Promise.reject(new Error('NO_KEY'));
  if(window.google?.maps?.Geocoder){googleMapsKeyLoaded=key;return Promise.resolve(window.google.maps)}
  if(googleMapsPromise){if(googleMapsKeyLoaded&&googleMapsKeyLoaded!==key)return Promise.reject(new Error('KEY_CHANGED'));return googleMapsPromise}
  googleMapsKeyLoaded=key;
  googleMapsPromise=new Promise((resolve,reject)=>{
    const callback='numberWalkGoogleReady_'+Date.now(),script=document.createElement('script');
    const timer=setTimeout(()=>{cleanup();googleMapsPromise=null;reject(new Error('LOAD_TIMEOUT'))},15000);
    function cleanup(){clearTimeout(timer);try{delete window[callback]}catch(_){window[callback]=undefined}}
    window[callback]=()=>{cleanup();if(window.google?.maps?.Geocoder)resolve(window.google.maps);else{googleMapsPromise=null;reject(new Error('LOAD_FAILED'))}};
    script.async=true;script.defer=true;script.src=`https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&loading=async&callback=${callback}`;
    script.onerror=()=>{cleanup();googleMapsPromise=null;reject(new Error('LOAD_FAILED'))};document.head.appendChild(script);
  });return googleMapsPromise;
}
function localDateKey(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function refreshApiUsage(){const today=localDateKey();if(!state.apiUsage||state.apiUsage.date!==today){state.apiUsage={date:today,count:0};save()}return state.apiUsage}
function apiLimit(){const n=parseInt(state.dailyApiLimit,10);return Number.isFinite(n)&&n>=1?n:DEFAULT_DAILY_API_LIMIT}
function apiRemaining(){const u=refreshApiUsage();return Math.max(0,apiLimit()-u.count)}
function updateApiUsageDisplay(){const el=$('apiUsageStatus');if(el){const u=refreshApiUsage();el.textContent=`Google comparisons today: ${u.count} / ${apiLimit()} (${apiRemaining()} remaining)`}}
function consumeApiCall(){const u=refreshApiUsage();if(u.count>=apiLimit())return false;u.count+=1;save();updateApiUsageDisplay();return true}
function geocodeInBrowser(maps,addressText){return new Promise((resolve,reject)=>{const geocoder=new maps.Geocoder();geocoder.geocode({address:addressText},(results,status)=>{if(status==='OK'&&results?.length)resolve(results[0]);else reject(new Error(status||'NO_RESULTS'))})})}
async function compare(){
  if(!selectedLatLng){alert('Select the correct building first.');return}if(!getGoogleKey()){$('settingsDialog').showModal();return}
  if(apiRemaining()<=0){alert(`Daily Google comparison limit reached (${apiLimit()}).`);return}
  $('googlePosition').textContent='Checking…';
  try{
    if(!consumeApiCall())return;const maps=await loadGoogleMaps(),result=await geocodeInBrowser(maps,address()),loc=result.geometry.location,p={lat:loc.lat(),lng:loc.lng()};
    if(googleMarker)map.removeLayer(googleMarker);googleMarker=L.marker([p.lat,p.lng],{icon:L.divIcon({className:'google-marker',iconSize:[16,16]})}).addTo(map);
    lastGoogleComparison={lat:p.lat,lng:p.lng};const d=distance(selectedLatLng.lat,selectedLatLng.lng,p.lat,p.lng);$('googlePosition').textContent=`Google ${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`;$('shiftRow').textContent=`Survey point is ${Math.round(d)} m from Google's geocoded position.`;$('shiftRow').classList.remove('hidden');
  }catch(e){console.error('Google comparison failed',e);$('googlePosition').textContent='Comparison failed';alert('Google comparison failed. Check the API key, billing, API restrictions and website restriction.')}
}
function distance(a,b,c,d){const R=6371000,x=(c-a)*Math.PI/180,y=(d-b)*Math.PI/180,z=Math.sin(x/2)**2+Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(y/2)**2;return 2*R*Math.atan2(Math.sqrt(z),Math.sqrt(1-z))}
function tab(name){
  document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===name));document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));$(name+'Tab').classList.add('active');
  if(name==='review')renderReview();if(name==='queue')renderQueue();setTimeout(()=>{if(name==='survey')map.invalidateSize()},50);
}

// UI bindings
document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>tab(b.dataset.tab));
$('gpsBtn').onclick=locate;$('rotateLeftBtn').onclick=()=>rotateMap(-15);$('rotateRightBtn').onclick=()=>rotateMap(15);$('northBtn').onclick=northUp;
$('prevNumberBtn').onclick=()=>changeNumber(-1);$('nextNumberBtn').onclick=()=>changeNumber(1);$('changeSessionBtn').onclick=openSession;$('cancelSessionBtn').onclick=()=>$('sessionDialog').close();
document.querySelectorAll('.next-step').forEach(b=>b.onclick=()=>setNextStep(+b.dataset.step));
$('sessionForm').onsubmit=e=>{e.preventDefault();const nextStep=Math.max(-2,Math.min(2,+$('defaultStep').value||0));state.session={id:Date.now().toString(),street:$('street').value.trim(),locality:$('locality').value.trim(),postcode:$('postcode').value.trim(),startNumber:$('startNumber').value.trim(),nextStep};$('houseNumber').value=state.session.startNumber;save();$('sessionDialog').close();renderAll()};
$('saveNextBtn').onclick=saveRecord;$('compareBtn').onclick=compare;$('findMyAddressBtn').onclick=()=>openFindMyAddress(currentAddressText());$('shareBackupBtn').onclick=shareBackup;$('reviewMapBtn').onclick=renderReview;
$('settingsBtn').onclick=()=>{$('googleApiKey').value=getGoogleKey();$('rememberApiKey').checked=!!state.rememberApiKey;$('dailyApiLimit').value=apiLimit();updateApiUsageDisplay();$('settingsDialog').showModal()};
$('saveKeyBtn').onclick=()=>{const next=$('googleApiKey').value.trim();if(next!==getGoogleKey()&&googleMapsPromise)alert('API key saved. Reload NumberWalk before using Google comparison with the new key.');setGoogleKey(next,$('rememberApiKey').checked);const lim=parseInt($('dailyApiLimit').value,10);state.dailyApiLimit=Number.isFinite(lim)&&lim>=1?Math.min(lim,10000):DEFAULT_DAILY_API_LIMIT;save();updateApiUsageDisplay();$('settingsDialog').close()};
$('clearKeyBtn').onclick=()=>{setGoogleKey('',false);$('googleApiKey').value='';$('rememberApiKey').checked=false};
$('clearSurveyDataBtn').onclick=()=>{if(!confirm('Clear all surveyed houses from NumberWalk on this device? Your Google API key and settings will be kept. This cannot be undone.'))return;state.records=[];save();clearSelection();renderAll();alert('Survey data cleared. Your API key and settings have been kept.')};
$('clearLocalDataBtn').onclick=()=>{if(!confirm('Clear all NumberWalk survey records, settings and API-key storage on this device? This cannot be undone.'))return;try{localStorage.removeItem(K);sessionStorage.removeItem(API_SESSION_KEY)}catch(_){ }location.reload()};
document.body.onclick=e=>{
  const b=e.target.closest('[data-both]');if(b){openBothPositions(b.dataset.both);return}
  const f=e.target.closest('[data-official]');if(f){const r=state.records.find(x=>x.id===f.dataset.official);openFindMyAddress(r?r.address:'');return}
  const o=e.target.closest('[data-open]');if(o)openGoogle(o.dataset.open);
  const d=e.target.closest('[data-delete]');if(d&&confirm('Delete this surveyed house?')){state.records=state.records.filter(r=>r.id!==d.dataset.delete);save();renderSurveyMarkers();renderReview();renderQueue()}
  const s=e.target.closest('[data-submit]');if(s){const r=state.records.find(r=>r.id===s.dataset.submit);if(r){r.submitted=!r.submitted;save();renderSurveyMarkers();renderQueue()}}
};
document.querySelectorAll('.filter-button').forEach(b=>b.onclick=()=>{queueFilter=b.dataset.filter;document.querySelectorAll('.filter-button').forEach(x=>x.classList.toggle('active',x===b));renderQueue()});
if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
initMap();renderAll();locate();
})();

