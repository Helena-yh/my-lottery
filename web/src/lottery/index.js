import "./index.css";
import "../css/animate.min.css";
import "./canvas.js";
import {
  setPrizes,
  showPrizeList,
  setPrizeData,
  resetPrize
} from "./prizeList";
import { NUMBER_MATRIX } from "./config.js";

const ROTATE_TIME = 5000;
var tweenTest;
let TOTAL_CARDS,
  btns = {
    enter: document.querySelector("#enter"),
    lotteryBar: document.querySelector("#lotteryBar")
  },
  prizes,
  EACH_COUNT,
  ROW_COUNT = 7,
  COLUMN_COUNT = 17,
  HIGHLIGHT_CELL = [],
  // 当前的比例
  Resolution = 1;
// let baseUrl = 'https://tools.rongcloud.cn/lottery';
let baseUrl = 'http://localhost:8090';
let camera,
  scene,
  renderer,
  controls,
  threeDCards = [],
  targets = {
    table: [],
    sphere: [],
    helix: []
  };

let selectedCardIndex = [],
  basicData = {
    originPrizes: [], //远端奖品信息
    prizes: [], //奖品信息 -- 附加抽奖会改变
    users: [], //所有人员
    luckyUsers: {}, //已中奖人员
    leftUsers: [] //未中奖人员
  },
  // 当前抽的奖项，从最低奖开始抽，直到抽到大奖
  currentPrizeIndex,
  currentPrize,
  // 正在抽奖
  isLotting = false,
  rotate = false,
  currentLuckys = [],
  //是否旋转
  isLotteryRotate = true; 

let blockUserList = ['邹岳', '董晗'];

initAll();

/**
 * 初始化所有DOM
 */
function initAll() {
  window.AJAX({
    url: baseUrl + "/getTempData",
    success(data) {
      // 获取基础数据
      prizes = data.cfgData.prizes;
      EACH_COUNT = data.cfgData.EACH_COUNT;
      HIGHLIGHT_CELL = createHighlight();
      basicData.originPrizes = JSON.stringify(prizes);
      basicData.prizes = prizes;
      setPrizes(prizes);

      TOTAL_CARDS = ROW_COUNT * COLUMN_COUNT;

      // 踢出指定人员
      for (let index = 0; index < blockUserList.length; index++) {
        const name = blockUserList[index];
        for (let i = 0; i < data.leftUsers.length; i++) {
          const user = data.leftUsers[i];
          if(user[1] == name){
            data.leftUsers.splice(i,1);
          }          
        }
      }
      
      // 读取当前已设置的抽奖结果
      basicData.leftUsers = data.leftUsers;
      basicData.luckyUsers = data.luckyData;

      let prizeIndex = basicData.prizes.length - 1;
      for (; prizeIndex > -1; prizeIndex--) {
        if (
          data.luckyData[prizeIndex] &&
          data.luckyData[prizeIndex].length >=
            basicData.prizes[prizeIndex].count
        ) {
          continue;
        }
        currentPrizeIndex = prizeIndex;
        currentPrize = basicData.prizes[currentPrizeIndex];
        break;
      }
      if(!currentPrizeIndex){
        currentPrizeIndex = 0;
        currentPrize = basicData.prizes[currentPrizeIndex]
      }
      // currentPrizeIndex = currentPrizeIndex ? currentPrizeIndex : 0;
      showPrizeList(currentPrizeIndex);
      let curLucks = basicData.luckyUsers[currentPrize.type];
      setPrizeData(currentPrizeIndex, curLucks ? curLucks.length : 0, true, data.luckyData);
    }
  });

  window.AJAX({
    url: baseUrl + "/getUsers",
    success(data) {
      // 踢出指定人员
      for (let index = 0; index < blockUserList.length; index++) {
        const name = blockUserList[index];
        for (let i = 0; i < data.length; i++) {
          const user = data[i];
          if(user[1] == name){
            data.splice(i,1);
          }          
        }
      }
      basicData.users = data;
      initCards();
      animate();
      shineCard();
    }
  });
}

