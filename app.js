// WikiWander - 3D Wikipedia Visualizer
// Main application code

class WikiWander {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.currentPage = null;
        this.currentPageTitle = null;
        this.linkNodes = []; // Current page's links
        this.visitedPages = []; // Previously visited pages as blue circles
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.isDragging = false;
        this.previousMousePosition = { x: 0, y: 0 };
        this.cameraRotation = { x: 0, y: 0 };
        this.cameraDistance = 20;

        this.init();
        this.setupEventListeners();
        this.animate();
    }

    init() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        this.scene.fog = new THREE.Fog(0x000000, 30, 100);

        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.updateCameraPosition();

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(this.renderer.domElement);

        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 10);
        this.scene.add(directionalLight);

        // Add stars
        this.addStars();
    }

    addStars() {
        const starGeometry = new THREE.BufferGeometry();
        const starVertices = [];

        for (let i = 0; i < 1000; i++) {
            const x = (Math.random() - 0.5) * 200;
            const y = (Math.random() - 0.5) * 200;
            const z = (Math.random() - 0.5) * 200;
            starVertices.push(x, y, z);
        }

        starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
        const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.3 });
        const stars = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(stars);
    }

    setupEventListeners() {
        // Load button
        document.getElementById('loadBtn').addEventListener('click', () => {
            const input = document.getElementById('wikiUrl').value.trim();
            if (input) {
                this.loadWikipediaPage(input);
            }
        });

        // Enter key on input
        document.getElementById('wikiUrl').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const input = document.getElementById('wikiUrl').value.trim();
                if (input) {
                    this.loadWikipediaPage(input);
                }
            }
        });

        // Mouse controls
        this.renderer.domElement.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.renderer.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.renderer.domElement.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.renderer.domElement.addEventListener('click', (e) => this.onClick(e));

        // Mouse wheel for zoom
        this.renderer.domElement.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.cameraDistance += e.deltaY * 0.01;
            this.cameraDistance = Math.max(5, Math.min(50, this.cameraDistance));
            this.updateCameraPosition();
        });

        // Window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    onMouseDown(e) {
        this.isDragging = true;
        this.previousMousePosition = { x: e.clientX, y: e.clientY };
    }

    onMouseMove(e) {
        if (this.isDragging) {
            const deltaX = e.clientX - this.previousMousePosition.x;
            const deltaY = e.clientY - this.previousMousePosition.y;

            this.cameraRotation.y += deltaX * 0.005;
            this.cameraRotation.x += deltaY * 0.005;

            // Limit vertical rotation
            this.cameraRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.cameraRotation.x));

            this.updateCameraPosition();
            this.previousMousePosition = { x: e.clientX, y: e.clientY };
        }
    }

    onMouseUp(e) {
        this.isDragging = false;
    }

    updateCameraPosition() {
        this.camera.position.x = this.cameraDistance * Math.cos(this.cameraRotation.x) * Math.sin(this.cameraRotation.y);
        this.camera.position.y = this.cameraDistance * Math.sin(this.cameraRotation.x);
        this.camera.position.z = this.cameraDistance * Math.cos(this.cameraRotation.x) * Math.cos(this.cameraRotation.y);
        this.camera.lookAt(0, 0, 0);
    }

    onClick(e) {
        // Calculate mouse position in normalized device coordinates
        this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

        // Update raycaster
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Check for intersections with both current links and visited pages
        const clickableObjects = [
            ...this.linkNodes.map(node => node.mesh),
            ...this.visitedPages.map(node => node.mesh)
        ];
        const intersects = this.raycaster.intersectObjects(clickableObjects);

        if (intersects.length > 0) {
            const clickedObject = intersects[0].object;

            // Check if it's a link from current page
            let linkNode = this.linkNodes.find(node => node.mesh === clickedObject);
            if (linkNode) {
                this.navigateToLink(linkNode);
                return;
            }

            // Check if it's a visited page
            linkNode = this.visitedPages.find(node => node.mesh === clickedObject);
            if (linkNode) {
                this.navigateToLink(linkNode);
                return;
            }
        }
    }

    async loadWikipediaPage(input) {
        const loading = document.getElementById('loading');
        loading.classList.add('active');

        try {
            // Extract article name from URL or use input directly
            let articleName = input;
            if (input.includes('wikipedia.org')) {
                const match = input.match(/wiki\/([^#?]+)/);
                if (match) {
                    articleName = decodeURIComponent(match[1]);
                }
            }

            // Fetch page content and links using Wikipedia API
            const apiUrl = `https://en.wikipedia.org/w/api.php?` +
                `action=parse&page=${encodeURIComponent(articleName)}&` +
                `format=json&origin=*&prop=text|links`;

            const response = await fetch(apiUrl);
            const data = await response.json();

            if (data.error) {
                alert('Page not found: ' + articleName);
                loading.classList.remove('active');
                return;
            }

            const pageTitle = data.parse.title;
            const htmlContent = data.parse.text['*'];
            const links = data.parse.links || [];

            // Extract Wikipedia links (filter internal links only)
            const wikiLinks = links
                .filter(link => link.ns === 0) // Namespace 0 = articles
                .map(link => ({
                    title: link['*'],
                    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(link['*'])}`
                }))
                .slice(0, 100); // First 100 links

            // Clear existing scene objects
            this.clearScene();

            // Create main page
            await this.createPagePlane(pageTitle, htmlContent);

            // Create link constellation
            this.createLinkConstellation(wikiLinks);

            // Store current page title
            this.currentPageTitle = pageTitle;

            // Update UI
            document.getElementById('currentPage').textContent = pageTitle;
            document.getElementById('linkCount').textContent = wikiLinks.length;

        } catch (error) {
            console.error('Error loading Wikipedia page:', error);
            alert('Error loading page. Please try again.');
        } finally {
            loading.classList.remove('active');
        }
    }

    clearScene() {
        // Remove current page
        if (this.currentPage) {
            this.scene.remove(this.currentPage);
            if (this.currentPage.geometry) this.currentPage.geometry.dispose();
            if (this.currentPage.material) {
                if (this.currentPage.material.map) this.currentPage.material.map.dispose();
                this.currentPage.material.dispose();
            }
        }

        // Remove only the current page's link nodes (not visited pages)
        this.linkNodes.forEach(node => {
            this.scene.remove(node.mesh);
            if (node.label) this.scene.remove(node.label);
            if (node.line) this.scene.remove(node.line);
            if (node.mesh.geometry) node.mesh.geometry.dispose();
            if (node.mesh.material) node.mesh.material.dispose();
            if (node.line && node.line.geometry) node.line.geometry.dispose();
            if (node.line && node.line.material) node.line.material.dispose();
        });
        this.linkNodes = [];

        // Note: visitedPages are NOT cleared, they persist across navigations
    }

    async createPagePlane(title, htmlContent) {
        // Create a canvas to render the page content
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 1024;
        canvas.height = 1024;

        // Fill background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw title
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(title, canvas.width / 2, 80);

        // Draw a simple representation
        ctx.font = '24px Arial';
        ctx.textAlign = 'left';
        const lines = [
            'Wikipedia Article',
            '',
            'Click on the blue circles',
            'around this page to navigate',
            'to linked articles.',
            '',
            'Total links: visible in sidebar'
        ];

        let y = 180;
        lines.forEach(line => {
            ctx.fillText(line, 50, y);
            y += 40;
        });

        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        // Create plane geometry
        const geometry = new THREE.PlaneGeometry(8, 8);
        const material = new THREE.MeshStandardMaterial({
            map: texture,
            side: THREE.DoubleSide
        });

        this.currentPage = new THREE.Mesh(geometry, material);
        this.currentPage.position.set(0, 0, 0);
        this.scene.add(this.currentPage);
    }

    createLinkConstellation(links) {
        const radius = 15; // Distance from center
        const totalLinks = links.length;

        links.forEach((link, index) => {
            // Calculate position in a circle around the main page
            const angle = (index / totalLinks) * Math.PI * 2;

            // Add some vertical variation for visual interest
            const verticalOffset = (Math.sin(index * 0.5) * 2);

            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const y = verticalOffset;

            // Create blue circle for link
            const geometry = new THREE.SphereGeometry(0.5, 32, 32);
            const material = new THREE.MeshStandardMaterial({
                color: 0x4da6ff,
                emissive: 0x4da6ff,
                emissiveIntensity: 0.5
            });
            const sphere = new THREE.Mesh(geometry, material);
            sphere.position.set(x, y, z);
            this.scene.add(sphere);

            // Create label
            const label = this.createLabel(link.title, x, y + 1, z);
            this.scene.add(label);

            // Add a line connecting to center
            const lineGeometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(x, y, z)
            ]);
            const lineMaterial = new THREE.LineBasicMaterial({
                color: 0x4da6ff,
                opacity: 0.3,
                transparent: true
            });
            const line = new THREE.Line(lineGeometry, lineMaterial);
            this.scene.add(line);

            // Store link node with line reference
            this.linkNodes.push({
                mesh: sphere,
                label: label,
                line: line,
                title: link.title,
                url: link.url
            });
        });
    }

    createLabel(text, x, y, z) {
        // Create canvas for label
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 128;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw text with background
        ctx.font = 'bold 40px Arial';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Truncate text if too long
        let displayText = text;
        if (text.length > 25) {
            displayText = text.substring(0, 22) + '...';
        }
        ctx.fillText(displayText, canvas.width / 2, canvas.height / 2);

        // Create texture
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        // Create sprite
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true
        });
        const sprite = new THREE.Sprite(material);
        sprite.position.set(x, y, z);
        sprite.scale.set(4, 1, 1);

        return sprite;
    }

    navigateToLink(linkNode) {
        console.log('Navigating to:', linkNode.title);

        // Save current page to visited pages before loading new one
        if (this.currentPage && this.currentPageTitle) {
            // Find a position for the visited page among other visited pages
            const visitedCount = this.visitedPages.length;
            const radius = 15;
            const angle = (visitedCount / (visitedCount + 1)) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const y = Math.sin(visitedCount * 0.7) * 2; // Vertical variation

            // Create blue circle for the previous page
            const geometry = new THREE.SphereGeometry(0.5, 32, 32);
            const material = new THREE.MeshStandardMaterial({
                color: 0x4da6ff,
                emissive: 0x4da6ff,
                emissiveIntensity: 0.5
            });
            const sphere = new THREE.Mesh(geometry, material);
            sphere.position.set(x, y, z);
            this.scene.add(sphere);

            // Create label for previous page
            const label = this.createLabel(this.currentPageTitle, x, y + 1, z);
            this.scene.add(label);

            // Add to visited pages array so it's clickable
            this.visitedPages.push({
                mesh: sphere,
                label: label,
                title: this.currentPageTitle,
                url: `https://en.wikipedia.org/wiki/${encodeURIComponent(this.currentPageTitle)}`
            });
        }

        // Load the new page
        this.loadWikipediaPage(linkNode.title);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Rotate link nodes slightly for visual effect
        this.linkNodes.forEach((node, index) => {
            node.mesh.rotation.y += 0.01;
            // Make labels always face camera
            if (node.label) {
                node.label.lookAt(this.camera.position);
            }
        });

        // Rotate visited page nodes
        this.visitedPages.forEach((node, index) => {
            node.mesh.rotation.y += 0.01;
            // Make labels always face camera
            if (node.label) {
                node.label.lookAt(this.camera.position);
            }
        });

        // Rotate current page slightly
        if (this.currentPage) {
            this.currentPage.rotation.y += 0.001;
        }

        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the application when the page loads
window.addEventListener('DOMContentLoaded', () => {
    new WikiWander();
});
