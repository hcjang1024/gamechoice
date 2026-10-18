import {routeTemplate} from './routes.mjs';
// Game-only side story. The player remains an outside messenger, not a Cheongunmun initiate.
export const secondStops=routeTemplate(2);
export const secondZones=[
 {id:'alley',name:'산문 아래 뒷골목',subtitle:'사라지는 독침',image:'cheongun',art:'bandit',danger:'독침',description:'사람들이 떠난 골목에서 가느다란 침이 돌바닥에 박혔다. 추적자는 정면으로 오래 싸우지 않고 독이 퍼질 틈을 노린다.',enemy:{name:'골목의 독침꾼',element:'나무',hp:35,attack:3,defense:1,speed:6,evasion:.1,weapon:'독침',heavyEvery:3,heavyBonus:2},reward:{xp:6,gold:8,ore:1},clue:'독침 통에서 잘린 푸른 끈이 나왔다. 수로 쪽에서도 같은 끈을 보았다는 사람이 있었다.'},
 {id:'canal-sentry',name:'청운문 바깥 수로',subtitle:'기다리는 술식',image:'cheongun',art:'seal-mage',danger:'시전',description:'푸른 부적이 수면 위에 떠 있다. 추적자는 물의 숨을 모아 주문을 준비한다. 연결이 완성되기 전에 끊거나, 방어를 마련해야 한다.',enemy:{name:'푸른 부적의 추적자',element:'물',hp:46,attack:3,defense:1,speed:3,weapon:'수인',heavyEvery:99,castEvery:3,castPower:3,castName:'수로의 결박'},reward:{xp:8,gold:10,ore:2},clue:'추적자의 부적은 청운문의 인장이 아니었다. 누군가 수문 밖에서 문파의 표식을 흉내 내고 있었다.'},
 {id:'sealkeeper',name:'잠긴 수문의 술진',subtitle:'잘린 인장의 주인',image:'cheongun',art:'seal-mage',danger:'보스',description:'인장을 끊어 붙인 술사가 수문을 막았다. 주기적으로 보호막을 다시 만들고, 준비한 물의 주문을 내리꽂는다. 그가 청운문으로 들어가기 전에 길을 열어야 한다.',enemy:{name:'절인술사',element:'물',hp:68,attack:4,defense:2,speed:4,weapon:'인장 지팡이',heavyEvery:99,castEvery:3,castPower:4,castName:'끊어진 수맥',shield:4,wardEvery:4,wardAmount:5},reward:{xp:14,gold:20,ore:4},clue:'수문의 술진이 풀리고 밀서를 전할 길이 열렸다. 낯선 자들이 승천지의 위치를 찾고 있었다는 사실이 청운문에 전해졌다.'}
];
export const campaignFor=s=>(s.journey?.chapter||1)===2?{
 id:2,title:'청운문 아래, 끊어진 인장',short:'청운문 아래',image:'cheongun',boss:'sealkeeper',bossName:'절인술사',bossArt:'seal-mage',
 intro:'도시와 산이 맞닿은 청운문 아래. 외부에서 온 당신은 밀서를 전달할 길을 찾는다.',success:'수문을 막은 술사를 물리쳤다. 이제 청운문에 경고를 전할 수 있다.',failure:'수문을 여는 데 실패했다. 이 챕터의 시작 상태로 돌아가 선택을 바꿀 수 있다.'
}:{
 id:1,title:'사라진 전령',short:'첫 번째 의뢰',image:'courtyard',boss:'pass',bossName:'봉쇄대의 우두머리',bossArt:'leader',
 intro:'전령을 찾아가는 길.',success:'제한된 여정 끝에서 전령을 구했다. 이 챕터의 전투와 방문은 모두 끝났다.',failure:'고갯길의 보스를 넘지 못했다. 새 선택으로 다시 도전할 수 있지만, 이번 도전의 보상과 성장은 챕터 시작 상태로 되돌아간다.'
};
export const secondEvents={
 'city-ledger':{title:'장터에 남은 장부 한 장',text:['약재상이 빈 수레 옆에서 찢어진 장부를 맞추고 있었다. 밀서를 숨긴 품을 본 그는 목소리를 낮췄다. “산문 앞에 낯선 사람들이 서성여. 이 끈을 봤다면 조심하게.”'],choices:[
  {id:'copy',title:'남은 장부에서 낯선 이름을 찾아본다',effects:{insight:1,xp:3},result:'수레가 드나든 시간을 읽었다. · 통찰 +1, 경험 +3'},
  {id:'carry',title:'약재상의 짐을 안전한 곳까지 옮긴다',effects:{hp:-2,gold:10,ore:1},result:'무거운 짐을 옮기고 품삯을 받았다. · 체력 -2, 엽전 +10, 강화석 +1'},
  {id:'medicine',title:'다친 행상에게 남는 물자가 있는지 묻는다',effects:{herbs:1,tonic:1},result:'남은 보급품을 나누어 받았다. · 약초 +1, 응급 회복탕 +1'}]},
 watermarks:{title:'덧붙인 인장',text:['수로의 돌기둥에 청운문의 표식이 어긋나 있었다. 그 위에 다른 종이가 덧붙어 물의 흐름을 잡아당겼다. 힘으로 뜯을 수도, 연결된 자국을 살필 수도 있다.'],choices:[
  {id:'trace',title:'숨을 보내 덧붙인 종이의 연결을 읽는다',effects:{energy:-2,intel:'cut-seal'},result:'보호막으로 이어지는 가짜 인장의 연결을 읽었다. · 숨 -2, 보스 보호막과 재생 약화'},
  {id:'retrieve',title:'돌틈으로 내려가 떨어진 금속 조각을 줍는다',effects:{hp:-3,gold:8,ore:2},result:'돌틈에서 술식의 재료를 건졌다. · 체력 -3, 엽전 +8, 강화석 +2'},
  {id:'follow',title:'흐트러진 물소리에 호흡을 맞춘다',effects:{control:1,xp:3},result:'낯선 흐름을 다스리는 감각을 익혔다. · 제어 +1, 경험 +3'}]},
 'isol-watch':{title:'밤을 나누어 지키는 법',text:['이솔이 등불을 낮추고 수문 쪽을 바라보았다. 물이 흐르는 소리 사이로 종이가 스치는 소리가 섞였다. 경계를 나눌지, 잠깐 쉬어 갈지 정해야 했다.'],choices:[
  {id:'together',title:'이솔과 번갈아 주변의 움직임을 살핀다',effects:{intel:'shared-watch',relation:'shared-watch'},result:'이솔과 주문이 모이는 순간을 알아냈다. · 함께 경계한 기록, 보스 주문 추가 위력 -1'},
  {id:'practice',title:'등불 밖에서 발디딤을 다시 맞춰 본다',effects:{hp:-2,skill:1,xp:4},result:'어둠 속 발디딤을 익혔다. · 체력 -2, 숙련 +1, 경험 +4'},
  {id:'sit',title:'이솔 곁에 앉아 잠깐 숨을 고른다',effects:{hp:4,energy:2},result:'이솔과 등불을 지키며 쉬었다. · 체력 +4, 숨 +2'}]}
};
