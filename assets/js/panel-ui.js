(() => {
 const toggle = document.querySelector('.menu-toggle');
 const menu = document.querySelector('#header-menu');
 function closeMenu(focus=false){menu.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','メニューを開く');if(focus)toggle.focus()}
 toggle.addEventListener('click',()=>{const open=menu.hidden;menu.hidden=!open;toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'メニューを閉じる':'メニューを開く')});
 menu.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden)closeMenu(true)});
 document.addEventListener('click',e=>{if(!e.target.closest('header'))closeMenu()});
 const root=document.querySelector('.rail-carousel'),slides=[...root.querySelectorAll('.rail-slide')];
 let index=0;
 function show(n){index=(n+slides.length)%slides.length;slides.forEach((s,i)=>{s.classList.toggle('is-active',i===index);s.setAttribute('aria-hidden',String(i!==index))})}
 root.querySelector('.rail-prev').addEventListener('click',()=>show(index-1));
 root.querySelector('.rail-next').addEventListener('click',()=>show(index+1));
 setInterval(()=>show(index+1),4000);
})();
