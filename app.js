/* ChargeGhar app logic. Plain JavaScript, no build step.
   Sample listings, hosts, reviews and payments are made up for the prototype. */
(function(){
"use strict";
var $=function(s){return document.querySelector(s)};
var esc=function(s){return String(s).replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]})};
var inr=function(n){return '₹'+Math.round(n).toLocaleString('en-IN')};

/* Google Maps key comes from config.js. Without a key the app draws a simple map. */
var KEY=String(window.CHARGEGHAR_KEY||'');if(/^PASTE/.test(KEY))KEY='';

/* Example terms. Rate bands stop price spikes; fees are placeholders to tune. */
var FEE=499, SERVICE=0.08, PRIO_HOST_SHARE=0.8;
var BANDS={ac33:{min:6,max:12,pmin:10,pmax:40},ac74:{min:8,max:16,pmin:10,pmax:60},dc30:{min:16,max:30,pmin:20,pmax:100}};
var TYPES={
  ac33s:{label:'3.3 kW 15A socket (scooters, e-rickshaws)',kw:3.3,conn:'15A socket',veh:['2W','3W'],band:'ac33'},
  ac33t:{label:'3.3 kW Type 2 AC',kw:3.3,conn:'Type 2 AC',veh:['Car'],band:'ac33'},
  ac74:{label:'7.4 kW Type 2 AC',kw:7.4,conn:'Type 2 AC',veh:['Car'],band:'ac74'},
  dc30:{label:'30 kW CCS2 DC fast',kw:30,conn:'CCS2 DC',veh:['Car'],band:'dc30'}
};
var CITIES=[
 {id:'del',name:'Delhi NCR',lat:28.6270,lng:77.2950,loc:['Patparganj','IP Extension','Industrial Area, Patparganj','Mayur Vihar','Mayur Vihar Ph-1','Kondli'],hosts:['Rohit S.','Neha K.','Imran S.','Meera D.','Vikas T.','Sunita R.']},
 {id:'mum',name:'Mumbai',lat:19.1136,lng:72.8697,loc:['Andheri East','Powai','Goregaon','Malad','Vile Parle','Chakala'],hosts:['Rahul M.','Pooja S.','Imran K.','Sneha P.','Vikram J.','Anita D.']},
 {id:'blr',name:'Bengaluru',lat:12.9784,lng:77.6408,loc:['Indiranagar','Koramangala','HSR Layout','Whitefield','Jayanagar','Marathahalli'],hosts:['Karthik R.','Divya N.','Suresh G.','Lakshmi V.','Arjun B.','Meena S.']},
 {id:'hyd',name:'Hyderabad',lat:17.4401,lng:78.3489,loc:['Gachibowli','Madhapur','Kondapur','Banjara Hills','Kukatpally','Miyapur'],hosts:['Srinivas R.','Anusha K.','Faisal A.','Harika M.','Ravi T.','Padma L.']},
 {id:'maa',name:'Chennai',lat:13.0012,lng:80.2565,loc:['Adyar','Velachery','T. Nagar','Anna Nagar','Thoraipakkam','Besant Nagar'],hosts:['Murugan S.','Kavya R.','Ibrahim H.','Deepa N.','Senthil K.','Revathi P.']},
 {id:'pnq',name:'Pune',lat:18.5074,lng:73.8077,loc:['Kothrud','Baner','Hinjewadi','Viman Nagar','Wakad','Aundh'],hosts:['Amit K.','Priya D.','Sameer S.','Neha J.','Omkar P.','Shweta B.']},
 {id:'ccu',name:'Kolkata',lat:22.5800,lng:88.4170,loc:['Salt Lake','New Town','Ballygunge','Behala','Dum Dum','Garia'],hosts:['Soumya D.','Riya B.','Arif H.','Mitali S.','Subhajit G.','Tanushree R.']},
 {id:'amd',name:'Ahmedabad',lat:23.0300,lng:72.5170,loc:['Satellite','Prahlad Nagar','Bopal','Navrangpura','Chandkheda','Maninagar'],hosts:['Hardik P.','Jigna S.','Zubair M.','Krina D.','Nirav T.','Bhavna K.']},
 {id:'jai',name:'Jaipur',lat:26.9124,lng:75.7430,loc:['Vaishali Nagar','Malviya Nagar','Mansarovar','C-Scheme','Jagatpura','Tonk Road'],hosts:['Manish S.','Kavita R.','Salim K.','Poonam J.','Devendra C.','Rekha M.']},
 {id:'lko',name:'Lucknow',lat:26.8500,lng:81.0000,loc:['Gomti Nagar','Hazratganj','Indira Nagar','Aliganj','Alambagh','Jankipuram'],hosts:['Ashish T.','Shalini M.','Rizwan A.','Nidhi S.','Pankaj V.','Rashmi Y.']},
 {id:'chd',name:'Chandigarh',lat:30.7333,lng:76.7794,loc:['Sector 22','Sector 35','Mohali Phase 7','Panchkula Sec 5','Zirakpur','Sector 17'],hosts:['Gurpreet S.','Simran K.','Harjot B.','Manpreet D.','Rajiv A.','Jasleen G.']},
 {id:'cok',name:'Kochi',lat:10.0261,lng:76.3085,loc:['Edappally','Kakkanad','Panampilly Nagar','Fort Kochi','Aluva','Vyttila'],hosts:['Anoop N.','Sreeja M.','Thomas K.','Fathima R.','Vishnu P.','Lekha S.']}
];
/* Six listing patterns reused in every city. dx/dy are km east/north of the city centre. rd = how many 1 to 5 star ratings. */
var ARCH=[
 {kind:'Home',type:'ac74',price:11,prio:30,status:'free',queue:0,dx:.58,dy:.53,verified:true,hours:'6:00 am – 10:00 pm',note:'Covered ground-floor slot. Bring your own Type 2 cable.',rd:[0,0,1,3,19],
  rev:[{n:'Aman',s:5,t:'Easy to find and the host was waiting at the gate. Charged at full speed.',d:'2 weeks ago',tags:['Easy to find','Host was helpful']},{n:'Sana',s:4,t:'Fair price. Parking was tight but fine.',d:'1 month ago',tags:['Fair price'],reply:'Thanks Sana. I have marked the slot so it is easier next time.'}]},
 {kind:'Home',type:'ac33s',price:7,prio:15,status:'busy',queue:1,eta:25,dx:-.67,dy:-.67,verified:true,hours:'7:00 am – 9:00 pm',note:'Standard 15A wall socket. Works for scooters and e-rickshaws.',rd:[0,0,1,2,8],
  rev:[{n:'Vijay',s:5,t:'Charged my scooter overnight with no problem.',d:'3 weeks ago',tags:['Fair price']},{n:'Ritu',s:4,t:'Slow but steady. The host replied quickly.',d:'2 months ago',tags:['Host was helpful']}]},
 {kind:'Shop',type:'dc30',price:22,prio:50,status:'free',queue:0,dx:1.42,dy:-.77,verified:true,hours:'8:00 am – 11:00 pm',note:'DC fast charger at the workshop. Tea is free while you wait.',rd:[1,1,3,12,41],
  rev:[{n:'Karan',s:5,t:'Fast charger, no waiting, clean workshop.',d:'5 days ago',tags:['Charged at promised speed']},{n:'Joel',s:3,t:'Good charger but the queue was long on Saturday. The priority slot helped.',d:'1 month ago',tags:['Slow to start'],reply:'Saturdays are busy. Please book a priority slot ahead.'}]},
 {kind:'Home',type:'ac33t',price:9,prio:20,status:'free',queue:0,dx:-.87,dy:.83,verified:false,hours:'9:00 am – 8:00 pm',note:'Rooftop solar runs from 11 am to 3 pm, so charging is cheapest then.',rd:[0,0,1,2,4],
  rev:[{n:'Nisha',s:5,t:'Cheap in the afternoon with solar. Lovely host.',d:'1 week ago',tags:['Fair price','Host was helpful']},{n:'Dev',s:4,t:'Works well. Bring your own cable.',d:'3 weeks ago',tags:[]}]},
 {kind:'Society',type:'ac74',price:13,prio:40,status:'busy',queue:2,eta:40,dx:2.1,dy:.77,verified:true,hours:'24 hours',note:'Society visitor parking. Show the app at the gate.',rd:[1,2,4,9,15],
  rev:[{n:'Harsh',s:4,t:'Gate staff knew about the app. The slot was ready.',d:'2 weeks ago',tags:['Safe place']},{n:'Mira',s:3,t:'Had to wait 20 minutes past my slot.',d:'1 month ago',tags:['Slow to start']}]},
 {kind:'Home',type:'ac33s',price:6,prio:10,status:'free',queue:0,dx:.27,dy:-1.5,verified:true,hours:'7:00 am – 7:00 pm',note:'E-rickshaw friendly. The gate closes at 7 pm.',rd:[0,0,0,2,14],
  rev:[{n:'Imran',s:5,t:'Perfect for my e-rickshaw. Honest and friendly.',d:'4 days ago',tags:['Fair price','Safe place']},{n:'Geeta',s:5,t:'Charging started quickly and the gate was open.',d:'2 weeks ago',tags:['Easy to find']}]}
];
var NAMEFMT=['Block B, {a}','Near the market, {a}','Auto Care, {a}','Ground floor, {a}','RWA parking, {a}','Lane 3, {a}'];
var REVIEW_TAGS=['Easy to find','Host was helpful','Fair price','Charged at promised speed','Safe place','Slow to start','Hard to find'];
var SLOTS=['As soon as free','In 30 minutes','In 1 hour','In 2 hours'];

