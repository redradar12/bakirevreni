const $=s=>document.querySelector(s);const overlay=$('#overlay'),drawer=$('#cartDrawer'),search=$('#searchModal'),menu=$('#mobileMenu');let cart=[];let paymentMethod='card';try{const s=localStorage.getItem('cart');if(s)cart=JSON.parse(s)}catch(e){}const saveCart=()=>{try{localStorage.setItem('cart',JSON.stringify(cart))}catch(e){}};const $btn=s=>{const e=$(s);return e||{onclick(){}}};const $on=(s,ev,fn)=>{const e=$(s);if(e)e[ev]=fn};
function closeAll(){if(overlay)overlay.classList.remove('show');if(drawer)drawer.classList.remove('open');if(search)search.classList.remove('open');if(menu)menu.classList.remove('open')}
$btn('#cartBtn').onclick=()=>{drawer.classList.add('open');overlay.classList.add('show')};$btn('#searchBtn').onclick=()=>{search.classList.add('open');overlay.classList.add('show');setTimeout(()=>$('#searchInput').focus(),250)};$btn('#menuBtn').onclick=()=>{menu.classList.add('open');overlay.classList.add('show')};overlay.onclick=closeAll;document.querySelectorAll('[data-close],.mobile-menu a').forEach(e=>e.onclick=closeAll);document.querySelectorAll('.pay-method-opt').forEach(b=>b.onclick=function(){document.querySelectorAll('.pay-method-opt').forEach(o=>o.classList.remove('active'));this.classList.add('active');paymentMethod=this.dataset.method;updateTotal();const pb=$('#payBtn');if(pb)pb.textContent=paymentMethod==='havale'?'Havale ile Öde':'iyzico ile Öde'});
const toast=$('#toast');function say(text){toast.textContent=text;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2400)}
function updateTotal(){const t=cart.reduce((s,i)=>s+i.price*(i.qty||1),0);const dt=paymentMethod==='havale'?t*0.8:t;const el=$('#totalPrice');if(el)el.textContent='₺'+dt.toFixed(2);const gt=$('#grandTotal');if(gt)gt.textContent='₺'+dt.toFixed(2);const ct=$('#cartTotal');if(ct)ct.style.display=cart.length?'block':'none';const hd=$('#havaleDiscount');if(hd)hd.style.display=cart.length&&paymentMethod==='havale'?'flex':'none'}
function drawCart(){const holder=$('#cartItems');if(!holder)return;holder.innerHTML=cart.length?cart.map((p,i)=>`<div class="cart-row"><span>${p.name}</span><span style="font-weight:600">₺${(p.price*(p.qty||1)).toFixed(2)}</span><button aria-label="Sil" class="remove" data-i="${i}">×</button></div>`).join(''):'<p class="empty">Sepetiniz henüz boş.</p>';$('#cartCount').textContent=cart.length;updateTotal();updateCartBar();saveCart();document.querySelectorAll('.remove').forEach(b=>b.onclick=()=>{cart.splice(b.dataset.i,1);drawCart()})}
function updateCartBar(){const bar=$('#mobileCartBar');if(!bar)return;const t=cart.reduce((s,i)=>s+i.price*(i.qty||1),0);const dt=paymentMethod==='havale'?t*0.8:t;const cnt=cart.reduce((s,i)=>s+(i.qty||1),0);$('#mcbCount').textContent=cnt;$('#mcbTotal').textContent='₺'+dt.toFixed(2);bar.classList.toggle('mcb-show',cart.length>0)}
function addToCart(name,price){cart.push({name,price,qty:1});drawCart();say(name+' sepete eklendi.')}
document.querySelectorAll('.add').forEach(b=>b.onclick=()=>addToCart(b.dataset.product,parseFloat(b.dataset.price||'0')));document.querySelectorAll('.wish').forEach(b=>b.onclick=()=>{b.textContent=b.textContent==='♡'?'♥':'♡';b.style.color=b.textContent==='♥'?'#a85d38':''});
$on('#newsletterForm','onsubmit',e=>{e.preventDefault();$('#formMessage').textContent='Teşekkürler! E-posta adresiniz kaydedildi.';e.target.reset()});$on('#searchInput','oninput',e=>{if(e.target.value.length>2)say('Arama sonuçları ürün kataloğu bağlandığında gösterilecektir.')});
$on('#checkoutBtn','onclick',()=>{if(!cart.length){say('Sepetiniz boş.');return}const f=$('#paymentForm');if(f.style.display==='block'){f.style.display='none';$('#checkoutBtn').innerHTML='<span>Ödemeye geç</span><i class="ch-arrow">→</i>';$('#havaleInfo').style.display='none';$('#payBtn').style.display='';const pm=$('.pay-methods');if(pm)pm.style.display=''}else{f.style.display='block';$('#checkoutBtn').innerHTML='<span>Geri</span><i class="ch-arrow">←</i>'}});
$on('#payBtn','onclick',async()=>{if(paymentMethod==='havale'){if(!$('#kvkkCheck')||!$('#kvkkCheck').checked){say('KVKK metnini onaylamalısınız.');return}const ht=cart.reduce((s,i)=>s+i.price*(i.qty||1),0)*0.8;const hn='BK'+Date.now().toString(36).toUpperCase()+Math.random().toString(36).slice(2,5).toUpperCase();const cnm=($('#custName')&&$('#custName').value||'').trim()||'Müşteri';$('#hName').textContent=cnm||'Onur [SOYAD]';$('#hIban').textContent='TR00 0000 0000 0000 0000 0000 00';$('#hRef').textContent=hn;$('#hAmount').textContent='₺'+ht.toFixed(2)+' (%20 indirimli)';$('#havaleInfo').style.display='block';$('#payBtn').style.display='none';$('.pay-methods').style.display='none';return}if(!$('#kvkkCheck')||!$('#kvkkCheck').checked){say('KVKK metnini onaylamalısınız.');return}const cname=($('#custName')&&$('#custName').value||'').trim();const email=$('#custEmail').value.trim(),phone=$('#custPhone').value.trim(),address=$('#custAddress').value.trim(),province=$('#custProvince').value.trim(),district=$('#custDistrict').value.trim();if(!email||!phone||!address||!province||!district){say('Adres ve iletişim bilgilerini eksiksiz girin.');return}const city=district+'/'+province;if(location.protocol==='file:'){say('Siteyi canlı adresten veya local server ile açın (file:// çalışmaz).');return}$('#payBtn').disabled=true;$('#payStatus').textContent='iyzico\'ya yönlendiriliyor…';const nameParts=(cname||email.split('@')[0]||'Musteri').split(/\s+/);const buyer={name:nameParts[0]||'Musteri',surname:nameParts.slice(1).join(' ')||nameParts[0]||'Musteri',email,phone,address,city,province,district};const cb=location.origin.replace(/\/$/,'')+'/odeme-sonuc.html';try{const r=await fetch(SB_URL+'/functions/v1/iyzico-pay',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+SB_KEY,'apikey':SB_KEY},body:JSON.stringify({cart:cart.map(i=>({name:i.name,price:i.price,qty:i.qty||1})),buyer,callbackUrl:cb})});const j=await r.json();const payUrl=j.paymentPageUrl||j.checkoutFormUrl;if(j.status==='success'&&payUrl){sessionStorage.setItem('pendingCart',JSON.stringify(cart));sessionStorage.setItem('pendingBuyer',JSON.stringify({...buyer,name:cname||buyer.name}));localStorage.removeItem('cart');window.location.href=payUrl}else{$('#payStatus').textContent='Hata: '+(j.errorMessage||j.error||'Ödeme başlatılamadı.');$('#payBtn').disabled=false}}catch(e){$('#payStatus').textContent='Bağlantı hatası: '+e.message;$('#payBtn').disabled=false}});$on('#havaleDone','onclick',async()=>{const nm=($('#custName')&&$('#custName').value||'').trim();const em=($('#custEmail')&&$('#custEmail').value||'').trim();const ph=($('#custPhone')&&$('#custPhone').value||'').trim();const ad=($('#custAddress')&&$('#custAddress').value||'').trim();const pr=($('#custProvince')&&$('#custProvince').value||'').trim();const di=($('#custDistrict')&&$('#custDistrict').value||'').trim();const ht=cart.reduce((s,i)=>s+i.price*(i.qty||1),0)*0.8;const hn=$('#hRef').textContent;try{await fetch(SB_URL+'/rest/v1/orders',{method:'POST',headers:{...SB_HEAD,'Prefer':'return=minimal'},body:JSON.stringify({order_no:hn,customer_name:nm||'Belirtilmedi',email:em,phone:ph,address:ad,city:di+'/'+pr,payment_method:'havale',amount:ht,items:cart.map(i=>({name:i.name,price:i.price,qty:i.qty||1})),status:'pending'})})}catch(e){console.log('havale order error',e)}say('Siparişiniz alındı! IBAN\'a ödeme yaptıktan sonra işleme alınacak.');cart=[];drawCart();$('#havaleInfo').style.display='none';$('#paymentForm').style.display='none';$('#checkoutBtn').innerHTML='<span>Ödemeye geç</span><i class="ch-arrow">→</i>';$('#payBtn').style.display='';const pm=$('.pay-methods');if(pm)pm.style.display='';paymentMethod='card';updateTotal();closeAll()});function renderProducts(products,gridId='#productGrid'){const sel=(typeof gridId==='string'&&gridId.charAt(0)==='#')?gridId:'#'+gridId;const grid=$(sel);if(!grid)return;const safe=(v,field,def)=>{if(v==null)return def;return v[field]!==undefined?v[field]:(v[field.toLowerCase()]!==undefined?v[field.toLowerCase()]:def)};const store=window._pd=window._pd||{};grid.innerHTML=products.map(v=>{const b=v.badge||'';const img=v.image_url||v.image||v.imageUrl||'assets/copperware.jpg';const price=(v.price||v.price===0)?Number(v.price).toFixed(2):'0.00';const oldp=(v.old_price||v.old_price===0)?Number(v.old_price).toFixed(2):'';const id=v.id||v.name||Math.random();store[id]=v;return `<article class="product" data-id="${id}"><div class="product-photo${b?'':' image-product'}">${b?`<span class="badge">${b}</span>`:''}<button class="wish">♡</button><img src="${img}" alt="${v.name||''}"></div><div class="product-info"><p class="product-type">${v.type||''}</p><h3>${v.name||'İsim yok'}</h3><div class="prod-rating" data-pid="${id}">☆☆☆☆☆</div><p class="price">₺${price}${oldp?`<del>₺${oldp}</del>`:''}</p><button class="add" data-product="${(v.name||'').replace(/"/g,'&quot;')}" data-price="${price}">Sepete ekle <span>+</span></button></div></article>`}).join('');document.querySelectorAll('.add').forEach(b=>b.onclick=function(e){e.stopPropagation();addToCart(this.dataset.product,parseFloat(this.dataset.price))});document.querySelectorAll('.wish').forEach(b=>b.onclick=function(e){e.stopPropagation();this.textContent=this.textContent==='♡'?'♥':'♡';this.style.color=this.textContent==='♥'?'#a85d38':''});document.querySelectorAll('.product[data-id]').forEach(a=>a.onclick=function(){showProduct(this.dataset.id)});fetchProductRatings(products)}
const SB_URL='https://xjmyqadcqpaxlbpfnzja.supabase.co',SB_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqbXlxYWRjcXBheGxicGZuemphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyNjA1ODgsImV4cCI6MjEwMDgzNjU4OH0.q_UJivzLt-UPJZ90AfkSXx1fRByNtf1GMjcUmV-1HJs';
const SB_HEAD={'apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY,'Content-Type':'application/json'};
async function sbGet(path){try{const r=await fetch(SB_URL+'/rest/v1/'+path,{headers:SB_HEAD});if(!r.ok)return null;return await r.json()}catch{return null}}
async function loadProducts(url){const p=await sbGet(url);if(!p)return;renderProducts(p)}
function renderProducts(products,gridId='#productGrid'){const sel=(typeof gridId==='string'&&gridId.charAt(0)==='#')?gridId:'#'+gridId;const grid=$(sel);if(!grid)return;const safe=(v,field,def)=>{if(v==null)return def;return v[field]!==undefined?v[field]:(v[field.toLowerCase()]!==undefined?v[field.toLowerCase()]:def)};const store=window._pd=window._pd||{};grid.innerHTML=products.map(v=>{const b=v.badge||'';const img=v.image_url||v.image||v.imageUrl||'assets/copperware.jpg';const price=(v.price||v.price===0)?Number(v.price).toFixed(2):'0.00';const oldp=(v.old_price||v.old_price===0)?Number(v.old_price).toFixed(2):'';const id=v.id||v.name||Math.random();store[id]=v;return `<article class="product" data-id="${id}"><div class="product-photo${b?'':' image-product'}">${b?`<span class="badge">${b}</span>`:''}<button class="wish">♡</button><img src="${img}" alt="${v.name||''}"></div><div class="product-info"><p class="product-type">${v.type||''}</p><h3>${v.name||'İsim yok'}</h3><div class="prod-rating" data-pid="${id}">☆☆☆☆☆</div><p class="price">₺${price}${oldp?`<del>₺${oldp}</del>`:''}</p><button class="add" data-product="${(v.name||'').replace(/"/g,'&quot;')}" data-price="${price}">Sepete ekle <span>+</span></button></div></article>`}).join('');document.querySelectorAll('.add').forEach(b=>b.onclick=function(e){e.stopPropagation();addToCart(this.dataset.product,parseFloat(this.dataset.price))});document.querySelectorAll('.wish').forEach(b=>b.onclick=function(e){e.stopPropagation();this.textContent=this.textContent==='♡'?'♥':'♡';this.style.color=this.textContent==='♥'?'#a85d38':''});document.querySelectorAll('.product[data-id]').forEach(a=>a.onclick=function(){showProduct(this.dataset.id)});fetchProductRatings(products)}
function fetchProductRatings(products){const pids=products.map(v=>v.id).filter(Boolean);if(!pids.length)return;const q=encodeURIComponent(pids.join(','));fetch(SB_URL+'/rest/v1/reviews?select=product_id,rating&product_id=in.('+q+')',{headers:SB_HEAD}).then(r=>r.json()).then(reviews=>{if(!Array.isArray(reviews)||!reviews.length)return;const map={};reviews.forEach(r=>{if(!map[r.product_id])map[r.product_id]=[];map[r.product_id].push(r.rating)});Object.keys(map).forEach(pid=>{const avg=map[pid].reduce((a,b)=>a+b,0)/map[pid].length;const el=document.querySelector(`.prod-rating[data-pid="${pid}"]`);if(el)el.innerHTML=starRating(Math.round(avg))})}).catch(()=>{})}

async function loadCategories(){const cats=await sbGet('categories?select=*&order=sort_order');if(!cats||!cats.length)return;const grid=$('#categoryGrid');if(!grid)return;const groups={},order=[];cats.forEach(c=>{if(!groups[c.group_name]){groups[c.group_name]=[];order.push(c.group_name)}groups[c.group_name].push(c)});let html='';order.forEach(g=>{html+=`<span class="category-group">${g}</span>`;groups[g].forEach(c=>{html+=`<a href="tum-urunler.html?k=${c.slug}" class="category" style="background-image:url(${c.image_url||'assets/copperware.jpg'})"><span>${c.name}</span></a>`})});grid.innerHTML=html}

function showProduct(id){
  const p=window._pd&&window._pd[id];
  if(!p)return;
  const imgs=(p.images&&p.images.length)?p.images:(p.image_url?[p.image_url]:['assets/copperware.jpg']);
  const img=p.image_url||imgs[0]||'assets/copperware.jpg';
  const price=(p.price||p.price===0)?Number(p.price).toFixed(2):'0.00';
  const oldp=(p.old_price||p.old_price===0)?Number(p.old_price).toFixed(2):'';
  const m=$('#productModal');
  if(!m)return;
  m.querySelector('.pm-img').src=img;
  m.querySelector('.pm-img').alt=p.name||'';
  const badge=m.querySelector('.pm-badge');
  if(badge){badge.textContent=p.badge||'';badge.style.display=p.badge?'':'none'}
  m.querySelector('.pm-name').textContent=p.name||'';
  m.querySelector('.pm-type').textContent=p.type||'';
  const disc=m.querySelector('.pm-discount');
  if(disc){
    let pct='';
    if(oldp&&Number(oldp)>Number(price))pct=Math.round((1-Number(price)/Number(oldp))*100);
    if(pct){disc.textContent='−%'+pct;disc.classList.add('show')}else{disc.classList.remove('show')}
  }
  m.querySelector('.pm-price').innerHTML=`₺${price}${oldp?` <del>₺${oldp}</del>`:''}`;
  const fullDesc=p.description||p.desc||'';
  const shortEl=m.querySelector('.pm-short');
  if(shortEl){
    const first=(fullDesc.split(/(?<=[.!?])\s+/)[0])||'';
    if(first&&first.trim().length<fullDesc.trim().length){shortEl.textContent=first;shortEl.classList.add('show')}else{shortEl.classList.remove('show')}
  }
  m.querySelector('.pm-desc').textContent=fullDesc||'Açıklama bulunamadı.';
  const revCount=m.querySelector('.pm-reviews-count');
  if(revCount)revCount.textContent='Yorumlar';
  m.querySelector('.pm-add').dataset.product=(p.name||'').replace(/"/g,'&quot;');
  m.querySelector('.pm-add').dataset.price=price;
  const qtyEl=m.querySelector('.pm-qty');
  if(qtyEl)qtyEl.value=1;
  const gal=m.querySelector('.pm-gallery');
  const thumbs=m.querySelector('.pm-thumbs');
  const syncThumbs=(i)=>{if(!thumbs)return;thumbs.querySelectorAll('.pm-thumb').forEach(t=>t.classList.toggle('active',parseInt(t.dataset.i)===i))};
gal.innerHTML='<button class="pm-gal-btn pm-prev" data-dir="-1">\u2039</button><button class="pm-gal-btn pm-next" data-dir="1">\u203a</button>';gal.style.display='flex';if(thumbs){thumbs.innerHTML=imgs.map((s,i)=>'<img src="'+s+'" class="pm-thumb'+(i===0?' active':'')+'" data-i="'+i+'" alt="">').join('')+'<div class="pm-dots">'+dots+'</div>';thumbs.querySelectorAll('.pm-dot').forEach(d=>d.onclick=function(){const i=parseInt(this.dataset.i);showGalImg(m,gal,i);syncThumbs(i)});thumbs.querySelectorAll('.pm-thumb').forEach(t=>t.onclick=function(){const i=parseInt(this.dataset.i);showGalImg(m,gal,i);syncThumbs(i)})}gal._imgs=imgs;gal._idx=0;m.querySelector('.pm-img').src=imgs[0];gal.querySelectorAll('.pm-gal-btn').forEach(b=>b.onclick=function(){const i=gal._idx+parseInt(this.dataset.dir);if(i>=0&&i<imgs.length){showGalImg(m,gal,i);syncThumbs(i)}})
    if(gal)gal.style.display='none';
    if(thumbs)thumbs.innerHTML='';
  }
  const pid=p.id||id;
  loadReviews(pid,m);
  setupReviewForm(m,pid);
  m.classList.add('open');
  if(overlay)overlay.classList.add('show');
}
function showGalImg(m,gal,i){gal._idx=i;m.querySelector('.pm-img').src=gal._imgs[i];m.querySelectorAll('.pm-dot').forEach(d=>d.classList.toggle('active',parseInt(d.dataset.i)===i))}
function starRating(n){let h='';for(let i=1;i<=5;i++)h+=i<=n?'★':'☆';return h}
async function loadReviews(pid,m){
  const list=m.querySelector('.pm-review-list');if(!list)return;
  list.innerHTML='<p class="pm-rev-empty">Yükleniyor…</p>';
  try{const r=await fetch(SB_URL+'/rest/v1/reviews?product_id=eq.'+pid+'&order=created_at.desc&limit=20',{headers:SB_HEAD});const d=await r.json();
  if(!Array.isArray(d)){list.innerHTML='';return}
  renderReviews(d,m)}
  catch{list.innerHTML=''}
}
function renderReviews(reviews,m){
  const list=m.querySelector('.pm-review-list');if(!list)return;
  const starsEl=m.querySelector('.pm-stars');const countEl=m.querySelector('.pm-reviews-count');
  if(!reviews.length){list.innerHTML='<p class="pm-rev-empty">Henüz değerlendirme yok. İlk yorumu siz yapın!</p>';if(starsEl)starsEl.textContent='☆☆☆☆☆';if(countEl)countEl.textContent='0 değerlendirme';return}
  let total=0;reviews.forEach(r=>total+=r.rating);const avg=(total/reviews.length).toFixed(1);
  if(starsEl)starsEl.textContent=starRating(Math.round(Number(avg)));
  if(countEl)countEl.textContent=reviews.length+' değerlendirme · '+avg;
  list.innerHTML=reviews.map(r=>`<div class="pm-review-item"><div class="pm-review-head"><span class="pm-review-author">${(r.name||'Anonim').replace(/[<>&"]/g,'')}</span><span class="pm-review-stars">${starRating(r.rating)}</span></div><p class="pm-review-text">${(r.comment||'').replace(/[<>&"]/g,'')}</p><span class="pm-review-date">${new Date(r.created_at).toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric'})}</span></div>`).join('')
}
function setupReviewForm(m,pid){
  const pick=m.querySelector('.pm-star-pick');if(!pick)return;
  let rating=0;const stars=pick.querySelectorAll('.pm-star');
  stars.forEach(s=>{s.onclick=()=>{rating=parseInt(s.dataset.v);stars.forEach(t=>t.classList.toggle('on',parseInt(t.dataset.v)<=rating))};s.onmouseenter=()=>stars.forEach(t=>t.classList.toggle('on',parseInt(t.dataset.v)<=parseInt(s.dataset.v)))});
  pick.onmouseleave=()=>stars.forEach(t=>t.classList.toggle('on',parseInt(t.dataset.v)<=rating));
  const submit=m.querySelector('.pm-review-submit');const nameEl=m.querySelector('.pm-review-name');const commentEl=m.querySelector('.pm-review-comment');const msg=m.querySelector('.pm-review-msg');if(!submit)return;
  submit.onclick=async()=>{
    if(!rating){msg.textContent='Lütfen bir yıldız puanı seçin.';msg.className='pm-review-msg err';return}
    const name=nameEl.value.trim();if(!name){msg.textContent='Adınızı girin.';msg.className='pm-review-msg err';return}
    const comment=commentEl.value.trim();if(!comment||comment.length<5){msg.textContent='Yorumunuz en az 5 karakter olmalı.';msg.className='pm-review-msg err';return}
    submit.disabled=true;msg.textContent='Gönderiliyor…';msg.className='pm-review-msg';
    try{const r=await fetch(SB_URL+'/rest/v1/reviews',{method:'POST',headers:{...SB_HEAD,'Prefer':'return=minimal'},body:JSON.stringify({product_id:pid,name,rating,comment})});
    if(!r.ok)throw new Error(await r.text());
    msg.textContent='Yorumunuz eklendi, teşekkürler!';msg.className='pm-review-msg ok';
    nameEl.value='';commentEl.value='';rating=0;stars.forEach(t=>t.classList.remove('on'));
    setTimeout(()=>loadReviews(pid,m),1400)}
    catch(e){msg.textContent='Hata oluştu, tekrar deneyin.';msg.className='pm-review-msg err';submit.disabled=false}
  }
}
$on('#productModal','onclick',function(e){if(e.target===this||e.target.classList.contains('pm-close')){this.classList.remove('open');if(overlay)overlay.classList.remove('show')}});
$on('.pm-add','onclick',function(){const qty=parseInt($('#productModal').querySelector('.pm-qty').value)||1;for(let i=0;i<qty;i++)addToCart(this.dataset.product,parseFloat(this.dataset.price));$('#productModal').classList.remove('open');if(overlay)overlay.classList.remove('show')});document.querySelectorAll('.pm-qty-btn').forEach(b=>b.onclick=function(){const inp=this.parentElement.querySelector('.pm-qty');let v=parseInt(inp.value)||1;v+=this.dataset.dir==='+'?1:-1;if(v<1)v=1;if(v>99)v=99;inp.value=v});
drawCart();