import {beginBattle,abilities,maxHp,maxEnergy} from './combat.mjs';
import {ensureWorkshop} from './workshop.mjs';
import {marketScene,marketChoose} from './market.mjs';
import {ensureRoute,chapterScene,chapterChoose,finishVisit,awardExperience} from './chapter.mjs';
export const zones=[
 {id:'trail',name:'솔바람 산길',subtitle:'흩어진 발자국',image:'courtyard',danger:'초급',description:'여울원 아래 산길. 전령이 떨어뜨린 짐이 발견됐다. 길목을 노리는 매복꾼을 넘어 흔적을 찾는다.',enemy:{name:'산길의 매복꾼',hp:20,attack:2,defense:0,speed:4,weapon:'단검',heavyEvery:3,heavyBonus:2},reward:{xp:4,gold:5,ore:1},clue:'찢어진 전령의 소매에서 옛 수로의 진흙이 묻어 나왔다.'},
 {id:'waterway',name:'옛 취수로',subtitle:'가로막힌 흐름',image:'spring',danger:'중급',description:'오래된 취수로를 장악한 방패병. 단단한 방어를 뚫거나 결의 효과를 활용할 준비가 필요하다.',enemy:{name:'수로의 방패병',hp:32,attack:3,defense:2,speed:2,weapon:'방패 밀치기',heavyEvery:3,heavyBonus:2},reward:{xp:6,gold:8,ore:2},clue:'전령의 인장이 발견됐다. 그를 데려간 자들은 고갯길에서 봉쇄대를 기다린다.'},
 {id:'pass',name:'안개 고갯길',subtitle:'전령이 사라진 자리',image:'bridge',danger:'우두머리',description:'봉쇄대의 우두머리가 포로를 지킨다. 두 공방마다 몰아치는 강한 공격과 반격 태세에 대비해야 한다.',enemy:{name:'봉쇄대의 우두머리',hp:44,attack:4,defense:2,speed:4,weapon:'넓은 칼',heavyEvery:2,heavyBonus:3,counterEvery:3},reward:{xp:10,gold:14,ore:3},clue:'묶여 있던 전령을 구했다. 밀서에는 “승천지를 묻는 자들을 경계하라”는 경고가 남아 있었다.'}
];
const opt=(id,title,hint='',disabled=false)=>({id,title,hint,disabled});
export const xpNeeded=j=>6+(j.level-1)*3;
export const zoneFor=id=>zones.find(z=>z.id===id);
export function startJourney(state){
 const s=structuredClone(state);s.version=5;s.journey={level:1,xp:0,points:1,gold:8,ore:2,herbs:2,gear:0,armor:0,skillRanks:{},cleared:[],runs:0,active:null,reward:null,history:[],complete:false};
 ensureWorkshop(s.journey);s.scene='hub';s.battle=null;s.flags=s.flags.filter(x=>!['advantage','guarded'].includes(x));s.hp=maxHp(s);s.energy=maxEnergy(s);ensureRoute(s);
 s.last='첫 챕터가 시작됐다. 중간 선택 6회 뒤 마지막 보스와 마주한다. · 성장점 1, 엽전 8, 강화석 2, 약초 2';return s;
}
export function journeyScene(s){
 const j=s.journey;if(!j)return null;
 const chapter=chapterScene(s);if(chapter)return chapter;
 const market=marketScene(s);if(market)return market;
 const z=zoneFor(j.active),boss=j.route.current?.kind==='boss';
 switch(s.scene){
 case 'combat':return {chapter:5,title:z.name+' · '+(boss?'마지막 보스':z.subtitle),text:[z.description,`${z.enemy.name}이 길을 막았다. ${z.enemy.weapon}의 움직임을 살피고, 가져온 기술을 점검하자.`,boss?'이 전투를 마지막으로 챕터가 끝난다. 새 휴식이나 상점 방문은 할 수 없다.':'이 장소를 선택할 때 여정 한 칸을 이미 사용했다. 물러나더라도 그 기회는 돌아오지 않는다.'],choices:[opt('start-battle',boss?'마지막 보스전을 시작한다':'이 구성으로 전투를 시작한다','자동 전투 · 체력과 숨은 다음 장면까지 유지'),opt('use-herb','약초로 상처를 돌본다',`체력 6 회복 · 남은 약초 ${j.herbs}`,j.herbs<1||s.hp>=maxHp(s)),opt('open-bag','장비와 소모품을 점검한다','현재 소지품만 사용 · 추가 여정 소모 없음'),opt('to-hub',boss?'마지막 준비 화면으로 돌아간다':'전투를 포기하고 다음 갈림길로 간다',boss?'휴식·상점 방문 불가 · 장착과 성장점만 정비':'보상 없음 · 사용한 여정은 복구되지 않음')]};
 case 'battle':return {chapter:5,title:s.battle.outcome?`${z.name} · ${{victory:'승리',defeat:'전투 불능',retreat:'후퇴'}[s.battle.outcome]}`:z.name+'의 전투',text:[],choices:s.battle.outcome?[opt('continue','전투 결과와 보상을 확인한다',s.battle.outcome==='victory'?'승리 보상을 정산하고 여정을 이어간다':boss?'보스를 넘지 못했다. 이번 챕터 도전 종료':'이 전투의 보상 없이 남은 여정을 이어간다')]:[]};
 case 'reward':return {chapter:5,title:j.reward.outcome==='victory'?'싸움이 남긴 것':'잃은 기회와 남은 길',text:j.reward.outcome==='victory'?[j.reward.first?zoneFor(j.reward.zone).clue:'익숙한 적을 넘었지만, 여정의 한 칸은 돌아오지 않는다. 얻은 보상으로 다음 선택을 준비해야 한다.',j.reward.levels?`실전 등급이 ${j.level}이 되었다. 최대 체력이 늘었고 성장점을 얻었다.`:'체력과 숨은 싸움이 끝났을 때 그대로다. 쉬려면 다음 갈림길의 다른 기회를 포기해야 한다.']:['전투의 보상은 얻지 못했고, 한 번의 선택은 이미 지나갔다. 순찰대가 퇴로를 열어 주었지만 새 힘을 보태 주지는 못했다.','남은 소모품을 쓰거나, 뒤에 나타나는 휴식 기회를 골라 여정을 이어갈 수 있다.'],choices:[...(j.complete?[opt('read-letter','구해 낸 전령에게 밀서를 받는다','마지막 보스 격파 · 챕터 완료')]:[]),opt('to-hub',j.complete?'챕터 결과를 확인한다':'다음 갈림길로 나아간다',j.complete?'추가 전투·상점·휴식 없음':'남은 선택을 확인하고 한 곳을 고른다')]};
 case 'forge':return {chapter:5,title:'한 번뿐인 화덕 앞에서',text:['장인은 들고 온 도구와 방호구를 살폈다. 이곳에서 정비하는 동안 다른 길의 기회는 지나간다.','지금 가진 엽전과 강화석 안에서 보강하자. 떠난 뒤에는 이 화덕으로 돌아올 수 없다.'],choices:[opt('upgrade-gear',`${s.weapon==='맨손'?'권갑':s.weapon} 보강 +${j.gear} → +${j.gear+1}`,j.gear>=3?'최대 보강 완료':`위력 +1 · 엽전 ${6*(j.gear+1)}, 강화석 1`,j.gear>=3||j.gold<6*(j.gear+1)||j.ore<1),opt('upgrade-armor',`방호구 보강 +${j.armor} → +${j.armor+1}`,j.armor>=2?'최대 보강 완료':`방어 +1 · 엽전 ${8*(j.armor+1)}, 강화석 2`,j.armor>=2||j.gold<8*(j.armor+1)||j.ore<2),opt('buy-herb','장인이 남겨 둔 약초를 산다','엽전 3 · 체력 6 회복용',j.gold<3),opt('to-hub','정비를 마치고 다음 갈림길로 간다','이번 방문을 마침 · 재방문 불가')]};
 case 'growth':return {chapter:5,title:'이미 얻은 경험을 자기 힘으로',text:[`실전 등급 ${j.level}. 남은 성장점은 ${j.points}점이다. 지금까지 얻은 점수를 배분하는 데에는 여정 한 칸을 쓰지 않는다.`,'새 점수를 얻으려면 남은 기회 안에서 전투나 이벤트를 골라야 한다.'],choices:[...['control','skill','insight'].map((id,i)=>opt('grow-'+id,['숨의 제어를 더 정밀하게 익힌다','무기와 매개의 동작을 다듬는다','적의 흐름을 읽는 감각을 기른다'][i],`${['제어','숙련','통찰'][i]} ${s[id]} → ${s[id]+1} · 성장점 1`,j.points<1)),...abilities(s).map(a=>opt('hone-'+a.id,a.name+' 강화',`기술 단계 ${(j.skillRanks[a.id]||0)+1} / 3 · 성장점 1`,j.points<1||(j.skillRanks[a.id]||0)>=3)),opt('to-hub','배분을 마치고 여정으로 돌아간다','여정 추가 소모 없음')]};
 case 'chapter-end':return {chapter:5,title:'경고는 이제 당신의 손에',text:['전령은 밀서를 건네고는 한동안 숨을 골랐다. “청운문의 승천지를 찾는 자들이 있었어. 내가 본 것을 전하려다가 붙잡혔지.”','여섯 번의 선택과 마지막 싸움을 거쳐, 경고는 마침내 길을 얻었다.',`빈 명부에 이름을 적던 제자 ${s.name}. 이제 당신은 다음 소식을 직접 가져갈 사람이다.`],quote:'“다음 길은 청운문으로 이어진다.”',choices:[opt('to-hub','첫 챕터의 결과로 돌아간다','이 챕터의 추가 성장과 반복 전투는 종료')]};
 default:return null;
 }
}
export function journeyChoose(s,id){
 const j=s.journey,r=j.route;
 if(chapterScene(s))return chapterChoose(s,id);
 if(id==='read-letter'&&j.complete){s.scene='chapter-end';return s;}
 if(id==='to-hub'){
  if(r.current?.kind==='boss'){r.current=null;j.active=null;s.scene='hub';}else finishVisit(s,s.scene==='combat'?'전투 포기':'완료');
  s.last='지나온 방문은 끝났다. 남은 선택을 확인하자.';return s;
 }
 if(id==='open-bag'){j.bagReturn=s.scene==='combat'?'combat':s.scene;s.scene='bag';return s;}
 if(marketScene(s))return marketChoose(s,id);
 if(s.scene==='combat'){
  if(id==='start-battle'){const z=zoneFor(j.active),enemy={...z.enemy};if(r.current.elite){enemy.hp+=6;enemy.attack++;}if(r.current.kind==='boss'&&r.intel.includes('read-pattern'))enemy.heavyBonus=Math.max(0,enemy.heavyBonus-1);return beginBattle(s,{enemy,context:'journey',zone:z.id});}
  if(id==='use-herb'){j.herbs--;s.hp=Math.min(maxHp(s),s.hp+6);s.last='약초를 썼다. · 체력 6 회복';return s;}
 }
 if(s.scene==='forge'){
  if(id==='upgrade-gear'){j.gold-=6*(j.gear+1);j.ore--;j.gear++;s.last=`도구 보강 +${j.gear} · 위력 +1`;}
  if(id==='upgrade-armor'){j.gold-=8*(j.armor+1);j.ore-=2;j.armor++;s.last=`방호구 보강 +${j.armor} · 방어 +1`;}
  if(id==='buy-herb'){j.gold-=3;j.herbs++;s.last='약초 꾸러미 하나를 챙겼다.';}return s;
 }
 if(s.scene==='growth'){j.points--;if(id.startsWith('grow-')){const stat=id.slice(5);s[stat]++;s.last='성장점 1을 사용해 '+{control:'제어',skill:'숙련',insight:'통찰'}[stat]+'을 길렀다.';}else{const ability=id.slice(5);j.skillRanks[ability]=(j.skillRanks[ability]||0)+1;s.last=abilities(s).find(a=>a.id===ability).name+'을 더 깊이 익혔다.';}return s;}
 if(s.scene==='battle'){
  if(s.battle.rewarded)throw new Error('이미 정산한 전투');
  const z=zoneFor(s.battle.zone),won=s.battle.outcome==='victory',first=won&&!j.cleared.includes(z.id),boss=r.current?.kind==='boss',elite=r.current?.elite;
  const reward={zone:z.id,outcome:s.battle.outcome,first,xp:won?z.reward.xp+(elite?2:0):0,gold:won?z.reward.gold+(elite?3:0):0,ore:won?z.reward.ore+(elite?1:0):0,levels:0};
  if(won){j.gold+=reward.gold;j.ore+=reward.ore;reward.levels=awardExperience(s,reward.xp);if(first)j.cleared.push(z.id);if(first)j.herbs++;}
  else s.hp=Math.max(1,s.hp);
  s.battle.rewarded=true;j.reward=reward;j.history.push({zone:z.id,outcome:s.battle.outcome,turns:s.battle.turn,level:j.level});j.history=j.history.slice(-30);
  if(boss){r.ended=won?'victory':'defeat';r.bossOutcome=s.battle.outcome;j.complete=won;s.scene=won?'reward':'chapter-failed';}
  else{s.scene='reward';const entry=r.history.find(e=>e.step===r.current?.step);if(entry)entry.outcome=won?'승리':'패배';}
  s.last=won?'승리 보상을 정산했다.':boss?'마지막 보스를 넘지 못해 이번 도전이 끝났다.':'전투의 보상을 얻지 못했고, 사용한 선택은 복구되지 않는다.';return s;
 }
 throw new Error('알 수 없는 여정 행동');
}
