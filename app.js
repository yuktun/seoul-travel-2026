import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js';
import {
  getAuth, GoogleAuthProvider, signInWithPopup,
  onAuthStateChanged, signOut, setPersistence, browserLocalPersistence, getIdToken
} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js';
import {
  getFirestore, doc, getDoc, setDoc, deleteDoc, collection, getDocs, writeBatch,
  getDocFromCache, getDocsFromCache, serverTimestamp, onSnapshot
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
console.info('[AppInit] start');
console.info('[access] Firebase Auth initialization started');
try{await setPersistence(auth,browserLocalPersistence);console.info('[access] local authentication persistence ready')}
catch(error){console.warn('[access] local authentication persistence unavailable; continuing with Firebase default persistence',{code:error?.code||'',message:error?.message||''})}

const TRIP_ID = 'seoul-2026';
const SEOUL_FACTS=[
  '首爾擁有超過二千年的城市歷史，曾是百濟與朝鮮王朝的首都。',
  '朝鮮太祖在 1394 年把首都定於漢陽，也就是今天的首爾。',
  '古代漢陽城牆全長約 18 公里，沿著四座山峰環抱首都。',
  '首爾有五座朝鮮王朝宮殿，每座都保存著不同時期的故事。',
  '「景福」二字有「偉大的福氣」之意，難怪景福宮名字這麼喜氣。',
  '昌德宮以建築與自然地形的和諧聞名，並列入世界文化遺產。',
  '漢江在朝鮮時代是重要運輸線，稅糧與貨物會沿河送進首都。',
  '南山昔日設有烽火台，以煙與火把邊境消息傳往王城。',
  '鐘路在朝鮮時代已有官方認可的商店，是漢陽的重要商業中心。',
  '清溪川一帶早在朝鮮後期便商業興盛，今日散步時仍能感受城市脈搏。',
  '廣藏市場是首爾最早由私人商人建立的全年市場之一。',
  '廣藏市場不只有美食，也以韓服、布料和古著聞名。',
  '首爾歷史上曾有漢城、漢陽、京城等不同名稱，每個名字都代表一段時代。',
  '漢江有約 41 公里流經首爾，最寬處可達約 1.2 公里。',
  '首爾人把漢江視為城市代表；河邊也是野餐、踏單車與看夜景的熱門去處。',
  '韓式餐桌上的小菜叫「반찬（banchan）」，大家可以自由配搭不同味道。',
  '拌飯很能代表韓國飲食的「混合文化」：各種食材拌在一起產生新風味。',
  '朝鮮王室料理由受過嚴格訓練的宮女與專業男廚師共同準備。',
  '韓屋會順應自然環境設計；傳統暖炕「온돌」則從地板下方供暖。',
  '首爾最迷人的地方，是宮殿、市場、咖啡店與未來感建築可以在同一天相遇。',
  '韓文字母「한글（Hangeul）」由世宗大王推動創製，並在 1446 年正式頒布。',
  '韓文的基本字母會組合成一個個方形音節，看起來像小積木。',
  '韓國人進入許多住宅前會先脫鞋，玄關通常就是室內與室外的分界。',
  '向長輩遞東西時使用雙手，是韓國常見的禮貌表現。',
  '韓式餐具常見金屬筷子配長柄湯匙，吃飯時兩者各有不同用途。',
  '用餐前說「잘 먹겠습니다」，意思接近「我會好好享用這頓飯」。',
  '泡菜不只一種；不同季節、地區和食材能變化出許多風味。',
  '韓國泡菜透過發酵產生酸香，時間與溫度都會改變它的味道。',
  '韓式烤肉常用生菜包著肉、醬料和配菜一起吃，這種吃法叫「쌈（ssam）」。',
  '紫菜包飯「김밥」看似簡單，內餡卻可由蔬菜、蛋、肉類變出很多版本。',
  '辣炒年糕「떡볶이」是經典街頭小吃，甜辣醬汁是它的靈魂。',
  '糖餅「호떡」外脆內軟，常包著黑糖、肉桂和果仁，是人氣暖心小吃。',
  '韓國人在生日常喝海帶湯，這個習慣也帶有感謝母親的意思。',
  '農曆新年吃年糕湯「떡국」，傳統上象徵迎接新一年與長一歲。',
  '中秋節常見的松糕「송편」是半月形米糕，會包入芝麻、豆或栗子。',
  '韓國傳統周歲宴叫「돌잔치」，孩子會從物品中抓選一件，象徵未來。',
  '北村的「北」源於它位於清溪川與鐘路以北，區內保存許多韓屋。',
  '仁寺洞長久以來聚集書畫、古董、工藝和傳統茶館，是尋找文化紀念品的好地方。',
  '益善洞以細小巷弄和韓屋聞名，傳統屋舍如今也容納咖啡店與小店。',
  '聖水洞曾以製鞋工場和工業空間聞名，後來逐漸發展出創意店舖與咖啡文化。',
  '興仁之門就是俗稱的東大門，名字中的「仁」代表儒家重視的仁德。',
  '東大門設計廣場 DDP 由建築師札哈・哈蒂設計，以流線外形聞名。',
  '清溪川曾被道路覆蓋，2005 年完成復修後重新成為市中心的流水空間。',
  '南山意思就是城市南面的山；從前它位於漢陽城牆南側。',
  '韓國傳統地暖叫「온돌（ondol）」，熱力由地板下方傳上來。',
  '韓屋常設有庭院，房間、屋簷和自然環境會互相配合。',
  '韓國飲食重視時令，春夏秋冬都有適合當季的食材與菜式。',
  '石鍋拌飯底部的鍋巴叫「누룽지」，焦香口感是不少人的最愛。',
  '韓國咖啡店不只是喝咖啡的地方，設計、甜品和拍照氣氛同樣重要。',
  '在首爾，同一條街往往能同時看見數百年古蹟與嶄新潮流，這正是城市的魅力。'
];
const COUNTDOWN_MESSAGES=[
  ['行李還未收拾，心已經飛到首爾。','準備好一起吃、逛、拍照和創造回憶吧！'],
  ['首爾的街道、美食和驚喜正在等我們。','每天近一點，期待也多一點！'],
  ['宮殿、市場、咖啡店和夜景已排好隊。','這趟旅程一定會有很多難忘故事！'],
  ['倒數的不只是日子，還有滿滿的期待。','很快就可以一起踏上首爾街頭了！'],
  ['把胃口、相機和好心情都準備好。','首爾之旅即將正式展開！']
];
let seoulFactIndex=Math.floor(Math.random()*SEOUL_FACTS.length);
const countdownMessage=COUNTDOWN_MESSAGES[Math.floor(Math.random()*COUNTDOWN_MESSAGES.length)];
let state = { user:null, trip:null, days:[], bookings:[], page:'today', isAdmin:false, language:localStorage.getItem('displayLanguage')==='ko'?'ko':'zh' };
let weatherCache=null;
let stopAccessListener=null;
let stopApprovalListener=null;
let installPrompt=null;
let editorContext=null;
let accessInitialization=null;
let accessRunId=0;
const ACCESS_RETRY_DELAYS=[800,1500,3000];
let tripLoadPromise=null;
let tripLoadRunId=0;
let tripLoading=false;
let tripLoadStartedAt=0;
let appHiddenAt=0;
let lastResumeRestartAt=0;
const TRIP_LOAD_TIMEOUT=8000;
const TRIP_RETRY_DELAYS=[800,1500,3000];

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
function externalUrl(value){try{const url=new URL(String(value||''));return ['http:','https:'].includes(url.protocol)?url.href:''}catch(e){return ''}}
function editorUrl(selector,label){const value=$(selector).value.trim();if(value&&!externalUrl(value))throw new Error(`${label}必須以 http:// 或 https:// 開始。`);return value}
function externalLinksHtml(item){const website=externalUrl(item?.website);return website?`<a class="link-btn" target="_blank" rel="noopener" href="${esc(website)}">網站／預訂</a>`:''}
function mapTargetValue(value,label){value=String(value||'').trim();if(value.includes('://')&&!externalUrl(value))throw new Error(`${label}如使用連結，必須是有效的 http:// 或 https:// 連結。`);return value}
function editorMapTarget(selector,label){return mapTargetValue($(selector).value,label)}
function editorMapTargetElement(element,label){return mapTargetValue(element.value,label)}
function googleMapOpenUrl(value){const url=externalUrl(value);if(!url)return '';try{const parsed=new URL(url);if(parsed.hostname==='maps.app.goo.gl'){parsed.search='';parsed.hash='';return parsed.href}return parsed.href}catch(error){return url}}
function mapTargetQuery(value,fallback){
  const target=String(value||'').trim();if(!target)return fallback;
  const url=externalUrl(target);if(!url)return target;
  try{const parsed=new URL(url),path=decodeURIComponent(parsed.pathname);for(const key of ['query','q','destination','daddr']){const found=parsed.searchParams.get(key);if(found)return found}const place=path.match(/\/place\/([^/]+)/);if(place)return place[1].replace(/\+/g,' ');const directions=path.match(/\/dir\/([^/]+)\/([^/]+)/);if(directions)return `${directions[1]} to ${directions[2]}`.replace(/\+/g,' ');const coordinates=path.match(/\/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);if(coordinates)return `${coordinates[1]},${coordinates[2]}`;const dataCoordinates=target.match(/!3d(-?\d+(?:\.\d+)?).*?!4d(-?\d+(?:\.\d+)?)/);if(dataCoordinates)return `${dataCoordinates[1]},${dataCoordinates[2]}`}catch(error){}
  return fallback;
}
function t(zh,ko){return state.language==='ko'?ko:zh}
function localized(obj,key){return state.language==='ko'?(obj?.[`${key}Ko`]||obj?.[`${key}Korean`]||(key==='title'?obj?.koreanName:null)||obj?.[key]):obj?.[key]}
function phoneHtml(value){
  const text=String(value||''),re=/\+?\d[\d\s().-]{6,}\d/g;let out='',last=0,match;
  while((match=re.exec(text))){out+=esc(text.slice(last,match.index));const tel=match[0].replace(/[^\d+]/g,'');out+=`<a class="phone-link" href="tel:${esc(tel)}">${esc(match[0])}</a>`;last=re.lastIndex}
  return out+esc(text.slice(last));
}
function bookingValueHtml(row){
  const phoneLabel=/電話|手機|聯絡|phone|telephone|tel/i.test(String(row?.label||''));
  return phoneLabel?phoneHtml(row?.value):esc(row?.value||'');
}
function areaContext(day){return String(day?.area||'').split(/[・·•]/).filter(Boolean).pop()||''}
function inferredNotePlaces(event){
  if(Array.isArray(event?.places))return event.places.map(place=>typeof place==='string'?place:place?.name).map(x=>String(x||'').trim()).filter(Boolean);
  const note=String(event?.note||'');
  const candidates=note.match(/^(.*?(?:餐飲候選|候選)：)(.+)$/);
  if(candidates)return candidates[2].split('、').map(x=>x.trim()).filter(Boolean);
  const reject=/出口|分鐘|小時|車程|預留|營業|時間|資料|更新|為主|可回|如果|如東大門|之後$/;
  const placeWord=/市場|公園|廣場|一條街|街區|韓屋|村|洞|café|cafe|咖啡|餐廳|食堂|湯|雞|麵|包|bread|플라자|카페|[A-Za-z][A-Za-z0-9 -]{2,}/i;
  return note.split(/[；;，,、／/]/)
    .map(x=>x.replace(/^(?:候選：|餐飲候選：|之後步行至|步行至|再到|可到|或到)\s*/,'').trim())
    .map(x=>x.replace(/或其他.*$/,'').trim())
    .filter(x=>x&&x.length<=32&&!reject.test(x)&&placeWord.test(x));
}
function eventPlaceItems(event){
  const korean=Array.isArray(event?.placeNamesKo)?event.placeNamesKo:[];
  if(Array.isArray(event?.places))return event.places.map((place,index)=>typeof place==='string'?{name:place,nameKo:korean[index]||''}:{...place,name:place?.name||''}).filter(place=>place.name);
  return inferredNotePlaces(event).map((name,index)=>({name,nameKo:korean[index]||''}));
}
function placeButton(event,day,name,index){
  const item=eventPlaceItems(event)[index]||{name};
  const label=state.language==='ko'?(item.nameKo||name):name;
  return `<button class="mini-place-link" data-place-name="${esc(name)}" data-place-label="${esc(label)}" data-place-area="${esc(areaContext(day))}" data-place-target="${esc(item.mapTarget||item.googleMaps||'')}" data-place-website="${esc(externalUrl(item.website))}" data-place-popup="${item.popupMode==='website'?'website':'map'}">${esc(label)}</button>`;
}
function placeChips(event,day,names){
  return `<span class="mini-place-list">${names.map((name,i)=>placeButton(event,day,name,i)).join('')}</span>`;
}
function linkedNoteHtml(note,event,day,names){
  let remaining=note,out='',linked=false;
  while(remaining){
    let found=null;
    names.forEach((name,index)=>{
      const at=remaining.indexOf(name);
      if(at>=0&&(!found||at<found.at||(at===found.at&&name.length>found.name.length)))found={name,index,at};
    });
    if(!found)break;
    out+=phoneHtml(remaining.slice(0,found.at))+placeButton(event,day,found.name,found.index);
    remaining=remaining.slice(found.at+found.name.length);linked=true;
  }
  return linked?out+phoneHtml(remaining):`${phoneHtml(note)}${placeChips(event,day,names)}`;
}
function eventNoteHtml(event,day){
  const note=String(localized(event,'note')||''),original=String(event.note||'');
  const match=original.match(/^(.*?(?:餐飲候選|候選)：)(.+)$/);
  const names=inferredNotePlaces(event);
  if(!names.length)return phoneHtml(note);
  if(!match)return `<span class="event-note-text">${linkedNoteHtml(note,event,day,names)}</span>`;
  const prefix=state.language==='ko'?'추천 장소: ':match[1];
  return `<span>${esc(prefix)}</span>${placeChips(event,day,names)}`;
}
function subwayLineBadge(line){
  const safe=String(line||'').toLowerCase().replace(/[^a-z0-9-]/g,'');
  return `<span class="subway-line subway-line-${safe}" aria-label="${esc(line)}號線">${esc(line)}</span>`;
}
function subwayRouteHtml(subway){
  if(!subway||!Array.isArray(subway.stations)||subway.stations.length<2)return '';
  const stations=subway.stations.map(station=>{
    const lines=Array.isArray(station.lines)?station.lines:[station.line].filter(Boolean);
    const badges=lines.map(subwayLineBadge).join('');
    const name=state.language==='ko'?(station.nameKo||station.name):station.name;
    return `<span class="subway-station">${badges}<span>${esc(name||'')}</span></span>`;
  }).join('<span class="subway-arrow" aria-hidden="true">→</span>');
  const meta=[];
  const duration=state.language==='ko'?(subway.durationKo||subway.duration):subway.duration;
  const exit=state.language==='ko'?(subway.exitKo||subway.exit):subway.exit;
  if(duration)meta.push(esc(duration));if(exit)meta.push(esc(exit));
  return `<div class="subway-route"><div class="subway-route-label">🚇 ${t('地鐵路線','지하철 경로')}</div><div class="subway-stations">${stations}</div>${meta.length?`<div class="subway-meta">${meta.join('<span aria-hidden="true">｜</span>')}</div>`:''}</div>`;
}
const ITINERARY_SUBWAY_ROUTES={
  '2026-08-20':{
    '廣藏市場':{stations:[{name:'明洞站',nameKo:'명동역',line:'4'},{name:'東大門站',nameKo:'동대문역',lines:['4','1']},{name:'鐘路5街站',nameKo:'종로5가역',line:'1'}],duration:'約 12 分鐘',durationKo:'약 12분',exit:'鐘路5街站 8 號出口',exitKo:'종로5가역 8번 출구'},
    '孔德':{stations:[{name:'鐘路3街站',nameKo:'종로3가역',line:'5'},{name:'孔德站',nameKo:'공덕역',line:'5'}],duration:'由仁寺洞步行到鐘路3街站後，車程約 10 分鐘',durationKo:'인사동에서 종로3가역까지 걸은 뒤 약 10분',exit:'孔德站 5 號出口',exitKo:'공덕역 5번 출구'}
  },
  '2026-08-21':{
    '聖水午餐':{stations:[{name:'明洞站',nameKo:'명동역',line:'4'},{name:'東大門歷史文化公園站',nameKo:'동대문역사문화공원역',lines:['4','2']},{name:'聖水站',nameKo:'성수역',line:'2'}],duration:'約 17 分鐘',durationKo:'약 17분',exit:'聖水站 4 號出口',exitKo:'성수역 4번 출구'},
    '東大門':{stations:[{name:'聖水站',nameKo:'성수역',line:'2'},{name:'東大門歷史文化公園站',nameKo:'동대문역사문화공원역',line:'2'}],duration:'約 11 分鐘，前往 DDP 最方便',durationKo:'약 11분, DDP로 갈 때 가장 편리',exit:'DDP：1 號出口',exitKo:'DDP: 1번 출구'},
    '明洞':{stations:[{name:'東大門站',nameKo:'동대문역',line:'4'},{name:'明洞站',nameKo:'명동역',line:'4'}],duration:'約 5 分鐘，毋須轉車',durationKo:'약 5분, 환승 없음'}
  },
  '2026-08-22':{
    '望遠市場':{stations:[{name:'明洞站',nameKo:'명동역',line:'4'},{name:'三角地站',nameKo:'삼각지역',lines:['4','6']},{name:'望遠站',nameKo:'망원역',line:'6'}],duration:'約 28–30 分鐘',durationKo:'약 28–30분',exit:'望遠站 2 號出口',exitKo:'망원역 2번 출구'},
    '弘大商業街':{stations:[{name:'望遠站',nameKo:'망원역',line:'6'},{name:'上水站',nameKo:'상수역',line:'6'}],duration:'約 4 分鐘，毋須轉車',durationKo:'약 4분, 환승 없음',exit:'上水站 1 號出口（適合弘大南面商圈）',exitKo:'상수역 1번 출구 (홍대 남쪽 상권)'}
  }
};
function itinerarySubway(dayId,event){return event?.subway||ITINERARY_SUBWAY_ROUTES[dayId]?.[event?.title]||null}
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

onAuthStateChanged(auth,user=>{
  console.info('[Auth] ready');
  console.info('[access] Firebase Auth initialization completed',user?{uid:user.uid,email:user.email||''}:{user:null});
  initializeAccess({source:'auth-state',restart:true});
},error=>{
  console.error('[access] Firebase Auth initialization failed',{code:error?.code||'',message:error?.message||''});
  showAccessFailure(error,'auth');
});

function clearPrivateState(){
  stopApprovalListener?.(); stopApprovalListener=null;
  tripLoadRunId++;tripLoadPromise=null;tripLoading=false;tripLoadStartedAt=0;
  state.trip=null;
  state.days=[];
  state.bookings=[];
  state.isAdmin=false;
  state.page='today';
  content.replaceChildren();
  $('#detailMap').removeAttribute('src'); $('#detailIntro').replaceChildren();
  closeDetail();
}

function showAccessState(status){
  const states={
    checking:['⏳','正在檢查權限','請稍候…',false],
    pending:['🕐','等候管理員批准','你的加入申請已送出。批准後，這個畫面會自動更新。',true],
    rejected:['🔒','申請未獲批准','請聯絡旅程管理員了解詳情。',true],
    permission:['🔒','沒有存取權限','Firebase 權限設定拒絕了這次請求，請聯絡管理員。',true],
    temporary:['⚠️','Firebase 服務暫時無法使用','已自動重試，但服務仍未恢復。請稍後重新檢查。',true],
    network:['📡','網絡連線中斷','請檢查網絡連線後重新檢查。',true],
    authError:['⚠️','登入狀態未能恢復','請重新檢查；如問題持續，請登出後再次登入。',true]
  };
  const [icon,title,message,retry]=states[status]||states.temporary;
  $('#loginView').classList.add('hidden'); $('#mainView').classList.add('hidden'); $('#accessView').classList.remove('hidden');
  $('#accessIcon').textContent=icon; $('#accessTitle').textContent=title; $('#accessMessage').textContent=message;
  $('#retryAccessBtn').classList.toggle('hidden',!retry);
}

function firebaseErrorCode(error){return String(error?.code||'').replace(/^firestore\//,'').replace(/^auth\//,'')}
function isConnectivityError(error){const code=firebaseErrorCode(error);return code==='network-request-failed'||(!navigator.onLine&&['unavailable','deadline-exceeded','unknown'].includes(code))}
function isTransientFirebaseError(error){return ['unavailable','deadline-exceeded','aborted','internal','resource-exhausted','unknown','unauthenticated','network-request-failed'].includes(firebaseErrorCode(error))}
function showAccessFailure(error,stage='permission'){
  const code=firebaseErrorCode(error);
  console.error('[access] final failure',{stage,code,message:error?.message||''});
  if(isConnectivityError(error))showAccessState('network');
  else if(code==='permission-denied')showAccessState('permission');
  else if(stage==='auth')showAccessState('authError');
  else showAccessState('temporary');
}
function wait(ms){return new Promise(resolve=>setTimeout(resolve,ms))}
function promiseWithTimeout(promise,timeoutMs,code,label){
  let timer;const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>{const error=new Error(`${label} timed out`);error.code=code;reject(error)},timeoutMs)});
  return Promise.race([promise,timeout]).finally(()=>clearTimeout(timer));
}
async function withFirebaseRetry(operation,label,user){
  for(let attempt=0;;attempt++){
    const attemptContext={number:attempt+1,active:true};
    try{return await promiseWithTimeout(operation(attemptContext),8000,'deadline-exceeded',label)}
    catch(error){
      attemptContext.active=false;
      const code=firebaseErrorCode(error);
      console.warn('[access] Firebase request failed',{operation:label,code,message:error?.message||'',attempt:attempt+1});
      if(!isTransientFirebaseError(error)||attempt>=ACCESS_RETRY_DELAYS.length)throw error;
      const retryNumber=attempt+1,delay=ACCESS_RETRY_DELAYS[attempt];
      console.info('[access] retry scheduled',{operation:label,retryAttempt:retryNumber,delay});
      if(code==='unauthenticated'&&user&&attempt===0){
        console.info('[access] refreshing Firebase ID token before retry');
        await getIdToken(user,true);
      }
      await wait(delay);
    }
  }
}
async function initializeAccess({source='manual',forceToken=false,restart=false}={}){
  if(accessInitialization&&!restart){console.info('[access] initialization already running',{source});return accessInitialization}
  if(restart&&accessInitialization)console.info('[access] superseding stale initialization',{source});
  const runId=++accessRunId;
  accessInitialization=(async()=>{
    console.info('[access] complete initialization started',{source,runId});
    showAccessState('checking');
    await auth.authStateReady();
    if(runId!==accessRunId)return;
    const user=auth.currentUser;
    console.info('[access] authenticated user resolved',user?{uid:user.uid,email:user.email||''}:{user:null});
    stopAccessListener?.();stopAccessListener=null;
    clearPrivateState();state.user=user;
    $('#loginView').classList.toggle('hidden',!!user);$('#accessView').classList.add('hidden');$('#mainView').classList.add('hidden');
    if(!user){
      $('#profileInfo').textContent='';if($('#profileDialog').open)$('#profileDialog').close();return;
    }
    $('#profileInfo').innerHTML=`<p><strong>${esc(user.displayName||'')}</strong><br><span class="muted">${esc(user.email||'')}</span></p>`;
    showAccessState('checking');
    if(forceToken){console.info('[access] refreshing Firebase ID token for manual retry');await getIdToken(user,true)}
    await resolveAccess(user,runId);
  })().catch(error=>{if(runId===accessRunId)showAccessFailure(error,'auth')}).finally(()=>{if(runId===accessRunId)accessInitialization=null});
  return accessInitialization;
}

