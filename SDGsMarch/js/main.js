      "use strict";

      let ctx; // 描画コンテキスト
      let engine; // 物理エンジン
      let SDGs = []; // SDGsを格納する配列
      let timer = NaN; // タイマー
      let startTime = NaN; //  ゲーム開始時刻
      let elapsed = 0; // 経過時間
      let score = 0; // スコア
      let walls = [
        [-60, -100, 100, 800],
        [500, -100, 100, 800],
        [-60, 520, 700, 100],
      ]; // 壁（左右底）のx, y, w, h座標
      let images = []; // SDGsの画像を格納する配列

      function rand(v) {
        return Math.floor(Math.random() * v);
      }

      // エンジン初期化 & Canvas初期化
      function init() {
        let canvas = document.getElementById("canvas");
        ctx = canvas.getContext("2d");
        ctx.font = "20pt Arial";
        ctx.strokeStyle = "blue";
        ctx.lineWidth = 5;
        ctx.textAlign = "center";

        engine = new Engine(-100, -100, 700, 700, 0, 9.8);

        // 壁
        walls.forEach(function (w) {
          let r = new RectangleEntity(w[0], w[1], w[2], w[3]);
          r.color = "gray";
          engine.entities.push(r);
        });

        // SDGs
        for (let i = 0; i < 8; i++) {
          for (let j = 0; j < 10; j++) {
            let x = i * 60 + 75 + rand(5);
            let y = j * 50 + 50 + rand(5);
            let r = new CircleEntity(x, y, 25, BodyDynamic, 1, 0.98);
            r.color = rand(5);
            engine.entities.push(r);
          }
        }

        for (let i = 0; i < 5; i++) {
          images.push(document.getElementById("SDGs" + i)); // SDGs画像を配列に格納
        }

        repaint();
      }

      function go() {
        // キャンバスにイベントハンドラ登録
        let canvas = document.getElementById("canvas");
        canvas.onmousedown = mymousedown;
        canvas.onmousemove = mymousemove;
        canvas.onmouseup = mymouseup;
        canvas.addEventListener("touchstart", mymousedown);
        canvas.addEventListener("touchmove", mymousemove);
        canvas.addEventListener("touchend", mymouseup);

        document.body.addEventListener(
          "touchmove",
          function (event) {
            event.preventDefault();
          },
          false
        );  // タッチ時のコンテキストメニュー非表示に
        document.getElementById("START").style.display = "none";
        document.getElementById("bgm").play();

        startTime = new Date();
        timer = setInterval(tick, 50);
      }

      // メインループ
      function tick() {
        engine.step(0.01); // 物理エンジンの時刻を進める

        elapsed = (new Date().getTime() - startTime) / 1000;
        if (elapsed > 57) {
          clearInterval(timer); // 57秒でタイムアップ
          timer = NaN;
        }
        repaint(); // 再描画
      }

      // マウス押下時の処理
      function mymousedown(evt) {
        let x = !isNaN(evt.offsetX) ? evt.offsetX : evt.touches[0].clientX; // マウス押下x座標
        let y = !isNaN(evt.offsetY) ? evt.offsetY : evt.touches[0].clientY; // マウス押下y座標
        engine.entities.forEach(function (e) {
          if (e.isHit(x, y) && e.shape == ShapeCircle) {
            SDGs.push(e); // 円が選択されたら、SDGsとみなして配列SDGsに追加
            e.selected = true;
          }
        });
      }

      // マウス移動時の処理
      function mymousemove(evt) {
        if (SDGs.length == 0) {
          return;
        }

        let x = !isNaN(evt.offsetX) ? evt.offsetX : evt.touches[0].clientX;
        let y = !isNaN(evt.offsetY) ? evt.offsetY : evt.touches[0].clientY;
        let p = SDGs[SDGs.length - 1];  // リストの最後のSDGsを取得

        engine.entities.forEach(function (e) {
          if (e.isHit(x, y) && e.shape == ShapeCircle) {
            if (SDGs.indexOf(e) < 0 && e.color == p.color) {
              let d2 = Math.pow(e.x - p.x, 2) + Math.pow(e.y - p.y, 2); // 最後のSDGsとの距離
              if (d2 < 4000) {
                SDGs.push(e);  // 距離が4000未満であれば連結→リストに追加して、SDGsを選択状態に
                e.selected = true;
              }
            }
          }
        });
      }

      // マウスリリース時の処理
      function mymouseup(evt) {
        if (SDGs.length > 1) {
          engine.entities = engine.entities.filter(function (e) {
            return e.selected != true;  // 非選択状態のSDGsだけをフィルタ（＝選択状態のSDGsを削除）
          });

          // 消去分を追加
          for (let i = 0; i < SDGs.length; i++) {
            let x = 75 + rand(350);
            let r = new CircleEntity(x, 0, 25, BodyDynamic, 1, 0.98);
            r.color = rand(5);
            engine.entities.push(r);
          }
          score += SDGs.length * 100;
        }
        SDGs.forEach(function (e) {
          delete e.selected;
        });
        SDGs = [];
      }

      function repaint() {
        // 背景クリア
        ctx.drawImage(SDGsbg, 0, 0);

        // SDGsを描画
        for (let i = 0; i < engine.entities.length; i++) {
          let e = engine.entities[i];
          let img = images[e.color];
          if (e.shape == ShapeCircle) {
            ctx.drawImage(img, e.x - 28, e.y - 28, 62, 62);
            if (e.selected) {
              ctx.strokeStyle = "yellow";
              ctx.beginPath();
              ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
              ctx.closePath();
              ctx.stroke();
            }
          }
        }

        // 線
        if (SDGs.length > 0) {
          ctx.strokeStyle = "#B1EB22";
          ctx.beginPath();
          ctx.moveTo(SDGs[0].x, SDGs[0].y);
          for (let i = 1; i < SDGs.length; i++) {
            ctx.lineTo(SDGs[i].x, SDGs[i].y);
          }
          ctx.stroke();
        }

        // メッセージ
        ctx.save();
        ctx.fillStyle = "black";
        ctx.font = "bold 24pt sans-serif";
        ctx.font;
        ctx.translate(680, 400);
  
        ctx.fillText(isNaN(timer) ? "FINISH" : "Score", 0, 0);
        ctx.restore();

        // スコア
        ctx.save();
        ctx.font = "bold 32pt sans-serif";
        ctx.translate(680, 450);
 
        ctx.fillStyle = "black";
        ctx.fillText(("0000000" + score).slice(-7), 0, 0);
        ctx.restore();

        // 残り時間
        ctx.save();
        ctx.fillStyle = "rgba(215, 130, 40, 0.5)";
        ctx.beginPath();
        ctx.moveTo(656, 153);
        ctx.arc(
          656,
          153,
          88,
          -Math.PI / 2,
          (elapsed / 57) * Math.PI * 2 - Math.PI / 2
        );
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }