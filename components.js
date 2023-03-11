const COMPONENTS = {
    header: function () {
        Vue.component('socializher-header', {
            data: function () {
                var data = {
                    pageName: '',
                    hasSession: false,
                    search: '',
                    waiting: false,
                    searchResult: [],
                    defaults: {
                        profile: '../shared/images/profile_1.png',
                        cover: '../shared/images/cover_1.jpg'
                    }
                };
                return data;
            },
            methods: {
                LogOut() {
                    COMPONENTS.OpenLoader();
                    $.ajax({
                        url: '/users/logout',
                        type: 'POST',
                        data: {},
                        success: function (data, status, xhr) {
                            window.location.href = '/';
                        },
                        error: function (xhr, status, error) {
                            window.location.href = '/';
                        }
                    });
                },
                SearchFriends(event) {
                    if(event) {
                        event.preventDefault();
                    }

                    var self = this;
                    var nombreBuscar = this.search.trim();
                    if (nombreBuscar !== '') {
                        COMPONENTS.OpenLoader();
                        this.Throttle(function () {
                            self.searchResult = [];
                            $('#search-results').show();
                            //AJAX al endpoint /friends/search?q=texto
                            $.ajax({
                                url: `/friends/search?q=${nombreBuscar}`,
                                type: 'GET',
                                success: function (data, status, xhr) {
                                    self.searchResult = data;
                                    COMPONENTS.HideLoader();
                                },
                                error: function (xhr, status, error) {
                                    COMPONENTS.HideLoader();
                                    //window.location.href = '/';
                                }
                            })
                        }, 250)();
                    }
                },
                Throttle(callback, limit) {
                    this.waiting = false; // Initially, we're not waiting
                    return function () { // We return a throttled function
                        if (!this.waiting) { // If we're not waiting
                            callback.apply(this, arguments); // Execute users function
                            this.waiting = true; // Prevent future invocations
                            setTimeout(function () { // After a period of time
                                this.waiting = false; // And allow future invocations
                            }, limit);
                        }
                    }
                },
                ViewProfile(id) {
                    //console.log('Debe redirigir a /profile?user=' + id);
                    window.location.href = "/profile?user=" + id;
                }
            },
            mounted() {
                if(window.location.href.includes('/profile')) {
                    this.pageName = 'PROFILE';
                }

                this.hasSession = document.cookie.includes('SSID=') && document.cookie.includes('SH_TK=');
                $(document).on('keydown', function (event) {
                    if (event.keyCode === 27) {
                        $('#search-results').hide();
                    }
                });

                $(document).on('mousedown', function (event) {
                    if (!event.target.id.includes('search-results') && event.target.id !== 'buscador') {
                        $('#search-results').hide();
                    }
                });
            },
            template: `<header class="main-header">
                        <nav class="navbar navbar-expand-md navbar-light">
                            <div class="container">
                                <button class="navbar-toggler" type="button" data-bs-toggle="collapse"
                                    data-bs-target="#navbarTogglerDemo03" aria-controls="navbarTogglerDemo03" aria-expanded="false"
                                    aria-label="Toggle navigation">
                                    <span class="navbar-toggler-icon"></span>
                                </button>
                                <span class="navbar-brand">
                                    <img class="logo" src="../shared/images/globe.png" alt="Socializher Logo">
                                </span>
                                <div class="collapse navbar-collapse" id="navbarTogglerDemo03">
                                    <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                                        <li class="nav-item">
                                            <a class="nav-link active" aria-current="page" href="/home">Home</a>
                                        </li>
                                        <li v-if="hasSession" class="nav-item">
                                            <a class="nav-link" href="/profile">Profile</a>
                                        </li>
                                        <li v-else class="nav-item">
                                            <a class="nav-link" href="/login">Iniciar Sesión</a>
                                        </li>
                                        <li v-if="pageName === 'PROFILE'" class="nav-item friends-search position-relative">
                                            <form v-on:submit="SearchFriends($event)">
                                                <input v-on:input="SearchFriends()"
                                                       id="buscador" 
                                                       class="form-control me-2" 
                                                       type="search" 
                                                       placeholder="Buscar amigos" 
                                                       aria-label="Buscar amigos"
                                                       v-model="search">
                                            </form>
                                            <div id="search-results">
                                                <section class="result" v-show="!searchResult.length">
                                                    <h5 class="text-center m-0">No se encontraron resultados :(</h5>
                                                </section>
                                                <section v-show="searchResult.length">
                                                    <template v-for="user in searchResult">
                                                        <article class="result position-relative" >
                                                            <div v-bind:id="'search-results-' + user.id" class="result-wrapper" v-on:click="ViewProfile(user.id)"></div>
                                                            <img v-bind:src="user.profilePicture || defaults.profile">
                                                            <div class="h-100 float-left p-2 result-user-detail">
                                                                <div class="d-block text-truncate name">{{user.name}} {{user.lastName}}</div>
                                                                <div class="d-block">{{user.isFriend || 'No agregado'}}</div>
                                                            </div>
                                                            <div class="clear-both"></div>
                                                        </article>
                                                        <div class="fake-border"></div>
                                                    </template>
                                                </section>
                                            </div>
                                        </li>
                                        <hr class="d-md-none">
                                        <li v-if="hasSession" title="Cerrar Sesión" class="nav-item">
                                            <a class="nav-link" href="#" v-on:click="LogOut()">
                                                <span class="d-lg-inline text-logout">
                                                    Cerrar Sesión
                                                </span>
                                                <span class="d-lg-none material-icons">
                                                    logout
                                                </span>
                                            </a>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </nav>
                       </header>`
        });
    },
    footer: function () {
        Vue.component('socializher-footer', {
            data: function () {
                var data = {};
                return data;
            },
            template: `<footer class="py-5">
                        <section class="container">
                            <div class="row">
                                <div class="col-lg-6 col-12">
                                    <h2 class="text-center">Socializher @2021</h2>
                                    <h3 class="text-center">Codellege Developher</h3>
                                    <h4 class="text-center">Verano 2021 - Sofftek México</h4>
                                </div>
                                <div class="col-lg-6 col-12">
                                    <iframe
                                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d5085.430010049431!2d-100.39481617574626!3d25.673215806031735!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x866295f4b8427dff%3A0x33d068574599460b!2sSofttek!5e0!3m2!1ses-419!2smx!4v1637967297508!5m2!1ses-419!2smx"
                                        width="100%" height="auto" style="border:0;" allowfullscreen="" loading="lazy"></iframe>
                                </div>
                            </div>
                        </section>
                       </footer>`
        });
    },
    OpenLoader: function (message) {
        if (!$('#app > #loader').length) {
            $('#app').append(`<section id="loader">
                                <article class="w-100 text-center">
                                    <span class="spinner-border" role="status"></span>
                                    ${message || 'Espere un momento...'}
                                </article>
                              </section>`);
        }
    },
    HideLoader: function () {
        $('#app > #loader').remove();
    }
}