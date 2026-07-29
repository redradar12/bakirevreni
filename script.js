const $=s=>document.querySelector(s);const overlay=$('#overlay'),drawer=$('#cartDrawer'),search=$('#searchModal'),menu=$('#mobileMenu');let cart=[];try{const s=localStorage.getItem('cart');if(s)cart=JSON.parse(s)}catch(e){}const saveCart=()=>{try{localStorage.setItem('cart',JSON.stringify(cart))}catch(e){}};const $btn=s=>{const e=$(s);return e||{onclick(){}}};const $on=(s,ev,fn)=>{const e=$(s);if(e)e[ev]=fn};
function closeAll(){if(overlay)overlay.classList.remove('show');if(drawer)drawer.classList.remove('open');if(search)search.classList.remove('open');if(menu)menu.classList.remove('open')}
$btn('#cartBtn').onclick=()=>{drawer.classList.add('open');overlay.classList.add('show')};$btn('#searchBtn').onclick=()=>{search.classList.add('open');overlay.classList.add('show');setTimeout(()=>$('#searchInput').focus(),250)};$btn('#menuBtn').onclick=()=>{menu.classList.add('open');overlay.classList.add('show')};overlay.onclick=closeAll;document.querySelectorAll('[data-close],.mobile-menu a').forEach(e=>e.onclick=closeAll);
const toast=$('#toast');function say(text){toast.textContent=text;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2400)}
function updateTotal(){const t=cart.reduce((s,i)=>s+i.price*(i.qty||1),0);const el=$('#totalPrice');if(el)el.textContent='₺'+t.toFixed(2);const ct=$('#cartTotal');if(ct)ct.style.display=cart.length?'block':'none'}
function drawCart(){const holder=$('#cartItems');if(!holder)return;holder.innerHTML=cart.length?cart.map((p,i)=>`<div class="cart-row"><span>${p.name}</span><span style="font-weight:600">₺${(p.price*(p.qty||1)).toFixed(2)}</span><button aria-label="Sil" class="remove" data-i="${i}">×</button></div>`).join(''):'<p class="empty">Sepetiniz henüz boş.</p>';$('#cartCount').textContent=cart.length;updateTotal();updateCartBar();saveCart();document.querySelectorAll('.remove').forEach(b=>b.onclick=()=>{cart.splice(b.dataset.i,1);drawCart()})}
function updateCartBar(){const bar=$('#mobileCartBar');if(!bar)return;const t=cart.reduce((s,i)=>s+i.price*(i.qty||1),0);const cnt=cart.reduce((s,i)=>s+(i.qty||1),0);$('#mcbCount').textContent=cnt;$('#mcbTotal').textContent='₺'+t.toFixed(2);bar.classList.toggle('mcb-show',cart.length>0)}
function addToCart(name,price){cart.push({name,price,qty:1});drawCart();say(name+' sepete eklendi.')}
document.querySelectorAll('.add').forEach(b=>b.onclick=()=>addToCart(b.dataset.product,parseFloat(b.dataset.price||'0')));document.querySelectorAll('.wish').forEach(b=>b.onclick=()=>{b.textContent=b.textContent==='♡'?'♥':'♡';b.style.color=b.textContent==='♥'?'#a85d38':''});
$on('#newsletterForm','onsubmit',e=>{e.preventDefault();$('#formMessage').textContent='Teşekkürler! E-posta adresiniz kaydedildi.';e.target.reset()});$on('#searchInput','oninput',e=>{if(e.target.value.length>2)say('Arama sonuçları ürün kataloğu bağlandığında gösterilecektir.')});
$on('#checkoutBtn','onclick',()=>{if(!cart.length){say('Sepetiniz boş.');return}const f=$('#paymentForm');if(f.style.display==='block'){f.style.display='none';$('#checkoutBtn').textContent='Ödemeye geç'}else{f.style.display='block';$('#checkoutBtn').textContent='◀ Geri'}});
$on('#payBtn','onclick',async()=>{if(!$('#kvkkCheck')||!$('#kvkkCheck').checked){say('KVKK metnini onaylamalısınız.');return}const cname=($('#custName')&&$('#custName').value||'').trim();const email=$('#custEmail').value.trim(),phone=$('#custPhone').value.trim(),address=$('#custAddress').value.trim(),city=$('#custCity').value.trim();if(!email||!phone||!address||!city){say('Adres ve iletişim bilgilerini eksiksiz girin.');return}if(location.protocol==='file:'){say('Siteyi canlı adresten veya local server ile açın (file:// çalışmaz).');return}$('#payBtn').disabled=true;$('#payStatus').textContent='iyzico\'ya yönlendiriliyor…';const nameParts=(cname||email.split('@')[0]||'Musteri').split(/\s+/);const buyer={name:nameParts[0]||'Musteri',surname:nameParts.slice(1).join(' ')||nameParts[0]||'Musteri',email,phone,address,city};const cb=location.origin.replace(/\/$/,'')+'/odeme-sonuc.html';try{const r=await fetch(SB_URL+'/functions/v1/iyzico-pay',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+SB_KEY,'apikey':SB_KEY},body:JSON.stringify({cart:cart.map(i=>({name:i.name,price:i.price,qty:i.qty||1})),buyer,callbackUrl:cb})});const j=await r.json();const payUrl=j.paymentPageUrl||j.checkoutFormUrl;if(j.status==='success'&&payUrl){sessionStorage.setItem('pendingCart',JSON.stringify(cart));sessionStorage.setItem('pendingBuyer',JSON.stringify({...buyer,name:cname||buyer.name}));localStorage.removeItem('cart');window.location.href=payUrl}else{$('#payStatus').textContent='Hata: '+(j.errorMessage||j.error||'Ödeme başlatılamadı.');$('#payBtn').disabled=false}}catch(e){$('#payStatus').textContent='Bağlantı hatası: '+e.message;$('#payBtn').disabled=false}});

