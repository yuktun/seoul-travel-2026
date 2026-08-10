import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js';
import {
  getAuth, GoogleAuthProvider, signInWithPopup,
  onAuthStateChanged, signOut, setPersistence, browserLocalPersistence
} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js';
import {
  getFirestore, doc, getDoc, setDoc, collection, getDocs, writeBatch,
  serverTimestamp, onSnapshot
} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyAMALa-iY_5nihmotZ6ipfVI-PCJZlmnII',
  authDomain: 'seoul-travel-2026.firebaseapp.com',
  projectId: 'seoul-travel-2026',
  storageBucket: 'seoul-travel-2026.firebasestorage.app',
  messagingSenderId: '838125537236',
  appId: '1:838125537236:web:cdd6c8b599e0b852e7b841',
  measurementId: 'G-KCMTQH2F49'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
await setPersistence(auth, browserLocalPersistence);

const TRIP_ID = 'seoul-2026';
let state = { user:null, trip:null, days:[], bookings:[], page:'today', isAdmin:false };
let stopAccessListener=null;
let stopApprovalListener=null;
let installPrompt=null;

const $ = s => document.querySelector(s);
const content = $('#content');
const themeMedia = window.matchMedia('(prefers-color-scheme: dark)');
const THEME_KEY = 'themePreference';

function getThemePreference(){
  const pref = localStorage.getItem(THEME_KEY);
  return ['auto','day','night'].includes(pref) ? pref : 'auto';
}

function effectiveTheme(pref=getThemePreference()){
  if(pref === 'night') return 'night';
  if(pref === 'day') return 'day';
  return themeMedia.matches ? 'night' : 'day';
}

function applyTheme(pref=getThemePreference()){
  const effective = effectiveTheme(pref);
  document.documentElement.dataset.themePreference = pref;
  document.documentElement.dataset.theme = effective;
  document.documentElement.style.colorScheme = effective === 'night' ? 'dark' : 'light';
  const meta = document.querySelector('#themeColorMeta');
  if(meta) meta.setAttribute('content', effective === 'night' ? '#0b1020' : '#f5f6f8');
  return effective;
}

function setThemePreference(pref){
  if(!['auto','day','night'].includes(pref)) return;
  localStorage.setItem(THEME_KEY,pref);
  applyTheme(pref);
  if(state.page === 'more') renderMore();
}

function themePreferenceLabel(pref){
  return ({auto:'自動',day:'日間',night:'夜間'})[pref] || '自動';
}

function effectiveThemeLabel(theme){
  return theme === 'night' ? '夜間模式' : '日間模式';
}

applyTheme();
function handleSystemThemeChange(){
  if(getThemePreference()==='auto'){
    applyTheme('auto');
    if(state.page==='more') renderMore();
  }
}

function isStandalone(){
  return window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
}

function installButtonLabel(){
  if(isStandalone())return '已加入主畫面';
  return installPrompt?'安裝旅遊 App':'加入主畫面';
}
if(themeMedia.addEventListener) themeMedia.addEventListener('change',handleSystemThemeChange);
else themeMedia.addListener?.(handleSystemThemeChange);

