import {passiveCatalog,learnedPassives,passiveDefinitions} from './passives.mjs';
import {advancedDefinition,advancedValue,abilityEvolutionOptions} from './advanced-powers.mjs';
export const ABILITY_LIMIT=3;
export const MAX_ABILITY_RANK=6;
export function coreAbility(s){
 if(!s.path)return null;
 const rank=Math.max(0,Math.min(MAX_ABILITY_RANK,s.innateRank||0)),inner=s.path==='inner';
 return {id:'core-breath',innate:true,rank,level:rank+1,name:inner?'축기':'외기 공명',kind:'고유 능력',minLevel:2,price:8,description:inner?'기본 동작과 일부 보조 스킬로 축기를 최대 3 쌓습니다. 축기 소모 스킬에 중첩당 타격 위력 +'+(2+rank*.5)+'~'+(3+rank*.5)+', 호신 전환 시 중첩당 보호막 +'+(2+rank)+'을 적용합니다.':'주문 준비 시 공명을 최대 3 쌓습니다. 공명 소모 스킬의 중첩당 추가 위력은 '+(3+rank)+'입니다. 공명은 방어·회복을 선택해도 유지됩니다.'};
}
export const powerCatalog=s=>passiveCatalog(s).map(a=>{const evolution=abilityEvolutionOptions(a.id).find(e=>e.id===s.powerEvolutions?.[a.id]);return {...a,name:evolution?.name||a.name,originalName:a.name,evolved:!!evolution,ability:true,level:a.rank+1,kind:'능력'};});
export const ownedPowers=s=>powerCatalog(s).filter(a=>s.passiveSkills?.includes(a.id));
export const activePowers=s=>ownedPowers(s).filter(a=>s.passiveLoadout?.includes(a.id)).slice(0,ABILITY_LIMIT);
export const hasPower=(s,id)=>!!s.passiveSkills?.includes(id)&&!!s.passiveLoadout?.includes(id)&&!s.powerEvolutions?.[id];
export function concentrationBonus(s){return hasPower(s,'ability-concentration')?s.battle?.abilityState?.concentration||0:0;}
export function powerDescription(s,a){
 const rank=a.rank||0;
 const evolved=abilityEvolutionOptions(a.id).find(e=>e.id===s.powerEvolutions?.[a.id]);if(evolved)return evolved.name+' · '+evolved.description;
 const advanced=advancedDefinition(a.id);if(advanced)return '능력 수치 '+advanced.table[Math.min(6,rank)]+' · '+profileDescription(advanced.profile)+' · Lv.7에서 진화';
 if(a.id==='passive-first-ward')return '전투 시작 시 보호막 '+(3+rank)+' 획득.';
 if(a.id==='passive-circulation')return '내 행동을 3번 마칠 때마다 숨 '+(1+rank)+' 회복. 중독 중에는 회복량 −1.';
 if(a.id==='passive-composure')return '기본 방어를 선택하면 체력 '+(1+rank)+' 회복. 중독의 영향을 받습니다.';
 if(a.id==='ability-concentration')return '공격하지 않은 행동을 마칠 때마다 치명타 확률 +'+(2+rank)+'%p 누적 · 최대 '+(12+rank*3)+'%p. 전투 종료 시 초기화.';
 if(a.id==='ability-absorption')return '내 턴에 직접 타격 피해를 주면 체력 '+(1+rank)+' 회복 · 한 턴에 한 번. 연타 수와 무관하며 중독의 영향을 받습니다.';
 return a.description;
}
function profileDescription(p){return p.attribute?({strength:'근력',agility:'민첩',intelligence:'지능',charisma:'매력'}[p.attribute])+' 전투 중 증가':p.haste?'일정 행동마다 가속 획득':p.poison?'3턴마다 중독 부여':p.startStatus?'전투 시작 시 상태이상 부여':p.maxHp?'전투 시작 시 최대 체력 증가·회복':p.opening?'초반 우선 행동':p.openingGuard?'초반 보호막':p.hitBleed?'명중마다 출혈 부여':p.critical?'전투 중 치명타 확률 증가':p.criticalDamage?'치명타 피해 증가':p.armor?'받는 타격 피해 감소':p.evasion?'전투 중 회피율 증가':p.hitImpact?'공격으로 충격 누적·경직':p.weaken?'일정 행동마다 적 위력 감소':'자동 발동';}
export function pendingEvolution(s){const candidates=[...(s.path&&s.innateRank>=6?['core-breath']:[]),...(s.passiveSkills||[]).filter(id=>(s.passiveRanks?.[id]||0)>=6)];return candidates.find(id=>!s.powerEvolutions?.[id])||null;}
export function enforceEvolution(s){const id=pendingEvolution(s);if(id&&s.scene!=='ability-evolution'){s.evolutionReturn=s.scene;s.scene='ability-evolution';s.evolvingPower=id;}return s;}
export function evolutionScene(s){if(s.scene!=='ability-evolution')return null;const id=s.evolvingPower||pendingEvolution(s),name=id==='core-breath'?coreAbility(s).name:passiveDefinitions.find(a=>a.id===id)?.name;return {chapter:s.journey?5:2,title:name+' · 능력 진화',text:['능력 Lv.7에 도달했습니다. 세 진화 중 하나를 선택하세요. 진화 효과는 자동으로 작동하며 스킬 장착 칸을 사용하지 않습니다.'],choices:abilityEvolutionOptions(id).map(e=>({id:'evolve-'+e.id,title:e.name,hint:e.description}))};}
export function evolvePower(s,choice){const id=s.evolvingPower||pendingEvolution(s),e=abilityEvolutionOptions(id).find(e=>'evolve-'+e.id===choice);if(!e||!id||!pendingEvolution(s))throw Error('지금 선택할 수 없는 능력 진화입니다.');s.powerEvolutions??={};s.powerEvolutions[id]=e.id;s.scene=s.evolutionReturn||'hub';delete s.evolutionReturn;delete s.evolvingPower;s.last=e.name+' 능력으로 진화했습니다.';return s;}
