const fs = require('fs');
const path = require('path');

// Simple base64 encoded PNG data for a blue square with POS text
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create a simple PNG icon data (this is a minimal blue square)
const createSimpleIcon = (size) => {
  // This is a very basic approach - in production you'd use a proper image library
  const canvas = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#3b82f6"/>
          <stop offset="100%" style="stop-color:#1d4ed8"/>
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size * 0.1}"/>
      <text x="${size/2}" y="${size*0.6}" font-family="Arial" font-size="${size*0.3}" font-weight="bold" text-anchor="middle" fill="white">POS</text>
    </svg>
  `;
  
  return canvas;
};

// Generate icons
iconSizes.forEach(size => {
  const svgContent = createSimpleIcon(size);
  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(__dirname, 'public', 'icons', filename);
  
  fs.writeFileSync(filepath, svgContent);
  console.log(`Generated ${filename}`);
});

console.log('All icons generated successfully!');
