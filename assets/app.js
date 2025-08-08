async function loadData(){
  const res = await fetch('./data/prices.json?_=' + Date.now());
  const data = await res.json();
  return data;
}
function formatDate(d){ const dt = new Date(d); return dt.toISOString().slice(0,10); }
function setLastUpdated(data){
  const max = data.reduce((m, r)=> Math.max(m, new Date(r.date_observed).getTime()), 0);
  const el = document.getElementById('last-updated');
  el.textContent = '最后更新：' + new Date(max).toLocaleString();
}
function initFilters(data){
  const gpuSet = Array.from(new Set(data.map(d=>d.gpu_model))).sort();
  const sel = document.getElementById('gpuFilter');
  gpuSet.forEach(g=>{ const opt = document.createElement('option'); opt.value=g; opt.textContent=g; sel.appendChild(opt); });
}
function renderTable(data){
  const tbody = document.querySelector('#priceTable tbody');
  tbody.innerHTML = '';
  const q = document.getElementById('search').value.trim().toLowerCase();
  const gf = document.getElementById('gpuFilter').value;
  const pf = document.getElementById('pricingFilter').value;
  const filtered = data.filter(d=>{
    const txt = (d.provider + ' ' + d.region + ' ' + d.gpu_model + ' ' + d.instance_type).toLowerCase();
    if(q && !txt.includes(q)) return false;
    if(gf && d.gpu_model !== gf) return false;
    if(pf && d.pricing_type !== pf) return false;
    return true;
  });
  for(const r of filtered){
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${formatDate(r.date_observed)}</td>
      <td>${r.provider}</td>
      <td>${r.region||''}</td>
      <td>${r.gpu_model}</td>
      <td>${r.pricing_type}</td>
      <td>${r.instance_type||''}</td>
      <td>${r.quantity_gpus??''}</td>
      <td>${r.price_usd_per_hr?.toFixed(2)}</td>
      <td>${r.bandwidth_notes||''}</td>
      <td>${r.commitment_terms||''}</td>
      <td>${r.source_url?`<a href="${r.source_url}" target="_blank">link</a>`:''}</td>
      <td>${r.notes||''}</td>`;
    tbody.appendChild(tr);
  }
}
function summarize(data){
  const byGpu = {};
  for(const r of data){
    if(!byGpu[r.gpu_model]) byGpu[r.gpu_model] = [];
    byGpu[r.gpu_model].push(r.price_usd_per_hr);
  }
  const labels = Object.keys(byGpu);
  const medians = labels.map(k=>{
    const arr = byGpu[k].slice().sort((a,b)=>a-b);
    const m = arr.length%2===0 ? (arr[arr.length/2-1]+arr[arr.length/2])/2 : arr[(arr.length-1)/2];
    return +m.toFixed(2);
  });
  const mins = labels.map(k=> Math.min(...byGpu[k]));
  const maxs = labels.map(k=> Math.max(...byGpu[k]));
  return {labels, medians, mins, maxs};
}
function renderCharts(data){
  const {labels, medians, mins, maxs} = summarize(data);
  const medianCtx = document.getElementById('medianChart').getContext('2d');
  new Chart(medianCtx, {
    type:'bar',
    data:{ labels, datasets:[{ label:'中位数(USD/小时)', data:medians }] },
    options:{ responsive:true, plugins:{ legend:{ display:true } } }
  });
  const rangeCtx = document.getElementById('rangeChart').getContext('2d');
  new Chart(rangeCtx, {
    type:'bar',
    data:{ labels, datasets:[
      { label:'最低价', data:mins },
      { label:'最高价', data:maxs }
    ]},
    options:{ responsive:true, plugins:{ legend:{ display:true } } }
  });
}
async function main(){
  const data = await loadData();
  document.getElementById('year').textContent = new Date().getFullYear();
  setLastUpdated(data);
  initFilters(data);
  renderTable(data);
  renderCharts(data);
  document.getElementById('search').addEventListener('input', ()=>renderTable(data));
  document.getElementById('gpuFilter').addEventListener('change', ()=>renderTable(data));
  document.getElementById('pricingFilter').addEventListener('change', ()=>renderTable(data));
}
document.addEventListener('DOMContentLoaded', main);
