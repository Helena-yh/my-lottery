let defaultType = 0;

let prizes;

let prizeElement = {},
  lasetPrizeIndex = 0;

function setPrizes(pri) {
  prizes = pri;
  lasetPrizeIndex = pri.length - 1;
}

function showPrizeList(currentPrizeIndex) {
  let currentPrize = prizes[currentPrizeIndex]; //${item.type == currentPrize.type ? "shine" : ""}
  let htmlCode = `<div class="prize-mess">正在抽取<label id="prizeType" class="prize-shine">${currentPrize.text}</label><label id="prizeText" class="prize-shine">${currentPrize.title}</label>，剩余<label id="prizeLeft" class="prize-shine">${currentPrize.count}</label>个</div><ul class="prize-list">`;
  prizes.forEach(item => {
    htmlCode += `<li id="prize-item-${item.type}" class="prize-item">
                  <span></span><span></span><span></span><span></span>
                  <div class="prize-img">
                    <img src="${item.img}">
                  </div>
                  <div class="prize-text">
                    <h5 class="prize-title">${item.text} ${item.title}</h5>
                    <div class="prize-count">
                      <div class="progress">
                        <div id="prize-bar-${item.type}" class="progress-bar progress-bar-danger progress-bar-striped active" style="width: 100%;"></div>
                      </div>
                      <div id="prize-count-${item.type}" class="prize-count-left">${item.count + "/" + item.count}</div>
                    </div>
                  </div>
              </li>`;});
  htmlCode += `</ul>`;

  document.querySelector("#prizeBar").innerHTML = htmlCode;
}

function resetPrize(currentPrizeIndex) {
  prizeElement = {};
  lasetPrizeIndex = currentPrizeIndex;
  showPrizeList(currentPrizeIndex);
}

let setPrizeData = (function () {
  return function (currentPrizeIndex, count, isInit, luckyData) {
    let currentPrize = prizes[currentPrizeIndex],
      type = currentPrize.type,
      elements = prizeElement[type],
      totalCount = currentPrize.count;

    if (!elements) {
      elements = {
        box: document.querySelector(`#prize-item-${type}`),
        bar: document.querySelector(`#prize-bar-${type}`),
        text: document.querySelector(`#prize-count-${type}`)
      };
      prizeElement[type] = elements;
    }

    if (!prizeElement.prizeType) {
      prizeElement.prizeType = document.querySelector("#prizeType");
      prizeElement.prizeLeft = document.querySelector("#prizeLeft");
      prizeElement.prizeText = document.querySelector("#prizeText");
    }

    if (isInit) {
      for (let i = prizes.length - 1; i > currentPrizeIndex; i--) {
        let type = prizes[i]["type"];
        document.querySelector(`#prize-item-${type}`).className =
          "prize-item done";
        document.querySelector(`#prize-bar-${type}`).style.width = "0";
        document.querySelector(`#prize-count-${type}`).textContent =
          "0" + "/" + prizes[i]["count"];
      }
    }

    if (lasetPrizeIndex !== currentPrizeIndex) {
      let lastPrize = prizes[lasetPrizeIndex],
        lastBox = document.querySelector(`#prize-item-${lastPrize.type}`);
      lastBox.classList.remove("shine");
      lastBox.classList.add("done");
      elements.box && elements.box.classList.add("shine");
      prizeElement.prizeType.textContent = currentPrize.text;
      prizeElement.prizeText.textContent = currentPrize.title;

      lasetPrizeIndex = currentPrizeIndex;
    }

    count = totalCount - count;
    count = count < 0 ? 0 : count;
    let percent = (count / totalCount).toFixed(2);
    elements.bar && (elements.bar.style.width = percent * 100 + "%");
    elements.text && (elements.text.textContent = count + "/" + totalCount);
    prizeElement.prizeLeft.textContent = count;
  };
})();

export {
  showPrizeList,
  setPrizeData,
  setPrizes,
  resetPrize,
};
