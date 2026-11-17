import sys
src=open('base.html').read(); add=open('addon.js').read(); css=open('addon.css').read()
def rep(old,new,count=1):
    global src
    n=src.count(old)
    assert n==count, (old[:80], n)
    src=src.replace(old,new)
# 1. varga divisions D4, D7
rep('case 9:return(Lv[a%4]+e)%12;','case 4:return(a+3*e)%12;case 7:return a%2===0?(a+e)%12:(a+6+e)%12;case 9:return(Lv[a%4]+e)%12;')
# 2. add D4/D7 to readings
rep('function yf(a){return[mf(a),vf(a),df(a)].map(e=>({...e,note:Zb[e.n]}))}','function yf(a){return[mf(a),LA_d4(a),LA_d7(a),vf(a),df(a)].map(e=>({...e,note:e.note??Zb[e.n]}))}')
rep('open:g.house===1||(c.n===9?g.house===7:g.house===10)','open:g.house===1||(c.n===9?g.house===7:c.n===4?g.house===4:c.n===7?g.house===5:g.house===10)')
# 3. nav pages
rep('{id:"t-sky",nav:"Bầu trời hiện tại",label:"Bầu trời hiện tại"}]),','{id:"t-sky",nav:"Bầu trời hiện tại",label:"Bầu trời hiện tại"},{id:"t-ahead",nav:"Mười năm tới",label:"Mười năm tới"}]),')
rep('o("today","Lời nhắn tháng này",[{id:"today",nav:"Lời nhắn",label:"Lời nhắn tháng này"}]),g}','o("today","Lời nhắn tháng này",[{id:"today",nav:"Lời nhắn",label:"Lời nhắn tháng này"}]),o("match","Hợp đôi",[{id:"match",nav:"Hợp đôi",label:"Hợp đôi"}]),g}')
# 4. render pages
rep('$==="today"?u.jsx(Kx,{prepared:a,today:e0,monthMs:D,onMonth:J}):null}','$==="today"?u.jsx(Kx,{prepared:a,today:e0,monthMs:D,onMonth:J}):$==="t-ahead"?u.jsx(LA_Ahead,{prepared:a,printing:K}):$==="match"?u.jsx(LA_Match,{prepared:a}):null}')
# 5. save button
rep('u.jsx("button",{className:"btn ghost",type:"button",onClick:v0,children:l0?"Đã sao chép ✓":"Sao chép bài đọc"}),','u.jsx("button",{className:"btn ghost",type:"button",onClick:v0,children:l0?"Đã sao chép ✓":"Sao chép bài đọc"}),u.jsx(LA_SaveBtn,{prepared:a}),')
# 6. saved list on landing
rep('o==="landing"&&u.jsx(gx,{now:g,initial:y,onSubmit:b}),','o==="landing"&&u.jsx(gx,{now:g,initial:y,onSubmit:b}),o==="landing"&&u.jsx(LA_Saved,{onOpen:b}),')
# 7. method page
rep('Chưa có các lá số phụ khác ngoài D2, D9, D10, và chưa có đại vận Chara của Jaimini.','Chưa có các lá số phụ khác ngoài D2, D4, D7, D9, D10, và chưa có đại vận Chara của Jaimini.')
rep('Mọi phép tính chạy ngay trong trình duyệt của bạn. Ngày giờ và nơi sinh không được gửi tới bất kỳ máy chủ nào, và trang không lưu chúng lại sau khi bạn đóng. Chỉ có lựa chọn giao diện sáng hoặc tối được nhớ trên máy bạn.','Mọi phép tính chạy ngay trong trình duyệt của bạn. Ngày giờ và nơi sinh không được gửi tới bất kỳ máy chủ nào. Trang chỉ nhớ hai thứ trên máy bạn: lựa chọn giao diện sáng hoặc tối, và những lá số bạn tự bấm “Lưu lá số” (lưu trong trình duyệt, xóa được bất cứ lúc nào ở mục “Lá số đã lưu” trên trang đầu).')
# 7b. form labels for partner entry
rep('function lx({initial:a,onSubmit:e}){','function lx({initial:a,onSubmit:e,laLabel:LAl,laTitle:LAt,laId:LAi}){')
rep('className:"intake card glow",id:"form",','className:"intake card glow",id:LAi??"form",')
rep('u.jsx("h2",{children:"Nhập thông tin sinh"}),u.jsx("p",{children:"Chỉ cần ngày, giờ và nơi sinh."})','u.jsx("h2",{children:LAt??"Nhập thông tin sinh"}),u.jsx("p",{children:"Chỉ cần ngày, giờ và nơi sinh."})')
rep('type:"submit",children:["Mở lá số ",u.jsx("span",{"aria-hidden":"true",children:"→"})]','type:"submit",children:[LAl??"Mở lá số"," ",u.jsx("span",{"aria-hidden":"true",children:"→"})]')
# 9. cosmic background
rep('u.jsx(ty,{theme:a,calm:c==="method"||o==="report"}),','u.jsx(ty,{theme:a,calm:c==="method"||o==="report"}),u.jsx(LA_Galaxy,{calm:c==="method"||o==="report"}),')
# 10. wording: landing & report frame
T=[
('Cho mình ngày, giờ và nơi bạn sinh. Mình đọc bầu trời lúc đó theo Jyotish, chiêm tinh cổ của Ấn Độ, rồi kể lại bằng lời thường.','Chỉ cần ngày, giờ và nơi bạn chào đời, mình sẽ dựng lại bầu trời của khoảnh khắc ấy theo Jyotish, nền chiêm tinh cổ của Ấn Độ, rồi kể cho bạn nghe bằng những lời gần gũi nhất.'),
('Ngày sinh, giờ sinh và nơi sinh. Chưa rõ giờ thì cứ nhập canh giờ hoặc bỏ trống, trang vẫn đọc được phần còn lại.','Ngày, giờ và nơi bạn chào đời là đủ để bầu trời ấy hiện ra. Nếu không nhớ chính xác giờ sinh, bạn có thể chọn canh giờ hoặc để trống; phần lớn bài đọc vẫn trọn vẹn.'),
('children:"Chỉ cần ngày, giờ và nơi sinh."','children:"Mọi phép tính diễn ra ngay trên thiết bị của bạn."'),
('Jyotish, hay chiêm tinh Vệ Đà, là hệ chiêm tinh cổ của Ấn Độ. Khác với chiêm tinh phương Tây, nó tính theo vị trí thật của các vì sao, nên cung của bạn ở đây có thể khác cung bạn vẫn biết.','Jyotish, hay chiêm tinh Vệ Đà, là “khoa học của ánh sáng” được người Ấn Độ gìn giữ suốt hàng nghìn năm. Khác với chiêm tinh phương Tây, Jyotish tính theo vị trí thật của các vì sao trên bầu trời, nên cung của bạn ở đây có thể khác cung bạn vẫn quen.'),
('Lá số cho biết lúc bạn sinh, chín hành tinh đứng ở đâu, và mỗi vị trí ứng với một mảng đời. Nó còn chia đời bạn thành những giai đoạn dài, mỗi giai đoạn do một hành tinh dẫn dắt.','Lá số ghi lại nơi chín hành tinh đứng vào khoảnh khắc bạn cất tiếng khóc đầu tiên, mỗi vị trí ứng với một mảng đời. Nó còn chia cuộc đời thành những chương dài, mỗi chương do một hành tinh dẫn dắt.'),
('"Bài đọc mang tính tham khảo và tự suy ngẫm. Nó không thay thế lời khuyên y tế, pháp lý hay tài chính, và không dự đoán sự kiện cụ thể. Muốn biết cách tính và độ chắc chắn của từng phần, xem trang "','"Bài đọc dành cho sự tự chiêm nghiệm, không thay thế lời khuyên y tế, pháp lý hay tài chính. Cách tính và độ tin cậy của từng phần được trình bày trong trang "'),
('Ba lá số phụ: D2, D9 và D10, mỗi lá một trang.','Năm lá số phụ: D2, D4, D7, D9 và D10, mỗi lá một trang.'),
('children:"Ba lá số phụ"','children:"Các lá số phụ"'),
('children:"Bài đọc được chia thành bảy phần"','children:"Bài đọc được chia thành từng phần"'),
]
for o,n in T:
    assert src.count(o)>=1,o[:60]
    src=src.replace(o,n)