function initCards() {
  let member = basicData.users,
    length = member.length;

  let isBold = false,
    showTable = basicData.leftUsers.length === basicData.users.length,
    index = 0,
    position = {
      x: (140 * COLUMN_COUNT - 20) / 2,
      y: (180 * ROW_COUNT - 20) / 2
    };

  camera = new THREE.PerspectiveCamera(
    40,
    window.innerWidth / window.innerHeight,
    1,
    10000
  );
  camera.position.z = 3000;

  scene = new THREE.Scene();

  for (let i = 0; i < ROW_COUNT; i++) {
    for (let j = 0; j < COLUMN_COUNT; j++) {
      isBold = HIGHLIGHT_CELL.includes(j + "-" + i);
      var element = createCard(
        member[index % length],
        isBold,
        index,
        showTable
      );

      var object = new THREE.CSS3DObject(element);
      object.position.x = Math.random() * 4000 - 2000;
      object.position.y = Math.random() * 4000 - 2000;
      object.position.z = Math.random() * 4000 - 2000;
      scene.add(object);
      threeDCards.push(object);
      //

      var object = new THREE.Object3D();
      object.position.x = j * 140 - position.x;
      object.position.y = -(i * 180) + position.y;
      targets.table.push(object);
      index++;
    }
  }

  var vector = new THREE.Vector3();

  for ( var i = 0, l = threeDCards.length; i < l; i ++ ) {
      var phi = i * 0.175 + Math.PI;
      var object = new THREE.Object3D();
      object.position.x = 900 * Math.sin( phi );
      object.position.y = - ( i * 8 ) + 450;
      object.position.z = 900 * Math.cos( phi );

      vector.x = object.position.x * 2;
      vector.y = object.position.y;
      vector.z = object.position.z * 2;

      object.lookAt( vector );
      targets.helix.push( object );
  }

  renderer = new THREE.CSS3DRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById("container").appendChild(renderer.domElement);

  //

  controls = new THREE.TrackballControls(camera, renderer.domElement);
  controls.rotateSpeed = 0.5;
  controls.minDistance = 500;
  controls.maxDistance = 6000;
  controls.addEventListener("change", render);

  bindEvent();

  if (showTable) {
    switchScreen("enter");
  } else {
    switchScreen("lottery");
  }
}

function setLotteryStatus(status = false) {
  isLotting = status;
}

/**
 * 事件绑定
 */
function bindEvent() {
  document.querySelector("#menu").addEventListener("click", function (e) {
    e.stopPropagation();
    // 如果正在抽奖，则禁止一切操作
    if (isLotting) {
      // addQipao("抽慢一点点～～");
      return false;
    }

    let target = e.target.id;
    switch (target) {
      // 显示数字墙
      case "welcome":
        switchScreen("enter");
        rotate = false;
        break;
      // 进入抽奖
      case "enter":
        removeHighlight();
        rotate = true;
        switchScreen("lottery");
        //shine
        document.getElementById('prize-item-' + (currentPrizeIndex)).classList.add('shine') 
        break;
      // 重置
      case "reset":
        let doREset = window.confirm(
          "是否确认重置数据，重置后，当前已抽的奖项全部清空？"
        );
        if (!doREset) {
          return;
        }
        reset();
        // addQipao("重置所有数据，重新抽奖");
        addHighlight();
        resetCard();
        // 重置所有数据
        currentLuckys = [];
        basicData.leftUsers = Object.assign([], basicData.users);
        basicData.luckyUsers = {};
        basicData.prizes = JSON.parse(basicData.originPrizes);
        setPrizes(basicData.prizes);

        currentPrizeIndex = basicData.prizes.length - 1;
        currentPrize = JSON.parse(basicData.originPrizes)[currentPrizeIndex];
        
        resetPrize(currentPrizeIndex);
        switchScreen("enter");
        break;
      // 抽奖
      case "start":
        if(isLotteryRotate){
         
          // 每次抽奖前先保存上一次的抽奖数据
          if(saveData('lottery')){
            isLotteryRotate = false;
            //更新剩余抽奖数目的数据显示
            changePrize('lottery');

            resetCard().then(res => {
              //旋转开始
              rotateAll()
              document.getElementById('start').innerHTML = '停止';
            });
          };
        }else{
          setLotteryStatus(true);
          // 抽奖
          lottery('lottery');
          document.getElementById('start').innerHTML = '开始';
          isLotteryRotate = true;
        }
        break;
      // 重新抽奖
      case "reLottery":
        if (currentLuckys.length === 0) {
          // addQipao(`当前还没有抽奖，无法重新抽取喔~~`);
          return;
        }
        if(isLotteryRotate){
          
          // 每次抽奖前先保存上一次的抽奖数据
          setLotteryStatus(false);
          basicData.prizes[currentPrizeIndex].count = basicData.prizes[currentPrizeIndex].count + 1;
          if(saveData()){
            isLotteryRotate = false;
            //更新剩余抽奖数目的数据显示
            changePrize('reLottery');          
            resetCard().then(res => {
              //旋转开始
              rotateAll()
              document.getElementById('reLottery').innerHTML = '停止';
            });
          }
        }else{
          setLotteryStatus(true);
          // 抽奖
          lottery('reLottery');
          document.getElementById('reLottery').innerHTML = '附加抽奖 1 次';
          isLotteryRotate = true;
        }
        break;
      // 导出抽奖结果
      case "save":
        saveData().then(res => {
          resetCard().then(res => {
            currentLuckys = [];
          });
          exportData();
        });
        break;
       // 关闭抽奖结果展示
       case "close":
          resetCard().then(res => { });
        break;
    }
  });

  window.addEventListener("resize", onWindowResize, false);
}

