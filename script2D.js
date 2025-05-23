// Fixed script2D.js - now handles resize properly after rotation

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
    doubleTappedShape = null;

let lastTap = 0;

window.addEventListener("load", () => {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    drawAllShapes();
});

// Helper function to transform point considering rotation
function transformPoint(x, y, centerX, centerY, rotation) {
    if (!rotation) return { x, y };
    
    const cos = Math.cos(rotation * Math.PI / 180);
    const sin = Math.sin(rotation * Math.PI / 180);
    
    // Translate to origin
    const translatedX = x - centerX;
    const translatedY = y - centerY;
    
    // Apply rotation
    const rotatedX = translatedX * cos - translatedY * sin;
    const rotatedY = translatedX * sin + translatedY * cos;
    
    // Translate back
    return {
        x: rotatedX + centerX,
        y: rotatedY + centerY
    };
}

// Helper function to inverse transform point (for mouse coordinates)
function inverseTransformPoint(x, y, centerX, centerY, rotation) {
    if (!rotation) return { x, y };
    
    const cos = Math.cos(-rotation * Math.PI / 180);
    const sin = Math.sin(-rotation * Math.PI / 180);
    
    // Translate to origin
    const translatedX = x - centerX;
    const translatedY = y - centerY;
    
    // Apply inverse rotation
    const rotatedX = translatedX * cos - translatedY * sin;
    const rotatedY = translatedX * sin + translatedY * cos;
    
    // Translate back
    return {
        x: rotatedX + centerX,
        y: rotatedY + centerY
    };
}

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

        // Kembalikan state konteks setelah menggambar shape utama
        ctx.restore();

        
        // Menampilkan kotak biru kanan bawah untuk shape yang dipilih
        if (shape === currentShape) {
            ctx.fillStyle = "blue";
            
            // Calculate resize handle position considering rotation
            let resizeHandlePos;
            if (shape.type === "diamond") {
                const halfWidth = shape.width / 2;
                resizeHandlePos = transformPoint(shape.x + halfWidth, shape.y, shape.x, shape.y, shape.rotation);
            } else if (shape.type === "hexagon") {
                resizeHandlePos = transformPoint(shape.x + shape.radius, shape.y, shape.x, shape.y, shape.rotation);
            } else if (shape.type === "right-triangle") {
                resizeHandlePos = transformPoint(shape.x2, shape.y2, shape.x, shape.y, shape.rotation);
            } else if (shape.type === "text") {
                resizeHandlePos = transformPoint(shape.x, shape.y - shape.fontSize, shape.x, shape.y, shape.rotation);
            }
            
            if (resizeHandlePos) {
                ctx.fillRect(resizeHandlePos.x - 5, resizeHandlePos.y - 5, 10, 10);
            }

            // Tambahkan kotak putus-putus di sekitar objek yang dipilih
            ctx.strokeStyle = "#0078D7"; // Warna biru Microsoft
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 3]); // Pola garis putus-putus

            // Gambar kotak putus-putus sesuai tipe shape dengan rotasi
            if (shape.type === "diamond") {
                const halfWidth = shape.width / 2 + 10;
                const halfHeight = shape.height / 2 + 10;
                
                const corners = [
                    transformPoint(shape.x, shape.y - halfHeight, shape.x, shape.y, shape.rotation),
                    transformPoint(shape.x + halfWidth, shape.y, shape.x, shape.y, shape.rotation),
                    transformPoint(shape.x, shape.y + halfHeight, shape.x, shape.y, shape.rotation),
                    transformPoint(shape.x - halfWidth, shape.y, shape.x, shape.y, shape.rotation)
                ];
                
                ctx.beginPath();
                ctx.moveTo(corners[0].x, corners[0].y);
                corners.forEach(corner => ctx.lineTo(corner.x, corner.y));
                ctx.closePath();
                ctx.stroke();
            } else if (shape.type === "hexagon") {
                const radius = shape.radius + 10;
                const corners = [];
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI / 3) * i;
                    corners.push(transformPoint(
                        shape.x + radius * Math.cos(angle),
                        shape.y + radius * Math.sin(angle),
                        shape.x, shape.y, shape.rotation
                    ));
                }
                
                ctx.beginPath();
                ctx.moveTo(corners[0].x, corners[0].y);
                corners.forEach(corner => ctx.lineTo(corner.x, corner.y));
                ctx.closePath();
                ctx.stroke();
            } else if (shape.type === "right-triangle") {
                const corners = [
                    transformPoint(shape.x - 10, shape.y - 10, shape.x, shape.y, shape.rotation),
                    transformPoint(shape.x2 + 10, shape.y2 + 10, shape.x, shape.y, shape.rotation),
                    transformPoint(shape.x - 10, shape.y2 + 10, shape.x, shape.y, shape.rotation)
                ];
                
                ctx.beginPath();
                ctx.moveTo(corners[0].x, corners[0].y);
                corners.forEach(corner => ctx.lineTo(corner.x, corner.y));
                ctx.closePath();
                ctx.stroke();
            } else if (shape.type === "text") {
                ctx.font = `${shape.fontSize}px Arial`;
                const textWidth = ctx.measureText(shape.text).width;
                
                const corners = [
                    transformPoint(shape.x - 10, shape.y - shape.fontSize - 10, shape.x, shape.y, shape.rotation),
                    transformPoint(shape.x + textWidth + 10, shape.y - shape.fontSize - 10, shape.x, shape.y, shape.rotation),
                    transformPoint(shape.x + textWidth + 10, shape.y + 10, shape.x, shape.y, shape.rotation),
                    transformPoint(shape.x - 10, shape.y + 10, shape.x, shape.y, shape.rotation)
                ];
                
                ctx.beginPath();
                ctx.moveTo(corners[0].x, corners[0].y);
                corners.forEach(corner => ctx.lineTo(corner.x, corner.y));
                ctx.closePath();
                ctx.stroke();
            } else if (shape.type === "brush") {
                // Untuk brush, cari bounding box dari semua titik
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                
                shape.points.forEach(point => {
                    minX = Math.min(minX, point.x);
                    minY = Math.min(minY, point.y);
                    maxX = Math.max(maxX, point.x);
                    maxY = Math.max(maxY, point.y);
                });
                
                // Gambar kotak putus-putus di sekitar brush path dengan padding
                const padding = 10;
                ctx.strokeRect(minX - padding, minY - padding, 
                              (maxX - minX) + padding * 2, 
                              (maxY - minY) + padding * 2);
            }
            
            // Reset line dash
            ctx.setLineDash([]);
        }
    }
}

