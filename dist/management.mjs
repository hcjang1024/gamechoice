import {abilities,maxHp,maxEnergy} from './combat.mjs';
import {categoryOf,normalizeLoadout} from './skillbook.mjs';
import {ACTIVE_LIMIT,PASSIVE_LIMIT,ensurePassives,learnedPassives} from './passives.mjs';
import {itemFor,itemCount,canUseItem} from './workshop.mjs';
import {marketChoose} from './market.mjs';
export const buildLocked=s=>!!s.journey?.points||s.scene==='battle';
export function manageBuild(state,action,id){
 if(buildLocked(state))throw Error(state.journey?.points?'성장 보상을 먼저 선택하세요.':'전투 중에는 변경할 수 없습니다.');
 const s=structuredClone(state);ensurePassives(s);
 if(action==='active'||action==='passive'){
  const passive=action==='passive',known=passive?learnedPassives(s):abilities(s),key=passive?'passiveLoadout':'loadout',limit=passive?PASSIVE_LIMIT:ACTIVE_LIMIT;
  if(!known.some(a=>a.id===id))throw Error('아직 배우지 않은 기술입니다.');
  const ids=[...new Set(s[key]||[])].filter(id=>known.some(a=>a.id===id)).slice(0,limit);
  if(!passive){normalizeLoadout(s,known.map(a=>a.id));s.loadout=s.loadout.includes(id)?s.loadout.filter(k=>k!==id):[...s.loadout.filter(k=>categoryOf(k)!==categoryOf(id)),id];return s;}
  if(ids.includes(id))s[key]=ids.filter(k=>k!==id);
  else {if(ids.length>=limit)throw Error((passive?'패시브':'액티브')+'는 최대 '+limit+'개입니다. 먼저 하나를 해제하세요.');s[key]=[...ids,id];}
  s.hp=Math.min(s.hp,maxHp(s));s.energy=Math.min(s.energy,maxEnergy(s));return s;
 }
 if(!s.journey)throw Error('소지품이 없습니다.');
 const item=itemFor(id);if(!item||itemCount(s.journey,id)<1)throw Error('보유하지 않은 아이템입니다.');
 if(action==='equip'&&item.type==='equipment')return marketChoose(s,'equip-item-'+id);
 if(action==='use'&&item.type==='consumable'&&canUseItem(s,item))return marketChoose(s,'use-item-'+id);
 throw Error('지금 사용할 수 없습니다.');
}

