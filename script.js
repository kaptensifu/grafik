const canvas = document.querySelector("canvas"),
    toolBtns = document.querySelectorAll(".tool"),
    fillColor = document.querySelector("#fill-color"),
    sizeSlider = document.querySelector("#size-slider"),
    colorBtns = document.querySelectorAll(".colors .option"),
    colorPicker = document.querySelector("#color-picker"),
    clearCanvas = document.querySelector(".clear-canvas"),
    saveImg = document.querySelector(".save-img"),
    deleteSelectedBtn = document.querySelector(".delete-selected"),
    textInput = document.querySelector("#text-input"),
    textSizeInput = document.querySelector("#text-size"),
    addTextBtn = document.querySelector(".add-text"),
    ctx = canvas.getContext("2d");

let isDrawing = false,
    selectedTool = "brush",
    brushWidth = 5,
    selectedColor = "#000",
    shapes = [],
    currentShape = null,
    dragging = false,
    resizing = false,
    dragOffsetX = 0,
    dragOffsetY = 0,
    resizeStart = { x: 0, y: 0 },
    doubleTappedShape = null; // Menambahkan variabel untuk shape yang di-double tap

// Menambahkan variabel untuk menyimpan waktu double tap
let lastTap = 0;

window.addEventListener("load", () => {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    drawAllShapes();
});