function esc(v=''){return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function money(n){return new Intl.NumberFormat('zh-HK',{maximumFractionDigits:2}).format(n||0)}
function fmtDate(d){return new Intl.DateTimeFormat('zh-HK',{month:'numeric',day:'numeric',weekday:'short'}).format(d)}

async function login(){
  $('#loginStatus').textContent='正在開啟 Google 登入…';
  try{
    await signInWithPopup(auth,provider);
    $('#loginStatus').textContent='';
  }catch(e){
    const retryCodes=['auth/popup-blocked','auth/popup-closed-by-user','auth/cancelled-popup-request'];
    $('#loginStatus').textContent=retryCodes.includes(e.code)
      ? '登入視窗未能完成。請允許彈出式視窗後再試一次。'
      : '登入失敗，請稍後再試。';
  }
}
$('#loginBtn').addEventListener('click',login);

onAuthStateChanged(auth, async user=>{
  stopAccessListener?.(); stopAccessListener=null;
  clearPrivateState();
  state.user=user;
  $('#loginView').classList.toggle('hidden',!!user);
  $('#accessView').classList.add('hidden');
  $('#mainView').classList.add('hidden');
  if(!user){
    $('#profileInfo').textContent='';
    if($('#profileDialog').open) $('#profileDialog').close();
    return;
  }
  $('#profileInfo').innerHTML=`<p><strong>${esc(user.displayName||'')}</strong><br><span class="muted">${esc(user.email||'')}</span></p>`;
  showAccessState('checking');
  await resolveAccess();
});

function clearPrivateState(){
  stopApprovalListener?.(); stopApprovalListener=null;
  state.trip=null;
  state.days=[];
  state.bookings=[];
  state.isAdmin=false;
  state.page='today';
  content.replaceChildren();
}

function showAccessState(status){
  const states={
    checking:['⏳','正在檢查權限','請稍候…',false],
    pending:['🕐','等候管理員批准','你的加入申請已送出。批准後，這個畫面會自動更新。',true],
    rejected:['🔒','申請未獲批准','請聯絡旅程管理員了解詳情。',true],
    error:['⚠️','未能檢查權限','請確認網絡連線，或請管理員完成 Firebase 權限設定。',true]
  };
  const [icon,title,message,retry]=states[status]||states.error;
  $('#loginView').classList.add('hidden'); $('#mainView').classList.add('hidden'); $('#accessView').classList.remove('hidden');
  $('#accessIcon').textContent=icon; $('#accessTitle').textContent=title; $('#accessMessage').textContent=message;
  $('#retryAccessBtn').classList.toggle('hidden',!retry);
}

async function resolveAccess(){
  if(!state.user)return;
  stopAccessListener?.(); stopAccessListener=null;
  showAccessState('checking');
  try{
    const adminSnap=await getDoc(doc(db,'admins',state.user.uid));
    state.isAdmin=adminSnap.exists();
    if(!state.isAdmin){
      const requestRef=doc(db,'accessRequests',state.user.uid);
      let requestSnap=await getDoc(requestRef);
      if(!requestSnap.exists()){
        await setDoc(requestRef,{email:state.user.email||'',displayName:state.user.displayName||'',status:'pending',createdAt:serverTimestamp()});
        requestSnap=await getDoc(requestRef);
      }
      const status=requestSnap.data()?.status;
      if(status!=='approved'){
        showAccessState(status==='rejected'?'rejected':'pending');
        stopAccessListener=onSnapshot(requestRef,snap=>{
          const nextStatus=snap.data()?.status;
          if(nextStatus==='approved') resolveAccess();
          else showAccessState(nextStatus==='rejected'?'rejected':'pending');
        },()=>showAccessState('error'));
        return;
      }
    }
    $('#accessView').classList.add('hidden'); $('#mainView').classList.remove('hidden');
    renderLoading(); await loadTrip(); render();
  }catch(e){showAccessState('error')}
}

function renderLoading(){
  $('#pageTitle').textContent='正在載入';
  content.innerHTML='<div class="card loading-state" role="status"><span class="spinner" aria-hidden="true"></span><div><strong>正在載入行程</strong><div class="muted small">請稍候…</div></div></div>';
}

async function loadTrip(){
  try{
    const tripSnap=await getDoc(doc(db,'trips',TRIP_ID));
    state.trip=tripSnap.exists()?tripSnap.data():null;
    const [daySnap,bookSnap]=await Promise.all([
      getDocs(collection(db,'trips',TRIP_ID,'days')),
      getDocs(collection(db,'trips',TRIP_ID,'bookings'))
    ]);
    state.days=daySnap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>a.date.localeCompare(b.date));
    state.bookings=bookSnap.docs.map(d=>({id:d.id,...d.data()}));
  }catch(e){
    console.warn('無法載入行程資料。'); state.trip=null; state.days=[]; state.bookings=[];
  }
}

function render(){
  if(state.page!=='more'){stopApprovalListener?.();stopApprovalListener=null}
  document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.page===state.page));
  const titles={today:'今日',days:'行程',bookings:'預訂',money:'匯率',more:'更多'}; $('#pageTitle').textContent=titles[state.page];
  if(!state.trip && state.page!=='more') return renderEmpty();
  ({today:renderToday,days:renderDays,bookings:renderBookings,money:renderMoney,more:renderMore}[state.page])();
}

