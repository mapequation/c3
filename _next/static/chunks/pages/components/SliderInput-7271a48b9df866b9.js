(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[14],{1706:function(n,e,r){"use strict";r.d(e,{qY:function(){return p},ZP:function(){return O},iW:function(){return m},$B:function(){return b}});var t=1/60*1e3,u="undefined"!==typeof performance?function(){return performance.now()}:function(){return Date.now()},o="undefined"!==typeof window?function(n){return window.requestAnimationFrame(n)}:function(n){return setTimeout((function(){return n(u())}),t)};var i=!0,c=!1,f=!1,a={delta:0,timestamp:0},s=["read","update","preRender","render","postRender"],l=s.reduce((function(n,e){return n[e]=function(n){var e=[],r=[],t=0,u=!1,o=new WeakSet,i={schedule:function(n,i,c){void 0===i&&(i=!1),void 0===c&&(c=!1);var f=c&&u,a=f?e:r;return i&&o.add(n),-1===a.indexOf(n)&&(a.push(n),f&&u&&(t=e.length)),n},cancel:function(n){var e=r.indexOf(n);-1!==e&&r.splice(e,1),o.delete(n)},process:function(c){var f;if(u=!0,e=(f=[r,e])[0],(r=f[1]).length=0,t=e.length)for(var a=0;a<t;a++){var s=e[a];s(c),o.has(s)&&(i.schedule(s),n())}u=!1}};return i}((function(){return c=!0})),n}),{}),d=s.reduce((function(n,e){var r=l[e];return n[e]=function(n,e,t){return void 0===e&&(e=!1),void 0===t&&(t=!1),c||x(),r.schedule(n,e,t)},n}),{}),p=s.reduce((function(n,e){return n[e]=l[e].cancel,n}),{}),m=s.reduce((function(n,e){return n[e]=function(){return l[e].process(a)},n}),{}),v=function(n){return l[n].process(a)},h=function(n){c=!1,a.delta=i?t:Math.max(Math.min(n-a.timestamp,40),1),a.timestamp=n,f=!0,s.forEach(v),f=!1,c&&(i=!1,o(h))},x=function(){c=!0,i=!0,f||o(h)},b=function(){return a},O=d},8925:function(n,e,r){(window.__NEXT_P=window.__NEXT_P||[]).push(["/components/SliderInput",function(){return r(9895)}])},9895:function(n,e,r){"use strict";r.r(e),r.d(e,{default:function(){return s}});var t=r(5893),u=r(4096),o=r(299),i=r(361);function c(n,e,r){return e in n?Object.defineProperty(n,e,{value:r,enumerable:!0,configurable:!0,writable:!0}):n[e]=r,n}function f(n){for(var e=1;e<arguments.length;e++){var r=null!=arguments[e]?arguments[e]:{},t=Object.keys(r);"function"===typeof Object.getOwnPropertySymbols&&(t=t.concat(Object.getOwnPropertySymbols(r).filter((function(n){return Object.getOwnPropertyDescriptor(r,n).enumerable})))),t.forEach((function(e){c(n,e,r[e])}))}return n}function a(n,e){if(null==n)return{};var r,t,u=function(n,e){if(null==n)return{};var r,t,u={},o=Object.keys(n);for(t=0;t<o.length;t++)r=o[t],e.indexOf(r)>=0||(u[r]=n[r]);return u}(n,e);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(n);for(t=0;t<o.length;t++)r=o[t],e.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(n,r)&&(u[r]=n[r])}return u}function s(n){var e,r,c=n.value,s=n.onChange,l=n.suffix,d=void 0===l?"":l,p=n.min,m=void 0===p?2:p,v=n.max,h=void 0===v?32:v,x=a(n,["value","onChange","suffix","min","max"]);return(0,t.jsxs)(u.k,{children:[(0,t.jsxs)(i.iR,f({flex:"1",focusThumbOnChange:!1,value:c,onChange:s,min:m,max:h},x,{children:[(0,t.jsx)(i.Uj,{children:(0,t.jsx)(i.Ms,{})}),(0,t.jsx)(i.gs,{fontSize:"sm",boxSize:"32px",children:c})]})),(0,t.jsxs)(o.Y2,{maxW:"125px",ml:"2rem",value:(r=c,"".concat(r," ").concat(d)),onChange:function(n){var r=null!==(e=parseInt(n))&&void 0!==e?e:0;r>=m&&r<=h&&s(r)},children:[(0,t.jsx)(o.zu,{}),(0,t.jsxs)(o.Fi,{children:[(0,t.jsx)(o.WQ,{}),(0,t.jsx)(o.Y_,{})]})]})]})}}},function(n){n.O(0,[549,510,774,888,179],(function(){return e=8925,n(n.s=e);var e}));var e=n.O();_N_E=e}]);