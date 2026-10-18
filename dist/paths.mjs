export const fusionNames=s=>s.path==='outer'?{infused:'공명유성','flow-counter':'역류봉인',aegis:'잔향성역',tempest:'삼중회류진'}:{infused:({'맨손':'칠맥붕권','검':'유맥검','도':'열맥도','창':'관류창','활':'쇄류시','지팡이':'진맥봉'})[s.weapon]||'유맥격','flow-counter':'회류반격',aegis:'호신결벽',tempest:'만류연환'};
export const pathInfo=s=>s.path==='outer'?{
 name:'끌어 쓰는 길',resource:'주변 숨',cycle:'인도 → 주문 준비 → 발동 · 유지',
 summary:'매 행동에 주변 숨이 1 유입됩니다. 공격 주문은 한 행동 동안 준비한 뒤 발동하며, 영역과 교란으로 싸웁니다. 피해 3 이상의 강타나 감전은 준비 중인 주문을 끊습니다.'
}:{
 name:'쌓는 길',resource:'내부 숨',cycle:'기본 동작 → 축기 → 순간 방출',
 summary:'기본 공격·방어로 축기를 최대 3 쌓습니다. 기술을 쓰면 축기를 모두 방출해 타격이나 호신을 강화합니다. 기술은 준비 없이 즉시 발동합니다.'
};
export function ensurePathState(s){
 if(!s.battle)return null;
 if(!s.battle.pathState&&s.path==='outer'&&s.battle.counter){s.battle.enemy.disrupted=s.battle.counterElement?2:1;s.battle.counter=false;s.battle.counterElement=false;}
 s.battle.pathState??={mode:s.path,vigor:0,casting:null,field:null,renewal:0,release:0};
 return s.battle.pathState;
}
export function adaptArt(s,a){
 const outer=s.path==='outer';
 const weaponNames={맨손:'수인탄',검:'검궤 유도탄',도:'분열도탄',창:'관통 술창',활:'유도시',지팡이:'회류탄'};
 const outerNames={weapon:weaponNames[s.weapon],element:'영역 전개',counter:'흐름 교란',signature:{'art-control':'머무는 숨','art-skill':'궤적 공명','art-insight':'술식 파훼'}[s.flags.find(f=>/^art-(control|skill|insight)$/.test(f))]||'머무는 숨',guard:'흐름 장막',focus:'외기 인도',chain:'분기 투사',mend:'생기 순환',infused:'매개 공명','flow-counter':'술식 역류',aegis:'머무는 결계',tempest:'연쇄 술진'};
 const outerDescriptions={
  weapon:'한 행동 준비 후 투사체 발동 · '+({맨손:'수인으로 적의 위력을 약화',검:'검의 궤적으로 방어 관통',도:'도탄 적중 시 파열 피해 2',창:'술창으로 방어 관통',활:'유도술 명중 보정 +16%',지팡이:'적중 시 보호막 2'})[s.weapon],
  element:'한 행동 준비 후 영역 형성 · 적의 두 행동 동안 속성 상태를 다시 부여합니다',
  counter:'즉시 교란 · 다음 적 행동의 강타·반격 준비를 막음 · 보호막 2',
  signature:'한 행동 준비 후 고유 주문 · 깨달음에 따라 결계·다중 투사·파훼로 분화',
  guard:'즉시 보호막 3 · 준비 중인 주문을 지킬 장막',
  focus:'주변 숨 3 회복 · 축기를 쌓지 않음',
  chain:'한 행동 준비 후 두 투사체 · 서로 독립적으로 명중 판정',
  mend:'즉시 순환술 · 다음 세 행동 시작에 체력 2씩 회복',
  infused:'한 행동 준비 후 관통 주문 · 적의 두 행동 동안 공명 영역 유지',
  'flow-counter':'즉시 술식 역류 · 다음 두 적 행동의 강타·반격 준비 차단 · 속성 상태 부여',
  aegis:'즉시 보호막 3 · 다음 세 적 행동에 보호막 1씩 보충',
  tempest:'한 행동 준비 후 세 투사체 · 세 행동 지속 영역 형성'
 };
 const innerDescriptions={weapon:a.description,element:'즉시 발경 · 축기 1당 추가 위력 2 · 적중 시 속성 상태 부여',counter:'즉시 호신 · 보호막 2에 축기만큼 추가 · 맞받아치는 물리 반격',signature:'즉시 고유 무공 · 축기를 순간 방출해 강한 타격',guard:'즉시 보호막 3에 축기만큼 추가',focus:'내부 숨 3 회복 · 축기 2 축적',chain:'즉시 연속 타격 · 두 번째는 절반 위력 · 축기를 모두 방출',mend:'즉시 체력 4 회복 · 몸 안의 숨으로 상처 조율',infused:'즉시 무기와 결의 합격 · 축기를 모두 실어 강한 타격','flow-counter':'즉시 보호막 3에 축기만큼 추가 · 반격에 속성 상태를 실음',aegis:'즉시 보호막 5에 축기만큼 추가',tempest:'즉시 세 번 이어치는 무공 · 축기를 모두 방출'};
 const mode=outer?(['counter','flow-counter'].includes(a.id)?'disrupt':['guard','aegis'].includes(a.id)?'ward':a.id==='focus'?'focus':a.id==='mend'?'renew':'cast'):'instant';
 const fusion=fusionNames(s);
 const name=fusion[a.id]?fusion[a.id]:outer?(outerNames[a.id]||a.name):a.ingredients&&!a.name.startsWith(s.element+'결 · ')?s.element+'결 · '+a.name:a.name;
 const labels=outer?{weapon:'매개 투사술',element:'영역 전개',counter:'흐름 교란',guard:'흐름 장막',chain:'분기 투사',infused:'매개 공명'}:{weapon:'무기 기술',element:'결의 발경',counter:'간파 반격',guard:'기초 수비',chain:'연속격',infused:'결을 실은 일격'};
 return {...a,name:outer&&s.element?s.element+'결 · '+name:name,kind:outer?(mode==='cast'?'준비 주문':mode==='disrupt'?'교란술':mode==='ward'?'결계술':mode==='renew'?'유지 회복술':'인도술'):a.kind,
  description:(outer?outerDescriptions:innerDescriptions)[a.id]||a.description,mode,
  ...(a.ingredients?{labels:a.ingredients.map(id=>fusion[id]||labels[id]||id)}:{}),
  ...(outer&&a.id==='chain'?{stat:'control',min:2,requirement:'제어 2'}:{})};
}