async function resolveAccess(user=state.user,runId=accessRunId){
  if(!user||runId!==accessRunId)return;
  stopAccessListener?.(); stopAccessListener=null;
  showAccessState('checking');
  console.info('[access] permission check started',{uid:user.uid});
  try{const outcome=await withFirebaseRetry(async attempt=>{
    console.info('[access] admin document read started',{uid:user.uid});
    const adminSnap=await getDoc(doc(db,'admins',user.uid));
    if(!attempt.active||runId!==accessRunId)return 'stale';
    state.isAdmin=adminSnap.exists();
    console.info('[access] admin result',{isAdmin:state.isAdmin});
    if(!state.isAdmin){
      const requestRef=doc(db,'accessRequests',user.uid);
      console.info('[access] membership document read started',{uid:user.uid});
      let requestSnap=await getDoc(requestRef);
      if(!attempt.active||runId!==accessRunId)return 'stale';
      if(!requestSnap.exists()){
        await setDoc(requestRef,{email:user.email||'',displayName:user.displayName||'',status:'pending',createdAt:serverTimestamp()});
        requestSnap=await getDoc(requestRef);
        if(!attempt.active||runId!==accessRunId)return 'stale';
      }
      const status=requestSnap.data()?.status;
      console.info('[access] membership result',{status:status||'missing'});
      if(status!=='approved'){
        showAccessState(status==='rejected'?'rejected':'pending');
        stopAccessListener=onSnapshot(requestRef,snap=>{
          const nextStatus=snap.data()?.status;
          console.info('[access] membership status changed',{status:nextStatus||'missing'});
          if(nextStatus==='approved') initializeAccess({source:'membership-approved'});
          else showAccessState(nextStatus==='rejected'?'rejected':'pending');
        },error=>{console.warn('[access] membership listener failed',{code:firebaseErrorCode(error),message:error?.message||''});initializeAccess({source:'membership-listener-recovery',forceToken:firebaseErrorCode(error)==='unauthenticated'})});
        return 'waiting';
      }
    }
    return 'approved';
  },'permission-check',user);
    if(outcome!=='approved'||runId!==accessRunId)return;
    console.info('[Permission] completed',{uid:user.uid,isAdmin:state.isAdmin});
    $('#accessView').classList.add('hidden'); $('#mainView').classList.remove('hidden');
    renderLoading();const loaded=await loadTrip({source:'startup'});if(loaded&&runId===accessRunId)render();
  }catch(error){if(runId===accessRunId)showAccessFailure(error)}
}

