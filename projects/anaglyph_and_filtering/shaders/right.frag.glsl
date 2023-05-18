precision highp float;
uniform sampler2D image;

in vec2 vUv;
out vec4 fragColor;

void main(void) {
    vec2 uv = vUv.xy;

    vec3 right = texture2D(image, vec2(uv.x/2.+.5, uv.y)).rgb;
    fragColor = vec4(right, 1.);
}