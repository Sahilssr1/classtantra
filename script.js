// Google Login Handling
function handleCredentialResponse(response) {
  try {
    const data = jwt_decode(response.credential);
    console.log("Google User:", data);

    // Store user info in localStorage
    localStorage.setItem('user', JSON.stringify(data));

    // Update navbar with user info
    document.getElementById("navbar-links").innerHTML = `
      <div class="user-info" style="display:flex;align-items:center;gap:10px;">
        <img src="${data.picture}" alt="User" style="width:28px;height:28px;border-radius:50%;" />
        <span>Hi, ${data.given_name}</span>
        <a href="#" onclick="logout()">Logout</a>
      </div>
    `;

    // Redirect to dashboard
    window.location.href = "dashboard.html";
  } catch (error) {
    console.error("Error handling Google credential:", error);
    alert("Failed to sign in. Please try again.");
  }
}

//new message 

document.querySelector('.whatsapp-btn').addEventListener('click', () => {
  alert('You’ll be redirected to WhatsApp. After sending your demo request, we’ll ask for your name, role (student, YouTuber, etc.), and YouTube channel details if applicable.');
});

function logout() {
  try {
    google.accounts.id.disableAutoSelect();
    localStorage.removeItem('user');
    window.location.href = "index.html";
  } catch (error) {
    console.error("Error during logout:", error);
    window.location.href = "index.html";
  }
}

// Redirect to login if not signed in
document.addEventListener('DOMContentLoaded', () => {
  const user = localStorage.getItem('user');
  if (!user && window.location.pathname.includes('dashboard.html')) {
    window.location.href = 'index.html';
  }
});

// Canvas Animation
// ----- Utils ----- //
function extend(a, b) {
  for (var prop in b) {
    a[prop] = b[prop];
  }
  return a;
}

function modulo(num, div) {
  return ((num % div) + div) % div;
}

function normalizeAngle(angle) {
  return modulo(angle, Math.PI * 2);
}

function line(ctx, a, b) {
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.closePath();
}

// ----- Vector ----- //
function Vector(x, y) {
  this.x = x || 0;
  this.y = y || 0;
}

Vector.prototype.set = function(v) {
  this.x = v.x;
  this.y = v.y;
};

Vector.prototype.setCoords = function(x, y) {
  this.x = x;
  this.y = y;
};

Vector.prototype.add = function(v) {
  this.x += v.x;
  this.y += v.y;
};

Vector.prototype.subtract = function(v) {
  this.x -= v.x;
  this.y -= v.y;
};

Vector.prototype.scale = function(s) {
  this.x *= s;
  this.y *= s;
};

Vector.prototype.multiply = function(v) {
  this.x *= v.x;
  this.y *= v.y;
};

Object.defineProperty(Vector.prototype, 'magnitude', {
  get: function() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
});

Vector.prototype.equals = function(v) {
  return this.x == v.x && this.y == v.y;
};

Vector.prototype.zero = function() {
  this.x = 0;
  this.y = 0;
};

Vector.prototype.block = function(size) {
  this.x = Math.floor(this.x / size);
  this.y = Math.floor(this.y / size);
};

Object.defineProperty(Vector.prototype, 'angle', {
  get: function() {
    return normalizeAngle(Math.atan2(this.y, this.x));
  }
});

Vector.subtract = function(a, b) {
  return new Vector(a.x - b.x, a.y - b.y);
};

Vector.add = function(a, b) {
  return new Vector(a.x + b.x, a.y + b.y);
};

Vector.copy = function(v) {
  return new Vector(v.x, v.y);
};

Vector.getDistance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
};

Vector.addDistance = function(vector, distance, angle) {
  var x = vector.x + Math.cos(angle) * distance;
  var y = vector.y + Math.sin(angle) * distance;
  return new Vector(x, y);
};

// ----- Particle ----- //
function Particle(x, y) {
  this.position = new Vector(x, y);
  this.previousPosition = new Vector(x, y);
}

Particle.prototype.update = function(friction, gravity) {
  var velocity = Vector.subtract(this.position, this.previousPosition);
  velocity.scale(friction);
  this.previousPosition = Vector.copy(this.position);
  this.position.add(velocity);
  this.position.add(gravity);
};

Particle.prototype.render = function(ctx) {
  ctx.fillStyle = 'hsla(0, 0%, 10%, 0.5)';
  circle(ctx, this.position.x, this.position.y, 4);
};

function circle(ctx, x, y, radius) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.closePath();
}

// ----- StickConstraint ----- //
function StickConstraint(particleA, particleB, distance) {
  this.particleA = particleA;
  this.particleB = particleB;
  if (distance) {
    this.distance = distance;
  } else {
    var delta = Vector.subtract(particleA.position, particleB.position);
    this.distance = delta.magnitude;
  }
  this.distanceSqrd = this.distance * this.distance;
}

