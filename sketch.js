let capture;
let facemesh;
let predictions = [];

function setup() {
  // 建立全螢幕畫布
  createCanvas(windowWidth, windowHeight);
  // 擷取攝影機影像
  capture = createCapture(VIDEO, function(stream) {
    console.log("攝影機已成功啟動");
  });
  // 處理攝影機啟動失敗的情況
  capture.elt.onerror = (err) => {
    console.error("攝影機啟動失敗：", err);
  };

  // 隱藏預設產生的 HTML 影片物件，避免重複顯示
  capture.hide();

  // 檢查 ml5 是否已定義
  if (typeof ml5 === 'undefined') {
    console.error("錯誤：ml5 函式庫未載入，請檢查 index.html 是否正確引入腳本。");
    return;
  }

  // 初始化 Facemesh 模型
  facemesh = ml5.facemesh(capture, () => console.log("Facemesh Model Ready"));
  
  // 當偵測到臉部特徵時，更新預測結果
  facemesh.on("predict", results => {
    predictions = results;
  });
}

function draw() {
  // 設定背景顏色為 e7c6ff
  background('#e7c6ff');

  // 影像顯示寬高為畫布寬高的 50%
  let w = width * 0.5;
  let h = height * 0.5;
  let x = (width - w) / 2;
  let y = (height - h) / 2;

  // 顯示文字：教科413730093
  fill(0); // 設定文字顏色為黑色
  textSize(32); // 設定字體大小
  textAlign(CENTER, CENTER); // 設定文字水平與垂直皆置中
  text("教科413730093", width / 2, y / 2); // 顯示在影像上方的空白處

  push();
  // 左右顛倒處理：先平移到畫布最右側，再將 X 軸翻轉
  translate(width, 0);
  scale(-1, 1);

  // 繪製影像，計算出的座標在鏡像座標系下依然能保持置中
  image(capture, x, y, w, h);

  // 如果偵測到臉部，繪製指定的特徵線條
  if (predictions.length > 0) {
    let face = predictions[0].scaledMesh;
    
    // 紅色細線：嘴唇與內眼圈
    let redPaths = [
      [409, 270, 269, 267, 0, 37, 39, 40, 185, 61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291], 
      [76, 77, 90, 180, 85, 16, 315, 404, 320, 307, 306, 408, 304, 303, 302, 11, 72, 73, 74, 184],
      [246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7, 33, 246],
      [466, 388, 387, 386, 385, 384, 398, 362, 382, 381, 380, 374, 373, 390, 249, 263, 466]
    ];
    
    // 黑眼圈部分：眼睛外圈
    let eyeDarkPaths = [
      [247, 30, 29, 27, 28, 56, 190, 243, 112, 26, 22, 23, 24, 110, 25, 130, 247],
      [467, 260, 259, 257, 258, 286, 414, 463, 341, 256, 252, 253, 254, 339, 255, 359, 467]
    ];

    // 臉部最外層輪廓路徑
    let silhouette = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10];

    // 1. 繪製背景遮罩：填滿臉部以外的區域
    noStroke();
    fill('#fdf0d5');
    beginShape();
    // 外部大矩形 (涵蓋整個畫布空間)
    vertex(0, 0);
    vertex(width, 0);
    vertex(width, height);
    vertex(0, height);
    // 內部臉部輪廓 (挖洞)
    beginContour();
    for (let i = 0; i < silhouette.length; i++) {
      let p = face[silhouette[i]];
      let vx = map(p[0], 0, capture.width, x, x + w);
      let vy = map(p[1], 0, capture.height, y, y + h);
      vertex(vx, vy);
    }
    endContour();
    endShape(CLOSE);

    // 繪製紅色細線
    stroke(255, 0, 0); // 設定線條為紅色
    strokeWeight(1);   // 設定線條粗細為 1
    for (let indices of redPaths) {
      for (let i = 0; i < indices.length - 1; i++) {
        let p1 = face[indices[i]];
        let p2 = face[indices[i + 1]];

        // 將原始影像座標對應到畫布上的顯示區域
        let x1 = map(p1[0], 0, capture.width, x, x + w);
        let y1 = map(p1[1], 0, capture.height, y, y + h);
        let x2 = map(p2[0], 0, capture.width, x, x + w);
        let y2 = map(p2[1], 0, capture.height, y, y + h);

        line(x1, y1, x2, y2);
      }
    }

    // 繪製黑眼圈 (深灰色粗線)
    stroke(50, 50, 50); // 深灰色
    strokeWeight(15);   // 粗細改為 15
    for (let indices of eyeDarkPaths) {
      for (let i = 0; i < indices.length - 1; i++) {
        let p1 = face[indices[i]];
        let p2 = face[indices[i + 1]];

        let x1 = map(p1[0], 0, capture.width, x, x + w);
        let y1 = map(p1[1], 0, capture.height, y, y + h);
        let x2 = map(p2[0], 0, capture.width, x, x + w);
        let y2 = map(p2[1], 0, capture.height, y, y + h);

        line(x1, y1, x2, y2);
      }
    }

    // 繪製螢光藍臉部輪廓
    stroke(0, 243, 255); // 設定線條為螢光藍色
    strokeWeight(2);   // 設定線條粗細為 2
    for (let i = 0; i < silhouette.length - 1; i++) {
      let p1 = face[silhouette[i]];
      let p2 = face[silhouette[i + 1]];

      let x1 = map(p1[0], 0, capture.width, x, x + w);
      let y1 = map(p1[1], 0, capture.height, y, y + h);
      let x2 = map(p2[0], 0, capture.width, x, x + w);
      let y2 = map(p2[1], 0, capture.height, y, y + h);

      line(x1, y1, x2, y2);
    }
  }
  pop();
}

function windowResized() {
  // 當瀏覽器視窗大小改變時，重新調整畫布尺寸
  resizeCanvas(windowWidth, windowHeight);
}