function renderLoading(){
  $('#pageTitle').textContent='正在載入';
  content.innerHTML='<div class="card loading-state" role="status"><span class="spinner" aria-hidden="true"></span><div><strong>正在載入行程</strong><div class="muted small">請稍候…</div></div></div>';
}

function tripTimeout(promise,label){
  return promiseWithTimeout(promise,TRIP_LOAD_TIMEOUT,'trip-timeout',label);
}
function tripErrorCode(error){return firebaseErrorCode(error)||String(error?.code||'')}
function isRetryableTripError(error){return tripErrorCode(error)==='trip-timeout'||isTransientFirebaseError(error)}
function dayRows(snapshot){return snapshot.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>a.date.localeCompare(b.date))}
function bookingRows(snapshot){return snapshot.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(Number.isFinite(a.order)?a.order:Number.MAX_SAFE_INTEGER)-(Number.isFinite(b.order)?b.order:Number.MAX_SAFE_INTEGER)||a.id.localeCompare(b.id))}
async function readCriticalTrip(useCache=false){
  console.info('[TripLoad] Firestore request start',{source:useCache?'cache':'default'});
  const tripRef=doc(db,'trips',TRIP_ID),daysRef=collection(db,'trips',TRIP_ID,'days');
  const reads=useCache?Promise.all([getDocFromCache(tripRef),getDocsFromCache(daysRef)]):Promise.all([getDoc(tripRef),getDocs(daysRef)]);
  const [tripSnap,daySnap]=await tripTimeout(reads,useCache?'cached itinerary':'itinerary');
  return {trip:tripSnap.exists()?tripSnap.data():null,days:dayRows(daySnap)};
}
async function loadBookingsOptional(requestId){
  const started=Date.now();
  try{
    const snapshot=await tripTimeout(getDocs(collection(db,'trips',TRIP_ID,'bookings')),'bookings');
    if(requestId!==tripLoadRunId)return;
    state.bookings=bookingRows(snapshot);console.info('[TripLoad] optional bookings success',{requestId,elapsedMs:Date.now()-started});
    if(state.page==='bookings')renderBookings();
  }catch(error){
    if(requestId!==tripLoadRunId)return;
    try{const cached=await getDocsFromCache(collection(db,'trips',TRIP_ID,'bookings'));if(requestId===tripLoadRunId)state.bookings=bookingRows(cached)}catch(cacheError){}
    console.warn('[TripLoad] optional bookings unavailable; itinerary remains usable',{requestId,code:tripErrorCode(error),elapsedMs:Date.now()-started});
  }
}
function renderTripLoadError(error){
  $('#pageTitle').textContent='載入行程';
  content.innerHTML=`<div class="card"><h2>暫時未能載入行程</h2><p class="muted">${isConnectivityError(error)?'網絡連線似乎已中斷，請恢復連線後再試。':'Firebase 暫時未能提供行程資料，請重新載入。'}</p><div class="recovery-actions"><button class="primary-btn" id="retryTripLoad">重新載入</button><button class="secondary-btn" id="returnToday">返回今天</button></div></div>`;
  $('#retryTripLoad').onclick=()=>restartTripLoad('retry-button');
  $('#returnToday').onclick=()=>{state.page='today';render()};
}
async function loadTrip({force=false,source='manual'}={}){
  if(tripLoadPromise&&!force){console.info('[TripLoad] reusing active request',{source,requestId:tripLoadRunId});return tripLoadPromise}
  const requestId=++tripLoadRunId;const started=Date.now();tripLoading=true;tripLoadStartedAt=started;
  console.info('[TripLoad] start',{source,requestId});
  const task=(async()=>{
    let finalError;
    try{
      for(let attempt=0;attempt<=TRIP_RETRY_DELAYS.length;attempt++){
        try{
          const result=await readCriticalTrip(false);
          if(requestId!==tripLoadRunId){console.info('[TripLoad] stale response ignored',{requestId});return false}
          state.trip=result.trip;state.days=result.days;
          console.info('[TripLoad] Firestore request success',{requestId,attempt:attempt+1,elapsedMs:Date.now()-started});
          loadBookingsOptional(requestId);return true;
        }catch(error){
          finalError=error;console.warn(tripErrorCode(error)==='trip-timeout'?'[TripLoad] timeout':'[TripLoad] request failed',{requestId,attempt:attempt+1,code:tripErrorCode(error),elapsedMs:Date.now()-started});
          if(requestId!==tripLoadRunId)return false;
          if(!isRetryableTripError(error)||attempt>=TRIP_RETRY_DELAYS.length)break;
          console.info(`[TripLoad] retry ${attempt+1}`,{requestId,delay:TRIP_RETRY_DELAYS[attempt]});await wait(TRIP_RETRY_DELAYS[attempt]);
        }
      }
      if(finalError&&!isRetryableTripError(finalError)){
        if(requestId===tripLoadRunId){console.error('[TripLoad] failure',{requestId,code:tripErrorCode(finalError),elapsedMs:Date.now()-started});renderTripLoadError(finalError)}
        return false;
      }
      try{
        const cached=await readCriticalTrip(true);
        if(requestId!==tripLoadRunId)return false;
        state.trip=cached.trip;state.days=cached.days;console.info('[TripLoad] cached itinerary used',{requestId,elapsedMs:Date.now()-started});loadBookingsOptional(requestId);return true;
      }catch(cacheError){console.warn('[TripLoad] cache fallback unavailable',{requestId,code:tripErrorCode(cacheError)})}
      if(requestId===tripLoadRunId){console.error('[TripLoad] failure',{requestId,code:tripErrorCode(finalError),elapsedMs:Date.now()-started});renderTripLoadError(finalError)}
      return false;
    }finally{
      if(requestId===tripLoadRunId){tripLoading=false;tripLoadStartedAt=0;tripLoadPromise=null}
      console.info('[TripLoad] finished',{requestId,elapsedMs:Date.now()-started});
    }
  })();
  tripLoadPromise=task;return task;
}
async function restartTripLoad(source='manual'){
  if(!state.user)return initializeAccess({source:`trip-${source}`,restart:true});
  renderLoading();const loaded=await loadTrip({force:true,source});if(loaded)render();
}

