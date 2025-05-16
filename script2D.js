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
    const rotateLeftBtn = document.querySelector(".rotate-left");
const rotateRightBtn = document.querySelector(".rotate-right");

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
        // Simpan state konteks sebelum transformasi
        ctx.save();
        
        // Terapkan rotasi jika ada
        if (shape.rotation) {
            // Translate ke titik pusat bentuk, rotate, lalu translate kembali
            ctx.translate(shape.x, shape.y);
            ctx.rotate(shape.rotation * Math.PI / 180);
            ctx.translate(-shape.x, -shape.y);
        }
        
        ctx.beginPath();
        ctx.lineWidth = shape.lineWidth || 2;
        ctx.strokeStyle = shape.color;
        ctx.fillStyle = shape.color;

        switch (shape.type) {
            case "diamond":
                // Menggambar belah ketupat
                const halfWidth = shape.width / 2;
                const halfHeight = shape.height / 2;
                
                ctx.beginPath();
                ctx.moveTo(shape.x, shape.y - halfHeight); // Titik atas
                ctx.lineTo(shape.x + halfWidth, shape.y); // Titik kanan
                ctx.lineTo(shape.x, shape.y + halfHeight); // Titik bawah
                ctx.lineTo(shape.x - halfWidth, shape.y); // Titik kiri
                ctx.closePath();
                
                shape.fill ? ctx.fill() : ctx.stroke();
                break;
            case "hexagon":
                // Menggambar hexagon
                const radius = shape.radius;
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI / 3) * i;
                    const xPos = shape.x + radius * Math.cos(angle);
                    const yPos = shape.y + radius * Math.sin(angle);
                    
                    if (i === 0) {
                        ctx.moveTo(xPos, yPos);
                    } else {
                        ctx.lineTo(xPos, yPos);
                    }
                }
                ctx.closePath();
                shape.fill ? ctx.fill() : ctx.stroke();
                break;
            case "right-triangle":
                // Menggambar segitiga siku-siku
                ctx.beginPath();
                ctx.moveTo(shape.x, shape.y); // Titik awal (sudut siku-siku)
                ctx.lineTo(shape.x2, shape.y2); // Titik kedua (horizontal)
                ctx.lineTo(shape.x, shape.y2); // Titik ketiga (vertical)
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

            if (shape.type === "diamond") {
                const halfWidth = shape.width / 2;
                const halfHeight = shape.height / 2;
                
                ctx.beginPath();
                ctx.moveTo(shape.x, shape.y - halfHeight - 5); // Titik atas
                ctx.lineTo(shape.x + halfWidth + 5, shape.y); // Titik kanan
                ctx.lineTo(shape.x, shape.y + halfHeight + 5); // Titik bawah
                ctx.lineTo(shape.x - halfWidth - 5, shape.y); // Titik kiri
                ctx.closePath();
                ctx.stroke();

                // Tambahkan titik-titik di sudut
                ctx.fillStyle = "red";
                ctx.fillRect(shape.x - 5, shape.y - halfHeight - 5, 10, 10); // top
                ctx.fillRect(shape.x + halfWidth - 5, shape.y - 5, 10, 10); // right
                ctx.fillRect(shape.x - 5, shape.y + halfHeight - 5, 10, 10); // bottom
                ctx.fillRect(shape.x - halfWidth - 5, shape.y - 5, 10, 10); // left
            } else if (shape.type === "hexagon") {
                const radius = shape.radius + 5;
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI / 3) * i;
                    const xPos = shape.x + radius * Math.cos(angle);
                    const yPos = shape.y + radius * Math.sin(angle);
                    
                    if (i === 0) {
                        ctx.moveTo(xPos, yPos);
                    } else {
                        ctx.lineTo(xPos, yPos);
                    }
                }
                ctx.closePath();
                ctx.stroke();

                // Tambahkan titik di pusat hexagon
                ctx.fillStyle = "red";
                ctx.beginPath();
                ctx.arc(shape.x, shape.y, 5, 0, Math.PI * 2);
                ctx.fill();
            } else if (shape.type === "right-triangle") {
                ctx.beginPath();
                ctx.moveTo(shape.x - 5, shape.y - 5); // Titik awal
                ctx.lineTo(shape.x2 + 5, shape.y2 + 5); // Titik kedua
                ctx.lineTo(shape.x - 5, shape.y2 + 5); // Titik ketiga
                ctx.closePath();
                ctx.stroke();

                // Tambahkan titik di setiap sudut
                ctx.fillStyle = "red";
                ctx.fillRect(shape.x - 5, shape.y - 5, 10, 10); // sudut siku-siku
                ctx.fillRect(shape.x2 - 5, shape.y2 - 5, 10, 10); // sudut kanan
                ctx.fillRect(shape.x - 5, shape.y2 - 5, 10, 10); // sudut bawah
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
            if (shape.type === "diamond") {
                const halfWidth = shape.width / 2;
                ctx.fillRect(shape.x + halfWidth - 5, shape.y - 5, 10, 10);
            } else if (shape.type === "hexagon") {
                ctx.fillRect(shape.x + shape.radius - 5, shape.y - 5, 10, 10);
            } else if (shape.type === "right-triangle") {
                ctx.fillRect(shape.x2 - 5, shape.y2 - 5, 10, 10);
            } else if (shape.type === "text") {
                ctx.fillRect(shape.x - 5, shape.y - shape.fontSize, 10, 10);
            }
        }
        
        // Kembalikan state konteks setelah menggambar
        ctx.restore();
    }
}


