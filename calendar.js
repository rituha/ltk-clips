/* =============================================================
   LTK Finale カレンダー（index.html と schedule.html で共用）
   ・2026年10月・11月のカレンダーを描く
   ・大会の予定（チーム発表・試合日）をその日のマスに書く
   ・日付は "2026-10-15" の形で保存する（firestore.rules と同じ範囲）
   通信はしません。画面に描くだけです。
   ============================================================= */
(function(){
"use strict";

/* 大会の予定（2026/10/07時点の公開情報） */
var EVENTS = {
  "2026-10-07": {kind:"announce", cell:"チーム発表", label:"チーム発表"},
  "2026-10-15": {kind:"regular",  cell:"Regular 1",  label:"Regular Stage DAY1"},
  "2026-10-19": {kind:"regular",  cell:"Regular 2",  label:"Regular Stage DAY2"},
  "2026-10-20": {kind:"masters",  cell:"Masters 1",  label:"Masters Cup DAY1"},
  "2026-10-23": {kind:"regular",  cell:"Regular 3",  label:"Regular Stage DAY3"},
  "2026-10-27": {kind:"regular",  cell:"Regular 4",  label:"Regular Stage DAY4"},
  "2026-10-28": {kind:"masters",  cell:"Masters 2",  label:"Masters Cup DAY2"},
  "2026-11-02": {kind:"regular",  cell:"Regular 5",  label:"Regular Stage DAY5"},
  "2026-11-06": {kind:"regular",  cell:"Regular 6",  label:"Regular Stage DAY6"},
  "2026-11-09": {kind:"masters",  cell:"Masters 3",  label:"Masters Cup DAY3"},
  "2026-11-21": {kind:"playoffs", cell:"Playoffs 1", label:"Playoffs DAY1"},
  "2026-11-22": {kind:"playoffs", cell:"Playoffs 2", label:"Playoffs DAY2"}
};
var MONTHS = [[2026,10],[2026,11]];
var FIRST = "2026-10-01", LAST = "2026-11-30";
var WD = ["日","月","火","水","木","金","土"];

function pad(n){ return (n<10?"0":"")+n; }
function el(tag,cls,text){ var e=document.createElement(tag); if(cls) e.className=cls; if(text!=null) e.textContent=text; return e; }
function todayJST(){ return new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Tokyo",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date()); }
function parts(date){ var p=date.split("-"); return [+p[0],+p[1],+p[2]]; }
function wd(date){ var p=parts(date); return WD[new Date(Date.UTC(p[0],p[1]-1,p[2])).getUTCDay()]; }
function md(date){ var p=parts(date); return p[1]+"/"+p[2]; }
function valid(date){ return typeof date==="string" && /^\d{4}-\d{2}-\d{2}$/.test(date) && date>=FIRST && date<=LAST; }

/* その日が何の日か */
function info(date){
  var e=EVENTS[date]; if(e) return e;
  if(date<"2026-10-07") return {kind:"pre",      cell:"", label:"チーム発表前"};
  if(date>"2026-11-22") return {kind:"post",     cell:"", label:"大会後"};
  return                       {kind:"practice", cell:"", label:"練習・配信"};
}
function label(date){ return valid(date)? md(date)+"（"+wd(date)+"） "+info(date).label : "日付なし"; }
function whenOf(date){ var t=todayJST(); return date<t?"past":date===t?"today":"future"; }
function defaultDate(){ var t=todayJST(); return t<FIRST? "2026-10-07" : t>LAST? LAST : t; }
function monthOf(date){ return parts(date)[1]; }

/* カレンダーを描く
   opts.selected   選ばれている日付
   opts.onSelect   日付を押したとき
   opts.counts     {日付: クリップ数}（あれば数字を出す）
   opts.months     描く月（省略で10月と11月）
   opts.noFuture   true なら今日より先の日は押せない */
function render(root, opts){
  opts=opts||{};
  root.textContent="";
  root.classList.add("ltkcal");
  (opts.months||MONTHS).forEach(function(ym){
    var box=el("div","cal-month");
    box.appendChild(el("div","cal-title", ym[0]+"年 "+ym[1]+"月"));
    var grid=el("div","cal-grid");
    WD.forEach(function(w,i){ grid.appendChild(el("span","cal-wd"+(i===0?" sun":i===6?" sat":""), w)); });
    var first=new Date(Date.UTC(ym[0],ym[1]-1,1)).getUTCDay();
    var days=new Date(Date.UTC(ym[0],ym[1],0)).getUTCDate();
    for(var i=0;i<first;i++) grid.appendChild(el("span","cal-blank"));
    for(var d=1; d<=days; d++){
      (function(date){
        var inf=info(date), when=whenOf(date);
        var b=el("button","cal-day"); b.type="button";
        b.dataset.kind=inf.kind; b.dataset.when=when;
        b.setAttribute("aria-pressed", opts.selected===date?"true":"false");
        b.setAttribute("aria-label", label(date)+(opts.counts&&opts.counts[date]? "・クリップ"+opts.counts[date]+"本":""));
        b.title=label(date);
        b.appendChild(el("span","n", String(+date.slice(8))));
        if(inf.cell) b.appendChild(el("span","ev", inf.cell));
        if(opts.counts && opts.counts[date]) b.appendChild(el("span","cnt", opts.counts[date]+"本"));
        if(opts.noFuture && when==="future") b.disabled=true;
        b.addEventListener("click",function(){ if(opts.onSelect) opts.onSelect(date); });
        grid.appendChild(b);
      })(ym[0]+"-"+pad(ym[1])+"-"+pad(d));
    }
    box.appendChild(grid); root.appendChild(box);
  });
}

/* カレンダーの見た目（ページ側の色の変数を使う） */
var css = [
".ltkcal{display:grid;gap:16px}",
".cal-month{min-width:0}",
".cal-title{font-family:var(--f-display);font-weight:800;font-size:16px;margin-bottom:6px}",
".cal-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:3px}",
".cal-wd{font-size:11px;text-align:center;color:var(--muted);padding:2px 0}",
".cal-wd.sun{color:var(--camellia)}.cal-wd.sat{color:var(--iris)}",
".cal-day{appearance:none;border:1px solid var(--line);background:var(--surface);border-radius:6px;min-height:46px;padding:3px 3px 4px;display:flex;flex-direction:column;align-items:flex-start;gap:1px;cursor:pointer;text-align:left;min-width:0;font:inherit;color:var(--fg)}",
".cal-day:hover{border-color:var(--accent)}",
".cal-day .n{font-size:13px;font-weight:700;line-height:1.2;font-variant-numeric:tabular-nums}",
".cal-day .ev{font-size:9.5px;font-weight:700;line-height:1.15;color:var(--kc);overflow-wrap:anywhere}",
".cal-day .cnt{margin-top:auto;font-size:10px;line-height:1;padding:2px 5px;border-radius:999px;background:var(--gold-soft);color:var(--fg);font-variant-numeric:tabular-nums}",
".cal-day[data-kind=regular]{--kc:var(--accent)}",
".cal-day[data-kind=masters]{--kc:var(--gold)}",
".cal-day[data-kind=playoffs]{--kc:var(--camellia)}",
".cal-day[data-kind=announce]{--kc:var(--iris)}",
".cal-day[data-kind=regular],.cal-day[data-kind=masters],.cal-day[data-kind=playoffs],.cal-day[data-kind=announce]{border-color:var(--kc);box-shadow:inset 0 2px 0 var(--kc)}",
".cal-day[data-kind=pre],.cal-day[data-kind=post]{background:transparent}",
".cal-day[data-when=today]{outline:2px solid var(--gold);outline-offset:-2px}",
".cal-day[data-when=future]{border-style:dashed;background:transparent}",
".cal-day:disabled{opacity:.4;cursor:not-allowed}",
".cal-day[aria-pressed=true]{background:var(--accent);border-color:var(--accent);box-shadow:none}",
".cal-day[aria-pressed=true] span{color:var(--accent-ink)}",
".cal-day[aria-pressed=true] .cnt{background:transparent}"
].join("\n");
var st=document.createElement("style"); st.textContent=css; document.head.appendChild(st);

window.LTKCal = {EVENTS:EVENTS, MONTHS:MONTHS, info:info, label:label, valid:valid, whenOf:whenOf,
  defaultDate:defaultDate, monthOf:monthOf, md:md, wd:wd, todayJST:todayJST, render:render};
})();
