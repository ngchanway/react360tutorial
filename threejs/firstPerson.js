'use strict';

if (!WEBGL.isWebGLAvailable()) {
  document.body.appendChild(WEBGL.getWebGLErrorMessage());
}
let renderer, camera, scene;
let pointerLockControls, position;
// let orbitControls;

let clock = new THREE.Clock();
let dracoLoader = new THREE.DRACOLoader();
THREE.DRACOLoader.getDecoderModule();
THREE.DRACOLoader.setDecoderPath('.');
let stats = new Stats(); // stats

let blocker = document.getElementById('blocker');
let instructions = document.getElementById('instructions');
instructions.style.display = 'none';
let pageWrapper = document.getElementById('page-wrapper');
pageWrapper.style.display = 'none';

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let flyUp = false;
let flyDown = false;
// let canJump = false;
let boost = false;

let velocity = new THREE.Vector3();
let direction = new THREE.Vector3(); // direction of movements
let rotation = new THREE.Vector3(); // current camera direction

const speed = 500.0;
// const upSpeed = 200.0;
const eyeLevel = 10.0;
const geometryScale = 10;
const zoomFactor = 3;
const boostFactor = 3;
const pointSize = 3;

const container = document.createElement('div');
document.body.appendChild(container);

function initRender() {
  // camera
  camera = new THREE.PerspectiveCamera(50, window.innerWidth/window.innerHeight, 0.01, 2000);

  // scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);
  // scene.fog = new THREE.Fog(0xeeeeff, 0, 2000);
  // axes helper
  // scene.add(new THREE.AxesHelper(100));
  // control panel gui
  // createPanel();
  // lights
  scene.add(new THREE.AmbientLight());
  // addShadowedLight(0, 100, 10, 0xffffff, 1);
  // addShadowedLight(50, 100, -100, 0xeeeeee, 1);

  // renderer
  renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  // renderer.setClearColor(scene.fog.color);

  container.appendChild(renderer.domElement);
  window.addEventListener('resize', onWindowResize, false);
}
// function createPanel() {
//   let panel = new dat.GUI({width: 300});
//   let folder = panel.addFolder('Setting');
//   settings = {
//     'point size': pointSize,
//     'zoom factor': 3,
//     'boost factor': 3,
//     'speed': 500,
//     'geometry scale': 10
//   };
//   folder.add(settings, 'point size', 1, 30, 1).onChange(
//     (size) => {pointSize = size}
//   );
// }
function initControls() {
  // orbitControls = new THREE.OrbitControls(camera, renderer.domElement);
  pointerLockControls = new THREE.PointerLockControls(camera);
  pointerLockControls.getObject().position.y = eyeLevel;
  pointerLockControls.getObject().position.z = eyeLevel;

  instructions.addEventListener('click', () => {
    pointerLockControls.lock();
  }, false);
  pointerLockControls.addEventListener('lock', () => {
    instructions.style.display = 'none';
    blocker.style.display = 'none';
    // pageWrapper.style.display = 'none';
    container.appendChild(stats.dom);
  });
  pointerLockControls.addEventListener('unlock', () => {
    blocker.style.display = 'block';
    instructions.style.display = '';
    // pageWrapper.style.display = '';
    container.removeChild(stats.dom);
  });
  scene.add(pointerLockControls.getObject());

  const onKeyDown = event => {
    switch (event.keyCode) {
      case 38: // up
      case 87: // w
        moveForward = true;
        break;
      case 37: // left
      case 65: // a
        moveLeft = true;
        break;
      case 40: // down
      case 83: // s
        moveBackward = true;
        break;
      case 39: // right
      case 68: // d
        moveRight = true;
        break;
      case 81: // q
        flyUp = true;
        break;
      case 69: // e
        flyDown = true;
        break;
      // case 32: // space
      //   if (canJump == true) {
      //     velocity.y += upSpeed;
      //   }
      //   canJump = false;
      //   break;
      case 32: // space
        camera.zoom = zoomFactor;
        camera.updateProjectionMatrix();
        break;
      case 16: // shift
        boost = true;
        break;
    }
  };
  const onKeyUp = event => {
    switch (event.keyCode) {
      case 38: // up
      case 87: // w
        moveForward = false;
        break;
      case 37: // left
      case 65: // a
        moveLeft = false;
        break;
      case 40: // down
      case 83: // s
        moveBackward = false;
        break;
      case 39: // right
      case 68: // d
        moveRight = false;
        break;
      case 81: // q
        flyUp = false;
        break;
      case 69: // e
        flyDown = false;
        break;
      case 32: // space
        camera.zoom = 1;
        camera.updateProjectionMatrix();
        break;
      case 16: // shift
        boost = false;
        break;
    }
    console.log(
      'controls: ',
      pointerLockControls.getObject().position
    );
  };
  document.addEventListener('keydown', onKeyDown, false);
  document.addEventListener('keyup', onKeyUp, false);
}
function initModel() {
  // const floorGeometry = new THREE.PlaneBufferGeometry(10000, 10000, 100, 100);
  // floorGeometry.rotateX(-Math.PI/2);
  // // floorGeometry = floorGeometry.toNonIndexed();
  // position = floorGeometry.attributes.position;
  //
  // const floorMaterial = new THREE.MeshBasicMaterial({
  //   vertexColors: THREE.VertexColors,
  //   wireframe: true
  // });
  //
  // const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  // scene.add(floor);
  // floor.name = 'model';
  // dracoLoader.setVerbosity(1);
  dracoLoader.load(
    'globalShifted_pointCloud_for_viewing.drc',
    onDecode,
    function(xhr) {
      console.log((xhr.loaded/xhr.total*100) + '% loaded');
    },
    function(error) {
      console.log('An error happened');
      alert('Loading Error');
    }
  );
  dracoLoader.decodeDracoFile('globalShifted_pointCloud_for_viewing.drc', onDecode);
}
function addShadowedLight(x, y, z, color, intensity) {
  const directionalLight = new THREE.DirectionalLight(color, intensity);
  directionalLight.position.set(x, y, z);
  directionalLight.castShadow = true;
  scene.add(directionalLight);
}
function resizeGeometry(bufferGeometry) {
  let geometry, material;
  bufferGeometry.rotateX(-Math.PI/2);
  position = bufferGeometry.attributes.position;
  if (bufferGeometry.index) {
    bufferGeometry.computeVertexNormals();
    material = new THREE.MeshStandardMaterial({vertexColors: THREE.VertexColors});
    geometry = new THREE.Mesh(bufferGeometry, material);
  } else {
    // point cloud does not have face indices
    material = new THREE.PointsMaterial({
      vertexColors: THREE.VertexColors,
      size: pointSize
    });
    geometry = new THREE.Points(bufferGeometry, material);
  }
  // Compute range of the geometry coordinates for proper rendering.
  // bufferGeometry.computeBoundingBox();
  bufferGeometry.center();
  // const sizeX = bufferGeometry.boundingBox.max.x - bufferGeometry.boundingBox.min.x;
  // const sizeY = bufferGeometry.boundingBox.max.y - bufferGeometry.boundingBox.min.y;
  // const sizeZ = bufferGeometry.boundingBox.max.z - bufferGeometry.boundingBox.min.z;
  // const diagonalSize = Math.sqrt(sizeX*sizeX + sizeY*sizeY + sizeZ*sizeZ);
  // const scale = 1.0/diagonalSize;
  // const midX = (bufferGeometry.boundingBox.min.x + bufferGeometry.boundingBox.max.x)/2;
  // const midZ = (bufferGeometry.boundingBox.min.z + bufferGeometry.boundingBox.min.z)/2;

  // geometry.scale.multiplyScalar(scale);
  // geometry.position.x = -midX*scale;
  // geometry.position.y = -midY*scale;
  // geometry.position.z = -midZ*scale;
  // geometry.castShadow = true;
  // geometry.receiveShadow = true;
  geometry.scale.set(geometryScale, geometryScale, geometryScale);
  console.log(
    'geometry position: ',
    geometry.position.x,
    geometry.position.y,
    geometry.position.z
  );
  return geometry;
}
function onWindowResize() {
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
function init() {
  initRender();
  initControls();
  initModel();
}
function animate() {
  requestAnimationFrame(animate);
  stats.update();
  if (pointerLockControls.isLocked) {
    let control = pointerLockControls.getObject();

    const delta = clock.getDelta();

    velocity.x -= velocity.x*10.0*delta;
    velocity.z -= velocity.z*10.0*delta;
    velocity.y -= velocity.y*10.0*delta;
    // velocity.y -= 9.8*100.0*delta; // 100.0 = mass

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveLeft) - Number(moveRight);
    direction.y = Number(flyUp) - Number(flyDown);
    direction.normalize(); // this ensure consistent movements in all directions

    if (moveForward || moveBackward) {
      velocity.z -= direction.z*speed*delta*(1 + Number(boost)*boostFactor);
    }
    if (moveLeft || moveRight) {
      velocity.x -= direction.x*speed*delta*(1 + Number(boost)*boostFactor);
    }
    if (flyUp || flyDown) {
      velocity.y += direction.y*speed*delta*(1 + Number(boost)*boostFactor);
    }
    pointerLockControls.getObject().translateX(velocity.x*delta);
    pointerLockControls.getObject().translateZ(velocity.z*delta);
    pointerLockControls.getObject().translateY(velocity.y*delta);

    // if (pointerLockControls.getObject().position.y < eyeLevel) {
    //   velocity.y = 0;
    //   pointerLockControls.getObject().position.y = eyeLevel;
    //   canJump = true;
    // }
  }
  renderer.render(scene, camera);
}
function onDecode(bufferGeometry) {
  // const material = new THREE.MeshStandardMaterial({vertexColors: THREE.VertexColors});
  const geometry = resizeGeometry(bufferGeometry);
  // const selectedObject = scene.getObjectByName('model');
  // scene.remove(selectedObject);
  geometry.name = 'model';
  scene.add(geometry);
  instructions.style.display = '';
}
window.onload = () => {
  // const fileInput = document.getElementById('fileInput');
  // fileInput.onclick = () => this.value = '';
  // fileInput.addEventListener('change', e => {
  //   const file = fileInput.files[0];
  //   const reader = new FileReader();
  //   reader.onload = e => {
  //     // Enable logging to console output.
  //     dracoLoader.setVerbosity(1);
  //     dracoLoader.decodeDracoFile(reader.result, onDecode);
  //   }
  //   reader.readAsArrayBuffer(file);
  // });
  init();
  animate();
}
