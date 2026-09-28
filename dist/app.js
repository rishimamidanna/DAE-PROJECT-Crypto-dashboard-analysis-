const $ = s => document.querySelector(s);
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const money = (v, digits = 0) => new Intl.NumberFormat('en-US', {style:'currency',currency:'USD',maximumFractionDigits:digits,minimumFractionDigits:digits}).format(v);
const menuButton = $('#menu-button');
function closeMenu(){menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Open navigation');$('#main-nav').classList.remove('open');}
menuButton.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')!=='true';menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Close navigation':'Open navigation');$('#main-nav').classList.toggle('open',open);});
$('#main-nav').querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
const dateText = d => new Date(d+'T12:00:00Z').toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'});
const charts = [
 ['01_closing_price_trend.png','The arc of Bitcoin','PRICE / TIME','Daily closing prices across eight years. The notebook export includes the imputation artifacts described above.'],
 ['02_average_close_by_year.png','A year-by-year perspective','PRICE / ANNUAL','Average closing prices in each year. The first and last years cover only part of the calendar year.'],
 ['03_closing_price_distribution.png','Where prices clustered','DISTRIBUTION','The frequency of closing-price levels across the full observation period.'],
 ['04_closing_price_boxplot.png','The shape of the spread','DISTRIBUTION','Median, quartiles and high-price observations. A statistical outlier is not automatically a data error.'],
 ['05_market_direction.png','Up days. Down days.','MARKET DIRECTION','The notebook compares opening and closing prices. Its “Increased” category also includes unchanged days.'],
 ['06_trading_volume.png','Activity behind the price','VOLUME / TIME','Reported daily trading volume over time. Early zero-volume entries remain as recorded in the source.'],
 ['07_volume_vs_closing_price.png','Price meets participation','RELATIONSHIPS','Closing price plotted against volume. Association alone does not establish causation.'],
 ['08_average_close_by_month.png','A monthly perspective','PRICE / MONTH','Calendar-month averages pooled across years. This does not establish a seasonal pattern.'],
 ['09_daily_return_distribution.png','The rhythm of returns','RETURNS','Open-to-close percentage changes. Median-filled prices create artificial extremes in this notebook chart.'],
 ['10_open_vs_close_price.png','Two sides of a trading day','PRICE / COMPARISON','Opening and closing prices plotted together to compare their movement over time.']
];

$('#gallery').innerHTML = charts.map((c,i)=>`<button class="graph-card reveal" data-image="${c[0]}" data-title="${c[1]}" aria-label="Enlarge ${c[1]}"><div class="graph-preview"><img src="assets/${c[0]}" alt="${c[1]} — original Matplotlib chart" loading="lazy" width="1189" height="650"></div><div class="graph-copy"><div class="graph-number">${String(i+1).padStart(2,'0')} / ${c[2]}</div><h3>${c[1]}</h3><p>${c[3]}</p><span class="graph-arrow" aria-hidden="true">↗</span></div></button>`).join('');

let opener;
const modal = $('#lightbox');
function openImage(button) {
 opener = button;
 const filename = button.dataset.image;
 $('#modal-title').textContent = button.dataset.title;
 $('#modal-img').src = 'assets/'+filename;
 $('#modal-img').alt = button.dataset.title+' — original notebook output';
 $('#download-image').href = 'assets/'+filename;
 $('#modal-note').textContent = charts.find(c=>c[0]===filename)?.[3] || 'Original notebook export. See the data note beneath the dashboard for the cleaning limitation.';
 modal.showModal(); document.body.classList.add('modal-open');
}
document.querySelectorAll('[data-image]').forEach(b=>b.addEventListener('click',()=>openImage(b)));
$('#close-modal').addEventListener('click',()=>modal.close());
modal.addEventListener('click',e=>{if(e.target===modal){const r=modal.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)modal.close();}});
modal.addEventListener('close',()=>{document.body.classList.remove('modal-open');opener?.focus({preventScroll:true});});
const observer = new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target);}}),{threshold:.08});
function reveal(){document.querySelectorAll('.reveal:not(.visible)').forEach(el=>observer.observe(el));}
document.body.classList.add('js-ready');reveal();

