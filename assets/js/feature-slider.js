(() => {
 const track=document.querySelector('.feature-slider');
 const buttons=[...document.querySelectorAll('[data-slide]')];
 if(!track)return;
 const cards=[...track.querySelectorAll('article')];
 function select(id){const card=document.getElementById(id);if(!cards.includes(card))return;track.scrollTo({left:card.offsetLeft,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
 buttons.forEach(button=>button.addEventListener('click',()=>select(button.dataset.slide)));
 const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting&&entry.intersectionRatio>.6)buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.slide===entry.target.id)));}},{root:track,threshold:[.6]});cards.forEach(c=>observer.observe(c));
 track.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight'].includes(event.key))return;event.preventDefault();let i=buttons.findIndex(b=>b.getAttribute('aria-pressed')==='true');select(cards[Math.max(0,Math.min(cards.length-1,i+(event.key==='ArrowRight'?1:-1)))].id);});
 window.addEventListener('hashchange',()=>select(location.hash.slice(1)));
 if(['sleep','voice','tracking'].includes(location.hash.slice(1)))select(location.hash.slice(1));
})();