var ICON={
  bolt:'<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.2 2 4.5 13.6h6.3L9.9 22l9.6-12.2h-6.4z"/></svg>',
  pen:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21l1.5-5L16.5 4a2.1 2.1 0 0 1 3 3L7.5 19z"/></svg>',
  chat:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1.1-4.6A8 8 0 1 1 21 12z"/></svg>',
  shield:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l7 3v5c0 5-3.2 8.6-7 10-3.8-1.4-7-5-7-10V6z"/></svg>'
};

var state={tab:'find',city:'del',q:'',veh:'All',onlyFree:false,sort:'near',selected:null,sheet:null,book:{slot:0,kwh:15,prio:false},
  bookings:[],chats:{},nextBooking:1,mine:null,cache:{},added:{},draft:null,gm:false,gmap:null,markers:[],
  host:{type:'ac74',kind:'Home',loc:'Patparganj',price:11,prioOn:true,prio:30,from:'06:00',to:'22:00',rules:'',spw:6,kwh:15,tariff:6}};

/* ---------- saved data (per device) ---------- */
var STORE='chargeghar.v1';
function save(){try{localStorage.setItem(STORE,JSON.stringify({city:state.city,bookings:state.bookings,added:state.added,mine:state.mine,nextBooking:state.nextBooking,host:state.host}))}catch(e){}}
function load(){
  try{
    var d=JSON.parse(localStorage.getItem(STORE)||'null');if(!d)return;
    if(d.city&&cityById(d.city))state.city=d.city;
    if(Array.isArray(d.bookings))state.bookings=d.bookings;
    if(d.added&&typeof d.added==='object')state.added=d.added;
    if(d.mine&&d.mine.id==='mine')state.mine=d.mine;
    if(d.nextBooking)state.nextBooking=d.nextBooking;
    if(d.host&&typeof d.host==='object')for(var k in d.host)state.host[k]=d.host[k];
  }catch(e){}
}

/* ---------- data helpers ---------- */
function cityById(id){return CITIES.filter(function(c){return c.id===id})[0]}
function cur(){return cityById(state.city)}
function makeChargers(city){
  var ci=CITIES.indexOf(city);
  return ARCH.map(function(a,i){
    var b=BANDS[TYPES[a.type].band],p=Math.min(b.max,Math.max(b.min,a.price+((ci+i)%3)-1));
    var name=NAMEFMT[i].replace('{a}',city.loc[i]);
    return {id:city.id+'-'+(i+1),cityId:city.id,name:name,host:city.hosts[i],kind:a.kind,type:a.type,price:p,prio:a.prio,status:a.status,queue:a.queue,eta:a.eta,dx:a.dx,dy:a.dy,verified:a.verified,hours:a.hours,note:a.note,rd:a.rd,rev:a.rev,address:name+' (sample address)'};
  });
}
function listFor(cid){return state.cache[cid]||(state.cache[cid]=makeChargers(cityById(cid)))}
function all(){var l=listFor(state.city);return state.mine&&state.mine.cityId===state.city?l.concat([state.mine]):l}
function byId(id){
  if(state.mine&&String(state.mine.id)===String(id))return state.mine;
  for(var k in state.cache){var f=state.cache[k].filter(function(c){return String(c.id)===String(id)})[0];if(f)return f}
  var cid=String(id).split('-')[0];if(cityById(cid)){return listFor(cid).filter(function(c){return String(c.id)===String(id)})[0]}
}
function hash(s){var h=0;for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))%1000003;return h}
/* Homes are shown up to about 200 m away from the real spot until a booking is accepted. */
function pub(c){
  if(c.kind!=='Home')return {dx:c.dx,dy:c.dy};
  var h=hash(String(c.id));return {dx:c.dx+((h%1000)/1000-.5)*.4,dy:c.dy+(((h>>3)%1000)/1000-.5)*.4};
}
function ll(c,p){var city=cityById(c.cityId),d=p||{dx:c.dx,dy:c.dy};return {lat:city.lat+d.dy/110.574,lng:city.lng+d.dx/(111.32*Math.cos(city.lat*Math.PI/180))}}
function dist(c){var p=pub(c);return Math.hypot(p.dx,p.dy)}
function mins(c){return Math.max(2,Math.round(dist(c)*4))}
function dur(h){var m=Math.round(h*60);return m<60?m+' min':Math.floor(m/60)+' h '+(m%60)+' min'}
function toast(t){var el=$('#toast');el.textContent=t;el.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(function(){el.hidden=true},3200)}
function hasAccess(c){return c.kind!=='Home'||state.bookings.some(function(b){return b.cid===c.id&&(b.status==='accepted'||b.status==='completed')})}
function dirsUrl(c){var p=ll(c);return 'https://www.google.com/maps/dir/?api=1&destination='+p.lat.toFixed(5)+','+p.lng.toFixed(5)}

