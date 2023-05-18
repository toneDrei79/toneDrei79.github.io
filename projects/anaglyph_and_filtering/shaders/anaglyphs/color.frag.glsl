precision highp float;
uniform sampler2D image;

in vec2 vUv;
out vec4 fragColor;

void main(void) {
    vec2 uv = vUv.xy;

    mat3 leftmat = mat3(
        1., 0., 0.,
        0., 0., 0.,
        0., 0., 0.
    );
    mat3 rightmat = mat3(
        0., 0., 0.,
        0., 1., 0.,
        0., 0., 1.
    );
    
    vec3 left = texture2D(image, vec2(uv.x/2., uv.y)).rgb;
    vec3 right = texture2D(image, vec2(uv.x/2.+.5, uv.y)).rgb;
    fragColor = vec4(left*leftmat+right*rightmat, 1.);
}