function render(){
  if(state.page!=='more'){stopApprovalListener?.();stopApprovalListener=null}
  document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.page===state.page));
  const titles=state.language==='ko'?{today:'오늘',days:'일정',bookings:'예약',money:'환율',more:'더보기'}:{today:'今日',days:'行程',bookings:'預訂',money:'匯率',more:'更多'}; $('#pageTitle').textContent=titles[state.page];
  const nav=state.language==='ko'?['오늘','일정','예약','환율','더보기']:['今日','行程','預訂','匯率','更多'];
  document.querySelectorAll('.nav-item small').forEach((el,i)=>el.textContent=nav[i]);
  $('#languageBtn').textContent=state.language==='ko'?'中文':'한국어';
  if(!state.trip && state.page!=='more') return renderEmpty();
  ({today:renderToday,days:renderDays,bookings:renderBookings,money:renderMoney,more:renderMore}[state.page])();
}

function renderEmpty(){
  content.innerHTML=`<div class="card"><h2>尚未匯入行程</h2><p class="muted">Firebase 已連接，但 Firestore 暫時沒有首爾旅遊資料。</p><button class="primary-btn" id="goImport">前往匯入資料</button></div>`;
  $('#goImport').onclick=()=>{state.page='more';render()};
}

function seoulDateString(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}
function targetDay(){
  if(!state.days.length) return null;
  return state.days.find(d=>d.date===seoulDateString())||null;
}
function localTripDate(value){const [year,month,day]=String(value||'').split('-').map(Number);return new Date(year,month-1,day)}
function tripTodayState(){
  if(!state.days.length)return {phase:'empty'};
  const now=localTripDate(seoulDateString());
  const first=localTripDate(state.days[0].date),last=localTripDate(state.days[state.days.length-1].date);
  if(now<first)return {phase:'before',days:Math.ceil((first-now)/86400000)};
  if(now>last)return {phase:'after'};
  return {phase:'during',day:targetDay()};
}

