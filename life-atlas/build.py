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
# 8. inject add-on code before root render
rep('xm.createRoot(document.getElementById("root"))',add+'\nxm.createRoot(document.getElementById("root"))')
rep('</style>','\n'+css+'</style>')
open('index.html','w').write(src)
print('ok',len(src))
