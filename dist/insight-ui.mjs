import {itemMeta} from './workshop.mjs';
import {techniqueInsight} from './technique-combat.mjs';
import {passiveDefinitions,passiveValues,bonusText} from './passives.mjs';
import {combatStats,abilityCatalog,abilities} from './combat.mjs';
import {attackPower,attackHits,isAttack,shieldPower,recoveryPower} from './scaling.mjs';
import {elementDescriptions} from './combat.mjs';
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n=x=>Number(x.toFixed(2));
const pct=x=>n(x*100)+'%';
export function skillInsight(s,a){
 if(a.passive){const definition=passiveDefinitions.find(p=>p.id===a.id);return {value:definition.trigger||bonusText(passiveValues(definition,a.rank||0)),formula:definition.trigger?'조건 충족 시 발동 · 강화 단계 +'+(a.rank||0):'장착 중 상시 적용',notes:'강화 단계마다 효과가 증가합니다.'};}
 const outer=s.path==='outer',rank=a.rank||0,stats=combatStats(s);
 if(a.technique)return techniqueInsight(s,a,stats.attack);
 if(a.id==='purify')return {value:'정화 후 보호막 '+(Math.floor(s.control/2)+rank)+' + 제거 중첩 × 2',formula:'제어 ÷ 2 (버림) + 강화 단계 + 제거한 상태 중첩 × 2',notes:'자신의 모든 상태이상을 제거합니다.'};
 if(a.id==='stance')return {value:'다음 공격 위력 +'+n(2+s.insight*.5+rank),formula:'2 + 통찰 × 0.5 + 강화 단계',notes:'턴을 소모하지 않습니다. 기본 공격·공격 기술·준비 주문의 발동에 한 번 적용됩니다.'};
 if(a.id==='detonate')return {value:'위력 '+(stats.attack+4+s.control+rank*2)+' + 소모 중첩 × 3',formula:'전투 위력 + 4 + 제어 + 강화 단계 × 2 + 적 상태 중첩 × 3',notes:'적의 상태이상을 모두 소모합니다. 방어를 무시하며, 명중 보정 +15%p. 치명타는 위력 +2.'};
 if(a.id==='ascend')return {value:'숨 완전 회복 · 보호막 '+(4+(outer?s.control:s.skill)+rank),formula:'보호막 = 4 + '+(outer?'제어':'숙련')+' + 강화 단계',notes:outer?'속성 영역을 3회 유지하며 적의 행동마다 보호막 1 보충.':'축기를 최대 3까지 채웁니다.'};
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
 return `<details class="stat-guide" ${open?'open':''}><summary>스탯이 바꾸는 것</summary><div class="stat-guide-body"><div class="stat-guide-grid"><p><strong>제어 ${s.control}</strong><br>3마다 방어 +1.${s.path==='outer'?' 2마다 전투 위력 +1. 주문의 첫 위력에 1당 +1.':' 발경·합격 위력 상승. 고유 무공은 제어·숙련 중 큰 값을 사용.'}</p><p><strong>숙련 ${s.skill}</strong><br>1당 명중 +2.5%p.${s.path==='outer'?' 주문도 명중의 영향을 받습니다.':' 2마다 전투 위력 +1. 무기 기술·합격 위력도 상승.'}</p><p><strong>통찰 ${s.insight}</strong><br>2마다 속도 +1. 1당 명중 +2%p, 회피 +2.5%p, 치명타 확률 +1.5%p. ${s.path==='outer'?'일부 주문 위력도 상승.':'발경 위력도 상승.'}</p></div>${st?`<dl class="derived-guide"><div><dt>위력 ${st.attack}</dt><dd>무기·등급·장비·패시브·준비 효과와 스탯을 합친 공격의 바탕값.</dd></div><div><dt>방어 ${st.defense}</dt><dd>적 타격 피해를 줄입니다. 보호막과 별개이며 관통 공격에는 적용되지 않습니다.</dd></div><div><dt>속도 ${st.speed}</dt><dd>전투 시작 시 선공 판정. 적과 같으면 먼저 행동합니다.</dd></div><div><dt>명중 ${pct(st.accuracy)}</dt><dd>기본 명중 = 83% + 숙련 × 2.5%p + 통찰 × 2%p + 장비·패시브. 기본 상한 99%. 타격 시 기술 보정·상태이상·적 회피를 반영해 5~99%로 제한.</dd></div><div><dt>회피 ${pct(st.evasion)}</dt><dd>통찰 × 2.5%p + 장비 + 바람 12%p. 상한 50%.</dd></div><div><dt>치명타 ${pct(Math.min(1,.08+s.insight*.015))}</dt><dd>8% + 통찰 × 1.5%p, 상한 100%. 치명타는 위력 +2.</dd></div></dl>${basicInfo(s)}`:''}<p class="muted">성장 설명은 상태이상 없는 기준값입니다. 전투 중 능력치 표에는 약화·부식 등의 현재 효과가 반영됩니다. 기술 위력은 방어·보호막·치명타 적용 전 수치이며, 실제 타격 때 반올림합니다.</p></div></details>`;
}
export function growthPreview(s,key){
 const before=combatStats(s),after=combatStats({...s,[key]:s[key]+1}),labels={attack:'위력',defense:'방어',speed:'속도',accuracy:'명중',evasion:'회피'};
 const parts=Object.keys(labels).filter(k=>Math.abs(after[k]-before[k])>.00001).map(k=>labels[k]+' '+(k==='accuracy'||k==='evasion'?pct(before[k])+' → '+pct(after[k]):before[k]+' → '+after[k]));
 if(key==='insight'&&.08+s.insight*.015<1)parts.push('치명타 '+pct(Math.min(1,.08+s.insight*.015))+' → '+pct(Math.min(1,.08+(s.insight+1)*.015)));
 for(const a of abilities(s).filter(a=>a.technique?!!a.technique.power:isAttack(a.id))){const x=attackPower(s,a,before.attack),y=attackPower({...s,[key]:s[key]+1},a,after.attack);if(x!==y)parts.push(a.name+' 첫 위력 '+n(x)+' → '+n(y));}
 return parts.join(' · ')||'이번 1포인트는 다음 상승 구간을 위한 누적입니다.';
}
export function growthPanel(s,data){
 if(s.journey.points<1)return '<p class="muted">사용할 성장점이 없습니다.</p>'+data.choices.map(c=>`<button class="choice" data-choice="${c.id}">${esc(c.title)}</button>`).join('');
 const labels={stat:'능력치 상승',skill:'새 기술',upgrade:'기술 강화',item:'아이템 획득',passive:'새 패시브','passive-upgrade':'패시브 강화'};
 const card=(c,index)=>{
  let body='';
  if(c.rewardType==='stat')body=`<p class="growth-preview">${esc(growthPreview(s,c.stat))}</p>`;
  else if(c.rewardType==='item')body=`<p class="item-meta grade-${c.item.grade}">${esc(itemMeta(c.item))}</p><p class="reward-item-description">${esc(c.item.description)}</p><p class="muted">${c.item.type==='equipment'?'장비 탭에서 착용':'장비 탭에서 사용'}</p>`;
  else if(c.ability){body=`<p class="reward-value">${esc(skillInsight(s,c.ability).value)}</p><details class="skill-math reward-math"><summary>수치 상세</summary>${skillInfo(s,c.ability)}</details>`;if(c.rewardType==='upgrade'||c.rewardType==='passive-upgrade')body+=`<p class="rank-preview">강화 후 · ${esc(skillInsight(s,{...c.ability,rank:(c.ability.rank||0)+1}).value)}</p>`;}
  return `<article class="growth-card reward-${c.rewardType}"><p class="reward-tag"><span>0${index+1}</span> ${labels[c.rewardType]}</p><h3>${esc(c.title)}</h3>${c.rewardType==='item'?'':`<p class="muted">${esc(c.hint||'')}</p>`}${body}<button class="primary" data-choice="${c.id}" aria-label="${esc(c.title)} 선택 · 성장점 1 사용">이 보상 선택</button></article>`;
 };
 return `<section class="growth-options draft-options" aria-label="무작위 성장 보상 세 가지"><div class="growth-instruction"><span>세 보상 중 <b>하나</b>를 선택하세요</span><span>남은 성장점 <strong>${s.journey.points}</strong></span></div><div class="draft-grid">${data.choices.map(card).join('')}</div><p class="draft-note">선택한 보상만 얻습니다. 성장점이 남으면 새로운 세 보상이 제시됩니다.</p></section>`;
}