StickConstraint.prototype.update = function() {
  var delta = Vector.subtract(this.particleA.position, this.particleB.position);
  var mag = delta.magnitude;
  var scale = (this.distance - mag) / mag * 0.5;
  delta.scale(scale);
  this.particleA.position.add(delta);
  this.particleB.position.subtract(delta);
};

StickConstraint.prototype.render = function(ctx) {
  ctx.strokeStyle = 'hsla(200, 100%, 50%, 0.5)';
  ctx.lineWidth = 2;
  line(ctx, this.particleA.position, this.particleB.position);
};

// ----- ChainLinkConstraint ----- //
function ChainLinkConstraint(particleA, particleB, distance, shiftEase) {
  this.particleA = particleA;
  this.particleB = particleB;
  this.distance = distance;
  this.distanceSqrd = distance * distance;
  this.shiftEase = shiftEase === undefined ? 0.85 : shiftEase;
}

ChainLinkConstraint.prototype.update = function() {
  var delta = Vector.subtract(this.particleA.position, this.particleB.position);
  var deltaMagSqrd = delta.x * delta.x + delta.y * delta.y;
  if (deltaMagSqrd <= this.distanceSqrd) {
    return;
  }
  var newPosition = Vector.addDistance(this.particleA.position, this.distance, delta.angle + Math.PI);
  var shift = Vector.subtract(newPosition, this.particleB.position);
  shift.scale(this.shiftEase);
  this.particleB.previousPosition.add(shift);
  this.particleB.position.set(newPosition);
};

ChainLinkConstraint.prototype.render = function(ctx) {
  ctx.strokeStyle = 'hsla(200, 100%, 50%, 0.5)';
  ctx.lineWidth = 2;
  line(ctx, this.particleA.position, this.particleB.position);
};

// ----- LinkConstraint ----- //
function LinkConstraint(particleA, particleB, distance) {
  this.particleA = particleA;
  this.particleB = particleB;
  this.distance = distance;
  this.distanceSqrd = distance * distance;
}

LinkConstraint.prototype.update = function() {
  var delta = Vector.subtract(this.particleA.position, this.particleB.position);
  var deltaMagSqrd = delta.x * delta.x + delta.y * delta.y;
  if (deltaMagSqrd <= this.distanceSqrd) {
    return;
  }
  var mag = delta.magnitude;
  var scale = (this.distance - mag) / mag * 0.5;
  delta.scale(scale);
  this.particleA.position.add(delta);
  this.particleB.position.subtract(delta);
};

LinkConstraint.prototype.render = function(ctx) {
  ctx.strokeStyle = 'hsla(200, 100%, 50%, 0.5)';
  ctx.lineWidth = 2;
  line(ctx, this.particleA.position, this.particleB.position);
};

// ----- PinConstraint ----- //
function PinConstraint(particle, position) {
  this.particle = particle;
  this.position = position;
}

PinConstraint.prototype.update = function() {
  this.particle.position = Vector.copy(this.position);
};

PinConstraint.prototype.render = function() {};

// ----- Ribbon ----- //
function Ribbon(props) {
  extend(this, props);
  this.particles = [];
  this.constraints = [];
  var x = this.controlPoint.x + this.width / 2;
  var leftParticles = this.leftParticles = this.createParticles(x);
  x = this.controlPoint.x - this.width / 2;
  var rightParticles = this.rightParticles = this.createParticles(x);
  var stick = new StickConstraint(leftParticles[0], rightParticles[0], this.width);
  this.constraints.push(stick);
  this.controlParticle = new Particle(this.controlPoint.x, this.controlPoint.y);
  var pin = new PinConstraint(this.controlParticle, this.controlPoint);
  this.constraints.push(pin);
  var leftLink = new LinkConstraint(this.controlParticle, leftParticles[0], this.width / 2);
  var rightLink = new LinkConstraint(this.controlParticle, rightParticles[0], this.width / 2);
  this.constraints.push(leftLink);
  this.constraints.push(rightLink);
  for (var i = 1, len = leftParticles.length; i < len; i++) {
    var link = new LinkConstraint(leftParticles[i], rightParticles[i], this.width);
    this.constraints.push(link);
  }
}

Ribbon.prototype.createParticles = function(x) {
  var particles = [];
  for (var i = 0; i < this.sections; i++) {
    var y = this.controlPoint.y + this.sectionLength * i;
    var particle = new Particle(x, y);
    particles.push(particle);
    this.particles.push(particle);
    if (i > 0) {
      var link = new ChainLinkConstraint(particles[i - 1], particle, this.sectionLength, this.chainLinkShiftEase);
      this.constraints.push(link);
    }
  }
  return particles;
};

