import { lunarInfo } from './constants';
import { LeapDate } from "./types";

export class Solar2lunar {
  y: number
  m: number
  d: number

  constructor(date: Date) {
    this.y = date.getFullYear();
    this.m = date.getMonth();
    this.d = date.getDate();
  }

  /**
   * 返回农历y年闰月是哪个月；若y年没有闰月 则返回0
   * @param y
   * @returns {number}
   */
  leapMonth(y: number) {
    return (lunarInfo[y - 1900] & 0xf);
  }

  leapDays(y: number) {
    if (this.leapMonth(y)) {
      return ((lunarInfo[y - 1900] & 0x10000) ? 30 : 29);
    }
    return (0);
  }

  lYearDays(y: number) {
    let i;
    let sum = 348;
    for (i = 0x8000; i > 0x8; i >>= 1) {
      sum += (lunarInfo[y - 1900] & i) ? 1 : 0;
    }
    return (sum + this.leapDays(y));
  }

  monthDays(y: number, m: number) {
    return ((lunarInfo[y - 1900] & (0x10000 >> m)) ? 30 : 29);
  }

  convert(): LeapDate {
    const { y, m, d } = this;
    if (y < 1900 || y > 2100 || (y === 1900 && !m && d < 31)) {
      throw Error('Date out of range');
    }

    let i;
    let temp = 0;
    let offset = (Date.UTC(y, m, d) - Date.UTC(1900, 0, 31)) / 86400000;
    for (i = 1900; i < 2101 && offset > 0; i++) {
      temp = this.lYearDays(i);
      offset -= temp;
    }
    if (offset < 0) {
      offset += temp;
      i -= 1;
    }

    const year = i; // 农历年
    const leap = this.leapMonth(i); // 闰哪个月

    let isLeap = false;
    for (i = 1; i < 13 && offset > 0; i++) {
      if (leap > 0 && i === (leap + 1) && !isLeap) { // 闰月
        i -= 1;
        isLeap = true;
        temp = this.leapDays(year); // 计算农历闰月天数
      } else {
        temp = this.monthDays(year, i);// 计算农历普通月天数
      }
      isLeap = !(isLeap && i === (leap + 1)); // 解除闰月
      offset -= temp;
    }

    if (!offset && leap > 0 && i === leap + 1) {
      isLeap = !isLeap;
      if (isLeap) i -= 1;
    }
    if (offset < 0) {
      offset += temp;
      i -= 1;
    }
    const month = i; // 农历月
    const day = offset + 1; // 农历日

    return { year, leap, month, day };
  }
}
