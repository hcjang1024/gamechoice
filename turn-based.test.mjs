import test from 'node:test';
import assert from 'node:assert/strict';
import {initial,migrate,weapons,choose,scene} from './dist/engine.mjs';
import {abilityCatalog,abilities,beginBattle,battleActions,playTurn,settleEnemy,maxEnergy,grantAbility} from './dist/combat.mjs';
import {categoryOf,typeIds} from './dist/skillbook.mjs';
import {manageBuild} from './dist/management.mjs';
import {applyStatus} from './dist/statuses.mjs';
import {grantPassive} from './dist/passives.mjs';
const hero=(path='inner',weapon='검')=>Object.assign(initial('턴제 검증'),{path,weapon,element:'불',control:4,skill:4,insight:3,hp:10,energy:6,learnedSkills:['weapon','counter','focus','signature'],loadout:['weapon','counter','focus','signature'],flags:['art-control']});
const duel=s=>settleEnemy(beginBattle(s,{enemy:{hp:200,attack:1,speed:1,heavyEvery:20}}));
test('all twelve path and weapon builds expose sixteen skills and four per type',()=>{
 for(const path of ['inner','outer'])for(const weapon of weapons){const s=hero(path,weapon),all=abilityCatalog(s);assert.equal(all.length,16);assert.equal(new Set(all.map(a=>a.id)).size,16);for(const type of Object.keys(typeIds))assert.equal(all.filter(a=>a.category===type).length,4);}
});
test('every skill resolves finite resources and effects across twelve builds',()=>{
 for(const path of ['inner','outer'])for(const weapon of weapons)for(const id of Object.values(typeIds).flat()){
  const h=hero(path,weapon);h.learnedSkills.push(id);h.loadout=[id];let s=duel(h);s.battle.round=6;s=playTurn(s,id);if(s.battle.pathState.casting)s=playTurn(s,'release');
  assert.ok([s.hp,s.energy,s.battle.enemy.hp,s.battle.playerShield].every(Number.isFinite),path+' '+weapon+' '+id);assert.ok(s.battle.log.some(e=>e.actor==='player'),path+' '+weapon+' '+id);
 }
});
test('one slot per type replaces its peer, keeps learned skills, and never exceeds four',()=>{
 let s=hero();grantAbility(s,'element');assert.equal(s.loadout.includes('element'),false);s=manageBuild(s,'active','element');assert.deepEqual(s.loadout,['counter','focus','signature','element']);assert.ok(abilities(s).some(a=>a.id==='weapon'));assert.equal(new Set(s.loadout.map(categoryOf)).size,4);s=manageBuild(s,'active','element');assert.equal(s.loadout.length,3);
});
test('manual basic attack cannot silently choose a learned skill and resolves one enemy response',()=>{
 const before=duel(hero()),after=playTurn(before,'basic');assert.equal(after.battle.actor,'player');assert.equal(after.battle.turn-before.battle.turn,2);assert.equal(after.energy,before.energy);assert.equal(after.battle.pathState.vigor,1);assert.ok(after.battle.log.some(e=>e.text.startsWith('베기')));assert.ok(!after.battle.log.some(e=>e.skill===abilities(before)[0].name));assert.deepEqual(before,duel(hero()));
});
test('defense and breathing are deliberate basic actions with distinct resources',()=>{
 let s=duel(hero());s.energy=1;s=playTurn(s,'defend');assert.equal(s.energy,2);assert.equal(s.battle.pathState.vigor,1);s=playTurn(s,'breathe');assert.equal(s.energy,4);assert.equal(s.battle.pathState.vigor,2);
});
test('manual attacks consume energy and lock cooldowns until other turns pass',()=>{
 let s=duel(hero());s=playTurn(s,'weapon');assert.equal(s.energy,4);assert.ok(battleActions(s).find(a=>a.id==='weapon').disabled);assert.throws(()=>playTurn(s,'weapon'));for(let i=0;i<2;i++)s=playTurn(s,'breathe');assert.equal(battleActions(s).find(a=>a.id==='weapon').disabled,false);assert.equal(s.energy,6);
});
test('outer spells require explicit release, and guarding preserves a pending spell',()=>{
 let s=duel(hero('outer'));s=playTurn(s,'weapon');assert.equal(s.battle.enemy.hp,200);assert.equal(s.battle.pathState.casting.id,'weapon');s=playTurn(s,'defend');assert.equal(s.battle.pathState.casting.id,'weapon');s=playTurn(s,'release');assert.equal(s.battle.pathState.casting,null);assert.ok(s.battle.enemy.hp<200);assert.equal(s.battle.pathState.vigor,0);
});
test('shock blocks skills and release without blocking basic defense',()=>{
 const s=duel(hero('outer'));applyStatus(s,'player','shock');assert.ok(battleActions(s).find(a=>a.id==='weapon').disabled);assert.throws(()=>playTurn(s,'weapon'));const next=playTurn(s,'defend');assert.equal(next.battle.statuses.player.shock,undefined);
});
test('free actions spend energy once without an enemy turn and cannot be repeated',()=>{
 let s=hero();s.learnedSkills.push('stance');s.loadout=['weapon','counter','stance','signature'];s=duel(s);s.battle.round=3;const turn=s.battle.turn;s=playTurn(s,'stance');assert.equal(s.battle.turn,turn);assert.equal(s.energy,5);assert.equal(s.battle.empower,6);assert.equal(s.battle.skillUses.stance,1);assert.throws(()=>playTurn(s,'stance'));s=playTurn(s,'basic');assert.equal(s.battle.empower,0);assert.equal(s.battle.turn,turn+2);
});
test('ultimate preparation and battle use limits cannot be bypassed',()=>{
 let s=duel(hero());assert.throws(()=>playTurn(s,'signature'));s.battle.round=2;s=playTurn(s,'signature');s.battle.cooldowns.signature=0;s.energy=6;s=playTurn(s,'signature');s.battle.cooldowns.signature=0;s.energy=6;assert.equal(s.battle.skillUses.signature,2);assert.throws(()=>playTurn(s,'signature'));
});
test('water recovery cleanses harmful conditions and fire attacks consume burn',()=>{
 let h=hero();h.element='물';h.learnedSkills.push('mend');h.loadout=['mend'];let s=duel(h);s.hp=4;applyStatus(s,'player','poison');applyStatus(s,'player','burn');s=playTurn(s,'mend');assert.deepEqual(s.battle.statuses.player,{});assert.ok(s.hp>4);
 h=hero();h.learnedSkills.push('chain');h.loadout=['chain'];s=duel(h);applyStatus(s,'enemy','burn',{stacks:3,extend:true});s=playTurn(s,'chain');assert.deepEqual(s.battle.statuses.enemy,{});assert.ok(s.battle.enemy.hp<200);
});
test('manual battles survive reload identically and cannot mutate build mid-fight',()=>{
 for(const path of ['inner','outer']){let s=playTurn(duel(hero(path)),'weapon');const restored=migrate(JSON.parse(JSON.stringify(s)));assert.deepEqual(restored,s);assert.deepEqual(playTurn(s,path==='outer'?'release':'breathe'),playTurn(restored,path==='outer'?'release':'breathe'));assert.throws(()=>manageBuild(s,'active','counter'));}
});
test('victory restores breath, accepts no more actions, and preserves result progression',()=>{
 let s=duel(hero());s.battle.enemy.hp=1;s.energy=1;s.battle.stats.accuracy=1;s.battle.seed=1;s=playTurn(s,'basic');assert.equal(s.battle.outcome,'victory');assert.equal(s.energy,maxEnergy(s));assert.deepEqual(battleActions(s),[]);assert.throws(()=>playTurn(s,'basic'));assert.ok(scene(s).choices.some(c=>c.id==='continue'));s=choose(s,'continue');assert.equal(s.scene,'bridge');
});
test('conditional passives trigger at battle start, deliberate defense, and every third action',()=>{
 const h=hero();for(const id of ['passive-first-ward','passive-composure','passive-circulation'])grantPassive(h,id);
 let s=duel(h);assert.equal(s.battle.playerShield,3);s.hp=5;s.energy=0;s=playTurn(s,'defend');assert.equal(s.hp,6);assert.equal(s.energy,1);s=playTurn(s,'basic');s=playTurn(s,'basic');assert.equal(s.energy,2);assert.equal(s.battle.passiveTurns,3);
 const plain=duel(hero());assert.equal(plain.battle.playerShield,0);plain.hp=5;assert.equal(playTurn(plain,'defend').hp,5);
});
