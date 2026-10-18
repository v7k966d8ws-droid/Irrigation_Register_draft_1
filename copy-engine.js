/* Build 1.9.34 — standalone, pure irrigation schedule copying engine */
(function(root){
'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
const products=r=>Array.isArray(r.fertilizers)?r.fertilizers.slice():[r.fertilizer||'Water Only'];
const minutes=s=>{const a=String(s||'0:00').split(':').map(Number);return a[0]*60+(a[1]||0)};
function ordered(operations){
 const base=minutes(operations[0]?.start), withOrder=operations.map((r,i)=>({r,i,t:Number.isFinite(Number(r.nightOffset))&&r.nightOffset!==undefined?minutes(r.start)+1440*Number(r.nightOffset):minutes(r.start)+(minutes(r.start)<base?1440:0)}));
 return withOrder.sort((a,b)=>a.t-b.t||a.i-b.i).map(x=>x.r);
}
function groups(records,farm,limit=5){
 const map=new Map();for(const r of records){if(r.farm!==farm||!r.date||!r.outlets?.length)continue;const key=r.scheduleGroup?`group:${r.scheduleGroup}`:`legacy:${r.date}|${r.farm}`;if(!map.has(key))map.set(key,[]);map.get(key).push(r)}
 return [...map.values()].map(ordered).sort((a,b)=>b[0].date.localeCompare(a[0].date)||minutes(b[0].start)-minutes(a[0].start)).slice(0,limit);
}
function copy(source,destinationDate,newId){
 if(!source?.length||!/^\d{4}-\d\d-\d\d$/.test(destinationDate))throw Error('Invalid irrigation set or destination date');
 const farm=source[0].farm;if(source.some(r=>r.farm!==farm))throw Error('Mixed farms cannot be copied');
 const orderedSource=ordered(source);let last=-1;
 return orderedSource.map(r=>{
  const v=clone(r);let day=Number.isFinite(Number(r.nightOffset))&&r.nightOffset!==undefined?Number(r.nightOffset):0;
  let elapsed=minutes(r.start)+day*1440;while(elapsed<last){day++;elapsed+=1440}last=elapsed;
  return {...v,id:newId(),scheduleGroup:undefined,date:destinationDate,farm,sourceId:r.id,sourceDate:r.date,nightOffset:day,fertilizers:products(r),executionStatus:'scheduled',recordedAt:null,linked:false};
 });
}
root.DD34CopyEngine=Object.freeze({groups,copy,ordered});
})(typeof window!=='undefined'?window:globalThis);
