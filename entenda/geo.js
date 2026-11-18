function mrel(el){var r=document.getElementById('ossos');return r.getCTM().inverse().multiply(el.getCTM())}
function aplica(m,x,y){return[m.a*x+m.c*y+m.e,m.b*x+m.d*y+m.f]}
function bbRel(g){var b=g.getBBox(),m=mrel(g),c=[aplica(m,b.x,b.y),aplica(m,b.x+b.width,b.y),aplica(m,b.x,b.y+b.height),aplica(m,b.x+b.width,b.y+b.height)],xs=c.map(function(q){return q[0]}),ys=c.map(function(q){return q[1]}),x0=Math.min.apply(null,xs),y0=Math.min.apply(null,ys);return{x:x0,y:y0,width:Math.max.apply(null,xs)-x0,height:Math.max.apply(null,ys)-y0}}
function eixoDe(g){var pts=[];g.querySelectorAll('path').forEach(function(p){var L=p.getTotalLength();if(!L)return;var m=mrel(p);for(var i=0;i<6;i++){var q=p.getPointAtLength(L*i/5);pts.push(aplica(m,q.x,q.y))}});
 var n=pts.length,cx=0,cy=0;pts.forEach(function(q){cx+=q[0];cy+=q[1]});cx/=n;cy/=n;var sxx=0,syy=0,sxy=0;pts.forEach(function(q){var dx=q[0]-cx,dy=q[1]-cy;sxx+=dx*dx;syy+=dy*dy;sxy+=dx*dy});
 var ang=.5*Math.atan2(2*sxy,sxx-syy),u=[Math.cos(ang),Math.sin(ang)];if(u[1]<0)u=[-u[0],-u[1]];var nn=[-u[1],u[0]],mn=1e9,mx=-1e9,ws=0;
 pts.forEach(function(q){var t=(q[0]-cx)*u[0]+(q[1]-cy)*u[1],o=(q[0]-cx)*nn[0]+(q[1]-cy)*nn[1];if(t<mn)mn=t;if(t>mx)mx=t;ws+=o*o});
 var a=[cx+u[0]*mn,cy+u[1]*mn],b=[cx+u[0]*mx,cy+u[1]*mx];return{a:a,b:b,u:u,n:nn,L:mx-mn,w:Math.max(5,Math.sqrt(ws/n)*1.5),bb:bbRel(g)}}
function ponto(e,t){return[e.a[0]+(e.b[0]-e.a[0])*t,e.a[1]+(e.b[1]-e.a[1])*t]}
function mais(p,v,k){return[p[0]+v[0]*k,p[1]+v[1]*k]}
function P(q){return q[0].toFixed(1)+' '+q[1].toFixed(1)}
function zig(e,t,amp,cor){var c=ponto(e,t),pts=[],N=7;for(var i=0;i<=N;i++){var o=-e.w*1.2+i*(e.w*2.4/N),z=(i%2?amp:-amp);pts.push(mais(mais(c,e.n,o),e.u,z))}
 return'<path class="traco" d="M'+pts.map(P).join(' L')+'" stroke="'+(cor||'#ff3b2f')+'" stroke-width="'+Math.max(.9,e.w*.09)+'" fill="none" filter="url(#bloom)"/>'}
function barra(a,b,w){return'<path d="M'+P(a)+' L'+P(b)+'" stroke="#1b1f26" stroke-width="'+(w+1)+'" stroke-linecap="round"/><path d="M'+P(a)+' L'+P(b)+'" stroke="#ffffff" stroke-width="'+w+'" stroke-linecap="round"/>'}
function parafuso(c,d,len,w){var a=mais(c,d,-len/2),b=mais(c,d,len/2),h=barra(a,b,w),n=Math.floor(len/(w*1.1));for(var i=1;i<n;i++){var p=mais(a,d,i*len/n),nn=[-d[1],d[0]];h+='<path d="M'+P(mais(p,nn,-w*.62))+' L'+P(mais(mais(p,nn,w*.62),d,w*.35))+'" stroke="#9aa4b2" stroke-width="'+(w*.18)+'"/>'}
 return h+'<circle cx="'+a[0].toFixed(1)+'" cy="'+a[1].toFixed(1)+'" r="'+(w*.95)+'" fill="#fff" stroke="#1b1f26" stroke-width="'+(w*.2)+'"/>'}
function artefatos(c,r){var h='';for(var i=0;i<10;i++){var an=i*Math.PI/10,d=[Math.cos(an),Math.sin(an)];h+='<path class="artef" d="M'+P(mais(c,d,-r))+' L'+P(mais(c,d,r))+'"/>'}return h}