Ribbon.prototype.update = function() {
  var i, len;
  for (i = 0, len = this.particles.length; i < len; i++) {
    this.particles[i].update(this.friction, this.gravity);
  }
  for (i = 0, len = this.constraints.length; i < len; i++) {
    this.constraints[i].update();
  }
  for (i = 0, len = this.constraints.length; i < len; i++) {
    this.constraints[i].update();
  }
};

Ribbon.prototype.render = function(ctx) {
  ctx.fillStyle = '#E11';
  ctx.strokeStyle = '#E11';
  for (var i = 0, len = this.leftParticles.length - 1; i < len; i++) {
    ctx.beginPath();
    var particle0 = this.leftParticles[i];
    ctx.moveTo(particle0.position.x, particle0.position.y);
    var particle = this.rightParticles[i];
    ctx.lineTo(particle.position.x, particle.position.y);
    particle = this.rightParticles[i + 1];
    ctx.lineTo(particle.position.x, particle.position.y);
    particle = this.leftParticles[i + 1];
    ctx.lineTo(particle.position.x, particle.position.y);
    ctx.lineTo(particle0.position.x, particle0.position.y);
    ctx.stroke();
    ctx.fill();
    ctx.closePath();
  }
};

// ----- Canvas Setup ----- //
var canvas = document.getElementById('ribbon-canvas');
if (canvas && canvas.getContext) {
  var ctx = canvas.getContext('2d');

  // Set canvas size to match its container
  function resizeCanvas() {
    var rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  // Initial resize
  resizeCanvas();

  // Resize canvas on window resize
  window.addEventListener('resize', resizeCanvas);

  var canvasOffsetLeft, canvasOffsetTop;

  function updateCanvasOffset() {
    var rect = canvas.getBoundingClientRect();
    canvasOffsetLeft = rect.left;
    canvasOffsetTop = rect.top;
  }

  updateCanvasOffset();
  window.addEventListener('resize', updateCanvasOffset);

  canvas.addEventListener('mousedown', onMousedown, false);

  var friction = 0.75;
  var gravity = new Vector(0, 0.4);
  var movementStrength = 0.9;
  var springStrength = 0.5;

  var follicles = [];
  var pins = [];

  var ribbon = new Ribbon({
    controlPoint: new Vector(canvas.width / window.devicePixelRatio / 2, canvas.height / window.devicePixelRatio / 2),
    sections: 30, // Reduced for mobile performance
    width: 30,
    sectionLength: 8,
    friction: 0.92,
    gravity: new Vector(0, 0.2),
    chainLinkShiftEase: 0.9
  });

  var didMouseDown = false;
  var rotateAngle = 0;
  var rotateSpeed = 0.06;

  function update() {
    ribbon.update();
    if (!didMouseDown) {
      rotateAngle += rotateSpeed;
      var x = (canvas.width / window.devicePixelRatio / 2) + Math.cos(rotateAngle * 1.3) * (canvas.height / window.devicePixelRatio / 4);
      var y = (canvas.height / window.devicePixelRatio / 2) + Math.sin(rotateAngle) * (canvas.height / window.devicePixelRatio / 4);
      move(x, y);
    }
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ribbon.render(ctx);
  }

  function animate() {
    update();
    render();
    requestAnimationFrame(animate);
  }

  animate();

  function onMousedown(event) {
    event.preventDefault();
    moveDragPoint(event);
    didMouseDown = true;
    window.addEventListener('mousemove', moveDragPoint, false);
    window.addEventListener('mouseup', onMouseup, false);
    canvas.addEventListener('touchstart', onTouchstart, false);
  }

  function onTouchstart(event) {
    event.preventDefault();
    moveDragPoint(event.touches[0]);
    didMouseDown = true;
    window.addEventListener('touchmove', onTouchmove, false);
    window.addEventListener('touchend', onTouchend, false);
  }

  function onTouchmove(event) {
    event.preventDefault();
    moveDragPoint(event.touches[0]);
  }

  function onTouchend() {
    window.removeEventListener('touchmove', onTouchmove, false);
    window.removeEventListener('touchend', onTouchend, false);
    didMouseDown = false;
  }

  function moveDragPoint(event) {
    var x = parseInt(event.pageX - canvasOffsetLeft, 10) / window.devicePixelRatio;
    var y = parseInt(event.pageY - canvasOffsetTop, 10) / window.devicePixelRatio;
    move(x, y);
  }

  function move(x, y) {
    ribbon.controlPoint.setCoords(x, y);
  }

  function onMouseup() {
    window.removeEventListener('mousemove', moveDragPoint, false);
    window.removeEventListener('mouseup', onMouseup, false);
    didMouseDown = false;
  }
}