function eventHtml(e,dayId,index){
  const badges=(e.tags||[]).map(t=>`<span class="badge ${t==='必去'?'must':t==='可略過'?'optional':''}">${esc(t)}</span>`).join('');
  const day=state.days.find(x=>x.id===dayId);
  const eventCount=day?.events?.length||0;
  const adminActions=state.isAdmin?`<div class="admin-item-actions"><div class="admin-order-actions" aria-label="調整行程次序"><button class="admin-text-btn order-btn" data-move-event="${esc(dayId)}" data-event-index="${index}" data-direction="-1" ${index===0?'disabled':''}>↑ 上移</button><button class="admin-text-btn order-btn" data-move-event="${esc(dayId)}" data-event-index="${index}" data-direction="1" ${index===eventCount-1?'disabled':''}>↓ 下移</button></div><div class="admin-edit-actions"><button class="admin-text-btn" data-edit-event="${esc(dayId)}" data-event-index="${index}">編輯</button><button class="admin-text-btn danger-text" data-delete-event="${esc(dayId)}" data-event-index="${index}">刪除</button></div></div>`:'';
  return `<div class="event"><div class="time">${esc(e.time||'')}</div><div><button class="event-title item-link" data-event-day="${esc(dayId)}" data-event-index="${index}">${esc(localized(e,'title')||'')}</button>${e.note?`<div class="event-note">${eventNoteHtml(e,day)}</div>`:''}${subwayRouteHtml(itinerarySubway(dayId,e))}${badges}${externalLinksHtml(e)}${adminActions}</div></div>`;
}

function bindDetailLinks(){
  if(content.dataset.detailLinksBound)return;
  content.dataset.detailLinksBound='true';
  content.addEventListener('click',ev=>{
    const moveEvent=ev.target.closest('[data-move-event]');
    if(moveEvent){moveEventItem(moveEvent.dataset.moveEvent,Number(moveEvent.dataset.eventIndex),Number(moveEvent.dataset.direction),moveEvent);return}
    const moveBooking=ev.target.closest('[data-move-booking]');
    if(moveBooking){moveBookingItem(moveBooking.dataset.moveBooking,Number(moveBooking.dataset.direction),moveBooking);return}
    const editEvent=ev.target.closest('[data-edit-event]');
    if(editEvent){openEventEditor(editEvent.dataset.editEvent,Number(editEvent.dataset.eventIndex));return}
    const deleteEvent=ev.target.closest('[data-delete-event]');
    if(deleteEvent){removeEvent(deleteEvent.dataset.deleteEvent,Number(deleteEvent.dataset.eventIndex));return}
    const addEvent=ev.target.closest('[data-add-event]');
    if(addEvent){openEventEditor(addEvent.dataset.addEvent);return}
    const editBooking=ev.target.closest('[data-edit-booking]');
    if(editBooking){openBookingEditor(editBooking.dataset.editBooking);return}
    const deleteBooking=ev.target.closest('[data-delete-booking]');
    if(deleteBooking){removeBooking(deleteBooking.dataset.deleteBooking);return}
    if(ev.target.closest('#addBooking')){openBookingEditor();return}
    const placeLink=ev.target.closest('[data-place-name]');
    if(placeLink){openDetail({title:placeLink.dataset.placeLabel,mapQuery:`${placeLink.dataset.placeArea} ${placeLink.dataset.placeName}`,note:t('餐廳／地點資料','식당／장소 정보'),mapTarget:placeLink.dataset.placeTarget,website:placeLink.dataset.placeWebsite,popupMode:placeLink.dataset.placePopup});return}
    const eventLink=ev.target.closest('[data-event-day]');
    if(eventLink){const d=state.days.find(x=>x.id===eventLink.dataset.eventDay);const e=d?.events?.[Number(eventLink.dataset.eventIndex)];if(e)openDetail({...e,mapQuery:`${areaContext(d)} ${e.title||''}`});return}
    const bookingSubItem=ev.target.closest('[data-booking-sub-item]');
    if(bookingSubItem){const b=state.bookings.find(x=>x.id===bookingSubItem.dataset.bookingSubItem);const item=b?.items?.[Number(bookingSubItem.dataset.subItemIndex)];if(item)openDetail({title:localized(item,'name')||item.name,note:localized(item,'description')||item.description,mapTarget:item.mapTarget,website:item.website,popupMode:item.popupMode});return}
    const bookingLink=ev.target.closest('[data-booking]');
    if(bookingLink){const b=state.bookings.find(x=>x.id===bookingLink.dataset.booking);if(b)openDetail(b,true)}
  });
}

function openDetail(item,isBooking=false){
  const title=localized(item,'title')||t('地點資料','장소 정보');
  const configuredTarget=item.mapTarget||item.googleMaps||'';
  const query=configuredTarget?mapTargetQuery(configuredTarget,item.mapQuery||title):`${item.mapQuery||title} Seoul`;
  const mapUrl=googleMapOpenUrl(configuredTarget)||`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  const previewUrl=item.popupMode==='website'?externalUrl(item.website):'';
  $('#detailTitle').textContent=title;
  if(isBooking){
    $('#detailIntro').innerHTML=`<div class="detail-kv">${(item.details||[]).map(r=>`<div>${esc(r.label||'')}</div><div class="${r.sensitive?'sensitive':''}">${bookingValueHtml(r)}</div>`).join('')}</div>${(item.details||[]).some(r=>r.sensitive)?`<button class="secondary-btn card-action-btn" id="detailReveal">${t('顯示／隱藏敏感資料','민감한 정보 표시/숨기기')}</button>`:''}`;
    const reveal=$('#detailReveal');if(reveal)reveal.onclick=()=>$('#detailIntro').querySelectorAll('.sensitive').forEach(x=>x.classList.toggle('reveal'));
  }else $('#detailIntro').innerHTML=`${localized(item,'note')?`<p>${phoneHtml(localized(item,'note'))}</p>`:`<p class="muted">${t('按下方按鈕可查看更多資料。','아래 버튼을 눌러 자세한 정보를 확인하세요.')}</p>`}${externalLinksHtml(previewUrl?{...item,website:''}:item)}`;
  $('#detailPreviewNotice').classList.toggle('hidden',!previewUrl);
  $('#detailPreviewNotice').textContent=t('部分網站基於安全設定不允許內嵌預覽。如未能顯示，請按下方按鈕開啟。','일부 웹사이트는 보안 설정으로 미리보기를 허용하지 않습니다. 표시되지 않으면 아래 버튼을 눌러 주세요.');
  $('#detailMap').title=previewUrl?t('網站／預訂預覽','웹사이트／예약 미리보기'):t('Google 地圖','Google 지도');
  $('#detailMap').src=previewUrl||`https://www.google.com/maps?q=${encodeURIComponent(query)}&hl=${state.language==='ko'?'ko':'zh-TW'}&output=embed`;
  $('#openGoogleMaps').href=previewUrl||mapUrl;$('#openGoogleMaps').target=previewUrl?'_blank':'_self'; $('#openGoogleMaps').textContent=previewUrl?t('開啟網站／預訂','웹사이트／예약 열기'):t('在 Google 地圖開啟','Google 지도에서 열기'); $('#closeDetailBottom').textContent=t('關閉','닫기');
  $('#koreanHelper').classList.toggle('hidden',state.language!=='ko');
  $('#detailDialog').classList.remove('hidden'); $('#detailDialog').setAttribute('aria-hidden','false');
  document.body.classList.add('modal-open'); $('#closeDetail').focus();
}

function closeDetail(){
  $('#detailMap').removeAttribute('src'); $('#detailDialog').classList.add('hidden');
  $('#detailPreviewNotice').classList.add('hidden');
  $('#detailDialog').setAttribute('aria-hidden','true'); document.body.classList.remove('modal-open');
}

function renderToday(){
  const today=tripTodayState();
  if(today.phase==='empty')return renderEmpty();
  let main='';
  if(today.phase==='before'){
    main=`<section class="countdown-hero"><div class="countdown-kicker">旅程即將開始</div><div class="countdown-number">${today.days}</div><div class="countdown-unit">日後出發首爾</div><div class="countdown-message">${esc(countdownMessage[0])}<br>${esc(countdownMessage[1])}</div></section>`;
  }else if(today.phase==='after'){
    main='<section class="countdown-hero trip-complete"><div class="countdown-kicker">旅程已完成</div><div class="countdown-number">서울</div><div class="countdown-unit">回憶已收藏</div><div class="countdown-message">謝謝這趟旅程帶來的美食、笑聲與故事。<br>隨時打開行程頁，再次回味首爾時光。</div></section>';
  }else{
    const d=today.day;if(!d)return renderEmpty();
    main=`<section class="hero"><div class="sub">${esc(d.dateLabel||d.date)}</div><div class="big">${esc(localized(d,'area')||'首爾')}</div><div class="meta">${esc(localized(d,'summary')||'')}</div></section><div class="section-title section-title-row"><span>${t('今日行程','오늘 일정')}</span>${state.isAdmin?`<button class="secondary-btn admin-add-btn" data-add-event="${esc(d.id)}">＋ 新增行程</button>`:''}</div><div class="card timeline">${(d.events||[]).map((e,i)=>eventHtml(e,d.id,i)).join('')||'<div class="muted small">尚未加入行程。</div>'}</div>`;
  }
  content.innerHTML=`${weatherSectionHtml()}${main}${factSectionHtml()}`;
  bindDetailLinks();bindTodayExtras();loadWeather();
}

