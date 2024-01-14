'use strict';

const router = {
    activeRoute: {
        template: null,
        path: null
    },

    routes: {},

    navigate: function (path, navId) {
        // Show default page when the selected route does not exist
        const selectedRoute = this.routes[path];
        if (!selectedRoute) {
            this.navigate('about', 'aboutNav');
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
            this.activeRoute = this.routes[path];
            const nav = document.getElementById(navId);
            if (nav) {
                nav.classList.add('active');
            }
        }
    },
};

const onPageLoad = () => {
    // Register routes
    router.routes['about'] = { template: 'aboutTemplate', path: 'about' };
    router.routes['projects'] = { template: 'projectsTemplate', path: 'projects' };
    router.routes['cv'] = { template: 'cvTemplate', path: 'cv' };
    router.routes['contact'] = { template: 'contactTemplate', path: 'contact' };

    // Preserve active page between page reloads
    if (!router.activeRoute.path) {
        // Try to navigate to the page defined by the URL
        const hash = window.location.href.split('#')[1];
        router.navigate(hash, hash + 'Nav');
    }
}

window.addEventListener('load', onPageLoad);
window.addEventListener('hashchange', (event) => {
    const hash = event.newURL.split('#')[1];
    router.navigate(hash, hash + 'Nav');
});