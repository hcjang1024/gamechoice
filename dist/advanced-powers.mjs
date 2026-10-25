const statTable=[1,2,4,5,8,9,13],stackTable=[1,1,2,2,3,3,4];
const E=(name,profile,description)=>({name,profile,description});
// Values are intentionally separate from skill damage/rank data.
export const advancedPowers=[
 {id:'power-haste',name:'가속',table:stackTable,profile:{every:3,haste:1},evolutions:[E('속공',{opening:1},'전투 시작 시 추가 행동 기회를 얻습니다.'),E('연계',{hitHaste:25},'명중할 때마다 주도권을 모아 추가 행동을 얻습니다.'),E('혼란',{startStatus:'unsteady',startStacks:2},'전투 시작 시 적의 명중을 흔듭니다.')]},
 {id:'power-might',name:'괴력',table:statTable,profile:{attribute:'strength'},evolutions:[E('광란',{hitAttribute:'strength',hitGain:1},'명중할 때마다 근력이 증가합니다.'),E('필살',{every:4,temporaryStrength:12},'4턴마다 이번 턴의 근력이 크게 증가합니다.'),E('단련',{every:3,growAttribute:'strength',growGain:2},'3턴마다 전투 중 근력이 누적됩니다.')]},
 {id:'power-dexterity',name:'기교',table:statTable,profile:{attribute:'agility'},evolutions:[E('신속',{every:3,haste:4},'3턴마다 가속을 얻습니다.'),E('고양',{every:3,growAttribute:'agility',growGain:2},'3턴마다 전투 중 민첩이 누적됩니다.'),E('포착',{chance:.3,extraHit:5},'행동 시작 시 30% 확률로 추가 타격 기회를 얻습니다.')]},
 {id:'power-ambush',name:'기습',table:stackTable,profile:{openingVulnerable:1},evolutions:[E('일격',{firstHit:15},'첫 명중에 큰 추가 피해를 줍니다.'),E('비열',{every:1,vulnerable:2},'매 턴 적의 약점 노출을 누적합니다.'),E('해체',{hitVulnerable:2},'명중할 때마다 적의 약점을 벌립니다.')]},
 {id:'power-presence',name:'기품',table:statTable,profile:{attribute:'charisma'},evolutions:[E('위엄',{attribute:'charisma',fixed:22,decayOnHurt:2},'높은 매력을 얻지만 피격될 때마다 감소합니다.'),E('신성',{reduction:.35},'적 타격 피해를 35% 줄입니다.'),E('현혹',{every:1,weaken:1},'매 턴 적의 공격 위력을 점차 낮춥니다.')]},
 {id:'power-toxin',name:'독기',table:[1,2,4,5,7,8,10],profile:{every:3,poison:1},evolutions:[E('맹독',{startStatus:'poison',startStacks:3},'전투 시작 시 중독을 부여합니다.'),E('즉사',{startDamage:20},'전투 시작 시 방어를 무시하는 독 피해를 줍니다.'),E('마비',{every:3,stun:1},'3턴마다 적의 다음 행동을 묶습니다.')]},
 {id:'power-wisdom',name:'명석',table:statTable,profile:{attribute:'intelligence'},evolutions:[E('영감',{chance:.55,growAttribute:'intelligence',growGain:2},'매 턴 55% 확률로 지능이 증가합니다.'),E('분석',{atTurn:6,vulnerable:10},'6턴째에 큰 약점 노출을 부여합니다.'),E('학습',{hurtAttribute:'intelligence',hurtGain:1},'타격 피해를 받을 때 지능이 증가합니다.')]},
 {id:'power-ignition',name:'발화',table:[3,6,10,13,17,20,25],profile:{startStatus:'burn'},evolutions:[E('소각',{every:1,burn:2},'매 턴 적에게 발화를 부여합니다.'),E('폭파',{atTurn:8,damage:30},'8턴째 방어를 무시하는 폭발을 일으킵니다.'),E('공멸',{startStatus:'burn',startStacks:4,selfStatus:'burn',selfStacks:4},'전투 시작 시 자신과 적 모두에게 강한 발화를 부여합니다.')]},
 {id:'power-survival',name:'생존',table:[5,10,20,25,35,40,50],profile:{maxHp:1,healStart:true},evolutions:[E('재생',{every:1,maxHpGrow:2,heal:2},'매 턴 최대 체력이 증가하고 같은 양을 회복합니다.'),E('불굴',{unstoppable:4},'처음 네 번의 행동 동안 행동 봉쇄를 무시합니다.'),E('체술',{hitMaxHp:1,hitHeal:1},'명중할 때마다 최대 체력과 현재 체력이 증가합니다.')]},
 {id:'power-initiative',name:'선공',table:[0,0,1,1,2,2,3],profile:{opening:1},evolutions:[E('쇄도',{every:3,haste:4},'3턴마다 우선 행동 기회를 얻습니다.'),E('폭주',{atTurn:9,haste:12},'9턴째에 추가 행동 기회를 크게 얻습니다.'),E('야습',{startStun:2},'적이 처음 두 행동 동안 움직이지 못합니다.')]},
 {id:'power-endurance',name:'인내',table:[1,2,3,4,5,6,8],profile:{openingGuard:1},evolutions:[E('적응',{atTurn:5,reductionGain:.25},'5턴째에 타격 피해 감소를 얻습니다.'),E('무적',{invulnerable:2},'처음 두 번의 적 타격 피해를 완전히 막습니다.'),E('경화',{every:2,armorGrow:1},'2턴마다 전투 중 방어가 증가합니다.')]},
 {id:'power-cruelty',name:'잔혹',table:stackTable,profile:{hitBleed:1},evolutions:[E('관통',{hitSpecial:3},'명중할 때마다 방어를 무시하는 추가 피해를 줍니다.'),E('공포',{hitWeaken:1},'명중할 때마다 적의 공격 위력을 낮춥니다.'),E('역류',{every:1,bleed:2},'매 턴 적에게 출혈을 부여합니다.')]},
 {id:'power-precision',name:'정밀',table:[4,8,14,18,24,28,35],profile:{critical:.01},evolutions:[E('충전',{every:2,guaranteedCrit:true},'2턴마다 다음 직접 공격을 치명타로 만듭니다.'),E('집중',{critical:1,fixed:1,critCharges:6},'처음 여섯 번의 직접 타격이 반드시 치명타가 됩니다.'),E('주시',{every:1,criticalGrow:.03},'매 턴 치명타 확률이 증가합니다.')]},
 {id:'power-amplify',name:'증폭',table:[6,12,24,30,42,48,60],profile:{criticalDamage:.01},evolutions:[E('회심',{every:4,critDamageOnce:1.4},'4턴마다 다음 치명타의 피해를 크게 높입니다.'),E('간파',{every:3,criticalDamageGrow:.2},'3턴마다 치명타 피해 보정이 증가합니다.'),E('처형',{critDamageOnce:1.2,critCharges:6},'처음 여섯 치명타의 추가 피해를 높입니다.')]},
 {id:'power-armor',name:'철갑',table:statTable,profile:{armor:.25},evolutions:[E('차단',{every:1,shield:3},'매 턴 보호막을 얻습니다.'),E('방벽',{every:3,reductionGain:.1},'3턴마다 피해 감소가 누적됩니다.'),E('장막',{every:1,shield:2,barrier:true},'매 턴 방어 장막을 보충합니다.')]},
 {id:'power-evasion',name:'회피',table:[2,4,8,10,14,16,20],profile:{evasion:.01},evolutions:[E('예지',{every:4,absoluteDodge:1},'4턴마다 다음 적 타격을 확실하게 피합니다.'),E('은폐',{evasion:.9,fixed:1,dodgeCharges:4},'처음 네 번의 적 타격에 높은 회피 보정을 얻습니다.'),E('잔상',{absoluteDodge:3},'처음 세 번의 적 타격을 피합니다.')]},
 {id:'power-impact',name:'강타',table:[4,4,5,5,6,6,7],profile:{hitImpact:1},evolutions:[E('침착',{every:1,calmReduction:.3},'공격하지 않은 턴에는 다음 타격 피해를 줄입니다.'),E('용맹',{hitWeaken:2},'명중할 때마다 적을 무력화합니다.'),E('역습',{hurtSpecial:4},'적의 타격을 받을 때마다 반사 피해를 줍니다.')]},
 {id:'power-track',name:'추적',table:[0,0,1,1,2,2,3],profile:{opening:1,untilFirstHit:true},evolutions:[E('습격',{startStatus:'bleed',startStacks:4},'전투 시작 시 출혈을 부여합니다.'),E('잠행',{opening:4,untilFirstHit:true},'첫 명중 전까지 우선 행동 기회를 얻습니다.'),E('유령',{every:2,haste:3},'2턴마다 흐릿함을 모아 추가 행동을 얻습니다.')]},
 {id:'power-faith',name:'신앙',table:[1,2,4,5,7,8,10],profile:{every:3,weaken:.3},evolutions:[E('심판',{every:1,judgment:3},'매 턴 심판을 모으고 명중 시 소모해 추가 피해를 줍니다.'),E('구원',{revive:15},'전투당 한 번, 체력이 소진되면 회복하며 살아남습니다.'),E('후광',{openingWeaken:4,weakenDecay:true},'초반 적의 위력을 크게 낮추며 시간이 지나면 약해집니다.')]}
];
export function advancedDefinition(id){return advancedPowers.find(a=>a.id===id);}
export function abilityEvolutionOptions(id){
 const row=advancedDefinition(id);
 const special={
  'ability-concentration':[E('냉정',{critical:.5,fixed:1},'상시 높은 치명타 확률을 얻습니다.'),E('역장',{reduction:.25},'적의 타격 피해를 줄입니다.'),E('폭풍',{every:2,damage:7},'2턴마다 방어를 무시하는 추가 피해를 줍니다.')],
  'ability-absorption':[E('포식',{hitMaxHp:1,hitHeal:1},'명중할 때마다 최대 체력과 회복을 얻습니다.'),E('혈류',{hitHeal:3},'명중할 때마다 체력을 회복합니다.'),E('환류',{every:3,energy:3},'3턴마다 숨을 회복합니다.')],
  'core-breath':[E('폭발 운용',{coreDamage:2},'축기·공명 방출의 추가 위력을 높입니다.'),E('호신 운용',{every:2,shield:4},'2턴마다 보호막을 얻습니다.'),E('순환 운용',{every:3,energy:3,heal:2},'3턴마다 숨과 체력을 회복합니다.')]
 };
 const choices=row?.evolutions||special[id]||[E('생기 각성',{every:3,heal:4},'3턴마다 체력을 회복합니다.'),E('호신 각성',{every:2,shield:4},'2턴마다 보호막을 얻습니다.'),E('집중 각성',{every:3,guaranteedCrit:true},'3턴마다 다음 직접 공격을 치명타로 만듭니다.')];
 return choices.map((e,i)=>({...e,id:id+'-evolution-'+i,parentId:id}));
}
export function advancedValue(s,id){const a=advancedDefinition(id);return a?.table[Math.min(6,s.passiveRanks?.[id]||0)]||0;}
