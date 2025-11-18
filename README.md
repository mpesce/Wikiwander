# WikiWander - 3D Wikipedia Visualizer

A fully client-side 3D visualization tool for exploring Wikipedia. Navigate through Wikipedia articles in a stunning 3D space, creating a visual web of knowledge as you explore.

## Features

- **3D Visualization**: Wikipedia pages rendered as floating planes in 3D space
- **Spiral Layout**: Pages are arranged in an elegant spiral pattern
- **Interactive Navigation**: Click, drag, and zoom to explore your knowledge graph
- **Link Following**: Easy interface to add linked Wikipedia articles
- **Connection Tracking**: Visual lines showing relationships between pages
- **Performance Optimized**: Supports 50+ pages without performance degradation
- **Fully Client-Side**: No server required, works entirely in your browser
- **No HTTPS Required**: Can be served from any web server

## How to Use

### Getting Started

1. Open `index.html` in a modern web browser
2. Enter a Wikipedia article name or URL in the input field
3. Click "Start Journey" to begin your exploration

### Navigation Controls

- **Drag**: Click and drag to rotate the camera around the visualization
- **Scroll**: Use mouse wheel to zoom in and out
- **Click Page**: Click on any page in 3D space to view its full content
- **Zoom Out**: Click "Zoom Out (See All)" to see your entire knowledge graph
- **Reset View**: Return to the currently active page

### Adding New Pages

1. Click on any Wikipedia page in the 3D space
2. A modal window will open with the full Wikipedia article
3. Browse the article and find interesting links
4. Right-click on a Wikipedia link and copy its URL
5. Paste the URL in the "Add to Visualization" field at the bottom of the modal
6. Press Enter or click "Add to Visualization"
7. The new page will appear in 3D space, connected to the source page

### Page List

The right sidebar shows all open pages:
- Current depth in the exploration tree
- Click any page in the list to focus on it
- Total page count is displayed at the top

## Technical Details

### Technologies Used

- **Three.js** (r128): WebGL-based 3D rendering
- **Vanilla JavaScript**: No frameworks, pure ES6+
- **CSS3**: Modern styling with backdrop filters
- **Wikipedia**: For article content

### File Structure

```
WikiWander/
├── index.html              # Main HTML file
├── css/
│   └── style.css          # All styles
├── js/
│   ├── main.js            # Application entry point
│   ├── scene.js           # Three.js scene management
│   ├── pageManager.js     # Wikipedia page handling
│   ├── navigation.js      # Camera controls and interaction
│   └── ui.js              # UI controls and modal management
└── README.md              # This file
```

### Architecture

- **SceneManager**: Handles Three.js scene, camera, renderer, and lighting
- **PageManager**: Manages Wikipedia pages, 3D representations, and connections
- **NavigationManager**: Handles camera movement, user input, and page interactions
- **UIManager**: Controls UI elements, modals, and page list
- **WikiWander**: Main application class that coordinates all components

### Performance

- Optimized for 50+ pages
- Efficient memory management
- RequestAnimationFrame for smooth 60fps rendering
- Automatic pause when tab is not visible

## Browser Compatibility

Tested and working on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires:
- WebGL support
- ES6+ JavaScript support
- CSS3 with backdrop-filter support

## Deployment

### Local Server

You can serve this application using any web server:

**Python 3:**
```bash
python -m http.server 8000
```

**Python 2:**
```bash
python -m SimpleHTTPServer 8000
```

**Node.js:**
```bash
npx http-server
```

**PHP:**
```bash
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

### File Server

Simply open `index.html` directly in your browser (file:// protocol works fine).

## Limitations

- Wikipedia iframe content is subject to CORS restrictions
- Links must be manually copied and pasted (automatic link detection not possible due to CORS)
- Some Wikipedia pages may not load in iframes due to X-Frame-Options headers

## Future Enhancements

- Search functionality within the visualization
- Page preview on hover
- Different layout algorithms (tree, force-directed, etc.)
- Export visualization as image or data
- Save/load session state
- Filter pages by topic or category
- VR support

## Credits

Created with:
- [Three.js](https://threejs.org/) - 3D graphics library
- [Wikipedia](https://www.wikipedia.org/) - Free encyclopedia

---

**Happy WikiWandering!** 🌐✨
