// Main application entry point
class WikiWander {
    constructor() {
        this.sceneManager = null;
        this.pageManager = null;
        this.navigationManager = null;
        this.uiManager = null;

        this.animationId = null;
    }

    async init() {
        console.log('Initializing WikiWander...');

        // Get canvas element
        const canvas = document.getElementById('canvas3d');

        // Initialize scene
        this.sceneManager = new SceneManager();
        this.sceneManager.init(canvas);

        // Initialize page manager
        this.pageManager = new PageManager(this.sceneManager);

        // Initialize navigation
        this.navigationManager = new NavigationManager(this.sceneManager, this.pageManager);

        // Initialize UI
        this.uiManager = new UIManager(this.pageManager, this.navigationManager);

        // Connect navigation page clicks to UI modal
        this.navigationManager.setPageClickCallback((pageIndex) => {
            this.uiManager.openPageModal(pageIndex);
        });

        // Start animation loop
        this.animate();

        console.log('WikiWander initialized successfully!');

        // Set default article suggestion
        document.getElementById('startUrl').placeholder = 'e.g., "Albert Einstein" or Wikipedia URL';
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());

        // Update any animations or dynamic elements here
        this.update();

        // Render the scene
        this.sceneManager.render();
    }

    update() {
        // Update page rotations to face camera (optional)
        const pages = this.pageManager.getAllPages();
        const camera = this.sceneManager.getCamera();

        pages.forEach(page => {
            if (page.mesh) {
                // Make pages face the camera
                page.mesh.lookAt(camera.position);
            }
        });
    }

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
}

// Initialize application when DOM is ready
let app;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

function initApp() {
    app = new WikiWander();
    app.init();
}

// Handle page visibility changes to pause/resume animation
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        if (app) app.stop();
    } else {
        if (app) app.animate();
    }
});
