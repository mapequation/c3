(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[405],{5301:function(e,t,n){(window.__NEXT_P=window.__NEXT_P||[]).push(["/",function(){return n(6316)}])},5401:function(e,t,n){"use strict";n.r(t),n.d(t,{default:function(){return s}});var r=n(5893),i=n(4533);function s(e){var t=e.colors,n=void 0===t?[]:t,s=e.scheme,o=e.animate,l=(void 0!==o&&o?3:0)/n.length,a=n.length;return(0,r.jsx)("div",{children:n.map((function(e,t){return(0,r.jsx)(i.E.div,{style:{display:"inline-block",width:"".concat(1/a*500,"px"),height:"50px",background:s(e.start),boxSizing:"border-box",border:"solid 1px #333",borderLeft:t>0?"none":"solid 1px #333"},initial:{opacity:0},animate:{opacity:1},transition:{duration:l,delay:t*l}},t)}))})}},1118:function(e,t,n){"use strict";n.r(t),n.d(t,{default:function(){return u}});var r=n(5893),i=n(7294),s=n(8017),o=n(4056),l=n(3244),a=n(357),c=n(2152),h=n.n(c);function u(e){var t=e.colors,n=void 0===t?[]:t,c=e.scheme,u=(0,i.useCallback)((function(e){var t;return null===(t=a.color(c(e)))||void 0===t?void 0:t.formatHex()}),[c]);return(0,i.useEffect)((function(){new(h())(".copy-button",{text:function(){return"["+n.map((function(e){return'"'+u(e.start)+'"'})).join(", ")+"]"}})}),[n,u]),(0,r.jsxs)(r.Fragment,{children:[(0,r.jsxs)(s.xu,{align:"left",w:"100%",fontFamily:"monospace",fontSize:"md",p:4,mt:10,borderRadius:5,borderWidth:2,borderColor:"gray.100",shadow:"sm",bg:"gray.50",color:"gray.700",children:["[",n.map((function(e,t){return(0,r.jsxs)(i.Fragment,{children:['"',(0,r.jsx)("span",{style:{color:c(e.start)},children:u(e.start)}),'"',t+1<n.length&&", "]},t)})),"]"]}),(0,r.jsx)(o.z,{size:"sm",className:"copy-button",mt:4,colorScheme:"blue",leftIcon:(0,r.jsx)(l.T,{}),children:"Copy to clipboard"})]})}u.getInitialProps=function(){return{colors:[],scheme:function(){return"red"}}}},7175:function(e,t,n){"use strict";n.r(t),n.d(t,{default:function(){return o}});var r=n(5893),i=n(357),s=i.range(100);function o(e){var t=e.colors,n=e.scheme,o=(e.animate,e.size),l=void 0===o?500:o,a=e.hole,c=void 0===a?.9:a,h=e.margin,u=void 0===h?20:h,d=(l-2*u)/2,x=d*c,f=(d+x)/2,m=l,j=l,p=Math.pow(2,Math.ceil(Math.log2(t.length))),g=f*Math.PI*1/p-2,b=Math.min(u,g),v=Math.min(16,g),y=g<5?0:2,C=g<5?1:2,w=g<5?2:4,S=i.scaleLinear().domain([0,1]).range([0,f]),M=i.pie().padAngle(0).sort(null).value((function(){return 1}))(s),k=i.arc().innerRadius(x).outerRadius(d),O=i.scaleLinear().domain([0,1]).range([-Math.PI/2,-Math.PI/2+2*Math.PI]);i.interpolateRgb("#000","#eee");return(0,r.jsx)("svg",{viewBox:"0 0 ".concat(m," ").concat(j),width:m,height:j,style:{marginTop:"2em"},children:(0,r.jsxs)("g",{strokeWidth:0,transform:"translate(".concat(m/2,",").concat(j/2,")"),children:[M.map((function(e,t){return(0,r.jsx)("path",{d:k(e),fill:n(t/s.length)},t)})),t.map((function(e,i){return(0,r.jsxs)("g",{children:[i+1<t.length&&(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)("line",{x1:S(Math.cos(O(e.start))),y1:S(Math.sin(O(e.start))),x2:S(Math.cos(O(t[i+1].start))),y2:S(Math.sin(O(t[i+1].start))),strokeWidth:3,stroke:"#777"}),(0,r.jsx)("line",{x1:S(Math.cos(O(e.start))),y1:S(Math.sin(O(e.start))),x2:S(Math.cos(O(t[i+1].start))),y2:S(Math.sin(O(t[i+1].start))),strokeWidth:2,stroke:"white"})]}),(0,r.jsx)("circle",{cx:S(Math.cos(O(e.start))),cy:S(Math.sin(O(e.start))),r:b,stroke:"#777",strokeWidth:w}),(0,r.jsx)("circle",{cx:S(Math.cos(O(e.start))),cy:S(Math.sin(O(e.start))),r:b,fill:n(e.start),stroke:"white",strokeWidth:C}),(0,r.jsx)("text",{x:S(Math.cos(O(e.start))),y:S(Math.sin(O(e.start))),textAnchor:"middle",fill:"white",stroke:"#777",paintOrder:"stroke",strokeWidth:y,fontWeight:"bold",fontSize:v,dy:"0.3em",children:i+1})]},i)}))]})})}o.getInitialProps=function(){return{colors:[],scheme:function(){return"red"}}}},9895:function(e,t,n){"use strict";n.r(t),n.d(t,{default:function(){return h}});var r=n(5893),i=n(4096),s=n(299),o=n(361);function l(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function a(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{},r=Object.keys(n);"function"===typeof Object.getOwnPropertySymbols&&(r=r.concat(Object.getOwnPropertySymbols(n).filter((function(e){return Object.getOwnPropertyDescriptor(n,e).enumerable})))),r.forEach((function(t){l(e,t,n[t])}))}return e}function c(e,t){if(null==e)return{};var n,r,i=function(e,t){if(null==e)return{};var n,r,i={},s=Object.keys(e);for(r=0;r<s.length;r++)n=s[r],t.indexOf(n)>=0||(i[n]=e[n]);return i}(e,t);if(Object.getOwnPropertySymbols){var s=Object.getOwnPropertySymbols(e);for(r=0;r<s.length;r++)n=s[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(i[n]=e[n])}return i}function h(e){var t,n,l=e.value,h=e.onChange,u=e.suffix,d=void 0===u?"":u,x=e.min,f=void 0===x?2:x,m=e.max,j=void 0===m?32:m,p=c(e,["value","onChange","suffix","min","max"]);return(0,r.jsxs)(i.k,{children:[(0,r.jsxs)(o.iR,a({flex:"1",focusThumbOnChange:!1,value:l,onChange:h,min:f,max:j},p,{children:[(0,r.jsx)(o.Uj,{children:(0,r.jsx)(o.Ms,{})}),(0,r.jsx)(o.gs,{fontSize:"sm",boxSize:"32px",children:l})]})),(0,r.jsxs)(s.Y2,{maxW:"125px",ml:"2rem",value:(n=l,"".concat(n," ").concat(d)),onChange:function(e){var n=null!==(t=parseInt(e))&&void 0!==t?t:0;n>=f&&n<=j&&h(n)},children:[(0,r.jsx)(s.zu,{}),(0,r.jsxs)(s.Fi,{children:[(0,r.jsx)(s.WQ,{}),(0,r.jsx)(s.Y_,{})]})]})]})}},6316:function(e,t,n){"use strict";n.r(t),n.d(t,{default:function(){return M}});var r=n(5893),i=n(7294),s=n(3762),o=n(4096),l=n(4115),a=n(3850),c=n(234),h=n(8017),u=n(336),d=n(8104),x=n(361),f=n(7922),m=n(155),j=n(9008),p=n(357);class g{constructor(e=0,t=1){this.start=e,this.end=t,this.children=null}get size(){return this.end-this.start}get mid(){return this.start+this.size/2}split(){return this.children||(this.children=[new g(this.start,this.mid),new g(this.mid,this.end)]),this.children}}function b(e=10){const t=Math.ceil(Math.log2(e)),n=[new g];for(let r=0;r<t;++r){const t=n.length;for(let r=0;r<t;++r){const[t,i]=n[r].split();if(n[r]=t,n.push(i),n.length===e)return n}}return n}var v=n(7175),y=n(1118),C=n(5401),w=n(9895),S=function(e){var t=e.label,n=e.icon,i=e.children,a=e.iconColor,c=void 0===a?"black":a;return(0,r.jsxs)(s.HC,{display:"flex",alignItems:"center",children:[(0,r.jsx)(s.DE,{w:10,h:10,as:n,color:c}),(0,r.jsxs)(o.k,{direction:"column",ml:2,children:[(0,r.jsx)(l.x,{as:"strong",children:t}),(0,r.jsx)(l.x,{as:"div",color:"gray.600",children:i})]})]})},M=function(){var e,t=(0,i.useState)(6),n=t[0],g=t[1],M=(0,i.useState)(.8),k=M[0],O=M[1],z=(0,i.useState)(.6),P=z[0],W=z[1],E=(0,i.useState)("interpolateSinebow"),I=E[0],_=E[1],F=b(n),T=p[I];return e=T,T=function(t){if("interpolateGreys"===I)return e(t);var n,r=p.hsl(e(t));return r.s=k,r.l=P,null!==(n=null===r||void 0===r?void 0:r.rgb().toString())&&void 0!==n?n:"red"},(0,r.jsxs)("div",{children:[(0,r.jsxs)(j.default,{children:[(0,r.jsx)("title",{children:"C3 - Consistent Categorical Colors"}),(0,r.jsx)("meta",{name:"description",content:"C3 - Consistent Categorical Colors"}),(0,r.jsx)("link",{rel:"icon",href:"/favicon.ico"})]}),(0,r.jsx)(a.W,{as:"header",maxWidth:"100%",children:(0,r.jsxs)(a.W,{centerContent:!0,mb:12,py:6,children:[(0,r.jsxs)(c.Ug,{children:[(0,r.jsx)(h.xu,{mr:6,children:(0,r.jsx)(u.X,{fontSize:"120px",letterSpacing:"-28px",style:{textShadow:"-1px -1px 0 #eee, 1px -1px 0 #eee, -1px 1px 0 #eee, 1px 1px 0 #eee"},children:"C3"})}),(0,r.jsxs)(c.gC,{align:"flex-start",spacing:"-1",fontSize:"lg",children:[(0,r.jsx)(u.X,{fontFamily:"inherit",children:"Consistent"}),(0,r.jsx)(u.X,{fontFamily:"inherit",children:"Categorical"}),(0,r.jsx)(u.X,{fontFamily:"inherit",children:"Colors"})]})]}),(0,r.jsx)(l.x,{my:4,fontSize:"3xl",color:"gray.600",children:"Deterministic colors for maps"})]})}),(0,r.jsxs)(a.W,{as:"main",my:12,children:[(0,r.jsx)(h.xu,{children:(0,r.jsxs)(d.Ph,{id:"colorScale",value:I,onChange:function(e){var t;return _(null===(t=e.target)||void 0===t?void 0:t.value)},children:[(0,r.jsx)("option",{value:"interpolateSinebow",children:"Sinebow"}),(0,r.jsx)("option",{value:"interpolateRainbow",children:"Rainbow"}),(0,r.jsx)("option",{value:"interpolateTurbo",children:"Turbo"}),(0,r.jsx)("option",{value:"interpolateViridis",children:"Viridis"}),(0,r.jsx)("option",{value:"interpolateGreys",children:"Greys"})]})}),(0,r.jsx)(h.xu,{align:"center",children:(0,r.jsx)(v.default,{colors:F,scheme:T,size:500})}),(0,r.jsx)(h.xu,{align:"center",mt:"10",children:(0,r.jsx)(C.default,{colors:F,scheme:T})}),(0,r.jsxs)(h.xu,{mt:10,children:[(0,r.jsx)(w.default,{min:2,max:128,value:n,onChange:g,suffix:"colors"}),(0,r.jsxs)(o.k,{mt:4,children:[(0,r.jsxs)(x.iR,{focusThumbOnChange:!1,value:k,onChange:O,min:0,max:1,step:.1,disabled:"interpolateGreys"===I,children:[(0,r.jsx)(x.Uj,{children:(0,r.jsx)(x.Ms,{})}),(0,r.jsx)(x.gs,{fontSize:"sm",boxSize:"32px",children:k})]}),(0,r.jsx)(h.xu,{mx:10,children:"Saturation"})]}),(0,r.jsxs)(o.k,{mt:4,children:[(0,r.jsxs)(x.iR,{focusThumbOnChange:!1,value:P,onChange:W,min:0,max:1,step:.1,disabled:"interpolateGreys"===I,children:[(0,r.jsx)(x.Uj,{children:(0,r.jsx)(x.Ms,{})}),(0,r.jsx)(x.gs,{fontSize:"sm",boxSize:"32px",children:P})]}),(0,r.jsx)(h.xu,{mx:10,children:"Lightness"})]})]}),(0,r.jsx)(h.xu,{align:"center",mt:14,children:(0,r.jsx)(y.default,{colors:F,scheme:T})}),(0,r.jsx)(u.X,{mt:12,children:"Install"}),(0,r.jsx)(l.x,{my:4,children:"Install from NPM"}),(0,r.jsx)(f.E,{variant:"solid",px:3,py:2,children:"npm install @mapequation/c3"}),(0,r.jsxs)(l.x,{my:4,children:["Source code is available on"," ",(0,r.jsx)("a",{href:"//github.com/mapequation/c3",children:"GitHub"}),"."]}),(0,r.jsx)(u.X,{mt:12,children:"Features"}),(0,r.jsxs)(s.aV,{mt:4,spacing:"5",children:[(0,r.jsx)(S,{label:"Unlimited colors",icon:m.zV5,iconColor:"gray.400",children:"Generate as many colors you want"}),(0,r.jsxs)(S,{label:"Any color scheme",icon:m.dNS,iconColor:"yellow.400",children:["We generate color stops on the interval [0,\xa01]. Perfect to use with ",(0,r.jsx)("a",{href:"https://github.com/d3/d3-scale-chromatic",children:"d3"}),"."]}),(0,r.jsx)(S,{label:"Deterministic",icon:m.MQG,iconColor:"red.600",children:"You always get the same colors for the same requested number of colors."}),(0,r.jsx)(S,{label:"Consistent",icon:m.kEG,iconColor:"green.600",children:"If you increase the number of colors, it doesn't change the list of colors you already have."}),(0,r.jsx)(S,{label:"Fast",icon:m.Pmx,iconColor:"blue.500",children:"The complexity is O(n log(n)) for n colors."})]}),(0,r.jsx)(u.X,{mt:12,children:"Authors"}),(0,r.jsx)(l.x,{mt:4,mb:20,children:"Daniel Edler, Anton Eriksson"})]})]})}}},function(e){e.O(0,[260,357,533,549,510,898,588,774,888,179],(function(){return t=5301,e(e.s=t);var t}));var t=e.O();_N_E=t}]);