function getShapeAt(x, y) {
    for (let i = shapes.length - 1; i >= 0; i--) {
        const s = shapes[i];
        if (s.type === "diamond") {
            // Resize handle check
            const halfWidth = s.width / 2;
            const halfHeight = s.height / 2;
            if (x >= s.x + halfWidth - 5 && x <= s.x + halfWidth + 5 &&
                y >= s.y - 5 && y <= s.y + 5) {
                return { shape: s, index: i, resize: true };
            }
            
            // Check if point is inside diamond
            // Menggunakan cross-product untuk memeriksa apakah titik berada di dalam belah ketupat
            const points = [
                { x: s.x, y: s.y - halfHeight },
                { x: s.x + halfWidth, y: s.y },
                { x: s.x, y: s.y + halfHeight },
                { x: s.x - halfWidth, y: s.y }
            ];
            
            if (isPointInPolygon(x, y, points)) {
                return { shape: s, index: i };
            }
        } else if (s.type === "hexagon") {
            // Resize handle check
            if (x >= s.x + s.radius - 5 && x <= s.x + s.radius + 5 &&
                y >= s.y - 5 && y <= s.y + 5) {
                return { shape: s, index: i, resize: true };
            }
            
            // Check if point is inside hexagon
            const points = [];
            for (let j = 0; j < 6; j++) {
                const angle = (Math.PI / 3) * j;
                points.push({
                    x: s.x + s.radius * Math.cos(angle),
                    y: s.y + s.radius * Math.sin(angle)
                });
            }
            
            if (isPointInPolygon(x, y, points)) {
                return { shape: s, index: i };
            }
        } else if (s.type === "right-triangle") {
            // Resize handle check
            const dx = x - s.x2;
            const dy = y - s.y2;
            if (Math.abs(dx) <= 10 && Math.abs(dy) <= 10) {
                return { shape: s, index: i, resize: true };
            }
            
            // Check if point is inside right triangle
            const points = [
                { x: s.x, y: s.y },
                { x: s.x2, y: s.y2 },
                { x: s.x, y: s.y2 }
            ];
            
            if (isPointInPolygon(x, y, points)) {
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

// Helper function untuk mengecek apakah titik berada di dalam polygon
function isPointInPolygon(x, y, points) {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const xi = points[i].x, yi = points[i].y;
        const xj = points[j].x, yj = points[j].y;
        
        const intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
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
                lineWidth: brushWidth,
                rotation: 0 // Tambahkan property rotation
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
                lineWidth: brushWidth,
                rotation: 0 // Tambahkan property rotation
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
                lineWidth: brushWidth,
                rotation: 0 // Tambahkan property rotation
            };
            if (selectedTool === "right-triangle") {
                shape.x2 = x;
                shape.y2 = y;
            }
            currentShape = shape;
            shapes.push(shape);
        }
    }
});

canvas.addEventListener("mousemove", (e) => {
    const x = e.offsetX, y = e.offsetY;

    if (resizing && currentShape) {
        if (currentShape.type === "diamond") {
            currentShape.width = (x - currentShape.x) * 2;
            currentShape.height = (y - currentShape.y) * 2;
        } else if (currentShape.type === "hexagon") {
            const dx = x - currentShape.x;
            const dy = y - currentShape.y;
            currentShape.radius = Math.sqrt(dx * dx + dy * dy);
        } else if (currentShape.type === "right-triangle") {
            currentShape.x2 = x;
            currentShape.y2 = y;
        }
        drawAllShapes();
        return;
    }

    if (dragging && currentShape) {
        const dx = x - dragOffsetX - currentShape.x;
        const dy = y - dragOffsetY - currentShape.y;

        if (currentShape.type === "right-triangle") {
            currentShape.x += dx;
            currentShape.y += dy;
            currentShape.x2 += dx;
            currentShape.y2 += dy;
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
        } else if (currentShape.type === "diamond") {
            currentShape.width = Math.abs(dx) * 2;
            currentShape.height = Math.abs(dy) * 2;
        } else if (currentShape.type === "hexagon") {
            currentShape.radius = Math.sqrt(dx * dx + dy * dy);
        } else if (currentShape.type === "right-triangle") {
            currentShape.x2 = x;
            currentShape.y2 = y;
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
rotateLeftBtn.addEventListener("click", () => {
    if (currentShape) {
        // Pastikan rotation tidak undefined
        if (currentShape.rotation === undefined) {
            currentShape.rotation = 0;
        }
        // Rotate 30 derajat ke kiri (counterclockwise)
        currentShape.rotation -= 30;
        drawAllShapes();
    }
});

rotateRightBtn.addEventListener("click", () => {
    if (currentShape) {
        // Pastikan rotation tidak undefined
        if (currentShape.rotation === undefined) {
            currentShape.rotation = 0;
        }
        // Rotate 30 derajat ke kanan (clockwise)
        currentShape.rotation += 30;
        drawAllShapes();
    }
});