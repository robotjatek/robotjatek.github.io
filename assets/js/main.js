'use strict';

const titleTextTyper = {
    cursorPosition: 0,
    cursorState: true,
    blinkInterval: null,
    titleText: location.hostname,

    type() {
        const title = document.getElementById('parallax-title');
        title.innerText = this.titleText.substring(0, this.cursorPosition)+'|';

        if (this.cursorPosition < this.titleText.length) {
            this.cursorPosition++;
            const delayBeforeNextChar = Math.random() * 50 + 80;
            setTimeout(() => this.type(), delayBeforeNextChar);
        } else {
            // blinking cursor
            if (!this.blinkInterval) {
                this.blinkInterval = setInterval(() => {
                    this.cursorState ?
                        title.innerText = this.titleText :
                        title.innerText = this.titleText + '|';
                    this.cursorState = !this.cursorState;
                }, 450);
            }
        }
    }
}

const router = {
    activeRoute: {
        template: null,
        path: null
    },

    routes: {},

    navigate: async function (path, subPage, navId) {
        // Show default page when no navigation info is present (eg.: first navigation)
        if (!path) {
            await this.navigate('about', null, 'aboutNav');
            return;
        }

        // Show 404 page when the selected route does not exist
        const selectedRoute = this.routes[path];
        if (!selectedRoute) {
            await this.navigate('404', null, '');
            return;
        }

        // Remove active class from the previously active navlink
        if (this.activeRoute) {
            const oldNav = document.getElementById(this.activeRoute.path + 'Nav');
            if (oldNav) {
                oldNav.classList.remove('active');
            }
        }

        // Change the current route and add the active class to the currently active navlink
        if (path) {
            this.activeRoute = selectedRoute;
            const nav = document.getElementById(navId);
            if (nav) {
                nav.classList.add('active');
            }

            const url = !subPage ? `/pages/${selectedRoute.template}` : `/pages/${path}/${subPage}.html`
            const page = await this._getPage(url);
            const contentDiv = document.getElementById('contentContainer');
            contentDiv.innerHTML = page;
        }
    },

    navigateToRouteByUrl: async function () {
        // Try to navigate to the page defined by the URL
        const hash = location.hash.slice(1);
        const [_, page, subPage] = hash.split('/');
        await this.navigate(page, subPage, page + 'Nav');
    },

    _getPage: async function (url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                return 'Template not found';
            }

            return await response.text();
        } catch {
            return 'Failed to load';
        }
    }
};

const onPageLoad = async () => {
    // Register routes
    router.routes['404'] = { template: 'notfound.html', path: '404'};
    router.routes['about'] = { template: 'about.html', path: 'about' };
    router.routes['projects'] = { template: 'projects.html', path: 'projects' };
    router.routes['cv'] = { template: 'cv.html', path: 'cv' };
    router.routes['contact'] = { template: 'contact.html', path: 'contact' };

    // Preserve active page between page reloads
    if (!router.activeRoute.path) {
        await router.navigateToRouteByUrl();
    }

    titleTextTyper.type();
}

window.addEventListener('load', onPageLoad);
window.addEventListener('hashchange', async () => await router.navigateToRouteByUrl());