function factSectionHtml(){return `<section class="card fact-card"><div class="fact-label">🇰🇷 ${t('今日首爾趣聞','오늘의 서울 이야기')}</div><p id="seoulFact">${esc(SEOUL_FACTS[seoulFactIndex])}</p><button class="secondary-btn fact-next" id="newFact">${t('換一則趣聞','다른 이야기 보기')}</button></section>`}
function bindTodayExtras(){const button=$('#newFact');if(button)button.onclick=()=>{let next=seoulFactIndex;while(next===seoulFactIndex)next=Math.floor(Math.random()*SEOUL_FACTS.length);seoulFactIndex=next;$('#seoulFact').textContent=SEOUL_FACTS[next]}}
function weatherSectionHtml(){return `<section class="weather-card" aria-labelledby="weatherTitle"><div class="weather-head"><h2 id="weatherTitle">🌤️ ${t('首爾天氣','서울 날씨')}</h2><span>Seoul</span></div><div id="weatherDays" class="weather-days"><div class="weather-loading">${t('正在更新天氣…','날씨 업데이트 중…')}</div></div><div class="weather-source">Open-Meteo</div></section>`}
function weatherInfo(code){if(code===0)return ['☀️',t('晴朗','맑음')];if(code<=2)return ['🌤️',t('間中有雲','구름 조금')];if(code===3)return ['☁️',t('多雲','흐림')];if(code<=48)return ['🌫️',t('有霧','안개')];if(code<=57)return ['🌦️',t('毛毛雨','이슬비')];if(code<=67)return ['🌧️',t('下雨','비')];if(code<=77)return ['🌨️',t('下雪','눈')];if(code<=82)return ['🌦️',t('驟雨','소나기')];if(code<=86)return ['🌨️',t('驟雪','눈 소나기')];return ['⛈️',t('雷雨','뇌우')]}
function weatherDayLabel(date,index){if(index===0)return t('昨日','어제');if(index===1)return t('今日','오늘');return new Intl.DateTimeFormat(state.language==='ko'?'ko-KR':'zh-HK',{weekday:'short',timeZone:'Asia/Seoul'}).format(new Date(`${date}T12:00:00+09:00`))}
function weatherDateLabel(date){const [,month,day]=String(date).split('-');return `${Number(day)}/${Number(month)}`}
function renderWeather(data){const target=$('#weatherDays');if(!target)return;const daily=data?.daily;if(!daily?.time?.length)throw new Error('missing weather');target.innerHTML=daily.time.slice(0,6).map((date,index)=>{const [icon,label]=weatherInfo(daily.weather_code[index]);return `<article class="weather-day ${index===1?'today':''}"><div class="weather-day-name">${esc(weatherDayLabel(date,index))}</div><div class="weather-date">${esc(weatherDateLabel(date))}</div><div class="weather-icon" aria-label="${esc(label)}">${icon}</div><div class="weather-condition">${esc(label)}</div><div class="weather-temp"><strong>${Math.round(daily.temperature_2m_max[index])}°</strong><span>${Math.round(daily.temperature_2m_min[index])}°</span></div><div class="weather-rain">${index>0?`💧 ${Math.round(daily.precipitation_probability_max[index]||0)}%`:t('實況','관측')}</div></article>`}).join('')}
async function loadWeather(){if(weatherCache){renderWeather(weatherCache);return}try{const response=await promiseWithTimeout(fetch('https://api.open-meteo.com/v1/forecast?latitude=37.5665&longitude=126.9780&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FSeoul&past_days=1&forecast_days=5'),8000,'weather-timeout','weather');if(!response.ok)throw new Error();weatherCache=await response.json();renderWeather(weatherCache)}catch(e){const target=$('#weatherDays');if(target)target.innerHTML=`<div class="weather-loading">${t('暫時無法取得天氣，請稍後再試。','날씨를 불러올 수 없습니다. 잠시 후 다시 시도하세요.')}</div>`}}

function renderDays(){
  content.innerHTML=state.days.map(d=>`<div class="card day-card" data-day="${esc(d.id)}"><div class="day-row"><div><div class="day-date">${esc(d.dateLabel||d.date)}</div><div class="day-area">${esc(localized(d,'area')||'')}</div></div><div class="chev">›</div></div></div>`).join('');
  document.querySelectorAll('[data-day]').forEach(el=>el.onclick=()=>renderDayDetail(el.dataset.day));
}
function renderDayDetail(id){
  const d=state.days.find(x=>x.id===id); if(!d)return;
  $('#pageTitle').textContent=d.dateLabel||d.date;
  content.innerHTML=`<button class="secondary-btn" id="backDays">← ${t('返回全部行程','전체 일정으로')}</button><section class="hero" style="margin-top:12px"><div class="sub">${esc(d.dateLabel||'')}</div><div class="big">${esc(localized(d,'area')||'')}</div><div class="meta">${esc(localized(d,'summary')||'')}</div></section>${state.isAdmin?`<div class="admin-toolbar"><button class="primary-btn" data-add-event="${esc(d.id)}">＋ 新增行程</button></div>`:''}<div class="card timeline">${(d.events||[]).map((e,i)=>eventHtml(e,d.id,i)).join('')||'<div class="muted small">尚未加入行程。</div>'}</div>`;
  $('#backDays').onclick=()=>{state.page='days';render()};
  bindDetailLinks();
}

function revealBlock(value){return `<span class="sensitive">${esc(value||'—')}</span>`}
function bookingCard(b,index){
  const rows=(b.details||[]).map(r=>`<div>${esc(r.label)}</div><div class="${r.sensitive?'sensitive':''}">${bookingValueHtml(r)}</div>`).join('');
  const subItems=(b.items||[]).length?`<div class="booking-sub-items">${b.items.map((item,itemIndex)=>`<button class="mini-place-link" data-booking-sub-item="${esc(b.id)}" data-sub-item-index="${itemIndex}">${esc(localized(item,'name')||item.name||'')}</button>`).join('')}</div>`:'';
  const adminActions=state.isAdmin?`<div class="admin-item-actions"><div class="admin-order-actions" aria-label="調整預訂次序"><button class="admin-text-btn order-btn" data-move-booking="${esc(b.id)}" data-direction="-1" ${index===0?'disabled':''}>↑ 上移</button><button class="admin-text-btn order-btn" data-move-booking="${esc(b.id)}" data-direction="1" ${index===state.bookings.length-1?'disabled':''}>↓ 下移</button></div><div class="admin-edit-actions"><button class="admin-text-btn" data-edit-booking="${esc(b.id)}">編輯</button><button class="admin-text-btn danger-text" data-delete-booking="${esc(b.id)}">刪除</button></div></div>`:'';
  return `<article class="booking-card"><div class="booking-label">${esc(b.type||t('預訂','예약'))}</div><button class="booking-value item-link" data-booking="${esc(b.id)}">${esc(localized(b,'title')||'')}</button><div class="kv">${rows}</div>${subItems}${(b.details||[]).some(r=>r.sensitive)?`<button class="secondary-btn card-action-btn reveal-btn">${t('顯示／隱藏敏感資料','민감한 정보 표시/숨기기')}</button>`:''}${adminActions}</article>`;
}
function renderBookings(){
  content.innerHTML=`<div class="notice danger">此頁包含私人預訂資料。請勿在公共裝置上長時間顯示。</div><div class="section-title section-title-row"><span>旅程預訂</span>${state.isAdmin?'<button class="secondary-btn admin-add-btn" id="addBooking">＋ 新增預訂</button>':''}</div><div class="booking-grid">${state.bookings.map(bookingCard).join('')||'<div class="card muted small">尚未加入預訂。</div>'}</div>`;
  document.querySelectorAll('.reveal-btn').forEach(btn=>btn.onclick=()=>btn.closest('.booking-card').querySelectorAll('.sensitive').forEach(x=>x.classList.toggle('reveal')));
  bindDetailLinks();
}

