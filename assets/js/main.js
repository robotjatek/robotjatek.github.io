'use strict';

const router = {
    activeRoute: {
        template: null,
        path: null
    },

    routes: {},

    navigate: async function (path, navId) {
        // Show default page when the selected route does not exist
        const selectedRoute = this.routes[path];
        if (!selectedRoute) {
            await this.navigate('404', '');
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

            const pageUrl = `/pages/${selectedRoute.template}`;
            const page = await getPage(pageUrl);
            const contentDiv = document.getElementById('contentContainer');
            contentDiv.innerHTML = page;
        }
    },
};

const getPage = async (url) => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            return 'Template not found';
        }

        const page = await response.text();
        return page;
    } catch {
        return 'Failed to load';
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
        // Try to navigate to the page defined by the URL
        const hash = window.location.href.split('#')[1];
        await router.navigate(hash, hash + 'Nav');
    }
}

window.addEventListener('load', onPageLoad);
window.addEventListener('hashchange', async (event) => {
    const hash = event.newURL.split('#')[1];
    await router.navigate(hash, hash + 'Nav');
});