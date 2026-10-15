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
  const jumpSpeed = 800;
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
    sky.addColorStop(0, "#090f25");
    sky.addColorStop(.48, "#253960");
    sky.addColorStop(.78, "#745274");
    sky.addColorStop(1, "#e08b71");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    const glow = ctx.createRadialGradient(755 - cameraX * .035, 112, 8, 755 - cameraX * .035, 112, 110);
    glow.addColorStop(0, "rgb(255 224 177 / 32%)");
    glow.addColorStop(1, "rgb(255 190 162 / 0%)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(755 - cameraX * .035, 112, 110, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffe7c4";
    ctx.beginPath();
    ctx.arc(755 - cameraX * .035, 112, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgb(255 255 255 / 28%)";
    ctx.beginPath();
    ctx.arc(746 - cameraX * .035, 103, 23, Math.PI, Math.PI * 1.85);
    ctx.strokeStyle = "rgb(255 255 255 / 28%)";
    ctx.lineWidth = 2;
    ctx.stroke();

    for (let i = 0; i < 48; i++) {
      const x = ((i * 173 + 37 - cameraX * .045) % (width + 173) + width + 173) % (width + 173);
      const y = 22 + (i * 67 % 205);
      const radius = i % 7 === 0 ? 1.7 : 1;
      ctx.fillStyle = i % 4 === 0 ? "rgb(255 226 184 / 78%)" : "rgb(219 232 255 / 68%)";
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < 8; i++) {
      const x = ((i * 190 - cameraX * .16) % (width + 240) + width + 240) % (width + 240) - 100;
      const y = 118 + (i % 3) * 50;
      ctx.fillStyle = "rgb(230 224 255 / 10%)";
      ctx.beginPath();
      ctx.ellipse(x, y, 55, 12, 0, 0, Math.PI * 2);
      ctx.ellipse(x + 28, y - 7, 35, 15, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let layer = 0; layer < 2; layer++) {
      const parallax = layer === 0 ? .12 : .23;
      const baseY = layer === 0 ? 390 : 435;
      const mountain = ctx.createLinearGradient(0, baseY - 90, 0, height);
      mountain.addColorStop(0, layer === 0 ? "#30385f" : "#242b4b");
      mountain.addColorStop(1, layer === 0 ? "#202b49" : "#151d38");
      ctx.fillStyle = mountain;
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

    const horizon = ctx.createLinearGradient(0, 400, 0, 470);
    horizon.addColorStop(0, "rgb(255 174 132 / 0%)");
    horizon.addColorStop(1, "rgb(255 174 132 / 16%)");
    ctx.fillStyle = horizon;
    ctx.fillRect(0, 400, width, 70);
  }

  function drawWorld() {
    ctx.save();
    ctx.translate(-cameraX, 0);

    for (const platform of platforms) {
      const stone = ctx.createLinearGradient(0, platform.y, 0, platform.y + platform.h);
      stone.addColorStop(0, "#354765");
      stone.addColorStop(1, "#1b2945");
      ctx.fillStyle = stone;
      ctx.fillRect(platform.x, platform.y, platform.w, platform.h);
      ctx.fillStyle = "rgb(46 226 208 / 12%)";
      ctx.fillRect(platform.x, platform.y + 8, platform.w, 3);
      ctx.fillStyle = "#52e0ce";
      ctx.fillRect(platform.x, platform.y, platform.w, 8);
      ctx.fillStyle = "rgb(8 17 37 / 42%)";
      for (let x = platform.x + 14; x < platform.x + platform.w; x += 34) {
        ctx.fillRect(x, platform.y + 23, 12, 3);
        ctx.fillStyle = "rgb(129 159 192 / 18%)";
        ctx.fillRect(x + 5, platform.y + 39, 7, 2);
        ctx.fillStyle = "rgb(8 17 37 / 42%)";
      }
    }

    for (const hazard of hazards) {
      ctx.shadowColor = "#ff596f";
      ctx.shadowBlur = 12;
      const spike = ctx.createLinearGradient(0, hazard.y, 0, hazard.y + hazard.h);
      spike.addColorStop(0, "#ff9c86");
      spike.addColorStop(1, "#e34c70");
      ctx.fillStyle = spike;
      ctx.beginPath();
      for (let x = hazard.x; x < hazard.x + hazard.w; x += 20) {
        ctx.moveTo(x, hazard.y + hazard.h);
        ctx.lineTo(x + 10, hazard.y);
        ctx.lineTo(x + 20, hazard.y + hazard.h);
      }
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#9e385d";
      ctx.fillRect(hazard.x, hazard.y + hazard.h - 4, hazard.w, 4);
    }

    for (const coin of coins) {
      if (coin.collected) continue;
      const bob = Math.sin(performance.now() / 240 + coin.x) * 3;
      ctx.shadowColor = "#ffca65";
      ctx.shadowBlur = 18;
      ctx.fillStyle = "rgb(255 198 91 / 24%)";
      ctx.beginPath();
      ctx.arc(coin.x, coin.y + bob, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffc95d";
      ctx.beginPath();
      ctx.ellipse(coin.x, coin.y + bob, 7, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#fff0c1";
      ctx.fillRect(coin.x - 2, coin.y + bob - 6, 2, 6);
    }

    const goalX = worldWidth - 100;
    ctx.shadowColor = "#66f0d6";
    ctx.shadowBlur = 12;
    ctx.fillStyle = "#d8f4ee";
    ctx.fillRect(goalX, 350, 6, 120);
    ctx.fillStyle = "#51e4ca";
    ctx.beginPath();
    ctx.moveTo(goalX + 6, 352);
    ctx.lineTo(goalX + 58, 370);
    ctx.lineTo(goalX + 6, 388);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#a8c9d8";
    ctx.beginPath();
    ctx.ellipse(goalX + 3, 470, 15, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    drawPlayer();
    ctx.restore();
  }

  function drawPlayer() {
    const x = player.x;
    const y = player.y;
    ctx.fillStyle = "rgb(8 13 31 / 42%)";
    ctx.beginPath();
    ctx.ellipse(x + player.w / 2, Math.min(470, y + player.h + 4), 19, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = "rgb(62 226 209 / 55%)";
    ctx.shadowBlur = 14;
    roundedRect(x + 3, y + 7, player.w - 6, player.h - 8, 10);
    const cloak = ctx.createLinearGradient(x, y + 8, x + player.w, y + player.h);
    cloak.addColorStop(0, "#55e5d1");
    cloak.addColorStop(1, "#258bb0");
    ctx.fillStyle = cloak;
    ctx.fill();
    ctx.shadowBlur = 0;
    roundedRect(x + 6, y + 2, player.w - 12, 21, 8);
    ctx.fillStyle = "#f3d5bb";
    ctx.fill();
    roundedRect(x + 5, y + 11, player.w - 10, 8, 4);
    ctx.fillStyle = "#172b4b";
    ctx.fill();
    ctx.fillStyle = "#8bf5e7";
    ctx.fillRect(x + 19, y + 13, 4, 3);
    ctx.fillStyle = "#ffbd68";
    ctx.beginPath();
    ctx.moveTo(x + 6, y + 24);
    ctx.lineTo(x - 2, y + 35);
    ctx.lineTo(x + 13, y + 31);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#182642";
    ctx.fillRect(x + 6, y + 34, 8, 7);
    ctx.fillRect(x + 18, y + 34, 8, 7);
    ctx.fillStyle = "#e8f1f5";
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
