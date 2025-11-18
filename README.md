# WikiWander - 3D Wikipedia Visualizer

A fully client-side 3D visualization tool for exploring Wikipedia. Navigate through Wikipedia articles in stunning 3D space, where each page floats in the center surrounded by a constellation of linked articles.

## Features

- **3D Page Rendering**: Wikipedia pages rendered as floating textured planes in 3D space
- **Link Constellation**: Up to 100 Wikipedia links displayed as bright blue circles arranged in a circle around the main page
- **Interactive Navigation**: Click on any blue circle to navigate to that article
- **Page History**: Previously viewed pages move into the constellation as you navigate
- **Smooth Controls**: Drag to rotate, scroll to zoom, click to navigate
- **Fully Client-Side**: No server required, works entirely in your browser
- **Single Directory**: All files in one folder for easy deployment

## How to Use

### Getting Started

1. Open `index.html` in a modern web browser (Chrome, Firefox, Safari, or Edge)
2. Enter a Wikipedia article name (e.g., "Solar System") or full URL in the input field
3. Click "Load Article" or press Enter
4. Watch as the page appears in 3D space with linked articles as blue circles around it

### Navigation

- **Rotate View**: Click and drag anywhere to rotate the camera around the visualization
- **Zoom**: Use mouse wheel to zoom in and out
- **Navigate**: Click on any blue circle to load that linked article
- **Labels**: Each blue circle is labeled with the article title

### How It Works

1. When you load an article, WikiWander fetches it from Wikipedia's API
2. The main article appears as a textured plane in the center of 3D space
3. The first 100 Wikipedia links are extracted and displayed as bright blue (#4da6ff) circles
4. Links are arranged in a circular constellation around the main page
5. Each link is labeled and large enough to click easily
6. Clicking a link loads that article and moves the previous page into the constellation
7. **All previously visited pages remain as blue circles** - you can click them to navigate back
8. Build up an entire web of knowledge as you explore!

## Technical Details

### Technologies

- **Three.js** (r128): WebGL-based 3D rendering (only framework used)
- **Vanilla JavaScript**: Pure ES6+, no other frameworks
- **CSS3**: Modern styling
- **Wikipedia API**: For fetching article content and links

### File Structure

```
WikiWander/
├── index.html    # Main HTML file
├── style.css     # All styles
├── app.js        # Complete application logic
└── README.md     # This file
```

### Browser Requirements

- Modern browser with WebGL support (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- JavaScript enabled
- Internet connection (to fetch Wikipedia content)

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

### Direct File Access

You can also simply open `index.html` directly in your browser (file:// protocol).

### Web Hosting

Upload all files to any web hosting service. Works with both HTTP and HTTPS.

## Features in Detail

### Constellation Layout

- Links are evenly distributed in a circle with 15-unit radius
- Slight vertical variation for visual interest
- Semi-transparent connection lines from center to each link
- Blue spheres with emissive glow effect

### Circle Specifications

- **Color**: Bright blue (#4da6ff)
- **Size**: 0.5-unit radius (large enough for easy clicking)
- **Spacing**: Evenly distributed to prevent overlap
- **Label**: Each circle has a text label above it
- **Interactivity**: Clickable for navigation

### Visual Effects

- Starfield background (1000 stars)
- Atmospheric fog effect
- Rotating link spheres
- Labels always face the camera
- Smooth camera controls

## Limitations

- Wikipedia API rate limits may apply for excessive requests
- Some Wikipedia pages may have fewer than 100 links
- Visual representation of page content is simplified (title + description)

## Credits

- [Three.js](https://threejs.org/) - 3D graphics library
- [Wikipedia](https://www.wikipedia.org/) - Content source
- Built with only Three.js as requested (no other frameworks)

---

**Happy WikiWandering!** 🌐✨
