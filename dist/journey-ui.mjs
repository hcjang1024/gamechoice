import {maxHp} from './combat.mjs';
import {chapterProgress,routeCards} from './chapter-ui.mjs';
export function journeyPanel(s){const j=s.journey;if(!j)return '';
 let content=routeCards(s);
 if(s.scene==='reward'){const r=j.reward;content=`<section class="reward-card"><p class="eyebrow">${r.outcome==='victory'?'ENCOUNTER REWARDS':'LOST OPPORTUNITY'}</p><h3>${r.outcome==='victory'?'싸움에서 얻은 보상':'이번 전투의 보상은 없다'}</h3><div class="reward-items"><span>경험 <b>+${r.xp}</b></span><span>엽전 <b>+${r.gold}</b></span><span>강화석 <b>+${r.ore}</b></span>${r.first?'<span>약초 <b>+1</b></span>':''}</div>${r.levels?`<p class="level-up">실전 등급 ${j.level} · 성장점 +${r.levels} · 최대 체력 ${maxHp(s)}</p>`:''}</section>`;}
 if(s.scene==='forge')content=`<div class="gear-summary"><div><small>${s.weapon==='맨손'?'권갑':s.weapon} / 매개 보강</small><strong>+${j.gear}</strong><p>추가 전투 위력 ${j.gear}</p></div><div><small>방호구 보강</small><strong>+${j.armor}</strong><p>추가 방어 ${j.armor}</p></div></div>`;
 if(s.scene==='growth')content=`<div class="growth-summary"><p class="eyebrow">지나온 선택으로 얻은 힘</p><p>획득한 성장점만 배분합니다. 새 점수를 얻거나 휴식하려면 남은 여정에서 기회를 골라야 합니다.</p><span>남은 성장점 <b>${j.points}</b></span></div>`;
 return (['hub','map'].includes(s.scene)?`<div class="journey-summary"><span>엽전 <b>${j.gold}</b></span><span>성장점 <b>${j.points}</b></span></div>`+chapterProgress(s):'')+content;
}
