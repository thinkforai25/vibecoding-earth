function _1(md){return(
md`<div style="color: grey; font: 13px/25.5px var(--sans-serif); text-transform: uppercase;"><h1 style="display: none;">World tour</h1><a href="https://d3js.org/">D3</a> › <a href="/@d3/gallery">Gallery</a></div>

# World tour

This animation uses [d3.geoInterpolate](https://d3js.org/d3-geo/math#geoInterpolate) to interpolate a path along great arcs, and [spherical linear interpolation](https://en.wikipedia.org/wiki/Slerp) to rotate the [orthographic](/@d3/orthographic) projection.`
)}

function _2(html,name){return(
html`<b style="display:block;text-align:center;line-height:33px;">目前路線：${name}`
)}

function _controls(html,countryOptions,startCountry,endCountry,$0,$1,formatCountryName)
{
  const container = html`<div style="display:flex;gap:0.75rem;justify-content:center;align-items:center;flex-wrap:wrap;margin:0.5rem 0 1rem 0;font:14px/20px var(--sans-serif);">
    <label style="display:flex;gap:0.4rem;align-items:center;">
      <span>從</span>
      <select name="start">${countryOptions.map(country => `<option value="${country}">${formatCountryName(country)}</option>`).join("")}</select>
    </label>
    <label style="display:flex;gap:0.4rem;align-items:center;">
      <span>到</span>
      <select name="end">${countryOptions.map(country => `<option value="${country}">${formatCountryName(country)}</option>`).join("")}</select>
    </label>
  </div>`;

  const startSelect = container.querySelector('select[name="start"]');
  const endSelect = container.querySelector('select[name="end"]');

  if (startCountry) startSelect.value = startCountry;
  if (endCountry) endSelect.value = endCountry;

  startSelect.addEventListener("change", event => {
    $0.value = event.target.value;
  });

  endSelect.addEventListener("change", event => {
    $1.value = event.target.value;
  });

  return container;
}

async function* _canvas(width,d3,land,borders,countries,startCountry,endCountry,$0,Versor,formatCountryName)
{
  // Specify the chart’s dimensions.
  const height = Math.min(width, 720); // Observable sets a responsive *width*

  // Prepare a canvas.
  const dpr = window.devicePixelRatio ?? 1;
  const canvas = d3.create("canvas")
      .attr("width", dpr * width)
      .attr("height", dpr * height)
      .style("width", `${width}px`);
  const context = canvas.node().getContext("2d");
  context.scale(dpr, dpr);

  // Create a projection and a path generator.
  const projection = d3.geoOrthographic().fitExtent([[10, 10], [width - 10, height - 10]], {type: "Sphere"});
  const path = d3.geoPath(projection, context);
  const tilt = 20;

  const origin = countries.find(country => country.properties.name === startCountry) ?? countries[0];
  const destination = countries.find(country => country.properties.name === endCountry) ?? origin;

  const p1 = origin ? d3.geoCentroid(origin) : [0, 0];
  const p2 = destination ? d3.geoCentroid(destination) : p1;
  const r1 = origin ? [-p1[0], tilt - p1[1], 0] : [0, tilt, 0];
  const r2 = destination ? [-p2[0], tilt - p2[1], 0] : r1;

  if (origin) {
    projection.rotate(r1);
  }

  const arcColor = "#111";
  const originColor = "#f03";
  const destinationColor = "#2a9d8f";

  function render(arc) {
    context.clearRect(0, 0, width, height);
    context.beginPath(), path(land), context.fillStyle = "#ccc", context.fill();
    if (origin) {
      context.beginPath(), path(origin), context.fillStyle = originColor, context.fill();
    }
    if (destination) {
      context.beginPath(), path(destination), context.fillStyle = destinationColor, context.fill();
    }
    context.beginPath(), path(borders), context.strokeStyle = "#fff", context.lineWidth = 0.5, context.stroke();
    context.beginPath(), path({type: "Sphere"}), context.strokeStyle = "#000", context.lineWidth = 1.5, context.stroke();
    if (arc) {
      context.beginPath(), path(arc), context.strokeStyle = arcColor, context.stroke();
    }
    return context.canvas;
  }

  $0.value = origin && destination ? `${formatCountryName(origin.properties.name)} → ${formatCountryName(destination.properties.name)}` : "選擇國家";

  yield render();

  if (!origin || !destination || origin === destination) return;

  const ip = d3.geoInterpolate(p1, p2);
  const iv = Versor.interpolateAngles(r1, r2);

  await d3.transition()
      .duration(1250)
      .tween("render", () => t => {
        projection.rotate(iv(t));
        render({type: "LineString", coordinates: [p1, ip(t)]});
      })
    .transition()
      .tween("render", () => t => {
        render({type: "LineString", coordinates: [ip(t), p2]});
      })
    .end();
}


