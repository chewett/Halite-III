import * as assets from "./assets";

export default class Camera {
    constructor(initScale, panRender, cols, rows) {
        this.cols = cols;
        this.rows = rows;
        this.panRender = panRender;
        this.dragBase = [ 0, 0 ];
        this.dragging = false;
        this.mouseDown = false;

        this.initScale = initScale;
        this.scale = initScale;
        this.dirty = false;

        this.pan = { x: 0, y: 0 };
        this.pixelPan = { x: 0, y: 0 };
    }

    reset() {
        this.scale = this.initScale;
        this.pan.x = 0;
        this.pan.y = 0;
        this.pixelPan.x = 0;
        this.pixelPan.y = 0;
        this.panRender();
    }

    attach(view) {
        view.addEventListener("mousedown", this.onDragStart.bind(this));
        view.addEventListener("mousemove", this.onDragMove.bind(this));
        view.addEventListener("mouseleave", this.onDragStop.bind(this));
        view.addEventListener("mouseup", this.onDragStop.bind(this));
        view.addEventListener("mousewheel", this.onZoom.bind(this));
    }

    screenToWorld(x, y) {
        return [
            (Math.floor(x / this.scale) - this.pan.x + this.cols) % this.cols,
            (Math.floor(y / this.scale) - this.pan.y + this.rows) % this.rows,
        ];
    }

    worldToCamera(cellX, cellY) {
        return [
            (cellX + this.pan.x + this.cols) % this.cols,
            (cellY + this.pan.y + this.rows) % this.rows,
        ];
    }

    update() {
    }

    onZoom(e) {
        e.preventDefault();

        const sign = e.wheelDelta >= 0 ? 1 : -1;
        const delta = sign * Math.max(1, Math.min(2, Math.abs(e.wheelDelta) / 150));
        const percentX = (e.offsetX + 0.5 * this.scale) / assets.VISUALIZER_SIZE;
        const percentY = (e.offsetY + 0.5 * this.scale) / assets.VISUALIZER_HEIGHT;

        this.zoomBy(percentX, percentY, delta);
    }

    zoomBy(anchorX, anchorY, delta) {
        // Try to keep point under mouse fixed
        const [ centerX, centerY ] = this.screenToWorld(
            anchorX * assets.VISUALIZER_SIZE,
            anchorY * assets.VISUALIZER_HEIGHT
        );

        this.scale += delta;
        this.scale = Math.min(10 * this.initScale, Math.max(this.initScale, this.scale));

        const viewWidth = assets.VISUALIZER_SIZE / this.scale;
        const viewHeight = assets.VISUALIZER_HEIGHT / this.scale;
        const viewLeft = centerX - anchorX * viewWidth;
        const viewTop = centerY - anchorY * viewHeight;

        // 0.5 factor helps keeps things properly centered - otherwise
        // there's a bias towards the top-left corner
        this.pan.x = Math.round((-viewLeft - 0.5 + this.cols) % this.cols);
        this.pan.y = Math.round((-viewTop - 0.5 + this.rows) % this.rows);

        this.pixelPan.x = this.pan.x * this.scale;
        this.pixelPan.y = this.pan.y * this.scale;

        this.panRender();
    }

    onDragStart(e) {
        if (e.which === 1) {
            this.dragBase = [ e.offsetX, e.offsetY ];
            this.mouseDown = true;
        }
    }

    onDragMove(e) {
        const dx = e.offsetX - this.dragBase[0];
        const dy = e.offsetY - this.dragBase[1];
        if (this.mouseDown && dx**2 + dy**2 > 25) {
            this.dragging = true;
        }

        if (this.dragging) {
            this.pixelPan.x += dx;
            this.pixelPan.y += dy;

            const fullWidth = this.scale * this.cols;
            const fullHeight = this.scale * this.rows;
            this.dragBase = [ e.offsetX, e.offsetY ];
            this.pixelPan.x = (this.pixelPan.x + fullWidth) % fullWidth;
            this.pixelPan.y = (this.pixelPan.y + fullHeight) % fullHeight;
            this.pan.x = Math.round(this.pixelPan.x / this.scale);
            this.pan.y = Math.round(this.pixelPan.y / this.scale);
            this.panRender();
        }
    }

    panBy(dx, dy) {
        this.pan.x += dx + this.cols;
        this.pan.y += dy + this.rows;
        this.pan.x %= this.cols;
        this.pan.y %= this.rows;

        this.pixelPan.x = this.pan.x * this.scale;
        this.pixelPan.y = this.pan.y * this.scale;

        this.panRender();
    }

    onDragStop(e) {
        this.dragging = false;
        this.mouseDown = false;
    }
}