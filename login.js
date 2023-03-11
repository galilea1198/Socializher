if (document.cookie.includes('SSID=') && document.cookie.includes('SH_TK=')) {
    window.location.href = '/profile';
}

COMPONENTS.header();
COMPONENTS.footer();

var app = new Vue({
    el: '#app',
    data: {
        login: {
            email: '',
            password: ''
        },
        valid: true
    },
    methods: {
        Login: function (event) {
            event.preventDefault();

            var self = this;

            COMPONENTS.OpenLoader();
            $.ajax({
                url: '/users/login',
                type: 'post',
                dataType: 'json',
                data: this.login,
                success: function (data, status, xhr) {
                    window.location.href = '/profile';
                },
                error: function (xhr, status, error) {
                    self.valid = false;
                    COMPONENTS.HideLoader();
                }
            });
        },
        RecuperarContraseña: function () {
            Swal.fire({
                title: 'Recuperar Contraseña',
                html: `<h4>Ingrese el correo de su cuenta</h4>
                       <br>
                       <form onsubmit="event.preventDefault();">
                            <div class="input-group">
                                <input id="restore-email" required type="email" 
                                       class="form-control" placeholder="user@email.com">
                            </div>
                       </form>`,
                icon: 'question',
                confirmButtonText: 'Recuperar',
                iconColor: 'var(--base-color)',
                confirmButtonColor: 'var(--base-color)',
                showCloseButton: true,
                allowEscapeKey: true,
                allowEnterKey: true
            }).then(function (result) {
                if (result.value) {
                    COMPONENTS.OpenLoader();
                    $.ajax({
                        url: '/users/reset/password',
                        type: 'POST',
                        data: {
                            email: $('#restore-email').val()
                        },
                        success: function (data, status, xhr) {
                            Swal.fire({
                                title: 'Recuperar Contraseña',
                                text: 'Si el correo está ligado a una cuenta, recibirá una solicitud de recuperación de contraseña.',
                                icon: 'info',
                                confirmButtonText: 'OK',
                                iconColor: 'var(--alternative-color)',
                                confirmButtonColor: 'var(--base-color)',
                                showCloseButton: true,
                                allowEscapeKey: true,
                                allowEnterKey: true
                            });
                            COMPONENTS.HideLoader();
                        }
                    });
                }
            });
        }
    }
});

function Login(event) {
    event.preventDefault();

    var form = event.target;
    var datosFormulario = form.elements;
    var login = {
        email: datosFormulario.email.value,
        password: datosFormulario.password.value
    };

    console.log(login);

    $.ajax({
        url: '/users/login',
        type: 'post',
        dataType: 'json',
        data: login,
        success: function (data, status, xhr) {
            window.location.href = '/profile';
        },
        error: function (xhr, status, error) {
            Swal.fire({
                title: 'Login Inválido',
                text: 'El usuario/contraseña son incorrectos',
                icon: 'error',
                confirmButtonText: 'OK',
                iconColor: 'var(--base-color)',
                confirmButtonColor: 'var(--base-color)'
            });
        }
    });
}