/* ---------- reviews ---------- */
function reviewsOf(c){return (state.added[c.id]||[]).slice().reverse().concat(c.rev||[])}
function ratingOf(c){
  var counts=(c.rd||[0,0,0,0,0]).slice();(state.added[c.id]||[]).forEach(function(r){counts[r.s-1]++});
  var total=0,sum=0;counts.forEach(function(n,i){total+=n;sum+=n*(i+1)});
  return {counts:counts,total:total,avg:total?sum/total:0};
}
function starStr(n){n=Math.round(n);return '★'.repeat(n)+'☆'.repeat(5-n)}
function revHtml(r){
  return '<div class="rev"><div class="row"><b>'+esc(r.n)+'</b><span class="stars" aria-label="'+r.s+' out of 5">'+starStr(r.s)+'</span></div>'+
   '<div class="tags"><span class="tag">Verified session</span>'+(r.tags||[]).map(function(t){return '<span class="tag">'+esc(t)+'</span>'}).join('')+'</div>'+
   (r.t?'<p>'+esc(r.t)+'</p>':'')+'<div class="sub">'+esc(r.d)+'</div>'+
   (r.reply?'<div class="reply"><b>Host reply:</b> '+esc(r.reply)+'</div>':'')+'</div>';
}
function reviewsHtml(c){
  var r=ratingOf(c),list=reviewsOf(c).slice(0,5);
  var bars=[5,4,3,2,1].map(function(s){var n=r.counts[s-1],pct=r.total?Math.round(n/r.total*100):0;return '<div class="bar"><span>'+s+'★</span><div class="track"><i style="width:'+pct+'%"></i></div><span>'+n+'</span></div>'}).join('');
  return '<div class="box"><h3 class="mini">Reviews</h3>'+
   (r.total?'<div class="rsum"><div class="big">'+r.avg.toFixed(1)+'</div><div><div class="stars" aria-label="Average '+r.avg.toFixed(1)+' out of 5">'+starStr(r.avg)+'</div><div class="sub">'+r.total+' reviews</div></div></div><div class="bars">'+bars+'</div>':'<div class="sub">No reviews yet.</div>')+
   list.map(revHtml).join('')+'<div class="sub">Only drivers who finished a booked session can leave a review. Hosts can reply.</div></div>';
}

/* ---------- header, tabs, offline ---------- */
function head(){
  var l=all(),free=l.filter(function(c){return c.status==='free'}).length,low=Math.min.apply(null,l.map(function(c){return c.price}));
  var onFind=state.tab==='find';
  $('#search').hidden=!onFind;$('#hdctl').classList.toggle('solo',!onFind);
  $('#sum').hidden=!onFind;
  $('#sum').innerHTML=onFind?'<span><b>'+l.length+'</b> chargers</span><span><b>'+free+'</b> free now</span><span>from <b>'+inr(low)+'</b>/kWh</span>':'<span>'+esc(cur().name)+'</span>';
}
function tabs(){
  document.querySelectorAll('.tab').forEach(function(b){
    if(b.dataset.t===state.tab)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
    if(b.dataset.t==='bookings'){
      var n=state.bookings.filter(function(x){return x.status==='requested'||x.status==='accepted'}).length;
      var bd=b.querySelector('.badge');if(bd){bd.hidden=!n;bd.textContent=n}
    }
  });
}
function net(){var o=$('#offline');if(o)o.hidden=navigator.onLine!==false}

