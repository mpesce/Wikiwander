// Navigation and camera controls
class NavigationManager {
    constructor(sceneManager, pageManager) {
        this.sceneManager = sceneManager;
        this.pageManager = pageManager;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this.isDragging = false;
        this.previousMousePosition = { x: 0, y: 0 };
        this.cameraRotation = { x: 0, y: 0 };
        this.cameraDistance = 15;
        this.cameraTarget = new THREE.Vector3(0, 0, 0);

        this.zoomedOut = false;
        this.pageClickCallback = null;

        this.init();
    }

    setPageClickCallback(callback) {
        this.pageClickCallback = callback;
    }

    init() {
        const canvas = this.sceneManager.getCanvas();

        // Mouse events for camera control
        canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        canvas.addEventListener('click', (e) => this.onClick(e));

        // Wheel event for zoom
        canvas.addEventListener('wheel', (e) => this.onWheel(e));

        // Touch events for mobile
        canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
        canvas.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
        canvas.addEventListener('touchend', (e) => this.onTouchEnd(e));
    }

    onMouseDown(event) {
        this.isDragging = true;
        this.previousMousePosition = {
            x: event.clientX,
            y: event.clientY
        };
    }

    onMouseMove(event) {
        if (this.isDragging) {
            const deltaX = event.clientX - this.previousMousePosition.x;
            const deltaY = event.clientY - this.previousMousePosition.y;

            this.cameraRotation.y += deltaX * 0.005;
            this.cameraRotation.x += deltaY * 0.005;

            // Clamp vertical rotation
            this.cameraRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.cameraRotation.x));

            this.previousMousePosition = {
                x: event.clientX,
                y: event.clientY
            };

            this.updateCameraPosition();
        }
    }

    onMouseUp(event) {
        this.isDragging = false;
    }

    onClick(event) {
        if (Math.abs(event.clientX - this.previousMousePosition.x) > 5 ||
            Math.abs(event.clientY - this.previousMousePosition.y) > 5) {
            return; // Was dragging, not a click
        }

        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.sceneManager.getCamera());

        const intersects = this.raycaster.intersectObjects(
            this.sceneManager.getScene().children, true
        );

        for (let intersect of intersects) {
            let object = intersect.object;

            // Traverse up to find the page mesh
            while (object.parent && !object.userData.isPage) {
                object = object.parent;
            }

            if (object.userData.isPage) {
                const pageIndex = object.userData.pageIndex;
                this.onPageClick(pageIndex);
                break;
            }
        }
    }

    onPageClick(pageIndex) {
        const page = this.pageManager.getPage(pageIndex);
        if (!page) return;

        // Call the callback if set (to open modal)
        if (this.pageClickCallback) {
            this.pageClickCallback(pageIndex);
        }

        // Focus camera on this page
        this.focusOnPage(pageIndex);
    }

    onWheel(event) {
        event.preventDefault();

        const delta = event.deltaY;
        this.cameraDistance += delta * 0.01;
        this.cameraDistance = Math.max(5, Math.min(200, this.cameraDistance));

        this.updateCameraPosition();
    }

    onTouchStart(event) {
        if (event.touches.length === 1) {
            event.preventDefault();
            this.previousMousePosition = {
                x: event.touches[0].clientX,
                y: event.touches[0].clientY
            };
            this.isDragging = true;
        }
    }

    onTouchMove(event) {
        if (event.touches.length === 1 && this.isDragging) {
            event.preventDefault();

            const deltaX = event.touches[0].clientX - this.previousMousePosition.x;
            const deltaY = event.touches[0].clientY - this.previousMousePosition.y;

            this.cameraRotation.y += deltaX * 0.005;
            this.cameraRotation.x += deltaY * 0.005;

            this.cameraRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.cameraRotation.x));

            this.previousMousePosition = {
                x: event.touches[0].clientX,
                y: event.touches[0].clientY
            };

            this.updateCameraPosition();
        }
    }

    onTouchEnd(event) {
        this.isDragging = false;
    }

    updateCameraPosition() {
        const camera = this.sceneManager.getCamera();

        const x = this.cameraTarget.x + this.cameraDistance * Math.sin(this.cameraRotation.y) * Math.cos(this.cameraRotation.x);
        const y = this.cameraTarget.y + this.cameraDistance * Math.sin(this.cameraRotation.x);
        const z = this.cameraTarget.z + this.cameraDistance * Math.cos(this.cameraRotation.y) * Math.cos(this.cameraRotation.x);

        camera.position.set(x, y, z);
        camera.lookAt(this.cameraTarget);
    }

    focusOnPage(pageIndex) {
        const page = this.pageManager.getPage(pageIndex);
        if (!page) return;

        this.pageManager.setActivePage(pageIndex);

        // Smoothly move camera target to page
        this.animateCameraToTarget(page.position.clone(), 10);
    }

    animateCameraToTarget(targetPosition, distance = 10) {
        const startTarget = this.cameraTarget.clone();
        const startDistance = this.cameraDistance;
        const duration = 1000; // ms
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function
            const eased = this.easeInOutCubic(progress);

            this.cameraTarget.lerpVectors(startTarget, targetPosition, eased);
            this.cameraDistance = startDistance + (distance - startDistance) * eased;

            this.updateCameraPosition();

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }

    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    zoomOutToSeeAll() {
        const pages = this.pageManager.getAllPages();
        if (pages.length === 0) return;

        // Calculate bounding box of all pages
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;

        pages.forEach(page => {
            minX = Math.min(minX, page.position.x);
            maxX = Math.max(maxX, page.position.x);
            minY = Math.min(minY, page.position.y);
            maxY = Math.max(maxY, page.position.y);
            minZ = Math.min(minZ, page.position.z);
            maxZ = Math.max(maxZ, page.position.z);
        });

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const centerZ = (minZ + maxZ) / 2;

        const rangeX = maxX - minX;
        const rangeY = maxY - minY;
        const rangeZ = maxZ - minZ;

        const maxRange = Math.max(rangeX, rangeY, rangeZ);
        const distance = maxRange * 2 + 20;

        this.animateCameraToTarget(new THREE.Vector3(centerX, centerY, centerZ), distance);
        this.zoomedOut = true;
    }

    resetView() {
        const activePage = this.pageManager.getActivePage();
        if (activePage) {
            this.focusOnPage(activePage.index);
        } else {
            this.animateCameraToTarget(new THREE.Vector3(0, 0, 0), 15);
        }
        this.zoomedOut = false;
    }
}