function showEditorError(message=''){$('#editorStatus').textContent=message}
function editorUrlValue(value,label){value=String(value||'').trim();if(value&&!externalUrl(value))throw new Error(`${label}必須以 http:// 或 https:// 開始。`);return value}
function eventPlaceRow(place={}){
  return `<div class="event-place-row"><div class="event-place-names"><label>顯示名稱<input class="form-input place-name" placeholder="例如：Dookupsam（熟成豬）" value="${esc(place.name||'')}"></label><label>韓文名稱<input class="form-input place-name-ko" placeholder="例如：두껍삼" value="${esc(place.nameKo||'')}"></label></div><label>彈出視窗內容<select class="form-input place-popup"><option value="map" ${place.popupMode!=='website'?'selected':''}>Google 地圖</option><option value="website" ${place.popupMode==='website'?'selected':''}>網站／預訂連結預覽</option></select></label><div class="event-place-links"><label>Google 地圖地點或連結<input class="form-input place-map-target" autocapitalize="off" placeholder="輸入地點，或貼上 Google 地圖連結" value="${esc(place.mapTarget||place.googleMaps||'')}"></label><label>網站／預訂連結<input class="form-input place-website" type="url" inputmode="url" autocapitalize="off" placeholder="https://..." value="${esc(place.website||'')}"></label></div><div class="event-place-actions"><div class="event-place-order"><button type="button" class="admin-text-btn move-place-up">↑ 上移</button><button type="button" class="admin-text-btn move-place-down">↓ 下移</button></div><button type="button" class="admin-text-btn danger-text remove-place">移除</button></div></div>`;
}
function addEventPlace(place={}){$('#eventPlaces').insertAdjacentHTML('beforeend',eventPlaceRow(place));updateEventPlaceButtons()}
function updateEventPlaceButtons(){const rows=[...document.querySelectorAll('.event-place-row')];rows.forEach((row,index)=>{row.querySelector('.move-place-up').disabled=index===0;row.querySelector('.move-place-down').disabled=index===rows.length-1})}
function openEventEditor(dayId,index=null){
  if(!state.isAdmin)return;
  const day=state.days.find(d=>d.id===dayId);if(!day)return;
  const event=Number.isInteger(index)?day.events?.[index]:null;
  editorContext={kind:'event',dayId,index:event?index:null,original:event||null};
  $('#editorTitle').textContent=event?'編輯行程':'新增行程';
  $('#eventEditorFields').classList.remove('hidden');$('#bookingEditorFields').classList.add('hidden');
  $('#eventTime').value=event?.time||'';$('#eventTitle').value=event?.title||'';$('#eventNote').value=event?.note||'';
  $('#eventTags').value=(event?.tags||[]).join('、');showEditorError();$('#itemEditorDialog').showModal();
  $('#eventPopupMode').value=event?.popupMode==='website'?'website':'map';
  $('#eventMapTarget').value=event?.mapTarget||event?.googleMaps||'';$('#eventWebsite').value=event?.website||'';
  $('#eventPlaces').innerHTML='';eventPlaceItems(event||{}).forEach(addEventPlace);updateEventPlaceButtons();
}
function bookingDetailRow(row={},index=-1){
  return `<div class="booking-detail-row" data-original-detail="${index}"><input class="form-input detail-label" aria-label="資料名稱" placeholder="名稱，例如：日期" value="${esc(row.label||'')}"><input class="form-input detail-value" aria-label="資料內容" placeholder="內容" value="${esc(row.value||'')}"><label class="sensitive-check"><input class="detail-sensitive" type="checkbox" ${row.sensitive?'checked':''}> 私密</label><button type="button" class="admin-text-btn danger-text remove-detail">移除</button></div>`;
}
function addBookingDetail(row={},index=-1){
  $('#bookingDetails').insertAdjacentHTML('beforeend',bookingDetailRow(row,index));
}
function bookingSubItemRow(item={}){
  return `<div class="event-place-row booking-sub-item-row"><div class="event-place-names"><label>顯示名稱<input class="form-input booking-item-name" placeholder="例如：接送集合地點" value="${esc(item.name||'')}"></label><label>韓文名稱<input class="form-input booking-item-name-ko" placeholder="選填" value="${esc(item.nameKo||'')}"></label></div><label>補充說明<textarea class="form-input booking-item-description" rows="2" placeholder="輸入說明、地址或注意事項">${esc(item.description||'')}</textarea></label><label>彈出視窗內容<select class="form-input booking-item-popup"><option value="map" ${item.popupMode!=='website'?'selected':''}>Google 地圖</option><option value="website" ${item.popupMode==='website'?'selected':''}>網站／預訂連結預覽</option></select></label><label>Google 地圖地點或連結<input class="form-input booking-item-map-target" autocapitalize="off" placeholder="輸入地點，或貼上 Google 地圖連結" value="${esc(item.mapTarget||item.googleMaps||'')}"></label><label>網站／預訂連結<input class="form-input booking-item-website" type="url" inputmode="url" autocapitalize="off" placeholder="https://..." value="${esc(item.website||'')}"></label><div class="event-place-actions"><div class="event-place-order"><button type="button" class="admin-text-btn move-booking-item-up">↑ 上移</button><button type="button" class="admin-text-btn move-booking-item-down">↓ 下移</button></div><button type="button" class="admin-text-btn danger-text remove-booking-item">移除</button></div></div>`;
}
function addBookingSubItem(item={}){$('#bookingSubItems').insertAdjacentHTML('beforeend',bookingSubItemRow(item));updateBookingSubItemButtons()}
function updateBookingSubItemButtons(){const rows=[...document.querySelectorAll('.booking-sub-item-row')];rows.forEach((row,index)=>{row.querySelector('.move-booking-item-up').disabled=index===0;row.querySelector('.move-booking-item-down').disabled=index===rows.length-1})}
function openBookingEditor(id=null){
  if(!state.isAdmin)return;
  const booking=id?state.bookings.find(b=>b.id===id):null;
  editorContext={kind:'booking',id:booking?.id||null,original:booking||null};
  $('#editorTitle').textContent=booking?'編輯預訂':'新增預訂';
  $('#eventEditorFields').classList.add('hidden');$('#bookingEditorFields').classList.remove('hidden');
  $('#bookingType').value=booking?.type||'';$('#bookingTitle').value=booking?.title||'';
  $('#bookingPopupMode').value=booking?.popupMode==='website'?'website':'map';
  $('#bookingMapTarget').value=booking?.mapTarget||booking?.googleMaps||'';$('#bookingWebsite').value=booking?.website||'';
  $('#bookingDetails').innerHTML='';(booking?.details||[{}]).forEach((row,index)=>addBookingDetail(row,booking?index:-1));
  $('#bookingSubItems').innerHTML='';(booking?.items||[]).forEach(addBookingSubItem);updateBookingSubItemButtons();
  showEditorError();$('#itemEditorDialog').showModal();
}
async function saveEditor(ev){
  ev.preventDefault();if(!state.isAdmin||!state.user||!editorContext)return;
  const save=$('#saveEditor');save.disabled=true;save.textContent='正在儲存…';showEditorError();
  try{
    if(editorContext.kind==='event'){
      const day=state.days.find(d=>d.id===editorContext.dayId);if(!day)throw new Error();
      const places=[...document.querySelectorAll('.event-place-row')].map((row,index)=>{const place={name:row.querySelector('.place-name').value.trim(),nameKo:row.querySelector('.place-name-ko').value.trim(),popupMode:row.querySelector('.place-popup').value,mapTarget:editorMapTargetElement(row.querySelector('.place-map-target'),`第 ${index+1} 個小項目的 Google 地圖地點或連結`),website:editorUrlValue(row.querySelector('.place-website').value,`第 ${index+1} 個小項目的網站／預訂連結`)};if(place.name&&place.popupMode==='website'&&!place.website)throw new Error(`第 ${index+1} 個小項目選擇了連結預覽，請輸入網站／預訂連結。`);return place}).filter(place=>place.name);
      const item={...(editorContext.original||{}),time:$('#eventTime').value.trim(),title:$('#eventTitle').value.trim(),note:$('#eventNote').value.trim(),tags:$('#eventTags').value.split(/[、,]/).map(x=>x.trim()).filter(Boolean),places,placeNamesKo:places.map(place=>place.nameKo),popupMode:$('#eventPopupMode').value,mapTarget:editorMapTarget('#eventMapTarget','Google 地圖地點或連結'),website:editorUrl('#eventWebsite','網站／預訂連結')};
      if(!item.title)throw new Error('請輸入行程名稱。');
      if(item.popupMode==='website'&&!item.website)throw new Error('已選擇連結預覽，請輸入行程的網站／預訂連結。');
      const events=[...(day.events||[])];
      if(editorContext.index===null)events.push(item);else events[editorContext.index]=item;
      await setDoc(doc(db,'trips',TRIP_ID,'days',day.id),{events,updatedAt:serverTimestamp(),updatedBy:state.user.uid},{merge:true});
      day.events=events;
    }else{
      const originalDetails=editorContext.original?.details||[];
      const details=[...document.querySelectorAll('.booking-detail-row')].map(row=>{const index=Number(row.dataset.originalDetail);return {...(index>=0?originalDetails[index]:{}),label:row.querySelector('.detail-label').value.trim(),value:row.querySelector('.detail-value').value.trim(),sensitive:row.querySelector('.detail-sensitive').checked}}).filter(r=>r.label||r.value);
      const items=[...document.querySelectorAll('.booking-sub-item-row')].map((row,index)=>{const item={name:row.querySelector('.booking-item-name').value.trim(),nameKo:row.querySelector('.booking-item-name-ko').value.trim(),description:row.querySelector('.booking-item-description').value.trim(),popupMode:row.querySelector('.booking-item-popup').value,mapTarget:editorMapTargetElement(row.querySelector('.booking-item-map-target'),`第 ${index+1} 個預訂小項目的 Google 地圖地點或連結`),website:editorUrlValue(row.querySelector('.booking-item-website').value,`第 ${index+1} 個預訂小項目的網站／預訂連結`)};if(item.name&&item.popupMode==='website'&&!item.website)throw new Error(`第 ${index+1} 個預訂小項目選擇了連結預覽，請輸入網站／預訂連結。`);return item}).filter(item=>item.name);
      const original={...(editorContext.original||{})};delete original.id;
      const item={...original,type:$('#bookingType').value.trim(),title:$('#bookingTitle').value.trim(),details,items,popupMode:$('#bookingPopupMode').value,mapTarget:editorMapTarget('#bookingMapTarget','Google 地圖地點或連結'),website:editorUrl('#bookingWebsite','網站／預訂連結')};
      if(!item.title)throw new Error('請輸入預訂名稱。');
      if(item.popupMode==='website'&&!item.website)throw new Error('已選擇連結預覽，請輸入預訂的網站／預訂連結。');
      const id=editorContext.id||`booking-${crypto.randomUUID()}`;
      if(!editorContext.id)item.order=Math.max(-1,...state.bookings.map(booking=>Number.isFinite(booking.order)?booking.order:-1))+1;
      await setDoc(doc(db,'trips',TRIP_ID,'bookings',id),{...item,updatedAt:serverTimestamp(),updatedBy:state.user.uid},{merge:true});
      const local={id,...item};const at=state.bookings.findIndex(b=>b.id===id);if(at>=0)state.bookings[at]=local;else state.bookings.push(local);
    }
    const completed={...editorContext};$('#itemEditorDialog').close();
    if(completed.kind==='event'&&state.page==='days')renderDayDetail(completed.dayId);else render();
  }catch(error){showEditorError(error.message||'儲存失敗，請稍後再試。')}
  finally{save.disabled=false;save.textContent='儲存'}
}
async function removeEvent(dayId,index){
  if(!state.isAdmin||!confirm('確定刪除這個行程項目？'))return;
  const day=state.days.find(d=>d.id===dayId);if(!day)return;
  try{const events=(day.events||[]).filter((_,i)=>i!==index);await setDoc(doc(db,'trips',TRIP_ID,'days',day.id),{events,updatedAt:serverTimestamp(),updatedBy:state.user.uid},{merge:true});day.events=events;state.page==='today'?render():renderDayDetail(day.id)}catch(e){alert('刪除失敗，請稍後再試。')}
}
async function moveEventItem(dayId,index,direction,button){
  if(!state.isAdmin||!state.user)return;
  const day=state.days.find(d=>d.id===dayId),target=index+direction;
  if(!day||target<0||target>=(day.events||[]).length)return;
  button.disabled=true;
  try{
    const events=[...(day.events||[])];[events[index],events[target]]=[events[target],events[index]];
    await setDoc(doc(db,'trips',TRIP_ID,'days',day.id),{events,updatedAt:serverTimestamp(),updatedBy:state.user.uid},{merge:true});
    day.events=events;state.page==='today'?render():renderDayDetail(day.id);
  }catch(e){button.disabled=false;alert('調整次序失敗，請稍後再試。')}
}
async function moveBookingItem(id,direction,button){
  if(!state.isAdmin||!state.user)return;
  const index=state.bookings.findIndex(b=>b.id===id),target=index+direction;
  if(index<0||target<0||target>=state.bookings.length)return;
  button.disabled=true;
  try{
    const bookings=[...state.bookings];[bookings[index],bookings[target]]=[bookings[target],bookings[index]];
    const batch=writeBatch(db);
    bookings.forEach((booking,order)=>batch.set(doc(db,'trips',TRIP_ID,'bookings',booking.id),{order,updatedAt:serverTimestamp(),updatedBy:state.user.uid},{merge:true}));
    await batch.commit();state.bookings=bookings.map((booking,order)=>({...booking,order}));renderBookings();
  }catch(e){button.disabled=false;alert('調整次序失敗，請稍後再試。')}
}
async function removeBooking(id){
  if(!state.isAdmin||!confirm('確定刪除這個預訂？此操作不能復原。'))return;
  try{await deleteDoc(doc(db,'trips',TRIP_ID,'bookings',id));state.bookings=state.bookings.filter(b=>b.id!==id);renderBookings()}catch(e){alert('刪除失敗，請稍後再試。')}
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
    status.textContent='✅ 匯入完成。';const loaded=await loadTrip({force:true,source:'import'});if(loaded){state.page='today';render()}
  }catch(e){status.textContent='❌ 匯入失敗：'+e.message}
}

