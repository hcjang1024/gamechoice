export const statusRules={
 chill:{name:'냉기',element:'물',duration:2,description:'공격 위력 1 감소'},
 burn:{name:'화상',element:'불',duration:2,description:'행동 시작마다 보호막을 무시하고 체력 1 감소'},
 corrosion:{name:'부식',element:'흙',duration:3,description:'방어 1 감소, 최대 2중첩 · 행동 시작 시 보호막 1 소실'},
 unsteady:{name:'흔들림',element:'바람',duration:2,description:'명중률 15% 감소'},
 poison:{name:'중독',element:'나무',duration:3,description:'회복량 절반 · 숨 회복량과 공격 위력 1 감소'},
 bleed:{name:'출혈',element:'쇠',duration:3,description:'공격 행동을 할 때 체력 1 소모 · 방어와 회복에는 피해 없음'},
 shock:{name:'감전',element:'번개',duration:1,description:'다음 행동에서 기술과 강한 공격 사용 불가 · 기본 행동은 가능'}
};
export const elementStatus=Object.fromEntries(Object.entries(statusRules).map(([id,r])=>[r.element,id]));
export function ensureStatuses(b){
 if(b.statuses)return;
 b.statuses={player:{},enemy:{}};
 if(b.enemy.burn>0)b.statuses.enemy.burn={turns:b.enemy.burn,stacks:1};
 b.enemy.burn=0;
}
export const statusFor=(s,side,id)=>s.battle?.statuses?.[side]?.[id]?.turns>0?s.battle.statuses[side][id]:null;
export function applyStatus(s,side,id){
 ensureStatuses(s.battle);const r=statusRules[id];if(!r)throw Error('알 수 없는 상태이상');
 const current=statusFor(s,side,id),stacks=id==='corrosion'?Math.min(2,(current?.stacks||0)+1):1;
 s.battle.statuses[side][id]={turns:Math.max(current?.turns||0,r.duration),stacks};
 return r;
}
export function activeStatuses(s,side){return Object.entries(s.battle?.statuses?.[side]||{}).filter(([,v])=>v.turns>0).map(([id,v])=>({id,...statusRules[id],...v}));}
export function statusModifiers(s,side){return {attack:(statusFor(s,side,'chill')?1:0)+(statusFor(s,side,'poison')?1:0),defense:statusFor(s,side,'corrosion')?.stacks||0,accuracy:statusFor(s,side,'unsteady')?.15:0,healing:statusFor(s,side,'poison')?.5:1,recovery:statusFor(s,side,'poison')?1:0,skillLocked:!!statusFor(s,side,'shock')};}
export function decayStatuses(s,side){for(const [id,v] of Object.entries(s.battle.statuses[side])){v.turns--;if(v.turns<=0)delete s.battle.statuses[side][id];}}
