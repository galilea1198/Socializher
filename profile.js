if (!document.cookie.includes('SSID=') || !document.cookie.includes('SH_TK=')) {
    window.location.href = '/login';
}

var cookieSSID = document.cookie.match(/SSID=\w+;/);
if (cookieSSID) {
    cookieSSID = cookieSSID[0].replaceAll('SSID=', '');
    cookieSSID = cookieSSID.substring(0, cookieSSID.length - 1);
}

COMPONENTS.header();

var app = new Vue({
    el: '#app',
    data: {
        myUserID: cookieSSID,
        user: {},
        currentTime: new Date(),
        isMyProfile: true,
        isFriend: false,
        idProfile: null,
        newPost: {
            type: 'POST',
            details: null
        },
        newComment: {
            type: 'COMMENT',
            details: null,
            parentActivityId: ''
        },
        activities: [],
        uploadType: '',
        selectedPicture: '',
        selectedActivity: null,
        selectedComments: [],
        defaults: {
            profile: '../shared/images/profile_1.png',
            cover: '../shared/images/cover_1.jpg'
        }
    },
    methods: {
        AbrirBuscador: function (type) {
            this.uploadType = type;
            $('#upload-picture').click();
        },
        SubirImagen: function () {
            var self = this;
            var userPicture = '';
            if (this.uploadType === 'cover') {
                userPicture = 'profileCover'
            } else if (this.uploadType === 'profile') {
                userPicture = 'profilePicture'
            } else {
                return;
            }

            COMPONENTS.OpenLoader();

            var input = $('#upload-picture');
            var formData = new FormData();
            formData.append(userPicture, input[0].files[0]);

            $.ajax({
                url: '/users/profile',
                type: 'PUT',
                data: formData,
                processData: false,
                contentType: false,
                success: function (data, status, xhr) {
                    self.ObtenerDatosUsuario();
                },
                error: function (xhr, status, error) {
                    COMPONENTS.HideLoader();
                }
            });
        },
        ObtenerDatosUsuario() {
            var self = this;
            COMPONENTS.OpenLoader();
            var url = this.idProfile === null ? '/users/profile' : '/users/profile/' + this.idProfile;

            $.ajax({
                url: url,
                type: 'GET',
                success: function (data, status, xhr) {
                    //Actualizar todos los campos que tengan estos datos
                    self.user = data;
                    self.user.description = data.description || 'No tienes descripción aún. Actualízala!'
                    COMPONENTS.HideLoader();
                },
                error: function (xhr, status, error) {
                    window.location.href = '/login';
                }
            });
        },
        SelectActivity(activity) {
            this.selectedActivity = activity;
            this.selectedComments = [];
            COMPONENTS.OpenLoader();
            var self = this;
            $.ajax({
                url: `/activities/${this.selectedActivity.id}/comments`,
                type: 'GET',
                success: function (data, status, xhr) {
                    self.selectedComments = data;
                    self.selectedActivity.comments = self.selectedComments;
                    COMPONENTS.HideLoader();
                    $('#image-viewer').show();
                },
                error: function (xhr, status, error) {
                    COMPONENTS.HideLoader();
                    $('#image-viewer').show();
                }
            });
        },
        VisualizarImagen(image) {
            this.selectedActivity = null;
            this.selectedPicture = image;
            $('#image-viewer').show();
        },
        CerrarVisualizador() {
            $('#image-viewer').hide();
        },
        EditarDescripcion() {
            $('.user-description').removeAttr('disabled')
                .css({
                    overflow: 'auto'
                }).focus();
            document.execCommand('selectAll', false, null)
        },
        ActualizarDescripcion() {
            var self = this;
            COMPONENTS.OpenLoader();
            $.ajax({
                url: '/users/profile',
                type: 'put',
                data: {
                    description: self.user.description
                },
                success: function (data, status, xhr) {
                    //Quitar el modo edición del description
                    $('.user-description').attr('disabled', 'true');
                    COMPONENTS.HideLoader();
                },
                error: function (xhr, status, error) {
                    //TBD - Manejo de excepciones con mensajes
                    //window.location.href = '/profile';
                    COMPONENTS.HideLoader();
                }
            });
        },
        AbrirMenuMobile(id) {
            $(`#${id}`).show();
        },
        AnadirImagenesPost() {
            var imagenes = $('#post-pictures')[0];
            this.newPost.images = imagenes.files;
        },
        DeletePost(id) {
            var self = this;

            Swal.fire({
                title: 'Eliminar Publicación',
                text: 'Confirma que deseas eliminar esta publicación',
                icon: 'question',
                confirmButtonText: 'Eliminar',
                cancelButtonText: 'Cancelar',
                iconColor: 'var(--secondary-color)',
                confirmButtonColor: 'var(--base-color)',
                allowEscapeKey: true,
                allowEnterKey: false,
                showCloseButton: true,
                showCancelButton: true
            }).then(function (result) {
                if (result.value) {
                    COMPONENTS.OpenLoader();
                    $.ajax({
                        url: `/activities/${id}`,
                        type: 'DELETE',
                        success: function (data, status, xhr) {
                            COMPONENTS.HideLoader();
                            self.GetProfileActivities();
                            self.newPost = {
                                type: 'POST',
                                details: null
                            };
                        },
                        error: function (xhr, status, error) {
                            //TBD - Manejo de excepciones con mensajes
                            COMPONENTS.HideLoader();
                        }
                    });
                }
            });
        },
        DeleteComment(id) {
            var self = this;

            Swal.fire({
                title: 'Eliminar Comentario',
                text: 'Confirma que deseas eliminar este comentario',
                icon: 'question',
                confirmButtonText: 'Eliminar',
                cancelButtonText: 'Cancelar',
                iconColor: 'var(--secondary-color)',
                confirmButtonColor: 'var(--base-color)',
                allowEscapeKey: true,
                allowEnterKey: false,
                showCloseButton: true,
                showCancelButton: true
            }).then(function (result) {
                if (result.value) {
                    COMPONENTS.OpenLoader();
                    $.ajax({
                        url: `/activities/${id}`,
                        type: 'DELETE',
                        success: function (data, status, xhr) {
                            COMPONENTS.HideLoader();
                            self.SelectActivity(self.selectedActivity);
                        },
                        error: function (xhr, status, error) {
                            //TBD - Manejo de excepciones con mensajes
                            COMPONENTS.HideLoader();
                        }
                    });
                }
            });
        },
        PublicarPost() {
            var self = this;
            COMPONENTS.OpenLoader();

            if (!this.isMyProfile && this.idProfile) {
                this.newPost.userRef = this.idProfile;
            }

            var newPost = new FormData();
            var keys = Object.keys(this.newPost);
            for (var i = 0; i < keys.length; i++) {
                const postData = keys[i];
                if (postData === 'images') {
                    for (var j = 0; j < this.newPost.images.length; j++) {
                        const image = this.newPost.images[j];
                        newPost.append('images', image);
                    }
                } else {
                    newPost.append(postData, this.newPost[postData]);
                }
            }

            $.ajax({
                url: '/activities/create',
                type: 'POST',
                processData: false,
                contentType: false,
                data: newPost,
                success: function (data, status, xhr) {
                    COMPONENTS.HideLoader();
                    self.GetProfileActivities();
                    self.newPost = {
                        type: 'POST',
                        details: null
                    };
                },
                error: function (xhr, status, error) {
                    //TBD - Manejo de excepciones con mensajes
                    COMPONENTS.HideLoader();
                }
            });
        },
        PublicarComentario() {
            var self = this;
            COMPONENTS.OpenLoader();

            this.newComment.parentActivityId = this.selectedActivity.id;
            if (this.myUserID !== this.selectedActivity.userId) {
                this.newComment.userRef = this.selectedActivity.userId;
            }

            $.ajax({
                url: '/activities/create',
                type: 'POST',
                data: self.newComment,
                success: function (data, status, xhr) {
                    COMPONENTS.HideLoader();
                    self.newComment = {
                        type: 'COMMENT',
                        details: null,
                        parentActivityId: ''
                    };
                    self.SelectActivity(self.selectedActivity);
                },
                error: function (xhr, status, error) {
                    //TBD - Manejo de excepciones con mensajes
                    COMPONENTS.HideLoader();
                }
            });

        },
        GetProfileActivities() {
            var self = this;
            COMPONENTS.OpenLoader();
            var url = this.idProfile === null ? '/activities/profile' : '/activities/profile/' + this.idProfile;

            $.ajax({
                url: url,
                type: 'GET',
                success: function (data, status, xhr) {
                    COMPONENTS.HideLoader();
                    self.activities = data;
                    for (var i = 0; i < self.activities.length; i++) {
                        const activity = self.activities[i];

                        if(!activity.reactions) {
                            activity.reactions = {
                                length: 0
                            };
                        }

                        var fecha = new Date(activity.date);
                        var tiempo = self.currentTime - fecha;
                        tiempo /= 1000;
                        tiempo = Math.floor(tiempo);

                        if (tiempo < 60) {
                            activity.date = `Hace un momento`;
                        } else {
                            tiempo /= 60;
                            tiempo = Math.floor(tiempo);
                            if (tiempo < 60) {
                                activity.date = `Hace ${tiempo} minuto(s)`;
                            } else {
                                tiempo /= 60;
                                tiempo = Math.floor(tiempo);
                                if (tiempo < 24) {
                                    activity.date = `Hace ${tiempo} hora(s)`;
                                } else {
                                    tiempo /= 24;
                                    tiempo = Math.floor(tiempo);
                                    activity.date = `Hace ${tiempo} día(s)`;
                                }
                            }
                        }
                    }
                },
                error: function (xhr, status, error) {
                    //TBD - Manejo de excepciones con mensajes
                    COMPONENTS.HideLoader();
                }
            });
        },
        ModifyFriend() {
            var self = this;
            COMPONENTS.OpenLoader();

            if (!this.isFriend) {
                $.ajax({
                    url: '/friends/add/' + self.idProfile,
                    type: 'PUT',
                    success: function (data, status, xhr) {
                        COMPONENTS.HideLoader();
                        window.location.href = window.location.href;
                    },
                    error: function (xhr, status, error) {
                        //TBD - Manejo de excepciones con mensajes
                        COMPONENTS.HideLoader();
                    }
                });
            } else {
                $.ajax({
                    url: '/friends/delete/' + self.idProfile,
                    type: 'DELETE',
                    success: function (data, status, xhr) {
                        COMPONENTS.HideLoader();
                        window.location.href = window.location.href;
                    },
                    error: function (xhr, status, error) {
                        //TBD - Manejo de excepciones con mensajes
                        COMPONENTS.HideLoader();
                    }
                });
            }
        },
        ChangeProfileInfo() {
            
            var self = this;
            var birth = new Date(self.user.birth);
            birth = {
                year: birth.getFullYear(),
                month: birth.getMonth() + 1,
                day: birth.getDate() + 1
            };

            if(birth.month < 10) {
                birth.month = '0' + birth.month;
            }

            if(birth.day < 10) {
                birth.day = '0' + birth.day;
            }

            window.__changes = {
                name: false,
                lastName: false,
                email: false,
                phone: false,
                birth: false,
                sex: false
            };

            var lastError = '';

            Swal.fire({
                title: 'Información de la cuenta',
                html: `<form id="edit-user-info-form" onsubmit="event.preventDefault()">
                            <div class="input-group mb-3">
                                <span class="input-group-text">
                                    <span class="material-icons">
                                        person
                                    </span>
                                </span>
                                <input required name="name" type="text" class="form-control" placeholder="Nombre(s)"
                                    aria-label="Nombre(s)" value="${self.user.name}" oninput="CheckUserInfoChange('name', event.target, '${self.user.name}')">
                            </div>
                            <div class="input-group mb-3">
                                <span class="input-group-text">
                                    <span class="material-icons">
                                        person
                                    </span>
                                </span>
                                <input required name="lastName" type="text" class="form-control" placeholder="Apellido(s)"
                                    aria-label="Apellido(s)" value="${self.user.lastName}" oninput="CheckUserInfoChange('lastName', event.target, '${self.user.lastName}')">
                            </div>
                            <div class="input-group mb-3">
                                <span class="input-group-text">
                                    <span class="material-icons">
                                        email
                                    </span>
                                </span>
                                <input required
                                    :class="registro.email === registro.confirmarEmail ? 'valid-match' : 'invalid-match'"
                                    name="email" type="email" class="form-control" placeholder="Dirección E-mail"
                                    aria-label="Dirección E-mail" value="${self.user.email}" oninput="CheckUserInfoChange('email', event.target, '${self.user.email}')">
                            </div>
                            <div class="input-group mb-3">
                                <span class="input-group-text">
                                    <span class="material-icons">
                                        phone
                                    </span>
                                </span>
                                <input required name="phone" type="phone" class="form-control" placeholder="Teléfono"
                                    aria-label="Teléfono" value="${self.user.phone}" oninput="CheckUserInfoChange('phone', event.target, '${self.user.phone}')">
                                <span class="input-group-text">
                                    <span class="material-icons">
                                        cake
                                    </span>
                                </span>
                                <input required name="birth" type="date" class="form-control" placeholder="Cumpleaños"
                                    aria-label="Cumpleaños" value="${birth.year}-${birth.month}-${birth.day}" onchange="CheckUserInfoChange('birth', event.target, '${self.user.birth}')">
                            </div>
                            <h5 class="d-inline-block">Sexo:</h5>
                            <div class="form-check d-inline-block">
                                <input required class="form-check-input" type="radio" value="M" name="sex"
                                    id="sexo-femenino" ${ self.user.sex === 'M' ? 'checked' : '' } onchange="CheckUserInfoChange('sex', event.target, '${self.user.sex}')">
                                <label class="form-check-label" for="sexo-femenino">
                                    Mujer
                                </label>
                            </div>
                            <div class="form-check d-inline-block">
                                <input required class="form-check-input" type="radio" value="H" name="sex"
                                    id="sexo-masculino" ${ self.user.sex === 'H' ? 'checked' : '' } onchange="CheckUserInfoChange('sex', event.target, '${self.user.sex}')">
                                <label class="form-check-label" for="sexo-masculino">
                                    Hombre
                                </label>
                            </div>
                       </form>
                       <span class="form-invalid-match" id="last-error"></span>`,
                confirmButtonText: 'Guardar',
                cancelButtonText: 'Cancelar',
                iconColor: 'var(--secondary-color)',
                confirmButtonColor: 'var(--base-color)',
                allowEscapeKey: true,
                allowEnterKey: false,
                showCloseButton: true,
                showCancelButton: true,
                preConfirm: function() {
                    
                    Swal.showLoading();

                    var form = $('#edit-user-info-form')[0];
                    var userInfo = {};

                    var keys = Object.keys(window.__changes);
                    for (var i = 0; i < keys.length; i++) {
                        const hash = keys[i];
                        if(window.__changes[hash] === true) {
                            userInfo[hash] = form[hash].value;
                        }
                    }

                    return $.ajax({
                        url: '/users/profile',
                        type: 'PUT',
                        data: userInfo,
                        success: function(data, status, xhr) {
                            var keys = Object.keys(userInfo);
                            for (var i = 0; i < keys.length; i++) {
                                const hash = keys[i];
                                self.user[hash] = userInfo[hash];
                            }
                        },
                        error: function(xhr, status, error) {
                            //TBD - Manejo de excepciones con mensajes
                            if(xhr.responseJSON) {
                                $('#last-error').text(xhr.responseJSON.message || 'Ha ocurrido un error al actualizar los datos.');
                            } else {
                                $('#last-error').text('Ha ocurrido un error al actualizar los datos.');
                            }

                            Swal.hideLoading();
                        }
                    });
                }
                /*grow: 'fullscreen'*/
            });
        },
        SetActivityReaction(activity, reactionType) {
            var self = this;
            COMPONENTS.OpenLoader();
            $.ajax({
                url: `/activities/${activity.id}/${reactionType}`,
                type: 'PUT',
                data: {},
                success: function(data, status, xhr) {
                    activity.reactions = data;
                    self.$forceUpdate();
                    COMPONENTS.HideLoader();
                },
                error: function(xhr, status, error) {
                    //TBD - Manejo de excepciones con mensajes
                    COMPONENTS.HideLoader();
                    
                }
            });
        }
    },
    mounted() {
        var query = window.location.search;
        query = query.substring(1, query.length);
        var queryVars = query.split('&');
        for (var i = 0; i < queryVars.length; i++) {
            const variable = queryVars[i];
            var user = variable.split('=');
            if (user[0].toLocaleLowerCase() === 'user') {
                //console.log('El id del usuario es: ' + user[1]);
                if (!document.cookie.includes(`SSID=${user[1]}`)) {
                    this.idProfile = user[1];
                    this.isMyProfile = false;

                    var self = this;
                    $.ajax({
                        url: '/friends/' + this.idProfile,
                        type: 'GET',
                        success: function (data, status, xhr) {
                            self.isFriend = data;
                        }
                    });
                }
            }
        }

        this.ObtenerDatosUsuario();
        this.GetProfileActivities();
    }
});

$(document).on('keydown', function (event) {
    if (event.keyCode === 27) {
        $('#image-viewer').hide();
        $('#profile-picture-menu').hide();
        $('#cover-picture-menu').hide();
    }
});

$(document).on('mousedown', function (event) {
    if (event.target.id === 'profile-picture' || event.target.id === 'profile-picture-menu') {
        $('#cover-picture-menu').hide();
    } else if (event.target.id === 'cover-picture' || event.target.id === 'cover-picture-menu') {
        $('#profile-picture-menu').hide();
    } else {
        setTimeout(function () {
            $('#cover-picture-menu').hide();
            $('#profile-picture-menu').hide();
        }, 250);
    }

});

function CheckUserInfoChange(hash, element, originalValue) {
    var newValue = element.value;
    if(hash === 'birth') {
        newValue = new Date(newValue).toISOString();
    }

    if(newValue !== originalValue) {
        window.__changes[hash] = true;
    } else {
        window.__changes[hash] = false;
    }
}