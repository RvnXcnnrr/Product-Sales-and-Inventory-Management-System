const s=(e,t)=>{try{window.dispatchEvent(new CustomEvent(e,{detail:t}))}catch{}},p=(e,t)=>{const n=o=>t==null?void 0:t(o.detail);return window.addEventListener(e,n),()=>window.removeEventListener(e,n)};export{s as d,p as o};
//# sourceMappingURL=eventBus-DPsVa6OD.js.map
