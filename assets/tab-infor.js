if (typeof TabInfo !== 'function') {
  class TabInfo extends HTMLElement {
    constructor() {
      super();
      this.lastSwitchTime = 0;
    }

    connectedCallback() {
      const tabButtons = this.querySelectorAll('.tab-info__js');
      const firstTabId = tabButtons[0].dataset.tab;
      this.openTab(firstTabId);
      tabButtons[0].classList.add('active');
      const firstPanel = tabButtons[0].querySelector('.tab-info__content');
      firstPanel.style.maxHeight = firstPanel.scrollHeight + "px";

      tabButtons.forEach(button => {
        button.addEventListener('click', () => {
          const currentTime = Date.now();
          const elapsedTime = currentTime - this.lastSwitchTime;

          const tabId = button.dataset.tab;
          this.openTab(tabId);
          tabButtons.forEach(btn => {
            btn.classList.remove('active');
          });
          button.classList.add('active');
          this.toggleAccordion(button);

          this.lastSwitchTime = Date.now() - elapsedTime; 

          clearInterval(this.autoSwitchInterval);
          this.startAutoSwitching();
        });
      });

     
      this.startAutoSwitching();
    }

    startAutoSwitching() {
      this.autoSwitchInterval = setInterval(() => {
        const tabButtons = this.querySelectorAll('.tab-info__js');
        const activeButton = this.querySelector('.tab-info__js.active');
        const nextButton = activeButton.nextElementSibling || tabButtons[0];

        const nextTabId = nextButton.dataset.tab;
        this.openTab(nextTabId);

        tabButtons.forEach(btn => {
          btn.classList.remove('active');
        });
        nextButton.classList.add('active');
        this.toggleAccordion(nextButton);

        this.lastSwitchTime = Date.now();
      }, 8000);
    }

    openTab(tabId) {
      const tabs = Array.from(this.querySelectorAll('.tab-info-content'));
      tabs.forEach(tab => {
        tab.classList.remove('active-tab');
      });
      document.getElementById(tabId).classList.add('active-tab');
    }

    toggleAccordion(button) {
      const panel = button.querySelector('.tab-info__content');
      const isOpen = panel.style.maxHeight !== null && panel.style.maxHeight !== "";

      const allPanels = this.querySelectorAll('.tab-info__content');
      allPanels.forEach(p => {
        p.style.maxHeight = null;
      });
      if (!isOpen) {
        panel.style.maxHeight = panel.scrollHeight + "px";
      }
    }
  }
  if (Shopify.designMode) {
    document.addEventListener('shopify:block:select', function (event) {
      var blockId = event.detail.blockId;
      activateTabByBlockId(blockId);
      stopAutoSwitching();
    });
    
    function activateTabByBlockId(blockId) {
      var tabButtons = document.querySelectorAll('.tab-info__js');
      tabButtons.forEach(button => {
        if (button.dataset.id === blockId) {
          button.click();
        }
      });
    }
    
    function stopAutoSwitching() {
      clearInterval(window.autoSwitchInterval);
    }
  }

  if (typeof customElements.get('tab-info') === 'undefined') {
    customElements.define('tab-info', TabInfo);
  }
  
  
}


