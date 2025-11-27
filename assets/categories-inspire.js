 if (!customElements.get('categories-inspire')) {
  class CategoriesInspire extends HTMLElement {
    constructor() {
      super();

      this.images = this.querySelectorAll('.categories-i-bg');
      this.buttons = Array.from(this.querySelectorAll('.categories-i-box'));
    }
    connectedCallback() {
      this.buttons.forEach((button, i) => {
        button.addEventListener('mouseover', (event) => {
          this.onHover(event, button, i);
        });
        button.addEventListener('mouseout', () => {
            this.onMouseOut();
          });
      });
      if (Shopify.designMode) {
        this.addEventListener('shopify:block:select', (event) => {
          this.buttons = Array.from(this.querySelectorAll('.categories-i-box'));
          let index = this.buttons.indexOf(event.target);
          if (index !== -1 && this.buttons[index]) {
            this.buttons[index].dispatchEvent(new Event('mouseover'));
          }
        });
      }
    }
    onHover(event, button, i) {
      this.images.forEach((image, index) => {
        image.classList.remove('active');
        if (i == index) {
          image.classList.add('active');
        }
      });
      this.buttons.forEach((this_button, index) => {
        this_button.classList.remove('active');
      });
      button.classList.add('active');
    }
    onMouseOut() {
        this.images.forEach((image) => {
          image.classList.remove('active');
        });
        this.buttons.forEach((button) => {
          button.classList.remove('active');
        });
      }
  }
  customElements.define('categories-inspire', CategoriesInspire);
}