const canvas = document.getElementById("screenCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}

function drawScanlines() {
  ctx.fillStyle = "rgba(0,0,0,0.2)";
  for (let i = 0; i < canvas.height; i += 2) {
    ctx.fillRect(0, i, canvas.width, 1);
  }
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawScanlines();
  requestAnimationFrame(animate);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
animate();