function _Versor(){return(
class Versor {
  static fromAngles([l, p, g]) {
    l *= Math.PI / 360;
    p *= Math.PI / 360;
    g *= Math.PI / 360;
    const sl = Math.sin(l), cl = Math.cos(l);
    const sp = Math.sin(p), cp = Math.cos(p);
    const sg = Math.sin(g), cg = Math.cos(g);
    return [
      cl * cp * cg + sl * sp * sg,
      sl * cp * cg - cl * sp * sg,
      cl * sp * cg + sl * cp * sg,
      cl * cp * sg - sl * sp * cg
    ];
  }
  static toAngles([a, b, c, d]) {
    return [
      Math.atan2(2 * (a * b + c * d), 1 - 2 * (b * b + c * c)) * 180 / Math.PI,
      Math.asin(Math.max(-1, Math.min(1, 2 * (a * c - d * b)))) * 180 / Math.PI,
      Math.atan2(2 * (a * d + b * c), 1 - 2 * (c * c + d * d)) * 180 / Math.PI
    ];
  }
  static interpolateAngles(a, b) {
    const i = Versor.interpolate(Versor.fromAngles(a), Versor.fromAngles(b));
    return t => Versor.toAngles(i(t));
  }
  static interpolateLinear([a1, b1, c1, d1], [a2, b2, c2, d2]) {
    a2 -= a1, b2 -= b1, c2 -= c1, d2 -= d1;
    const x = new Array(4);
    return t => {
      const l = Math.hypot(x[0] = a1 + a2 * t, x[1] = b1 + b2 * t, x[2] = c1 + c2 * t, x[3] = d1 + d2 * t);
      x[0] /= l, x[1] /= l, x[2] /= l, x[3] /= l;
      return x;
    };
  }
  static interpolate([a1, b1, c1, d1], [a2, b2, c2, d2]) {
    let dot = a1 * a2 + b1 * b2 + c1 * c2 + d1 * d2;
    if (dot < 0) a2 = -a2, b2 = -b2, c2 = -c2, d2 = -d2, dot = -dot;
    if (dot > 0.9995) return Versor.interpolateLinear([a1, b1, c1, d1], [a2, b2, c2, d2]); 
    const theta0 = Math.acos(Math.max(-1, Math.min(1, dot)));
    const x = new Array(4);
    const l = Math.hypot(a2 -= a1 * dot, b2 -= b1 * dot, c2 -= c1 * dot, d2 -= d1 * dot);
    a2 /= l, b2 /= l, c2 /= l, d2 /= l;
    return t => {
      const theta = theta0 * t;
      const s = Math.sin(theta);
      const c = Math.cos(theta);
      x[0] = a1 * c + a2 * s;
      x[1] = b1 * c + b2 * s;
      x[2] = c1 * c + c2 * s;
      x[3] = d1 * c + d2 * s;
      return x;
    };
  }
}
)}

function _name(){return(
""
)}

