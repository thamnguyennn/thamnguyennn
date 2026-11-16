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
# 8. inject add-on code before root render
rep('xm.createRoot(document.getElementById("root"))',add+'\nxm.createRoot(document.getElementById("root"))')
rep('</style>','\n'+css+'</style>')
open('index.html','w').write(src)
print('ok',len(src))