function switchScreen(type) {
  switch (type) {
    case "enter":
      btns.enter.classList.remove("none");
      btns.lotteryBar.classList.add("none");
      transform(targets.table, 1000);
      break;
    default:
      btns.enter.classList.add("none");
      btns.lotteryBar.classList.remove("none");
      transform(targets.helix, 1000);
      break;
  }
}

/**
 * 创建元素
 */
function createElement(css, text) {
  let dom = document.createElement("div");
  dom.className = css || "";
  dom.innerHTML = text || "";
  return dom;
}

/**
 * 创建名牌
 */
function createCard(user, isBold, id, showTable) {
  var element = createElement();
  element.id = "card-" + id;

  if (isBold) {
    element.className = "element lightitem";
    if (showTable) {
      element.classList.add("highlight");
    }
  } else {
    element.className = "element";
    element.style.backgroundColor =
      "rgba(0,127,127," + (Math.random() * 0.7 + 0.25) + ")";
  }
  let img = document.createElement("img")
  img.src = user[0];
  img.className = 'avatar';
  element.appendChild(img);
  element.appendChild(createElement("name", user[1]));
  return element;
}

function removeHighlight() {
  document.querySelectorAll(".highlight").forEach(node => {
    node.classList.remove("highlight");
  });
}

function addHighlight() {
  document.querySelectorAll(".lightitem").forEach(node => {
    node.classList.add("highlight");
  });
}

/**
 * 渲染地球等
 */
function transform(targets, duration) {
  for (var i = 0; i < threeDCards.length; i++) {
    var object = threeDCards[i];
    var target = targets[i];

    new TWEEN.Tween(object.position)
      .to(
        {
          x: target.position.x,
          y: target.position.y,
          z: target.position.z
        },
        Math.random() * duration + duration
      )
      .easing(TWEEN.Easing.Exponential.InOut)
      .start();

    new TWEEN.Tween(object.rotation)
      .to(
        {
          x: target.rotation.x,
          y: target.rotation.y,
          z: target.rotation.z
        },
        Math.random() * duration + duration
      )
      .easing(TWEEN.Easing.Exponential.InOut)
      .start();
  }

  new TWEEN.Tween(this)
    .to({}, duration * 2)
    .onUpdate(render)
    .start();
}
function rotateAll() {
  scene.rotation.y = 0;
  tweenTest = new TWEEN.Tween(scene.rotation)
    .to({y: Math.PI * 1000},
      ROTATE_TIME * 100
    )
    .onUpdate(render)
    .start()
}

function rotateBall() {
  TWEEN.remove(tweenTest)
  return new Promise((resolve, reject) => {
    scene.rotation.y = 0;
    new TWEEN.Tween(scene.rotation)
      .to({y: Math.PI*2},
        200
      )
      .onUpdate(render)
      .easing(TWEEN.Easing.Exponential.InOut)
      .start()
      .onComplete(() => {
        resolve();
      });
  });
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  render();
}

function animate() {
  requestAnimationFrame(animate);
  TWEEN.update();
  controls.update();
}

function render() {
  renderer.render(scene, camera);
}

