// Variabel global untuk Three.js
let animationId = null;
let isAnimating = true;
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let currentObject = null; // Rename dari cube ke currentObject untuk lebih general
let scene, camera, renderer;
let isScaling = false;
let initialDistance = 0;
let objectScale = 1;
let currentShapeType = "cube"; // Menyimpan bentuk objek yang sedang aktif

document.getElementById("open-3d").addEventListener("click", () => {
    // Tampilkan canvas 3D
    document.querySelector(".drawing-board").style.display = "none";
    const container = document.getElementById("three-canvas-container");
    container.style.display = "block";
  
    // Tampilkan tombol kembali ke 2D dan stop animation
    document.getElementById("back-to-2d").style.display = "block";
    
    // Buat tombol toggle animasi jika belum ada
    if (!document.getElementById("toggle-animation")) {
        const toggleAnimBtn = document.createElement("button");
        toggleAnimBtn.id = "toggle-animation";
        toggleAnimBtn.textContent = "Stop Animation";
        toggleAnimBtn.style.position = "absolute";
        toggleAnimBtn.style.top = "10px";
        toggleAnimBtn.style.left = "10px";
        toggleAnimBtn.style.zIndex = "1000";
        container.appendChild(toggleAnimBtn);
        
        // Event listener untuk toggle animasi
        toggleAnimBtn.addEventListener("click", () => {
            toggleAnimation();
            toggleAnimBtn.textContent = isAnimating ? "Stop Animation" : "Start Animation";
        });
        
        // Menambahkan info kontrol keyboard
        const controlsInfo = document.createElement("div");
        controlsInfo.id = "controls-info";
        controlsInfo.innerHTML = `
            <p style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.5); 
                      color: white; padding: 10px; border-radius: 5px; font-size: 12px;">
                Kontrol Keyboard:<br>
                Arrow Keys: Geser objek<br>
                SHIFT + Drag: Ubah ukuran<br>
                WASD: Geser tambahan
            </p>
        `;
        container.appendChild(controlsInfo);
        
        // Tambahkan selector untuk bentuk 3D
        const shapeSelector = document.createElement("select");
        shapeSelector.id = "shape-selector";
        shapeSelector.style.position = "absolute";
        shapeSelector.style.top = "50px";
        shapeSelector.style.left = "10px";
        shapeSelector.style.zIndex = "1001"; // Tingkatkan z-index
        shapeSelector.innerHTML = `
            <option value="cube">Cube</option>
            <option value="pentagonal-prism">Prisma Pentagonal</option>
        `;
        container.appendChild(shapeSelector);
        
        // Event listener untuk perubahan bentuk
        // Pindahkan event listener langsung setelah elemen ditambahkan ke DOM
        shapeSelector.addEventListener("change", (e) => {
            e.stopPropagation(); // Menghentikan propagasi event
            changeShape(shapeSelector.value);
        });
        
        // Tambahkan event untuk click pada selector untuk mencegah propagasi
        shapeSelector.addEventListener("click", (e) => {
            e.stopPropagation(); // Mencegah event menyebar ke container
        });
        
        // Tambahkan event untuk mousedown pada selector untuk mencegah propagasi
        shapeSelector.addEventListener("mousedown", (e) => {
            e.stopPropagation(); // Mencegah event menyebar ke container dan memulai drag
        });
    } else {
        document.getElementById("toggle-animation").style.display = "block";
        document.getElementById("controls-info").style.display = "block";
        
        // Dapatkan shape selector dan pastikan terlihat
        const shapeSelector = document.getElementById("shape-selector");
        if (shapeSelector) {
            shapeSelector.style.display = "block";
            shapeSelector.style.zIndex = "1001"; // Tingkatkan z-index
        }
    }
  
    // Cegah inisialisasi ulang
    if (container.querySelector("canvas")) return;
  
    // Inisialisasi Three.js
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
  
    // Buat cube sebagai bentuk default
    createShape("cube");
  
    camera.position.z = 5;
  
    // Mouse events untuk rotasi objek - terapkan ke canvas saja
    const canvas = renderer.domElement;
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    
    // Touch events untuk mobile - terapkan ke canvas saja
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);
    
    // Keyboard events untuk menggeser objek
    window.addEventListener('keydown', onKeyDown);
    
    // Mulai animasi
    animate();
});

function animate() {
    animationId = requestAnimationFrame(animate);
    
    if (isAnimating && currentObject) {
        currentObject.rotation.x += 0.01;
        currentObject.rotation.y += 0.01;
    }
    
    renderer.render(scene, camera);
}

