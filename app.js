import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js';
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect,
  getRedirectResult, onAuthStateChanged, signOut, setPersistence, browserLocalPersistence
} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js';
import {
  getFirestore, doc, getDoc, setDoc, collection, getDocs, writeBatch
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
let state = { user:null, trip:null, days:[], bookings:[], page:'today' };

const $ = s => document.querySelector(s);
const content = $('#content');

function esc(v=''){return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function money(n){return new Intl.NumberFormat('zh-HK',{maximumFractionDigits:2}).format(n||0)}
function fmtDate(d){return new Intl.DateTimeFormat('zh-HK',{month:'numeric',day:'numeric',weekday:'short'}).format(d)}

async function login(){
  $('#loginStatus').textContent='正在開啟 Google 登入…';
  try{
    const mobile=/iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if(mobile) await signInWithRedirect(auth,provider); else await signInWithPopup(auth,provider);
  }catch(e){ $('#loginStatus').textContent='登入失敗：'+e.message; }
}
$('#loginBtn').addEventListener('click',login);
getRedirectResult(auth).catch(()=>{});

onAuthStateChanged(auth, async user=>{
  state.user=user;
  if(!user){ $('#loginView').classList.remove('hidden'); $('#mainView').classList.add('hidden'); return; }
  $('#loginView').classList.add('hidden'); $('#mainView').classList.remove('hidden');
  $('#profileInfo').innerHTML=`<p><strong>${esc(user.displayName||'')}</strong><br><span class="muted">${esc(user.email||'')}</span></p>`;
  await loadTrip(); render();
});

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
    console.error(e); state.trip=null; state.days=[]; state.bookings=[];
  }
}

function render(){
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
  content.innerHTML=`<div class="card"><h2>快速資訊</h2><div class="kv"><div>旅程</div><div>${esc(trip.title||'首爾旅遊 2026')}</div><div>日期</div><div>${esc(trip.dateRange||'2026/8/19–8/23')}</div><div>人數</div><div>${esc(trip.travellers||'4')}</div></div></div>
  <div class="card"><h2>匯入私人行程資料</h2><p class="muted">選擇由我提供的 <code>seoul-private-data.json</code>。資料會直接寫入你登入帳戶可存取的 Firestore；JSON 不需要上載到 GitHub。</p><label class="file-label">選擇私人 JSON<input id="importFile" type="file" accept="application/json"></label><div id="importStatus" class="small muted" style="margin-top:10px"></div></div>
  <div class="card"><h2>安全提醒</h2><div class="notice good">網站程式碼不包含旅客姓名、電子機票號碼、預訂編號等私人資料；這些資料只會在匯入後存入 Firestore。</div></div>`;
  $('#importFile').onchange=importPrivateData;
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

if('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js').catch(console.warn);
