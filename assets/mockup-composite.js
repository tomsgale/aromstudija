/**
 * Mockup Compositor
 *
 * Composites product images onto mockup templates using HTML5 Canvas
 * Only applies to first product image - additional images show as regular
 */

class MockupCompositor {
  constructor(canvas, mockupType, productImageUrl, positions, mockupBaseUrl) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.mockupType = mockupType;
    this.productImageUrl = productImageUrl;
    this.mockupBaseUrl = mockupBaseUrl;

    // Get position config for this mockup type or use defaults
    this.position = positions[mockupType] || {
      x: 0,
      y: 0,
      width: 300,
      height: 300
    };

    // Build mockup URL from base URL and type
    this.mockupUrl = `${mockupBaseUrl}/mockup-${mockupType}.png`;

    this.images = {
      mockup: null,
      product: null
    };
  }

  /**
   * Load a single image with CORS support
   */
  loadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));

      img.src = url;
    });
  }

  /**
   * Load both mockup template and product image
   */
  async loadImages() {
    try {
      const [mockup, product] = await Promise.all([
        this.loadImage(this.mockupUrl),
        this.loadImage(this.productImageUrl)
      ]);

      this.images.mockup = mockup;
      this.images.product = product;

      return true;
    } catch (error) {
      console.error('[Mockup Compositor] Image loading failed:', error);
      throw error;
    }
  }

  /**
   * Composite product image onto mockup template
   */
  composite() {
    const { mockup, product } = this.images;
    const { x, y, width, height, curve_strength, crop_left } = this.position;

    // Set canvas size to match mockup dimensions
    this.canvas.width = mockup.naturalWidth;
    this.canvas.height = mockup.naturalHeight;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw mockup template first, then product image on top (for sticker/label effect)
    this.ctx.drawImage(mockup, 0, 0);

    const sourceRect = this.getSourceRect(product, crop_left);
    const strength = Math.max(0, Math.min(1, parseFloat(curve_strength) || 0));
    if (strength > 0) {
      this.drawCurvedLabel(product, x, y, width, height, strength, sourceRect);
    } else {
      this.ctx.drawImage(
        product,
        sourceRect.sx,
        sourceRect.sy,
        sourceRect.sw,
        sourceRect.sh,
        x,
        y,
        width,
        height
      );
    }
  }

  /**
   * Compute source rectangle for optional left-side crop
   */
  getSourceRect(img, cropValue) {
    let fraction = parseFloat(cropValue);
    if (isNaN(fraction)) {
      fraction = 1;
    }
    // If value > 1 assume percent; clamp to 0-1
    if (fraction > 1) {
      fraction = fraction / 100;
    }
    fraction = Math.max(0.01, Math.min(1, fraction));

    return {
      sx: 0,
      sy: 0,
      sw: img.naturalWidth * fraction,
      sh: img.naturalHeight
    };
  }

  /**
   * Draw the product image with a simple top/bottom bow (cylindrical label)
   * strength: 0–1, controls how much the center droops relative to edges
   */
  drawCurvedLabel(img, x, y, width, height, strength, sourceRect) {
    const curvePx = height * strength * 0.3; // how far center drops
    const steps = Math.min(200, Math.max(40, Math.floor(width / 2)));
    const sliceW = width / steps;

    // Render source into an offscreen canvas at target size
    const buffer = document.createElement('canvas');
    buffer.width = width;
    buffer.height = height;
    const bctx = buffer.getContext('2d');
    bctx.drawImage(
      img,
      sourceRect.sx,
      sourceRect.sy,
      sourceRect.sw,
      sourceRect.sh,
      0,
      0,
      width,
      height
    );

    for (let i = 0; i < steps; i++) {
      const progress = i / (steps - 1); // 0 left, 1 right
      const offset = curvePx * Math.sin(Math.PI * progress); // center drops most

      const sx = i * sliceW;
      const sw = sliceW;

      const dx = x + i * sliceW;
      const dy = y + offset;
      const dw = sliceW;
      const dh = height;

      this.ctx.drawImage(buffer, sx, 0, sw, height, dx, dy, dw, dh);
    }
  }

  /**
   * Main render method - orchestrates loading and compositing
   */
  async render() {
    try {
      await this.loadImages();
      this.composite();

      // Mark canvas as successfully rendered
      this.canvas.dataset.rendered = 'true';

      return true;
    } catch (error) {
      console.error('[Mockup Compositor] Rendering failed:', error);
      this.handleError();
      return false;
    }
  }

  /**
   * Handle rendering errors gracefully
   */
  handleError() {
    // Render the regular product image if available
    renderFallbackImage(this.canvas);

    // Hide canvas
    this.canvas.style.display = 'none';

    // Show noscript fallback if available
    const fallback = this.canvas.parentElement.querySelector('noscript');
    if (fallback) {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = fallback.textContent;
      fallback.parentElement.insertBefore(wrapper.firstChild, fallback);
    }
  }
}

/**
 * Initialize mockup compositing when DOM is ready
 */
function renderFallbackImage(canvas) {
  const productImage = canvas.dataset.productImage;
  if (!productImage) return;

  const img = new Image();
  img.src = productImage;
  img.alt = canvas.getAttribute('aria-label') || '';
  img.loading = canvas.getAttribute('loading') || 'lazy';
  img.width = canvas.getAttribute('width') || '';
  img.height = canvas.getAttribute('height') || '';
  img.className = canvas.className || '';

  canvas.replaceWith(img);
}

function initMockupCompositing() {
  // Get configuration from theme settings
  let mockupPositions = {};
  try {
    mockupPositions = JSON.parse(document.body.dataset.mockupPositions || '{}');
  } catch (error) {
    console.warn('[Mockup Compositor] Invalid mockup_positions JSON; falling back to regular images', error);
  }

  const mockupBaseUrl = (document.body.dataset.mockupBaseUrl || '').trim();
  const canvases = document.querySelectorAll('.mockup-canvas');

  if (!mockupBaseUrl) {
    console.warn('[Mockup Compositor] No mockup base URL configured; rendering product images instead');
    // Render normal product images so cards/pages are not blank
    canvases.forEach(renderFallbackImage);
    return;
  }

  // Create IntersectionObserver for lazy loading
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !entry.target.dataset.composited) {
          const canvas = entry.target;

          // Get configuration from data attributes
          const mockupType = canvas.dataset.mockupType;
          const productImage = canvas.dataset.productImage;

          if (!mockupType || !productImage) {
            console.warn('[Mockup Compositor] Missing required data attributes');
            return;
          }

          // Create compositor and render
          const compositor = new MockupCompositor(
            canvas,
            mockupType,
            productImage,
            mockupPositions,
            mockupBaseUrl
          );

          compositor.render().then((success) => {
            if (success) {
              canvas.dataset.composited = 'true';

              // Unobserve after successful render
              observer.unobserve(canvas);
            }
          });
        }
      });
    },
    {
      // Start loading slightly before element enters viewport
      rootMargin: '50px'
    }
  );

  // Observe all mockup canvases
  canvases.forEach((canvas) => {
    observer.observe(canvas);
  });

  console.log(`[Mockup Compositor] Initialized with ${canvases.length} canvases`);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMockupCompositing);
} else {
  initMockupCompositing();
}

// Export for potential external use
window.MockupCompositor = MockupCompositor;