function toggleAnimation() {
    isAnimating = !isAnimating;
    
    if (!isAnimating && animationId) {
        // Tetap jalankan render loop tapi tanpa rotasi
        // Jangan cancelAnimationFrame karena kita masih butuh untuk update saat interaksi mouse
    }
}

function onMouseDown(event) {
    event.preventDefault();
    
    if (isAnimating) return; // Hanya bisa digerakkan jika animasi berhenti
    
    isDragging = true;
    previousMousePosition = {
        x: event.clientX,
        y: event.clientY
    };
}

function onMouseMove(event) {
    event.preventDefault();
    
    if (!isDragging || isAnimating || !currentObject) return;
    
    const deltaMove = {
        x: event.clientX - previousMousePosition.x,
        y: event.clientY - previousMousePosition.y
    };
    
    if (event.shiftKey) {
        // Jika shift ditekan, lakukan scaling
        const scaleFactor = 1 + deltaMove.y * 0.01;
        currentObject.scale.x *= scaleFactor;
        currentObject.scale.y *= scaleFactor;
        currentObject.scale.z *= scaleFactor;
        objectScale *= scaleFactor;
    } else {
        // Rotasi objek berdasarkan pergerakan mouse
        const deltaRotationQuaternion = new THREE.Quaternion()
            .setFromEuler(new THREE.Euler(
                deltaMove.y * 0.01,
                deltaMove.x * 0.01,
                0,
                'XYZ'
            ));
        
        currentObject.quaternion.multiplyQuaternions(deltaRotationQuaternion, currentObject.quaternion);
    }
    
    previousMousePosition = {
        x: event.clientX,
        y: event.clientY
    };
}

function onMouseUp() {
    isDragging = false;
}

// Touch event handlers untuk mobile
function onTouchStart(event) {
    event.preventDefault();
    
    if (isAnimating) return;
    
    if (event.touches.length === 1) {
        // Single touch for rotation
        isDragging = true;
        previousMousePosition = {
            x: event.touches[0].clientX,
            y: event.touches[0].clientY
        };
    } else if (event.touches.length === 2) {
        // Two fingers for pinch-to-scale
        isScaling = true;
        const dx = event.touches[0].clientX - event.touches[1].clientX;
        const dy = event.touches[0].clientY - event.touches[1].clientY;
        initialDistance = Math.sqrt(dx * dx + dy * dy);
    }
}

function onTouchMove(event) {
    event.preventDefault();
    
    if (isAnimating || !currentObject) return;
    
    if (isDragging && event.touches.length === 1) {
        const deltaMove = {
            x: event.touches[0].clientX - previousMousePosition.x,
            y: event.touches[0].clientY - previousMousePosition.y
        };
        
        // Rotasi objek berdasarkan pergerakan touch
        const deltaRotationQuaternion = new THREE.Quaternion()
            .setFromEuler(new THREE.Euler(
                deltaMove.y * 0.01,
                deltaMove.x * 0.01,
                0,
                'XYZ'
            ));
        
        currentObject.quaternion.multiplyQuaternions(deltaRotationQuaternion, currentObject.quaternion);
        
        previousMousePosition = {
            x: event.touches[0].clientX,
            y: event.touches[0].clientY
        };
    } else if (isScaling && event.touches.length === 2) {
        // Calculate new distance
        const dx = event.touches[0].clientX - event.touches[1].clientX;
        const dy = event.touches[0].clientY - event.touches[1].clientY;
        const newDistance = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate scale factor
        const scaleFactor = newDistance / initialDistance;
        initialDistance = newDistance;
        
        // Apply scaling
        currentObject.scale.x *= scaleFactor;
        currentObject.scale.y *= scaleFactor;
        currentObject.scale.z *= scaleFactor;
        objectScale *= scaleFactor;
    }
}

function onTouchEnd(event) {
    if (event.touches.length === 0) {
        isDragging = false;
        isScaling = false;
    } else if (event.touches.length === 1) {
        isScaling = false;
        // Update position for single touch
        previousMousePosition = {
            x: event.touches[0].clientX,
            y: event.touches[0].clientY
        };
    }
}

