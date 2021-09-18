import kaboom from "https://unpkg.com/kaboom@next/dist/kaboom.mjs";

kaboom({
  global: true,
  fullscreen: true,
  scaled: 1,
  debug: true,
});

const ROOT_SPRITES = "http://localhost:3000/sprites/";
loadSprite("patuti-idle", `${ROOT_SPRITES}idle-1.png`);
loadSprite("patuti-jump", `${ROOT_SPRITES}area.png`);
loadSprite("patuti", `${ROOT_SPRITES}patuti-sprite.png`, {
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
    },
    jump: {
      from: 5,
      to: 9,
    },
    dock: {
      from: 11,
      to: 13,
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
});
scene("game", () => {
  layers(["bg", "obj", "ui"], "obj");
});

let isPreparingJump = false;
let isJumping = false;

const SPEED = 200;
const MINIMUM_JUMP = 500;
const MAXIMUM_JUMP = 1250;
let currentJumpForce = MINIMUM_JUMP;

const patuti = add([
  sprite("patuti", { anims: "idle" }),
  pos(80, 40),
  scale(0.3),
  area(),
  body(),
  prepareJump(),
]);

// patuti.action(() => {
//   camPos(patuti.pos);
// });

function prepareJump() {
  let preparing = false;
  return {
    id: "prepareJump",
    update() {
      if (preparing) {
        this.play("prepareJump");
        patuti.play("prepareJumpIdle");
        preparing = false;
      }
      if (currentJumpForce < MAXIMUM_JUMP) {
        currentJumpForce += 120 * dt();
      }
    },
    prepareJump() {
      preparing = true;
    },
  };
}

keyDown("up", () => {
  if (patuti.grounded()) {
    patuti.prepareJump();
    isPreparingJump = true;
  }
});

keyRelease("up", () => {
  if (isPreparingJump && patuti.grounded()) {
    patuti.play("jump");
    patuti.jump(currentJumpForce);
    currentJumpForce = MINIMUM_JUMP;
    isPreparingJump = false;
    if (keyIsDown("left") || keyIsDown("right")) {
      patuti.play("moveRight");
    }
  }
});

keyDown("right", () => {
  if (!isPreparingJump) {
    patuti.move(SPEED, 0);
    patuti.flipX(false);
  }
});

keyDown("left", () => {
  if (!isPreparingJump) {
    patuti.move(-SPEED, 0);
    patuti.flipX(true);
  }
});

keyPress(["right", "left"], () => {
  if (!isPreparingJump) patuti.play("moveRight");
});

keyPress("down", () => {
  if (!isPreparingJump) patuti.play("dock");
});

keyRelease(["left", "right", "up"], () => {
  if (
    !keyIsDown("left") &&
    !keyIsDown("right") &&
    !keyIsDown("up") &&
    !keyIsDown("down") &&
    patuti.grounded()
  ) {
    patuti.play("idle");
  }
  if (!patuti.grounded() && (keyIsReleased("left") || keyIsReleased("right"))) {
    patuti.play("idle");
  }
});
// keyPress("space", () => {
//   patuti.play("run");
//   patuti.jump();
//   if (patuti.grounded()) {
//     patuti.play("idle");
//   }
// });

const platform = add([
  rect(width(), 48),
  pos(0, height() - 48),
  outline(4),
  area(),
  solid(),
  color(127, 200, 255),
]);
