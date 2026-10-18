// Shared by combat resolution and the player-facing explanations.
export const isAttack=id=>['weapon','element','signature','chain','infused','tempest'].includes(id);
export function attackPower(s,a,base,stored=0,hit=0){
 const rank=a.rank||0;
 if(s.path==='outer'){
  const boost=(a.id==='signature'?5+s.control:a.id==='tempest'?3+s.control:4+s.control+s.insight*.5)+rank*1.5;
  return (base+boost)*(hit>0?.55:1);
 }
 const boost=(a.id==='signature'?4+Math.max(s.control,s.skill):['infused','tempest'].includes(a.id)?3+s.control+s.skill*.5:a.id==='element'?2+s.control+s.insight*.5:2+s.skill*.5)+rank*1.5;
 return base+boost+stored*2+(s.element==='번개'?1:0);
}
export const attackHits=(s,a)=>s.path==='outer'?(a.id==='tempest'?3:a.id==='chain'||(a.id==='signature'&&s.flags.includes('art-skill'))?2:1):(a.id==='element'?1:a.id==='tempest'?3:s.weapon==='맨손'||a.id==='chain'?2:1);
export const shieldPower=(s,a,stored=0)=>s.path==='outer'?(['counter','flow-counter'].includes(a.id)?2:3)+(a.rank||0):({counter:2,'flow-counter':3,guard:3,aegis:5}[a.id]||0)+(a.rank||0)+stored;
export const recoveryPower=(s,a)=>a.id==='focus'?3+(a.rank||0):s.path==='outer'?2+(a.rank||0):4+(a.rank||0);
