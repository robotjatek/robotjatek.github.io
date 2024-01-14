'use strict';

const router = {
    activeRoute: {
        template: null,
        path: null
    },

    routes: {},

    navigate: function (path, navId) {
        const oldNav = document.getElementById(this.activeRoute.path + 'Nav');
        if (oldNav) {
            oldNav.classList.remove('active');
        }

        this.activeRoute = this.routes[path];

        const nav = document.getElementById(navId)
        if (nav) {
            nav.classList.add('active');
        }
    },
};

const registerRoutes = () => {
    router.routes['about'] = { template: 'aboutTemplate', path: 'about' };
    router.routes['projects'] = { template: 'projectsTemplate', path: 'projects' };
    router.routes['cv'] = { template: 'cvTemplate', path: 'cv' };
    router.routes['contact'] = { template: 'contactTemplate', path: 'contact' };

    router.navigate('about', 'aboutNav');
}

window.addEventListener('load', registerRoutes);
window.addEventListener('hashchange', (event) => {
    const hash = event.newURL.split('#')[1];
    router.navigate(hash, hash + 'Nav');
});