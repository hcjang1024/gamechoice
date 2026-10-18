import {passiveBonus} from './passives.mjs';
import {adaptArt} from './paths.mjs';
const baseItems=[
 {id:'herb',name:'약초 꾸러미',type:'consumable',price:3,icon:'葉',description:'체력 6 회복',heal:6},
 {id:'tonic',name:'응급 회복탕',type:'consumable',price:6,icon:'湯',description:'체력 10 회복',heal:10},
 {id:'breath',name:'청숨환',type:'consumable',price:4,icon:'息',description:'숨 4 회복',energy:4},
 {id:'oil',name:'결을 잇는 도구유',type:'consumable',price:5,icon:'刃',description:'다음 전투 위력 +2',buff:'attack',amount:2},
 {id:'ward',name:'방호 가루',type:'consumable',price:4,icon:'護',description:'다음 전투 시작 보호막 +4',buff:'shield',amount:4},
 {id:'incense',name:'속행향',type:'consumable',price:4,icon:'風',description:'다음 전투 속도 +2',buff:'speed',amount:2},
 {id:'bracer',name:'철편 호완',type:'equipment',slot:'hands',price:10,icon:'拳',description:'위력 +1 · 방어 +1',bonus:{attack:1,defense:1}},
 {id:'gloves',name:'정밀 장갑',type:'equipment',slot:'hands',price:10,icon:'手',description:'명중률 +8%',bonus:{accuracy:.08}},
 {id:'rune',name:'결각인 띠',type:'equipment',slot:'hands',price:18,icon:'結',description:'위력 +2',bonus:{attack:2}},
 {id:'boots',name:'솔바람신',type:'equipment',slot:'feet',price:12,icon:'步',description:'속도 +2 · 회피율 +4%',bonus:{speed:2,evasion:.04}},
 {id:'robe',name:'겹안감 수련복',type:'equipment',slot:'body',price:14,icon:'衣',description:'최대 체력 +2 · 방어 +1',bonus:{hp:2,defense:1}},
 {id:'charm',name:'숨결 부적',type:'equipment',slot:'charm',price:12,icon:'符',description:'최대 숨 +2',bonus:{energy:2}},
 {id:'mirror',name:'청동 거울패',type:'equipment',slot:'charm',price:14,icon:'鏡',description:'방어 +1 · 회피율 +4%',bonus:{defense:1,evasion:.04}}
];
export const grades={common:{name:'일반',minLevel:1},refined:{name:'정제',minLevel:2},rare:{name:'희귀',minLevel:3}};
const bonusLabels={attack:'위력',defense:'방어',speed:'속도',accuracy:'명중',evasion:'회피',hp:'최대 체력',energy:'최대 숨'};
const bonusDescription=bonus=>Object.entries(bonus).map(([k,v])=>bonusLabels[k]+' +'+(['accuracy','evasion'].includes(k)?Number((v*100).toFixed(2))+'%p':v)).join(' · ');
const rareExtras={bracer:{accuracy:.04},gloves:{attack:1},rune:{energy:1},boots:{defense:1},robe:{evasion:.04},charm:{defense:1},mirror:{hp:2}};
export const items=Object.entries(grades).flatMap(([grade,info],tier)=>baseItems.map(base=>{
 const item={...base,id:base.id+(tier?'-'+grade:''),baseId:base.id,grade,minLevel:info.minLevel,name:(tier?info.name+' ':'')+base.name,price:Math.ceil(base.price*(1+tier*.8))};
 if(base.bonus){item.bonus=Object.fromEntries(Object.entries(base.bonus).map(([k,v])=>[k,Number((v+tier*(['accuracy','evasion'].includes(k)?.02:k==='hp'?2:1)).toFixed(4))]));if(tier===2)for(const[k,v]of Object.entries(rareExtras[base.id]||{}))item.bonus[k]=Number(((item.bonus[k]||0)+v).toFixed(4));item.description=bonusDescription(item.bonus);}
 else if(base.heal){item.heal=base.heal+tier*3;item.description='체력 '+item.heal+' 회복';}
 else if(base.energy){item.energy=base.energy+tier;item.description='숨 '+item.energy+' 회복';}
 else if(base.buff){item.amount=base.amount+tier*(base.buff==='shield'?2:1);item.description='다음 전투 '+({attack:'위력',shield:'시작 보호막',speed:'속도'}[base.buff])+' +'+item.amount;}
 return item;
}));
export const shopItems=s=>{const tier=Math.min(3,Math.max(1,s.journey?.level||1));return items.filter(i=>i.grade==='common'||tier>1&&i.minLevel===tier);};
export const itemMeta=i=>grades[i.grade||'common'].name+' · '+(i.type==='equipment'?slots[i.slot]:'소모품');
export const slots={hands:'손 / 매개',feet:'발',body:'몸',charm:'장신구'};
export const itemFor=id=>items.find(x=>x.id===id);
export const itemCount=(j,id)=>id==='herb'?j.herbs:(j.inventory?.[id]||0);
export function equipmentBonus(s){const bonus={attack:0,defense:0,speed:0,accuracy:0,evasion:0,hp:0,energy:0};for(const id of Object.values(s.journey?.equipped||{})){const item=itemFor(id);if(item?.type==='equipment')for(const [k,v]of Object.entries(item.bonus))bonus[k]+=v;}return bonus;}
export function ensureWorkshop(j){if(!j)return;j.inventory??={};j.equipped??={};j.learned??=[];j.prepBuffs??={};}
export const manuals=[
 {id:'guard',name:'기초 수비',price:6,requirement:'제어 1',stat:'control',min:1,cost:1,kind:'방어 기술',description:'보호막 3 생성 · 적의 강한 공격 직전에 자동 사용'},
 {id:'focus',name:'집중 호흡',price:6,requirement:'실전 등급 1',stat:null,min:0,cost:0,kind:'호흡 기술',description:'숨 3 회복 · 숨이 모자랄 때 자동 사용'},
 {id:'chain',name:'연속격',price:10,requirement:'숙련 2',stat:'skill',min:2,cost:2,kind:'연타 기술',description:'두 번 연속 타격 · 두 번째 타격은 절반 위력'},
 {id:'mend',name:'응급 조율',price:10,requirement:'제어 2',stat:'control',min:2,cost:2,kind:'회복 기술',description:'체력 4 회복 · 체력이 절반 이하일 때 자동 사용'}
];
export const recipes=[
 {id:'infused',name:'결을 실은 일격',ingredients:['weapon','element'],labels:['무기 기술','결의 기술'],gold:8,ore:1,cost:3,kind:'조합 공격',description:'무기와 결을 함께 펼치는 강한 타격 · 속성 효과 발동'},
 {id:'flow-counter',name:'흐름 되돌리기',ingredients:['element','counter'],labels:['결의 기술','간파 반격'],gold:8,ore:1,cost:2,kind:'조합 반격',description:'보호막 3 · 반격에 자신의 결을 실어 되돌린다'},
 {id:'aegis',name:'결의 수호',ingredients:['guard','element'],labels:['기초 수비','결의 기술'],gold:8,ore:1,cost:2,kind:'조합 방어',description:'보호막 5 · 적의 강한 공격에 앞서 자동 사용'},
 {id:'tempest',name:'연쇄 파동',ingredients:['chain','infused'],labels:['연속격','결을 실은 일격'],gold:16,ore:2,cost:4,kind:'상위 조합',description:'세 번 이어지는 결의 타격 · 세 번째는 절반 위력'}
];
export const manualsFor=s=>manuals.map(a=>adaptArt(s,a));
export const recipesFor=s=>recipes.map(a=>adaptArt(s,a));
export function extraArts(s){return [...manuals,...recipes].filter(a=>s.journey?.learned?.includes(a.id)).map(a=>({...a,name:recipes.includes(a)?`${s.element}결 · ${a.name}`:a.name}));}
export function canUseItem(s,item){if(!s.journey||!item||item.type!=='consumable'||itemCount(s.journey,item.id)<1)return false;if(item.heal)return s.hp<10+(s.journey.level-1)*2+equipmentBonus(s).hp+passiveBonus(s).hp;if(item.energy)return s.energy<6+Math.floor((s.journey.level-1)/2)+equipmentBonus(s).energy+passiveBonus(s).energy;return !s.journey.prepBuffs?.[item.buff];}