function drawAllShapes() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let shape of shapes) {
        ctx.beginPath();
        ctx.lineWidth = shape.lineWidth || 2;
        ctx.strokeStyle = shape.color;
        ctx.fillStyle = shape.color;

        switch (shape.type) {
            case "rectangle":
                shape.fill ? ctx.fillRect(shape.x, shape.y, shape.width, shape.height)
                    : ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
                break;
            case "circle":
                ctx.arc(shape.x, shape.y, shape.radius, 0, Math.PI * 2);
                shape.fill ? ctx.fill() : ctx.stroke();
                break;
            case "triangle":
                ctx.moveTo(shape.x, shape.y);
                ctx.lineTo(shape.x2, shape.y2);
                ctx.lineTo(shape.x3, shape.y3);
                ctx.closePath();
                shape.fill ? ctx.fill() : ctx.stroke();
                break;
            case "text":
                ctx.font = `${shape.fontSize}px Arial`; // Set font size
                ctx.fillText(shape.text, shape.x, shape.y);
                break;
            case "brush":
                ctx.beginPath();
                ctx.lineWidth = shape.lineWidth;
                ctx.lineJoin = "round";
                ctx.lineCap = "round";
                ctx.strokeStyle = shape.color;
                ctx.moveTo(shape.points[0].x, shape.points[0].y);
                for (let i = 1; i < shape.points.length; i++) {
                    ctx.lineTo(shape.points[i].x, shape.points[i].y);
                }
                ctx.stroke();
                break;
        }

        // Menampilkan tanda untuk shape yang di-double tap
        if (shape === doubleTappedShape) {
            ctx.strokeStyle = "red";
            ctx.lineWidth = 2;

            if (shape.type === "rectangle") {
                ctx.strokeRect(shape.x - 5, shape.y - 5, shape.width + 10, shape.height + 10);

                // Tambahkan titik-titik di sudut
                ctx.fillStyle = "red";
                ctx.fillRect(shape.x - 5, shape.y - 5, 10, 10); // top-left
                ctx.fillRect(shape.x + shape.width - 5, shape.y - 5, 10, 10); // top-right
                ctx.fillRect(shape.x - 5, shape.y + shape.height - 5, 10, 10); // bottom-left
            } else if (shape.type === "circle") {
                ctx.beginPath();
                ctx.arc(shape.x, shape.y, shape.radius + 5, 0, Math.PI * 2);
                ctx.stroke();

                // Tambahkan titik di pusat lingkaran
                ctx.fillStyle = "red";
                ctx.beginPath();
                ctx.arc(shape.x, shape.y, 5, 0, Math.PI * 2);
                ctx.fill();
            } else if (shape.type === "triangle") {
                ctx.beginPath();
                ctx.moveTo(shape.x - 5, shape.y - 5);
                ctx.lineTo(shape.x2 + 5, shape.y2 + 5);
                ctx.lineTo(shape.x3 - 5, shape.y3 + 5);
                ctx.closePath();
                ctx.stroke();

                // Tambahkan titik di setiap sudut
                ctx.fillStyle = "red";
                ctx.fillRect(shape.x - 5, shape.y - 5, 10, 10);
                ctx.fillRect(shape.x2 - 5, shape.y2 - 5, 10, 10);
                ctx.fillRect(shape.x3 - 5, shape.y3 - 5, 10, 10);
            } else if (shape.type === "text") {
                ctx.font = `${shape.fontSize}px Arial`;
                const textWidth = ctx.measureText(shape.text).width;
                ctx.strokeRect(shape.x - 5, shape.y - shape.fontSize - 5, textWidth + 10, shape.fontSize + 10);

                // Tambahkan titik di sudut
                ctx.fillStyle = "red";
                ctx.fillRect(shape.x - 5, shape.y - shape.fontSize - 5, 10, 10); // top-left
            } else if (shape.type === "brush") {
                // Untuk brush, tandai titik awal dan akhir
                ctx.fillStyle = "red";
                ctx.beginPath();
                ctx.arc(shape.points[0].x, shape.points[0].y, 5, 0, Math.PI * 2);
                ctx.fill();

                ctx.beginPath();
                ctx.arc(shape.points[shape.points.length - 1].x, shape.points[shape.points.length - 1].y, 5, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Menampilkan kotak biru kanan bawah untuk shape yang dipilih
        if (shape === currentShape) {
            ctx.fillStyle = "blue";
            if (shape.type === "rectangle") {
                ctx.fillRect(shape.x + shape.width - 5, shape.y + shape.height - 5, 10, 10);
            } else if (shape.type === "circle") {
                ctx.fillRect(shape.x + shape.radius - 5, shape.y + shape.radius - 5, 10, 10);
            } else if (shape.type === "triangle") {
                ctx.fillRect(shape.x2 - 5, shape.y2 - 5, 10, 10);
            } else if (shape.type === "text") {
                ctx.fillRect(shape.x - 5, shape.y - shape.fontSize, 10, 10);
            }
        }
    }
}

function getShapeAt(x, y) {
    for (let i = shapes.length - 1; i >= 0; i--) {
        const s = shapes[i];
        if (s.type === "rectangle") {
            if (x >= s.x + s.width - 5 && x <= s.x + s.width + 5 &&
                y >= s.y + s.height - 5 && y <= s.y + s.height + 5) {
                return { shape: s, index: i, resize: true };
            }
            if (x >= s.x && x <= s.x + s.width && y >= s.y && y <= s.y + s.height) {
                return { shape: s, index: i };
            }
        } else if (s.type === "circle") {
            const dx = x - s.x, dy = y - s.y;
            if (Math.sqrt(dx * dx + dy * dy) <= s.radius) {
                return { shape: s, index: i };
            }
            if (x >= s.x + s.radius - 5 && x <= s.x + s.radius + 5 &&
                y >= s.y + s.radius - 5 && y <= s.y + s.radius + 5) {
                return { shape: s, index: i, resize: true };
            }
        } else if (s.type === "triangle") {
            const dx = x - s.x2;
            const dy = y - s.y2;
            if (Math.abs(dx) <= 10 && Math.abs(dy) <= 10) {
                return { shape: s, index: i, resize: true };
            }
            const minX = Math.min(s.x, s.x2, s.x3), maxX = Math.max(s.x, s.x2, s.x3);
            const minY = Math.min(s.y, s.y2, s.y3), maxY = Math.max(s.y, s.y2, s.y3);
            if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
                return { shape: s, index: i };
            }
        } else if (s.type === "text") {
            ctx.font = `${s.fontSize}px Arial`;
            const textWidth = ctx.measureText(s.text).width;
            if (x >= s.x && x <= s.x + textWidth && y >= s.y - s.fontSize && y <= s.y) {
                return { shape: s, index: i };
            }
        } else if (s.type === "brush") {
            // Peningkatan deteksi untuk brush - cek jalur brush dengan toleransi lebih tinggi
            let detected = false;

            // Jika brush, cek semua titik dengan toleransi yang lebih besar
            for (let j = 0; j < s.points.length; j++) {
                const point = s.points[j];
                const dx = x - point.x;
                const dy = y - point.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Meningkatkan radius deteksi untuk brush
                if (distance < 8) { // Radius deteksi lebih besar
                    return { shape: s, index: i };
                }

                // Jika ada titik berikutnya, cek juga garis di antara titik-titik
                if (j < s.points.length - 1) {
                    const nextPoint = s.points[j + 1];

                    // Cek apakah point berada dekat dengan garis antara dua titik
                    // Menggunakan algoritma distance point to line segment
                    const lineLength = Math.sqrt(
                        Math.pow(nextPoint.x - point.x, 2) +
                        Math.pow(nextPoint.y - point.y, 2)
                    );

                    if (lineLength > 0) {
                        const t = (
                            (x - point.x) * (nextPoint.x - point.x) +
                            (y - point.y) * (nextPoint.y - point.y)
                        ) / (lineLength * lineLength);

                        if (t >= 0 && t <= 1) {
                            const projX = point.x + t * (nextPoint.x - point.x);
                            const projY = point.y + t * (nextPoint.y - point.y);

                            const distToLine = Math.sqrt(
                                Math.pow(x - projX, 2) +
                                Math.pow(y - projY, 2)
                            );

                            if (distToLine < 5) {
                                return { shape: s, index: i };
                            }
                        }
                    }
                }
            }
        }
    }
    return null;
}

canvas.addEventListener("mousedown", (e) => {
    const x = e.offsetX, y = e.offsetY;
    const found = getShapeAt(x, y);

    if (found) {
        currentShape = found.shape; // Set currentShape ke shape yang ditemukan
        if (found.resize) {
            resizing = true;
            resizeStart.x = x;
            resizeStart.y = y;
        } else {
            dragging = true;
            dragOffsetX = x - currentShape.x;
            dragOffsetY = y - currentShape.y;
        }
    } else {
        if (selectedTool === "brush") {
            const toolObj = {
                type: "brush",
                points: [{ x, y }],
                color: selectedColor,
                lineWidth: brushWidth
            };
            currentShape = toolObj;
            shapes.push(toolObj); // Simpan garis ke dalam shapes
            isDrawing = true;
        } else if (selectedTool === "text") {
            const shape = {
                type: "text",
                x, y,
                text: textInput.value,
                fontSize: parseInt(textSizeInput.value) || 16, // Get font size from input
                color: selectedColor,
                lineWidth: brushWidth
            };
            currentShape = shape;
            shapes.push(shape);
            drawAllShapes();
        } else {
            isDrawing = true;
            const shape = {
                type: selectedTool,
                x, y,
                width: 0,
                height: 0,
                radius: 0,
                fill: fillColor.checked,
                color: selectedColor,
                lineWidth: brushWidth
            };
            if (selectedTool === "triangle") {
                shape.x2 = x;
                shape.y2 = y;
                shape.x3 = x;
                shape.y3 = y;
            }
            currentShape = shape;
            shapes.push(shape);
        }
    }
});

canvas.addEventListener("mousemove", (e) => {
    const x = e.offsetX, y = e.offsetY;

    if (resizing && currentShape) {
        if (currentShape.type === "rectangle") {
            currentShape.width = x - currentShape.x;
            currentShape.height = y - currentShape.y;
        } else if (currentShape.type === "circle") {
            const dx = x - currentShape.x;
            const dy = y - currentShape.y;
            currentShape.radius = Math.sqrt(dx * dx + dy * dy);
        } else if (currentShape.type === "triangle") {
            currentShape.x2 = x;
            currentShape.y2 = y;
            currentShape.x3 = 2 * currentShape.x - x;
            currentShape.y3 = y;
        }
        drawAllShapes();
        return;
    }

    if (dragging && currentShape) {
        const dx = x - dragOffsetX - currentShape.x;
        const dy = y - dragOffsetY - currentShape.y;

        if (currentShape.type === "triangle") {
            currentShape.x += dx;
            currentShape.y += dy;
            currentShape.x2 += dx;
            currentShape.y2 += dy;
            currentShape.x3 += dx;
            currentShape.y3 += dy;
        } else {
            currentShape.x = x - dragOffsetX;
            currentShape.y = y - dragOffsetY;
        }

        drawAllShapes();
        return;
    }

    if (isDrawing && currentShape) {
        const dx = x - currentShape.x;
        const dy = y - currentShape.y;

        if (selectedTool === "brush") {
            currentShape.points.push({ x, y });
        } else if (currentShape.type === "rectangle") {
            currentShape.width = dx;
            currentShape.height = dy;
        } else if (currentShape.type === "circle") {
            currentShape.radius = Math.sqrt(dx * dx + dy * dy);
        } else if (currentShape.type === "triangle") {
            currentShape.x2 = x;
            currentShape.y2 = y;
            currentShape.x3 = 2 * currentShape.x - x;
            currentShape.y3 = y;
        }

        drawAllShapes();
    }
});

canvas.addEventListener("mouseup", () => {
    if (isDrawing) {
        console.log("Shape drawn:", currentShape.type);
    }
    isDrawing = false;
    dragging = false;
    resizing = false;
    // Jangan reset currentShape di sini supaya bisa dihapus dengan delete selected
});

// Event listener untuk double tap/double click
canvas.addEventListener("dblclick", (e) => {
    const x = e.offsetX, y = e.offsetY;
    const found = getShapeAt(x, y);

    if (found) {
        // Set currentShape ke shape yang ditemukan untuk memungkinkan penghapusan
        currentShape = found.shape;

        // Toggle doubleTappedShape: jika shape yang sama diklik lagi, hapus highlight
        if (doubleTappedShape === found.shape) {
            doubleTappedShape = null;
        } else {
            doubleTappedShape = found.shape; // Set doubleTappedShape ke shape yang di-double tap
        }

        console.log("Double-clicked shape:", found.shape.type);
        console.log("Current shape set:", currentShape ? currentShape.type : "none");

        drawAllShapes(); // Gambar ulang dengan highlight
    }
});

// Menghapus shape yang dipilih
deleteSelectedBtn.addEventListener("click", () => {
    if (currentShape) {

        shapes = shapes.filter(shape => shape !== currentShape);

        // Jika shape yang dihapus adalah yang di-double tap, reset juga doubleTappedShape
        if (currentShape === doubleTappedShape) {
            doubleTappedShape = null;
        }

        currentShape = null; // Reset currentShape setelah penghapusan
        drawAllShapes(); // Gambar ulang canvas
    }
});

toolBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelector(".options .active").classList.remove("active");
        btn.classList.add("active");
        selectedTool = btn.id;
    });
});