function getShapeAt(x, y) {
    for (let i = shapes.length - 1; i >= 0; i--) {
        const s = shapes[i];
        
        // Transform mouse coordinates to shape's local coordinate system
        const localPoint = inverseTransformPoint(x, y, s.x, s.y, s.rotation);
        
        if (s.type === "diamond") {
            // Check resize handle first (using transformed coordinates)
            const halfWidth = s.width / 2;
            const handlePos = transformPoint(s.x + halfWidth, s.y, s.x, s.y, s.rotation);
            if (Math.abs(x - handlePos.x) <= 5 && Math.abs(y - handlePos.y) <= 5) {
                return { shape: s, index: i, resize: true };
            }
            
            // Check if point is inside diamond (using local coordinates)
            const halfHeight = s.height / 2;
            const points = [
                { x: s.x, y: s.y - halfHeight },
                { x: s.x + halfWidth, y: s.y },
                { x: s.x, y: s.y + halfHeight },
                { x: s.x - halfWidth, y: s.y }
            ];
            
            if (isPointInPolygon(localPoint.x, localPoint.y, points)) {
                return { shape: s, index: i };
            }
        } else if (s.type === "hexagon") {
            // Check resize handle first
            const handlePos = transformPoint(s.x + s.radius, s.y, s.x, s.y, s.rotation);
            if (Math.abs(x - handlePos.x) <= 5 && Math.abs(y - handlePos.y) <= 5) {
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
            
            if (isPointInPolygon(localPoint.x, localPoint.y, points)) {
                return { shape: s, index: i };
            }
        } else if (s.type === "right-triangle") {
            // Check resize handle first
            const handlePos = transformPoint(s.x2, s.y2, s.x, s.y, s.rotation);
            if (Math.abs(x - handlePos.x) <= 10 && Math.abs(y - handlePos.y) <= 10) {
                return { shape: s, index: i, resize: true };
            }
            
            // Check if point is inside right triangle
            const points = [
                { x: s.x, y: s.y },
                { x: s.x2, y: s.y2 },
                { x: s.x, y: s.y2 }
            ];
            
            if (isPointInPolygon(localPoint.x, localPoint.y, points)) {
                return { shape: s, index: i };
            }
        } else if (s.type === "text") {
            ctx.font = `${s.fontSize}px Arial`;
            const textWidth = ctx.measureText(s.text).width;
            if (localPoint.x >= s.x && localPoint.x <= s.x + textWidth && 
                localPoint.y >= s.y - s.fontSize && localPoint.y <= s.y) {
                return { shape: s, index: i };
            }
        } else if (s.type === "brush") {
            // Peningkatan deteksi untuk brush - cek jalur brush dengan toleransi lebih tinggi
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
    
    // Redraw shapes to show selection
    drawAllShapes();
});

canvas.addEventListener("mousemove", (e) => {
    const x = e.offsetX, y = e.offsetY;

    if (resizing && currentShape) {
        // Transform mouse coordinates to local coordinate system for resize
        const localStart = inverseTransformPoint(resizeStart.x, resizeStart.y, currentShape.x, currentShape.y, currentShape.rotation);
        const localCurrent = inverseTransformPoint(x, y, currentShape.x, currentShape.y, currentShape.rotation);
        
        if (currentShape.type === "diamond") {
            const deltaX = localCurrent.x - localStart.x;
            const deltaY = localCurrent.y - localStart.y;
            currentShape.width = Math.max(10, currentShape.width + deltaX * 2);
            currentShape.height = Math.max(10, currentShape.height + deltaY * 2);
        } else if (currentShape.type === "hexagon") {
            const dx = localCurrent.x - currentShape.x;
            const dy = localCurrent.y - currentShape.y;
            currentShape.radius = Math.max(5, Math.sqrt(dx * dx + dy * dy));
        } else if (currentShape.type === "right-triangle") {
            // For triangle, we need to handle it differently since it has x2, y2
            const globalCurrent = { x, y };
            currentShape.x2 = globalCurrent.x;
            currentShape.y2 = globalCurrent.y;
        }
        
        // Update resize start position
        resizeStart.x = x;
        resizeStart.y = y;
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
    currentShape = null; // Reset currentShape saat clear canvas
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
            lineWidth: brushWidth,
            rotation: 0 // Tambahkan property rotation
        };
        shapes.push(shape);
        textInput.value = ""; // Clear input after adding text
        drawAllShapes();
    }
});

rotateLeftBtn.addEventListener("click", () => {
    if (currentShape) {
        if (currentShape.rotation === undefined) {
            currentShape.rotation = 0;
        }
        currentShape.rotation -= 30;
        drawAllShapes();
    }
});

rotateRightBtn.addEventListener("click", () => {
    if (currentShape) {
        if (currentShape.rotation === undefined) {
            currentShape.rotation = 0;
        }
        currentShape.rotation += 30;
        drawAllShapes();
    }
});

// Buat Panah
document.addEventListener("keydown", (event) => {
    if (!currentShape) return;

    const step = 10;

    switch (event.key) {
        case "ArrowLeft":
            if (currentShape.x !== undefined) currentShape.x -= step;
            if (currentShape.x2 !== undefined) currentShape.x2 -= step;
            break;
        case "ArrowRight":
            if (currentShape.x !== undefined) currentShape.x += step;
            if (currentShape.x2 !== undefined) currentShape.x2 += step;
            break;
        case "ArrowUp":
            if (currentShape.y !== undefined) currentShape.y -= step;
            if (currentShape.y2 !== undefined) currentShape.y2 -= step;
            break;
        case "ArrowDown":
            if (currentShape.y !== undefined) currentShape.y += step;
            if (currentShape.y2 !== undefined) currentShape.y2 += step;
            break;
    }

    drawAllShapes();
});

// Fungsi untuk mengaktifkan atau menonaktifkan tools 2D
function toggleTools2D(enabled) {
    const toolsBoard = document.querySelector(".tools-board");
    const inputs = toolsBoard.querySelectorAll("input, button");
    const options = toolsBoard.querySelectorAll(".option");
    
    if (enabled) {
        toolsBoard.classList.remove("disabled");
        inputs.forEach(input => input.disabled = false);
        options.forEach(option => option.style.pointerEvents = "auto");
    } else {
        toolsBoard.classList.add("disabled");
        inputs.forEach(input => input.disabled = true);
        options.forEach(option => option.style.pointerEvents = "none");
    }
}

// Export fungsi toggle tools untuk digunakan di script3D.js
window.toggleTools2D = toggleTools2D;