function onKeyDown(event) {
    // Hanya berfungsi jika animasi dihentikan
    if (isAnimating || !currentObject) return;
    
    const moveDistance = 0.1; // Jarak pergeseran (bisa diubah sesuai kebutuhan)
    
    switch(event.key) {
        case "ArrowLeft":
        case "a":
        case "A":
            currentObject.position.x -= moveDistance;
            break;
        case "ArrowRight":
        case "d":
        case "D":
            currentObject.position.x += moveDistance;
            break;
        case "ArrowUp":
        case "w":
        case "W":
            currentObject.position.y += moveDistance;
            break;
        case "ArrowDown":
        case "s":
        case "S":
            currentObject.position.y -= moveDistance;
            break;
        case "PageUp":
        case "q":
        case "Q":
            currentObject.position.z -= moveDistance;
            break;
        case "PageDown":
        case "e":
        case "E":
            currentObject.position.z += moveDistance;
            break;
    }
}

function createShape(shapeType) {
    // Hapus objek sebelumnya jika sudah ada
    if (currentObject) {
        scene.remove(currentObject);
    }
    
    let geometry;
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
    
    if (shapeType === "cube") {
        geometry = new THREE.BoxGeometry();
    } else if (shapeType === "pentagonal-prism") {
        // Buat prisma pentagonal
        geometry = createPentagonalPrismGeometry();
    }
    
    currentObject = new THREE.Mesh(geometry, material);
    scene.add(currentObject);
    currentShapeType = shapeType;
    
    return currentObject;
}

function createPentagonalPrismGeometry() {
    // Buat geometri prisma pentagonal
    const geometry = new THREE.Geometry();
    
    // Radius pentagon
    const radius = 1;
    const height = 2;
    
    // Titik-titik pentagon di bagian bawah (y = -height/2)
    for (let i = 0; i < 5; i++) {
        const angle = (Math.PI * 2 / 5) * i;
        const x = radius * Math.cos(angle);
        const z = radius * Math.sin(angle);
        geometry.vertices.push(new THREE.Vector3(x, -height/2, z));
    }
    
    // Titik-titik pentagon di bagian atas (y = height/2)
    for (let i = 0; i < 5; i++) {
        const angle = (Math.PI * 2 / 5) * i;
        const x = radius * Math.cos(angle);
        const z = radius * Math.sin(angle);
        geometry.vertices.push(new THREE.Vector3(x, height/2, z));
    }
    
    // Faces untuk pentagon bawah
    geometry.faces.push(new THREE.Face3(0, 1, 2));
    geometry.faces.push(new THREE.Face3(0, 2, 3));
    geometry.faces.push(new THREE.Face3(0, 3, 4));
    
    // Faces untuk pentagon atas
    geometry.faces.push(new THREE.Face3(5, 7, 6));
    geometry.faces.push(new THREE.Face3(5, 8, 7));
    geometry.faces.push(new THREE.Face3(5, 9, 8));
    
    // Faces untuk sisi-sisi prisma
    for (let i = 0; i < 5; i++) {
        const j = (i + 1) % 5;
        
        // Sisi terdiri dari dua segitiga
        geometry.faces.push(new THREE.Face3(i, j, i + 5));
        geometry.faces.push(new THREE.Face3(j, j + 5, i + 5));
    }
    
    geometry.computeFaceNormals();
    
    return geometry;
}

function changeShape(shapeType) {
    // Simpan posisi dan rotasi objek sebelumnya
    const oldPosition = currentObject ? currentObject.position.clone() : new THREE.Vector3(0, 0, 0);
    const oldRotation = currentObject ? currentObject.rotation.clone() : new THREE.Euler(0, 0, 0);
    const oldScale = currentObject ? currentObject.scale.clone() : new THREE.Vector3(1, 1, 1);
    
    // Buat objek baru dengan bentuk yang dipilih
    createShape(shapeType);
    
    // Terapkan posisi dan rotasi dari objek sebelumnya
    currentObject.position.copy(oldPosition);
    currentObject.rotation.copy(oldRotation);
    currentObject.scale.copy(oldScale);
}

document.getElementById("back-to-2d").addEventListener("click", () => {
    document.querySelector(".drawing-board").style.display = "block";
    document.getElementById("three-canvas-container").style.display = "none";
    document.getElementById("back-to-2d").style.display = "none";
    
    // Sembunyikan tombol toggle animasi dan info kontrol
    const toggleAnimBtn = document.getElementById("toggle-animation");
    if (toggleAnimBtn) toggleAnimBtn.style.display = "none";
    
    const controlsInfo = document.getElementById("controls-info");
    if (controlsInfo) controlsInfo.style.display = "none";
    
    // Reset status animasi
    isAnimating = true;
    
    // Hapus event listener keyboard saat kembali ke 2D
    window.removeEventListener('keydown', onKeyDown);
});