sizeSlider.addEventListener("change", () => brushWidth = sizeSlider.value);
colorBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelector(".options .selected").classList.remove("selected");
        btn.classList.add("selected");
        selectedColor = window.getComputedStyle(btn).getPropertyValue("background-color");
    });
});
colorPicker.addEventListener("change", () => {
    colorPicker.parentElement.style.background = colorPicker.value;
    colorPicker.parentElement.click();
});
clearCanvas.addEventListener("click", () => {
    shapes = [];
    doubleTappedShape = null; // Reset juga shape yang di-double tap saat clear canvas
    drawAllShapes();
});
saveImg.addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = `${Date.now()}.jpg`;
    link.href = canvas.toDataURL();
    link.click();
});



// Tambahkan event listener untuk menambahkan teks ke canvas
addTextBtn.addEventListener("click", () => {
    if (textInput.value) {
        const shape = {
            type: "text",
            x: 50, // Default position for text
            y: 50, // Default position for text
            text: textInput.value,
            fontSize: parseInt(textSizeInput.value) || 16, // Get font size from input
            color: selectedColor,
            lineWidth: brushWidth
        };
        shapes.push(shape);
        textInput.value = ""; // Clear input after adding text
        drawAllShapes();
    }
});

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
            <option value="hexagonal-pyramid">Hexagonal Pyramid</option>
            <option value="diamond">Diamond</option>
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
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0xf0f0f0, 1); // Warna background light gray
    container.appendChild(renderer.domElement);
    
    // Tambahkan pencahayaan untuk material PhongMaterial
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5); // soft white light
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);
    
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight2.position.set(-1, -1, -1).normalize();
    scene.add(directionalLight2);
  
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
    // Buat material transparan dengan warna berbeda untuk tiap bentuk
    let color, opacity = 0.7;
    
    switch(shapeType) {
        case "cube":
            geometry = new THREE.BoxGeometry();
            color = 0x3498db; // Biru
            break;
        case "pentagonal-prism":
            geometry = createPentagonalPrismGeometry();
            color = 0xe74c3c; // Merah
            break;
        case "hexagonal-pyramid":
            geometry = createHexagonalPyramidGeometry();
            color = 0x2ecc71; // Hijau
            break;
        case "diamond":
            geometry = createDiamondGeometry();
            color = 0x9b59b6; // Ungu
            opacity = 0.6; // Diamond sedikit lebih transparan
            break;
        default:
            geometry = new THREE.BoxGeometry();
            color = 0xffffff; // Putih (default)
    }
    
    // Buat material transparan
    const material = new THREE.MeshPhongMaterial({ 
        color: color, 
        transparent: true, 
        opacity: opacity,
        side: THREE.DoubleSide, // Render kedua sisi
        wireframe: false,
        specular: 0x111111,
        shininess: 50
    });
    
    // Tambahkan outline wireframe
    const wireframeMaterial = new THREE.MeshBasicMaterial({
        color: 0x000000,
        wireframe: true,
        transparent: true
    });
    
    // Buat mesh untuk objek utama
    currentObject = new THREE.Object3D();
    const mainMesh = new THREE.Mesh(geometry, material);
    const wireframeMesh = new THREE.Mesh(geometry, wireframeMaterial);
    
    // Tambahkan kedua mesh ke group
    currentObject.add(mainMesh);
    currentObject.add(wireframeMesh);
    
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

