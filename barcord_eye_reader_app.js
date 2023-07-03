const barcodeDetector = new BarcodeDetector();

// streamを入力するvideoを作成する
const image = document.createElement("video");

// 検出と加工する非表示のcanvasを作成する
const offscreen_canvas = document.createElement("canvas");
const offscreen_context = offscreen_canvas.getContext("2d");

// 最終的に取得した画像を表示するcanvasを取得する
const canvas = document.querySelector("#result");
const context = canvas.getContext("2d");

//カメラと中間処理のキャンバスのサイズを最終的に表示するキャンバスを基準に設定
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

offscreen_canvas.width = canvas.width;
image.videoWidth = canvas.width;
offscreen_canvas.height = canvas.height;
image.videoHeight = canvas.height;

window.onload = async () => {
  //カメラを取得
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: { exact: "environment" },
    },
  });

  //オブジェクトと関連付ける
  image.srcObject = stream;
  image.play();

  //バーコードの解析処理自体の実行
  analysis();
};

const analysis = async () => {
  //カメラの入力をCanvasに書き込む
  offscreen_context.drawImage(image, 0, 0, canvas.width, canvas.height);

  let code = null;

  try {
    code = await barcodeDetector.detect(offscreen_canvas);
  } catch (e) {
    console.log(e);
  }

  let state = true;

  if (code == null) {
    state = false;
  }
  if (state == true && code.length == 0) {
    state = false;
  }

  //バーコードの値が取れていた場合、赤い線で囲む
  if (state) {
    //バーコードを囲む処理
    offscreen_context.strokeStyle = "rgb(255, 100, 100) ";
    offscreen_context.lineWidth = 10;
    offscreen_context.beginPath(
      code[0].cornerPoints[0].x,
      code[0].cornerPoints[0].y
    );
    offscreen_context.lineTo(
      code[0].cornerPoints[1].x,
      code[0].cornerPoints[1].y
    );
    offscreen_context.lineTo(
      code[0].cornerPoints[2].x,
      code[0].cornerPoints[2].y
    );
    offscreen_context.lineTo(
      code[0].cornerPoints[3].x,
      code[0].cornerPoints[3].y
    );
    offscreen_context.lineTo(
      code[0].cornerPoints[0].x,
      code[0].cornerPoints[0].y
    );
    offscreen_context.closePath();
    offscreen_context.stroke();

    //バーコードから取得した文字列の表示前加工
    //バーコードを囲んだ四角の中に文字列が収まるように、収まる文字数と改行の回数を計算する
    const w = code[0].boundingBox.width - 20;
    const split_chr_count = Math.floor(w / 25);
    const split_loop_count = Math.ceil(
      code[0].rawValue.length / split_chr_count
    );

    let viewertext = [];
    for (let i = 0; i < split_loop_count; i++) {
      if (code[0].rawValue.length > i * split_chr_count) {
        const a = code[0].rawValue.substr(i * split_chr_count, split_chr_count);
        viewertext.push(
          `${code[0].rawValue.substr(i * split_chr_count, split_chr_count)}\n`
        );
      } else {
        const a = code[0].rawValue.substr(
          i * split_chr_count,
          code[0].rawValue.length - 1
        );
        viewertext.push(
          `${code[0].rawValue.substr(
            i * split_chr_count,
            code[0].rawValue.length - 1
          )}`
        );
      }
    }
    offscreen_context.fillStyle = "rgb(255, 100, 100) ";
    offscreen_context.font = "bold 50px Times Roman";
    offscreen_context.textAlign = "start";

    viewertext.forEach((text, index) => {
      offscreen_context.fillText(
        text,
        code[0].cornerPoints[0].x + 10,
        code[0].cornerPoints[0].y + 50 * (index + 1)
      );
    });
  }

  context.drawImage(offscreen_canvas, 0, 0, canvas.width, canvas.height);
  window.requestAnimationFrame(analysis);
};