function renderEmpty(){
  content.innerHTML=`<div class="card"><h2>尚未匯入行程</h2><p class="muted">Firebase 已連接，但 Firestore 暫時沒有首爾旅遊資料。</p><button class="primary-btn" id="goImport">前往匯入資料</button></div>`;
  $('#goImport').onclick=()=>{state.page='more';render()};
}

function targetDay(){
  if(!state.days.length) return null;
  const now=new Date(); const ymd=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');
  return state.days.find(d=>d.date===ymd)||state.days[0];
}

function eventHtml(e){
  const badges=(e.tags||[]).map(t=>`<span class="badge ${t==='必去'?'must':t==='可略過'?'optional':''}">${esc(t)}</span>`).join('');
  const maps=[];
  if(e.googleMaps) maps.push(`<a class="link-btn" target="_blank" rel="noopener" href="${esc(e.googleMaps)}">Google 地圖</a>`);
  if(e.naverMaps) maps.push(`<a class="link-btn" target="_blank" rel="noopener" href="${esc(e.naverMaps)}">Naver Map</a>`);
  return `<div class="event"><div class="time">${esc(e.time||'')}</div><div><div class="event-title">${esc(e.title||'')}</div>${e.note?`<div class="event-note">${esc(e.note)}</div>`:''}${badges}${maps.join('')}</div></div>`;
}

function renderToday(){
  const d=targetDay(); if(!d)return renderEmpty();
  content.innerHTML=`<section class="hero"><div class="sub">${esc(d.dateLabel||d.date)}</div><div class="big">${esc(d.area||'首爾')}</div><div class="meta">${esc(d.summary||'')}</div></section>
  <div class="section-title">今日行程</div><div class="card timeline">${(d.events||[]).map(eventHtml).join('')}</div>`;
}

function renderDays(){
  content.innerHTML=state.days.map(d=>`<div class="card day-card" data-day="${esc(d.id)}"><div class="day-row"><div><div class="day-date">${esc(d.dateLabel||d.date)}</div><div class="day-area">${esc(d.area||'')}</div></div><div class="chev">›</div></div></div>`).join('');
  document.querySelectorAll('[data-day]').forEach(el=>el.onclick=()=>renderDayDetail(el.dataset.day));
}
function renderDayDetail(id){
  const d=state.days.find(x=>x.id===id); if(!d)return;
  $('#pageTitle').textContent=d.dateLabel||d.date;
  content.innerHTML=`<button class="secondary-btn" id="backDays">← 返回全部行程</button><section class="hero" style="margin-top:12px"><div class="sub">${esc(d.dateLabel||'')}</div><div class="big">${esc(d.area||'')}</div><div class="meta">${esc(d.summary||'')}</div></section><div class="card timeline">${(d.events||[]).map(eventHtml).join('')}</div>`;
  $('#backDays').onclick=()=>{state.page='days';render()};
}

function revealBlock(value){return `<span class="sensitive">${esc(value||'—')}</span>`}
function bookingCard(b){
  const rows=(b.details||[]).map(r=>`<div>${esc(r.label)}</div><div class="${r.sensitive?'sensitive':''}">${esc(r.value)}</div>`).join('');
  return `<article class="booking-card"><div class="booking-label">${esc(b.type||'預訂')}</div><div class="booking-value">${esc(b.title||'')}</div><div class="kv">${rows}</div>${(b.details||[]).some(r=>r.sensitive)?'<button class="reveal-btn">顯示／隱藏敏感資料</button>':''}</article>`;
}
function renderBookings(){
  content.innerHTML=`<div class="notice danger">此頁包含私人預訂資料。請勿在公共裝置上長時間顯示。</div><div class="section-title">旅程預訂</div><div class="booking-grid">${state.bookings.map(bookingCard).join('')}</div>`;
  document.querySelectorAll('.reveal-btn').forEach(btn=>btn.onclick=()=>btn.closest('.booking-card').querySelectorAll('.sensitive').forEach(x=>x.classList.toggle('reveal')));
}

