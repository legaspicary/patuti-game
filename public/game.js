import kaboom from "https://unpkg.com/kaboom@next/dist/kaboom.mjs";

kaboom({
  global: true,
  fullscreen: true,
  scaled: 1,
  debug: true,
});

//* CONSTANTS
const ROOT_SPRITES = process.env.APP_URL || "http://localhost:3000/sprites/";
const SPEED = 300;
const MINIMUM_JUMP = 500;
const MAXIMUM_JUMP = 1000;
const FALL_DEATH = 1250;
const PATUTI_SCALE = 0.3;
const PLATFORM_SCALE = 0.2;
const PATUTI_SPRITE_CONFIG = {
  sliceX: 1,
  sliceY: 28,
  anims: {
    idle: {
      from: 0,
      to: 1,
      loop: true,
    },
    prepareJump: {
      from: 2,
      to: 4,
    },
    prepareJumpIdle: {
      from: 4,
      to: 4,
      loop: true,
    },
    jump: {
      from: 5,
      to: 5,
      loop: true,
    },
    docking: {
      from: 11,
      to: 13,
    },
    dockingIdle: {
      from: 14,
      to: 14,
      loop: true,
    },
    moveLeft: {
      from: 17,
      to: 20,
      loop: true,
    },
    moveRight: {
      from: 23,
      to: 26,
      loop: true,
    },
  },
};
const WORMHOLE_SPRITE_CONFIG = {
  sliceX: 1,
  sliceY: 7,
  anims: {
    idle: {
      from: 0,
      to: 6,
      loop: true,
    },
    spawned: {
      from: 3,
      to: 3,
      loop: true,
    },
  },
};

//* GLOBALS
let score = 0;
let bulletPosY = 0;
let bulletPosX = 0;
let currentJumpForce = MINIMUM_JUMP;
let isPreparingJump = false;

loadAllSprites();

scene("gameIntro", () => {
  layers(["bg", "obj", "ui"], "obj");
  add([
    text("Patuti the Alien"),
    pos(width() / 2, height() / 2 - 200),
    origin("center"),
  ]);
  add([
    text(
      "How to Play:\nDodge dark matter and survive as long as you can\n\n\nArrow Keys Controls:\nUp to Jump\nLeft and Right to move\nDown to turn blue and remove gravity \n\n Press space to start",
      { size: 36 }
    ),
    pos(width() / 2, height() / 2 + 50),
    origin("center"),
  ]);
  add([
    sprite("bg"),
    layer("bg"),
    scale(5),
    origin("center"),
    pos(width() / 2, height() / 2),
  ]);
  keyPress("space", () => {
    go("game");
  });
});

go("gameIntro");

scene("game", () => {
  //* SETUP GAME SCENE
  layers(["bg", "obj", "ui"], "obj");
  add([
    sprite("bg"),
    layer("bg"),
    scale(5),
    origin("center"),
    pos(width() / 2, height() / 2),
  ]);
  const scoreUI = add([text("0")]);
  focus();

  const patuti = initializePatuti();
  initPatutiControls(patuti);

  //*PLATFORMS
  spawnPlatform();
  patuti.pos = get("platform")[0].pos.sub(0, 64);

  //*DARK BULLETS
  spawnBullet();

  //*INCREASE SCORE EVERY SECOND
  loop(1, () => {
    score += 3;
    scoreUI.text = score;
  });

  //* REPEAT ACTIONS FOR EACH ENTITY
  patuti.action(() => {
    // track patuti position on y
    bulletPosY = patuti.pos.y;
    bulletPosX = patuti.pos.x;
    if (patuti.pos.y >= FALL_DEATH || patuti.pos.y < -1 * (FALL_DEATH / 2)) {
      go("gameEnd");
    }
    if (
      !keyIsDown("left") &&
      !keyIsDown("right") &&
      !keyIsDown("up") &&
      !keyIsDown("down") &&
      patuti.grounded()
    ) {
      gravity(1500);
      (patuti.color = null), patuti.play("idle");
    }
  });
  //platform actions
  action("platform", (p) => {
    if (p.pos.x < 0 || p.pos.x > width()) {
      p.dir = -p.dir;
    }
    p.move(p.dir * p.speed, p.movementAngle);
  });
  //platform actions
  action("bullet", (b) => {
    b.move(-1 * b.speed, 0);
  });
});

scene("gameEnd", () => {
  layers(["bg", "obj", "ui"], "obj");
  let highScore = localStorage.getItem("highScore");

  if (highScore === null) {
    highScore = score;
    localStorage.setItem("highScore", highScore);
  }

  if (score > highScore) {
    highScore = score;
    localStorage.setItem("highScore", highScore);
  }
  add([
    text("Score: " + Math.floor(score) + "\nHigh Score: " + highScore),
    pos(width() / 2, height() / 2),
    origin("center"),
  ]);
  add([
    sprite("bg"),
    layer("bg"),
    scale(5),
    origin("center"),
    pos(width() / 2, height() / 2),
  ]);
  keyPress("space", () => {
    score = 0;
    go("game");
  });
});