const routeIds=['overview','dataset','dashboard','visualizations','insights'];
const pageViews=routeIds.map(id=>document.getElementById(id));
let activeView,viewTransitionToken=0;
if('scrollRestoration' in history)history.scrollRestoration='manual';
function routeFromHash(){const id=location.hash.replace(/^#/,'');return routeIds.includes(id)?id:'overview';}
function updateNav(id){document.querySelectorAll('#main-nav a,.nav-action,.hero-intro .text-link').forEach(a=>{const target=(a.getAttribute('href')||'').slice(1);if(routeIds.includes(target))a.toggleAttribute('aria-current',target===id);});}
function showView(id,initial=false){
 const next=document.getElementById(routeIds.includes(id)?id:'overview');if(!next)return;
 updateNav(next.id);const token=++viewTransitionToken;
 if(activeView===next){window.scrollTo({top:0,behavior:motion.matches?'auto':'smooth'});reveal();return;}
 const current=activeView;activeView=next;
 if(initial||!current){pageViews.forEach(view=>{view.hidden=view!==next;view.classList.toggle('view-active',view===next);});window.scrollTo(0,0);reveal();return;}
 current.classList.remove('view-active');current.classList.add('view-leaving');
 const swap=()=>{if(token!==viewTransitionToken)return;current.classList.remove('view-leaving');current.hidden=true;next.hidden=false;requestAnimationFrame(()=>next.classList.add('view-active'));window.scrollTo({top:0,behavior:motion.matches?'auto':'smooth'});reveal();};
 if(motion.matches)swap();else setTimeout(swap,180);
}
document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{const id=a.getAttribute('href').slice(1);if(!routeIds.includes(id))return;e.preventDefault();closeMenu();if(location.hash!==`#${id}`)history.pushState({},'',`#${id}`);showView(id);}));
window.addEventListener('hashchange',()=>showView(routeFromHash()));
window.addEventListener('popstate',()=>showView(routeFromHash()));
showView(routeFromHash(),true);

