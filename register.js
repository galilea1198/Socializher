if (document.cookie.includes('SSID=') && document.cookie.includes('SH_TK=')) {
    window.location.href = '/profile';
}

COMPONENTS.header();
COMPONENTS.footer();

var app = new Vue({
    el: '#app',
    data: {
        registro: {
            name: '',
            lastName: '',
            sex: '',
            email: '',
            password: '',
            phone: '',
            birth: '',
            confirmarEmail: '',
            confirmarPassword: ''
        }
    },
    methods: {
        RegistrarUsuario(event) {
            event.preventDefault();
            COMPONENTS.OpenLoader();

            var registroValido = Object.assign({}, this.registro);
            delete registroValido.confirmarEmail;
            delete registroValido.confirmarPassword;

            $.ajax({
                url: '/users/register',
                method: 'post',
                dataType: 'json',
                data: registroValido,
                error: function (xhr, status, error) {
                    Swal.fire({
                        title: 'Error en el registro',
                        text: xhr.responseText,
                        icon: 'error',
                        confirmButtonText: 'OK',
                        iconColor: 'var(--base-color)',
                        confirmButtonColor: 'var(--base-color)'
                    });
                    COMPONENTS.HideLoader();
                },
                success: function (data, status, xhr) {
                    COMPONENTS.HideLoader();
                    Swal.fire({
                        title: 'Registro exitoso',
                        text: 'Gracias por registrarte. Te hemos mandado un correo de confirmación.',
                        icon: 'success',
                        confirmButtonText: 'OK',
                        iconColor: 'var(--secondary-color)',
                        confirmButtonColor: 'var(--base-color)',
                        allowEscapeKey: false,
                        allowEnterKey: false
                    }).then(function (result) {
                        window.location.href = '/login';
                    });
                    //Promise -> then: OK, catch: ERROR, finally: Hacer al final
                }
            });
        }
    }
});

function RegisterUser(event) {

    event.preventDefault();
    //var form = document.getElementById('register-form');
    //var form = $('#register-form');
    var form = event.target;
    var elementos = form.elements;

    var registro = {
        name: elementos.name.value,
        lastName: elementos.lastName.value,
        sex: elementos.sex.value,
        email: elementos.email.value,
        password: elementos.password.value,
        phone: elementos.phone.value,
        birth: elementos.birth.value
    };

    if (elementos.confirmPassword.value !== registro.password || elementos.confirmEmail.value !== registro.email) {
        Swal.fire({
            title: 'El email/password debe coincidir',
            icon: 'error',
            confirmButtonText: 'OK',
            iconColor: 'var(--base-color)',
            confirmButtonColor: 'var(--base-color)'
        });

        return;
    }

    $.ajax({
        url: '/users/register',
        method: 'post',
        dataType: 'json',
        data: registro,
        error: function (xhr, status, error) {
            Swal.fire({
                title: 'Error en el registro',
                text: xhr.responseText,
                icon: 'error',
                confirmButtonText: 'OK',
                iconColor: 'var(--base-color)',
                confirmButtonColor: 'var(--base-color)'
            });
        },
        success: function (data, status, xhr) {
            Swal.fire({
                title: 'Registro exitoso',
                text: 'Gracias por registrarte. Te hemos mandado un correo de confirmación.',
                icon: 'success',
                confirmButtonText: 'OK',
                iconColor: 'var(--secondary-color)',
                confirmButtonColor: 'var(--base-color)',
                allowEscapeKey: false,
                allowEnterKey: false
            }).then(function (result) {
                window.location.href = '/login';
            });
            //Promise -> then: OK, catch: ERROR, finally: Hacer al final
        }
    });
}

/**
 * 
 * @param { { confirmador: String, event: {
 * target: any}} } comparador Es quien compara el valor de un input contra otro en tiempo real
 * @param {String} match Es input contra el que se compara. Es el original
 */
function ValidateMatch(comparador, match) {
    var form = $('#register-form');
    var event = comparador.event || {
        target: form[0].elements[comparador.confirmador]
    };

    var input = event.target;
    var inputOriginal = form[0].elements[match];

    if (input.value !== inputOriginal.value) {
        //No coincide el confirm password con el password
        //O el email con el confirm email
        $(input).css({
            border: '3px solid var(--base-color)'
        });
    } else {
        //Si coinciden :D
        $(input).css({
            border: '3px solid forestgreen'
        });
    }
}