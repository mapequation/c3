(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[405],{5301:function(e,t,n){(window.__NEXT_P=window.__NEXT_P||[]).push(["/",function(){return n(6077)}])},6077:function(e,t,n){"use strict";n.r(t),n.d(t,{default:function(){return q}});var r=n(5893),i=n(7294),s=n(3762),o=n(4096),a=n(4115),l=n(3850),c=n(234),h=n(8017),d=n(336),u=n(8104),x=n(7341),m=n(6729),f=n(6618),j=n(6150),g=n(361),p=n(7922),v=n(155),b=n(9008),y=n(357);class w{constructor(e=0,t=1,n=0){this.start=e,this.end=t,this.startLevel=n,this.endLevel=this.startLevel}get size(){return this.end-this.start}get mid(){return this.start+this.size/2}split(){const e=new w(this.mid,this.end,++this.endLevel);return this.end=this.mid,e}}function C(e,t={start:0,end:1}){if("number"===typeof e){if(0===e)return[];e=new Array(e).fill(1/e)}if(0===e.length)return[];const n=e.reduce(((e,t)=>e+t),0);Math.abs(n-1)>1e-6&&(e=e.map((e=>e/n)));let{start:r,end:i}=t;const s=i-r,o=e.map((e=>{const t=e*s,n={start:r,end:r+t};return r+=t,n})),a=[];for(let l=0;l<e.length;l+=2)if(a.push(o[l]),l>0&&a.push(o[l-1]),l+2==e.length){a.push(o[l+1]);break}return a}function M(e=10,t={start:0,end:1}){if("number"!==typeof e&&(e=e.length),0===e)return[];const n=Math.ceil(Math.log2(e)),r=[new w(t.start,t.end)];for(let i=0;i<n;++i){const t=r.length;for(let n=0;n<t;++n){const t=r[n].split();if(r.push(t),r.length===e)return r}}return r}var S=y.range(100);function k(e){var t=e.intervals,n=e.scheme,i=(e.animate,e.size),s=void 0===i?500:i,o=e.hole,a=void 0===o?.9:o,l=e.margin,c=void 0===l?20:l,h=(s-2*c)/2,d=h*a,u=(h+d)/2,x=s,m=s,f=Math.pow(2,Math.ceil(Math.log2(t.length))),j=u*Math.PI*1/f-2,g=Math.min(c,j),p=Math.min(16,j),v=j<5?0:2,b=j<5?1:2,w=j<5?2:4,C=y.scaleLinear().domain([0,1]).range([0,u]),M=y.pie().padAngle(0).sort(null).value((function(){return 1}))(S),k=y.arc().innerRadius(d).outerRadius(h),O=y.scaleLinear().domain([0,1]).range([-Math.PI/2,-Math.PI/2+2*Math.PI]);y.interpolateRgb("#000","#eee");return(0,r.jsx)("svg",{viewBox:"0 0 ".concat(x," ").concat(m),width:x,height:m,style:{marginTop:"2em"},children:(0,r.jsxs)("g",{strokeWidth:0,transform:"translate(".concat(x/2,",").concat(m/2,")"),children:[M.map((function(e,t){return(0,r.jsx)("path",{d:k(e),fill:n(t/S.length)},t)})),t.map((function(e,i){return(0,r.jsxs)("g",{children:[i+1<t.length&&(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)("line",{x1:C(Math.cos(O(e.start))),y1:C(Math.sin(O(e.start))),x2:C(Math.cos(O(t[i+1].start))),y2:C(Math.sin(O(t[i+1].start))),strokeWidth:3,stroke:"#777"}),(0,r.jsx)("line",{x1:C(Math.cos(O(e.start))),y1:C(Math.sin(O(e.start))),x2:C(Math.cos(O(t[i+1].start))),y2:C(Math.sin(O(t[i+1].start))),strokeWidth:2,stroke:"white"})]}),(0,r.jsx)("circle",{cx:C(Math.cos(O(e.start))),cy:C(Math.sin(O(e.start))),r:g,stroke:"#777",strokeWidth:w}),(0,r.jsx)("circle",{cx:C(Math.cos(O(e.start))),cy:C(Math.sin(O(e.start))),r:g,fill:n(e.start),stroke:"white",strokeWidth:b}),(0,r.jsx)("text",{x:C(Math.cos(O(e.start))),y:C(Math.sin(O(e.start))),textAnchor:"middle",fill:"white",stroke:"#777",paintOrder:"stroke",strokeWidth:v,fontWeight:"bold",fontSize:p,dy:"0.3em",children:i+1})]},i)}))]})})}k.getInitialProps=function(){return{intervals:[],scheme:function(){return"red"}}};var O=n(6640),z=n(3244),P=n(2152),I=n.n(P);function W(e){var t=e.intervals,n=void 0===t?[]:t,s=e.scheme,o=(0,i.useCallback)((function(e){var t;return null===(t=y.color(s(e)))||void 0===t?void 0:t.formatHex()}),[s]);return(0,i.useEffect)((function(){new(I())(".copy-button",{text:function(){return"["+n.map((function(e){return'"'+o(e.start)+'"'})).join(", ")+"]"}})}),[n,o]),(0,r.jsxs)(r.Fragment,{children:[(0,r.jsxs)(h.xu,{align:"left",w:"100%",fontFamily:"monospace",fontSize:"md",p:4,mt:10,borderRadius:5,borderWidth:2,borderColor:"gray.100",shadow:"sm",bg:"gray.50",color:"gray.700",children:["[",n.map((function(e,t){return(0,r.jsxs)(i.Fragment,{children:['"',(0,r.jsx)("span",{style:{color:s(e.start)},children:o(e.start)}),'"',t+1<n.length&&", "]},t)})),"]"]}),(0,r.jsx)(O.z,{size:"sm",className:"copy-button",mt:4,colorScheme:"blue",leftIcon:(0,r.jsx)(z.T,{}),children:"Copy to clipboard"})]})}W.getInitialProps=function(){return{intervals:[],scheme:function(){return"red"}}};var E=n(4533);function _(e){var t=e.intervals,n=void 0===t?[]:t,i=e.scheme,s=e.weights,o=void 0===s?void 0:s,a=e.animate,l=(void 0!==a&&a?3:0)/n.length,c=n.length;void 0===o&&(o=new Array(c).fill(1));var h=(0,y.sum)(o);return Math.abs(h-1)>1e-6&&(o=o.map((function(e){return e/h}))),(0,r.jsx)("div",{children:n.map((function(e,t){return(0,r.jsx)(E.E.div,{style:{display:"inline-block",width:"".concat(500*o[t],"px"),height:"50px",background:i(e.start),boxSizing:"border-box",border:"solid 1px #333",borderLeft:t>0?"none":"solid 1px #333"},initial:{opacity:0},animate:{opacity:1},transition:{duration:l,delay:t*l}},t)}))})}var L=n(299);function R(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function T(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{},r=Object.keys(n);"function"===typeof Object.getOwnPropertySymbols&&(r=r.concat(Object.getOwnPropertySymbols(n).filter((function(e){return Object.getOwnPropertyDescriptor(n,e).enumerable})))),r.forEach((function(t){R(e,t,n[t])}))}return e}function F(e,t){if(null==e)return{};var n,r,i=function(e,t){if(null==e)return{};var n,r,i={},s=Object.keys(e);for(r=0;r<s.length;r++)n=s[r],t.indexOf(n)>=0||(i[n]=e[n]);return i}(e,t);if(Object.getOwnPropertySymbols){var s=Object.getOwnPropertySymbols(e);for(r=0;r<s.length;r++)n=s[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(i[n]=e[n])}return i}function X(e){var t,n,i=e.value,s=e.onChange,a=e.suffix,l=void 0===a?"":a,c=e.min,h=void 0===c?2:c,d=e.max,u=void 0===d?32:d,x=F(e,["value","onChange","suffix","min","max"]);return(0,r.jsxs)(o.k,{children:[(0,r.jsxs)(g.iR,T({flex:"1",focusThumbOnChange:!1,value:i,onChange:s,min:h,max:u},x,{children:[(0,r.jsx)(g.Uj,{children:(0,r.jsx)(g.Ms,{})}),(0,r.jsx)(g.gs,{fontSize:"sm",boxSize:"32px",children:i})]})),(0,r.jsxs)(L.Y2,{maxW:"125px",ml:"2rem",value:(n=i,"".concat(n," ").concat(l)),onChange:function(e){var n=null!==(t=parseInt(e))&&void 0!==t?t:0;n>=h&&n<=u&&s(n)},children:[(0,r.jsx)(L.zu,{}),(0,r.jsxs)(L.Fi,{children:[(0,r.jsx)(L.WQ,{}),(0,r.jsx)(L.Y_,{})]})]})]})}var G=0;function N(e){var t=e.interval,n=e.x,i=e.scheme,s=e.y,o=e.height,a=e.padX,l=void 0===a?0:a;null!==l&&void 0!==l||(l=0);var c=t.end-t.start,h=n(t.start),d=n(t.end)-h,u=Math.ceil(.3*d),x=(0,y.range)(u).map((function(e){var r=t.start+e/u*c;return{i:e,t:r,x:n(r),width:n(c/u)}})),m="".concat(G++);return(0,r.jsxs)("g",{children:[(0,r.jsx)("defs",{children:(0,r.jsx)("clipPath",{id:m,children:(0,r.jsx)("rect",{x:h+l,y:s,width:d-2*l,height:o})})}),(0,r.jsx)("g",{clipPath:"url(#".concat(m,")"),children:x.map((function(e){return(0,r.jsx)("rect",{x:e.x,y:s,width:e.width,height:o,fill:i(e.t),stroke:i(e.t)},e.i)}))})]})}function U(e){var t=e.x,n=e.y,i=e.width,s=e.height,o=e.fill,a=void 0===o?"black":o;return i<=0?null:(0,r.jsx)("rect",{x:t,y:n,width:i,height:s,fill:a})}function A(e){var t=e.numColors,n=e.scheme,i=(e.animate,e.width),s=void 0===i?500:i,o=e.height,a=void 0===o?500:o,l=e.margin,c=void 0===l?void 0:l,h=s,d=a;s-=(c=function(e,t){var n=void 0===t?{top:20,bottom:20,left:20,right:20}:t;return Object.assign({top:0,bottom:0,left:0,right:0},n,null!==e&&void 0!==e?e:{})}(c,{top:10,bottom:10,left:10,right:10})).left+c.right,a-=c.top+c.bottom,console.log(c,s,a);var u=t;t=16,u=Math.min(t,u);for(var x=Math.pow(2,Math.ceil(Math.log2(t))),m=s/x-2,f=a/x-2,j=Math.min(m/2,f/2),g=Math.min(c.top,c.bottom,c.right,c.left),p=(Math.min(g,j),Math.min(16,j),y.scaleLinear().domain([0,1]).range([0,s])),v=function(e){return{start:e.start,end:e.end}},b=Math.ceil(Math.log2(t)),C=[new w(0,1)],M=[{intervals:C.map(v),level:0,split:0}],S=0;S<b;++S)for(var k=C.length,O=0;O<k;++O){var z=C[O],P=z.mid,I=z.split();if(C.push(I),M.push({intervals:C.map(v),level:S+1,split:P}),C.length===t)break}var W=y.scaleLinear().domain([0,t]).range([0,a]);return(0,r.jsx)("div",{children:(0,r.jsx)("svg",{viewBox:"0 0 ".concat(s," ").concat(a),width:h,height:d,children:(0,r.jsxs)("g",{transform:"translate(".concat(c.left,",").concat(c.top,")"),children:[(0,r.jsx)(N,{interval:{start:0,end:1},x:p,scheme:n,y:0,height:a,padX:0}),M.map((function(e,t){return(0,r.jsx)("g",{children:e.intervals.map((function(i,s){return(0,r.jsxs)("g",{children:[(0,r.jsx)(U,{x:p(i.start)+5,y:W(t),width:p(i.end-i.start)-10,height:5}),t<u&&(0,r.jsxs)("g",{children:[t>0&&(0,r.jsx)("line",{x1:p(M[t-1].split),x2:p(e.split),y1:W(t-1)+2.5,y2:W(t)+2.5,stroke:"white",strokeWidth:.5}),(0,r.jsx)("circle",{cx:p(e.split),cy:W(t)+2.5,r:5,fill:n(e.split),stroke:"white"})]})]},s)}))},t)}))]})})})}function D(e){var t=e.numColors,n=e.scheme,i=(e.animate,e.width),s=void 0===i?500:i,o=e.height,a=void 0===o?500:o,l=e.margin,c=void 0===l?void 0:l,h=e.cantor;return void 0===h||h?(0,r.jsx)(A,{numColors:t,scheme:n,width:s,height:a,margin:c}):null}D.getInitialProps=function(){return{numColors:0,scheme:function(){return"red"}}};var V=function(e){var t=e.label,n=e.icon,i=e.children,l=e.iconColor,c=void 0===l?"black":l;return(0,r.jsxs)(s.HC,{display:"flex",alignItems:"center",children:[(0,r.jsx)(s.DE,{w:10,h:10,as:n,color:c}),(0,r.jsxs)(o.k,{direction:"column",ml:2,children:[(0,r.jsx)(a.x,{as:"strong",children:t}),(0,r.jsx)(a.x,{as:"div",color:"gray.600",children:i})]})]})},q=function(){var e,t=(0,i.useState)(6),n=t[0],w=t[1],S=(0,i.useState)("stops"),O=S[0],z=S[1],P=(0,i.useState)(.8),I=P[0],E=P[1],L=(0,i.useState)(0),R=L[0],T=L[1],F=(0,i.useState)(.6),G=F[0],N=F[1],U=(0,i.useState)(0),A=U[0],q=U[1],H=(0,i.useState)(!1),Y=H[0],B=H[1],Q=(0,i.useState)("interpolateSinebow"),J=Q[0],K=Q[1],Z=y.range(n).map((function(e,t){return Math.exp(5*A*(n-t)/Math.pow(n,1))})),$="weightedStops"===O?C(Z):M(n),ee=y[J];return e=ee,ee=function(t){if(t=t+R-Math.floor(t+R),Y&&(t=1-t),"interpolateGreys"===J)return e(t);var n=y.hsl(e(t));return n.s=I,n.l=G,n.toString()},(0,r.jsxs)("div",{children:[(0,r.jsxs)(b.default,{children:[(0,r.jsx)("title",{children:"C3 - Consistent Categorical Colors"}),(0,r.jsx)("meta",{name:"description",content:"C3 - Consistent Categorical Colors"}),(0,r.jsx)("link",{rel:"icon",href:"/favicon.ico"})]}),(0,r.jsx)(l.W,{as:"header",maxWidth:"100%",children:(0,r.jsxs)(l.W,{centerContent:!0,mb:12,py:6,children:[(0,r.jsxs)(c.Ug,{children:[(0,r.jsx)(h.xu,{mr:6,children:(0,r.jsx)(d.X,{fontSize:"120px",letterSpacing:"-28px",style:{textShadow:"-1px -1px 0 #eee, 1px -1px 0 #eee, -1px 1px 0 #eee, 1px 1px 0 #eee"},children:"C3"})}),(0,r.jsxs)(c.gC,{align:"flex-start",spacing:"-1",fontSize:"lg",children:[(0,r.jsxs)(d.X,{fontFamily:"inherit",children:["C",(0,r.jsx)(a.x,{as:"span",color:"gray.400",children:"onsistent"})]}),(0,r.jsxs)(d.X,{fontFamily:"inherit",children:["C",(0,r.jsx)(a.x,{as:"span",color:"gray.400",children:"ategorical"})]}),(0,r.jsxs)(d.X,{fontFamily:"inherit",children:["C",(0,r.jsx)(a.x,{as:"span",color:"gray.400",children:"olors"})]})]})]}),(0,r.jsx)(a.x,{my:4,fontSize:"3xl",color:"gray.400",children:"Deterministic colors for maps"})]})}),(0,r.jsxs)(l.W,{as:"main",my:12,children:[(0,r.jsxs)(h.xu,{children:[(0,r.jsxs)(c.Ug,{children:[(0,r.jsxs)(u.Ph,{id:"colorScale",value:J,onChange:function(e){var t;return K(null===(t=e.target)||void 0===t?void 0:t.value)},children:[(0,r.jsx)("option",{value:"interpolateSinebow",children:"Sinebow"}),(0,r.jsx)("option",{value:"interpolateRainbow",children:"Rainbow"}),(0,r.jsx)("option",{value:"interpolateTurbo",children:"Turbo"}),(0,r.jsx)("option",{value:"interpolateViridis",children:"Viridis"}),(0,r.jsx)("option",{value:"interpolateGreys",children:"Greys"})]}),(0,r.jsx)(x.L,{}),(0,r.jsxs)(m.NI,{display:"flex",alignItems:"center",children:[(0,r.jsx)(f.l,{htmlFor:"reverse",mb:"0",children:"Reverse"}),(0,r.jsx)(j.r,{id:"reverse",isChecked:Y,onChange:function(){return B(!Y)}})]})]}),(0,r.jsxs)(u.Ph,{mt:4,value:O,onChange:function(e){var t;return z(null===(t=e.target)||void 0===t?void 0:t.value)},children:[(0,r.jsx)("option",{value:"stops",children:"Standard"}),(0,r.jsx)("option",{value:"weightedStops",children:"Leapfrog"})]})]}),(0,r.jsx)(h.xu,{align:"center",children:(0,r.jsx)(k,{intervals:$,scheme:ee,size:500})}),(0,r.jsx)(h.xu,{align:"center",mt:"10",children:(0,r.jsx)(_,{intervals:$,scheme:ee,weights:Z})}),(0,r.jsxs)(h.xu,{mt:10,children:[(0,r.jsx)(X,{min:2,max:128,value:n,onChange:w,suffix:"colors"}),(0,r.jsxs)(o.k,{mt:4,children:[(0,r.jsxs)(g.iR,{focusThumbOnChange:!1,value:I,onChange:E,min:0,max:1,step:.1,disabled:"interpolateGreys"===J,children:[(0,r.jsx)(g.Uj,{children:(0,r.jsx)(g.Ms,{})}),(0,r.jsx)(g.gs,{fontSize:"sm",boxSize:"32px",children:I})]}),(0,r.jsx)(h.xu,{mx:10,children:"Saturation"})]}),(0,r.jsxs)(o.k,{mt:4,children:[(0,r.jsxs)(g.iR,{focusThumbOnChange:!1,value:G,onChange:N,min:0,max:1,step:.1,disabled:"interpolateGreys"===J,children:[(0,r.jsx)(g.Uj,{children:(0,r.jsx)(g.Ms,{})}),(0,r.jsx)(g.gs,{fontSize:"sm",boxSize:"32px",children:G})]}),(0,r.jsx)(h.xu,{mx:10,children:"Lightness"})]}),(0,r.jsxs)(o.k,{mt:4,children:[(0,r.jsxs)(g.iR,{focusThumbOnChange:!1,value:A,onChange:q,min:0,max:1,step:.1,children:[(0,r.jsx)(g.Uj,{children:(0,r.jsx)(g.Ms,{})}),(0,r.jsx)(g.gs,{fontSize:"sm",boxSize:"32px",children:A})]}),(0,r.jsx)(h.xu,{mx:10,children:"Skewness"})]}),(0,r.jsxs)(o.k,{mt:4,children:[(0,r.jsxs)(g.iR,{focusThumbOnChange:!1,value:R,onChange:T,min:0,max:1,step:.01,children:[(0,r.jsx)(g.Uj,{children:(0,r.jsx)(g.Ms,{})}),(0,r.jsx)(g.gs,{fontSize:"sm",boxSize:"32px",children:R})]}),(0,r.jsx)(h.xu,{mx:14,children:"Offset"})]})]}),(0,r.jsx)(h.xu,{mt:8,children:(0,r.jsx)(D,{numColors:$.length,scheme:ee,cantor:"stops"===O})}),(0,r.jsx)(h.xu,{align:"center",mt:14,children:(0,r.jsx)(W,{intervals:$,scheme:ee})}),(0,r.jsx)(d.X,{mt:12,children:"Install"}),(0,r.jsx)(a.x,{my:4,children:"Install from NPM"}),(0,r.jsx)(p.E,{variant:"solid",px:3,py:2,children:"npm install @mapequation/c3"}),(0,r.jsxs)(a.x,{my:4,children:["Source code is available on"," ",(0,r.jsx)("a",{href:"//github.com/mapequation/c3",children:"GitHub"}),"."]}),(0,r.jsx)(d.X,{mt:12,children:"Features"}),(0,r.jsxs)(s.aV,{mt:4,spacing:"5",children:[(0,r.jsx)(V,{label:"Unlimited colors",icon:v.zV5,iconColor:"gray.400",children:"Generate as many colors you want"}),(0,r.jsxs)(V,{label:"Any color scheme",icon:v.dNS,iconColor:"yellow.400",children:["We generate color stops on the interval [0,\xa01]. Perfect to use with ",(0,r.jsx)("a",{href:"https://github.com/d3/d3-scale-chromatic",children:"d3"}),"."]}),(0,r.jsx)(V,{label:"Deterministic",icon:v.MQG,iconColor:"red.600",children:"You always get the same colors for the same requested number of colors."}),(0,r.jsx)(V,{label:"Consistent",icon:v.kEG,iconColor:"green.600",children:"If you increase the number of colors, it doesn't change the list of colors you already have."}),(0,r.jsx)(V,{label:"Fast",icon:v.Pmx,iconColor:"blue.500",children:"The complexity is O(n log(n)) for n colors."})]}),(0,r.jsx)(d.X,{mt:12,children:"Authors"}),(0,r.jsx)(a.x,{mt:4,mb:20,children:"Daniel Edler, Anton Eriksson"})]})]})}}},function(e){e.O(0,[260,841,774,888,179],(function(){return t=5301,e(e.s=t);var t}));var t=e.O();_N_E=t}]);