function renderProducts(products,gridId='#productGrid'){const sel=(typeof gridId==='string'&&gridId.charAt(0)==='#')?gridId:'#'+gridId;const grid=$(sel);if(!grid)return;const safe=(v,field,def)=>{if(v==null)return def;return v[field]!==undefined?v[field]:(v[field.toLowerCase()]!==undefined?v[field.toLowerCase()]:def)};const store=window._pd=window._pd||{};grid.innerHTML=products.map(v=>{const b=v.badge||'';const img=v.image_url||v.image||v.imageUrl||'assets/copperware.jpg';const price=(v.price||v.price===0)?Number(v.price).toFixed(2):'0.00';const oldp=(v.old_price||v.old_price===0)?Number(v.old_price).toFixed(2):'';const id=v.id||v.name||Math.random();store[id]=v;return `<article class="product" data-id="${id}"><div class="product-photo${b?'':' image-product'}">${b?`<span class="badge">${b}</span>`:''}<button class="wish">♡</button><img src="${img}" alt="${v.name||''}"></div><div class="product-info"><p class="product-type">${v.type||''}</p><h3>${v.name||'İsim yok'}</h3><p class="price">₺${price}${oldp?`<del>₺${oldp}</del>`:''}</p><button class="add" data-product="${(v.name||'').replace(/"/g,'&quot;')}" data-price="${price}">Sepete ekle <span>+</span></button></div></article>`}).join('');document.querySelectorAll('.add').forEach(b=>b.onclick=function(e){e.stopPropagation();addToCart(this.dataset.product,parseFloat(this.dataset.price))});document.querySelectorAll('.wish').forEach(b=>b.onclick=function(e){e.stopPropagation();this.textContent=this.textContent==='♡'?'♥':'♡';this.style.color=this.textContent==='♥'?'#a85d38':''});document.querySelectorAll('.product[data-id]').forEach(a=>a.onclick=function(){showProduct(this.dataset.id)})}
const SB_URL='https://xjmyqadcqpaxlbpfnzja.supabase.co',SB_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqbXlxYWRjcXBheGxicGZuemphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyNjA1ODgsImV4cCI6MjEwMDgzNjU4OH0.q_UJivzLt-UPJZ90AfkSXx1fRByNtf1GMjcUmV-1HJs';
const SB_HEAD={'apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY,'Content-Type':'application/json'};
async function sbGet(path){try{const r=await fetch(SB_URL+'/rest/v1/'+path,{headers:SB_HEAD});if(!r.ok)return null;return await r.json()}catch{return null}}
async function loadProducts(url){const p=await sbGet(url);if(!p)return;renderProducts(p)}

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
  const rev=m.querySelector('.pm-reviews');
  if(rev){const rc=p.review_count||p.reviews||0;rev.textContent=rc?rc+' değerlendirme':'İlk yorumu siz yapın';rev.onclick=null}
  m.querySelector('.pm-add').dataset.product=(p.name||'').replace(/"/g,'&quot;');
  m.querySelector('.pm-add').dataset.price=price;
  const qtyEl=m.querySelector('.pm-qty');
  if(qtyEl)qtyEl.value=1;
  const gal=m.querySelector('.pm-gallery');
  const thumbs=m.querySelector('.pm-thumbs');
  const syncThumbs=(i)=>{if(!thumbs)return;thumbs.querySelectorAll('.pm-thumb').forEach(t=>t.classList.toggle('active',parseInt(t.dataset.i)===i))};
  if(gal&&imgs.length>1){
    const dots=imgs.map((_,i)=>`<span class="pm-dot${i===0?' active':''}" data-i="${i}"></span>`).join('');
    gal.innerHTML=`<button class="pm-gal-btn pm-prev" data-dir="-1">◀</button><div class="pm-dots">${dots}</div><button class="pm-gal-btn pm-next" data-dir="1">▶</button>`;
    gal.style.display='flex';
    if(thumbs)thumbs.innerHTML=imgs.map((s,i)=>`<img src="${s}" class="pm-thumb${i===0?' active':''}" data-i="${i}" alt="">`).join('');
    gal._imgs=imgs;
    gal._idx=0;
    m.querySelector('.pm-img').src=imgs[0];
    gal.querySelectorAll('.pm-dot').forEach(d=>d.onclick=function(){const i=parseInt(this.dataset.i);showGalImg(m,gal,i);syncThumbs(i)});
    gal.querySelectorAll('.pm-gal-btn').forEach(b=>b.onclick=function(){const i=gal._idx+parseInt(this.dataset.dir);if(i>=0&&i<imgs.length){showGalImg(m,gal,i);syncThumbs(i)}});
    if(thumbs)thumbs.querySelectorAll('.pm-thumb').forEach(t=>t.onclick=function(){const i=parseInt(this.dataset.i);showGalImg(m,gal,i);syncThumbs(i)});
  }else{
    if(gal)gal.style.display='none';
    if(thumbs)thumbs.innerHTML='';
  }
  m.classList.add('open');
  if(overlay)overlay.classList.add('show');
}
function showGalImg(m,gal,i){gal._idx=i;m.querySelector('.pm-img').src=gal._imgs[i];gal.querySelectorAll('.pm-dot').forEach(d=>d.classList.toggle('active',parseInt(d.dataset.i)===i))}
$on('#productModal','onclick',function(e){if(e.target===this||e.target.classList.contains('pm-close')){this.classList.remove('open');if(overlay)overlay.classList.remove('show')}});
$on('.pm-add','onclick',function(){const qty=parseInt($('#productModal').querySelector('.pm-qty').value)||1;for(let i=0;i<qty;i++)addToCart(this.dataset.product,parseFloat(this.dataset.price));$('#productModal').classList.remove('open');if(overlay)overlay.classList.remove('show')});document.querySelectorAll('.pm-qty-btn').forEach(b=>b.onclick=function(){const inp=this.parentElement.querySelector('.pm-qty');let v=parseInt(inp.value)||1;v+=this.dataset.dir==='+'?1:-1;if(v<1)v=1;if(v>99)v=99;inp.value=v});
drawCart();