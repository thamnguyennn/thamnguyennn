
/* ==== Luận giải tổng hợp: kết hợp chủ nhà, hành tinh trong nhà, góc chiếu, SAV, Bhava Bala, Shadbala, karaka, đại vận ==== */
const LA_NATBEN=new Set(["jupiter","venus","mercury","moon"]),LA_NATMAL=new Set(["saturn","mars","sun","rahu","ketu"]);
const LA_KENDRA=[1,4,7,10],LA_TRIK=[1,5,9],LA_DUS=[6,8,12],LA_UPA=[3,6,10,11];
const LA_KARAKA={1:["sun"],2:["jupiter"],3:["mars"],4:["moon"],5:["jupiter"],6:["mars","saturn"],7:["venus"],8:["saturn"],9:["jupiter","sun"],10:["sun","saturn"],11:["jupiter"],12:["saturn"]};
const LA_DIGS={exalted:2,moolatrikona:1.6,own:1.4,friend:.5,neutral:0,none:0,enemy:-.6,debilitated:-1.7};
const LA_DIGTXT={exalted:"đang ở cung vượng (exalted), nơi nó tỏa sáng trọn vẹn nhất",moolatrikona:"đứng ở cung gốc (moolatrikona), làm việc tự tin như trong chính văn phòng của mình",own:"ở ngay cung nhà mình, tự chủ và đáng tin",friend:"ở cung của một hành tinh bạn, được tiếp đón thuận hòa",neutral:"ở một cung trung tính, làm việc ở mức bình thường",enemy:"ở cung của một hành tinh không ưa nó, nên phải làm việc trong thế chẳng mấy thoải mái",debilitated:"ở cung suy (debilitated), nơi sức tự nhiên của nó bị kìm lại",none:"là một điểm bóng (chhaya graha), mang màu của cung và chủ cung nơi nó đứng"};
const LA_ACT={sun:"giữ chữ tín, dám đứng tên và nhận trách nhiệm",moon:"giữ nhịp ngủ nghỉ đều đặn và chăm sóc đời sống cảm xúc",mars:"vận động thể chất và hành động dứt khoát thay vì để bực bội tích tụ",mercury:"học hỏi, ghi chép và nói năng rõ ràng",jupiter:"học từ người thầy, sống có nguyên tắc và rộng lòng cho đi",venus:"chăm chút cái đẹp, sự hài hòa và những mối quan hệ thân thiết",saturn:"giữ kỷ luật, bền bỉ từng bước và giúp đỡ người yếu thế",rahu:"tỉnh táo trước cám dỗ và dám thử điều mới một cách có cân nhắc",ketu:"dành thời gian tĩnh lặng và học cách buông những gì đã cũ"};
const LA_HPLACE=h=>h===1?"nhà 1, chính bản thân bạn":[5,9].includes(h)?`nhà ${h}, một nhà phúc (trikona)`:[4,7,10].includes(h)?`nhà ${h}, một nhà trụ cột (kendra)`:[2,11].includes(h)?`nhà ${h}, nhà của tích lũy và thành quả`:h===3?"nhà 3, nhà của nỗ lực tự thân":`nhà ${h}, một nhà khó (dusthana)`;
const LA_lords=(n,p)=>n.houses.filter(h=>h.lord===p).map(h=>h.n);
function LA_pl(a,p){const n=a.natal,g=n.grahas[p],sb=a.ctx.sb?.planets?.[p];let s=LA_DIGS[g.dignity]??0;
if(sb){s+=sb.ratio>=1.35?.8:sb.ratio>=1.1?.4:sb.ratio>=.95?0:-.6}g.combust&&(s-=.8);g.digBala&&(s+=.3);g.vargottama&&(s+=.4);
const grade=s>=1.6?"strong":s>=.5?"good":s>-.5?"mixed":"weak";return{p,g,sb,s,grade}}
function LA_plText(a,p,o={}){const P=LA_pl(a,p),g=P.g,parts=[],nm=X(p);let t=`${nm} ${LA_DIGTXT[g.dignity]??LA_DIGTXT.neutral}`;
if(P.sb&&p!=="rahu"&&p!=="ketu"){const good=(LA_DIGS[g.dignity]??0)>=.5,str=P.sb.ratio>=1.1;
t+=good&&str?`, lại có Shadbala ${P.sb.band} (xếp thứ ${P.sb.rank}/7), nên vừa có phẩm chất vừa có sức thực thi`:good&&!str?`, nhưng Shadbala chỉ ${P.sb.band} (thứ ${P.sb.rank}/7): phẩm chất tốt mà cần thời gian và điều kiện mới phát huy hết`:!good&&str?`, dù vậy Shadbala vẫn ${P.sb.band} (thứ ${P.sb.rank}/7), nên nó đủ sức xoay xở và vượt lên hoàn cảnh`:`, và Shadbala cũng chỉ ${P.sb.band} (thứ ${P.sb.rank}/7), nên đây là hành tinh cần được nâng đỡ`}
g.combust&&parts.push("bị Mặt Trời che sáng (combust), nên tiếng nói của nó dễ bị lấn át bởi cái tôi hay người có quyền");
g.retro&&p!=="rahu"&&p!=="ketu"&&parts.push("đang nghịch hành, nên sức của nó quay vào bên trong: hay xem lại, làm lại, và chín muộn");
g.digBala&&parts.push("được Dig Bala, tức đứng đúng phương vị mạnh nhất của mình");g.vargottama&&parts.push("là Vargottama, đứng cùng một cung ở cả lá số chính lẫn D9, nên điều nó hứa hẹn rất bền");
if(parts.length)t+=`. Ngoài ra nó ${Hn(parts)}`;return{text:t+".",P}}
function LA_func(n,p){const hs=LA_lords(n,p);if(!hs.length)return{hs,role:"shadow"};const k=hs.some(h=>[4,7,10].includes(h)),t=hs.some(h=>[5,9].includes(h));
if(k&&t)return{hs,role:"yogakaraka"};if(hs.includes(1))return{hs,role:"lagna"};if(t)return{hs,role:"trikona"};if(hs.every(h=>LA_DUS.includes(h)||h===3||h===11))return{hs,role:hs.some(h=>LA_DUS.includes(h))?"dusthana":"upachaya"};return{hs,role:"kendra"}}
const LA_ROLE={yogakaraka:"là Yogakaraka của lá số, hành tinh cai quản cùng lúc một nhà trụ cột và một nhà phúc, nên mang may mắn có thể hiện thực hóa",lagna:"là chủ cung mọc, người giữ bánh lái cho cả lá số",trikona:"cai quản một nhà phúc, nên về bản chất mang điều lành cho bạn",dusthana:"cai quản nhà khó, nên dù dễ chịu đến đâu vẫn mang theo bài học và thử thách",upachaya:"cai quản nhà tăng trưởng, mang tham vọng và sức cạnh tranh",kendra:"cai quản một nhà trụ cột, đóng vai trò dựng khung cho đời sống",shadow:"không cai quản cung nào, nên hành động theo chủ cung nơi nó đứng"};
function LA_dashaHit(a,set){const n=a.natal,now=a.ctx.now,md=K9(J5(n.grahas.moon.lon,n.utcMs),12),cur=md.find(m=>now>=m.startMs&&now<m.endMs),out=[];
const soon=cur&&cur.endMs-now<1.5*LA_YEAR;if(cur&&set.has(cur.lord))out.push(soon?`Đại vận ${X(cur.lord)}, quãng đời đặt mảng này lên sân khấu chính, đang đi những tháng cuối (đến ${dn(cur.endMs)}); những gì bạn gieo ở đây lúc này sẽ còn theo bạn lâu dài.`:`Bạn đang ở ngay trong đại vận ${X(cur.lord)} (đến ${dn(cur.endMs)}), nên mảng đời này đang là sân khấu chính của bạn lúc này.`);
if(!(cur&&set.has(cur.lord))||soon){let an=null;for(const m of md){if(m.endMs<now)continue;for(const s of U3(m)){if(s.endMs>now&&set.has(s.lord)){an={s,m};break}}if(an)break}
const nm=md.find(m=>m.startMs>now&&set.has(m.lord));
if(an&&!(cur&&set.has(cur.lord)&&an.m===cur))out.push(`${out.length?"Sau đó, mảng":"Mảng"} đời này được “bật sáng” rõ nhất khi hành tinh liên quan nắm quyền: gần nhất là tiểu vận ${X(an.s.lord)} trong đại vận ${X(an.m.lord)} (${dn(Math.max(an.s.startMs,now))} – ${dn(an.s.endMs)})${nm&&nm.startMs-now<45*LA_YEAR?`, và trọn vẹn hơn trong đại vận ${X(nm.lord)} bắt đầu khoảng năm ${new Date(nm.startMs+7*36e5).getUTCFullYear()}`:""}.`)}
return out}
const LA_POT=(n,sav)=>LA_DUS.includes(n)?(sav<=24?"high":sav<=28?"mid":"low"):(sav>=30?"high":sav>=26?"mid":"low");
const LA_STRMX={"high-top":"Cả tiềm năng (SAV) lẫn sức chống đỡ (Bhava Bala) đều dồi dào: đây là một trong những mảng đời bạn có thể dựa vào nhất.",
"high-mid":"Tiềm năng của nhà này cao, sức chống đỡ ở mức khá: nhiều cơ hội đến, và bạn đủ nền để giữ lấy phần lớn.",
"high-low":"Tiềm năng lớn nhưng nền chống đỡ còn mỏng: cơ hội đến nhiều, song dễ trôi đi nếu bạn không có kế hoạch để giữ lại.",
"mid-top":"Trợ lực từ bên ngoài ở mức vừa, nhưng nền của nhà rất vững: thành quả đến chậm mà chắc, chủ yếu nhờ sức tự thân.",
"mid-mid":"Tiềm năng và sức chống đỡ đều ở mức cân bằng: không quá dễ dàng, cũng không quá chật vật, mọi thứ đi theo đúng công sức bạn bỏ vào.",
"mid-low":"Trợ lực ở mức vừa còn nền thì mỏng: hãy đi từng bước nhỏ và củng cố trước khi mở rộng.",
"low-top":"Ít trợ lực từ hoàn cảnh nhưng nền lại rất vững: những gì bạn có ở đây gần như hoàn toàn do chính bạn dựng nên, và vì thế rất bền.",
"low-mid":"Trợ lực khiêm tốn, sức chống đỡ ở mức khá: đây là mảng cần sự kiên nhẫn, và đền đáp tương xứng với thời gian bạn đầu tư.",
"low-low":"Cả hai thước đo đều khiêm tốn: đây là mảng đời cần đầu tư dài hơi; nhưng cũng chính vì thế, mỗi bước tiến ở đây đều rất thật và đáng tự hào."};
function LA_houseSynth(a,e){const n=a.natal,o=e.n-1,tag=$1[o],dom=U2(e.n),L=e.lord,LP=LA_plText(a,L),lp=LP.P,lh=e.lordHouse,paras=[];
/* 1. chủ nhà: nơi chảy về + phẩm chất */
let p1=`Nhà ${e.n} nói về ${dom}. Cung ${d0[e.sign]} trên nhà này do ${X(L)} cai quản, và ${X(L)} đang đứng ở ${LA_HPLACE(lh)}. `;
if(lh===e.n)p1+=`Chủ nhà ngồi ngay tại nhà của mình, nên chuyện ${tag} tự đứng vững trên đôi chân của nó, ít phải dựa vào ai. `;
else if(LA_DUS.includes(e.n)&&LA_DUS.includes(lh))p1+=`Đây là một nghịch lý tốt lành mà truyền thống gọi là Viparita Raja Yoga: chủ của một nhà khó lại đi vào một nhà khó khác, nên những rắc rối của nhà này có xu hướng tự triệt tiêu nhau, và bạn thường đứng dậy mạnh hơn sau biến cố. `;
else p1+=`Vì vậy những gì thuộc về ${tag} không đứng yên một chỗ mà chảy về chuyện ${$1[lh-1]}: hai mảng này gắn chặt với nhau trong đời bạn, cái này thường mở ra hay kéo theo cái kia. `;
p1+=LP.text;
const lpGood=lp.grade==="strong"||lp.grade==="good",placeGood=LA_KENDRA.includes(lh)||LA_TRIK.includes(lh)||[2,11].includes(lh)||lh===e.n,placeHard=LA_DUS.includes(lh)&&!LA_DUS.includes(e.n);
p1+=" "+(lpGood&&placeGood?`Một chủ nhà mạnh đặt ở vị trí tốt là dấu hiệu rõ nhất của một mảng đời có gốc rễ: chuyện ${tag} của bạn có nền để lớn.`:lpGood&&placeHard?`Chủ nhà mạnh nhưng đi vào nhà khó: năng lực có thật, nhưng phải đi qua thử thách, khoảng cách hoặc những điều ẩn khuất mới được ghi nhận.`:!lpGood&&placeGood?`Vị trí đặt chủ nhà thì tốt, nhưng bản thân chủ nhà chưa đủ lực: khung đã có, chỉ là cần thêm thời gian và nỗ lực để lấp đầy.`:!lpGood&&placeHard?`Chủ nhà vừa yếu vừa đi vào nhà khó, nên đây là mảng bạn cần chăm chút có ý thức; tin tốt là những mảng như vậy thường tiến bộ rõ rệt theo tuổi tác và trải nghiệm.`:`Chủ nhà ở thế cân bằng: mảng này đi lên đều đặn theo nhịp nỗ lực của bạn.`);
paras.push(p1);
/* 2. hành tinh trong nhà + góc chiếu, đan thành một lực tổng */
const occ=e.occupants.filter(p=>p!==L),asp=e.aspectedBy.filter(p=>!e.occupants.includes(p)),infl=[...occ.map(p=>({p,kind:"in"})),...asp.map(p=>({p,kind:"asp"}))];
if(!infl.length&&!e.occupants.includes(L))paras.push(`Không có hành tinh nào ngồi trong hay chiếu thẳng vào nhà ${e.n}, nên nhà này đi trọn theo chủ nhà ${X(L)}: mọi điều bạn vừa đọc ở trên chính là câu chuyện của nó, không bị pha thêm màu nào khác.`);
else{const ben=[],mal=[];let B=0,M=0;const upa=LA_UPA.includes(e.n);
const desc=[];for(const{p,kind}of infl){const P=LA_pl(a,p),w=(kind==="in"?1:.75),isB=LA_NATBEN.has(p),strong=P.grade==="strong"||P.grade==="good",F=LA_func(n,p);
if(isB){B+=w*(strong?1.2:.7);ben.push(p)}else{const tame=strong&&(P.g.dignity==="own"||P.g.dignity==="exalted"||P.g.dignity==="moolatrikona");M+=w*(upa||tame?.4:strong?.8:1.2);mal.push(p)}
desc.push(`${X(p)} ${kind==="in"?`ngồi trong nhà`:`chiếu vào từ nhà ${n.grahas[p].house}`} (${Xn[p].role}; ${P.grade==="strong"?"đang rất mạnh":P.grade==="good"?"đang vững":P.grade==="mixed"?"lực ở mức vừa":"đang yếu"}${F.role==="yogakaraka"?", lại là Yogakaraka":F.role==="dusthana"?`, chủ nhà ${F.hs.filter(h=>LA_DUS.includes(h)).join(" và ")}`:""})`)}
if(e.occupants.includes(L))desc.unshift(`chính ${X(L)}, chủ nhà, cũng ngồi trong nhà`);
let p2=`Những lực đang tác động lên nhà ${e.n}: ${Hn(desc)}. `;
const bn=Hn(ben.map(X)),mn=Hn(mal.map(X));
if(ben.length&&mal.length)p2+=`Nhà này nằm giữa hai luồng. ${bn} mang tới ${ben.length>1?"những phẩm chất":"phẩm chất"} ${Hn(ben.map(p=>Xn[p].gift))}, trong khi ${mn} đặt lên đó nguy cơ ${Hn(mal.map(p=>Xn[p].shadow))}. ${B>=M?"Luồng nâng đỡ trội hơn, nên kết cục thường tốt, chỉ là phải đi qua vài phép thử: điều tốt đến, nhưng được rèn qua lửa.":"Luồng sức ép trội hơn, nên điều tốt vẫn có nhưng thường đến muộn và đòi bạn trả giá bằng kỷ luật; khi đã có, nó rất bền."}`;
else if(ben.length)p2+=`${ben.length>1?"Tất cả đều là hành tinh lành":"Đây là một hành tinh lành"}, nên nhà này được che chở: sự ${Hn(ben.map(p=>Xn[p].gift))} thấm dần vào chuyện ${tag}. ${B>=2?"Đây là một trong những vùng được ban phúc rõ rệt trong lá số của bạn.":"Sự che chở ở mức vừa phải nhưng đáng tin."}`;
else p2+=upa?`${mal.length>1?"Các lực ở đây đều là hành tinh “cứng”":"Lực ở đây là một hành tinh “cứng”"}, nhưng nhà ${e.n} là nhà tăng trưởng (upachaya), nơi truyền thống coi sức ép là nhiên liệu: phẩm chất ${Hn(mal.map(p=>Xn[p].gift))} sẽ biến áp lực thành động lực, và mảng này càng về sau càng mạnh.`:`${mal.length>1?"Các lực ở đây đều là hành tinh “cứng”":"Lực ở đây là một hành tinh “cứng”"}, nên chuyện ${tag} đòi bạn tự gồng nhiều hơn người khác; điều cần để ý là ${Hn(mal.map(p=>Xn[p].shadow))}. Đổi lại, sức chịu đựng bạn luyện được ở đây sẽ thành tài sản cho cả đời.`;
paras.push(p2)}
/* 3. lượng hóa: SAV x Bhava Bala, karaka x chủ nhà */
const S=a.ctx.sb?.bhava?.[o],pot=LA_POT(e.n,e.sav),dur=S?S.rank<=4?"top":S.rank<=8?"mid":"low":"mid";
let p3=`Về lượng, nhà này có ${e.sav} điểm SAV${LA_DUS.includes(e.n)?" (ở nhà khó, ít điểm lại là điều tốt vì nghĩa là ít rắc rối)":""}${S?` và xếp thứ ${S.rank}/12 về Bhava Bala`:""}. ${LA_STRMX[pot+"-"+dur]}`;
const ks=(LA_KARAKA[e.n]||[]).filter(k=>k!==L);if(ks.length){const k=ks[0],K=LA_pl(a,k),kg=K.grade==="strong"||K.grade==="good";
p3+=` Hành tinh đại diện tự nhiên (karaka) cho chuyện ${tag} là ${X(k)}, hiện ${K.grade==="strong"?"rất mạnh":K.grade==="good"?"khá vững":K.grade==="mixed"?"ở mức vừa":"còn yếu"}. `+(kg&&lpGood?`Người quản lý (chủ nhà) và người đại diện (karaka) cùng mạnh, nên lời hứa của nhà này rõ ràng và đáng tin.`:kg&&!lpGood?`Bản chất của mảng này tốt, chỉ là “người quản lý” chưa đủ lực; hoàn cảnh sẽ mở dần theo thời gian và nỗ lực.`:!kg&&lpGood?`Khung sườn do chủ nhà dựng thì vững, nhưng chất liệu bên trong cần được bồi đắp thêm, nhất là qua những việc thuộc về ${X(k)}.`:`Cả chủ nhà lẫn karaka đều cần được nâng đỡ, nên đây là nơi sự chủ động của bạn tạo ra khác biệt lớn nhất.`)}
paras.push(p3);
/* 4. thời điểm + cách vun đắp */
const set=new Set([L,...e.occupants]),tm=LA_dashaHit(a,set),key=lpGood||!infl.length?L:[...set].sort((x,y)=>LA_pl(a,x).s-LA_pl(a,y).s)[0];
paras.push(`${tm.join(" ")} ${tm.length?"":""}Chìa khóa của nhà này là ${X(key)}: mọi việc giúp ${X(key)} sáng lên, như ${LA_ACT[key]}, cũng làm chuyện ${tag} của bạn sáng lên theo.`.trim());
return paras}
function LA_wrapHouse(a,e,r){try{if(a.noTime)return r;const prep={natal:a.n,ctx:a,noTime:!1};const paras=LA_houseSynth(prep,e);const i=r.sections.findIndex(s=>s.id==="summary");r.sections.splice(i>=0?i+1:1,0,{id:"synth",title:"Luận giải tổng hợp",paragraphs:paras});}catch(err){console.warn("synth",err)}return r}
const LA_PAIR={"mercury|sun":"trí tuệ được ý chí soi sáng (Budha-Aditya Yoga): đầu óc sắc, lời nói có trọng lượng, chỉ cần tránh cố chấp với ý mình",
"jupiter|moon":"tâm hồn rộng lượng và lạc quan; bạn dễ được người khác tin cậy và tìm đến xin lời khuyên",
"mars|saturn":"sức bật gặp phanh hãm: năng lượng dễ dồn nén, nhưng khi có kỷ luật, bạn làm được những việc mà người khác bỏ cuộc",
"mars|venus":"đam mê và sức hút mạnh, tình cảm nồng nhiệt, sáng tạo có lửa",
"moon|saturn":"cảm xúc sâu và nghiêm, trưởng thành sớm; đôi khi nặng lòng hơn cần thiết",
"saturn|sun":"ý chí va với trách nhiệm: quan hệ với cha hay cấp trên cần nhiều kiên nhẫn, đổi lại bạn rất bền bỉ",
"jupiter|venus":"hai hành tinh lành gặp nhau: duyên dáng, có học, đời sống dễ chịu; chỉ cần tránh dễ dãi với chính mình",
"mars|moon":"cảm xúc mạnh và phản ứng nhanh; truyền thống gọi là Chandra-Mangala Yoga, gắn với tài xoay xở tiền bạc",
"moon|sun":"ý chí và cảm xúc cùng một hướng: bạn biết rõ mình muốn gì",
"mercury|venus":"khéo ăn nói, có năng khiếu nghệ thuật, thương lượng và kinh doanh",
"jupiter|saturn":"niềm tin gặp thực tế: tầm nhìn dài, chín muộn mà chắc",
"mars|sun":"năng lượng dồi dào và quả quyết, cần để ý tính nóng",
"mercury|saturn":"suy nghĩ thực tế, cẩn trọng, giỏi tổ chức và làm việc chi tiết",
"jupiter|mercury":"học rộng, giỏi giảng giải và truyền đạt",
"moon|venus":"tinh tế, giàu cảm xúc thẩm mỹ, quý những điều dịu dàng",
"jupiter|mars":"hành động có lý tưởng (Guru-Mangala Yoga): dũng cảm vì điều đúng",
"jupiter|sun":"ý chí có đạo lý, dễ được người trên nâng đỡ",
"sun|venus":"duyên dáng và có gu, nhưng Sao Kim dễ bị Mặt Trời lấn át, nên chuyện tình cảm cần bạn bớt cái tôi",
"saturn|venus":"tình cảm nghiêm túc và chung thủy; nghệ thuật có chiều sâu và kỷ luật",
"mars|mercury":"lý lẽ sắc bén, tranh luận giỏi; cần cẩn trọng với lời nói lúc nóng",
"mercury|moon":"đầu óc nhạy, hay nghĩ, ăn nói có duyên"};
const LA_pairTxt=(x,y)=>{if(x==="rahu"||y==="rahu"){const o=x==="rahu"?y:x;return o==="ketu"?"":`Rahu khuếch đại ${X(o)}: khát vọng về ${Xn[o].role} rất lớn, dễ đẩy tới cực độ, nên cần biết điểm dừng`}
if(x==="ketu"||y==="ketu"){const o=x==="ketu"?y:x;return`Ketu khiến ${X(o)} hướng vào bên trong: bạn có sẵn năng khiếu về ${Xn[o].role} nhưng lại ít coi trọng nó, hoặc thấy nó chưa bao giờ đủ`}
return LA_PAIR[[x,y].sort().join("|")]??`${Xn[x].role} hòa vào ${Xn[y].role}`};
function LA_chartSynth(pr){const a={natal:pr.natal,ctx:pr.ctx},n=pr.natal,secs=[],LL=C1[n.lagna.sign],sb=pr.ctx.sb;
/* A. ba trụ cột */
{const L=LA_plText(a,LL),M=LA_pl(a,"moon"),Su=LA_pl(a,"sun"),gr=x=>x.grade==="strong"?"rất vững":x.grade==="good"?"vững":x.grade==="mixed"?"ở mức vừa":"cần được nâng đỡ";
const three=[{k:"thân",x:L.P,t:"phần thân vững nhất: bạn mạnh nhất khi bắt tay vào làm, khi hiện diện bằng hành động cụ thể."},{k:"tâm",x:M,t:"phần tâm vững nhất: trực giác và đời sống cảm xúc là chiếc la bàn đáng tin của bạn."},{k:"hồn",x:Su,t:"phần hồn vững nhất: ý chí và cảm giác về mục đích sống là thứ giữ bạn đứng thẳng."}].sort((p,q)=>q.x.s-p.x.s);
secs.push({title:"Thân, tâm và hồn",paragraphs:[`Jyotish đọc một con người từ ba điểm: cung mọc là thân, Mặt Trăng là tâm, Mặt Trời là hồn. Cung mọc của bạn là ${d0[n.lagna.sign]}, và người giữ bánh lái cho cả lá số là ${X(LL)}, đang đứng ở ${LA_HPLACE(n.grahas[LL].house)}. ${L.text}`,
`Mặt Trăng của bạn ở ${d0[n.grahas.moon.sign]}, nhà ${n.grahas.moon.house}, ${gr(M)}; Mặt Trời ở ${d0[n.grahas.sun.sign]}, nhà ${n.grahas.sun.house}, ${gr(Su)}. Đặt ba điểm cạnh nhau thì ${three[0].t} ${three[2].x.s<three[0].x.s-1?`Điểm cần chăm hơn là phần ${three[2].k}; khi ${three[2].k} được nuôi dưỡng, hai phần còn lại sẽ phát huy trọn vẹn hơn.`:"Ba phần khá cân bằng với nhau, nên bạn ít bị kéo lệch về một phía."}`]})}
/* B. hành tinh mang phúc / mang bài học */
{const roles=Sn.map(p=>({p,...LA_func(n,p),P:LA_pl(a,p)})),yk=roles.filter(r=>r.role==="yogakaraka"),tr=roles.filter(r=>r.role==="trikona"||(r.role==="lagna"&&r.p===LL)),du=roles.filter(r=>r.role==="dusthana"),pp=[];
const st=r=>r.P.grade==="strong"?"đang rất mạnh":r.P.grade==="good"?"đang vững":r.P.grade==="mixed"?"lực ở mức vừa":"còn yếu";
let b=`Với cung mọc ${d0[n.lagna.sign]}, mỗi hành tinh mang một vai riêng tùy nhà nó cai quản. `;
if(yk.length)b+=`${Hn(yk.map(r=>X(r.p)))} ${LA_ROLE.yogakaraka} (chủ nhà ${yk[0].hs.join(" và ")}); hiện ${st(yk[0])}${yk[0].P.grade==="strong"||yk[0].P.grade==="good"?", nên những gì nó hứa có cơ hội thành hiện thực rõ ràng.":", nên may mắn ấy cần được bạn chủ động đánh thức."} `;
const trs=tr.filter(r=>!yk.includes(r));if(trs.length)b+=`${trs.length>1?"Những hành tinh mang phúc là":"Hành tinh mang phúc là"} ${Hn(trs.map(r=>`${X(r.p)} (chủ nhà ${r.hs.join(", ")}, ${st(r)})`))}. ${trs.every(r=>r.P.grade==="strong"||r.P.grade==="good")?"Tất cả đều có lực, nên dòng phúc của lá số chảy khá thông.":trs.some(r=>r.P.grade==="weak")?"Có hành tinh mang phúc còn yếu, nên một phần phúc phần đến muộn hoặc cần nỗ lực để nhận.":"Dòng phúc có, nhưng không ồ ạt: nó đến đều theo sự chuẩn bị của bạn."}`;
pp.push(b);
if(du.length){const strongDu=du.filter(r=>r.P.grade==="strong"||r.P.grade==="good");pp.push(`${du.length>1?"Những hành tinh mang bài học là":"Hành tinh mang bài học là"} ${Hn(du.map(r=>`${X(r.p)} (chủ nhà ${r.hs.join(", ")})`))}. ${strongDu.length?`${Hn(strongDu.map(r=>X(r.p)))} lại đang mạnh: thử thách nó mang tới không nhỏ, nhưng bạn cũng có năng lực tương xứng để vượt qua, và thường trưởng thành vượt bậc sau đó.`:du.length>1?"Các hành tinh này đều không quá mạnh, nên thử thách chúng mang tới thường vừa sức và qua nhanh.":"Hành tinh này không quá mạnh, nên thử thách nó mang tới thường vừa sức và qua nhanh."}`)}
secs.push({title:"Những hành tinh mang phúc và mang bài học",paragraphs:pp})}
/* C. nơi sức mạnh dồn về */
if(sb){const ord=sb.order,top=ord.slice(0,2),bot=ord[ord.length-1],where=p=>{const hs=LA_lords(n,p);return`cai quản nhà ${hs.join(" và ")} (${hs.map(h=>$1[h-1]).join("; ")}) và đứng ở nhà ${n.grahas[p].house}`};
secs.push({title:"Nơi sức mạnh dồn về",paragraphs:[`Shadbala, phép đo sáu nguồn sức mạnh của hành tinh, cho thấy năng lượng của bạn dồn về ${X(top[0])} và ${X(top[1])}. ${X(top[0])} ${where(top[0])}; ${X(top[1])} ${where(top[1])}. Vì vậy những chủ đề ấy là nơi bạn làm việc hiệu quả nhất, ít tốn sức nhất, và cũng là nơi người khác dễ nhận ra tài năng của bạn.`,
`Ở đầu kia, ${X(bot)} là hành tinh có ít lực nhất (${sb.planets[bot].band}); nó ${where(bot)}. Đây không phải điểm xấu mà là điểm cần chăm: những việc như ${LA_ACT[bot]} sẽ bù đắp trực tiếp cho nó.`]})}
/* D. các cặp kết hợp */
{const pp=[],seen=new Set;const bySign={};for(const p of Sn)(bySign[n.grahas[p].sign]??=[]).push(p);
for(const s in bySign){const g=bySign[s];if(g.length<2)continue;const h=n.grahas[g[0]].house,lines=[];for(let i=0;i<g.length;i++)for(let j=i+1;j<g.length;j++){const t=LA_pairTxt(g[i],g[j]);t&&lines.push(t)}
lines.length&&pp.push(`${Hn(g.map(X))} cùng đứng ở ${d0[s]}, nhà ${h} (${$1[h-1]}): ${lines.join("; ")}. Vì chúng chung một nhà, những phẩm chất này đều dồn vào chuyện ${$1[h-1]}.`)}
for(const x of hn)for(const y of hn){if(x>=y)continue;const gx=n.grahas[x],gy=n.grahas[y];if(C1[gx.sign]===y&&C1[gy.sign]===x){pp.push(`${X(x)} và ${X(y)} đổi nhà cho nhau (Parivartana Yoga): ${X(x)} ngồi trong cung của ${X(y)} và ngược lại. Nhà ${gx.house} và nhà ${gy.house} của bạn vì thế gắn bó như hai mặt của một đồng xu, cái này thịnh thì cái kia cũng lên.`)}}
const aspects=(p,q)=>n.houses[n.grahas[q].house-1].aspectedBy.includes(p);
for(const x of hn)for(const y of hn){if(x>=y||n.grahas[x].sign===n.grahas[y].sign)continue;if(aspects(x,y)&&aspects(y,x)){const k=[x,y].sort().join("|");if(seen.has(k))continue;seen.add(k);pp.push(`${X(x)} (nhà ${n.grahas[x].house}) và ${X(y)} (nhà ${n.grahas[y].house}) nhìn thẳng vào nhau: ${LA_pairTxt(x,y)}. Khi hai hành tinh nhìn nhau, hai mảng đời chúng đứng luôn soi chiếu và cân bằng lẫn nhau.`)}}
if(pp.length)secs.push({title:"Những hành tinh đứng chung, nhìn nhau và đổi nhà",paragraphs:pp.slice(0,6)})}
/* E. chương hiện tại */
{const [m,s]=pr.ctx.chain;if(m){const role=p=>{const hs=LA_lords(n,p);return hs.length?`cai quản nhà ${hs.join(" và ")} (${hs.map(h=>$1[h-1]).join("; ")})`:`không cai quản cung nào mà mang màu của ${X(C1[n.grahas[p].sign])}`};
const M=LA_plText(a,m.lord);let t=`Bạn đang ở đại vận ${X(m.lord)}, kéo dài đến ${dn(m.endMs)}. ${X(m.lord)} ${role(m.lord)} và đứng ở nhà ${n.grahas[m.lord].house} (${$1[n.grahas[m.lord].house-1]}), nên đây là những năm xoay quanh các chủ đề ấy. ${M.text}`;
const ps=[t,LA_teachText(m.lord)];if(s&&s.lord!==m.lord){const k=f0(n.grahas[s.lord].sign-n.grahas[m.lord].sign,12)+1,rel=[6,8,12].includes(k)?"ở thế 6/8/12 so với nhau, nên giai đoạn này có ma sát: hai ý muốn kéo về hai phía, cần bạn dung hòa":[1,5,9].includes(k)?"ở thế tam hợp hoặc cùng cung, nên phối hợp nhịp nhàng: những gì bạn gieo lúc này dễ nảy mầm":[4,7,10].includes(k)?"ở thế trụ cột so với nhau, nên đây là quãng của hành động và thay đổi cụ thể":"ở thế trung tính, nên tiến triển đều đặn";
ps.push(`Bên trong đại vận ấy, tiểu vận ${X(s.lord)} (đến ${dn(s.endMs)}) ${role(s.lord)}. Tính từ ${X(m.lord)}, ${X(s.lord)} đứng ở cung thứ ${k}, ${rel}.`)}
secs.push({title:"Chương đời hiện tại",paragraphs:ps})}}
/* F. tổng hòa */
{const tones=pr.ctx.tones,good=tones.map((t,i)=>t==="good"?i+1:0).filter(Boolean),hard=tones.map((t,i)=>t==="hard"?i+1:0).filter(Boolean);
secs.push({title:"Tổng hòa",paragraphs:[`Gộp tất cả lại, lá số của bạn sáng nhất ở ${good.length?Hn(good.map(h=>`nhà ${h} (${$1[h-1]})`)):"không mảng nào nổi hẳn lên, mà nhiều mảng cùng ở mức khá"}${hard.length?`, và cần được chăm chút nhiều hơn ở ${Hn(hard.map(h=>`nhà ${h} (${$1[h-1]})`))}`:""}. Những nơi sáng là nơi bạn có thể dựa vào để đi xa; những nơi cần chăm không phải là định mệnh xấu, mà là nơi đời bạn mời bạn trưởng thành. Mỗi trang trong phần “12 khía cạnh” có một mục “Luận giải tổng hợp” đọc kỹ từng nơi như vậy.`]})}
return secs}
function LA_Synth({prepared:a}){const secs=n0.useMemo(()=>LA_chartSynth(a),[a]);return u.jsxs(u.Fragment,{children:[u.jsx("p",{className:"eyebrow reveal",children:"Tổng quan"}),u.jsx("h2",{className:"reveal",children:"Tổng hòa lá số"}),
u.jsx("p",{className:"lead-p reveal",children:"Một lá số không phải là chín hành tinh đứng riêng lẻ, mà là một bản giao hưởng: hành tinh này nâng hành tinh kia, nhà này chảy về nhà khác. Trang này đọc chúng cùng một lúc."}),
secs.map((s,i)=>u.jsxs("section",{className:"card prose reveal la-block",children:[u.jsx("h3",{children:s.title}),s.paragraphs.map((p,j)=>u.jsx("p",{children:u.jsx(nn,{text:p})},j))]},i))]})}
