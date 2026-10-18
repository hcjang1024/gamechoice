import {beginBattle,abilities,maxHp,maxEnergy} from './combat.mjs';

export const zones=[
 {id:'trail',name:'솔바람 산길',subtitle:'흩어진 발자국',image:'courtyard',danger:'초급',description:'여울원 아래 산길. 전령이 떨어뜨린 짐이 발견됐다. 길목을 노리는 매복꾼을 넘어 흔적을 찾는다.',enemy:{name:'산길의 매복꾼',hp:20,attack:2,defense:0,speed:4,weapon:'단검',heavyEvery:3,heavyBonus:2},reward:{xp:4,gold:5,ore:1},clue:'찢어진 전령의 소매에서 옛 수로의 진흙이 묻어 나왔다.'},
 {id:'waterway',name:'옛 취수로',subtitle:'가로막힌 흐름',image:'spring',danger:'중급',description:'오래된 취수로를 장악한 방패병. 단단한 방어를 뚫거나 결의 효과를 활용할 준비가 필요하다.',enemy:{name:'수로의 방패병',hp:32,attack:3,defense:2,speed:2,weapon:'방패 밀치기',heavyEvery:3,heavyBonus:2},reward:{xp:6,gold:8,ore:2},clue:'전령의 인장이 발견됐다. 그를 데려간 자들은 고갯길에서 봉쇄대를 기다린다.'},
 {id:'pass',name:'안개 고갯길',subtitle:'전령이 사라진 자리',image:'bridge',danger:'우두머리',description:'봉쇄대의 우두머리가 포로를 지킨다. 두 공방마다 몰아치는 강한 공격에 대비해야 한다.',enemy:{name:'봉쇄대의 우두머리',hp:44,attack:4,defense:2,speed:4,weapon:'넓은 칼',heavyEvery:2,heavyBonus:3},reward:{xp:10,gold:14,ore:3},clue:'묶여 있던 전령을 구했다. 젖은 밀서에는 “승천지를 묻는 자들을 경계하라”는 경고가 남아 있었다.'}
];
const opt=(id,title,hint='',disabled=false)=>({id,title,hint,disabled});
export const xpNeeded=j=>6+(j.level-1)*3;
export const zoneFor=id=>zones.find(z=>z.id===id);
export const journeyScenes=new Set(['hub','map','forge','growth','reward','chapter-end']);
export function startJourney(state){const s=structuredClone(state);s.version=3;s.journey={level:1,xp:0,points:1,gold:8,ore:2,herbs:2,gear:0,armor:0,skillRanks:{},cleared:[],runs:0,active:null,reward:null,history:[],complete:false};s.scene='hub';s.battle=null;s.flags=s.flags.filter(x=>!['advantage','guarded'].includes(x));s.hp=maxHp(s);s.energy=maxEnergy(s);s.last='서장의 경험을 안고 새로운 의뢰를 받았다. · 성장점 1, 엽전 8, 강화석 2, 약초 2';return s;}
export function journeyScene(s){const j=s.journey;if(!j)return null;
 const z=zoneFor(j.active);
 switch(s.scene){
 case 'hub':return {chapter:5,title:j.complete?'다음 길을 기다리는 여울원':'사라진 전령을 찾아서',text:[j.complete?'전령은 무사히 돌아왔고 경고는 여울원에 전해졌다. 청운문으로 갈 준비를 마칠 때까지, 익숙한 길에서 힘을 더 다듬을 수 있다.':'청운문으로 향하던 전령이 이틀째 돌아오지 않았다. 여울원의 스승은 마지막으로 목격된 산길을 살펴 달라고 부탁했다.','여울원에서는 쉬고, 전투에서 얻은 보상으로 장비와 배운 기술을 강화할 수 있다. 어느 길로 갈지, 무엇을 더 익힐지 당신이 정한다.'],choices:[opt('open-map','산 아래 지역을 탐험한다','세 지역 · 전투와 단서를 따라 새 길 개방'),opt('open-growth','경험을 돌아보고 기술을 다듬는다',`남은 성장점 ${j.points} · 능력과 기술 강화`),opt('open-forge','공방에서 무기와 방호구를 손본다',`엽전 ${j.gold} · 강화석 ${j.ore}`),opt('rest','샘가에서 충분히 쉰다','비용 없이 체력과 숨을 모두 회복',s.hp===maxHp(s)&&s.energy===maxEnergy(s)),...(j.complete?[opt('read-letter','구해 낸 전령의 밀서를 다시 읽는다','첫 번째 의뢰의 결말')]:[])]};
 case 'map':return {chapter:5,title:'산 아래, 세 갈래의 흔적',text:['가장 먼 길이 언제나 정답은 아니다. 익숙한 곳에서 실전을 쌓고 보급품을 챙긴 뒤, 새 지역으로 나아갈 수 있다.','출발할 때의 체력과 숨은 그대로 전투에 이어진다. 필요하면 거점에서 먼저 쉬자.'],choices:[...zones.map((zone,i)=>opt('explore-'+zone.id,zone.name,`${zone.danger} · ${j.cleared.includes(zone.id)?'다시 탐험 가능':i&&!j.cleared.includes(zones[i-1].id)?'이전 지역의 단서가 필요':'새로운 단서'} · 실전 경험 ${zone.reward.xp}`,i>0&&!j.cleared.includes(zones[i-1].id))),opt('to-hub','여울원으로 돌아간다')]};
 case 'combat':return {chapter:5,title:z.name+' · '+z.subtitle,text:[z.description,`${z.enemy.name}이 길을 막았다. ${z.enemy.weapon}의 움직임을 살피고, 가져온 기술을 점검하자.`],choices:[opt('start-battle','이 구성으로 전투를 시작한다','자동 전투 · 체력과 숨은 다음 장면까지 유지'),opt('use-herb','약초로 상처를 돌본다',`체력 6 회복 · 남은 약초 ${j.herbs}`,j.herbs<1||s.hp>=maxHp(s)),opt('to-hub','싸우기 전에 여울원으로 돌아간다','보상 없이 안전하게 복귀')]};
 case 'battle':return {chapter:5,title:s.battle.outcome?`${z.name} · ${{victory:'승리',defeat:'전투 불능',retreat:'후퇴'}[s.battle.outcome]}`:z.name+'의 전투',text:[],choices:s.battle.outcome?[opt('continue','전투 결과와 보상을 확인한다',s.battle.outcome==='victory'?'승리 보상을 받고 새로운 흔적을 찾는다':'거점에서 회복하고 다시 도전할 수 있다')]:[]};
 case 'reward':return {chapter:5,title:j.reward.outcome==='victory'?'싸움이 남긴 것':'돌아와 다시 준비하는 일',text:j.reward.outcome==='victory'?[j.reward.first?zoneFor(j.reward.zone).clue:'이미 살핀 길에서도 몸은 실전을 기억한다. 쌓인 경험과 챙겨 온 물자가 다음 도전을 돕는다.',j.reward.levels?`실전 등급이 ${j.level}이 되었다. 최대 체력이 늘었고 성장점을 얻었다. 어떤 능력과 기술에 쓸지는 거점에서 정할 수 있다.`:'몸에 남은 감각을 되짚었다. 다음 성장은 경험이 더 쌓이면 찾아올 것이다.']:['힘이 모자란 것을 아는 일도 수련이다. 길을 지키던 순찰대의 도움으로 여울원에 돌아왔다.','이번 전투에서는 보상을 얻지 못했다. 샘가에서 쉬고, 기술 구성과 장비를 바꾼 뒤 다시 도전하자.'],choices:[...(j.reward.outcome==='victory'&&j.reward.zone==='pass'&&j.reward.first?[opt('read-letter','구해 낸 전령에게 밀서를 받는다','첫 번째 의뢰 완수')]:[]),opt('to-hub','여울원으로 돌아간다','회복 · 성장 · 다음 탐험')]};
 case 'forge':return {chapter:5,title:'손에 익은 것을 벼리다',text:['공방의 장인은 새 무기를 권하는 대신 당신이 들고 온 도구를 살폈다. “손에 익은 것도 손보면 달라지지.”',s.weapon==='맨손'?'격투 수련용 권갑과 손목 보호대를 보강할 수 있다.':'무기 또는 마법의 매개를 보강하면 전투 위력이 오른다. 방호구는 받는 피해를 줄인다.'],choices:[opt('upgrade-gear',`${s.weapon==='맨손'?'권갑':s.weapon} 보강 +${j.gear} → +${j.gear+1}`,j.gear>=3?'최대 보강 완료':`위력 +1 · 엽전 ${6*(j.gear+1)}, 강화석 1`,j.gear>=3||j.gold<6*(j.gear+1)||j.ore<1),opt('upgrade-armor',`방호구 보강 +${j.armor} → +${j.armor+1}`,j.armor>=2?'최대 보강 완료':`방어 +1 · 엽전 ${8*(j.armor+1)}, 강화석 2`,j.armor>=2||j.gold<8*(j.armor+1)||j.ore<2),opt('buy-herb','약초 꾸러미를 산다','엽전 3 · 전투 준비 중 체력 6 회복',j.gold<3),opt('to-hub','여울원 마당으로 돌아간다')]};
 case 'growth':return {chapter:5,title:'경험을 자기 힘으로',text:[`실전 등급 ${j.level}. 남은 성장점은 ${j.points}점이다. 능력을 넓게 기를 수도, 자주 쓰는 기술을 더 깊게 익힐 수도 있다.`,'기술을 강화하면 실제 전투 위력이나 방어 효과가 오른다. 길과 결은 처음 연 그대로지만, 그 힘을 펼치는 방식은 당신이 다듬는다.'],choices:[...['control','skill','insight'].map((id,i)=>opt('grow-'+id,['숨의 제어를 더 정밀하게 익힌다','무기와 매개의 동작을 다듬는다','적의 흐름을 읽는 감각을 기른다'][i],`${['제어','숙련','통찰'][i]} ${s[id]} → ${s[id]+1} · 성장점 1`,j.points<1)),...abilities(s).map(a=>opt('hone-'+a.id,a.name+' 강화',`기술 단계 ${(j.skillRanks[a.id]||0)+1} / 3 · 성장점 1`,j.points<1||(j.skillRanks[a.id]||0)>=3)),opt('to-hub','여울원 마당으로 돌아간다')]};
 case 'chapter-end':return {chapter:5,title:'경고는 이제 당신의 손에',text:['전령은 밀서를 건네고는 한동안 숨을 골랐다. “청운문의 승천지를 찾는 자들이 있었어. 내가 본 것을 전하려다가 붙잡혔지.”','밀서에는 범인의 이름도, 이유도 없었다. 다만 지도 한 귀퉁이에 찍힌 검은 표시가 산 너머를 가리켰다.',`빈 명부에 이름을 적던 제자 ${s.name}. 이제 당신은 남의 이야기를 전해 듣는 사람이 아니라, 다음 소식을 직접 가져갈 사람이다.`],quote:'“준비가 되면, 청운문으로 가거라.”',choices:[opt('to-hub','밀서를 간직하고 여울원으로 돌아간다','첫 의뢰 완료 · 지역 재탐험과 성장은 계속 가능')]};
 default:return null;
 }
}
export function journeyChoose(s,id){const j=s.journey;
 if(s.scene==='combat'){
  if(id==='start-battle'){const z=zoneFor(j.active);return beginBattle(s,{enemy:z.enemy,context:'journey',zone:z.id});}
  if(id==='use-herb'){j.herbs--;s.hp=Math.min(maxHp(s),s.hp+6);s.last='약초로 상처를 돌봤다. · 체력 6 회복';return s;}
 }
 if(id==='to-hub'){s.scene='hub';j.active=null;s.last='여울원에 돌아왔다. 필요하면 샘가에서 쉬자.';return s;}
 if(id==='read-letter'){j.complete=true;s.scene='chapter-end';return s;}
 if(s.scene==='hub'){
  if(id==='open-map')s.scene='map';if(id==='open-growth')s.scene='growth';if(id==='open-forge')s.scene='forge';
  if(id==='rest'){s.hp=maxHp(s);s.energy=maxEnergy(s);s.last='샘가에서 쉬며 체력과 숨을 모두 회복했다.';}return s;
 }
 if(s.scene==='map'){j.active=id.slice(8);j.runs++;s.flags=s.flags.filter(x=>!['advantage','guarded'].includes(x));s.scene='combat';s.last='';return s;}
 if(s.scene==='forge'){
  if(id==='upgrade-gear'){j.gold-=6*(j.gear+1);j.ore--;j.gear++;s.last=`도구 보강 +${j.gear} · 전투 위력 +1`;}
  if(id==='upgrade-armor'){j.gold-=8*(j.armor+1);j.ore-=2;j.armor++;s.last=`방호구 보강 +${j.armor} · 방어 +1`;}
  if(id==='buy-herb'){j.gold-=3;j.herbs++;s.last='약초 꾸러미 하나를 챙겼다.';}return s;
 }
 if(s.scene==='growth'){
  j.points--;if(id.startsWith('grow-')){const stat=id.slice(5);s[stat]++;s.last='성장점 1을 사용해 '+{control:'제어',skill:'숙련',insight:'통찰'}[stat]+'을 길렀다.';}
  else{const ability=id.slice(5);j.skillRanks[ability]=(j.skillRanks[ability]||0)+1;s.last=abilities(s).find(a=>a.id===ability).name+'의 위력과 운용이 깊어졌다.';}return s;
 }
 if(s.scene==='battle'){
  if(s.battle.rewarded)throw new Error('이미 정산한 전투');
  const z=zoneFor(s.battle.zone);const won=s.battle.outcome==='victory';const first=won&&!j.cleared.includes(z.id);
  const reward={zone:z.id,outcome:s.battle.outcome,first,xp:won?z.reward.xp:0,gold:won?z.reward.gold:0,ore:won?z.reward.ore:0,levels:0};
  if(won){j.gold+=reward.gold;j.ore+=reward.ore;j.xp+=reward.xp;if(first)j.cleared.push(z.id);if(z.id==='pass')j.complete=true;while(j.xp>=xpNeeded(j)){j.xp-=xpNeeded(j);j.level++;j.points++;reward.levels++;}if(first)j.herbs++;}
  else{s.hp=Math.max(1,s.hp);}
  s.battle.rewarded=true;j.reward=reward;j.history.push({zone:z.id,outcome:s.battle.outcome,turns:s.battle.turn,level:j.level});j.history=j.history.slice(-30);s.scene='reward';s.last=won?'승리 보상을 정산했다.':'보상을 얻지 못했지만 무사히 복귀했다.';return s;
 }
 return s;
}
