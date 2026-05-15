import * as THREE from 'three';

let scene, camera, renderer, player;
let gameActive = true;
let coins = 0, distance = 0, speed = 0.6;
const lanes = [-3, 0, 3];
let currentLane = 1;
let obstacles = [], coinObjects = [], environment = [];

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 20, 100);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 2, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(5, 15, 5);
    scene.add(sun);

    // Wide Ground
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(500, 2000),
        new THREE.MeshStandardMaterial({ color: 0x888888 })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // Rails
    lanes.forEach(l => {
        const railMat = new THREE.MeshStandardMaterial({color: 0x333333});
        const r1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 2000), railMat);
        r1.position.set(l - 0.6, 0.05, 0);
        scene.add(r1);
        const r2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 2000), railMat);
        r2.position.set(l + 0.6, 0.05, 0);
        scene.add(r2);
    });

    // Player
    player = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), new THREE.MeshStandardMaterial({color: 0x3498db}));
    player.position.y = 1;
    scene.add(player);

    // Swipe Controls
    let startX = 0;
    window.addEventListener('touchstart', e => startX = e.touches[0].clientX);
    window.addEventListener('touchend', e => {
        let diff = startX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) {
            if (diff > 0 && currentLane > 0) currentLane--;
            else if (diff < 0 && currentLane < 2) currentLane++;
        }
    });

    spawnLoop();
    envLoop();
    animate();
}

function createTrain() {
    const train = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.2, 14), new THREE.MeshStandardMaterial({ color: 0xcccccc }));
    train.add(body);
    const win = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 0.1), new THREE.MeshBasicMaterial({ color: 0x222222 }));
    win.position.set(0, 0.6, 7.01);
    train.add(win);
    return train;
}

function spawnLoop() {
    if (!gameActive) return;
    const lane = lanes[Math.floor(Math.random() * 3)];
    if (Math.random() > 0.45) {
        const train = createTrain();
        train.position.set(lane, 1.6, -100);
        scene.add(train);
        obstacles.push(train);
    } else {
        const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,0.1,16), new THREE.MeshStandardMaterial({color: 0xffcc00}));
        coin.rotation.x = Math.PI/2;
        coin.position.set(lane, 1.2, -80);
        scene.add(coin);
        coinObjects.push(coin);
    }
    setTimeout(spawnLoop, 1000 - Math.min(distance / 10, 500));
}

function envLoop() {
    if (!gameActive) return;
    const side = Math.random() > 0.5 ? 1 : -1;
    let item;
    if (Math.random() > 0.7) {
        item = new THREE.Mesh(new THREE.ConeGeometry(8, 12, 4), new THREE.MeshStandardMaterial({color: 0x777777}));
        item.position.set(side * 25, 6, -150);
    } else {
        item = new THREE.Group();
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1), new THREE.MeshStandardMaterial({color: 0x8B4513}));
        const leaves = new THREE.Mesh(new THREE.ConeGeometry(1, 2, 8), new THREE.MeshStandardMaterial({color: 0x228B22}));
        leaves.position.y = 1; item.add(trunk); item.add(leaves);
        item.position.set(side * 8, 0.5, -150);
    }
    scene.add(item);
    environment.push(item);
    setTimeout(envLoop, 400);
}

function animate() {
    requestAnimationFrame(animate);
    if (!gameActive) return;

    player.position.x = THREE.MathUtils.lerp(player.position.x, lanes[currentLane], 0.15);
    distance += 0.2;
    document.getElementById('distance').innerText = Math.floor(distance);

    [obstacles, coinObjects, environment].forEach(list => {
        for (let i = list.length - 1; i >= 0; i--) {
            list[i].position.z += speed;
            if (list[i].position.z > 20) {
                scene.remove(list[i]);
                list.splice(i, 1);
            }
        }
    });

    obstacles.forEach(obj => {
        if (Math.abs(obj.position.z - player.position.z) < 7 && Math.abs(obj.position.x - player.position.x) < 1.6) {
            gameActive = false;
            document.getElementById('game-over').style.display = 'block';
        }
    });

    coinObjects.forEach((coin, i) => {
        if (Math.abs(coin.position.z - player.position.z) < 1.5 && Math.abs(coin.position.x - player.position.x) < 1.5) {
            coins += 10;
            document.getElementById('coin-count').innerText = coins;
            scene.remove(coin);
            coinObjects.splice(i, 1);
        }
    });

    renderer.render(scene, camera);
}

window.resetGame = function() {
    [obstacles, coinObjects, environment].forEach(list => list.forEach(o => scene.remove(o)));
    obstacles = []; coinObjects = []; environment = [];
    distance = 0; coins = 0; currentLane = 1;
    document.getElementById('coin-count').innerText = "0";
    document.getElementById('game-over').style.display = 'none';
    gameActive = true;
    spawnLoop();
    envLoop();
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

init();
