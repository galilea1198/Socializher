var token = window.location.href.match(/resetToken=\w+/);
if(token) {
    token = token[0].replace('resetToken=', '');
    //comprobar que exista el token
} else {
    window.location.href = '/login'
}

if (document.cookie.includes('SSID=') && document.cookie.includes('SH_TK=')) {
    window.location.href = '/profile';
}


COMPONENTS.header();
COMPONENTS.footer();

var app = new Vue({
    el: '#app',
    data: {
        reset: {
            password: '',
            confirmPassword: ''
        }
    },
    methods: {
        ResetPassword: function(event) {
            event.preventDefault();
            if(this.reset.password !== this.reset.confirmPassword) {
                return;
            }

            //Petición de endpoint
            COMPONENTS.OpenLoader();
            var self = this;
            $.ajax({
                url: '/users/reset/password',
                type: 'PUT',
                data: {
                    resetToken: token,
                    password: self.reset.password
                },
                success: function(data, status, xhr) {
                    Swal.fire({
                        title: 'Contraseña cambiada',
                        text: 'Se ha cambiado la contraseña satisfactoriamente.',
                        icon: 'success',
                        confirmButtonText: 'OK',
                        iconColor: 'var(--secondary-color)',
                        confirmButtonColor: 'var(--base-color)',
                        showCloseButton: true,
                        allowEscapeKey: true,
                        allowEnterKey: true
                    }).then(function(result){
                        window.location.href = '/login'
                    });
                    
                    COMPONENTS.HideLoader();
                },
                error: function(xhr, status, error) {
                    //TBD dónde mostrar errores :'v
                    Swal.fire({
                        title: 'Oops!',
                        text: xhr.responseText,
                        icon: 'error',
                        confirmButtonText: 'OK',
                        iconColor: 'var(--base-color)',
                        confirmButtonColor: 'var(--base-color)'
                    });
                    COMPONENTS.HideLoader();
                }
            })
        }
    },
    mounted() {
        COMPONENTS.OpenLoader();
        $.ajax({
            url: `/users/reset/check/${token}`,
            type: 'GET',
            success: function(data, status, xhr) {
                if(data.valid !== true) {
                    window.location.href = '/login'
                }
                COMPONENTS.HideLoader();
            }
        })
    }
});