function _countryTranslations(){return(
new Map([
  ["Afghanistan", "阿富汗"],
  ["Albania", "阿爾巴尼亞"],
  ["Algeria", "阿爾及利亞"],
  ["Angola", "安哥拉"],
  ["Antarctica", "南極洲"],
  ["Argentina", "阿根廷"],
  ["Armenia", "亞美尼亞"],
  ["Australia", "澳洲"],
  ["Austria", "奧地利"],
  ["Azerbaijan", "亞塞拜然"],
  ["Bahamas", "巴哈馬"],
  ["Bangladesh", "孟加拉"],
  ["Belarus", "白俄羅斯"],
  ["Belgium", "比利時"],
  ["Belize", "貝里斯"],
  ["Benin", "貝南"],
  ["Bhutan", "不丹"],
  ["Bolivia", "玻利維亞"],
  ["Bosnia and Herz.", "波士尼亞與赫塞哥維納"],
  ["Botswana", "波札那"],
  ["Brazil", "巴西"],
  ["Brunei", "汶萊"],
  ["Bulgaria", "保加利亞"],
  ["Burkina Faso", "布吉納法索"],
  ["Burundi", "布隆迪"],
  ["Cambodia", "柬埔寨"],
  ["Cameroon", "喀麥隆"],
  ["Canada", "加拿大"],
  ["Central African Rep.", "中非共和國"],
  ["Chad", "查德"],
  ["Chile", "智利"],
  ["China", "中國"],
  ["Colombia", "哥倫比亞"],
  ["Congo", "剛果共和國"],
  ["Costa Rica", "哥斯大黎加"],
  ["Croatia", "克羅埃西亞"],
  ["Cuba", "古巴"],
  ["Cyprus", "塞浦路斯"],
  ["Czechia", "捷克"],
  ["Côte d'Ivoire", "象牙海岸"],
  ["Dem. Rep. Congo", "剛果民主共和國"],
  ["Denmark", "丹麥"],
  ["Djibouti", "吉布地"],
  ["Dominican Rep.", "多明尼加共和國"],
  ["Ecuador", "厄瓜多"],
  ["Egypt", "埃及"],
  ["El Salvador", "薩爾瓦多"],
  ["Eq. Guinea", "赤道幾內亞"],
  ["Eritrea", "厄利垂亞"],
  ["Estonia", "愛沙尼亞"],
  ["Ethiopia", "衣索比亞"],
  ["Falkland Is.", "福克蘭群島"],
  ["Fiji", "斐濟"],
  ["Finland", "芬蘭"],
  ["Fr. S. Antarctic Lands", "法屬南方和南極領地"],
  ["France", "法國"],
  ["Gabon", "加彭"],
  ["Gambia", "甘比亞"],
  ["Georgia", "喬治亞"],
  ["Germany", "德國"],
  ["Ghana", "迦納"],
  ["Greece", "希臘"],
  ["Greenland", "格陵蘭"],
  ["Guatemala", "瓜地馬拉"],
  ["Guinea", "幾內亞"],
  ["Guinea-Bissau", "幾內亞比索"],
  ["Guyana", "蓋亞那"],
  ["Haiti", "海地"],
  ["Honduras", "宏都拉斯"],
  ["Hungary", "匈牙利"],
  ["Iceland", "冰島"],
  ["India", "印度"],
  ["Indonesia", "印尼"],
  ["Iran", "伊朗"],
  ["Iraq", "伊拉克"],
  ["Ireland", "愛爾蘭"],
  ["Israel", "以色列"],
  ["Italy", "義大利"],
  ["Jamaica", "牙買加"],
  ["Japan", "日本"],
  ["Jordan", "約旦"],
  ["Kazakhstan", "哈薩克"],
  ["Kenya", "肯亞"],
  ["Kosovo", "科索沃"],
  ["Kuwait", "科威特"],
  ["Kyrgyzstan", "吉爾吉斯"],
  ["Laos", "寮國"],
  ["Latvia", "拉脫維亞"],
  ["Lebanon", "黎巴嫩"],
  ["Lesotho", "賴索托"],
  ["Liberia", "賴比瑞亞"],
  ["Libya", "利比亞"],
  ["Lithuania", "立陶宛"],
  ["Luxembourg", "盧森堡"],
  ["Macedonia", "北馬其頓"],
  ["Madagascar", "馬達加斯加"],
  ["Malawi", "馬拉威"],
  ["Malaysia", "馬來西亞"],
  ["Mali", "馬利"],
  ["Mauritania", "茅利塔尼亞"],
  ["Mexico", "墨西哥"],
  ["Moldova", "摩爾多瓦"],
  ["Mongolia", "蒙古"],
  ["Montenegro", "蒙特內哥羅"],
  ["Morocco", "摩洛哥"],
  ["Mozambique", "莫三比克"],
  ["Myanmar", "緬甸"],
  ["N. Cyprus", "北賽普勒斯"],
  ["Namibia", "納米比亞"],
  ["Nepal", "尼泊爾"],
  ["Netherlands", "荷蘭"],
  ["New Caledonia", "新喀里多尼亞"],
  ["New Zealand", "紐西蘭"],
  ["Nicaragua", "尼加拉瓜"],
  ["Niger", "尼日"],
  ["Nigeria", "奈及利亞"],
  ["North Korea", "北韓"],
  ["Norway", "挪威"],
  ["Oman", "阿曼"],
  ["Pakistan", "巴基斯坦"],
  ["Palestine", "巴勒斯坦"],
  ["Panama", "巴拿馬"],
  ["Papua New Guinea", "巴布亞紐幾內亞"],
  ["Paraguay", "巴拉圭"],
  ["Peru", "秘魯"],
  ["Philippines", "菲律賓"],
  ["Poland", "波蘭"],
  ["Portugal", "葡萄牙"],
  ["Puerto Rico", "波多黎各"],
  ["Qatar", "卡達"],
  ["Romania", "羅馬尼亞"],
  ["Russia", "俄羅斯"],
  ["Rwanda", "盧安達"],
  ["S. Sudan", "南蘇丹"],
  ["Saudi Arabia", "沙烏地阿拉伯"],
  ["Senegal", "塞內加爾"],
  ["Serbia", "塞爾維亞"],
  ["Sierra Leone", "獅子山"],
  ["Slovakia", "斯洛伐克"],
  ["Slovenia", "斯洛維尼亞"],
  ["Solomon Is.", "索羅門群島"],
  ["Somalia", "索馬利亞"],
  ["Somaliland", "索馬利蘭"],
  ["South Africa", "南非"],
  ["South Korea", "南韓"],
  ["Spain", "西班牙"],
  ["Sri Lanka", "斯里蘭卡"],
  ["Sudan", "蘇丹"],
  ["Suriname", "蘇利南"],
  ["Sweden", "瑞典"],
  ["Switzerland", "瑞士"],
  ["Syria", "敘利亞"],
  ["Taiwan", "台灣"],
  ["Tajikistan", "塔吉克"],
  ["Tanzania", "坦尚尼亞"],
  ["Thailand", "泰國"],
  ["Timor-Leste", "東帝汶"],
  ["Togo", "多哥"],
  ["Trinidad and Tobago", "千里達和多巴哥"],
  ["Tunisia", "突尼西亞"],
  ["Turkey", "土耳其"],
  ["Turkmenistan", "土庫曼"],
  ["Uganda", "烏干達"],
  ["Ukraine", "烏克蘭"],
  ["United Arab Emirates", "阿拉伯聯合大公國"],
  ["United Kingdom", "英國"],
  ["United States of America", "美國"],
  ["Uruguay", "烏拉圭"],
  ["Uzbekistan", "烏茲別克"],
  ["Vanuatu", "萬那杜"],
  ["Venezuela", "委內瑞拉"],
  ["Vietnam", "越南"],
  ["W. Sahara", "西撒哈拉"],
  ["Yemen", "葉門"],
  ["Zambia", "尚比亞"],
  ["Zimbabwe", "辛巴威"],
  ["eSwatini", "史瓦帝尼"]
])
)}

