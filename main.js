const { Plugin } = require('obsidian');

module.exports = class MermaidZoomPlugin extends Plugin {
  onload() {
    let isDragging = false;
    let startX = 0, startY = 0;
    let scrollLeft = 0, scrollTop = 0;

    // 1. Zoom with Ctrl + Scroll centered on the mouse cursor
    this.registerDomEvent(document, 'wheel', (e) => {
      const container = e.target.closest('.mermaid, .block-language-mermaid');
      if (!container || !e.ctrlKey) return;

      const svg = container.querySelector('svg');
      if (!svg) return;

      e.preventDefault();

      // Relative coordinates of the cursor inside the container
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const oldWidth = svg.getBoundingClientRect().width;
      const factor = e.deltaY < 0 ? 1.15 : 0.87;
      const newWidth = Math.min(Math.max(150, oldWidth * factor), 12000);
      const k = newWidth / oldWidth;

      svg.style.setProperty('max-width', 'none', 'important');
      svg.style.width = `${newWidth}px`;
      svg.style.height = 'auto';

      // Keep the exact point under the mouse anchored during zoom
      container.scrollLeft = (container.scrollLeft + mouseX) * k - mouseX;
      container.scrollTop = (container.scrollTop + mouseY) * k - mouseY;
    }, { passive: false });

    // 2. Click & drag to pan smoothly
    this.registerDomEvent(document, 'mousedown', (e) => {
      const container = e.target.closest('.mermaid, .block-language-mermaid');
      if (!container || e.button !== 0) return;

      isDragging = true;
      startX = e.pageX - container.offsetLeft;
      startY = e.pageY - container.offsetTop;
      scrollLeft = container.scrollLeft;
      scrollTop = container.scrollTop;
      container.style.cursor = 'grabbing';
      e.preventDefault(); // Prevents accidental text selection while dragging
    });

    this.registerDomEvent(document, 'mousemove', (e) => {
      if (!isDragging) return;
      const container = e.target.closest('.mermaid, .block-language-mermaid');
      if (!container) return;

      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const y = e.pageY - container.offsetTop;
      container.scrollLeft = scrollLeft - (x - startX);
      container.scrollTop = scrollTop - (y - startY);
    });

    const stopDragging = () => {
      if (isDragging) {
        isDragging = false;
        document.querySelectorAll('.mermaid, .block-language-mermaid').forEach((el) => {
          el.style.cursor = '';
        });
      }
    };

    this.registerDomEvent(document, 'mouseup', stopDragging);
    this.registerDomEvent(document, 'mouseleave', stopDragging);

    // 3. Double-click to snap back to default view
    this.registerDomEvent(document, 'dblclick', (e) => {
      const container = e.target.closest('.mermaid, .block-language-mermaid');
      if (!container) return;
      const svg = container.querySelector('svg');
      if (!svg) return;

      svg.style.removeProperty('width');
      svg.style.removeProperty('max-width');
      svg.style.removeProperty('height');
      container.scrollLeft = 0;
      container.scrollTop = 0;
    });
  }
};
