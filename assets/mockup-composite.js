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
    const { x, y, width, height } = this.position;

    // Set canvas size to match mockup dimensions
    this.canvas.width = mockup.naturalWidth;
    this.canvas.height = mockup.naturalHeight;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw mockup template first, then product image on top (for sticker/label effect)
    this.ctx.drawImage(mockup, 0, 0);
    this.ctx.drawImage(product, x, y, width, height);
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