# 11. drop redundant helper notes
for o in ['u.jsx("p",{className:"faint small",children:"Bấm vào một hàng để đọc về chòm sao (nakshatra) của hành tinh đó."}),',
          'u.jsx("p",{className:"faint small",children:"Màu chỉ là gợi ý chung, lấy từ vị trí của hành tinh dẫn dắt và các nhà nó cai quản."})',
          'u.jsx("p",{className:"tip",children:"Nền vũ trụ phía sau trang chỉ để trang trí: chín hành tinh xuất phát từ vị trí thật của chúng lúc bạn mở trang (nhìn từ Trái Đất, theo thứ tự cổ: Mặt Trăng, Sao Thủy, Sao Kim, Mặt Trời, Sao Hỏa, Sao Mộc, Sao Thổ, rồi Rahu và Ketu), sau đó quay nhanh hơn thật để mắt nhìn thấy được. Nó không dùng để đọc lá số."})']:
    assert src.count(o)==1,o[:60]
    src=src.replace(o,'null' if not o.endswith(',') else '')
# 12. synthesis
rep('houses:c?[]:(()=>{const g=new Map;return e.houses.map(o=>qk(a,o,g))})()','houses:c?[]:(()=>{const g=new Map;return e.houses.map(o=>LA_wrapHouse(a,o,qk(a,o,g)))})()')
rep('{id:"ov-common",nav:"Điểm chung",label:"Tổng quan: điểm chung và sức mạnh"},','{id:"ov-common",nav:"Điểm chung",label:"Tổng quan: điểm chung và sức mạnh"},...c?[]:[{id:"ov-synth",nav:"Tổng hòa",label:"Tổng quan: tổng hòa lá số"}],')
rep('$==="ov-common"?u.jsx(jx,{prepared:a}):','$==="ov-common"?u.jsx(jx,{prepared:a}):$==="ov-synth"?u.jsx(LA_Synth,{prepared:a}):')
add=add+open('synth.js').read()
# 13. D3, transit, 2027, PDF, letter
rep('function yf(a){return[mf(a),LA_d4(a),','function yf(a){return[mf(a),LA_d3(a),LA_d4(a),')
rep('c.n===4?g.house===4:','c.n===3?g.house===3:c.n===4?g.house===4:')
rep('{id:"t-sky",nav:"Bầu trời hiện tại",label:"Bầu trời hiện tại"},{id:"t-ahead"','{id:"t-sky",nav:"Bầu trời hiện tại",label:"Bầu trời hiện tại"},{id:"t-transit",nav:"Transit",label:"Transit trên lá số"},{id:"t-ahead"')
rep('o("match","Hợp đôi",','o("year","Dự báo 2027",[{id:"y-2027",nav:"Năm 2027",label:"Dự báo năm 2027"}]),o("match","Hợp đôi",')
rep('$==="t-ahead"?u.jsx(LA_Ahead,','$==="t-transit"?u.jsx(LA_Transit,{prepared:a}):$==="y-2027"?u.jsx(LA_Year,{prepared:a,printing:K}):$==="t-ahead"?u.jsx(LA_Ahead,')
rep('u.jsx(LA_SaveBtn,{prepared:a}),','u.jsx(LA_SaveBtn,{prepared:a}),u.jsx(LA_PdfBtn,{name:r.name}),')
rep('D2, D4, D7, D9, D10','D2, D3, D4, D7, D9, D10')
rep('Năm lá số phụ: D2, D4, D7, D9 và D10','Sáu lá số phụ: D2, D3, D4, D7, D9 và D10')
import re as _re
def arr(name,items):
    global src
    i=src.index(name+'=['); j=src.index(']',i)
    src=src[:i]+name+'=['+','.join('"'+x+'"' for x in items)+src[j:]
