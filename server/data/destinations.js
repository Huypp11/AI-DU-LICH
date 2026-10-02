// Vector đặc trưng 0..1 do nhóm tự chấm (ghi rõ nguồn/tiêu chí trong báo cáo).
export const FEATURES = ['beach','culture','nature','food','adventure','relax','nightlife','romantic','family'];
export const FEATURE_LABELS = { beach:'biển', culture:'văn hóa', nature:'thiên nhiên', food:'ẩm thực', adventure:'khám phá/mạo hiểm', relax:'nghỉ dưỡng', nightlife:'về đêm', romantic:'lãng mạn', family:'gia đình' };

const d = (id, name, cost, months, pop, v) => ({ id, name, costPerDay: cost, bestMonths: months, popularity: pop,
  f: Object.fromEntries(FEATURES.map((k, i) => [k, v[i]])) });
//                                        biển văn  thiên ăn  mạo  nghỉ đêm lãng gđ
export const DESTINATIONS = [
  d('phu-quoc','Phú Quốc',1800000,[11,12,1,2,3,4],.9,[.95,.2,.6,.6,.4,.9,.4,.9,.8]),
  d('hoi-an','Hội An',1300000,[2,3,4,5],.9,[.5,.95,.4,.9,.2,.7,.5,.95,.6]),
  d('da-nang','Đà Nẵng',1400000,[2,3,4,5,6,7,8],.95,[.9,.5,.6,.85,.4,.7,.7,.7,.85]),
  d('ha-noi','Hà Nội',1000000,[9,10,11,3,4],.95,[0,.95,.2,.95,.1,.4,.7,.6,.6]),
  d('sa-pa','Sa Pa',1100000,[3,4,5,9,10,11],.8,[0,.6,.95,.6,.8,.7,.1,.7,.4]),
  d('ha-long','Hạ Long',1500000,[4,5,6,9,10,11],.85,[.5,.4,.85,.6,.5,.8,.3,.8,.7]),
  d('ninh-binh','Ninh Bình',900000,[1,2,3,5,6],.75,[0,.7,.9,.5,.5,.8,.1,.8,.6]),
  d('da-lat','Đà Lạt',1000000,[11,12,1,2,3],.9,[0,.5,.85,.7,.6,.85,.4,.95,.7]),
  d('nha-trang','Nha Trang',1400000,[1,2,3,4,5,6,7,8],.85,[.95,.4,.5,.7,.6,.7,.8,.6,.85]),
  d('hue','Huế',900000,[1,2,3,4],.7,[0,.95,.4,.8,.1,.7,.2,.7,.5]),
  d('ha-giang','Hà Giang',800000,[9,10,11,3,4],.7,[0,.6,.95,.5,.95,.4,.1,.5,.2]),
  d('vung-tau','Vũng Tàu',900000,[11,12,1,2,3,4],.7,[.7,.2,.3,.6,.2,.5,.5,.4,.8]),
  d('mui-ne','Mũi Né',1000000,[11,12,1,2,3,4],.7,[.85,.3,.5,.6,.85,.6,.3,.6,.5]),
  d('tp-hcm','TP. Hồ Chí Minh',1200000,[12,1,2,3,4],.9,[0,.7,.1,.95,.2,.3,.95,.4,.6]),
  d('con-dao','Côn Đảo',2200000,[2,3,4,5,6,7,8,9],.6,[.85,.7,.8,.4,.5,.9,.1,.85,.5]),
];
