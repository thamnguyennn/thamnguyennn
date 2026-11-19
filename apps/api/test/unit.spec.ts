import { intervalDays, render } from '../src/followup/followup.controller';

describe('nhắc lịch – hàm thuần', () => {
  it('đọc tần suất điều trị', () => {
    expect(intervalDays('3 buổi/tuần')).toBe(2);
    expect(intervalDays('2 buổi / tuần')).toBe(4);
    expect(intervalDays('1 buổi/tuần')).toBe(7);
    expect(intervalDays('mỗi ngày')).toBe(1);
    expect(intervalDays('2 tuần/1 buổi')).toBe(14);
    expect(intervalDays(undefined)).toBe(3);
    expect(intervalDays('tùy tình trạng')).toBe(3);
  });
  it('điền mẫu tin, thiếu biến thì để …', () => {
    expect(render('Chào {ten}, buổi {da_dung}/{tong}. {x}', { ten: 'Hoa', da_dung: 2, tong: 10 })).toBe('Chào Hoa, buổi 2/10. …');
  });
});
