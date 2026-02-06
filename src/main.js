document.addEventListener("DOMContentLoaded", function () {
  const canvas = document.querySelector("[data-canvas]");
  const canvasScene = document.querySelector("[data-scene]");
  document.querySelector("[data-colorPicker]").onchange = change_color;
  document.querySelector("[data-range]").onchange = change_range;
  const validationEl = document.getElementById("validation");
  const containerImgEl = document.getElementById("container-img");

  document.querySelector("[data-clear]").onclick = clear_canvas;
  document.querySelector("[data-undo]").onclick = undo_last;

  canvas.width = window.innerWidth / 4;
  canvas.height = window.innerHeight;

  let context = canvas.getContext("2d");

  // set properties on start

  let draw_color = "black";
  let draw_width = "10";
  let is_drawing = false;

  let restore_array = [];
  let index = -1;

  // usable on mobile

  canvas.addEventListener("touchstart", start, false);
  canvas.addEventListener("touchmove", draw, false);

  // usable on computer

  canvas.addEventListener("mousedown", start, false);
  canvas.addEventListener("mousemove", draw, false);

  // draw end 

  canvas.addEventListener("touchend", stop, false);
  canvas.addEventListener("mouseup", stop, false);
  canvas.addEventListener("mouseout", stop, false);

  // function set position

  function start(event) {
    is_drawing = true;

    context.beginPath();
    context.moveTo(
      event.clientX - canvas.offsetLeft,
      event.clientY - canvas.offsetTop,
    );
    event.preventDefault();
  }
  
  // able to draw
  
  function draw(evt) {
    if (is_drawing) {
      console.log(evt);
      const x = evt.clientX ?? evt.touches[0].clientX
      const y = evt.clientY ?? evt.touches[0].clientY
      
      console.log(evt.clientX);
      context.lineTo(
        x - canvas.offsetLeft,
        y - canvas.offsetTop,
      );

      // recover properties from above

      context.strokeStyle = draw_color;
      context.lineWidth = draw_width;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.stroke();
    }
    evt.preventDefault();
  }

  // stop drawing when mouse up or touch up

  function stop(event) {
    if (is_drawing) {
      context.stroke();
      context.closePath();
      is_drawing = false;
    }

    event.preventDefault();

    // bring element on the last position existing (if undo) (posiion 0)

    if (event.type != "mouseout") {
      restore_array.push(
        context.getImageData(0, 0, canvas.width, canvas.height),
      );
      index += 1;
    }
    console.log(restore_array);
  }

  // color change

  function change_color(event) {
    draw_color = this.value;
  }

  // range change

  function change_range(event) {
    draw_width = this.value;
  }

  // clear canvas

  function clear_canvas() {
    if (backgroundImage) {
      redrawBackground();
    } else {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }

    restore_array = [];
    index = -1;
  }

  // undo last draw

  function undo_last() {
    if (index <= 0) {
      clear_canvas();
    } else {
      index -= 1;
      restore_array.pop();
      context.putImageData(restore_array[index], 0, 0);
    }
  }

  // load background image

  // HOW TO RESIZE IT ???
  let backgroundImage = document.createElement(null);
  backgroundImage.style.width = canvas.width;
  backgroundImage.style.height = canvas.height;
  backgroundImage.style.objectFit = "cover";

  loadBackgroundImage("assets/images/Bonhomme.svg");

  function loadBackgroundImage(src) {
    backgroundImage = new Image();
    backgroundImage.onload = function () {
      redrawBackground();
    };
    backgroundImage.src = src;
  }

  function redrawBackground() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(backgroundImage, canvas.width / 4, 0);
  }

  // envoyer sur autre canvas
  // change size

  const context2 = canvasScene.getContext("2d");

  canvasScene.width = window.innerWidth / 2;
  canvasScene.height = canvas.height;

  const background_imageSecond = new Image();
  background_imageSecond.src = 'assets/images/background-worshop.svg';

  // max image

  const MAX_IMAGES = 10;
  const sceneImages = [];

  validationEl.addEventListener("click", () => {

    // max image

    if (sceneImages.length >= MAX_IMAGES) {
      sceneImages.shift();
    }

    // create an image of the first canvas
    const snapshot = new Image();
    snapshot.src = canvas.toDataURL();

    snapshot.onload = () => {
      // reduce dimensions
      const scaledWidth = canvas.width / 3;
      const scaledHeight = canvas.height / 3;

      // random position
      const { x, y } = positionRandom(
        canvasScene.width,
        canvasScene.height,
        scaledWidth,
        scaledHeight,
      );

      sceneImages.push({
        img: snapshot,
        x,
        y,
        baseY: y,
        width: scaledWidth,
        height: scaledHeight,
        vx: (Math.random() * 2 - 1) * 2, // vitesse X
        vy: (Math.random() * 2 - 1) * 2, // vitesse Y
        t: 1,
        direction: 1,
      });

      redrawScene();

      // clear drawing canvas
      clear_canvas();
    };
  });

  function redrawScene() {
    context2.clearRect(0, 0, canvasScene.width, canvasScene.height);

    sceneImages.forEach((item) => {
      context2.drawImage(item.img, item.x, item.y, item.width, item.height);
    });
  }

  // random position

  function positionRandom(maxWidth, maxHeigth, imageWidth, imageHeight) {
    const x = Math.random() * (maxWidth - imageWidth);
    const y = Math.random() * (maxHeigth - imageHeight);
    return { x, y };
  }

  // random move

  function animateScene() {
    context2.clearRect(0, 0, canvasScene.width, canvasScene.height);

    // background
  drawBackgroundCover(context2, background_imageSecond, canvasScene);


    sceneImages.forEach((item) => {
      item.x += item.vx;
      item.baseY += item.vy;

      if (item.x <= 0 || item.x + item.width >= canvasScene.width) {
        item.vx *= -1;
      }

      if (item.baseY <= 0 || item.baseY + item.height >= canvasScene.height) {
        item.vy *= -1;
      }


      // jump
      item.t += 0.35 * item.direction
      if (item.t > 5 || item.t < 0) {
        item.direction = item.direction > 0 ? -1 : 1
      }

      const jump = bounceEaseInOut(item.t);
      item.y = item.baseY - jump;

      context2.drawImage(item.img, item.x, item.y, item.width, item.height);
    });

    requestAnimationFrame(animateScene);

  }

  requestAnimationFrame(animateScene);

  function makeEaseInOut(timing) {
    return function (timeFraction) {
      if (timeFraction < 0.5) {
        return timing(2 * timeFraction) / 2;
      } else {
        return (2 - timing(2 * (1 - timeFraction))) / 2;
      }
    };
  }

  function bounce(t) {
    return Math.abs(Math.sin(0.1 * t) * (10 - t));
  }

  const bounceEaseInOut = makeEaseInOut(bounce);

    function drawBackgroundCover(ctx, img, canvas) {
      const canvasRatio = canvas.width / canvas.height;
      const imgRatio = img.width / img.height;

      let drawWidth, drawHeight, offsetX, offsetY;

      if (canvasRatio > imgRatio) {
        drawWidth = canvas.width;
        drawHeight = canvas.width / imgRatio;
        offsetX = 0;
        offsetY = (canvas.height - drawHeight) / 2;
      } else {
        drawHeight = canvas.height;
        drawWidth = canvas.height * imgRatio;
        offsetX = (canvas.width - drawWidth) / 2;
        offsetY = 0;
      }

      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    }
});
