(function() {

/*
 * FFT版ガウスブラー
 *   fft2d_init
 *   fft2d_in
 *   fft2d_out
 *   fft2d_forward
 *   fft2d_inverse
 *   fft2d_blur
 */

var g_fft2d;

function fft2d_init() {
    if (!g_fft2d) {
        FFT.init(256);
        FrequencyFilter.init(256);
        g_fft2d = {
            re_r: new Float32Array(256*256),
            re_g: new Float32Array(256*256),
            re_b: new Float32Array(256*256),
            re_a: new Float32Array(256*256),
            im_r: new Float32Array(256*256),
            im_g: new Float32Array(256*256),
            im_b: new Float32Array(256*256),
            im_a: new Float32Array(256*256)
        };
    }
    return g_fft2d;
}

function fft2d_in(fft2d, data) {
    var re_r = fft2d.re_r;
    var re_g = fft2d.re_g;
    var re_b = fft2d.re_b;
    var re_a = fft2d.re_a;
    var im_r = fft2d.im_r;
    var im_g = fft2d.im_g;
    var im_b = fft2d.im_b;
    var im_a = fft2d.im_a;

    for (var y = 0; y < 256; ++y) {
        var i = y*256;
        for (var x = 0; x < 256; ++x) {
            var j = i+x;
            var k = j*4;
            var a = data[k+3] / 255;
            re_r[j] = data[k  ] * a;
            re_g[j] = data[k+1] * a;
            re_b[j] = data[k+2] * a;
            re_a[j] = data[k+3];
            im_r[j] = im_g[j] = im_b[j] = im_a[j] = 0;
        }
    }
}

function fft2d_out(fft2d, data) {
    var re_r = fft2d.re_r;
    var re_g = fft2d.re_g;
    var re_b = fft2d.re_b;
    var re_a = fft2d.re_a;

    for (var y = 0; y < 256; ++y) {
        var i = y*256;
        for (var x = 0; x < 256; ++x) {
            var j = i+x;
            var k = j*4;
            var a = re_a[j] / 255;
            if (a != 0) {
                data[k  ] = (re_r[j] / a + 0.5)|0;
                data[k+1] = (re_g[j] / a + 0.5)|0;
                data[k+2] = (re_b[j] / a + 0.5)|0;
                data[k+3] = (re_a[j] + 0.5)|0;
            } else {
                data[k] = data[k+1] = data[k+2] = data[k+3] = 0;
            }
        }
    }
}

function fft2d_forward(fft2d) {
    FFT.fft2d(fft2d.re_r, fft2d.im_r);
    FFT.fft2d(fft2d.re_g, fft2d.im_g);
    FFT.fft2d(fft2d.re_b, fft2d.im_b);
    FFT.fft2d(fft2d.re_a, fft2d.im_a);
    FrequencyFilter.swap(fft2d.re_r, fft2d.im_r);
    FrequencyFilter.swap(fft2d.re_g, fft2d.im_g);
    FrequencyFilter.swap(fft2d.re_b, fft2d.im_b);
    FrequencyFilter.swap(fft2d.re_a, fft2d.im_a);
}

function fft2d_inverse(fft2d) {
    FrequencyFilter.swap(fft2d.re_r, fft2d.im_r);
    FrequencyFilter.swap(fft2d.re_g, fft2d.im_g);
    FrequencyFilter.swap(fft2d.re_b, fft2d.im_b);
    FrequencyFilter.swap(fft2d.re_a, fft2d.im_a);
    FFT.ifft2d(fft2d.re_r, fft2d.im_r);
    FFT.ifft2d(fft2d.re_g, fft2d.im_g);
    FFT.ifft2d(fft2d.re_b, fft2d.im_b);
    FFT.ifft2d(fft2d.re_a, fft2d.im_a);
}

function fft2d_blur(fft2d, radius, w, h) {
    var re_r = fft2d.re_r;
    var re_g = fft2d.re_g;
    var re_b = fft2d.re_b;
    var re_a = fft2d.re_a;
    var im_r = fft2d.im_r;
    var im_g = fft2d.im_g;
    var im_b = fft2d.im_b;
    var im_a = fft2d.im_a;

    var s = 128/radius;
    var ss = s*s;

    var sx = w/256;
    var sy = h/256;

    for (var y = 0; y < 256; ++y) {
        var i = y*256;
        for (var x = 0; x < 256; ++x) {
            var j = i+x
            var k = j*4;
            var dx = (x-127.5)/sx;
            var dy = (y-127.5)/sy;
            var d = Math.sqrt(dx*dx + dy*dy);
            var g = Math.exp(-0.5*d*d/ss);
            re_r[j] *= g;
            re_g[j] *= g;
            re_b[j] *= g;
            re_a[j] *= g;
            im_r[j] *= g;
            im_g[j] *= g;
            im_b[j] *= g;
            im_a[j] *= g;
        }
    }
}

function gaussianblur_fft(imageData, radius, w, h) {
    var data = imageData.data;
    var fft2d = fft2d_init();

    fft2d_in(fft2d, data);
    fft2d_forward(fft2d);
    fft2d_blur(fft2d, radius, w, h);
    fft2d_inverse(fft2d);
    fft2d_out(fft2d, data);

    return imageData;
}

window.gaussianblur_fft = gaussianblur_fft;

})();