function createHexagonalPyramidGeometry() {
    // Gunakan BufferGeometry untuk menghindari masalah dengan THREE.Geometry
    // yang sudah deprecated di versi Three.js yang lebih baru
    
    // Untuk versi Three.js yang masih menggunakan Geometry:
    if (THREE.ConeGeometry) {
        // Gunakan ConeGeometry dengan 6 segmen untuk membuat piramida hexagonal
        return new THREE.ConeGeometry(1, 1.5, 6);
    } else {
        // Cara manual jika ConeGeometry tidak tersedia
        const geometry = new THREE.Geometry();
        
        // Radius hexagon pada dasar
        const radius = 1;
        const height = 1.5;
        
        // Titik puncak piramida
        geometry.vertices.push(new THREE.Vector3(0, height, 0));  // Vertex 0 (puncak)
        
        // Titik-titik hexagon pada dasar (y = 0)
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 / 6) * i;
            const x = radius * Math.cos(angle);
            const z = radius * Math.sin(angle);
            geometry.vertices.push(new THREE.Vector3(x, 0, z));  // Vertex 1-6 (dasar)
        }
        
        // Faces untuk dasar hexagon (menggunakan triangulasi fan)
        // Gunakan vertex central untuk memudahkan triangulasi
        geometry.vertices.push(new THREE.Vector3(0, 0, 0));  // Vertex 7 (center of base)
        
        for (let i = 1; i <= 6; i++) {
            const j = i % 6 + 1;
            geometry.faces.push(new THREE.Face3(7, i, j));
        }
        
        // Faces untuk sisi piramida (dari puncak ke masing-masing sisi hexagon)
        for (let i = 1; i <= 6; i++) {
            const j = i % 6 + 1;
            geometry.faces.push(new THREE.Face3(0, i, j));
        }
        
        geometry.computeFaceNormals();
        return geometry;
    }
}

