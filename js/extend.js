/***********************************配置拷贝，可深可浅(参考zepto的$.extend())*********************************/
var class2type = {},
  emptyArray = [],
  slice = emptyArray.slice,
  isArray = Array.isArray || function(object) {
    return object instanceof Array;
  };

function isWindow(obj) {
  return obj != null && obj == obj.window;
}

function type(obj) {
  return obj == null ? String(obj) :
    class2type[toString.call(obj)] || "object";
}

function isObject(obj) {
  return type(obj) == "object";
}

function isPlainObject(obj) {
  return isObject(obj) && !isWindow(obj) && Object.getPrototypeOf(obj) == Object.prototype;
}

function _extend(target, source, deep) {
  for (key in source)
    if (deep && (isPlainObject(source[key]) || isArray(source[key]))) {
      if (isPlainObject(source[key]) && !isPlainObject(target[key]))
        target[key] = {};
      if (isArray(source[key]) && !isArray(target[key]))
        target[key] = [];
      _extend(target[key], source[key], deep);
    }
  else if (source[key] !== undefined) target[key] = source[key]
}
/**
 * [extend 配置拷贝]
 *
 * @param  {[type]} target
 * @return {[type]} 用法：默认情况下为，复制为浅拷贝（浅复制）。如果第一个参数为true表示深度拷贝（深度复制）
 * extend(target, [source, [source2, ...]])   ⇒ target
 * extend(true, target, [source, ...])   ⇒ target v1.0+
 */
function extend(target) {
  var deep, args = slice.call(arguments, 1)
  if (typeof target == 'boolean') {
    deep = target;
    target = args.shift();
  }
  args.forEach(function(arg) {
    _extend(target, arg, deep);
  })
  return target;
}
