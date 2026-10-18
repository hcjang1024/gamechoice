export function hashSeed(text){let n=2166136261;for(const c of String(text))n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0||1;}
export function seeded(seed){let n=typeof seed==='number'?seed>>>0:hashSeed(seed);return ()=>{n^=n<<13;n^=n>>>17;n^=n<<5;return (n>>>0)/4294967296;};}
export function sample(pool,count,random){const left=[...pool],out=[];while(left.length&&out.length<count)out.push(left.splice(Math.floor(random()*left.length),1)[0]);return out;}