/* ---------- Find: map ---------- */
function rng(seed){var s=seed||1;return function(){s=(s*1664525+1013904223)%4294967296;return s/4294967296}}
function schematic(list){
  var C={x:180,y:140},K=60,r=rng(hash(state.city)+7),art='',i;
  var py=40+r()*160,pw=44+r()*30,px=40+r()*240;
  art+='<rect class="park" x="'+px.toFixed(0)+'" y="'+py.toFixed(0)+'" width="'+(pw+20).toFixed(0)+'" height="'+pw.toFixed(0)+'" rx="14"/>';
  for(i=0;i<5;i++){var a=r()*280,b=r()*280;art+='<path class="road2" stroke-width="3" d="M0 '+a.toFixed(0)+'C120 '+(a+(r()-.5)*80).toFixed(0)+' 240 '+(b+(r()-.5)*80).toFixed(0)+' 360 '+b.toFixed(0)+'"/>'}
  for(i=0;i<4;i++){var a2=r()*360,b2=r()*360;art+='<path class="road2" stroke-width="3" d="M'+a2.toFixed(0)+' 0C'+(a2+(r()-.5)*90).toFixed(0)+' 90 '+(b2+(r()-.5)*90).toFixed(0)+' 190 '+b2.toFixed(0)+' 280"/>'}
  var y1=70+r()*140,y2=70+r()*140,x1=100+r()*160,x2=100+r()*160;
  art+='<path class="road1" stroke-width="9" d="M0 '+y1.toFixed(0)+'C120 '+(y1+30).toFixed(0)+' 240 '+(y2-30).toFixed(0)+' 360 '+y2.toFixed(0)+'"/>';
  art+='<path class="road1" stroke-width="7" d="M'+x1.toFixed(0)+' 0C'+(x1-30).toFixed(0)+' 90 '+(x2+30).toFixed(0)+' 190 '+x2.toFixed(0)+' 280"/>';
  var pins=list.slice().sort(function(a,b){return pub(b).dy-pub(a).dy}).map(function(c){
    var p=pub(c),x=C.x+p.dx*K,y=C.y-p.dy*K,lab=inr(c.price),w=lab.length*8+14,busy=c.status==='busy';
    return '<g class="pin '+(busy?'busy':'free')+(String(state.selected)===String(c.id)?' sel':'')+'" transform="translate('+x.toFixed(1)+','+y.toFixed(1)+')" data-act="open" data-id="'+c.id+'" tabindex="0" role="button" aria-label="'+esc(c.name)+', '+lab+' per kWh, '+(busy?'busy':'free')+'"><rect x="'+(-w/2)+'" y="-24" width="'+w+'" height="20" rx="10"/><path d="M-5 -5 L0 2 L5 -5Z"/><text y="-10" text-anchor="middle">'+lab+'</text></g>';
  }).join('');
  return '<svg viewBox="0 0 360 280" role="img" aria-label="Simple map of chargers around '+esc(cur().name)+'">'+
   '<rect class="land" width="360" height="280"/>'+art+
   '<circle class="ring" cx="180" cy="140" r="60"/><circle class="ring" cx="180" cy="140" r="120"/>'+
   '<text class="lbl" x="186" y="76">1 km</text><text class="lbl" x="186" y="16">2 km</text>'+
   '<text class="lbl" x="10" y="16">N ↑</text><text class="lbl" x="350" y="272" text-anchor="end">'+esc(cur().name.toUpperCase())+'</text>'+
   '<circle class="me-ring" cx="180" cy="140" r="15"/><circle class="me-dot" cx="180" cy="140" r="6"/>'+
   '<text class="lbl" x="180" y="166" text-anchor="middle" style="fill:var(--ink)">You</text>'+pins+'</svg>';
}
function legend(){
  return '<div class="legend"><span><i class="dot" style="background:var(--free)"></i>Free</span><span><i class="dot" style="background:var(--busy)"></i>Busy</span>'+
   (state.gm?'<span><i class="dot" style="background:#5F6B7A"></i>Public charger (Google)</span>':'')+
   '<span>Homes show an approximate spot</span>'+(state.gm?'':'<span>Simple map, sample listings</span>')+'</div>';
}
function mapLinks(){var c=cur();
  return '<div class="maplinks"><a class="btn alt small" target="_blank" rel="noopener" href="https://www.google.com/maps/search/EV+charging+stations/@'+c.lat+','+c.lng+',14z">Public chargers on Google Maps</a></div>';
}
function pillIcon(label,busy){
  var w=label.length*8+18,col=busy?'#A85F00':'#0B7A45';
  var svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="30" viewBox="0 0 '+w+' 30"><rect x="1" y="1" width="'+(w-2)+'" height="20" rx="10" fill="'+col+'" stroke="#fff" stroke-width="2"/><path d="M'+(w/2-5)+' 21L'+(w/2)+' 28L'+(w/2+5)+' 21Z" fill="'+col+'"/><text x="'+(w/2)+'" y="15" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="12" fill="#fff">'+label+'</text></svg>';
  return {url:'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(svg),scaledSize:new google.maps.Size(w,30),anchor:new google.maps.Point(w/2,28)};
}
async function gmapInit(){
  var c=cur(),holder=$('#gmap');
  try{await google.maps.importLibrary('maps');await google.maps.importLibrary('marker')}catch(e){}
  if(!holder||!holder.isConnected)return;
  state.gmap=new google.maps.Map(holder,{center:{lat:c.lat,lng:c.lng},zoom:14,mapTypeControl:false,streetViewControl:false,fullscreenControl:false,clickableIcons:false});
  new google.maps.Marker({map:state.gmap,position:{lat:c.lat,lng:c.lng},title:'You',icon:{path:google.maps.SymbolPath.CIRCLE,scale:8,fillColor:'#F5B50A',fillOpacity:1,strokeColor:'#10261B',strokeWeight:2}});
  gmapMarkers(currentList());
  loadPublic(state.gmap,c);
}
function gmapMarkers(list){
  if(!state.gmap)return;
  state.markers.forEach(function(m){m.setMap(null)});state.markers=[];
  list.forEach(function(c){
    var pos=ll(c,pub(c));
    if(c.kind==='Home')state.markers.push(new google.maps.Circle({map:state.gmap,center:pos,radius:200,strokeOpacity:0,fillColor:'#0B7A45',fillOpacity:.14,clickable:false}));
    var m=new google.maps.Marker({map:state.gmap,position:pos,title:c.name,icon:pillIcon(inr(c.price),c.status==='busy'),zIndex:String(state.selected)===String(c.id)?10:1});
    m.addListener('click',function(){openSheet(c.id)});state.markers.push(m);
  });
}
async function loadPublic(map,c){
  try{
    var lib=await google.maps.importLibrary('places');
    var res=await lib.Place.searchNearby({fields:['displayName','location','id'],locationRestriction:{center:{lat:c.lat,lng:c.lng},radius:4000},includedPrimaryTypes:['electric_vehicle_charging_station'],maxResultCount:20});
    var iw=new google.maps.InfoWindow();
    (res.places||[]).forEach(function(p){
      var m=new google.maps.Marker({map:map,position:p.location,title:p.displayName,icon:{path:google.maps.SymbolPath.CIRCLE,scale:6,fillColor:'#5F6B7A',fillOpacity:1,strokeColor:'#fff',strokeWeight:2}});
      m.addListener('click',function(){iw.setContent('<b>'+esc(p.displayName)+'</b><br>Public charger<br><a target="_blank" rel="noopener" href="https://www.google.com/maps/place/?q=place_id:'+encodeURIComponent(p.id)+'">Open in Google Maps</a>');iw.open(map,m)});
    });
  }catch(e){}
}
function loadGMaps(){
  if(!KEY||navigator.onLine===false)return;
  if(window.google&&window.google.maps){state.gm=true;return}
  window.__gmReady=function(){state.gm=true;if(state.tab==='find')renderFind()};
  window.gm_authFailure=function(){state.gm=false;toast('Google Maps key was rejected. Showing the simple map.');if(state.tab==='find')renderFind()};
  var s=document.createElement('script');s.async=true;s.src='https://maps.googleapis.com/maps/api/js?key='+encodeURIComponent(KEY)+'&callback=__gmReady';
  s.onerror=function(){state.gm=false};document.head.appendChild(s);
}

/* ---------- Find: list ---------- */
function statusPill(c){
  if(c.pending)return '<span class="pill busy">Pending verification</span>';
  return c.status==='busy'?'<span class="pill busy">Busy · free in ~'+c.eta+' min</span>':'<span class="pill free">Free now</span>';
}
function cardHtml(c,preview){
  var t=TYPES[c.type],r=ratingOf(c),busy=c.status==='busy'||c.pending;
  var inner='<div class="ico'+(busy?' busy':'')+'">'+ICON.bolt+'</div><div class="cbody">'+
    '<div class="row"><div><div class="name">'+esc(c.name)+'</div><div class="sub">'+esc(c.host)+(c.verified?' · Verified':'')+' · '+esc(c.kind)+'</div></div>'+
    '<div class="price"><b>'+inr(c.price)+'</b><small>/kWh</small></div></div>'+
    '<div class="tags"><span class="tag">'+t.conn+'</span><span class="tag">'+t.kw+' kW</span>'+(c.prioOn===false?'':'<span class="tag prio">Priority +'+inr(c.prio)+'</span>')+'</div>'+
    '<div class="meta">'+statusPill(c)+'<span>'+dist(c).toFixed(1)+' km · ~'+mins(c)+' min</span>'+(r.total?'<span><span class="stars">★</span> <span class="rate">'+r.avg.toFixed(1)+'</span> ('+r.total+')</span>':'<span>New</span>')+'</div></div>';
  return preview?'<div class="card flat">'+inner+'</div>':'<button class="card" data-act="open" data-id="'+c.id+'">'+inner+'</button>';
}
function currentList(){
  var q=state.q.trim().toLowerCase();
  var list=all().filter(function(c){
    if(state.veh!=='All'&&TYPES[c.type].veh.indexOf(state.veh)<0)return false;
    if(state.onlyFree&&c.status!=='free')return false;
    if(q&&(c.name+' '+c.host+' '+c.kind+' '+TYPES[c.type].conn).toLowerCase().indexOf(q)<0)return false;
    return true;
  });
  list.sort(function(a,b){return state.sort==='cheap'?a.price-b.price:state.sort==='top'?ratingOf(b).avg-ratingOf(a).avg:dist(a)-dist(b)});
  return list;
}
function renderFind(){
  $('#view').innerHTML='<div id="mapwrap"></div><div class="chips" id="chips" role="group" aria-label="Filters"></div><div class="list" id="list"></div>';
  state.gmap=null;state.markers=[];updateFind();
}
function updateFind(){
  if(!$('#list'))return;
  var list=currentList();
  var VEH=[['All','All'],['Car','Car'],['2W','Scooter'],['3W','E-rickshaw']];
  $('#chips').innerHTML=VEH.map(function(v){return '<button class="chip" data-act="veh" data-v="'+v[0]+'" aria-pressed="'+(state.veh===v[0])+'">'+v[1]+'</button>'}).join('')+
    '<button class="chip" data-act="free" aria-pressed="'+state.onlyFree+'">Free now</button>'+
    '<button class="chip" data-act="sort" data-v="near" aria-pressed="'+(state.sort==='near')+'">Nearest</button>'+
    '<button class="chip" data-act="sort" data-v="cheap" aria-pressed="'+(state.sort==='cheap')+'">Cheapest</button>'+
    '<button class="chip" data-act="sort" data-v="top" aria-pressed="'+(state.sort==='top')+'">Top rated</button>';
  $('#list').innerHTML=list.length?list.map(function(c){return cardHtml(c)}).join(''):'<div class="empty"><div>No chargers match. Try another vehicle type or clear the search.</div><button class="btn small" data-act="clear">Clear filters</button></div>';
  if(state.gm&&window.google&&window.google.maps){
    if(!state.gmap){$('#mapwrap').innerHTML='<section class="map"><div id="gmap" class="gmap"></div>'+legend()+mapLinks()+'</section>';gmapInit()}
    else gmapMarkers(list);
  }else{
    $('#mapwrap').innerHTML='<section class="map">'+schematic(list)+legend()+mapLinks()+'</section>';
  }
}

/* ---------- Sheet (detail, booking, chat, reviews) ---------- */
function costOf(c,b){var e=Math.round(b.kwh*c.price),p=b.prio?c.prio:0,f=Math.round(b.kwh*c.price*SERVICE);return{e:e,p:p,f:f,total:e+p+f}}
function costHtml(c,b){var k=costOf(c,b);
  return '<div class="cost" id="cost"><div><span>Energy ('+b.kwh+' kWh × '+inr(c.price)+')</span><span>'+inr(k.e)+'</span></div>'+
  (b.prio?'<div><span>Priority slot</span><span>'+inr(k.p)+'</span></div>':'')+
  '<div><span>Service fee ('+Math.round(SERVICE*100)+'%)</span><span>'+inr(k.f)+'</span></div>'+
  '<div class="tot"><span>Total</span><span>'+inr(k.total)+'</span></div></div>';
}
function bookHtml(c){
  var t=TYPES[c.type],b=state.book;
  if(c.mine)return '<div class="box"><h3 class="mini">This is your listing</h3><p class="muted">Drivers will see it exactly like this once verification is done.</p></div>';
  var busy=c.status==='busy';
  var statusLine=busy?'<span class="status busy">● Busy.</span> Current session ends in about '+c.eta+' min, '+c.queue+' driver'+(c.queue>1?'s':'')+' waiting.':'<span class="status free">● Free now.</span> You can start as soon as you arrive.';
  var prioText=busy?'You move ahead of the '+c.queue+' waiting driver'+(c.queue>1?'s':'')+'. A charge already running is never interrupted.':'The host holds the charger for you for 15 minutes after your start time.';
  return '<div class="box"><h3 class="mini">Book a slot</h3><div>'+statusLine+'</div>'+
   '<div class="seg" role="group" aria-label="Start time">'+SLOTS.map(function(s,i){return '<button data-act="slot" data-i="'+i+'" aria-pressed="'+(b.slot===i)+'">'+s+'</button>'}).join('')+'</div>'+
   '<div class="field"><label for="kwh">Energy needed <b id="kwhv">'+b.kwh+' kWh</b></label><input id="kwh" type="range" min="3" max="40" step="1" value="'+b.kwh+'"><div class="sub" id="dur">About '+dur(b.kwh/t.kw)+' at '+t.kw+' kW</div></div>'+
   '<label class="check" for="prio"><input id="prio" type="checkbox"'+(b.prio?' checked':'')+'><span><b>Priority slot, +'+inr(c.prio)+'</b><br><small class="muted">'+prioText+'</small></span></label>'+
   '<div id="costwrap">'+costHtml(c,b)+'</div>'+
   '<button class="btn" data-act="request">Request slot</button>'+
   '<div class="sub">Pay in the app after charging, by the energy actually delivered. Free cancellation within 15 minutes.</div></div>';
}
function chatHtml(c){
  if(c.mine)return '';
  var first=c.host.split(' ')[0],log=(state.chats[c.id]=state.chats[c.id]||[{f:'host',t:'Hi, I am '+first+'. Ask me anything about the charger.'}]);
  var quick=['Is it free now?','What cable do I need?','Can you hold the slot?'];
  return '<div class="box chat"><h3 class="mini">Message '+esc(first)+'</h3>'+
   '<div class="log" id="log" aria-live="polite">'+log.map(function(m){return '<div class="msg '+m.f+'">'+esc(m.t)+'</div>'}).join('')+'</div>'+
   '<div class="tags">'+quick.map(function(q){return '<button class="chip mini" data-act="quick" data-q="'+esc(q)+'">'+q+'</button>'}).join('')+'</div>'+
   '<form class="send" id="chatform"><input type="text" id="chatin" placeholder="Write a message" autocomplete="off" aria-label="Message"><button class="btn small" type="submit">Send</button></form>'+
   '<div class="sub">Demo chat with automatic replies. Phone numbers are masked until a booking is accepted.</div></div>';
}
function locHtml(c){
  if(c.mine)return '';
  var d=dist(c).toFixed(1)+' km from the centre of '+esc(cityById(c.cityId).name)+'. ';
  if(hasAccess(c))return '<p class="sub" style="margin-top:10px">'+d+'<a target="_blank" rel="noopener" href="'+dirsUrl(c)+'">Open exact location in Google Maps</a></p>';
  return '<p class="sub" style="margin-top:10px">'+d+'The exact address is shared once the host accepts your request.</p>';
}
function openSheet(id){
  var c=byId(id);if(!c)return;
  if(c.cityId&&c.cityId!==state.city){state.city=c.cityId;$('#city').value=state.city;save()}
  state.selected=c.id;state.sheet=c.id;state.book={slot:0,kwh:15,prio:false};
  var t=TYPES[c.type],r=ratingOf(c);
  $('#sheet').innerHTML='<div class="scrim" data-act="scrim"><div class="panel" role="dialog" aria-modal="true" aria-label="'+esc(c.name)+'"><div class="grab"></div>'+
   '<div class="row"><div><h2 class="sec" style="margin:0">'+esc(c.name)+'</h2><div class="sub">'+esc(c.host)+(c.verified?' · Verified host':'')+' · '+esc(c.kind)+' · <span class="stars">★</span> '+(r.total?r.avg.toFixed(1)+' ('+r.total+')':'New')+'</div></div><button class="x" data-act="close" aria-label="Close">✕</button></div>'+
   '<div class="stats"><div class="stat"><span>Host’s rate</span><b>'+inr(c.price)+' / kWh</b></div><div class="stat"><span>Power</span><b>'+t.kw+' kW</b></div><div class="stat"><span>Connector</span><b>'+t.conn+'</b></div><div class="stat"><span>Open</span><b>'+esc(c.hours)+'</b></div></div>'+
   (c.note?'<div class="note">'+esc(c.note)+'</div>':'')+locHtml(c)+
   '<div id="bookbox">'+bookHtml(c)+'</div>'+reviewsHtml(c)+chatHtml(c)+'</div></div>';
  $('#sheet').hidden=false;document.body.style.overflow='hidden';
  var lg=$('#log');if(lg)lg.scrollTop=lg.scrollHeight;
  if(state.tab==='find'){head();updateFind()}
}
function closeSheet(){state.sheet=null;state.draft=null;$('#sheet').hidden=true;$('#sheet').innerHTML='';document.body.style.overflow='';if(state.tab==='find')updateFind()}

function openReview(bid){
  var b=state.bookings.filter(function(x){return String(x.id)===String(bid)})[0];if(!b)return;
  var c=byId(b.cid);state.draft={bid:b.id,cid:c.id,stars:0,tags:[],text:''};state.sheet='review';
  $('#sheet').innerHTML='<div class="scrim" data-act="scrim"><div class="panel" role="dialog" aria-modal="true" aria-label="Rate your session"><div class="grab"></div>'+
   '<div class="row"><div><h2 class="sec" style="margin:0">Rate your session</h2><div class="sub">'+esc(c.name)+'</div></div><button class="x" data-act="close" aria-label="Close">✕</button></div>'+
   '<div class="box"><div class="field"><div class="lab">Your rating</div><div class="starpick" role="group" aria-label="Star rating">'+[1,2,3,4,5].map(function(n){return '<button data-act="star" data-n="'+n+'" aria-pressed="false" aria-label="'+n+' star'+(n>1?'s':'')+'">☆</button>'}).join('')+'</div></div>'+
   '<div class="field"><div class="lab">What stood out</div><div class="tags">'+REVIEW_TAGS.map(function(t){return '<button class="chip mini" data-act="rtag" data-t="'+esc(t)+'" aria-pressed="false">'+t+'</button>'}).join('')+'</div></div>'+
   '<div class="field"><label for="rtext">Your review (optional)</label><textarea id="rtext" maxlength="200" placeholder="Was it easy to find? Did the host help? Was the speed as listed?"></textarea></div>'+
   '<div id="rerr" class="sub" style="color:var(--warn)" role="alert"></div>'+
   '<button class="btn" data-act="postreview">Post review</button><div class="sub">Your review shows a Verified session badge because you charged here through the app.</div></div></div></div>';
  $('#sheet').hidden=false;document.body.style.overflow='hidden';
}

function hostReply(c,text){
  var t=TYPES[c.type],x=text.toLowerCase();
  if(/free|available|now|empty/.test(x))return c.status==='free'?'Yes, it is free right now. Send a request and I will confirm.':'It is busy for about '+c.eta+' more minutes. A priority slot puts you next in line.';
  if(/cable|connector|bring|plug/.test(x))return t.conn==='Type 2 AC'?'Please bring your own Type 2 cable.':t.conn==='CCS2 DC'?'The CCS2 cable is attached to the charger.':'It is a normal 15A wall socket. Bring your charger cable.';
  if(/price|rate|cheap|discount|less/.test(x))return 'My rate is '+inr(c.price)+' per kWh. For a faster turn, a priority slot is '+inr(c.prio)+' extra.';
  if(/address|where|location|map|landmark/.test(x))return 'I will share the exact address and a landmark as soon as I accept your request.';
  if(/hold|wait|priority|reserve|early|late/.test(x))return 'With a priority slot I hold the charger for you for 15 minutes after your start time.';
  return 'Got it. Send your request and I will confirm shortly.';
}
function sendChat(c,text){
  text=text.replace(/\d[\d\s-]{7,}\d/g,'••••••••').trim();
  if(!text)return;
  var log=state.chats[c.id];log.push({f:'me',t:text});
  var el=$('#log');if(el){el.insertAdjacentHTML('beforeend','<div class="msg me">'+esc(text)+'</div>');el.scrollTop=el.scrollHeight}
  setTimeout(function(){
    var r=hostReply(c,text);log.push({f:'host',t:r});
    var l2=$('#log');if(l2&&state.sheet===c.id){l2.insertAdjacentHTML('beforeend','<div class="msg host">'+esc(r)+'</div>');l2.scrollTop=l2.scrollHeight}
  },900);
}

/* ---------- Bookings ---------- */
function renderBookings(){
  var list=state.bookings.slice().reverse();
  $('#view').innerHTML='<h2 class="sec">Your bookings</h2>'+(list.length?'<div class="list">'+list.map(function(b){
    var c=byId(b.cid);if(!c)return '';
    var st={requested:'<span class="pill busy">Waiting for host</span>',accepted:'<span class="pill free">Accepted</span>',completed:'<span class="pill free">Completed</span>',cancelled:'<span class="pill bad">Cancelled</span>'}[b.status];
    var acts='';
    if(b.status==='accepted')acts='<button class="btn small" data-act="finish" data-id="'+b.id+'">Finish charging (demo)</button><button class="btn alt small" data-act="open" data-id="'+c.id+'">Chat</button><button class="btn alt small" data-act="cancel" data-id="'+b.id+'">Cancel</button>';
    else if(b.status==='requested')acts='<button class="btn alt small" data-act="open" data-id="'+c.id+'">Chat</button><button class="btn alt small" data-act="cancel" data-id="'+b.id+'">Cancel</button>';
    else if(b.status==='completed')acts=b.reviewed?'<span class="good">Review posted</span>':'<button class="btn gold small" data-act="review" data-id="'+b.id+'">Write a review</button>';
    return '<div class="card"><div class="ico'+(b.status==='cancelled'?' busy':'')+'">'+ICON.bolt+'</div><div class="cbody"><div class="row"><div><div class="name">'+esc(c.name)+'</div><div class="sub">'+SLOTS[b.slot]+' · '+b.kwh+' kWh'+(b.prio?' · Priority':'')+'</div></div><div class="price"><b>'+inr(b.total)+'</b></div></div><div>'+st+'</div>'+
     (b.status==='accepted'?'<div class="note"><b>Address:</b> '+esc(c.address)+'<br><a target="_blank" rel="noopener" href="'+dirsUrl(c)+'">Open exact location in Google Maps</a><br><b>Start code:</b> <span style="font-variant-numeric:tabular-nums;font-weight:700">'+b.code+'</span><br><small class="muted">Tell the host this code when you arrive.</small></div>':'')+
     (acts?'<div class="tags">'+acts+'</div>':'')+'</div></div>';
  }).join('')+'</div>':'<div class="empty"><div>No bookings yet. Pick a charger on the Find tab and request a slot.</div><button class="btn small" data-act="tab" data-t="find">Find a charger</button></div>')+
  '<div class="foot"><button data-act="reset">Reset demo data</button></div>';
}

/* ---------- Host ---------- */
function band(h){return BANDS[TYPES[h.type].band]}
function earn(h){var s=h.spw*4.3,sale=s*h.kwh*h.price,cost=s*h.kwh*h.tariff,pr=h.prioOn?s*0.25*h.prio*PRIO_HOST_SHARE:0;return{s:s,net:sale-cost+pr,sale:sale,pr:pr}}
function previewCharger(h){return {id:'prev',cityId:state.city,name:h.kind+' charger, '+(h.loc||cur().loc[0]),host:'You',kind:h.kind,type:h.type,price:h.price,prio:h.prio,prioOn:h.prioOn,status:'free',queue:0,hours:h.from+' – '+h.to,dx:-.2,dy:.1,verified:false}}
function earnHtml(h){var e=earn(h);
  return '<div class="cost" id="earn"><div><span>Sessions a month</span><span>about '+Math.round(e.s)+'</span></div><div><span>Energy sales</span><span>'+inr(e.sale)+'</span></div>'+(h.prioOn?'<div><span>Your share of priority fees (80%)</span><span>'+inr(e.pr)+'</span></div>':'')+
   '<div class="tot"><span>After your electricity cost</span><span>'+inr(e.net)+'</span></div></div>';
}
function renderHost(){
  var h=state.host,b=band(h);
  if(state.mine){
    $('#view').innerHTML='<h2 class="sec">Your listing</h2>'+cardHtml(state.mine,true)+
     '<div class="box"><h3 class="mini">Verification in progress</h3><ol class="steps"><li class="good">Registration fee paid ('+inr(FEE)+', demo)</li><li>Upload a photo of the charger and your electricity meter</li><li>Safety check of the socket and earthing</li><li>Go live and start receiving requests</li></ol><div class="sub">In this prototype your listing already shows on the Find tab so you can see how drivers will find it.</div>'+
     '<button class="btn alt" data-act="unlist">Remove listing</button></div>';
    return;
  }
  var opts=Object.keys(TYPES).map(function(k){return '<option value="'+k+'"'+(h.type===k?' selected':'')+'>'+TYPES[k].label+'</option>'}).join('');
  var kinds=['Home','Shop','Society'].map(function(k){return '<option'+(h.kind===k?' selected':'')+'>'+k+'</option>'}).join('');
  $('#view').innerHTML=
   '<section class="hero"><h2>Your idle charger can <em>earn</em> for you</h2><p>List it in '+esc(cur().name)+' in a few minutes. Drivers nearby find it on the map.</p>'+
   '<ul class="pts"><li><i>'+ICON.pen+'</i><span>You set the price, inside a fair range for your charger.</span></li><li><i>'+ICON.bolt+'</i><span>Drivers can pay extra for priority. You keep 80% of that fee.</span></li><li><i>'+ICON.shield+'</i><span>Your exact address stays hidden until you accept a booking.</span></li></ul></section>'+
   '<div class="box"><h3 class="mini">Your charger</h3><div class="field"><label for="htype">Charger type</label><select class="in" id="htype">'+opts+'</select></div>'+
   '<div class="two"><div class="field"><label for="hkind">Place</label><select class="in" id="hkind">'+kinds+'</select></div><div class="field"><label for="hloc">Locality</label><input type="text" id="hloc" value="'+esc(h.loc)+'" maxlength="40"></div></div>'+
   '<div class="field"><label for="hprice">Your rate per kWh <b id="hpricev">'+inr(h.price)+'</b></label><input id="hprice" type="range" min="'+b.min+'" max="'+b.max+'" step="1" value="'+h.price+'"><div class="sub">Allowed range for this charger: '+inr(b.min)+' to '+inr(b.max)+' per kWh. The range keeps prices fair for drivers.</div></div>'+
   '<label class="check" for="hprioOn"><input id="hprioOn" type="checkbox"'+(h.prioOn?' checked':'')+'><span><b>Offer priority slots</b><br><small class="muted">Drivers who pay a little extra get the next turn and a 15-minute hold.</small></span></label>'+
   (h.prioOn?'<div class="field"><label for="hprio">Priority fee <b id="hpriov">'+inr(h.prio)+'</b></label><input id="hprio" type="range" min="'+b.pmin+'" max="'+b.pmax+'" step="5" value="'+h.prio+'"></div>':'')+
   '<div class="two"><div class="field"><label for="hfrom">Open from</label><input type="time" id="hfrom" value="'+h.from+'"></div><div class="field"><label for="hto">Open until</label><input type="time" id="hto" value="'+h.to+'"></div></div>'+
   '<div class="field"><label for="hrules">House rules</label><textarea id="hrules" maxlength="160" placeholder="Example: bring your own cable, park in slot 4, no horn at night">'+esc(h.rules)+'</textarea></div></div>'+
   '<h3 class="mini" style="margin-top:20px">How drivers will see it</h3><div id="hprev" style="margin-top:8px">'+cardHtml(previewCharger(h),true)+'</div>'+
   '<div class="box"><h3 class="mini">What you could earn</h3>'+
   '<div class="two"><div class="field"><label for="hspw">Sessions a week <b id="hspwv">'+h.spw+'</b></label><input id="hspw" type="range" min="1" max="20" value="'+h.spw+'"></div><div class="field"><label for="hkwh">Average kWh <b id="hkwhv">'+h.kwh+'</b></label><input id="hkwh" type="range" min="5" max="40" value="'+h.kwh+'"></div></div>'+
   '<div class="field"><label for="htariff">Your electricity cost per kWh (₹)</label><input type="number" id="htariff" min="0" max="20" step="0.5" value="'+h.tariff+'"></div>'+
   earnHtml(h)+'<div class="sub">Example estimate. Assumes one in four sessions takes a priority slot.</div></div>'+
   '<div class="note" style="margin-top:14px"><b>Before you list.</b> Check that your electricity connection category allows selling power. Rules for reselling from a home connection depend on your state and distribution company, so confirm with them.</div>'+
   '<div class="box"><h3 class="mini">Registration</h3><div class="cost"><div><span>Yearly listing fee (example)</span><span>'+inr(FEE)+'</span></div><div><span>Service fee</span><span>Paid by the driver, '+Math.round(SERVICE*100)+'%</span></div></div>'+
   '<button class="btn gold" data-act="list">Pay '+inr(FEE)+' and submit (demo)</button><div class="sub">No real payment happens in this prototype.</div></div>';
}

/* ---------- routing ---------- */
function render(){tabs();head();if(state.tab==='find')renderFind();else if(state.tab==='bookings')renderBookings();else renderHost()}
function go(t){state.tab=t;render();window.scrollTo(0,0)}
function autoAccept(bk){
  setTimeout(function(){
    if(bk.status!=='requested')return;
    bk.status='accepted';save();var c=byId(bk.cid);
    if(state.tab==='bookings')render();else tabs();
    toast((c?c.host.split(' ')[0]:'Host')+' accepted your request');
  },2600);
}

document.addEventListener('click',function(e){
  var el=e.target.closest('[data-act]');if(!el)return;
  var a=el.dataset.act;
  if(a==='scrim'){if(e.target===el)closeSheet();return}
  if(a==='tab')go(el.dataset.t);
  else if(a==='veh'){state.veh=el.dataset.v;updateFind()}
  else if(a==='free'){state.onlyFree=!state.onlyFree;updateFind()}
  else if(a==='sort'){state.sort=el.dataset.v;updateFind()}
  else if(a==='clear'){state.veh='All';state.onlyFree=false;state.q='';$('#q').value='';updateFind()}
  else if(a==='open')openSheet(el.dataset.id);
  else if(a==='close')closeSheet();
  else if(a==='install'){if(deferred){deferred.prompt();deferred.userChoice.then(function(){deferred=null;$('#install').hidden=true})}}
  else if(a==='slot'){state.book.slot=+el.dataset.i;$('#bookbox').innerHTML=bookHtml(byId(state.sheet))}
  else if(a==='quick'){sendChat(byId(state.sheet),el.dataset.q)}
  else if(a==='request'){
    var c2=byId(state.sheet),b=state.book,k=costOf(c2,b);
    var bk={id:state.nextBooking++,cid:c2.id,slot:b.slot,kwh:b.kwh,prio:b.prio,total:k.total,status:'requested',code:String(1000+Math.floor(Math.random()*9000))};
    state.bookings.push(bk);save();closeSheet();go('bookings');toast('Request sent to '+c2.host.split(' ')[0]+' (demo)');autoAccept(bk);
  }
  else if(a==='cancel'){state.bookings.forEach(function(b){if(String(b.id)===el.dataset.id)b.status='cancelled'});save();render();toast('Booking cancelled')}
  else if(a==='finish'){state.bookings.forEach(function(b){if(String(b.id)===el.dataset.id)b.status='completed'});save();render();toast('Session complete (demo). You can now leave a review.')}
  else if(a==='review')openReview(el.dataset.id);
  else if(a==='star'){
    var n=+el.dataset.n;state.draft.stars=n;
    document.querySelectorAll('.starpick button').forEach(function(bt){var on=+bt.dataset.n<=n;bt.textContent=on?'★':'☆';bt.setAttribute('aria-pressed',String(+bt.dataset.n===n))});
    $('#rerr').textContent='';
  }
  else if(a==='rtag'){
    var t=el.dataset.t,i=state.draft.tags.indexOf(t);
    if(i<0)state.draft.tags.push(t);else state.draft.tags.splice(i,1);
    el.setAttribute('aria-pressed',String(i<0));
  }
  else if(a==='postreview'){
    var d=state.draft;
    if(!d.stars){$('#rerr').textContent='Choose a star rating first.';return}
    (state.added[d.cid]=state.added[d.cid]||[]).push({n:'You',s:d.stars,t:d.text.trim(),tags:d.tags.slice(),d:'Just now'});
    state.bookings.forEach(function(b){if(b.id===d.bid)b.reviewed=true});
    save();closeSheet();render();toast('Review posted. Thank you.');
  }
  else if(a==='list'){
    var h=state.host;
    state.mine={id:'mine',mine:true,pending:true,cityId:state.city,name:h.kind+' charger, '+(h.loc||cur().loc[0]),host:'You',kind:h.kind,type:h.type,price:h.price,prio:h.prio,prioOn:h.prioOn,status:'free',queue:0,hours:h.from+' – '+h.to,dx:-.2,dy:.1,verified:false,note:h.rules,address:'Your address'};
    save();render();window.scrollTo(0,0);toast('Listing submitted for verification (demo)');
  }
  else if(a==='unlist'){state.mine=null;save();render()}
  else if(a==='reset'){
    try{localStorage.removeItem(STORE)}catch(x){}
    state.bookings=[];state.added={};state.mine=null;state.nextBooking=1;state.chats={};
    render();toast('Demo data cleared');
  }
});
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'&&state.sheet)closeSheet();
  if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('g[data-act]')){e.preventDefault();openSheet(e.target.dataset.id)}
});
document.addEventListener('submit',function(e){
  if(e.target.id==='chatform'){e.preventDefault();var i=$('#chatin');sendChat(byId(state.sheet),i.value);i.value=''}
});
document.addEventListener('input',function(e){
  var id=e.target.id,h=state.host,c;
  if(id==='q'){state.q=e.target.value;updateFind();return}
  if(id==='rtext'){state.draft.text=e.target.value;return}
  if(id==='kwh'){c=byId(state.sheet);state.book.kwh=+e.target.value;$('#kwhv').textContent=state.book.kwh+' kWh';$('#dur').textContent='About '+dur(state.book.kwh/TYPES[c.type].kw)+' at '+TYPES[c.type].kw+' kW';$('#costwrap').innerHTML=costHtml(c,state.book);return}
  if(!id||id.charAt(0)!=='h')return;
  if(id==='hprice'){h.price=+e.target.value;$('#hpricev').textContent=inr(h.price)}
  else if(id==='hprio'){h.prio=+e.target.value;$('#hpriov').textContent=inr(h.prio)}
  else if(id==='hspw'){h.spw=+e.target.value;$('#hspwv').textContent=h.spw}
  else if(id==='hkwh'){h.kwh=+e.target.value;$('#hkwhv').textContent=h.kwh}
  else if(id==='htariff'){h.tariff=Math.max(0,+e.target.value||0)}
  else if(id==='hloc'){h.loc=e.target.value}
  else if(id==='hrules'){h.rules=e.target.value;return}
  else return;
  $('#hprev').innerHTML=cardHtml(previewCharger(h),true);$('#earn').outerHTML=earnHtml(h);
});
document.addEventListener('change',function(e){
  var id=e.target.id,h=state.host;
  if(id==='city'){
    if(state.sheet)closeSheet();
    state.city=e.target.value;state.selected=null;
    if(!state.mine)h.loc=cur().loc[0];
    save();render();return;
  }
  if(id==='prio'){state.book.prio=e.target.checked;$('#costwrap').innerHTML=costHtml(byId(state.sheet),state.book);return}
  if(id==='htype'){h.type=e.target.value;var b=band(h);h.price=Math.min(b.max,Math.max(b.min,h.price));h.prio=Math.min(b.pmax,Math.max(b.pmin,h.prio));renderHost()}
  else if(id==='hkind'){h.kind=e.target.value;$('#hprev').innerHTML=cardHtml(previewCharger(h),true)}
  else if(id==='hprioOn'){h.prioOn=e.target.checked;renderHost()}
  else if(id==='hfrom'){h.from=e.target.value||h.from}
  else if(id==='hto'){h.to=e.target.value||h.to}
  save();
});

/* ---------- install and offline ---------- */
var deferred=null;
window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();deferred=e;var b=$('#install');if(b)b.hidden=false});
window.addEventListener('appinstalled',function(){deferred=null;var b=$('#install');if(b)b.hidden=true;toast('ChargeGhar installed')});
window.addEventListener('online',net);window.addEventListener('offline',net);
if('serviceWorker' in navigator&&document.querySelector('link[rel="manifest"]')&&location.protocol.indexOf('http')===0){
  window.addEventListener('load',function(){try{navigator.serviceWorker.register('sw.js').catch(function(){})}catch(e){}});
}

/* ---------- start ---------- */
load();
try{var qt=new URLSearchParams(location.search).get('tab');if(qt==='host'||qt==='bookings')state.tab=qt}catch(e){}
$('#city').innerHTML=CITIES.map(function(c){return '<option value="'+c.id+'">'+c.name+'</option>'}).join('');
$('#city').value=state.city;
net();render();loadGMaps();
state.bookings.forEach(function(b){if(b.status==='requested')autoAccept(b)});
})();
