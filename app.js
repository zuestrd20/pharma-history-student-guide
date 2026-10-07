'use strict';
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = (n) => n===null || n===undefined ? '未單列' : Number(n).toLocaleString('en-US');
const sourceLink=(id)=>{const s=DATA.sources[id];return s?`<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)} ↗</a>${s.note?`<span> · ${esc(s.note)}</span>`:''}`:''};
const references=(ids,title='核對來源與口徑')=>`<details><summary>${title}</summary><ol class="sources-inline">${[...new Set(ids)].map(id=>`<li>${sourceLink(id)}</li>`).join('')}</ol></details>`;
const companyById=(id)=>DATA.companies.find(c=>c.id===id);
const matchesEra=(year,era)=>era==='all'||(Number(year)>=Number(era.split('-')[0])&&Number(year)<=Number(era.split('-')[1]));
const drugSearchText=(d)=>[d.company,d.brand,d.generic,d.modality,d.class,d.originType,d.originator,d.historySummary,d.initialIndication,d.firstFDAApproval,...d.events.map(e=>e.year+' '+e.text)].join(' ').toLowerCase();
const filterDrugs=(query,company,era)=>DATA.drugs.filter(d=>(company==='all'||d.companyId===company)&&matchesEra(d.firstFDAApproval.slice(0,4),era)&&drugSearchText(d).includes(query.trim().toLowerCase()));
function renderExplore(){
 const query=$('#search').value,company=$('#company-filter').value,era=$('#era-filter').value;
 const drugs=filterDrugs(query,company,era);
 const ids=new Set(drugs.map(d=>d.companyId));
 $('#result-count').textContent=`找到 ${drugs.length} / ${DATA.drugs.length} 項品牌案例，涉及 ${ids.size} 家公司。年代篩選依首次 FDA 正式核准年；搜尋涵蓋歷史事件年份。`;
 $('#company-grid').innerHTML=DATA.companies.filter(c=>ids.has(c.id)).map(c=>`<article class="company-card"><span class="region">${esc(c.country)} / ${esc(c.standard)}</span><h3>${esc(c.name)}</h3><p>${esc(c.boundaries[0].text)}</p><button class="company-jump secondary" type="button" data-company="${esc(c.id)}">看這家公司財報 ↗</button>${references(c.boundaries.flatMap(b=>b.sources),'公司沿革來源')}</article>`).join('');
 $('#drug-grid').innerHTML=drugs.map(d=>`<article class="drug-card" id="drug-${esc(d.id)}"><div class="card-top"><span class="chip">${esc(d.company)}</span><span class="meta">${esc(d.firstFDAApproval.slice(0,4))} / FDA</span></div><h3>${esc(d.brand)}</h3><p class="generic">${esc(d.generic)} · ${esc(d.modality)}</p><p class="indication"><strong>首次核准用途摘要</strong><br>${esc(d.initialIndication)}</p><span class="origin-label">${esc(d.originType)}</span><p class="origin-story"><strong>來源：</strong>${esc(d.originator)}<br><strong>接力：</strong>${esc(d.developmentAndCommercialization)}</p><p>${esc(d.historySummary)}</p><p class="approval">美國 FDA：${esc(d.firstFDAApproval)} · ${esc(d.approvalType)}${d.firstFDAEUA?`<br>緊急使用授權另為 ${esc(d.firstFDAEUA)}，不等於正式核准。`:''}</p><details><summary>深入一點：機轉、歷史與思考</summary><p class="meta">${esc(d.mechanismPlain)}</p><ul class="sources-inline">${d.events.map(e=>`<li><strong>${esc(e.datePrecision==='decade'?e.year+' 年代':e.date||e.year)}${e.year<1996?'（前史）':''}</strong> · ${esc(e.text)}</li>`).join('')}</ul><p class="meta">思考：${esc(d.studentTakeaway)}</p></details>${references(d.sources.map(s=>s.id),'這項藥物的原始資料')}</article>`).join('');
 $('#empty').hidden=drugs.length>0;
 document.querySelectorAll('.company-jump').forEach(b=>b.addEventListener('click',()=>{$('#finance-company').value=b.dataset.company;renderFinance();$('#money').scrollIntoView({behavior:'smooth'});}));
}
function renderTimeline(era='all'){
 $('#timeline-list').innerHTML=DATA.timeline.filter(e=>matchesEra(e.year,era)).map(e=>`<li><time>${e.year}</time><h3>${esc(e.title)}</h3><p>${esc(e.text)}</p><a href="${esc(DATA.sources[e.sources[0]].url)}" target="_blank" rel="noopener">原始來源 ↗</a></li>`).join('');
}
function selectedProduct(c){
 const name={pfizer:'Comirnaty',roche:'Hemlibra',novartis:'Kymriah'}[c.id];
 return (c.additionalProducts||[]).find(p=>p.name===name)||c.representativeDrug;
}
function renderFinance(){
 const c=companyById($('#finance-company').value),product=selectedProduct(c);
 const bars=[{...c.revenue,css:'revenue'}, {...c.netIncome,css:'profit'}, {...c.operatingIncome,css:'operating'}, {...c.rd,css:'research'}];
 const max=Math.max(...bars.filter(x=>x.value!==null).map(x=>Math.abs(x.value)));
 const old=DATA.historyFinance.filter(x=>x.company===c.id);
 $('#finance-panel').innerHTML=`<div class="finance-title"><h3>${esc(c.name)}</h3><span>${esc(c.periodLabel)} · ${esc(c.currency)} 百萬</span></div><p class="scope">報告期間：${esc(c.start)} — ${esc(c.end)}<br>${esc(c.standard)} · ${esc(c.scope.replace('单一','單一'))}</p><div role="img" aria-label="${esc(c.name)}：${bars.map(b=>esc(b.label)+' '+fmt(b.value)).join('；')}。金額單位 ${esc(c.currency)} 百萬。每家公司獨立比例尺。">${bars.map(b=>`<div class="bar-row"><div class="bar-label"><span>${esc(b.label)}</span><strong>${fmt(b.value)}</strong></div>${b.value===null?`<p class="meta">${esc(b.note||'未以調整後指標代替。')}</p>`:`<div class="bar-track" aria-hidden="true"><div class="bar ${b.css}" style="width:${Math.abs(b.value)/max*100}%"></div></div>`}</div>`).join('')}</div><p class="finance-foot">所有金額單位：${esc(c.currency)} 百萬。各公司圖表以自身最大值作獨立比例尺，不可比較切換前後的長條長度。${c.rd.note?' '+esc(c.rd.note):''}</p>${c.pharmaRevenue.value!==null?`<p class="finance-foot"><strong>${esc(c.pharmaRevenue.label)}：${fmt(c.pharmaRevenue.value)}</strong>${c.pharmaRevenue.note?'<br>'+esc(c.pharmaRevenue.note):''}</p>`:`<p class="finance-foot">${esc(c.pharmaRevenue.label)}</p>`}${c.totalRevenueIncludingOther?`<p class="finance-foot">另外，含其他收入的總收入為 ${fmt(c.totalRevenueIncludingOther.value)}；主圖銷售額 ${fmt(c.revenue.value)} 不含其他收入。</p>`:''}${c.otherRevenue?`<p class="finance-foot">另列其他收入 ${fmt(c.otherRevenue.value)}，未含於上方淨銷售額。</p>`:''}<div class="drug-sales">代表藥品銷售 · ${esc(product.name)}<br><strong>${fmt(product.sales)}</strong> ${esc(c.currency)} 百萬 · ${esc(c.periodLabel)}<br>${esc(product.label||product.note||'公司報告的產品銷售額')}<br><small>是公司認列的銷售／聯盟營收，不是單藥淨利，也不必然是該藥全球市場總額。${product.label&&product.note?' '+esc(product.note):''}</small></div><p class="finance-foot">${c.boundaries.map(b=>esc(b.text)).join('<br>')}</p>${references([...new Set([c.revenue.source,c.netIncome.source,c.operatingIncome.source,c.rd.source,c.pharmaRevenue.source,product.source,...c.boundaries.flatMap(b=>b.sources)])])}${old.length?`<details><summary>歷史財務節點：不是完整逐年曲線</summary>${old.map(h=>`<p class="meta"><strong>${esc(h.yearLabel||h.year)} · ${esc(h.label)}</strong><br>營收 ${fmt(h.revenue)}；淨利 ${fmt(h.netIncome)}（${esc(h.currency)} 百萬）。<br>${esc(h.note)}<br>${sourceLink(h.source)}</p>`).join('')}</details>`:''}`;
}
function renderCases(){
 $('#case-grid').innerHTML=DATA.cases.map(c=>`<article class="case-card"><span class="chip">${esc(c.type)}</span><h3>${esc(c.name)}</h3><p class="case-desc">${esc(c.scale)}</p><p>${esc(c.intro)}</p><ol class="case-events">${c.events.map(e=>`<li><time>${esc(e.date)}</time>${esc(e.text)}</li>`).join('')}</ol><div class="status"><strong>截至 ${DATA.verified} 核對的狀態</strong>${esc(c.status)}</div><p class="case-lesson">${esc(c.lesson)}</p>${references(c.sources,'核對事件、程序與最新狀態')}</article>`).join('');
}
function renderQuiz(){
 $('#quiz').innerHTML=DATA.quiz.map((q,i)=>`<article class="quiz-item"><h3>${String(i+1).padStart(2,'0')} / ${esc(q.question)}</h3><div class="quiz-choices" role="group" aria-label="問題 ${i+1}">${q.choices.map((choice,j)=>`<button type="button" data-question="${i}" data-answer="${j}" aria-pressed="false"><span>${'ABC'[j]}.</span>${esc(choice)}</button>`).join('')}</div><p class="feedback" id="feedback-${i}" aria-live="polite" hidden></p><p class="print-only">答案：${'ABC'[q.answer]}。${esc(q.explanation)}</p></article>`).join('');
 document.querySelectorAll('.quiz-choices button').forEach(b=>b.addEventListener('click',()=>{const i=Number(b.dataset.question),j=Number(b.dataset.answer),q=DATA.quiz[i];b.closest('.quiz-choices').querySelectorAll('button').forEach(x=>{x.classList.remove('selected','correct');x.setAttribute('aria-pressed','false')});b.classList.add(j===q.answer?'correct':'selected');b.setAttribute('aria-pressed','true');const fb=$('#feedback-'+i);fb.hidden=false;fb.textContent=(j===q.answer?'答對了。':'再想一想。正確答案是 '+ 'ABC'[q.answer]+'。')+q.explanation;}));
}
function setupPrint(){
 const summary=document.createElement('section');summary.className='print-only section';summary.innerHTML=`<h2>財務快照摘要</h2><p>金額皆為各列幣別「百萬」，不同幣別不可直接相加或排名。除 Takeda 外皆為 2025 曆年；淨利按各公司明示歸屬口徑。</p><table class="print-table"><thead><tr><th>公司／期間</th><th>幣別</th><th>銷售／營收</th><th>淨利</th><th>研發費</th></tr></thead><tbody>${DATA.companies.map(c=>`<tr><td>${esc(c.name)}<br>${esc(c.periodLabel)}</td><td>${c.currency}</td><td>${fmt(c.revenue.value)}</td><td>${fmt(c.netIncome.value)}</td><td>${fmt(c.rd.value)}</td></tr>`).join('')}</tbody></table><h2>藥物身世速讀</h2><p>${esc(DATA.drugScope)}</p><table class="print-table"><thead><tr><th>品牌／成分</th><th>FDA 首核</th><th>來源接力</th></tr></thead><tbody>${DATA.drugs.map(d=>`<tr><td>${esc(d.brand)}<br>${esc(d.generic)}</td><td>${d.firstFDAApproval}</td><td>${esc(d.originator)}；${esc(d.developmentAndCommercialization)}</td></tr>`).join('')}</tbody></table><p>完整原始來源請開啟公開教材的「來源與方法」；各案例及數字附有文件連結。</p></section>`;
 $('#read-first').after(summary);
 document.querySelectorAll('.print').forEach(b=>b.addEventListener('click',()=>window.print()));
}
DATA.companies.forEach(c=>{for(const id of ['#company-filter','#finance-company']){const op=document.createElement('option');op.value=c.id;op.textContent=c.name;$(id).append(op)}});
$('#search').addEventListener('input',renderExplore);$('#company-filter').addEventListener('change',renderExplore);$('#era-filter').addEventListener('change',renderExplore);$('#finance-company').addEventListener('change',renderFinance);
$('#reset').addEventListener('click',()=>{$('#search').value='';$('#company-filter').value='all';$('#era-filter').value='all';renderExplore();$('#search').focus()});
document.querySelectorAll('.era-tabs button').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.era-tabs button').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b))});renderTimeline(b.dataset.era)}));
$('#source-list').innerHTML=Object.keys(DATA.sources).map(id=>`<li>${sourceLink(id)}</li>`).join('');
const drugScope=document.createElement('p');drugScope.className='scope';drugScope.textContent=DATA.drugScope+' 本頁 12 項品牌案例中，Ozempic 與 Wegovy 為同一活性成分 semaglutide，不是兩個不同分子發明。';$('.filter-bar').before(drugScope);
renderExplore();renderTimeline();renderFinance();renderCases();renderQuiz();setupPrint();
