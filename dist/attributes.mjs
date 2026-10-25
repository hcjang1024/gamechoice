export const ATTRIBUTE_CAP=60,MAX_HEALTH=999,RATE_CAP=.6;
export const clamp=(n,min,max)=>Math.max(min,Math.min(max,Number(n)||0));
export const attributeNames={skill:'근력',insight:'민첩',control:'지능',charisma:'매력'};
export function permanentAttribute(s,key){return clamp(s[key],0,ATTRIBUTE_CAP);}
export function combatAttribute(s,key){return permanentAttribute(s,key)+(s.scene==='battle'?(s.battle?.abilityState?.attributes?.[key]||0):0);}
export function permanentRates(s){return {critical:clamp(.08+permanentAttribute(s,'insight')*.015+(s.criticalBonus||0),0,RATE_CAP),evasion:clamp(permanentAttribute(s,'insight')*.025+(s.element==='바람'?.12:0)+(s.evasionBonus||0),0,RATE_CAP),burn:clamp(s.resistances?.burn,0,RATE_CAP),poison:clamp(s.resistances?.poison,0,RATE_CAP),bleed:clamp(s.resistances?.bleed,0,RATE_CAP)};}
export function resistanceFor(s,id){const base=permanentRates(s)[id]||0;return clamp(base+(s.scene==='battle'?(s.battle?.abilityState?.resistances?.[id]||0):0),0,1);}
export function normalizeAttributes(s){for(const key of Object.keys(attributeNames))s[key]=permanentAttribute(s,key);s.healthBonus=clamp(s.healthBonus,0,MAX_HEALTH);s.criticalBonus=clamp(s.criticalBonus,0,RATE_CAP);s.evasionBonus=clamp(s.evasionBonus,0,RATE_CAP);s.resistances??={burn:0,poison:0,bleed:0};for(const key of ['burn','poison','bleed'])s.resistances[key]=clamp(s.resistances[key],0,RATE_CAP);return s;}
