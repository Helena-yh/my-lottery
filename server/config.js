/**
 * 奖品设置
 * type: 唯一标识，0是默认特别奖的占位符，其它奖品不可使用
 * count: 奖品数量
 * title: 奖品描述
 * text: 奖品标题
 * img: 图片地址
 */
const prizes = [
  {
    type: 0,
    count: 2,
    text: "一等奖",
    title: "Mac Air",
    img: "./img/secrit.jpg"
  },
  {
    type: 1,
    count: 4,
    text: "二等奖",
    title: "小米电视机",
    img: "./img/test.jpg"
  },
  {
    type: 2,
    count: 6,
    text: "三等奖",
    title: "吸尘器 / 游戏机",
    img: "./img/2.png"
  },
  {
    type: 3,
    count: 12,
    text: "四等奖",
    title: "云台 / 华为 WATCH",
    img: "./img/3.png"
  }
];

/**
 * 一次抽取的奖品个数与prizes对应
 */
const EACH_COUNT = [ 1, 2, 5, 6];

/**
 * 卡片公司名称标识
 */

module.exports = {
  prizes,
  EACH_COUNT,
  SERVER_PORT: '8586',
  DB_NAME: 'lottery',
  DB_USER: 'root',
  DB_PASSWORD: '123456',
  DB_HOST: '127.0.0.1',
  DB_PORT: '3306',
  API_LIMITED_TIME: 10,
  API_LIMITED_COUNT: 50
};
