(() => {
  const canvas = document.querySelector("#game");
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  const status = document.querySelector("#status");
  const gameOverPanel = document.querySelector("#game-over");
  const width = canvas.width;
  const height = canvas.height;
  const worldWidth = 3600;
  const platforms = [
    { x: 0, y: 470, w: 620, h: 70 },
    { x: 760, y: 470, w: 620, h: 70 },
    { x: 1480, y: 470, w: 720, h: 70 },
    { x: 2320, y: 470, w: 680, h: 70 },
    { x: 3120, y: 470, w: 480, h: 70 },
    { x: 300, y: 380, w: 150, h: 18 },
    { x: 850, y: 370, w: 160, h: 18 },
    { x: 1110, y: 315, w: 130, h: 18 },
    { x: 1580, y: 375, w: 170, h: 18 },
    { x: 1850, y: 325, w: 150, h: 18 },
    { x: 2420, y: 370, w: 170, h: 18 },
    { x: 2700, y: 310, w: 150, h: 18 },
    { x: 3210, y: 370, w: 175, h: 18 }
  ];
  const hazards = [
    { x: 510, y: 438, w: 60, h: 32 },
    { x: 1030, y: 438, w: 66, h: 32 },
    { x: 1680, y: 438, w: 70, h: 32 },
    { x: 2140, y: 438, w: 60, h: 32 },
    { x: 2500, y: 438, w: 72, h: 32 },
    { x: 2870, y: 438, w: 60, h: 32 },
    { x: 3300, y: 438, w: 60, h: 32 }
  ];
  const coins = [
    { x: 365, y: 337 }, { x: 900, y: 326 }, { x: 1168, y: 271 },
    { x: 1635, y: 331 }, { x: 1900, y: 281 }, { x: 2475, y: 326 },
    { x: 2750, y: 266 }, { x: 3260, y: 326 }, { x: 700, y: 415 },
    { x: 1430, y: 415 }, { x: 2250, y: 415 }, { x: 3050, y: 415 }
  ].map((coin) => ({ ...coin, collected: false }));
  const input = { left: false, right: false };
  const player = { x: 64, y: 414, w: 30, h: 42, vx: 0, vy: 0, grounded: false };
  const gravity = 1800;
  const speed = 310;
  const jumpSpeed = 800;
  let cameraX = 0;
  let jumpQueued = false;
  let finished = false;
  let gameOver = false;
  let previousTime = 0;

  function reset() {
    player.x = 64;
    player.y = 414;
    player.vx = 0;
    player.vy = 0;
    player.grounded = false;
    cameraX = 0;
    finished = false;
    gameOver = false;
    jumpQueued = false;
    input.left = false;
    input.right = false;
    gameOverPanel.hidden = true;
    coins.forEach((coin) => { coin.collected = false; });
    status.textContent = "コインを集めて、旗まで進もう";
  }

  function queueJump() {
    jumpQueued = true;
  }

  function keyName(event) {
    return event.key.toLowerCase();
  }

  window.addEventListener("keydown", (event) => {
    const key = keyName(event);
    if (["arrowleft", "arrowright", "arrowup", " ", "a", "d", "w"].includes(key)) {
      event.preventDefault();
    }
    if (key === "arrowleft" || key === "a") input.left = true;
    if (key === "arrowright" || key === "d") input.right = true;
    if ((key === "arrowup" || key === " " || key === "w") && !event.repeat) queueJump();
  });

  window.addEventListener("keyup", (event) => {
    const key = keyName(event);
    if (key === "arrowleft" || key === "a") input.left = false;
    if (key === "arrowright" || key === "d") input.right = false;
  });

  window.addEventListener("blur", () => {
    input.left = false;
    input.right = false;
    jumpQueued = false;
  });

  document.querySelectorAll("[data-control]").forEach((button) => {
    const control = button.dataset.control;
    const release = () => {
      if (control !== "jump") input[control] = false;
    };
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      if (control === "jump") queueJump();
      else input[control] = true;
    });
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("lostpointercapture", release);
  });

  document.querySelector("#restart").addEventListener("click", reset);
  document.querySelector("#retry").addEventListener("click", reset);

  function overlaps(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x &&
      a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function die() {
    if (gameOver) return;
    player.vx = 0;
    player.vy = 0;
    player.grounded = false;
    input.left = false;
    input.right = false;
    jumpQueued = false;
    gameOver = true;
    gameOverPanel.hidden = false;
    status.textContent = "ゲームオーバー！ リトライしてもう一度挑戦しよう";
  }

  function update(delta) {
    if (finished || gameOver) return;

    const direction = Number(input.right) - Number(input.left);
    player.vx = direction * speed;
    if (jumpQueued && player.grounded) {
      player.vy = -jumpSpeed;
      player.grounded = false;
    }
    jumpQueued = false;

    const previousX = player.x;
    const previousY = player.y;
    player.x = Math.max(0, Math.min(worldWidth - player.w, player.x + player.vx * delta));

    for (const platform of platforms) {
      if (player.y + player.h > platform.y && player.y < platform.y + platform.h &&
          player.x < platform.x + platform.w && player.x + player.w > platform.x) {
        if (previousX + player.w <= platform.x) player.x = platform.x - player.w;
        else if (previousX >= platform.x + platform.w) player.x = platform.x + platform.w;
      }
    }

    player.vy = Math.min(player.vy + gravity * delta, 1100);
    player.y += player.vy * delta;
    player.grounded = false;

    for (const platform of platforms) {
      if (player.x + player.w <= platform.x || player.x >= platform.x + platform.w) continue;
      const previousBottom = previousY + player.h;
      const currentBottom = player.y + player.h;
      if (player.vy >= 0 && previousBottom <= platform.y && currentBottom >= platform.y) {
        player.y = platform.y - player.h;
        player.vy = 0;
        player.grounded = true;
      } else if (player.vy < 0 && previousY >= platform.y + platform.h &&
                 player.y <= platform.y + platform.h) {
        player.y = platform.y + platform.h;
        player.vy = 0;
      }
    }

    for (const hazard of hazards) {
      if (overlaps(player, hazard)) {
        die();
        break;
      }
    }
    if (player.y > height + 120) die();
    if (gameOver) return;

    for (const coin of coins) {
      if (!coin.collected && overlaps(player, { x: coin.x - 12, y: coin.y - 12, w: 24, h: 24 })) {
        coin.collected = true;
        status.textContent = `コイン ${coins.filter((item) => item.collected).length} / ${coins.length} 枚`;
      }
    }

    if (player.x + player.w >= worldWidth - 100) {
      finished = true;
      const count = coins.filter((coin) => coin.collected).length;
      status.textContent = `クリア！　コイン ${count} / ${coins.length} 枚`;
    }

    cameraX = Math.max(0, Math.min(worldWidth - width, player.x - width * 0.36));
  }

  function drawBackground() {
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, "#11102b");
    sky.addColorStop(.62, "#39366d");
    sky.addColorStop(1, "#b45f83");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    const moonX = Math.round(755 - cameraX * .035);
    ctx.fillStyle = "#ffe66d";
    ctx.fillRect(moonX - 20, 76, 40, 8);
    ctx.fillRect(moonX - 28, 84, 56, 8);
    ctx.fillRect(moonX - 32, 92, 64, 24);
    ctx.fillRect(moonX - 24, 116, 48, 8);
    ctx.fillRect(moonX - 16, 124, 32, 8);
    ctx.fillStyle = "#b45f83";
    ctx.fillRect(moonX + 8, 92, 8, 8);
    ctx.fillRect(moonX + 16, 100, 8, 8);
    ctx.fillRect(moonX + 8, 108, 8, 8);

    for (let i = 0; i < 48; i++) {
      const x = Math.round(((i * 173 + 37 - cameraX * .045) % (width + 173) + width + 173) % (width + 173));
      const y = 22 + (i * 67 % 205);
      const size = i % 7 === 0 ? 4 : 2;
      ctx.fillStyle = i % 4 === 0 ? "#fff6d5" : "#c8c4e8";
      ctx.fillRect(x, y, size, size);
    }

    for (let layer = 0; layer < 2; layer++) {
      const parallax = layer === 0 ? .12 : .23;
      const baseY = layer === 0 ? 390 : 435;
      const spacing = 180;
      const offset = Math.round(cameraX * parallax % spacing);
      ctx.fillStyle = layer === 0 ? "#514b83" : "#29264f";
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let i = -1; i <= 9; i++) {
        const x = i * spacing - offset;
        const peakY = baseY - (i % 2 === 0 ? 75 : 10);
        ctx.lineTo(x, baseY);
        ctx.lineTo(x + 60, peakY);
        ctx.lineTo(x + 120, baseY);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();
    }

    const horizon = ctx.createLinearGradient(0, 400, 0, 470);
    horizon.addColorStop(0, "rgb(255 230 109 / 0%)");
    horizon.addColorStop(1, "rgb(255 230 109 / 12%)");
    ctx.fillStyle = horizon;
    ctx.fillRect(0, 400, width, 70);
  }

  function drawWorld() {
    ctx.save();
    ctx.translate(-Math.round(cameraX), 0);

    for (const platform of platforms) {
      ctx.fillStyle = "#514b83";
      ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
      ctx.fillStyle = "#a99bff";
      ctx.fillRect(platform.x, platform.y, platform.w, 8);
      ctx.fillStyle = "#ded6ff";
      ctx.fillRect(platform.x, platform.y, platform.w, 3);
      ctx.fillStyle = "#29264f";
      for (let x = platform.x + 14; x < platform.x + platform.w; x += 34) {
        ctx.fillRect(x, platform.y + 23, 12, 4);
        ctx.fillStyle = "#7065c9";
        ctx.fillRect(x + 5, platform.y + 39, 7, 3);
        ctx.fillStyle = "#29264f";
      }
    }

    for (const hazard of hazards) {
      ctx.fillStyle = "#ff718d";
      ctx.beginPath();
      for (let x = hazard.x; x < hazard.x + hazard.w; x += 20) {
        ctx.moveTo(x, hazard.y + hazard.h);
        ctx.lineTo(x + 10, hazard.y);
        ctx.lineTo(x + 20, hazard.y + hazard.h);
      }
      ctx.fill();
      ctx.fillStyle = "#a72c68";
      ctx.fillRect(hazard.x, hazard.y + hazard.h - 5, hazard.w, 5);
    }

    for (const coin of coins) {
      if (coin.collected) continue;
      const bob = Math.round(Math.sin(performance.now() / 240 + coin.x) * 3);
      ctx.fillStyle = "#a85e38";
      ctx.fillRect(coin.x - 8, coin.y + bob - 10, 16, 20);
      ctx.fillStyle = "#ffe66d";
      ctx.fillRect(coin.x - 5, coin.y + bob - 10, 10, 20);
      ctx.fillStyle = "#fff6d5";
      ctx.fillRect(coin.x - 3, coin.y + bob - 7, 3, 6);
    }

    const goalX = worldWidth - 100;
    ctx.fillStyle = "#fff6d5";
    ctx.fillRect(goalX, 350, 6, 120);
    ctx.fillStyle = "#ff718d";
    ctx.beginPath();
    ctx.moveTo(goalX + 6, 352);
    ctx.lineTo(goalX + 58, 370);
    ctx.lineTo(goalX + 6, 388);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ffe66d";
    ctx.fillRect(goalX - 8, 466, 22, 4);

    drawPlayer();
    ctx.restore();
  }

  function drawPlayer() {
    const x = Math.round(player.x);
    const y = Math.round(player.y);
    ctx.fillStyle = "#29264f";
    ctx.fillRect(x + 3, y + 9, 24, 29);
    ctx.fillStyle = "#58d7c4";
    ctx.fillRect(x + 5, y + 8, 20, 27);
    ctx.fillStyle = "#fff6d5";
    ctx.fillRect(x + 8, y + 2, 14, 17);
    ctx.fillStyle = "#29264f";
    ctx.fillRect(x + 7, y + 11, 16, 7);
    ctx.fillStyle = "#11102b";
    ctx.fillRect(x + 18, y + 12, 4, 4);
    ctx.fillStyle = "#ff718d";
    ctx.fillRect(x + 2, y + 24, 8, 8);
    ctx.fillRect(x - 2, y + 32, 12, 5);
    ctx.fillStyle = "#29264f";
    ctx.fillRect(x + 5, y + 34, 8, 7);
    ctx.fillRect(x + 18, y + 34, 8, 7);
    ctx.fillStyle = "#fff6d5";
    ctx.fillRect(x + 3, y + player.h - 4, 11, 5);
    ctx.fillRect(x + 17, y + player.h - 4, 11, 5);
  }

  function drawOverlay() {
    if (!finished) return;
    ctx.fillStyle = "rgb(17 16 43 / 78%)";
    ctx.fillRect(0, 0, width, height);
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffe66d";
    ctx.font = "800 38px ui-monospace, monospace";
    ctx.fillText("ステージクリア！", width / 2, height / 2 - 8);
    ctx.fillStyle = "#fff6d5";
    ctx.font = "16px system-ui, sans-serif";
    ctx.fillText("最初からボタンでもう一度遊べます", width / 2, height / 2 + 30);
    ctx.textAlign = "start";
  }

  function render() {
    drawBackground();
    drawWorld();
    drawOverlay();
  }

  function frame(time) {
    const delta = Math.min((time - previousTime) / 1000 || 0, 1 / 30);
    previousTime = time;
    update(delta);
    render();
    requestAnimationFrame(frame);
  }

  reset();
  requestAnimationFrame(frame);
})();
