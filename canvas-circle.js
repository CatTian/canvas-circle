/**
 * canvas circle
 * @authors echo tian
 * description js原生，算是定制的，兼容多端，具体的兼容状况还没测试，ps：原来自己写插件这么多事要考虑的，以前都是用现成的插件，浏览器兼容也是作者提前告知的，真心不易啊，现在自己开始写后，对那些作者肃然起敬！
 * @date    2018-01-25 10:44:46
 */
/**
 * [CirChart description]
 *
 * @param       {[type]} config
 * @constructor
 */
function CirChart(config) {
  // 构造函数模式用于定义实例属性（每个实例都会有自己的一份实例属性副本），原型模式用于定义方法和共享属性
  this.cfg = {
    el: '', // 元素
    canvas: null,
    ctx: null,
    size: null, // 尺寸
    radius: 0.0, // 半径 与size相关联 不用设置
    point: '', // 绘制原点坐标，因为初始化为二倍图，所以原点坐标为直径
    front: {
      thickness: 40, // 饼图厚度 如果有百分比标签[isDrowLabel]，厚度不能超多canvas半径的1/3
      lineCap: 'butt', // 'butt'直角 'round'圆角
      shadowX: 0.0, // 阴影x轴位移
      shadowY: 0.0, // 阴影y轴位移
      shadowBlur: 5 // 阴影大小
    },
    bg: { // 背景
      fillColor: '#27253d', // 圆环颜色
      thickness: .8, // 背景与饼图厚度的占比1=100%，默认80%
      shadowX: 0.0, // 阴影x轴位移
      shadowY: 0.0, // 阴影y轴位移
      shadowBlur: 5 // 阴影大小
    },
    label: {
      show: false, // 是否显示百分比，默认不显示
      fontFamily: 10 // 百分比标签 字号、字体
    },
    arrow: {
      show: false, // 是否显示数据标签，默认不显示
      fontFamily: 12, // 标示数据名标签 字号、字体
      fontColor: '#fff' // 标签数据名字体颜色
    },
    shadowColor: 'rgba(0,0,0,0.6)', // 统一阴影颜色
    fontStyle: {
      textAlign: 'center', // 统一文案居中
      shadowColor: 'rgba(0,0,0,0.6)',
      shadowX: 0.0,
      shadowY: 0.0,
      shadowBlur: 5
    },
    animation: {
      show: false, // 是否开启动画效果，默认是关闭
      duration: 70, // 动画时长， 每个数据的动画总时长相同， 速度根据数据值不同
      speed: [], //各数据的动画速度，目前只支持匀速
      locus: [] // 各数据的动画轨迹
    },
    data: [ // 总量100
      {
        value: 70, // 占比 百分比制
        name: '数据', // 数据名
        fillColor: '#0079FF' //饼图填充色 接收rgba、rgb格式
      }
    ]
  };
  this.init(config);
}
// 共享性不高的属性，由于数量较多，是做成构造函数的实例属性好呢，还是实例中由所有实例共享的属性好呢？
CirChart.prototype = {
  constructor: CirChart,
  // 初始化
  init: function(config) {
    // self 实际上始终都指向 window 所以要改掉 var self = this; 的习惯
    var $this = this;
    // 替换自定义属性
    extend(true, $this.cfg, config);

    $this.cfg.el = document.getElementById($this.cfg.el);
    $this.cfg.size = $this.cfg.el.offsetHeight;
    $this.cfg.doubleSize = $this.cfg.size * 2;
    // 绘制原点
    $this.cfg.point = $this.cfg.size;
    // 计算半径
    if ($this.cfg.label.show) { //显示数据标签，需要缩小环形图半径
      $this.cfg.radius = ($this.cfg.point - $this.cfg.front.thickness - $this.cfg.front.shadowBlur) * .7;
    } else {
      $this.cfg.radius = ($this.cfg.point - $this.cfg.front.thickness - $this.cfg.front.shadowBlur);
    }
    // 设定canvas宽高
    $this.initWidget();
    // 绘制圆形图
    if ($this.cfg.animation.show === true) {
      $this.drowAnimat($this.cfg.data);
    } else {
      // 先画背景圆环再画填充
      $this.drowBgCir();
      $this.drowCir($this.cfg.data);
    }
  },
  // 设定canvas宽高
  initWidget: function() {
    var $this = this,
      canvas = $this.cfg.canvas = $this.cfg.canvas || document.createElement('canvas');

    canvas.width = $this.cfg.doubleSize;
    canvas.height = $this.cfg.doubleSize;
    canvas.style.width = $this.cfg.size + 'px';
    canvas.style.height = $this.cfg.size + 'px';
    $this.cfg.el.insertBefore(canvas, $this.cfg.el[0]);
    $this.cfg.ctx = canvas.getContext('2d');
  },
  /**
   * [转换弧度]
   *
   * @param  {[type]} x 角度
   */
  rads: function(x) {
    return (Math.PI * 360 * x / 100 / 180);
  },
  // 绘制数据饼
  drowCir: function() {
    var $this = this,
      ctx = $this.cfg.ctx,
      radian = -25; // 初始化饼图开始位置
    // 遍历数据
    $this.cfg.data.forEach(function(o, i) {
      var cirWidth = Math.PI * ($this.cfg.doubleSize - $this.cfg.front.thickness),
        labelRadian = $this.rads(radian + (o.value / 2)), // 标签、百分比位置(跟随百分比动起来)
        endRadian = $this.rads(radian + o.value); // 数据的最后位置
      // 如果需要动画
      if ($this.cfg.animation.show) {
        // 轨迹值大于数据值时动画结束，最后呈现的是执行的非动画分支
        if ($this.cfg.animation.locus[i] > o.value) {
          $this.cfg.animation.show = false;
        }
        $this.cfg.animation.speed[i] = o.value / $this.cfg.animation.duration;
        labelRadian = $this.rads(radian + ($this.cfg.animation.locus[i] / 2));
        endRadian = $this.rads(radian + $this.cfg.animation.locus[i]);
        $this.cfg.animation.locus[i] += $this.cfg.animation.speed[i];
      }

      // 绘制百分比标签
      if ($this.cfg.label.show) {
        $this.drowLabel(labelRadian, $this.cfg.radius, o.fillColor, o.value);
      }

      ctx.save(); // 因为上一步是绘制百分比标签，所以这里需要保存一下目前的状态
      ctx.beginPath();
      // 数据饼
      ctx.strokeStyle = o.fillColor;
      ctx.arc($this.cfg.point, $this.cfg.point, $this.cfg.radius, $this.rads(radian), endRadian, false);
      ctx.lineWidth = $this.cfg.front.thickness * 2;
      ctx.lineCap = $this.cfg.front.lineCap;
      ctx.shadowOffsetX = $this.cfg.front.shadowX * 2;
      ctx.shadowOffsetY = $this.cfg.front.shadowY * 2;
      ctx.shadowBlur = $this.cfg.front.shadowBlur * 2;
      ctx.shadowColor = $this.cfg.shadowColor;
      ctx.stroke();
      ctx.restore();

      // 绘制标示数据名标签 labelRadian 需要衔接环形图的位置，单独放在外面执行角度会初始化
      if (o.name !== '') {
        $this.drowArrow(labelRadian, $this.cfg.radius, o.name);
      }
      radian = radian + o.value;
    });
  },
  // 绘制底部背景圈
  drowBgCir: function() {
    var $this = this,
      ctx = $this.cfg.ctx;

    ctx.beginPath();
    ctx.save();
    ctx.arc($this.cfg.point, $this.cfg.point, $this.cfg.radius, 0, $this.rads(360));
    ctx.lineWidth = ($this.cfg.front.thickness * 2) * $this.cfg.bg.thickness;
    ctx.strokeStyle = $this.cfg.bg.fillColor;
    ctx.shadowOffsetX = $this.cfg.bg.shadowX * 2;
    ctx.shadowOffsetY = $this.cfg.bg.shadowY * 2;
    ctx.shadowBlur = $this.cfg.bg.shadowBlur * 2;
    ctx.shadowColor = $this.cfg.shadowColor;
    ctx.stroke();
    ctx.restore();
  },
  /**
   * [绘制标示数据名]
   *
   * @param  {[type]} angle 旋转弧度
   * @param  {[type]} radius 饼半径
   * @param  {[type]} name 数据名
   */
  drowArrow: function(angle, radius, name) {
    var $this = this,
      ctx = $this.cfg.ctx,
      a = $this.cfg.point,
      b = a,
      x = Number(a + radius * Math.cos(angle)),
      y = Number(b + radius * Math.sin(angle));

    ctx.font = $this.cfg.arrow.fontFamily * 2 + 'px 黑体'; // *2是因为canvas按比例缩小一倍
    ctx.textAlign = $this.cfg.fontStyle.textAlign;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = $this.cfg.arrow.fontColor;
    ctx.save();
    ctx.beginPath();
    ctx.shadowColor = $this.cfg.fontStyle.shadowColor;
    ctx.shadowBlur = $this.cfg.fontStyle.shadowBlur;
    ctx.shadowOffsetX = $this.cfg.fontStyle.shadowX;
    ctx.shadowOffsetY = $this.cfg.fontStyle.shadowY;
    ctx.fillText(name, x, y);
    ctx.fill();
    ctx.restore();
  },
  // 绘制百分比标签
  /**
   * [description]
   *
   * @param  {[type]} angle 旋转弧度
   * @param  {[type]} radius 饼半径
   * @param  {[type]} color 数据色
   * @param  {[type]} val 数据值
   */
  drowLabel: function(angle, radius, color, val) {
    var $this = this,
      ctx = $this.cfg.ctx,
      r = ($this.cfg.point - $this.cfg.front.thickness - $this.cfg.front.shadowBlur) * 0.9,
      a = $this.cfg.point,
      b = a,
      x1 = Number(a + radius * Math.cos(angle)),
      y1 = Number(b + radius * Math.sin(angle)),
      x2 = Number(a + r * Math.cos(angle)),
      y2 = Number(b + r * Math.sin(angle)),
      d, d2, d3, align;
    // 根据弧度大小调整百分比标签的对其方式
    if (angle > (Math.PI / 2)) { // 左侧
      d = -$this.cfg.front.thickness / 4; // 折线长度为饼厚度的1/4
      d2 = +3;
      d3 = 0;
      align = 'right';
    } else if (angle < (Math.PI / 2)) { // 右侧
      d = $this.cfg.front.thickness / 4;
      d2 = +1;
      d3 = 0;
      align = 'left';
    } else { // 顶部、底部
      d = 0;
      d2 = +1;
      d3 = $this.cfg.front.thickness / 4;
      align = 'center';
    }

    ctx.font = $this.cfg.label.fontFamily * 2 + 'px 黑体';
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.lineWidth = 1;
    ctx.strokeStyle = color;
    ctx.save();
    ctx.beginPath(); // 折线
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1, y1); // 起点
    ctx.lineTo((x2 + d), y2); // 折点
    ctx.lineTo((x2 + 2 * d), (y2 + d3)); // 终点
    ctx.shadowColor = $this.cfg.fontStyle.shadowColor;
    ctx.shadowBlur = $this.cfg.fontStyle.shadowBlur;
    ctx.shadowOffsetX = $this.cfg.fontStyle.shadowX;
    ctx.shadowOffsetY = $this.cfg.fontStyle.shadowY;
    ctx.stroke();

    ctx.beginPath(); // 数据值
    ctx.save();
    ctx.shadowColor = $this.cfg.fontStyle.shadowColor;
    ctx.shadowBlur = $this.cfg.fontStyle.shadowBlur;
    ctx.shadowOffsetX = $this.cfg.fontStyle.shadowX;
    ctx.shadowOffsetY = $this.cfg.fontStyle.shadowY;
    ctx.fillText(val + '%', (x2 + 2 * d + d2), (y2 + 2 * d3)); // 数据值
    ctx.fill();
    ctx.restore();
  },
  /**
   * [绘制动画]
   *
   * @param  {[type]} data 数据
   */
  drowAnimat: function(data) {
    var $this = this;
    // 初始化 locus[], 动画速度speed[]
    data.forEach(function(o, i) {
      $this.cfg.animation.locus[i] = null;
      $this.cfg.animation.speed[i] = null;
    });
    // 执行动画
    (function drowFrame() {
      window.requestAnimationFrame(drowFrame, $this.cfg.canvas);
      $this.cfg.ctx.clearRect(0, 0, $this.cfg.doubleSize, $this.cfg.doubleSize);
      $this.drowBgCir();
      $this.drowCir(data);
    }());
  }
}
// 配置拷贝，可深可浅
var class2type = {},
  isArray = Array.isArray || function(object) {
    return object instanceof Array;
  },
  emptyArray = [],
  slice = emptyArray.slice;

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
var extend = function(target) {
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