document.querySelectorAll('.nav-item').forEach(btn=>{btn.onclick=()=>{state.page=btn.dataset.page;render()};btn.ondblclick=event=>event.preventDefault()});
$('#profileBtn').onclick=()=>$('#profileDialog').showModal(); $('#closeProfile').onclick=()=>$('#profileDialog').close();
$('#logoutBtn').onclick=()=>signOut(auth).then(()=>$('#profileDialog').close());
$('#accessLogoutBtn').onclick=()=>signOut(auth);
$('#retryAccessBtn').onclick=()=>initializeAccess({source:'retry-button',forceToken:true});
$('#languageBtn').onclick=()=>{state.language=state.language==='ko'?'zh':'ko';localStorage.setItem('displayLanguage',state.language);render();if(state.language==='ko'){const d=targetDay();const e=d?.events?.[0];if(e)openDetail(e)}};
$('#closeDetail').onclick=closeDetail;
$('#closeDetailBottom').onclick=closeDetail;
$('#detailDialog').onclick=e=>{if(e.target===$('#detailDialog'))closeDetail()};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#detailDialog').classList.contains('hidden'))closeDetail()});
$('#closeInstall').onclick=()=>$('#installDialog').close();
$('#confirmInstallHelp').onclick=()=>$('#installDialog').close();
$('#editorForm').onsubmit=saveEditor;
$('#closeEditor').onclick=()=>$('#itemEditorDialog').close();
$('#cancelEditor').onclick=()=>$('#itemEditorDialog').close();
$('#addEventPlace').onclick=()=>addEventPlace();
$('#eventPlaces').onclick=event=>{
  const row=event.target.closest('.event-place-row');if(!row)return;
  if(event.target.closest('.remove-place'))row.remove();
  else if(event.target.closest('.move-place-up'))row.previousElementSibling?.before(row);
  else if(event.target.closest('.move-place-down'))row.nextElementSibling?.after(row);
  updateEventPlaceButtons();
};
$('#addBookingDetail').onclick=()=>addBookingDetail();
$('#bookingDetails').onclick=event=>{const remove=event.target.closest('.remove-detail');if(remove)remove.closest('.booking-detail-row').remove()};
$('#addBookingSubItem').onclick=()=>addBookingSubItem();
$('#bookingSubItems').onclick=event=>{
  const row=event.target.closest('.booking-sub-item-row');if(!row)return;
  if(event.target.closest('.remove-booking-item'))row.remove();
  else if(event.target.closest('.move-booking-item-up'))row.previousElementSibling?.before(row);
  else if(event.target.closest('.move-booking-item-down'))row.nextElementSibling?.after(row);
  updateBookingSubItemButtons();
};

function resumeAppIfNeeded(source){
  const now=Date.now(),inactiveMs=appHiddenAt?now-appHiddenAt:0,staleLoad=tripLoading&&(now-tripLoadStartedAt>=TRIP_LOAD_TIMEOUT||appHiddenAt>0);
  console.info('[Visibility] app resumed',{source,inactiveMs,tripLoading,staleLoad});
  appHiddenAt=0;
  if((inactiveMs>=60000||staleLoad)&&now-lastResumeRestartAt>1500){
    lastResumeRestartAt=now;console.info('[Visibility] restarting stale load',{source,inactiveMs});initializeAccess({source:`${source}-resume`,restart:true});
  }
}
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='hidden'){appHiddenAt=Date.now();console.info('[Visibility] app background')}
  else resumeAppIfNeeded('visibility');
});
window.addEventListener('pageshow',event=>{if(event.persisted||tripLoading)resumeAppIfNeeded('pageshow')});

window.addEventListener('beforeinstallprompt',e=>{
  e.preventDefault(); installPrompt=e;
  if(state.page==='more'&&!$('#mainView').classList.contains('hidden'))renderMore();
});
window.addEventListener('appinstalled',()=>{
  installPrompt=null;
  if(state.page==='more'&&!$('#mainView').classList.contains('hidden'))renderMore();
});

if('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js',{updateViaCache:'none'}).catch(()=>{});