function selectCard(duration = 600) {
  rotate = false;
  let width = 140,
    tag = -(currentLuckys.length - 1) / 2,
    locates = [];

  // 计算位置信息, 大于5个分两排显示
  if (currentLuckys.length > 5) {
    let yPosition = [-87, 87],
      l = selectedCardIndex.length,
      mid = Math.ceil(l / 2);
    tag = -(mid - 1) / 2;
    for (let i = 0; i < mid; i++) {
      locates.push({
        x: tag * width * Resolution,
        y: yPosition[0] * Resolution
      });
      tag++;
    }

    tag = -(l - mid - 1) / 2;
    for (let i = mid; i < l; i++) {
      locates.push({
        x: tag * width * Resolution,
        y: yPosition[1] * Resolution
      });
      tag++;
    }
  } else {
    for (let i = selectedCardIndex.length; i > 0; i--) {
      locates.push({
        x: tag * width * Resolution,
        y: 0 * Resolution
      });
      tag++;
    }
  }

  // let text = currentLuckys.map(item => item[1]);
  selectedCardIndex.forEach((cardIndex, index) => {
    console.info(currentLuckys,currentLuckys[index])
    changeCard(cardIndex, currentLuckys[index]);
    var object = threeDCards[cardIndex];
    new TWEEN.Tween(object.position)
      .to(
        {
          x: locates[index].x,
          y: locates[index].y * Resolution,
          z: 2200
        },
        Math.random() * duration + duration
      )
      .easing(TWEEN.Easing.Exponential.InOut)
      .start();

    new TWEEN.Tween(object.rotation)
      .to(
        {
          x: 0,
          y: 0,
          z: 0
        },
        Math.random() * duration + duration
      )
      .easing(TWEEN.Easing.Exponential.InOut)
      .start();

    object.element.classList.add("prize");
    tag++;
  });

  new TWEEN.Tween(this)
    .to({}, duration * 2)
    .onUpdate(render)
    .start()
    .onComplete(() => {
      // 动画结束后可以操作
      setLotteryStatus();
    });
}

/**
 * 重置抽奖牌内容
 */
function resetCard(duration = 500) {
  if (currentLuckys.length === 0) {
    return Promise.resolve();
  }

  selectedCardIndex.forEach(index => {
    let object = threeDCards[index],
      target = targets.helix[index];
      // target = targets.sphere[index];

    new TWEEN.Tween(object.position)
      .to(
        {
          x: target.position.x,
          y: target.position.y,
          z: target.position.z
        },
        Math.random() * duration + duration
      )
      .easing(TWEEN.Easing.Exponential.InOut)
      .start();

    new TWEEN.Tween(object.rotation)
      .to(
        {
          x: target.rotation.x,
          y: target.rotation.y,
          z: target.rotation.z
        },
        Math.random() * duration + duration
      )
      .easing(TWEEN.Easing.Exponential.InOut)
      .start();
  });

  return new Promise((resolve, reject) => {
    new TWEEN.Tween(this)
      .to({}, duration * 2)
      .onUpdate(render)
      .start()
      .onComplete(() => {
        selectedCardIndex.forEach(index => {
          let object = threeDCards[index];
          object.element.classList.remove("prize");
        });
        resolve();
      });
  });
}

/**
 * 抽奖
 */
function lottery(lotteryFlag) { //lotteryFlag : 'lottery','reLottery'
  rotateBall().then(() => {
    // 将之前的记录置空
    currentLuckys = [];
    selectedCardIndex = [];
  
    // 当前同时抽取的数目,当前奖品抽完还可以继续抽，但是不记录数据
    let perCount,
      luckyData = basicData.luckyUsers[currentPrize.type],
      leftCount = basicData.leftUsers.length,
      leftPrizeCount = currentPrize.count - (luckyData ? luckyData.length : 0);
      perCount = lotteryFlag == 'lottery' ? EACH_COUNT[currentPrizeIndex] : 1; //如果正常抽奖读取后台库获取抽奖个数，如果是重新抽奖则仅抽取 1 个
    if (leftCount <= 0) {
      // addQipao("人员已抽完，现在重新设置所有人员可以进行二次抽奖！");
      console.info('人员已消耗完成')
      return;
    }

    for (let i = 0; i < perCount; i++) {
      let luckyId = random(leftCount);
      currentLuckys.push(basicData.leftUsers.splice(luckyId, 1)[0]);
      leftCount--;
      leftPrizeCount--;

      let cardIndex = random(TOTAL_CARDS);
      while (selectedCardIndex.includes(cardIndex)) {
        cardIndex = random(TOTAL_CARDS);
      }
      selectedCardIndex.push(cardIndex);

      if (leftPrizeCount === 0) {
        break;
      }
    }
    selectCard(); 

    let type = currentPrize.type,
      curLucky = basicData.luckyUsers[type] || [];
    curLucky = curLucky.concat(currentLuckys);
    basicData.luckyUsers[type] = curLucky;
    if (currentLuckys.length > 0) {
      // todo by xc 添加数据保存机制，以免服务器挂掉数据丢失
      return setData(type, currentLuckys);
    }

  });
}