let dataset, selected = 'all', visiblePoints = [], activeIndex=0, annotationTimer, heroAnimationFrame=0;
const ns='http://www.w3.org/2000/svg';
function svgEl(tag, attrs={}, parent=$('#price-chart'), content) {const el=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,String(v));if(content!==undefined)el.textContent=content;parent.appendChild(el);return el;}
function animateNumber(el,target,format){if(motion.matches){el.textContent=format(target);return;}const start=performance.now();function tick(now){const t=Math.min(1,(now-start)/1350);el.textContent=format(target*(1-Math.pow(1-t,4)));if(t<1)requestAnimationFrame(tick);}requestAnimationFrame(tick);}
function showMetrics(m) {
 const items=[['Daily observations',m.records,v=>Math.round(v).toLocaleString(),'April 2013 — July 2021'],['Average closing price',m.average,v=>money(v),'Across the full source dataset'],['Average intraday return',m.meanReturn,v=>v.toFixed(2)+'%','Open to close · arithmetic mean'],['Days with a price increase',m.increased/m.records*100,v=>v.toFixed(1)+'%','Close strictly above open']];
 $('#metrics').innerHTML=items.map((a,i)=>`<div class="metric"><div class="metric-label">${a[0]}</div><div class="metric-value" id="metric-${i}">—</div><div class="metric-context">${a[3]}</div></div>`).join('');
 items.forEach((a,i)=>animateNumber($('#metric-'+i),a[1],a[2]));
 const sourceGrowth=(m.last/m.first-1)*100;
 $('#insights-grid').innerHTML=`<article class="insight insight-long reveal"><div class="insight-index">01 / THE LONG VIEW</div><div class="insight-stat">${(sourceGrowth/1000).toFixed(1)}k%</div><h3>A remarkable change in scale.</h3><p>Across the source period, Bitcoin’s closing price moved from ${money(m.first,2)} on the first record to ${money(m.last,2)} on the last record, an overall increase of approximately ${sourceGrowth.toFixed(1)}%. This is the clearest long-term pattern in the dataset: the market ended at a far higher level than where it began.</p><p>The rise was not a smooth climb. The daily series contains sharp rallies, pullbacks, and long periods of sideways movement. That means the final increase describes the distance between two historical points; it does not mean that the price grew steadily every day or that the same result is guaranteed in the future.</p></article><article class="insight insight-long reveal"><div class="insight-index">02 / THE RELATIONSHIP</div><div class="insight-stat">${m.correlation.toFixed(3)}</div><h3>Open and Close moved together.</h3><p>The Pearson correlation between the opening and closing prices is ${m.correlation.toFixed(3)}, which is very close to 1. In this dataset, days that began at a higher price generally also ended at a higher price, and days that began at a lower price generally ended at a lower price.</p><p>This is a description of association across the observed records, not a prediction rule. A high correlation does not tell us which direction the next day will move, and it does not remove the variation that can occur within a day. It simply shows that the two price columns followed a similar overall scale across the period.</p></article><article class="insight insight-long reveal"><div class="insight-index">03 / THE VARIATION</div><div class="insight-stat">${m.stdReturn.toFixed(2)}%</div><h3>Growth came with daily fluctuations.</h3><p>Using the open-to-close return, the dataset contains ${m.increased.toLocaleString()} days when the closing price was above the opening price, ${m.decreased.toLocaleString()} days when it was below, and ${m.unchanged} unchanged day. The sample standard deviation of these daily returns is ${m.stdReturn.toFixed(2)}%, showing that the typical day could look very different from the average.</p><p>This variation is why the long-term increase should be read together with the daily evidence. Strong growth and short-term uncertainty can exist at the same time. The original notebook charts also preserve the project’s median-filled values, so their extreme return patterns should be interpreted as cleaning artifacts rather than direct evidence of real market events.</p></article>`;
 reveal();
}
function resetPrice(){if(!dataset)return;const p=visiblePoints.reduce((a,b)=>b[1]>a[1]?b:a);const parts=money(p[1],2).split('.');$('#hero-price').innerHTML=parts[0]+'<span>.'+parts[1]+'</span>';$('#hero-date').textContent='Period peak · '+dateText(p[0]);}
function drawChart(animate=true){
 cancelAnimationFrame(heroAnimationFrame);heroAnimationFrame=0;
 const cutoff=new Date(dataset.points.at(-1)[0]+'T12:00:00Z');if(selected!=='all')cutoff.setUTCFullYear(cutoff.getUTCFullYear()-Number(selected));
 visiblePoints=selected==='all'?dataset.points:dataset.points.filter(p=>p[0]>=cutoff.toISOString().slice(0,10));
 $('#date-range').textContent=dateText(visiblePoints[0][0])+' — '+dateText(visiblePoints.at(-1)[0]);
 resetPrice();
 const svg=$('#price-chart');svg.innerHTML='';svg.setAttribute('aria-label',`Bitcoin closing prices, ${dateText(visiblePoints[0][0])} to ${dateText(visiblePoints.at(-1)[0])}. Use arrow keys on the chart to inspect prices.`);
 const mobile=window.innerWidth<701;const W=mobile?600:1100,H=330,left=mobile?10:6,right=mobile?48:52,top=33,bottom=H-35;
 svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
 const ceiling=Math.ceil(Math.max(...visiblePoints.map(p=>p[1]))/10000)*10000;
 const x=i=>left+i/(visiblePoints.length-1)*(W-left-right),y=v=>bottom-v/ceiling*(bottom-top);
 const defs=svgEl('defs',{},svg);const gradient=svgEl('linearGradient',{id:'areaFill',x1:0,y1:0,x2:0,y2:1},defs);svgEl('stop',{offset:'0%','stop-color':'#f7931a','stop-opacity':'.17'},gradient);svgEl('stop',{offset:'100%','stop-color':'#f7931a','stop-opacity':'.005'},gradient);
 const clip=svgEl('clipPath',{id:'plotReveal'},defs);const clipRect=svgEl('rect',{x:left-2,y:0,width:W,height:H},clip);
 [0,.25,.5,.75,1].forEach(r=>{const yy=y(ceiling*r);svgEl('line',{x1:left,y1:yy,x2:W-right,y2:yy,class:'chart-grid'});svgEl('text',{x:W-right+10,y:yy+4,class:'chart-label'},svg,r===0?'0':(ceiling*r/1000).toFixed(0)+'k');});
 const tickCount=mobile?4:8;for(let j=0;j<=tickCount;j++){const i=Math.round(j/tickCount*(visiblePoints.length-1));let label=selected==='1'?new Date(visiblePoints[i][0]+'T12:00:00Z').toLocaleDateString('en-GB',{month:'short',timeZone:'UTC'}):visiblePoints[i][0].slice(0,4);svgEl('text',{x:x(i),y:H-9,'text-anchor':j===0?'start':j===tickCount?'end':'middle',class:'chart-label'},svg,label);}
 const g=svgEl('g',{'clip-path':'url(#plotReveal)'});const path=visiblePoints.map((p,i)=>(i?'L':'M')+x(i).toFixed(2)+','+y(p[1]).toFixed(2)).join(' ');
 svgEl('path',{d:path+` L${x(visiblePoints.length-1)},${bottom} L${left},${bottom} Z`,fill:'url(#areaFill)'},g);
 const avgPoints=visiblePoints.map((p,i)=>p[2]===null?null:[x(i),y(p[2])]).filter(Boolean);svgEl('path',{d:avgPoints.map((p,i)=>(i?'L':'M')+p.join(',')).join(' '),class:'average-line'},g);
 svgEl('path',{d:path,class:'price-line'},g);
 const peakI=visiblePoints.reduce((a,p,i)=>p[1]>visiblePoints[a][1]?i:a,0);const annotation=svgEl('g',{class:'price-annotation','aria-hidden':'true'});svgEl('circle',{cx:x(peakI),cy:y(visiblePoints[peakI][1]),r:5,fill:'#f7931a',stroke:'white','stroke-width':2},annotation);
 const labelX=Math.min(W-right-90,Math.max(left+60,x(peakI)));svgEl('rect',{x:labelX-55,y:Math.max(0,y(visiblePoints[peakI][1])-34),width:112,height:24,rx:6,fill:'#fff5e7'},annotation);svgEl('text',{x:labelX+1,y:Math.max(0,y(visiblePoints[peakI][1])-34)+16,'text-anchor':'middle',fill:'#ac6917','font-size':11,'font-weight':500},annotation,'PEAK '+money(visiblePoints[peakI][1]));
 const cursor=svgEl('g',{opacity:0,'aria-hidden':'true'});const cross=svgEl('line',{y1:top,y2:bottom,stroke:'#ccc','stroke-dasharray':'3 4'},cursor);const dot=svgEl('circle',{r:4,fill:'#f7931a',stroke:'white','stroke-width':2},cursor);
 const autoCursor=svgEl('g',{class:'auto-cursor','aria-hidden':'true'});const autoCross=svgEl('line',{y1:top,y2:bottom,class:'auto-cross'} ,autoCursor);const autoHalo=svgEl('circle',{r:12,class:'auto-halo'},autoCursor);const autoDot=svgEl('circle',{r:5,class:'auto-dot'},autoCursor);
 const hit=svgEl('rect',{x:left,y:0,width:W-left-right,height:bottom,fill:'transparent',tabindex:0,role:'slider','aria-label':'Inspect daily Bitcoin price','aria-valuemin':0,'aria-valuemax':visiblePoints.length-1,'aria-valuenow':0});
 activeIndex=visiblePoints.length-1;
 function inspectAt(i){activeIndex=Math.max(0,Math.min(visiblePoints.length-1,i));const p=visiblePoints[activeIndex];cursor.setAttribute('opacity',1);cross.setAttribute('x1',x(activeIndex));cross.setAttribute('x2',x(activeIndex));dot.setAttribute('cx',x(activeIndex));dot.setAttribute('cy',y(p[1]));hit.setAttribute('aria-valuenow',activeIndex);hit.setAttribute('aria-valuetext',dateText(p[0])+', '+money(p[1],2));const tip=$('#chart-tooltip');tip.hidden=false;tip.innerHTML=`<span>${dateText(p[0])}</span><strong>${money(p[1],2)}</strong>`;const stage=$('#chart-stage').getBoundingClientRect();tip.style.left=Math.max(0,Math.min(stage.width-165,x(activeIndex)/W*stage.width-65))+'px';tip.style.top=Math.max(0,y(p[1])/H*stage.height-75)+'px';}
 hit.addEventListener('pointermove',e=>{const rect=svg.getBoundingClientRect();inspectAt(Math.round(((e.clientX-rect.left)/rect.width*W-left)/(W-left-right)*(visiblePoints.length-1)));});
 function hide(){cursor.setAttribute('opacity',0);$('#chart-tooltip').hidden=true;}
 hit.addEventListener('pointerleave',hide);hit.addEventListener('blur',hide);hit.addEventListener('focus',()=>inspectAt(activeIndex));hit.addEventListener('keydown',e=>{let i=activeIndex;if(e.key==='ArrowRight')i++;else if(e.key==='ArrowLeft')i--;else if(e.key==='Home')i=0;else if(e.key==='End')i=visiblePoints.length-1;else return;e.preventDefault();inspectAt(i);});
 clearTimeout(annotationTimer);if(animate&&!motion.matches){clipRect.animate([{width:'0px'},{width:W+'px'}],{duration:2100,easing:'cubic-bezier(.2,.6,.3,1)',fill:'both'});annotationTimer=setTimeout(()=>annotation.classList.add('shown'),1900);}else{annotation.classList.add('shown');}
 if(motion.matches){autoCursor.setAttribute('opacity','0');return;}
 const sweepDuration=18000;
 const started=performance.now();
 const sweep=now=>{
  const cycle=(now-started)%(sweepDuration*2);
  const raw=cycle<sweepDuration?cycle/sweepDuration:2-cycle/sweepDuration;
  const eased=raw<.5?2*raw*raw:1-Math.pow(-2*raw+2,2)/2;
  const i=Math.round(eased*(visiblePoints.length-1));const p=visiblePoints[i];
  autoCursor.setAttribute('opacity','.78');autoCross.setAttribute('x1',x(i));autoCross.setAttribute('x2',x(i));autoCross.setAttribute('y1',top);autoCross.setAttribute('y2',bottom);autoDot.setAttribute('cx',x(i));autoDot.setAttribute('cy',y(p[1]));autoHalo.setAttribute('cx',x(i));autoHalo.setAttribute('cy',y(p[1]));autoHalo.setAttribute('r',String(11+3*Math.sin(now/280)));
  const parts=money(p[1],2).split('.');$('#hero-price').innerHTML=parts[0]+'<span>.'+parts[1]+'</span>';$('#hero-date').textContent='Historical sweep · '+dateText(p[0]);
  heroAnimationFrame=requestAnimationFrame(sweep);
 };
 heroAnimationFrame=requestAnimationFrame(sweep);
}
function selectRange(range){if(!['1','3','all'].includes(String(range)))throw new Error('Choose 1, 3 or all.');selected=String(range);document.querySelectorAll('[data-range]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.range===selected)));drawChart();return {range:selected,start:visiblePoints[0][0],end:visiblePoints.at(-1)[0],records:visiblePoints.length};}
document.querySelectorAll('[data-range]').forEach(b=>b.addEventListener('click',()=>{if(dataset)selectRange(b.dataset.range);}));
$('#replay').addEventListener('click',()=>{if(dataset)drawChart();});
let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(dataset)drawChart(false);},200);});
motion.addEventListener('change',()=>{if(dataset)drawChart(false);});
fetch('assets/data.json').then(r=>{if(!r.ok)throw new Error('Data could not be loaded.');return r.json();}).then(d=>{if(!Array.isArray(d.points)||d.points.length<2)throw new Error('Price data is incomplete.');dataset=d;$('#loading').remove();showMetrics(d.metrics);drawChart();if(document.modelContext?.registerTool){try{Promise.resolve(document.modelContext.registerTool({name:'set_bitcoin_chart_range',description:'Change the visible Bitcoin hero chart to the final 1 year, 3 years or the full dataset.',inputSchema:{type:'object',properties:{range:{type:'string',enum:['1','3','all']}},required:['range'],additionalProperties:false},annotations:{readOnlyHint:false},execute:input=>selectRange(input?.range)})).catch(()=>{});}catch{}}}).catch(e=>{$('#loading').textContent='Historical prices could not be loaded. Refresh the page to try again.';$('#hero-price').textContent='Unavailable';$('#hero-date').textContent='The original Matplotlib charts remain available below.';console.error(e);});
