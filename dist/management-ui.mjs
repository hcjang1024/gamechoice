import {abilities,combatStats} from './combat.mjs';
import {learnedPassives,ACTIVE_LIMIT,PASSIVE_LIMIT} from './passives.mjs';
import {items,slots,itemCount,canUseItem} from './workshop.mjs';
import {buildLocked} from './management.mjs';
import {skillInfo,statGuide} from './insight-ui.mjs';
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button=(action,id,label,disabled)=>`<button class="quiet manage-action" data-manage="${action}" data-id="${id}" ${disabled?'disabled':''}>${label}</button>`;
export function resourceBar(s){
 const j=s.journey;if(!j)return '';
 return `<div class="resource-bar" aria-label="보유 재화"><span>엽전 <b>${j.gold}</b></span><span>강화석 <b>${j.ore}</b></span><span>성장점 <b>${j.points}</b></span><span>약초 <b>${j.herbs}</b></span></div>`;
}
export function buildTabs(selected){
 return `<nav class="build-tabs" role="tablist" aria-label="게임 메뉴">${[['story','여정'],['skills','기술'],['equipment','장비'],['record','기록']].map(([id,name])=>`<button id="tab-${id}" role="tab" aria-selected="${selected===id}" aria-controls="game-panel" tabindex="${selected===id?0:-1}" data-tab="${id}">${name}</button>`).join('')}</nav>`;
}
function lockNote(s){return buildLocked(s)?`<p class="build-lock">${s.journey?.points?'성장 보상 선택 후 변경할 수 있습니다.':'전투 종료 후 변경할 수 있습니다.'}</p>`:'';}
function skillGroup(s,passive){
 const known=passive?learnedPassives(s):abilities(s),ids=passive?s.passiveLoadout||[]:s.loadout||[],limit=passive?PASSIVE_LIMIT:ACTIVE_LIMIT,title=passive?'패시브':'액티브',locked=buildLocked(s);
 return `<section class="skill-group"><div class="section-title"><h2>${title}</h2><span>${ids.length} / ${limit}</span></div><div class="skill-slots">${Array.from({length:limit},(_,i)=>`<span class="${ids[i]?'filled':''}">${esc(known.find(a=>a.id===ids[i])?.name||'빈 슬롯')}</span>`).join('')}</div><div class="skill-card-grid">${known.map(a=>`<article class="build-skill ${ids.includes(a.id)?'equipped':''}"><div><small>${passive?'상시 효과':'숨 '+a.cost+' · '+a.kind}</small><h3>${esc(a.name)}</h3></div><p>${esc(a.description)}</p><div class="skill-card-actions">${button(passive?'passive':'active',a.id,ids.includes(a.id)?'장착 해제':'장착',locked)}<details class="skill-math"><summary>수치 상세</summary>${skillInfo(s,a)}</details></div></article>`).join('')||`<p class="empty-note">아직 배운 ${title} 기술이 없습니다.</p>`}</div></section>`;
}
export function skillsPanel(s){return `<section class="build-panel"><h1 id="scene-title" tabindex="-1">기술</h1>${lockNote(s)}<p id="build-note" class="build-note" role="status"></p>${skillGroup(s,false)}${skillGroup(s,true)}${statGuide(s)}</section>`;}
export function equipmentPanel(s){
 const j=s.journey,locked=buildLocked(s),equipped=j?.equipped||{},owned=items.filter(i=>j&&itemCount(j,i.id)>0),gear=owned.filter(i=>i.type==='equipment'),consumables=owned.filter(i=>i.type==='consumable');
 return `<section class="build-panel"><h1 id="scene-title" tabindex="-1">장비 · 소지품</h1>${lockNote(s)}<p id="build-note" class="build-note" role="status"></p><h2>착용 중</h2><div class="equipment-slot-grid">${Object.entries(slots).map(([id,name])=>{const item=items.find(i=>i.id===equipped[id]);return `<article class="equipment-slot"><small>${name}</small><strong>${esc(item?.name||'착용 없음')}</strong><span>${esc(item?.description||'—')}</span>${item?button('equip',item.id,'해제',locked):''}</article>`;}).join('')}</div>${j?`<p class="gear-levels">무기 보강 +${j.gear} <span>방호구 보강 +${j.armor}</span></p>`:''}<h2>보유 장비</h2><div class="owned-grid">${gear.map(i=>`<article class="owned-item"><div><small>${slots[i.slot]}</small><h3>${i.name}</h3><p>${i.description}</p></div>${button('equip',i.id,equipped[i.slot]===i.id?'착용 해제':'착용',locked)}</article>`).join('')||'<p class="empty-note">보유 장비가 없습니다.</p>'}</div><h2>소모품</h2><div class="owned-grid">${consumables.map(i=>`<article class="owned-item"><div><h3>${i.name} <b>×${itemCount(j,i.id)}</b></h3><p>${i.description}</p></div>${button('use',i.id,'사용',locked||!canUseItem(s,i))}</article>`).join('')||'<p class="empty-note">보유 소모품이 없습니다.</p>'}</div></section>`;
}