function _formatCountryName(countryTranslations){return(
name => {
  const translation = countryTranslations.get(name);
  return translation ? `${translation}（${name}）` : name;
}
)}

function _countryOptions(countries){return(
countries.map(country => country.properties.name).sort((a, b) => a.localeCompare(b))
)}

function _initialStartCountry(countryOptions){return(
countryOptions[0] ?? ""
)}

function _initialEndCountry(countryOptions){return(
countryOptions[1] ?? countryOptions[0] ?? ""
)}

function _countries(topojson,world){return(
topojson.feature(world, world.objects.countries).features
)}

function _borders(topojson,world){return(
topojson.mesh(world, world.objects.countries, (a, b) => a !== b)
)}

function _land(topojson,world){return(
topojson.feature(world, world.objects.land)
)}

function _world(FileAttachment){return(
FileAttachment("countries-110m.json").json()
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  function toString() { return this.url; }
  const fileAttachments = new Map([
    ["countries-110m.json", {url: new URL("./files/26fc08875c617b59939afa42f6f1e1bf5e75f11dcc2e482d963b6e4128f0250d708f983050a43862ae73d016bc328d1f3f40bc0df709d5dd310f789f334c0ee8.json", import.meta.url), mimeType: "application/json", toString}]
  ]);
  main.builtin("FileAttachment", runtime.fileAttachments(name => fileAttachments.get(name)));
  main.variable(observer()).define(["md"], _1);
  main.variable(observer("controls")).define("controls", ["html","countryOptions","startCountry","endCountry","mutable startCountry","mutable endCountry","formatCountryName"], _controls);
  main.variable(observer()).define(["html","name"], _2);
  main.variable(observer("canvas")).define("canvas", ["width","d3","land","borders","countries","startCountry","endCountry","mutable name","Versor","formatCountryName"], _canvas);
  main.variable(observer("Versor")).define("Versor", _Versor);
  main.define("initial name", _name);
  main.variable(observer("mutable name")).define("mutable name", ["Mutable", "initial name"], (M, _) => new M(_));
  main.variable(observer("name")).define("name", ["mutable name"], _ => _.generator);
  main.variable(observer("countryTranslations")).define("countryTranslations", _countryTranslations);
  main.variable(observer("formatCountryName")).define("formatCountryName", ["countryTranslations"], _formatCountryName);
  main.variable(observer("countryOptions")).define("countryOptions", ["countries"], _countryOptions);
  main.define("initial startCountry", ["countryOptions"], _initialStartCountry);
  main.variable(observer("mutable startCountry")).define("mutable startCountry", ["Mutable", "initial startCountry"], (M, _) => new M(_));
  main.variable(observer("startCountry")).define("startCountry", ["mutable startCountry"], _ => _.generator);
  main.define("initial endCountry", ["countryOptions"], _initialEndCountry);
  main.variable(observer("mutable endCountry")).define("mutable endCountry", ["Mutable", "initial endCountry"], (M, _) => new M(_));
  main.variable(observer("endCountry")).define("endCountry", ["mutable endCountry"], _ => _.generator);
  main.variable(observer("countries")).define("countries", ["topojson","world"], _countries);
  main.variable(observer("borders")).define("borders", ["topojson","world"], _borders);
  main.variable(observer("land")).define("land", ["topojson","world"], _land);
  main.variable(observer("world")).define("world", ["FileAttachment"], _world);
  return main;
}
