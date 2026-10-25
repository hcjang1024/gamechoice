export const ACTIVE_LIMIT=4;
export const PASSIVE_LIMIT=3;
export const passiveDefinitions=[
 {id:'passive-vitality',name:'단단한 체질',price:8,base:{hp:3},step:{hp:1}},
 {id:'passive-breath',name:'깊은 호흡',price:8,base:{energy:2},step:{energy:1}},
 {id:'passive-force',name:'힘의 단련',price:10,base:{attack:1},step:{attack:1}},
 {id:'passive-resolve',name:'흔들림 없는 자세',price:10,base:{defense:1},step:{defense:1}},
 {id:'passive-precision',name:'정밀한 감각',price:8,base:{accuracy:.04},step:{accuracy:.02}},
 {id:'passive-agility',name:'가벼운 발걸음',price:8,base:{speed:1,evasion:.02},step:{speed:1,evasion:.01}},
 {id:'passive-first-ward',name:'첫 숨의 보호',price:10,base:{},step:{},trigger:'전투 시작 시 보호막 3. 강화마다 +1.'},
 {id:'passive-circulation',name:'삼박 순환',price:10,base:{},step:{},trigger:'내 행동을 3번 마칠 때마다 숨 1 회복. 강화마다 +1.'},
 {id:'passive-composure',name:'고요한 재생',price:12,base:{},step:{},trigger:'기본 방어를 선택하면 체력 1 회복. 강화마다 +1. 중독의 영향을 받습니다.'}
];
export const isPassive=id=>passiveDefinitions.some(a=>a.id===id);
const labels={hp:'최대 체력',energy:'최대 숨',attack:'위력',defense:'방어',accuracy:'명중',speed:'속도',evasion:'회피'};
export function passiveValues(a,rank=0){return Object.fromEntries(Object.entries(a.base).map(([key,value])=>[key,Number((value+(a.step[key]||0)*rank).toFixed(4))]));}
export const bonusText=values=>Object.entries(values).map(([key,value])=>labels[key]+' +'+(key==='accuracy'||key==='evasion'?Number((value*100).toFixed(2))+'%p':value)).join(' · ');
export function passiveCatalog(s){return passiveDefinitions.map(a=>{const rank=s.passiveRanks?.[a.id]||0,bonus=passiveValues(a,rank);return {...a,rank,passive:true,cost:0,kind:'패시브',name:a.name+(rank?' +'+rank:''),description:a.trigger||bonusText(bonus),bonus,requirement:'기초 수련',stat:null,min:0};});}
export const learnedPassives=s=>passiveCatalog(s).filter(a=>s.passiveSkills?.includes(a.id));
export function ensurePassives(s){
 s.passiveSkills=[...new Set((s.passiveSkills||[]).filter(isPassive))];s.passiveRanks??={};
 for(const id of s.passiveSkills)s.passiveRanks[id]=Math.max(0,Math.min(3,Math.floor(Number(s.passiveRanks[id])||0)));
 s.passiveLoadout=[...new Set((s.passiveLoadout||[]).filter(id=>s.passiveSkills.includes(id)))].slice(0,PASSIVE_LIMIT);
 return s;
}
export function grantPassive(s,id){if(!isPassive(id))throw Error('알 수 없는 패시브');ensurePassives(s);if(!s.passiveSkills.includes(id))s.passiveSkills.push(id);s.passiveRanks[id]??=0;if(s.passiveLoadout.length<PASSIVE_LIMIT&&!s.passiveLoadout.includes(id))s.passiveLoadout.push(id);}
export function passiveBonus(s){
 const total={hp:0,energy:0,attack:0,defense:0,accuracy:0,speed:0,evasion:0};
 for(const id of [...new Set(s.passiveLoadout||[])].slice(0,PASSIVE_LIMIT)){
  if(!s.passiveSkills?.includes(id))continue;const a=passiveDefinitions.find(a=>a.id===id);if(!a)continue;
  for(const [key,value]of Object.entries(passiveValues(a,Math.max(0,Math.min(3,s.passiveRanks?.[id]||0)))))total[key]+=value;
 }
 return total;
}

