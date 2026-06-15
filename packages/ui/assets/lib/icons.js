/* Shared Lucide icon helper for Jamie Nisbet UI kits & slides.
   Requires React and lucide UMD loaded first. Plain JS (no JSX). */
(function () {
  function toCamel(attrs) {
    var out = {};
    for (var k in attrs) {
      if (k === 'class') { out.className = attrs[k]; continue; }
      var ck = k.replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); });
      out[ck] = attrs[k];
    }
    return out;
  }
  function Icon(props) {
    var name = props.name;
    var size = props.size || 20;
    var sw = props.strokeWidth || 2;
    var lib = (window.lucide && window.lucide.icons) || {};
    var node = lib[name];
    if (!node) return null;
    var children = node[2] || [];
    return React.createElement('svg', {
      width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
      stroke: 'currentColor', strokeWidth: sw, strokeLinecap: 'round',
      strokeLinejoin: 'round', className: props.className, style: props.style,
      'aria-hidden': true
    }, children.map(function (c, i) {
      return React.createElement(c[0], Object.assign({ key: i }, toCamel(c[1] || {})));
    }));
  }
  window.Icon = Icon;
})();
