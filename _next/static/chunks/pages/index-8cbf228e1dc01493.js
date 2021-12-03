(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[405],{5301:function(e,t,n){(window.__NEXT_P=window.__NEXT_P||[]).push(["/",function(){return n(2330)}])},2330:function(e,t,n){"use strict";n.r(t),n.d(t,{default:function(){return Z}});var i=n(5893),s=n(9008),r=n(7294),o=n(3762),l=n(4096),a=n(4115),c=n(3850),h=n(234),d=n(8017),x=n(336),u=n(9444),m=n(8104),g=n(7341),j=n(6729),f=n(6618),p=n(6150),v=n(1121),b=n(7922),y=n(155),w=n(357);class M{constructor(e=0,t=1,n=1,i=1,s=0){this.start=e,this.end=t,this.startWeight=n,this.endWeight=i,this.startLevel=s,this.endLevel=this.startLevel,this.subLevel=0}get size(){return this.end-this.start}get mid(){return this.start+this.size/2}get weightedFraction(){return this.startWeight/(this.startWeight+this.endWeight)}get weightedSplitPoint(){return this.start+this.weightedFraction*this.size}getSplitPoint(e=1){const t=.5*(1-e)+e*this.weightedFraction;return this.start+t*this.size}split(e=1,t=1){const n=this.getSplitPoint(t),i=new M(n,this.end,e,this.endWeight,++this.endLevel);return this.end=n,this.endWeight=e,i}}var S=n(5049),k=n(8711),C=n(5141);function z(e=16,{scheme:t=k.ZP,saturation:n,lightness:i,saturationEnd:s,lightnessEnd:r,start:o=0,end:l=1,offset:a=0,reverse:c=!1,strength:h,midpoint:d=4,steepness:x=1}={}){const u="string"===typeof t?function(e){return S[`interpolate${e}`]}(t):t,m=function(e){return Array.isArray(e)&&e.length>0&&"object"===typeof e[0]&&"start"in e[0]&&"end"in e[0]}(e)?e:O(e,{start:o,end:l,strength:h}),g=m.map((({start:e})=>{const t=function(e,t=0){const n=e+t;return n-Math.floor(n)}(e,a);return u(c?1-t:t)}));return void 0===n&&void 0===i?g:g.map(((e,t)=>{var o,l;const a=m[t],c=(0,C.Ym)(e);return c.s=L(null!==n&&void 0!==n?n:.8,null!==(o=null!==s&&void 0!==s?s:n)&&void 0!==o?o:1,a,d,x),c.l=L(null!==i&&void 0!==i?i:.6,null!==(l=null!==r&&void 0!==r?r:i)&&void 0!==l?l:.4,a,d,x),c.toString()}))}function O(e=10,{start:t=0,end:n=1,strength:i}={}){const s="number"!==typeof e,r=s?e:W(e);void 0===i&&(i=s?1:0);const o=r.length;if(0===o)return[];const l=Math.ceil(Math.log2(o)),a=[new M(t,n,r[0],r[0])];let c=0;for(let h=0;h<l;++h){const e=a.length;for(let t=0;t<e;++t){const e=a[t].split(r[++c],i);if(e.subLevel=t,a.push(e),a.length===o)return a}}return a}function W(e,t=1){return Array.from({length:e},((n,i)=>Math.exp(.25*t*(e-i))))}function L(e,t,n,i=4,s=1){return function(e,t,n){return(1-n)*e+n*t}(e,t,function(e,t=4,n=1){return 1/(1+Math.exp(-n*(e-t)))}(function(e){return e.startLevel+e.subLevel/Math.pow(2,Math.max(0,e.startLevel-1))}(n),i,s))}var P=w.range(100);function E(e){var t=e.intervals,n=e.scheme,s=(e.animate,e.size),r=void 0===s?500:s,o=e.hole,l=void 0===o?.9:o,a=e.margin,c=void 0===a?10:a,h=(r-2*c)/2,d=h*l,x=h-d,u=(h+d)/2,m=Math.pow(2,Math.ceil(Math.log2(t.length))),g=u*Math.PI*1/m-2,j=Math.min(.8*x,g),f=Math.min(16,g),p=g<5?0:2,v=g<5?1:2,b=g<5?2:4,y=g<5?2:3,M=w.scaleLinear().domain([0,1]).range([0,u]),S=w.pie().padAngle(0).sort(null).value((function(){return 1}))(P),k=w.arc().innerRadius(d).outerRadius(h),C=w.scaleLinear().domain([0,1]).range([-Math.PI/2,-Math.PI/2+2*Math.PI]);w.interpolateRgb("#000","#eee");return(0,i.jsx)("div",{children:(0,i.jsx)("svg",{viewBox:"0 0 ".concat(r," ").concat(r),width:r,height:r,children:(0,i.jsx)("g",{transform:"translate(".concat(c,",").concat(c,")"),children:(0,i.jsxs)("g",{strokeWidth:0,transform:"translate(".concat(h,",").concat(h,")"),children:[(0,i.jsx)("circle",{r:h,stroke:"#999",fill:"none",strokeWidth:1}),(0,i.jsx)("circle",{r:d,stroke:"#999",fill:"none",strokeWidth:1}),S.map((function(e,t){return(0,i.jsx)("path",{d:k(e),fill:n(t/P.length)},t)})),t.map((function(e,s){return(0,i.jsxs)("g",{children:[s+1<t.length&&(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)("line",{x1:M(Math.cos(C(e.start))),y1:M(Math.sin(C(e.start))),x2:M(Math.cos(C(t[s+1].start))),y2:M(Math.sin(C(t[s+1].start))),strokeWidth:y,stroke:"#777"}),(0,i.jsx)("line",{x1:M(Math.cos(C(e.start))),y1:M(Math.sin(C(e.start))),x2:M(Math.cos(C(t[s+1].start))),y2:M(Math.sin(C(t[s+1].start))),strokeWidth:y-1,stroke:"white"})]}),(0,i.jsx)("circle",{cx:M(Math.cos(C(e.start))),cy:M(Math.sin(C(e.start))),r:j,stroke:"#777",strokeWidth:b}),(0,i.jsx)("circle",{cx:M(Math.cos(C(e.start))),cy:M(Math.sin(C(e.start))),r:j,fill:n(e.start),stroke:"white",strokeWidth:v}),(0,i.jsx)("text",{x:M(Math.cos(C(e.start))),y:M(Math.sin(C(e.start))),textAnchor:"middle",fill:"white",stroke:"#777",paintOrder:"stroke",strokeWidth:p,fontWeight:"bold",fontSize:f,dy:"0.3em",children:s+1})]},s)}))]})})})})}E.getInitialProps=function(){return{intervals:[],scheme:function(){return"red"}}};var R=n(6640),T=n(3244),I=n(2152),F=n.n(I);function _(e){var t=e.intervals,n=void 0===t?[]:t,s=e.scheme,o=(0,r.useCallback)((function(e){var t;return null===(t=w.color(s(e)))||void 0===t?void 0:t.formatHex()}),[s]);return(0,r.useEffect)((function(){new(F())(".copy-button",{text:function(){return"["+n.map((function(e){return'"'+o(e.start)+'"'})).join(", ")+"]"}})}),[n,o]),(0,i.jsxs)(i.Fragment,{children:[(0,i.jsxs)(d.xu,{align:"left",w:"100%",fontFamily:"monospace",fontSize:"md",p:4,mt:10,borderRadius:5,borderWidth:2,borderColor:"gray.100",shadow:"sm",bg:"gray.50",color:"gray.700",children:["[",n.map((function(e,t){return(0,i.jsxs)(r.Fragment,{children:['"',(0,i.jsx)("span",{style:{color:s(e.start)},children:o(e.start)}),'"',t+1<n.length&&", "]},t)})),"]"]}),(0,i.jsx)(R.z,{size:"sm",className:"copy-button",mt:4,colorScheme:"blue",leftIcon:(0,i.jsx)(T.T,{}),children:"Copy to clipboard"})]})}function U(e){var t=e.colors,n=e.weights,s=void 0===n?void 0:n,r=e.width,o=void 0===r?400:r,l=e.height,a=void 0===l?50:l,c=t.length,h=(0,w.sum)(null!==s&&void 0!==s?s:[1]),d=function(e){return s?s[e]/h:1/c};return(0,i.jsx)("div",{children:t.map((function(e,t){return(0,i.jsx)("div",{style:{display:"inline-block",width:"".concat(d(t)*o,"px"),height:"".concat(a,"px"),background:e,boxSizing:"border-box",borderTop:"1px solid #999",borderBottom:"1px solid #999",borderLeft:0===t?"1px solid #999":"none",borderRight:t+1===c?"1px solid #999":"none"}},t)}))})}_.getInitialProps=function(){return{intervals:[],scheme:function(){return"red"}}};var X=n(299);function A(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function N(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{},i=Object.keys(n);"function"===typeof Object.getOwnPropertySymbols&&(i=i.concat(Object.getOwnPropertySymbols(n).filter((function(e){return Object.getOwnPropertyDescriptor(n,e).enumerable})))),i.forEach((function(t){A(e,t,n[t])}))}return e}function G(e,t){if(null==e)return{};var n,i,s=function(e,t){if(null==e)return{};var n,i,s={},r=Object.keys(e);for(i=0;i<r.length;i++)n=r[i],t.indexOf(n)>=0||(s[n]=e[n]);return s}(e,t);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);for(i=0;i<r.length;i++)n=r[i],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(s[n]=e[n])}return s}function D(e){var t,n,s=e.value,r=e.onChange,o=e.suffix,a=void 0===o?"":o,c=e.min,h=void 0===c?2:c,d=e.max,x=void 0===d?32:d,u=G(e,["value","onChange","suffix","min","max"]);return(0,i.jsxs)(l.k,{children:[(0,i.jsxs)(v.iR,N({flex:"1",focusThumbOnChange:!1,value:s,onChange:r,min:h,max:x},u,{children:[(0,i.jsx)(v.Uj,{children:(0,i.jsx)(v.Ms,{})}),(0,i.jsx)(v.gs,{fontSize:"sm",boxSize:"32px",children:s})]})),(0,i.jsxs)(X.Y2,{maxW:"125px",ml:"2rem",value:(n=s,"".concat(n," ").concat(a)),onChange:function(e){var n=null!==(t=parseInt(e))&&void 0!==t?t:0;n>=h&&n<=x&&r(n)},children:[(0,i.jsx)(X.zu,{}),(0,i.jsxs)(X.Fi,{children:[(0,i.jsx)(X.WQ,{}),(0,i.jsx)(X.Y_,{})]})]})]})}var q=0;function Q(e){var t=e.interval,n=e.x,s=e.scheme,r=e.y,o=e.height,l=e.padX,a=void 0===l?0:l,c=e.smooth,h=void 0===c||c;null!==a&&void 0!==a||(a=0);var d=t.end-t.start,x=n(t.start),u=n(t.end)-x,m=Math.ceil(u/1),g=d/m,j=(0,w.range)(m).map((function(e){var i=t.start+e*g,r=Math.min(e,m-e,3);return{i:e,t:i,x:n(i),width:n(g),color:h?(0,w.interpolateRgb)(s(Math.max(0,i-r*g)),s(Math.min(1,i+r*g)))(.5):s(i)}})),f="".concat(q++);return(0,i.jsxs)("g",{children:[(0,i.jsx)("defs",{children:(0,i.jsx)("clipPath",{id:f,children:(0,i.jsx)("rect",{x:x+a,y:r,width:u-2*a,height:o})})}),(0,i.jsx)("g",{clipPath:"url(#".concat(f,")"),children:j.map((function(e){return(0,i.jsx)("rect",{x:e.x,y:r,width:e.width,height:o,fill:e.color},e.i)}))})]})}function V(e){var t=e.x,n=e.y,s=e.width,r=e.height,o=e.fill,l=void 0===o?"black":o;return s<=0?null:(0,i.jsx)("rect",{x:t,y:n,width:s,height:r,fill:l})}function Y(e){var t=e.weights,n=e.scheme,s=e.strength,r=void 0===s?1:s,o=e.width,l=void 0===o?500:o,a=e.height,c=void 0===a?500:a,h=e.margin,d=void 0===h?void 0:h,x=e.saturation,u=void 0===x?.8:x,m=e.lightness,g=void 0===m?.6:m,j=e.saturationEnd,f=void 0===j?.4:j,p=e.lightnessEnd,v=void 0===p?.5:p,b=e.midpoint,y=void 0===b?4:b,S=e.steepness,k=void 0===S?1:S,C=e.skipModifyScheme,z=void 0!==C&&C,O=l,W=c;if(l-=(d=function(e,t){var n=void 0===t?{top:20,bottom:20,left:20,right:20}:t;return Object.assign({top:0,bottom:0,left:0,right:0},n,null!==e&&void 0!==e?e:{})}(d,{top:10,bottom:10,left:10,right:10})).left+d.right,c-=d.top+d.bottom,0===t.length)return null;var P=t.length<16?Array.from(t):t;if(16>t.length)for(var E=t[t.length-1],R=t.length;R<16;++R)P.push(E);for(var T=Math.min(t.length,16),I=Math.pow(2,Math.ceil(Math.log2(16))),F=l/I-2,_=c/I-2,U=Math.min(F/2,_/2),X=w.scaleLinear().domain([0,1]).range([0,l]),A=function(e){return{start:e.start,end:e.end}},N=Math.ceil(Math.log2(16)),G=[new M(0,1,P[0],P[0])],D=[{intervals:G.map(A),startLevel:0,split:0,subLevel:0}],q=0,Y=0;Y<N;++Y)for(var B=G.length,K=0;K<B;++K){var Z=G[K],$=Z.split(P[++q],r);if($.subLevel=K,G.push($),D.push({intervals:G.map(A),startLevel:Y+1,subLevel:K,split:Z.end}),16===G.length)break}var J=(c-0-5)/(N+1),ee=function(e){var t=e.startLevel,n=e.subLevel;return J*(t+n/Math.pow(2,Math.max(0,t-1)))},te=Math.min(4,U),ne=Math.min(6,U);return(0,i.jsx)("div",{children:(0,i.jsx)("svg",{viewBox:"0 0 ".concat(O," ").concat(W),width:O,height:W,children:(0,i.jsxs)("g",{transform:"translate(".concat(d.left,",").concat(d.top,")"),children:[w.range(N+1).map((function(e){return(0,i.jsx)(Q,{interval:{start:0,end:1},x:X,y:e*J,height:J,padX:0,scheme:z?n:H(n,{saturation:L(u,f,{startLevel:e,subLevel:0},y,k),lightness:L(g,v,{startLevel:e,subLevel:0},y,k)})},e)})),(0,i.jsx)("g",{transform:"translate(0,".concat(0,")"),children:D.map((function(e,t){return(0,i.jsx)("g",{children:e.intervals.map((function(s,r){return(0,i.jsxs)("g",{children:[(0,i.jsx)(V,{x:X(s.start)+te,y:ee(e),width:X(s.end-s.start)-2*te,height:4}),t<T&&(0,i.jsxs)("g",{transform:"translate(".concat(X(e.split),",").concat(ee(e)+2,")"),children:[t+1<T&&(0,i.jsxs)("g",{children:[(0,i.jsx)("path",{shapeRendering:"geometricPrecision",d:"M 0 0 Q ".concat((X(D[t+1].split)-X(e.split))/2," 0 ").concat(X(D[t+1].split)-X(e.split)," ").concat(ee(D[t+1])-ee(e)),fill:"none",stroke:"black",strokeWidth:2}),(0,i.jsx)("path",{shapeRendering:"geometricPrecision",d:"M 0 0 Q ".concat((X(D[t+1].split)-X(e.split))/2," 0 ").concat(X(D[t+1].split)-X(e.split)," ").concat(ee(D[t+1])-ee(e)),fill:"none",stroke:"white",strokeWidth:1})]}),(0,i.jsx)("circle",{r:ne,fill:"black",strokeWidth:2}),(0,i.jsx)("circle",{r:ne-2,fill:n(e.split),stroke:"white",strokeWidth:2})]})]},r)}))},t)}))})]})})})}var B=function(e){var t=e.label,n=e.icon,s=e.children,r=e.iconColor,c=void 0===r?"black":r;return(0,i.jsxs)(o.HC,{display:"flex",alignItems:"center",children:[(0,i.jsx)(o.DE,{w:10,h:10,as:n,color:c}),(0,i.jsxs)(l.k,{direction:"column",ml:2,children:[(0,i.jsx)(a.x,{as:"strong",children:t}),(0,i.jsx)(a.x,{as:"div",color:"gray.600",children:s})]})]})};function H(e,t){var n=void 0===t?{}:t,i=n.saturation,s=n.lightness,r=n.offset,o=n.reverse;return function(t){null!==r&&void 0!==r||(r=0),t=t+r-Math.floor(t+r),o&&(t=1-t);var n=w.hsl(e(t));return i&&(n.s=i),s&&(n.l=s),n.toString()}}function K(){var e=(0,r.useState)(6),t=e[0],n=e[1],s=(0,r.useState)(.7),M=s[0],S=s[1],k=(0,r.useState)(.5),C=k[0],L=k[1],P=(0,r.useState)(.6),R=P[0],T=P[1],I=(0,r.useState)(.4),F=I[0],X=I[1],A=(0,r.useState)(4),N=A[0],G=A[1],q=(0,r.useState)(1),Q=q[0],V=q[1],K=(0,r.useState)(0),Z=K[0],$=K[1],J=(0,r.useState)(1),ee=J[0],te=J[1],ne=(0,r.useState)(0),ie=ne[0],se=ne[1],re=(0,r.useState)(!1),oe=re[0],le=re[1],ae=(0,r.useState)("interpolateSinebow"),ce=ae[0],he=ae[1],de="interpolateGreys"===ce,xe=de?void 0:M,ue=de?void 0:R,me=de?void 0:C,ge=de?void 0:F,je=W(t,Z),fe=O(je,{strength:ee}),pe=z(fe,{scheme:ce.slice("interpolate".length),saturation:xe,lightness:ue,saturationEnd:me,lightnessEnd:ge,midpoint:N,steepness:Q}),ve=w[ce];return ve=H(ve,{saturation:xe,lightness:ue,offset:ie,reverse:oe}),(0,i.jsxs)("div",{children:[(0,i.jsx)(c.W,{as:"header",maxWidth:"100%",children:(0,i.jsxs)(c.W,{centerContent:!0,mb:12,py:6,children:[(0,i.jsxs)(h.Ug,{children:[(0,i.jsx)(d.xu,{mr:6,children:(0,i.jsx)(x.X,{fontSize:"120px",letterSpacing:"-28px",style:{textShadow:"-1px -1px 0 #eee, 1px -1px 0 #eee, -1px 1px 0 #eee, 1px 1px 0 #eee"},children:"C3"})}),(0,i.jsxs)(h.gC,{align:"flex-start",spacing:"-1",fontSize:"lg",children:[(0,i.jsxs)(x.X,{fontFamily:"inherit",children:["C",(0,i.jsx)(a.x,{as:"span",color:"gray.400",children:"onsistent"})]}),(0,i.jsxs)(x.X,{fontFamily:"inherit",children:["C",(0,i.jsx)(a.x,{as:"span",color:"gray.400",children:"ategorical"})]}),(0,i.jsxs)(x.X,{fontFamily:"inherit",children:["C",(0,i.jsx)(a.x,{as:"span",color:"gray.400",children:"olors"})]})]})]}),(0,i.jsx)(a.x,{mt:4,fontSize:"3xl",color:"gray.400",children:"Deterministic colors for maps"}),(0,i.jsxs)(a.x,{mt:1,fontSize:"3xl",color:"gray.400",children:["Inspired by the"," ",(0,i.jsx)(u.r,{href:"https://en.wikipedia.org/wiki/Cantor_set",isExternal:!0,children:"Cantor set"})," ","fractal"]})]})}),(0,i.jsxs)(c.W,{as:"main",my:12,children:[(0,i.jsxs)(h.Kq,{align:"center",justify:"center",direction:["column","row"],spacing:"24px",mt:4,children:[(0,i.jsx)(E,{intervals:fe,scheme:ve,size:300}),(0,i.jsx)(Y,{height:300,width:300,weights:je,strength:ee,scheme:ve,saturation:M,lightness:R,saturationEnd:C,lightnessEnd:F,midpoint:N,steepness:Q,skipModifyScheme:de})]}),(0,i.jsx)(d.xu,{align:"center",mt:"10",children:(0,i.jsx)(U,{colors:pe})}),(0,i.jsxs)(d.xu,{mt:10,children:[(0,i.jsxs)(h.Ug,{children:[(0,i.jsxs)(m.Ph,{id:"colorScale",value:ce,onChange:function(e){var t;return he(null===(t=e.target)||void 0===t?void 0:t.value)},children:[(0,i.jsx)("option",{value:"interpolateSinebow",children:"Sinebow"}),(0,i.jsx)("option",{value:"interpolateRainbow",children:"Rainbow"}),(0,i.jsx)("option",{value:"interpolateTurbo",children:"Turbo"}),(0,i.jsx)("option",{value:"interpolateViridis",children:"Viridis"}),(0,i.jsx)("option",{value:"interpolateGreys",children:"Greys"})]}),(0,i.jsx)(g.L,{}),(0,i.jsxs)(j.NI,{display:"flex",alignItems:"center",children:[(0,i.jsx)(f.l,{htmlFor:"reverse",mb:"0",children:"Reverse"}),(0,i.jsx)(p.r,{id:"reverse",isChecked:oe,onChange:function(){return le(!oe)}})]})]}),(0,i.jsx)(D,{min:2,max:128,value:t,onChange:n,suffix:"colors"}),(0,i.jsxs)(l.k,{mt:4,children:[(0,i.jsxs)(v.iR,{focusThumbOnChange:!1,value:M,onChange:S,min:0,max:1,step:.01,children:[(0,i.jsx)(v.Uj,{children:(0,i.jsx)(v.Ms,{})}),(0,i.jsx)(v.gs,{fontSize:"sm",boxSize:"32px",children:M})]}),(0,i.jsx)(d.xu,{mx:10,children:"Saturation"})]}),(0,i.jsxs)(l.k,{mt:4,children:[(0,i.jsxs)(v.iR,{focusThumbOnChange:!1,value:C,onChange:L,min:0,max:1,step:.01,children:[(0,i.jsx)(v.Uj,{children:(0,i.jsx)(v.Ms,{})}),(0,i.jsx)(v.gs,{fontSize:"sm",boxSize:"32px",children:C})]}),(0,i.jsx)(d.xu,{mx:10,children:"Saturation end"})]}),(0,i.jsxs)(l.k,{mt:4,children:[(0,i.jsxs)(v.iR,{focusThumbOnChange:!1,value:R,onChange:T,min:0,max:1,step:.01,children:[(0,i.jsx)(v.Uj,{children:(0,i.jsx)(v.Ms,{})}),(0,i.jsx)(v.gs,{fontSize:"sm",boxSize:"32px",children:R})]}),(0,i.jsx)(d.xu,{mx:10,children:"Lightness"})]}),(0,i.jsxs)(l.k,{mt:4,children:[(0,i.jsxs)(v.iR,{focusThumbOnChange:!1,value:F,onChange:X,min:0,max:1,step:.01,children:[(0,i.jsx)(v.Uj,{children:(0,i.jsx)(v.Ms,{})}),(0,i.jsx)(v.gs,{fontSize:"sm",boxSize:"32px",children:F})]}),(0,i.jsx)(d.xu,{mx:10,children:"Lightness end"})]}),(0,i.jsxs)(l.k,{mt:4,children:[(0,i.jsxs)(v.iR,{focusThumbOnChange:!1,value:N,onChange:G,min:0,max:8,step:.1,children:[(0,i.jsx)(v.Uj,{children:(0,i.jsx)(v.Ms,{})}),(0,i.jsx)(v.gs,{fontSize:"sm",boxSize:"32px",children:N})]}),(0,i.jsx)(d.xu,{mx:10,children:"Midpoint"})]}),(0,i.jsxs)(l.k,{mt:4,children:[(0,i.jsxs)(v.iR,{focusThumbOnChange:!1,value:Q,onChange:V,min:0,max:5,step:.1,children:[(0,i.jsx)(v.Uj,{children:(0,i.jsx)(v.Ms,{})}),(0,i.jsx)(v.gs,{fontSize:"sm",boxSize:"32px",children:Q})]}),(0,i.jsx)(d.xu,{mx:10,children:"Steepness"})]}),(0,i.jsxs)(l.k,{mt:4,children:[(0,i.jsxs)(v.iR,{focusThumbOnChange:!1,value:Z,onChange:$,min:0,max:1,step:.01,children:[(0,i.jsx)(v.Uj,{children:(0,i.jsx)(v.Ms,{})}),(0,i.jsx)(v.gs,{fontSize:"sm",boxSize:"32px",children:Z})]}),(0,i.jsx)(d.xu,{mx:10,children:"Skewness"})]}),(0,i.jsxs)(l.k,{mt:4,display:"none",children:[(0,i.jsxs)(v.iR,{focusThumbOnChange:!1,value:ee,onChange:te,min:0,max:1,step:.01,children:[(0,i.jsx)(v.Uj,{children:(0,i.jsx)(v.Ms,{})}),(0,i.jsx)(v.gs,{fontSize:"sm",boxSize:"32px",children:ee})]}),(0,i.jsx)(d.xu,{mx:10,children:"Weight strength"})]}),(0,i.jsxs)(l.k,{mt:4,children:[(0,i.jsxs)(v.iR,{focusThumbOnChange:!1,value:ie,onChange:se,min:0,max:1,step:.01,children:[(0,i.jsx)(v.Uj,{children:(0,i.jsx)(v.Ms,{})}),(0,i.jsx)(v.gs,{fontSize:"sm",boxSize:"32px",children:ie})]}),(0,i.jsx)(d.xu,{mx:14,children:"Offset"})]})]}),(0,i.jsx)(d.xu,{align:"center",mt:14,children:(0,i.jsx)(_,{intervals:fe,scheme:ve})}),(0,i.jsx)(x.X,{mt:12,children:"Install"}),(0,i.jsx)(a.x,{my:4,children:"Install from NPM"}),(0,i.jsx)(b.E,{variant:"solid",px:3,py:2,children:"npm install @mapequation/c3"}),(0,i.jsxs)(a.x,{my:4,children:["Source code is available on"," ",(0,i.jsx)("a",{href:"//github.com/mapequation/c3",children:"GitHub"}),"."]}),(0,i.jsx)(x.X,{mt:12,children:"Features"}),(0,i.jsxs)(o.aV,{mt:4,spacing:"5",children:[(0,i.jsx)(B,{label:"Unlimited colors",icon:y.zV5,iconColor:"gray.400",children:"Generate as many colors you want"}),(0,i.jsxs)(B,{label:"Any color scheme",icon:y.dNS,iconColor:"yellow.400",children:["We generate color stops on the interval [0,\xa01]. Perfect to use with ",(0,i.jsx)("a",{href:"https://github.com/d3/d3-scale-chromatic",children:"d3"}),"."]}),(0,i.jsx)(B,{label:"Deterministic",icon:y.MQG,iconColor:"red.600",children:"You always get the same colors for the same requested number of colors."}),(0,i.jsx)(B,{label:"Consistent",icon:y.kEG,iconColor:"green.600",children:"If you increase the number of colors, it doesn't change the list of colors you already have."}),(0,i.jsx)(B,{label:"Fast",icon:y.Pmx,iconColor:"blue.500",children:"The complexity is O(n log(n)) for n colors."})]}),(0,i.jsx)(x.X,{mt:12,children:"Authors"}),(0,i.jsx)(a.x,{mt:4,mb:20,children:"Daniel Edler, Anton Eriksson"})]})]})}var Z=function(){return(0,i.jsxs)("div",{children:[(0,i.jsxs)(s.default,{children:[(0,i.jsx)("title",{children:"C3 - Consistent Categorical Colors"}),(0,i.jsx)("meta",{name:"description",content:"C3 - Consistent Categorical Colors"}),(0,i.jsx)("link",{rel:"icon",href:"/favicon.ico"})]}),(0,i.jsx)(K,{})]})}}},function(e){e.O(0,[260,569,774,888,179],(function(){return t=5301,e(e.s=t);var t}));var t=e.O();_N_E=t}]);