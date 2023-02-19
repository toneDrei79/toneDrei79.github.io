varying vec4 color;

void main() {
    float l = length(gl_PointCoord.xy - vec2(.5, .5));
    gl_FragColor.rgb = color.rgb;
    gl_FragColor.a = 1. - 2.*l/color.a;
}