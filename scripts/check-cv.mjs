import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const lib=require('../assets/vendor/libphonenumber-max.js');
function setup({fail=false,params='',stored={}}={}){
 const els=new Map(),timers=[],events=[],requests=[],nav=[];
 function el(id){if(!els.has(id))els.set(id,{value:'',textContent:'',checked:false,hidden:false,disabled:false,attrs:{},listeners:{},addEventListener(k,f){const prev=this.listeners[k];this.listeners[k]=prev?(...a)=>{prev(...a);return f(...a)}:f},setAttribute(k,v){this.attrs[k]=v},removeAttribute(k){delete this.attrs[k]},getAttribute(k){return this.attrs[k]},focus(){this.focused=true},replaceChildren(){}});return els.get(id)}
 const form=el('gift-form'),button=el('submit');form.querySelector=()=>button;
 const radios=['愛知県','岐阜県','三重県','静岡県'].map((v,i)=>{const r=el('region-'+i);r.value=v;r.checked=i===0;return r});form.querySelectorAll=()=>radios;
 const values={name:'TEST_ローカル検証',kana:'テスト',region:'愛知県',building:'なし',internet:'未利用',phone:'090-2345-6789',email:'test@example.invalid',postal:'4600001',address:'愛知県名古屋市中区栄1-1',building:''};
 for(const [k,v] of Object.entries(values))el('apply-'+k).value=v;
 el('apply-consent').checked=true;
 const storage=new Map(Object.entries(stored));
 class FD extends Map{constructor(){super();for(const [k,v] of Object.entries(values))this.set(k==='phone'?'tel':k,el('apply-'+k).value);for(const [id,v]of els)if(id.startsWith('trk-'))this.set(id.slice(4),v.value)}append(k,v){this.set(k,v)}}
 const context={document:{getElementById:el,referrer:'https://example.com/from?email=private'},location:{search:params,pathname:'/index.html',origin:'https://example.com',hash:'',assign:u=>nav.push(u)},sessionStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},URL,URLSearchParams,Date,Math,JSON,Set,Map,AbortController,FormData:FD,Option:function(){},setTimeout:(f,ms)=>{timers.push({f,ms});return timers.length},clearTimeout:()=>{},addEventListener:()=>{},crypto:{randomUUID:()=> 'TEST-ID'},libphonenumber:lib,dataLayer:events,fetch:async(url,opts)=>{requests.push({url,opts});if(fail)throw Error('network');return {type:'opaque'}}};
 context.window=context;vm.createContext(context);
 for(const file of ['cv-config.js','application.js'])vm.runInContext(fs.readFileSync('assets/js/'+file,'utf8'),context);
 return {context,el,button,form,requests,events,nav,timers,submit:()=>form.listeners.submit({preventDefault(){}})};
}

let s=setup({params:'?utm_source=google&gclid=test-id&email=private'});await s.submit();await s.submit();assert.equal(s.requests.length,1);assert.equal(s.events.length,1);
assert.equal(s.requests[0].url,'https://hooks.zapier.com/hooks/catch/12525485/49bda9w/');
assert.equal(s.requests[0].opts.mode,'no-cors');assert.equal(s.requests[0].opts.body.get('building'),'');
assert.equal(s.requests[0].opts.body.get('address'),'愛知県名古屋市中区栄1-1');assert.equal(s.requests[0].opts.body.get('region'),'愛知県');
assert.equal(s.requests[0].opts.body.get('gclid'),'test-id');assert(!s.requests[0].opts.body.get('source_url').includes('email='));
assert.equal(s.events[0].event,'form_submit_cv');assert(!JSON.stringify(s.events).includes('test@example'));
s.events[0].eventCallback();s.timers.find(t=>t.ms===1800).f();assert.deepEqual(s.nav,['thanks.html#sent']);
s=setup({fail:true});await s.submit();assert.equal(s.events.length,0);assert.equal(s.button.disabled,false);
for(const key of ['name','kana','phone','email','region','postal','address','internet']){s=setup();s.el('apply-'+key).value='';await s.submit();assert.equal(s.requests.length,0);}
s=setup();s.el('apply-consent').checked=false;await s.submit();assert.equal(s.requests.length,0);
for(const file of ['index.html','fv-alt.html','company.html','privacy.html','thanks.html']){const h=fs.readFileSync(file,'utf8');assert.equal((h.match(/GTM-KMR3S26K/g)||[]).length,2);assert(!h.includes('class="local-notice"'));assert(!h.includes("connect-src 'none'"));}

s=setup();s.el('apply-region').value='';await s.submit();assert(s.el('region-error').textContent);
s=setup();s.context.fetch=async()=>({ok:true,json:async()=>({status:200,results:[{address1:'愛知県',address2:'名古屋市中区',address3:'栄'}]})});
s.el('apply-address').value='';s.el('apply-postal').listeners.input();await s.timers.find(t=>t.ms===450).f();assert.equal(s.el('apply-address').value,'愛知県名古屋市中区栄');assert.equal(s.el('apply-region').value,'愛知県');await s.submit();assert(s.el('address-error').textContent.includes('番地'));
s.el('apply-address').value='手入力済みの住所';s.el('apply-postal').listeners.input();await s.timers.filter(t=>t.ms===450).at(-1).f();assert.equal(s.el('apply-address').value,'手入力済みの住所');
s.context.fetch=async()=>{throw Error('offline')};s.el('apply-postal').listeners.input();await s.timers.filter(t=>t.ms===450).at(-1).f();assert(s.el('postal-status').textContent.includes('手入力'));
console.log('PASS: optional building, required region, postal autofill, append street number, preserve edits, network failure; all requests mocked');
