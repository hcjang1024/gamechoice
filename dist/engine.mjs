import {ensurePathState,pathInfo} from './paths.mjs';
import {ensureStatuses} from './statuses.mjs';
import {enforceGrowth} from './progression.mjs';
import {beginBattle,abilities,abilityCatalog,grantAbility} from './combat.mjs';
import {startJourney,journeyScene,journeyChoose} from './journey.mjs';
import {ensureWorkshop} from './workshop.mjs';
import {ensureRoute} from './chapter.mjs';
export const weapons=['맨손','검','도','창','활','지팡이'];
export const elements=['물','불','흙','바람','나무','쇠','번개'];
export function initial(name){return {version:6,name,scene:'arrival',path:null,trial:null,element:null,weapon:null,hp:10,energy:6,control:0,insight:0,skill:0,training:0,relations:[],learnedSkills:[],loadout:[],battle:null,journey:null,flags:[],journal:[],last:'',ending:null};}
export function migrate(raw){
 if(!raw||![1,2,3,4,5,6].includes(raw.version)||typeof raw.name!=='string'||!Array.isArray(raw.journal)||!Array.isArray(raw.flags))throw new Error('유효하지 않은 저장');
 const s={...initial(raw.name),...structuredClone(raw)};
 if(s.version===1){const choices=s.journal.map(j=>j.choice);s.relations=[];if(choices.some(c=>c.includes('짐을 든')))s.relations.push('first-help');if(choices.some(c=>c.includes('서로의 빈틈')))s.relations.push('shared-practice');if(s.ending==='together')s.relations.push('shared-rescue');if(s.flags.includes('isol-injured'))s.relations.push('isol-injured');if(s.flags.includes('art-trust'))s.flags.push('art-insight');delete s.trust;s.version=2;s.last='이전 여정을 불러왔습니다. 동료 관계는 사건 기록으로 분리되었고 전투는 자동 전투로 진행됩니다.';}
 if(s.path&&!['inner','outer'].includes(s.path))throw new Error('유효하지 않은 길');
 if(s.weapon&&!weapons.includes(s.weapon)||s.element&&!elements.includes(s.element))throw new Error('유효하지 않은 장비');
 if(!['hp','energy','control','insight','skill','training'].every(k=>Number.isFinite(s[k])&&s[k]>=0)||!Array.isArray(s.relations))throw new Error('유효하지 않은 능력치');
 if(raw.version<6){s.learnedSkills=['weapon',...(s.control>=2?['element']:[]),...(s.insight>=2?['counter']:[])];s.loadout=raw.loadout??s.learnedSkills.slice(0,2);const cp=s.journey?.route?.checkpoint;if(cp){cp.version=6;cp.learnedSkills=['weapon',...(cp.control>=2?['element']:[]),...(cp.insight>=2?['counter']:[])];cp.loadout??=cp.learnedSkills.slice(0,2);}}
 if(!Array.isArray(s.learnedSkills)||!s.learnedSkills.every(id=>['weapon','element','counter'].includes(id)))throw new Error('유효하지 않은 학습 기록');
 ensureWorkshop(s.journey);ensureRoute(s,raw.version<5);if(s.battle){ensureStatuses(s.battle);ensurePathState(s);}s.version=6;enforceGrowth(s);scene(s);return s;
}
const remember=(s,event)=>{if(!s.relations.includes(event))s.relations.push(event);};
export function relationshipEvents(s){const labels={'first-help':'첫날, 이솔의 짐을 함께 들었다.','shared-practice':'서로의 빈틈을 짚으며 합을 맞췄다.','held-line':'다리 앞에서 이솔의 뒤를 지켰다.','shared-rescue':'위험한 다리에서 함께 아이와 약초를 구했다.','child-rescue':'아이를 먼저 구하는 선택을 함께했다.','isol-injured':'아이를 맡긴 이솔이 팔을 다쳤다.','shared-watch':'청운문 아래에서 이솔과 밤 경계를 나누었다.'};return s.relations.map(id=>labels[id]).filter(Boolean);}
const option=(id,title,hint='')=>({id,title,hint});
const pathName=s=>s.path==='inner'?'쌓는 길':s.path==='outer'?'끌어 쓰는 길':'아직 열지 않은 길';
export {pathName};
export function scene(s){
 const continuation=journeyScene(s);if(continuation)return continuation;
 const inner=s.path==='inner';
 switch(s.scene){
 case 'arrival':return {chapter:1,title:'아직 쓰이지 않은 이름',text:[`운양의 산길 끝, 오래된 돌문에 「모든 길은 첫 숨에서 시작된다」는 문장이 새겨져 있었다. 당신은 여행 보따리를 고쳐 메고 그 아래를 지났다.`,`이곳은 여러 문파와 학파가 초심자를 가르치는 공동 수련처, 여울원. 검을 찬 제자 옆에서 누군가는 아무 무기도 없이 허공의 물방울을 움직였다.`,`접수대의 노인이 빈 명부 위에 당신의 이름, ‘${s.name}’을 적었다.`],quote:'“어디서 왔느냐보다, 여기서 무엇을 하느냐가 중요하지.”',choices:[option('observe','마당의 수련을 유심히 살핀다','관찰로 시작한다 · 통찰 +1'),option('help','무거운 짐을 든 제자를 돕는다','이솔과의 첫 만남이 관계 기록에 남는다')]};
 case 'spring':return {chapter:1,title:'샘이 가르치는 것',text:['새벽, 안내역인 제자 이솔이 당신을 샘가로 데려갔다. 물 위에 떨어진 잎이 흐름을 거슬러 천천히 돌았다.','“숨이야. 물에도, 돌에도, 네 안에도 있어.” 이솔은 한 손을 배에, 다른 손을 샘 위에 뻗었다.','스승은 아직 길이 열리지 않은 지금만 두 방식을 가볍게 느껴 볼 수 있다고 했다. 어느 하나를 몸에 새기는 것은 그다음이다.'],choices:[option('try-inner','호흡을 따라 숨을 몸 안에 머무르게 한다','쌓는 길을 체험한다 · 아직 확정되지 않음'),option('try-outer','샘 주위의 숨을 손끝으로 이끌어 본다','끌어 쓰는 길을 체험한다 · 아직 확정되지 않음')]};
 case 'commit':return {chapter:1,title:s.trial==='inner'?'안으로 고이는 물결':'손끝을 지나는 흐름',text:s.trial==='inner'?['들이마신 숨이 아랫배에 작고 따뜻한 무게를 남겼다. 숨을 내쉬어도, 그 온기는 사라지지 않았다.','스승이 고개를 끄덕였다. “그것을 쌓아 네 힘으로 만드는 것이 무인의 길이다. 바깥의 숨이 드문 땅에서도, 네 안에 남은 힘을 쓸 수 있지.”']:['샘물 위의 작은 잎이 손끝을 따라 움직였다. 몸에 힘을 담지 않았는데도, 당신을 지나간 흐름이 세상을 건드렸다.','스승이 고개를 끄덕였다. “쌓지 않고 그 자리에서 끌어 쓰는 마법사의 길이다. 주위의 흐름을 읽고, 그것을 네 뜻에 맞게 이끄는 것이지.”'],quote:'“한 길을 열면 몸이 그 길에 맞춰진다. 인간은 두 길을 함께 갈 수 없다. 충분히 느껴 보고 정하거라.”',choices:[option('commit',s.trial==='inner'?'내 안에 숨을 쌓는 길을 연다':'바깥의 숨을 끌어 쓰는 길을 연다','이 선택으로 길이 확정됩니다 · 이후 변경 불가'),option('switch','다른 방식도 느껴 본다','확정 전에 다른 길을 체험한다')]};
 case 'element':return {chapter:1,title:'당신의 숨이 띠는 결',text:['길을 열자 전에는 구별할 수 없던 감각이 선명해졌다. 스승이 일곱 개의 작은 돌을 앞에 내려놓았다.','“결은 새로 고르는 옷이 아니다. 네가 타고난 숨의 모양이지. 무엇이 네 안에서 응답하느냐?”','눈을 감고, 가장 또렷하게 다가오는 감각에 귀를 기울였다.'],choices:elements.map((x,i)=>option('element-'+i,['차갑고 유연하게 스며드는 물','어둠 속에서도 번져 가는 불','깊고 단단하게 받치는 흙','어디에도 머물지 않는 바람','천천히 뻗어나가 이어지는 나무','한 점으로 곧게 벼려지는 쇠','찰나에 빛나고 사라지는 번개'][i],`타고난 결 설정 · ${x}`))};
 case 'weapon':return {chapter:2,title:'손에 남는 감각',text:[`무기고의 문이 열렸다. 낡은 수련 도구들이 가지런히 걸려 있었다.`,`“${inner?'쌓은 숨을 어떻게 펼칠지는':'외부의 숨을 무엇으로 이끌지는'} 네가 정해라. 검을 쥐었다고 모두 무인인 것은 아니고, 맨손이라고 마법을 못 쓰는 것도 아니니.”`,`한 가지를 골라 첫 수련을 시작하자. 길과 달리, 도구는 나중에 다른 것을 배울 수 있다.`],choices:weapons.map((x,i)=>option('weapon-'+i,x,['몸 자체를 무기이자 매개로 · 밀착과 타격','정확한 궤적과 균형 · 흘리기와 찌르기','무게를 실은 한 번의 궤적 · 강한 돌파','긴 거리와 곧은 힘 · 접근 제어','거리와 호흡의 타이밍 · 원거리 견제','흐름을 짚는 긴 매개 · 제어와 방어'][i]))};
 case 'practice':return {chapter:2,title:'작은 반복이 길이 된다',text:[`당신은 ${s.weapon==='맨손'?'빈손으로 자세를 잡았다':s.weapon+'을 고쳐 쥐었다'}. ${s.element}의 숨은 아직 서툴게 흔들렸다.`,inner?'몸 안에 쌓인 힘을 끝까지 유지하는 일과 정확한 순간에 꺼내는 일은 달랐다.':'흐름을 느끼는 것과 그 흐름을 원하는 모양으로 유지하는 것은 달랐다.',`해가 기울기까지 ${3-s.training}번 더 수련할 시간이 있다. 반복을 마치면 첫 기술을 하나 골라 배운다. 능력치가 올라가도 기술이 저절로 늘어나지는 않는다.`],choices:[option('control',inner?'호흡을 고르게 하며 숨을 다스린다':'작은 흐름을 오래 유지한다','제어 +1 · 숨 회복 1'),option('skill',`${s.weapon==='맨손'?'발디딤과 타격':s.weapon+'의 기본 동작'}을 반복한다`,'숙련 +1 · 체력 소모 1'),option('insight','주변의 숨이 달라지는 곳을 찾는다','통찰 +1'),{...option('partner','이솔과 서로의 빈틈을 짚어 준다',s.relations.includes('shared-practice')?'이미 합을 맞췄다 · 다른 수련을 선택하세요':'통찰 +1 · 체력 회복 1 · 함께 수련한 경험을 남김'),disabled:s.relations.includes('shared-practice')}]};
 case 'first-lesson':return {chapter:2,title:'첫 기술, 하나만 골라 익힌다',text:['기본 공격과 방어가 몸에 익었다. 이제 가장 먼저 배우고 싶은 움직임 하나를 고르자. 선택한 기술은 자동으로 장착된다.'],choices:abilityCatalog(s).filter(a=>['weapon','element','counter'].includes(a.id)).map(a=>option('pick-'+a.id,a.name,a.description+' · 숨 '+a.cost))};
 case 'mission':return {chapter:3,title:'산 아래로 가는 두 사람',text:['첫 심부름은 단순했다. 산 아래 마을에 약초 꾸러미를 전하고, 해가 지기 전에 돌아올 것. 이솔이 당신과 함께 나섰다.','갈림길에 닿자 오래된 수로 아래에서 돌이 부딪치는 소리가 났다. 마을로 가는 다리의 밧줄 하나가 끊어져 있었다.','다리 건너에는 약초를 기다리는 마을 사람과 겁에 질린 아이가 있었다. 수풀에서는 얼굴을 가린 자가 걸어 나왔다.'],quote:'“꾸러미를 두고 가. 그러면 다리는 건너지 않아도 돼.”',choices:[option('read','상대보다 먼저 주변의 흐름을 읽는다','통찰 2 이상이면 선점 · 숨 소모 1'),option('guard','이솔이 다리를 지키는 동안 적을 막는다','첫 공격을 막을 준비 · 이솔과의 사건으로 기록'),option('rush','상대가 자리를 잡기 전에 거리를 좁힌다','숙련 2 이상이면 선점 · 체력 소모 1')]};
 case 'combat':return {chapter:3,title:'첫 실전, 준비한 힘으로',text:[s.flags.includes('advantage')?'적이 움직이기 전에 유리한 자리를 잡았다.':'짧은 칼을 든 약탈자가 다가온다. 이솔은 아이를 지키기 위해 다리 쪽으로 달렸다.',`기본 공격과 방어에, 직접 고른 기술 ${abilities(s).length}개를 더해 싸운다.`,`기본 방어는 위험한 공격에 자동으로 대비한다. ${pathInfo(s).cycle} 순서로 배운 기술을 운용한다.`],choices:[option('start-battle','준비한 기술로 전투에 들어간다','자동 전투 시작 · 전투 중에는 기술 구성을 바꿀 수 없음')]};
 case 'battle':return {chapter:3,title:s.battle.outcome?{victory:'첫 실전의 승리',defeat:'끝까지 버틴 자리',retreat:'물러설 때를 아는 것'}[s.battle.outcome]:'다리 위의 자동 전투',text:[],choices:s.battle.outcome?[option('continue','전투를 마치고 다리로 향한다',s.battle.outcome==='defeat'?'이솔의 응급 처치로 체력 1을 회복해 여정을 이어갑니다':'남은 체력과 숨으로 다음 위기를 맞이합니다')]:[]};
 case 'bridge':return {chapter:3,title:'끊어지기 직전의 것',text:[s.flags.includes('won')?'얼굴을 가린 자는 무기를 놓고 숲으로 달아났다. 첫 실전은 끝났지만,밧줄이 찢어지는 소리가 뒤따랐다.':'이솔이 당신을 안전한 곳으로 끌어냈다. 적도 무너지는 다리를 피해 물러났다. 오래 쉴 시간은 없었다.','약초 꾸러미가 다리 난간에 걸려 있었다. 그 아래, 아이가 매달린 나무판이 점점 기울었다.','모든 것을 붙들려면 남은 힘으로 흐름을 정확히 읽거나, 함께 수련했던 경험을 살려 이솔과 역할을 나눠야 한다.'],choices:[option('child','아이부터 안전한 곳으로 끌어 올린다','사람을 우선한다 · 약초 일부를 잃는다'),{...option('both',inner?'숨을 다리에 싣고 이솔과 밧줄을 당긴다':'다리 아래의 숨을 이끌어 이솔을 돕는다',s.relations.includes('shared-practice')?'함께 수련한 경험으로 역할을 나눈다 · 숨 소모 1':'제어 + 통찰 3 이상 필요 · 숨 소모 1'),disabled:s.energy<1||(!s.relations.includes('shared-practice')&&s.control+s.insight<3)},option('herbs','꾸러미를 건네고 이솔에게 아이를 맡긴다','마을의 약을 지킨다 · 이솔의 부담과 부상')]};
 case 'night':return {chapter:4,title:'실전에서 얻은 다음 기술',text:[s.ending==='together'?'마을에 아이와 약초가 함께 도착했다. 이솔은 힘이 풀린 손으로 물그릇을 쥐고 웃었다.':s.ending==='child'?'아이는 무사히 가족에게 돌아갔다. 약초는 절반밖에 남지 않았지만, 마을 사람들은 당신에게 따뜻한 밥을 내주었다.':'약초 꾸러미는 무사했다. 아이도 살아 돌아왔지만, 이솔은 다친 팔을 감춘 채 말이 없었다.','수련처로 돌아오는 길, 낮에 쓴 힘의 감각이 되살아났다. 잘한 일과 놓친 일이 함께 떠올랐다.','스승은 결과를 듣고도 바로 평가하지 않았다. 대신 질문 하나를 건넸다.'],quote:'“오늘의 너에게, 내일의 너는 무엇을 더해 주고 싶으냐?”',choices:[option('resolve-control','위태로운 순간에도 흔들리지 않는 호흡','제어 +1 · 고른 숨 습득'),option('resolve-skill','망설임을 끝낼 수 있는 한 번의 동작','숙련 +1 · 첫 궤적 습득'),option('resolve-insight','힘을 쓰기 전에 위험을 알아보는 눈','통찰 +1 · 읽는 흐름 습득')]};
 case 'ending':return {chapter:4,title:'이제, 당신의 길이 시작된다',text:[`명부에 이름을 적던 날, 당신은 길이 없는 제자였다. 이제 ${s.name}에게는 ${pathName(s)}과 ${s.element}의 결, 그리고 스스로 얻은 첫 기술이 있다.`,s.ending==='together'?'힘을 나누는 선택이 두 가지를 함께 지켰다. 이솔은 다음 심부름도 당신과 가겠다고 했다.':s.ending==='child'?'당신은 손에 쥔 물건보다 사람을 먼저 붙들었다. 마을의 아이는 당신의 이름을 오래 기억할 것이다.':'당신은 많은 이에게 필요한 약을 지켰다. 다친 이솔과 나눠야 할 이야기는 아직 남아 있다.','산 너머 청운문에서 낯선 자들이 승천지를 묻고 다닌다는 소문이 들려왔다. 여울원에서의 작은 시작은, 곧 한뉘의 더 큰 흐름과 만날 것이다.'],choices:[option('next-chapter','다음 이야기로 나아간다','첫 번째 의뢰 · 탐험과 성장 시작')]};
 default:throw new Error('알 수 없는 장면');
 }
}
export function choose(state,id){return enforceGrowth(chooseAction(enforceGrowth(structuredClone(state)),id));}
function chooseAction(state,id){
 const s=structuredClone(state);const current=scene(s);const c=current.choices.find(x=>x.id===id);if(!c||c.disabled)throw new Error('선택할 수 없습니다.');
 s.journal.push({scene:current.title,choice:c.title});s.last='';
 if(s.scene==='ending'&&id==='next-chapter')return startJourney(s);
 if(s.journey&&journeyScene(s))return journeyChoose(s,id);
 switch(s.scene){
 case 'arrival':if(id==='observe'){s.insight++;s.last='수련자마다 숨의 흐름이 다르다는 것을 알아차렸다. · 통찰 +1';}else{remember(s,'first-help');s.last='이솔이 당신의 이름을 기억했다. · 관계에 첫 만남 기록';}s.scene='spring';break;
 case 'spring':s.trial=id==='try-inner'?'inner':'outer';s.scene='commit';break;
 case 'commit':if(id==='switch'){s.trial=s.trial==='inner'?'outer':'inner';}else{s.path=s.trial;s.control++;s.scene='element';s.last=`${pathName(s)}이 열렸다. · 제어 +1`;}break;
 case 'element':s.element=elements[Number(id.split('-')[1])];s.scene='weapon';s.last=`타고난 ${s.element}의 결이 응답했다.`;break;
 case 'weapon':s.weapon=weapons[Number(id.split('-')[1])];s.skill++;s.scene='practice';s.last=`${s.weapon}의 첫 감각을 익혔다. · 숙련 +1`;break;
 case 'practice':s.training++;if(id==='partner'){s.insight++;remember(s,'shared-practice');s.hp=Math.min(10,s.hp+1);}else{s[id]++;}if(id==='control')s.energy=Math.min(6,s.energy+1);if(id==='skill')s.hp--;s.last={control:'작은 흐름이 안정되었다. · 제어 +1',skill:'반복한 동작이 몸에 남았다. · 숙련 +1, 체력 -1',insight:'그늘 아래와 샘가의 숨은 달랐다. · 통찰 +1',partner:'이솔과 서로의 약점을 짚었다. · 통찰 +1, 체력 +1 · 함께 수련한 경험 기록'}[id];if(s.training===3)s.scene='first-lesson';break;
 case 'first-lesson':grantAbility(s,id.slice(5));s.scene='mission';s.last=abilities(s).find(a=>a.id===id.slice(5)).name+' 습득 · 자동 장착';break;
 case 'mission':{let advantage=false;if(id==='read'){s.energy--;advantage=s.insight>=2;s.last=advantage?'수풀에 숨은 두 번째 그림자를 먼저 발견했다. · 선점 획득':'낯선 흐름을 살피는 동안 상대가 다가왔다. · 숨 -1';}if(id==='guard'){remember(s,'held-line');s.flags.push('guarded');s.last='이솔이 다리로 달려가는 동안 적을 가로막았다. · 첫 보호막 +2';}if(id==='rush'){s.hp--;advantage=s.skill>=2;s.last=advantage?'익힌 발디딤으로 먼저 유리한 자리를 잡았다. · 체력 -1, 선점 획득':'거리를 좁혔지만 상대도 칼을 뽑았다. · 체력 -1';}if(advantage)s.flags.push('advantage');s.scene='combat';break;}
 case 'combat':{const battle=beginBattle(s);if(s.flags.includes('guarded'))battle.battle.playerShield=2;return battle;}
 case 'battle':if(s.battle.outcome==='defeat'){s.hp=1;s.flags.push('injured');s.last='이솔이 상처를 묶어 주었다. · 체력 1로 여정 계속';}else{s.last=s.battle.outcome==='victory'?'첫 실전을 이겨 냈다. 남은 힘을 살펴야 한다.':'무너지는 다리에서 물러났다.';}s.scene='bridge';break;
 case 'bridge':if(id==='both'){s.energy--;s.ending='together';remember(s,'shared-rescue');s.last='둘이 함께 아이와 약초를 지켰다. · 숨 -1 · 함께 구한 경험 기록';}else if(id==='child'){s.ending='child';remember(s,'child-rescue');s.last='아이를 구했다. 약초 일부가 계곡으로 떨어졌다.';}else{s.ending='herbs';s.flags.push('isol-injured');remember(s,'isol-injured');s.last='약초와 아이는 무사했지만, 이솔이 팔을 다쳤다. · 관계에 사건 기록';}s.scene='night';break;
 case 'night':{const stat=id.replace('resolve-','');s[stat]++;s.flags.push('art-'+stat);grantAbility(s,'signature');s.scene='ending';s.last='첫 깨달음을 얻었다. · '+{control:'제어',skill:'숙련',insight:'통찰'}[stat]+' +1';break;}
 }
 return s;
}
export function art(s){const learned=abilityCatalog(s).find(a=>a.id==='signature');if(learned)return learned.name;const mode=s.flags.find(x=>x.startsWith('art-')&&x!=='art-trust')?.slice(4);return mode==='control'?`${s.element}결 · 고른 숨`:mode==='insight'?`${s.element}결 · 읽는 흐름`:`${s.element}결 · ${s.weapon==='맨손'?'첫 장타':s.weapon+'의 첫 궤적'}`;}