function renderMoney(){
  const rate=Number(localStorage.getItem('krwHkdRate')||0.0055);
  content.innerHTML=`<div class="card"><h2>韓圜 ↔ 港元</h2><p class="muted small">可手動設定匯率，離線時仍可使用。</p><div class="calc">
  <div class="calc-input"><input id="krw" inputmode="decimal" value="10000"><span class="currency">KRW</span></div>
  <div class="calc-input"><input id="hkd" inputmode="decimal"><span class="currency">HKD</span></div>
  <div class="rate-row"><span>1 KRW =</span><input id="rate" inputmode="decimal" value="${rate}"><span>HKD</span></div>
  <div class="quick-grid">${[10000,30000,50000,100000].map(v=>`<button class="quick-btn" data-v="${v}">₩${money(v)}</button>`).join('')}</div>
  </div></div>`;
  const krw=$('#krw'),hkd=$('#hkd'),r=$('#rate');
  const f=()=>hkd.value=(Number(krw.value||0)*Number(r.value||0)).toFixed(2); const g=()=>krw.value=(Number(hkd.value||0)/Number(r.value||1)).toFixed(0);
  krw.oninput=f; hkd.oninput=g; r.oninput=()=>{localStorage.setItem('krwHkdRate',r.value);f()}; f();
  document.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>{krw.value=b.dataset.v;f()});
}

function renderMore(){
  const trip=state.trip||{};
  const themePref=getThemePreference();
  const currentTheme=effectiveTheme(themePref);
  const importSection=state.isAdmin?`<div class="card"><h2>匯入私人行程資料</h2><p class="muted">選擇由我提供的 <code>seoul-private-data.json</code>。資料會直接寫入你登入帳戶可存取的 Firestore；JSON 不需要上載到 GitHub。</p><label class="file-label">選擇私人 JSON<input id="importFile" type="file" accept="application/json"></label><div id="importStatus" class="small muted" style="margin-top:10px"></div></div>`:'';
  content.innerHTML=`${state.isAdmin?'<div class="card"><h2>加入申請</h2><div id="approvalStatus" class="small approval-status" role="status" aria-live="polite"></div><div id="approvalList" class="approval-list"><span class="muted small">正在載入…</span></div></div>':''}<div class="card"><h2>外觀</h2><p class="muted small">預設為自動，會跟隨手機或電腦的系統外觀。你亦可以固定使用日間或夜間模式。</p>
  <div class="theme-options" role="group" aria-label="外觀模式">
    <button class="theme-choice ${themePref==='auto'?'active':''}" data-theme-pref="auto" aria-pressed="${themePref==='auto'}"><span class="theme-icon">◐</span><span>自動</span><small>跟隨系統</small></button>
    <button class="theme-choice ${themePref==='day'?'active':''}" data-theme-pref="day" aria-pressed="${themePref==='day'}"><span class="theme-icon">☀️</span><span>日間</span><small>淺色主題</small></button>
    <button class="theme-choice ${themePref==='night'?'active':''}" data-theme-pref="night" aria-pressed="${themePref==='night'}"><span class="theme-icon">🌙</span><span>夜間</span><small>深色主題</small></button>
  </div>
  <div class="theme-status">偏好：${themePreferenceLabel(themePref)} · 目前：${effectiveThemeLabel(currentTheme)}</div></div>
  <div class="card"><h2>快速資訊</h2><div class="kv"><div>旅程</div><div>${esc(trip.title||'首爾旅遊 2026')}</div><div>日期</div><div>${esc(trip.dateRange||'2026/8/19–8/23')}</div><div>人數</div><div>${esc(trip.travellers||'4')}</div></div></div>
  ${importSection}
  <div class="card"><h2>安全提醒</h2><div class="notice good">網站程式碼不包含旅客姓名、電子機票號碼、預訂編號等私人資料；這些資料只會在匯入後存入 Firestore。</div></div>
  <div class="card install-card"><h2>加入主畫面</h2><p class="muted">把首爾旅遊 App 加到手機主畫面，之後可以像一般 App 一樣快速開啟。</p><button id="installAppBtn" class="primary-btn full" ${isStandalone()?'disabled':''}>${installButtonLabel()}</button></div>`;
  document.querySelectorAll('[data-theme-pref]').forEach(btn=>btn.onclick=()=>setThemePreference(btn.dataset.themePref));
  const importFile=$('#importFile');
  if(importFile) importFile.onchange=importPrivateData;
  $('#installAppBtn').onclick=installApp;
  if(state.isAdmin) renderApprovalRequests();
}

