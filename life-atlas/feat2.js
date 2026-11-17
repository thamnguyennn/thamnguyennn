
/* ==== D3 · Drekkana ==== */
const LA_D3META={code:"D3",name:"Drekkana",short:"Lòng can đảm và những người cùng chí hướng",
lead:"D3 là tấm gương soi lòng can đảm của bạn: nguồn ý chí giúp bạn tự đứng lên, cách bạn đối diện nỗi sợ, và những người đồng hành cùng thế hệ như anh chị em, bạn bè thân như ruột thịt, đồng đội. Truyền thống còn đọc D3 để hiểu sức sống của cơ thể và cách bạn hồi phục sau những lần vấp ngã.",
how:"D3 (Drekkana) chia mỗi cung làm ba phần, mỗi phần 10 độ. Theo Parashara, phần đầu thuộc chính cung đó, phần thứ hai thuộc cung thứ năm và phần thứ ba thuộc cung thứ chín tính từ nó. D3 là lớp phụ của nhà 3 trong lá số chính.",
note:"D3 chỉ bổ sung cho lá số chính. Đọc nó cạnh nhà 3 và Sao Hỏa, hành tinh đại diện cho lòng can đảm và anh chị em."};
const LA_D3LAG={fire:"Lòng can đảm của bạn bùng lên như ngọn lửa: bạn dám lao vào trước khi kịp sợ, và chính hành động là liều thuốc trị nỗi lo của bạn.",earth:"Lòng can đảm của bạn bền như đất: không ồn ào, không phô trương, nhưng một khi đã quyết, bạn đi đến cùng bằng sự kiên trì đáng nể.",air:"Lòng can đảm của bạn nằm ở trí óc và lời nói: bạn dám hỏi, dám nghĩ khác, dám lên tiếng cho điều mình tin.",water:"Lòng can đảm của bạn đến từ tình thương: bạn có thể nhút nhát vì mình, nhưng sẵn sàng đứng ra che chắn cho người mình yêu."};
const LA_D3H=[
{topic:"Ý chí tự thân",text:"Nhà này cho thấy nguồn ý chí giúp bạn tự đứng lên mỗi khi đời xô ngã; điều bạn tìm là được làm chủ số phận mình. Cái giá là đôi khi gồng quá sức. Người ngoài thấy bạn có bản lĩnh."},
{topic:"Lời nói và sự gắn kết gia đình",text:"Nhà này nói về sức mạnh trong lời nói và cách bạn giữ gìn tình thân; điều bạn tìm là một mái nhà đồng lòng. Cái giá là lời thẳng dễ làm người thân tổn thương. Người ngoài thấy bạn chân thành."},
{topic:"Anh chị em và lòng dũng cảm",text:"Đây là nhà chính của D3: anh chị em, bạn đồng hành và lòng dũng cảm; điều bạn tìm là những người cùng chí hướng để đi chung một đoạn đường. Cái giá là những cuộc ganh đua ngấm ngầm. Người ngoài thấy bạn gan dạ và nghĩa khí."},
{topic:"Bình yên trong lòng",text:"Nhà này nói về khả năng giữ lòng yên trước sóng gió; điều bạn tìm là một chỗ dựa tinh thần. Cái giá là dễ thu mình khi mệt. Người ngoài thấy bạn ấm áp."},
{topic:"Sáng tạo và sự can đảm thể hiện mình",text:"Nhà này nói về sự can đảm để sáng tạo và để yêu; điều bạn tìm là được thể hiện trọn vẹn. Cái giá là sợ bị đánh giá. Người ngoài thấy bạn có cá tính."},
{topic:"Đối mặt với trở ngại",text:"Nhà này nói về cách bạn đương đầu với đối thủ, bệnh tật và áp lực; điều bạn tìm là chiến thắng sòng phẳng. Cái giá là dễ kiệt sức vì muốn thắng mọi trận. Người ngoài thấy bạn kiên cường."},
{topic:"Người đồng hành",text:"Nhà này nói về những người song hành cùng bạn, trong tình yêu lẫn công việc; điều bạn tìm là một đối tác ngang hàng. Cái giá là đôi khi so bì. Người ngoài thấy bạn công bằng."},
{topic:"Sức hồi phục",text:"Nhà này nói về sức sống và khả năng hồi phục sau biến cố; điều bạn tìm là được tái sinh mạnh mẽ hơn. Cái giá là những nỗi sợ giấu kín. Người ngoài thấy bạn bí ẩn mà bền bỉ."},
{topic:"Niềm tin dẫn lối",text:"Nhà này nói về lý tưởng tiếp thêm can đảm cho bạn; điều bạn tìm là một lẽ sống đáng để dấn thân. Cái giá là dễ cực đoan với niềm tin của mình. Người ngoài thấy bạn có chính kiến."},
{topic:"Dấn thân vì sự nghiệp",text:"Nhà này nói về sự can đảm trong công việc: dám nhận trọng trách, dám đi đường mới; điều bạn tìm là được ghi nhận. Cái giá là làm việc quá sức. Người ngoài thấy bạn dám nghĩ dám làm."},
{topic:"Bạn bè và cộng đồng",text:"Nhà này nói về những người bạn giúp bạn vững lòng và mạng lưới quanh bạn; điều bạn tìm là được thuộc về. Cái giá là dễ chiều theo số đông. Người ngoài thấy bạn hòa đồng."},
{topic:"Can đảm buông bỏ",text:"Nhà này nói về sự can đảm để lùi lại, nghỉ ngơi và buông những gì không còn hợp; điều bạn tìm là sự tự do bên trong. Cái giá là có lúc cô đơn. Người ngoài thấy bạn sâu sắc."}];
function LA_d3(a){const e=P5(a,3),g=[];g.push(`Trong lá số D3, cung mọc của bạn là ${d0[e.lagnaSign]}. ${LA_D3LAG[LA_ELEM(e.lagnaSign)]}`);
const h3=f0(e.lagnaSign+2,12),l3=C1[h3],p3=e.planets[l3],o3=e.occupants[2];
g.push(`Nhà 3 của D3, nơi cất giữ lòng dũng cảm và tình anh em, là cung ${d0[h3]}. Hành tinh cai quản nó là ${X(l3)}, đang đứng ở nhà ${p3.house} của D3, nên lòng can đảm của bạn được thử thách và bộc lộ rõ nhất qua chuyện ${U2(p3.house)}.`);
K3(p3.dignity)?g.push(`${X(l3)} đứng vững trong D3: bạn có một nguồn dũng khí tự nhiên, và thường nhận được sự nâng đỡ từ anh chị em hay những người bạn như ruột thịt.`):p3.dignity==="debilitated"&&g.push(`${X(l3)} đứng yếu trong D3: lòng can đảm của bạn không đến sẵn mà được rèn qua từng lần vượt sợ hãi, và vì thế càng quý.`);
o3.length&&g.push(`Trong nhà 3 của D3 có ${Hn(o3.map(X))}, nên tình thân và lòng dũng cảm của bạn còn mang thêm sắc thái của ${o3.length>1?"những hành tinh này":"hành tinh này"}.`);
const ma=e.planets.mars;l3==="mars"?g.push("Chính Sao Hỏa, hành tinh đại diện cho sức chiến đấu và anh chị em, lại là chủ nhà 3 của D3, nên lòng can đảm của bạn mang trọn bản chất của Sao Hỏa: thẳng, nhanh và dám đối đầu."):g.push(`Sao Hỏa, hành tinh đại diện cho sức chiến đấu và anh chị em, đứng ở nhà ${ma.house} của D3${K3(ma.dignity)?" và rất vững: bạn có sức bật mạnh, biết đứng lên bảo vệ mình và người thân.":ma.dignity==="debilitated"?" và đứng yếu: năng lượng của bạn cần được nuôi bằng vận động đều đặn và những mục tiêu rõ ràng.":"."}`);
const st=hn.filter(f=>K3(e.planets[f].dignity));st.length&&g.push(`Mạnh trong D3: ${Hn(st.map(X))}. Những giai đoạn của ${st.length>1?"chúng":"nó"} thường là lúc bạn dám bước ra khỏi vùng an toàn.`);
return{n:3,...LA_D3META,paragraphs:g,chart:Ku(a,3),housesTitle:"Mười hai nhà của D3: lòng can đảm từng mặt một",housesIntro:"D3 đọc như một lá số riêng về ý chí và những người đồng hành. Mỗi nhà đọc theo ba bước: điều nhà đó nói, cái giá của nó, và người ngoài thấy gì ở bạn.",houses:Vu(a,3,LA_D3H)}}