function createDiamondGeometry() {
    // Cara simpel: Gunakan OctahedronGeometry dari Three.js
    // Octahedron adalah bentuk dasar dari diamond/berlian
    
    // Periksa apakah OctahedronGeometry tersedia
    if (THREE.OctahedronGeometry) {
        return new THREE.OctahedronGeometry(1);
    } else {
        // Implementasi manual jika OctahedronGeometry tidak tersedia
        const geometry = new THREE.Geometry();
        
        // Titik-titik utama diamond (bentuk oktahedron)
        geometry.vertices.push(new THREE.Vector3(0, 1, 0));    // Atas
        geometry.vertices.push(new THREE.Vector3(0, -1, 0));   // Bawah
        geometry.vertices.push(new THREE.Vector3(1, 0, 0));    // Kanan
        geometry.vertices.push(new THREE.Vector3(-1, 0, 0));   // Kiri
        geometry.vertices.push(new THREE.Vector3(0, 0, 1));    // Depan
        geometry.vertices.push(new THREE.Vector3(0, 0, -1));   // Belakang
        
        // Faces segitiga untuk bagian atas
        geometry.faces.push(new THREE.Face3(0, 2, 4));
        geometry.faces.push(new THREE.Face3(0, 4, 3));
        geometry.faces.push(new THREE.Face3(0, 3, 5));
        geometry.faces.push(new THREE.Face3(0, 5, 2));
        
        // Faces segitiga untuk bagian bawah
        geometry.faces.push(new THREE.Face3(1, 4, 2));
        geometry.faces.push(new THREE.Face3(1, 3, 4));
        geometry.faces.push(new THREE.Face3(1, 5, 3));
        geometry.faces.push(new THREE.Face3(1, 2, 5));
        
        geometry.computeFaceNormals();
        return geometry;
    }
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