/**
 * 保存上一次的抽奖结果
 */
function saveData(lotteryFlag) {
  if (!currentPrize) {
    //若奖品抽完，则不再记录数据，但是还是可以进行抽奖
    return false;
  }

  let type = currentPrize.type,
    curLucky = basicData.luckyUsers[type] || [];

  if(lotteryFlag == 'lottery'){
    if (currentPrize.count <= curLucky.length) {
      currentPrizeIndex--;
      if (currentPrizeIndex <= -1) {
        let isReset = window.confirm("本轮抽奖一结束，是否要重置抽奖结果！");
        if(isReset){
          document.getElementById('reset').click();
        }
        return false;
      }
      currentPrize = basicData.prizes[currentPrizeIndex];
    }
  }

  return Promise.resolve();
}

function changePrize(lotteryFlag) {
  let luckys = basicData.luckyUsers[currentPrize.type];
  let addCount = lotteryFlag == 'lottery' ? EACH_COUNT[currentPrizeIndex] : 1;
  let luckyCount = (luckys ? luckys.length : 0) + addCount;
  // 修改左侧prize的数目和百分比
  setPrizeData(currentPrizeIndex, luckyCount);
}

/**
 * 随机抽奖
 */
function random(num) {
  // Math.floor取到0-num-1之间数字的概率是相等的
  return Math.floor(Math.random() * num);
}

/**
 * 切换名牌人员信息
 */
function changeCard(cardIndex, user) {
  let card = threeDCards[cardIndex].element;
  card.innerHTML = `<img class='avatar' src='${user[0]}'/>
    <div class="name">${
    user[1]
  }</div>`;
}

/**
 * 切换名牌背景
 */
function shine(cardIndex, color) {
  let card = threeDCards[cardIndex].element;
  card.style.backgroundColor =
    color || "rgba(0,127,127," + (Math.random() * 0.7 + 0.25) + ")";
}

/**
 * 随机切换背景和人员信息
 */
function shineCard() {
  let maxCard = 10,
    maxUser;
  let shineCard = 10 + random(maxCard);

  setInterval(() => {
    // 正在抽奖停止闪烁
    if (isLotting) {
      return;
    }
    maxUser = basicData.leftUsers.length;
    for (let i = 0; i < shineCard; i++) {
      let index = random(maxUser),
        cardIndex = random(TOTAL_CARDS);
      // 当前显示的已抽中名单不进行随机切换
      if (selectedCardIndex.includes(cardIndex)) {
        continue;
      }
      shine(cardIndex);
      changeCard(cardIndex, basicData.leftUsers[index]);
    }
  }, 5000);
}

function setData(type, data) {
  return new Promise((resolve, reject) => {
    window.AJAX({
      url: baseUrl + "/saveData",
      data: {
        type,
        data
      },
      success() {
        resolve();
      },
      error() {
        reject();
      }
    });
  });
}

function exportData() {
  window.AJAX({
    url: baseUrl + "/export",
    success(data) {
      if (data.type === "success") {
        location.href = baseUrl + '/server/' + data.url;
      }
    }
  });
}

function reset() {
  window.AJAX({
    url: baseUrl + "/reset",
    success(data) {
      console.log("重置成功");
    }
  });
}

function createHighlight() {
  let year = new Date().getFullYear() + "";
  let step = 4,
    xoffset = 1,
    yoffset = 1,
    highlight = [];

  year.split("").forEach(n => {
    highlight = highlight.concat(
      NUMBER_MATRIX[n].map(item => {
        return `${item[0] + xoffset}-${item[1] + yoffset}`;
      })
    );
    xoffset += step;
  });

  return highlight;
}

let onload = window.onload;

window.onload = function () {
  onload && onload();

  let music = document.querySelector("#music");

  let rotated = 0,
    stopAnimate = false,
    musicBox = document.querySelector("#musicBox");

  function animate() {
    requestAnimationFrame(function () {
      if (stopAnimate) {
        return;
      }
      rotated = rotated % 360;
      musicBox.style.transform = "rotate(" + rotated + "deg)";
      rotated += 1;
      animate();
    });
  }

  musicBox.addEventListener("click", (e) => {
    if (music.paused) {
      music.play().then(() => {
        stopAnimate = false;
        animate();
      });
    } else {
      music.pause();
      stopAnimate = true;
    }
  },false);

  setTimeout(function () {
    musicBox.click();
  }, 1000);
};
