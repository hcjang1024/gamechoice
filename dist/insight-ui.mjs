import {combatStats,abilityCatalog,abilities} from './combat.mjs';
import {attackPower,attackHits,isAttack,shieldPower,recoveryPower} from './scaling.mjs';
import {elementDescriptions} from './combat.mjs';
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=x=>Number(x.toFixed(2));
const pct=x=>n(x*100)+'%';
export function skillInsight(s,a){
 const outer=s.path==='outer',rank=a.rank||0,stats=combatStats(s);
 if(isAttack(a.id)){
  let formula;
  if(outer)formula=a.id==='signature'?'위력 + 5 + 제어':a.id==='tempest'?'위력 + 3 + 제어':'위력 + 4 + 제어 + 통찰 × 0.5';
  else formula=a.id==='signature'?'위력 + 4 + 제어·숙련 중 큰 값':['infused','tempest'].includes(a.id)?'위력 + 3 + 제어 + 숙련 × 0.5':a.id==='element'?'위력 + 2 + 제어 + 통찰 × 0.5':'위력 + 2 + 숙련 × 0.5';
  formula+=' + 강화 단계 × 1.5'+(!outer&&s.element==='번개'?' + 번개 1':'');
  const power=attackPower(s,a,stats.attack),hits=attackHits(s,a);
  let value='첫 타격 위력 '+n(power);
  if(!outer)value+=' → 축기 3일 때 '+n(attackPower(s,a,stats.attack,3));
  if(hits>1)value+=outer?' · '+hits+'발 (추가 투사체 위력 '+n(attackPower(s,a,stats.attack,0,1))+')':' · '+hits+'회 타격 (추가 타격은 첫 실제 피해의 절반)';
  const accuracyBonus=outer?(s.weapon==='활'?.16:.05):a.id==='signature'&&s.flags.includes('art-insight')?.15:a.id!=='element'&&s.weapon==='활'?.12:0;
  const pierce=outer?['infused','signature'].includes(a.id)||['검','창'].includes(s.weapon)||s.element==='쇠':(a.id!=='element'&&s.weapon==='도')||s.element==='쇠';
  return {value,formula:formula+(!outer?' + 축기 × 2':''),notes:'숙련·통찰 → 명중, 통찰 → 치명타. 기술 명중 보정 +'+n(accuracyBonus*100)+'%p.'+(pierce?' 적 방어 무시.':' 적 방어만큼 피해 감소.')+' '+(elementDescriptions[s.element]||'')};
 }
 if(['counter','flow-counter','guard','aegis'].includes(a.id)){
  let value='보호막 '+shieldPower(s,a);
  if(!outer)value+=' → 축기 3일 때 '+shieldPower(s,a,3);
  const counter=['counter','flow-counter'].includes(a.id);
  let notes=outer&&counter?'교란 '+((a.id==='flow-counter'?2:1)+Math.floor(rank/2))+'회.':!outer&&counter?'반격 위력 = 전투 위력 + 1 + 방출한 축기 · 명중 +12%p.':outer&&a.id==='aegis'?'3회 동안 적 행동마다 보호막 1 보충.':'';
  return {value,formula:'기본 보호막 + 강화 단계'+(!outer?' + 방출한 축기':''),notes:'보호막은 제어·숙련·통찰에 직접 비례하지 않습니다. '+notes};
 }
 if(a.id==='focus')return {value:'숨 회복 '+recoveryPower(s,a)+(!outer?' · 축기 +2':''),formula:'숨 3 + 강화 단계',notes:'세 스탯에 직접 비례하지 않습니다. 중독 중에는 숨 회복량 −1.'};
 if(a.id==='mend')return {value:outer?'행동 시작마다 체력 '+recoveryPower(s,a)+' × 3회':'즉시 체력 '+recoveryPower(s,a),formula:'회복량 '+(outer?'2':'4')+' + 강화 단계',notes:'세 스탯에 직접 비례하지 않습니다. 중독 중에는 체력 회복량 절반(소수점 버림).'};
 return {value:'',formula:'',notes:a.description};
}
export function skillInfo(s,a,details=true){
 if(!s.weapon)return '';
 const info=skillInsight(s,a);
 return `<span class="skill-scaling"><b>${esc(info.value)}</b><span class="scaling-formula">${esc(info.formula)}</span>${details?`<span class="scaling-note">${esc(info.notes)}</span>`:''}</span>`;
}
export function basicInfo(s){
 if(!s.weapon)return '';
 const st=combatStats(s);
 return `<div class="basic-explanation"><p><strong>기본 공격 · 위력 ${st.attack}</strong><br>${s.path==='outer'?'제어 2마다 위력 +1':'숙련 2마다 위력 +1'} · 숙련·통찰로 명중 상승 · 통찰로 치명타 상승${s.weapon==='활'?' · 활 명중 +7%p':''}</p><p><strong>기본 방어 · 보호막 2</strong><br>스탯에 직접 비례하지 않는 고정 보호막${s.path==='inner'?' · 축기 +1, 숨 +1':''}. 제어로 얻는 방어력은 받는 피해를 별도로 줄입니다.</p></div>`;
}
export function statGuide(s,open=false){
 const st=s.weapon?combatStats(s):null;
 return `<details class="stat-guide" ${open?'open':''}><summary>스탯이 바꾸는 것</summary><div class="stat-guide-body"><div class="stat-guide-grid"><p><strong>제어 ${s.control}</strong><br>3마다 방어 +1.${s.path==='outer'?' 2마다 전투 위력 +1. 주문의 첫 위력에 1당 +1.':' 발경·합격 위력 상승. 고유 무공은 제어·숙련 중 큰 값을 사용.'}</p><p><strong>숙련 ${s.skill}</strong><br>1당 명중 +2.5%p.${s.path==='outer'?' 주문도 명중의 영향을 받습니다.':' 2마다 전투 위력 +1. 무기 기술·합격 위력도 상승.'}</p><p><strong>통찰 ${s.insight}</strong><br>2마다 속도 +1. 1당 명중 +2%p, 회피 +2.5%p, 치명타 확률 +1.5%p. ${s.path==='outer'?'일부 주문 위력도 상승.':'발경 위력도 상승.'}</p></div>${st?`<dl class="derived-guide"><div><dt>위력 ${st.attack}</dt><dd>무기·등급·장비·준비 효과와 스탯을 합친 공격의 바탕값.</dd></div><div><dt>방어 ${st.defense}</dt><dd>적 타격 피해를 줄입니다. 보호막과 별개이며 관통 공격에는 적용되지 않습니다.</dd></div><div><dt>속도 ${st.speed}</dt><dd>전투 시작 시 선공 판정. 적과 같으면 먼저 행동합니다.</dd></div><div><dt>명중 ${pct(st.accuracy)}</dt><dd>기본 명중 = 83% + 숙련 × 2.5%p + 통찰 × 2%p + 장비. 기본 상한 99%. 타격 시 기술 보정·상태이상·적 회피를 반영해 5~99%로 제한.</dd></div><div><dt>회피 ${pct(st.evasion)}</dt><dd>통찰 × 2.5%p + 장비 + 바람 12%p. 상한 50%.</dd></div><div><dt>치명타 ${pct(Math.min(1,.08+s.insight*.015))}</dt><dd>8% + 통찰 × 1.5%p, 상한 100%. 치명타는 위력 +2.</dd></div></dl>${basicInfo(s)}`:''}<p class="muted">성장 설명은 상태이상 없는 기준값입니다. 전투 중 능력치 표에는 약화·부식 등의 현재 효과가 반영됩니다. 기술 위력은 방어·보호막·치명타 적용 전 수치이며, 실제 타격 때 반올림합니다.</p></div></details>`;
}
export function growthPreview(s,key){
 const before=combatStats(s),after=combatStats({...s,[key]:s[key]+1}),labels={attack:'위력',defense:'방어',speed:'속도',accuracy:'명중',evasion:'회피'};
 const parts=Object.keys(labels).filter(k=>Math.abs(after[k]-before[k])>.00001).map(k=>labels[k]+' '+(k==='accuracy'||k==='evasion'?pct(before[k])+' → '+pct(after[k]):before[k]+' → '+after[k]));
 if(key==='insight'&&.08+s.insight*.015<1)parts.push('치명타 '+pct(Math.min(1,.08+s.insight*.015))+' → '+pct(Math.min(1,.08+(s.insight+1)*.015)));
 for(const a of abilities(s).filter(a=>isAttack(a.id))){const x=attackPower(s,a,before.attack),y=attackPower({...s,[key]:s[key]+1},a,after.attack);if(x!==y)parts.push(a.name+' 첫 위력 '+n(x)+' → '+n(y));}
 return parts.join(' · ')||'이번 1포인트는 다음 상승 구간을 위한 누적입니다.';
}
export function growthPanel(s,data){
 const catalog=abilityCatalog(s),groups=[['능력치 올리기','grow-'],['새 기술 익히기','study-'],['배운 기술 강화','hone-']];
 const card=c=>{
  let body='';
  if(c.id.startsWith('grow-'))body=`<p class="growth-preview">${esc(growthPreview(s,c.id.slice(5)))}</p>`;
  else {const a=catalog.find(a=>a.id===c.id.replace(/^(study-|hone-)/,''));if(a){body=skillInfo(s,a);if(c.id.startsWith('hone-')&&!c.disabled)body+=`<p class="rank-preview">강화 후 · ${esc(skillInsight(s,{...a,rank:(a.rank||0)+1}).value)}</p>`;}}
  return `<article class="growth-card"><h3>${esc(c.title)}</h3><p class="muted">${esc(c.hint||'')}</p>${body}<button class="primary" data-choice="${c.id}" ${c.disabled?'disabled':''}>${c.disabled?'선택 불가':'성장점 1 사용'}</button></article>`;
 };
 return `<section class="growth-options" aria-label="모든 성장 선택지"><p class="growth-instruction">능력치·새 기술·기술 강화 중 골라 배분하세요. 남은 성장점 <strong>${s.journey.points}</strong></p><div class="growth-columns">${groups.map(([title,prefix])=>`<section class="growth-group"><h2>${title}</h2>${data.choices.filter(c=>c.id.startsWith(prefix)).map(card).join('')||'<p class="muted">지금 선택할 기술이 없습니다.</p>'}</section>`).join('')}</div>${data.choices.filter(c=>!groups.some(([,prefix])=>c.id.startsWith(prefix))).map(c=>`<button class="choice" data-choice="${c.id}" ${c.disabled?'disabled':''}>${esc(c.title)}</button>`).join('')}</section>`;
}