function loadAllSprites() {
  loadSprite("patuti-idle", `${ROOT_SPRITES}idle-1.png`);
  loadSprite("bg", `${ROOT_SPRITES}bg.png`);
  loadSprite("platform", `${ROOT_SPRITES}area.png`);
  loadSprite("bullet", `${ROOT_SPRITES}bullet_h.png`);
  loadSprite(
    "patuti",
    `${ROOT_SPRITES}patuti-sprite.png`,
    PATUTI_SPRITE_CONFIG
  );
  loadSprite("wormhole", `${ROOT_SPRITES}wormhole.png`, WORMHOLE_SPRITE_CONFIG);
}

function initializePatuti() {
  const prepareJump = () => {
    let preparing = false;
    return {
      id: "prepareJump",
      update() {
        if (preparing) {
          this.play("prepareJump");
          this.play("prepareJumpIdle");
          if (currentJumpForce < MAXIMUM_JUMP) {
            currentJumpForce += 350 * dt();
          }
          preparing = false;
        }
      },
      prepareJump() {
        preparing = true;
      },
    };
  };
  const patuti = add([
    sprite("patuti", { anims: "idle" }),
    pos(80, 40),
    scale(PATUTI_SCALE),
    area(),
    body(),
    solid(),
    origin("center"),
    prepareJump(),
  ]);
  patuti.collides("bullet", () => {
    addKaboom(patuti.pos);
    shake();
    go("gameEnd");
  });
  return patuti;
}

function spawnPlatform() {
  const platform = add([
    sprite("platform"),
    area(),
    // body(),
    solid(),
    scale(PLATFORM_SCALE),
    pos(width() / 2, rand(100, height() - 100)),
    origin("center"),
    // color(255, 180, 255),
    // move(LEFT, 140),
    "platform", // add a tag here
    {
      speed: rand(80, 250),
      dir: choose([-1, 1]),
      movementAngle: rand(0, 90),
    },
  ]);
  platform.collides("bullet", () => {
    addKaboom(platform.pos);
    score += 5;
    destroy(platform);
  });
  wait(rand(0, 4), () => {
    spawnPlatform();
  });
}

function spawnBullet() {
  const wormhole = add([
    sprite("wormhole", { anims: "idle" }),
    scale(4),
    origin("center"),
    pos(bulletPosX, bulletPosY),
  ]);
  wormhole.play("idle");
  wait(rand(0.85, 3), () => {
    spawnBullet();
  });
  wait(3, () => {
    const bullet = add([
      sprite("wormhole"),
      area(),
      body(),
      color(255, 0, 0),
      scale(2),
      pos(wormhole.pos),
      origin("center"),
      move(wormhole.pos.x > width() / 2 ? LEFT : RIGHT, 150),
      "bullet", // add a tag here
      {
        speed: rand(100, 400),
      },
    ]);
    bullet.play("idle");
    bullet.collides("platform", () => {
      addKaboom(bullet.pos);
      score += 5;
      destroy(bullet);
    });
    destroy(wormhole);
  });

  
}

function initPatutiControls(patuti) {
  keyDown("up", () => {
    if (patuti.grounded()) {
      patuti.prepareJump();
      isPreparingJump = true;
    }
  });

  keyRelease("up", () => {
    if (isPreparingJump) {
      patuti.play("jump", () => {
        patuti.play("idle");
      });
      patuti.jump(currentJumpForce);
      currentJumpForce = MINIMUM_JUMP;
      isPreparingJump = false;
      if (keyIsDown("left") || keyIsDown("right")) {
        patuti.play("moveRight");
      }
    }
  });

  keyRelease("down", () => {
    gravity(1500);
    patuti.color = null;
  });

  keyDown("right", () => {
    if (
      !isPreparingJump &&
      patuti.pos.x + patuti.width * PATUTI_SCALE < width()
    ) {
      patuti.move(SPEED, 0);
      patuti.flipX(false);
    }
  });

  keyDown("left", () => {
    if (!isPreparingJump && patuti.pos.x > 0) {
      patuti.move(-SPEED, 0);
      patuti.flipX(true);
    }
  });

  keyPress(["right", "left"], () => {
    if (!isPreparingJump) patuti.play("moveRight");
  });

  keyPress("down", () => {
    // console.log(patuti)
    if (!isPreparingJump) {
      // patuti.play("docking")
      // patuti.play("dockingIdle")
      gravity(0);
      patuti.color = rgb(0, 0, 125);
      patuti.play("dockingIdle");
    }
  });
}
