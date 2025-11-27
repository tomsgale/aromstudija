 if (!customElements.get('collection-list')) {
  class CollectionList extends HTMLElement {
    constructor() {
      super();

      this.images = this.querySelectorAll('.colgrid__bg--full');
      this.buttons = Array.from(this.querySelectorAll('.colgrid__box'));
    }
    connectedCallback() {
      this.buttons.forEach((button, i) => {
        button.addEventListener('mouseover', (event) => {
          this.onHover(event, button, i);
        });
      });
      if (Shopify.designMode) {
        this.addEventListener('shopify:block:select', (event) => {
          this.buttons = Array.from(this.querySelectorAll('.colgrid__box'));
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
  }
  customElements.define('collection-list', CollectionList);
}