async function installApp(){
  if(isStandalone())return;
  if(installPrompt){
    const prompt=installPrompt; installPrompt=null;
    await prompt.prompt();
    await prompt.userChoice;
    if(state.page==='more')renderMore();
    return;
  }
  const ios=/iPhone|iPad|iPod/i.test(navigator.userAgent);
  $('#installInstructions').innerHTML=ios
    ? '<ol class="install-steps"><li>請先用 Safari 開啟這個網站。</li><li>按畫面下方的「分享」按鈕 <strong>□↑</strong>。</li><li>向下捲動並選擇「加入主畫面」。</li><li>按右上角「新增」。</li></ol>'
    : '<p>請開啟瀏覽器選單，選擇「安裝應用程式」或「加入主畫面」。</p>';
  $('#installDialog').showModal();
}

function renderApprovalRequests(){
  stopApprovalListener?.(); stopApprovalListener=null;
  const list=$('#approvalList'); if(!list)return;
  stopApprovalListener=onSnapshot(collection(db,'accessRequests'),snap=>{
    const currentList=$('#approvalList');
    if(!currentList||!state.isAdmin)return;
    const pending=snap.docs.filter(d=>d.data().status==='pending');
    currentList.innerHTML=pending.length?pending.map(d=>{const r=d.data();return `<div class="approval-row"><div><strong>${esc(r.displayName||'未有名稱')}</strong><div class="muted small">${esc(r.email||'')}</div></div><button class="primary-btn approve-btn" data-approve="${esc(d.id)}">批准</button></div>`}).join(''):'<div class="notice good">目前沒有等候批准的申請。</div>';
    currentList.querySelectorAll('[data-approve]').forEach(btn=>btn.onclick=async()=>{
      if(!state.isAdmin||!state.user)return;
      const adminUid=state.user.uid;
      btn.disabled=true; btn.textContent='正在批准…';
      try{
        await setDoc(doc(db,'accessRequests',btn.dataset.approve),{status:'approved',approvedAt:serverTimestamp(),approvedBy:adminUid},{merge:true});
        const status=$('#approvalStatus'); if(status){status.textContent='已批准加入申請。';status.classList.remove('error')}
      }catch(e){
        btn.disabled=false;btn.textContent='批准';
        const status=$('#approvalStatus'); if(status){status.textContent='批准失敗，請稍後再試。';status.classList.add('error')}
      }
    });
  },()=>{
    const currentList=$('#approvalList');
    if(currentList) currentList.innerHTML='<div class="notice danger">未能載入申請，請稍後再試。</div>';
  });
}

async function importPrivateData(ev){
  const status=$('#importStatus');
  try{
    const file=ev.target.files?.[0]; if(!file)return;
    const payload=JSON.parse(await file.text());
    if(payload.tripId!==TRIP_ID) throw new Error('tripId 不符');
    status.textContent='正在寫入 Firestore…';
    const batch=writeBatch(db);
    batch.set(doc(db,'trips',TRIP_ID),payload.trip,{merge:true});
    for(const d of payload.days||[]) batch.set(doc(db,'trips',TRIP_ID,'days',d.id),d.data,{merge:true});
    for(const b of payload.bookings||[]) batch.set(doc(db,'trips',TRIP_ID,'bookings',b.id),b.data,{merge:true});
    await batch.commit();
    status.textContent='✅ 匯入完成。'; await loadTrip(); state.page='today'; render();
  }catch(e){status.textContent='❌ 匯入失敗：'+e.message}
}

document.querySelectorAll('.nav-item').forEach(btn=>btn.onclick=()=>{state.page=btn.dataset.page;render()});
$('#profileBtn').onclick=()=>$('#profileDialog').showModal(); $('#closeProfile').onclick=()=>$('#profileDialog').close();
$('#logoutBtn').onclick=()=>signOut(auth).then(()=>$('#profileDialog').close());
$('#accessLogoutBtn').onclick=()=>signOut(auth);
$('#retryAccessBtn').onclick=resolveAccess;
$('#closeInstall').onclick=()=>$('#installDialog').close();
$('#confirmInstallHelp').onclick=()=>$('#installDialog').close();

window.addEventListener('beforeinstallprompt',e=>{
  e.preventDefault(); installPrompt=e;
  if(state.page==='more'&&!$('#mainView').classList.contains('hidden'))renderMore();
});
window.addEventListener('appinstalled',()=>{
  installPrompt=null;
  if(state.page==='more'&&!$('#mainView').classList.contains('hidden'))renderMore();
});

if('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js',{updateViaCache:'none'}).catch(()=>{});
