// UI Manager for controls and page list
class UIManager {
    constructor(pageManager, navigationManager) {
        this.pageManager = pageManager;
        this.navigationManager = navigationManager;

        this.elements = {
            startUrl: document.getElementById('startUrl'),
            startBtn: document.getElementById('startBtn'),
            zoomOutBtn: document.getElementById('zoomOutBtn'),
            resetViewBtn: document.getElementById('resetViewBtn'),
            pageList: document.getElementById('pageList'),
            pageCount: document.getElementById('pageCount'),
            loading: document.getElementById('loading'),
            pageModal: document.getElementById('pageModal'),
            modalTitle: document.getElementById('modalTitle'),
            modalIframe: document.getElementById('modalIframe'),
            closeModal: document.getElementById('closeModal'),
            modalLinkInput: document.getElementById('modalLinkInput'),
            addLinkBtn: document.getElementById('addLinkBtn')
        };

        this.currentModalPageIndex = null;
        this.messageListenerAdded = false;

        this.init();
    }

    init() {
        // Start button
        this.elements.startBtn.addEventListener('click', () => this.onStartClick());

        // Enter key in input
        this.elements.startUrl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.onStartClick();
            }
        });

        // Zoom out button
        this.elements.zoomOutBtn.addEventListener('click', () => {
            this.navigationManager.zoomOutToSeeAll();
        });

        // Reset view button
        this.elements.resetViewBtn.addEventListener('click', () => {
            this.navigationManager.resetView();
        });

        // Close modal button
        this.elements.closeModal.addEventListener('click', () => {
            this.closePageModal();
        });

        // Close modal on background click
        this.elements.pageModal.addEventListener('click', (e) => {
            if (e.target === this.elements.pageModal) {
                this.closePageModal();
            }
        });

        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.elements.pageModal.classList.contains('active')) {
                this.closePageModal();
            }
        });

        // Add link button in modal
        this.elements.addLinkBtn.addEventListener('click', () => {
            this.onAddLinkClick();
        });

        // Enter key in modal link input
        this.elements.modalLinkInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.onAddLinkClick();
            }
        });
    }

    async onAddLinkClick() {
        const input = this.elements.modalLinkInput.value.trim();
        if (!input) {
            return;
        }

        let title;
        if (input.includes('wikipedia.org')) {
            title = this.pageManager.extractTitleFromURL(input);
        } else {
            title = input;
        }

        // Get the source page index from the current modal page
        const sourcePageIndex = this.currentModalPageIndex;

        // Add the new page
        await this.addPageFromLink(title, sourcePageIndex);

        // Clear the input
        this.elements.modalLinkInput.value = '';
    }

    async onStartClick() {
        const input = this.elements.startUrl.value.trim();
        if (!input) {
            alert('Please enter a Wikipedia URL or article name');
            return;
        }

        this.showLoading();

        try {
            let title;
            if (input.includes('wikipedia.org')) {
                title = this.pageManager.extractTitleFromURL(input);
            } else {
                title = input;
            }

            const page = await this.pageManager.createPage(title);
            this.addPageToList(page);
            this.updatePageCount();
            this.navigationManager.focusOnPage(page.index);

            // Clear input
            this.elements.startUrl.value = '';
        } catch (error) {
            console.error('Error creating page:', error);
            alert('Error loading Wikipedia page. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    addPageToList(page) {
        const pageItem = document.createElement('div');
        pageItem.className = 'page-item';
        pageItem.dataset.pageIndex = page.index;

        const title = document.createElement('div');
        title.className = 'title';
        title.textContent = page.title;

        const depth = document.createElement('div');
        depth.className = 'depth';
        depth.textContent = `Depth: ${page.depth} | Click to focus`;

        pageItem.appendChild(title);
        pageItem.appendChild(depth);

        pageItem.addEventListener('click', () => {
            this.onPageListItemClick(page.index);
        });

        this.elements.pageList.appendChild(pageItem);

        // Scroll to bottom
        this.elements.pageList.scrollTop = this.elements.pageList.scrollHeight;
    }

    onPageListItemClick(pageIndex) {
        // Remove active class from all items
        const items = this.elements.pageList.querySelectorAll('.page-item');
        items.forEach(item => item.classList.remove('active'));

        // Add active class to clicked item
        const clickedItem = this.elements.pageList.querySelector(`[data-page-index="${pageIndex}"]`);
        if (clickedItem) {
            clickedItem.classList.add('active');
        }

        // Focus camera on page
        this.navigationManager.focusOnPage(pageIndex);
    }

    updatePageCount() {
        const count = this.pageManager.getAllPages().length;
        this.elements.pageCount.textContent = count;
    }

    showLoading() {
        this.elements.loading.classList.add('active');
    }

    hideLoading() {
        this.elements.loading.classList.remove('active');
    }

    // Method to programmatically add a page (for link clicking)
    async addPageFromLink(title, sourcePageIndex) {
        // Close the modal first
        this.closePageModal();

        this.showLoading();

        try {
            const page = await this.pageManager.createPage(title, sourcePageIndex);
            this.addPageToList(page);
            this.updatePageCount();
            this.navigationManager.focusOnPage(page.index);
            return page;
        } catch (error) {
            console.error('Error creating page from link:', error);
            alert('Error loading Wikipedia page. Please try again.');
            return null;
        } finally {
            this.hideLoading();
        }
    }

    // Open a page in the modal viewer
    openPageModal(pageIndex) {
        const page = this.pageManager.getPage(pageIndex);
        if (!page) return;

        this.currentModalPageIndex = pageIndex;
        this.elements.modalTitle.textContent = page.title;
        this.elements.modalIframe.src = page.url;
        this.elements.pageModal.classList.add('active');

        // Setup message listener for iframe communication (if needed in future)
        if (!this.messageListenerAdded) {
            window.addEventListener('message', (e) => this.handleIframeMessage(e));
            this.messageListenerAdded = true;
        }
    }

    // Close the page modal
    closePageModal() {
        this.elements.pageModal.classList.remove('active');
        this.elements.modalIframe.src = '';
        this.currentModalPageIndex = null;
    }

    // Handle messages from iframe (for future use)
    handleIframeMessage(event) {
        // This could be used for cross-origin communication if needed
        // For now, we'll rely on users manually clicking links in the iframe
        console.log('Iframe message:', event);
    }
}