/* figura muscular (unidades da imagem 361x542) e ajuste do esqueleto a ela */
var MJ={right:{ombro:[113,125],cotovelo:[98,200],punho:[82,260],mao:[75,284],quadril:[152,262],joelho:[140,372],tornozelo:[136,482],pe:[133,509]},left:{ombro:[249,125],cotovelo:[264,200],punho:[280,260],mao:[287,284],quadril:[210,262],joelho:[222,372],tornozelo:[226,482],pe:[229,509]}};
var MJS={m:MJ,f:{"right":{"ombro":[131,133],"cotovelo":[117,203],"punho":[98,262],"mao":[88,281],"quadril":[156,262],"joelho":[145,371],"tornozelo":[143,485],"pe":[140,513]},"left":{"ombro":[231.8,133],"cotovelo":[245.8,203],"punho":[264.8,262],"mao":[274.8,281],"quadril":[206.8,262],"joelho":[217.8,371],"tornozelo":[219.8,485],"pe":[222.8,513]}}};
function mp(q){return[+(q[0]*1.5585-80.05).toFixed(1),+(q[1]*1.5585-2.85).toFixed(1)]}
function im(x,y){return[(x+80.05)/1.5585,(y+2.85)/1.5585]}
function sim(A,B,A2,B2){var v=[B[0]-A[0],B[1]-A[1]],w=[B2[0]-A2[0],B2[1]-A2[1]],s=Math.hypot(w[0],w[1])/Math.hypot(v[0],v[1]),t=Math.atan2(w[1],w[0])-Math.atan2(v[1],v[0]),c=s*Math.cos(t),d=s*Math.sin(t);
 return[c,d,-d,c,A2[0]-(c*A[0]-d*A[1]),A2[1]-(d*A[0]+c*A[1])]}
function ajustarEsqueleto(){var R=document.getElementById('ossos'),EX={};R.querySelectorAll('[data-bone]').forEach(function(g){EX[chave(g)]=eixoDe(g)});
 function Ex(k,s){return EX[k+(s?'-'+s:'')]}
 function grupos(k,s){return[].filter.call(R.querySelectorAll('[data-bone="'+k+'"]'),function(g){return(!s||g.dataset.side===s)&&!g.parentElement.closest('[data-bone]')})}
 function por(k,s,M){grupos(k,s).forEach(function(g){g.setAttribute('transform','matrix('+M.map(function(v){return v.toFixed(5)}).join(' ')+')')})}
 var Q={};['right','left'].forEach(function(s){var H=Ex('Humerus',s),C=Ex('Carpals',s),F=Ex('Femur',s),Pa=Ex('Patella',s),T=Ex('Tibia',s),T0=MJ[s];
  var o=ponto(H,.03),c=ponto(H,.99),p=[C.bb.x+C.bb.width/2,C.bb.y+C.bb.height/2],q=ponto(F,.04),j=[Pa.bb.x+Pa.bb.width/2,Pa.bb.y+Pa.bb.height/2+4],t=ponto(T,.985);
  var O=mp(T0.ombro),Cc=mp(T0.cotovelo),Pp=mp(T0.punho),Qq=mp(T0.quadril),Jj=mp(T0.joelho),Tt=mp(T0.tornozelo);Q[s]=[q,Qq];
  por('Humerus',s,sim(o,c,O,Cc));var fa=sim(c,p,Cc,Pp);['Radius','Ulna','Hand'].forEach(function(k){por(k,s,fa)});
  var th=sim(q,j,Qq,Jj);por('Femur',s,th);por('Patella',s,th);var sh=sim(j,t,Jj,Tt);['Tibia','Fibula','Foot'].forEach(function(k){por(k,s,sh)});
  Q[s].push(o,O,c,Cc,p,j,Jj,t,Tt,q);Q[s].M={ombro:sim(o,c,O,Cc),cotovelo:fa,punho:fa,quadril:th,joelho:sh,tornozelo:sh};Q[s].P={ombro:o,cotovelo:c,punho:p,quadril:q,joelho:j,tornozelo:t}});
 var oR=Q.right.P.ombro,OR=mp(MJ.right.ombro),kx=(202-OR[0])/(202-oR[0]),sh2=[kx,0,0,1,202-202*kx,Math.max(0,(OR[1]-oR[1])*.5)];
 ['Clavicle','Scapula'].forEach(function(k){grupos(k).forEach(function(g){g.setAttribute('transform','matrix('+sh2.map(function(v){return v.toFixed(5)}).join(' ')+')')})});
 var kr=1+(kx-1)*.45;['Ribs','Sternum','Manubrium'].forEach(function(k){grupos(k).forEach(function(g){g.setAttribute('transform','matrix('+kr.toFixed(4)+' 0 0 1 '+(202-202*kr).toFixed(3)+' 0)')})});
 var sw=(Q.left[1][0]-Q.right[1][0])/(Q.left[0][0]-Q.right[0][0]),dy=(Q.left[1][1]+Q.right[1][1]-Q.left[0][1]-Q.right[0][1])/2,cx=(Q.left[0][0]+Q.right[0][0])/2,cx2=(Q.left[1][0]+Q.right[1][0])/2,pv=[sw,0,0,1,cx2-cx*sw,dy];
 ['PelvicGirdle','Sacrum','Coccyx'].forEach(function(k){grupos(k).forEach(function(g){g.setAttribute('transform','matrix('+pv.join(' ')+')')})});
 [].forEach.call(R.querySelectorAll('path'),function(pa){if(pa.closest('[data-bone]'))return;var b=pa.getBBox(),cx=b.x+b.width/2,cy=b.y+b.height/2,best=null;if(b.width>45){pa.style.display='none';return}['right','left'].forEach(function(s){for(var k in Q[s].P){var d=Math.hypot(Q[s].P[k][0]-cx,Q[s].P[k][1]-cy);if(!best||d<best[0])best=[d,Q[s].M[k]]}});if(best&&best[0]<40)pa.setAttribute('transform','matrix('+best[1].map(function(v){return v.toFixed(5)}).join(' ')+')')});
 grupos('LumbarVertebrae').forEach(function(g){g.setAttribute('transform','translate(0 '+(dy/2).toFixed(2)+')')})}
