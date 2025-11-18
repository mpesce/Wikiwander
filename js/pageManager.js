// Page Manager for handling Wikipedia pages
class PageManager {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.pages = [];
        this.pageIndex = 0;
        this.connections = []; // Store connections between pages
        this.activePage = null;
    }

    async createPage(title, sourcePageIndex = null) {
        const pageIndex = this.pageIndex++;
        const depth = sourcePageIndex !== null ? this.pages[sourcePageIndex].depth + 1 : 0;

        // Calculate position in spiral
        const position = this.calculateSpiralPosition(this.pages.length, depth);

        // Create page object
        const page = {
            index: pageIndex,
            title: title,
            url: this.buildWikipediaURL(title),
            position: position,
            depth: depth,
            sourcePageIndex: sourcePageIndex,
            mesh: null,
            iframe: null,
            css2dObject: null
        };

        // Create 3D representation
        await this.create3DPage(page);

        this.pages.push(page);

        // Add connection if this page has a source
        if (sourcePageIndex !== null) {
            this.addConnection(sourcePageIndex, pageIndex);
        }

        return page;
    }

    buildWikipediaURL(title) {
        // Handle both full URLs and article titles
        if (title.startsWith('http')) {
            return title;
        }

        // Clean up title and create URL
        const cleanTitle = title.replace(/ /g, '_');
        return `https://en.wikipedia.org/wiki/${cleanTitle}`;
    }

    extractTitleFromURL(url) {
        const match = url.match(/\/wiki\/([^#?]+)/);
        if (match) {
            return decodeURIComponent(match[1]).replace(/_/g, ' ');
        }
        return url;
    }

    calculateSpiralPosition(index, depth) {
        // Spiral layout parameters
        const radius = 3 + (depth * 2);
        const angle = index * 0.5; // Angle increment
        const verticalSpacing = 1.5;

        const x = Math.cos(angle) * radius;
        const y = (index * verticalSpacing) - (this.pages.length * verticalSpacing / 2);
        const z = Math.sin(angle) * radius - (depth * 3);

        return new THREE.Vector3(x, y, z);
    }

    async create3DPage(page) {
        const width = 6;
        const height = 8;

        // Create plane geometry
        const geometry = new THREE.PlaneGeometry(width, height);

        // Create iframe for Wikipedia content
        const iframe = document.createElement('iframe');
        iframe.src = page.url;
        iframe.style.width = '800px';
        iframe.style.height = '1066px';
        iframe.style.border = 'none';
        iframe.style.background = '#fff';

        // Add loading class
        page.iframe = iframe;

        // Create canvas texture
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 1066;
        const ctx = canvas.getContext('2d');

        // Draw placeholder
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#4a9eff';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Loading...', canvas.width / 2, canvas.height / 2);
        ctx.fillStyle = '#fff';
        ctx.font = '18px Arial';
        ctx.fillText(page.title, canvas.width / 2, canvas.height / 2 + 40);

        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        // Create material with the texture
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide
        });

        // Create mesh
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(page.position);
        mesh.userData = { pageIndex: page.index, isPage: true };

        // Add border
        const borderGeometry = new THREE.EdgesGeometry(geometry);
        const borderMaterial = new THREE.LineBasicMaterial({ color: 0x4a9eff, linewidth: 2 });
        const border = new THREE.LineSegments(borderGeometry, borderMaterial);
        mesh.add(border);

        page.mesh = mesh;
        page.canvas = canvas;
        page.texture = texture;

        this.sceneManager.addToScene(mesh);

        // Try to render iframe content to canvas after load
        this.attemptIframeRender(page);
    }

    attemptIframeRender(page) {
        // Note: Due to CORS restrictions, we cannot directly render Wikipedia iframes to canvas
        // Instead, we'll create a visual representation with the title
        // Users will interact with pages by clicking which will trigger navigation

        setTimeout(() => {
            const ctx = page.canvas.getContext('2d');

            // Create a nice visual representation
            const gradient = ctx.createLinearGradient(0, 0, 0, page.canvas.height);
            gradient.addColorStop(0, '#1e3a5f');
            gradient.addColorStop(1, '#0a1929');

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, page.canvas.width, page.canvas.height);

            // Draw Wikipedia logo placeholder
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 32px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Wikipedia', page.canvas.width / 2, 60);

            // Draw title
            ctx.font = 'bold 28px Arial';
            ctx.fillStyle = '#4a9eff';
            this.wrapText(ctx, page.title, page.canvas.width / 2, 140, page.canvas.width - 100, 36);

            // Draw depth indicator
            ctx.font = '18px Arial';
            ctx.fillStyle = '#888';
            ctx.fillText(`Depth: ${page.depth}`, page.canvas.width / 2, page.canvas.height - 40);

            // Draw instruction
            ctx.font = '16px Arial';
            ctx.fillStyle = '#aaa';
            ctx.fillText('Click to view full article', page.canvas.width / 2, page.canvas.height - 80);

            page.texture.needsUpdate = true;
        }, 100);
    }

    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let testLine = '';
        let lineArray = [];

        for (let n = 0; n < words.length; n++) {
            testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;

            if (testWidth > maxWidth && n > 0) {
                lineArray.push(line);
                line = words[n] + ' ';
            } else {
                line = testLine;
            }
        }
        lineArray.push(line);

        for (let k = 0; k < lineArray.length; k++) {
            ctx.fillText(lineArray[k], x, y + (k * lineHeight));
        }
    }

    addConnection(sourceIndex, targetIndex) {
        const connection = {
            source: sourceIndex,
            target: targetIndex,
            line: null
        };

        // Create line geometry
        const points = [
            this.pages[sourceIndex].position,
            this.pages[targetIndex].position
        ];

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: 0x4a9eff,
            opacity: 0.3,
            transparent: true
        });

        const line = new THREE.Line(geometry, material);
        connection.line = line;

        this.sceneManager.addToScene(line);
        this.connections.push(connection);
    }

    updateConnections() {
        // Update connection positions if pages move
        this.connections.forEach(conn => {
            if (conn.line && this.pages[conn.source] && this.pages[conn.target]) {
                const points = [
                    this.pages[conn.source].position,
                    this.pages[conn.target].position
                ];
                conn.line.geometry.setFromPoints(points);
                conn.line.geometry.attributes.position.needsUpdate = true;
            }
        });
    }

    getPage(index) {
        return this.pages[index];
    }

    getAllPages() {
        return this.pages;
    }

    setActivePage(pageIndex) {
        this.activePage = pageIndex;
    }

    getActivePage() {
        return this.activePage !== null ? this.pages[this.activePage] : null;
    }
}