/* ==== tiện ích thời gian ==== */
const LA_MON=["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6","Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];
const LA_vnMs=(y,m,d=1,h=12)=>Date.UTC(y,m,d,h)-7*36e5;
const LA_posAt=(id,ms)=>{const k=Zn.position(Pd[id],kt(ms),{zodiac:c2});return{lon:id==="ketu"?f0(k.lon+180,360):k.lon,retro:id==="rahu"||id==="ketu"?!0:k.retrograde,speed:k.speed}};
function LA_events(from,to,ids=["sun","mars","mercury","venus","jupiter","saturn","rahu"]){const ev=[];
for(const id of ids){let prev=LA_posAt(id,from);for(let t=from+LA_DAY;t<=to;t+=LA_DAY){const cur=LA_posAt(id,t);const s0=j1(prev.lon),s1=j1(cur.lon);
if(s0!==s1)ev.push({ms:t,id,kind:"ingress",sign:s1,from:s0,retro:cur.retro});
if(id!=="rahu"&&prev.retro!==cur.retro)ev.push({ms:t,id,kind:cur.retro?"retro":"direct",sign:s1});prev=cur}}
return ev.sort((x,y)=>x.ms-y.ms)}
function LA_retroSpans(id,from,to){const out=[];let st=null;for(let t=from;t<=to;t+=LA_DAY){const r=LA_posAt(id,t).retro;if(r&&st===null)st=t;if(!r&&st!==null){out.push({start:st,end:t});st=null}}if(st!==null)out.push({start:st,end:to,open:!0});return out}
const LA_ASPS={saturn:[3,7,10],jupiter:[5,7,9],mars:[4,7,8],sun:[7],venus:[7],mercury:[7],moon:[7],rahu:[],ketu:[]};

/* ==== Transit hiện tại ==== */
function LA_transit(pr,ms){const n=pr.natal,U=U5(n,ms),lg=n.lagna.sign,mo=n.grahas.moon.sign,rows=Sn.map(id=>{const t=U.grahas[id],sky=U.sky.grahas.find(x=>x.id===id),nk=w5(t.lon);return{id,sign:t.sign,deg:t.deg,retro:t.retro,fromLagna:fg(t.sign,lg),fromMoon:t.fromMoon,support:t.support,bindus:t.bindus,nak:LA_NAKVI[nk.index],pada:nk.pada,natalHere:Sn.filter(p=>n.grahas[p].sign===t.sign)}});
const touch=id=>{const r=rows.find(x=>x.id===id),hs=new Set([r.fromLagna]);for(const k of LA_ASPS[id])hs.add(f0(r.fromLagna+k-2,12)+1);return hs};
const dj=touch("jupiter"),ds=touch("saturn"),dbl=[...dj].filter(h=>ds.has(h)).sort((x,y)=>x-y);return{U,rows,dj,ds,dbl}}
function LA_trText(pr,T){const n=pr.natal,R=id=>T.rows.find(x=>x.id===id),ps=[];
const sat=R("saturn"),jup=R("jupiter"),rah=R("rahu"),ket=R("ketu"),hs=s=>[...s].sort((x,y)=>x-y);
ps.push(`Sao Thổ đang ở ${d0[sat.sign]}${sat.retro?" (nghịch hành)":""}, đi qua nhà ${sat.fromLagna} của bạn (${$1[sat.fromLagna-1]}) và chiếu tới nhà ${hs(T.ds).filter(h=>h!==sat.fromLagna).join(", ")}. Ở đâu Sao Thổ chạm vào, ở đó cuộc đời đòi bạn nghiêm túc, chậm lại và làm cho chắc. Song song, Sao Mộc ở ${d0[jup.sign]}${jup.retro?" (nghịch hành)":""}, đi qua nhà ${jup.fromLagna} (${$1[jup.fromLagna-1]}) và tỏa phúc tới nhà ${hs(T.dj).filter(h=>h!==jup.fromLagna).join(", ")}: những nơi ấy đang được mở cửa, dễ gặp người giúp và cơ hội.`);
if(T.dbl.length)ps.push(`Điểm đáng chú ý nhất là “quá cảnh kép” (double transit), kỹ thuật mà nhiều nhà chiêm tinh Vệ Đà dùng để nhận ra thời điểm sự kiện: khi cả Sao Mộc lẫn Sao Thổ cùng chạm vào một nhà, chủ đề của nhà đó rất dễ thành chuyện cụ thể. Lúc này, quá cảnh kép rơi vào ${Hn(T.dbl.map(h=>`nhà ${h} (${$1[h-1]})`))}. Nếu bạn đang chờ một bước ngoặt ở những mảng này, đây là khoảng thời gian cửa đang mở.`);
else ps.push("Lúc này Sao Mộc và Sao Thổ chưa cùng chạm vào một nhà nào (không có “quá cảnh kép”), nên các chuyển động lớn đang ở giai đoạn chuẩn bị nhiều hơn là thành hình.");
ps.push(`Trục Rahu–Ketu đang nằm trên nhà ${rah.fromLagna} và nhà ${ket.fromLagna}: Rahu khuếch đại khát khao về ${$1[rah.fromLagna-1]}, còn Ketu khiến chuyện ${$1[ket.fromLagna-1]} nhạt dần hoặc đòi bạn buông bớt. Hãy để ý đừng chạy quá đà theo bên này mà bỏ quên bên kia.`);
const hits=[];for(const r of T.rows)if(["saturn","jupiter","rahu","ketu","mars"].includes(r.id))for(const p of r.natalHere)p!==r.id&&hits.push(`${X(r.id)} đi qua ${X(p)} gốc`);
if(hits.length)ps.push(`Những điểm chạm trực tiếp vào lá số gốc: ${Hn(hits)}. Khi một hành tinh chậm đi ngang một hành tinh gốc, chủ đề của hành tinh gốc ấy được “đánh thức”, theo màu của hành tinh đang đi qua.`);
return ps}
function LA_Transit({prepared:a}){const[ms,setMs]=n0.useState(()=>a.ctx.now),T=n0.useMemo(()=>LA_transit(a,ms),[a,ms]),ps=n0.useMemo(()=>LA_trText(a,T),[a,T]),
ev=n0.useMemo(()=>LA_events(ms,ms+90*LA_DAY),[ms]),n=a.natal,iso=new Date(ms+7*36e5).toISOString().slice(0,10),
natalPl=Object.fromEntries(Sn.map(p=>[p,n.grahas[p].sign])),trPl=Object.fromEntries(T.rows.map(r=>[r.id,r.sign]));
const evTxt=e=>e.kind==="ingress"?`${X(e.id)} ${e.retro?"lùi về":"vào"} ${d0[e.sign]} (nhà ${fg(e.sign,n.lagna.sign)} của bạn)`:e.kind==="retro"?`${X(e.id)} bắt đầu nghịch hành ở ${d0[e.sign]}`:`${X(e.id)} đi thuận trở lại ở ${d0[e.sign]}`;
return u.jsxs(u.Fragment,{children:[u.jsx("p",{className:"eyebrow reveal",children:"Đại vận và tiểu vận"}),u.jsx("h2",{className:"reveal",children:"Transit trên lá số của bạn"}),
u.jsx("p",{className:"lead-p reveal",children:"Bầu trời không đứng yên. Mỗi ngày, chín hành tinh tiếp tục hành trình của mình và lần lượt đi ngang qua những ngôi nhà trong lá số gốc của bạn. Trang này đặt bầu trời của ngày bạn chọn chồng lên tấm bản đồ lúc bạn chào đời, để thấy nơi nào đang được đánh thức."}),
u.jsxs("div",{className:"daypick reveal",children:[u.jsxs("label",{children:[u.jsx("span",{children:"Xem ngày"}),u.jsx("input",{type:"date",value:iso,onChange:e=>{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(e.target.value);m&&setMs(LA_vnMs(+m[1],+m[2]-1,+m[3]))}})]}),u.jsx("button",{type:"button",className:"btn ghost",onClick:()=>setMs(ms-30*LA_DAY),children:"− 30 ngày"}),u.jsx("button",{type:"button",className:"btn ghost",onClick:()=>setMs(ms+30*LA_DAY),children:"+ 30 ngày"}),Math.abs(ms-a.ctx.now)>LA_DAY&&u.jsx("button",{type:"button",className:"linkbtn",onClick:()=>setMs(a.ctx.now),children:"Về hôm nay"})]}),
u.jsxs("div",{className:"la-charts reveal",children:[u.jsxs("figure",{className:"card la-chartcard",children:[u.jsx(ss,{data:{lagnaSign:n.lagna.sign,planets:natalPl,label:"Lá số gốc"}}),u.jsx("figcaption",{children:"Lá số gốc"})]}),u.jsxs("figure",{className:"card la-chartcard la-tr",children:[u.jsx(ss,{data:{lagnaSign:n.lagna.sign,planets:trPl,label:"Transit ngày đã chọn"}}),u.jsxs("figcaption",{children:["Bầu trời ngày ",T1(ms)," đặt lên các nhà của bạn"]})]})]}),
u.jsxs("section",{className:"card prose reveal la-block",children:[u.jsx("h3",{children:"Bầu trời đang chạm vào đâu"}),ps.map((p,i)=>u.jsx("p",{children:u.jsx(nn,{text:p})},i))]}),
u.jsx("div",{className:"la-tablewrap reveal",children:u.jsxs("table",{className:"la-table",children:[u.jsx("thead",{children:u.jsxs("tr",{children:[u.jsx("th",{children:"Hành tinh"}),u.jsx("th",{children:"Vị trí"}),u.jsx("th",{children:"Chòm sao"}),u.jsx("th",{children:"Nhà"}),u.jsx("th",{children:"Từ Mặt Trăng"}),u.jsx("th",{children:"Nâng đỡ"})]})}),
u.jsx("tbody",{children:T.rows.map(r=>u.jsxs("tr",{children:[u.jsxs("td",{children:[u.jsx(A1,{name:r.id,size:16})," ",X(r.id)]}),u.jsxs("td",{children:[d0[r.sign]," ",Nt(r.deg),r.retro&&r.id!=="rahu"&&r.id!=="ketu"?" ℞":""]}),u.jsxs("td",{children:[r.nak," ",r.pada]}),u.jsx("td",{children:r.fromLagna}),u.jsx("td",{children:r.fromMoon}),u.jsx("td",{children:u.jsx("span",{className:`chip la-chip-${LA_TONE[r.support]}`,children:r.support==="tốt"?"thuận":r.support})})]},r.id))})]})}),
u.jsxs("section",{className:"card prose reveal la-block",children:[u.jsx("h3",{children:"Chín mươi ngày tới"}),ev.length?u.jsx("ul",{className:"la-milestones",children:ev.slice(0,18).map((e,i)=>u.jsxs("li",{children:[u.jsx("span",{className:"la-ms-date",children:T1(e.ms)}),u.jsx("span",{children:evTxt(e)})]},i))}):u.jsx("p",{children:"Không có hành tinh nào đổi cung hay đổi chiều trong chín mươi ngày tới."})]})]})}

/* ==== Dự báo 2027 ==== */
const LA_ECL27=[{ms:Date.UTC(2027,1,6,16),kind:"solar",t:"Nhật thực hình khuyên"},{ms:Date.UTC(2027,1,20,23),kind:"lunar",t:"Nguyệt thực nửa tối"},{ms:Date.UTC(2027,6,18,16),kind:"lunar",t:"Nguyệt thực nửa tối"},{ms:Date.UTC(2027,7,2,10),kind:"solar",t:"Nhật thực toàn phần"},{ms:Date.UTC(2027,7,17,7),kind:"lunar",t:"Nguyệt thực nửa tối"}];
const LA_SUPV={tốt:1,vừa:0,khó:-1};
function LA_year(pr,Y=2027){const n=pr.natal,lg=n.lagna.sign,from=LA_vnMs(Y,0,1,0),to=LA_vnMs(Y+1,0,1,0),md=K9(J5(n.grahas.moon.lon,n.utcMs),12),dash=[];
for(const m of md){if(m.endMs<from||m.startMs>to)continue;for(const s of U3(m))s.endMs>=from&&s.startMs<=to&&dash.push({maha:m.lord,antar:s.lord,start:s.startMs,end:s.endMs})}
const ev=LA_events(from,to),months=[];
for(let m=0;m<12;m++){const mid=LA_vnMs(Y,m,15),U=U5(n,mid),g=U.grahas,an=dash.find(d=>mid>=d.start&&mid<d.end);let sc=0;
sc+=2*LA_SUPV[g.jupiter.support]+2*LA_SUPV[g.saturn.support]+LA_SUPV[g.rahu.support]+LA_SUPV[g.mars.support]+LA_SUPV[g.sun.support]+.5*LA_SUPV[g.venus.support]+.5*LA_SUPV[g.mercury.support];
U.sadeSati.phase==="peak"?sc-=.8:U.sadeSati.phase!=="none"&&(sc-=.4);U.ashtamaShani&&(sc-=.8);
const AP=an?LA_pl({natal:n,ctx:pr.ctx},an.antar):null;AP&&(sc+=AP.grade==="strong"?1:AP.grade==="good"?.5:AP.grade==="weak"?-.8:0);
const ms0=LA_vnMs(Y,m,1,0),ms1=LA_vnMs(Y,m+1,1,0),mev=ev.filter(e=>e.ms>=ms0&&e.ms<ms1&&e.id!=="sun"),ecl=LA_ECL27.filter(e=>e.ms>=ms0&&e.ms<ms1),dch=dash.filter(d=>d.start>=ms0&&d.start<ms1);
months.push({m,mid,U,an,sc,tone:sc>=2?"good":sc<=-2?"hard":"mixed",mev,ecl,dch})}
[...months].sort((x,y)=>y.sc-x.sc).slice(0,2).forEach(x=>{x.sc>0&&(x.tone="good")});
return{Y,from,to,dash,ev,months,mahas:md.filter(m=>m.endMs>=from&&m.startMs<=to),retro:{mercury:LA_retroSpans("mercury",from,to),venus:LA_retroSpans("venus",from,to),mars:LA_retroSpans("mars",from,to)}}}
function LA_yearText(pr,Y){const n=pr.natal,lg=n.lagna.sign,mo=n.grahas.moon.sign,ps=[],h=s=>fg(s,lg);
const jupS=LA_signRuns("jupiter",Y.from,Y.to,4*LA_DAY),satS=LA_merge(LA_signRuns("saturn",Y.from,Y.to,6*LA_DAY)),rahS=LA_signRuns("rahu",Y.from,Y.to,8*LA_DAY);
const segs=(id,rs)=>Hn(rs.map(r=>`${d0[r.sign]} (nhà ${h(r.sign)}, ${T1(Math.max(r.start,Y.from))} – ${r.open?"cuối năm":T1(r.end)})`));
ps.push(`Năm ${Y.Y} là một năm chuyển mình của bầu trời. Sao Mộc đi qua ${segs("jupiter",jupS)}: ${jupS.some(r=>r.sign===3)?"khi ở Cự Giải, Sao Mộc ở cung vượng, mang phúc lành mạnh nhất trong cả chu kỳ mười hai năm, nên những nhà nó đi qua và chiếu tới được nâng đỡ đặc biệt":"đi tới đâu, Sao Mộc mở cửa và mang người giúp tới đó"}. Sao Thổ đi qua ${segs("saturn",satS)}${satS.some(r=>r.sign===0)?"; việc Sao Thổ bước vào Bạch Dương, cung suy của nó, là chuyển động lớn nhất của năm: một giai đoạn mà nhiều nhà chiêm tinh Vệ Đà xem là phép thử về kỷ luật và sự kiên nhẫn trên diện rộng":""}. Trục Rahu–Ketu ở ${Hn(rahS.map(r=>`${d0[r.sign]}–${d0[f0(r.sign+6,12)]} (nhà ${h(r.sign)} và ${h(f0(r.sign+6,12))})`))}.`);
const d=Y.dash.filter(x=>x.end>Y.from&&x.start<Y.to);
ps.push(`Về đại vận, năm này của bạn ${d.length>1?`đi qua ${d.length} tiểu vận: ${Hn(d.map(x=>`${X(x.antar)} trong đại vận ${X(x.maha)} (${dn(Math.max(x.start,Y.from))} – ${dn(Math.min(x.end,Y.to))})`))}`:`nằm trọn trong tiểu vận ${X(d[0].antar)} của đại vận ${X(d[0].maha)}`}. ${d.map(x=>`Tiểu vận ${X(x.antar)} là quãng mà ${Xn[x.antar].antar}`).slice(0,2).join("; ")}.`);
const good=Y.months.filter(m=>m.tone==="good").map(m=>LA_MON[m.m].toLowerCase()),hard=Y.months.filter(m=>m.tone==="hard").map(m=>LA_MON[m.m].toLowerCase());
ps.push(`Gộp bầu trời với đại vận của riêng bạn, ${good.length?`những tháng thuận nhất là ${Hn(good)}: hợp để khởi sự, ký kết, gặp gỡ và mở rộng`:"không có tháng nào nổi bật hẳn về thuận lợi, nên hãy tiến đều từng bước"}${hard.length?`; những tháng cần giữ nhịp chậm và chắc là ${Hn(hard)}, hợp để rà soát, nghỉ ngơi và chăm sóc sức khỏe hơn là mạo hiểm`:""}.`);
return ps}
function LA_YearBars({Y,onPick,sel}){const W=720,H=170,bw=W/12;return u.jsxs("svg",{className:"la-ybars",viewBox:`0 0 ${W} ${H}`,role:"img","aria-label":"Mức thuận lợi từng tháng năm 2027",children:[u.jsx("line",{x1:0,x2:W,y1:H/2-6,y2:H/2-6,className:"la-grid"}),
Y.months.map((m,i)=>{const v=Math.max(-5,Math.min(5,m.sc)),hh=Math.abs(v)/5*(H/2-26),y=v>=0?H/2-6-hh:H/2-6;return u.jsxs("g",{className:`la-yb la-t-${m.tone}${sel===i?" on":""}`,onClick:()=>onPick(i),style:{cursor:"pointer"},children:[u.jsx("title",{children:`${LA_MON[i]}: ${m.tone==="good"?"thuận lợi":m.tone==="hard"?"cần thận trọng":"có thuận có khó"}`}),u.jsx("rect",{x:i*bw+8,y:Math.min(y,H/2-8),width:bw-16,height:Math.max(3,hh),rx:4,className:`la-seg la-t-${m.tone}`}),u.jsx("text",{x:i*bw+bw/2,y:H-6,textAnchor:"middle",className:"la-yr",children:`T${i+1}`})]},i)})]})}
function LA_Year({prepared:a,printing:pr}){const[Y,setY]=n0.useState(()=>pr?LA_year(a):null),[sel,setSel]=n0.useState(null);n0.useEffect(()=>{if(Y)return;const t=setTimeout(()=>setY(LA_year(a)),40);return()=>clearTimeout(t)},[a]);
if(!Y)return u.jsxs(u.Fragment,{children:[u.jsx("p",{className:"eyebrow",children:"Dự báo"}),u.jsx("h2",{children:"Năm 2027 của bạn"}),u.jsx("p",{className:"faint",role:"status",children:"Đang dựng bầu trời của mười hai tháng năm 2027…"})]});
const ps=LA_yearText(a,Y),n=a.natal,h=s=>fg(s,n.lagna.sign),evTxt=e=>e.kind==="ingress"?`${X(e.id)} ${e.retro?"lùi về":"vào"} ${d0[e.sign]} (nhà ${h(e.sign)})`:e.kind==="retro"?`${X(e.id)} bắt đầu nghịch hành`:`${X(e.id)} đi thuận trở lại`;
return u.jsxs(u.Fragment,{children:[u.jsx("p",{className:"eyebrow reveal",children:"Dự báo"}),u.jsx("h2",{className:"reveal",children:"Năm 2027 của bạn"}),
u.jsx("p",{className:"lead-p reveal",children:"Một năm mới không bắt đầu từ con số không mà nối tiếp chương đời bạn đang viết. Trang này đặt mười hai tháng của năm 2027 cạnh đại vận của riêng bạn và những chuyển động lớn trên bầu trời, để bạn biết lúc nào nên tăng tốc, lúc nào nên lặng lại."}),
u.jsx("section",{className:"card prose reveal la-block",children:ps.map((p,i)=>u.jsx("p",{children:u.jsx(nn,{text:p})},i))}),
u.jsxs("section",{className:"card reveal la-block la-yearcard",children:[u.jsx("h3",{children:"Nhịp thuận lợi từng tháng"}),u.jsx(LA_YearBars,{Y,onPick:i=>{setSel(i);document.getElementById(`la-m-${i}`)?.scrollIntoView({block:"center",behavior:"smooth"})},sel}),u.jsxs("p",{className:"la-legend faint small",children:[u.jsx("i",{className:"la-sw la-t-good"})," thuận lợi ",u.jsx("i",{className:"la-sw la-t-mixed"})," có thuận có khó ",u.jsx("i",{className:"la-sw la-t-hard"})," cần thận trọng"]})]}),
u.jsx("div",{className:"la-months",children:Y.months.map((m,i)=>{const U=m.U,sun=U.grahas.sun,tg=Tg[sun.fromLagna-1],an=m.an,tip=an?Vb[an.antar]?.[m.tone]:"";
const notes=[...m.ecl.map(e=>`${e.t} ngày ${T1(e.ms)} ở ${d0[j1(LA_posAt(e.kind==="solar"?"sun":"moon",e.ms).lon)]} (nhà ${h(j1(LA_posAt(e.kind==="solar"?"sun":"moon",e.ms).lon))}): nhật thực và nguyệt thực khuấy động chủ đề của nhà đó, tránh quyết định lớn sát ngày.`),...m.dch.map(d=>`Từ ${T1(d.start)} bạn bước vào tiểu vận ${X(d.antar)}: ${Xn[d.antar].antar}.`),...m.mev.slice(0,4).map(evTxt)];
return u.jsxs("article",{id:`la-m-${i}`,className:`card la-month la-${m.tone}${sel===i?" on":""} reveal`,children:[u.jsxs("header",{children:[u.jsx("b",{children:LA_MON[i]}),u.jsx("span",{className:`chip la-chip-${m.tone}`,children:m.tone==="good"?"thuận lợi":m.tone==="hard"?"cần thận trọng":"có thuận có khó"})]}),
u.jsx("p",{children:`Mặt Trời đi qua nhà ${sun.fromLagna} của bạn nên ${tg.main}: hợp để ${tg.good}, nhưng nên tránh ${tg.care}.`}),tip&&u.jsx("p",{className:"la-tip",children:tip}),
notes.length>0&&u.jsx("ul",{className:"la-mnotes",children:notes.map((t,j)=>u.jsx("li",{children:t},j))})]},i)})}),
u.jsxs("section",{className:"card prose reveal la-block",children:[u.jsx("h3",{children:"Những quãng hành tinh nghịch hành"}),u.jsx("p",{children:"Khi một hành tinh nghịch hành, chủ đề của nó quay vào trong: hợp để xem lại, sửa chữa và hoàn thiện, kém hợp để khởi sự mới. Truyền thống đặc biệt lưu ý Sao Thủy nghịch hành với giấy tờ, hợp đồng và máy móc."}),
u.jsx("ul",{className:"plain-list",children:["mercury","venus","mars"].flatMap(id=>Y.retro[id].map((r,j)=>u.jsxs("li",{children:[u.jsx("b",{children:X(id)})," nghịch hành ",T1(Math.max(r.start,Y.from))," – ",r.open?"sang năm sau":T1(r.end)]},id+j)))})]})]})}

/* ==== Xuất PDF ==== */
const LA_loadScript=src=>new Promise((ok,no)=>{if(document.querySelector(`script[src="${src}"]`))return ok();const s=document.createElement("script");s.src=src;s.onload=()=>ok();s.onerror=()=>no(new Error("load"));document.head.appendChild(s)});
function LA_PdfBtn({name}){const[st,setSt]=n0.useState(null);
const run=async()=>{if(st&&st.busy)return;setSt({busy:!0,t:"Đang chuẩn bị…"});const root=document.documentElement,prevSkin=root.getAttribute("data-skin");
try{const dl=window.claude?.use?await claude.use("downloads"):null;
await LA_loadScript("https://cdn.jsdelivr.net/npm/html2canvas-pro@1.5.8/dist/html2canvas-pro.min.js");await LA_loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
root.setAttribute("data-skin","parchment");root.classList.add("la-pdf");window.dispatchEvent(new Event("beforeprint"));await new Promise(r=>setTimeout(r,1800));
document.querySelectorAll(".report details").forEach(d=>d.setAttribute("open",""));await new Promise(r=>setTimeout(r,300));
const secs=[...document.querySelectorAll(".report section.rpage")],head=document.querySelector(".report .rhead"),{jsPDF}=window.jspdf,pdf=new jsPDF({unit:"pt",format:"a4",compress:!0}),PW=pdf.internal.pageSize.getWidth(),PH=pdf.internal.pageSize.getHeight(),M=28;let first=!0;
let cy=0;const BG=[251,247,238],addEl=async(el,fresh=!0)=>{const c=await html2canvas(el,{scale:1.25,backgroundColor:"#fbf7ee",useCORS:!0,logging:!1}),w=PW-2*M,ratio=w/c.width,full=(PH-2*M)/ratio,cx=c.getContext("2d",{willReadFrequently:!0});
const blank=y=>{const d=cx.getImageData(0,y,c.width,1).data;for(let k=0;k<d.length;k+=16){if(Math.abs(d[k]-d[0])>10||Math.abs(d[k+1]-d[1])>10||Math.abs(d[k+2]-d[2])>10)return!1}return!0};
if(first||fresh&&cy>0){first?first=!1:pdf.addPage();pdf.setFillColor(...BG);pdf.rect(0,0,PW,PH,"F");cy=0}
let y=0;while(y<c.height){let room=full-cy/ratio;if(room<60){pdf.addPage();pdf.setFillColor(...BG);pdf.rect(0,0,PW,PH,"F");cy=0;room=full}
let h=Math.min(room,c.height-y);if(y+h<c.height){let b=Math.floor(y+h);for(let t=0;t<Math.min(220,h-40);t++){if(blank(b-t)){b=b-t;break}}h=b-y}
const cc=document.createElement("canvas");cc.width=c.width;cc.height=h;cc.getContext("2d").drawImage(c,0,y,c.width,h,0,0,c.width,h);
pdf.addImage(cc.toDataURL("image/jpeg",.78),"JPEG",M,M+cy,w,h*ratio);cy+=h*ratio;y+=h;if(y<c.height){pdf.addPage();pdf.setFillColor(...BG);pdf.rect(0,0,PW,PH,"F");cy=0}}cy+=14};
head&&await addEl(head);for(let i=0;i<secs.length;i++){setSt({busy:!0,t:`Đang tạo PDF… ${i+1}/${secs.length}`});await addEl(secs[i],i>0)}
const blob=pdf.output("blob"),fn=`Life Atlas - ${(name||"la so").replace(/[\\/:*?"<>|]/g,"")}.pdf`;
if(dl){await dl.save({filename:fn,data:blob});setSt({t:"Đã tạo PDF ✓"})}else{pdf.save(fn);setSt({t:"Đã tạo PDF ✓"})}}
catch(e){console.warn("LA_PDF",e&&(e.message||e.code),e&&e.stack);setSt({t:e&&e.code==="declined"?"Đã hủy tải xuống":"Chưa tạo được PDF ở đây"})}
finally{window.dispatchEvent(new Event("afterprint"));root.classList.remove("la-pdf");prevSkin?root.setAttribute("data-skin",prevSkin):root.removeAttribute("data-skin");setTimeout(()=>setSt(s=>s&&!s.busy?null:s),3500)}};
return u.jsx("button",{className:"btn ghost",type:"button",onClick:run,disabled:!!(st&&st.busy),"aria-live":"polite",children:st?st.t:"Tải PDF"})}
