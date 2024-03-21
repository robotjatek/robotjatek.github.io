'use strict';

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
            const page = await getPage(url);
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
        const split = window.location.href.split('#');
        const page = split[1];
        const subPage = split[2];
        await router.navigate(page, subPage, page + 'Nav');
    }
}

window.addEventListener('load', onPageLoad);
window.addEventListener('hashchange', async (event) => {
    const split = event.newURL.split('#');
    const page = split[1];
    const subPage = split[2];
    await router.navigate(page, subPage, page + 'Nav');
});