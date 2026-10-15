(() => {
  const canvas = document.querySelector("#game");
  const ctx = canvas.getContext("2d");
  const status = document.querySelector("#status");
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
  const jumpSpeed = 690;
  let cameraX = 0;
  let jumpQueued = false;
  let finished = false;
  let previousTime = 0;

  function reset() {
    player.x = 64;
    player.y = 414;
    player.vx = 0;
    player.vy = 0;
    player.grounded = false;
    cameraX = 0;
    finished = false;
    jumpQueued = false;
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

  function overlaps(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x &&
      a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function die() {
    player.x = 64;
    player.y = 414;
    player.vx = 0;
    player.vy = 0;
    player.grounded = false;
    cameraX = 0;
  }

  function update(delta) {
    if (finished) return;

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

  function roundedRect(x, y, w, h, radius) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
  }

  function drawBackground() {
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, "#182b49");
    sky.addColorStop(.65, "#536e89");
    sky.addColorStop(1, "#e5b985");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgb(255 231 177 / 78%)";
    ctx.beginPath();
    ctx.arc(755 - cameraX * .035, 112, 38, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 8; i++) {
      const x = ((i * 190 - cameraX * .16) % (width + 240) + width + 240) % (width + 240) - 100;
      const y = 118 + (i % 3) * 50;
      ctx.fillStyle = "rgb(239 244 246 / 12%)";
      ctx.beginPath();
      ctx.ellipse(x, y, 55, 12, 0, 0, Math.PI * 2);
      ctx.ellipse(x + 28, y - 7, 35, 15, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let layer = 0; layer < 2; layer++) {
      const parallax = layer === 0 ? .12 : .23;
      const baseY = layer === 0 ? 390 : 435;
      ctx.fillStyle = layer === 0 ? "#354d68" : "#293d55";
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let i = -1; i <= 9; i++) {
        const x = i * 180 - (cameraX * parallax % 180);
        ctx.lineTo(x, baseY - (i % 2 === 0 ? 75 : 10));
        ctx.lineTo(x + 90, baseY + (i % 2 === 0 ? 10 : -58));
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawWorld() {
    ctx.save();
    ctx.translate(-cameraX, 0);

    for (const platform of platforms) {
      ctx.fillStyle = "#315a52";
      ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
      ctx.fillStyle = "#7bc28d";
      ctx.fillRect(platform.x, platform.y, platform.w, 8);
      ctx.fillStyle = "rgb(29 49 48 / 32%)";
      for (let x = platform.x + 14; x < platform.x + platform.w; x += 34) {
        ctx.fillRect(x, platform.y + 22, 12, 3);
      }
    }

    for (const hazard of hazards) {
      ctx.fillStyle = "#f28378";
      ctx.beginPath();
      for (let x = hazard.x; x < hazard.x + hazard.w; x += 20) {
        ctx.moveTo(x, hazard.y + hazard.h);
        ctx.lineTo(x + 10, hazard.y);
        ctx.lineTo(x + 20, hazard.y + hazard.h);
      }
      ctx.fill();
      ctx.fillStyle = "#c95f63";
      ctx.fillRect(hazard.x, hazard.y + hazard.h - 4, hazard.w, 4);
    }

    for (const coin of coins) {
      if (coin.collected) continue;
      const bob = Math.sin(performance.now() / 240 + coin.x) * 3;
      ctx.fillStyle = "rgb(255 217 112 / 22%)";
      ctx.beginPath();
      ctx.arc(coin.x, coin.y + bob, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffd86f";
      ctx.beginPath();
      ctx.ellipse(coin.x, coin.y + bob, 7, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff0b2";
      ctx.fillRect(coin.x - 2, coin.y + bob - 6, 2, 6);
    }

    const goalX = worldWidth - 100;
    ctx.fillStyle = "#ecedf1";
    ctx.fillRect(goalX, 350, 6, 120);
    ctx.fillStyle = "#ffcf67";
    ctx.beginPath();
    ctx.moveTo(goalX + 6, 352);
    ctx.lineTo(goalX + 58, 370);
    ctx.lineTo(goalX + 6, 388);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#dbe2ee";
    ctx.beginPath();
    ctx.ellipse(goalX + 3, 470, 15, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    drawPlayer();
    ctx.restore();
  }

  function drawPlayer() {
    const x = player.x;
    const y = player.y;
    ctx.fillStyle = "rgb(15 24 38 / 25%)";
    ctx.beginPath();
    ctx.ellipse(x + player.w / 2, Math.min(470, y + player.h + 4), 19, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    roundedRect(x + 3, y + 7, player.w - 6, player.h - 8, 10);
    ctx.fillStyle = "#f6bd68";
    ctx.fill();
    roundedRect(x + 7, y + 2, player.w - 14, 21, 8);
    ctx.fillStyle = "#f4d6ad";
    ctx.fill();
    ctx.fillStyle = "#26374e";
    ctx.fillRect(x + 18, y + 10, 3, 4);
    ctx.fillStyle = "#5577a1";
    ctx.fillRect(x + 5, y + 28, player.w - 10, 11);
    ctx.fillStyle = "#f1f4fa";
    ctx.fillRect(x + 3, y + player.h - 4, 11, 5);
    ctx.fillRect(x + 17, y + player.h - 4, 11, 5);
  }

  function drawOverlay() {
    if (!finished) return;
    ctx.fillStyle = "rgb(12 19 32 / 48%)";
    ctx.fillRect(0, 0, width, height);
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff3cf";
    ctx.font = "800 46px system-ui, sans-serif";
    ctx.fillText("STAGE CLEAR!", width / 2, height / 2 - 8);
    ctx.fillStyle = "#f2e8d4";
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