arr('ak',["tràn đầy năng lượng, thẳng thắn và luôn là người đầu tiên bước về phía trước","điềm đạm, vững chãi, toát ra một sự đáng tin khó gọi thành lời","lanh lợi, cởi mở, đôi mắt lúc nào cũng ánh lên sự tò mò","dịu dàng và ấm áp, nhưng luôn giữ một lớp vỏ dè dặt để tự che chở","tự tin, rạng rỡ, mang khí chất của người sinh ra để dẫn dắt","lịch thiệp, chỉn chu và tinh ý đến từng chi tiết nhỏ","duyên dáng, hòa nhã, luôn khéo léo giữ cho mọi thứ được cân bằng","trầm lặng, kín đáo, với ánh nhìn sắc như đọc thấu lòng người","hào sảng, phóng khoáng và lạc quan như một người lữ hành","nghiêm cẩn, điềm tĩnh, giữ một khoảng cách vừa đủ để được nể trọng","cởi mở, độc đáo, luôn nhìn thế giới từ một góc chẳng giống ai","hiền hòa, nhẹ nhàng, với sự thấu cảm khiến người khác muốn mở lòng"])
arr('ck',["là một ngọn lửa luôn sục sôi, chỉ thấy mình sống trọn khi được tự do hành động","luôn khao khát sự ổn định, một chỗ dựa vững vàng để tâm hồn được nghỉ ngơi","chẳng mấy khi chịu ngồi yên, luôn cần được trò chuyện, kết nối và học thêm điều mới","luôn tìm về một mái ấm an toàn, nơi bạn được che chở và được thương","mong mỏi được nhìn nhận và trân trọng đúng với những gì mình đã trao đi","luôn có một nỗi lo âm thầm, chỉ thực sự yên khi mọi thứ quanh mình được sắp đặt gọn gàng và có ích","sợ nhất là bất hòa, và chỉ thấy bình yên khi mọi thứ được hài hòa, công bằng","cất giữ một nỗi bất an rất kín, và chỉ mở cửa cho người mình tin trọn vẹn","khao khát tự do và luôn cần một lẽ sống đủ lớn để dấn thân theo","sợ thiếu thốn hơn ai hết, nên chỉ thấy an toàn khi đã có trong tay những thành tựu thật vững","biết mình khác người, và cần một khoảng trời riêng để được là chính mình và cống hiến","nhạy cảm như mặt nước, dễ tổn thương và cần những khoảng tĩnh lặng để lắng lại"])
T2=[('waxing:"Bạn sinh lúc trăng đang đầy dần, nên Mặt Trăng của bạn thường khá lành và nâng đỡ: cảm xúc có xu hướng ổn và dễ mở lòng với người khác."','waxing:"Bạn chào đời khi vầng trăng đang đầy dần. Truyền thống xem đây là một Mặt Trăng lành, giàu sức sống: lòng bạn có xu hướng rộng mở, dễ tin và dễ đón nhận người khác, như ánh trăng mỗi đêm lại sáng thêm một chút."'),
('waning:"Bạn sinh lúc trăng đang vơi dần, nên cảm xúc của bạn hướng về chính mình nhiều hơn: bạn kín đáo, ít khoe và cần thời gian riêng để nạp lại."','waning:"Bạn chào đời khi vầng trăng đang vơi dần. Cảm xúc của bạn vì thế hướng vào bên trong nhiều hơn: bạn kín đáo, ít phô bày, sống nội tâm, và cần những khoảng lặng riêng để tự nạp lại năng lượng, như mặt trăng lặng lẽ thu mình trước khi trở lại tròn đầy."'),
('Xp="Lúc bạn sinh, {list} đang đi lùi trên bầu trời (gọi là nghịch hành). Chuyện của {it} thường đến với bạn theo vòng: làm, nghĩ lại, rồi mới làm chắc, và nhờ vậy bạn hay đi sâu hơn người khác."','Xp="Vào khoảnh khắc bạn chào đời, {list} đang đi lùi trên bầu trời (gọi là nghịch hành). Những chủ đề của {it} vì thế đến với bạn theo vòng xoáy: bắt đầu, ngẫm lại, rồi mới làm cho thật chắc. Đó không phải sự chậm trễ, mà là cách bạn đi sâu hơn người khác, và thường chín muộn mà bền."'),
('same:"Người ta thấy bạn {face}, và đúng là lòng bạn {need}."','same:"Thoạt nhìn, người ta thấy ở bạn một người {face}. Và quả thật, sâu trong lòng, bạn {need}."'),
('friend:"Người ta thấy bạn {face}, còn lòng bạn thì {need}."','friend:"Thoạt nhìn, người ta thấy ở bạn một người {face}; còn sâu trong lòng, bạn {need}."'),
('tension:"Người ta thấy bạn {face}, nhưng ít ai biết lòng bạn {need}."','tension:"Thoạt nhìn, người ta thấy ở bạn một người {face}. Nhưng ít ai biết rằng sâu trong lòng, bạn {need}."'),
('noTime:"Có một điều ít ai thấy ở bạn: lòng bạn {need}."','noTime:"Có một điều ít ai nhìn thấy ở bạn: sâu trong lòng, bạn {need}."'),
('Jp="{list} đang đứng rất vững trong lá số của bạn. Chuyện của {it} có nền tốt để bạn dựa vào."','Jp="{list} đang đứng rất vững trong lá số của bạn, như những cột trụ âm thầm nâng đỡ cả tấm bản đồ. Những gì {it} đại diện là nền móng bạn có thể yên tâm dựa vào, và càng sống lâu, bạn càng thấy rõ giá trị của nó."'),
('Pp="{list} đang đứng ở vị trí yếu nhất của nó (gọi là hãm). Điều này không làm lá số của bạn kém đi: chủ đề của {it} cần nhiều nỗ lực hơn, và thường là chỗ bạn rèn được nhiều nhất."','Pp="{list} đang đứng ở vị trí suy yếu nhất của mình (gọi là hãm). Điều đó không khiến lá số kém đi; nó chỉ cho biết những chủ đề của {it} sẽ đòi bạn nhiều nỗ lực hơn, và cũng chính ở đó, bạn được rèn giũa sâu sắc nhất."'),
('Zp="Có {k} hành tinh cùng đứng ở nhà {n} ({tag}). Lá số của bạn dồn nhiều về chuyện {domain}, nên đây là chỗ cuộc đời hay gọi tên bạn."','Zp="Có tới {k} hành tinh cùng hội tụ ở nhà {n} ({tag}). Cả tấm bản đồ dồn trọng tâm về chuyện {domain}: đây là nơi cuộc đời sẽ nhiều lần gọi tên bạn, và cũng là nơi bạn để lại dấu ấn rõ nhất."')]
for o,nw in T2:
    assert src.count(o)==1,o[:40]; src=src.replace(o,nw)
add=add+open('feat2.js').read()+open('feat3.js').read()
# 8. inject add-on code before root render
rep('xm.createRoot(document.getElementById("root"))',add+'\nxm.createRoot(document.getElementById("root"))')
rep('</style>','\n'+css+'</style>')
open('index.html','w').write(src)
print('ok',len(src))
